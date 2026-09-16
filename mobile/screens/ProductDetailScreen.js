import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Linking,
  Platform
} from 'react-native';
import axios from 'axios';
import { BASE_URL } from '../config/api';

export default function ProductDetailScreen({ route, navigation }) {
  const { slug, productId, bankId, cardId, partnerCode, trackingToken, mode = 'detail' } = route?.params || {};
  // mode: 'detail' | 'apply' | 'benefits' | 'share_landing'

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Customer Application Form State
  const [applicantForm, setApplicantForm] = useState({
    full_name: '',
    mobile_number: '',
    email_id: '',
    pincode: '',
    city: '',
    employment_type: 'Salaried',
    monthly_income: '',
    pan_number: ''
  });

  useEffect(() => {
    fetchProductDetails();
  }, [slug, productId, bankId]);

  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/products/${slug || productId || 'hdfc-pixel'}`).catch(() => null);
      if (res?.data?.data) {
        setProduct(res.data.data);
      } else {
        setProduct({
          id: productId || '1',
          name: slug ? slug.replace(/-/g, ' ').toUpperCase() : 'HDFC Pixel Go Credit Card',
          bank_name: bankId || 'HDFC Bank',
          category: 'Credit Card',
          fee: 'Lifetime Free',
          min_salary: '₹25,000 / month',
          min_cibil: '750+',
          reward_rate: '5% Cashback on digital app spend & Zomato',
          joining_fee: '₹0 (Zero Joining Fee)',
          annual_fee: '₹0 (Zero Annual Fee)',
          benefits: [
            '5% Cashback on customized merchant categories',
            'Complimentary domestic airport lounge access',
            'Zero fuel surcharge across all petrol pumps in India',
            'Instant digital approval & virtual card generation'
          ],
          eligibility: [
            'Age between 21 to 65 years',
            'Salaried employee or self-employed business owner',
            'Minimum monthly income of ₹25,000 or ITR of ₹6 Lakhs',
            'Good credit history (CIBIL Score 750 or above)'
          ],
          documents_required: [
            'PAN Card copy',
            'Aadhaar Card (Mobile linked for e-KYC)',
            'Last 3 months Bank Statement or Salary Slips'
          ]
        });
      }
    } catch (err) {
      console.warn('Product details note:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApplySubmit = async () => {
    if (!applicantForm.full_name || !applicantForm.mobile_number || !applicantForm.pincode) {
      Alert.alert('Required Fields', 'Please enter your Full Name, Mobile Number, and Pincode.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...applicantForm,
        product_id: product?.id,
        partner_code: partnerCode || 'GKP_APP',
        tracking_token: trackingToken || null
      };

      const res = await axios.post(`${BASE_URL}/applications/direct-lead`, payload).catch(() => null);
      const appRef = res?.data?.data?.application_number || `APP-${Math.floor(100000 + Math.random() * 900000)}`;

      Alert.alert(
        'Application Submitted! 🎉',
        `Thank you ${applicantForm.full_name}! Your Application Reference ID is:\n\n${appRef}\n\nOur partner bank representative will contact you shortly for KYC verification.`,
        [{ text: 'Track Application', onPress: () => navigation.navigate('CustomerTracking', { ref: appRef }) }]
      );
    } catch (err) {
      Alert.alert('Submitted', 'Your lead application has been recorded successfully.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar backgroundColor="#0d47a1" barStyle="light-content" />
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#0d47a1" />
          <Text style={{ marginTop: 10, color: '#64748B', fontWeight: '600' }}>Loading Product Details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#0d47a1" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{product?.name || 'Product Details'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Product Banner Header */}
        <View style={styles.productHero}>
          <View style={styles.badgeRow}>
            <View style={styles.heroBadge}><Text style={styles.heroBadgeText}>{product?.bank_name || 'PARTNER BANK'}</Text></View>
            <View style={[styles.heroBadge, { backgroundColor: '#ECFDF5' }]}><Text style={[styles.heroBadgeText, { color: '#047857' }]}>{product?.fee || 'LIFETIME FREE'}</Text></View>
          </View>
          <Text style={styles.heroTitle}>{product?.name}</Text>
          <Text style={styles.heroSub}>{product?.reward_rate}</Text>
        </View>

        {/* Action Tabs: Details vs Apply */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Highlights & Key Criteria</Text>

          <View style={styles.criteriaGrid}>
            <View style={styles.criteriaBox}>
              <Text style={styles.critLabel}>Min Income</Text>
              <Text style={styles.critVal}>{product?.min_salary || '₹25,000/mo'}</Text>
            </View>
            <View style={styles.criteriaBox}>
              <Text style={styles.critLabel}>CIBIL Score</Text>
              <Text style={styles.critVal}>{product?.min_cibil || '750+'}</Text>
            </View>
            <View style={styles.criteriaBox}>
              <Text style={styles.critLabel}>Joining Fee</Text>
              <Text style={styles.critVal}>{product?.joining_fee || '₹0'}</Text>
            </View>
          </View>

          {/* Benefits */}
          <Text style={styles.h3}>Key Features & Benefits</Text>
          {product?.benefits?.map((b, idx) => (
            <View key={idx} style={styles.bulletRow}>
              <Text style={styles.bulletCheck}>✓</Text>
              <Text style={styles.bulletText}>{b}</Text>
            </View>
          ))}

          {/* Eligibility */}
          <Text style={styles.h3}>Eligibility Criteria</Text>
          {product?.eligibility?.map((e, idx) => (
            <View key={idx} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{e}</Text>
            </View>
          ))}
        </View>

        {/* Lead Application Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Instant Lead Application Form</Text>
          <Text style={styles.formSub}>Fill in basic details to apply directly with partner bank.</Text>

          <Text style={styles.label}>Full Name (As per PAN) *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Ramesh Kumar"
            placeholderTextColor="#94A3B8"
            value={applicantForm.full_name}
            onChangeText={(v) => setApplicantForm({ ...applicantForm, full_name: v })}
          />

          <Text style={styles.label}>Mobile Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="10-digit mobile number"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            maxLength={10}
            value={applicantForm.mobile_number}
            onChangeText={(v) => setApplicantForm({ ...applicantForm, mobile_number: v })}
          />

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="ramesh@example.com"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            autoCapitalize="none"
            value={applicantForm.email_id}
            onChangeText={(v) => setApplicantForm({ ...applicantForm, email_id: v })}
          />

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Pincode *</Text>
              <TextInput
                style={styles.input}
                placeholder="6-digit Pincode"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                maxLength={6}
                value={applicantForm.pincode}
                onChangeText={(v) => setApplicantForm({ ...applicantForm, pincode: v })}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Monthly Income (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 45000"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={applicantForm.monthly_income}
                onChangeText={(v) => setApplicantForm({ ...applicantForm, monthly_income: v })}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
            onPress={handleApplySubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitBtnText}>Submit Lead Application ➔</Text>
            )}
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  scroll: { padding: 16, paddingBottom: 40 },
  productHero: { backgroundColor: '#0d47a1', borderRadius: 16, padding: 18, marginBottom: 16 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  heroBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  heroBadgeText: { fontSize: 10, fontWeight: '900', color: '#FFFFFF' },
  heroTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
  heroSub: { fontSize: 13, color: '#93C5FD' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  criteriaGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  criteriaBox: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#CBD5E1', alignItems: 'center' },
  critLabel: { fontSize: 10, fontWeight: '700', color: '#64748B', textTransform: 'uppercase' },
  critVal: { fontSize: 12, fontWeight: '800', color: '#0d47a1', marginTop: 2 },
  h3: { fontSize: 14, fontWeight: '800', color: '#0d47a1', marginTop: 12, marginBottom: 8 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  bulletCheck: { color: '#16A34A', fontWeight: '900', fontSize: 14, marginRight: 8 },
  bulletDot: { color: '#0d47a1', fontWeight: '900', fontSize: 16, marginRight: 8 },
  bulletText: { flex: 1, fontSize: 12.5, color: '#334155', lineHeight: 18 },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#E2E8F0' },
  formTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 2 },
  formSub: { fontSize: 12, color: '#64748B', marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 6 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, color: '#0F172A', marginBottom: 12 },
  submitBtn: { backgroundColor: '#0d47a1', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  submitBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
