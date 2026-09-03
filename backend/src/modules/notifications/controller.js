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

// Helper to resolve user IDs based on audience selection
async function resolveAnnouncementTargetUsers(audienceType, targetRole, targetUserIds = []) {
  try {
    if (Array.isArray(targetUserIds) && targetUserIds.length > 0) {
      const { rows } = await query(`SELECT id FROM users WHERE id = ANY($1::uuid[])`, [targetUserIds]);
      return rows.map(r => r.id);
    }

    const type = (audienceType || targetRole || 'ALL_USERS').toUpperCase();
    
    if (type === 'ALL_USERS' || type === 'ALL') {
      const { rows } = await query(`SELECT id FROM users WHERE is_active = true`);
      return rows.map(r => r.id);
    } else if (type === 'PARTNERS' || type === 'PARTNER') {
      const { rows } = await query(`SELECT id FROM users WHERE role = 'PARTNER' AND is_active = true`);
      return rows.map(r => r.id);
    } else if (type === 'EMPLOYEES' || type === 'EMPLOYEE') {
      const { rows } = await query(`SELECT id FROM users WHERE role IN ('EMPLOYEE','ADMIN','HR','SUPER_ADMIN') AND is_active = true`);
      return rows.map(r => r.id);
    } else if (type === 'MANAGERS' || type === 'MANAGER') {
      const { rows } = await query(`SELECT id FROM users WHERE (designation ILIKE '%manager%' OR role = 'ADMIN') AND is_active = true`);
      return rows.map(r => r.id);
    } else if (type === 'TEAM_LEADERS' || type === 'TL' || type === 'TEAM_LEADER') {
      const { rows } = await query(`SELECT id FROM users WHERE (designation ILIKE '%leader%' OR designation ILIKE '%tl%') AND is_active = true`);
      return rows.map(r => r.id);
    } else if (type === 'TELECALLERS' || type === 'TC' || type === 'TELECALLER') {
      const { rows } = await query(`SELECT id FROM users WHERE (designation ILIKE '%telecaller%' OR designation ILIKE '%tc%') AND is_active = true`);
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

// Auto seed initial dynamic database records if announcements table is empty
async function ensureSeedAnnouncements() {
  try {
    const { rows: [{ count }] } = await query(`SELECT COUNT(*) FROM announcements`);
    if (parseInt(count) > 0) return;

    const seeds = [
      {
        code: 'ANN-1001',
        title: 'New Incentive Structure September 2026',
        short_desc: 'Updated payout tiers for Credit Card & Personal Loan approvals. Earn up to ₹750 extra per card.',
        msg: 'We are thrilled to announce a revamped incentive structure effective 1st September 2026. Partners and Telecallers will receive an additional ₹500 - ₹750 per approved credit card application. Ensure your document verifications are completed promptly.',
        audience: 'EMPLOYEES',
        priority: 'HIGH',
        status: 'PUBLISHED',
        channels: ['in-app', 'email']
      },
      {
        code: 'ANN-1002',
        title: 'Compliance Training Mandatory for All Telecallers',
        short_desc: 'Complete the RBI Digital Lending & Customer Consent compliance module by Friday.',
        msg: 'All Telecallers and Team Leaders must complete the 20-minute digital compliance certification by September 10th. Non-compliance will result in temporary lead routing suspension.',
        audience: 'TELECALLERS',
        priority: 'URGENT',
        status: 'PUBLISHED',
        channels: ['in-app', 'email', 'sms']
      },
      {
        code: 'ANN-1003',
        title: 'System Maintenance Notification - Banking Portal API',
        short_desc: 'Scheduled maintenance on 5th September 02:00 AM - 04:00 AM IST.',
        msg: 'Our banking partner APIs (HDFC, SBI, ICICI) will undergo scheduled core database maintenance. Lead punching and Instant Soft Approvals will be paused during this window.',
        audience: 'ALL_USERS',
        priority: 'MEDIUM',
        status: 'SCHEDULED',
        channels: ['in-app']
      },
      {
        code: 'ANN-1004',
        title: 'New Partner Onboarding Fast-Track Program',
        short_desc: 'Simplified 1-click KYC and instant wallet creation for Tier 2/3 city partners.',
        msg: 'We have upgraded the partner verification engine! All new DSA partners can now complete KYC via Aadhaar OTP within 2 minutes and start earning immediately.',
        audience: 'PARTNERS',
        priority: 'MEDIUM',
        status: 'PUBLISHED',
        channels: ['in-app']
      },
      {
        code: 'ANN-1005',
        title: 'Q3 Sales Performance Review & Rewards Announcement',
        short_desc: 'Top performing teams will receive Goa retreat packages and cash rewards.',
        msg: 'Draft details for Q3 rewards policy. Final review pending executive approval.',
        audience: 'MANAGERS',
        priority: 'LOW',
        status: 'DRAFT',
        channels: ['in-app', 'email']
      }
    ];

    const { rows: superAdmins } = await query(`SELECT id, full_name FROM users WHERE role = 'SUPER_ADMIN' LIMIT 1`);
    const creatorId = superAdmins[0]?.id || null;
    const creatorName = superAdmins[0]?.full_name || 'Super Admin';

    const { rows: activeUsers } = await query(`SELECT id FROM users WHERE is_active = true`);
    const allUserIds = activeUsers.map(u => u.id);

    for (const item of seeds) {
      const { rows: [ann] } = await query(`
        INSERT INTO announcements (
          announcement_id, title, short_description, message, description, 
          audience_type, target_role, priority, status, delivery_channels, 
          created_by, created_at, published_at
        ) VALUES ($1, $2, $3, $4, $4, $5, $6, $7, $8, $9, $10, NOW(), $11)
        RETURNING *
      `, [
        item.code, item.title, item.short_desc, item.msg, 
        item.audience, item.audience.toLowerCase(), item.priority, item.status, 
        JSON.stringify(item.channels), creatorId, 
        item.status === 'PUBLISHED' ? new Date() : null
      ]);

      await logAnnouncementAudit(ann.id, 'Seeded Dynamic Announcement', creatorId, creatorName, {}, ann);

      if (item.status === 'PUBLISHED' && allUserIds.length > 0) {
        for (let i = 0; i < allUserIds.length; i++) {
          const uid = allUserIds[i];
          const isRead = i % 2 === 0;
          const isAck = i % 3 === 0;
          await query(`
            INSERT INTO announcement_recipients (
              announcement_id, user_id, delivery_status, delivered_at, read_at, acknowledged_at
            ) VALUES ($1, $2, 'DELIVERED', NOW(), $3, $4)
            ON CONFLICT DO NOTHING
          `, [ann.id, uid, isRead ? new Date() : null, isAck ? new Date() : null]);
        }
        await query(`UPDATE announcements SET reach_count = $1 WHERE id = $2`, [allUserIds.length, ann.id]);
      }
    }
  } catch (err) {
    console.error('Error seeding initial announcements:', err);
  }
}

// GET /announcements (list active matching user role OR full Super Admin console)
const getAnnouncements = async (req, res, next) => {
  try {
    await ensureSeedAnnouncements();
    const userRole = (req.user?.role || 'CUSTOMER').toLowerCase();

    // If superadmin requesting all announcements for management
    if (['super_admin', 'admin'].includes(userRole) && (req.query.admin === 'true' || req.originalUrl?.includes('/superadmin'))) {
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
    const { rows } = await query(`
      SELECT a.*, 
        (ar.read_at IS NOT NULL) as is_read,
        (ar.acknowledged_at IS NOT NULL) as is_acknowledged
      FROM announcements a
      LEFT JOIN announcement_recipients ar ON ar.announcement_id = a.id AND ar.user_id = $1
      WHERE (LOWER(a.status) IN ('publish', 'published'))
        AND (a.expires_at IS NULL OR a.expires_at >= NOW())
      ORDER BY a.created_at DESC
    `, [req.user.id]);

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

// GET /superadmin/announcement/:id/analytics
const getAnnouncementAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows: [ann] } = await query(`
      SELECT a.*, u.full_name as creator_name, u.email as creator_email
      FROM announcements a
      LEFT JOIN users u ON u.id = a.created_by
      WHERE a.id = $1 OR a.announcement_id = $1
    `, [id]);

    if (!ann) return notFound(res, 'Announcement not found');

    const [recipients, auditLogs] = await Promise.all([
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

    const totalTargeted = recipients.rows.length;
    const delivered = recipients.rows.filter(r => r.delivery_status === 'DELIVERED').length;
    const viewed = recipients.rows.filter(r => r.read_at).length;
    const clicked = recipients.rows.filter(r => r.clicked_at).length;
    const acknowledged = recipients.rows.filter(r => r.acknowledged_at).length;

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
  try {
    const { 
      title, short_description, message, description, banner_image, 
      audience_type, target_role, priority, delivery_channels, 
      target_user_ids, target_team_ids, scheduled_at, published_at, 
      expires_at, start_date, end_date, redirect_url, status 
    } = req.body;

    if (!title || (!message && !description)) {
      return error(res, 'Title and message/description are required', 400);
    }

    const nextSeqRes = await query(`SELECT nextval('announcement_seq') as seq`);
    const annCode = `ANN-${nextSeqRes.rows[0].seq}`;

    const finalMessage = message || description;
    const finalShortDesc = short_description || (finalMessage ? finalMessage.substring(0, 150) : '');
    const finalStatus = (status || 'PUBLISHED').toUpperCase();
    const finalAudience = (audience_type || target_role || 'ALL_USERS').toUpperCase();
    const finalPriority = (priority || 'MEDIUM').toUpperCase();
    const finalChannels = JSON.stringify(delivery_channels || ['in-app']);

    const { rows: [item] } = await query(`
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
      scheduled_at || null, published_at || new Date(), expires_at || null, 
      start_date || null, end_date || null, redirect_url || null, req.user.id
    ]);

    // Audit Log
    await logAnnouncementAudit(item.id, 'Created Announcement', req.user.id, req.user.full_name || 'Super Admin', {}, item);

    // If published, resolve recipients and dispatch notifications
    if (finalStatus === 'PUBLISHED' || finalStatus === 'PUBLISH') {
      const targetUsers = await resolveAnnouncementTargetUsers(finalAudience, target_role, target_user_ids);
      if (targetUsers.length > 0) {
        for (const uid of targetUsers) {
          await query(`
            INSERT INTO announcement_recipients (announcement_id, user_id, delivery_status, delivered_at)
            VALUES ($1, $2, 'DELIVERED', NOW())
            ON CONFLICT (announcement_id, user_id) DO NOTHING
          `, [item.id, uid]).catch(() => {});
        }

        await bulkNotify(targetUsers, title, finalShortDesc, 'info', { 
          category: 'announcement', 
          priority: finalPriority, 
          announcement_id: item.id 
        });

        await query(`UPDATE announcements SET reach_count = $1 WHERE id = $2`, [targetUsers.length, item.id]);
      }

      await logAnnouncementAudit(item.id, 'Published Announcement', req.user.id, req.user.full_name || 'Super Admin', {}, { reach: targetUsers.length });
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
    const { 
      title, short_description, message, description, banner_image, 
      audience_type, target_role, priority, delivery_channels, 
      target_user_ids, target_team_ids, scheduled_at, published_at, 
      expires_at, start_date, end_date, redirect_url, status 
    } = req.body;

    const { rows: [existing] } = await query(`SELECT * FROM announcements WHERE id = $1 OR announcement_id = $1`, [id]);
    if (!existing) return notFound(res, 'Announcement not found');

    const finalStatus = status ? status.toUpperCase() : existing.status;
    const finalAudience = audience_type || target_role || existing.audience_type;

    const { rows: [updated] } = await query(`
      UPDATE announcements SET
        title = COALESCE($1, title),
        short_description = COALESCE($2, short_description),
        message = COALESCE($3, message),
        description = COALESCE($3, description),
        banner_image = COALESCE($4, banner_image),
        audience_type = COALESCE($5, audience_type),
        target_role = COALESCE($6, target_role),
        priority = COALESCE($7, priority),
        status = COALESCE($8, status),
        delivery_channels = COALESCE($9, delivery_channels),
        scheduled_at = COALESCE($10, scheduled_at),
        expires_at = COALESCE($11, expires_at),
        redirect_url = COALESCE($12, redirect_url),
        updated_at = NOW()
      WHERE id = $13 RETURNING *
    `, [
      title, short_description, message || description, banner_image, 
      finalAudience, finalAudience.toLowerCase(), priority ? priority.toUpperCase() : null, 
      finalStatus, delivery_channels ? JSON.stringify(delivery_channels) : null,
      scheduled_at, expires_at, redirect_url, existing.id
    ]);

    await logAnnouncementAudit(existing.id, 'Updated Announcement', req.user.id, req.user.full_name || 'Super Admin', existing, updated);

    // If transitioned to PUBLISHED, resolve recipients
    if (finalStatus === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
      const targetUsers = await resolveAnnouncementTargetUsers(updated.audience_type, updated.target_role, target_user_ids);
      if (targetUsers.length > 0) {
        for (const uid of targetUsers) {
          await query(`
            INSERT INTO announcement_recipients (announcement_id, user_id, delivery_status, delivered_at)
            VALUES ($1, $2, 'DELIVERED', NOW())
            ON CONFLICT (announcement_id, user_id) DO NOTHING
          `, [existing.id, uid]).catch(() => {});
        }
        await bulkNotify(targetUsers, updated.title, updated.short_description || updated.message, 'info', { 
          category: 'announcement', 
          priority: updated.priority, 
          announcement_id: existing.id 
        });
        await query(`UPDATE announcements SET reach_count = $1 WHERE id = $2`, [targetUsers.length, existing.id]);
      }
      await logAnnouncementAudit(existing.id, 'Published Announcement', req.user.id, req.user.full_name || 'Super Admin', {}, { reach: targetUsers.length });
      broadcastLiveUpdate({ type: 'announcement', data: updated });
    }

    return success(res, updated, 'Announcement updated successfully');
  } catch (err) {
    next(err);
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
    const { rows: [existing] } = await query(`SELECT * FROM announcements WHERE id = $1 OR announcement_id = $1`, [id]);
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

    await query(`
      INSERT INTO announcement_recipients (announcement_id, user_id, read_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (announcement_id, user_id) 
      DO UPDATE SET read_at = COALESCE(announcement_recipients.read_at, NOW())
    `, [id, userId]);

    await query(`
      INSERT INTO announcement_reads (announcement_id, user_id, read_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (announcement_id, user_id) DO NOTHING
    `, [id, userId]);

    await query(`UPDATE announcements SET views_count = views_count + 1 WHERE id = $1`, [id]);

    return success(res, {}, 'Announcement read recorded');
  } catch (err) {
    next(err);
  }
};

const recordAnnouncementAck = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await query(`
      UPDATE announcement_recipients 
      SET acknowledged_at = NOW(), read_at = COALESCE(read_at, NOW()) 
      WHERE announcement_id = $1 AND user_id = $2
    `, [id, userId]);

    await query(`
      UPDATE announcement_reads 
      SET acknowledged_at = NOW() 
      WHERE announcement_id = $1 AND user_id = $2
    `, [id, userId]);

    await query(`UPDATE announcements SET acknowledgements_count = acknowledgements_count + 1 WHERE id = $1`, [id]);

    return success(res, {}, 'Announcement acknowledged successfully');
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
