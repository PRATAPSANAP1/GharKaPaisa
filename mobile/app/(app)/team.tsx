import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Icon } from '../../components/Icon';
import { fetchPartnerTeamMembers, fetchPartnerTeamDashboard } from '../../services/partner.service';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

export default function TeamScreen() {
  const { user } = useAuth();

  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [teamSummary, setTeamSummary] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadTeamData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [membersRes, dashRes] = await Promise.allSettled([
        fetchPartnerTeamMembers(),
        fetchPartnerTeamDashboard(),
      ]);

      if (membersRes.status === 'fulfilled' && membersRes.value.success) {
        setTeamMembers(membersRes.value.data || membersRes.value.members || []);
      }
      if (dashRes.status === 'fulfilled' && dashRes.value.success) {
        setTeamSummary(dashRes.value.data || dashRes.value);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load team details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTeamData();
  }, [loadTeamData]);

  const renderMemberCard = ({ item }: { item: any }) => {
    const name = item.full_name || item.name || 'Team Member';
    const role = item.role || item.designation || 'Member';
    const code = item.employee_code || item.partner_code || item.code || 'N/A';
    const status = item.status || (item.is_active ? 'ACTIVE' : 'INACTIVE');

    return (
      <View style={styles.card}>
        <View style={styles.avatarRow}>
          <View style={styles.avatarBg}>
            <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>{name}</Text>
            <Text style={styles.memberMeta}>Code: {code} • {role}</Text>
          </View>
          <View style={[styles.statusBadge, status === 'ACTIVE' ? styles.statusActive : styles.statusInactive]}>
            <Text style={[styles.statusText, status === 'ACTIVE' ? styles.statusTextActive : styles.statusTextInactive]}>
              {status}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Team</Text>
        <Text style={styles.subtitle}>Direct Network & Team Members</Text>
      </View>

      {/* Summary Banner if available */}
      {teamSummary ? (
        <View style={styles.summaryBar}>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>Total Members</Text>
            <Text style={styles.summaryValue}>{teamSummary.total_members || teamMembers.length}</Text>
          </View>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>Active</Text>
            <Text style={[styles.summaryValue, { color: '#059669' }]}>
              {teamSummary.active_members || teamMembers.filter((m: any) => m.is_active || m.status === 'ACTIVE').length}
            </Text>
          </View>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={teamMembers}
          keyExtractor={(item, idx) => item.id || String(idx)}
          renderItem={renderMemberCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadTeamData(true)} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Icon name="users" size={32} color="#94A3B8" />
              <Text style={styles.emptyText}>No team members found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: typography.sizes.xs,
    color: '#64748B',
    marginTop: 2,
  },
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  summaryCol: {
    marginRight: spacing.xl,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  errorText: {
    fontSize: typography.sizes.sm,
    color: colors.error,
    textAlign: 'center',
  },
  listContent: {
    padding: spacing.md,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4F46E5',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: '#0F172A',
  },
  memberMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#D1FAE5',
  },
  statusInactive: {
    backgroundColor: '#F3F4F6',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusTextActive: {
    color: '#065F46',
  },
  statusTextInactive: {
    color: '#4B5563',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: spacing.xs,
    fontSize: typography.sizes.sm,
    color: '#64748B',
  },
});
