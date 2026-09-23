const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// ── Environment Variable Startup Validation ────────────────────
const logger = require('./config/logger');
const requiredEnvVars = ['JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  logger.error(`CRITICAL STARTUP ERROR: Missing required environment variables: ${missingEnvVars.join(', ')}`);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { globalLimiter } = require('./middleware/rate-limit/rateLimit.middleware.js');
const fs = require('fs');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');

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
app.set('trust proxy', 1);

const envOrigins = (process.env.FRONTEND_URL || '').split(',').map(o => o.trim()).filter(Boolean);
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:4173",
  "https://gharkapaisa.in",
  "https://www.gharkapaisa.in",
  "https://admin.gharkapaisa.in",
  "https://api.gharkapaisa.in",
  "https://ghar-ka-paisa.vercel.app",
  "https://gharkapaisa.vercel.app",
  ...envOrigins
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }
    const normalizedOrigin = origin.trim().toLowerCase();
    try {
      const hostname = new URL(normalizedOrigin).hostname;
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === 'gharkapaisa.in' ||
        hostname.endsWith('.gharkapaisa.in') ||
        hostname.endsWith('.vercel.app')
      ) {
        return callback(null, true);
      }
    } catch (e) {}
    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }
    logger.warn(`CORS blocked for origin: ${origin}`);
    return callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Device-Id',
    'x-device-id',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
};

// ── CORS & Security Middleware ─────────────────────────────────
app.use(cors(corsOptions));
app.options('(.*)', cors(corsOptions));

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
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// Global rate limiter
app.use(globalLimiter);

// Catch malformed URI requests gracefully (e.g., bot/scanner probes with invalid % encoding)
app.use((req, res, next) => {
  try {
    decodeURIComponent(req.path);
    next();
  } catch (err) {
    logger.warn(`Malformed URI request blocked: ${req.method} ${req.originalUrl || req.url}`, { ip: req.ip });
    return res.status(400).json({ success: false, message: 'Invalid URL encoding in request path' });
  }
});

// ── Body Parsing ───────────────────────────────────────────────
// Capture raw text for JSON payloads to handle malformed inputs
app.use(express.text({ type: 'application/json', limit: '50mb' }));

// Middleware to clean and parse malformed JSON bodies
app.use((req, res, next) => {
  if (req.is('application/json') && typeof req.body === 'string') {
    const raw = req.body;
    req.rawBody = raw;
    try {
      req.body = JSON.parse(raw);
    } catch (parseErr) {
      return res.status(400).json({ success: false, message: 'Malformed JSON payload' });
    }
  }
  next();
});

// Parse URL‑encoded bodies and cookies
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
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
const walletCtrl = require('./modules/wallet/controller.js');
app.post('/api/v1/partner/referral-click', partnerCtrl.invitePartnerClick);
app.post('/api/v1/razorpay/webhook', walletCtrl.handleRazorpayWebhook);
app.post('/api/v1/webhooks/razorpay', walletCtrl.handleRazorpayWebhook);

// ── API Routes ─────────────────────────────────────────────────
const apiRouter = require('./routes/index');
app.use('/api/v1', apiRouter);
app.use('/team', apiRouter);

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

    // Database migration execution on startup (controlled via AUTO_MIGRATE flag in production)
    if (process.env.AUTO_MIGRATE === 'true' || process.env.NODE_ENV !== 'production') {
      const { migrate } = require('./database/migrations/migrate.js');
      await migrate();
    } else {
      logger.info('Skipping automatic startup migration in production (AUTO_MIGRATE != true).');
    }

    // Always ensure messenger module tables exist on boot
    try {
      const migrateMessenger = require('./database/migrations/migrate_messenger.js');
      await migrateMessenger();
    } catch (mErr) {
      logger.warn('Messenger auto migration note:', mErr.message);
    }

    // Always ensure contests module tables exist on boot
    try {
      const migrateContests = require('./database/migrations/migrate_contests.js');
      await migrateContests();
    } catch (cErr) {
      logger.warn('Contest auto migration note:', cErr.message);
    }

    // Always ensure Loan on Credit Card & Smart EMI products are seeded on boot
    try {
      const { seedSmartEmiAndLoccProducts } = require('./database/seeds/seed-smart-emi-locc.js');
      await seedSmartEmiAndLoccProducts();
    } catch (emiErr) {
      logger.warn('Smart EMI / LOCC auto seed note:', emiErr.message);
    }

    // Initialize scheduled CRON jobs
    const { initReportJobs } = require('./jobs/report.job.js');
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


      // Initialize Daily Reminder Engine timer (runs once every 24 hours)
      setInterval(async () => {
        try {
          const { processDailyReminderEngine } = require('./modules/notifications/service.js');
          await processDailyReminderEngine();
        } catch (err) {
          logger.error('Daily Reminder Engine timer error:', err.message);
        }
      }, 24 * 60 * 60 * 1000);

      // Initialize Commission Hold Release Job timer (runs every 6 hours and on startup)
      const runCommissionRelease = async () => {
        try {
          const { processCommissionHoldReleases } = require('./jobs/commissionHoldRelease.job.js');
          await processCommissionHoldReleases();
        } catch (err) {
          logger.error('Commission Hold Release Job timer error:', err.message);
        }
      };
      runCommissionRelease();
      setInterval(runCommissionRelease, 6 * 60 * 60 * 1000);

      // Initialize 48-Hour Messenger Message & File Purge Job timer (runs every 15 minutes and on startup)
      const runMessengerPurge = async () => {
        try {
          const { purgeExpiredMessengerMessages } = require('./jobs/messengerPurge.job.js');
          await purgeExpiredMessengerMessages();
        } catch (err) {
          logger.error('Messenger 48-Hour Purge Job error:', err.message);
        }
      };
      runMessengerPurge();
      setInterval(runMessengerPurge, 15 * 60 * 1000);

      // Initialize Scheduled Announcement Auto-Publisher (runs every minute and on startup)
      const runAnnouncementScheduler = async () => {
        try {
          const { processScheduledAnnouncements } = require('./jobs/announcementScheduler.job.js');
          await processScheduledAnnouncements();
        } catch (err) {
          logger.error('Announcement Scheduler Job error:', err.message);
        }
      };
      runAnnouncementScheduler();
      setInterval(runAnnouncementScheduler, 60 * 1000);
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
