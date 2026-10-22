const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { Pool } = require('pg');
const logger = require('./logger');

const isProduction = process.env.NODE_ENV === 'production';

const sslConfig = (isProduction || process.env.DB_SSL === 'true')
  ? { rejectUnauthorized: false }
  : false;

const poolOptions = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: sslConfig,
    }
  : {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: sslConfig,
    };

// Enhanced Connection Pool Settings for High Availability and Connection Resiliency
poolOptions.max = Math.max(parseInt(process.env.DB_POOL_MAX) || 40, 30);
poolOptions.min = (process.env.NODE_ENV === 'test' || process.env.SKIP_DB === 'true') ? 0 : (parseInt(process.env.DB_POOL_MIN) || 2);
poolOptions.idleTimeoutMillis = parseInt(process.env.DB_IDLE_TIMEOUT) || parseInt(process.env.DB_IDLE_TIMEOUT_MS) || 30000;
// Enforce minimum 20000ms safe floor for connectionTimeoutMillis to protect against burst queueing
const envConnTimeout = parseInt(process.env.DB_CONN_TIMEOUT) || parseInt(process.env.DB_CONNECTION_TIMEOUT_MS) || 20000;
poolOptions.connectionTimeoutMillis = Math.max(envConnTimeout, 20000);
poolOptions.acquireTimeoutMillis = Math.max(parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 20000, 20000);
poolOptions.query_timeout = parseInt(process.env.DB_QUERY_TIMEOUT) || 45000;
poolOptions.allowExitOnIdle = false;
poolOptions.keepAlive = true;
poolOptions.keepAliveInitialDelayMillis = 10000;
// Note: Do NOT set statement_timeout here to remain fully compliant with RDS Proxy and prevent connection pinning

let pool = new Pool(poolOptions);

const attachPoolListeners = (p) => {
  p.on('connect', (client) => {
    if (process.env.NODE_ENV !== 'production') {
      logger.debug(`New DB client connected. Pool size: ${p.totalCount}/${p.options.max}`);
    }
  });

  p.on('error', (err, client) => {
    logger.error('Unexpected error on idle database client', { error: err.message, total: p.totalCount, idle: p.idleCount, waiting: p.waitingCount });
  });
};

attachPoolListeners(pool);

const getActivePool = () => {
  if (!pool || pool.ended) {
    logger.warn('Database pool was ended or invalid. Re-initializing pool...');
    pool = new Pool(poolOptions);
    attachPoolListeners(pool);
  }
  return pool;
};

// Helper: run a query with transient connection failure retry logic
const query = async (text, params, retries = 2) => {
  const start = Date.now();
  const currentPool = getActivePool();
  try {
    const res = await currentPool.query(text, params);
    const duration = Date.now() - start;
    logger.debug(`Query executed in ${duration}ms`, { query: text });
    return res;
  } catch (err) {
    const isPoolEnded = err.message && err.message.includes('Cannot use a pool after calling end');
    if (isPoolEnded) {
      logger.warn('Pool ended error detected. Re-creating database pool and retrying query...');
      pool = new Pool(poolOptions);
      attachPoolListeners(pool);
      if (retries > 0) {
        return query(text, params, retries - 1);
      }
    }

    const isPoolExhausted = err.message && err.message.includes('timeout exceeded when trying to connect');
    const isTransientNetwork = err.message && (
      err.message.includes('Connection terminated') ||
      err.message.includes('ECONNRESET') ||
      err.message.includes('ECONNREFUSED')
    );
    const isReservedSlots = err.message && err.message.includes('remaining connection slots are reserved');
    const isDeadlock = err.code === '40P01' || (err.message && err.message.includes('deadlock detected'));

    if (isPoolExhausted || isTransientNetwork || isReservedSlots || isDeadlock) {
      logger.warn(`DB Connection status on error (${isDeadlock ? 'Deadlock' : (isPoolExhausted ? 'Pool Exhausted' : 'Network')}): Total=${currentPool.totalCount}, Idle=${currentPool.idleCount}, Waiting=${currentPool.waitingCount}`, { error: err.message });

      // Circuit Breaker against Retry Storms:
      // If the pool is exhausted and queries are waiting, retrying will only amplify queue saturation.
      // Instead, fail fast so active queries can finish and release connections back to the pool.
      if (isPoolExhausted && currentPool.idleCount === 0 && currentPool.waitingCount >= 3) {
        logger.warn(`Pool saturated (total=${currentPool.totalCount}, idle=${currentPool.idleCount}, waiting=${currentPool.waitingCount}) — skipping query retry to allow active connections to finish and drain the pool.`, { error: err.message });
        throw err;
      }

      if (retries > 0) {
        const baseDelay = isDeadlock ? 50 : (isPoolExhausted ? 800 : 400);
        const attempt = 2 - retries; // 0, 1
        const backoff = baseDelay * Math.pow(2, attempt);
        const jitter = Math.random() * (isDeadlock ? 100 : 300);
        const delay = backoff + jitter;

        logger.warn(`Transient DB error / Deadlock detected. Retrying in ${Math.round(delay)}ms (${retries} left)...`, { error: err.message });
        await new Promise((resolve) => setTimeout(resolve, delay));
        return query(text, params, retries - 1);
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      console.error("\n================ SQL ERROR ================");
      console.error("SQL:", text);
      console.error("Parameters:", params);
      console.error("Postgres Error:", err.message);
      console.error("===========================================\n");
    }

    logger.error('Database query error', {
      query: text,
      error: err.message,
      detail: err.detail,
      hint: err.hint,
      context: err.context
    });
    throw err;
  }
};

// Helper: get a client for transactions
const getClient = () => getActivePool().connect();

module.exports = {
  query,
  getClient,
  get pool() {
    return getActivePool();
  }
};

