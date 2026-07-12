require('dotenv').config();
const logger = require('./src/config/logger');

try {
  logger.info('Testing modules load...');
  const razorpay = require('./src/utils/helpers/razorpay');
  const service = require('./src/modules/wallet/service');
  const controller = require('./src/modules/wallet/controller');
  
  logger.info('✅ All modified modules loaded successfully without syntax or require errors!');
  logger.info(`Razorpay mode: ${razorpay.isLive ? 'LIVE' : 'SIMULATOR/MOCK'}`);
  process.exit(0);
} catch (err) {
  logger.error('❌ Failed to load modules:', err);
  process.exit(1);
}
