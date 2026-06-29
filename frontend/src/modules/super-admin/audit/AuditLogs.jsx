import React, { useState, useEffect } from "react";
import api from "../../../services/api";
import { useTheme, makeS } from "../../../contexts/ThemeContext";
import { Icons } from "../../../components/Icon/PartnerIcons";

export default function AuditLogs() {
  const { C } = useTheme();
  const S = makeS(C);

  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [adminUser, setAdminUser] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/superadmin/audit-logs", {
        params: {
          page,
          limit: 15,
          action: action || undefined,
          admin_user: adminUser.trim() || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        },
      });
      if (res.data?.success) {
        setLogs(res.data.data);
        setTotal(res.data.pagination?.total || res.data.data.length);
      }
    } catch (e) {
      console.error(e);
      setErr(e.response?.data?.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, action]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleResetFilters = () => {
    setAction("");
    setAdminUser("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  return (
    <div>
      {/* Title */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: 800, color: C.text, margin: 0 }}>System Audit Logs</h2>
        <p style={{ fontSize: "13px", color: C.textLight, margin: "4px 0 0 0" }}>Monitor administrative actions, policy changes, wallet updates, and profile updates across the platform</p>
      </div>

      {/* Filter panel */}
      <div style={{ ...S.card, padding: "16px", marginBottom: "24px" }}>
        <form onSubmit={handleFilterSubmit} style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: "180px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: C.textLight, display: "block", marginBottom: "4px" }}>Admin Username / ID</label>
            <input
              style={S.input}
              placeholder="Filter by Admin Email or ID"
              value={adminUser}
              onChange={(e) => setAdminUser(e.target.value)}
            />
          </div>
          <div style={{ width: "200px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: C.textLight, display: "block", marginBottom: "4px" }}>System Action</label>
            <select
              style={S.input}
              value={action}
              onChange={(e) => { setAction(e.target.value); setPage(1); }}
            >
              <option value="">All Actions</option>
              <option value="CREATE_ADMIN">Create Admin</option>
              <option value="BLOCK_USER">Block User</option>
              <option value="UNBLOCK_USER">Unblock User</option>
              <option value="APPROVE_KYC">Approve KYC</option>
              <option value="REJECT_KYC">Reject KYC</option>
              <option value="MANUAL_WALLET_ADJUSTMENT">Wallet Adjust</option>
              <option value="APPROVE_WITHDRAWAL">Approve Payout</option>
              <option value="REJECT_WITHDRAWAL">Reject Payout</option>
              <option value="UPDATE_APPLICATION_STATUS">Update Application</option>
              <option value="SET_COMMISSION_RULE">Set Commission</option>
            </select>
          </div>
          <div style={{ width: "150px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: C.textLight, display: "block", marginBottom: "4px" }}>Start Date</label>
            <input
              type="date"
              style={S.input}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div style={{ width: "150px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: C.textLight, display: "block", marginBottom: "4px" }}>End Date</label>
            <input
              type="date"
              style={S.input}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="submit" style={{ ...S.btn("primary"), padding: "10px 20px" }}>
              Filter
            </button>
            <button type="button" onClick={handleResetFilters} style={{ ...S.btn("outline"), padding: "10px 16px", border: "none", color: C.textLight }}>
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Logs Table */}
      {err && (
        <div style={{ padding: "16px", background: `${C.red}10`, border: `1px solid ${C.red}30`, borderRadius: "12px", color: C.red, marginBottom: "16px" }}>
          {err}
        </div>
      )}

      <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "48px", color: C.textLight }}>
            <div className="animate-spin" style={{ width: "24px", height: "24px", border: `3px solid ${C.teal}`, borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto 8px" }}></div>
            Loading audit logs...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px", color: C.textLight }}>No audit logs recorded matching criteria.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, color: C.textLight, fontSize: "12px", textTransform: "uppercase" }}>
                  <th style={{ padding: "14px 16px" }}>Timestamp</th>
                  <th style={{ padding: "14px 16px" }}>Action</th>
                  <th style={{ padding: "14px 16px" }}>Triggered By</th>
                  <th style={{ padding: "14px 16px" }}>Target ID</th>
                  <th style={{ padding: "14px 16px" }}>Detailed Parameters</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: "13.5px", color: C.text }}>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: `1px solid ${C.border}60` }} className="hover:bg-gray-50/10">
                    <td style={{ padding: "14px 16px", color: C.textLight }}>
                      {new Date(log.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: 700 }}>
                      <span style={{
                        display: "inline-block", padding: "3px 8px", borderRadius: "6px", fontSize: "10.5px", textTransform: "uppercase",
                        background: log.action.includes("CREATE") || log.action.includes("APPROVE") ? `${C.green}15` : log.action.includes("BLOCK") || log.action.includes("REJECT") ? `${C.red}15` : `${C.teal}15`,
                        color: log.action.includes("CREATE") || log.action.includes("APPROVE") ? C.green : log.action.includes("BLOCK") || log.action.includes("REJECT") ? C.red : C.teal,
                      }}>
                        {log.action.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 600 }}>{log.admin_email || "System"}</div>
                      <div style={{ fontSize: "11px", color: C.textLight, textTransform: "capitalize" }}>{log.admin_role || "automated"}</div>
                    </td>
                    <td style={{ padding: "14px 16px", fontMono: true }}>{log.target_id}</td>
                    <td style={{ padding: "14px 16px", maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={JSON.stringify(log.details)}>
                      <code style={{ fontSize: "12px", color: C.textMid }}>{JSON.stringify(log.details)}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination controls */}
      {total > 15 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", color: C.textLight, fontSize: "13px" }}>
          <div>Showing {logs.length} of {total} records</div>
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              style={{ ...S.btn("outline"), padding: "6px 12px", fontSize: "12px", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.5 : 1 }}
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={logs.length < 15}
              style={{ ...S.btn("outline"), padding: "6px 12px", fontSize: "12px", cursor: logs.length < 15 ? "not-allowed" : "pointer", opacity: logs.length < 15 ? 0.5 : 1 }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
