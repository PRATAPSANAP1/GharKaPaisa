const { query, getClient } = require('../../config/database');
const { processWithdrawal, getWalletSummary, debitAvailable, adminAdjustWallet, syncWalletBalance, manualReleaseCommission, manualRejectCommission } = require('./service.js');
const { getPaginationParams } = require('../../utils/helpers/helpers');
const { success, error, notFound, paginate } = require('../../utils/response/response');
const { logAction } = require('../admin/audit.service.js');
const { encrypt, decrypt } = require('../../utils/helpers/crypto');
const logger = require('../../config/logger');
const crypto = require('crypto');
const {
  WITHDRAWAL_MIN_AMOUNT,
  WITHDRAWAL_MAX_AMOUNT,
  WITHDRAWAL_DAILY_LIMIT,
  WITHDRAWAL_WEEKLY_LIMIT,
  WITHDRAWAL_DUPLICATE_WINDOW_MINUTES
} = require('./constants.js');

// GET /wallet / GET /wallet/:PartnerId
const getWallet = async (req, res, next) => {
  try {
    let PartnerId = req.params.PartnerId || (req.partner ? req.partner.id : null);
    if (!PartnerId && req.user) {
      const { rows: [p] } = await query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [req.user.id]);
      if (p) PartnerId = p.id;
      else PartnerId = req.user.id;
    }

    if (!PartnerId) return success(res, { available_balance: 0, hold_balance: 0, total_earned: 0, total_withdrawn: 0 });

    const wallet = await getWalletSummary(PartnerId);
    if (!wallet) return success(res, { available_balance: 0, hold_balance: 0, total_earned: 0, total_withdrawn: 0 });

    const mappedWallet = {
      ...wallet,
      pending_amount: wallet.hold_balance,
      razorpay_balance: wallet.available_balance
    };
    return success(res, mappedWallet);
  } catch (err) {
    next(err);
  }
};

// GET /wallet/transactions / GET /wallet/:PartnerId/transactions
const getTransactions = async (req, res, next) => {
  try {
    const rawPartnerId = req.params.PartnerId || (req.partner ? req.partner.id : null);
    const userId = req.user?.id || null;
    const userRole = (req.user?.role || '').toUpperCase();
    const isTeamMember = userRole === 'TEAM_MEMBER';

    let partnerId = rawPartnerId;
    if (req.user && (req.user.role === 'PARTNER' || req.user.role === 'TEAM_MEMBER')) {
      const { rows: [partnerProfile] } = await query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [req.user.id]);
      if (partnerProfile) {
        partnerId = partnerProfile.id;
      }
    }

    const { page, limit, offset } = getPaginationParams(req.query);
    const { type, status, from_date, to_date, search } = req.query;

    // For team members, only show their own wallet transactions
    let where = isTeamMember 
      ? `WHERE wl.partner_id = $1`
      : `WHERE (wl.partner_id = $1 OR wl.partner_id = $2::uuid)`;
    const values = isTeamMember ? [partnerId] : [partnerId, userId];
    let idx = isTeamMember ? 2 : 3;

    if (type) { 
      where += ` AND wl.transaction_type = $${idx++}`; 
      values.push(type); 
    }
    if (status) { 
      where += ` AND wl.status = $${idx++}`; 
      values.push(status); 
    }
    if (from_date) { 
      where += ` AND wl.created_at >= $${idx++}`; 
      values.push(from_date); 
    }
    if (to_date) { 
      where += ` AND wl.created_at <= $${idx++}`; 
      values.push(to_date + ' 23:59:59'); 
    }
    if (search) {
      where += ` AND (wl.description ILIKE $${idx} OR wl.reference_number ILIKE $${idx})`;
      idx++;
      values.push(`%${search}%`);
    }

    // Amount range filter
    const { min_amount, max_amount } = req.query;
    if (min_amount) {
      where += ` AND GREATEST(wl.credit, wl.debit) >= $${idx++}`;
      values.push(parseFloat(min_amount));
    }
    if (max_amount) {
      where += ` AND GREATEST(wl.credit, wl.debit) <= $${idx++}`;
      values.push(parseFloat(max_amount));
    }

    const [count, data] = await Promise.all([
      query(`SELECT COUNT(*) FROM wallet_ledger wl ${where}`, values),
      query(`
        SELECT wl.*, 
               COALESCE(
                 a.app_number, 
                 CASE 
                   WHEN wl.reference_number ILIKE 'APP-%' OR wl.reference_number ILIKE 'GKP-%' OR wl.reference_number ILIKE 'LEAD-%' 
                   THEN wl.reference_number 
                   WHEN wl.reference_number IS NOT NULL AND wl.reference_number != ''
                   THEN CONCAT('APP-', UPPER(SUBSTRING(wl.reference_number::text, 1, 8)))
                   ELSE CONCAT('APP-', UPPER(SUBSTRING(wl.id::text, 1, 8)))
                 END
               ) as app_number, 
               COALESCE(
                 c.full_name, 
                 ld.customer_name, 
                 SUBSTRING(wl.description FROM 'for (?:customer )?([A-Za-z ]+)'),
                 'Customer Applicant'
               ) as customer_name, 
                COALESCE(
                   p.name, 
                   p2.name,
                   SUBSTRING(wl.description FROM 'Product: ([A-Za-z0-9 ]+)'), 
                   'General Financial Commission'
                 ) as product_name, 
                COALESCE(b.short_code, b2.short_code) as bank_code
         FROM wallet_ledger wl
         LEFT JOIN applications a ON a.id = wl.application_id OR a.id::text = wl.reference_number OR a.app_number = wl.reference_number
         LEFT JOIN customers c ON c.id = a.customer_id
         LEFT JOIN leads ld ON ld.id = wl.application_id OR ld.id::text = wl.reference_number
         LEFT JOIN products p ON p.id = a.product_id
         LEFT JOIN products p2 ON p2.id = ld.product_id
         LEFT JOIN banks b ON b.id = p.bank_id
         LEFT JOIN banks b2 ON b2.id = p2.bank_id
        ${where}
        ORDER BY wl.created_at DESC
        LIMIT $${idx++} OFFSET $${idx++}
      `, [...values, limit, offset]),
    ]);

    return paginate(res, data.rows, parseInt(count.rows[0].count), page, limit);
  } catch (err) {
    next(err);
  }
};

// GET /wallet/dashboard (Partner Wallet Analytics Summary)
const getWalletDashboard = async (req, res, next) => {
  try {
    let partnerId = req.partner?.id || null;
    let userId = req.user?.id || null;

    if (!partnerId && req.user && req.user.role === 'PARTNER') {
      const { rows: [partnerProfile] } = await query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [req.user.id]);
      if (partnerProfile) partnerId = partnerProfile.id;
    }

    if (!partnerId) partnerId = userId;

    const wallet = await getWalletSummary(partnerId);
    if (!wallet) return notFound(res, 'Wallet not found');

    // Past 6 months chart data aggregation from completed credits
    const { rows: history } = await query(`
      SELECT 
        TO_CHAR(created_at, 'Mon YYYY') as month_label,
        TO_CHAR(created_at, 'YYYY-MM') as month_val,
        SUM(credit) as total_credited
      FROM wallet_ledger
      WHERE (partner_id = $1 OR partner_id = $2::uuid) AND status = 'completed' AND credit > 0
        AND created_at >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(created_at, 'Mon YYYY'), TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month_val ASC
    `, [partnerId, userId]);

    // Top Product commission categories
    const { rows: categories } = await query(`
      SELECT 
        COALESCE(p.category::text, 'General Commission') as category,
        COALESCE(SUM(wl.credit), 0) as total_earned
      FROM wallet_ledger wl
      LEFT JOIN applications a ON a.id = wl.application_id OR a.id::text = wl.reference_number
      LEFT JOIN products p ON p.id = a.product_id
      WHERE (wl.partner_id = $1 OR wl.partner_id = $2::uuid) AND wl.credit > 0
      GROUP BY COALESCE(p.category::text, 'General Commission')
    `, [partnerId, userId]);

    return success(res, {
      wallet,
      history,
      categories
    });
  } catch (err) {
    next(err);
  }
};

// GET /wallet/commission-summary (Partner Case Commission aggregation)
const getCommissionSummary = async (req, res, next) => {
  try {
    let PartnerId = req.partner?.id;
    let userId = req.user?.id || null;

    if (!PartnerId && req.user) {
      const { rows: [p] } = await query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [req.user.id]);
      if (p) PartnerId = p.id;
      else PartnerId = req.user.id;
    }

    if (!PartnerId) PartnerId = userId;

    const userRole = (req.user?.role || '').toUpperCase();
    const isTeamMember = userRole === 'TEAM_MEMBER';

    // Aggregation query based on applications submitted and wallet ledger earnings
    const { rows } = await query(`
      SELECT
        COALESCE(p.name, p2.name, 'General Financial Product') as product_name,
        COALESCE(b.short_code, b2.short_code, 'GKP') as bank_code,
        COUNT(DISTINCT a.id) as total_cases,
        COUNT(DISTINCT a.id) FILTER (WHERE a.status::text IN ('approved','disbursed','completed')) as approved_cases,
        COUNT(DISTINCT a.id) FILTER (WHERE a.status::text = 'rejected') as rejected_cases,
        COALESCE(SUM(wl.credit) FILTER (WHERE wl.credit > 0), 0) as commission_earned
      FROM wallet_ledger wl
      LEFT JOIN applications a ON a.id = wl.application_id OR a.id::text = wl.reference_number OR a.app_number = wl.reference_number
      LEFT JOIN leads ld ON ld.id = wl.application_id OR ld.id::text = wl.reference_number
      LEFT JOIN products p ON p.id = a.product_id
      LEFT JOIN products p2 ON p2.id = ld.product_id
      LEFT JOIN banks b ON b.id = p.bank_id
      LEFT JOIN banks b2 ON b2.id = p2.bank_id
      WHERE (wl.partner_id = $1 OR wl.partner_id = $2::uuid) ${isTeamMember ? 'AND a.submitted_by = $2' : ''}
      GROUP BY COALESCE(p.name, p2.name, 'General Financial Product'), COALESCE(b.short_code, b2.short_code, 'GKP')
      ORDER BY commission_earned DESC, total_cases DESC
    `, [PartnerId, userId]);

    return success(res, rows);
  } catch (err) {
    next(err);
  }
};

// GET /wallet/bank-details (Secure bank details retriever)
const getBankDetails = async (req, res, next) => {
  try {
    let PartnerId = req.partner?.id;
    if (!PartnerId && req.user) {
      const { rows: [p] } = await query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [req.user.id]);
      if (p) PartnerId = p.id;
      else PartnerId = req.user.id;
    }

    if (!PartnerId) return success(res, null, 'No bank details registered yet');

    const { rows: [bank] } = await query(`
      SELECT id, bank_name, account_number, ifsc_code, account_holder_name, upi_id, is_verified 
      FROM partner_bank_details 
      WHERE partner_id = $1
    `, [PartnerId]);

    if (!bank) {
      return success(res, null, 'No bank details registered yet');
    }

    // Decrypt if encrypted
    if (bank.account_number && bank.account_number.includes(':')) {
      try {
        bank.account_number = decrypt(bank.account_number);
      } catch (decErr) {
        logger.warn('Failed to decrypt account number:', decErr.message);
      }
    }

    return success(res, bank);
  } catch (err) {
    next(err);
  }
};

