import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../../styles/Home.module.css';
import {
  formatRelativeTime,
  formatViews,
  getChannelAvatarColor,
  getChannelInitial,
  getChannelName,
  getVideoId,
} from '../../Utils/videoDisplay';

const VideoGrid = ({ videos = [] }) => {
  return (
    <main className={styles.mainContent}>
      <div className={styles.videoGrid}>
        {videos.map((video) => {
          const videoId = getVideoId(video);
          const channelName = getChannelName(video);
          const channelInitial = getChannelInitial(video);
          const channelAvatarColor = getChannelAvatarColor(video);
          const uploadTime = formatRelativeTime(video.uploadTime, video.time);

          return (
            <Link to={`/video/${videoId}`} key={videoId} className={styles.videoLink}>
              <div className={styles.card}>
                <div className={styles.thumbnailContainer}>
                  <img
                    src={video.thumbnailUrl || video.thumbnailPath || `https://picsum.photos/seed/${videoId}/640/360`}
                    alt={video.title || 'Video thumbnail'}
                    className={styles.thumbnailImage}
                  />
                  {video.duration ? <span className={styles.duration}>{video.duration}</span> : null}
                </div>

                <div className={styles.cardDetails}>
                  <div className={styles.channelIcon} style={{ backgroundColor: channelAvatarColor }}>
                    {channelInitial}
                  </div>
                  <div className={styles.meta}>
                    <h3 className={styles.videoTitle}>{video.title}</h3>
                    <span className={styles.channelName}>{channelName}</span>
                    <span className={styles.views}>
                      {formatViews(video.views)}{uploadTime ? ` • ${uploadTime}` : ''}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
};

export default VideoGrid;
