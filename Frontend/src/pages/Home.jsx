import React, { useState, useEffect } from 'react';

import { useSelector,useDispatch } from 'react-redux';
import { profileActions } from '../Redux/store';

import TopBar from '../components/Home/TopBar';
import Sidebar from '../components/Home/Sidebar';
import VideoGrid from '../components/Home/VideoGrid';
import styles from '../styles/Home.module.css';

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

const HomePage = () => {
  // Default: Open on desktop, closed on mobile (handled by media query logic mostly)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [videos, setVideos] = useState(mockVideos);

  const dispatch=useDispatch();

  // Check screen size to auto-close on mobile load
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsMobile(true);
        setIsSidebarOpen(false); // Default close on mobile
      } else {
        setIsMobile(false);
        setIsSidebarOpen(true); // Default open on desktop
      }
    };
    // Run once on mount
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // API call to fetch videos
  useEffect(() => {
    async function fetchVideos() {
      try {
        const response = await fetch('http://localhost:3000/stream/videos/0', {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          }
        }); // page number 1 for now
        const data = await response.json();
        if(data.success){
          // Handle video data (e.g., set state)
          // store update with data.user.username
          // Move this to RootLayout later
          setVideos((prev)=>([...prev,...data.videos]));
          dispatch(profileActions.setProfileData(data.user));
        }
        console.log("Fetched videos:", data); // To be removed later
      } catch (error) {
        console.error("Error fetching videos:", error);
      }
    }
    fetchVideos();
  }, []);
  

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div
      className={`
        ${styles.container} 
        ${!isSidebarOpen && !isMobile ? styles.containerClosed : ''}
      `}
    >
      {/* Pass toggle function to TopBar */}
      <TopBar toggleSidebar={toggleSidebar} />

      {/* If mobile and open, show overlay background */}
      {isMobile && isSidebarOpen && (
        <div className={styles.overlay} onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Sidebar logic: Sticky on desktop, Fixed overlay on Mobile */}
      <div className={isMobile && isSidebarOpen ? styles.mobileSidebarOpen : ''}>
        {/* Only render sidebar if it's open OR if we are on desktop (where we hide via CSS grid width) */}
        {(isSidebarOpen || !isMobile) && <Sidebar />}
      </div>

      <VideoGrid videos={videos} />
    </div>
  );
};

export default HomePage;