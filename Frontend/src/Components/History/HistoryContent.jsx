import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from '../../styles/History.module.css';
import { formatRelativeTime, formatViews, getChannelName } from '../../Utils/videoDisplay';
import ConfirmDialog from '../Common/ConfirmDialog';

const HistoryContent = () => {
  const [historyVideos, setHistoryVideos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  const formatHistoryVideos = (apiResponse = []) => {
    return apiResponse
      .map((item) => item.videoId)
      .filter(Boolean)
      .map((video) => ({
        id: video._id,
        title: video.title,
        channel: getChannelName(video),
        views: formatViews(video.views),
        time: formatRelativeTime(video.uploadTime),
        thumbnail: video.thumbnailUrl || video.thumbnailPath || `https://picsum.photos/seed/${video._id}/640/360`,
      }));
  };

  useEffect(() => {
    async function loadHistory() {
      const response = await fetch('http://localhost:3000/user/history', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setHistoryVideos(formatHistoryVideos(data.data));
      }
    }

    loadHistory();
  }, []);

  const filteredVideos = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return historyVideos;

    return historyVideos.filter((video) => (
      video.title.toLowerCase().includes(query) ||
      video.channel.toLowerCase().includes(query)
    ));
  }, [historyVideos, searchTerm]);

  const handleClearHistory = () => {
    setIsClearConfirmOpen(true);
  };

  const confirmClearHistory = () => {
    setHistoryVideos([]);
    setSearchTerm('');
    setIsClearConfirmOpen(false);
  };

  const emptyMessage = historyVideos.length === 0
    ? 'Your watch history is empty.'
    : `No history matches "${searchTerm}".`;

  return (
    <div className={styles.contentArea}>
      <div className={styles.historyHeader}>
        <h1 className={styles.title}>Watch History</h1>

        <div className={styles.controls}>
          <input
            type="text"
            placeholder="Search watch history..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <button
            className={styles.clearBtn}
            onClick={handleClearHistory}
            disabled={historyVideos.length === 0}
          >
            <svg fill="currentColor" height="18" viewBox="0 0 24 24" width="18">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path>
            </svg>
            Clear History
          </button>
        </div>
      </div>

      {filteredVideos.length > 0 ? (
        <div className={styles.videoGrid}>
          {filteredVideos.map((video) => (
            <Link to={`/video/${video.id}`} key={video.id} className={styles.card}>
              <div className={styles.thumbnailContainer}>
                <img
                  src={video.thumbnail}
                  alt={video.title || 'Video thumbnail'}
                  className={styles.thumbnailImage}
                />
                <div className={styles.progressContainer}>
                  <div className={styles.progressBar}></div>
                </div>
              </div>

              <h3 className={styles.videoTitle}>{video.title}</h3>
              <div className={styles.videoMeta}>
                <span>{video.channel}</span>
                <span>{video.views}{video.time ? ` • ${video.time}` : ''}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className={styles.emptyMessage}>{emptyMessage}</div>
      )}

      <ConfirmDialog
        isOpen={isClearConfirmOpen}
        title="Clear watch history?"
        message="This clears the history shown on this device for now."
        confirmLabel="Clear"
        danger
        onCancel={() => setIsClearConfirmOpen(false)}
        onConfirm={confirmClearHistory}
      />
    </div>
  );
};

export default HistoryContent;
