/**
 * Official 6-Stage Application Lifecycle Constants for GharKaPaisa Lead Management System
 */
const APPLICATION_STATUS = {
  PENDING: 'pending',
  DETAILS_SUBMITTED: 'details_submitted',
  OPERATIONAL_VERIFIED: 'operational_verified',
  APPROVED: 'approved',
  COMMISSION_RELEASED: 'commission_released',
  COMMISSION_RECEIVED: 'commission_received'
};

const ALLOWED_STATUSES = Object.values(APPLICATION_STATUS);

const VALID_TRANSITIONS = {
  pending: ['details_submitted'],
  details_submitted: ['operational_verified', 'approved'],
  operational_verified: ['approved'],
  approved: ['commission_released'],
  commission_released: ['commission_received'],
  commission_received: []
};

const ROLE_PERMISSIONS = {
  details_submitted: ['PARTNER', 'TEAM_MEMBER', 'ADMINISTRATIVE_OPERATOR', 'OPERATIONS', 'OPERATIONS_HEAD', 'ADMIN', 'SUPER_ADMIN'],
  operational_verified: ['ADMINISTRATIVE_OPERATOR', 'OPERATIONS', 'OPERATIONS_HEAD', 'ADMIN', 'SUPER_ADMIN'],
  approved: ['OPERATIONS_HEAD', 'ADMIN', 'SUPER_ADMIN'],
  commission_released: ['SUPER_ADMIN'],
  commission_received: ['SUPER_ADMIN']
};

module.exports = {
  APPLICATION_STATUS,
  ALLOWED_STATUSES,
  VALID_TRANSITIONS,
  ROLE_PERMISSIONS,
  // Legacy aliases for backward compatibility mapping
  SUBMITTED: 'details_submitted',
  DOCUMENTS_PENDING: 'pending',
  UNDER_REVIEW: 'details_submitted',
  APPROVED: 'approved',
  REJECTED: 'approved', // stored in final_status / decline_reason
  DISBURSED: 'approved'  // stored in final_status
};
