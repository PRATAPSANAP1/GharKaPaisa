import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useTheme, makeS } from '../../../contexts/ThemeContext';

export default function PartnerShareTracking() {
  const { C } = useTheme();
  const S = makeS(C);

  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTrackingLeads = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/partner/share-tracking', {
        params: {
          page,
          limit: 20,
          search: search || undefined,
          status: status || undefined,
          from_date: fromDate || undefined,
          to_date: toDate || undefined
        }
      });
      if (res.data?.success) {
        setLeads(res.data.data);
        setTotal(res.data.pagination?.total || res.data.data.length);
      }
    } catch (err) {
      console.error('Failed to fetch tracking leads:', err);
      setError(err.response?.data?.message || 'Failed to load tracking data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackingLeads();
  }, [page, status, fromDate, toDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTrackingLeads();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return { bg: '#ECFDF5', color: '#059669' };
      case 'rejected': return { bg: '#FEE2E2', color: '#DC2626' };
      case 'pending': return { bg: '#EFF6FF', color: '#2563EB' };
      default: return { bg: '#F3F4F6', color: '#6B7280' };
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: C.text, margin: '0 0 8px' }}>
          🔗 Partner Share Link Tracking
        </h2>
        <p style={{ fontSize: '14px', color: C.textLight, margin: 0 }}>
          Track leads generated from your shared product links
        </p>
      </div>

      {/* Filters */}
      <div style={{ ...S.card, padding: '20px', marginBottom: '24px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={S.label}>Search</label>
            <input
              type="text"
              style={S.input}
              placeholder="Search by name or mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ minWidth: '150px' }}>
            <label style={S.label}>Status</label>
            <select style={S.input} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div style={{ minWidth: '150px' }}>
            <label style={S.label}>From Date</label>
            <input
              type="date"
              style={S.input}
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div style={{ minWidth: '150px' }}>
            <label style={S.label}>To Date</label>
            <input
              type="date"
              style={S.input}
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          <button type="submit" style={{ ...S.btn('primary'), padding: '10px 20px' }}>
            Search
          </button>
        </form>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ ...S.card, padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 800, color: C.primary }}>{total}</div>
          <div style={{ fontSize: '12px', color: C.textLight, marginTop: '4px' }}>Total Leads</div>
        </div>
        <div style={{ ...S.card, padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#059669' }}>
            {leads.filter(l => l.status === 'approved').length}
          </div>
          <div style={{ fontSize: '12px', color: C.textLight, marginTop: '4px' }}>Approved</div>
        </div>
        <div style={{ ...S.card, padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#2563EB' }}>
            {leads.filter(l => l.status === 'pending').length}
          </div>
          <div style={{ fontSize: '12px', color: C.textLight, marginTop: '4px' }}>Pending</div>
        </div>
        <div style={{ ...S.card, padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#DC2626' }}>
            {leads.filter(l => l.status === 'rejected').length}
          </div>
          <div style={{ fontSize: '12px', color: C.textLight, marginTop: '4px' }}>Rejected</div>
        </div>
      </div>

      {/* Leads Table */}
      <div style={{ ...S.card, padding: 0, borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', background: C.bgSecondary, borderBottom: `1px solid ${C.border}` }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: 0 }}>
            Share Link Leads ({total})
          </h3>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: C.textLight }}>
            Loading tracking data...
          </div>
        ) : error ? (
          <div style={{ padding: '40px', textAlign: 'center', color: C.red }}>
            {error}
          </div>
        ) : leads.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: C.textLight }}>
            No leads found from share links
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, textAlign: 'left', color: C.textLight, fontSize: '11px' }}>
                  <th style={{ padding: '12px 16px' }}>Customer Details</th>
                  <th style={{ padding: '12px 16px' }}>Product & Bank</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px' }}>Tracking Token</th>
                  <th style={{ padding: '12px 16px' }}>Created At</th>
                </tr>
              </thead>
              <tbody style={{ color: C.text }}>
                {leads.map((lead) => (
                  <tr key={lead.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700 }}>{lead.customer_name}</div>
                      <div style={{ fontSize: '11px', color: C.textLight }}>
                        {lead.customer_mobile || lead.mobile}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700 }}>{lead.product_name}</div>
                      <div style={{ fontSize: '11px', color: C.textLight }}>{lead.bank_name}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: getStatusColor(lead.status).bg,
                        color: getStatusColor(lead.status).color
                      }}>
                        {lead.status?.toUpperCase() || 'PENDING'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: '11px', color: C.textLight, fontFamily: 'monospace' }}>
                        {lead.tracking_token ? `${lead.tracking_token.slice(0, 8)}...` : 'N/A'}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: '12px' }}>
                        {new Date(lead.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                      <div style={{ fontSize: '11px', color: C.textLight }}>
                        {new Date(lead.created_at).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: C.textLight }}>
              Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ ...S.btn('outline'), padding: '6px 12px', fontSize: '12px', opacity: page === 1 ? 0.5 : 1 }}
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * 20 >= total}
                style={{ ...S.btn('outline'), padding: '6px 12px', fontSize: '12px', opacity: page * 20 >= total ? 0.5 : 1 }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
