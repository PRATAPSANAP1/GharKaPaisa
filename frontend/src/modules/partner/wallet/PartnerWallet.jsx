import React, { useEffect, useState } from 'react';
import { useWalletStore } from '../../../store/walletStore';
import api from '../../../api/api';
import { MdFileDownload, MdPictureAsPdf } from 'react-icons/md';

const PartnerWallet = () => {
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Wallet</h2>
          <p className="text-sm text-gray-500">Track your earnings and request withdrawals</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-yellow-600">
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path></svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Pending Commission</h3>
          <p className="text-3xl font-bold text-yellow-600 mt-2">₹{parseFloat(wallet?.hold_balance || 0).toLocaleString('en-IN')}</p>
          <p className="text-xs text-gray-400 mt-2">Awaiting bank confirmation / disbursal</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-green-600">
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path></svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Withdrawable Wallet</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">₹{parseFloat(wallet?.available_balance || 0).toLocaleString('en-IN')}</p>
          <p className="text-xs text-gray-400 mt-2">Ready to be transferred to your bank</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-blue-600">
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"></path><path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"></path></svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Earned</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">₹{parseFloat(wallet?.total_earned || 0).toLocaleString('en-IN')}</p>
          <p className="text-xs text-gray-400 mt-2">Lifetime earnings on GharKaPaisa</p>
        </div>
      </div>

      {/* Withdrawal Action */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Request Bank Transfer</h3>
        <form onSubmit={handleWithdraw} className="flex gap-4 items-end">
          <div className="flex-1 max-w-xs">
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Amount to Withdraw</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500 font-medium">₹</span>
              <input 
                type="number" 
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
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
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {requesting ? 'Processing...' : 'Withdraw Funds'}
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-2">Funds are transferred to your registered bank account via NEFT/IMPS.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-8 overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
          <h3 className="text-lg font-semibold text-gray-800">Commission Ledger</h3>
          <div className="flex gap-3">
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              <MdFileDownload size={18} className="text-green-600" /> Export CSV
            </button>
            <button 
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              <MdPictureAsPdf size={18} className="text-red-500" /> Save as PDF
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              No commission or withdrawal records found.
            </div>
          ) : (
            <table className="w-full text-left text-sm text-gray-600 whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider text-xs">Date</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider text-xs">Reference</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider text-xs">Customer</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider text-xs">Product & Bank</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider text-xs">Type</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider text-xs">Amount</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider text-xs">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((t, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">{new Date(t.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-4 font-medium text-gray-800">
                      {t.app_number || t.reference_id || 'N/A'}
                    </td>
                    <td className="px-5 py-4">
                      {t.customer_name || '—'}
                    </td>
                    <td className="px-5 py-4">
                      {t.product_name ? (
                        <div>
                          <div className="font-medium text-gray-800">{t.product_name}</div>
                          <div className="text-xs text-gray-500">{t.bank_code}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${t.type === 'credit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {t.type}
                      </span>
                    </td>
                    <td className={`px-5 py-4 font-bold ${t.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'credit' ? '+' : '-'}₹{parseFloat(t.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full 
                        ${(t.status === 'approved' || t.status === 'processed') ? 'bg-green-100 text-green-800' : 
                          t.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
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
    </div>
  );
};

export default PartnerWallet;
