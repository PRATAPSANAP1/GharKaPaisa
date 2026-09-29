const { RekognitionClient, CompareFacesCommand, DetectLabelsCommand } = require('@aws-sdk/client-rekognition');
const logger = require('../../config/logger');

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'gharkapaisa-production-storage';
const ENVIRONMENT_MATCH_THRESHOLD = parseInt(process.env.ENVIRONMENT_MATCH_THRESHOLD || '80', 10);

class EnvironmentMatchProvider {
  constructor() {
    this.providerName = 'AWS_REKOGNITION_SCENE_MATCH';
    this.region = process.env.AWS_REGION || 'ap-south-1';
    this.threshold = ENVIRONMENT_MATCH_THRESHOLD;

    const hasCreds = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
    const isExplicitlyEnabled = process.env.AWS_REKOGNITION_ENVIRONMENT_ENABLED === 'true';

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
   * Compare live camera scene against approved office environment references (BKG1-BKG4)
   * @param {Buffer} liveImageBuffer 
   * @param {Array} activeEnvironmentReferences 
   */
  async compareScene(liveImageBuffer, activeEnvironmentReferences = []) {
    if (!this.isConfigured || !this.rekognitionClient) {
      logger.info('[ENVIRONMENT PROVIDER] Office environment verification provider not configured — failing closed');
      return {
        matched: false,
        matchStatus: 'ENVIRONMENT_PROVIDER_NOT_CONFIGURED',
        matchedCode: null,
        similarity: 0,
        threshold: this.threshold,
        providerName: this.providerName,
      };
    }

    if (!activeEnvironmentReferences || activeEnvironmentReferences.length === 0) {
      return {
        matched: false,
        matchStatus: 'NO_ACTIVE_ENVIRONMENT_REFERENCES',
        matchedCode: null,
        similarity: 0,
        threshold: this.threshold,
        providerName: this.providerName,
      };
    }

    try {
      let bestMatch = null;
      let highestScore = 0;

      for (const ref of activeEnvironmentReferences) {
        if (!ref.s3_key) continue;

        try {
          const command = new CompareFacesCommand({
            SourceImage: { Bytes: liveImageBuffer },
            TargetImage: {
              S3Object: {
                Bucket: BUCKET_NAME,
                Name: ref.s3_key,
              },
            },
            SimilarityThreshold: this.threshold,
          });

          const response = await this.rekognitionClient.send(command);
          const faceMatches = response.FaceMatches || [];

          if (faceMatches.length > 0) {
            const similarity = Number(faceMatches[0].Similarity || 0);
            if (similarity > highestScore) {
              highestScore = similarity;
              bestMatch = ref.reference_code;
            }
          }
        } catch (subErr) {
          logger.warn(`Scene comparison against ${ref.reference_code} failed:`, subErr.message);
        }
      }

      const isMatched = highestScore >= this.threshold && !!bestMatch;

      return {
        matched: isMatched,
        matchStatus: isMatched ? 'ENVIRONMENT_MATCHED' : 'ENVIRONMENT_MISMATCH',
        matchedCode: isMatched ? bestMatch : null,
        similarity: highestScore,
        threshold: this.threshold,
        providerName: this.providerName,
      };
    } catch (err) {
      logger.error('[ENVIRONMENT PROVIDER] Scene matching error:', err.message);
      return {
        matched: false,
        matchStatus: 'ENVIRONMENT_PROVIDER_ERROR',
        matchedCode: null,
        similarity: 0,
        threshold: this.threshold,
        providerName: this.providerName,
        error: err.message,
      };
    }
  }
}

module.exports = new EnvironmentMatchProvider();
