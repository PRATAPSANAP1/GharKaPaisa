import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { NotificationPreference } from '../../types';
import notificationService from '../../services/notification.service';
import { fetchSystemSettings, updateSystemSetting } from '../../services/super-admin.service';
import { useAuth } from '../../contexts/AuthContext';

export default function SettingsScreen() {
  const { isSuperAdmin } = useAuth();

  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState<NotificationPreference | null>(null);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [messengerNotifs, setMessengerNotifs] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [prefsRes, sysRes] = await Promise.allSettled([
      notificationService.fetchNotificationPreferences(),
      fetchSystemSettings(),
    ]);

    if (prefsRes.status === 'fulfilled') {
      const p = prefsRes.value;
      setPrefs(p);
      setPushNotifs(p.app_enabled !== false);
      setMessengerNotifs(p.messenger_enabled !== false);
      setSoundEnabled(p.sound_enabled !== false);
    }

    if (sysRes.status === 'fulfilled') {
      setPrivacyMode(String(sysRes.value?.admin_privacy_mode || 'off').toLowerCase() === 'on');
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const persistPrefs = async (patch: Partial<NotificationPreference>) => {
    const base: NotificationPreference = prefs || {
      email_enabled: true,
      sms_enabled: true,
      app_enabled: true,
    };
    const merged = { ...base, ...patch };
    setPrefs(merged);
    try {
      const saved = await notificationService.updateNotificationPreferences(merged);
      setPrefs(saved);
    } catch (err: any) {
      Alert.alert('Save Failed', err?.message || 'Could not save your preference.');
      loadData();
    }
  };

  const handlePushToggle = (value: boolean) => {
    setPushNotifs(value);
    persistPrefs({ app_enabled: value });
  };

  const handleMessengerToggle = (value: boolean) => {
    setMessengerNotifs(value);
    persistPrefs({ messenger_enabled: value });
  };

  const handleSoundToggle = (value: boolean) => {
    setSoundEnabled(value);
    persistPrefs({ sound_enabled: value });
  };

  const handlePrivacyToggle = async (value: boolean) => {
    if (!isSuperAdmin) return;
    setPrivacyMode(value);
    try {
      await updateSystemSetting('admin_privacy_mode', value ? 'on' : 'off');
    } catch (err: any) {
      setPrivacyMode(!value);
      Alert.alert('Update Failed', err?.message || 'Could not update privacy masking.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerBox}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>App Settings</Text>
          <Text style={styles.subtitle}>Preferences & notifications control</Text>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowTextGroup}>
                <Text style={styles.rowTitle}>Push Notifications</Text>
                <Text style={styles.rowSub}>Receive real-time system alerts</Text>
              </View>
              <Switch
                value={pushNotifs}
                onValueChange={handlePushToggle}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>

            <View style={[styles.row, styles.borderTop]}>
              <View style={styles.rowTextGroup}>
                <Text style={styles.rowTitle}>Messenger Alerts</Text>
                <Text style={styles.rowSub}>Notify on incoming chat messages</Text>
              </View>
              <Switch
                value={messengerNotifs}
                onValueChange={handleMessengerToggle}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>

            <View style={[styles.row, styles.borderTop]}>
              <View style={styles.rowTextGroup}>
                <Text style={styles.rowTitle}>Sound Effects</Text>
                <Text style={styles.rowSub}>Play sound on new notifications</Text>
              </View>
              <Switch
                value={soundEnabled}
                onValueChange={handleSoundToggle}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
          </View>
        </View>

        {/* Privacy & Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Preferences</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowTextGroup}>
                <Text style={styles.rowTitle}>Admin Privacy Masking</Text>
                <Text style={styles.rowSub}>
                  {isSuperAdmin
                    ? 'Mask sensitive customer contact info'
                    : 'Managed centrally by the Super Admin'}
                </Text>
              </View>
              <Switch
                value={privacyMode}
                onValueChange={handlePrivacyToggle}
                disabled={!isSuperAdmin}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
          </View>
        </View>

        {/* App Version Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>GharKaPaisa Mobile</Text>
          <Text style={styles.infoText}>Version 2.4.0 • Enterprise Workspace</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg
  },
  container: {
    flex: 1,
    backgroundColor: colors.bg
  },
  content: {
    padding: spacing.md
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: typography.sizes.sm,
    color: colors.textLight
  },
  header: {
    marginBottom: spacing.md
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text
  },
  subtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    marginTop: 2
  },
  section: {
    marginBottom: spacing.md
  },
  sectionTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginLeft: 4
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  rowTextGroup: {
    flex: 1,
    paddingRight: spacing.md
  },
  rowTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text
  },
  rowSub: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2
  },
  infoBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    marginTop: spacing.md
  },
  infoTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text
  },
  infoText: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2
  }
});
