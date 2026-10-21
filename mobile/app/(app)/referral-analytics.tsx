import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { apiClient } from '../../services/api';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface ReferralStats {
  total_referrals: number;
  active_referrals: number;
  converted_referrals: number;
  conversion_rate: number;
  total_revenue: number;
  avg_conversion_days: number;
}

interface TopReferrer {
  partner_id: string;
  partner_name: string;
  total_referrals: number;
  converted_referrals: number;
  conversion_rate: number;
  total_revenue: number;
}

export default function ReferralAnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [topReferrers, setTopReferrers] = useState<TopReferrer[]>([]);
  const [timeRange, setTimeRange] = useState<string>('30d');

  useEffect(() => {
    fetchReferralAnalytics();
  }, [timeRange]);

  const fetchReferralAnalytics = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/superadmin/referrals/analytics', {
        params: { time_range: timeRange }
      });
      setStats(response.data.stats || null);
      setTopReferrers(response.data.top_referrers || []);
    } catch (error) {
      console.error('Failed to fetch referral analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading referral analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Referral Analytics</Text>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['7d', '30d', '90d', '1y'].map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.filterChip,
                timeRange === range && styles.filterChipActive
              ]}
              onPress={() => setTimeRange(range)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  timeRange === range && styles.filterChipTextActive
                ]}
              >
                {range === '1y' ? '1 Year' : range === '90d' ? '90 Days' : range === '30d' ? '30 Days' : '7 Days'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Referrals</Text>
            <Text style={styles.statValue}>{stats.total_referrals}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Active Referrals</Text>
            <Text style={styles.statValue}>{stats.active_referrals}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Converted</Text>
            <Text style={styles.statValue}>{stats.converted_referrals}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Conversion Rate</Text>
            <Text style={styles.statValue}>{stats.conversion_rate.toFixed(1)}%</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Revenue</Text>
            <Text style={styles.statValue}>₹{stats.total_revenue.toLocaleString()}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Avg Conversion Days</Text>
            <Text style={styles.statValue}>{stats.avg_conversion_days.toFixed(1)}</Text>
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
            <View key={referrer.partner_id} style={styles.referrerCard}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>#{index + 1}</Text>
              </View>
              <View style={styles.referrerInfo}>
                <Text style={styles.referrerName}>{referrer.partner_name}</Text>
                <Text style={styles.referrerStats}>
                  {referrer.total_referrals} referrals • {referrer.converted_referrals} converted
                </Text>
              </View>
              <View style={styles.referrerMetrics}>
                <Text style={styles.conversionRate}>
                  {referrer.conversion_rate.toFixed(1)}%
                </Text>
                <Text style={styles.revenue}>
                  ₹{referrer.total_revenue.toLocaleString()}
                </Text>
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
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
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
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.card,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
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
  conversionRate: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: '#10B981',
    marginBottom: 2,
  },
  revenue: {
    fontSize: typography.sizes.sm,
    color: colors.textLight,
  },
});
