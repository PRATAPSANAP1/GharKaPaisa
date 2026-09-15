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
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const handleRegister = async () => {
    if (!form.first_name.trim() || !form.mobile.trim() || !form.email.trim() || !form.password) {
      Alert.alert('Missing Fields', 'Please fill in all mandatory fields (First Name, Mobile, Email, Password).');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) {
      Alert.alert('Invalid Mobile', 'Enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      Alert.alert('Invalid Email', 'Enter a valid email address.');
      return;
    }

    if (form.password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
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
          'Account Created Successfully! 🎉',
          'Your partner account has been created. Please log in to complete your profile & KYC.',
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
      Alert.alert('Registration Error', err.response?.data?.message || 'Failed to register. Mobile or Email may already exist.');
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
          <Text style={styles.subtitle}>Create your free partner account and start earning commissions</Text>

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
                placeholder="Minimum 6 characters"
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

          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 2, marginRight: 8 }]}>
              <Text style={styles.label}>Business / Firm Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Company or agency name"
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

          <Text style={styles.termsNote}>
            By creating an account, you agree to our <Text style={{ color: '#0d47a1', fontWeight: 'bold' }}>Terms of Service</Text> and <Text style={{ color: '#0d47a1', fontWeight: 'bold' }}>Privacy Policy</Text>.
          </Text>

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
  container: { flex: 1, backgroundColor: '#ffffff', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  scroll: { padding: 24, paddingBottom: 40 },
  backBtn: { marginBottom: 20 },
  backText: { color: '#0d47a1', fontSize: 14, fontWeight: '700' },
  title: { fontSize: 26, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#64748B', marginBottom: 20 },
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
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  eyeText: {
    fontSize: 16,
  },
  termsNote: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 16,
  },
  submitBtn: {
    backgroundColor: '#0d47a1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 3,
  },
  submitBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  disabledBtn: { backgroundColor: '#94A3B8' },
  loginLink: { marginTop: 20, alignItems: 'center' },
  loginLinkText: { fontSize: 13, color: '#64748B' },
});
