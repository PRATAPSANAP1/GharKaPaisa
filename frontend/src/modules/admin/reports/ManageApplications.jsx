import React, { useState, useEffect } from 'react';
import api from "../../../services/api";
import { useTheme, makeS } from "../../../contexts/ThemeContext";
import { Icons } from "../../../components/Icon/PartnerIcons";
import { FileText, FileEdit, Building2, Clock, Search, CheckCircle2, Sparkles, XCircle, Layers, Eye } from 'lucide-react';
import AdminDocumentVerificationModal from './AdminDocumentVerificationModal';
import { useAuthStore } from '../../../app/store/authStore';

export default function ManageApplications() {
  const { C } = useTheme();
  const S = makeS(C);

  const user = useAuthStore((state) => state.user);
  const userRole = (user?.role || '').toUpperCase();
  const isOpsHeadOrSuperAdmin = ['SUPER_ADMIN', 'ADMIN', 'OPERATIONS_HEAD', 'OPERATIONAL_HEAD'].includes(userRole);

  // Verification Modal State
  const [verifyModalApp, setVerifyModalApp] = useState(null);
  const [verifyModalTab, setVerifyModalTab] = useState('qd');

  // Listing State
  const [apps, setApps] = useState([]);
  const [total, setTotal] = useState(0);
  const [allCount, setAllCount] = useState(0);
  const [backendStatusCounts, setBackendStatusCounts] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Detail / Review Modal State
  const [selectedApp, setSelectedApp] = useState(null);
  const [appDetail, setAppDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [timelines, setTimelines] = useState([]);
  const [superAdminRemark, setSuperAdminRemark] = useState("");
  const [submittingApprove, setSubmittingApprove] = useState(false);

  // Status Update State
  const [newStatus, setNewStatus] = useState("");
  const [bankRefNumber, setBankRefNumber] = useState("");
  const [approvedAmount, setApprovedAmount] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [notes, setNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchApplications = async () => {
    if (apps.length === 0) setLoading(true);
    setErr("");
    try {
      const res = await api.get("/applications", {
        params: {
          page,
          limit: 100,
          search: search || undefined,
          status: status || undefined,
        },
      });
      if (res.data?.success) {
        const fetchedTotal = res.data.pagination?.total || res.data.data.length;
        setApps(res.data.data);
        setTotal(fetchedTotal);
        if (res.data.status_counts) {
          setBackendStatusCounts(res.data.status_counts);
        }
        if (!status && !search) {
          setAllCount(fetchedTotal);
        }
      }
    } catch (e) {
      console.error(e);
      setErr(e.response?.data?.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [page, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchApplications();
  };

  const handleViewDetails = async (app) => {
    setSelectedApp(app);
    setAppDetail(null);
    setLoadingDetail(true);
    setSuperAdminRemark("");
    setTimelines([]);
    setNewStatus("");
    setBankRefNumber("");
    setApprovedAmount("");
    setRejectionReason("");
    setNotes("");
    try {
      const [res, tRes] = await Promise.all([
        api.get(`/applications/${app.id}`).catch(() => null),
        api.get(`/applications/${app.id}/timeline`).catch(() => null)
      ]);
      if (res?.data?.success) {
        const det = res.data.data;
        const pd = det.physical_details || {};
        const merged = { ...app, ...det, ...pd };
        setAppDetail(merged);
        setNewStatus(isOpsHeadOrSuperAdmin ? (det.status || "operational_verified") : "operational_verified");
        setBankRefNumber(det.bank_ref_number || pd.bank_ref_number || "");
        setApprovedAmount(det.approved_amount || pd.approved_amount || "");
        setRejectionReason(det.rejection_reason || pd.decline_reason || "");
      } else {
        setAppDetail(app);
      }
      if (tRes?.data?.success) {
        setTimelines(tRes.data.data || []);
      }
    } catch (e) {
      console.error(e);
      setAppDetail(app);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleApproveApplication = async (appId) => {
    setSubmittingApprove(true);
    try {
      const res = await api.put(`/applications/${appId}/verification`, {
        status: 'approved',
        final_status: 'App File Generated (Approved)',
        bank_remark: superAdminRemark.trim() || 'Approved by Operation Head / Super Admin'
      });
      if (res.data?.success) {
        alert("Application status updated to APPROVED successfully!");
        setSelectedApp(null);
        fetchApplications();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to approve application.");
    } finally {
      setSubmittingApprove(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!newStatus) return alert("Please select a status.");
    if (newStatus === "rejected" && !rejectionReason.trim()) {
      return alert("Rejection reason is required when status is rejected.");
    }

    setActionLoading(true);
    try {
      const res = await api.patch(`/applications/${selectedApp.id}/status`, {
        status: newStatus,
        bank_ref_number: bankRefNumber.trim() || undefined,
        approved_amount: approvedAmount ? parseFloat(approvedAmount) : undefined,
        rejection_reason: newStatus === "rejected" ? rejectionReason.trim() : undefined,
        notes: notes.trim() || undefined,
      });

      if (res.data?.success) {
        alert("Application status updated successfully!");
        setSelectedApp(null);
        fetchApplications();
      }
    } catch (e) {
      alert(e.response?.data?.message || "Failed to update application status.");
    } finally {
      setActionLoading(false);
    }
  };

  const STATUS_TABS = [
    { id: '', label: 'All Applications', color: C.primary, bg: `${C.primary}15` },
    { id: 'pending', label: 'Pending', color: '#f59e0b', bg: '#f59e0b15' },
    { id: 'details_submitted', label: 'Details Submitted', color: '#3b82f6', bg: '#3b82f615' },
    { id: 'operational_verified', label: 'Operational Verified', color: '#8b5cf6', bg: '#8b5cf615' },
    { id: 'approved', label: 'Approved', color: '#10b981', bg: '#10b98115' },
    { id: 'commission_received', label: 'Commission Received', color: '#16a34a', bg: '#16a34a15' },
    { id: 'rejected', label: 'Rejected', color: '#ef4444', bg: '#ef444415' },
    { id: 'cancelled', label: 'Cancelled', color: '#64748b', bg: '#64748b15' },
  ];

  // Calculate status counts
  const statusCounts = apps.reduce((acc, app) => {
    let s = String(app.status || '').toLowerCase();
    if (s === 'commission_released') s = 'commission_received';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const getStatusBadgeStyle = (st) => {
    const s = String(st || '').toLowerCase();
    switch (s) {
      case 'pending': return { bg: '#f59e0b15', color: '#f59e0b', border: '#f59e0b40', label: 'Pending' };
      case 'details_submitted': return { bg: '#3b82f615', color: '#3b82f6', border: '#3b82f640', label: 'Details Submitted' };
      case 'operational_verified': return { bg: '#8b5cf615', color: '#8b5cf6', border: '#8b5cf640', label: 'Operational Verified' };
      case 'approved': return { bg: '#10b98115', color: '#10b981', border: '#10b98140', label: 'Approved' };
      case 'commission_released':
      case 'commission_received': return { bg: '#16a34a15', color: '#16a34a', border: '#16a34a40', label: 'Commission Received' };
      case 'rejected': return { bg: '#ef444415', color: '#ef4444', border: '#ef444440', label: 'Rejected' };
      case 'cancelled': return { bg: '#64748b15', color: '#64748b', border: '#64748b40', label: 'Cancelled' };
      default: return { bg: `${C.gold}15`, color: C.gold, border: `${C.gold}40`, label: st };
    }
  };

  return (
    <div>
      {/* Status-Wise Summary Tabs */}
      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '20px' }}>
        {STATUS_TABS.map((tab) => {
          const isActive = status === tab.id;
          const count = tab.id === ''
            ? (backendStatusCounts?.all !== undefined ? backendStatusCounts.all : (allCount || total))
            : (backendStatusCounts ? (backendStatusCounts[tab.id] || 0) : (statusCounts[tab.id] || 0));
          return (
            <button
              key={tab.id}
              onClick={() => { setStatus(tab.id); setPage(1); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '12px',
                background: isActive ? tab.color : C.card,
                color: isActive ? '#ffffff' : C.text,
                border: `1px solid ${isActive ? tab.color : C.border}`,
                fontWeight: 700, fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? `0 4px 12px ${tab.color}35` : 'none'
              }}
            >
              <span>{tab.label}</span>
              <span style={{
                background: isActive ? 'rgba(255,255,255,0.25)' : tab.bg,
                color: isActive ? '#ffffff' : tab.color,
                padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 800
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter Options */}
      <div style={{ ...S.card, padding: "16px", marginBottom: "24px" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <input
              style={S.input}
              placeholder="Search by App #, Customer Name, Mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            style={{ ...S.input, width: "auto", minWidth: "180px" }}
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="details_submitted">Details Submitted</option>
            <option value="operational_verified">Operational Verified</option>
            <option value="approved">Approved</option>
            <option value="commission_received">Commission Received</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button type="submit" style={{ ...S.btn("primary", false), padding: "10px 20px" }}>
            Search
          </button>
        </form>
      </div>

      {/* ── Unified Applications Table (Newest First) ── */}
      {err && (
        <div style={{ padding: "16px", background: `${C.red}10`, border: `1px solid ${C.red}30`, borderRadius: "12px", color: C.red, marginBottom: "16px" }}>
          {err}
        </div>
      )}

      {loading ? (
        <div style={{ ...S.card, textAlign: "center", padding: "48px", color: C.textLight }}>
          <div className="animate-spin" style={{ width: "24px", height: "24px", border: `3px solid ${C.teal}`, borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto 8px" }}></div>
          Loading applications...
        </div>
      ) : apps.length === 0 ? (
        <div style={{ ...S.card, textAlign: "center", padding: "48px", color: C.textLight }}>No applications found matching criteria.</div>
      ) : (
        (() => {
          const sortedApps = [...apps].sort((a, b) => {
            const timeA = a.created_at ? new Date(a.created_at).getTime() : (a.id || 0);
            const timeB = b.created_at ? new Date(b.created_at).getTime() : (b.id || 0);
            return timeB - timeA;
          });

          return (
            <div
              style={{
                ...S.card,
                padding: 0,
                borderRadius: "16px",
                overflow: "hidden",
                border: `1px solid ${C.border}`
              }}
            >
              <div style={{
                padding: "16px 20px",
                background: C.bgSecondary,
                borderBottom: `1px solid ${C.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <h3 style={{ fontSize: "15px", fontWeight: 800, color: C.text, margin: 0 }}>
                  Applications ({sortedApps.length})
                </h3>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, color: C.textLight, fontSize: "12px", textTransform: "uppercase" }}>
                      <th style={{ padding: "14px 16px" }}>App #</th>
                      <th style={{ padding: "14px 16px" }}>Customer Details</th>
                      <th style={{ padding: "14px 16px" }}>Partner</th>
                      <th style={{ padding: "14px 16px" }}>Product</th>
                      <th style={{ padding: "14px 16px" }}>Applied Amount</th>
                      <th style={{ padding: "14px 16px" }}>Commission</th>
                      <th style={{ padding: "14px 16px" }}>Status</th>
                      <th style={{ padding: "14px 16px" }}>Date</th>
                      <th style={{ padding: "14px 16px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: "13.5px", color: C.text }}>
                    {sortedApps.map((app) => {
                      const badge = getStatusBadgeStyle(app.status);
                      const formattedDate = app.created_at ? new Date(app.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

                      return (
                        <tr key={app.id} style={{ borderBottom: `1px solid ${C.border}60` }}>
                          <td style={{ padding: "14px 16px", fontWeight: 700, fontMono: true }}>{app.app_number}</td>
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ fontWeight: 600 }}>{app.customer_name}</div>
                            <div style={{ fontSize: "11px", color: C.textLight }}>{app.customer_mobile}</div>
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <div>{app.Partner_first_name || app.partner_first_name || 'Direct'} {app.Partner_last_name || app.partner_last_name || ''}</div>
                            <div style={{ fontSize: "11px", color: C.textLight }}>Code: {app.Partner_code || app.partner_code || 'N/A'}</div>
                            <div style={{
                              marginTop: "4px", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", display: "inline-block",
                              padding: "2px 8px", borderRadius: "6px",
                              background: (app.process_by === 'partner_share' || app.process_by === 'share_link' || (app.process_by && app.process_by.includes('share'))) ? `${C.teal}15` : (app.process_by === 'customer_direct' || app.process_by === 'direct' || (app.process_by && app.process_by.includes('direct'))) ? `${C.blue}15` : `${C.purple}15`,
                              color: (app.process_by === 'partner_share' || app.process_by === 'share_link' || (app.process_by && app.process_by.includes('share'))) ? C.teal : (app.process_by === 'customer_direct' || app.process_by === 'direct' || (app.process_by && app.process_by.includes('direct'))) ? C.blue : C.purple
                            }}>
                              {(app.process_by === 'partner_share' || app.process_by === 'share_link' || (app.process_by && app.process_by.includes('share'))) ? '🔗 Share Link' : (app.process_by === 'customer_direct' || app.process_by === 'direct' || (app.process_by && app.process_by.includes('direct'))) ? '📱 Customer Apply' : '✍️ Partner Punch'}
                            </div>
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ fontWeight: 500 }}>{app.product_name}</div>
                            <div style={{ fontSize: "11px", color: C.textLight, textTransform: "capitalize" }}>{app.category} • {app.bank_code}</div>
                          </td>
                          <td style={{ padding: "14px 16px", fontWeight: 600 }}>
                            {app.loan_amount && Number(app.loan_amount) > 0 
                              ? `₹${parseFloat(app.loan_amount).toLocaleString("en-IN")}`
                              : (app.monthly_income || app.salary) 
                                ? `₹${parseFloat(app.monthly_income || app.salary).toLocaleString("en-IN")} / mo` 
                                : 'N/A'}
                          </td>
                          <td style={{ padding: "14px 16px", color: C.green, fontWeight: 700 }}>
                            ₹{parseFloat(app.commission_amount || 0).toLocaleString("en-IN")}
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <span style={{
                              display: "inline-block", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 800, textTransform: "uppercase",
                              background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`
                            }}>
                              {badge.label}
                            </span>
                          </td>
                          <td style={{ padding: "14px 16px", fontSize: "12px", color: C.textLight, whiteSpace: "nowrap" }}>
                            {formattedDate}
                          </td>
                          <td style={{ padding: "14px 16px", textAlign: "right" }}>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px", alignItems: "center" }}>
                              {isOpsHeadOrSuperAdmin && (
                                <button
                                  onClick={() => handleViewDetails(app)}
                                  style={{ background: "#7c3aed15", border: "1px solid #7c3aed40", color: "#7c3aed", padding: "6px 10px", borderRadius: "6px", fontSize: "11.5px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                                >
                                  <Eye size={12} /> Review
                                </button>
                              )}
                              <button
                                onClick={() => { setVerifyModalTab('qd'); setVerifyModalApp(app); }}
                                style={{ background: "#2563eb15", border: "1px solid #2563eb40", color: "#2563eb", padding: "6px 10px", borderRadius: "6px", fontSize: "11.5px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                              >
                                <FileText size={12} /> QD
                              </button>
                              <button
                                onClick={() => { setVerifyModalTab('remark'); setVerifyModalApp(app); }}
                                style={{ background: "#ea580c15", border: "1px solid #ea580c40", color: "#ea580c", padding: "6px 10px", borderRadius: "6px", fontSize: "11.5px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: 'center', gap: "4px" }}
                              >
                                <FileEdit size={12} /> Remark
                              </button>
                              <button
                                onClick={() => { setVerifyModalTab('final'); setVerifyModalApp(app); }}
                                style={{ background: "#16a34a15", border: "1px solid #16a34a40", color: "#16a34a", padding: "6px 10px", borderRadius: "6px", fontSize: "11.5px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                              >
                                <Building2 size={12} /> Final
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()
      )}

      {/* Review / Detail Modal */}
      {selectedApp && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 10000,
          background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(5px)", display: "flex", justifyContent: "center", alignItems: "center", padding: "16px"
        }}>
          <div style={{
            background: C.card, borderRadius: "20px", border: `1px solid ${C.border}`,
            width: "100%", maxWidth: "850px", maxHeight: "92vh", overflowY: "auto", padding: "24px", position: "relative",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)"
          }}>
            {/* Close */}
            <button
              onClick={() => setSelectedApp(null)}
              style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", color: C.textLight, cursor: "pointer" }}
            >
              <Icons.x size={20} />
            </button>

            {loadingDetail ? (
              <div style={{ textAlign: "center", padding: "40px", color: C.textLight, fontWeight: 600 }}>Loading details...</div>
            ) : appDetail ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                
                {/* Header Summary */}
                <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: '14px', marginRight: '40px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, background: `${C.primary}15`, color: C.primary, padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>
                    {appDetail.app_number || appDetail.application_no || 'APP-REF'}
                  </span>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: C.text, margin: '6px 0 2px' }}>
                    {appDetail.customer_name || appDetail.full_name || 'Customer'}
                  </h3>
                  <p style={{ fontSize: '12.5px', color: C.textLight, margin: 0 }}>
                    Category: <strong>{appDetail.category || 'credit_card'}</strong> • Product: <strong>{appDetail.product_name || 'Credit Card'}</strong> • Bank: <strong>{appDetail.bank_name || 'Partner Bank'}</strong>
                  </p>
                </div>

                {/* Super Admin / Ops Head Final Approval & Status Upgrade Card */}
                <div style={{ background: `${C.primary}08`, border: `1.5px solid ${C.primary}30`, padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ fontWeight: 800, fontSize: '14px', color: C.primary, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={18} /> Super Admin Final Approval & Status Upgrade
                    </div>
                    <span style={{
                      fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '12px',
                      background: appDetail.status === 'approved' ? '#dcfce7' : '#ffedd5',
                      color: appDetail.status === 'approved' ? '#15803d' : '#c2410c',
                      textTransform: 'uppercase'
                    }}>
                      Current Status: {(appDetail.status || 'pending').replace(/_/g, ' ')}
                    </span>
                  </div>
                  
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: C.textLight, display: 'block', marginBottom: '4px' }}>Super Admin Remark / Approval Note</label>
                    <textarea
                      rows={2}
                      placeholder="Enter remarks or approval notes..."
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '13px', background: C.bgSecondary, color: C.text, boxSizing: 'border-box' }}
                      value={superAdminRemark}
                      onChange={e => setSuperAdminRemark(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      disabled={submittingApprove}
                      onClick={() => handleApproveApplication(appDetail.id)}
                      style={{ background: '#16a34a', color: '#ffffff', border: 'none', padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <CheckCircle2 size={16} /> {submittingApprove ? 'Approving...' : 'Approve (Super Admin Approved)'}
                    </button>
                    <button
                      onClick={() => {
                        const targetApp = appDetail;
                        setSelectedApp(null);
                        setVerifyModalTab('qd');
                        setVerifyModalApp(targetApp);
                      }}
                      style={{ background: '#2563eb15', border: '1px solid #2563eb40', color: '#2563eb', padding: '8px 14px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      ✏️ Edit Details (Form 1 / 2 / 3)
                    </button>
                  </div>
                </div>

                {/* Form 1: Quick Details */}
                <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px' }}>
                  <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: C.primary, margin: '0 0 12px', borderBottom: `1px solid ${C.border}`, paddingBottom: '6px' }}>
                    Form 1: Quick Details
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', fontSize: '12.5px' }}>
                    <div><span style={{ color: C.textLight }}>Customer Name:</span> <strong style={{ color: C.text }}>{appDetail.customer_name || appDetail.full_name || appDetail.pan_name || '—'}</strong></div>
                    <div><span style={{ color: C.textLight }}>Mobile Number:</span> <strong style={{ color: C.text }}>{appDetail.customer_mobile || appDetail.mobile || appDetail.aadhaar_linked_mobile || '—'}</strong></div>
                    <div><span style={{ color: C.textLight }}>Email Address:</span> <strong style={{ color: C.text }}>{appDetail.customer_email || appDetail.email || appDetail.personal_email || '—'}</strong></div>
                    <div><span style={{ color: C.textLight }}>PAN Card Number:</span> <strong style={{ color: C.text, fontFamily: 'monospace' }}>{appDetail.pan_number || appDetail.pan || '—'}</strong></div>
                    <div><span style={{ color: C.textLight }}>Date of Birth (DOB):</span> <strong style={{ color: C.text }}>{appDetail.dob || appDetail.date_of_birth || '—'}</strong></div>
                    <div><span style={{ color: C.textLight }}>Aadhaar Number:</span> <strong style={{ color: C.text, fontFamily: 'monospace' }}>{appDetail.aadhaar_number || appDetail.aadhaar_no || '—'}</strong></div>
                    <div><span style={{ color: C.textLight }}>Mother's Name:</span> <strong style={{ color: C.text }}>{appDetail.mother_name || '—'}</strong></div>
                    <div><span style={{ color: C.textLight }}>Employer / Company Name:</span> <strong style={{ color: C.text }}>{appDetail.company_name || appDetail.employer_name || '—'}</strong></div>
                    <div><span style={{ color: C.textLight }}>Occupation / Designation:</span> <strong style={{ color: C.text }}>{appDetail.designation || appDetail.occupation || '—'}</strong></div>
                    <div><span style={{ color: C.textLight }}>Monthly Income / Salary:</span> <strong style={{ color: '#16a34a', fontWeight: 800 }}>{(appDetail.monthly_salary || appDetail.monthly_income) ? `₹${parseFloat(appDetail.monthly_salary || appDetail.monthly_income).toLocaleString('en-IN')}` : '—'}</strong></div>
                    <div><span style={{ color: C.textLight }}>Residential Address:</span> <strong style={{ color: C.text }}>{[appDetail.address || appDetail.residential_address || appDetail.flat_no, appDetail.city, appDetail.state, appDetail.pincode].filter(Boolean).join(', ') || '—'}</strong></div>
                    <div><span style={{ color: C.textLight }}>Partner Code & Name:</span> <strong style={{ color: C.text }}>{appDetail.partner_code ? `${appDetail.partner_code} (${appDetail.partner_first_name || ''} ${appDetail.partner_last_name || ''})` : 'Direct / Admin'}</strong></div>
                  </div>
                </div>

                {/* Part 2: Operational Processing & Remark Form */}
                <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px' }}>
                  <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: '#0d9488', margin: '0 0 12px', borderBottom: `1px solid ${C.border}`, paddingBottom: '6px' }}>
                    Part 2: Operational Processing & Remark Form
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', fontSize: '12.5px' }}>
                    <div><span style={{ color: C.textLight }}>Appcode Status:</span> <strong style={{ color: C.text }}>{appDetail.appcode_status || 'Appcode Pending'}</strong></div>
                    <div><span style={{ color: C.textLight }}>Soft Approval Status:</span> <strong style={{ color: C.text }}>{appDetail.soft_approval_status || '—'}</strong></div>
                    <div><span style={{ color: C.textLight }}>VKYC Stage:</span> <strong style={{ color: C.text }}>{appDetail.vkyc_stage || '—'}</strong></div>
                    <div><span style={{ color: C.textLight }}>IQA Stage:</span> <strong style={{ color: C.text }}>{appDetail.iqa_stage || '—'}</strong></div>
                    <div><span style={{ color: C.textLight }}>Dispatch Status:</span> <strong style={{ color: C.text }}>{appDetail.dispatch_status || '—'}</strong></div>
                    <div><span style={{ color: C.textLight }}>Operational Remarks:</span> <strong style={{ color: C.text }}>{appDetail.ops_remark || appDetail.processing_remark || appDetail.remarks || '—'}</strong></div>
                  </div>
                </div>

                {/* Part 3: Bank Remark & Final Form */}
                <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px' }}>
                  <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: '#9333ea', margin: '0 0 12px', borderBottom: `1px solid ${C.border}`, paddingBottom: '6px' }}>
                    Part 3: Bank Remark & Final Form
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', fontSize: '12.5px' }}>
                    <div><span style={{ color: C.textLight }}>App / Bank Reference #:</span> <strong style={{ color: C.text, fontFamily: 'monospace' }}>{appDetail.bank_ref_number || appDetail.bank_application_number || appDetail.app_number || '—'}</strong></div>
                    <div><span style={{ color: C.textLight }}>Applied Loan Amount:</span> <strong style={{ color: C.text }}>{appDetail.loan_amount ? `₹${parseFloat(appDetail.loan_amount).toLocaleString('en-IN')}` : '₹0'}</strong></div>
                    <div><span style={{ color: C.textLight }}>Approved Amount:</span> <strong style={{ color: '#16a34a', fontWeight: 800 }}>{appDetail.approved_amount ? `₹${parseFloat(appDetail.approved_amount).toLocaleString('en-IN')}` : '—'}</strong></div>
                    <div><span style={{ color: C.textLight }}>Commission Amount / Status:</span> <strong style={{ color: C.text }}>{appDetail.commission_amount ? `₹${parseFloat(appDetail.commission_amount).toLocaleString('en-IN')}` : '₹500.00'} ({appDetail.commission_status || 'pending'})</strong></div>
                    <div><span style={{ color: C.textLight }}>VKYC / Direct Web Link:</span> <strong style={{ color: C.text }}>{appDetail.vkyc_url ? <a href={appDetail.vkyc_url} target="_blank" rel="noreferrer" style={{ color: C.primary }}>Open Link ↗</a> : '—'}</strong></div>
                    <div><span style={{ color: C.textLight }}>Final Status from Bank:</span> <strong style={{ color: C.text }}>{appDetail.final_status || 'pending'}</strong></div>
                    <div><span style={{ color: C.textLight }}>Eligible for Re-QD:</span> <strong style={{ color: C.text }}>{appDetail.eligible_reqd || 'No'}</strong></div>
                    <div><span style={{ color: C.textLight }}>Bank Remark:</span> <strong style={{ color: C.text }}>{appDetail.bank_remark || '—'}</strong></div>
                    <div><span style={{ color: C.textLight }}>Decline / Rejection Reason:</span> <strong style={{ color: '#dc2626' }}>{appDetail.decline_reason || appDetail.rejection_reason || '—'}</strong></div>
                    <div><span style={{ color: C.textLight }}>Super Admin Remark:</span> <strong style={{ color: C.text }}>{appDetail.super_admin_remark || '—'}</strong></div>
                  </div>
                </div>

                {/* Verification Lifecycle Log Stream */}
                <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px' }}>
                  <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: C.text, margin: '0 0 12px', borderBottom: `1px solid ${C.border}`, paddingBottom: '6px' }}>
                    Verification Lifecycle Log
                  </h4>
                  {timelines && timelines.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {timelines.map((t, idx) => (
                        <div key={idx} style={{ padding: '10px 14px', borderRadius: '8px', background: C.card, border: `1px solid ${C.border}`, fontSize: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: C.textLight, fontSize: '11px', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 700, color: C.primary }}>{t.activity || t.title || 'Event'}</span>
                            <span>{new Date(t.created_at || t.timestamp).toLocaleString('en-IN')}</span>
                          </div>
                          <div style={{ fontWeight: 600, color: C.text }}>{t.description || t.status}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: C.textLight, fontStyle: 'italic' }}>No verification log events recorded yet.</div>
                  )}
                </div>

              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {verifyModalApp && (
        <AdminDocumentVerificationModal
          application={verifyModalApp}
          initialTab={verifyModalTab}
          onClose={() => setVerifyModalApp(null)}
          onRefresh={fetchApplications}
        />
      )}
    </div>
  );
}
