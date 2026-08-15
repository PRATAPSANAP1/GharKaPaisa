const express = require('express');
const router = express.Router();
const { query } = require('../../config/database');
const jwtAuth = require('../../middleware/authentication/jwtAuth.middleware.js');
const roleCheck = require('../../middleware/authorization/role.middleware.js');
const { success, error } = require('../../utils/response/response');
const { logAction } = require('../admin/audit.service.js');

// Public or global check to fetch settings
router.get('/', async (req, res, next) => {
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
router.post('/', jwtAuth, roleCheck('SUPER_ADMIN'), async (req, res, next) => {
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

    await logAction(req, 'UPDATE_SYSTEM_SETTING', null, { key, value });

    return success(res, {}, `System setting '${key}' updated to '${value}' successfully`);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
