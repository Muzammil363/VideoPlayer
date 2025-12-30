import React, { useState, useEffect } from 'react';
import styles from '../styles/MyChannel.module.css';

// Reusing components from Home to keep the layout consistent
import TopBar from '../components/Home/TopBar';
import Sidebar from '../components/Home/Sidebar';

// New Components for this page
import ChannelInfo from '../Components/MyChannel/ChannelInfo';
import MyVideos from '../Components/MyChannel/MyVideos';
import UploadModal from '../Components/Upload/UploadModal.jsx'

const MyChannelPage = () => {
  // Sidebar Logic (copied from Home for consistent behavior)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
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

  return (
    <div className={`${styles.container} ${!isSidebarOpen && !isMobile ? styles.containerClosed : ''}`}>
      
      {/* 1. Shared Header */}
      <TopBar toggleSidebar={toggleSidebar} />

      {/* 2. Shared Sidebar (Hidden/Overlay logic for mobile) */}
      <div style={{gridArea: 'sidebar'}}> 
         {(isSidebarOpen || !isMobile) && <Sidebar />}
      </div>

      {/* 3. Page Specific Content */}
      <main className={styles.contentArea}>
        <ChannelInfo onUploadClick={() => setIsUploadModalOpen(true)} />
        <MyVideos />
      </main>

      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
      />

    </div>
  );
};

export default MyChannelPage;