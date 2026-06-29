import React, { useEffect, useState } from 'react';
import { usePartnerStore } from '../../../store/partnerStore';
import ChangePasswordWidget from './ChangePasswordWidget';
import { 
  MdPerson, MdBusinessCenter, MdAccountBalance, MdSecurity,
  MdEdit, MdCheckCircle, MdSchool, MdWork, MdCreditCard
} from 'react-icons/md';

export default function PartnerProfile() {
  const fetchProfile = usePartnerStore((state) => state.fetchProfile);
  const profile = usePartnerStore((state) => state.profile);
  const isLoading = usePartnerStore((state) => state.isLoading);

  const [activeTab, setActiveTab] = useState('personal');

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D5CAB]"></div>
      </div>
    );
  }

  if (!profile) {
    return <p className="text-red-500">Failed to load profile.</p>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      
      {/* Profile Header Widget */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
        <div className="h-32 bg-gradient-to-r from-[#0D5CAB] to-[#0A4A8A]"></div>
        <div className="px-6 md:px-10 pb-6 relative flex flex-col md:flex-row items-center md:items-end gap-6 -mt-12 md:-mt-16">
          <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-full p-1.5 shadow-md">
            <div className="w-full h-full bg-[#F8FAFC] rounded-full border border-slate-200 flex items-center justify-center text-[#0D5CAB]">
              <MdPerson size={64} />
            </div>
          </div>
          <div className="text-center md:text-left flex-1 mb-2">
            <h2 className="text-2xl md:text-3xl font-bold text-[#0F172A]">{profile.first_name} {profile.last_name}</h2>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2">
              <span className="font-mono text-[#0D5CAB] bg-blue-50 px-3 py-1 rounded-md font-bold text-sm border border-blue-100">
                {profile.Partner_code}
              </span>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                profile.kyc_status === 'approved' ? 'bg-green-50 text-green-700 border border-green-200' :
                profile.kyc_status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-200' :
                'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {profile.kyc_status === 'approved' && <MdCheckCircle size={14} />} 
                KYC: {profile.kyc_status}
              </span>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#64748B] hover:bg-slate-50 transition-colors shadow-sm mb-2">
            <MdEdit /> Edit Profile
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2 flex flex-col gap-1">
            <button
              onClick={() => setActiveTab('personal')}
              className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl font-bold transition-colors ${
                activeTab === 'personal' ? 'bg-[#0D5CAB] text-white shadow-md' : 'text-[#64748B] hover:bg-slate-50 hover:text-[#0F172A]'
              }`}
            >
              <MdPerson size={20} /> Personal Details
            </button>
            <button
              onClick={() => setActiveTab('professional')}
              className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl font-bold transition-colors ${
                activeTab === 'professional' ? 'bg-[#0D5CAB] text-white shadow-md' : 'text-[#64748B] hover:bg-slate-50 hover:text-[#0F172A]'
              }`}
            >
              <MdBusinessCenter size={20} /> Professional Info
            </button>
            <button
              onClick={() => setActiveTab('bank')}
              className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl font-bold transition-colors ${
                activeTab === 'bank' ? 'bg-[#0D5CAB] text-white shadow-md' : 'text-[#64748B] hover:bg-slate-50 hover:text-[#0F172A]'
              }`}
            >
              <MdAccountBalance size={20} /> Bank Details
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl font-bold transition-colors ${
                activeTab === 'security' ? 'bg-[#0F172A] text-white shadow-md' : 'text-[#64748B] hover:bg-slate-50 hover:text-[#0F172A]'
              }`}
            >
              <MdSecurity size={20} /> Security & Access
            </button>
          </div>
        </aside>

        {/* Tab Content */}
        <div className="flex-1">
          {activeTab === 'personal' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200">
              <h3 className="text-xl font-bold text-[#0F172A] mb-6 flex items-center gap-2">
                <MdPerson className="text-[#0D5CAB]" /> Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</p>
                  <p className="font-semibold text-[#0F172A]">{profile.email || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Mobile Number</p>
                  <p className="font-semibold text-[#0F172A]">{profile.mobile}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Residential Address</p>
                  <p className="font-semibold text-[#0F172A]">{profile.current_address || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pincode</p>
                  <p className="font-semibold text-[#0F172A]">{profile.pincode || '—'}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'professional' && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              {/* Business Info */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
                <h3 className="text-xl font-bold text-[#0F172A] mb-6 flex items-center gap-2">
                  <MdWork className="text-[#0D5CAB]" /> Business Profile
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Company / Agency Name</p>
                    <p className="font-semibold text-[#0F172A]">{profile.company_name || 'Individual Freelancer'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Entity Type</p>
                    <p className="font-semibold text-[#0F172A]">{profile.company_type || 'Sole Proprietor'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">GST Number</p>
                    <p className="font-mono text-[#0F172A] bg-slate-50 px-2 py-0.5 rounded inline-block">{profile.gst_number || 'Not Registered'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Years of Experience</p>
                    <p className="font-semibold text-[#0F172A]">5+ Years (Mock)</p>
                  </div>
                </div>
              </div>

              {/* Education Info */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
                <h3 className="text-xl font-bold text-[#0F172A] mb-6 flex items-center gap-2">
                  <MdSchool className="text-[#0D5CAB]" /> Educational Qualifications
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Highest Degree</p>
                    <p className="font-semibold text-[#0F172A]">Bachelor of Commerce</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Institution</p>
                    <p className="font-semibold text-[#0F172A]">Mumbai University</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bank' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200">
              <h3 className="text-xl font-bold text-[#0F172A] mb-6 flex items-center gap-2">
                <MdCreditCard className="text-[#0D5CAB]" /> Bank Account for Payouts
              </h3>
              
              <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-6 mb-6 flex items-start gap-4">
                 <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[#0D5CAB] shadow-sm shrink-0 border border-slate-100">
                   <MdAccountBalance size={24} />
                 </div>
                 <div className="flex-1">
                   <div className="flex justify-between items-start">
                     <div>
                       <h4 className="font-bold text-[#0F172A] text-lg">HDFC Bank Ltd.</h4>
                       <p className="text-sm text-[#64748B] mt-0.5">Savings Account</p>
                     </div>
                     <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded uppercase">Verified</span>
                   </div>
                   
                   <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-200 pt-5">
                     <div>
                       <p className="text-xs font-bold text-slate-400 uppercase mb-1">Account Number</p>
                       <p className="font-mono font-bold text-[#0F172A]">XXXX-XXXX-8921</p>
                     </div>
                     <div>
                       <p className="text-xs font-bold text-slate-400 uppercase mb-1">IFSC Code</p>
                       <p className="font-mono font-bold text-[#0F172A]">HDFC0001234</p>
                     </div>
                     <div className="col-span-2">
                       <p className="text-xs font-bold text-slate-400 uppercase mb-1">Account Holder Name</p>
                       <p className="font-bold text-[#0F172A]">{profile.first_name} {profile.last_name}</p>
                     </div>
                   </div>
                 </div>
              </div>

              <p className="text-xs text-slate-500 flex items-center gap-1"><MdSecurity /> Bank details are securely stored and encrypted.</p>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 md:p-8">
                <h3 className="text-xl font-bold text-[#0F172A] mb-2 flex items-center gap-2">
                  <MdSecurity className="text-[#0F172A]" /> Security Settings
                </h3>
                <p className="text-sm text-slate-500 mb-8">Update your password to keep your account secure.</p>
                <ChangePasswordWidget />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
