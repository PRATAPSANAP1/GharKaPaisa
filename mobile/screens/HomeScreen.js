import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Image, SafeAreaView, StatusBar, ScrollView,
  Dimensions, Modal, FlatList, Linking, Platform,
  TextInput, Alert
} from 'react-native';

const { width } = Dimensions.get('window');

// Data Lists matching Web & Mobile Platform
const banners = [
  { id: '1', title: "Lifetime Free Credit Cards", desc: "No joining fee. No annual charges.", color: "#1a237e", badge: "POPULAR" },
  { id: '2', title: "Personal & Business Loans", desc: "Low interest rates starting from 10.5% p.a.", color: "#004d40", badge: "INSTANT DISBURSAL" },
  { id: '3', title: "Comprehensive Insurance", desc: "Protect your health, life, and motor assets.", color: "#3e2723", badge: "TAX SAVER" },
  { id: '4', title: "Smart EMI Offers", desc: "Convert big purchases to low-cost EMIs.", color: "#4a148c", badge: "ZERO DOWN PAYMENT" }
];

const moneyTransferData = [
  { id: '1', label: "To Mobile", icon: "📱", desc: "Send money instantly", color: "#27ae60" },
  { id: '2', label: "Recharge", icon: "💸", desc: "Mobile, DTH, FASTag", color: "#2980b9" },
  { id: '3', label: "Electricity", icon: "⚡", desc: "Pay electricity bills", color: "#f39c12" },
  { id: '4', label: "Loan Repay", icon: "💰", desc: "EMI & Loan Payments", color: "#8e44ad" },
  { id: '5', label: "FASTag", icon: "🏷️", desc: "Recharge FASTag tag", color: "#3498db" },
  { id: '6', label: "Gas Bill", icon: "🔥", desc: "Piped gas payment", color: "#e67e22" }
];

const travelTransitData = [
  { id: '1', label: "Flight", icon: "✈️" },
  { id: '2', label: "Train", icon: "🚊" },
  { id: '3', label: "Bus", icon: "🚌" },
  { id: '4', label: "Hotels", icon: "🏨" },
  { id: '5', label: "Metro", icon: "🚇" }
];

const allLoansData = [
  { id: '1', label: "Personal Loan", icon: "🪙", rate: "10.5%" },
  { id: '2', label: "Home Loan", icon: "🏠", rate: "8.4%" },
  { id: '3', label: "Business Loan", icon: "🏢", rate: "12.0%" },
  { id: '4', label: "Education Loan", icon: "🎓", rate: "9.5%" },
  { id: '5', label: "Car Loan", icon: "🚗", rate: "8.9%" },
  { id: '6', label: "Used Car Loan", icon: "🏎️", rate: "11.2%" },
  { id: '7', label: "Instant Loan", icon: "📲", rate: "14.0%" },
  { id: '8', label: "Loan Against Property", icon: "🏙️", rate: "9.2%" },
  { id: '9', label: "Gold Loan", icon: "🥇", rate: "7.9%" },
  { id: '10', label: "Loan Against Car", icon: "🚘", rate: "10.8%" },
  { id: '11', label: "2 Wheeler Loan", icon: "🏍️", rate: "11.5%" },
  { id: '12', label: "Loan Against Mutual Funds", icon: "📈", rate: "10.0%" }
];

const partnerBanks = [
  { id: '1', name: "HDFC Bank", rating: "★★★★★", code: "HDFC", color: "#004B87" },
  { id: '2', name: "SBI Bank", rating: "★★★★★", code: "SBI", color: "#280071" },
  { id: '3', name: "Axis Bank", rating: "★★★★☆", code: "AXIS", color: "#97144D" },
  { id: '4', name: "ICICI Bank", rating: "★★★★☆", code: "ICICI", color: "#F37021" },
  { id: '5', name: "Kotak Bank", rating: "★★★★☆", code: "KOTAK", color: "#EE1C25" },
  { id: '6', name: "YES Bank", rating: "★★★★☆", code: "YES", color: "#004F9F" },
  { id: '7', name: "Bank of Baroda", rating: "★★★★☆", code: "BOB", color: "#FF6600" }
];

