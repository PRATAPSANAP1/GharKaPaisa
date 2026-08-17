import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useTheme } from '../../../contexts/ThemeContext';
import { DollarSign, CheckCircle2, PauseCircle, RefreshCw, Search, Filter, ShieldAlert } from 'lucide-react';

export default function SuperAdminCommission() {
  const { C, isDark } = useTheme();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [message, setMessage] = useState('');

  const border = isDark ? '#1f1f1f' : C.border;
  const cardBg = isDark ? '#0f0f0f' : '#ffffff';
  const textPrimary = C.text;
  const textMuted = C.textMid;
  const accent = C.primary;

  const fetchCommissionApps = async () => {
    setLoading(true);
    try {
      const res = await api.get('/applications', {
        params: {
          search: search.trim() || undefined,
          commission_status: statusFilter || undefined,
          limit: 200
        }
      });
      if (res.data?.success) {
        const raw = res.data.data;
        const list = Array.isArray(raw) ? raw : (raw?.items || raw?.rows || []);
        // Only show applications where all process steps are complete and Super Admin has approved
        const approvedOnly = list.filter(app => {
          const st = (app.status || '').toLowerCase();
          const cst = (app.commission_status || '').toLowerCase();
          return ['super_admin_approved', 'approved', 'disbursed', 'commission_released'].includes(st) || ['released', 'approved', 'on_hold', 'held'].includes(cst);
        });
        setApplications(approvedOnly);
      }
    } catch (err) {
      console.error('Failed to load commission applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissionApps();
  }, [statusFilter]);

  const handleReleaseCommission = async (appId, appNumber, amount) => {
    if (!window.confirm(`Are you sure you want to RELEASE ₹${amount} commission for Application #${appNumber}? This will credit the Partner's Available Wallet balance.`)) return;

    setProcessingId(appId);
    setMessage('');
    try {
      const res = await api.post(`/applications/${appId}/release-commission`);
      if (res.data?.success) {
        setMessage(`✅ Success: Released ₹${amount} for #${appNumber}. Partner wallet updated!`);
        fetchCommissionApps();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to release commission.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleHoldCommission = async (appId, appNumber) => {
    if (!window.confirm(`Hold commission for Application #${appNumber}?`)) return;

    setProcessingId(appId);
    setMessage('');
    try {
      const res = await api.post(`/applications/${appId}/hold-commission`);
      if (res.data?.success) {
        setMessage(`⚠️ Application #${appNumber} commission placed on HOLD.`);
        fetchCommissionApps();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to hold commission.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1280, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 6px', color: textPrimary, display: 'flex', alignItems: 'center', gap: 10 }}>
            <DollarSign size={28} color="#10b981" /> Super Admin Commission Release Engine
          </h1>
          <p style={{ fontSize: 13, color: textMuted, margin: 0 }}>
            Manage & authorize partner commission payouts. Releasing commission instantly credits the Partner's Available Wallet balance.
          </p>
        </div>
        <button
          onClick={fetchCommissionApps}
          style={{ padding: '10px 18px', borderRadius: 12, border: `1px solid ${border}`, background: cardBg, color: textPrimary, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {message && (
        <div style={{ background: '#10b98115', border: '1px solid #10b98140', color: '#10b981', padding: '12px 16px', borderRadius: 12, marginBottom: 20, fontSize: 13, fontWeight: 700 }}>
          {message}
        </div>
      )}

      {/* Filter Bar */}
      <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: 16, marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 240, display: 'flex', alignItems: 'center', background: isDark ? '#161616' : '#f8fafc', border: `1px solid ${border}`, borderRadius: 12, padding: '0 12px' }}>
          <Search size={16} color={textMuted} />
          <input
            type="text"
            placeholder="Search App #, Customer, Partner..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchCommissionApps()}
            style={{ border: 'none', background: 'transparent', padding: '10px 8px', color: textPrimary, fontSize: 13, width: '100%', outline: 'none' }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ background: isDark ? '#161616' : '#f8fafc', border: `1px solid ${border}`, borderRadius: 12, padding: '10px 14px', color: textPrimary, fontSize: 13, fontWeight: 600 }}
        >
          <option value="">All Commission Statuses</option>
          <option value="pending">Pending</option>
          <option value="held">Held</option>
          <option value="released">Released</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: textMuted }}>Loading commission records...</div>
        ) : applications.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: textMuted }}>No matching application commission records found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: isDark ? '#161616' : '#f8fafc', borderBottom: `1px solid ${border}`, color: textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '14px 16px' }}>Application</th>
                  <th style={{ padding: '14px 16px' }}>Customer</th>
                  <th style={{ padding: '14px 16px' }}>Partner</th>
                  <th style={{ padding: '14px 16px' }}>Process Type</th>
                  <th style={{ padding: '14px 16px' }}>Commission</th>
                  <th style={{ padding: '14px 16px' }}>Status</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => {
                  const commStatus = (app.commission_status || 'pending').toLowerCase();
                  const isReleased = commStatus === 'released';
                  const isHeld = commStatus === 'held' || commStatus === 'on_hold';
                  const isProc = processingId === app.id;

                  return (
                    <tr key={app.id} style={{ borderBottom: `1px solid ${border}` }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 800, color: textPrimary }}>#{app.app_number}</div>
                        <div style={{ fontSize: 11, color: textMuted }}>{app.product_name || 'Product'}</div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: textPrimary }}>{app.customer_name || 'Customer'}</div>
                        <div style={{ fontSize: 11, color: textMuted }}>{app.customer_mobile || app.mobile}</div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: textPrimary }}>{app.partner_name || app.partner_code || 'Partner'}</div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: '#3b82f615', color: '#3b82f6', textTransform: 'capitalize' }}>
                          {(app.process_type || 'lead_punching').replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: 15, fontWeight: 900, color: '#10b981' }}>₹{app.commission_amount || 0}</div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 800,
                          padding: '4px 10px',
                          borderRadius: 8,
                          background: isReleased ? '#10b98115' : isHeld ? '#ef444415' : '#f59e0b15',
                          color: isReleased ? '#10b981' : isHeld ? '#ef4444' : '#f59e0b',
                          textTransform: 'uppercase'
                        }}>
                          {commStatus}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          {!isReleased && (
                            <>
                              {!isHeld && (
                                <button
                                  disabled={isProc}
                                  onClick={() => handleHoldCommission(app.id, app.app_number)}
                                  style={{ padding: '7px 14px', borderRadius: 10, border: '1px solid #ef444440', background: '#ef444410', color: '#ef4444', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}
                                >
                                  [ HOLD ]
                                </button>
                              )}
                              <button
                                disabled={isProc}
                                onClick={() => handleReleaseCommission(app.id, app.app_number, app.commission_amount || 0)}
                                style={{ padding: '7px 14px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontWeight: 800, fontSize: 11, cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}
                              >
                                {isProc ? 'Processing...' : '[ RELEASE ]'}
                              </button>
                            </>
                          )}
                          {isReleased && (
                            <span style={{ fontSize: 11, color: '#10b981', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <CheckCircle2 size={14} /> Wallet Credited
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
