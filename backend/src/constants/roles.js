/** PostgreSQL user_role enum values — source of truth for RBAC */
const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  EMPLOYEE: 'EMPLOYEE',
  PARTNER: 'PARTNER',
  TEAM_MEMBER: 'TEAM_MEMBER',
};

const normalizeRole = (role) => String(role || '').trim().toUpperCase();

const isRole = (role, ...allowed) => {
  const normalized = normalizeRole(role);
  return allowed.map(normalizeRole).includes(normalized);
};

const DESIGNATIONS = {
  OPERATIONAL_HEAD: 'Operational Head',
  ADMINISTRATIVE_OPERATOR: 'Administrative Operator',
  ADMINISTRATIVE_SALES_EXECUTIVE: 'Administrative Sales Executive',
  PAN_CHECKER: 'PAN Checker',
  REMARK_OPERATOR: 'Remark Operator',
  SUPER_ADMIN: 'Super Admin',
};

module.exports = {
  ...ROLES,
  ROLES,
  DESIGNATIONS,
  normalizeRole,
  isRole,
};

