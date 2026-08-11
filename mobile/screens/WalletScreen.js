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
  ActivityIndicator
} from 'react-native';
import axios from 'axios';
import { BASE_URL } from '../config/api';

export default function WalletScreen({ route, navigation }) {
  const { token, user } = route.params || {};

  const [wallet, setWallet] = useState({ available_balance: 0, hold_balance: 0, total_earned: 0 });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  useEffect(() => {
    fetchWalletDetails();
  }, []);

  const fetchWalletDetails = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/wallet`, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => null);

      if (res?.data?.data) {
        setWallet(res.data.data);
      }

      const txRes = await axios.get(`${BASE_URL}/wallet/transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => null);

      if (txRes?.data?.data) {
        setHistory(txRes.data.data);
      } else {
        setHistory([
          { id: '1', type: 'CREDIT', amount: 1500, description: 'Commission for HDFC Card Lead #102', created_at: '2026-08-10' },
          { id: '2', type: 'WITHDRAWAL', amount: 1000, status: 'APPROVED', description: 'Payout to HDFC Bank A/C ending 4589', created_at: '2026-08-08' },
        ]);
      }
    } catch (err) {
      console.warn('Wallet load error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawalRequest = async () => {
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt <= 0) {
      return Alert.alert('Invalid Amount', 'Please enter a valid withdrawal amount.');
    }
    if (amt > (wallet.available_balance || 0)) {
      return Alert.alert('Insufficient Balance', 'Requested amount exceeds your available balance.');
    }

    setWithdrawLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/wallet/withdraw`, { amount: amt }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        Alert.alert('Withdrawal Submitted', 'Your payout request has been sent for processing.');
        setWithdrawAmount('');
        fetchWalletDetails();
      }
    } catch (err) {
      Alert.alert('Request Failed', err.response?.data?.message || 'Withdrawal request failed.');
    } finally {
      setWithdrawLoading(false);
    }
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

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

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

        {/* Instant Withdrawal Box */}
        <View style={styles.withdrawCard}>
          <Text style={styles.withdrawTitle}>Request Payout to Bank</Text>
          <Text style={styles.withdrawSub}>Funds will be credited directly to your registered bank account.</Text>

          <View style={styles.inputRow}>
            <Text style={styles.rupeeSymbol}>₹</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
            />
          </View>

          <TouchableOpacity
            style={[styles.withdrawBtn, withdrawLoading && styles.btnDisabled]}
            onPress={handleWithdrawalRequest}
            disabled={withdrawLoading}
          >
            {withdrawLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.withdrawBtnText}>Withdraw Funds</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Transaction History */}
        <Text style={styles.sectionTitle}>Recent Transactions</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#0d47a1" style={{ marginTop: 20 }} />
        ) : (
          history.map((tx) => (
            <View key={tx.id} style={styles.txCard}>
              <View style={[styles.txBadge, tx.type === 'CREDIT' ? styles.badgeGreen : styles.badgeOrange]}>
                <Text style={{ fontSize: 16 }}>{tx.type === 'CREDIT' ? '⬇️' : '⬆️'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.txDesc}>{tx.description || tx.type}</Text>
                <Text style={styles.txDate}>{tx.created_at?.split('T')[0]}</Text>
              </View>
              <Text style={[styles.txAmt, tx.type === 'CREDIT' ? styles.textGreen : styles.textOrange]}>
                {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount}
              </Text>
            </View>
          ))
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#0d47a1',
    paddingHorizontal: 16,
    paddingTop: 45,
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
  withdrawCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20, elevation: 1 },
  withdrawTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  withdrawSub: { fontSize: 11, color: '#64748B', marginTop: 2, marginBottom: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 12, marginBottom: 12 },
  rupeeSymbol: { fontSize: 18, fontWeight: '800', color: '#0d47a1', marginRight: 6 },
  input: { flex: 1, paddingVertical: 12, fontSize: 16, color: '#0F172A', fontWeight: '700' },
  withdrawBtn: { backgroundColor: '#059669', padding: 14, borderRadius: 10, alignItems: 'center' },
  withdrawBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  btnDisabled: { backgroundColor: '#94A3B8' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  txCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 10, gap: 12 },
  txBadge: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  badgeGreen: { backgroundColor: '#ECFDF5' },
  badgeOrange: { backgroundColor: '#FFFBEB' },
  txDesc: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  txDate: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  txAmt: { fontSize: 15, fontWeight: '800' },
  textGreen: { color: '#059669' },
  textOrange: { color: '#D97706' },
});
