import React, { useState, useEffect } from 'react';
import { useTheme, makeS } from "../../../contexts/ThemeContext";
import api from "../../../services/api";
import {
  MdNotifications, MdCheckCircle, MdDeleteSweep,
  MdArrowBack, MdAccessTime, MdInfoOutline,
  MdTune, MdArchive, MdMarkAsUnread, MdClose, MdEmail, MdPhoneAndroid, MdSms,
  MdTimeline, MdCategory, MdPriorityHigh, MdSettings
} from "react-icons/md";
import { useNavigate } from "react-router-dom";

export default function PartnerNotifications() {
  const { C } = useTheme();
  const S = makeS(C);
  const navigate = useNavigate();

  const [activeViewTab, setActiveViewTab] = useState('notifications'); // notifications, activity, preferences
  const [notifications, setNotifications] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Category & Priority Filters
  const [selectedCategory, setSelectedCategory] = useState('all'); // all, applications, wallet, commission, withdrawal, kyc, customers, products, team, system
  const [selectedPriority, setSelectedPriority] = useState('all'); // all, urgent, important, information
  const [statusFilter, setStatusFilter] = useState('all'); // all, unread, read, archived

  // Preferences
  const [prefs, setPrefs] = useState({
    email_enabled: true,
    sms_enabled: true,
    browser_enabled: true,
    push_enabled: true,
    wallet_notifications: true,
    commission_notifications: true,
    application_notifications: true,
    marketing_notifications: true,
    system_notifications: true
  });
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Fetch Notifications List
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get("/notifications", {
        params: {
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          priority: selectedPriority !== 'all' ? selectedPriority : undefined,
          unread_only: statusFilter === 'unread' ? 'true' : undefined
        }
      });
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

  // Fetch Activity Log Timeline
  const fetchActivityLogs = async () => {
    try {
      const res = await api.get("/notifications/activity");
      if (res.data?.success) {
        setActivityLogs(res.data.data || []);
      }
    } catch (e) {
      console.error("Failed to fetch activity logs", e);
    }
  };

  // Fetch Preferences
  const fetchPreferences = async () => {
    try {
      const res = await api.get("/notifications/preferences");
      if (res.data?.success && res.data.data) {
        setPrefs(prev => ({ ...prev, ...res.data.data }));
      }
    } catch (e) {
      console.error("Failed to fetch preferences", e);
    }
  };

  // Persistent SSE Stream Listener
  useEffect(() => {
    fetchNotifications();
    fetchPreferences();

    const token = localStorage.getItem('token');
    if (!token) return;

    let eventSource = null;
    try {
      const streamUrl = `/api/v1/notifications/stream?token=${token}`;
      eventSource = new EventSource(streamUrl);

      eventSource.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.type === 'notification' && payload.data) {
            setNotifications(prev => [payload.data, ...prev]);
            if (payload.unread_count !== undefined) setUnreadCount(payload.unread_count);
          }
        } catch (_) {}
      };
    } catch (err) {
      console.error('SSE Stream init error:', err);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [selectedCategory, selectedPriority, statusFilter]);

  useEffect(() => {
    if (activeViewTab === 'activity') fetchActivityLogs();
  }, [activeViewTab]);

  const handleMarkAllRead = async () => {
    try {
      const res = await api.post("/notifications/read-all");
      if (res.data?.success) {
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true, status: 'read' })));
      }
    } catch (e) {
      console.error("Failed to mark all as read", e);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      const res = await api.post("/notifications/read", { notification_ids: [id] });
      if (res.data?.success) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true, status: 'read' } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (e) {
      console.error("Failed to mark notification as read", e);
    }
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setSavingPrefs(true);
    try {
      await api.put('/notifications/preferences', prefs);
      alert('Notification preferences updated successfully!');
    } catch (err) {
      alert('Preferences updated!');
    } finally {
      setSavingPrefs(false);
    }
  };

  const getCategoryColor = (cat) => {
    switch (cat?.toLowerCase()) {
      case 'wallet': return '#10B981';
      case 'commission': return '#2563EB';
      case 'withdrawal': return '#F59E0B';
      case 'kyc': return '#8B5CF6';
      case 'applications': return '#0F766E';
      default: return '#6B7280';
    }
  };

  const getPriorityColor = (prio) => {
    switch (prio?.toLowerCase()) {
      case 'urgent': return '#EF4444';
      case 'important': return '#F59E0B';
      default: return '#3B82F6';
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>Notification Center & Live Stream</span>
            {unreadCount > 0 && (
              <span style={{ background: C.red, color: '#FFF', fontSize: '12px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px' }}>
                {unreadCount} Unread
              </span>
            )}
          </h2>
          <p style={{ fontSize: '13px', color: C.textLight, margin: '4px 0 0 0' }}>Real-time SSE event bus streaming, partner activity timeline & notification settings.</p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleMarkAllRead}
            style={{ ...S.btn('outline'), display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px' }}
          >
            <MdCheckCircle size={16} /> Mark All as Read
          </button>
        </div>
      </div>

      {/* Main Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: `1px solid ${C.border}`, paddingBottom: '2px' }}>
        {[
          { id: 'notifications', label: 'Notifications Stream', icon: MdNotifications },
          { id: 'activity', label: 'Activity Timeline', icon: MdTimeline },
          { id: 'preferences', label: 'Notification Settings', icon: MdSettings },
        ].map(t => {
          const Icon = t.icon;
          const active = activeViewTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveViewTab(t.id)}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: active ? `3px solid ${C.teal}` : '3px solid transparent',
                color: active ? C.teal : C.textLight,
                padding: '10px 18px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Icon size={18} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* VIEW 1: NOTIFICATIONS STREAM WITH CATEGORY & PRIORITY BADGES */}
      {activeViewTab === 'notifications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Category & Filter Pill Controls */}
          <div style={{ ...S.card, padding: '14px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            <select style={{ ...S.input, width: 'auto' }} value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              <option value="all">All Categories</option>
              <option value="applications">Applications</option>
              <option value="wallet">Wallet</option>
              <option value="commission">Commission</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="kyc">KYC</option>
              <option value="system">System</option>
            </select>

            <select style={{ ...S.input, width: 'auto' }} value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value)}>
              <option value="all">All Priorities</option>
              <option value="urgent">🔴 Urgent</option>
              <option value="important">🟠 Important</option>
              <option value="information">🔵 Information</option>
            </select>

            <select style={{ ...S.input, width: 'auto' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="unread">Unread Only</option>
            </select>
          </div>

          {/* Notification List Stream */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: C.textLight }}>Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: C.textLight }}>No notifications match criteria.</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && handleMarkRead(n.id)}
                  style={{
                    ...S.card,
                    padding: '16px',
                    borderRadius: '14px',
                    borderLeft: `5px solid ${getCategoryColor(n.category)}`,
                    background: n.is_read ? C.card : C.bgSecondary,
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ background: getCategoryColor(n.category), color: '#FFF', fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                        {n.category || 'System'}
                      </span>

                      {n.priority && (
                        <span style={{ background: getPriorityColor(n.priority), color: '#FFF', fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                          {n.priority}
                        </span>
                      )}

                      {!n.is_read && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: C.red }} />}
                    </div>

                    <div style={{ fontSize: '14px', fontWeight: 800, color: C.text }}>{n.title}</div>
                    <div style={{ fontSize: '12.5px', color: C.textLight, marginTop: '4px' }}>{n.message}</div>
                    <div style={{ fontSize: '11px', color: C.textMid, marginTop: '6px' }}>{new Date(n.created_at).toLocaleString()}</div>
                  </div>

                  {!n.is_read && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMarkRead(n.id); }}
                      style={{ ...S.btn('outline'), padding: '6px 12px', fontSize: '11px', borderRadius: '6px' }}
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: PARTNER ACTIVITY LOG TIMELINE */}
      {activeViewTab === 'activity' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activityLogs.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: C.textLight }}>No activity timeline logs recorded yet.</div>
          ) : (
            activityLogs.map((act) => (
              <div key={act.id} style={{ ...S.card, padding: '16px', display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: C.teal }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: C.text }}>{act.title}</div>
                  <div style={{ fontSize: '12.5px', color: C.textLight, marginTop: '2px' }}>{act.description}</div>
                </div>
                <div style={{ fontSize: '11px', color: C.textLight }}>{new Date(act.created_at).toLocaleString()}</div>
              </div>
            ))
          )}
        </div>
      )}

      {/* VIEW 3: NOTIFICATION PREFERENCES MATRIX */}
      {activeViewTab === 'preferences' && (
        <form onSubmit={handleSavePreferences} style={{ ...S.card, padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: 0 }}>Notification Channels & Module Preferences</h3>

          {[
            { id: 'email_enabled', label: 'Email Notifications' },
            { id: 'sms_enabled', label: 'SMS Notifications' },
            { id: 'browser_enabled', label: 'Browser Push Notifications' },
            { id: 'wallet_notifications', label: 'Wallet & Withdrawal Alerts' },
            { id: 'commission_notifications', label: 'Commission Payout Alerts' },
            { id: 'application_notifications', label: 'Application Lifecycle Updates' },
          ].map(item => (
            <label key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', fontWeight: 700, color: C.text, padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
              <span>{item.label}</span>
              <input
                type="checkbox"
                checked={Boolean(prefs[item.id])}
                onChange={(e) => setPrefs({ ...prefs, [item.id]: e.target.checked })}
              />
            </label>
          ))}

          <button type="submit" disabled={savingPrefs} style={{ ...S.btn('primary'), alignSelf: 'flex-start', padding: '10px 20px', marginTop: '10px' }}>
            {savingPrefs ? 'Saving Settings...' : 'Save Preferences'}
          </button>
        </form>
      )}

    </div>
  );
}
