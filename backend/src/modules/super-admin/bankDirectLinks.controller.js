const { query, getClient } = require('../../config/database');
const { success, created, error, notFound, forbidden } = require('../../utils/response/response');
const { logAction } = require('../admin/audit.service');
const { ensureBankDirectProcessLinksTable } = require('../../database/migrations/migrate_bank_direct_process_links');
const logger = require('../../config/logger');
const { validateDirectProcessUrl: serviceValidateUrl, resolveDirectProcessLinkForProductRow: serviceResolveLink, getBankApplyLinkBackend } = require('../../services/bankLink.service');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SENSITIVE_QUERY_PARAM_REGEX = /^(token|access_token|refresh_token|id_token|secret|client_secret|password|pass|pwd|key|api_key|apikey|auth|authorization|pan|pan_number|mobile|phone|aadhaar|otp|ssn|credential|session| sessionid|jwt|signature|sig)$/i;

/**
 * Validates that a Direct Process link is a non-empty, well-formed HTTP/HTTPS URL.
 * Rejects javascript:, data:, file:, and other unsafe schemes.
 */
const validateDirectProcessUrl = (rawUrl) => {
  if (typeof rawUrl !== 'string') {
    return { valid: false, message: 'Direct Process Link is required and must be a string.' };
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { valid: false, message: 'Direct Process Link cannot be empty.' };
  }

  if (/\s/.test(trimmed) || /[\u0000-\u001F\u007F]/.test(trimmed)) {
    return { valid: false, message: 'Direct Process Link contains invalid whitespace or control characters.' };
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch (_) {
    return { valid: false, message: 'Please enter a valid URL (e.g. https://bank.example.com/apply).' };
  }

  const protocol = String(parsed.protocol || '').toLowerCase();
  if (protocol !== 'http:' && protocol !== 'https:') {
    return {
      valid: false,
      message: 'Unsupported URL scheme. Only http:// and https:// URLs are allowed.'
    };
  }

  const hostname = String(parsed.hostname || '').trim().toLowerCase();
  if (!hostname || (!hostname.includes('.') && hostname !== 'localhost')) {
    return { valid: false, message: 'Direct Process Link must include a valid domain name.' };
  }

  return { valid: true, url: trimmed };
};

/**
 * Sanitizes a URL before recording in audit logs to avoid exposing credentials or personal data
 * in query parameters or URL userinfo.
 */
const sanitizeUrlForAudit = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  try {
    const parsed = new URL(rawUrl.trim());
    parsed.username = '';
    parsed.password = '';
    for (const key of Array.from(parsed.searchParams.keys())) {
      if (SENSITIVE_QUERY_PARAM_REGEX.test(key)) {
        parsed.searchParams.set(key, '[REDACTED]');
      }
    }
    return parsed.toString();
  } catch (_) {
    return '[INVALID_URL]';
  }
};

/**
 * GET /api/v1/settings/bank-direct-links
 * Retrieves all configured bank-specific Direct Process links.
 */
const listBankDirectProcessLinks = async (req, res, next) => {
  try {
    await ensureBankDirectProcessLinksTable();

    const { rows } = await query(`
      SELECT
        bdpl.id,
        bdpl.bank_id,
        b.name AS bank_name,
        b.short_code AS bank_short_code,
        b.logo_url AS bank_logo,
        b.is_active AS bank_is_active,
        b.status AS bank_status,
        bdpl.direct_process_link,
        bdpl.created_at,
        bdpl.updated_at,
        bdpl.created_by,
        bdpl.updated_by,
        cu.full_name AS created_by_name,
        uu.full_name AS updated_by_name
      FROM bank_direct_process_links bdpl
      JOIN banks b ON b.id = bdpl.bank_id
      LEFT JOIN users cu ON cu.id = bdpl.created_by
      LEFT JOIN users uu ON uu.id = bdpl.updated_by
      ORDER BY b.name ASC
    `);

    return success(res, rows, 'Configured bank Direct Process links retrieved successfully.');
  } catch (err) {
    logger.error('Failed to retrieve bank Direct Process links:', err.message);
    next(err);
  }
};

/**
 * GET /api/v1/settings/bank-direct-links/:bankId
 * Retrieves the configured Direct Process link for a specific bank.
 */