const insuranceData = [
  { id: '1', label: "Health Insurance", icon: "🩺", desc: "Cashless hospitalization & Tax Benefits u/s 80D" },
  { id: '2', label: "Life Insurance", icon: "🛡️", desc: "Term plan coverage up to ₹1 Crore" },
  { id: '3', label: "General Insurance", icon: "🚗", desc: "Motor, bike & commercial vehicle protection" },
  { id: '4', label: "Loan Protection", icon: "🤝", desc: "Protect your active loan liabilities" }
];

const servicesData = [
  { id: '1', label: "GST Returns", icon: "📄", desc: "Monthly & Annual GST compliance" },
  { id: '2', label: "Company Reg.", icon: "🏢", desc: "Private Limited & LLP formation" },
  { id: '3', label: "ITR Filing", icon: "🧮", desc: "Income tax return filing for Individuals & CA" },
  { id: '4', label: "PF & ESIC", icon: "👥", desc: "Employee Provident Fund registration" },
  { id: '5', label: "TDS Filing", icon: "💳", desc: "Quarterly TDS statement returns" },
  { id: '6', label: "MSME Udyam", icon: "🏭", desc: "Government Udyam Certificate" }
];

const ltfCards = [
  { 
    id: '1',
    name: "HDFC Pixel Go Credit Card", 
    desc: "Digital-first customizable credit card with instant app approval",
    link: "https://applyonline.hdfc.bank.in/cards/credit-cards.html?CHANNELSOURCE=ZETA&DSACode=XYOH&LGcode=&LCcode=DIGIX1&LC2=DIGIX1&SMcode=S54558#nbb"
  },
  { 
    id: '2',
    name: "HDFC Pixel Play Credit Card", 
    desc: "Custom rewards on shopping, dining & entertainment apps",
    link: "https://applyonline.hdfc.bank.in/cards/credit-cards.html?CHANNELSOURCE=ZETA&DSACode=XYOH&LGcode=&LCcode=DIGIX1&LC2=DIGIX1&SMcode=S54558#nbb"
  },
  { 
    id: '3',
    name: "Axis Bank Neo Credit Card", 
    desc: "Zomato 40% off, BookMyShow and utility discounts",
    link: "https://axisbank.com"
  },
  { 
    id: '4',
    name: "Axis Bank MY Zone Credit Card", 
    desc: "Buy 1 Get 1 Free on movie tickets & complimentary airport lounges",
    link: "https://axisbank.com"
  },
  {
    id: '5',
    name: "SBI Cashback Credit Card",
    desc: "5% cashback on online shopping without merchant restrictions",
    link: "https://sbicard.com"
  },
  {
    id: '6',
    name: "ICICI Platinum Chip Credit Card",
    desc: "Zero annual fee, contactless payment and dining privileges",
    link: "https://icicibank.com"
  }
];