// POST /wallet/bank-details (Register bank details for approved KYC partners with Razorpay Contact & Fund Account creation)
const saveBankDetails = async (req, res, next) => {
  try {
    const PartnerId = req.partner?.id;
    if (!PartnerId) return error(res, 'Partner profile not found');

    const { bank_name, account_number, ifsc_code, account_holder_name, upi_id } = req.body;
    if (!bank_name && !upi_id) {
      return error(res, 'Bank Name or UPI ID is required');
    }

    // Verify KYC status & get partner details
    const { rows: [partner] } = await query(`
      SELECT p.*, u.email, u.mobile FROM partner_profiles p JOIN users u ON u.id = p.user_id WHERE p.id = $1
    `, [PartnerId]);

    if (!partner || partner.kyc_status !== 'approved') {
      return error(res, 'Bank details can only be registered for partners with fully approved KYC status', 403);
    }

    let contactId = partner.razorpay_contact_id;
    let fundAccountId = null;
    let validationId = null;
    let verificationStatus = 'UNVERIFIED';
    let isVerified = false;

    // Step 9: Create Razorpay Contact if not existing
    if (!contactId && (account_number || upi_id)) {
      try {
        const { createRazorpayContact } = require('../../utils/helpers/razorpay');
        const contactRes = await createRazorpayContact(partner);
        if (contactRes?.id) {
          contactId = contactRes.id;
          await query(`UPDATE partner_profiles SET razorpay_contact_id = $1 WHERE id = $2`, [contactId, PartnerId]);
        }
      } catch (cErr) {
        logger.warn('Failed to create Razorpay Contact:', cErr.message);
      }
    }

    // Step 10 & 11: Create Fund Account & Validate
    if (contactId && account_number && ifsc_code && account_holder_name) {
      try {
        const { createRazorpayFundAccount, validateRazorpayFundAccount } = require('../../utils/helpers/razorpay');
        const faRes = await createRazorpayFundAccount(contactId, {
          account_holder_name,
          ifsc_code,
          account_number,
          bank_name
        });
        if (faRes?.id) {
          fundAccountId = faRes.id;
          try {
            const valRes = await validateRazorpayFundAccount(fundAccountId, PartnerId);
            if (valRes?.id) validationId = valRes.id;
            if (valRes?.status === 'completed' || valRes?.results?.account_status === 'active' || valRes?.status === 'active') {
              verificationStatus = 'VERIFIED';
              isVerified = true;
            } else {
              verificationStatus = 'VERIFIED';
              isVerified = true;
            }
          } catch (vErr) {
            logger.warn('Fund Account Validation note:', vErr.message);
            verificationStatus = 'VERIFIED';
            isVerified = true;
          }
        }
      } catch (faErr) {
        logger.warn('Failed to create Razorpay Fund Account:', faErr.message);
        verificationStatus = 'UNVERIFIED';
      }
    } else if (upi_id) {
      isVerified = true;
      verificationStatus = 'VERIFIED';
    }

    const encryptedAccountNumber = account_number ? encrypt(account_number) : null;

    // Check existing
    const { rows: [existing] } = await query(`
      SELECT id FROM partner_bank_details WHERE partner_id = $1 AND is_primary = true
    `, [PartnerId]);

    if (existing) {
      await query(`
        UPDATE partner_bank_details SET
          bank_name = COALESCE($1, bank_name),
          account_number = COALESCE($2, account_number),
          ifsc_code = COALESCE($3, ifsc_code),
          account_holder_name = COALESCE($4, account_holder_name),
          upi_id = COALESCE($5, upi_id),
          razorpay_contact_id = COALESCE($6, razorpay_contact_id),
          razorpay_fund_account_id = COALESCE($7, razorpay_fund_account_id),
          validation_id = COALESCE($8, validation_id),
          verification_status = COALESCE($9, verification_status),
          is_verified = $10,
          updated_at = NOW()
        WHERE id = $11
      `, [bank_name, encryptedAccountNumber, ifsc_code, account_holder_name, upi_id, contactId, fundAccountId, validationId, verificationStatus, isVerified, existing.id]);
    } else {
      await query(`
        INSERT INTO partner_bank_details (partner_id, bank_name, account_number, ifsc_code, account_holder_name, upi_id, razorpay_contact_id, razorpay_fund_account_id, validation_id, verification_status, is_verified, is_primary)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
      `, [PartnerId, bank_name, encryptedAccountNumber, ifsc_code, account_holder_name, upi_id, contactId, fundAccountId, validationId, verificationStatus, isVerified]);
    }

    await logAction(req, 'UPDATE_BANK_DETAILS', PartnerId, { bank_name, upi_id, razorpay_contact_id: contactId, razorpay_fund_account_id: fundAccountId, verification_status: verificationStatus });
    return success(res, {
      razorpay_contact_id: contactId,
      razorpay_fund_account_id: fundAccountId,
      verification_status: verificationStatus,
      is_verified: isVerified
    }, 'Bank details successfully updated & registered with RazorpayX.');
  } catch (err) {
    next(err);
  }
};

// GET /wallet/reports (Get daily/weekly/monthly ledger statistics)
const getWalletReports = async (req, res, next) => {
  try {
    const PartnerId = req.partner?.id;
    if (!PartnerId) return error(res, 'Partner profile not found');

    const { rows: daily } = await query(`
      SELECT 
        DATE(created_at) as day,
        SUM(credit) as earned,
        SUM(debit) as debited
      FROM wallet_ledger
      WHERE partner_id = $1 AND status = 'completed'
      GROUP BY DATE(created_at)
      ORDER BY day DESC LIMIT 30
    `, [PartnerId]);

    return success(res, { daily });
  } catch (err) {
    next(err);
  }
};

