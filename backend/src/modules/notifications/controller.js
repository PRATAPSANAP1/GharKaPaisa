const { query, getClient } = require('../../config/database');
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
      query(`SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false AND category != 'chat'`, [req.user.id]),
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
      WHERE user_id = $1 AND is_read = false AND category != 'chat'
      ORDER BY created_at DESC LIMIT 5
    `, [req.user.id]);
    
    const { rows: [count] } = await query(`
      SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false AND category != 'chat'
    `, [req.user.id]);

    return success(res, {
      unread_count: parseInt(count.count),
      notifications: unread
    });
  } catch (err) {
    next(err);
  }
};

// PUT or POST /notifications/read (supports single ID or array of IDs under id, ids, or notification_ids)
const markRead = async (req, res, next) => {
  try {
    const { id, ids, notification_ids } = req.body || {};
    let targetIds = [];

    if (Array.isArray(ids)) {
      targetIds = [...ids];
    } else if (Array.isArray(notification_ids)) {
      targetIds = [...notification_ids];
    } else if (ids) {
      targetIds = [ids];
    } else if (notification_ids) {
      targetIds = [notification_ids];
    } else if (id) {
      targetIds = [id];
    }

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

// DELETE /notifications/:id (or /notifications/clear-all)
const deleteNotification = async (req, res, next) => {
  try {
    if (req.params.id === 'all' || req.params.id === 'clear-all') {
      await query(`
        DELETE FROM notifications 
        WHERE user_id = $1
      `, [req.user.id]);
      return success(res, {}, 'All notifications cleared successfully');
    }

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

// PUT /notifications/toggle-mute - Simple toggle for mute/unmute notifications and emails
const toggleMute = async (req, res, next) => {
  try {
    const { mute_notifications, mute_emails } = req.body;

    const { rows: [pref] } = await query(`
      SELECT * FROM notification_preferences WHERE user_id = $1
    `, [req.user.id]);

    if (!pref) {
      // Create new preference with mute settings
      const { rows: [newPref] } = await query(`
        INSERT INTO notification_preferences (user_id, app_enabled, email_enabled)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [
        req.user.id,
        mute_notifications !== undefined ? !mute_notifications : true,
        mute_emails !== undefined ? !mute_emails : true
      ]);
      return success(res, newPref, 'Mute preferences saved');
    }

    // Update existing preference
    const { rows: [updated] } = await query(`
      UPDATE notification_preferences
      SET 
        app_enabled = COALESCE($2, app_enabled),
        email_enabled = COALESCE($3, email_enabled),
        updated_at = NOW()
      WHERE user_id = $1
      RETURNING *
    `, [
      req.user.id,
      mute_notifications !== undefined ? !mute_notifications : pref.app_enabled,
      mute_emails !== undefined ? !mute_emails : pref.email_enabled
    ]);

    return success(res, updated, 'Mute preferences updated');
  } catch (err) {
    next(err);
  }
};

