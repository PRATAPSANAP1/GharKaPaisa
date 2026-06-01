import { DIFFICULTY_COLORS, SUBMISSION_STATUS } from './constants';

export const formatDate = (date, options = {}) => {
  if (!date) return 'N/A';

  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };

  try {
    return new Date(date).toLocaleDateString('en-US', defaultOptions);
  } catch {
    return 'Invalid Date';
  }
};

export const formatDateTime = (date) => {
  if (!date) return 'N/A';
  try {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Invalid Date';
  }
};

export const formatTime = (seconds) => {
  if (seconds == null || seconds < 0) return '00:00';

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const getInitials = (name) => {
  if (!name) return '?';

  return name
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '...';
};

export const calculatePercentage = (obtained, total, decimals = 1) => {
  if (!total || total === 0) return 0;
  const pct = (obtained / total) * 100;
  return Number(pct.toFixed(decimals));
};

export const getDifficultyColor = (difficulty) => {
  const key = difficulty?.toLowerCase();
  return DIFFICULTY_COLORS[key] || DIFFICULTY_COLORS.medium;
};

export const getStatusColor = (status) => {
  const key = status?.toUpperCase()?.replace(/\s+/g, '_');
  return SUBMISSION_STATUS[key] || SUBMISSION_STATUS.PENDING;
};

export const debounce = (func, wait = 300) => {
  let timeoutId;

  const debounced = (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  };

  debounced.cancel = () => {
    clearTimeout(timeoutId);
  };

  return debounced;
};

export const timeAgo = (date) => {
  if (!date) return '';

  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(date);
};

export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const formatNumber = (num) => {
  if (num == null) return '0';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return num.toString();
};

export const getAvatarColor = (name) => {
  const colors = [
    'from-blue-500 to-indigo-600',
    'from-purple-500 to-pink-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-red-600',
    'from-cyan-500 to-blue-600',
    'from-violet-500 to-purple-600',
    'from-fuchsia-500 to-pink-600',
  ];

  if (!name) return colors[0];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

export const buildQueryString = (params) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, value);
    }
  });
  return searchParams.toString();
};