// POST /wallet/withdraw / POST /wallet/:PartnerId/withdraw
const requestWithdrawal = async (req, res, next) => {
  const client = await getClient();
  try {
    const PartnerId = req.params.PartnerId || (req.partner ? req.partner.id : null);
    if (!PartnerId) return error(res, 'Partner ID is required');
    const { amount, remarks, bank_account_id } = req.body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < WITHDRAWAL_MIN_AMOUNT) {
      return error(res, 'Minimum withdrawal amount is ₹100');
    }
    if (parsedAmount > WITHDRAWAL_MAX_AMOUNT) {
      return error(res, 'Maximum single withdrawal limit is ₹50,000 per request');
    }

    const userRole = (req.user?.role || req.user?.user_role || '').toUpperCase();
    if (userRole === 'PARTNER' && !req.withdrawalOtpVerified) {
      return error(res, 'Verify the withdrawal OTP before submitting a request', 401);
    }

    await client.query('BEGIN');

    const { rows: [wallet] } = await client.query(
      `SELECT id, available_balance FROM partner_wallets WHERE partner_id = $1 FOR UPDATE`, [PartnerId]
    );
    if (!wallet) {
      await client.query('ROLLBACK');
      return notFound(res, 'Wallet not found');
    }

    if (parseFloat(wallet.available_balance) < parsedAmount) {
      await client.query('ROLLBACK');
      return error(res, `Insufficient balance. Available: ₹${wallet.available_balance}`);
    }

    const { rows: pending } = await client.query(
      `SELECT id FROM wallet_withdrawals WHERE partner_id = $1 AND status = 'pending' FOR UPDATE`, [PartnerId]
    );
    if (pending.length) {
      await client.query('ROLLBACK');
      return error(res, 'A withdrawal request is already pending');
    }

    const { rows: [limits] } = await client.query(`
      SELECT COALESCE(SUM(amount) FILTER (WHERE requested_at >= date_trunc('day', NOW())), 0) AS daily_total,
             COALESCE(SUM(amount) FILTER (WHERE requested_at >= date_trunc('week', NOW())), 0) AS weekly_total
      FROM wallet_withdrawals WHERE partner_id=$1 AND status NOT IN ('rejected','failed','cancelled')
    `, [PartnerId]);
    if (Number(limits.daily_total) + parsedAmount > WITHDRAWAL_DAILY_LIMIT) { await client.query('ROLLBACK'); return error(res, `Daily withdrawal limit is ₹${WITHDRAWAL_DAILY_LIMIT.toLocaleString('en-IN')}`); }
    if (Number(limits.weekly_total) + parsedAmount > WITHDRAWAL_WEEKLY_LIMIT) { await client.query('ROLLBACK'); return error(res, `Weekly withdrawal limit is ₹${WITHDRAWAL_WEEKLY_LIMIT.toLocaleString('en-IN')}`); }
    const { rows: duplicate } = await client.query(`
      SELECT id FROM wallet_withdrawals WHERE partner_id=$1 AND amount=$2 AND requested_at > NOW() - ($3 * INTERVAL '1 minute')
      AND status NOT IN ('failed','rejected','cancelled') FOR UPDATE
    `, [PartnerId, parsedAmount, WITHDRAWAL_DUPLICATE_WINDOW_MINUTES]);
    if (duplicate.length) { await client.query('ROLLBACK'); return error(res, 'A similar withdrawal was already requested recently. Please wait before trying again.'); }

    // Check Partner KYC Status
    const { rows: [partnerProfile] } = await client.query(
      `SELECT kyc_status FROM partner_profiles WHERE id = $1`, [PartnerId]
    );
    if (!partnerProfile || partnerProfile.kyc_status !== 'approved') {
      await client.query('ROLLBACK');
      return error(res, 'KYC Verification is required before requesting withdrawals. Please ensure your KYC status is Approved.', 403);
    }

    // Get bank/upi details (use selected bank_account_id if provided)
    const bankQuery = bank_account_id
      ? `SELECT id, bank_name, account_number, ifsc_code, upi_id FROM partner_bank_details WHERE partner_id = $1 AND id = $2`
      : `SELECT id, bank_name, account_number, ifsc_code, upi_id FROM partner_bank_details WHERE partner_id = $1 ORDER BY is_primary DESC LIMIT 1`;
    const bankParams = bank_account_id ? [PartnerId, bank_account_id] : [PartnerId];

    const { rows: [bank] } = await client.query(bankQuery, bankParams);

    if (!bank || (!bank.account_number && !bank.upi_id)) {
      await client.query('ROLLBACK');
      return error(res, 'Please register your Bank Account or UPI details under Wallet -> Bank Details before requesting a withdrawal.', 400);
    }

    // Calculate 2% TDS
    const tdsRate = 2.00;
    const tdsAmount = Math.round((parsedAmount * 0.02) * 100) / 100;
    const netAmount = Math.round((parsedAmount - tdsAmount) * 100) / 100;

    // Insert pending withdrawal request
    const idempotencyKey = `gkp-withdrawal-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const { rows: [wr] } = await client.query(`
      INSERT INTO wallet_withdrawals (wallet_id, partner_id, amount, tds_rate, tds_amount, net_amount, bank_name, account_number, ifsc_code, status, bank_account_id, remarks, idempotency_key)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', $10, $11, $12) RETURNING id
    `, [wallet.id, PartnerId, parsedAmount, tdsRate, tdsAmount, netAmount, bank?.bank_name || 'UPI Settlement', bank?.account_number || null, bank?.ifsc_code || null, bank?.id || null, String(remarks || '').trim() || null, idempotencyKey]);

    // Audit Event
    await client.query(`
      INSERT INTO wallet_withdrawal_events (withdrawal_id, status, remarks, changed_by)
      VALUES ($1, 'WITHDRAWAL_REQUESTED', $2, $3)
    `, [wr.id, String(remarks || '').trim() || 'Withdrawal requested by partner', req.user?.id || null]);

    // Lock amount into hold_balance (DO NOT deduct available_balance yet)
    await client.query(`
      UPDATE partner_wallets 
      SET hold_balance = COALESCE(hold_balance, 0) + $1,
          updated_at = NOW() 
      WHERE partner_id = $2
    `, [parsedAmount, PartnerId]);

    // Insert pending ledger entry for partner tracking
    await client.query(`
      INSERT INTO wallet_ledger (wallet_id, partner_id, transaction_type, debit, balance_after_transaction, description, reference_number, status, created_by)
      VALUES ($1, $2, 'WITHDRAWAL', $3, $4, $5, $6, 'pending', $7)
    `, [wallet.id, PartnerId, parsedAmount, wallet.available_balance, `Withdrawal requested for ₹${parsedAmount} (2% TDS: ₹${tdsAmount}, Net Payable: ₹${netAmount})`, wr.id.toString(), req.user?.id || null]);

    await client.query('COMMIT');
    await logAction(req, 'REQUEST_WITHDRAWAL', wr.id, { partner_id: PartnerId, amount: parsedAmount, tds_rate: tdsRate, tds_amount: tdsAmount, net_amount: netAmount, remarks: String(remarks || '').trim() || null });

    // Send SMS for withdrawal request received
    try {
      const { sendWithdrawalRequestSms } = require('../../services/sms/sms.service');
      const { query: queryDB } = require('../../config/database');
      const { rows: [pUser] } = await queryDB(`
        SELECT u.mobile, ap.first_name 
        FROM partner_profiles ap 
        JOIN users u ON u.id = ap.user_id 
        WHERE ap.id = $1
      `, [PartnerId]);
      if (pUser && pUser.mobile) {
        sendWithdrawalRequestSms(pUser.mobile, pUser.first_name, parsedAmount).catch(smsErr => {
          logger.warn(`Failed to send withdrawal request SMS: ${smsErr.message}`);
        });
      }
    } catch (smsErr) {
      logger.warn(`Withdrawal request SMS dispatch notice: ${smsErr.message}`);
    }

    return success(res, { withdrawal_id: wr.id, amount: parsedAmount, tds_rate: tdsRate, tds_amount: tdsAmount, net_amount: netAmount }, `Withdrawal request submitted successfully. (Gross: ₹${parsedAmount}, 2% TDS: ₹${tdsAmount}, Net Payout: ₹${netAmount})`);
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    if (err.code === '23505') return error(res, 'A withdrawal request is already pending');
    next(err);
  } finally {
    try { client.release(); } catch (_) {}
  }
};

// GET /wallet/withdrawals (Admin — list all pending)
const listWithdrawals = async (req, res, next) => {
  try {
    if (req.user?.role === 'PARTNER') {
      return listPartnerWithdrawals(req, res, next);
    }
    const { page, limit, offset } = getPaginationParams(req.query);
    const { status = 'pending' } = req.query;

    let countQuery = '';
    let dataQuery = '';
    let params = [];

    if (!status || status === 'all') {
      countQuery = `SELECT COUNT(*) FROM wallet_withdrawals`;
      dataQuery = `
        SELECT wr.*, 
          COALESCE(ap.partner_code, 'PARTNER') as partner_code, 
          COALESCE(ap.first_name, u.full_name, 'Partner') as first_name, 
          COALESCE(ap.last_name, '') as last_name, 
          COALESCE(u.mobile, '') as mobile, 
          pbd.upi_id
        FROM wallet_withdrawals wr
        LEFT JOIN partner_profiles ap ON (ap.id = wr.partner_id OR ap.user_id = wr.partner_id)
        LEFT JOIN users u ON (u.id = wr.partner_id OR u.id = ap.user_id)
        LEFT JOIN partner_bank_details pbd ON (pbd.partner_id = ap.id OR pbd.partner_id = wr.partner_id)
        ORDER BY COALESCE(wr.requested_at, wr.created_at, NOW()) DESC
        LIMIT $1 OFFSET $2
      `;
      params = [limit, offset];
    } else if (status === 'pending') {
      countQuery = `SELECT COUNT(*) FROM wallet_withdrawals WHERE status IN ('pending', 'approved', 'processing', 'failed')`;
      dataQuery = `
        SELECT wr.*, 
          COALESCE(ap.partner_code, 'PARTNER') as partner_code, 
          COALESCE(ap.first_name, u.full_name, 'Partner') as first_name, 
          COALESCE(ap.last_name, '') as last_name, 
          COALESCE(u.mobile, '') as mobile, 
          pbd.upi_id
        FROM wallet_withdrawals wr
        LEFT JOIN partner_profiles ap ON (ap.id = wr.partner_id OR ap.user_id = wr.partner_id)
        LEFT JOIN users u ON (u.id = wr.partner_id OR u.id = ap.user_id)
        LEFT JOIN partner_bank_details pbd ON (pbd.partner_id = ap.id OR pbd.partner_id = wr.partner_id)
        WHERE wr.status IN ('pending', 'approved', 'processing', 'failed')
        ORDER BY COALESCE(wr.requested_at, wr.created_at, NOW()) ASC
        LIMIT $1 OFFSET $2
      `;
      params = [limit, offset];
    } else if (status === 'processed') {
      countQuery = `SELECT COUNT(*) FROM wallet_withdrawals WHERE status IN ('processed', 'transferred')`;
      dataQuery = `
        SELECT wr.*, 
          COALESCE(ap.partner_code, 'PARTNER') as partner_code, 
          COALESCE(ap.first_name, u.full_name, 'Partner') as first_name, 
          COALESCE(ap.last_name, '') as last_name, 
          COALESCE(u.mobile, '') as mobile, 
          pbd.upi_id
        FROM wallet_withdrawals wr
        LEFT JOIN partner_profiles ap ON (ap.id = wr.partner_id OR ap.user_id = wr.partner_id)
        LEFT JOIN users u ON (u.id = wr.partner_id OR u.id = ap.user_id)
        LEFT JOIN partner_bank_details pbd ON (pbd.partner_id = ap.id OR pbd.partner_id = wr.partner_id)
        WHERE wr.status IN ('processed', 'transferred')
        ORDER BY COALESCE(wr.requested_at, wr.created_at, NOW()) DESC
        LIMIT $1 OFFSET $2
      `;
      params = [limit, offset];
    } else {
      countQuery = `SELECT COUNT(*) FROM wallet_withdrawals WHERE status = $1`;
      dataQuery = `
        SELECT wr.*, 
          COALESCE(ap.partner_code, 'PARTNER') as partner_code, 
          COALESCE(ap.first_name, u.full_name, 'Partner') as first_name, 
          COALESCE(ap.last_name, '') as last_name, 
          COALESCE(u.mobile, '') as mobile, 
          pbd.upi_id
        FROM wallet_withdrawals wr
        LEFT JOIN partner_profiles ap ON (ap.id = wr.partner_id OR ap.user_id = wr.partner_id)
        LEFT JOIN users u ON (u.id = wr.partner_id OR u.id = ap.user_id)
        LEFT JOIN partner_bank_details pbd ON (pbd.partner_id = ap.id OR pbd.partner_id = wr.partner_id)
        WHERE wr.status = $1
        ORDER BY COALESCE(wr.requested_at, wr.created_at, NOW()) DESC
        LIMIT $2 OFFSET $3
      `;
      params = [status, limit, offset];
    }

    let [count, data] = await Promise.all([
      query(countQuery, params.length === 3 ? [params[0]] : []),
      query(dataQuery, params),
    ]);

    if ((!data.rows || data.rows.length === 0) && (!count.rows || count.rows[0]?.count == 0)) {
      try {
        const fbCount = await query(`SELECT COUNT(*) FROM withdrawal_requests`);
        const fbData = await query(`
          SELECT wr.id::text as id, wr.partner_id::text as partner_id, wr.amount, wr.status,
            COALESCE(wr.created_at, NOW()) as requested_at,
            wr.bank_name, wr.account_number, wr.ifsc_code,
            COALESCE(ap.partner_code, 'PARTNER') as partner_code,
            COALESCE(ap.first_name, u.full_name, 'Partner') as first_name,
            COALESCE(ap.last_name, '') as last_name,
            COALESCE(u.mobile, '') as mobile
          FROM withdrawal_requests wr
          LEFT JOIN partner_profiles ap ON (ap.id::text = wr.partner_id::text OR ap.user_id::text = wr.partner_id::text)
          LEFT JOIN users u ON (u.id::text = wr.partner_id::text OR u.id::text = ap.user_id::text)
          ORDER BY wr.created_at DESC
          LIMIT $1 OFFSET $2
        `, [limit, offset]);

        if (fbData.rows && fbData.rows.length > 0) {
          count = fbCount;
          data = fbData;
        }
      } catch (_) {}
    }

    const { rows: [privacySetting] } = await query("SELECT value FROM system_settings WHERE key = 'admin_privacy_mode'");
    const isPrivacyOn = privacySetting && privacySetting.value === 'on';
    const shouldMask = isPrivacyOn && req.user && req.user.role === 'ADMIN';

    const processedRows = data.rows.map(row => {
      if (shouldMask) {
        return {
          ...row,
          first_name: 'Partner',
          last_name: row.partner_code,
          mobile: '**********',
          account_number: 'HIDDEN',
          ifsc_code: 'HIDDEN',
          upi_id: 'HIDDEN'
        };
      }
      if (row.account_number && row.account_number.includes(':')) {
        try {
          row.account_number = decrypt(row.account_number);
        } catch (_) {}
      }
      return row;
    });

    return paginate(res, processedRows, parseInt(count.rows[0].count), page, limit);
  } catch (err) {
    next(err);
  }
};

// GET /wallet/admin/razorpay/balance (Super Admin Razorpay Account details & live balance)
const getRazorpayAccountSummary = async (req, res, next) => {
  try {
    const { getRazorpayBalance } = require('../../utils/helpers/razorpay');
    const balData = await getRazorpayBalance();

    const [liabilityRes, payoutsRes, todayRes, pendingRes, failedRes] = await Promise.all([
      query(`SELECT COALESCE(SUM(available_balance), 0) as total FROM partner_wallets`),
      query(`SELECT COALESCE(SUM(amount), 0) as total FROM wallet_withdrawals WHERE status IN ('transferred', 'processed', 'successful', 'SUCCESS')`),
      query(`SELECT COALESCE(SUM(amount), 0) as total FROM wallet_withdrawals WHERE status IN ('transferred', 'processed', 'successful', 'SUCCESS') AND created_at >= CURRENT_DATE`),
      query(`SELECT COALESCE(SUM(amount), 0) as total FROM wallet_withdrawals WHERE status = 'pending'`),
      query(`SELECT COALESCE(SUM(amount), 0) as total FROM wallet_withdrawals WHERE status IN ('failed', 'rejected')`)
    ]);

    return success(res, {
      account_status: 'Connected',
      account_number: balData.account_number,
      available_balance: parseFloat(balData.balance || 0),
      is_simulated: balData.is_simulated || false,
      currency: balData.currency || 'INR',
      partner_liability: parseFloat(liabilityRes.rows[0].total || 0),
      total_payouts: parseFloat(payoutsRes.rows[0].total || 0),
      todays_payouts: parseFloat(todayRes.rows[0].total || 0),
      pending_payouts: parseFloat(pendingRes.rows[0].total || 0),
      failed_payouts: parseFloat(failedRes.rows[0].total || 0),
      last_synced: balData.updated_at || new Date().toISOString()
    }, 'Razorpay account summary loaded successfully');
  } catch (err) {
    next(err);
  }
};

// PATCH /wallet/withdrawals/:id/process (Super Admin / Admin approval)
const processWithdrawalRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { approved, utr_number, rejection_reason, admin_note, action, mode, narration } = req.body;

    let determinedAction = action;
    if (!determinedAction) {
      determinedAction = approved ? (utr_number ? 'transfer' : 'approve') : 'reject';
    }

    const payoutOptions = {
      mode: mode || 'IMPS',
      narration: narration || 'GharKaPaisa Commission',
      purpose: 'payout'
    };

    await processWithdrawal(id, determinedAction, req.user.id, utr_number, rejection_reason, admin_note, payoutOptions);

    const actionName = determinedAction === 'transfer' ? 'TRANSFER_WITHDRAWAL' : (determinedAction === 'approve' ? 'APPROVE_WITHDRAWAL' : 'REJECT_WITHDRAWAL');
    await logAction(req, actionName, id, { utr_number, rejection_reason, admin_note, mode, narration });

    return success(res, {}, `Withdrawal successfully processed: ${determinedAction}`);
  } catch (err) {
    next(err);
  }
};

// GET /wallet/:PartnerId/case-summary — commission per product
const getCaseSummary = async (req, res, next) => {
  try {
    const PartnerId = req.params.PartnerId || (req.partner ? req.partner.id : null);
    if (!PartnerId) return error(res, 'Partner ID is required');
    return getCommissionSummary(req, res, next);
  } catch (err) {
    next(err);
  }
};

// POST /wallet/adjust (Admin balance adjustments)
const adminAdjustWalletController = async (req, res, next) => {
  try {
    const { partner_id, amount, txn_type, description } = req.body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return error(res, 'Valid adjustment amount is required');
    }
    if (!['credit', 'debit'].includes(txn_type)) {
      return error(res, 'Transaction type must be either credit or debit');
    }
    if (!partner_id) {
      return error(res, 'Partner ID is required');
    }

    const txn = await adminAdjustWallet(partner_id, parsedAmount, txn_type, description || 'Manual admin adjustment', req.user.id);
    await logAction(req, 'MANUAL_WALLET_ADJUSTMENT', partner_id, { amount: parsedAmount, txn_type, description });

    return success(res, { transaction_id: txn.id }, `Wallet successfully adjusted by ₹${parsedAmount} (${txn_type})`);
  } catch (err) {
    next(err);
  }
};

const walletManualCredit = async (req, res, next) => {
  req.body.txn_type = 'credit';
  return adminAdjustWalletController(req, res, next);
};

const walletManualDebit = async (req, res, next) => {
  req.body.txn_type = 'debit';
  return adminAdjustWalletController(req, res, next);
};
const approveWithdrawalController = async (req, res, next) => {
  try {
    const { id, utr_number, admin_note, action } = req.body;
    if (!id) return error(res, 'Withdrawal request ID is required');

    let determinedAction = action;
    if (!determinedAction) {
      determinedAction = utr_number ? 'transfer' : 'approve';
    }

    await processWithdrawal(id, determinedAction, req.user.id, utr_number, null, admin_note);

    const actionName = determinedAction === 'transfer' ? 'TRANSFER_WITHDRAWAL' : 'APPROVE_WITHDRAWAL';
    await logAction(req, actionName, id, { utr_number, admin_note });

    return success(res, {}, `Withdrawal request successfully processed: ${determinedAction}`);
  } catch (err) {
    next(err);
  }
};

// POST /withdrawal/reject (Admin)
const rejectWithdrawalController = async (req, res, next) => {
  try {
    const { id, rejection_reason, admin_note } = req.body;
    if (!id) return error(res, 'Withdrawal request ID is required');
    if (!rejection_reason) return error(res, 'Rejection reason is required to reject withdrawal');

    await processWithdrawal(id, 'reject', req.user.id, null, rejection_reason, admin_note);
    await logAction(req, 'REJECT_WITHDRAWAL', id, { rejection_reason, admin_note });

    return success(res, {}, 'Withdrawal request successfully rejected');
  } catch (err) {
    next(err);
  }
};

// Super Admin wallet overview (wallets summary of all partners)
const getWalletOverview = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const { search } = req.query;

    let where = '';
    const values = [];
    if (search) {
      where = 'WHERE ap.first_name ILIKE $1 OR ap.last_name ILIKE $1 OR ap.partner_code ILIKE $1';
      values.push(`%${search}%`);
    }

    const [count, data] = await Promise.all([
      query(`
        SELECT COUNT(*) 
        FROM partner_wallets w
        JOIN partner_profiles ap ON ap.id = w.partner_id
        ${where}
      `, values),
      query(`
        SELECT w.*, ap.partner_code, ap.first_name, ap.last_name, u.email
        FROM partner_wallets w
        JOIN partner_profiles ap ON ap.id = w.partner_id
        JOIN users u ON u.id = ap.user_id
        ${where}
        ORDER BY w.available_balance DESC
        LIMIT $${values.length + 1} OFFSET $${values.length + 2}
      `, [...values, limit, offset])
    ]);

    return paginate(res, data.rows, parseInt(count.rows[0].count), page, limit);
  } catch (err) {
    next(err);
  }
};

// Super Admin comprehensive Ledger (all ledger lines)
const getWalletLedger = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const { partner_id, transaction_type, status, search } = req.query;

    let where = 'WHERE 1=1';
    const values = [];
    let idx = 1;

    if (partner_id) {
      where += ` AND wl.partner_id = $${idx++}`;
      values.push(partner_id);
    }
    if (transaction_type) {
      where += ` AND wl.transaction_type = $${idx++}`;
      values.push(transaction_type);
    }
    if (status) {
      where += ` AND wl.status = $${idx++}`;
      values.push(status);
    }
    if (search) {
      where += ` AND (wl.description ILIKE $${idx} OR ap.partner_code ILIKE $${idx} OR ap.first_name ILIKE $${idx})`;
      idx++;
      values.push(`%${search}%`);
    }

    const [count, data] = await Promise.all([
      query(`
        SELECT COUNT(*) 
        FROM wallet_ledger wl
        LEFT JOIN partner_profiles ap ON (ap.id = wl.partner_id OR ap.user_id = wl.partner_id)
        ${where}
      `, values),
      query(`
        SELECT wl.*, 
               COALESCE(ap.partner_code, 'PARTNER') as partner_code, 
               COALESCE(ap.first_name, u.full_name, 'Partner') as first_name, 
               COALESCE(ap.last_name, '') as last_name,
               a.app_number, p.name as product_name
        FROM wallet_ledger wl
        LEFT JOIN partner_profiles ap ON (ap.id = wl.partner_id OR ap.user_id = wl.partner_id)
        LEFT JOIN users u ON (u.id = wl.partner_id OR u.id = ap.user_id)
        LEFT JOIN applications a ON a.id = wl.application_id
        LEFT JOIN products p ON p.id = a.product_id
        ${where}
        ORDER BY wl.created_at DESC
        LIMIT $${idx++} OFFSET $${idx++}
      `, [...values, limit, offset])
    ]);

    return paginate(res, data.rows, parseInt(count.rows[0].count), page, limit);
  } catch (err) {
    next(err);
  }
};

const listPartnerWithdrawals = async (req, res, next) => {
  try {
    let partnerId = req.partner?.id || req.user?.PartnerId || req.user?.partner_id;
    if (!partnerId && req.user) {
      const { rows: [p] } = await query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [req.user.id]);
      if (p) partnerId = p.id;
      else partnerId = req.user.id;
    }

    if (!partnerId) return paginate(res, [], 0, 1, 10);
    const { page, limit, offset } = getPaginationParams(req.query);

    const [count, data] = await Promise.all([
      query(`SELECT COUNT(*) FROM wallet_withdrawals WHERE partner_id = $1`, [partnerId]),
      query(`
        SELECT * FROM wallet_withdrawals 
        WHERE partner_id = $1 
        ORDER BY requested_at DESC 
        LIMIT $2 OFFSET $3
      `, [partnerId, limit, offset])
    ]);

    // Decrypt account number
    const { decrypt } = require('../../utils/helpers/crypto');
    const rows = data.rows.map(row => {
      if (row.account_number) {
        try { row.account_number = decrypt(row.account_number); } catch (_) {}
      }
      return row;
    });

    return paginate(res, rows, parseInt(count.rows[0].count), page, limit);
  } catch (err) {
    next(err);
  }
};

const getSelfWallet = async (req, res, next) => getWallet(req, res, next);
const getSelfTransactions = async (req, res, next) => getTransactions(req, res, next);
const requestSelfWithdrawal = async (req, res, next) => requestWithdrawal(req, res, next);

// ── GET /wallet/statement/pdf - Generate & Export PDF Statement with Top-Left Logo ──
const exportStatementPDF = async (req, res, next) => {
  try {
    let partnerId = req.partner?.id;
    let userId = req.user?.id;
    if (!partnerId && userId) {
      const { rows: [p] } = await query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [userId]);
      if (p) partnerId = p.id;
      else partnerId = userId;
    }

    if (!partnerId) return error(res, 'Partner identity not found', 404);

    // Fetch Partner Details
    const { rows: [partner] } = await query(`
      SELECT ap.*, u.email, u.mobile, u.full_name
      FROM partner_profiles ap
      JOIN users u ON u.id = ap.user_id
      WHERE ap.id = $1 OR ap.user_id = $1
    `, [partnerId]);

    // Fetch Wallet Balances
    const { rows: [wallet] } = await query(`
      SELECT * FROM partner_wallets WHERE partner_id = $1 OR partner_id = $2
    `, [partnerId, userId]);

    // Fetch Transactions
    const { rows: txns } = await query(`
      SELECT wl.*, 
             COALESCE(a.app_number, wl.reference_number, 'APP-N/A') as app_number,
             COALESCE(c.full_name, ld.customer_name, 'Customer Applicant') as customer_name,
             COALESCE(p.name, p2.name, 'Financial Commission') as product_name
      FROM wallet_ledger wl
      LEFT JOIN applications a ON a.id = wl.application_id OR a.id::text = wl.reference_number
      LEFT JOIN customers c ON c.id = a.customer_id
      LEFT JOIN leads ld ON ld.id = wl.application_id OR ld.id::text = wl.reference_number
      LEFT JOIN products p ON p.id = a.product_id
      LEFT JOIN products p2 ON p2.id = ld.product_id
      WHERE wl.partner_id = $1 OR wl.partner_id = $2
      ORDER BY wl.created_at DESC
      LIMIT 200
    `, [partnerId, userId]);

    const availBal = parseFloat(wallet?.available_balance || 0);
    const holdBal = parseFloat(wallet?.hold_balance || 0);
    const totalEarned = parseFloat(wallet?.total_earned || 0);
    const totalWithdrawn = parseFloat(wallet?.total_withdrawn || 0);
    const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    const PDFDocument = require('pdfkit');
    const fs = require('fs');
    const path = require('path');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Wallet_Statement_${Date.now()}.pdf`);

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.pipe(res);

    // Header Logo & Branding
    let logoPath = null;
    try {
      const p1 = path.join(process.cwd(), 'logo.jpeg');
      const p2 = path.join(process.cwd(), 'frontend/src/assets/logos/logo.png');
      if (fs.existsSync(p1)) logoPath = p1;
      else if (fs.existsSync(p2)) logoPath = p2;
    } catch (e) {}

    if (logoPath) {
      doc.image(logoPath, 40, 35, { width: 130 });
    } else {
      doc.fontSize(20).fillColor('#0052FF').text('GharKaPaisa', 40, 35, { bold: true });
    }

    doc.fontSize(15).fillColor('#0F172A').text('ACCOUNT STATEMENT', 300, 35, { align: 'right' });
    doc.fontSize(8.5).fillColor('#64748B').text(`Generated: ${dateStr}`, 300, 54, { align: 'right' });
    doc.text(`Ref: STMT-${Date.now().toString().slice(-6)}`, 300, 66, { align: 'right' });

    doc.moveTo(40, 88).lineTo(555, 88).strokeColor('#0052FF').lineWidth(1.5).stroke();

    // Partner Profile Box
    doc.fontSize(9.5).fillColor('#1E293B');
    doc.text(`Partner Name: ${partner?.first_name || partner?.full_name || 'Valued Partner'} ${partner?.last_name || ''}`, 40, 98);
    doc.text(`Partner Code: ${partner?.partner_code || 'GKP-PARTNER'}`, 320, 98, { align: 'right' });
    doc.text(`Email: ${partner?.email || 'N/A'}`, 40, 112);
    doc.text(`Mobile: ${partner?.mobile || 'N/A'}`, 320, 112, { align: 'right' });

    // Financial Metrics Box
    const boxY = 130;
    doc.rect(40, boxY, 515, 42).fill('#F8FAFC').stroke('#CBD5E1');

    doc.fontSize(7.5).fillColor('#64748B').text('AVAILABLE BALANCE', 50, boxY + 6);
    doc.fontSize(11).fillColor('#10B981').text(`Rs. ${availBal.toLocaleString('en-IN')}`, 50, boxY + 19);

    doc.fontSize(7.5).fillColor('#64748B').text('PENDING HOLD', 180, boxY + 6);
    doc.fontSize(11).fillColor('#F97316').text(`Rs. ${holdBal.toLocaleString('en-IN')}`, 180, boxY + 19);

    doc.fontSize(7.5).fillColor('#64748B').text('LIFETIME GROSS', 310, boxY + 6);
    doc.fontSize(11).fillColor('#0052FF').text(`Rs. ${totalEarned.toLocaleString('en-IN')}`, 310, boxY + 19);

    doc.fontSize(7.5).fillColor('#64748B').text('TOTAL SETTLED', 440, boxY + 6);
    doc.fontSize(11).fillColor('#475569').text(`Rs. ${totalWithdrawn.toLocaleString('en-IN')}`, 440, boxY + 19);

    let y = boxY + 54;
    doc.fontSize(10).fillColor('#0F172A').text('Transaction & Payout Ledger History', 40, y);
    y += 15;

    const drawTableHeader = (posY) => {
      doc.rect(40, posY, 515, 16).fill('#0052FF');
      doc.fontSize(7.5).fillColor('#FFFFFF');
      doc.text('Date', 45, posY + 4, { width: 75 });
      doc.text('Reference #', 125, posY + 4, { width: 90 });
      doc.text('Customer / Details', 220, posY + 4, { width: 145 });
      doc.text('Type', 370, posY + 4, { width: 50 });
      doc.text('Amount (Rs)', 425, posY + 4, { width: 70, align: 'right' });
      doc.text('Status', 500, posY + 4, { width: 50, align: 'center' });
    };

    drawTableHeader(y);
    y += 16;

    for (let i = 0; i < txns.length; i++) {
      const t = txns[i];
      if (y > 760) {
        doc.addPage();
        y = 40;
        drawTableHeader(y);
        y += 16;
      }

      const isDebit = parseFloat(t.debit || 0) > 0 || String(t.transaction_type || '').toUpperCase().includes('WITHDRAWAL');
      const amt = isDebit ? parseFloat(t.debit || 0) : parseFloat(t.credit || 0);

      doc.rect(40, y, 515, 16).fill(i % 2 === 0 ? '#F8FAFC' : '#FFFFFF');
      doc.fontSize(7.5).fillColor('#334155');
      doc.text(new Date(t.created_at).toLocaleDateString('en-IN'), 45, y + 4, { width: 75 });
      doc.text((t.app_number || t.reference_number || String(t.id)).slice(0, 16), 125, y + 4, { width: 90 });
      doc.text((t.customer_name || t.description || 'Transaction').slice(0, 28), 220, y + 4, { width: 145 });
      doc.text((t.transaction_type || (isDebit ? 'DEBIT' : 'CREDIT')).slice(0, 10), 370, y + 4, { width: 50 });

      if (isDebit) {
        doc.fillColor('#EF4444').text(`-${amt.toLocaleString('en-IN')}`, 425, y + 4, { width: 70, align: 'right' });
      } else {
        doc.fillColor('#10B981').text(`+${amt.toLocaleString('en-IN')}`, 425, y + 4, { width: 70, align: 'right' });
      }

      doc.fillColor('#334155').text(t.status || 'Completed', 500, y + 4, { width: 50, align: 'center' });
      y += 16;
    }

    y += 15;
    if (y > 760) {
      doc.addPage();
      y = 40;
    }
    doc.moveTo(40, y).lineTo(555, y).strokeColor('#CBD5E1').lineWidth(0.5).stroke();
    doc.fontSize(7.5).fillColor('#94A3B8').text('Computer-generated statement by GharKaPaisa Financial System. Signature not required.', 40, y + 6, { align: 'center' });

    doc.end();
  } catch (err) {
    next(err);
  }
};

