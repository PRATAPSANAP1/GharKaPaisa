const { query } = require('../../config/database');

/**
 * Designation & Role-based WhatsApp Permission Service
 * Validates: USER + ROLE + DESIGNATION + DATA SCOPE + TEMPLATE PERMISSION
 */

// Normalized Designation Helpers
function normalizeRole(role) {
  return (role || '').toUpperCase().trim();
}

function normalizeDesignation(desig) {
  return (desig || '').toUpperCase().trim().replace(/[\s_-]+/g, '_');
}

/**
 * Check if the user is authorized to send WhatsApp messages based on Role and Designation
 */
function canUserSendWhatsApp(user) {
  if (!user) return false;
  const role = normalizeRole(user.role);
  if (role === 'SUPER_ADMIN') return true;
  if (['ADMIN', 'EMPLOYEE', 'PARTNER', 'TEAM_MEMBER'].includes(role)) return true;
  return false;
}

/**
 * Check if user can send specific template category based on designation
 */
function canDesignationSendCategory(designation, role, category) {
  const normRole = normalizeRole(role);
  if (normRole === 'SUPER_ADMIN') return true;

  const normDesig = normalizeDesignation(designation);
  const cat = (category || '').toLowerCase().trim();

  // Admin designations
  if (normRole === 'ADMIN') {
    if (normDesig.includes('OPERATIONAL_HEAD') || normDesig.includes('OPERATIONS_HEAD')) return true;
    if (normDesig.includes('KYC_OPERATOR')) {
      return ['kyc', 'lead', 'application'].includes(cat);
    }
    if (normDesig.includes('PAN_CHECKER')) {
      return ['kyc', 'lead'].includes(cat);
    }
    if (normDesig.includes('QD_OPERATOR')) {
      return ['qd', 'application', 'lead'].includes(cat);
    }
    if (normDesig.includes('FINAL_STATUS_OPERATOR')) {
      return ['final_status', 'application', 'payment'].includes(cat);
    }
    if (normDesig.includes('ADMINISTRATIVE_SALES_EXECUTIVE') || normDesig.includes('SALES_OPERATOR')) {
      return ['lead', 'application', 'kyc', 'payment'].includes(cat);
    }
    if (normDesig.includes('ADMINISTRATIVE_OPERATOR')) {
      return ['lead', 'application', 'kyc', 'payment'].includes(cat);
    }
    if (normDesig.includes('REMARK_OPERATOR')) {
      return ['application', 'lead'].includes(cat);
    }
    if (normDesig.includes('BACKEND')) {
      return false; // Technical/Backend operators do not send marketing/customer messages
    }
    return true; // Default admin
  }

  // Employee designations
  if (normRole === 'EMPLOYEE') {
    if (normDesig.includes('BRANCH') || normDesig.includes('SENIOR_MANAGER') || normDesig.includes('MANAGER')) {
      return ['lead', 'application', 'kyc', 'final_status', 'payment'].includes(cat);
    }
    if (normDesig.includes('TEAM_LEADER') || normDesig.includes('TL')) {
      return ['lead', 'application', 'kyc'].includes(cat);
    }
    if (normDesig.includes('TELECALLER') || normDesig.includes('TC')) {
      return ['lead', 'application', 'kyc'].includes(cat);
    }
    return ['lead', 'application', 'kyc'].includes(cat);
  }

  // Partners and Team Members
  if (normRole === 'PARTNER' || normRole === 'TEAM_MEMBER') {
    return ['lead', 'application', 'kyc'].includes(cat);
  }

  return false;
}

/**
 * Validate that the sender has ownership or assignment scope over the recipient data
 */
async function validateDataScope(user, { customerId, applicationId, leadId, recipientMobile }) {
  const role = normalizeRole(user.role);
  if (role === 'SUPER_ADMIN') return true;

  // Operational Head & Admins have platform-wide application handling
  const desig = normalizeDesignation(user.designation);
  if (role === 'ADMIN' && (desig.includes('OPERATIONAL_HEAD') || desig.includes('ADMINISTRATIVE_OPERATOR') || desig.includes('KYC_OPERATOR') || desig.includes('PAN_CHECKER') || desig.includes('QD_OPERATOR') || desig.includes('FINAL_STATUS_OPERATOR'))) {
    return true;
  }

  // Partner Scope Validation: Must own the application/lead or customer
  if (role === 'PARTNER' || role === 'TEAM_MEMBER') {
    const { rows: [partner] } = await query(
      `SELECT id, parent_partner_id FROM partner_profiles WHERE user_id = $1`,
      [user.id]
    );
    if (!partner) return false;

    if (applicationId) {
      const { rows } = await query(
        `SELECT 1 FROM applications WHERE (id = $1 OR app_number = $1) AND (partner_id = $2 OR partner_id = $3)`,
        [applicationId, partner.id, partner.parent_partner_id || partner.id]
      );
      if (rows.length > 0) return true;
    }

    if (leadId) {
      const { rows } = await query(
        `SELECT 1 FROM leads WHERE id = $1 AND (partner_id = $2 OR partner_id = $3)`,
        [leadId, partner.id, partner.parent_partner_id || partner.id]
      );
      if (rows.length > 0) return true;
    }

    if (customerId) {
      const { rows } = await query(
        `SELECT 1 FROM applications WHERE customer_id = $1 AND (partner_id = $2 OR partner_id = $3)`,
        [customerId, partner.id, partner.parent_partner_id || partner.id]
      );
      if (rows.length > 0) return true;
    }

    return false;
  }

  // Employee Scope Validation
  if (role === 'EMPLOYEE') {
    if (applicationId) {
      const { rows } = await query(
        `SELECT 1 FROM applications WHERE (id = $1 OR app_number = $1) AND (submitted_by = $2 OR created_by = $2 OR employee_id = $2)`,
        [applicationId, user.id]
      );
      if (rows.length > 0) return true;
    }
    if (leadId) {
      const { rows } = await query(
        `SELECT 1 FROM leads WHERE id = $1 AND (assigned_to = $2 OR created_by = $2)`,
        [leadId, user.id]
      );
      if (rows.length > 0) return true;
    }
    // Managers & Branch Heads have broad visibility
    if (desig.includes('BRANCH') || desig.includes('MANAGER') || desig.includes('SR_MANAGER')) {
      return true;
    }
    return true; // allow telecaller if interacting via CRM lead
  }

  return true;
}

module.exports = {
  normalizeRole,
  normalizeDesignation,
  canUserSendWhatsApp,
  canDesignationSendCategory,
  validateDataScope
};
