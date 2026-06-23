import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCardDetails } from '../../components/Home/CreditCards/CardDetailsData';
import { 
  FaArrowLeft, FaWhatsapp, FaGift, FaCheckCircle, 
  FaRegFileAlt, FaVideo, FaInfoCircle, FaChevronDown, FaChevronUp,
  FaRupeeSign
} from 'react-icons/fa';
import './CardBenefitsPage.css';

export default function CardBenefitsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  // Format the name slightly if it's a fallback ID
  const defaultName = id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + ' Card';
  const cardInfo = getCardDetails(id, defaultName);
  
  const [openFaq, setOpenFaq] = useState(null);

  const handleWhatsAppShare = () => {
    const refLink = `gharkapaisa.com/card-benefits/${id}?ref=GP12345`;
    const shareText = `Apply for the ${cardInfo.name} through GharKaPaisa! Check it out here: ${refLink}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleApply = () => {
    // Navigate to a generic apply flow or product flow
    alert(`Redirecting to apply for ${cardInfo.name}`);
  };

  if (!cardInfo) {
    return <div className="text-center p-12 font-bold text-gray-500">Product not found.</div>;
  }

  const { specialOffers, features, eligibility, trainingVideoUrl, howItWorks, termsAndConditions, faqs } = cardInfo;

  return (
    <div className="cbp-container">
      
      {/* Premium Header */}
      <div className="cbp-header">
        <button onClick={() => navigate(-1)} className="cbp-back-btn" aria-label="Go Back">
          <FaArrowLeft size={18} />
        </button>
        <h1 className="cbp-header-title">Product Details</h1>
        <button onClick={handleWhatsAppShare} className="cbp-share-btn">
          <FaWhatsapp size={18} />
          <span>Share</span>
        </button>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        {/* Hero Section */}
        <div className="cbp-hero">
          <h2 className="cbp-hero-title">{cardInfo.name}</h2>
          <p className="cbp-hero-subtitle">Exclusive benefits and high reward earnings</p>
          
          <div className="cbp-glass-grid">
            <div className="cbp-glass-card">
              <div className="cbp-glass-label">Total Earning</div>
              <div className="cbp-glass-value highlight">{specialOffers?.totalEarning || "N/A"}</div>
            </div>
            <div className="cbp-glass-card">
              <div className="cbp-glass-label">Approval & Dispatch</div>
              <div className="cbp-glass-value">{specialOffers?.cardApprovalDispatch || "N/A"}</div>
            </div>
          </div>

          {specialOffers?.dateOffer && (
            <div className="cbp-date-offer">
              <div className="cbp-date-offer-title">
                <FaGift size={16} /> {specialOffers.dateOffer.title}
              </div>
              <div className="cbp-date-offer-text">{specialOffers.dateOffer.details}</div>
            </div>
          )}
        </div>

        {/* Benefits & Features */}
        <div className="cbp-section">
          <div className="cbp-section-header">
            <div className="cbp-section-icon blue"><FaCheckCircle size={18} /></div>
            <h3 className="cbp-section-title">Benefits & Features</h3>
          </div>
          <ul className="cbp-feature-list">
            {features?.map((f, idx) => (
              <li key={idx} className="cbp-feature-item">
                <FaCheckCircle className="cbp-feature-check" />
                <span className="cbp-feature-text">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Whom to Refer / Eligibility */}
        <div className="cbp-section">
          <div className="cbp-section-header">
            <div className="cbp-section-icon purple"><FaInfoCircle size={18} /></div>
            <h3 className="cbp-section-title">Eligibility & Documents</h3>
          </div>
          <p className="cbp-feature-text" style={{ marginBottom: '16px' }}>{eligibility?.criteria}</p>
          
          <div className="cbp-glass-label" style={{ color: '#64748b', fontSize: '0.8rem' }}>Required Documents</div>
          <div className="cbp-tag-container">
            {eligibility?.documentsRequired?.map((doc, idx) => (
              <span key={idx} className="cbp-tag">
                <FaRegFileAlt className="text-slate-400" /> {doc}
              </span>
            ))}
          </div>
        </div>

        {/* Training Video */}
        {trainingVideoUrl && (
          <div className="cbp-section">
            <div className="cbp-section-header">
              <div className="cbp-section-icon red"><FaVideo size={18} /></div>
              <h3 className="cbp-section-title">Training Video</h3>
            </div>
            <div style={{ aspectRatio: '16/9', background: '#f1f5f9', borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>
              <iframe 
                width="100%" 
                height="100%" 
                src={trainingVideoUrl} 
                title="Training Video" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              ></iframe>
            </div>
          </div>
        )}

        {/* How it Works */}
        <div className="cbp-section">
          <div className="cbp-section-header">
            <div className="cbp-section-icon green"><FaRupeeSign size={16} /></div>
            <h3 className="cbp-section-title">How It Works</h3>
          </div>
          <div style={{ paddingLeft: '8px' }}>
            {howItWorks?.map((step, idx) => (
              <div key={idx} className="cbp-step">
                <div className="cbp-step-number">{idx + 1}</div>
                <div className="cbp-step-text">{step}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQs */}
        {faqs && faqs.length > 0 && (
          <div className="cbp-section">
            <div className="cbp-section-header" style={{ marginBottom: '16px' }}>
              <h3 className="cbp-section-title">Frequently Asked Questions</h3>
            </div>
            <div>
              {faqs.map((faq, idx) => (
                <div key={idx} className={`cbp-faq-item ${openFaq === idx ? 'active' : ''}`}>
                  <button 
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="cbp-faq-btn"
                  >
                    {faq.q}
                    <FaChevronDown className="cbp-faq-icon" />
                  </button>
                  {openFaq === idx && (
                    <div className="cbp-faq-answer">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* T&C */}
        <div className="cbp-section" style={{ background: 'transparent', boxShadow: 'none', border: 'none', padding: '0 16px', marginBottom: '80px' }}>
          <div className="cbp-glass-label" style={{ color: '#94a3b8' }}>Terms & Conditions</div>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.6', margin: 0 }}>
            {termsAndConditions}
          </p>
        </div>

      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="cbp-footer">
        <button onClick={handleApply} className="cbp-apply-btn">
          Apply Now
        </button>
      </div>
      
    </div>
  );
}
