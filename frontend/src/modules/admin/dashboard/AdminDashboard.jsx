import React, { useState, useEffect } from 'react';
import api from "../../../services/api";
import { useTheme } from "../../../contexts/ThemeContext";
import { 
  Users, FileText, Wallet, Clock, TrendingUp, CheckCircle2, 
  AlertCircle, RefreshCw, Shield, Layers, Award, ArrowUpRight, BarChart3
} from 'lucide-react';

export default function AdminDashboard() {
  const { C, isDark } = useTheme();
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [topPartners, setTopPartners] = useState([]);
  const [productsData, setProductsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const border = isDark ? '#1f1f1f' : C.border;
  const cardBg = isDark ? '#0d1322' : '#ffffff';
  const textPrimary = C.text;
  const textMuted = C.textMid;
  const accent = C.primary;

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
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "420px", color: textPrimary }}>
        <div className="animate-spin" style={{ width: "40px", height: "40px", border: `4px solid ${accent}`, borderTopColor: "transparent", borderRadius: "50%", marginBottom: "16px" }} />
        <p style={{ fontSize: "14px", fontWeight: 700, color: textMuted }}>Loading GharKaPaisa Operational Analytics...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div style={{ padding: "28px", background: `#ef444415`, border: `1px solid #ef444440`, borderRadius: "20px", color: "#ef4444", textAlign: "center", maxWidth: 500, margin: '40px auto' }}>
        <AlertCircle size={36} style={{ margin: '0 auto 12px' }} />
        <p style={{ fontWeight: 700, fontSize: 15, margin: '0 0 16px' }}>{errorMsg}</p>
        <button onClick={fetchData} style={{ padding: "10px 22px", background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff", border: "none", borderRadius: "12px", fontWeight: 800, cursor: "pointer", boxShadow: '0 4px 14px rgba(239,68,68,0.4)' }}>
          Retry Loading Dashboard
        </button>
      </div>
    );
  }

  const appStats = stats?.applications || { total: 0, approved: 0, rejected: 0, pending: 0, total_commission: 0 };
  const partnerStats = stats?.Partners || stats?.partners || { total: 0, active: 0, pending_kyc: 0 };
  const leadStats = stats?.leads || { total_leads: 0, approved_leads: 0, rejected_leads: 0, pending_leads: 0, todays_leads: 0 };
  const withdrawalStats = stats?.withdrawal || { pending_withdrawals: 0, total_commission_paid: 0 };

  const maxTrendVal = trends.length > 0 ? Math.max(...trends.map(t => parseInt(t.applications || 0))) : 10;

  const statCards = [
    { label: "Pending Leads", val: leadStats.pending_leads || 0, sub: "Requires PAN/QD review", icon: <Clock size={22} />, color: "#f59e0b", bg: "#f59e0b15" },
    { label: "Today's Leads", val: leadStats.todays_leads || 0, sub: "New entries logged today", icon: <TrendingUp size={22} />, color: "#3b82f6", bg: "#3b82f615" },
    { label: "Pending KYC", val: partnerStats.pending_kyc || 0, sub: "Partner documents pending", icon: <Shield size={22} />, color: "#8b5cf6", bg: "#8b5cf615" },
    { label: "Pending Withdrawals", val: withdrawalStats.pending_withdrawals || 0, sub: "Wallet payouts requested", icon: <Wallet size={22} />, color: "#ef4444", bg: "#ef444415" },
    { label: "Total Partners", val: partnerStats.total || 0, sub: `${partnerStats.active || 0} Active Network`, icon: <Users size={22} />, color: "#10b981", bg: "#10b98115" },
    { label: "Total Applications", val: appStats.total || 0, sub: `${appStats.approved || 0} Approved Cases`, icon: <FileText size={22} />, color: "#06b6d4", bg: "#06b6d415" }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* Top Banner Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, background: isDark ? 'linear-gradient(135deg, #111c35 0%, #0d1428 100%)' : '#ffffff', border: `1px solid ${border}`, borderRadius: 20, padding: "18px 20px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
            <span>⚡ Operational Intelligence Desk</span>
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: 900, color: textPrimary, margin: 0 }}>Admin Dashboard Analytics</h2>
          <p style={{ fontSize: "13px", color: textMuted, margin: "4px 0 0 0" }}>Real-time metrics, partner performance, and application tracking</p>
        </div>

        <button 
          onClick={fetchData}
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: isDark ? '#1a2744' : '#f1f5f9', border: `1px solid ${border}`, borderRadius: "14px", padding: "10px 18px", color: textPrimary, fontSize: "13px", fontWeight: 800, cursor: "pointer", transition: 'all 0.2s ease' }}
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh Data
        </button>
      </div>

      {/* Grid Cards Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
        {statCards.map((card, idx) => (
          <div key={idx} style={{ 
            background: cardBg, 
            border: `1px solid ${border}`, 
            borderTop: `3px solid ${card.color}`,
            borderRadius: "20px", 
            padding: "20px 22px", 
            display: "flex", 
            alignItems: "center", 
            gap: "16px",
            boxShadow: isDark ? "0 10px 25px rgba(0,0,0,0.3)" : "0 4px 16px rgba(0,0,0,0.03)",
            transition: 'transform 0.2s ease, boxShadow 0.2s ease'
          }}>
            <div style={{ background: card.bg, color: card.color, borderRadius: "16px", width: "50px", height: "50px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {card.icon}
            </div>
            <div>
              <div style={{ fontSize: "24px", fontWeight: 900, color: textPrimary, lineHeight: 1.1 }}>{card.val}</div>
              <div style={{ fontSize: "12.5px", color: textMuted, fontWeight: 700, marginTop: 4 }}>{card.label}</div>
              {card.sub && (
                <div style={{ fontSize: "11px", color: card.color, marginTop: "2px", fontWeight: 700 }}>
                  {card.sub}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Chart Section: Application Volume Trends */}
      <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 20, padding: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.04)", overflowX: "auto" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <h3 style={{ fontSize: "14px", fontWeight: 900, color: textPrimary, margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <BarChart3 size={18} color="#3b82f6" /> Application Trends (12M)
          </h3>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#3b82f6', background: '#3b82f615', padding: '4px 10px', borderRadius: 20 }}>
            Live Sync
          </span>
        </div>

        {trends.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: textMuted, fontSize: 13 }}>No monthly application trend data recorded yet.</div>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", height: "200px", padding: "16px 10px 10px", borderBottom: `1.5px solid ${border}`, gap: "14px", overflowX: "auto" }}>
            {trends.map((t, idx) => {
              const heightPct = maxTrendVal > 0 ? (parseInt(t.applications || 0) / maxTrendVal) * 100 : 0;
              return (
                <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: "36px", height: "100%", justifyContent: "flex-end" }}>
                  <div style={{ fontSize: "11px", fontWeight: 800, color: textPrimary, marginBottom: "6px" }}>{t.applications}</div>
                  <div 
                    style={{ 
                      width: "100%", 
                      maxWidth: 24,
                      height: `${Math.max(heightPct, 8)}%`, 
                      background: `linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)`, 
                      borderRadius: "6px 6px 0 0",
                      boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
                      transition: "height 0.4s cubic-bezier(0.4, 0, 0.2, 1)" 
                    }} 
                    title={`${t.applications} applications (${t.approved || 0} approved)`}
                  />
                  <div style={{ fontSize: "10px", fontWeight: 700, color: textMuted, marginTop: "8px", whiteSpace: "nowrap" }}>{t.month}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tables Breakdown Section */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
        
        {/* Top Performing Partners Table */}
        <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: "24px", padding: "24px", boxShadow: "0 10px 30px rgba(0,0,0,0.04)" }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ fontSize: "16px", fontWeight: 900, color: textPrimary, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Award size={18} color="#10b981" /> Top Performing Partners
            </h3>
          </div>

          {topPartners.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px", color: textMuted, fontSize: 13 }}>No active partner activity logged.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${border}`, color: textMuted, fontSize: "11px", textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={{ padding: "10px 8px" }}>Partner</th>
                    <th style={{ padding: "10px 8px" }}>Code</th>
                    <th style={{ padding: "10px 8px", textAlign: "right" }}>Cases</th>
                    <th style={{ padding: "10px 8px", textAlign: "right" }}>Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {topPartners.map((p, idx) => (
                    <tr key={idx} style={{ borderBottom: `1px solid ${border}` }}>
                      <td style={{ padding: "12px 8px", fontWeight: 700, color: textPrimary }}>{p.first_name} {p.last_name}</td>
                      <td style={{ padding: "12px 8px" }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#3b82f6', background: '#3b82f615', padding: '3px 8px', borderRadius: 6 }}>
                          {p.Partner_code || p.partner_code}
                        </span>
                      </td>
                      <td style={{ padding: "12px 8px", textAlign: "right", fontWeight: 600, color: textMuted }}>
                        {p.total_apps} ({p.approved} apprd)
                      </td>
                      <td style={{ padding: "12px 8px", textAlign: "right", color: '#10b981', fontWeight: 900 }}>
                        ₹{parseFloat(p.commission_earned || 0).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Applications by Product Table */}
        <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: "24px", padding: "24px", boxShadow: "0 10px 30px rgba(0,0,0,0.04)" }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ fontSize: "16px", fontWeight: 900, color: textPrimary, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={18} color="#8b5cf6" /> Applications by Product
            </h3>
          </div>

          {productsData.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px", color: textMuted, fontSize: 13 }}>No product applications logged.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${border}`, color: textMuted, fontSize: "11px", textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={{ padding: "10px 8px" }}>Product</th>
                    <th style={{ padding: "10px 8px" }}>Category</th>
                    <th style={{ padding: "10px 8px", textAlign: "right" }}>Total</th>
                    <th style={{ padding: "10px 8px", textAlign: "right" }}>Approved</th>
                  </tr>
                </thead>
                <tbody>
                  {productsData.slice(0, 5).map((p, idx) => (
                    <tr key={idx} style={{ borderBottom: `1px solid ${border}` }}>
                      <td style={{ padding: "12px 8px", fontWeight: 700, color: textPrimary }}>
                        {p.product_name} 
                        {p.bank_code && <span style={{ fontSize: "10px", color: textMuted, background: isDark ? '#1a2744' : '#f1f5f9', padding: "2px 6px", borderRadius: "4px", marginLeft: "6px", fontWeight: 700 }}>{p.bank_code}</span>}
                      </td>
                      <td style={{ padding: "12px 8px", textTransform: "capitalize", color: textMuted }}>{p.category}</td>
                      <td style={{ padding: "12px 8px", textAlign: "right", fontWeight: 700 }}>{p.total}</td>
                      <td style={{ padding: "12px 8px", textAlign: "right", color: '#10b981', fontWeight: 900 }}>{p.approved}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Recently Registered Partners Table */}
      <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: "24px", padding: "24px", boxShadow: "0 10px 30px rgba(0,0,0,0.04)" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 900, color: textPrimary, margin: "0 0 18px 0" }}>Recently Registered Partners</h3>
        {(!stats?.recent_partners || stats.recent_partners.length === 0) ? (
          <div style={{ textAlign: "center", padding: "32px", color: textMuted, fontSize: 13 }}>No recently registered partners found.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${border}`, color: textMuted, fontSize: "11px", textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: "12px 10px" }}>Partner Name</th>
                  <th style={{ padding: "12px 10px" }}>Partner Code</th>
                  <th style={{ padding: "12px 10px" }}>Contact Info</th>
                  <th style={{ padding: "12px 10px" }}>Registered Date</th>
                  <th style={{ padding: "12px 10px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_partners.map((p, idx) => (
                  <tr key={idx} style={{ borderBottom: `1px solid ${border}` }}>
                    <td style={{ padding: "14px 10px", fontWeight: 800, color: textPrimary }}>{p.first_name} {p.last_name}</td>
                    <td style={{ padding: "14px 10px" }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#3b82f6', background: '#3b82f615', padding: '4px 8px', borderRadius: 6 }}>
                        {p.Partner_code || p.partner_code || '—'}
                      </span>
                    </td>
                    <td style={{ padding: "14px 10px" }}>
                      <div style={{ color: textPrimary, fontWeight: 600 }}>{p.email}</div>
                      <div style={{ fontSize: "11px", color: textMuted }}>{p.mobile}</div>
                    </td>
                    <td style={{ padding: "14px 10px", color: textMuted, fontWeight: 600 }}>{new Date(p.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: "14px 10px" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "4px 12px",
                        borderRadius: "20px",
                        fontSize: "11px",
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        background: p.status === 'active' ? '#10b98115' : '#f59e0b15',
                        color: p.status === 'active' ? '#10b981' : '#f59e0b'
                      }}>
                        {p.status}
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
