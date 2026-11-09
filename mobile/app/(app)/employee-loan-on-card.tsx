import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Share,
  Alert,
  SafeAreaView,
  RefreshControl,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from '../../components/Icon';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import apiClient from '../../services/api';

interface LoanOffer {
  id: string;
  bank: string;
  name: string;
  badge?: string;
  maxAmount: string;
  interestRate: string;
  tenure: string;
  processingFee: string;
  disbursalTime: string;
  commission: string;
  features: string[];
  applyUrl: string;
}

const BANK_FILTERS = ['ALL', 'HDFC', 'ICICI', 'SBI', 'AXIS'];

export default function EmployeeLoanOnCreditCardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBank, setSelectedBank] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Interactive Calculator State
  const [calcAmount, setCalcAmount] = useState('150000');
  const [calcTenure, setCalcTenure] = useState(24); // months
  const [calcRoi, setCalcRoi] = useState('12.5'); // % p.a.

  const canonicalOffers: LoanOffer[] = useMemo(
    () => [
      {
        id: 'hdfc-insta-jumbo',
        bank: 'HDFC Bank',
        name: 'HDFC Bank Insta & Jumbo Loan',
        badge: 'Top Pick • 10-Sec Credit',
        maxAmount: 'Up to ₹15 Lakhs',
        interestRate: '11.49% - 14.50% p.a.',
        tenure: '12 - 60 Months',
        processingFee: '₹999 + GST',
        disbursalTime: 'Instant 10 Seconds',
        commission: '₹3,500',
        features: [
          'Insta Jumbo Loan available over & above existing credit card limit',
          'Instant 10-second cash credit directly into your bank savings account',
          'Zero physical documentation with 100% digital authorization',
          'No collateral or guarantor required; pre-approved based on card vintage',
        ],
        applyUrl:
          'https://applyonline.hdfc.bank.in/loan-against-assets/insta-jumbo-loan/insta-jumbo-form.html?Channel=DSA&DSACode=XYOH',
      },
      {
        id: 'icici-insta-loan',
        bank: 'ICICI Bank',
        name: 'ICICI Bank Loan On Credit Card',
        badge: 'Instant Transfer',
        maxAmount: 'Up to ₹10 Lakhs',
        interestRate: '12.00% - 15.00% p.a.',
        tenure: '12 - 48 Months',
        processingFee: '1.5% of Loan Amount',
        disbursalTime: 'Under 30 Minutes',
        commission: '₹3,000',
        features: [
          'Pre-approved loan on ICICI credit card with preferential interest',
          'Option to transfer into any savings account (ICICI or non-ICICI)',
          'Flexible monthly EMI repayment added to regular card statement',
          'Zero impact on existing credit card spend limit with Jumbo variant',
        ],
        applyUrl: 'https://www.icicibank.com/personal-banking/loans/loan-on-credit-card',
      },
      {
        id: 'sbi-card-encash',
        bank: 'SBI Card',
        name: 'SBI Card Encash & Encash 500',
        badge: 'Pre-Approved',
        maxAmount: 'Up to ₹8 Lakhs',
        interestRate: '12.50% - 16.00% p.a.',
        tenure: '12 - 48 Months',
        processingFee: '2% (Min ₹499)',
        disbursalTime: 'Same Day NEFT',
        commission: '₹2,800',
        features: [
          'Encash 500 allows cash transfer beyond existing credit card limit',
          'Direct NEFT credit into your primary bank account within 24 hours',
          'Minimal documentation for active cardholders with 6+ months track record',
          'Pre-closure facility available after 6 months with minimal fee',
        ],
        applyUrl: 'https://www.sbicard.com/en/personal/benefits/credit-card-loan.page',
      },
      {
        id: 'axis-card-loan',
        bank: 'Axis Bank',
        name: 'Axis Bank 24x7 Instant Card Loan',
        badge: 'Low Processing Fee',
        maxAmount: 'Up to ₹7.5 Lakhs',
        interestRate: '12.99% - 15.50% p.a.',
        tenure: '12 - 36 Months',
        processingFee: '1.5% + GST',
        disbursalTime: 'Instant 5 Minutes',
        commission: '₹2,500',
        features: [
          'End-to-end digital paperless loan sanction via mobile banking app',
          'Instant funds disbursement directly to registered bank account',
          'Special reduced interest rates for salaried corporate employees',
          'Fixed interest EMI structure without compounding charges',
        ],
        applyUrl: 'https://www.axisbank.com/retail/loans/loan-on-credit-card',
      },
    ],
    []
  );

  const [offers, setOffers] = useState<LoanOffer[]>(canonicalOffers);

  const loadOffers = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      // Attempt to load dynamic LOC / EOC products from backend
      try {
        const res = await apiClient.get('/products', {
          params: { category: 'loc_eoc', limit: 50 },
        });
        const rows = res.data?.data?.rows || res.data?.data || res.data?.products || [];
        if (Array.isArray(rows) && rows.length > 0) {
          const mapped: LoanOffer[] = rows.map((p: any) => ({
            id: p.id,
            bank: p.bank_name || p.bank || 'HDFC Bank',
            name: p.name || 'Instant Loan on Credit Card',
            badge: p.badge || 'Verified Banking Offer',
            maxAmount: p.max_amount || 'Up to ₹10 Lakhs',
            interestRate: p.interest_rate || '11.5% - 14.5% p.a.',
            tenure: p.tenure || '12 - 60 Months',
            processingFee: p.processing_fee || '₹999 + GST',
            disbursalTime: p.disbursal_speed || 'Instant 10 Sec',
            commission: p.commission_amount ? `₹${p.commission_amount}` : '₹3,000',
            features: Array.isArray(p.features)
              ? p.features
              : [p.description || 'Pre-approved loan over credit card limit'],
            applyUrl: p.apply_url || 'https://gharkapaisa.com/loan-on-card',
          }));
          setOffers(mapped);
        } else {
          setOffers(canonicalOffers);
        }
      } catch (_) {
        setOffers(canonicalOffers);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [canonicalOffers]);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  // EMI Calculation: P * r * (1+r)^n / ((1+r)^n - 1)
  const emiCalc = useMemo(() => {
    const P = parseFloat(calcAmount) || 0;
    const annualRate = parseFloat(calcRoi) || 12;
    const r = annualRate / 12 / 100;
    const n = calcTenure;

    if (P <= 0 || r <= 0 || n <= 0) {
      return { monthlyEmi: 0, totalInterest: 0, totalPayment: 0 };
    }

    const factor = Math.pow(1 + r, n);
    const emi = (P * r * factor) / (factor - 1);
    const totalPayment = emi * n;
    const totalInterest = totalPayment - P;

    return {
      monthlyEmi: Math.round(emi),
      totalInterest: Math.round(totalInterest),
      totalPayment: Math.round(totalPayment),
    };
  }, [calcAmount, calcTenure, calcRoi]);

  const filteredOffers = useMemo(() => {
    return offers.filter((offer) => {
      if (selectedBank !== 'ALL') {
        const b = offer.bank.toUpperCase();
        if (!b.includes(selectedBank)) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          offer.name.toLowerCase().includes(q) ||
          offer.bank.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [offers, selectedBank, searchQuery]);

  const handleShareOffer = async (offer: LoanOffer) => {
    try {
      const msg = `Get Pre-Approved Loan On Credit Card with GharKaPaisa!\n\n` +
        `• Bank: ${offer.bank}\n` +
        `• Offer: ${offer.name}\n` +
        `• Max Amount: ${offer.maxAmount}\n` +
        `• Interest Rate: ${offer.interestRate}\n` +
        `• Instant Cash Credit into Savings A/C in 10 seconds!\n\n` +
        `Check Eligibility & Apply: ${offer.applyUrl}`;

      await Share.share({
        title: offer.name,
        message: msg,
      });
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  const handleApplyOffer = async (offer: LoanOffer) => {
    if (offer.applyUrl) {
      const supported = await Linking.canOpenURL(offer.applyUrl);
      if (supported) {
        await Linking.openURL(offer.applyUrl);
        return;
      }
    }
    router.push({
      pathname: '/(app)/add-lead',
      params: {
        category: 'loan',
        productName: offer.name,
        productId: offer.id,
      },
    });
  };

  const handleAddLead = (offer: LoanOffer) => {
    router.push({
      pathname: '/(app)/add-lead',
      params: {
        category: 'loan',
        productName: offer.name,
        productId: offer.id,
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
            <Text style={styles.headerTitle}>Loan On Credit Card</Text>
            <Text style={styles.headerSubtitle}>
              Pre-Approved Cash Credit • 10-Second Disbursal
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadOffers(true)}
              tintColor={colors.primary}
            />
          }
        >
          {/* Hero Banner / Pitch Box */}
          <View style={styles.heroBox}>
            <View style={styles.heroBadge}>
              <Icon name="zap" size={14} color="#F59E0B" />
              <Text style={styles.heroBadgeText}>INSTA JUMBO FACILITY</Text>
            </View>
            <Text style={styles.heroTitle}>Loan Over & Above Card Limit</Text>
            <Text style={styles.heroSubtitle}>
              Help customers unlock cash credit straight into their savings account without blocking their existing credit card shopping limit.
            </Text>

            <View style={styles.heroPillRow}>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillText}>⚡ 10s Disbursal</Text>
              </View>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillText}>📄 Zero Docs</Text>
              </View>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillText}>💰 Payout ₹3,500+</Text>
              </View>
            </View>
          </View>

          {/* Interactive EMI Calculator Card */}
          <View style={styles.calcCard}>
            <View style={styles.calcHeader}>
              <Icon name="activity" size={20} color={colors.primary} />
              <Text style={styles.calcTitle}>EMI & Repayment Calculator</Text>
            </View>

            {/* Amount Input */}
            <Text style={styles.calcLabel}>Loan Amount (₹)</Text>
            <TextInput
              style={styles.calcInput}
              value={calcAmount}
              onChangeText={setCalcAmount}
              keyboardType="numeric"
              placeholder="e.g. 150000"
              placeholderTextColor={colors.textLight}
            />

            {/* Tenure Selector */}
            <Text style={styles.calcLabel}>Tenure (Months)</Text>
            <View style={styles.tenureRow}>
              {[12, 24, 36, 48, 60].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.tenureChip,
                    calcTenure === t && styles.tenureChipActive,
                  ]}
                  onPress={() => setCalcTenure(t)}
                >
                  <Text
                    style={[
                      styles.tenureChipText,
                      calcTenure === t && styles.tenureChipTextActive,
                    ]}
                  >
                    {t}M
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Interest Rate */}
            <Text style={styles.calcLabel}>Annual Interest Rate (% p.a.)</Text>
            <TextInput
              style={styles.calcInput}
              value={calcRoi}
              onChangeText={setCalcRoi}
              keyboardType="numeric"
              placeholder="12.5"
              placeholderTextColor={colors.textLight}
            />

            {/* Result Box */}
            <View style={styles.resultBox}>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Monthly EMI</Text>
                <Text style={styles.resultEmi}>₹{emiCalc.monthlyEmi.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Total Interest</Text>
                <Text style={styles.resultVal}>₹{emiCalc.totalInterest.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Total Payable</Text>
                <Text style={styles.resultVal}>₹{emiCalc.totalPayment.toLocaleString('en-IN')}</Text>
              </View>
            </View>
          </View>

          {/* Bank Filters */}
          <View style={styles.filterRow}>
            {BANK_FILTERS.map((b) => (
              <TouchableOpacity
                key={b}
                style={[
                  styles.filterBtn,
                  selectedBank === b && styles.filterBtnActive,
                ]}
                onPress={() => setSelectedBank(b)}
              >
                <Text
                  style={[
                    styles.filterBtnText,
                    selectedBank === b && styles.filterBtnTextActive,
                  ]}
                >
                  {b}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Search Box */}
          <View style={styles.searchBox}>
            <Icon name="search" size={16} color={colors.textLight} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search card loan schemes..."
              placeholderTextColor={colors.textLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Offers List */}
          {loading ? (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={{ marginTop: spacing.xl }}
            />
          ) : (
            filteredOffers.map((offer) => (
              <View key={offer.id} style={styles.offerCard}>
                <View style={styles.offerHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.offerBank}>{offer.bank}</Text>
                    <Text style={styles.offerName}>{offer.name}</Text>
                  </View>
                  <View style={styles.commBadge}>
                    <Text style={styles.commBadgeLabel}>COMMISSION</Text>
                    <Text style={styles.commBadgeVal}>{offer.commission}</Text>
                  </View>
                </View>

                {offer.badge && (
                  <View style={styles.offerBadgeBox}>
                    <Icon name="check-circle" size={14} color="#10B981" />
                    <Text style={styles.offerBadgeText}>{offer.badge}</Text>
                  </View>
                )}

                {/* Offer Metrics */}
                <View style={styles.metricsGrid}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Max Amount</Text>
                    <Text style={styles.metricVal}>{offer.maxAmount}</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Interest Rate</Text>
                    <Text style={styles.metricVal}>{offer.interestRate}</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Disbursal</Text>
                    <Text style={styles.metricVal}>{offer.disbursalTime}</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Tenure</Text>
                    <Text style={styles.metricVal}>{offer.tenure}</Text>
                  </View>
                </View>

                {/* Key Features */}
                <View style={styles.featuresBox}>
                  {offer.features.map((f, i) => (
                    <View key={i} style={styles.featureRow}>
                      <Icon name="check" size={14} color="#10B981" />
                      <Text style={styles.featureText}>{f}</Text>
                    </View>
                  ))}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.shareBtn}
                    onPress={() => handleShareOffer(offer)}
                  >
                    <Icon name="share-2" size={15} color="#3B82F6" />
                    <Text style={styles.shareBtnText}>Share</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.leadBtn}
                    onPress={() => handleAddLead(offer)}
                  >
                    <Icon name="user-plus" size={15} color="#10B981" />
                    <Text style={styles.leadBtnText}>Add Lead</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.applyBtn}
                    onPress={() => handleApplyOffer(offer)}
                  >
                    <Text style={styles.applyBtnText}>Instant Apply</Text>
                    <Icon name="arrow-right" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
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
  heroBox: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: spacing.md,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F59E0B20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FBBF24',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    lineHeight: 18,
  },
  heroPillRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  heroPill: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  heroPillText: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  calcCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: spacing.md,
  },
  calcHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
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
  tenureRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tenureChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  tenureChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tenureChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tenureChipTextActive: {
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
    fontSize: 15,
    fontWeight: '800',
    color: '#10B981',
  },
  resultVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  filterBtnTextActive: {
    color: '#FFFFFF',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 13,
    padding: 0,
  },
  offerCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: spacing.md,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  offerBank: {
    fontSize: 11,
    fontWeight: '700',
    color: '#60A5FA',
    textTransform: 'uppercase',
  },
  offerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 2,
  },
  commBadge: {
    backgroundColor: '#10B98115',
    borderWidth: 1,
    borderColor: '#10B98140',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  commBadgeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#10B981',
  },
  commBadgeVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10B981',
  },
  offerBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10B98115',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  offerBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#34D399',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    gap: 8,
  },
  metricItem: {
    width: '48%',
  },
  metricLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  metricVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F8FAFC',
    marginTop: 1,
  },
  featuresBox: {
    marginTop: 10,
    gap: 6,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    fontSize: 12,
    color: '#CBD5E1',
    flex: 1,
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