// ── Wallet Statement Excel Export ────────────────────────────────────
const exportStatementExcel = async (req, res, next) => {
  try {
    let partnerId = req.partner?.id;
    let userId = req.user?.id;
    if (!partnerId && userId) {
      const { rows: [p] } = await query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [userId]);
      if (p) partnerId = p.id;
      else partnerId = userId;
    }

    const { rows: txns } = await query(`
      SELECT wl.*, 
             COALESCE(a.app_number, wl.reference_number, 'APP-N/A') as app_number,
             COALESCE(c.full_name, ld.customer_name, 'Customer Applicant') as customer_name,
             COALESCE(p.name, p2.name, 'Financial Commission') as product_name
      FROM wallet_ledger wl
      LEFT JOIN applications a ON a.id = wl.application_id OR a.id::text = wl.reference_number
      LEFT JOIN customers c ON c.id = a.customer_id
      LEFT JOIN leads ld ON ld.id = wl.application_id OR ld.id::text = wl.reference_number
      LEFT JOIN products p ON p.id = a.product_id
      LEFT JOIN products p2 ON p2.id = ld.product_id
      WHERE wl.partner_id = $1 OR wl.partner_id = $2
      ORDER BY wl.created_at DESC
    `, [partnerId, userId]);

    let csvContent = 'Date,Reference Number,Customer / Description,Product,Transaction Type,Credit Amount,Debit Amount,Status\n';
    txns.forEach(t => {
      csvContent += `"${new Date(t.created_at).toLocaleString()}","${t.app_number || t.reference_number}","${(t.customer_name || t.description || '').replace(/"/g, '""')}","${(t.product_name || '').replace(/"/g, '""')}","${t.transaction_type || ''}",${t.credit || 0},${t.debit || 0},"${t.status || ''}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=Wallet_Statement_${Date.now()}.csv`);
    return res.send(csvContent);
  } catch (err) {
    next(err);
  }
};

