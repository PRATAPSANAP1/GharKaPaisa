const { query, getClient } = require('../../config/database');
const logger = require('../../config/logger');
const QRCode = require('qrcode');

/**
 * Log Referral Link Click (Public)
 */
const logReferralClick = async (data) => {
  const {
    referral_code, campaign = 'direct', source = 'web', ip_address,
    browser, device, country, state, city, referrer, landing_url
  } = data;

  if (!referral_code) throw new Error('Referral code is required');

  // Validate partner with this referral code
  const { rows: [partner] } = await query(`
    SELECT id, referral_code FROM partner_profiles
    WHERE LOWER(partner_code) = LOWER($1) OR LOWER(id::text) = LOWER($1)
  `, [referral_code]);

  const partnerId = partner ? partner.id : null;

  const { rows: [click] } = await query(`
    INSERT INTO referral_clicks (
      partner_id, referral_code, campaign, source, ip_address,
      browser, device, country, state, city, referrer, landing_url, clicked_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
    RETURNING *
  `, [
    partnerId, referral_code, campaign, source, ip_address || null,
    browser || null, device || null, country || null, state || null, city || null,
    referrer || null, landing_url || null
  ]);

  // Increment clicks in referral_campaigns if campaign is specified
  if (partnerId && campaign && campaign !== 'direct') {
    await query(`
      UPDATE referral_campaigns
      SET clicks = clicks + 1
      WHERE partner_id = $1 AND LOWER(campaign_name) = LOWER($2)
    `, [partnerId, campaign]);
  }

  return click;
};

/**
 * Generate High-Resolution QR Code Data URL
 */
const generateReferralQR = async (partnerUuid) => {
  const registerUrl = `https://gharkapaisa.in/register?ref=${partnerUuid}`;
  try {
    const qrDataUrl = await QRCode.toDataURL(registerUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      color: {
        dark: '#0F766E',
        light: '#FFFFFF'
      }
    });
    return { qr_data_url: qrDataUrl, register_url: registerUrl };
  } catch (err) {
    logger.error('Failed to generate QR code:', err);
    throw err;
  }
};

/**
 * Get Live Referral Funnel Analytics
 */
const getReferralAnalytics = async (partnerId) => {
  const { rows: [clicksRow] } = await query(`
    SELECT 
      COUNT(*) as total_clicks,
      COUNT(*) FILTER (WHERE converted = TRUE) as registered_count
    FROM referral_clicks
    WHERE partner_id = $1
  `, [partnerId]);

  const { rows: [teamRow] } = await query(`
    SELECT 
      COUNT(*) as total_registrations,
      COUNT(*) FILTER (WHERE p.kyc_status = 'approved') as kyc_approved,
      COUNT(*) FILTER (WHERE p.status = 'active') as active_partners
    FROM partner_team_relationships ptr
    JOIN partner_profiles p ON p.id = ptr.child_partner_id
    WHERE ptr.parent_partner_id = $1
  `, [partnerId]);

  const { rows: [appRow] } = await query(`
    SELECT 
      COUNT(a.id) as total_applications,
      COUNT(a.id) FILTER (WHERE a.status = 'approved') as approved_applications,
      COALESCE(SUM(tc.commission_amount), 0) as total_override_commission
    FROM partner_team_relationships ptr
    JOIN applications a ON a.partner_id = ptr.child_partner_id
    LEFT JOIN team_commissions tc ON tc.parent_partner_id = ptr.parent_partner_id AND tc.application_id = a.id
    WHERE ptr.parent_partner_id = $1
  `, [partnerId]);

  return {
    clicks: parseInt(clicksRow?.total_clicks || 0),
    registrations: parseInt(teamRow?.total_registrations || 0),
    kyc_approved: parseInt(teamRow?.kyc_approved || 0),
    active_partners: parseInt(teamRow?.active_partners || 0),
    applications: parseInt(appRow?.total_applications || 0),
    approved_applications: parseInt(appRow?.approved_applications || 0),
    commission_earned: parseFloat(appRow?.total_override_commission || 0)
  };
};

/**
 * Lazy-Loading Expandable Team Tree Handler
 */
const getLazyTeamTree = async (partnerId, parentId = null) => {
  const rootId = parentId || partnerId;

  const { rows: children } = await query(`
    SELECT 
      ptr.child_partner_id as id,
      ptr.level,
      p.partner_code,
      p.first_name,
      p.last_name,
      p.kyc_status,
      p.status,
      p.children_count,
      p.active_team_count,
      p.created_at as joined_at,
      u.email,
      u.phone as mobile
    FROM partner_team_relationships ptr
    JOIN partner_profiles p ON p.id = ptr.child_partner_id
    JOIN users u ON u.id = p.user_id
    WHERE ptr.parent_partner_id = $1
    ORDER BY p.created_at DESC
  `, [rootId]);

  return children.map(c => ({
    ...c,
    has_children: parseInt(c.children_count || 0) > 0,
    full_name: `${c.first_name || ''} ${c.last_name || ''}`.trim()
  }));
};

