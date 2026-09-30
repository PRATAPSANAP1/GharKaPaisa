const { query } = require('../../config/database');
const logger = require('../../config/logger');
const { logAction } = require('../admin/audit.service');

/**
 * Admin Service for Bulk Environment Reference Management
 * 
 * Handles bulk updates during office renovations, desk shifts, or seasonal changes.
 * Provides approval workflow for new environment references.
 */
class EnvironmentReferenceAdminService {
  /**
   * Bulk upload new environment references
   */
  async bulkUploadEnvironmentReferences(references, reqUser) {
    const client = await query('getClient');
    
    try {
      await client.query('BEGIN');

      const uploadedReferences = [];
      const failedReferences = [];

      for (const ref of references) {
        try {
          const { rows: [uploaded] } = await client.query(
            `INSERT INTO attendance_environment_references 
             (reference_code, reference_name, s3_bucket, s3_key, image_hash, 
              environment_status, provider, capture_description, created_at)
             VALUES ($1, $2, $3, $4, $5, 'PENDING_APPROVAL', $6, $7, NOW())
             RETURNING *`,
            [
              ref.reference_code,
              ref.reference_name,
              ref.s3_bucket,
              ref.s3_key,
              ref.image_hash,
              ref.provider || 'LOCAL_S3',
              ref.capture_description,
            ]
          );

          uploadedReferences.push(uploaded);

          await logAction(reqUser, 'ENVIRONMENT_REFERENCE_UPLOADED', null, {
            reference_code: ref.reference_code,
            reference_name: ref.reference_name,
          });
        } catch (err) {
          failedReferences.push({
            reference_code: ref.reference_code,
            error: err.message,
          });
          logger.error(`[ENV REF ADMIN] Failed to upload reference ${ref.reference_code}:`, err.message);
        }
      }

      await client.query('COMMIT');

      logger.info(`[ENV REF ADMIN] Bulk upload completed: ${uploadedReferences.length} successful, ${failedReferences.length} failed`);

      return {
        success: true,
        uploadedCount: uploadedReferences.length,
        failedCount: failedReferences.length,
        uploadedReferences,
        failedReferences,
      };
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      logger.error('[ENV REF ADMIN] Bulk upload failed:', err.message);
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Approve pending environment references
   */
  async approveEnvironmentReferences(referenceCodes, reqUser) {
    try {
      const { rows: approved } = await query(
        `UPDATE attendance_environment_references 
         SET environment_status = 'ACTIVE', 
             updated_at = NOW()
         WHERE reference_code = ANY($1)
           AND environment_status = 'PENDING_APPROVAL'
         RETURNING *`,
        [referenceCodes]
      );

      for (const ref of approved) {
        await logAction(reqUser, 'ENVIRONMENT_REFERENCE_APPROVED', null, {
          reference_code: ref.reference_code,
          reference_name: ref.reference_name,
        });
      }

      logger.info(`[ENV REF ADMIN] Approved ${approved.length} environment references`);

      return {
        success: true,
        approvedCount: approved.length,
        approvedReferences: approved,
      };
    } catch (err) {
      logger.error('[ENV REF ADMIN] Failed to approve references:', err.message);
      throw err;
    }
  }

  /**
   * Revoke existing environment references
   */
  async revokeEnvironmentReferences(referenceCodes, reqUser, reason = '') {
    try {
      const { rows: revoked } = await query(
        `UPDATE attendance_environment_references 
         SET environment_status = 'REVOKED', 
             fallback_reason = $1,
             updated_at = NOW()
         WHERE reference_code = ANY($1)
           AND environment_status = 'ACTIVE'
         RETURNING *`,
        [reason, referenceCodes]
      );

      for (const ref of revoked) {
        await logAction(reqUser, 'ENVIRONMENT_REFERENCE_REVOKED', null, {
          reference_code: ref.reference_code,
          reference_name: ref.reference_name,
          reason,
        });
      }

      logger.info(`[ENV REF ADMIN] Revoked ${revoked.length} environment references`);

      return {
        success: true,
        revokedCount: revoked.length,
        revokedReferences: revoked,
      };
    } catch (err) {
      logger.error('[ENV REF ADMIN] Failed to revoke references:', err.message);
      throw err;
    }
  }

  /**
   * Swap environment references (atomic operation for office changes)
   */
  async swapEnvironmentReferences(revokeCodes, activateCodes, reqUser, reason = '') {
    const client = await query('getClient');
    
    try {
      await client.query('BEGIN');

      // Revoke old references
      const { rows: revoked } = await client.query(
        `UPDATE attendance_environment_references 
         SET environment_status = 'REVOKED', 
             fallback_reason = $1,
             updated_at = NOW()
         WHERE reference_code = ANY($1)
           AND environment_status = 'ACTIVE'
         RETURNING *`,
        [reason, revokeCodes]
      );

      // Activate new references
      const { rows: activated } = await client.query(
        `UPDATE attendance_environment_references 
         SET environment_status = 'ACTIVE', 
             updated_at = NOW()
         WHERE reference_code = ANY($1)
           AND environment_status IN ('PENDING_APPROVAL', 'REVOKED')
         RETURNING *`,
        [activateCodes]
      );

      await client.query('COMMIT');

      for (const ref of revoked) {
        await logAction(reqUser, 'ENVIRONMENT_REFERENCE_REVOKED', null, {
          reference_code: ref.reference_code,
          reference_name: ref.reference_name,
          reason,
        });
      }

      for (const ref of activated) {
        await logAction(reqUser, 'ENVIRONMENT_REFERENCE_ACTIVATED', null, {
          reference_code: ref.reference_code,
          reference_name: ref.reference_name,
        });
      }

      logger.info(`[ENV REF ADMIN] Swapped environment references: ${revoked.length} revoked, ${activated.length} activated`);

      return {
        success: true,
        revokedCount: revoked.length,
        activatedCount: activated.length,
        revokedReferences: revoked,
        activatedReferences: activated,
      };
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      logger.error('[ENV REF ADMIN] Failed to swap references:', err.message);
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Get all environment references with status
   */
  async getAllEnvironmentReferences() {
    try {
      const { rows: references } = await query(
        `SELECT * FROM attendance_environment_references 
         ORDER BY 
           CASE environment_status
             WHEN 'ACTIVE' THEN 1
             WHEN 'PENDING_APPROVAL' THEN 2
             WHEN 'REVOKED' THEN 3
             ELSE 4
           END,
           created_at DESC`
      );

      return references;
    } catch (err) {
      logger.error('[ENV REF ADMIN] Failed to fetch references:', err.message);
      throw err;
    }
  }

  /**
   * Get pending approval references
   */
  async getPendingReferences() {
    try {
      const { rows: references } = await query(
        `SELECT * FROM attendance_environment_references 
         WHERE environment_status = 'PENDING_APPROVAL'
         ORDER BY created_at DESC`
      );

      return references;
    } catch (err) {
      logger.error('[ENV REF ADMIN] Failed to fetch pending references:', err.message);
      throw err;
    }
  }

  /**
   * Get environment reference statistics
   */
  async getEnvironmentReferenceStats() {
    try {
      const { rows: [stats] } = await query(
        `SELECT 
           COUNT(*) FILTER (WHERE environment_status = 'ACTIVE')::INT AS active_count,
           COUNT(*) FILTER (WHERE environment_status = 'PENDING_APPROVAL')::INT AS pending_count,
           COUNT(*) FILTER (WHERE environment_status = 'REVOKED')::INT AS revoked_count,
           COUNT(*)::INT AS total_count
         FROM attendance_environment_references`
      );

      return stats;
    } catch (err) {
      logger.error('[ENV REF ADMIN] Failed to get stats:', err.message);
      throw err;
    }
  }

  /**
   * Manage office network whitelist
   */
  async upsertOfficeNetworkWhitelist(officeNetwork, reqUser) {
    try {
      const {
        office_code,
        office_name,
        allowed_bssids = [],
        allowed_ip_ranges = [],
        allowed_ip_addresses = [],
        geo_fence_enabled = false,
        geo_fence_center_lat,
        geo_fence_center_lon,
        geo_fence_radius_meters = 100,
        fallback_enabled = true,
      } = officeNetwork;

      const { rows: [upserted] } = await query(
        `INSERT INTO office_network_whitelist 
         (office_code, office_name, allowed_bssids, allowed_ip_ranges, allowed_ip_addresses,
          geo_fence_enabled, geo_fence_center_lat, geo_fence_center_lon, geo_fence_radius_meters,
          fallback_enabled, network_status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ACTIVE', NOW(), NOW())
         ON CONFLICT (office_code)
         DO UPDATE SET
           office_name = EXCLUDED.office_name,
           allowed_bssids = EXCLUDED.allowed_bssids,
           allowed_ip_ranges = EXCLUDED.allowed_ip_ranges,
           allowed_ip_addresses = EXCLUDED.allowed_ip_addresses,
           geo_fence_enabled = EXCLUDED.geo_fence_enabled,
           geo_fence_center_lat = EXCLUDED.geo_fence_center_lat,
           geo_fence_center_lon = EXCLUDED.geo_fence_center_lon,
           geo_fence_radius_meters = EXCLUDED.geo_fence_radius_meters,
           fallback_enabled = EXCLUDED.fallback_enabled,
           updated_at = NOW()
         RETURNING *`,
        [
          office_code,
          office_name,
          allowed_bssids,
          allowed_ip_ranges,
          allowed_ip_addresses,
          geo_fence_enabled,
          geo_fence_center_lat,
          geo_fence_center_lon,
          geo_fence_radius_meters,
          fallback_enabled,
        ]
      );

      await logAction(reqUser, 'OFFICE_NETWORK_WHITELIST_UPDATED', null, {
        office_code,
        office_name,
      });

      logger.info(`[ENV REF ADMIN] Upserted office network whitelist for ${office_code}`);

      return {
        success: true,
        officeNetwork: upserted,
      };
    } catch (err) {
      logger.error('[ENV REF ADMIN] Failed to upsert office network whitelist:', err.message);
      throw err;
    }
  }

  /**
   * Get all office network whitelists
   */
  async getAllOfficeNetworkWhitelists() {
    try {
      const { rows: whitelists } = await query(
        `SELECT * FROM office_network_whitelist 
         ORDER BY network_status, office_name`
      );

      return whitelists;
    } catch (err) {
      logger.error('[ENV REF ADMIN] Failed to fetch office network whitelists:', err.message);
      throw err;
    }
  }

  /**
   * Update office network status (for maintenance)
   */
  async updateOfficeNetworkStatus(officeCode, status, reqUser) {
    try {
      const { rows: [updated] } = await query(
        `UPDATE office_network_whitelist 
         SET network_status = $1, updated_at = NOW()
         WHERE office_code = $2
         RETURNING *`,
        [status, officeCode]
      );

      if (!updated) {
        const error = new Error('Office network whitelist not found');
        error.statusCode = 404;
        throw error;
      }

      await logAction(reqUser, 'OFFICE_NETWORK_STATUS_UPDATED', null, {
        office_code: officeCode,
        status,
      });

      logger.info(`[ENV REF ADMIN] Updated office network ${officeCode} status to ${status}`);

      return {
        success: true,
        officeNetwork: updated,
      };
    } catch (err) {
      logger.error('[ENV REF ADMIN] Failed to update office network status:', err.message);
      throw err;
    }
  }
}

module.exports = new EnvironmentReferenceAdminService();
