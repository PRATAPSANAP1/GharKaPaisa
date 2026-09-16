import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Platform
} from 'react-native';

export default function PolicyScreen({ route, navigation }) {
  const initialPolicy = route?.params?.policy || 'terms';
  const [activePolicy, setActivePolicy] = useState(initialPolicy); // 'terms' | 'privacy' | 'shipping' | 'refund'

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#0d47a1" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Legal & Compliance</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
          <TouchableOpacity
            style={[styles.tabBtn, activePolicy === 'terms' && styles.tabBtnActive]}
            onPress={() => setActivePolicy('terms')}
          >
            <Text style={[styles.tabBtnText, activePolicy === 'terms' && styles.tabBtnTextActive]}>Terms & Conditions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activePolicy === 'privacy' && styles.tabBtnActive]}
            onPress={() => setActivePolicy('privacy')}
          >
            <Text style={[styles.tabBtnText, activePolicy === 'privacy' && styles.tabBtnTextActive]}>Privacy Policy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activePolicy === 'shipping' && styles.tabBtnActive]}
            onPress={() => setActivePolicy('shipping')}
          >
            <Text style={[styles.tabBtnText, activePolicy === 'shipping' && styles.tabBtnTextActive]}>Shipping Policy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activePolicy === 'refund' && styles.tabBtnActive]}
            onPress={() => setActivePolicy('refund')}
          >
            <Text style={[styles.tabBtnText, activePolicy === 'refund' && styles.tabBtnTextActive]}>Refund & Cancellation</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Terms and Conditions */}
        {activePolicy === 'terms' && (
          <View style={styles.card}>
            <Text style={styles.title}>Terms & Conditions</Text>
            <Text style={styles.lastUpdated}>Last Updated: September 2026</Text>

            <Text style={styles.h2}>1. Acceptance of Terms</Text>
            <Text style={styles.p}>By downloading, accessing, or using the GharKaPaisa mobile application or website, you agree to be bound by these Terms and Conditions and our Privacy Policy.</Text>

            <Text style={styles.h2}>2. Platform & Financial Intermediary Role</Text>
            <Text style={styles.p}>GharKaPaisa acts as a digital aggregator and technology facilitator connecting users with RBI-regulated Banks, Non-Banking Financial Companies (NBFCs), and Insurance Providers. We do not directly issue credit cards or disburse loans.</Text>

            <Text style={styles.h2}>3. Partner Payouts & Commission Rules</Text>
            <Text style={styles.p}>Commission payouts for registered Partners and Employees are processed strictly based on verified card approvals or loan disbursals confirmed by partner financial institutions. Fraudulent or self-referral abuse will lead to immediate account termination.</Text>

            <Text style={styles.h2}>4. User Responsibilities</Text>
            <Text style={styles.p}>Users must provide accurate, verified personal and financial details during registration and application submission. Supplying fake KYC documents is punishable under Indian law.</Text>
          </View>
        )}

        {/* Privacy Policy */}
        {activePolicy === 'privacy' && (
          <View style={styles.card}>
            <Text style={styles.title}>Privacy Policy</Text>
            <Text style={styles.lastUpdated}>Last Updated: September 2026</Text>

            <Text style={styles.h2}>1. Information We Collect</Text>
            <Text style={styles.p}>We collect personal information including full name, mobile number, email address, PAN number, Aadhaar number, bank account details, and device identifiers required to facilitate application processing and partner payouts.</Text>

            <Text style={styles.h2}>2. Data Security & Encryption</Text>
            <Text style={styles.p}>All sensitive data transmitted between your device and GharKaPaisa servers is protected using 256-bit SSL encryption and stored securely in accordance with Indian IT Laws and RBI data privacy guidelines.</Text>

            <Text style={styles.h2}>3. Third-Party Sharing</Text>
            <Text style={styles.p}>Your application data is shared exclusively with your selected banking and financial institution partners (e.g. HDFC, SBI, Axis, ICICI) solely for processing your credit card or loan application.</Text>
          </View>
        )}

        {/* Shipping & Delivery Policy */}
        {activePolicy === 'shipping' && (
          <View style={styles.card}>
            <Text style={styles.title}>Shipping & Delivery Policy</Text>
            <Text style={styles.lastUpdated}>Last Updated: September 2026</Text>

            <Text style={styles.h2}>1. Digital Fulfillment</Text>
            <Text style={styles.p}>GharKaPaisa operates primarily as a digital financial portal. All application tracking, referral links, and partner marketing kits are delivered digitally and instantly via the mobile app and email.</Text>

            <Text style={styles.h2}>2. Physical Credit Card / Document Delivery</Text>
            <Text style={styles.p}>Approved physical credit cards, loan welcome letters, or bank cheque books are dispatched directly by the issuing bank/NBFC via insured courier services (Speed Post, BlueDart, DTDC) within 7-10 working days of final bank approval.</Text>
          </View>
        )}

        {/* Refund & Cancellation Policy */}
        {activePolicy === 'refund' && (
          <View style={styles.card}>
            <Text style={styles.title}>Cancellation & Refund Policy</Text>
            <Text style={styles.lastUpdated}>Last Updated: September 2026</Text>

            <Text style={styles.h2}>1. Zero Application Fees</Text>
            <Text style={styles.p}>GharKaPaisa does NOT charge any upfront processing fees for applying for credit cards or personal loans. Applying through our platform is 100% free.</Text>

            <Text style={styles.h2}>2. Application Cancellation</Text>
            <Text style={styles.p}>Applicants can cancel an submitted application before document verification by contacting customer support at support@gharkapaisa.in.</Text>

            <Text style={styles.h2}>3. Wallet Withdrawal Adjustments</Text>
            <Text style={styles.p}>In cases where a bank revokes or flags a card disbursal due to fraud or customer cancellation within 30 days, the corresponding partner commission credit may be reversed from the partner wallet.</Text>
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
  headerTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  tabsRow: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingVertical: 4 },
  tabBtn: { paddingVertical: 10, paddingHorizontal: 14, marginRight: 6 },
  tabBtnActive: { borderBottomWidth: 3, borderBottomColor: '#0d47a1' },
  tabBtnText: { fontSize: 12.5, fontWeight: '700', color: '#64748B' },
  tabBtnTextActive: { color: '#0d47a1', fontWeight: '800' },
  scroll: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', elevation: 1 },
  title: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  lastUpdated: { fontSize: 11, color: '#64748B', fontWeight: '600', marginBottom: 16 },
  h2: { fontSize: 14, fontWeight: '800', color: '#0d47a1', marginTop: 14, marginBottom: 4 },
  p: { fontSize: 12.5, color: '#334155', lineHeight: 20, marginBottom: 8 },
});
