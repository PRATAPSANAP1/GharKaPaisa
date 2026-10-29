const logger = require('../config/logger');

let redisClient = null;
let cacheEnabled = false;
let activeProvider = 'disabled'; // 'redis' | 'memory' | 'disabled'

// In-memory store used as fallback for local dev & unit tests when Redis is unavailable
const memoryStore = new Map();

/**
 * Timeout wrapper to bound cache latency and prevent request hanging
 */
const withTimeout = (promise, ms = 250) => {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Cache operation timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
};

/**
 * Clean expired keys from in-memory fallback store
 */
const cleanExpiredMemoryKeys = () => {
  const now = Date.now();
  for (const [k, v] of memoryStore.entries()) {
    if (v.expiresAt <= now) {
      memoryStore.delete(k);
    }
  }
};

/**
 * Initialize Redis cache client for general caching (separate from Socket.IO pub/sub)
 */
async function initCacheClient() {
  const isTest = process.env.NODE_ENV === 'test' || process.env.SKIP_REMOTE_CACHE === 'true';
  const hasExplicitRedisUrl = Boolean(process.env.REDIS_URL || process.env.VALKEY_URL);

  // In test mode or when no explicit Redis URL is provided outside production, use local memory cache
  // to avoid attempting network connections to AWS resources (Strict Safety Requirement 1)
  if (isTest || (!hasExplicitRedisUrl && process.env.NODE_ENV !== 'production')) {
    cacheEnabled = true;
    activeProvider = 'memory';
    logger.info('[Cache] Local in-memory cache initialized (test/dev mode). Multi-worker production requires Redis.');
    return true;
  }

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
        connectTimeout: 3000,
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            logger.warn('[Cache] Max Redis reconnect attempts reached. Switching to local memory cache fallback.');
            activeProvider = 'memory';
            return false;
          }
          const delay = Math.min(retries * 500, 3000);
          logger.warn(`[Cache] Redis reconnecting in ${delay}ms (attempt ${retries})`);
          return delay;
        }
      }
    });

    redisClient.on('error', (err) => {
      logger.error('[Cache] Redis Client Error:', err.message);
      if (activeProvider === 'redis' && (!redisClient || !redisClient.isOpen)) {
        activeProvider = 'memory';
      }
    });

    redisClient.on('ready', () => {
      activeProvider = 'redis';
      cacheEnabled = true;
      logger.info('[Cache] Redis cache client ready');
    });

    await withTimeout(redisClient.connect(), 4000);
    cacheEnabled = true;
    activeProvider = 'redis';
    logger.info('[Cache] Redis cache client connected');
    return true;
  } catch (err) {
    logger.warn('[Cache] Failed to connect to Redis cache:', err.message);
    // In local development or test mode, enable in-memory store so caching functions reliably
    cacheEnabled = true;
    activeProvider = 'memory';
    logger.info('[Cache] Local in-memory cache enabled as fallback. Note: In multi-worker production, Redis is required for cross-worker consistency.');
    return true;
  }
}

/**
 * Get value from cache (bounded with safe timeout)
 */
async function get(key) {
  if (!cacheEnabled) return null;

  if (activeProvider === 'redis' && redisClient && redisClient.isOpen) {
    try {
      const value = await withTimeout(redisClient.get(key), 250);
      return value ? JSON.parse(value) : null;
    } catch (err) {
      logger.warn(`[Cache] Error getting key ${key} from Redis: ${err.message}. Checking memory fallback.`);
    }
  }

  // Memory store fallback
  const item = memoryStore.get(key);
  if (!item) return null;
  if (item.expiresAt <= Date.now()) {
    memoryStore.delete(key);
    return null;
  }
  return item.value;
}

/**
 * Set value in cache with TTL (seconds)
 */
async function set(key, value, ttlSeconds = 300) {
  if (!cacheEnabled) return false;

  let redisOk = false;
  if (activeProvider === 'redis' && redisClient && redisClient.isOpen) {
    try {
      await withTimeout(redisClient.setEx(key, ttlSeconds, JSON.stringify(value)), 500);
      redisOk = true;
    } catch (err) {
      logger.warn(`[Cache] Error setting key ${key} in Redis: ${err.message}. Storing in memory fallback.`);
    }
  }

  // Keep in memory store if in memory mode or if Redis failed
  if (activeProvider === 'memory' || !redisOk) {
    cleanExpiredMemoryKeys();
    // Cap memory store at 1000 items to prevent heap bloat
    if (memoryStore.size >= 1000) {
      const oldestKey = memoryStore.keys().next().value;
      if (oldestKey) memoryStore.delete(oldestKey);
    }
    memoryStore.set(key, {
      value,
      expiresAt: Date.now() + (ttlSeconds * 1000)
    });
    return true;
  }

  return redisOk;
}

/**
 * Delete key from cache
 */
async function del(key) {
  if (!cacheEnabled) return false;
  memoryStore.delete(key);

  if (activeProvider === 'redis' && redisClient && redisClient.isOpen) {
    try {
      await withTimeout(redisClient.del(key), 500);
      return true;
    } catch (err) {
      logger.error(`[Cache] Error deleting key ${key} from Redis:`, err.message);
      return false;
    }
  }
  return true;
}

/**
 * Delete multiple keys by pattern
 */
async function delPattern(pattern) {
  if (!cacheEnabled) return false;

  // Clear matching keys in memoryStore
  try {
    const regexPattern = new RegExp('^' + pattern.replace(/[*]/g, '.*') + '$');
    for (const k of memoryStore.keys()) {
      if (regexPattern.test(k)) {
        memoryStore.delete(k);
      }
    }
  } catch (memErr) {
    logger.warn('[Cache] Memory pattern clear warning:', memErr.message);
  }

  if (activeProvider === 'redis' && redisClient && redisClient.isOpen) {
    try {
      const keysToDelete = [];
      if (typeof redisClient.scanIterator === 'function') {
        for await (const key of redisClient.scanIterator({ MATCH: pattern, COUNT: 100 })) {
          keysToDelete.push(key);
          if (keysToDelete.length >= 250) {
            await redisClient.del(keysToDelete);
            keysToDelete.length = 0;
          }
        }
        if (keysToDelete.length > 0) {
          await redisClient.del(keysToDelete);
        }
      } else {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          await redisClient.del(keys);
        }
      }
      return true;
    } catch (err) {
      logger.error(`[Cache] Error deleting pattern ${pattern} from Redis:`, err.message);
      return false;
    }
  }
  return true;
}

/**
 * Check if cache is enabled
 */
function isEnabled() {
  return cacheEnabled;
}

function getProvider() {
  return activeProvider;
}

function clearMemoryStore() {
  memoryStore.clear();
}

module.exports = {
  initCacheClient,
  get,
  set,
  del,
  delPattern,
  isEnabled,
  getProvider,
  clearMemoryStore
};
