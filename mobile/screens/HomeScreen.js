import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Image, SafeAreaView, StatusBar, ScrollView,
  Dimensions, Modal, FlatList, Linking, Platform,
  TextInput, Alert, Animated, Easing
} from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { shadows } from '../theme/shadows';
import { Gradient } from '../components/Gradient';

const { width } = Dimensions.get('window');

// Data Lists matching Web & Mobile Platform
const banners = [
  { id: '1', title: "Lifetime Free Credit Cards", desc: "No joining fee. No annual charges.", color: colors.gradientPrimary, badge: "POPULAR", icon: "💳" },
  { id: '2', title: "Personal & Business Loans", desc: "Low interest rates starting from 10.5% p.a.", color: colors.gradientSuccess, badge: "INSTANT DISBURSAL", icon: "🪙" },
  { id: '3', title: "Comprehensive Insurance", desc: "Protect your health, life, and motor assets.", color: colors.gradientGold, badge: "TAX SAVER", icon: "🛡️" },
  { id: '4', title: "Smart EMI Offers", desc: "Convert big purchases to low-cost EMIs.", color: [colors.purple, '#6D28D9'], badge: "ZERO DOWN PAYMENT", icon: "⚡" }
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
  { id: '1', name: "HDFC Pixel Go Credit Card", desc: "Digital-first customizable credit card with instant app approval", link: "https://applyonline.hdfc.bank.in/cards/credit-cards.html?CHANNELSOURCE=ZETA&DSACode=XYOH&LGcode=&LCcode=DIGIX1&LC2=DIGIX1&SMcode=S54558#nbb" },
  { id: '2', name: "HDFC Pixel Play Credit Card", desc: "Custom rewards on shopping, dining & entertainment apps", link: "https://applyonline.hdfc.bank.in/cards/credit-cards.html?CHANNELSOURCE=ZETA&DSACode=XYOH&LGcode=&LCcode=DIGIX1&LC2=DIGIX1&SMcode=S54558#nbb" },
  { id: '3', name: "Axis Bank Neo Credit Card", desc: "Zomato 40% off, BookMyShow and utility discounts", link: "https://axisbank.com" },
  { id: '4', name: "Axis Bank MY Zone Credit Card", desc: "Buy 1 Get 1 Free on movie tickets & complimentary airport lounges", link: "https://axisbank.com" },
  { id: '5', name: "SBI Cashback Credit Card", desc: "5% cashback on online shopping without merchant restrictions", link: "https://sbicard.com" },
  { id: '6', name: "ICICI Platinum Chip Credit Card", desc: "Zero annual fee, contactless payment and dining privileges", link: "https://icicibank.com" }
];

