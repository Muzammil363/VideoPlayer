import React from 'react';
import styles from '../../styles/Library.module.css';

const LibrarySection = ({ title, icon, videos }) => {
  return (
    <section>
      {/* Header: Icon + Title + Count */}
      <div className={styles.sectionHeader}>
        <div className={styles.sectionIcon}>
          {icon}
        </div>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <span className={styles.videoCount}>{videos.length} videos</span>
      </div>

      {/* Content: Grid or Empty State */}
      {videos.length > 0 ? (
        <div className={styles.videoGrid}>
          {videos.map((video) => (
            <div key={video.id} className={styles.card}>
              <div className={styles.thumbnailContainer}>
                <img 
                  src={`https://picsum.photos/seed/${video.id + 500}/640/360`} 
                  alt="thumbnail" 
                  className={styles.thumbnailImage} 
                />
                <span className={styles.duration}>{video.duration}</span>
              </div>
              
              <h3 className={styles.videoTitle}>{video.title}</h3>
              <div className={styles.videoMeta}>
                <span>{video.channel}</span>
                <span>{video.views} • {video.time}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyMessage}>No videos in this list yet.</div>
      )}
    </section>
  );
};

export default LibrarySection;