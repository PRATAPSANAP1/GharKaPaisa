import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Clipboard } from 'react-native';
import { apiClient } from '../../services/api';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface Referral {
  id: string;
  referred_by: string;
  referred_name: string;
  referral_code: string;
  referral_link: string;
  status: string;
  converted_at?: string;
  commission_earned: number;
  created_at: string;
}

interface ReferralStats {
  total_referrals: number;
  active_referrals: number;
  converted_referrals: number;
  total_commission: number;
  conversion_rate: number;
}

export default function PartnerReferralsScreen() {
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchReferrals();
  }, [statusFilter]);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await apiClient.get('/referrals', { params });
      setReferrals(response.data.referrals || []);
      setStats(response.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch referrals:', error);
      Alert.alert('Error', 'Failed to load referrals');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async (link: string) => {
    try {
      await Clipboard.setStringAsync(link);
      Alert.alert('Success', 'Referral link copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy link');
    }
  };

  const filteredReferrals = referrals.filter(r =>
    statusFilter === 'all' || r.status === statusFilter
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading referrals...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Referrals</Text>
      </View>

      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Referrals</Text>
            <Text style={styles.statValue}>{stats.total_referrals}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Converted</Text>
            <Text style={styles.statValue}>{stats.converted_referrals}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Commission</Text>
            <Text style={styles.statValue}>₹{stats.total_commission.toLocaleString()}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Conversion Rate</Text>
            <Text style={styles.statValue}>{stats.conversion_rate.toFixed(1)}%</Text>
          </View>
        </View>
      )}

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'active', 'converted', 'expired'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                statusFilter === status && styles.filterChipActive
              ]}
              onPress={() => setStatusFilter(status)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  statusFilter === status && styles.filterChipTextActive
                ]}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.referralsContainer}>
        {filteredReferrals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No referrals found</Text>
          </View>
        ) : (
          filteredReferrals.map((referral) => (
            <View key={referral.id} style={styles.referralCard}>
              <View style={styles.referralHeader}>
                <View style={styles.referralInfo}>
                  <Text style={styles.referredName}>{referral.referred_name}</Text>
                  <Text style={styles.referralCode}>Code: {referral.referral_code}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(referral.status) }
                  ]}
                >
                  <Text style={styles.statusText}>
                    {referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}
                  </Text>
                </View>
              </View>

              <View style={styles.linkContainer}>
                <Text style={styles.linkLabel}>Referral Link:</Text>
                <Text style={styles.linkText} numberOfLines={2}>
                  {referral.referral_link}
                </Text>
              </View>

              <View style={styles.referralStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>₹{referral.commission_earned.toLocaleString()}</Text>
                  <Text style={styles.statLabel}>Commission</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {new Date(referral.created_at).toLocaleDateString()}
                  </Text>
                  <Text style={styles.statLabel}>Created</Text>
                </View>
              </View>

              {referral.converted_at && (
                <Text style={styles.convertedText}>
                  Converted: {new Date(referral.converted_at).toLocaleDateString()}
                </Text>
              )}

              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => handleCopyLink(referral.referral_link)}
              >
                <Text style={styles.copyButtonText}>Copy Referral Link</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'converted': return '#10B981';
    case 'active': return '#3B82F6';
    case 'expired': return '#EF4444';
    default: return '#6B7280';
  }
};

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
    fontSize: typography.sizes.lg,
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
  referralsContainer: {
    padding: 16,
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
  referralCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  referralHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  referralInfo: {
    flex: 1,
  },
  referredName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 4,
  },
  referralCode: {
    fontSize: typography.sizes.sm,
    color: colors.textLight,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  linkContainer: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  linkLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    marginBottom: 4,
  },
  linkText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontFamily: 'monospace',
  },
  referralStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    marginTop: 2,
  },
  convertedText: {
    fontSize: typography.sizes.xs,
    color: '#10B981',
    marginBottom: 12,
  },
  copyButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  copyButtonText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
});
