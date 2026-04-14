import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { authActions, profileActions } from '../Redux/store';
import VideoGrid from '../components/Home/VideoGrid';

const mockVideos = [
  { id: 1, title: "Building a YouTube Clone in React", channel: "Code Master", views: "120K views", time: "2 days ago", duration: "12:05" },
  { id: 2, title: "Top 10 CSS Tricks for 2025", channel: "Design Pro", views: "54K views", time: "5 hours ago", duration: "08:30" },
  { id: 3, title: "Learn Backend Development", channel: "Dev Guide", views: "1M views", time: "1 year ago", duration: "45:00" },
  { id: 4, title: "Music Mix 2025 for Coding", channel: "Lofi Beats", views: "300K views", time: "1 week ago", duration: "1:20:00" },
  { id: 5, title: "React Router v7 Tutorial", channel: "Frontend Daily", views: "10K views", time: "3 hours ago", duration: "15:45" },
  { id: 6, title: "Understanding System Design", channel: "Tech Architect", views: "85K views", time: "1 month ago", duration: "22:10" },
  { id: 7, title: "Why I switched to Linux", channel: "OS Explorer", views: "500K views", time: "3 weeks ago", duration: "10:05" },
  { id: 8, title: "Gaming Setup Tour", channel: "Gamer Life", views: "2M views", time: "2 months ago", duration: "14:20" },
];

const HomePage = () => {
  const [videos, setVideos] = useState(mockVideos);
  const dispatch = useDispatch();

  // API call to fetch videos
  useEffect(() => {
    async function fetchVideos() {
      try {
        const response = await fetch('http://localhost:3000/stream/videos/0', {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          }
        }); // page number 1 for now
        const data = await response.json();
        if(data.success){
          // Handle video data (e.g., set state)
          // store update with data.user.username
          // Move this to RootLayout later
          setVideos((prev)=>([...prev,...data.videos]));
          
          if(data.user != null) {
            dispatch(authActions.login());
            dispatch(profileActions.setProfileData(data.user));
          }
          else {
            dispatch(authActions.logout());
          }
        }
        console.log("Fetched videos:", data); // To be removed later
      } catch (error) {
        console.error("Error fetching videos:", error);
      }
    }
    fetchVideos();
  }, []);
  

  return <VideoGrid videos={videos} />;
};

export default HomePage;