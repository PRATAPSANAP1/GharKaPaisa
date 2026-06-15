import React, { useEffect } from 'react';
import { useWalletStore } from '../../store/walletStore';

const PartnerWallet = () => {
  const fetchWallet = useWalletStore((state) => state.fetchWallet);
  const fetchTransactions = useWalletStore((state) => state.fetchTransactions);
  const wallet = useWalletStore((state) => state.wallet);
  const transactions = useWalletStore((state) => state.transactions);

  useEffect(() => {
    fetchWallet();
    fetchTransactions();
  }, [fetchWallet, fetchTransactions]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">My Wallet</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500">Available Balance</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">₹{wallet?.available_balance || 0}</p>
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Request Withdrawal</button>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500">Total Earned</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">₹{wallet?.total_earned || 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 mt-8">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Recent Transactions</h3>
        </div>
        <div className="p-0">
          {transactions.length === 0 ? (
            <p className="p-4 text-gray-500">No transactions found.</p>
          ) : (
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">{new Date(t.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 capitalize">{t.type}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">₹{t.amount}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${t.status === 'approved' || t.status === 'processed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
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
