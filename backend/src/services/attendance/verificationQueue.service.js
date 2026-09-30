const { query, getClient } = require('../../config/database');
const logger = require('../../config/logger');

/**
 * @deprecated UNUSED EXPERIMENTAL QUEUE
 * Final V1 architecture uses synchronous biometric verification (Liveness -> KYC Face Match -> PostgreSQL).
 * Do NOT enable or mount in production.
 */
class VerificationQueueService {
  constructor() {
    this.queuePollInterval = 5000; // 5 seconds
    this.maxConcurrentProcessing = 5;
    this.isProcessing = false;
  }

  /**
   * Add verification request to queue
   */
  async enqueueVerification(sessionId, employeeId, priority = 5) {
    try {
      const { rows: [queued] } = await query(
        `INSERT INTO attendance_verification_queue 
         (verification_session_id, employee_id, queue_status, priority, created_at)
         VALUES ($1, $2, 'PENDING', $3, NOW())
         RETURNING id, created_at`,
        [sessionId, employeeId, priority]
      );

      logger.info(`[VERIFICATION QUEUE] Enqueued session ${sessionId} with priority ${priority}`);

      return {
        success: true,
        queueId: queued.id,
        queuedAt: queued.created_at,
        position: await this.getQueuePosition(queued.id),
      };
    } catch (err) {
      logger.error('[VERIFICATION QUEUE] Failed to enqueue verification:', err.message);
      throw err;
    }
  }

  /**
   * Process queued verification requests
   */
  async processQueue() {
    if (this.isProcessing) {
      logger.debug('[VERIFICATION QUEUE] Already processing queue');
      return;
    }

    this.isProcessing = true;

    try {
      // Get pending items ordered by priority and creation time
      const { rows: pendingItems } = await query(
        `SELECT id, verification_session_id, employee_id, retry_count, max_retries
         FROM attendance_verification_queue
         WHERE queue_status = 'PENDING'
           AND (timeout_at IS NULL OR timeout_at > NOW())
         ORDER BY priority ASC, created_at ASC
         LIMIT $1
         FOR UPDATE SKIP LOCKED`,
        [this.maxConcurrentProcessing]
      );

      if (pendingItems.length === 0) {
        logger.debug('[VERIFICATION QUEUE] No pending items to process');
        return;
      }

      logger.info(`[VERIFICATION QUEUE] Processing ${pendingItems.length} queued items`);

      // Process each item
      for (const item of pendingItems) {
        await this.processQueueItem(item);
      }
    } catch (err) {
      logger.error('[VERIFICATION QUEUE] Error processing queue:', err.message);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process individual queue item
   */
  async processQueueItem(item) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Mark as processing
      await client.query(
        `UPDATE attendance_verification_queue 
         SET queue_status = 'PROCESSING', 
             processing_started_at = NOW(),
             updated_at = NOW()
         WHERE id = $1`,
        [item.id]
      );

      // TODO: Call the actual verification logic here
      // This would integrate with the enhanced verification service
      // For now, we'll simulate processing

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mark as completed
      await client.query(
        `UPDATE attendance_verification_queue 
         SET queue_status = 'COMPLETED', 
             processing_completed_at = NOW(),
             updated_at = NOW()
         WHERE id = $1`,
        [item.id]
      );

      await client.query('COMMIT');

      logger.info(`[VERIFICATION QUEUE] Completed queue item ${item.id}`);
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});

      // Handle failure with retry logic
      const newRetryCount = item.retry_count + 1;
      
