let RekognitionClient, CreateFaceLivenessSessionCommand, GetFaceLivenessSessionResultsCommand;
try {
  ({ RekognitionClient, CreateFaceLivenessSessionCommand, GetFaceLivenessSessionResultsCommand } = require('@aws-sdk/client-rekognition'));
} catch (e) {
  // @aws-sdk/client-rekognition package not available or not yet installed
}
const logger = require('../../config/logger');

class FaceLivenessProvider {
  constructor() {
    this.providerName = 'AWS_REKOGNITION_LIVENESS';
    this.region = process.env.AWS_REGION || 'ap-south-1';

    const isExplicitlyDisabled = process.env.AWS_REKOGNITION_LIVENESS_ENABLED === 'false';

    this.isConfigured = !!(RekognitionClient && !isExplicitlyDisabled);

    if (this.isConfigured) {
      const clientOptions = { region: this.region };
      if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        clientOptions.credentials = {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        };
      }
      this.rekognitionClient = new RekognitionClient(clientOptions);
    } else {
      this.rekognitionClient = null;
    }
  }

  /**
   * Create backend-controlled AWS Rekognition Face Liveness Session
   */
  async createLivenessSession({ employeeId, sessionId }) {
    if (!this.isConfigured || !this.rekognitionClient) {
      logger.info('[LIVENESS PROVIDER] AWS Rekognition Liveness provider not configured — failing closed');
      return {
        status: 'PROVIDER_NOT_CONFIGURED',
        providerName: this.providerName,
        sessionId: null,
        message: 'Liveness provider is not configured in production environment',
      };
    }

    try {
      const command = new CreateFaceLivenessSessionCommand({
        ClientRequestToken: sessionId,
        Settings: {
          AuditImagesLimit: 1,
        },
      });

      const response = await this.rekognitionClient.send(command);

      return {
        status: 'SESSION_CREATED',
        providerName: this.providerName,
        sessionId: response.SessionId,
      };
    } catch (err) {
      logger.error('[LIVENESS PROVIDER] AWS Rekognition session creation failed:', err.message);
      return {
        status: 'LIVENESS_PROVIDER_ERROR',
        providerName: this.providerName,
        sessionId: null,
        error: err.message,
      };
    }
  }

  /**
   * Validate and retrieve liveness results from AWS Rekognition
   */
  async getLivenessSessionResult(providerSessionId) {
    if (!this.isConfigured || !this.rekognitionClient) {
      return {
        status: 'LIVENESS_PROVIDER_NOT_CONFIGURED',
        isLive: false,
        confidence: 0,
        providerName: this.providerName,
      };
    }

    if (!providerSessionId) {
      return {
        status: 'LIVENESS_SESSION_INVALID',
        isLive: false,
        confidence: 0,
        providerName: this.providerName,
      };
    }

    try {
      const command = new GetFaceLivenessSessionResultsCommand({
        SessionId: providerSessionId,
      });

      const response = await this.rekognitionClient.send(command);

      const status = response.Status; // EXPIRED, FAILED, SUCCEEDED, CREATED, IN_PROGRESS
      const confidence = Number(response.Confidence || 0);
      const isLive = status === 'SUCCEEDED' && confidence >= 85.0;

      return {
        status: status === 'SUCCEEDED' ? (isLive ? 'LIVENESS_PASSED' : 'LIVENESS_FAILED') : `LIVENESS_${status}`,
        isLive,
        confidence,
        statusRaw: status,
        providerName: this.providerName,
      };
    } catch (err) {
      logger.error('[LIVENESS PROVIDER] AWS Rekognition liveness validation error:', err.message);
      return {
        status: 'LIVENESS_PROVIDER_ERROR',
        isLive: false,
        confidence: 0,
        providerName: this.providerName,
        error: err.message,
      };
    }
  }
}

module.exports = new FaceLivenessProvider();
