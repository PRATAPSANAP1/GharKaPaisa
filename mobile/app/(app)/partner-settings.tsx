import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { useAuth } from '../../contexts/AuthContext';

export default function PartnerSettingsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          Alert.alert('Success', 'Account deletion request submitted. Our team will contact you shortly.');
        }}
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Partner Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <Card style={styles.settingCard}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Icon name="bell" size={20} color={colors.text} />
              <Text style={styles.settingLabel}>Push Notifications</Text>
            </View>
            <Switch value={notifications} onValueChange={setNotifications} />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Icon name="mail" size={20} color={colors.text} />
              <Text style={styles.settingLabel}>Email Alerts</Text>
            </View>
            <Switch value={emailAlerts} onValueChange={setEmailAlerts} />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Icon name="message-square" size={20} color={colors.text} />
              <Text style={styles.settingLabel}>SMS Alerts</Text>
            </View>
            <Switch value={smsAlerts} onValueChange={setSmsAlerts} />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Icon name="volume-2" size={20} color={colors.text} />
              <Text style={styles.settingLabel}>Sound Effects</Text>
            </View>
            <Switch value={soundEnabled} onValueChange={setSoundEnabled} />
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Account</Text>
        <Card style={styles.settingCard}>
          <TouchableOpacity style={styles.dangerButton} onPress={handleDeleteAccount}>
            <Icon name="trash-2" size={20} color={colors.error} />
            <Text style={styles.dangerButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  content: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.md,
  },
  settingCard: {
    marginBottom: spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  settingLabel: {
    fontSize: 14,
    color: colors.text,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    gap: spacing.sm,
  },
  dangerButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.error,
  },
});
