import React, { useEffect, useState } from 'react';
import { usePartnerStore } from '../../store/partnerStore';
import { 
  MdSearch, MdFilterList, MdCheckCircle, MdPendingActions, 
  MdCancel, MdLocalAtm, MdPhone, MdOutlineWhatsApp, MdHistory,
  MdKeyboardArrowDown, MdKeyboardArrowUp, MdPerson, MdDomain
} from 'react-icons/md';

const STAGES = [
  { id: 'submitted', label: 'Applied', step: 1 },
  { id: 'under_review', label: 'Verification', step: 2 },
  { id: 'approved', label: 'Approved', step: 3 },
  { id: 'disbursed', label: 'Disbursed', step: 4 },
];

export default function PartnerApplications() {
  const fetchApplications = usePartnerStore((state) => state.fetchApplications);
  const applications = usePartnerStore((state) => state.applications);
  const isLoading = usePartnerStore((state) => state.isLoading);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const filteredApps = applications?.filter(app => {
    const matchesSearch = app.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          app.app_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusColor = (status) => {
    switch(status) {
      case 'approved': return 'bg-green-100 text-green-700 border-green-200';
      case 'disbursed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      case 'under_review': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'approved': return <MdCheckCircle />;
      case 'disbursed': return <MdLocalAtm />;
      case 'rejected': return <MdCancel />;
      default: return <MdPendingActions />;
    }
  };

  const getStepProgress = (status) => {
    if (status === 'rejected') return 0;
    if (status === 'disbursed') return 4;
    if (status === 'approved') return 3;
    if (status === 'under_review') return 2;
    return 1; // submitted
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      
      {/* Header & Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#0F172A]">Lead Management</h2>
            <p className="text-[#64748B] text-sm mt-1">Track and manage your customer applications in real-time.</p>
          </div>
          
          <div className="flex gap-2">
            <button className="flex items-center gap-2 bg-[#F8FAFC] text-[#334155] px-4 py-2 rounded-xl font-medium border border-slate-200 hover:bg-slate-50 transition-colors text-sm">
              <MdFilterList size={18} /> Export List
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 pt-2">
          <div className="relative flex-1">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search by customer name or App ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5CAB]/20 focus:border-[#0D5CAB]"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#0D5CAB]/20"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">New / Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="disbursed">Disbursed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Leads List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-[#0D5CAB] border-t-transparent rounded-full"></div>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <MdHistory size={32} />
          </div>
          <h3 className="text-lg font-bold text-[#0F172A] mb-1">No Leads Found</h3>
          <p className="text-[#64748B]">You don't have any applications matching the current filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApps.map((app) => {
            const isExpanded = expandedId === app.app_number;
            const currentStep = getStepProgress(app.status);
            const isRejected = app.status === 'rejected';

            return (
              <div key={app.app_number} className={`bg-white rounded-2xl border transition-all duration-200 shadow-sm overflow-hidden ${isExpanded ? 'border-[#0D5CAB]' : 'border-slate-200 hover:border-slate-300'}`}>
                
                {/* Lead Header (Always Visible) */}
                <div 
                  className="p-5 cursor-pointer flex flex-col md:flex-row gap-4 items-start md:items-center justify-between"
                  onClick={() => setExpandedId(isExpanded ? null : app.app_number)}
                >
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-xl shadow-sm text-slate-400">
                      <MdPerson />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#0F172A] text-lg flex items-center gap-2">
                        {app.customer_name} 
                      </h3>
                      <p className="text-sm font-medium text-[#64748B] flex items-center gap-2 mt-0.5">
                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-xs">{app.app_number}</span> • 
                        {app.product_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-[#64748B] font-medium uppercase tracking-wide">Expected Commission</p>
                      <p className="font-bold text-[#0F172A]">₹{app.commission_amount || 'TBD'}</p>
                    </div>
                    
                    <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 text-sm font-bold capitalize ${getStatusColor(app.status)}`}>
                      {getStatusIcon(app.status)} {app.status.replace('_', ' ')}
                    </div>
                    
                    <button className="text-slate-400 hover:text-[#0D5CAB] p-1">
                      {isExpanded ? <MdKeyboardArrowUp size={24} /> : <MdKeyboardArrowDown size={24} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Timeline & Details */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50 p-5 md:p-6 animate-in slide-in-from-top-2 duration-200">
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Left: Amazon-style Timeline */}
                      <div className="lg:col-span-2">
                        <h4 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider mb-6">Application Timeline</h4>
                        
                        <div className="relative pl-6 space-y-8 before:absolute before:inset-0 before:ml-8 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                          
                          <div className="relative flex items-center justify-between md:justify-around text-sm font-medium text-[#64748B]">
                            {/* Desktop Horizontal Line */}
                            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10 hidden md:block rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${isRejected ? 'bg-red-500' : 'bg-green-500'} transition-all duration-500`}
                                style={{ width: `${isRejected ? 100 : ((currentStep - 1) / (STAGES.length - 1)) * 100}%` }}
                              ></div>
                            </div>

                            {STAGES.map((stage, idx) => {
                              const isCompleted = currentStep >= stage.step;
                              const isActive = currentStep === stage.step && !isRejected;
                              
                              return (
                                <div key={stage.id} className="relative flex flex-row md:flex-col items-center gap-4 md:gap-2 bg-slate-50 md:bg-transparent py-2 md:py-0 w-full md:w-auto z-10">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-slate-50 shadow-sm transition-colors duration-300 ${
                                    isRejected ? 'bg-red-500 text-white' :
                                    isCompleted ? 'bg-green-500 text-white' : 
                                    isActive ? 'bg-[#0D5CAB] text-white' : 'bg-slate-200 text-slate-400'
                                  }`}>
                                    {isRejected ? <MdCancel size={16} /> : <MdCheckCircle size={16} />}
                                  </div>
                                  <div className={`text-left md:text-center ${isActive ? 'text-[#0D5CAB] font-bold' : isCompleted ? 'text-green-600 font-bold' : isRejected ? 'text-red-500 font-bold' : ''}`}>
                                    {stage.label}
                                    {idx === 0 && <span className="block text-xs font-normal text-slate-400 mt-0.5">{new Date(app.created_at).toLocaleDateString()}</span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                        </div>

                        {isRejected && (
                          <div className="mt-6 bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex items-start gap-3">
                            <MdCancel className="mt-0.5 shrink-0" size={20} />
                            <div>
                              <p className="font-bold text-sm">Application Rejected</p>
                              <p className="text-sm mt-1">This application did not meet the bank's criteria during verification.</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Quick Actions & Details */}
                      <div>
                        <h4 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider mb-4">Quick Actions</h4>
                        <div className="space-y-3">
                          <button className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white px-4 py-2.5 rounded-xl font-bold transition-colors shadow-sm">
                            <MdOutlineWhatsApp size={20} /> WhatsApp Customer
                          </button>
                          <button className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-100 text-[#0F172A] px-4 py-2.5 rounded-xl font-bold transition-colors shadow-sm">
                            <MdPhone size={20} /> Call Customer
                          </button>
                        </div>

                        <div className="mt-8 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Lead Details</h4>
                          <ul className="space-y-2 text-sm">
                            <li className="flex justify-between"><span className="text-slate-500">Bank</span> <span className="font-medium text-slate-700">{app.bank_code || 'N/A'}</span></li>
                            <li className="flex justify-between"><span className="text-slate-500">Date Applied</span> <span className="font-medium text-slate-700">{new Date(app.created_at).toLocaleDateString()}</span></li>
                            <li className="flex justify-between"><span className="text-slate-500">Commission</span> <span className="font-medium text-green-600">₹{app.commission_amount || '0'}</span></li>
                          </ul>
                        </div>
                      </div>
                      
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
