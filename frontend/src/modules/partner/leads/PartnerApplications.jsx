import React, { useEffect, useState } from 'react';
import api from '../../../services/api';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import { 
  MdSearch, MdFilterList, MdCheckCircle, MdPendingActions, 
  MdCancel, MdLocalAtm, MdPhone, MdOutlineWhatsapp, MdHistory,
  MdKeyboardArrowDown, MdKeyboardArrowUp, MdPerson, MdCloudUpload,
  MdInsertComment, MdFileDownload, MdBookmark
} from 'react-icons/md';

const STAGES = [
  { id: 'submitted', label: 'Applied', step: 1 },
  { id: 'under_review', label: 'Verification', step: 2 },
  { id: 'approved', label: 'Approved', step: 3 },
  { id: 'disbursed', label: 'Disbursed', step: 4 },
];

export default function PartnerApplications() {
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

  // Detail components state
  const [timelines, setTimelines] = useState({});
  const [documents, setDocuments] = useState({});
  const [newNote, setNewNote] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(null);

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
          limit: 100 // Grab top matching for dashboard viewing
        }
      });
      if (res.data?.success) {
        setApplications(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    fetchApplicationsList();
  }, [search, statusFilter, commFilter]);

  const loadDetailData = async (appId) => {
    try {
      // Timeline
      const timelineRes = await api.get(`/applications/${appId}/timeline`);
      if (timelineRes.data?.success) {
        setTimelines(prev => ({ ...prev, [appId]: timelineRes.data.data }));
      }
      
      // Documents
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
        // Reload detail data
        loadDetailData(appId);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add note');
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
      alert(err.response?.data?.message || 'Failed to upload document. Ensure S3 configuration is active.');
    } finally {
      setUploadingDoc(null);
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

  const getStatusIcon = (status) => {
    switch(status) {
      case 'approved': return <MdCheckCircle />;
      case 'disbursed': return <MdLocalAtm />;
      case 'rejected': return <MdCancel />;
      default: return <MdPendingActions />;
    }
  };

  const getStepProgress = (status) => {
    if (status === 'rejected') return 0;
    if (status === 'disbursed') return 4;
    if (status === 'approved') return 3;
    if (status === 'under_review') return 2;
    return 1; // submitted
  };

  return (
    <div style={{ maxWidth: '1150px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '60px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: C.text, margin: 0 }}>My Applications Pipeline</h2>
          <p style={{ fontSize: '13px', color: C.textLight, margin: '4px 0 0' }}>Track commission distributions, log comments, and manage customer verifications</p>
        </div>
        <button onClick={handleExportCSV} style={{ ...S.btn('outline'), display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MdFileDownload /> Export Pipeline
        </button>
      </div>

      {/* Stats Cards Row */}
      {dashboardStats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          {[
            { label: 'Total Leads', val: dashboardStats.total, col: C.text },
            { label: 'Today\'s submissions', val: dashboardStats.today, col: C.primary },
            { label: 'Verification Under Review', val: dashboardStats.under_review, col: C.gold },
            { label: 'Approved Applications', val: dashboardStats.approved, col: C.green },
            { label: 'Conversion Performance', val: `${dashboardStats.conversion_rate}%`, col: C.teal },
            { label: 'Total Ledger Earnings', val: `₹${parseFloat(dashboardStats.total_earnings).toLocaleString('en-IN')}`, col: C.green }
          ].map((st, i) => (
            <div key={i} style={{ ...S.card, padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{st.label}</span>
              <strong style={{ fontSize: '20px', fontWeight: 850, color: st.col }}>{st.val}</strong>
            </div>
          ))}
        </div>
      )}

      {/* Filters Bar */}
      <div style={{ ...S.card, padding: '16px', borderRadius: '14px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <MdSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: C.textLight }} size={18} />
          <input 
            type="text" 
            placeholder="Search by customer name or App ID..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...S.input, paddingLeft: '36px' }}
          />
        </div>
        
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ ...S.input, width: 'auto', minWidth: '150px' }}
        >
          <option value="">All Application Stages</option>
          <option value="submitted">Applied</option>
          <option value="under_review">Verification / Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <select 
          value={commFilter}
          onChange={(e) => setCommFilter(e.target.value)}
          style={{ ...S.input, width: 'auto', minWidth: '150px' }}
        >
          <option value="">All Commissions Statuses</option>
          <option value="pending">Pending</option>
          <option value="received">Commission Received</option>
          <option value="approved">Wallet Credited (Hold)</option>
          <option value="processed">Commission Paid</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Applications list */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading pipeline...</div>
      ) : applications.length === 0 ? (
        <div style={{ ...S.card, padding: '48px', textAlign: 'center', color: C.textLight }}>
          No customer application records found matching current filters.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {applications.map((app) => {
            const isExpanded = expandedId === app.id;
            const currentStep = getStepProgress(app.status);
            const isRejected = app.status === 'rejected';
            const statusColor = getStatusColor(app.status);

            return (
              <div 
                key={app.id} 
                style={{
                  ...S.card, padding: 0, overflow: 'hidden', borderRadius: '16px',
                  border: `1px solid ${isExpanded ? C.primary : C.border}`
                }}
              >
                {/* Header view */}
                <div 
                  style={{
                    padding: '18px 24px', cursor: 'pointer', display: 'flex', flexWrap: 'wrap',
                    alignItems: 'center', justifyContent: 'space-between', gap: '16px',
                    background: isExpanded ? C.bgSecondary : 'transparent'
                  }}
                  onClick={() => handleToggleExpand(app)}
                >
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flex: 1, minWidth: '260px' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%', background: C.bgSecondary,
                      color: C.textLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px'
                    }}>
                      <MdPerson />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: 0 }}>{app.customer_name}</h3>
                      <p style={{ fontSize: '12px', color: C.textLight, margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: 'monospace', background: C.border + '40', padding: '1px 6px', borderRadius: '4px', fontSize: '11px' }}>{app.app_number}</span>
                        <span>•</span>
                        <span>{app.product_name} ({app.bank_name})</span>
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '9px', color: C.textLight, display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Payout Commission</span>
                      <strong style={{ fontSize: '14px', color: C.green }}>₹{app.commission_amount || 0}</strong>
                    </div>

                    <span style={{
                      ...S.tag(statusColor), display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '20px',
                      background: statusColor + '15', color: statusColor, fontWeight: 700, fontSize: '11.5px'
                    }}>
                      {getStatusIcon(app.status)} {app.status?.replace('_', ' ').toUpperCase()}
                    </span>

                    <button style={{ background: 'none', border: 'none', color: C.textLight, cursor: 'pointer' }}>
                      {isExpanded ? <MdKeyboardArrowUp size={22} /> : <MdKeyboardArrowDown size={22} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details panel */}
                {isExpanded && (
                  <div style={{ borderTop: `1px solid ${C.border}`, padding: '24px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                    
                    {/* Left Panel: Stepper & Documents Checklist & Notes */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      
                      {/* Timeline Progress */}
                      <div>
                        <h4 style={{ fontSize: '12px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '16px' }}>
                          Application Stepper Tracker
                        </h4>

                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '12px', position: 'relative' }}>
                          {STAGES.map((stage, idx) => {
                            const isCompleted = currentStep >= stage.step;
                            const isActive = currentStep === stage.step && !isRejected;
                            const color = isRejected ? C.red : isCompleted ? C.green : isActive ? C.primary : C.border;
                            
                            return (
                              <div key={stage.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1, minWidth: '70px' }}>
                                <div style={{
                                  width: 26, height: 26, borderRadius: '50%',
                                  background: isCompleted ? color : C.card,
                                  border: `2px solid ${color}`,
                                  color: isCompleted ? '#fff' : color,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '12px', fontWeight: 750
                                }}>
                                  {isCompleted ? '✓' : stage.step}
                                </div>
                                <span style={{ fontSize: '11.5px', fontWeight: 700, color: isActive ? C.primary : isCompleted ? C.green : C.textLight }}>
                                  {stage.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Documents Manager */}
                      <div style={{ background: C.bgSecondary + '30', padding: '16px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
                        <h4 style={{ fontSize: '12px', fontWeight: 800, color: C.text, margin: '0 0 12px' }}>Verification Documents Upload Checklist</h4>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                          {['PAN Card', 'Aadhaar Card', 'Salary Slip', 'Bank Statement'].map((docType) => {
                            const matchedDoc = documents[app.id]?.find(d => d.document_type === docType);
                            return (
                              <div key={docType} style={{ background: C.card, border: `1px solid ${C.border}`, padding: '12px', borderRadius: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '90px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: C.text }}>{docType}</span>
                                  {matchedDoc ? (
                                    <span style={{
                                      fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '10px',
                                      background: matchedDoc.status === 'verified' ? `${C.green}15` : matchedDoc.status === 'rejected' ? `${C.red}15` : `${C.gold}15`,
                                      color: matchedDoc.status === 'verified' ? C.green : matchedDoc.status === 'rejected' ? C.red : C.gold
                                    }}>
                                      {matchedDoc.status.toUpperCase()}
                                    </span>
                                  ) : (
                                    <span style={{ fontSize: '10px', color: C.textLight }}>Missing</span>
                                  )}
                                </div>
                                
                                <div style={{ marginTop: '8px' }}>
                                  {matchedDoc ? (
                                    <a href={matchedDoc.file_url} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: C.primary, fontWeight: 700, textDecoration: 'none' }}>
                                      Preview Document
                                    </a>
                                  ) : (
                                    <label style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: C.primary, fontWeight: 700 }}>
                                      <MdCloudUpload /> {uploadingDoc === docType ? 'Uploading...' : 'Upload File'}
                                      <input 
                                        type="file" 
                                        style={{ display: 'none' }} 
                                        disabled={uploadingDoc !== null}
                                        onChange={(e) => handleFileUpload(e, app.id, docType)} 
                                      />
                                    </label>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Timeline activity stream */}
                      <div>
                        <h4 style={{ fontSize: '12px', fontWeight: 800, color: C.text, margin: '0 0 10px' }}>History Logs & Audit</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '180px', overflowY: 'auto' }}>
                          {timelines[app.id]?.map((t, index) => (
                            <div key={index} style={{ borderLeft: `2px solid ${C.primary}`, paddingLeft: '12px', fontSize: '12px' }}>
                              <div style={{ fontWeight: 700 }}>{t.activity}</div>
                              <div style={{ color: C.textLight, margin: '2px 0' }}>{t.remarks || '—'}</div>
                              <span style={{ fontSize: '10.5px', color: C.textLight }}>
                                {new Date(t.performed_at).toLocaleString()} • By {t.performed_by_name || 'System'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                    {/* Right Panel: Notes Board & Call Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      
                      {/* Customer Communication Actions */}
                      <div style={{ ...S.card, padding: '14px', borderRadius: '12px', background: C.bgSecondary + '30', border: `1px solid ${C.border}` }}>
                        <h4 style={{ fontSize: '12px', fontWeight: 800, color: C.text, margin: '0 0 10px' }}>Quick Communications</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <a href={`https://wa.me/${app.customer_mobile}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none', background: '#25D366', color: '#fff', borderRadius: '8px', padding: '8px', fontSize: '12.5px', fontWeight: 700 }}>
                            <MdOutlineWhatsapp size={16} /> WhatsApp Customer
                          </a>
                          <a href={`tel:${app.customer_mobile}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none', ...S.btn('outline'), borderRadius: '8px', padding: '8px', fontSize: '12.5px' }}>
                            <MdPhone size={16} /> Call Customer
                          </a>
                        </div>
                      </div>

                      {/* Notes Comment Board */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <h4 style={{ fontSize: '12px', fontWeight: 800, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MdInsertComment /> Comments Board
                        </h4>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '140px', overflowY: 'auto' }}>
                          {!app.notes_list || app.notes_list.length === 0 ? (
                            <span style={{ fontSize: '11.5px', color: C.textLight }}>No public comments available yet.</span>
                          ) : (
                            app.notes_list.map((note) => (
                              <div key={note.id} style={{ background: C.bgSecondary, padding: '8px 10px', borderRadius: '8px', fontSize: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: C.textLight, marginBottom: '2px' }}>
                                  <strong>{note.writer_name} ({note.writer_role})</strong>
                                  <span>{new Date(note.created_at).toLocaleDateString()}</span>
                                </div>
                                <div style={{ color: C.text }}>{note.note}</div>
                              </div>
                            ))
                          )}
                        </div>

                        <form onSubmit={(e) => handleAddNote(e, app.id)} style={{ display: 'flex', gap: '6px' }}>
                          <input 
                            type="text" 
                            placeholder="Add public remark..." 
                            style={{ ...S.input, padding: '6px 10px', fontSize: '12.5px' }}
                            value={newNote}
                            onChange={e => setNewNote(e.target.value)}
                          />
                          <button type="submit" style={{ ...S.btn('primary'), padding: '6px 12px', fontSize: '12px' }}>Post</button>
                        </form>
                      </div>

                    </div>

                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
const theme = {
  C: {
    bgSecondary: '#ffffff',
    border: '#e2e8f0',
    primary: '#3b82f6',
    green: '#10b981',
    red: '#ef4444',
    gold: '#f59e0b',
    teal: '#14b8a6',
    text: '#1e293b',
    textLight: '#64748b'
  }
};
