const express = require('express');
const router = express.Router();
const { query } = require('../../config/database');
const jwtAuth = require('../../middleware/authentication/jwtAuth.middleware.js');
const roleCheck = require('../../middleware/authorization/role.middleware.js');
const { success, error } = require('../../utils/response/response');
const { logAction } = require('../admin/audit.service.js');

const DEFAULT_PUBLIC_SETTINGS = {
  hdfc_tata_neu_adobe_support_link: 'https://applyonline.hdfc.bank.in/cards/credit-cards?CHANNELSOURCE=SWCC&CHANNEL=DSA&DSACode=XSPY&LGcode=PTY01&LCcode=PTY01&LC2=PTY01&SMcode=S54558',
  tata_cobrand_hdfc_adobe_support_link: 'https://applyonline.hdfc.bank.in/cards/credit-cards.html?CHANNELSOURCE=TDCC&DEDUPE=N&DSACode=XYOH&LGcode=YOH5&LCcode=YOH5&LC2=A222&SMcode=S54558'
};

const PUBLIC_ALLOWLIST = new Set([
  'company_name',
  'company_phone',
  'company_email',
  'company_address',
  'theme',
  'logo_url',
  'app_name',
  'support_email',
  'terms_url',
  'privacy_url',
  'maintenance_mode',
  'digital_journey_link',
  'sbi_cc_digital_journey_link',
  'hdfc_fd_wes_cc_link',
  'hdfc_tata_neu_adobe_support_link',
  'tata_cobrand_hdfc_adobe_support_link'
]);

// Public or global check to fetch settings (Filtered for public consumption)
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query(`SELECT key, value FROM system_settings`);
    
    // Check if requester is authenticated Super Admin
    const isSuperAdmin = req.user && req.user.role === 'SUPER_ADMIN';

    const settings = rows.reduce((acc, curr) => {
      // If Super Admin, return all settings. Otherwise, enforce strict allowlist.
      if (isSuperAdmin || PUBLIC_ALLOWLIST.has(curr.key.toLowerCase())) {
        acc[curr.key] = curr.value;
      }
      return acc;
    }, { ...DEFAULT_PUBLIC_SETTINGS });

    return success(res, settings);
  } catch (err) {
    next(err);
  }
});

// Update settings (SuperAdmin only - supports single { key, value } or batch { settings: { ... } })
const handleUpdateSettings = async (req, res, next) => {
  try {
    const { key, value, settings } = req.body;

    // Batch update mode
    if (settings && typeof settings === 'object' && !Array.isArray(settings)) {
      const entries = Object.entries(settings);
      for (const [k, v] of entries) {
        if (k && v !== undefined && v !== null) {
          await query(`
            INSERT INTO system_settings (key, value)
            VALUES ($1, $2)
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
          `, [k, v.toString()]);
        }
      }
      await logAction(req, 'UPDATE_SYSTEM_SETTINGS_BATCH', null, { count: entries.length, keys: Object.keys(settings) });
      return success(res, {}, 'System settings updated successfully');
    }

    // Single setting mode
    if (!key || value === undefined) {
      return error(res, 'Setting key and value are required', 400);
    }

    await query(`
      INSERT INTO system_settings (key, value)
      VALUES ($1, $2)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `, [key, value.toString()]);

    await logAction(req, 'UPDATE_SYSTEM_SETTING', null, { key, value });

    return success(res, {}, `System setting '${key}' updated successfully`);
  } catch (err) {
    next(err);
  }
};

router.post('/', jwtAuth, roleCheck('SUPER_ADMIN'), handleUpdateSettings);
router.put('/', jwtAuth, roleCheck('SUPER_ADMIN'), handleUpdateSettings);

// Bank-Specific Direct Process Link Management
const bankDirectLinksCtrl = require('./bankDirectLinks.controller.js');
router.get('/bank-direct-links', jwtAuth, bankDirectLinksCtrl.listBankDirectProcessLinks);
router.get('/bank-direct-links/resolve-product/:productId', jwtAuth, bankDirectLinksCtrl.resolveProductDirectProcessLink);
router.get('/bank-direct-links/:bankId', jwtAuth, bankDirectLinksCtrl.getBankDirectProcessLinkByBankId);
router.post('/bank-direct-links', jwtAuth, roleCheck('SUPER_ADMIN'), bankDirectLinksCtrl.upsertBankDirectProcessLink);
router.put('/bank-direct-links', jwtAuth, roleCheck('SUPER_ADMIN'), bankDirectLinksCtrl.upsertBankDirectProcessLink);
router.put('/bank-direct-links/:bankId', jwtAuth, roleCheck('SUPER_ADMIN'), bankDirectLinksCtrl.upsertBankDirectProcessLink);

module.exports = router;

