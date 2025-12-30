import React, { useRef, useState, useEffect } from 'react';
import Hls from 'hls.js';
import styles from '../../styles/VideoPlayer.module.css';

const CustomPlayer = ({ videoSrc }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);

  // --- Player State ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");

  // --- HLS Quality State ---
  const [qualities, setQualities] = useState([]);
  const [currentQuality, setCurrentQuality] = useState(-1); // -1 usually means 'Auto'
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  // --- 1. Initialize HLS & Load Video ---
  useEffect(() => {
    let hls;

    if (Hls.isSupported() && videoSrc) {
      hls = new Hls();
      hlsRef.current = hls;

      hls.loadSource(videoSrc);
      hls.attachMedia(videoRef.current);

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        // Extract available levels (qualities)
        const availableQualities = data.levels.map((level, index) => ({
          height: level.height,
          index: index
        }));
        
        // Add 'Auto' option
        setQualities([{ height: 'Auto', index: -1 }, ...availableQualities.reverse()]);
        
        // Auto play on load if desired
        // videoRef.current.play().catch(() => console.log("User interaction needed"));
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        // Optional: Update UI to show which level 'Auto' actually selected
        // console.log("Auto switched to level:", data.level);
      });

    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      // Fallback for Safari (Native HLS)
      videoRef.current.src = videoSrc;
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [videoSrc]);

  // --- 2. Handlers ---

  const togglePlay = () => {
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const total = videoRef.current.duration;
    
    if (total > 0) {
      setProgress((current / total) * 100);
      setCurrentTime(formatTime(current));
      setDuration(formatTime(total));
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleSeek = (e) => {
    const bar = e.currentTarget;
    const clickX = e.nativeEvent.offsetX;
    const width = bar.clientWidth;
    const newTime = (clickX / width) * videoRef.current.duration;
    
    videoRef.current.currentTime = newTime;
    setProgress((clickX / width) * 100);
  };

  // --- Real Volume Logic ---
  const handleVolumeChange = (e) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    videoRef.current.volume = newVol;
    setIsMuted(newVol === 0);
  };

  const toggleMute = () => {
    if (isMuted) {
      videoRef.current.volume = volume || 0.5; // restore volume
      setIsMuted(false);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  // --- Real Quality Logic ---
  const handleQualityChange = (index) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = index; // -1 is Auto, 0,1,2 are specific levels
      setCurrentQuality(index);
      setShowQualityMenu(false);
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className={styles.playerWrapper} ref={containerRef}>
      <video 
        ref={videoRef}
        className={styles.videoElement}
        onTimeUpdate={handleTimeUpdate}
        onClick={togglePlay}
        poster="https://via.placeholder.com/1280x720/000000/FFFFFF?text=Loading+HLS+Stream..."
      />

      {/* Controls Overlay */}
      <div className={styles.controlsOverlay}>
        
        {/* Progress Bar */}
        <div className={styles.progressBarContainer} onClick={handleSeek}>
          <div className={styles.progressFill} style={{width: `${progress}%`}}></div>
        </div>

        <div className={styles.controlsRow}>
          
          {/* LEFT: Play, Volume, Time */}
          <div className={styles.controlGroup}>
            <button className={styles.iconBtn} onClick={togglePlay}>
              {isPlaying ? (
                <svg fill="currentColor" height="24" viewBox="0 0 24 24" width="24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              ) : (
                <svg fill="currentColor" height="24" viewBox="0 0 24 24" width="24"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>
            
            <div className={styles.volumeContainer}>
               <button className={styles.iconBtn} onClick={toggleMute}>
                 {isMuted || volume === 0 ? (
                   <svg fill="currentColor" height="24" viewBox="0 0 24 24" width="24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                 ) : (
                   <svg fill="currentColor" height="24" viewBox="0 0 24 24" width="24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
                 )}
               </button>
               <input 
                 type="range" min="0" max="1" step="0.05" 
                 value={isMuted ? 0 : volume} 
                 onChange={handleVolumeChange} 
                 className={styles.volumeSlider} 
               />
            </div>
            
            <span className={styles.timeDisplay}>{currentTime} / {duration}</span>
          </div>

          {/* RIGHT: Quality, Fullscreen */}
          <div className={styles.controlGroup}>
            
            {/* Real Quality Selector */}
            {qualities.length > 0 && (
              <div className={styles.qualityContainer}>
                <div 
                  className={styles.qualityBadge} 
                  onClick={() => setShowQualityMenu(!showQualityMenu)}
                >
                  {currentQuality === -1 ? 'Auto' : `${qualities.find(q => q.index === currentQuality)?.height}p`}
                </div>

                {showQualityMenu && (
                  <div className={styles.qualityMenu}>
                    {qualities.map((q) => (
                      <button 
                        key={q.index}
                        className={`${styles.qualityOption} ${currentQuality === q.index ? styles.active : ''}`}
                        onClick={() => handleQualityChange(q.index)}
                      >
                        <span>{q.height === 'Auto' ? 'Auto' : `${q.height}p`}</span>
                        {currentQuality === q.index && <span>✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <button className={styles.iconBtn} onClick={toggleFullScreen}>
              <svg fill="currentColor" height="24" viewBox="0 0 24 24" width="24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default CustomPlayer;