const getBankDirectProcessLinkByBankId = async (req, res, next) => {
  try {
    await ensureBankDirectProcessLinksTable();

    const bankId = String(req.params.bankId || req.query.bank_id || '').trim();
    if (!bankId || !UUID_REGEX.test(bankId)) {
      return error(res, 'A valid Bank ID is required.', 400);
    }

    const { rows: [bank] } = await query(
      `SELECT id, name, short_code, logo_url, is_active, status FROM banks WHERE id = $1`,
      [bankId]
    );
    if (!bank) {
      return notFound(res, 'Selected bank does not exist.');
    }

    const { rows: [config] } = await query(
      `SELECT
         bdpl.id,
         bdpl.bank_id,
         bdpl.direct_process_link,
         bdpl.created_at,
         bdpl.updated_at,
         bdpl.created_by,
         bdpl.updated_by
       FROM bank_direct_process_links bdpl
       WHERE bdpl.bank_id = $1`,
      [bankId]
    );

    return success(res, {
      id: config?.id || null,
      bank_id: bank.id,
      bank_name: bank.name,
      bank_short_code: bank.short_code,
      direct_process_link: config?.direct_process_link || null,
      created_at: config?.created_at || null,
      updated_at: config?.updated_at || null,
      created_by: config?.created_by || null,
      updated_by: config?.updated_by || null
    }, 'Bank Direct Process link configuration retrieved.');
  } catch (err) {
    logger.error('Failed to retrieve bank Direct Process link for bank:', err.message);
    next(err);
  }
};

/**
 * POST /api/v1/settings/bank-direct-links
 * PUT /api/v1/settings/bank-direct-links/:bankId
 * Creates or updates a bank-specific Direct Process link.
 * Restricted strictly to SUPER_ADMIN users.
 */
const upsertBankDirectProcessLink = async (req, res, next) => {
  // Independent backend RBAC check (never trust frontend role headers/body)
  const userRole = String(req.user?.role || '').trim().toUpperCase();
  if (!req.user?.id || userRole !== 'SUPER_ADMIN') {
    return forbidden(res, 'Access denied: Only Super Admin users may create or update bank Direct Process links.');
  }

  const rawBankId = req.params.bankId !== undefined ? req.params.bankId : (req.body?.bank_id ?? req.body?.bankId);
  const bankId = typeof rawBankId === 'string' ? rawBankId.trim() : '';

  if (!bankId) {
    return error(res, 'Please select a bank.', 400);
  }
  if (!UUID_REGEX.test(bankId)) {
    return error(res, 'Invalid bank ID format.', 400);
  }

  const rawLink = req.body?.direct_process_link !== undefined
    ? req.body.direct_process_link
    : (req.body?.link !== undefined ? req.body.link : req.body?.url);

  const urlCheck = validateDirectProcessUrl(rawLink);
  if (!urlCheck.valid) {
    return error(res, urlCheck.message, 400);
  }

  let client;
  try {
    await ensureBankDirectProcessLinksTable();
    client = await getClient();
    await client.query('BEGIN');

    // Lock bank row to serialize concurrent updates for the same bank
    const { rows: [bank] } = await client.query(
      `SELECT id, name, short_code, is_active, status FROM banks WHERE id = $1 FOR UPDATE`,
      [bankId]
    );

    if (!bank) {
      await client.query('ROLLBACK');
      return notFound(res, 'Selected bank does not exist.');
    }

    const bankStatusLower = String(bank.status || 'Active').trim().toLowerCase();
    if (bank.is_active === false || bankStatusLower === 'inactive' || bankStatusLower === 'archived') {
      await client.query('ROLLBACK');
      return error(res, 'Selected bank is inactive and not eligible for Direct Process link configuration.', 400);
    }

    const { rows: [existing] } = await client.query(
      `SELECT id, direct_process_link, created_at, created_by
       FROM bank_direct_process_links
       WHERE bank_id = $1
       FOR UPDATE`,
      [bank.id]
    );

    const isUpdate = Boolean(existing);
    const actorId = UUID_REGEX.test(String(req.user.id)) ? req.user.id : null;

    const { rows: [saved] } = await client.query(
      `INSERT INTO bank_direct_process_links (
         bank_id, direct_process_link, created_by, updated_by, created_at, updated_at
       )
       VALUES ($1, $2, $3, $3, NOW(), NOW())
       ON CONFLICT (bank_id) DO UPDATE SET
         direct_process_link = EXCLUDED.direct_process_link,
         updated_by = EXCLUDED.updated_by,
         updated_at = NOW()
       RETURNING id, bank_id, direct_process_link, created_at, updated_at, created_by, updated_by`,
      [bank.id, urlCheck.url, actorId]
    );

    const auditAction = isUpdate
      ? 'UPDATE_BANK_DIRECT_PROCESS_LINK'
      : 'CREATE_BANK_DIRECT_PROCESS_LINK';

    await logAction(
      req,
      auditAction,
      bank.id,
      {
        action_type: isUpdate ? 'UPDATE' : 'CREATE',
        bank_id: bank.id,
        bank_name: bank.name,
        bank_short_code: bank.short_code,
        direct_process_link: sanitizeUrlForAudit(urlCheck.url),
        previous_link: existing ? sanitizeUrlForAudit(existing.direct_process_link) : null,
        changed_by: actorId,
        changed_at: new Date().toISOString()
      },
      userRole,
      null,
      client
    );

    await client.query('COMMIT');

    const responseData = {
      ...saved,
      bank_name: bank.name,
      bank_short_code: bank.short_code,
      action: isUpdate ? 'updated' : 'created'
    };

    if (isUpdate) {
      return success(res, responseData, `Direct Process link updated for ${bank.name}.`);
    }
    return created(res, responseData, `Direct Process link saved for ${bank.name}.`);
  } catch (err) {
    if (client) {
      await client.query('ROLLBACK').catch(() => {});
    }
    logger.error('Failed to save bank Direct Process link:', err.message);
    next(err);
  } finally {
    if (client) client.release();
  }
};

