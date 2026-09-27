const { query } = require('../../config/database');

/**
 * WhatsApp Template Interpolation & Validation Service
 */

function formatIndianMobile(rawMobile) {
  if (!rawMobile) return '';
  let cleaned = String(rawMobile).replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+${cleaned}`;
  }
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  return `+91${cleaned.slice(-10)}`;
}

/**
 * Render template text with dynamic variable substitutions
 */
function interpolateTemplate(templateBody, variables = {}) {
  if (!templateBody || typeof templateBody !== 'string') return '';
  let rendered = templateBody;

  // Replace {{var_name}} with provided values or fallback
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
    rendered = rendered.replace(regex, value != null ? String(value) : '');
  }

  // Remove any remaining unfilled placeholder tags gracefully
  rendered = rendered.replace(/{{\s*[\w_]+\s*}}/g, '');
  return rendered.trim();
}

/**
 * Get active template by name or ID
 */
async function getTemplateByNameOrId(nameOrId) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(nameOrId);
  const sql = isUuid
    ? `SELECT * FROM whatsapp_templates WHERE id = $1 AND status = 'APPROVED'`
    : `SELECT * FROM whatsapp_templates WHERE template_name = $1 AND status = 'APPROVED'`;

  const { rows } = await query(sql, [nameOrId]);
  return rows[0] || null;
}

/**
 * List all available templates with role/designation filters
 */
async function listTemplatesForUser(user) {
  const role = (user?.role || '').toUpperCase();
  const isSuperAdmin = role === 'SUPER_ADMIN';

  let sql = `SELECT * FROM whatsapp_templates`;
  const params = [];

  if (!isSuperAdmin) {
    sql += ` WHERE status = 'APPROVED' AND (
      allowed_roles @> $1::jsonb OR allowed_roles = '[]'::jsonb
    )`;
    params.push(JSON.stringify([role]));
  }

  sql += ` ORDER BY template_category ASC, template_name ASC`;
  const { rows } = await query(sql, params);
  return rows;
}

module.exports = {
  formatIndianMobile,
  interpolateTemplate,
  getTemplateByNameOrId,
  listTemplatesForUser
};
