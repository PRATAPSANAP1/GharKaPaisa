import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { sendOtp, loginWithOtp } from '../../services/auth.service';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginScreen() {
  const { loginSession } = useAuth();
  const [identity, setIdentity] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [loading, setLoading] = useState(false);
  const [maskedIdentity, setMaskedIdentity] = useState('');

  const handleSendOtp = async () => {
    if (!identity.trim()) {
      return Alert.alert('Error', 'Please enter your registered email or mobile number');
    }
    setLoading(true);
    try {
      const res = await sendOtp(identity.trim());
      if (res?.success) {
        setMaskedIdentity(res.identity || identity);
        setStep('verify');
        Alert.alert('OTP Sent', res.message || 'Check your SMS / Email for OTP');
      } else {
        Alert.alert('Error', res?.message || 'Failed to send OTP');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Network error sending OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      return Alert.alert('Error', 'Please enter the 6-digit OTP code');
    }
    setLoading(true);
    try {
      const res = await loginWithOtp(identity.trim(), otp.trim());
      if (res?.success && res?.token && res?.user) {
        await loginSession(res.user, res.token, res.refreshToken);
        router.replace('/(app)/dashboard');
      } else {
        Alert.alert('Error', res?.message || 'Invalid OTP code');
      }
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.brandTitle}>GharKaPaisa</Text>
        <Text style={styles.brandSubtitle}>Mobile Partner & Operational Control Center</Text>
      </View>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>
          {step === 'request' ? 'Sign In with OTP' : 'Enter Verification Code'}
        </Text>
        <Text style={styles.cardSubtitle}>
          {step === 'request'
            ? 'Enter your registered email or 10-digit mobile number'
            : `Enter the code sent to ${maskedIdentity}`}
        </Text>

        {step === 'request' ? (
          <>
            <Input
              label="Email / Mobile"
              placeholder="e.g. partner@example.com or 9876543210"
              value={identity}
              onChangeText={setIdentity}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Button
              title="Get OTP Code"
              onPress={handleSendOtp}
              loading={loading}
              style={{ marginTop: spacing.sm }}
            />
          </>
        ) : (
          <>
            <Input
              label="6-Digit OTP"
              placeholder="123456"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
            />
            <Button
              title="Verify & Sign In"
              onPress={handleVerifyOtp}
              loading={loading}
              style={{ marginTop: spacing.sm }}
            />
            <Button
              title="Change Mobile / Email"
              onPress={() => setStep('request')}
              variant="outline"
              style={{ marginTop: spacing.sm }}
            />
          </>
        )}
      </Card>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Authorized Client of GharKaPaisa Platform</Text>
      </View>
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
  brandTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.extrabold,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textMid,
    marginTop: spacing.xs,
  },
  card: {
    padding: spacing.lg,
  },
  cardTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textLight,
    marginBottom: spacing.md,
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
  },
});
