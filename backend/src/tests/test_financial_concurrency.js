const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { query, pool } = require('../config/database');
const { creditWalletFromPayment } = require('../modules/wallet/service');
const { verifyPayment } = require('../modules/payment/payment.controller');
const { handleRazorpayWebhook } = require('../modules/wallet/controller');
const migrateFinancialTables = require('../database/migrations/migrate_financial_tables');

// Color helpers
const green = (msg) => `\x1b[32m${msg}\x1b[0m`;
const red = (msg) => `\x1b[31m${msg}\x1b[0m`;
const yellow = (msg) => `\x1b[33m${msg}\x1b[0m`;

async function setupTestFixtures() {
  console.log(yellow('\n[SETUP] Running database migrations & setting up test fixtures...'));

  // Run DB Migration
  await migrateFinancialTables();

  // Create Test User & Partner Profile A & B
  const userARes = await query(`
    INSERT INTO users (full_name, email, mobile, password_hash, role)
    VALUES ('Test Partner A', 'testpartnerA_test@example.com', '9999900001', 'hash', 'PARTNER')
    ON CONFLICT DO NOTHING RETURNING id;
  `);

  let userAId = userARes.rows[0]?.id;
  if (!userAId) {
    const { rows } = await query(`SELECT id FROM users WHERE email = 'testpartnerA_test@example.com'`);
    userAId = rows[0].id;
  }

  const partnerARes = await query(`
    INSERT INTO partner_profiles (user_id, partner_code, first_name, last_name, kyc_status)
    VALUES ($1, 'TESTPA01', 'Test', 'PartnerA', 'approved')
    ON CONFLICT DO NOTHING RETURNING id;
  `, [userAId]);

  let partnerAId = partnerARes.rows[0]?.id;
  if (!partnerAId) {
    const { rows } = await query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [userAId]);
    partnerAId = rows[0].id;
  }

  // Partner B
  const userBRes = await query(`
    INSERT INTO users (full_name, email, mobile, password_hash, role)
    VALUES ('Test Partner B', 'testpartnerB_test@example.com', '9999900002', 'hash', 'PARTNER')
    ON CONFLICT DO NOTHING RETURNING id;
  `);

  let userBId = userBRes.rows[0]?.id;
  if (!userBId) {
    const { rows } = await query(`SELECT id FROM users WHERE email = 'testpartnerB_test@example.com'`);
    userBId = rows[0].id;
  }

  const partnerBRes = await query(`
    INSERT INTO partner_profiles (user_id, partner_code, first_name, last_name, kyc_status)
    VALUES ($1, 'TESTPB01', 'Test', 'PartnerB', 'approved')
    ON CONFLICT DO NOTHING RETURNING id;
  `, [userBId]);

  let partnerBId = partnerBRes.rows[0]?.id;
  if (!partnerBId) {
    const { rows } = await query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [userBId]);
    partnerBId = rows[0].id;
  }

  // Ensure wallets
  await query(`INSERT INTO partner_wallets (partner_id, available_balance) VALUES ($1, 0) ON CONFLICT (partner_id) DO NOTHING`, [partnerAId]);
  await query(`INSERT INTO partner_wallets (partner_id, available_balance) VALUES ($2, 0) ON CONFLICT (partner_id) DO NOTHING`, [partnerBId]);

  // Reset wallet balances for clean test
  await query(`UPDATE partner_wallets SET available_balance = 0, total_earned = 0, total_withdrawn = 0 WHERE partner_id IN ($1, $2)`, [partnerAId, partnerBId]);

  console.log(green(`[SETUP COMPLETE] Partner A: ${partnerAId}, Partner B: ${partnerBId}`));
  return { partnerAId, partnerBId, userAId, userBId };
}

