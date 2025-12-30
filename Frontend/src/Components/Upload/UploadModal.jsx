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
      // --- 1. Prepare Form Data ---
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      
      // REQUIREMENT: Parse array as JSON string
      formData.append('genre', JSON.stringify(selectedGenres));
      
      // Files
      formData.append('video', videoFile);      // Backend will read originalName, mimeType, size
      formData.append('thumbnail', thumbnailFile); 

      // Note: 'uploadedBy' is usually handled by the backend checking the JWT Token
      // 'likesCount' defaults to 0 on backend
      // 'm3u8Path' and 'folderPath' are generated on backend after processing

      console.log("Submitting FormData...");
      
      // --- 2. API Call (Commented out for now) ---
      // const response = await fetch('http://localhost:5000/api/upload', {
      //   method: 'POST',
      //   body: formData, // No Content-Type header needed, browser adds it for FormData
      // });
      
      // Simulate delay
      setTimeout(() => {
        alert("Upload functionality would happen here!");
        setIsUploading(false);
        onClose(); // Close modal on success
      }, 1500);

    } catch (error) {
      console.error("Upload failed", error);
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