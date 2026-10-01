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
        region: this.region,
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

      let referenceImageBuffer = null;
      if (status === 'SUCCEEDED' && response.ReferenceImage?.Bytes) {
        referenceImageBuffer = Buffer.from(response.ReferenceImage.Bytes);
      }

      return {
        status: status === 'SUCCEEDED' ? (isLive ? 'LIVENESS_PASSED' : 'LIVENESS_FAILED') : `LIVENESS_${status}`,
        isLive,
        confidence,
        statusRaw: status,
        referenceImageBuffer,
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

  /**
   * Generate short-lived temporary AWS credentials for browser-side FaceLivenessDetectorCore
   */
  async getTemporaryCredentials({ sessionId }) {
    if (!this.isConfigured) {
      return null;
    }

    try {
      let STSClient, GetSessionTokenCommand, AssumeRoleCommand;
      try {
        ({ STSClient, GetSessionTokenCommand, AssumeRoleCommand } = require('@aws-sdk/client-sts'));
      } catch (err) {
        logger.error('[LIVENESS PROVIDER] @aws-sdk/client-sts package not available:', err.message);
        return null;
      }

      const clientOptions = { region: this.region };
      if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        clientOptions.credentials = {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        };
      }

      const stsClient = new STSClient(clientOptions);

      // If an IAM role ARN for liveness streaming is configured, use AssumeRole
      if (process.env.AWS_LIVENESS_ROLE_ARN) {
        const command = new AssumeRoleCommand({
          RoleArn: process.env.AWS_LIVENESS_ROLE_ARN,
          RoleSessionName: `LivenessSession-${(sessionId || 'anon').substring(0, 8)}`,
          DurationSeconds: 900, // 15 mins (minimum for STS AssumeRole)
          Policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: 'rekognition:StartFaceLivenessSession',
                Resource: '*',
              },
            ],
          }),
        });

        const res = await stsClient.send(command);
        const creds = res.Credentials;

        logger.info('[LIVENESS PROVIDER] Issued temporary AWS credentials via AssumeRole', {
          verificationSessionId: sessionId,
          expiration: creds?.Expiration,
          credentialProviderInvoked: true,
        });

        return {
          accessKeyId: creds.AccessKeyId,
          secretAccessKey: creds.SecretAccessKey,
          sessionToken: creds.SessionToken,
          expiration: creds.Expiration,
        };
      } else {
        // Fallback to GetSessionToken for IAM user credentials
        const command = new GetSessionTokenCommand({
          DurationSeconds: 900,
        });

        const res = await stsClient.send(command);
        const creds = res.Credentials;

        logger.info('[LIVENESS PROVIDER] Issued temporary AWS credentials via GetSessionToken', {
          verificationSessionId: sessionId,
          expiration: creds?.Expiration,
          credentialProviderInvoked: true,
        });

        return {
          accessKeyId: creds.AccessKeyId,
          secretAccessKey: creds.SecretAccessKey,
          sessionToken: creds.SessionToken,
          expiration: creds.Expiration,
        };
      }
    } catch (err) {
      logger.error('[LIVENESS PROVIDER] Failed to issue temporary STS credentials:', err.message);
      return null;
    }
  }
}

module.exports = new FaceLivenessProvider();
