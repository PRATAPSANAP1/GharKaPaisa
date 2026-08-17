import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  const [searchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState(urlTab || 'withdrawals'); // withdrawals, wallets, ledger, reconciliation, commissions

  // Data lists
  const [withdrawals, setWithdrawals] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [reconciliationData, setReconciliationData] = useState(null);

  // RazorpayX Account & Payout State
  const [razorpayData, setRazorpayData] = useState(null);
  const [razorpayLoading, setRazorpayLoading] = useState(false);
  const [razorpayModalOpen, setRazorpayModalOpen] = useState(false);
  const [payForm, setPayForm] = useState({
    withdrawal: null,
    mode: 'IMPS',
    narration: 'GharKaPaisa Commission'
  });

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
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustForm, setAdjustForm] = useState({
    partner_id: '',
    amount: '',
    txn_type: 'credit',
    description: ''
  });

  const loadRazorpayAccount = async () => {
    setRazorpayLoading(true);
    try {
      const res = await api.get('/wallet/admin/razorpay/balance');
      if (res.data?.success) {
        setRazorpayData(res.data.data);
      }
    } catch (e) {
      console.error('Failed to load Razorpay account summary', e);
    } finally {
      setRazorpayLoading(false);
    }
  };

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
      const res = await api.get('/superadmin/wallet/overview', {
        params: { page: oPage, limit: 20, search: oSearch.trim() || undefined }
      }).catch(async () => {
        // Fallback endpoint if overview doesn't exist
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

  const loadReconciliation = async () => {
    setLoading(true);
    try {
      const res = await api.get('/wallet/reconciliation');
      if (res.data?.success) {
        setReconciliationData(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRazorpayAccount();
  }, []);

  useEffect(() => {
    if (activeTab === 'withdrawals') loadWithdrawals();
    if (activeTab === 'wallets') loadWallets();
    if (activeTab === 'ledger') loadLedger();
    if (activeTab === 'commissions') loadCommissions();
    if (activeTab === 'reconciliation') loadReconciliation();
  }, [activeTab, wPage, wStatus, oPage, oSearch, lPage, lType, lStatus, lSearch, cPage]);

  const handleOpenPayModal = (withdrawal) => {
    setPayForm({
      withdrawal,
      mode: 'IMPS',
      narration: 'GharKaPaisa Commission'
    });
    setRazorpayModalOpen(true);
  };

  const handleConfirmRazorpayPayment = async () => {
    if (!payForm.withdrawal) return;
    setActionLoading(true);
    try {
      await api.patch(`/wallet/withdrawals/${payForm.withdrawal.id}/process`, {
        action: 'transfer',
        mode: payForm.mode,
        narration: payForm.narration
      });
      alert('Razorpay bank payout initiated successfully!');
      setRazorpayModalOpen(false);
      if (selectedWithdrawal) setSelectedWithdrawal(null);
      loadWithdrawals();
      loadRazorpayAccount();
    } catch (e) {
      alert(e.response?.data?.message || 'Razorpay payout failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post('/wallet/admin/adjust', adjustForm);
      alert('Wallet adjustment applied successfully!');
      setAdjustModalOpen(false);
      setAdjustForm({ partner_id: '', amount: '', txn_type: 'credit', description: '' });
      if (activeTab === 'wallets') loadWallets();
      if (activeTab === 'ledger') loadLedger();
      loadRazorpayAccount();
    } catch (err) {
      alert(err.response?.data?.message || 'Adjustment failed');
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
    if (!ledger.length) return alert('No ledger data to export');
    const headers = ['ID', 'Date', 'Partner Code', 'Type', 'Credit', 'Debit', 'Status', 'Description'];
    const rows = ledger.map(l => [
      l.id,
      new Date(l.created_at).toLocaleString(),
      l.partner_code || '',
      l.transaction_type,
      l.credit || 0,
      l.debit || 0,
      l.status,
      `"${(l.description || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GharKaPaisa_Ledger_Export_${new Date().toISOString().slice(0, 10)}.csv`);
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

      {/* RazorpayX & Ledger Wallet Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        
        {/* Card 1: Company RazorpayX Payout Account Balance */}
        <div style={{ ...S.card, padding: '20px', borderRadius: '16px', background: isDark ? '#18181B' : '#FFFFFF', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '6px', height: '100%', background: C.teal }}></div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: C.teal, letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>⚡ RAZORPAYX PAYOUT ACCOUNT</span>
                <span style={{ fontSize: '10px', background: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                  {razorpayData?.account_status || 'CONNECTED'}
                </span>
              </div>
              <button
                onClick={loadRazorpayAccount}
                disabled={razorpayLoading}
                style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: '6px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer', color: C.textMid }}
              >
                {razorpayLoading ? 'Syncing...' : '↻ Refresh'}
              </button>
            </div>
            <div style={{ fontSize: '26px', fontWeight: 900, color: C.text, margin: '6px 0 2px 0' }}>
              ₹{parseFloat(razorpayData?.available_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '12px', color: C.textLight }}>
              Actual liquid funds available in company's RazorpayX account for payouts
            </div>
          </div>
          
          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: C.textMid }}>
            <div>Account: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{razorpayData?.account_number || 'RAZORPAYX_ACC'}</span></div>
            <div>Mode: <strong>{razorpayData?.is_simulated ? 'Simulator Mode' : 'Live API'}</strong></div>
          </div>
        </div>

        {/* Card 2: Internal GharKaPaisa Partner Liability Wallet */}
        <div style={{ ...S.card, padding: '20px', borderRadius: '16px', background: isDark ? '#18181B' : '#FFFFFF', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '6px', height: '100%', background: C.gold }}></div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: C.gold, letterSpacing: '0.5px', marginBottom: '8px' }}>
              🏛️ GHARKAPAISA PARTNER LIABILITY
            </div>
            <div style={{ fontSize: '26px', fontWeight: 900, color: C.text, margin: '6px 0 2px 0' }}>
              ₹{parseFloat(razorpayData?.partner_liability || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '12px', color: C.textLight }}>
              Total partner available balances owed across GharKaPaisa internal ledger
            </div>
          </div>

          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: `1px solid ${C.border}`, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '11px', textAlign: 'center' }}>
            <div style={{ background: isDark ? '#27272A' : '#F8FAFC', padding: '6px', borderRadius: '6px' }}>
              <div style={{ color: C.textLight, fontSize: '10px' }}>TODAY'S PAYOUTS</div>
              <strong style={{ color: C.green }}>₹{parseFloat(razorpayData?.todays_payouts || 0).toLocaleString('en-IN')}</strong>
            </div>
            <div style={{ background: isDark ? '#27272A' : '#F8FAFC', padding: '6px', borderRadius: '6px' }}>
              <div style={{ color: C.textLight, fontSize: '10px' }}>PENDING</div>
              <strong style={{ color: C.gold }}>₹{parseFloat(razorpayData?.pending_payouts || 0).toLocaleString('en-IN')}</strong>
            </div>
            <div style={{ background: isDark ? '#27272A' : '#F8FAFC', padding: '6px', borderRadius: '6px' }}>
              <div style={{ color: C.textLight, fontSize: '10px' }}>FAILED</div>
              <strong style={{ color: C.red }}>₹{parseFloat(razorpayData?.failed_payouts || 0).toLocaleString('en-IN')}</strong>
            </div>
          </div>
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
                      <tr><td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: C.textLight }}>No withdrawals found.</td></tr>
                    ) : (
                      withdrawals.map(w => (
                        <tr key={w.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                          <td style={{ padding: '14px 16px' }}>{new Date(w.requested_at).toLocaleString()}</td>
                          <td style={{ padding: '14px 16px', fontWeight: 700 }}>
                            {w.first_name} {w.last_name}
                            <div style={{ fontSize: '11px', color: C.textLight, fontFamily: 'monospace' }}>{w.partner_code}</div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            {w.account_number ? (
                              <div>{w.bank_name}<br/><span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{w.account_number} ({w.ifsc_code})</span></div>
                            ) : (
                              <span>{w.upi_id || 'N/A'}</span>
                            )}
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700 }}>
                            ₹{parseFloat(w.amount).toFixed(2)}
                            {w.net_amount && (
                              <div style={{ fontSize: '10px', color: C.green }}>Net: ₹{parseFloat(w.net_amount).toFixed(2)}</div>
                            )}
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '12px', fontWeight: 700, background: w.status === 'processed' || w.status === 'transferred' ? `${C.green}15` : w.status === 'pending' ? `${C.gold}15` : `${C.red}15`, color: w.status === 'processed' || w.status === 'transferred' ? C.green : w.status === 'pending' ? C.gold : C.red }}>
                              {w.status?.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
                              <button
                                onClick={() => setSelectedWithdrawal(w)}
                                style={{ ...S.btn('outline'), padding: '6px 10px', fontSize: '11px', color: C.primary, borderColor: C.primary }}
                              >
                                Review / Details
                              </button>
                              
                              {/* If payment is already done (processed/transferred/approved), hide Mark Paid button and display UTR Badge */}
                              {(w.status === 'processed' || w.status === 'transferred' || w.status === 'approved') && (
                                <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '12px', fontWeight: 700, background: `${C.green}15`, color: C.green, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  ✓ Paid {w.utr || w.utr_number ? `(UTR: ${w.utr || w.utr_number})` : '(Auto-Settled)'}
                                </span>
                              )}

                              {w.status === 'pending' && (
                                <>
                                  <button
                                    disabled={actionLoading}
                                    onClick={() => handleOpenPayModal(w)}
                                    style={{ ...S.btn('primary'), padding: '6px 10px', fontSize: '11px', background: C.teal, display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                  >
                                    ⚡ Pay via Razorpay
                                  </button>
                                  <button
                                    disabled={actionLoading}
                                    onClick={async () => {
                                      const utrInput = prompt('Enter UTR Number to mark as paid (or leave blank to auto-generate):');
                                      if (utrInput === null) return;
                                      setActionLoading(true);
                                      try {
                                        const res = await api.patch(`/wallet/withdrawals/${w.id}/process`, { action: 'transfer', utr_number: utrInput.trim() || undefined });
                                        alert(res.data?.message || 'Withdrawal settled automatically & SMS sent to partner!');
                                        loadWithdrawals();
                                        loadRazorpayAccount();
                                      } catch (e) {
                                        alert(e.response?.data?.message || 'Failed to process settlement');
                                      } finally {
                                        setActionLoading(false);
                                      }
                                    }}
                                    style={{ ...S.btn('primary'), padding: '6px 10px', fontSize: '11px', background: C.green }}
                                  >
                                    Mark Paid (UTR)
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
                                    style={{ ...S.btn('outline'), padding: '6px 10px', fontSize: '11px', borderColor: C.red, color: C.red }}
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>System Wallet Reconciliation Audit</h3>
                  {reconciliationData && (
                    <div style={{ fontSize: '12px', color: C.textLight }}>
                      Total Reconciled Partners: <strong>{reconciliationData.total_reconciled || 0}</strong> • Discrepancies: <strong style={{ color: reconciliationData.discrepancies > 0 ? C.red : C.green }}>{reconciliationData.discrepancies || 0}</strong>
                    </div>
                  )}
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: isDark ? '#18181B' : C.bgSecondary, borderBottom: `1px solid ${C.border}`, color: C.textLight, fontSize: '11px', textTransform: 'uppercase', textAlign: 'left' }}>
                      <th style={{ padding: '12px 16px' }}>Partner</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Wallet Balance</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Ledger Balance</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Discrepancy Drift</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center' }}>Audit Status</th>
                      <th style={{ padding: '12px 16px' }}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!reconciliationData?.records || reconciliationData.records.length === 0 ? (
                      <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: C.textLight }}>No reconciliation discrepancy logs recorded yet. All accounts zero drift.</td></tr>
                    ) : (
                      reconciliationData.records.map((r, i) => (
                        <tr key={r.id || i} style={{ borderBottom: `1px solid ${C.border}` }}>
                          <td style={{ padding: '14px 16px', fontWeight: 700 }}>{r.first_name} {r.last_name} ({r.partner_code})</td>
                          <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700 }}>₹{parseFloat(r.wallet_balance || 0).toFixed(2)}</td>
                          <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700 }}>₹{parseFloat(r.ledger_balance || 0).toFixed(2)}</td>
                          <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 800, color: parseFloat(r.discrepancy || 0) > 0 ? C.red : C.green }}>
                            ₹{parseFloat(r.discrepancy || 0).toFixed(2)}
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '12px', fontWeight: 800, background: r.status === 'matched' ? `${C.green}15` : `${C.red}15`, color: r.status === 'matched' ? C.green : C.red }}>
                              {r.status === 'matched' ? '✓ RECONCILED MATCH' : '⚠️ DISCREPANCY DETECTED'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '12px', color: C.textLight }}>{r.notes || 'Daily audit verified'}</td>
                        </tr>
                      ))
                    )}
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

      {/* Detailed Withdrawal Modal */}
      {selectedWithdrawal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ ...S.card, width: '100%', maxWidth: '600px', borderRadius: '16px', border: `1px solid ${C.border}`, padding: '24px', maxHeight: '90vh', overflowY: 'auto', background: isDark ? '#18181B' : '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: `1px solid ${C.border}`, pb: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: C.text }}>Withdrawal Details</h3>
                <span style={{ fontSize: '11px', color: C.textLight }}>ID: {selectedWithdrawal.id}</span>
              </div>
              <button onClick={() => setSelectedWithdrawal(null)} style={{ background: 'none', border: 'none', color: C.textLight, cursor: 'pointer' }}>
                <MdClose size={22} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              {/* Partner Info */}
              <div style={{ background: isDark ? '#27272A' : '#F8FAFC', padding: '14px', borderRadius: '10px', border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: C.textLight, fontWeight: 700, marginBottom: '6px' }}>Partner Info</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: C.text }}>{selectedWithdrawal.first_name} {selectedWithdrawal.last_name}</div>
                <div style={{ fontSize: '12px', color: C.textLight, fontFamily: 'monospace' }}>Code: {selectedWithdrawal.partner_code}</div>
              </div>

              {/* Amount & Status */}
              <div style={{ background: isDark ? '#27272A' : '#F8FAFC', padding: '14px', borderRadius: '10px', border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: C.textLight, fontWeight: 700, marginBottom: '6px' }}>Financial Breakdown</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: C.primary }}>₹{parseFloat(selectedWithdrawal.amount).toFixed(2)}</div>
                <div style={{ fontSize: '11px', color: C.textLight }}>2% TDS: ₹{parseFloat(selectedWithdrawal.tds_amount || (selectedWithdrawal.amount * 0.02)).toFixed(2)}</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: C.green }}>Net Payout: ₹{parseFloat(selectedWithdrawal.net_amount || (selectedWithdrawal.amount * 0.98)).toFixed(2)}</div>
              </div>
            </div>

            {/* Bank Details */}
            <div style={{ background: isDark ? '#27272A' : '#F8FAFC', padding: '14px', borderRadius: '10px', border: `1px solid ${C.border}`, marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: C.textLight, fontWeight: 700, marginBottom: '6px' }}>Bank Destination</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                <div><span style={{ color: C.textLight }}>Bank Name:</span> <strong>{selectedWithdrawal.bank_name || 'N/A'}</strong></div>
                <div><span style={{ color: C.textLight }}>Account Number:</span> <strong style={{ fontFamily: 'monospace' }}>{selectedWithdrawal.account_number || 'N/A'}</strong></div>
                <div><span style={{ color: C.textLight }}>IFSC Code:</span> <strong style={{ fontFamily: 'monospace' }}>{selectedWithdrawal.ifsc_code || selectedWithdrawal.ifsc || 'N/A'}</strong></div>
                <div><span style={{ color: C.textLight }}>Status:</span> <strong style={{ color: C.green }}>VERIFIED ✅</strong></div>
              </div>
            </div>

            {/* Razorpay Audit Identifiers */}
            <div style={{ background: isDark ? '#27272A' : '#F8FAFC', padding: '14px', borderRadius: '10px', border: `1px solid ${C.border}`, marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: C.textLight, fontWeight: 700, marginBottom: '6px' }}>RazorpayX Audit Identifiers</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', fontFamily: 'monospace' }}>
                <div><span style={{ color: C.textLight }}>Contact ID:</span> {selectedWithdrawal.razorpay_contact_id || 'Pending'}</div>
                <div><span style={{ color: C.textLight }}>Fund Account ID:</span> {selectedWithdrawal.razorpay_fund_account_id || 'Pending'}</div>
                <div><span style={{ color: C.textLight }}>Payout ID:</span> {selectedWithdrawal.razorpay_payout_id || 'Pending'}</div>
                <div><span style={{ color: C.textLight }}>UTR:</span> {selectedWithdrawal.utr || 'Pending'}</div>
              </div>
            </div>

            {/* Decision & Action Bar */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedWithdrawal(null)}
                style={{ ...S.btn('outline'), padding: '8px 14px', fontSize: '12px' }}
              >
                Close
              </button>
              {selectedWithdrawal.status === 'pending' && (
                <>
                  <button
                    disabled={actionLoading}
                    onClick={async () => {
                      const reason = prompt('Enter rejection reason:');
                      if (reason === null) return;
                      if (!reason.trim()) return alert('Rejection reason is required');
                      setActionLoading(true);
                      try {
                        await api.patch(`/wallet/withdrawals/${selectedWithdrawal.id}/process`, { action: 'reject', rejection_reason: reason.trim() });
                        alert('Withdrawal rejected successfully!');
                        setSelectedWithdrawal(null);
                        loadWithdrawals();
                      } catch (e) {
                        alert(e.response?.data?.message || 'Failed to reject');
                      } finally {
                        setActionLoading(false);
                      }
                    }}
                    style={{ ...S.btn('outline'), borderColor: C.red, color: C.red, padding: '8px 14px', fontSize: '12px' }}
                  >
                    Reject Request
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleOpenPayModal(selectedWithdrawal)}
                    style={{ ...S.btn('primary'), background: C.teal, padding: '8px 14px', fontSize: '12px' }}
                  >
                    ⚡ Approve & Pay Payout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL: CONFIRM RAZORPAY PAYMENT ═══ */}
      {razorpayModalOpen && payForm.withdrawal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '16px' }}>
          <div style={{ ...S.card, background: isDark ? '#18181B' : '#FFFFFF', maxWidth: '520px', width: '100%', padding: '24px', borderRadius: '16px', border: `1px solid ${C.border}` }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: `1px solid ${C.border}`, paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: C.text }}>Confirm Razorpay Payment</h3>
                <span style={{ fontSize: '12px', color: C.textLight }}>Business Account to Beneficiary Bank Payout</span>
              </div>
              <button onClick={() => setRazorpayModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textLight }}><MdClose size={22} /></button>
            </div>

            {/* Breakdown Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: isDark ? '#27272A' : '#F8FAFC', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '11px', color: C.textLight, textTransform: 'uppercase', fontWeight: 700 }}>Partner</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: C.text }}>{payForm.withdrawal.first_name} {payForm.withdrawal.last_name}</div>
                  <div style={{ fontSize: '11px', color: C.textLight, fontFamily: 'monospace' }}>{payForm.withdrawal.partner_code}</div>
                </div>
                <div style={{ background: isDark ? '#27272A' : '#F8FAFC', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '11px', color: C.textLight, textTransform: 'uppercase', fontWeight: 700 }}>Payout Amount</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: C.primary }}>₹{parseFloat(payForm.withdrawal.amount).toFixed(2)}</div>
                  <div style={{ fontSize: '11px', color: C.green }}>Net: ₹{parseFloat(payForm.withdrawal.net_amount || (payForm.withdrawal.amount * 0.98)).toFixed(2)}</div>
                </div>
              </div>

              {/* Bank & Razorpay Identifiers */}
              <div style={{ background: isDark ? '#27272A' : '#F8FAFC', padding: '12px', borderRadius: '10px', fontSize: '12px' }}>
                <div style={{ fontSize: '11px', color: C.textLight, textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>Destination Bank Account</div>
                <div><strong>Bank:</strong> {payForm.withdrawal.bank_name || 'N/A'}</div>
                <div><strong>Account:</strong> <span style={{ fontFamily: 'monospace' }}>{payForm.withdrawal.account_number || 'N/A'}</span></div>
                <div><strong>IFSC:</strong> <span style={{ fontFamily: 'monospace' }}>{payForm.withdrawal.ifsc_code || payForm.withdrawal.ifsc || 'N/A'}</span></div>
                {payForm.withdrawal.razorpay_contact_id && (
                  <div style={{ marginTop: '4px', fontSize: '11px', color: C.textLight, fontFamily: 'monospace' }}>Contact ID: {payForm.withdrawal.razorpay_contact_id}</div>
                )}
              </div>

              {/* Mode Selector */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: C.text, display: 'block', marginBottom: '6px' }}>Transfer Mode</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  {['IMPS', 'NEFT', 'RTGS'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPayForm({ ...payForm, mode: m })}
                      style={{
                        padding: '8px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                        border: `1px solid ${payForm.mode === m ? C.teal : C.border}`,
                        background: payForm.mode === m ? `${C.teal}15` : (isDark ? '#27272A' : '#FFF'),
                        color: payForm.mode === m ? C.teal : C.text,
                        cursor: 'pointer'
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Narration */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: C.text, display: 'block', marginBottom: '4px' }}>Payout Narration</label>
                <input
                  type="text"
                  value={payForm.narration}
                  onChange={e => setPayForm({ ...payForm, narration: e.target.value })}
                  style={{ ...S.input, fontSize: '13px' }}
                />
              </div>

              {/* Razorpay Balance Indicator */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', background: isDark ? '#27272A' : '#EFF6FF', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${C.border}` }}>
                <span style={{ color: C.textLight }}>Available RazorpayX Balance:</span>
                <strong style={{ color: (razorpayData?.available_balance || 0) < payForm.withdrawal.amount ? C.red : C.green }}>
                  ₹{parseFloat(razorpayData?.available_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </strong>
              </div>

              {/* Warning Notice */}
              <div style={{ fontSize: '12px', color: '#D97706', background: '#FEF3C7', padding: '10px 12px', borderRadius: '8px', border: '1px solid #FCD34D' }}>
                ⚠ <strong>This payment will transfer real money to the partner's bank account.</strong>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setRazorpayModalOpen(false)} style={{ ...S.btn('outline'), padding: '10px 16px', fontSize: '13px' }}>Cancel</button>
              <button
                disabled={actionLoading || (razorpayData?.available_balance || 0) < payForm.withdrawal.amount}
                onClick={handleConfirmRazorpayPayment}
                style={{ ...S.btn('primary'), background: C.teal, padding: '10px 20px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                {actionLoading ? 'Initiating Payout...' : 'Confirm & Pay'}
              </button>
            </div>
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
