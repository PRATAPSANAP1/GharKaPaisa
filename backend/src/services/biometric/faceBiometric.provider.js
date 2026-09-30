const crypto = require('crypto');
const logger = require('../../config/logger');

let RekognitionClient, IndexFacesCommand;
try {
  ({ RekognitionClient, IndexFacesCommand } = require('@aws-sdk/client-rekognition'));
} catch (e) {
  // @aws-sdk/client-rekognition optional loading
}

class FaceBiometricProvider {
  constructor() {
    this.providerName = process.env.BIOMETRIC_PROVIDER || 'AWS_REKOGNITION';
    this.region = process.env.AWS_REGION || 'ap-south-1';
    this.collectionId = process.env.AWS_REKOGNITION_COLLECTION_ID || null;

    const hasCreds = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
    this.isConfigured = !!(RekognitionClient && hasCreds && this.collectionId);

    if (this.isConfigured) {
      this.rekognitionClient = new RekognitionClient({
        region: this.region,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });
    } else {
      this.rekognitionClient = null;
    }
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
   * Index face representation into Rekognition Collection
   * Uses employeeId (UUID) as ExternalImageId to prevent encoding names/PII
   */
  async indexFaceReference({ bucket, key, employeeId }) {
    if (!this.isConfigured || !this.rekognitionClient || !this.collectionId) {
      logger.info(`[FACE INDEXING] Rekognition collection indexing skipped (Provider not configured or no collection ID). Storing in private S3.`);
      return {
        isIndexed: false,
        faceProvider: 'LOCAL_S3',
        collectionId: null,
        faceId: null,
        status: 'PROVIDER_NOT_CONFIGURED',
      };
    }

    try {
      const command = new IndexFacesCommand({
        CollectionId: this.collectionId,
        Image: {
          S3Object: {
            Bucket: bucket,
            Name: key,
          },
        },
        ExternalImageId: String(employeeId),
        DetectionAttributes: ['DEFAULT'],
        MaxFaces: 1,
        QualityFilter: 'AUTO',
      });

      const response = await this.rekognitionClient.send(command);
      const faceRecords = response.FaceRecords || [];

      if (faceRecords.length === 0) {
        logger.warn(`[FACE INDEXING] No clear face detected in image for employee ${employeeId}`);
        return {
          isIndexed: false,
          faceProvider: 'AWS_REKOGNITION',
          collectionId: this.collectionId,
          faceId: null,
          status: 'NO_FACE_DETECTED',
        };
      }

      const indexedFace = faceRecords[0].Face;
      logger.info(`[FACE INDEXING] Successfully indexed face for employee ${employeeId} (FaceId: ${indexedFace.FaceId})`);

      return {
        isIndexed: true,
        faceProvider: 'AWS_REKOGNITION',
        collectionId: this.collectionId,
        faceId: indexedFace.FaceId,
        status: 'INDEXED',
      };
    } catch (err) {
      logger.error(`[FACE INDEXING] Error indexing face in Rekognition for employee ${employeeId}:`, err.message);
      return {
        isIndexed: false,
        faceProvider: 'LOCAL_S3',
        collectionId: this.collectionId,
        faceId: null,
        status: 'INDEXING_ERROR',
        error: err.message,
      };
    }
  }

  /**
   * Get provider status information without returning fake scores
   */
  getProviderInfo() {
    return {
      providerName: this.providerName,
      isConfigured: this.isConfigured,
      collectionId: this.collectionId,
      statusMessage: this.isConfigured
        ? 'AWS Rekognition Biometric Provider Active'
        : 'AWS Rekognition provider pending activation. Biometric references stored securely in private S3.',
    };
  }
}

module.exports = new FaceBiometricProvider();
