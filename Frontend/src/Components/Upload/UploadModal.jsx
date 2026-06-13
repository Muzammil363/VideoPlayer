import React, { useState, useRef, useEffect } from 'react';
import styles from '../../styles/UploadModal.module.css';
import { toast } from 'react-hot-toast';
import ConfirmDialog from '../Common/ConfirmDialog';

const GENRES = [
  'Education', 'Entertainment', 'Music', 'Gaming', 'Technology',
  'Sports', 'News', 'Comedy', 'Travel', 'Food', 'Lifestyle',
  'Science', 'Art', 'Documentary', 'Other'
];

const UploadModal = ({ isOpen, onClose, onUploadQueued }) => {
  // --- Form State ---
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);

  // --- Upload State ---
  // Status can be: 'idle', 'initializing', 'uploading', 'paused', 'processing'
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  // --- Refs for pausing/resuming without losing data ---
  const uploadStatusRef = useRef('idle'); // Mirrors state but readable inside async loops
  const chunkIndexRef = useRef(0);
  const uploadedPartsRef = useRef([]);
  const uploadContextRef = useRef(null); // Stores URLs and metadata safely
  const idempotencyKeyRef = useRef(null);
  const isStartingUploadRef = useRef(false);
  const isCompletingUploadRef = useRef(false);

  const getOrCreateIdempotencyKey = () => {
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    return idempotencyKeyRef.current;
  };

  // --- Safety Net: Prevent accidental tab closing ---
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (uploadStatusRef.current === 'uploading' || uploadStatusRef.current === 'paused') {
        e.preventDefault();
        e.returnValue = "You have an active upload. If you leave, your progress will be lost.";
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  if (!isOpen) return null;

  // Sync state and ref
  const setStatus = (status) => {
    uploadStatusRef.current = status;
    setUploadStatus(status);
  };

  const handleGenreToggle = (genre) => {
    if (uploadStatus !== 'idle') return; // Prevent changing during upload
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (type === 'video') setVideoFile(file);
    if (type === 'thumbnail') setThumbnailFile(file);
  };

  // --- Safe Close Handler ---
  const handleCloseRequest = () => {
    if (uploadStatus === 'uploading' || uploadStatus === 'paused') {
      setIsCancelConfirmOpen(true);
      return;
    }

    resetAndClose();
  };

  const resetAndClose = () => {
    // Reset state before closing
    setTitle('');
    setDescription('');
    setSelectedGenres([]);
    setVideoFile(null);
    setThumbnailFile(null);
    setStatus('idle');
    setProgress(0);
    setIsCancelConfirmOpen(false);
    idempotencyKeyRef.current = null;
    isStartingUploadRef.current = false;
    isCompletingUploadRef.current = false;
    onClose();
  };

  // --- STEP 1: Handshake & Initialize ---
  const startUpload = async () => {
    if (isStartingUploadRef.current || uploadStatus !== 'idle') return;

    if (!title || !videoFile || !thumbnailFile) {
      toast.error("Please fill in all required fields (Title, Video, Thumbnail)");
      return;
    }

    isStartingUploadRef.current = true;
    setStatus('initializing');
    setProgress(0);
    chunkIndexRef.current = 0;
    uploadedPartsRef.current = [];

    try {
      const idempotencyKey = getOrCreateIdempotencyKey();
      const CHUNK_SIZE = 8 * 1024 * 1024; // 8 MB
      const totalChunks = Math.max(1, Math.ceil(videoFile.size / CHUNK_SIZE));

      // 1. Get URLs
      const uploadUrlResponse = await fetch('http://localhost:3000/upload/upload-multipart-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          videoFilename: videoFile.name,
          videoContentType: videoFile.type || 'video/mp4',
          videoSize: videoFile.size,
          thumbnailFilename: thumbnailFile.name,
          thumbnailContentType: thumbnailFile.type || 'image/jpeg',
          thumbnailSize: thumbnailFile.size,
          chunkSize: CHUNK_SIZE,
          totalChunks,
          idempotencyKey
        }),
      });

      if (!uploadUrlResponse.ok) throw new Error(`Could not get upload URLs`);

      const uploadUrlData = await uploadUrlResponse.json();
      const { success, folderPath, video, thumbnail } = uploadUrlData;
      if (!success) throw new Error('Invalid upload URL response from server');

      if (uploadUrlData.completed) {
        onUploadQueued?.(uploadUrlData);
        resetAndClose();
        return;
      }

      // 2. Upload Thumbnail immediately (it's small)
      const thumbnailUploadResponse = await fetch(thumbnail.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': thumbnailFile.type || 'image/jpeg' },
        body: thumbnailFile,
      });

      if (!thumbnailUploadResponse.ok) throw new Error('Failed to upload thumbnail');

      // 3. Save context for the chunk loop
      uploadContextRef.current = {
        videoKey: video.s3Key,
        uploadId: video.uploadId,
        partUrls: video.partUrls,
        thumbnailKey: thumbnail.s3Key,
        folderPath,
        totalChunks,
        CHUNK_SIZE,
        idempotencyKey
      };

      // 4. Start the chunk loop
      setStatus('uploading');
      isStartingUploadRef.current = false;
      processChunks();

    } catch (error) {
      console.error('Initialization failed', error);
      toast.error(`Upload failed: ${error.message}`);
      setStatus('idle');
      idempotencyKeyRef.current = null;
      isStartingUploadRef.current = false;
    }
  };

  // --- STEP 2: The Resumable Chunk Loop ---
  const processChunks = async () => {
    const { partUrls, totalChunks, CHUNK_SIZE } = uploadContextRef.current;

    try {
      // Loop continues ONLY if status is 'uploading'
      while (chunkIndexRef.current < totalChunks && uploadStatusRef.current === 'uploading') {
        const i = chunkIndexRef.current;
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, videoFile.size);
        const chunk = videoFile.slice(start, end);

        const partResponse = await fetch(partUrls[i], {
          method: 'PUT',
          body: chunk,
        });

        if (!partResponse.ok) throw new Error(`Failed to upload chunk ${i + 1}`);
        for (let [key, value] of partResponse.headers.entries()) {
          console.log(`Exposed Header -> ${key}: ${value}`);
        }

        const etag = partResponse.headers.get('Etag');
        console.log("Etag: ", etag);

        if (!etag) {
          throw new Error("ETag is missing. Please ensure S3 CORS ExposeHeaders includes 'ETag'.");
        }

        uploadedPartsRef.current.push({
          PartNumber: i + 1,
          ETag: etag.replace(/"/g, '')
        });

        chunkIndexRef.current += 1;

        // Update Progress Bar
        const percentCompleted = Math.round((chunkIndexRef.current / totalChunks) * 100);
        setProgress(percentCompleted);
      }

      // If loop finished because we reached the end (not because of pause)
      if (chunkIndexRef.current === totalChunks && uploadStatusRef.current === 'uploading') {
        completeUpload();
      }

    } catch (error) {
      console.error('Chunk upload failed', error);
      toast.error(`Network error during upload: ${error.message}`);
      setStatus('paused'); // Auto-pause on error so user can resume
    }
  };

  // --- STEP 3: Complete & Stitch ---
  const completeUpload = async () => {
    if (isCompletingUploadRef.current) return;

    isCompletingUploadRef.current = true;
    setStatus('processing');
    const { videoKey, uploadId, folderPath, thumbnailKey, idempotencyKey } = uploadContextRef.current;

    try {
      const completeResponse = await fetch('http://localhost:3000/upload/complete-multipart-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          videoKey,
          uploadId,
          parts: uploadedPartsRef.current,
          title,
          description,
          genre: selectedGenres,
          folderPath,
          thumbnailPath: thumbnailKey,
          originalName: videoFile.name,
          mimeType: videoFile.type,
          size: videoFile.size,
          idempotencyKey
        })
      });

      const completionData = await completeResponse.json();
      if (!completeResponse.ok || !completionData.success) {
        throw new Error(completionData.error || completionData.message || `Failed to finalize upload`);
      }

      setTitle('');
      setDescription('');
      setSelectedGenres([]);
      setVideoFile(null);
      setThumbnailFile(null);
      setStatus('idle');
      setProgress(0);
      idempotencyKeyRef.current = null;
      isCompletingUploadRef.current = false;
      onUploadQueued?.(completionData);
      if (!onUploadQueued) {
        toast.success('Upload queued for processing. You can track it in My Channel.');
        onClose();
      }

    } catch (error) {
      console.error('Completion failed', error);
      toast.error(`Finalization failed: ${error.message}`);
      setStatus('paused');
      isCompletingUploadRef.current = false;
    }
  };

  // --- Controls ---
  const togglePauseResume = () => {
    if (uploadStatus === 'uploading') {
      setStatus('paused');
    } else if (uploadStatus === 'paused') {
      setStatus('uploading');
      processChunks(); // Restart loop
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>

        <div className={styles.header}>
          <h2 className={styles.title}>Upload Video</h2>
          <button
            className={styles.closeBtn}
            onClick={handleCloseRequest}
            disabled={uploadStatus === 'processing'} // Cannot cancel once stitching starts
          >
            &times;
          </button>
        </div>

        <div className={styles.body}>

          {/* 1. Video File Input */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Video File *</label>
            <div className={styles.fileUploadBox} onClick={() => uploadStatus === 'idle' && document.getElementById('videoInput').click()}>
              <span>{videoFile ? "Change Video" : "Select Video to Upload"}</span>
              <input
                id="videoInput" type="file" accept="video/*" className={styles.fileInput}
                onChange={(e) => handleFileChange(e, 'video')}
                disabled={uploadStatus !== 'idle'}
              />
              {videoFile && <div className={styles.fileName}>Selected: {videoFile.name}</div>}
            </div>
          </div>

          {/* 2. Thumbnail Input */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Thumbnail Image *</label>
            <div className={styles.fileUploadBox} onClick={() => uploadStatus === 'idle' && document.getElementById('thumbInput').click()}>
              <span>{thumbnailFile ? "Change Thumbnail" : "Select Thumbnail"}</span>
              <input
                id="thumbInput" type="file" accept="image/*" className={styles.fileInput}
                onChange={(e) => handleFileChange(e, 'thumbnail')}
                disabled={uploadStatus !== 'idle'}
              />
              {thumbnailFile && <div className={styles.fileName}>Selected: {thumbnailFile.name}</div>}
            </div>
          </div>

          {/* 3. Title */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Title (Required)</label>
            <input
              type="text" className={styles.input}
              placeholder="Add a title that describes your video"
              value={title} onChange={(e) => setTitle(e.target.value)}
              disabled={uploadStatus !== 'idle'}
            />
          </div>

          {/* 4. Description */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Description</label>
            <textarea
              className={styles.textarea}
              placeholder="Tell viewers about your video"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={uploadStatus !== 'idle'}
            ></textarea>
          </div>

          {/* 5. Genre Multi-Select */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Genre (Select multiple)</label>
            <div className={styles.genreContainer}>
              {GENRES.map((genre) => (
                <button
                  key={genre}
                  type="button"
                  disabled={uploadStatus !== 'idle'}
                  className={`${styles.genreChip} ${selectedGenres.includes(genre) ? styles.genreChipActive : ''}`}
                  onClick={() => handleGenreToggle(genre)}
                  style={{ opacity: uploadStatus !== 'idle' ? 0.7 : 1, cursor: uploadStatus !== 'idle' ? 'not-allowed' : 'pointer' }}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* --- Progress Bar Section --- */}
        {uploadStatus !== 'idle' && (
          <div className={styles.progressSection}>
            <div className={styles.progressInfo}>
              <span>
                {uploadStatus === 'initializing' && "Preparing..."}
                {uploadStatus === 'uploading' && "Uploading..."}
                {uploadStatus === 'paused' && "Paused"}
                {uploadStatus === 'processing' && "Stitching and Finalizing..."}
              </span>
              <span>{progress}%</span>
            </div>
            <div className={styles.progressBarBg}>
              <div
                className={`${styles.progressFill} ${uploadStatus === 'paused' ? styles.pausedFill : ''}`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* --- Dynamic Footer Buttons --- */}
        <div className={styles.footer}>

          {uploadStatus === 'idle' && (
            <>
              <button className={styles.cancelBtn} onClick={handleCloseRequest}>Cancel</button>
              <button className={styles.uploadBtn} onClick={startUpload} disabled={isStartingUploadRef.current}>Upload</button>
            </>
          )}

          {(uploadStatus === 'uploading' || uploadStatus === 'paused') && (
            <button
              className={uploadStatus === 'uploading' ? styles.pauseBtn : styles.resumeBtn}
              onClick={togglePauseResume}
            >
              {uploadStatus === 'uploading' ? "Pause Upload" : "Resume Upload"}
            </button>
          )}

          {uploadStatus === 'processing' && (
            <button className={styles.uploadBtn} disabled>Processing...</button>
          )}

        </div>

      </div>

      <ConfirmDialog
        isOpen={isCancelConfirmOpen}
        title="Cancel upload?"
        message="Upload is in progress. If you close now, your current upload progress will be lost."
        confirmLabel="Cancel Upload"
        danger
        onCancel={() => setIsCancelConfirmOpen(false)}
        onConfirm={resetAndClose}
      />
    </div>
  );
};

export default UploadModal;
