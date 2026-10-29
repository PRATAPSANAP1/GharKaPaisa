const logger = require('../config/logger');

let redisClient = null;
let cacheEnabled = false;

/**
 * Initialize Redis cache client for general caching (separate from Socket.IO pub/sub)
 */
async function initCacheClient() {
  try {
    const redisModule = require('redis');
    const createClient = redisModule.createClient;

    const rawUrl = process.env.REDIS_URL || process.env.VALKEY_URL || 'rediss://gharkapaisa-messenger-i7mh8d.serverless.aps1.cache.amazonaws.com:6379';
    let url = rawUrl.trim();
    if (!url.startsWith('redis://') && !url.startsWith('rediss://')) {
      url = `rediss://${url}`;
    }

    redisClient = createClient({
      url,
      socket: {
        tls: url.startsWith('rediss://'),
        reconnectStrategy: (retries) => {
          const delay = Math.min(retries * 500, 5000);
          logger.warn(`[Cache] Redis reconnecting in ${delay}ms (attempt ${retries})`);
          return delay;
        }
      }
    });

    redisClient.on('error', (err) => {
      logger.error('[Cache] Redis Client Error:', err.message);
    });

    await redisClient.connect();
    cacheEnabled = true;
    logger.info('[Cache] Redis cache client connected');
    return true;
  } catch (err) {
    logger.warn('[Cache] Failed to connect to Redis cache:', err.message);
    cacheEnabled = false;
    // Don't fail - app should work without cache
    return false;
  }
}

/**
 * Get value from cache
 */
async function get(key) {
  if (!cacheEnabled || !redisClient) return null;
  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (err) {
    logger.error(`[Cache] Error getting key ${key}:`, err.message);
    return null;
  }
}

/**
 * Set value in cache with TTL (seconds)
 */
async function set(key, value, ttlSeconds = 300) {
  if (!cacheEnabled || !redisClient) return false;
  try {
    await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (err) {
    logger.error(`[Cache] Error setting key ${key}:`, err.message);
    return false;
  }
}

/**
 * Delete key from cache
 */
async function del(key) {
  if (!cacheEnabled || !redisClient) return false;
  try {
    await redisClient.del(key);
    return true;
  } catch (err) {
    logger.error(`[Cache] Error deleting key ${key}:`, err.message);
    return false;
  }
}

/**
 * Delete multiple keys by pattern
 */
async function delPattern(pattern) {
  if (!cacheEnabled || !redisClient) return false;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return true;
  } catch (err) {
    logger.error(`[Cache] Error deleting pattern ${pattern}:`, err.message);
    return false;
  }
}

/**
 * Check if cache is enabled
 */
function isEnabled() {
  return cacheEnabled;
}

module.exports = {
  initCacheClient,
  get,
  set,
  del,
  delPattern,
  isEnabled
};
