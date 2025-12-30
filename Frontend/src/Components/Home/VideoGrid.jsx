import React from 'react';
import styles from '../../styles/Home.module.css';
import { Link } from 'react-router-dom';

// Mock Data to simulate a database response
const mockVideos = [
  { id: 1, title: "Building a YouTube Clone in React", channel: "Code Master", views: "120K views", time: "2 days ago", duration: "12:05" },
  { id: 2, title: "Top 10 CSS Tricks for 2025", channel: "Design Pro", views: "54K views", time: "5 hours ago", duration: "08:30" },
  { id: 3, title: "Learn Backend Development", channel: "Dev Guide", views: "1M views", time: "1 year ago", duration: "45:00" },
  { id: 4, title: "Music Mix 2025 for Coding", channel: "Lofi Beats", views: "300K views", time: "1 week ago", duration: "1:20:00" },
  { id: 5, title: "React Router v7 Tutorial", channel: "Frontend Daily", views: "10K views", time: "3 hours ago", duration: "15:45" },
  { id: 6, title: "Understanding System Design", channel: "Tech Architect", views: "85K views", time: "1 month ago", duration: "22:10" },
  { id: 7, title: "Why I switched to Linux", channel: "OS Explorer", views: "500K views", time: "3 weeks ago", duration: "10:05" },
  { id: 8, title: "Gaming Setup Tour", channel: "Gamer Life", views: "2M views", time: "2 months ago", duration: "14:20" },
];

const VideoGrid = () => {
  return (
    <main className={styles.mainContent}>
      <div className={styles.videoGrid}>
        {mockVideos.map((video) => (
          <Link to={`/video/${video.id}`} key={video.id} className={styles.videoLink}>
          <div key={video.id} className={styles.card}>
            {/* Thumbnail */}
            <div className={styles.thumbnailContainer}>
              <img 
                src={`https://picsum.photos/seed/${video.id}/640/360`} 
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