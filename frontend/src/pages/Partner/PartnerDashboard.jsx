import React, { useEffect } from 'react';
import { usePartnerStore } from '../../store/partnerStore';
import { useWalletStore } from '../../store/walletStore';

const PartnerDashboard = () => {
  const fetchProfile = usePartnerStore((state) => state.fetchProfile);
  const profile = usePartnerStore((state) => state.profile);
  const fetchWallet = useWalletStore((state) => state.fetchWallet);
  const wallet = useWalletStore((state) => state.wallet);

  useEffect(() => {
    fetchProfile();
    fetchWallet();
  }, [fetchProfile, fetchWallet]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800">Welcome, {profile?.first_name || 'Partner'}!</h2>
        <p className="text-gray-500 mt-1">Here is your dashboard overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500">Available Balance</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">₹{wallet?.available_balance || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500">Hold Balance</h3>
          <p className="text-3xl font-bold text-yellow-600 mt-2">₹{wallet?.hold_balance || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500">Total Earned</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">₹{wallet?.total_earned || 0}</p>
        </div>
      </div>
    </div>
  );
};

export default PartnerDashboard;
