import React, { useState } from 'react';
import { 
  MdSecurity, MdSettings, MdHistory, MdNotifications, 
  MdCheckCircle, MdOutlineLanguage, MdOutlineVpnKey, MdOutlineFingerprint 
} from 'react-icons/md';
import { useAuthStore } from '../../../store/authStore';

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser || ((u) => {
    // Fallback if useAuthStore does not expose setUser directly: we can update in memory
    useAuthStore.setState({ user: u });
  }));

  const [activeTab, setActiveTab] = useState('security');
  
  // Form states
  const [password, setPassword] = useState({ old: '', new: '', confirm: '' });
  const [mpin, setMpin] = useState({ code: '', confirm: '' });
  const [notifySettings, setNotifySettings] = useState({ email: true, push: true, whatsapp: false });

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password.new !== password.confirm) return alert('New passwords do not match.');
    alert('Password updated successfully!');
    setPassword({ old: '', new: '', confirm: '' });
  };

  const handleMpinSubmit = (e) => {
    e.preventDefault();
    if (mpin.code !== mpin.confirm) return alert('MPIN digits do not match.');
    alert('4-digit MPIN updated successfully!');
    setMpin({ code: '', confirm: '' });
  };

  const toggleKycBypass = () => {
    const nextStatus = user.kyc_status === 'approved' ? 'pending' : 'approved';
    setUser({
      ...user,
      kyc_status: nextStatus
    });
    alert(`[Developer Bypass] KYC Status locally overridden to: ${nextStatus.toUpperCase()}. All sections are now ${nextStatus === 'approved' ? 'UNLOCKED' : 'LOCKED'}.`);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      
      {/* Title */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A]">Settings & Security</h2>
          <p className="text-[#64748B] text-sm mt-1">Configure security credentials, theme preferences, and review active sessions.</p>
        </div>
        
        {/* Developer Bypass Toggle */}
        <button 
          onClick={toggleKycBypass}
          className={`flex items-center gap-1.5 px-4 py-2 border rounded-xl text-xs font-bold transition-all shadow-sm ${
            user.kyc_status === 'approved' 
            ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' 
            : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
          }`}
        >
          <MdCheckCircle /> Bypass KYC: {user.kyc_status === 'approved' ? 'ON' : 'OFF'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Left tabs menu */}
        <div className="space-y-1">
          <button 
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl font-bold text-sm text-left transition-colors ${activeTab === 'security' ? 'bg-[#0D5CAB] text-white shadow-sm' : 'bg-white border border-slate-200 text-[#334155] hover:bg-slate-50'}`}
          >
            <MdSecurity size={18} /> Credentials & Keys
          </button>
          <button 
            onClick={() => setActiveTab('preferences')}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl font-bold text-sm text-left transition-colors ${activeTab === 'preferences' ? 'bg-[#0D5CAB] text-white shadow-sm' : 'bg-white border border-slate-200 text-[#334155] hover:bg-slate-50'}`}
          >
            <MdSettings size={18} /> App Preferences
          </button>
          <button 
            onClick={() => setActiveTab('sessions')}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl font-bold text-sm text-left transition-colors ${activeTab === 'sessions' ? 'bg-[#0D5CAB] text-white shadow-sm' : 'bg-white border border-slate-200 text-[#334155] hover:bg-slate-50'}`}
          >
            <MdHistory size={18} /> Active Sessions
          </button>
        </div>

        {/* Right Tab Content Panel */}
        <div className="md:col-span-3">
          
          {activeTab === 'security' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Password resetting */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-md font-bold text-[#0F172A] border-b border-slate-100 pb-3 flex items-center gap-2">
                  <MdOutlineVpnKey /> Change Account Password
                </h3>
                
                <form onSubmit={handlePasswordSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Old Password *</label>
                    <input type="password" required value={password.old} onChange={e => setPassword({ ...password, old: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5CAB]/20" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">New Password *</label>
                    <input type="password" required value={password.new} onChange={e => setPassword({ ...password, new: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5CAB]/20" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Confirm New Password *</label>
                    <input type="password" required value={password.confirm} onChange={e => setPassword({ ...password, confirm: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5CAB]/20" />
                  </div>
                  <button type="submit" className="w-full bg-[#0D5CAB] hover:bg-[#083E7A] text-white py-2 rounded-xl text-xs font-bold transition-all shadow-sm">
                    Reset Password
                  </button>
                </form>
              </div>

              {/* Secure MPIN Code */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-md font-bold text-[#0F172A] border-b border-slate-100 pb-3 flex items-center gap-2">
                  <MdOutlineFingerprint /> Setup Login MPIN
                </h3>
                
                <form onSubmit={handleMpinSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">4-Digit MPIN *</label>
                    <input type="password" maxLength={4} required value={mpin.code} onChange={e => setMpin({ ...mpin, code: e.target.value.replace(/\D/g, '') })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5CAB]/20 text-center font-mono tracking-widest text-lg" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Confirm MPIN *</label>
                    <input type="password" maxLength={4} required value={mpin.confirm} onChange={e => setMpin({ ...mpin, confirm: e.target.value.replace(/\D/g, '') })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5CAB]/20 text-center font-mono tracking-widest text-lg" />
                  </div>
                  <button type="submit" className="w-full bg-[#0D5CAB] hover:bg-[#083E7A] text-white py-2 rounded-xl text-xs font-bold transition-all shadow-sm">
                    Update MPIN Key
                  </button>
                </form>
              </div>

            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-[#0F172A] border-b border-slate-100 pb-3">App Configuration</h3>

              {/* Translation locale */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-50 text-slate-500 rounded-lg flex items-center justify-center">
                    <MdOutlineLanguage size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#0F172A]">Default Language</p>
                    <p className="text-xs text-slate-500 font-medium">Choose preferred language for regional translation.</p>
                  </div>
                </div>
                <select className="bg-slate-50 border border-slate-200 text-xs font-bold text-[#334155] rounded-xl px-3 py-1.5 outline-none">
                  <option value="en">English (EN)</option>
                  <option value="hi">Hindi (HI)</option>
                  <option value="mr">Marathi (MR)</option>
                </select>
              </div>

              <div className="w-full h-px bg-slate-100"></div>

              {/* Notifications setting */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><MdNotifications /> Push Alert Settings</h4>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#334155]">Email Payout Notifications</span>
                  <input type="checkbox" checked={notifySettings.email} onChange={e => setNotifySettings({ ...notifySettings, email: e.target.checked })} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#334155]">Push Lead Update Alerts</span>
                  <input type="checkbox" checked={notifySettings.push} onChange={e => setNotifySettings({ ...notifySettings, push: e.target.checked })} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-md font-bold text-[#0F172A]">Login Sessions History</h3>
              </div>

              <div className="divide-y divide-slate-100 text-xs sm:text-sm">
                <div className="p-4 flex justify-between items-center hover:bg-slate-50/50">
                  <div>
                    <p className="font-bold text-[#0F172A]">Windows 11 PC • Chrome Browser</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">IP: 103.82.90.12 • Active Session</p>
                  </div>
                  <span className="bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full text-[10px] uppercase">Current</span>
                </div>
                <div className="p-4 flex justify-between items-center hover:bg-slate-50/50">
                  <div>
                    <p className="font-bold text-[#0F172A]">Android Mobile • WebView shell</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">IP: 27.8.201.55 • 22/06/2026 18:24</p>
                  </div>
                  <span className="bg-slate-100 text-slate-400 font-bold px-2 py-0.5 rounded-full text-[10px] uppercase">Logged Out</span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
