let createClient = null;
try {
  const redisModule = require('redis');
  createClient = redisModule.createClient;
} catch (err) {
  // Graceful fallback if redis or @redis/client module is missing
}
const logger = require('./logger');

let pubClient = null;
let subClient = null;
let isConnected = false;

/**
 * Initialize Valkey/Redis Pub/Sub clients for Socket.IO multi-instance scaling
 */
async function initValkeyClients() {
  if (!createClient) {
    logger.warn('[Socket.IO Adapter] redis package or @redis/client module not available. Valkey adapter disabled.');
    return { pubClient: null, subClient: null, isConnected: false };
  }

  const rawUrl = process.env.REDIS_URL || process.env.VALKEY_URL || 'rediss://gharkapaisa-messenger-i7mh8d.serverless.aps1.cache.amazonaws.com:6379';
  
  let url = rawUrl.trim();
  if (!url.startsWith('redis://') && !url.startsWith('rediss://')) {
    url = `rediss://${url}`;
  }

  logger.info('[Socket.IO Adapter] Connecting to Valkey...');

  try {
    pubClient = createClient({
      url,
      socket: {
        tls: url.startsWith('rediss://'),
        reconnectStrategy: (retries) => {
          const delay = Math.min(retries * 500, 5000);
          logger.warn(`[Socket.IO Adapter] Valkey reconnecting in ${delay}ms (attempt ${retries})`);
          return delay;
        }
      }
    });

    pubClient.on('error', (err) => {
      logger.error('[Socket.IO Adapter] Valkey Pub Client Error:', err.message);
    });

    subClient = pubClient.duplicate();
    subClient.on('error', (err) => {
      if (err && err.message && err.message.includes("unknown command 'psubscribe'")) {
        logger.warn('[Socket.IO Adapter] Valkey instance does not support PSUBSCRIBE command (pattern matching disabled/restricted). Setting sharded or fallback adapter mode.');
      } else {
        logger.error('[Socket.IO Adapter] Valkey Sub Client Error:', err.message);
      }
    });

    await Promise.all([pubClient.connect(), subClient.connect()]);

    isConnected = true;
    logger.info('[Socket.IO Adapter] Valkey connected');
    logger.info('[Socket.IO Adapter] Pub/Sub ready');

    return { pubClient, subClient, isConnected: true };
  } catch (err) {
    logger.error('[Socket.IO Adapter] Failed to connect to Valkey:', err.message);
    isConnected = false;
    // In production or when REDIS_URL is explicitly set, fail-closed if adapter initialization fails
    if (process.env.NODE_ENV === 'production' || process.env.REDIS_URL) {
      throw new Error(`CRITICAL: Valkey adapter connection failed: ${err.message}`);
    }
    return { pubClient: null, subClient: null, isConnected: false };
  }
}

function getValkeyStatus() {
  return isConnected;
}

async function closeValkeyClients() {
  try {
    if (pubClient) {
      await pubClient.quit();
      pubClient = null;
    }
    if (subClient) {
      await subClient.quit();
      subClient = null;
    }
    isConnected = false;
    logger.info('[Socket.IO Adapter] Valkey clients closed safely.');
  } catch (err) {
    logger.error('[Socket.IO Adapter] Error closing Valkey clients:', err.message);
  }
}

module.exports = {
  initValkeyClients,
  getValkeyStatus,
  closeValkeyClients
};
