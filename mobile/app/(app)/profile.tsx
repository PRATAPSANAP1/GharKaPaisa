import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Card, Button, StatusBadge, ErrorState } from '../../components';
import { Icon } from '../../components/Icon';
import {
  updateProfile,
  requestEmailChange,
  verifyEmailChange,
  requestMobileChange,
  verifyMobileChange,
} from '../../services/auth.service';

export default function ProfileScreen() {
  const { user, userRole, logout, reloadUser } = useAuth();

  // Profile Edit State
  const [fullName, setFullName] = useState(user?.full_name || user?.name || '');
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Email Change Modal State
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [emailStep, setEmailStep] = useState<'request' | 'verify'>('request');
  const [newEmail, setNewEmail] = useState('');
  const [oldEmailOtp, setOldEmailOtp] = useState('');
  const [newEmailOtp, setNewEmailOtp] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  // Mobile Change Modal State
  const [mobileModalVisible, setMobileModalVisible] = useState(false);
  const [mobileStep, setMobileStep] = useState<'request' | 'verify'>('request');
  const [newMobile, setNewMobile] = useState('');
  const [oldMobileOtp, setOldMobileOtp] = useState('');
  const [newMobileOtp, setNewMobileOtp] = useState('');
  const [mobileLoading, setMobileLoading] = useState(false);

  // Update Full Name
  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert('Validation Error', 'Full Name cannot be empty.');
      return;
    }

    setUpdating(true);
    setUpdateError(null);

    try {
      await updateProfile({ fullName: fullName.trim() });
      await reloadUser();
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (err: any) {
      let msg = 'Failed to update profile.';
      if (err.response?.status === 429) {
        msg = 'Too many requests. Please wait a moment and try again.';
      } else if (err.message) {
        msg = err.message;
      }
      setUpdateError(msg);
    } finally {
      setUpdating(false);
    }
  };

  // Handle Email Change Flow
  const handleRequestEmailChange = async () => {
    if (!newEmail.trim() || !newEmail.includes('@')) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return;
    }
    setEmailLoading(true);
    try {
      const res = await requestEmailChange(newEmail.trim());
      Alert.alert('Codes Sent', res.message || 'Verification codes sent to old and new email addresses.');
      setEmailStep('verify');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to request email change.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleVerifyEmailChange = async () => {
    if (!oldEmailOtp.trim() || !newEmailOtp.trim()) {
      Alert.alert('Validation Error', 'Please enter both OTP codes.');
      return;
    }
    setEmailLoading(true);
    try {
      await verifyEmailChange(oldEmailOtp.trim(), newEmailOtp.trim());
      await reloadUser();
      Alert.alert('Success', 'Email address updated successfully.');
      setEmailModalVisible(false);
      setEmailStep('request');
      setNewEmail('');
      setOldEmailOtp('');
      setNewEmailOtp('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Invalid verification codes.');
    } finally {
      setEmailLoading(false);
    }
  };

  // Handle Mobile Change Flow
  const handleRequestMobileChange = async () => {
    if (!newMobile.trim() || newMobile.trim().length < 10) {
      Alert.alert('Validation Error', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    setMobileLoading(true);
    try {
      const res = await requestMobileChange(newMobile.trim());
      Alert.alert('Codes Sent', res.message || 'Verification codes sent to old and new mobile numbers.');
      setMobileStep('verify');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to request mobile change.');
    } finally {
      setMobileLoading(false);
    }
  };

  const handleVerifyMobileChange = async () => {
    if (!oldMobileOtp.trim() || !newMobileOtp.trim()) {
      Alert.alert('Validation Error', 'Please enter both OTP codes.');
      return;
    }
    setMobileLoading(true);
    try {
      await verifyMobileChange(oldMobileOtp.trim(), newMobileOtp.trim());
      await reloadUser();
      Alert.alert('Success', 'Mobile number updated successfully.');
      setMobileModalVisible(false);
      setMobileStep('request');
      setNewMobile('');
      setOldMobileOtp('');
      setNewMobileOtp('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Invalid verification codes.');
    } finally {
      setMobileLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Header Avatar Section */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.full_name || user?.email || 'U')[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user?.full_name || user?.name || 'User Profile'}</Text>
        <StatusBadge status={userRole || 'User'} />
      </View>

      {/* Editable Profile Information */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Editable Profile Information</Text>

        <Text style={styles.inputLabel}>Full Name</Text>
        <TextInput
          style={styles.textInput}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Enter full name..."
          placeholderTextColor={colors.textLight}
        />

        {updateError && <ErrorState message={updateError} onRetry={handleSaveProfile} />}

        <View style={styles.btnRow}>
          <Button
            title={updating ? 'Saving...' : 'Save Changes'}
            onPress={handleSaveProfile}
            loading={updating}
            disabled={updating}
          />
        </View>
      </Card>

      {/* Verified Contact Details (OTP Change Flow) */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Contact Identifiers (OTP Protected)</Text>

        <View style={styles.contactRow}>
          <View style={styles.contactInfo}>
            <Text style={styles.label}>Email Address</Text>
            <Text style={styles.val}>{user?.email || 'N/A'}</Text>
          </View>
          <TouchableOpacity style={styles.changeBtn} onPress={() => setEmailModalVisible(true)}>
            <Text style={styles.changeBtnText}>Change Email</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contactRow}>
          <View style={styles.contactInfo}>
            <Text style={styles.label}>Mobile Number</Text>
            <Text style={styles.val}>{user?.mobile || 'N/A'}</Text>
          </View>
          <TouchableOpacity style={styles.changeBtn} onPress={() => setMobileModalVisible(true)}>
            <Text style={styles.changeBtnText}>Change Mobile</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Read-Only System Details */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>System Authorization & Scope (Read-Only)</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Role / Level:</Text>
          <Text style={styles.valBold}>{userRole}</Text>
        </View>

        {user?.partner_code ? (
          <View style={styles.row}>
            <Text style={styles.label}>Partner Code:</Text>
            <Text style={styles.valBold}>{user.partner_code}</Text>
          </View>
        ) : null}

        {user?.department ? (
          <View style={styles.row}>
            <Text style={styles.label}>Department:</Text>
            <Text style={styles.val}>{user.department}</Text>
          </View>
        ) : null}

        {user?.designation ? (
          <View style={styles.row}>
            <Text style={styles.label}>Designation:</Text>
            <Text style={styles.val}>{user.designation}</Text>
          </View>
        ) : null}

        <View style={styles.row}>
          <Text style={styles.label}>Account Status:</Text>
          <Text style={styles.val}>{user?.status || 'Active'}</Text>
        </View>
      </Card>

      {/* Security Navigation Link */}
      <Card style={styles.card}>
        <TouchableOpacity style={styles.securityRow} onPress={() => router.push('/security')}>
          <View style={styles.securityInfo}>
            <Icon name="shield" size={18} color={colors.primary} />
            <View>
              <Text style={styles.securityTitle}>Security & Active Sessions</Text>
              <Text style={styles.securitySub}>Change password, view active devices & sessions</Text>
            </View>
          </View>
          <Icon name="chevron-right" size={16} color={colors.textLight} />
        </TouchableOpacity>
      </Card>

      {/* Sign Out Action Button */}
      <Button title="Sign Out of Session" onPress={handleLogout} variant="danger" style={{ marginTop: spacing.md, marginBottom: spacing.xl }} />

      {/* Change Email Modal */}
      <Modal visible={emailModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Email Address</Text>
            {emailStep === 'request' ? (
              <View>
                <Text style={styles.modalSub}>Enter your new email address. Verification codes will be sent to both old and new addresses.</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="New Email Address"
                  placeholderTextColor={colors.textLight}
                  value={newEmail}
                  onChangeText={setNewEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <View style={styles.modalBtnRow}>
                  <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setEmailModalVisible(false)}>
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <Button title={emailLoading ? 'Sending...' : 'Send Codes'} onPress={handleRequestEmailChange} loading={emailLoading} />
                </View>
              </View>
            ) : (
              <View>
                <Text style={styles.modalSub}>Enter OTP sent to your CURRENT email and OTP sent to your NEW email.</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Old Email OTP"
                  placeholderTextColor={colors.textLight}
                  value={oldEmailOtp}
                  onChangeText={setOldEmailOtp}
                  keyboardType="number-pad"
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="New Email OTP"
                  placeholderTextColor={colors.textLight}
                  value={newEmailOtp}
                  onChangeText={setNewEmailOtp}
                  keyboardType="number-pad"
                />
                <View style={styles.modalBtnRow}>
                  <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setEmailModalVisible(false)}>
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <Button title={emailLoading ? 'Verifying...' : 'Verify & Update'} onPress={handleVerifyEmailChange} loading={emailLoading} />
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Change Mobile Modal */}
      <Modal visible={mobileModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Mobile Number</Text>
            {mobileStep === 'request' ? (
              <View>
                <Text style={styles.modalSub}>Enter your new 10-digit mobile number. Verification codes will be sent via SMS.</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="New 10-Digit Mobile"
                  placeholderTextColor={colors.textLight}
                  value={newMobile}
                  onChangeText={setNewMobile}
                  keyboardType="phone-pad"
                />
                <View style={styles.modalBtnRow}>
                  <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setMobileModalVisible(false)}>
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <Button title={mobileLoading ? 'Sending...' : 'Send Codes'} onPress={handleRequestMobileChange} loading={mobileLoading} />
                </View>
              </View>
            ) : (
              <View>
                <Text style={styles.modalSub}>Enter SMS OTP sent to your CURRENT mobile and SMS OTP sent to your NEW mobile.</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Old Mobile SMS OTP"
                  placeholderTextColor={colors.textLight}
                  value={oldMobileOtp}
                  onChangeText={setOldMobileOtp}
                  keyboardType="number-pad"
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="New Mobile SMS OTP"
                  placeholderTextColor={colors.textLight}
                  value={newMobileOtp}
                  onChangeText={setNewMobileOtp}
                  keyboardType="number-pad"
                />
                <View style={styles.modalBtnRow}>
                  <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setMobileModalVisible(false)}>
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <Button title={mobileLoading ? 'Verifying...' : 'Verify & Update'} onPress={handleVerifyMobileChange} loading={mobileLoading} />
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.md,
    paddingTop: spacing.lg,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  avatarText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.extrabold,
    color: '#FFF',
  },
  name: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 4,
  },
  card: {
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  inputLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textMid,
    marginBottom: 4,
  },
  textInput: {
    height: 44,
    backgroundColor: colors.inputBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    fontSize: typography.sizes.sm,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  btnRow: {
    marginTop: spacing.xs,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  contactInfo: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    color: colors.textLight,
  },
  val: {
    fontSize: typography.sizes.xs,
    color: colors.text,
    fontWeight: typography.weights.semibold,
    marginTop: 2,
  },
  valBold: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: typography.weights.bold,
    marginTop: 2,
  },
  changeBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSecondary,
  },
  changeBtnText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  securityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  securityTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  securitySub: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContent: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
  },
  modalTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  modalSub: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  modalInput: {
    height: 44,
    backgroundColor: colors.inputBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    fontSize: typography.sizes.sm,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  modalCancelBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  modalCancelText: {
    fontSize: typography.sizes.sm,
    color: colors.textMid,
  },
});
