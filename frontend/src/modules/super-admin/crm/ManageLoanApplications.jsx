import React, { useState, useEffect } from 'react';
import { 
  FaDownload, FaBriefcase, FaBolt, FaShoppingBag, FaCheckCircle, 
  FaCoins, FaSyncAlt, FaMobileAlt, FaExclamationTriangle, FaCheck 
} from 'react-icons/fa';
import api from "../../../services/api";
import { useTheme, makeS } from "../../../contexts/ThemeContext";

export default function ManageLoanApplications() {
  const { C, isDark } = useTheme();
  const S = makeS(C);

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listing & Filter State
  const [activeCategory, setActiveCategory] = useState("all");
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [exporting, setExporting] = useState(false);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const res = await api.get("/superadmin/crm/bulk-export", { params: { type: 'loan_applications' }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'loan_applications_export.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (e) {
      console.error(e);
      setErr("Failed to export loan applications.");
    } finally {
      setExporting(false);
    }
  };

  const fetchLeads = async () => {
    setLoading(true);
    setErr("");
    try {
      const categoryParam = activeCategory === "all" ? "loan_applications" : activeCategory;
      const res = await api.get("/card-applications", {
        params: {
          page,
          limit: 15,
          category: categoryParam,
          search: search || undefined,
        },
      });
      if (res.data?.success) {
        setLeads(res.data.data || []);
        setTotal(res.data.pagination?.total || (res.data.data || []).length);
      } else {
        setErr(res.data?.message || "Failed to load loan applications");
      }
    } catch (e) {
      console.error(e);
      setErr(e.response?.data?.message || "Failed to load loan applications");
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

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const res = await api.put(`/card-applications/${id}/status`, { status: newStatus });
      if (res.data?.success) {
        setSuccessMsg("Application status updated successfully");
        setTimeout(() => setSuccessMsg(""), 3000);
        fetchLeads();
      }
    } catch (e) {
      console.error("Failed to update status", e);
      setErr("Failed to update status");
    }
  };

  // Helper stats
  const loanOnCardCount = leads.filter(l => l.category === 'loan_on_credit_card' || l.card_name?.toLowerCase().includes('loan')).length;
  const smartEmiCount = leads.filter(l => l.category === 'smart_emi' || l.card_name?.toLowerCase().includes('emi')).length;
  const verifiedCount = leads.filter(l => l.status === 'verified' || l.status === 'operational_verified' || l.status === 'approved').length;

  const categories = [
    { id: "all", label: "All Loan Applications", icon: <FaCoins size={14} /> },
    { id: "loan_on_credit_card", label: "Loan on Credit Card", icon: <FaBolt size={14} /> },
    { id: "smart_emi", label: "Smart EMI on Credit Card", icon: <FaShoppingBag size={14} /> },
  ];

  return (
    <div style={{ padding: "20px 0", fontFamily: "'Inter', sans-serif" }}>
      {/* Title & Top Action Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "26px", fontWeight: 800, color: C.text, margin: 0, letterSpacing: "-0.5px" }}>
            Credit Card Loan Applications
          </h2>
          <p style={{ fontSize: "13.5px", color: C.textLight, margin: "6px 0 0 0", lineHeight: 1.4 }}>
            Monitor and track customer applications for Loan on Credit Card and Smart EMI on Credit Card conversions.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleExportCSV}
            disabled={exporting}
            style={{
              padding: "12px 22px", borderRadius: "12px", border: `1px solid ${C.teal}`,
              background: "transparent",
              color: C.teal, fontWeight: 800, fontSize: "14px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: "8px"
            }}
          >
            <FaDownload size={14} />
            <span>{exporting ? "Exporting..." : "Export CSV"}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(220px, 1fr))", gap: isMobile ? "10px" : "16px", marginBottom: "24px" }}>
        <div style={{ ...S.card, display: "flex", alignItems: "center", gap: "14px", padding: isMobile ? "12px" : "18px" }}>
          <div style={{ width: "42px", height: "42px", background: `${C.primary}15`, borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", color: C.primary, fontSize: "18px", flexShrink: 0 }}>
            <FaBriefcase size={20} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: isMobile ? "18px" : "22px", fontWeight: 800, color: C.text }}>{total}</div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: C.textLight, textTransform: "uppercase", marginTop: "2px" }}>Total Loan Apps</div>
          </div>
        </div>

        <div style={{ ...S.card, display: "flex", alignItems: "center", gap: "14px", padding: isMobile ? "12px" : "18px" }}>
          <div style={{ width: "42px", height: "42px", background: `${C.teal}15`, borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", color: C.teal, fontSize: "18px", flexShrink: 0 }}>
            <FaBolt size={20} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: isMobile ? "18px" : "22px", fontWeight: 800, color: C.text }}>{loanOnCardCount}</div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: C.textLight, textTransform: "uppercase", marginTop: "2px" }}>Loan on Card</div>
          </div>
        </div>

        <div style={{ ...S.card, display: "flex", alignItems: "center", gap: "14px", padding: isMobile ? "12px" : "18px" }}>
          <div style={{ width: "42px", height: "42px", background: `${C.gold}15`, borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", color: C.gold, fontSize: "18px", flexShrink: 0 }}>
            <FaShoppingBag size={20} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: isMobile ? "18px" : "22px", fontWeight: 800, color: C.text }}>{smartEmiCount}</div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: C.textLight, textTransform: "uppercase", marginTop: "2px" }}>Smart EMI</div>
          </div>
        </div>

        <div style={{ ...S.card, display: "flex", alignItems: "center", gap: "14px", padding: isMobile ? "12px" : "18px" }}>
          <div style={{ width: "42px", height: "42px", background: `${C.green}15`, borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", color: C.green, fontSize: "18px", flexShrink: 0 }}>
            <FaCheckCircle size={20} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: isMobile ? "18px" : "22px", fontWeight: 800, color: C.text }}>{verifiedCount}</div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: C.textLight, textTransform: "uppercase", marginTop: "2px" }}>Verified / Operational</div>
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
                padding: "10px 20px", borderRadius: "12px",
                border: `1.5px solid ${isActive ? C.primary : C.border}`,
                background: isActive ? `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)` : C.card,
                color: isActive ? "#FFFFFF" : C.text,
                fontWeight: 800, fontSize: "13.5px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s",
                whiteSpace: "nowrap", flexShrink: 0
              }}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div style={{ ...S.card, padding: "18px", marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", flex: 1, gap: "12px", maxWidth: isMobile ? "100%" : "500px", width: "100%" }}>
          <input
            style={{ ...S.input, margin: 0, flex: 1 }}
            placeholder="Search by customer name, mobile, bank, scheme..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" style={{ ...S.btn("primary", false), padding: "10px 20px", fontSize: "13px", fontWeight: 700, flexShrink: 0 }}>
            Search
          </button>
        </form>

        <button 
          onClick={fetchLeads}
          style={{ background: `${C.teal}10`, border: `1px solid ${C.teal}35`, color: C.teal, borderRadius: "10px", padding: "10px 18px", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: isMobile ? "100%" : "auto" }}
        >
          <FaSyncAlt size={14} />
          <span>Refresh Table</span>
        </button>
      </div>

      {/* Notifications */}
      {err && (
        <div style={{ padding: "14px 18px", background: `${C.red}10`, border: `1px solid ${C.red}25`, borderRadius: "14px", color: C.red, marginBottom: "20px", fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
          <FaExclamationTriangle size={16} /> {err}
        </div>
      )}
      {successMsg && (
        <div style={{ padding: "14px 18px", background: `${C.green}10`, border: `1px solid ${C.green}25`, borderRadius: "14px", color: C.green, marginBottom: "20px", fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
          <FaCheck size={16} /> {successMsg}
        </div>
      )}

      {/* Data Table */}
      <div style={{ ...S.card, padding: 0, overflow: "hidden", border: `1px solid ${C.border}` }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "50px", color: C.textLight }}>
            <div style={{ width: "24px", height: "24px", border: `3px solid ${C.primary}`, borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto 12px", animation: "spin 1s linear infinite" }}></div>
            Fetching loan applications...
          </div>
        ) : leads.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px", color: C.textLight, fontSize: "14.5px" }}>
            No loan applications found.
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
                  <th style={{ padding: "16px 20px" }}>Product / Scheme</th>
                  <th style={{ padding: "16px 20px" }}>Status Action</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: "13.5px", color: C.text }}>
                {leads.map((lead) => {
                  const isEmi = lead.category === 'smart_emi' || lead.card_name?.toLowerCase().includes('emi');
                  const catLabel = isEmi ? 'Smart EMI' : 'Loan on Credit Card';
                  const badgeBg = isEmi ? `${C.gold}15` : `${C.primary}15`;
                  const badgeColor = isEmi ? C.gold : C.primary;

                  return (
                    <tr key={lead.id} style={{ borderBottom: `1px solid ${C.border}50` }}>
                      <td style={{ padding: "16px 20px", color: C.textLight }}>
                        {new Date(lead.created_at).toLocaleString("en-IN", {
                          day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                        })}
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 800, background: badgeBg, color: badgeColor, padding: "4px 10px", borderRadius: "8px", textTransform: "uppercase" }}>
                          {catLabel}
                        </span>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ fontWeight: 700, fontSize: "14.5px" }}>{lead.customer_name}</div>
                        <div style={{ color: C.textLight, fontSize: "12px", marginTop: "2px", fontWeight: 500, display: "flex", alignItems: "center", gap: "4px" }}>
                          <FaMobileAlt size={12} />
                          <span>{lead.mobile}</span>
                        </div>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 800, background: `${C.teal}12`, color: C.teal, padding: "4px 10px", borderRadius: "8px", textTransform: "uppercase" }}>
                          {lead.bank_name || 'Partner Bank'}
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
                          <option value="operational_verified">Operational Verified</option>
                          <option value="approved">Approved</option>
                          <option value="disbursed">Disbursed</option>
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
        {!loading && total > 15 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderTop: `1px solid ${C.border}`, background: C.bgSecondary }}>
            <span style={{ fontSize: "12.5px", color: C.textLight }}>
              Showing page <b>{page}</b> of <b>{Math.ceil(total / 15)}</b> ({total} total loan apps)
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
                disabled={page * 15 >= total}
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
