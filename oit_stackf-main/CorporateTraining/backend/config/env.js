const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/mce-placement-portal',
  jwtSecret: process.env.JWT_SECRET || 'default_jwt_secret_change_me',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  judge0ApiKey: process.env.JUDGE0_API_KEY || '',
  judge0ApiUrl: process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com',
  resendApiKey: process.env.RESEND_API_KEY || '',
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
  },
  clientUrl: (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, ''),
};

