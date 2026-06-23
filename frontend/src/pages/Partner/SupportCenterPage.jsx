import React, { useState } from 'react';
import { 
  MdOutlineContactSupport, MdOutlineWhatsApp, MdPhone, 
  MdHelpOutline, MdKeyboardArrowDown, MdKeyboardArrowUp, MdSend 
} from 'react-icons/md';

const FAQS = [
  { q: "How long does KYC approval take?", a: "KYC approvals are processed within 24-48 hours by our compliance team after you submit your PAN Card and Cancelled Cheque copies." },
  { q: "When are referral commissions credited?", a: "Once the card is approved and dispatched by the bank, the payout commission is credited directly to your wallet within 3 working days." },
  { q: "What is the minimum withdrawal amount?", a: "The minimum amount you can withdraw from your wallet balance is ₹500. Direct UPI transfers are instantaneous, while bank transfers take 24-48 hours." },
  { q: "Why did a client lead status show rejected?", a: "Leads show rejected if the customer's credit score (CIBIL) was below the bank's minimum limit (typically 750+), or if there were discrepancies in income documents." }
];

export default function SupportCenterPage() {
  const [openFaq, setOpenFaq] = useState(null);
  
  // Ticket Form States
  const [category, setCategory] = useState('technical');
  const [description, setDescription] = useState('');
  const [ticketsList, setTicketsList] = useState([
    { id: 'TKT-9201', category: 'Commission Issue', date: '22/06/2026', status: 'In Progress' }
  ]);

  const handleSubmitTicket = (e) => {
    e.preventDefault();
    if (!description.trim()) return alert('Please enter issue details.');

    const newTicket = {
      id: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
      category: category.replace('_', ' ').toUpperCase(),
      date: new Date().toLocaleDateString(),
      status: 'Open'
    };

    setTicketsList([newTicket, ...ticketsList]);
    setDescription('');
    alert('Support ticket created successfully! You will receive updates via email/notifications.');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      
      {/* Title */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A]">Support & Help Desk</h2>
          <p className="text-[#64748B] text-sm mt-1">Submit tickets, get in touch with your Relationship Manager (RM), and browse FAQs.</p>
        </div>
        <div className="flex gap-2">
          <a 
            href="https://wa.me/918239012344" 
            target="_blank" 
            rel="noreferrer" 
            className="flex items-center gap-2 bg-[#25D366] text-white px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-[#1EBE5D] transition-colors shadow-sm"
          >
            <MdOutlineWhatsApp size={18} /> Chat RM
          </a>
          <a 
            href="tel:+918239012344" 
            className="flex items-center gap-2 bg-[#F8FAFC] border border-slate-200 text-[#334155] px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-slate-50 transition-colors shadow-sm"
          >
            <MdPhone size={18} /> Call RM
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Raise a Ticket */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-[#0F172A] border-b border-slate-100 pb-3">Raise an Issue Ticket</h3>
            
            <form onSubmit={handleSubmitTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">Issue Category *</label>
                <select 
                  value={category} 
                  onChange={e => setCategory(e.target.value)} 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5CAB]/20"
                >
                  <option value="technical">Technical Glitch / Bug</option>
                  <option value="commission">Commission Payout Mismatch</option>
                  <option value="kyc">KYC Document Upload / Verification Delay</option>
                  <option value="lead">Lead Status Discrepancies</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">Issue Description *</label>
                <textarea 
                  rows={4}
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5CAB]/20"
                  placeholder="Tell us what went wrong. Include applicant name and lead app number if relevant..."
                ></textarea>
              </div>

              <button type="submit" className="bg-[#0D5CAB] hover:bg-[#083E7A] text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-1.5">
                <MdSend /> Submit Ticket
              </button>
            </form>
          </div>

          {/* Tickets List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-md font-bold text-[#0F172A]">My Raised Tickets ({ticketsList.length})</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {ticketsList.map(t => (
                <div key={t.id} className="p-4 flex justify-between items-center text-sm">
                  <div>
                    <span className="font-mono text-[#0D5CAB] font-bold bg-blue-50 px-2 py-0.5 rounded text-xs">{t.id}</span>
                    <p className="font-bold text-[#0F172A] mt-1">{t.category}</p>
                    <span className="text-xs text-slate-400">Created: {t.date}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${t.status === 'Open' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Knowledge Base FAQ accordion */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit space-y-6">
          <h3 className="text-lg font-bold text-[#0F172A] border-b border-slate-100 pb-3 flex items-center gap-2">
            <MdHelpOutline /> Help FAQ Directory
          </h3>

          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <div key={i} className="border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex justify-between items-center text-left font-bold text-sm text-[#0F172A] hover:text-[#0D5CAB]"
                >
                  <span>{faq.q}</span>
                  {openFaq === i ? <MdKeyboardArrowUp /> : <MdKeyboardArrowDown />}
                </button>
                {openFaq === i && (
                  <p className="text-xs text-[#64748B] mt-2 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
