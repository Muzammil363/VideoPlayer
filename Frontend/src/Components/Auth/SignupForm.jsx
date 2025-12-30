import React, { useState } from 'react';
import styles from '../../styles/Auth.module.css';

const SignupForm = ({ onSwitchToLogin }) => {
  // --- State ---
  const [step, setStep] = useState(1); // 1: Details, 2: Verification
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [otp, setOtp] = useState('');

  // --- Handlers ---
  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Step 1: Validate & Send OTP
  const handleSendOtp = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    
    // API Call Simulation
    console.log("Sending OTP to:", formData.email);
    alert(`OTP Sent to ${formData.email} (Check console/use 1234)`);
    setStep(2);
  };

  // Step 2: Verify & Submit
  const handleVerifyAndSignup = (e) => {
    e.preventDefault();
    
    // API Call Simulation: Verify OTP
    if (otp === "1234") {
      console.log("OTP Verified. Creating Account...", formData);
      alert("Account Created Successfully! Please Login.");
      onSwitchToLogin(); // Go back to login screen
    } else {
      alert("Invalid OTP. Please try again.");
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>▶</span> TubeApp
      </div>

      {/* --- STEP 1: Details Form --- */}
      {step === 1 && (
        <>
          <h2 className={styles.title}>Create your account</h2>
          <form className={styles.form} onSubmit={handleSendOtp}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Username</label>
              <input 
                name="username" 
                type="text" 
                required 
                className={styles.input}
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label className={styles.label}>Email</label>
              <input 
                name="email" 
                type="email" 
                required 
                className={styles.input}
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Password</label>
              <input 
                name="password" 
                type="password" 
                required 
                className={styles.input}
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Confirm Password</label>
              <input 
                name="confirmPassword" 
                type="password" 
                required 
                className={styles.input}
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>

            <button type="submit" className={styles.primaryBtn}>
              Sign Up (Send OTP)
            </button>
          </form>
        </>
      )}

      {/* --- STEP 2: OTP Verification --- */}
      {step === 2 && (
        <>
          <h2 className={styles.title}>Verify your email</h2>
          <p className={styles.subtitle}>
            Enter the code we sent to <b>{formData.email}</b>
          </p>
          
          <form className={styles.form} onSubmit={handleVerifyAndSignup}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Enter OTP</label>
              <input 
                type="text" 
                required 
                className={`${styles.input} ${styles.otpDisplay}`}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="XXXX"
                maxLength="4"
              />
            </div>

            <button type="submit" className={styles.primaryBtn}>
              Verify & Create Account
            </button>
            
            <button 
              type="button" 
              className={styles.secondaryBtn} 
              onClick={() => setStep(1)}
              style={{marginTop: '10px'}}
            >
              Back to Details
            </button>
          </form>
        </>
      )}

      {/* --- Footer (Only on Step 1) --- */}
      {step === 1 && (
        <div className={styles.footerText}>
          Already have an account? 
          <button className={styles.linkBtn} onClick={onSwitchToLogin}>
            Sign in
          </button>
        </div>
      )}
    </div>
  );
};

export default SignupForm;