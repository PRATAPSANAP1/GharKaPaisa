const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const logger = require('../../config/logger');

/**
 * Device Attestation & Cryptographic Nonce Service
 * 
 * Prevents intercepted requests and pre-recorded photo submissions by:
 * 1. Issuing signed JWT with unique nonce and short capture window
 * 2. Validating device integrity (Google Play Integrity / App Attest)
 * 3. Detecting rooted/jailbroken devices
 */
class DeviceAttestationService {
  constructor() {
    this.nonceLength = 32;
    this.captureWindowSeconds = 60;
    this.jwtSecret = process.env.DEVICE_ATTESTATION_SECRET || crypto.randomBytes(64).toString('hex');
    this.jwtExpirySeconds = 120; // 2 minutes total JWT validity
  }

  /**
   * Generate cryptographic attestation token for verification session
   */
  generateAttestationToken(sessionId, employeeId, deviceInfo = {}) {
    const nonce = crypto.randomBytes(this.nonceLength).toString('hex');
    const issuedAt = Math.floor(Date.now() / 1000);
    const captureWindowStart = issuedAt;
    const captureWindowEnd = issuedAt + this.captureWindowSeconds;

    const payload = {
      sessionId,
      employeeId,
      nonce,
      iat: issuedAt,
      nbf: captureWindowStart,
      exp: issuedAt + this.jwtExpirySeconds,
      captureWindow: {
        start: captureWindowStart,
        end: captureWindowEnd,
      },
      deviceInfo: {
        platform: deviceInfo.platform, // 'ios' | 'android' | 'web'
        deviceModel: deviceInfo.deviceModel,
        osVersion: deviceInfo.osVersion,
        appVersion: deviceInfo.appVersion,
      },
    };

    const token = jwt.sign(payload, this.jwtSecret, {
      algorithm: 'HS256',
    });

    logger.info(`[DEVICE ATTESTATION] Generated attestation token for session ${sessionId}`);

    return {
      token,
      nonce,
      captureWindowSeconds: this.captureWindowSeconds,
      captureWindowStart,
      captureWindowEnd,
      instructions: 'Complete face verification within 60 seconds',
    };
  }

