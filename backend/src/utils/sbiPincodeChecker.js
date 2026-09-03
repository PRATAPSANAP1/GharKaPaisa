const sbiPincodes = require('../data/sbi_pincodes.json');

const sbiSet = new Set(sbiPincodes.map(p => String(p).trim()));

const isSbiPincodeValid = (pincode) => {
  if (!pincode) return false;
  const clean = String(pincode).trim();
  return sbiSet.has(clean);
};

const isSbiProductOrBank = (bankName = '', productName = '', bankCode = '') => {
  const str = (String(bankName || '') + ' ' + String(productName || '') + ' ' + String(bankCode || '')).toLowerCase();
  return str.includes('sbi') || str.includes('state bank');
};

module.exports = {
  isSbiPincodeValid,
  isSbiProductOrBank,
  sbiPincodesList: sbiPincodes
};
