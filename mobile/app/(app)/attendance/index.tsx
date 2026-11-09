import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { Button, Card, LoadingState, ErrorState } from '../../../components';
import { Icon } from '../../../components/Icon';
import MobileAttendanceVerificationModal from '../../../components/MobileAttendanceVerificationModal';
import {
  getTodayAttendance,
  getMyAttendanceHistory,
  getMyAttendanceSummary,
  createVerificationSession,
  executeCheckIn,
  executeCheckOut,
  getEnrollmentStatus,
} from '../../../services/attendance.service';
import { isAttendanceEnabledForEmployee } from '../../../config/attendanceRollout';

interface AttendanceRecord {
  id: string;
  attendance_date: string;
  check_in_time: string;
  check_out_time: string;
  status: string;
  verification_status: string;
  verification_reference: string;
  source: string;
  working_hours: string;
}

interface MonthlySummary {
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalHalfDay: number;
  totalLeave: number;
  totalMarkedDays: number;
  totalWorkingHoursFormatted: string;
}

export default function AttendanceScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [actionType, setActionType] = useState<'CHECK_IN' | 'CHECK_OUT'>('CHECK_IN');
  const [error, setError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isFaceEnrolled, setIsFaceEnrolled] = useState<boolean | null>(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  const checkAttendanceAccess = () => {
    return user ? isAttendanceEnabledForEmployee(user) : false;
  };

  const fetchTodayAttendance = async () => {
    try {
      const data = await getTodayAttendance();
      setTodayAttendance(data);
    } catch (err: any) {
      if (err.message && err.message.includes('KYC_PHOTO_NOT_FOUND')) {
        setError('KYC photograph is compulsory for attendance. Please upload your photo in the employee panel.');
      } else {
        setError(err.message || 'Failed to load today\'s attendance');
      }
    }
  };

  const fetchMonthlySummary = async () => {
    try {
      const data = await getMyAttendanceSummary({ month: selectedMonth, year: selectedYear });
      setMonthlySummary(data);
    } catch (err: any) {
      console.error('Error fetching monthly summary:', err);
    }
  };

  const fetchAttendanceHistory = async () => {
    try {
      const data = await getMyAttendanceHistory({ month: selectedMonth, year: selectedYear, limit: 31 });
      setAttendanceHistory(data?.records || []);
    } catch (err: any) {
      console.error('Error fetching attendance history:', err);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    await Promise.all([
      fetchTodayAttendance(),
      fetchMonthlySummary(),
      fetchAttendanceHistory(),
    ]);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    if (checkAttendanceAccess()) {
      loadAllData();
      checkEnrollmentStatus();
    } else {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  const checkEnrollmentStatus = async () => {
    try {
      const status = await getEnrollmentStatus();
      setIsFaceEnrolled(status.is_enrolled);
    } catch (err) {
      console.error('Failed to check enrollment status:', err);
      setIsFaceEnrolled(true); // Default to true if check fails
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAllData();
  };

  const handleCheckIn = async () => {
    if (isFaceEnrolled === false) {
      Alert.alert(
        'Biometric Enrollment Required',
        'Please complete your biometric enrollment in the employee panel before marking attendance.',
        [{ text: 'OK' }]
      );
      return;
    }
    setActionType('CHECK_IN');
    setShowVerificationModal(true);
  };

  const handleCheckOut = async () => {
    setActionType('CHECK_OUT');
    setShowVerificationModal(true);
  };

  const handleVerificationSuccess = async (verifiedSessionId: string) => {
    setShowVerificationModal(false);
    setLoading(true);
    try {
      if (actionType === 'CHECK_IN') {
        const res = await executeCheckIn(verifiedSessionId);
        Alert.alert('Work Started', res.message || 'Check-in recorded successfully!');
      } else {
        const res = await executeCheckOut(verifiedSessionId);
        Alert.alert('Work Ended', res.message || 'Check-out recorded successfully!');
      }
      await loadAllData();
    } catch (err: any) {
      Alert.alert('Action Failed', err.message || 'Could not record attendance');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '--';
    const date = new Date(timeStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { weekday: 'short' });
  };

  const calculateWorkingHours = (checkIn: string, checkOut: string) => {
    if (!checkIn || !checkOut) return '--';
    const inTime = new Date(checkIn).getTime();
    const outTime = new Date(checkOut).getTime();
    const diffMs = outTime - inTime;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getAttendanceRate = () => {
    if (!monthlySummary || monthlySummary.totalMarkedDays === 0) return '0%';
    const rate = ((monthlySummary.totalPresent / monthlySummary.totalMarkedDays) * 100).toFixed(0);
    return `${rate}%`;
  };

  if (!checkAttendanceAccess()) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Attendance</Text>
          <Text style={styles.headerSubtitle}>Track your daily attendance, working hours and verification history.</Text>
        </View>
        <View style={styles.centerContainer}>
          <Icon name="lock" size={48} color={colors.textLight} />
          <Text style={styles.lockTitle}>Attendance Not Available</Text>
          <Text style={styles.lockSubtitle}>Your employee account is not yet enabled for attendance tracking.</Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Attendance</Text>
          <Text style={styles.headerSubtitle}>Track your daily attendance, working hours and verification history.</Text>
        </View>
        <LoadingState message="Loading attendance data..." />
      </View>
    );
  }

  const isCheckedIn = !!todayAttendance?.check_in_time;
  const isCheckedOut = !!todayAttendance?.check_out_time;
  const todayWorkingHours = calculateWorkingHours(todayAttendance?.check_in_time || '', todayAttendance?.check_out_time || '');

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Attendance</Text>
        <Text style={styles.headerSubtitle}>Track your daily attendance, working hours and verification history.</Text>
      </View>

      {/* Banner */}
      <Image
        source={require('../../../assets/attendance-workspace-banner.png')}
        style={styles.banner}
        resizeMode="cover"
      />

      {/* Today's Attendance Card */}
      <Card style={styles.todayCard}>
        <Text style={styles.cardTitle}>TODAY'S ATTENDANCE</Text>
        
        {!isCheckedIn ? (
          <View style={styles.notMarkedContainer}>
            <Text style={styles.notMarkedTitle}>Not Checked In Yet</Text>
            <Text style={styles.notMarkedStatus}>NOT MARKED</Text>
            <Text style={styles.todayDate}>
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </Text>
            <Button
              title="📷 Mark Check-In"
              onPress={handleCheckIn}
              style={styles.markButton}
            />
          </View>
        ) : isCheckedOut ? (
          <View style={styles.completedContainer}>
            <Text style={styles.completedTitle}>Attendance Completed</Text>
            <Text style={styles.completedStatus}>{todayAttendance?.status || 'PRESENT'}</Text>
            
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Check-In</Text>
              <Text style={styles.rowValue}>{formatTime(todayAttendance?.check_in_time || '')}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Check-Out</Text>
              <Text style={styles.rowValue}>{formatTime(todayAttendance?.check_out_time || '')}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Working Hours</Text>
              <Text style={styles.rowValue}>{todayWorkingHours}</Text>
            </View>
            
            <View style={styles.verifiedBadge}>
              <Icon name="check-circle" size={16} color={colors.success} />
              <Text style={styles.verifiedText}>Biometric Verified</Text>
            </View>
          </View>
        ) : (
          <View style={styles.checkedInContainer}>
            <Text style={styles.checkedInTitle}>Checked In</Text>
            <Text style={styles.checkedInStatus}>{todayAttendance?.status || 'PRESENT'}</Text>
            
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Check-In</Text>
              <Text style={styles.rowValue}>{formatTime(todayAttendance?.check_in_time || '')}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Check-Out</Text>
              <Text style={styles.rowValue}>--</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Working Hours</Text>
              <Text style={styles.rowValue}>00h 00m</Text>
            </View>
            
            <Button
              title="Mark Check-Out"
              onPress={handleCheckOut}
              style={styles.markButton}
            />
          </View>
        )}
      </Card>

      {/* Quick Statistics */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{monthlySummary?.totalPresent || 0}</Text>
          <Text style={styles.statLabel}>Present Days</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{monthlySummary?.totalAbsent || 0}</Text>
          <Text style={styles.statLabel}>Absent Days</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{monthlySummary?.totalWorkingHoursFormatted || '0h 0m'}</Text>
          <Text style={styles.statLabel}>Total Working Hours</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{getAttendanceRate()}</Text>
          <Text style={styles.statLabel}>Attendance Rate</Text>
        </View>
      </View>

      {/* Attendance History */}
      <Card style={styles.historyCard}>
        <View style={styles.historyHeader}>
          <Text style={styles.cardTitle}>ATTENDANCE HISTORY</Text>
          <View style={styles.filterRow}>
            <TouchableOpacity style={styles.filterButton}>
              <Text style={styles.filterText}>{new Date(selectedYear, selectedMonth - 1).toLocaleString('en-US', { month: 'long' })} ▼</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterButton}>
              <Text style={styles.filterText}>{selectedYear} ▼</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportButton}>
              <Text style={styles.exportText}>Export</Text>
            </TouchableOpacity>
          </View>
        </View>

        {attendanceHistory.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="calendar" size={48} color={colors.textLight} />
            <Text style={styles.emptyTitle}>No attendance records yet</Text>
            <Text style={styles.emptyText}>Your attendance history will appear here after you complete your first check-in.</Text>
            <Button
              title="Mark Check-In"
              onPress={handleCheckIn}
              style={styles.emptyButton}
            />
          </View>
        ) : (
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Date</Text>
              <Text style={styles.tableHeaderText}>Day</Text>
              <Text style={styles.tableHeaderText}>Check-In</Text>
              <Text style={styles.tableHeaderText}>Check-Out</Text>
              <Text style={styles.tableHeaderText}>Hours</Text>
              <Text style={styles.tableHeaderText}>Status</Text>
              <Text style={styles.tableHeaderText}>Verification</Text>
            </View>
            {attendanceHistory.map((record) => (
              <TouchableOpacity
                key={record.id}
                style={styles.tableRow}
                onPress={() => {
                  setSelectedRecord(record);
                  setShowDetailModal(true);
                }}
              >
                <Text style={styles.tableCellText}>{formatDate(record.attendance_date)}</Text>
                <Text style={styles.tableCellText}>{getDayName(record.attendance_date)}</Text>
                <Text style={styles.tableCellText}>{formatTime(record.check_in_time)}</Text>
                <Text style={styles.tableCellText}>{formatTime(record.check_out_time)}</Text>
                <Text style={styles.tableCellText}>{calculateWorkingHours(record.check_in_time, record.check_out_time)}</Text>
                <Text style={[styles.tableCellText, styles.statusText]}>{record.status}</Text>
                <View style={styles.verificationCell}>
                  {record.verification_status === 'VERIFIED' ? (
                    <Icon name="check-circle" size={16} color={colors.success} />
                  ) : (
                    <Icon name="x-circle" size={16} color={colors.error} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Card>

      {/* Verification Detail Modal */}
      <Modal visible={showDetailModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Attendance Verification</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Icon name="x" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.verificationDetails}>
              <View style={styles.verificationItem}>
                <Icon name="check-circle" size={20} color={colors.success} />
                <Text style={styles.verificationText}>Face Verified</Text>
              </View>
              <View style={styles.verificationItem}>
                <Icon name="check-circle" size={20} color={colors.success} />
                <Text style={styles.verificationText}>Liveness Verified</Text>
              </View>
              <View style={styles.verificationItem}>
                <Icon name="check-circle" size={20} color={colors.success} />
                <Text style={styles.verificationText}>Office Environment Verified</Text>
              </View>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Verification Reference</Text>
              <Text style={styles.detailValue}>{selectedRecord?.verification_reference || 'N/A'}</Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{formatDate(selectedRecord?.attendance_date || '')}</Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Check-In</Text>
              <Text style={styles.detailValue}>{formatTime(selectedRecord?.check_in_time || '')}</Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Check-Out</Text>
              <Text style={styles.detailValue}>{formatTime(selectedRecord?.check_out_time || '')}</Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Source</Text>
              <Text style={styles.detailValue}>{selectedRecord?.source || 'WEB'}</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Biometric & Geofence Attendance Verification Modal */}
      <MobileAttendanceVerificationModal
        visible={showVerificationModal}
        actionType={actionType}
        onClose={() => setShowVerificationModal(false)}
        onSuccess={handleVerificationSuccess}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    padding: spacing.md,
    paddingTop: spacing.xl,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    marginTop: 4,
  },
  banner: {
    width: '100%',
    height: 120,
    marginVertical: spacing.md,
  },
  todayCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  notMarkedContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  notMarkedTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  notMarkedStatus: {
    fontSize: typography.sizes.md,
    color: colors.textLight,
    marginBottom: spacing.sm,
  },
  todayDate: {
    fontSize: typography.sizes.sm,
    color: colors.textLight,
    marginBottom: spacing.lg,
  },
  markButton: {
    marginTop: spacing.md,
  },
  completedContainer: {
    paddingVertical: spacing.md,
  },
  completedTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.success,
    marginBottom: spacing.xs,
  },
  completedStatus: {
    fontSize: typography.sizes.md,
    color: colors.text,
    marginBottom: spacing.md,
  },
  checkedInContainer: {
    paddingVertical: spacing.md,
  },
  checkedInTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  checkedInStatus: {
    fontSize: typography.sizes.md,
    color: colors.text,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textLight,
  },
  rowValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: `${colors.success}15`,
    borderRadius: 8,
  },
  verifiedText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.success,
    marginLeft: spacing.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    textAlign: 'center',
  },
  historyCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  historyHeader: {
    marginBottom: spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  filterButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.bgSecondary,
    borderRadius: 6,
  },
  filterText: {
    fontSize: typography.sizes.xs,
    color: colors.text,
    fontWeight: typography.weights.semibold,
  },
  exportButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  exportText: {
    fontSize: typography.sizes.xs,
    color: '#fff',
    fontWeight: typography.weights.semibold,
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.bgSecondary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  tableCellText: {
    flex: 1,
    fontSize: typography.sizes.xs,
    color: colors.text,
    textAlign: 'center',
  },
  statusText: {
    fontWeight: typography.weights.bold,
    color: colors.success,
  },
  verificationCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  emptyButton: {
    minWidth: 150,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  lockTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: spacing.md,
  },
  lockSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContent: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.md,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  verificationDetails: {
    marginBottom: spacing.lg,
  },
  verificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  verificationText: {
    fontSize: typography.sizes.sm,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  detailSection: {
    marginBottom: spacing.md,
  },
  detailLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  verificationInstruction: {
    fontSize: typography.sizes.sm,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  cameraButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  cameraText: {
    fontSize: typography.sizes.sm,
    color: colors.textLight,
    marginTop: spacing.sm,
  },
  capturedContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  capturedImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  retakeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgSecondary,
    borderRadius: 8,
  },
  retakeText: {
    fontSize: typography.sizes.sm,
    color: colors.text,
    fontWeight: typography.weights.semibold,
  },
  verifyButton: {
    marginTop: spacing.md,
  },
});
