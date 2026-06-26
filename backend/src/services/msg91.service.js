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
  if (!accessToken || typeof accessToken !== "string") {
    throw new Error("MSG91 access token is required");
  }

  try {
    console.log("=========== VERIFY REQUEST ===========");
    console.log("URL:", VERIFY_ACCESS_TOKEN_URL);
    console.log("AuthKey:", getAuthKey());
    console.log("AccessToken:", accessToken);
    console.log("Expected Mobile:", expectedMobile);

    const response = await axios.post(
      VERIFY_ACCESS_TOKEN_URL,
      {
        authkey: getAuthKey(),
        "access-token": accessToken,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        timeout: 10000,
      }
    );

    console.log("=========== VERIFY SUCCESS ===========");
    console.log(JSON.stringify(response.data, null, 2));
    console.log("======================================");

    const payload = response.data || {};

    const verificationSucceeded =
      payload.success === true ||
      payload.type === "success" ||
      payload.status === "success" ||
      payload.status === true;

    if (!verificationSucceeded) {
      throw new Error(
        payload.message || payload.error || "MSG91 verification failed"
      );
    }

    const requestedMobile = normalizeIndianMobile(expectedMobile);
    const verifiedIdentifier = findVerifiedIdentifier(payload);
    const verifiedMobile = normalizeIndianMobile(verifiedIdentifier);

    console.log("Requested:", requestedMobile);
    console.log("Verified :", verifiedMobile);

    if (!verifiedIdentifier || !verifiedMobile) {
      throw new Error("MSG91 did not return verified mobile.");
    }

    if (requestedMobile !== verifiedMobile) {
      throw new Error("Verified mobile mismatch.");
    }

    return payload;

  } catch (err) {

    console.log("=========== VERIFY FAILED ===========");
    console.log("Status :", err.response?.status);
    console.log("Data   :", JSON.stringify(err.response?.data, null, 2));
    console.log("Error  :", err.message);
    console.log("=====================================");

    throw err;
  }
};

const sendSmsOtp = async (mobile, otp) => {
  const authKey = getAuthKey();
  const templateId = process.env.MSG91_OTP_TEMPLATE_ID;

  if (!templateId) {
    throw new Error("MSG91_OTP_TEMPLATE_ID is not configured");
  }

  const normalized = normalizeIndianMobile(mobile);

  if (!normalized) {
    throw new Error("Invalid Indian mobile number");
  }

  const url = `https://control.msg91.com/api/v5/otp?template_id=${templateId}&mobile=91${normalized}&authkey=${authKey}&otp=${otp}`;

  try {
    console.log("========== MSG91 ==========");
    console.log("URL:", url);
    console.log("Template:", templateId);
    console.log("Mobile:", normalized);

    const response = await axios.post(
      url,
      {},
      {
        headers: {
          Accept: "application/json"
        },
        timeout: 10000
      }
    );

    console.log("MSG91 Response:", response.data);

    return response.data;

  } catch (err) {
    console.log("=========== VERIFY ERROR ===========");
    console.log("Status:", err.response?.status);
    console.log("Data:", JSON.stringify(err.response?.data, null, 2));
    console.log("====================================");
    throw err;
}
};

module.exports = {
  normalizeIndianMobile,
  verifyAccessToken,
  sendSmsOtp,
};
