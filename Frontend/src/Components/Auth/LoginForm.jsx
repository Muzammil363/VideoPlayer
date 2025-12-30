import React, { useState } from 'react';
import styles from '../../styles/Auth.module.css';

const LoginForm = ({ onSwitchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Logging in with:", { email, password });
    // TODO: Call Login API
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