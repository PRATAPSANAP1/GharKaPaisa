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
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { Button } from '../../components/Button';
import {
  sendOtp,
  loginWithOtp,
  loginWithPassword,
  forgotPassword,
} from '../../services/auth.service';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginScreen() {
  const { loginSession } = useAuth();

  // Login Mode: 'password' | 'otp'
  const [loginMode, setLoginMode] = useState<'password' | 'otp'>('password');

  // Form Fields
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [maskedIdentity, setMaskedIdentity] = useState('');
  const [timer, setTimer] = useState(0);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Forgot Password Modal State
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  // Countdown timer for OTP
  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Route resolver based on role
  const resolveRoleRedirect = (user: any) => {
    const role = (user?.role || '').toUpperCase();
    if (role === 'SUPER_ADMIN') {
      router.replace('/(app)/super-admin/dashboard');
    } else if (role === 'PARTNER' || role === 'TEAM_MEMBER') {
      router.replace('/(app)/partner-dashboard');
    } else {
      router.replace('/(app)/dashboard');
    }
  };

  // Handle Password Login
  const handlePasswordLogin = async () => {
    if (!identity.trim()) {
      setErrorMsg('Please enter your email or mobile number');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Please enter your password');
      return;
    }

    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await loginWithPassword(identity.trim(), password.trim());
      if (res?.success && res?.token && res?.user) {
        await loginSession(res.user, res.token, res.refreshToken);
        resolveRoleRedirect(res.user);
      } else {
        setErrorMsg(res?.message || 'Invalid credentials');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Send OTP
  const handleSendOtp = async () => {
    if (!identity.trim()) {
      setErrorMsg('Please enter your email or mobile number to receive OTP');
      return;
    }

    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await sendOtp(identity.trim());
      if (res?.success) {
        setMaskedIdentity(res.identity || identity);
        setOtpSent(true);
        setTimer(60);
      } else {
        setErrorMsg(res?.message || 'Failed to send OTP');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Verify OTP Login
  const handleOtpLogin = async () => {
    if (!otp.trim() || otp.trim().length < 6) {
      setErrorMsg('Please enter the 6-digit verification code');
      return;
    }

    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await loginWithOtp(identity.trim(), otp.trim());
      if (res?.success && res?.token && res?.user) {
        await loginSession(res.user, res.token, res.refreshToken);
        resolveRoleRedirect(res.user);
      } else {
        setErrorMsg(res?.message || 'Invalid or expired OTP');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password Request
  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) {
      Alert.alert('Required', 'Please enter your registered email address');
      return;
    }
    setForgotLoading(true);
    try {
      await forgotPassword(forgotEmail.trim());
      setForgotModalVisible(false);
      setForgotEmail('');
      Alert.alert('Reset Link Sent', 'Password reset instructions have been sent to your email.');
    } catch (err: any) {
      Alert.alert('Failed', err.message || 'Could not send reset email. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Brand Header */}
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoBadgeText}>GKP</Text>
        </View>
        <Text style={styles.brandTitle}>GharKaPaisa</Text>
        <Text style={styles.brandSubtitle}>Financial Partner & Employee Network</Text>
      </View>

      {/* Main Login Card */}
      <Card style={styles.card}>
        {/* Method Switcher Tabs */}
        <View style={styles.modeTabs}>
          <TouchableOpacity
            style={[styles.modeTab, loginMode === 'password' && styles.activeModeTab]}
            onPress={() => {
              setLoginMode('password');
              setErrorMsg(null);
            }}
          >
            <Icon
              name="lock"
              size={14}
              color={loginMode === 'password' ? colors.primary : colors.textLight}
            />
            <Text
              style={[styles.modeTabText, loginMode === 'password' && styles.activeModeTabText]}
            >
              Password
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, loginMode === 'otp' && styles.activeModeTab]}
            onPress={() => {
              setLoginMode('otp');
              setErrorMsg(null);
            }}
          >
            <Icon
              name="smartphone"
              size={14}
              color={loginMode === 'otp' ? colors.primary : colors.textLight}
            />
            <Text style={[styles.modeTabText, loginMode === 'otp' && styles.activeModeTabText]}>
              Instant OTP
            </Text>
          </TouchableOpacity>
        </View>

        {/* Error Alert Box */}
        {errorMsg && (
          <View style={styles.errorBox}>
            <Icon name="alert-circle" size={16} color="#EF4444" />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {/* Form Inputs */}
        <View style={styles.formContainer}>
          <Text style={styles.inputLabel}>Registered Email or Mobile</Text>
          <View style={styles.inputWrap}>
            <Icon name="mail" size={18} color={colors.textLight} />
            <TextInput
              style={styles.textInput}
              placeholder="e.g. partner@gharkapaisa.in or 9876543210"
              placeholderTextColor={colors.textLight}
              value={identity}
              onChangeText={(text) => {
                setIdentity(text);
                setErrorMsg(null);
                setOtpSent(false);
              }}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* Password Mode Fields */}
          {loginMode === 'password' ? (
            <>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>Password</Text>
                <TouchableOpacity
                  onPress={() => {
                    setForgotEmail(identity.includes('@') ? identity : '');
                    setForgotModalVisible(true);
                  }}
                >
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputWrap}>
                <Icon name="lock" size={18} color={colors.textLight} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your account password"
                  placeholderTextColor={colors.textLight}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setErrorMsg(null);
                  }}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Icon
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={18}
                    color={colors.textLight}
                  />
                </TouchableOpacity>
              </View>

              <Button
                title="Sign In"
                onPress={handlePasswordLogin}
                loading={loading}
                style={{ marginTop: spacing.md }}
              />
            </>
          ) : (
            /* OTP Mode Fields */
            <>
              {!otpSent ? (
                <Button
                  title="Send Verification Code"
                  onPress={handleSendOtp}
                  loading={loading}
                  style={{ marginTop: spacing.md }}
                />
              ) : (
                <>
                  <Text style={[styles.inputLabel, { marginTop: spacing.md }]}>
                    6-Digit OTP Code
                  </Text>
                  <View style={styles.inputWrap}>
                    <Icon name="shield" size={18} color={colors.textLight} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="123456"
                      placeholderTextColor={colors.textLight}
                      value={otp}
                      onChangeText={(text) => {
                        setOtp(text);
                        setErrorMsg(null);
                      }}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>

                  <View style={styles.otpInfoRow}>
                    <Text style={styles.otpSentTo}>
                      Sent to: <Text style={{ color: colors.text }}>{maskedIdentity}</Text>
                    </Text>
                    {timer > 0 ? (
                      <Text style={styles.timerText}>Resend in {timer}s</Text>
                    ) : (
                      <TouchableOpacity onPress={handleSendOtp} disabled={loading}>
                        <Text style={styles.resendText}>Resend OTP</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <Button
                    title="Verify & Sign In"
                    onPress={handleOtpLogin}
                    loading={loading}
                    style={{ marginTop: spacing.md }}
                  />

                  <TouchableOpacity
                    style={styles.changeIdentityBtn}
                    onPress={() => setOtpSent(false)}
                  >
                    <Text style={styles.changeIdentityText}>Change Email / Mobile</Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}
        </View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Register CTA */}
        <TouchableOpacity
          style={styles.registerBtn}
          onPress={() => router.push('/(auth)/register' as any)}
        >
          <Text style={styles.registerPrompt}>Don't have an account?</Text>
          <Text style={styles.registerAction}>Register as Partner</Text>
        </TouchableOpacity>
      </Card>

      {/* Footer Info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Secure 256-Bit SSL Encrypted Authentication</Text>
        <Text style={styles.footerVersion}>GharKaPaisa v2.4.0</Text>
      </View>

      {/* Forgot Password Modal */}
      <Modal visible={forgotModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reset Password</Text>
            <Text style={styles.modalSub}>
              Enter your registered email address and we'll send a password reset link.
            </Text>

            <Text style={styles.inputLabel}>Registered Email</Text>
            <TextInput
              style={styles.modalInput}
              value={forgotEmail}
              onChangeText={setForgotEmail}
              placeholder="e.g. partner@gharkapaisa.in"
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setForgotModalVisible(false)}
                disabled={forgotLoading}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleForgotPassword}
                disabled={forgotLoading}
              >
                {forgotLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmText}>Send Reset Link</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    backgroundColor: '#0B1120',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoBadgeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  card: {
    padding: spacing.lg,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 4,
    marginBottom: spacing.md,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  activeModeTab: {
    backgroundColor: '#1E293B',
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
  },
  activeModeTabText: {
    color: '#fff',
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#EF4444',
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  formContainer: {
    gap: spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  forgotText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primaryLight,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: '#fff',
    padding: 0,
  },
  eyeBtn: {
    padding: 4,
  },
  otpInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  otpSentTo: {
    fontSize: 11,
    color: colors.textLight,
  },
  timerText: {
    fontSize: 11,
    color: colors.textLight,
    fontWeight: '600',
  },
  resendText: {
    fontSize: 11,
    color: colors.primaryLight,
    fontWeight: '700',
  },
  changeIdentityBtn: {
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingVertical: 4,
  },
  changeIdentityText: {
    fontSize: 12,
    color: colors.textLight,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
    gap: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#334155',
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textLight,
  },
  registerBtn: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  registerPrompt: {
    fontSize: 12,
    color: colors.textLight,
  },
  registerAction: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryLight,
    marginTop: 2,
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 11,
    color: colors.textLight,
  },
  footerVersion: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  modalSub: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  modalInput: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    marginBottom: spacing.md,
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textLight,
  },
  modalConfirmBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  modalConfirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
});
