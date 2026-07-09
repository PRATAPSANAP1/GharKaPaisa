import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import { 
  MdSearch, MdFilterList, MdCheckCircle, MdBlock, 
  MdCompareArrows, MdHistory, MdFileDownload, MdClose,
  MdModeEdit, MdSwapHoriz, MdAssignment, MdVisibility
} from 'react-icons/md';

const VISIBILITY_OPTIONS = [
  { id: 'public', label: 'Public (Visible to Partner)' },
  { id: 'internal', label: 'Internal (Admins only)' },
  { id: 'private', label: 'Private (Super Admin only)' }
];

export default function ManageApplications() {
  const { C } = useTheme();
  const S = makeS(C);

  const [applications, setApplications] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Filter States
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [commFilter, setCommFilter] = useState('');
  const [partnerFilter, setPartnerFilter] = useState('');

  // Selected Application for detail/drawer modals
  const [selectedApp, setSelectedApp] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [timelines, setTimelines] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [notes, setNotes] = useState([]);

  // Notes Form State
  const [noteForm, setNoteForm] = useState({ note: '', visibility: 'public' });
  const [postingNote, setPostingNote] = useState(false);

  // Action Dialog States
  const [actionType, setActionType] = useState(null); // 'approve', 'reject', 'reassign', 'manual', 'reverse'
  const [actionForm, setActionForm] = useState({
    approved_amount: '',
    rejection_reason: '',
    partner_id: '',
    amount: '',
    remarks: ''
  });
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/applications', {
        params: {
          page,
          limit: 10,
          status: statusFilter || undefined,
          commission_status: commFilter || undefined,
          Partner_id: partnerFilter || undefined,
          search: search.trim() || undefined
        }
      });
      if (res.data?.success) {
        setApplications(res.data.data || []);
        setTotalPages(res.data.pagination?.pages || 1);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPartnersList = async () => {
    try {
      const res = await api.get('/superadmin/wallet/overview', { params: { limit: 100 } });
      if (res.data?.success) {
        setPartners(res.data.data?.data || res.data.data || []);
      }
    } catch (e) {
      console.error('Failed to load partners', e);
    }
  };

  useEffect(() => {
    fetchPartnersList();
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [page, statusFilter, commFilter, partnerFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchApplications();
  };

  const handleOpenDetail = async (app) => {
    setSelectedApp(app);
    setDetailModalOpen(true);
    setNoteForm({ note: '', visibility: 'public' });
    
    // Load Timelines, Documents, and Notes detail
    try {
      const tRes = await api.get(`/applications/${app.id}/timeline`);
      if (tRes.data?.success) setTimelines(tRes.data.data || []);

      const dRes = await api.get(`/applications/${app.id}/documents`);
      if (dRes.data?.success) setDocuments(dRes.data.data || []);

      const detailedAppRes = await api.get(`/applications/${app.id}`);
      if (detailedAppRes.data?.success) {
        setNotes(detailedAppRes.data.data.notes_list || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteForm.note.trim()) return;
    setPostingNote(true);
    try {
      const res = await api.post(`/applications/${selectedApp.id}/notes`, noteForm);
      if (res.data?.success) {
        alert('Note added successfully!');
        setNoteForm({ note: '', visibility: 'public' });
        // Reload details
        const detailedAppRes = await api.get(`/applications/${selectedApp.id}`);
        if (detailedAppRes.data?.success) {
          setNotes(detailedAppRes.data.data.notes_list || []);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add note');
    } finally {
      setPostingNote(false);
    }
  };

  const triggerActionDialog = (type) => {
    setActionType(type);
    setActionForm({
      approved_amount: selectedApp.loan_amount || '',
      rejection_reason: '',
      partner_id: '',
      amount: '',
      remarks: ''
    });
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    setSubmittingAction(true);
    try {
      let endpoint = '';
      let payload = { id: selectedApp.id };

      if (actionType === 'approve') {
        endpoint = '/superadmin/application/approve';
        payload.approved_amount = parseFloat(actionForm.approved_amount);
      } else if (actionType === 'reject') {
        endpoint = '/superadmin/application/reject';
        payload.reason = actionForm.rejection_reason;
      } else if (actionType === 'reassign') {
        endpoint = '/superadmin/application/reassign';
        payload.partner_id = actionForm.partner_id;
      } else if (actionType === 'manual') {
        endpoint = '/superadmin/application/manual-commission';
        payload.amount = parseFloat(actionForm.amount);
        payload.remarks = actionForm.remarks;
      }

      const res = await api.post(endpoint, payload);
      if (res.data?.success) {
        alert(res.data.message || 'Operation processed successfully!');
        setActionType(null);
        setDetailModalOpen(false);
        fetchApplications();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Action execution failed');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleExportCSV = () => {
    if (applications.length === 0) return alert('No applications found to export.');
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Application ID,Customer Name,Partner Code,Product,Bank,Status,Commission Status,Commission Amount,Created At\n';

    applications.forEach(a => {
      const row = [
        `"${a.app_number}"`,
        `"${a.customer_name}"`,
        `"${a.Partner_code}"`,
        `"${a.product_name}"`,
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
    link.setAttribute('download', 'GKP_Applications_Queue.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ paddingBottom: '50px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: C.text, margin: 0 }}>Customer Applications Queue</h2>
          <p style={{ fontSize: '13px', color: C.textLight, margin: '4px 0 0' }}>Review verifications, track documents, log admin notes, and approve partner commission payouts</p>
        </div>
        <button onClick={handleExportCSV} style={{ ...S.btn('outline'), display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MdFileDownload /> Export Queue
        </button>
      </div>

      {/* Filters Card */}
      <div style={{ ...S.card, padding: '16px', marginBottom: '24px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, display: 'block', marginBottom: '4px' }}>Search Lead Info</label>
            <div style={{ position: 'relative' }}>
              <input 
                style={{ ...S.input, paddingLeft: '32px' }} 
                placeholder="Search name, phone, application ID..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
              />
              <MdSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: C.textLight }} />
            </div>
          </div>
          
          <div style={{ width: '150px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, display: 'block', marginBottom: '4px' }}>Application Status</label>
            <select style={S.input} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="submitted">Applied</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div style={{ width: '150px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, display: 'block', marginBottom: '4px' }}>Commission Status</label>
            <select style={S.input} value={commFilter} onChange={e => setCommFilter(e.target.value)}>
              <option value="">All Commissions</option>
              <option value="pending">Pending</option>
              <option value="received">Commission Received</option>
              <option value="approved">Wallet Credited (Hold)</option>
              <option value="processed">Commission Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div style={{ width: '180px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, display: 'block', marginBottom: '4px' }}>Filter by Partner</label>
            <select style={S.input} value={partnerFilter} onChange={e => setPartnerFilter(e.target.value)}>
              <option value="">All Partners</option>
              {partners.map(p => (
                <option key={p.id} value={p.Partner_id}>{p.first_name} {p.last_name || ''} ({p.Partner_code})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" style={S.btn('primary')}>Search</button>
            <button type="button" onClick={() => { setSearch(''); setStatusFilter(''); setCommFilter(''); setPartnerFilter(''); setPage(1); setTimeout(fetchApplications, 0); }} style={S.btn('outline')}>Reset</button>
          </div>
        </form>
      </div>

      {/* Main Grid Queue Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading queue list...</div>
      ) : applications.length === 0 ? (
        <div style={{ ...S.card, padding: '48px', textAlign: 'center', color: C.textLight }}>No applications matching search criteria.</div>
      ) : (
        <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, fontSize: '11px', textTransform: 'uppercase', color: C.textLight }}>
                  <th style={{ padding: '14px 16px' }}>App ID</th>
                  <th style={{ padding: '14px 16px' }}>Customer Details</th>
                  <th style={{ padding: '14px 16px' }}>Partner Assigned</th>
                  <th style={{ padding: '14px 16px' }}>Product & Bank</th>
                  <th style={{ padding: '14px 16px' }}>Status</th>
                  <th style={{ padding: '14px 16px' }}>Commission Status</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>Details</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '13.5px' }}>
                {applications.map((app) => (
                  <tr key={app.id} style={{ borderBottom: `1px solid ${C.border}60` }}>
                    <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontWeight: 700 }}>
                      {app.app_number}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 800, color: C.text }}>{app.customer_name}</div>
                      <div style={{ fontSize: '11px', color: C.textLight, marginTop: '2px' }}>{app.customer_mobile}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600 }}>{app.Partner_first_name} {app.Partner_last_name || ''}</div>
                      <div style={{ fontSize: '11px', color: C.textLight, marginTop: '2px' }}>{app.Partner_code}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ color: C.text }}>{app.product_name}</div>
                      <div style={{ fontSize: '11.5px', color: C.textLight, marginTop: '2px' }}>{app.bank_name} • {app.category}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-block', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px',
                        background: (app.status === 'approved' || app.status === 'disbursed') ? `${C.green}15` : app.status === 'rejected' ? `${C.red}15` : `${C.gold}15`,
                        color: (app.status === 'approved' || app.status === 'disbursed') ? C.green : app.status === 'rejected' ? C.red : C.gold
                      }}>
                        {app.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 700, color: C.green }}>₹{app.commission_amount || 0}</div>
                      <div style={{ fontSize: '10.5px', color: C.textLight, marginTop: '2px', textTransform: 'uppercase' }}>
                        {app.commission_status}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <button onClick={() => handleOpenDetail(app)} style={{ border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                        <MdVisibility /> Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderTop: `1px solid ${C.border}`, background: C.bgSecondary }}>
              <span style={{ fontSize: '13px', color: C.textLight }}>Page {page} of {totalPages}</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={S.btn('outline')}>Prev</button>
                <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} style={S.btn('outline')}>Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DETAIL DRAWER / MODAL */}
      {detailModalOpen && selectedApp && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ ...S.card, width: '100%', maxWidth: '850px', height: '100%', borderRadius: 0, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
            
            <button 
              onClick={() => setDetailModalOpen(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: C.bgSecondary, border: 'none', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textLight }}
            >
              <MdClose size={22} />
            </button>

            {/* Title / Summary */}
            <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: '16px', marginRight: '40px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, background: `${C.primary}15`, color: C.primary, padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>
                {selectedApp.app_number}
              </span>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: C.text, margin: '8px 0 2px' }}>{selectedApp.customer_name}</h3>
              <p style={{ fontSize: '12.5px', color: C.textLight, margin: 0 }}>
                Category: **{selectedApp.category}** • Product: **{selectedApp.product_name}** • Bank: **{selectedApp.bank_name}**
              </p>
            </div>

            {/* Action Bar Overrides */}
            <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, padding: '14px', borderRadius: '12px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <button onClick={() => triggerActionDialog('approve')} style={{ ...S.btn('primary'), display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 14px', fontSize: '12.5px' }}>
                <MdCheckCircle /> Approve Lead
              </button>
              <button onClick={() => triggerActionDialog('reject')} style={{ ...S.btn('outline'), color: C.red, borderColor: C.red, display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 14px', fontSize: '12.5px' }}>
                <MdBlock /> Reject Lead
              </button>
              <button onClick={() => triggerActionDialog('reassign')} style={{ ...S.btn('outline'), display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 14px', fontSize: '12.5px' }}>
                <MdSwapHoriz /> Reassign Partner
              </button>
              <button onClick={() => triggerActionDialog('manual')} style={{ ...S.btn('outline'), color: C.teal, borderColor: C.teal, display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 14px', fontSize: '12.5px' }}>
                <MdAssignment /> Manual Commission
              </button>
            </div>

            {/* Dual Column details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
              
              {/* Left Column: Timeline Logs & Uploaded Docs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Timeline activity stream */}
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 800, color: C.text, margin: '0 0 12px' }}>Verification Lifecycle Log</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: `2px solid ${C.border}`, paddingLeft: '14px' }}>
                    {timelines.length === 0 ? (
                      <span style={{ fontSize: '12.5px', color: C.textLight }}>No activity logs yet.</span>
                    ) : (
                      timelines.map((t, idx) => (
                        <div key={idx} style={{ position: 'relative', fontSize: '12.5px' }}>
                          <div style={{ position: 'absolute', left: '-20px', top: '4px', width: '8px', height: '8px', borderRadius: '50%', background: C.primary }} />
                          <div style={{ fontWeight: 700, color: C.text }}>{t.activity}</div>
                          <div style={{ color: C.textLight, margin: '2px 0' }}>{t.remarks || '—'}</div>
                          <span style={{ fontSize: '10.5px', color: C.textLight }}>
                            {new Date(t.performed_at).toLocaleString()} • By {t.performed_by_name || 'System'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Documents Management */}
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 800, color: C.text, margin: '0 0 12px' }}>Customer Documents Verified</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {documents.length === 0 ? (
                      <div style={{ background: C.bgSecondary, padding: '12px', borderRadius: '8px', textAlign: 'center', fontSize: '12.5px', color: C.textLight }}>
                        No files uploaded for this application yet.
                      </div>
                    ) : (
                      documents.map((doc) => (
                        <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.bgSecondary, border: `1px solid ${C.border}`, padding: '10px 14px', borderRadius: '8px' }}>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 700 }}>{doc.document_type}</div>
                            <span style={{ fontSize: '10.5px', color: C.textLight }}>
                              Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{
                              fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '10px',
                              background: doc.status === 'verified' ? `${C.green}15` : `${C.gold}15`,
                              color: doc.status === 'verified' ? C.green : C.gold
                            }}>{doc.status.toUpperCase()}</span>
                            <a href={doc.file_url} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: C.primary, textDecoration: 'none', fontWeight: 700 }}>
                              Download
                            </a>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Right Column: Private, Internal and Public Notes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 800, color: C.text, margin: 0 }}>Internal & External Notes Audit</h4>
                
                {/* Notes Stream */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto' }}>
                  {notes.length === 0 ? (
                    <span style={{ fontSize: '12px', color: C.textLight }}>No notes found.</span>
                  ) : (
                    notes.map((n) => (
                      <div key={n.id} style={{
                        background: n.visibility === 'private' ? `${C.red}08` : n.visibility === 'internal' ? `${C.gold}08` : C.bgSecondary,
                        borderLeft: `3px solid ${n.visibility === 'private' ? C.red : n.visibility === 'internal' ? C.gold : C.primary}`,
                        padding: '10px', borderRadius: '6px', fontSize: '12.5px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: C.textLight, marginBottom: '2px' }}>
                          <strong>{n.writer_name} ({n.writer_role})</strong>
                          <span>{new Date(n.created_at).toLocaleDateString()}</span>
                        </div>
                        <div style={{ color: C.text }}>{n.note}</div>
                        <span style={{ display: 'inline-block', marginTop: '4px', fontSize: '9.5px', textTransform: 'uppercase', fontWeight: 700, color: C.textLight }}>
                          Visibility: {n.visibility}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Note Form */}
                <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: C.bgSecondary, padding: '12px', borderRadius: '10px', border: `1px solid ${C.border}` }}>
                  <div>
                    <label style={S.label}>Note Content *</label>
                    <textarea 
                      required 
                      rows={2} 
                      placeholder="Type details..." 
                      style={S.input}
                      value={noteForm.note}
                      onChange={e => setNoteForm({ ...noteForm, note: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={S.label}>Visibility Scope</label>
                    <select 
                      style={S.input} 
                      value={noteForm.visibility}
                      onChange={e => setNoteForm({ ...noteForm, visibility: e.target.value })}
                    >
                      {VISIBILITY_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                    </select>
                  </div>
                  <button type="submit" disabled={postingNote} style={{ ...S.btn('primary'), alignSelf: 'flex-end', padding: '6px 14px', fontSize: '12.5px' }}>
                    {postingNote ? 'Saving...' : 'Save Note'}
                  </button>
                </form>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* ACTION TRIGGER OVERLAYS */}
      {actionType && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ ...S.card, width: '100%', maxWidth: '460px', padding: '24px', position: 'relative' }}>
            
            <button 
              onClick={() => setActionType(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: C.bgSecondary, border: 'none', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textLight }}
            >
              <MdClose size={20} />
            </button>

            <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: '0 0 16px', textTransform: 'capitalize' }}>
              {actionType} Application
            </h3>

            <form onSubmit={handleActionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {actionType === 'approve' && (
                <div>
                  <label style={S.label}>Approved Loan/Credit Amount (INR) *</label>
                  <input 
                    type="number" 
                    required 
                    style={S.input} 
                    value={actionForm.approved_amount}
                    onChange={e => setActionForm({ ...actionForm, approved_amount: e.target.value })}
                  />
                </div>
              )}

              {actionType === 'reject' && (
                <div>
                  <label style={S.label}>Reason for Rejection *</label>
                  <textarea 
                    required 
                    rows={3} 
                    placeholder="Enter reason for customer lead rejection..." 
                    style={S.input}
                    value={actionForm.rejection_reason}
                    onChange={e => setActionForm({ ...actionForm, rejection_reason: e.target.value })}
                  />
                </div>
              )}

              {actionType === 'reassign' && (
                <div>
                  <label style={S.label}>Select Target Partner *</label>
                  <select 
                    required 
                    style={S.input} 
                    value={actionForm.partner_id}
                    onChange={e => setActionForm({ ...actionForm, partner_id: e.target.value })}
                  >
                    <option value="">Choose partner...</option>
                    {partners.map(p => (
                      <option key={p.id} value={p.Partner_id}>{p.first_name} {p.last_name || ''} ({p.Partner_code})</option>
                    ))}
                  </select>
                </div>
              )}

              {actionType === 'manual' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={S.label}>Commission Payout Amount (INR) *</label>
                    <input 
                      type="number" 
                      required 
                      style={S.input} 
                      value={actionForm.amount}
                      onChange={e => setActionForm({ ...actionForm, amount: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={S.label}>Override Remarks *</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. approved offline referral" 
                      style={S.input}
                      value={actionForm.remarks}
                      onChange={e => setActionForm({ ...actionForm, remarks: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setActionType(null)} style={S.btn('outline')}>Cancel</button>
                <button type="submit" disabled={submittingAction} style={S.btn('primary')}>
                  {submittingAction ? 'Processing...' : 'Confirm Action'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
