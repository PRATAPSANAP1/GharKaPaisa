import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from '../../components/Icon';
import {
  fetchPartnerWallet,
  fetchPartnerWalletTransactions,
  requestPartnerWithdrawal,
} from '../../services/partner.service';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

export default function WalletScreen() {
  const router = useRouter();

  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Withdrawal modal state
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [ifscCode, setIfscCode] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [walletRes, txRes] = await Promise.allSettled([
        fetchPartnerWallet(),
        fetchPartnerWalletTransactions(),
      ]);

      if (walletRes.status === 'fulfilled' && walletRes.value.success) {
        setWallet(walletRes.value.data || walletRes.value.wallet || walletRes.value);
      }
      if (txRes.status === 'fulfilled' && txRes.value.success) {
        const txList = Array.isArray(txRes.value.data) ? txRes.value.data : txRes.value.transactions || [];
        setTransactions(txList);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load wallet information');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleWithdrawSubmit = async () => {
    const amt = Number(withdrawAmount);
    if (!amt || amt <= 0) {
      setWithdrawError('Please enter a valid amount');
      return;
    }
    const avail = Number(wallet?.balance || wallet?.available_balance || 0);
    if (amt > avail) {
      setWithdrawError(`Entered amount exceeds available balance (₹${avail})`);
      return;
    }

    try {
      setSubmitting(true);
      setWithdrawError(null);

      const res = await requestPartnerWithdrawal(amt, {
        account_number: accountNumber.trim() || undefined,
        ifsc: ifscCode.trim() || undefined,
      });

      if (res.success) {
        Alert.alert('Success', res.message || 'Withdrawal request submitted successfully');
        setModalVisible(false);
        setWithdrawAmount('');
        loadData();
      } else {
        setWithdrawError(res.message || 'Failed to submit withdrawal request');
      }
    } catch (err: any) {
      setWithdrawError(err.message || 'Error processing request. Check inputs/balance.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderTransaction = ({ item }: { item: any }) => {
    const isCredit = item.type === 'CREDIT' || item.transaction_type === 'COMMISSION' || (item.amount && item.amount > 0);
    const amount = Math.abs(Number(item.amount || 0));
    const title = item.description || item.remarks || (isCredit ? 'Commission Earned' : 'Withdrawal Payout');
    const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN') : '';

    return (
      <View style={styles.txRow}>
        <View style={[styles.txIconBg, isCredit ? styles.creditBg : styles.debitBg]}>
          <Icon name={isCredit ? 'arrow-down-left' : 'arrow-up-right'} size={18} color={isCredit ? '#059669' : '#DC2626'} />
        </View>
        <View style={styles.txMeta}>
          <Text style={styles.txTitle}>{title}</Text>
          <Text style={styles.txDate}>{dateStr}</Text>
        </View>
        <Text style={[styles.txAmount, isCredit ? styles.creditText : styles.debitText]}>
          {isCredit ? '+' : '-'}₹{amount.toLocaleString('en-IN')}
        </Text>
      </View>
    );
  };

  const balance = Number(wallet?.balance || wallet?.available_balance || 0);

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="arrow-left" size={20} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.title}>Wallet & Payouts</Text>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceValue}>₹{balance.toLocaleString('en-IN')}</Text>

        <TouchableOpacity
          style={[styles.withdrawBtn, balance <= 0 && styles.withdrawBtnDisabled]}
          onPress={() => setModalVisible(true)}
          disabled={balance <= 0}
        >
          <Icon name="download" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.withdrawBtnText}>Request Withdrawal</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionHeader}>Transaction History</Text>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item, idx) => item.id || String(idx)}
          renderItem={renderTransaction}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Icon name="clock" size={32} color="#94A3B8" />
              <Text style={styles.emptyText}>No transaction records found.</Text>
            </View>
          }
        />
      )}

      {/* Withdrawal Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Payout</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {withdrawError ? (
              <View style={styles.modalErrorBox}>
                <Text style={styles.modalErrorText}>{withdrawError}</Text>
              </View>
            ) : null}

            <Text style={styles.inputLabel}>Withdrawal Amount (₹) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 5000"
              keyboardType="numeric"
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
            />

            <Text style={styles.inputLabel}>Bank Account Number (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Account number"
              keyboardType="numeric"
              value={accountNumber}
              onChangeText={setAccountNumber}
            />

            <Text style={styles.inputLabel}>IFSC Code (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="IFSC code"
              autoCapitalize="characters"
              value={ifscCode}
              onChangeText={setIfscCode}
            />

            <TouchableOpacity
              style={[styles.modalSubmitBtn, submitting && { opacity: 0.6 }]}
              onPress={handleWithdrawSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.modalSubmitText}>Submit Request</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  backBtn: {
    marginRight: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: '#1E293B',
  },
  balanceCard: {
    backgroundColor: '#1E293B',
    margin: spacing.md,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
  },
  balanceLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  balanceValue: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    marginVertical: 6,
  },
  withdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: spacing.xs,
  },
  withdrawBtnDisabled: {
    backgroundColor: '#64748B',
    opacity: 0.6,
  },
  withdrawBtnText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.sm,
    fontWeight: '700',
  },
  sectionHeader: {
    fontSize: typography.sizes.md,
    fontWeight: '700',
    color: '#1E293B',
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  errorText: {
    fontSize: typography.sizes.sm,
    color: colors.error,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  txIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  creditBg: {
    backgroundColor: '#D1FAE5',
  },
  debitBg: {
    backgroundColor: '#FEE2E2',
  },
  txMeta: {
    flex: 1,
  },
  txTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: '#0F172A',
  },
  txDate: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  txAmount: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
  },
  creditText: {
    color: '#059669',
  },
  debitText: {
    color: '#DC2626',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: spacing.xs,
    fontSize: typography.sizes.sm,
    color: '#64748B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.sizes.md,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalErrorBox: {
    backgroundColor: '#FEE2E2',
    padding: spacing.xs,
    borderRadius: 6,
    marginBottom: spacing.xs,
  },
  modalErrorText: {
    color: colors.error,
    fontSize: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginTop: spacing.xs,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: typography.sizes.sm,
    color: '#0F172A',
  },
  modalSubmitBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.sm,
    fontWeight: '700',
  },
});
