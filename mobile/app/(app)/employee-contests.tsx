import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import apiClient from '../../services/api';

interface Contest {
  id: string;
  title: string;
  short_description: string;
  description: string;
  contest_type: string;
  target_value: number;
  target_unit: string;
  reward_type: string;
  reward_value: number;
  start_date: string;
  end_date: string;
  status: 'ACTIVE' | 'UPCOMING' | 'COMPLETED';
  progress?: {
    current_value: number;
    target_value: number;
    percentage: number;
    qualified: boolean;
    remaining: number;
  };
}

export default function EmployeeContestsScreen() {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'UPCOMING' | 'COMPLETED'>('ACTIVE');
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadContests = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await apiClient.get('/contests');
      const list = res.data?.data || res.data;
      if (Array.isArray(list)) {
        const normalized = list.map((c: any) => ({
          ...c,
          status: (c.status || 'ACTIVE').toUpperCase() as Contest['status'],
          contest_type: c.contest_type || 'sales',
        }));
        setContests(normalized);
      } else {
        setContests([]);
      }
    } catch (err: any) {
      console.error('Failed to load contests:', err);
      const msg = err.response?.data?.message || err.message || 'Could not connect to contests server';
      setError(msg);
      setContests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadContests();
  }, [loadContests]);

  const filteredContests = contests.filter(c => c.status === activeTab);

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadContests(true)}
          colors={[colors.primary]}
        />
      }
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sales Contests</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {(['ACTIVE', 'UPCOMING', 'COMPLETED'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading live contests...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Icon name="alert-circle" size={48} color={colors.error || '#EF4444'} />
          <Text style={[styles.emptyText, { color: colors.error || '#EF4444', marginTop: 8 }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={() => loadContests()}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredContests.length === 0 ? (
        <View style={styles.centerContainer}>
          <Icon name="award" size={48} color={colors.textLight} />
          <Text style={styles.emptyText}>No {activeTab.toLowerCase()} contests found</Text>
          <Text style={[styles.emptySubText]}>
            {activeTab === 'ACTIVE'
              ? 'New sales incentive contests will appear here when launched by the administrator.'
              : `There are currently no ${activeTab.toLowerCase()} contests.`}
          </Text>
        </View>
      ) : (
        <View style={styles.contestsList}>
          {filteredContests.map((contest) => (
            <Card key={contest.id} style={styles.contestCard}>
              <View style={styles.contestHeader}>
                <View style={[styles.contestBadge, { backgroundColor: colors.primary }]}>
                  <Icon name="award" size={16} color="#fff" />
                  <Text style={styles.contestBadgeText}>{contest.contest_type.toUpperCase()}</Text>
                </View>
                <Text style={styles.contestStatus}>{contest.status}</Text>
              </View>

              <Text style={styles.contestTitle}>{contest.title}</Text>
              <Text style={styles.contestDesc} numberOfLines={2}>
                {contest.short_description}
              </Text>

              <View style={styles.contestDetails}>
                <View style={styles.detailItem}>
                  <Icon name="target" size={16} color={colors.textMid} />
                  <Text style={styles.detailText}>Target: {contest.target_value} {contest.target_unit}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Icon name="gift" size={16} color={colors.textMid} />
                  <Text style={styles.detailText}>Reward: ₹{contest.reward_value}</Text>
                </View>
              </View>

              <View style={styles.contestDates}>
                <View style={styles.dateItem}>
                  <Text style={styles.dateLabel}>Start:</Text>
                  <Text style={styles.dateValue}>{formatDate(contest.start_date)}</Text>
                </View>
                <View style={styles.dateItem}>
                  <Text style={styles.dateLabel}>End:</Text>
                  <Text style={styles.dateValue}>{formatDate(contest.end_date)}</Text>
                </View>
              </View>

              {contest.progress && contest.status === 'ACTIVE' && (
                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Your Progress</Text>
                    <Text style={styles.progressValue}>{contest.progress.percentage}%</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${contest.progress.percentage}%`, backgroundColor: colors.primary }]} />
                  </View>
                  <Text style={styles.progressText}>
                    {contest.progress.current_value} / {contest.progress.target_value} {contest.target_unit}
                  </Text>
                </View>
              )}

              <TouchableOpacity style={styles.viewDetailsButton}>
                <Text style={styles.viewDetailsText}>View Details</Text>
                <Icon name="chevron-right" size={16} color={colors.primary} />
              </TouchableOpacity>
            </Card>
          ))}
        </View>
      )}
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
  tabsContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMid,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textMid,
    marginTop: spacing.sm,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textMid,
    marginTop: spacing.sm,
  },
  contestsList: {
    padding: spacing.md,
    gap: spacing.md,
  },
  contestCard: {
    padding: spacing.md,
  },
  contestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  contestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  contestBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
  },
  contestStatus: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
  },
  contestTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  contestDesc: {
    fontSize: 14,
    color: colors.textMid,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  contestDetails: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    fontSize: 12,
    color: colors.textMid,
  },
  contestDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.md,
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    color: colors.textLight,
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  progressSection: {
    marginTop: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.bgTertiary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: colors.textMid,
    marginTop: spacing.xs,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 4,
  },
  retryBtn: {
    marginTop: spacing.md,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  emptySubText: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
