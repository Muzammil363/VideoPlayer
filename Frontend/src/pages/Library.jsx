import React, { useState, useEffect } from 'react';
import styles from '../styles/Library.module.css';

// Reuse Layout Components
import TopBar from '../components/Home/TopBar';
import Sidebar from '../components/Home/Sidebar';

// New Library Section Component
import LibrarySection from '../Components/Library/LibrarySection.jsx';
import { formatDistanceToNowStrict, parseISO } from 'date-fns';

// --- Mock Data ---
const watchLaterVideosData = [
  { id: 101, title: "Advanced React Patterns", channel: "Frontend Masters", views: "12K", time: "5 days ago", duration: "45:00" },
  { id: 102, title: "History of the Internet", channel: "Tech History", views: "1.2M", time: "2 years ago", duration: "1:15:20" },
  { id: 103, title: "Best VS Code Extensions 2025", channel: "Code Life", views: "50K", time: "1 week ago", duration: "10:05" },
  { id: 104, title: "Learn Docker in 1 Hour", channel: "DevOps Simplified", views: "300K", time: "4 months ago", duration: "1:00:00" }
];

const likedVideosData = [
  { id: 201, title: "Funny Cat Compilation", channel: "MeowTube", views: "5M", time: "1 year ago", duration: "08:12" },
  { id: 202, title: "Lo-Fi Hip Hop Radio", channel: "ChilledCow", views: "Live", time: "Now", duration: "Live" },
  { id: 203, title: "How to Cook Perfect Steak", channel: "Chef John", views: "800K", time: "3 weeks ago", duration: "12:30" },
];

const LibraryPage = () => {
  // --- Sidebar Logic ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [likedVideos, setLikedVideos] = useState([]);
  const [watchLaterVideos, setWatchLaterVideos] = useState([]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsMobile(true);
        setIsSidebarOpen(false);
      } else {
        setIsMobile(false);
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

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
    if (type === "liked") {
      setLikedVideos(formattedVideos);
    }
    else {
      setWatchLaterVideos(formattedVideos);
    }
  }

  // Helper to handle the "time ago" logic UPDATE THIS LATER
  function formatRelativeTime(dateString) {
    return formatDistanceToNowStrict(parseISO(dateString), { addSuffix: true })
  }
  /*
    API call to get liked videos
   */
  useEffect(() => {
    async function loadData() {
      let response = await fetch("http://localhost:3000/user/liked-videos", {
        method: 'GET',
        credentials: "include",
        headers: {
          "content-type": "application/json"
        }
      })

      let resData = await response.json();
      if (resData.success) {
        renderVideos(resData.data,"liked");
      }
    }
    loadData();
  }, [])

  /*
    API call to get watch later
   */
  useEffect(() => {
    async function loadData() {
      let response = await fetch("http://localhost:3000/user/watch-later", {
        method: 'GET',
        credentials: "include",
        headers: {
          "content-type": "application/json"
        }
      })

      let resData = await response.json();
      if (resData.success) {
        renderVideos(resData.data,"watchlater");
      }
    }
    loadData();
  }, [])

  // --- Icons (SVGs) ---
  const watchLaterIcon = (
    <svg fill="currentColor" height="24" viewBox="0 0 24 24" width="24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z" opacity=".3"></path>
      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"></path>
      <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"></path>
    </svg>
  );

  const likedIcon = (
    <svg fill="currentColor" height="24" viewBox="0 0 24 24" width="24">
      <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.15L14.44 1 6.21 9.23C5.74 9.7 5.4 10.32 5.4 11v9c0 1.1.9 2 2 2h9.83c.88 0 1.63-.52 1.94-1.29l3.47-8.11c.08-.23.15-.47.15-.71v-1.9z"></path>
    </svg>
  );

  return (
    <div className={`${styles.container} ${!isSidebarOpen && !isMobile ? styles.containerClosed : ''}`}>

      <TopBar toggleSidebar={toggleSidebar} />

      <div style={{ gridArea: 'sidebar' }}>
        {(isSidebarOpen || !isMobile) && <Sidebar />}
      </div>

      <main className={styles.contentArea}>
        {/* Section 1: Watch Later */}
        <LibrarySection
          title="Watch Later"
          icon={watchLaterIcon}
          videos={watchLaterVideos}
        />

        {/* Section 2: Liked Videos */}
        <LibrarySection
          title="Liked Videos"
          icon={likedIcon}
          videos={likedVideos}
        />
      </main>

    </div>
  );
};

export default LibraryPage;