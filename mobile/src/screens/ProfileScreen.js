import React, { useEffect, useState } from 'react';
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
  Platform,
  Switch,
  Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { BASE_URL } from '../config/api';

export default function ProfileScreen({ navigation }) {
  const { user, token, updateUser, logout, toggleBiometric, biometricEnabled } = useAuth();
  const [profile, setProfile] = useState(user || {});
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    mobile: user?.mobile || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    pincode: user?.pincode || ''
  });
  const [notifications, setNotifications] = useState({
    push: true,
    email: true,
    sms: false
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      if (token) {
        const res = await axios.get(`${BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => null);

        if (res?.data?.user) {
          setProfile(res.data.user);
          setFormData({
            first_name: res.data.user.first_name || '',
            last_name: res.data.user.last_name || '',
            email: res.data.user.email || '',
            mobile: res.data.user.mobile || '',
            address: res.data.user.address || '',
            city: res.data.user.city || '',
            state: res.data.user.state || '',
            pincode: res.data.user.pincode || ''
          });
        }
      }
    } catch (err) {
      console.warn('Profile load note:', err.message);
    }
  };

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        // In production, upload to server
        Alert.alert('Profile Photo', 'Photo selected. Upload feature will be implemented with backend.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const res = await axios.put(`${BASE_URL}/auth/profile`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => null);

      if (res?.data?.user) {
        await updateUser(res.data.user);
        setProfile(res.data.user);
        setEditing(false);
        Alert.alert('Success', 'Profile updated successfully!');
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        await logout();
        navigation.replace('Home');
      }}
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => Alert.alert('Contact Support', 'To delete your account, please contact our support team.') 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#0d47a1" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile & Settings</Text>
        <TouchableOpacity onPress={() => setEditing(!editing)}>
          <Text style={styles.editBtnText}>{editing ? 'Cancel' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile Photo Section */}
        <View style={styles.photoSection}>
          <TouchableOpacity style={styles.photoContainer} onPress={handleImagePick}>
            <Image 
              source={profile.profile_photo ? { uri: profile.profile_photo } : require('../../assets/logo.jpeg')}
              style={styles.photo}
            />
            <View style={styles.photoEditBadge}>
              <Text style={styles.photoEditText}>📷</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.profileName}>{profile.first_name} {profile.last_name}</Text>
          <Text style={styles.profileRole}>{profile.role || 'Partner'}</Text>
          {profile.partner_code && (
            <Text style={styles.profileCode}>Partner Code: {profile.partner_code}</Text>
          )}
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>First Name</Text>
            {editing ? (
              <TextInput
                style={styles.fieldInput}
                value={formData.first_name}
                onChangeText={(text) => setFormData({ ...formData, first_name: text })}
              />
            ) : (
              <Text style={styles.fieldValue}>{profile.first_name || '-'}</Text>
            )}
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Last Name</Text>
            {editing ? (
              <TextInput
                style={styles.fieldInput}
                value={formData.last_name}
                onChangeText={(text) => setFormData({ ...formData, last_name: text })}
              />
            ) : (
              <Text style={styles.fieldValue}>{profile.last_name || '-'}</Text>
            )}
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Email</Text>
            {editing ? (
              <TextInput
                style={styles.fieldInput}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
              />
            ) : (
              <Text style={styles.fieldValue}>{profile.email || '-'}</Text>
            )}
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Mobile</Text>
            <Text style={[styles.fieldValue, styles.fieldValueReadOnly]}>{profile.mobile || '-'}</Text>
          </View>
        </View>

        {/* Address Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address Information</Text>
          
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Address</Text>
            {editing ? (
              <TextInput
                style={[styles.fieldInput, styles.fieldInputMultiline]}
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                multiline
                numberOfLines={2}
              />
            ) : (
              <Text style={styles.fieldValue}>{profile.address || '-'}</Text>
            )}
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>City</Text>
            {editing ? (
              <TextInput
                style={styles.fieldInput}
                value={formData.city}
                onChangeText={(text) => setFormData({ ...formData, city: text })}
              />
            ) : (
              <Text style={styles.fieldValue}>{profile.city || '-'}</Text>
            )}
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>State</Text>
            {editing ? (
              <TextInput
                style={styles.fieldInput}
                value={formData.state}
                onChangeText={(text) => setFormData({ ...formData, state: text })}
              />
            ) : (
              <Text style={styles.fieldValue}>{profile.state || '-'}</Text>
            )}
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Pincode</Text>
            {editing ? (
              <TextInput
                style={styles.fieldInput}
                value={formData.pincode}
                onChangeText={(text) => setFormData({ ...formData, pincode: text })}
                keyboardType="number-pad"
                maxLength={6}
              />
            ) : (
              <Text style={styles.fieldValue}>{profile.pincode || '-'}</Text>
            )}
          </View>
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Settings</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingTitle}>Push Notifications</Text>
              <Text style={styles.settingDesc}>Receive app notifications</Text>
            </View>
            <Switch
              value={notifications.push}
              onValueChange={(value) => setNotifications({ ...notifications, push: value })}
              trackColor={{ false: '#E2E8F0', true: '#0d47a1' }}
              thumbColor={notifications.push ? '#FFFFFF' : '#64748B'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingTitle}>Email Notifications</Text>
              <Text style={styles.settingDesc}>Receive email updates</Text>
            </View>
            <Switch
              value={notifications.email}
              onValueChange={(value) => setNotifications({ ...notifications, email: value })}
              trackColor={{ false: '#E2E8F0', true: '#0d47a1' }}
              thumbColor={notifications.email ? '#FFFFFF' : '#64748B'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingTitle}>SMS Notifications</Text>
              <Text style={styles.settingDesc}>Receive SMS alerts</Text>
            </View>
            <Switch
              value={notifications.sms}
              onValueChange={(value) => setNotifications({ ...notifications, sms: value })}
              trackColor={{ false: '#E2E8F0', true: '#0d47a1' }}
              thumbColor={notifications.sms ? '#FFFFFF' : '#64748B'}
            />
          </View>
        </View>

        {/* Security Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security Settings</Text>
          
          <TouchableOpacity style={styles.settingRow} onPress={() => toggleBiometric(!biometricEnabled)}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingTitle}>Biometric Login</Text>
              <Text style={styles.settingDesc}>Use fingerprint or face recognition</Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={toggleBiometric}
              trackColor={{ false: '#E2E8F0', true: '#0d47a1' }}
              thumbColor={biometricEnabled ? '#FFFFFF' : '#64748B'}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionRow} onPress={() => Alert.alert('Change Password', 'Password change feature will be implemented.')}>
            <Text style={styles.actionTitle}>Change Password</Text>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionRow} onPress={() => Alert.alert('Two-Factor Auth', '2FA setup will be implemented.')}>
            <Text style={styles.actionTitle}>Two-Factor Authentication</Text>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Save Button (when editing) */}
        {editing && (
          <TouchableOpacity
            style={[styles.saveBtn, loading && styles.btnDisabled]}
            onPress={handleSaveProfile}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Danger Zone */}
        <View style={styles.dangerSection}>
          <TouchableOpacity style={styles.dangerBtn} onPress={handleLogout}>
            <Text style={styles.dangerBtnText}>🚪 Logout</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.dangerBtn} onPress={handleDeleteAccount}>
            <Text style={styles.dangerBtnText}>🗑️ Delete Account</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>GharKaPaisa Mobile v1.0.0</Text>
          <Text style={styles.appCopyright}>© 2026 GharKaPaisa. All rights reserved.</Text>
        </View>

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
  editBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  scroll: { padding: 16, paddingBottom: 40 },
  photoSection: { alignItems: 'center', marginBottom: 24 },
  photoContainer: { position: 'relative' },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#0d47a1',
  },
  photoEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0d47a1',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  photoEditText: { fontSize: 14 },
  profileName: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginTop: 12 },
  profileRole: { fontSize: 13, color: '#64748B', fontWeight: '600', marginTop: 2 },
  profileCode: { fontSize: 12, color: '#0d47a1', fontWeight: '700', marginTop: 4 },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 16 },
  fieldRow: { marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 6 },
  fieldValue: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  fieldValueReadOnly: { color: '#94A3B8' },
  fieldInput: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  fieldInputMultiline: { height: 60, textAlignVertical: 'top' },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  settingLeft: { flex: 1 },
  settingTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  settingDesc: { fontSize: 11, color: '#64748B', marginTop: 2 },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  actionTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  actionArrow: { fontSize: 18, color: '#64748B' },
  saveBtn: {
    backgroundColor: '#0d47a1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 3,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  btnDisabled: { backgroundColor: '#94A3B8' },
  dangerSection: {
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  dangerBtn: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  dangerBtnText: { fontSize: 14, fontWeight: '700', color: '#DC2626' },
  appInfo: { alignItems: 'center', marginTop: 24 },
  appVersion: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  appCopyright: { fontSize: 11, color: '#CBD5E1', marginTop: 4 },
});
