import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../../styles/Search.module.css';

// Mock Search Results (used only when there are no results)
const mockSearchResults = [
  {
    id: "v1",
    title: "React Tutorial for Beginners - Full Course 2025",
    channel: "Code Mastery",
    views: "1.2M",
    time: "2 months ago",
    duration: "2:15:30",
    description: "Learn React from scratch in this comprehensive full course. We cover components, state, props, hooks, and build a fully functional application.",
  },
  {
    id: "v2",
    title: "10 React Anti-Patterns to Avoid",
    channel: "Frontend Daily",
    views: "450K",
    time: "1 week ago",
    duration: "14:20",
    description: "Stop writing bad React code! Here are 10 common mistakes developers make and how to fix them using modern React features and clean architecture.",
  },
  {
    id: "v3",
    title: "Building a YouTube Clone Layout with CSS Grid",
    channel: "Design Pro",
    views: "85K",
    time: "3 days ago",
    duration: "22:15",
    description: "CSS Grid makes complex layouts simple. Let's build the complete YouTube UI including the sidebar, header, and responsive video grid.",
  },
  {
    id: "v4",
    title: "Why Redux is dead in 2025 (Use this instead)",
    channel: "Tech Lead",
    views: "200K",
    time: "1 month ago",
    duration: "10:05",
    description: "Is Redux finally dead? We explore Zustand, Jotai, and native React Context to see what the best state management solution is right now.",
  }
];

const SearchContent = ({ videos = [], searchQuery = '' }) => {

  const results = Array.isArray(videos) ? videos : [];

  return (
    <div className={styles.contentArea}>
      {/* Results List */}
      <div className={styles.resultsList}>
        {results.length > 0 ? (
          results.map((video) => (
            <Link
              to={video.id ? `/video/${video.id}` : `/video/${video._id}`}
              key={video._id || video.id}
              className={styles.videoLink}
            >
              <div className={styles.videoCard}>

                {/* Thumbnail (placeholder) */}
                <div className={styles.thumbnailContainer}>
                  <img 
                    src={`https://picsum.photos/seed/${video._id || video.id}/720/404`} 
                    alt="thumbnail" 
                    className={styles.thumbnailImage} 
                  />
                </div>

                {/* Video Details */}
                <div className={styles.details}>
                  <h3 className={styles.title}>{video.title}</h3>
                  <span className={styles.meta}>{video.likesCount ? `${video.likesCount} likes` : ''} {video.channel ? `• ${video.channel}` : ''}</span>
                  
                  <div className={styles.channelInfo}>
                    <div className={styles.channelAvatar}>
                      {video.channel ? video.channel.charAt(0) : 'C'}
                    </div>
                    <span className={styles.channelName}>{video.channel || 'Unknown channel'}</span>
                  </div>

                </div>

              </div>
            </Link>
          ))
        ) : (
          <div className={styles.emptyMessage}>
            No results found{searchQuery ? ` for "${searchQuery}"` : ''}. Try different keywords.
          </div>
        )}
      </div>

    </div>
  );
};

export default SearchContent;