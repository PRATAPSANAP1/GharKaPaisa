import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { Button } from '../../components/Button';
import apiClient from '../../services/api';

export default function VerifyEmailScreen() {
  const params = useLocalSearchParams<{ token?: string; email?: string }>();
  const [token, setToken] = useState(params.token || '');
  const [email, setEmail] = useState(params.email || '');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleVerify = async () => {
    if (!token.trim()) {
      Alert.alert('Required', 'Please enter the verification code or token.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post('/auth/verify-email', {
        token: token.trim(),
        email: email.trim() || undefined,
      });

      if (res?.data?.success || res?.status === 200) {
        setVerified(true);
      } else {
        Alert.alert('Verification Failed', res?.data?.message || 'Invalid or expired code.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  if (verified) {
    return (
      <ScrollView contentContainerStyle={styles.successContainer}>
        <View style={styles.card}>
          <View style={{ alignItems: 'center', marginBottom: spacing.md }}>
            <Icon name="check-circle" size={56} color="#10B981" />
          </View>
          <Text style={styles.successTitle}>Email Verified!</Text>
          <Text style={styles.successSub}>
            Your email has been verified. You can now access all partner services.
          </Text>

          <Button
            title="Proceed to Sign In"
            onPress={() => router.replace('/(auth)/login' as any)}
            style={{ marginTop: spacing.lg }}
          />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSubtitle}>SECURITY & COMPLIANCE</Text>
          <Text style={styles.headerTitle}>Verify Email Address</Text>
        </View>
      </View>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Enter Verification Code</Text>
        <Text style={styles.cardSubtitle}>
          Please enter the OTP or verification token sent to {email || 'your registered email'}.
        </Text>

        <Text style={styles.inputLabel}>Verification Code / Token *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter code"
          placeholderTextColor={colors.textLight}
          value={token}
          onChangeText={setToken}
        />

        <Button
          title="Verify Email"
          onPress={handleVerify}
          loading={loading}
          style={{ marginTop: spacing.md }}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing.md,
    backgroundColor: '#0B1120',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  backBtn: {
    marginRight: spacing.sm,
    padding: 4,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  card: {
    padding: spacing.lg,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 13,
    color: '#fff',
    marginBottom: spacing.xs,
  },
  successContainer: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    backgroundColor: '#0B1120',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
  },
  successSub: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 4,
    textAlign: 'center',
  },
});
