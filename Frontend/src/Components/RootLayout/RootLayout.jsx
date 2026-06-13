import React, { useState, useEffect } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import { useDispatch } from 'react-redux';
import TopBar from '../Home/TopBar';
import Sidebar from '../Home/Sidebar';
import styles from '../../styles/Home.module.css';
import { authActions, profileActions } from '../../Redux/store';

function RootLayout() {
  const params = useParams();
  const dispatch = useDispatch();
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

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch('http://localhost:3000/user/profile', {
          method: 'GET',
          credentials: 'include',
        });

        const data = await response.json();
        if (response.ok && data.success) {
          dispatch(authActions.login());
          dispatch(profileActions.setProfileData(data.data));
        } else {
          dispatch(authActions.logout());
        }
      } catch (error) {
        dispatch(authActions.logout());
      }
    }

    loadProfile();
  }, [dispatch]);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  return (
    <div className={`${styles.container} ${!isSidebarOpen && !isMobile ? styles.containerClosed : ''}`}>
      <TopBar toggleSidebar={toggleSidebar} query={params.searchQuery || ''} />

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
