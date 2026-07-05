import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import { 
  MdAnnouncement, MdDrafts, MdSend, MdHistory, 
  MdClose, MdDelete, MdModeEdit, MdCached 
} from 'react-icons/md';

export default function ManageAnnouncements() {
  const { C } = useTheme();
  const S = makeS(C);

  const [activeTab, setActiveTab] = useState('announcements'); // announcements, templates, broadcast, reports

  // Data lists
  const [announcements, setAnnouncements] = useState([]);
  const [partners, setPartners] = useState([]);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(false);

  // Announcement Modal Form
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState('create'); // create, edit
  const [selectedAnn, setSelectedAnn] = useState(null);
  const [annForm, setAnnForm] = useState({
    title: '',
    description: '',
    banner_image: '',
    target_role: 'all',
    priority: 'normal',
    start_date: '',
    end_date: '',
    redirect_url: '',
    status: 'draft'
  });
  const [savingAnn, setSavingAnn] = useState(false);

  // Broadcast Form State
  const [broadcastForm, setBroadcastForm] = useState({
    target_role: 'all',
    partner_ids: [],
    title: '',
    message: '',
    priority: 'normal',
    category: 'system'
  });
  const [broadcasting, setBroadcasting] = useState(false);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      // Direct call backend GET
      const res = await api.get('/notifications/announcements');
      if (res.data?.success) {
        setAnnouncements(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadPartners = async () => {
    try {
      const res = await api.get('/superadmin/wallet/overview', { params: { limit: 100 } });
      if (res.data?.success) setPartners(res.data.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/superadmin/notification/reports');
      if (res.data?.success) setReports(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'announcements') loadAnnouncements();
    if (activeTab === 'broadcast') loadPartners();
    if (activeTab === 'reports') loadReports();
  }, [activeTab]);

  const openCreateModal = () => {
    setFormType('create');
    setAnnForm({
      title: '',
      description: '',
      banner_image: '',
      target_role: 'all',
      priority: 'normal',
      start_date: '',
      end_date: '',
      redirect_url: '',
      status: 'draft'
    });
    setFormOpen(true);
  };

  const openEditModal = (ann) => {
    setFormType('edit');
    setSelectedAnn(ann);
    setAnnForm({
      title: ann.title,
      description: ann.description,
      banner_image: ann.banner_image || '',
      target_role: ann.target_role || 'all',
      priority: ann.priority || 'normal',
      start_date: ann.start_date ? ann.start_date.split('T')[0] : '',
      end_date: ann.end_date ? ann.end_date.split('T')[0] : '',
      redirect_url: ann.redirect_url || '',
      status: ann.status
    });
    setFormOpen(true);
  };

  const handleSaveAnnouncement = async (e) => {
    e.preventDefault();
    setSavingAnn(true);
    try {
      let res;
      if (formType === 'create') {
        res = await api.post('/superadmin/announcement', annForm);
      } else {
        res = await api.put(`/superadmin/announcement/${selectedAnn.id}`, annForm);
      }
      if (res.data?.success) {
        alert(`Announcement successfully ${formType === 'create' ? 'created' : 'updated'}!`);
        setFormOpen(false);
        loadAnnouncements();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save announcement');
    } finally {
      setSavingAnn(false);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement permanently?')) return;
    try {
      const res = await api.delete(`/superadmin/announcement/${id}`);
      if (res.data?.success) {
        alert('Announcement deleted');
        loadAnnouncements();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleBroadcastSubmit = async (e) => {
    e.preventDefault();
    setBroadcasting(true);
    try {
      const res = await api.post('/superadmin/notification/broadcast', broadcastForm);
      if (res.data?.success) {
        alert(res.data.message || 'Notification broadcasted successfully!');
        setBroadcastForm({
          target_role: 'all',
          partner_ids: [],
          title: '',
          message: '',
          priority: 'normal',
          category: 'system'
        });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Broadcast failed');
    } finally {
      setBroadcasting(false);
    }
  };

  const handlePartnerSelectChange = (e) => {
    const options = e.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setBroadcastForm({ ...broadcastForm, partner_ids: selected });
  };

  return (
    <div style={{ paddingBottom: '40px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: C.text, margin: 0 }}>Super Admin Communications Console</h2>
          <p style={{ fontSize: '13px', color: C.textLight, margin: '4px 0 0' }}>Manage templates, release role-targeted announcements, and run broadcasts</p>
        </div>
        <button onClick={openCreateModal} style={{ ...S.btn('primary'), display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MdAnnouncement /> New Announcement
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, gap: '24px', marginBottom: '24px' }}>
        {[
          { id: 'announcements', label: 'Announcements Manager', icon: <MdDrafts size={18} /> },
          { id: 'broadcast', label: 'Broadcast Message', icon: <MdSend size={18} /> },
          { id: 'reports', label: 'System Delivery Reports', icon: <MdHistory size={18} /> }
        ].map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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
            </button>
          );
        })}
      </div>

      {/* ANNOUNCEMENTS MANAGER TAB */}
      {activeTab === 'announcements' && (
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>Loading announcements list...</div>
          ) : announcements.length === 0 ? (
            <div style={{ ...S.card, padding: '48px', textAlign: 'center', color: C.textLight }}>No announcements registered. Click "New Announcement" to create one.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {announcements.map((ann) => (
                <div key={ann.id} style={{ ...S.card, padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '220px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{
                        fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px',
                        background: ann.status === 'publish' ? `${C.green}15` : `${C.border}`,
                        color: ann.status === 'publish' ? C.green : C.textLight,
                        textTransform: 'uppercase'
                      }}>{ann.status}</span>
                      <span style={{ fontSize: '11px', color: C.textLight }}>Target: {ann.target_role?.toUpperCase()}</span>
                    </div>
                    <h3 style={{ fontSize: '15.5px', fontWeight: 800, color: C.text, margin: '10px 0 6px' }}>{ann.title}</h3>
                    <p style={{ fontSize: '12.5px', color: C.textLight, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', margin: 0 }}>
                      {ann.description}
                    </p>
                  </div>

                  <div style={{ borderTop: `1px solid ${C.border}80`, paddingTop: '10px', marginTop: '10px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button onClick={() => openEditModal(ann)} style={{ border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MdModeEdit /> Edit
                    </button>
                    <button onClick={() => handleDeleteAnnouncement(ann.id)} style={{ border: `1px solid ${C.red}40`, background: C.bgSecondary, color: C.red, padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MdDelete /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* BROADCAST MESSAGE TAB */}
      {activeTab === 'broadcast' && (
        <div style={{ ...S.card, padding: '24px', maxWidth: '600px', margin: '0 auto', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: '0 0 16px' }}>Send Direct Broadcast Alert</h3>
          
          <form onSubmit={handleBroadcastSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={S.label}>Target User Role</label>
                <select style={S.input} value={broadcastForm.target_role} onChange={e => setBroadcastForm({ ...broadcastForm, target_role: e.target.value })}>
                  <option value="all">All Roles</option>
                  <option value="partner">Partners only</option>
                  <option value="admin">Admins only</option>
                </select>
              </div>
              <div>
                <label style={S.label}>Priority Level</label>
                <select style={S.input} value={broadcastForm.priority} onChange={e => setBroadcastForm({ ...broadcastForm, priority: e.target.value })}>
                  <option value="normal">Normal Alert</option>
                  <option value="high">High Alert</option>
                </select>
              </div>
            </div>

            {broadcastForm.target_role === 'partner' && (
              <div>
                <label style={S.label}>Select Partners (Hold Ctrl to select multiple, leave empty to broadcast to all)</label>
                <select multiple style={{ ...S.input, height: '100px' }} onChange={handlePartnerSelectChange}>
                  {partners.map(p => (
                    <option key={p.id} value={p.id}>{p.first_name} {p.last_name || ''} ({p.Partner_code})</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label style={S.label}>Alert Title / Subject *</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Server Maintenance tonight" 
                style={S.input} 
                value={broadcastForm.title}
                onChange={e => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
              />
            </div>

            <div>
              <label style={S.label}>Message Body *</label>
              <textarea 
                required 
                rows={4} 
                placeholder="Specify target broadcast alert instructions..." 
                style={S.input}
                value={broadcastForm.message}
                onChange={e => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button type="submit" disabled={broadcasting} style={S.btn('primary')}>
                {broadcasting ? 'Broadcasting...' : 'Send Broadcast Now'}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* SYSTEM REPORTS TAB */}
      {activeTab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {reports?.summary && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {reports.summary.map((sum, i) => (
                <div key={i} style={{ ...S.card, padding: '20px', borderRadius: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase' }}>Delivery Status: {sum.status}</span>
                  <h3 style={{ fontSize: '28px', fontWeight: 850, color: C.text, margin: '8px 0 0' }}>{sum.total_count}</h3>
                </div>
              ))}
            </div>
          )}

          {/* Templates checklist */}
          <div style={{ ...S.card, padding: '24px', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: '0 0 16px' }}>Configured Notification Templates</h3>
            
            {(!reports?.templates || reports.templates.length === 0) ? (
              <span style={{ fontSize: '12.5px', color: C.textLight }}>No notification templates saved. System is using fallback defaults.</span>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {reports.templates.map((tpl) => (
                  <div key={tpl.id} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, padding: '14px', borderRadius: '10px' }}>
                    <div style={{ fontWeight: 800, fontSize: '13px' }}>{tpl.template_name}</div>
                    <div style={{ fontSize: '11px', color: C.textLight, marginTop: '2px' }}>Channel: {tpl.channel}</div>
                    <p style={{ fontSize: '12px', color: C.textMid, marginTop: '8px', fontStyle: 'italic' }}>"{tpl.subject}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ANNOUNCEMENT DIALOG CREATOR */}
      {formOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ ...S.card, width: '100%', maxWidth: '520px', padding: '24px', position: 'relative' }}>
            <button 
              onClick={() => setFormOpen(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: C.bgSecondary, border: 'none', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textLight }}
            >
              <MdClose size={20} />
            </button>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: '0 0 16px' }}>
              {formType === 'create' ? 'Create Announcement' : 'Edit Announcement'}
            </h3>

            <form onSubmit={handleSaveAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={S.label}>Title *</label>
                <input 
                  type="text" 
                  required 
                  style={S.input}
                  value={annForm.title}
                  onChange={e => setAnnForm({ ...annForm, title: e.target.value })}
                />
              </div>

              <div>
                <label style={S.label}>Description *</label>
                <textarea 
                  required 
                  rows={3} 
                  style={S.input}
                  value={annForm.description}
                  onChange={e => setAnnForm({ ...annForm, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={S.label}>Target Audience</label>
                  <select style={S.input} value={annForm.target_role} onChange={e => setAnnForm({ ...annForm, target_role: e.target.value })}>
                    <option value="all">All Audiences</option>
                    <option value="partner">Partners only</option>
                    <option value="admin">Admins only</option>
                  </select>
                </div>
                <div>
                  <label style={S.label}>Audience Priority</label>
                  <select style={S.input} value={annForm.priority} onChange={e => setAnnForm({ ...annForm, priority: e.target.value })}>
                    <option value="normal">Normal Priority</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={S.label}>Start Date</label>
                  <input type="date" style={S.input} value={annForm.start_date} onChange={e => setAnnForm({ ...annForm, start_date: e.target.value })} />
                </div>
                <div>
                  <label style={S.label}>End Date</label>
                  <input type="date" style={S.input} value={annForm.end_date} onChange={e => setAnnForm({ ...annForm, end_date: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={S.label}>Banner Image Link</label>
                  <input type="text" placeholder="https://..." style={S.input} value={annForm.banner_image} onChange={e => setAnnForm({ ...annForm, banner_image: e.target.value })} />
                </div>
                <div>
                  <label style={S.label}>Redirect URL</label>
                  <input type="text" placeholder="https://..." style={S.input} value={annForm.redirect_url} onChange={e => setAnnForm({ ...annForm, redirect_url: e.target.value })} />
                </div>
              </div>

              <div>
                <label style={S.label}>Publishing status</label>
                <select style={S.input} value={annForm.status} onChange={e => setAnnForm({ ...annForm, status: e.target.value })}>
                  <option value="draft">Draft (Do not display yet)</option>
                  <option value="publish">Publish Live</option>
                  <option value="archive">Archive (Remove and save)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setFormOpen(false)} style={S.btn('outline')}>Cancel</button>
                <button type="submit" disabled={savingAnn} style={S.btn('primary')}>
                  {savingAnn ? 'Saving...' : 'Save Announcement'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
