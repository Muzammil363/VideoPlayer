import React from 'react';
import { useSelector } from 'react-redux';
import styles from '../../styles/MyChannel.module.css';

const ChannelInfo = ({onUploadClick}) => {
  const profile = useSelector((state) => state.profile.profileData);
  const channelName = profile?.channelName || 'My Channel';
  const channelDescription = profile?.channelDescription || 'Sharing knowledge through videos.';
  const channelAvatarColor = profile?.channelAvatarColor || '#6b21a8';

  return (
    <div className={styles.channelHeader}>
      {/* LEFT SIDE: Avatar + Info */}
      <div className={styles.headerLeft}>
        <div className={styles.channelAvatar} style={{ backgroundColor: channelAvatarColor }}>
          {channelName.charAt(0).toUpperCase()}
        </div>
        
        <div className={styles.channelDetails}>
          <h1 className={styles.channelName}>{channelName}</h1>
          <span className={styles.channelStats}>1.2M subscribers</span>
          <span className={styles.channelStats}>{channelDescription}</span>
        </div>
      </div>

      {/* RIGHT SIDE: Action Button */}
      <button className={styles.uploadButton} onClick={onUploadClick}>
        {/* Upload Icon SVG */}
        <svg fill="currentColor" height="24" viewBox="0 0 24 24" width="24">
          <path d="M14 13h-3v3H9v-3H6v-2h3V8h2v3h3v2zm3-7H3v12h14v-6.39l4 1.83V8.56l-4 1.83V6m1-1v8.39L22 12V6l-4 2V5H2v14h16v-5l4 1.83V8.56l-4 1.83V5z" />
        </svg>
        Upload Video
      </button>
    </div>
  );
};

export default ChannelInfo;
