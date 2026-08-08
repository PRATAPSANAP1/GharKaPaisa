import React, { useState, useEffect } from 'react';
import { Target, Trophy, Award } from 'lucide-react';
import { useTheme } from '../../../../contexts/ThemeContext';
import api from '../../../../services/api';

function ProgressBar({ current, target, color }) {
  const pct = target ? Math.min(100, Math.round((current / target) * 100)) : 0;
  return (
    <div>
      <div style={{ height: 8, borderRadius: 99, background: 'rgba(0,0,0,0.1)', overflow: 'hidden', marginTop: 10 }}>
        <div style={{ height: '100%', borderRadius: 99, background: `linear-gradient(90deg,${color},${color}aa)`, width: `${pct}%`, transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
      </div>
      <div style={{ textAlign: 'right', fontSize: 11, color, fontWeight: 700, marginTop: 4 }}>{pct}% Completed</div>
    </div>
  );
}

export default function TeamGoalsTab({ onSelectMember }) {
  const { C, isDark } = useTheme();
  const border = isDark ? '#1f1f1f' : C.border;
  const cardBg = isDark ? '#0f0f0f' : '#fff';
  const textPrimary = C.text;
  const textMuted = C.textMid;
  const accent = C.primary;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchGoals(); }, []);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/team/goals');
      if (res.data?.success) setData(res.data.data);
    } catch { /* silent */ } finally { setLoading(false); }
  };

  const fmt = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <style>{`@keyframes shimmer{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
        {[200, 160, 280].map((h, i) => (
          <div key={i} style={{ height: h, borderRadius: 18, background: isDark ? '#111' : '#f1f5f9', border: `1px solid ${border}`, animation: 'shimmer 1.5s infinite' }} />
        ))}
      </div>
    );
  }

  if (!data) return null;
  const { goals, leaderboard, badges } = data;

  const goalItems = [
    { label: 'Recruitment Target', current: goals.current_month_members, target: goals.member_target, unit: 'Members', color: accent, valueLabel: `${goals.current_month_members} / ${goals.member_target} Members` },
    { label: 'Business Target', current: goals.current_month_business, target: goals.business_target, unit: '₹', color: '#10b981', valueLabel: `${fmt(goals.current_month_business)} / ${fmt(goals.business_target)}` },
    { label: 'Commission Target', current: goals.current_month_commission, target: goals.commission_target, unit: '₹', color: '#f59e0b', valueLabel: `${fmt(goals.current_month_commission)} / ${fmt(goals.commission_target)}` },
    { label: 'Applications Target', current: goals.current_month_apps, target: goals.app_target, unit: 'Apps', color: '#a855f7', valueLabel: `${goals.current_month_apps} / ${goals.app_target} Apps` },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Goals Grid */}
      <div style={{ padding: '20px', borderRadius: 18, background: cardBg, border: `1px solid ${border}`, boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)', animation: 'fadeIn 0.3s ease' }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: textPrimary, margin: '0 0 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Target size={16} color={accent} /> Monthly Target Goals
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 14 }}>
          {goalItems.map((g, i) => (
            <div key={i} style={{ padding: '16px', borderRadius: 14, background: isDark ? '#111' : '#f8faff', border: `1px solid ${g.color}20`, animation: `fadeIn 0.3s ease ${i * 80}ms both` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: textMuted }}>{g.label}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: g.color }}>{g.valueLabel}</span>
              </div>
              <ProgressBar current={g.current} target={g.target} color={g.color} />
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      <div style={{ padding: '20px', borderRadius: 18, background: cardBg, border: `1px solid ${border}`, boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)', animation: 'fadeIn 0.4s ease' }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: textPrimary, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Award size={16} color="#f59e0b" /> Achievement Badges
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 12 }}>
          {badges?.length > 0 ? badges.map((b, i) => (
            <div key={i} style={{ padding: '16px 12px', borderRadius: 14, background: isDark ? '#1a1200' : '#fffbeb', border: '1px solid #f59e0b30', textAlign: 'center', animation: `fadeIn 0.3s ease ${i * 60}ms both` }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{b.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: textPrimary, marginBottom: 4 }}>{b.title}</div>
              <div style={{ fontSize: 11, color: textMuted }}>{b.desc}</div>
            </div>
          )) : (
            <div style={{ gridColumn: '1/-1', padding: '24px 0', textAlign: 'center', color: textMuted, fontSize: 13 }}>Achieve monthly targets to unlock badges!</div>
          )}
        </div>
      </div>

      {/* Leaderboard */}
      <div style={{ padding: '20px', borderRadius: 18, background: cardBg, border: `1px solid ${border}`, boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)', animation: 'fadeIn 0.5s ease' }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: textPrimary, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Trophy size={16} color="#f59e0b" /> Team Leaderboard
        </h3>
        <div>
          {leaderboard?.length > 0 ? leaderboard.map((lb, i) => {
            const rankColors = ['#f59e0b', '#94a3b8', '#cd7f32'];
            const rc = rankColors[i] || textMuted;
            return (
              <div key={lb.id} onClick={() => onSelectMember(lb.id)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 10px', borderRadius: 12, cursor: 'pointer', borderBottom: i < leaderboard.length - 1 ? `1px solid ${border}` : 'none', transition: 'background 0.2s', animation: `fadeIn 0.3s ease ${i * 50}ms both` }}
                onMouseEnter={e => e.currentTarget.style.background = isDark ? '#111' : '#f8faff'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ width: 28, textAlign: 'center', fontSize: 16, fontWeight: 900, color: rc }}>
                    {i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${lb.rank_position}`}
                  </span>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: accent + '15', border: `1px solid ${accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: accent, overflow: 'hidden', fontSize: 12 }}>
                    {lb.photo ? <img src={lb.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : lb.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: textPrimary, fontSize: 13 }}>{lb.name}</div>
                    <div style={{ fontSize: 11, color: textMuted }}>Code: {lb.code} • {lb.badge}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: '#10b981', fontSize: 13 }}>{fmt(lb.business)}</div>
                  <div style={{ fontSize: 11, color: textMuted }}>{lb.apps} Apps</div>
                </div>
              </div>
            );
          }) : (
            <div style={{ padding: '32px 0', textAlign: 'center', color: textMuted, fontSize: 13 }}>No leaderboard members yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
