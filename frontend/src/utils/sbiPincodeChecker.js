import sbiPincodes from '../data/sbi_pincodes.json';

const sbiSet = new Set(sbiPincodes.map(p => String(p).trim()));

export const isSbiPincodeValid = (pincode) => {
  if (!pincode) return false;
  const clean = String(pincode).trim();
  return sbiSet.has(clean);
};

export const isSbiProductOrBank = (bankName = '', productName = '', bankCode = '') => {
  const str = (String(bankName || '') + ' ' + String(productName || '') + ' ' + String(bankCode || '')).toLowerCase();
  return str.includes('sbi') || str.includes('state bank');
};
