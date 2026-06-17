import React, { useState, useEffect } from "react";
import api from "../../api/api";
import { useTheme, makeS } from "../../components/Partner/ThemeContext";
import { Icons } from "../../components/Partner/PartnerIcons";

export default function SuperAdminReports() {
  const { C } = useTheme();
  const S = makeS(C);

  // Tabs: 'analytics' or 'commissions'
  const [activeTab, setActiveTab] = useState("analytics");

  // Privacy Toggle & Export States
  const [privacyMode, setPrivacyMode] = useState(false);
  const [loadingPrivacy, setLoadingPrivacy] = useState(false);
  const [exportDates, setExportDates] = useState({
    from_date: "",
    to_date: ""
  });
  const [loadingExport, setLoadingExport] = useState(false);

  const fetchPrivacySetting = async () => {
    try {
      const res = await api.get("/settings");
      if (res.data?.success) {
        setPrivacyMode(res.data.data.admin_privacy_mode === "on");
      }
    } catch (e) {
      console.error("Failed to fetch settings:", e);
    }
  };

  const togglePrivacyMode = async () => {
    setLoadingPrivacy(true);
    const newValue = !privacyMode ? "on" : "off";
    try {
      const res = await api.post("/settings", { key: "admin_privacy_mode", value: newValue });
      if (res.data?.success) {
        setPrivacyMode(!privacyMode);
        alert(`Admin Privacy Mode has been turned ${newValue === 'on' ? 'ON' : 'OFF'}.`);
      }
    } catch (e) {
      alert(e.response?.data?.message || "Failed to update privacy setting.");
    } finally {
      setLoadingPrivacy(false);
    }
  };

  const handleExportReport = async () => {
    setLoadingExport(true);
    try {
      const res = await api.get("/reports/payouts-export", {
        params: {
          from_date: exportDates.from_date || undefined,
          to_date: exportDates.to_date || undefined
        }
      });
      if (res.data?.success) {
        downloadCSV(res.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to export payouts report.");
    } finally {
      setLoadingExport(false);
    }
  };

  const downloadCSV = (data) => {
    if (!data || data.length === 0) {
      alert("No data available for the selected criteria.");
      return;
    }
    const headers = [
      "Application Number",
      "Status",
      "Application Date",
      "Applied Amount",
      "Approved Amount",
      "Commission Amount",
      "Customer Name",
      "Product Name",
      "Bank Name",
      "Partner Code",
      "Partner Name"
    ];
    
    const csvRows = [
      headers.join(","),
      ...data.map(row => [
        `"${row.app_number || ''}"`,
        `"${row.status || ''}"`,
        `"${row.application_date ? new Date(row.application_date).toISOString().split('T')[0] : ''}"`,
        row.applied_amount || 0,
        row.approved_amount || 0,
        row.commission_amount || 0,
        `"${(row.customer_name || '').replace(/"/g, '""')}"`,
        `"${(row.product_name || '').replace(/"/g, '""')}"`,
        `"${(row.bank_name || '').replace(/"/g, '""')}"`,
        `"${row.Partner_code || ''}"`,
        `"${(row.partner_name || '').replace(/"/g, '""')}"`
      ].join(","))
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `payouts_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchPrivacySetting();
  }, []);


  // Analytics State
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [topPartners, setTopPartners] = useState([]);
  const [productsData, setProductsData] = useState([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [analyticsErr, setAnalyticsErr] = useState("");

  // Commission Config State
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [commissionForm, setCommissionForm] = useState({
    product_id: "",
    Partner_id: "",
    commission_type: "fixed",
    commission_value: "",
    effective_from: new Date().toISOString().split("T")[0],
    effective_to: "",
  });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    setAnalyticsErr("");
    try {
      const [resOverview, resTrend, resPartners, resProducts] = await Promise.all([
        api.get("/reports/overview"),
        api.get("/reports/monthly-trend"),
        api.get("/reports/top-partners?limit=10"),
        api.get("/reports/applications-by-product"),
      ]);

      if (resOverview.data?.success) setStats(resOverview.data.data);
      if (resTrend.data?.success) setTrends(resTrend.data.data);
      if (resPartners.data?.success) setTopPartners(resPartners.data.data);
      if (resProducts.data?.success) setProductsData(resProducts.data.data);
    } catch (e) {
      console.error(e);
      setAnalyticsErr(e.response?.data?.message || "Failed to load reports overview");
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await api.get("/products", { params: { limit: 100 } });
      if (res.data?.success) {
        setProducts(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (activeTab === "analytics") {
      fetchAnalytics();
    } else {
      fetchProducts();
    }
  }, [activeTab]);

  const handleCommissionSubmit = async (e) => {
    e.preventDefault();
    if (!commissionForm.product_id) return alert("Please select a product.");
    const val = parseFloat(commissionForm.commission_value);
    if (isNaN(val) || val <= 0) return alert("Please enter a valid commission value.");

    setActionLoading(true);
    try {
      const payload = {
        product_id: parseInt(commissionForm.product_id),
        Partner_id: commissionForm.Partner_id ? parseInt(commissionForm.Partner_id) : null,
        commission_type: commissionForm.commission_type,
        commission_value: val,
        effective_from: commissionForm.effective_from,
        effective_to: commissionForm.effective_to || null,
      };

      const res = await api.post("/products/commission", payload);
      if (res.data?.success) {
        alert("Commission rule created successfully!");
        setCommissionForm({
          product_id: "",
          Partner_id: "",
          commission_type: "fixed",
          commission_value: "",
          effective_from: new Date().toISOString().split("T")[0],
          effective_to: "",
        });
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save commission structure.");
    } finally {
      setActionLoading(false);
    }
  };

  // Analytics rendering
  const appStats = stats?.applications || { total: 0, approved: 0, rejected: 0, pending: 0 };
  const partnerStats = stats?.Partners || { total: 0, active: 0, pending_kyc: 0 };
  const walletStats = stats?.wallet || { total_earned: 0, total_withdrawn: 0, total_pending: 0, total_available: 0 };
  const maxTrendVal = trends.length > 0 ? Math.max(...trends.map(t => parseInt(t.applications || 0))) : 10;

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{ display: "flex", flexDirection: "column", mdDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", gap: "16px" }}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: 800, color: C.text, margin: 0 }}>System Reports & Commissions</h2>
          <p style={{ fontSize: "13px", color: C.textLight, margin: "4px 0 0 0" }}>Manage financial products commission schedules, analyze trends, and audit system-wide payouts</p>
        </div>
        
        {/* Tab selection bar */}
        <div style={{ display: "flex", background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "4px" }}>
          <button
            onClick={() => setActiveTab("analytics")}
            style={{
              background: activeTab === "analytics" ? C.teal : "transparent",
              color: activeTab === "analytics" ? "#fff" : C.textMid,
              border: "none", borderRadius: "8px", padding: "8px 16px",
              fontWeight: 700, fontSize: "13px", cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            Analytics Overview
          </button>
          <button
            onClick={() => setActiveTab("commissions")}
            style={{
              background: activeTab === "commissions" ? C.teal : "transparent",
              color: activeTab === "commissions" ? "#fff" : C.textMid,
              border: "none", borderRadius: "8px", padding: "8px 16px",
              fontWeight: 700, fontSize: "13px", cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            Commission Settings
          </button>
        </div>
      </div>

      {activeTab === "analytics" ? (
        /* Analytics View */
        <div>
          {loadingAnalytics ? (
            <div style={{ textAlign: "center", padding: "48px", color: C.textLight }}>
              <div className="animate-spin" style={{ width: "24px", height: "24px", border: `3px solid ${C.teal}`, borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto 8px" }}></div>
              Loading system metrics...
            </div>
          ) : analyticsErr ? (
            <div style={{ padding: "16px", background: `${C.red}10`, border: `1px solid ${C.red}30`, borderRadius: "12px", color: C.red }}>{analyticsErr}</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Controls Grid: Privacy Mode & Exporter */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
                {/* Privacy Mode Control Card */}
                <div style={{ ...S.card, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <h3 style={{ fontSize: "15px", fontWeight: 800, color: C.text, margin: "0 0 6px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                      <Icons.profile size={18} color={privacyMode ? C.red : C.textLight} />
                      Admin Privacy Mode
                    </h3>
                    <p style={{ fontSize: "12px", color: C.textLight, margin: 0, lineHeight: 1.4 }}>
                      When ON, standard Admins only see the Partner Code. KYC files, bank accounts, name, email, and mobile are completely masked to protect partner details.
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "16px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: privacyMode ? C.red : C.green }}>
                      Status: {privacyMode ? "Privacy Mode Active (ON)" : "Details Visible (OFF)"}
                    </span>
                    <button
                      type="button"
                      onClick={togglePrivacyMode}
                      disabled={loadingPrivacy}
                      style={{
                        background: privacyMode ? C.red : C.teal,
                        color: "#fff",
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: "8px",
                        fontWeight: 700,
                        fontSize: "12.5px",
                        cursor: "pointer",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                        transition: "all 0.2s"
                      }}
                    >
                      {loadingPrivacy ? "Updating..." : privacyMode ? "Turn OFF" : "Turn ON"}
                    </button>
                  </div>
                </div>

                {/* Report Exporter Control Card */}
                <div style={{ ...S.card }}>
                  <h3 style={{ fontSize: "15px", fontWeight: 800, color: C.text, margin: "0 0 12px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Icons.withdraw size={18} color={C.teal} />
                    Export Approved Cards Report
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: 700, color: C.textLight, display: "block", marginBottom: "4px" }}>From Date</label>
                        <input
                          type="date"
                          style={{ ...S.input, padding: "6px 10px", fontSize: "12.5px" }}
                          value={exportDates.from_date}
                          onChange={(e) => setExportDates({ ...exportDates, from_date: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: 700, color: C.textLight, display: "block", marginBottom: "4px" }}>To Date</label>
                        <input
                          type="date"
                          style={{ ...S.input, padding: "6px 10px", fontSize: "12.5px" }}
                          value={exportDates.to_date}
                          onChange={(e) => setExportDates({ ...exportDates, to_date: e.target.value })}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleExportReport}
                      disabled={loadingExport}
                      style={{
                        background: C.teal,
                        color: "#fff",
                        border: "none",
                        padding: "10px",
                        borderRadius: "8px",
                        fontWeight: 800,
                        fontSize: "13px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        width: "100%",
                        marginTop: "4px"
                      }}
                    >
                      {loadingExport ? "Generating CSV..." : "Export CSV Report"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Counter Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                <div style={{ ...S.card }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: C.textLight, textTransform: "uppercase" }}>Applications Volume</span>
                    <Icons.creditCard size={18} color={C.teal} />
                  </div>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: C.text }}>{appStats.total}</div>
                  <div style={{ fontSize: "12px", color: C.textLight, marginTop: "4px" }}>
                    <span style={{ color: C.green, fontWeight: 700 }}>{appStats.approved}</span> Approved • <span style={{ color: C.gold, fontWeight: 700 }}>{appStats.pending}</span> Pending
                  </div>
                </div>

                <div style={{ ...S.card }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: C.textLight, textTransform: "uppercase" }}>Partners Network</span>
                    <Icons.profile size={18} color={C.teal} />
                  </div>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: C.text }}>{partnerStats.total}</div>
                  <div style={{ fontSize: "12px", color: C.textLight, marginTop: "4px" }}>
                    <span style={{ color: C.green, fontWeight: 700 }}>{partnerStats.active}</span> Active • <span style={{ color: C.gold, fontWeight: 700 }}>{partnerStats.pending_kyc}</span> Pending KYC
                  </div>
                </div>

                <div style={{ ...S.card }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: C.textLight, textTransform: "uppercase" }}>Commissions Issued</span>
                    <Icons.wallet size={18} color={C.green} />
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: C.text }}>₹{parseFloat(walletStats.total_earned).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
                  <div style={{ fontSize: "11px", color: C.textLight, marginTop: "4px" }}>
                    ₹{parseFloat(walletStats.total_withdrawn).toLocaleString("en-IN", { maximumFractionDigits: 0 })} Paid • ₹{parseFloat(walletStats.total_pending).toLocaleString("en-IN", { maximumFractionDigits: 0 })} Hold
                  </div>
                </div>

                <div style={{ ...S.card }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: C.textLight, textTransform: "uppercase" }}>Available Wallet Bal</span>
                    <Icons.withdraw size={18} color={C.green} />
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: C.text }}>₹{parseFloat(walletStats.total_available).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
                  <div style={{ fontSize: "11px", color: C.textLight, marginTop: "4px" }}>Liquid funds ready for payouts</div>
                </div>
              </div>

              {/* Monthly trend */}
              <div style={{ ...S.card }}>
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: C.text, margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Icons.trending size={18} color={C.teal} /> System Processing Growth Trends
                </h3>
                {trends.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "20px", color: C.textLight }}>No trend reports generated yet.</div>
                ) : (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", height: "150px", borderBottom: `1.5px solid ${C.border}`, gap: "10px", padding: "10px 0" }}>
                    {trends.map((t, idx) => {
                      const heightPct = maxTrendVal > 0 ? (parseInt(t.applications || 0) / maxTrendVal) * 100 : 0;
                      return (
                        <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                          <span style={{ fontSize: "10px", fontWeight: 700, color: C.text, marginBottom: "4px" }}>{t.applications}</span>
                          <div style={{ width: "100%", height: `${Math.max(heightPct, 6)}%`, background: C.teal, borderRadius: "4px 4px 0 0" }} />
                          <span style={{ fontSize: "9px", color: C.textLight, marginTop: "6px", whiteSpace: "nowrap" }}>{t.month}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tables block */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "20px" }}>
                <div style={{ ...S.card }}>
                  <h4 style={{ fontSize: "14px", fontWeight: 700, color: C.text, margin: "0 0 12px 0" }}>Leaderboard: Partners network</h4>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.textLight, fontSize: "11px", textAlign: "left" }}>
                        <th style={{ padding: "8px" }}>Name / Code</th>
                        <th style={{ padding: "8px", textAlign: "right" }}>Approved Cases</th>
                        <th style={{ padding: "8px", textAlign: "right" }}>Total Earned</th>
                      </tr>
                    </thead>
                    <tbody style={{ fontSize: "12.5px", color: C.text }}>
                      {topPartners.map((p, idx) => (
                        <tr key={idx} style={{ borderBottom: `1px solid ${C.border}40` }}>
                          <td style={{ padding: "8px", fontWeight: 600 }}>{p.first_name} {p.last_name} <br/><span style={{ fontSize: "10px", color: C.textLight }}>{p.Partner_code}</span></td>
                          <td style={{ padding: "8px", textAlign: "right" }}>{p.approved} / {p.total_apps}</td>
                          <td style={{ padding: "8px", textAlign: "right", color: C.green, fontWeight: 700 }}>₹{parseFloat(p.commission_earned).toLocaleString("en-IN")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ ...S.card }}>
                  <h4 style={{ fontSize: "14px", fontWeight: 700, color: C.text, margin: "0 0 12px 0" }}>Commission Volume by Product</h4>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.textLight, fontSize: "11px", textAlign: "left" }}>
                        <th style={{ padding: "8px" }}>Product Name</th>
                        <th style={{ padding: "8px" }}>Category</th>
                        <th style={{ padding: "8px", textAlign: "right" }}>Total Disbursed</th>
                      </tr>
                    </thead>
                    <tbody style={{ fontSize: "12.5px", color: C.text }}>
                      {productsData.map((p, idx) => (
                        <tr key={idx} style={{ borderBottom: `1px solid ${C.border}40` }}>
                          <td style={{ padding: "8px", fontWeight: 600 }}>{p.product_name} <span style={{ fontSize: "9px", color: C.textLight, background: C.bgSecondary, padding: "2px 4px", borderRadius: "3px" }}>{p.bank_code}</span></td>
                          <td style={{ padding: "8px", textTransform: "capitalize" }}>{p.category.replace("_", " ")}</td>
                          <td style={{ padding: "8px", textAlign: "right", color: C.green, fontWeight: 700 }}>₹{parseFloat(p.commission).toLocaleString("en-IN")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Commission Configuration settings View */
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          {/* Configure Commission rule Form */}
          <div style={{ ...S.card }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: C.text, margin: "0 0 16px 0" }}>Configure Commission Rule</h3>
            <form onSubmit={handleCommissionSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={S.label}>Target Product *</label>
                {loadingProducts ? (
                  <div style={{ fontSize: "12px", color: C.textLight }}>Loading products...</div>
                ) : (
                  <select
                    style={S.input}
                    value={commissionForm.product_id}
                    onChange={(e) => setCommissionForm({ ...commissionForm, product_id: e.target.value })}
                    required
                  >
                    <option value="">-- Select Product --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.bank_code}] {p.name} ({p.category})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label style={S.label}>Custom Partner Override (ID - Optional)</label>
                <input
                  style={S.input}
                  placeholder="Leave blank for global rule, or enter Partner profile ID"
                  value={commissionForm.Partner_id}
                  onChange={(e) => setCommissionForm({ ...commissionForm, Partner_id: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={S.label}>Commission Type</label>
                  <select
                    style={S.input}
                    value={commissionForm.commission_type}
                    onChange={(e) => setCommissionForm({ ...commissionForm, commission_type: e.target.value })}
                  >
                    <option value="fixed">Fixed Flat Payout (₹)</option>
                    <option value="percent">Percent Rate Payout (%)</option>
                  </select>
                </div>
                <div>
                  <label style={S.label}>Commission Payout Value *</label>
                  <input
                    type="number"
                    step="0.01"
                    style={S.input}
                    placeholder={commissionForm.commission_type === "fixed" ? "e.g. 500" : "e.g. 1.5"}
                    value={commissionForm.commission_value}
                    onChange={(e) => setCommissionForm({ ...commissionForm, commission_value: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={S.label}>Effective From *</label>
                  <input
                    type="date"
                    style={S.input}
                    value={commissionForm.effective_from}
                    onChange={(e) => setCommissionForm({ ...commissionForm, effective_from: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={S.label}>Effective To</label>
                  <input
                    type="date"
                    style={S.input}
                    value={commissionForm.effective_to}
                    onChange={(e) => setCommissionForm({ ...commissionForm, effective_to: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                style={{ ...S.btn("primary"), marginTop: "10px" }}
              >
                {actionLoading ? "Saving structure..." : "Create Commission Rule"}
              </button>
            </form>
          </div>

          {/* Guidelines / Current active standard structures description */}
          <div style={{ ...S.card }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: C.text, margin: "0 0 12px 0" }}>Products Commission Catalog</h3>
            <p style={{ fontSize: "13px", color: C.textLight, margin: "0 0 16px 0" }}>Standard payouts currently configured per product. Note that overriding partner rules will display in partner dashboards selectively.</p>
            
            {loadingProducts ? (
              <div style={{ textAlign: "center", padding: "24px", color: C.textLight }}>Loading catalogs...</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "400px", overflowY: "auto" }}>
                {products.map((p) => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.bgSecondary, border: `1px solid ${C.border}`, padding: "10px 14px", borderRadius: "10px" }}>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: C.text }}>{p.name}</div>
                      <div style={{ fontSize: "11px", color: C.textLight, textTransform: "capitalize" }}>{p.category.replace("_", " ")} • {p.bank_name}</div>
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: C.green }}>
                      {p.commission_type === "fixed" ? `₹${parseFloat(p.commission_value).toLocaleString("en-IN")}` : `${p.commission_value}%`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
