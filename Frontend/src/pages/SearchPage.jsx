import React, { useState, useEffect} from 'react';
import { useParams } from 'react-router-dom';

import SearchContent from '../Components/Search/SearchContent.jsx';

const SearchPage = () => {
  const params = useParams();
  const [videos, setVideos] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  async function fetchSearch(q) {
    try {
      const res = await fetch(`http://localhost:3000/stream/search/${encodeURIComponent(q)}`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await res.json();
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
    <SearchContent videos={videos} searchQuery={searchQuery} />
  );
};

export default SearchPage;
