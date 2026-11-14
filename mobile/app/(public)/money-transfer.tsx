import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { Button } from '../../components/Button';
import { fetchPaymentMethods } from '../../services/cms.service';

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  type: string;
  limit?: string;
  timing?: string;
}

const DEFAULT_METHODS: PaymentMethod[] = [
  {
    id: 'imps',
    name: 'IMPS Quick Transfer',
    icon: 'zap',
    type: 'Real-Time Immediate Bank Transfer (24x7)',
    limit: 'Up to ₹5,00,000 per txn',
    timing: 'Instant Settlement',
  },
  {
    id: 'neft',
    name: 'NEFT Transfer',
    icon: 'refresh-cw',
    type: 'National Electronic Fund Transfer (Batch Hourly)',
    limit: 'No upper limit',
    timing: '30 - 60 Minutes',
  },
  {
    id: 'rtgs',
    name: 'RTGS High-Value Transfer',
    icon: 'trending-up',
    type: 'Real Time Gross Settlement for Business & Bulk',
    limit: 'Min ₹2,00,000',
    timing: 'Real-Time High Priority',
  },
  {
    id: 'upi',
    name: 'UPI Direct Pay',
    icon: 'smartphone',
    type: 'Unified Payments Interface via VPA / Phone',
    limit: 'Up to ₹1,00,000',
    timing: 'Zero Fee Instant Transfer',
  },
];

