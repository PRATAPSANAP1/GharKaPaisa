/**
 * Chatbot Constants & Response Enums
 */
const INTENTS = {
  PRODUCT_SEARCH: 'product_search',
  EXACT_PRODUCT: 'exact_product',
  BANK_PRODUCTS: 'bank_products',
  CATEGORY_SEARCH: 'category_search',
  APPLICATION_SEARCH: 'application_search',
  APPLICATION_STATUS: 'application_status',
  MY_TEAM: 'my_team',
  INCENTIVE_SEARCH: 'incentive_search',
  WALLET_INQUIRY: 'wallet_inquiry',
  KYC_STATUS: 'kyc_status',
  ONBOARDING_STATUS: 'onboarding_status',
  LEAD_PROCESS: 'lead_process',
  SUPPORT: 'support',
  GREETING: 'greeting',
  UNKNOWN: 'unknown'
};

const RESPONSE_TYPES = {
  TEXT: 'TEXT',
  PRODUCT: 'PRODUCT',
  PRODUCT_LIST: 'PRODUCT_LIST',
  BANK: 'BANK',
  BANK_PRODUCT_LIST: 'BANK_PRODUCT_LIST',
  APPLICATION: 'APPLICATION',
  APPLICATION_LIST: 'APPLICATION_LIST',
  TEAM: 'TEAM',
  INCENTIVE: 'INCENTIVE',
  ONBOARDING: 'ONBOARDING',
  QUICK_LINKS: 'QUICK_LINKS',
  ERROR: 'ERROR'
};

const USER_ROLES = {
  PUBLIC: 'PUBLIC',
  PARTNER: 'PARTNER',
  TEAM_MEMBER: 'TEAM_MEMBER',
  EMPLOYEE: 'EMPLOYEE',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN'
};

module.exports = {
  INTENTS,
  RESPONSE_TYPES,
  USER_ROLES
};
