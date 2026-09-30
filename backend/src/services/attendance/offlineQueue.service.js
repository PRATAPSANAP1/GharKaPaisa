const crypto = require('crypto');
const { query } = require('../../config/database');
const logger = require('../../config/logger');

/**
 * Offline Queue Service for AWS Rekognition Outages
 * 
 * Graceful fallback during service outages:
 * - Store timestamped, tamper-proof snapshots locally
 * - Queue attendance records for sync when services recover
 * - Validate offline records before syncing
 */
class OfflineQueueService {
  constructor() {
    this.offlineModeThreshold = 3; // After 3 consecutive failures, enable offline mode
    this.maxOfflineRecords = 100; // Maximum records to store offline
    this.syncRetryInterval = 30000; // 30 seconds between sync attempts
  }

  /**
   * Check if offline mode should be enabled
   */
  async checkOfflineModeStatus() {
    try {
      // Check consecutive AWS Rekognition failures
      // In production, this would check a Redis counter or database
      const failureCount = await this.getRecentFailureCount();
      
      if (failureCount >= this.offlineModeThreshold) {
        logger.warn(`[OFFLINE QUEUE] Offline mode enabled due to ${failureCount} consecutive failures`);
        return {
          enabled: true,
          reason: 'HIGH_FAILURE_RATE',
          failureCount,
        };
      }

      return {
        enabled: false,
        failureCount,
      };
    } catch (err) {
      logger.error('[OFFLINE QUEUE] Failed to check offline mode status:', err.message);
      return {
        enabled: false,
        reason: 'CHECK_ERROR',
      };
    }
  }

  /**
   * Queue attendance record for offline storage
   */
  async queueOfflineAttendance(record, imageBuffer, deviceContext) {
    try {
      // Generate tamper-proof hash
      const imageHash = crypto.createHash('sha256').update(imageBuffer).digest('hex');
      const deviceNonce = crypto.randomBytes(32).toString('hex');
      
      // Create device signature
      const signatureData = {
        employeeId: record.employeeId,
        attendanceDate: record.attendanceDate,
        checkInTime: record.checkInTime,
        imageHash,
        deviceNonce,
        timestamp: Date.now(),
      };
      
      const deviceSignature = crypto
        .createHmac('sha256', process.env.OFFLINE_QUEUE_SECRET || 'default-secret')
        .update(JSON.stringify(signatureData))
        .digest('hex');

      // Check if offline queue is full
      const queueCount = await this.getOfflineQueueCount();
      if (queueCount >= this.maxOfflineRecords) {
        return {
          success: false,
          reason: 'QUEUE_FULL',
          userFeedback: 'Offline queue is full. Please try again later.',
        };
      }

      // Store image (in production, upload to S3 with offline prefix)
      const imagePath = await this.storeOfflineImage(imageBuffer, imageHash);

      // Insert into offline queue
      const { rows: [queued] } = await query(
        `INSERT INTO attendance_offline_queue 
         (employee_id, attendance_date, check_in_time, check_out_time, 
          captured_image_hash, captured_image_path, device_nonce, device_signature,
          location_latitude, location_longitude, location_accuracy, mock_location_detected,
          sync_status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'PENDING', NOW())
         RETURNING *`,
        [
          record.employeeId,
          record.attendanceDate,
          record.checkInTime,
          record.checkOutTime || null,
          imageHash,
          imagePath,
          deviceNonce,
          deviceSignature,
          deviceContext.latitude || null,
          deviceContext.longitude || null,
          deviceContext.accuracy || null,
          deviceContext.mockLocationDetected || false,
        ]
      );

      logger.info(`[OFFLINE QUEUE] Queued offline attendance for employee ${record.employeeId}`);

      return {
        success: true,
        queueId: queued.id,
        message: 'Attendance queued for sync when services recover',
      };
    } catch (err) {
      logger.error('[OFFLINE QUEUE] Failed to queue offline attendance:', err.message);
      return {
        success: false,
        reason: 'QUEUE_ERROR',
      };
    }
  }

  /**
   * Store offline image (placeholder - in production, upload to S3)
   */
  async storeOfflineImage(imageBuffer, imageHash) {
    // In production, upload to S3 with prefix 'offline/'
    // For now, return a placeholder path
    return `offline/${imageHash}.jpg`;
  }

  /**
   * Sync offline attendance records to cloud
   */
  async syncOfflineRecords() {
    try {
      // Get pending records
      const { rows: pendingRecords } = await query(
        `SELECT * FROM attendance_offline_queue 
         WHERE sync_status = 'PENDING' 
         ORDER BY created_at ASC 
         LIMIT 10`
      );

      if (pendingRecords.length === 0) {
        logger.debug('[OFFLINE QUEUE] No pending records to sync');
        return {
          synced: 0,
          failed: 0,
        };
      }

      logger.info(`[OFFLINE QUEUE] Syncing ${pendingRecords.length} offline records`);

      let syncedCount = 0;
      let failedCount = 0;

      for (const record of pendingRecords) {
        try {
          // Verify device signature
          const signatureValid = await this.verifyDeviceSignature(record);
          
          if (!signatureValid) {
            await this.markSyncFailed(record.id, 'SIGNATURE_INVALID');
            failedCount++;
            continue;
          }

          // Verify mock location flag
          if (record.mock_location_detected) {
            await this.markSyncFailed(record.id, 'MOCK_LOCATION_DETECTED');
            failedCount++;
            continue;
          }

          // Sync to main attendance table
          await this.syncToAttendanceTable(record);
          
          // Mark as synced
          await this.markSynced(record.id);
          syncedCount++;
          
          logger.info(`[OFFLINE QUEUE] Synced record ${record.id} for employee ${record.employee_id}`);
        } catch (err) {
          logger.error(`[OFFLINE QUEUE] Failed to sync record ${record.id}:`, err.message);
          await this.markSyncFailed(record.id, err.message);
          failedCount++;
        }
      }

      logger.info(`[OFFLINE QUEUE] Sync complete: ${syncedCount} synced, ${failedCount} failed`);

      return {
        synced: syncedCount,
        failed: failedCount,
      };
    } catch (err) {
      logger.error('[OFFLINE QUEUE] Sync failed:', err.message);
      throw err;
    }
  }

