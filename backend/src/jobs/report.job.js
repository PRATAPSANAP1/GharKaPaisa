const cron = require('node-cron');
const { query } = require('../config/db');
const logger = require('../utils/logger');

// Just an example of a report job that might compile daily stats into a table or send an email
const compileDailyReports = async () => {
  try {
    logger.info('Running daily report compilation job...');
    
    // In a real application, you might email this or save it to a reports table.
    const { rows: [dailyStats] } = await query(`
      SELECT 
        COUNT(*) as total_apps_today,
        COALESCE(SUM(commission_amount) FILTER (WHERE status = 'approved'), 0) as total_approved_commission
      FROM applications 
      WHERE created_at >= CURRENT_DATE
    `);
    
    logger.info(`Daily Report Summary: ${dailyStats.total_apps_today} applications, ₹${dailyStats.total_approved_commission} commission approved.`);
  } catch (err) {
    logger.error(`Daily report job failed: ${err.message}`);
  }
};

// 0 23 * * * = Every day at 11:00 PM
const initReportJobs = () => {
  cron.schedule('0 23 * * *', compileDailyReports);
  logger.info('Daily report CRON job scheduled (11 PM).');
};

module.exports = { initReportJobs };
