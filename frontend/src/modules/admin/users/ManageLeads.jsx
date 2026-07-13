import React, { useState, useEffect } from 'react';
import api from "../../../services/api";
import { useTheme, makeS } from "../../../contexts/ThemeContext";
import { Icons } from "../../../components/Icon/PartnerIcons";

export default function ManageLeads() {
  const { C, isDark } = useTheme();
  const S = makeS(C);

  // Listing State
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Action & Modal states
  const [actionLoading, setActionLoading] = useState(null);
  const [viewingLead, setViewingLead] = useState(null);
  const [showAccountNum, setShowAccountNum] = useState(false);

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
        if (viewingLead && viewingLead.id === leadId) {
          setViewingLead(null);
        }
        fetchLeads();
      }
    } catch (e) {
      alert(e.response?.data?.message || `Failed to update lead status to ${newStatus}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Title */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: 800, color: C.text, margin: 0 }}>Leads Management</h2>
        <p style={{ fontSize: "13px", color: C.textLight, margin: "4px 0 0 0" }}>
          Review partner-submitted customer leads, verify bank and customer details, and confirm bank approval for commission settlement.
        </p>
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
                  <th style={{ padding: "14px 16px", textAlign: "right" }}>Actions / Verification</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: "13.5px", color: C.text }}>
                {leads.map((lead) => (
                  <tr key={lead.id} style={{ borderBottom: `1px solid ${C.border}60` }}>
                    <td style={{ padding: "14px 16px", fontWeight: 700 }}>
                      <div>{lead.customer_name}</div>
                      {lead.city && <div style={{ fontSize: "11px", color: C.textLight }}>📍 {lead.city}</div>}
                    </td>
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
                      <div style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                        
                        {/* View Bank & Details Button */}
                        <button
                          onClick={() => { setViewingLead(lead); setShowAccountNum(false); }}
                          style={{
                            background: `${C.primary}15`,
                            color: C.primary,
                            border: `1px solid ${C.primary}35`,
                            padding: "6px 10px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                          title="View Bank & Customer Details Verification"
                        >
                          👁️ View Details
                        </button>

                        {lead.status === "pending" && (
                          <>
                            <button
                              disabled={actionLoading !== null}
                              onClick={() => handleStatusChange(lead.id, "approved")}
                              style={{ 
                                background: C.green + "20", color: C.green, 
                                border: `1px solid ${C.green}40`, padding: "6px 10px",
                                borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer"
                              }}
                            >
                              Approve
                            </button>
                            <button
                              disabled={actionLoading !== null}
                              onClick={() => handleStatusChange(lead.id, "rejected")}
                              style={{ 
                                background: C.red + "20", color: C.red, 
                                border: `1px solid ${C.red}40`, padding: "6px 10px",
                                borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer"
                              }}
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {lead.status === "approved" && (
                          <>
                            <button
                              disabled={actionLoading !== null}
                              onClick={() => { setViewingLead(lead); setShowAccountNum(false); }}
                              style={{ 
                                background: C.teal + "20", color: C.teal, 
                                border: `1px solid ${C.teal}40`, padding: "6px 10px",
                                borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer"
                              }}
                            >
                              Bank Confirm
                            </button>
                            <button
                              disabled={actionLoading !== null}
                              onClick={() => handleStatusChange(lead.id, "rejected")}
                              style={{ 
                                background: C.red + "20", color: C.red, 
                                border: `1px solid ${C.red}40`, padding: "6px 10px",
                                borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer"
                              }}
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
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

      {/* ════ BANK DETAILS & CUSTOMER VERIFICATION MODAL ════ */}
      {viewingLead && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(5px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "16px", animation: "fadeIn 0.2s ease"
        }}>
          <div style={{
            background: C.card, border: `1.5px solid ${C.border}`,
            borderRadius: "20px", maxWidth: "600px", width: "100%",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            overflow: "hidden", maxHeight: "90vh", display: "flex", flexDirection: "column"
          }}>
            {/* Header */}
            <div style={{
              padding: "18px 24px", borderBottom: `1px solid ${C.border}`,
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: C.bgSecondary
            }}>
              <div>
                <h3 style={{ fontSize: "17px", fontWeight: 800, color: C.text, margin: 0 }}>
                  Bank & Customer Verification
                </h3>
                <span style={{ fontSize: "12px", color: C.textLight }}>
                  Lead ID: <span style={{ fontFamily: "monospace" }}>{viewingLead.id}</span>
                </span>
              </div>
              <button
                onClick={() => setViewingLead(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: C.textLight, fontSize: "20px", fontWeight: 700 }}
              >
                ✕
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div style={{ padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "20px" }}>
              
              {/* 1. Requested Product & Payout Banner */}
              <div style={{
                background: `linear-gradient(135deg, ${C.primary}12, ${C.teal}12)`,
                border: `1.5px solid ${C.primary}30`, borderRadius: "14px", padding: "16px",
                display: "flex", justifyContent: "space-between", alignItems: "center"
              }}>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: C.textLight, textTransform: "uppercase" }}>Requested Product</div>
                  <div style={{ fontSize: "15px", fontWeight: 800, color: C.text, marginTop: "2px" }}>{viewingLead.product_name}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: C.textLight, textTransform: "uppercase" }}>Payout Commission</div>
                  <div style={{ fontSize: "18px", fontWeight: 900, color: C.green, marginTop: "2px" }}>
                    ₹{parseFloat(viewingLead.product_commission || 0).toLocaleString("en-IN")}
                  </div>
                </div>
              </div>

              {/* 2. Customer Information */}
              <div>
                <h4 style={{ fontSize: "12px", fontWeight: 800, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 10px" }}>
                  👤 Customer Profile Information
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: C.bgSecondary, padding: "14px", borderRadius: "12px", border: `1px solid ${C.border}` }}>
                  <div>
                    <span style={{ fontSize: "11px", color: C.textLight, fontWeight: 600 }}>Full Name:</span>
                    <div style={{ fontSize: "13.5px", fontWeight: 700, color: C.text }}>{viewingLead.customer_name}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: C.textLight, fontWeight: 600 }}>Mobile Number:</span>
                    <div style={{ fontSize: "13.5px", fontWeight: 700, color: C.text, fontFamily: "monospace" }}>{viewingLead.mobile}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: C.textLight, fontWeight: 600 }}>Email Address:</span>
                    <div style={{ fontSize: "12.5px", fontWeight: 600, color: C.text }}>{viewingLead.customer_email || "N/A"}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: C.textLight, fontWeight: 600 }}>City / Location:</span>
                    <div style={{ fontSize: "12.5px", fontWeight: 600, color: C.text }}>{viewingLead.city || "N/A"} {viewingLead.customer_state ? `, ${viewingLead.customer_state}` : ""}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: C.textLight, fontWeight: 600 }}>Employment Type:</span>
                    <div style={{ fontSize: "12.5px", fontWeight: 600, color: C.text, textTransform: "capitalize" }}>{viewingLead.customer_employment_type || "N/A"}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: C.textLight, fontWeight: 600 }}>Monthly Income:</span>
                    <div style={{ fontSize: "12.5px", fontWeight: 600, color: C.text }}>{viewingLead.customer_monthly_income ? `₹${parseFloat(viewingLead.customer_monthly_income).toLocaleString('en-IN')}` : "N/A"}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: C.textLight, fontWeight: 600 }}>PAN Number:</span>
                    <div style={{ fontSize: "12.5px", fontWeight: 700, color: C.text, fontFamily: "monospace" }}>{viewingLead.customer_pan || "N/A"}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: C.textLight, fontWeight: 600 }}>Aadhaar Last 4:</span>
                    <div style={{ fontSize: "12.5px", fontWeight: 700, color: C.text, fontFamily: "monospace" }}>{viewingLead.customer_aadhaar ? `XXXX-XXXX-${viewingLead.customer_aadhaar}` : "N/A"}</div>
                  </div>
                </div>
              </div>

              {/* 3. Partner & Registered Bank Details Section */}
              <div>
                <h4 style={{ fontSize: "12px", fontWeight: 800, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 10px" }}>
                  🏦 Registered Partner Bank Account Details
                </h4>
                <div style={{ background: C.bgSecondary, padding: "14px", borderRadius: "12px", border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: "12px" }}>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <span style={{ fontSize: "11px", color: C.textLight, fontWeight: 600 }}>Partner Name:</span>
                      <div style={{ fontSize: "13.5px", fontWeight: 700, color: C.text }}>{viewingLead.partner_first_name} {viewingLead.partner_last_name}</div>
                      <div style={{ fontSize: "11px", color: C.textLight }}>Code: {viewingLead.partner_code}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", color: C.textLight, fontWeight: 600 }}>KYC Status:</span>
                      <div>
                        <span style={{
                          fontSize: "11px", fontWeight: 800, padding: "3px 8px", borderRadius: "6px",
                          background: viewingLead.partner_kyc_status === 'approved' ? `${C.green}20` : `${C.gold}20`,
                          color: viewingLead.partner_kyc_status === 'approved' ? C.green : C.gold
                        }}>
                          {viewingLead.partner_kyc_status === 'approved' ? '🟢 KYC Approved' : '🟡 KYC Pending'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ height: 1, background: C.border }} />

                  {/* Bank Account Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <span style={{ fontSize: "11px", color: C.textLight, fontWeight: 600 }}>Account Holder Name:</span>
                      <div style={{ fontSize: "13.5px", fontWeight: 700, color: C.text }}>
                        {viewingLead.partner_account_holder_name || `${viewingLead.partner_first_name} ${viewingLead.partner_last_name}`}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", color: C.textLight, fontWeight: 600 }}>Bank Name:</span>
                      <div style={{ fontSize: "13.5px", fontWeight: 700, color: C.primary }}>
                        {viewingLead.partner_bank_name || "N/A"}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", color: C.textLight, fontWeight: 600 }}>Account Number:</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "13.5px", fontWeight: 800, color: C.text, fontFamily: "monospace" }}>
                          {viewingLead.partner_account_number ? (
                            showAccountNum ? viewingLead.partner_account_number : `••••••••${viewingLead.partner_account_number.slice(-4)}`
                          ) : "N/A"}
                        </span>
                        {viewingLead.partner_account_number && (
                          <button
                            type="button"
                            onClick={() => setShowAccountNum(!showAccountNum)}
                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "11px", color: C.primary, fontWeight: 700, padding: 0 }}
                          >
                            {showAccountNum ? "Hide" : "Show"}
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", color: C.textLight, fontWeight: 600 }}>IFSC Code:</span>
                      <div style={{ fontSize: "13.5px", fontWeight: 800, color: C.text, fontFamily: "monospace" }}>
                        {viewingLead.partner_ifsc_code || "N/A"}
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* Footer Verification Action Buttons */}
            <div style={{
              padding: "16px 24px", borderTop: `1px solid ${C.border}`,
              background: C.bgSecondary, display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px"
            }}>
              <button
                type="button"
                onClick={() => setViewingLead(null)}
                style={{ ...S.btn("outline", false), padding: "10px 18px", fontSize: "13px" }}
              >
                Close
              </button>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  disabled={actionLoading !== null}
                  onClick={() => handleStatusChange(viewingLead.id, "rejected")}
                  style={{
                    background: `${C.red}15`, color: C.red, border: `1px solid ${C.red}30`,
                    borderRadius: "10px", padding: "10px 18px", fontSize: "13px", fontWeight: 700, cursor: "pointer"
                  }}
                >
                  Reject Lead
                </button>
                {viewingLead.status !== "confirmed" && (
                  <button
                    type="button"
                    disabled={actionLoading !== null}
                    onClick={() => handleStatusChange(viewingLead.id, "confirmed")}
                    style={{
                      background: "linear-gradient(135deg, #0D5CAB, #083E7A)", color: "#FFFFFF",
                      border: "none", borderRadius: "10px", padding: "10px 20px", fontSize: "13px",
                      fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(13, 92, 171, 0.2)"
                    }}
                  >
                    ✓ Confirm Bank Verification & Approve
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
