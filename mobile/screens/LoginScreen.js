import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import axios from 'axios';
import { OTPWidget } from '@msg91comm/sendotp-react-native';
import { BASE_URL } from '../config/api';
import LogoLoader from '../components/LogoLoader';

const WIDGET_ID = process.env.EXPO_PUBLIC_MSG91_WIDGET_ID;
const TOKEN_AUTH = process.env.EXPO_PUBLIC_MSG91_TOKEN_AUTH;
const SMS_CHANNEL = '11';

const getAccessToken = (response) =>
  response?.accessToken ||
  response?.['access-token'] ||
  response?.data?.accessToken ||
  response?.data?.['access-token'] ||
  null;

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.message ||
  error?.data?.message ||
  fallback;

export default function LoginScreen({ route, navigation }) {
  const { role } = route.params;
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState({ otp: false, login: false });
  const [sdkReady, setSdkReady] = useState(false);
  const [reqId, setReqId] = useState('');

  useEffect(() => {
    if (!WIDGET_ID || !TOKEN_AUTH) {
      console.error('MSG91 widget configuration is missing');
      return;
    }

    try {
      OTPWidget.initializeWidget(WIDGET_ID, TOKEN_AUTH);
      setSdkReady(true);
    } catch (error) {
      console.error('MSG91 widget initialization failed', error);
    }
  }, []);

  useEffect(() => {
    if (timer <= 0) return undefined;
    const interval = setInterval(() => setTimer((value) => value - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    setOtp('');
    setOtpSent(false);
    setTimer(0);
    setReqId('');
  }, [mobile]);

  const formattedIdentifier = () => `91${mobile.trim()}`;

  const validateMobile = () => {
    if (!/^[6-9]\d{9}$/.test(mobile.trim())) {
      Alert.alert('Invalid mobile number', 'Enter a valid 10-digit Indian mobile number.');
      return false;
    }
    if (!sdkReady) {
      Alert.alert(
        'SMS service unavailable',
        'MSG91 is not configured. Add the widget ID and tokenAuth to the mobile environment.'
      );
      return false;
    }
    return true;
  };

  const handleSendOtp = async () => {
    if (!validateMobile()) return;

    setLoading((value) => ({ ...value, otp: true }));
    try {
      const response = await OTPWidget.sendOTP({ identifier: formattedIdentifier() });
      const currentReqId = response?.reqId || response?.request_id || (typeof response === 'string' ? response : response?.data);
      setReqId(currentReqId || '');
      setOtpSent(true);
      setTimer(30);
      Alert.alert('OTP sent', 'A verification code was sent to your registered mobile number.');
    } catch (error) {
      Alert.alert('Could not send OTP', getErrorMessage(error, 'Please try again.'));
    } finally {
      setLoading((value) => ({ ...value, otp: false }));
    }
  };

  const handleRetryOtp = async () => {
    if (!validateMobile()) return;

    setLoading((value) => ({ ...value, otp: true }));
    try {
      await OTPWidget.retryOTP({ reqId, retryChannel: 11 });
      setTimer(30);
      Alert.alert('OTP resent', 'A new verification code was sent by SMS.');
    } catch (error) {
      Alert.alert('Could not resend OTP', getErrorMessage(error, 'Please try again.'));
    } finally {
      setLoading((value) => ({ ...value, otp: false }));
    }
  };

  const handleLogin = async () => {
    if (!validateMobile()) return;
    if (!otpSent) {
      Alert.alert('OTP required', 'Send an OTP first.');
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      Alert.alert('Invalid OTP', 'Enter the 6-digit OTP.');
      return;
    }

    setLoading((value) => ({ ...value, login: true }));
    try {
      const verificationResponse = await OTPWidget.verifyOTP({ reqId, otp });
      const accessToken = getAccessToken(verificationResponse);

      if (!accessToken) {
        throw new Error('MSG91 did not return a verification token.');
      }

      const loginResponse = await axios.post(`${BASE_URL}/auth/login-msg91`, {
        mobile: mobile.trim(),
        accessToken,
      });

      const token = loginResponse.data.token;
      if (!token) throw new Error('Authentication token was not received.');

      const profileResponse = await axios.get(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profile = profileResponse.data.user;
      if (!profile) throw new Error('Failed to retrieve the user profile.');

      navigation.replace('Dashboard', { user: profile, token });
    } catch (error) {
      Alert.alert('Login failed', getErrorMessage(error, 'Invalid or expired OTP.'));
    } finally {
      setLoading((value) => ({ ...value, login: false }));
    }
  };

  if (loading.login) {
    return <LogoLoader text="Verifying mobile number..." />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back to Home</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{role} Login</Text>
        <Text style={styles.subtitle}>Sign in securely using an SMS OTP</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Mobile Number</Text>
          <View style={styles.mobileRow}>
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>+91</Text>
            </View>
            <TextInput
              style={[styles.input, styles.mobileInput]}
              placeholder="10-digit mobile number"
              placeholderTextColor="#999"
              keyboardType="number-pad"
              maxLength={10}
              value={mobile}
              onChangeText={(text) => setMobile(text.replace(/\D/g, ''))}
              editable={!loading.login}
            />
          </View>
        </View>

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
              onChangeText={(text) => setOtp(text.replace(/\D/g, ''))}
              editable={otpSent && !loading.login}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (timer > 0 || loading.otp) && styles.disabledBtn]}
              onPress={otpSent ? handleRetryOtp : handleSendOtp}
              disabled={timer > 0 || loading.otp || loading.login}
            >
              {loading.otp ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.sendBtnText}>
                  {timer > 0 ? `${timer}s` : otpSent ? 'Resend' : 'Send OTP'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
          {otpSent && (
            <Text style={styles.infoText}>
              OTP sent to +91 {mobile.replace(/.(?=.{4})/g, '*')}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.loginBtn, (!otpSent || loading.login) && styles.disabledBtn]}
          onPress={handleLogin}
          disabled={!otpSent || loading.login}
        >
          <Text style={styles.loginBtnText}>Verify & Log In</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 24, justifyContent: 'center', flexGrow: 1 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 40, marginTop: 20 },
  backText: { color: '#0d47a1', fontSize: 15, fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '900', color: '#333', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 32 },
  inputContainer: { width: '100%', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 8 },
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
  mobileRow: { flexDirection: 'row', alignItems: 'center' },
  countryCode: {
    paddingHorizontal: 14,
    alignSelf: 'stretch',
    justifyContent: 'center',
    backgroundColor: '#eef4fb',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    marginRight: 8,
  },
  countryCodeText: { color: '#333', fontSize: 15, fontWeight: '700' },
  mobileInput: { flex: 1 },
  otpRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  otpInput: {
    flex: 1,
    marginRight: 10,
    textAlign: 'center',
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  sendBtn: {
    backgroundColor: '#0d47a1',
    borderRadius: 10,
    paddingVertical: 14,
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
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
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  disabledBtn: { backgroundColor: '#a5c0e7' },
  infoText: { fontSize: 12, color: '#2e7d32', marginTop: 8, fontWeight: '600' },
});
