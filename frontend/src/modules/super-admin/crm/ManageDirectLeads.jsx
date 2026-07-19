import React, { useState, useEffect } from 'react';
import api from "../../../services/api";
import { useTheme, makeS } from "../../../contexts/ThemeContext";

export default function ManageDirectLeads() {
  const { C, isDark } = useTheme();
  const S = makeS(C);

  // Listing & Filter State
  const [activeCategory, setActiveCategory] = useState("all");
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modal State for Manual Lead Entry
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [leadForm, setLeadForm] = useState({
    customerName: "",
    mobile: "",
    category: "credit_card",
    bankName: "",
    cardName: ""
  });

  const fetchLeads = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/card-applications", {
        params: {
          page,
          limit: 10,
          category: activeCategory !== "all" ? activeCategory : undefined,
          search: search || undefined,
        },
      });
      if (res.data?.success) {
        setLeads(res.data.data || []);
        setTotal(res.data.pagination?.total || (res.data.data || []).length);
      } else {
        setErr(res.data?.message || "Failed to load leads");
      }
    } catch (e) {
      console.error(e);
      setErr(e.response?.data?.message || "Failed to load direct application leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [page, activeCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLeads();
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    if (!leadForm.customerName || !leadForm.mobile || !leadForm.bankName || !leadForm.cardName) {
      setErr("Customer Name, Mobile, Bank/Provider, and Product/Card Name are required");
      return;
    }

    setSubmitting(true);
    setErr("");
    setSuccessMsg("");

    try {
      const res = await api.post("/card-applications", leadForm);
      if (res.data?.success) {
        setSuccessMsg("Direct lead created successfully!");
        setShowApplyModal(false);
        setLeadForm({ customerName: "", mobile: "", category: "credit_card", bankName: "", cardName: "" });
        setPage(1);
        fetchLeads();
      } else {
        setErr(res.data?.message || "Failed to create direct lead");
      }
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to create direct lead");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const res = await api.put(`/card-applications/${id}/status`, { status: newStatus });
      if (res.data?.success) {
        fetchLeads();
      }
    } catch (e) {
      console.error("Failed to update status", e);
    }
  };

  // Helper stats
  const todayLeadsCount = leads.filter(l => {
    const today = new Date().toDateString();
    const leadDate = new Date(l.created_at).toDateString();
    return today === leadDate;
  }).length;

  const categoryCounts = {
    credit_card: leads.filter(l => !l.category || l.category === 'credit_card').length,
    loan: leads.filter(l => l.category === 'loan' || l.category === 'personal_loan').length,
    insurance: leads.filter(l => l.category === 'insurance').length,
  };

  const categories = [
    { id: "all", label: "All Direct Leads", emoji: "📋" },
    { id: "credit_card", label: "Credit Cards", emoji: "💳" },
    { id: "loan", label: "Loans", emoji: "🏦" },
    { id: "insurance", label: "Insurance", emoji: "🛡️" },
  ];

  return (
    <div style={{ padding: "20px 0", fontFamily: "'Inter', sans-serif" }}>
      {/* Title & Top Action Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "26px", fontWeight: 800, color: C.text, margin: 0, letterSpacing: "-0.5px" }}>Direct Product Leads</h2>
          <p style={{ fontSize: "13.5px", color: C.textLight, margin: "6px 0 0 0", lineHeight: 1.4 }}>
            Manage direct customer leads and verified OTP applications for Credit Cards, Loans, and Insurance.
          </p>
        </div>

        <button
          onClick={() => setShowApplyModal(true)}
          style={{
            padding: "12px 22px", borderRadius: "12px", border: "none",
            background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
            color: "#FFFFFF", fontWeight: 800, fontSize: "14px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: "8px",
            boxShadow: `0 4px 16px ${C.primary}35`
          }}
        >
          <span>➕</span>
          <span>Apply Direct Lead</span>
        </button>
      </div>

      {/* Stats Cards Section */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div style={{ ...S.card, display: "flex", alignItems: "center", gap: "16px", padding: "18px" }}>
          <div style={{ width: "42px", height: "42px", background: `${C.primary}15`, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: C.primary, fontSize: "20px" }}>
            💳
          </div>
          <div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: C.text }}>{total}</div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: C.textLight, textTransform: "uppercase", marginTop: "2px" }}>Total Direct Leads</div>
          </div>
        </div>

        <div style={{ ...S.card, display: "flex", alignItems: "center", gap: "16px", padding: "18px" }}>
          <div style={{ width: "42px", height: "42px", background: `${C.green}15`, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: C.green, fontSize: "20px" }}>
            🔥
          </div>
          <div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: C.text }}>{todayLeadsCount}</div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: C.textLight, textTransform: "uppercase", marginTop: "2px" }}>Active Batch (Today)</div>
          </div>
        </div>

        <div style={{ ...S.card, display: "flex", alignItems: "center", gap: "16px", padding: "18px" }}>
          <div style={{ width: "42px", height: "42px", background: `${C.teal}15`, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: C.teal, fontSize: "20px" }}>
            🏦
          </div>
          <div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: C.text }}>{categoryCounts.loan}</div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: C.textLight, textTransform: "uppercase", marginTop: "2px" }}>Loan Leads</div>
          </div>
        </div>

        <div style={{ ...S.card, display: "flex", alignItems: "center", gap: "16px", padding: "18px" }}>
          <div style={{ width: "42px", height: "42px", background: `${C.gold}15`, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: C.gold, fontSize: "20px" }}>
            🛡️
          </div>
          <div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: C.text }}>{categoryCounts.insurance}</div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: C.textLight, textTransform: "uppercase", marginTop: "2px" }}>Insurance Leads</div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", overflowX: "auto", paddingBottom: "4px" }}>
        {categories.map(cat => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(cat.id); setPage(1); }}
              style={{
                padding: "10px 18px", borderRadius: "12px",
                border: `1.5px solid ${isActive ? C.primary : C.border}`,
                background: isActive ? `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)` : C.card,
                color: isActive ? "#FFFFFF" : C.text,
                fontWeight: 700, fontSize: "13px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s"
              }}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div style={{ ...S.card, padding: "18px", marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", flex: 1, gap: "12px", maxWidth: "500px" }}>
          <input
            style={{ ...S.input, margin: 0 }}
            placeholder="Search by customer name, mobile, bank/provider..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" style={{ ...S.btn("primary", false), padding: "10px 24px", fontSize: "13px", fontWeight: 700 }}>
            Search
          </button>
        </form>

        <button 
          onClick={fetchLeads}
          style={{ background: `${C.teal}10`, border: `1px solid ${C.teal}35`, color: C.teal, borderRadius: "10px", padding: "10px 18px", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
        >
          🔄 Refresh Table
        </button>
      </div>

      {/* Notifications */}
      {err && (
        <div style={{ padding: "14px 18px", background: `${C.red}10`, border: `1px solid ${C.red}25`, borderRadius: "14px", color: C.red, marginBottom: "20px", fontSize: "14px", fontWeight: 600 }}>
          ⚠️ {err}
        </div>
      )}
      {successMsg && (
        <div style={{ padding: "14px 18px", background: `${C.green}10`, border: `1px solid ${C.green}25`, borderRadius: "14px", color: C.green, marginBottom: "20px", fontSize: "14px", fontWeight: 600 }}>
          ✓ {successMsg}
        </div>
      )}

      {/* Data Table */}
      <div style={{ ...S.card, padding: 0, overflow: "hidden", border: `1px solid ${C.border}` }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "50px", color: C.textLight }}>
            <div style={{ width: "24px", height: "24px", border: `3px solid ${C.primary}`, borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto 12px", animation: "spin 1s linear infinite" }}></div>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            Fetching direct product leads...
          </div>
        ) : leads.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px", color: C.textLight, fontSize: "14.5px" }}>
            No direct leads found.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, color: C.textLight, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <th style={{ padding: "16px 20px" }}>Date</th>
                  <th style={{ padding: "16px 20px" }}>Category</th>
                  <th style={{ padding: "16px 20px" }}>Customer Details</th>
                  <th style={{ padding: "16px 20px" }}>Bank / Provider</th>
                  <th style={{ padding: "16px 20px" }}>Product / Card</th>
                  <th style={{ padding: "16px 20px" }}>Status Action</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: "13.5px", color: C.text }}>
                {leads.map((lead) => {
                  const catLabel = !lead.category || lead.category === 'credit_card' ? 'Credit Card' : (lead.category === 'insurance' ? 'Insurance' : 'Loan');
                  return (
                    <tr key={lead.id} style={{ borderBottom: `1px solid ${C.border}50` }}>
                      <td style={{ padding: "16px 20px", color: C.textLight }}>
                        {new Date(lead.created_at).toLocaleString("en-IN", {
                          day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                        })}
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 800, background: `${C.primary}15`, color: C.primary, padding: "4px 10px", borderRadius: "8px", textTransform: "uppercase" }}>
                          {catLabel}
                        </span>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ fontWeight: 700, fontSize: "14.5px" }}>{lead.customer_name}</div>
                        <div style={{ color: C.textLight, fontSize: "12px", marginTop: "2px", fontWeight: 500 }}>📱 {lead.mobile}</div>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 800, background: `${C.teal}12`, color: C.teal, padding: "4px 10px", borderRadius: "8px", textTransform: "uppercase" }}>
                          {lead.bank_name}
                        </span>
                      </td>
                      <td style={{ padding: "16px 20px", fontWeight: 600 }}>{lead.card_name}</td>
                      <td style={{ padding: "16px 20px" }}>
                        <select
                          value={lead.status || 'verified'}
                          onChange={(e) => handleStatusUpdate(lead.id, e.target.value)}
                          style={{
                            padding: "6px 10px", borderRadius: "8px",
                            border: `1px solid ${C.border}`, background: C.inputBg,
                            color: C.text, fontSize: "12px", fontWeight: 700, cursor: "pointer"
                          }}
                        >
                          <option value="verified">Verified</option>
                          <option value="contacted">Contacted</option>
                          <option value="converted">Converted</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && total > 10 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderTop: `1px solid ${C.border}`, background: C.bgSecondary }}>
            <span style={{ fontSize: "12.5px", color: C.textLight }}>
              Showing page <b>{page}</b> of <b>{Math.ceil(total / 10)}</b> ({total} total leads)
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                style={{ ...S.btn("outline", false), padding: "8px 16px", fontSize: "12px", fontWeight: 700 }}
              >
                Previous
              </button>
              <button
                disabled={page * 10 >= total}
                onClick={() => setPage(page + 1)}
                style={{ ...S.btn("outline", false), padding: "8px 16px", fontSize: "12px", fontWeight: 700 }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══ APPLY / ADD DIRECT LEAD MODAL ═══ */}
      {showApplyModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: C.card, width: "100%", maxWidth: "500px", borderRadius: "20px", border: `1px solid ${C.border}`, boxShadow: "0 25px 50px rgba(0,0,0,0.3)", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 800, color: C.text, margin: 0 }}>Apply / Record Direct Lead</h3>
              <button onClick={() => setShowApplyModal(false)} style={{ background: "none", border: "none", color: C.textMid, fontSize: "20px", cursor: "pointer" }}>✕</button>
            </div>

            <form onSubmit={handleCreateLead} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={S.label}>Category</label>
                <select
                  value={leadForm.category}
                  onChange={(e) => setLeadForm({ ...leadForm, category: e.target.value })}
                  style={{ ...S.input }}
                >
                  <option value="credit_card">Credit Card</option>
                  <option value="loan">Loan (Personal / Home / Business)</option>
                  <option value="insurance">Insurance</option>
                </select>
              </div>

              <div>
                <label style={S.label}>Customer Name</label>
                <input
                  style={S.input}
                  placeholder="e.g. Ramesh Kumar"
                  value={leadForm.customerName}
                  onChange={(e) => setLeadForm({ ...leadForm, customerName: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={S.label}>Mobile Number</label>
                <input
                  style={S.input}
                  placeholder="e.g. 9876543210"
                  value={leadForm.mobile}
                  onChange={(e) => setLeadForm({ ...leadForm, mobile: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={S.label}>Bank / Financial Provider</label>
                <input
                  style={S.input}
                  placeholder="e.g. HDFC Bank, SBI, HDFC ERGO"
                  value={leadForm.bankName}
                  onChange={(e) => setLeadForm({ ...leadForm, bankName: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={S.label}>Product / Card Name</label>
                <input
                  style={S.input}
                  placeholder="e.g. HDFC Regalia, Personal Loan Flexi, Health Optima"
                  value={leadForm.cardName}
                  onChange={(e) => setLeadForm({ ...leadForm, cardName: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                <button type="button" onClick={() => setShowApplyModal(false)} style={S.btn("outline", false)}>Cancel</button>
                <button type="submit" disabled={submitting} style={S.btn("primary", false)}>
                  {submitting ? "Saving..." : "Record Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