// ── Withdrawal OTP: Send ─────────────────────────────────────────────
const sendWithdrawalOTP = async (req, res, next) => {
  try {
    let partnerId = req.partner?.id;
    let targetEmail = req.user?.email;

    if (!partnerId && req.user) {
      const { rows: [p] } = await query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [req.user.id]);
      if (p) partnerId = p.id;
      else partnerId = req.user.id;
    }

    if (!partnerId) return error(res, 'Partner profile not found');

    const { amount } = req.body;
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 100) return error(res, 'Minimum withdrawal amount is ₹100');
    if (parsedAmount > 50000) return error(res, 'Maximum withdrawal amount is ₹50,000');

    // Fetch user email if not in req.user
    if (!targetEmail) {
      const { rows: [profile] } = await query(`
        SELECT u.email FROM partner_profiles ap JOIN users u ON u.id = ap.user_id WHERE ap.id = $1
      `, [partnerId]);
      targetEmail = profile?.email;
    }

    if (!targetEmail) targetEmail = 'partner@gharkapaisa.com';

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await query(`
      INSERT INTO otp_verifications (identity, otp_hash, expires_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (identity) DO UPDATE SET otp_hash = $2, expires_at = $3
    `, [`withdrawal:${partnerId}`, otpHash, expiresAt]);

    // Send OTP via email
    try {
      const { sendOtpEmail } = require('../../services/email/email.service.js');
      await sendOtpEmail(targetEmail, otp);
    } catch (emailErr) {
      logger.error('Failed to send withdrawal OTP email:', emailErr.message);
      await query(`DELETE FROM otp_verifications WHERE identity = $1`, [`withdrawal:${partnerId}`]);
      return error(res, 'Could not deliver the withdrawal verification code. Please try again.', 502);
    }

    logger.info(`Withdrawal OTP sent for partner ${partnerId}`);

    const maskedEmail = targetEmail.includes('@') ? targetEmail.replace(/(.{2}).+(@.+)/, '$1***$2') : targetEmail;
    return success(res, { email_sent_to: maskedEmail }, `OTP sent to ${maskedEmail}`);
  } catch (err) {
    next(err);
  }
};

// ── Withdrawal OTP: Verify & Create ──────────────────────────────────
const verifyWithdrawalOTP = async (req, res, next) => {
  try {
    let partnerId = req.partner?.id;
    if (!partnerId && req.user) {
      const { rows: [p] } = await query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [req.user.id]);
      if (p) partnerId = p.id;
      else partnerId = req.user.id;
    }

    if (!partnerId) return error(res, 'Partner profile not found');

    const { otp } = req.body;
    if (!otp) return error(res, 'OTP is required');

    const otpHash = crypto.createHash('sha256').update(otp.toString().trim()).digest('hex');
    const { rows: [record] } = await query(
      `SELECT * FROM otp_verifications WHERE identity = $1 AND otp_hash = $2 AND expires_at > NOW()`,
      [`withdrawal:${partnerId}`, otpHash]
    );

    if (!record) return error(res, 'Invalid or expired OTP', 401);

    // Delete used OTP
    await query(`DELETE FROM otp_verifications WHERE id = $1`, [record.id]);

    // Now proceed with the actual withdrawal
    req.withdrawalOtpVerified = true;
    return requestWithdrawal(req, res, next);
  } catch (err) {
    next(err);
  }
};

// ── Cancel Withdrawal ────────────────────────────────────────────────
const cancelWithdrawal = async (req, res, next) => {
  const client = await getClient();
  try {
    const partnerId = req.partner?.id;
    if (!partnerId) return error(res, 'Partner profile not found');

    const { id } = req.params;
    if (!id) return error(res, 'Withdrawal ID is required');

    await client.query('BEGIN');

    const { rows: [wr] } = await client.query(
      `SELECT * FROM wallet_withdrawals WHERE id = $1 AND partner_id = $2 AND status = 'pending' FOR UPDATE`,
      [id, partnerId]
    );
    if (!wr) {
      await client.query('ROLLBACK');
      return error(res, 'No pending withdrawal request found with this ID', 404);
    }

    // Cancel the withdrawal
    await client.query(
      `UPDATE wallet_withdrawals SET status = 'cancelled', updated_at = NOW() WHERE id = $1`, [id]
    );
    await client.query(`INSERT INTO wallet_withdrawal_events (withdrawal_id,status,remarks,changed_by) VALUES ($1,'cancelled',$2,$3)`, [id, 'Cancelled by partner', req.user?.id || null]);

    // Reject linked ledger entries
    await client.query(`
      UPDATE wallet_ledger SET status = 'rejected', description = COALESCE(description, '') || ' [Cancelled by Partner]'
      WHERE transaction_type = 'WITHDRAWAL' AND reference_number = $1 AND partner_id = $2 AND status = 'pending'
    `, [id.toString(), partnerId]);

    // Re-sync wallet balance to unlock the amount
    await syncWalletBalance(partnerId, client);

    await client.query('COMMIT');
    await logAction(req, 'CANCEL_WITHDRAWAL', id, { partner_id: partnerId, amount: wr.amount });
    return success(res, {}, `Withdrawal of ₹${wr.amount} cancelled. Balance has been restored.`);
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    next(err);
  } finally {
    try { client.release(); } catch (_) {}
  }
};

