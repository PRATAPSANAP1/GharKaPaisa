import React from 'react';
import {
  Users, UserCheck, UserPlus, TrendingUp, DollarSign,
  CheckCircle2, FileText, Activity, ArrowUpRight, Crown, ShieldAlert
} from 'lucide-react';
import { useTheme } from '../../../../contexts/ThemeContext';

const KPI_CONFIGS = [
  { key: 'downline', color: '#6366f1', label: 'Total Downline', icon: Users },
  { key: 'joinings', color: '#10b981', label: 'New Joinings', icon: UserPlus },
  { key: 'business', color: '#3b82f6', label: 'Team Business', icon: TrendingUp },
  { key: 'commission', color: '#f59e0b', label: 'Team Commission', icon: DollarSign },
];

function SkeletonCard({ isDark, border }) {
  return (
    <div style={{
      height: 120, borderRadius: 18,
      background: isDark ? '#111' : '#f1f5f9',
      border: `1px solid ${border}`,
      animation: 'shimmer 1.5s infinite'
    }} />
  );
}

export default function TeamDashboardTab({ data, loading, onSelectMember }) {
  const { C, isDark } = useTheme();
  const border = isDark ? '#1f1f1f' : C.border;
  const cardBg = isDark ? '#0f0f0f' : '#fff';
  const textPrimary = C.text;
  const textMuted = C.textMid;
  const accent = C.primary;

  const fmt = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);

  if (loading) {
    return (
      <div>
        <style>{`
          @keyframes shimmer {
            0%,100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
        `}</style>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14, marginBottom: 20 }}>
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} isDark={isDark} border={border} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 14 }}>
          {[...Array(2)].map((_, i) => (
            <div key={i} style={{ height: 240, borderRadius: 18, background: isDark ? '#111' : '#f1f5f9', border: `1px solid ${border}`, animation: 'shimmer 1.5s infinite' }} />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const kpiCards = [
    {
      color: '#6366f1', icon: Users, label: 'Total Downline',
      value: data.total_members,
      badge: `${data.direct_members} Direct / ${data.indirect_members} Indirect`,
      sub: 'Entire team hierarchy count'
    },
    {
      color: '#10b981', icon: UserPlus, label: 'New Joinings',
      value: data.today_joinings,
      badge: `+${data.this_month_joinings} This Month`,
      sub: 'Active recruits growth rate'
    },
    {
      color: '#3b82f6', icon: TrendingUp, label: 'Team Business',
      value: fmt(data.team_business),
      badge: `${data.applications_approved} Approved`,
      sub: 'Total disbursals & credit limits'
    },
    {
      color: '#f59e0b', icon: DollarSign, label: 'Team Commission',
      value: fmt(data.monthly_commission),
      badge: `${fmt(data.lifetime_commission)} Total`,
      sub: `Today: ${fmt(data.today_commission)}`
    },
  ];

  const statCards = [
    {
      label: 'Member Status', icon: UserCheck, iconColor: '#94a3b8',
      items: [
        { val: data.active_members, label: 'Active', color: '#10b981' },
        { val: data.inactive_members, label: 'Inactive', color: '#ef4444' },
      ]
    },
    {
      label: 'KYC Verification', icon: CheckCircle2, iconColor: '#10b981',
      items: [
        { val: data.verified_members, label: 'Verified', color: '#10b981' },
        { val: data.pending_kyc, label: 'Pending', color: '#f59e0b' },
      ]
    },
    {
      label: 'Applications Status', icon: FileText, iconColor: '#3b82f6',
      items: [
        { val: data.applications_submitted, label: 'Total', color: textPrimary },
        { val: data.applications_pending, label: 'Pending', color: '#f59e0b' },
        { val: data.applications_approved, label: 'Approved', color: '#10b981' },
      ]
    },
    {
      label: 'Conversion Rate', icon: Activity, iconColor: '#a855f7',
      custom: (
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 26, fontWeight: 900, color: '#a855f7' }}>{data.average_conversion_rate}%</span>
            <span style={{ fontSize: 11, color: '#a855f7' }}>Apps to Disbursal</span>
          </div>
          <div style={{ height: 6, borderRadius: 99, background: isDark ? '#1f1f1f' : '#e5e7eb', marginTop: 12, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99,
              background: 'linear-gradient(90deg,#a855f7,#7c3aed)',
              width: `${Math.min(100, data.average_conversion_rate)}%`,
              transition: 'width 1s ease'
            }} />
          </div>
        </div>
      )
    },
  ];

  return (
    <div>
      <style>{`
        @keyframes countUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .kpi-card:hover { transform: translateY(-3px) !important; }
        .member-row:hover { background: ${isDark ? '#1a1a1a' : '#f8faff'} !important; }
      `}</style>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 8, marginBottom: 16 }}>
        {kpiCards.map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={i} className="kpi-card" style={{
              padding: 'clamp(10px,2vw,18px) clamp(10px,2vw,20px)', borderRadius: 14,
              background: isDark ? `linear-gradient(135deg,#0f0f0f,${k.color}08)` : `linear-gradient(135deg,#fff,${k.color}08)`,
              border: `1px solid ${isDark ? k.color + '20' : k.color + '30'}`,
              boxShadow: isDark ? `0 4px 24px rgba(0,0,0,0.4)` : `0 4px 20px ${k.color}10`,
              transition: 'all 0.3s ease',
              animation: `countUp 0.4s ease ${i * 80}ms both`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 'clamp(8px,1.2vw,11px)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: k.color }}>{k.label}</span>
                <div style={{ padding: 'clamp(4px,1vw,8px)', borderRadius: 8, background: k.color + '15', border: `1px solid ${k.color}25` }}>
                  <Icon size={14} color={k.color} />
                </div>
              </div>
              <div style={{ fontSize: 'clamp(14px,3vw,26px)', fontWeight: 900, color: textPrimary, marginBottom: 4 }}>{k.value}</div>
              <div style={{ fontSize: 'clamp(8px,1.1vw,10px)', fontWeight: 700, padding: '2px 6px', borderRadius: 99, background: k.color + '15', color: k.color, border: `1px solid ${k.color}25`, display: 'inline-block' }}>{k.badge}</div>
            </div>
          );
        })}
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14, marginBottom: 20 }}>
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} style={{
              padding: '18px 20px', borderRadius: 18,
              background: cardBg, border: `1px solid ${border}`,
              boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)',
              animation: `countUp 0.4s ease ${(i + 4) * 80}ms both`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: textMuted }}>{s.label}</span>
                <Icon size={15} color={s.iconColor} />
              </div>
              {s.custom ? s.custom : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {s.items.map((item, j) => (
                    <React.Fragment key={j}>
                      {j > 0 && <div style={{ width: 1, height: 32, background: border }} />}
                      <div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: item.color }}>{item.val}</div>
                        <div style={{ fontSize: 11, color: textMuted }}>{item.label}</div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Performers + Recent Joinings */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
        {/* Performers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {data.top_performer && (
            <div onClick={() => onSelectMember(data.top_performer.id)}
              style={{
                padding: 20, borderRadius: 18, cursor: 'pointer',
                background: isDark ? 'linear-gradient(135deg,#1a1200,#0f0f0f)' : 'linear-gradient(135deg,#fffbeb,#fff)',
                border: '1px solid #f59e0b40',
                boxShadow: '0 4px 20px rgba(245,158,11,0.1)',
                transition: 'all 0.25s'
              }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>
                  <Crown size={14} color="#f59e0b" /> Top Performer
                </span>
                <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 99, background: '#f59e0b20', color: '#f59e0b', border: '1px solid #f59e0b30', fontWeight: 700 }}>{data.top_performer.rank}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#f59e0b15', border: '2px solid #f59e0b40', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#f59e0b', overflow: 'hidden', fontSize: 14 }}>
                  {data.top_performer.photo ? <img src={data.top_performer.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : data.top_performer.name?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: textPrimary, fontSize: 14 }}>{data.top_performer.name}</div>
                  <div style={{ fontSize: 11, color: textMuted }}>Code: {data.top_performer.code}</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTop: `1px solid ${border}`, fontSize: 12 }}>
                <span style={{ color: textMuted }}>Business: <strong style={{ color: textPrimary }}>{fmt(data.top_performer.business)}</strong></span>
                <span style={{ color: textMuted }}>Apps: <strong style={{ color: '#10b981' }}>{data.top_performer.apps}</strong></span>
              </div>
            </div>
          )}

          {data.lowest_performer && (
            <div onClick={() => onSelectMember(data.lowest_performer.id)}
              style={{
                padding: 18, borderRadius: 18, cursor: 'pointer',
                background: cardBg, border: `1px solid ${border}`,
                transition: 'all 0.25s'
              }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: textMuted, textTransform: 'uppercase' }}>
                  <ShieldAlert size={13} /> Needs Support
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: isDark ? '#1f1f1f' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: textMuted, overflow: 'hidden', fontSize: 12 }}>
                  {data.lowest_performer.photo ? <img src={data.lowest_performer.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : data.lowest_performer.name?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: textPrimary, fontSize: 13 }}>{data.lowest_performer.name}</div>
                  <div style={{ fontSize: 11, color: textMuted }}>Code: {data.lowest_performer.code}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Joinings */}
        <div style={{
          padding: 20, borderRadius: 18,
          background: cardBg, border: `1px solid ${border}`,
          boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: textPrimary, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserPlus size={15} color="#10b981" /> Recent Joinings
            </h3>
            <span style={{ fontSize: 11, color: textMuted }}>Latest 5</span>
          </div>

          <div>
            {data.recent_joinings?.length > 0 ? data.recent_joinings.map((m, i) => (
              <div key={m.id} className="member-row" onClick={() => onSelectMember(m.id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 8px', borderRadius: 12, cursor: 'pointer',
                  transition: 'background 0.2s',
                  borderBottom: i < data.recent_joinings.length - 1 ? `1px solid ${border}` : 'none',
                  animation: `countUp 0.3s ease ${i * 60}ms both`
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: accent + '15', border: `1px solid ${accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: accent, overflow: 'hidden', fontSize: 12, flexShrink: 0 }}>
                    {m.photo ? <img src={m.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : m.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 700, color: textPrimary, fontSize: 13 }}>{m.name}</span>
                      <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, background: isDark ? '#1f1f1f' : '#f1f5f9', color: textMuted, fontWeight: 700 }}>L{m.level}</span>
                    </div>
                    <div style={{ fontSize: 11, color: textMuted }}>Code: {m.code} • {new Date(m.joined_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 10, padding: '3px 8px', borderRadius: 99, fontWeight: 700,
                    background: m.kyc_status === 'approved' ? '#10b98115' : '#f59e0b15',
                    color: m.kyc_status === 'approved' ? '#10b981' : '#f59e0b',
                    border: `1px solid ${m.kyc_status === 'approved' ? '#10b98130' : '#f59e0b30'}`
                  }}>{m.kyc_status === 'approved' ? 'Verified' : 'Pending'}</span>
                  <ArrowUpRight size={14} color={textMuted} />
                </div>
              </div>
            )) : (
              <div style={{ padding: '32px 0', textAlign: 'center', color: textMuted, fontSize: 13 }}>No recent team members found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
