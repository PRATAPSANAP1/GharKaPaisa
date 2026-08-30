const { query } = require('../../config/database');
const logger = require('../../config/logger');

class ChatbotSearchService {
  /**
   * Search bank in PostgreSQL `banks` table dynamically (with LIKE and pg_trgm fuzzy matching)
   */
  async searchBank(bankTerm) {
    try {
      const cleanTerm = bankTerm.trim().toLowerCase();
      const { rows } = await query(
        `SELECT id, name, short_code, logo_url, status, is_active
         FROM banks
         WHERE (LOWER(name) LIKE $1 OR LOWER(short_code) LIKE $1)
           AND (is_active = true OR status = 'Active')
         LIMIT 1`,
        [`%${cleanTerm}%`]
      );
      if (rows.length > 0) return rows[0];

      // Similarity fuzzy match fallback for bank name or short code
      try {
        const { rows: fuzzyRows } = await query(
          `SELECT id, name, short_code, logo_url, status, is_active,
                  GREATEST(similarity(LOWER(name), LOWER($1)), similarity(LOWER(short_code), LOWER($1))) AS similarity_score
           FROM banks
           WHERE (is_active = true OR status = 'Active')
             AND GREATEST(similarity(LOWER(name), LOWER($1)), similarity(LOWER(short_code), LOWER($1))) > 0.40
           ORDER BY similarity_score DESC
           LIMIT 1`,
          [cleanTerm]
        );
        return fuzzyRows[0] || null;
      } catch {
        return null;
      }
    } catch (error) {
      logger.error('Error searching bank in DB:', error);
      return null;
    }
  }

  /**
   * Exact or similarity product search in PostgreSQL `products` table
   */
  async searchExactProduct(productTerm) {
    try {
      const cleanTerm = productTerm.trim().toLowerCase();
      
      // Try exact or substring match first
      const { rows } = await query(
        `SELECT p.id, p.bank_id, p.name, p.category, p.description, p.image_url, p.image, p.logo,
                p.partner_url, p.public_url, p.commission_value, p.annual_fee, p.features,
                p.rewards, p.cashback, p.welcome_benefits, p.is_lifetime_free, p.slug, p.status,
                b.id AS bank_id, b.name AS bank_name, b.short_code AS bank_short_code
         FROM products p
         JOIN banks b ON b.id = p.bank_id
         WHERE (p.is_active = true OR p.status = 'Active')
           AND (
             LOWER(p.name) = LOWER($1)
             OR LOWER(p.name) LIKE LOWER('%' || $1 || '%')
             OR LOWER(p.slug) = LOWER($1)
           )
         ORDER BY p.priority DESC
         LIMIT 1`,
        [cleanTerm]
      );

      if (rows.length > 0) return rows[0];

      // Enable pg_trgm extension if not already enabled and try similarity search
      try {
        const { rows: fuzzyRows } = await query(
          `SELECT p.id, p.bank_id, p.name, p.category, p.description, p.image_url, p.image, p.logo,
                  p.partner_url, p.public_url, p.commission_value, p.annual_fee, p.features,
                  p.rewards, p.cashback, p.welcome_benefits, p.is_lifetime_free, p.slug, p.status,
                  b.id AS bank_id, b.name AS bank_name, b.short_code AS bank_short_code,
                  similarity(LOWER(p.name), LOWER($1)) AS similarity_score
           FROM products p
           JOIN banks b ON b.id = p.bank_id
           WHERE (p.is_active = true OR p.status = 'Active')
             AND similarity(LOWER(p.name), LOWER($1)) > 0.45
           ORDER BY similarity_score DESC
           LIMIT 1`,
          [cleanTerm]
        );
        return fuzzyRows[0] || null;
      } catch {
        return null;
      }
    } catch (error) {
      logger.error('Error searching exact product in DB:', error);
      return null;
    }
  }

