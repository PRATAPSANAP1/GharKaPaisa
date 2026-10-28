import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Calendar, CheckCircle2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../../app/store/authStore';
import attendanceService from '../../../services/attendance.service';

import AttendanceDashboardCard from './components/AttendanceDashboardCard';
import AttendanceHistoryView from './components/AttendanceHistoryView';
import AttendanceSummaryView from './components/AttendanceSummaryView';
import AttendanceVerificationModal from './AttendanceVerificationModal';
import FaceVerificationModal from '../profile/FaceVerificationModal';

export default function EmployeeAttendance() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  // Active view: 'DASHBOARD' | 'HISTORY' | 'SUMMARY'
  const [activeView, setActiveView] = useState('DASHBOARD');

  // Biometric status: null (loading), true (enrolled), false (missing)
  const [isFaceEnrolled, setIsFaceEnrolled] = useState(null);
  const [faceEnrollModalOpen, setFaceEnrollModalOpen] = useState(false);

  const [todayAttendance, setTodayAttendance] = useState(null);
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState({
    present: 0,
    completed: 0,
    late: 0,
    halfDay: 0,
    leave: 0,
    absent: 0,
    total: 0,
    formattedHours: '0h 0m',
    totalHours: 0
  });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionType, setActionType] = useState('CHECK_IN');

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const fetchAttendanceData = useCallback(async () => {
    try {
      setLoading(true);
      const [todayRes, historyRes, summaryRes, enrollRes] = await Promise.allSettled([
        attendanceService.getTodayAttendance(),
        attendanceService.getMyAttendance(selectedMonth, selectedYear),
        attendanceService.getMySummary(selectedMonth, selectedYear),
        attendanceService.getEnrollmentStatus()
      ]);

      if (enrollRes.status === 'fulfilled' && enrollRes.value) {
        const data = enrollRes.value?.data || enrollRes.value;
        const isEnrolled = typeof data?.is_enrolled === 'boolean'
          ? data.is_enrolled
          : (data?.status === 'ACTIVE');
        setIsFaceEnrolled(!!isEnrolled);
      } else {
        setIsFaceEnrolled(false);
      }

      if (todayRes.status === 'fulfilled' && todayRes.value) {
        setTodayAttendance(todayRes.value.data || todayRes.value || null);
      }

      if (historyRes.status === 'fulfilled' && historyRes.value) {
        const hData = historyRes.value?.data || historyRes.value;
        const records = Array.isArray(hData)
          ? hData
          : Array.isArray(hData?.records)
            ? hData.records
            : [];
        setHistory(records);
      } else {
        setHistory([]);
      }

      if (summaryRes.status === 'fulfilled' && summaryRes.value) {
        const s = summaryRes.value?.data || summaryRes.value || {};
        setSummary({
          present: s.totalPresent ?? s.present_days ?? s.present ?? s.total_present ?? 0,
          completed: s.totalCompleted ?? s.completed_days ?? s.completed ?? s.total_completed ?? 0,
          late: s.totalLate ?? s.late_days ?? s.late ?? s.total_late ?? 0,
          halfDay: s.totalHalfDay ?? s.half_days ?? s.total_half_day ?? 0,
          leave: s.totalLeave ?? s.leave_days ?? s.total_leave ?? 0,
          absent: s.totalAbsent ?? s.absent_days ?? s.absent ?? s.total_absent ?? 0,
          total: s.totalWorkingDays ?? s.total_working_days ?? s.working_days ?? s.totalDays ?? s.total_days ?? s.totalMarkedDays ?? 0,
          totalWorkingDays: s.totalWorkingDays ?? s.total_working_days ?? s.working_days ?? s.totalDays ?? s.total_days ?? 0,
          attendancePercentage: s.attendancePercentage ?? s.attendance_percentage ?? s.attendancePct ?? 0,
          formattedHours: s.totalWorkingHoursFormatted || s.total_working_hours_formatted || '0h 0m',
          totalHours: typeof s.totalHours === 'number' ? s.totalHours : (s.total_hours ?? 0)
        });
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  const isCheckedIn = !!todayAttendance?.check_in_time;
  const isCheckedOut = !!todayAttendance?.check_out_time;

  const handleStartVerification = useCallback(() => {
    if (isFaceEnrolled === false) {
      navigate('/employee/kyc?step=4');
      return;
    }

    if (!isCheckedIn) {
      setActionType('CHECK_IN');
    } else {
      setActionType('CHECK_OUT');
    }
    setIsModalOpen(true);
  }, [isCheckedIn, isFaceEnrolled, navigate]);

  const handleVerificationSuccess = useCallback(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  const handleFaceEnrollmentSuccess = useCallback(() => {
    setIsFaceEnrolled(true);
    setFaceEnrollModalOpen(false);
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  const exportCSV = useCallback(() => {
    const safeHistory = Array.isArray(history) ? history : (history?.records || []);
    if (!safeHistory || safeHistory.length === 0) return;
    const headers = ['Date', 'Status', 'Start Work Time', 'End Work Time', 'Total Duration', 'Biometric Status'];
    const rows = safeHistory.map(item => [
      item.date || item.attendance_date ? new Date(item.date || item.attendance_date).toLocaleDateString('en-US') : '--',
      item.check_in_time && item.check_out_time ? 'Work Completed' : item.check_in_time ? 'Working' : 'Not Started',
      item.check_in_time ? new Date(item.check_in_time).toLocaleTimeString('en-US') : '--',
      item.check_out_time ? new Date(item.check_out_time).toLocaleTimeString('en-US') : '--',
      item.total_hours ? `${item.total_hours} hrs` : '--',
      item.verification_status || 'VERIFIED'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_Report_${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [history, selectedMonth, selectedYear]);

  const formatTime = (timeStr) => {
    if (!timeStr) return '--:--';
    try {
      return new Date(timeStr).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return timeStr;
    }
  };

  return (
    <div style={{
      padding: 'clamp(8px, 2vw, 20px) 0',
      maxWidth: '1120px',
      margin: '0 auto',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      {/* PANEL 1: MAIN ATTENDANCE DASHBOARD VIEW */}
      {activeView === 'DASHBOARD' && (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}
        >
          {/* Top Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={() => navigate('/employee/dashboard')}
                aria-label="Go back"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '10px',
                  padding: '8px 10px',
                  cursor: 'pointer',
                  color: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                }}
              >
                <ArrowLeft size={18} />
              </button>

              <div>
                <h1 style={{
                  fontSize: '26px',
                  fontWeight: 700,
                  color: '#111827',
                  margin: 0,
                  letterSpacing: '-0.4px'
                }}>
                  Attendance
                </h1>
                <p style={{
                  fontSize: '13.5px',
                  color: '#6B7280',
                  margin: '2px 0 0'
                }}>
                  Track your daily attendance
                </p>
              </div>
            </div>
          </div>

          {/* SCREEN 12: ATTENDANCE PAGE WHEN FACE VERIFICATION IS MISSING */}
          {loading && isFaceEnrolled === null ? (
            <div style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              border: '1px solid #E5E7EB',
              padding: '48px 28px',
              maxWidth: '480px',
              width: '100%',
              margin: '12px auto',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.04)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '15px', color: '#6B7280', fontWeight: 600 }}>
                Loading attendance details...
              </div>
            </div>
          ) : isFaceEnrolled === false ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                background: '#FFFFFF',
                borderRadius: '20px',
                border: '1px solid #E5E7EB',
                padding: '36px 28px',
                maxWidth: '480px',
                width: '100%',
                margin: '12px auto',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.04)',
                textAlign: 'center'
              }}
            >
              {/* Date & Time */}
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#111827', marginBottom: '20px' }}>
                {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </div>

              {/* Warning Card */}
              <div style={{
                background: '#FFFBEB',
                border: '1px solid #FDE68A',
                borderRadius: '16px',
                padding: '20px 18px',
                marginBottom: '24px',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: '#FEF3C7',
                  color: '#D97706',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px'
                }}>
                  <AlertTriangle size={24} />
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#92400E', margin: '0 0 6px' }}>
                  Face Verification Required
                </h3>
                <p style={{ fontSize: '13px', color: '#78350F', margin: 0, lineHeight: 1.45 }}>
                  KYC Step 4 face verification is not completed for your account. Please complete face verification before marking attendance.
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  id="direct-verify-face-btn"
                  onClick={() => navigate('/employee/kyc?step=4')}
                  style={{
                    width: '100%',
                    height: '50px',
                    borderRadius: '12px',
                    border: 'none',
                    background: '#0B74F6',
                    color: '#FFFFFF',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(11, 116, 246, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <ShieldCheck size={18} /> Verify
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/employee/dashboard')}
                  style={{
                    width: '100%',
                    height: '44px',
                    borderRadius: '12px',
                    border: '1px solid #E5E7EB',
                    background: '#FFFFFF',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Back to Dashboard
                </button>
              </div>
            </motion.div>
          ) : (
            /* NORMAL ATTENDANCE CARD (PANEL 1) */
            <div style={{ margin: '12px 0 8px', width: '100%' }}>
              <AttendanceDashboardCard
                onStartVerification={handleStartVerification}
                isCheckedIn={isCheckedIn}
                isCheckedOut={isCheckedOut}
                loading={loading}
                reminder={todayAttendance?.reminder}
                workingHours={todayAttendance?.working_hours}
                onNavigateHistory={() => setActiveView('HISTORY')}
                onNavigateSummary={() => setActiveView('SUMMARY')}
              />
            </div>
          )}

          {/* Today's Activity Card */}
          {(isCheckedIn || isCheckedOut) && (
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '18px',
              padding: '20px 24px',
              maxWidth: '480px',
              width: '100%',
              margin: '0 auto',
              boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#111827',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Clock size={16} color="#0B74F6" /> Today's Session
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px'
              }}>
                <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '12px', border: '1px solid #F3F4F6' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>
                    Start Time
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginTop: '4px' }}>
                    {formatTime(todayAttendance?.check_in_time)}
                  </div>
                </div>

                <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '12px', border: '1px solid #F3F4F6' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>
                    End Time
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: isCheckedOut ? '#111827' : '#9CA3AF', marginTop: '4px' }}>
                    {formatTime(todayAttendance?.check_out_time)}
                  </div>
                </div>
              </div>

              <div style={{
                marginTop: '12px',
                paddingTop: '10px',
                borderTop: '1px solid #F3F4F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '12.5px'
              }}>
                <span style={{ color: '#6B7280' }}>Verification:</span>
                <span style={{ color: '#16A34A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={14} /> Biometric Verified
                </span>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* SECTION 13: ATTENDANCE HISTORY VIEW */}
      {activeView === 'HISTORY' && (
        <AttendanceHistoryView
          history={history}
          summary={summary}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          onExportCSV={exportCSV}
          onBackToDashboard={() => setActiveView('DASHBOARD')}
        />
      )}

      {/* SECTION 14: ATTENDANCE SUMMARY VIEW */}
      {activeView === 'SUMMARY' && (
        <AttendanceSummaryView
          summary={summary}
          history={history}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          onBackToDashboard={() => setActiveView('DASHBOARD')}
        />
      )}

      {/* Attendance Verification Modal (Panels 2 to 10) */}
      {isModalOpen && (
        <AttendanceVerificationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleVerificationSuccess}
          actionType={actionType}
          user={user}
        />
      )}

      {/* Face Verification Enrollment Modal (Screens 2 to 6) */}
      {faceEnrollModalOpen && (
        <FaceVerificationModal
          isOpen={faceEnrollModalOpen}
          onClose={() => setFaceEnrollModalOpen(false)}
          onSuccess={handleFaceEnrollmentSuccess}
        />
      )}
    </div>
  );
}
