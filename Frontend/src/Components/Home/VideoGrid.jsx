import React from 'react';
import { useState } from 'react';
import styles from '../../styles/Home.module.css';
import { Link } from 'react-router-dom';

// Mock Data to simulate a database response

function thumbnailExtractor(url) {
  // Logic to extract thumbnail from video URL
  const thumbnail = url.split("\\")[2];
  console.log("thumbnail :",thumbnail);
  return `http://localhost:3000/thumbnails/${thumbnail}`;
}

const VideoGrid = ({videos}) => {
  return (
    <main className={styles.mainContent}>
      <div className={styles.videoGrid}>
        {videos.map((video) => (
          <Link to={video.id ? `/video/${video.id}` : `/video/${video._id}`} key={video.id} className={styles.videoLink}>
          <div key={video.id} className={styles.card}>
            {/* Thumbnail */}
            <div className={styles.thumbnailContainer}>
              <img 
                src={video.thumbnailPath ? thumbnailExtractor(video.thumbnailPath) : `https://picsum.photos/seed/${video.id}/640/360`} 
                alt="thumbnail" 
                className={styles.thumbnailImage} 
              />
              <span className={styles.duration}>{video.duration}</span>
            </div>

            {/* Meta Data */}
            <div className={styles.cardDetails}>
              <div className={styles.channelIcon}></div>
              <div className={styles.meta}>
                <h3 className={styles.videoTitle}>{video.title}</h3>
                <span className={styles.channelName}>{video.channel}</span>
                <span className={styles.views}>{video.views} • {video.time}</span>
              </div>
            </div>
          </div>
          </Link>
        ))}
      </div>
    </main>
  );
};

export default VideoGrid;