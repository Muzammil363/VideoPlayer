import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../../styles/Search.module.css';
import { formatViews, getChannelAvatarColor, getChannelInitial, getChannelName } from '../../Utils/videoDisplay';

const SearchContent = ({ videos = [], searchQuery = '' }) => {
  const results = Array.isArray(videos) ? videos : [];

  return (
    <div className={styles.contentArea}>
      <div className={styles.resultsList}>
        {results.length > 0 ? (
          results.map((video) => {
            const videoId = video._id || video.id;
            const channelName = getChannelName(video);
            const channelInitial = getChannelInitial(video);
            const channelAvatarColor = getChannelAvatarColor(video);
            const thumbnailSrc = video.thumbnailUrl
              || video.thumbnailPath
              || `https://picsum.photos/seed/${videoId}/720/404`;

            return (
              <Link
                to={`/video/${videoId}`}
                key={videoId}
                className={styles.videoLink}
              >
                <div className={styles.videoCard}>
                  <div className={styles.thumbnailContainer}>
                    <img
                      src={thumbnailSrc}
                      alt={video.title || 'Video thumbnail'}
                      className={styles.thumbnailImage}
                    />
                  </div>

                  <div className={styles.details}>
                    <h3 className={styles.title}>{video.title}</h3>
                    <span className={styles.meta}>
                      {formatViews(video.views)}
                      {typeof video.likesCount === 'number' ? ` • ${video.likesCount} likes` : ''}
                    </span>

                    <div className={styles.channelInfo}>
                      <div className={styles.channelAvatar} style={{ backgroundColor: channelAvatarColor }}>
                        {channelInitial}
                      </div>
                      <span className={styles.channelName}>{channelName}</span>
                    </div>

                    {video.description && (
                      <p className={styles.descriptionSnippet}>{video.description}</p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })
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
