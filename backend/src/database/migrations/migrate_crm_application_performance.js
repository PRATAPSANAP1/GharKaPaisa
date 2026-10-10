const { query } = require('../../config/database');
const logger = require('../../config/logger');

// Helper to add an enum value idempotently
async function addEnumValue(typeName, valName) {
  try {
    const { rows } = await query(`
      SELECT 1 FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname = $1 AND e.enumlabel = $2
    `, [typeName, valName]);
    if (rows.length === 0) {
      await query(`ALTER TYPE ${typeName} ADD VALUE '${valName}'`);
      logger.info(`Added enum value '${valName}' to type '${typeName}'`);
    }
  } catch (err) {
    logger.warn(`Enum value check/add note for '${valName}' in type '${typeName}': ${err.message}`);
  }
}

const migrateCrmApplicationPerformance = async () => {
  logger.info('Running CRM Application Performance & Schema Alignment Migration...');

  try {
    // 1. Ensure Enum Values
    await addEnumValue('application_status', 'operational_verified');
    await addEnumValue('application_status', 'details_submitted');

    // 2. Ensure columns on applications table
    await query(`
      ALTER TABLE applications 
        ADD COLUMN IF NOT EXISTS ipa_stage VARCHAR(100),
        ADD COLUMN IF NOT EXISTS kyc_stage VARCHAR(100),
        ADD COLUMN IF NOT EXISTS card_approval_stage VARCHAR(100),
        ADD COLUMN IF NOT EXISTS digital_card_issued VARCHAR(100),
        ADD COLUMN IF NOT EXISTS remark_status VARCHAR(20) DEFAULT 'PENDING',
        ADD COLUMN IF NOT EXISTS remark_updated BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS remark_updated_by UUID,
        ADD COLUMN IF NOT EXISTS remark_updated_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS pan_check VARCHAR(10) DEFAULT 'no',
        ADD COLUMN IF NOT EXISTS bank_current_lead_status VARCHAR(100),
        ADD COLUMN IF NOT EXISTS approved_by UUID,
        ADD COLUMN IF NOT EXISTS sales_operator_code VARCHAR(100),
        ADD COLUMN IF NOT EXISTS pan_checker_code VARCHAR(100),
        ADD COLUMN IF NOT EXISTS remark_operator_code VARCHAR(100),
        ADD COLUMN IF NOT EXISTS backend_remark TEXT,
        ADD COLUMN IF NOT EXISTS requery_date TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS address1 TEXT,
        ADD COLUMN IF NOT EXISTS address2 TEXT,
        ADD COLUMN IF NOT EXISTS landmark TEXT,
        ADD COLUMN IF NOT EXISTS city VARCHAR(100),
        ADD COLUMN IF NOT EXISTS state VARCHAR(100),
        ADD COLUMN IF NOT EXISTS pincode VARCHAR(20),
        ADD COLUMN IF NOT EXISTS mother_name VARCHAR(150),
        ADD COLUMN IF NOT EXISTS customer_name VARCHAR(150),
        ADD COLUMN IF NOT EXISTS customer_mobile VARCHAR(20),
        ADD COLUMN IF NOT EXISTS customer_email VARCHAR(150),
        ADD COLUMN IF NOT EXISTS company_name VARCHAR(200),
        ADD COLUMN IF NOT EXISTS designation VARCHAR(150),
        ADD COLUMN IF NOT EXISTS vkyc_status VARCHAR(50),
        ADD COLUMN IF NOT EXISTS vkyc_url TEXT,
        ADD COLUMN IF NOT EXISTS salary_slip_url TEXT,
        ADD COLUMN IF NOT EXISTS pan_card_url TEXT,
        ADD COLUMN IF NOT EXISTS appcode_status VARCHAR(50),
        ADD COLUMN IF NOT EXISTS soft_approval_status VARCHAR(50),
        ADD COLUMN IF NOT EXISTS vkyc_stage VARCHAR(50),
        ADD COLUMN IF NOT EXISTS iqa_stage VARCHAR(50),
        ADD COLUMN IF NOT EXISTS dispatch_status VARCHAR(50),
        ADD COLUMN IF NOT EXISTS bank_remark TEXT,
        ADD COLUMN IF NOT EXISTS final_status VARCHAR(50),
        ADD COLUMN IF NOT EXISTS app_file_generated VARCHAR(50),
        ADD COLUMN IF NOT EXISTS decline_reason TEXT,
        ADD COLUMN IF NOT EXISTS eligible_reqd VARCHAR(50),
        ADD COLUMN IF NOT EXISTS approved_amount DECIMAL(15,2),
        ADD COLUMN IF NOT EXISTS income_details VARCHAR(100),
        ADD COLUMN IF NOT EXISTS mail_status VARCHAR(100),
        ADD COLUMN IF NOT EXISTS user_remark TEXT,
        ADD COLUMN IF NOT EXISTS notes TEXT,
        ADD COLUMN IF NOT EXISTS operational_remarks TEXT,
        ADD COLUMN IF NOT EXISTS digital_journey_url TEXT,
        ADD COLUMN IF NOT EXISTS bank_smart_emi_offer TEXT,
        ADD COLUMN IF NOT EXISTS bank_smart_emi_tenure VARCHAR(50),
        ADD COLUMN IF NOT EXISTS disbursed_smart_emi VARCHAR(50),
        ADD COLUMN IF NOT EXISTS disbursed_smart_emi_tenure VARCHAR(50),
        ADD COLUMN IF NOT EXISTS smart_emi_offer_status VARCHAR(20),
        ADD COLUMN IF NOT EXISTS final_smart_emi_disburse VARCHAR(50),
        ADD COLUMN IF NOT EXISTS final_tenure VARCHAR(50),
        ADD COLUMN IF NOT EXISTS offer_decline_reason TEXT,
        ADD COLUMN IF NOT EXISTS eligible_for_incentive VARCHAR(20),
        ADD COLUMN IF NOT EXISTS insta_jumbo_offer VARCHAR(20),
        ADD COLUMN IF NOT EXISTS customer_loan_offer VARCHAR(20),
        ADD COLUMN IF NOT EXISTS customer_loan_type VARCHAR(50),
        ADD COLUMN IF NOT EXISTS offer_tenure VARCHAR(50),
        ADD COLUMN IF NOT EXISTS disbursed_amount VARCHAR(50),
        ADD COLUMN IF NOT EXISTS disbursement_amount VARCHAR(50),
        ADD COLUMN IF NOT EXISTS disbursed_tenure VARCHAR(50),
        ADD COLUMN IF NOT EXISTS disbursement_tenure VARCHAR(50),
        ADD COLUMN IF NOT EXISTS los_no VARCHAR(100),
        ADD COLUMN IF NOT EXISTS final_loan_disbursed VARCHAR(50),
        ADD COLUMN IF NOT EXISTS final_loan_tenure VARCHAR(50),
        ADD COLUMN IF NOT EXISTS final_bank_stage VARCHAR(50),
        ADD COLUMN IF NOT EXISTS disbursement_completed VARCHAR(20),
        ADD COLUMN IF NOT EXISTS disbursement_date DATE,
        ADD COLUMN IF NOT EXISTS disbursal_date DATE,
        ADD COLUMN IF NOT EXISTS last_operator_id UUID,
        ADD COLUMN IF NOT EXISTS last_operator_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS last_operator_role VARCHAR(100),
        ADD COLUMN IF NOT EXISTS last_operator_designation VARCHAR(100),
        ADD COLUMN IF NOT EXISTS last_operator_code VARCHAR(100),
        ADD COLUMN IF NOT EXISTS final_status_operator_code VARCHAR(100),
        ADD COLUMN IF NOT EXISTS last_operated_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS bank_application_number VARCHAR(100)
    `);

    // 3. Ensure columns on physical_application_details table
    await query(`
      ALTER TABLE physical_application_details 
        ADD COLUMN IF NOT EXISTS token VARCHAR(255),
        ADD COLUMN IF NOT EXISTS sales_operator_code VARCHAR(100),
        ADD COLUMN IF NOT EXISTS pan_checker_code VARCHAR(100),
        ADD COLUMN IF NOT EXISTS remark_operator_code VARCHAR(100),
        ADD COLUMN IF NOT EXISTS backend_remark TEXT,
        ADD COLUMN IF NOT EXISTS ipa_stage VARCHAR(100),
        ADD COLUMN IF NOT EXISTS kyc_stage VARCHAR(100),
        ADD COLUMN IF NOT EXISTS income_details VARCHAR(100),
        ADD COLUMN IF NOT EXISTS mail_status VARCHAR(100),
        ADD COLUMN IF NOT EXISTS card_approval_stage VARCHAR(100),
        ADD COLUMN IF NOT EXISTS digital_card_issued VARCHAR(100),
        ADD COLUMN IF NOT EXISTS bank_application_number VARCHAR(100),
        ADD COLUMN IF NOT EXISTS bank_ref_number VARCHAR(100),
        ADD COLUMN IF NOT EXISTS los_no VARCHAR(100),
        ADD COLUMN IF NOT EXISTS appcode_status VARCHAR(50),
        ADD COLUMN IF NOT EXISTS soft_approval_status VARCHAR(50),
        ADD COLUMN IF NOT EXISTS vkyc_stage VARCHAR(50),
        ADD COLUMN IF NOT EXISTS iqa_stage VARCHAR(50),
        ADD COLUMN IF NOT EXISTS dispatch_status VARCHAR(50),
        ADD COLUMN IF NOT EXISTS bank_remark TEXT,
        ADD COLUMN IF NOT EXISTS final_status VARCHAR(50),
        ADD COLUMN IF NOT EXISTS app_file_generated VARCHAR(50),
        ADD COLUMN IF NOT EXISTS decline_reason TEXT,
        ADD COLUMN IF NOT EXISTS eligible_reqd VARCHAR(50),
        ADD COLUMN IF NOT EXISTS vkyc_url TEXT,
        ADD COLUMN IF NOT EXISTS user_remark TEXT,
        ADD COLUMN IF NOT EXISTS notes TEXT,
        ADD COLUMN IF NOT EXISTS operational_remarks TEXT,
        ADD COLUMN IF NOT EXISTS requery_date DATE,
        ADD COLUMN IF NOT EXISTS bank_smart_emi_offer TEXT,
        ADD COLUMN IF NOT EXISTS bank_smart_emi_tenure VARCHAR(50),
        ADD COLUMN IF NOT EXISTS disbursed_smart_emi VARCHAR(50),
        ADD COLUMN IF NOT EXISTS disbursed_smart_emi_tenure VARCHAR(50),
        ADD COLUMN IF NOT EXISTS smart_emi_offer_status VARCHAR(20),
        ADD COLUMN IF NOT EXISTS final_smart_emi_disburse VARCHAR(50),
        ADD COLUMN IF NOT EXISTS final_tenure VARCHAR(50),
        ADD COLUMN IF NOT EXISTS offer_decline_reason TEXT,
        ADD COLUMN IF NOT EXISTS eligible_for_incentive VARCHAR(20),
        ADD COLUMN IF NOT EXISTS insta_jumbo_offer VARCHAR(20),
        ADD COLUMN IF NOT EXISTS customer_loan_offer VARCHAR(20),
        ADD COLUMN IF NOT EXISTS customer_loan_type VARCHAR(50),
        ADD COLUMN IF NOT EXISTS offer_tenure VARCHAR(50),
        ADD COLUMN IF NOT EXISTS disbursed_amount VARCHAR(50),
        ADD COLUMN IF NOT EXISTS disbursement_amount VARCHAR(50),
        ADD COLUMN IF NOT EXISTS disbursed_tenure VARCHAR(50),
        ADD COLUMN IF NOT EXISTS disbursement_tenure VARCHAR(50),
        ADD COLUMN IF NOT EXISTS final_loan_disbursed VARCHAR(50),
        ADD COLUMN IF NOT EXISTS final_loan_tenure VARCHAR(50),
        ADD COLUMN IF NOT EXISTS final_bank_stage VARCHAR(50),
        ADD COLUMN IF NOT EXISTS disbursement_completed VARCHAR(20),
        ADD COLUMN IF NOT EXISTS disbursement_date DATE,
        ADD COLUMN IF NOT EXISTS disbursal_date DATE,
        ADD COLUMN IF NOT EXISTS pan_check VARCHAR(10) DEFAULT 'no',
        ADD COLUMN IF NOT EXISTS bank_current_lead_status VARCHAR(100),
        ADD COLUMN IF NOT EXISTS last_operator_id UUID,
        ADD COLUMN IF NOT EXISTS last_operator_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS last_operator_role VARCHAR(100),
        ADD COLUMN IF NOT EXISTS last_operator_designation VARCHAR(100),
        ADD COLUMN IF NOT EXISTS last_operator_code VARCHAR(100),
        ADD COLUMN IF NOT EXISTS final_status_operator_code VARCHAR(100),
        ADD COLUMN IF NOT EXISTS last_operated_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS mobile VARCHAR(50),
        ADD COLUMN IF NOT EXISTS email VARCHAR(255),
        ADD COLUMN IF NOT EXISTS pan_number VARCHAR(50),
        ADD COLUMN IF NOT EXISTS dob VARCHAR(50),
        ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS designation VARCHAR(255),
        ADD COLUMN IF NOT EXISTS address TEXT
    `);

    // 4. Ensure columns on customers table
    await query(`
      ALTER TABLE customers 
        ADD COLUMN IF NOT EXISTS aadhaar_number VARCHAR(20),
        ADD COLUMN IF NOT EXISTS occupation VARCHAR(100),
        ADD COLUMN IF NOT EXISTS city VARCHAR(100),
        ADD COLUMN IF NOT EXISTS state VARCHAR(100),
        ADD COLUMN IF NOT EXISTS pincode VARCHAR(50),
        ADD COLUMN IF NOT EXISTS monthly_income DECIMAL(15,2),
        ADD COLUMN IF NOT EXISTS address1 TEXT,
        ADD COLUMN IF NOT EXISTS address2 TEXT,
        ADD COLUMN IF NOT EXISTS landmark TEXT
    `);
    await query(`ALTER TABLE applications ALTER COLUMN partner_id DROP NOT NULL`).catch(() => {});
    await query(`ALTER TABLE leads ALTER COLUMN partner_id DROP NOT NULL`).catch(() => {});
    await query(`ALTER TABLE partner_share_links ALTER COLUMN partner_id DROP NOT NULL`).catch(() => {});

    // 5. One-time data correction backfills
    await query(`UPDATE applications SET app_number = REPLACE(app_number, 'GKPEMP', 'APP20260917') WHERE app_number LIKE 'GKPEMP%'`).catch(() => {});

    logger.info('CRM Application Performance & Schema Alignment Migration finished successfully.');
  } catch (err) {
    logger.error('Failed to execute CRM Application Performance Migration:', err);
    throw err;
  }
};

module.exports = { migrateCrmApplicationPerformance };
