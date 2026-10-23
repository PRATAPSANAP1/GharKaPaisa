import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import apiClient from '../../services/api';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface ReferralSummary {
  total_partners: number;
  active_partners: number;
  inactive_partners: number;
  pending_kyc: number;
  approved_kyc: number;
  total_team_members: number;
  largest_team_size: number;
  highest_team_commission: number;
  daily_registrations: number;
  weekly_registrations: number;
  monthly_registrations: number;
  referral_conversion_rate: number;
  average_team_size: number;
}

interface TopReferrer {
  id: string;
  first_name?: string;
  last_name?: string;
  partner_code?: string;
  referral_count?: number;
  children_count?: number;
  team_commission?: number;
  email?: string;
  mobile?: string;
  status?: string;
}

export default function ReferralAnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<ReferralSummary | null>(null);
  const [topReferrers, setTopReferrers] = useState<TopReferrer[]>([]);

  useEffect(() => {
    fetchReferralAnalytics();
  }, []);

  const fetchReferralAnalytics = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const response = await apiClient.get('/superadmin/referral-analytics');
      const payload = response.data?.data || {};
      setSummary(payload);
      setTopReferrers(payload.top_referrers || []);
    } catch (error) {
      console.error('Failed to fetch referral analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    fetchReferralAnalytics(true);
  }, []);

  const formatCurrency = (value?: number) =>
    `₹${Number(value || 0).toLocaleString('en-IN')}`;

  const getReferrerName = (referrer: TopReferrer) =>
    `${referrer.first_name || ''} ${referrer.last_name || ''}`.trim() ||
    referrer.partner_code ||
    'Partner';

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading referral analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Referral Analytics</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={() => fetchReferralAnalytics(true)}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {summary && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Partners</Text>
            <Text style={styles.statValue}>{summary.total_partners}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Active Partners</Text>
            <Text style={styles.statValue}>{summary.active_partners}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Team Members</Text>
            <Text style={styles.statValue}>{summary.total_team_members}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Referral Conversion</Text>
            <Text style={styles.statValue}>
              {Number(summary.referral_conversion_rate || 0).toFixed(2)}%
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Pending KYC</Text>
            <Text style={styles.statValue}>{summary.pending_kyc}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Approved KYC</Text>
            <Text style={styles.statValue}>{summary.approved_kyc}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Avg Team Size</Text>
            <Text style={styles.statValue}>
              {Number(summary.average_team_size || 0).toFixed(2)}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Largest Team</Text>
            <Text style={styles.statValue}>{summary.largest_team_size}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Highest Team Comm.</Text>
            <Text style={styles.statValue}>
              {formatCurrency(summary.highest_team_commission)}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>New (30 Days)</Text>
            <Text style={styles.statValue}>{summary.monthly_registrations}</Text>
          </View>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Top Referrers</Text>
      </View>

      <View style={styles.referrersContainer}>
        {topReferrers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No referral data available</Text>
          </View>
        ) : (
          topReferrers.map((referrer, index) => (
            <View key={referrer.id} style={styles.referrerCard}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>#{index + 1}</Text>
              </View>
              <View style={styles.referrerInfo}>
                <Text style={styles.referrerName}>{getReferrerName(referrer)}</Text>
                <Text style={styles.referrerStats}>
                  {referrer.partner_code ? `${referrer.partner_code} • ` : ''}
                  {referrer.referral_count || 0} referrals • {referrer.children_count || 0} team
                </Text>
              </View>
              <View style={styles.referrerMetrics}>
                <Text style={styles.teamCommission}>
                  {formatCurrency(referrer.team_commission)}
                </Text>
                <Text style={styles.revenueLabel}>Team Comm.</Text>
              </View>
            </View>
          ))
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  refreshButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.primary,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
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
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    marginBottom: 4,
  },
  statValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  sectionHeader: {
    padding: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  referrersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.sizes.md,
    color: colors.textLight,
  },
  referrerCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  referrerInfo: {
    flex: 1,
  },
  referrerName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 4,
  },
  referrerStats: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
  },
  referrerMetrics: {
    alignItems: 'flex-end',
  },
  teamCommission: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: '#10B981',
    marginBottom: 2,
  },
  revenueLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
  },
});
