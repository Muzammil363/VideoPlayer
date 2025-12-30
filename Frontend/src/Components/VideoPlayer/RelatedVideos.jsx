import React from 'react';
import styles from '../../styles/VideoPlayer.module.css';

const mockRelated = [
  { id: 101, title: "Next.js 14 Full Course 2024", channel: "Web Dev Simplified", views: "300K" },
  { id: 102, title: "10 CSS One-Liners that will save your life", channel: "FireShip", views: "1.2M" },
  { id: 103, title: "Learn Docker in 1 Hour", channel: "Programming with Mosh", views: "500K" },
  { id: 104, title: "Why I stopped using Redux", channel: "Tech Lead", views: "45K" },
  { id: 105, title: "Building a Chat App with Socket.io", channel: "PedroTech", views: "100K" },
  { id: 106, title: "System Design for Beginners", channel: "NeetCode", views: "2M" },
  { id: 107, title: "React Hooks Explained", channel: "Ben Awad", views: "800K" },
];

const RelatedVideos = () => {
  return (
    <div className={styles.relatedContainer}>
      <h3 style={{fontSize:'1rem', marginBottom:'10px'}}>You might like</h3>
      
      {mockRelated.map((video) => (
        <div key={video.id} className={styles.relatedCard}>
          <img 
            src={`https://picsum.photos/seed/${video.id}/320/180`} 
            className={styles.relatedThumb} 
            alt="thumb" 
          />
          <div className={styles.relatedDetails}>
            <span className={styles.relatedTitle}>{video.title}</span>
            <span className={styles.relatedMeta}>{video.channel}</span>
            <span className={styles.relatedMeta}>{video.views} views • 2 days ago</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RelatedVideos;