const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { globalLimiter } = require('./middleware/rate-limit/rateLimit.middleware.js');
const path = require('path');
const fs = require('fs');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');

const logger = require('./config/logger');

// Register process exception handlers early
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

const { notFoundHandler, errorHandler } = require('./middleware/error/error.middleware.js');
const db = require('./config/database');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const app = express();

// ── Security Middleware ────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'", "https:", "data:"],
      frameAncestors: ["'self'", "https://www.google.com", "https://*.msg91.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://verify.msg91.com", "https://www.google.com"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
}));

const envOrigins = (process.env.FRONTEND_URL || '').split(',').map(o => o.trim()).filter(Boolean);
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://gharkapaisa.in",
  "https://www.gharkapaisa.in",
  "https://admin.gharkapaisa.in",
  "https://ghar-ka-paisa.vercel.app",
  ...envOrigins
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) {
      return callback(null, true);
    }
    // Whitelist in non-production environments
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    // Allow requests from local loopback (localhost or 127.0.0.1 on any port) for local testing
    try {
      const hostname = new URL(origin).hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return callback(null, true);
      }
    } catch (e) {
      // Ignore URL parse errors
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS policy: origin ${origin} is not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Global rate limiter
app.use(globalLimiter);

// ── Body Parsing ───────────────────────────────────────────────
// ── Body Parsing ───────────────────────────────────────────────
// Capture raw text for JSON payloads to handle malformed inputs
app.use(express.text({ type: 'application/json', limit: '50kb' }));

// Middleware to clean and parse malformed JSON bodies
app.use((req, res, next) => {
  if (req.is('application/json') && typeof req.body === 'string') {
    let cleaned = req.body.trim();

    // Remove leading/trailing backslashes that wrap the JSON
    if (cleaned.startsWith('\\{') && cleaned.endsWith('\\}')) {
      cleaned = cleaned.slice(1, -1);
    }

    // Replace escaped quotes with actual quotes
    cleaned = cleaned.replace(/\\"/g, '"');

    // Ensure object braces
    if (!cleaned.startsWith('{')) cleaned = `{${cleaned}`;
    if (!cleaned.endsWith('}')) cleaned = `${cleaned}}`;

    try {
      req.body = JSON.parse(cleaned);
    } catch (err) {
      // If parsing still fails, leave body as empty object
      req.body = {};
    }
  }
  next();
});

// Parse well‑formed JSON and URL‑encoded bodies
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));
app.use(cookieParser());

// ── Data Sanitization ──────────────────────────────────────────
// Data sanitization against NoSQL query injection (included as per request)
app.use(mongoSanitize());
// Data sanitization against XSS
app.use(xss());

// ── Logging ────────────────────────────────────────────────────
app.use(morgan('combined', {
  stream: { write: (msg) => logger.http(msg.trim()) },
  skip: (req) => req.url === '/health',
}));

// ── Health Check ───────────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({
      status: 'ok',
      service: 'GharKaPaisa Backend API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: 'connected',
      pool: {
        total: db.pool.totalCount,
        idle: db.pool.idleCount,
        waiting: db.pool.waitingCount,
      }
    });
  } catch (err) {
    logger.error('Health check failed: DB error', { error: err.message });
    res.status(503).json({
      status: 'error',
      service: 'GharKaPaisa Backend API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: 'disconnected',
      error: err.message,
      pool: {
        total: db.pool ? db.pool.totalCount : 0,
        idle: db.pool ? db.pool.idleCount : 0,
        waiting: db.pool ? db.pool.waitingCount : 0,
      }
    });
  }
});

// ── Top-level Redirect Routes ──────────────────────────────────
const redirectCtrl = require('./modules/products/link-management.controller.js');
app.get('/redirect/:productId', redirectCtrl.handleRedirect);
app.get('/r/:partnerCode/:productId', redirectCtrl.handleRedirect);

// ── Public Unauthenticated Endpoints ───────────────────────────
const partnerCtrl = require('./modules/partner/partner.controller.js');
const walletCtrl  = require('./modules/wallet/controller.js');
const paymentCtrl = require('./modules/payment/payment.controller.js');
app.post('/api/v1/partner/referral-click', partnerCtrl.invitePartnerClick);
app.post('/api/v1/razorpay/webhook', walletCtrl.handleRazorpayWebhook);

// Razorpay Standard Checkout Routes
app.post('/api/create-order', paymentCtrl.createOrder);
app.post('/api/verify-payment', paymentCtrl.verifyPayment);
app.post('/api/v1/create-order', paymentCtrl.createOrder);
app.post('/api/v1/verify-payment', paymentCtrl.verifyPayment);
app.post('/api/v1/payment/create-order', paymentCtrl.createOrder);
app.post('/api/v1/payment/verify-payment', paymentCtrl.verifyPayment);

// ── API Routes ─────────────────────────────────────────────────
const apiRouter = require('./routes/index');
app.use('/api/v1', apiRouter);

// ── Test Routes ────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production' && process.env.ENABLE_TEST_EMAIL_ROUTE === 'true') {
  const testEmailRoutes = require('./routes/settings/testEmail.routes.js');
  app.use('/api/test-email', testEmailRoutes);
}

// ── Error Handling ─────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Start Server ───────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
let server;

const startServer = async () => {
  try {
    // Verify DB connectivity before listening
    await db.query('SELECT 1');
    logger.info('Database connection verified successfully.');

    // Run database migrations automatically
    const { migrate } = require('./database/migrations/migrate.js');
    await migrate();

    // Start matured commission releases check
    const { releaseMaturedCommissions } = require('./modules/wallet/service.js');
    releaseMaturedCommissions().catch(err => logger.error('Startup commission release failed', { error: err.message }));
    setInterval(() => {
      releaseMaturedCommissions().catch(err => logger.error('Interval commission release failed', { error: err.message }));
    }, 15 * 60 * 1000);

    // Initialize scheduled CRON jobs
    const { initCommissionJobs } = require('./jobs/commission.job.js');
    const { initReportJobs } = require('./jobs/report.job.js');
    initCommissionJobs();
    initReportJobs();

    server = app.listen(PORT, () => {
      logger.info(`
      ╔════════════════════════════════════════╗
      ║  GharKaPaisa API Server Running        ║
      ║  Port    : ${PORT}                        ║
      ║  Env     : ${(process.env.NODE_ENV || 'development').padEnd(12)}            ║
      ║  Base URL: /api/v1 (behind reverse proxy) ║
      ╚════════════════════════════════════════╝
      `);
    });
  } catch (err) {
    logger.error('Failed to start server due to database connectivity issue:', err);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);

  // Force exit after 10s if hung
  const timeoutId = setTimeout(() => {
    logger.warn('Forced shutdown due to timeout during cleanup.');
    process.exit(1);
  }, 10000);

  // Unref the timeout so it doesn't keep the process alive
  timeoutId.unref();

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed.');
      try {
        await db.pool.end();
        logger.info('Database connection pool closed.');
        clearTimeout(timeoutId);
        process.exit(0);
      } catch (err) {
        logger.error('Error closing database connection pool:', err);
        process.exit(1);
      }
    });
  } else {
    db.pool.end().then(() => {
      logger.info('Database connection pool closed.');
      clearTimeout(timeoutId);
      process.exit(0);
    }).catch((err) => {
      logger.error('Error closing database connection pool:', err);
      process.exit(1);
    });
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;
