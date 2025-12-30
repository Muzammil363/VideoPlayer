import React, { useState } from 'react';
import styles from '../../styles/Profile.module.css';
import PasswordModal from './PasswordModal';

const ProfileSettings = () => {
  const [userName, setUserName] = useState('SuperCoder123');
  const [channelName, setChannelName] = useState('Code With User');
  const [channelDesc, setChannelDesc] = useState('I make videos about React and Node.js');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Helper to get first letter for Avatar
  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  const handleUserUpdate = () => {
    console.log("Updating Username to:", userName);
    alert("Username updated!");
  };

  const handleChannelUpdate = () => {
    console.log("Updating Channel:", { channelName, channelDesc });
    alert("Channel details updated!");
  };

  return (
    <div className={styles.contentArea}>
      <h1 className={styles.pageTitle}>Settings</h1>

      {/* --- CARD 1: Account Settings --- */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          {/* Avatar Area - Rebeccapurple Background */}
          <div className={styles.bigAvatar}>
            {getInitials(userName)}
          </div>
          
          {/* Text Area */}
          <div className={styles.headerText}>
            <h2 className={styles.cardTitle}>Account Settings</h2>
            <span className={styles.cardSubtitle}>Manage your personal details and login</span>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Username (Login ID)</label>
          <div style={{display:'flex', gap:'10px', alignItems:'center', flexWrap:'wrap'}}>
            <input 
              type="text" 
              className={styles.input} 
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
            <button className={styles.saveBtn} onClick={handleUserUpdate}>Save</button>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #eee', margin: '24px 0' }}></div>

        <div className={styles.passwordSection}>
          <div>
            <div className={styles.label} style={{fontSize:'1rem'}}>Password</div>
            <span className={styles.cardSubtitle}>Last changed 3 months ago</span>
          </div>
          <button 
            className={styles.resetBtn} 
            onClick={() => setIsPasswordModalOpen(true)}
          >
            Reset Password
          </button>
        </div>
      </div>

      {/* --- CARD 2: Channel Customization --- */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          {/* Standard Icon for Channel Settings */}
          <div className={styles.bigAvatar} style={{backgroundColor: '#e0e0e0', color:'#606060', boxShadow:'none'}}>
            <svg viewBox="0 0 24 24" height="32" width="32" fill="currentColor">
              <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"></path>
            </svg>
          </div>

          <div className={styles.headerText}>
            <h2 className={styles.cardTitle}>Channel Customization</h2>
            <span className={styles.cardSubtitle}>Update your public channel appearance</span>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Channel Name</label>
          <input 
            type="text" 
            className={styles.input} 
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Channel Description</label>
          <textarea 
            className={styles.textarea} 
            value={channelDesc}
            onChange={(e) => setChannelDesc(e.target.value)}
          />
        </div>

        <div style={{textAlign: 'right'}}>
          <button className={styles.saveBtn} onClick={handleChannelUpdate}>
            Save Changes
          </button>
        </div>
      </div>

      <PasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />

    </div>
  );
};

export default ProfileSettings;