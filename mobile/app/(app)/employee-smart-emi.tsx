import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Share,
  Alert,
  SafeAreaView,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from '../../components/Icon';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

interface SmartEmiScheme {
  id: string;
  bank: string;
  title: string;
  minAmount: string;
  monthlyRoi: string;
  tenure: string;
  processingFee: string;
  windowDays: string;
  commission: string;
  applyUrl: string;
  features: string[];
}

export default function EmployeeSmartEmiScreen() {
  const router = useRouter();

  // Spend Calculator State
  const [spendAmount, setSpendAmount] = useState('45000');
  const [tenureMonths, setTenureMonths] = useState(12);
  const [monthlyRoi, setMonthlyRoi] = useState('1.25'); // % per month

  const schemes: SmartEmiScheme[] = [
    {
      id: 'hdfc-smart-emi',
      bank: 'HDFC Bank',
      title: 'HDFC Bank SmartEMI On Card',
      minAmount: '₹2,500',
      monthlyRoi: '1.15% - 1.35% p.m.',
      tenure: '3 - 48 Months',
      processingFee: '₹199 + GST',
      windowDays: 'Up to 60 Days',
      commission: '₹1,500',
      applyUrl:
        'https://applyonline.hdfc.bank.in/loan-against-assets/smartemi/smartemi?Channel=DSA&DSACode=XYOH',
      features: [
        'Convert any retail or online purchase made in the last 60 days into EMIs',
        'Customer retains all reward points originally earned on the transaction',
        'Instant 1-click conversion via NetBanking, MobileBanking, or SMS',
        'No-Cost EMI options available across 5,000+ top brand partners',
      ],
    },
    {
      id: 'icici-emi-card',
      bank: 'ICICI Bank',
      title: 'ICICI Bank EMI On Credit Card',
      minAmount: '₹1,500',
      monthlyRoi: '1.20% - 1.45% p.m.',
      tenure: '3 - 24 Months',
      processingFee: '2% (Min ₹199)',
      windowDays: 'Up to 30 Days',
      commission: '₹1,400',
      applyUrl: 'https://www.icicibank.com/personal-banking/cards/credit-cards/emi-on-card',
      features: [
        'Convert spends above ₹1,500 before the credit card billing cycle cuts',
        'Special lower rates for electronics and mobile phone purchases',
        'Repay comfortably over 3 to 24 easy monthly installments',
        'Option for partial prepayments without heavy penalty fees',
      ],
    },
    {
      id: 'sbi-flexipay',
      bank: 'SBI Card',
      title: 'SBI Card Flexipay Facility',
      minAmount: '₹2,500',
      monthlyRoi: '1.25% - 1.50% p.m.',
      tenure: '6 - 36 Months',
      processingFee: '1.5% (Min ₹249)',
      windowDays: 'Up to 30 Days',
      commission: '₹1,250',
      applyUrl: 'https://www.sbicard.com/en/personal/benefits/flexipay.page',
      features: [
        'Convert transactions of ₹2,500 and above into easy EMIs within 30 days',
        'Low processing fee and no foreclosure penalty after 6 months',
        'Simple approval with zero paper documentation or verification delays',
        'View and track active EMIs directly through the SBI Card Mobile App',
      ],
    },
    {
      id: 'axis-dial-emi',
      bank: 'Axis Bank',
      title: 'Axis Bank Dial-An-EMI / Mobile EMI',
      minAmount: '₹2,500',
      monthlyRoi: '1.20% - 1.40% p.m.',
      tenure: '3 - 24 Months',
      processingFee: '1.5% + GST',
      windowDays: 'Up to 45 Days',
      commission: '₹1,350',
      applyUrl: 'https://www.axisbank.com/retail/cards/credit-card/dial-an-emi',
      features: [
        'Convenient conversion via Mobile App, Internet Banking, or SMS',
        'Covers flight tickets, hospital bills, electronics, and insurance spends',
        'Transparent interest calculation without hidden compounding charges',
        'Available on all active primary and add-on Axis Bank credit cards',
      ],
    },
  ];

  // Live Amortization Calculation
  const emiSummary = useMemo(() => {
    const P = parseFloat(spendAmount) || 0;
    const mRate = (parseFloat(monthlyRoi) || 1.25) / 100;
    const n = tenureMonths;

    if (P <= 0 || mRate <= 0 || n <= 0) {
      return { monthlyEmi: 0, totalInterest: 0, totalPayable: 0, processingFee: 0 };
    }

    // Standard reducing balance monthly calculation
    const factor = Math.pow(1 + mRate, n);
    const emi = (P * mRate * factor) / (factor - 1);
    const totalPayable = emi * n;
    const totalInterest = totalPayable - P;
    const procFee = Math.max(199, Math.round(P * 0.015));

    return {
      monthlyEmi: Math.round(emi),
      totalInterest: Math.round(totalInterest),
      totalPayable: Math.round(totalPayable),
      processingFee: procFee,
    };
  }, [spendAmount, tenureMonths, monthlyRoi]);

  const handleShareScheme = async (s: SmartEmiScheme) => {
    try {
      const msg = `Convert Your Credit Card Bill into Easy Monthly EMIs!\n\n` +
        `• Bank: ${s.bank}\n` +
        `• Plan: ${s.title}\n` +
        `• Low Interest: ${s.monthlyRoi}\n` +
        `• Flexible Tenure: ${s.tenure}\n` +
        `• Keep all reward points earned on your card!\n\n` +
        `Convert here: ${s.applyUrl}`;

      await Share.share({
        title: s.title,
        message: msg,
      });
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  const handleApplyScheme = async (s: SmartEmiScheme) => {
    if (s.applyUrl) {
      const supported = await Linking.canOpenURL(s.applyUrl);
      if (supported) {
        await Linking.openURL(s.applyUrl);
        return;
      }
    }
    router.push({
      pathname: '/(app)/add-lead',
      params: {
        category: 'credit_card',
        productName: s.title,
        productId: s.id,
      },
    });
  };

  const handleAddLead = (s: SmartEmiScheme) => {
    router.push({
      pathname: '/(app)/add-lead',
      params: {
        category: 'credit_card',
        productName: s.title,
        productId: s.id,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Icon name="arrow-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Smart EMI On Card</Text>
            <Text style={styles.headerSubtitle}>
              Convert Spends into Flexible Low-Interest EMIs
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoIconWrap}>
              <Icon name="credit-card" size={24} color="#3B82F6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>Turn Big Purchases into Pocket-Friendly EMIs</Text>
              <Text style={styles.infoSubtitle}>
                Customers can convert large transactions (electronics, flight tickets, medical bills) into 3 to 48 months installments while keeping their card reward points.
              </Text>
            </View>
          </View>

          {/* Spend-to-EMI Calculator */}
          <View style={styles.calcCard}>
            <View style={styles.calcHeader}>
              <Icon name="activity" size={20} color={colors.primary} />
              <Text style={styles.calcTitle}>Spend Conversion Calculator</Text>
            </View>

            {/* Spend Amount */}
            <Text style={styles.calcLabel}>Transaction Amount (₹)</Text>
            <TextInput
              style={styles.calcInput}
              value={spendAmount}
              onChangeText={setSpendAmount}
              keyboardType="numeric"
              placeholder="45000"
              placeholderTextColor={colors.textLight}
            />

            {/* Tenure Selector */}
            <Text style={styles.calcLabel}>Tenure (Months)</Text>
            <View style={styles.tenureGrid}>
              {[3, 6, 9, 12, 18, 24, 36].map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.tenureBtn,
                    tenureMonths === m && styles.tenureBtnActive,
                  ]}
                  onPress={() => setTenureMonths(m)}
                >
                  <Text
                    style={[
                      styles.tenureBtnText,
                      tenureMonths === m && styles.tenureBtnTextActive,
                    ]}
                  >
                    {m}M
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Monthly Rate */}
            <Text style={styles.calcLabel}>Monthly Interest Rate (% p.m.)</Text>
            <TextInput
              style={styles.calcInput}
              value={monthlyRoi}
              onChangeText={setMonthlyRoi}
              keyboardType="numeric"
              placeholder="1.25"
              placeholderTextColor={colors.textLight}
            />

            {/* Breakdown Result */}
            <View style={styles.resultBox}>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Monthly Installment</Text>
                <Text style={styles.resultEmi}>₹{emiSummary.monthlyEmi.toLocaleString('en-IN')}/mo</Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Total Interest</Text>
                <Text style={styles.resultVal}>₹{emiSummary.totalInterest.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Proc. Fee (Est.)</Text>
                <Text style={styles.resultVal}>₹{emiSummary.processingFee}</Text>
              </View>
            </View>
          </View>

          {/* Schemes Header */}
          <Text style={styles.sectionHeading}>Official Bank Smart EMI Schemes</Text>

          {/* Schemes List */}
          {schemes.map((s) => (
            <View key={s.id} style={styles.schemeCard}>
              <View style={styles.schemeHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.schemeBank}>{s.bank}</Text>
                  <Text style={styles.schemeTitle}>{s.title}</Text>
                </View>
                <View style={styles.payoutBadge}>
                  <Text style={styles.payoutBadgeLabel}>COMMISSION</Text>
                  <Text style={styles.payoutBadgeVal}>{s.commission}</Text>
                </View>
              </View>

              {/* Metric Row */}
              <View style={styles.metricsRow}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Min Spend</Text>
                  <Text style={styles.metricVal}>{s.minAmount}</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Interest</Text>
                  <Text style={styles.metricVal}>{s.monthlyRoi}</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Tenure</Text>
                  <Text style={styles.metricVal}>{s.tenure}</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Window</Text>
                  <Text style={styles.metricVal}>{s.windowDays}</Text>
                </View>
              </View>

              {/* Features List */}
              <View style={styles.featuresList}>
                {s.features.map((feat, idx) => (
                  <View key={idx} style={styles.featureItem}>
                    <Icon name="check-circle" size={14} color="#10B981" />
                    <Text style={styles.featureText}>{feat}</Text>
                  </View>
                ))}
              </View>

              {/* Action Buttons */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.shareBtn}
                  onPress={() => handleShareScheme(s)}
                >
                  <Icon name="share-2" size={15} color="#3B82F6" />
                  <Text style={styles.shareBtnText}>Share</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.leadBtn}
                  onPress={() => handleAddLead(s)}
                >
                  <Icon name="user-plus" size={15} color="#10B981" />
                  <Text style={styles.leadBtnText}>Add Lead</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.applyBtn}
                  onPress={() => handleApplyScheme(s)}
                >
                  <Text style={styles.applyBtnText}>Apply Now</Text>
                  <Icon name="arrow-right" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  infoCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: spacing.md,
  },
  infoIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F620',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    lineHeight: 20,
  },
  infoSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    lineHeight: 18,
  },
  calcCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: spacing.lg,
  },
  calcHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  calcTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  calcLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 6,
    marginTop: 8,
  },
  calcInput: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#F8FAFC',
    fontSize: 14,
  },
  tenureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tenureBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
  },
  tenureBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tenureBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tenureBtnTextActive: {
    color: '#FFFFFF',
  },
  resultBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
  },
  resultItem: {
    alignItems: 'center',
    flex: 1,
  },
  resultLabel: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 2,
  },
  resultEmi: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10B981',
  },
  resultVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: spacing.md,
  },
  schemeCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: spacing.md,
  },
  schemeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  schemeBank: {
    fontSize: 11,
    fontWeight: '700',
    color: '#60A5FA',
    textTransform: 'uppercase',
  },
  schemeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 2,
  },
  payoutBadge: {
    backgroundColor: '#10B98115',
    borderWidth: 1,
    borderColor: '#10B98140',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  payoutBadgeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#10B981',
  },
  payoutBadgeVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10B981',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 2,
  },
  metricVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  featuresList: {
    marginTop: 10,
    gap: 5,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  featureText: {
    fontSize: 12,
    color: '#CBD5E1',
    flex: 1,
    lineHeight: 17,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#3B82F615',
    borderRadius: 6,
  },
  shareBtnText: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '600',
  },
  leadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#10B98115',
    borderRadius: 6,
  },
  leadBtnText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
  applyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
