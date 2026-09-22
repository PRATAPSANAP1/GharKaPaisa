const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const { query, pool } = require('../../config/database');
const logger = require('../../config/logger');

const migrateMessenger = async () => {
  logger.info('Running Messenger migrations...');

  try {
    await query('BEGIN');

    // Add user active tracking columns if not existing
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW()`).catch(() => {});
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_logout_at TIMESTAMPTZ`).catch(() => {});

    // 1. Conversations table
    await query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        conversation_type VARCHAR(50) NOT NULL DEFAULT 'DIRECT', -- 'DIRECT', 'GROUP', 'APPLICATION', 'DEPARTMENT', 'ANNOUNCEMENT'
        name VARCHAR(255),
        description TEXT,
        avatar_url VARCHAR(500),
        application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
        created_by UUID REFERENCES users(id),
        last_message_id UUID,
        last_message_text TEXT,
        last_message_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(conversation_type)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_conversations_application_id ON conversations(application_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC)`);

    // 2. Conversation Participants table
    await query(`
      CREATE TABLE IF NOT EXISTS conversation_participants (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) DEFAULT 'MEMBER', -- 'ADMIN', 'MEMBER'
        joined_at TIMESTAMPTZ DEFAULT NOW(),
        left_at TIMESTAMPTZ,
        is_muted BOOLEAN DEFAULT FALSE,
        is_archived BOOLEAN DEFAULT FALSE,
        is_pinned BOOLEAN DEFAULT FALSE,
        is_starred BOOLEAN DEFAULT FALSE,
        last_read_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(conversation_id, user_id)
      )
    `);

    await query(`ALTER TABLE conversation_participants ADD COLUMN IF NOT EXISTS cleared_at TIMESTAMPTZ`).catch(() => {});
    await query(`UPDATE conversations SET name = NULL WHERE conversation_type = 'DIRECT'`).catch(() => {});

    await query(`CREATE INDEX IF NOT EXISTS idx_conv_participants_conv_id ON conversation_participants(conversation_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_conv_participants_user_id ON conversation_participants(user_id)`);

    // 3. Messages table
    await query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        sender_id UUID NOT NULL REFERENCES users(id),
        message_type VARCHAR(50) DEFAULT 'TEXT', -- 'TEXT', 'FILE', 'IMAGE', 'APPLICATION_UPDATE', 'SYSTEM'
        message_text TEXT,
        reply_to_message_id UUID REFERENCES messages(id),
        is_edited BOOLEAN DEFAULT FALSE,
        edited_at TIMESTAMPTZ,
        deleted_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_messages_conv_id ON messages(conversation_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC)`);

    // 4. Message Attachments table
    await query(`
      CREATE TABLE IF NOT EXISTS message_attachments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
        file_name VARCHAR(255) NOT NULL,
        file_url TEXT NOT NULL,
        file_type VARCHAR(100),
        file_size BIGINT,
        storage_key TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await query(`ALTER TABLE message_attachments ALTER COLUMN file_size TYPE BIGINT USING file_size::bigint`).catch(() => {});
    await query(`ALTER TABLE message_attachments ALTER COLUMN file_url TYPE TEXT`).catch(() => {});
    await query(`ALTER TABLE message_attachments ALTER COLUMN storage_key TYPE TEXT`).catch(() => {});
    await query(`CREATE INDEX IF NOT EXISTS idx_message_attachments_msg_id ON message_attachments(message_id)`);

    // 5. Message Reads table
    await query(`
      CREATE TABLE IF NOT EXISTS message_reads (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        read_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(message_id, user_id)
      )
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_message_reads_user ON message_reads(user_id)`);

    // 6. Blocked Users table
    await query(`
      CREATE TABLE IF NOT EXISTS blocked_users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        blocked_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, blocked_user_id)
      )
    `);

    // 7. Admin User Assignments table
    await query(`
      CREATE TABLE IF NOT EXISTS admin_user_assignments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        assigned_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(admin_id, assigned_user_id)
      )
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_admin_user_assignments_admin ON admin_user_assignments(admin_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_admin_user_assignments_user ON admin_user_assignments(assigned_user_id)`);

    await query('COMMIT');
    logger.info('Messenger migrations completed successfully');
    return { success: true, message: 'Messenger migrations completed' };
  } catch (error) {
    await query('ROLLBACK');
    logger.error('Messenger migration failed:', error);
    throw error;
  }
};

if (require.main === module) {
  migrateMessenger()
    .then(async () => {
      console.log('Messenger migration completed');
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('Messenger migration failed:', err);
      await pool.end();
      process.exit(1);
    });
}

module.exports = migrateMessenger;
