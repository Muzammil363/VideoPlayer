import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from '../../styles/Admin.module.css';

const items = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/videos', label: 'Videos' },
  { to: '/admin/jobs', label: 'Jobs' },
  { to: '/admin/uploads', label: 'Upload Sessions' },
  { to: '/admin/storage', label: 'Storage Health' },
];

const AdminSidebar = () => (
  <aside className={styles.sidebar}>
    <div className={styles.brandBlock}>
      <div className={styles.brandMark}>SF</div>
      <div>
        <div className={styles.brandName}>StreamForge</div>
        <div className={styles.brandSub}>Operations</div>
      </div>
    </div>

    <nav className={styles.adminNav}>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  </aside>
);

export default AdminSidebar;