// Helper to resolve user IDs based on audience selection, target role, user IDs, and team IDs
async function resolveAnnouncementTargetUsers(audienceType, targetRole, targetUserIds = [], targetTeamIds = []) {
  try {
    let specificUserIds = [];

    // 1. Resolve explicit targetUserIds
    if (Array.isArray(targetUserIds) && targetUserIds.length > 0) {
      const { rows } = await query(`SELECT id FROM users WHERE id = ANY($1::uuid[]) AND is_active = true`, [targetUserIds]);
      specificUserIds.push(...rows.map(r => r.id));
    }

    // 2. Resolve targetTeamIds if passed
    if (Array.isArray(targetTeamIds) && targetTeamIds.length > 0) {
      try {
        const { rows } = await query(`
          SELECT DISTINCT u.id 
          FROM users u
          LEFT JOIN partner_profiles pp ON pp.user_id = u.id
          WHERE u.is_active = true 
            AND (
              u.id = ANY($1::uuid[])
              OR pp.id = ANY($1::uuid[])
              OR (u.team_id IS NOT NULL AND u.team_id = ANY($1::uuid[]))
            )
        `, [targetTeamIds]);
        specificUserIds.push(...rows.map(r => r.id));
      } catch (e) {
        const { rows } = await query(`
          SELECT u.id FROM users u 
          LEFT JOIN partner_profiles pp ON pp.user_id = u.id 
          WHERE u.is_active = true AND (pp.id = ANY($1::uuid[]) OR u.id = ANY($1::uuid[]))
        `, [targetTeamIds]);
        specificUserIds.push(...rows.map(r => r.id));
      }
    }

    if (specificUserIds.length > 0) {
      return Array.from(new Set(specificUserIds));
    }

    const type = (audienceType || targetRole || 'ALL_USERS').toUpperCase();
    
    if (type === 'ALL_USERS' || type === 'ALL') {
      const { rows } = await query(`SELECT id FROM users WHERE is_active = true`);
      return rows.map(r => r.id);
    } else if (type === 'PARTNERS' || type === 'PARTNER') {
      const { rows } = await query(`SELECT id FROM users WHERE UPPER(role::text) = 'PARTNER' AND is_active = true`);
      return rows.map(r => r.id);
    } else if (type === 'EMPLOYEES' || type === 'EMPLOYEE') {
      const { rows } = await query(`SELECT id FROM users WHERE UPPER(role::text) = 'EMPLOYEE' AND is_active = true`);
      return rows.map(r => r.id);
    } else if (type === 'ADMIN' || type === 'ADMINS' || type === 'ADMINISTRATIVE_OPERATOR' || type === 'QD_OPERATOR' || type === 'PAN_CHECKER' || type === 'REMARK_OPERATOR') {
      const { rows } = await query(`SELECT id FROM users WHERE UPPER(role::text) IN ('ADMIN','SUPER_ADMIN','ADMINISTRATIVE_OPERATOR','QD_OPERATOR','PAN_CHECKER','REMARK_OPERATOR') AND is_active = true`);
      return rows.map(r => r.id);
    } else if (type === 'MANAGERS' || type === 'MANAGER') {
      const { rows } = await query(`
        SELECT id FROM users 
        WHERE (
          UPPER(COALESCE(designation::text, '')) ~* '\\m(MANAGER|MANAGERS)\\M' 
          OR UPPER(role::text) IN ('ADMIN', 'SUPER_ADMIN', 'MANAGER')
        ) AND is_active = true
      `);
      return rows.map(r => r.id);
    } else if (type === 'TEAM_LEADERS' || type === 'TL' || type === 'TEAM_LEADER') {
      const { rows } = await query(`
        SELECT id FROM users 
        WHERE (
          UPPER(COALESCE(designation::text, '')) ~* '\\m(TL|LEADER|TEAM LEADER)\\M' 
          OR UPPER(role::text) IN ('TEAM_LEADER', 'TL')
        ) AND is_active = true
      `);
      return rows.map(r => r.id);
    } else if (type === 'TELECALLERS' || type === 'TC' || type === 'TELECALLER') {
      const { rows } = await query(`
        SELECT id FROM users 
        WHERE (
          UPPER(COALESCE(designation::text, '')) ~* '\\m(TC|TELECALLER)\\M' 
          OR UPPER(role::text) IN ('TELECALLER', 'TC')
        ) AND is_active = true
      `);
      return rows.map(r => r.id);
    } else {
      const { rows } = await query(`SELECT id FROM users WHERE is_active = true`);
      return rows.map(r => r.id);
    }
  } catch (err) {
    console.error('Error resolving announcement target users:', err);
    return [];
  }
}

