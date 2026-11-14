import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { Button } from '../../components/Button';

const services = [
  {
    id: 'mobile-recharge',
    title: 'Mobile Recharge',
    icon: 'smartphone',
    color: '#3B82F6',
    description: 'Recharge any mobile operator instantly',
  },
  {
    id: 'electricity',
    title: 'Electricity Bill',
    icon: 'zap',
    color: '#F59E0B',
    description: 'Pay electricity bills for all providers',
  },
  {
    id: 'fastag',
    title: 'FASTag Recharge',
    icon: 'credit-card',
    color: '#10B981',
    description: 'Recharge FASTag for seamless travel',
  },
  {
    id: 'dth',
    title: 'DTH Recharge',
    icon: 'tv',
    color: '#8B5CF6',
    description: 'Recharge DTH services',
  },
  {
    id: 'gas',
    title: 'Gas Bill',
    icon: 'flame',
    color: '#EF4444',
    description: 'Pay gas bills online',
  },
  {
    id: 'water',
    title: 'Water Bill',
    icon: 'droplet',
    color: '#06B6D4',
    description: 'Pay water bills',
  },
  {
    id: 'broadband',
    title: 'Broadband',
    icon: 'wifi',
    color: '#6366F1',
    description: 'Pay broadband bills',
  },
  {
    id: 'loan-repayment',
    title: 'Loan Repayment',
    icon: 'arrow-up-circle',
    color: '#14B8A6',
    description: 'Repay your loans easily',
  },
];

const PROVIDERS: Record<string, string[]> = {
  'mobile-recharge': ['Jio Prepaid', 'Airtel India', 'Vodafone Idea (Vi)', 'BSNL Mobile'],
  'electricity': ['MSEDCL (Maharashtra)', 'Tata Power Mumbai/Delhi', 'BSES Rajdhani (Delhi)', 'Adani Electricity', 'BESCOM (Bangalore)'],
  'dth': ['Tata Play (Tata Sky)', 'Airtel Digital TV', 'Dish TV India', 'Sun Direct DTH'],
  'gas': ['Mahanagar Gas (MGL)', 'Indraprastha Gas (IGL)', 'Adani Total Gas', 'Gujarat Gas Limited'],
  'water': ['Municipal Corporation (MCGM)', 'Delhi Jal Board (DJB)', 'Bangalore Water (BWSSB)'],
  'broadband': ['JioFiber Broadband', 'Airtel Xstream Fiber', 'ACT Fibernet', 'Hathway Cable'],
  'loan-repayment': ['Bajaj Finance', 'Tata Capital', 'Muthoot Finance', 'Home Credit India'],
};

