import React,{useState,useEffect} from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';

import styles from '../../styles/Home.module.css';

import { profileActions } from '../../Redux/store.js';

const TopBar = ({ toggleSidebar,query='' }) => {
  const[searchQuery,setSearchQuery]=useState(query);
  const isloggedIn = useSelector((state) => state.auth.isAuthenticated);
  const profile = useSelector((state) => state.profile.profileData);
  // console.log("profile: ",profile);

  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
  }
  const handleSearchClick = () => {
    // Implement search functionality here
    if(searchQuery.trim() !== "") {
      navigate(`/search/${searchQuery}`);
    } else {
      toast.error("Nothing to search");
    }

    console.log("Search button clicked");
  }

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        {/* Burger Button */}
        <button className={styles.burgerBtn} onClick={toggleSidebar}>
          <svg viewBox="0 0 24 24" height="24" width="24" focusable="false" style={{ display: 'block', fill: 'currentColor' }}>
            <path d="M21 6H3V5h18v1zm0 5H3v1h18v-1zm0 6H3v1h18v-1z"></path>
          </svg>
        </button>

        {/* Logo */}
        <div className={styles.logo}>
          <span style={{ color: 'red' }}>
            <svg viewBox="0 0 24 24" height="24" width="24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"></path>
            </svg>
          </span>
          <span>VideoPlayer</span>
        </div>
      </div>

      {/* Search Container */}
      <div className={styles.searchContainer}>
        <input type="text" placeholder="Search" className={styles.searchInput} value={searchQuery} onChange={handleInputChange} />

        <button className={styles.searchButton} onClick={handleSearchClick}>
          <svg viewBox="0 0 24 24" height="24" width="24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path></svg>
        </button>
      </div>

      {isloggedIn ? <NavLink to={'/u/profile'}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ width: 32, height: 32, background: 'purple', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {profile?.username ? profile.username.charAt(0).toUpperCase() : 'U'}
          </div>
        </div>
      </NavLink> :
      <NavLink to={'/auth'}>
        <button className={styles.primaryBtn}>
          <svg viewBox="0 0 24 24" height="24" width="24" fill="currentColor" style={{ marginRight: '8px' }}><path d="M10 17v-2h4v2h5v-4h3L12 3 2 13h3v4zM4 18h16v2H4z"></path></svg>
          Sign In
        </button>
      </NavLink>}
    </header>
  );
};

export default TopBar;