const { query } = require('../../config/database');
const logger = require('../../config/logger');

/**
 * Attendance Rate Limiter & Circuit Breaker Service
 * 
 * Prevents brute-force attacks and manages AWS Rekognition API costs
 * by implementing per-employee rate limits and circuit breakers.
 */
class AttendanceRateLimiterService {
  constructor() {
    this.defaultWindowMinutes = 15;
    this.defaultMaxAttempts = 5;
    this.dailyMaxAttempts = 20;
    this.blockDurationMinutes = 30;
  }

  /**
   * Check if employee is allowed to attempt verification
   */
  async checkRateLimit(employeeId) {
    try {
      // Get or create rate limit record
      const { rows: [rateLimit] } = await query(
        `SELECT * FROM attendance_rate_limits 
         WHERE employee_id = $1 
         FOR UPDATE`,
        [employeeId]
      );

      if (!rateLimit) {
        // Create new rate limit record
        await query(
          `INSERT INTO attendance_rate_limits 
           (employee_id, rate_limit_window_minutes, max_attempts_per_window, window_start_at, last_attempt_at)
           VALUES ($1, $2, $3, NOW(), NOW())`,
          [employeeId, this.defaultWindowMinutes, this.defaultMaxAttempts]
        );
        return {
          allowed: true,
          attemptsRemaining: this.defaultMaxAttempts - 1,
          windowResetAt: new Date(Date.now() + this.defaultWindowMinutes * 60 * 1000),
        };
      }

      // Check if currently blocked
      if (rateLimit.is_blocked && rateLimit.blocked_until && new Date(rateLimit.blocked_until) > new Date()) {
        const blockRemaining = Math.ceil((new Date(rateLimit.blocked_until) - new Date()) / 1000 / 60);
        logger.warn(`[RATE LIMITER] Employee ${employeeId} is blocked for ${blockRemaining} more minutes`);
        return {
          allowed: false,
          reason: 'BLOCKED',
          blockedUntil: rateLimit.blocked_until,
          blockRemainingMinutes: blockRemaining,
          blockReason: rateLimit.block_reason,
        };
      }

      // Check daily limit
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      if (rateLimit.total_attempts_today >= this.dailyMaxAttempts) {
        logger.warn(`[RATE LIMITER] Employee ${employeeId} exceeded daily limit`);
        await this.blockEmployee(employeeId, 'DAILY_LIMIT_EXCEEDED', 60); // Block for 1 hour
        return {
          allowed: false,
          reason: 'DAILY_LIMIT_EXCEEDED',
          dailyLimit: this.dailyMaxAttempts,
        };
      }

      // Check window limit
      const windowStart = new Date(rateLimit.window_start_at);
      const windowEnd = new Date(windowStart.getTime() + rateLimit.rate_limit_window_minutes * 60 * 1000);
      const now = new Date();

      if (now >= windowEnd) {
        // Window expired, reset counter
        await query(
          `UPDATE attendance_rate_limits 
           SET current_attempt_count = 1, 
               window_start_at = NOW(), 
               last_attempt_at = NOW(),
               updated_at = NOW()
           WHERE employee_id = $1`,
          [employeeId]
        );
        return {
          allowed: true,
          attemptsRemaining: rateLimit.max_attempts_per_window - 1,
          windowResetAt: new Date(Date.now() + rateLimit.rate_limit_window_minutes * 60 * 1000),
        };
      }

      // Check if within window limit
      if (rateLimit.current_attempt_count >= rateLimit.max_attempts_per_window) {
        const windowRemaining = Math.ceil((windowEnd - now) / 1000 / 60);
        logger.warn(`[RATE LIMITER] Employee ${employeeId} exceeded window limit`);
        await this.blockEmployee(employeeId, 'WINDOW_LIMIT_EXCEEDED', this.blockDurationMinutes);
        return {
          allowed: false,
          reason: 'WINDOW_LIMIT_EXCEEDED',
          windowResetAt: windowEnd,
          windowRemainingMinutes: windowRemaining,
        };
      }

      // Increment attempt counter
      await query(
        `UPDATE attendance_rate_limits 
         SET current_attempt_count = current_attempt_count + 1,
             total_attempts_today = total_attempts_today + 1,
             last_attempt_at = NOW(),
             updated_at = NOW()
         WHERE employee_id = $1`,
        [employeeId]
      );

      return {
        allowed: true,
        attemptsRemaining: rateLimit.max_attempts_per_window - rateLimit.current_attempt_count - 1,
        windowResetAt: windowEnd,
      };
    } catch (err) {
      logger.error('[RATE LIMITER] Failed to check rate limit:', err.message);
      // Fail open - allow attempt if rate limiter fails
      return { allowed: true, reason: 'RATE_LIMITER_ERROR' };
    }
  }

