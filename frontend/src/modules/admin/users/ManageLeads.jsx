import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from "../../../services/api";
import { useTheme, makeS } from "../../../contexts/ThemeContext";
import Lead360Modal from './components/Lead360Modal';

export default function ManageLeads() {
  const { C } = useTheme();
  const S = makeS(C);
  const [searchParams] = useSearchParams();
  const urlStatus = searchParams.get('status');

  const isSuperAdminView = typeof window !== 'undefined' && window.location.pathname.includes('/super-admin');

  // Listing State
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(urlStatus || "");
  const [priority, setPriority] = useState("");
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Bulk Selection State
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [assignPartnerId, setAssignPartnerId] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);

  // Action states
  const [actionLoading, setActionLoading] = useState(null);

  // 360 Lead Modal State
  const [active360LeadId, setActive360LeadId] = useState(null);

  // Bank & Partners list
  const [banksList, setBanksList] = useState([]);
  const [bankId, setBankId] = useState("");
  const [partnersList, setPartnersList] = useState([]);

  const fetchLeads = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/leads", {
        params: {
          page,
          limit: 200,
          search: search || undefined,
          status: status || undefined,
          priority: priority || undefined,
          source: source || undefined,
          bank_id: bankId || undefined
        },
      });
      if (res.data?.success) {
        setLeads(res.data.data);
        setTotal(res.data.pagination?.total || res.data.data.length);
      }
    } catch (e) {
      console.error(e);
      setErr(e.response?.data?.message || "Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [page, status, priority, source, bankId]);

  useEffect(() => {
    api.get('/banks', { params: { limit: 100 } })
      .then(res => { if (res.data?.success) setBanksList(res.data.data); })
      .catch(console.error);

    api.get('/Partners', { params: { limit: 200 } })
      .then(res => { if (res.data?.success) setPartnersList(res.data.data); })
      .catch(console.error);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLeads();
  };

  const toggleSelectLead = (id) => {
    setSelectedLeadIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedLeadIds(leads.map(l => l.id));
    } else {
      setSelectedLeadIds([]);
    }
  };

  const handleBulkAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLeadIds.length || !assignPartnerId) return;
    setAssignLoading(true);
    try {
      await api.post('/leads/bulk-assign', {
        lead_ids: selectedLeadIds,
        assigned_partner_id: assignPartnerId
      });
      alert(`Bulk assigned ${selectedLeadIds.length} lead(s) successfully!`);
      setShowBulkAssignModal(false);
      setSelectedLeadIds([]);
      fetchLeads();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to bulk assign leads.`);
    } finally {
      setAssignLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (leads.length === 0) return alert('No leads to export.');

    const headers = ['Lead ID', 'Customer Name', 'Mobile', 'City', 'Product', 'Bank', 'Partner', 'Priority', 'Source', 'Stage', 'Status', 'Created At'];
    const rows = leads.map(l => [
      l.id, l.customer_name, l.mobile, l.city || '', l.product_name, l.bank_name,
      `${l.partner_first_name || ''} ${l.partner_last_name || ''}`,
      l.priority || 'medium', l.source || 'partner', l.pipeline_stage || 'created', l.status, new Date(l.created_at).toISOString().split('T')[0]
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `GharKaPaisa_Leads_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Group leads into status categories for top-to-bottom status-wise tables
  const statusGroups = [
    {
      id: 'pending_submitted',
      title: 'Pending & Submitted Applications',
      badgeBg: '#EFF6FF',
      badgeColor: '#2563EB',
      borderColor: '#3B82F6',
      statuses: ['submitted', 'pending', 'lead_created', 'created', 'initiated', 'new', 'draft', 'applied']
    },
    {
      id: 'under_review',
      title: 'Bank Review & Physical Verification',
      badgeBg: '#FFF7ED',
      badgeColor: '#EA580C',
      borderColor: '#F97316',
      statuses: ['under_review', 'under review', 'verification', 'in_progress', 'bank_verification', 'details_submitted']
    },
    {
      id: 'operational_verified',
      title: 'Operational Verified & Admin Approved',
      badgeBg: '#F0FDFA',
      badgeColor: '#0D9488',
      borderColor: '#14B8A6',
      statuses: ['operational_verified', 'super_admin_approved']
    },
    {
      id: 'approved',
      title: 'Approved & Commission Released',
      badgeBg: '#ECFDF5',
      badgeColor: '#059669',
      borderColor: '#10B981',
      statuses: ['approved', 'sanctioned', 'disbursed', 'completed', 'commission_released']
    },
    {
      id: 'rejected',
      title: 'Rejected & Declined Applications',
      badgeBg: '#FEE2E2',
      badgeColor: '#DC2626',
      borderColor: '#EF4444',
      statuses: ['rejected', 'declined', 'cancelled']
    }
  ];

  const getLeadsForGroup = (statuses) => {
    return leads.filter(l => {
      const st = (l.status || l.pipeline_stage || '').toLowerCase();
      return statuses.some(s => st === s || st.includes(s));
    });
  };

  // Check if any specific status filter is active
  const isStatusFiltered = !!status;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", paddingBottom: "40px" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: 800, color: C.text, margin: 0 }}>
            {isSuperAdminView ? "All Customer Leads & Status-Wise Applications" : "Leads & Applications Management"}
          </h2>
          <p style={{ fontSize: "13px", color: C.textLight, margin: "4px 0 0 0" }}>
            {isSuperAdminView
              ? "Status-grouped master tables showing all applications from top to bottom (Pending, Under Review, Verified, Approved, Rejected)"
              : "Operations hub, verification checklist engine, bank executive assignments, SLA monitoring & automatic wallet payouts."}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {selectedLeadIds.length > 0 && (
            <button
              onClick={() => setShowBulkAssignModal(true)}
              style={{ ...S.btn('primary'), background: C.purple, padding: '8px 16px', borderRadius: '10px', fontSize: '13px' }}
            >
              Bulk Assign ({selectedLeadIds.length})
            </button>
          )}

          <button
            onClick={handleExportCSV}
            style={{ ...S.btn('outline'), padding: '8px 16px', borderRadius: '10px', fontSize: '13px' }}
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div style={{ ...S.card, padding: "16px", marginBottom: "24px" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: "220px" }}>
            <input
              style={S.input}
              placeholder="Search Lead ID, customer, PAN, mobile, product, partner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select style={{ ...S.input, width: "auto" }} value={bankId} onChange={(e) => setBankId(e.target.value)}>
            <option value="">All Banks</option>
            {banksList.map(b => (
              <option key={b.id} value={b.id}>{b.name} ({b.short_code})</option>
            ))}
          </select>

          <select style={{ ...S.input, width: "auto" }} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Status Tables (Top to Bottom)</option>
            <option value="pending">Pending Review & Submitted</option>
            <option value="under_review">Bank Review & Verification</option>
            <option value="operational_verified">Operational Verified</option>
            <option value="super_admin_approved">Super Admin Approved</option>
            <option value="approved">Approved & Commission Released</option>
            <option value="rejected">Rejected & Declined</option>
          </select>

          <select style={{ ...S.input, width: "auto" }} value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="">All Priorities</option>
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
            <option value="urgent">Urgent Priority</option>
          </select>

          <select style={{ ...S.input, width: "auto" }} value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="">All Sources</option>
            <option value="partner">Partner</option>
            <option value="partner_share">Partner Share Link</option>
            <option value="website">Website Direct</option>
            <option value="referral">Referral Link</option>
            <option value="campaign">Campaign QR</option>
          </select>

          <button type="submit" style={{ ...S.btn("primary"), padding: "10px 20px" }}>Search</button>
        </form>
      </div>

      {loading ? (
        <div style={{ ...S.card, padding: "40px", textAlign: "center", color: C.textLight }}>
          Loading leads & applications...
        </div>
      ) : leads.length === 0 ? (
        <div style={{ ...S.card, padding: "40px", textAlign: "center", color: C.textLight }}>
          No applications or leads found matching criteria.
        </div>
      ) : (
        (() => {
          const sortedLeads = [...leads].sort((a, b) => {
            const timeA = a.created_at ? new Date(a.created_at).getTime() : (a.id || 0);
            const timeB = b.created_at ? new Date(b.created_at).getTime() : (b.id || 0);
            return timeB - timeA;
          });

          return (
            <div
              style={{
                ...S.card,
                padding: 0,
                borderRadius: "16px",
                overflow: "hidden",
                border: `1px solid ${C.border}`
              }}
            >
              {/* Table Header */}
              <div style={{
                padding: "16px 24px",
                background: C.bgSecondary,
                borderBottom: `1px solid ${C.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px"
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 800, color: C.text, margin: 0 }}>
                    Leads & Applications ({sortedLeads.length})
                  </h3>
                </div>
                <span style={{ fontSize: "12px", fontWeight: 600, color: C.textLight }}>
                  Sorted: Latest Top to Oldest Bottom
                </span>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, textAlign: "left", color: C.textLight, fontSize: "11px" }}>
                      <th style={{ padding: "12px 16px" }}>
                        <input type="checkbox" onChange={toggleSelectAll} checked={selectedLeadIds.length === leads.length && leads.length > 0} />
                      </th>
                      <th style={{ padding: "12px 16px" }}>Customer Details</th>
                      <th style={{ padding: "12px 16px" }}>Product & Bank</th>
                      <th style={{ padding: "12px 16px" }}>Source & Priority</th>
                      <th style={{ padding: "12px 16px" }}>Pipeline Stage</th>
                      <th style={{ padding: "12px 16px" }}>Origin Partner</th>
                      <th style={{ padding: "12px 16px" }}>Executive</th>
                      <th style={{ padding: "12px 16px" }}>Created Date</th>
                      <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody style={{ color: C.text }}>
                    {sortedLeads.map((l) => (
                      <tr key={l.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: "12px 16px" }}>
                          <input type="checkbox" checked={selectedLeadIds.includes(l.id)} onChange={() => toggleSelectLead(l.id)} />
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ fontWeight: 800, color: C.text }}>{l.customer_name}</div>
                          <div style={{ fontSize: "11px", color: C.textLight }}>{l.mobile} • {l.city || "N/A"}</div>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ fontWeight: 700 }}>{l.product_name}</div>
                          <div style={{ fontSize: "11px", color: C.textLight }}>{l.bank_name}</div>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ fontSize: "11px", background: C.bgSecondary, padding: "2px 6px", borderRadius: "4px", textTransform: "capitalize", fontWeight: 700 }}>
                            {l.source || 'partner'}
                          </span>
                          <div style={{ fontSize: "11px", color: l.priority === 'high' ? C.red : C.green, fontWeight: 700, marginTop: '2px' }}>
                            ● {(l.priority || 'medium').toUpperCase()}
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{
                            padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 800,
                            background: `${C.blue}15`,
                            color: C.blue
                          }}>
                            {(l.pipeline_stage || l.status).toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div>{l.partner_first_name} {l.partner_last_name || ''}</div>
                          <div style={{ fontSize: "10px", color: C.textLight }}>{l.partner_code}</div>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: '12px' }}>
                          {l.bank_executive_name ? (
                            <span style={{ color: C.teal, fontWeight: 700 }}>{l.bank_executive_name}</span>
                          ) : (
                            <span style={{ color: C.textLight }}>Unassigned</span>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: "12px", color: C.textLight, whiteSpace: "nowrap" }}>
                          {l.created_at ? new Date(l.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          <button
                            onClick={() => setActive360LeadId(l.id)}
                            style={{ ...S.btn("primary"), padding: "6px 12px", fontSize: "12px", borderRadius: "8px" }}
                          >
                            Open 360° Lead
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()
      )}

      {/* 360° LEAD ORCHESTRATION MODAL */}
      {active360LeadId && (
        <Lead360Modal
          leadId={active360LeadId}
          onClose={() => setActive360LeadId(null)}
          onRefresh={fetchLeads}
        />
      )}

      {/* BULK ASSIGN MODAL */}
      {showBulkAssignModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '440px', background: C.card, borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: '0 0 16px 0' }}>Bulk Assign Selected Leads ({selectedLeadIds.length})</h3>
            <form onSubmit={handleBulkAssignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={S.label}>Assign to Partner Profile *</label>
                <select style={S.input} value={assignPartnerId} onChange={(e) => setAssignPartnerId(e.target.value)}>
                  <option value="">Select Partner...</option>
                  {partnersList.map(p => (
                    <option key={p.id} value={p.id}>{p.first_name} {p.last_name || ''} ({p.partner_code})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowBulkAssignModal(false)} style={{ ...S.btn('outline'), padding: '8px 16px' }}>Cancel</button>
                <button type="submit" disabled={assignLoading} style={{ ...S.btn('primary'), padding: '8px 18px', background: C.purple }}>
                  {assignLoading ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
