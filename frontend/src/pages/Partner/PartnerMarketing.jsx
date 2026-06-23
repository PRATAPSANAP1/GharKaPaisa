import React, { useState } from 'react';
import { 
  MdCampaign, MdDownload, MdShare, MdImage, 
  MdOutlineOndemandVideo, MdOutlineMenuBook
} from 'react-icons/md';

const MATERIALS = [
  { id: 'm1', title: 'HDFC Millennia WhatsApp Flyer', category: 'Credit Cards', type: 'Image', resolution: '1080x1080', url: '#' },
  { id: 'm2', title: 'SBI SimplyCLICK Insta Story', category: 'Credit Cards', type: 'Image', resolution: '1080x1920', url: '#' },
  { id: 'm3', title: 'Instant Personal Loan Banner', category: 'Loans', type: 'Image', resolution: '1200x628', url: '#' },
  { id: 'm4', title: 'Why Choose GharKaPaisa (PDF)', category: 'Brochure', type: 'Document', resolution: 'A4', url: '#' },
  { id: 'm5', title: 'Partner Recruitment Video', category: 'Recruitment', type: 'Video', resolution: '1080p', url: '#' },
  { id: 'm6', title: 'Business Loan Fest Flyer', category: 'Loans', type: 'Image', resolution: '1080x1080', url: '#' },
];

export default function PartnerMarketing() {
  const [filter, setFilter] = useState('All');
  
  const categories = ['All', 'Credit Cards', 'Loans', 'Brochure', 'Recruitment'];

  const filteredMaterials = filter === 'All' ? MATERIALS : MATERIALS.filter(m => m.category === filter);

  const getIcon = (type) => {
    switch(type) {
      case 'Image': return <MdImage size={40} className="text-[#0D5CAB]" />;
      case 'Video': return <MdOutlineOndemandVideo size={40} className="text-red-500" />;
      case 'Document': return <MdOutlineMenuBook size={40} className="text-amber-500" />;
      default: return <MdImage size={40} className="text-slate-400" />;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] rounded-2xl p-8 shadow-md text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-[#0D5CAB] opacity-20 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
              <MdCampaign size={32} className="text-[#38BDF8]" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-1">Marketing Center</h2>
              <p className="text-slate-300 font-medium max-w-lg">Download official, high-converting promotional materials to share on WhatsApp, Instagram, and Facebook.</p>
            </div>
          </div>
          <button className="whitespace-nowrap px-6 py-3 bg-[#0D5CAB] hover:bg-[#0EA5E9] text-white rounded-xl font-bold transition-colors shadow-sm">
            Request Custom Banner
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${
              filter === cat ? 'bg-[#0F172A] text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredMaterials.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden group hover:shadow-md transition-all flex flex-col">
            
            {/* Preview Area */}
            <div className="h-40 bg-slate-100 flex items-center justify-center relative overflow-hidden">
              {/* Pattern Background for aesthetic */}
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
              {getIcon(item.type)}
            </div>

            {/* Details */}
            <div className="p-5 flex-1 flex flex-col">
              <span className="text-[10px] font-bold text-[#0D5CAB] uppercase tracking-wider mb-1 bg-blue-50 self-start px-2 py-0.5 rounded">
                {item.category}
              </span>
              <h3 className="font-bold text-[#0F172A] mb-1 line-clamp-2">{item.title}</h3>
              <p className="text-xs font-medium text-slate-400 mb-4">{item.type} • {item.resolution}</p>

              <div className="flex gap-2 mt-auto pt-4 border-t border-slate-100">
                <button className="flex-1 flex justify-center items-center gap-1.5 py-2.5 bg-slate-50 text-slate-600 hover:text-[#0F172A] hover:bg-slate-100 rounded-xl text-sm font-bold transition-colors">
                  <MdShare size={18} /> Share
                </button>
                <button className="flex-1 flex justify-center items-center gap-1.5 py-2.5 bg-[#0D5CAB] text-white hover:bg-[#083E7A] rounded-xl text-sm font-bold shadow-sm transition-colors">
                  <MdDownload size={18} /> Get
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
