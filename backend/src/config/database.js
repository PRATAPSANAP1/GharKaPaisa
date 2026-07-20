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
poolOptions.connectionTimeoutMillis = 30000;

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
      query: text
    });
    return res;
  } catch (err) {
    console.error("\n================ SQL ERROR ================");
    console.error("SQL:");
    console.error(text);
    console.error("\nParameters:");
    console.dir(params, { depth: null });
    console.error("\nPostgres Error:");
    console.error(err);
    console.error("===========================================\n");

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
