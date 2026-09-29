import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

export default function SettingsScreen() {
  const [pushNotifs, setPushNotifs] = useState(true);
  const [messengerNotifs, setMessengerNotifs] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(false);

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
                onValueChange={setPushNotifs}
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
                onValueChange={setMessengerNotifs}
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
                onValueChange={setSoundEnabled}
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
                <Text style={styles.rowSub}>Mask sensitive customer contact info</Text>
              </View>
              <Switch
                value={privacyMode}
                onValueChange={setPrivacyMode}
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
    backgroundColor: colors.background
  },
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    padding: spacing.md
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