// Helper to log announcement audit events
async function logAnnouncementAudit(announcementId, action, userId, userName, oldVal = {}, newVal = {}) {
  try {
    await query(`
      INSERT INTO announcement_audit_logs (announcement_id, action, performed_by, performed_by_name, old_value, new_value)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [announcementId, action, userId || null, userName || 'Super Admin', JSON.stringify(oldVal), JSON.stringify(newVal)]);
  } catch (err) {
    console.error('Failed to log announcement audit:', err);
  }
}

// Purge static mock seed announcements safely without deleting real user announcements
async function ensureSeedAnnouncements() {
  try {
    // No-op: Do not automatically delete user announcements
  } catch (err) {
    // Ignore error
  }
}

// GET /announcements (list active matching user role OR full Super Admin console)
const getAnnouncements = async (req, res, next) => {
  try {
    await ensureSeedAnnouncements();
    const currentRole = (req.user?.role || 'CUSTOMER').toLowerCase();

    // If superadmin requesting all announcements for management
    if (['super_admin', 'admin'].includes(currentRole) && (req.query.admin === 'true' || req.originalUrl?.includes('/superadmin'))) {
      const { search, status, audience, priority, date_from, date_to } = req.query;
      let where = `WHERE 1=1`;
      const values = [];
      let idx = 1;

      if (search) {
        where += ` AND (a.title ILIKE $${idx} OR a.announcement_id ILIKE $${idx} OR a.short_description ILIKE $${idx})`;
        values.push(`%${search}%`);
        idx++;
      }
      if (status && status !== 'all') {
        where += ` AND LOWER(a.status) = LOWER($${idx})`;
        values.push(status);
        idx++;
      }
      if (audience && audience !== 'all') {
        where += ` AND (LOWER(a.audience_type) = LOWER($${idx}) OR LOWER(a.target_role) = LOWER($${idx}))`;
        values.push(audience);
        idx++;
      }
      if (priority && priority !== 'all') {
        where += ` AND LOWER(a.priority) = LOWER($${idx})`;
        values.push(priority);
        idx++;
      }
      if (date_from) {
        where += ` AND a.created_at >= $${idx}`;
        values.push(date_from);
        idx++;
      }
      if (date_to) {
        where += ` AND a.created_at <= $${idx}`;
        values.push(date_to);
        idx++;
      }

      const { rows } = await query(`
        SELECT 
          a.*,
          COALESCE(u.full_name, 'Super Admin') as creator_name,
          COALESCE(r.recipient_count, 0) as reach,
          COALESCE(r.read_count, 0) as views,
          COALESCE(r.ack_count, 0) as acknowledgements,
          CASE 
            WHEN COALESCE(r.recipient_count, 0) > 0 
            THEN ROUND((COALESCE(r.read_count, 0)::numeric / COALESCE(r.recipient_count, 1)::numeric) * 100, 1)
            ELSE 0 
          END as engagement_rate
        FROM announcements a
        LEFT JOIN users u ON u.id = a.created_by
        LEFT JOIN (
          SELECT 
            announcement_id,
            COUNT(*) as recipient_count,
            COUNT(read_at) as read_count,
            COUNT(acknowledged_at) as ack_count
          FROM announcement_recipients
          GROUP BY announcement_id
        ) r ON r.announcement_id = a.id
        ${where}
        ORDER BY a.created_at DESC
      `, values);

      return success(res, rows);
    }

    // User-facing announcements feed
    const userRole = (req.user?.role || '').toUpperCase();
    const userDesignation = (req.user?.designation || '').toUpperCase();

    const { rows } = await query(`
      SELECT DISTINCT a.*, 
        (ar.read_at IS NOT NULL) as is_read,
        (ar.acknowledged_at IS NOT NULL) as is_acknowledged
      FROM announcements a
      LEFT JOIN announcement_recipients ar ON ar.announcement_id = a.id AND ar.user_id = $1
      WHERE (LOWER(a.status) IN ('publish', 'published'))
        AND (a.expires_at IS NULL OR a.expires_at >= NOW())
        AND (
          ar.user_id = $1
          OR UPPER(COALESCE(a.audience_type, a.target_role, 'ALL_USERS')) IN ('ALL_USERS', 'ALL')
          OR ($2 = 'PARTNER' AND UPPER(COALESCE(a.audience_type, a.target_role, '')) IN ('PARTNERS', 'PARTNER'))
          OR ($2 = 'EMPLOYEE' AND UPPER(COALESCE(a.audience_type, a.target_role, '')) IN ('EMPLOYEES', 'EMPLOYEE'))
          OR ($2 IN ('ADMIN', 'SUPER_ADMIN', 'ADMINISTRATIVE_OPERATOR', 'QD_OPERATOR', 'PAN_CHECKER', 'REMARK_OPERATOR') AND UPPER(COALESCE(a.audience_type, a.target_role, '')) IN ('ADMIN', 'ADMINS', 'ADMINISTRATIVE_OPERATOR', 'QD_OPERATOR', 'PAN_CHECKER', 'REMARK_OPERATOR'))
          OR ($3 ~* '\\m(MANAGER|MANAGERS)\\M' AND UPPER(COALESCE(a.audience_type, a.target_role, '')) IN ('MANAGERS', 'MANAGER'))
          OR ($3 ~* '\\m(TL|LEADER|TEAM LEADER)\\M' AND UPPER(COALESCE(a.audience_type, a.target_role, '')) IN ('TEAM_LEADERS', 'TL', 'TEAM_LEADER'))
          OR ($3 ~* '\\m(TC|TELECALLER)\\M' AND UPPER(COALESCE(a.audience_type, a.target_role, '')) IN ('TELECALLERS', 'TC', 'TELECALLER'))
        )
      ORDER BY a.created_at DESC
    `, [req.user.id, userRole, userDesignation]);

    return success(res, rows);
  } catch (err) {
    next(err);
  }
};

// GET /superadmin/announcements/stats
const getAnnouncementStats = async (req, res, next) => {
  try {
    await ensureSeedAnnouncements();
    const [counts, reach, audience, priority, top, trend] = await Promise.all([
      query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE LOWER(status) IN ('publish','published')) as published,
          COUNT(*) FILTER (WHERE LOWER(status) IN ('schedule','scheduled')) as scheduled,
          COUNT(*) FILTER (WHERE LOWER(status) IN ('draft')) as drafts,
          COUNT(*) FILTER (WHERE LOWER(status) IN ('expired') OR (expires_at IS NOT NULL AND expires_at < NOW())) as expired
        FROM announcements
      `),
      query(`SELECT COUNT(DISTINCT user_id) as total_reach FROM announcement_recipients`),
      query(`
        SELECT 
          COALESCE(NULLIF(audience_type, ''), target_role, 'ALL_USERS') as audience,
          COUNT(*) as count
        FROM announcements
        GROUP BY 1
      `),
      query(`
        SELECT 
          UPPER(priority) as priority,
          COUNT(*) as count
        FROM announcements
        GROUP BY 1
      `),
      query(`
        SELECT 
          a.id, a.announcement_id, a.title, a.status, a.priority, a.created_at,
          COALESCE(r.recipient_count, 0) as reach,
          COALESCE(r.read_count, 0) as views,
          COALESCE(r.ack_count, 0) as acknowledgements,
          CASE 
            WHEN COALESCE(r.recipient_count, 0) > 0 
            THEN ROUND((COALESCE(r.read_count, 0)::numeric / COALESCE(r.recipient_count, 1)::numeric) * 100, 1)
            ELSE 0 
          END as engagement_rate
        FROM announcements a
        LEFT JOIN (
          SELECT 
            announcement_id,
            COUNT(*) as recipient_count,
            COUNT(read_at) as read_count,
            COUNT(acknowledged_at) as ack_count
          FROM announcement_recipients
          GROUP BY announcement_id
        ) r ON r.announcement_id = a.id
        ORDER BY engagement_rate DESC, reach DESC
        LIMIT 5
      `),
      query(`
        SELECT 
          TO_CHAR(created_at, 'YYYY-MM-DD') as date,
          COUNT(*) FILTER (WHERE LOWER(status) IN ('publish','published')) as published,
          COUNT(*) FILTER (WHERE LOWER(status) IN ('schedule','scheduled')) as scheduled,
          COUNT(*) FILTER (WHERE LOWER(status) IN ('draft')) as drafts
        FROM announcements
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY 1
        ORDER BY 1 ASC
      `)
    ]);

    return success(res, {
      kpis: {
        total: parseInt(counts.rows[0]?.total || 0),
        published: parseInt(counts.rows[0]?.published || 0),
        scheduled: parseInt(counts.rows[0]?.scheduled || 0),
        drafts: parseInt(counts.rows[0]?.drafts || 0),
        expired: parseInt(counts.rows[0]?.expired || 0),
        total_reach: parseInt(reach.rows[0]?.total_reach || 0),
      },
      audience_distribution: audience.rows,
      priority_distribution: priority.rows,
      top_performing: top.rows,
      trend_statistics: trend.rows
    });
  } catch (err) {
    next(err);
  }
};

