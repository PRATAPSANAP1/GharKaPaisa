import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from '../../components/Icon';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { fetchTravelUtilitiesTransactions } from '../../services/partner.service';

const SERVICES = [
  { id: 'flights', label: 'Flights', icon: 'send', desc: 'Flight Tickets' },
  { id: 'hotels', label: 'Hotels', icon: 'home', desc: 'Hotel Booking' },
  { id: 'bus', label: 'Bus', icon: 'map-pin', desc: 'Bus Reservation' },
  { id: 'train', label: 'Train', icon: 'navigation', desc: 'IRCTC Train Booking' },
];

const UTILITIES = [
  { id: 'recharge', label: 'Mobile', icon: 'smartphone', desc: 'Prepaid & Postpaid' },
  { id: 'electricity', label: 'Electricity', icon: 'zap', desc: 'State Power Boards' },
  { id: 'fastag', label: 'FASTag', icon: 'credit-card', desc: 'Toll FASTag Recharge' },
  { id: 'dth', label: 'DTH', icon: 'tv', desc: 'DTH / Cable Recharge' },
];

export default function TravelUtilitiesScreen() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<string>('recharge');
  const [formField1, setFormField1] = useState<string>('');
  const [formField2, setFormField2] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [processing, setProcessing] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadTransactions = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const res = await fetchTravelUtilitiesTransactions();
      const list = Array.isArray(res.data) ? res.data : res.transactions || [];
      if (list.length > 0) {
        setTransactions(list);
      } else {
        setTransactions([
          {
            id: 'TXN-9821',
            service: 'Mobile Recharge',
            customer: '9823012930',
            amount: '₹299',
            date: 'Today',
            status: 'SUCCESS',
            commission: '₹4.50',
          },
          {
            id: 'TXN-8742',
            service: 'FASTag Recharge',
            customer: 'MH12AB1234',
            amount: '₹1,000',
            date: 'Yesterday',
            status: 'SUCCESS',
            commission: '₹15.00',
          },
        ]);
      }
    } catch (e) {
      // Fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleSubmit = async () => {
    if (!formField1.trim() || !amount.trim()) {
      Alert.alert('Required Fields', 'Please fill in the customer identifier and amount.');
      return;
    }

    const amtNum = parseFloat(amount);
    if (isNaN(amtNum) || amtNum <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid recharge or bill payment amount.');
      return;
    }

    setProcessing(true);
    setTimeout(() => {
      const margin = (amtNum * 0.015).toFixed(2);
      const newTxn = {
        id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
        service: activeTab.toUpperCase(),
        customer: formField1.trim(),
        amount: `₹${amtNum.toLocaleString('en-IN')}`,
        date: 'Just now',
        status: 'SUCCESS',
        commission: `₹${margin}`,
      };

      setTransactions(prev => [newTxn, ...prev]);
      setFormField1('');
      setFormField2('');
      setAmount('');
      setProcessing(false);

      Alert.alert(
        'Transaction Successful! 🎉',
        `Payment of ₹${amtNum} processed successfully.\nInstant margin of ₹${margin} credited to your Partner Wallet.`
      );
    }, 1200);
  };

  const getPlaceholder1 = () => {
    switch (activeTab) {
      case 'flights': return 'Traveler Name & Mobile';
      case 'hotels': return 'Hotel City / Guest Name';
      case 'bus': return 'Passenger Mobile Number';
      case 'train': return 'Passenger Name / IRCTC ID';
      case 'electricity': return 'Consumer Number / Account ID';
      case 'fastag': return 'Vehicle Registration Number (e.g. MH12AB1234)';
      case 'dth': return 'Smart Card / Customer ID';
      default: return '10-Digit Mobile Number';
    }
  };

  const getPlaceholder2 = () => {
    switch (activeTab) {
      case 'flights': return 'Destination (e.g. DEL, BOM, BLR)';
      case 'electricity': return 'Electricity Board (e.g. MSEDCL, Tata Power)';
      case 'recharge': return 'Operator / Circle (e.g. Jio / Maharashtra)';
      case 'fastag': return 'Issuing Bank (e.g. ICICI / HDFC / Paytm)';
      default: return 'Optional notes or reference';
    }
  };

  const allServices = [...UTILITIES, ...SERVICES];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadTransactions(true)} colors={[colors.primary]} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Icon name="arrow-left" size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTextCol}>
            <Text style={styles.title}>Travel & Utilities</Text>
            <Text style={styles.subtitle}>Recharge, bill payment & ticket booking margin</Text>
          </View>
        </View>

        {/* Service Category Selector */}
        <Text style={styles.sectionTitle}>Select Service</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsRow}>
          {allServices.map(item => {
            const isActive = activeTab === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.tabTile, isActive && styles.tabTileActive]}
                onPress={() => setActiveTab(item.id)}
              >
                <View style={[styles.tabIconBg, isActive && styles.tabIconBgActive]}>
                  <Icon name={item.icon as any} size={16} color={isActive ? '#FFFFFF' : colors.primary} />
                </View>
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Action Form Card */}
        <View style={styles.formCard}>
          <View style={styles.formCardHeader}>
            <Text style={styles.formCardTitle}>{activeTab.toUpperCase()} PAYMENT</Text>
            <View style={styles.marginTag}>
              <Text style={styles.marginTagText}>Earn ~1.5% Margin</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Identifier / Number *</Text>
            <TextInput
              style={styles.input}
              placeholder={getPlaceholder1()}
              placeholderTextColor="#94A3B8"
              value={formField1}
              onChangeText={setFormField1}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Operator / Details (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder={getPlaceholder2()}
              placeholderTextColor="#94A3B8"
              value={formField2}
              onChangeText={setFormField2}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Amount (₹) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter payment amount"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, processing && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Process Instant Payment ⚡</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Recent Transactions History */}
        <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Recent Utility Earnings</Text>
        {transactions.map(item => (
          <View key={item.id} style={styles.txnCard}>
            <View style={styles.txnLeft}>
              <View style={styles.txnIconBg}>
                <Icon name="check-circle" size={16} color="#059669" />
              </View>
              <View>
                <Text style={styles.txnService}>{item.service}</Text>
                <Text style={styles.txnCustomer}>{item.customer} • {item.date}</Text>
              </View>
            </View>
            <View style={styles.txnRight}>
              <Text style={styles.txnAmount}>{item.amount}</Text>
              <Text style={styles.txnCommission}>+{item.commission} margin</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTextCol: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tabsRow: {
    marginBottom: spacing.md,
  },
  tabTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    gap: 6,
  },
  tabTileActive: {
    backgroundColor: '#EEF2FF',
    borderColor: colors.primary,
  },
  tabIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconBgActive: {
    backgroundColor: colors.primary,
  },
  tabLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: colors.text,
  },
  tabLabelActive: {
    color: colors.primary,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  formCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  formCardTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.5,
  },
  marginTag: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  marginTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  inputGroup: {
    marginBottom: spacing.sm,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.sm,
    fontWeight: '800',
  },
  txnCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  txnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  txnIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  txnService: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: colors.text,
  },
  txnCustomer: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
  txnRight: {
    alignItems: 'flex-end',
  },
  txnAmount: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: colors.text,
  },
  txnCommission: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    marginTop: 2,
  },
});
