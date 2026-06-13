import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styles from '../styles/MyChannel.module.css';
import { toast } from 'react-hot-toast';
import ConfirmDialog from '../Components/Common/ConfirmDialog.jsx';

// New Components for this page
import ChannelInfo from '../Components/MyChannel/ChannelInfo';
import MyVideos from '../Components/MyChannel/MyVideos';
import UploadModal from '../Components/Upload/UploadModal.jsx'

const MyChannelPage = () => {
  // Sidebar Logic (copied from Home for consistent behavior)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [myVideos,setMyVideos] = useState([]);
  const [isDeletingVideo, setIsDeletingVideo] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState(null);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const hasActiveProcessingVideos = useMemo(
    () => myVideos.some((video) => ['queued', 'processing'].includes(video.status)),
    [myVideos]
  );
  
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

  const loadMyVideos = useCallback(async ({ silent = false } = {}) => {
    try {
      let response = await fetch('http://localhost:3000/user/myVideos',{
        method:'GET',
        credentials:'include',
        headers:{
          "Content-type":"application/json"
        }
      });
      let data = await response.json();
      if(data.success) {
        setMyVideos(data.data || [])
      }
      else {
        if (!silent) toast.error("Failed to load your videos");
      }
    } catch (error) {
      if (!silent) toast.error("Failed to load your videos");
    }
  }, []);

  useEffect(()=>{
    loadMyVideos();
  },[loadMyVideos]);

  useEffect(() => {
    if (!hasActiveProcessingVideos) return undefined;

    const intervalId = window.setInterval(() => {
      loadMyVideos({ silent: true });
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [hasActiveProcessingVideos, loadMyVideos]);

  const handleUploadQueued = () => {
    setIsUploadModalOpen(false);
    loadMyVideos({ silent: true });
    toast.success("Upload queued for processing. You can track it in My Channel.");
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleDeleteVideo = async (videoId) => {
    if (!videoId || isDeletingVideo) return;
    setVideoToDelete(videoId);
  };

  const confirmDeleteVideo = async () => {
    const videoId = videoToDelete;
    if (!videoId || isDeletingVideo) return;

    setVideoToDelete(null);
    setIsDeletingVideo(true);
    try {
      const response = await fetch(`http://localhost:3000/user/videos/${videoId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete video");
      }

      setMyVideos((videos) => videos.filter((video) => (video._id || video.id) !== videoId));
      toast.success("Video deleted successfully");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsDeletingVideo(false);
    }
  };

  return (
      <>
      {/* 3. Page Specific Content */}
      <main className={styles.contentArea}>
        <ChannelInfo onUploadClick={() => setIsUploadModalOpen(true)} />
        <MyVideos
          myUploads={myVideos}
          onDeleteVideo={handleDeleteVideo}
          isDeletingVideo={isDeletingVideo}
        />
      </main>

      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        onUploadQueued={handleUploadQueued}
      />

      <ConfirmDialog
        isOpen={Boolean(videoToDelete)}
        title="Delete video?"
        message="This will permanently remove the video, thumbnail, and processed files from storage."
        confirmLabel="Delete"
        danger
        onCancel={() => setVideoToDelete(null)}
        onConfirm={confirmDeleteVideo}
      />
      </>
  );
};

export default MyChannelPage;
