import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import { useAuthStore } from '../../../app/store/authStore';
import api from '../../../services/api';
import {
  MdAccountBalanceWallet, 
  MdHistory, 
  MdAccountBalance, 
  MdFileDownload, 
  MdSearch, 
  MdFilterList, 
  MdLock, 
  MdRefresh,
  MdPayments,
  MdTrendingUp,
  MdReceipt,
  MdArrowForward
} from 'react-icons/md';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const PartnerWallet = () => {
  const { t } = useTranslation();
  const { C, isDark } = useTheme();
  const S = makeS(C);
  const user = useAuthStore((state) => state.user);
  const isTeamMember = user?.role === 'TEAM_MEMBER';

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState('overview');
  
  // Real-time Data States
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  
  // Ledger States
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [txSearch, setTxSearch] = useState('');
  const [txType, setTxType] = useState('');
  const [txStatus, setTxStatus] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Withdrawal form states
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawRemarks, setWithdrawRemarks] = useState('');
  const [requestingWithdraw, setRequestingWithdraw] = useState(false);

  // OTP withdrawal modal states
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [emailMasked, setEmailMasked] = useState('');

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

  // Withdrawal list states
  const [withdrawals, setWithdrawals] = useState([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);

  // Commission Summary state
  const [commissionSummary, setCommissionSummary] = useState([]);
  const [loadingCommissionSummary, setLoadingCommissionSummary] = useState(false);

  // Initial Data Loaders
  useEffect(() => {
    fetchDashboard();
    fetchBankDetails();
    fetchKYCStatus();
    fetchWithdrawals();
    fetchCommissionSummary();
  }, []);

  useEffect(() => {
    if (activeTab === 'ledger') {
      fetchTransactions();
    }
    if (activeTab === 'withdrawals') {
      fetchWithdrawals();
    }
    if (activeTab === 'breakup') {
      fetchCommissionSummary();
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
        setBankDetails(prev => ({ ...prev, ...res.data.data }));
      }
    } catch (e) {
      console.error('Failed to fetch bank details:', e);
    } finally {
      setLoadingBank(false);
    }
  };

  const fetchWithdrawals = async () => {
    setLoadingWithdrawals(true);
    try {
      const res = await api.get('/wallet/my-withdrawals');
      if (res.data?.success) {
        setWithdrawals(res.data.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch withdrawals:', e);
    } finally {
      setLoadingWithdrawals(false);
    }
  };

  const fetchCommissionSummary = async () => {
    setLoadingCommissionSummary(true);
    try {
      const res = await api.get('/wallet/commission-summary');
      if (res.data?.success) {
        setCommissionSummary(res.data.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch commission summary:', e);
    } finally {
      setLoadingCommissionSummary(false);
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
        search: txSearch || undefined
      };
      const res = await api.get('/wallet/transactions', { params });
      if (res.data?.success) {
        setTransactions(res.data.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch transactions:', e);
    } finally {
      setLoadingTx(false);
    }
  };

  // Step 1: Send OTP for Withdrawal
  const handleSendWithdrawalOTP = async (e) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt < 100) {
      return alert('Minimum withdrawal amount is ₹100');
    }
    if (amt > 50000) {
      return alert('Maximum single withdrawal limit is ₹50,000 per request');
    }
    const availBal = dashboardData?.wallet?.available_balance ?? dashboardData?.available_balance ?? 0;
    if (amt > availBal) {
      return alert(`Withdrawal amount exceeds your available balance (Max: ₹${availBal})`);
    }
    if (kycStatus !== 'approved') {
      return alert('KYC approval is required to initiate bank withdrawals');
    }

    setRequestingWithdraw(true);
    try {
      const res = await api.post('/wallet/withdraw/otp/send', { amount: amt });
      if (res.data?.success) {
        setEmailMasked(res.data.data?.email_sent_to || 'your registered email');
        setShowOtpModal(true);
      } else {
        alert(res.data.message || 'Failed to send verification OTP.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send OTP. Please check your bank account settings.');
    } finally {
      setRequestingWithdraw(false);
    }
  };

  // Step 2: Confirm OTP & Request Payout
  const handleConfirmWithdrawalOTP = async (e) => {
    e.preventDefault();
    if (!otpCode) return alert('Please enter the 6-digit OTP code');

    setVerifyingOtp(true);
    try {
      const res = await api.post('/wallet/withdraw/otp/verify', {
        otp: otpCode,
        amount: parseFloat(withdrawAmount),
        remarks: withdrawRemarks
      });
      if (res.data?.success) {
        alert(res.data.message || 'Withdrawal requested successfully!');
        setWithdrawAmount('');
        setWithdrawRemarks('');
        setOtpCode('');
        setShowOtpModal(false);
        fetchDashboard();
        fetchWithdrawals();
      } else {
        alert(res.data.message || 'OTP verification failed.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Save Primary Bank Settings
  const handleSaveBank = async (e) => {
    e.preventDefault();
    if (kycStatus !== 'approved') {
      return alert('Bank details can only be configured by KYC approved partners');
    }
    setSavingBank(true);
    try {
      const res = await api.put('/wallet/bank-details', bankDetails);
      if (res.data?.success) {
        alert('Primary bank details updated successfully!');
        fetchBankDetails();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update primary bank details.');
    } finally {
      setSavingBank(false);
    }
  };

  const handleExportCSV = () => {
    if (!transactions.length) return alert('No transactions found to export');
    const headers = ['Date', 'Transaction ID', 'Type', 'Gross Amount', 'TDS (2%)', 'Net Amount', 'Status'];
    const rows = transactions.map(tx => [
      new Date(tx.created_at).toLocaleString(),
      tx.id,
      tx.transaction_type || tx.type,
      tx.credit || tx.debit || tx.amount || 0,
      (parseFloat(tx.credit || tx.debit || tx.amount || 0) * 0.02).toFixed(2),
      (parseFloat(tx.credit || tx.debit || tx.amount || 0) * 0.98).toFixed(2),
      tx.status || 'completed'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `wallet_ledger_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val) => `₹${parseFloat(val || 0).toLocaleString('en-IN')}`;

  const availableBal = parseFloat(dashboardData?.wallet?.available_balance ?? dashboardData?.available_balance ?? 0);
  const pendingBal = parseFloat(dashboardData?.wallet?.hold_balance ?? dashboardData?.pending_balance ?? 0);
  const lifetimeEarn = parseFloat(dashboardData?.wallet?.total_earned ?? dashboardData?.lifetime_earnings ?? 0);
  const totalWithdrawnVal = parseFloat(dashboardData?.wallet?.total_withdrawn ?? dashboardData?.total_withdrawn ?? 0);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* ── Dynamic Top Metric Cards (Non-Redundant) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        
        {/* Available Balance */}
        <div style={{
          background: 'linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)',
          borderRadius: '20px',
          padding: '24px',
          color: '#FFFFFF',
          boxShadow: '0 10px 25px rgba(20, 184, 166, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '150px'
        }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', opacity: 0.9 }}>
              AVAILABLE BALANCE
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '8px' }}>
              {formatCurrency(availableBal)}
            </div>
          </div>
          <button
            onClick={() => {
              if (availableBal < 100) return alert('Minimum withdrawal amount is ₹100');
              setWithdrawAmount(availableBal.toString());
              setShowOtpModal(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#FFFFFF',
              color: '#0F766E',
              border: 'none',
              borderRadius: '24px',
              padding: '8px 18px',
              fontSize: '12.5px',
              fontWeight: 800,
              cursor: 'pointer',
              width: 'fit-content',
              marginTop: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }}
          >
            <span>Withdraw Funds</span>
            <MdArrowForward size={16} />
          </button>
        </div>

        {/* Pending Approval */}
        <div style={{
          background: isDark ? '#18181B' : '#FFF7ED',
          border: isDark ? '1px solid #3F3F46' : '1px solid #FFEDD5',
          borderRadius: '20px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '150px'
        }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: isDark ? '#F97316' : '#9A3412', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              PENDING APPROVAL
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: isDark ? '#FFFFFF' : '#EA580C', marginTop: '8px' }}>
              {formatCurrency(pendingBal)}
            </div>
          </div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: isDark ? '#A1A1AA' : '#C2410C', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F97316' }} />
            Awaiting Admin / Bank Verification
          </div>
        </div>

        {/* Total Earnings */}
        <div style={{
          background: isDark ? '#18181B' : '#F5F3FF',
          border: isDark ? '1px solid #3F3F46' : '1px solid #DDD6FE',
          borderRadius: '20px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '150px'
        }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: isDark ? '#A78BFA' : '#5B21B6', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              TOTAL EARNINGS
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: isDark ? '#FFFFFF' : '#6D28D9', marginTop: '8px' }}>
              {formatCurrency(lifetimeEarn)}
            </div>
          </div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: isDark ? '#A1A1AA' : '#7C3AED' }}>
            Lifetime Gross Commissions
          </div>
        </div>

        {/* Total Withdrawn */}
        <div style={{
          background: isDark ? '#18181B' : '#EFF6FF',
          border: isDark ? '1px solid #3F3F46' : '1px solid #DBEAFE',
          borderRadius: '20px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '150px'
        }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: isDark ? '#60A5FA' : '#1E40AF', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              SETTLED PAYOUTS
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: isDark ? '#FFFFFF' : '#2563EB', marginTop: '8px' }}>
              {formatCurrency(totalWithdrawnVal)}
            </div>
          </div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: isDark ? '#A1A1AA' : '#2563EB' }}>
            Disbursed to Bank Account
          </div>
        </div>

      </div>

      {/* ── Navigation Tabs ── */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: `1px solid ${C.border || '#E5E7EB'}`, paddingBottom: '2px', overflowX: 'auto' }}>
        {[
          { id: 'overview', label: 'Overview', icon: MdAccountBalanceWallet },
          { id: 'ledger', label: 'Ledger & Transactions', icon: MdHistory },
          { id: 'withdrawals', label: 'Withdrawal History', icon: MdPayments },
          { id: 'bank', label: 'Bank Setup', icon: MdAccountBalance },
          { id: 'breakup', label: 'Commission Breakup', icon: MdReceipt }
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? `3px solid ${C.primary || '#0052FF'}` : '3px solid transparent',
              color: activeTab === tab.id ? (C.primary || '#0052FF') : (C.textLight || '#94A3B8'),
              padding: '12px 18px',
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════ TAB 1: OVERVIEW ═══════════ */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Primary Bank Status Card */}
          <div style={{
            ...S.card,
            padding: '18px 24px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '12px',
                background: '#EFF6FF', color: '#2563EB',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <MdAccountBalance size={22} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: 800, color: C.text }}>Settlement Bank Account</h4>
                  <span style={{
                    fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px',
                    background: bankDetails?.is_verified ? '#D1FAE5' : '#FEF3C7',
                    color: bankDetails?.is_verified ? '#065F46' : '#B45309'
                  }}>
                    {bankDetails?.is_verified ? 'VERIFIED' : 'UNVERIFIED'}
                  </span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: C.textLight }}>
                  {bankDetails?.bank_name || 'Central Bank of India'} • A/C: {bankDetails?.account_number ? `•••• ${bankDetails.account_number.slice(-4)}` : '•••• 1234'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setActiveTab('bank')}
              style={{
                background: '#0052FF',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 22px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Manage Bank
            </button>
          </div>

          {/* Quick Settlement Form + Recharts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            
            {/* Settlement Form */}
            <div style={{ ...S.card, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: 0 }}>
                Request Bank Settlement
              </h3>
              <form onSubmit={handleSendWithdrawalOTP} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ ...S.label, marginBottom: '6px', display: 'block', fontSize: '13px', fontWeight: 600 }}>Amount (₹)</label>
                  <input 
                    type="number" 
                    placeholder="Enter amount" 
                    style={{ ...S.input, height: '42px', padding: '10px 14px', borderRadius: '8px' }}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    required
                  />
                  {withdrawAmount && parseFloat(withdrawAmount) >= 100 && (
                    <div style={{ marginTop: '8px', padding: '8px 12px', background: `${C.primary}10`, borderRadius: '6px', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Requested Amount:</span>
                        <strong>₹{parseFloat(withdrawAmount).toLocaleString('en-IN')}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#EF4444' }}>
                        <span>TDS Deduction (2%):</span>
                        <strong>-₹{(parseFloat(withdrawAmount) * 0.02).toFixed(2)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10B981', fontWeight: 700 }}>
                        <span>Net Bank Payout:</span>
                        <span>₹{(parseFloat(withdrawAmount) * 0.98).toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: C.textLight }}>
                  Available Balance: {formatCurrency(availableBal)}
                </div>
                <button 
                  type="submit" 
                  disabled={requestingWithdraw || !availableBal || availableBal < 100 || parseFloat(withdrawAmount) < 100 || parseFloat(withdrawAmount) > 50000 || parseFloat(withdrawAmount) > availableBal}
                  style={{ 
                    background: '#0052FF',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    opacity: (requestingWithdraw || !availableBal || availableBal < 100) ? 0.6 : 1
                  }}
                >
                  {requestingWithdraw ? 'Sending OTP...' : 'Request Settlement'}
                </button>
              </form>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: C.bgSecondary, padding: '12px', borderRadius: '8px', fontSize: '11px', color: C.textLight }}>
                <div>⏱️ SLA: 1-2 business days (NEFT/IMPS)</div>
                <div>🛡️ KYC Status: {kycStatus === 'approved' ? '🟢 Verified & Approved' : '🔴 KYC Required'}</div>
              </div>
            </div>

            {/* Monthly Earnings Chart */}
            <div style={{ ...S.card, padding: '20px', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: 0 }}>Monthly Earnings Progression</h3>
              </div>
              <div style={{ flex: 1, minHeight: '220px' }}>
                <ResponsiveContainer width="100%" height={220} minWidth={0}>
                  <AreaChart 
                    data={
                      (dashboardData?.history && dashboardData.history.length > 0)
                        ? dashboardData.history.map(item => ({
                            month_label: item.month_label?.split(' ')[0] || item.month_label,
                            total_credited: parseFloat(item.total_credited || 0)
                          }))
                        : [
                            { month_label: 'May', total_credited: 750 },
                            { month_label: 'Jun', total_credited: 880 },
                            { month_label: 'Jul', total_credited: 1250 },
                            { month_label: 'Aug', total_credited: 920 },
                            { month_label: 'Sep', total_credited: 1180 },
                            { month_label: 'Oct', total_credited: 680 }
                          ]
                    } 
                    margin={{ left: -10, right: 10, top: 10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="earningsColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0052FF" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#0052FF" stopOpacity={0.005}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="month_label" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                    <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Area type="monotone" dataKey="total_credited" stroke="#0052FF" fillOpacity={1} fill="url(#earningsColor)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ═══════════ TAB 2: LEDGER & TRANSACTIONS ═══════════ */}
      {activeTab === 'ledger' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Filters Bar */}
          <div style={{ ...S.card, padding: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: C.bgSecondary, padding: '4px 10px', borderRadius: '8px', flex: 1, minWidth: '200px' }}>
              <MdSearch size={18} style={{ color: C.textLight }} />
              <input 
                type="text" 
                placeholder="Search transaction ID..." 
                value={txSearch} 
                onChange={(e) => setTxSearch(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: C.text, fontSize: '13px', width: '100%' }}
              />
            </div>
            
            <select style={{ ...S.input, width: '150px', margin: 0 }} value={txType} onChange={e => setTxType(e.target.value)}>
              <option value="">All Types</option>
              <option value="PERSONAL_COMMISSION">Personal Commission</option>
              {!isTeamMember && <option value="TEAM_COMMISSION">Team Commission</option>}
              <option value="WITHDRAWAL">Withdrawal</option>
              <option value="REFERRAL_BONUS">Referral Bonus</option>
            </select>

            <select style={{ ...S.input, width: '150px', margin: 0 }} value={txStatus} onChange={e => setTxStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="completed">Completed / Released</option>
              <option value="pending">Pending</option>
            </select>

            <button onClick={fetchTransactions} style={{ ...S.btn('primary'), padding: '8px 16px', borderRadius: '8px' }}>
              <MdFilterList size={16} /> Filter
            </button>

            <button onClick={handleExportCSV} style={{ ...S.btn('outline'), padding: '8px 16px', borderRadius: '8px' }}>
              <MdFileDownload size={16} style={{ color: C.green }} /> CSV
            </button>
          </div>

          {/* Transactions List */}
          <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}` }}>
                    <th style={{ padding: '12px 16px', fontSize: '11px', color: C.textLight, textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', color: C.textLight, textAlign: 'left' }}>Transaction ID</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', color: C.textLight, textAlign: 'left' }}>Type</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', color: C.textLight, textAlign: 'right' }}>Gross Amount</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', color: C.textLight, textAlign: 'right' }}>TDS (2%)</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', color: C.textLight, textAlign: 'right' }}>Net Amount</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', color: C.textLight, textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingTx ? (
                    <tr>
                      <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: C.textLight }}>Loading ledger records...</td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: C.textLight }}>No transaction logs found.</td>
                    </tr>
                  ) : (
                    transactions.map((tx) => {
                      const isCredit = parseFloat(tx.credit || 0) > 0;
                      const amt = isCredit ? parseFloat(tx.credit) : parseFloat(tx.debit || tx.amount || 0);
                      const tds = amt * 0.02;
                      const net = amt * 0.98;

                      return (
                        <tr key={tx.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                          <td style={{ padding: '14px 16px', fontSize: '12.5px', color: C.text }}>{new Date(tx.created_at).toLocaleString()}</td>
                          <td style={{ padding: '14px 16px', fontSize: '12.5px', color: C.text, fontFamily: 'monospace' }}>{tx.id.substring(0, 8)}...</td>
                          <td style={{ padding: '14px 16px', fontSize: '12.5px' }}>
                            <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '4px', background: isCredit ? '#D1FAE5' : '#FEE2E2', color: isCredit ? '#065F46' : '#991B1B', fontWeight: 700 }}>
                              {tx.transaction_type || tx.type}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '13px', color: C.text, textAlign: 'right', fontWeight: 600 }}>{formatCurrency(amt)}</td>
                          <td style={{ padding: '14px 16px', fontSize: '13px', color: '#EF4444', textAlign: 'right' }}>-₹{tds.toFixed(2)}</td>
                          <td style={{ padding: '14px 16px', fontSize: '13.5px', color: isCredit ? '#10B981' : '#EF4444', textAlign: 'right', fontWeight: 700 }}>
                            {isCredit ? '+' : '-'}{formatCurrency(net)}
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '12px', textAlign: 'center' }}>
                            <span style={{ fontSize: '10.5px', padding: '4px 10px', borderRadius: '12px', fontWeight: 700, background: '#D1FAE5', color: '#065F46' }}>
                              {tx.status || 'completed'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ TAB 3: WITHDRAWAL HISTORY ═══════════ */}
      {activeTab === 'withdrawals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ ...S.card, padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: 0 }}>Withdrawal Requests</h3>
              <button onClick={fetchWithdrawals} style={{ ...S.btn('outline'), fontSize: '12px', padding: '6px 12px' }}>
                <MdRefresh size={14} /> Refresh
              </button>
            </div>

            {loadingWithdrawals ? (
              <div style={{ padding: '30px', textAlign: 'center', color: C.textLight }}>Loading withdrawal history...</div>
            ) : withdrawals.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: C.textLight }}>No withdrawal history records found.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {withdrawals.map((w) => {
                  const statusColor = (w.status === 'transferred' || w.status === 'completed') ? '#10B981' : w.status === 'pending' ? '#F59E0B' : '#EF4444';
                  const tdsAmt = parseFloat(w.amount) * 0.02;
                  const netAmt = parseFloat(w.amount) - tdsAmt;

                  return (
                    <div key={w.id} style={{ padding: '16px', borderRadius: '12px', border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: C.text }}>Request #{w.id.substring(0, 8)}</span>
                          <span style={{ fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '8px', background: `${statusColor}20`, color: statusColor, textTransform: 'uppercase' }}>
                            {w.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: C.textLight, marginTop: '4px' }}>
                          Date: {new Date(w.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: C.text }}>{formatCurrency(w.amount)}</div>
                        <div style={{ fontSize: '11px', color: C.textLight }}>
                          TDS (2%): -₹{tdsAmt.toFixed(2)} • Net: <strong style={{ color: '#10B981' }}>₹{netAmt.toFixed(2)}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════ TAB 4: BANK SETUP ═══════════ */}
      {activeTab === 'bank' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ ...S.card, padding: '24px', maxWidth: '600px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: '0 0 16px' }}>Configure Primary Settlement Bank</h3>
            <form onSubmit={handleSaveBank} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={S.label}>Account Holder Name</label>
                <input type="text" style={S.input} value={bankDetails.account_holder_name} onChange={(e) => setBankDetails({ ...bankDetails, account_holder_name: e.target.value })} disabled={kycStatus !== 'approved'} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={S.label}>Bank Name</label>
                  <input type="text" style={S.input} value={bankDetails.bank_name} onChange={(e) => setBankDetails({ ...bankDetails, bank_name: e.target.value })} disabled={kycStatus !== 'approved'} required />
                </div>
                <div>
                  <label style={S.label}>Branch Name</label>
                  <input type="text" style={S.input} value={bankDetails.branch_name || ''} onChange={(e) => setBankDetails({ ...bankDetails, branch_name: e.target.value })} disabled={kycStatus !== 'approved'} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={S.label}>Account Number</label>
                  <input type="password" style={S.input} value={bankDetails.account_number} onChange={(e) => setBankDetails({ ...bankDetails, account_number: e.target.value })} disabled={kycStatus !== 'approved'} required />
                </div>
                <div>
                  <label style={S.label}>IFSC Code</label>
                  <input type="text" style={S.input} value={bankDetails.ifsc_code} onChange={(e) => setBankDetails({ ...bankDetails, ifsc_code: e.target.value })} disabled={kycStatus !== 'approved'} required />
                </div>
              </div>
              <button type="submit" disabled={savingBank || kycStatus !== 'approved'} style={{ ...S.btn('primary'), borderRadius: '10px', marginTop: '6px' }}>
                {savingBank ? 'Saving...' : 'Save Bank Details'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════ TAB 5: COMMISSION BREAKUP ═══════════ */}
      {activeTab === 'breakup' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ ...S.card, padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, marginBottom: '16px' }}>Product Commission Breakdown</h3>
            {loadingCommissionSummary ? (
              <div style={{ padding: '30px', textAlign: 'center', color: C.textLight }}>Loading commission breakup...</div>
            ) : commissionSummary.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: C.textLight }}>No commission breakup data available yet.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}` }}>
                      <th style={{ padding: '12px 16px', fontSize: '11px', color: C.textLight, textAlign: 'left' }}>Product</th>
                      <th style={{ padding: '12px 16px', fontSize: '11px', color: C.textLight, textAlign: 'right' }}>Total Cases</th>
                      <th style={{ padding: '12px 16px', fontSize: '11px', color: C.textLight, textAlign: 'right' }}>Approved Cases</th>
                      <th style={{ padding: '12px 16px', fontSize: '11px', color: C.textLight, textAlign: 'right' }}>Commission Earned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissionSummary.map((cs, idx) => (
                      <tr key={idx} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 700, color: C.text }}>{cs.product_name}</td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', textAlign: 'right' }}>{cs.total_cases}</td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', textAlign: 'right', color: '#10B981', fontWeight: 700 }}>{cs.approved_cases}</td>
                        <td style={{ padding: '14px 16px', fontSize: '14px', textAlign: 'right', fontWeight: 800, color: '#0F766E' }}>
                          {formatCurrency(cs.commission_earned)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── OTP Verification Modal ── */}
      {showOtpModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '16px'
        }}>
          <div style={{ ...S.card, maxWidth: '440px', width: '100%', padding: '24px', borderRadius: '16px' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800 }}>Confirm Payout Settlement</h3>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: C.textLight }}>
              Enter the 6-digit OTP code sent to <strong>{emailMasked}</strong> to confirm withdrawal of <strong>{formatCurrency(withdrawAmount)}</strong> (Net Payout after 2% TDS: <strong>{formatCurrency(parseFloat(withdrawAmount || 0) * 0.98)}</strong>).
            </p>
            <form onSubmit={handleConfirmWithdrawalOTP} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input 
                type="text" 
                maxLength={6} 
                placeholder="123456" 
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                style={{ ...S.input, letterSpacing: '8px', textAlign: 'center', fontSize: '20px', fontWeight: 800 }}
                required
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowOtpModal(false)} style={{ ...S.btn('outline'), flex: 1 }}>Cancel</button>
                <button type="submit" disabled={verifyingOtp || otpCode.length !== 6} style={{ ...S.btn('primary'), flex: 2 }}>
                  {verifyingOtp ? 'Verifying...' : 'Verify & Withdraw'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default PartnerWallet;
