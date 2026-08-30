const { query } = require('../../config/database');
const permissionService = require('./chatbot.permission.service');

class ChatbotEmployeeService {
  /**
   * Handle employee incentives query (Employees see INCENTIVE, never Commission)
   */
  async handleEmployeeIncentives(context) {
    if (!permissionService.canViewIncentives(context) || !context.employeeId) {
      return {
        type: 'TEXT',
        message: "Incentive details are available for logged-in Employees.",
        data: null
      };
    }

    try {
      const { rows } = await query(
        `SELECT 
           COALESCE(SUM(CASE WHEN transaction_type = 'EARNED' THEN amount ELSE 0 END), 0) as total_earned,
           COALESCE(SUM(CASE WHEN transaction_type = 'HELD' THEN amount ELSE 0 END), 0) as total_held,
           COALESCE(SUM(CASE WHEN transaction_type = 'PAID' THEN amount ELSE 0 END), 0) as total_paid
         FROM employee_incentive_transactions
         WHERE employee_id = $1`,
        [context.employeeId]
      );

      const inc = rows[0] || { total_earned: 0, total_held: 0, total_paid: 0 };

      return {
        type: 'INCENTIVE',
        message: `🎁 *Your Employee Incentive Summary:*\n\n• Total Earned Incentives: ₹${inc.total_earned}\n• Pending Hold Incentives: ₹${inc.total_held}\n• Total Paid Out: ₹${inc.total_paid}`,
        data: {
          earned: inc.total_earned,
          held: inc.total_held,
          paid: inc.total_paid
        }
      };
    } catch {
      return {
        type: 'TEXT',
        message: "Failed to fetch incentive details. Please check your Incentives tab.",
        data: null
      };
    }
  }

  /**
   * Handle employee onboarding checklist query
   */
  async handleEmployeeOnboarding(context) {
    if (!context.employeeId) {
      return {
        type: 'TEXT',
        message: "Onboarding status is available for logged-in employees.",
        data: null
      };
    }

    try {
      const { rows } = await query(
        `SELECT overall_progress, current_stage, terms_completed, joining_form_completed, kyc_verified, documents_completed
         FROM employee_onboarding_checklist
         WHERE employee_id = $1 LIMIT 1`,
        [context.employeeId]
      );

      const ob = rows[0] || { overall_progress: 0, current_stage: 'PENDING' };

      return {
        type: 'ONBOARDING',
        message: `📋 *Onboarding Status (${ob.overall_progress}% Complete):*\n\n• Current Stage: ${ob.current_stage}\n• Terms Form: ${ob.terms_completed ? '✅ Completed' : '⏳ Pending'}\n• Joining Form: ${ob.joining_form_completed ? '✅ Completed' : '⏳ Pending'}\n• KYC Verification: ${ob.kyc_verified ? '✅ Verified' : '⏳ Pending'}\n• Documents: ${ob.documents_completed ? '✅ Uploaded' : '⏳ Pending'}`,
        data: { onboarding: ob }
      };
    } catch {
      return {
        type: 'TEXT',
        message: "Failed to fetch onboarding status.",
        data: null
      };
    }
  }
}

module.exports = new ChatbotEmployeeService();
