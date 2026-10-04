import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { Card } from '../../../components/Card';
import { Icon } from '../../../components/Icon';
import { fetchAuditLogs } from '../../../services/super-admin.service';

export default function SuperAdminAuditLogsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [logs, setLogs] = useState<any[]>([]);

  const loadAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchAuditLogs({
        search: searchQuery || undefined,
        action: actionFilter !== 'ALL' ? actionFilter : undefined,
      });

      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.logs)
        ? res.logs
        : Array.isArray(res)
        ? res
        : [];
      setLogs(list);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, actionFilter]);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAuditLogs();
  };

  const filterOptions = [
    { key: 'ALL', label: 'All Actions' },
    { key: 'LOGIN', label: 'Auth & Login' },
    { key: 'UPDATE', label: 'Updates' },
    { key: 'KYC', label: 'KYC Events' },
    { key: 'PAYOUT', label: 'Payouts' },
    { key: 'DELETE', label: 'Deletions' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSubtitle}>SUPER ADMIN</Text>
          <Text style={styles.headerTitle}>Audit Trail & Security</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <Icon name="search" size={18} color={colors.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by action, admin, IP, or details..."
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="x" size={16} color={colors.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterScrollWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
          {filterOptions.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.filterPill, actionFilter === opt.key && styles.activeFilterPill]}
              onPress={() => setActionFilter(opt.key)}
            >
              <Text style={[styles.filterText, actionFilter === opt.key && styles.activeFilterText]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Log List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching audit records...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.contentList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {logs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="shield" size={48} color={colors.textLight} />
              <Text style={styles.emptyTitle}>No Audit Logs Found</Text>
              <Text style={styles.emptyDesc}>System security actions and admin edits will appear here.</Text>
            </View>
          ) : (
            logs.map((log, index) => {
              const action = log.action || log.event || 'ACTION';
              return (
                <Card key={log.id || index} style={styles.logCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.actionBadge}>
                      <Icon name="activity" size={12} color={colors.primary} />
                      <Text style={styles.actionText}>{action.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.timestamp}>
                      {new Date(log.created_at || Date.now()).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>

                  <Text style={styles.performerText}>
                    By: <Text style={{ fontWeight: '700', color: colors.text }}>{log.user_name || log.admin_name || log.performed_by || 'System'}</Text>
                  </Text>

                  {log.details && (
                    <Text style={styles.detailsText}>
                      {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                    </Text>
                  )}

                  <View style={styles.cardFooter}>
                    <Text style={styles.ipText}>IP: {log.ip_address || log.ip || '127.0.0.1'}</Text>
                    {log.target && (
                      <Text style={styles.targetText}>Target: {log.target}</Text>
                    )}
                  </View>
                </Card>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
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
    paddingTop: spacing.xl + 8,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: spacing.md,
    padding: 4,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: spacing.md,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    padding: 0,
  },
  filterScrollWrapper: {
    maxHeight: 46,
  },
  filterContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: 6,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeFilterPill: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMid,
  },
  activeFilterText: {
    color: '#fff',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 13,
    color: colors.textMid,
  },
  contentList: {
    flex: 1,
    padding: spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
  },
  emptyDesc: {
    fontSize: 12,
    color: colors.textMid,
    marginTop: 4,
    textAlign: 'center',
  },
  logCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 4,
  },
  actionText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  timestamp: {
    fontSize: 11,
    color: colors.textLight,
  },
  performerText: {
    fontSize: 13,
    color: colors.textMid,
    marginTop: spacing.sm,
  },
  detailsText: {
    fontSize: 12,
    color: colors.text,
    backgroundColor: '#F8FAFC',
    padding: spacing.xs,
    borderRadius: 6,
    marginTop: spacing.xs,
    fontFamily: 'monospace',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  ipText: {
    fontSize: 10,
    color: colors.textLight,
  },
  targetText: {
    fontSize: 10,
    color: colors.textLight,
  },
});
