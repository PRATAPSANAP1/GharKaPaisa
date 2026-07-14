const logger = require('../../config/logger');
const { success, error } = require('../../utils/response/response');

const getPincodeInfo = async (req, res, next) => {
  try {
    const { pincode } = req.params;

    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return error(res, 'Valid 6-digit Pincode required', 400);
    }

    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();

      if (data && data[0] && data[0].Status === 'Success') {
        const postOffices = data[0].PostOffice;
        if (postOffices && postOffices.length > 0) {
          const mainOffice = postOffices[0];
          return success(res, {
            state: mainOffice.State,
            district: mainOffice.District,
            city: mainOffice.District
          });
        }
      }
    } catch (fetchErr) {
      logger.error(`Failed to fetch pincode from external API: ${fetchErr.message}`);
    }

    // Fallback: Default mock pincodes for local testing
    const fallbackPincodes = {
      '414003': { state: 'Maharashtra', district: 'Ahmednagar', city: 'Ahmednagar' },
      '110001': { state: 'Delhi', district: 'New Delhi', city: 'New Delhi' },
      '400001': { state: 'Maharashtra', district: 'Mumbai', city: 'Mumbai' },
      '560001': { state: 'Karnataka', district: 'Bengaluru', city: 'Bengaluru' }
    };

    const fallback = fallbackPincodes[pincode];
    if (fallback) {
      return success(res, fallback);
    }

    return error(res, 'Pincode not found or service unavailable', 404);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPincodeInfo
};
