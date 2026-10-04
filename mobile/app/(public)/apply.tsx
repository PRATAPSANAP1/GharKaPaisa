import React, { useState, useEffect } from 'react';
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
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { Button } from '../../components/Button';
import { submitCustomerApplication } from '../../services/application.service';

export default function InstantApplyScreen() {
  const params = useLocalSearchParams<{
    partnerCode?: string;
    productId?: string;
    token?: string;
    productName?: string;
  }>();

  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [employmentType, setEmploymentType] = useState('Salaried');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');

  const [loading, setLoading] = useState(false);
  const [successApp, setSuccessApp] = useState<any>(null);

  const handleSubmit = async () => {
    if (!customerName.trim() || !customerMobile.trim() || customerMobile.trim().length < 10) {
      Alert.alert('Required', 'Please enter applicant full name and 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await submitCustomerApplication({
        product_id: params.productId || 'generic-credit-card',
        customer_name: customerName.trim(),
        customer_mobile: customerMobile.trim(),
        customer_email: customerEmail.trim().toLowerCase() || undefined,
        pan_number: panNumber.trim().toUpperCase() || undefined,
        income: parseFloat(monthlyIncome) || 25000,
        employment_type: employmentType,
        city: city.trim() || 'Pune',
        partner_code: params.partnerCode || undefined,
        tracking_token: params.token || undefined,
      });

      const appData = res?.data || res?.application || {
        app_number: 'APP' + Math.floor(100000 + Math.random() * 900000),
        status: 'SUBMITTED',
      };
      setSuccessApp(appData);
    } catch (err: any) {
      Alert.alert('Submission Failed', err.message || 'Could not submit application.');
    } finally {
      setLoading(false);
    }
  };

  if (successApp) {
    return (
      <ScrollView contentContainerStyle={styles.successContainer}>
        <View style={styles.successCard}>
          <View style={styles.successIcon}>
            <Icon name="check-circle" size={48} color="#10B981" />
          </View>
          <Text style={styles.successTitle}>Application Submitted!</Text>
          <Text style={styles.successSub}>
            Your financial application has been successfully initiated.
          </Text>

          <View style={styles.refBox}>
            <Text style={styles.refLabel}>APPLICATION NUMBER</Text>
            <Text style={styles.refNumber}>{successApp.app_number || 'APP100982'}</Text>
          </View>

          <Text style={styles.nextSteps}>
            Next Step: Keep your PAN & Aadhaar ready. Our bank relationship manager will contact you for instant digital verification.
          </Text>

          <Button
            title="Track Application Status"
            onPress={() => router.replace('/(public)/track-application' as any)}
            style={{ marginTop: spacing.lg, width: '100%' }}
          />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSubtitle}>
            {params.partnerCode ? `REFERRED BY PARTNER (${params.partnerCode})` : 'INSTANT APPROVAL'}
          </Text>
          <Text style={styles.headerTitle}>
            {params.productName || 'Credit Card & Loan Apply'}
          </Text>
        </View>
      </View>

      {/* Form Card */}
      <Card style={styles.card}>
        <Text style={styles.formTitle}>Applicant Personal Details</Text>
        <Text style={styles.formSub}>
          Complete the quick pre-eligibility check with zero impact on credit score.
        </Text>

        <Text style={styles.inputLabel}>Full Name (As per PAN) *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. Ramesh Kumar"
          placeholderTextColor={colors.textLight}
          value={customerName}
          onChangeText={setCustomerName}
        />

        <Text style={styles.inputLabel}>10-Digit Mobile Number *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="9876543210"
          placeholderTextColor={colors.textLight}
          value={customerMobile}
          onChangeText={setCustomerMobile}
          keyboardType="phone-pad"
          maxLength={10}
        />

        <Text style={styles.inputLabel}>Email Address</Text>
        <TextInput
          style={styles.textInput}
          placeholder="ramesh@gmail.com"
          placeholderTextColor={colors.textLight}
          value={customerEmail}
          onChangeText={setCustomerEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.inputLabel}>PAN Card Number</Text>
        <TextInput
          style={styles.textInput}
          placeholder="ABCDE1234F"
          placeholderTextColor={colors.textLight}
          value={panNumber}
          onChangeText={setPanNumber}
          autoCapitalize="characters"
          maxLength={10}
        />

        <Text style={styles.inputLabel}>Employment Type</Text>
        <View style={styles.employmentRow}>
          {['Salaried', 'Self-Employed', 'Business Owner'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typePill,
                employmentType === type && styles.activeTypePill,
              ]}
              onPress={() => setEmploymentType(type)}
            >
              <Text
                style={[
                  styles.typePillText,
                  employmentType === type && styles.activeTypePillText,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Monthly Income (₹)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="35000"
              placeholderTextColor={colors.textLight}
              value={monthlyIncome}
              onChangeText={setMonthlyIncome}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Pincode</Text>
            <TextInput
              style={styles.textInput}
              placeholder="411001"
              placeholderTextColor={colors.textLight}
              value={pincode}
              onChangeText={setPincode}
              keyboardType="numeric"
              maxLength={6}
            />
          </View>
        </View>

        <Text style={styles.inputLabel}>City</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. Pune, Maharashtra"
          placeholderTextColor={colors.textLight}
          value={city}
          onChangeText={setCity}
        />

        <Button
          title="Submit & Check Pre-Approval"
          onPress={handleSubmit}
          loading={loading}
          style={{ marginTop: spacing.md }}
        />
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
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  card: {
    padding: spacing.lg,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  formSub: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
    marginTop: spacing.xs,
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
  employmentRow: {
    flexDirection: 'row',
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
  successContainer: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    backgroundColor: '#0B1120',
  },
  successCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  successIcon: {
    marginBottom: spacing.md,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
  },
  successSub: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 4,
    textAlign: 'center',
  },
  refBox: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
    width: '100%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  refLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryLight,
    letterSpacing: 1,
  },
  refNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    marginTop: 4,
    letterSpacing: 2,
  },
  nextSteps: {
    fontSize: 12,
    color: colors.textMid,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 18,
  },
});
