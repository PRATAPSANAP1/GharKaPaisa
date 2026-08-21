import React, { useState, useEffect } from 'react';
import api from "../../../services/api";
import { useTheme, makeS } from "../../../contexts/ThemeContext";
import { Icons } from "../../../components/Icon/PartnerIcons";
import AdminDocumentVerificationModal from './AdminDocumentVerificationModal';

export default function ManageApplications() {
  const { C } = useTheme();
  const S = makeS(C);

  // Verification Modal State
  const [verifyModalApp, setVerifyModalApp] = useState(null);
  const [verifyModalTab, setVerifyModalTab] = useState('qd');

  // Listing State
  const [apps, setApps] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Detail Modal State
  const [selectedApp, setSelectedApp] = useState(null);
  const [appDetail, setAppDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

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
        setApps(res.data.data);
        setTotal(res.data.pagination?.total || res.data.data.length);
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
    setNewStatus("");
    setBankRefNumber("");
    setApprovedAmount("");
    setRejectionReason("");
    setNotes("");
    try {
      const res = await api.get(`/applications/${app.id}`);
      if (res.data?.success) {
        const det = res.data.data;
        setAppDetail(det);
        setNewStatus(det.status);
        setBankRefNumber(det.bank_ref_number || "");
        setApprovedAmount(det.approved_amount || "");
        setRejectionReason(det.rejection_reason || "");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to load application details.");
    } finally {
      setLoadingDetail(false);
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
    { id: '', label: 'All', color: '#6366f1', bg: '#6366f115' },
    { id: 'pending', label: 'Pending', color: '#f59e0b', bg: '#f59e0b15' },
    { id: 'details_submitted', label: 'Details Submitted', color: '#3b82f6', bg: '#3b82f615' },
    { id: 'operational_verified', label: 'Operational Verified', color: '#8b5cf6', bg: '#8b5cf615' },
    { id: 'approved', label: 'Approved', color: '#10b981', bg: '#10b98115' },
    { id: 'commission_released', label: 'Commission Released', color: '#06b6d4', bg: '#06b6d415' },
    { id: 'commission_received', label: 'Commission Received', color: '#16a34a', bg: '#16a34a15' },
  ];

  // Calculate status counts
  const statusCounts = apps.reduce((acc, app) => {
    const s = String(app.status || '').toLowerCase();
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
      case 'commission_released': return { bg: '#06b6d415', color: '#06b6d4', border: '#06b6d440', label: 'Commission Released' };
      case 'commission_received': return { bg: '#16a34a15', color: '#16a34a', border: '#16a34a40', label: 'Commission Received' };
      default: return { bg: `${C.gold}15`, color: C.gold, border: `${C.gold}40`, label: st };
    }
  };

  return (
    <div>
      {/* Title */}
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: 800, color: C.text, margin: 0 }}>Applications Management</h2>
        <p style={{ fontSize: "13px", color: C.textLight, margin: "4px 0 0 0" }}>Track status-wise customer application forms, edit processing stage, and manage partner commissions</p>
      </div>

      {/* Status-Wise Summary Tabs */}
      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '20px' }}>
        {STATUS_TABS.map((tab) => {
          const isActive = status === tab.id;
          const count = tab.id === '' ? total : (statusCounts[tab.id] || 0);
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
            <option value="commission_released">Commission Released</option>
            <option value="commission_received">Commission Received</option>
          </select>
          <button type="submit" style={{ ...S.btn("primary", false), padding: "10px 20px" }}>
            Search
          </button>
        </form>
      </div>

      {/* Applications Table */}
      {err && (
        <div style={{ padding: "16px", background: `${C.red}10`, border: `1px solid ${C.red}30`, borderRadius: "12px", color: C.red, marginBottom: "16px" }}>
          {err}
        </div>
      )}

      <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "48px", color: C.textLight }}>
            <div className="animate-spin" style={{ width: "24px", height: "24px", border: `3px solid ${C.teal}`, borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto 8px" }}></div>
            Loading applications...
          </div>
        ) : apps.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px", color: C.textLight }}>No applications found for selected status.</div>
        ) : (
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
                  <th style={{ padding: "14px 16px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: "13.5px", color: C.text }}>
                {apps.map((app) => {
                  const badge = getStatusBadgeStyle(app.status);
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
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px", alignItems: "center" }}>
                          <button
                            onClick={() => { setVerifyModalTab('qd'); setVerifyModalApp(app); }}
                            style={{ background: "#2563eb15", border: "1px solid #2563eb40", color: "#2563eb", padding: "6px 10px", borderRadius: "6px", fontSize: "11.5px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                          >
                            📋 QD
                          </button>
                          <button
                            onClick={() => { setVerifyModalTab('remark'); setVerifyModalApp(app); }}
                            style={{ background: "#ea580c15", border: "1px solid #ea580c40", color: "#ea580c", padding: "6px 10px", borderRadius: "6px", fontSize: "11.5px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                          >
                            ⚙️ Remark
                          </button>
                          <button
                            onClick={() => { setVerifyModalTab('final'); setVerifyModalApp(app); }}
                            style={{ background: "#16a34a15", border: "1px solid #16a34a40", color: "#16a34a", padding: "6px 10px", borderRadius: "6px", fontSize: "11.5px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                          >
                            🏦 Final
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal detail */}
      {selectedApp && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 10000,
          background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", padding: "12px"
        }}>
          <div style={{
            background: C.card, borderRadius: "20px", border: `1px solid ${C.border}`,
            width: "100%", maxWidth: "600px", maxHeight: "92vh", overflowY: "auto", padding: "20px 20px 80px 20px", position: "relative"
          }}>
            {/* Close */}
            <button
              onClick={() => setSelectedApp(null)}
              style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", color: C.textLight, cursor: "pointer" }}
            >
              <Icons.x size={20} />
            </button>

            <h3 style={{ fontSize: "18px", fontWeight: 800, color: C.text, marginBottom: "16px" }}>
              Application: {selectedApp.app_number}
            </h3>

            {loadingDetail ? (
              <div style={{ textAlign: "center", padding: "24px", color: C.textLight }}>Loading details...</div>
            ) : appDetail ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* Customer Info Card */}
                <div>
                  <h4 style={{ fontSize: "13px", fontWeight: 700, color: C.textLight, textTransform: "uppercase", marginBottom: "8px" }}>Customer Demographics</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", background: C.bgSecondary, padding: "14px", borderRadius: "12px" }}>
                    <div>
                      <div style={{ fontSize: "11px", color: C.textLight }}>Full Name</div>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: C.text }}>{appDetail.customer_name}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "11px", color: C.textLight }}>Mobile Phone</div>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: C.text }}>{appDetail.customer_mobile}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "11px", color: C.textLight }}>PAN Number</div>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: C.text, textTransform: "uppercase" }}>{appDetail.pan_number || "N/A"}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "11px", color: C.textLight }}>Monthly Income</div>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: C.text }}>
                        {appDetail.monthly_income ? `₹${parseFloat(appDetail.monthly_income).toLocaleString("en-IN")}` : "N/A"}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "11px", color: C.textLight }}>Employment Type</div>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: C.text, textTransform: "capitalize" }}>{appDetail.employment_type || "N/A"}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "11px", color: C.textLight }}>City / State</div>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: C.text }}>{appDetail.city || "N/A"}</div>
                    </div>
                  </div>
                </div>

                {/* Uploaded App Documents */}
                {appDetail.documents && appDetail.documents.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: "13px", fontWeight: 700, color: C.textLight, textTransform: "uppercase", marginBottom: "8px" }}>Uploaded Files</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {appDetail.documents.map((doc, idx) => (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.card, border: `1px solid ${C.border}`, padding: "10px", borderRadius: "10px" }}>
                          <span style={{ fontSize: "12px", fontWeight: 600, textTransform: "capitalize", color: C.text }}>{doc.doc_type.replace("_", " ")}</span>
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: C.teal, fontWeight: 700, textDecoration: "none" }}>
                            Download ↗
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status Update Form */}
                <form onSubmit={handleUpdateStatus} style={{ borderTop: `1px solid ${C.border}`, paddingTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: 700, color: C.text }}>Modify Processing Status</h4>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ fontSize: "11px", color: C.textLight, fontWeight: 600 }}>Application Status</label>
                      <select
                        style={S.input}
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        required
                      >
                        <option value="pending">Pending</option>
                        <option value="details_submitted">Details Submitted</option>
                        <option value="operational_verified">Operational Verified</option>
                        <option value="approved">Approved</option>
                        <option value="commission_released">Commission Released</option>
                        <option value="commission_received">Commission Received</option>
                      </select>
                    </div>

                    {(newStatus === "approved" || newStatus === "disbursed" || newStatus === "confirmed") && (
                      <div>
                        <label style={{ fontSize: "11px", color: C.textLight, fontWeight: 600 }}>Approved Amount (₹)</label>
                        <input
                          type="number"
                          style={S.input}
                          placeholder="e.g. 50000"
                          value={approvedAmount}
                          onChange={(e) => setApprovedAmount(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {(newStatus === "approved" || newStatus === "disbursed" || newStatus === "confirmed") && (
                    <div>
                      <label style={{ fontSize: "11px", color: C.textLight, fontWeight: 600 }}>Bank Reference / Loan Account #</label>
                      <input
                        style={S.input}
                        placeholder="Reference number from bank portal"
                        value={bankRefNumber}
                        onChange={(e) => setBankRefNumber(e.target.value)}
                      />
                    </div>
                  )}

                  {newStatus === "rejected" && (
                    <div>
                      <label style={{ fontSize: "11px", color: C.textLight, fontWeight: 600 }}>Rejection Reason *</label>
                      <textarea
                        style={{ ...S.input, minHeight: "50px" }}
                        placeholder="Why was this rejected?"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label style={{ fontSize: "11px", color: C.textLight, fontWeight: 600 }}>Internal Admin Notes</label>
                    <input
                      style={S.input}
                      placeholder="Add brief details of action taken..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  <div style={{
                    display: "flex", gap: "8px", marginTop: "16px", justifyContent: "flex-end",
                    position: "sticky", bottom: "-20px", background: C.card, paddingTop: "12px", paddingBottom: "12px",
                    borderTop: `1px solid ${C.border}`, zIndex: 10
                  }}>
                    <button type="button" onClick={() => setSelectedApp(null)} style={{ ...S.btn("outline"), border: "none", color: C.textLight }}>
                      Cancel
                    </button>
                    <button type="submit" disabled={actionLoading} style={{ ...S.btn("primary") }}>
                      {actionLoading ? "Saving..." : "Update Status"}
                    </button>
                  </div>
                </form>
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
