import React, { useState } from 'react';
import { 
  MdFolderSpecial, MdPictureAsPdf, MdDownload, 
  MdVisibility, MdVerifiedUser, MdOutlineInsertDriveFile
} from 'react-icons/md';

const DOCUMENTS = [
  { id: 'doc1', title: 'Partner ID Card', type: 'PDF', size: '2.4 MB', date: '2026-06-15', category: 'Identity', verified: true },
  { id: 'doc2', title: 'Authorized Channel Partner Certificate', type: 'PDF', size: '1.1 MB', date: '2026-06-15', category: 'Certificate', verified: true },
  { id: 'doc3', title: 'Master Service Agreement', type: 'PDF', size: '5.6 MB', date: '2026-06-14', category: 'Legal', verified: true },
  { id: 'doc4', title: 'Commission Slab Chart (Q3 2026)', type: 'PDF', size: '800 KB', date: '2026-06-01', category: 'Resource', verified: false },
  { id: 'doc5', title: 'Cancelled Cheque (Bank Proof)', type: 'JPG', size: '1.2 MB', date: '2026-06-14', category: 'KYC', verified: true },
  { id: 'doc6', title: 'Aadhaar Card Copy', type: 'PDF', size: '3.1 MB', date: '2026-06-14', category: 'KYC', verified: true },
  { id: 'doc7', title: 'PAN Card Copy', type: 'JPG', size: '900 KB', date: '2026-06-14', category: 'KYC', verified: true },
];

export default function PartnerVault() {
  const [filter, setFilter] = useState('All');
  
  const categories = ['All', ...new Set(DOCUMENTS.map(d => d.category))];

  const filteredDocs = filter === 'All' ? DOCUMENTS : DOCUMENTS.filter(d => d.category === filter);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#0D5CAB]/10 text-[#0D5CAB] rounded-full flex items-center justify-center">
              <MdFolderSpecial size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#0F172A]">Document Vault</h2>
              <p className="text-[#64748B] font-medium mt-1">Securely access your KYC documents, agreements, and certificates.</p>
            </div>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${
                  filter === cat ? 'bg-[#0D5CAB] text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredDocs.map(doc => (
          <div key={doc.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md hover:border-[#0D5CAB]/30 transition-all flex flex-col group">
            
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center">
                {doc.type === 'PDF' ? <MdPictureAsPdf size={24} /> : <MdOutlineInsertDriveFile size={24} className="text-blue-500" />}
              </div>
              {doc.verified && (
                <span className="text-[#25D366]" title="Verified Document">
                  <MdVerifiedUser size={20} />
                </span>
              )}
            </div>

            <h3 className="font-bold text-[#0F172A] mb-1 group-hover:text-[#0D5CAB] transition-colors line-clamp-2">
              {doc.title}
            </h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2 mt-auto">
              {doc.type} • {doc.size}
            </p>

            <div className="flex gap-2 pt-4 border-t border-slate-100 mt-auto">
              <button className="flex-1 flex justify-center items-center gap-1.5 py-2.5 bg-slate-50 text-slate-600 hover:text-[#0F172A] hover:bg-slate-100 rounded-xl text-sm font-bold transition-colors">
                <MdVisibility size={18} /> View
              </button>
              <button className="flex-1 flex justify-center items-center gap-1.5 py-2.5 bg-[#0D5CAB] text-white rounded-xl text-sm font-bold shadow-sm hover:bg-[#083E7A] transition-colors">
                <MdDownload size={18} /> Download
              </button>
            </div>

          </div>
        ))}

        {/* Upload Placeholder */}
        <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-100 hover:border-[#0D5CAB]/50 transition-all min-h-[200px]">
          <div className="w-12 h-12 bg-white shadow-sm text-slate-400 rounded-full flex items-center justify-center mb-3">
            <MdAdd size={24} />
          </div>
          <h3 className="font-bold text-[#0F172A] mb-1">Upload Document</h3>
          <p className="text-xs text-slate-500 max-w-[200px]">Only JPG, PNG, or PDF formats are allowed. Max 5MB.</p>
        </div>
      </div>
    </div>
  );
}

// Temporary internal component due to missing import from standard icons
function MdAdd({size}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  )
}
