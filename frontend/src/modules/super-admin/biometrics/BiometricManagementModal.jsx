const React = require('react');
const { useState, useEffect } = React;
const { useTheme } = require('../../../contexts/ThemeContext');
const { 
  FaUserShield, FaCamera, FaCheckCircle, FaTimesCircle, FaHistory, 
  FaBuilding, FaUpload, FaSync, FaExclamationTriangle, FaLock, FaEye 
} = require('react-icons/fa');
const axios = require('axios');
const { getApiV1Url } = require('../../../config/api');

module.exports = function BiometricManagementModal({ isOpen, onClose, employee = null }) {
  const { C } = useTheme();
  const [activeTab, setActiveTab] = useState('employee'); // 'employee' | 'environment'

  // Employee Biometric State
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

  // Environment References State
  const [envReferences, setEnvReferences] = useState([]);
  const [loadingEnv, setLoadingEnv] = useState(false);
  const [uploadingEnvCode, setUploadingEnvCode] = useState(null);
  const [envFileMap, setEnvFileMap] = useState({});

  useEffect(() => {
    if (isOpen && employee?.id) {
      fetchEmployeeStatus();
    }
    if (isOpen && activeTab === 'environment') {
      fetchEnvironmentReferences();
    }
  }, [isOpen, employee, activeTab]);

  const fetchEmployeeStatus = async () => {
    if (!employee?.id) return;
    setLoadingStatus(true);
    setSignedPreviewUrl('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${getApiV1Url()}/attendance/enrollment/employee/${employee.id}`, {
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

  const fetchPreviewUrl = async () => {
    if (!employee?.id) return;
    setLoadingPreview(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${getApiV1Url()}/attendance/enrollment/preview/${employee.id}`, {
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
        employee_id: employee.id,
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
        fetchEmployeeStatus();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Re-enrollment commit failed');
    } finally {
      setSubmittingReEnroll(false);
    }
  };

  const fetchEnvironmentReferences = async () => {
    setLoadingEnv(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${getApiV1Url()}/attendance/enrollment/environment`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        setEnvReferences(res.data.data);
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

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '16px', fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px',
        width: '100%', maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)', padding: '28px', color: C.text
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: `1px solid ${C.border}`, paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaUserShield style={{ fontSize: '24px', color: C.teal || '#0F766E' }} />
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 900, margin: 0, color: C.text }}>
                BIOMETRIC ENROLLMENT & ENVIRONMENT DESK
              </h2>
              <span style={{ fontSize: '12px', color: C.textMid, fontWeight: 700 }}>
                Super Admin Authoritative Reference Controls
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 900 }}>✕</button>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('employee')}
            style={{
              flex: 1, padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer',
              background: activeTab === 'employee' ? (C.teal || '#0F766E') : C.bgSecondary,
              color: activeTab === 'employee' ? '#fff' : C.text, fontWeight: 800, fontSize: '13px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
          >
            <FaCamera /> Employee Face Reference {employee ? `(${employee.full_name})` : ''}
          </button>
          <button
            onClick={() => setActiveTab('environment')}
            style={{
              flex: 1, padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer',
              background: activeTab === 'environment' ? (C.teal || '#0F766E') : C.bgSecondary,
              color: activeTab === 'environment' ? '#fff' : C.text, fontWeight: 800, fontSize: '13px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
          >
            <FaBuilding /> Approved Office Environments (BKG1-BKG4)
          </button>
        </div>

        {/* TAB 1: EMPLOYEE BIOMETRIC REFERENCE */}
        {activeTab === 'employee' && (
          <div>
            {!employee ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: C.textMid, fontSize: '13px' }}>
                Select an employee from the directory list to inspect or re-enroll biometric reference images.
              </div>
            ) : loadingStatus ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: C.textMid }}>
                Loading biometric status for {employee.full_name}...
              </div>
            ) : (
              <div>
                {/* Status Card */}
                <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 900, margin: '0 0 4px 0' }}>{employee.full_name}</h3>
                      <div style={{ fontSize: '12px', color: C.textMid, fontWeight: 700 }}>
                        Code: {employee.employee_id || employee.employee_code} | Designation: {employee.designation || 'Staff'}
                      </div>
                    </div>
                    <div>
                      <span style={{
                        padding: '6px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 900,
                        background: statusData?.is_enrolled ? '#D1FAE5' : '#FEF3C7',
                        color: statusData?.is_enrolled ? '#065F46' : '#92400E',
                        border: `1px solid ${statusData?.is_enrolled ? '#6EE7B7' : '#FCD34D'}`
                      }}>
                        {statusData?.is_enrolled ? '✓ BIOMETRIC ENROLLED (ACTIVE)' : '⚠️ NOT ENROLLED'}
                      </span>
                    </div>
                  </div>

                  {statusData?.active_template && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px dashed ${C.border}`, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '12px' }}>
                      <div>
                        <span style={{ color: C.textMid, display: 'block', fontWeight: 700 }}>Template Version:</span>
                        <strong>v{statusData.active_template.version}</strong>
                      </div>
                      <div>
                        <span style={{ color: C.textMid, display: 'block', fontWeight: 700 }}>Source:</span>
                        <strong>{statusData.active_template.enrollment_source}</strong>
                      </div>
                      <div>
                        <span style={{ color: C.textMid, display: 'block', fontWeight: 700 }}>Enrolled Date:</span>
                        <strong>{new Date(statusData.active_template.enrolled_at).toLocaleString()}</strong>
                      </div>
                      <div>
                        <span style={{ color: C.textMid, display: 'block', fontWeight: 700 }}>Enrolled By:</span>
                        <strong>{statusData.active_template.enrolled_by_name || 'System / KYC'}</strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                  {statusData?.is_enrolled && (
                    <button
                      onClick={fetchPreviewUrl}
                      disabled={loadingPreview}
                      style={{
                        padding: '12px 18px', borderRadius: '12px', background: C.bgSecondary,
                        border: `1px solid ${C.border}`, color: C.text, fontWeight: 800, fontSize: '12.5px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                      }}
                    >
                      <FaEye /> {loadingPreview ? 'Generating Signed URL...' : 'Preview Active Reference Image'}
                    </button>
                  )}

                  <button
                    onClick={() => setShowReEnrollModal(true)}
                    style={{
                      padding: '12px 18px', borderRadius: '12px', background: C.teal || '#0F766E',
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
                  <div style={{ background: '#000', borderRadius: '16px', padding: '16px', textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ color: '#2DD4BF', fontSize: '11px', fontWeight: 800, marginBottom: '8px' }}>
                      🔒 AUTHORIZED SIGNED S3 PREVIEW (EXPIRES IN 5 MINUTES)
                    </div>
                    <img src={signedPreviewUrl} alt="Face Reference Preview" style={{ maxWidth: '240px', maxHeight: '240px', borderRadius: '12px', objectFit: 'cover' }} />
                  </div>
                )}

                {/* Re-Enrollment Modal Box */}
                {showReEnrollModal && (
                  <div style={{ background: C.card, border: `2px solid ${C.teal || '#0F766E'}`, borderRadius: '18px', padding: '20px', marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 900, margin: '0 0 8px 0', color: C.teal || '#0F766E', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FaExclamationTriangle color="#F59E0B" /> Super Admin Biometric Re-Enrollment
                    </h4>
                    <p style={{ fontSize: '12px', color: C.textMid, margin: '0 0 16px 0' }}>
                      Note: Initiating re-enrollment keeps the current reference active until a new photograph is committed. Old template (v{statusData?.active_template?.version || 1}) will be marked REVOKED.
                    </p>

                    {!sessionToken ? (
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px' }}>Reason for Re-Enrollment *</label>
                        <input
                          type="text"
                          value={reEnrollReason}
                          onChange={(e) => setReEnrollReason(e.target.value)}
                          placeholder="e.g., Image quality enhancement / Physical change request"
                          style={{ width: '100%', padding: '10px', borderRadius: '10px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontSize: '13px', marginBottom: '14px' }}
                        />
                        <button
                          onClick={handleStartReEnrollment}
                          disabled={submittingReEnroll}
                          style={{ background: C.teal || '#0F766E', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: 800, fontSize: '12.5px', cursor: 'pointer' }}
                        >
                          {submittingReEnroll ? 'Creating Session...' : 'Generate Re-Enrollment Session Token →'}
                        </button>
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

                {/* History Log */}
                {statusData?.history?.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FaHistory /> Template Version Audit Trail
                    </h4>
                    <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '12px', maxHeight: '180px', overflowY: 'auto' }}>
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

        {/* TAB 2: ENVIRONMENT REFERENCES */}
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

      </div>
    </div>
  );
};
