import React from 'react';
import { useParams } from 'react-router-dom';

import styles from '../styles/VideoPlayer.module.css';

import TopBar from '../components/Home/TopBar'; 
import CustomPlayer from '../Components/VideoPlayer/CustomPlayer';
import VideoDetails from '../Components/VideoPlayer/VideoDetails';
import RelatedVideos from '../Components/VideoPlayer/RelatedVideos';

const VideoPlayerPage = () => {
  // Sample video (Open source Big Buck Bunny or any mp4 link)
  const { videoId } = useParams();
  const SAMPLE_VIDEO = `http://localhost:3000/stream/masterManifest/${videoId}`; // Replace with actual video source based on videoId

  return (
    <>
      <TopBar toggleSidebar={() => {}} /> {/* Empty toggle since we might not show sidebar here */}
      
      <div className={styles.container}>
        <div className={styles.layoutGrid}>
          
          {/* LEFT COLUMN: Player + Details */}
          <div>
            <CustomPlayer videoSrc={SAMPLE_VIDEO} />
            <VideoDetails />
          </div>

          {/* RIGHT COLUMN: Related Videos */}
          <div>
            <RelatedVideos />
          </div>

        </div>
      </div>
    </>
  );
};

export default VideoPlayerPage;