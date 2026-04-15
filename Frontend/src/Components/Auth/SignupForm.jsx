import React, { useState } from 'react';
import styles from '../../styles/Auth.module.css';
import { toast } from 'react-hot-toast';

import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  // --- Handlers ---
  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Step 1: Validate & Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }
    // API Call Simulation

    try {
      const response=await fetch("http://localhost:3000/auth/signup",{
        method:"POST",
        credentials:"include",
        headers:{
          "Content-Type":"application/json",
        },
        body:JSON.stringify(formData)
      });
      const data=await response.json();
      console.log("Signup Response: ",data); // To be removed later

      if(data.success){
        toast.success("OTP Sent to your email (use 1234 as OTP for testing)");
        setStep(2);
      }
      else {
        toast.error("Signup failed");
      }
    } catch (error) {
      console.log("Error at sendOTP: ",error);
    }
    console.log("Sending OTP to:", formData.email);
    toast.success(`OTP Sent to ${formData.email} (Check console/use 1234)`);
    setStep(2);
  };

  // Step 2: Verify & Submit
  const handleVerifyAndSignup = async (e) => {
    e.preventDefault();
    // API Call 

    try {
      let response=await fetch("http://localhost:3000/auth/verify-email",{
        method:"POST",
        credentials:"include",
        headers:{
          "Content-Type":"application/json",
        },
        body:JSON.stringify({ email: formData.email, code:otp })
      });
      const data=await response.json();
      console.log("Verify OTP Response: ",data); // To be removed later 

      if(data.success) {
        toast.success("Account Created Successfully! Please Login.");
        navigate('/');
      } else {
        toast.error("Invalid OTP. Please try again.");
      }
    } catch (error) {
      console.log("Error at verify: ",error);
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
                maxLength="6"
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