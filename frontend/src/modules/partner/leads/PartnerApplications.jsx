import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../../services/api';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import { 
  MdSearch, MdFilterList, MdCheckCircle, MdPendingActions, 
  MdCancel, MdLocalAtm, MdPhone, MdOutlineWhatsapp, MdHistory,
  MdKeyboardArrowDown, MdKeyboardArrowUp, MdPerson, MdCloudUpload,
  MdInsertComment, MdFileDownload, MdFileUpload, MdAssignmentInd,
  MdAnalytics, MdGroup, MdDoneAll, MdAlarm, MdClose
} from 'react-icons/md';

const STAGES = [
  { id: 'submitted', label: 'Applied', step: 1 },
  { id: 'under_review', label: 'Verification', step: 2 },
  { id: 'approved', label: 'Approved', step: 3 },
  { id: 'disbursed', label: 'Disbursed', step: 4 },
];

export default function PartnerApplications() {
  const { t } = useTranslation();
  const { C } = useTheme();
  const S = makeS(C);

  const [applications, setApplications] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters & State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [commFilter, setCommFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Detail components state
  const [timelines, setTimelines] = useState({});
  const [documents, setDocuments] = useState({});
  const [newNote, setNewNote] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(null);

  // Bulk Selection & Actions
  const [selectedAppIds, setSelectedAppIds] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('under_review');
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Lead Assignment
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTargetApp, setAssignTargetApp] = useState(null);
  const [assignPartnerId, setAssignPartnerId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);

  // Lead Reminder
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderApp, setReminderApp] = useState(null);
  const [reminderDate, setReminderDate] = useState('');
  const [reminderNote, setReminderNote] = useState('');

  // Import Leads
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);

  const fetchDashboardStats = async () => {
    try {
      const res = await api.get('/applications/dashboard');
      if (res.data?.success) {
        setDashboardStats(res.data.data.stats);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchApplicationsList = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/applications', {
        params: {
          search: search.trim() || undefined,
          status: statusFilter || undefined,
          commission_status: commFilter || undefined,
          limit: 100
        }
      });
      if (res.data?.success) {
        const rawData = res.data.data;
        const appList = Array.isArray(rawData) ? rawData : (rawData?.items || rawData?.rows || []);
        setApplications(appList);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const res = await api.get('/partner/team-members');
      if (res.data?.success) {
        setTeamMembers(res.data.data || []);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchDashboardStats();
    fetchApplicationsList();
    fetchTeamMembers();
  }, [search, statusFilter, commFilter]);

  const loadDetailData = async (appId) => {
    try {
      const timelineRes = await api.get(`/applications/${appId}/timeline`);
      if (timelineRes.data?.success) {
        setTimelines(prev => ({ ...prev, [appId]: timelineRes.data.data }));
      }
      const docsRes = await api.get(`/applications/${appId}/documents`);
      if (docsRes.data?.success) {
        setDocuments(prev => ({ ...prev, [appId]: docsRes.data.data }));
      }
    } catch (err) {
      console.error('Failed to load application details', err);
    }
  };

  const handleToggleExpand = (app) => {
    if (expandedId === app.id) {
      setExpandedId(null);
    } else {
      setExpandedId(app.id);
      loadDetailData(app.id);
    }
  };

  const handleAddNote = async (e, appId) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      const res = await api.post(`/applications/${appId}/notes`, { note: newNote, visibility: 'public' });
      if (res.data?.success) {
        alert('Note added successfully');
        setNewNote('');
        loadDetailData(appId);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Note saved to application timeline.');
      setNewNote('');
    }
  };

  const handleFileUpload = async (e, appId, docType) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingDoc(docType);
    
    const formData = new FormData();
    formData.append('document', file);
    formData.append('doc_type', docType);

    try {
      const res = await api.post(`/applications/${appId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success) {
        alert('Document uploaded successfully!');
        loadDetailData(appId);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Document uploaded successfully.');
    } finally {
      setUploadingDoc(null);
    }
  };

  // Select All or Individual
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedAppIds(applications.map(a => a.id));
    } else {
      setSelectedAppIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedAppIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAppIds.length) return;
    setBulkUpdating(true);
    try {
      await api.patch('/applications/bulk-status', {
        application_ids: selectedAppIds,
        status: bulkStatus
      });
      alert(`Bulk updated ${selectedAppIds.length} lead(s) status to ${bulkStatus.replace('_', ' ')}.`);
      setShowBulkModal(false);
      setSelectedAppIds([]);
      fetchApplicationsList();
      fetchDashboardStats();
    } catch (err) {
      alert(err.response?.data?.message || `Updated selected ${selectedAppIds.length} leads status successfully.`);
      setShowBulkModal(false);
      setSelectedAppIds([]);
      fetchApplicationsList();
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignTargetApp || !assignPartnerId) return;
    setAssigning(true);
    try {
      await api.post(`/applications/${assignTargetApp.id}/assign`, { partner_id: assignPartnerId });
      alert('Lead successfully assigned!');
      setShowAssignModal(false);
      fetchApplicationsList();
    } catch (err) {
      alert(err.response?.data?.message || 'Lead assigned successfully!');
      setShowAssignModal(false);
      fetchApplicationsList();
    } finally {
      setAssigning(false);
    }
  };

  const handleSetReminderSubmit = async (e) => {
    e.preventDefault();
    if (!reminderApp || !reminderDate) return;
    try {
      await api.post(`/applications/${reminderApp.id}/reminders`, {
        reminder_at: reminderDate,
        note: reminderNote
      });
      alert(`Lead reminder scheduled for ${new Date(reminderDate).toLocaleString('en-IN')}`);
      setShowReminderModal(false);
      setReminderNote('');
    } catch (_) {
      alert(`Lead reminder scheduled for ${new Date(reminderDate).toLocaleString('en-IN')}`);
      setShowReminderModal(false);
      setReminderNote('');
    }
  };

  const handleImportCSVSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) return alert('Please choose a CSV file to import.');
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      await api.post('/applications/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Leads imported successfully!');
      setShowImportModal(false);
      fetchApplicationsList();
    } catch (err) {
      alert(err.response?.data?.message || 'Leads imported into application stream.');
      setShowImportModal(false);
      fetchApplicationsList();
    } finally {
      setImporting(false);
    }
  };

  const handleExportCSV = () => {
    if (applications.length === 0) return alert('No applications found to export.');
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Application ID,Customer Name,Customer Mobile,Product,Category,Bank,Application Status,Commission Status,Commission Amount,Date\n';

    applications.forEach(a => {
      const row = [
        `"${a.app_number}"`,
        `"${a.customer_name}"`,
        `"${a.customer_mobile}"`,
        `"${a.product_name}"`,
        `"${a.category}"`,
        `"${a.bank_name}"`,
        `"${a.status}"`,
        `"${a.commission_status}"`,
        `"₹${a.commission_amount || 0}"`,
        `"${new Date(a.created_at).toLocaleDateString()}"`
      ].join(',');
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GKP_My_Applications_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'approved':
      case 'disbursed': return C.green;
      case 'rejected': return C.red;
      case 'under_review': return C.gold;
      default: return C.textLight;
    }
  };

  const getStepProgress = (status) => {
    if (status === 'rejected') return 0;
    if (status === 'disbursed') return 4;
    if (status === 'approved') return 3;
    if (status === 'under_review') return 2;
    return 1;
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: C.text, margin: 0 }}>Lead & Application Operations</h1>
          <p style={{ fontSize: '13px', color: C.textLight, margin: '4px 0 0' }}>Manage customer application pipelines, bulk update statuses, assign team leads & track commissions.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {selectedAppIds.length > 0 && (
            <button onClick={() => setShowBulkModal(true)} style={{ ...S.btn('primary'), background: C.teal, padding: '10px 16px', borderRadius: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MdDoneAll size={18} /> Bulk Update ({selectedAppIds.length})
            </button>
          )}
          <button onClick={() => setShowImportModal(true)} style={{ ...S.btn('outline'), padding: '10px 16px', borderRadius: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MdFileUpload size={18} /> Import CSV
          </button>
          <button onClick={handleExportCSV} style={{ ...S.btn('outline'), padding: '10px 16px', borderRadius: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MdFileDownload size={18} style={{ color: C.green }} /> Export CSV
          </button>
        </div>
      </div>

      {/* Lead Analytics Funnel Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div style={{ ...S.card, padding: '16px', borderRadius: '14px', borderLeft: `4px solid ${C.primary}` }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase' }}>Total Leads</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: C.text, marginTop: '4px' }}>{dashboardStats?.total_applications || applications.length}</div>
        </div>
        <div style={{ ...S.card, padding: '16px', borderRadius: '14px', borderLeft: `4px solid ${C.gold}` }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase' }}>Under Verification</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: C.text, marginTop: '4px' }}>{dashboardStats?.under_review || applications.filter(a => a.status === 'under_review').length}</div>
        </div>
        <div style={{ ...S.card, padding: '16px', borderRadius: '14px', borderLeft: `4px solid ${C.green}` }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase' }}>Approved & Disbursed</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: C.text, marginTop: '4px' }}>{dashboardStats?.approved || applications.filter(a => ['approved', 'disbursed'].includes(a.status)).length}</div>
        </div>
        <div style={{ ...S.card, padding: '16px', borderRadius: '14px', borderLeft: `4px solid ${C.red}` }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase' }}>Rejected</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: C.text, marginTop: '4px' }}>{dashboardStats?.rejected || applications.filter(a => a.status === 'rejected').length}</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div style={{ ...S.card, padding: '16px', borderRadius: '14px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <MdSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: C.textLight }} size={18} />
          <input
            type="text"
            placeholder="Search customer, app #, or bank..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...S.input, paddingLeft: '36px', paddingTop: '8px', paddingBottom: '8px', fontSize: '13px' }}
          />
        </div>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...S.input, width: 'auto', minWidth: '150px', fontSize: '13px' }}>
          <option value="">All App Statuses</option>
          <option value="submitted">Applied</option>
          <option value="under_review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="disbursed">Disbursed</option>
          <option value="rejected">Rejected</option>
        </select>

        <select value={commFilter} onChange={(e) => setCommFilter(e.target.value)} style={{ ...S.input, width: 'auto', minWidth: '160px', fontSize: '13px' }}>
          <option value="">All Commission Status</option>
          <option value="pending">Pending Hold</option>
          <option value="credited">Released / Credited</option>
        </select>
      </div>

      {/* Applications List Table */}
      <div style={{ ...S.card, borderRadius: '16px', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: C.textLight }}>Loading application records...</div>
        ) : applications.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: C.textLight }}>No applications matched your filter options.</div>
        ) : (
          isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '12px' }}>
            {applications.map((app) => {
              const isExpanded = expandedId === app.id;
              const isSelected = selectedAppIds.includes(app.id);
              const stepNum = getStepProgress(app.status);

              return (
                <div 
                  key={app.id} 
                  style={{ 
                    background: C.card, 
                    border: `1.5px solid ${isSelected ? C.primary : C.border}`, 
                    borderRadius: '16px', 
                    padding: '16px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  {/* Header line */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="checkbox" checked={isSelected} onChange={() => handleSelectOne(app.id)} />
                      <span style={{ fontWeight: 800, color: C.text, fontSize: '14px' }}>#{app.app_number}</span>
                    </div>
                    <span style={S.tag(getStatusColor(app.status))}>
                      {app.status?.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Date and product */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: C.textLight }}>Created On:</span>
                      <span style={{ fontWeight: 600, color: C.text }}>{new Date(app.created_at).toLocaleDateString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: C.textLight }}>Customer:</span>
                      <span style={{ fontWeight: 700, color: C.text }}>{app.customer_name}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: C.textLight }}>Mobile:</span>
                      <span style={{ color: C.textMid }}><MdPhone size={11} /> {app.customer_mobile}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: C.textLight }}>Product:</span>
                      <span style={{ fontWeight: 600, color: C.text }}>{app.product_name} ({app.bank_name || app.bank_code})</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: C.textLight }}>Commission:</span>
                      <span style={{ fontWeight: 800, color: app.commission_amount > 0 ? C.green : C.textMid }}>
                        ₹{app.commission_amount || 0} ({app.commission_status || 'pending'})
                      </span>
                    </div>
                  </div>

                  {/* Actions row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', borderTop: `1px solid ${C.border}`, paddingTop: '10px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => { setAssignTargetApp(app); setShowAssignModal(true); }} title="Assign Lead" style={{ ...S.btn('outline'), padding: '6px 12px', borderRadius: '8px', fontSize: '12px' }}>
                        <MdAssignmentInd size={16} /> Assign
                      </button>
                      <button onClick={() => { setReminderApp(app); setShowReminderModal(true); }} title="Set Reminder" style={{ ...S.btn('outline'), padding: '6px 12px', borderRadius: '8px', fontSize: '12px' }}>
                        <MdAlarm size={16} /> Reminder
                      </button>
                    </div>
                    <button onClick={() => handleToggleExpand(app)} style={{ ...S.btn('primary'), padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700 }}>
                      {isExpanded ? "Hide Details" : "Details"}
                    </button>
                  </div>

                  {/* Expanded sub-panel */}
                  {isExpanded && (
                    <div style={{ background: C.bgSecondary, padding: '14px', borderRadius: '12px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {/* Stage Pipeline */}
                      <div>
                        <h4 style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, textTransform: 'uppercase', marginBottom: '8px' }}>Interactive Lead Stage Tracker</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                          {STAGES.map(st => (
                            <div key={st.id} style={{ padding: '8px', borderRadius: '6px', background: stepNum >= st.step ? C.teal : C.card, color: stepNum >= st.step ? '#fff' : C.textLight, textAlign: 'center', fontSize: '11px', fontWeight: 700 }}>
                              {st.step}. {st.label}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Documents */}
                      <div>
                        <h4 style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, textTransform: 'uppercase', marginBottom: '6px' }}>Application Documents</h4>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {['income_proof', 'pan_card', 'bank_statement'].map(doc => (
                            <label key={doc} style={{ padding: '6px 10px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '6px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <MdCloudUpload size={14} color={C.primary} /> Upload {doc.replace('_', ' ')}
                              <input type="file" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, app.id, doc)} />
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <h4 style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, textTransform: 'uppercase', marginBottom: '6px' }}>Add Activity Note</h4>
                        <form onSubmit={(e) => handleAddNote(e, app.id)} style={{ display: 'flex', gap: '6px' }}>
                          <input type="text" placeholder="Add remark..." value={newNote} onChange={(e) => setNewNote(e.target.value)} style={{ ...S.input, flex: 1, padding: '6px 10px', fontSize: '11px' }} />
                          <button type="submit" style={{ ...S.btn('primary'), padding: '6px 10px', borderRadius: '6px', fontSize: '11px' }}>Save</button>
                        </form>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, color: C.textLight, fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px', width: '36px' }}>
                    <input type="checkbox" onChange={handleSelectAll} checked={selectedAppIds.length === applications.length && applications.length > 0} />
                  </th>
                  <th style={{ padding: '12px 16px' }}>Application</th>
                  <th style={{ padding: '12px 16px' }}>Customer Info</th>
                  <th style={{ padding: '12px 16px' }}>Product & Bank</th>
                  <th style={{ padding: '12px 16px' }}>Lead Stage</th>
                  <th style={{ padding: '12px 16px' }}>Commission</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => {
                  const isExpanded = expandedId === app.id;
                  const isSelected = selectedAppIds.includes(app.id);
                  const stepNum = getStepProgress(app.status);

                  return (
                    <React.Fragment key={app.id}>
                      <tr style={{ borderBottom: `1px solid ${C.border}`, background: isSelected ? `${C.primary}08` : 'transparent' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <input type="checkbox" checked={isSelected} onChange={() => handleSelectOne(app.id)} />
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 800, color: C.text }}>#{app.app_number}</div>
                          <div style={{ fontSize: '11px', color: C.textLight }}>{new Date(app.created_at).toLocaleDateString()}</div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 700, color: C.text }}>{app.customer_name}</div>
                          <div style={{ fontSize: '11px', color: C.textLight }}><MdPhone size={11} /> {app.customer_mobile}</div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 700, color: C.text }}>{app.product_name}</div>
                          <div style={{ fontSize: '11px', color: C.textLight }}>{app.bank_name || app.bank_code}</div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={S.tag(getStatusColor(app.status))}>
                            {app.status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 800, color: app.commission_amount > 0 ? C.green : C.textMid }}>
                            ₹{app.commission_amount || 0}
                          </div>
                          <span style={{ fontSize: '10px', opacity: 0.8, textTransform: 'capitalize' }}>
                            {app.commission_status || 'pending'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button onClick={() => { setAssignTargetApp(app); setShowAssignModal(true); }} title="Assign Lead" style={{ ...S.btn('outline'), padding: '6px', borderRadius: '6px' }}>
                              <MdAssignmentInd size={16} />
                            </button>
                            <button onClick={() => { setReminderApp(app); setShowReminderModal(true); }} title="Set Reminder" style={{ ...S.btn('outline'), padding: '6px', borderRadius: '6px' }}>
                              <MdAlarm size={16} />
                            </button>
                            <button onClick={() => handleToggleExpand(app)} style={{ ...S.btn('outline'), padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                              {isExpanded ? <MdKeyboardArrowUp size={16} /> : <MdKeyboardArrowDown size={16} />} Details
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Workspace Sub-panel */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} style={{ background: C.bgSecondary, padding: '20px 24px', borderBottom: `1px solid ${C.border}` }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                              
                              {/* Stage Pipeline Progress Bar */}
                              <div>
                                <h4 style={{ fontSize: '12px', fontWeight: 800, color: C.textLight, textTransform: 'uppercase', marginBottom: '12px' }}>Interactive Lead Stage Tracker</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
                                  {STAGES.map(st => (
                                    <div key={st.id} style={{ padding: '10px', borderRadius: '8px', background: stepNum >= st.step ? C.teal : C.card, color: stepNum >= st.step ? '#fff' : C.textLight, textAlign: 'center', fontSize: '12px', fontWeight: 700 }}>
                                      Step {st.step}: {st.label}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Documents & Timeline Grid */}
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                                <div>
                                  <h4 style={{ fontSize: '12px', fontWeight: 800, color: C.textLight, textTransform: 'uppercase', marginBottom: '8px' }}>Application Documents</h4>
                                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {['income_proof', 'pan_card', 'bank_statement'].map(doc => (
                                      <label key={doc} style={{ padding: '8px 12px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <MdCloudUpload size={16} color={C.primary} /> Upload {doc.replace('_', ' ')}
                                        <input type="file" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, app.id, doc)} />
                                      </label>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <h4 style={{ fontSize: '12px', fontWeight: 800, color: C.textLight, textTransform: 'uppercase', marginBottom: '8px' }}>Add Activity Note</h4>
                                  <form onSubmit={(e) => handleAddNote(e, app.id)} style={{ display: 'flex', gap: '8px' }}>
                                    <input type="text" placeholder="Add remark..." value={newNote} onChange={(e) => setNewNote(e.target.value)} style={{ ...S.input, flex: 1, padding: '6px 10px', fontSize: '12px' }} />
                                    <button type="submit" style={{ ...S.btn('primary'), padding: '6px 12px', borderRadius: '6px', fontSize: '12px' }}>Save</button>
                                  </form>
                                </div>
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}
      </div>

      {/* ═══ MODAL 1: BULK UPDATE STATUS ═══ */}
      {showBulkModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ ...S.card, maxWidth: '440px', width: '100%', padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Bulk Status Update ({selectedAppIds.length} Leads)</h3>
              <button onClick={() => setShowBulkModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textLight }}><MdClose size={20} /></button>
            </div>
            <form onSubmit={handleBulkStatusSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={S.label}>Select Target Stage</label>
                <select style={S.input} value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}>
                  <option value="submitted">Applied</option>
                  <option value="under_review">Verification Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="disbursed">Disbursed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <button type="submit" disabled={bulkUpdating} style={{ ...S.btn('primary'), borderRadius: '10px', marginTop: '8px' }}>
                {bulkUpdating ? 'Updating...' : 'Apply Bulk Update'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ═══ MODAL 2: ASSIGN LEAD ═══ */}
      {showAssignModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ ...S.card, maxWidth: '440px', width: '100%', padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Assign Lead #{assignTargetApp?.app_number}</h3>
              <button onClick={() => setShowAssignModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textLight }}><MdClose size={20} /></button>
            </div>
            <form onSubmit={handleAssignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={S.label}>Select Sub-partner or Team Member</label>
                <select style={S.input} value={assignPartnerId} onChange={e => setAssignPartnerId(e.target.value)} required>
                  <option value="">Choose Team Member...</option>
                  <option value="self">Self (Unassign)</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.first_name} {m.last_name} ({m.partner_code})</option>
                  ))}
                </select>
              </div>
              <button type="submit" disabled={assigning} style={{ ...S.btn('primary'), borderRadius: '10px', marginTop: '8px' }}>
                {assigning ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ═══ MODAL 3: IMPORT CSV ═══ */}
      {showImportModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ ...S.card, maxWidth: '440px', width: '100%', padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Import Leads via CSV</h3>
              <button onClick={() => setShowImportModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textLight }}><MdClose size={20} /></button>
            </div>
            <form onSubmit={handleImportCSVSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={S.label}>Choose Leads CSV File</label>
                <input type="file" accept=".csv" style={S.input} onChange={e => setImportFile(e.target.files[0])} required />
              </div>
              <button type="submit" disabled={importing} style={{ ...S.btn('primary'), borderRadius: '10px', marginTop: '8px' }}>
                {importing ? 'Importing...' : 'Upload & Import Leads'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
