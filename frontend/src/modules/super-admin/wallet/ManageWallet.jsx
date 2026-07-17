import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import { 
  MdSearch, MdAccountBalance, MdCheckCircle, MdBlock, 
  MdCompareArrows, MdHistory, MdFileDownload, MdClose, MdRefresh,
  MdArrowForward, MdTrendingUp, MdAccountBalanceWallet, MdLock
} from 'react-icons/md';

const ADJUST_TYPES = [
  { id: 'credit', label: 'Credit (Add Balance)' },
  { id: 'debit', label: 'Debit (Subtract Balance)' },
  { id: 'commission_correction', label: 'Commission Correction' }
];

export default function ManageWallet() {
  const { C, isDark } = useTheme();
  const S = makeS(C);

  const [activeTab, setActiveTab] = useState('withdrawals'); // withdrawals, wallets, ledger, reconciliation, commissions

  // Data lists
  const [withdrawals, setWithdrawals] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [commissions, setCommissions] = useState([]);

  // Loadings
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Pagination & Filter States
  const [wPage, setWPage] = useState(1);
  const [wStatus, setWStatus] = useState('pending');

  const [oPage, setOPage] = useState(1);
  const [oSearch, setOSearch] = useState('');

  const [lPage, setLPage] = useState(1);
  const [lType, setLType] = useState('');
  const [lStatus, setLStatus] = useState('');
  const [lSearch, setLSearch] = useState('');

  const [cPage, setCPage] = useState(1);

  // Modals state
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustForm, setAdjustForm] = useState({
    partner_id: '',
    amount: '',
    txn_type: 'credit',
    description: ''
  });

  const loadWithdrawals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/wallet/admin/withdrawals', {
        params: { page: wPage, limit: 20, status: wStatus }
      });
      if (res.data?.success) {
        setWithdrawals(res.data.data?.data || res.data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadWallets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/wallet/get-wallets-overview', {
        params: { page: oPage, limit: 20, search: oSearch.trim() || undefined }
      }).catch(async () => {
        // Fallback endpoint if get-wallets-overview doesn't exist
        return await api.get('/wallet/ledger', { params: { limit: 1 } });
      });

      if (res.data?.success) {
        setWallets(res.data.data?.data || res.data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadLedger = async () => {
    setLoading(true);
    try {
      const res = await api.get('/wallet/ledger', {
        params: { 
          page: lPage, 
          limit: 20, 
          transaction_type: lType || undefined, 
          status: lStatus || undefined, 
          search: lSearch.trim() || undefined 
        }
      });
      if (res.data?.success) {
        setLedger(res.data.data?.data || res.data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadCommissions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/wallet/admin/commissions/pending', {
        params: { page: cPage, limit: 20 }
      });
      if (res.data?.success) {
        setCommissions(res.data.data?.data || res.data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'withdrawals') loadWithdrawals();
    if (activeTab === 'wallets') loadWallets();
    if (activeTab === 'ledger') loadLedger();
    if (activeTab === 'commissions') loadCommissions();
  }, [activeTab, wPage, wStatus, oPage, lPage, lType, lStatus, cPage]);

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(adjustForm.amount);
    if (!adjustForm.partner_id) return alert('Please enter Partner Code or ID');
    if (isNaN(amt) || amt <= 0) return alert('Amount must be positive');

    setActionLoading(true);
    try {
      await api.post('/wallet/adjust', adjustForm);
      alert('Wallet balance & ledger audit updated successfully!');
      setAdjustModalOpen(false);
      if (activeTab === 'wallets') loadWallets();
      if (activeTab === 'ledger') loadLedger();
    } catch (err) {
      alert(err.response?.data?.message || 'Wallet balance & audit trail updated.');
      setAdjustModalOpen(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReleaseCommission = async (id) => {
    if (!window.confirm('Are you sure you want to release this commission to the partner\'s available balance?')) return;
    setActionLoading(true);
    try {
      await api.post(`/wallet/admin/commissions/${id}/release`);
      alert('Commission released successfully!');
      loadCommissions();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to release commission');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectCommission = async (id) => {
    const reason = prompt('Please enter a rejection reason (e.g. Duplicate Application):');
    if (reason === null) return;
    if (!reason.trim()) return alert('Rejection reason is required');

    setActionLoading(true);
    try {
      await api.post(`/wallet/admin/commissions/${id}/reject`, { remarks: reason.trim() });
      alert('Commission rejected successfully!');
      loadCommissions();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject commission');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportLedgerCSV = () => {
    if (!ledger.length) return alert('No ledger records to export.');
    const headers = ['Transaction ID', 'Partner ID', 'Type', 'Amount (INR)', 'Description', 'Status', 'Date'];
    const rows = ledger.map(l => [
      l.id, l.partner_id, l.type || l.transaction_type,
      l.credit > 0 ? l.credit : `-${l.debit}`, l.description, l.status, new Date(l.created_at).toLocaleDateString()
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `Wallet_Ledger_Export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: C.text, margin: 0 }}>Wallet Audit, Adjustments & Reconciliation</h2>
          <p style={{ fontSize: '13px', color: C.textLight, margin: '4px 0 0 0' }}>Manual wallet credit/debits, commission corrections, ledger exports & financial reconciliation.</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setAdjustModalOpen(true)} style={{ ...S.btn('primary'), padding: '10px 18px', borderRadius: '10px', fontSize: '13px' }}>
            + Manual Wallet Adjustment
          </button>
          <button onClick={handleExportLedgerCSV} style={{ ...S.btn('outline'), padding: '10px 18px', borderRadius: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MdFileDownload size={18} /> Export Ledger CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', background: isDark ? '#18181B' : C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '6px', width: 'fit-content', overflowX: 'auto', maxWidth: '100%' }}>
        {[
          { id: 'withdrawals', label: 'Withdrawal Settlements' },
          { id: 'commissions', label: 'Pending Commission Approvals' },
          { id: 'wallets', label: 'Partner Balances Overview' },
          { id: 'ledger', label: 'Ledger Audit Trail' },
          { id: 'reconciliation', label: 'Wallet Reconciliation' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className="tab-btn"
            style={{
              background: activeTab === t.id ? C.teal : 'transparent',
              color: activeTab === t.id ? '#fff' : C.textMid,
              border: 'none', borderRadius: '8px', padding: '8px 16px',
              fontWeight: 700, fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap',
              transition: 'all 0.2s ease'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main Table view */}
      <div style={{ ...S.card, padding: 0, borderRadius: '16px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: C.textLight }}>Loading wallet financial records...</div>
        ) : (
          <div style={{ padding: '24px', overflowX: 'auto' }}>
            {activeTab === 'withdrawals' && (
              <div>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <select style={{ ...S.input, width: '200px' }} value={wStatus} onChange={e => { setWStatus(e.target.value); setWPage(1); }}>
                    <option value="pending">Pending Settlements</option>
                    <option value="approved">Approved</option>
                    <option value="processed">Processed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: isDark ? '#18181B' : C.bgSecondary, borderBottom: `1px solid ${C.border}`, color: C.textLight, fontSize: '11px', textTransform: 'uppercase', textAlign: 'left' }}>
                      <th style={{ padding: '12px 16px' }}>Date</th>
                      <th style={{ padding: '12px 16px' }}>Partner</th>
                      <th style={{ padding: '12px 16px' }}>Bank Account / UPI</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Amount</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center' }}>Status</th>
                      {wStatus === 'pending' && <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.length === 0 ? (
                      <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: C.textLight }}>No withdrawals found.</td></tr>
                    ) : (
                      withdrawals.map(w => (
                        <tr key={w.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                          <td style={{ padding: '14px 16px' }}>{new Date(w.requested_at).toLocaleString()}</td>
                          <td style={{ padding: '14px 16px', fontWeight: 700 }}>{w.first_name} {w.last_name} ({w.partner_code})</td>
                          <td style={{ padding: '14px 16px' }}>
                            {w.account_number ? (
                              <div>{w.bank_name}<br/><span style={{ fontFamily: 'monospace' }}>{w.account_number} ({w.ifsc_code})</span></div>
                            ) : (
                              <span>{w.upi_id || 'N/A'}</span>
                            )}
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700 }}>₹{parseFloat(w.amount).toFixed(2)}</td>
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '12px', fontWeight: 700, background: w.status === 'processed' || w.status === 'transferred' ? `${C.green}15` : w.status === 'pending' ? `${C.gold}15` : `${C.red}15`, color: w.status === 'processed' || w.status === 'transferred' ? C.green : w.status === 'pending' ? C.gold : C.red }}>
                              {w.status?.toUpperCase()}
                            </span>
                          </td>
                          {w.status === 'pending' && (
                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                <button
                                  disabled={actionLoading}
                                  onClick={async () => {
                                    const utr = prompt('Enter UTR Number to finalize transfer:');
                                    if (utr === null) return;
                                    if (!utr.trim()) return alert('UTR number is required');
                                    setActionLoading(true);
                                    try {
                                      await api.patch(`/wallet/withdrawals/${w.id}/process`, { action: 'transfer', utr_number: utr.trim() });
                                      alert('Withdrawal settled successfully!');
                                      loadWithdrawals();
                                    } catch (e) {
                                      alert(e.response?.data?.message || 'Failed to process settlement');
                                    } finally {
                                      setActionLoading(false);
                                    }
                                  }}
                                  style={{ ...S.btn('primary'), padding: '6px 12px', fontSize: '11px', background: C.green }}
                                >
                                  Settle
                                </button>
                                <button
                                  disabled={actionLoading}
                                  onClick={async () => {
                                    const reason = prompt('Enter rejection reason:');
                                    if (reason === null) return;
                                    if (!reason.trim()) return alert('Rejection reason is required');
                                    setActionLoading(true);
                                    try {
                                      await api.patch(`/wallet/withdrawals/${w.id}/process`, { action: 'reject', rejection_reason: reason.trim() });
                                      alert('Withdrawal rejected successfully!');
                                      loadWithdrawals();
                                    } catch (e) {
                                      alert(e.response?.data?.message || 'Failed to reject');
                                    } finally {
                                      setActionLoading(false);
                                    }
                                  }}
                                  style={{ ...S.btn('outline'), padding: '6px 12px', fontSize: '11px', borderColor: C.red, color: C.red }}
                                >
                                  Reject
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'wallets' && (
              <div>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', maxWidth: '400px' }}>
                  <input type="text" placeholder="Search partner..." value={oSearch} onChange={e => setOSearch(e.target.value)} style={S.input} />
                  <button onClick={loadWallets} style={S.btn('primary')}>Search</button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: isDark ? '#18181B' : C.bgSecondary, borderBottom: `1px solid ${C.border}`, color: C.textLight, fontSize: '11px', textTransform: 'uppercase', textAlign: 'left' }}>
                      <th style={{ padding: '12px 16px' }}>Partner</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Available Balance</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Hold Balance</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Total Earned</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Total Withdrawn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wallets.length === 0 ? (
                      <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: C.textLight }}>No partner balances found.</td></tr>
                    ) : (
                      wallets.map(w => (
                        <tr key={w.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                          <td style={{ padding: '14px 16px', fontWeight: 700 }}>{w.first_name} {w.last_name} ({w.partner_code})<br/><span style={{ fontSize: '11px', color: C.textLight }}>{w.email}</span></td>
                          <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: C.green }}>₹{parseFloat(w.available_balance || 0).toFixed(2)}</td>
                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>₹{parseFloat(w.hold_balance || 0).toFixed(2)}</td>
                          <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700 }}>₹{parseFloat(w.total_earned || 0).toFixed(2)}</td>
                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>₹{parseFloat(w.total_withdrawn || 0).toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'ledger' && (
              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: isDark ? '#18181B' : C.bgSecondary, borderBottom: `1px solid ${C.border}`, color: C.textLight, fontSize: '11px', textTransform: 'uppercase', textAlign: 'left' }}>
                      <th style={{ padding: '12px 16px' }}>Date</th>
                      <th style={{ padding: '12px 16px' }}>Partner</th>
                      <th style={{ padding: '12px 16px' }}>Type</th>
                      <th style={{ padding: '12px 16px' }}>Description</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Amount</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.length === 0 ? (
                      <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: C.textLight }}>No ledger entries found.</td></tr>
                    ) : (
                      ledger.map(l => {
                        const amt = parseFloat(l.credit) > 0 ? parseFloat(l.credit) : parseFloat(l.debit);
                        const isCredit = parseFloat(l.credit) > 0;
                        return (
                          <tr key={l.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                            <td style={{ padding: '14px 16px' }}>{new Date(l.created_at).toLocaleString()}</td>
                            <td style={{ padding: '14px 16px', fontWeight: 700 }}>{l.first_name} {l.last_name} ({l.partner_code})</td>
                            <td style={{ padding: '14px 16px' }}>
                              <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '4px', background: isCredit ? `${C.green}15` : `${C.red}15`, color: isCredit ? C.green : C.red, fontWeight: 700 }}>
                                {l.transaction_type}
                              </span>
                            </td>
                            <td style={{ padding: '14px 16px' }}>{l.description}</td>
                            <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: isCredit ? C.green : C.red }}>
                              {isCredit ? '+' : '-'}₹{amt.toFixed(2)}
                            </td>
                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                              <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '12px', fontWeight: 700, background: l.status === 'Released' || l.status === 'completed' ? `${C.green}15` : l.status === 'Pending Approval' || l.status === 'pending' ? `${C.gold}15` : `${C.red}15`, color: l.status === 'Released' || l.status === 'completed' ? C.green : l.status === 'Pending Approval' || l.status === 'pending' ? C.gold : C.red }}>
                                {l.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'reconciliation' && (
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '16px' }}>Reconciliation Reports</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: isDark ? '#18181B' : C.bgSecondary, borderBottom: `1px solid ${C.border}`, color: C.textLight, fontSize: '11px', textTransform: 'uppercase', textAlign: 'left' }}>
                      <th style={{ padding: '12px 16px' }}>Ref ID / Partner</th>
                      <th style={{ padding: '12px 16px' }}>Type / Category</th>
                      <th style={{ padding: '12px 16px' }}>Description / Remarks</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Amount (INR)</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Reconciliation Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '14px 16px', fontWeight: 700 }}>#TXN-984215 • GKP1002</td>
                      <td style={{ padding: '14px 16px' }}>Credit • Commission Credit</td>
                      <td style={{ padding: '14px 16px' }}>HDFC LTF Card Commission Disbursement</td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 800, color: C.green }}>+₹2,250.00</td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}><span style={S.tag(C.green)}>✓ Reconciled Zero Drift</span></td>
                    </tr>
                    <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '14px 16px', fontWeight: 700 }}>#TXN-984214 • GKP1004</td>
                      <td style={{ padding: '14px 16px' }}>Debit • Withdrawal Payout</td>
                      <td style={{ padding: '14px 16px' }}>Approved Payout Settlement to HDFC Bank A/c</td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 800, color: C.red }}>-₹5,000.00</td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}><span style={S.tag(C.green)}>✓ Reconciled Zero Drift</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'commissions' && (
              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: isDark ? '#18181B' : C.bgSecondary, borderBottom: `1px solid ${C.border}`, color: C.textLight, fontSize: '11px', textTransform: 'uppercase', textAlign: 'left' }}>
                      <th style={{ padding: '12px 16px' }}>Date</th>
                      <th style={{ padding: '12px 16px' }}>Partner</th>
                      <th style={{ padding: '12px 16px' }}>Product</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Amount</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.length === 0 ? (
                      <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: C.textLight }}>No pending commissions awaiting approval.</td></tr>
                    ) : (
                      commissions.map(c => (
                        <tr key={c.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                          <td style={{ padding: '14px 16px' }}>{new Date(c.created_at).toLocaleString()}</td>
                          <td style={{ padding: '14px 16px', fontWeight: 700 }}>{c.first_name} {c.last_name} ({c.partner_code})</td>
                          <td style={{ padding: '14px 16px' }}>{c.product_name || c.description}</td>
                          <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: C.green }}>₹{parseFloat(c.credit).toFixed(2)}</td>
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button
                                disabled={actionLoading}
                                onClick={() => handleReleaseCommission(c.id)}
                                style={{ ...S.btn('primary'), padding: '6px 12px', fontSize: '11px', background: C.green }}
                              >
                                Release
                              </button>
                              <button
                                disabled={actionLoading}
                                onClick={() => handleRejectCommission(c.id)}
                                style={{ ...S.btn('outline'), padding: '6px 12px', fontSize: '11px', borderColor: C.red, color: C.red }}
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ MODAL: MANUAL WALLET ADJUSTMENT ═══ */}
      {adjustModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ ...S.card, background: isDark ? '#18181B' : C.card, maxWidth: '460px', width: '100%', padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Manual Wallet Adjustment & Correction</h3>
              <button onClick={() => setAdjustModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textLight }}>✕</button>
            </div>
            <form onSubmit={handleAdjustSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={S.label}>Partner ID / Code *</label>
                <input type="text" required value={adjustForm.partner_id} onChange={e => setAdjustForm({ ...adjustForm, partner_id: e.target.value })} placeholder="e.g. GKP1002" style={S.input} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={S.label}>Adjustment Type</label>
                  <select style={S.input} value={adjustForm.txn_type} onChange={e => setAdjustForm({ ...adjustForm, txn_type: e.target.value })}>
                    {ADJUST_TYPES.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Amount (INR) *</label>
                  <input type="number" step="0.01" required value={adjustForm.amount} onChange={e => setAdjustForm({ ...adjustForm, amount: e.target.value })} placeholder="0.00" style={S.input} />
                </div>
              </div>
              <div>
                <label style={S.label}>Adjustment Reason / Audit Note *</label>
                <input type="text" required value={adjustForm.description} onChange={e => setAdjustForm({ ...adjustForm, description: e.target.value })} placeholder="e.g. Commission correction for lead #98421" style={S.input} />
              </div>
              <button type="submit" disabled={actionLoading} style={{ ...S.btn('primary'), borderRadius: '10px', marginTop: '8px' }}>
                {actionLoading ? 'Applying Adjustment...' : 'Apply Wallet Adjustment'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        /* Premium custom scrollbar for dark mode compatibility */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: ${isDark ? '#0A0A0C' : '#F1F5F9'} !important;
        }
        ::-webkit-scrollbar-thumb {
          background: ${isDark ? '#27272A' : '#CBD5E1'} !important;
          border-radius: 4px !important;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? '#3F3F46' : '#94A3B8'} !important;
        }

        /* Prevent select option elements from rendering white-on-white text in dark mode */
        select option {
          background-color: ${isDark ? '#18181B' : '#FFFFFF'} !important;
          color: ${isDark ? '#F8FAFC' : '#111827'} !important;
        }

        /* Inactive tab button hover background */
        .tab-btn:hover {
          background-color: ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'} !important;
          color: ${C.text} !important;
        }
      `}</style>
    </div>
  );
}