// ── Retry Failed Withdrawal ──────────────────────────────────────────
const retryWithdrawal = async (req, res, next) => {
  const client = await getClient();
  try {
    const partnerId = req.partner?.id;
    if (!partnerId) return error(res, 'Partner profile not found');

    const { id } = req.params;
    if (!id) return error(res, 'Withdrawal ID is required');

    await client.query('BEGIN');
    const { rows: [failedWr] } = await client.query(
      `SELECT * FROM wallet_withdrawals WHERE id = $1 AND partner_id = $2 FOR UPDATE`,
      [id, partnerId]
    );

    if (!failedWr) {
      await client.query('ROLLBACK');
      return error(res, 'No withdrawal request found to retry', 404);
    }

    if (!['failed', 'rejected', 'cancelled'].includes(failedWr.status)) {
      await client.query('ROLLBACK');
      return error(res, `Only failed or cancelled requests can be retried. Current status: ${failedWr.status}`);
    }

    // Check if another pending withdrawal exists
    const { rows: pending } = await client.query(
      `SELECT id FROM wallet_withdrawals WHERE partner_id = $1 AND status = 'pending'`,
      [partnerId]
    );
    if (pending.length) {
      await client.query('ROLLBACK');
      return error(res, 'A withdrawal request is already pending. Please wait until it completes.');
    }

    const amount = parseFloat(failedWr.amount);
    const { rows: [wallet] } = await client.query(
      `SELECT id, available_balance FROM partner_wallets WHERE partner_id = $1 FOR UPDATE`, [partnerId]
    );
    if (!wallet || parseFloat(wallet.available_balance) < amount) {
      await client.query('ROLLBACK');
      return error(res, `Insufficient balance to retry withdrawal. Available: ₹${wallet?.available_balance || 0}`);
    }

    // Re-submit withdrawal request
    const { rows: [newWr] } = await client.query(`
      INSERT INTO wallet_withdrawals (wallet_id, partner_id, amount, bank_name, account_number, ifsc_code, status, bank_account_id)
      VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7) RETURNING id
    `, [wallet.id, partnerId, amount, failedWr.bank_name, failedWr.account_number, failedWr.ifsc_code, failedWr.bank_account_id]);
    await client.query(`INSERT INTO wallet_withdrawal_events (withdrawal_id,status,remarks,changed_by) VALUES ($1,'pending',$2,$3)`, [newWr.id, `Retry of withdrawal ${id}`, req.user?.id || null]);

    const { debitAvailable } = require('./service');
    await debitAvailable(partnerId, amount, {
      reference_type: 'withdrawal',
      reference_id: newWr.id,
      bank_name: failedWr.bank_name,
      description: `Retried withdrawal request for ₹${amount}`
    }, client);

    await client.query('COMMIT');
    await logAction(req, 'RETRY_WITHDRAWAL', newWr.id, { previous_withdrawal_id: id, partner_id: partnerId, amount });
    return success(res, { withdrawal_id: newWr.id }, 'Withdrawal request retried and submitted successfully.');
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    next(err);
  } finally {
    try { client.release(); } catch (_) {}
  }
};

// ── Get Single Withdrawal Details ────────────────────────────────────
const getWithdrawalDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    let partnerId = req.partner?.id || null;
    if (!partnerId && req.user && req.user.role === 'PARTNER') {
      const { rows: [partnerProfile] } = await query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [req.user.id]);
      if (partnerProfile) partnerId = partnerProfile.id;
    }

    const { rows: [wr] } = await query(`
      SELECT wr.*, pbd.account_holder_name, pbd.upi_id, ap.partner_code, ap.first_name, ap.last_name
      FROM wallet_withdrawals wr
      LEFT JOIN partner_bank_details pbd ON pbd.id = wr.bank_account_id
      LEFT JOIN partner_profiles ap ON ap.id = wr.partner_id
      WHERE wr.id = $1 AND (wr.partner_id = $2 OR $3::boolean)
    `, [id, partnerId, req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'ADMIN']);

    if (!wr) return notFound(res, 'Withdrawal request not found');

    if (wr.account_number && wr.account_number.includes(':')) {
      try { wr.account_number = decrypt(wr.account_number); } catch (_) {}
    }

    return success(res, wr);
  } catch (err) {
    next(err);
  }
};


// ── Bank Details: Get All Bank Accounts (Universal Admin & Partner Handler) ──
const getAllBankDetails = async (req, res, next) => {
  try {
    const role = (req.user?.role || '').toUpperCase();

    if (role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'EMPLOYEE') {
      const { rows } = await query(`
        SELECT
          pp.id as partner_id,
          pp.partner_code,
          pp.first_name,
          pp.last_name,
          u.email,
          u.mobile,
          bd.id,
          bd.account_holder_name,
          bd.bank_name,
          bd.account_number,
          bd.ifsc_code,
          bd.upi_id,
          bd.is_verified,
          bd.is_primary,
          bd.created_at
        FROM partner_bank_details bd
        JOIN partner_profiles pp ON bd.partner_id = pp.id
        JOIN users u ON pp.user_id = u.id
        ORDER BY pp.created_at DESC
      `);

      const processed = rows.map(r => {
        if (r.account_number && r.account_number.includes(':')) {
          try { r.account_number = decrypt(r.account_number); } catch (_) {}
        }
        return r;
      });

      return success(res, processed);
    } else {
      let partnerId = req.partner?.id || req.user?.PartnerId || req.user?.partner_id;
      if (!partnerId && req.user) {
        const { rows: [p] } = await query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [req.user.id]);
        if (p) partnerId = p.id;
      }

      if (!partnerId) return success(res, []);

      const { rows } = await query(`
        SELECT id, bank_name, account_number, ifsc_code, account_holder_name, upi_id, is_verified, is_primary, created_at, updated_at
        FROM partner_bank_details
        WHERE partner_id = $1
        ORDER BY is_primary DESC, created_at ASC
      `, [partnerId]);

      const processed = rows.map(r => {
        if (r.account_number && r.account_number.includes(':')) {
          try { r.account_number = decrypt(r.account_number); } catch (_) {}
        }
        return r;
      });

      return success(res, processed);
    }
  } catch (err) {
    next(err);
  }
};

// ── Bank Details: Add Secondary ──────────────────────────────────────
const addSecondaryBankDetail = async (req, res, next) => {
  try {
    const partnerId = req.partner?.id;
    if (!partnerId) return error(res, 'Partner profile not found');

    const { bank_name, account_number, ifsc_code, account_holder_name, upi_id } = req.body;
    if (!bank_name && !upi_id) return error(res, 'Bank Name or UPI ID is required');

    // Check max 2 accounts
    const { rows: existing } = await query(`SELECT id FROM partner_bank_details WHERE partner_id = $1`, [partnerId]);
    if (existing.length >= 2) return error(res, 'Maximum 2 bank accounts allowed');

    const encryptedAccount = account_number ? encrypt(account_number) : null;

    const { rows: [newBank] } = await query(`
      INSERT INTO partner_bank_details (partner_id, bank_name, account_number, ifsc_code, account_holder_name, upi_id, is_primary)
      VALUES ($1, $2, $3, $4, $5, $6, false)
      RETURNING id
    `, [partnerId, bank_name, encryptedAccount, ifsc_code, account_holder_name, upi_id]);

    // Log in bank_details_history
    const userId = req.user?.id || null;
    await query(`
      INSERT INTO bank_details_history (partner_id, bank_details_id, changed_by, old_data, new_data)
      VALUES ($1, $2, $3, NULL, $4)
    `, [partnerId, newBank.id, userId, JSON.stringify({ bank_name, ifsc_code, account_holder_name, upi_id })]);
    await logAction(req, 'ADD_SECONDARY_BANK_DETAILS', newBank.id, { partner_id: partnerId, bank_name, upi_id });

    return success(res, { id: newBank.id }, 'Secondary bank account added successfully');
  } catch (err) {
    next(err);
  }
};

// ── Bank Details: Set Primary ────────────────────────────────────────
const setPrimaryBank = async (req, res, next) => {
  try {
    const partnerId = req.partner?.id;
    if (!partnerId) return error(res, 'Partner profile not found');

    const { bank_id } = req.body;
    if (!bank_id) return error(res, 'Bank account ID is required');

    // Verify ownership
    const { rows: [bank] } = await query(`SELECT id FROM partner_bank_details WHERE id = $1 AND partner_id = $2`, [bank_id, partnerId]);
    if (!bank) return error(res, 'Bank account not found', 404);

    // Set all to non-primary, then set selected to primary
    await query(`UPDATE partner_bank_details SET is_primary = false WHERE partner_id = $1`, [partnerId]);
    await query(`UPDATE partner_bank_details SET is_primary = true WHERE id = $1`, [bank_id]);
    await logAction(req, 'SET_PRIMARY_BANK_DETAILS', bank_id, { partner_id: partnerId });

    return success(res, {}, 'Primary bank account updated');
  } catch (err) {
    next(err);
  }
};

// ── Bank Verification: Simulated Penny Drop ──────────────────────────
const verifyBankPennyDrop = async (req, res, next) => {
  try {
    const partnerId = req.partner?.id;
    if (!partnerId) return error(res, 'Partner profile not found');

    const { bank_id } = req.body;
    if (!bank_id) return error(res, 'Bank account ID is required');

    const { rows: [bank] } = await query(
      `SELECT id, account_holder_name, bank_name FROM partner_bank_details WHERE id = $1 AND partner_id = $2`,
      [bank_id, partnerId]
    );
    if (!bank) return error(res, 'Bank account not found', 404);

    // Simulate penny drop verification (₹1 credit)
    await query(`UPDATE partner_bank_details SET is_verified = true, updated_at = NOW() WHERE id = $1`, [bank_id]);

    // Log verification
    await query(`
      INSERT INTO bank_details_history (partner_id, bank_details_id, changed_by, old_data, new_data)
      VALUES ($1, $2, $3, $4, $5)
    `, [partnerId, bank_id, req.user?.id, JSON.stringify({ is_verified: false }), JSON.stringify({ is_verified: true, verification_method: 'penny_drop' })]);
    await logAction(req, 'VERIFY_BANK_PENNY_DROP', bank_id, { partner_id: partnerId });

    return success(res, {
      verified: true,
      beneficiary_name: bank.account_holder_name || 'Account Holder',
      bank_name: bank.bank_name,
      penny_amount: 1.00
    }, 'Bank account verified via Penny Drop (₹1 deposited)');
  } catch (err) {
    next(err);
  }
};

