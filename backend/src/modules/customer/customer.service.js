const { query, getClient } = require('../../config/database');
const logger = require('../../config/logger');

/**
 * 360 Customer Profile Service
 */

// Helper to log customer timeline event
const logCustomerTimeline = async (clientOrDb, customerId, eventType, eventTitle, eventDescription, referenceType = null, referenceId = null, createdBy = null) => {
  const db = clientOrDb || { query };
  await db.query(`
    INSERT INTO customer_timeline (
      customer_id, event_type, event_title, event_description, reference_type, reference_id, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, [customerId, eventType, eventTitle, eventDescription, referenceType, referenceId, createdBy]);
};

// Helper to log customer activity
const logCustomerActivity = async (clientOrDb, customerId, activityType, performedBy, referenceType = null, referenceId = null, req = null) => {
  const db = clientOrDb || { query };
  const ip = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip) : null;
  const device = req ? req.headers['user-agent'] : null;
  await db.query(`
    INSERT INTO customer_activity_logs (
      customer_id, activity_type, performed_by, reference_type, reference_id, ip_address, device
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, [customerId, activityType, performedBy, referenceType, referenceId, ip, device]);
};

// Get Dashboard Metrics for Customer CRM Header
const getCustomerDashboardMetrics = async (partnerId = null, userId = null) => {
  let where = 'WHERE c.is_archived = false AND c.is_merged = false';
  const values = [];

  if (partnerId) {
    where += ' AND (c.created_by = $1 OR c.id IN (SELECT customer_id FROM applications WHERE partner_id = $2) OR c.id IN (SELECT customer_id FROM leads WHERE partner_id = $2))';
    values.push(userId || partnerId, partnerId);
  }

  const { rows: [metrics] } = await query(`
    SELECT
      COUNT(DISTINCT c.id) as total_customers,
      COUNT(DISTINCT c.id) FILTER (WHERE c.pipeline_status = 'new' OR c.created_at >= NOW() - INTERVAL '7 days') as new_customers,
      COUNT(DISTINCT c.id) FILTER (WHERE c.pipeline_status = 'interested' OR jsonb_array_length(COALESCE(c.product_interests, '[]'::jsonb)) > 0) as interested_customers,
      COUNT(DISTINCT a.id) as total_applications,
      COUNT(DISTINCT a.id) FILTER (WHERE a.status IN ('approved', 'disbursed', 'confirmed')) as approved_applications,
      COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'rejected') as rejected_applications,
      COALESCE(SUM(wl.credit) FILTER (WHERE wl.status = 'completed'), 0) as revenue_generated
    FROM customers c
    LEFT JOIN applications a ON a.customer_id = c.id
    LEFT JOIN wallet_ledger wl ON wl.application_id = a.id
    ${where}
  `, values);

  const totalApps = parseInt(metrics.total_applications || 0);
  const approvedApps = parseInt(metrics.approved_applications || 0);
  const conversionRate = totalApps > 0 ? parseFloat(((approvedApps / totalApps) * 100).toFixed(1)) : 0;

  return {
    total_customers: parseInt(metrics.total_customers || 0),
    new_customers: parseInt(metrics.new_customers || 0),
    interested_customers: parseInt(metrics.interested_customers || 0),
    total_applications: totalApps,
    approved_applications: approvedApps,
    rejected_applications: parseInt(metrics.rejected_applications || 0),
    conversion_rate: conversionRate,
    revenue_generated: parseFloat(metrics.revenue_generated || 0)
  };
};

// Check duplicates by Mobile, Email, PAN, Aadhaar
const checkDuplicateCustomer = async (mobile, email = null, panNumber = null, excludeId = null) => {
  let where = 'WHERE c.is_archived = false AND c.is_merged = false AND (c.mobile = $1';
  const values = [mobile];
  let idx = 2;

  if (email && email.trim()) {
    where += ` OR LOWER(c.email) = LOWER($${idx++})`;
    values.push(email.trim());
  }
  if (panNumber && panNumber.trim()) {
    where += ` OR UPPER(c.pan_number) = UPPER($${idx++})`;
    values.push(panNumber.trim());
  }
  where += ')';

  if (excludeId) {
    where += ` AND c.id != $${idx++}`;
    values.push(excludeId);
  }

  const { rows } = await query(`
    SELECT c.id, c.full_name, c.mobile, c.email, c.pan_number, c.pipeline_status, c.created_at,
           u.full_name as partner_name
    FROM customers c
    LEFT JOIN users u ON u.id = c.created_by
    ${where}
    LIMIT 5
  `, values);

  return rows;
};

// Get Full 360 Degree Customer Profile
const get360CustomerProfile = async (customerId, currentUserId = null) => {
  const { rows: [customer] } = await query(`
    SELECT c.*, 
           u.full_name as created_by_name, u.email as created_by_email, u.mobile as created_by_mobile,
           p.partner_code, p.first_name as partner_first_name, p.last_name as partner_last_name
    FROM customers c
    LEFT JOIN users u ON u.id = c.created_by
    LEFT JOIN partner_profiles p ON p.user_id = c.created_by
    WHERE c.id = $1
  `, [customerId]);

  if (!customer) return null;

  // Parallel fetch for all 360 sub-resources
  const [appsRes, docsRes, timelineRes, notesRes, followupsRes, commsRes, tagsRes, activityRes] = await Promise.all([
    // Applications grouped with product & bank info
    query(`
      SELECT a.*, p.name as product_name, p.category as product_category, b.name as bank_name, b.short_code as bank_code
      FROM applications a
      JOIN products p ON p.id = a.product_id
      JOIN banks b ON b.id = p.bank_id
      WHERE a.customer_id = $1
      ORDER BY a.created_at DESC
    `, [customerId]),

    // Documents
    query(`
      SELECT cd.*, u.full_name as verified_by_name 
      FROM customer_documents cd
      LEFT JOIN users u ON u.id = cd.verified_by
      WHERE cd.customer_id = $1
      ORDER BY cd.uploaded_at DESC
    `, [customerId]),

    // Timeline
    query(`
      SELECT ct.*, u.full_name as created_by_name
      FROM customer_timeline ct
      LEFT JOIN users u ON u.id = ct.created_by
      WHERE ct.customer_id = $1
      ORDER BY ct.created_at DESC
    `, [customerId]),

    // Notes
    query(`
      SELECT cn.*, u.full_name as author_name, u.role as author_role
      FROM customer_notes cn
      LEFT JOIN users u ON u.id = COALESCE(cn.user_id, cn.created_by)
      WHERE cn.customer_id = $1
      ORDER BY cn.is_pinned DESC, cn.created_at DESC
    `, [customerId]),

    // Followups
    query(`
      SELECT cf.*, u.full_name as creator_name
      FROM customer_followups cf
      LEFT JOIN users u ON u.id = cf.user_id
      WHERE cf.customer_id = $1
      ORDER BY cf.followup_date ASC
    `, [customerId]),

    // Communications
    query(`
      SELECT cc.*, u.full_name as sender_name
      FROM customer_communications cc
      LEFT JOIN users u ON u.id = cc.sent_by
      WHERE cc.customer_id = $1
      ORDER BY cc.sent_at DESC
    `, [customerId]),

    // Tags
    query(`SELECT tag_name, tag_color FROM customer_tags WHERE customer_id = $1`, [customerId]),

    // Activity Logs
    query(`
      SELECT cal.*, u.full_name as performer_name
      FROM customer_activity_logs cal
      LEFT JOIN users u ON u.id = cal.performed_by
      WHERE cal.customer_id = $1
      ORDER BY cal.created_at DESC
      LIMIT 20
    `, [customerId])
  ]);

  // Group applications by Category (Credit Cards, Personal Loan, Home Loan, etc.)
  const applicationsByCategory = {
    credit_card: [],
    personal_loan: [],
    home_loan: [],
    business_loan: [],
    insurance: [],
    other: []
  };

  appsRes.rows.forEach(app => {
    const cat = app.product_category || 'other';
    if (applicationsByCategory[cat]) {
      applicationsByCategory[cat].push(app);
    } else {
      applicationsByCategory['other'].push(app);
    }
  });

  return {
    overview: customer,
    applications: appsRes.rows,
    applications_by_category: applicationsByCategory,
    documents: docsRes.rows,
    timeline: timelineRes.rows,
    notes: notesRes.rows,
    followups: followupsRes.rows,
    communications: commsRes.rows,
    tags: tagsRes.rows,
    activity_logs: activityRes.rows
  };
};

// Merge 2 customer records into primary master customer
const mergeCustomers = async (primaryCustomerId, duplicateCustomerId, userId) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { rows: [primary] } = await client.query(`SELECT id, full_name FROM customers WHERE id = $1 FOR UPDATE`, [primaryCustomerId]);
    const { rows: [dup] } = await client.query(`SELECT id, full_name FROM customers WHERE id = $1 FOR UPDATE`, [duplicateCustomerId]);

    if (!primary || !dup) throw new Error('Primary or duplicate customer profile not found');

    // 1. Re-link applications
    await client.query(`UPDATE applications SET customer_id = $1 WHERE customer_id = $2`, [primaryCustomerId, duplicateCustomerId]);

    // 2. Re-link leads
    await client.query(`UPDATE leads SET customer_id = $1 WHERE customer_id = $2`, [primaryCustomerId, duplicateCustomerId]);

    // 3. Re-link sub-resources
    await client.query(`UPDATE customer_notes SET customer_id = $1 WHERE customer_id = $2`, [primaryCustomerId, duplicateCustomerId]);
    await client.query(`UPDATE customer_documents SET customer_id = $1 WHERE customer_id = $2`, [primaryCustomerId, duplicateCustomerId]);
    await client.query(`UPDATE customer_timeline SET customer_id = $1 WHERE customer_id = $2`, [primaryCustomerId, duplicateCustomerId]);
    await client.query(`UPDATE customer_followups SET customer_id = $1 WHERE customer_id = $2`, [primaryCustomerId, duplicateCustomerId]);
    await client.query(`UPDATE customer_communications SET customer_id = $1 WHERE customer_id = $2`, [primaryCustomerId, duplicateCustomerId]);
    await client.query(`UPDATE customer_activity_logs SET customer_id = $1 WHERE customer_id = $2`, [primaryCustomerId, duplicateCustomerId]);
    await client.query(`UPDATE customer_tags SET customer_id = $1 ON CONFLICT DO NOTHING WHERE customer_id = $2`, [primaryCustomerId, duplicateCustomerId]);

    // 4. Mark duplicate customer record as merged
    await client.query(`
      UPDATE customers 
      SET is_merged = true, merged_into_id = $1, is_archived = true, archived_at = NOW(), updated_at = NOW()
      WHERE id = $2
    `, [primaryCustomerId, duplicateCustomerId]);

    // 5. Log timeline event on primary customer
    await logCustomerTimeline(
      client, primaryCustomerId, 'merge', 'Merged Customer Record',
      `Merged duplicate customer record: ${dup.full_name} (${duplicateCustomerId}) into ${primary.full_name}`,
      'customer', duplicateCustomerId, userId
    );

    await client.query('COMMIT');
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  logCustomerTimeline,
  logCustomerActivity,
  getCustomerDashboardMetrics,
  checkDuplicateCustomer,
  get360CustomerProfile,
  mergeCustomers
};
