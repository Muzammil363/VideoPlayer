import React, { useState, useEffect } from 'react';
import styles from '../styles/History.module.css';

import TopBar from '../components/Home/TopBar';
import Sidebar from '../components/Home/Sidebar';
import HistoryContent from '../Components/History/HistoryContent';

const HistoryPage = () => {
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
      <HistoryContent />
  );
};

export default HistoryPage;