import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme, makeS } from "../../../contexts/ThemeContext";
import { useAuthStore } from "../../../app/store/authStore";
import api from "../../../services/api";
import {
  MdBarChart, MdTrendingUp, MdTimeline, MdDownload, MdFilterList,
  MdDateRange, MdArrowBack, MdAnalytics, MdShowChart, MdPieChart,
  MdDashboard, MdPeople, MdAccountBalanceWallet, MdDescription,
  MdAccountBalance, MdGroupWork, MdCategory, MdPictureAsPdf, MdCloudDownload, MdRefresh
} from "react-icons/md";
import { useNavigate } from "react-router-dom";

export default function PartnerReports() {
  const { t } = useTranslation();
  const { C } = useTheme();
  const S = makeS(C);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, applications, customers, wallet, commission, team, withdrawals, products, banks
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  // Universal Filter Component State
  const [datePreset, setDatePreset] = useState("month"); // today, yesterday, week, month, year, custom
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");

  const fetchReport = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const params = {
        date_preset: datePreset,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        search: search || undefined
      };
      const res = await api.get(`/reports/${activeTab}`, { params });
      if (res.data?.success) {
        setReportData(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load report payload:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeTab, datePreset, fromDate, toDate, search]);

  const handleExport = async (format = 'csv') => {
    try {
      const res = await api.post('/reports/export', {
        report_type: activeTab,
        format,
        date_preset: datePreset,
        from_date: fromDate,
        to_date: toDate
      });
      if (res.data?.success) {
        alert(`Export Generated! File: ${res.data.data.file_name}`);
      }
    } catch (err) {
      alert("Failed to generate export file");
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 id="partner-reports-title" style={{ fontSize: '24px', fontWeight: 800, color: C.text, margin: 0 }}>{t("reports.title", "Reports & Aggregation Engine")}</h2>
          <p id="partner-reports-desc" style={{ fontSize: '13px', color: C.textLight, margin: '4px 0 0 0' }}>{t("reports.desc", "Real-time business performance analytics, MD5 filter caching & multi-format exports.")}</p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            id="partner-reports-export-csv"
            onClick={() => handleExport('csv')}
            style={{ ...S.btn('outline'), display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px' }}
          >
            <MdCloudDownload size={18} />
            <span>{t("reports.exportCsv", "Export CSV")}</span>
          </button>

          <button
            id="partner-reports-export-excel"
            onClick={() => handleExport('excel')}
            style={{ ...S.btn('primary'), background: C.teal, display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px' }}
          >
            <MdCloudDownload size={18} />
            <span>{t("reports.exportExcel", "Export Excel")}</span>
          </button>
        </div>
      </div>

      {/* Shared Universal Filter Component */}
      <div style={{ ...S.card, padding: '16px', borderRadius: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
          {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' },
            { id: 'year', label: 'This Year' },
            { id: 'custom', label: 'Custom Range' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setDatePreset(p.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                background: datePreset === p.id ? C.teal : C.bgSecondary,
                color: datePreset === p.id ? '#FFF' : C.text
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {datePreset === 'custom' && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input type="date" style={S.input} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            <span style={{ fontSize: '12px', color: C.textLight }}>to</span>
            <input type="date" style={S.input} value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
        )}

        <div style={{ flex: 1, minWidth: '180px' }}>
          <input
            style={S.input}
            placeholder="Search report records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* 9 Report Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: `1px solid ${C.border}`, paddingBottom: '2px', overflowX: 'auto' }}>
        {[
          { id: 'dashboard', label: 'Dashboard Overview', icon: MdDashboard },
          { id: 'applications', label: 'Applications', icon: MdDescription },
          { id: 'customers', label: 'Customers', icon: MdPeople },
          { id: 'wallet', label: 'Wallet Ledger', icon: MdAccountBalanceWallet },
          { id: 'commission', label: 'Commission Ledger', icon: MdShowChart },
          { id: 'team', label: 'Team Downline', icon: MdGroupWork },
          { id: 'withdrawals', label: 'Withdrawals', icon: MdAccountBalance },
          { id: 'products', label: 'Products', icon: MdCategory },
          { id: 'banks', label: 'Bank Partners', icon: MdPieChart },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: active ? `3px solid ${C.teal}` : '3px solid transparent',
                color: active ? C.teal : C.textLight,
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: DASHBOARD OVERVIEW SUMMARY */}
      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ ...S.card, padding: '20px', borderRadius: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, textTransform: 'uppercase' }}>Total Applications</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: C.text, marginTop: '4px' }}>{reportData?.applications || 0}</div>
            </div>

            <div style={{ ...S.card, padding: '20px', borderRadius: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, textTransform: 'uppercase' }}>Approved Applications</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: C.green, marginTop: '4px' }}>{reportData?.approved || 0}</div>
            </div>

            <div style={{ ...S.card, padding: '20px', borderRadius: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, textTransform: 'uppercase' }}>Rejected Applications</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: C.red, marginTop: '4px' }}>{reportData?.rejected || 0}</div>
            </div>

            <div style={{ ...S.card, padding: '20px', borderRadius: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, textTransform: 'uppercase' }}>Lifetime Commission</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: C.gold, marginTop: '4px' }}>₹{parseFloat(reportData?.commission || 0).toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>
      )}

      {/* GENERIC DATA TABLES FOR OTHER REPORT TABS */}
      {activeTab !== 'dashboard' && (
        <div style={{ ...S.card, padding: 0, borderRadius: '16px', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: C.textLight }}>Loading cached report payload...</div>
          ) : !Array.isArray(reportData) || reportData.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: C.textLight }}>No report records found matching filter criteria.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, textAlign: 'left', color: C.textLight, fontSize: '11px' }}>
                    {Object.keys(reportData[0] || {}).slice(0, 7).map(key => (
                      <th key={key} style={{ padding: '12px 16px', textTransform: 'uppercase' }}>{key.replace('_', ' ')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody style={{ color: C.text }}>
                  {reportData.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: `1px solid ${C.border}` }}>
                      {Object.values(row).slice(0, 7).map((val, vIdx) => (
                        <td key={vIdx} style={{ padding: '12px 16px' }}>
                          {typeof val === 'boolean' ? (val ? 'TRUE' : 'FALSE') : String(val ?? 'N/A')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
