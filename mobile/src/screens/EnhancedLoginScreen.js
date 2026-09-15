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
  Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth } from '../context/AuthContext';
import { BASE_URL } from '../config/api';
import LogoLoader from '../components/LogoLoader';

const WIDGET_ID = process.env.EXPO_PUBLIC_MSG91_WIDGET_ID;
const TOKEN_AUTH = process.env.EXPO_PUBLIC_MSG91_TOKEN_AUTH;

export default function EnhancedLoginScreen({ navigation }) {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState('Partner');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState({ otp: false, login: false, biometric: false });
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [savedCredentials, setSavedCredentials] = useState(null);

  useEffect(() => {
    checkBiometricAvailability();
    loadSavedCredentials();
  }, []);

  useEffect(() => {
    if (timer <= 0) return undefined;
    const interval = setInterval(() => setTimer((value) => value - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const checkBiometricAvailability = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(compatible && enrolled);
    } catch (error) {
      console.error('Biometric check failed:', error);
    }
  };

  const loadSavedCredentials = async () => {
    try {
      const saved = await AsyncStorage.getItem('saved_credentials');
      if (saved) {
        setSavedCredentials(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
    }
  };

  const handleBiometricLogin = async () => {
    if (!savedCredentials) {
      Alert.alert('No Saved Credentials', 'Please login with OTP first to enable biometric login.');
      return;
    }

    setLoading({ ...loading, biometric: true });
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to login',
        fallbackLabel: 'Use Passcode',
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        // Proceed with login using saved credentials
        await performLogin(savedCredentials.mobile, savedCredentials.role, savedCredentials.token);
      }
    } catch (error) {
      Alert.alert('Authentication Failed', 'Biometric authentication failed. Please try again.');
    } finally {
      setLoading({ ...loading, biometric: false });
    }
  };

  const handleSendOtp = async () => {
    if (!validateMobile()) return;

    setLoading({ ...loading, otp: true });
    try {
      const res = await axios.post(`${BASE_URL}/auth/send-otp`, {
        identity: mobile.trim(),
        role: selectedRole.toUpperCase()
      });

      if (res?.data?.success || res?.status === 200) {
        setOtpSent(true);
        setTimer(30);
        Alert.alert('OTP Sent', 'Verification code dispatched to your mobile number.');
      }
    } catch (error) {
      Alert.alert('Could Not Send OTP', error.response?.data?.message || 'Please try again later.');
    } finally {
      setLoading({ ...loading, otp: false });
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

    setLoading({ ...loading, login: true });
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        identity: mobile.trim(),
        otp: otp.trim(),
        role: selectedRole.toUpperCase()
      });

      const token = loginResponse?.data?.token;
      const user = loginResponse?.data?.user;

      if (!token) throw new Error(loginResponse?.data?.message || 'Authentication failed.');

      // Save credentials for biometric login
      await AsyncStorage.setItem('saved_credentials', JSON.stringify({
        mobile: mobile.trim(),
        role: selectedRole,
        token: token
      }));

      const result = await login(user, token);
      if (result.success) {
        // Navigate based on role
        const userRole = (user?.role || selectedRole).toUpperCase();
        if (userRole === 'SUPER_ADMIN') {
          navigation.replace('SuperAdminDashboard');
        } else {
          navigation.replace('PartnerDashboard');
        }
      }
    } catch (error) {
      Alert.alert('Login Failed', error.response?.data?.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading({ ...loading, login: false });
    }
  };

  const performLogin = async (savedMobile, savedRole, savedToken) => {
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login-biometric`, {
        mobile: savedMobile,
        role: savedRole.toUpperCase(),
        token: savedToken
      });

      const token = loginResponse?.data?.token || savedToken;
      const user = loginResponse?.data?.user;

      const result = await login(user, token);
      if (result.success) {
        const userRole = (user?.role || savedRole).toUpperCase();
        if (userRole === 'SUPER_ADMIN') {
          navigation.replace('SuperAdminDashboard');
        } else {
          navigation.replace('PartnerDashboard');
        }
      }
    } catch (error) {
      Alert.alert('Login Failed', 'Session expired. Please login with OTP.');
    }
  };

  const validateMobile = () => {
    if (!/^[6-9]\d{9}$/.test(mobile.trim())) {
      Alert.alert('Invalid Mobile Number', 'Please enter a valid 10-digit Indian mobile number.');
      return false;
    }
    return true;
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
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <Image 
              source={require('../../assets/logo.jpeg')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.appName}>OitStack</Text>
            <Text style={styles.tagline}>Financial Services Platform</Text>
          </View>

          {/* Biometric Login Button */}
          {biometricAvailable && savedCredentials && (
            <TouchableOpacity
              style={styles.biometricBtn}
              onPress={handleBiometricLogin}
              disabled={loading.biometric}
            >
              {loading.biometric ? (
                <ActivityIndicator color="#0d47a1" size="small" />
              ) : (
                <>
                  <Text style={styles.biometricIcon}>🔐</Text>
                  <Text style={styles.biometricText}>Login with Biometrics</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in securely using SMS OTP</Text>

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
                onPress={otpSent ? handleSendOtp : handleSendOtp}
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
              New to OitStack? <Text style={{ color: '#0d47a1', fontWeight: 'bold' }}>Create Account</Text>
            </Text>
          </TouchableOpacity>

          {/* Security Notice */}
          <View style={styles.securityNotice}>
            <Text style={styles.securityIcon}>🔒</Text>
            <Text style={styles.securityText}>
              Your data is encrypted and secure. We use industry-standard security measures.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 24, justifyContent: 'center', flexGrow: 1 },
  logoSection: { alignItems: 'center', marginBottom: 30 },
  logo: { width: 80, height: 80, marginBottom: 12 },
  appName: { fontSize: 28, fontWeight: '900', color: '#0d47a1', marginBottom: 4 },
  tagline: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: '#22C55E',
    padding: 14,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  biometricIcon: { fontSize: 20 },
  biometricText: { fontSize: 14, fontWeight: '700', color: '#15803D' },
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
  registerLink: { marginTop: 20, alignItems: 'center' },
  registerLinkText: { fontSize: 13, color: '#64748B' },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    marginTop: 24,
    gap: 8,
  },
  securityIcon: { fontSize: 16 },
  securityText: { flex: 1, fontSize: 11, color: '#64748B', fontWeight: '600' },
});
