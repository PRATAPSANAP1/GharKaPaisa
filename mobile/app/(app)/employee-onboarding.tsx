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
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { Button } from '../../components/Button';
import { fetchEmployeeOnboardingStatus, submitOnboardingStep } from '../../services/employee.service';
import { getEnrollmentStatus } from '../../services/attendance.service';

type OnboardingStep = 'JOINING_FORM' | 'TERMS' | 'KYC' | 'VERIFICATION' | 'COMPLETED';

export default function EmployeeOnboardingScreen() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('JOINING_FORM');
  const [loading, setLoading] = useState(false);
  const [onboardingStatus, setOnboardingStatus] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    // Joining Form
    fullName: '',
    dateOfBirth: '',
    gender: '',
    fatherName: '',
    motherName: '',
    maritalStatus: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    emergencyContact: '',
    emergencyRelation: '',
    education: '',
    workExperience: '',
    languages: '',
    
    // Terms
    termsAccepted: false,
    
    // KYC
    panNumber: '',
    aadhaarNumber: '',
    panDocumentUri: '',
    panDocumentName: '',
    panDocumentType: '',
    aadhaarDocumentUri: '',
    aadhaarDocumentName: '',
    aadhaarDocumentType: '',
  });

  useEffect(() => {
    loadOnboardingStatus();
  }, []);

  const loadOnboardingStatus = async () => {
    try {
      setLoading(true);
      const status = await fetchEmployeeOnboardingStatus();
      setOnboardingStatus(status);
      
      // Resume at the first incomplete step based on the onboarding checklist
      if (status?.kyc_verified) {
        setCurrentStep('COMPLETED');
      } else if (status?.kyc_submitted) {
        setCurrentStep('VERIFICATION');
      } else if (status?.terms_completed) {
        setCurrentStep('KYC');
      } else if (status?.joining_form_completed) {
        setCurrentStep('TERMS');
      }
    } catch (err: any) {
      console.error('Failed to load onboarding status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStepSubmit = async () => {
    try {
      setLoading(true);
      
      const stepData = {
        step: currentStep,
        data: formData,
      };

      await submitOnboardingStep(stepData);
      
      // Move to next step
      const stepOrder: OnboardingStep[] = ['JOINING_FORM', 'TERMS', 'KYC', 'VERIFICATION', 'COMPLETED'];
      const currentIndex = stepOrder.indexOf(currentStep);
      if (currentIndex < stepOrder.length - 1) {
        setCurrentStep(stepOrder[currentIndex + 1]);
      }
      
      Alert.alert('Success', 'Step completed successfully!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit step');
    } finally {
      setLoading(false);
    }
  };

  // Pick a KYC document (PAN / Aadhaar) and stash it for the multipart
  // upload performed by submitOnboardingStep's KYC branch.
  const handlePickKycDocument = async (docType: 'pan' | 'aadhaar') => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];

      if (docType === 'pan') {
        setFormData((prev) => ({
          ...prev,
          panDocumentUri: asset.uri,
          panDocumentName: asset.name || 'pan_card.jpg',
          panDocumentType: asset.mimeType || 'image/jpeg',
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          aadhaarDocumentUri: asset.uri,
          aadhaarDocumentName: asset.name || 'aadhaar_card.jpg',
          aadhaarDocumentType: asset.mimeType || 'image/jpeg',
        }));
      }
    } catch (err: any) {
      Alert.alert('Error', 'Could not select the document.');
    }
  };

  // Face enrollment is verified through the attendance module, not an
  // onboarding endpoint — the pipeline only opens once the face is enrolled.
  const handleCompleteVerification = async () => {
    try {
      setLoading(true);
      const enrollment = await getEnrollmentStatus();
      if (enrollment?.is_enrolled) {
        setCurrentStep('COMPLETED');
        Alert.alert('Success', 'Face enrollment verified. Onboarding complete!');
      } else {
        Alert.alert(
          'Face Enrollment Pending',
          'Your face is not enrolled yet. Please complete face enrollment from the Attendance section, then return here.'
        );
      }
    } catch (err: any) {
      Alert.alert('Error', 'Could not verify face enrollment status.');
    } finally {
      setLoading(false);
    }
  };

  const renderJoiningForm = () => (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>Joining Form</Text>
      <Text style={styles.cardSubtitle}>Please fill in your personal details</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={styles.input}
          value={formData.fullName}
          onChangeText={(text) => setFormData({ ...formData, fullName: text })}
          placeholder="Enter your full name"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Date of Birth *</Text>
        <TextInput
          style={styles.input}
          value={formData.dateOfBirth}
          onChangeText={(text) => setFormData({ ...formData, dateOfBirth: text })}
          placeholder="DD/MM/YYYY"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Gender *</Text>
        <View style={styles.buttonGroup}>
          {['Male', 'Female', 'Other'].map((gender) => (
            <TouchableOpacity
              key={gender}
              style={[
                styles.optionButton,
                formData.gender === gender && styles.optionButtonActive,
              ]}
              onPress={() => setFormData({ ...formData, gender })}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  formData.gender === gender && styles.optionButtonTextActive,
                ]}
              >
                {gender}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Father's Name *</Text>
        <TextInput
          style={styles.input}
          value={formData.fatherName}
          onChangeText={(text) => setFormData({ ...formData, fatherName: text })}
          placeholder="Enter father's name"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Mother's Name *</Text>
        <TextInput
          style={styles.input}
          value={formData.motherName}
          onChangeText={(text) => setFormData({ ...formData, motherName: text })}
          placeholder="Enter mother's name"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Address *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.address}
          onChangeText={(text) => setFormData({ ...formData, address: text })}
          placeholder="Enter your full address"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>City *</Text>
        <TextInput
          style={styles.input}
          value={formData.city}
          onChangeText={(text) => setFormData({ ...formData, city: text })}
          placeholder="Enter city"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>State *</Text>
        <TextInput
          style={styles.input}
          value={formData.state}
          onChangeText={(text) => setFormData({ ...formData, state: text })}
          placeholder="Enter state"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Pincode *</Text>
        <TextInput
          style={styles.input}
          value={formData.pincode}
          onChangeText={(text) => setFormData({ ...formData, pincode: text })}
          placeholder="Enter pincode"
          keyboardType="numeric"
          maxLength={6}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Emergency Contact *</Text>
        <TextInput
          style={styles.input}
          value={formData.emergencyContact}
          onChangeText={(text) => setFormData({ ...formData, emergencyContact: text })}
          placeholder="Enter emergency contact number"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Emergency Relation *</Text>
        <TextInput
          style={styles.input}
          value={formData.emergencyRelation}
          onChangeText={(text) => setFormData({ ...formData, emergencyRelation: text })}
          placeholder="e.g., Father, Spouse, Sibling"
        />
      </View>

      <Button
        title="Next: Terms & Conditions"
        onPress={handleStepSubmit}
        loading={loading}
        style={{ marginTop: spacing.md }}
      />
    </Card>
  );

  const renderTerms = () => (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>Terms & Conditions</Text>
      <Text style={styles.cardSubtitle}>Please read and accept the terms</Text>

      <ScrollView style={styles.termsContent}>
        <Text style={styles.termsText}>
          1. EMPLOYMENT TERMS: This employment is subject to the terms and conditions of GharKaPaisa...
          
          2. WORKING HOURS: Standard working hours are 9:00 AM to 6:00 PM, Monday to Saturday...
          
          3. CONFIDENTIALITY: You agree to maintain confidentiality of all company information...
          
          4. CODE OF CONDUCT: You agree to follow the company's code of conduct...
          
          5. COMPENSATION: Your compensation will be as per the offer letter...
          
          6. TERMINATION: Either party may terminate this agreement with 30 days notice...
          
          7. DATA PROTECTION: You agree to protect all customer and company data...
          
          8. ATTENDANCE: Regular attendance is mandatory and subject to biometric verification...
          
          9. TRAINING: You agree to complete all required training programs...
          
          10. COMPLIANCE: You agree to comply with all applicable laws and regulations...
        </Text>
      </ScrollView>

      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => setFormData({ ...formData, termsAccepted: !formData.termsAccepted })}
      >
        <View style={[styles.checkbox, formData.termsAccepted && styles.checkboxChecked]}>
          {formData.termsAccepted && <Icon name="check" size={14} color="#fff" />}
        </View>
        <Text style={styles.checkboxLabel}>I accept the Terms & Conditions</Text>
      </TouchableOpacity>

      <Button
        title="Next: KYC Verification"
        onPress={handleStepSubmit}
        loading={loading}
        disabled={!formData.termsAccepted}
        style={{ marginTop: spacing.md }}
      />
    </Card>
  );

  const renderKYC = () => (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>KYC Verification</Text>
      <Text style={styles.cardSubtitle}>Upload your KYC documents</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>PAN Number *</Text>
        <TextInput
          style={styles.input}
          value={formData.panNumber}
          onChangeText={(text) => setFormData({ ...formData, panNumber: text.toUpperCase() })}
          placeholder="Enter PAN number"
          autoCapitalize="characters"
          maxLength={10}
        />
      </View>

      <TouchableOpacity style={styles.uploadBox} onPress={() => handlePickKycDocument('pan')}>
        <Icon name="upload-cloud" size={32} color={colors.primaryLight} />
        <Text style={styles.uploadText}>
          {formData.panDocumentName ? `${formData.panDocumentName} ✓` : 'Upload PAN Card'}
        </Text>
      </TouchableOpacity>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Aadhaar Number *</Text>
        <TextInput
          style={styles.input}
          value={formData.aadhaarNumber}
          onChangeText={(text) => setFormData({ ...formData, aadhaarNumber: text })}
          placeholder="Enter Aadhaar number"
          keyboardType="numeric"
          maxLength={12}
        />
      </View>

      <TouchableOpacity style={styles.uploadBox} onPress={() => handlePickKycDocument('aadhaar')}>
        <Icon name="upload-cloud" size={32} color={colors.primaryLight} />
        <Text style={styles.uploadText}>
          {formData.aadhaarDocumentName ? `${formData.aadhaarDocumentName} ✓` : 'Upload Aadhaar Card'}
        </Text>
      </TouchableOpacity>

      <Button
        title="Next: Face Verification"
        onPress={handleStepSubmit}
        loading={loading}
        disabled={!formData.panNumber || !formData.aadhaarNumber}
        style={{ marginTop: spacing.md }}
      />
    </Card>
  );

  const renderVerification = () => (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>Face Verification</Text>
      <Text style={styles.cardSubtitle}>Complete face enrollment for attendance</Text>

      <View style={styles.verificationBox}>
        <Icon name="user" size={64} color={colors.textLight} />
        <Text style={styles.verificationText}>
          Complete your face enrollment in the Attendance section to finish onboarding.
        </Text>
      </View>

      <Button
        title="Go to Face Enrollment"
        onPress={() => router.push('/(app)/attendance')}
        style={{ marginTop: spacing.md }}
      />

      <Button
        title="I've Enrolled — Check Status"
        onPress={handleCompleteVerification}
        loading={loading}
        style={{ marginTop: spacing.sm }}
      />
    </Card>
  );

  const renderCompleted = () => (
    <Card style={styles.card}>
      <View style={styles.completedContainer}>
        <Icon name="check-circle" size={80} color="#10B981" />
        <Text style={styles.completedTitle}>Onboarding Complete!</Text>
        <Text style={styles.completedText}>
          Your onboarding has been completed successfully. You can now start using the employee app.
        </Text>
        <Button
          title="Go to Dashboard"
          onPress={() => router.push('/(app)/dashboard')}
          style={{ marginTop: spacing.lg }}
        />
      </View>
    </Card>
  );

  const renderStepIndicator = () => {
    const steps = [
      { key: 'JOINING_FORM', label: 'Joining Form' },
      { key: 'TERMS', label: 'Terms' },
      { key: 'KYC', label: 'KYC' },
      { key: 'VERIFICATION', label: 'Verification' },
    ];

    const stepOrder: OnboardingStep[] = ['JOINING_FORM', 'TERMS', 'KYC', 'VERIFICATION'];
    const currentIndex = stepOrder.indexOf(currentStep);

    return (
      <View style={styles.stepIndicator}>
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = step.key === currentStep;
          
          return (
            <View key={step.key} style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  isCompleted && styles.stepCircleCompleted,
                  isCurrent && styles.stepCircleCurrent,
                ]}
              >
                {isCompleted ? (
                  <Icon name="check" size={12} color="#fff" />
                ) : (
                  <Text style={styles.stepNumber}>{index + 1}</Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  isCompleted && styles.stepLabelCompleted,
                  isCurrent && styles.stepLabelCurrent,
                ]}
              >
                {step.label}
              </Text>
              {index < steps.length - 1 && <View style={styles.stepLine} />}
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Icon name="chevron-left" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerSubtitle}>EMPLOYEE ONBOARDING</Text>
            <Text style={styles.headerTitle}>Complete Your Profile</Text>
          </View>
        </View>

        {/* Step Indicator */}
        {currentStep !== 'COMPLETED' && renderStepIndicator()}

        {/* Content */}
        {currentStep === 'JOINING_FORM' && renderJoiningForm()}
        {currentStep === 'TERMS' && renderTerms()}
        {currentStep === 'KYC' && renderKYC()}
        {currentStep === 'VERIFICATION' && renderVerification()}
        {currentStep === 'COMPLETED' && renderCompleted()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  scrollContent: {
    padding: spacing.md,
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
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  stepCircleCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  stepCircleCurrent: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  stepLabel: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
  },
  stepLabelCompleted: {
    color: '#10B981',
    fontWeight: '700',
  },
  stepLabelCurrent: {
    color: '#0284C7',
    fontWeight: '700',
  },
  stepLine: {
    position: 'absolute',
    top: 16,
    left: '50%',
    width: '100%',
    height: 2,
    backgroundColor: '#334155',
  },
  card: {
    padding: spacing.lg,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: spacing.lg,
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 13,
    color: '#fff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  optionButton: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  optionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
  },
  optionButtonTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  termsContent: {
    maxHeight: 200,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  termsText: {
    fontSize: 11,
    color: colors.textLight,
    lineHeight: 18,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkboxLabel: {
    fontSize: 12,
    color: colors.text,
  },
  uploadBox: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#334155',
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  uploadText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    marginTop: spacing.xs,
  },
  verificationBox: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  verificationText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginTop: spacing.md,
    textAlign: 'center',
  },
  completedContainer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  completedTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#10B981',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  completedText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
});
