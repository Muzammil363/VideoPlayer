import React, { useState, useEffect} from 'react';
import styles from '../styles/Search.module.css';
import { useParams } from 'react-router-dom';

import TopBar from '../components/Home/TopBar';
import Sidebar from '../components/Home/Sidebar';
import SearchContent from '../Components/Search/SearchContent.jsx';

const SearchPage = () => {
  const params = useParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [videos, setVideos] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsMobile(true);
        setIsSidebarOpen(false);
      } else {
        setIsMobile(false);
        setIsSidebarOpen(true);
      }
    };
    handleResize(); 
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  async function fetchSearch(q) {
    try {
      const res = await fetch(`http://localhost:3000/stream/search/${encodeURIComponent(q)}`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await res.json();
      console.log('Search response:', data);
      setVideos(data.videos || []);
      setSearchQuery(q || '');
    } catch (err) {
      console.error('Search fetch error:', err);
    }
  }

  useEffect(() => {
    const qFromParams = params.searchQuery || params.query;
    if (qFromParams) {
      fetchSearch(qFromParams);
      return;
    }
    const paramsUrl = new URLSearchParams(window.location.search);
    const q = paramsUrl.get('q');
    if (q) fetchSearch(q);
  }, [params]);

  return (
    <div className={`${styles.container} ${!isSidebarOpen && !isMobile ? styles.containerClosed : ''}`}>
      
      {/* Note: The TopBar contains the search input. 
        Once routing is added, typing in TopBar will redirect to /search?q=value 
      */}
      <TopBar toggleSidebar={toggleSidebar} query={params.searchQuery} />

      <div style={{gridArea: 'sidebar'}}> 
         {(isSidebarOpen || !isMobile) && <Sidebar />}
      </div>

      {/* Render the actual search results */}
      <SearchContent videos={videos} searchQuery={searchQuery} />

    </div>
  );
};

export default SearchPage;