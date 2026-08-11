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

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    mobile: '',
    password: '',
    company_name: '',
    pincode: '',
    referral_code: '',
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const handleRegister = async () => {
    if (!form.first_name.trim() || !form.mobile.trim() || !form.email.trim() || !form.password) {
      Alert.alert('Missing Fields', 'Please fill in all mandatory fields (Name, Mobile, Email, Password).');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) {
      Alert.alert('Invalid Mobile', 'Enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim().toLowerCase(),
        mobile: form.mobile.trim(),
        password: form.password,
        company_name: form.company_name.trim(),
        pincode: form.pincode.trim(),
        referral_code: form.referral_code.trim().toUpperCase() || undefined,
        role: 'PARTNER'
      };

      const res = await axios.post(`${BASE_URL}/auth/register`, payload);

      if (res.data?.success || res.data?.status === 'success') {
        Alert.alert(
          'Registration Successful!',
          'Your partner account has been created. Please log in to complete your profile and KYC.',
          [
            {
              text: 'Proceed to Login',
              onPress: () => navigation.navigate('Login', { role: 'Partner' })
            }
          ]
        );
      } else {
        Alert.alert('Registration Failed', res.data?.message || 'Failed to complete registration.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', err.response?.data?.message || 'Registration failed. Mobile or Email may already exist.');
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
          <Text style={styles.subtitle}>Create your free partner account and start earning</Text>

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
            <TextInput
              style={styles.input}
              placeholder="Minimum 6 characters"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              value={form.password}
              onChangeText={(v) => handleChange('password', v)}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 2, marginRight: 8 }]}>
              <Text style={styles.label}>Company / Business</Text>
              <TextInput
                style={styles.input}
                placeholder="Business name"
                placeholderTextColor="#94A3B8"
                value={form.company_name}
                onChangeText={(v) => handleChange('company_name', v)}
              />
            </View>
            <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Pincode</Text>
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
            <Text style={styles.label}>Referral Code (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter sponsor partner code"
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
              value={form.referral_code}
              onChangeText={(v) => handleChange('referral_code', v)}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.disabledBtn]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Create Partner Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login', { role: 'Partner' })}
          >
            <Text style={styles.loginLinkText}>
              Already have an account? <Text style={{ color: '#0d47a1', fontWeight: 'bold' }}>Log In</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scroll: { padding: 24, paddingBottom: 40 },
  backBtn: { marginBottom: 20, marginTop: 10 },
  backText: { color: '#0d47a1', fontSize: 14, fontWeight: '700' },
  title: { fontSize: 26, fontWeight: '800', color: '#1E293B', marginBottom: 6 },
  subtitle: { fontSize: 13, color: '#64748B', marginBottom: 24 },
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
  submitBtn: {
    backgroundColor: '#0d47a1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    elevation: 3,
  },
  submitBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  disabledBtn: { backgroundColor: '#94A3B8' },
  loginLink: { marginTop: 20, alignItems: 'center' },
  loginLinkText: { fontSize: 13, color: '#64748B' },
});
