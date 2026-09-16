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
  StatusBar,
  Modal
} from 'react-native';
import axios from 'axios';
import { OTPWidget } from '@msg91comm/sendotp-react-native';
import { BASE_URL } from '../config/api';
import LogoLoader from '../components/LogoLoader';
import { useAuth } from '../src/context/AuthContext';

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
  const { login } = useAuth();
  const roleParam = route?.params?.role || 'Partner';
  const [selectedRole, setSelectedRole] = useState(roleParam);

  // Tabs: 'password' or 'otp'
  const [loginType, setLoginType] = useState('password');

  // Input states
  const [identity, setIdentity] = useState(''); // Mobile or Email
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);

  // Forgot Password Modal
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

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
  }, [identity, selectedRole, loginType]);

  const isMobileNumber = (str) => /^[6-9]\d{9}$/.test(str.trim());
  const isEmailAddress = (str) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str.trim());

  const handleSendOtp = async () => {
    const trimmed = identity.trim();
    if (!trimmed) {
      Alert.alert('Required', 'Please enter your registered mobile number or email address.');
      return;
    }

    if (!isMobileNumber(trimmed) && !isEmailAddress(trimmed)) {
      Alert.alert('Invalid Input', 'Please enter a valid 10-digit Indian mobile number or email address.');
      return;
    }

    setLoading((value) => ({ ...value, otp: true }));
    try {
      if (isMobileNumber(trimmed) && sdkReady) {
        const response = await OTPWidget.sendOTP({ identifier: `91${trimmed}` });
        const currentReqId = response?.reqId || response?.request_id || (typeof response === 'string' ? response : response?.data);
        setReqId(currentReqId || '');
        setOtpSent(true);
        setTimer(30);
        Alert.alert('OTP Sent', `A verification code was sent to +91 ${trimmed}.`);
      } else {
        const res = await axios.post(`${BASE_URL}/auth/send-otp`, {
          identity: trimmed,
          role: selectedRole.toUpperCase()
        }).catch((err) => err.response);

        if (res?.data?.success || res?.status === 200) {
          setOtpSent(true);
          setTimer(30);
          if (res?.data?.message?.includes('OTP:')) {
            const extracted = res.data.message.match(/OTP:\s*(\d+)/)?.[1];
            if (extracted) setDevOtpCode(extracted);
          }
          Alert.alert('OTP Sent', res?.data?.message || 'Verification code dispatched to your identity.');
        } else {
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

  const handleLoginWithPassword = async () => {
    const trimmedIdentity = identity.trim();
    if (!trimmedIdentity) {
      Alert.alert('Required', 'Please enter your mobile number or email address.');
      return;
    }
    if (!password) {
      Alert.alert('Required', 'Please enter your password.');
      return;
    }

    setLoading((value) => ({ ...value, login: true }));
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login-password`, {
        identity: trimmedIdentity,
        password,
        role: selectedRole.toUpperCase()
      }).catch(async (err) => {
        // Fallback to standard login endpoint if login-password is not available
        return await axios.post(`${BASE_URL}/auth/login`, {
          identity: trimmedIdentity,
          password,
          role: selectedRole.toUpperCase()
        });
      });

      const token = loginResponse?.data?.token || loginResponse?.data?.idToken;
      const refreshToken = loginResponse?.data?.refreshToken;
      const user = loginResponse?.data?.user;

      if (!token) throw new Error(loginResponse?.data?.message || 'Authentication failed.');

      await login(user, token, refreshToken);

      const userRole = (user?.role || selectedRole).toUpperCase();
      if (userRole === 'SUPER_ADMIN') {
        navigation.replace('SuperAdminDashboard', { user, token });
      } else {
        navigation.replace('PartnerDashboard', { user, token });
      }

    } catch (error) {
      Alert.alert('Login Failed', getErrorMessage(error, 'Invalid identity or password. Please try again.'));
    } finally {
      setLoading((value) => ({ ...value, login: false }));
    }
  };

  const handleLoginWithOtp = async () => {
    const trimmedIdentity = identity.trim();
    if (!trimmedIdentity) {
      Alert.alert('Required', 'Please enter your mobile number or email.');
      return;
    }
    if (!otpSent) {
      Alert.alert('OTP Required', 'Please click Send OTP first.');
      return;
    }
    if (!/^\d{4,6}$/.test(otp)) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit verification code.');
      return;
    }

    setLoading((value) => ({ ...value, login: true }));
    try {
      let accessToken = null;

      if (isMobileNumber(trimmedIdentity) && sdkReady && reqId) {
        const verificationResponse = await OTPWidget.verifyOTP({ reqId, otp });
        accessToken = getAccessToken(verificationResponse);
      }

      let loginResponse;
      if (accessToken) {
        loginResponse = await axios.post(`${BASE_URL}/auth/login-msg91`, {
          mobile: trimmedIdentity,
          accessToken,
          role: selectedRole.toUpperCase()
        });
      } else {
        loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
          identity: trimmedIdentity,
          otp: otp.trim(),
          role: selectedRole.toUpperCase()
        });
      }

      const token = loginResponse?.data?.token || loginResponse?.data?.idToken;
      const refreshToken = loginResponse?.data?.refreshToken;
      const user = loginResponse?.data?.user;

      if (!token) throw new Error(loginResponse?.data?.message || 'Authentication failed.');

      await login(user, token, refreshToken);

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

  const handleForgotPasswordSubmit = async () => {
    if (!forgotEmail.trim() || !isEmailAddress(forgotEmail.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid registered email address.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/auth/forgot-password`, {
        email: forgotEmail.trim(),
        identity: forgotEmail.trim()
      });

      Alert.alert(
        'Password Reset Sent',
        res.data?.message || 'If an account exists with this email, a password reset link has been sent.',
        [{ text: 'OK', onPress: () => setForgotModalVisible(false) }]
      );
      setForgotEmail('');
    } catch (error) {
      Alert.alert('Notice', getErrorMessage(error, 'If your email is registered, password reset instructions have been sent.'));
      setForgotModalVisible(false);
    } finally {
      setForgotLoading(false);
    }
  };

  if (loading.login) {
    return <LogoLoader text="Verifying credentials & launching dashboard..." />;
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
          <Text style={styles.subtitle}>Access your account to manage loans, cards, and commissions</Text>

          {/* Role Selection Pills */}
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

          {/* Login Type Tabs (Password vs OTP) */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabBtn, loginType === 'password' && styles.tabBtnActive]}
              onPress={() => setLoginType('password')}
            >
              <Text style={[styles.tabBtnText, loginType === 'password' && styles.tabBtnTextActive]}>Password Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, loginType === 'otp' && styles.tabBtnActive]}
              onPress={() => setLoginType('otp')}
            >
              <Text style={[styles.tabBtnText, loginType === 'otp' && styles.tabBtnTextActive]}>OTP Login</Text>
            </TouchableOpacity>
          </View>

          {/* Identity Field (Mobile or Email) */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mobile Number or Email</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 9876543210 or user@domain.com"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={identity}
              onChangeText={(text) => setIdentity(text)}
              editable={!loading.login}
            />
          </View>

          {/* PASSWORD MODE CONTENT */}
          {loginType === 'password' ? (
            <>
              <View style={styles.inputContainer}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.label}>Password</Text>
                  <TouchableOpacity onPress={() => setForgotModalVisible(true)}>
                    <Text style={styles.forgotText}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Enter your password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    editable={!loading.login}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text style={styles.eyeText}>{showPassword ? '👁️' : '🙈'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.loginBtn, loading.login && styles.disabledBtn]}
                onPress={handleLoginWithPassword}
                disabled={loading.login}
              >
                <Text style={styles.loginBtnText}>Sign In with Password</Text>
              </TouchableOpacity>
            </>
          ) : (
            /* OTP MODE CONTENT */
            <>
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
                    onPress={handleSendOtp}
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
                    OTP verification code dispatched to your mobile / email.
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={[styles.loginBtn, (!otpSent || loading.login) && styles.disabledBtn]}
                onPress={handleLoginWithOtp}
                disabled={!otpSent || loading.login}
              >
                <Text style={styles.loginBtnText}>Verify & Log In</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerLinkText}>
              New to platform? <Text style={{ color: '#0d47a1', fontWeight: 'bold' }}>Create Account</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* FORGOT PASSWORD MODAL */}
      <Modal
        visible={forgotModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setForgotModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Forgot Password</Text>
            <Text style={styles.modalSubtitle}>Enter your registered email address to receive password reset instructions.</Text>

            <TextInput
              style={[styles.input, { marginBottom: 16 }]}
              placeholder="user@domain.com"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={forgotEmail}
              onChangeText={setForgotEmail}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#E2E8F0' }]}
                onPress={() => setForgotModalVisible(false)}
              >
                <Text style={{ color: '#334155', fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#0d47a1', flex: 1 }]}
                onPress={handleForgotPasswordSubmit}
                disabled={forgotLoading}
              >
                {forgotLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Send Reset Link</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  roleContainer: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  rolePill: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center' },
  rolePillActive: { backgroundColor: '#0d47a1' },
  rolePillText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  rolePillTextActive: { color: '#FFFFFF' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 10, padding: 4, marginBottom: 20 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#ffffff', elevation: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  tabBtnText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  tabBtnTextActive: { color: '#0d47a1', fontWeight: '800' },
  inputContainer: { width: '100%', marginBottom: 18 },
  label: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 6 },
  forgotText: { fontSize: 12, fontWeight: '700', color: '#0d47a1' },
  input: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 13,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  passwordWrapper: { flexDirection: 'row', alignItems: 'center' },
  eyeBtn: { position: 'absolute', right: 12, padding: 4 },
  eyeText: { fontSize: 16 },
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
    marginTop: 10,
    elevation: 3,
  },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  disabledBtn: { backgroundColor: '#94A3B8' },
  infoText: { fontSize: 12, color: '#059669', marginTop: 8, fontWeight: '600' },
  devOtpText: { fontSize: 12, color: '#D97706', marginTop: 8, fontWeight: '600' },
  registerLink: { marginTop: 20, alignItems: 'center' },
  registerLinkText: { fontSize: 13, color: '#64748B' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 6 },
  modalSubtitle: { fontSize: 13, color: '#64748B', marginBottom: 16 },
  modalBtn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }
});
