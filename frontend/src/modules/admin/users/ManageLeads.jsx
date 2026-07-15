import React, { useState, useEffect } from 'react';
import api from "../../../services/api";
import { useTheme, makeS } from "../../../contexts/ThemeContext";
import { Icons } from "../../../components/Icon/PartnerIcons";
import Lead360Modal from './components/Lead360Modal';

export default function ManageLeads() {
  const { C } = useTheme();
  const S = makeS(C);

  // Listing State
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
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

  // Partners list for bulk assignment dropdown
  const [partnersList, setPartnersList] = useState([]);

  const fetchLeads = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/leads", {
        params: {
          page,
          limit: 20,
          search: search || undefined,
          status: status || undefined,
          priority: priority || undefined,
          source: source || undefined
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
  }, [page, status, priority, source]);

  useEffect(() => {
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

  const handleStatusChange = async (leadId, newStatus) => {
    const confirmation = window.confirm(`Are you sure you want to mark this lead as ${newStatus.toUpperCase()}?`);
    if (!confirmation) return;

    setActionLoading(leadId);
    try {
      const res = await api.patch(`/leads/${leadId}/status`, { status: newStatus });
      if (res.data?.success) {
        alert(`Lead status updated to ${newStatus} successfully!`);
        fetchLeads();
      }
    } catch (e) {
      alert(e.response?.data?.message || `Failed to update lead status to ${newStatus}`);
    } finally {
      setActionLoading(null);
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

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", paddingBottom: "40px" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: 800, color: C.text, margin: 0 }}>Enterprise Lead Management Architecture</h2>
          <p style={{ fontSize: "13px", color: C.textLight, margin: "4px 0 0 0" }}>Operations hub, verification checklist engine, bank executive assignments, SLA monitoring & automatic wallet payouts.</p>
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

          <select style={{ ...S.input, width: "auto" }} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="submitted">Submitted to Bank</option>
            <option value="under_review">Bank Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
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
            <option value="website">Website Direct</option>
            <option value="referral">Referral Link</option>
            <option value="campaign">Campaign QR</option>
          </select>

          <button type="submit" style={{ ...S.btn("primary"), padding: "10px 20px" }}>Search</button>
        </form>
      </div>

      {/* Main Leads Table */}
      <div style={{ ...S.card, padding: 0, borderRadius: "16px", overflow: "hidden", marginBottom: "24px" }}>
        <div style={{ padding: "16px 24px", background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 800, color: C.text, margin: 0 }}>📊 All System Leads ({total})</h3>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: C.textLight }}>Loading lead queue...</div>
        ) : leads.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: C.textLight }}>No leads found matching criteria.</div>
        ) : (
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
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody style={{ color: C.text }}>
                {leads.map((l) => (
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
                        background: l.status === 'approved' ? '#ECFDF5' : l.status === 'rejected' ? '#FEE2E2' : '#EFF6FF',
                        color: l.status === 'approved' ? '#059669' : l.status === 'rejected' ? '#DC2626' : '#2563EB'
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
        )}
      </div>

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
