const { query } = require('../../config/database');
const { getPaginationParams } = require('../../utils/helpers/helpers');
const { success, paginate, error, notFound } = require('../../utils/response/response');
const { registerClient, unregisterClient, createNotification, bulkNotify, broadcastLiveUpdate } = require('./service');

// GET /notifications/stream (SSE Stream link)
const handleSSEStream = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const userId = req.user.id;
  registerClient(userId, res);

  // Send initial ping to establish connection
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'SSE stream connected successfully.' })}\n\n`);

  // Periodic heartbeat comment to keep Nginx/proxy connections alive
  const heartbeat = setInterval(() => {
    res.write(':\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    unregisterClient(userId, res);
  });
};

// GET /notifications (filtered list)
const getNotifications = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const { unread_only, category, search } = req.query;

    let where = `WHERE user_id = $1`;
    const values = [req.user.id];
    let idx = 2;

    if (unread_only === 'true') {
      where += ` AND is_read = false`;
    }
    if (category) {
      where += ` AND category = $${idx++}`;
      values.push(category);
    }
    if (search) {
      where += ` AND (title ILIKE $${idx} OR message ILIKE $${idx})`;
      values.push(`%${search}%`);
      idx++;
    }

    const [count, data, unreadCount] = await Promise.all([
      query(`SELECT COUNT(*) FROM notifications ${where}`, values),
      query(`SELECT * FROM notifications ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`, [...values, limit, offset]),
      query(`SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`, [req.user.id]),
    ]);

    return success(res, {
      notifications: data.rows,
      unread_count: parseInt(unreadCount.rows[0].count),
      pagination: { 
        total: parseInt(count.rows[0].count), 
        page, 
        limit, 
        totalPages: Math.ceil(count.rows[0].count / limit) 
      }
    });
  } catch (err) {
    next(err);
  }
};

// GET /notifications/unread
const getUnreadNotifications = async (req, res, next) => {
  try {
    const { rows: unread } = await query(`
      SELECT * FROM notifications 
      WHERE user_id = $1 AND is_read = false 
      ORDER BY created_at DESC LIMIT 5
    `, [req.user.id]);
    
    const { rows: [count] } = await query(`
      SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false
    `, [req.user.id]);

    return success(res, {
      unread_count: parseInt(count.count),
      notifications: unread
    });
  } catch (err) {
    next(err);
  }
};

// PUT /notifications/read (supports single ID or array of IDs)
const markRead = async (req, res, next) => {
  try {
    const { id, ids } = req.body;
    const targetIds = ids || (id ? [id] : []);

    if (targetIds.length === 0 && req.params.id) {
      targetIds.push(req.params.id);
    }

    if (targetIds.length === 0) {
      return error(res, 'No notification IDs provided', 400);
    }

    const result = await query(`
      UPDATE notifications 
      SET is_read = true, read_at = NOW() 
      WHERE id = ANY($1::uuid[]) AND user_id = $2
    `, [targetIds, req.user.id]);

    if (result.rowCount === 0) {
      return notFound(res, 'No matching notifications found');
    }
    return success(res, {}, 'Marked as read');
  } catch (err) {
    next(err);
  }
};

// PUT /notifications/read-all
const markAllRead = async (req, res, next) => {
  try {
    await query(`
      UPDATE notifications 
      SET is_read = true, read_at = NOW() 
      WHERE user_id = $1
    `, [req.user.id]);
    return success(res, {}, 'All notifications marked as read');
  } catch (err) {
    next(err);
  }
};

// DELETE /notifications/:id
const deleteNotification = async (req, res, next) => {
  try {
    const result = await query(`
      DELETE FROM notifications 
      WHERE id = $1 AND user_id = $2
    `, [req.params.id, req.user.id]);
    if (result.rowCount === 0) {
      return notFound(res, 'Notification not found');
    }
    return success(res, {}, 'Notification deleted successfully');
  } catch (err) {
    next(err);
  }
};

// GET /notifications/settings
const getSettings = async (req, res, next) => {
  try {
    const { rows: [pref] } = await query(`
      SELECT * FROM notification_preferences WHERE user_id = $1
    `, [req.user.id]);

    if (pref) {
      return success(res, pref);
    }

    // Insert defaults if not present
    const { rows: [newPref] } = await query(`
      INSERT INTO notification_preferences (user_id) VALUES ($1) RETURNING *
    `, [req.user.id]);

    return success(res, newPref);
  } catch (err) {
    next(err);
  }
};

// PUT /notifications/settings
const saveSettings = async (req, res, next) => {
  try {
    const { 
      email_enabled, sms_enabled, app_enabled, marketing_enabled, 
      commission_enabled, kyc_enabled, application_enabled, language, frequency 
    } = req.body;

    const { rows: [updated] } = await query(`
      INSERT INTO notification_preferences (
        user_id, email_enabled, sms_enabled, app_enabled, marketing_enabled, 
        commission_enabled, kyc_enabled, application_enabled, language, frequency
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (user_id) DO UPDATE SET
        email_enabled = EXCLUDED.email_enabled,
        sms_enabled = EXCLUDED.sms_enabled,
        app_enabled = EXCLUDED.app_enabled,
        marketing_enabled = EXCLUDED.marketing_enabled,
        commission_enabled = EXCLUDED.commission_enabled,
        kyc_enabled = EXCLUDED.kyc_enabled,
        application_enabled = EXCLUDED.application_enabled,
        language = EXCLUDED.language,
        frequency = EXCLUDED.frequency
      RETURNING *
    `, [
      req.user.id, 
      email_enabled !== undefined ? email_enabled : true,
      sms_enabled !== undefined ? sms_enabled : true,
      app_enabled !== undefined ? app_enabled : true,
      marketing_enabled !== undefined ? marketing_enabled : true,
      commission_enabled !== undefined ? commission_enabled : true,
      kyc_enabled !== undefined ? kyc_enabled : true,
      application_enabled !== undefined ? application_enabled : true,
      language || 'en',
      frequency || 'instant'
    ]);

    return success(res, updated, 'Preferences updated successfully');
  } catch (err) {
    next(err);
  }
};

// GET /announcements (list active matching user role)
const getAnnouncements = async (req, res, next) => {
  try {
    const role = req.user?.role || 'CUSTOMER';
    const { rows } = await query(`
      SELECT * FROM announcements 
      WHERE status = 'publish' 
        AND (target_role = 'all' OR target_role = $1)
        AND (start_date IS NULL OR start_date <= CURRENT_DATE)
        AND (end_date IS NULL OR end_date >= CURRENT_DATE)
      ORDER BY created_at DESC
    `, [role.toLowerCase()]);

    return success(res, rows);
  } catch (err) {
    next(err);
  }
};

// SUPER ADMIN announcement methods
const createAnnouncement = async (req, res, next) => {
  try {
    const { title, description, banner_image, target_role, priority, start_date, end_date, redirect_url, status } = req.body;
    if (!title || !description) return error(res, 'Title and description are required', 400);

    const { rows: [item] } = await query(`
      INSERT INTO announcements (title, description, banner_image, target_role, priority, start_date, end_date, redirect_url, status, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *
    `, [title, description, banner_image || null, target_role || 'all', priority || 'normal', start_date || null, end_date || null, redirect_url || null, status || 'draft', req.user.id]);

    // Live broadcast update to connected users if published immediately
    if (status === 'publish') {
      broadcastLiveUpdate({ type: 'announcement', data: item });
    }

    return success(res, item, 'Announcement created successfully');
  } catch (err) {
    next(err);
  }
};

const updateAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, banner_image, target_role, priority, start_date, end_date, redirect_url, status } = req.body;

    const { rows: [existing] } = await query(`SELECT * FROM announcements WHERE id = $1`, [id]);
    if (!existing) return notFound(res);

    const { rows: [item] } = await query(`
      UPDATE announcements SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        banner_image = COALESCE($3, banner_image),
        target_role = COALESCE($4, target_role),
        priority = COALESCE($5, priority),
        start_date = COALESCE($6, start_date),
        end_date = COALESCE($7, end_date),
        redirect_url = COALESCE($8, redirect_url),
        status = COALESCE($9, status),
        updated_at = NOW()
      WHERE id = $10 RETURNING *
    `, [title, description, banner_image, target_role, priority, start_date, end_date, redirect_url, status, id]);

    if (status === 'publish') {
      broadcastLiveUpdate({ type: 'announcement', data: item });
    }

    return success(res, item, 'Announcement updated successfully');
  } catch (err) {
    next(err);
  }
};

const deleteAnnouncement = async (req, res, next) => {
  try {
    const result = await query(`DELETE FROM announcements WHERE id = $1`, [req.params.id]);
    if (result.rowCount === 0) return notFound(res);
    return success(res, {}, 'Announcement deleted successfully');
  } catch (err) {
    next(err);
  }
};

const broadcastNotification = async (req, res, next) => {
  try {
    const { target_role, partner_ids, title, message, priority = 'normal', category = 'system' } = req.body;
    if (!title || !message) return error(res, 'Title and message are required', 400);

    let targetUserIds = [];

    if (partner_ids && partner_ids.length > 0) {
      // Find user ids of target partners
      const { rows } = await query(`SELECT user_id FROM partner_profiles WHERE id = ANY($1::uuid[])`, [partner_ids]);
      targetUserIds = rows.map(r => r.user_id);
    } else if (target_role && target_role !== 'all') {
      const { rows } = await query(`SELECT id FROM users WHERE role = $1`, [target_role.toUpperCase()]);
      targetUserIds = rows.map(r => r.id);
    } else {
      // Broadcast to all users
      const { rows } = await query(`SELECT id FROM users`);
      targetUserIds = rows.map(r => r.id);
    }

    await bulkNotify(targetUserIds, title, message, 'info', { category, priority });

    return success(res, {}, `Successfully broadcasted to ${targetUserIds.length} users.`);
  } catch (err) {
    next(err);
  }
};

const getNotificationReports = async (req, res, next) => {
  try {
    const { rows: summary } = await query(`
      SELECT 
        status, 
        COUNT(*) as total_count 
      FROM notifications 
      GROUP BY status
    `);

    const { rows: templates } = await query(`
      SELECT * FROM notification_templates
    `);

    return success(res, {
      summary,
      templates
    });
  } catch (err) {
    next(err);
  }
};

const getActivityLogsController = async (req, res, next) => {
  try {
    const partnerId = req.partner?.id;
    if (!partnerId) return error(res, 'Partner profile required', 400);

    const { rows } = await query(`
      SELECT * FROM activity_logs
      WHERE partner_id = $1
      ORDER BY created_at DESC LIMIT 100
    `, [partnerId]);

    return success(res, rows, 'Activity timeline loaded');
  } catch (err) {
    next(err);
  }
};

const getAuditLogsController = async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT a.*, u.email, u.role as user_role
      FROM audit_logs a
      LEFT JOIN users u ON u.id = a.user_id
      ORDER BY a.created_at DESC LIMIT 100
    `);

    return success(res, rows, 'Audit logs loaded');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  handleSSEStream,
  getNotifications,
  getUnreadNotifications,
  markRead,
  markAllRead,
  deleteNotification,
  getSettings,
  saveSettings,
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  broadcastNotification,
  getNotificationReports,
  getActivityLogsController,
  getAuditLogsController
};
