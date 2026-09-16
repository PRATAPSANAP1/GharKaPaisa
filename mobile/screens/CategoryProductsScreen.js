import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  Linking,
  Alert,
  Platform
} from 'react-native';

const BANK_CARDS = {
  HDFC: [
    { id: 'h1', name: 'HDFC Pixel Go Credit Card', fee: 'Lifetime Free', reward: '5% Cashback on app purchases', link: 'https://applyonline.hdfc.bank.in' },
    { id: 'h2', name: 'HDFC Pixel Play Credit Card', fee: 'Lifetime Free', reward: 'Custom merchant rewards & dining deals', link: 'https://applyonline.hdfc.bank.in' },
    { id: 'h3', name: 'HDFC Regalia Gold Credit Card', fee: '₹2,500 / year', reward: 'Complimentary International Airport Lounges', link: 'https://applyonline.hdfc.bank.in' },
    { id: 'h4', name: 'HDFC Millennia Credit Card', fee: '₹1,000 / year (Waived)', reward: '5% cashback on Amazon, Flipkart, Swiggy', link: 'https://applyonline.hdfc.bank.in' }
  ],
  SBI: [
    { id: 's1', name: 'SBI SimplyCLICK Credit Card', fee: '₹499 / year', reward: '10X Reward Points on online partners', link: 'https://sbicard.com' },
    { id: 's2', name: 'SBI Cashback Credit Card', fee: '₹999 / year', reward: '5% Unlimited Cashback on online shopping', link: 'https://sbicard.com' },
    { id: 's3', name: 'SBI Prime Credit Card', fee: '₹2,999 / year', reward: '₹3,000 Welcome voucher & Trident Hotels privilege', link: 'https://sbicard.com' }
  ],
  AXIS: [
    { id: 'a1', name: 'Axis Bank Neo Credit Card', fee: 'Lifetime Free', reward: 'Zomato 40% off, BookMyShow & Amazon Pay discounts', link: 'https://axisbank.com' },
    { id: 'a2', name: 'Axis Bank MY Zone Credit Card', fee: 'Lifetime Free', reward: 'Buy 1 Get 1 Free Movie Tickets on Paytm', link: 'https://axisbank.com' },
    { id: 'a3', name: 'Axis Flipkart Credit Card', fee: '₹500 / year', reward: '5% Unlimited Cashback on Flipkart & Myntra', link: 'https://axisbank.com' }
  ]
};

const LOANS = [
  { id: 'l1', name: 'Personal Loan', roi: 'Starting from 10.5% p.a.', max: 'Up to ₹40 Lakhs', tenor: '12 - 60 Months' },
  { id: 'l2', name: 'Home Loan', roi: 'Starting from 8.4% p.a.', max: 'Up to ₹5 Crores', tenor: 'Up to 30 Years' },
  { id: 'l3', name: 'Business Loan', roi: 'Starting from 12.0% p.a.', max: 'Up to ₹1 Crore', tenor: '12 - 48 Months' },
  { id: 'l4', name: 'Loan Against Property', roi: 'Starting from 9.2% p.a.', max: 'Up to ₹10 Crores', tenor: 'Up to 15 Years' },
  { id: 'l5', name: 'Instant Salary Loan', roi: 'Starting from 14.0% p.a.', max: 'Up to ₹5 Lakhs', tenor: '3 - 24 Months' }
];

const INSURANCE = [
  { id: 'i1', name: 'Health Insurance Plan', desc: 'Cashless treatment at 10,000+ hospitals. Tax benefit under Section 80D.', icon: '🩺' },
  { id: 'i2', name: 'Term Life Insurance (₹1 Crore)', desc: 'Financial protection for family starting at ₹490/month.', icon: '🛡️' },
  { id: 'i3', name: 'Motor & Bike Insurance', desc: 'Instant policy renewal with zero documentation & cashless claims.', icon: '🚗' },
  { id: 'i4', name: 'Loan Protection Insurance', desc: 'Covers active loan balance in case of critical illness or emergency.', icon: '🤝' }
];

const SERVICES = [
  { id: 'v1', name: 'Income Tax Return (ITR) Filing', desc: 'Expert CA assistance for salaried & business income filing.', fee: 'From ₹499' },
  { id: 'v2', name: 'Private Limited / LLP Registration', desc: 'Complete company incorporation with DIN, PAN, TAN & Bank AC.', fee: 'From ₹2,999' },
  { id: 'v3', name: 'GST Registration & Monthly Returns', desc: 'New GSTIN generation & GSTR-1 / GSTR-3B filings.', fee: 'From ₹799' },
  { id: 'v4', name: 'MSME Udyam Certificate', desc: 'Government registration for small business subsidies & low interest loans.', fee: 'From ₹299' }
];