  /**
   * Block an employee from attempting verification
   */
  async blockEmployee(employeeId, reason, durationMinutes = this.blockDurationMinutes) {
    try {
      const blockedUntil = new Date(Date.now() + durationMinutes * 60 * 1000);
      
      await query(
        `UPDATE attendance_rate_limits 
         SET is_blocked = true,
             blocked_until = $1,
             block_reason = $2,
             updated_at = NOW()
         WHERE employee_id = $3`,
        [blockedUntil, reason, employeeId]
      );

      logger.info(`[RATE LIMITER] Blocked employee ${employeeId} for ${durationMinutes} minutes: ${reason}`);
    } catch (err) {
      logger.error('[RATE LIMITER] Failed to block employee:', err.message);
    }
  }

  /**
   * Unblock an employee
   */
  async unblockEmployee(employeeId) {
    try {
      await query(
        `UPDATE attendance_rate_limits 
         SET is_blocked = false,
             blocked_until = NULL,
             block_reason = NULL,
             current_attempt_count = 0,
             window_start_at = NOW(),
             updated_at = NOW()
         WHERE employee_id = $1`,
        [employeeId]
      );

      logger.info(`[RATE LIMITER] Unblocked employee ${employeeId}`);
    } catch (err) {
      logger.error('[RATE LIMITER] Failed to unblock employee:', err.message);
    }
  }

  /**
   * Reset daily counter (scheduled job)
   */
  async resetDailyCounters() {
    try {
      const result = await query(
        `UPDATE attendance_rate_limits 
         SET total_attempts_today = 0,
             current_attempt_count = 0,
             window_start_at = NOW(),
             is_blocked = false,
             blocked_until = NULL,
             block_reason = NULL,
             updated_at = NOW()
         WHERE total_attempts_today > 0`
      );

      logger.info(`[RATE LIMITER] Reset daily counters for ${result.rowCount} employees`);
      return result.rowCount;
    } catch (err) {
      logger.error('[RATE LIMITER] Failed to reset daily counters:', err.message);
      return 0;
    }
  }

  /**
   * Get rate limit status for an employee
   */
  async getRateLimitStatus(employeeId) {
    try {
      const { rows: [rateLimit] } = await query(
        `SELECT * FROM attendance_rate_limits 
         WHERE employee_id = $1`,
        [employeeId]
      );

      if (!rateLimit) {
        return {
          status: 'NO_RECORD',
          windowAttempts: 0,
          dailyAttempts: 0,
          isBlocked: false,
        };
      }

      const windowStart = new Date(rateLimit.window_start_at);
      const windowEnd = new Date(windowStart.getTime() + rateLimit.rate_limit_window_minutes * 60 * 1000);
      const now = new Date();

      return {
        status: 'ACTIVE',
        windowAttempts: rateLimit.current_attempt_count,
        windowMax: rateLimit.max_attempts_per_window,
        windowResetAt: windowEnd,
        dailyAttempts: rateLimit.total_attempts_today,
        dailyMax: this.dailyMaxAttempts,
        isBlocked: rateLimit.is_blocked,
        blockedUntil: rateLimit.blocked_until,
        blockReason: rateLimit.block_reason,
        lastAttemptAt: rateLimit.last_attempt_at,
      };
    } catch (err) {
      logger.error('[RATE LIMITER] Failed to get rate limit status:', err.message);
      return null;
    }
  }

  /**
   * Circuit breaker for AWS Rekognition API calls
   */
  circuitBreaker = {
    isOpen: false,
    failureCount: 0,
    failureThreshold: 5,
    recoveryTimeout: 60000, // 1 minute
    lastFailureTime: null,

    async execute(apiCall) {
      if (this.isOpen) {
        const timeSinceLastFailure = Date.now() - this.lastFailureTime;
        if (timeSinceLastFailure < this.recoveryTimeout) {
          logger.warn('[CIRCUIT BREAKER] Circuit is open, blocking API call');
          throw new Error('CIRCUIT_BREAKER_OPEN');
        } else {
          // Attempt recovery
          this.isOpen = false;
          this.failureCount = 0;
          logger.info('[CIRCUIT BREAKER] Circuit attempting recovery');
        }
      }

      try {
        const result = await apiCall();
        // Success - reset failure count
        this.failureCount = 0;
        return result;
      } catch (err) {
        this.failureCount++;
        this.lastFailureTime = Date.now();

        if (this.failureCount >= this.failureThreshold) {
          this.isOpen = true;
          logger.error(`[CIRCUIT BREAKER] Circuit opened after ${this.failureCount} failures`);
        }

        throw err;
      }
    },

    reset() {
      this.isOpen = false;
      this.failureCount = 0;
      this.lastFailureTime = null;
      logger.info('[CIRCUIT BREAKER] Circuit manually reset');
    },
  };
}

module.exports = new AttendanceRateLimiterService();
