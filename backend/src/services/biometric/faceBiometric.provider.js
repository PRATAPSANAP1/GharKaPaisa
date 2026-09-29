const crypto = require('crypto');
const logger = require('../../config/logger');

class FaceBiometricProvider {
  constructor() {
    this.providerName = process.env.BIOMETRIC_PROVIDER || 'LOCAL_S3';
    this.isConfigured = !!(process.env.AWS_REKOGNITION_COLLECTION_ID && process.env.AWS_ACCESS_KEY_ID);
  }

  /**
   * Validate image quality, size, and format before reference enrollment
   * @param {Buffer} buffer 
   * @param {string} mimetype 
   */
  validateFaceQuality(buffer, mimetype = 'image/jpeg') {
    if (!buffer || !Buffer.isBuffer(buffer)) {
      throw new Error('Invalid image buffer provided');
    }

    const MIN_SIZE = 20 * 1024; // 20KB minimum
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB maximum

    if (buffer.length < MIN_SIZE) {
      throw new Error('Image file is too small. Please capture a clearer, higher-resolution face photograph.');
    }

    if (buffer.length > MAX_SIZE) {
      throw new Error('Image file size exceeds 10MB limit.');
    }

    // Inspect magic bytes for JPG/PNG
    const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;

    if (!isJpeg && !isPng && !['image/jpeg', 'image/png', 'image/jpg'].includes(mimetype.toLowerCase())) {
      throw new Error('Unsupported image format. Only JPEG and PNG face captures are allowed.');
    }

    return {
      valid: true,
      sizeBytes: buffer.length,
      format: isJpeg ? 'jpeg' : isPng ? 'png' : 'jpeg',
      providerStatus: this.isConfigured ? 'PROVIDER_CONFIGURED' : 'PROVIDER_NOT_CONFIGURED',
    };
  }

  /**
   * Compute SHA-256 cryptographic hash of reference image
   * @param {Buffer} buffer 
   */
  calculateImageHash(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Get provider status information without returning fake scores
   */
  getProviderInfo() {
    return {
      providerName: this.providerName,
      isConfigured: this.isConfigured,
      statusMessage: this.isConfigured
        ? 'AWS Rekognition Biometric Provider Active'
        : 'Provider pending activation. Reference images stored securely in private S3.',
    };
  }
}

module.exports = new FaceBiometricProvider();
