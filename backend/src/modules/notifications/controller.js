const { query } = require('../../config/database');
const { getPaginationParams } = require('../../utils/helpers/helpers');
const { success, paginate, error, notFound } = require('../../utils/response/response');

// GET /notifications
const getNotifications = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const { unread_only } = req.query;

    let where = `WHERE user_id = $1`;
    const values = [req.user.id];
    if (unread_only === 'true') where += ` AND is_read = false`;

    const [count, data, unreadCount] = await Promise.all([
      query(`SELECT COUNT(*) FROM notifications ${where}`, values),
      query(`SELECT * FROM notifications ${where} ORDER BY created_at DESC LIMIT $2 OFFSET $3`, [...values, limit, offset]),
      query(`SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`, [req.user.id]),
    ]);

    return success(res, {
      notifications: data.rows,
      unread_count: parseInt(unreadCount.rows[0].count),
      pagination: { total: parseInt(count.rows[0].count), page, limit, totalPages: Math.ceil(count.rows[0].count / limit) }
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /notifications/:id/read
const markRead = async (req, res, next) => {
  try {
    const result = await query(`UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`, [req.params.id, req.user.id]);
    if (result.rowCount === 0) {
      return notFound(res, 'Notification not found');
    }
    return success(res, {}, 'Marked as read');
  } catch (err) {
    next(err);
  }
};

// PATCH /notifications/read-all
const markAllRead = async (req, res, next) => {
  try {
    await query(`UPDATE notifications SET is_read = true WHERE user_id = $1`, [req.user.id]);
    return success(res, {}, 'All notifications marked as read');
  } catch (err) {
    next(err);
  }
};

module.exports = { getNotifications, markRead, markAllRead };
