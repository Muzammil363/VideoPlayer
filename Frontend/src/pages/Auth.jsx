import React, { useState } from 'react';
import LoginForm from '../Components/Auth/LoginForm';
import SignupForm from '../Components/Auth/SignupForm';
import styles from '../styles/Auth.module.css';

const AuthPage = () => {
  // 'login' or 'signup'
  const [view, setView] = useState('login'); 

  return (
    <div className={styles.container}>
      {view === 'login' ? (
        <LoginForm onSwitchToSignup={() => setView('signup')} />
      ) : (
        <SignupForm onSwitchToLogin={() => setView('login')} />
      )}
    </div>
  );
};

export default AuthPage;