import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  MdDashboard, MdStorefront, MdCreditCard, MdLeaderboard, 
  MdPeople, MdVerifiedUser, MdAccountCircle, MdFolder, 
  MdAccountBalanceWallet, MdDeviceHub, MdSchool, MdCampaign, 
  MdFlight, MdSupportAgent, MdSettings, MdMenu, MdClose, MdLogout
} from 'react-icons/md';
import logo from '../logo.png';
import ForcePasswordChangeModal from '../components/Partner/ForcePasswordChangeModal';

const NAV_ITEMS = [
  { id: 'dashboard', path: '/partner/dashboard', label: 'Dashboard', icon: MdDashboard },
  { id: 'marketplace', path: '/partner/marketplace', label: 'Marketplace', icon: MdStorefront },
  { id: 'credit-center', path: '/partner/credit-center', label: 'Credit Center', icon: MdCreditCard },
  { id: 'leads', path: '/partner/leads', label: 'Lead Management', icon: MdLeaderboard },
  { id: 'crm', path: '/partner/crm', label: 'Customer CRM', icon: MdPeople },
  { id: 'kyc', path: '/partner/kyc', label: 'KYC Center', icon: MdVerifiedUser },
  { id: 'profile', path: '/partner/profile', label: 'Profile Hub', icon: MdAccountCircle },
  { id: 'vault', path: '/partner/vault', label: 'Document Vault', icon: MdFolder },
  { id: 'wallet', path: '/partner/wallet', label: 'Wallet', icon: MdAccountBalanceWallet },
  { id: 'referral', path: '/partner/referral', label: 'Team Network', icon: MdDeviceHub },
  { id: 'training', path: '/partner/training', label: 'Training Academy', icon: MdSchool },
  { id: 'marketing', path: '/partner/marketing', label: 'Marketing Center', icon: MdCampaign },
  { id: 'travel', path: '/partner/travel', label: 'Travel & Utility', icon: MdFlight },
  { id: 'support', path: '/partner/support', label: 'Support Center', icon: MdSupportAgent },
  { id: 'settings', path: '/partner/settings', label: 'Settings', icon: MdSettings },
];

// Mobile Bottom Nav items (Core)
const MOBILE_BOTTOM_NAV = [
  { path: '/partner/dashboard', label: 'Home', icon: MdDashboard },
  { path: '/partner/marketplace', label: 'Products', icon: MdStorefront },
  { path: '/partner/leads', label: 'Leads', icon: MdLeaderboard },
  { path: '/partner/wallet', label: 'Wallet', icon: MdAccountBalanceWallet },
];

