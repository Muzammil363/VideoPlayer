import { formatDistanceToNowStrict, parseISO } from 'date-fns';

export const formatNumber = (value = 0) => new Intl.NumberFormat('en-US').format(Number(value) || 0);

export const formatBytes = (bytes = 0) => {
  const size = Number(bytes) || 0;
  if (size <= 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  return `${(size / (1024 ** index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

export const formatDateTime = (value) => {
  if (!value) return '-';

  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return '-';
  }
};

export const formatRelative = (value) => {
  if (!value) return '-';

  try {
    return formatDistanceToNowStrict(parseISO(value), { addSuffix: true });
  } catch (error) {
    return '-';
  }
};

export const truncateMiddle = (value = '', maxLength = 34) => {
  const text = String(value || '');
  if (text.length <= maxLength) return text || '-';

  const sideLength = Math.floor((maxLength - 3) / 2);
  return `${text.slice(0, sideLength)}...${text.slice(-sideLength)}`;
};
