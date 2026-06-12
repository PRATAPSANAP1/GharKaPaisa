const { query, getClient } = require('../config/db');
const { notify } = require('./notification.service');
const logger = require('../utils/logger');

// Ensure wallet exists for agent (called on agent approval)
const ensureWallet = async (agentId) => {
  await query(`
    INSERT INTO wallets (agent_id) VALUES ($1)
    ON CONFLICT (agent_id) DO NOTHING
  `, [agentId]);
};

// Credit commission to agent wallet (with transaction)
const creditCommission = async (agentId, applicationId, amount, description, userId) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Get wallet
    const { rows: [wallet] } = await client.query(
      `SELECT id, pending_amount, available_balance, total_earned FROM wallets WHERE agent_id = $1 FOR UPDATE`,
      [agentId]
    );
    if (!wallet) throw new Error('Wallet not found for agent');

    // Add to pending first (commission hold for 48hrs)
    await client.query(`
      UPDATE wallets SET
        pending_amount = pending_amount + $1,
        total_earned = total_earned + $1,
        last_updated = NOW()
      WHERE agent_id = $2
    `, [amount, agentId]);

    // Log txn
    const { rows: [txn] } = await client.query(`
      INSERT INTO wallet_transactions (wallet_id, application_id, txn_type, amount, status, description, processed_by)
      VALUES ($1, $2, 'credit', $3, 'pending', $4, $5)
      RETURNING id
    `, [wallet.id, applicationId, amount, description, userId]);

    // Update application commission status
    await client.query(`
      UPDATE applications SET commission_amount = $1, commission_status = 'pending' WHERE id = $2
    `, [amount, applicationId]);

    await client.query('COMMIT');

    // Schedule commission approval after hold period (48hrs in production)
    // In production use a job queue (Bull/BullMQ). Here we auto-approve after timeout.
    setTimeout(() => releaseCommission(agentId, wallet.id, txn.id, amount), 
      parseInt(process.env.COMMISSION_CREDIT_HOLD_HOURS || 48) * 3600000
    );

    logger.info(`Commission ₹${amount} credited (pending) to agent ${agentId}`);
    return txn;
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('creditCommission failed', err.message);
    throw err;
  } finally {
    client.release();
  }
};

// Move from pending → available (after hold period)
const releaseCommission = async (agentId, walletId, txnId, amount) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    await client.query(`
      UPDATE wallets SET
        pending_amount = GREATEST(0, pending_amount - $1),
        available_balance = available_balance + $1,
        last_updated = NOW()
      WHERE agent_id = $2
    `, [amount, agentId]);
    await client.query(`UPDATE wallet_transactions SET status = 'approved', processed_at = NOW() WHERE id = $1`, [txnId]);
    await client.query('COMMIT');

    // Get user_id for notification
    const { rows: [agent] } = await query(`SELECT user_id FROM agent_profiles WHERE id = $1`, [agentId]);
    if (agent) await notify.commissionCredited(agent.user_id, amount);
    logger.info(`Commission ₹${amount} released to available for agent ${agentId}`);
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('releaseCommission failed', err.message);
  } finally {
    client.release();
  }
};

// Process withdrawal request
const processWithdrawal = async (withdrawalId, approved, processedBy, utrNumber = null, rejectionReason = null) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { rows: [wr] } = await client.query(
      `SELECT wr.*, w.id as wallet_id FROM withdrawal_requests wr
       JOIN wallets w ON w.agent_id = wr.agent_id WHERE wr.id = $1 FOR UPDATE`,
      [withdrawalId]
    );
    if (!wr) throw new Error('Withdrawal request not found');
    if (wr.status !== 'pending') throw new Error('Withdrawal already processed');

    if (approved) {
      // Deduct from available balance
      await client.query(`
        UPDATE wallets SET
          available_balance = GREATEST(0, available_balance - $1),
          total_withdrawn = total_withdrawn + $1,
          last_updated = NOW()
        WHERE id = $2
      `, [wr.amount, wr.wallet_id]);

      // Log debit txn
      await client.query(`
        INSERT INTO wallet_transactions (wallet_id, txn_type, amount, status, description, processed_by, processed_at)
        VALUES ($1, 'debit', $2, 'processed', 'Withdrawal processed', $3, NOW())
      `, [wr.wallet_id, wr.amount, processedBy]);

      await client.query(`
        UPDATE withdrawal_requests SET status = 'processed', utr_number = $1, processed_by = $2, processed_at = NOW(), updated_at = NOW()
        WHERE id = $3
      `, [utrNumber, processedBy, withdrawalId]);
    } else {
      // Reject — refund to available
      await client.query(`
        UPDATE wallets SET available_balance = available_balance + $1, last_updated = NOW() WHERE id = $2
      `, [wr.amount, wr.wallet_id]);
      await client.query(`
        UPDATE withdrawal_requests SET status = 'rejected', rejection_reason = $1, processed_by = $2, processed_at = NOW(), updated_at = NOW()
        WHERE id = $3
      `, [rejectionReason, processedBy, withdrawalId]);
    }

    await client.query('COMMIT');

    // Notify agent
    const { rows: [agent] } = await query(`SELECT user_id FROM agent_profiles WHERE id = $1`, [wr.agent_id]);
    if (agent) {
      approved
        ? await notify.withdrawalApproved(agent.user_id, wr.amount)
        : await notify.withdrawalRejected(agent.user_id, wr.amount, rejectionReason);
    }

    logger.info(`Withdrawal ${withdrawalId} ${approved ? 'approved' : 'rejected'}`);
    return { success: true };
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('processWithdrawal failed', err.message);
    throw err;
  } finally {
    client.release();
  }
};

// Get full wallet summary for an agent
const getWalletSummary = async (agentId) => {
  const { rows: [wallet] } = await query(
    `SELECT * FROM wallets WHERE agent_id = $1`, [agentId]
  );
  return wallet;
};

module.exports = { ensureWallet, creditCommission, releaseCommission, processWithdrawal, getWalletSummary };
