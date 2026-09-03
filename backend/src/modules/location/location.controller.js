const logger = require('../../config/logger');
const { success, error } = require('../../utils/response/response');
const sbiPincodeMap = require('../../data/sbi_pincodes_with_city.json');

const sbiEntries = Object.entries(sbiPincodeMap);
const sbiSet = new Set(Object.keys(sbiPincodeMap));

const getPincodeInfo = async (req, res, next) => {
  try {
    const { pincode } = req.params;

    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return error(res, 'Valid 6-digit Pincode required', 400);
    }

    // First check local SBI pincode city map
    if (sbiPincodeMap[pincode]) {
      return success(res, {
        state: 'India',
        district: sbiPincodeMap[pincode],
        city: sbiPincodeMap[pincode],
        is_sbi_serviced: true
      });
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
            city: mainOffice.District,
            is_sbi_serviced: sbiSet.has(pincode)
          });
        }
      }
    } catch (fetchErr) {
      logger.error(`Failed to fetch pincode from external API: ${fetchErr.message}`);
    }

    return error(res, 'Pincode not found or service unavailable', 404);
  } catch (err) {
    next(err);
  }
};

const getSbiPincodeSuggestions = async (req, res, next) => {
  try {
    const { query: q } = req.query;
    if (!q) {
      return success(res, []);
    }
    const clean = String(q).trim().toLowerCase();
    const filtered = sbiEntries
      .filter(([pin, city]) => pin.startsWith(clean) || city.toLowerCase().includes(clean))
      .slice(0, 15)
      .map(([pincode, city]) => ({ pincode, city }));

    return success(res, filtered);
  } catch (err) {
    next(err);
  }
};

const checkSbiPincode = async (req, res, next) => {
  try {
    const { pincode } = req.params;
    const clean = String(pincode || '').trim();
    const isValid = sbiSet.has(clean);
    const city = sbiPincodeMap[clean] || null;

    return success(res, {
      pincode: clean,
      is_valid: isValid,
      city: city,
      message: isValid ? 'Pincode is supported by SBI' : "You can't add lead for this pincode"
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPincodeInfo,
  getSbiPincodeSuggestions,
  checkSbiPincode
};
