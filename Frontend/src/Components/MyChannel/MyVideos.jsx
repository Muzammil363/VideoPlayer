import React, { useState } from 'react';
import styles from '../../styles/MyChannel.module.css';

// Mock Data for User's Uploaded Videos
const myUploads = [
  { id: 1, title: "React Tutorial for Beginners", views: "10K", time: "1 day ago" },
  { id: 2, title: "How to use CSS Grid", views: "5K", time: "2 days ago" },
  { id: 3, title: "Node.js API Authentication", views: "25K", time: "1 week ago" },
  { id: 4, title: "My Workspace Tour 2025", views: "100K", time: "2 weeks ago" },
  { id: 5, title: "Understanding Redux Toolkit", views: "8K", time: "3 weeks ago" },
  { id: 6, title: "JavaScript ES6 Features", views: "50K", time: "1 month ago" },
];

const MyVideos = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // FILTER LOGIC: Filter videos where title includes the search term (case insensitive)
  const filteredVideos = myUploads.filter((video) =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.videosSection}>
      {/* Filter Bar */}
      <div className={styles.filterContainer}>
        <div className={styles.sectionTitle}>My Videos</div>
        <input 
          type="text" 
          placeholder="Filter your videos..." 
          className={styles.filterInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Video Grid */}
      <div className={styles.videoGrid}>
        {filteredVideos.length > 0 ? (
          filteredVideos.map((video) => (
            <div key={video.id} className={styles.card}>
              <div className={styles.thumbnailContainer}>
                {/* Random image based on ID */}
                <img 
                  src={`https://picsum.photos/seed/${video.id + 100}/640/360`} 
                  alt="thumbnail" 
                  className={styles.thumbnailImage} 
                />
              </div>
              <h3 className={styles.videoTitle}>{video.title}</h3>
              <span className={styles.videoMeta}>{video.views} views • {video.time}</span>
            </div>
          ))
        ) : (
          <p style={{color: '#606060'}}>No videos found matching "{searchTerm}"</p>
        )}
      </div>
    </div>
  );
};

export default MyVideos;