import React, { useState } from 'react';
import { 
  MdPlayCircleOutline, MdOutlineMenuBook, MdCheckCircle, 
  MdAccessTime, MdStar, MdPlayArrow
} from 'react-icons/md';

const MODULES = [
  { id: 't1', title: 'Welcome to GharKaPaisa', type: 'Video', duration: '5:30', category: 'Onboarding', status: 'completed' },
  { id: 't2', title: 'How to use the Partner Dashboard', type: 'Video', duration: '12:45', category: 'Platform Guide', status: 'completed' },
  { id: 't3', title: 'Mastering the Customer CRM', type: 'Video', duration: '8:20', category: 'Platform Guide', status: 'in_progress' },
  { id: 't4', title: 'Understanding Credit Card Categories', type: 'Article', duration: '10 min read', category: 'Product Knowledge', status: 'not_started' },
  { id: 't5', title: 'Pitching Personal Loans effectively', type: 'Video', duration: '15:00', category: 'Sales Training', status: 'not_started' },
  { id: 't6', title: 'Compliance & RBI Guidelines', type: 'Article', duration: '20 min read', category: 'Legal', status: 'not_started' },
];

export default function PartnerTraining() {
  const [activeModule, setActiveModule] = useState(MODULES[2]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto pb-10">
      
      {/* Left Column: Player & Active Content */}
      <div className="w-full lg:w-2/3 space-y-6 shrink-0">
        
        {/* Video Player Placeholder */}
        <div className="bg-black rounded-2xl aspect-video relative overflow-hidden flex items-center justify-center shadow-lg group cursor-pointer border border-slate-800">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
          
          {activeModule.type === 'Video' ? (
            <div className="w-20 h-20 bg-[#0D5CAB]/90 hover:bg-[#0EA5E9] text-white rounded-full flex items-center justify-center transition-all transform group-hover:scale-110 shadow-[0_0_30px_rgba(13,92,171,0.5)] z-10">
              <MdPlayArrow size={40} className="ml-2" />
            </div>
          ) : (
            <div className="w-20 h-20 bg-white/10 text-white rounded-full flex items-center justify-center backdrop-blur-sm z-10 border border-white/20">
              <MdOutlineMenuBook size={40} />
            </div>
          )}

          <div className="absolute bottom-6 left-6 z-10 right-6">
            <span className="px-3 py-1 bg-[#0D5CAB] text-white text-[10px] font-bold uppercase tracking-wider rounded-md mb-3 inline-block">
              {activeModule.category}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-white">{activeModule.title}</h2>
          </div>
        </div>

        {/* Content Description */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex flex-wrap items-center gap-6 mb-6 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <MdAccessTime size={20} /> {activeModule.duration}
            </div>
            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <MdStar size={20} className="text-amber-400" /> 4.8 Rating
            </div>
            {activeModule.status === 'completed' && (
              <div className="flex items-center gap-2 text-green-600 font-bold ml-auto bg-green-50 px-3 py-1 rounded-lg">
                <MdCheckCircle size={20} /> Completed
              </div>
            )}
          </div>

          <h3 className="text-lg font-bold text-[#0F172A] mb-3">About this module</h3>
          <p className="text-slate-600 leading-relaxed mb-6">
            In this module, you will learn the essential skills required to maximize your earnings on GharKaPaisa. 
            We cover practical strategies, real-world examples, and common pitfalls to avoid when pitching to customers. 
            Make sure to take notes!
          </p>

          {activeModule.status !== 'completed' && (
            <button className="px-6 py-3 bg-[#0D5CAB] text-white font-bold rounded-xl shadow-sm hover:bg-[#083E7A] transition-colors">
              Mark as Completed
            </button>
          )}
        </div>
      </div>

      {/* Right Column: Playlist */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden max-h-[800px]">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h3 className="text-xl font-bold text-[#0F172A]">Training Modules</h3>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-[#25D366] w-1/3"></div>
            </div>
            <span className="text-sm font-bold text-slate-500">2/6 Completed</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {MODULES.map((mod, idx) => (
            <div 
              key={mod.id}
              onClick={() => setActiveModule(mod)}
              className={`p-4 rounded-xl cursor-pointer border transition-all flex gap-4 ${
                activeModule.id === mod.id 
                ? 'bg-blue-50 border-[#0D5CAB]/30 shadow-sm' 
                : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="shrink-0 mt-1">
                {mod.status === 'completed' ? (
                  <MdCheckCircle size={24} className="text-[#25D366]" />
                ) : mod.type === 'Video' ? (
                  <MdPlayCircleOutline size={24} className={activeModule.id === mod.id ? 'text-[#0D5CAB]' : 'text-slate-400'} />
                ) : (
                  <MdOutlineMenuBook size={24} className={activeModule.id === mod.id ? 'text-[#0D5CAB]' : 'text-slate-400'} />
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Module {idx + 1}</p>
                <h4 className={`font-bold text-sm mb-1 line-clamp-2 ${activeModule.id === mod.id ? 'text-[#0D5CAB]' : 'text-[#0F172A]'}`}>
                  {mod.title}
                </h4>
                <p className="text-xs font-medium text-slate-500">{mod.duration}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
