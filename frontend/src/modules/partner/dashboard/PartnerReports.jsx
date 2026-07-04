import React, { useState, useEffect } from "react";
import { useTheme, makeS } from "../../../contexts/ThemeContext";
import { useAuthStore } from "../../../app/store/authStore";
import api from "../../../services/api";
import {
  MdBarChart, MdTrendingUp, MdTimeline, MdDownload, MdFilterList,
  MdDateRange, MdArrowBack, MdAnalytics, MdShowChart, MdPieChart,
  MdDashboard, MdPeople, MdAccountBalanceWallet, MdDescription
} from "react-icons/md";
import { useNavigate } from "react-router-dom";

export default function PartnerReports() {
  const { C } = useTheme();
  const S = makeS(C);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [activeTab, setActiveTab] = useState("dashboard");
  
  // States
  const [overview, setOverview] = useState(null);
  const [applications, setApplications] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Filters
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (activeTab === "dashboard") {
        const [overviewRes, trendRes] = await Promise.all([
          api.get('/reports/overview'),
          api.get('/reports/monthly-trend')
        ]);
        if (overviewRes.data?.success) setOverview(overviewRes.data.data);
        if (trendRes.data?.success) setMonthlyTrend(trendRes.data.data);
      } else if (activeTab === "applications") {
        const res = await api.get('/reports/applications', { params: { from_date: fromDate, to_date: toDate, search } });
        if (res.data?.success) setApplications(res.data.data);
      } else if (activeTab === "customers") {
        const res = await api.get('/reports/customers');
        if (res.data?.success) setCustomers(res.data.data);
      } else if (activeTab === "payouts") {
        const res = await api.get(`/wallet/${user.PartnerId || user.partner_id}/transactions`, { params: { limit: 100 } });
        if (res.data?.success) setPayouts(res.data.data.transactions || []);
      }
    } catch (err) {
      console.error("Failed to load reports", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, activeTab, fromDate, toDate, search]);

  const handleExportCSV = () => {
    let dataToExport = [];
    let headers = [];
    let filename = "export.csv";

    if (activeTab === "applications") {
      if (!applications.length) return alert("No applications to export");
      headers = ["App Number", "Customer Name", "Product", "Bank", "Status", "Applied Amount", "Commission", "Date"];
      dataToExport = applications.map(a => [
        a.app_number, a.customer_name, a.product_name, a.bank_name, a.status,
        a.approved_amount || 0, a.commission_amount || 0, new Date(a.application_date).toLocaleDateString()
      ]);
      filename = "Applications_Report.csv";
    } else if (activeTab === "customers") {
      if (!customers.length) return alert("No customers to export");
      headers = ["Customer Name", "Mobile", "Email", "Total Apps", "Approved", "Rejected", "Total Commission"];
      dataToExport = customers.map(c => [
        c.customer_name, c.mobile, c.email, c.total_applications, c.approved_cards, c.rejected_cards, c.total_commission
      ]);
      filename = "Customers_Report.csv";
    } else if (activeTab === "payouts") {
      if (!payouts.length) return alert("No payouts to export");
      headers = ["Transaction ID", "Date", "Type", "Description", "Amount", "Status"];
      dataToExport = payouts.map(tx => [
        tx.id, new Date(tx.created_at).toLocaleDateString(), tx.type, tx.description, tx.credit > 0 ? tx.credit : `-${tx.debit}`, tx.status
      ]);
      filename = "Payouts_Report.csv";
    } else {
      return alert("Export not supported on this tab.");
    }

    const csvRows = [headers.join(",")];
    dataToExport.forEach(row => {
      csvRows.push(row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const maxTrendVal = monthlyTrend.reduce((max, item) => Math.max(max, parseInt(item.applications || 0)), 0);
  const maxCommVal = monthlyTrend.reduce((max, item) => Math.max(max, parseFloat(item.commission || 0)), 0);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px", paddingBottom: "40px" }}>
      
      {/* Header */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={() => navigate(-1)} style={{ padding: "8px", background: C.bgSecondary, border: `1.5px solid ${C.border}`, borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center" }}>
            <MdArrowBack size={18} style={{ color: C.text }} />
          </button>
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: C.text, margin: 0 }}>Reports & Analytics</h2>
            <p style={{ fontSize: "13px", color: C.textLight, margin: "4px 0 0" }}>Track applications, conversions, commissions, and customers.</p>
          </div>
        </div>

        {activeTab !== "dashboard" && (
          <button
            onClick={handleExportCSV}
            disabled={exportLoading}
            style={{
              display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px",
              background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
              color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700,
              fontSize: "13px", cursor: "pointer", boxShadow: "0 4px 12px rgba(13, 92, 171, 0.2)"
            }}
          >
            <MdDownload size={18} /> Export CSV
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: "flex", gap: "8px", background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "6px", width: "fit-content" }}>
        {[
          { id: "dashboard", label: "Dashboard", icon: <MdDashboard /> },
          { id: "applications", label: "Applications", icon: <MdDescription /> },
          { id: "customers", label: "Customers", icon: <MdPeople /> },
          { id: "payouts", label: "Payouts Ledger", icon: <MdAccountBalanceWallet /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: activeTab === tab.id ? C.teal : "transparent",
              color: activeTab === tab.id ? "#fff" : C.textMid,
              border: "none", borderRadius: "8px", padding: "8px 16px",
              fontWeight: 700, fontSize: "13px", cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* DASHBOARD VIEW */}
      {activeTab === "dashboard" && overview && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            <div style={{ ...S.card }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: C.textLight }}>TODAY'S APPLICATIONS</span>
                <MdDescription color={C.primary} size={18} />
              </div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: C.text }}>{overview.applications.todays_apps || 0}</div>
              <div style={{ fontSize: "12px", color: C.textLight, marginTop: "4px" }}>Submitted today</div>
            </div>

            <div style={{ ...S.card }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: C.textLight }}>CONVERSION RATE</span>
                <MdAnalytics color={C.teal} size={18} />
              </div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: C.text }}>{overview.applications.conversion_rate}%</div>
              <div style={{ fontSize: "12px", color: C.textLight, marginTop: "4px" }}>Of {overview.applications.total} total cases</div>
            </div>

            <div style={{ ...S.card }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: C.textLight }}>TOTAL EARNED</span>
                <MdAccountBalanceWallet color={C.green} size={18} />
              </div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: C.text }}>₹{overview.wallet.total_earned}</div>
              <div style={{ fontSize: "12px", color: C.textLight, marginTop: "4px" }}>Wallet Available: ₹{overview.wallet.total_available}</div>
            </div>
          </div>

          {/* Charts */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "20px" }}>
            <div style={{ ...S.card, padding: "20px", borderRadius: "16px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 800, color: C.text, margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <MdShowChart size={18} style={{ color: C.primary }} /> Monthly Applications
              </h3>
              {monthlyTrend.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px", color: C.textLight }}>No trend reports generated yet.</div>
              ) : (
                <div style={{ height: "160px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "14px", borderBottom: `1.5px solid ${C.border}`, paddingBottom: "10px" }}>
                  {monthlyTrend.map((t, idx) => {
                    const heightPct = maxTrendVal > 0 ? (parseInt(t.applications || 0) / maxTrendVal) * 100 : 0;
                    return (
                      <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "100%", height: `${Math.max(heightPct, 6)}%`, background: C.primary, borderRadius: "4px 4px 0 0", position: "relative" }}>
                          <span style={{ position: "absolute", top: "-18px", left: "50%", transform: "translateX(-50%)", fontSize: "10px", fontWeight: 800, color: C.text }}>{t.applications}</span>
                        </div>
                        <span style={{ fontSize: "10px", fontWeight: 700, color: C.textLight }}>{t.month.split(" ")[0]}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ ...S.card, padding: "20px", borderRadius: "16px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 800, color: C.text, margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <MdBarChart size={18} style={{ color: C.green }} /> Commission Growth Trend (INR)
              </h3>
              {monthlyTrend.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px", color: C.textLight }}>No trend reports generated yet.</div>
              ) : (
                <div style={{ height: "160px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "14px", borderBottom: `1.5px solid ${C.border}`, paddingBottom: "10px" }}>
                  {monthlyTrend.map((t, idx) => {
                    const heightPct = maxCommVal > 0 ? (parseFloat(t.commission || 0) / maxCommVal) * 100 : 0;
                    return (
                      <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "100%", height: `${Math.max(heightPct, 6)}%`, background: C.green, borderRadius: "4px 4px 0 0", position: "relative" }}>
                          <span style={{ position: "absolute", top: "-18px", left: "50%", transform: "translateX(-50%)", fontSize: "10px", fontWeight: 800, color: C.text }}>{parseFloat(t.commission).toLocaleString('en-IN', {maximumFractionDigits:0})}</span>
                        </div>
                        <span style={{ fontSize: "10px", fontWeight: 700, color: C.textLight }}>{t.month.split(" ")[0]}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* APPLICATIONS VIEW */}
      {activeTab === "applications" && (
        <div style={{ ...S.card }}>
          <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
            <input type="text" placeholder="Search Customer or App No..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...S.input, width: "200px", padding: "8px" }} />
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={{ ...S.input, padding: "8px" }} />
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={{ ...S.input, padding: "8px" }} />
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, color: C.textLight, fontSize: "12px", textTransform: "uppercase" }}>
                  <th style={{ padding: "14px" }}>Date</th>
                  <th style={{ padding: "14px" }}>Customer / App No</th>
                  <th style={{ padding: "14px" }}>Product</th>
                  <th style={{ padding: "14px" }}>Status</th>
                  <th style={{ padding: "14px", textAlign: "right" }}>Commission</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id} style={{ borderBottom: `1px solid ${C.border}60` }}>
                    <td style={{ padding: "14px", fontSize: "13px" }}>{new Date(app.application_date).toLocaleDateString()}</td>
                    <td style={{ padding: "14px", fontSize: "13px" }}>
                      <div style={{ fontWeight: 700 }}>{app.customer_name}</div>
                      <div style={{ fontSize: "11px", color: C.textLight }}>{app.app_number}</div>
                    </td>
                    <td style={{ padding: "14px", fontSize: "13px" }}>{app.product_name} ({app.bank_name})</td>
                    <td style={{ padding: "14px", fontSize: "13px", fontWeight: 600 }}>{app.status.toUpperCase()}</td>
                    <td style={{ padding: "14px", fontSize: "13px", textAlign: "right", color: C.green, fontWeight: 700 }}>
                      ₹{parseFloat(app.commission_amount || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CUSTOMERS VIEW */}
      {activeTab === "customers" && (
        <div style={{ ...S.card }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, color: C.textLight, fontSize: "12px", textTransform: "uppercase" }}>
                  <th style={{ padding: "14px" }}>Customer</th>
                  <th style={{ padding: "14px" }}>Contact</th>
                  <th style={{ padding: "14px", textAlign: "center" }}>Apps</th>
                  <th style={{ padding: "14px", textAlign: "center" }}>Approved</th>
                  <th style={{ padding: "14px", textAlign: "right" }}>Generated Comm.</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${C.border}60` }}>
                    <td style={{ padding: "14px", fontSize: "13px", fontWeight: 700 }}>{c.customer_name}</td>
                    <td style={{ padding: "14px", fontSize: "13px" }}>
                      <div>{c.mobile}</div>
                      <div style={{ fontSize: "11px", color: C.textLight }}>{c.email}</div>
                    </td>
                    <td style={{ padding: "14px", fontSize: "13px", textAlign: "center" }}>{c.total_applications}</td>
                    <td style={{ padding: "14px", fontSize: "13px", textAlign: "center", color: C.green }}>{c.approved_cards}</td>
                    <td style={{ padding: "14px", fontSize: "13px", textAlign: "right", color: C.green, fontWeight: 700 }}>
                      ₹{parseFloat(c.total_commission || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PAYOUTS VIEW */}
      {activeTab === "payouts" && (
        <div style={{ ...S.card }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, color: C.textLight, fontSize: "12px", textTransform: "uppercase" }}>
                  <th style={{ padding: "14px" }}>Date</th>
                  <th style={{ padding: "14px" }}>Type</th>
                  <th style={{ padding: "14px" }}>Description</th>
                  <th style={{ padding: "14px", textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: `1px solid ${C.border}60` }}>
                    <td style={{ padding: "14px", fontSize: "13px" }}>{new Date(tx.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: "14px", fontSize: "13px", fontWeight: 600 }}>{tx.type || tx.transaction_type}</td>
                    <td style={{ padding: "14px", fontSize: "13px" }}>{tx.description}</td>
                    <td style={{ padding: "14px", fontSize: "13px", textAlign: "right", color: tx.credit > 0 ? C.green : C.red, fontWeight: 700 }}>
                      {tx.credit > 0 ? '+' : '-'}₹{parseFloat(tx.credit > 0 ? tx.credit : tx.debit).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