export default function CategoryProductsScreen({ route, navigation }) {
  const categoryType = route?.params?.category || 'credit_cards'; // 'credit_cards' | 'loans' | 'insurance' | 'services' | 'ltf' | 'attractive'
  const bankSlug = route?.params?.bankSlug || 'HDFC';
  const [selectedBank, setSelectedBank] = useState(bankSlug.toUpperCase());

  const getPageTitle = () => {
    switch (categoryType) {
      case 'loans': return 'Loans & Credit Offers';
      case 'insurance': return 'Insurance & Protection Plans';
      case 'services': return 'Financial & Business Services';
      case 'ltf': return 'Lifetime Free Credit Cards';
      case 'attractive': return 'Featured & High Payout Offers';
      default: return `${selectedBank} & Credit Cards`;
    }
  };

  const openLink = (url) => {
    if (url) {
      Linking.openURL(url).catch(() => Alert.alert('Notice', 'Cannot open banking link directly.'));
    } else {
      navigation.navigate('Login', { role: 'Partner' });
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
        <Text style={styles.headerTitle}>{getPageTitle()}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Bank Selector Row for Credit Cards */}
      {categoryType === 'credit_cards' && (
        <View style={styles.bankSelectorRow}>
          {['HDFC', 'SBI', 'AXIS'].map((b) => (
            <TouchableOpacity
              key={b}
              style={[styles.bankPill, selectedBank === b && styles.bankPillActive]}
              onPress={() => setSelectedBank(b)}
            >
              <Text style={[styles.bankPillText, selectedBank === b && styles.bankPillTextActive]}>{b} Bank Cards</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Credit Cards View */}
        {(categoryType === 'credit_cards' || categoryType === 'ltf') && (
          <View>
            {(BANK_CARDS[selectedBank] || BANK_CARDS.HDFC).map((card) => (
              <View key={card.id} style={styles.cardItem}>
                <View style={styles.cardBadge}>
                  <Text style={styles.cardBadgeText}>{card.fee}</Text>
                </View>
                <Text style={styles.cardName}>{card.name}</Text>
                <Text style={styles.cardReward}>🎁 {card.reward}</Text>

                <View style={styles.cardFooter}>
                  <TouchableOpacity style={styles.applyBtn} onPress={() => openLink(card.link)}>
                    <Text style={styles.applyBtnText}>Apply Now ➔</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Loans Category View */}
        {categoryType === 'loans' && (
          <View>
            {LOANS.map((loan) => (
              <View key={loan.id} style={styles.cardItem}>
                <Text style={styles.cardName}>{loan.name}</Text>
                <Text style={styles.cardReward}>🏷️ {loan.roi}</Text>
                <Text style={styles.cardSubText}>Max Disbursal: {loan.max}  •  Tenor: {loan.tenor}</Text>

                <TouchableOpacity style={[styles.applyBtn, { marginTop: 12 }]} onPress={() => navigation.navigate('Login', { role: 'Partner' })}>
                  <Text style={styles.applyBtnText}>Apply / Partner Lead ➔</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Insurance Category View */}
        {categoryType === 'insurance' && (
          <View>
            {INSURANCE.map((ins) => (
              <View key={ins.id} style={styles.cardItem}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 24, marginRight: 10 }}>{ins.icon}</Text>
                  <Text style={[styles.cardName, { flex: 1 }]}>{ins.name}</Text>
                </View>
                <Text style={[styles.cardSubText, { marginTop: 8 }]}>{ins.desc}</Text>

                <TouchableOpacity style={[styles.applyBtn, { marginTop: 12 }]} onPress={() => navigation.navigate('Login', { role: 'Partner' })}>
                  <Text style={styles.applyBtnText}>Get Quote ➔</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Financial Services Category View */}
        {categoryType === 'services' && (
          <View>
            {SERVICES.map((srv) => (
              <View key={srv.id} style={styles.cardItem}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.cardName}>{srv.name}</Text>
                  <Text style={styles.feeText}>{srv.fee}</Text>
                </View>
                <Text style={[styles.cardSubText, { marginTop: 6 }]}>{srv.desc}</Text>

                <TouchableOpacity style={[styles.applyBtn, { marginTop: 12 }]} onPress={() => navigation.navigate('Contact')}>
                  <Text style={styles.applyBtnText}>Enquire Now ➔</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
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
  headerTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  bankSelectorRow: { flexDirection: 'row', backgroundColor: '#FFFFFF', padding: 10, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', gap: 8 },
  bankPill: { flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  bankPillActive: { backgroundColor: '#0d47a1' },
  bankPillText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  bankPillTextActive: { color: '#FFFFFF', fontWeight: '800' },
  scroll: { padding: 16, paddingBottom: 40 },
  cardItem: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12, elevation: 1 },
  cardBadge: { alignSelf: 'flex-start', backgroundColor: '#ECFDF5', borderColor: '#10B981', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 8 },
  cardBadgeText: { fontSize: 10, fontWeight: '900', color: '#047857' },
  cardName: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  cardReward: { fontSize: 12, color: '#334155', fontWeight: '600', marginTop: 4 },
  cardSubText: { fontSize: 12, color: '#64748B', marginTop: 2 },
  feeText: { fontSize: 12, fontWeight: '800', color: '#059669' },
  cardFooter: { marginTop: 14, alignItems: 'flex-end' },
  applyBtn: { backgroundColor: '#0d47a1', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center' },
  applyBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
});
