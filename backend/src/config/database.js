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
poolOptions.max = parseInt(process.env.DB_POOL_MAX) || 40;
poolOptions.idleTimeoutMillis = parseInt(process.env.DB_IDLE_TIMEOUT) || 20000;
poolOptions.connectionTimeoutMillis = parseInt(process.env.DB_CONN_TIMEOUT) || 8000; // 8s fail-fast instead of 30s queue backup
poolOptions.keepAlive = true;
poolOptions.keepAliveInitialDelayMillis = 10000;

// Set 15s statement timeout to prevent indefinite lock holds
if (!poolOptions.options) {
  poolOptions.options = '-c statement_timeout=15000';
}

const pool = new Pool(poolOptions);

pool.on('connect', () => {
  if (process.env.NODE_ENV !== 'production') {
    logger.debug(`New DB client connected. Pool size: ${pool.totalCount}/${pool.options.max}`);
  }
});

pool.on('error', (err) => {
  logger.error('Unexpected DB client error in pool', { error: err.message });
});

// Helper: run a query with single transient connection failure retry logic
const query = async (text, params, retries = 1) => {
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
      err.message.includes('ECONNREFUSED')
    );

    if (isConnErr && retries > 0) {
      logger.warn(`Transient DB connection error. Retrying query (${retries} left)...`, { error: err.message });
      await new Promise((resolve) => setTimeout(resolve, 300));
      return query(text, params, retries - 1);
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
