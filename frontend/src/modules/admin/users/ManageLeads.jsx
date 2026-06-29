import React, { useState, useEffect } from "react";
import api from "../../../services/api";
import { useTheme, makeS } from "../../../contexts/ThemeContext";
import { Icons } from "../../../components/Icon/PartnerIcons";

export default function ManageLeads() {
  const { C } = useTheme();
  const S = makeS(C);

  // Listing State
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Action states
  const [actionLoading, setActionLoading] = useState(null); // stores lead ID during status update

  const fetchLeads = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/leads", {
        params: {
          page,
          limit: 10,
          search: search || undefined,
          status: status || undefined,
        },
      });
      if (res.data?.success) {
        setLeads(res.data.data);
        setTotal(res.data.pagination?.total || res.data.data.length);
      }
    } catch (e) {
      console.error(e);
      setErr(e.response?.data?.message || "Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [page, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLeads();
  };

  const handleStatusChange = async (leadId, newStatus) => {
    const confirmation = window.confirm(`Are you sure you want to mark this lead as ${newStatus.toUpperCase()}?`);
    if (!confirmation) return;

    setActionLoading(leadId);
    try {
      const res = await api.patch(`/leads/${leadId}/status`, { status: newStatus });
      if (res.data?.success) {
        alert(`Lead status updated to ${newStatus} successfully!`);
        fetchLeads();
      }
    } catch (e) {
      alert(e.response?.data?.message || `Failed to update lead status to ${newStatus}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      {/* Title */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: 800, color: C.text, margin: 0 }}>Leads Management</h2>
        <p style={{ fontSize: "13px", color: C.textLight, margin: "4px 0 0 0" }}>Review partner-submitted customer leads, track referral status, and verify details for payout generation</p>
      </div>

      {/* Filters */}
      <div style={{ ...S.card, padding: "16px", marginBottom: "24px" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: "240px" }}>
            <input
              style={S.input}
              placeholder="Search customer name, mobile..."
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
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="confirmed">Bank Confirmed</option>
            <option value="rejected">Rejected</option>
          </select>
          <button type="submit" style={{ ...S.btn("primary", false), padding: "10px 20px" }}>
            Search
          </button>
        </form>
      </div>

      {/* Error Banner */}
      {err && (
        <div style={{ padding: "16px", background: `${C.red}10`, border: `1px solid ${C.red}30`, borderRadius: "12px", color: C.red, marginBottom: "16px" }}>
          {err}
        </div>
      )}

      {/* Leads Table Card */}
      <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "48px", color: C.textLight }}>
            <div style={{ width: "24px", height: "24px", border: `3px solid ${C.teal}`, borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto 8px", animation: "spin 1s linear infinite" }}></div>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            Loading leads data...
          </div>
        ) : leads.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px", color: C.textLight }}>No leads found matching current filters.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, color: C.textLight, fontSize: "12px", textTransform: "uppercase" }}>
                  <th style={{ padding: "14px 16px" }}>Customer Name</th>
                  <th style={{ padding: "14px 16px" }}>Mobile Number</th>
                  <th style={{ padding: "14px 16px" }}>Referral Partner</th>
                  <th style={{ padding: "14px 16px" }}>Requested Product</th>
                  <th style={{ padding: "14px 16px" }}>Payout Commission</th>
                  <th style={{ padding: "14px 16px" }}>Status</th>
                  <th style={{ padding: "14px 16px", textAlign: "right" }}>Verifications</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: "13.5px", color: C.text }}>
                {leads.map((lead) => (
                  <tr key={lead.id} style={{ borderBottom: `1px solid ${C.border}60` }}>
                    <td style={{ padding: "14px 16px", fontWeight: 700 }}>{lead.customer_name}</td>
                    <td style={{ padding: "14px 16px", fontMono: true }}>{lead.mobile}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 600 }}>{lead.partner_first_name} {lead.partner_last_name}</div>
                      <div style={{ fontSize: "11px", color: C.textLight }}>Code: {lead.Partner_code || lead.partner_code}</div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>{lead.product_name}</td>
                    <td style={{ padding: "14px 16px", fontWeight: 700, color: C.green }}>
                      ₹{parseFloat(lead.product_commission || 0).toLocaleString("en-IN")}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ 
                        ...S.tag(
                          lead.status === "confirmed" ? C.green : 
                          lead.status === "approved" ? C.teal : 
                          lead.status === "rejected" ? C.red : C.gold
                        )
                      }}>
                        {lead.status === "confirmed" ? "Bank Confirmed" : lead.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      {lead.status === "pending" ? (
                        <div style={{ display: "inline-flex", gap: "8px" }}>
                          <button
                            disabled={actionLoading !== null}
                            onClick={() => handleStatusChange(lead.id, "approved")}
                            style={{ 
                              background: C.green + "20", 
                              color: C.green, 
                              border: `1px solid ${C.green}40`,
                              padding: "6px 12px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: 700,
                              cursor: "pointer",
                              transition: "all 0.15s"
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = C.green + "35"}
                            onMouseLeave={e => e.currentTarget.style.background = C.green + "20"}
                          >
                            Approve
                          </button>
                          <button
                            disabled={actionLoading !== null}
                            onClick={() => handleStatusChange(lead.id, "rejected")}
                            style={{ 
                              background: C.red + "20", 
                              color: C.red, 
                              border: `1px solid ${C.red}40`,
                              padding: "6px 12px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: 700,
                              cursor: "pointer",
                              transition: "all 0.15s"
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = C.red + "35"}
                            onMouseLeave={e => e.currentTarget.style.background = C.red + "20"}
                          >
                            Reject
                          </button>
                        </div>
                      ) : lead.status === "approved" ? (
                        <div style={{ display: "inline-flex", gap: "8px" }}>
                          <button
                            disabled={actionLoading !== null}
                            onClick={() => handleStatusChange(lead.id, "confirmed")}
                            style={{ 
                              background: C.teal + "20", 
                              color: C.teal, 
                              border: `1px solid ${C.teal}40`,
                              padding: "6px 12px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: 700,
                              cursor: "pointer",
                              transition: "all 0.15s"
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = C.teal + "35"}
                            onMouseLeave={e => e.currentTarget.style.background = C.teal + "20"}
                          >
                            Bank Confirm
                          </button>
                          <button
                            disabled={actionLoading !== null}
                            onClick={() => handleStatusChange(lead.id, "rejected")}
                            style={{ 
                              background: C.red + "20", 
                              color: C.red, 
                              border: `1px solid ${C.red}40`,
                              padding: "6px 12px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: 700,
                              cursor: "pointer",
                              transition: "all 0.15s"
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = C.red + "35"}
                            onMouseLeave={e => e.currentTarget.style.background = C.red + "20"}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: "12px", color: C.textLight }}>
                          {lead.status === "confirmed" ? "Bank Confirmed" : "Rejected"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
        {!loading && total > 10 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderTop: `1px solid ${C.border}`, background: C.bgSecondary }}>
            <span style={{ fontSize: "12px", color: C.textLight }}>Showing page {page} of {Math.ceil(total / 10)} ({total} total leads)</span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                style={{ ...S.btn("outline", false), padding: "6px 12px", fontSize: "12px" }}
              >
                Previous
              </button>
              <button
                disabled={page * 10 >= total}
                onClick={() => setPage(page + 1)}
                style={{ ...S.btn("outline", false), padding: "6px 12px", fontSize: "12px" }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
