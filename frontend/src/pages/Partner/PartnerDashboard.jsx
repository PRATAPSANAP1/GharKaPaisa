import React, { useEffect, useState } from 'react';
import { usePartnerStore } from '../../store/partnerStore';
import { useWalletStore } from '../../store/walletStore';
import partnerService from '../../api/partner.api';

const PartnerDashboard = () => {
  const fetchProfile = usePartnerStore((state) => state.fetchProfile);
  const profile = usePartnerStore((state) => state.profile);
  const fetchWallet = useWalletStore((state) => state.fetchWallet);
  const wallet = useWalletStore((state) => state.wallet);

  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const userProfile = await fetchProfile();
        await fetchWallet();
        
        const partnerId = userProfile?.partner_id || userProfile?.PartnerId || userProfile?.id;
        if (partnerId) {
          const res = await partnerService.getDashboard(partnerId);
          if (res.data?.success) {
            setDashData(res.data.data);
          }
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
        setError("Failed to load dashboard metrics");
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, [fetchProfile, fetchWallet]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-3"></div>
        <p className="text-sm font-semibold text-gray-500">Loading your partner workspace...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-teal-600 p-8 rounded-2xl shadow-md text-white">
        <h2 className="text-3xl font-extrabold tracking-tight">Welcome back, {profile?.first_name || 'Partner'}!</h2>
        <p className="text-blue-100 mt-2 font-medium">
          Partner Code: <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold ml-1">{profile?.Partner_code || 'Pending'}</span>
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Available Wallet Balance */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden transition-all hover:shadow-md">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-green-600">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path></svg>
          </div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Wallet Balance</h3>
          <p className="text-3xl font-extrabold text-green-600 mt-2">₹{parseFloat(wallet?.available_balance || 0).toLocaleString('en-IN')}</p>
          <p className="text-xs text-gray-400 mt-2">Available for immediate withdrawal</p>
        </div>

        {/* Card 2: Hold Balance */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden transition-all hover:shadow-md">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-yellow-600">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path></svg>
          </div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending Commission</h3>
          <p className="text-3xl font-extrabold text-yellow-600 mt-2">₹{parseFloat(wallet?.hold_balance || 0).toLocaleString('en-IN')}</p>
          <p className="text-xs text-gray-400 mt-2">Held for bank verification / disbursal</p>
        </div>

        {/* Card 3: Total Earned */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden transition-all hover:shadow-md">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-blue-600">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"></path><path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"></path></svg>
          </div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Earned</h3>
          <p className="text-3xl font-extrabold text-blue-600 mt-2">₹{parseFloat(wallet?.total_earned || 0).toLocaleString('en-IN')}</p>
          <p className="text-xs text-gray-400 mt-2">Lifetime earnings on platform</p>
        </div>

        {/* Card 4: Total Leads */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden transition-all hover:shadow-md">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Referral Leads</h3>
          <p className="text-3xl font-extrabold text-indigo-600 mt-2">{dashData?.leads?.total_leads || 0}</p>
          <p className="text-xs text-gray-400 mt-2">Total references created</p>
        </div>

        {/* Card 5: Approved Leads */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden transition-all hover:shadow-md">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Approved Leads</h3>
          <p className="text-3xl font-extrabold text-green-600 mt-2">{dashData?.leads?.approved_leads || 0}</p>
          <p className="text-xs text-gray-400 mt-2">Verified commissionable cases</p>
        </div>

        {/* Card 6: Rejected Leads */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden transition-all hover:shadow-md">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Rejected Leads</h3>
          <p className="text-3xl font-extrabold text-red-600 mt-2">{dashData?.leads?.rejected_leads || 0}</p>
          <p className="text-xs text-gray-400 mt-2">Leads not approved or cancelled</p>
        </div>
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-1">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Top Selling Products</h3>
          {(!dashData?.top_products || dashData.top_products.length === 0) ? (
            <p className="text-sm text-gray-500">No products sold yet.</p>
          ) : (
            <div className="space-y-4">
              {dashData.top_products.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <h4 className="font-bold text-sm text-gray-800">{p.name}</h4>
                    <p className="text-xs text-gray-500">{p.bank_code}</p>
                  </div>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-semibold">
                    {p.sales_count} Sales
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Cases */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Referrals</h3>
          {(!dashData?.recent_applications || dashData.recent_applications.length === 0) ? (
            <p className="text-sm text-gray-500">No recent applications.</p>
          ) : (
            <div className="space-y-3">
              {dashData.recent_applications.map((app, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100/50 transition-all">
                  <div>
                    <h4 className="font-bold text-sm text-gray-800">{app.customer_name}</h4>
                    <p className="text-xs text-gray-500">{app.product_name} • {app.app_number}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    app.status === 'approved' || app.status === 'disbursed' ? 'bg-green-100 text-green-800' :
                    app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartnerDashboard;
