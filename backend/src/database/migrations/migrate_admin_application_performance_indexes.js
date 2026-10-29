/**
 * Performance indexes for admin/operator application listing
 * Addresses slow loading in ManageApplications component
 */

const { query } = require('../../config/database');

async function up() {
  console.log('Creating admin application performance indexes...');

  try {
    // Admin bank assignments lookup
    await query(`
      CREATE INDEX IF NOT EXISTS idx_admin_bank_assignments_admin_id 
      ON admin_bank_assignments(admin_id)
    `);
    console.log('✓ Index: admin_bank_assignments.admin_id');

    // Applications table indexes
    await query(`
      CREATE INDEX IF NOT EXISTS idx_applications_partner_id 
      ON applications(partner_id)
    `);
    console.log('✓ Index: applications.partner_id');

    await query(`
      CREATE INDEX IF NOT EXISTS idx_applications_submitted_by 
      ON applications(submitted_by)
    `);
    console.log('✓ Index: applications.submitted_by');

    await query(`
      CREATE INDEX IF NOT EXISTS idx_applications_employee_id 
      ON applications(employee_id)
    `);
    console.log('✓ Index: applications.employee_id');

    await query(`
      CREATE INDEX IF NOT EXISTS idx_applications_product_id 
      ON applications(product_id)
    `);
    console.log('✓ Index: applications.product_id');

    await query(`
      CREATE INDEX IF NOT EXISTS idx_applications_bank_id 
      ON applications(bank_id)
    `);
    console.log('✓ Index: applications.bank_id');

    await query(`
      CREATE INDEX IF NOT EXISTS idx_applications_status 
      ON applications(status)
    `);
    console.log('✓ Index: applications.status');

    await query(`
      CREATE INDEX IF NOT EXISTS idx_applications_created_at 
      ON applications(created_at DESC)
    `);
    console.log('✓ Index: applications.created_at DESC');

    await query(`
      CREATE INDEX IF NOT EXISTS idx_applications_partner_status 
      ON applications(partner_id, status)
    `);
    console.log('✓ Index: applications.partner_id, status');

    await query(`
      CREATE INDEX IF NOT EXISTS idx_applications_submitted_status 
      ON applications(submitted_by, status)
    `);
    console.log('✓ Index: applications.submitted_by, status');

    // Physical application details indexes
    await query(`
      CREATE INDEX IF NOT EXISTS idx_physical_app_details_application_id 
      ON physical_application_details(application_id)
    `);
    console.log('✓ Index: physical_application_details.application_id');

    // Employees lookup for admin assignments
    await query(`
      CREATE INDEX IF NOT EXISTS idx_employees_user_id 
      ON employees(user_id)
    `);
    console.log('✓ Index: employees.user_id');

    // Partner profiles indexes
    await query(`
      CREATE INDEX IF NOT EXISTS idx_partner_profiles_user_id 
      ON partner_profiles(user_id)
    `);
    console.log('✓ Index: partner_profiles.user_id');

    await query(`
      CREATE INDEX IF NOT EXISTS idx_partner_profiles_parent_partner_id 
      ON partner_profiles(parent_partner_id)
    `);
    console.log('✓ Index: partner_profiles.parent_partner_id');

    await query(`
      CREATE INDEX IF NOT EXISTS idx_partner_profiles_referred_by_id 
      ON partner_profiles(referred_by_id)
    `);
    console.log('✓ Index: partner_profiles.referred_by_id');

    console.log('All admin application performance indexes created successfully!');
  } catch (err) {
    console.error('Error creating indexes:', err);
    throw err;
  }
}

async function down() {
  console.log('Dropping admin application performance indexes...');

  try {
    await query(`DROP INDEX IF EXISTS idx_admin_bank_assignments_admin_id`);
    await query(`DROP INDEX IF EXISTS idx_applications_partner_id`);
    await query(`DROP INDEX IF EXISTS idx_applications_submitted_by`);
    await query(`DROP INDEX IF EXISTS idx_applications_employee_id`);
    await query(`DROP INDEX IF EXISTS idx_applications_product_id`);
    await query(`DROP INDEX IF EXISTS idx_applications_bank_id`);
    await query(`DROP INDEX IF EXISTS idx_applications_status`);
    await query(`DROP INDEX IF EXISTS idx_applications_created_at`);
    await query(`DROP INDEX IF EXISTS idx_applications_partner_status`);
    await query(`DROP INDEX IF EXISTS idx_applications_submitted_status`);
    await query(`DROP INDEX IF EXISTS idx_physical_app_details_application_id`);
    await query(`DROP INDEX IF EXISTS idx_employees_user_id`);
    await query(`DROP INDEX IF EXISTS idx_partner_profiles_user_id`);
    await query(`DROP INDEX IF EXISTS idx_partner_profiles_parent_partner_id`);
    await query(`DROP INDEX IF EXISTS idx_partner_profiles_referred_by_id`);

    console.log('All admin application performance indexes dropped successfully!');
  } catch (err) {
    console.error('Error dropping indexes:', err);
    throw err;
  }
}

if (require.main === module) {
  const command = process.argv[2];
  if (command === 'down') {
    down();
  } else {
    up();
  }
}

module.exports = { up, down };
