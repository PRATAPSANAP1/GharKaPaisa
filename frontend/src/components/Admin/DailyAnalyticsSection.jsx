import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { Calendar, UserCheck, FilePlus, CheckCircle, TrendingUp, RefreshCw } from 'lucide-react';

export default function DailyAnalyticsSection() {
  const { C, isDark } = useTheme();
  const [days, setDays] = useState(14);
  const [loading, setLoading] = useState(true);
  const [dailyData, setDailyData] = useState([]);
  const [summaryTotals, setSummaryTotals] = useState({ employee_logins: 0, new_applications: 0, approved_applications: 0 });
  const [fetchError, setFetchError] = useState(null);

  const fetchDailyAnalytics = async (selectedDays) => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await api.get(`/reports/daily-analytics?days=${selectedDays}`);
      if (res.data?.success && res.data?.data) {
        setDailyData(res.data.data.daily_metrics || []);
        setSummaryTotals(res.data.data.summary_totals || { employee_logins: 0, new_applications: 0, approved_applications: 0 });
      }
    } catch (err) {
      console.error('Failed to fetch daily analytics', err);
      setFetchError('Unable to load day-wise analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyAnalytics(days);
  }, [days]);

  const maxApps = Math.max(...dailyData.map(d => d.new_applications), 1);

  return (
    <div style={{
      background: C.card,
      borderRadius: '24px',
      border: `1px solid ${C.border}`,
      padding: '24px',
      boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.3)' : '0 6px 20px rgba(0,0,0,0.04)',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 900, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={20} color={C.primary} /> Day-Wise Operational Analysis
          </h3>
          <p style={{ fontSize: '12.5px', color: C.textMid, margin: '4px 0 0 0' }}>
            Day-by-day metrics breakdown for Employee Logins, New Applications, and Approved Applications.
          </p>
        </div>

        {/* Days Period Selector */}
        <div style={{ display: 'flex', gap: '6px', background: C.bg, padding: '4px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
          {[7, 14, 30].map(period => (
            <button
              key={period}
              onClick={() => setDays(period)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: days === period ? C.primary : 'transparent',
                color: days === period ? '#fff' : C.textMid,
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Last {period} Days
            </button>
          ))}
          <button
            onClick={() => fetchDailyAnalytics(days)}
            title="Refresh"
            style={{ background: 'transparent', border: 'none', padding: '6px 10px', color: C.textMid, cursor: 'pointer' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Period Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <div style={{ background: C.bg, padding: '16px', borderRadius: '16px', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366F1', width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <UserCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: C.text }}>{loading ? '...' : summaryTotals.employee_logins}</div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>Employee Logins</div>
          </div>
        </div>

        <div style={{ background: C.bg, padding: '16px', borderRadius: '16px', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6', width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FilePlus size={22} />
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: C.text }}>{loading ? '...' : summaryTotals.new_applications}</div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>New Applications</div>
          </div>
        </div>

        <div style={{ background: C.bg, padding: '16px', borderRadius: '16px', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CheckCircle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: C.text }}>{loading ? '...' : summaryTotals.approved_applications}</div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>Approved Applications</div>
          </div>
        </div>

        <div style={{ background: C.bg, padding: '16px', borderRadius: '16px', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <TrendingUp size={22} />
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: C.text }}>
              {loading ? '...' : (summaryTotals.new_applications > 0 ? ((summaryTotals.approved_applications / summaryTotals.new_applications) * 100).toFixed(1) + '%' : '0%')}
            </div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>Approval Conversion</div>
          </div>
        </div>
      </div>

      {/* Day-Wise Data Table */}
      {fetchError ? (
        <div style={{ textAlign: 'center', padding: '24px', color: '#EF4444', fontSize: '13px' }}>{fetchError}</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.textMid, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '12px 14px' }}>Date</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Employee Logins</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>New Applications</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Approved Applications</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Daily Approval %</th>
                <th style={{ padding: '12px 14px', width: '180px' }}>Application Volume</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: C.textMid }}>Loading day-wise analysis...</td>
                </tr>
              ) : dailyData.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: C.textMid }}>No operational records found for selected period.</td>
                </tr>
              ) : (
                dailyData.map((row, idx) => {
                  const rate = row.new_applications > 0 ? ((row.approved_applications / row.new_applications) * 100).toFixed(0) : 0;
                  const barWidth = Math.min(100, Math.round((row.new_applications / maxApps) * 100));

                  return (
                    <tr key={row.date_iso || idx} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '12px 14px', fontWeight: 800, color: C.text, whiteSpace: 'nowrap' }}>
                        {row.formatted_date}
                      </td>
                      
                      {/* Employee Logins */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontWeight: 800,
                          fontSize: '12px',
                          background: row.employee_logins > 0 ? 'rgba(99, 102, 241, 0.15)' : C.bg,
                          color: row.employee_logins > 0 ? '#6366F1' : C.textMid
                        }}>
                          👤 {row.employee_logins}
                        </span>
                      </td>

                      {/* New Applications */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontWeight: 800,
                          fontSize: '12px',
                          background: row.new_applications > 0 ? 'rgba(59, 130, 246, 0.15)' : C.bg,
                          color: row.new_applications > 0 ? '#3B82F6' : C.textMid
                        }}>
                          📄 {row.new_applications}
                        </span>
                      </td>

                      {/* Approved Applications */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontWeight: 800,
                          fontSize: '12px',
                          background: row.approved_applications > 0 ? 'rgba(16, 185, 129, 0.15)' : C.bg,
                          color: row.approved_applications > 0 ? '#10B981' : C.textMid
                        }}>
                          ✅ {row.approved_applications}
                        </span>
                      </td>

                      {/* Daily Approval % */}
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: rate > 0 ? '#10B981' : C.textMid }}>
                        {rate}%
                      </td>

                      {/* Visual Bar */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ height: '8px', width: '100%', background: C.bg, borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${barWidth}%`,
                            background: 'linear-gradient(90deg, #3B82F6, #10B981)',
                            borderRadius: '4px',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
