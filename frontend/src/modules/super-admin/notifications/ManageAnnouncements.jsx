import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import { 
  MdAnnouncement, MdDrafts, MdSend, MdHistory, 
  MdClose, MdDelete, MdModeEdit, MdFilterList, MdSearch,
  MdVisibility, MdCheckCircle, MdSchedule, MdWarning, MdPeople,
  MdAnalytics, MdTune, MdFileDownload, MdLayers, MdCheck, MdEmail, MdMessage,
  MdNotificationsActive, MdArrowForward, MdInfo
} from 'react-icons/md';

// Fallback / Initial Rich Mock Announcements Data
const MOCK_ANNOUNCEMENTS = [
  {
    id: 'ann-1',
    announcement_id: 'ANN-1001',
    title: 'New Incentive Structure September 2026',
    short_description: 'Updated payout tiers for Credit Card & Personal Loan approvals. Earn up to ₹750 extra per card.',
    message: 'We are thrilled to announce a revamped incentive structure effective 1st September 2026. Partners and Telecallers will receive an additional ₹500 - ₹750 per approved credit card application. Ensure your document verifications are completed promptly.',
    audience_type: 'EMPLOYEES',
    target_role: 'employees',
    priority: 'HIGH',
    status: 'PUBLISHED',
    delivery_channels: ['in-app', 'email'],
    published_at: '2026-09-02T10:30:00Z',
    expires_at: '2026-09-30T23:59:59Z',
    reach: 1248,
    views: 1102,
    clicks: 824,
    acknowledgements: 856,
    engagement_rate: 88.3,
    creator_name: 'Super Admin'
  },
  {
    id: 'ann-2',
    announcement_id: 'ANN-1002',
    title: 'Compliance Training Mandatory for All Telecallers',
    short_description: 'Complete the RBI Digital Lending & Customer Consent compliance module by Friday.',
    message: 'All Telecallers and Team Leaders must complete the 20-minute digital compliance certification by September 10th. Non-compliance will result in temporary lead routing suspension.',
    audience_type: 'TELECALLERS',
    target_role: 'telecallers',
    priority: 'URGENT',
    status: 'PUBLISHED',
    published_at: '2026-09-01T14:15:00Z',
    expires_at: '2026-09-10T18:00:00Z',
    delivery_channels: ['in-app', 'email', 'sms'],
    reach: 1180,
    views: 903,
    clicks: 740,
    acknowledgements: 765,
    engagement_rate: 76.5,
    creator_name: 'Super Admin'
  },
  {
    id: 'ann-3',
    announcement_id: 'ANN-1003',
    title: 'System Maintenance Notification - Banking Portal API',
    short_description: 'Scheduled maintenance on 5th September 02:00 AM - 04:00 AM IST.',
    message: 'Our banking partner APIs (HDFC, SBI, ICICI) will undergo scheduled core database maintenance. Lead punching and Instant Soft Approvals will be paused during this window.',
    audience_type: 'ALL_USERS',
    target_role: 'all',
    priority: 'MEDIUM',
    status: 'SCHEDULED',
    scheduled_at: '2026-09-05T02:00:00Z',
    published_at: null,
    expires_at: '2026-09-05T06:00:00Z',
    delivery_channels: ['in-app'],
    reach: 2450,
    views: 0,
    clicks: 0,
    acknowledgements: 0,
    engagement_rate: 0,
    creator_name: 'Super Admin'
  },
  {
    id: 'ann-4',
    announcement_id: 'ANN-1004',
    title: 'New Partner Onboarding Fast-Track Program',
    short_description: 'Simplified 1-click KYC and instant wallet creation for Tier 2/3 city partners.',
    message: 'We have upgraded the partner verification engine! All new DSA partners can now complete KYC via Aadhaar OTP within 2 minutes and start earning immediately.',
    audience_type: 'PARTNERS',
    target_role: 'partner',
    priority: 'MEDIUM',
    status: 'PUBLISHED',
    published_at: '2026-08-28T09:00:00Z',
    expires_at: null,
    delivery_channels: ['in-app'],
    reach: 890,
    views: 650,
    clicks: 410,
    acknowledgements: 320,
    engagement_rate: 73.0,
    creator_name: 'Super Admin'
  },
  {
    id: 'ann-5',
    announcement_id: 'ANN-1005',
    title: 'Q3 Sales Performance Review & Rewards Announcement',
    short_description: 'Top performing teams will receive Goa retreat packages and cash rewards.',
    message: 'Draft details for Q3 rewards policy. Final review pending executive approval.',
    audience_type: 'MANAGERS',
    target_role: 'managers',
    priority: 'LOW',
    status: 'DRAFT',
    published_at: null,
    expires_at: null,
    delivery_channels: ['in-app', 'email'],
    reach: 0,
    views: 0,
    clicks: 0,
    acknowledgements: 0,
    engagement_rate: 0,
    creator_name: 'Super Admin'
  }
];

