import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';

import styles from '../../styles/Home.module.css';

import { authActions } from '../../Redux/store';

// SVG Path Data for cleanliness
const icons = {
  Home: "M4 10v7h3v-7l5-5 5 5v7h3v-7l2 2-7-7-7 7zm14 7h-3v-4h-6v4H5v-9.17l7-7 7 7V17z",
  Library: "M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zM12 5.5v9l6-4.5z",
  History: "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z",
  MyChannel: "M3 5v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.11 0-2 .9-2 2zm12 4c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zm-9 8c0-2 4-3.1 6-3.1s6 1.1 6 3.1v1H6v-1z",
  Logout: "M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"
};

const Sidebar = () => {

  const isLoggedIn = useSelector((state) => state.auth.isAuthenticated);

  const menuItems = [
    { name: 'Home', icon: icons.Home, active: true, url: '/' },
    { name: 'Library', icon: icons.Library, active: false, url: '/u/library' },
    { name: 'History', icon: icons.History, active: false, url: '/u/history' },
    { name: 'My Channel', icon: icons.MyChannel, active: false, url: '/u/myChannel' },
    { name: 'Logout', icon: icons.Logout, active: false, url: '/' },
  ];

  return (
    <aside className={styles.sidebar}>

      {isLoggedIn ? menuItems.map((item) => (
        <NavLink to={item.url ? item.url : '#'} key={item.name} className={`${item.active ? styles.active : ''}`}>
          <div key={item.name} className={`${styles.navItem} ${item.active ? styles.active : ''}`}>
            <svg className={styles.iconSvg} viewBox="0 0 24 24">
              <path d={item.icon} />
            </svg>
            <span>{item.name}</span>
          </div>
        </NavLink>
      ))
        :
        <NavLink to={'/auth'}>
          <div style={{"display":"flex","flexDirection":"column",gap:"10px",marginTop:"30px"}}>
            <h4>Please sign in to explore more</h4>
            <button className={styles.navItem} style={{"display":"flex",justifyContent:"center",alignItems:"center"}}>
              Sign In
            </button>
          </div>
        </NavLink>
      }
    </aside>
  );
};

export default Sidebar;