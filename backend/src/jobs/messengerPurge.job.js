const fs = require('fs');
const path = require('path');
const { query } = require('../config/database');
const logger = require('../config/logger');

/**
 * 48-Hour Messenger Message & File Purge Job
 * Rule: All messages and their associated files/attachments older than 48 hours must be deleted everywhere (DB & Disk).
 */
const purgeExpiredMessengerMessages = async () => {
  logger.info('[Messenger Purge] Starting 48-hour message cleanup job...');
  try {
    // 1. Fetch attachments of messages older than 48 hours before DB deletion
    const { rows: expiredAttachments } = await query(`
      SELECT ma.id, ma.file_name, ma.file_url, ma.storage_key, ma.message_id
      FROM message_attachments ma
      JOIN messages m ON m.id = ma.message_id
      WHERE m.created_at < NOW() - INTERVAL '48 hours'
    `);

    logger.info(`[Messenger Purge] Found ${expiredAttachments.length} attachments associated with expired messages.`);

    // 2. Delete attachment files from disk
    let deletedFilesCount = 0;
    for (const att of expiredAttachments) {
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
              logger.info(`[Messenger Purge] Successfully unlinked file: ${filePath}`);
              break;
            }
          }
        } catch (fErr) {
          logger.warn(`[Messenger Purge] Failed deleting file ${filePath}:`, fErr.message);
        }
      }
    }

    // 3. Delete messages older than 48 hours from DB
    // (CASCADE deletes message_attachments & message_reads from DB automatically)
    const { rowCount: deletedMessagesCount } = await query(`
      DELETE FROM messages
      WHERE created_at < NOW() - INTERVAL '48 hours'
    `);

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

    logger.info(`[Messenger Purge] Completed purge job: ${deletedMessagesCount || 0} messages deleted, ${deletedFilesCount} files removed from disk.`);
    return { success: true, deletedMessages: deletedMessagesCount || 0, deletedFiles: deletedFilesCount };
  } catch (err) {
    logger.error('[Messenger Purge] Error executing purge job:', err.message);
    return { success: false, error: err.message };
  }
};

module.exports = {
  purgeExpiredMessengerMessages
};
