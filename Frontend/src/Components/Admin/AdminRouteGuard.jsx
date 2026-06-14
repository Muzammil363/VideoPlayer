import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../../styles/Admin.module.css';

const AdminRouteGuard = ({ error, children }) => {
  if (!error) return children;

  return (
    <div className={styles.accessPage}>
      <div className={styles.accessPanel}>
        <p className={styles.eyebrow}>Admin</p>
        <h1>Admin access required</h1>
        <p>{error.message || 'You need an admin account to view this dashboard.'}</p>
        <Link className={styles.primaryButton} to="/auth">Login as admin</Link>
      </div>
    </div>
  );
};

export default AdminRouteGuard;
