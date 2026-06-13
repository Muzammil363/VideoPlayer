import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import styles from '../styles/VideoPlayer.module.css';

import CustomPlayer from '../Components/VideoPlayer/CustomPlayer';
import VideoDetails from '../Components/VideoPlayer/VideoDetails';
import RelatedVideos from '../Components/VideoPlayer/RelatedVideos';

const VideoPlayerPage = () => {
  const { videoId } = useParams();
  const [video, setVideo] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadVideo() {
      setIsLoading(true);
      setError('');

      try {
        const response = await fetch(`http://localhost:3000/stream/video/${videoId}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'content-type': 'application/json',
          },
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || data.message || 'Unable to load video');
        }

        setVideo(data.video);
        setIsLiked(Boolean(data.isLiked));
        setIsSaved(Boolean(data.isSaved));
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    if (videoId) loadVideo();
  }, [videoId]);

  const handleLikeStateChange = ({ liked, likesCount }) => {
    setIsLiked(liked);
    setVideo((current) => current ? { ...current, likesCount } : current);
  };

  const handleSavedStateChange = (saved) => {
    setIsSaved(saved);
  };

  if (isLoading) {
    return <div className={styles.pageMessage}>Loading video...</div>;
  }

  if (error || !video) {
    return <div className={styles.pageMessage}>{error || 'Video not found'}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.layoutGrid}>
        <div>
          <CustomPlayer
            videoSrc={`http://localhost:3000/stream/masterManifest/${videoId}`}
            thumbnailUrl={video.thumbnailUrl || video.thumbnailPath}
          />
          <VideoDetails
            video={video}
            videoId={videoId}
            isLiked={isLiked}
            isSaved={isSaved}
            onLikeStateChange={handleLikeStateChange}
            onSavedStateChange={handleSavedStateChange}
          />
        </div>

        <div>
          <RelatedVideos videoId={videoId} />
        </div>
      </div>
    </div>
  );
};

export default VideoPlayerPage;
