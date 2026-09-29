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
import {
  fetchPartnerDashboard,
  fetchPartnerWallet,
  fetchPartnerProfile,
} from '../../services/partner.service';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

export default function PartnerDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [walletData, setWalletData] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [dashRes, walletRes, profRes] = await Promise.allSettled([
        fetchPartnerDashboard(),
        fetchPartnerWallet(),
        fetchPartnerProfile(),
      ]);

      if (dashRes.status === 'fulfilled' && dashRes.value.success) {
        setDashboardData(dashRes.value.data || dashRes.value);
      }
      if (walletRes.status === 'fulfilled' && walletRes.value.success) {
        setWalletData(walletRes.value.data || walletRes.value);
      }
      if (profRes.status === 'fulfilled' && profRes.value.success) {
        setProfileData(profRes.value.data || profRes.value);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
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
        <Text style={styles.loadingText}>Loading Partner Workspace...</Text>
      </View>
    );
  }

  const kpis = dashboardData?.summary || dashboardData?.kpi || dashboardData || {};
  const wallet = walletData?.wallet || walletData || {};
  const partnerProfile = profileData?.partner || user || {};

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => loadDashboard(true)} colors={[colors.primary]} />
      }
    >
      {/* Header Banner */}
      <View style={styles.headerCard}>
        <View style={styles.headerLeft}>
          <Text style={styles.welcomeSubtitle}>PARTNER WORKSPACE</Text>
          <Text style={styles.welcomeTitle}>{user?.full_name || 'Partner'}</Text>
          <Text style={styles.partnerCodeText}>Code: {user?.partner_code || partnerProfile.partner_code || 'N/A'}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Icon name="check-circle" size={14} color="#059669" />
          <Text style={styles.statusText}>VERIFIED</Text>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Icon name="alert-circle" size={18} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Wallet Balance Summary Card */}
      <View style={styles.walletCard}>
        <View style={styles.walletHeader}>
          <View style={styles.walletTitleRow}>
            <Icon name="credit-card" size={18} color="#FFFFFF" />
            <Text style={styles.walletTitle}>Available Balance</Text>
          </View>
          <TouchableOpacity
            style={styles.walletActionBtn}
            onPress={() => router.push('/wallet')}
          >
            <Text style={styles.walletActionText}>Wallet & Withdraw</Text>
            <Icon name="chevron-right" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.walletBalanceAmount}>
          ₹{Number(wallet.balance || wallet.available_balance || 0).toLocaleString('en-IN')}
        </Text>

        <View style={styles.walletFooterRow}>
          <View style={styles.walletFooterCol}>
            <Text style={styles.walletFooterLabel}>Pending Earnings</Text>
            <Text style={styles.walletFooterValue}>
              ₹{Number(wallet.pending_commission || wallet.pending_balance || 0).toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.walletFooterCol}>
            <Text style={styles.walletFooterLabel}>Total Paid out</Text>
            <Text style={styles.walletFooterValue}>
              ₹{Number(wallet.total_withdrawn || wallet.total_earnings || 0).toLocaleString('en-IN')}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Action Bar */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionGrid}>
        <TouchableOpacity style={styles.actionTile} onPress={() => router.push('/add-lead')}>
          <View style={[styles.actionIconBg, { backgroundColor: '#EEF2FF' }]}>
            <Icon name="user-plus" size={20} color="#4F46E5" />
          </View>
          <Text style={styles.actionTileText}>Punch Lead</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionTile} onPress={() => router.push('/products')}>
          <View style={[styles.actionIconBg, { backgroundColor: '#ECFDF5' }]}>
            <Icon name="link-2" size={20} color="#10B981" />
          </View>
          <Text style={styles.actionTileText}>Share Products</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionTile} onPress={() => router.push('/team')}>
          <View style={[styles.actionIconBg, { backgroundColor: '#FEF3C7' }]}>
            <Icon name="users" size={20} color="#D97706" />
          </View>
          <Text style={styles.actionTileText}>My Team</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionTile} onPress={() => router.push('/leads')}>
          <View style={[styles.actionIconBg, { backgroundColor: '#F3E8FF' }]}>
            <Icon name="list" size={20} color="#9333EA" />
          </View>
          <Text style={styles.actionTileText}>My Leads</Text>
        </TouchableOpacity>
      </View>

      {/* Performance KPIs Grid */}
      <Text style={styles.sectionTitle}>Performance Overview</Text>
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Total Leads</Text>
          <Text style={styles.kpiValue}>{kpis.total_leads || kpis.leads_count || 0}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Applications</Text>
          <Text style={styles.kpiValue}>{kpis.total_applications || kpis.applications_count || 0}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={[styles.kpiLabel, { color: '#059669' }]}>Approved</Text>
          <Text style={[styles.kpiValue, { color: '#059669' }]}>{kpis.approved || kpis.approved_applications || 0}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={[styles.kpiLabel, { color: '#D97706' }]}>Pending</Text>
          <Text style={[styles.kpiValue, { color: '#D97706' }]}>{kpis.pending || kpis.pending_applications || 0}</Text>
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
    backgroundColor: '#1E293B',
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
  partnerCodeText: {
    fontSize: typography.sizes.xs,
    color: '#CBD5E1',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
    marginLeft: 4,
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
  walletCard: {
    backgroundColor: '#4F46E5',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletTitle: {
    color: '#E0E7FF',
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  walletActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  walletActionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginRight: 2,
  },
  walletBalanceAmount: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginVertical: spacing.sm,
  },
  walletFooterRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: spacing.xs,
    marginTop: spacing.xs,
  },
  walletFooterCol: {
    flex: 1,
  },
  walletFooterLabel: {
    color: '#C7D2FE',
    fontSize: 11,
  },
  walletFooterValue: {
    color: '#FFFFFF',
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    marginTop: 2,
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
