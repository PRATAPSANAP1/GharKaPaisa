import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid
} from 'recharts';
import { TrendingUp, Users, DollarSign } from 'lucide-react';
import { useTheme } from '../../../../contexts/ThemeContext';
import api from '../../../../services/api';

const PERIODS = ['7d', '30d', '90d', '1y'];

export default function TeamAnalyticsTab() {
  const { C, isDark } = useTheme();

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const border = isDark ? '#1f1f1f' : C.border;
  const cardBg = isDark ? '#0f0f0f' : '#fff';
  const textPrimary = C.text;
  const textMuted = C.textMid;
  const accent = C.primary;

  const [analytics, setAnalytics] = useState(null);
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAnalytics(); }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/team/analytics?period=${period}`);
      if (res.data?.success) setAnalytics(res.data.data);
    } catch { /* silent */ } finally { setLoading(false); }
  };

  const fmt = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);

  const tooltipStyle = {
    contentStyle: { backgroundColor: isDark ? '#0f0f0f' : '#fff', borderColor: border, borderRadius: 12, color: textPrimary, fontSize: 12 }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <style>{`@keyframes shimmer { 0%,100%{opacity:1}50%{opacity:0.4} }`}</style>
        {[280, 240, 200].map((h, i) => (
          <div key={i} style={{ height: h, borderRadius: 18, background: isDark ? '#111' : '#f1f5f9', border: `1px solid ${border}`, animation: 'shimmer 1.5s infinite' }} />
        ))}
      </div>
    );
  }

  if (!analytics) return null;

  const funnel = analytics.conversion_funnel || {};
  const funnelItems = [
    { label: 'Referral Clicks', value: funnel.referral_clicks, color: '#6366f1', conv: null },
    { label: 'Registrations', value: funnel.registrations, color: '#3b82f6', conv: funnel.referral_clicks > 0 ? ((funnel.registrations / funnel.referral_clicks) * 100).toFixed(1) : 0 },
    { label: 'KYC Approved', value: funnel.kyc_approved, color: '#10b981', conv: funnel.registrations > 0 ? ((funnel.kyc_approved / funnel.registrations) * 100).toFixed(1) : 0 },
    { label: 'Apps Submitted', value: funnel.applications_submitted, color: '#f59e0b', conv: null },
    { label: 'Apps Approved', value: funnel.applications_approved, color: '#10b981', conv: funnel.applications_submitted > 0 ? ((funnel.applications_approved / funnel.applications_submitted) * 100).toFixed(1) : 0 },
    { label: 'Commission', value: fmt(funnel.commissions_earned), color: '#f59e0b', conv: null },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <style>{`@keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }`}</style>

      {/* Header + Period Selector */}
      <div style={{ padding: '16px 20px', borderRadius: 18, background: cardBg, border: `1px solid ${border}`, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)', animation: 'fadeIn 0.3s ease' }}>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: textPrimary, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={16} color={accent} /> Team Performance Analytics
          </h3>
          <p style={{ fontSize: 12, color: textMuted, margin: '3px 0 0' }}>Recruitment velocity, business sales & commission growth</p>
        </div>
        <div style={{ display: 'flex', gap: 4, padding: 4, background: isDark ? '#111' : '#f1f5f9', borderRadius: 12, border: `1px solid ${border}` }}>
          {PERIODS.map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{ padding: '6px 14px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', background: period === p ? `linear-gradient(135deg,${accent},${C.primaryDark})` : 'transparent', color: period === p ? '#fff' : textMuted, boxShadow: period === p ? `0 2px 10px ${accent}40` : 'none', transition: 'all 0.2s' }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Conversion Funnel */}
      <div style={{ padding: '20px', borderRadius: 18, background: isDark ? 'linear-gradient(135deg,#0d0d1a,#0f0f0f)' : 'linear-gradient(135deg,#f0f4ff,#fff)', border: `1px solid ${accent}20`, boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : `0 4px 20px ${accent}10`, animation: 'fadeIn 0.4s ease' }}>
        <h4 style={{ fontSize: 11, fontWeight: 800, color: accent, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Referral & Application Conversion Funnel</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 10 }}>
          {funnelItems.map((item, i) => (
            <div key={i} style={{ padding: '14px 12px', borderRadius: 14, background: isDark ? '#111' : '#fff', border: `1px solid ${item.color}20`, textAlign: 'center', animation: `fadeIn 0.3s ease ${i * 60}ms both` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: textMuted, textTransform: 'uppercase', marginBottom: 8 }}>{item.label}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: item.color }}>{item.value}</div>
              {item.conv !== null && (
                <div style={{ fontSize: 10, fontWeight: 700, color: item.color, marginTop: 4 }}>{item.conv}% Conv</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
        <div style={{ padding: '18px 20px', borderRadius: 18, background: cardBg, border: `1px solid ${border}`, boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)', animation: 'fadeIn 0.5s ease' }}>
          <h4 style={{ fontSize: 13, fontWeight: 800, color: textPrimary, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <DollarSign size={15} color="#10b981" /> Business & Commission Trend
          </h4>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.business_trend || []}>
                <defs>
                  <linearGradient id="bizGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={border} opacity={0.6} />
                <XAxis dataKey="month" stroke={textMuted} fontSize={10} />
                <YAxis stroke={textMuted} fontSize={10} />
                <Tooltip {...tooltipStyle} formatter={v => [fmt(v), 'Business']} />
                <Area type="monotone" dataKey="business" stroke="#10b981" fill="url(#bizGrad)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ padding: '18px 20px', borderRadius: 18, background: cardBg, border: `1px solid ${border}`, boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)', animation: 'fadeIn 0.6s ease' }}>
          <h4 style={{ fontSize: 13, fontWeight: 800, color: textPrimary, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={15} color={accent} /> Recruitment Velocity
          </h4>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.daily_joining_trend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke={border} opacity={0.6} />
                <XAxis dataKey="date" stroke={textMuted} fontSize={10} />
                <YAxis stroke={textMuted} fontSize={10} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="joinings" fill={accent} radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div style={{ padding: '18px 20px', borderRadius: 18, background: cardBg, border: `1px solid ${border}`, boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)', animation: 'fadeIn 0.7s ease' }}>
        <h4 style={{ fontSize: 13, fontWeight: 800, color: textPrimary, marginBottom: 16 }}>Top Products Sold by Team</h4>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
          {analytics.top_products?.length > 0 ? analytics.top_products.map((p, i) => (
            <div key={i} style={{ padding: '14px 16px', borderRadius: 14, background: isDark ? '#111' : '#f8faff', border: `1px solid ${border}`, animation: `fadeIn 0.3s ease ${i * 60}ms both` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: textPrimary }}>{p.product_name}</span>
                <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: accent + '15', color: accent, fontWeight: 700 }}>{p.category}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: textMuted }}>Sales: <strong style={{ color: textPrimary }}>{p.sales_count}</strong></span>
                <span style={{ fontWeight: 800, color: '#10b981' }}>{fmt(p.total_amount)}</span>
              </div>
            </div>
          )) : (
            <div style={{ gridColumn: '1/-1', padding: '32px 0', textAlign: 'center', color: textMuted, fontSize: 13 }}>No product sales recorded yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
