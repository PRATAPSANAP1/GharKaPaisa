import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Icon } from '../../components/Icon';
import { fetchEmployeeProfile } from '../../services/partner.service';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

export default function TeamDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [employeeData, setEmployeeData] = useState<any>(null);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await fetchEmployeeProfile();
      if (res.success) {
        setEmployeeData(res.data || res);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load team member workspace');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Team Workspace...</Text>
      </View>
    );
  }

  const emp = employeeData?.employee || user || {};

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => loadDashboard(true)} colors={[colors.primary]} />
      }
    >
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerLeft}>
          <Text style={styles.welcomeSubtitle}>TEAM MEMBER WORKSPACE</Text>
          <Text style={styles.welcomeTitle}>{user?.full_name || 'Team Member'}</Text>
          <Text style={styles.designationText}>
            Designation: {user?.designation || emp.designation || 'Team Member'}
          </Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{emp.activation_status || 'ACTIVE'}</Text>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Icon name="alert-circle" size={18} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionGrid}>
        <TouchableOpacity style={styles.actionTile} onPress={() => router.push('/add-lead')}>
          <View style={[styles.actionIconBg, { backgroundColor: '#EEF2FF' }]}>
            <Icon name="user-plus" size={20} color="#4F46E5" />
          </View>
          <Text style={styles.actionTileText}>Punch Lead</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionTile} onPress={() => router.push('/leads')}>
          <View style={[styles.actionIconBg, { backgroundColor: '#F3E8FF' }]}>
            <Icon name="list" size={20} color="#9333EA" />
          </View>
          <Text style={styles.actionTileText}>My Leads</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionTile} onPress={() => router.push('/applications')}>
          <View style={[styles.actionIconBg, { backgroundColor: '#ECFDF5' }]}>
            <Icon name="file-text" size={20} color="#10B981" />
          </View>
          <Text style={styles.actionTileText}>Applications</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionTile} onPress={() => router.push('/products')}>
          <View style={[styles.actionIconBg, { backgroundColor: '#FEF3C7' }]}>
            <Icon name="grid" size={20} color="#D97706" />
          </View>
          <Text style={styles.actionTileText}>Products</Text>
        </TouchableOpacity>
      </View>

      {/* Assigned Activity KPIs */}
      <Text style={styles.sectionTitle}>My Activity Overview</Text>
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Assigned Leads</Text>
          <Text style={styles.kpiValue}>{emp.leads_count || 0}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Total Applications</Text>
          <Text style={styles.kpiValue}>{emp.total_applications || 0}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={[styles.kpiLabel, { color: '#059669' }]}>Approved Cards</Text>
          <Text style={[styles.kpiValue, { color: '#059669' }]}>{emp.approved_applications || 0}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={[styles.kpiLabel, { color: '#D97706' }]}>Active Members</Text>
          <Text style={[styles.kpiValue, { color: '#D97706' }]}>{emp.active_members || 0}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    padding: spacing.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: typography.sizes.sm,
    color: '#64748B',
  },
  headerCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  welcomeSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  welcomeTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  designationText: {
    fontSize: typography.sizes.xs,
    color: '#CBD5E1',
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: typography.sizes.xs,
    color: colors.error,
    marginLeft: spacing.xs,
    flex: 1,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: spacing.sm,
  },
  quickActionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  actionTile: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.sm,
    alignItems: 'center',
    width: '23%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIconBg: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  actionTileText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.md,
    width: '48%',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  kpiLabel: {
    fontSize: typography.sizes.xs,
    color: '#64748B',
    fontWeight: '500',
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 4,
  },
});
