import React from 'react';
import styles from '../styles/VideoPlayer.module.css';
import TopBar from '../components/Home/TopBar'; // Reusing TopBar

import CustomPlayer from '../Components/VideoPlayer/CustomPlayer';
import VideoDetails from '../Components/VideoPlayer/VideoDetails';
import RelatedVideos from '../Components/VideoPlayer/RelatedVideos';

const VideoPlayerPage = () => {
  // Sample video (Open source Big Buck Bunny or any mp4 link)
  const SAMPLE_VIDEO = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

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