  /**
   * Verify device signature
   */
  async verifyDeviceSignature(record) {
    try {
      const signatureData = {
        employeeId: record.employee_id,
        attendanceDate: record.attendance_date,
        checkInTime: record.check_in_time,
        imageHash: record.captured_image_hash,
        deviceNonce: record.device_nonce,
        timestamp: new Date(record.created_at).getTime(),
      };

      const expectedSignature = crypto
        .createHmac('sha256', process.env.OFFLINE_QUEUE_SECRET || 'default-secret')
        .update(JSON.stringify(signatureData))
        .digest('hex');

      return record.device_signature === expectedSignature;
    } catch (err) {
      logger.error('[OFFLINE QUEUE] Signature verification failed:', err.message);
      return false;
    }
  }

  /**
   * Sync record to main attendance table
   */
  async syncToAttendanceTable(record) {
    const client = await query('getClient');
    try {
      await client.query('BEGIN');

      // Check if attendance already exists
      const { rows: [existing] } = await client.query(
        `SELECT id FROM employee_attendance 
         WHERE employee_id = $1 AND attendance_date = $2 
         FOR UPDATE`,
        [record.employee_id, record.attendance_date]
      );

      if (existing) {
        // Update existing record
        await client.query(
          `UPDATE employee_attendance 
           SET check_in_time = $1, 
               check_out_time = $2, 
               updated_at = NOW() 
           WHERE id = $3`,
          [record.check_in_time, record.check_out_time, existing.id]
        );
      } else {
        // Insert new record
        await client.query(
          `INSERT INTO employee_attendance 
           (employee_id, attendance_date, check_in_time, check_out_time, status, verification_status, source, created_at, updated_at)
           VALUES ($1, $2, $3, $4, 'PRESENT', 'OFFLINE_SYNCED', 'OFFLINE', NOW(), NOW())`,
          [record.employee_id, record.attendance_date, record.check_in_time, record.check_out_time]
        );
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Mark record as synced
   */
  async markSynced(queueId) {
    await query(
      `UPDATE attendance_offline_queue 
       SET sync_status = 'SYNCED', 
           synced_at = NOW(), 
           updated_at = NOW() 
       WHERE id = $1`,
      [queueId]
    );
  }

  /**
   * Mark record as failed
   */
  async markSyncFailed(queueId, errorMessage) {
    await query(
      `UPDATE attendance_offline_queue 
       SET sync_status = 'FAILED', 
           sync_attempts = sync_attempts + 1,
           sync_error = $1, 
           updated_at = NOW() 
       WHERE id = $2`,
      [errorMessage, queueId]
    );
  }

  /**
   * Get offline queue count
   */
  async getOfflineQueueCount() {
    const { rows: [count] } = await query(
      `SELECT COUNT(*)::INT AS count 
       FROM attendance_offline_queue 
       WHERE sync_status = 'PENDING'`
    );
    return count.count;
  }

  /**
   * Get recent failure count
   */
  async getRecentFailureCount() {
    // In production, this would check a Redis counter
    // For now, return 0
    return 0;
  }

  /**
   * Get offline queue statistics
   */
  async getOfflineQueueStats() {
    try {
      const { rows: [stats] } = await query(
        `SELECT 
           COUNT(*) FILTER (WHERE sync_status = 'PENDING')::INT AS pending_count,
           COUNT(*) FILTER (WHERE sync_status = 'SYNCING')::INT AS syncing_count,
           COUNT(*) FILTER (WHERE sync_status = 'SYNCED')::INT AS synced_count,
           COUNT(*) FILTER (WHERE sync_status = 'FAILED')::INT AS failed_count,
           COUNT(*) FILTER (WHERE mock_location_detected = true)::INT AS mock_location_count,
           MAX(created_at) AS oldest_pending_at
         FROM attendance_offline_queue
         WHERE created_at > NOW() - INTERVAL '7 days'`
      );

      return stats;
    } catch (err) {
      logger.error('[OFFLINE QUEUE] Failed to get stats:', err.message);
      return null;
    }
  }

  /**
   * Clean up old synced records
   */
  async cleanupOldRecords(daysToKeep = 30) {
    try {
      const result = await query(
        `DELETE FROM attendance_offline_queue
         WHERE sync_status IN ('SYNCED', 'FAILED')
           AND created_at < NOW() - INTERVAL '${daysToKeep} days'`
      );

      logger.info(`[OFFLINE QUEUE] Cleaned up ${result.rowCount} old records`);
      return result.rowCount;
    } catch (err) {
      logger.error('[OFFLINE QUEUE] Failed to cleanup old records:', err.message);
      return 0;
    }
  }
}

module.exports = new OfflineQueueService();
