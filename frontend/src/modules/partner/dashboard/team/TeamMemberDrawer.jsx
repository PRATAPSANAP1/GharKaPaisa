import React, { useState, useEffect } from 'react';
import { 
  X, User, Phone, Mail, Building, MapPin, ShieldCheck, 
  CreditCard, FileText, DollarSign, Users, Clock, ExternalLink, RefreshCw 
} from 'lucide-react';
import api from '../../../../services/api';

export default function TeamMemberDrawer({ memberId, onClose, onSelectSubMember }) {
  const [memberData, setMemberData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (memberId) {
      fetchMemberProfile();
    }
  }, [memberId]);

  const fetchMemberProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/team/${memberId}`);
      if (res.data?.success) {
        setMemberData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch team member profile:', err);
      setError(err.response?.data?.message || 'Failed to load member profile details');
    } finally {
      setLoading(false);
    }
  };

  if (!memberId) return null;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-sm flex justify-end transition-opacity">
      <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 shadow-2xl h-full flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        
        {/* Drawer Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center font-bold text-indigo-300 text-lg overflow-hidden">
              {memberData?.profile?.photo ? (
                <img src={memberData.profile.photo} alt="" className="w-full h-full object-cover" />
              ) : (
                (memberData?.profile?.full_name || 'P').slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-base">{memberData?.profile?.full_name || 'Loading Profile...'}</h3>
                {memberData?.profile?.rank && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {memberData.profile.rank}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">Partner Code: {memberData?.profile?.partner_code || memberId}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Tabs Bar */}
        <div className="flex items-center gap-1 p-2 bg-slate-950/60 border-b border-slate-800 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'overview', label: '📌 Overview' },
            { id: 'bank_kyc', label: '🏦 Bank & KYC' },
            { id: 'applications', label: '📄 Applications' },
            { id: 'wallet', label: '💰 Wallet & Overrides' },
            { id: 'direct_team', label: '👥 Direct Sub-Team' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Drawer Body Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
              <p className="text-sm">Fetching member 360° profile details...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center font-semibold">
              {error}
            </div>
          ) : memberData ? (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-3">
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Contact & Account Info</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block">Mobile Number</span>
                        <span className="font-semibold text-white">{memberData.profile.mobile}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Email Address</span>
                        <span className="font-semibold text-white">{memberData.profile.email}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Account Status</span>
                        <span className="font-bold text-emerald-400 uppercase">{memberData.profile.status}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">KYC Status</span>
                        <span className="font-bold text-indigo-300 uppercase">{memberData.profile.kyc_status}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Parent Partner</span>
                        <span className="font-semibold text-white">{memberData.profile.parent_name} ({memberData.profile.parent_code})</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Joined Date</span>
                        <span className="font-semibold text-white">{new Date(memberData.profile.joined_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Business & Address */}
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-3">
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Company & Address</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block">Company Name</span>
                        <span className="font-semibold text-white">{memberData.profile.company_name || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Company Type</span>
                        <span className="font-semibold text-white">{memberData.profile.company_type || 'N/A'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block">Address</span>
                        <span className="font-semibold text-white">{memberData.profile.address || 'N/A'} - Pincode: {memberData.profile.pincode || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bank & KYC Tab */}
              {activeTab === 'bank_kyc' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-3">
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Verified Bank Account</h4>
                    {memberData.bank ? (
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-slate-400 block">Bank Name</span>
                          <span className="font-semibold text-white">{memberData.bank.bank_name}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Account Number</span>
                          <span className="font-semibold text-white">{memberData.bank.account_number}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">IFSC Code</span>
                          <span className="font-semibold text-white">{memberData.bank.ifsc_code}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Account Holder</span>
                          <span className="font-semibold text-white">{memberData.bank.account_holder_name}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No bank details added</p>
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-3">
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">KYC Documents</h4>
                    {memberData.kyc_docs && memberData.kyc_docs.length > 0 ? (
                      <div className="space-y-2">
                        {memberData.kyc_docs.map((doc, i) => (
                          <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 text-xs">
                            <span className="font-semibold text-white uppercase">{doc.doc_type}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${doc.verified ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                              {doc.verified ? 'Verified' : 'Pending'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No KYC documents uploaded</p>
                    )}
                  </div>
                </div>
              )}

              {/* Applications Tab */}
              {activeTab === 'applications' && (
                <div className="space-y-3">
                  {memberData.applications && memberData.applications.length > 0 ? (
                    memberData.applications.map((app) => (
                      <div key={app.id} className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs flex items-center justify-between">
                        <div>
                          <p className="font-bold text-white">{app.product_name}</p>
                          <p className="text-slate-400">App #{app.app_number} • {new Date(app.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            app.status === 'approved' || app.status === 'disbursed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {app.status}
                          </span>
                          <p className="font-bold text-white mt-1">{formatCurrency(app.approved_amount || app.loan_amount || app.credit_limit)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400">No financial applications submitted yet</div>
                  )}
                </div>
              )}

              {/* Wallet & Overrides Tab */}
              {activeTab === 'wallet' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
                      <p className="text-xs text-slate-400">Total Wallet Earned</p>
                      <p className="text-xl font-extrabold text-emerald-400 mt-1">{formatCurrency(memberData.wallet.total_earned)}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
                      <p className="text-xs text-slate-400">Available Balance</p>
                      <p className="text-xl font-extrabold text-indigo-400 mt-1">{formatCurrency(memberData.wallet.available_balance)}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-3">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Commissions Overrides Earned From Member</h4>
                    {memberData.commissions && memberData.commissions.length > 0 ? (
                      <div className="space-y-2">
                        {memberData.commissions.map((comm, i) => (
                          <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 text-xs">
                            <span>Level {comm.level} Override</span>
                            <span className="font-bold text-amber-300">{formatCurrency(comm.amount)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No commission overrides recorded yet</p>
                    )}
                  </div>
                </div>
              )}

              {/* Direct Sub-Team Tab */}
              {activeTab === 'direct_team' && (
                <div className="space-y-3">
                  {memberData.direct_children && memberData.direct_children.length > 0 ? (
                    memberData.direct_children.map((child) => (
                      <div 
                        key={child.id}
                        onClick={() => onSelectSubMember && onSelectSubMember(child.id)}
                        className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs flex items-center justify-between hover:bg-slate-800 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold">
                            {child.name?.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-white">{child.name}</p>
                            <p className="text-[11px] text-slate-400">Code: {child.code}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                          {child.rank}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400">This member has no direct recruits</div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