export default function PartnerLayout() {
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const kycStatus = user?.kyc_status || 'pending';
  const isKycApproved = kycStatus === 'approved';
  
  // Force user to the KYC page if not approved, unless they are already there or on profile
  const isKycPage = location.pathname.includes('/partner/kyc');
  const isProfilePage = location.pathname.includes('/partner/profile');
  const isSettingsPage = location.pathname.includes('/partner/settings');
  const isBlocked = !isKycApproved && !isKycPage && !isProfilePage && !isSettingsPage;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-[#0F172A]">
      <ForcePasswordChangeModal isOpen={user?.must_change_password} />
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-slate-200 shadow-sm z-20">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <img src={logo} alt="Logo" className="h-8" />
          <h2 className="text-xl font-bold text-[#0D5CAB]">Partner Panel</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            const isDisabled = !isKycApproved && item.id !== 'kyc' && item.id !== 'profile' && item.id !== 'settings';
            
            if (isDisabled) {
              return (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-[15px] text-slate-300 cursor-not-allowed" title="Complete KYC to unlock">
                  <Icon size={20} />
                  {item.label}
                </div>
              );
            }

            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-[15px] ${
                  isActive 
                  ? 'bg-[#0D5CAB] text-white shadow-md' 
                  : 'text-[#64748B] hover:bg-slate-50 hover:text-[#0D5CAB]'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-white' : 'text-[#64748B]'} />
                {item.label}
              </NavLink>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-600 font-medium hover:bg-red-50 transition-colors"
          >
            <MdLogout size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER (When Mobile Menu is Closed) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-30 flex items-center justify-between px-4">
        <img src={logo} alt="Logo" className="h-6" />
        <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-[#64748B] bg-slate-50 rounded-lg">
          <MdMenu size={24} />
        </button>
      </div>

      {/* MOBILE FULLSCREEN MENU */}
      <div className={`md:hidden fixed inset-0 bg-white z-50 transform transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
        <div className="h-16 border-b border-slate-200 flex items-center justify-between px-4 bg-white">
          <h2 className="text-lg font-bold text-[#0D5CAB]">All Modules</h2>
          <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-[#64748B] bg-slate-50 rounded-lg">
            <MdClose size={24} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-4 px-4 space-y-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl font-semibold ${
                  isActive 
                  ? 'bg-[#0D5CAB] text-white shadow-md' 
                  : 'bg-slate-50 text-[#334155]'
                }`}
              >
                <Icon size={22} className={isActive ? 'text-white' : 'text-[#0D5CAB]'} />
                {item.label}
              </NavLink>
            );
          })}
          <div className="pt-4 pb-10 border-t border-slate-100 mt-4">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl bg-red-50 text-red-600 font-bold"
            >
              <MdLogout size={22} />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col md:relative pt-16 md:pt-0 pb-20 md:pb-0 overflow-y-auto bg-[#F8FAFC]">
        {/* KYC Mandatory Banner */}
        {!isKycApproved && (
          <div className="bg-amber-500 text-white px-4 py-3 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <MdVerifiedUser size={24} />
              <div className="font-medium text-sm">
                <strong>KYC Action Required:</strong> Your KYC status is currently <span className="uppercase font-bold text-amber-900 bg-white/20 px-1 rounded">{kycStatus}</span>. You must complete verification to access all features.
              </div>
            </div>
            {!isKycPage && (
              <button 
                onClick={() => navigate('/partner/kyc')} 
                className="bg-white text-amber-600 px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm whitespace-nowrap hover:bg-amber-50 transition-colors"
              >
                Verify Now
              </button>
            )}
          </div>
        )}

        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full relative">
          {isBlocked ? (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#F8FAFC]/90 backdrop-blur-sm p-6 text-center">
              <div className="w-20 h-20 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <MdVerifiedUser size={40} />
              </div>
              <h2 className="text-2xl font-bold text-[#0F172A] mb-3">Complete Your KYC First</h2>
              <p className="text-[#64748B] max-w-md mb-6 leading-relaxed">
                As per regulatory guidelines, you must complete your KYC verification before accessing the partner marketplace, lead management, and wallet features.
              </p>
              <button 
                onClick={() => navigate('/partner/kyc')} 
                className="bg-[#0D5CAB] text-white px-8 py-3 rounded-xl font-bold shadow-md hover:bg-[#083E7A] transition-all"
              >
                Proceed to KYC Center
              </button>
            </div>
          ) : (
            <Outlet />
          )}
        </div>
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] z-40 px-2 pb-safe">
        <div className="flex justify-around items-center h-16">
          {MOBILE_BOTTOM_NAV.map((nav) => {
            const Icon = nav.icon;
            const isActive = location.pathname.startsWith(nav.path);
            return (
              <NavLink
                key={nav.path}
                to={nav.path}
                className="flex flex-col items-center justify-center w-full h-full gap-1"
              >
                <Icon size={24} className={isActive ? 'text-[#0D5CAB]' : 'text-[#94A3B8]'} />
                <span className={`text-[10px] font-bold ${isActive ? 'text-[#0D5CAB]' : 'text-[#94A3B8]'}`}>
                  {nav.label}
                </span>
              </NavLink>
            );
          })}
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center w-full h-full gap-1"
          >
            <div className="w-6 h-6 flex items-center justify-center rounded-full bg-[#F1F5F9]">
              <MdMenu size={18} className="text-[#64748B]" />
            </div>
            <span className="text-[10px] font-bold text-[#64748B]">More</span>
          </button>
        </div>
      </nav>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 4px;
        }
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}} />
    </div>
  );
}
