import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import api from '../../../services/api';
import {
  Bell, CheckCheck, Trash2, X, Clock, Zap, Wallet,
  FileText, ShieldCheck, TrendingUp, Settings, Activity, Save, RefreshCw
} from 'lucide-react';

const FILTERS = [
  { id: 'all',          label: 'All',         icon: Bell },
  { id: 'applications', label: 'Applications', icon: FileText },
  { id: 'wallet',       label: 'Wallet',       icon: Wallet },
  { id: 'commission',   label: 'Commission',   icon: TrendingUp },
  { id: 'kyc',          label: 'KYC',          icon: ShieldCheck },
  { id: 'system',       label: 'System',       icon: Zap },
];

const STATUS_FILTERS = [
  { id: 'all',    label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'read',   label: 'Read' },
];

const CAT_COLORS = {
  applications: '#6366f1',
  wallet:       '#10b981',
  commission:   '#3b82f6',
  withdrawal:   '#f59e0b',
  kyc:          '#a855f7',
  system:       '#64748b',
};

const PRIO_CONFIG = {
  urgent:      { color: '#ef4444', dot: '🔴' },
  important:   { color: '#f59e0b', dot: '🟡' },
  information: { color: '#3b82f6', dot: '🔵' },
};

function Toggle({ value, onChange, accent }) {
  return (
    <div onClick={onChange} style={{
      width: 44, height: 24, borderRadius: 99, cursor: 'pointer', position: 'relative',
      background: value ? accent : '#374151', transition: 'background 0.3s',
      boxShadow: value ? `0 0 10px ${accent}40` : 'none', flexShrink: 0
    }}>
      <div style={{
        position: 'absolute', top: 2, left: value ? 22 : 2,
        width: 20, height: 20, borderRadius: '50%', background: '#fff',
        boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
        transition: 'left 0.3s cubic-bezier(0.4,0,0.2,1)'
      }} />
    </div>
  );
}

