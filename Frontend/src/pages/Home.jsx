import React, { useState, useEffect } from 'react';
import TopBar from '../components/Home/TopBar';
import Sidebar from '../components/Home/Sidebar';
import VideoGrid from '../components/Home/VideoGrid';
import styles from '../styles/Home.module.css';

const HomePage = () => {
  // Default: Open on desktop, closed on mobile (handled by media query logic mostly)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

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

      <VideoGrid />
    </div>
  );
};

export default HomePage;