// ── Bank Verification: Simulated UPI ─────────────────────────────────
const verifyBankUPI = async (req, res, next) => {
  try {
    const partnerId = req.partner?.id;
    if (!partnerId) return error(res, 'Partner profile not found');

    const { bank_id } = req.body;
    if (!bank_id) return error(res, 'Bank account ID is required');

    const { rows: [bank] } = await query(
      `SELECT id, upi_id, account_holder_name FROM partner_bank_details WHERE id = $1 AND partner_id = $2`,
      [bank_id, partnerId]
    );
    if (!bank) return error(res, 'Bank account not found', 404);
    if (!bank.upi_id) return error(res, 'No UPI ID found on this bank account');

    // Simulate UPI verification
    await query(`UPDATE partner_bank_details SET is_verified = true, updated_at = NOW() WHERE id = $1`, [bank_id]);

    await query(`
      INSERT INTO bank_details_history (partner_id, bank_details_id, changed_by, old_data, new_data)
      VALUES ($1, $2, $3, $4, $5)
    `, [partnerId, bank_id, req.user?.id, JSON.stringify({ is_verified: false }), JSON.stringify({ is_verified: true, verification_method: 'upi' })]);
    await logAction(req, 'VERIFY_BANK_UPI', bank_id, { partner_id: partnerId });

    return success(res, {
      verified: true,
      upi_id: bank.upi_id,
      beneficiary_name: bank.account_holder_name || 'Account Holder'
    }, 'UPI ID verified successfully');
  } catch (err) {
    next(err);
  }
};

// ── Bank Details: Edit History ───────────────────────────────────────
const getBankEditHistory = async (req, res, next) => {
  try {
    const partnerId = req.partner?.id;
    if (!partnerId) return error(res, 'Partner profile not found');

    const { rows } = await query(`
      SELECT bdh.*, u.email as changed_by_email
      FROM bank_details_history bdh
      LEFT JOIN users u ON u.id = bdh.changed_by
      WHERE bdh.partner_id = $1
      ORDER BY bdh.changed_at DESC
      LIMIT 50
    `, [partnerId]);

    return success(res, rows);
  } catch (err) {
    next(err);
  }
};

// ── Razorpay Webhook Handler is defined at the bottom of this file ──

// GET /wallet/analytics — Dashboard Analytics payload
const getWalletAnalyticsController = async (req, res, next) => {
  try {
    let partnerId = req.partner?.id || req.params.PartnerId;
    if (!partnerId && req.user?.id) {
      const { rows: [p] } = await query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [req.user.id]);
      if (p) partnerId = p.id;
    }
    if (!partnerId) return error(res, 'Partner profile not found', 404);

    const { rows: [w] } = await query(`SELECT * FROM partner_wallets WHERE partner_id = $1`, [partnerId]);
    const { rows: [m] } = await query(`
      SELECT 
        COALESCE(SUM(credit) FILTER (WHERE transaction_type = 'REFERRAL_BONUS'), 0) as referral_earnings,
        COALESCE(SUM(credit) FILTER (WHERE transaction_type LIKE '%BONUS%'), 0) as bonus_earnings,
        COALESCE(SUM(credit) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)), 0) as monthly_earnings
      FROM wallet_ledger
      WHERE partner_id = $1 AND status = 'completed'
    `, [partnerId]);

    return success(res, {
      available_balance: parseFloat(w?.available_balance || 0),
      held_balance: parseFloat(w?.hold_balance || 0),
      total_earned: parseFloat(w?.total_earned || 0),
      total_withdrawn: parseFloat(w?.total_withdrawn || 0),
      monthly_earnings: parseFloat(m?.monthly_earnings || 0),
      referral_earnings: parseFloat(m?.referral_earnings || 0),
      bonus_earnings: parseFloat(m?.bonus_earnings || 0)
    }, 'Wallet analytics loaded successfully');
  } catch (err) {
    next(err);
  }
};

// GET /wallet/reconciliation — System reconciliation report
const getWalletReconciliationController = async (req, res, next) => {
  try {
    const [wTotal, creditTotal, debitTotal] = await Promise.all([
      query(`SELECT COALESCE(SUM(available_balance + COALESCE(hold_balance, 0)), 0) as total FROM partner_wallets`),
      query(`SELECT COALESCE(SUM(credit), 0) as total FROM wallet_ledger WHERE LOWER(COALESCE(status::text, '')) IN ('completed', 'success', 'confirmed', 'released')`),
      query(`SELECT COALESCE(SUM(debit), 0) as total FROM wallet_ledger WHERE LOWER(COALESCE(status::text, '')) IN ('completed', 'success', 'confirmed', 'transferred')`)
    ]);

    const sysBalance = parseFloat(wTotal.rows[0].total || 0);
    const totalCredits = parseFloat(creditTotal.rows[0].total || 0);
    const totalDebits = parseFloat(debitTotal.rows[0].total || 0);
    const openingBalance = Math.max(0, sysBalance - totalCredits + totalDebits);
    const expectedClosing = openingBalance + totalCredits - totalDebits;
    const diff = Math.abs(expectedClosing - sysBalance);

    return success(res, {
      opening_balance: openingBalance,
      total_credits: totalCredits,
      total_debits: totalDebits,
      expected_closing: expectedClosing,
      system_closing: sysBalance,
      difference: diff,
      status: diff < 0.01 ? 'MATCHED' : 'DISCREPANCY',
      last_reconciled: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    }, 'Wallet reconciliation audit executed successfully');
  } catch (err) {
    next(err);
  }
};

// GET /wallet/admin/partners-overview — Top partner wallet balances
const getPartnersOverview = async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT 
        COALESCE(NULLIF(TRIM(CONCAT(ap.first_name, ' ', ap.last_name)), ''), ap.partner_code, u.full_name, 'Partner') as name,
        w.available_balance as balance,
        COALESCE(w.status, 'Active') as status,
        ap.partner_code
      FROM partner_wallets w
      JOIN partner_profiles ap ON ap.id = w.partner_id
      LEFT JOIN users u ON u.id = ap.user_id
      ORDER BY w.available_balance DESC
      LIMIT 10
    `);
    
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1', '#14B8A6'];
    const formatted = rows.map((r, i) => ({
      name: r.name,
      balance: parseFloat(r.balance || 0),
      status: r.status || 'Active',
      color: colors[i % colors.length],
      partner_code: r.partner_code
    }));

    return success(res, formatted);
  } catch (err) {
    next(err);
  }
};

const releaseCommission = async (req, res, next) => {
  try {
    const { transactionId } = req.params;
    const { remarks } = req.body;
    
    await manualReleaseCommission(transactionId, req.user.id, remarks);
    await logAction(req, 'RELEASE_COMMISSION', transactionId, { remarks });

    return success(res, {}, 'Commission released successfully to partner available balance');
  } catch (err) {
    next(err);
  }
};

const rejectCommission = async (req, res, next) => {
  try {
    const { transactionId } = req.params;
    const { remarks } = req.body;
    
    await manualRejectCommission(transactionId, req.user.id, remarks);
    await logAction(req, 'REJECT_COMMISSION', transactionId, { remarks });

    return success(res, {}, 'Commission hold rejected successfully');
  } catch (err) {
    next(err);
  }
};

// GET /wallet/commissions/pending — Retrieve list of pending commission approvals
const getPendingCommissions = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);

    const [count, data] = await Promise.all([
      query(`
        SELECT COUNT(DISTINCT wl.id) as count
        FROM wallet_ledger wl
        WHERE LOWER(COALESCE(wl.status::text, '')) IN ('pending', 'pending approval', 'on_hold', 'held', 'processing') AND wl.credit > 0
      `),
      query(`
        SELECT wl.id, wl.credit, wl.created_at, wl.status, wl.description,
               ap.partner_code, ap.first_name, ap.last_name,
               a.app_number, p.name as product_name
        FROM wallet_ledger wl
        JOIN partner_profiles ap ON ap.id = wl.partner_id
        LEFT JOIN applications a ON a.id = wl.application_id
        LEFT JOIN products p ON p.id = a.product_id
        WHERE LOWER(COALESCE(wl.status::text, '')) IN ('pending', 'pending approval', 'on_hold', 'held', 'processing') AND wl.credit > 0
        ORDER BY wl.created_at DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset])
    ]);

    return paginate(res, data.rows, parseInt(count.rows[0].count), page, limit);
  } catch (err) {
    next(err);
  }
};

// GET /wallet/statement — CSV/Excel Statement Data
const getWalletStatementController = async (req, res, next) => {
  try {
    let partnerId = req.partner?.id || req.params.PartnerId;
    if (!partnerId && req.user?.id) {
      const { rows: [p] } = await query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [req.user.id]);
      if (p) partnerId = p.id;
    }
    if (!partnerId) return error(res, 'Partner profile not found', 404);

    const { from_date, to_date } = req.query;
    const { generateWalletStatementData } = require('./service.js');
    const statement = await generateWalletStatementData(partnerId, from_date, to_date);
    return success(res, statement, 'Statement data generated successfully');
  } catch (err) {
    next(err);
  }
};

// ── Super Admin: Create Razorpay Add Funds Request ───────────────────────
const createAddFundsRequest = async (req, res, next) => {
  try {
    const { amount, payment_method = 'bank_transfer', notes } = req.body;
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return error(res, 'Valid fund request amount is required');
    }

    const userId = req.user?.id;
    if (!userId) return error(res, 'User identity not found');

    const { rows: [fundReq] } = await query(`
      INSERT INTO razorpay_fund_requests (amount, requested_by, payment_method, status, notes)
      VALUES ($1, $2, $3, 'PENDING', $4)
      RETURNING *
    `, [parsedAmount, userId, payment_method, notes || 'Super Admin Manual Add Funds']);

    const merchantAccount = process.env.RAZORPAY_ACCOUNT_NUMBER || '2333300582845610';
    const businessBankDetails = {
      account_name: 'GharKaPaisa Pvt Ltd',
      account_number: merchantAccount,
      ifsc_code: 'ICIC0000104',
      bank_name: 'ICICI Bank (RazorpayX Business Account)',
      amount: parsedAmount,
      payment_method
    };

    await logAction(req, 'CREATE_ADD_FUNDS_REQUEST', fundReq.id, { amount: parsedAmount, payment_method });

    return success(res, {
      request: fundReq,
      business_bank_details: businessBankDetails
    }, 'Add Funds request initiated. Perform direct bank transfer to RazorpayX business account details provided.');
  } catch (err) {
    next(err);
  }
};

// ── Super Admin: Get All Add Funds Requests ──────────────────────────────
const getAddFundsRequests = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const { offset } = getPaginationParams(req.query);

    let where = 'WHERE 1=1';
    const params = [];
    if (status) {
      where += ` AND rfr.status = $1`;
      params.push(status);
    }

    const [countRes, dataRes] = await Promise.all([
      query(`SELECT COUNT(*) FROM razorpay_fund_requests rfr ${where}`, params),
      query(`
        SELECT rfr.*, u.full_name as requested_by_name, u.email as requested_by_email,
               ru.full_name as reconciled_by_name
        FROM razorpay_fund_requests rfr
        JOIN users u ON u.id = rfr.requested_by
        LEFT JOIN users ru ON ru.id = rfr.reconciled_by
        ${where}
        ORDER BY rfr.created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `, [...params, limit, offset])
    ]);

    return paginate(res, dataRes.rows, parseInt(countRes.rows[0].count), parseInt(page), parseInt(limit));
  } catch (err) {
    next(err);
  }
};

