import React, { useState, useEffect } from 'react';
import styles from '../../styles/History.module.css';
import { formatDistanceToNowStrict, parseISO } from 'date-fns';

// Mock Data: Recently watched videos
const initialHistory = [
  { id: 1, title: "React Router v7 Explained", channel: "Frontend Daily", views: "15K", time: "2 hours ago" },
  { id: 2, title: "100 Days of Code - Day 45", channel: "Dev Journey", views: "2K", time: "Yesterday" },
  { id: 3, title: "Building a YouTube Clone", channel: "Code Master", views: "120K", time: "2 days ago" },
  { id: 4, title: "Calming Rain Sounds", channel: "Nature Relax", views: "5M", time: "3 days ago" },
  { id: 5, title: "System Design Interview Prep", channel: "Tech Lead", views: "500K", time: "1 week ago" },
  { id: 6, title: "Why Linux is Better", channel: "OS Explorer", views: "85K", time: "2 weeks ago" },
];

const HistoryContent = () => {
  const [historyVideos, setHistoryVideos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  function renderVideos(apiResponse, type) {
    const formattedVideos = apiResponse.map((item) => {
      const video = item.videoId;

      const rawPath = video.thumbnailPath || "";
      const thumbnail = rawPath.split("\\")[2];
      console.log(thumbnail);

      return {
        id: video._id,
        title: video.title,
        channel: video.channel?.name || "Unknown Channel",
        views: video.views >= 1000 ? `${(video.views / 1000).toFixed(1)}K` : video.views.toString(),
        time: formatRelativeTime(video.uploadTime),
        duration: video.duration || "00:00",
        thumbnail: `http://localhost:3000/thumbnails/${thumbnail}`
      };
    });
    setHistoryVideos(formattedVideos);
  }

  // Helper to handle the "time ago" logic UPDATE THIS LATER
  function formatRelativeTime(dateString) {
    return formatDistanceToNowStrict(parseISO(dateString), { addSuffix: true })
  }
  /*
     API call to load history
   */
  useEffect(() => {
    async function loadHistory() {
      let response = await fetch("http://localhost:3000/user/history", {
        method: 'GET',
        credentials: "include",
        headers: {
          "content-type": "application/json"
        }
      })

      let data = await response.json();
      if (data.success) {
        renderVideos(data.data);
      }
    }
    loadHistory();
  }, []);

  // 1. Filter Logic (Search)
  const filteredVideos = historyVideos.filter(video =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 2. Clear History Logic
  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear your entire watch history?")) {
      setHistoryVideos([]); // Empty the state
    }
  };

  return (
    <div className={styles.contentArea}>

      {/* Header with Search and Clear Button */}
      <div className={styles.historyHeader}>
        <h1 className={styles.title}>Watch History</h1>

        <div className={styles.controls}>
          <input
            type="text"
            placeholder="Search watch history..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={historyVideos.length === 0} // Disable if empty
          />

          <button
            className={styles.clearBtn}
            onClick={handleClearHistory}
            disabled={historyVideos.length === 0}
          >
            {/* Trash Icon */}
            <svg fill="currentColor" height="18" viewBox="0 0 24 24" width="18">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path>
            </svg>
            Clear History
          </button>
        </div>
      </div>

      {/* Video Grid or Empty State */}
      {historyVideos.length === 0 ? (
        <div className={styles.emptyMessage}>
          Your watch history is empty.
        </div>
      ) : filteredVideos.length > 0 ? (
        <div className={styles.videoGrid}>
          {filteredVideos.map((video) => (
            <div key={video.id} className={styles.card}>
              <div className={styles.thumbnailContainer}>
                <img
                  src={video.thumbnail}
                  alt="thumbnail"
                  className={styles.thumbnailImage}
                />
                {/* Red Progress Bar at bottom of thumbnail */}
                <div className={styles.progressContainer}>
                  {/* Random width for effect */}
                  <div className={styles.progressBar} style={{ width: `${Math.random() * 60 + 20}%` }}></div>
                </div>
              </div>

              <h3 className={styles.videoTitle}>{video.title}</h3>
              <div className={styles.videoMeta}>
                <span>{video.channel}</span> • <span>{video.views} views</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyMessage}>
          No videos found matching "{searchTerm}"
        </div>
      )}

    </div>
  );
};

export default HistoryContent;