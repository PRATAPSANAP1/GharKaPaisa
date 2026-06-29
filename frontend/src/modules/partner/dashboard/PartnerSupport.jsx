import React, { useState } from 'react';
import { 
  MdSupportAgent, MdAdd, MdSearch, MdFilterList, 
  MdCheckCircle, MdPendingActions, MdClose, MdSend,
  MdOutlineForum
} from 'react-icons/md';

const MOCK_TICKETS = [
  { id: 'TKT-1029', subject: 'Commission not credited for Lead #APP-592', status: 'open', priority: 'high', date: '2026-06-22', messages: [{ sender: 'partner', text: 'Hi, the lead was disbursed 3 days ago but wallet is not updated.' }, { sender: 'support', text: 'We are checking with the accounts team. Please allow 24 hours.' }] },
  { id: 'TKT-1015', subject: 'Unable to download ID Card', status: 'closed', priority: 'low', date: '2026-06-15', messages: [{ sender: 'partner', text: 'Where can I find my ID card?' }, { sender: 'support', text: 'It is available in the Document Vault section now.' }] },
  { id: 'TKT-0988', subject: 'Change bank account details', status: 'resolved', priority: 'medium', date: '2026-06-02', messages: [{ sender: 'partner', text: 'I want to change my payout bank to ICICI.' }, { sender: 'support', text: 'Bank details updated successfully as requested.' }] },
];

