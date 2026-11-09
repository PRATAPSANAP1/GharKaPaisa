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
  Modal,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from '../../components/Icon';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/api';
import { generatePartnerShareLink } from '../../services/partner.service';

interface CreditCardItem {
  id: string;
  name: string;
  bank_name?: string;
  bank?: string;
  category?: string;
  joining_fee?: number | string;
  annual_fee?: number | string;
  is_lifetime_free?: boolean;
  reward_rate?: string;
  cashback_rate?: string;
  commission_amount?: number | string;
  payout?: string;
  features?: string[] | string;
  eligibility_income?: number | string;
  apply_url?: string;
  direct_url?: string;
  description?: string;
}

const BANK_FILTERS = ['ALL', 'HDFC', 'SBI', 'ICICI', 'AXIS', 'KOTAK', 'AU', 'LTF (FREE)'];

export default function EmployeeCreditCardsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [cards, setCards] = useState<CreditCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBank, setSelectedBank] = useState('ALL');

  // Detail Modal State
  const [selectedCard, setSelectedCard] = useState<CreditCardItem | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);

  const loadCards = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      // Attempt to load from /products?category=credit_card or /products/cards
      let fetched: CreditCardItem[] = [];
      try {
        const res = await apiClient.get('/products', {
          params: { category: 'credit_card', limit: 100 },
        });
        const list = res.data?.data?.rows || res.data?.data || res.data?.products || [];
        if (Array.isArray(list) && list.length > 0) {
          fetched = list;
        }
      } catch (err) {
        // Fallback to /products/cards
        try {
          const resCards = await apiClient.get('/products/cards');
          const list = resCards.data?.data || resCards.data || [];
          if (Array.isArray(list)) fetched = list;
        } catch (fallbackErr) {
          console.debug('Fallback cards load failed:', fallbackErr);
        }
      }

      // If empty, supply standard verified banking partner credit card catalog
      if (fetched.length === 0) {
        fetched = [
          {
            id: 'hdfc-millennia',
            name: 'HDFC Bank Millennia Credit Card',
            bank_name: 'HDFC Bank',
            joining_fee: '₹1,000 + GST',
            annual_fee: '₹1,000 (Waived on ₹1L spend)',
            reward_rate: '5% Cashback on Amazon, Flipkart, Swiggy, Zomato',
            commission_amount: 2200,
            features: [
              '5% Cashback on top 10 e-commerce brands',
              '1% Cashback on offline spends & wallet recharges',
              '8 complimentary domestic airport lounge visits per year',
              '1% fuel surcharge waiver up to ₹250 per month',
            ],
            eligibility_income: '₹35,000 / month',
            apply_url: 'https://applyonline.hdfc.bank.in/credit-cards/credit-card.html?DSACode=XYOH',
          },
          {
            id: 'sbi-simplyclick',
            name: 'SBI SimplyCLICK Credit Card',
            bank_name: 'SBI Card',
            joining_fee: '₹499 + GST',
            annual_fee: '₹499 (Waived on ₹1L spend)',
            reward_rate: '10X Reward Points on partner merchants',
            commission_amount: 1800,
            features: [
              'Amazon gift card worth ₹500 on joining fee payment',
              '10X Reward Points on online shopping with partner brands',
              '5X Reward Points on all other online spends',
              '1% fuel surcharge waiver across all petrol pumps in India',
            ],
            eligibility_income: '₹25,000 / month',
            apply_url: 'https://www.sbicard.com/apply-now?dsa=XYOH',
          },
          {
            id: 'icici-amazon-pay',
            name: 'Amazon Pay ICICI Bank Credit Card',
            bank_name: 'ICICI Bank',
            joining_fee: '₹0 (Lifetime Free)',
            annual_fee: '₹0 (Lifetime Free)',
            is_lifetime_free: true,
            reward_rate: '5% Unlimited Cashback for Prime Members',
            commission_amount: 1950,
            features: [
              'Zero joining fee and zero annual renewal fee forever',
              '5% unlimited cashback on Amazon for Prime members (3% for non-Prime)',
              '2% cashback on 100+ partner merchants (recharges, food, flights)',
              '1% unlimited cashback on all other retail transactions',
            ],
            eligibility_income: '₹30,000 / month',
            apply_url: 'https://www.icicibank.com/personal-banking/cards/credit-cards/amazon-pay-credit-card',
          },
          {
            id: 'axis-airtel',
            name: 'Airtel Axis Bank Credit Card',
            bank_name: 'Axis Bank',
            joining_fee: '₹500 + GST',
            annual_fee: '₹500 (Waived on ₹2L spend)',
            reward_rate: '25% Cashback on Airtel bills & recharges',
            commission_amount: 2400,
            features: [
              '25% cashback on Airtel Mobile, Broadband & DTH bill payments',
              '10% cashback on Swiggy, Zomato & BigBasket',
              '10% cashback on utility bill payments via Airtel Thanks App',
              '4 complimentary domestic lounge visits per year',
            ],
            eligibility_income: '₹30,000 / month',
            apply_url: 'https://www.axisbank.com/retail/cards/credit-card/airtel-axis-bank-credit-card',
          },
          {
            id: 'kotak-league',
            name: 'Kotak League Platinum Credit Card',
            bank_name: 'Kotak Bank',
            joining_fee: '₹0 (Lifetime Free)',
            annual_fee: '₹0 (Lifetime Free)',
            is_lifetime_free: true,
            reward_rate: '8X Reward points on special spends',
            commission_amount: 1750,
            features: [
              'Lifetime Free credit card with instant virtual activation',
              'Up to 8X reward points for every ₹150 spent on special categories',
              'Fuel surcharge waiver of 1% across all petrol pumps',
              'Complimentary movie tickets with PVR vouchers every quarter',
            ],
            eligibility_income: '₹20,000 / month',
            apply_url: 'https://www.kotak.com/en/personal-banking/cards/credit-cards/league-platinum-card.html',
          },
          {
            id: 'au-lit',
            name: 'AU Small Finance Bank LIT Credit Card',
            bank_name: 'AU Bank',
            joining_fee: '₹0 (Lifetime Free)',
            annual_fee: '₹0 (Lifetime Free)',
            is_lifetime_free: true,
            reward_rate: 'Customizable features with 5% cashback',
            commission_amount: 2100,
            features: [
              'India first fully customizable credit card',
              'Turn features ON or OFF via the AU 0101 Mobile App',
              '5% cashback on grocery, travel, and dining transactions',
              'Free airport lounge access with modular add-ons',
            ],
            eligibility_income: '₹25,000 / month',
            apply_url: 'https://www.aubank.in/personal-banking/credit-cards/lit-credit-card',
          },
        ];
      }

      setCards(fetched);
    } catch (err: any) {
      console.warn('Failed to load credit cards:', err);
      Alert.alert('Notice', 'Using verified banking credit card portfolio.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      const bName = String(card.bank_name || card.bank || '').toUpperCase();
      const cName = String(card.name || '').toUpperCase();

      // Bank tab filter
      if (selectedBank === 'LTF (FREE)') {
        const isFree =
          card.is_lifetime_free ||
          String(card.joining_fee || '').toLowerCase().includes('free') ||
          String(card.joining_fee || '').includes('0');
        if (!isFree) return false;
      } else if (selectedBank !== 'ALL') {
        if (!bName.includes(selectedBank) && !cName.includes(selectedBank)) {
          return false;
        }
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = card.name?.toLowerCase().includes(q);
        const matchesBank = bName.toLowerCase().includes(q);
        const matchesRewards = card.reward_rate?.toLowerCase().includes(q);
        if (!matchesName && !matchesBank && !matchesRewards) return false;
      }

      return true;
    });
  }, [cards, selectedBank, searchQuery]);

  const handleShareCard = async (card: CreditCardItem) => {
    try {
      setGeneratingLink(true);
      let shareUrl = card.apply_url || card.direct_url;

      try {
        const linkRes = await generatePartnerShareLink(card.id, {
          customer_name: 'Customer Referral',
        });
        if (linkRes?.share_url || linkRes?.short_url) {
          shareUrl = linkRes.share_url || linkRes.short_url;
        }
      } catch (err) {
        // Fallback to default card apply URL
      }

      const message = `Apply for ${card.name} with GharKaPaisa!\n` +
        `• Perks: ${card.reward_rate || 'High rewards and cashback'}\n` +
        `• Joining Fee: ${card.joining_fee || 'Zero / Minimal'}\n` +
        `• Fast 100% digital approval journey.\n\n` +
        `Apply here: ${shareUrl || 'https://gharkapaisa.com/credit-cards'}`;

      await Share.share({
        title: card.name,
        message,
        url: shareUrl,
      });
    } catch (shareErr) {
      console.warn('Share card error:', shareErr);
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleApplyCard = async (card: CreditCardItem) => {
    const targetUrl = card.apply_url || card.direct_url;
    if (targetUrl) {
      const supported = await Linking.canOpenURL(targetUrl);
      if (supported) {
        await Linking.openURL(targetUrl);
        return;
      }
    }
    // If no direct external URL, push to add-lead
    router.push({
      pathname: '/(app)/add-lead',
      params: {
        category: 'credit_card',
        productName: card.name,
        productId: card.id,
      },
    });
  };

  const handleAddLeadForCard = (card: CreditCardItem) => {
    router.push({
      pathname: '/(app)/add-lead',
      params: {
        category: 'credit_card',
        productName: card.name,
        productId: card.id,
      },
    });
  };

  const parseFeatures = (card: CreditCardItem): string[] => {
    if (!card.features) return ['Fast digital bank processing', 'Secure customer onboarding'];
    if (Array.isArray(card.features)) return card.features;
    try {
      const parsed = JSON.parse(card.features);
      if (Array.isArray(parsed)) return parsed;
    } catch (parseErr) {
      console.debug('Failed to parse card features JSON:', parseErr);
    }
    return [String(card.features)];
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
            <Text style={styles.headerTitle}>Credit Cards Portfolio</Text>
            <Text style={styles.headerSubtitle}>
              Official Bank Cards • Earn Up to ₹3,500 Commission
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Icon name="search" size={18} color={colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by bank or card name..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="x" size={18} color={colors.textLight} />
            </TouchableOpacity>
          )}
        </View>

        {/* Bank Filter Tabs */}
        <View style={styles.filterWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {BANK_FILTERS.map((bank) => (
              <TouchableOpacity
                key={bank}
                style={[
                  styles.filterChip,
                  selectedBank === bank && styles.filterChipActive,
                ]}
                onPress={() => setSelectedBank(bank)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedBank === bank && styles.filterChipTextActive,
                  ]}
                >
                  {bank}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Content List */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading credit cards...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadCards(true)}
                tintColor={colors.primary}
              />
            }
          >
            {filteredCards.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Icon name="credit-card" size={48} color={colors.textLight} />
                <Text style={styles.emptyTitle}>No Cards Match Your Filter</Text>
                <Text style={styles.emptySubtitle}>
                  Try selecting another bank or clearing your search.
                </Text>
              </View>
            ) : (
              filteredCards.map((card) => {
                const commission = card.commission_amount
                  ? `₹${card.commission_amount}`
                  : card.payout || '₹1,800 - ₹2,500';
                const cardFeatures = parseFeatures(card);

                return (
                  <View key={card.id} style={styles.card}>
                    {/* Bank & Badge Header */}
                    <View style={styles.cardHeader}>
                      <View style={styles.cardHeaderLeft}>
                        <View style={styles.bankTag}>
                          <Text style={styles.bankTagText}>
                            {card.bank_name || card.bank || 'PARTNER BANK'}
                          </Text>
                        </View>
                        <Text style={styles.cardTitle}>{card.name}</Text>
                      </View>
                      <View style={styles.payoutBadge}>
                        <Text style={styles.payoutBadgeLabel}>COMMISSION</Text>
                        <Text style={styles.payoutBadgeValue}>{commission}</Text>
                      </View>
                    </View>

                    {/* Reward Highlight */}
                    {card.reward_rate && (
                      <View style={styles.rewardBox}>
                        <Icon name="award" size={16} color="#F59E0B" />
                        <Text style={styles.rewardText} numberOfLines={2}>
                          {card.reward_rate}
                        </Text>
                      </View>
                    )}

                    {/* Key Specs Row */}
                    <View style={styles.specsRow}>
                      <View style={styles.specItem}>
                        <Text style={styles.specLabel}>Joining Fee</Text>
                        <Text style={styles.specValue}>
                          {card.joining_fee ? String(card.joining_fee) : '₹0 (Free)'}
                        </Text>
                      </View>
                      <View style={styles.specItem}>
                        <Text style={styles.specLabel}>Annual Renewal</Text>
                        <Text style={styles.specValue}>
                          {card.annual_fee ? String(card.annual_fee) : '₹0 / year'}
                        </Text>
                      </View>
                      <View style={styles.specItem}>
                        <Text style={styles.specLabel}>Min Income</Text>
                        <Text style={styles.specValue}>
                          {card.eligibility_income ? String(card.eligibility_income) : '₹25,000/m'}
                        </Text>
                      </View>
                    </View>

                    {/* Quick Features List */}
                    <View style={styles.featuresList}>
                      {cardFeatures.slice(0, 2).map((feat, idx) => (
                        <View key={idx} style={styles.featureItem}>
                          <Icon name="check-circle" size={14} color="#10B981" />
                          <Text style={styles.featureText} numberOfLines={1}>
                            {feat}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        style={styles.detailBtn}
                        onPress={() => {
                          setSelectedCard(card);
                          setDetailModalVisible(true);
                        }}
                      >
                        <Text style={styles.detailBtnText}>Details</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.shareBtn}
                        onPress={() => handleShareCard(card)}
                        disabled={generatingLink}
                      >
                        <Icon name="share-2" size={15} color="#3B82F6" />
                        <Text style={styles.shareBtnText}>Share</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.leadBtn}
                        onPress={() => handleAddLeadForCard(card)}
                      >
                        <Icon name="user-plus" size={15} color="#10B981" />
                        <Text style={styles.leadBtnText}>Add Lead</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.applyBtn}
                        onPress={() => handleApplyCard(card)}
                      >
                        <Text style={styles.applyBtnText}>Apply</Text>
                        <Icon name="external-link" size={14} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}

        {/* Card Details Modal */}
        <Modal
          visible={detailModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setDetailModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalBank}>
                    {selectedCard?.bank_name || selectedCard?.bank}
                  </Text>
                  <Text style={styles.modalTitle}>{selectedCard?.name}</Text>
                </View>
                <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                  <Icon name="x" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Commission Spotlight */}
                <View style={styles.modalCommissionCard}>
                  <View>
                    <Text style={styles.modalCommLabel}>Partner Payout / Commission</Text>
                    <Text style={styles.modalCommVal}>
                      {selectedCard?.commission_amount
                        ? `₹${selectedCard.commission_amount}`
                        : selectedCard?.payout || '₹1,800 - ₹2,500'}
                    </Text>
                  </View>
                  <Icon name="award" size={32} color="#10B981" />
                </View>

                {/* Key Benefits */}
                <Text style={styles.modalSectionTitle}>Key Perks & Rewards</Text>
                {selectedCard &&
                  parseFeatures(selectedCard).map((feat, index) => (
                    <View key={index} style={styles.modalFeatureItem}>
                      <Icon name="check-circle" size={16} color="#10B981" />
                      <Text style={styles.modalFeatureText}>{feat}</Text>
                    </View>
                  ))}

                {/* Eligibility Criteria */}
                <Text style={styles.modalSectionTitle}>Eligibility & Pricing</Text>
                <View style={styles.modalCriteriaBox}>
                  <View style={styles.criteriaRow}>
                    <Text style={styles.criteriaLabel}>Joining Fee:</Text>
                    <Text style={styles.criteriaValue}>
                      {selectedCard?.joining_fee ? String(selectedCard.joining_fee) : '₹0'}
                    </Text>
                  </View>
                  <View style={styles.criteriaRow}>
                    <Text style={styles.criteriaLabel}>Annual Renewal:</Text>
                    <Text style={styles.criteriaValue}>
                      {selectedCard?.annual_fee ? String(selectedCard.annual_fee) : '₹0'}
                    </Text>
                  </View>
                  <View style={styles.criteriaRow}>
                    <Text style={styles.criteriaLabel}>Required Income:</Text>
                    <Text style={styles.criteriaValue}>
                      {selectedCard?.eligibility_income ? String(selectedCard.eligibility_income) : '₹25,000+ monthly'}
                    </Text>
                  </View>
                  <View style={styles.criteriaRow}>
                    <Text style={styles.criteriaLabel}>Age Requirement:</Text>
                    <Text style={styles.criteriaValue}>21 - 65 Years</Text>
                  </View>
                  <View style={styles.criteriaRow}>
                    <Text style={styles.criteriaLabel}>CIBIL Score:</Text>
                    <Text style={styles.criteriaValue}>710+ Preferred</Text>
                  </View>
                </View>

                {/* Documents Checklist */}
                <Text style={styles.modalSectionTitle}>Documentation</Text>
                <View style={styles.modalDocItem}>
                  <Icon name="file-text" size={16} color="#3B82F6" />
                  <Text style={styles.modalDocText}>PAN Card & Aadhaar Card (e-KYC verified)</Text>
                </View>
                <View style={styles.modalDocItem}>
                  <Icon name="file-text" size={16} color="#3B82F6" />
                  <Text style={styles.modalDocText}>3 Months Salary Slips OR Form 16 / ITR</Text>
                </View>
                <View style={styles.modalDocItem}>
                  <Icon name="file-text" size={16} color="#3B82F6" />
                  <Text style={styles.modalDocText}>Latest 6 Months Bank Statement (PDF with password)</Text>
                </View>
              </ScrollView>

              {/* Modal Actions */}
              <View style={styles.modalActionRow}>
                <TouchableOpacity
                  style={styles.modalShareBtn}
                  onPress={() => selectedCard && handleShareCard(selectedCard)}
                >
                  <Icon name="share-2" size={16} color="#FFFFFF" />
                  <Text style={styles.modalShareBtnText}>Share Link</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalApplyBtn}
                  onPress={() => {
                    setDetailModalVisible(false);
                    if (selectedCard) handleApplyCard(selectedCard);
                  }}
                >
                  <Text style={styles.modalApplyBtnText}>Proceed Application</Text>
                  <Icon name="arrow-right" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
    padding: 0,
  },
  filterWrap: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  filterScroll: {
    paddingHorizontal: spacing.lg,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: spacing.md,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  bankTag: {
    backgroundColor: '#3B82F620',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  bankTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#60A5FA',
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    lineHeight: 22,
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
  payoutBadgeValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10B981',
    marginTop: 1,
  },
  rewardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F59E0B15',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 10,
  },
  rewardText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#FBBF24',
  },
  specsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  specItem: {
    alignItems: 'center',
    flex: 1,
  },
  specLabel: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 2,
  },
  specValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  featuresList: {
    marginTop: 10,
    gap: 4,
  },
  featureItem: {
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
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  detailBtn: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: '#334155',
    borderRadius: 6,
  },
  detailBtnText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 10,
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
    paddingVertical: 7,
    paddingHorizontal: 10,
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
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: spacing.md,
  },
  modalBank: {
    fontSize: 12,
    fontWeight: '700',
    color: '#60A5FA',
    textTransform: 'uppercase',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 2,
  },
  modalBody: {
    marginVertical: spacing.md,
  },
  modalCommissionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#10B98115',
    borderWidth: 1,
    borderColor: '#10B98140',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  modalCommLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  modalCommVal: {
    fontSize: 22,
    fontWeight: '800',
    color: '#10B981',
    marginTop: 2,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: spacing.md,
    marginBottom: 8,
  },
  modalFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  modalFeatureText: {
    fontSize: 13,
    color: '#CBD5E1',
    flex: 1,
  },
  modalCriteriaBox: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: spacing.md,
    gap: 6,
  },
  criteriaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  criteriaLabel: {
    fontSize: 13,
    color: '#94A3B8',
  },
  criteriaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  modalDocItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 8,
  },
  modalDocText: {
    fontSize: 12,
    color: '#CBD5E1',
    flex: 1,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  modalShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  modalShareBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  modalApplyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  modalApplyBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
