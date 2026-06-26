/** PostgreSQL user_role enum values — source of truth for RBAC */
const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  EMPLOYEE: 'EMPLOYEE',
  PARTNER: 'PARTNER',
};

const normalizeRole = (role) => String(role || '').trim().toUpperCase();

const isRole = (role, ...allowed) => {
  const normalized = normalizeRole(role);
  return allowed.map(normalizeRole).includes(normalized);
};

module.exports = {
  ...ROLES,
  ROLES,
  normalizeRole,
  isRole,
};
