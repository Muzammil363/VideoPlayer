import React, { useState } from 'react';
import styles from '../../styles/Profile.module.css';

const PasswordModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1); // 1: Confirm, 2: OTP, 3: New Password
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  if (!isOpen) return null;

  // --- Handlers for each step ---

  // STEP 1: User Confirms they want to reset
  const handleConfirmReset = () => {
    // API CALL SIMULATION: Request OTP from backend
    console.log("Requesting OTP...");
    setStep(2); // Move to OTP step
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = () => {
    // API CALL SIMULATION: Verify OTP
    if (otp === "1234") { // Mock check
      console.log("OTP Verified");
      setStep(3); // Move to New Password step
    } else {
      alert("Invalid OTP (Hint: use 1234)");
    }
  };

  // STEP 3: Submit New Password
  const handleSubmitNewPassword = () => {
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    // API CALL SIMULATION: Update Password
    console.log("Password Updated Successfully");
    alert("Password changed successfully!");
    
    // Reset and Close
    handleClose(); 
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