// Premium section header with accent bar
const SectionHeader = ({ title, action, onAction }) => (
  <View style={styles.sectionHeaderRow}>
    <View style={styles.sectionTitleWrap}>
      <View style={styles.sectionAccent} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {action ? (
      <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
        <Text style={styles.viewAllText}>{action} →</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

// Animated circle service tile
const ServiceTile = ({ item, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.spring(scale, { toValue: 0.92, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity style={styles.circleCard} onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} activeOpacity={1}>
        <View style={[styles.circleIconWrap, { borderColor: item.color ? `${item.color}55` : colors.border }]}>
          <Text style={styles.circleIcon}>{item.icon}</Text>
        </View>
        <Text style={styles.circleLabel} numberOfLines={1}>{item.label}</Text>
        {item.desc ? <Text style={styles.circleDesc} numberOfLines={1}>{item.desc}</Text> : null}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function HomeScreen({ navigation }) {
  const [loansModalVisible, setLoansModalVisible] = useState(false);
  const [loanSearch, setLoanSearch] = useState('');
  const bannerIndex = useRef(0);
  const bannerScrollRef = useRef(null);

  const visibleLoans = allLoansData.slice(0, 7);
  const filteredLoans = allLoansData.filter((l) =>
    l.label.toLowerCase().includes(loanSearch.toLowerCase())
  );

  // Auto-advance banner carousel
  useEffect(() => {
    const timer = setInterval(() => {
      const next = (bannerIndex.current + 1) % banners.length;
      bannerIndex.current = next;
      bannerScrollRef.current?.scrollTo({ x: next * (width - 32), animated: true });
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const openExternalLink = (url) => {
    if (!url) return;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) Linking.openURL(url);
        else Alert.alert("Notice", "Cannot open link on this device.");
      })
      .catch((err) => console.warn("Failed to open link:", err));
  };

  const onBannerScroll = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / (width - 32));
    bannerIndex.current = idx;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor={colors.bg} barStyle="light-content" />

      {/* Premium Header */}
      <Gradient colors={colors.gradientHero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.6 }} style={styles.headerGrad}>
        <View style={styles.navbar}>
          <View style={styles.navLeft}>
            <Image source={require('../assets/icon.png')} style={styles.logo} />
            <View>
              <Text style={styles.navTitle}>GharKaPaisa</Text>
              <Text style={styles.navSub}>Financial Services Platform</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={styles.registerBtn} onPress={() => navigation.navigate('Register')} activeOpacity={0.8}>
              <Text style={styles.registerBtnText}>Register</Text>
            </TouchableOpacity>
            <Gradient colors={colors.gradientPrimary} borderRadius={spacing.radius.full} style={styles.loginBtnGrad}>
              <TouchableOpacity style={styles.loginBtnInner} onPress={() => navigation.navigate('Login', { role: 'Partner' })} activeOpacity={0.85}>
                <Text style={styles.loginBtnText}>Log In</Text>
              </TouchableOpacity>
            </Gradient>
          </View>
        </View>

        {/* Hero strip */}
        <View style={styles.heroRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Your Financial{`\n`}Super App</Text>
            <Text style={styles.heroSub}>Cards • Loans • Insurance • Payments</Text>
          </View>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>₹0{`\n`}Joining</Text>
          </View>
        </View>
      </Gradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Banner Carousel */}
        <ScrollView
          ref={bannerScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onBannerScroll}
          decelerationRate="fast"
          snapToInterval={width - 32}
          snapToAlignment="start"
          style={styles.bannerScroll}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {banners.map((b) => (
            <Gradient
              key={b.id}
              colors={b.color}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              borderRadius={spacing.radius.xl}
              style={styles.bannerCard}
            >
              <View style={styles.bannerBadge}><Text style={styles.bannerBadgeText}>{b.badge}</Text></View>
              <Text style={styles.bannerIcon}>{b.icon}</Text>
              <Text style={styles.bannerTitle}>{b.title}</Text>
              <Text style={styles.bannerDesc}>{b.desc}</Text>
            </Gradient>
          ))}
        </ScrollView>

        {/* Money Transfer & Payments */}
        <View style={styles.section}>
          <SectionHeader title="Money Transfer & Payments" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {moneyTransferData.map((item) => (
              <ServiceTile key={item.id} item={item} onPress={() => Alert.alert(item.label, `${item.desc} - Feature active in production portal.`)} />
            ))}
          </ScrollView>
        </View>

        {/* Travel & Transit */}
        <View style={styles.section}>
          <SectionHeader title="Travel & Transit" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {travelTransitData.map((item) => (
              <ServiceTile key={item.id} item={item} onPress={() => Alert.alert(item.label, `Book ${item.label} tickets with extra partner cashbacks.`)} />
            ))}
          </ScrollView>
        </View>

        {/* Insurance & Protection */}
        <View style={styles.section}>
          <SectionHeader title="Insurance & Protection" onAction="View All" onActionPress={() => navigation.navigate('CategoryProducts', { category: 'insurance' })} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {insuranceData.map((item) => (
              <ServiceTile key={item.id} item={item} onPress={() => navigation.navigate('CategoryProducts', { category: 'insurance' })} />
            ))}
          </ScrollView>
        </View>

        {/* Business & Financial Services */}
        <View style={styles.section}>
          <SectionHeader title="Business & Financial Services" onAction="View All" onActionPress={() => navigation.navigate('CategoryProducts', { category: 'services' })} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {servicesData.map((item) => (
              <ServiceTile key={item.id} item={item} onPress={() => navigation.navigate('CategoryProducts', { category: 'services' })} />
            ))}
          </ScrollView>
        </View>

        {/* Loans - Grid Layout */}
        <View style={styles.section}>
          <SectionHeader title="Loans & Credit" action={`View All (${allLoansData.length})`} onAction={() => navigation.navigate('CategoryProducts', { category: 'loans' })} />
          <View style={styles.grid}>
            {visibleLoans.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.gridCard}
                onPress={() => navigation.navigate('CategoryProducts', { category: 'loans' })}
                activeOpacity={0.8}
              >
                <View style={styles.gridIconWrap}>
                  <Text style={styles.gridIcon}>{item.icon}</Text>
                </View>
                <Text style={styles.gridLabel} numberOfLines={1}>{item.label}</Text>
                <View style={styles.gridRateBadge}>
                  <Text style={styles.gridRate}>from {item.rate}</Text>
                </View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={[styles.gridCard, styles.seeMoreCard]} onPress={() => setLoansModalVisible(true)} activeOpacity={0.8}>
              <View style={[styles.gridIconWrap, styles.seeMoreIconWrap]}>
                <Text style={[styles.gridIcon, { color: colors.primaryLight }]}>➔</Text>
              </View>
              <Text style={[styles.gridLabel, { color: colors.primaryLight }]}>See More</Text>
              <View style={styles.gridRateBadge}>
                <Text style={[styles.gridRate, { color: colors.primaryLight }]}>+5 more</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Partner Banks */}
        <View style={styles.section}>
          <SectionHeader title="Select Partner Bank" action="All Banks" onAction={() => navigation.navigate('CategoryProducts', { category: 'credit_cards' })} />
          <View style={styles.bankGrid}>
            {partnerBanks.map((bank) => (
              <TouchableOpacity
                key={bank.id}
                style={styles.bankCard}
                onPress={() => navigation.navigate('CategoryProducts', { category: 'credit_cards', bankSlug: bank.code })}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.bankName} numberOfLines={1}>{bank.name}</Text>
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
          <SectionHeader title="Featured Lifetime Free Cards" action="View All" onAction={() => navigation.navigate('CategoryProducts', { category: 'ltf' })} />
          {ltfCards.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={styles.cardItem}
              onPress={() => openExternalLink(card.link)}
              activeOpacity={0.85}
            >
              <View style={styles.cardMarker} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardItemTitle}>{card.name}</Text>
                <Text style={styles.cardItemDesc}>{card.desc}</Text>
              </View>
              <View style={styles.applyBtn}>
                <Text style={styles.applyBtnText}>Apply</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* CTA Banner */}
        <Gradient colors={colors.gradientPrimary} borderRadius={spacing.radius.xl} style={styles.ctaBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.ctaTitle}>Become a Partner</Text>
            <Text style={styles.ctaSub}>Earn up to ₹25,000 per approved application</Text>
          </View>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaBtnText}>Join Now</Text>
          </TouchableOpacity>
        </Gradient>

        {/* Comprehensive App Footer */}
        <View style={styles.footerContainer}>
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

          <View style={styles.footerContactBox}>
            <Text style={styles.footerContactText}>📞 Helpline: +91 1800 123 4567  •  ✉️ support@gharkapaisa.in</Text>
          </View>

          <Text style={styles.copyrightText}>© 2026 GharKaPaisa. All rights reserved.</Text>
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
              <TouchableOpacity style={styles.closeBtn} onPress={() => setLoansModalVisible(false)}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchWrap}>
              <Text style={styles.modalSearchIcon}>🔍</Text>
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search loan category..."
                placeholderTextColor={colors.textLight}
                value={loanSearch}
                onChangeText={setLoanSearch}
              />
            </View>

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
                  activeOpacity={0.8}
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
        <TouchableOpacity style={styles.quickBarBtn} onPress={() => navigation.navigate('Home')} activeOpacity={0.7}>
          <Text style={styles.quickBarIcon}>🏠</Text>
          <Text style={[styles.quickBarText, styles.quickBarTextActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickBarBtn} onPress={() => setLoansModalVisible(true)} activeOpacity={0.7}>
          <Text style={styles.quickBarIcon}>🪙</Text>
          <Text style={styles.quickBarText}>Loans</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickBarBtn} onPress={() => navigation.navigate('CategoryProducts', { category: 'credit_cards' })} activeOpacity={0.7}>
          <Text style={styles.quickBarIcon}>💳</Text>
          <Text style={styles.quickBarText}>Cards</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickBarBtn} onPress={() => navigation.navigate('CategoryProducts', { category: 'insurance' })} activeOpacity={0.7}>
          <Text style={styles.quickBarIcon}>🩺</Text>
          <Text style={styles.quickBarText}>Insurance</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickBarBtn} onPress={() => navigation.navigate('Login', { role: 'Partner' })} activeOpacity={0.7}>
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
    backgroundColor: colors.bg,
  },
  headerGrad: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 10,
    paddingBottom: spacing.lg,
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 12,
    ...shadows.sm,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  navSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '600',
  },
  registerBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: spacing.radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  registerBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  loginBtnGrad: {
    borderRadius: spacing.radius.full,
    ...shadows.glow,
  },
  loginBtnInner: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.8,
    lineHeight: 30,
  },
  heroSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.3,
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: spacing.radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  heroBadgeText: {
    color: '#FDE68A',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  scroll: {
    paddingTop: spacing.md,
    paddingBottom: 90,
  },
  bannerScroll: {
    marginBottom: spacing.lg,
  },
  bannerCard: {
    width: width - 32,
    height: 150,
    marginRight: 16,
    borderRadius: spacing.radius.xl,
    padding: spacing.lg,
    justifyContent: 'flex-end',
    ...shadows.md,
  },
  bannerBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 3,
    borderRadius: spacing.radius.full,
  },
  bannerBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  bannerIcon: {
    fontSize: 30,
    marginBottom: spacing.xs,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  bannerDesc: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 3,
    fontWeight: '500',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionAccent: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryLight,
  },
  horizontalScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  circleCard: {
    alignItems: 'center',
    width: 76,
  },
  circleIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  circleIcon: {
    fontSize: 26,
  },
  circleLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  circleDesc: {
    fontSize: 9,
    color: colors.textLight,
    marginTop: 2,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  gridCard: {
    width: '31.5%',
    backgroundColor: colors.card,
    borderRadius: spacing.radius.lg,
    padding: spacing.sm + 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  gridIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  gridIcon: {
    fontSize: 20,
  },
  gridLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  gridRateBadge: {
    marginTop: spacing.xs,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: spacing.radius.full,
  },
  gridRate: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
  },
  seeMoreCard: {
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: 'rgba(37, 99, 235, 0.06)',
  },
  seeMoreIconWrap: {
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
  },
  bankGrid: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  bankCard: {
    backgroundColor: colors.card,
    borderRadius: spacing.radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  bankName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  bankLogoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: spacing.radius.sm,
  },
  bankRating: {
    fontSize: 11,
    color: colors.gold,
    marginTop: spacing.xs,
    letterSpacing: 1,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: spacing.radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  cardMarker: {
    width: 4,
    height: 40,
    borderRadius: 2,
    backgroundColor: colors.gold,
    marginRight: spacing.md,
  },
  cardItemTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  cardItemDesc: {
    fontSize: 11,
    color: colors.textMid,
    marginTop: 2,
  },
  applyBtn: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: spacing.radius.full,
  },
  applyBtnText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  ctaBanner: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.glow,
  },
  ctaTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  ctaSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
  ctaBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: spacing.radius.full,
  },
  ctaBtnText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '900',
  },
  footerContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  footerLogo: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  footerBrandTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  footerBrandTagline: {
    fontSize: 10,
    color: colors.textLight,
    fontWeight: '600',
  },
  footerDesc: {
    fontSize: 11,
    color: colors.textMid,
    lineHeight: 17,
    marginBottom: spacing.md,
  },
  footerGrid: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  footerCol: {
    flex: 1,
  },
  footerColTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  footerLink: {
    fontSize: 11,
    color: colors.textMid,
    paddingVertical: 3,
  },
  footerContactBox: {
    backgroundColor: colors.card,
    borderRadius: spacing.radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  footerContactText: {
    fontSize: 11,
    color: colors.textMid,
    textAlign: 'center',
  },
  copyrightText: {
    fontSize: 10,
    color: colors.textLight,
    textAlign: 'center',
    paddingBottom: spacing.lg,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.cardElevated,
    borderTopLeftRadius: spacing.radius.xl,
    borderTopRightRadius: spacing.radius.xl,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: colors.textMid, fontWeight: '800', fontSize: 14 },
  modalSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: spacing.radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  modalSearchIcon: { fontSize: 14, marginRight: spacing.sm },
  modalSearchInput: {
    flex: 1,
    color: colors.text,
    paddingVertical: 12,
    fontSize: 14,
  },
  modalList: {
    padding: spacing.lg,
  },
  modalGridCard: {
    width: '31.5%',
    backgroundColor: colors.card,
    borderRadius: spacing.radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalGridIcon: { fontSize: 26, marginBottom: spacing.xs },
  modalGridLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  modalGridRate: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    marginTop: spacing.xs,
  },
  bottomQuickBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: colors.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 24 : spacing.sm,
    paddingHorizontal: spacing.sm,
    ...shadows.lg,
  },
  quickBarBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  quickBarIcon: { fontSize: 20, marginBottom: 2 },
  quickBarText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textLight,
  },
  quickBarTextActive: {
    color: colors.primaryLight,
  },
});
