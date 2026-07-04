import React, { useState, useEffect } from "react";
import api from "../../../services/api";
import { useTheme, makeS } from "../../../contexts/ThemeContext";
import { Icons } from "../../../components/Icon/PartnerIcons";

export default function ManageApplications() {
  const { C } = useTheme();
  const S = makeS(C);

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
    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/applications", {
        params: {
          page,
          limit: 10,
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

  return (
    <div>
      {/* Title */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: 800, color: C.text, margin: 0 }}>Applications Management</h2>
        <p style={{ fontSize: "13px", color: C.textLight, margin: "4px 0 0 0" }}>Track customer application forms, edit processing status, and credit partner commissions</p>
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
            style={{ ...S.input, width: "auto", minWidth: "160px" }}
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="confirmed">Confirmed</option>
            <option value="disbursed">Disbursed</option>
            <option value="rejected">Rejected</option>
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
          <div style={{ textAlign: "center", padding: "48px", color: C.textLight }}>No applications found.</div>
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
                {apps.map((app) => (
                  <tr key={app.id} style={{ borderBottom: `1px solid ${C.border}60` }}>
                    <td style={{ padding: "14px 16px", fontWeight: 700, fontMono: true }}>{app.app_number}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 600 }}>{app.customer_name}</div>
                      <div style={{ fontSize: "11px", color: C.textLight }}>{app.customer_mobile}</div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div>{app.Partner_first_name} {app.Partner_last_name}</div>
                      <div style={{ fontSize: "11px", color: C.textLight }}>Code: {app.Partner_code || app.partner_code}</div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 500 }}>{app.product_name}</div>
                      <div style={{ fontSize: "11px", color: C.textLight, textTransform: "capitalize" }}>{app.category} • {app.bank_code}</div>
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: 600 }}>
                      ₹{parseFloat(app.loan_amount).toLocaleString("en-IN")}
                    </td>
                    <td style={{ padding: "14px 16px", color: C.green, fontWeight: 700 }}>
                      ₹{parseFloat(app.commission_amount).toLocaleString("en-IN")}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{
                        display: "inline-block", padding: "3px 8px", borderRadius: "6px", fontSize: "11.5px", fontWeight: 700, textTransform: "uppercase",
                        background: app.status === "approved" || app.status === "disbursed" ? `${C.green}15` : app.status === "rejected" ? `${C.red}15` : `${C.gold}15`,
                        color: app.status === "approved" || app.status === "disbursed" ? C.green : app.status === "rejected" ? C.red : C.gold
                      }}>
                        {app.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <button
                        onClick={() => handleViewDetails(app)}
                        style={{ background: "none", border: "none", color: C.teal, fontWeight: 700, cursor: "pointer" }}
                      >
                        Edit Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal detail */}
      {selectedApp && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 1000,
          background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px"
        }}>
          <div style={{
            background: C.card, borderRadius: "20px", border: `1px solid ${C.border}`,
            width: "100%", maxWidth: "600px", maxHeight: "90%", overflowY: "auto", padding: "24px", position: "relative"
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
                        <option value="submitted">Submitted</option>
                        <option value="under_review">Under Review</option>
                        <option value="approved">Approved (Triggers Commission)</option>
                        <option value="confirmed">Confirmed (Matures Commission)</option>
                        <option value="disbursed">Disbursed (Triggers Commission)</option>
                        <option value="rejected">Rejected</option>
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

                  <div style={{ display: "flex", gap: "8px", marginTop: "10px", justifyContent: "flex-end" }}>
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
    </div>
  );
}