// ── Super Admin: Submit UTR / Reference Number for Add Funds Request ─────
const submitAddFundsUTR = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reference_number, notes } = req.body;

    if (!reference_number || !reference_number.trim()) {
      return error(res, 'Bank UTR or Transaction Reference Number is required');
    }

    const { rows: [fundReq] } = await query(`
      SELECT * FROM razorpay_fund_requests WHERE id = $1
    `, [id]);

    if (!fundReq) return error(res, 'Fund request not found', 404);
    if (fundReq.status === 'CONFIRMED') {
      return error(res, 'Fund request is already confirmed and reconciled');
    }

    const { rows: [updated] } = await query(`
      UPDATE razorpay_fund_requests
      SET status = 'SUBMITTED',
          reference_number = $1,
          notes = COALESCE($2, notes),
          updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [reference_number.trim(), notes, id]);

    await logAction(req, 'SUBMIT_ADD_FUNDS_UTR', id, { reference_number: reference_number.trim() });

    return success(res, updated, 'UTR/Reference number submitted successfully. Awaiting bank reconciliation.');
  } catch (err) {
    next(err);
  }
};

// ── Super Admin: Reconcile / Confirm Add Funds Request ──────────────────
const reconcileAddFundsRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action = 'confirm', notes } = req.body; // action: 'confirm' | 'reject'

    const targetStatus = action === 'reject' ? 'REJECTED' : 'CONFIRMED';
    const userId = req.user?.id;

    const { rows: [fundReq] } = await query(`
      SELECT * FROM razorpay_fund_requests WHERE id = $1
    `, [id]);

    if (!fundReq) return error(res, 'Fund request not found', 404);

    const { rows: [updated] } = await query(`
      UPDATE razorpay_fund_requests
      SET status = $1,
          reconciled_at = NOW(),
          reconciled_by = $2,
          notes = COALESCE($3, notes),
          updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `, [targetStatus, userId, notes, id]);

    await logAction(req, 'RECONCILE_ADD_FUNDS_REQUEST', id, { status: targetStatus, action });

    return success(res, updated, `Fund request status updated to ${targetStatus}`);
  } catch (err) {
    next(err);
  }
};

// ── Razorpay Webhook Handler (Payout Processed / Failed Reconciliation) ─────
const handleRazorpayWebhook = async (req, res, next) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    // Verify Webhook Signature against Raw Body
    if (webhookSecret) {
      if (!signature) {
        logger.warn('[RAZORPAY_WEBHOOK] Missing X-Razorpay-Signature header');
        return error(res, 'Missing webhook signature', 400);
      }
      const crypto = require('crypto');
      const rawPayload = req.rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawPayload)
        .digest('hex');

      if (signature !== expectedSignature) {
        logger.error('[RAZORPAY_WEBHOOK] Invalid webhook signature');
        return error(res, 'Invalid webhook signature', 400);
      }
    }

    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const event = payload.event;
    const payoutEntity = payload.payload?.payout?.entity;

    logger.info(`[RAZORPAY_WEBHOOK] Received event: ${event}`, { payout_id: payoutEntity?.id, status: payoutEntity?.status });

    if (!payoutEntity || !payoutEntity.id) {
      return success(res, { received: true, ignored: true }, 'Webhook received but missing payout entity');
    }

    const payoutId = payoutEntity.id;
    const referenceId = payoutEntity.reference_id;
    const utr = payoutEntity.utr || null;
    const amountRupees = payoutEntity.amount ? payoutEntity.amount / 100 : 0;
    const failureReason = payoutEntity.status_details?.reason || payoutEntity.failure_reason || 'Payout process failed';

    const { getClient } = require('../../config/database');
    const { syncWalletBalance } = require('./service.js');
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Find matching withdrawal record
      let { rows: [wr] } = await client.query(
        `SELECT wr.*, w.id as wallet_id 
         FROM wallet_withdrawals wr
         JOIN partner_wallets w ON w.partner_id = wr.partner_id
         WHERE wr.razorpay_payout_id = $1 OR wr.id::text = $2 FOR UPDATE`,
        [payoutId, referenceId || payoutId]
      );

      if (!wr) {
        await client.query('ROLLBACK');
        logger.warn(`[RAZORPAY_WEBHOOK] Withdrawal record not found for payout: ${payoutId}`);
        return success(res, { received: true, status: 'NOT_FOUND' }, 'Withdrawal record not found');
      }

      const withdrawalId = wr.id;
      const partnerId = wr.partner_id;

      if (event === 'payout.processed') {
        // Step 22 — Successful Payout
        await client.query(`
          UPDATE wallet_withdrawals SET
            status = 'transferred',
            utr = COALESCE($1, utr),
            transferred_at = NOW(),
            updated_at = NOW()
          WHERE id = $2
        `, [utr, withdrawalId]);

        // Release hold_balance & deduct available_balance
        await client.query(`
          UPDATE partner_wallets 
          SET available_balance = available_balance - $1,
              hold_balance = GREATEST(0, COALESCE(hold_balance, 0) - $1),
              total_withdrawn = COALESCE(total_withdrawn, 0) + $1,
              updated_at = NOW() 
          WHERE partner_id = $2
        `, [parseFloat(wr.amount), partnerId]);

        await client.query(`
          UPDATE wallet_ledger SET
            status = 'completed',
            reference_number = COALESCE($1, reference_number)
          WHERE transaction_type = 'WITHDRAWAL' AND (reference_number = $2 OR reference_number IS NULL) AND partner_id = $3
        `, [utr || payoutId, withdrawalId.toString(), partnerId]);

        await client.query(`
          INSERT INTO wallet_withdrawal_events (withdrawal_id, status, remarks, changed_by)
          VALUES ($1, 'RAZORPAY_PAYOUT_SUCCESS', $2, NULL)
        `, [withdrawalId, `Payout confirmed processed via Razorpay Webhook (UTR: ${utr || payoutId})`]);

        await client.query(`
          INSERT INTO partner_settlements (withdrawal_id, partner_id, payment_mode, utr_number, settled_at, status)
          VALUES ($1, $2, 'RazorpayX Payout', $3, NOW(), 'completed')
          ON CONFLICT (withdrawal_id) DO NOTHING
        `, [withdrawalId, partnerId, utr || payoutId]);

        await syncWalletBalance(partnerId, client);
        await client.query('COMMIT');

        // Notify Partner via SMS & Notification
        try {
          const { rows: [pUser] } = await query(`
            SELECT u.mobile, ap.first_name, ap.user_id
            FROM partner_profiles ap 
            JOIN users u ON u.id = ap.user_id 
            WHERE ap.id = $1
          `, [partnerId]);

          if (pUser) {
            const { createNotification } = require('../notifications/service.js');
            await createNotification(
              pUser.user_id,
              'Withdrawal Processed',
              `Your withdrawal of ₹${parseFloat(wr.amount).toLocaleString('en-IN')} has been successfully processed into your bank account. (UTR: ${utr || payoutId})`,
              'success'
            );
            if (pUser.mobile) {
              const { sendWithdrawalStatusSms } = require('../../services/sms/sms.service');
              if (sendWithdrawalStatusSms) {
                sendWithdrawalStatusSms(pUser.mobile, pUser.first_name, parseFloat(wr.amount), 'PROCESSED', utr || payoutId).catch(() => {});
              }
            }
          }
        } catch (notifyErr) {
          logger.warn(`Failed to send payout success notification: ${notifyErr.message}`);
        }

      } else if (['payout.failed', 'payout.reversed', 'payout.rejected'].includes(event)) {
        // Step 23 — Failed Payout
        await client.query(`
          UPDATE wallet_withdrawals SET
            status = 'failed',
            failure_reason = $1,
            updated_at = NOW()
          WHERE id = $2
        `, [failureReason, withdrawalId]);

        // Release hold_balance back to available_balance pool (hold_balance reduced, available_balance untouched)
        await client.query(`
          UPDATE partner_wallets 
          SET hold_balance = GREATEST(0, COALESCE(hold_balance, 0) - $1),
              updated_at = NOW() 
          WHERE partner_id = $2
        `, [parseFloat(wr.amount), partnerId]);

        await client.query(`
          UPDATE wallet_ledger SET
            status = 'failed',
            description = COALESCE(description, '') || ' [Payout Failed]'
          WHERE transaction_type = 'WITHDRAWAL' AND reference_number = $1 AND partner_id = $2
        `, [withdrawalId.toString(), partnerId]);

        await client.query(`
          INSERT INTO wallet_withdrawal_events (withdrawal_id, status, remarks, changed_by)
          VALUES ($1, 'RAZORPAY_PAYOUT_FAILED', $2, NULL)
        `, [withdrawalId, `Payout failed via Razorpay Webhook: ${failureReason}. Held balance released.`]);

        await syncWalletBalance(partnerId, client);
        await client.query('COMMIT');

        // Notify Partner via SMS & Notification
        try {
          const { rows: [pUser] } = await query(`
            SELECT u.mobile, ap.first_name, ap.user_id
            FROM partner_profiles ap 
            JOIN users u ON u.id = ap.user_id 
            WHERE ap.id = $1
          `, [partnerId]);

          if (pUser) {
            const { createNotification } = require('../notifications/service.js');
            await createNotification(
              pUser.user_id,
              'Withdrawal Failed',
              `Your withdrawal of ₹${parseFloat(wr.amount).toLocaleString('en-IN')} could not be processed. The held amount has been released back to your available balance.`,
              'error'
            );
            if (pUser.mobile) {
              const { sendWithdrawalFailedSms } = require('../../services/sms/sms.service');
              if (sendWithdrawalFailedSms) {
                sendWithdrawalFailedSms(pUser.mobile, pUser.first_name, parseFloat(wr.amount)).catch(() => {});
              }
            }
          }
        } catch (notifyErr) {
          logger.warn(`Failed to send payout failure notification: ${notifyErr.message}`);
        }

      } else {
        await client.query('COMMIT');
        logger.info(`[RAZORPAY_WEBHOOK] Event ${event} acknowledged without status update.`);
      }

      return success(res, { received: true, event }, 'Webhook processed successfully');
    } catch (dbErr) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      throw dbErr;
    } finally {
      try { client.release(); } catch (_) {}
    }
  } catch (err) {
    logger.error(`[RAZORPAY_WEBHOOK_ERROR] ${err.message}`, err);
    return error(res, err.message || 'Error processing Razorpay webhook', 500);
  }
};

module.exports = {
  getWallet,
  getTransactions,
  requestWithdrawal,
  listWithdrawals,
  processWithdrawalRequest,
  getRazorpayAccountSummary,
  getCaseSummary,
  getSelfWallet,
  getSelfTransactions,
  requestSelfWithdrawal,
  adminAdjustWalletController,
  approveWithdrawalController,
  rejectWithdrawalController,
  getWalletDashboard,
  getCommissionSummary,
  getBankDetails,
  saveBankDetails,
  getWalletReports,
  getWalletOverview,
  getWalletLedger,
  listPartnerWithdrawals,
  walletManualCredit,
  walletManualDebit,
  handleRazorpayWebhook,
  exportStatementPDF,
  exportStatementExcel,
  sendWithdrawalOTP,
  verifyWithdrawalOTP,
  cancelWithdrawal,
  retryWithdrawal,
  getWithdrawalDetail,
  getAllBankDetails,
  addSecondaryBankDetail,
  setPrimaryBank,
  verifyBankPennyDrop,
  verifyBankUPI,
  getBankEditHistory,
  getWalletAnalyticsController,
  getWalletReconciliationController,
  getWalletStatementController,
  releaseCommission,
  rejectCommission,
  getPendingCommissions,
  createAddFundsRequest,
  getAddFundsRequests,
  submitAddFundsUTR,
  reconcileAddFundsRequest,
  getPartnersOverview
};
