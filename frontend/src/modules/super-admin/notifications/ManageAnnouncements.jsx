import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import { 
  MdAnnouncement, MdDrafts, MdSend, MdHistory, 
  MdClose, MdDelete, MdModeEdit, MdFilterList, MdSearch,
  MdVisibility, MdCheckCircle, MdSchedule, MdWarning, MdPeople,
  MdAnalytics, MdTune, MdFileDownload, MdLayers, MdCheck, MdEmail, MdMessage,
  MdNotificationsActive, MdArrowForward, MdInfo, MdRefresh
} from 'react-icons/md';

export default function ManageAnnouncements() {
  const { C } = useTheme();
  const S = makeS(C);

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [activeTab, setActiveTab] = useState('announcements'); // announcements, analytics, broadcast, templates
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [stats, setStats] = useState(null);
  const [templates, setTemplates] = useState([]);

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAudience, setFilterAudience] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
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
    schedule_option: 'now',
    scheduled_at: '',
    expiry_option: 'never',
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
    title: '',
    message: '',
    priority: 'MEDIUM'
  });
  const [broadcasting, setBroadcasting] = useState(false);

  // Load All Dynamic Data from Database REST APIs
  const loadAnnouncementsData = async () => {
    setLoading(true);
    try {
      const [annRes, statsRes, tplRes] = await Promise.all([
        api.get('/superadmin/announcements', { params: { admin: 'true' } }),
        api.get('/superadmin/announcements/stats'),
        api.get('/superadmin/notification/reports').catch(() => null)
      ]);

      if (annRes.data?.success && Array.isArray(annRes.data.data)) {
        setAnnouncements(annRes.data.data);
      }
      if (statsRes.data?.success && statsRes.data.data) {
        setStats(statsRes.data.data);
      }
      if (tplRes?.data?.data?.templates) {
        setTemplates(tplRes.data.data.templates);
      }
    } catch (e) {
      console.error('Error fetching dynamic announcement data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncementsData();
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
        loadAnnouncementsData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save announcement');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement permanently?')) return;
    try {
      const res = await api.delete(`/superadmin/announcement/${id}`);
      if (res.data?.success) {
        alert('Announcement deleted successfully!');
        loadAnnouncementsData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete announcement');
    }
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
      console.error(e);
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
        setBroadcastForm({ target_role: 'all', title: '', message: '', priority: 'MEDIUM' });
        loadAnnouncementsData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Broadcast submitted!');
    } finally {
      setBroadcasting(false);
    }
  };

  const exportReport = () => {
    const headers = ['Announcement ID,Title,Audience,Priority,Status,Reach,Views,Acknowledgements,Engagement Rate %,Published Date'];
    const rows = filteredAnnouncements.map(a => 
      `"${a.announcement_id || a.id}","${a.title.replace(/"/g, '""')}","${a.audience_type || a.target_role}","${a.priority}","${a.status}",${a.reach || 0},${a.views || 0},${a.acknowledgements || 0},${a.engagement_rate || 0}%,"${a.published_at || a.created_at || ''}"`
    );
    const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GKP_Announcements_Report_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  // Filtered Dynamic Announcements List
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
    const matchesAudience = filterAudience === 'all' || (ann.audience_type || ann.target_role || '').toLowerCase().includes(filterAudience.toLowerCase());
    const matchesPriority = filterPriority === 'all' || (ann.priority || '').toLowerCase() === filterPriority.toLowerCase();
    return matchesSearch && matchesStatus && matchesAudience && matchesPriority;
  });

  // Calculate dynamic KPIs from API stats or active array
  const totalCount = stats?.kpis?.total ?? announcements.length;
  const publishedCount = stats?.kpis?.published ?? announcements.filter(a => (a.status || '').toUpperCase() === 'PUBLISHED').length;
  const scheduledCount = stats?.kpis?.scheduled ?? announcements.filter(a => (a.status || '').toUpperCase() === 'SCHEDULED').length;
  const draftCount = stats?.kpis?.drafts ?? announcements.filter(a => (a.status || '').toUpperCase() === 'DRAFT').length;
  const totalReachSum = stats?.kpis?.total_reach ?? announcements.reduce((sum, a) => sum + (parseInt(a.reach) || 0), 0);

  // Highest performing announcement calculated dynamically
  const topPerformingAnn = (stats?.top_performing && stats.top_performing.length > 0)
    ? stats.top_performing[0]
    : [...announcements].sort((a, b) => (b.engagement_rate || 0) - (a.engagement_rate || 0))[0];

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
            <span style={{ fontSize: '12px', fontWeight: 700, background: `${C.primary}15`, color: C.primary, padding: '4px 10px', borderRadius: '20px' }}>Live Dynamic Console</span>
          </div>
          <p style={{ fontSize: '13px', color: C.textLight, margin: '6px 0 0' }}>
            Create, manage and broadcast announcements to employees, partners and teams with real-time database tracking
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button 
            onClick={loadAnnouncementsData}
            title="Refresh Dynamic Data"
            style={{ ...S.btn('outline'), display: 'flex', alignItems: 'center', gap: '6px', background: C.cardBg }}
          >
            <MdRefresh size={18} /> Refresh
          </button>

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

      {/* FILTER DRAWER */}
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

      {/* TOP DYNAMIC KPI CARDS */}
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
              <div style={{ fontSize: '24px', fontWeight: 850, margin: '4px 0 0', color: C.text }}>
                {loading ? '...' : kpi.val}
              </div>
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

      {/* TAB 1: RECENT ANNOUNCEMENTS MAIN DYNAMIC TABLE */}
      {activeTab === 'announcements' && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', gap: '24px', alignItems: 'start' }}>
          
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

            {/* Announcements Dynamic Table */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '48px', color: C.textLight }}>
                Loading dynamic announcements from database...
              </div>
            ) : filteredAnnouncements.length === 0 ? (
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
                            {ann.short_description || ann.message || ann.description}
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
                          <div style={{ fontWeight: 750, color: C.text }}>{(parseInt(ann.reach) || 0).toLocaleString()} users</div>
                          {parseFloat(ann.engagement_rate) > 0 && (
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

            {/* TOP PERFORMING ANNOUNCEMENT DYNAMIC HIGHLIGHT */}
            {topPerformingAnn && (
              <div style={{ ...S.card, padding: '20px', borderRadius: '16px', background: `linear-gradient(135deg, ${C.primary}10 0%, ${C.primary}02 100%)`, border: `1px solid ${C.primary}30` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: C.primary, textTransform: 'uppercase' }}>
                  <MdCheckCircle /> Top Performing Broadcast
                </div>
                <h4 style={{ fontSize: '14.5px', fontWeight: 800, margin: '8px 0 4px', color: C.text }}>
                  {topPerformingAnn.title}
                </h4>
                <div style={{ fontSize: '12px', color: C.textLight, marginBottom: '12px' }}>
                  Reached <strong>{(parseInt(topPerformingAnn.reach) || 0).toLocaleString()}</strong> users with <strong>{topPerformingAnn.engagement_rate || 0}%</strong> engagement.
                </div>
                <button onClick={() => open360DetailView(topPerformingAnn)} style={{ ...S.btn('outline'), width: '100%', fontSize: '12px', fontWeight: 700 }}>
                  View 360° Report
                </button>
              </div>
            )}

          </div>

        </div>
      )}

      {/* TAB 2: AUDIENCE & REACH ANALYTICS */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px' }}>
            
            {/* DYNAMIC AUDIENCE DISTRIBUTION */}
            <div style={{ ...S.card, padding: '24px', borderRadius: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px', color: C.text }}>Announcement by Audience</h3>
              <p style={{ fontSize: '12px', color: C.textLight, margin: '-10px 0 20px' }}>Live breakdown across user roles from system database</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {(stats?.audience_distribution || []).map((aud, i) => {
                  const total = stats?.kpis?.total || 1;
                  const pct = Math.round((parseInt(aud.count) / total) * 100);
                  const colors = [C.primary, '#8b5cf6', '#16a34a', '#d97706', '#dc2626'];
                  const color = colors[i % colors.length];

                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                        <span>{(aud.audience || 'ALL_USERS').replace('_', ' ')}</span>
                        <span>{aud.count} broadcasts ({pct}%)</span>
                      </div>
                      <div style={{ height: '10px', background: C.bgSecondary, borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.max(pct, 5)}%`, height: '100%', background: color, borderRadius: '6px', transition: 'width 0.4s' }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DYNAMIC PRIORITY DISTRIBUTION */}
            <div style={{ ...S.card, padding: '24px', borderRadius: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px', color: C.text }}>Announcement by Priority</h3>
              <p style={{ fontSize: '12px', color: C.textLight, margin: '-10px 0 20px' }}>Real-time database priority distribution</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {(stats?.priority_distribution || []).map((pri, i) => {
                  const total = stats?.kpis?.total || 1;
                  const pct = Math.round((parseInt(pri.count) / total) * 100);
                  const colorMap = { URGENT: '#dc2626', HIGH: '#ea580c', MEDIUM: '#0284c7', LOW: '#64748b' };
                  const color = colorMap[(pri.priority || '').toUpperCase()] || C.primary;

                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                        <span>{pri.priority} Priority</span>
                        <span>{pri.count} announcements ({pct}%)</span>
                      </div>
                      <div style={{ height: '10px', background: C.bgSecondary, borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.max(pct, 5)}%`, height: '100%', background: color, borderRadius: '6px' }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* DYNAMIC TOP PERFORMING BROADCASTS LIST */}
          <div style={{ ...S.card, padding: '24px', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px', color: C.text }}>Top Performing Announcements</h3>
            
            {(!stats?.top_performing || stats.top_performing.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '24px', color: C.textLight }}>No broadcast data available yet.</div>
            ) : (
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
                  {stats.top_performing.map((ann, idx) => (
                    <tr key={idx} style={{ borderBottom: `1px solid ${C.border}60` }}>
                      <td style={{ padding: '12px 10px', fontWeight: 700 }}>{ann.title}</td>
                      <td style={{ padding: '12px 10px' }}>{(parseInt(ann.reach) || 0).toLocaleString()}</td>
                      <td style={{ padding: '12px 10px' }}>{(parseInt(ann.views) || 0).toLocaleString()}</td>
                      <td style={{ padding: '12px 10px' }}>{(parseInt(ann.acknowledgements) || 0).toLocaleString()}</td>
                      <td style={{ padding: '12px 10px', fontWeight: 800, color: '#16a34a' }}>{ann.engagement_rate || 0}%</td>
                      <td style={{ padding: '12px 10px' }}>{getStatusBadge(ann.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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
            
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px' }}>
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
            
            {templates.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: C.textLight }}>Loading dynamic system templates...</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {templates.map((tpl, idx) => (
                  <div key={idx} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, padding: '16px', borderRadius: '12px' }}>
                    <div style={{ fontWeight: 800, fontSize: '14px', color: C.text }}>{tpl.template_name}</div>
                    <div style={{ fontSize: '11px', color: C.primary, fontWeight: 700, marginTop: '2px' }}>Channel: {tpl.channel}</div>
                    <p style={{ fontSize: '12px', color: C.textLight, marginTop: '8px' }}>{tpl.message}</p>
                  </div>
                ))}
              </div>
            )}
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
                <div style={{ fontSize: '18px', fontWeight: 850, color: C.text }}>
                  {(analyticsData?.performance?.total_targeted ?? selectedAnnouncement.reach ?? 0).toLocaleString()}
                </div>
              </div>
              <div style={{ background: C.bgSecondary, padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: C.textLight }}>Viewed</div>
                <div style={{ fontSize: '18px', fontWeight: 850, color: '#0284c7' }}>
                  {(analyticsData?.performance?.viewed ?? selectedAnnouncement.views ?? 0).toLocaleString()}
                </div>
              </div>
              <div style={{ background: C.bgSecondary, padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: C.textLight }}>Acknowledged</div>
                <div style={{ fontSize: '18px', fontWeight: 850, color: '#16a34a' }}>
                  {(analyticsData?.performance?.acknowledged ?? selectedAnnouncement.acknowledgements ?? 0).toLocaleString()}
                </div>
              </div>
              <div style={{ background: C.bgSecondary, padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: C.textLight }}>Engagement</div>
                <div style={{ fontSize: '18px', fontWeight: 850, color: '#8b5cf6' }}>
                  {analyticsData?.performance?.engagement_rate ?? selectedAnnouncement.engagement_rate ?? 0}%
                </div>
              </div>
            </div>

            {/* TIMELINE STEPS */}
            <h4 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 12px', color: C.text }}>Broadcast Audit Timeline</h4>
            {loadingAnalytics ? (
              <div style={{ padding: '12px', color: C.textLight }}>Loading audit timeline...</div>
            ) : (
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
            )}

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
