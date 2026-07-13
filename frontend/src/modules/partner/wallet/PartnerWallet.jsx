import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import api from '../../../services/api';
import { 
  MdAccountBalanceWallet, 
  MdHistory, 
  MdAccountBalance, 
  MdFileDownload, 
  MdSearch, 
  MdFilterList, 
  MdLock, 
  MdCheckCircle, 
  MdError,
  MdRefresh
} from 'react-icons/md';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';

const PartnerWallet = () => {
  const { t } = useTranslation();
  const { C } = useTheme();
  const S = makeS(C);

  // States
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  
  // Ledger States
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [txSearch, setTxSearch] = useState('');
  const [txType, setTxType] = useState('');
  const [txStatus, setTxStatus] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  // Withdrawal form states
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawRemarks, setWithdrawRemarks] = useState('');
  const [requestingWithdraw, setRequestingWithdraw] = useState(false);

  // Bank form states
  const [bankDetails, setBankDetails] = useState({
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    account_holder_name: '',
    upi_id: '',
    branch_name: '',
    is_verified: false
  });
  const [loadingBank, setLoadingBank] = useState(true);
  const [savingBank, setSavingBank] = useState(false);
  const [kycStatus, setKycStatus] = useState('draft');

  // Loaders
  useEffect(() => {
    fetchDashboard();
    fetchBankDetails();
    fetchKYCStatus();
  }, []);

  useEffect(() => {
    if (activeTab === 'ledger') {
      fetchTransactions();
    }
  }, [activeTab, page, txType, txStatus]);

  const fetchDashboard = async () => {
    setLoadingDashboard(true);
    try {
      const res = await api.get('/wallet/dashboard');
      if (res.data?.success) {
        setDashboardData(res.data.data);
      }
    } catch (e) {
      console.error('Failed to load wallet dashboard stats:', e);
    } finally {
      setLoadingDashboard(false);
    }
  };

  const fetchKYCStatus = async () => {
    try {
      const res = await api.get('/partner/kyc/status');
      if (res.data?.success) {
        setKycStatus(res.data.data.kyc_status);
      }
    } catch (e) {
      console.error('Failed to fetch KYC status:', e);
    }
  };

  const fetchBankDetails = async () => {
    setLoadingBank(true);
    try {
      const res = await api.get('/wallet/bank-details');
      if (res.data?.success && res.data.data) {
        setBankDetails(prev => ({
          ...prev,
          ...res.data.data
        }));
      }
    } catch (e) {
      console.error('Failed to fetch bank details:', e);
    } finally {
      setLoadingBank(false);
    }
  };

  const fetchTransactions = async () => {
    setLoadingTx(true);
    try {
      const params = {
        page,
        limit,
        type: txType || undefined,
        status: txStatus || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        search: txSearch || undefined
      };
      const res = await api.get('/wallet/transactions', { params });
      if (res.data?.success) {
        setTransactions(res.data.data || []);
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch (e) {
      console.error('Failed to fetch transactions:', e);
    } finally {
      setLoadingTx(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt < 100) {
      return alert('Minimum withdrawal amount is ₹100');
    }
    if (amt > (dashboardData?.available_balance || 0)) {
      return alert('Withdrawal amount exceeds your available balance');
    }
    
    if (kycStatus !== 'approved') {
      return alert('KYC approval is required to initiate bank withdrawals');
    }

    setRequestingWithdraw(true);
    try {
      const res = await api.post('/wallet/withdraw', {
        amount: amt,
        remarks: withdrawRemarks
      });
      if (res.data?.success) {
        alert(res.data.message || 'Withdrawal request submitted successfully!');
        setWithdrawAmount('');
        setWithdrawRemarks('');
        fetchDashboard();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit withdrawal request.');
    } finally {
      setRequestingWithdraw(false);
    }
  };

  const handleSaveBank = async (e) => {
    e.preventDefault();
    if (kycStatus !== 'approved') {
      return alert('Bank details can only be configured by KYC approved partners');
    }
    setSavingBank(true);
    try {
      const res = await api.put('/wallet/bank-details', bankDetails);
      if (res.data?.success) {
        alert('Bank details updated successfully!');
        fetchBankDetails();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update bank details.');
    } finally {
      setSavingBank(false);
    }
  };

  const handleExportCSV = () => {
  const { t } = useTranslation();
    if (!transactions.length) return alert('No transactions found to export');
    const headers = ['Date', 'Transaction ID', 'Customer', 'Product', 'Type', 'GST', 'TDS', 'Net Amount', 'Status', 'Remarks'];
    const rows = transactions.map(tx => [
      new Date(tx.created_at).toLocaleString(),
      tx.id,
      tx.customer_name || 'N/A',
      tx.product_name || 'N/A',
      tx.transaction_type || tx.type,
      tx.gst || 0,
      tx.tds || 0,
      tx.net_amount || tx.amount,
      tx.status,
      tx.remarks || tx.description || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(r => r.map(val => `"${val}"`).join(','))].join('\n');
    
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `ledger_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Recharts custom formatting
  const formatCurrency = (val) => `₹${parseFloat(val || 0).toLocaleString('en-IN')}`;

  const StatBox = ({ title, value, gradient, subtitle }) => (
    <div style={{
      padding: '20px',
      borderRadius: '16px',
      background: gradient,
      color: '#fff',
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      minHeight: '130px'
    }}>
      <div>
        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', opacity: 0.8, letterSpacing: '0.6px' }}>{title}</div>
        <div style={{ fontSize: '28px', fontWeight: 800, margin: '8px 0 2px' }}>{formatCurrency(value)}</div>
      </div>
      {subtitle && <div style={{ fontSize: '11px', opacity: 0.9 }}>{subtitle}</div>}
    </div>
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* Upper header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: C.text, margin: '0 0 4px' }}>{t("Partner Wallet")}</h2>
          <p style={{ fontSize: '13px', color: C.textLight, margin: 0 }}>{t("View your commission ledger, track payouts, and manage settings.")}</p>
        </div>
        <button 
          onClick={() => { fetchDashboard(); if(activeTab === 'ledger') fetchTransactions(); }}
          style={{ ...S.btn('outline'), display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px' }}
        >
          <MdRefresh size={16} /> Refresh
        </button>
      </div>

      {/* Modern Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: `1px solid ${C.border}`, paddingBottom: '2px' }}>
        <button 
          onClick={() => setActiveTab('dashboard')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'dashboard' ? `3px solid ${C.teal}` : '3px solid transparent',
            color: activeTab === 'dashboard' ? C.teal : C.textLight,
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <MdAccountBalanceWallet size={16} /> Overview
        </button>
        <button 
          onClick={() => setActiveTab('ledger')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'ledger' ? `3px solid ${C.teal}` : '3px solid transparent',
            color: activeTab === 'ledger' ? C.teal : C.textLight,
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <MdHistory size={16} /> Ledger & Reports
        </button>
        <button 
          onClick={() => setActiveTab('bank')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'bank' ? `3px solid ${C.teal}` : '3px solid transparent',
            color: activeTab === 'bank' ? C.teal : C.textLight,
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <MdAccountBalance size={16} /> Bank Setup
        </button>
      </div>

      {/* Dashboard Overview Tab */}
      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Main Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            <StatBox 
              title={t("Available Wallet Balance")} 
              value={dashboardData?.available_balance} 
              gradient="linear-gradient(135deg, #0f766e, #134e4a)" 
              subtitle={t("Withdrawable to registered bank account")}
            />
            <StatBox 
              title={t("Pending Commission")} 
              value={dashboardData?.pending_balance} 
              gradient="linear-gradient(135deg, #b45309, #78350f)" 
              subtitle={t("Awaiting maturity release")}
            />
            <StatBox 
              title={t("Today's Earnings")} 
              value={dashboardData?.today_earnings} 
              gradient="linear-gradient(135deg, #1d4ed8, #1e3a8a)" 
              subtitle={t("Earned in current calendar day")}
            />
            <StatBox 
              title={t("Current Month Earnings")} 
              value={dashboardData?.monthly_earnings} 
              gradient="linear-gradient(135deg, #701a75, #4a044e)" 
              subtitle={t("Earned in current calendar month")}
            />
            <StatBox 
              title={t("Lifetime Earnings")} 
              value={dashboardData?.lifetime_earnings} 
              gradient="linear-gradient(135deg, #475569, #1e293b)" 
              subtitle={t("Lifetime commission credited")}
            />
            <StatBox 
              title={t("Total Outflow Withdrawn")} 
              value={dashboardData?.total_withdrawn} 
              gradient="linear-gradient(135deg, #be123c, #881337)" 
              subtitle={t("Settled successfully to bank")}
            />
            <StatBox 
              title={t("Team Override Commission")} 
              value={dashboardData?.override_commission} 
              gradient="linear-gradient(135deg, #0369a1, #0c4a6e)" 
              subtitle={t("Earnings from child network overrides")}
            />
            <StatBox 
              title={t("Referral Bonus")} 
              value={dashboardData?.referral_bonus} 
              gradient="linear-gradient(135deg, #15803d, #14532d)" 
              subtitle={t("Earned from direct invites")}
            />
          </div>

          {/* Sub Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            
            {/* Left Column: Quick Withdrawal Form */}
            <div style={{ ...S.card, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: 0 }}>{t("Initiate Bank Settlement")}</h3>
              <form onSubmit={handleWithdraw} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={S.label}>{t("Request Amount (₹)")}</label>
                  <input 
                    type="number" 
                    placeholder={t("Min ₹100")} 
                    style={S.input}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={S.label}>{t("Remarks (Optional)")}</label>
                  <input 
                    type="text" 
                    placeholder={t("e.g. Monthly withdrawal")} 
                    style={S.input}
                    value={withdrawRemarks}
                    onChange={(e) => setWithdrawRemarks(e.target.value)}
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={requestingWithdraw || !dashboardData?.available_balance || dashboardData.available_balance < 100}
                  style={{ 
                    ...S.btn('primary'), 
                    marginTop: '8px', 
                    borderRadius: '10px',
                    opacity: (requestingWithdraw || !dashboardData?.available_balance || dashboardData.available_balance < 100) ? 0.6 : 1,
                    cursor: (requestingWithdraw || !dashboardData?.available_balance || dashboardData.available_balance < 100) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {requestingWithdraw ? 'Sending Request...' : 'Submit Settlement Request'}
                </button>
              </form>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: C.bgSecondary, padding: '12px', borderRadius: '8px', fontSize: '11px', color: C.textLight }}>
                <div>{t("⏱️ Processing Time: 1-2 business days (NEFT/IMPS)")}</div>
                <div>🛡️ KYC Lock Status: {kycStatus === 'approved' ? '🟢 KYC Approved' : '🔴 KYC Required'}</div>
              </div>
            </div>

            {/* Right Column: Earnings Chart */}
            <div style={{ ...S.card, padding: '20px', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: C.text, marginBottom: '16px' }}>{t("Monthly Earnings Progression")}</h3>
              <div style={{ flex: 1, minHeight: '220px' }}>
                {dashboardData?.history?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dashboardData.history} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="earningsColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={C.teal} stopOpacity={0.4}/>
                          <stop offset="95%" stopColor={C.teal} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                      <XAxis dataKey="month_label" stroke={C.textLight} fontSize={10} />
                      <YAxis stroke={C.textLight} fontSize={10} tickFormatter={(v) => `₹${v}`} />
                      <Tooltip formatter={(v) => formatCurrency(v)} />
                      <Area type="monotone" dataKey="total_credited" stroke={C.teal} fillOpacity={1} fill="url(#earningsColor)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: C.textLight, fontSize: '13px' }}>
                    No recent completed commission history.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ledger & Reports Tab */}
      {activeTab === 'ledger' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Filters Bar */}
          <div style={{ ...S.card, padding: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', items: 'center', gap: '6px', background: C.bgSecondary, padding: '4px 10px', borderRadius: '8px', flex: 1, minWidth: '220px' }}>
              <MdSearch size={18} style={{ color: C.textLight, marginTop: '8px' }} />
              <input 
                type="text" 
                placeholder={t("Search by ID or Reference...")} 
                value={txSearch} 
                onChange={(e) => setTxSearch(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: C.text, fontSize: '13px', width: '100%', padding: '6px 0' }}
              />
            </div>
            
            <select style={{ ...S.input, width: '140px', margin: 0 }} value={txType} onChange={e => setTxType(e.target.value)}>
              <option value="">{t("All Types")}</option>
              <option value="PERSONAL_COMMISSION">{t("Personal Commission")}</option>
              <option value="TEAM_COMMISSION">{t("Team Commission")}</option>
              <option value="OVERRIDE_COMMISSION">{t("Override Commission")}</option>
              <option value="WITHDRAWAL">{t("Withdrawal")}</option>
              <option value="REFERRAL_BONUS">{t("Referral Bonus")}</option>
              <option value="ADJUSTMENT">{t("Adjustment")}</option>
            </select>

            <select style={{ ...S.input, width: '130px', margin: 0 }} value={txStatus} onChange={e => setTxStatus(e.target.value)}>
              <option value="">{t("All Status")}</option>
              <option value="completed">{t("Completed")}</option>
              <option value="pending">{t("Pending")}</option>
              <option value="rejected">{t("Rejected")}</option>
            </select>

            <button 
              onClick={fetchTransactions} 
              style={{ ...S.btn('primary'), padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <MdFilterList size={16} /> Filter
            </button>

            <button 
              onClick={handleExportCSV} 
              style={{ ...S.btn('outline'), padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <MdFileDownload size={16} style={{ color: C.green }} /> Export CSV
            </button>
          </div>

          {/* Transactions List */}
          <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}` }}>
                    <th style={{ padding: '12px 16px', fontSize: '11px', color: C.textLight, textAlign: 'left', textTransform: 'uppercase' }}>{t("Date & Time")}</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', color: C.textLight, textAlign: 'left', textTransform: 'uppercase' }}>{t("Transaction ID / Ref")}</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', color: C.textLight, textAlign: 'left', textTransform: 'uppercase' }}>{t("Type")}</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', color: C.textLight, textAlign: 'right', textTransform: 'uppercase' }}>{t("Amount")}</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', color: C.textLight, textAlign: 'right', textTransform: 'uppercase' }}>{t("TDS (5%)")}</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', color: C.textLight, textAlign: 'right', textTransform: 'uppercase' }}>{t("Net Amount")}</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', color: C.textLight, textAlign: 'center', textTransform: 'uppercase' }}>{t("Status")}</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', color: C.textLight, textAlign: 'left', textTransform: 'uppercase' }}>{t("Remarks")}</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingTx ? (
                    <tr>
                      <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: C.textLight }}>{t("Loading ledger records...")}</td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: C.textLight }}>{t("No matching transaction logs found.")}</td>
                    </tr>
                  ) : (
                    transactions.map((tx) => {
                      const isCredit = parseFloat(tx.credit || 0) > 0;
                      const amt = isCredit ? parseFloat(tx.credit) : parseFloat(tx.debit || tx.amount || 0);
                      const tds = parseFloat(tx.tds || 0);
                      const net = parseFloat(tx.net_amount || amt);
                      
                      return (
                        <tr key={tx.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                          <td style={{ padding: '14px 16px', fontSize: '12.5px', color: C.text }}>{new Date(tx.created_at).toLocaleString()}</td>
                          <td style={{ padding: '14px 16px', fontSize: '12.5px', color: C.text, fontFamily: 'monospace' }}>
                            <div>{tx.id.substring(0, 8)}...</div>
                            {tx.app_number && <div style={{ fontSize: '11px', color: C.textLight }}>App: {tx.app_number}</div>}
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '12.5px', color: C.text }}>
                            <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '4px', background: isCredit ? `${C.green}15` : `${C.red}15`, color: isCredit ? C.green : C.red, fontWeight: 700 }}>
                              {tx.transaction_type || tx.type}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '13px', color: C.text, textAlign: 'right', fontWeight: 600 }}>{formatCurrency(amt)}</td>
                          <td style={{ padding: '14px 16px', fontSize: '13px', color: C.red, textAlign: 'right' }}>{tds > 0 ? `-${formatCurrency(tds)}` : '—'}</td>
                          <td style={{ padding: '14px 16px', fontSize: '13.5px', color: isCredit ? C.green : C.red, textAlign: 'right', fontWeight: 700 }}>
                            {isCredit ? '+' : '-'}{formatCurrency(net)}
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '12px', textAlign: 'center' }}>
                            <span style={{ fontSize: '10.5px', padding: '4px 10px', borderRadius: '12px', fontWeight: 700, background: tx.status === 'completed' ? `${C.green}15` : tx.status === 'pending' ? `${C.gold}15` : `${C.red}15`, color: tx.status === 'completed' ? C.green : tx.status === 'pending' ? C.gold : C.red }}>
                              {tx.status}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '12.5px', color: C.textLight }}>{tx.remarks || tx.description || '—'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', items: 'center', gap: '8px', padding: '16px', borderTop: `1px solid ${C.border}` }}>
                <button 
                  disabled={page <= 1} 
                  onClick={() => setPage(page - 1)}
                  style={{ ...S.btn('outline'), padding: '6px 12px', borderRadius: '6px', opacity: page <= 1 ? 0.5 : 1 }}
                >
                  Previous
                </button>
                <span style={{ fontSize: '13px', color: C.textLight, alignSelf: 'center' }}>Page {page} of {totalPages}</span>
                <button 
                  disabled={page >= totalPages} 
                  onClick={() => setPage(page + 1)}
                  style={{ ...S.btn('outline'), padding: '6px 12px', borderRadius: '6px', opacity: page >= totalPages ? 0.5 : 1 }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bank Account Setup Tab */}
      {activeTab === 'bank' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', alignItems: 'start' }}>
          
          {/* Form */}
          <div style={{ ...S.card, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: 0 }}>{t("Registered Bank Details")}</h3>
            
            {kycStatus !== 'approved' ? (
              <div style={{ background: `${C.red}10`, border: `1px solid ${C.red}20`, padding: '14px', borderRadius: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <MdLock size={24} style={{ color: C.red, flexShrink: 0 }} />
                <div style={{ fontSize: '12px', color: C.red }}>
                  <strong>{t("Setup Locked:")}</strong> Only partners with fully verified and approved KYC can configure or edit bank account details.
                </div>
              </div>
            ) : (
              <div style={{ background: `${C.green}10`, border: `1px solid ${C.green}20`, padding: '12px', borderRadius: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <MdCheckCircle size={20} style={{ color: C.green, flexShrink: 0 }} />
                <div style={{ fontSize: '12px', color: C.green }}>
                  Your KYC is verified. You can update bank settings below.
                </div>
              </div>
            )}

            <form onSubmit={handleSaveBank} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={S.label}>{t("Account Holder Name")}</label>
                <input 
                  type="text" 
                  style={S.input}
                  value={bankDetails.account_holder_name}
                  onChange={(e) => setBankDetails({ ...bankDetails, account_holder_name: e.target.value })}
                  disabled={kycStatus !== 'approved'}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={S.label}>{t("Bank Name")}</label>
                  <input 
                    type="text" 
                    style={S.input}
                    value={bankDetails.bank_name}
                    onChange={(e) => setBankDetails({ ...bankDetails, bank_name: e.target.value })}
                    disabled={kycStatus !== 'approved'}
                    required
                  />
                </div>
                <div>
                  <label style={S.label}>{t("Branch Name")}</label>
                  <input 
                    type="text" 
                    style={S.input}
                    value={bankDetails.branch_name}
                    onChange={(e) => setBankDetails({ ...bankDetails, branch_name: e.target.value })}
                    disabled={kycStatus !== 'approved'}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={S.label}>{t("Account Number")}</label>
                  <input 
                    type="password" 
                    style={S.input}
                    value={bankDetails.account_number}
                    onChange={(e) => setBankDetails({ ...bankDetails, account_number: e.target.value })}
                    disabled={kycStatus !== 'approved'}
                    required
                  />
                </div>
                <div>
                  <label style={S.label}>{t("IFSC Code")}</label>
                  <input 
                    type="text" 
                    style={S.input}
                    value={bankDetails.ifsc_code}
                    onChange={(e) => setBankDetails({ ...bankDetails, ifsc_code: e.target.value })}
                    disabled={kycStatus !== 'approved'}
                    required
                  />
                </div>
              </div>
              <div>
                <label style={S.label}>{t("UPI ID (Optional)")}</label>
                <input 
                  type="text" 
                  placeholder={t("e.g. partner@upi")} 
                  style={S.input}
                  value={bankDetails.upi_id || ''}
                  onChange={(e) => setBankDetails({ ...bankDetails, upi_id: e.target.value })}
                  disabled={kycStatus !== 'approved'}
                />
              </div>
              <button 
                type="submit" 
                disabled={savingBank || kycStatus !== 'approved'}
                style={{ 
                  ...S.btn('primary'), 
                  marginTop: '10px', 
                  borderRadius: '10px',
                  opacity: (savingBank || kycStatus !== 'approved') ? 0.6 : 1,
                  cursor: (savingBank || kycStatus !== 'approved') ? 'not-allowed' : 'pointer'
                }}
              >
                {savingBank ? 'Saving Bank Settings...' : 'Save Bank Account'}
              </button>
            </form>
          </div>

          {/* Guidelines */}
          <div style={{ ...S.card, padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 800, color: C.text, margin: 0 }}>{t("Security & Settlement Guidelines")}</h4>
            <ul style={{ fontSize: '13px', color: C.textMid, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px', margin: 0 }}>
              <li>🔒 <strong>{t("Bank Details Encryption:")}</strong> All bank account numbers are protected with bank-level AES-256-CBC encryption before database storage.</li>
              <li>✔️ <strong>{t("Name Verification:")}</strong> Make sure the account holder name exactly matches the name submitted on your PAN Card and cheque.</li>
              <li>🕒 <strong>{t("Maturity Period:")}</strong> Commissions remain in "Pending Balance" for a minimum of 48 hours to prevent fraud or reversals.</li>
              <li>💼 <strong>{t("TDS & Taxes:")}</strong> A standard 5% TDS (Tax Deducted at Source) is deducted from all partner payouts under Section 194H of the Income Tax Act.</li>
            </ul>
          </div>
        </div>
      )}

    </div>
  );
};

export default PartnerWallet;
