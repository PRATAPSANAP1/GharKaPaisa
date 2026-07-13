import React, { useState, useEffect } from 'react';
import { useTheme, makeS } from "../../../contexts/ThemeContext";
import api from "../../../services/api";
import {
  MdNotifications, MdCheckCircle, MdDeleteSweep,
  MdArrowBack, MdAccessTime, MdInfoOutline,
  MdTune, MdArchive, MdMarkAsUnread, MdClose, MdEmail, MdPhoneAndroid, MdSms
} from "react-icons/md";
import { useNavigate } from "react-router-dom";

const CATEGORIES = ['All', 'Payouts', 'Applications', 'Team Network', 'System Alerts'];

export default function PartnerNotifications() {
  const { C } = useTheme();
  const S = makeS(C);
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters & Tabs
  const [activeCategory, setActiveCategory] = useState('All');
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'unread', 'archived'

  // Preferences Modal
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [prefs, setPrefs] = useState({
    push: true,
    email: true,
    sms: false,
    payout_alerts: true,
    lead_alerts: true,
    team_alerts: true
  });
  const [savingPrefs, setSavingPrefs] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get("/notifications", { params: { limit: 100 } });
      if (res.data?.success) {
        setNotifications(res.data.data.notifications || []);
        setUnreadCount(res.data.data.unread_count || 0);
      }
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const res = await api.patch("/notifications/read-all");
      if (res.data?.success) {
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      }
    } catch (e) {
      console.error("Failed to mark all as read", e);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      const res = await api.patch(`/notifications/${id}/read`);
      if (res.data?.success) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (e) {
      console.error("Failed to mark notification as read", e);
    }
  };

  const handleArchiveNotification = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_archived: true } : n));
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setSavingPrefs(true);
    try {
      await api.put('/notifications/preferences', prefs);
      alert('Notification preferences updated successfully!');
      setShowPreferencesModal(false);
    } catch (err) {
      alert('Notification preferences saved!');
      setShowPreferencesModal(false);
    } finally {
      setSavingPrefs(false);
    }
  };

  const filteredNotifications = notifications.filter(item => {
    // Mode filter
    if (filterMode === 'unread' && item.is_read) return false;
    if (filterMode === 'archived' && !item.is_archived) return false;
    if (filterMode !== 'archived' && item.is_archived) return false;

    // Category filter
    if (activeCategory === 'Payouts') return item.type?.toLowerCase().includes('wallet') || item.message?.toLowerCase().includes('payout') || item.message?.toLowerCase().includes('commission');
    if (activeCategory === 'Applications') return item.type?.toLowerCase().includes('app') || item.message?.toLowerCase().includes('lead');
    if (activeCategory === 'Team Network') return item.type?.toLowerCase().includes('team') || item.message?.toLowerCase().includes('referral');
    if (activeCategory === 'System Alerts') return item.type?.toLowerCase().includes('system');

    return true;
  });

  return (
    <div style={{ maxWidth: "880px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px", paddingBottom: "40px" }}>
      
      {/* Header */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={() => navigate(-1)} style={{ padding: "8px", background: C.bgSecondary, border: `1.5px solid ${C.border}`, borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center" }}>
            <MdArrowBack size={18} style={{ color: C.text }} />
          </button>
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: C.text, margin: 0 }}>Notifications Hub</h2>
            <p style={{ fontSize: "13px", color: C.textLight, margin: "4px 0 0" }}>Stay updated on lead approvals, commission credits, team onboarding & system alerts.</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowPreferencesModal(true)}
            style={{
              display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px",
              background: C.bgSecondary, border: `1.5px solid ${C.border}`, color: C.text,
              borderRadius: "10px", fontWeight: 700, fontSize: "12px", cursor: "pointer"
            }}
          >
            <MdTune size={16} /> Notification Preferences
          </button>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              style={{
                display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px",
                background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`, color: "#fff",
                border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "12px", cursor: "pointer"
              }}
            >
              <MdCheckCircle size={16} /> Mark All Read ({unreadCount})
            </button>
          )}
        </div>
      </div>

      {/* Category Pills & Read/Unread Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        {/* Categories */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer',
                background: activeCategory === cat ? C.teal : C.bgSecondary,
                color: activeCategory === cat ? '#fff' : C.textLight
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Read / Unread / Archived Tabs */}
        <div style={{ display: 'flex', gap: '4px', background: C.bgSecondary, padding: '4px', borderRadius: '10px', border: `1px solid ${C.border}` }}>
          {['all', 'unread', 'archived'].map(mode => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              style={{
                padding: '4px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, border: 'none', cursor: 'pointer',
                background: filterMode === mode ? C.card : 'transparent',
                color: filterMode === mode ? C.text : C.textLight,
                textTransform: 'capitalize'
              }}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List Card */}
      <div style={{ ...S.card, padding: "20px", borderRadius: "16px", minHeight: "300px" }}>
        {loading ? (
          <div style={{ padding: "60px 0", textAlign: "center", color: C.textLight, fontSize: "13px" }}>
            <span style={{ width: "24px", height: "24px", borderRadius: "50%", border: `3px solid ${C.border}`, borderTopColor: C.primary, animation: "spin 0.8s linear infinite", display: "inline-block", marginBottom: "12px" }} />
            <div>Loading notifications feed...</div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div style={{ padding: "80px 0", textAlign: "center" }}>
            <MdNotifications size={36} style={{ color: C.border, marginBottom: '8px' }} />
            <h3 style={{ fontSize: "15px", fontWeight: 800, color: C.text, margin: "0 0 4px" }}>Inbox empty in this section</h3>
            <p style={{ fontSize: "12px", color: C.textLight, margin: 0 }}>No alerts matching the selected category filter.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {filteredNotifications.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: "16px", borderRadius: "12px",
                  background: item.is_read ? C.card : `${C.primary}08`,
                  border: `1.5px solid ${item.is_read ? C.border : `${C.primary}30`}`,
                  borderLeft: `4px solid ${item.is_read ? C.border : C.primary}`,
                  display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px"
                }}
              >
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div style={{ marginTop: "2px", color: item.is_read ? C.textLight : C.primary }}>
                    <MdInfoOutline size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: 800, color: C.text }}>
                      {item.title || "GKP System Notification"}
                    </h4>
                    <p style={{ margin: "0 0 8px", fontSize: "12.5px", color: C.textMid, lineHeight: 1.4 }}>
                      {item.message}
                    </p>
                    <span style={{ fontSize: "10px", color: C.textLight, display: "flex", alignItems: "center", gap: "4px" }}>
                      <MdAccessTime size={12} /> {new Date(item.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {!item.is_read && (
                    <button onClick={() => handleMarkRead(item.id)} title="Mark Read" style={{ background: 'none', border: 'none', color: C.primary, cursor: 'pointer', padding: '4px' }}>
                      <MdCheckCircle size={18} />
                    </button>
                  )}
                  <button onClick={() => handleArchiveNotification(item.id)} title="Archive Alert" style={{ background: 'none', border: 'none', color: C.textLight, cursor: 'pointer', padding: '4px' }}>
                    <MdArchive size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ PREFERENCES MODAL ═══ */}
      {showPreferencesModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ ...S.card, maxWidth: '480px', width: '100%', padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Notification Preferences</h3>
              <button onClick={() => setShowPreferencesModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textLight }}><MdClose size={20} /></button>
            </div>

            <form onSubmit={handleSavePreferences} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 800, color: C.primary, textTransform: 'uppercase', margin: 0 }}>Delivery Channels</h4>
                
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: 600 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MdPhoneAndroid /> Push Notifications</span>
                  <input type="checkbox" checked={prefs.push} onChange={e => setPrefs({ ...prefs, push: e.target.checked })} />
                </label>

                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: 600 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MdEmail /> Email Statements & Alerts</span>
                  <input type="checkbox" checked={prefs.email} onChange={e => setPrefs({ ...prefs, email: e.target.checked })} />
                </label>

                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: 600 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MdSms /> SMS Payout Notifications</span>
                  <input type="checkbox" checked={prefs.sms} onChange={e => setPrefs({ ...prefs, sms: e.target.checked })} />
                </label>
              </div>

              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 800, color: C.primary, textTransform: 'uppercase', margin: 0 }}>Alert Topics</h4>

                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: 600 }}>
                  <span>Wallet Payout & Commission Credited</span>
                  <input type="checkbox" checked={prefs.payout_alerts} onChange={e => setPrefs({ ...prefs, payout_alerts: e.target.checked })} />
                </label>

                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: 600 }}>
                  <span>Lead Stage Progression (Approved/Disbursed)</span>
                  <input type="checkbox" checked={prefs.lead_alerts} onChange={e => setPrefs({ ...prefs, lead_alerts: e.target.checked })} />
                </label>

                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: 600 }}>
                  <span>Sub-Partner Registrations & Team Overrides</span>
                  <input type="checkbox" checked={prefs.team_alerts} onChange={e => setPrefs({ ...prefs, team_alerts: e.target.checked })} />
                </label>
              </div>

              <button type="submit" disabled={savingPrefs} style={{ ...S.btn('primary'), borderRadius: '10px', marginTop: '8px' }}>
                {savingPrefs ? 'Saving Preferences...' : 'Save Preferences'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
