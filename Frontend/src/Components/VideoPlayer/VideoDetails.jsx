import React, { useState,useEffect,useRef} from 'react';
import styles from '../../styles/VideoPlayer.module.css';

const VideoDetails = ({videoId}) => {
  const [likes, setLikes] = useState(0); // to be retrived and updated
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const videoRef = useRef(null);
   /*
    useEffect hook to load meta data
   */
  useEffect(() => {
    async function loadVideoData() {
      let response = await fetch(`http://localhost:3000/stream/video/${videoId}`, {
        method: 'GET',
        credentials: "include",
        headers: {
          "content-type": "application/json"
        }
      });

      let data = await response.json();
      
      if(data.success) {
        // videoRef.current = data.video;
        setLikes(data.video.likesCount);
        setIsLiked(data.isLiked);
        setIsSaved(data.isSaved);
      }
    }

    loadVideoData();
  }, []);

  /*
    Watch later api call handler function
   */
  async function handleWatchLater() {
    let response = await fetch(`http://localhost:3000/save/watch-later/${videoId}`,{
      method:'POST',
      credentials:"include",
      headers: {
        "content-type":"application/json"
      }
    });

    let data = await response.json();
    console.log(data);
    if(data.success) {
      setIsSaved(true);
      return ;
    }
    else if(response.status == 400) {
      setIsSaved(false);
    }

    return ;
  }

  /*
    Likes api call handler function
   */
  async function likeHandler() {
    let response = await fetch(`http://localhost:3000/save/like/${videoId}`,{
      method:'POST',
      credentials:"include",
      headers: {
        "content-type":"application/json"
      }
    });

    let data = await response.json();
    console.log(data);
    if(data.success) {
      setIsLiked(true);
      setLikes(likes+1);

    }
    else if(response.status == 400) {
      setIsLiked(false);
      setLikes(likes-1);
    }

    return ;
  }

  /*
    Subscribe api call handler function
   */

  

  return (
    <div className={styles.infoContainer}>
      <h1 className={styles.videoTitle}>Building a YouTube Clone with React & Node.js</h1>
      
      {/* Channel + Buttons Row */}
      <div className={styles.actionsRow}>
        
        {/* Channel Info */}
        <div className={styles.channelInfo}>
          <div className={styles.avatar}>U</div>
          <div className={styles.channelText}>
            <span className={styles.channelName}>Code With User</span>
            <span className={styles.subCount}>1.2M subscribers</span>
          </div>
          <button className={styles.pillBtn} style={{background:'black', color:'white', marginLeft:'10px'}}>
            Subscribe
          </button>
        </div>

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          
          <button className={styles.pillBtn} onClick={likeHandler}>
             {/* Like Icon */}
             {isLiked ? (
               <svg fill="currentColor" height="24" viewBox="0 0 24 24" width="24"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.15L14.44 1 6.21 9.23C5.74 9.7 5.4 10.32 5.4 11v9c0 1.1.9 2 2 2h9.83c.88 0 1.63-.52 1.94-1.29l3.47-8.11c.08-.23.15-.47.15-.71v-1.9z"/></svg>
             ) : (
               <svg fill="currentColor" height="24" viewBox="0 0 24 24" width="24"><path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v1.91l.01.01L1 14c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.15l.9 1.16L19.56 13l2.44-6H15z" opacity=".3"/></svg>
             )}
             {likes} | Dislike
          </button>

          <button className={styles.pillBtn} onClick={handleWatchLater}>
            {/* Save Icon */}
            <svg fill="currentColor" height="24" viewBox="0 0 24 24" width="24"><path d="M14 10H2v2h12v-2zm0-4H2v2h12V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM2 16h8v-2H2v2z"/></svg>
            {isSaved ? "Saved" : "Save"}
          </button>
        </div>

      </div>

      {/* Description */}
      <div className={styles.descriptionBox}>
        <p>In this video, we will learn how to build a scalable frontend using React, CSS Modules, and clean architecture.</p>
        <br/>
        <p>#react #javascript #webdevelopment</p>
      </div>
    </div>
  );
};

export default VideoDetails;