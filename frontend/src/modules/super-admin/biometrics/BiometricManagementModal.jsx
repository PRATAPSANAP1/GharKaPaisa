import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { 
  FaUserShield, FaCamera, FaCheckCircle, FaTimesCircle, FaHistory, 
  FaBuilding, FaUpload, FaSync, FaExclamationTriangle, FaLock, FaEye,
  FaBell, FaClock, FaSearch, FaPaperPlane, FaShieldAlt, FaListUl
} from 'react-icons/fa';
import axios from 'axios';
import { getApiV1Url } from '../../../config/api';

export default function BiometricManagementModal({ isOpen, onClose, employee = null }) {
  const { C } = useTheme();
  const [activeTab, setActiveTab] = useState('employee'); // 'employee' | 'missing_queue' | 'environment'

  // Employee Biometric State
  const [selectedEmp, setSelectedEmp] = useState(employee);
  const [statusData, setStatusData] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [signedPreviewUrl, setSignedPreviewUrl] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Re-Enrollment Modal State
  const [showReEnrollModal, setShowReEnrollModal] = useState(false);
  const [reEnrollReason, setReEnrollReason] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [reEnrollFile, setReEnrollFile] = useState(null);
  const [submittingReEnroll, setSubmittingReEnroll] = useState(false);

  // Send Reminder State
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderEmp, setReminderEmp] = useState(null);
  const [reminderMessage, setReminderMessage] = useState('Please complete your Face Verification photograph in the GharKaPaisa KYC module to activate daily biometric attendance.');
  const [reminderChannels, setReminderChannels] = useState({ inApp: true, whatsapp: true, email: false });
  const [sendingReminder, setSendingReminder] = useState(false);
  const [reminderAlert, setReminderAlert] = useState(null);

  // Reminder History State
  const [reminderHistory, setReminderHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Missing Queue State
  const [missingList, setMissingList] = useState([]);
  const [loadingMissing, setLoadingMissing] = useState(false);
  const [missingSearch, setMissingSearch] = useState('');
  const [batchSending, setBatchSending] = useState(false);

  // Environment References State
  const [envReferences, setEnvReferences] = useState([]);
  const [loadingEnv, setLoadingEnv] = useState(false);
  const [uploadingEnvCode, setUploadingEnvCode] = useState(null);
  const [envFileMap, setEnvFileMap] = useState({});

  useEffect(() => {
    if (employee) {
      setSelectedEmp(employee);
    }
  }, [employee]);

  useEffect(() => {
    if (isOpen && selectedEmp?.id && activeTab === 'employee') {
      fetchEmployeeStatus(selectedEmp.id);
      fetchReminderHistory(selectedEmp.id);
    }
    if (isOpen && activeTab === 'missing_queue') {
      fetchMissingQueue();
    }
    if (isOpen && activeTab === 'environment') {
      fetchEnvironmentReferences();
    }
  }, [isOpen, selectedEmp, activeTab]);

  const fetchEmployeeStatus = async (empId) => {
    if (!empId) return;
    setLoadingStatus(true);
    setSignedPreviewUrl('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${getApiV1Url()}/attendance/enrollment/employee/${empId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        setStatusData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch biometric status:', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  const fetchReminderHistory = async (empId) => {
    if (!empId) return;
    setLoadingHistory(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${getApiV1Url()}/attendance/enrollment/reminders/${empId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        setReminderHistory(res.data.data.reminders || []);
      }
    } catch (err) {
      console.warn('Failed to fetch reminder history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchMissingQueue = async () => {
    setLoadingMissing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${getApiV1Url()}/attendance/enrollment/missing`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        setMissingList(res.data.data.missing_employees || []);
      }
    } catch (err) {
      console.error('Failed to fetch missing enrollments:', err);
    } finally {
      setLoadingMissing(false);
    }
  };

  const fetchPreviewUrl = async () => {
    if (!selectedEmp?.id) return;
    setLoadingPreview(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${getApiV1Url()}/attendance/enrollment/preview/${selectedEmp.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        setSignedPreviewUrl(res.data.data.signedUrl);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to fetch signed preview URL');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleStartReEnrollment = async () => {
    if (!reEnrollReason || reEnrollReason.trim().length < 5) {
      alert('Please provide a valid reason (minimum 5 characters) for re-enrollment');
      return;
    }

    setSubmittingReEnroll(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${getApiV1Url()}/attendance/enrollment/re-enrollment/session`, {
        employee_id: selectedEmp.id,
        reason: reEnrollReason.trim(),
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success) {
        setSessionToken(res.data.data.sessionToken);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to initiate re-enrollment session');
    } finally {
      setSubmittingReEnroll(false);
    }
  };

  const handleCommitReEnrollment = async (e) => {
    e.preventDefault();
    if (!sessionToken) {
      alert('Session token missing. Please initiate re-enrollment session again.');
      return;
    }
    if (!reEnrollFile) {
      alert('Please select a replacement face photograph file.');
      return;
    }

    setSubmittingReEnroll(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('session_token', sessionToken);
      formData.append('face_image', reEnrollFile);

      const res = await axios.post(`${getApiV1Url()}/attendance/enrollment/re-enrollment/commit`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        }
      });

      if (res.data?.success) {
        alert('✓ Biometric face reference re-enrolled successfully!');
        setShowReEnrollModal(false);
        setReEnrollReason('');
        setSessionToken('');
        setReEnrollFile(null);
        fetchEmployeeStatus(selectedEmp.id);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Re-enrollment commit failed');
    } finally {
      setSubmittingReEnroll(false);
    }
  };

  const openReminderModal = (emp) => {
    setReminderEmp(emp || selectedEmp);
    setReminderMessage('Please complete your Face Verification photograph in the GharKaPaisa KYC module to activate daily biometric attendance.');
    setReminderAlert(null);
    setShowReminderModal(true);
  };

  const handleSendReminder = async () => {
    if (!reminderEmp?.id) return;
    setSendingReminder(true);
    setReminderAlert(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${getApiV1Url()}/attendance/enrollment/reminder`, {
        employee_id: reminderEmp.id,
        message: reminderMessage.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success) {
        setReminderAlert({ type: 'success', text: res.data.message || '✓ Verification reminder dispatched successfully!' });
        setTimeout(() => {
          setShowReminderModal(false);
          if (selectedEmp?.id === reminderEmp.id) {
            fetchReminderHistory(selectedEmp.id);
          }
          if (activeTab === 'missing_queue') {
            fetchMissingQueue();
          }
        }, 1200);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send reminder';
      setReminderAlert({ type: 'error', text: msg });
    } finally {
      setSendingReminder(false);
    }
  };

  const handleBatchRemindAll = async () => {
    if (missingList.length === 0) return;
    if (!window.confirm(`Send verification reminder notification to all ${missingList.length} employees with missing face biometrics?`)) {
      return;
    }

    setBatchSending(true);
    let successCount = 0;
    let throttledCount = 0;

    for (const emp of missingList) {
      try {
        const token = localStorage.getItem('token');
        await axios.post(`${getApiV1Url()}/attendance/enrollment/reminder`, {
          employee_id: emp.id,
          message: 'Please complete your KYC Face Verification to activate daily biometric attendance.'
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        successCount++;
      } catch (e) {
        if (e.response?.status === 429 || e.response?.data?.message?.includes('throttled')) {
          throttledCount++;
        }
      }
    }

    setBatchSending(false);
    alert(`Batch Complete: ${successCount} reminders sent.${throttledCount > 0 ? ` (${throttledCount} skipped due to 10-min anti-spam cooldown)` : ''}`);
    fetchMissingQueue();
  };

  const fetchEnvironmentReferences = async () => {
    setLoadingEnv(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${getApiV1Url()}/attendance/enrollment/environment`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        setEnvReferences(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch environment references:', err);
    } finally {
      setLoadingEnv(false);
    }
  };

  const handleUploadEnvRef = async (code, name, desc) => {
    const file = envFileMap[code];
    if (!file) {
      alert(`Please select an image file for ${code}`);
      return;
    }

    setUploadingEnvCode(code);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('reference_code', code);
      formData.append('reference_name', name);
      formData.append('capture_description', desc);
      formData.append('environment_image', file);

      const res = await axios.post(`${getApiV1Url()}/attendance/enrollment/environment`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        }
      });

      if (res.data?.success) {
        alert(`✓ Environment reference ${code} updated successfully!`);
        fetchEnvironmentReferences();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload environment reference');
    } finally {
      setUploadingEnvCode(null);
    }
  };

  if (!isOpen) return null;

  const filteredMissing = missingList.filter(emp => {
    if (!missingSearch.trim()) return true;
    const s = missingSearch.toLowerCase();
    return (
      (emp.full_name && emp.full_name.toLowerCase().includes(s)) ||
      (emp.employee_id && emp.employee_id.toLowerCase().includes(s)) ||
      (emp.employee_code && emp.employee_code.toLowerCase().includes(s)) ||
      (emp.mobile_number && emp.mobile_number.includes(s))
    );
  });

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '16px', fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px',
        width: '100%', maxWidth: '880px', maxHeight: '92vh', overflowY: 'auto',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)', padding: '28px', color: C.text
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: `1px solid ${C.border}`, paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaUserShield style={{ fontSize: '26px', color: C.teal || '#0F766E' }} />
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 900, margin: 0, color: C.text }}>
                BIOMETRIC ENROLLMENT & ENVIRONMENT DESK
              </h2>
              <span style={{ fontSize: '12px', color: C.textMid, fontWeight: 700 }}>
                Super Admin Biometric Reference Management & Missing Queue
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 900 }}>✕</button>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('employee')}
            style={{
              flex: 1, minWidth: '180px', padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer',
              background: activeTab === 'employee' ? (C.teal || '#0F766E') : C.bgSecondary,
              color: activeTab === 'employee' ? '#fff' : C.text, fontWeight: 800, fontSize: '13px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
          >
            <FaCamera /> Employee Face Reference {selectedEmp ? `(${selectedEmp.full_name})` : ''}
          </button>

          <button
            onClick={() => setActiveTab('missing_queue')}
            style={{
              flex: 1, minWidth: '180px', padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer',
              background: activeTab === 'missing_queue' ? (C.teal || '#0F766E') : C.bgSecondary,
              color: activeTab === 'missing_queue' ? '#fff' : C.text, fontWeight: 800, fontSize: '13px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
          >
            <FaBell /> Missing Face Queue {missingList.length > 0 ? `(${missingList.length})` : ''}
          </button>

          <button
            onClick={() => setActiveTab('environment')}
            style={{
              flex: 1, minWidth: '180px', padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer',
              background: activeTab === 'environment' ? (C.teal || '#0F766E') : C.bgSecondary,
              color: activeTab === 'environment' ? '#fff' : C.text, fontWeight: 800, fontSize: '13px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
          >
            <FaBuilding /> Approved Office Environments
          </button>
        </div>

        {/* TAB 1: EMPLOYEE BIOMETRIC REFERENCE */}
        {activeTab === 'employee' && (
          <div>
            {!selectedEmp ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: C.textMid, fontSize: '13px' }}>
                Select an employee from the directory or missing queue to inspect or re-enroll biometric reference images.
              </div>
            ) : loadingStatus ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: C.textMid }}>
                Loading biometric status for {selectedEmp.full_name}...
              </div>
            ) : (
              <div>
                {/* Status Card */}
                <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '18px', padding: '20px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h3 style={{ fontSize: '17px', fontWeight: 900, margin: '0 0 4px 0' }}>{selectedEmp.full_name}</h3>
                      <div style={{ fontSize: '12px', color: C.textMid, fontWeight: 700 }}>
                        Code: {selectedEmp.employee_code || selectedEmp.employee_id || selectedEmp.code || 'N/A'} | Designation: {selectedEmp.designation || 'Staff'} | Mobile: {selectedEmp.mobile_number}
                      </div>
                    </div>
                    <div>
                      <span style={{
                        padding: '6px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 900,
                        background: statusData?.is_enrolled ? '#D1FAE5' : '#FEF3C7',
                        color: statusData?.is_enrolled ? '#065F46' : '#92400E',
                        border: `1px solid ${statusData?.is_enrolled ? '#6EE7B7' : '#FCD34D'}`
                      }}>
                        {statusData?.is_enrolled ? '✓ BIOMETRIC ENROLLED (ACTIVE)' : '⚠️ FACE VERIFICATION MISSING'}
                      </span>
                    </div>
                  </div>

                  {statusData?.active_template ? (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px dashed ${C.border}`, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '12px' }}>
                      <div>
                        <span style={{ color: C.textMid, display: 'block', fontWeight: 700 }}>Template Version:</span>
                        <strong>v{statusData.active_template.version}</strong>
                      </div>
                      <div>
                        <span style={{ color: C.textMid, display: 'block', fontWeight: 700 }}>Enrollment Source:</span>
                        <strong>{statusData.active_template.enrollment_source}</strong>
                      </div>
                      <div>
                        <span style={{ color: C.textMid, display: 'block', fontWeight: 700 }}>Enrolled Date:</span>
                        <strong>{new Date(statusData.active_template.enrolled_at).toLocaleString()}</strong>
                      </div>
                      <div>
                        <span style={{ color: C.textMid, display: 'block', fontWeight: 700 }}>Enrolled By:</span>
                        <strong>{statusData.active_template.enrolled_by_name || 'System / KYC Capture'}</strong>
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: `1px dashed ${C.border}`, fontSize: '12.5px', color: '#92400E' }}>
                      ⚠️ No active biometric reference enrolled. Employee cannot mark biometric attendance until enrolled.
                    </div>
                  )}
                </div>

                {/* Actions Toolbar */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  {statusData?.is_enrolled && (
                    <button
                      onClick={fetchPreviewUrl}
                      disabled={loadingPreview}
                      style={{
                        padding: '10px 16px', borderRadius: '12px', background: C.bgSecondary,
                        border: `1px solid ${C.border}`, color: C.text, fontWeight: 800, fontSize: '12.5px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                      }}
                    >
                      <FaEye /> {loadingPreview ? 'Generating Signed URL...' : 'Preview Active Photo'}
                    </button>
                  )}

                  {!statusData?.is_enrolled && (
                    <button
                      onClick={() => openReminderModal(selectedEmp)}
                      style={{
                        padding: '10px 18px', borderRadius: '12px', background: '#D97706',
                        color: '#fff', border: 'none', fontWeight: 800, fontSize: '12.5px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                        boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)'
                      }}
                    >
                      <FaBell /> Send Face Verification Reminder
                    </button>
                  )}

                  <button
                    onClick={() => setShowReEnrollModal(true)}
                    style={{
                      padding: '10px 18px', borderRadius: '12px', background: C.teal || '#0F766E',
                      color: '#fff', border: 'none', fontWeight: 800, fontSize: '12.5px',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                      boxShadow: '0 4px 12px rgba(15,118,110,0.3)'
                    }}
                  >
                    <FaSync /> Authorize Super Admin Re-Enrollment
                  </button>
                </div>

                {/* Signed Image Preview Box */}
                {signedPreviewUrl && (
                  <div style={{ background: '#0F172A', borderRadius: '16px', padding: '16px', textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ color: '#2DD4BF', fontSize: '11px', fontWeight: 800, marginBottom: '8px' }}>
                      🔒 AUTHORIZED SIGNED S3 BIOMETRIC PREVIEW (EXPIRES IN 5 MINUTES)
                    </div>
                    <img src={signedPreviewUrl} alt="Face Reference Preview" style={{ maxWidth: '220px', maxHeight: '220px', borderRadius: '12px', objectFit: 'cover', border: '2px solid #0F766E' }} />
                  </div>
                )}

                {/* Re-Enrollment Modal Box */}
                {showReEnrollModal && (
                  <div style={{ background: C.card, border: `2px solid ${C.teal || '#0F766E'}`, borderRadius: '18px', padding: '20px', marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 900, margin: '0 0 8px 0', color: C.teal || '#0F766E', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FaExclamationTriangle color="#F59E0B" /> Super Admin Biometric Re-Enrollment
                    </h4>
                    <p style={{ fontSize: '12px', color: C.textMid, margin: '0 0 16px 0' }}>
                      Initiating re-enrollment requires a mandatory business justification. The active template will be replaced upon upload.
                    </p>

                    {!sessionToken ? (
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px' }}>Reason for Re-Enrollment *</label>
                        <input
                          type="text"
                          value={reEnrollReason}
                          onChange={(e) => setReEnrollReason(e.target.value)}
                          placeholder="e.g., Image quality upgrade / Physical appearance change"
                          style={{ width: '100%', padding: '10px', borderRadius: '10px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontSize: '13px', marginBottom: '14px' }}
                        />
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={handleStartReEnrollment}
                            disabled={submittingReEnroll}
                            style={{ background: C.teal || '#0F766E', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: 800, fontSize: '12.5px', cursor: 'pointer' }}
                          >
                            {submittingReEnroll ? 'Creating Session...' : 'Generate Re-Enrollment Session Token →'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowReEnrollModal(false)}
                            style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, padding: '10px 16px', borderRadius: '10px', fontWeight: 800, fontSize: '12.5px', cursor: 'pointer' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleCommitReEnrollment}>
                        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '10px', borderRadius: '10px', fontSize: '12px', color: '#166534', fontWeight: 700, marginBottom: '14px' }}>
                          ✓ Session Active. Select new face image file to commit replacement:
                        </div>
                        <input
                          type="file"
                          accept="image/jpeg,image/png"
                          required
                          onChange={(e) => setReEnrollFile(e.target.files[0])}
                          style={{ fontSize: '13px', marginBottom: '16px' }}
                        />
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            type="submit"
                            disabled={submittingReEnroll}
                            style={{ background: C.teal || '#0F766E', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '10px', fontWeight: 900, fontSize: '13px', cursor: 'pointer' }}
                          >
                            {submittingReEnroll ? 'Committing New Reference...' : 'Commit & Lock New Reference'}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setShowReEnrollModal(false); setSessionToken(''); }}
                            style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, padding: '12px 16px', borderRadius: '10px', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* Reminder History Log */}
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FaBell color="#D97706" /> Reminder History Log (Screen 8)
                  </h4>
                  {loadingHistory ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: C.textMid, fontSize: '12px' }}>Loading reminder history...</div>
                  ) : reminderHistory.length === 0 ? (
                    <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '14px', color: C.textMid, fontSize: '12px' }}>
                      No reminders have been sent to this employee yet.
                    </div>
                  ) : (
                    <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '14px', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.textMid, fontWeight: 700 }}>
                            <th style={{ padding: '8px 12px' }}>Sent Date / Time</th>
                            <th style={{ padding: '8px 12px' }}>Sent By</th>
                            <th style={{ padding: '8px 12px' }}>Channels</th>
                            <th style={{ padding: '8px 12px' }}>Status</th>
                            <th style={{ padding: '8px 12px' }}>Message</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reminderHistory.map(rem => (
                            <tr key={rem.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                              <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                                {new Date(rem.sent_at || rem.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td style={{ padding: '8px 12px' }}>{rem.sent_by_name || 'Super Admin'}</td>
                              <td style={{ padding: '8px 12px' }}>
                                <span style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '2px 6px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 700 }}>In-App</span>
                              </td>
                              <td style={{ padding: '8px 12px' }}>
                                <span style={{
                                  padding: '2px 6px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 800,
                                  background: rem.status === 'COMPLETED' ? '#D1FAE5' : rem.status === 'SEEN' ? '#DBEAFE' : '#FEF3C7',
                                  color: rem.status === 'COMPLETED' ? '#065F46' : rem.status === 'SEEN' ? '#1E40AF' : '#92400E'
                                }}>
                                  {rem.status || 'SENT'}
                                </span>
                              </td>
                              <td style={{ padding: '8px 12px', color: C.textMid }}>{rem.reminder_message || rem.message}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Audit Trail Log */}
                {statusData?.history?.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FaHistory /> Template Version Audit Trail
                    </h4>
                    <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '12px', maxHeight: '160px', overflowY: 'auto' }}>
                      {statusData.history.map(item => (
                        <div key={item.id} style={{ padding: '8px 0', borderBottom: `1px solid ${C.border}`, fontSize: '11.5px', display: 'flex', justifyContent: 'space-between' }}>
                          <div>
                            <strong>v{item.version} ({item.status})</strong> — Enrolled: {new Date(item.enrolled_at).toLocaleString()}
                            {item.revoked_at && <div style={{ color: '#EF4444' }}>Revoked: {new Date(item.revoked_at).toLocaleString()} ({item.revocation_reason})</div>}
                          </div>
                          <span style={{ color: C.textMid, fontWeight: 700 }}>{item.enrollment_source}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MISSING FACE QUEUE */}
        {activeTab === 'missing_queue' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ position: 'relative', width: '280px' }}>
                  <FaSearch style={{ position: 'absolute', left: '12px', top: '12px', color: C.textMid }} />
                  <input
                    type="text"
                    placeholder="Search missing employees..."
                    value={missingSearch}
                    onChange={(e) => setMissingSearch(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '10px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontSize: '12.5px' }}
                  />
                </div>
                <span style={{ fontSize: '12.5px', color: C.textMid, fontWeight: 700 }}>
                  {filteredMissing.length} Missing
                </span>
              </div>

              <button
                onClick={handleBatchRemindAll}
                disabled={batchSending || filteredMissing.length === 0}
                style={{
                  background: '#D97706', color: '#fff', border: 'none', padding: '9px 16px',
                  borderRadius: '10px', fontWeight: 800, fontSize: '12.5px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <FaPaperPlane /> {batchSending ? 'Sending Reminders...' : 'Send Reminder to All Missing'}
              </button>
            </div>

            {loadingMissing ? (
              <div style={{ padding: '40px', textAlign: 'center', color: C.textMid }}>Loading missing face queue...</div>
            ) : filteredMissing.length === 0 ? (
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '16px', padding: '32px', textAlign: 'center', color: '#166534' }}>
                <FaCheckCircle style={{ fontSize: '32px', marginBottom: '8px' }} />
                <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 900 }}>All Employees Enrolled!</h4>
                <p style={{ margin: 0, fontSize: '13px' }}>Every active employee has completed Face Verification enrollment.</p>
              </div>
            ) : (
              <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '16px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.textMid, fontWeight: 700 }}>
                      <th style={{ padding: '12px 16px' }}>Employee</th>
                      <th style={{ padding: '12px 16px' }}>Designation</th>
                      <th style={{ padding: '12px 16px' }}>Face Verification</th>
                      <th style={{ padding: '12px 16px' }}>Last Reminder Sent</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMissing.map(emp => (
                      <tr key={emp.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: '12px 16px' }}>
                          <strong style={{ display: 'block', color: C.text }}>{emp.full_name}</strong>
                          <span style={{ fontSize: '11px', color: C.textMid }}>{emp.employee_code || emp.employee_id} • {emp.mobile_number}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>{emp.designation || 'Staff'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}>
                            ⚠ Missing
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '11.5px', color: C.textMid }}>
                          {emp.last_reminder_sent_at ? (
                            <span>{new Date(emp.last_reminder_sent_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                          ) : (
                            <span style={{ color: '#94A3B8' }}>Never</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => openReminderModal(emp)}
                              style={{
                                background: '#D97706', color: '#fff', border: 'none',
                                padding: '6px 12px', borderRadius: '8px', fontWeight: 800, fontSize: '11.5px',
                                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px'
                              }}
                            >
                              <FaBell /> Send Reminder
                            </button>
                            <button
                              onClick={() => {
                                setSelectedEmp(emp);
                                setActiveTab('employee');
                              }}
                              style={{
                                background: C.card, border: `1px solid ${C.border}`, color: C.text,
                                padding: '6px 12px', borderRadius: '8px', fontWeight: 800, fontSize: '11.5px',
                                cursor: 'pointer'
                              }}
                            >
                              Inspect
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ENVIRONMENT REFERENCES */}
        {activeTab === 'environment' && (
          <div>
            <div style={{ background: `${C.teal || '#0F766E'}10`, border: `1px solid ${C.teal || '#0F766E'}30`, borderRadius: '14px', padding: '14px 16px', marginBottom: '20px', fontSize: '12.5px', color: C.text }}>
              <strong>Approved Office Environment Reference Desk:</strong> Register and maintain official background reference images (BKG1-BKG4) stored securely in private S3.
            </div>

            {loadingEnv ? (
              <div style={{ padding: '40px', textAlign: 'center', color: C.textMid }}>Loading office environment references...</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                {[
                  { code: 'BKG1', name: 'Reception / Front Desk Environment', desc: 'Reception/front desk area reference view' },
                  { code: 'BKG2', name: 'Elevator / Waiting Area Environment', desc: 'Elevator and waiting area reference view' },
                  { code: 'BKG3', name: 'Office Entrance / Corridor Environment', desc: 'Office entrance and corridor reference view' },
                  { code: 'BKG4', name: 'Reception / Workstation / Interior Environment', desc: 'Reception, workstation and office interior reference view' }
                ].map(item => {
                  const existing = envReferences.find(r => r.reference_code === item.code);
                  return (
                    <div key={item.code} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <strong style={{ fontSize: '14px', color: C.teal || '#0F766E' }}>{item.code}</strong>
                        <span style={{
                          fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px',
                          background: existing?.environment_status === 'ACTIVE' ? '#D1FAE5' : '#FEF3C7',
                          color: existing?.environment_status === 'ACTIVE' ? '#065F46' : '#92400E'
                        }}>
                          {existing ? existing.environment_status : 'NOT REGISTERED'}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: '4px' }}>{item.name}</div>
                      <div style={{ fontSize: '11.5px', color: C.textMid, marginBottom: '12px' }}>{item.desc}</div>

                      {existing && (
                        <div style={{ fontSize: '11px', color: C.textMid, marginBottom: '12px' }}>
                          Hash: <code>{(existing.image_hash || '').substring(0, 16)}...</code>
                          <br />
                          Updated: {new Date(existing.updated_at).toLocaleDateString()}
                        </div>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <input
                          type="file"
                          accept="image/png,image/jpeg"
                          onChange={(e) => setEnvFileMap(prev => ({ ...prev, [item.code]: e.target.files[0] }))}
                          style={{ fontSize: '11.5px' }}
                        />
                        <button
                          onClick={() => handleUploadEnvRef(item.code, item.name, item.desc)}
                          disabled={uploadingEnvCode === item.code}
                          style={{
                            background: C.teal || '#0F766E', color: '#fff', border: 'none',
                            padding: '8px 14px', borderRadius: '8px', fontWeight: 800, fontSize: '12px',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                          }}
                        >
                          <FaUpload /> {uploadingEnvCode === item.code ? 'Uploading...' : 'Upload Reference Image'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── MODAL: Send Reminder Dialog (Screens 9 & 10) ── */}
        {showReminderModal && reminderEmp && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
          }}>
            <div style={{
              background: C.card, borderRadius: '20px', border: `1px solid ${C.border}`,
              padding: '24px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#D97706' }}>
                  <FaBell /> Send Face Verification Reminder
                </h3>
                <button onClick={() => setShowReminderModal(false)} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', fontWeight: 900 }}>✕</button>
              </div>

              <div style={{ background: C.bgSecondary, borderRadius: '12px', padding: '12px', marginBottom: '16px', fontSize: '12.5px' }}>
                <div><strong>Recipient:</strong> {reminderEmp.full_name} ({reminderEmp.employee_code || reminderEmp.employee_id})</div>
                <div style={{ color: C.textMid, marginTop: '2px' }}>Mobile: {reminderEmp.mobile_number} | Designation: {reminderEmp.designation || 'Staff'}</div>
              </div>

              {/* 10-Minute Throttle Notice */}
              <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '10px', padding: '10px 14px', fontSize: '11.5px', color: '#92400E', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaClock color="#D97706" /> <strong>Anti-Spam Throttle:</strong> Reminders can only be sent once every 10 minutes per employee.
              </div>

              <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: C.text }}>
                Reminder Message
              </label>
              <textarea
                rows={3}
                value={reminderMessage}
                onChange={(e) => setReminderMessage(e.target.value)}
                style={{
                  width: '100%', padding: '10px', borderRadius: '10px', border: `1px solid ${C.border}`,
                  background: C.bgSecondary, color: C.text, fontSize: '12.5px', resize: 'vertical', marginBottom: '14px'
                }}
              />

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '8px', color: C.text }}>Delivery Channels</label>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={reminderChannels.inApp} onChange={e => setReminderChannels(prev => ({ ...prev, inApp: e.target.checked }))} />
                    In-App Notification
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={reminderChannels.whatsapp} onChange={e => setReminderChannels(prev => ({ ...prev, whatsapp: e.target.checked }))} />
                    WhatsApp
                  </label>
                </div>
              </div>

              {reminderAlert && (
                <div style={{
                  padding: '10px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, marginBottom: '14px',
                  background: reminderAlert.type === 'success' ? '#D1FAE5' : '#FEE2E2',
                  color: reminderAlert.type === 'success' ? '#065F46' : '#991B1B',
                  border: `1px solid ${reminderAlert.type === 'success' ? '#6EE7B7' : '#FCA5A5'}`
                }}>
                  {reminderAlert.text}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowReminderModal(false)}
                  style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, padding: '10px 16px', borderRadius: '10px', fontWeight: 800, fontSize: '12.5px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendReminder}
                  disabled={sendingReminder || !reminderMessage.trim()}
                  style={{
                    background: '#D97706', color: '#fff', border: 'none', padding: '10px 20px',
                    borderRadius: '10px', fontWeight: 900, fontSize: '12.5px', cursor: sendingReminder ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)', display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  <FaPaperPlane /> {sendingReminder ? 'Dispatching...' : 'Dispatch Reminder Now'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
