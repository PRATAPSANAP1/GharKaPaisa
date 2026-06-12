const { Pool } = require('pg');
const logger = require('../utils/logger');

const isProduction = process.env.NODE_ENV === 'production';
const connectionString = process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ? connectionString : undefined,
  host: !process.env.DATABASE_URL ? process.env.DB_HOST : undefined,
  port: !process.env.DATABASE_URL ? (parseInt(process.env.DB_PORT) || 5432) : undefined,
  database: !process.env.DATABASE_URL ? process.env.DB_NAME : undefined,
  user: !process.env.DATABASE_URL ? process.env.DB_USER : undefined,
  password: !process.env.DATABASE_URL ? process.env.DB_PASSWORD : undefined,
  ssl: (isProduction || process.env.DB_SSL === 'true') ? { rejectUnauthorized: false } : false,
  max: 20,               // max pool connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('connect', () => logger.info('New DB client connected'));
pool.on('error', (err) => logger.error('Unexpected DB client error', err));

// Helper: run a query
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug(`Query executed in ${duration}ms`, { text });
    return res;
  } catch (err) {
    logger.error('Database query error', { text, error: err.message });
    throw err;
  }
};

// Helper: get a client for transactions
const getClient = () => pool.connect();

module.exports = { query, getClient, pool };
