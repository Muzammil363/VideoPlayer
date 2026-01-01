import React, { useState } from 'react';
import styles from '../../styles/Auth.module.css';

import { useNavigate } from 'react-router-dom';

const LoginForm = ({ onSwitchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  /*
    Form submission 
    calls /auth/login 
  */
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Logging in with:", { email, password });
    try {
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      console.log("Login response:", data); // To be removed later
      if(data.success){
        navigate('/');
      }
      else {
        alert("Login failed");
        // Add toast later
      }

    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleForgotPassword = () => {
    alert("Redirect to Forgot Password Flow (Enter Email -> OTP -> New Pass)");
  };

  return (
    <div className={styles.card}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>▶</span> TubeApp
      </div>
      <h2 className={styles.title}>Sign in</h2>
      <p className={styles.subtitle}>to continue to TubeApp</p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Email</label>
          <input 
            type="email" 
            required 
            className={styles.input} 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>Password</label>
          <input 
            type="password" 
            required 
            className={styles.input} 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className={styles.forgotPassword}>
          <button type="button" className={styles.secondaryBtn} onClick={handleForgotPassword}>
            Forgot password?
          </button>
        </div>

        <button type="submit" className={styles.primaryBtn}>
          Sign In
        </button>
      </form>

      <div className={styles.footerText}>
        Not your computer? Use Guest mode to sign in privately. <br/><br/>
        Don't have an account? 
        <button className={styles.linkBtn} onClick={onSwitchToSignup}>
          Create account
        </button>
      </div>
    </div>
  );
};

export default LoginForm;