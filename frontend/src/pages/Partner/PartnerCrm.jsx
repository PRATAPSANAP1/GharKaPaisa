import React, { useEffect, useState } from 'react';
import { usePartnerStore } from '../../store/partnerStore';
import { 
  MdSearch, MdPerson, MdPhone, MdEmail, MdWork, 
  MdLocationOn, MdHistory, MdEvent, MdOutlineWhatsApp,
  MdNoteAdd, MdAddBox, MdCreditCard
} from 'react-icons/md';

export default function PartnerCrm() {
  const fetchApplications = usePartnerStore((state) => state.fetchApplications);
  const applications = usePartnerStore((state) => state.applications);
  const isLoading = usePartnerStore((state) => state.isLoading);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Group applications by customer to form a basic CRM profile
  const customers = React.useMemo(() => {
    if (!applications) return [];
    
    const customerMap = new Map();
    applications.forEach(app => {
      // Simulate unique customer by name (in a real DB we'd group by mobile or customer_id)
      const key = app.customer_name.trim().toLowerCase();
      if (!customerMap.has(key)) {
        customerMap.set(key, {
          id: key,
          name: app.customer_name,
          mobile: app.mobile || '9876543210', // mock if not present in app
          email: `${key.replace(' ', '.')}@example.com`,
          pan: 'ABCDE1234F',
          aadhaar: 'XXXX-XXXX-1234',
          occupation: 'Salaried Professional',
          city: 'Mumbai',
          products: [],
          followUps: [
            { date: '2026-06-25', status: 'Pending', note: 'Call to collect payslips' }
          ],
          history: [
            { type: 'Call', date: new Date(app.created_at).toLocaleDateString(), desc: 'Initial inquiry' }
          ]
        });
      }
      customerMap.get(key).products.push(app);
    });
    
    return Array.from(customerMap.values());
  }, [applications]);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.mobile.includes(searchTerm)
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto h-[calc(100vh-8rem)]">
      
      {/* LEFT COLUMN: Customer List */}
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
              <div className="animate-spin w-6 h-6 border-2 border-[#0D5CAB] border-t-transparent rounded-full"></div>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-10 px-4 text-slate-500">
              <MdPerson className="mx-auto text-4xl text-slate-300 mb-2" />
              <p className="font-medium">No customers found.</p>
            </div>
          ) : (
            filteredCustomers.map(customer => (
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
                  {customer.name}
                </h4>
                <div className={`flex items-center gap-4 mt-1 text-sm ${selectedCustomer?.id === customer.id ? 'text-blue-100' : 'text-slate-500'}`}>
                  <span className="flex items-center gap-1"><MdPhone size={14}/> {customer.mobile}</span>
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase">
                    {customer.products.length} Products
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Customer Profile Detail */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-y-auto h-full p-6 md:p-8 relative">
        {selectedCustomer ? (
          <div className="animate-in fade-in duration-200 space-y-8 pb-10">
            
            {/* Header & Quick Actions */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-[#F8FAFC] border border-slate-200 rounded-full flex items-center justify-center text-[#0D5CAB]">
                  <MdPerson size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#0F172A]">{selectedCustomer.name}</h2>
                  <p className="text-slate-500 font-medium">Customer since {new Date(selectedCustomer.products[0]?.created_at).getFullYear()}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-sm font-bold rounded-xl transition-colors shadow-sm">
                  <MdOutlineWhatsApp size={18} /> WhatsApp
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-bold rounded-xl transition-colors shadow-sm">
                  <MdPhone size={18} /> Call
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Profile Details */}
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <MdPerson /> Profile Information
                </h3>
                <div className="bg-[#F8FAFC] border border-slate-100 rounded-xl p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Mobile</p>
                      <p className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5"><MdPhone className="text-slate-400"/> {selectedCustomer.mobile}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Email</p>
                      <p className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5"><MdEmail className="text-slate-400"/> {selectedCustomer.email}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Occupation</p>
                      <p className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5"><MdWork className="text-slate-400"/> {selectedCustomer.occupation}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">City</p>
                      <p className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5"><MdLocationOn className="text-slate-400"/> {selectedCustomer.city}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">PAN</p>
                      <p className="font-semibold text-slate-800 font-mono mt-0.5 bg-white px-2 py-0.5 rounded border inline-block">{selectedCustomer.pan}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Aadhaar</p>
                      <p className="font-semibold text-slate-800 font-mono mt-0.5 bg-white px-2 py-0.5 rounded border inline-block">{selectedCustomer.aadhaar}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Products Applied */}
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <MdCreditCard /> Products Applied
                </h3>
                <div className="space-y-3">
                  {selectedCustomer.products.map(p => (
                    <div key={p.app_number} className="p-4 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors bg-white">
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
                          {p.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                  <button className="w-full py-3 border border-dashed border-slate-300 rounded-xl text-slate-500 font-bold hover:bg-slate-50 hover:text-[#0D5CAB] transition-colors flex items-center justify-center gap-2">
                    <MdAddBox size={20} /> Recommend New Product
                  </button>
                </div>
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
              
              {/* Follow-up Section */}
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <MdEvent /> Follow-up Tracker
                </h3>
                <div className="bg-[#FFFBEB] border border-amber-200 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-2.5 py-1 bg-amber-500 text-white rounded-md text-xs font-bold uppercase tracking-wider">Upcoming</span>
                    <span className="text-sm font-bold text-amber-800">{selectedCustomer.followUps[0].date}</span>
                  </div>
                  <p className="text-sm font-medium text-amber-900 mb-4">{selectedCustomer.followUps[0].note}</p>
                  
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 bg-white text-amber-700 border border-amber-300 text-xs font-bold rounded-lg hover:bg-amber-50">Mark Done</button>
                    <button className="flex-1 py-2 bg-white text-amber-700 border border-amber-300 text-xs font-bold rounded-lg hover:bg-amber-50">Reschedule</button>
                  </div>
                </div>
                <button className="mt-3 text-sm font-bold text-[#0D5CAB] flex items-center gap-1 hover:underline">
                  <MdNoteAdd /> Add New Follow-up
                </button>
              </div>

              {/* Communication History */}
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <MdHistory /> Communication Log
                </h3>
                <div className="relative pl-6 space-y-6 before:absolute before:inset-0 before:ml-1 before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-200">
                  {selectedCustomer.history.map((hist, idx) => (
                    <div key={idx} className="relative z-10">
                      <div className="absolute -left-[27px] w-5 h-5 bg-white border-2 border-[#0D5CAB] rounded-full"></div>
                      <h4 className="text-sm font-bold text-[#0F172A]">{hist.type} Logged</h4>
                      <p className="text-xs text-slate-400 mb-1">{hist.date}</p>
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-sm text-slate-600">
                        {hist.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#F8FAFC]/50 text-center p-6">
            <div className="w-20 h-20 bg-slate-100 text-slate-300 rounded-full flex items-center justify-center mb-4">
              <MdPerson size={40} />
            </div>
            <h2 className="text-xl font-bold text-[#0F172A] mb-2">Select a Customer</h2>
            <p className="text-slate-500 max-w-sm">Choose a customer from the left panel to view their complete profile, application history, and follow-up notes.</p>
          </div>
        )}
      </div>

    </div>
  );
}
