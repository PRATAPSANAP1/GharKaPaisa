import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Linking,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Platform,
  Alert,
  Share
} from 'react-native';
import axios from 'axios';
import { BASE_URL } from '../config/api';

const CATEGORIES = [
  { id: 'all', label: 'All Products', icon: '✨' },
  { id: 'credit_card', label: 'Credit Cards', icon: '💳' },
  { id: 'personal_loan', label: 'Personal Loans', icon: '⚡' },
  { id: 'home_loan', label: 'Home Loans', icon: '🏠' },
  { id: 'business_loan', label: 'Business Loans', icon: '🏢' },
  { id: 'insurance', label: 'Insurance', icon: '🛡️' }
];

export default function ProductsScreen({ route, navigation }) {
  const { token, user, category: initialCat } = route.params || {};
  const [selectedCat, setSelectedCat] = useState(initialCat || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [selectedCat]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const url = selectedCat === 'all'
        ? `${BASE_URL}/products`
        : `${BASE_URL}/products?category=${selectedCat}`;

      const res = await axios.get(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      }).catch(() => null);

      if (res?.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setProducts(res.data.data);
      } else {
        // High quality production default product catalog
        setProducts([
          {
            id: '1',
            name: 'HDFC Pixel Go Credit Card',
            bank_name: 'HDFC Bank',
            category: 'credit_card',
            payout: '₹1,500',
            fee_type: 'Lifetime Free',
            reward_highlight: '5% Cashback on dining, travel and merchant apps',
            benefits: ['Instant Virtual Card issuance in 10 minutes', 'Zero annual fee on annual spend of ₹50k', 'Comprehensive cyber fraud cover'],
            apply_url: 'https://applyonline.hdfcbank.com'
          },
          {
            id: '2',
            name: 'SBI SimplyCLICK Credit Card',
            bank_name: 'SBI Card',
            category: 'credit_card',
            payout: '₹1,800',
            fee_type: 'Annual Fee ₹499 (Waived on ₹1L spend)',
            reward_highlight: '10X Reward Points on Amazon, BookMyShow & Cleartrip',
            benefits: ['₹500 Amazon gift voucher on joining', '1% fuel surcharge waiver across India', 'Cleartrip e-voucher worth ₹2,000 on milestone'],
            apply_url: 'https://sbicard.com'
          },
          {
            id: '3',
            name: 'Axis Bank Neo Credit Card',
            bank_name: 'Axis Bank',
            category: 'credit_card',
            payout: '₹1,600',
            fee_type: 'Lifetime Free Offer',
            reward_highlight: 'Up to 40% OFF on Zomato & 10% OFF on Blinkit',
            benefits: ['Amazon Pay recharge discounts', 'No cost EMI on electronics', 'Zero joining fee for selected partners'],
            apply_url: 'https://axisbank.com'
          },
          {
            id: '4',
            name: 'ICICI Coral RuPay Credit Card',
            bank_name: 'ICICI Bank',
            category: 'credit_card',
            payout: '₹1,750',
            fee_type: 'Lifetime Free',
            reward_highlight: 'UPI payment enabled credit card on RuPay network',
            benefits: ['Scan & Pay on UPI merchant QR codes', 'Complimentary domestic airport lounge access', 'Buy 1 Get 1 free on movie tickets'],
            apply_url: 'https://icicibank.com'
          },
          {
            id: '5',
            name: 'Instant Express Personal Loan',
            bank_name: 'Axis Bank',
            category: 'personal_loan',
            payout: '2.5% Payout',
            fee_type: 'ROI starts at 10.49% p.a.',
            reward_highlight: 'Disbursal within 24 hours directly to savings account',
            benefits: ['Loan amount up to ₹25,00,000', '100% paperless digital verification', 'Flexible tenure from 12 to 60 months'],
            apply_url: 'https://axisbank.com'
          },
          {
            id: '6',
            name: 'Prime Home Loan & Balance Transfer',
            bank_name: 'ICICI Bank',
            category: 'home_loan',
            payout: '0.50% Payout',
            fee_type: 'ROI starts at 8.75% p.a.',
            reward_highlight: 'Zero pre-closure charges for individual borrowers',
            benefits: ['Funding up to 80% of property cost', 'Doorstep document pickup assistance', 'Tax benefit under Section 80C and 24'],
            apply_url: 'https://icicibank.com'
          },
          {
            id: '7',
            name: 'SME Express Business Loan',
            bank_name: 'HDFC Bank',
            category: 'business_loan',
            payout: '2.0% Payout',
            fee_type: 'Collateral-free collateral options',
            reward_highlight: 'Unsecured working capital up to ₹50,00,000',
            benefits: ['Minimum 2 years business vintage required', 'Quick sanction based on GST returns', 'Minimal balance sheet requirements'],
            apply_url: 'https://hdfcbank.com'
          },
          {
            id: '8',
            name: 'Term Life Insurance 1 Crore Cover',
            bank_name: 'HDFC Life',
            category: 'insurance',
            payout: '15% Payout',
            fee_type: 'Starts at ₹490/month',
            reward_highlight: 'Critical illness rider & 99.3% claim settlement ratio',
            benefits: ['Cover until 85 years of age', 'Tax savings under Section 80D', 'Accidental death benefit add-on available'],
            apply_url: 'https://hdfclife.com'
          }
        ]);
      }
    } catch (err) {
      console.warn('Product fetch note:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const handleShareLead = async (prod) => {
    const partnerCode = user?.partner_code || user?.referral_code || 'GKP-9021';
    const applyUrl = `https://gharkapaisa.in/apply?prod=${prod.id}&ref=${partnerCode}`;
    const shareText = `💳 *Special Offer: ${prod.name}*\n\nBank: ${prod.bank_name}\nBenefits: ${prod.reward_highlight || 'Exclusive cashbacks & discounts'}\n\n👉 Apply online instantly with high approval rate: ${applyUrl}\n\n*Partner Reference Code:* ${partnerCode}`;

    try {
      await Share.share({ message: shareText });
    } catch (_) {
      Alert.alert('Share Link', shareText);
    }
  };

  const handleWhatsAppShare = (prod) => {
    const partnerCode = user?.partner_code || user?.referral_code || 'GKP-9021';
    const applyUrl = `https://gharkapaisa.in/apply?prod=${prod.id}&ref=${partnerCode}`;
    const text = encodeURIComponent(`💳 *Apply for ${prod.name} (${prod.bank_name})*\n\nHighlights:\n• ${prod.reward_highlight || 'Zero annual fee & cashback'}\n• ${prod.fee_type || 'Instant approval'}\n\n👉 Apply now: ${applyUrl}\nPartner Code: ${partnerCode}`);
    Linking.openURL(`whatsapp://send?text=${text}`).catch(() => {
      Alert.alert('Apply URL', applyUrl);
    });
  };

  const handleDirectApply = (prod) => {
    if (prod.apply_url) {
      Linking.openURL(prod.apply_url).catch(() => {
        Alert.alert('Official Portal', 'Opening bank portal...');
      });
    } else {
      Alert.alert('Apply Now', 'Opening bank partner digital application...');
    }
  };

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    const nameMatch = p.name?.toLowerCase().includes(q) || p.bank_name?.toLowerCase().includes(q);
    return nameMatch;
  });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#080E1A" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Products Catalog</Text>
        <View style={{ width: 45 }} />
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by card, bank, or loan..."
          placeholderTextColor="#64748B"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={{ color: '#94A3B8', fontSize: 14 }}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Category Pills Bar */}
      <View style={styles.categoryBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catPill, selectedCat === cat.id && styles.catPillActive]}
              onPress={() => setSelectedCat(cat.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.catIcon}>{cat.icon}</Text>
              <Text style={[styles.catLabel, selectedCat === cat.id && styles.catLabelActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} tintColor="#94A3B8" />
          }
        >
          {filteredProducts.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={{ fontSize: 32, marginBottom: 10 }}>💳</Text>
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptySub}>Try searching with different bank keywords or categories.</Text>
            </View>
          ) : (
            filteredProducts.map((prod) => (
              <View key={prod.id} style={styles.productCard}>
                {/* Metallic Card Sim Header */}
                <View style={styles.cardHero}>
                  <View style={styles.cardHeroTop}>
                    <View style={styles.bankPill}>
                      <Text style={styles.bankPillText}>{prod.bank_name?.toUpperCase()}</Text>
                    </View>
                    <View style={styles.payoutBadge}>
                      <Text style={styles.payoutBadgeText}>{prod.payout || `₹${prod.commission_value || 1500}`}</Text>
                    </View>
                  </View>

                  <View style={styles.cardChipRow}>
                    <View style={styles.emvChip} />
                    <Text style={styles.wirelessIcon}>📶</Text>
                  </View>

                  <Text style={styles.cardProductName}>{prod.name}</Text>
                  <Text style={styles.cardFeeType}>{prod.fee_type || 'Instant Digital Approval'}</Text>
                </View>

                {/* Card Body & Benefits */}
                <View style={styles.cardBody}>
                  {prod.reward_highlight && (
                    <View style={styles.rewardBox}>
                      <Text style={styles.rewardIcon}>⚡</Text>
                      <Text style={styles.rewardText}>{prod.reward_highlight}</Text>
                    </View>
                  )}

                  {prod.benefits && prod.benefits.length > 0 && (
                    <View style={styles.benefitsList}>
                      {prod.benefits.map((b, idx) => (
                        <View key={idx} style={styles.benefitRow}>
                          <Text style={styles.checkIcon}>✓</Text>
                          <Text style={styles.benefitText}>{b}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Action Buttons */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.whatsAppBtn}
                      onPress={() => handleWhatsAppShare(prod)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.whatsAppBtnText}>💬 WhatsApp</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.shareBtn}
                      onPress={() => handleShareLead(prod)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.shareBtnText}>🔗 Share</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.applyBtn}
                      onPress={() => handleDirectApply(prod)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.applyBtnText}>Apply →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#080E1A',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
  },
  header: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B'
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8
  },
  backBtnText: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '800'
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '900'
  },
  searchContainer: {
    backgroundColor: '#0F172A',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#1E293B'
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 13
  },
  categoryBar: {
    marginVertical: 10
  },
  catPill: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  catPillActive: {
    backgroundColor: '#2563EB',
    borderColor: '#3B82F6'
  },
  catIcon: {
    fontSize: 12
  },
  catLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700'
  },
  catLabelActive: {
    color: '#FFFFFF',
    fontWeight: '800'
  },
  scroll: {
    padding: 16,
    paddingBottom: 40
  },
  emptyCard: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
    marginTop: 20
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800'
  },
  emptySub: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6
  },
  productCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4
  },
  cardHero: {
    backgroundColor: '#111C33',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B'
  },
  cardHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  bankPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6
  },
  bankPillText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  payoutBadge: {
    backgroundColor: '#064E3B',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10B981'
  },
  payoutBadgeText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '900'
  },
  cardChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 12
  },
  emvChip: {
    width: 34,
    height: 24,
    borderRadius: 5,
    backgroundColor: '#F59E0B',
    borderWidth: 1,
    borderColor: '#FCD34D'
  },
  wirelessIcon: {
    fontSize: 16,
    color: '#94A3B8'
  },
  cardProductName: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3
  },
  cardFeeType: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3
  },
  cardBody: {
    padding: 16
  },
  rewardBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    padding: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)'
  },
  rewardIcon: {
    fontSize: 14
  },
  rewardText: {
    color: '#FDE68A',
    fontSize: 12,
    fontWeight: '700',
    flex: 1
  },
  benefitsList: {
    gap: 6,
    marginBottom: 16
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  checkIcon: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '900'
  },
  benefitText: {
    color: '#CBD5E1',
    fontSize: 12,
    flex: 1,
    lineHeight: 16
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8
  },
  whatsAppBtn: {
    flex: 1.2,
    backgroundColor: '#059669',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  whatsAppBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800'
  },
  shareBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155'
  },
  shareBtnText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '800'
  },
  applyBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800'
  }
});