const crypto = require('crypto');
const { query } = require('../../config/database');
const logger = require('../../config/logger');

/**
 * Challenge-Response Service for Anti-Replay Protection
 * 
 * Generates dynamic challenges (head turn, smile, blink, random gesture)
 * that must be completed during verification to prevent replay attacks.
 */
class ChallengeResponseService {
  constructor() {
    this.challengeTypes = [
      'HEAD_TURN_LEFT',
      'HEAD_TURN_RIGHT',
      'SMILE',
      'BLINK',
      'RANDOM_GESTURE',
    ];
    this.challengeValiditySeconds = 300; // 5 minutes
  }

  /**
   * Generate a new challenge for a verification session
   */
  async generateChallenge(sessionId) {
    try {
      // Generate random challenge token
      const challengeToken = crypto.randomBytes(32).toString('hex');
      
      // Select random challenge type
      const challengeType = this.challengeTypes[Math.floor(Math.random() * this.challengeTypes.length)];

      // Update session with challenge
      await query(
        `UPDATE attendance_verification_sessions 
         SET challenge_token = $1, 
             challenge_type = $2, 
             updated_at = NOW() 
         WHERE id = $3`,
        [challengeToken, challengeType, sessionId]
      );

      logger.info(`[CHALLENGE RESPONSE] Generated ${challengeType} challenge for session ${sessionId}`);

      return {
        success: true,
        challengeToken,
        challengeType,
        expiresInSeconds: this.challengeValiditySeconds,
        instructions: this.getChallengeInstructions(challengeType),
      };
    } catch (err) {
      logger.error('[CHALLENGE RESPONSE] Failed to generate challenge:', err.message);
      throw err;
    }
  }

  /**
   * Verify that the challenge was completed
   */
  async verifyChallenge(sessionId, challengeToken, challengeCompletedAt) {
    try {
      const { rows: [session] } = await query(
        `SELECT id, challenge_token, challenge_type, challenge_completed_at, expires_at, status
         FROM attendance_verification_sessions 
         WHERE id = $1 LIMIT 1`,
        [sessionId]
      );

      if (!session) {
        return {
          success: false,
          reason: 'SESSION_NOT_FOUND',
        };
      }

      // Check if challenge was already generated
      if (!session.challenge_token) {
        return {
          success: false,
          reason: 'NO_CHALLENGE_GENERATED',
        };
      }

      // Verify challenge token matches
      if (session.challenge_token !== challengeToken) {
        logger.warn(`[CHALLENGE RESPONSE] Token mismatch for session ${sessionId}`);
        await query(
          `UPDATE attendance_verification_sessions 
           SET status = 'FAILED', failure_reason = 'CHALLENGE_TOKEN_MISMATCH', updated_at = NOW() 
           WHERE id = $1`,
          [sessionId]
        );
        return {
          success: false,
          reason: 'TOKEN_MISMATCH',
        };
      }

      // Check if challenge already completed
      if (session.challenge_completed_at) {
        return {
          success: false,
          reason: 'CHALLENGE_ALREADY_COMPLETED',
        };
      }

      // Verify session hasn't expired
      if (new Date(session.expires_at) < new Date()) {
        return {
          success: false,
          reason: 'SESSION_EXPIRED',
        };
      }

      // Mark challenge as completed
      await query(
        `UPDATE attendance_verification_sessions 
         SET challenge_completed_at = $1, updated_at = NOW() 
         WHERE id = $2`,
        [challengeCompletedAt || new Date(), sessionId]
      );

      logger.info(`[CHALLENGE RESPONSE] Challenge verified for session ${sessionId}`);

      return {
        success: true,
        challengeType: session.challenge_type,
      };
    } catch (err) {
      logger.error('[CHALLENGE RESPONSE] Failed to verify challenge:', err.message);
      throw err;
    }
  }

  /**
   * Get human-readable instructions for a challenge type
   */
  getChallengeInstructions(challengeType) {
    const instructions = {
      'HEAD_TURN_LEFT': 'Please turn your head slightly to the left',
      'HEAD_TURN_RIGHT': 'Please turn your head slightly to the right',
      'SMILE': 'Please smile naturally',
      'BLINK': 'Please blink both eyes',
      'RANDOM_GESTURE': 'Please follow the on-screen gesture instruction',
    };

    return instructions[challengeType] || 'Please follow the verification instructions';
  }

  /**
   * Validate challenge timestamp to prevent replay
   */
  async validateChallengeTimestamp(sessionId, clientTimestamp) {
    try {
      const { rows: [session] } = await query(
        `SELECT challenge_completed_at, expires_at 
         FROM attendance_verification_sessions 
         WHERE id = $1 LIMIT 1`,
        [sessionId]
      );

      if (!session) {
        return { valid: false, reason: 'SESSION_NOT_FOUND' };
      }

      // Ensure timestamp is within reasonable window (±30 seconds)
      const serverTime = new Date();
      const clientTime = new Date(clientTimestamp);
      const timeDiff = Math.abs(serverTime - clientTime);

      if (timeDiff > 30000) { // 30 seconds
        logger.warn(`[CHALLENGE RESPONSE] Timestamp too far off: ${timeDiff}ms`);
        return {
          valid: false,
          reason: 'TIMESTAMP_OUT_OF_SYNC',
          serverTime: serverTime.toISOString(),
          clientTime: clientTime.toISOString(),
          diff: timeDiff,
        };
      }

      return { valid: true };
    } catch (err) {
      logger.error('[CHALLENGE RESPONSE] Failed to validate timestamp:', err.message);
      throw err;
    }
  }

  /**
   * Cryptographically sign challenge data for integrity
   */
  signChallenge(challengeToken, timestamp) {
    const secret = process.env.CHALLENGE_SIGNING_SECRET || 'default-secret-change-in-production';
    const data = `${challengeToken}:${timestamp}`;
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  /**
   * Verify challenge signature
   */
  verifyChallengeSignature(challengeToken, timestamp, signature) {
    const expectedSignature = this.signChallenge(challengeToken, timestamp);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }
}

module.exports = new ChallengeResponseService();
