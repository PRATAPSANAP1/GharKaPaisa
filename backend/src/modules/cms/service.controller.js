const { query } = require('../../config/database');
const { success, error } = require('../../utils/response/response');
const logger = require('../../config/logger');

const submitRequest = async (req, res, next) => {
  try {
    const { service_type, mobile, operator, consumer_number, provider, loan_number, vehicle_number, amount } = req.body;
    
    // Basic validation
    if (!service_type || !amount) {
      return error(res, 'Service type and amount are required', 400);
    }

    const { rows: [result] } = await query(`
      INSERT INTO service_requests (service_type, mobile, operator, consumer_number, provider, loan_number, vehicle_number, amount)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [service_type, mobile, operator, consumer_number, provider, loan_number, vehicle_number, amount]);

    logger.info(`Service request submitted: ${service_type} for amount ₹${amount}`);
    return success(res, result, 'Request submitted successfully. Pending processing.');
  } catch (err) {
    logger.error('Submit Service Request failed', err);
    next(err);
  }
};

module.exports = { submitRequest };
