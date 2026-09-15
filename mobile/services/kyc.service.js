import apiClient from '../config/api';

/**
 * Synchronized Partner & Employee KYC Service
 */
export const getKycDetails = async () => {
  try {
    const response = await apiClient.get('/kyc/status');
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to fetch KYC status' };
  }
};

export const uploadKycFile = async (documentType, fileUri, fileName, mimeType) => {
  try {
    const formData = new FormData();
    formData.append('document_type', documentType);
    formData.append('document', {
      uri: fileUri,
      name: fileName || `kyc_${Date.now()}.jpg`,
      type: mimeType || 'image/jpeg'
    });

    const response = await apiClient.post('/kyc/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to upload KYC document' };
  }
};

export const submitFinalKyc = async (panNumber, bankAccount = {}) => {
  try {
    const response = await apiClient.post('/kyc/submit', {
      pan_number: panNumber,
      account_number: bankAccount.account_number,
      ifsc: bankAccount.ifsc,
      bank_name: bankAccount.bank_name
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to submit KYC verification' };
  }
};
