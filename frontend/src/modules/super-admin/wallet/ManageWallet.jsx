import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import { 
  MdSearch, MdAccountBalance, MdCheckCircle, MdBlock, 
  MdCompareArrows, MdHistory, MdFileDownload, MdClose 
} from 'react-icons/md';

const ADJUST_TYPES = [
  { id: 'credit', label: 'Credit (Add Balance)' },
  { id: 'debit', label: 'Debit (Subtract Balance)' }
];

export default function ManageWallet() {
  const { C } = useTheme();
  const S = makeS(C);

  const [activeTab, setActiveTab] = useState('withdrawals'); // withdrawals, wallets, ledger

  // Data lists
  const [withdrawals, setWithdrawals] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [ledger, setLedger] = useState([]);

  // Loadings
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Pagination & Filter States
  const [wPage, setWPage] = useState(1);
  const [wTotalPages, setWTotalPages] = useState(1);
  const [wStatus, setWStatus] = useState('pending');

  const [oPage, setOPage] = useState(1);
  const [oTotalPages, setOTotalPages] = useState(1);
  const [oSearch, setOSearch] = useState('');

  const [lPage, setLPage] = useState(1);
  const [lTotalPages, setLTotalPages] = useState(1);
  const [lType, setLType] = useState('');
  const [lStatus, setLStatus] = useState('');
  const [lSearch, setLSearch] = useState('');

  // Modals state
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustForm, setAdjustForm] = useState({
    partner_id: '',
    amount: '',
    txn_type: 'credit',
    description: ''
  });

  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [processForm, setProcessForm] = useState({
    approved: true,
    utr_number: '',
    rejection_reason: '',
    admin_note: ''
  });

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const loadWithdrawals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/wallet/withdrawals', {
        params: {
          page: wPage,
          limit: 10,
          status: wStatus
        }
      });
      if (res.data?.success) {
        setWithdrawals(res.data.data.data);
        setWTotalPages(res.data.data.pagination.pages);
      }
    } catch (e) {
      console.error(e);
      triggerToast('Failed to load withdrawal requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadWallets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/superadmin/wallet/overview', {
        params: {
          page: oPage,
          limit: 10,
          search: oSearch.trim() || undefined
        }
      });
      if (res.data?.success) {
        setWallets(res.data.data.data);
        setOTotalPages(res.data.data.pagination.pages);
      }
    } catch (e) {
      console.error(e);
      triggerToast('Failed to load wallet summaries', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadLedger = async () => {
    setLoading(true);
    try {
      const res = await api.get('/superadmin/wallet/ledger', {
        params: {
          page: lPage,
          limit: 10,
          transaction_type: lType || undefined,
          status: lStatus || undefined,
          search: lSearch.trim() || undefined
        }
      });
      if (res.data?.success) {
        setLedger(res.data.data.data);
        setLTotalPages(res.data.data.pagination.pages);
      }
    } catch (e) {
      console.error(e);
      triggerToast('Failed to load ledger trail', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'withdrawals') loadWithdrawals();
    if (activeTab === 'wallets') loadWallets();
    if (activeTab === 'ledger') loadLedger();
  }, [activeTab, wPage, wStatus, oPage, lPage, lType, lStatus]);

  const handleSearchWallets = (e) => {
    e.preventDefault();
    setOPage(1);
    loadWallets();
  };

  const handleSearchLedger = (e) => {
    e.preventDefault();
    setLPage(1);
    loadLedger();
  };

  const openAdjustModal = (partner = null) => {
    setAdjustForm({
      partner_id: partner ? partner.Partner_id || partner.partner_id : '',
      amount: '',
      txn_type: 'credit',
      description: ''
    });
    setAdjustModalOpen(true);
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(adjustForm.amount);
    if (!adjustForm.partner_id) return alert('Please select a partner');
    if (isNaN(amt) || amt <= 0) return alert('Amount must be positive');

    setActionLoading(true);
    try {
      const res = await api.post('/superadmin/wallet/adjust', adjustForm);
      if (res.data?.success) {
        triggerToast(res.data.message || 'Balance successfully adjusted');
        setAdjustModalOpen(false);
        if (activeTab === 'wallets') loadWallets();
        if (activeTab === 'ledger') loadLedger();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to adjust wallet balance');
    } finally {
      setActionLoading(false);
    }
  };

  const openProcessModal = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setProcessForm({
      approved: true,
      utr_number: '',
      rejection_reason: '',
      admin_note: ''
    });
    setProcessModalOpen(true);
  };

  const handleProcessSubmit = async (e) => {
    e.preventDefault();
    if (processForm.approved && !processForm.utr_number) {
      return alert('UTR reference number is required to approve settlement');
    }
    if (!processForm.approved && !processForm.rejection_reason) {
      return alert('Rejection reason is required');
    }

    setActionLoading(true);
    try {
      const payload = {
        approved: processForm.approved,
        utr_number: processForm.approved ? processForm.utr_number : undefined,
        rejection_reason: !processForm.approved ? processForm.rejection_reason : undefined,
        admin_note: processForm.admin_note || undefined
      };
      
      const res = await api.patch(`/wallet/withdrawals/${selectedWithdrawal.id}/process`, payload);
      if (res.data?.success) {
        triggerToast(`Withdrawal successfully ${processForm.approved ? 'approved' : 'rejected'}`);
        setProcessModalOpen(false);
        loadWithdrawals();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to process withdrawal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportLedgerCSV = () => {
    if (ledger.length === 0) return alert('No ledger lines available.');
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Date,Partner Code,Partner Name,Reference,Type,Credit,Debit,Status,Description\n';
    
    ledger.forEach((l) => {
      const row = [
        new Date(l.created_at).toLocaleDateString(),
        `"${l.Partner_code}"`,
        `"${l.first_name} ${l.last_name || ''}"`,
        `"${l.app_number || l.reference_number || 'N/A'}"`,
        `"${l.transaction_type}"`,
        l.credit,
        l.debit,
        `"${l.status}"`,
        `"${l.description || ''}"`
      ].join(',');
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'GKP_Wallet_Ledger_Export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* Toast */}
      {toast.show && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 1100,
          background: toast.type === 'success' ? C.green : C.red,
          color: '#fff', padding: '12px 24px', borderRadius: '10px',
          fontWeight: 700, fontSize: '14px', boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          {toast.type === 'success' ? '✓' : '✗'} {toast.message}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: C.text, margin: 0 }}>Partner Wallet Management</h2>
          <p style={{ fontSize: '13px', color: C.textLight, margin: '4px 0 0 0' }}>Manage partner bank settlements, audit ledger balances, and perform adjustments</p>
        </div>
        <button onClick={() => openAdjustModal()} style={{ ...S.btn('primary'), display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MdCompareArrows /> Manual Adjustment
        </button>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, marginBottom: '24px', gap: '24px' }}>
        {[
          { id: 'withdrawals', label: 'Withdrawal Settlements', count: withdrawals.length },
          { id: 'wallets', label: 'Partner Wallet Balances' },
          { id: 'ledger', label: 'Global System Ledger' }
        ].map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '12px 4px', fontSize: '14px', fontWeight: active ? 800 : 600,
                color: active ? C.primary : C.textLight,
                borderBottom: active ? `2px solid ${C.primary}` : '2px solid transparent',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && wStatus === 'pending' && (
                <span style={{ fontSize: '10px', background: C.red, color: '#fff', padding: '2px 6px', borderRadius: '10px' }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* WITHDRAWALS TAB */}
      {activeTab === 'withdrawals' && (
        <div>
          <div style={{ ...S.card, padding: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { setWStatus('pending'); setWPage(1); }} style={wStatus === 'pending' ? S.btn('primary') : S.btn('outline')}>Pending Requests</button>
              <button onClick={() => { setWStatus('processed'); setWPage(1); }} style={wStatus === 'processed' ? S.btn('primary') : S.btn('outline')}>Processed</button>
              <button onClick={() => { setWStatus('rejected'); setWPage(1); }} style={wStatus === 'rejected' ? S.btn('primary') : S.btn('outline')}>Rejected</button>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>Loading withdrawals...</div>
          ) : withdrawals.length === 0 ? (
            <div style={{ ...S.card, padding: '48px', textAlign: 'center', color: C.textLight }}>
              No withdrawals requests found with status **{wStatus}**.
            </div>
          ) : (
            <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, fontSize: '11px', textTransform: 'uppercase', color: C.textLight }}>
                      <th style={{ padding: '14px 16px' }}>Partner Info</th>
                      <th style={{ padding: '14px 16px' }}>Requested Amount</th>
                      <th style={{ padding: '14px 16px' }}>Bank Payout Channel</th>
                      <th style={{ padding: '14px 16px' }}>Requested Date</th>
                      {wStatus !== 'pending' && <th style={{ padding: '14px 16px' }}>UTR / Reference</th>}
                      {wStatus === 'pending' && <th style={{ padding: '14px 16px', textAlign: 'center' }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: '13.5px' }}>
                    {withdrawals.map((w) => (
                      <tr key={w.id} style={{ borderBottom: `1px solid ${C.border}60` }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 800, color: C.text }}>{w.first_name} {w.last_name || ''}</div>
                          <div style={{ fontSize: '11px', color: C.textLight, marginTop: '2px' }}>{w.Partner_code} • {w.mobile}</div>
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 800, color: C.text }}>
                          ₹{parseFloat(w.amount).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {w.upi_id ? (
                            <div>
                              <span style={{ fontSize: '10px', background: `${C.green}15`, color: C.green, padding: '2px 6px', borderRadius: '4px', marginRight: '6px' }}>UPI</span>
                              <span style={{ fontFamily: 'monospace' }}>{w.upi_id}</span>
                            </div>
                          ) : (
                            <div>
                              <span style={{ fontSize: '10px', background: `${C.primary}15`, color: C.primary, padding: '2px 6px', borderRadius: '4px', marginRight: '6px' }}>Bank</span>
                              <span style={{ fontWeight: 600 }}>{w.bank_name}</span>
                              <div style={{ fontSize: '11px', color: C.textLight, fontFamily: 'monospace', marginTop: '2px' }}>
                                {w.account_number} • {w.ifsc_code}
                              </div>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px', color: C.textLight }}>
                          {new Date(w.created_at).toLocaleString()}
                        </td>
                        {wStatus !== 'pending' && (
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: 600 }}>{w.utr_number || 'N/A'}</div>
                            {w.rejection_reason && <div style={{ fontSize: '11px', color: C.red, marginTop: '2px' }}>Reason: {w.rejection_reason}</div>}
                          </td>
                        )}
                        {wStatus === 'pending' && (
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <button onClick={() => openProcessModal(w)} style={{ ...S.btn('primary'), padding: '6px 12px', fontSize: '12px' }}>
                              Settle Payout
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {wTotalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderTop: `1px solid ${C.border}`, background: C.bgSecondary }}>
                  <span style={{ fontSize: '13px', color: C.textLight }}>Page {wPage} of {wTotalPages}</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button disabled={wPage <= 1} onClick={() => setWPage(wPage - 1)} style={S.btn('outline')}>Prev</button>
                    <button disabled={wPage >= wTotalPages} onClick={() => setWPage(wPage + 1)} style={S.btn('outline')}>Next</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* WALLETS TAB */}
      {activeTab === 'wallets' && (
        <div>
          <div style={{ ...S.card, padding: '16px', marginBottom: '24px' }}>
            <form onSubmit={handleSearchWallets} style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input 
                  style={{ ...S.input, paddingLeft: '32px' }} 
                  placeholder="Search partner code, name..." 
                  value={oSearch} 
                  onChange={e => setOSearch(e.target.value)} 
                />
                <MdSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: C.textLight }} />
              </div>
              <button type="submit" style={S.btn('primary')}>Search</button>
              <button type="button" onClick={() => { setOSearch(''); setOPage(1); setTimeout(loadWallets, 0); }} style={S.btn('outline')}>Reset</button>
            </form>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>Loading wallet data...</div>
          ) : wallets.length === 0 ? (
            <div style={{ ...S.card, padding: '48px', textAlign: 'center', color: C.textLight }}>No partner wallets found.</div>
          ) : (
            <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, fontSize: '11px', textTransform: 'uppercase', color: C.textLight }}>
                      <th style={{ padding: '14px 16px' }}>Partner Name</th>
                      <th style={{ padding: '14px 16px' }}>Available Balance</th>
                      <th style={{ padding: '14px 16px' }}>Hold Balance</th>
                      <th style={{ padding: '14px 16px' }}>Total Overrides</th>
                      <th style={{ padding: '14px 16px' }}>Total Earned</th>
                      <th style={{ padding: '14px 16px', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: '13.5px' }}>
                    {wallets.map((w) => (
                      <tr key={w.id} style={{ borderBottom: `1px solid ${C.border}60` }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 800, color: C.text }}>{w.first_name} {w.last_name || ''}</div>
                          <div style={{ fontSize: '11px', color: C.textLight, marginTop: '2px' }}>{w.Partner_code} • {w.email}</div>
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 800, color: C.green }}>
                          ₹{parseFloat(w.available_balance).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: C.gold }}>
                          ₹{parseFloat(w.hold_balance).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '14px 16px', color: C.primary }}>
                          ₹{parseFloat(w.override_balance || 0).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 700 }}>
                          ₹{parseFloat(w.total_earned).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <button onClick={() => openAdjustModal(w)} style={{ border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '11.5px', fontWeight: 600 }}>
                            Adjust Balance
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {oTotalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderTop: `1px solid ${C.border}`, background: C.bgSecondary }}>
                  <span style={{ fontSize: '13px', color: C.textLight }}>Page {oPage} of {oTotalPages}</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button disabled={oPage <= 1} onClick={() => setOPage(oPage - 1)} style={S.btn('outline')}>Prev</button>
                    <button disabled={oPage >= oTotalPages} onClick={() => setOPage(oPage + 1)} style={S.btn('outline')}>Next</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* LEDGER TAB */}
      {activeTab === 'ledger' && (
        <div>
          <div style={{ ...S.card, padding: '16px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <form onSubmit={handleSearchLedger} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, display: 'block', marginBottom: '4px' }}>Search Description/Partner</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    style={{ ...S.input, paddingLeft: '32px' }} 
                    placeholder="Search ledger..." 
                    value={lSearch} 
                    onChange={e => setLSearch(e.target.value)} 
                  />
                  <MdSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: C.textLight }} />
                </div>
              </div>
              <div style={{ width: '160px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, display: 'block', marginBottom: '4px' }}>Type</label>
                <select style={S.input} value={lType} onChange={e => setLType(e.target.value)}>
                  <option value="">All Types</option>
                  <option value="PERSONAL_COMMISSION">Personal Commission</option>
                  <option value="TEAM_COMMISSION">Team Commission</option>
                  <option value="OVERRIDE_COMMISSION">Override Commission</option>
                  <option value="REFERRAL_BONUS">Referral Bonus</option>
                  <option value="WITHDRAWAL">Withdrawal</option>
                  <option value="ADJUSTMENT">Adjustment</option>
                </select>
              </div>
              <div style={{ width: '130px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, display: 'block', marginBottom: '4px' }}>Status</label>
                <select style={S.input} value={lStatus} onChange={e => setLStatus(e.target.value)}>
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" style={S.btn('primary')}>Filter</button>
                <button type="button" onClick={() => { setLSearch(''); setLType(''); setLStatus(''); setLPage(1); setTimeout(loadLedger, 0); }} style={S.btn('outline')}>Reset</button>
                <button type="button" onClick={handleExportLedgerCSV} style={{ ...S.btn('outline'), display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MdFileDownload /> CSV
                </button>
              </div>
            </form>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>Loading ledger trails...</div>
          ) : ledger.length === 0 ? (
            <div style={{ ...S.card, padding: '48px', textAlign: 'center', color: C.textLight }}>No ledger lines found.</div>
          ) : (
            <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, fontSize: '11px', textTransform: 'uppercase', color: C.textLight }}>
                      <th style={{ padding: '14px 16px' }}>Date</th>
                      <th style={{ padding: '14px 16px' }}>Partner</th>
                      <th style={{ padding: '14px 16px' }}>Description</th>
                      <th style={{ padding: '14px 16px' }}>Type</th>
                      <th style={{ padding: '14px 16px' }}>Credit</th>
                      <th style={{ padding: '14px 16px' }}>Debit</th>
                      <th style={{ padding: '14px 16px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: '13.5px' }}>
                    {ledger.map((l) => (
                      <tr key={l.id} style={{ borderBottom: `1px solid ${C.border}60` }}>
                        <td style={{ padding: '14px 16px', color: C.textLight }}>
                          {new Date(l.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 800 }}>{l.first_name} {l.last_name || ''}</div>
                          <div style={{ fontSize: '11px', color: C.textLight, marginTop: '2px' }}>{l.Partner_code}</div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div>{l.description}</div>
                          {l.product_name && <div style={{ fontSize: '11px', color: C.textLight, marginTop: '2px' }}>App: {l.app_number} ({l.product_name})</div>}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: `${C.primary}15`, color: C.primary }}>
                            {l.transaction_type}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: C.green }}>
                          {parseFloat(l.credit) > 0 ? `+₹${parseFloat(l.credit).toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: C.red }}>
                          {parseFloat(l.debit) > 0 ? `-₹${parseFloat(l.debit).toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            display: 'inline-block', fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                            background: l.status === 'completed' ? `${C.green}15` : l.status === 'rejected' ? `${C.red}15` : `${C.gold}15`,
                            color: l.status === 'completed' ? C.green : l.status === 'rejected' ? C.red : C.gold,
                            fontWeight: 700
                          }}>
                            {l.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {lTotalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderTop: `1px solid ${C.border}`, background: C.bgSecondary }}>
                  <span style={{ fontSize: '13px', color: C.textLight }}>Page {lPage} of {lTotalPages}</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button disabled={lPage <= 1} onClick={() => setLPage(lPage - 1)} style={S.btn('outline')}>Prev</button>
                    <button disabled={lPage >= lTotalPages} onClick={() => setLPage(lPage + 1)} style={S.btn('outline')}>Next</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MANUAL ADJUSTMENT DIALOG */}
      {adjustModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ ...S.card, width: '100%', maxWidth: '480px', padding: '24px', position: 'relative' }}>
            <button 
              onClick={() => setAdjustModalOpen(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: C.bgSecondary, border: 'none', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textLight }}
            >
              <MdClose size={20} />
            </button>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: '0 0 16px' }}>Manual Ledger Adjustment</h3>

            <form onSubmit={handleAdjustSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={S.label}>Select Target Partner (ID/Code) *</label>
                {adjustForm.partner_id ? (
                  <input type="text" readOnly style={{ ...S.input, background: `${C.border}40` }} value={adjustForm.partner_id} />
                ) : (
                  <select required style={S.input} onChange={e => setAdjustForm({ ...adjustForm, partner_id: e.target.value })}>
                    <option value="">Select a partner...</option>
                    {wallets.map(w => <option key={w.id} value={w.Partner_id}>{w.first_name} {w.last_name || ''} ({w.Partner_code})</option>)}
                  </select>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={S.label}>Adjustment Type</label>
                  <select style={S.input} value={adjustForm.txn_type} onChange={e => setAdjustForm({ ...adjustForm, txn_type: e.target.value })}>
                    {ADJUST_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Amount (INR) *</label>
                  <input 
                    type="number" 
                    required 
                    min="1" 
                    placeholder="e.g. 1000" 
                    style={S.input}
                    value={adjustForm.amount}
                    onChange={e => setAdjustForm({ ...adjustForm, amount: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={S.label}>Remarks / Adjustment Reason *</label>
                <textarea 
                  required 
                  rows={3} 
                  placeholder="Provide explicit audit justification..." 
                  style={S.input}
                  value={adjustForm.description}
                  onChange={e => setAdjustForm({ ...adjustForm, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setAdjustModalOpen(false)} style={S.btn('outline')}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={S.btn('primary')}>
                  {actionLoading ? 'Saving...' : 'Apply Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROCESS WITHDRAWAL DIALOG */}
      {processModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ ...S.card, width: '100%', maxWidth: '520px', padding: '24px', position: 'relative' }}>
            <button 
              onClick={() => setProcessModalOpen(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: C.bgSecondary, border: 'none', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textLight }}
            >
              <MdClose size={20} />
            </button>
            
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: '0 0 4px' }}>Settle Payout</h3>
            <p style={{ fontSize: '13px', color: C.textLight, marginBottom: '20px' }}>
              Amount: **₹{parseFloat(selectedWithdrawal.amount).toLocaleString('en-IN')}** for {selectedWithdrawal.first_name} {selectedWithdrawal.last_name || ''}
            </p>

            <form onSubmit={handleProcessSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    checked={processForm.approved === true} 
                    onChange={() => setProcessForm({ ...processForm, approved: true })} 
                  />
                  Approve and Mark Settled
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    checked={processForm.approved === false} 
                    onChange={() => setProcessForm({ ...processForm, approved: false })} 
                  />
                  Reject Settlement
                </label>
              </div>

              {processForm.approved ? (
                <div>
                  <label style={S.label}>Bank UTR Reference Number *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. UTR1287635241" 
                    style={S.input}
                    value={processForm.utr_number}
                    onChange={e => setProcessForm({ ...processForm, utr_number: e.target.value })}
                  />
                </div>
              ) : (
                <div>
                  <label style={S.label}>Reason for Rejection *</label>
                  <textarea 
                    required 
                    rows={2} 
                    placeholder="Enter reason for rejecting transfer..." 
                    style={S.input}
                    value={processForm.rejection_reason}
                    onChange={e => setProcessForm({ ...processForm, rejection_reason: e.target.value })}
                  />
                </div>
              )}

              <div>
                <label style={S.label}>Admin Note (Private / Private history track)</label>
                <input 
                  type="text" 
                  placeholder="Optional internal remarks..." 
                  style={S.input}
                  value={processForm.admin_note}
                  onChange={e => setProcessForm({ ...processForm, admin_note: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setProcessModalOpen(false)} style={S.btn('outline')}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={S.btn('primary')}>
                  {actionLoading ? 'Processing...' : 'Submit Settlement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
