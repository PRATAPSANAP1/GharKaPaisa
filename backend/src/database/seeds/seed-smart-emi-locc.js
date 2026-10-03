const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const { query } = require('../../config/database');
const logger = require('../../config/logger');

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/**
 * LOC/EOC Product Catalog
 * Under LOC/EOC category:
 * - Subcategory LOC: HDFC Bank Insta Loan & Jumbo Loan
 * - Subcategory EOC: HDFC Bank SmartEMI on Credit Card
 */
const LOAN_ON_CARD_AND_SMART_EMI_PRODUCTS = [
  // ── 1. HDFC BANK - LOC SUBCATEGORY ───────────────────────────────────
  {
    bank_name: 'HDFC Bank',
    short_code: 'HDFC',
    name: 'HDFC Bank Insta Loan & Jumbo Loan',
    category: 'loc_eoc',
    sub_category: 'LOC',
    short_description: 'Over-and-above credit limit pre-approved instant cash loan transferred directly to savings account.',
    description: 'HDFC Bank Insta Loan and Insta Jumbo Loan provide pre-approved instant cash funds credited to your savings account in 10 seconds. Jumbo Loans do not block your credit card spending limit.',
    annual_fee: '₹999 + GST Fee',
    joining_fee: 'Nil',
    interest_rate: '11.49% - 15.50% p.a.',
    time_period: '12 - 60 Months',
    badge: 'Pre-Approved',
    features: [
      'Instant 10-second credit disbursal directly to bank account',
      'Insta Jumbo Loan option over and above existing credit limit',
      'Zero physical documentation required',
      'Flexible foreclosure options after 12 EMIs'
    ],
    eligibility_criteria: 'Pre-approved HDFC Bank Credit Cardholders with good repayment history.'
  },

  // ── 2. HDFC BANK - EOC SUBCATEGORY ───────────────────────────────────
  {
    bank_name: 'HDFC Bank',
    short_code: 'HDFC',
    name: 'HDFC Bank SmartEMI on Credit Card',
    category: 'loc_eoc',
    sub_category: 'EOC',
    short_description: 'Convert HDFC credit card purchases into flexible EMIs up to 48 months with low interest rates.',
    description: 'HDFC Bank SmartEMI allows cardholders to convert large purchases or credit card statement balances into easy monthly EMIs via NetBanking, MyCards app, or SMS.',
    annual_fee: '₹199 + GST Fee',
    joining_fee: 'Nil',
    interest_rate: '1.15% per month (13.80% p.a.)',
    time_period: '3 - 48 Months',
    badge: 'Popular Scheme',
    features: [
      'Instant 1-click conversion via NetBanking & MobileBanking',
      'Convert purchases within 60 days of transaction',
      'No-Cost EMI options across 5,000+ top retail & online merchants',
      'Retain original reward points earned before conversion'
    ],
    eligibility_criteria: 'HDFC Bank Credit Cardholders with unutilized credit limit.'
  }
];