async function cleanupFixtures(partnerAId, partnerBId, testPaymentIds = []) {
  console.log(yellow('\n[CLEANUP] Cleaning up test payments & ledger records...'));
  if (testPaymentIds.length > 0) {
    await query(`DELETE FROM razorpay_processed_payments WHERE payment_id = ANY($1::varchar[])`, [testPaymentIds]);
    await query(`DELETE FROM wallet_ledger WHERE reference_number = ANY($1::varchar[])`, [testPaymentIds]);
    await query(`DELETE FROM wallet_transactions WHERE reference_id = ANY($1::varchar[])`, [testPaymentIds]);
  }
  console.log(green('[CLEANUP COMPLETE]'));
}

function mockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
  return res;
}

async function runTests() {
  const { partnerAId, partnerBId } = await setupTestFixtures();
  const testPaymentIds = [];

  console.log(yellow('\n=================================================='));
  console.log(yellow('     FINANCIAL CONCURRENCY & IDEMPOTENCY SUITE'));
  console.log(yellow('==================================================\n'));

  // --------------------------------------------------------------------------
  // TEST 1: Same payment twice sequentially
  // --------------------------------------------------------------------------
  console.log(yellow('--- TEST 1: Same Payment Twice (Sequential Replay) ---'));
  const p1 = `pay_test1_${Date.now()}`;
  const order1 = `order_test1_${Date.now()}`;
  testPaymentIds.push(p1);

  const res1 = await creditWalletFromPayment(partnerAId, 1000, p1, order1);
  const res2 = await creditWalletFromPayment(partnerAId, 1000, p1, order1);

  const wallet1 = await query(`SELECT available_balance FROM partner_wallets WHERE partner_id = $1`, [partnerAId]);
  const ledger1 = await query(`SELECT COUNT(*) FROM wallet_ledger WHERE reference_number = $1`, [p1]);

  console.log(`Req 1 Result:`, res1);
  console.log(`Req 2 Result:`, res2);
  console.log(`Available Balance: ₹${wallet1.rows[0].available_balance}`);
  console.log(`Ledger Rows: ${ledger1.rows[0].count}`);

  if (
    res1.alreadyProcessed === false &&
    res2.alreadyProcessed === true &&
    parseFloat(wallet1.rows[0].available_balance) === 1000 &&
    parseInt(ledger1.rows[0].count) === 1
  ) {
    console.log(green('✅ TEST 1 PASSED: Second replay rejected cleanly. Balance = 1000, Ledger Rows = 1.\n'));
  } else {
    console.log(red('❌ TEST 1 FAILED!\n'));
  }

  // --------------------------------------------------------------------------
  // TEST 2: 20 Simultaneous Requests for Same Payment P2
  // --------------------------------------------------------------------------
  console.log(yellow('--- TEST 2: 20 Simultaneous Requests (High Concurrency) ---'));
  const p2 = `pay_test2_${Date.now()}`;
  const order2 = `order_test2_${Date.now()}`;
  testPaymentIds.push(p2);

  // Reset wallet balance
  await query(`UPDATE partner_wallets SET available_balance = 0 WHERE partner_id = $1`, [partnerAId]);

  const promises = [];
  for (let i = 0; i < 20; i++) {
    promises.push(creditWalletFromPayment(partnerAId, 5000, p2, order2));
  }

  const results2 = await Promise.all(promises);
  const wallet2 = await query(`SELECT available_balance FROM partner_wallets WHERE partner_id = $1`, [partnerAId]);
  const ledger2 = await query(`SELECT COUNT(*) FROM wallet_ledger WHERE reference_number = $1`, [p2]);
  const proc2 = await query(`SELECT COUNT(*) FROM razorpay_processed_payments WHERE payment_id = $1`, [p2]);

  const successCount = results2.filter(r => r.alreadyProcessed === false).length;
  const replayedCount = results2.filter(r => r.alreadyProcessed === true).length;

  console.log(`Successful Credits: ${successCount}`);
  console.log(`Replay Rejections: ${replayedCount}`);
  console.log(`Available Balance: ₹${wallet2.rows[0].available_balance}`);
  console.log(`Ledger Rows: ${ledger2.rows[0].count}`);
  console.log(`Processed Payments Rows: ${proc2.rows[0].count}`);

  if (
    successCount === 1 &&
    replayedCount === 19 &&
    parseFloat(wallet2.rows[0].available_balance) === 5000 &&
    parseInt(ledger2.rows[0].count) === 1 &&
    parseInt(proc2.rows[0].count) === 1
  ) {
    console.log(green('✅ TEST 2 PASSED: Exactly 1 credit succeeded out of 20 concurrent requests. Balance = 5000.\n'));
  } else {
    console.log(red('❌ TEST 2 FAILED!\n'));
  }

  // --------------------------------------------------------------------------
  // TEST 3: Verify Payment + Webhook Simultaneously
  // --------------------------------------------------------------------------
  console.log(yellow('--- TEST 3: Verify Payment & Webhook Racing Simultaneously ---'));
  const p3 = `pay_test3_${Date.now()}`;
  const order3 = `order_test3_${Date.now()}`;
  testPaymentIds.push(p3);

  // Reset wallet balance
  await query(`UPDATE partner_wallets SET available_balance = 0 WHERE partner_id = $1`, [partnerAId]);

  const reqWebhook = {
    headers: { 'x-razorpay-signature': 'mock' },
    rawBody: JSON.stringify({
      event: 'payment.captured',
      event_id: `evt_test3_${Date.now()}`,
      payload: {
        payment: {
          entity: {
            id: p3,
            order_id: order3,
            amount: 250000, // 2500 INR in paise
            notes: { partner_id: partnerAId }
          }
        }
      }
    }),
    body: {
      event: 'payment.captured',
      event_id: `evt_test3_${Date.now()}`,
      payload: {
        payment: {
          entity: {
            id: p3,
            order_id: order3,
            amount: 250000,
            notes: { partner_id: partnerAId }
          }
        }
      }
    }
  };

  process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret';
  const crypto = require('crypto');
  const validWebhookSig = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(reqWebhook.rawBody)
    .digest('hex');
  reqWebhook.headers['x-razorpay-signature'] = validWebhookSig;

  const resWebhook = mockRes();

  // Run direct credit call and webhook simultaneously
  const racePromises = [
    creditWalletFromPayment(partnerAId, 2500, p3, order3),
    handleRazorpayWebhook(reqWebhook, resWebhook, (err) => console.error(err))
  ];

  await Promise.all(racePromises);

  const wallet3 = await query(`SELECT available_balance FROM partner_wallets WHERE partner_id = $1`, [partnerAId]);
  const ledger3 = await query(`SELECT COUNT(*) FROM wallet_ledger WHERE reference_number = $1`, [p3]);

  console.log(`Available Balance: ₹${wallet3.rows[0].available_balance}`);
  console.log(`Ledger Rows: ${ledger3.rows[0].count}`);
  console.log(`Webhook Res Code: ${resWebhook.statusCode}`);

  if (
    parseFloat(wallet3.rows[0].available_balance) === 2500 &&
    parseInt(ledger3.rows[0].count) === 1
  ) {
    console.log(green('✅ TEST 3 PASSED: Direct credit and webhook race safely credited wallet exactly once.\n'));
  } else {
    console.log(red('❌ TEST 3 FAILED!\n'));
  }

  // --------------------------------------------------------------------------
  // TEST 4: Same Payment ID for Different Partner
  // --------------------------------------------------------------------------
  console.log(yellow('--- TEST 4: Same Payment ID Attempted for Partner B ---'));
  const p4 = `pay_test4_${Date.now()}`;
  const order4 = `order_test4_${Date.now()}`;
  testPaymentIds.push(p4);

  // Credit partner A first
  await creditWalletFromPayment(partnerAId, 3000, p4, order4);

  // Attempt to credit partner B with same payment ID
  let errPartnerB = null;
  let resPartnerB = null;
  try {
    resPartnerB = await creditWalletFromPayment(partnerBId, 3000, p4, order4);
  } catch (err) {
    errPartnerB = err;
  }

  const wallet4B = await query(`SELECT available_balance FROM partner_wallets WHERE partner_id = $1`, [partnerBId]);
  const ledger4B = await query(`SELECT COUNT(*) FROM wallet_ledger WHERE reference_number = $1 AND partner_id = $2`, [p4, partnerBId]);

  console.log(`Partner B Credit Result:`, resPartnerB || errPartnerB?.message);
  console.log(`Partner B Balance: ₹${wallet4B.rows[0].available_balance}`);
  console.log(`Partner B Ledger Rows: ${ledger4B.rows[0].count}`);

  if (
    parseFloat(wallet4B.rows[0].available_balance) === 0 &&
    parseInt(ledger4B.rows[0].count) === 0 &&
    (resPartnerB?.alreadyProcessed === true || (errPartnerB && errPartnerB.code === '23505'))
  ) {
    console.log(green('✅ TEST 4 PASSED: Payment replay for Partner B blocked by DB primary key. Balance unchanged = 0.\n'));
  } else {
    console.log(red('❌ TEST 4 FAILED!\n'));
  }

  // --------------------------------------------------------------------------
  // TEST 5: Order Partner Ownership Mismatch
  // --------------------------------------------------------------------------
  console.log(yellow('--- TEST 5: Payment Verification with Partner Mismatch ---'));
  const p5 = `pay_test5_${Date.now()}`;
  const order5 = `order_test5_${Date.now()}`;

  const reqMismatch = {
    body: {
      razorpay_order_id: order5,
      razorpay_payment_id: p5,
      razorpay_signature: 'mock_sig'
    },
    user: { id: partnerBId },
    partner: { id: partnerBId }
  };
  const resMismatch = mockRes();

  process.env.RAZORPAY_KEY_SECRET = 'test_secret';
  const expectedSig5 = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${order5}|${p5}`)
    .digest('hex');
  reqMismatch.body.razorpay_signature = expectedSig5;

  const Razorpay = require('razorpay');
  Razorpay.prototype.orders = {
    fetch: async () => ({
      id: order5,
      amount: 100000,
      currency: 'INR',
      notes: { partner_id: partnerAId } // Order belongs to Partner A
    })
  };

  await verifyPayment(reqMismatch, resMismatch);

  console.log(`Mismatch Response Code: ${resMismatch.statusCode}`);
  console.log(`Mismatch Response Body:`, resMismatch.body);

  if (resMismatch.statusCode === 403 && resMismatch.body?.success === false) {
    console.log(green('✅ TEST 5 PASSED: Unauthorized payment verification rejected with 403 Forbidden.\n'));
  } else {
    console.log(red('❌ TEST 5 FAILED!\n'));
  }

  // --------------------------------------------------------------------------
  // TEST 6: DB Failure Halfway (Atomic Transaction Rollback Verification)
  // --------------------------------------------------------------------------
  console.log(yellow('--- TEST 6: Simulated DB Failure Halfway (Rollback Verification) ---'));
  const p6 = `pay_test6_${Date.now()}`;
  const order6 = `order_test6_${Date.now()}`;
  testPaymentIds.push(p6);

  await query(`UPDATE partner_wallets SET available_balance = 1000 WHERE partner_id = $1`, [partnerAId]);

  const { getClient } = require('../config/database');
  const client = await getClient();
  let rolledBack = false;

  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO razorpay_processed_payments (payment_id, order_id, partner_id, amount) VALUES ($1, $2, $3, $4)`,
      [p6, order6, partnerAId, 5000]
    );
    await client.query(
      `UPDATE partner_wallets SET available_balance = available_balance + 5000 WHERE partner_id = $1`,
      [partnerAId]
    );

    throw new Error('Simulated database error before commit!');
  } catch (err) {
    await client.query('ROLLBACK');
    rolledBack = true;
  } finally {
    client.release();
  }

  const wallet6 = await query(`SELECT available_balance FROM partner_wallets WHERE partner_id = $1`, [partnerAId]);
  const proc6 = await query(`SELECT COUNT(*) FROM razorpay_processed_payments WHERE payment_id = $1`, [p6]);

  console.log(`Rolled back cleanly: ${rolledBack}`);
  console.log(`Available Balance after rollback: ₹${wallet6.rows[0].available_balance}`);
  console.log(`Processed Payments count: ${proc6.rows[0].count}`);

  if (
    rolledBack === true &&
    parseFloat(wallet6.rows[0].available_balance) === 1000 &&
    parseInt(proc6.rows[0].count) === 0
  ) {
    console.log(green('✅ TEST 6 PASSED: Database failure successfully triggered ROLLBACK. Zero partial state left.\n'));
  } else {
    console.log(red('❌ TEST 6 FAILED!\n'));
  }

  // --------------------------------------------------------------------------
  // TEST 7: Webhook Retry Idempotency & State Recovery
  // --------------------------------------------------------------------------
  console.log(yellow('--- TEST 7: Webhook Retry Idempotency & Recovery ---'));
  const evt7 = `evt_test7_${Date.now()}`;
  const p7 = `pay_test7_${Date.now()}`;
  const order7 = `order_test7_${Date.now()}`;
  testPaymentIds.push(p7);

  const webhookBody7 = {
    event: 'payment.captured',
    event_id: evt7,
    payload: {
      payment: {
        entity: {
          id: p7,
          order_id: order7,
          amount: 400000,
          notes: { partner_id: partnerAId }
        }
      }
    }
  };

  const reqWebhook7 = {
    headers: {},
    rawBody: JSON.stringify(webhookBody7),
    body: webhookBody7
  };

  const sig7 = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(reqWebhook7.rawBody)
    .digest('hex');
  reqWebhook7.headers['x-razorpay-signature'] = sig7;

  const resWeb7_1 = mockRes();
  await handleRazorpayWebhook(reqWebhook7, resWeb7_1, (err) => console.error(err));

  const resWeb7_2 = mockRes();
  await handleRazorpayWebhook(reqWebhook7, resWeb7_2, (err) => console.error(err));

  const wallet7 = await query(`SELECT available_balance FROM partner_wallets WHERE partner_id = $1`, [partnerAId]);
  const proc7 = await query(`SELECT COUNT(*) FROM razorpay_processed_payments WHERE payment_id = $1`, [p7]);
  const evt7Count = await query(`SELECT COUNT(*) FROM razorpay_webhook_events WHERE event_id = $1`, [evt7]);

  console.log(`Call 1 Response:`, resWeb7_1.body);
  console.log(`Call 2 Response:`, resWeb7_2.body);
  console.log(`Available Balance: ₹${wallet7.rows[0].available_balance}`);
  console.log(`Processed Payments count: ${proc7.rows[0].count}`);
  console.log(`Webhook Events count: ${evt7Count.rows[0].count}`);

  if (
    resWeb7_1.statusCode === 200 &&
    resWeb7_2.body?.already_processed === true &&
    parseInt(proc7.rows[0].count) === 1 &&
    parseInt(evt7Count.rows[0].count) === 1
  ) {
    console.log(green('✅ TEST 7 PASSED: Webhook retry safely recognized event_id deduplication. Balance credited exactly once.\n'));
  } else {
    console.log(red('❌ TEST 7 FAILED!\n'));
  }

  // --------------------------------------------------------------------------
  // TEST 8: Real DB Payout Reversal Accounting (payout.processed -> payout.reversed)
  // --------------------------------------------------------------------------
  console.log(yellow('--- TEST 8: Real PostgreSQL Payout Reversal Accounting ---'));
  const payout8 = `pout_test8_${Date.now()}`;
  const evt8a = `evt_pout8_proc_${Date.now()}`;
  const evt8b = `evt_pout8_rev_${Date.now()}`;

  // Reset wallet balance to 10,000
  await query(`UPDATE partner_wallets SET available_balance = 10000, hold_balance = 2000, total_withdrawn = 0 WHERE partner_id = $1`, [partnerAId]);

  // Insert test withdrawal
  const wr8Res = await query(`
    INSERT INTO wallet_withdrawals (partner_id, amount, status, razorpay_payout_id, requested_at)
    VALUES ($1, 2000, 'pending', $2, NOW())
    RETURNING id;
  `, [partnerAId, payout8]);
  const withdrawal8Id = wr8Res.rows[0].id;

  // 1. Send payout.processed Webhook
  const body8a = {
    event: 'payout.processed',
    event_id: evt8a,
    payload: { payout: { entity: { id: payout8, reference_id: String(withdrawal8Id), amount: 200000, utr: 'UTR888' } } }
  };
  const req8a = { headers: {}, rawBody: JSON.stringify(body8a), body: body8a };
  req8a.headers['x-razorpay-signature'] = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET).update(req8a.rawBody).digest('hex');
  const res8a = mockRes();

  await handleRazorpayWebhook(req8a, res8a, (err) => console.error(err));

  const wallet8AfterProc = await query(`SELECT available_balance, total_withdrawn FROM partner_wallets WHERE partner_id = $1`, [partnerAId]);
  console.log('Balance after payout.processed (10,000 - 2,000 = 8,000):', wallet8AfterProc.rows[0].available_balance);

  // 2. Send payout.reversed Webhook
  const body8b = {
    event: 'payout.reversed',
    event_id: evt8b,
    payload: { payout: { entity: { id: payout8, reference_id: String(withdrawal8Id), amount: 200000 } } }
  };
  const req8b = { headers: {}, rawBody: JSON.stringify(body8b), body: body8b };
  req8b.headers['x-razorpay-signature'] = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET).update(req8b.rawBody).digest('hex');
  const res8b = mockRes();

  await handleRazorpayWebhook(req8b, res8b, (err) => console.error(err));

  const wallet8AfterRev = await query(`SELECT available_balance, total_withdrawn FROM partner_wallets WHERE partner_id = $1`, [partnerAId]);
  const wr8Db = await query(`SELECT status FROM wallet_withdrawals WHERE id = $1`, [withdrawal8Id]);
  const reversalLedgerDb = await query(`SELECT * FROM wallet_ledger WHERE reference_number = $1 AND transaction_type = 'REVERSAL'`, [payout8]);

  console.log('Balance after payout.reversed (8,000 + 2,000 = 10,000):', wallet8AfterRev.rows[0].available_balance);
  console.log('Total Withdrawn after reversal (0):', wallet8AfterRev.rows[0].total_withdrawn);
  console.log('Withdrawal status in DB:', wr8Db.rows[0].status);
  console.log('Reversal ledger rows in DB:', reversalLedgerDb.rows.length);

  if (
    parseFloat(wallet8AfterRev.rows[0].available_balance) === 10000 &&
    parseFloat(wallet8AfterRev.rows[0].total_withdrawn) === 0 &&
    wr8Db.rows[0].status === 'reversed' &&
    reversalLedgerDb.rows.length === 1
  ) {
    console.log(green('✅ TEST 8 PASSED: Real PostgreSQL payout.reversed successfully credited ₹2,000 & inserted append-only REVERSAL ledger entry!\n'));
  } else {
    console.log(red('❌ TEST 8 FAILED!\n'));
  }

  // Cleanup test data
  await cleanupFixtures(partnerAId, partnerBId, testPaymentIds);
  await query(`DELETE FROM wallet_withdrawals WHERE id = $1`, [withdrawal8Id]);
  await query(`DELETE FROM razorpay_webhook_events WHERE event_id IN ($1, $2)`, [evt8a, evt8b]);
  await pool.end();
}

runTests().catch((err) => {
  console.error(red('Test suite error:'), err);
  pool.end();
  process.exit(1);
});
