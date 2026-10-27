const { query } = require('../../config/database');
const logger = require('../../config/logger');

async function migrateAddBankDirectProcessLink() {
  logger.info('[MIGRATION] Checking/Adding direct process link columns to banks table...');

  try {
    // 1. Add direct process link columns to banks table
    await query(`
      ALTER TABLE banks 
        ADD COLUMN IF NOT EXISTS direct_process_url TEXT,
        ADD COLUMN IF NOT EXISTS direct_process_enabled BOOLEAN DEFAULT TRUE,
        ADD COLUMN IF NOT EXISTS dsa_code VARCHAR(100),
        ADD COLUMN IF NOT EXISTS channel_code VARCHAR(100),
        ADD COLUMN IF NOT EXISTS utm_source VARCHAR(100),
        ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(100),
        ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(100),
        ADD COLUMN IF NOT EXISTS direct_process_notes TEXT
    `);

    // 2. Set default direct process URLs for known banks if currently empty
    // TATA CO-BRAND HDFC BANK / HDFC Bank
    await query(`
      UPDATE banks
      SET 
        direct_process_url = 'https://applyonline.hdfc.bank.in/cards/credit-cards.html?CHANNELSOURCE=TDCC&DEDUPE=N&DSACode=XYOH&LGcode=PTN01&LCcode=PTN01&LC2=A089&SMcode=A31964#nbb',
        dsa_code = 'XYOH',
        channel_code = 'TDCC',
        direct_process_enabled = TRUE,
        direct_process_notes = 'Official Adobe digital application journey for credit cards'
      WHERE (short_code = 'TATA_HDFC' OR name ILIKE '%TATA%HDFC%')
        AND (direct_process_url IS NULL OR direct_process_url = '')
    `).catch(() => {});

    // Poonawalla Fincorp
    await query(`
      UPDATE banks
      SET 
        direct_process_url = 'https://instant-pocket-loan.poonawallafincorp.com/?redirectto=primepl&utm_DSA_Code=PUP00228&UTM_Partner_Name=WISHFIN&UTM_Partner_Medium=SMS&UTM_Partner_AgentCode=PFLWISHFIN&UTM_Partner_ReferenceID=WF_FW_REY_PR_26',
        dsa_code = 'PUP00228',
        direct_process_enabled = TRUE,
        direct_process_notes = 'Poonawalla Instant Pocket Loan direct process'
      WHERE (name ILIKE '%poonawalla%' OR short_code ILIKE '%poonawalla%')
        AND (direct_process_url IS NULL OR direct_process_url = '')
    `).catch(() => {});

    // Bajaj Finserv
    await query(`
      UPDATE banks
      SET 
        direct_process_url = 'https://www.bajajfinserv.in/personal-loan',
        direct_process_enabled = TRUE,
        direct_process_notes = 'Bajaj Finserv Personal Loan direct process portal'
      WHERE (name ILIKE '%bajaj%' OR short_code ILIKE '%bajaj%')
        AND (direct_process_url IS NULL OR direct_process_url = '')
    `).catch(() => {});

    logger.info('[MIGRATION COMPLETE] Direct process link columns verified and configured successfully on banks table.');
    return true;
  } catch (err) {
    logger.error('[MIGRATION ERROR] migrateAddBankDirectProcessLink:', err.message);
    throw err;
  }
}

if (require.main === module) {
  migrateAddBankDirectProcessLink()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { migrateAddBankDirectProcessLink };
