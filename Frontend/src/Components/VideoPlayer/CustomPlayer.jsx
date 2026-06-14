import React, { useEffect, useRef, useState } from 'react';
import styles from '../../styles/VideoPlayer.module.css';

const CustomPlayer = ({ videoSrc, thumbnailUrl }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);
  const playPromiseRef = useRef(null);
  const ignoreNextAbortRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [bufferedProgress, setBufferedProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [duration, setDuration] = useState('0:00');
  const [isBuffering, setIsBuffering] = useState(true);
  const [isPlayPending, setIsPlayPending] = useState(false);
  const [playerError, setPlayerError] = useState('');
  const [qualities, setQualities] = useState([]);
  const [currentQuality, setCurrentQuality] = useState(-1);
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  const formatTime = (time) => {
    if (!Number.isFinite(time)) return '0:00';

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const updateBufferedProgress = () => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;

    let bufferedEnd = 0;
    for (let index = 0; index < video.buffered.length; index += 1) {
      const start = video.buffered.start(index);
      const end = video.buffered.end(index);

      if (video.currentTime >= start && video.currentTime <= end) {
        bufferedEnd = end;
        break;
      }

      bufferedEnd = Math.max(bufferedEnd, end);
    }

    setBufferedProgress(Math.min(100, (bufferedEnd / video.duration) * 100));
  };

  const updateTimeState = () => {
    const video = videoRef.current;
    if (!video) return;

    if (Number.isFinite(video.duration) && video.duration > 0) {
      setProgress((video.currentTime / video.duration) * 100);
      setCurrentTime(formatTime(video.currentTime));
      setDuration(formatTime(video.duration));
      updateBufferedProgress();
    }
  };

  useEffect(() => {
    let hls;
    let isCancelled = false;
    const video = videoRef.current;

    if (!video || !videoSrc) {
      setIsBuffering(false);
      return undefined;
    }

    setIsBuffering(true);
    setIsPlaying(false);
    setIsPlayPending(false);
    setPlayerError('');
    setProgress(0);
    setBufferedProgress(0);
    setCurrentTime('0:00');
    setDuration('0:00');
    setQualities([]);
    setCurrentQuality(-1);
    setShowQualityMenu(false);
    playPromiseRef.current = null;
    ignoreNextAbortRef.current = false;

    const setupPlayback = async () => {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = videoSrc;
        setIsBuffering(false);
        return;
      }

      const { default: Hls } = await import('hls.js');
      if (isCancelled) return;

      if (Hls.isSupported()) {
        hls = new Hls();
        hlsRef.current = hls;

        hls.attachMedia(video);

        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          hls.loadSource(videoSrc);
        });

        hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
          const availableQualities = data.levels.map((level, index) => ({
            height: level.height,
            index,
          }));

          setQualities([{ height: 'Auto', index: -1 }, ...availableQualities.reverse()]);
          setIsBuffering(false);
          setPlayerError('');
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS playback error:', data);

          if (!data.fatal) return;

          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            setPlayerError('Network issue while loading video. Retrying...');
            hls.startLoad();
            return;
          }

          if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            setPlayerError('Media issue while playing video. Recovering...');
            hls.recoverMediaError();
            return;
          }

          setPlayerError('This video cannot be played right now.');
          setIsBuffering(false);
          hls.destroy();
        });
      } else {
        setPlayerError('HLS is not supported in this browser.');
        setIsBuffering(false);
      }
    };

    setupPlayback().catch((error) => {
      console.error('HLS setup failed:', error);
      setPlayerError('This video cannot be played right now.');
      setIsBuffering(false);
    });

    return () => {
      isCancelled = true;
      if (hls) hls.destroy();
      hlsRef.current = null;
      playPromiseRef.current = null;
    };
  }, [videoSrc]);

  const playVideo = async () => {
    const video = videoRef.current;
    if (!video || isPlayPending || playerError) return;

    try {
      setIsPlayPending(true);
      const playPromise = video.play();
      playPromiseRef.current = playPromise;
      await playPromise;
    } catch (error) {
      if (error.name === 'AbortError' && ignoreNextAbortRef.current) {
        ignoreNextAbortRef.current = false;
      } else if (error.name !== 'AbortError') {
        console.error('Video play failed:', error);
        setPlayerError('Playback could not start. Please try again.');
      }
    } finally {
      playPromiseRef.current = null;
      setIsPlayPending(false);
      setIsBuffering(false);
    }
  };

  const pauseVideo = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlayPending) {
      ignoreNextAbortRef.current = true;
      return;
    }

    video.pause();
  };

  const togglePlay = (event) => {
    event?.stopPropagation();

    const video = videoRef.current;
    if (!video) return;

    if (video.paused || video.ended) {
      playVideo();
    } else {
      pauseVideo();
    }
  };

  const handleSeek = (event) => {
    event.stopPropagation();

    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;

    const bar = event.currentTarget;
    const rect = bar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const nextProgress = Math.max(0, Math.min(1, clickX / rect.width));

    setIsBuffering(true);
    video.currentTime = nextProgress * video.duration;
    setProgress(nextProgress * 100);
    updateBufferedProgress();
  };

  const handleVolumeChange = (event) => {
    event.stopPropagation();

    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
    video.volume = newVolume;
    setIsMuted(newVolume === 0);
  };

  const toggleMute = (event) => {
    event.stopPropagation();

    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

  const handleQualityChange = (event, index) => {
    event.stopPropagation();

    if (hlsRef.current) {
      setIsBuffering(true);
      hlsRef.current.currentLevel = index;
      setCurrentQuality(index);
      setShowQualityMenu(false);
    }
  };

  const toggleFullScreen = (event) => {
    event.stopPropagation();

    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const toggleQualityMenu = (event) => {
    event.stopPropagation();
    setShowQualityMenu((current) => !current);
  };

  return (
    <div className={styles.playerWrapper} ref={containerRef}>
      <video
        ref={videoRef}
        className={styles.videoElement}
        onTimeUpdate={updateTimeState}
        onClick={togglePlay}
        poster={thumbnailUrl}
        onLoadStart={() => setIsBuffering(true)}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onProgress={updateBufferedProgress}
        onLoadedMetadata={updateTimeState}
        onCanPlay={() => {
          setIsBuffering(false);
          updateBufferedProgress();
        }}
      />

      {isBuffering && (
        <div className={styles.spinnerOverlay}>
          <div className={styles.spinner}></div>
        </div>
      )}

      {playerError && (
        <div className={styles.playerError}>
          {playerError}
        </div>
      )}

      <div className={styles.controlsOverlay} onClick={(event) => event.stopPropagation()}>
        <div className={styles.progressBarContainer} onClick={handleSeek}>
          <div className={styles.bufferedFill} style={{ width: `${bufferedProgress}%` }}></div>
          <div className={styles.progressFill} style={{ width: `${progress}%` }}></div>
        </div>

        <div className={styles.controlsRow}>
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
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onClick={(event) => event.stopPropagation()}
                onChange={handleVolumeChange}
                className={styles.volumeSlider}
              />
            </div>

            <span className={styles.timeDisplay}>{currentTime} / {duration}</span>
          </div>

          <div className={styles.controlGroup}>
            {qualities.length > 0 && (
              <div className={styles.qualityContainer} onClick={(event) => event.stopPropagation()}>
                <div className={styles.qualityBadge} onClick={toggleQualityMenu}>
                  {currentQuality === -1 ? 'Auto' : `${qualities.find((q) => q.index === currentQuality)?.height}p`}
                </div>

                {showQualityMenu && (
                  <div className={styles.qualityMenu}>
                    {qualities.map((q) => (
                      <button
                        key={q.index}
                        className={`${styles.qualityOption} ${currentQuality === q.index ? styles.active : ''}`}
                        onClick={(event) => handleQualityChange(event, q.index)}
                      >
                        <span>{q.height === 'Auto' ? 'Auto' : `${q.height}p`}</span>
                        {currentQuality === q.index && <span>*</span>}
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
