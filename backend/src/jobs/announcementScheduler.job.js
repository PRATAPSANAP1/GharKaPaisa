const { query } = require('../config/database');
const logger = require('../config/logger');
const { bulkNotify, broadcastLiveUpdate } = require('../modules/notifications/service');

async function processScheduledAnnouncements() {
  try {
    const { rows: dueAnnouncements } = await query(`
      SELECT * FROM announcements
      WHERE status = 'SCHEDULED'
        AND scheduled_at IS NOT NULL
        AND scheduled_at <= NOW()
    `);

    if (!dueAnnouncements || dueAnnouncements.length === 0) return;

    logger.info(`[Announcement Scheduler] Found ${dueAnnouncements.length} scheduled announcement(s) due for publishing.`);

    for (const ann of dueAnnouncements) {
      try {
        const { resolveAnnouncementTargetUsers } = require('../modules/notifications/controller');
        
        let targetUserIds = [];
        try {
          targetUserIds = typeof ann.target_user_ids === 'string' ? JSON.parse(ann.target_user_ids) : (ann.target_user_ids || []);
        } catch (e) {
          targetUserIds = [];
        }

        let targetTeamIds = [];
        try {
          targetTeamIds = typeof ann.target_team_ids === 'string' ? JSON.parse(ann.target_team_ids) : (ann.target_team_ids || []);
        } catch (e) {
          targetTeamIds = [];
        }

        const targetUsers = await resolveAnnouncementTargetUsers(ann.audience_type, ann.target_role, targetUserIds, targetTeamIds);

        // Update status to PUBLISHED
        await query(`
          UPDATE announcements 
          SET status = 'PUBLISHED', published_at = NOW(), reach_count = $1, updated_at = NOW()
          WHERE id = $2
        `, [targetUsers.length, ann.id]);

        if (targetUsers.length > 0) {
          for (const uid of targetUsers) {
            await query(`
              INSERT INTO announcement_recipients (announcement_id, user_id, delivery_status, delivered_at)
              VALUES ($1, $2, 'DELIVERED', NOW())
              ON CONFLICT (announcement_id, user_id) DO NOTHING
            `).catch(() => {});
          }

          await bulkNotify(targetUsers, ann.title, ann.short_description || ann.message, 'info', {
            category: 'announcement',
            priority: ann.priority || 'MEDIUM',
            announcement_id: ann.id
          });
        }

        // Audit Log
        await query(`
          INSERT INTO announcement_audit_logs (announcement_id, action, performed_by, performed_by_name, old_value, new_value)
          VALUES ($1, 'Published Scheduled Announcement', $2, 'System Scheduler', $3, $4)
        `, [
          ann.id,
          ann.created_by,
          JSON.stringify({ status: 'SCHEDULED' }),
          JSON.stringify({ status: 'PUBLISHED', reach_count: targetUsers.length })
        ]);

        broadcastLiveUpdate({ type: 'announcement', data: { ...ann, status: 'PUBLISHED', reach_count: targetUsers.length } });

        logger.info(`[Announcement Scheduler] Successfully published announcement ${ann.announcement_id || ann.id} to ${targetUsers.length} user(s).`);
      } catch (annErr) {
        logger.error(`[Announcement Scheduler] Failed to publish announcement ${ann.id}:`, annErr.message);
      }
    }
  } catch (err) {
    logger.error('[Announcement Scheduler] Error executing scheduler job:', err.message);
  }
}

module.exports = {
  processScheduledAnnouncements
};