  /**
   * Search bank products ("Give me all HDFC cards")
   */
  async searchProductsByBank(bankId, categoryFilter = null) {
    try {
      let queryStr = `
        SELECT p.id, p.name, p.category, p.description, p.image_url, p.annual_fee,
               p.is_lifetime_free, p.slug, p.rewards, p.welcome_benefits, p.partner_url, p.public_url,
               b.id AS bank_id, b.name AS bank_name, b.short_code
        FROM products p
        JOIN banks b ON b.id = p.bank_id
        WHERE p.bank_id = $1 AND (p.is_active = true OR p.status = 'Active')
      `;
      const params = [bankId];

      if (categoryFilter) {
        if (categoryFilter === 'credit_card') {
          queryStr += ` AND p.category IN ('credit_card', 'co_branded_card', 'fd_card')`;
        } else if (categoryFilter === 'loan') {
          queryStr += ` AND p.category IN ('personal_loan', 'business_loan', 'home_loan', 'instant_loan', 'used_car_loan', 'education_loan')`;
        } else if (categoryFilter === 'insurance') {
          queryStr += ` AND p.category IN ('health_insurance', 'life_insurance', 'general_insurance', 'insurance')`;
        }
      }

      queryStr += ` ORDER BY p.priority DESC, p.name ASC LIMIT 10`;

      const { rows } = await query(queryStr, params);
      return rows;
    } catch (error) {
      logger.error('Error searching products by bank:', error);
      return [];
    }
  }

  /**
   * Search general products by query term
   */
  async searchProducts(searchTerm) {
    try {
      const cleanTerm = searchTerm.trim().toLowerCase();
      const { rows } = await query(
        `SELECT p.id, p.name, p.category, p.description, p.image_url, p.annual_fee,
                p.is_lifetime_free, p.slug, p.rewards, p.welcome_benefits, p.partner_url, p.public_url,
                b.id AS bank_id, b.name AS bank_name, b.short_code AS bank_short_code
         FROM products p
         JOIN banks b ON b.id = p.bank_id
         WHERE (p.is_active = true OR p.status = 'Active')
           AND (
             LOWER(p.name) LIKE LOWER('%' || $1 || '%')
             OR LOWER(b.name) LIKE LOWER('%' || $1 || '%')
             OR LOWER(p.category::text) LIKE LOWER('%' || $1 || '%')
           )
         ORDER BY p.priority DESC, p.name ASC
         LIMIT 8`,
        [cleanTerm]
      );
      return rows;
    } catch (error) {
      logger.error('Error searching products in DB:', error);
      return [];
    }
  }

  /**
   * Search applications with role scoping
   */
  async searchApplications(context, statusFilter = null) {
    try {
      let queryStr = `
        SELECT a.id, a.app_number, a.status, a.loan_amount, a.created_at,
               p.name AS product_name, b.name AS bank_name,
               c.full_name AS customer_name, c.mobile AS customer_mobile, c.pan_number AS customer_pan,
               a.commission_amount
        FROM applications a
        JOIN products p ON p.id = a.product_id
        LEFT JOIN banks b ON b.id = p.bank_id
        JOIN customers c ON c.id = a.customer_id
        WHERE 1=1
      `;
      const params = [];

      // Partner Scope
      if (context.role === 'PARTNER' || context.role === 'TEAM_MEMBER') {
        if (!context.partnerId) return [];
        params.push(context.partnerId);
        queryStr += ` AND a.partner_id = $${params.length}`;
      }
      // Employee Scope
      else if (context.role === 'EMPLOYEE') {
        if (!context.employeeId) return [];
        
        if (context.isManagerOrTL) {
          // Manager/TL scope via employee_hierarchy
          params.push(context.employeeId);
          queryStr += ` AND (
            a.employee_id = $${params.length}
            OR a.employee_id IN (
              SELECT employee_id FROM employee_hierarchy 
              WHERE (manager_id = $${params.length} OR team_leader_id = $${params.length}) AND is_active = true
            )
          )`;
        } else {
          // TC scope: own applications only
          params.push(context.employeeId);
          queryStr += ` AND a.employee_id = $${params.length}`;
        }
      }

      // Filter by status if provided
      if (statusFilter) {
        params.push(statusFilter);
        queryStr += ` AND LOWER(a.status::text) = LOWER($${params.length})`;
      }

      queryStr += ` ORDER BY a.created_at DESC LIMIT 6`;

      const { rows } = await query(queryStr, params);
      return rows;
    } catch (error) {
      logger.error('Error searching applications in DB:', error);
      return [];
    }
  }

  /**
   * Search employee product links (fetches employee_referral_url and incentive_amount)
   */
  async getEmployeeProductLink(employeeId, productId) {
    try {
      const { rows } = await query(
        `SELECT id, employee_referral_url, incentive_amount, incentive_type
         FROM employee_product_links
         WHERE employee_id = $1 AND product_id = $2 AND status = 'ACTIVE'
         LIMIT 1`,
        [employeeId, productId]
      );
      return rows[0] || null;
    } catch (error) {
      logger.error('Error fetching employee product link:', error);
      return null;
    }
  }
}

module.exports = new ChatbotSearchService();
