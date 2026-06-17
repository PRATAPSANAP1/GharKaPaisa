const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const jwtAuth = require('../middleware/jwtAuth.middleware');
const roleCheck = require('../middleware/role.middleware');
const { success, error } = require('../utils/response');
const { logAction } = require('../services/audit.service');

// Public or global check to fetch settings
router.get('/', jwtAuth, async (req, res, next) => {
  try {
    const { rows } = await query(`SELECT key, value FROM system_settings`);
    const settings = rows.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    return success(res, settings);
  } catch (err) {
    next(err);
  }
});

// Update settings (SuperAdmin only)
router.post('/', jwtAuth, roleCheck('super_admin'), async (req, res, next) => {
  try {
    const { key, value } = req.body;
    if (!key || value === undefined) {
      return error(res, 'Setting key and value are required', 400);
    }

    await query(`
      INSERT INTO system_settings (key, value)
      VALUES ($1, $2)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `, [key, value.toString()]);

    await logAction(req.user.id, 'UPDATE_SYSTEM_SETTING', null, { key, value });

    return success(res, {}, `System setting '${key}' updated to '${value}' successfully`);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
