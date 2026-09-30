const { query } = require('../../config/database');
const bcrypt = require('bcryptjs');
const logger = require('../../config/logger');

/**
 * Twin Detection & PIN Fallback Service
 * 
 * Addresses false positive KYC matches for twins or lookalikes:
 * - Enforces minimum similarity threshold (95%)
 * - Requires PIN entry when similarity is borderline (85-95%)
 * - Logs twin suspicion for manual review
 */
class TwinDetectionService {
  constructor() {
    this.highSimilarityThreshold = 95; // % - No PIN required
    this.mediumSimilarityThreshold = 85; // % - PIN required
    this.lowSimilarityThreshold = 70; // % - Reject outright
  }

  /**
   * Check if twin detection is required based on similarity score
   */
  async checkTwinDetection(similarityScore, employeeId, verificationSessionId) {
    if (similarityScore >= this.highSimilarityThreshold) {
      // High similarity - no PIN required
      return {
        pinRequired: false,
        twinSuspected: false,
        reason: 'HIGH_SIMILARITY',
      };
    }

    if (similarityScore >= this.mediumSimilarityThreshold) {
      // Medium similarity - PIN required
      await this.logTwinSuspicion(employeeId, verificationSessionId, similarityScore, 'MEDIUM_SIMILARITY');
      
      return {
        pinRequired: true,
        twinSuspected: true,
        reason: 'MEDIUM_SIMILARITY',
        userFeedback: 'Face similarity is borderline. Please enter your PIN to confirm identity.',
      };
    }

    // Low similarity - reject outright
    await this.logTwinSuspicion(employeeId, verificationSessionId, similarityScore, 'LOW_SIMILARITY');
    
    return {
      pinRequired: false,
      twinSuspected: true,
      reason: 'LOW_SIMILARITY',
      userFeedback: 'Face verification failed. Please ensure you are the registered employee.',
      shouldReject: true,
    };
  }

  /**
   * Verify employee PIN
   */
  async verifyPin(employeeId, pin, pinMethod = 'APP_PIN') {
    try {
      const { rows: [pinRecord] } = await query(
        `SELECT id, pin_hash, pin_method, is_active, expires_at 
         FROM employee_attendance_pins 
         WHERE employee_id = $1 AND is_active = true 
         LIMIT 1`,
        [employeeId]
      );

      if (!pinRecord) {
        return {
          valid: false,
          reason: 'PIN_NOT_SET',
          userFeedback: 'No PIN is set for your account. Please contact HR.',
        };
      }

      if (!pinRecord.is_active) {
        return {
          valid: false,
          reason: 'PIN_INACTIVE',
          userFeedback: 'Your PIN is inactive. Please contact HR.',
        };
      }

      if (pinRecord.expires_at && new Date(pinRecord.expires_at) < new Date()) {
        return {
          valid: false,
          reason: 'PIN_EXPIRED',
          userFeedback: 'Your PIN has expired. Please set a new PIN.',
        };
      }

      // Verify PIN hash
      const isValid = await bcrypt.compare(pin, pinRecord.pin_hash);

      if (!isValid) {
        return {
          valid: false,
          reason: 'PIN_INVALID',
          userFeedback: 'Invalid PIN. Please try again.',
        };
      }

      // Update last used timestamp
      await query(
        `UPDATE employee_attendance_pins 
         SET last_used_at = NOW() 
         WHERE id = $1`,
        [pinRecord.id]
      );

      return {
        valid: true,
        pinMethod: pinRecord.pin_method,
      };
    } catch (err) {
      logger.error('[TWIN DETECTION] PIN verification failed:', err.message);
      return {
        valid: false,
        reason: 'VERIFICATION_ERROR',
        userFeedback: 'PIN verification failed. Please try again.',
      };
    }
  }

  /**
   * Set employee PIN
   */
  async setPin(employeeId, pin, pinMethod = 'APP_PIN', expiresAt = null) {
    try {
      // Validate PIN strength
      if (!this.validatePinStrength(pin)) {
        return {
          success: false,
          reason: 'PIN_TOO_WEAK',
          userFeedback: 'PIN must be at least 6 digits',
        };
      }

      // Hash PIN
      const pinHash = await bcrypt.hash(pin, 10);

      // Deactivate existing PINs
      await query(
        `UPDATE employee_attendance_pins 
         SET is_active = false 
         WHERE employee_id = $1`,
        [employeeId]
      );

      // Insert new PIN
      const { rows: [newPin] } = await query(
        `INSERT INTO employee_attendance_pins 
         (employee_id, pin_hash, pin_method, is_active, expires_at, created_at)
         VALUES ($1, $2, $3, true, $4, NOW())
         RETURNING *`,
        [employeeId, pinHash, pinMethod, expiresAt]
      );

      logger.info(`[TWIN DETECTION] PIN set for employee ${employeeId}`);

      return {
        success: true,
        pinId: newPin.id,
      };
    } catch (err) {
      logger.error('[TWIN DETECTION] Failed to set PIN:', err.message);
      return {
        success: false,
        reason: 'SET_PIN_ERROR',
      };
    }
  }

