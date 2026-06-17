import React, { useState, useEffect } from "react";
import api from "../../api/api";
import { useTheme } from "../../components/Partner/ThemeContext";
import { Icons } from "../../components/Partner/PartnerIcons";

export default function AdminDashboard() {
  const { C } = useTheme();
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [topPartners, setTopPartners] = useState([]);
  const [productsData, setProductsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [resOverview, resTrend, resPartners, resProducts] = await Promise.all([
        api.get("/reports/overview"),
        api.get("/reports/monthly-trend"),
        api.get("/reports/top-partners?limit=5"),
        api.get("/reports/applications-by-product"),
      ]);

      if (resOverview.data?.success) setStats(resOverview.data.data);
      if (resTrend.data?.success) setTrends(resTrend.data.data);
      if (resPartners.data?.success) setTopPartners(resPartners.data.data);
      if (resProducts.data?.success) setProductsData(resProducts.data.data);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || "Failed to load dashboard analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px", color: C.text }}>
        <div className="animate-spin" style={{ width: "32px", height: "32px", border: `4px solid ${C.teal}`, borderTopColor: "transparent", borderRadius: "50%", marginBottom: "12px" }}></div>
        <p style={{ fontSize: "14px", fontWeight: 500 }}>Loading analytics dashboard...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div style={{ padding: "24px", background: `${C.red}10`, border: `1px solid ${C.red}30`, borderRadius: "16px", color: C.red, textAlign: "center" }}>
        <p style={{ fontWeight: 600 }}>{errorMsg}</p>
        <button onClick={fetchData} style={{ marginTop: "12px", padding: "8px 16px", background: C.teal, color: "#fff", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}>
          Retry
        </button>
      </div>
    );
  }

  const appStats = stats?.applications || { total: 0, approved: 0, rejected: 0, pending: 0, total_commission: 0 };
  const partnerStats = stats?.Partners || { total: 0, active: 0, pending_kyc: 0 };
  const walletStats = stats?.wallet || { total_earned: 0, total_withdrawn: 0, total_pending: 0, total_available: 0 };

  // Calculate max trend value for scaling the CSS chart
  const maxTrendVal = trends.length > 0 ? Math.max(...trends.map(t => parseInt(t.applications || 0))) : 10;

  return (
    <div style={{ spaceY: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: 800, color: C.text, margin: 0 }}>Dashboard Analytics</h2>
          <p style={{ fontSize: "13px", color: C.textLight, margin: "4px 0 0 0" }}>Real-time overview of platform activity and performance metrics</p>
        </div>
        <button 
          onClick={fetchData}
          style={{ display: "flex", alignItems: "center", gap: "6px", background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "8px 12px", color: C.text, fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Grid Cards Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        {/* Partners widget */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ background: `${C.teal}15`, color: C.teal, borderRadius: "12px", width: "48px", height: "48px", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center" }}>
            <Icons.profile size={24} />
          </div>
          <div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: C.text }}>{partnerStats.total}</div>
            <div style={{ fontSize: "12px", color: C.textLight, fontWeight: 600 }}>Total Partners</div>
            <div style={{ fontSize: "11px", color: C.green, marginTop: "2px", fontWeight: 500 }}>
              {partnerStats.active} Active • {partnerStats.pending_kyc} Pending KYC
            </div>
          </div>
        </div>

        {/* Applications widget */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ background: `${C.gold}15`, color: C.gold, borderRadius: "12px", width: "48px", height: "48px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icons.creditCard size={24} />
          </div>
          <div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: C.text }}>{appStats.total}</div>
            <div style={{ fontSize: "12px", color: C.textLight, fontWeight: 600 }}>Total Applications</div>
            <div style={{ fontSize: "11px", color: C.textMid, marginTop: "2px", fontWeight: 500 }}>
              {appStats.approved} Approved • {appStats.pending} Pending
            </div>
          </div>
        </div>

        {/* System Wallet / Commissions */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ background: `${C.green}15`, color: C.green, borderRadius: "12px", width: "48px", height: "48px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icons.wallet size={24} />
          </div>
          <div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: C.text }}>₹{parseFloat(walletStats.total_earned).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
            <div style={{ fontSize: "12px", color: C.textLight, fontWeight: 600 }}>Total Earned Commission</div>
            <div style={{ fontSize: "11px", color: C.red, marginTop: "2px", fontWeight: 500 }}>
              ₹{parseFloat(walletStats.total_withdrawn).toLocaleString("en-IN", { maximumFractionDigits: 0 })} Withdrawn • ₹{parseFloat(walletStats.total_pending).toLocaleString("en-IN", { maximumFractionDigits: 0 })} Hold
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px", marginBottom: "24px" }}>
        {/* CSS Chart Section */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "20px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: C.text, margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: "8px" }}>
            <Icons.trending size={18} color={C.teal} /> Application Volume Trends (Last 12 Months)
          </h3>
          {trends.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px", color: C.textLight }}>No trend data available.</div>
          ) : (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", height: "180px", padding: "10px 0", borderBottom: `1.5px solid ${C.border}`, gap: "12px", overflowX: "auto" }}>
              {trends.map((t, idx) => {
                const heightPct = maxTrendVal > 0 ? (parseInt(t.applications || 0) / maxTrendVal) * 100 : 0;
                return (
                  <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: "30px", height: "100%", justifyContent: "flex-end" }}>
                    <div style={{ fontSize: "10px", fontWeight: 700, color: C.text, marginBottom: "4px" }}>{t.applications}</div>
                    <div 
                      style={{ 
                        width: "100%", 
                        height: `${Math.max(heightPct, 5)}%`, 
                        background: `linear-gradient(180deg, ${C.teal}, ${C.primaryDark})`, 
                        borderRadius: "4px 4px 0 0",
                        transition: "height 0.5s ease" 
                      }} 
                      title={`${t.applications} applications (${t.approved} approved)`}
                    />
                    <div style={{ fontSize: "9px", color: C.textLight, marginTop: "6px", whiteSpace: "nowrap", transform: "rotate(-30deg)", transformOrigin: "top center", height: "16px" }}>{t.month}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Top Partners and Products Breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px" }}>
        {/* Top Performing Partners */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "20px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: C.text, margin: "0 0 16px 0" }}>Top Performing Partners</h3>
          {topPartners.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px", color: C.textLight }}>No active partner logs yet.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.textLight, fontSize: "12px" }}>
                    <th style={{ padding: "10px 8px", fontWeight: 600 }}>Partner</th>
                    <th style={{ padding: "10px 8px", fontWeight: 600 }}>Code</th>
                    <th style={{ padding: "10px 8px", fontWeight: 600, textAlign: "right" }}>Total Cases</th>
                    <th style={{ padding: "10px 8px", fontWeight: 600, textAlign: "right" }}>Commission</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: "13px", color: C.text }}>
                  {topPartners.map((p, idx) => (
                    <tr key={idx} style={{ borderBottom: `1px solid ${C.border}50` }}>
                      <td style={{ padding: "10px 8px", fontWeight: 600 }}>{p.first_name} {p.last_name}</td>
                      <td style={{ padding: "10px 8px", fontMono: true }}>{p.Partner_code}</td>
                      <td style={{ padding: "10px 8px", textAlign: "right" }}>{p.total_apps} ({p.approved} approved)</td>
                      <td style={{ padding: "10px 8px", textAlign: "right", color: C.green, fontWeight: 700 }}>₹{parseFloat(p.commission_earned).toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Applications by Product */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "20px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: C.text, margin: "0 0 16px 0" }}>Applications by Product</h3>
          {productsData.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px", color: C.textLight }}>No applications recorded yet.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.textLight, fontSize: "12px" }}>
                    <th style={{ padding: "10px 8px", fontWeight: 600 }}>Product Name</th>
                    <th style={{ padding: "10px 8px", fontWeight: 600 }}>Category</th>
                    <th style={{ padding: "10px 8px", fontWeight: 600, textAlign: "right" }}>Submissions</th>
                    <th style={{ padding: "10px 8px", fontWeight: 600, textAlign: "right" }}>Approved</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: "13px", color: C.text }}>
                  {productsData.slice(0, 5).map((p, idx) => (
                    <tr key={idx} style={{ borderBottom: `1px solid ${C.border}50` }}>
                      <td style={{ padding: "10px 8px", fontWeight: 600 }}>{p.product_name} <span style={{ fontSize: "10px", color: C.textLight, background: C.bgSecondary, padding: "2px 6px", borderRadius: "4px", marginLeft: "4px" }}>{p.bank_code}</span></td>
                      <td style={{ padding: "10px 8px", textTransform: "capitalize" }}>{p.category}</td>
                      <td style={{ padding: "10px 8px", textAlign: "right", fontWeight: 500 }}>{p.total}</td>
                      <td style={{ padding: "10px 8px", textAlign: "right", color: C.green, fontWeight: 700 }}>{p.approved}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
