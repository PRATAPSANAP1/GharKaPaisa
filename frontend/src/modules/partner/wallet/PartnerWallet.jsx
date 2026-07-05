import React, { useEffect, useState } from 'react';
import { useWalletStore } from '../../../app/store/walletStore';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import { useAuthStore } from '../../../app/store/authStore';
import api from '../../../services/api';
import { 
  MdFileDownload, MdAccountBalance, MdQrCode, 
  MdSearch, MdFilterList, MdLock, MdCheckCircle 
} from 'react-icons/md';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';

const PartnerWallet = () => {
  const { C } = useTheme();
  const S = makeS(C);
  const { user } = useAuthStore();

  const fetchWallet = useWalletStore((state) => state.fetchWallet);
  const wallet = useWalletStore((state) => state.wallet);

  const [transactions, setTransactions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  // Filters & State
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Dashboard Stats
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  // Bank Account State
  const [bankDetails, setBankDetails] = useState({
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    account_holder_name: '',
    upi_id: ''
  });
  const [loadingBank, setLoadingBank] = useState(true);
  const [savingBank, setSavingBank] = useState(false);
  const [bankEditMode, setBankEditMode] = useState(false);

  // Withdrawal Request
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [requesting, setRequesting] = useState(false);

  const isKycApproved = user?.kyc_status === 'approved';

  const loadTransactions = async () => {
    try {
      const offset = (page - 1) * limit;
      const res = await api.get('/wallet/transactions', {
        params: {
          page,
          limit,
          offset,
          type: typeFilter || undefined,
          status: statusFilter || undefined,
          from_date: fromDate || undefined,
          to_date: toDate || undefined,
          search: search.trim() || undefined
        }
      });
      if (res.data?.success) {
        setTransactions(res.data.data);
        setTotalCount(res.data.pagination.total);
        setTotalPages(res.data.pagination.pages);
      }
    } catch (e) {
      console.error('Failed to load wallet ledger', e);
    }
  };

  const loadDashboardData = async () => {
    setLoadingDashboard(true);
    try {
      const res = await api.get('/wallet/dashboard');
      if (res.data?.success) {
        setDashboardData(res.data.data);
      }
    } catch (e) {
      console.error('Failed to load wallet dashboard stats', e);
    } finally {
      setLoadingDashboard(false);
    }
  };

  const loadBankDetails = async () => {
    if (!isKycApproved) {
      setLoadingBank(false);
      return;
    }
    setLoadingBank(true);
    try {
      const res = await api.get('/wallet/bank-details');
      if (res.data?.success && res.data.data) {
        setBankDetails(res.data.data);
      }
    } catch (e) {
      console.error('Failed to load bank details', e);
    } finally {
      setLoadingBank(false);
    }
  };

  useEffect(() => {
    fetchWallet();
    loadDashboardData();
    loadBankDetails();
  }, [fetchWallet]);

  useEffect(() => {
    loadTransactions();
  }, [page, typeFilter, statusFilter, fromDate, toDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadTransactions();
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    if (!amt || isNaN(amt) || amt < 100) {
      alert("Minimum withdrawal is ₹100");
      return;
    }
    if (amt > parseFloat(wallet?.available_balance || 0)) {
      alert("Insufficient available balance");
      return;
    }
    setRequesting(true);
    try {
      const res = await api.post('/wallet/withdraw', { amount: amt });
      if (res.data?.success) {
        alert(res.data.message || "Withdrawal request submitted successfully!");
        setWithdrawAmount('');
        fetchWallet();
        loadDashboardData();
        loadTransactions();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to request withdrawal");
    } finally {
      setRequesting(false);
    }
  };

  const handleSaveBank = async (e) => {
    e.preventDefault();
    setSavingBank(true);
    try {
      const res = await api.post('/wallet/bank-details', bankDetails);
      if (res.data?.success) {
        alert("Bank and UPI details saved successfully!");
        setBankEditMode(false);
        loadBankDetails();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save bank details");
    } finally {
      setSavingBank(false);
    }
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      return alert("No transactions available to export.");
    }
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Date,Reference Number,Customer,Product,Type,Amount,Status,Remarks\n';
    
    transactions.forEach((t) => {
      const row = [
        new Date(t.created_at).toLocaleDateString(),
        `"${t.app_number || t.reference_number || 'N/A'}"`,
        `"${t.customer_name || 'N/A'}"`,
        `"${t.product_name || 'N/A'}"`,
        `"${t.transaction_type || t.type}"`,
        `"${t.credit > 0 ? '+' : '-'}₹${t.credit > 0 ? t.credit : (t.debit || t.amount || 0)}"`,
        `"${t.status}"`,
        `"${t.description || ''}"`
      ].join(',');
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GKP_Wallet_Statement_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Custom Tooltip for Recharts
  const CustomChartTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: C.bgSecondary,
          border: `1px solid ${C.border}`,
          padding: '10px 14px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          <p style={{ margin: 0, fontSize: '12px', color: C.textLight }}>Earnings Month</p>
          <p style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: 800, color: C.green }}>
            ₹{parseFloat(payload[0].value).toLocaleString('en-IN')}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ maxWidth: '1150px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '60px' }}>
      
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '26px', fontWeight: 800, color: C.text, margin: '0 0 4px' }}>My Wallet & Settlements</h2>
        <p style={{ fontSize: '14px', color: C.textLight, margin: 0 }}>Track real-time payouts, splits, and manage bank account payouts</p>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
        
        {/* Withdrawable */}
        <div style={{
          ...S.card, padding: '24px', borderRadius: '16px',
          background: `linear-gradient(135deg, ${C.green}D0, ${C.teal}E0)`,
          color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '140px',
          boxShadow: '0 10px 20px rgba(16, 185, 129, 0.15)'
        }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Available Balance</span>
            <h3 style={{ fontSize: '32px', fontWeight: 850, margin: '8px 0 0 0' }}>₹{parseFloat(wallet?.available_balance || 0).toLocaleString('en-IN')}</h3>
          </div>
          <span style={{ fontSize: '12px', opacity: 0.9 }}>Ready to transfer to bank</span>
        </div>

        {/* Hold Balance */}
        <div style={{
          ...S.card, padding: '24px', borderRadius: '16px',
          background: `linear-gradient(135deg, ${C.gold}D0, #d97706E0)`,
          color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '140px',
          boxShadow: '0 10px 20px rgba(245, 158, 11, 0.15)'
        }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Hold Balance (Pending)</span>
            <h3 style={{ fontSize: '32px', fontWeight: 850, margin: '8px 0 0 0' }}>₹{parseFloat(wallet?.hold_balance || 0).toLocaleString('en-IN')}</h3>
          </div>
          <span style={{ fontSize: '12px', opacity: 0.9 }}>Awaiting bank approval cycle</span>
        </div>

        {/* Override Commissions */}
        <div style={{
          ...S.card, padding: '24px', borderRadius: '16px',
          background: `linear-gradient(135deg, ${C.primary}D0, #1d4ed8E0)`,
          color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '140px',
          boxShadow: '0 10px 20px rgba(59, 130, 246, 0.15)'
        }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Override Commissions</span>
            <h3 style={{ fontSize: '32px', fontWeight: 850, margin: '8px 0 0 0' }}>₹{parseFloat(wallet?.override_balance || 0).toLocaleString('en-IN')}</h3>
          </div>
          <span style={{ fontSize: '12px', opacity: 0.9 }}>Total passive network overrides</span>
        </div>

        {/* Total Earned */}
        <div style={{
          ...S.card, padding: '24px', borderRadius: '16px',
          background: C.bgSecondary, border: `1px solid ${C.border}`,
          color: C.text, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '140px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.02)'
        }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Total Lifetime Earned</span>
            <h3 style={{ fontSize: '32px', fontWeight: 850, margin: '8px 0 0 0', color: C.text }}>₹{parseFloat(wallet?.total_earned || 0).toLocaleString('en-IN')}</h3>
          </div>
          <span style={{ fontSize: '12px', color: C.textLight }}>Includes team splits & bonuses</span>
        </div>

      </div>

      {/* Main Grid: Recharts Chart & Bank Transfer */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', flexWrap: 'wrap', alignItems: 'stretch' }}>
        
        {/* Recharts graph */}
        <div style={{ ...S.card, padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: '0 0 20px 0' }}>Monthly Payout Payout History</h3>
          
          <div style={{ flex: 1, minHeight: '260px', width: '100%' }}>
            {loadingDashboard ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: C.textLight }}>Loading charts...</span>
              </div>
            ) : !dashboardData?.history || dashboardData.history.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textLight }}>
                No payout history data in past 6 months.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboardData.history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCredited" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.green} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={C.green} stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                  <XAxis dataKey="month_label" stroke={C.textLight} fontSize={11} tickLine={false} />
                  <YAxis stroke={C.textLight} fontSize={11} tickLine={false} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Area type="monotone" dataKey="total_credited" stroke={C.green} strokeWidth={2.5} fillOpacity={1} fill="url(#colorCredited)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Withdrawal request box */}
        <div style={{ ...S.card, padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: '0 0 8px 0' }}>Withdraw to Bank</h3>
            <p style={{ fontSize: '12.5px', color: C.textLight, margin: '0 0 20px 0' }}>Withdraw funds immediately. The payment will process within 24 hours.</p>
            
            <form onSubmit={handleWithdraw} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={S.label}>Amount to Withdraw (Min ₹100)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: C.textLight, fontWeight: 700 }}>₹</span>
                  <input 
                    type="number"
                    required
                    min="100"
                    max={wallet?.available_balance || 0}
                    placeholder="e.g. 5000"
                    style={{ ...S.input, paddingLeft: '30px' }}
                    value={withdrawAmount}
                    onChange={e => setWithdrawAmount(e.target.value)}
                  />
                </div>
              </div>
              
              <button 
                type="submit"
                disabled={requesting || !wallet?.available_balance || wallet.available_balance < 100}
                style={{ ...S.btn('primary'), width: '100%', padding: '12px' }}
              >
                {requesting ? 'Processing...' : 'Transfer to Bank'}
              </button>
            </form>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '20px', background: `${C.green}10`, padding: '10px 14px', borderRadius: '10px' }}>
            <MdCheckCircle style={{ color: C.green }} size={18} />
            <span style={{ fontSize: '11px', color: C.green, fontWeight: 700 }}>NEFT / IMPS Supported</span>
          </div>
        </div>

      </div>

      {/* Bank Account / UPI Details Section */}
      <div style={{ ...S.card, padding: '24px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: 0 }}>Registered Payout Account</h3>
            <p style={{ fontSize: '12.5px', color: C.textLight, margin: '4px 0 0 0' }}>Where your payouts will be deposited.</p>
          </div>
          {isKycApproved && !bankEditMode && (
            <button onClick={() => setBankEditMode(true)} style={{ ...S.btn('outline'), padding: '6px 14px', fontSize: '12px' }}>
              Edit Details
            </button>
          )}
        </div>

        {!isKycApproved ? (
          <div style={{ background: `${C.border}50`, padding: '20px', borderRadius: '12px', textAlign: 'center', color: C.textLight }}>
            <MdLock size={32} style={{ color: C.textLight, marginBottom: '8px' }} />
            <div style={{ fontWeight: 700, color: C.text }}>Account Management Locked</div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>Payout accounts can only be configured after your Video KYC status is fully **Approved**.</div>
          </div>
        ) : loadingBank ? (
          <div>Loading bank configurations...</div>
        ) : bankEditMode ? (
          <form onSubmit={handleSaveBank} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
              <div>
                <label style={S.label}>Bank / NBFC Name</label>
                <input 
                  type="text" 
                  style={S.input} 
                  placeholder="e.g. HDFC Bank" 
                  value={bankDetails.bank_name} 
                  onChange={e => setBankDetails({ ...bankDetails, bank_name: e.target.value })} 
                />
              </div>
              <div>
                <label style={S.label}>Account Holder Name</label>
                <input 
                  type="text" 
                  style={S.input} 
                  placeholder="As per passbook" 
                  value={bankDetails.account_holder_name} 
                  onChange={e => setBankDetails({ ...bankDetails, account_holder_name: e.target.value })} 
                />
              </div>
              <div>
                <label style={S.label}>Account Number</label>
                <input 
                  type="text" 
                  style={S.input} 
                  placeholder="Encrypts automatically" 
                  value={bankDetails.account_number} 
                  onChange={e => setBankDetails({ ...bankDetails, account_number: e.target.value })} 
                />
              </div>
              <div>
                <label style={S.label}>IFSC Code</label>
                <input 
                  type="text" 
                  style={S.input} 
                  placeholder="11-digit IFSC" 
                  value={bankDetails.ifsc_code} 
                  onChange={e => setBankDetails({ ...bankDetails, ifsc_code: e.target.value })} 
                />
              </div>
              <div>
                <label style={S.label}>UPI ID (for instant settlement)</label>
                <input 
                  type="text" 
                  style={S.input} 
                  placeholder="e.g. partner@upi" 
                  value={bankDetails.upi_id || ''} 
                  onChange={e => setBankDetails({ ...bankDetails, upi_id: e.target.value })} 
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button type="button" onClick={() => setBankEditMode(false)} style={S.btn('outline')}>Cancel</button>
              <button type="submit" disabled={savingBank} style={S.btn('primary')}>
                {savingBank ? 'Saving...' : 'Save Payout Details'}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: C.bgSecondary, padding: '16px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
              <MdAccountBalance size={24} style={{ color: C.primary }} />
              <div>
                <div style={{ fontSize: '11px', color: C.textLight }}>BANK ACCOUNT DETAILS</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: C.text, marginTop: '2px' }}>{bankDetails.bank_name || 'Not Registered'}</div>
                <div style={{ fontSize: '12px', color: C.textMid, fontFamily: 'monospace' }}>
                  {bankDetails.account_number ? `XXXX-XXXX-${bankDetails.account_number.slice(-4)}` : 'N/A'} • {bankDetails.ifsc_code || 'N/A'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: C.bgSecondary, padding: '16px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
              <MdQrCode size={24} style={{ color: C.green }} />
              <div>
                <div style={{ fontSize: '11px', color: C.textLight }}>UPI DETAILS</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: C.text, marginTop: '2px' }}>{bankDetails.upi_id || 'Not Registered'}</div>
                <div style={{ fontSize: '12px', color: C.textMid }}>For instant settlements and transfers</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Commission Ledger Table */}
      <div style={{ ...S.card, padding: 0, borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{
          padding: '18px 24px', borderBottom: `1px solid ${C.border}`,
          background: C.bgSecondary, display: 'flex', flexWrap: 'wrap',
          justifyContent: 'space-between', alignItems: 'center', gap: '12px'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: 0 }}>Transaction & Settlement Log</h3>
          <button
            onClick={handleExportCSV}
            style={{
              ...S.btn('outline'), padding: '8px 16px', fontSize: '13px',
              display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '10px'
            }}
          >
            <MdFileDownload size={16} /> Export statement
          </button>
        </div>

        {/* Filters Section */}
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end', background: C.bgSecondary + '30' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', width: '100%' }}>
            <div style={{ flex: 1, minWidth: '180px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, display: 'block', marginBottom: '4px' }}>Search Description/Reference</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  placeholder="e.g. commission..." 
                  style={{ ...S.input, paddingLeft: '32px' }} 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                />
                <MdSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: C.textLight }} />
              </div>
            </div>
            <div style={{ width: '140px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, display: 'block', marginBottom: '4px' }}>Txn Type</label>
              <select style={S.input} value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
                <option value="">All Types</option>
                <option value="PERSONAL_COMMISSION">Personal Commission</option>
                <option value="TEAM_COMMISSION">Team Commission</option>
                <option value="OVERRIDE_COMMISSION">Override Commission</option>
                <option value="REFERRAL_BONUS">Referral Bonus</option>
                <option value="WITHDRAWAL">Withdrawal</option>
                <option value="ADJUSTMENT">Adjustment</option>
              </select>
            </div>
            <div style={{ width: '120px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, display: 'block', marginBottom: '4px' }}>Status</label>
              <select style={S.input} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div style={{ width: '130px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, display: 'block', marginBottom: '4px' }}>From Date</label>
              <input type="date" style={S.input} value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} />
            </div>
            <div style={{ width: '130px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, display: 'block', marginBottom: '4px' }}>To Date</label>
              <input type="date" style={S.input} value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }} />
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <button type="submit" style={S.btn('primary')}>Filter</button>
              <button type="button" onClick={() => { setSearch(''); setTypeFilter(''); setStatusFilter(''); setFromDate(''); setToDate(''); setPage(1); }} style={S.btn('outline')}>Reset</button>
            </div>
          </form>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {transactions.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: C.textLight }}>
              No transaction or settlement records found matching current filters.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.bgSecondary, fontSize: '11px', textTransform: 'uppercase', color: C.textLight }}>
                  <th style={{ padding: '12px 18px' }}>Date</th>
                  <th style={{ padding: '12px 18px' }}>Reference / App</th>
                  <th style={{ padding: '12px 18px' }}>Description</th>
                  <th style={{ padding: '12px 18px' }}>Type</th>
                  <th style={{ padding: '12px 18px' }}>Credit</th>
                  <th style={{ padding: '12px 18px' }}>Debit</th>
                  <th style={{ padding: '12px 18px' }}>Status</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '13.5px' }}>
                {transactions.map((t, idx) => (
                  <tr key={idx} style={{ borderBottom: `1px solid ${C.border}60` }}>
                    <td style={{ padding: '14px 18px' }}>{new Date(t.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '14px 18px', fontWeight: 600 }}>
                      {t.app_number || t.reference_number || t.reference_id || 'N/A'}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ color: C.text }}>{t.description || '—'}</div>
                      {t.product_name && <div style={{ fontSize: '11px', color: C.textLight, marginTop: '2px' }}>{t.product_name} • {t.bank_code}</div>}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: `${C.primary}15`, color: C.primary }}>
                        {t.transaction_type?.replace(/_/g, ' ') || t.type}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: 700, color: C.green }}>
                      {parseFloat(t.credit || 0) > 0 ? `+₹${parseFloat(t.credit).toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: 700, color: C.red }}>
                      {parseFloat(t.debit || 0) > 0 ? `-₹${parseFloat(t.debit).toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{
                        display: 'inline-block', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px',
                        background: (t.status === 'completed' || t.status === 'approved' || t.status === 'processed') ? `${C.green}15` : t.status === 'rejected' ? `${C.red}15` : `${C.gold}15`,
                        color: (t.status === 'completed' || t.status === 'approved' || t.status === 'processed') ? C.green : t.status === 'rejected' ? C.red : C.gold
                      }}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: `1px solid ${C.border}`, background: C.bgSecondary }}>
            <span style={{ fontSize: '13px', color: C.textLight }}>
              Showing {transactions.length} of {totalCount} logs
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button 
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                style={{ ...S.btn('outline'), padding: '6px 12px', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
              >
                Previous
              </button>
              <button 
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                style={{ ...S.btn('outline'), padding: '6px 12px', cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnerWallet;
