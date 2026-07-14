const { query, getClient } = require('../../config/database');
const { notify } = require('../notifications/service.js');
const logger = require('../../config/logger');

/**
 * Calculates and synchronizes the onboarding progress for a given partner.
 * @param {string} partnerId - Partner profile UUID or user UUID
 * @param {object|null} existingClient - Optional DB client for transaction continuity
 */
const syncOnboardingProgress = async (partnerId, existingClient = null) => {
  const db = existingClient || { query };
  
  // 1. Fetch partner profile & user details
  const { rows: [partner] } = await db.query(`
    SELECT p.id, p.user_id, p.first_name, p.last_name, p.kyc_status, u.email, u.mobile, u.status as user_status
    FROM partner_profiles p
    JOIN users u ON u.id = p.user_id
    WHERE p.id = $1 OR p.user_id = $1
  `, [partnerId]);

  if (!partner) {
    throw new Error(`Partner not found for ID: ${partnerId}`);
  }

  const pId = partner.id;
  const userId = partner.user_id;

  // 2. Fetch step completion statuses in parallel queries
  const [bankRes, trainingRes, leadRes, appRes] = await Promise.all([
    // Step 3: Bank Details Added & Verified / Submitted
    db.query(`
      SELECT id, is_verified 
      FROM partner_bank_details 
      WHERE partner_id = $1 AND account_number IS NOT NULL AND account_number != ''
      LIMIT 1
    `, [pId]),

    // Step 4: Mandatory Training Modules Completed
    db.query(`
      SELECT 
        (SELECT COUNT(*) FROM training_modules WHERE is_active = true) as total_mandatory,
        (SELECT COUNT(*) FROM partner_training_progress ptp 
         JOIN training_modules tm ON tm.id = ptp.training_id 
         WHERE ptp.partner_id = $1 AND ptp.completed = true AND tm.is_active = true) as completed_count
    `, [pId]),

    // Step 5: First Lead Submitted
    db.query(`SELECT COUNT(*) FROM leads WHERE partner_id = $1`, [pId]),

    // Step 6: First Customer Application Submitted
    db.query(`SELECT COUNT(*) FROM applications WHERE partner_id = $1`, [pId])
  ]);

  // Step 1: Profile (20%)
  const profile_completed = Boolean(
    partner.first_name && partner.last_name && partner.email && partner.mobile
  );

  // Step 2: KYC Documents (25%)
  const kyc_completed = ['approved', 'under_review'].includes(partner.kyc_status);

  // Step 3: Bank Verification (20%)
  const bank_completed = bankRes.rows.length > 0;

  // Step 4: Training Completed (15%)
  const totalMandatory = parseInt(trainingRes.rows[0]?.total_mandatory || 0);
  const completedTraining = parseInt(trainingRes.rows[0]?.completed_count || 0);
  const training_completed = totalMandatory > 0 ? completedTraining >= totalMandatory : true;

  // Step 5: First Lead (10%)
  const first_lead_completed = parseInt(leadRes.rows[0]?.count || 0) > 0;

  // Step 6: First Application (10%)
  const first_application_completed = parseInt(appRes.rows[0]?.count || 0) > 0;

  // Calculate Weighted Completion Percentage
  let progress_percentage = 0;
  if (profile_completed) progress_percentage += 20;
  if (kyc_completed) progress_percentage += 25;
  if (bank_completed) progress_percentage += 20;
  if (training_completed) progress_percentage += 15;
  if (first_lead_completed) progress_percentage += 10;
  if (first_application_completed) progress_percentage += 10;

  const isFullyCompleted = progress_percentage >= 100;

  // Upsert into partner_onboarding table
  const { rows: [existingOnboarding] } = await db.query(
    `SELECT * FROM partner_onboarding WHERE partner_id = $1`,
    [pId]
  );

  let completedAt = existingOnboarding?.completed_at || null;
  if (isFullyCompleted && !completedAt) {
    completedAt = new Date();
  }

  await db.query(`
    INSERT INTO partner_onboarding (
      partner_id, profile_completed, kyc_completed, bank_completed,
      training_completed, first_lead_completed, first_application_completed,
      progress_percentage, completed_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
    ON CONFLICT (partner_id) DO UPDATE SET
      profile_completed = EXCLUDED.profile_completed,
      kyc_completed = EXCLUDED.kyc_completed,
      bank_completed = EXCLUDED.bank_completed,
      training_completed = EXCLUDED.training_completed,
      first_lead_completed = EXCLUDED.first_lead_completed,
      first_application_completed = EXCLUDED.first_application_completed,
      progress_percentage = EXCLUDED.progress_percentage,
      completed_at = COALESCE(partner_onboarding.completed_at, EXCLUDED.completed_at),
      updated_at = NOW()
  `, [
    pId, profile_completed, kyc_completed, bank_completed,
    training_completed, first_lead_completed, first_application_completed,
    progress_percentage, completedAt
  ]);

  // Send onboarding completion notification if freshly activated
  if (isFullyCompleted && (!existingOnboarding || !existingOnboarding.completed_at)) {
    try {
      await notify.create({
        user_id: userId,
        title: '🎉 Onboarding Complete! Account Fully Activated',
        message: 'Congratulations! You have completed all onboarding steps. You are now fully active to refer leads and earn maximum commissions.',
        type: 'success',
        category: 'onboarding',
        priority: 'high',
        link: '/partner/dashboard'
      });
    } catch (nErr) {
      logger.error('Failed to send onboarding completion notification:', nErr.message);
    }
  }

  // Build steps array for API payload
  const steps = [
    {
      key: 'profile',
      title: 'Basic Profile',
      description: 'Name, email, and mobile verified',
      completed: profile_completed,
      weight: 20,
      redirect: '/partner/profile'
    },
    {
      key: 'kyc',
      title: 'Upload KYC Documents',
      description: 'PAN, Aadhaar, Cheque & Video KYC',
      completed: kyc_completed,
      weight: 25,
      redirect: '/partner/kyc'
    },
    {
      key: 'bank',
      title: 'Verify Bank Account',
      description: 'Link bank details for payout settlements',
      completed: bank_completed,
      weight: 20,
      redirect: '/partner/wallet'
    },
    {
      key: 'training',
      title: 'Complete Training',
      description: 'Watch product pitching video modules',
      completed: training_completed,
      weight: 15,
      redirect: '/partner/training'
    },
    {
      key: 'first_lead',
      title: 'Submit First Lead',
      description: 'Add your customer leads for financial products',
      completed: first_lead_completed,
      weight: 10,
      redirect: '/partner/products'
    },
    {
      key: 'first_application',
      title: 'First Application',
      description: 'Submit your first full customer application',
      completed: first_application_completed,
      weight: 10,
      redirect: '/partner/customers'
    }
  ];

  const completedStepsCount = steps.filter(s => s.completed).length;
  const nextStep = steps.find(s => !s.completed) || null;

  return {
    partner_id: pId,
    progress: progress_percentage,
    completed_steps_count: completedStepsCount,
    total_steps_count: steps.length,
    is_fully_completed: isFullyCompleted,
    completed_at: completedAt,
    steps,
    next_step: nextStep ? {
      key: nextStep.key,
      title: nextStep.title,
      action_text: nextStep.title,
      redirect: nextStep.redirect
    } : null
  };
};

module.exports = {
  syncOnboardingProgress
};
