const { RekognitionClient, CompareFacesCommand } = require('@aws-sdk/client-rekognition');
const logger = require('../../config/logger');

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'gharkapaisa-production-storage';
const FACE_MATCH_THRESHOLD = parseInt(process.env.FACE_MATCH_THRESHOLD || '90', 10);

class FaceMatchProvider {
  constructor() {
    this.providerName = 'AWS_REKOGNITION_FACEMATCH';
    this.region = process.env.AWS_REGION || 'ap-south-1';
    this.threshold = FACE_MATCH_THRESHOLD;

    const hasCreds = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
    const isExplicitlyEnabled = process.env.AWS_REKOGNITION_FACEMATCH_ENABLED === 'true';

    this.isConfigured = hasCreds && isExplicitlyEnabled;

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
   * Compare live face capture image buffer against active employee reference S3 key
   */
  async compareFace(liveImageBuffer, referenceS3Key) {
    if (!this.isConfigured || !this.rekognitionClient) {
      logger.info('[FACE MATCH PROVIDER] AWS Rekognition FaceMatch provider not configured — failing closed');
      return {
        matched: false,
        matchStatus: 'FACE_PROVIDER_NOT_CONFIGURED',
        similarity: 0,
        threshold: this.threshold,
        providerName: this.providerName,
      };
    }

    if (!liveImageBuffer || !Buffer.isBuffer(liveImageBuffer) || !referenceS3Key) {
      return {
        matched: false,
        matchStatus: 'FACE_INVALID_INPUT',
        similarity: 0,
        threshold: this.threshold,
        providerName: this.providerName,
      };
    }

    try {
      const command = new CompareFacesCommand({
        SourceImage: {
          Bytes: liveImageBuffer,
        },
        TargetImage: {
          S3Object: {
            Bucket: BUCKET_NAME,
            Name: referenceS3Key,
          },
        },
        SimilarityThreshold: this.threshold,
      });

      const response = await this.rekognitionClient.send(command);

      const faceMatches = response.FaceMatches || [];
      if (faceMatches.length === 0) {
        return {
          matched: false,
          matchStatus: 'FACE_MISMATCH',
          similarity: 0,
          threshold: this.threshold,
          providerName: this.providerName,
        };
      }

      const topMatch = faceMatches[0];
      const similarity = Number(topMatch.Similarity || 0);
      const isMatched = similarity >= this.threshold;

      return {
        matched: isMatched,
        matchStatus: isMatched ? 'FACE_MATCHED' : 'FACE_MISMATCH',
        similarity,
        threshold: this.threshold,
        providerName: this.providerName,
      };
    } catch (err) {
      logger.error('[FACE MATCH PROVIDER] AWS Rekognition CompareFaces failed:', err.message);
      return {
        matched: false,
        matchStatus: 'FACE_PROVIDER_ERROR',
        similarity: 0,
        threshold: this.threshold,
        providerName: this.providerName,
        error: err.message,
      };
    }
  }
}

module.exports = new FaceMatchProvider();