export default function PartnerSupport() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [replyText, setReplyText] = useState('');

  const filteredTickets = MOCK_TICKETS.filter(t => {
    const matchSearch = t.subject.toLowerCase().includes(searchTerm.toLowerCase()) || t.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTab = activeTab === 'all' || t.status === activeTab || (activeTab === 'resolved' && t.status === 'closed');
    return matchSearch && matchTab;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'open': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'resolved':
      case 'closed': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto h-[calc(100vh-8rem)] pb-6">
      
      {/* Left Column: Ticket List */}
      <div className="w-full lg:w-1/3 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden shrink-0">
        <div className="p-5 border-b border-slate-100 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
              <MdSupportAgent className="text-[#0D5CAB]" /> Helpdesk
            </h2>
            <button 
              onClick={() => setIsNewTicketModalOpen(true)}
              className="bg-[#0D5CAB] hover:bg-[#083E7A] text-white p-2 rounded-xl shadow-sm transition-colors"
              title="Create New Ticket"
            >
              <MdAdd size={20} />
            </button>
          </div>
          
          <div className="relative">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search ticket ID or subject..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5CAB]/20 focus:border-[#0D5CAB] text-sm font-medium"
            />
          </div>

          <div className="flex gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <button onClick={() => setActiveTab('all')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${activeTab === 'all' ? 'bg-white text-[#0D5CAB] shadow-sm' : 'text-slate-500'}`}>All</button>
            <button onClick={() => setActiveTab('open')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${activeTab === 'open' ? 'bg-white text-[#0D5CAB] shadow-sm' : 'text-slate-500'}`}>Open</button>
            <button onClick={() => setActiveTab('resolved')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${activeTab === 'resolved' ? 'bg-white text-[#0D5CAB] shadow-sm' : 'text-slate-500'}`}>Closed</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-10 px-4 text-slate-500">
              <MdOutlineForum className="mx-auto text-4xl text-slate-300 mb-2" />
              <p className="font-medium">No tickets found.</p>
            </div>
          ) : (
            filteredTickets.map(tkt => (
              <div 
                key={tkt.id}
                onClick={() => setSelectedTicket(tkt)}
                className={`p-4 rounded-xl cursor-pointer border transition-all ${
                  selectedTicket?.id === tkt.id 
                  ? 'bg-blue-50 border-[#0D5CAB]/30 shadow-sm' 
                  : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-mono font-bold text-slate-500">{tkt.id}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusColor(tkt.status)}`}>
                    {tkt.status}
                  </span>
                </div>
                <h4 className="font-bold text-[#0F172A] text-sm line-clamp-2">{tkt.subject}</h4>
                <p className="text-xs text-slate-400 mt-2 font-medium">{tkt.date}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Column: Ticket Detail View */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full relative">
        {selectedTicket ? (
          <>
            {/* Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-start shrink-0">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-lg font-bold text-[#0F172A]">{selectedTicket.subject}</h2>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusColor(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                </div>
                <p className="text-sm font-mono text-slate-500">{selectedTicket.id} • Created on {selectedTicket.date}</p>
              </div>
              <button className="text-slate-400 hover:text-[#0F172A] p-2 bg-white rounded-xl shadow-sm border border-slate-200 transition-colors">
                <MdCheckCircle size={20} title="Mark as Resolved" />
              </button>
            </div>

            {/* Chat Thread */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/50">
              {selectedTicket.messages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.sender === 'partner' ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {msg.sender === 'partner' ? 'You' : 'Support Team'}
                    </span>
                  </div>
                  <div className={`p-4 rounded-2xl max-w-[80%] text-sm shadow-sm ${
                    msg.sender === 'partner' 
                    ? 'bg-[#0D5CAB] text-white rounded-tr-sm' 
                    : 'bg-white border border-slate-200 text-[#0F172A] rounded-tl-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Box */}
            {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' ? (
              <div className="p-4 border-t border-slate-200 bg-white shrink-0">
                <div className="relative">
                  <textarea 
                    rows="3"
                    placeholder="Type your reply here..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full p-4 pr-14 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5CAB]/20 focus:border-[#0D5CAB] resize-none text-sm font-medium"
                  ></textarea>
                  <button 
                    className="absolute right-3 bottom-3 p-2 bg-[#0D5CAB] text-white rounded-lg shadow-sm hover:bg-[#083E7A] transition-colors disabled:opacity-50"
                    disabled={!replyText.trim()}
                  >
                    <MdSend size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 border-t border-slate-200 bg-slate-50 text-center text-sm font-bold text-slate-400 shrink-0">
                This ticket has been resolved and is closed to new replies.
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50 text-center p-6">
            <div className="w-20 h-20 bg-white border border-slate-200 text-slate-300 rounded-full flex items-center justify-center mb-4 shadow-sm">
              <MdSupportAgent size={40} />
            </div>
            <h2 className="text-xl font-bold text-[#0F172A] mb-2">How can we help?</h2>
            <p className="text-slate-500 max-w-sm">Select a ticket from the left to view the conversation, or create a new ticket to get assistance from our team.</p>
          </div>
        )}
      </div>

      {/* New Ticket Modal */}
      {isNewTicketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-[#0F172A]">Create New Ticket</h3>
              <button onClick={() => setIsNewTicketModalOpen(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-slate-200 rounded-full transition-colors">
                <MdClose size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#334155] mb-1.5">Category *</label>
                <select className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5CAB]/20 focus:border-[#0D5CAB] font-medium">
                  <option>Commission & Payouts</option>
                  <option>Lead Status & Tracking</option>
                  <option>KYC & Profile Update</option>
                  <option>Technical Issue</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#334155] mb-1.5">Subject *</label>
                <input type="text" placeholder="Brief summary of the issue" className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5CAB]/20 focus:border-[#0D5CAB] font-medium" />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#334155] mb-1.5">Description *</label>
                <textarea rows="4" placeholder="Provide details about your issue..." className="w-full p-4 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5CAB]/20 focus:border-[#0D5CAB] font-medium resize-none"></textarea>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-3">
              <button onClick={() => setIsNewTicketModalOpen(false)} className="flex-1 py-3 rounded-xl font-bold text-[#64748B] bg-white border border-slate-200 hover:bg-slate-100 transition-colors">
                Cancel
              </button>
              <button onClick={() => setIsNewTicketModalOpen(false)} className="flex-[2] py-3 bg-[#0D5CAB] text-white rounded-xl font-bold shadow-md hover:bg-[#083E7A] transition-colors">
                Submit Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
