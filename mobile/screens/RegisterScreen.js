import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  StatusBar
} from 'react-native';
import axios from 'axios';
import { BASE_URL } from '../config/api';

const COMPANY_TYPES = [
  { label: 'Individual', value: 'individual' },
  { label: 'Proprietorship', value: 'proprietorship' },
  { label: 'Partnership', value: 'partnership' },
  { label: 'Private Limited Company', value: 'pvt_ltd' }
];

const STEPS = ['Personal', 'Business', 'Bank', 'KYC'];

export default function RegisterScreen({ navigation }) {
  const [activeStep, setActiveStep] = useState(0);

  const [form, setForm] = useState({
    // Step 0: Personal
    first_name: '',
    last_name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    // Step 1: Business
    company_name: '',
    company_type: 'individual',
    current_address: '',
    business_location: '',
    pincode: '',
    gst_number: '',
    // Step 2: Bank
    bank_name: '',
    account_holder_name: '',
    account_number: '',
    ifsc_code: '',
    // Step 3: KYC
    pan: '',
    aadhaar: '',
    referral_code: '',
    termsAgreed: false
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const validateStep = (stepIdx) => {
    if (stepIdx === 0) {
      if (!form.first_name.trim()) {
        Alert.alert('Required Field', 'Please enter your First Name.');
        return false;
      }
      if (!form.mobile.trim() || !/^[6-9]\d{9}$/.test(form.mobile.trim())) {
        Alert.alert('Invalid Mobile', 'Please enter a valid 10-digit Indian mobile number.');
        return false;
      }
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        Alert.alert('Invalid Email', 'Please enter a valid email address.');
        return false;
      }
      if (!form.password || form.password.length < 6) {
        Alert.alert('Password Length', 'Password must be at least 6 characters long.');
        return false;
      }
      if (form.password !== form.confirmPassword) {
        Alert.alert('Password Mismatch', 'Passwords do not match.');
        return false;
      }
    }

    if (stepIdx === 1) {
      if (!form.company_name.trim()) {
        Alert.alert('Required Field', 'Please enter your Business / Company Name.');
        return false;
      }
      if (!form.current_address.trim()) {
        Alert.alert('Required Field', 'Please enter your Address.');
        return false;
      }
      if (!form.pincode.trim() || !/^\d{6}$/.test(form.pincode.trim())) {
        Alert.alert('Invalid Pincode', 'Please enter a valid 6-digit Pincode.');
        return false;
      }
      if (!form.business_location.trim()) {
        Alert.alert('Required Field', 'Please enter your Business Location / City.');
        return false;
      }
      if (form.gst_number.trim() && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(form.gst_number.trim())) {
        Alert.alert('Invalid GSTIN', 'Please enter a valid 15-character GSTIN number (e.g. 27AAPFU0939F1ZV).');
        return false;
      }
    }

    if (stepIdx === 2) {
      if (!form.bank_name.trim()) {
        Alert.alert('Required Field', 'Please enter your Bank Name.');
        return false;
      }
      if (!form.account_number.trim() || !/^\d{9,18}$/.test(form.account_number.trim())) {
        Alert.alert('Invalid Account Number', 'Please enter a valid 9 to 18-digit bank account number.');
        return false;
      }
      if (!form.ifsc_code.trim() || !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(form.ifsc_code.trim())) {
        Alert.alert('Invalid IFSC Code', 'Please enter a valid 11-digit IFSC code (e.g. HDFC0001234).');
        return false;
      }
      if (!form.account_holder_name.trim()) {
        Alert.alert('Required Field', 'Please enter Account Holder Name.');
        return false;
      }
    }

    if (stepIdx === 3) {
      if (!form.pan.trim() || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(form.pan.trim())) {
        Alert.alert('Invalid PAN', 'Please enter a valid 10-character PAN number (e.g. ABCDE1234F).');
        return false;
      }
      if (form.aadhaar.trim() && !/^\d{12}$/.test(form.aadhaar.trim())) {
        Alert.alert('Invalid Aadhaar', 'Please enter a valid 12-digit Aadhaar number.');
        return false;
      }
      if (!form.termsAgreed) {
        Alert.alert('Terms & Conditions', 'Please accept the Terms & Conditions and Privacy Policy to proceed.');
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      if (activeStep < STEPS.length - 1) {
        setActiveStep(activeStep + 1);
      } else {
        handleFinalSubmit();
      }
    }
  };

  const handlePrev = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim().toLowerCase(),
        mobile: form.mobile.trim(),
        password: form.password,
        company_name: form.company_name.trim(),
        company_type: form.company_type,
        current_address: form.current_address.trim(),
        business_location: form.business_location.trim(),
        pincode: form.pincode.trim(),
        gst_number: form.gst_number ? form.gst_number.trim().toUpperCase() : undefined,
        bank_name: form.bank_name.trim(),
        account_number: form.account_number.trim(),
        ifsc_code: form.ifsc_code.trim().toUpperCase(),
        account_holder_name: form.account_holder_name.trim(),
        pan: form.pan.trim().toUpperCase(),
        aadhaar: form.aadhaar ? form.aadhaar.trim() : undefined,
        referral_code: form.referral_code ? form.referral_code.trim().toUpperCase() : undefined,
        role: 'PARTNER'
      };

      const res = await axios.post(`${BASE_URL}/auth/register`, payload);

      if (res.data?.success || res.data?.status === 'success') {
        Alert.alert(
          'Registration Successful! 🎉',
          'Your partner account has been created. Log in to start earning commissions.',
          [
            {
              text: 'Proceed to Log In',
              onPress: () => navigation.navigate('Login', { role: 'Partner' })
            }
          ]
        );
      } else {
        Alert.alert('Registration Failed', res.data?.message || 'Failed to complete registration.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      Alert.alert(
        'Registration Error',
        err.response?.data?.message || 'Failed to register. Mobile or Email may already exist.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back to Home</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Join as Partner</Text>
          <Text style={styles.subtitle}>Complete registration to receive official partner code & payouts</Text>

          {/* Stepper Header */}
          <View style={styles.stepperContainer}>
            {STEPS.map((label, idx) => (
              <TouchableOpacity
                key={label}
                style={[styles.stepTab, activeStep === idx && styles.stepTabActive]}
                onPress={() => {
                  if (idx < activeStep || validateStep(activeStep)) {
                    setActiveStep(idx);
                  }
                }}
              >
                <View style={[styles.stepBadge, activeStep === idx && styles.stepBadgeActive]}>
                  <Text style={[styles.stepBadgeText, activeStep === idx && styles.stepBadgeTextActive]}>{idx + 1}</Text>
                </View>
                <Text style={[styles.stepLabel, activeStep === idx && styles.stepLabelActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* STEP 0: PERSONAL DETAILS */}
          {activeStep === 0 && (
            <View>
              <Text style={styles.sectionHeader}>Step 1: Personal Information</Text>

              <View style={styles.row}>
                <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>First Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="First name"
                    placeholderTextColor="#94A3B8"
                    value={form.first_name}
                    onChangeText={(v) => handleChange('first_name', v)}
                  />
                </View>
                <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Last Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Last name"
                    placeholderTextColor="#94A3B8"
                    value={form.last_name}
                    onChangeText={(v) => handleChange('last_name', v)}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Mobile Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10-digit mobile number"
                  placeholderTextColor="#94A3B8"
                  keyboardType="number-pad"
                  maxLength={10}
                  value={form.mobile}
                  onChangeText={(v) => handleChange('mobile', v.replace(/\D/g, ''))}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email Address *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="you@domain.com"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={form.email}
                  onChangeText={(v) => handleChange('email', v)}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password *</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Min 6 chars (Letters, numbers)"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPassword}
                    value={form.password}
                    onChangeText={(v) => handleChange('password', v)}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text style={styles.eyeText}>{showPassword ? '👁️' : '🙈'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password *</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Re-enter password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showConfirmPassword}
                    value={form.confirmPassword}
                    onChangeText={(v) => handleChange('confirmPassword', v)}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Text style={styles.eyeText}>{showConfirmPassword ? '👁️' : '🙈'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* STEP 1: BUSINESS DETAILS */}
          {activeStep === 1 && (
            <View>
              <Text style={styles.sectionHeader}>Step 2: Business & Firm Details</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Business / Firm Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Agency or company name"
                  placeholderTextColor="#94A3B8"
                  value={form.company_name}
                  onChangeText={(v) => handleChange('company_name', v)}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Company Constitution / Type *</Text>
                <View style={styles.pickerRow}>
                  {COMPANY_TYPES.map((ct) => (
                    <TouchableOpacity
                      key={ct.value}
                      style={[styles.pickerPill, form.company_type === ct.value && styles.pickerPillActive]}
                      onPress={() => handleChange('company_type', ct.value)}
                    >
                      <Text style={[styles.pickerPillText, form.company_type === ct.value && styles.pickerPillTextActive]}>
                        {ct.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Office / Current Address *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Street address, building, shop no."
                  placeholderTextColor="#94A3B8"
                  value={form.current_address}
                  onChangeText={(v) => handleChange('current_address', v)}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>City / Region *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Mumbai"
                    placeholderTextColor="#94A3B8"
                    value={form.business_location}
                    onChangeText={(v) => handleChange('business_location', v)}
                  />
                </View>

                <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Pincode *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="6 digits"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={form.pincode}
                    onChangeText={(v) => handleChange('pincode', v.replace(/\D/g, ''))}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>GST Number (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="15-character GSTIN (e.g. 27AAPFU0939F1ZV)"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="characters"
                  maxLength={15}
                  value={form.gst_number}
                  onChangeText={(v) => handleChange('gst_number', v.toUpperCase())}
                />
              </View>
            </View>
          )}

          {/* STEP 2: BANK DETAILS */}
          {activeStep === 2 && (
            <View>
              <Text style={styles.sectionHeader}>Step 3: Bank Account for Payouts</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Bank Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. HDFC Bank / SBI"
                  placeholderTextColor="#94A3B8"
                  value={form.bank_name}
                  onChangeText={(v) => handleChange('bank_name', v)}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Account Holder Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Name as per bank passbook"
                  placeholderTextColor="#94A3B8"
                  value={form.account_holder_name}
                  onChangeText={(v) => handleChange('account_holder_name', v)}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Account Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="9 to 18 digits"
                  placeholderTextColor="#94A3B8"
                  keyboardType="number-pad"
                  maxLength={18}
                  value={form.account_number}
                  onChangeText={(v) => handleChange('account_number', v.replace(/\D/g, ''))}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>IFSC Code *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="11-character IFSC (e.g. HDFC0001234)"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="characters"
                  maxLength={11}
                  value={form.ifsc_code}
                  onChangeText={(v) => handleChange('ifsc_code', v.toUpperCase())}
                />
              </View>
            </View>
          )}

          {/* STEP 3: KYC DETAILS */}
          {activeStep === 3 && (
            <View>
              <Text style={styles.sectionHeader}>Step 4: Verification & KYC</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>PAN Card Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10-character PAN (e.g. ABCDE1234F)"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="characters"
                  maxLength={10}
                  value={form.pan}
                  onChangeText={(v) => handleChange('pan', v.toUpperCase())}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Aadhaar Card Number (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="12-digit Aadhaar number"
                  placeholderTextColor="#94A3B8"
                  keyboardType="number-pad"
                  maxLength={12}
                  value={form.aadhaar}
                  onChangeText={(v) => handleChange('aadhaar', v.replace(/\D/g, ''))}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Sponsor / Referral Code (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter sponsor partner code if available"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="characters"
                  value={form.referral_code}
                  onChangeText={(v) => handleChange('referral_code', v.toUpperCase())}
                />
              </View>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => handleChange('termsAgreed', !form.termsAgreed)}
              >
                <View style={[styles.checkbox, form.termsAgreed && styles.checkboxActive]}>
                  {form.termsAgreed && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.termsText}>
                  I agree to the <Text style={{ color: '#0d47a1', fontWeight: 'bold' }}>Terms & Conditions</Text> and <Text style={{ color: '#0d47a1', fontWeight: 'bold' }}>Privacy Policy</Text>.
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP BUTTONS */}
          <View style={styles.btnRow}>
            {activeStep > 0 && (
              <TouchableOpacity style={styles.prevBtn} onPress={handlePrev}>
                <Text style={styles.prevBtnText}>← Previous</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.nextBtn, loading && styles.disabledBtn]}
              onPress={handleNext}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.nextBtnText}>
                  {activeStep === STEPS.length - 1 ? 'Submit Registration' : 'Next Step →'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login', { role: 'Partner' })}
          >
            <Text style={styles.loginLinkText}>
              Already registered? <Text style={{ color: '#0d47a1', fontWeight: 'bold' }}>Log In</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  scroll: { padding: 24, paddingBottom: 40 },
  backBtn: { marginBottom: 16 },
  backText: { color: '#0d47a1', fontSize: 14, fontWeight: '700' },
  title: { fontSize: 26, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#64748B', marginBottom: 20 },
  stepperContainer: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: 12, padding: 6, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  stepTab: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  stepTabActive: { backgroundColor: '#ffffff', borderRadius: 8, elevation: 1 },
  stepBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  stepBadgeActive: { backgroundColor: '#0d47a1' },
  stepBadgeText: { fontSize: 11, fontWeight: '800', color: '#64748B' },
  stepBadgeTextActive: { color: '#ffffff' },
  stepLabel: { fontSize: 10, fontWeight: '600', color: '#64748B' },
  stepLabelActive: { color: '#0d47a1', fontWeight: '800' },
  sectionHeader: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 16 },
  row: { flexDirection: 'row' },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 6 },
  input: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  passwordWrapper: { flexDirection: 'row', alignItems: 'center' },
  eyeBtn: { position: 'absolute', right: 12, padding: 4 },
  eyeText: { fontSize: 16 },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pickerPill: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  pickerPillActive: { backgroundColor: '#EEF4FB', borderColor: '#0d47a1' },
  pickerPillText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  pickerPillTextActive: { color: '#0d47a1', fontWeight: '800' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 16 },
  checkbox: { width: 20, height: 20, borderWidth: 1.5, borderColor: '#94A3B8', borderRadius: 4, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  checkboxActive: { backgroundColor: '#0d47a1', borderColor: '#0d47a1' },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  termsText: { flex: 1, fontSize: 12, color: '#475569', lineHeight: 16 },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  prevBtn: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  prevBtnText: { color: '#334155', fontSize: 14, fontWeight: '700' },
  nextBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#0d47a1', alignItems: 'center', justifyContent: 'center', elevation: 2 },
  nextBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  disabledBtn: { backgroundColor: '#94A3B8' },
  loginLink: { marginTop: 20, alignItems: 'center' },
  loginLinkText: { fontSize: 13, color: '#64748B' },
});