async function seedSmartEmiAndLoccProducts() {
  logger.info('Starting LOC/EOC products seeding process...');

  // Ensure product_category enum includes 'loc_eoc'
  try {
    const { rows } = await query(`
      SELECT 1 FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname = 'product_category' AND e.enumlabel = 'loc_eoc'
    `);
    if (rows.length === 0) {
      await query(`ALTER TYPE product_category ADD VALUE 'loc_eoc'`);
      logger.info("Added enum value 'loc_eoc' to type 'product_category'");
    }
  } catch (err) {
    logger.warn("Could not alter enum product_category for 'loc_eoc':", err.message);
  }

  // Clean up legacy products (delete non-HDFC card loan/smart EMI products or deactivate if referenced in applications)
  try {
    await query(`
      DELETE FROM products 
      WHERE (category::text IN ('loan_on_credit_card', 'smart_emi') OR category::text = 'loc_eoc')
        AND name NOT IN ('HDFC Bank Insta Loan & Jumbo Loan', 'HDFC Bank SmartEMI on Credit Card')
        AND id NOT IN (SELECT product_id FROM applications WHERE product_id IS NOT NULL)
    `);
    await query(`
      UPDATE products 
      SET is_active = false, status = 'Inactive'
      WHERE (category::text IN ('loan_on_credit_card', 'smart_emi') OR category::text = 'loc_eoc')
        AND name NOT IN ('HDFC Bank Insta Loan & Jumbo Loan', 'HDFC Bank SmartEMI on Credit Card')
    `);
  } catch (cleanErr) {
    logger.warn('Error cleaning legacy card loan / smart EMI products:', cleanErr.message);
  }

  // Fetch all active banks for mapping
  const { rows: banks } = await query(`SELECT id, name, short_code FROM banks`);
  const bankMap = {};
  banks.forEach((b) => {
    if (b.short_code) bankMap[b.short_code.toUpperCase()] = b.id;
    const lower = b.name.toLowerCase();
    if (lower.includes('hdfc')) bankMap['HDFC_NAME'] = b.id;
  });

  const defaultBankId = banks[0]?.id || null;

  let insertedCount = 0;
  let updatedCount = 0;

  for (const prod of LOAN_ON_CARD_AND_SMART_EMI_PRODUCTS) {
    let targetBankId = bankMap[prod.short_code?.toUpperCase()] || bankMap[`${prod.short_code?.toUpperCase()}_NAME`] || defaultBankId;

    if (!targetBankId) {
      try {
        const { rows: newBank } = await query(
          `INSERT INTO banks (name, short_code, is_active) VALUES ($1, $2, true) ON CONFLICT (short_code) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
          [prod.bank_name, prod.short_code]
        );
        targetBankId = newBank[0]?.id;
        bankMap[prod.short_code] = targetBankId;
      } catch (bErr) {
        logger.error(`Failed to create bank ${prod.bank_name}:`, bErr.message);
        targetBankId = defaultBankId;
      }
    }

    const prodSlug = slug(prod.name);
    const featuresJson = JSON.stringify(prod.features || []);

    try {
      const { rows: existingProds } = await query(
        `SELECT id FROM products WHERE slug = $1 OR (bank_id = $2 AND LOWER(name) = LOWER($3)) OR LOWER(name) = LOWER($3) LIMIT 1`,
        [prodSlug, targetBankId, prod.name]
      );

      if (existingProds.length > 0) {
        const existingId = existingProds[0].id;
        await query(`
          UPDATE products SET
            bank_id = $1,
            name = $2,
            category = $3::product_category,
            sub_category = $4,
            description = $5,
            short_description = $6,
            annual_fee = $7,
            joining_fee = $8,
            interest_rate = $9,
            time_period = $10,
            badge = $11,
            features = $12::jsonb,
            eligibility_criteria = $13,
            slug = $14,
            is_active = true,
            status = 'Active'
          WHERE id = $15
        `, [
          targetBankId, prod.name, prod.category, prod.sub_category, prod.description, prod.short_description,
          prod.annual_fee, prod.joining_fee, prod.interest_rate, prod.time_period, prod.badge,
          featuresJson, prod.eligibility_criteria, prodSlug, existingId
        ]);
        updatedCount++;
        logger.info(`  Updated Product: ${prod.name} (Category: ${prod.category}, Subcategory: ${prod.sub_category})`);
      } else {
        await query(`
          INSERT INTO products (
            bank_id, name, category, sub_category, description, short_description,
            annual_fee, joining_fee, interest_rate, time_period, badge,
            features, eligibility_criteria, is_active, status, public_visible, partner_visible,
            slug, commission_type, commission_value
          ) VALUES (
            $1, $2, $3::product_category, $4, $5, $6,
            $7, $8, $9, $10, $11,
            $12::jsonb, $13, true, 'Active', true, true,
            $14, 'fixed', 500
          )
        `, [
          targetBankId, prod.name, prod.category, prod.sub_category, prod.description, prod.short_description,
          prod.annual_fee, prod.joining_fee, prod.interest_rate, prod.time_period, prod.badge,
          featuresJson, prod.eligibility_criteria, prodSlug
        ]);
        insertedCount++;
        logger.info(`  Inserted Product: ${prod.name} (Category: ${prod.category}, Subcategory: ${prod.sub_category})`);
      }
    } catch (err) {
      logger.error(`  ❌ Error saving product ${prod.name}:`, err.message);
    }
  }

  logger.info(`Finished seeding LOC/EOC products. Inserted: ${insertedCount}, Updated: ${updatedCount}`);
}

if (require.main === module) {
  seedSmartEmiAndLoccProducts()
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error('Fatal error in seeding:', err);
      process.exit(1);
    });
}

module.exports = { LOAN_ON_CARD_AND_SMART_EMI_PRODUCTS, seedSmartEmiAndLoccProducts };
