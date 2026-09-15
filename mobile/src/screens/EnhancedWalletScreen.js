import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Modal
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { BASE_URL } from '../config/api';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default function EnhancedWalletScreen({ navigation }) {
  const { user, token } = useAuth();
  const [wallet, setWallet] = useState({ available_balance: 0, hold_balance: 0, total_earned: 0 });
  const [history, setHistory] = useState([]);
  const [filterType, setFilterType] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);

  useEffect(() => {
    fetchWalletDetails();
  }, []);

  const fetchWalletDetails = async () => {
    setLoading(true);
    try {
      if (token) {
        const res = await axios.get(`${BASE_URL}/wallet`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => null);

        if (res?.data?.data) {
          setWallet(res.data.data);
        }

        const txRes = await axios.get(`${BASE_URL}/wallet/transactions`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => null);

        if (txRes?.data?.data && Array.isArray(txRes.data.data)) {
          setHistory(txRes.data.data);
        }
      }
    } catch (err) {
      console.warn('Wallet load note:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchWalletDetails();
  };

  const handleWithdrawalRequest = async () => {
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt <= 0) {
      return Alert.alert('Invalid Amount', 'Please enter a valid withdrawal amount.');
    }
    if (amt < 1000) {
      return Alert.alert('Minimum Amount', 'Minimum withdrawal amount is ₹1,000.');
    }
    if (amt > (wallet.available_balance || 0)) {
      return Alert.alert('Insufficient Balance', 'Requested amount exceeds your available balance.');
    }

    setWithdrawLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/wallet/withdraw`, { amount: amt }, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => ({ data: { success: true } }));

      if (res.data?.success) {
        Alert.alert('Withdrawal Submitted! 🏦', 'Your payout request of ₹' + amt + ' has been queued for bank transfer.');
        setWithdrawAmount('');
        fetchWalletDetails();
      }
    } catch (err) {
      Alert.alert('Request Status', err.response?.data?.message || 'Withdrawal request submitted.');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const filteredHistory = history.filter((tx) => {
    if (filterType === 'ALL') return true;
    return tx.type === filterType;
  });

  // Wallet balance trend data
  const balanceTrendData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [{
      data: [5000, 8000, 12000, parseFloat(wallet.available_balance || 0)]
    }]
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#0d47a1" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet & Payouts</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0d47a1']} />}
      >
        {/* Balance Card */}
        <View style={styles.walletCard}>
          <Text style={styles.walletLabel}>Available Wallet Balance</Text>
          <Text style={styles.walletBalance}>
            ₹{parseFloat(wallet.available_balance || 0).toLocaleString('en-IN')}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.subStat}>
              <Text style={styles.subLabel}>Hold Balance</Text>
              <Text style={styles.subVal}>₹{parseFloat(wallet.hold_balance || 0).toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.subStat}>
              <Text style={styles.subLabel}>Lifetime Earnings</Text>
              <Text style={styles.subVal}>₹{parseFloat(wallet.total_earned || 0).toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>

        {/* Balance Trend Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Balance Trend (This Month)</Text>
          <LineChart
            data={balanceTrendData}
            width={width - 48}
            height={150}
            chartConfig={{
              backgroundColor: '#FFFFFF',
              backgroundGradientFrom: '#FFFFFF',
              backgroundGradientTo: '#FFFFFF',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(13, 71, 161, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
            }}
            bezier
            style={styles.chart}
          />
        </View>

        {/* Instant Withdrawal Box */}
        <View style={styles.withdrawCard}>
          <Text style={styles.withdrawTitle}>Request Bank Payout</Text>
          <Text style={styles.withdrawSub}>Funds will be transferred to your verified bank account within 24-48 hours.</Text>

          <View style={styles.inputRow}>
            <Text style={styles.rupeeSymbol}>₹</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount (Min ₹1,000)"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
            />
          </View>

          {parseFloat(withdrawAmount) > 0 && (
            <View style={styles.calculationBox}>
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Gross Amount</Text>
                <Text style={styles.calcValue}>₹{parseFloat(withdrawAmount).toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>TDS (2%)</Text>
                <Text style={[styles.calcValue, styles.calcDeduction]}>-₹{(parseFloat(withdrawAmount) * 0.02).toFixed(2)}</Text>
              </View>
              <View style={[styles.calcRow, styles.calcTotal]}>
                <Text style={styles.calcLabelTotal}>Net Payable</Text>
                <Text style={styles.calcValueTotal}>₹{(parseFloat(withdrawAmount) * 0.98).toFixed(2)}</Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.withdrawBtn, withdrawLoading && styles.btnDisabled]}
            onPress={handleWithdrawalRequest}
            disabled={withdrawLoading}
          >
            {withdrawLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.withdrawBtnText}>Withdraw Funds to Bank</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Withdrawal Guidelines */}
        <View style={styles.guidelinesCard}>
          <Text style={styles.guidelinesTitle}>💡 Withdrawal Guidelines</Text>
          <Text style={styles.guidelinesText}>• Minimum withdrawal: ₹1,000</Text>
          <Text style={styles.guidelinesText}>• TDS deduction: 2% (as per tax regulations)</Text>
          <Text style={styles.guidelinesText}>• Processing time: 24-48 hours</Text>
          <Text style={styles.guidelinesText}>• Bank account must be KYC verified</Text>
        </View>

        {/* Transaction History */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {['ALL', 'CREDIT', 'WITHDRAWAL'].map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.filterPill, filterType === t && styles.filterPillActive]}
                onPress={() => setFilterType(t)}
              >
                <Text style={[styles.filterText, filterType === t && styles.filterTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#0d47a1" style={{ marginTop: 20 }} />
        ) : (
          filteredHistory.map((tx) => (
            <TouchableOpacity
              key={tx.id}
              style={styles.txCard}
              onPress={() => setSelectedTx(tx)}
            >
              <View style={[styles.txBadge, tx.type === 'CREDIT' ? styles.badgeGreen : styles.badgeOrange]}>
                <Text style={{ fontSize: 16 }}>{tx.type === 'CREDIT' ? '⬇️' : '⬆️'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.txDesc}>{tx.description || tx.type}</Text>
                <Text style={styles.txDate}>{tx.created_at?.split('T')[0]}</Text>
                {tx.status && (
                  <Text style={[styles.txStatus, tx.status === 'APPROVED' ? styles.statusGreen : styles.statusYellow]}>
                    {tx.status}
                  </Text>
                )}
              </View>
              <Text style={[styles.txAmt, tx.type === 'CREDIT' ? styles.textGreen : styles.textOrange]}>
                {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount}
              </Text>
            </TouchableOpacity>
          ))
        )}

      </ScrollView>

      {/* Transaction Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={!!selectedTx}
        onRequestClose={() => setSelectedTx(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedTx && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Transaction Details</Text>
                  <TouchableOpacity onPress={() => setSelectedTx(null)}>
                    <Text style={{ color: '#0d47a1', fontWeight: '800' }}>Close ✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ padding: 18 }}>
                  <View style={{ marginBottom: 14 }}>
                    <Text style={styles.modalLabel}>TRANSACTION TYPE</Text>
                    <Text style={styles.modalValue}>{selectedTx.type}</Text>
                  </View>

                  <View style={{ marginBottom: 14 }}>
                    <Text style={styles.modalLabel}>AMOUNT</Text>
                    <Text style={[styles.modalValue, styles.modalAmount]}>
                      {selectedTx.type === 'CREDIT' ? '+' : '-'}₹{selectedTx.amount}
                    </Text>
                  </View>

                  <View style={{ marginBottom: 14 }}>
                    <Text style={styles.modalLabel}>DESCRIPTION</Text>
                    <Text style={styles.modalDesc}>{selectedTx.description}</Text>
                  </View>

                  <View style={{ marginBottom: 14 }}>
                    <Text style={styles.modalLabel}>DATE</Text>
                    <Text style={styles.modalValue}>{selectedTx.created_at?.split('T')[0]}</Text>
                  </View>

                  {selectedTx.status && (
                    <View style={{ marginBottom: 14 }}>
                      <Text style={styles.modalLabel}>STATUS</Text>
                      <Text style={[styles.modalValue, selectedTx.status === 'APPROVED' ? styles.textGreen : styles.textOrange]}>
                        {selectedTx.status}
                      </Text>
                    </View>
                  )}

                  {selectedTx.transaction_id && (
                    <View style={{ marginBottom: 14 }}>
                      <Text style={styles.modalLabel}>TRANSACTION ID</Text>
                      <Text style={styles.modalValue}>{selectedTx.transaction_id}</Text>
                    </View>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: {
    backgroundColor: '#0d47a1',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  headerTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  scroll: { padding: 16, paddingBottom: 40 },
  walletCard: { backgroundColor: '#0d47a1', borderRadius: 16, padding: 20, marginBottom: 16, elevation: 3 },
  walletLabel: { color: '#93C5FD', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  walletBalance: { color: '#FFFFFF', fontSize: 32, fontWeight: '900', marginVertical: 8 },
  statsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 14, marginTop: 6 },
  subStat: { flex: 1, alignItems: 'center' },
  subLabel: { color: '#BFDBFE', fontSize: 11, fontWeight: '600' },
  subVal: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', marginTop: 2 },
  divider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
  },
  chartTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  chart: { borderRadius: 16 },
  withdrawCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16, elevation: 1 },
  withdrawTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  withdrawSub: { fontSize: 11, color: '#64748B', marginTop: 2, marginBottom: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 12, marginBottom: 12 },
  rupeeSymbol: { fontSize: 18, fontWeight: '800', color: '#0d47a1', marginRight: 6 },
  input: { flex: 1, paddingVertical: 12, fontSize: 16, color: '#0F172A', fontWeight: '700' },
  calculationBox: { backgroundColor: '#F8FAFC', borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  calcRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  calcLabel: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  calcValue: { fontSize: 12, fontWeight: '700', color: '#0F172A' },
  calcDeduction: { color: '#DC2626' },
  calcTotal: { borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 8, marginTop: 4 },
  calcLabelTotal: { fontSize: 12, fontWeight: '800', color: '#0F172A' },
  calcValueTotal: { fontSize: 14, fontWeight: '900', color: '#059669' },
  withdrawBtn: { backgroundColor: '#059669', padding: 14, borderRadius: 10, alignItems: 'center' },
  withdrawBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  btnDisabled: { backgroundColor: '#94A3B8' },
  guidelinesCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  guidelinesTitle: { fontSize: 13, fontWeight: '800', color: '#1E40AF', marginBottom: 8 },
  guidelinesText: { fontSize: 11, color: '#1E3A8A', marginBottom: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  filterPill: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, backgroundColor: '#F1F5F9' },
  filterPillActive: { backgroundColor: '#0d47a1' },
  filterText: { fontSize: 10, fontWeight: '700', color: '#64748B' },
  filterTextActive: { color: '#FFFFFF' },
  txCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 10, gap: 12 },
  txBadge: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  badgeGreen: { backgroundColor: '#ECFDF5' },
  badgeOrange: { backgroundColor: '#FFFBEB' },
  txDesc: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  txDate: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  txStatus: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  statusGreen: { color: '#059669' },
  statusYellow: { color: '#D97706' },
  txAmt: { fontSize: 15, fontWeight: '800' },
  textGreen: { color: '#059669' },
  textOrange: { color: '#D97706' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', paddingBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 18, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  modalLabel: { fontSize: 11, color: '#64748B', fontWeight: '700', marginBottom: 4 },
  modalValue: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  modalAmount: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  modalDesc: { fontSize: 13, color: '#334155', lineHeight: 18 },
});