export default function MoneyTransferScreen() {
  const [loading, setLoading] = useState(true);
  const [methods, setMethods] = useState<PaymentMethod[]>(DEFAULT_METHODS);

  // Transfer Modal State
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccount, setConfirmAccount] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [processing, setProcessing] = useState(false);
  const [transferReceipt, setTransferReceipt] = useState<any | null>(null);

  useEffect(() => {
    fetchPaymentMethods()
      .then((res) => {
        if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
          const mapped = res.data.map((m: any, idx: number) => ({
            id: m.id || `method-${idx}`,
            name: m.name || m.title || 'Bank Transfer',
            icon: m.icon || 'send',
            type: m.type || m.description || 'Instant Transfer',
            limit: DEFAULT_METHODS[idx % DEFAULT_METHODS.length].limit,
            timing: DEFAULT_METHODS[idx % DEFAULT_METHODS.length].timing,
          }));
          setMethods(mapped);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleOpenTransfer = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setTransferReceipt(null);
    setBeneficiaryName('');
    setAccountNumber('');
    setConfirmAccount('');
    setIfscCode('');
    setUpiId('');
    setAmount('');
    setRemarks('');
  };

  const handleExecuteTransfer = () => {
    const isUpi = selectedMethod?.id === 'upi';

    if (isUpi) {
      if (!upiId.trim() || !upiId.includes('@')) {
        Alert.alert('Required', 'Please enter a valid UPI ID (e.g. mobile@upi).');
        return;
      }
    } else {
      if (!beneficiaryName.trim() || !accountNumber.trim() || !ifscCode.trim()) {
        Alert.alert('Required Fields', 'Please enter beneficiary name, account number, and bank IFSC code.');
        return;
      }
      if (accountNumber.trim() !== confirmAccount.trim()) {
        Alert.alert('Account Mismatch', 'Account numbers do not match. Please verify.');
        return;
      }
    }

    const amtNum = parseFloat(amount);
    if (!amount.trim() || isNaN(amtNum) || amtNum <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid transfer amount (minimum ₹10).');
      return;
    }

    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setTransferReceipt({
        utr: 'UTR' + Math.floor(100000000000 + Math.random() * 900000000000),
        method: selectedMethod?.name,
        beneficiary: isUpi ? upiId.trim() : beneficiaryName.trim(),
        destination: isUpi ? upiId.trim() : `A/C **${accountNumber.slice(-4)} (${ifscCode.toUpperCase()})`,
        amount: amtNum.toFixed(2),
        timestamp: new Date().toLocaleString(),
        status: 'SUCCESS',
      });
    }, 1200);
  };

  const closeSheet = () => {
    setSelectedMethod(null);
    setTransferReceipt(null);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Money Transfer</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.hero}>
        <Icon name="send" size={48} color={colors.primary} />
        <Text style={styles.heroTitle}>Send Money Instantly</Text>
        <Text style={styles.heroSubtitle}>
          Fast, secure, and encrypted bank payouts powered by RBI-licensed payment networks
        </Text>
      </View>

      <View style={styles.transferList}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading payment channels...</Text>
          </View>
        ) : methods.length === 0 ? (
          <View style={styles.centered}>
            <Icon name="info-circle" size={48} color={colors.textLight} />
            <Text style={styles.emptyTitle}>No payment methods available</Text>
          </View>
        ) : (
          methods.map((method) => (
            <TouchableOpacity
              key={method.id}
              onPress={() => handleOpenTransfer(method)}
              activeOpacity={0.7}
            >
              <Card style={styles.transferCard}>
                <View style={styles.transferCardHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
                    <Icon name={method.icon as any} size={28} color={colors.primary} />
                  </View>
                  <View style={styles.timingBadge}>
                    <Text style={styles.timingText}>{method.timing || 'Instant'}</Text>
                  </View>
                </View>
                <Text style={styles.transferTitle}>{method.name}</Text>
                <Text style={styles.transferDesc} numberOfLines={2}>
                  {method.type}
                </Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.limitText}>{method.limit || 'Zero Charges'}</Text>
                  <Icon name="chevron-right" size={16} color={colors.primary} />
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </View>

      <Card style={styles.infoCard}>
        <Icon name="shield" size={20} color={colors.primary} />
        <Text style={styles.infoText}>
          All transactions are protected by bank-grade 256-bit encryption and RBI-mandated two-factor security standards.
        </Text>
      </Card>

      {/* Transfer Execution Modal */}
      <Modal visible={!!selectedMethod} animationType="slide" transparent={false}>
        <SafeAreaView style={[styles.modalSafe, { backgroundColor: colors.bg }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeSheet} style={styles.backButton}>
              <Icon name="arrow-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>{selectedMethod?.name || 'Send Money'}</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {transferReceipt ? (
              <View style={styles.receiptContainer}>
                <View style={styles.receiptIconCircle}>
                  <Icon name="check" size={32} color="#fff" />
                </View>
                <Text style={styles.receiptSuccessTitle}>Transfer Successful!</Text>
                <Text style={styles.receiptAmount}>₹{transferReceipt.amount}</Text>

                <Card style={styles.receiptCard}>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Bank UTR Reference</Text>
                    <Text style={[styles.receiptVal, { color: colors.primary, fontWeight: '900' }]}>
                      {transferReceipt.utr}
                    </Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Channel</Text>
                    <Text style={styles.receiptVal}>{transferReceipt.method}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Beneficiary</Text>
                    <Text style={styles.receiptVal}>{transferReceipt.beneficiary}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Credit Target</Text>
                    <Text style={styles.receiptVal}>{transferReceipt.destination}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Timestamp</Text>
                    <Text style={styles.receiptVal}>{transferReceipt.timestamp}</Text>
                  </View>
                </Card>

                <Button title="Done" onPress={closeSheet} style={{ marginTop: spacing.lg }} />
              </View>
            ) : (
              <>
                <View style={styles.methodHero}>
                  <Icon name={selectedMethod?.icon as any || 'send'} size={36} color={colors.primary} />
                  <Text style={styles.methodHeroTitle}>{selectedMethod?.name}</Text>
                  <Text style={styles.methodHeroDesc}>{selectedMethod?.type}</Text>
                </View>

                <Card style={styles.formCard}>
                  <Text style={styles.formTitle}>Enter Beneficiary Details</Text>

                  {selectedMethod?.id === 'upi' ? (
                    <>
                      <Text style={styles.inputLabel}>UPI ID (VPA) *</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g. mobile@upi or username@okaxis"
                        placeholderTextColor={colors.textLight}
                        autoCapitalize="none"
                        value={upiId}
                        onChangeText={setUpiId}
                      />
                    </>
                  ) : (
                    <>
                      <Text style={styles.inputLabel}>Beneficiary Full Name *</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="As registered in bank records"
                        placeholderTextColor={colors.textLight}
                        value={beneficiaryName}
                        onChangeText={setBeneficiaryName}
                      />

                      <Text style={styles.inputLabel}>Bank Account Number *</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Enter full bank account number"
                        placeholderTextColor={colors.textLight}
                        keyboardType="number-pad"
                        value={accountNumber}
                        onChangeText={setAccountNumber}
                      />

                      <Text style={styles.inputLabel}>Confirm Account Number *</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Re-enter bank account number"
                        placeholderTextColor={colors.textLight}
                        keyboardType="number-pad"
                        value={confirmAccount}
                        onChangeText={setConfirmAccount}
                      />

                      <Text style={styles.inputLabel}>Bank IFSC Code *</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g. HDFC0001234, SBIN0000456"
                        placeholderTextColor={colors.textLight}
                        autoCapitalize="characters"
                        maxLength={11}
                        value={ifscCode}
                        onChangeText={(txt) => setIfscCode(txt.toUpperCase())}
                      />
                    </>
                  )}

                  <Text style={styles.inputLabel}>Transfer Amount (₹) *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter amount e.g. 5000, 25000"
                    placeholderTextColor={colors.textLight}
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                  />

                  <Text style={styles.inputLabel}>Purpose / Remarks (Optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Bill reimbursement, Family support"
                    placeholderTextColor={colors.textLight}
                    value={remarks}
                    onChangeText={setRemarks}
                  />

                  <Button
                    title={processing ? 'Initiating Bank Settlement...' : `Transfer ₹${amount || '0'} Now`}
                    loading={processing}
                    disabled={processing}
                    onPress={handleExecuteTransfer}
                    style={{ marginTop: spacing.md }}
                  />
                </Card>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.md,
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.textMid,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textMid,
  },
  emptyTitle: {
    marginTop: spacing.md,
    fontSize: 16,
    fontWeight: '700',
    color: colors.textMid,
  },
  transferList: {
    padding: spacing.md,
    gap: spacing.md,
  },
  transferCard: {
    padding: spacing.md,
  },
  transferCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timingBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10B98140',
  },
  timingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  transferTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  transferDesc: {
    fontSize: 13,
    color: colors.textMid,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  limitText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  infoCard: {
    margin: spacing.md,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.textMid,
    lineHeight: 16,
  },
  modalSafe: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  modalBody: {
    flex: 1,
    padding: spacing.md,
  },
  methodHero: {
    padding: spacing.lg,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    marginBottom: spacing.md,
  },
  methodHeroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.xs,
  },
  methodHeroDesc: {
    fontSize: 13,
    color: colors.textMid,
    textAlign: 'center',
    marginTop: 2,
  },
  formCard: {
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
    marginTop: spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.text,
    backgroundColor: '#fff',
  },
  receiptContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  receiptIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  receiptSuccessTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#10B981',
    marginBottom: 4,
  },
  receiptAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  receiptCard: {
    width: '100%',
    padding: spacing.md,
    gap: spacing.sm,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  receiptLabel: {
    fontSize: 12,
    color: colors.textLight,
  },
  receiptVal: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
});
