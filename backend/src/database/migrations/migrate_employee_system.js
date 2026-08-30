const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const { query, pool } = require('../../config/database');
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
    logger.error(`Failed to add enum value '${valName}' to type '${typeName}':`, err);
  }
}

const migrateEmployeeSystem = async () => {
  logger.info('Running Employee Management System migrations...');

  try {
    // Ensure HR and EMPLOYEE are in user_role ENUM (must be executed outside transaction block)
    await addEnumValue('user_role', 'HR');
    await addEnumValue('user_role', 'EMPLOYEE');

    await query('BEGIN');

    // ── 1. Employee Candidates Table ────────────────────────────────────────────────
    await query(`
      CREATE TABLE IF NOT EXISTS employee_candidates (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        reference_code VARCHAR(20) UNIQUE NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        mobile_number VARCHAR(15) UNIQUE NOT NULL,
        email_id VARCHAR(100) UNIQUE NOT NULL,
        date_of_birth DATE,
        current_address TEXT,
        highest_qualification VARCHAR(100) NOT NULL,
        passing_year INTEGER,
        experience_type VARCHAR(20) NOT NULL, -- 'Fresher' or 'Experienced'
        total_experience_years DECIMAL(4,1),
        current_company VARCHAR(100),
        current_designation VARCHAR(100),
        last_salary_ctc DECIMAL(12,2),
        expected_salary DECIMAL(12,2),
        immediate_joining BOOLEAN DEFAULT false,
        notice_period_days INTEGER,
        comfortable_with_location BOOLEAN DEFAULT true,
        relevant_experience BOOLEAN,
        how_did_you_hear VARCHAR(50),
        referred_by_employee_id UUID,
        resume_url TEXT,
        resume_file_name VARCHAR(255),
        mobile_verified BOOLEAN DEFAULT false,
        email_verified BOOLEAN DEFAULT false,
        otp_verified BOOLEAN DEFAULT false,
        interview_status VARCHAR(20) DEFAULT 'REGISTERED', -- 'REGISTERED', 'INTERVIEW_PENDING', 'INTERVIEWED', 'SELECTED', 'REJECTED', 'EMPLOYEE_CREATED'
        interviewer_id UUID REFERENCES users(id),
        interview_feedback TEXT,
        interview_date DATE,
        interview_rating INTEGER,
        offered_salary DECIMAL(12,2),
        offered_designation VARCHAR(100),
        offered_department VARCHAR(100),
        expected_joining_date DATE,
        rejection_reason TEXT,
        rejection_date TIMESTAMP,
        converted_to_employee_id UUID REFERENCES users(id),
        conversion_date TIMESTAMP,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        created_by UUID REFERENCES users(id),
        updated_by UUID REFERENCES users(id)
      )
    `);

    // Create indexes for employee_candidates
    await query(`CREATE INDEX IF NOT EXISTS idx_employee_candidates_reference_code ON employee_candidates(reference_code)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_employee_candidates_mobile ON employee_candidates(mobile_number)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_employee_candidates_email ON employee_candidates(email_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_employee_candidates_status ON employee_candidates(interview_status)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_employee_candidates_interviewer ON employee_candidates(interviewer_id)`);

    // ── 2. Employees Table ────────────────────────────────────────────────────────
    await query(`
      CREATE TABLE IF NOT EXISTS employees (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        employee_id VARCHAR(20) UNIQUE NOT NULL,
        user_id UUID REFERENCES users(id) UNIQUE,
        candidate_id UUID REFERENCES employee_candidates(id),
        full_name VARCHAR(100) NOT NULL,
        mobile_number VARCHAR(15) UNIQUE NOT NULL,
        whatsapp_number VARCHAR(15),
        email_id VARCHAR(100) UNIQUE NOT NULL,
        date_of_birth DATE,
        gender VARCHAR(10),
        current_address TEXT,
        permanent_address TEXT,
        emergency_contact_name VARCHAR(100),
        emergency_contact_number VARCHAR(15),
        designation VARCHAR(100) NOT NULL, -- 'Manager', 'Team Leader', 'TC'
        department VARCHAR(100) NOT NULL,
        joining_date DATE NOT NULL,
        work_location VARCHAR(100),
        employment_type VARCHAR(20) NOT NULL, -- 'Full-time', 'Part-time', 'Internship'
        offered_salary DECIMAL(12,2) NOT NULL,
        incentive_structure TEXT,
        target_applicable TEXT,
        notice_period_days INTEGER,
        referred_by VARCHAR(100),
        recruitment_source VARCHAR(50),
        interviewer_id UUID REFERENCES users(id),
        interview_feedback TEXT,
        interview_result VARCHAR(20),
        employee_status VARCHAR(20) DEFAULT 'ONBOARDING', -- 'ONBOARDING', 'ACTIVE', 'INACTIVE', 'TERMINATED'
        activation_status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        activated_at TIMESTAMPTZ,
        deactivated_at TIMESTAMPTZ,
        created_by UUID REFERENCES users(id),
        updated_by UUID REFERENCES users(id),
        activated_by UUID REFERENCES users(id)
      )
    `);

    // Create indexes for employees
    await query(`CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employee_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_employees_mobile ON employees(mobile_number)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_employees_designation ON employees(designation)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(employee_status)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id)`);

    // ── 3. Employee Joining Details Table ───────────────────────────────────────────
    await query(`
      CREATE TABLE IF NOT EXISTS employee_joining_details (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        employee_id UUID NOT NULL REFERENCES employees(id) UNIQUE,
        full_name VARCHAR(100) NOT NULL,
        mobile_number VARCHAR(15) NOT NULL,
        whatsapp_number VARCHAR(15),
        email_id VARCHAR(100) NOT NULL,
        date_of_birth DATE NOT NULL,
        gender VARCHAR(10) NOT NULL,
        current_address TEXT NOT NULL,
        permanent_address TEXT,
        emergency_contact_name VARCHAR(100) NOT NULL,
        emergency_contact_number VARCHAR(15) NOT NULL,
        designation VARCHAR(100) NOT NULL,
        department VARCHAR(100),
        joining_date DATE NOT NULL,
        work_location VARCHAR(100) NOT NULL,
        reporting_manager VARCHAR(100),
        employment_type VARCHAR(50) NOT NULL,
        highest_qualification VARCHAR(100) NOT NULL,
        passing_year INTEGER,
        experience_type VARCHAR(20) NOT NULL,
        previous_company VARCHAR(100),
        previous_designation VARCHAR(100),
        total_experience_years DECIMAL(4,1),
        offered_salary DECIMAL(12,2) NOT NULL,
        incentive_structure TEXT,
        target_applicable TEXT,
        notice_period_days INTEGER,
        referred_by VARCHAR(100),
        recruitment_source VARCHAR(50),
        bank_account_holder_name VARCHAR(100) NOT NULL,
        bank_account_number VARCHAR(50) NOT NULL,
        ifsc_code VARCHAR(20) NOT NULL,
        pan_number VARCHAR(20),
        aadhaar_number VARCHAR(20),
        declaration_accepted BOOLEAN DEFAULT false,
        declaration_date DATE,
        signature_ip_address VARCHAR(50),
        form_status VARCHAR(20) DEFAULT 'DRAFT', -- 'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'
        submitted_at TIMESTAMPTZ,
        reviewed_by UUID REFERENCES users(id),
        reviewed_at TIMESTAMPTZ,
        review_notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_employee_joining_details_employee_id ON employee_joining_details(employee_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_employee_joining_details_status ON employee_joining_details(form_status)`);

    // ── 4. Employee KYC Table ───────────────────────────────────────────────────────
    await query(`
      CREATE TABLE IF NOT EXISTS employee_kyc (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        employee_id UUID NOT NULL REFERENCES employees(id) UNIQUE,
        pan_number VARCHAR(20) UNIQUE,
        pan_document_url TEXT,
        pan_document_key TEXT,
        pan_verified BOOLEAN DEFAULT false,
        pan_verified_date TIMESTAMPTZ,
        pan_rejection_reason TEXT,
        aadhaar_number VARCHAR(20) UNIQUE,
        aadhaar_document_url TEXT,
        aadhaar_document_key TEXT,
        aadhaar_verified BOOLEAN DEFAULT false,
        aadhaar_verified_date TIMESTAMPTZ,
        aadhaar_rejection_reason TEXT,
        bank_account_number VARCHAR(50),
        bank_account_holder_name VARCHAR(100),
        ifsc_code VARCHAR(20),
        bank_document_url TEXT,
        bank_document_key TEXT,
        bank_verified BOOLEAN DEFAULT false,
        bank_verified_date TIMESTAMPTZ,
        bank_rejection_reason TEXT,
        kyc_status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED'
        submitted_at TIMESTAMPTZ,
        reviewed_by UUID REFERENCES users(id),
        reviewed_at TIMESTAMPTZ,
        review_notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_employee_kyc_employee_id ON employee_kyc(employee_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_employee_kyc_status ON employee_kyc(kyc_status)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_employee_kyc_pan ON employee_kyc(pan_number)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_employee_kyc_aadhaar ON employee_kyc(aadhaar_number)`);

    // ── 5. Employee Documents Table ───────────────────────────────────────────────
    await query(`
      CREATE TABLE IF NOT EXISTS employee_documents (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        employee_id UUID NOT NULL REFERENCES employees(id),
        document_type VARCHAR(50) NOT NULL, -- 'photo', 'aadhaar', 'pan', 'education_certificate', 'bank_proof', 'resume', 'experience_letter', 'terms_video'
        document_url TEXT NOT NULL,
        document_key TEXT NOT NULL,
        document_file_name VARCHAR(255),
        document_size INTEGER,
        document_mime_type VARCHAR(100),
        verification_status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
        verified_by UUID REFERENCES users(id),
        verified_at TIMESTAMPTZ,
        rejection_reason TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_employee_documents_employee_id ON employee_documents(employee_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_employee_documents_type ON employee_documents(document_type)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_employee_documents_status ON employee_documents(verification_status)`);

    // ── 6. Employee Terms Acceptance Table ───────────────────────────────────────
    await query(`
      CREATE TABLE IF NOT EXISTS employee_terms_acceptance (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        employee_id UUID NOT NULL REFERENCES employees(id) UNIQUE,
        terms_version VARCHAR(20) NOT NULL,
        terms_content TEXT NOT NULL,
        accepted BOOLEAN DEFAULT false,
        accepted_at TIMESTAMPTZ,
        acceptance_ip_address VARCHAR(50),
        video_url TEXT,
        video_key TEXT,
        video_uploaded_at TIMESTAMPTZ,
        video_file_name VARCHAR(255),
        video_size INTEGER,
        verification_status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'SUBMITTED', 'VERIFIED', 'REJECTED'
        verified_by UUID REFERENCES users(id),
        verified_at TIMESTAMPTZ,
        verification_notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_employee_terms_employee_id ON employee_terms_acceptance(employee_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_employee_terms_status ON employee_terms_acceptance(verification_status)`);

    // ── 7. Employee Product Links Table (CRITICAL) ─────────────────────────────────────
    await query(`
      CREATE TABLE IF NOT EXISTS employee_product_links (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        employee_id UUID NOT NULL REFERENCES employees(id),
        product_id UUID NOT NULL REFERENCES products(id),
        employee_referral_url TEXT NOT NULL, -- Employee-specific URL
        base_apply_url TEXT,
        incentive_amount DECIMAL(10,2) NOT NULL,
        incentive_type VARCHAR(20) DEFAULT 'FIXED', -- 'FIXED', 'PERCENTAGE'
        incentive_tier VARCHAR(20),
        status VARCHAR(20) DEFAULT 'ACTIVE', -- 'ACTIVE', 'INACTIVE', 'EXPIRED'
        assigned_by UUID REFERENCES users(id),
        assigned_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(employee_id, product_id)
      )
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_employee_product_links_employee_id ON employee_product_links(employee_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_employee_product_links_product_id ON employee_product_links(product_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_employee_product_links_status ON employee_product_links(status)`);

    // ── 8. Employee Incentive Transactions Table ─────────────────────────────────
    await query(`
      CREATE TABLE IF NOT EXISTS employee_incentive_transactions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        employee_id UUID NOT NULL REFERENCES employees(id),
        product_id UUID REFERENCES products(id),
        application_id UUID REFERENCES applications(id),
        transaction_type VARCHAR(20) NOT NULL, -- 'EARNED', 'PAID', 'HELD', 'RELEASED', 'REVERSED'
        amount DECIMAL(10,2) NOT NULL,
        incentive_type VARCHAR(20),
        status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'
        hold_until DATE,
        release_date DATE,
        hold_reason TEXT,
        payment_method VARCHAR(50),
        payment_reference VARCHAR(100),
        paid_at TIMESTAMPTZ,
        application_status VARCHAR(20),
        customer_name VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        processed_by UUID REFERENCES users(id)
      )
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_employee_incentive_employee_id ON employee_incentive_transactions(employee_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_employee_incentive_application_id ON employee_incentive_transactions(application_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_employee_incentive_status ON employee_incentive_transactions(status)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_employee_incentive_type ON employee_incentive_transactions(transaction_type)`);

    // ── 9. Employee Onboarding Checklist Table ─────────────────────────────────────
    await query(`
      CREATE TABLE IF NOT EXISTS employee_onboarding_checklist (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        employee_id UUID NOT NULL REFERENCES employees(id) UNIQUE,
        interview_completed BOOLEAN DEFAULT false,
        interview_completed_at TIMESTAMPTZ,
        employee_created BOOLEAN DEFAULT false,
        employee_created_at TIMESTAMPTZ,
        terms_pending BOOLEAN DEFAULT true,
        terms_completed BOOLEAN DEFAULT false,
        terms_completed_at TIMESTAMPTZ,
        joining_form_completed BOOLEAN DEFAULT false,
        joining_form_completed_at TIMESTAMPTZ,
        kyc_submitted BOOLEAN DEFAULT false,
        kyc_submitted_at TIMESTAMPTZ,
        kyc_verified BOOLEAN DEFAULT false,
        kyc_verified_at TIMESTAMPTZ,
        documents_completed BOOLEAN DEFAULT false,
        documents_completed_at TIMESTAMPTZ,
        hr_verified BOOLEAN DEFAULT false,
        hr_verified_at TIMESTAMPTZ,
        links_assigned BOOLEAN DEFAULT false,
        links_assigned_at TIMESTAMPTZ,
        activated BOOLEAN DEFAULT false,
        activated_at TIMESTAMPTZ,
        overall_progress INTEGER DEFAULT 0,
        current_stage VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_employee_onboarding_employee_id ON employee_onboarding_checklist(employee_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_employee_onboarding_progress ON employee_onboarding_checklist(overall_progress)`);

    // ── 10. Employee Hierarchy Table (Denormalized Approach) ───────────────────────────────
    await query(`
      CREATE TABLE IF NOT EXISTS employee_hierarchy (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        employee_id UUID NOT NULL REFERENCES employees(id),
        team_leader_id UUID REFERENCES employees(id),
        manager_id UUID REFERENCES employees(id),
        hierarchy_level VARCHAR(20) NOT NULL, -- 'MANAGER', 'TEAM_LEADER', 'TC'
        assigned_by UUID REFERENCES users(id),
        assigned_at TIMESTAMPTZ DEFAULT NOW(),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_employee_hierarchy_employee_id ON employee_hierarchy(employee_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_employee_hierarchy_team_leader_id ON employee_hierarchy(team_leader_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_employee_hierarchy_manager_id ON employee_hierarchy(manager_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_employee_hierarchy_level ON employee_hierarchy(hierarchy_level)`);

    // ── 11. Modify Existing Applications Table ─────────────────────────────────────────
    await query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES employees(id)`);
    await query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS employee_link_id UUID REFERENCES employee_product_links(id)`);
    await query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS source_type VARCHAR(20) DEFAULT 'PARTNER'`); // 'PARTNER', 'EMPLOYEE'

    // Create indexes for employee-related application queries
    await query(`CREATE INDEX IF NOT EXISTS idx_applications_employee_id ON applications(employee_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_applications_employee_link_id ON applications(employee_link_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_applications_source_type ON applications(source_type)`);

    // ── 12. Create Sequence for Employee ID Generation ───────────────────────────────────
    await query(`CREATE SEQUENCE IF NOT EXISTS employee_id_seq START 10001`);

    // ── 13. Create Sequence for Candidate Reference Code Generation ─────────────────────
    await query(`CREATE SEQUENCE IF NOT EXISTS candidate_reference_seq START 10001`);

    await query('COMMIT');
    logger.info('Employee Management System migrations completed successfully');

    return {
      success: true,
      message: 'Employee Management System migrations completed successfully',
      tables_created: [
        'employee_candidates',
        'employees',
        'employee_joining_details',
        'employee_kyc',
        'employee_documents',
        'employee_terms_acceptance',
        'employee_product_links',
        'employee_incentive_transactions',
        'employee_onboarding_checklist',
        'employee_hierarchy'
      ],
      tables_modified: [
        'applications (added employee_id, employee_link_id, source_type)'
      ],
      sequences_created: [
        'employee_id_seq',
        'candidate_reference_seq'
      ]
    };

  } catch (error) {
    await query('ROLLBACK');
    logger.error('Employee Management System migration failed:', error);
    throw error;
  }
};

// Run migration if called directly
if (require.main === module) {
  migrateEmployeeSystem()
    .then(async (result) => {
      console.log('Migration result:', result);
      await pool.end();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error('Migration failed:', error);
      await pool.end();
      process.exit(1);
    });
}

module.exports = migrateEmployeeSystem;