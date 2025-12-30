import React, { useState, useEffect } from 'react';
import styles from '../styles/Profile.module.css';

import TopBar from '../components/Home/TopBar';
import Sidebar from '../components/Home/Sidebar';
import ProfileSettings from '../Components/Profile/ProfileSettings';

const ProfilePage = () => {
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

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className={`${styles.container} ${!isSidebarOpen && !isMobile ? styles.containerClosed : ''}`}>
      <TopBar toggleSidebar={toggleSidebar} />
      
      <div style={{gridArea: 'sidebar'}}> 
         {(isSidebarOpen || !isMobile) && <Sidebar />}
      </div>

      <ProfileSettings />
    </div>
  );
};

export default ProfilePage;