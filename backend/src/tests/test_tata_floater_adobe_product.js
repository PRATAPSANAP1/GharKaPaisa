const assert = require('assert');
const path = require('path');

console.log('Running Tata Floater Adobe Product Test Suite...\n');

// ── TEST 1: Verify NEW_BANK_CARDS has Tata Floater Adobe Credit Card under TATA CO-BRAND HDFC BANK ──
{
  const { NEW_BANK_CARDS } = require('../database/seeds/seed-new-banks');
  assert(Array.isArray(NEW_BANK_CARDS), 'NEW_BANK_CARDS must be an array');

  const tataFloaterCard = NEW_BANK_CARDS.find(c =>
    c.name === 'Tata Floater Adobe Credit Card' &&
    c.bank_id === '1eacfa67-1187-48c7-adde-8a6edcfe9969'
  );

  assert(tataFloaterCard, 'Tata Floater Adobe Credit Card must be present under bank_id 1eacfa67-1187-48c7-adde-8a6edcfe9969');
  assert.strictEqual(tataFloaterCard.bank_name, 'TATA CO-BRAND HDFC BANK');
  assert.strictEqual(tataFloaterCard.category, 'co_branded_card');
  assert.strictEqual(tataFloaterCard.sub_category, 'Co-Branded Cards');
  assert.strictEqual(tataFloaterCard.priority, 5);
  assert.strictEqual(tataFloaterCard.display_order, 5);
  console.log('✓ Test 1 Passed: Tata Floater Adobe Credit Card is registered in NEW_BANK_CARDS under TATA CO-BRAND HDFC BANK.');
}

// ── TEST 2: Verify URLs, features, and eligibility of Tata Floater Adobe Credit Card ──
{
  const { NEW_BANK_CARDS } = require('../database/seeds/seed-new-banks');
  const card = NEW_BANK_CARDS.find(c => c.name === 'Tata Floater Adobe Credit Card');

  const expectedAdobeUrl = 'https://applyonline.hdfc.bank.in/cards/credit-cards.html?CHANNELSOURCE=TDCC&DEDUPE=N&DSACode=XYOH&LGcode=PTN01&LCcode=PTN01&LC2=A089&SMcode=A31964#nbb';
  assert.strictEqual(card.partner_url, expectedAdobeUrl, 'partner_url must match official HDFC Adobe Floater URL');
  assert.strictEqual(card.public_url, expectedAdobeUrl, 'public_url must match official HDFC Adobe Floater URL');

  assert(Array.isArray(card.features) && card.features.length >= 4, 'features must be an array with at least 4 items');
  assert(card.features.some(f => f.toLowerCase().includes('floater')), 'features must mention Floater card');
  assert(card.features.some(f => f.toLowerCase().includes('adobe')), 'features must mention Adobe Digital Onboarding');
  assert(card.features.some(f => f.toLowerCase().includes('neucoins')), 'features must mention NeuCoins');

  assert(card.eligibility && card.eligibility.min_age === 21, 'min_age must be 21');
  assert(card.eligibility && card.eligibility.max_age === 65, 'max_age must be 65');
  console.log('✓ Test 2 Passed: Tata Floater Adobe Credit Card URLs, features, and eligibility verified.');
}

// ── TEST 3: Verify migration file exists and exports migrateAddTataFloaterAdobeProduct ──
{
  const migration = require('../database/migrations/migrate_add_tata_floater_adobe_product');
  assert(typeof migration.migrateAddTataFloaterAdobeProduct === 'function', 'migrateAddTataFloaterAdobeProduct must be exported as a function');
  console.log('✓ Test 3 Passed: migrate_add_tata_floater_adobe_product.js exports migrateAddTataFloaterAdobeProduct.');
}

// ── TEST 4: Verify migrate.js includes the new migration ──
{
  const fs = require('fs');
  const migrateContent = fs.readFileSync(path.resolve(__dirname, '../database/migrations/migrate.js'), 'utf8');
  assert(migrateContent.includes('migrate_add_tata_floater_adobe_product'), 'migrate.js must require migrate_add_tata_floater_adobe_product');
  assert(migrateContent.includes('migrateAddTataFloaterAdobeProduct()'), 'migrate.js must call migrateAddTataFloaterAdobeProduct()');
  console.log('✓ Test 4 Passed: migrate.js invokes migrateAddTataFloaterAdobeProduct in migration lifecycle.');
}

// ── TEST 5: Verify backend lead controller link fallback for Tata Floater Adobe ──
{
  const fs = require('fs');
  const leadCtrlContent = fs.readFileSync(path.resolve(__dirname, '../modules/crm/lead.controller.js'), 'utf8');
  assert(leadCtrlContent.includes("nameStr.includes('floater')"), 'lead.controller.js must detect floater card for Adobe link resolution');
  assert(leadCtrlContent.includes('CHANNELSOURCE=TDCC&DEDUPE=N'), 'lead.controller.js must resolve to canonical HDFC Adobe URL');
  console.log('✓ Test 5 Passed: lead.controller.js resolves canonical Adobe URL for Tata Floater Adobe without Wishfin misrouting.');
}

console.log('\n======================================================');
console.log('ALL TATA FLOATER ADOBE PRODUCT TESTS PASSED! ZERO DEFECTS.');
console.log('======================================================\n');
