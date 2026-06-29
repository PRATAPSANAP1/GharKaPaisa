import React, { useState } from 'react';
import { 
  MdFlight, MdHotel, MdDirectionsBus, MdTrain, 
  MdSmartphone, MdTv, MdFlashOn, MdLocalAtm, 
  MdAssignmentTurnedIn, MdHistory 
} from 'react-icons/md';

const SERVICES = [
  { id: 'flights', label: 'Flight Booking', icon: MdFlight },
  { id: 'hotels', label: 'Hotel Booking', icon: MdHotel },
  { id: 'bus', label: 'Bus Booking', icon: MdDirectionsBus },
  { id: 'train', label: 'Train Booking', icon: MdTrain }
];

const UTILITIES = [
  { id: 'recharge', label: 'Mobile Recharge', icon: MdSmartphone },
  { id: 'dth', label: 'DTH Recharge', icon: MdTv },
  { id: 'electricity', label: 'Electricity Bill', icon: MdFlashOn },
  { id: 'fastag', label: 'FASTag Recharge', icon: MdLocalAtm }
];

export default function TravelUtilitiesPage() {
  const [activeTab, setActiveTab] = useState('flights');
  const [transactions, setTransactions] = useState([
    { id: 'TXN-0931', service: 'Mobile Recharge', customer: '9823012930', amount: '₹299', date: '23/06/2026', status: 'Success', commission: '₹4.50' }
  ]);

  // Form states
  const [form, setForm] = useState({ field1: '', field2: '', amount: '' });

  const handleServiceSubmit = (e) => {
    e.preventDefault();
    if (!form.field1 || !form.amount) return alert('Please enter required details.');

    const newTxn = {
      id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
      service: activeTab.toUpperCase(),
      customer: form.field1,
      amount: `₹${form.amount}`,
      date: new Date().toLocaleDateString(),
      status: 'Success',
      commission: `₹${(parseFloat(form.amount) * 0.015).toFixed(2)}` // 1.5% commission
    };

    setTransactions([newTxn, ...transactions]);
    setForm({ field1: '', field2: '', amount: '' });
    alert('Transaction processed successfully! Commission credited to wallet.');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      
      {/* Title */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-bold text-[#0F172A] flex items-center gap-2">
          <MdFlight className="text-[#0D5CAB]" /> Travel & Utility Services
        </h2>
        <p className="text-[#64748B] text-sm mt-1">Book travel tickets or process bills for clients to earn instant margin payouts.</p>
      </div>

      {/* Grid of travel and utility recharges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form and selectors */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            
            {/* Travel Services Menu */}
            <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-wrap gap-2">
              {[...SERVICES, ...UTILITIES].map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button 
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setForm({ field1: '', field2: '', amount: '' }); }}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${isActive ? 'bg-[#0D5CAB] text-white shadow-sm' : 'bg-white border border-slate-200 text-[#334155] hover:bg-slate-50'}`}
                  >
                    <Icon size={16} /> {item.label}
                  </button>
                );
              })}
            </div>

            {/* Service Form */}
            <form onSubmit={handleServiceSubmit} className="p-6 space-y-4">
              <h3 className="text-md font-bold text-[#0F172A] uppercase tracking-wide">
                {activeTab.replace('_', ' ').toUpperCase()} Form
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">
                    {activeTab === 'flights' || activeTab === 'hotels' ? 'Traveler Name / Hotel City' : 
                     activeTab === 'recharge' || activeTab === 'dth' ? 'Mobile / Customer ID' : 
                     activeTab === 'electricity' ? 'Consumer Number' : 'FASTag Vehicle Number'} *
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={form.field1} 
                    onChange={e => setForm({ ...form, field1: e.target.value })} 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5CAB]/20" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">
                    {activeTab === 'flights' ? 'Destination Code' : 
                     activeTab === 'recharge' || activeTab === 'dth' ? 'Operator / Circle' : 
                     activeTab === 'electricity' ? 'State Electricity Board' : 'Optional details'}
                  </label>
                  <input 
                    type="text" 
                    value={form.field2} 
                    onChange={e => setForm({ ...form, field2: e.target.value })} 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5CAB]/20" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">Transaction Amount (₹) *</label>
                <input 
                  type="number" 
                  required 
                  value={form.amount} 
                  onChange={e => setForm({ ...form, amount: e.target.value })} 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5CAB]/20" 
                />
              </div>

              <button type="submit" className="bg-[#0D5CAB] hover:bg-[#083E7A] text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all">
                Submit Transaction
              </button>
            </form>

          </div>
        </div>

        {/* Right: History & Ledger */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit space-y-6">
          <h3 className="text-lg font-bold text-[#0F172A] border-b border-slate-100 pb-3 flex items-center gap-2">
            <MdHistory /> Utility Ledger
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total volume</span>
                <span className="text-lg font-bold text-[#0F172A]">₹{transactions.reduce((acc, t) => acc + parseInt(t.amount.replace('₹', '')), 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Commission</span>
                <span className="text-lg font-bold text-green-600">₹{transactions.reduce((acc, t) => acc + parseFloat(t.commission.replace('₹', '')), 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {transactions.map(t => (
                <div key={t.id} className="text-xs p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center">
                  <div>
                    <span className="font-bold text-[#0F172A]">{t.service}</span>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{t.id} • {t.date}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-[#0F172A]">{t.amount}</span>
                    <p className="text-[10px] text-green-600 font-bold mt-0.5">+{t.commission}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
