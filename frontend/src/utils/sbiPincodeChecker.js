import sbiPincodes from '../data/sbi_pincodes.json';
import s8Pincodes from '../data/s8_pincodes.json';
import s8PincodesWithCity from '../data/s8_pincodes_with_city.json';

const sbiSet = new Set(sbiPincodes.map(p => String(p).trim()));
const s8Set = new Set(s8Pincodes.map(p => String(p).trim()));

export const isSbiPincodeValid = (pincode) => {
  if (!pincode) return false;
  const clean = String(pincode).trim();
  return sbiSet.has(clean) || s8Set.has(clean);
};

export const isS8Pincode = (pincode) => {
  if (!pincode) return false;
  const clean = String(pincode).trim();
  return s8Set.has(clean);
};

export const getS8PincodeDetails = (pincode) => {
  if (!pincode) return null;
  const clean = String(pincode).trim();
  return s8PincodesWithCity[clean] || null;
};

export const getAllS8Cities = () => {
  const cities = new Set(Object.values(s8PincodesWithCity).map(item => item.city?.trim()?.toUpperCase()).filter(Boolean));
  return Array.from(cities).sort();
};

export const isSbiProductOrBank = (bankName = '', productName = '', bankCode = '') => {
  const str = (String(bankName || '') + ' ' + String(productName || '') + ' ' + String(bankCode || '')).toLowerCase();
  return str.includes('sbi') || str.includes('state bank');
};
