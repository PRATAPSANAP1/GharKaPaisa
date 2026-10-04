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
import { resetPassword } from '../../services/auth.service';

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const [token, setToken] = useState(params.token || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!token.trim()) {
      Alert.alert('Required', 'Please enter your reset token received in email.');
      return;
    }
    if (!password || password.length < 6) {
      Alert.alert('Required', 'Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token.trim(), password);
      Alert.alert('Success', 'Your password has been reset successfully. Please log in with your new password.', [
        {
          text: 'Go to Login',
          onPress: () => router.replace('/(auth)/login' as any),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to reset password. Please verify your token.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSubtitle}>ACCOUNT RECOVERY</Text>
          <Text style={styles.headerTitle}>Reset Password</Text>
        </View>
      </View>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Set New Password</Text>
        <Text style={styles.cardSubtitle}>
          Enter the reset code sent to your email and choose a secure new password.
        </Text>

        <Text style={styles.inputLabel}>Reset Token / Code *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Paste token from email"
          placeholderTextColor={colors.textLight}
          value={token}
          onChangeText={setToken}
        />

        <Text style={[styles.inputLabel, { marginTop: spacing.sm }]}>New Password *</Text>
        <View style={styles.passwordWrap}>
          <TextInput
            style={[styles.textInput, { flex: 1, borderWidth: 0, marginBottom: 0 }]}
            placeholder="Min. 6 characters"
            placeholderTextColor={colors.textLight}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 8 }}>
            <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} color={colors.textLight} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.inputLabel, { marginTop: spacing.sm }]}>Confirm New Password *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Re-enter new password"
          placeholderTextColor={colors.textLight}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showPassword}
        />

        <Button
          title="Update Password"
          onPress={handleReset}
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
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingRight: 4,
    marginBottom: spacing.xs,
  },
});
