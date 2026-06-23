import React, { useEffect, useState } from 'react';
import { usePartnerStore } from '../../store/partnerStore';
import { useWalletStore } from '../../store/walletStore';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { 
  MdAccountBalanceWallet, MdLeaderboard, MdTrendingUp, 
  MdAddCircleOutline, MdPersonAdd, MdShare, MdStorefront,
  MdNotificationsActive, MdCheckCircle
} from 'react-icons/md';

const earningsData = [
  { name: 'Mon', amount: 1200 },
  { name: 'Tue', amount: 3500 },
  { name: 'Wed', amount: 2800 },
  { name: 'Thu', amount: 5600 },
  { name: 'Fri', amount: 4200 },
  { name: 'Sat', amount: 7800 },
  { name: 'Sun', amount: 6500 },
];

const funnelData = [
  { name: 'Submitted', value: 82, color: '#94A3B8' },
  { name: 'Under Review', value: 54, color: '#3B82F6' },
  { name: 'Approved', value: 38, color: '#22C55E' },
  { name: 'Disbursed', value: 24, color: '#F59E0B' },
  { name: 'Paid', value: 18, color: '#0D5CAB' },
];

export default function PartnerDashboard() {
  const fetchProfile = usePartnerStore((state) => state.fetchProfile);
  const profile = usePartnerStore((state) => state.profile);
  const fetchWallet = useWalletStore((state) => state.fetchWallet);
  const wallet = useWalletStore((state) => state.wallet);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await fetchProfile();
      await fetchWallet();
      setLoading(false);
    };
    init();
  }, [fetchProfile, fetchWallet]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-[#0D5CAB] border-t-transparent rounded-full mb-3"></div>
        <p className="text-sm font-semibold text-slate-500">Loading enterprise workspace...</p>
      </div>
    );
  }

  const firstName = profile?.first_name || 'Partner';
  const partnerCode = profile?.Partner_code || 'GKP-----';

  return (
    <div className="space-y-6">
      
      {/* HERO SECTION */}
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-[#0D5CAB] opacity-[0.03] rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        
        <div className="z-10">
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A] mb-2">
            Good Morning, {firstName} 👋
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
            <span className="bg-[#F8FAFC] text-[#64748B] px-3 py-1.5 rounded-lg border border-slate-200">
              Code: <strong className="text-[#0F172A]">{partnerCode}</strong>
            </span>
            <span className="bg-amber-50 text-amber-600 px-3 py-1.5 rounded-lg border border-amber-100 flex items-center gap-1.5">
              <MdTrendingUp /> Gold Partner
            </span>
            <span className="bg-green-50 text-green-600 px-3 py-1.5 rounded-lg border border-green-100">
              Profile: 85% Complete
            </span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-wrap gap-3 z-10 w-full md:w-auto">
          <button className="flex items-center gap-2 bg-[#0D5CAB] text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm hover:bg-[#083E7A] transition-colors flex-1 md:flex-auto justify-center">
            <MdStorefront size={18} /> Apply Product
          </button>
          <button className="flex items-center gap-2 bg-slate-100 text-[#0F172A] px-5 py-2.5 rounded-xl font-semibold border border-slate-200 hover:bg-slate-200 transition-colors flex-1 md:flex-auto justify-center">
            <MdAddCircleOutline size={18} /> Add Customer
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="w-12 h-12 bg-blue-50 text-[#0D5CAB] rounded-xl flex items-center justify-center mb-4">
            <MdTrendingUp size={24} />
          </div>
          <h3 className="text-sm font-bold text-[#64748B] uppercase tracking-wider mb-1">Today's Earnings</h3>
          <div className="flex items-end gap-3">
            <p className="text-3xl font-extrabold text-[#0F172A]">₹1,250</p>
            <span className="text-sm font-bold text-green-500 mb-1">+18%</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-4">
            <MdAccountBalanceWallet size={24} />
          </div>
          <h3 className="text-sm font-bold text-[#64748B] uppercase tracking-wider mb-1">Available Wallet</h3>
          <p className="text-3xl font-extrabold text-[#0F172A]">₹{parseFloat(wallet?.available_balance || 45600).toLocaleString('en-IN')}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center mb-4">
            <MdCheckCircle size={24} />
          </div>
          <h3 className="text-sm font-bold text-[#64748B] uppercase tracking-wider mb-1">Pending Commission</h3>
          <p className="text-3xl font-extrabold text-[#0F172A]">₹{parseFloat(wallet?.hold_balance || 12800).toLocaleString('en-IN')}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <h3 className="text-sm font-bold text-[#64748B] uppercase tracking-wider mb-2">This Month Leads</h3>
          <p className="text-3xl font-extrabold text-[#0D5CAB]">82</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <h3 className="text-sm font-bold text-[#64748B] uppercase tracking-wider mb-2">Approval Rate</h3>
          <p className="text-3xl font-extrabold text-[#0F172A]">68%</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <h3 className="text-sm font-bold text-[#64748B] uppercase tracking-wider mb-2">Conversion Rate</h3>
          <p className="text-3xl font-extrabold text-[#0F172A]">42%</p>
        </div>

      </div>

      {/* CHARTS & NOTIFICATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Earnings Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-[#0F172A]">Earnings Trend</h3>
            <select className="bg-[#F8FAFC] border border-slate-200 text-sm font-semibold text-[#64748B] rounded-lg px-3 py-1.5 outline-none">
              <option>This Week</option>
              <option>This Month</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={earningsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dx={-10} tickFormatter={(value) => `₹${value}`} />
                <RechartsTooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)'}}
                  itemStyle={{color: '#0D5CAB', fontWeight: 'bold'}}
                />
                <Line type="monotone" dataKey="amount" stroke="#0D5CAB" strokeWidth={4} dot={{r: 4, fill: '#0D5CAB', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Funnel Chart (using BarChart) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-[#0F172A] mb-6">Lead Funnel</h3>
          <div className="h-60 w-full mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" hide />
                <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)'}} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Custom Legend */}
          <div className="space-y-3">
            {funnelData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm font-medium">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: item.color}}></div>
                  <span className="text-[#64748B]">{item.name}</span>
                </div>
                <span className="text-[#0F172A] font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* NOTIFICATIONS WIDGET */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-[#0F172A] mb-4 flex items-center gap-2">
          <MdNotificationsActive className="text-amber-500" /> Recent Notifications
        </h3>
        <div className="space-y-4">
          <div className="flex gap-4 p-4 bg-[#F8FAFC] rounded-xl border border-slate-100">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <MdStorefront size={20} />
            </div>
            <div>
              <h4 className="font-bold text-[#0F172A] text-sm">New Product Launch</h4>
              <p className="text-sm text-[#64748B] mt-1">HDFC Pixel Go Card is now live on your marketplace. Earn up to ₹1,700 per sale!</p>
            </div>
          </div>
          
          <div className="flex gap-4 p-4 bg-[#F8FAFC] rounded-xl border border-slate-100">
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0">
              <MdAccountBalanceWallet size={20} />
            </div>
            <div>
              <h4 className="font-bold text-[#0F172A] text-sm">Commission Credited</h4>
              <p className="text-sm text-[#64748B] mt-1">₹3,500 has been credited to your wallet for Rahul Sharma's Axis Bank Loan.</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
