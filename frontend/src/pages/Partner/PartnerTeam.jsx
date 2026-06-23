import React, { useState, useEffect } from 'react';
import { 
  MdAdd, MdPerson, MdEmail, MdPhone, MdCheckCircle, 
  MdPendingActions, MdClose, MdContentCopy, MdShare,
  MdOutlineQrCode2, MdOutlineWhatsApp
} from 'react-icons/md';
import api from '../../api/api';
import { useAuthStore } from '../../store/authStore';

export default function PartnerTeam() {
  const user = useAuthStore((state) => state.user);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [activeTab, setActiveTab] = useState('tree'); // 'tree' | 'list'
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', mobile: '', password: ''
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/partner/${user.PartnerId}/team`);
      setTeam(res.data.data || []);
    } catch (err) {
      setError('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.PartnerId) {
      fetchTeam();
    }
  }, [user]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError('');
    try {
      const res = await api.post(`/partner/${user.PartnerId}/team`, formData);
      setTeam([res.data.data, ...team]); 
      setIsAddModalOpen(false);
      setFormData({ first_name: '', last_name: '', email: '', mobile: '', password: '' });
      fetchTeam();
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to add team member');
    } finally {
      setAddLoading(false);
    }
  };

  const copyReferralLink = () => {
    const link = `https://gharkapaisa.in/register?ref=${user?.PartnerCode || 'GKP'}`;
    navigator.clipboard.writeText(link);
    alert('Referral link copied to clipboard!');
  };

  // Mocking Level 2 for demonstration of the Tree UI
  const buildTree = () => {
    return team.map(member => ({
      ...member,
      children: Math.random() > 0.5 ? [
        { id: `mock-${member.id}-1`, first_name: 'Sub', last_name: 'Partner', Partner_code: 'GKP-SUB1', kyc_status: 'pending' }
      ] : []
    }));
  };

  const treeData = buildTree();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A]">Referral Network</h2>
          <p className="text-[#64748B] text-sm mt-1">Grow your team and earn passive income on their sales.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-[#0D5CAB] text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:bg-[#083E7A] transition-colors"
        >
          <MdAdd size={20} /> Add Direct Partner
        </button>
      </div>

      {/* Referral Tools Banner */}
      <div className="bg-gradient-to-br from-[#0D5CAB] to-[#0A4A8A] rounded-2xl p-6 md:p-8 shadow-md text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-[0.05] rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        
        <div className="z-10 w-full md:w-auto text-center md:text-left">
          <h3 className="text-xl font-bold mb-2">Invite Partners & Earn 10% Lifetime</h3>
          <p className="text-blue-100 text-sm max-w-md mx-auto md:mx-0">Share your unique partner link. Anyone who registers and sells products will generate override commissions for you.</p>
        </div>

        <div className="z-10 flex flex-wrap justify-center gap-3 w-full md:w-auto">
          <button 
            onClick={copyReferralLink}
            className="flex items-center gap-2 bg-white text-[#0D5CAB] px-4 py-2.5 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition-colors"
          >
            <MdContentCopy size={18} /> Copy Link
          </button>
          <button className="flex items-center gap-2 bg-[#25D366] text-white px-4 py-2.5 rounded-xl font-bold shadow-sm hover:bg-[#1EBE5D] transition-colors">
            <MdOutlineWhatsApp size={18} /> WhatsApp
          </button>
          <button className="flex items-center gap-2 bg-blue-500/20 text-white border border-blue-400/30 px-4 py-2.5 rounded-xl font-bold hover:bg-blue-500/30 transition-colors">
            <MdOutlineQrCode2 size={18} /> QR Code
          </button>
        </div>
      </div>

      {/* Network View Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-100 p-2 gap-2 bg-slate-50">
          <button
            onClick={() => setActiveTab('tree')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-colors ${
              activeTab === 'tree' ? 'bg-white text-[#0D5CAB] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Graphical Tree
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-colors ${
              activeTab === 'list' ? 'bg-white text-[#0D5CAB] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            List View
          </button>
        </div>

        <div className="p-6">
          {error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">{error}</div>
          ) : loading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D5CAB]"></div>
            </div>
          ) : team.length === 0 ? (
            <div className="text-center py-12 px-4 text-slate-500">
              <MdShare className="mx-auto text-4xl text-slate-300 mb-3" />
              <h3 className="text-lg font-bold text-[#0F172A] mb-1">Your Network is Empty</h3>
              <p className="font-medium max-w-sm mx-auto">Use the referral link above to invite sub-partners and start building your downline.</p>
            </div>
          ) : activeTab === 'list' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-xs font-bold text-[#64748B] uppercase tracking-wider border-b border-slate-200">
                    <th className="p-4 rounded-tl-xl">Partner Info</th>
                    <th className="p-4">Contact</th>
                    <th className="p-4">Code / Level</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 rounded-tr-xl">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {team.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 text-[#0D5CAB] flex items-center justify-center font-bold">
                            {member.first_name?.[0] || 'T'}
                          </div>
                          <div>
                            <p className="font-bold text-[#0F172A]">{member.first_name} {member.last_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 space-y-1">
                        <div className="flex items-center gap-2 text-sm text-[#334155] font-medium"><MdEmail className="text-slate-400" /> {member.email}</div>
                        <div className="flex items-center gap-2 text-sm text-[#334155] font-medium"><MdPhone className="text-slate-400" /> {member.mobile}</div>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-[#0D5CAB] bg-blue-50 px-2 py-1 rounded border border-blue-100 font-bold text-xs inline-block mb-1">
                          {member.Partner_code}
                        </span>
                        <div className="text-xs font-bold text-slate-400">Level 1 (Direct)</div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                          member.kyc_status === 'approved' ? 'bg-green-50 text-green-700 border border-green-200' :
                          member.kyc_status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {member.kyc_status === 'approved' ? <MdCheckCircle size={12} /> : <MdPendingActions size={12} />}
                          {member.kyc_status || 'PENDING'}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-medium text-[#64748B]">
                        {new Date(member.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* GRAPHICAL TREE VIEW */
            <div className="p-4 overflow-x-auto">
              <div className="flex flex-col items-center">
                {/* Root Node (You) */}
                <div className="flex flex-col items-center relative">
                  <div className="bg-[#0F172A] text-white p-4 rounded-xl shadow-lg border border-slate-700 w-64 text-center z-10">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-2">
                      <MdPerson size={24} />
                    </div>
                    <h4 className="font-bold">You</h4>
                    <p className="text-xs text-slate-400 mt-1 font-mono">{user?.PartnerCode || 'GKP-ROOT'}</p>
                  </div>
                  {/* Stem down from root */}
                  <div className="w-px h-8 bg-slate-300"></div>
                  
                  {/* Horizontal Connector */}
                  {treeData.length > 1 && (
                    <div className="w-full h-px bg-slate-300 relative" style={{ width: `${(treeData.length - 1) * 280}px` }}></div>
                  )}

                  {/* Level 1 Nodes */}
                  <div className="flex gap-4 pt-8 relative w-full justify-center">
                    {treeData.map((member, idx) => (
                      <div key={member.id} className="flex flex-col items-center relative w-[280px]">
                        {/* Stem up to horizontal line */}
                        <div className="absolute -top-8 w-px h-8 bg-slate-300"></div>
                        
                        {/* Level 1 Node Card */}
                        <div className="bg-white border-2 border-[#0D5CAB] p-4 rounded-xl shadow-sm w-56 text-center z-10 relative">
                          <h4 className="font-bold text-[#0F172A] truncate">{member.first_name} {member.last_name}</h4>
                          <p className="text-xs text-slate-500 mt-1 font-mono">{member.Partner_code}</p>
                          <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            member.kyc_status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            L1 • {member.kyc_status}
                          </span>
                        </div>

                        {/* Sub-children (Level 2 Mock) */}
                        {member.children && member.children.length > 0 && (
                          <>
                            <div className="w-px h-8 bg-slate-300"></div>
                            <div className="flex gap-4">
                              {member.children.map(child => (
                                <div key={child.id} className="flex flex-col items-center relative">
                                  <div className="bg-slate-50 border border-slate-300 p-3 rounded-xl shadow-sm w-48 text-center z-10">
                                    <h4 className="font-bold text-[#334155] text-sm truncate">{child.first_name} {child.last_name}</h4>
                                    <p className="text-[10px] text-slate-400 mt-1 font-mono">{child.Partner_code}</p>
                                    <span className="inline-block mt-2 px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-200 text-slate-600">
                                      L2 • {child.kyc_status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Direct Partner Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0F172A]/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-[#0F172A]">Add Direct Partner</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-slate-200 rounded-full transition-colors">
                <MdClose size={20} />
              </button>
            </div>

            <div className="p-6">
              {addError && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100 font-medium">{addError}</div>}
              
              <form id="add-team-form" onSubmit={handleAddSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-[#334155] mb-1.5">First Name *</label>
                    <input type="text" required value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5CAB]/20 focus:border-[#0D5CAB] font-medium" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#334155] mb-1.5">Last Name</label>
                    <input type="text" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5CAB]/20 focus:border-[#0D5CAB] font-medium" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#334155] mb-1.5">Email Address *</label>
                  <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5CAB]/20 focus:border-[#0D5CAB] font-medium" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#334155] mb-1.5">Mobile Number *</label>
                  <input type="tel" required pattern="[0-9]{10}" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5CAB]/20 focus:border-[#0D5CAB] font-medium" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#334155] mb-1.5">Initial Password *</label>
                  <input type="text" required minLength={6} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5CAB]/20 focus:border-[#0D5CAB] font-medium" />
                  <p className="text-xs font-semibold text-amber-600 mt-2 bg-amber-50 p-2 rounded border border-amber-100">User will be forced to change this upon first login.</p>
                </div>
              </form>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-3">
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3 rounded-xl font-bold text-[#64748B] bg-white border border-slate-200 hover:bg-slate-100 transition-colors">
                Cancel
              </button>
              <button type="submit" form="add-team-form" disabled={addLoading} className="flex-[2] py-3 bg-[#0D5CAB] text-white rounded-xl font-bold shadow-md hover:bg-[#083E7A] transition-colors disabled:opacity-70 flex justify-center items-center gap-2">
                {addLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Create Partner Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
