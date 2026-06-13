import React, { useState } from 'react';
import styles from '../../styles/MyChannel.module.css';
import { formatRelativeTime, formatViews } from '../../Utils/videoDisplay';

const STATUS_LABELS = {
  queued: 'Queued',
  processing: 'Processing',
  failed: 'Failed',
  ready: 'Ready',
};

function thumbnailExtractor(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;

  const normalized = url.replaceAll('\\', '/');
  const thumbnail = normalized.split('/').pop();
  return thumbnail ? `http://localhost:3000/thumbnails/${thumbnail}` : null;
}

const MyVideos = ({ myUploads = [], onDeleteVideo, isDeletingVideo }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVideos = myUploads.filter((video) =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.videosSection}>
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

      <div className={styles.videoGrid}>
        {filteredVideos.length > 0 ? (
          filteredVideos.map((video) => {
            const videoId = video._id || video.id;
            const uploadTime = formatRelativeTime(video.uploadTime, video.time);
            const status = video.status || 'ready';
            const isReady = status === 'ready';
            const statusLabel = STATUS_LABELS[status] || STATUS_LABELS.ready;

            return (
              <div
                key={videoId}
                className={`${styles.card} ${!isReady ? styles.cardNotReady : ''}`}
                aria-disabled={!isReady}
              >
                <div className={styles.thumbnailContainer}>
                  <img
                    src={video.thumbnailUrl || thumbnailExtractor(video.thumbnailPath) || `https://picsum.photos/seed/${videoId}/640/360`}
                    alt={video.title || 'Video thumbnail'}
                    className={styles.thumbnailImage}
                  />
                  {status !== 'ready' && (
                    <div className={`${styles.statusBadge} ${styles[`status_${status}`] || ''}`}>
                      {statusLabel}
                    </div>
                  )}
                  {!isReady && (
                    <div className={styles.processingOverlay}>
                      <span>
                        {status === 'failed'
                          ? 'Processing failed'
                          : status === 'processing'
                            ? 'Processing video'
                            : 'Waiting in queue'}
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={() => onDeleteVideo(videoId)}
                    disabled={isDeletingVideo}
                  >
                    Delete
                  </button>
                </div>
                <h3 className={styles.videoTitle}>{video.title}</h3>
                <span className={styles.videoMeta}>
                  {statusLabel}{isReady ? ` • ${formatViews(video.views)}` : ''}{uploadTime ? ` • ${uploadTime}` : ''}
                </span>
              </div>
            );
          })
        ) : (
          <p style={{ color: '#606060' }}>No videos found matching "{searchTerm}"</p>
        )}
      </div>
    </div>
  );
};

export default MyVideos;
