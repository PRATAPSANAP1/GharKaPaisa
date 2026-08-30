const { query } = require('../../config/database');
const permissionService = require('./chatbot.permission.service');

class ChatbotPartnerService {
  /**
   * Handle partner wallet earnings query
   */
  async handlePartnerEarnings(context) {
    if (!permissionService.canViewPartnerEarnings(context) || !context.partnerId) {
      return {
        type: 'TEXT',
        message: "Earnings and wallet details are available inside your Partner Dashboard after logging in.",
        data: null
      };
    }

    try {
      const { rows } = await query(
        `SELECT total_earned, total_withdrawn, hold_balance, available_balance
         FROM partner_wallets
         WHERE partner_id = $1 LIMIT 1`,
        [context.partnerId]
      );

      const wallet = rows[0] || { available_balance: 0, total_earned: 0, hold_balance: 0 };

      return {
        type: 'TEXT',
        message: `💰 *Your Partner GKP Wallet Overview:*\n\n• Available Balance: ₹${wallet.available_balance}\n• Total Lifetime Earned: ₹${wallet.total_earned}\n• On-Hold Balance: ₹${wallet.hold_balance}`,
        data: { wallet }
      };
    } catch {
      return {
        type: 'TEXT',
        message: "Failed to fetch wallet details. Please check your Partner Wallet tab.",
        data: null
      };
    }
  }

  /**
   * Handle partner referral team network query
   */
  async handlePartnerTeam(context) {
    if (!permissionService.canViewTeam(context) || !context.partnerId) {
      return {
        type: 'TEXT',
        message: "Referral network details are accessible inside your Partner Dashboard.",
        data: null
      };
    }

    try {
      const { rows } = await query(
        `SELECT COUNT(*) as team_count FROM partner_referrals WHERE partner_id = $1`,
        [context.partnerId]
      );

      const count = rows[0]?.team_count || 0;

      return {
        type: 'TEAM',
        message: `👥 *Your Referral Network:*\n\nYou currently have *${count} active sub-agents* in your network earning level commissions.`,
        data: { teamCount: count }
      };
    } catch {
      return {
        type: 'TEXT',
        message: "Failed to fetch team details. Check your Team tab.",
        data: null
      };
    }
  }
}

module.exports = new ChatbotPartnerService();
