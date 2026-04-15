import React, { useState, useEffect } from 'react';
import styles from '../styles/MyChannel.module.css';
import { toast } from 'react-hot-toast';

// New Components for this page
import ChannelInfo from '../Components/MyChannel/ChannelInfo';
import MyVideos from '../Components/MyChannel/MyVideos';
import UploadModal from '../Components/Upload/UploadModal.jsx'
import { da } from 'date-fns/locale';

const myUploads = [
  { id: 1, title: "React Tutorial for Beginners", views: "10K", time: "1 day ago" },
  { id: 2, title: "How to use CSS Grid", views: "5K", time: "2 days ago" },
  { id: 3, title: "Node.js API Authentication", views: "25K", time: "1 week ago" },
  { id: 4, title: "My Workspace Tour 2025", views: "100K", time: "2 weeks ago" },
  { id: 5, title: "Understanding Redux Toolkit", views: "8K", time: "3 weeks ago" },
  { id: 6, title: "JavaScript ES6 Features", views: "50K", time: "1 month ago" },
];

const MyChannelPage = () => {
  // Sidebar Logic (copied from Home for consistent behavior)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [myVideos,setMyVideos] = useState(myUploads);

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

  useEffect(()=>{
    const loadMyVid = async ()=> {
      let response = await fetch('http://localhost:3000/user/myVideos',{
        method:'GET',
        credentials:'include',
        headers:{
          "Content-type":"application/json"
        }
      });
      let data = await response.json();
      if(data.success) {
        setMyVideos((prev)=>[...prev , ...data.data])
      }
      else {
        toast.error("Failed to load your videos");
      }
    }
    loadMyVid();
  },[]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
      <>
      {/* 3. Page Specific Content */}
      <main className={styles.contentArea}>
        <ChannelInfo onUploadClick={() => setIsUploadModalOpen(true)} />
        <MyVideos myUploads={myVideos}/>
      </main>

      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
      />
      </>
  );
};

export default MyChannelPage;