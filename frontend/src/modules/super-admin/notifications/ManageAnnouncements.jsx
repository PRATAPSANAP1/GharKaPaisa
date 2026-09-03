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

// Static Announcements as requested by the user
const STATIC_ANNOUNCEMENTS = [
  {
    id: 'ann-1005',
    announcement_id: 'ANN-1005',
    title: 'Q3 Sales Performance Review & Rewards Announcement',
    short_description: 'Top performing teams will receive Goa retreat packages and cash rewards.',
    message: 'Top performing teams will receive Goa retreat packages and cash rewards.',
    audience_type: 'MANAGERS',
    priority: 'Low',
    status: 'Draft',
    reach: 0,
    views: 0,
    acknowledgements: 0,
    engagement_rate: 0,
    created_at: '2026-09-03T10:00:00Z'
  },
  {
    id: 'ann-1004',
    announcement_id: 'ANN-1004',
    title: 'New Partner Onboarding Fast-Track Program',
    short_description: 'Simplified 1-click KYC and instant wallet creation for Tier 2/3 city partners.',
    message: 'Simplified 1-click KYC and instant wallet creation for Tier 2/3 city partners.',
    audience_type: 'PARTNERS',
    priority: 'Medium',
    status: 'Published',
    reach: 121,
    views: 61,
    acknowledgements: 40,
    engagement_rate: 50.4,
    created_at: '2026-09-02T14:30:00Z'
  },
  {
    id: 'ann-1003',
    announcement_id: 'ANN-1003',
    title: 'System Maintenance Notification - Banking Portal API',
    short_description: 'Scheduled maintenance on 5th September 02:00 AM - 04:00 AM IST.',
    message: 'Scheduled maintenance on 5th September 02:00 AM - 04:00 AM IST.',
    audience_type: 'ALL USERS',
    priority: 'Medium',
    status: 'Scheduled',
    reach: 0,
    views: 0,
    acknowledgements: 0,
    engagement_rate: 0,
    created_at: '2026-09-02T11:00:00Z'
  },
  {
    id: 'ann-1002',
    announcement_id: 'ANN-1002',
    title: 'Compliance Training Mandatory for All Telecallers',
    short_description: 'Complete the RBI Digital Lending & Customer Consent compliance module by Friday.',
    message: 'Complete the RBI Digital Lending & Customer Consent compliance module by Friday.',
    audience_type: 'TELECALLERS',
    priority: 'Urgent',
    status: 'Published',
    reach: 121,
    views: 61,
    acknowledgements: 40,
    engagement_rate: 50.4,
    created_at: '2026-09-01T16:00:00Z'
  },
  {
    id: 'ann-1001',
    announcement_id: 'ANN-1001',
    title: 'New Incentive Structure September 2026',
    short_description: 'Updated payout tiers for Credit Card & Personal Loan approvals. Earn up to ₹750 extra per card.',
    message: 'Updated payout tiers for Credit Card & Personal Loan approvals. Earn up to ₹750 extra per card.',
    audience_type: 'EMPLOYEES',
    priority: 'High',
    status: 'Published',
    reach: 121,
    views: 61,
    acknowledgements: 40,
    engagement_rate: 50.4,
    created_at: '2026-09-01T09:00:00Z'
  }
];

