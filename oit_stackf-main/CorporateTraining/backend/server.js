const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const config = require('./config/env');
const errorHandler = require('./middleware/errorMiddleware');
const { generalLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const questionRoutes = require('./routes/questionRoutes');
const testRoutes = require('./routes/testRoutes');
const resultRoutes = require('./routes/resultRoutes');
const codingRoutes = require('./routes/codingRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();

app.use(helmet());
app.use(cors({
  origin: function(origin, callback) {
    const allowed = [
      config.clientUrl,
      'https://www.oitstack.com',
      'https://oitstack.com',
      'http://localhost:5500',
      'http://127.0.0.1:5500',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ];
    // Allow requests with no origin (file://, Postman, mobile apps)
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(generalLimiter);  // Rate limiting

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/coding', codingRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(config.port, () => {
      console.log(`Server running in ${config.nodeEnv} mode on port ${config.port}`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${config.port} is already in use. Please terminate any processes running on this port and restart the server.`);
      } else {
        console.error('Server error:', error.message);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;

