import React, { useState, useEffect } from "react";
import { useTheme, makeS } from "../../../contexts/ThemeContext";
import { useAuthStore } from "../../../app/store/authStore";
import api from "../../../services/api";
import {
  MdBarChart, MdTrendingUp, MdTimeline, MdDownload, MdFilterList,
  MdDateRange, MdArrowBack, MdAnalytics, MdShowChart, MdPieChart
} from "react-icons/md";
import { useNavigate } from "react-router-dom";

export default function PartnerReports() {
  const { C } = useTheme();
  const S = makeS(C);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  // Filters
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    if (!user?.PartnerId) return;
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/wallet/${user.PartnerId}/transactions`, {
          params: { limit: 100 }
        });
        if (res.data?.success) {
          setPayouts(res.data.data.transactions || []);
        }
      } catch (err) {
        console.error("Failed to load reports payout history", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [user]);

  // Export to CSV Function
  const handleExportCSV = () => {
    if (payouts.length === 0) {
      alert("No payout data available to export.");
      return;
    }
    setExportLoading(true);
    try {
      const csvRows = [];
      csvRows.push("GharKaPaisa - Partner Payout Ledger Report");
      csvRows.push(`Generated On,${new Date().toLocaleDateString()}`);
      csvRows.push(`Partner Name,${user?.name || "Partner"}`);
      csvRows.push("");
      csvRows.push("Transaction ID,Date,Type,Description,Amount (INR),Status");

      payouts.forEach(tx => {
        csvRows.push([
          `"${tx.id}"`,
          `"${new Date(tx.created_at).toLocaleDateString()}"`,
          `"${tx.type || tx.transaction_type || 'Ledger'}"`,
          `"${(tx.description || '').replace(/"/g, '""')}"`,
          tx.credit > 0 ? tx.credit : `-${tx.debit}`,
          `"${tx.status || 'completed'}"`
        ].join(","));
      });

      const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `GKP_Payout_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Failed to export report.");
    } finally {
      setExportLoading(false);
    }
  };

  // Filtered transactions list based on date filters
  const filteredPayouts = payouts.filter(tx => {
    const txDate = new Date(tx.created_at);
    if (fromDate && txDate < new Date(fromDate)) return false;
    if (toDate && txDate > new Date(toDate + " 23:59:59")) return false;
    return true;
  });

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
            <p style={{ fontSize: "13px", color: C.textLight, margin: "4px 0 0" }}>Track ledger conversions, commission growth, and export payout ledger entries.</p>
          </div>
        </div>

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
          <MdDownload size={18} /> {exportLoading ? "Generating CSV..." : "Export Payout Ledger"}
        </button>
      </div>

      {/* Analytics and Charts Section */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "20px" }}>
        
        {/* Monthly Applications trend */}
        <div style={{ ...S.card, padding: "20px", borderRadius: "16px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 800, color: C.text, margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <MdShowChart size={18} style={{ color: C.primary }} /> Monthly Application Submissions
          </h3>
          <div style={{ height: "160px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "14px", borderBottom: `1.5px solid ${C.border}`, paddingBottom: "10px" }}>
            {[
              { m: "Jan", v: 45 }, { m: "Feb", v: 60 }, { m: "Mar", v: 38 },
              { m: "Apr", v: 75 }, { m: "May", v: 80 }, { m: "Jun", v: 105 }
            ].map((v, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "100%", height: `${v.v}px`, background: C.primary, borderRadius: "4px 4px 0 0", position: "relative" }}>
                  <span style={{ position: "absolute", top: "-18px", left: "50%", transform: "translateX(-50%)", fontSize: "10px", fontWeight: 800, color: C.text }}>{v.v}</span>
                </div>
                <span style={{ fontSize: "10px", fontWeight: 700, color: C.textLight }}>{v.m}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Commission Growth chart */}
        <div style={{ ...S.card, padding: "20px", borderRadius: "16px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 800, color: C.text, margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <MdBarChart size={18} style={{ color: C.green }} /> Commission Growth Trend (INR)
          </h3>
          <div style={{ height: "160px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "14px", borderBottom: `1.5px solid ${C.border}`, paddingBottom: "10px" }}>
            {[
              { m: "Jan", v: 3000 }, { m: "Feb", v: 4500 }, { m: "Mar", v: 3200 },
              { m: "Apr", v: 8000 }, { m: "May", v: 9500 }, { m: "Jun", v: 12000 }
            ].map((v, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "100%", height: `${v.v / 100}px`, background: C.green, borderRadius: "4px 4px 0 0", position: "relative" }}>
                  <span style={{ position: "absolute", top: "-18px", left: "50%", transform: "translateX(-50%)", fontSize: "10px", fontWeight: 800, color: C.text }}>₹{v.v}</span>
                </div>
                <span style={{ fontSize: "10px", fontWeight: 700, color: C.textLight }}>{v.m}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bank Conversion stats */}
        <div style={{ ...S.card, padding: "20px", borderRadius: "16px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 800, color: C.text, margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <MdAnalytics size={18} style={{ color: C.gold }} /> Bank Conversion Performance
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {[
              { name: "HDFC Bank", pct: 92, count: "45 cases" },
              { name: "SBI Cards", pct: 85, count: "30 cases" },
              { name: "Axis Bank", pct: 74, count: "25 cases" },
              { name: "ICICI Bank", pct: 88, count: "20 cases" }
            ].map((bank, idx) => (
              <div key={idx}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                  <span style={{ color: C.text }}>{bank.name} <b style={{ color: C.textLight, fontWeight: 500, fontSize: "10px" }}>({bank.count})</b></span>
                  <span style={{ color: C.green }}>{bank.pct}% Approval</span>
                </div>
                <div style={{ width: "100%", height: "6px", background: C.bgSecondary, borderRadius: "10px", overflow: "hidden" }}>
                  <div style={{ width: `${bank.pct}%`, height: "100%", background: C.primary, borderRadius: "10px" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Date Filters and Ledgers Log Table */}
      <div style={{ ...S.card, padding: "20px", borderRadius: "16px" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 800, color: C.text, margin: 0 }}>Payout Ledger Log</h3>
          
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", background: C.bgSecondary, border: `1.5px solid ${C.border}`, borderRadius: "8px", padding: "0 10px" }}>
              <MdDateRange size={16} style={{ color: C.textLight }} />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={{ background: "transparent", border: "none", outline: "none", padding: "8px", fontSize: "12px", color: C.text }}
              />
            </div>
            <span style={{ fontSize: "12px", color: C.textLight, fontWeight: 700 }}>to</span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", background: C.bgSecondary, border: `1.5px solid ${C.border}`, borderRadius: "8px", padding: "0 10px" }}>
              <MdDateRange size={16} style={{ color: C.textLight }} />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={{ background: "transparent", border: "none", outline: "none", padding: "8px", fontSize: "12px", color: C.text }}
              />
            </div>
            {(fromDate || toDate) && (
              <button
                onClick={() => { setFromDate(""); setToDate(""); }}
                style={{ background: "none", border: "none", color: C.primary, fontSize: "12px", fontWeight: 800, cursor: "pointer" }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "40px 0", textAlign: "center", fontSize: "13px", color: C.textLight }}>Loading ledger transaction entries...</div>
        ) : filteredPayouts.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center", fontSize: "13px", color: C.textLight }}>No transaction entries found for the selected period.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}`, color: C.textLight, fontSize: "11px", fontWeight: 800, textTransform: "uppercase" }}>
                  <th style={{ padding: "12px 16px" }}>Transaction ID</th>
                  <th style={{ padding: "12px 16px" }}>Date</th>
                  <th style={{ padding: "12px 16px" }}>Type</th>
                  <th style={{ padding: "12px 16px" }}>Description</th>
                  <th style={{ padding: "12px 16px" }}>Amount (INR)</th>
                  <th style={{ padding: "12px 16px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayouts.map((tx, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, fontSize: "13px", color: C.text }} className="hover-item">
                    <td style={{ padding: "14px 16px", fontFamily: "monospace", color: C.textMid }}>{tx.id.substring(0, 8)}...</td>
                    <td style={{ padding: "14px 16px", color: C.textLight }}>{new Date(tx.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{
                        padding: "3px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 800, textTransform: "uppercase",
                        background: tx.type === "commission" || tx.credit > 0 ? `${C.green}12` : `${C.red}12`,
                        color: tx.type === "commission" || tx.credit > 0 ? C.green : C.red
                      }}>
                        {tx.type || (tx.credit > 0 ? 'commission' : 'withdrawal')}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", color: C.textMid }}>{tx.description || "Referral override payout"}</td>
                    <td style={{ padding: "14px 16px", fontWeight: 800, color: tx.credit > 0 ? C.green : C.red }}>
                      {tx.credit > 0 ? `+₹${tx.credit}` : `-₹${tx.debit}`}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ padding: "3px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: 800, background: `${C.green}12`, color: C.green, textTransform: "uppercase" }}>
                        {tx.status || 'completed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}