export default function HomeScreen({ navigation }) {
  const [loansModalVisible, setLoansModalVisible] = useState(false);
  const [loanSearch, setLoanSearch] = useState('');

  const visibleLoans = allLoansData.slice(0, 7);
  const filteredLoans = allLoansData.filter((l) =>
    l.label.toLowerCase().includes(loanSearch.toLowerCase())
  );

  const openExternalLink = (url) => {
    if (!url) return;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert("Notice", "Cannot open link on this device.");
        }
      })
      .catch((err) => console.warn("Failed to open link:", err));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />

      {/* Cross-Platform Header */}
      <View style={styles.navbar}>
        <View style={styles.navLeft}>
          <Image source={require('../assets/icon.png')} style={styles.logo} />
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.navTitle}>GharKaPaisa</Text>
            <Text style={styles.navSub}>Financial Services Platform</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity 
            style={[styles.loginBtn, { backgroundColor: '#F1F5F9' }]} 
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={[styles.loginBtnText, { color: '#0d47a1' }]}>Register</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.loginBtn} 
            onPress={() => navigation.navigate('Login', { role: 'Partner' })}
          >
            <Text style={styles.loginBtnText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        {/* Banner Carousel */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.bannerScroll}
        >
          {banners.map((b) => (
            <View key={b.id} style={[styles.bannerCard, { backgroundColor: b.color }]}>
              <View style={styles.bannerBadge}><Text style={styles.bannerBadgeText}>{b.badge}</Text></View>
              <Text style={styles.bannerTitle}>{b.title}</Text>
              <Text style={styles.bannerDesc}>{b.desc}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Money Transfer & Payments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Money Transfer & Payments</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {moneyTransferData.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.circleCard}
                onPress={() => Alert.alert(item.label, `${item.desc} - Feature active in production portal.`)}
              >
                <Text style={styles.circleIcon}>{item.icon}</Text>
                <Text style={styles.circleLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Travel & Transit */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Travel & Transit</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {travelTransitData.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.circleCard}
                onPress={() => Alert.alert(item.label, `Book ${item.label} tickets with extra partner cashbacks.`)}
              >
                <Text style={styles.circleIcon}>{item.icon}</Text>
                <Text style={styles.circleLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Insurance & Protection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insurance & Protection</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {insuranceData.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.circleCard}
                onPress={() => navigation.navigate('CategoryProducts', { category: 'insurance' })}
              >
                <Text style={styles.circleIcon}>{item.icon}</Text>
                <Text style={styles.circleLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Business & Financial Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business & Financial Services</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {servicesData.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.circleCard}
                onPress={() => navigation.navigate('CategoryProducts', { category: 'services' })}
              >
                <Text style={styles.circleIcon}>{item.icon}</Text>
                <Text style={styles.circleLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Loans - Grid Layout (Max 8 buttons) */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Loans & Credit</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CategoryProducts', { category: 'loans' })}>
              <Text style={styles.viewAllText}>View All (12) →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.grid}>
            {visibleLoans.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.gridCard}
                onPress={() => navigation.navigate('CategoryProducts', { category: 'loans' })}
              >
                <Text style={styles.gridIcon}>{item.icon}</Text>
                <Text style={styles.gridLabel}>{item.label}</Text>
                <Text style={styles.gridRate}>From {item.rate}</Text>
              </TouchableOpacity>
            ))}
            
            {/* 8th Button: See More */}
            <TouchableOpacity 
              style={[styles.gridCard, styles.seeMoreCard]}
              onPress={() => setLoansModalVisible(true)}
            >
              <Text style={[styles.gridIcon, { color: '#0d47a1' }]}>➔</Text>
              <Text style={[styles.gridLabel, { color: '#0d47a1', fontWeight: 'bold' }]}>See More</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Partner Banks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Partner Bank</Text>
          <View style={styles.bankGrid}>
            {partnerBanks.map((bank) => (
              <TouchableOpacity
                key={bank.id}
                style={styles.bankCard}
                onPress={() => navigation.navigate('CategoryProducts', { category: 'credit_cards', bankSlug: bank.code })}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.bankName}>{bank.name}</Text>
                  <View style={[styles.bankLogoBadge, { backgroundColor: bank.color }]}>
                    <Text style={{ color: '#fff', fontSize: 9, fontWeight: '900' }}>{bank.code}</Text>
                  </View>
                </View>
                <Text style={styles.bankRating}>{bank.rating}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Lifetime Free Credit Cards */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Featured Lifetime Free Credit Cards</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CategoryProducts', { category: 'ltf' })}>
              <Text style={styles.viewAllText}>View All →</Text>
            </TouchableOpacity>
          </View>
          {ltfCards.map((card) => (
            <TouchableOpacity 
              key={card.id} 
              style={styles.cardItem}
              onPress={() => openExternalLink(card.link)}
            >
              <View style={styles.cardMarker} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardItemTitle}>{card.name}</Text>
                <Text style={styles.cardItemDesc}>{card.desc}</Text>
              </View>
              <Text style={styles.applyArrow}>Apply ➔</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Comprehensive App Footer */}
        <View style={styles.footerContainer}>
          {/* Brand Header */}
          <View style={styles.footerBrandRow}>
            <Image source={require('../assets/icon.png')} style={styles.footerLogo} />
            <View style={{ flex: 1 }}>
              <Text style={styles.footerBrandTitle}>GharKaPaisa</Text>
              <Text style={styles.footerBrandTagline}>India's Premier Financial Services Platform</Text>
            </View>
          </View>
          <Text style={styles.footerDesc}>
            Empowering partners & customers with instant personal loans, lifetime free credit cards, comprehensive insurance coverage, and zero-fee payouts.
          </Text>

          {/* Directory Links */}
          <View style={styles.footerGrid}>
            <View style={styles.footerCol}>
              <Text style={styles.footerColTitle}>Financial Products</Text>
              <TouchableOpacity onPress={() => navigation.navigate('CategoryProducts', { category: 'loans' })}>
                <Text style={styles.footerLink}>🪙 Personal & Biz Loans</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('CategoryProducts', { category: 'credit_cards' })}>
                <Text style={styles.footerLink}>💳 Lifetime Free Cards</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('CategoryProducts', { category: 'insurance' })}>
                <Text style={styles.footerLink}>🩺 Health & Life Insurance</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('CategoryProducts', { category: 'services' })}>
                <Text style={styles.footerLink}>📄 Utility & GST Services</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footerCol}>
              <Text style={styles.footerColTitle}>Company & Legal</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Contact')}>
                <Text style={styles.footerLink}>📞 Contact Support</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Careers')}>
                <Text style={styles.footerLink}>💼 Careers & Hiring</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Policy', { policy: 'terms' })}>
                <Text style={styles.footerLink}>📄 Terms & Conditions</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Policy', { policy: 'privacy' })}>
                <Text style={styles.footerLink}>🔒 Privacy Policy</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Policy', { policy: 'shipping' })}>
                <Text style={styles.footerLink}>🚚 Shipping Policy</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Policy', { policy: 'refund' })}>
                <Text style={styles.footerLink}>💳 Refund Policy</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Contact Strip */}
          <View style={styles.footerContactBox}>
            <Text style={styles.footerContactText}>📞 Helpline: +91 1800 123 4567  •  ✉️ support@gharkapaisa.in</Text>
          </View>

          {/* Copyright */}
          <Text style={styles.copyrightText}>
            © 2026 GharKaPaisa. All rights reserved. | Powered by GharKaPaisa
          </Text>
        </View>

      </ScrollView>

      {/* Loans Expansion Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={loansModalVisible}
        onRequestClose={() => setLoansModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>All Loan Options</Text>
              <TouchableOpacity 
                style={styles.closeBtn} 
                onPress={() => setLoansModalVisible(false)}
              >
                <Text style={styles.closeText}>Close ✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search loan category..."
              placeholderTextColor="#94A3B8"
              value={loanSearch}
              onChangeText={setLoanSearch}
            />

            <FlatList
              data={filteredLoans}
              numColumns={3}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalGridCard}
                  onPress={() => {
                    setLoansModalVisible(false);
                    navigation.navigate('Login', { role: 'Partner' });
                  }}
                >
                  <Text style={styles.modalGridIcon}>{item.icon}</Text>
                  <Text style={styles.modalGridLabel} numberOfLines={2}>{item.label}</Text>
                  <Text style={styles.modalGridRate}>ROI {item.rate}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.modalList}
            />
          </View>
        </View>
      </Modal>

      {/* Bottom Quick Action Navigation Bar */}
      <View style={styles.bottomQuickBar}>
        <TouchableOpacity style={styles.quickBarBtn} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.quickBarIcon}>🏠</Text>
          <Text style={[styles.quickBarText, styles.quickBarTextActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickBarBtn} onPress={() => setLoansModalVisible(true)}>
          <Text style={styles.quickBarIcon}>🪙</Text>
          <Text style={styles.quickBarText}>Loans</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickBarBtn} onPress={() => navigation.navigate('CategoryProducts', { category: 'credit_cards' })}>
          <Text style={styles.quickBarIcon}>💳</Text>
          <Text style={styles.quickBarText}>Cards</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickBarBtn} onPress={() => navigation.navigate('CategoryProducts', { category: 'insurance' })}>
          <Text style={styles.quickBarIcon}>🩺</Text>
          <Text style={styles.quickBarText}>Insurance</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickBarBtn} onPress={() => navigation.navigate('Login', { role: 'Partner' })}>
          <Text style={styles.quickBarIcon}>👤</Text>
          <Text style={styles.quickBarText}>Account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 8,
    resizeMode: 'contain',
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0d47a1',
  },
  navSub: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  loginBtn: {
    backgroundColor: '#0d47a1',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  scroll: {
    paddingBottom: 40,
  },
  bannerScroll: {
    marginVertical: 14,
  },
  bannerCard: {
    width: width - 32,
    height: 125,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
    marginLeft: 16,
    marginRight: 16,
  },
  bannerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 6,
  },
  bannerBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  bannerDesc: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12.5,
  },
  section: {
    marginTop: 18,
    paddingHorizontal: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 10,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0d47a1',
  },
  horizontalScroll: {
    paddingRight: 16,
  },
  circleCard: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
    marginRight: 14,
  },
  circleIcon: {
    fontSize: 24,
    backgroundColor: '#e3f2fd',
    width: 52,
    height: 52,
    borderRadius: 26,
    textAlign: 'center',
    lineHeight: 52,
    marginBottom: 6,
  },
  circleLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCard: {
    width: (width - 48) / 4,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#eef1f6',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 1,
  },
  seeMoreCard: {
    backgroundColor: '#e3f2fd',
    borderColor: '#0d47a1',
    borderStyle: 'dashed',
  },
  gridIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  gridLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  gridRate: {
    fontSize: 8.5,
    color: '#059669',
    fontWeight: '800',
    marginTop: 2,
  },
  bankGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  bankCard: {
    width: (width - 40) / 2,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  bankName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  bankLogoBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bankRating: {
    color: '#f57c00',
    fontSize: 12,
    marginTop: 6,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardMarker: {
    width: 5,
    height: 34,
    borderRadius: 3,
    backgroundColor: '#0d47a1',
    marginRight: 12,
  },
  cardItemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardItemDesc: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  applyArrow: {
    color: '#0d47a1',
    fontWeight: '800',
    fontSize: 12,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '82%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    color: '#0d47a1',
    fontWeight: '700',
    fontSize: 14,
  },
  modalSearchInput: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  modalList: {
    padding: 12,
  },
  modalGridCard: {
    width: (width - 48) / 3,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    margin: 4,
    height: 95,
    justifyContent: 'center',
  },
  modalGridIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  modalGridLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  modalGridRate: {
    fontSize: 9,
    color: '#059669',
    fontWeight: '800',
    marginTop: 2,
  },

  // Footer Styles
  footerContainer: {
    marginTop: 28,
    backgroundColor: '#0F172A',
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
  },
  footerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  footerLogo: {
    width: 38,
    height: 38,
    borderRadius: 8,
    marginRight: 12,
  },
  footerBrandTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  footerBrandTagline: {
    fontSize: 11,
    color: '#38BDF8',
    fontWeight: '700',
  },
  footerDesc: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 20,
  },
  footerGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  footerCol: {
    flex: 1,
  },
  footerColTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  footerLink: {
    fontSize: 12,
    color: '#CBD5E1',
    fontWeight: '600',
    marginBottom: 8,
  },
  footerContactBox: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  footerContactText: {
    fontSize: 11.5,
    color: '#38BDF8',
    fontWeight: '700',
    textAlign: 'center',
  },
  copyrightText: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '600',
  },

  // Sticky Bottom Quick Navigation Bar Styles
  bottomQuickBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 4,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 10,
  },
  quickBarBtn: {
    flex: 1,
    alignItems: 'center',
    justify: 'center',
    paddingVertical: 2,
  },
  quickBarIcon: {
    fontSize: 19,
    marginBottom: 2,
  },
  quickBarText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
  },
  quickBarTextActive: {
    color: '#0d47a1',
    fontWeight: '800',
  },
});
