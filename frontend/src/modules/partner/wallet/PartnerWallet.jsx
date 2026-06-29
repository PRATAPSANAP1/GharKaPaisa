import React, { useEffect, useState } from 'react';
import { useWalletStore } from '../../../app/store/walletStore';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import api from '../../../services/api';
import { MdFileDownload, MdPictureAsPdf } from 'react-icons/md';

const PartnerWallet = () => {
  const { C } = useTheme();
  const S = makeS(C);

  const fetchWallet = useWalletStore((state) => state.fetchWallet);
  const fetchTransactions = useWalletStore((state) => state.fetchTransactions);
  const wallet = useWalletStore((state) => state.wallet);
  const transactions = useWalletStore((state) => state.transactions);

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    fetchWallet();
    fetchTransactions();
  }, [fetchWallet, fetchTransactions]);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || isNaN(withdrawAmount) || Number(withdrawAmount) < 100) {
      alert("Minimum withdrawal is ₹100");
      return;
    }
    if (Number(withdrawAmount) > Number(wallet?.available_balance || 0)) {
      alert("Insufficient available balance");
      return;
    }
    setRequesting(true);
    try {
      const res = await api.post('/wallet/withdraw', { amount: Number(withdrawAmount) });
      if (res.data?.success) {
        alert(res.data.message || "Withdrawal request submitted successfully!");
        setWithdrawAmount('');
        fetchWallet();
        fetchTransactions();
      }
    } catch (e) {
      alert(e.response?.data?.message || "Failed to request withdrawal");
    } finally {
      setRequesting(false);
    }
  };

  const handleExportCSV = () => {
    if (!transactions || transactions.length === 0) {
      return alert("No transactions available to export.");
    }

    const headers = ['Date', 'Reference', 'Customer', 'Product', 'Bank', 'Type', 'Amount', 'Status'];
    const rows = transactions.map(t => [
      new Date(t.created_at).toLocaleDateString(),
      `"${t.app_number || t.reference_id || 'N/A'}"`,
      `"${t.customer_name || 'N/A'}"`,
      `"${t.product_name || 'N/A'}"`,
      `"${t.bank_code || 'N/A'}"`,
      t.type,
      t.amount,
      t.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `wallet_statement_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    window.print();
  };

  // Stat card helper
  const statCards = [
    { label: 'Pending Commission', value: wallet?.hold_balance, color: C.gold, hint: 'Awaiting bank confirmation / disbursal' },
    { label: 'Withdrawable Wallet', value: wallet?.available_balance, color: C.green, hint: 'Ready to be transferred to your bank' },
    { label: 'Total Earned', value: wallet?.total_earned, color: C.primary, hint: 'Lifetime earnings on GharKaPaisa' },
  ];

  const thStyle = {
    padding: '12px 18px', fontSize: '11px', fontWeight: 700,
    color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.6px',
    textAlign: 'left', whiteSpace: 'nowrap'
  };

  const tdStyle = {
    padding: '14px 18px', fontSize: '14px', color: C.text,
    borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap'
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>

      {/* Header */}
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: C.text, margin: '0 0 4px' }}>My Wallet</h2>
        <p style={{ fontSize: '14px', color: C.textLight, margin: 0 }}>Track your earnings and request withdrawals</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {statCards.map((stat, i) => (
          <div key={i} style={{
            ...S.card, padding: '24px', borderRadius: '16px', position: 'relative', overflow: 'hidden'
          }}>
            <h3 style={{ fontSize: '12px', fontWeight: 700, color: C.textMid, textTransform: 'uppercase', letterSpacing: '0.6px', margin: '0 0 8px' }}>
              {stat.label}
            </h3>
            <p style={{ fontSize: '28px', fontWeight: 800, color: stat.color, margin: '0 0 8px' }}>
              ₹{parseFloat(stat.value || 0).toLocaleString('en-IN')}
            </p>
            <p style={{ fontSize: '12px', color: C.textLight, margin: 0 }}>{stat.hint}</p>
          </div>
        ))}
      </div>

      {/* Withdrawal Form */}
      <div style={{ ...S.card, padding: '24px', borderRadius: '16px' }}>
        <h3 style={{ fontSize: '17px', fontWeight: 700, color: C.text, margin: '0 0 16px' }}>Request Bank Transfer</h3>
        <form onSubmit={handleWithdraw} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px', maxWidth: '320px' }}>
            <label style={S.label}>Amount to Withdraw</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: C.textMid, fontWeight: 600 }}>₹</span>
              <input 
                type="number" 
                style={{ ...S.input, paddingLeft: '32px' }}
                placeholder="Enter amount"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                min="100"
                max={wallet?.available_balance || 0}
                required
              />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={requesting || !wallet?.available_balance || wallet.available_balance < 100}
            style={{
              ...S.btn('primary'), padding: '12px 28px', fontSize: '14px',
              border: 'none', borderRadius: '10px',
              cursor: requesting ? 'not-allowed' : 'pointer',
              opacity: (requesting || !wallet?.available_balance || wallet.available_balance < 100) ? 0.5 : 1
            }}
          >
            {requesting ? 'Processing...' : 'Withdraw Funds'}
          </button>
        </form>
        <p style={{ fontSize: '12px', color: C.textLight, margin: '10px 0 0' }}>
          Funds are transferred to your registered bank account via NEFT/IMPS.
        </p>
      </div>

      {/* Commission Ledger Table */}
      <div style={{ ...S.card, padding: 0, borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{
          padding: '18px 24px', borderBottom: `1px solid ${C.border}`,
          background: C.bgSecondary, display: 'flex', flexWrap: 'wrap',
          justifyContent: 'space-between', alignItems: 'center', gap: '12px'
        }}>
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: C.text, margin: 0 }}>Commission Ledger</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleExportCSV}
              style={{
                ...S.btn('outline'), padding: '8px 16px', fontSize: '13px',
                display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '10px'
              }}
            >
              <MdFileDownload size={16} style={{ color: C.green }} /> Export CSV
            </button>
            <button
              onClick={handleExportPDF}
              style={{
                ...S.btn('outline'), padding: '8px 16px', fontSize: '13px',
                display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '10px'
              }}
            >
              <MdPictureAsPdf size={16} style={{ color: C.red }} /> Save as PDF
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {transactions.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: C.textLight }}>
              No commission or withdrawal records found.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.bgSecondary }}>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Reference</th>
                  <th style={thStyle}>Customer</th>
                  <th style={thStyle}>Product & Bank</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Amount</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, idx) => (
                  <tr key={idx}>
                    <td style={tdStyle}>{new Date(t.created_at).toLocaleDateString()}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>
                      {t.app_number || t.reference_id || 'N/A'}
                    </td>
                    <td style={tdStyle}>{t.customer_name || '—'}</td>
                    <td style={tdStyle}>
                      {t.product_name ? (
                        <div>
                          <div style={{ fontWeight: 600, color: C.text }}>{t.product_name}</div>
                          <div style={{ fontSize: '12px', color: C.textLight }}>{t.bank_code}</div>
                        </div>
                      ) : (
                        <span style={{ color: C.textLight }}>—</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <span style={S.tag(t.type === 'credit' ? C.green : C.red)}>
                        {t.type}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: t.type === 'credit' ? C.green : C.red }}>
                      {t.type === 'credit' ? '+' : '-'}₹{parseFloat(t.amount).toLocaleString('en-IN')}
                    </td>
                    <td style={tdStyle}>
                      <span style={S.tag(
                        (t.status === 'approved' || t.status === 'processed') ? C.green :
                        t.status === 'rejected' ? C.red : C.gold
                      )}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

export default PartnerWallet;