/**
 * Helper to resolve the effective Direct Process link for a product record.
 * Precedence:
 * 1. Bank-specific Direct Process link configured for the product's bank (bank_direct_process_links)
 * 2. Product-level or Direct Process fallback (partner_url / public_url / getBankApplyLinkBackend)
 * 3. null if no valid link exists anywhere
 */
const resolveDirectProcessLinkForProductRow = (product, fallbackFn = null) => {
  if (!product) return { url: null, source: 'none' };

  const bankDirectUrl = typeof product.bank_direct_process_link === 'string'
    ? product.bank_direct_process_link.trim()
    : '';
  if (bankDirectUrl) {
    const check = validateDirectProcessUrl(bankDirectUrl);
    if (check.valid) {
      return { url: check.url, source: 'bank_direct_process_link' };
    }
  }

  const productLevelCandidates = [
    product.employee_referral_url,
    product.partner_url,
    product.application_url,
    product.apply_url,
    product.redirect_url,
    product.public_url,
    product.bank_link
  ];

  for (const candidate of productLevelCandidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      const check = validateDirectProcessUrl(candidate.trim());
      if (check.valid) {
        return { url: check.url, source: 'product_fallback' };
      }
    }
  }

  if (typeof fallbackFn === 'function') {
    const fallbackUrl = fallbackFn(product.name, product.bank_name || product.bank_code, product);
    if (typeof fallbackUrl === 'string' && fallbackUrl.trim()) {
      const check = validateDirectProcessUrl(fallbackUrl.trim());
      if (check.valid) {
        return { url: check.url, source: 'bank_default_fallback' };
      }
    }
  }

  return { url: null, source: 'none' };
};

/**
 * GET /api/v1/settings/bank-direct-links/resolve-product/:productId
 * Resolves the authoritative Direct Process link for a given product ID.
 */
const resolveProductDirectProcessLink = async (req, res, next) => {
  try {
    await ensureBankDirectProcessLinksTable();
    const productId = String(req.params.productId || req.params.id || '').trim();
    if (!productId || !UUID_REGEX.test(productId)) {
      return error(res, 'A valid Product ID is required.', 400);
    }

    const { rows: [product] } = await query(
      `SELECT
         p.*,
         b.name AS bank_name,
         b.short_code AS bank_code,
         bdpl.direct_process_link AS bank_direct_process_link
       FROM products p
       LEFT JOIN banks b ON b.id = p.bank_id
       LEFT JOIN bank_direct_process_links bdpl ON bdpl.bank_id = p.bank_id
       WHERE p.id = $1`,
      [productId]
    );

    if (!product) {
      return notFound(res, 'Product not found.');
    }

    const { getBankApplyLinkBackend } = require('../../services/bankLink.service');
    const resolved = resolveDirectProcessLinkForProductRow(product, getBankApplyLinkBackend);

    return success(res, {
      product_id: product.id,
      product_name: product.name,
      bank_id: product.bank_id,
      bank_name: product.bank_name,
      bank_direct_process_link: product.bank_direct_process_link || null,
      direct_process_link: resolved.url,
      source: resolved.source
    }, 'Direct Process link resolved.');
  } catch (err) {
    logger.error('Failed to resolve product Direct Process link:', err.message);
    next(err);
  }
};

module.exports = {
  validateDirectProcessUrl,
  sanitizeUrlForAudit,
  listBankDirectProcessLinks,
  getBankDirectProcessLinkByBankId,
  upsertBankDirectProcessLink,
  resolveDirectProcessLinkForProductRow,
  resolveProductDirectProcessLink
};

