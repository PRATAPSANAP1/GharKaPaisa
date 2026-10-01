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

  // Fetch Attendance Data
  const fetchAttendanceDetails = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchAttendanceDetails();
  }, [fetchAttendanceDetails]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAttendanceDetails();
  };

  // Trigger Start Work Flow
  const handleInitiateCheckIn = async () => {
    const net = await NetInfo.fetch();
    if (!net.isConnected) {
      Alert.alert('Network Error', 'Internet connection is required to verify attendance.');
      return;
    }

    setActiveActionType('CHECK_IN');
    setVerificationModalVisible(true);
  };

  // Trigger End Work Flow
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
          Alert.alert('Work Started 🎉', 'Your work session start time has been recorded with biometric verification.');
        }
      } else {
        const res = await executeCheckOut(sessionId);
        if (res?.success) {
          Alert.alert('Work Ended 🎉', 'Your work session end time has been recorded.');
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
    if (!isoString) return '--:--';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return '--:--';
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

  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return '--';
    try {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const diffMs = end - start;
      if (diffMs <= 0) return '0h 0m';
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m`;
    } catch (e) {
      return '--';
    }
  };

  const record = todayData?.attendance || null;
  const hasCheckIn = Boolean(record?.check_in_time);
  const hasCheckOut = Boolean(record?.check_out_time);
  const workStatusStr = !hasCheckIn ? 'Not Started' : !hasCheckOut ? 'Working' : 'Work Completed';

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
            <Text style={styles.cardTitle}>Today's Work Session</Text>
            <View style={[
              styles.statusBadge,
              hasCheckIn && !hasCheckOut && styles.statusBadgeWorking,
              hasCheckIn && hasCheckOut && styles.statusBadgeCompleted
            ]}>
              <Text style={[
                styles.statusBadgeText,
                hasCheckIn && !hasCheckOut && styles.statusBadgeTextWorking,
                hasCheckIn && hasCheckOut && styles.statusBadgeTextCompleted
              ]}>
                {workStatusStr}
              </Text>
            </View>
          </View>

          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>START WORK TIME</Text>
              <Text style={styles.metricVal}>{formatTimeStr(record?.check_in_time)}</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>END WORK TIME</Text>
              <Text style={styles.metricVal}>{formatTimeStr(record?.check_out_time)}</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>WORK DURATION</Text>
              <Text style={styles.metricValSub}>{calculateDuration(record?.check_in_time, record?.check_out_time)}</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>VERIFICATION</Text>
              <Text style={styles.metricValSub}>{record?.verification_reference || 'Face Verified'}</Text>
            </View>
          </View>

          {/* Action Button (Start Work or End Work) */}
          {!hasCheckIn ? (
            <TouchableOpacity
              style={[styles.actionBtn, submittingAction && { opacity: 0.6 }]}
              onPress={handleInitiateCheckIn}
              disabled={submittingAction}
            >
              {submittingAction ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.actionBtnText}>START WORK 📸</Text>
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
                <Text style={styles.actionBtnText}>END WORK ➔</Text>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.completedBanner}>
              <Text style={styles.completedText}>✓ Work Session Completed for Today</Text>
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
                <Text style={[styles.th, { flex: 1 }]}>START</Text>
                <Text style={[styles.th, { flex: 1 }]}>END</Text>
                <Text style={[styles.th, { flex: 1 }]}>SRC</Text>
              </View>

              {historyData.map((item, idx) => (
                <View key={item.id || idx} style={styles.tableRow}>
                  <Text style={[styles.tdBold, { flex: 1.2 }]}>{formatDateStr(item.attendance_date)}</Text>
                  <Text style={[styles.tdStatus, { flex: 1.2 }]}>
                    {item.check_in_time && item.check_out_time ? 'Completed' : item.check_in_time ? 'Working' : 'Not Started'}
                  </Text>
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
  statusBadgeWorking: {
    backgroundColor: '#FEF3C7'
  },
  statusBadgeTextWorking: {
    color: '#D97706'
  },
  statusBadgeCompleted: {
    backgroundColor: '#ECFDF5'
  },
  statusBadgeTextCompleted: {
    color: '#059669'
  },
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
    fontSize: 9.5,
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
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7'
  },
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