// Helper to resolve announcement by UUID or Code safely without PostgreSQL type error
const getAnnouncementByIdOrCode = async (idOrCode) => {
  if (!idOrCode) return null;
  const { rows: [ann] } = await query(`
    SELECT a.*, u.full_name as creator_name, u.email as creator_email
    FROM announcements a
    LEFT JOIN users u ON u.id = a.created_by
    WHERE a.id::text = $1 OR a.announcement_id = $1
  `, [idOrCode]);
  return ann || null;
};

// GET /superadmin/announcement/:id/analytics
const getAnnouncementAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ann = await getAnnouncementByIdOrCode(id);

    if (!ann) return notFound(res, 'Announcement not found');

    const [aggregates, recipients, auditLogs] = await Promise.all([
      query(`
        SELECT 
          COUNT(*) as total_targeted,
          COUNT(*) FILTER (WHERE delivery_status = 'DELIVERED') as delivered,
          COUNT(*) FILTER (WHERE read_at IS NOT NULL) as viewed,
          COUNT(*) FILTER (WHERE clicked_at IS NOT NULL) as clicked,
          COUNT(*) FILTER (WHERE acknowledged_at IS NOT NULL) as acknowledged
        FROM announcement_recipients
        WHERE announcement_id = $1
      `, [ann.id]),
      query(`
        SELECT 
          ar.*, 
          u.full_name, u.email, u.role, u.designation,
          pp.partner_code
        FROM announcement_recipients ar
        JOIN users u ON u.id = ar.user_id
        LEFT JOIN partner_profiles pp ON pp.user_id = u.id
        WHERE ar.announcement_id = $1
        ORDER BY ar.created_at DESC
        LIMIT 200
      `, [ann.id]),
      query(`
        SELECT * FROM announcement_audit_logs
        WHERE announcement_id = $1
        ORDER BY created_at ASC
      `, [ann.id])
    ]);

    const agg = aggregates.rows[0] || {};
    const totalTargeted = parseInt(agg.total_targeted || 0);
    const delivered = parseInt(agg.delivered || 0);
    const viewed = parseInt(agg.viewed || 0);
    const clicked = parseInt(agg.clicked || 0);
    const acknowledged = parseInt(agg.acknowledged || 0);

    const engagementRate = totalTargeted > 0 ? ((viewed / totalTargeted) * 100).toFixed(1) : 0;

    return success(res, {
      announcement: ann,
      performance: {
        total_targeted: totalTargeted,
        delivered,
        viewed,
        clicked,
        acknowledged,
        engagement_rate: parseFloat(engagementRate)
      },
      recipients: recipients.rows,
      audit_timeline: auditLogs.rows
    });
  } catch (err) {
    next(err);
  }
};

