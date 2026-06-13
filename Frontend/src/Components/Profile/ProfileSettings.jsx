import React, { useState,useEffect } from 'react';
import styles from '../../styles/Profile.module.css';
import { toast } from 'react-hot-toast';
import PasswordModal from './PasswordModal';
import { useDispatch } from 'react-redux';
import { profileActions } from '../../Redux/store';

const PROFILE_COLORS = ['#6b21a8', '#0f766e', '#1d4ed8', '#be123c', '#374151'];

const ProfileSettings = () => {
  const [userName, setUserName] = useState('SuperCoder123');
  const [channelName, setChannelName] = useState('Code With User');
  const [channelDesc, setChannelDesc] = useState('I make videos about React and Node.js');
  const [profileColor, setProfileColor] = useState(PROFILE_COLORS[0]);
  const [channelAvatarColor, setChannelAvatarColor] = useState(PROFILE_COLORS[0]);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const dispatch = useDispatch();

  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  const handleUserUpdate = () => {
    (async () => {
      try {
        const res = await fetch("http://localhost:3000/user/updatename", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json" 
          },
          credentials: "include",
          body: JSON.stringify({ 
            name: userName
           })
        });

        const responseData = await res.json();

        if (!res.ok || !responseData.success) {
          console.error('Update username failed', responseData);
          toast.error(responseData.message || 'Failed to update username');
          return;
        }
        
        console.log("username update: ",responseData.data);
        setUserName(responseData.data.name);
        dispatch(profileActions.setProfileData({
          username: responseData.data.name,
          profileColor,
          channelName,
          channelDescription: channelDesc,
          channelAvatarColor,
        }));
        toast.success('Username updated!');
      } catch (error) {
        console.error('Error updating username:', error);
        toast.error('Error updating username');
      }
    })();
  };

  const handleProfileColorUpdate = (color) => {
    if (color === profileColor) return;

    const previousColor = profileColor;
    setProfileColor(color);
    dispatch(profileActions.setProfileData({
      username: userName,
      profileColor: color,
      channelName,
      channelDescription: channelDesc,
      channelAvatarColor,
    }));

    (async () => {
      try {
        const res = await fetch("http://localhost:3000/user/profile-color", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ profileColor: color }),
        });

        const responseData = await res.json();
        if (!res.ok || !responseData.success) {
          setProfileColor(previousColor);
          dispatch(profileActions.setProfileData({
            username: userName,
            profileColor: previousColor,
            channelName,
            channelDescription: channelDesc,
            channelAvatarColor,
          }));
          toast.error(responseData.message || 'Failed to update profile color');
          return;
        }

        toast.success('Profile color updated!');
      } catch (error) {
        setProfileColor(previousColor);
        dispatch(profileActions.setProfileData({
          username: userName,
          profileColor: previousColor,
          channelName,
          channelDescription: channelDesc,
          channelAvatarColor,
        }));
        toast.error('Error updating profile color');
      }
    })();
  };

  const handleChannelUpdate = () => {
    (async () => {
      try {
        const res = await fetch("http://localhost:3000/user/updateChannel", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json"
           },
          credentials: "include",
          body: JSON.stringify({ 
            channelName, 
            channelDescription: channelDesc,
            channelAvatarColor,
          })
        });

        const responseData = await res.json();

        if (!res.ok || !responseData.success) {
          console.error('Update channel failed', responseData);
          toast.error(responseData.message || 'Failed to update channel');
          return;
        }

        setChannelName(responseData.data.name);
        setChannelDesc(responseData.data.description);
        setChannelAvatarColor(responseData.data.avatarColor || channelAvatarColor);
        dispatch(profileActions.setProfileData({
          username: userName,
          profileColor,
          channelName: responseData.data.name,
          channelDescription: responseData.data.description,
          channelAvatarColor: responseData.data.avatarColor || channelAvatarColor,
        }));
        toast.success('Channel details updated!');
      } catch (error) {
        console.error('Error updating channel:', error);
        toast.error('Error updating channel');
      }
    })();
  };
  
  // To load profile data
  useEffect(()=>{
    async function loadProfile() {
      let response = await fetch("http://localhost:3000/user/profile",{
        method: "GET",
        credentials: "include"
      });
      let responseData = await response.json();

      console.log("responseData: ",responseData.data);

      setUserName(responseData.data.username);
      setProfileColor(responseData.data.profileColor || PROFILE_COLORS[0]);
      setChannelName(responseData.data.channelName);
      setChannelDesc(responseData.data.channelDescription);
      setChannelAvatarColor(responseData.data.channelAvatarColor || PROFILE_COLORS[0]);
      dispatch(profileActions.setProfileData(responseData.data));
    }
    loadProfile();
  },[])

  return (
    <div className={styles.contentArea}>
      <h1 className={styles.pageTitle}>Settings</h1>

      {/* --- CARD 1: Account Settings --- */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          {/* Avatar Area - Rebeccapurple Background */}
          <div className={styles.bigAvatar} style={{ backgroundColor: profileColor }}>
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

        <div className={styles.formGroup}>
          <label className={styles.label}>Profile Color</label>
          <div className={styles.colorPalette}>
            {PROFILE_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`${styles.colorSwatch} ${profileColor === color ? styles.colorSwatchActive : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => handleProfileColorUpdate(color)}
                aria-label={`Set profile color ${color}`}
              >
                {profileColor === color ? getInitials(userName) : ''}
              </button>
            ))}
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
          <div className={styles.bigAvatar} style={{backgroundColor: channelAvatarColor, boxShadow:'none'}}>
            {channelName ? channelName.charAt(0).toUpperCase() : 'C'}
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

        <div className={styles.formGroup}>
          <label className={styles.label}>Channel Color</label>
          <div className={styles.colorPalette}>
            {PROFILE_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`${styles.colorSwatch} ${channelAvatarColor === color ? styles.colorSwatchActive : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setChannelAvatarColor(color)}
                aria-label={`Set channel color ${color}`}
              >
                {channelAvatarColor === color ? (channelName ? channelName.charAt(0).toUpperCase() : 'C') : ''}
              </button>
            ))}
          </div>
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
