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
poolOptions.max = parseInt(process.env.DB_POOL_MAX) || 30;
poolOptions.min = parseInt(process.env.DB_POOL_MIN) || 4;
poolOptions.idleTimeoutMillis = parseInt(process.env.DB_IDLE_TIMEOUT) || 30000;
poolOptions.connectionTimeoutMillis = parseInt(process.env.DB_CONN_TIMEOUT) || 5000;
poolOptions.allowExitOnIdle = false;
poolOptions.keepAlive = true;
poolOptions.keepAliveInitialDelayMillis = 5000;

// Set 10s statement timeout to prevent indefinite lock holds
if (!poolOptions.options) {
  poolOptions.options = '-c statement_timeout=10000';
}

const pool = new Pool(poolOptions);

pool.on('connect', () => {
  if (process.env.NODE_ENV !== 'production') {
    logger.debug(`New DB client connected. Pool size: ${pool.totalCount}/${pool.options.max}`);
  }
});

// Global Error Listener for Idle Clients (catches background disconnects without crashing Node)
pool.on('error', (err, client) => {
  logger.error('Unexpected error on idle database client', { error: err.message, total: pool.totalCount, idle: pool.idleCount, waiting: pool.waitingCount });
});

// Helper: run a query with transient connection failure retry logic
const query = async (text, params, retries = 2) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug(`Query executed in ${duration}ms`, { query: text });
    return res;
  } catch (err) {
    const isConnErr = err.message && (
      err.message.includes('timeout exceeded when trying to connect') ||
      err.message.includes('Connection terminated') ||
      err.message.includes('ECONNRESET') ||
      err.message.includes('ECONNREFUSED') ||
      err.message.includes('remaining connection slots are reserved')
    );

    if (isConnErr) {
      logger.warn(`DB Connection status on error: Total=${pool.totalCount}, Idle=${pool.idleCount}, Waiting=${pool.waitingCount}`, { error: err.message });
      if (retries > 0) {
        const delay = 400;
        logger.warn(`Transient DB connection error. Retrying query in ${delay}ms (${retries} left)...`, { error: err.message });
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
const getClient = () => pool.connect();

module.exports = { query, getClient, pool };

