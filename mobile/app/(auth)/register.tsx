import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { Button } from '../../components/Button';
import { registerUser } from '../../services/auth.service';
import { useAuth } from '../../contexts/AuthContext';

const STEPS = ['Personal', 'Business', 'Bank', 'KYC'];

const COMPANY_TYPES = [
  { label: 'Individual', value: 'individual' },
  { label: 'Proprietorship', value: 'proprietorship' },
  { label: 'Partnership', value: 'partnership' },
  { label: 'Private Limited Company', value: 'pvt_ltd' },
];

export default function RegisterScreen() {
  const { loginSession } = useAuth();

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState({
    // Step 0: Personal
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
    // Step 1: Business
    companyType: 'individual',
    companyName: '',
    currentAddress: '',
    pincode: '',
    city: '',
    // Step 2: Bank
    bankName: '',
    accountNumber: '',
    ifsc: '',
    accountHolderName: '',
    // Step 3: KYC
    pan: '',
    aadhaar: '',
    termsAgreed: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  const updateField = (field: string, val: any) => {
    setForm((prev) => ({ ...prev, [field]: val }));
    setErrorMsg(null);
  };

  // Validation per step
  const validateStep = (stepIdx: number): boolean => {
    if (stepIdx === 0) {
      if (!form.firstName.trim()) {
        setErrorMsg('First name is required');
        return false;
      }
      if (!form.mobile.trim() || form.mobile.trim().length < 10) {
        setErrorMsg('Please enter a valid 10-digit mobile number');
        return false;
      }
      if (!form.email.trim() || !form.email.includes('@')) {
        setErrorMsg('Please enter a valid email address');
        return false;
      }
      if (!form.password || form.password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long');
        return false;
      }
      if (form.password !== form.confirmPassword) {
        setErrorMsg('Passwords do not match');
        return false;
      }
    } else if (stepIdx === 1) {
      if (form.companyType !== 'individual' && !form.companyName.trim()) {
        setErrorMsg('Company name is required for business entities');
        return false;
      }
      if (!form.currentAddress.trim()) {
        setErrorMsg('Current address is required');
        return false;
      }
      if (!form.pincode.trim() || form.pincode.trim().length < 6) {
        setErrorMsg('Please enter a valid 6-digit pincode');
        return false;
      }
    } else if (stepIdx === 2) {
      if (!form.bankName.trim()) {
        setErrorMsg('Bank name is required');
        return false;
      }
      if (!form.accountNumber.trim()) {
        setErrorMsg('Account number is required');
        return false;
      }
      if (!form.ifsc.trim() || form.ifsc.trim().length < 4) {
        setErrorMsg('Valid IFSC code is required');
        return false;
      }
    } else if (stepIdx === 3) {
      if (!form.pan.trim() || form.pan.trim().length < 10) {
        setErrorMsg('Please enter a valid 10-character PAN number');
        return false;
      }
      if (!form.termsAgreed) {
        setErrorMsg('You must agree to the Terms and Conditions');
        return false;
      }
    }
    setErrorMsg(null);
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep((prev) => prev + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handlePrev = () => {
    setErrorMsg(null);
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const payload = {
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        mobile: form.mobile.trim(),
        password: form.password,
        role: 'PARTNER',
        company_type: form.companyType,
        company_name: form.companyName.trim() || `${form.firstName} ${form.lastName}`,
        current_address: form.currentAddress.trim(),
        pincode: form.pincode.trim(),
        city: form.city.trim(),
        bank_name: form.bankName.trim(),
        account_number: form.accountNumber.trim(),
        ifsc_code: form.ifsc.trim().toUpperCase(),
        account_holder_name: form.accountHolderName.trim() || `${form.firstName} ${form.lastName}`,
        pan: form.pan.trim().toUpperCase(),
        aadhaar_number: form.aadhaar.trim(),
        referral_code: form.referralCode.trim() || undefined,
      };

      const res = await registerUser(payload);
      if (res?.success) {
        setSuccessData(res.data || res.partner || res);
        if (res.token && res.user) {
          await loginSession(res.user, res.token, res.refreshToken);
        }
      } else {
        setErrorMsg(res?.message || 'Registration failed');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration error. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  // Render Success Screen
  if (successData) {
    return (
      <ScrollView contentContainerStyle={styles.successContainer}>
        <View style={styles.successCard}>
          <View style={styles.successIconWrap}>
            <Icon name="check-circle" size={48} color="#10B981" />
          </View>
          <Text style={styles.successTitle}>Welcome to GharKaPaisa!</Text>
          <Text style={styles.successSubtitle}>
            Your partner account has been created successfully.
          </Text>

          {successData.partner_code && (
            <View style={styles.codeBox}>
              <Text style={styles.codeBoxLabel}>YOUR PARTNER CODE</Text>
              <Text style={styles.codeBoxValue}>{successData.partner_code}</Text>
            </View>
          )}

          <Button
            title="Go to Partner Dashboard"
            onPress={() => router.replace('/(app)/partner-dashboard')}
            style={{ marginTop: spacing.lg, width: '100%' }}
          />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handlePrev}>
          <Icon name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSubtitle}>PARTNER ONBOARDING</Text>
          <Text style={styles.headerTitle}>Create Partner Account</Text>
        </View>
      </View>

      {/* Step Indicator */}
      <View style={styles.stepIndicatorRow}>
        {STEPS.map((stepName, idx) => (
          <View key={stepName} style={styles.stepItem}>
            <View
              style={[
                styles.stepDot,
                idx === currentStep && styles.activeStepDot,
                idx < currentStep && styles.completedStepDot,
              ]}
            >
              {idx < currentStep ? (
                <Icon name="check" size={12} color="#fff" />
              ) : (
                <Text
                  style={[
                    styles.stepDotText,
                    idx === currentStep && styles.activeStepDotText,
                  ]}
                >
                  {idx + 1}
                </Text>
              )}
            </View>
            <Text
              style={[
                styles.stepNameText,
                idx === currentStep && styles.activeStepNameText,
              ]}
            >
              {stepName}
            </Text>
          </View>
        ))}
      </View>

      {/* Main Card */}
      <Card style={styles.card}>
        {/* Error Box */}
        {errorMsg && (
          <View style={styles.errorBox}>
            <Icon name="alert-circle" size={16} color="#EF4444" />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {/* STEP 0: Personal Details */}
        {currentStep === 0 && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>1. Personal Information</Text>

            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>First Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Rahul"
                  placeholderTextColor={colors.textLight}
                  value={form.firstName}
                  onChangeText={(t) => updateField('firstName', t)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Sharma"
                  placeholderTextColor={colors.textLight}
                  value={form.lastName}
                  onChangeText={(t) => updateField('lastName', t)}
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Mobile Number (10-digit) *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="9876543210"
              placeholderTextColor={colors.textLight}
              value={form.mobile}
              onChangeText={(t) => updateField('mobile', t)}
              keyboardType="phone-pad"
              maxLength={10}
            />

            <Text style={styles.inputLabel}>Email Address *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="rahul@example.com"
              placeholderTextColor={colors.textLight}
              value={form.email}
              onChangeText={(t) => updateField('email', t)}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.inputLabel}>Password (Min. 6 chars) *</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={[styles.textInput, { flex: 1, borderWidth: 0 }]}
                placeholder="Create password"
                placeholderTextColor={colors.textLight}
                value={form.password}
                onChangeText={(t) => updateField('password', t)}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 8 }}>
                <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} color={colors.textLight} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Confirm Password *</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={[styles.textInput, { flex: 1, borderWidth: 0 }]}
                placeholder="Confirm password"
                placeholderTextColor={colors.textLight}
                value={form.confirmPassword}
                onChangeText={(t) => updateField('confirmPassword', t)}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={{ padding: 8 }}>
                <Icon name={showConfirmPassword ? 'eye-off' : 'eye'} size={18} color={colors.textLight} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Referral / Sponsor Code (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. GKP1002"
              placeholderTextColor={colors.textLight}
              value={form.referralCode}
              onChangeText={(t) => updateField('referralCode', t)}
              autoCapitalize="characters"
            />
          </View>
        )}

        {/* STEP 1: Business Details */}
        {currentStep === 1 && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>2. Business & Address</Text>

            <Text style={styles.inputLabel}>Entity Type</Text>
            <View style={styles.companyTypeRow}>
              {COMPANY_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typePill,
                    form.companyType === type.value && styles.activeTypePill,
                  ]}
                  onPress={() => updateField('companyType', type.value)}
                >
                  <Text
                    style={[
                      styles.typePillText,
                      form.companyType === type.value && styles.activeTypePillText,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {form.companyType !== 'individual' && (
              <>
                <Text style={styles.inputLabel}>Business / Enterprise Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Sharma Financial Advisory"
                  placeholderTextColor={colors.textLight}
                  value={form.companyName}
                  onChangeText={(t) => updateField('companyName', t)}
                />
              </>
            )}

            <Text style={styles.inputLabel}>Current Address *</Text>
            <TextInput
              style={[styles.textInput, { height: 70, textAlignVertical: 'top' }]}
              placeholder="Flat/House, Street, Area"
              placeholderTextColor={colors.textLight}
              value={form.currentAddress}
              onChangeText={(t) => updateField('currentAddress', t)}
              multiline
              numberOfLines={3}
            />

            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Pincode *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="411001"
                  placeholderTextColor={colors.textLight}
                  value={form.pincode}
                  onChangeText={(t) => updateField('pincode', t)}
                  keyboardType="numeric"
                  maxLength={6}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>City</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Pune"
                  placeholderTextColor={colors.textLight}
                  value={form.city}
                  onChangeText={(t) => updateField('city', t)}
                />
              </View>
            </View>
          </View>
        )}

        {/* STEP 2: Bank Details */}
        {currentStep === 2 && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>3. Payout Bank Details</Text>
            <Text style={styles.sectionSubtitle}>
              Commissions and earnings will be directly disbursed to this bank account.
            </Text>

            <Text style={styles.inputLabel}>Bank Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. HDFC Bank, ICICI Bank, SBI"
              placeholderTextColor={colors.textLight}
              value={form.bankName}
              onChangeText={(t) => updateField('bankName', t)}
            />

            <Text style={styles.inputLabel}>Account Number *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter bank account number"
              placeholderTextColor={colors.textLight}
              value={form.accountNumber}
              onChangeText={(t) => updateField('accountNumber', t)}
              keyboardType="number-pad"
            />

            <Text style={styles.inputLabel}>IFSC Code *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. HDFC0001234"
              placeholderTextColor={colors.textLight}
              value={form.ifsc}
              onChangeText={(t) => updateField('ifsc', t)}
              autoCapitalize="characters"
            />

            <Text style={styles.inputLabel}>Account Holder Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Name as printed on passbook"
              placeholderTextColor={colors.textLight}
              value={form.accountHolderName}
              onChangeText={(t) => updateField('accountHolderName', t)}
            />
          </View>
        )}

        {/* STEP 3: KYC & Agreement */}
        {currentStep === 3 && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>4. KYC Identification</Text>

            <Text style={styles.inputLabel}>PAN Card Number *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="ABCDE1234F"
              placeholderTextColor={colors.textLight}
              value={form.pan}
              onChangeText={(t) => updateField('pan', t)}
              autoCapitalize="characters"
              maxLength={10}
            />

            <Text style={styles.inputLabel}>Aadhaar Number (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="12-digit Aadhaar Number"
              placeholderTextColor={colors.textLight}
              value={form.aadhaar}
              onChangeText={(t) => updateField('aadhaar', t)}
              keyboardType="number-pad"
              maxLength={12}
            />

            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => updateField('termsAgreed', !form.termsAgreed)}
            >
              <View
                style={[
                  styles.checkbox,
                  form.termsAgreed && styles.checkboxChecked,
                ]}
              >
                {form.termsAgreed && <Icon name="check" size={12} color="#fff" />}
              </View>
              <Text style={styles.termsText}>
                I accept the GharKaPaisa Partner Agreement, Terms of Service, and Commission Guidelines.
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Navigation Buttons */}
        <View style={styles.actionBtnRow}>
          {currentStep > 0 && (
            <TouchableOpacity style={styles.secondaryBtn} onPress={handlePrev}>
              <Text style={styles.secondaryBtnText}>Back</Text>
            </TouchableOpacity>
          )}

          <Button
            title={currentStep === STEPS.length - 1 ? 'Complete Registration' : 'Continue'}
            onPress={handleNext}
            loading={loading}
            style={{ flex: 1 }}
          />
        </View>

        {/* Already have an account link */}
        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => router.replace('/(auth)/login' as any)}
        >
          <Text style={styles.loginLinkText}>
            Already registered? <Text style={{ color: colors.primaryLight, fontWeight: '700' }}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing.md,
    backgroundColor: '#0B1120',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  backBtn: {
    marginRight: spacing.sm,
    padding: 4,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeStepDot: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  completedStepDot: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  stepDotText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textLight,
  },
  activeStepDotText: {
    color: '#fff',
  },
  stepNameText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textLight,
  },
  activeStepNameText: {
    color: '#fff',
    fontWeight: '700',
  },
  card: {
    padding: spacing.lg,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#EF4444',
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  formSection: {
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: colors.textLight,
    marginBottom: spacing.sm,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.xs,
    marginBottom: 2,
  },
  textInput: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 13,
    color: '#fff',
    marginBottom: 4,
  },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingRight: 4,
    marginBottom: 4,
  },
  companyTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  typePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
  },
  activeTypePill: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textLight,
  },
  activeTypePillText: {
    color: '#fff',
    fontWeight: '700',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    color: colors.textLight,
    lineHeight: 16,
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  secondaryBtn: {
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textLight,
  },
  loginLink: {
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: 4,
  },
  loginLinkText: {
    fontSize: 12,
    color: colors.textLight,
  },
  successContainer: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    backgroundColor: '#0B1120',
  },
  successCard: {
    padding: spacing.xl,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  successIconWrap: {
    marginBottom: spacing.md,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  codeBox: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
    width: '100%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  codeBoxLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryLight,
    letterSpacing: 1,
  },
  codeBoxValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    marginTop: 4,
    letterSpacing: 2,
  },
});