      if (newRetryCount >= item.max_retries) {
        await query(
          `UPDATE attendance_verification_queue 
           SET queue_status = 'FAILED', 
               error_message = $1,
               updated_at = NOW()
           WHERE id = $2`,
          [err.message, item.id]
        );
        logger.error(`[VERIFICATION QUEUE] Queue item ${item.id} failed after ${newRetryCount} retries`);
      } else {
        await query(
          `UPDATE attendance_verification_queue 
           SET queue_status = 'PENDING', 
               retry_count = $1,
               updated_at = NOW()
           WHERE id = $2`,
          [newRetryCount, item.id]
        );
        logger.warn(`[VERIFICATION QUEUE] Queue item ${item.id} failed, retry ${newRetryCount}/${item.max_retries}`);
      }
    } finally {
      client.release();
    }
  }

  /**
   * Get queue position for an item
   */
  async getQueuePosition(queueId) {
    try {
      const { rows: [result] } = await query(
        `SELECT COUNT(*)::INT AS position
         FROM attendance_verification_queue
         WHERE queue_status = 'PENDING'
           AND id < $1`,
        [queueId]
      );
      return result.position + 1;
    } catch (err) {
      logger.error('[VERIFICATION QUEUE] Failed to get queue position:', err.message);
      return -1;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    try {
      const { rows: [stats] } = await query(
        `SELECT 
           COUNT(*) FILTER (WHERE queue_status = 'PENDING')::INT AS pending_count,
           COUNT(*) FILTER (WHERE queue_status = 'PROCESSING')::INT AS processing_count,
           COUNT(*) FILTER (WHERE queue_status = 'COMPLETED')::INT AS completed_count,
           COUNT(*) FILTER (WHERE queue_status = 'FAILED')::INT AS failed_count,
           COUNT(*) FILTER (WHERE queue_status = 'TIMEOUT')::INT AS timeout_count,
           AVG(EXTRACT(EPOCH FROM (processing_completed_at - processing_started_at)))::INT AS avg_processing_time_seconds
         FROM attendance_verification_queue
         WHERE created_at > NOW() - INTERVAL '1 hour'`
      );

      return stats;
    } catch (err) {
      logger.error('[VERIFICATION QUEUE] Failed to get queue stats:', err.message);
      return null;
    }
  }

  /**
   * Start queue processor (for background processing)
   */
  startQueueProcessor() {
    logger.info('[VERIFICATION QUEUE] Starting queue processor');
    
    this.queueProcessorInterval = setInterval(() => {
      this.processQueue();
    }, this.queuePollInterval);
  }

  /**
   * Stop queue processor
   */
  stopQueueProcessor() {
    if (this.queueProcessorInterval) {
      clearInterval(this.queueProcessorInterval);
      logger.info('[VERIFICATION QUEUE] Stopped queue processor');
    }
  }

  /**
   * Cleanup old completed/failed queue items
   */
  async cleanupOldItems(daysToKeep = 7) {
    try {
      const result = await query(
        `DELETE FROM attendance_verification_queue
         WHERE queue_status IN ('COMPLETED', 'FAILED', 'TIMEOUT')
           AND updated_at < NOW() - INTERVAL '${daysToKeep} days'`
      );

      logger.info(`[VERIFICATION QUEUE] Cleaned up ${result.rowCount} old queue items`);
      return result.rowCount;
    } catch (err) {
      logger.error('[VERIFICATION QUEUE] Failed to cleanup old items:', err.message);
      return 0;
    }
  }

  /**
   * Get employee's queue status
   */
  async getEmployeeQueueStatus(employeeId) {
    try {
      const { rows: [status] } = await query(
        `SELECT 
           COUNT(*) FILTER (WHERE queue_status = 'PENDING')::INT AS pending_count,
           COUNT(*) FILTER (WHERE queue_status = 'PROCESSING')::INT AS processing_count,
           MAX(created_at) AS last_queued_at
         FROM attendance_verification_queue
         WHERE employee_id = $1
           AND created_at > NOW() - INTERVAL '1 hour'`,
        [employeeId]
      );

      return status;
    } catch (err) {
      logger.error('[VERIFICATION QUEUE] Failed to get employee queue status:', err.message);
      return null;
    }
  }
}

module.exports = new VerificationQueueService();
