import React,{useState,useEffect} from 'react';
import { Link } from 'react-router-dom';
import styles from '../../styles/VideoPlayer.module.css';
import { formatViews, getChannelName } from '../../Utils/videoDisplay';

const mockRelated = [
  { id: 101, title: "Next.js 14 Full Course 2024", channel: "Web Dev Simplified", views: "300K" },
  { id: 102, title: "10 CSS One-Liners that will save your life", channel: "FireShip", views: "1.2M" },
  { id: 103, title: "Learn Docker in 1 Hour", channel: "Programming with Mosh", views: "500K" },
  { id: 104, title: "Why I stopped using Redux", channel: "Tech Lead", views: "45K" },
  { id: 105, title: "Building a Chat App with Socket.io", channel: "PedroTech", views: "100K" },
  { id: 106, title: "System Design for Beginners", channel: "NeetCode", views: "2M" },
  { id: 107, title: "React Hooks Explained", channel: "Ben Awad", views: "800K" },
];

const RelatedVideos = ({videoId}) => {
  const [relatedVideos, setRelatedVideos] = useState([]);

  // useEffect hook to load 
  useEffect(()=>{
    async function fetchRelatedVideos() {
      try {
        const response = await fetch(`http://localhost:3000/stream/recommendedVideos/${videoId}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            "Content-Type": "application/json"
          }
        });
        const data = await response.json();
        if (data.success) {
          console.log("Recommended Videos: ", data.videos);
          
          const grouped = data.videos || {};
          const flattened = Object.values(grouped).flat();
          console.log("Flattened Recommended Videos: ", flattened);
          setRelatedVideos(flattened);
        } else {
          console.error("Failed to fetch recommended videos: ", data.error);
        }
      } catch (error) {
        console.error("Error fetching recommended videos: ", error);
      }
    }
    if (videoId) fetchRelatedVideos();
  },[videoId])

  return (
    <div className={styles.relatedContainer}>
      <h3 style={{fontSize:'1rem', marginBottom:'10px'}}>You might like</h3>
      
      {(relatedVideos.length ? relatedVideos : mockRelated).map((video) => {
        const videoId = video._id || video.id;
        const channelName = getChannelName(video);

        return (
        <Link
          to={`/video/${videoId}`}
          key={videoId}
          className={styles.relatedCard}
        >
          <img 
            src={video.thumbnailUrl || video.thumbnailPath || `https://picsum.photos/seed/${videoId}/320/180`}
            className={styles.relatedThumb} 
            alt={video.title || 'Video thumbnail'}
          />
          <div className={styles.relatedDetails}>
            <span className={styles.relatedTitle}>{video.title}</span>
            <span className={styles.relatedMeta}>{channelName}</span>
            <span className={styles.relatedMeta}>{formatViews(video.views)}</span>
          </div>
        </Link>
      )})}
    </div>
  );
};

export default RelatedVideos;
