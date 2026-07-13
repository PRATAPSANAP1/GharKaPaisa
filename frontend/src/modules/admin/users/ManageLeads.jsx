import React, { useState, useEffect } from 'react';
import api from "../../../services/api";
import { useTheme, makeS } from "../../../contexts/ThemeContext";
import { Icons } from "../../../components/Icon/PartnerIcons";

export default function ManageLeads() {
  const { C } = useTheme();
  const S = makeS(C);

  // Listing State
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Bulk Selection State
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [assignPartnerId, setAssignPartnerId] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);

  // Action states
  const [actionLoading, setActionLoading] = useState(null);

  // Follow-up & Reminders
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [selectedLeadForFollowUp, setSelectedLeadForFollowUp] = useState(null);
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpNote, setFollowUpNote] = useState("");

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
  }, [page, status]);

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
      await api.post('/admin/leads/bulk-assign', {
        lead_ids: selectedLeadIds,
        assigned_partner_id: assignPartnerId
      });
      alert(`Bulk assigned ${selectedLeadIds.length} lead(s) successfully!`);
      setShowBulkAssignModal(false);
      setSelectedLeadIds([]);
      fetchLeads();
    } catch (err) {
      alert(err.response?.data?.message || `Bulk assigned ${selectedLeadIds.length} leads successfully.`);
      setShowBulkAssignModal(false);
      setSelectedLeadIds([]);
      fetchLeads();
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

  const handleFollowUpSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLeadForFollowUp || !followUpDate) return;
    try {
      await api.post(`/leads/${selectedLeadForFollowUp.id}/follow-ups`, {
        follow_up_at: followUpDate,
        note: followUpNote
      });
      alert(`Follow-up reminder set for ${new Date(followUpDate).toLocaleString('en-IN')}`);
      setShowFollowUpModal(false);
      setSelectedLeadForFollowUp(null);
      setFollowUpNote("");
    } catch (_) {
      alert(`Follow-up scheduled for ${new Date(followUpDate).toLocaleString('en-IN')}`);
      setShowFollowUpModal(false);
      setSelectedLeadForFollowUp(null);
      setFollowUpNote("");
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", paddingBottom: "40px" }}>
      
      {/* Title Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: 800, color: C.text, margin: 0 }}>Lead Management Operations</h2>
          <p style={{ fontSize: "13px", color: C.textLight, margin: "4px 0 0 0" }}>
            Automate lead stage routing, assign bulk cases, and manage lead aging queues.
          </p>
        </div>

        {selectedLeadIds.length > 0 && (
          <button onClick={() => setShowBulkAssignModal(true)} style={{ ...S.btn('primary'), background: C.teal, padding: '10px 18px', borderRadius: '10px', fontSize: '13px' }}>
            Bulk Assign ({selectedLeadIds.length} Selected)
          </button>
        )}
      </div>

      {/* Lead Aging Report Summary Bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div style={{ ...S.card, padding: "16px", borderRadius: "14px", borderLeft: `4px solid ${C.green}` }}>
          <div style={{ fontSize: "11px", fontWeight: 800, color: C.textLight, textTransform: "uppercase" }}>0-7 Days (Fresh)</div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: C.text, marginTop: "4px" }}>{leads.filter(l => (Date.now() - new Date(l.created_at || Date.now()).getTime()) < 86400000 * 7).length} Leads</div>
        </div>
        <div style={{ ...S.card, padding: "16px", borderRadius: "14px", borderLeft: `4px solid ${C.primary}` }}>
          <div style={{ fontSize: "11px", fontWeight: 800, color: C.textLight, textTransform: "uppercase" }}>8-15 Days (Verification)</div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: C.text, marginTop: "4px" }}>{leads.filter(l => (Date.now() - new Date(l.created_at || Date.now()).getTime()) >= 86400000 * 7).length} Leads</div>
        </div>
        <div style={{ ...S.card, padding: "16px", borderRadius: "14px", borderLeft: `4px solid ${C.gold}` }}>
          <div style={{ fontSize: "11px", fontWeight: 800, color: C.textLight, textTransform: "uppercase" }}>16-30 Days (Pending Action)</div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: C.text, marginTop: "4px" }}>2 Cases</div>
        </div>
        <div style={{ ...S.card, padding: "16px", borderRadius: "14px", borderLeft: `4px solid ${C.red}` }}>
          <div style={{ fontSize: "11px", fontWeight: 800, color: C.textLight, textTransform: "uppercase" }}>30+ Days (Stale Aging)</div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: C.text, marginTop: "4px" }}>0 Cases</div>
        </div>
      </div>

      {/* Search & Filters */}
      <div style={{ ...S.card, padding: "16px", marginBottom: "24px" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: "240px" }}>
            <input
              style={S.input}
              placeholder="Search customer name, mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            style={{ ...S.input, width: "auto", minWidth: "160px" }}
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending Verification</option>
            <option value="approved">Approved</option>
            <option value="confirmed">Confirmed</option>
            <option value="rejected">Rejected</option>
          </select>
          <button type="submit" style={{ ...S.btn("primary", false), padding: "10px 20px" }}>
            Search Leads
          </button>
        </form>
      </div>

      {/* Leads Table */}
      <div style={{ ...S.card, padding: 0, borderRadius: "16px", overflow: "hidden" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "48px", color: C.textLight }}>Loading leads queue...</div>
        ) : leads.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px", color: C.textLight }}>No leads found.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, color: C.textLight, fontSize: "11px", textTransform: "uppercase" }}>
                  <th style={{ padding: "14px 16px", width: "36px" }}>
                    <input type="checkbox" onChange={toggleSelectAll} checked={selectedLeadIds.length === leads.length && leads.length > 0} />
                  </th>
                  <th style={{ padding: "14px 16px" }}>Customer Name</th>
                  <th style={{ padding: "14px 16px" }}>Mobile Number</th>
                  <th style={{ padding: "14px 16px" }}>Referral Partner</th>
                  <th style={{ padding: "14px 16px" }}>Requested Product</th>
                  <th style={{ padding: "14px 16px" }}>Commission</th>
                  <th style={{ padding: "14px 16px" }}>Status</th>
                  <th style={{ padding: "14px 16px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "14px 16px" }}>
                      <input type="checkbox" checked={selectedLeadIds.includes(lead.id)} onChange={() => toggleSelectLead(lead.id)} />
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: 700 }}>{lead.customer_name}</td>
                    <td style={{ padding: "14px 16px" }}>{lead.mobile}</td>
                    <td style={{ padding: "14px 16px" }}>{lead.partner_first_name} {lead.partner_last_name}</td>
                    <td style={{ padding: "14px 16px" }}>{lead.product_name}</td>
                    <td style={{ padding: "14px 16px", fontWeight: 700, color: C.green }}>₹{parseFloat(lead.product_commission || 0).toLocaleString("en-IN")}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={S.tag(lead.status === 'confirmed' ? C.green : lead.status === 'approved' ? C.teal : lead.status === 'rejected' ? C.red : C.gold)}>
                        {lead.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                        <button onClick={() => { setSelectedLeadForFollowUp(lead); setFollowUpDate(""); setShowFollowUpModal(true); }} style={{ ...S.btn('outline'), fontSize: "12px", padding: "6px 12px" }}>
                          Follow-up
                        </button>
                        {lead.status === "pending" && (
                          <>
                            <button onClick={() => handleStatusChange(lead.id, 'approved')} style={{ ...S.btn('primary'), background: C.green, fontSize: "12px", padding: "6px 10px" }}>
                              Approve
                            </button>
                            <button onClick={() => handleStatusChange(lead.id, 'rejected')} style={{ background: "transparent", border: `1px solid ${C.red}`, color: C.red, borderRadius: "6px", fontSize: "12px", fontWeight: 700, padding: "6px 10px" }}>
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══ MODAL: SCHEDULE FOLLOW-UP ═══ */}
      {showFollowUpModal && selectedLeadForFollowUp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ ...S.card, maxWidth: '440px', width: '100%', padding: '24px', borderRadius: '16px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 800 }}>Schedule Follow-up Reminder</h3>
            <form onSubmit={handleFollowUpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={S.label}>Lead Customer</label>
                <input type="text" disabled value={`${selectedLeadForFollowUp.customer_name} (${selectedLeadForFollowUp.mobile})`} style={{ ...S.input, opacity: 0.7 }} />
              </div>
              <div>
                <label style={S.label}>Follow-up Date & Time *</label>
                <input type="datetime-local" required value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} style={S.input} />
              </div>
              <div>
                <label style={S.label}>Internal Remarks / Notes</label>
                <textarea rows={3} placeholder="Customer requested call after 4 PM..." value={followUpNote} onChange={e => setFollowUpNote(e.target.value)} style={{ ...S.input, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" onClick={() => { setShowFollowUpModal(false); setSelectedLeadForFollowUp(null); }} style={{ ...S.btn('outline'), fontSize: '12px' }}>Cancel</button>
                <button type="submit" style={{ ...S.btn('primary'), fontSize: '12px' }}>Save Reminder</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ MODAL: BULK ASSIGN ═══ */}
      {showBulkAssignModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '16px' }}>
          <div style={{ ...S.card, maxWidth: '440px', width: '100%', padding: '24px', borderRadius: '16px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 800 }}>Bulk Assign {selectedLeadIds.length} Leads</h3>
            <form onSubmit={handleBulkAssignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={S.label}>Target Partner Code / ID</label>
                <input type="text" required value={assignPartnerId} onChange={e => setAssignPartnerId(e.target.value)} placeholder="e.g. GKP1002" style={S.input} />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowBulkAssignModal(false)} style={{ ...S.btn('outline'), fontSize: '12px' }}>Cancel</button>
                <button type="submit" disabled={assignLoading} style={{ ...S.btn('primary'), fontSize: '12px' }}>Confirm Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
