import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useTheme, makeS } from '../../contexts/ThemeContext';
import { 
  MdNotifications, MdSettings, MdAnnouncement, MdCheck, MdDelete, 
  MdSearch, MdFilterList, MdPriorityHigh, MdInfoOutline 
} from 'react-icons/md';

export default function NotificationCenter() {
  const { C } = useTheme();
  const S = makeS(C);

  const [activeTab, setActiveTab] = useState('inbox'); // inbox, announcements, preferences

  // Inbox & Pagination
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');

  // Announcements list
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);

  // Preferences configuration
  const [prefForm, setPrefForm] = useState({
    email_enabled: true,
    sms_enabled: true,
    app_enabled: true,
    marketing_enabled: true,
    commission_enabled: true,
    kyc_enabled: true,
    application_enabled: true,
    language: 'en',
    frequency: 'instant'
  });
  const [savingPrefs, setSavingPrefs] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications', {
        params: {
          page,
          limit: 10,
          unread_only: unreadOnly ? 'true' : undefined,
          category: categoryFilter || undefined,
          search: search.trim() || undefined
        }
      });
      if (res.data?.success) {
        setNotifications(res.data.data.notifications);
        setUnreadCount(res.data.data.unread_count);
        setTotalPages(res.data.data.pagination.totalPages);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    setLoadingAnnouncements(true);
    try {
      const res = await api.get('/notifications/announcements');
      if (res.data?.success) {
        setAnnouncements(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  const fetchPreferences = async () => {
    try {
      const res = await api.get('/notifications/settings');
      if (res.data?.success) {
        setPrefForm(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeTab === 'inbox') fetchNotifications();
    if (activeTab === 'announcements') fetchAnnouncements();
    if (activeTab === 'preferences') fetchPreferences();
  }, [activeTab, page, unreadOnly, categoryFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchNotifications();
  };

  const handleMarkRead = async (id) => {
    try {
      const res = await api.put('/notifications/read', { id });
      if (res.data?.success) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await api.put('/notifications/read-all');
      if (res.data?.success) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this notification permanently?')) return;
    try {
      const res = await api.delete(`/notifications/${id}`);
      if (res.data?.success) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        fetchNotifications();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setSavingPrefs(true);
    try {
      const res = await api.put('/notifications/settings', prefForm);
      if (res.data?.success) {
        alert('Communication settings saved successfully!');
      }
    } catch (e) {
      alert('Failed to save communication configurations');
    } finally {
      setSavingPrefs(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '60px' }}>
      
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: C.text, margin: 0 }}>Notification & Preferences Hub</h2>
        <p style={{ fontSize: '13px', color: C.textLight, margin: '4px 0 0' }}>Audit system notifications, read announcements, and control delivery channels</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, gap: '24px' }}>
        {[
          { id: 'inbox', label: 'Inbox Alert Queue', count: unreadCount, icon: <MdNotifications size={18} /> },
          { id: 'announcements', label: 'Official Announcements', icon: <MdAnnouncement size={18} /> },
          { id: 'preferences', label: 'Delivery Preferences', icon: <MdSettings size={18} /> }
        ].map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setPage(1); }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '12px 4px', fontSize: '14px', fontWeight: active ? 800 : 600,
                color: active ? C.primary : C.textLight,
                borderBottom: active ? `2px solid ${C.primary}` : '2px solid transparent',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              {tab.icon} {tab.label}
              {tab.count > 0 && (
                <span style={{ fontSize: '10.5px', background: C.red, color: '#fff', padding: '2px 8px', borderRadius: '12px', fontWeight: 900 }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* INBOX TAB CONTENT */}
      {activeTab === 'inbox' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Filters card */}
          <div style={{ ...S.card, padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', flex: 1 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input 
                  style={{ ...S.input, paddingLeft: '32px' }} 
                  placeholder="Search alert subject or message text..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <MdSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: C.textLight }} />
              </div>
              <button type="submit" style={S.btn('primary')}>Search</button>
            </form>

            <select 
              value={categoryFilter} 
              onChange={e => setCategoryFilter(e.target.value)} 
              style={{ ...S.input, width: 'auto', minWidth: '150px' }}
            >
              <option value="">All Categories</option>
              <option value="system">System Updates</option>
              <option value="wallet">Wallet Credits</option>
              <option value="applications">Applications Tracker</option>
              <option value="kyc">KYC verification</option>
            </select>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', userSelect: 'none' }}>
              <input type="checkbox" checked={unreadOnly} onChange={e => setUnreadOnly(e.target.checked)} />
              Unread only
            </label>

            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} style={{ ...S.btn('outline'), fontSize: '12.5px', padding: '6px 12px' }}>
                Mark All Read
              </button>
            )}
          </div>

          {/* List panel */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>Loading alerts...</div>
          ) : notifications.length === 0 ? (
            <div style={{ ...S.card, padding: '48px', textAlign: 'center', color: C.textLight }}>
              Your notification inbox is currently empty.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {notifications.map((n) => (
                <div 
                  key={n.id} 
                  style={{
                    ...S.card, padding: '16px 20px', borderRadius: '12px',
                    border: `1px solid ${n.is_read ? C.border : C.primary}`,
                    background: n.is_read ? C.bgSecondary : `${C.primary}05`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px'
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: n.priority === 'high' ? `${C.red}12` : `${C.primary}12`,
                      color: n.priority === 'high' ? C.red : C.primary,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {n.priority === 'high' ? <MdPriorityHigh size={18} /> : <MdInfoOutline size={18} />}
                    </div>
                    <div>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: C.text }}>{n.title}</span>
                        <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: `${C.border}`, color: C.textLight, textTransform: 'uppercase' }}>
                          {n.category}
                        </span>
                      </div>
                      <p style={{ fontSize: '12.5px', color: C.textMid, margin: '4px 0 0 0' }}>{n.message}</p>
                      <span style={{ fontSize: '10px', color: C.textLight, display: 'block', marginTop: '6px' }}>
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    {!n.is_read && (
                      <button 
                        onClick={() => handleMarkRead(n.id)}
                        style={{ background: 'none', border: 'none', color: C.green, cursor: 'pointer', padding: '6px' }}
                        title="Mark read"
                      >
                        <MdCheck size={20} />
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(n.id)}
                      style={{ background: 'none', border: 'none', color: C.textLight, cursor: 'pointer', padding: '6px' }}
                      title="Delete alert"
                    >
                      <MdDelete size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '10px' }}>
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={S.btn('outline')}>Previous</button>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} style={S.btn('outline')}>Next</button>
            </div>
          )}

        </div>
      )}

      {/* ANNOUNCEMENTS TAB CONTENT */}
      {activeTab === 'announcements' && (
        <div>
          {loadingAnnouncements ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>Loading announcements...</div>
          ) : announcements.length === 0 ? (
            <div style={{ ...S.card, padding: '48px', textAlign: 'center', color: C.textLight }}>
              No official announcements posted at this time.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
              {announcements.map((ann) => (
                <div key={ann.id} style={{ ...S.card, padding: '24px', borderRadius: '16px', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'stretch' }}>
                  {ann.banner_image && (
                    <div style={{ width: '100%', maxWidth: '200px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, minHeight: '120px', background: `${C.border}50` }}>
                      <img src={ann.banner_image} alt="ann-banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: 0 }}>{ann.title}</h3>
                        {ann.priority === 'urgent' && (
                          <span style={{ fontSize: '10px', fontWeight: 900, background: `${C.red}15`, color: C.red, padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                            Urgent Announcement
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '13.5px', color: C.textMid, marginTop: '8px', lineHeight: 1.5 }}>{ann.description}</p>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: `1px solid ${C.border}60`, paddingTop: '12px' }}>
                      <span style={{ fontSize: '11px', color: C.textLight }}>
                        Posted: {new Date(ann.created_at).toLocaleDateString()}
                      </span>
                      {ann.redirect_url && (
                        <a href={ann.redirect_url} target="_blank" rel="noreferrer" style={{ ...S.btn('primary'), padding: '6px 14px', fontSize: '12.5px', textDecoration: 'none' }}>
                          View Details
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PREFERENCES CONFIG TAB */}
      {activeTab === 'preferences' && (
        <div style={{ ...S.card, padding: '28px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 850, color: C.text, margin: '0 0 4px' }}>Notification & Delivery Settings</h3>
          <p style={{ fontSize: '13px', color: C.textLight, margin: '0 0 24px' }}>Specify exactly which communication channels we can use to contact you.</p>

          <form onSubmit={handleSavePreferences} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              
              {/* Channel Selectors */}
              <div style={{ background: C.bgSecondary, padding: '20px', borderRadius: '12px', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 800, color: C.text, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Channels</h4>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', cursor: 'pointer', userSelect: 'none' }}>
                  <input 
                    type="checkbox" 
                    checked={prefForm.app_enabled} 
                    onChange={e => setPrefForm({ ...prefForm, app_enabled: e.target.checked })} 
                  />
                  In-App Notification Center
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', cursor: 'pointer', userSelect: 'none' }}>
                  <input 
                    type="checkbox" 
                    checked={prefForm.email_enabled} 
                    onChange={e => setPrefForm({ ...prefForm, email_enabled: e.target.checked })} 
                  />
                  Email Delivery Alerts (AWS SES)
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', cursor: 'pointer', userSelect: 'none' }}>
                  <input 
                    type="checkbox" 
                    checked={prefForm.sms_enabled} 
                    onChange={e => setPrefForm({ ...prefForm, sms_enabled: e.target.checked })} 
                  />
                  SMS Instant Alerts (MSG91)
                </label>
              </div>

              {/* Event Triggers */}
              <div style={{ background: C.bgSecondary, padding: '20px', borderRadius: '12px', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 800, color: C.text, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Event Triggers</h4>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', cursor: 'pointer', userSelect: 'none' }}>
                  <input 
                    type="checkbox" 
                    checked={prefForm.kyc_enabled} 
                    onChange={e => setPrefForm({ ...prefForm, kyc_enabled: e.target.checked })} 
                  />
                  KYC Verification Progress
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', cursor: 'pointer', userSelect: 'none' }}>
                  <input 
                    type="checkbox" 
                    checked={prefForm.application_enabled} 
                    onChange={e => setPrefForm({ ...prefForm, application_enabled: e.target.checked })} 
                  />
                  Customer Applications Status
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', cursor: 'pointer', userSelect: 'none' }}>
                  <input 
                    type="checkbox" 
                    checked={prefForm.commission_enabled} 
                    onChange={e => setPrefForm({ ...prefForm, commission_enabled: e.target.checked })} 
                  />
                  Wallet Payouts & Commissions
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', cursor: 'pointer', userSelect: 'none' }}>
                  <input 
                    type="checkbox" 
                    checked={prefForm.marketing_enabled} 
                    onChange={e => setPrefForm({ ...prefForm, marketing_enabled: e.target.checked })} 
                  />
                  Special offers & Festival Campaigns
                </label>
              </div>

            </div>

            {/* Language & Frequency */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxWidth: '600px' }}>
              <div>
                <label style={S.label}>Preferred Language</label>
                <select style={S.input} value={prefForm.language} onChange={e => setPrefForm({ ...prefForm, language: e.target.value })}>
                  <option value="en">English</option>
                  <option value="hi">हिंदी (Hindi)</option>
                  <option value="mr">मराठी (Marathi)</option>
                  <option value="te">తెలుగు (Telugu)</option>
                </select>
              </div>
              <div>
                <label style={S.label}>Alert Frequency digest</label>
                <select style={S.input} value={prefForm.frequency} onChange={e => setPrefForm({ ...prefForm, frequency: e.target.value })}>
                  <option value="instant">Instant Real-Time Alerts</option>
                  <option value="daily">Daily Summary Digest</option>
                  <option value="weekly">Weekly Summary Digest</option>
                </select>
              </div>
            </div>

            <div style={{ borderTop: `1px solid ${C.border}80`, paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={savingPrefs} style={S.btn('primary')}>
                {savingPrefs ? 'Saving...' : 'Save Configurations'}
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}
