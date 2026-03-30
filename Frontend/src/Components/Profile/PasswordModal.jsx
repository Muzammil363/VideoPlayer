import React, { useState } from 'react';
import styles from '../../styles/Profile.module.css';

const PasswordModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1); // 1: Confirm, 2: OTP, 3: New Password
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');

  if (!isOpen) return null;

  const handleConfirmReset = () => {
    (async () => {
      try {
        const res = await fetch('http://localhost:3000/user/reset-password', {
          method: 'PUT',
          credentials: 'include',
          headers: { 
            'Content-Type': 'application/json' 
          }
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setStep(2);
        } else {
          alert(data.message || 'Failed to request OTP');
        }
      } catch (err) {
        console.error('Request OTP error:', err);
        alert('Network error while requesting OTP');
      }
    })();
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = () => {
    // Call backend to verify OTP and receive a token
    (async () => {
      try {
        // send otp in request body to POST /user/verify-reset
        const res = await fetch('http://localhost:3000/user/verify-reset', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ otp })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          // backend returns token in data
          setResetToken(data.data);
          setStep(3);
        } else {
          alert(data.message || 'Invalid OTP');
        }
      } catch (err) {
        console.error('Verify OTP error:', err);
        alert('Network error while verifying OTP');
      }
    })();
  };

  // STEP 3: Submit New Password
  const handleSubmitNewPassword = () => {
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    if (!resetToken) {
      alert('Missing reset token. Please verify OTP again.');
      return;
    }

    (async () => {
      try {
        const res = await fetch('http://localhost:3000/user/update-password', {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newPassword, token: resetToken })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          alert('Password changed successfully!');
          handleClose();
        } else {
          alert(data.message || 'Failed to update password');
        }
      } catch (err) {
        console.error('Update password error:', err);
        alert('Network error while updating password');
      }
    })();
  };

  const handleClose = () => {
    setStep(1);
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        
        {/* --- STEP 1: Confirmation --- */
         step === 1 && (
          <>
            <h3 className={styles.modalTitle}>Reset Password?</h3>
            <p>This action will sign you out of all other devices. An OTP will be sent to your email.</p>
            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={handleClose}>Cancel</button>
              <button className={styles.btnPrimary} onClick={handleConfirmReset}>Send OTP</button>
            </div>
          </>
        )}

        {/* --- STEP 2: Enter OTP --- */
         step === 2 && (
          <>
            <h3 className={styles.modalTitle}>Enter OTP</h3>
            <p>Please enter the 4-digit code sent to your email.</p>
            <input 
              type="text" 
              className={styles.input} 
              placeholder="Ex: 1234" 
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              style={{textAlign: 'center', letterSpacing: '4px', fontSize: '1.2rem'}}
            />
            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={handleClose}>Cancel</button>
              <button className={styles.btnPrimary} onClick={handleVerifyOtp}>Verify</button>
            </div>
          </>
        )}

        {/* --- STEP 3: New Password --- */
         step === 3 && (
          <>
            <h3 className={styles.modalTitle}>Create New Password</h3>
            <div style={{display:'flex', flexDirection:'column', gap:'10px', textAlign:'left'}}>
              <label className={styles.label}>New Password</label>
              <input 
                type="password" 
                className={styles.input}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <label className={styles.label}>Confirm Password</label>
              <input 
                type="password" 
                className={styles.input}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={handleClose}>Cancel</button>
              <button className={styles.btnPrimary} onClick={handleSubmitNewPassword}>Update Password</button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default PasswordModal;