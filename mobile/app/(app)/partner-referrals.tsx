import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Clipboard } from 'react-native';
import apiClient from '../../services/api';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface ReferralInfo {
  id?: string;
  partner_id?: string;
  referral_code: string;
  referral_link: string;
  total_invites: number;
  total_registered: number;
  custom_message?: string;
  created_at?: string;
  updated_at?: string;
}

export default function PartnerReferralsScreen() {
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<ReferralInfo | null>(null);

  useEffect(() => {
    fetchReferralInfo();
  }, []);

  const fetchReferralInfo = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/partner/referral');
      setInfo(response.data?.data || null);
    } catch (error) {
      console.error('Failed to fetch referral info:', error);
      Alert.alert('Error', 'Failed to load referral details');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (value: string) => {
    try {
      Clipboard.setString(value);
      Alert.alert('Success', 'Copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy');
    }
  };

  const totalInvites = Number(info?.total_invites || 0);
  const totalRegistered = Number(info?.total_registered || 0);
  const conversionRate = totalInvites > 0 ? (totalRegistered / totalInvites) * 100 : 0;

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

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Invites</Text>
          <Text style={styles.statValue}>{totalInvites}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Registered</Text>
          <Text style={styles.statValue}>{totalRegistered}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Conversion Rate</Text>
          <Text style={styles.statValue}>{conversionRate.toFixed(1)}%</Text>
        </View>
      </View>

      <View style={styles.referralsContainer}>
        {!info?.referral_link ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Referral link will be available once your KYC is approved.
            </Text>
          </View>
        ) : (
          <View style={styles.referralCard}>
            <View style={styles.referralHeader}>
              <View style={styles.referralInfo}>
                <Text style={styles.referredName}>Your Referral Code</Text>
                <Text style={styles.referralCode}>{info.referral_code}</Text>
              </View>
              <TouchableOpacity
                style={styles.statusBadge}
                onPress={() => handleCopy(info.referral_code)}
              >
                <Text style={styles.statusText}>COPY</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.linkContainer}>
              <Text style={styles.linkLabel}>Referral Link</Text>
              <Text style={styles.linkText} numberOfLines={2}>
                {info.referral_link}
              </Text>
            </View>

            {!!info.custom_message && (
              <Text style={styles.convertedText}>{info.custom_message}</Text>
            )}

            <TouchableOpacity
              style={styles.copyButton}
              onPress={() => handleCopy(info.referral_link)}
            >
              <Text style={styles.copyButtonText}>Copy Referral Link</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: colors.primary,
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
    backgroundColor: colors.bg,
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
