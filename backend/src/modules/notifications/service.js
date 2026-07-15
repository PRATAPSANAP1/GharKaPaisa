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
  logger.info(`Registered persistent SSE client for user ${userId}. Total clients: ${clients.get(userId).length}`);

  // Send immediate heartbeat & connection ACK
  res.write(`data: ${JSON.stringify({ type: 'heartbeat', status: 'connected', timestamp: new Date().toISOString() })}\n\n`);
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
    logger.info(`Unregistered persistent SSE client for user ${userId}.`);
  }
};

// Send 20s Heartbeat Ping to Keep Connections Alive & Prevent Reconnect Loops
setInterval(() => {
  clients.forEach((userClients, userId) => {
    userClients.forEach(res => {
      try {
        res.write(`data: ${JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() })}\n\n`);
      } catch (err) {
        unregisterClient(userId, res);
      }
    });
  });
}, 20000);

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

/**
 * Activity Log Creation (Partner Timeline)
 */
const createActivityLog = async (partnerId, type, module = 'system', title, description = null, refId = null, performedBy = null) => {
  try {
    const { rows: [log] } = await query(`
      INSERT INTO activity_logs (partner_id, activity_type, module, title, description, reference_id, performed_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [partnerId, type, module, title, description, refId, performedBy]);
    return log;
  } catch (err) {
    logger.error('Failed to create activity log:', err.message);
  }
};

/**
 * Audit Log Creation (Admin History)
 */
const createAuditLog = async (userId, role, module, action, oldData = null, newData = null, ip = null, device = null) => {
  try {
    const { rows: [audit] } = await query(`
      INSERT INTO audit_logs (user_id, role, module, action, old_data, new_data, ip, device)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [userId, role, module, action, oldData ? JSON.stringify(oldData) : null, newData ? JSON.stringify(newData) : null, ip, device]);
    return audit;
  } catch (err) {
    logger.error('Failed to create audit log:', err.message);
  }
};

/**
 * Background Daily Reminder Engine
 */
const processDailyReminderEngine = async () => {
  logger.info('Running Daily Reminder Engine...');

  // 1. Pending KYC Reminder
  const { rows: pendingKyc } = await query(`SELECT user_id, first_name FROM partner_profiles WHERE kyc_status = 'pending'`);
  for (const p of pendingKyc) {
    await createNotification(p.user_id, '📋 Action Required: Complete KYC Verification', 'Please upload your Aadhaar and PAN documents to unlock full commission payouts!', 'warning', '/partner/kyc', { category: 'kyc', priority: 'important' });
  }

  // 2. Pending Withdrawal Reminder
  const { rows: pendingW } = await query(`SELECT w.*, p.user_id FROM wallet_withdrawals w JOIN partner_profiles p ON p.id = w.partner_id WHERE w.status = 'pending'`);
  for (const w of pendingW) {
    await createNotification(w.user_id, '⏳ Pending Withdrawal Request', `Your payout request of ₹${w.amount.toLocaleString()} is currently under admin review.`, 'info', '/partner/wallet', { category: 'withdrawal', priority: 'information' });
  }

  logger.info(`Daily Reminder Engine completed for ${pendingKyc.length} KYC and ${pendingW.length} withdrawal notifications.`);
};

// Subscribing Central Event Bus Listeners
notificationEvents.on('partner.registered', async (data) => {
  await createNotification(data.user_id, '🎉 Welcome to GharKaPaisa!', 'Your partner account has been created. Start submitting customer leads to earn commission!', 'success', '/partner/dashboard', { category: 'system', priority: 'information' });
});

notificationEvents.on('kyc.approved', async (data) => {
  await createNotification(data.user_id, '✔ KYC Approved!', 'Your identity verification is approved! You can now withdraw earnings to your bank account.', 'success', '/partner/kyc', { category: 'kyc', priority: 'urgent' });
  if (data.partner_id) await createActivityLog(data.partner_id, 'KYC_APPROVED', 'kyc', 'KYC Approved', 'Identity & bank documents verified successfully');
});

notificationEvents.on('application.approved', async (data) => {
  await createNotification(data.user_id, '🎉 Application Approved!', `Application #${data.app_number} for ${data.product_name} has been approved by bank!`, 'success', '/partner/leads', { category: 'applications', priority: 'urgent' });
  if (data.partner_id) await createActivityLog(data.partner_id, 'APP_APPROVED', 'applications', 'Application Approved', `Application #${data.app_number} approved for ₹${data.payout_amount}`);
});

module.exports = {
  notificationEvents,
  registerClient,
  unregisterClient,
  sendLiveUpdate,
  broadcastLiveUpdate,
  createActivityLog,
  createAuditLog,
  processDailyReminderEngine
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
  broadcastLiveUpdate,
  createActivityLog,
  createAuditLog,
  processDailyReminderEngine,
  notificationEvents
};
