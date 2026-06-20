import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import axios from 'axios';
import { BASE_URL } from '../config/api';
import LogoLoader from '../components/LogoLoader';

export default function LoginScreen({ route, navigation }) {
  const { role } = route.params;
  const [identity, setIdentity] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState({ otp: false, login: false });
  const [resolvedMobile, setResolvedMobile] = useState('');
  const [otpAttempts, setOtpAttempts] = useState(0);

  // Timer countdown
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Reset OTP state when identity changes
  useEffect(() => {
    setOtpSent(false);
    setTimer(0);
    setResolvedMobile('');
  }, [identity]);

  const handleSendOtp = async () => {
    if (!identity.trim()) {
      Alert.alert('Error', 'Please enter your email or mobile number.');
      return;
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identity.trim());
    const isMobile = /^[6-9]\d{9}$/.test(identity.trim());
    if (!isEmail && !isMobile) {
      Alert.alert('Error', 'Please enter a valid email or 10-digit mobile number.');
      return;
    }

    if (otpAttempts >= 3) {
      Alert.alert('Error', 'Maximum OTP attempts reached. Please try again later.');
      return;
    }

    setLoading(prev => ({ ...prev, otp: true }));
    try {
      // 1. Look up user to get the registered mobile number
      const lookupRes = await axios.post(`${BASE_URL}/auth/lookup`, {
        identity: identity.trim()
      });

      if (!lookupRes.data.success || !lookupRes.data.data) {
        throw new Error('User not found. Please register first.');
      }

      const { mobile } = lookupRes.data.data;
      if (!mobile) {
        throw new Error('No mobile number registered to this account.');
      }

      setResolvedMobile(mobile);

      // 2. Send OTP to that mobile
      await axios.post(`${BASE_URL}/auth/send-otp`, { identity: mobile });

      setOtpSent(true);
      setOtpAttempts(a => a + 1);
      setTimer(30);
      Alert.alert('Success', `OTP sent successfully to registerd mobile.`);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to send OTP.');
    } finally {
      setLoading(prev => ({ ...prev, otp: false }));
    }
  };

  const handleLogin = async () => {
    if (!identity.trim()) {
      Alert.alert('Error', 'Please enter email or mobile.');
      return;
    }
    if (!otpSent) {
      Alert.alert('Error', 'Please send OTP first.');
      return;
    }
    if (!otp || otp.length < 6) {
      Alert.alert('Error', 'Please enter the 6-digit OTP.');
      return;
    }

    setLoading(prev => ({ ...prev, login: true }));
    try {
      // 1. Verify OTP and login
      const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
        identity: identity.trim(),
        otp
      });

      const token = loginRes.data.token;
      if (!token) throw new Error('Authentication token not received.');

      // 2. Fetch user profile info
      const profileRes = await axios.get(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!profileRes.data.success || !profileRes.data.user) {
        throw new Error('Failed to retrieve user profile.');
      }

      const profile = profileRes.data.user;
      
      // Navigate to Dashboard
      navigation.replace('Dashboard', { user: profile, token });

    } catch (err) {
      Alert.alert('Login Failed', err.response?.data?.message || err.message || 'Invalid credentials or OTP.');
    } finally {
      setLoading(prev => ({ ...prev, login: false }));
    }
  };

  if (loading.login || loading.otp) {
    return <LogoLoader text={loading.login ? "Verifying credentials..." : "Sending OTP code..."} />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back to Home</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{role} Login</Text>
        <Text style={styles.subtitle}>Enter your details to request access token via OTP</Text>

        {/* Input Identifier */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email or Mobile Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter email or mobile number"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            value={identity}
            onChangeText={setIdentity}
            editable={!loading.login}
          />
        </View>

        {/* Enter OTP Field */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Enter 6-Digit OTP</Text>
          <View style={styles.otpRow}>
            <TextInput
              style={[styles.input, styles.otpInput, { opacity: otpSent ? 1 : 0.5 }]}
              placeholder="••••••"
              placeholderTextColor="#999"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={text => setOtp(text.replace(/\D/g, ''))}
              editable={otpSent && !loading.login}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (timer > 0 || loading.otp) && styles.disabledBtn]}
              onPress={handleSendOtp}
              disabled={timer > 0 || loading.otp || loading.login}
            >
              {loading.otp ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.sendBtnText}>
                  {timer > 0 ? `${timer}s` : 'Send OTP'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
          {otpSent && resolvedMobile && (
            <Text style={styles.infoText}>
              OTP sent to {resolvedMobile.replace(/.(?=.{4})/g, '*')}
            </Text>
          )}
        </View>

        {/* Submit button */}
        <TouchableOpacity
          style={[styles.loginBtn, !otpSent && styles.disabledBtn]}
          onPress={handleLogin}
          disabled={!otpSent || loading.login}
        >
          {loading.login ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.loginBtnText}>Secure Log In</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    padding: 24,
    justifyContent: 'center',
    flexGrow: 1,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 40,
    marginTop: 20,
  },
  backText: {
    color: '#0d47a1',
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 32,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#fafafa',
  },
  otpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  otpInput: {
    flex: 1,
    marginRight: 10,
    textAlign: 'center',
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  sendBtn: {
    backgroundColor: '#0d47a1',
    borderRadius: 10,
    paddingVertical: 14,
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  loginBtn: {
    backgroundColor: '#0d47a1',
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#0d47a1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  disabledBtn: {
    backgroundColor: '#a5c0e7',
  },
  infoText: {
    fontSize: 12,
    color: '#2e7d32',
    marginTop: 6,
    fontWeight: '600',
  },
});
