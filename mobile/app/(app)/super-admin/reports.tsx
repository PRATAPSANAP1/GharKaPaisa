import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { Icon } from '../../../components/Icon';
import apiClient from '../../../services/api';

interface ReportSummary {
  total_records: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  half_day_count: number;
  leave_count: number;
  total_working_hours: string;
}

export default function SuperAdminReportsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadReports = async () => {
    try {
      setError(null);
      const res = await apiClient.get('/reports/overview');
      if (res.data?.success) {
        setSummary(res.data.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const reportTypes = [
    {
      title: 'Attendance Report',
      description: 'Employee attendance summary and detailed records',
      icon: 'calendar',
      color: '#3B82F6',
      path: '/super-admin/attendance',
    },
    {
      title: 'Partner KYC Report',
      description: 'Partner verification and KYC status',
      icon: 'shield',
      color: '#10B981',
      path: '/super-admin/partners',
    },
    {
      title: 'Leads Report',
      description: 'Lead generation and conversion metrics',
      icon: 'list',
      color: '#8B5CF6',
      path: '/super-admin/leads',
    },
    {
      title: 'Commission Report',
      description: 'Partner commission and payout details',
      icon: 'credit-card',
      color: '#F59E0B',
      path: '/super-admin/commissions',
    },
    {
      title: 'Admin Activity',
      description: 'Administrative user actions and logs',
      icon: 'users',
      color: '#EF4444',
      path: '/super-admin/dashboard',
    },
    {
      title: 'Applications Report',
      description: 'Application status and approval metrics',
      icon: 'file-text',
      color: '#06B6D4',
      path: '/super-admin/applications',
    },
  ];

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading reports...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reports</Text>
        <View style={{ width: 24 }} />
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Icon name="alert-circle" size={18} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Summary Stats */}
      {summary && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Overview Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{summary.total_records}</Text>
              <Text style={styles.summaryLabel}>Total Records</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: '#10B981' }]}>{summary.present_count}</Text>
              <Text style={styles.summaryLabel}>Present</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>{summary.late_count}</Text>
              <Text style={styles.summaryLabel}>Late</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: '#8B5CF6' }]}>{summary.half_day_count}</Text>
              <Text style={styles.summaryLabel}>Half Day</Text>
            </View>
          </View>
        </View>
      )}

      {/* Report Types */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Reports</Text>
        {reportTypes.map((report, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => router.push(report.path as any)}
            activeOpacity={0.7}
          >
            <Card style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <View style={[styles.reportIcon, { backgroundColor: `${report.color}15` }]}>
                  <Text style={styles.reportIconText}>{report.icon}</Text>
                </View>
                <Icon name="chevron-right" size={20} color={colors.textMid} />
              </View>
              <Text style={styles.reportTitle}>{report.title}</Text>
              <Text style={styles.reportDesc}>{report.description}</Text>
            </Card>
          </TouchableOpacity>
        ))}
      </View>

      {/* Export Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Export Options</Text>
        <View style={styles.exportGrid}>
          <Button
            title="Export CSV"
            onPress={() => Alert.alert('Export', 'CSV export feature coming soon')}
            variant="outline"
            style={styles.exportBtn}
          />
          <Button
            title="Export Excel"
            onPress={() => Alert.alert('Export', 'Excel export feature coming soon')}
            variant="outline"
            style={styles.exportBtn}
          />
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textMid,
    marginTop: spacing.sm,
  },
  header: {
    backgroundColor: '#0F172A',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginLeft: spacing.xs,
    flex: 1,
  },
  summaryContainer: {
    backgroundColor: '#fff',
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.md,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  summaryItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.bg,
    borderRadius: 8,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  summaryLabel: {
    fontSize: 11,
    color: colors.textMid,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.md,
  },
  reportCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  reportIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportIconText: {
    fontSize: 24,
  },
  reportTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  reportDesc: {
    fontSize: 13,
    color: colors.textMid,
    lineHeight: 18,
  },
  exportGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  exportBtn: {
    flex: 1,
  },
});
