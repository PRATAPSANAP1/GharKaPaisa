import { useCallback } from 'react';

/**
 * Reusable localStorage cache hook for client-side caching
 * @param {string} prefix - Cache key prefix
 * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
 */
export function useLocalStorageCache(prefix, ttl = 5 * 60 * 1000) {
  const getCache = useCallback((key) => {
    try {
      const cached = localStorage.getItem(`${prefix}${key}`);
      if (!cached) return null;
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > ttl) {
        localStorage.removeItem(`${prefix}${key}`);
        return null;
      }
      return data;
    } catch (err) {
      return null;
    }
  }, [prefix, ttl]);

  const setCache = useCallback((key, data) => {
    try {
      localStorage.setItem(`${prefix}${key}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.warn('Failed to set cache:', err);
    }
  }, [prefix]);

  const clearCache = useCallback((keyPattern = null) => {
    try {
      if (keyPattern) {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith(prefix) && key.includes(keyPattern)) {
            localStorage.removeItem(key);
          }
        });
      } else {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith(prefix)) {
            localStorage.removeItem(key);
          }
        });
      }
    } catch (err) {
      console.warn('Failed to clear cache:', err);
    }
  }, [prefix]);

  return { getCache, setCache, clearCache };
}
