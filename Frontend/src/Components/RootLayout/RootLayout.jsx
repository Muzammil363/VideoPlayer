import React, { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import TopBar from '../Home/TopBar';
import Sidebar from '../Home/Sidebar';
import styles from '../../styles/Home.module.css';

function RootLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

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

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  return (
    <div className={`${styles.container} ${!isSidebarOpen && !isMobile ? styles.containerClosed : ''}`}>
      <TopBar toggleSidebar={toggleSidebar} query='' />

      {isMobile && isSidebarOpen && (
        <div className={styles.overlay} onClick={() => setIsSidebarOpen(false)}></div>
      )}

      <div className={isMobile && isSidebarOpen ? styles.mobileSidebarOpen : ''}>
        {(isSidebarOpen || !isMobile) && <Sidebar />}
      </div>

      <main className={styles.mainContent}>
        <Outlet />
      </main>
    </div>
  );
}

export default RootLayout
