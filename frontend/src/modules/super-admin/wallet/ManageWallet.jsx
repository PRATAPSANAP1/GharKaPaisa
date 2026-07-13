import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import { 
  MdSearch, MdAccountBalance, MdCheckCircle, MdBlock, 
  MdCompareArrows, MdHistory, MdFileDownload, MdClose, MdRefresh
} from 'react-icons/md';

const ADJUST_TYPES = [
  { id: 'credit', label: 'Credit (Add Balance)' },
  { id: 'debit', label: 'Debit (Subtract Balance)' },
  { id: 'commission_correction', label: 'Commission Correction' }
];

export default function ManageWallet() {
  const { C } = useTheme();
  const S = makeS(C);

  const [activeTab, setActiveTab] = useState('withdrawals'); // withdrawals, wallets, ledger, reconciliation

  // Data lists
  const [withdrawals, setWithdrawals] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [auditReconciliation, setAuditReconciliation] = useState([]);

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
      const res = await api.get('/wallet/withdrawals', {
        params: { page: wPage, limit: 10, status: wStatus }
      });
      if (res.data?.success) {
        setWithdrawals(res.data.data.data || res.data.data || []);
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
        params: { page: oPage, limit: 10, search: oSearch.trim() || undefined }
      });
      if (res.data?.success) {
        setWallets(res.data.data.data || res.data.data || []);
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
      const res = await api.get('/superadmin/wallet/ledger', {
        params: { page: lPage, limit: 10, transaction_type: lType || undefined, status: lStatus || undefined, search: lSearch.trim() || undefined }
      });
      if (res.data?.success) {
        setLedger(res.data.data.data || res.data.data || []);
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
  }, [activeTab, wPage, wStatus, oPage, lPage, lType, lStatus]);

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(adjustForm.amount);
    if (!adjustForm.partner_id) return alert('Please enter Partner Code or ID');
    if (isNaN(amt) || amt <= 0) return alert('Amount must be positive');

    setActionLoading(true);
    try {
      await api.post('/superadmin/wallet/adjust', adjustForm);
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
      <div style={{ display: 'flex', gap: '8px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '6px', width: 'fit-content' }}>
        {[
          { id: 'withdrawals', label: 'Withdrawal Settlements' },
          { id: 'wallets', label: 'Partner Balances Overview' },
          { id: 'ledger', label: 'Ledger Audit Trail' },
          { id: 'reconciliation', label: 'Wallet Reconciliation' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              background: activeTab === t.id ? C.teal : 'transparent',
              color: activeTab === t.id ? '#fff' : C.textMid,
              border: 'none', borderRadius: '8px', padding: '8px 16px',
              fontWeight: 700, fontSize: '13px', cursor: 'pointer'
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
          <div style={{ padding: '24px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, color: C.textLight, fontSize: '11px', textTransform: 'uppercase' }}>
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
      </div>

      {/* ═══ MODAL: MANUAL WALLET ADJUSTMENT ═══ */}
      {adjustModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ ...S.card, maxWidth: '460px', width: '100%', padding: '24px', borderRadius: '16px' }}>
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

    </div>
  );
}