/**
 * Automatic Parent & Grandparent Override Commission Calculation
 */
const autoTriggerParentOverrideCommission = async (childPartnerId, applicationId, childCommissionEarned) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Find Level 1 Parent
    const { rows: [rel1] } = await client.query(`
      SELECT parent_partner_id FROM partner_team_relationships
      WHERE child_partner_id = $1 AND level = 1
    `, [childPartnerId]);

    if (!rel1) {
      await client.query('COMMIT');
      return { override_processed: false };
    }

    const parentId = rel1.parent_partner_id;
    const parentOverrideAmount = parseFloat((childCommissionEarned * 0.10).toFixed(2)); // Default 10% override

    // Insert Level 1 Override in team_commissions
    const { rows: [tc1] } = await client.query(`
      INSERT INTO team_commissions (parent_partner_id, child_partner_id, application_id, commission_amount, level, status)
      VALUES ($1, $2, $3, $4, 1, 'pending')
      RETURNING *
    `, [parentId, childPartnerId, applicationId, parentOverrideAmount]);

    // Credit Level 1 Parent Wallet Held Balance
    const { createImmutableLedgerEntry } = require('../wallet/service.js');
    await createImmutableLedgerEntry(parentId, {
      transaction_type: 'TEAM_COMMISSION',
      credit: parentOverrideAmount,
      hold_days: 7,
      description: `Team Override Commission (Level 1) from Application #${applicationId.substring(0,8)}`,
      application_id: applicationId
    }, client);

    // Find Level 2 Grandparent
    const { rows: [rel2] } = await client.query(`
      SELECT parent_partner_id FROM partner_team_relationships
      WHERE child_partner_id = $1 AND level = 2
    `, [childPartnerId]);

    if (rel2) {
      const grandParentId = rel2.parent_partner_id;
      const grandParentOverrideAmount = parseFloat((childCommissionEarned * 0.05).toFixed(2)); // Default 5% override

      await client.query(`
        INSERT INTO team_commissions (parent_partner_id, child_partner_id, application_id, commission_amount, level, status)
        VALUES ($1, $2, $3, $4, 2, 'pending')
      `, [grandParentId, childPartnerId, applicationId, grandParentOverrideAmount]);

      await createImmutableLedgerEntry(grandParentId, {
        transaction_type: 'TEAM_COMMISSION',
        credit: grandParentOverrideAmount,
        hold_days: 7,
        description: `Team Override Commission (Level 2) from Application #${applicationId.substring(0,8)}`,
        application_id: applicationId
      }, client);
    }

    await client.query('COMMIT');
    return { override_processed: true, level_1_amount: parentOverrideAmount };
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Failed to trigger parent override commission:', err);
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Get Team Dashboard Summary Metrics
 */
const getTeamDashboardSummary = async (partnerId) => {
  const { rows: [p] } = await query(`
    SELECT children_count, direct_team_count, active_team_count, last_team_join, team_enabled, referral_enabled, referral_message
    FROM partner_profiles WHERE id = $1
  `, [partnerId]);

  const { rows: [todayJoin] } = await query(`
    SELECT COUNT(*) as count FROM partner_team_relationships ptr
    JOIN partner_profiles p ON p.id = ptr.child_partner_id
    WHERE ptr.parent_partner_id = $1 AND p.created_at >= CURRENT_DATE
  `, [partnerId]);

  const { rows: [earn] } = await query(`
    SELECT COALESCE(SUM(commission_amount), 0) as total_team_earnings
    FROM team_commissions
    WHERE parent_partner_id = $1
  `, [partnerId]);

  return {
    total_team: parseInt(p?.children_count || 0),
    today_joins: parseInt(todayJoin?.count || 0),
    active_partners: parseInt(p?.active_team_count || 0),
    team_earnings: parseFloat(earn?.total_team_earnings || 0),
    last_team_join: p?.last_team_join,
    team_enabled: p?.team_enabled ?? true,
    referral_enabled: p?.referral_enabled ?? true,
    referral_message: p?.referral_message || ''
  };
};

module.exports = {
  logReferralClick,
  generateReferralQR,
  getReferralAnalytics,
  getLazyTeamTree,
  autoTriggerParentOverrideCommission,
  getTeamDashboardSummary
};
