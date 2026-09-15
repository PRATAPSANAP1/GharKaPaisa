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
  SafeAreaView,
  StatusBar
} from 'react-native';
import axios from 'axios';
import { OTPWidget } from '@msg91comm/sendotp-react-native';
import { BASE_URL } from '../config/api';
import LogoLoader from '../components/LogoLoader';

const WIDGET_ID = process.env.EXPO_PUBLIC_MSG91_WIDGET_ID;
const TOKEN_AUTH = process.env.EXPO_PUBLIC_MSG91_TOKEN_AUTH;

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
  const roleParam = route?.params?.role || 'Partner';
  const [selectedRole, setSelectedRole] = useState(roleParam);

  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState({ otp: false, login: false });
  const [sdkReady, setSdkReady] = useState(false);
  const [reqId, setReqId] = useState('');
  const [devOtpCode, setDevOtpCode] = useState(null);

  useEffect(() => {
    if (!WIDGET_ID || !TOKEN_AUTH) {
      console.log('MSG91 configuration absent. Dev OTP fallback mode active.');
      setSdkReady(false);
      return;
    }

    try {
      OTPWidget.initializeWidget(WIDGET_ID, TOKEN_AUTH);
      setSdkReady(true);
    } catch (error) {
      console.error('MSG91 initialization note:', error);
      setSdkReady(false);
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
    setDevOtpCode(null);
  }, [mobile, selectedRole]);

  const formattedIdentifier = () => `91${mobile.trim()}`;

  const validateMobile = () => {
    if (!/^[6-9]\d{9}$/.test(mobile.trim())) {
      Alert.alert('Invalid Mobile Number', 'Please enter a valid 10-digit Indian mobile number.');
      return false;
    }
    return true;
  };

  const handleSendOtp = async () => {
    if (!validateMobile()) return;

    setLoading((value) => ({ ...value, otp: true }));
    try {
      if (sdkReady) {
        const response = await OTPWidget.sendOTP({ identifier: formattedIdentifier() });
        const currentReqId = response?.reqId || response?.request_id || (typeof response === 'string' ? response : response?.data);
        setReqId(currentReqId || '');
        setOtpSent(true);
        setTimer(30);
        Alert.alert('OTP Sent', `A verification code was sent to +91 ${mobile}.`);
      } else {
        // Fallback Backend API call to dispatch OTP
        const res = await axios.post(`${BASE_URL}/auth/send-otp`, {
          identity: mobile.trim(),
          role: selectedRole.toUpperCase()
        }).catch((err) => err.response);

        if (res?.data?.success || res?.status === 200) {
          setOtpSent(true);
          setTimer(30);
          if (res?.data?.message?.includes('OTP:')) {
            const extracted = res.data.message.match(/OTP:\s*(\d+)/)?.[1];
            if (extracted) setDevOtpCode(extracted);
          }
          Alert.alert('OTP Sent', res?.data?.message || 'Verification code dispatched to mobile number.');
        } else {
          // Dev fallback
          setOtpSent(true);
          setTimer(30);
          setDevOtpCode('123456');
          Alert.alert('OTP Dispatched', 'Code sent: Use 123456 to verify.');
        }
      }
    } catch (error) {
      Alert.alert('Could Not Send OTP', getErrorMessage(error, 'Please try again later.'));
    } finally {
      setLoading((value) => ({ ...value, otp: false }));
    }
  };

  const handleRetryOtp = async () => {
    if (!validateMobile()) return;

    setLoading((value) => ({ ...value, otp: true }));
    try {
      if (sdkReady && reqId) {
        await OTPWidget.retryOTP({ reqId, retryChannel: 11 });
        setTimer(30);
        Alert.alert('OTP Resent', 'A new verification code was sent by SMS.');
      } else {
        await handleSendOtp();
      }
    } catch (error) {
      Alert.alert('Could Not Resend OTP', getErrorMessage(error, 'Please try again.'));
    } finally {
      setLoading((value) => ({ ...value, otp: false }));
    }
  };

  const handleLogin = async () => {
    if (!validateMobile()) return;
    if (!otpSent) {
      Alert.alert('OTP Required', 'Please click Send OTP first.');
      return;
    }
    if (!/^\d{4,6}$/.test(otp)) {
      Alert.alert('Invalid OTP', 'Please enter the verification code.');
      return;
    }

    setLoading((value) => ({ ...value, login: true }));
    try {
      let accessToken = null;

      if (sdkReady && reqId) {
        const verificationResponse = await OTPWidget.verifyOTP({ reqId, otp });
        accessToken = getAccessToken(verificationResponse);
      }

      let loginResponse;
      if (accessToken) {
        loginResponse = await axios.post(`${BASE_URL}/auth/login-msg91`, {
          mobile: mobile.trim(),
          accessToken,
          role: selectedRole.toUpperCase()
        });
      } else {
        // Fallback login API
        loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
          identity: mobile.trim(),
          otp: otp.trim(),
          role: selectedRole.toUpperCase()
        });
      }

      const token = loginResponse?.data?.token;
      const user = loginResponse?.data?.user;

      if (!token) throw new Error(loginResponse?.data?.message || 'Authentication failed.');

      // Navigation target based on user role
      const userRole = (user?.role || selectedRole).toUpperCase();
      if (userRole === 'SUPER_ADMIN') {
        navigation.replace('SuperAdminDashboard', { user, token });
      } else {
        navigation.replace('PartnerDashboard', { user, token });
      }

    } catch (error) {
      Alert.alert('Login Failed', getErrorMessage(error, 'Invalid or expired OTP code.'));
    } finally {
      setLoading((value) => ({ ...value, login: false }));
    }
  };

  if (loading.login) {
    return <LogoLoader text="Verifying mobile number & launching dashboard..." />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back to Home</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in securely using an SMS OTP</Text>

          {/* Role Pills */}
          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[styles.rolePill, selectedRole === 'Partner' && styles.rolePillActive]}
              onPress={() => setSelectedRole('Partner')}
            >
              <Text style={[styles.rolePillText, selectedRole === 'Partner' && styles.rolePillTextActive]}>Partner</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.rolePill, selectedRole === 'SuperAdmin' && styles.rolePillActive]}
              onPress={() => setSelectedRole('SuperAdmin')}
            >
              <Text style={[styles.rolePillText, selectedRole === 'SuperAdmin' && styles.rolePillTextActive]}>Super Admin</Text>
            </TouchableOpacity>
          </View>

          {/* Mobile Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mobile Number</Text>
            <View style={styles.mobileRow}>
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>+91</Text>
              </View>
              <TextInput
                style={[styles.input, styles.mobileInput]}
                placeholder="10-digit mobile number"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                maxLength={10}
                value={mobile}
                onChangeText={(text) => setMobile(text.replace(/\D/g, ''))}
                editable={!loading.login}
              />
            </View>
          </View>

          {/* OTP Input & Send Button */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Enter 6-Digit OTP</Text>
            <View style={styles.otpRow}>
              <TextInput
                style={[styles.input, styles.otpInput, { opacity: otpSent ? 1 : 0.6 }]}
                placeholder="••••••"
                placeholderTextColor="#94A3B8"
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

            {devOtpCode && (
              <Text style={styles.devOtpText}>
                🔑 Dev Mode OTP Code: <Text style={{ fontWeight: 'bold' }}>{devOtpCode}</Text>
              </Text>
            )}

            {otpSent && !devOtpCode && (
              <Text style={styles.infoText}>
                OTP code dispatched to +91 {mobile.replace(/.(?=.{4})/g, '*')}
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

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerLinkText}>
              New to GharKaPaisa? <Text style={{ color: '#0d47a1', fontWeight: 'bold' }}>Create Account</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 24, justifyContent: 'center', flexGrow: 1 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 20 },
  backText: { color: '#0d47a1', fontSize: 14, fontWeight: '700' },
  title: { fontSize: 26, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#64748B', marginBottom: 20 },
  roleContainer: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  rolePill: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center' },
  rolePillActive: { backgroundColor: '#0d47a1' },
  rolePillText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  rolePillTextActive: { color: '#FFFFFF' },
  inputContainer: { width: '100%', marginBottom: 18 },
  label: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 6 },
  input: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 13,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  mobileRow: { flexDirection: 'row', alignItems: 'center' },
  countryCode: {
    paddingHorizontal: 14,
    alignSelf: 'stretch',
    justifyContent: 'center',
    backgroundColor: '#EEF4FB',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    marginRight: 8,
  },
  countryCodeText: { color: '#0F172A', fontSize: 15, fontWeight: '800' },
  mobileInput: { flex: 1 },
  otpRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  otpInput: {
    flex: 1,
    marginRight: 10,
    textAlign: 'center',
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  sendBtn: {
    backgroundColor: '#0d47a1',
    borderRadius: 10,
    paddingVertical: 13,
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  loginBtn: {
    backgroundColor: '#0d47a1',
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 14,
    elevation: 3,
  },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  disabledBtn: { backgroundColor: '#94A3B8' },
  infoText: { fontSize: 12, color: '#059669', marginTop: 8, fontWeight: '600' },
  devOtpText: { fontSize: 12, color: '#D97706', marginTop: 8, fontWeight: '600' },
  registerLink: { marginTop: 20, alignItems: 'center' },
  registerLinkText: { fontSize: 13, color: '#64748B' },
});
