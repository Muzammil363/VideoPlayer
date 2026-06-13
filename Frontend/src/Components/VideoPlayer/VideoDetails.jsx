import React from 'react';
import styles from '../../styles/VideoPlayer.module.css';
import { formatViews, getChannelAvatarColor, getChannelInitial, getChannelName } from '../../Utils/videoDisplay';

const VideoDetails = ({
  video,
  videoId,
  isLiked,
  isSaved,
  onLikeStateChange,
  onSavedStateChange,
}) => {
  const channelName = getChannelName(video);
  const channelInitial = getChannelInitial(video);
  const channelAvatarColor = getChannelAvatarColor(video);
  const likes = video?.likesCount || 0;

  async function handleWatchLater() {
    const response = await fetch(`http://localhost:3000/save/watch-later/${videoId}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
      },
    });

    if (response.ok) {
      onSavedStateChange(true);
      return;
    }

    if (response.status === 400) {
      onSavedStateChange(false);
    }
  }

  async function likeHandler() {
    const response = await fetch(`http://localhost:3000/save/like/${videoId}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
      },
    });

    if (response.ok) {
      onLikeStateChange({ liked: true, likesCount: likes + 1 });
      return;
    }

    if (response.status === 400) {
      onLikeStateChange({ liked: false, likesCount: Math.max(0, likes - 1) });
    }
  }

  return (
    <div className={styles.infoContainer}>
      <h1 className={styles.videoTitle}>{video.title}</h1>
      <div className={styles.videoStats}>{formatViews(video.views || 0)}</div>

      <div className={styles.actionsRow}>
        <div className={styles.channelInfo}>
          <div className={styles.avatar} style={{ backgroundColor: channelAvatarColor }}>
            {channelInitial}
          </div>
          <div className={styles.channelText}>
            <span className={styles.channelName}>{channelName}</span>
          </div>
          <button className={`${styles.pillBtn} ${styles.subscribeBtn}`}>
            Subscribe
          </button>
        </div>

        <div className={styles.actionButtons}>
          <button className={styles.pillBtn} onClick={likeHandler}>
            {isLiked ? (
              <svg fill="currentColor" height="24" viewBox="0 0 24 24" width="24"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.15L14.44 1 6.21 9.23C5.74 9.7 5.4 10.32 5.4 11v9c0 1.1.9 2 2 2h9.83c.88 0 1.63-.52 1.94-1.29l3.47-8.11c.08-.23.15-.47.15-.71v-1.9z"/></svg>
            ) : (
              <svg fill="currentColor" height="24" viewBox="0 0 24 24" width="24"><path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v1.91l.01.01L1 14c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.15l.9 1.16L19.56 13l2.44-6H15z" opacity=".3"/></svg>
            )}
            {likes} | Dislike
          </button>

          <button className={styles.pillBtn} onClick={handleWatchLater}>
            <svg fill="currentColor" height="24" viewBox="0 0 24 24" width="24"><path d="M14 10H2v2h12v-2zm0-4H2v2h12V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM2 16h8v-2H2v2z"/></svg>
            {isSaved ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>

      <div className={styles.descriptionBox}>
        {video.description || 'No description available.'}
      </div>
    </div>
  );
};

export default VideoDetails;