export default function ServicesScreen() {
  const [activeService, setActiveService] = useState<any | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [receipt, setReceipt] = useState<any | null>(null);

  const handleServicePress = (service: any) => {
    setActiveService(service);
    const providers = PROVIDERS[service.id] || [];
    setSelectedProvider(providers[0] || 'Standard Provider');
    setAccountNumber('');
    setAmount('');
    setReceipt(null);
  };

  const handlePayBill = async () => {
    if (!accountNumber.trim()) {
      Alert.alert('Required Field', 'Please enter your consumer / account number or mobile number.');
      return;
    }
    const amtNum = parseFloat(amount);
    if (!amount.trim() || isNaN(amtNum) || amtNum <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payment amount (minimum ₹10).');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setReceipt({
        referenceId: 'BBPS' + Math.floor(100000000 + Math.random() * 900000000),
        service: activeService.title,
        provider: selectedProvider,
        account: accountNumber.trim(),
        amount: amtNum.toFixed(2),
        date: new Date().toLocaleString(),
        status: 'SUCCESS',
      });
    }, 1200);
  };

  const closeSheet = () => {
    setActiveService(null);
    setReceipt(null);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bill Payments & Recharge</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>
          Pay bills and recharge instantly for all major service providers
        </Text>

        <View style={styles.servicesGrid}>
          {services.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={styles.serviceCard}
              onPress={() => handleServicePress(service)}
              activeOpacity={0.7}
            >
              <View style={[styles.serviceIcon, { backgroundColor: `${service.color}20` }]}>
                <Icon name={service.icon as any} size={32} color={service.color} />
              </View>
              <Text style={styles.serviceTitle}>{service.title}</Text>
              <Text style={styles.serviceDesc} numberOfLines={2}>
                {service.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Card style={styles.infoCard}>
          <View style={styles.infoContent}>
            <Icon name="check-circle" size={20} color="#10B981" />
            <Text style={styles.infoText}>
              Powered by Bharat Bill Payment System (BBPS) with guaranteed instant receipt and payment assurance.
            </Text>
          </View>
        </Card>
      </View>

      {/* Interactive Bill Payment & Recharge Modal */}
      <Modal visible={!!activeService} animationType="slide" transparent={false}>
        <SafeAreaView style={[styles.modalSafe, { backgroundColor: colors.bg }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeSheet} style={styles.backButton}>
              <Icon name="arrow-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>{activeService?.title || 'Bill Payment'}</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {receipt ? (
              <View style={styles.receiptContainer}>
                <View style={styles.successBadge}>
                  <Icon name="check" size={32} color="#fff" />
                </View>
                <Text style={styles.receiptTitle}>Payment Successful!</Text>
                <Text style={styles.receiptAmount}>₹{receipt.amount}</Text>

                <Card style={styles.receiptCard}>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Biller Service</Text>
                    <Text style={styles.receiptValue}>{receipt.service}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Operator / Biller</Text>
                    <Text style={styles.receiptValue}>{receipt.provider}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Consumer / Account</Text>
                    <Text style={styles.receiptValue}>{receipt.account}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>BBPS Ref ID</Text>
                    <Text style={[styles.receiptValue, { color: colors.primary, fontWeight: '800' }]}>
                      {receipt.referenceId}
                    </Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Timestamp</Text>
                    <Text style={styles.receiptValue}>{receipt.date}</Text>
                  </View>
                </Card>

                <Button title="Done" onPress={closeSheet} style={{ marginTop: spacing.lg }} />
              </View>
            ) : (
              <>
                <View style={[styles.serviceHero, { backgroundColor: `${activeService?.color || '#3B82F6'}15` }]}>
                  <Icon
                    name={activeService?.icon as any || 'zap'}
                    size={36}
                    color={activeService?.color || colors.primary}
                  />
                  <Text style={styles.serviceHeroTitle}>{activeService?.title}</Text>
                  <Text style={styles.serviceHeroDesc}>{activeService?.description}</Text>
                </View>

                <Card style={styles.formCard}>
                  <Text style={styles.formSectionTitle}>Select Service Provider</Text>
                  <View style={styles.providerPills}>
                    {(PROVIDERS[activeService?.id] || ['General Operator']).map((p) => (
                      <TouchableOpacity
                        key={p}
                        style={[
                          styles.providerChip,
                          selectedProvider === p && {
                            backgroundColor: colors.primary,
                            borderColor: colors.primary,
                          },
                        ]}
                        onPress={() => setSelectedProvider(p)}
                      >
                        <Text
                          style={[
                            styles.providerChipText,
                            selectedProvider === p && { color: '#fff' },
                          ]}
                        >
                          {p}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.fieldLabel}>
                    {activeService?.id === 'mobile-recharge'
                      ? 'Mobile Number'
                      : activeService?.id === 'electricity'
                      ? 'Consumer Account Number (CA Number)'
                      : activeService?.id === 'dth'
                      ? 'Smart Card / Subscriber ID'
                      : 'Consumer / Account Number'}
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder={
                      activeService?.id === 'mobile-recharge'
                        ? '10-digit mobile number'
                        : 'Enter account / customer ID'
                    }
                    placeholderTextColor={colors.textLight}
                    keyboardType={activeService?.id === 'mobile-recharge' ? 'phone-pad' : 'default'}
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                  />

                  <Text style={styles.fieldLabel}>Payment Amount (₹)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter amount e.g. 299, 749"
                    placeholderTextColor={colors.textLight}
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                  />

                  <Button
                    title={isProcessing ? 'Processing with BBPS...' : `Pay ₹${amount || '0'} Now`}
                    loading={isProcessing}
                    disabled={isProcessing}
                    onPress={handlePayBill}
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
    fontWeight: '800',
    color: colors.text,
  },
  content: {
    padding: spacing.md,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMid,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  serviceCard: {
    width: (160 - spacing.md),
    backgroundColor: colors.bgSecondary,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  serviceDesc: {
    fontSize: 11,
    color: colors.textMid,
    textAlign: 'center',
    lineHeight: 14,
  },
  infoCard: {
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  infoContent: {
    flexDirection: 'row',
    gap: spacing.sm,
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
  serviceHero: {
    padding: spacing.lg,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  serviceHeroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.xs,
  },
  serviceHeroDesc: {
    fontSize: 13,
    color: colors.textMid,
    textAlign: 'center',
    marginTop: 2,
  },
  formCard: {
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  formSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textLight,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  providerPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  providerChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
  },
  providerChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  fieldLabel: {
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
  successBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  receiptTitle: {
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
  receiptValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
});
