const axios = require('axios');

const VERIFY_ACCESS_TOKEN_URL = 'https://control.msg91.com/api/v5/widget/verifyAccessToken';

const getAuthKey = () => {
  const authKey = process.env.MSG91_AUTH_KEY;
  if (!authKey) {
    throw new Error('MSG91_AUTH_KEY is not configured');
  }
  return authKey;
};

const normalizeIndianMobile = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (/^[6-9]\d{9}$/.test(digits)) return digits;
  if (/^91[6-9]\d{9}$/.test(digits)) return digits.slice(2);
  return null;
};

const findVerifiedIdentifier = (payload) => {
  const candidates = [
    payload?.identifier,
    payload?.mobile,
    payload?.phone,
    payload?.data?.identifier,
    payload?.data?.mobile,
    payload?.data?.phone,
  ];
  return candidates.find(Boolean) || null;
};

const verifyAccessToken = async ({ accessToken, expectedMobile }) => {
  if (!accessToken || typeof accessToken !== 'string') {
    throw new Error('MSG91 access token is required');
  }

  const response = await axios.post(
    VERIFY_ACCESS_TOKEN_URL,
    {
      authkey: getAuthKey(),
      'access-token': accessToken,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 10000,
    }
  );

  const payload = response.data || {};
  const verificationSucceeded =
    payload.success === true ||
    payload.type === 'success' ||
    payload.status === 'success' ||
    payload.status === true;

  if (!verificationSucceeded) {
    const reason = payload.message || payload.error || 'MSG91 token verification failed';
    const err = new Error(reason);
    err.code = 'MSG91_TOKEN_INVALID';
    throw err;
  }

  const requestedMobile = normalizeIndianMobile(expectedMobile);
  const verifiedIdentifier = findVerifiedIdentifier(payload);
  const verifiedMobile = normalizeIndianMobile(verifiedIdentifier);

  if (!verifiedIdentifier || !verifiedMobile) {
    const err = new Error('MSG91 response did not include the verified mobile number');
    err.code = 'MSG91_IDENTIFIER_MISSING';
    throw err;
  }

  if (!requestedMobile || verifiedMobile !== requestedMobile) {
    const err = new Error('Verified mobile number does not match the login request');
    err.code = 'MSG91_IDENTIFIER_MISMATCH';
    throw err;
  }

  return payload;
};

module.exports = {
  normalizeIndianMobile,
  verifyAccessToken,
};
