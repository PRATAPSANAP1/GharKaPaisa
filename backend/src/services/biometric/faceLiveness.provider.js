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
          ...(process.env.AWS_SESSION_TOKEN ? { sessionToken: process.env.AWS_SESSION_TOKEN } : {}),
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
      let attempts = 0;
      const maxAttempts = 10;
      let response = null;
      let status = null;

      while (attempts < maxAttempts) {
        attempts++;
        const command = new GetFaceLivenessSessionResultsCommand({
          SessionId: providerSessionId,
        });

        response = await this.rekognitionClient.send(command);
        status = response.Status; // EXPIRED, FAILED, SUCCEEDED, CREATED, IN_PROGRESS

        logger.info(`[LIVENESS PROVIDER] Liveness poll attempt ${attempts}/${maxAttempts}: SessionId=${providerSessionId}, Status=${status}, Confidence=${response.Confidence}, HasRefImage=${!!response?.ReferenceImage?.Bytes}`);

        if (status !== 'IN_PROGRESS' && status !== 'CREATED') {
          break;
        }

        // Wait 500ms before polling again while Rekognition scores video frames
        if (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      const confidence = Number(response?.Confidence || 0);

      // If still IN_PROGRESS or CREATED after polling, return LIVENESS_PROCESSING without failing closed as permanent failure
      if (status === 'IN_PROGRESS' || status === 'CREATED') {
        logger.warn(`[LIVENESS PROVIDER] Liveness session ${providerSessionId} still processing after ${attempts} poll attempts`, {
          SessionId: providerSessionId,
          Status: status,
          Confidence: confidence,
        });
        return {
          status: 'LIVENESS_PROCESSING',
          isLive: false,
          confidence,
          statusRaw: status,
          referenceImageBuffer: null,
          providerName: this.providerName,
        };
      }

      // Configure liveness confidence threshold (defaults to 70.0% for mobile attendance check-ins, overridable via ENV)
      const defaultThreshold = 70.0;
      const parsedThreshold = process.env.AWS_LIVENESS_CONFIDENCE_THRESHOLD
        ? parseFloat(process.env.AWS_LIVENESS_CONFIDENCE_THRESHOLD)
        : defaultThreshold;
      const confidenceThreshold = Number.isFinite(parsedThreshold) && parsedThreshold >= 0 && parsedThreshold <= 100
        ? parsedThreshold
        : defaultThreshold;

      // In AWS Rekognition semantics:
      // status === 'SUCCEEDED' means the evaluation job completed without technical errors.
      // isLive is true ONLY when the evaluation completed AND the confidence meets the anti-spoofing threshold.
      const awsEvaluationCompleted = (status === 'SUCCEEDED');
      const isLive = awsEvaluationCompleted && (confidence >= confidenceThreshold);

      let decisionReason;
      if (status === 'IN_PROGRESS' || status === 'CREATED') {
        decisionReason = 'EVALUATION_IN_PROGRESS';
      } else if (status === 'EXPIRED') {
        decisionReason = 'SESSION_EXPIRED';
      } else if (status === 'FAILED') {
        decisionReason = 'AWS_EVALUATION_FAILED';
      } else if (status === 'SUCCEEDED') {
        decisionReason = isLive ? 'LIVENESS_CONFIRMED' : 'CONFIDENCE_BELOW_THRESHOLD';
      } else {
        decisionReason = `AWS_${status}`;
      }

      let referenceImageBuffer = null;
      if (status === 'SUCCEEDED' && response?.ReferenceImage?.Bytes) {
        referenceImageBuffer = Buffer.from(response.ReferenceImage.Bytes);
      }

      logger.info(`[LIVENESS PROVIDER] Terminal AWS evaluation: SessionId=${providerSessionId}, Status=${status}, Confidence=${confidence}, Threshold=${confidenceThreshold}, Decision=${decisionReason}, isLive=${isLive}`);

      return {
        status: status === 'SUCCEEDED' ? (isLive ? 'LIVENESS_PASSED' : 'LIVENESS_FAILED') : `LIVENESS_${status}`,
        isLive,
        confidence,
        confidenceThreshold,
        awsEvaluationStatus: status,
        awsEvaluationCompleted,
        decisionReason,
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
          ...(process.env.AWS_SESSION_TOKEN ? { sessionToken: process.env.AWS_SESSION_TOKEN } : {}),
        };
      }

      const stsClient = new STSClient(clientOptions);

      // Attempt to retrieve active credentials from the provider chain
      let currentCreds = null;
      try {
        if (typeof stsClient.config.credentials === 'function') {
          currentCreds = await stsClient.config.credentials();
        }
      } catch (e) {
        // Provider chain could not be resolved directly
      }

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
      }

      // If current credentials already contain a session token or start with ASIA,
      // they are already temporary session credentials (e.g. from EC2 instance metadata, ECS task role, or AWS_SESSION_TOKEN).
      // AWS STS strictly prohibits calling GetSessionToken with session credentials.
      const hasSessionToken = !!(
        process.env.AWS_SESSION_TOKEN ||
        currentCreds?.sessionToken ||
        currentCreds?.accessKeyId?.startsWith('ASIA') ||
        process.env.AWS_ACCESS_KEY_ID?.startsWith('ASIA')
      );

      if (hasSessionToken) {
        const accessKeyId = currentCreds?.accessKeyId || process.env.AWS_ACCESS_KEY_ID;
        const secretAccessKey = currentCreds?.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY;
        const sessionToken = currentCreds?.sessionToken || process.env.AWS_SESSION_TOKEN;
        const expiration = currentCreds?.expiration || new Date(Date.now() + 900 * 1000).toISOString();

        if (accessKeyId && secretAccessKey) {
          logger.info('[LIVENESS PROVIDER] Using existing session credentials for liveness streaming', {
            verificationSessionId: sessionId,
            expiration,
            credentialProviderInvoked: true,
          });

          return {
            accessKeyId,
            secretAccessKey,
            sessionToken,
            expiration,
          };
        }
      }

      // Fallback to GetSessionToken for long-term IAM user credentials (AKIA...)
      try {
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
      } catch (gstErr) {
        // If GetSessionToken fails because session credentials were used or not allowed, fallback gracefully to current credentials
        if (
          gstErr.message?.includes('Cannot call GetSessionToken with session credentials') ||
          gstErr.name === 'AccessDenied' ||
          gstErr.Code === 'AccessDenied'
        ) {
          const fallbackAccessKey = currentCreds?.accessKeyId || process.env.AWS_ACCESS_KEY_ID;
          const fallbackSecretKey = currentCreds?.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY;
          const fallbackToken = currentCreds?.sessionToken || process.env.AWS_SESSION_TOKEN;

          if (fallbackAccessKey && fallbackSecretKey) {
            logger.warn('[LIVENESS PROVIDER] GetSessionToken rejected session credentials, using current credentials for streaming', {
              message: gstErr.message,
            });
            return {
              accessKeyId: fallbackAccessKey,
              secretAccessKey: fallbackSecretKey,
              sessionToken: fallbackToken,
              expiration: currentCreds?.expiration || new Date(Date.now() + 900 * 1000).toISOString(),
            };
          }
        }
        throw gstErr;
      }
    } catch (err) {
      logger.error('[LIVENESS PROVIDER] Failed to issue temporary STS credentials', {
        name: err.name,
        code: err.Code || err.code || err.name,
        message: err.message,
        httpStatusCode: err.$metadata?.httpStatusCode,
        requestId: err.$metadata?.requestId,
      });
      return null;
    }
  }
}

module.exports = new FaceLivenessProvider();
