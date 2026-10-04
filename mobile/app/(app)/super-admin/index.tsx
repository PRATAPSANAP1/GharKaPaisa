import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { Card } from '../../../components/Card';
import { Icon } from '../../../components/Icon';
import { useAuth } from '../../../contexts/AuthContext';

export default function SuperAdminMenuScreen() {
  const { user } = useAuth();

  const menuItems = [
    {
      title: 'Dashboard',
      description: 'Overview metrics and admin management',
      icon: 'grid',
      color: '#3B82F6',
      path: '/super-admin/dashboard',
    },
    {
      title: 'Attendance',
      description: 'Employee attendance monitoring',
      icon: 'calendar',
      color: '#10B981',
      path: '/super-admin/attendance',
    },
    {
      title: 'Reports',
      description: 'System reports and analytics',
      icon: 'file-text',
      color: '#8B5CF6',
      path: '/super-admin/reports',
    },
    {
      title: 'Partners',
      description: 'Partner management and KYC',
      icon: 'users',
      color: '#F59E0B',
      path: '/super-admin/partners',
    },
    {
      title: 'Leads',
      description: 'Lead management and CRM',
      icon: 'list',
      color: '#EF4444',
      path: '/super-admin/leads',
    },
    {
      title: 'Applications',
      description: 'Application tracking',
      icon: 'check-circle',
      color: '#06B6D4',
      path: '/super-admin/applications',
    },
    {
      title: 'Commissions',
      description: 'Commission and payouts',
      icon: 'credit-card',
      color: '#10B981',
      path: '/super-admin/commissions',
    },
    {
      title: 'Banks',
      description: 'Bank management',
      icon: 'shield',
      color: '#3B82F6',
      path: '/super-admin/banks',
    },
    {
      title: 'Settings',
      description: 'System configuration',
      icon: 'settings',
      color: '#6B7280',
      path: '/super-admin/settings',
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.roleBadge}>SUPER ADMIN</Text>
        <Text style={styles.headerTitle}>Control Center</Text>
        <Text style={styles.headerSubtitle}>{user?.full_name || 'Administrator'}</Text>
      </View>

      {/* Menu Grid */}
      <View style={styles.menuGrid}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuCard}
            onPress={() => router.push(item.path as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
              <Text style={styles.menuIconText}>{item.icon}</Text>
            </View>
            <Text style={styles.menuTitle}>{item.title}</Text>
            <Text style={styles.menuDesc}>{item.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => router.replace('/(auth)/login')}
        >
          <Icon name="x-circle" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    backgroundColor: '#0F172A',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xl,
    paddingBottom: spacing.lg,
  },
  roleBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#CBD5E1',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    gap: spacing.sm,
  },
  menuCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  menuIconText: {
    fontSize: 24,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  menuDesc: {
    fontSize: 11,
    color: colors.textMid,
    lineHeight: 14,
  },
  footer: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.error,
    marginLeft: spacing.sm,
  },
});
