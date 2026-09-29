import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Card, Button, ErrorState } from '../../components';
import { Icon } from '../../components/Icon';
import {
  changePassword,
  fetchActiveDevices,
  revokeDeviceSession,
  logoutAllDevices,
  fetchSecurityDashboard,
} from '../../services/auth.service';
import { SecurityDeviceSession, SecurityDashboardMetrics } from '../../types';

export default function SecurityScreen() {
  const { logout } = useAuth();

  // Password State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Device & Security State
  const [devices, setDevices] = useState<SecurityDeviceSession[]>([]);
  const [metrics, setMetrics] = useState<SecurityDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    setLoading(true);
    try {
      const [devList, secDash] = await Promise.all([
        fetchActiveDevices().catch(() => []),
        fetchSecurityDashboard().catch(() => null),
      ]);
      setDevices(devList);
      setMetrics(secDash);
    } catch (err: any) {
      console.error('[SecurityScreen] Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Password Update
  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Validation Error', 'Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Validation Error', 'New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Validation Error', 'New password and confirm password do not match.');
      return;
    }

    setChangingPassword(true);
    setPasswordError(null);

    try {
      await changePassword({
        oldPassword: oldPassword ? oldPassword : undefined,
        newPassword,
      });

      Alert.alert('Success', 'Password updated successfully. Other device sessions have been invalidated.');
      // Clear sensitive inputs
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      loadSecurityData();
    } catch (err: any) {
      let msg = 'Failed to change password.';
      if (err.response?.status === 429) {
        msg = 'Too many requests. Please wait a moment and try again.';
      } else if (err.message) {
        msg = err.message;
      }
      setPasswordError(msg);
      // Clear passwords on error
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } finally {
      setChangingPassword(false);
    }
  };

  // Revoke Specific Session
  const handleRevokeDevice = async (id: string) => {
    Alert.alert('Revoke Session', 'Are you sure you want to log out this device?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Revoke',
        style: 'destructive',
        onPress: async () => {
          setRevokingId(id);
          try {
            await revokeDeviceSession(id);
            setDevices((prev) => prev.filter((d) => d.id !== id));
            Alert.alert('Success', 'Device session revoked.');
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to revoke session.');
          } finally {
            setRevokingId(null);
          }
        },
      },
    ]);
  };

  // Revoke All Other Devices
  const handleLogoutAllOther = async () => {
    Alert.alert('Logout All Devices', 'This will log out all other active sessions except this current device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout All',
        style: 'destructive',
        onPress: async () => {
          setRevokingAll(true);
          try {
            await logoutAllDevices();
            Alert.alert('Success', 'Logged out from all other devices.');
            loadSecurityData();
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to logout other devices.');
          } finally {
            setRevokingAll(false);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Security Overview Metrics */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Security Overview</Text>

        <View style={styles.metricRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricVal}>{metrics?.activeDevices ?? devices.length}</Text>
            <Text style={styles.metricLabel}>Active Sessions</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricVal}>
              {metrics?.passwordChangedAt
                ? new Date(metrics.passwordChangedAt).toLocaleDateString()
                : 'Not Changed'}
            </Text>
            <Text style={styles.metricLabel}>Last Password Change</Text>
          </View>
        </View>
      </Card>

      {/* Change Password Card */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Change Password</Text>

        <Text style={styles.inputLabel}>Current Password</Text>
        <TextInput
          style={styles.textInput}
          secureTextEntry
          placeholder="Enter current password..."
          placeholderTextColor={colors.textLight}
          value={oldPassword}
          onChangeText={setOldPassword}
        />

        <Text style={styles.inputLabel}>New Password</Text>
        <TextInput
          style={styles.textInput}
          secureTextEntry
          placeholder="Enter new password..."
          placeholderTextColor={colors.textLight}
          value={newPassword}
          onChangeText={setNewPassword}
        />

        <Text style={styles.inputLabel}>Confirm New Password</Text>
        <TextInput
          style={styles.textInput}
          secureTextEntry
          placeholder="Re-enter new password..."
          placeholderTextColor={colors.textLight}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        {passwordError && <ErrorState message={passwordError} onRetry={handleChangePassword} />}

        <View style={{ marginTop: spacing.xs }}>
          <Button
            title={changingPassword ? 'Updating...' : 'Update Password'}
            onPress={handleChangePassword}
            loading={changingPassword}
            disabled={changingPassword}
          />
        </View>
      </Card>

      {/* Active Device Sessions Card */}
      <Card style={styles.card}>
        <View style={styles.headerBetween}>
          <Text style={styles.sectionTitle}>Active Sessions & Devices</Text>
          {devices.length > 1 && (
            <TouchableOpacity onPress={handleLogoutAllOther} disabled={revokingAll}>
              <Text style={styles.logoutAllText}>{revokingAll ? 'Logging out...' : 'Sign Out All Other'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
        ) : devices.length === 0 ? (
          <Text style={styles.emptyText}>No active device sessions found.</Text>
        ) : (
          devices.map((item) => (
            <View key={item.id} style={styles.deviceRow}>
              <View style={styles.deviceIconCol}>
                <Icon name="device" size={20} color={item.is_current ? colors.primary : colors.textLight} />
              </View>

              <View style={styles.deviceInfoCol}>
                <View style={styles.deviceNameRow}>
                  <Text style={styles.deviceName}>{item.device_name || item.browser || 'Unknown Device'}</Text>
                  {item.is_current && (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>This Device</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.deviceSub}>
                  IP: {item.ip_address || 'N/A'} • {item.city ? `${item.city}, ${item.country}` : 'Location Unknown'}
                </Text>
                {item.last_used_at && (
                  <Text style={styles.deviceDate}>
                    Last Active: {new Date(item.last_used_at).toLocaleString()}
                  </Text>
                )}
              </View>

              {!item.is_current && (
                <TouchableOpacity
                  style={styles.revokeBtn}
                  onPress={() => handleRevokeDevice(item.id)}
                  disabled={revokingId === item.id}
                >
                  {revokingId === item.id ? (
                    <ActivityIndicator size="small" color={colors.danger} />
                  ) : (
                    <Text style={styles.revokeBtnText}>Revoke</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.md,
    paddingTop: spacing.md,
  },
  card: {
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  headerBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  logoutAllText: {
    fontSize: typography.sizes.xs,
    color: colors.danger,
    fontWeight: typography.weights.semibold,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.xs,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricVal: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  metricLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    marginTop: 2,
  },
  inputLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textMid,
    marginBottom: 4,
  },
  textInput: {
    height: 44,
    backgroundColor: colors.inputBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    fontSize: typography.sizes.sm,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  deviceIconCol: {
    marginRight: spacing.sm,
  },
  deviceInfoCol: {
    flex: 1,
  },
  deviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  deviceName: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  currentBadge: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  currentBadgeText: {
    fontSize: 9,
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  deviceSub: {
    fontSize: 10,
    color: colors.textLight,
    marginTop: 2,
  },
  deviceDate: {
    fontSize: 9,
    color: colors.textMid,
    marginTop: 1,
  },
  revokeBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.danger + '40',
  },
  revokeBtnText: {
    fontSize: 11,
    color: colors.danger,
    fontWeight: typography.weights.semibold,
  },
});
