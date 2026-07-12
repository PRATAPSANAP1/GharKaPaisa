const { query } = require('../../config/database');
const logger = require('../../config/logger');
const EventEmitter = require('events');

const notificationEvents = new EventEmitter();
const clients = new Map(); // userId -> Array of Response objects

const registerClient = (userId, res) => {
  if (!clients.has(userId)) {
    clients.set(userId, []);
  }
  clients.get(userId).push(res);
  logger.info(`Registered SSE client for user ${userId}. Total clients: ${clients.get(userId).length}`);
};

const unregisterClient = (userId, res) => {
  const userClients = clients.get(userId);
  if (userClients) {
    const updated = userClients.filter(c => c !== res);
    if (updated.length === 0) {
      clients.delete(userId);
    } else {
      clients.set(userId, updated);
    }
    logger.info(`Unregistered SSE client for user ${userId}.`);
  }
};

const sendLiveUpdate = (userId, data) => {
  const userClients = clients.get(userId);
  if (userClients) {
    userClients.forEach(res => {
      try {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (err) {
        logger.error(`Failed to push live SSE update to user ${userId}:`, err.message);
      }
    });
  }
};

const broadcastLiveUpdate = (data) => {
  clients.forEach((userClients, userId) => {
    userClients.forEach(res => {
      try {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (err) {
        logger.error(`Failed to broadcast live SSE update to user ${userId}:`, err.message);
      }
    });
  });
};

const createNotification = async (userId, title, message, type = 'info', link = null, opts = {}) => {
  try {
    const { 
      category = 'system', 
      priority = 'normal', 
      channel = 'in-app', 
      redirect_url = null, 
      icon = null 
    } = opts;

    // Check user preferences if present
    const { rows: [pref] } = await query(`
      SELECT * FROM notification_preferences WHERE user_id = $1
    `, [userId]);

    const appEnabled = pref ? pref.app_enabled : true;
    const emailEnabled = pref ? pref.email_enabled : true;

    // Insert notification record if app/in-app notification is enabled
    if (appEnabled) {
      const { rows: [newNotif] } = await query(
        `INSERT INTO notifications (user_id, title, message, type, is_read, link, category, priority, status, channel, redirect_url, icon) 
         VALUES ($1, $2, $3, $4, false, $5, $6, $7, 'sent', $8, $9, $10) RETURNING *`,
        [userId, title, message, type, link, category, priority, channel, redirect_url || link, icon]
      );

      // Get unread counts
      const { rows: [unread] } = await query(`
        SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false
      `, [userId]);
      const count = parseInt(unread.count);

      // Push SSE update
      sendLiveUpdate(userId, { 
        type: 'notification', 
        data: newNotif, 
        unread_count: count 
      });
    }

    if (emailEnabled && (channel === 'email' || channel === 'both')) {
      // Stub: AWS SES/Nodemailer email dispatch simulation
      logger.info(`Notification Email dispatched to user ${userId}: "${title}"`);
    }

    return true;
  } catch (err) {
    logger.error('Failed to create notification', err.message);
    return false;
  }
};

const bulkNotify = async (userIds, title, message, type = 'info', opts = {}) => {
  if (!userIds || userIds.length === 0) return;
  for (const uid of userIds) {
    await createNotification(uid, title, message, type, null, opts);
  }
};

// Predefined notification templates mapping
const notify = {
  applicationSubmitted: (userId, appNumber) =>
    createNotification(userId, 'Application Submitted', `Application ${appNumber} has been submitted successfully.`, 'success', `/partner/applications`, { category: 'applications' }),

  applicationApproved: (userId, appNumber, commission) =>
    createNotification(userId, '🎉 Application Approved!', `${appNumber} approved. Commission of ₹${commission} will be credited within 48 hours.`, 'success', `/partner/applications`, { category: 'applications', priority: 'high' }),

  applicationRejected: (userId, appNumber, reason) =>
    createNotification(userId, 'Application Rejected', `${appNumber} was rejected. Reason: ${reason}`, 'warning', `/partner/applications`, { category: 'applications' }),

  commissionCredited: (userId, amount) =>
    createNotification(userId, '💰 Commission Credited', `₹${amount} has been credited to your wallet.`, 'success', `/partner/wallet`, { category: 'wallet', priority: 'high' }),

  withdrawalApproved: (userId, amount) =>
    createNotification(userId, 'Withdrawal Approved', `Your withdrawal of ₹${amount} has been processed and will be credited to your bank account.`, 'success', `/partner/wallet`, { category: 'wallet' }),

  withdrawalRejected: (userId, amount, reason) =>
    createNotification(userId, 'Withdrawal Rejected', `Withdrawal of ₹${amount} was rejected. Reason: ${reason}`, 'warning', `/partner/wallet`, { category: 'wallet' }),

  kycApproved: (userId) =>
    createNotification(userId, '✅ KYC Approved', 'Your KYC documents have been verified. You can now submit applications.', 'success', `/partner/profile`, { category: 'kyc' }),

  kycRejected: (userId, reason) =>
    createNotification(userId, 'KYC Rejected', `Your KYC was rejected. Reason: ${reason}. Please re-upload correct documents.`, 'warning', `/partner/profile`, { category: 'kyc' }),

  kycSubmitted: async (userId) => {
    await createNotification(userId, '📥 KYC Submitted', 'Your KYC documents have been submitted and are awaiting review.', 'info', `/partner/profile`, { category: 'kyc' });
    try {
      const { rows: admins } = await query(`SELECT id FROM users WHERE role IN ('SUPER_ADMIN', 'ADMIN')`);
      const { rows: [partnerName] } = await query(`
        SELECT first_name, last_name, partner_code 
        FROM partner_profiles 
        WHERE user_id = $1
      `, [userId]);
      const nameStr = partnerName ? `${partnerName.first_name} ${partnerName.last_name} (${partnerName.partner_code})` : 'A partner';
      
      for (const admin of admins) {
        await createNotification(
          admin.id, 
          '📥 New KYC Verification Arrived', 
          `${nameStr} has submitted their KYC documents for verification.`, 
          'info', 
          '/admin/partners', 
          { category: 'kyc', priority: 'high' }
        );
      }
    } catch (err) {
      logger.error('Failed to notify admins on KYC submission:', err.message);
    }
  },

  kycUnderReview: (userId) =>
    createNotification(userId, '🔍 KYC Under Review', 'Your KYC documents are now being reviewed by our compliance team.', 'info', `/partner/profile`, { category: 'kyc' }),
};

const notifyParent = async (childPartnerId, title, message, type = 'info', link = null, opts = {}) => {
  try {
    const { rows: [partner] } = await query(`
      SELECT parent_partner_id FROM partner_profiles WHERE id = $1
    `, [childPartnerId]);
    
    if (partner && partner.parent_partner_id) {
      const { rows: [parent] } = await query(`
        SELECT user_id FROM partner_profiles WHERE id = $1
      `, [partner.parent_partner_id]);
      
      if (parent && parent.user_id) {
        await createNotification(parent.user_id, title, message, type, link, opts);
      }
    }
  } catch (err) {
    logger.error('Failed to notify parent:', err.message);
  }
};

module.exports = { 
  createNotification, 
  bulkNotify, 
  notify, 
  notifyParent,
  registerClient, 
  unregisterClient, 
  sendLiveUpdate,
  broadcastLiveUpdate
};
