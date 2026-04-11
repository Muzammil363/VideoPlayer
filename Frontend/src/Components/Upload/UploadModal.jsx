import React, { useState } from 'react';
import styles from '../../styles/UploadModal.module.css';

const GENRES = [
  'Education', 'Entertainment', 'Music', 'Gaming', 'Technology',
  'Sports', 'News', 'Comedy', 'Travel', 'Food', 'Lifestyle',
  'Science', 'Art', 'Documentary', 'Other'
];

const UploadModal = ({ isOpen, onClose }) => {
  // --- Form State ---
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Return null if modal shouldn't be shown
  if (!isOpen) return null;

  // --- Handlers ---

  const handleGenreToggle = (genre) => {
    if (selectedGenres.includes(genre)) {
      // Remove if already selected
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    } else {
      // Add if not selected
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (type === 'video') setVideoFile(file);
    if (type === 'thumbnail') setThumbnailFile(file);
  };

  const handleSubmit = async () => {
    if (!title || !videoFile || !thumbnailFile) {
      alert("Please fill in all required fields (Title, Video, Thumbnail)");
      return;
    }

    setIsUploading(true);

    try {
      // --- STEP 1: Request presigned upload URL ---
      const uploadUrlResponse = await fetch('http://localhost:3000/upload/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies if using cookie-based auth
        body: JSON.stringify({
          // 1. Send metadata for BOTH files
          videoFilename: videoFile.name,
          videoContentType: videoFile.type || 'video/mp4',
          thumbnailFilename: thumbnailFile.name,
          thumbnailContentType: thumbnailFile.type || 'image/jpeg',
        }),
      });

      if (!uploadUrlResponse.ok) {
        const errorBody = await uploadUrlResponse.text();
        throw new Error(`Could not get upload URLs: ${errorBody}`);
      }

      const { success, folderPath, video, thumbnail } = await uploadUrlResponse.json();

      if (!success || !video?.uploadUrl || !thumbnail?.uploadUrl || !folderPath) {
        throw new Error('Invalid upload URL response from server');
      }

      const videoKey = video.s3Key;
      const videoURL = video.uploadUrl;

      const thumbnailKey = thumbnail.s3Key;
      const thumbnailURL = thumbnail.uploadUrl;

      console.log("thumbnail URL: ",thumbnailURL);
      console.log("videoURL: ",videoURL);

      // --- STEP 2: Upload video directly to S3 ---
      const s3UploadResponse = await fetch(videoURL, {
        method: 'PUT',
        headers: {
          'Content-Type': videoFile.type || 'video/mp4',
        },
        body: videoFile,
      });

      if (!s3UploadResponse.ok) {
        throw new Error('Failed to upload video directly to S3');
      }

      const thumbnailUploadResponse = await fetch(thumbnailURL, {
        method: 'PUT',
        headers: {
          'Content-Type': thumbnailFile.type || 'image/jpeg',
        },
        body: thumbnailFile,
      });

      if (!thumbnailUploadResponse.ok) {
        throw new Error('Failed to upload thumbnail directly to S3');
      }

      // --- STEP 3: Tell backend to process the uploaded video ---
      const processResponse = await fetch('http://localhost:3000/upload/process-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies if using cookie-based auth
        // We pack all the metadata and the S3 keys to match your Mongoose Schema
        body: JSON.stringify({
          title,
          description,
          genre: selectedGenres,
          folderPath: folderPath,
          videoKey: videoKey,           // Passed to worker to find the raw video
          thumbnailPath: thumbnailKey,  // Saved directly to DB
          originalName: videoFile.name,
          mimeType: videoFile.type,
          size: videoFile.size
        }),
      });

      if (!processResponse.ok) {
        const errorBody = await processResponse.text();
        throw new Error(`Processing request failed: ${errorBody}`);
      }

      const processData = await processResponse.json();
      console.log('processData:', processData);
      alert('Video upload queued successfully. Processing has started.');

      // Reset the form after successful start
      setTitle('');
      setDescription('');
      setSelectedGenres([]);
      setVideoFile(null);
      setThumbnailFile(null);
      onClose();
    } catch (error) {
      console.error('Upload failed', error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>

        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>Upload Video</h2>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        {/* Scrollable Body */}
        <div className={styles.body}>

          {/* 1. Video File Input */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Video File *</label>
            <div className={styles.fileUploadBox} onClick={() => document.getElementById('videoInput').click()}>
              <span>{videoFile ? "Change Video" : "Select Video to Upload"}</span>
              <input
                id="videoInput"
                type="file"
                accept="video/*"
                className={styles.fileInput}
                onChange={(e) => handleFileChange(e, 'video')}
              />
              {videoFile && <div className={styles.fileName}>Selected: {videoFile.name}</div>}
            </div>
          </div>

          {/* 2. Thumbnail Input */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Thumbnail Image *</label>
            <div className={styles.fileUploadBox} onClick={() => document.getElementById('thumbInput').click()}>
              <span>{thumbnailFile ? "Change Thumbnail" : "Select Thumbnail"}</span>
              <input
                id="thumbInput"
                type="file"
                accept="image/*"
                className={styles.fileInput}
                onChange={(e) => handleFileChange(e, 'thumbnail')}
              />
              {thumbnailFile && <div className={styles.fileName}>Selected: {thumbnailFile.name}</div>}
            </div>
          </div>

          {/* 3. Title */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Title (Required)</label>
            <input
              type="text"
              className={styles.input}
              placeholder="Add a title that describes your video"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
                  className={`${styles.genreChip} ${selectedGenres.includes(genre) ? styles.genreChipActive : ''}`}
                  onClick={() => handleGenreToggle(genre)}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button
            className={styles.uploadBtn}
            onClick={handleSubmit}
            disabled={isUploading}
          >
            {isUploading ? "Uploading..." : "Upload"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default UploadModal;