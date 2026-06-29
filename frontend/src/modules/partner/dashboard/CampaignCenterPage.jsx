import React from 'react';
import { MdShare, MdContentCopy, MdOutlineWhatsapp, MdFileDownload, MdCampaign } from 'react-icons/md';

const CAMPAIGNS = [
  {
    id: 'hdfc-millennia',
    title: 'HDFC Millennia Special Campaign',
    commission: '₹2,500 Payout',
    validity: 'Offer valid till 30 June',
    text: 'Apply for HDFC Millennia Credit Card today and enjoy 5% cashback on Amazon, Flipkart, Myntra, Swiggy & Zomato! 100% digital KYC process. Apply now using my link: ',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=60'
  },
  {
    id: 'sbi-cashback',
    title: 'SBI Cashback Card Bonanza',
    commission: '₹2,200 Payout',
    validity: 'Offer valid till 15 July',
    text: 'Get flat 5% cashback on all online purchases with no merchant restrictions! Secure your SBI Cashback Credit Card now. Contact me or apply directly at: ',
    image: 'https://images.unsplash.com/photo-1589758438368-0ad531db3366?w=600&auto=format&fit=crop&q=60'
  },
  {
    id: 'personal-loan',
    title: 'Festive Loans Campaign',
    commission: '2.5% Payout on Disbursal',
    validity: 'Offer valid till 31 August',
    text: 'Need funds for marriage, home renovation, or education? Get personal loans from leading banks starting at 10.49% ROI. Minimal documents, fast disbursal! Check eligibility: ',
    image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&auto=format&fit=crop&q=60'
  }
];

export default function CampaignCenterPage() {
  const handleCopyText = (campaign) => {
    const fullText = `${campaign.text}https://gharkapaisa.in/category/credit_card`;
    navigator.clipboard.writeText(fullText);
    alert('Marketing copy text copied to clipboard!');
  };

  const handleWhatsAppShare = (campaign) => {
    const fullText = encodeURIComponent(`${campaign.text}https://gharkapaisa.in/category/credit_card`);
    window.open(`https://api.whatsapp.com/send?text=${fullText}`, '_blank');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      
      {/* Title */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-bold text-[#0F172A] flex items-center gap-2">
          <MdCampaign className="text-[#0D5CAB]" /> Campaign Marketing Center
        </h2>
        <p className="text-[#64748B] text-sm mt-1">Acquire ready-to-share posters, banners, and personalized WhatsApp scripts to attract customer leads.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CAMPAIGNS.map(camp => (
          <div key={camp.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              {/* Promo Banner Photo */}
              <div className="h-44 bg-slate-100 overflow-hidden relative border-b border-slate-100">
                <img src={camp.image} alt={camp.title} className="w-full h-full object-cover" />
                <span className="absolute top-4 left-4 bg-green-500 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-sm">
                  {camp.commission}
                </span>
              </div>

              {/* Promo Text Details */}
              <div className="p-5 space-y-3">
                <h3 className="text-lg font-bold text-[#0F172A]">{camp.title}</h3>
                <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-md font-bold uppercase inline-block">
                  {camp.validity}
                </span>
                <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl leading-relaxed border border-slate-100">
                  "{camp.text}..."
                </p>
              </div>
            </div>

            {/* Campaign Actions */}
            <div className="p-5 border-t border-slate-100 flex gap-2">
              <button 
                onClick={() => handleCopyText(camp)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-100 text-[#334155] border border-slate-200 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                <MdContentCopy /> Copy text
              </button>
              <button 
                onClick={() => handleWhatsAppShare(camp)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#25D366] text-white text-xs font-bold rounded-xl hover:bg-[#1EBE5D] transition-colors"
              >
                <MdOutlineWhatsapp /> WhatsApp
              </button>
              <button 
                onClick={() => alert("Post flyer poster downloaded!")}
                className="px-3 py-2.5 bg-white border border-slate-200 text-[#0F172A] rounded-xl hover:bg-slate-50"
                title="Download Poster"
              >
                <MdFileDownload size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
