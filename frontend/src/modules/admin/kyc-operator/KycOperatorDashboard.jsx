import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { 
  FaIdCard, FaSearch, FaFilter, FaCheckCircle, FaTimesCircle, 
  FaExclamationTriangle, FaEye, FaSync, FaFileAlt, FaUserCheck, 
  FaBuilding, FaCalendarAlt, FaExternalLinkAlt, FaShieldAlt, FaComments
} from 'react-icons/fa';
import api from '../../../services/api';

export default function KycOperatorDashboard() {
  const { C, isDark } = useTheme();

  // State Management
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({ total_kyc: 0, pending_kyc: 0, verified_kyc: 0, rejected_kyc: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  // Filters
  const [search, setSearch] = useState('');
  const [kycStatusFilter, setKycStatusFilter] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedBank, setSelectedBank] = useState('');

  // Modals & Active Details
  const [selectedApp, setSelectedApp] = useState(null);
  const [appDetails, setAppDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionModalType, setActionModalType] = useState(null); // 'VERIFY' | 'REJECT' | 'REQUEST_INFO'
  const [actionRemarks, setActionRemarks] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [toast, setToast] = useState(null);

  const KYC_STAGES = [
    'Vkyc approved',
    'Vkyc pending',
    'Vkyc failed',
    'Bio done',
    'Bio pending',
    'Bio inprocess',
    'Digilocker 1 rup credit/debit done',
    'Digilocker 1 rup credit/debit pending'
  ];

  const handleStageChange = async (appId, newStage) => {
    try {
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, kyc_stage: newStage } : a));
      if (appDetails && appDetails.id === appId) {
        setAppDetails(prev => ({ ...prev, kyc_stage: newStage }));
      }
      const res = await api.post(`/kyc-operator/applications/${appId}/update-stage`, { kyc_stage: newStage });
      if (res.data?.success) {
        setToast({ type: 'success', text: `KYC Stage updated to "${newStage}"` });
      }
    } catch (err) {
      console.error("Error updating stage:", err);
      setToast({ type: 'error', text: err.response?.data?.message || 'Failed to update KYC stage' });
      fetchApplications();
    }
  };

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: search.trim() || undefined,
        kyc_status: kycStatusFilter || undefined,
        product_id: selectedProduct || undefined,
        bank_id: selectedBank || undefined
      };

      const res = await api.get('/kyc-operator/applications', { params });
      if (res.data?.success) {
        setApplications(res.data.data || []);
        if (res.data.stats) setStats(res.data.stats);
        if (res.data.pagination) setPagination(prev => ({ ...prev, ...res.data.pagination }));
      }
    } catch (err) {
      console.error("KYC Operator fetch error:", err);
      setToast({ type: 'error', text: err.response?.data?.message || 'Failed to load KYC applications' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [pagination.page, kycStatusFilter, selectedProduct, selectedBank]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination(p => ({ ...p, page: 1 }));
    fetchApplications();
  };

  const handleViewApplication = async (app) => {
    setSelectedApp(app);
    setDetailsLoading(true);
    try {
      const res = await api.get(`/kyc-operator/applications/${app.id}`);
      if (res.data?.success) {
        setAppDetails(res.data.data);
      }
    } catch (err) {
      console.error("Fetch application details error:", err);
      setToast({ type: 'error', text: err.response?.data?.message || 'Failed to load application details' });
      setSelectedApp(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;

    if ((actionModalType === 'REJECT' || actionModalType === 'REQUEST_INFO') && !actionRemarks.trim()) {
      setToast({ type: 'error', text: 'Please provide remarks / reason before submitting.' });
      return;
    }

    try {
      setSubmittingAction(true);
      let endpoint = `/kyc-operator/applications/${selectedApp.id}/verify`;
      if (actionModalType === 'REJECT') endpoint = `/kyc-operator/applications/${selectedApp.id}/reject`;
      if (actionModalType === 'REQUEST_INFO') endpoint = `/kyc-operator/applications/${selectedApp.id}/request-information`;

      const res = await api.post(endpoint, { remarks: actionRemarks });
      if (res.data?.success) {
        setToast({ type: 'success', text: res.data.message || 'KYC status updated successfully!' });
        setActionModalType(null);
        setActionRemarks('');
        setSelectedApp(null);
        fetchApplications();
      }
    } catch (err) {
      console.error("KYC Action error:", err);
      setToast({ type: 'error', text: err.response?.data?.message || 'Action failed' });
    } finally {
      setSubmittingAction(false);
    }
  };

  // Badge styles
  const getKycBadge = (status) => {
    const st = String(status || 'PENDING').toUpperCase();
    if (st === 'VERIFIED' || st === 'APPROVED') {
      return <span style={{ background: '#D1FAE5', color: '#065F46', padding: '4px 10px', borderRadius: '12px', fontSize: '11.5px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><FaCheckCircle /> VERIFIED</span>;
    }
    if (st === 'REJECTED') {
      return <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '4px 10px', borderRadius: '12px', fontSize: '11.5px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><FaTimesCircle /> REJECTED</span>;
    }
    if (st === 'PENDING_MORE_INFO' || st === 'NEED_INFO') {
      return <span style={{ background: '#FEF3C7', color: '#92400E', padding: '4px 10px', borderRadius: '12px', fontSize: '11.5px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><FaExclamationTriangle /> NEED INFO</span>;
    }
    return <span style={{ background: '#E0F2FE', color: '#0369A1', padding: '4px 10px', borderRadius: '12px', fontSize: '11.5px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><FaSync /> PENDING KYC</span>;
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto', fontFamily: "'Inter', sans-serif", color: C.text }}>
      
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
          background: toast.type === 'error' ? '#991B1B' : '#065F46', color: '#FFF',
          padding: '12px 20px', borderRadius: '12px', fontWeight: 700, fontSize: '13.5px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          {toast.type === 'error' ? <FaTimesCircle /> : <FaCheckCircle />}
          {toast.text}
        </div>
      )}

      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ background: '#0F766E', color: '#FFF', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 900, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
              <FaShieldAlt /> KYC Operator Panel
            </span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#10B981', background: '#D1FAE5', padding: '4px 10px', borderRadius: '6px' }}>
              ✓ Soft Approvals Filter Active
            </span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, margin: '8px 0 4px 0', color: C.text }}>
            KYC Document & Identity Verification
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: C.textMid }}>
            Only non-declined soft approval applications are visible for KYC verification and document checks.
          </p>
        </div>

        <button 
          onClick={fetchApplications}
          style={{ 
            background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, 
            padding: '10px 16px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' 
          }}
        >
          <FaSync className={loading ? 'fa-spin' : ''} /> Refresh Queue
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase' }}>Eligible KYC Applications</span>
          <div style={{ fontSize: '28px', fontWeight: 900, color: C.text, marginTop: '6px' }}>{stats.total_kyc}</div>
          <span style={{ fontSize: '11.5px', color: C.teal, fontWeight: 700 }}>Soft Approval Non-Declined</span>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#D97706', textTransform: 'uppercase' }}>Pending KYC</span>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#D97706', marginTop: '6px' }}>{stats.pending_kyc}</div>
          <span style={{ fontSize: '11.5px', color: C.textMid }}>Awaiting document check</span>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#059669', textTransform: 'uppercase' }}>Verified KYC</span>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#059669', marginTop: '6px' }}>{stats.verified_kyc}</div>
          <span style={{ fontSize: '11.5px', color: '#059669', fontWeight: 700 }}>✓ Documents Approved</span>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#DC2626', textTransform: 'uppercase' }}>Rejected KYC</span>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#DC2626', marginTop: '6px' }}>{stats.rejected_kyc}</div>
          <span style={{ fontSize: '11.5px', color: C.textMid }}>Validation failed</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '16px', marginBottom: '24px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase', marginBottom: '4px' }}>Search Queue</label>
            <div style={{ position: 'relative' }}>
              <FaSearch style={{ position: 'absolute', left: '12px', top: '12px', color: C.textMid }} />
              <input 
                type="text" 
                placeholder="App ID / Customer / Mobile..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', padding: '10px 12px 10px 34px', borderRadius: '10px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontSize: '13px', fontWeight: 600 }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase', marginBottom: '4px' }}>KYC Verification Status</label>
            <select 
              value={kycStatusFilter} 
              onChange={(e) => setKycStatusFilter(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '10px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontSize: '13px', fontWeight: 700 }}
            >
              <option value="">All KYC Statuses</option>
              <option value="pending">Pending KYC</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
              <option value="pending_more_info">Need More Info</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button 
              type="submit" 
              style={{ width: '100%', background: C.teal, color: '#FFF', border: 'none', padding: '10px 16px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', fontSize: '13px' }}
            >
              Apply Filter
            </button>
          </div>
        </form>
      </div>

      {/* Applications Table */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, color: C.textMid, textTransform: 'uppercase', fontSize: '11px', fontWeight: 900 }}>
                <th style={{ padding: '14px 18px' }}>App ID & Date</th>
                <th style={{ padding: '14px 18px' }}>Customer Name & Number</th>
                <th style={{ padding: '14px 18px' }}>PAN Number</th>
                <th style={{ padding: '14px 18px' }}>Bank App No.</th>
                <th style={{ padding: '14px 18px' }}>VKYC Link</th>
                <th style={{ padding: '14px 18px' }}>Remarks</th>
                <th style={{ padding: '14px 18px' }}>KYC Stage</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: C.textMid }}>
                    <FaSync className="fa-spin" style={{ fontSize: '24px', color: C.teal, marginBottom: '8px' }} />
                    <div style={{ fontWeight: 700 }}>Loading eligible KYC queue...</div>
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: C.textMid }}>
                    <FaShieldAlt style={{ fontSize: '32px', color: C.teal, marginBottom: '8px' }} />
                    <div style={{ fontWeight: 800, fontSize: '15px', color: C.text }}>No Eligible KYC Applications Found</div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12.5px' }}>
                      All non-declined soft approval applications are clear or match your search criteria.
                    </p>
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id} style={{ borderBottom: `1px solid ${C.border}`, transition: 'background 0.15s' }}>
                    
                    {/* Application ID & Date */}
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 900, color: C.text, fontFamily: 'monospace', fontSize: '13px' }}>
                        {app.application_number || app.id}
                      </div>
                      <div style={{ fontSize: '11px', color: C.teal, fontWeight: 800, marginTop: '2px' }}>
                        {app.product_name} • {app.bank_name}
                      </div>
                      <div style={{ fontSize: '10.5px', color: C.textMid, marginTop: '2px' }}>
                        {new Date(app.created_at).toLocaleDateString()}
                      </div>
                    </td>

                    {/* Customer Name & Number */}
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 800, color: C.text, fontSize: '13px' }}>{app.customer_name}</div>
                      <div style={{ fontSize: '12px', color: C.textMid, fontWeight: 700, fontFamily: 'monospace' }}>
                        📞 {app.customer_mobile}
                      </div>
                    </td>

                    {/* Customer PAN Number */}
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, color: C.teal, background: C.bgSecondary, border: `1px solid ${C.border}`, padding: '4px 8px', borderRadius: '6px', fontSize: '12px', letterSpacing: '0.5px' }}>
                        🪪 {app.pan_number || 'N/A'}
                      </span>
                    </td>

                    {/* Bank Application Number */}
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontFamily: 'monospace', fontWeight: 800, color: C.text, fontSize: '12.5px' }}>
                        {app.bank_application_number && app.bank_application_number !== 'N/A' ? (
                          app.bank_application_number
                        ) : (
                          <span style={{ color: C.textMid, fontWeight: 600, fontStyle: 'italic', fontSize: '11.5px' }}>Not Assigned</span>
                        )}
                      </div>
                    </td>

                    {/* VKYC Link */}
                    <td style={{ padding: '14px 18px' }}>
                      {app.vkyc_link ? (
                        <a 
                          href={app.vkyc_link.startsWith('http') ? app.vkyc_link : `https://${app.vkyc_link}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ background: '#0284C7', color: '#FFF', padding: '6px 10px', borderRadius: '8px', fontSize: '11.5px', fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px', boxShadow: '0 2px 6px rgba(2, 132, 199, 0.2)' }}
                        >
                          <FaExternalLinkAlt /> Launch VKYC
                        </a>
                      ) : (
                        <span style={{ fontSize: '11.5px', color: C.textMid, fontWeight: 600, fontStyle: 'italic' }}>No VKYC Link</span>
                      )}
                    </td>

                    {/* Remarks (User & KYC) */}
                    <td style={{ padding: '14px 18px', maxWidth: '200px' }}>
                      {app.user_remark && (
                        <div style={{ fontSize: '11.5px', color: C.text, marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={`User Remark: ${app.user_remark}`}>
                          <strong style={{ color: C.teal }}>User:</strong> {app.user_remark}
                        </div>
                      )}
                      {app.kyc_remarks && (
                        <div style={{ fontSize: '11.5px', color: '#D97706', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={`KYC Remark: ${app.kyc_remarks}`}>
                          <strong>KYC:</strong> {app.kyc_remarks}
                        </div>
                      )}
                      {!app.user_remark && !app.kyc_remarks && (
                        <span style={{ fontSize: '11.5px', color: C.textMid }}>-</span>
                      )}
                    </td>

                    {/* KYC Stage Dropdown */}
                    <td style={{ padding: '14px 18px' }}>
                      <select
                        value={app.kyc_stage || 'Vkyc pending'}
                        onChange={(e) => handleStageChange(app.id, e.target.value)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '10px',
                          fontWeight: 800,
                          fontSize: '12px',
                          border: `1px solid ${C.border}`,
                          background: String(app.kyc_stage || '').toLowerCase().includes('approved') || String(app.kyc_stage || '').toLowerCase().includes('done') ? '#D1FAE5' : String(app.kyc_stage || '').toLowerCase().includes('failed') ? '#FEE2E2' : '#FEF3C7',
                          color: String(app.kyc_stage || '').toLowerCase().includes('approved') || String(app.kyc_stage || '').toLowerCase().includes('done') ? '#065F46' : String(app.kyc_stage || '').toLowerCase().includes('failed') ? '#991B1B' : '#92400E',
                          cursor: 'pointer'
                        }}
                      >
                        {KYC_STAGES.map((stg) => (
                          <option key={stg} value={stg} style={{ background: C.card, color: C.text, fontWeight: 700 }}>
                            {stg}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleViewApplication(app)}
                        style={{ background: C.teal, color: '#FFF', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <FaEye /> View & Verify
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Application Verification Drawer / Modal */}
      {(selectedApp || detailsLoading) && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9000,
          display: 'flex', justifyContent: 'flex-end'
        }}>
          <div style={{
            width: '100%', maxWidth: '640px', background: C.card, height: '100%',
            boxShadow: '-8px 0 32px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column',
            overflowY: 'auto', padding: '24px'
          }}>
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: `1px solid ${C.border}`, paddingBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 900, color: C.teal, textTransform: 'uppercase' }}>KYC Verification Workflow</span>
                <h2 style={{ fontSize: '20px', fontWeight: 900, margin: '2px 0 0 0', color: C.text }}>
                  Application #{selectedApp?.application_number || selectedApp?.id}
                </h2>
              </div>
              <button 
                onClick={() => { setSelectedApp(null); setAppDetails(null); }}
                style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontWeight: 900 }}
              >
                ✕
              </button>
            </div>

            {detailsLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: C.textMid }}>
                <FaSync className="fa-spin" style={{ fontSize: '28px', color: C.teal, marginBottom: '12px' }} />
                <div style={{ fontWeight: 800 }}>Loading application details & documents...</div>
              </div>
            ) : appDetails ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Status Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ background: C.bgSecondary, padding: '14px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 800, textTransform: 'uppercase' }}>Soft Approval Status</span>
                    <div style={{ marginTop: '4px' }}>
                      <span style={{ background: '#D1FAE5', color: '#065F46', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 900 }}>
                        ✓ {appDetails.soft_approval_status}
                      </span>
                    </div>
                  </div>

                  <div style={{ background: C.bgSecondary, padding: '14px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 800, textTransform: 'uppercase' }}>Current KYC Status</span>
                    <div style={{ marginTop: '4px' }}>
                      {getKycBadge(appDetails.kyc_status)}
                    </div>
                  </div>
                </div>

                {/* Customer & Application Core Details Card */}
                <div style={{ background: C.bgSecondary, padding: '16px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 900, margin: '0 0 12px 0', color: C.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaUserCheck /> Application & Identity Information
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12.5px', marginBottom: '14px' }}>
                    <div>
                      <span style={{ color: C.textMid, fontSize: '11px', display: 'block', fontWeight: 700 }}>APPLICATION ID</span>
                      <strong style={{ fontFamily: 'monospace', fontSize: '13px' }}>{appDetails.application_number || appDetails.id}</strong>
                    </div>
                    <div>
                      <span style={{ color: C.textMid, fontSize: '11px', display: 'block', fontWeight: 700 }}>CUSTOMER PAN</span>
                      <input 
                        type="text"
                        value={appDetails.pan_number || ''}
                        onChange={(e) => setAppDetails(prev => ({ ...prev, pan_number: e.target.value }))}
                        placeholder="e.g. ABCDE1234F"
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: `1px solid ${C.border}`, background: C.card, color: C.text, fontWeight: 700, fontFamily: 'monospace' }}
                      />
                    </div>
                    <div>
                      <span style={{ color: C.textMid, fontSize: '11px', display: 'block', fontWeight: 700 }}>CUSTOMER NAME</span>
                      <strong>{appDetails.customer_name || 'N/A'}</strong>
                    </div>
                    <div>
                      <span style={{ color: C.textMid, fontSize: '11px', display: 'block', fontWeight: 700 }}>MOBILE NUMBER</span>
                      <strong>{appDetails.customer_mobile || 'N/A'}</strong>
                    </div>
                    <div>
                      <span style={{ color: C.textMid, fontSize: '11px', display: 'block', fontWeight: 700 }}>PRODUCT</span>
                      <strong>{appDetails.product_name || 'N/A'}</strong>
                    </div>
                    <div>
                      <span style={{ color: C.textMid, fontSize: '11px', display: 'block', fontWeight: 700 }}>BANK</span>
                      <strong>{appDetails.bank_name || 'N/A'}</strong>
                    </div>
                  </div>

                  {/* Editable Fields: Bank App #, VKYC Link, Remarks */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '10px', borderTop: `1px dashed ${C.border}` }}>
                    <div>
                      <label style={{ color: C.textMid, fontSize: '11px', display: 'block', fontWeight: 800, marginBottom: '3px' }}>BANK APPLICATION NUMBER</label>
                      <input 
                        type="text"
                        value={appDetails.bank_application_number || ''}
                        onChange={(e) => setAppDetails(prev => ({ ...prev, bank_application_number: e.target.value }))}
                        placeholder="Enter Bank Application Number..."
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, color: C.text, fontWeight: 700, fontFamily: 'monospace' }}
                      />
                    </div>

                    <div>
                      <label style={{ color: C.textMid, fontSize: '11px', display: 'block', fontWeight: 800, marginBottom: '3px' }}>VKYC LINK</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input 
                          type="text"
                          value={appDetails.vkyc_link || ''}
                          onChange={(e) => setAppDetails(prev => ({ ...prev, vkyc_link: e.target.value }))}
                          placeholder="https://vkyc.bank.com/session/..."
                          style={{ flex: 1, padding: '8px 10px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: '12px', fontWeight: 600 }}
                        />
                        {appDetails.vkyc_link && (
                          <a 
                            href={appDetails.vkyc_link.startsWith('http') ? appDetails.vkyc_link : `https://${appDetails.vkyc_link}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ background: '#0284C7', color: '#FFF', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <FaExternalLinkAlt /> Launch
                          </a>
                        )}
                      </div>
                    </div>

                    <div>
                      <label style={{ color: C.textMid, fontSize: '11px', display: 'block', fontWeight: 800, marginBottom: '3px' }}>USER REMARK</label>
                      <input 
                        type="text"
                        value={appDetails.user_remark || ''}
                        onChange={(e) => setAppDetails(prev => ({ ...prev, user_remark: e.target.value }))}
                        placeholder="User / applicant notes..."
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: '12.5px' }}
                      />
                    </div>

                    <div>
                      <label style={{ color: C.textMid, fontSize: '11px', display: 'block', fontWeight: 800, marginBottom: '3px' }}>KYC REMARK</label>
                      <input 
                        type="text"
                        value={appDetails.kyc_remarks || ''}
                        onChange={(e) => setAppDetails(prev => ({ ...prev, kyc_remarks: e.target.value }))}
                        placeholder="Operator KYC verification remark..."
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: '12.5px' }}
                      />
                    </div>

                    <div>
                      <label style={{ color: C.textMid, fontSize: '11px', display: 'block', fontWeight: 800, marginBottom: '3px' }}>KYC STAGE</label>
                      <select 
                        value={appDetails.kyc_stage || 'Vkyc pending'}
                        onChange={(e) => setAppDetails(prev => ({ ...prev, kyc_stage: e.target.value }))}
                        style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: '13px', fontWeight: 800 }}
                      >
                        {KYC_STAGES.map(stg => (
                          <option key={stg} value={stg}>{stg}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          setSubmittingAction(true);
                          const res = await api.post(`/kyc-operator/applications/${appDetails.id}/update-stage`, {
                            kyc_stage: appDetails.kyc_stage,
                            bank_application_number: appDetails.bank_application_number,
                            vkyc_link: appDetails.vkyc_link,
                            user_remark: appDetails.user_remark,
                            kyc_remarks: appDetails.kyc_remarks,
                            pan_number: appDetails.pan_number
                          });
                          if (res.data?.success) {
                            setToast({ type: 'success', text: 'Application details updated!' });
                            fetchApplications();
                          }
                        } catch (err) {
                          setToast({ type: 'error', text: err.response?.data?.message || 'Update failed' });
                        } finally {
                          setSubmittingAction(false);
                        }
                      }}
                      style={{ marginTop: '6px', background: C.teal, color: '#FFF', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '12.5px' }}
                    >
                      💾 Save KYC Details & Stage
                    </button>
                  </div>

                </div>

                {/* Documents List */}
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 900, margin: '0 0 10px 0', color: C.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaFileAlt /> KYC Documents ({appDetails.documents?.length || 0})
                  </h3>

                  {!appDetails.documents || appDetails.documents.length === 0 ? (
                    <div style={{ padding: '16px', background: C.bgSecondary, borderRadius: '12px', textAlign: 'center', color: C.textMid, fontSize: '12.5px' }}>
                      No digital documents uploaded for this application yet.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {appDetails.documents.map(doc => (
                        <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: C.bgSecondary, borderRadius: '10px', border: `1px solid ${C.border}` }}>
                          <div>
                            <strong style={{ fontSize: '13px', display: 'block', textTransform: 'capitalize' }}>
                              {doc.document_type ? doc.document_type.replace(/_/g, ' ') : 'Document'}
                            </strong>
                            <span style={{ fontSize: '11px', color: C.textMid }}>
                              Status: {doc.status || 'PENDING'}
                            </span>
                          </div>
                          {doc.file_url ? (
                            <a 
                              href={doc.file_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ background: C.teal, color: '#FFF', padding: '6px 12px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <FaExternalLinkAlt /> View File
                            </a>
                          ) : (
                            <span style={{ fontSize: '11px', color: C.textMid }}>No URL</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Verification Actions Bar */}
                <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: `1px solid ${C.border}`, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <button 
                    onClick={() => { setActionModalType('VERIFY'); setActionRemarks('KYC documents verified and approved.'); }}
                    style={{ background: '#059669', color: '#FFF', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 900, cursor: 'pointer', fontSize: '12.5px' }}
                  >
                    ✓ Verify KYC
                  </button>

                  <button 
                    onClick={() => { setActionModalType('REQUEST_INFO'); setActionRemarks(''); }}
                    style={{ background: '#D97706', color: '#FFF', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 900, cursor: 'pointer', fontSize: '12.5px' }}
                  >
                    ⚠ Need Info
                  </button>

                  <button 
                    onClick={() => { setActionModalType('REJECT'); setActionRemarks(''); }}
                    style={{ background: '#DC2626', color: '#FFF', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 900, cursor: 'pointer', fontSize: '12.5px' }}
                  >
                    ✕ Reject KYC
                  </button>
                </div>

              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Verification Confirmation Modal */}
      {actionModalType && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 9990,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{ background: C.card, borderRadius: '16px', padding: '24px', maxWidth: '480px', width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 900, margin: '0 0 12px 0', color: C.text }}>
              {actionModalType === 'VERIFY' && 'Confirm KYC Verification'}
              {actionModalType === 'REJECT' && 'Reject KYC Verification'}
              {actionModalType === 'REQUEST_INFO' && 'Request Additional Information'}
            </h3>

            <p style={{ fontSize: '13px', color: C.textMid, margin: '0 0 16px 0' }}>
              {actionModalType === 'VERIFY' && 'Are you sure you want to mark this application KYC as VERIFIED?'}
              {actionModalType === 'REJECT' && 'Please state the reason for rejecting this customer\'s KYC documents.'}
              {actionModalType === 'REQUEST_INFO' && 'Provide specific instructions regarding missing or invalid KYC documents.'}
            </p>

            <form onSubmit={handleActionSubmit}>
              <textarea 
                rows={3}
                required={actionModalType !== 'VERIFY'}
                placeholder="Enter remarks or notes..."
                value={actionRemarks}
                onChange={(e) => setActionRemarks(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontSize: '13px', marginBottom: '16px' }}
              />

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => setActionModalType(null)}
                  style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.text, padding: '10px 16px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submittingAction}
                  style={{
                    background: actionModalType === 'VERIFY' ? '#059669' : actionModalType === 'REJECT' ? '#DC2626' : '#D97706',
                    color: '#FFF', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 900, cursor: 'pointer'
                  }}
                >
                  {submittingAction ? 'Submitting...' : 'Confirm Action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
