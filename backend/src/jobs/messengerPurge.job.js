const fs = require('fs');
const path = require('path');
const { query } = require('../config/database');
const logger = require('../config/logger');

let deleteFromS3 = null;
try {
  const s3Service = require('../services/aws/s3.service');
  deleteFromS3 = s3Service.deleteFromS3;
} catch (err) {
  logger.info('[Messenger Purge] S3 service not loaded, skipping S3 purges.');
}

/**
 * 48-Hour Messenger Message & File Purge Job
 * Rule: All messages and their associated files/images/attachments uploaded or shared in Messenger
 * that are older than 48 hours must be deleted everywhere (Database, Disk & S3).
 * Note: ONLY Messenger files and messages are deleted. Other platform files (KYC, documents, profile photos) are kept intact.
 */
const purgeExpiredMessengerMessages = async () => {
  logger.info('[Messenger Purge] Starting 48-hour Messenger message & attachment cleanup job...');
  try {
    // 1. Fetch attachments of messages older than 48 hours before DB deletion
    const { rows: expiredAttachments } = await query(`
      SELECT ma.id, ma.file_name, ma.file_url, ma.storage_key, ma.message_id
      FROM message_attachments ma
      JOIN messages m ON m.id = ma.message_id
      WHERE m.created_at < NOW() - INTERVAL '48 hours'
    `);

    logger.info(`[Messenger Purge] Found ${expiredAttachments.length} attachments associated with expired Messenger messages.`);

    // 2. Delete attachment files from disk and S3
    let deletedFilesCount = 0;
    for (const att of expiredAttachments) {
      // Attempt S3 deletion if storage_key is present
      if (att.storage_key && typeof deleteFromS3 === 'function') {
        try {
          await deleteFromS3(att.storage_key);
        } catch (s3Err) {
          logger.warn(`[Messenger Purge] S3 delete note for key ${att.storage_key}:`, s3Err.message);
        }
      }

      const candidates = [];
      if (att.storage_key) {
        candidates.push(att.storage_key);
        candidates.push(path.join(__dirname, '../../public', att.storage_key));
        candidates.push(path.join(__dirname, '../../', att.storage_key));
      }
      if (att.file_url && typeof att.file_url === 'string') {
        const cleanUrl = att.file_url.split('?')[0];
        if (cleanUrl.startsWith('/uploads/') || cleanUrl.startsWith('uploads/')) {
          candidates.push(path.join(__dirname, '../../public', cleanUrl));
          candidates.push(path.join(__dirname, '../../', cleanUrl));
        }
      }

      for (const filePath of candidates) {
        try {
          if (filePath && fs.existsSync(filePath)) {
            const stat = fs.statSync(filePath);
            if (stat.isFile()) {
              fs.unlinkSync(filePath);
              deletedFilesCount++;
              logger.info(`[Messenger Purge] Successfully unlinked local Messenger file: ${filePath}`);
              break;
            }
          }
        } catch (fErr) {
          logger.warn(`[Messenger Purge] Failed deleting file ${filePath}:`, fErr.message);
        }
      }
    }

    // Clean up orphaned files in public/uploads/messenger folder older than 48 hours
    const messengerUploadDir = path.join(__dirname, '../../public/uploads/messenger');
    if (fs.existsSync(messengerUploadDir)) {
      const now = Date.now();
      const cutoffMs = 48 * 60 * 60 * 1000; // 48 hours
      try {
        const files = fs.readdirSync(messengerUploadDir);
        for (const file of files) {
          const fp = path.join(messengerUploadDir, file);
          try {
            const stat = fs.statSync(fp);
            if (stat.isFile() && (now - stat.mtimeMs > cutoffMs)) {
              fs.unlinkSync(fp);
              deletedFilesCount++;
              logger.info(`[Messenger Purge] Cleaned up orphaned Messenger file from disk: ${fp}`);
            }
          } catch (e) {}
        }
      } catch (dirErr) {
        logger.warn('[Messenger Purge] Error reading messenger upload dir:', dirErr.message);
      }
    }

    // 3. Delete messages older than 48 hours from DB
    // (CASCADE deletes message_attachments & message_reads from DB automatically)
    const { rowCount: deletedMessagesCount } = await query(`
      DELETE FROM messages
      WHERE created_at < NOW() - INTERVAL '48 hours'
    `);

    // Delete any orphaned message_attachments records older than 48 hours
    await query(`
      DELETE FROM message_attachments
      WHERE created_at < NOW() - INTERVAL '48 hours'
    `);

    // Delete any message_reads records for messages sent or read > 48 hours ago
    const { rowCount: deletedReadsCount } = await query(`
      DELETE FROM message_reads
      WHERE read_at < NOW() - INTERVAL '48 hours'
         OR message_id NOT IN (SELECT id FROM messages)
    `);
    logger.info(`[Messenger Purge] Deleted ${deletedReadsCount || 0} expired message_reads records.`);

    // 4. Update last_message metadata in conversations
    // A) For conversations with remaining messages, update last_message to latest remaining
    await query(`
      UPDATE conversations c
      SET last_message_id = latest.id,
          last_message_text = latest.message_text,
          last_message_at = latest.created_at
      FROM (
        SELECT DISTINCT ON (conversation_id) conversation_id, id, message_text, created_at
        FROM messages
        WHERE created_at >= NOW() - INTERVAL '48 hours' AND deleted_at IS NULL
        ORDER BY conversation_id, created_at DESC
      ) latest
      WHERE c.id = latest.conversation_id 
        AND (c.last_message_at < NOW() - INTERVAL '48 hours' 
             OR (c.last_message_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM messages WHERE id = c.last_message_id)))
    `);

    // B) For conversations with zero remaining messages, clear last message fields
    await query(`
      UPDATE conversations c
      SET last_message_id = NULL,
          last_message_text = NULL
      WHERE NOT EXISTS (SELECT 1 FROM messages WHERE conversation_id = c.id)
        AND (c.last_message_id IS NOT NULL OR c.last_message_text IS NOT NULL)
    `);

    logger.info(`[Messenger Purge] Completed 48-hour purge job: ${deletedMessagesCount || 0} messages deleted, ${deletedFilesCount} files removed.`);
    return { success: true, deletedMessages: deletedMessagesCount || 0, deletedFiles: deletedFilesCount };
  } catch (err) {
    logger.error('[Messenger Purge] Error executing purge job:', err.message);
    return { success: false, error: err.message };
  }
};

module.exports = {
  purgeExpiredMessengerMessages
};
