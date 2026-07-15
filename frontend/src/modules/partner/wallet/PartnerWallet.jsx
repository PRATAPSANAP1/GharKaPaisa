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
  MdCheckCircle, 
  MdError,
  MdRefresh,
  MdPayments,
  MdTrendingUp,
  MdReceipt,
  MdNotifications,
  MdVerifiedUser,
  MdWarning,
  MdClose,
  MdPrint,
  MdContentCopy,
  MdArrowForward,
  MdSchedule
} from 'react-icons/md';
import RazorpayCheckoutButton from '../../../components/Razorpay/RazorpayCheckoutButton';
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
  Legend,
  Cell
} from 'recharts';

const PartnerWallet = () => {
  const { t } = useTranslation();
  const { C } = useTheme();
  const S = makeS(C);
  const user = useAuthStore((state) => state.user);

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Dashboard state
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
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  // Statement download states
  const [stmtFromDate, setStmtFromDate] = useState('');
  const [stmtToDate, setStmtToDate] = useState('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  // Withdrawal form states
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawRemarks, setWithdrawRemarks] = useState('');
  const [requestingWithdraw, setRequestingWithdraw] = useState(false);

  // OTP withdrawal states
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

  // Secondary bank & all banks lists
  const [allBanks, setAllBanks] = useState([]);
  const [loadingAllBanks, setLoadingAllBanks] = useState(false);
  const [bankHistory, setBankHistory] = useState([]);
  const [loadingBankHistory, setLoadingBankHistory] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showSecondaryForm, setShowSecondaryForm] = useState(false);
  const [secondaryBankDetails, setSecondaryBankDetails] = useState({
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    account_holder_name: '',
    upi_id: '',
    branch_name: ''
  });
  const [savingSecondary, setSavingSecondary] = useState(false);
  const [verifyingBankId, setVerifyingBankId] = useState(null);

  // Withdrawal list states
  const [withdrawals, setWithdrawals] = useState([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);
  const [cancellingWithdrawalId, setCancellingWithdrawalId] = useState(null);
  const [retryingWithdrawalId, setRetryingWithdrawalId] = useState(null);

  // Modals for detail views
  const [selectedTxForBreakup, setSelectedTxForBreakup] = useState(null);
  const [selectedWithdrawalForReceipt, setSelectedWithdrawalForReceipt] = useState(null);
  const [selectedWithdrawalForTds, setSelectedWithdrawalForTds] = useState(null);

  // Commission Summary state
  const [commissionSummary, setCommissionSummary] = useState([]);
  const [loadingCommissionSummary, setLoadingCommissionSummary] = useState(false);

  // Copy helper
  const [copiedText, setCopiedText] = useState('');

  const copyToClipboard = (text) => {
    navigator.clipboard?.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(''), 2000);
  };

  // Initial Data Loader
  useEffect(() => {
    fetchDashboard();
    fetchBankDetails();
    fetchKYCStatus();
    fetchAllBanks();
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

  const fetchAllBanks = async () => {
    setLoadingAllBanks(true);
    try {
      const res = await api.get('/wallet/bank-details/all');
      if (res.data?.success) {
        setAllBanks(res.data.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch all bank accounts:', e);
    } finally {
      setLoadingAllBanks(false);
    }
  };

  const fetchBankHistory = async () => {
    setLoadingBankHistory(true);
    try {
      const res = await api.get('/wallet/bank-details/history');
      if (res.data?.success) {
        setBankHistory(res.data.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch bank history:', e);
    } finally {
      setLoadingBankHistory(false);
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
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        search: txSearch || undefined,
        min_amount: minAmount || undefined,
        max_amount: maxAmount || undefined
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
        setEmailMasked(res.data.data?.email_sent_to || 'your email');
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

  // Step 2: Confirm OTP & Request Withdrawal Payout
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

  // Cancel Pending Withdrawal Request
  const handleCancelWithdrawal = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this withdrawal request?')) return;
    setCancellingWithdrawalId(id);
    try {
      const res = await api.post(`/wallet/withdrawals/${id}/cancel`);
      if (res.data?.success) {
        alert(res.data.message || 'Withdrawal request cancelled successfully. Funds restored to available balance.');
        fetchDashboard();
        fetchWithdrawals();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel withdrawal request.');
    } finally {
      setCancellingWithdrawalId(null);
    }
  };

  // Retry Failed Withdrawal Request
  const handleRetryWithdrawal = async (id) => {
    if (!window.confirm('Would you like to retry this withdrawal request?')) return;
    setRetryingWithdrawalId(id);
    try {
      const res = await api.post(`/wallet/withdrawals/${id}/retry`);
      if (res.data?.success) {
        alert(res.data.message || 'Withdrawal request resubmitted successfully!');
        fetchDashboard();
        fetchWithdrawals();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to retry withdrawal request.');
    } finally {
      setRetryingWithdrawalId(null);
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
        fetchAllBanks();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update primary bank details.');
    } finally {
      setSavingBank(false);
    }
  };

  // Save Secondary Bank Details
  const handleSaveSecondaryBank = async (e) => {
    e.preventDefault();
    if (kycStatus !== 'approved') {
      return alert('Bank details can only be configured by KYC approved partners');
    }
    setSavingSecondary(true);
    try {
      const res = await api.post('/wallet/bank-details/secondary', secondaryBankDetails);
      if (res.data?.success) {
        alert('Secondary bank details added successfully!');
        setSecondaryBankDetails({
          bank_name: '',
          account_number: '',
          ifsc_code: '',
          account_holder_name: '',
          upi_id: '',
          branch_name: ''
        });
        setShowSecondaryForm(false);
        fetchAllBanks();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add secondary bank details.');
    } finally {
      setSavingSecondary(false);
    }
  };

  // Switch Primary Bank Account
  const handleSetPrimary = async (bankId) => {
    try {
      const res = await api.post('/wallet/bank-details/primary', { bank_id: bankId });
      if (res.data?.success) {
        alert('Primary bank account updated successfully!');
        fetchAllBanks();
        fetchBankDetails();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to set primary bank account.');
    }
  };

  // Verify Bank via penny drop
  const handleVerifyPennyDrop = async (bankId) => {
    setVerifyingBankId(bankId);
    try {
      const res = await api.post('/wallet/bank-details/verify/penny-drop', { bank_id: bankId });
      if (res.data?.success) {
        alert(`Verification Success!\nBeneficiary: ${res.data.data.beneficiary_name}\nBank: ${res.data.data.bank_name}\nDeposit: ₹${res.data.data.penny_amount}`);
        fetchAllBanks();
        fetchBankDetails();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Penny drop verification failed.');
    } finally {
      setVerifyingBankId(null);
    }
  };

  // Verify Bank via UPI
  const handleVerifyUPI = async (bankId) => {
    setVerifyingBankId(bankId);
    try {
      const res = await api.post('/wallet/bank-details/verify/upi', { bank_id: bankId });
      if (res.data?.success) {
        alert(`UPI Verification Success!\nUPI ID: ${res.data.data.upi_id}\nBeneficiary: ${res.data.data.beneficiary_name}`);
        fetchAllBanks();
        fetchBankDetails();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'UPI verification failed.');
    } finally {
      setVerifyingBankId(null);
    }
  };

  const handleExportCSV = () => {
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

  // Helper: Download blob
  const downloadBlob = (data, filename, mime) => {
    const blob = new Blob([data], { type: mime });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Download PDF Statement
  const handleDownloadPdf = async () => {
    if (!stmtFromDate || !stmtToDate) return alert('Please select both from and to dates for statement download.');
    setDownloadingPdf(true);
    try {
      const res = await api.get('/wallet/statement/pdf', {
        params: { from_date: stmtFromDate, to_date: stmtToDate },
        responseType: 'blob'
      });
      downloadBlob(res.data, `wallet_statement_${stmtFromDate}_to_${stmtToDate}.pdf`, 'application/pdf');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate PDF statement.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Download Excel Statement
  const handleDownloadExcel = async () => {
    if (!stmtFromDate || !stmtToDate) return alert('Please select both from and to dates for statement download.');
    setDownloadingExcel(true);
    try {
      const res = await api.get('/wallet/statement/excel', {
        params: { from_date: stmtFromDate, to_date: stmtToDate },
        responseType: 'blob'
      });
      downloadBlob(res.data, `wallet_statement_${stmtFromDate}_to_${stmtToDate}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate Excel statement.');
    } finally {
      setDownloadingExcel(false);
    }
  };

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

  // Extract wallet balances safely
  const availableBal = dashboardData?.wallet?.available_balance ?? dashboardData?.available_balance ?? 0;
  const pendingBal = dashboardData?.wallet?.hold_balance ?? dashboardData?.pending_balance ?? 0;
  const todayEarn = dashboardData?.today_earnings ?? 0;
  const monthlyEarn = dashboardData?.monthly_earnings ?? 0;
  const lifetimeEarn = dashboardData?.wallet?.total_earned ?? dashboardData?.lifetime_earnings ?? 0;
  const totalWithdrawnVal = dashboardData?.wallet?.total_withdrawn ?? dashboardData?.total_withdrawn ?? 0;
  const overrideComm = dashboardData?.wallet?.override_balance ?? dashboardData?.override_commission ?? 0;
  const refBonus = dashboardData?.wallet?.referral_bonus ?? dashboardData?.referral_bonus ?? 0;

  // Chart data colors
  const CHART_COLORS = ['#0F766E', '#1D4ED8', '#B45309', '#701A75', '#0369A1', '#15803D'];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      {/* Top Wallet Summary Cards Matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        
        {/* Primary Available Balance Card with Withdraw CTA */}
        <div style={{
          background: 'linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)',
          borderRadius: '20px',
          padding: '24px',
          color: '#FFFFFF',
          boxShadow: '0 10px 25px rgba(20, 184, 166, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          justify: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9 }}>
              Available Balance (Withdrawal Ready)
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '8px' }}>
              ₹{parseFloat(availableBal).toLocaleString('en-IN')}
            </div>
          </div>

          <button
            onClick={() => {
              if (parseFloat(availableBal) < 100) return alert('Minimum withdrawal amount is ₹100');
              setWithdrawAmount(availableBal.toString());
              setShowOtpModal(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justify: 'center',
              gap: '8px',
              background: '#FFFFFF',
              color: '#0F766E',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 800,
              cursor: 'pointer',
              marginTop: '16px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              transition: 'transform 0.2s ease'
            }}
          >
            <span>Withdraw Funds</span>
            <MdArrowForward size={18} />
          </button>
        </div>

        {/* Held Balance Card */}
        <div style={{ ...S.card, padding: '24px', borderRadius: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: C.textLight, textTransform: 'uppercase' }}>
              Held Balance (7-Day Hold)
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: C.gold, marginTop: '8px' }}>
              ₹{parseFloat(pendingBal).toLocaleString('en-IN')}
            </div>
          </div>
          <div style={{ fontSize: '12px', color: C.textLight, marginTop: '12px' }}>
            Auto-matures to Available Balance in 7 days
          </div>
        </div>

        {/* Total Earned Card */}
        <div style={{ ...S.card, padding: '24px', borderRadius: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: C.textLight, textTransform: 'uppercase' }}>
              Lifetime Total Earned
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: C.green, marginTop: '8px' }}>
              ₹{parseFloat(lifetimeEarn).toLocaleString('en-IN')}
            </div>
          </div>
          <div style={{ fontSize: '12px', color: C.textLight, marginTop: '12px' }}>
            Total Withdrawn: ₹{parseFloat(totalWithdrawnVal).toLocaleString('en-IN')}
          </div>
        </div>

      </div>

      {/* Modern 5 Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: `1px solid ${C.border}`, paddingBottom: '2px', overflowX: 'auto' }}>
        {[
          { id: 'dashboard', label: 'Overview', icon: MdAccountBalanceWallet },
          { id: 'ledger', label: 'Ledger & Reports', icon: MdHistory },
          { id: 'withdrawals', label: 'Withdrawal Module', icon: MdPayments },
          { id: 'bank', label: 'Bank Setup', icon: MdAccountBalance },
          { id: 'breakup', label: 'Commission Breakup', icon: MdReceipt }
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? `3px solid ${C.teal}` : '3px solid transparent',
              color: activeTab === tab.id ? C.teal : C.textLight,
              padding: '10px 18px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap'
            }}
          >
            <tab.icon size={18} /> {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════ TAB 1: OVERVIEW ═══════════ */}
      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Real-time KPI Statistics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            <StatBox 
              title={t("Available Wallet Balance")} 
              value={availableBal} 
              gradient="linear-gradient(135deg, #0f766e, #134e4a)" 
              subtitle={t("Ready for bank settlement")}
            />
            <StatBox 
              title={t("Held Balance (Pending)")} 
              value={pendingBal} 
              gradient="linear-gradient(135deg, #b45309, #78350f)" 
              subtitle={t("Releases in 48h maturity schedule")}
            />
            <StatBox 
              title={t("Lifetime Ledger Earnings")} 
              value={lifetimeEarn} 
              gradient="linear-gradient(135deg, #475569, #1e293b)" 
              subtitle={t("Total gross commission credited")}
            />
            <StatBox 
              title={t("Team Override Earnings")} 
              value={overrideComm} 
              gradient="linear-gradient(135deg, #0369a1, #0c4a6e)" 
              subtitle={t("Override from child network")}
            />
          </div>

          {/* Quick Bank Status Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            
            {/* Bank Verification Card */}
            <div style={{ ...S.card, padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: 48, height: 48, borderRadius: '12px',
                background: bankDetails?.is_verified ? `${C.green}15` : `${C.gold}15`,
                color: bankDetails?.is_verified ? C.green : C.gold,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <MdAccountBalance size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: C.text }}>Bank Verification Status</h4>
                  <span style={{
                    fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px',
                    background: bankDetails?.is_verified ? `${C.green}20` : bankDetails?.account_number ? `${C.gold}20` : `${C.red}20`,
                    color: bankDetails?.is_verified ? C.green : bankDetails?.account_number ? C.gold : C.red
                  }}>
                    {bankDetails?.is_verified ? 'VERIFIED' : bankDetails?.account_number ? 'UNVERIFIED' : 'NOT LINKED'}
                  </span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: C.textLight }}>
                  {bankDetails?.bank_name ? `${bankDetails.bank_name} • A/C: ****${bankDetails.account_number?.slice(-4) || ''}` : 'No primary bank account set up yet.'}
                </p>
              </div>
              <button 
                onClick={() => setActiveTab('bank')}
                style={{ ...S.btn('outline'), fontSize: '12px', padding: '6px 12px', borderRadius: '8px' }}
              >
                Manage
              </button>
            </div>

          </div>

          {/* Quick Settlement Form + Recharts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            
            {/* Quick Settlement Form */}
            <div style={{ ...S.card, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MdPayments size={20} /> Request Bank Settlement
              </h3>
              <form onSubmit={handleSendWithdrawalOTP} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={S.label}>{t("Request Amount (₹)")}</label>
                  <input 
                    type="number" 
                    placeholder={t("Min ₹100, Max ₹50,000")} 
                    style={S.input}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    required
                  />
                  {withdrawAmount && (parseFloat(withdrawAmount) < 100 || parseFloat(withdrawAmount) > 50000) && (
                    <div style={{ color: '#EF4444', fontSize: '11px', fontWeight: 600, marginTop: '4px' }}>
                      ⚠️ Single request limit: Min ₹100 — Max ₹50,000
                    </div>
                  )}
                  {withdrawAmount && parseFloat(withdrawAmount) > availableBal && (
                    <div style={{ color: '#EF4444', fontSize: '11px', fontWeight: 600, marginTop: '4px' }}>
                      ⚠️ Exceeds available balance (Available: ₹{availableBal.toLocaleString('en-IN')})
                    </div>
                  )}
                </div>
                <button 
                  type="submit" 
                  disabled={requestingWithdraw || !availableBal || availableBal < 100 || parseFloat(withdrawAmount) < 100 || parseFloat(withdrawAmount) > 50000 || parseFloat(withdrawAmount) > availableBal}
                  style={{ 
                    ...S.btn('primary'), 
                    marginTop: '8px', 
                    borderRadius: '10px',
                    opacity: (requestingWithdraw || !availableBal || availableBal < 100 || parseFloat(withdrawAmount) < 100 || parseFloat(withdrawAmount) > 50000 || parseFloat(withdrawAmount) > availableBal) ? 0.6 : 1,
                    cursor: (requestingWithdraw || !availableBal || availableBal < 100 || parseFloat(withdrawAmount) < 100 || parseFloat(withdrawAmount) > 50000 || parseFloat(withdrawAmount) > availableBal) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {requestingWithdraw ? 'Sending Request...' : 'Proceed to OTP Verification'}
                </button>
              </form>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: C.bgSecondary, padding: '12px', borderRadius: '8px', fontSize: '11px', color: C.textLight }}>
                <div>⏱️ Settlement SLA: 1-2 business days (NEFT/IMPS)</div>
                <div>🛡️ KYC Lock Status: {kycStatus === 'approved' ? '🟢 Verified & Approved' : '🔴 KYC Required'}</div>
              </div>
            </div>

            {/* Earnings Chart */}
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

      {/* ═══════════ TAB 2: LEDGER & REPORTS ═══════════ */}
      {activeTab === 'ledger' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Statement Export Widget */}
          <div style={{ ...S.card, padding: '18px 24px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', background: `linear-gradient(135deg, ${C.primary}10, ${C.card})` }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: 0 }}>Download Account Statement</h3>
              <p style={{ fontSize: '12px', color: C.textLight, margin: '4px 0 0' }}>Select date range to generate verified PDF or Excel ledger statement.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <input 
                type="date" 
                value={stmtFromDate} 
                onChange={(e) => setStmtFromDate(e.target.value)}
                style={{ ...S.input, width: '140px', padding: '6px 10px', fontSize: '12px' }}
              />
              <span style={{ fontSize: '12px', color: C.textLight }}>to</span>
              <input 
                type="date" 
                value={stmtToDate} 
                onChange={(e) => setStmtToDate(e.target.value)}
                style={{ ...S.input, width: '140px', padding: '6px 10px', fontSize: '12px' }}
              />
              <button
                disabled={downloadingPdf}
                onClick={handleDownloadPdf}
                style={{ ...S.btn('primary'), padding: '8px 14px', borderRadius: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', opacity: downloadingPdf ? 0.6 : 1 }}
              >
                <MdFileDownload size={16} /> PDF Statement
              </button>
              <button
                disabled={downloadingExcel}
                onClick={handleDownloadExcel}
                style={{ ...S.btn('outline'), padding: '8px 14px', borderRadius: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', opacity: downloadingExcel ? 0.6 : 1 }}
              >
                <MdFileDownload size={16} style={{ color: C.green }} /> Excel Statement
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div style={{ ...S.card, padding: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', items: 'center', gap: '6px', background: C.bgSecondary, padding: '4px 10px', borderRadius: '8px', flex: 1, minWidth: '200px' }}>
              <MdSearch size={18} style={{ color: C.textLight, marginTop: '8px' }} />
              <input 
                type="text" 
                placeholder={t("Search by ID or Reference...")} 
                value={txSearch} 
                onChange={(e) => setTxSearch(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: C.text, fontSize: '13px', width: '100%', padding: '6px 0' }}
              />
            </div>
            
            <select style={{ ...S.input, width: '150px', margin: 0 }} value={txType} onChange={e => setTxType(e.target.value)}>
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

            <input 
              type="date" 
              title="From Date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{ ...S.input, width: '130px', margin: 0, padding: '6px 10px', fontSize: '12px' }}
            />

            <input 
              type="date" 
              title="To Date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{ ...S.input, width: '130px', margin: 0, padding: '6px 10px', fontSize: '12px' }}
            />

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
              <MdFileDownload size={16} style={{ color: C.green }} /> CSV
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
                    <th style={{ padding: '12px 16px', fontSize: '11px', color: C.textLight, textAlign: 'right', textTransform: 'uppercase' }}>{t("Gross Amount")}</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', color: C.textLight, textAlign: 'right', textTransform: 'uppercase' }}>{t("TDS (5%)")}</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', color: C.textLight, textAlign: 'right', textTransform: 'uppercase' }}>{t("Net Amount")}</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', color: C.textLight, textAlign: 'center', textTransform: 'uppercase' }}>{t("Status")}</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', color: C.textLight, textAlign: 'center', textTransform: 'uppercase' }}>{t("Breakup")}</th>
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
                      const tds = parseFloat(tx.tds || (isCredit ? amt * 0.05 : 0));
                      const net = parseFloat(tx.net_amount || (isCredit ? amt - tds : amt));
                      
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
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <button
                              onClick={() => setSelectedTxForBreakup(tx)}
                              style={{
                                background: 'transparent',
                                border: `1px solid ${C.border}`,
                                color: C.teal,
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              View
                            </button>
                          </td>
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

      {/* ═══════════ TAB 3: WITHDRAWAL MODULE ═══════════ */}
      {activeTab === 'withdrawals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Top Withdrawal Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div style={{ ...S.card, padding: '20px', background: `linear-gradient(135deg, ${C.teal}15, ${C.card})`, border: `1px solid ${C.teal}30` }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: C.teal, textTransform: 'uppercase' }}>Available to Withdraw</div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: C.text, margin: '6px 0' }}>{formatCurrency(availableBal)}</div>
              <div style={{ fontSize: '11px', color: C.textLight }}>Limit per single request: ₹100 — ₹50,000</div>
            </div>

            <div style={{ ...S.card, padding: '20px', background: `linear-gradient(135deg, ${C.gold}15, ${C.card})`, border: `1px solid ${C.gold}30` }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: C.gold, textTransform: 'uppercase' }}>Pending Withdrawals</div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: C.text, margin: '6px 0' }}>
                {formatCurrency(withdrawals.filter(w => w.status === 'pending' || w.status === 'approved' || w.status === 'processing').reduce((acc, w) => acc + parseFloat(w.amount || 0), 0))}
              </div>
              <div style={{ fontSize: '11px', color: C.textLight }}>
                {withdrawals.filter(w => w.status === 'pending').length} request(s) currently under review
              </div>
            </div>

            <div style={{ ...S.card, padding: '20px', background: `linear-gradient(135deg, ${C.green}15, ${C.card})`, border: `1px solid ${C.green}30` }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: C.green, textTransform: 'uppercase' }}>Lifetime Settled Payouts</div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: C.text, margin: '6px 0' }}>{formatCurrency(totalWithdrawnVal)}</div>
              <div style={{ fontSize: '11px', color: C.textLight }}>{withdrawals.filter(w => w.status === 'transferred' || w.status === 'completed').length} successful bank payouts</div>
            </div>
          </div>

          {/* Request Withdrawal Form & Guidelines */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            <div style={{ ...S.card, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: 0 }}>Initiate Withdrawal Payout</h3>
              
              {withdrawals.some(w => w.status === 'pending') && (
                <div style={{ background: `${C.gold}15`, border: `1px solid ${C.gold}30`, padding: '12px 16px', borderRadius: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <MdWarning size={20} style={{ color: C.gold, flexShrink: 0 }} />
                  <div style={{ fontSize: '12px', color: C.text }}>
                    <strong>Duplicate Request Prevention:</strong> You have an active pending withdrawal request. Please wait until it completes or cancel it below before creating another.
                  </div>
                </div>
              )}

              <form onSubmit={handleSendWithdrawalOTP} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={S.label}>Withdrawal Amount (₹)</label>
                  <input 
                    type="number" 
                    placeholder="Min ₹100, Max ₹50,000"
                    style={S.input}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    required
                  />
                  <div style={{ fontSize: '11px', color: C.textLight, marginTop: '4px' }}>
                    <span>Min: ₹100 — Max: ₹50,000</span>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={requestingWithdraw || withdrawals.some(w => w.status === 'pending') || !availableBal || availableBal < 100 || parseFloat(withdrawAmount) < 100 || parseFloat(withdrawAmount) > 50000}
                  style={{ ...S.btn('primary'), borderRadius: '10px', padding: '12px', marginTop: '6px', opacity: (requestingWithdraw || withdrawals.some(w => w.status === 'pending') || !availableBal || availableBal < 100 || parseFloat(withdrawAmount) < 100 || parseFloat(withdrawAmount) > 50000) ? 0.6 : 1 }}
                >
                  {requestingWithdraw ? 'Sending OTP...' : 'Send OTP & Confirm'}
                </button>
              </form>
            </div>

            <div style={{ ...S.card, padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 800, color: C.text, margin: 0 }}>Payout Rules & SLA</h4>
              <ul style={{ fontSize: '12.5px', color: C.textMid, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', margin: 0 }}>
                <li>⚡ <strong>Automated Razorpay Payouts:</strong> Approved withdrawals are instantly transferred via Razorpay Bank API / NEFT / IMPS.</li>
                <li>📋 <strong>5% TDS Deduction:</strong> Section 194H of IT Act applies. Download Form 16A / TDS Certificates below for your tax filing.</li>
                <li>🔒 <strong>OTP Security Verification:</strong> An email 2FA OTP is required for every payout request to protect your funds.</li>
                <li>🔄 <strong>Instant Cancellation:</strong> Pending requests can be cancelled anytime to restore funds immediately.</li>
              </ul>
            </div>
          </div>

          {/* Withdrawal History Timeline & Table */}
          <div style={{ ...S.card, padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: 0 }}>Withdrawal History & Payout Timeline</h3>
              <button 
                onClick={fetchWithdrawals}
                style={{ ...S.btn('outline'), fontSize: '12px', padding: '6px 12px', borderRadius: '8px' }}
              >
                <MdRefresh size={14} /> Refresh Timeline
              </button>
            </div>

            {loadingWithdrawals ? (
              <div style={{ padding: '30px', textAlign: 'center', color: C.textLight }}>Loading withdrawal history...</div>
            ) : withdrawals.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: C.textLight }}>No withdrawal history records found.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {withdrawals.map((w) => {
                  const statusColor = (w.status === 'transferred' || w.status === 'completed') ? C.green : w.status === 'pending' ? C.gold : w.status === 'processing' ? C.primary : C.red;
                  const tdsAmt = parseFloat(w.amount) * 0.05;
                  const netAmt = parseFloat(w.amount) - tdsAmt;
                  const utrNum = w.utr || w.utr_number || w.bank_reference || null;

                  return (
                    <div key={w.id} style={{
                      padding: '18px 20px',
                      borderRadius: '12px',
                      border: `1px solid ${C.border}`,
                      background: C.bgCard,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      {/* Top Header Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '16px', fontWeight: 800, color: C.text }}>Request #{w.id.substring(0, 8)}</span>
                            <span style={{
                              fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '12px',
                              background: `${statusColor}15`, color: statusColor, textTransform: 'uppercase'
                            }}>
                              {w.status}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: C.textLight, marginTop: '4px' }}>
                            Created: {new Date(w.created_at).toLocaleString('en-IN')}
                          </div>
                        </div>

                        {/* Amount breakdown */}
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '18px', fontWeight: 800, color: C.text }}>Gross: ₹{parseFloat(w.amount).toLocaleString('en-IN')}</div>
                          <div style={{ fontSize: '12px', color: C.textLight }}>
                            TDS (5%): -₹{tdsAmt.toFixed(2)} • Net Paid: <strong style={{ color: C.green }}>₹{netAmt.toFixed(2)}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Bank & Remarks metadata */}
                      <div style={{
                        display: 'flex', flexWrap: 'wrap', gap: '16px', padding: '12px',
                        background: C.bgSecondary, borderRadius: '8px', fontSize: '12px', color: C.text
                      }}>
                        <div>Bank: <strong>{w.bank_name || 'Bank Transfer'}</strong></div>
                        {w.account_number && <div>A/C: <span style={{ fontFamily: 'monospace' }}>•••• {w.account_number.slice(-4)}</span></div>}
                        {w.ifsc_code && <div>IFSC: <strong>{w.ifsc_code}</strong></div>}
                        {utrNum && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: C.green, fontWeight: 700 }}>
                            UTR: {utrNum}
                            <button
                              onClick={() => copyToClipboard(utrNum)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.green, padding: 0 }}
                              title="Copy UTR"
                            >
                              <MdContentCopy size={12} />
                            </button>
                            {copiedText === utrNum && <span style={{ fontSize: '10px', color: C.green }}>Copied!</span>}
                          </div>
                        )}
                        {w.failure_reason && <div style={{ color: C.red }}>Reason: {w.failure_reason}</div>}
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
                        {w.status === 'pending' && (
                          <button
                            disabled={cancellingWithdrawalId === w.id}
                            onClick={() => handleCancelWithdrawal(w.id)}
                            style={{
                              background: 'transparent', border: `1px solid ${C.red}`, color: C.red,
                              padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer'
                            }}
                          >
                            {cancellingWithdrawalId === w.id ? 'Cancelling...' : 'Cancel Request'}
                          </button>
                        )}

                        {(w.status === 'failed' || w.status === 'rejected' || w.status === 'cancelled') && (
                          <button
                            disabled={retryingWithdrawalId === w.id}
                            onClick={() => handleRetryWithdrawal(w.id)}
                            style={{
                              ...S.btn('primary'), background: C.teal, padding: '6px 12px', borderRadius: '8px', fontSize: '12px'
                            }}
                          >
                            {retryingWithdrawalId === w.id ? 'Retrying...' : 'Retry Request'}
                          </button>
                        )}

                        {(w.status === 'transferred' || w.status === 'completed') && (
                          <>
                            <button
                              onClick={() => setSelectedWithdrawalForReceipt(w)}
                              style={{
                                ...S.btn('outline'), padding: '6px 12px', borderRadius: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px'
                              }}
                            >
                              <MdReceipt size={14} /> Payout Receipt
                            </button>
                            <button
                              onClick={() => setSelectedWithdrawalForTds(w)}
                              style={{
                                ...S.btn('outline'), padding: '6px 12px', borderRadius: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px'
                              }}
                            >
                              <MdFileDownload size={14} /> TDS Certificate
                            </button>
                          </>
                        )}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: 0 }}>Registered Bank Accounts</h3>
              <p style={{ fontSize: '12px', color: C.textLight, margin: '4px 0 0' }}>Configure settlement destination. Bank accounts require verified partner status.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'start' }}>
            
            {/* List of Registered Accounts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {loadingAllBanks ? (
                <div style={{ ...S.card, padding: '24px', textAlign: 'center', color: C.textLight }}>Loading accounts...</div>
              ) : allBanks.length === 0 ? (
                <div style={{ ...S.card, padding: '24px', textAlign: 'center', color: C.textLight }}>No bank accounts registered yet. Setup primary account below.</div>
              ) : (
                allBanks.map((b) => (
                  <div key={b.id} style={{
                    ...S.card,
                    padding: '20px',
                    border: b.is_primary ? `2px solid ${C.teal}` : `1px solid ${C.border}`,
                    position: 'relative'
                  }}>
                    {b.is_primary && (
                      <div style={{
                        position: 'absolute', top: 0, right: 0,
                        background: C.teal, color: '#fff',
                        fontSize: '10px', fontWeight: 800,
                        padding: '4px 10px', borderBottomLeftRadius: '8px'
                      }}>
                        PRIMARY
                      </div>
                    )}
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 800, color: C.text }}>{b.bank_name || 'UPI Settlement'}</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: C.textLight }}>
                      <div>Holder: <strong style={{ color: C.text }}>{b.account_holder_name}</strong></div>
                      {b.account_number && (
                        <div>Account No: <strong style={{ color: C.text, fontFamily: 'monospace' }}>•••• •••• •••• {b.account_number.slice(-4)}</strong></div>
                      )}
                      {b.ifsc_code && (
                        <div>IFSC Code: <strong style={{ color: C.text }}>{b.ifsc_code}</strong></div>
                      )}
                      {b.upi_id && (
                        <div>UPI ID: <strong style={{ color: C.text }}>{b.upi_id}</strong></div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px', borderTop: `1px solid ${C.border}`, paddingTop: '16px' }}>
                      {!b.is_primary && (
                        <button
                          onClick={() => handleSetPrimary(b.id)}
                          style={{ ...S.btn('outline'), fontSize: '11px', padding: '6px 10px', borderRadius: '6px' }}
                        >
                          Set Primary
                        </button>
                      )}

                      {b.is_verified ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#10B981', background: '#ECFDF5', padding: '4px 8px', borderRadius: '6px', fontWeight: 700 }}>
                          🟢 Verified
                        </span>
                      ) : (
                        <>
                          {b.account_number && (
                            <button
                              disabled={verifyingBankId === b.id}
                              onClick={() => handleVerifyPennyDrop(b.id)}
                              style={{ ...S.btn('primary'), background: '#2563EB', fontSize: '11px', padding: '6px 10px', borderRadius: '6px', opacity: verifyingBankId === b.id ? 0.6 : 1 }}
                            >
                              {verifyingBankId === b.id ? 'Verifying...' : 'Penny Drop (₹1)'}
                            </button>
                          )}
                          {b.upi_id && (
                            <button
                              disabled={verifyingBankId === b.id}
                              onClick={() => handleVerifyUPI(b.id)}
                              style={{ ...S.btn('outline'), border: '1px solid #2563EB', color: '#2563EB', fontSize: '11px', padding: '6px 10px', borderRadius: '6px', opacity: verifyingBankId === b.id ? 0.6 : 1 }}
                            >
                              {verifyingBankId === b.id ? 'Verifying...' : 'Verify UPI'}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}

              {allBanks.length < 2 && !showSecondaryForm && kycStatus === 'approved' && (
                <button
                  onClick={() => setShowSecondaryForm(true)}
                  style={{
                    ...S.btn('outline'),
                    border: `2px dashed ${C.border}`,
                    background: 'transparent',
                    color: C.primary,
                    padding: '16px',
                    borderRadius: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  + Add Secondary Bank Account
                </button>
              )}
            </div>

            {/* Primary / Secondary Edit Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {showSecondaryForm && (
                <div style={{ ...S.card, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: 0 }}>Add Secondary Bank Account</h3>
                    <button onClick={() => setShowSecondaryForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textLight }}>Close</button>
                  </div>
                  <form onSubmit={handleSaveSecondaryBank} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={S.label}>Account Holder Name</label>
                      <input type="text" style={S.input} value={secondaryBankDetails.account_holder_name} onChange={(e) => setSecondaryBankDetails({ ...secondaryBankDetails, account_holder_name: e.target.value })} required />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={S.label}>Bank Name</label>
                        <input type="text" style={S.input} value={secondaryBankDetails.bank_name} onChange={(e) => setSecondaryBankDetails({ ...secondaryBankDetails, bank_name: e.target.value })} required />
                      </div>
                      <div>
                        <label style={S.label}>Branch Name</label>
                        <input type="text" style={S.input} value={secondaryBankDetails.branch_name} onChange={(e) => setSecondaryBankDetails({ ...secondaryBankDetails, branch_name: e.target.value })} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={S.label}>Account Number</label>
                        <input type="password" style={S.input} value={secondaryBankDetails.account_number} onChange={(e) => setSecondaryBankDetails({ ...secondaryBankDetails, account_number: e.target.value })} required />
                      </div>
                      <div>
                        <label style={S.label}>IFSC Code</label>
                        <input type="text" style={S.input} value={secondaryBankDetails.ifsc_code} onChange={(e) => setSecondaryBankDetails({ ...secondaryBankDetails, ifsc_code: e.target.value })} required />
                      </div>
                    </div>
                    <button type="submit" disabled={savingSecondary} style={{ ...S.btn('primary'), borderRadius: '10px' }}>Save Secondary Bank</button>
                  </form>
                </div>
              )}

              <div style={{ ...S.card, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: 0 }}>Configure Primary Bank Account</h3>
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
                  <button type="submit" disabled={savingBank || kycStatus !== 'approved'} style={{ ...S.btn('primary'), borderRadius: '10px', marginTop: '6px' }}>Save Bank Account</button>
                </form>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ═══════════ TAB 5: COMMISSION BREAKUP ═══════════ */}
      {activeTab === 'breakup' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ ...S.card, padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, marginBottom: '16px' }}>Product-wise Commission Breakup</h3>
            
            {loadingCommissionSummary ? (
              <div style={{ padding: '30px', textAlign: 'center', color: C.textLight }}>Loading commission breakup...</div>
            ) : commissionSummary.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: C.textLight }}>No product commission data recorded yet.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}` }}>
                      <th style={{ padding: '12px 16px', fontSize: '11px', color: C.textLight, textAlign: 'left' }}>Product Name</th>
                      <th style={{ padding: '12px 16px', fontSize: '11px', color: C.textLight, textAlign: 'left' }}>Bank Code</th>
                      <th style={{ padding: '12px 16px', fontSize: '11px', color: C.textLight, textAlign: 'right' }}>Total Cases</th>
                      <th style={{ padding: '12px 16px', fontSize: '11px', color: C.textLight, textAlign: 'right' }}>Approved Cases</th>
                      <th style={{ padding: '12px 16px', fontSize: '11px', color: C.textLight, textAlign: 'right' }}>Rejected Cases</th>
                      <th style={{ padding: '12px 16px', fontSize: '11px', color: C.textLight, textAlign: 'right' }}>Commission Earned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissionSummary.map((cs, idx) => (
                      <tr key={idx} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 700, color: C.text }}>{cs.product_name}</td>
                        <td style={{ padding: '14px 16px', fontSize: '12px', color: C.textLight }}>{cs.bank_code || 'N/A'}</td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', textAlign: 'right' }}>{cs.total_cases}</td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', textAlign: 'right', color: C.green, fontWeight: 700 }}>{cs.approved_cases}</td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', textAlign: 'right', color: C.red }}>{cs.rejected_cases}</td>
                        <td style={{ padding: '14px 16px', fontSize: '14px', textAlign: 'right', fontWeight: 800, color: C.teal }}>
                          {formatCurrency(cs.commission_earned)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Product Category Earned Bar Chart */}
          {dashboardData?.categories?.length > 0 && (
            <div style={{ ...S.card, padding: '24px', minHeight: '300px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, marginBottom: '16px' }}>Category Earnings Distribution</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={dashboardData.categories}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="category" stroke={C.textLight} fontSize={11} />
                  <YAxis stroke={C.textLight} fontSize={11} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Bar dataKey="total_earned" fill={C.teal} radius={[6, 6, 0, 0]}>
                    {dashboardData.categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

        </div>
      )}

      {/* ═══════════ MODAL 1: OTP VERIFICATION MODAL ═══════════ */}
      {showOtpModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '16px'
        }}>
          <div style={{ ...S.card, maxWidth: '440px', width: '100%', padding: '24px', borderRadius: '16px' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800 }}>Confirm Payout Settlement</h3>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: C.textLight, lineHeight: 1.5 }}>
              A 6-digit verification code has been sent to <strong>{emailMasked}</strong>. Enter it below to authorize withdrawal of <strong>₹{parseFloat(withdrawAmount || 0).toLocaleString('en-IN')}</strong>.
            </p>
            <form onSubmit={handleConfirmWithdrawalOTP} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={S.label}>Enter 6-Digit OTP</label>
                <input 
                  type="text" 
                  maxLength={6} 
                  pattern="\d{6}"
                  placeholder="e.g. 123456" 
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  style={{ ...S.input, letterSpacing: '8px', textAlign: 'center', fontSize: '20px', fontWeight: 800, padding: '12px' }}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowOtpModal(false)} style={{ ...S.btn('outline'), flex: 1, borderRadius: '10px' }}>Cancel</button>
                <button type="submit" disabled={verifyingOtp || otpCode.length !== 6} style={{ ...S.btn('primary'), flex: 2, borderRadius: '10px', opacity: (verifyingOtp || otpCode.length !== 6) ? 0.6 : 1 }}>
                  {verifyingOtp ? 'Verifying...' : 'Verify & Withdraw'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════ MODAL 2: COMMISSION BREAKUP MODAL ═══════════ */}
      {selectedTxForBreakup && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '16px'
        }}>
          <div style={{ ...S.card, maxWidth: '480px', width: '100%', padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Commission Breakup Details</h3>
              <button onClick={() => setSelectedTxForBreakup(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textLight }}><MdClose size={20} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div style={{ padding: '12px', background: C.bgSecondary, borderRadius: '8px', fontFamily: 'monospace' }}>
                Transaction ID: <strong>{selectedTxForBreakup.id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: C.textLight }}>Application Number:</span>
                <strong>{selectedTxForBreakup.app_number || selectedTxForBreakup.reference_number || (selectedTxForBreakup.id ? `APP-${selectedTxForBreakup.id.substring(0, 8).toUpperCase()}` : 'N/A')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: C.textLight }}>Customer Name:</span>
                <strong>{selectedTxForBreakup.customer_name || selectedTxForBreakup.customer || 'Customer Applicant'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: C.textLight }}>Product:</span>
                <strong>{selectedTxForBreakup.product_name || selectedTxForBreakup.product || 'General Financial Commission'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: C.textLight }}>Gross Commission Amount:</span>
                <strong>₹{parseFloat(selectedTxForBreakup.credit || selectedTxForBreakup.amount || 0).toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: C.red }}>
                <span>TDS Deducted (5% Sec 194H):</span>
                <strong>-₹{(parseFloat(selectedTxForBreakup.credit || selectedTxForBreakup.amount || 0) * 0.05).toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: C.green, fontSize: '15px', fontWeight: 800, borderTop: `1px solid ${C.border}`, paddingTop: '10px' }}>
                <span>Net Credit Amount:</span>
                <span>₹{(parseFloat(selectedTxForBreakup.credit || selectedTxForBreakup.amount || 0) * 0.95).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ MODAL 3: PAYOUT RECEIPT MODAL ═══════════ */}
      {selectedWithdrawalForReceipt && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '16px'
        }}>
          <div style={{ ...S.card, maxWidth: '520px', width: '100%', padding: '28px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MdReceipt size={24} style={{ color: C.teal }} />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Official Payout Receipt</h3>
              </div>
              <button onClick={() => setSelectedWithdrawalForReceipt(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textLight }}><MdClose size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
              <div style={{ textAlign: 'center', padding: '16px', background: `${C.green}15`, borderRadius: '10px', color: C.green }}>
                <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>Payment Status</div>
                <div style={{ fontSize: '22px', fontWeight: 800, margin: '4px 0' }}>SETTLED SUCCESSFULLY</div>
                <div style={{ fontSize: '11px' }}>UTR / Ref: {selectedWithdrawalForReceipt.utr || selectedWithdrawalForReceipt.bank_reference || 'RAZORPAY-PAYOUT'}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: C.textLight }}>Settlement Request ID:</span>
                <strong style={{ fontFamily: 'monospace' }}>{selectedWithdrawalForReceipt.id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: C.textLight }}>Transfer Date:</span>
                <strong>{new Date(selectedWithdrawalForReceipt.updated_at || selectedWithdrawalForReceipt.created_at).toLocaleString('en-IN')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: C.textLight }}>Beneficiary Bank:</span>
                <strong>{selectedWithdrawalForReceipt.bank_name || 'Bank Transfer'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: C.textLight }}>Account Number:</span>
                <strong style={{ fontFamily: 'monospace' }}>•••• {selectedWithdrawalForReceipt.account_number?.slice(-4)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: C.textLight }}>Requested Amount:</span>
                <strong>₹{parseFloat(selectedWithdrawalForReceipt.amount).toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: C.red }}>
                <span>TDS Deducted (5%):</span>
                <strong>-₹{(parseFloat(selectedWithdrawalForReceipt.amount) * 0.05).toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800, borderTop: `1px solid ${C.border}`, paddingTop: '10px' }}>
                <span>Total Disbursed Net Amount:</span>
                <span style={{ color: C.green }}>₹{(parseFloat(selectedWithdrawalForReceipt.amount) * 0.95).toFixed(2)}</span>
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <button onClick={() => window.print()} style={{ ...S.btn('primary'), flex: 1, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <MdPrint size={16} /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ MODAL 4: TDS CERTIFICATE SUMMARY MODAL ═══════════ */}
      {selectedWithdrawalForTds && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '16px'
        }}>
          <div style={{ ...S.card, maxWidth: '500px', width: '100%', padding: '28px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MdFileDownload size={24} style={{ color: C.teal }} />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>TDS Certificate Summary (Sec 194H)</h3>
              </div>
              <button onClick={() => setSelectedWithdrawalForTds(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textLight }}><MdClose size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div style={{ background: C.bgSecondary, padding: '12px', borderRadius: '8px', fontSize: '11px', color: C.textMid }}>
                Under Section 194H of Income Tax Act 1961, 5% Tax Deducted at Source (TDS) is remitted to the Government against your PAN.
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: C.textLight }}>Deductee (Partner):</span>
                <strong>{user?.name || user?.first_name || 'Partner User'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: C.textLight }}>Withdrawal ID:</span>
                <strong style={{ fontFamily: 'monospace' }}>{selectedWithdrawalForTds.id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: C.textLight }}>Total Gross Payout:</span>
                <strong>₹{parseFloat(selectedWithdrawalForTds.amount).toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: C.red, fontWeight: 700 }}>
                <span>Total TDS Remitted (5%):</span>
                <span>₹{(parseFloat(selectedWithdrawalForTds.amount) * 0.05).toFixed(2)}</span>
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <button onClick={() => window.print()} style={{ ...S.btn('primary'), flex: 1, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <MdPrint size={16} /> Print TDS Certificate Summary
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PartnerWallet;
