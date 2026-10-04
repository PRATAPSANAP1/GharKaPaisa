import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { Icon } from '../../../components/Icon';
import apiClient from '../../../services/api';

interface AttendanceSummary {
  totalEmployees: number;
  totalPresent: number;
  totalLate: number;
  totalHalfDay: number;
  totalLeave: number;
  totalNotMarked: number;
}

interface AttendanceRecord {
  id: string;
  employee_id: string;
  full_name: string;
  department: string;
  check_in_time: string;
  check_out_time: string;
  status: string;
  working_hours: string;
  source: string;
}

export default function SuperAdminAttendanceScreen() {
  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadTodayAttendance = async () => {
    try {
      setError(null);
      const res = await apiClient.get('/attendance-admin/today', {
        params: { date: selectedDate }
      });
      if (res.data?.success) {
        setSummary(res.data.data.summary);
        setRecords(res.data.data.records || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load attendance data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadHistoryAttendance = async () => {
    try {
      setError(null);
      const res = await apiClient.get('/attendance-admin/history', {
        params: {
          start_date: selectedDate,
          end_date: selectedDate,
        }
      });
      if (res.data?.success) {
        setSummary(res.data.data.summary);
        setRecords(res.data.data.records || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load attendance history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'today') {
      loadTodayAttendance();
    } else {
      loadHistoryAttendance();
    }
  }, [activeTab, selectedDate]);

  const onRefresh = () => {
    setRefreshing(true);
    if (activeTab === 'today') {
      loadTodayAttendance();
    } else {
      loadHistoryAttendance();
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '--';
    const date = new Date(timeStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PRESENT':
        return '#10B981';
      case 'LATE':
        return '#F59E0B';
      case 'HALF_DAY':
        return '#8B5CF6';
      case 'LEAVE':
        return '#3B82F6';
      case 'ABSENT':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading attendance data...</Text>
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
        <Text style={styles.headerTitle}>Attendance Dashboard</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'today' && styles.activeTab]}
          onPress={() => setActiveTab('today')}
        >
          <Text style={[styles.tabText, activeTab === 'today' && styles.activeTabText]}>Today</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>History</Text>
        </TouchableOpacity>
      </View>

      {/* Date Picker */}
      <View style={styles.dateContainer}>
        <Text style={styles.dateLabel}>Date:</Text>
        <TouchableOpacity style={styles.dateButton}>
          <Text style={styles.dateText}>{selectedDate}</Text>
          <Icon name="calendar" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Icon name="alert-circle" size={18} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Summary Cards */}
      {summary && (
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{summary.totalEmployees}</Text>
            <Text style={styles.summaryLabel}>Total Employees</Text>
          </View>
          <View style={[styles.summaryCard, { borderLeftColor: '#10B981' }]}>
            <Text style={[styles.summaryValue, { color: '#10B981' }]}>{summary.totalPresent}</Text>
            <Text style={styles.summaryLabel}>Present</Text>
          </View>
          <View style={[styles.summaryCard, { borderLeftColor: '#F59E0B' }]}>
            <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>{summary.totalLate}</Text>
            <Text style={styles.summaryLabel}>Late</Text>
          </View>
          <View style={[styles.summaryCard, { borderLeftColor: '#EF4444' }]}>
            <Text style={[styles.summaryValue, { color: '#EF4444' }]}>{summary.totalNotMarked}</Text>
            <Text style={styles.summaryLabel}>Not Marked</Text>
          </View>
        </View>
      )}

      {/* Attendance Records */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {activeTab === 'today' ? 'Today\'s Attendance' : 'Attendance Records'}
        </Text>

        {records.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Icon name="calendar" size={48} color={colors.textLight} />
            <Text style={styles.emptyText}>No attendance records found</Text>
          </Card>
        ) : (
          records.map((record) => (
            <Card key={record.id} style={styles.recordCard}>
              <View style={styles.recordHeader}>
                <View style={styles.recordInfo}>
                  <Text style={styles.recordName}>{record.full_name}</Text>
                  <Text style={styles.recordDetail}>{record.department}</Text>
                  <Text style={styles.recordDetail}>{record.employee_id}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(record.status)}20` }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(record.status) }]}>
                    {record.status}
                  </Text>
                </View>
              </View>
              <View style={styles.recordTimes}>
                <View style={styles.timeItem}>
                  <Text style={styles.timeLabel}>Check-In:</Text>
                  <Text style={styles.timeValue}>{formatTime(record.check_in_time)}</Text>
                </View>
                <View style={styles.timeItem}>
                  <Text style={styles.timeLabel}>Check-Out:</Text>
                  <Text style={styles.timeValue}>{formatTime(record.check_out_time)}</Text>
                </View>
                <View style={styles.timeItem}>
                  <Text style={styles.timeLabel}>Hours:</Text>
                  <Text style={styles.timeValue}>{record.working_hours || '--'}</Text>
                </View>
                <View style={styles.timeItem}>
                  <Text style={styles.timeLabel}>Source:</Text>
                  <Text style={[styles.timeValue, { textTransform: 'uppercase' }]}>{record.source}</Text>
                </View>
              </View>
            </Card>
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
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
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dateLabel: {
    fontSize: 14,
    color: colors.textMid,
    marginRight: spacing.sm,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateText: {
    fontSize: 14,
    color: colors.text,
    marginRight: spacing.xs,
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
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    gap: spacing.sm,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryValue: {
    fontSize: 24,
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
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMid,
    marginTop: spacing.sm,
  },
  recordCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  recordInfo: {
    flex: 1,
  },
  recordName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  recordDetail: {
    fontSize: 12,
    color: colors.textMid,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  recordTimes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  timeItem: {
    flex: 1,
    minWidth: '45%',
  },
  timeLabel: {
    fontSize: 11,
    color: colors.textMid,
  },
  timeValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
});
