const admin = require('firebase-admin');
const path = require('path');
const logger = require('../utils/logger');

const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');

try {
  const serviceAccount = require(serviceAccountPath);

  // Only initialize if not already initialized
  if (!admin.getApps().length) {
    admin.initializeApp({
      credential: admin.cert(serviceAccount),
    });
    logger.info('Firebase Admin SDK initialized successfully');
  }
} catch (err) {
  logger.error(
    'Firebase Admin SDK initialization failed. ' +
    'Download the service account key from Firebase Console > Project Settings > Service Accounts ' +
    'and save it as backend/firebase-service-account.json',
    err.message
  );
}

module.exports = admin;
