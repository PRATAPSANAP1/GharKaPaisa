/**
 * One-off Guarded SQL Script: Update Tata Neu Plus & Tata Neu Infinity Links
 *
 * Default mode is DRY-RUN (prints matching rows and rowCounts, then executes ROLLBACK).
 * Pass `--apply` to COMMIT the transaction:
 *   node backend/src/database/scripts/update_tata_neu_links.js          # dry-run (ROLLBACK)
 *   node backend/src/database/scripts/update_tata_neu_links.js --apply  # live commit (COMMIT)
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const { query, getClient } = require('../../config/database');

const NEW_LINK =
  'https://applyonline.hdfc.bank.in/cards/credit-cards.html?CHANNELSOURCE=TDCC&DEDUPE=N&DSACode=XYOH&LGcode=YOH5&LCcode=YOH5&LC2=A222&SMcode=S54558';
const OLD_LINK =
  'https://applyonline.hdfc.bank.in/cards/credit-cards?CHANNELSOURCE=SWCC&CHANNEL=DSA&DSACode=XSPY&LGcode=PTY01&LCcode=PTY01&LC2=PTY01&SMcode=S54558';
const TATA_BANK_ID = '1eacfa67-1187-48c7-adde-8a6edcfe9969';

async function run() {
  const shouldApply = process.argv.includes('--apply');
  console.log(`[update_tata_neu_links] Mode: ${shouldApply ? 'APPLY (COMMIT)' : 'DRY-RUN (ROLLBACK)'}`);

  const client = typeof getClient === 'function' ? await getClient() : null;
  const execQuery = client ? (sql, params) => client.query(sql, params) : (sql, params) => query(sql, params);

  try {
    await execQuery('BEGIN');

    // ── Step 1: system_settings ──────────────────────────────────────────────
    console.log('\n--- Step 1: system_settings (key = hdfc_tata_neu_adobe_support_link) ---');
    const step1Before = await execQuery(
      `SELECT key AS id, key AS name, value AS current_link
       FROM system_settings
       WHERE key = 'hdfc_tata_neu_adobe_support_link'`
    );
    console.log('Matching rows before Step 1:', step1Before.rows);

    const step1Update = await execQuery(
      `INSERT INTO system_settings (key, value)
       VALUES ('hdfc_tata_neu_adobe_support_link', $1)
       ON CONFLICT (key) DO UPDATE
         SET value = EXCLUDED.value
       WHERE system_settings.value = $2`,
      [NEW_LINK, OLD_LINK]
    );
    console.log('Step 1 rowCount:', step1Update.rowCount);

    // ── Step 2: products ─────────────────────────────────────────────────────
    console.log('\n--- Step 2: products (TATA_BANK_ID Tata Neu Plus & Infinity) ---');
    const step2Before = await execQuery(
      `SELECT id, name, partner_url AS current_partner_link, public_url AS current_public_link
       FROM products
       WHERE bank_id = $1
         AND (name ILIKE '%tata neu plus%' OR name ILIKE '%tata neu infinity%')
         AND name NOT ILIKE '%business%'
         AND name NOT ILIKE '%floater%'
         AND (partner_url IS NULL OR partner_url = '' OR partner_url ILIKE 'https://applyonline.hdfc.bank.in/%')`,
      [TATA_BANK_ID]
    );
    console.log('Matching rows before Step 2:', step2Before.rows);

    const step2Update = await execQuery(
      `UPDATE products
       SET partner_url = $1,
           public_url = $1
       WHERE bank_id = $2
         AND (name ILIKE '%tata neu plus%' OR name ILIKE '%tata neu infinity%')
         AND name NOT ILIKE '%business%'
         AND name NOT ILIKE '%floater%'
         AND (partner_url IS NULL OR partner_url = '' OR partner_url ILIKE 'https://applyonline.hdfc.bank.in/%')`,
      [NEW_LINK, TATA_BANK_ID]
    );
    console.log('Step 2 rowCount:', step2Update.rowCount);

    // ── Step 3: bank_direct_process_links ────────────────────────────────────
    console.log('\n--- Step 3: bank_direct_process_links (TATA_BANK_ID with OLD_LINK) ---');
    const step3Before = await execQuery(
      `SELECT bdpl.id, COALESCE(b.name, bdpl.bank_id::text) AS name, bdpl.direct_process_link AS current_link
       FROM bank_direct_process_links bdpl
       LEFT JOIN banks b ON b.id = bdpl.bank_id
       WHERE bdpl.bank_id = $1
         AND bdpl.direct_process_link = $2`,
      [TATA_BANK_ID, OLD_LINK]
    );
    console.log('Matching rows before Step 3:', step3Before.rows);

    const step3Update = await execQuery(
      `UPDATE bank_direct_process_links
       SET direct_process_link = $1,
           updated_at = NOW()
       WHERE bank_id = $2
         AND direct_process_link = $3`,
      [NEW_LINK, TATA_BANK_ID, OLD_LINK]
    );
    console.log('Step 3 rowCount:', step3Update.rowCount);

    if (shouldApply) {
      await execQuery('COMMIT');
      console.log('\n[update_tata_neu_links] Transaction COMMITTED successfully.');
    } else {
      await execQuery('ROLLBACK');
      console.log('\n[update_tata_neu_links] Dry-run complete. Transaction ROLLED BACK (pass --apply to commit).');
    }
    process.exit(0);
  } catch (err) {
    try {
      await execQuery('ROLLBACK');
    } catch (_) {
      // Ignore rollback error if connection failed
    }
    console.error('[update_tata_neu_links] Error encountered, transaction ROLLED BACK:', err.message);
    process.exit(1);
  } finally {
    if (client && typeof client.release === 'function') {
      client.release();
    }
  }
}

run();