  /**
   * Log twin suspicion for manual review
   */
  async logTwinSuspicion(employeeId, verificationSessionId, similarityScore, reason) {
    try {
      await query(
        `UPDATE employee_attendance 
         SET twin_suspected = true, 
             twin_verification_required = true 
         WHERE employee_id = $1 
           AND attendance_date = CURRENT_DATE`,
        [employeeId]
      );

      logger.warn(`[TWIN DETECTION] Twin suspicion logged for employee ${employeeId}, similarity: ${similarityScore}%, reason: ${reason}`);
    } catch (err) {
      logger.error('[TWIN DETECTION] Failed to log twin suspicion:', err.message);
    }
  }

  /**
   * Clear twin suspicion after manual review
   */
  async clearTwinSuspicion(employeeId, clearedBy) {
    try {
      await query(
        `UPDATE employee_attendance 
         SET twin_suspected = false, 
             twin_verification_required = false 
         WHERE employee_id = $1 
           AND attendance_date = CURRENT_DATE`,
        [employeeId]
      );

      logger.info(`[TWIN DETECTION] Twin suspicion cleared for employee ${employeeId} by ${clearedBy}`);

      return {
        success: true,
      };
    } catch (err) {
      logger.error('[TWIN DETECTION] Failed to clear twin suspicion:', err.message);
      return {
        success: false,
      };
    }
  }

  /**
   * Validate PIN strength
   */
  validatePinStrength(pin) {
    // Must be at least 6 digits
    if (!pin || pin.length < 6) {
      return false;
    }

    // Must be numeric
    if (!/^\d+$/.test(pin)) {
      return false;
    }

    // Must not be all same digits
    if (/^(\d)\1+$/.test(pin)) {
      return false;
    }

    // Must not be sequential
    const sequentialPatterns = ['012345', '123456', '234567', '345678', '456789', '567890', '987654', '876543', '765432', '654321', '543210'];
    if (sequentialPatterns.includes(pin)) {
      return false;
    }

    return true;
  }

  /**
   * Get employees with twin suspicions for review
   */
  async getTwinSuspiciousEmployees(limit = 50) {
    try {
      const { rows: employees } = await query(
        `SELECT 
           e.id, e.employee_id, e.full_name, e.email_id, e.mobile_number,
           a.attendance_date, a.similarity_score, a.pin_verified,
           a.twin_suspected, a.twin_verification_required
         FROM employees e
         JOIN employee_attendance a ON e.id = a.employee_id
         WHERE a.twin_suspected = true
           AND a.attendance_date >= CURRENT_DATE - INTERVAL '30 days'
         ORDER BY a.attendance_date DESC, a.similarity_score ASC
         LIMIT $1`,
        [limit]
      );

      return employees;
    } catch (err) {
      logger.error('[TWIN DETECTION] Failed to get twin suspicious employees:', err.message);
      return [];
    }
  }

  /**
   * Generate OTP for SMS/Email verification
   */
  async generateOTP(employeeId, method = 'SMS_OTP') {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // In production, this would send SMS/Email
    // For now, we'll just log it
    logger.info(`[TWIN DETECTION] Generated OTP for employee ${employeeId}: ${otp} (method: ${method})`);

    return {
      otp,
      expiresAt,
      method,
    };
  }

  /**
   * Verify OTP
   */
  async verifyOTP(employeeId, otp, expectedOTP, expiresAt) {
    if (new Date() > new Date(expiresAt)) {
      return {
        valid: false,
        reason: 'OTP_EXPIRED',
        userFeedback: 'OTP has expired. Please request a new one.',
      };
    }

    if (otp !== expectedOTP) {
      return {
        valid: false,
        reason: 'OTP_INVALID',
        userFeedback: 'Invalid OTP. Please try again.',
      };
    }

    return {
      valid: true,
    };
  }
}

module.exports = new TwinDetectionService();
