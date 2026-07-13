import React, { useState, useEffect } from 'react';
import api from "../../../services/api";
import { useTheme, makeS } from "../../../contexts/ThemeContext";
import { Icons } from "../../../components/Icon/PartnerIcons";

export default function ManageWithdrawals() {
  const { C } = useTheme();
  const S = makeS(C);

  // Listing State
  const [withdrawals, setWithdrawals] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Process Modal State
  const [selectedReq, setSelectedReq] = useState(null);
  const [utrNumber, setUtrNumber] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionType, setActionType] = useState(""); // "approve" or "reject"

  const fetchWithdrawals = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/wallet/withdrawals", {
        params: {
          page,
          limit: 10,
          status,
        },
      });
      if (res.data?.success) {
        setWithdrawals(res.data.data);
        setTotal(res.data.pagination?.total || res.data.data.length);
      }
    } catch (e) {
      console.error(e);
      setErr(e.response?.data?.message || "Failed to load withdrawal requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [page, status]);

  const handleOpenProcess = (req, type) => {
    setSelectedReq(req);
    setActionType(type);
    setUtrNumber("");
    setRejectionReason("");
    setAdminNote("");
  };

  const handleProcessSubmit = async (e) => {
    e.preventDefault();
    if (actionType === "approve" && !utrNumber.trim()) {
      return alert("UTR number is required to approve the withdrawal.");
    }
    if (actionType === "reject" && !rejectionReason.trim()) {
      return alert("Rejection reason is required to reject the withdrawal.");
    }

    setActionLoading(true);
    try {
      if (actionType === "approve") {
        await api.post("/admin/withdrawal/approve", {
          id: selectedReq.id,
          utr_number: utrNumber.trim(),
          admin_note: adminNote.trim() || undefined,
        });
      } else {
        await api.post("/admin/withdrawal/reject", {
          id: selectedReq.id,
          rejection_reason: rejectionReason.trim(),
          admin_note: adminNote.trim() || undefined,
        });
      }

      alert(`Withdrawal request successfully ${actionType}d!`);
      setSelectedReq(null);
      fetchWithdrawals();
    } catch (e) {
      alert(e.response?.data?.message || `Failed to process withdrawal.`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      {/* Title */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: 800, color: C.text, margin: 0 }}>Withdrawal Requests</h2>
        <p style={{ fontSize: "13px", color: C.textLight, margin: "4px 0 0 0" }}>Process pending payouts, record transaction UTR IDs, or review withdrawal history logs</p>
      </div>

      {/* Tabs / Filter Options */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px", background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "6px", width: "fit-content" }}>
        {["pending", "approved", "rejected"].map((tab) => (
          <button
            key={tab}
            onClick={() => { setStatus(tab); setPage(1); }}
            style={{
              background: status === tab ? C.teal : "transparent",
              color: status === tab ? "#fff" : C.textMid,
              border: "none", borderRadius: "8px", padding: "8px 16px",
              fontWeight: 700, fontSize: "13px", textTransform: "capitalize", cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Requests Table */}
      {err && (
        <div style={{ padding: "16px", background: `${C.red}10`, border: `1px solid ${C.red}30`, borderRadius: "12px", color: C.red, marginBottom: "16px" }}>
          {err}
        </div>
      )}

      <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "48px", color: C.textLight }}>
            <div className="animate-spin" style={{ width: "24px", height: "24px", border: `3px solid ${C.teal}`, borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto 8px" }}></div>
            Loading withdrawals list...
          </div>
        ) : withdrawals.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px", color: C.textLight }}>No {status} withdrawal requests found.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, color: C.textLight, fontSize: "12px", textTransform: "uppercase" }}>
                  <th style={{ padding: "14px 16px" }}>Partner</th>
                  <th style={{ padding: "14px 16px" }}>Requested Amount</th>
                  <th style={{ padding: "14px 16px" }}>Bank details</th>
                  <th style={{ padding: "14px 16px" }}>Requested Date</th>
                  {status !== "pending" && <th style={{ padding: "14px 16px" }}>Log Info</th>}
                  {status === "pending" && <th style={{ padding: "14px 16px", textAlign: "right" }}>Actions</th>}
                </tr>
              </thead>
              <tbody style={{ fontSize: "13.5px", color: C.text }}>
                {withdrawals.map((req) => (
                  <tr key={req.id} style={{ borderBottom: `1px solid ${C.border}60` }}>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 600 }}>{req.first_name} {req.last_name}</div>
                      <div style={{ fontSize: "11px", color: C.textLight, fontMono: true }}>Code: {req.Partner_code || req.partner_code}</div>
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: 700, color: C.text }}>
                      ₹{parseFloat(req.amount).toLocaleString("en-IN")}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 500 }}>{req.bank_name || "N/A"}</div>
                      <div style={{ fontSize: "11px", color: C.textLight }}>A/c: {req.account_number} • IFSC: {req.ifsc_code}</div>
                    </td>
                    <td style={{ padding: "14px 16px", color: C.textLight }}>
                      {new Date(req.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    {status !== "pending" && (
                      <td style={{ padding: "14px 16px" }}>
                        {req.status === "approved" ? (
                          <div>
                            <div style={{ fontSize: "12.5px", fontWeight: 600, color: C.green }}>Approved</div>
                            <div style={{ fontSize: "11px", color: C.textLight }}>UTR: {req.utr_number}</div>
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontSize: "12.5px", fontWeight: 600, color: C.red }}>Rejected</div>
                            <div style={{ fontSize: "11px", color: C.textLight }}>Reason: {req.rejection_reason}</div>
                          </div>
                        )}
                      </td>
                    )}
                    {status === "pending" && (
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          <button
                            onClick={() => handleOpenProcess(req, "approve")}
                            style={{ background: "none", border: "none", color: C.green, fontWeight: 700, cursor: "pointer", fontSize: "13px" }}
                          >
                            Approve
                          </button>
                          <span style={{ color: C.border }}>|</span>
                          <button
                            onClick={() => handleOpenProcess(req, "reject")}
                            style={{ background: "none", border: "none", color: C.red, fontWeight: 700, cursor: "pointer", fontSize: "13px" }}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Actions */}
      {selectedReq && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 1000,
          background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px"
        }}>
          <div style={{
            background: C.card, borderRadius: "20px", border: `1px solid ${C.border}`,
            width: "100%", maxWidth: "500px", padding: "24px", position: "relative"
          }}>
            {/* Close */}
            <button
              onClick={() => setSelectedReq(null)}
              style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", color: C.textLight, cursor: "pointer" }}
            >
              <Icons.x size={20} />
            </button>

            <h3 style={{ fontSize: "18px", fontWeight: 800, color: C.text, marginBottom: "16px", textTransform: "capitalize" }}>
              {actionType} Withdrawal Request
            </h3>

            <div style={{ background: C.bgSecondary, padding: "14px", borderRadius: "12px", marginBottom: "16px", fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ color: C.textLight }}>Partner:</span>
                <span style={{ fontWeight: 600, color: C.text }}>{selectedReq.first_name} {selectedReq.last_name}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ color: C.textLight }}>Amount:</span>
                <span style={{ fontWeight: 700, color: C.teal }}>₹{parseFloat(selectedReq.amount).toLocaleString("en-IN")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: C.textLight }}>Bank details:</span>
                <span style={{ fontWeight: 500, color: C.text, textAlign: "right" }}>{selectedReq.bank_name} <br/>{selectedReq.account_number}</span>
              </div>
            </div>

            <form onSubmit={handleProcessSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {actionType === "approve" ? (
                <div>
                  <label style={{ fontSize: "11.5px", color: C.textLight, fontWeight: 700, display: "block", marginBottom: "6px" }}>Bank Transaction UTR / Ref Number *</label>
                  <input
                    style={S.input}
                    placeholder="Enter IMPS/NEFT/UPI Ref ID"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    required
                  />
                </div>
              ) : (
                <div>
                  <label style={{ fontSize: "11.5px", color: C.textLight, fontWeight: 700, display: "block", marginBottom: "6px" }}>Reason for Rejection *</label>
                  <textarea
                    style={{ ...S.input, minHeight: "60px" }}
                    placeholder="Provide details about why the payout is rejected"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    required
                  />
                </div>
              )}

              <div>
                <label style={{ fontSize: "11.5px", color: C.textLight, fontWeight: 700, display: "block", marginBottom: "6px" }}>Internal Note (Optional)</label>
                <input
                  style={S.input}
                  placeholder="Reference memo or logs description..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "12px", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setSelectedReq(null)} style={{ ...S.btn("outline"), border: "none", color: C.textLight }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{ ...S.btn("primary"), background: actionType === "approve" ? C.green : C.red }}
                >
                  {actionLoading ? "Processing..." : actionType === "approve" ? "Approve & Mark Sent" : "Reject Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
