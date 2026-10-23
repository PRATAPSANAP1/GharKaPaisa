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
  Modal,
  TextInput,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
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
  const [activeTab, setActiveTab] = useState<'today' | 'history' | 'enrollment'>('today');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ── Biometric Enrolment ────────────────────────────────────────
  const [missingList, setMissingList] = useState<any[]>([]);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [biometricModalVisible, setBiometricModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [faceImage, setFaceImage] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [enrollReason, setEnrollReason] = useState('');
  const [enrollBusy, setEnrollBusy] = useState(false);

  const loadTodayAttendance = async () => {
    try {
      setError(null);
      const res = await apiClient.get('/attendance/admin/today', {
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
      const res = await apiClient.get('/attendance/admin/history', {
        params: {
          startDate: selectedDate,
          endDate: selectedDate,
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

  const loadMissingEnrollments = async () => {
    try {
      setError(null);
      setEnrollmentLoading(true);
      const res = await apiClient.get('/attendance/enrollment/missing');
      const list = res.data?.data?.employees || res.data?.employees || [];
      setMissingList(Array.isArray(list) ? list : []);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load missing enrollments');
    } finally {
      setEnrollmentLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'today') {
      loadTodayAttendance();
    } else if (activeTab === 'history') {
      loadHistoryAttendance();
    } else {
      loadMissingEnrollments();
    }
  }, [activeTab, selectedDate]);

  const onRefresh = () => {
    setRefreshing(true);
    if (activeTab === 'today') {
      loadTodayAttendance();
    } else if (activeTab === 'history') {
      loadHistoryAttendance();
    } else {
      loadMissingEnrollments();
    }
  };

  // ── Biometric enrolment actions ────────────────────────────────
  const openBiometricModal = (emp: any) => {
    setSelectedEmployee(emp);
    setFaceImage(null);
    setEnrollReason('');
    setBiometricModalVisible(true);
  };

  const captureFace = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Required', 'Camera access is needed to capture the employee face.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      cameraType: ImagePicker.CameraType.front,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setFaceImage({
        uri: asset.uri,
        name: asset.fileName || `face_${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      });
    }
  };

  const submitBiometricEnrollment = async () => {
    if (!faceImage) {
      Alert.alert('Missing Data', 'Capture a face photograph before submitting.');
      return;
    }
    try {
      setEnrollBusy(true);

      // Re-enrollment sessions require a reason of at least 5 characters.
      const reason = enrollReason.trim().length >= 5
        ? enrollReason.trim()
        : 'Super Admin biometric enrollment';

      const sessionRes = await apiClient.post('/attendance/enrollment/re-enrollment/session', {
        employee_id: selectedEmployee?.employee_id || selectedEmployee?.id,
        reason,
      });
      const token = sessionRes.data?.data?.sessionToken || sessionRes.data?.data?.session_token;
      if (!token) {
        Alert.alert('Unavailable', 'Could not start an enrollment session for this employee.');
        return;
      }

      const formData = new FormData();
      formData.append('session_token', token);
      formData.append('reason', reason);
      formData.append('face_image', {
        uri: faceImage.uri,
        name: faceImage.name,
        type: faceImage.type,
      } as any);

      await apiClient.post('/attendance/enrollment/re-enrollment/commit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setBiometricModalVisible(false);
      Alert.alert('Enrolled', `Biometric reference updated for ${selectedEmployee?.full_name || 'employee'}.`);
      loadMissingEnrollments();
    } catch (err: any) {
      Alert.alert('Failed', err.response?.data?.message || 'Could not commit biometric enrollment');
    } finally {
      setEnrollBusy(false);
    }
  };

  const sendReminder = async (emp: any) => {
    try {
      await apiClient.post('/attendance/enrollment/reminder', {
        employee_id: emp.employee_id || emp.id,
        message: 'Please complete your face verification enrollment.',
      });
      Alert.alert('Reminder Sent', `A face-verification reminder was sent to ${emp.full_name || 'the employee'}.`);
      loadMissingEnrollments();
    } catch (err: any) {
      Alert.alert('Failed', err.response?.data?.message || 'Could not send reminder');
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
        <TouchableOpacity
          style={[styles.tab, activeTab === 'enrollment' && styles.activeTab]}
          onPress={() => setActiveTab('enrollment')}
        >
          <Text style={[styles.tabText, activeTab === 'enrollment' && styles.activeTabText]}>Biometric</Text>
        </TouchableOpacity>
      </View>

      {/* Date Picker */}
      {activeTab !== 'enrollment' && (
        <View style={styles.dateContainer}>
          <Text style={styles.dateLabel}>Date:</Text>
          <TouchableOpacity style={styles.dateButton}>
            <Text style={styles.dateText}>{selectedDate}</Text>
            <Icon name="calendar" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      {error && (
        <View style={styles.errorBanner}>
          <Icon name="alert-circle" size={18} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Summary Cards */}
      {activeTab !== 'enrollment' && summary && (
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

      {/* Biometric Enrolment Queue */}
      {activeTab === 'enrollment' ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Face Verification Pending</Text>

          {enrollmentLoading && missingList.length === 0 ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading employees...</Text>
            </View>
          ) : missingList.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Icon name="shield-check" size={48} color={colors.textLight} />
              <Text style={styles.emptyText}>All employees are enrolled</Text>
            </Card>
          ) : (
            missingList.map((emp) => (
              <Card key={emp.id || emp.employee_id} style={styles.recordCard}>
                <View style={styles.recordHeader}>
                  <View style={styles.recordInfo}>
                    <Text style={styles.recordName}>{emp.full_name || 'Employee'}</Text>
                    <Text style={styles.recordDetail}>{emp.designation || emp.department || '—'}</Text>
                    <Text style={styles.recordDetail}>{emp.employee_id}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: '#FEF3C7' }]}>
                    <Text style={[styles.statusText, { color: '#B45309' }]}>PENDING</Text>
                  </View>
                </View>

                <View style={styles.enrollActions}>
                  <TouchableOpacity
                    style={[styles.enrollBtn, { backgroundColor: colors.primary }]}
                    onPress={() => openBiometricModal(emp)}
                    disabled={enrollBusy}
                  >
                    <Icon name="camera" size={14} color="#fff" />
                    <Text style={styles.enrollBtnText}>Enroll Face</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.enrollBtn, { backgroundColor: '#F59E0B' }]}
                    onPress={() => sendReminder(emp)}
                  >
                    <Icon name="bell" size={14} color="#fff" />
                    <Text style={styles.enrollBtnText}>Send Reminder</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))
          )}
        </View>
      ) : (
      /* Attendance Records */
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
      )}

      {/* Biometric Enrollment Modal */}
      <Modal visible={biometricModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Biometric Face Enrollment</Text>
            <Text style={styles.modalSub}>
              Capture a live photograph for {selectedEmployee?.full_name || 'the employee'} to update the
              face verification reference.
            </Text>

            <TouchableOpacity style={styles.captureBox} onPress={captureFace} disabled={enrollBusy}>
              {faceImage ? (
                <Image source={{ uri: faceImage.uri }} style={styles.capturePreview} />
              ) : (
                <>
                  <Icon name="camera" size={32} color={colors.primary} />
                  <Text style={styles.captureText}>Tap to capture face</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.modalInputLabel}>Reason (optional)</Text>
            <TextInput
              style={styles.modalInput}
              value={enrollReason}
              onChangeText={setEnrollReason}
              placeholder="e.g. Verification mismatch / new joiner"
              placeholderTextColor={colors.textLight}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setBiometricModalVisible(false)}
                disabled={enrollBusy}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, (!faceImage || enrollBusy) && { opacity: 0.6 }]}
                onPress={submitBiometricEnrollment}
                disabled={!faceImage || enrollBusy}
              >
                {enrollBusy ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmText}>Submit Enrollment</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  enrollActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  enrollBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
  },
  enrollBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  modalSub: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  captureBox: {
    height: 170,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  capturePreview: {
    width: '100%',
    height: '100%',
  },
  captureText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  modalInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textLight,
  },
  modalConfirmBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  modalConfirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
});
