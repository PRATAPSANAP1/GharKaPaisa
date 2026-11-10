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
import { useTheme } from '../../contexts/ThemeContext';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { Button } from '../../components/Button';
import { ThemeToggle } from '../../components/ThemeToggle';
import {
  sendOtp,
  loginWithOtp,
  loginWithPassword,
  forgotPassword,
} from '../../services/auth.service';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginScreen() {
  const { loginSession } = useAuth();
  const { colors, isDark } = useTheme();

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
      contentContainerStyle={[styles.container, { backgroundColor: colors.bg }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Brand Header */}
      <View style={styles.header}>
        <View style={[styles.logoBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.logoBadgeText}>GKP</Text>
        </View>
        <Text style={[styles.brandTitle, { color: colors.text }]}>GharKaPaisa</Text>
        <Text style={[styles.brandSubtitle, { color: colors.textMid }]}>Financial Partner & Employee Network</Text>
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
    backgroundColor: colors.bg,
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
    color: colors.text,
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 12,
    color: colors.textMid,
    marginTop: 4,
  },
  card: {
    padding: spacing.lg,
    borderRadius: 20,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: colors.bgTertiary,
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
    backgroundColor: colors.bgSecondary,
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMid,
  },
  activeModeTabText: {
    color: colors.text,
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorSoft,
    borderWidth: 1,
    borderColor: colors.error,
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: colors.error,
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
    color: colors.primary,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
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
    color: colors.textMid,
  },
  timerText: {
    fontSize: 11,
    color: colors.textMid,
    fontWeight: '600',
  },
  resendText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '700',
  },
  changeIdentityBtn: {
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingVertical: 4,
  },
  changeIdentityText: {
    fontSize: 12,
    color: colors.textMid,
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
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMid,
  },
  registerBtn: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  registerPrompt: {
    fontSize: 12,
    color: colors.textMid,
  },
  registerAction: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 2,
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 11,
    color: colors.textMid,
  },
  footerVersion: {
    fontSize: 10,
    color: colors.textLight,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  modalSub: {
    fontSize: 12,
    color: colors.textMid,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  modalInput: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    marginBottom: spacing.md,
    color: colors.text,
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
    color: colors.textMid,
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
