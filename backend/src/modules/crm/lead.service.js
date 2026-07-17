const { query, getClient } = require('../../config/database');
const logger = require('../../config/logger');

/**
 * Enterprise Lead Orchestration Service
 */

// Helper to log lead timeline event
const logLeadTimeline = async (clientOrDb, leadId, title, description, referenceType = null, referenceId = null, createdBy = null) => {
  const db = clientOrDb || { query };
  await db.query(`
    INSERT INTO lead_timeline (lead_id, title, description, reference_type, reference_id, created_by)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [leadId, title, description, referenceType, referenceId, createdBy]);
};

// Helper to log lead activity
const logLeadActivity = async (clientOrDb, leadId, activityType, performedBy, referenceType = null, referenceId = null, req = null) => {
  const db = clientOrDb || { query };
  const ip = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip) : null;
  const device = req ? req.headers['user-agent'] : null;
  await db.query(`
    INSERT INTO lead_activity_logs (lead_id, activity_type, performed_by, reference_type, reference_id, ip_address, device)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, [leadId, activityType, performedBy, referenceType, referenceId, ip, device]);
};

// Initialize default verification checklist & SLA tracker upon lead creation
const initializeLeadPipeline = async (leadId, userId, source = 'partner', priority = 'medium') => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // 1. Log Initial Status History
    await client.query(`
      INSERT INTO lead_status_history (lead_id, old_status, new_status, changed_by, remarks)
      VALUES ($1, NULL, 'pending', $2, 'Lead initialized in pipeline')
    `, [leadId, userId]);

    // 2. Default Verification Checklist items
    const checklistItems = ['PAN Document', 'Aadhaar Card', 'Income Proof', 'Bank Account Verification', 'Address Proof'];
    for (const item of checklistItems) {
      await client.query(`
        INSERT INTO lead_checklist (lead_id, item, status)
        VALUES ($1, $2, 'pending')
        ON CONFLICT DO NOTHING
      `, [leadId, item]);
    }

    // 3. Initialize SLA tracker for initial stage
    await client.query(`
      INSERT INTO lead_sla (lead_id, stage_name, started_at, expected_time_hours)
      VALUES ($1, 'created', NOW(), 24)
    `, [leadId]);

    // 4. Log initial timeline stream
    await logLeadTimeline(client, leadId, 'Lead Created', `Lead initialized via ${source} source with ${priority} priority`, 'lead', leadId, userId);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error(`Failed to initialize lead pipeline for lead ${leadId}:`, err);
  } finally {
    client.release();
  }
};

// Automatic Commission Payout trigger on Bank Approval
const triggerAutomaticCommissionPayout = async (leadId, approvedAmount = null, changedBy = null) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // 1. Fetch Lead Details
    const { rows: [lead] } = await client.query(`
      SELECT l.*, p.commission_type, p.commission_value, p.name as product_name,
             pp.id as partner_profile_id, pp.user_id as partner_user_id
      FROM leads l
      JOIN products p ON p.id = l.product_id
      JOIN partner_profiles pp ON pp.id = l.partner_id
      WHERE l.id = $1
    `, [leadId]);

    if (!lead) throw new Error(`Lead ${leadId} not found`);

    // 2. Calculate Commission
    const commType = lead.commission_type || 'fixed';
    const commVal = parseFloat(lead.commission_value || 0);
    const loanAmount = parseFloat(approvedAmount || lead.loan_amount || 100000);
    let calculatedCommission = 0;

    if (commType === 'percentage') {
      calculatedCommission = (loanAmount * commVal) / 100;
    } else {
      calculatedCommission = commVal;
    }

    // 3. Insert into commission_ledger
    const { rows: [ledger] } = await client.query(`
      INSERT INTO commission_ledger (
        partner_id, lead_id, product_name, transaction_amount, commission_rate,
        commission_earned, status
      ) VALUES ($1, $2, $3, $4, $5, $6, 'Pending Approval')
      RETURNING *
    `, [lead.partner_profile_id, leadId, lead.product_name, loanAmount, commVal, calculatedCommission]);

    // 4. Credit held balance on partner_wallets
    await client.query(`
      INSERT INTO partner_wallets (partner_id, available_balance, hold_balance, total_earned)
      VALUES ($1, 0, $2, $2)
      ON CONFLICT (partner_id) DO UPDATE
      SET hold_balance = partner_wallets.hold_balance + EXCLUDED.hold_balance,
          total_earned = partner_wallets.total_earned + EXCLUDED.total_earned,
          updated_at = NOW()
    `, [lead.partner_profile_id, calculatedCommission]);

    // 5. Record Wallet Transaction Entry
    await client.query(`
      INSERT INTO wallet_transactions (
        wallet_id, partner_id, lead_id, type, amount, status, description
      ) VALUES (
        (SELECT id FROM partner_wallets WHERE partner_id = $1),
        $1, $2, 'credit', $3, 'Pending Approval', $4
      )
    `, [lead.partner_profile_id, leadId, calculatedCommission, `Hold payout for lead ${lead.customer_name} (${lead.product_name})`]);

    // 6. Log Timeline & Activity Stream
    await logLeadTimeline(client, leadId, 'Commission Generated', `₹${calculatedCommission.toLocaleString()} commission credited to partner held balance`, 'commission_ledger', ledger.id, changedBy);
    await logLeadTimeline(client, leadId, 'Wallet Updated', `₹${calculatedCommission.toLocaleString()} added to partner held balance (Pending admin approval)`, 'wallet', lead.partner_profile_id, changedBy);

    await client.query('COMMIT');
    logger.info(`Successfully triggered automatic commission payout of ₹${calculatedCommission} for lead ${leadId}`);
    return ledger;
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error(`Failed to trigger automatic commission payout for lead ${leadId}:`, err);
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  logLeadTimeline,
  logLeadActivity,
  initializeLeadPipeline,
  triggerAutomaticCommissionPayout
};
