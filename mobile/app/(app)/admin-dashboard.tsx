import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import apiClient from '../../services/api';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface AdminStats {
  total_partners: number;
  active_partners: number;
  pending_kyc: number;
  pending_withdrawals: number;
  total_applications: number;
  approved_applications: number;
  pending_approvals: number;
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/reports/overview');
      const data = response.data?.data;
      setStats(
        data
          ? {
              total_partners: Number(data.Partners?.total || 0),
              active_partners: Number(data.Partners?.active || 0),
              pending_kyc: Number(data.Partners?.pending_kyc || 0),
              pending_withdrawals: Number(data.withdrawal?.pending_withdrawals || 0),
              total_applications: Number(data.applications?.total || 0),
              approved_applications: Number(data.applications?.approved || 0),
              pending_approvals: Number(data.applications?.pending || 0),
            }
          : null
      );
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading admin dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Overview of admin operations</Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.total_partners || 0}</Text>
          <Text style={styles.statLabel}>Total Partners</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.active_partners || 0}</Text>
          <Text style={styles.statLabel}>Active Partners</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats?.pending_kyc || 0}</Text>
          <Text style={styles.statLabel}>Pending KYC</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#EF4444' }]}>{stats?.pending_withdrawals || 0}</Text>
          <Text style={styles.statLabel}>Pending Withdrawals</Text>
        </View>
      </View>

      {/* Applications Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Applications Overview</Text>
        <View style={styles.sectionStats}>
          <View style={styles.sectionStatItem}>
            <Text style={styles.sectionStatValue}>{stats?.total_applications || 0}</Text>
            <Text style={styles.sectionStatLabel}>Total Applications</Text>
          </View>
          <View style={styles.sectionStatItem}>
            <Text style={[styles.sectionStatValue, { color: '#10B981' }]}>{stats?.approved_applications || 0}</Text>
            <Text style={styles.sectionStatLabel}>Approved</Text>
          </View>
          <View style={styles.sectionStatItem}>
            <Text style={[styles.sectionStatValue, { color: '#F59E0B' }]}>{stats?.pending_approvals || 0}</Text>
            <Text style={styles.sectionStatLabel}>Pending Approval</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/admin-partners')}
        >
          <View style={styles.actionIconContainer}>
            <Text style={styles.actionIcon}>👥</Text>
          </View>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>Manage Partners</Text>
            <Text style={styles.actionDescription}>View and manage partner accounts</Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/admin-withdrawals')}
        >
          <View style={styles.actionIconContainer}>
            <Text style={styles.actionIcon}>💰</Text>
          </View>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>Withdrawals</Text>
            <Text style={styles.actionDescription}>Approve or reject withdrawal requests</Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/op-queue')}
        >
          <View style={styles.actionIconContainer}>
            <Text style={styles.actionIcon}>📋</Text>
          </View>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>Operational Queue</Text>
            <Text style={styles.actionDescription}>Review applications and documents</Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/leads')}
        >
          <View style={styles.actionIconContainer}>
            <Text style={styles.actionIcon}>🎯</Text>
          </View>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>Leads</Text>
            <Text style={styles.actionDescription}>View and manage leads</Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/applications')}
        >
          <View style={styles.actionIconContainer}>
            <Text style={styles.actionIcon}>📄</Text>
          </View>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>Applications</Text>
            <Text style={styles.actionDescription}>View all applications</Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityCard}>
          <Text style={styles.activityText}>• 5 new partner registrations pending approval</Text>
          <Text style={styles.activityText}>• 12 withdrawal requests awaiting review</Text>
          <Text style={styles.activityText}>• 23 applications need document verification</Text>
          <Text style={styles.activityText}>• 8 partners submitted KYC documents</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  loadingText: {
    marginTop: 12,
    color: colors.textLight,
    fontSize: typography.sizes.sm,
  },
  header: {
    padding: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textLight,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    marginTop: 4,
  },
  section: {
    padding: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 12,
  },
  sectionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
  },
  sectionStatItem: {
    alignItems: 'center',
  },
  sectionStatValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  sectionStatLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    marginTop: 4,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionIcon: {
    fontSize: 24,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
  },
  actionArrow: {
    fontSize: typography.sizes.lg,
    color: colors.textLight,
    fontWeight: typography.weights.bold,
  },
  activityCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
  },
  activityText: {
    fontSize: typography.sizes.sm,
    color: colors.text,
    marginBottom: 8,
  },
});
