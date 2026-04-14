import React from 'react';
import { useParams } from 'react-router-dom';

import styles from '../styles/VideoPlayer.module.css';

import TopBar from '../components/Home/TopBar';
import CustomPlayer from '../Components/VideoPlayer/CustomPlayer';
import VideoDetails from '../Components/VideoPlayer/VideoDetails';
import RelatedVideos from '../Components/VideoPlayer/RelatedVideos';

const VideoPlayerPage = () => {
  const { videoId } = useParams();
  // const SAMPLE_VIDEO = `http://localhost:3000/stream/masterManifest/${videoId}`;
  const SAMPLE_VIDEO = 'https://muzammil-processed-video-bucket-2026.s3.ap-south-1.amazonaws.com/videos/vid_1773220707588/master.m3u8'
  const THUMBNAIL_URL = 'https://muzammil-thumbnails-storage-bucket.s3.ap-south-1.amazonaws.com/uploads/1775913778310-61a8ac09/thumb_ID_card.jpeg'; // Placeholder thumbnail

  return (
    <>
      <div className={styles.container}>
        <div className={styles.layoutGrid}>

          {/* LEFT COLUMN: Player + Details */}
          <div>
            <CustomPlayer videoSrc={SAMPLE_VIDEO} thumbnailUrl={THUMBNAIL_URL} />
            <VideoDetails videoId={videoId} />
          </div>

          {/* RIGHT COLUMN: Related Videos */}
          <div>
            <RelatedVideos videoId={videoId}/>
          </div>

        </div>
      </div>
    </>
  );
};

export default VideoPlayerPage;