export default function PartnerNotifications() {
  const { C, isDark } = useTheme();
  const border  = isDark ? '#1f1f1f' : C.border;
  const cardBg  = isDark ? '#0f0f0f' : '#fff';
  const pageBg  = isDark ? '#000' : C.bg;
  const text     = C.text;
  const muted    = C.textMid;
  const accent   = C.primary;

  const [view, setView]                   = useState('feed');   // feed | activity | prefs
  const [notifications, setNotifications] = useState([]);
  const [activityLogs, setActivityLogs]   = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(true);
  const [catFilter, setCatFilter]         = useState('all');
  const [statusFilter, setStatusFilter]   = useState('all');
  const [mounted, setMounted]             = useState(false);

  const [prefs, setPrefs] = useState({
    email_enabled: true, sms_enabled: true,
    wallet_notifications: true, commission_notifications: true,
    application_notifications: true, system_notifications: true,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefSaved, setPrefSaved]     = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchNotifications();
    fetchPreferences();

    const token = localStorage.getItem('token');
    if (!token) return;
    let es;
    try {
      es = new EventSource(`/api/v1/notifications/stream?token=${token}`);
      es.onmessage = (e) => {
        try {
          const p = JSON.parse(e.data);
          if (p.type === 'notification' && p.data) {
            setNotifications(prev => [p.data, ...prev]);
            if (p.unread_count !== undefined) setUnreadCount(p.unread_count);
          }
        } catch { /* silent */ }
      };
    } catch { /* silent */ }
    return () => es?.close();
  }, []);

  useEffect(() => { fetchNotifications(); }, [catFilter, statusFilter]);
  useEffect(() => { if (view === 'activity') fetchActivityLogs(); }, [view]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications', {
        params: {
          category:    catFilter !== 'all' ? catFilter : undefined,
          unread_only: statusFilter === 'unread' ? 'true' : undefined,
        }
      });
      if (res.data?.success) {
        setNotifications(res.data.data.notifications || []);
        setUnreadCount(res.data.data.unread_count || 0);
      }
    } catch { /* silent */ } finally { setLoading(false); }
  };

  const fetchActivityLogs = async () => {
    try {
      const res = await api.get('/notifications/activity');
      if (res.data?.success) setActivityLogs(res.data.data || []);
    } catch { /* silent */ }
  };

  const fetchPreferences = async () => {
    try {
      const res = await api.get('/notifications/preferences');
      if (res.data?.success && res.data.data) setPrefs(p => ({ ...p, ...res.data.data }));
    } catch { /* silent */ }
  };

  const markRead = async (id) => {
    try {
      await api.post('/notifications/read', { id, ids: [id] });
      setNotifications(p => p.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(p => Math.max(0, p - 1));
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(p => p.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  };

  const deleteOne = async (id, e) => {
    e?.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(p => {
        const t = p.find(n => n.id === id);
        if (t && !t.is_read) setUnreadCount(c => Math.max(0, c - 1));
        return p.filter(n => n.id !== id);
      });
    } catch { /* silent */ }
  };

  const clearAll = async () => {
    if (!window.confirm('Clear all notifications?')) return;
    try {
      await api.delete('/notifications/clear-all');
      setNotifications([]); setUnreadCount(0);
    } catch { /* silent */ }
  };

  const savePrefs = async (e) => {
    e.preventDefault(); setSavingPrefs(true);
    try {
      await api.put('/notifications/preferences', prefs);
      setPrefSaved(true); setTimeout(() => setPrefSaved(false), 3000);
    } catch { /* silent */ } finally { setSavingPrefs(false); }
  };

  const catColor = (cat) => CAT_COLORS[cat?.toLowerCase()] || '#64748b';

  const filtered = notifications.filter(n => {
    if (statusFilter === 'unread' && n.is_read) return false;
    if (statusFilter === 'read' && !n.is_read) return false;
    return true;
  });

  const inputStyle = {
    padding: '9px 14px', borderRadius: 12, fontSize: 12, fontWeight: 600,
    border: `1.5px solid ${border}`, background: isDark ? '#1a1a1a' : '#f8faff',
    color: text, outline: 'none'
  };

  return (
    <div style={{ minHeight: '100vh', background: pageBg, padding: '12px', transition: 'all 0.3s' }}>
      <style>{`
        @keyframes fadeUp   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer  { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes pulse    { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
        .notif-card:hover   { border-color: ${accent}40 !important; transform: translateX(2px); }
        .filter-pill:hover  { background: ${accent}20 !important; color: ${accent} !important; }
        .action-btn:hover   { background: ${isDark ? '#1f1f1f' : '#f1f5f9'} !important; }
        .del-btn:hover      { background: #ef444415 !important; color: #ef4444 !important; border-color: #ef444430 !important; }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        padding: '16px 20px', borderRadius: 18, marginBottom: 14,
        background: isDark ? 'linear-gradient(135deg,#0d0d1a,#0f0f0f)' : 'linear-gradient(135deg,#f0f4ff,#fff)',
        border: `1px solid ${border}`,
        boxShadow: isDark ? '0 8px 40px rgba(0,0,0,0.4)' : `0 4px 24px ${accent}10`,
        opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(-12px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: `${accent}15`, border: `1px solid ${accent}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={20} color={accent} />
            </div>
            {unreadCount > 0 && (
              <div style={{ position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 99, background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', animation: 'pulse 2s infinite' }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </div>
            )}
          </div>
          <div>
            <h1 style={{ fontSize: 'clamp(16px,3vw,22px)', fontWeight: 900, color: text, margin: 0 }}>Notifications</h1>
            <p style={{ fontSize: 12, color: muted, margin: '2px 0 0' }}>
              {unreadCount > 0 ? <span style={{ color: accent, fontWeight: 700 }}>{unreadCount} unread</span> : 'All caught up'} · Live stream active
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="action-btn"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: `1px solid ${border}`, background: isDark ? '#111' : '#f8faff', color: text, fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s' }}>
              <CheckCheck size={14} color={accent} /> Mark all read
            </button>
          )}
          <button onClick={clearAll} className="action-btn"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1px solid #ef444430', background: '#ef444408', color: '#ef4444', fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s' }}>
            <Trash2 size={13} /> Clear all
          </button>
        </div>
      </div>

      {/* ── View Tabs ── */}
      <div style={{ display: 'flex', gap: 6, padding: 5, background: isDark ? '#0a0a0a' : '#f1f5f9', border: `1px solid ${border}`, borderRadius: 14, marginBottom: 14 }}>
        {[
          { id: 'feed',     label: 'Feed',     icon: Bell },
          { id: 'activity', label: 'Activity', icon: Activity },
          { id: 'prefs',    label: 'Settings', icon: Settings },
        ].map(tab => {
          const Icon = tab.icon;
          const active = view === tab.id;
          return (
            <button key={tab.id} onClick={() => setView(tab.id)}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: active ? `linear-gradient(135deg,${accent},${C.primaryDark})` : 'transparent', color: active ? '#fff' : muted, boxShadow: active ? `0 3px 12px ${accent}40` : 'none', transition: 'all 0.2s' }}>
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ══════════════ FEED VIEW ══════════════ */}
      {view === 'feed' && (
        <div style={{ animation: 'fadeUp 0.3s ease' }}>

          {/* Category Pills */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4, marginBottom: 12 }}>
            {FILTERS.map(f => {
              const Icon = f.icon;
              const active = catFilter === f.id;
              const cc = CAT_COLORS[f.id] || accent;
              return (
                <button key={f.id} className="filter-pill" onClick={() => setCatFilter(f.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 99, border: `1.5px solid ${active ? cc : border}`, background: active ? cc + '15' : isDark ? '#0f0f0f' : '#fff', color: active ? cc : muted, fontWeight: 700, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s', flexShrink: 0 }}>
                  <Icon size={13} /> {f.label}
                </button>
              );
            })}
          </div>

          {/* Status Pills */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {STATUS_FILTERS.map(s => {
              const active = statusFilter === s.id;
              return (
                <button key={s.id} onClick={() => setStatusFilter(s.id)}
                  style={{ padding: '5px 14px', borderRadius: 99, border: `1.5px solid ${active ? accent : border}`, background: active ? accent + '15' : 'transparent', color: active ? accent : muted, fontWeight: 700, fontSize: 11, cursor: 'pointer', transition: 'all 0.2s' }}>
                  {s.label}
                </button>
              );
            })}
            <span style={{ marginLeft: 'auto', fontSize: 11, color: muted, alignSelf: 'center' }}>
              {filtered.length} notification{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Notification Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} style={{ height: 80, borderRadius: 14, background: isDark ? '#111' : '#f1f5f9', border: `1px solid ${border}`, animation: 'shimmer 1.5s infinite' }} />
              ))
            ) : filtered.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', background: cardBg, border: `1px solid ${border}`, borderRadius: 18 }}>
                <Bell size={36} color={muted} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <p style={{ color: muted, fontSize: 14, fontWeight: 600 }}>No notifications here</p>
                <p style={{ color: muted, fontSize: 12, marginTop: 4 }}>You're all caught up!</p>
              </div>
            ) : filtered.map((n, i) => {
              const cc = catColor(n.category);
              const pc = PRIO_CONFIG[n.priority?.toLowerCase()];
              return (
                <div key={n.id} className="notif-card"
                  onClick={() => !n.is_read && markRead(n.id)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 14,
                    padding: '14px 16px', borderRadius: 14, cursor: n.is_read ? 'default' : 'pointer',
                    background: n.is_read ? cardBg : isDark ? `${cc}08` : `${cc}06`,
                    border: `1px solid ${n.is_read ? border : cc + '30'}`,
                    borderLeft: `3px solid ${cc}`,
                    transition: 'all 0.2s',
                    animation: `fadeUp 0.3s ease ${i * 40}ms both`
                  }}>

                  {/* Icon dot */}
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: cc + '15', border: `1px solid ${cc}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    {!n.is_read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: cc, boxShadow: `0 0 6px ${cc}` }} />}
                    {n.is_read && <Bell size={14} color={cc} />}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 99, background: cc + '15', color: cc, textTransform: 'uppercase' }}>{n.category || 'System'}</span>
                      {pc && <span style={{ fontSize: 10, fontWeight: 700, color: pc.color }}>{pc.dot} {n.priority}</span>}
                      {!n.is_read && <span style={{ fontSize: 10, fontWeight: 800, color: accent, marginLeft: 'auto' }}>NEW</span>}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: text, marginBottom: 3 }}>{n.title}</div>
                    <div style={{ fontSize: 12, color: muted, lineHeight: 1.5 }}>{n.message}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 11, color: muted }}>
                      <Clock size={10} /> {new Date(n.created_at).toLocaleString()}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                    <button className="del-btn" onClick={(e) => deleteOne(n.id, e)}
                      style={{ padding: '5px 8px', borderRadius: 8, border: `1px solid ${border}`, background: 'transparent', color: muted, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center' }}>
                      <X size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════ ACTIVITY VIEW ══════════════ */}
      {view === 'activity' && (
        <div style={{ padding: '20px', borderRadius: 18, background: cardBg, border: `1px solid ${border}`, animation: 'fadeUp 0.3s ease' }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: text, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={16} color={accent} /> Activity Timeline
          </h3>

          <div style={{ position: 'relative', paddingLeft: 28 }}>
            <div style={{ position: 'absolute', left: 9, top: 0, bottom: 0, width: 2, background: isDark ? '#1f1f1f' : '#e5e7eb', borderRadius: 2 }} />
            {activityLogs.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: muted, fontSize: 13 }}>No activity logs yet</div>
            ) : activityLogs.map((act, i) => (
              <div key={act.id} style={{ position: 'relative', marginBottom: 16, animation: `fadeUp 0.3s ease ${i * 50}ms both` }}>
                <div style={{ position: 'absolute', left: -28, top: 12, width: 20, height: 20, borderRadius: '50%', background: cardBg, border: `2px solid ${accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: accent }} />
                </div>
                <div style={{ padding: '12px 14px', borderRadius: 12, background: isDark ? '#111' : '#f8faff', border: `1px solid ${border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: text }}>{act.title}</span>
                    <span style={{ fontSize: 11, color: muted, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={10} /> {new Date(act.created_at).toLocaleString()}
                    </span>
                  </div>
                  {act.description && <p style={{ fontSize: 12, color: muted, margin: '4px 0 0', lineHeight: 1.5 }}>{act.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════ PREFERENCES VIEW ══════════════ */}
      {view === 'prefs' && (
        <form onSubmit={savePrefs} style={{ padding: '20px', borderRadius: 18, background: cardBg, border: `1px solid ${border}`, animation: 'fadeUp 0.3s ease' }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: text, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={16} color={accent} /> Notification Preferences
          </h3>

          {prefSaved && (
            <div style={{ padding: '10px 14px', borderRadius: 12, background: '#10b98115', border: '1px solid #10b98130', color: '#10b981', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
              ✅ Preferences saved!
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { key: 'email_enabled',            label: 'Email Notifications',       desc: 'Receive updates via email' },
              { key: 'sms_enabled',              label: 'SMS Notifications',         desc: 'Get SMS alerts on your mobile' },
              { key: 'wallet_notifications',     label: 'Wallet & Withdrawal',       desc: 'Balance credits and payout alerts' },
              { key: 'commission_notifications', label: 'Commission Payouts',        desc: 'When commissions are released' },
              { key: 'application_notifications',label: 'Application Updates',       desc: 'Lead status changes and approvals' },
              { key: 'system_notifications',     label: 'System Announcements',      desc: 'Platform updates and notices' },
            ].map((item, i) => (
              <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: i < 5 ? `1px solid ${border}` : 'none', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: text }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>{item.desc}</div>
                </div>
                <Toggle value={!!prefs[item.key]} onChange={() => setPrefs(p => ({ ...p, [item.key]: !p[item.key] }))} accent={accent} />
              </div>
            ))}
          </div>

          <div style={{ paddingTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={savingPrefs}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg,${accent},${C.primaryDark})`, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: `0 4px 16px ${accent}40`, opacity: savingPrefs ? 0.6 : 1 }}>
              {savingPrefs ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              {savingPrefs ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
