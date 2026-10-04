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
import { router } from 'expo-router';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { Button } from '../../components/Button';
import {
  fetchEmployeeVerificationStatus,
  fetchEmployeeOnboardingStatus,
  submitJoiningDetails,
  submitEmployeeKYC,
} from '../../services/employee.service';

export default function EmployeeOnboardingScreen() {
  const [activeTab, setActiveTab] = useState<'status' | 'joining' | 'kyc'>('status');
  const [loading, setLoading] = useState(true);
  const [vStatus, setVStatus] = useState<any>(null);

  // Joining Form State
  const [fatherName, setFatherName] = useState('');
  const [dob, setDob] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [submittingJoining, setSubmittingJoining] = useState(false);

  // KYC Form State
  const [panNumber, setPanNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [submittingKYC, setSubmittingKYC] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const res = await fetchEmployeeVerificationStatus();
      setVStatus(res);
    } catch (err: any) {
      console.warn('Failed to load verification status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoiningSubmit = async () => {
    if (!currentAddress.trim() || !emergencyContact.trim()) {
      Alert.alert('Required', 'Please fill in address and emergency contact.');
      return;
    }
    setSubmittingJoining(true);
    try {
      await submitJoiningDetails({
        father_name: fatherName.trim(),
        date_of_birth: dob.trim(),
        current_address: currentAddress.trim(),
        permanent_address: permanentAddress.trim() || currentAddress.trim(),
        emergency_contact: emergencyContact.trim(),
      });
      Alert.alert('Success', 'Joining details saved successfully.');
      setActiveTab('status');
      loadStatus();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit joining details');
    } finally {
      setSubmittingJoining(false);
    }
  };

  const handleKYCSubmit = async () => {
    if (!panNumber.trim() || !accountNumber.trim() || !ifscCode.trim()) {
      Alert.alert('Required', 'Please fill in PAN number and bank account details.');
      return;
    }
    setSubmittingKYC(true);
    try {
      await submitEmployeeKYC({
        pan_number: panNumber.trim().toUpperCase(),
        aadhaar_number: aadhaarNumber.trim(),
        bank_name: bankName.trim(),
        account_number: accountNumber.trim(),
        ifsc_code: ifscCode.trim().toUpperCase(),
      });
      Alert.alert('Success', 'Employee KYC documents submitted for verification.');
      setActiveTab('status');
      loadStatus();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit employee KYC');
    } finally {
      setSubmittingKYC(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSubtitle}>EMPLOYEE ONBOARDING</Text>
          <Text style={styles.headerTitle}>Joining & Verification</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'status' && styles.activeTabBtn]}
          onPress={() => setActiveTab('status')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'status' && styles.activeTabBtnText]}>
            Progress
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'joining' && styles.activeTabBtn]}
          onPress={() => setActiveTab('joining')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'joining' && styles.activeTabBtnText]}>
            Joining Form
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'kyc' && styles.activeTabBtn]}
          onPress={() => setActiveTab('kyc')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'kyc' && styles.activeTabBtnText]}>
            KYC Docs
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAB 1: Status */}
      {activeTab === 'status' && (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Onboarding Verification Tracker</Text>
          <Text style={styles.cardSubtitle}>
            Complete all onboarding tasks to activate your employee sales dashboard and links.
          </Text>

          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
          ) : (
            <View style={styles.tasksList}>
              <View style={styles.taskItem}>
                <Icon name="check-circle" size={20} color="#10B981" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.taskTitle}>Interview & Selection</Text>
                  <Text style={styles.taskSub}>Cleared by Talent Acquisition</Text>
                </View>
                <Text style={[styles.taskBadge, { color: '#10B981' }]}>COMPLETED</Text>
              </View>

              <View style={styles.taskItem}>
                <Icon name="file-text" size={20} color={colors.primaryLight} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.taskTitle}>Joining Details Form</Text>
                  <Text style={styles.taskSub}>Address and emergency contact</Text>
                </View>
                <TouchableOpacity onPress={() => setActiveTab('joining')}>
                  <Text style={styles.actionLink}>Fill Form</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.taskItem}>
                <Icon name="shield" size={20} color="#F59E0B" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.taskTitle}>KYC & Bank Verification</Text>
                  <Text style={styles.taskSub}>PAN, Aadhaar & Salary account</Text>
                </View>
                <TouchableOpacity onPress={() => setActiveTab('kyc')}>
                  <Text style={styles.actionLink}>Submit KYC</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.taskItem}>
                <Icon name="award" size={20} color={colors.textLight} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.taskTitle}>Product Links & Authorization</Text>
                  <Text style={styles.taskSub}>Auto-assigned upon manager approval</Text>
                </View>
                <Text style={[styles.taskBadge, { color: colors.textLight }]}>PENDING</Text>
              </View>
            </View>
          )}
        </Card>
      )}

      {/* TAB 2: Joining Form */}
      {activeTab === 'joining' && (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Employee Joining Details</Text>
          <Text style={styles.cardSubtitle}>Mandatory contact and background details.</Text>

          <Text style={styles.inputLabel}>Father's / Guardian's Name</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Father's Full Name"
            placeholderTextColor={colors.textLight}
            value={fatherName}
            onChangeText={setFatherName}
          />

          <Text style={styles.inputLabel}>Date of Birth (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. 1998-05-15"
            placeholderTextColor={colors.textLight}
            value={dob}
            onChangeText={setDob}
          />

          <Text style={styles.inputLabel}>Current Residential Address *</Text>
          <TextInput
            style={[styles.textInput, { height: 70, textAlignVertical: 'top' }]}
            placeholder="Current Address, Flat No, City, Pincode"
            placeholderTextColor={colors.textLight}
            value={currentAddress}
            onChangeText={setCurrentAddress}
            multiline
            numberOfLines={3}
          />

          <Text style={styles.inputLabel}>Emergency Contact Number *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="10-digit mobile number"
            placeholderTextColor={colors.textLight}
            value={emergencyContact}
            onChangeText={setEmergencyContact}
            keyboardType="phone-pad"
            maxLength={10}
          />

          <Button
            title="Save Joining Details"
            onPress={handleJoiningSubmit}
            loading={submittingJoining}
            style={{ marginTop: spacing.md }}
          />
        </Card>
      )}

      {/* TAB 3: KYC Form */}
      {activeTab === 'kyc' && (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Employee KYC & Bank Account</Text>
          <Text style={styles.cardSubtitle}>Required for salary disbursal and compliance.</Text>

          <Text style={styles.inputLabel}>PAN Card Number *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="ABCDE1234F"
            placeholderTextColor={colors.textLight}
            value={panNumber}
            onChangeText={setPanNumber}
            autoCapitalize="characters"
            maxLength={10}
          />

          <Text style={styles.inputLabel}>Aadhaar Card Number</Text>
          <TextInput
            style={styles.textInput}
            placeholder="12-digit Aadhaar Number"
            placeholderTextColor={colors.textLight}
            value={aadhaarNumber}
            onChangeText={setAadhaarNumber}
            keyboardType="number-pad"
            maxLength={12}
          />

          <Text style={styles.inputLabel}>Salary Bank Name *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. HDFC Bank, SBI, ICICI"
            placeholderTextColor={colors.textLight}
            value={bankName}
            onChangeText={setBankName}
          />

          <Text style={styles.inputLabel}>Bank Account Number *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter account number"
            placeholderTextColor={colors.textLight}
            value={accountNumber}
            onChangeText={setAccountNumber}
            keyboardType="number-pad"
          />

          <Text style={styles.inputLabel}>IFSC Code *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. HDFC0001234"
            placeholderTextColor={colors.textLight}
            value={ifscCode}
            onChangeText={setIfscCode}
            autoCapitalize="characters"
          />

          <Button
            title="Submit KYC Documents"
            onPress={handleKYCSubmit}
            loading={submittingKYC}
            style={{ marginTop: spacing.md }}
          />
        </Card>
      )}
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
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 4,
    marginBottom: spacing.md,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabBtn: {
    backgroundColor: colors.primary,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
  },
  activeTabBtnText: {
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: spacing.md,
  },
  tasksList: {
    gap: spacing.sm,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  taskTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  taskSub: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
  taskBadge: {
    fontSize: 10,
    fontWeight: '800',
  },
  actionLink: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryLight,
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
});
