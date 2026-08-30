const { query } = require('../../config/database');
const logger = require('../../config/logger');

/**
 * Chatbot System Migration
 * Creates tables for chatbot conversations, messages, intents, analytics, and agent handoffs
 */
async function migrateChatbotSystem() {
  try {
    // 1. Create chatbot_conversations table
    await query(`
      CREATE TABLE IF NOT EXISTS chatbot_conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        session_id VARCHAR(255) UNIQUE NOT NULL,
        user_role VARCHAR(50),
        started_at TIMESTAMP DEFAULT NOW(),
        last_activity_at TIMESTAMP DEFAULT NOW(),
        status VARCHAR(50) DEFAULT 'ACTIVE',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // 2. Create chatbot_messages table
    await query(`
      CREATE TABLE IF NOT EXISTS chatbot_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
        sender VARCHAR(50) NOT NULL,
        message_text TEXT NOT NULL,
        message_type VARCHAR(50) DEFAULT 'TEXT',
        intent VARCHAR(100),
        confidence_score DECIMAL(5,2),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // 3. Create chatbot_intents table
    await query(`
      CREATE TABLE IF NOT EXISTS chatbot_intents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        intent_name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        training_phrases TEXT[],
        response_template TEXT,
        chips JSONB DEFAULT '[]',
        required_role VARCHAR(50)[],
        is_active BOOLEAN DEFAULT true,
        priority INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // 4. Create chatbot_analytics table
    await query(`
      CREATE TABLE IF NOT EXISTS chatbot_analytics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id VARCHAR(255),
        user_id UUID,
        user_role VARCHAR(50),
        intent_detected VARCHAR(100),
        action_taken VARCHAR(100),
        resolution_status VARCHAR(50),
        satisfaction_rating INTEGER,
        chat_duration_seconds INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // 5. Create chatbot_handoffs table
    await query(`
      CREATE TABLE IF NOT EXISTS chatbot_handoffs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID REFERENCES chatbot_conversations(id),
        assigned_to UUID,
        assigned_at TIMESTAMP DEFAULT NOW(),
        status VARCHAR(50) DEFAULT 'PENDING',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // 6. Create indexes for better performance
    await query(`
      CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_session_id ON chatbot_conversations(session_id);
      CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_user_id ON chatbot_conversations(user_id);
      CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_status ON chatbot_conversations(status);
      CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_user_role ON chatbot_conversations(user_role);
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_chatbot_messages_conversation_id ON chatbot_messages(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_chatbot_messages_created_at ON chatbot_messages(created_at);
      CREATE INDEX IF NOT EXISTS idx_chatbot_messages_intent ON chatbot_messages(intent);
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_chatbot_intents_intent_name ON chatbot_intents(intent_name);
      CREATE INDEX IF NOT EXISTS idx_chatbot_intents_is_active ON chatbot_intents(is_active);
      CREATE INDEX IF NOT EXISTS idx_chatbot_intents_priority ON chatbot_intents(priority);
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_chatbot_analytics_session_id ON chatbot_analytics(session_id);
      CREATE INDEX IF NOT EXISTS idx_chatbot_analytics_user_id ON chatbot_analytics(user_id);
      CREATE INDEX IF NOT EXISTS idx_chatbot_analytics_intent_detected ON chatbot_analytics(intent_detected);
      CREATE INDEX IF NOT EXISTS idx_chatbot_analytics_created_at ON chatbot_analytics(created_at);
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_chatbot_handoffs_conversation_id ON chatbot_handoffs(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_chatbot_handoffs_assigned_to ON chatbot_handoffs(assigned_to);
      CREATE INDEX IF NOT EXISTS idx_chatbot_handoffs_status ON chatbot_handoffs(status);
    `);

    // 7. Seed default intents
    await seedDefaultIntents();
  } catch (error) {
    logger.error('❌ Chatbot System migration failed:', error);
    throw error;
  }
}

/**
 * Seed default chatbot intents for basic functionality
 */
async function seedDefaultIntents() {
  const defaultIntents = [
    {
      intent_name: 'greeting',
      description: 'User greeting messages',
      training_phrases: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'namaste'],
      response_template: 'Hello! I am your GharKaPaisa Finance Buddy. How can I help you today?',
      chips: JSON.stringify([
        { label: 'Find Credit Card', action: 'cards_start' },
        { label: 'Apply for Loan', action: 'loans_start' },
        { label: 'Partner Earnings', action: 'partner_start' },
        { label: 'Contact Support', action: 'support_start' }
      ]),
      required_role: ['PUBLIC', 'PARTNER', 'ADMIN', 'SUPER_ADMIN', 'EMPLOYEE'],
      is_active: true,
      priority: 10
    },
    {
      intent_name: 'credit_card_inquiry',
      description: 'User asking about credit cards',
      training_phrases: ['credit card', 'card', 'cc', 'credit cards', 'apply for card', 'best card'],
      response_template: 'GharKaPaisa lists multiple premium credit cards from SBI, ICICI, HDFC, Axis, and Kotak. Which category is your interest?',
      chips: JSON.stringify([
        { label: 'Lifetime Free Cards', action: 'cards_ltf' },
        { label: 'Cashback & Shopping', action: 'cards_cashback' },
        { label: 'Travel & Transit', action: 'cards_travel' },
        { label: 'Rewards & Lifestyle', action: 'cards_rewards' }
      ]),
      required_role: ['PUBLIC', 'PARTNER', 'ADMIN', 'SUPER_ADMIN', 'EMPLOYEE'],
      is_active: true,
      priority: 8
    },
    {
      intent_name: 'loan_inquiry',
      description: 'User asking about loans',
      training_phrases: ['loan', 'personal loan', 'business loan', 'home loan', 'borrow money', 'apply for loan'],
      response_template: 'We assist with Personal Loans, Business Loans, and Home Loans from major lending partners. Which one do you want to explore?',
      chips: JSON.stringify([
        { label: 'Personal Loan', action: 'loans_personal' },
        { label: 'Business Loan', action: 'loans_business' },
        { label: 'Home Loan / LAP', action: 'loans_home' }
      ]),
      required_role: ['PUBLIC', 'PARTNER', 'ADMIN', 'SUPER_ADMIN', 'EMPLOYEE'],
      is_active: true,
      priority: 8
    },
    {
      intent_name: 'partner_inquiry',
      description: 'User asking about partner program',
      training_phrases: ['partner', 'earn', 'commission', 'agent', 'dsa', 'become partner', 'join as partner'],
      response_template: 'Earn high payouts by submitting customer applications as a Partner! Grow your Level 1, 2, and 3 referral network.',
      chips: JSON.stringify([
        { label: 'How to Join?', action: 'partner_join' },
        { label: 'Commission Rates', action: 'partner_rates' },
        { label: 'Wallet & Payouts', action: 'partner_payouts' },
        { label: 'Referral Network', action: 'partner_referral' }
      ]),
      required_role: ['PUBLIC', 'PARTNER', 'ADMIN', 'SUPER_ADMIN', 'EMPLOYEE'],
      is_active: true,
      priority: 8
    },
    {
      intent_name: 'kyc_inquiry',
      description: 'User asking about KYC process',
      training_phrases: ['kyc', 'pan card', 'aadhaar', 'verification', 'document upload', 'kyc process'],
      response_template: 'To clear your KYC verification and withdraw earnings, upload your Aadhaar Card (front & back), PAN Card, and a cancelled check photo inside the KYC panel.',
      chips: JSON.stringify([
        { label: 'Login to KYC', action: 'go_login' },
        { label: 'KYC Requirements', action: 'kyc_requirements' }
      ]),
      required_role: ['PARTNER', 'EMPLOYEE'],
      is_active: true,
      priority: 7
    },
    {
      intent_name: 'support_inquiry',
      description: 'User asking for support',
      training_phrases: ['support', 'help', 'contact', 'email', 'phone', 'call', 'customer service'],
      response_template: 'Our dedicated support team is available Mon-Sat, 10 AM to 7 PM. You can call us, send a message on WhatsApp, or email us at support@gharkapaisa.com.',
      chips: JSON.stringify([
        { label: 'Go to Contact Page', action: 'go_contact' },
        { label: 'WhatsApp Support', action: 'go_whatsapp' }
      ]),
      required_role: ['PUBLIC', 'PARTNER', 'ADMIN', 'SUPER_ADMIN', 'EMPLOYEE'],
      is_active: true,
      priority: 9
    },
    {
      intent_name: 'cibil_inquiry',
      description: 'User asking about CIBIL score',
      training_phrases: ['cibil', 'credit score', 'credit rating', 'score', 'cibil score'],
      response_template: 'A CIBIL score of 750 or higher increases your chances of credit card and loan approval with better interest rates.',
      chips: JSON.stringify([
        { label: 'Apply for Loan', action: 'loans_start' },
        { label: 'Check Your Score', action: 'go_cibil' }
      ]),
      required_role: ['PUBLIC', 'PARTNER', 'ADMIN', 'SUPER_ADMIN', 'EMPLOYEE'],
      is_active: true,
      priority: 6
    },
    {
      intent_name: 'wallet_inquiry',
      description: 'User asking about wallet',
      training_phrases: ['wallet', 'payout', 'withdraw', 'balance', 'earnings', 'commission payout'],
      response_template: 'Your approved lead payouts are credited directly to your GKP Wallet. You can withdraw withdrawable funds instantly to your registered bank account or UPI ID.',
      chips: JSON.stringify([
        { label: 'Login & Check Wallet', action: 'go_login' },
        { label: 'Withdrawal Process', action: 'wallet_withdrawal' }
      ]),
      required_role: ['PARTNER', 'EMPLOYEE'],
      is_active: true,
      priority: 7
    },
    {
      intent_name: 'employee_inquiry',
      description: 'User asking about employee/HR',
      training_phrases: ['employee', 'hr', 'job', 'career', 'work', 'join as employee', 'job opening'],
      response_template: 'We are hiring! Check our Careers page for open positions in Sales, Technology, Operations, and Management.',
      chips: JSON.stringify([
        { label: 'View Careers', action: 'go_careers' },
        { label: 'Register for Interview', action: 'go_interview' }
      ]),
      required_role: ['PUBLIC', 'EMPLOYEE'],
      is_active: true,
      priority: 6
    },
    {
      intent_name: 'lead_process',
      description: 'User asking about lead creation process or steps',
      training_phrases: ['lead process', 'create lead', 'add lead', 'punch lead', 'how to create lead', 'lead steps', 'how to add lead', 'process of lead', 'lead creation'],
      response_template: 'Here is the step-by-step lead process tailored for your panel context.',
      chips: JSON.stringify([
        { label: 'Lead Process', action: 'lead_process' },
        { label: 'Main Menu', action: 'main_menu' }
      ]),
      required_role: ['PUBLIC', 'PARTNER', 'ADMIN', 'SUPER_ADMIN', 'EMPLOYEE'],
      is_active: true,
      priority: 9
    },
    {
      intent_name: 'application_status',
      description: 'User checking application status',
      training_phrases: ['application status', 'track application', 'my application', 'application status check'],
      response_template: 'You can track your application status using your reference code. Please provide your reference code or mobile number.',
      chips: JSON.stringify([
        { label: 'Check Status', action: 'go_status' },
        { label: 'I have Reference Code', action: 'status_ref_code' }
      ]),
      required_role: ['PUBLIC', 'PARTNER', 'EMPLOYEE'],
      is_active: true,
      priority: 7
    }
  ];

  for (const intent of defaultIntents) {
    const { rows } = await query(
      `SELECT id FROM chatbot_intents WHERE intent_name = $1`,
      [intent.intent_name]
    );

    if (rows.length === 0) {
      await query(
        `INSERT INTO chatbot_intents (
          intent_name, description, training_phrases, response_template, chips,
          required_role, is_active, priority
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          intent.intent_name,
          intent.description,
          intent.training_phrases,
          intent.response_template,
          intent.chips,
          intent.required_role,
          intent.is_active,
          intent.priority
        ]
      );
      logger.info(`✅ Seeded intent: ${intent.intent_name}`);
    }
  }
}

module.exports = migrateChatbotSystem;

// Run migration if called directly
if (require.main === module) {
  migrateChatbotSystem()
    .then(() => {
      logger.info('Chatbot migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Chatbot migration failed:', error);
      process.exit(1);
    });
}