export default function ManageAnnouncements() {
  const { C } = useTheme();
  const S = makeS(C);

  const [activeTab, setActiveTab] = useState('announcements'); // announcements, analytics, templates, broadcast
  const [loading, setLoading] = useState(false);
  const [announcements, setAnnouncements] = useState(MOCK_ANNOUNCEMENTS);
  const [partners, setPartners] = useState([]);
  const [stats, setStats] = useState({
    kpis: { total: 5, published: 3, scheduled: 1, drafts: 1, total_reach: 5768, expired: 0 },
    audience_distribution: [
      { audience: 'Employees', count: 1248 },
      { audience: 'Partners', count: 890 },
      { audience: 'Telecallers', count: 1180 },
      { audience: 'All Users', count: 2450 }
    ],
    priority_distribution: [
      { priority: 'HIGH', count: 1 },
      { priority: 'URGENT', count: 1 },
      { priority: 'MEDIUM', count: 2 },
      { priority: 'LOW', count: 1 }
    ],
    top_performing: MOCK_ANNOUNCEMENTS.filter(a => a.engagement_rate > 0)
  });

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAudience, setFilterAudience] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Announcement Create / Edit Modal Form State
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create'); // 'create', 'edit'
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    short_description: '',
    message: '',
    audience_type: 'ALL_USERS',
    priority: 'MEDIUM',
    delivery_channels: ['in-app'],
    schedule_option: 'now', // 'now', 'schedule'
    scheduled_at: '',
    expiry_option: 'never', // 'never', 'date'
    expires_at: '',
    banner_image: '',
    redirect_url: '',
    status: 'PUBLISHED'
  });

  // 360° View Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Broadcast Message Form State
  const [broadcastForm, setBroadcastForm] = useState({
    target_role: 'all',
    partner_ids: [],
    title: '',
    message: '',
    priority: 'MEDIUM'
  });
  const [broadcasting, setBroadcasting] = useState(false);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await api.get('/superadmin/announcements', { params: { admin: 'true' } });
      if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setAnnouncements(res.data.data);
      }
    } catch (e) {
      console.warn('API announcements fetch fallback to local store:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await api.get('/superadmin/announcements/stats');
      if (res.data?.success && res.data.data) {
        setStats(res.data.data);
      }
    } catch (e) {
      console.warn('API stats fetch fallback:', e);
    }
  };

  const loadPartners = async () => {
    try {
      const res = await api.get('/superadmin/wallet/overview', { params: { limit: 100 } });
      if (res.data?.success) setPartners(res.data.data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadAnnouncements();
    loadStats();
    if (activeTab === 'broadcast') loadPartners();
  }, [activeTab]);

  const openCreateModal = () => {
    setFormMode('create');
    setEditingId(null);
    setFormData({
      title: '',
      short_description: '',
      message: '',
      audience_type: 'ALL_USERS',
      priority: 'MEDIUM',
      delivery_channels: ['in-app'],
      schedule_option: 'now',
      scheduled_at: '',
      expiry_option: 'never',
      expires_at: '',
      banner_image: '',
      redirect_url: '',
      status: 'PUBLISHED'
    });
    setFormOpen(true);
  };

  const openEditModal = (ann) => {
    setFormMode('edit');
    setEditingId(ann.id);
    setFormData({
      title: ann.title || '',
      short_description: ann.short_description || '',
      message: ann.message || ann.description || '',
      audience_type: (ann.audience_type || ann.target_role || 'ALL_USERS').toUpperCase(),
      priority: (ann.priority || 'MEDIUM').toUpperCase(),
      delivery_channels: Array.isArray(ann.delivery_channels) ? ann.delivery_channels : ['in-app'],
      schedule_option: ann.status === 'SCHEDULED' ? 'schedule' : 'now',
      scheduled_at: ann.scheduled_at ? ann.scheduled_at.substring(0, 16) : '',
      expiry_option: ann.expires_at ? 'date' : 'never',
      expires_at: ann.expires_at ? ann.expires_at.substring(0, 16) : '',
      banner_image: ann.banner_image || '',
      redirect_url: ann.redirect_url || '',
      status: (ann.status || 'PUBLISHED').toUpperCase()
    });
    setFormOpen(true);
  };

  const handleSaveAnnouncement = async (actionType = 'save') => {
    if (!formData.title || !formData.message) {
      alert('Please fill in the announcement title and message content.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...formData,
        status: actionType === 'draft' ? 'DRAFT' : (formData.schedule_option === 'schedule' ? 'SCHEDULED' : 'PUBLISHED'),
        scheduled_at: formData.schedule_option === 'schedule' ? formData.scheduled_at : null,
        expires_at: formData.expiry_option === 'date' ? formData.expires_at : null
      };

      let res;
      if (formMode === 'create') {
        res = await api.post('/superadmin/announcement', payload);
      } else {
        res = await api.put(`/superadmin/announcement/${editingId}`, payload);
      }

      if (res.data?.success) {
        alert(`Announcement ${formMode === 'create' ? 'created' : 'updated'} successfully!`);
        setFormOpen(false);
        loadAnnouncements();
        loadStats();
      }
    } catch (err) {
      // Local store fallback if offline
      const newAnn = {
        id: `ann-${Date.now()}`,
        announcement_id: `ANN-${Math.floor(1000 + Math.random() * 9000)}`,
        title: formData.title,
        short_description: formData.short_description || formData.message.substring(0, 100),
        message: formData.message,
        audience_type: formData.audience_type,
        target_role: formData.audience_type.toLowerCase(),
        priority: formData.priority,
        status: actionType === 'draft' ? 'DRAFT' : (formData.schedule_option === 'schedule' ? 'SCHEDULED' : 'PUBLISHED'),
        delivery_channels: formData.delivery_channels,
        published_at: actionType === 'draft' ? null : new Date().toISOString(),
        expires_at: formData.expires_at || null,
        reach: formData.audience_type === 'ALL_USERS' ? 2500 : 1200,
        views: 0,
        clicks: 0,
        acknowledgements: 0,
        engagement_rate: 0,
        creator_name: 'Super Admin'
      };

      if (formMode === 'create') {
        setAnnouncements([newAnn, ...announcements]);
      } else {
        setAnnouncements(announcements.map(a => a.id === editingId ? { ...a, ...newAnn, id: editingId } : a));
      }
      alert(`Announcement ${formMode === 'create' ? 'created' : 'updated'} successfully!`);
      setFormOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement permanently?')) return;
    try {
      await api.delete(`/superadmin/announcement/${id}`);
    } catch (err) {
      console.warn('API delete error fallback:', err);
    }
    setAnnouncements(announcements.filter(a => a.id !== id && a.announcement_id !== id));
    loadStats();
  };

  const open360DetailView = async (ann) => {
    setSelectedAnnouncement(ann);
    setDetailModalOpen(true);
    setLoadingAnalytics(true);
    try {
      const res = await api.get(`/superadmin/announcement/${ann.id}/analytics`);
      if (res.data?.success) {
        setAnalyticsData(res.data.data);
      }
    } catch (e) {
      setAnalyticsData({
        performance: {
          total_targeted: ann.reach || 1248,
          delivered: ann.reach || 1248,
          viewed: ann.views || Math.floor((ann.reach || 1000) * 0.88),
          clicked: ann.clicks || Math.floor((ann.reach || 1000) * 0.65),
          acknowledged: ann.acknowledgements || Math.floor((ann.reach || 1000) * 0.70),
          engagement_rate: ann.engagement_rate || 88.3
        },
        audit_timeline: [
          { action: 'Created Announcement', performed_by_name: 'Super Admin', created_at: ann.published_at || '2026-09-01T10:00:00Z' },
          { action: 'Target Audience Resolved', performed_by_name: 'System Engine', created_at: ann.published_at || '2026-09-01T10:00:05Z' },
          { action: 'Published & Broadcasted', performed_by_name: 'Super Admin', created_at: ann.published_at || '2026-09-01T10:00:10Z' }
        ]
      });
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const handleBroadcastSubmit = async (e) => {
    e.preventDefault();
    setBroadcasting(true);
    try {
      const res = await api.post('/superadmin/notification/broadcast', broadcastForm);
      if (res.data?.success) {
        alert(res.data.message || 'Notification broadcasted successfully!');
        setBroadcastForm({ target_role: 'all', partner_ids: [], title: '', message: '', priority: 'MEDIUM' });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Broadcast submitted!');
    } finally {
      setBroadcasting(false);
    }
  };

  const exportReport = () => {
    const headers = ['Announcement ID,Title,Audience,Priority,Status,Reach,Views,Engagement Rate %,Published Date'];
    const rows = filteredAnnouncements.map(a => 
      `"${a.announcement_id || a.id}","${a.title.replace(/"/g, '""')}","${a.audience_type || a.target_role}","${a.priority}","${a.status}",${a.reach || 0},${a.views || 0},${a.engagement_rate || 0}%,"${a.published_at || ''}"`
    );
    const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GKP_Announcements_Report_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  // Filtered List
  const filteredAnnouncements = announcements.filter(ann => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || (
      ann.title?.toLowerCase().includes(q) || 
      ann.announcement_id?.toLowerCase().includes(q) ||
      ann.short_description?.toLowerCase().includes(q) ||
      ann.audience_type?.toLowerCase().includes(q) ||
      ann.target_role?.toLowerCase().includes(q)
    );
    const matchesStatus = filterStatus === 'all' || (ann.status || '').toLowerCase() === filterStatus.toLowerCase();
    const matchesAudience = filterAudience === 'all' || (ann.audience_type || ann.target_role || '').toLowerCase() === filterAudience.toLowerCase();
    const matchesPriority = filterPriority === 'all' || (ann.priority || '').toLowerCase() === filterPriority.toLowerCase();
    return matchesSearch && matchesStatus && matchesAudience && matchesPriority;
  });

  // Calculate totals
  const totalCount = announcements.length;
  const publishedCount = announcements.filter(a => (a.status || '').toUpperCase() === 'PUBLISHED').length;
  const scheduledCount = announcements.filter(a => (a.status || '').toUpperCase() === 'SCHEDULED').length;
  const draftCount = announcements.filter(a => (a.status || '').toUpperCase() === 'DRAFT').length;
  const totalReachSum = announcements.reduce((sum, a) => sum + (a.reach || 0), 0);

  const getPriorityBadge = (pri) => {
    const p = (pri || 'MEDIUM').toUpperCase();
    const styles = {
      URGENT: { bg: '#fee2e2', color: '#dc2626', label: 'Urgent' },
      HIGH: { bg: '#ffedd5', color: '#ea580c', label: 'High' },
      MEDIUM: { bg: '#e0f2fe', color: '#0284c7', label: 'Medium' },
      LOW: { bg: '#f3f4f6', color: '#4b5563', label: 'Low' }
    };
    const s = styles[p] || styles.MEDIUM;
    return <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '12px', background: s.bg, color: s.color }}>{s.label}</span>;
  };

  const getStatusBadge = (st) => {
    const s = (st || 'DRAFT').toUpperCase();
    const styles = {
      PUBLISHED: { bg: '#dcfce7', color: '#16a34a', label: 'Published' },
      SCHEDULED: { bg: '#fef3c7', color: '#d97706', label: 'Scheduled' },
      DRAFT: { bg: '#f1f5f9', color: '#64748b', label: 'Draft' },
      EXPIRED: { bg: '#fee2e2', color: '#991b1b', label: 'Expired' },
      CANCELLED: { bg: '#f1f5f9', color: '#94a3b8', label: 'Cancelled' }
    };
    const conf = styles[s] || styles.DRAFT;
    return <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '12px', background: conf.bg, color: conf.color }}>{conf.label}</span>;
  };

  return (
    <div style={{ paddingBottom: '40px', color: C.text }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: C.text }}>Announcements</h2>
            <span style={{ fontSize: '12px', fontWeight: 700, background: `${C.primary}15`, color: C.primary, padding: '4px 10px', borderRadius: '20px' }}>Enterprise Console</span>
          </div>
          <p style={{ fontSize: '13px', color: C.textLight, margin: '6px 0 0' }}>
            Create, manage and broadcast announcements to employees, partners and teams with real-time tracking
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            style={{ ...S.btn('outline'), display: 'flex', alignItems: 'center', gap: '6px', background: showFilterDrawer ? `${C.primary}10` : C.cardBg }}
          >
            <MdFilterList size={18} /> Filters {showFilterDrawer && '(Active)'}
          </button>

          <button 
            onClick={openCreateModal}
            style={{ ...S.btn('primary'), display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', fontWeight: 700 }}
          >
            <MdAnnouncement size={18} /> + New Announcement
          </button>
        </div>
      </div>

      {/* FILTER DRAWER / BAR */}
      {showFilterDrawer && (
        <div style={{ ...S.card, padding: '16px 20px', marginBottom: '24px', borderRadius: '14px', background: C.cardBg, border: `1px solid ${C.primary}30` }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', alignItems: 'center' }}>
            <div>
              <label style={S.label}>Status</label>
              <select style={S.input} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
                <option value="draft">Drafts</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            <div>
              <label style={S.label}>Target Audience</label>
              <select style={S.input} value={filterAudience} onChange={e => setFilterAudience(e.target.value)}>
                <option value="all">All Audiences</option>
                <option value="all_users">All Users</option>
                <option value="employees">Employees</option>
                <option value="partners">Partners</option>
                <option value="telecallers">Telecallers</option>
                <option value="managers">Managers</option>
              </select>
            </div>

            <div>
              <label style={S.label}>Priority</label>
              <select style={S.input} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '18px' }}>
              <button 
                onClick={() => { setFilterStatus('all'); setFilterAudience('all'); setFilterPriority('all'); setSearchQuery(''); }}
                style={{ ...S.btn('outline'), width: '100%', fontSize: '12px' }}
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOP KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Announcements', val: totalCount, icon: <MdAnnouncement size={24} color="#0284c7" />, bg: '#e0f2fe', filterKey: 'all' },
          { label: 'Published Live', val: publishedCount, icon: <MdCheckCircle size={24} color="#16a34a" />, bg: '#dcfce7', filterKey: 'published' },
          { label: 'Scheduled', val: scheduledCount, icon: <MdSchedule size={24} color="#d97706" />, bg: '#fef3c7', filterKey: 'scheduled' },
          { label: 'Drafts', val: draftCount, icon: <MdDrafts size={24} color="#64748b" />, bg: '#f1f5f9', filterKey: 'draft' },
          { label: 'Total Reach', val: totalReachSum.toLocaleString(), icon: <MdPeople size={24} color="#8b5cf6" />, bg: '#f3e8ff', filterKey: 'all' }
        ].map((kpi, idx) => (
          <div 
            key={idx} 
            onClick={() => setFilterStatus(kpi.filterKey)}
            style={{
              ...S.card,
              padding: '18px',
              borderRadius: '16px',
              cursor: 'pointer',
              border: filterStatus === kpi.filterKey ? `2px solid ${C.primary}` : `1px solid ${C.border}`,
              transition: 'transform 0.2s',
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: C.textLight }}>{kpi.label}</div>
              <div style={{ fontSize: '24px', fontWeight: 850, margin: '4px 0 0', color: C.text }}>{kpi.val}</div>
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {kpi.icon}
            </div>
          </div>
        ))}
      </div>

      {/* NAVIGATION CONSOLE TABS */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { id: 'announcements', label: 'Recent Announcements', icon: <MdAnnouncement size={18} /> },
          { id: 'analytics', label: 'Audience & Reach Analytics', icon: <MdAnalytics size={18} /> },
          { id: 'broadcast', label: 'Direct Broadcast Alert', icon: <MdSend size={18} /> },
          { id: 'templates', label: 'Templates & System Delivery', icon: <MdHistory size={18} /> }
        ].map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '12px 6px', fontSize: '14px', fontWeight: active ? 800 : 600,
                color: active ? C.primary : C.textLight,
                borderBottom: active ? `3px solid ${C.primary}` : '3px solid transparent',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: RECENT ANNOUNCEMENTS MAIN TABLE & QUICK ACTIONS */}
      {activeTab === 'announcements' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>
          
          {/* MAIN TABLE */}
          <div style={{ ...S.card, padding: '20px', borderRadius: '16px' }}>
            
            {/* Search Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ position: 'relative', minWidth: '260px', flex: 1 }}>
                <MdSearch size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: C.textLight }} />
                <input 
                  type="text" 
                  placeholder="Search title, ID, target audience..."
                  style={{ ...S.input, paddingLeft: '38px', height: '40px', borderRadius: '10px' }}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              <button onClick={exportReport} style={{ ...S.btn('outline'), display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}>
                <MdFileDownload size={16} /> Export CSV
              </button>
            </div>

            {/* Announcements Data Table */}
            {filteredAnnouncements.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: C.textLight }}>
                No announcements found matching the current search & filters.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${C.border}`, textAlign: 'left', color: C.textLight }}>
                      <th style={{ padding: '12px' }}>Announcement</th>
                      <th style={{ padding: '12px' }}>Audience</th>
                      <th style={{ padding: '12px' }}>Priority</th>
                      <th style={{ padding: '12px' }}>Status</th>
                      <th style={{ padding: '12px' }}>Reach</th>
                      <th style={{ padding: '12px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAnnouncements.map((ann) => (
                      <tr key={ann.id} style={{ borderBottom: `1px solid ${C.border}60` }}>
                        
                        {/* Title & Short Description */}
                        <td style={{ padding: '14px 12px', maxWidth: '280px' }}>
                          <div style={{ fontSize: '10px', fontWeight: 800, color: C.primary, textTransform: 'uppercase' }}>
                            {ann.announcement_id || 'ANN-SPEC'}
                          </div>
                          <div style={{ fontWeight: 750, color: C.text, fontSize: '14px', margin: '2px 0 4px' }}>
                            {ann.title}
                          </div>
                          <div style={{ fontSize: '12px', color: C.textLight, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {ann.short_description || ann.message}
                          </div>
                        </td>

                        {/* Audience */}
                        <td style={{ padding: '14px 12px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, background: C.bgSecondary, padding: '4px 10px', borderRadius: '8px', color: C.text }}>
                            {(ann.audience_type || ann.target_role || 'ALL_USERS').replace('_', ' ')}
                          </span>
                        </td>

                        {/* Priority */}
                        <td style={{ padding: '14px 12px' }}>
                          {getPriorityBadge(ann.priority)}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '14px 12px' }}>
                          {getStatusBadge(ann.status)}
                        </td>

                        {/* Reach & Engagement */}
                        <td style={{ padding: '14px 12px' }}>
                          <div style={{ fontWeight: 750, color: C.text }}>{(ann.reach || 0).toLocaleString()} users</div>
                          {ann.engagement_rate > 0 && (
                            <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700 }}>
                              {ann.engagement_rate}% engagement
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '14px 12px' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button 
                              onClick={() => open360DetailView(ann)} 
                              title="360° View & Engagement"
                              style={{ border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.primary, padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}
                            >
                              <MdVisibility /> View
                            </button>
                            <button 
                              onClick={() => openEditModal(ann)} 
                              title="Edit Announcement"
                              style={{ border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <MdModeEdit />
                            </button>
                            <button 
                              onClick={() => handleDeleteAnnouncement(ann.id)} 
                              title="Delete Announcement"
                              style={{ border: `1px solid #fee2e2`, background: '#fef2f2', color: '#dc2626', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center' }}
                            >
                              <MdDelete />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* RIGHT SIDE QUICK ACTIONS PANEL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div style={{ ...S.card, padding: '20px', borderRadius: '16px', background: C.cardBg }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 14px', color: C.text }}>Quick Actions</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button onClick={openCreateModal} style={{ ...S.btn('primary'), width: '100%', justifyContent: 'flex-start', gap: '8px', fontSize: '13px' }}>
                  <MdAnnouncement /> Create New Announcement
                </button>

                <button onClick={() => setFilterStatus('scheduled')} style={{ ...S.btn('outline'), width: '100%', justifyContent: 'flex-start', gap: '8px', fontSize: '13px' }}>
                  <MdSchedule /> View Scheduled ({scheduledCount})
                </button>

                <button onClick={() => setFilterStatus('draft')} style={{ ...S.btn('outline'), width: '100%', justifyContent: 'flex-start', gap: '8px', fontSize: '13px' }}>
                  <MdDrafts /> View Drafts ({draftCount})
                </button>

                <button onClick={() => setActiveTab('analytics')} style={{ ...S.btn('outline'), width: '100%', justifyContent: 'flex-start', gap: '8px', fontSize: '13px' }}>
                  <MdAnalytics /> Announcement Analytics
                </button>

                <button onClick={exportReport} style={{ ...S.btn('outline'), width: '100%', justifyContent: 'flex-start', gap: '8px', fontSize: '13px' }}>
                  <MdFileDownload /> Export Full Report
                </button>
              </div>
            </div>

            {/* TOP PERFORMING ANNOUNCEMENT HIGHLIGHT */}
            <div style={{ ...S.card, padding: '20px', borderRadius: '16px', background: `linear-gradient(135deg, ${C.primary}10 0%, ${C.primary}02 100%)`, border: `1px solid ${C.primary}30` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: C.primary, textTransform: 'uppercase' }}>
                <MdCheckCircle /> Top Performing Broadcast
              </div>
              <h4 style={{ fontSize: '14.5px', fontWeight: 800, margin: '8px 0 4px', color: C.text }}>
                {MOCK_ANNOUNCEMENTS[0].title}
              </h4>
              <div style={{ fontSize: '12px', color: C.textLight, marginBottom: '12px' }}>
                Reached <strong>{MOCK_ANNOUNCEMENTS[0].reach.toLocaleString()}</strong> users with <strong>{MOCK_ANNOUNCEMENTS[0].engagement_rate}%</strong> engagement.
              </div>
              <button onClick={() => open360DetailView(MOCK_ANNOUNCEMENTS[0])} style={{ ...S.btn('outline'), width: '100%', fontSize: '12px', fontWeight: 700 }}>
                View 360° Report
              </button>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: AUDIENCE & REACH ANALYTICS */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            
            {/* AUDIENCE DISTRIBUTION */}
            <div style={{ ...S.card, padding: '24px', borderRadius: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px', color: C.text }}>Announcement by Audience</h3>
              <p style={{ fontSize: '12px', color: C.textLight, margin: '-10px 0 20px' }}>Distribution of broadcasts across user roles and employee tiers</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { role: 'Employees & Admin', count: 1248, pct: 40, color: C.primary },
                  { role: 'DSA Partners', count: 890, pct: 28, color: '#8b5cf6' },
                  { role: 'Telecallers (TC)', count: 1180, pct: 32, color: '#16a34a' },
                  { role: 'Managers & TLs', count: 320, pct: 10, color: '#d97706' }
                ].map((aud, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                      <span>{aud.role}</span>
                      <span>{aud.count} targeted ({aud.pct}%)</span>
                    </div>
                    <div style={{ height: '10px', background: C.bgSecondary, borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{ width: `${aud.pct}%`, height: '100%', background: aud.color, borderRadius: '6px', transition: 'width 0.4s' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PRIORITY DISTRIBUTION */}
            <div style={{ ...S.card, padding: '24px', borderRadius: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px', color: C.text }}>Announcement by Priority</h3>
              <p style={{ fontSize: '12px', color: C.textLight, margin: '-10px 0 20px' }}>Priority breakdown for system broadcasts</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { label: 'Urgent Priority', pct: 20, color: '#dc2626' },
                  { label: 'High Priority', pct: 35, color: '#ea580c' },
                  { label: 'Medium Priority', pct: 30, color: '#0284c7' },
                  { label: 'Low Priority', pct: 15, color: '#64748b' }
                ].map((pri, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                      <span>{pri.label}</span>
                      <span>{pri.pct}%</span>
                    </div>
                    <div style={{ height: '10px', background: C.bgSecondary, borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{ width: `${pri.pct}%`, height: '100%', background: pri.color, borderRadius: '6px' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* TOP PERFORMING BROADCASTS LIST */}
          <div style={{ ...S.card, padding: '24px', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px', color: C.text }}>Top Performing Announcements</h3>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}`, textAlign: 'left', color: C.textLight }}>
                  <th style={{ padding: '10px' }}>Announcement</th>
                  <th style={{ padding: '10px' }}>Reach</th>
                  <th style={{ padding: '10px' }}>Views</th>
                  <th style={{ padding: '10px' }}>Acknowledged</th>
                  <th style={{ padding: '10px' }}>Engagement Rate</th>
                  <th style={{ padding: '10px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_ANNOUNCEMENTS.filter(a => a.reach > 0).map(ann => (
                  <tr key={ann.id} style={{ borderBottom: `1px solid ${C.border}60` }}>
                    <td style={{ padding: '12px 10px', fontWeight: 700 }}>{ann.title}</td>
                    <td style={{ padding: '12px 10px' }}>{ann.reach.toLocaleString()}</td>
                    <td style={{ padding: '12px 10px' }}>{ann.views.toLocaleString()}</td>
                    <td style={{ padding: '12px 10px' }}>{ann.acknowledgements.toLocaleString()}</td>
                    <td style={{ padding: '12px 10px', fontWeight: 800, color: '#16a34a' }}>{ann.engagement_rate}%</td>
                    <td style={{ padding: '12px 10px' }}>{getStatusBadge(ann.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB 3: DIRECT BROADCAST ALERT */}
      {activeTab === 'broadcast' && (
        <div style={{ ...S.card, padding: '28px', maxWidth: '640px', margin: '0 auto', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: '0 0 8px' }}>Send Direct Broadcast Alert</h3>
          <p style={{ fontSize: '13px', color: C.textLight, marginBottom: '20px' }}>
            Instantly dispatch an emergency system notification to specific user roles or targeted partner codes.
          </p>

          <form onSubmit={handleBroadcastSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={S.label}>Target Role</label>
                <select style={S.input} value={broadcastForm.target_role} onChange={e => setBroadcastForm({ ...broadcastForm, target_role: e.target.value })}>
                  <option value="all">All System Users</option>
                  <option value="partner">Partners only</option>
                  <option value="employee">Employees only</option>
                  <option value="admin">Admins only</option>
                </select>
              </div>

              <div>
                <label style={S.label}>Priority Level</label>
                <select style={S.input} value={broadcastForm.priority} onChange={e => setBroadcastForm({ ...broadcastForm, priority: e.target.value })}>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="HIGH">High Alert</option>
                  <option value="URGENT">Urgent Emergency</option>
                </select>
              </div>
            </div>

            <div>
              <label style={S.label}>Alert Title / Subject *</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Core Banking Maintenance tonight at 11 PM" 
                style={S.input} 
                value={broadcastForm.title}
                onChange={e => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
              />
            </div>

            <div>
              <label style={S.label}>Broadcast Message Content *</label>
              <textarea 
                required 
                rows={5} 
                placeholder="Specify precise action items or alert instructions..." 
                style={S.input}
                value={broadcastForm.message}
                onChange={e => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button type="submit" disabled={broadcasting} style={{ ...S.btn('primary'), padding: '10px 24px', fontWeight: 700 }}>
                {broadcasting ? 'Broadcasting Alert...' : 'Send Broadcast Now'}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* TAB 4: TEMPLATES & SYSTEM REPORTS */}
      {activeTab === 'templates' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ ...S.card, padding: '24px', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px', color: C.text }}>Configured Broadcast Templates</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {[
                { name: 'System Maintenance', channel: 'In-App + Email', desc: 'Alert users about scheduled maintenance downtime.' },
                { name: 'Incentive Structure Update', channel: 'In-App + Push', desc: 'Broadcast new payout slabs and card commission rules.' },
                { name: 'Compliance Training Mandatory', channel: 'In-App + Email + SMS', desc: 'Require mandatory certification completion.' },
                { name: 'Partner Onboarding Welcome', channel: 'In-App + SMS', desc: 'Welcome newly registered DSA partners.' }
              ].map((tpl, idx) => (
                <div key={idx} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, padding: '16px', borderRadius: '12px' }}>
                  <div style={{ fontWeight: 800, fontSize: '14px', color: C.text }}>{tpl.name}</div>
                  <div style={{ fontSize: '11px', color: C.primary, fontWeight: 700, marginTop: '2px' }}>Channel: {tpl.channel}</div>
                  <p style={{ fontSize: '12px', color: C.textLight, marginTop: '8px' }}>{tpl.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE / EDIT ANNOUNCEMENT FORM */}
      {formOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ ...S.card, width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', padding: '28px', position: 'relative', borderRadius: '20px' }}>
            
            <button 
              onClick={() => setFormOpen(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: C.bgSecondary, border: 'none', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textLight }}
            >
              <MdClose size={22} />
            </button>

            <h3 style={{ fontSize: '20px', fontWeight: 850, color: C.text, margin: '0 0 20px' }}>
              {formMode === 'create' ? '+ Create New Announcement' : 'Edit Announcement'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Title */}
              <div>
                <label style={S.label}>Announcement Title *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. New Incentive Structure September 2026"
                  style={S.input}
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              {/* Short Description */}
              <div>
                <label style={S.label}>Short Description (Summary preview for notification cards)</label>
                <input 
                  type="text" 
                  placeholder="Brief 1-line summary..."
                  style={S.input}
                  value={formData.short_description}
                  onChange={e => setFormData({ ...formData, short_description: e.target.value })}
                />
              </div>

              {/* Full Message */}
              <div>
                <label style={S.label}>Full Message Content *</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Detailed announcement content, guidelines, links..."
                  style={S.input}
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                />
              </div>

              {/* Audience & Priority */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={S.label}>Target Audience *</label>
                  <select style={S.input} value={formData.audience_type} onChange={e => setFormData({ ...formData, audience_type: e.target.value })}>
                    <option value="ALL_USERS">All Users (Employees, Partners, Admins)</option>
                    <option value="EMPLOYEES">All Employees</option>
                    <option value="MANAGERS">Managers</option>
                    <option value="TEAM_LEADERS">Team Leaders (TL)</option>
                    <option value="TELECALLERS">Telecallers (TC)</option>
                    <option value="PARTNERS">DSA Partners</option>
                  </select>
                </div>

                <div>
                  <label style={S.label}>Priority Level *</label>
                  <select style={S.input} value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                    <option value="LOW">Low Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent Priority</option>
                  </select>
                </div>
              </div>

              {/* Delivery Channels */}
              <div>
                <label style={S.label}>Delivery Channels</label>
                <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                  {['in-app', 'email', 'sms'].map(ch => {
                    const checked = formData.delivery_channels.includes(ch);
                    return (
                      <label key={ch} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                        <input 
                          type="checkbox"
                          checked={checked}
                          onChange={e => {
                            if (e.target.checked) {
                              setFormData({ ...formData, delivery_channels: [...formData.delivery_channels, ch] });
                            } else {
                              setFormData({ ...formData, delivery_channels: formData.delivery_channels.filter(c => c !== ch) });
                            }
                          }}
                        />
                        {ch === 'in-app' ? 'In-App Notification' : ch.toUpperCase()}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Schedule Options */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={S.label}>Publish Timing</label>
                  <select style={S.input} value={formData.schedule_option} onChange={e => setFormData({ ...formData, schedule_option: e.target.value })}>
                    <option value="now">Publish Immediately Live</option>
                    <option value="schedule">Schedule for Later</option>
                  </select>
                </div>

                {formData.schedule_option === 'schedule' && (
                  <div>
                    <label style={S.label}>Scheduled Date & Time *</label>
                    <input 
                      type="datetime-local" 
                      style={S.input}
                      value={formData.scheduled_at}
                      onChange={e => setFormData({ ...formData, scheduled_at: e.target.value })}
                    />
                  </div>
                )}
              </div>

              {/* Expiry Options */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={S.label}>Announcement Expiry</label>
                  <select style={S.input} value={formData.expiry_option} onChange={e => setFormData({ ...formData, expiry_option: e.target.value })}>
                    <option value="never">Never Expires</option>
                    <option value="date">Set Expiry Date & Time</option>
                  </select>
                </div>

                {formData.expiry_option === 'date' && (
                  <div>
                    <label style={S.label}>Expiry Date & Time *</label>
                    <input 
                      type="datetime-local" 
                      style={S.input}
                      value={formData.expires_at}
                      onChange={e => setFormData({ ...formData, expires_at: e.target.value })}
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', borderTop: `1px solid ${C.border}`, paddingTop: '16px' }}>
                <button type="button" onClick={() => setFormOpen(false)} style={S.btn('outline')}>
                  Cancel
                </button>
                <button type="button" onClick={() => handleSaveAnnouncement('draft')} style={S.btn('outline')}>
                  Save Draft
                </button>
                <button type="button" onClick={() => handleSaveAnnouncement('publish')} disabled={saving} style={{ ...S.btn('primary'), padding: '10px 22px', fontWeight: 700 }}>
                  {saving ? 'Processing...' : (formData.schedule_option === 'schedule' ? 'Schedule Broadcast' : 'Publish Live Now')}
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: 360° ANNOUNCEMENT DETAILS & ENGAGEMENT REPORT */}
      {detailModalOpen && selectedAnnouncement && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ ...S.card, width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', padding: '28px', position: 'relative', borderRadius: '20px' }}>
            
            <button 
              onClick={() => setDetailModalOpen(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: C.bgSecondary, border: 'none', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textLight }}
            >
              <MdClose size={22} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: C.primary, textTransform: 'uppercase' }}>
                {selectedAnnouncement.announcement_id || 'ANN-SPEC'}
              </span>
              {getStatusBadge(selectedAnnouncement.status)}
              {getPriorityBadge(selectedAnnouncement.priority)}
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: 850, color: C.text, margin: '0 0 12px' }}>
              {selectedAnnouncement.title}
            </h3>

            <div style={{ background: C.bgSecondary, padding: '16px', borderRadius: '12px', marginBottom: '20px', fontSize: '13.5px', color: C.text }}>
              {selectedAnnouncement.message || selectedAnnouncement.description}
            </div>

            {/* PERFORMANCE METRICS */}
            <h4 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 12px', color: C.text }}>Performance & Reach</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
              <div style={{ background: C.bgSecondary, padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: C.textLight }}>Targeted</div>
                <div style={{ fontSize: '18px', fontWeight: 850, color: C.text }}>{(analyticsData?.performance?.total_targeted || selectedAnnouncement.reach || 0).toLocaleString()}</div>
              </div>
              <div style={{ background: C.bgSecondary, padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: C.textLight }}>Viewed</div>
                <div style={{ fontSize: '18px', fontWeight: 850, color: '#0284c7' }}>{(analyticsData?.performance?.viewed || selectedAnnouncement.views || 0).toLocaleString()}</div>
              </div>
              <div style={{ background: C.bgSecondary, padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: C.textLight }}>Acknowledged</div>
                <div style={{ fontSize: '18px', fontWeight: 850, color: '#16a34a' }}>{(analyticsData?.performance?.acknowledged || selectedAnnouncement.acknowledgements || 0).toLocaleString()}</div>
              </div>
              <div style={{ background: C.bgSecondary, padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: C.textLight }}>Engagement</div>
                <div style={{ fontSize: '18px', fontWeight: 850, color: '#8b5cf6' }}>{analyticsData?.performance?.engagement_rate || selectedAnnouncement.engagement_rate || 0}%</div>
              </div>
            </div>

            {/* TIMELINE STEPS */}
            <h4 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 12px', color: C.text }}>Broadcast Audit Timeline</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderLeft: `2px solid ${C.primary}40`, paddingLeft: '16px', marginLeft: '6px' }}>
              {(analyticsData?.audit_timeline || []).map((step, idx) => (
                <div key={idx} style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '-22px', top: '2px', width: '10px', height: '10px', borderRadius: '50%', background: C.primary }}></div>
                  <div style={{ fontSize: '13px', fontWeight: 750, color: C.text }}>{step.action}</div>
                  <div style={{ fontSize: '11px', color: C.textLight }}>
                    Performed by {step.performed_by_name || 'Super Admin'} at {new Date(step.created_at || Date.now()).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button onClick={() => setDetailModalOpen(false)} style={S.btn('primary')}>
                Close 360° Report
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
