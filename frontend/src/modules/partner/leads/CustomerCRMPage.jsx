import React, { useState, useEffect } from 'react';
import { 
  MdSearch, MdPersonAdd, MdPhone, MdOutlineWhatsapp, MdEmail, 
  MdFolder, MdAssignment, MdDateRange, MdInfoOutline, MdClose 
} from 'react-icons/md';
import api from '../../../api/api';
import { usePartnerStore } from '../../../store/partnerStore';

export default function CustomerCRMPage() {
  const applications = usePartnerStore((state) => state.applications);
  const fetchApplications = usePartnerStore((state) => state.fetchApplications);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  // Custom states for added customers in CRM
  const [customersList, setCustomersList] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    fullName: '',
    mobile: '',
    email: '',
    panNumber: '',
    aadhaarLast4: '',
    location: '',
    occupation: '',
    city: '',
    state: '',
    pincode: '',
    notes: '',
    followUpDate: ''
  });

  const fetchCRMData = async () => {
    setLoading(true);
    try {
      // Fetch applications to extract dynamic customer info
      await fetchApplications();
      
      // Seed initial customer list from applications, and group by mobile number
      const grouped = {};
      applications?.forEach(app => {
        const mob = app.mobile || 'N/A';
        if (!grouped[mob]) {
          grouped[mob] = {
            id: app.customer_id || app.id,
            fullName: app.customer_name,
            mobile: mob,
            email: app.email || '',
            city: app.city || 'N/A',
            occupation: 'Salaried',
            appliedProducts: [],
            totalCommission: 0,
            notes: app.notes || ''
          };
        }
        grouped[mob].appliedProducts.push({
          name: app.product_name,
          status: app.status,
          date: app.created_at,
          commission: app.commission_amount
        });
        grouped[mob].totalCommission += parseFloat(app.commission_amount || 0);
      });
      
      setCustomersList(Object.values(grouped));
    } catch (err) {
      console.error("CRM loading error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCRMData();
  }, [applications?.length]);

  const handleInputChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleAddCustomerSubmit = (e) => {
    e.preventDefault();
    if (!form.fullName || !form.mobile) {
      return alert("Customer Name and Mobile are required.");
    }

    const newCustomer = {
      id: Math.random().toString(36).substr(2, 9),
      fullName: form.fullName,
      mobile: form.mobile,
      email: form.email,
      city: form.city || 'N/A',
      occupation: form.occupation || 'N/A',
      appliedProducts: [],
      totalCommission: 0,
      notes: form.notes || ''
    };

    setCustomersList([newCustomer, ...customersList]);
    setIsAddModalOpen(false);
    setForm({
      fullName: '', mobile: '', email: '', panNumber: '', aadhaarLast4: '',
      location: '', occupation: '', city: '', state: '', pincode: '', notes: '', followUpDate: ''
    });
    alert("Customer profile created successfully!");
  };

  const filteredCustomers = customersList.filter(c => 
    c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.mobile.includes(searchTerm)
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      
      {/* Header and Controls */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A]">Customer CRM</h2>
          <p className="text-[#64748B] text-sm mt-1">Manage client profiles, transaction history, and active follow-up schedules.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-[#0D5CAB] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#083E7A] transition-colors shadow-sm self-start sm:self-auto"
        >
          <MdPersonAdd size={20} /> Onboard Customer
        </button>
      </div>

      {/* Roster & Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Customer Roster List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center relative">
            <MdSearch className="absolute left-7 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search clients by name or mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5CAB]/20"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-20 bg-white border border-slate-200 rounded-2xl">
              <div className="animate-spin w-8 h-8 border-4 border-[#0D5CAB] border-t-transparent rounded-full"></div>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
              <MdFolder size={48} className="mx-auto text-slate-300 mb-3" />
              <p className="font-bold text-[#0F172A]">No customer profiles registered</p>
              <p className="text-sm text-slate-400 mt-1">Click the button above to onboard your first customer.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCustomers.map((customer) => (
                <div 
                  key={customer.mobile} 
                  onClick={() => setSelectedCustomer(customer)}
                  className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${selectedCustomer?.mobile === customer.mobile ? 'border-[#0D5CAB] bg-blue-50/10' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0D5CAB]/10 text-[#0D5CAB] flex items-center justify-center font-bold text-lg">
                      {customer.fullName[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-[#0F172A]">{customer.fullName}</h4>
                      <p className="text-xs text-slate-500 font-medium font-mono">{customer.mobile}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Earnings</span>
                    <span className="font-bold text-green-600">₹{customer.totalCommission.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Customer Details Profile Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm h-fit space-y-6">
          {selectedCustomer ? (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-[#0F172A]">{selectedCustomer.fullName}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedCustomer.mobile}</p>
                </div>
                <button 
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50"
                >
                  <MdClose size={20} />
                </button>
              </div>

              {/* Direct hooks */}
              <div className="flex gap-2">
                <a 
                  href={`tel:${selectedCustomer.mobile}`}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#F8FAFC] border border-slate-200 text-[#0F172A] py-2.5 rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors"
                >
                  <MdPhone size={18} /> Call
                </a>
                <a 
                  href={`https://wa.me/91${selectedCustomer.mobile}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white py-2.5 rounded-xl font-bold text-sm hover:bg-[#1EBE5D] transition-colors"
                >
                  <MdOutlineWhatsapp size={18} /> WhatsApp
                </a>
              </div>

              <div className="w-full h-px bg-slate-100"></div>

              {/* Personal Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Client Profile</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between"><span className="text-slate-500">Email:</span> <span className="font-medium text-slate-700">{selectedCustomer.email || 'N/A'}</span></li>
                  <li className="flex justify-between"><span className="text-slate-500">Location:</span> <span className="font-medium text-slate-700">{selectedCustomer.city}</span></li>
                  <li className="flex justify-between"><span className="text-slate-500">Occupation:</span> <span className="font-medium text-slate-700">{selectedCustomer.occupation}</span></li>
                </ul>
              </div>

              <div className="w-full h-px bg-slate-100"></div>

              {/* Applied Cards History */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Applied Products ({selectedCustomer.appliedProducts.length})</h4>
                {selectedCustomer.appliedProducts.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No applications processed yet.</p>
                ) : (
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {selectedCustomer.appliedProducts.map((p, i) => (
                      <div key={i} className="flex justify-between items-center text-xs p-2 bg-slate-50 border border-slate-100 rounded-lg">
                        <div>
                          <p className="font-bold text-[#0F172A]">{p.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">{new Date(p.date).toLocaleDateString()}</p>
                        </div>
                        <span className="font-bold text-green-600">₹{p.commission}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="w-full h-px bg-slate-100"></div>

              {/* Notes */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Remarks / Notes</h4>
                <div className="text-xs text-slate-600 bg-amber-50/50 border border-amber-100 p-3 rounded-xl leading-relaxed">
                  {selectedCustomer.notes || 'No remarks added yet. Update client timeline details.'}
                </div>
              </div>

            </div>
          ) : (
            <div className="py-20 text-center text-slate-400">
              <MdInfoOutline size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-bold text-[#0F172A]">Profile Viewer</p>
              <p className="text-xs text-slate-400 mt-1">Select any customer from the roster list to review details.</p>
            </div>
          )}
        </div>

      </div>

      {/* Add Onboard Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-[#0F172A]">Onboard Customer Profile</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleAddCustomerSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Full Name *</label>
                  <input type="text" required value={form.fullName} onChange={handleInputChange('fullName')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5CAB]/20" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Mobile Number *</label>
                  <input type="tel" required maxLength={10} value={form.mobile} onChange={handleInputChange('mobile')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5CAB]/20" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Email Address</label>
                  <input type="email" value={form.email} onChange={handleInputChange('email')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5CAB]/20" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">PAN Card Number</label>
                  <input type="text" maxLength={10} placeholder="ABCDE1234F" value={form.panNumber} onChange={handleInputChange('panNumber')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5CAB]/20 font-mono uppercase" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">City</label>
                  <input type="text" value={form.city} onChange={handleInputChange('city')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5CAB]/20" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">State</label>
                  <input type="text" value={form.state} onChange={handleInputChange('state')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5CAB]/20" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">Remarks / Note</label>
                <textarea rows={3} value={form.notes} onChange={handleInputChange('notes')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5CAB]/20" placeholder="Add custom background or notes for lead follow-ups..."></textarea>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-[#0D5CAB] text-white py-3 rounded-xl font-bold hover:bg-[#083E7A] transition-colors">Create Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
