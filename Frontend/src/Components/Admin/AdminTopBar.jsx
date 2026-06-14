import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../../styles/Admin.module.css';

const AdminTopBar = ({ onMenuClick }) => (
  <header className={styles.topbar}>
    <button type="button" className={styles.menuButton} onClick={onMenuClick} aria-label="Toggle admin menu">
      =
    </button>
    <div>
      <div className={styles.topbarTitle}>Admin Dashboard</div>
      <div className={styles.topbarMeta}>Pipeline, queue, and storage operations</div>
    </div>
    <Link className={styles.secondaryButton} to="/">Back to app</Link>
  </header>
);

export default AdminTopBar;
