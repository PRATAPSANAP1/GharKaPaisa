import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useAuth } from '../src/context/AuthContext';
import { isAttendanceEnabledForEmployee } from '../config/attendanceRollout';
import {
  getTodayAttendance,
  getMyAttendanceHistory,
  getMyAttendanceSummary,
  executeCheckIn,
  executeCheckOut
} from '../services/attendance.service';
import MobileAttendanceVerificationModal from '../components/MobileAttendanceVerificationModal';

export default function EmployeeAttendanceScreen({ navigation }) {
  const { user } = useAuth();

  // Determine Rollout Eligibility for authenticated employee
  const empCode = user?.employee_code || user?.employee_id;
  const isEnabled = isAttendanceEnabledForEmployee(empCode);

  // States
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);

  // Attendance Data
  const [todayData, setTodayData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [historyData, setHistoryData] = useState([]);

  // Verification Modal State
  const [verificationModalVisible, setVerificationModalVisible] = useState(false);
  const [activeActionType, setActiveActionType] = useState('CHECK_IN'); // 'CHECK_IN' | 'CHECK_OUT'

  // Fetch Attendance Data (ONLY if enabled)
  const fetchAttendanceDetails = useCallback(async () => {
    if (!isEnabled) return;

    try {
      setLoading(true);

      const [todayRes, summaryRes, historyRes] = await Promise.all([
        getTodayAttendance().catch(() => null),
        getMyAttendanceSummary().catch(() => null),
        getMyAttendanceHistory({ page: 1, limit: 15 }).catch(() => null)
      ]);

      if (todayRes?.data) setTodayData(todayRes.data);
      if (summaryRes?.data) setSummaryData(summaryRes.data);
      if (historyRes?.data?.records) setHistoryData(historyRes.data.records);
    } catch (err) {
      console.error('[EMPLOYEE ATTENDANCE FETCH ERROR]:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isEnabled]);

  useEffect(() => {
    if (isEnabled) {
      fetchAttendanceDetails();
    }
  }, [isEnabled, fetchAttendanceDetails]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAttendanceDetails();
  };

  // Trigger Check-In Flow
  const handleInitiateCheckIn = async () => {
    const net = await NetInfo.fetch();
    if (!net.isConnected) {
      Alert.alert('Network Error', 'Internet connection is required to verify attendance.');
      return;
    }

    setActiveActionType('CHECK_IN');
    setVerificationModalVisible(true);
  };

  // Trigger Check-Out Flow
  const handleInitiateCheckOut = async () => {
    const net = await NetInfo.fetch();
    if (!net.isConnected) {
      Alert.alert('Network Error', 'Internet connection is required to verify attendance.');
      return;
    }

    setActiveActionType('CHECK_OUT');
    setVerificationModalVisible(true);
  };

  // Handle Verification Success callback from Modal
  const handleVerificationPassed = async (sessionId) => {
    setVerificationModalVisible(false);
    setSubmittingAction(true);

    try {
      if (activeActionType === 'CHECK_IN') {
        const res = await executeCheckIn(sessionId);
        if (res?.success) {
          Alert.alert('Check-In Successful 🎉', 'Your attendance check-in has been recorded with mobile verification.');
        }
      } else {
        const res = await executeCheckOut(sessionId);
        if (res?.success) {
          Alert.alert('Check-Out Successful 🎉', 'Your attendance check-out has been recorded.');
        }
      }

      fetchAttendanceDetails();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Attendance request failed';
      Alert.alert('Attendance Action Failed', msg);
    } finally {
      setSubmittingAction(false);
    }
  };

  // Formatting helpers
  const formatTimeStr = (isoString) => {
    if (!isoString) return '--';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return '--';
    }
  };

  const formatDateStr = (dateStr) => {
    if (!dateStr) return '--';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  };

  // ── RENDER COMING SOON IF NOT AUTHORIZED ──
  if (!isEnabled) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar backgroundColor="#0284C7" barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>← Dashboard</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Attendance</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.comingSoonContainer}>
          <Text style={styles.comingSoonIcon}>⌛</Text>
          <Text style={styles.comingSoonTitle}>Attendance Coming Soon</Text>
          <Text style={styles.comingSoonDesc}>
            Mobile face attendance functionality is currently being rolled out and will be available soon for your account.
          </Text>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonBadgeText}>PHASE 6 ROLLOUT GATE ACTIVE</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── RENDER FULL ATTENDANCE SCREEN FOR CAND10001 ──
  const record = todayData?.attendance || null;
  const hasCheckIn = Boolean(record?.check_in_time);
  const hasCheckOut = Boolean(record?.check_out_time);
  const statusStr = record?.status || (todayData?.status === 'NOT_MARKED' ? 'NOT MARKED' : 'PENDING');

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#0284C7" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Attendance</Text>
        <TouchableOpacity onPress={fetchAttendanceDetails} style={{ padding: 4 }}>
          <Text style={{ fontSize: 16 }}>🔄</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0284C7']} />}
      >
        {/* TODAY'S ATTENDANCE CARD */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Today's Attendance Status</Text>
            <View style={[styles.statusBadge, hasCheckIn && styles.statusBadgePresent]}>
              <Text style={[styles.statusBadgeText, hasCheckIn && styles.statusBadgeTextPresent]}>
                {statusStr}
              </Text>
            </View>
          </View>

          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>CHECK-IN</Text>
              <Text style={styles.metricVal}>{formatTimeStr(record?.check_in_time)}</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>CHECK-OUT</Text>
              <Text style={styles.metricVal}>{formatTimeStr(record?.check_out_time)}</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>ENVIRONMENT</Text>
              <Text style={styles.metricValSub}>{record?.matched_environment_code || '--'}</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>VERIFICATION</Text>
              <Text style={styles.metricValSub}>{record?.verification_reference || '--'}</Text>
            </View>
          </View>

          {/* Action Button (Check-In or Check-Out) */}
          {!hasCheckIn ? (
            <TouchableOpacity
              style={[styles.actionBtn, submittingAction && { opacity: 0.6 }]}
              onPress={handleInitiateCheckIn}
              disabled={submittingAction}
            >
              {submittingAction ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.actionBtnText}>Mark Check-In (Face Verify) 📸</Text>
              )}
            </TouchableOpacity>
          ) : !hasCheckOut ? (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnCheckOut, submittingAction && { opacity: 0.6 }]}
              onPress={handleInitiateCheckOut}
              disabled={submittingAction}
            >
              {submittingAction ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.actionBtnText}>Mark Check-Out (Face Verify) ➔</Text>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.completedBanner}>
              <Text style={styles.completedText}>✓ Attendance Completed for Today</Text>
            </View>
          )}
        </View>

        {/* MONTHLY SUMMARY CARD */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Monthly Summary ({summaryData?.monthName || 'Current Month'})</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryBox}>
              <Text style={[styles.summaryNum, { color: '#10B981' }]}>{summaryData?.presentDays ?? 0}</Text>
              <Text style={styles.summaryLabel}>Present</Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={[styles.summaryNum, { color: '#F59E0B' }]}>{summaryData?.lateDays ?? 0}</Text>
              <Text style={styles.summaryLabel}>Late</Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={[styles.summaryNum, { color: '#F97316' }]}>{summaryData?.halfDays ?? 0}</Text>
              <Text style={styles.summaryLabel}>Half Day</Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={[styles.summaryNum, { color: '#8B5CF6' }]}>{summaryData?.leaveDays ?? 0}</Text>
              <Text style={styles.summaryLabel}>Leave</Text>
            </View>
          </View>
        </View>

        {/* ATTENDANCE HISTORY TABLE */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Attendance History</Text>
          {loading ? (
            <ActivityIndicator style={{ marginVertical: 20 }} color="#0284C7" />
          ) : historyData.length === 0 ? (
            <Text style={styles.emptyText}>No attendance records found.</Text>
          ) : (
            <View style={styles.historyTable}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { flex: 1.2 }]}>DATE</Text>
                <Text style={[styles.th, { flex: 1.2 }]}>STATUS</Text>
                <Text style={[styles.th, { flex: 1 }]}>IN</Text>
                <Text style={[styles.th, { flex: 1 }]}>OUT</Text>
                <Text style={[styles.th, { flex: 1 }]}>SRC</Text>
              </View>

              {historyData.map((item, idx) => (
                <View key={item.id || idx} style={styles.tableRow}>
                  <Text style={[styles.tdBold, { flex: 1.2 }]}>{formatDateStr(item.attendance_date)}</Text>
                  <Text style={[styles.tdStatus, { flex: 1.2 }]}>{item.status}</Text>
                  <Text style={[styles.td, { flex: 1 }]}>{formatTimeStr(item.check_in_time)}</Text>
                  <Text style={[styles.td, { flex: 1 }]}>{formatTimeStr(item.check_out_time)}</Text>
                  <Text style={[styles.tdBadge, { flex: 1 }]}>{item.source || 'MOBILE'}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* VERIFICATION PIPELINE MODAL */}
      <MobileAttendanceVerificationModal
        visible={verificationModalVisible}
        actionType={activeActionType}
        onClose={() => setVerificationModalVisible(false)}
        onSuccess={handleVerificationPassed}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
  },
  header: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  backBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800'
  },
  scroll: {
    padding: 16,
    paddingBottom: 40
  },

  // Coming Soon Styles
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30
  },
  comingSoonIcon: {
    fontSize: 54,
    marginBottom: 16
  },
  comingSoonTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8
  },
  comingSoonDesc: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20
  },
  comingSoonBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20
  },
  comingSoonBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0369A1'
  },

  // Card Styles
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A'
  },
  statusBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B'
  },
  statusBadgePresent: {
    backgroundColor: '#ECFDF5'
  },
  statusBadgeTextPresent: {
    color: '#059669'
  },

  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16
  },
  metricItem: {
    width: '47%',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 4
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A'
  },
  metricValSub: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7'
  },

  // Action Buttons
  actionBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center'
  },
  actionBtnCheckOut: {
    backgroundColor: '#EA580C'
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  },
  completedBanner: {
    backgroundColor: '#F0FDF4',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0'
  },
  completedText: {
    color: '#16A34A',
    fontWeight: '800',
    fontSize: 13
  },

  // Monthly Summary
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12
  },
  summaryBox: {
    alignItems: 'center',
    flex: 1
  },
  summaryNum: {
    fontSize: 20,
    fontWeight: '900'
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2
  },

  // History Table
  historyTable: {
    marginTop: 10
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 8,
    marginBottom: 8
  },
  th: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B'
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  tdBold: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A'
  },
  tdStatus: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669'
  },
  td: {
    fontSize: 11,
    color: '#334155'
  },
  tdBadge: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#0284C7'
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginVertical: 14
  }
});
