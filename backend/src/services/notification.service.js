const { query } = require('../config/db');
const logger = require('../utils/logger');

const createNotification = async (userId, title, message, type = 'info', link = null) => {
  try {
    await query(
      `INSERT INTO notifications (user_id, title, message, type, link) VALUES ($1, $2, $3, $4, $5)`,
      [userId, title, message, type, link]
    );
  } catch (err) {
    logger.error('Failed to create notification', err.message);
  }
};

// Bulk notify (e.g. all Partners)
const bulkNotify = async (userIds, title, message, type = 'info') => {
  for (const uid of userIds) {
    await createNotification(uid, title, message, type);
  }
};

// Predefined notification templates
const notify = {
  applicationSubmitted: (userId, appNumber) =>
    createNotification(userId, 'Application Submitted', `Application ${appNumber} has been submitted successfully.`, 'success'),

  applicationApproved: (userId, appNumber, commission) =>
    createNotification(userId, '🎉 Application Approved!', `${appNumber} approved. Commission of ₹${commission} will be credited within 48 hours.`, 'success'),

  applicationRejected: (userId, appNumber, reason) =>
    createNotification(userId, 'Application Rejected', `${appNumber} was rejected. Reason: ${reason}`, 'warning'),

  commissionCredited: (userId, amount) =>
    createNotification(userId, '💰 Commission Credited', `₹${amount} has been credited to your wallet.`, 'success'),

  withdrawalApproved: (userId, amount) =>
    createNotification(userId, 'Withdrawal Approved', `Your withdrawal of ₹${amount} has been processed and will be credited to your bank account.`, 'success'),

  withdrawalRejected: (userId, amount, reason) =>
    createNotification(userId, 'Withdrawal Rejected', `Withdrawal of ₹${amount} was rejected. ${reason}`, 'warning'),

  kycApproved: (userId) =>
    createNotification(userId, '✅ KYC Approved', 'Your KYC documents have been verified. You can now submit applications.', 'success'),

  kycRejected: (userId, reason) =>
    createNotification(userId, 'KYC Rejected', `Your KYC was rejected. Reason: ${reason}. Please re-upload correct documents.`, 'warning'),
};

module.exports = { createNotification, bulkNotify, notify };