export default function ManageAnnouncements() {
  const { C } = useTheme();
  const S = makeS(C);

  const [activeTab, setActiveTab] = useState('announcements'); // announcements, analytics, broadcast, templates
  const [loading, setLoading] = useState(false);
  const [announcements, setAnnouncements] = useState(STATIC_ANNOUNCEMENTS);
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
    audience_type: 'ALL USERS',
    priority: 'Medium',
    delivery_channels: ['in-app'],
    schedule_option: 'now',
    scheduled_at: '',
    expiry_option: 'never',
    expires_at: '',
    banner_image: '',
    redirect_url: '',
    status: 'Published'
  });

  // 360° View Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  // Broadcast Message Form State
  const [broadcastForm, setBroadcastForm] = useState({
    target_role: 'all',
    title: '',
    message: '',
    priority: 'Medium'
  });
  const [broadcasting, setBroadcasting] = useState(false);

  const openCreateModal = () => {
    setFormMode('create');
    setEditingId(null);
    setFormData({
      title: '',
      short_description: '',
      message: '',
      audience_type: 'ALL USERS',
      priority: 'Medium',
      delivery_channels: ['in-app'],
      schedule_option: 'now',
      scheduled_at: '',
      expiry_option: 'never',
      expires_at: '',
      banner_image: '',
      redirect_url: '',
      status: 'Published'
    });
    setFormOpen(true);
  };

  const openEditModal = (ann) => {
    setFormMode('edit');
    setEditingId(ann.id);
    setFormData({
      title: ann.title || '',
      short_description: ann.short_description || '',
      message: ann.message || ann.short_description || '',
      audience_type: ann.audience_type || 'ALL USERS',
      priority: ann.priority || 'Medium',
      delivery_channels: ['in-app'],
      schedule_option: ann.status === 'Scheduled' ? 'schedule' : 'now',
      scheduled_at: '',
      expiry_option: 'never',
      expires_at: '',
      banner_image: '',
      redirect_url: '',
      status: ann.status || 'Published'
    });
    setFormOpen(true);
  };

  const handleSaveAnnouncement = (actionType = 'save') => {
    if (!formData.title || !formData.message) {
      alert('Please fill in the announcement title and message content.');
      return;
    }
    setSaving(true);
    const newStatus = actionType === 'draft' ? 'Draft' : (formData.schedule_option === 'schedule' ? 'Scheduled' : 'Published');
    const newAnn = {
      id: formMode === 'create' ? `ann-${Date.now()}` : editingId,
      announcement_id: formMode === 'create' ? `ANN-100${announcements.length + 1}` : (editingId ? editingId.toUpperCase() : 'ANN-1006'),
      title: formData.title,
      short_description: formData.short_description || formData.message,
      message: formData.message,
      audience_type: formData.audience_type,
      priority: formData.priority,
      status: newStatus,
      reach: newStatus === 'Published' ? 121 : 0,
      views: newStatus === 'Published' ? 61 : 0,
      acknowledgements: newStatus === 'Published' ? 40 : 0,
      engagement_rate: newStatus === 'Published' ? 50.4 : 0,
      created_at: new Date().toISOString()
    };

    if (formMode === 'create') {
      setAnnouncements([newAnn, ...announcements]);
    } else {
      setAnnouncements(announcements.map(a => a.id === editingId ? newAnn : a));
    }

    setTimeout(() => {
      setSaving(false);
      setFormOpen(false);
      alert(`Announcement ${formMode === 'create' ? 'created' : 'updated'} successfully!`);
    }, 300);
  };

  const handleDeleteAnnouncement = (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    setAnnouncements(announcements.filter(a => a.id !== id));
  };

  const open360DetailView = (ann) => {
    setSelectedAnnouncement(ann);
    setDetailModalOpen(true);
  };

  const handleBroadcastSubmit = (e) => {
    e.preventDefault();
    setBroadcasting(true);
    setTimeout(() => {
      setBroadcasting(false);
      alert('Notification broadcasted successfully!');
      setBroadcastForm({ target_role: 'all', title: '', message: '', priority: 'Medium' });
    }, 400);
  };

  const exportReport = () => {
    const headers = ['Announcement ID,Title,Audience,Priority,Status,Reach,Views,Acknowledgements,Engagement Rate %,Published Date'];
    const rows = filteredAnnouncements.map(a => 
      `"${a.announcement_id || a.id}","${a.title.replace(/"/g, '""')}","${a.audience_type}","${a.priority}","${a.status}",${a.reach || 0},${a.views || 0},${a.acknowledgements || 0},${a.engagement_rate || 0}%,"${a.created_at || ''}"`
    );
    const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GKP_Announcements_Report_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  // Filtered Announcements List
  const filteredAnnouncements = announcements.filter(ann => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || (
      ann.title?.toLowerCase().includes(q) || 
      ann.announcement_id?.toLowerCase().includes(q) ||
      ann.short_description?.toLowerCase().includes(q) ||
      ann.audience_type?.toLowerCase().includes(q)
    );
    const matchesStatus = filterStatus === 'all' || ann.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesAudience = filterAudience === 'all' || ann.audience_type.toLowerCase().includes(filterAudience.toLowerCase());
    const matchesPriority = filterPriority === 'all' || ann.priority.toLowerCase() === filterPriority.toLowerCase();
    return matchesSearch && matchesStatus && matchesAudience && matchesPriority;
  });

  // Calculate KPIs
  const totalCount = announcements.length;
  const publishedCount = announcements.filter(a => a.status === 'Published').length;
  const scheduledCount = announcements.filter(a => a.status === 'Scheduled').length;
  const draftCount = announcements.filter(a => a.status === 'Draft').length;
  const totalReachSum = announcements.reduce((sum, a) => sum + (parseInt(a.reach) || 0), 0);

  const getPriorityBadge = (pri) => {
    const p = (pri || 'Medium').toLowerCase();
    const styles = {
      urgent: { bg: '#fee2e2', color: '#dc2626', label: 'Urgent' },
      high: { bg: '#ffedd5', color: '#ea580c', label: 'High' },
      medium: { bg: '#e0f2fe', color: '#0284c7', label: 'Medium' },
      low: { bg: '#f3f4f6', color: '#4b5563', label: 'Low' }
    };
    const s = styles[p] || styles.medium;
    return <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '12px', background: s.bg, color: s.color }}>{s.label}</span>;
  };

  const getStatusBadge = (st) => {
    const s = (st || 'Draft').toLowerCase();
    const styles = {
      published: { bg: '#dcfce7', color: '#16a34a', label: 'Published' },
      scheduled: { bg: '#fef3c7', color: '#d97706', label: 'Scheduled' },
      draft: { bg: '#f1f5f9', color: '#64748b', label: 'Draft' },
      expired: { bg: '#fee2e2', color: '#991b1b', label: 'Expired' }
    };
    const conf = styles[s] || styles.draft;
    return <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '12px', background: conf.bg, color: conf.color }}>{conf.label}</span>;
  };

  return (
    <div style={{ paddingBottom: '40px', color: C.text }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: C.text }}>Announcements</h2>
          </div>
          <p style={{ fontSize: '13px', color: C.textLight, margin: '6px 0 0' }}>
            Create, manage and broadcast announcements to employees, partners and teams
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
                <option value="draft">Draft</option>
              </select>
            </div>

            <div>
              <label style={S.label}>Target Audience</label>
              <select style={S.input} value={filterAudience} onChange={e => setFilterAudience(e.target.value)}>
                <option value="all">All Audiences</option>
                <option value="employees">Employees</option>
                <option value="partners">Partners</option>
                <option value="telecallers">Telecallers</option>
                <option value="managers">Managers</option>
                <option value="all users">All Users</option>
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
          { label: 'Published', val: publishedCount, icon: <MdCheckCircle size={24} color="#16a34a" />, bg: '#dcfce7', filterKey: 'published' },
          { label: 'Scheduled', val: scheduledCount, icon: <MdSchedule size={24} color="#d97706" />, bg: '#fef3c7', filterKey: 'scheduled' },
          { label: 'Drafts', val: draftCount, icon: <MdDrafts size={24} color="#64748b" />, bg: '#draft' },
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
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: C.textLight }}>{kpi.label}</div>
              <div style={{ fontSize: '24px', fontWeight: 850, margin: '4px 0 0', color: C.text }}>
                {kpi.val}
              </div>
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {kpi.icon}
            </div>
          </div>
        ))}
      </div>

      {/* NAVIGATION TABS */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { id: 'announcements', label: 'Recent Announcements', icon: <MdAnnouncement size={18} /> },
          { id: 'analytics', label: 'Audience & Reach Analytics', icon: <MdAnalytics size={18} /> },
          { id: 'broadcast', label: 'Direct Broadcast Alert', icon: <MdSend size={18} /> }
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

      {/* TAB 1: RECENT ANNOUNCEMENTS TABLE */}
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
                  placeholder="Search title, ID, audience..."
                  style={{ ...S.input, paddingLeft: '38px', height: '40px', borderRadius: '10px' }}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              <button onClick={exportReport} style={{ ...S.btn('outline'), display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}>
                <MdFileDownload size={16} /> Export CSV
              </button>
            </div>

            {/* Announcements Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${C.border}`, textAlign: 'left', color: C.textLight }}>
                    <th style={{ padding: '12px' }}>Announcement</th>
                    <th style={{ padding: '12px' }}>Audience</th>
                    <th style={{ padding: '12px' }}>Priority</th>
                    <th style={{ padding: '12px' }}>Status</th>
                    <th style={{ padding: '12px' }}>Reach</th>
                    <th style={{ padding: '12px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAnnouncements.map((ann) => (
                    <tr key={ann.id} style={{ borderBottom: `1px solid ${C.border}60` }}>
                      
                      {/* Title & Short Description */}
                      <td style={{ padding: '14px 12px', maxWidth: '280px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 800, color: C.primary, textTransform: 'uppercase' }}>
                          {ann.announcement_id}
                        </div>
                        <div style={{ fontWeight: 750, color: C.text, fontSize: '14px', margin: '2px 0 4px' }}>
                          {ann.title}
                        </div>
                        <div style={{ fontSize: '12px', color: C.textLight, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ann.short_description}
                        </div>
                      </td>

                      {/* Audience */}
                      <td style={{ padding: '14px 12px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, background: C.bgSecondary, padding: '4px 10px', borderRadius: '8px', color: C.text }}>
                          {ann.audience_type}
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
                        <div style={{ fontWeight: 750, color: C.text }}>{ann.reach} users</div>
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
                            style={{ border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.primary, padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}
                          >
                            <MdVisibility /> View
                          </button>
                          <button 
                            onClick={() => openEditModal(ann)} 
                            style={{ border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center' }}
                          >
                            <MdModeEdit />
                          </button>
                          <button 
                            onClick={() => handleDeleteAnnouncement(ann.id)} 
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
              </div>
            </div>

            {/* HIGHLIGHT CARD */}
            <div style={{ ...S.card, padding: '20px', borderRadius: '16px', background: `linear-gradient(135deg, ${C.primary}10 0%, ${C.primary}02 100%)`, border: `1px solid ${C.primary}30` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: C.primary, textTransform: 'uppercase' }}>
                <MdCheckCircle /> Top Performing Announcement
              </div>
              <h4 style={{ fontSize: '14.5px', fontWeight: 800, margin: '8px 0 4px', color: C.text }}>
                New Incentive Structure September 2026
              </h4>
              <div style={{ fontSize: '12px', color: C.textLight, marginBottom: '12px' }}>
                Reached <strong>121</strong> users with <strong>50.4%</strong> engagement.
              </div>
              <button onClick={() => open360DetailView(announcements[4])} style={{ ...S.btn('outline'), width: '100%', fontSize: '12px', fontWeight: 700 }}>
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { audience: 'Employees', count: 1, pct: 20 },
                  { audience: 'Telecallers', count: 1, pct: 20 },
                  { audience: 'Partners', count: 1, pct: 20 },
                  { audience: 'Managers', count: 1, pct: 20 },
                  { audience: 'All Users', count: 1, pct: 20 }
                ].map((aud, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                      <span>{aud.audience}</span>
                      <span>{aud.count} broadcast ({aud.pct}%)</span>
                    </div>
                    <div style={{ height: '10px', background: C.bgSecondary, borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{ width: `${aud.pct}%`, height: '100%', background: C.primary, borderRadius: '6px' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PRIORITY DISTRIBUTION */}
            <div style={{ ...S.card, padding: '24px', borderRadius: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px', color: C.text }}>Announcement by Priority</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { priority: 'Urgent Priority', count: 1, color: '#dc2626' },
                  { priority: 'High Priority', count: 1, color: '#ea580c' },
                  { priority: 'Medium Priority', count: 2, color: '#0284c7' },
                  { priority: 'Low Priority', count: 1, color: '#64748b' }
                ].map((pri, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                      <span>{pri.priority}</span>
                      <span>{pri.count}</span>
                    </div>
                    <div style={{ height: '10px', background: C.bgSecondary, borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{ width: `${pri.count * 25}%`, height: '100%', background: pri.color, borderRadius: '6px' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 3: DIRECT BROADCAST ALERT */}
      {activeTab === 'broadcast' && (
        <div style={{ ...S.card, padding: '28px', maxWidth: '640px', margin: '0 auto', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: '0 0 8px' }}>Send Direct Broadcast Alert</h3>
          <p style={{ fontSize: '13px', color: C.textLight, marginBottom: '20px' }}>
            Instantly dispatch an emergency system notification to specific user roles.
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
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Alert</option>
                  <option value="Urgent">Urgent Emergency</option>
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

              <div>
                <label style={S.label}>Short Description</label>
                <input 
                  type="text" 
                  placeholder="Brief summary..."
                  style={S.input}
                  value={formData.short_description}
                  onChange={e => setFormData({ ...formData, short_description: e.target.value })}
                />
              </div>

              <div>
                <label style={S.label}>Full Message Content *</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Detailed announcement content..."
                  style={S.input}
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={S.label}>Target Audience *</label>
                  <select style={S.input} value={formData.audience_type} onChange={e => setFormData({ ...formData, audience_type: e.target.value })}>
                    <option value="ALL USERS">All Users</option>
                    <option value="EMPLOYEES">Employees</option>
                    <option value="MANAGERS">Managers</option>
                    <option value="TELECALLERS">Telecallers</option>
                    <option value="PARTNERS">Partners</option>
                  </select>
                </div>

                <div>
                  <label style={S.label}>Priority Level *</label>
                  <select style={S.input} value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', borderTop: `1px solid ${C.border}`, paddingTop: '16px' }}>
                <button type="button" onClick={() => setFormOpen(false)} style={S.btn('outline')}>
                  Cancel
                </button>
                <button type="button" onClick={() => handleSaveAnnouncement('draft')} style={S.btn('outline')}>
                  Save Draft
                </button>
                <button type="button" onClick={() => handleSaveAnnouncement('publish')} disabled={saving} style={{ ...S.btn('primary'), padding: '10px 22px', fontWeight: 700 }}>
                  {saving ? 'Processing...' : 'Publish Announcement'}
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: 360° ANNOUNCEMENT DETAILS */}
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
                {selectedAnnouncement.announcement_id}
              </span>
              {getStatusBadge(selectedAnnouncement.status)}
              {getPriorityBadge(selectedAnnouncement.priority)}
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: 850, color: C.text, margin: '0 0 12px' }}>
              {selectedAnnouncement.title}
            </h3>

            <div style={{ background: C.bgSecondary, padding: '16px', borderRadius: '12px', marginBottom: '20px', fontSize: '13.5px', color: C.text }}>
              {selectedAnnouncement.message || selectedAnnouncement.short_description}
            </div>

            {/* PERFORMANCE METRICS */}
            <h4 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 12px', color: C.text }}>Performance & Reach</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
              <div style={{ background: C.bgSecondary, padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: C.textLight }}>Targeted</div>
                <div style={{ fontSize: '18px', fontWeight: 850, color: C.text }}>
                  {selectedAnnouncement.reach}
                </div>
              </div>
              <div style={{ background: C.bgSecondary, padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: C.textLight }}>Viewed</div>
                <div style={{ fontSize: '18px', fontWeight: 850, color: '#0284c7' }}>
                  {selectedAnnouncement.views}
                </div>
              </div>
              <div style={{ background: C.bgSecondary, padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: C.textLight }}>Acknowledged</div>
                <div style={{ fontSize: '18px', fontWeight: 850, color: '#16a34a' }}>
                  {selectedAnnouncement.acknowledgements}
                </div>
              </div>
              <div style={{ background: C.bgSecondary, padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: C.textLight }}>Engagement</div>
                <div style={{ fontSize: '18px', fontWeight: 850, color: '#8b5cf6' }}>
                  {selectedAnnouncement.engagement_rate}%
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button onClick={() => setDetailModalOpen(false)} style={S.btn('primary')}>
                Close Report
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
