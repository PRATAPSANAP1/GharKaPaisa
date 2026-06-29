import React, { useEffect, useState } from 'react';
import { usePartnerStore } from '../../../store/partnerStore';
import {
  MdSearch, MdPerson, MdPhone, MdEmail, MdWork,
  MdLocationOn, MdHistory, MdOutlineWhatsapp,
  MdAddBox, MdCreditCard
} from 'react-icons/md';

export default function PartnerCrm() {
  const fetchCustomers = usePartnerStore((state) => state.fetchCustomers);
  const customers = usePartnerStore((state) => state.customers);
  const isLoading = usePartnerStore((state) => state.isLoading);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const filteredCustomers = (customers || []).filter((c) =>
    c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.mobile?.includes(searchTerm)
  );

  const openWhatsApp = (mobile) => {
    window.open(`https://wa.me/91${mobile}`, '_blank', 'noopener,noreferrer');
  };

  const openCall = (mobile) => {
    window.location.href = `tel:+91${mobile}`;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto h-[calc(100vh-8rem)]">
      <div className="w-full lg:w-1/3 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden shrink-0">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-xl font-bold text-[#0F172A] mb-4">Customer CRM</h2>
          <div className="relative">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search by name or mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5CAB]/20 focus:border-[#0D5CAB] text-sm font-medium"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin w-6 h-6 border-2 border-[#0D5CAB] border-t-transparent rounded-full" />
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-10 px-4 text-slate-500">
              <MdPerson className="mx-auto text-4xl text-slate-300 mb-2" />
              <p className="font-medium">No customers found.</p>
              <p className="text-sm mt-1">Customers appear here after you submit leads.</p>
            </div>
          ) : (
            filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                onClick={() => setSelectedCustomer(customer)}
                className={`p-4 rounded-xl cursor-pointer border transition-all ${
                  selectedCustomer?.id === customer.id
                    ? 'bg-[#0D5CAB] border-[#0D5CAB] text-white shadow-md'
                    : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <h4 className={`font-bold ${selectedCustomer?.id === customer.id ? 'text-white' : 'text-[#0F172A]'}`}>
                  {customer.full_name}
                </h4>
                <div className={`flex items-center gap-4 mt-1 text-sm ${selectedCustomer?.id === customer.id ? 'text-blue-100' : 'text-slate-500'}`}>
                  <span className="flex items-center gap-1"><MdPhone size={14} /> {customer.mobile}</span>
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase">
                    {customer.application_count} Products
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-y-auto h-full p-6 md:p-8 relative">
        {selectedCustomer ? (
          <div className="animate-in fade-in duration-200 space-y-8 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-[#F8FAFC] border border-slate-200 rounded-full flex items-center justify-center text-[#0D5CAB]">
                  <MdPerson size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#0F172A]">{selectedCustomer.full_name}</h2>
                  <p className="text-slate-500 font-medium">
                    Customer since {selectedCustomer.first_application_at
                      ? new Date(selectedCustomer.first_application_at).getFullYear()
                      : '—'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openWhatsApp(selectedCustomer.mobile)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
                >
                  <MdOutlineWhatsapp size={18} /> WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => openCall(selectedCustomer.mobile)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-bold rounded-xl transition-colors shadow-sm"
                >
                  <MdPhone size={18} /> Call
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <MdPerson /> Profile Information
                </h3>
                <div className="bg-[#F8FAFC] border border-slate-100 rounded-xl p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Mobile</p>
                      <p className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5"><MdPhone className="text-slate-400" /> {selectedCustomer.mobile || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Email</p>
                      <p className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5"><MdEmail className="text-slate-400" /> {selectedCustomer.email || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Employment</p>
                      <p className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5"><MdWork className="text-slate-400" /> {selectedCustomer.employment_type || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">City</p>
                      <p className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5"><MdLocationOn className="text-slate-400" /> {[selectedCustomer.city, selectedCustomer.state].filter(Boolean).join(', ') || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">PAN</p>
                      <p className="font-semibold text-slate-800 font-mono mt-0.5 bg-white px-2 py-0.5 rounded border inline-block">{selectedCustomer.pan_number || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Aadhaar</p>
                      <p className="font-semibold text-slate-800 font-mono mt-0.5 bg-white px-2 py-0.5 rounded border inline-block">
                        {selectedCustomer.aadhaar_last4 ? `XXXX-XXXX-${selectedCustomer.aadhaar_last4}` : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <MdCreditCard /> Products Applied
                </h3>
                <div className="space-y-3">
                  {(selectedCustomer.applications || []).map((p) => (
                    <div key={p.app_number || p.id} className="p-4 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors bg-white">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-[#0F172A] text-sm">{p.product_name}</h4>
                          <p className="text-xs text-slate-500 mt-1">{p.bank_code} • {new Date(p.created_at).toLocaleDateString()}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                          p.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                          p.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {p.status?.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                  <button type="button" className="w-full py-3 border border-dashed border-slate-300 rounded-xl text-slate-500 font-bold hover:bg-slate-50 hover:text-[#0D5CAB] transition-colors flex items-center justify-center gap-2">
                    <MdAddBox size={20} /> Recommend New Product
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <MdHistory /> Application Timeline
              </h3>
              <div className="relative pl-6 space-y-6 before:absolute before:inset-0 before:ml-1 before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-200">
                {(selectedCustomer.applications || []).map((app) => (
                  <div key={app.id} className="relative z-10">
                    <div className="absolute -left-[27px] w-5 h-5 bg-white border-2 border-[#0D5CAB] rounded-full" />
                    <h4 className="text-sm font-bold text-[#0F172A]">{app.product_name}</h4>
                    <p className="text-xs text-slate-400 mb-1">{new Date(app.created_at).toLocaleDateString()} • {app.status?.replace('_', ' ')}</p>
                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-sm text-slate-600">
                      {app.bank_name} — App #{app.app_number}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#F8FAFC]/50 text-center p-6">
            <div className="w-20 h-20 bg-slate-100 text-slate-300 rounded-full flex items-center justify-center mb-4">
              <MdPerson size={40} />
            </div>
            <h2 className="text-xl font-bold text-[#0F172A] mb-2">Select a Customer</h2>
            <p className="text-slate-500 max-w-sm">Choose a customer from the left panel to view their profile and application history.</p>
          </div>
        )}
      </div>
    </div>
  );
}
