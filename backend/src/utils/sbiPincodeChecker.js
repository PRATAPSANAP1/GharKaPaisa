const sbiPincodes = require('../data/sbi_pincodes.json');
const s8Pincodes = require('../data/s8_pincodes.json');
const s8PincodesWithCity = require('../data/s8_pincodes_with_city.json');

const sbiSet = new Set(sbiPincodes.map(p => String(p).trim()));
const s8Set = new Set(s8Pincodes.map(p => String(p).trim()));

const isSbiPincodeValid = (pincode) => {
  if (!pincode) return false;
  const clean = String(pincode).trim();
  return sbiSet.has(clean);
};

const isS8Pincode = (pincode) => {
  if (!pincode) return false;
  const clean = String(pincode).trim();
  return s8Set.has(clean);
};

const getS8PincodeDetails = (pincode) => {
  if (!pincode) return null;
  const clean = String(pincode).trim();
  return s8PincodesWithCity[clean] || null;
};

const isSbiProductOrBank = (bankName = '', productName = '', bankCode = '') => {
  const str = (String(bankName || '') + ' ' + String(productName || '') + ' ' + String(bankCode || '')).toLowerCase();
  return str.includes('sbi') || str.includes('state bank');
};

module.exports = {
  isSbiPincodeValid,
  isS8Pincode,
  getS8PincodeDetails,
  isSbiProductOrBank,
  sbiPincodesList: sbiPincodes,
  s8PincodesList: s8Pincodes
};
