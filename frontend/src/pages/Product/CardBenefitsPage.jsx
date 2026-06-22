import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCardDetails } from '../../components/Home/CreditCards/CardDetailsData';
import { 
  FaArrowLeft, FaWhatsapp, FaGift, FaCheckCircle, 
  FaRegFileAlt, FaVideo, FaInfoCircle, FaChevronDown, FaChevronUp 
} from 'react-icons/fa';

export default function CardBenefitsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  // Format the name slightly if it's a fallback ID
  const defaultName = id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + ' Card';
  const cardInfo = getCardDetails(id, defaultName);
  
  const [openFaq, setOpenFaq] = useState(null);

  const handleWhatsAppShare = () => {
    const refLink = `gharkapaisa.com/card/${id}?ref=GP12345`;
    const shareText = `Apply for the ${cardInfo.name} through GharKaPaisa! Check it out here: ${refLink}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleApply = () => {
    // Navigate to a generic apply flow or product flow
    // In actual implementation, we might navigate to the apply form
    alert(`Redirecting to apply for ${cardInfo.name}`);
  };

  if (!cardInfo) {
    return <div className="text-center p-12">Card not found.</div>;
  }

  const { specialOffers, features, eligibility, trainingVideoUrl, howItWorks, termsAndConditions, faqs } = cardInfo;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      
      {/* Header Bar */}
      <div className="bg-white sticky top-0 z-50 border-b border-slate-200 shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-slate-600 hover:text-slate-900">
            <FaArrowLeft size={20} />
          </button>
          <h1 className="font-bold text-lg text-slate-800 m-0 truncate" style={{ maxWidth: '200px' }}>
            {cardInfo.name}
          </h1>
        </div>
        <button 
          onClick={handleWhatsAppShare}
          className="flex items-center gap-2 bg-[#25D366] text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-[#1DA851] transition-colors"
          style={{ border: 'none', cursor: 'pointer' }}
        >
          <FaWhatsapp size={16} />
          Share
        </button>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-6 mt-4">

        {/* Special Offer Header Box */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <FaGift size={100} />
          </div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FaGift /> Special Offer
          </h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
              <div className="text-xs font-semibold text-blue-200 uppercase tracking-wider mb-1">Total Earning</div>
              <div className="text-2xl font-bold text-green-300">{specialOffers?.totalEarning || "N/A"}</div>
            </div>
            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
              <div className="text-xs font-semibold text-blue-200 uppercase tracking-wider mb-1">Card Approval & Dispatch</div>
              <div className="text-2xl font-bold text-white">{specialOffers?.cardApprovalDispatch || "N/A"}</div>
            </div>
          </div>

          {specialOffers?.dateOffer && (
            <div className="bg-yellow-500/20 border border-yellow-400/50 p-4 rounded-xl relative z-10">
              <h3 className="font-bold text-yellow-300 mb-2">{specialOffers.dateOffer.title}</h3>
              <p className="text-sm m-0 leading-relaxed text-yellow-50">{specialOffers.dateOffer.details}</p>
            </div>
          )}
        </div>

        {/* Benefits & Features */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
            <FaCheckCircle className="text-blue-600" /> Benefits & Features
          </h2>
          <ul className="space-y-3 m-0 p-0 list-none">
            {features?.map((f, idx) => (
              <li key={idx} className="flex items-start gap-3 text-slate-700 text-sm leading-relaxed">
                <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Whom to Refer / Eligibility */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
            <FaInfoCircle className="text-blue-600" /> Whom to Refer & Eligibility
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed mb-4">{eligibility?.criteria}</p>
          
          <h3 className="font-bold text-slate-800 text-sm mb-3">Documents Required:</h3>
          <div className="flex flex-wrap gap-2">
            {eligibility?.documentsRequired?.map((doc, idx) => (
              <span key={idx} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-100 flex items-center gap-1.5">
                <FaRegFileAlt /> {doc}
              </span>
            ))}
          </div>
        </div>

        {/* Training Video */}
        {trainingVideoUrl && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <FaVideo className="text-red-500" /> Training Video
            </h2>
            <div className="aspect-video bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative">
              {trainingVideoUrl ? (
                <iframe 
                  width="100%" 
                  height="100%" 
                  src={trainingVideoUrl} 
                  title="Training Video" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 flex-col gap-2">
                  <FaVideo size={32} />
                  <span className="text-sm font-medium">Video Coming Soon</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* How it Works */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">How it works?</h2>
          <div className="space-y-4">
            {howItWorks?.map((step, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="text-sm text-slate-700 pt-1 leading-relaxed">
                  {step}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQs */}
        {faqs && faqs.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">FAQ's</h2>
            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden">
                  <button 
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left font-semibold text-sm text-slate-800"
                  >
                    {faq.q}
                    {openFaq === idx ? <FaChevronUp className="text-slate-400" /> : <FaChevronDown className="text-slate-400" />}
                  </button>
                  {openFaq === idx && (
                    <div className="p-4 bg-white text-sm text-slate-600 border-t border-slate-100 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* T&C */}
        <div className="bg-slate-100 rounded-2xl p-5 border border-slate-200">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Terms & Conditions</h2>
          <p className="text-xs text-slate-600 leading-relaxed m-0">
            {termsAndConditions}
          </p>
        </div>

      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-40">
        <div className="max-w-3xl mx-auto flex gap-3">
          <button 
            onClick={handleApply}
            className="flex-1 bg-blue-700 text-white rounded-xl py-3 font-bold shadow-lg hover:bg-blue-800 transition-colors"
            style={{ border: 'none', cursor: 'pointer' }}
          >
            Apply Now
          </button>
        </div>
      </div>
      
    </div>
  );
}
