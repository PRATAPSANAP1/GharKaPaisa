import React, { useState, useEffect } from 'react';
import { Activity, UserPlus, FileCheck, CheckCircle2, DollarSign, Clock } from 'lucide-react';
import { useTheme } from '../../../../contexts/ThemeContext';
import api from '../../../../services/api';

const ICON_MAP = {
  MEMBER_JOINED: { icon: UserPlus, color: '#10b981' },
  APPLICATION_SUBMITTED: { icon: FileCheck, color: '#f59e0b' },
  APPLICATION_APPROVED: { icon: CheckCircle2, color: '#10b981' },
  COMMISSION_EARNED: { icon: DollarSign, color: '#f59e0b' },
};

export default function TeamActivityTab({ onSelectMember }) {
  const { C, isDark } = useTheme();
  const border = isDark ? '#1f1f1f' : C.border;
  const cardBg = isDark ? '#0f0f0f' : '#fff';
  const textPrimary = C.text;
  const textMuted = C.textMid;
  const accent = C.primary;

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchActivity(); }, []);

  const fetchActivity = async () => {
    setLoading(true);
    try {
      const res = await api.get('/team/activity');
      if (res.data?.success) setActivities(res.data.data || []);
    } catch { /* silent */ } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: '20px', borderRadius: 18, background: cardBg, border: `1px solid ${border}`, boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)' }}>
      <style>{`
        @keyframes slideIn { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
        @keyframes shimmer { 0%,100%{opacity:1}50%{opacity:0.4} }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid ${border}` }}>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: textPrimary, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={16} color={accent} /> Live Activity Stream
          </h3>
          <p style={{ fontSize: 12, color: textMuted, margin: '3px 0 0' }}>Real-time team recruitments, sales & milestone approvals</p>
        </div>
      </div>

      {/* Timeline */}
      <div style={{ position: 'relative', paddingLeft: 32 }}>
        {/* Vertical line */}
        <div style={{ position: 'absolute', left: 11, top: 0, bottom: 0, width: 2, background: isDark ? '#1f1f1f' : '#e5e7eb', borderRadius: 2 }} />

        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} style={{ height: 72, borderRadius: 14, background: isDark ? '#111' : '#f1f5f9', marginBottom: 16, animation: 'shimmer 1.5s infinite' }} />
          ))
        ) : activities.length > 0 ? activities.map((act, i) => {
          const cfg = ICON_MAP[act.type] || { icon: Activity, color: accent };
          const Icon = cfg.icon;
          return (
            <div key={act.id} style={{ position: 'relative', marginBottom: 16, animation: `slideIn 0.3s ease ${i * 60}ms both` }}>
              {/* Dot */}
              <div style={{ position: 'absolute', left: -32, top: 14, width: 24, height: 24, borderRadius: '50%', background: isDark ? '#0f0f0f' : '#fff', border: `2px solid ${cfg.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 0 4px ${cfg.color}10` }}>
                <Icon size={11} color={cfg.color} />
              </div>

              <div style={{ padding: '12px 16px', borderRadius: 14, background: isDark ? '#111' : '#f8faff', border: `1px solid ${border}`, transition: 'border-color 0.2s' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: textPrimary }}>{act.description}</span>
                  <span style={{ fontSize: 11, color: textMuted, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={11} /> {new Date(act.created_at).toLocaleString()}
                  </span>
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: textMuted }}>
                  Actor: <strong style={{ color: accent }}>{act.actor_name}</strong>
                  <span style={{ marginLeft: 6, fontSize: 11 }}>({act.actor_code})</span>
                </div>
              </div>
            </div>
          );
        }) : (
          <div style={{ padding: '40px 0', textAlign: 'center', color: textMuted, fontSize: 13 }}>No activity recorded yet</div>
        )}
      </div>
    </div>
  );
}