// SUPER ADMIN announcement methods
const createAnnouncement = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { 
      title, short_description, message, description, banner_image, 
      audience_type, target_role, priority, delivery_channels, 
      target_user_ids, target_team_ids, scheduled_at, published_at, 
      expires_at, start_date, end_date, redirect_url, status 
    } = req.body;

    if (!title || (!message && !description)) {
      await client.query('ROLLBACK');
      return error(res, 'Title and message/description are required', 400);
    }

    const nextSeqRes = await client.query(`SELECT nextval('announcement_seq') as seq`);
    const annCode = `ANN-${nextSeqRes.rows[0].seq}`;

    const finalMessage = message || description;
    const finalShortDesc = short_description || (finalMessage ? finalMessage.substring(0, 150) : '');
    const finalStatus = (status || 'PUBLISHED').toUpperCase();
    const finalAudience = (audience_type || target_role || 'ALL_USERS').toUpperCase();
    const finalPriority = (priority || 'MEDIUM').toUpperCase();
    const finalChannels = JSON.stringify(delivery_channels || ['in-app']);

    let finalPublishedAt = null;
    if (finalStatus === 'PUBLISHED' || finalStatus === 'PUBLISH') {
      finalPublishedAt = published_at ? new Date(published_at) : new Date();
    } else if (published_at) {
      finalPublishedAt = new Date(published_at);
    }

    const { rows: [item] } = await client.query(`
      INSERT INTO announcements (
        announcement_id, title, short_description, message, description, banner_image, 
        audience_type, target_role, priority, status, delivery_channels, target_user_ids, 
        target_team_ids, scheduled_at, published_at, expires_at, start_date, end_date, redirect_url, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) 
      RETURNING *
    `, [
      annCode, title, finalShortDesc, finalMessage, finalMessage, banner_image || null, 
      finalAudience, finalAudience.toLowerCase(), finalPriority, finalStatus, finalChannels, 
      JSON.stringify(target_user_ids || []), JSON.stringify(target_team_ids || []), 
      scheduled_at || null, finalPublishedAt, expires_at || null, 
      start_date || null, end_date || null, redirect_url || null, req.user.id
    ]);

    // Audit Log
    await client.query(`
      INSERT INTO announcement_audit_logs (announcement_id, action, performed_by, performed_by_name, old_value, new_value)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [item.id, 'Created Announcement', req.user.id, req.user.full_name || 'Super Admin', '{}', JSON.stringify(item)]);

    let targetUsers = [];
    if (finalStatus === 'PUBLISHED' || finalStatus === 'PUBLISH') {
      targetUsers = await resolveAnnouncementTargetUsers(finalAudience, target_role, target_user_ids, target_team_ids);
      if (targetUsers.length > 0) {
        const chunkSize = 500;
        for (let i = 0; i < targetUsers.length; i += chunkSize) {
          const chunk = targetUsers.slice(i, i + chunkSize);
          const insertValues = [];
          const valueTuples = [];
          let paramIdx = 1;

          for (const uid of chunk) {
            valueTuples.push(`($${paramIdx++}, $${paramIdx++}, 'DELIVERED', NOW())`);
            insertValues.push(item.id, uid);
          }

          await client.query(`
            INSERT INTO announcement_recipients (announcement_id, user_id, delivery_status, delivered_at)
            VALUES ${valueTuples.join(', ')}
            ON CONFLICT (announcement_id, user_id) DO NOTHING
          `, insertValues);
        }

        await client.query(`UPDATE announcements SET reach_count = $1 WHERE id = $2`, [targetUsers.length, item.id]);
      }

      await client.query(`
        INSERT INTO announcement_audit_logs (announcement_id, action, performed_by, performed_by_name, old_value, new_value)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [item.id, 'Published Announcement', req.user.id, req.user.full_name || 'Super Admin', '{}', JSON.stringify({ reach: targetUsers.length })]);
    }

    await client.query('COMMIT');

    if ((finalStatus === 'PUBLISHED' || finalStatus === 'PUBLISH') && targetUsers.length > 0) {
      bulkNotify(targetUsers, title, finalShortDesc, 'info', { 
        category: 'announcement', 
        priority: finalPriority, 
        announcement_id: item.id 
      }).catch(err => console.error('Error sending bulk notifications:', err));
      broadcastLiveUpdate({ type: 'announcement', data: item });
    }

    return success(res, item, 'Announcement created successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

const updateAnnouncement = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const body = req.body || {};
    const { 
      title, short_description, message, description, banner_image, 
      audience_type, target_role, priority, delivery_channels, 
      target_user_ids, target_team_ids, scheduled_at, published_at, 
      expires_at, start_date, end_date, redirect_url, status 
    } = body;

    const existing = await getAnnouncementByIdOrCode(id);
    if (!existing) {
      await client.query('ROLLBACK');
      return notFound(res, 'Announcement not found');
    }

    const finalStatus = status ? status.toUpperCase() : existing.status;
    const finalAudience = audience_type || target_role || existing.audience_type;
    const transitionToPublished = finalStatus === 'PUBLISHED' && existing.status !== 'PUBLISHED';

    const updates = [];
    const values = [];
    let idx = 1;

    const addField = (colName, val) => {
      updates.push(`${colName} = $${idx++}`);
      values.push(val);
    };

    if (body.hasOwnProperty('title')) addField('title', title);
    if (body.hasOwnProperty('short_description')) addField('short_description', short_description);
    if (body.hasOwnProperty('message') || body.hasOwnProperty('description')) {
      const msgVal = message || description;
      addField('message', msgVal);
      addField('description', msgVal);
    }
    if (body.hasOwnProperty('banner_image')) addField('banner_image', banner_image);
    if (body.hasOwnProperty('audience_type') || body.hasOwnProperty('target_role')) {
      addField('audience_type', finalAudience ? finalAudience.toUpperCase() : null);
      addField('target_role', finalAudience ? finalAudience.toLowerCase() : null);
    }
    if (body.hasOwnProperty('priority')) addField('priority', priority ? priority.toUpperCase() : null);
    if (body.hasOwnProperty('status')) addField('status', finalStatus);
    if (body.hasOwnProperty('delivery_channels')) addField('delivery_channels', delivery_channels ? JSON.stringify(delivery_channels) : null);
    if (body.hasOwnProperty('target_user_ids')) addField('target_user_ids', target_user_ids ? JSON.stringify(target_user_ids) : null);
    if (body.hasOwnProperty('target_team_ids')) addField('target_team_ids', target_team_ids ? JSON.stringify(target_team_ids) : null);
    if (body.hasOwnProperty('scheduled_at')) addField('scheduled_at', scheduled_at);
    if (body.hasOwnProperty('expires_at')) addField('expires_at', expires_at);
    if (body.hasOwnProperty('start_date')) addField('start_date', start_date);
    if (body.hasOwnProperty('end_date')) addField('end_date', end_date);
    if (body.hasOwnProperty('redirect_url')) addField('redirect_url', redirect_url);
    
    if (body.hasOwnProperty('published_at')) {
      addField('published_at', published_at);
    } else if (transitionToPublished) {
      updates.push(`published_at = NOW()`);
    }

    updates.push(`updated_at = NOW()`);
    values.push(existing.id);

    const updateQuery = `
      UPDATE announcements SET
        ${updates.join(',\n        ')}
      WHERE id = $${idx} RETURNING *
    `;

    const { rows: [updated] } = await client.query(updateQuery, values);

    // Audit Log
    await client.query(`
      INSERT INTO announcement_audit_logs (announcement_id, action, performed_by, performed_by_name, old_value, new_value)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [existing.id, 'Updated Announcement', req.user.id, req.user.full_name || 'Super Admin', JSON.stringify(existing), JSON.stringify(updated)]);

    let targetUsers = [];
    if (transitionToPublished) {
      targetUsers = await resolveAnnouncementTargetUsers(
        updated.audience_type, 
        updated.target_role, 
        target_user_ids || (typeof updated.target_user_ids === 'string' ? JSON.parse(updated.target_user_ids) : updated.target_user_ids), 
        target_team_ids || (typeof updated.target_team_ids === 'string' ? JSON.parse(updated.target_team_ids) : updated.target_team_ids)
      );

      if (targetUsers.length > 0) {
        const chunkSize = 500;
        for (let i = 0; i < targetUsers.length; i += chunkSize) {
          const chunk = targetUsers.slice(i, i + chunkSize);
          const insertValues = [];
          const valueTuples = [];
          let paramIdx = 1;

          for (const uid of chunk) {
            valueTuples.push(`($${paramIdx++}, $${paramIdx++}, 'DELIVERED', NOW())`);
            insertValues.push(existing.id, uid);
          }

          await client.query(`
            INSERT INTO announcement_recipients (announcement_id, user_id, delivery_status, delivered_at)
            VALUES ${valueTuples.join(', ')}
            ON CONFLICT (announcement_id, user_id) DO NOTHING
          `, insertValues);
        }

        await client.query(`UPDATE announcements SET reach_count = $1 WHERE id = $2`, [targetUsers.length, existing.id]);
      }

      await client.query(`
        INSERT INTO announcement_audit_logs (announcement_id, action, performed_by, performed_by_name, old_value, new_value)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [existing.id, 'Published Announcement', req.user.id, req.user.full_name || 'Super Admin', '{}', JSON.stringify({ reach: targetUsers.length })]);
    }

    await client.query('COMMIT');

    if (transitionToPublished && targetUsers.length > 0) {
      bulkNotify(targetUsers, updated.title, updated.short_description || updated.message, 'info', { 
        category: 'announcement', 
        priority: updated.priority, 
        announcement_id: existing.id 
      }).catch(err => console.error('Error sending bulk notifications:', err));
      broadcastLiveUpdate({ type: 'announcement', data: updated });
    }

    return success(res, updated, 'Announcement updated successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

const publishAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    return updateAnnouncement({ ...req, params: { id }, body: { status: 'PUBLISHED' } }, res, next);
  } catch (err) {
    next(err);
  }
};

const scheduleAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { scheduled_at } = req.body;
    return updateAnnouncement({ ...req, params: { id }, body: { status: 'SCHEDULED', scheduled_at } }, res, next);
  } catch (err) {
    next(err);
  }
};

const cancelAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    return updateAnnouncement({ ...req, params: { id }, body: { status: 'CANCELLED' } }, res, next);
  } catch (err) {
    next(err);
  }
};

const deleteAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await getAnnouncementByIdOrCode(id);
    if (!existing) return notFound(res, 'Announcement not found');

    await logAnnouncementAudit(existing.id, 'Deleted Announcement', req.user.id, req.user.full_name || 'Super Admin', existing, {});
    await query(`DELETE FROM announcements WHERE id = $1`, [existing.id]);
    return success(res, {}, 'Announcement deleted successfully');
  } catch (err) {
    next(err);
  }
};

const recordAnnouncementRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const ann = await getAnnouncementByIdOrCode(id);
    const annUuid = ann ? ann.id : id;

    const existingRec = await query(`SELECT read_at FROM announcement_recipients WHERE announcement_id = $1 AND user_id = $2`, [annUuid, userId]);
    const isNewRead = existingRec.rows.length === 0 || existingRec.rows[0].read_at === null;

    await query(`
      INSERT INTO announcement_recipients (announcement_id, user_id, read_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (announcement_id, user_id) 
      DO UPDATE SET read_at = COALESCE(announcement_recipients.read_at, NOW())
    `, [annUuid, userId]);

    await query(`
      INSERT INTO announcement_reads (announcement_id, user_id, read_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (announcement_id, user_id) DO NOTHING
    `, [annUuid, userId]);

    if (isNewRead) {
      await query(`UPDATE announcements SET views_count = views_count + 1 WHERE id = $1`, [annUuid]);
    }

    return success(res, {}, 'Announcement read recorded');
  } catch (err) {
    next(err);
  }
};

