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

poolOptions.max = 20;
poolOptions.idleTimeoutMillis = 30000;
poolOptions.connectionTimeoutMillis = 5000;

const pool = new Pool(poolOptions);

pool.on('connect', () => {
  if (process.env.NODE_ENV !== 'production') {
    logger.debug(`New DB client connected. Pool size: ${pool.totalCount}/${pool.options.max}`);
  }
});
pool.on('error', (err) => logger.error('Unexpected DB client error', err));

// Helper: run a query
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug(`Query executed in ${duration}ms`, {
      query: text.substring(0, 80).replace(/\s+/g, ' ')
    });
    return res;
  } catch (err) {
    logger.error('Database query error', {
      query: text.substring(0, 80).replace(/\s+/g, ' '),
      error: err.message
    });
    throw err;
  }
};

// Helper: get a client for transactions
const getClient = () => pool.connect();

module.exports = { query, getClient, pool };
