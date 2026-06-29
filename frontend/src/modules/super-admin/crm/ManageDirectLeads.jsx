import React, { useState, useEffect } from "react";
import api from "../../../api/api";
import { useTheme, makeS } from "../../../contexts/ThemeContext";

export default function ManageDirectLeads() {
  const { C } = useTheme();
  const S = makeS(C);

  // Listing State
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const fetchLeads = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/card-applications", {
        params: {
          page,
          limit: 10,
          search: search || undefined,
        },
      });
      if (res.data?.success) {
        // The API returns paginated data (paginated structure) or direct array
        // Res.data.data is the array, res.data.pagination is pagination info
        setLeads(res.data.data || []);
        setTotal(res.data.pagination?.total || (res.data.data || []).length);
      } else {
        setErr(res.data?.message || "Failed to load leads");
      }
    } catch (e) {
      console.error(e);
      setErr(e.response?.data?.message || "Failed to load direct card leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLeads();
  };

  // Helper to get today's leads count
  const todayLeadsCount = leads.filter(l => {
    const today = new Date().toDateString();
    const leadDate = new Date(l.created_at).toDateString();
    return today === leadDate;
  }).length;

  return (
    <div style={{ padding: "20px 0", fontFamily: "'Inter', sans-serif" }}>
      {/* Title */}
      <div style={{ marginBottom: "28px" }}>
        <h2 style={{ fontSize: "26px", fontWeight: 800, color: C.text, margin: 0, letterSpacing: "-0.5px" }}>Direct Card Leads</h2>
        <p style={{ fontSize: "13.5px", color: C.textLight, margin: "6px 0 0 0", lineHeight: 1.4 }}>
          Track visitors who completed SMS OTP verification and redirected to direct bank application links.
        </p>
      </div>

      {/* Stats Section */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "28px" }}>
        <div style={{ ...S.card, display: "flex", alignItems: "center", gap: "16px", padding: "20px" }}>
          <div style={{ width: "46px", height: "46px", background: `${C.teal}15`, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: C.teal, fontSize: "20px" }}>
            💳
          </div>
          <div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: C.text }}>{total}</div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "2px" }}>Total Direct Leads</div>
          </div>
        </div>

        <div style={{ ...S.card, display: "flex", alignItems: "center", gap: "16px", padding: "20px" }}>
          <div style={{ width: "46px", height: "46px", background: `${C.green}15`, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: C.green, fontSize: "20px" }}>
            🔥
          </div>
          <div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: C.text }}>{todayLeadsCount}</div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "2px" }}>New Leads (Active Batch)</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ ...S.card, padding: "18px", marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", flex: 1, gap: "12px", maxWidth: "500px" }}>
          <input
            style={{ ...S.input, margin: 0 }}
            placeholder="Search by customer name, mobile, bank..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" style={{ ...S.btn("primary", false), padding: "10px 24px", fontSize: "13px", fontWeight: 700 }}>
            Search
          </button>
        </form>

        <button 
          onClick={fetchLeads}
          style={{ background: `${C.teal}10`, border: `1px solid ${C.teal}35`, color: C.teal, borderRadius: "10px", padding: "10px 18px", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.background = `${C.teal}20`}
          onMouseLeave={e => e.currentTarget.style.background = `${C.teal}10`}
        >
          🔄 Refresh Table
        </button>
      </div>

      {/* Error Alert */}
      {err && (
        <div style={{ padding: "16px", background: `${C.red}10`, border: `1px solid ${C.red}25`, borderRadius: "14px", color: C.red, marginBottom: "20px", fontSize: "14px", fontWeight: 600 }}>
          ⚠️ {err}
        </div>
      )}

      {/* Data Table */}
      <div style={{ ...S.card, padding: 0, overflow: "hidden", border: `1px solid ${C.border}` }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "50px", color: C.textLight }}>
            <div style={{ width: "24px", height: "24px", border: `3px solid ${C.teal}`, borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto 12px", animation: "spin 1s linear infinite" }}></div>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            Fetching direct application leads...
          </div>
        ) : leads.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px", color: C.textLight, fontSize: "14.5px" }}>
            No direct card leads found.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, color: C.textLight, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <th style={{ padding: "16px 20px" }}>Verification Date</th>
                  <th style={{ padding: "16px 20px" }}>Customer Details</th>
                  <th style={{ padding: "16px 20px" }}>Bank Partner</th>
                  <th style={{ padding: "16px 20px" }}>Card Name</th>
                  <th style={{ padding: "16px 20px" }}>Status</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: "13.5px", color: C.text }}>
                {leads.map((lead) => (
                  <tr key={lead.id} style={{ borderBottom: `1px solid ${C.border}50`, transition: "background 0.2s" }} className="hover:bg-slate-50/20">
                    <td style={{ padding: "16px 20px", color: C.textLight }}>
                      {new Date(lead.created_at).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
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
                      <span style={{ fontSize: "11px", fontWeight: 800, background: `${C.green}15`, color: C.green, padding: "4px 10px", borderRadius: "20px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        ✓ {lead.status}
                      </span>
                    </td>
                  </tr>
                ))}
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
    </div>
  );
}