const recordAnnouncementAck = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const ann = await getAnnouncementByIdOrCode(id);
    const annUuid = ann ? ann.id : id;

    const existingRec = await query(`SELECT acknowledged_at FROM announcement_recipients WHERE announcement_id = $1 AND user_id = $2`, [annUuid, userId]);
    const isNewAck = existingRec.rows.length === 0 || existingRec.rows[0].acknowledged_at === null;

    await query(`
      UPDATE announcement_recipients 
      SET acknowledged_at = NOW(), read_at = COALESCE(read_at, NOW()) 
      WHERE announcement_id = $1 AND user_id = $2
    `, [annUuid, userId]);

    await query(`
      UPDATE announcement_reads 
      SET acknowledged_at = NOW() 
      WHERE announcement_id = $1 AND user_id = $2
    `, [annUuid, userId]);

    if (isNewAck) {
      await query(`UPDATE announcements SET acknowledgements_count = acknowledgements_count + 1 WHERE id = $1`, [annUuid]);
    }

    return success(res, {}, 'Announcement acknowledged successfully');
  } catch (err) {
    next(err);
  }
};

const broadcastNotification = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { target_role, partner_ids, title, message, priority = 'MEDIUM', category = 'system' } = req.body;
    if (!title || !message) {
      await client.query('ROLLBACK');
      return error(res, 'Title and message are required', 400);
    }

    let targetUserIds = [];

    if (partner_ids && partner_ids.length > 0) {
      const { rows } = await client.query(`SELECT user_id FROM partner_profiles WHERE id = ANY($1::uuid[])`, [partner_ids]);
      targetUserIds = rows.map(r => r.user_id);
    } else if (target_role && target_role !== 'all') {
      const { rows } = await client.query(`SELECT id FROM users WHERE UPPER(role::text) = UPPER($1)`, [target_role]);
      targetUserIds = rows.map(r => r.id);
    } else {
      const { rows } = await client.query(`SELECT id FROM users WHERE is_active = true`);
      targetUserIds = rows.map(r => r.id);
    }

    const nextSeqRes = await client.query(`SELECT nextval('announcement_seq') as seq`);
    const annCode = `ANN-BCAST-${nextSeqRes.rows[0].seq}`;
    const finalAudience = (target_role && target_role !== 'all') ? target_role.toUpperCase() : 'ALL_USERS';
    const finalPriority = (priority || 'MEDIUM').toUpperCase();

    const { rows: [item] } = await client.query(`
      INSERT INTO announcements (
        announcement_id, title, short_description, message, description, 
        audience_type, target_role, priority, status, delivery_channels, 
        published_at, created_by, reach_count
      )
      VALUES ($1, $2, $3, $4, $4, $5, $6, $7, 'PUBLISHED', $8, NOW(), $9, $10)
      RETURNING *
    `, [
      annCode, title, message.substring(0, 150), message, 
      finalAudience, finalAudience.toLowerCase(), finalPriority, JSON.stringify(['in-app']), 
      req.user?.id || null, targetUserIds.length
    ]);

    if (targetUserIds.length > 0) {
      const chunkSize = 500;
      for (let i = 0; i < targetUserIds.length; i += chunkSize) {
        const chunk = targetUserIds.slice(i, i + chunkSize);
        const insertValues = [];
        const valueTuples = [];
        let paramIdx = 1;

        for (const uid of chunk) {
          valueTuples.push(`($${paramIdx++}, $${paramIdx++}, 'DELIVERED', NOW())`);
          insertValues.push(item.id, uid);
        }

        await client.query(`
          INSERT INTO announcement_recipients (announcement_id, user_id, delivery_status, delivered_at)
          VALUES ${valueTuples.join(', ')}
          ON CONFLICT (announcement_id, user_id) DO NOTHING
        `, insertValues);
      }
    }

    await client.query(`
      INSERT INTO announcement_audit_logs (announcement_id, action, performed_by, performed_by_name, old_value, new_value)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [item.id, 'Direct Broadcast Alert', req.user?.id, req.user?.full_name || 'Super Admin', '{}', JSON.stringify({ reach: targetUserIds.length })]);

    await client.query('COMMIT');

    if (targetUserIds.length > 0) {
      bulkNotify(targetUserIds, title, message, 'info', { category: category || 'announcement', priority: finalPriority, announcement_id: item.id })
        .catch(err => console.error('Error sending broadcast notifications:', err));
    }
    broadcastLiveUpdate({ type: 'announcement', data: item });

    return success(res, item, `Successfully broadcasted to ${targetUserIds.length} users.`);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
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
  toggleMute,
  getAnnouncements,
  getAnnouncementStats,
  getAnnouncementAnalytics,
  createAnnouncement,
  updateAnnouncement,
  publishAnnouncement,
  scheduleAnnouncement,
  cancelAnnouncement,
  deleteAnnouncement,
  recordAnnouncementRead,
  recordAnnouncementAck,
  broadcastNotification,
  getNotificationReports,
  getActivityLogsController,
  getAuditLogsController
};