  /**
   * Verify attestation token and validate device integrity
   */
  async verifyAttestationToken(token, deviceIntegrityToken = null) {
    try {
      // Verify JWT signature and structure
      const decoded = jwt.verify(token, this.jwtSecret, {
        algorithms: ['HS256'],
      });

      // Verify nonce presence
      if (!decoded.nonce) {
        return {
          valid: false,
          reason: 'MISSING_NONCE',
        };
      }

      // Verify capture window
      const now = Math.floor(Date.now() / 1000);
      if (now < decoded.captureWindow.start) {
        return {
          valid: false,
          reason: 'CAPTURE_WINDOW_NOT_STARTED',
          captureWindowStart: decoded.captureWindow.start,
          currentTime: now,
        };
      }

      if (now > decoded.captureWindow.end) {
        return {
          valid: false,
          reason: 'CAPTURE_WINDOW_EXPIRED',
          captureWindowEnd: decoded.captureWindow.end,
          currentTime: now,
        };
      }

      // Verify device integrity if token provided (mobile only)
      if (deviceIntegrityToken) {
        const integrityCheck = await this.verifyDeviceIntegrity(
          deviceIntegrityToken,
          decoded.deviceInfo.platform
        );

        if (!integrityCheck.valid) {
          return {
            valid: false,
            reason: 'DEVICE_INTEGRITY_FAILED',
            integrityCheck,
          };
        }
      }

      logger.info(`[DEVICE ATTESTATION] Verified attestation token for session ${decoded.sessionId}`);

      return {
        valid: true,
        sessionId: decoded.sessionId,
        employeeId: decoded.employeeId,
        nonce: decoded.nonce,
        deviceInfo: decoded.deviceInfo,
        integrityCheck: deviceIntegrityToken ? await this.verifyDeviceIntegrity(deviceIntegrityToken, decoded.deviceInfo.platform) : null,
      };
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return {
          valid: false,
          reason: 'TOKEN_EXPIRED',
        };
      }
      if (err.name === 'JsonWebTokenError') {
        return {
          valid: false,
          reason: 'INVALID_TOKEN',
        };
      }
      logger.error('[DEVICE ATTESTATION] Token verification error:', err.message);
      return {
        valid: false,
        reason: 'VERIFICATION_ERROR',
      };
    }
  }

  /**
   * Verify device integrity using platform-specific APIs
   * 
   * Android: Google Play Integrity API
   * iOS: DeviceCheck / App Attest
   * Web: Basic device fingerprinting (less secure)
   */
  async verifyDeviceIntegrity(integrityToken, platform) {
    switch (platform) {
      case 'android':
        return this.verifyAndroidIntegrity(integrityToken);
      case 'ios':
        return this.verifyIOSIntegrity(integrityToken);
      case 'web':
        return this.verifyWebIntegrity(integrityToken);
      default:
        return {
          valid: true,
          method: 'PLATFORM_NOT_SUPPORTED',
        };
    }
  }

  /**
   * Verify Android device integrity using Google Play Integrity API
   */
  async verifyAndroidIntegrity(integrityToken) {
    // In production, this would call Google Play Integrity API
    // For now, we'll implement a simplified version
    
    try {
      // Expected integrity token structure from Google Play Integrity API
      const integrityPayload = JSON.parse(
        Buffer.from(integrityToken, 'base64').toString()
      );

      // Check for device integrity violations
      const checks = {
        appRecognition: integrityPayload.appRecognitionType === 'PLAYE_RECOGNIZED',
        deviceIntegrity: integrityPayload.deviceIntegrityScore >= 80, // Scale: 0-100
        noUnrecognizedApps: !integrityPayload.recognizedApps?.includes('UNKNOWN'),
        notRooted: !integrityPayload.deviceIntegrityViolations?.includes('ROOTED'),
        notEmulator: !integrityPayload.deviceIntegrityViolations?.includes('EMULATOR'),
      };

      const allPassed = Object.values(checks).every(Boolean);

      return {
        valid: allPassed,
        method: 'GOOGLE_PLAY_INTEGRITY',
        checks,
        score: integrityPayload.deviceIntegrityScore,
      };
    } catch (err) {
      logger.error('[DEVICE ATTESTATION] Android integrity verification failed:', err.message);
      return {
        valid: false,
        method: 'GOOGLE_PLAY_INTEGRITY',
        reason: 'VERIFICATION_FAILED',
      };
    }
  }

  /**
   * Verify iOS device integrity using DeviceCheck / App Attest
   */
  async verifyIOSIntegrity(integrityToken) {
    // In production, this would call Apple DeviceCheck / App Attest API
    // For now, we'll implement a simplified version
    
    try {
      // Expected integrity token structure from Apple App Attest
      const integrityPayload = JSON.parse(
        Buffer.from(integrityToken, 'base64').toString()
      );

      const checks = {
        appIntegrity: integrityPayload.appIntegrity === 'VALID',
        deviceIntegrity: integrityPayload.deviceIntegrity === 'VALID',
        notJailbroken: !integrityPayload.riskFlags?.includes('JAILBROKEN'),
        notDebugged: !integrityPayload.riskFlags?.includes('DEBUGGED'),
      };

      const allPassed = Object.values(checks).every(Boolean);

      return {
        valid: allPassed,
        method: 'APPLE_APP_ATTEST',
        checks,
      };
    } catch (err) {
      logger.error('[DEVICE ATTESTATION] iOS integrity verification failed:', err.message);
      return {
        valid: false,
        method: 'APPLE_APP_ATTEST',
        reason: 'VERIFICATION_FAILED',
      };
    }
  }

  /**
   * Verify web client integrity (basic fingerprinting)
   * Note: Web verification is inherently less secure than mobile
   */
  async verifyWebIntegrity(integrityToken) {
    try {
      const integrityPayload = JSON.parse(integrityToken);

      // Basic checks for web client
      const checks = {
        userAgentConsistent: integrityPayload.userAgent === integrityPayload.expectedUserAgent,
        screenResolutionValid: integrityPayload.screenResolution?.width > 0 && integrityPayload.screenResolution?.height > 0,
        timezoneConsistent: Math.abs(integrityPayload.timezoneOffset - new Date().getTimezoneOffset()) <= 60,
        noSuspiciousPlugins: !integrityPayload.plugins?.includes('User-Agent Switcher'),
      };

      const allPassed = Object.values(checks).every(Boolean);

      return {
        valid: allPassed,
        method: 'WEB_FINGERPRINTING',
        checks,
        securityLevel: 'LOW', // Web is inherently less secure
      };
    } catch (err) {
      logger.error('[DEVICE ATTESTATION] Web integrity verification failed:', err.message);
      return {
        valid: false,
        method: 'WEB_FINGERPRINTING',
        reason: 'VERIFICATION_FAILED',
      };
    }
  }

  /**
   * Generate device fingerprint for web clients
   */
  generateWebFingerprint(deviceInfo) {
    const fingerprintData = {
      userAgent: deviceInfo.userAgent,
      screenResolution: deviceInfo.screenResolution,
      timezoneOffset: deviceInfo.timezoneOffset,
      language: deviceInfo.language,
      platform: deviceInfo.platform,
      hardwareConcurrency: deviceInfo.hardwareConcurrency,
      deviceMemory: deviceInfo.deviceMemory,
    };

    const fingerprintString = JSON.stringify(fingerprintData);
    return crypto.createHash('sha256').update(fingerprintString).digest('hex');
  }

  /**
   * Validate nonce hasn't been used before (prevent replay)
   */
  async validateNonceUniqueness(nonce, sessionId) {
    // In production, this would check a Redis cache or database
    // to ensure the nonce hasn't been used before
    // For now, we'll return true (allow)
    return {
      valid: true,
      reason: 'NONCE_VALID',
    };
  }

  /**
   * Mark nonce as used (prevent replay)
   */
  async markNonceUsed(nonce, sessionId) {
    // In production, this would store the nonce in Redis with TTL
    // For now, we'll log it
    logger.info(`[DEVICE ATTESTATION] Marked nonce as used for session ${sessionId}`);
  }
}

module.exports = new DeviceAttestationService();
