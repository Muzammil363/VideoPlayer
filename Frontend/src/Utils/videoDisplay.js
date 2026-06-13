import { formatDistanceToNowStrict, parseISO } from 'date-fns';

const objectIdPattern = /^[a-f\d]{24}$/i;
export const CHANNEL_COLORS = ['#6b21a8', '#0f766e', '#1d4ed8', '#be123c', '#374151'];

export const getVideoId = (video) => video?.id || video?._id || video?.videoId?._id || video?.videoId;

export const getChannelName = (video) => {
  const channel = video?.channel;
  const name = video?.channelName || channel?.name || video?.uploadedBy?.username;

  if (name && !objectIdPattern.test(String(name))) return name;
  if (typeof channel === 'string' && !objectIdPattern.test(channel)) return channel;

  return 'Unknown channel';
};

const getStableColorIndex = (value = '') => {
  const text = String(value || '');
  let hash = 0;

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash + text.charCodeAt(index) * (index + 1)) % CHANNEL_COLORS.length;
  }

  return hash;
};

export const getChannelAvatarColor = (video) => {
  const color = video?.channelAvatarColor || video?.channel?.avatarColor;
  if (CHANNEL_COLORS.includes(color)) return color;

  return CHANNEL_COLORS[getStableColorIndex(getChannelName(video) || getVideoId(video))];
};

export const getChannelInitial = (video) => {
  const name = getChannelName(video);
  return name ? name.charAt(0).toUpperCase() : 'U';
};

export const formatViews = (views = 0) => {
  if (typeof views === 'string') {
    const trimmed = views.trim();
    if (!trimmed) return '0 views';
    return trimmed.toLowerCase().includes('view') ? trimmed : `${trimmed} views`;
  }

  const count = Number(views) || 0;

  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M views`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K views`;

  return `${count} ${count === 1 ? 'view' : 'views'}`;
};

export const formatRelativeTime = (value, fallback = '') => {
  if (!value) return fallback;

  try {
    return formatDistanceToNowStrict(parseISO(value), { addSuffix: true });
  } catch (error) {
    return fallback;
  }
};
