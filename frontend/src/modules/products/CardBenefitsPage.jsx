import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCardDetails } from '../home/components/CreditCards/CardDetailsData';
import { getApiV1Url } from '../../config/api';
import { useTheme } from '../../contexts/ThemeContext';
import CardApplyVerificationModal from '../home/components/CreditCards/CardApplyVerificationModal';
import { 
  FaArrowLeft, FaShareAlt, FaGift, FaCheckCircle, 
  FaRegFileAlt, FaVideo, FaInfoCircle, FaChevronDown, FaChevronUp,
  FaRupeeSign, FaBolt, FaStar
} from 'react-icons/fa';
import './CardBenefitsPage.css';

export default function CardBenefitsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { C } = useTheme();
  
  const [dbProduct, setDbProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`${getApiV1Url()}/products/${id}`);
        const data = await response.json();
        if (data && data.success) {
          setDbProduct(data.data);
        } else {
          // Try fetching all and matching by slug if direct fetch failed/returned 404
          const res = await fetch(`${getApiV1Url()}/products?limit=100`);
          const allData = await res.json();
          if (allData && allData.success) {
            const matched = allData.data.find(p => {
              const pClean = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
              const idClean = id.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
              return p.id.toString() === id.toString() || 
                     pClean === idClean || 
                     pClean.includes(idClean) || 
                     idClean.includes(pClean);
            });
            if (matched) {
              setDbProduct(matched);
            }
          }
        }
      } catch (err) {
        try {
          const res = await fetch(`${getApiV1Url()}/products?limit=100`);
          const allData = await res.json();
          if (allData && allData.success) {
            const matched = allData.data.find(p => {
              const pClean = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
              const idClean = id.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
              return p.id.toString() === id.toString() || 
                     pClean === idClean || 
                     pClean.includes(idClean) || 
                     idClean.includes(pClean);
            });
            if (matched) {
              setDbProduct(matched);
            }
          }
        } catch (innerErr) {
          console.error("Error matching slug:", innerErr);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const defaultName = id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + ' Card';
  const localCardDetails = getCardDetails(id, defaultName);

  const cardInfo = dbProduct ? {
    ...localCardDetails,
    name: dbProduct.name,
    specialOffers: {
      totalEarning: dbProduct.payout_details || localCardDetails.specialOffers.totalEarning,
      cardApprovalDispatch: dbProduct.time_period || localCardDetails.specialOffers.cardApprovalDispatch,
      dateOffer: localCardDetails.specialOffers.dateOffer
    },
    features: dbProduct.features ? dbProduct.features.split('|') : localCardDetails.features,
    eligibility: {
      criteria: dbProduct.eligibility || localCardDetails.eligibility.criteria,
      documentsRequired: dbProduct.documents_required ? dbProduct.documents_required.split('|') : localCardDetails.eligibility.documentsRequired
    }
  } : localCardDetails;
  
  const [activeTab, setActiveTab] = useState('offer');
  const [openFaq, setOpenFaq] = useState(null);

  const handleShare = async () => {
    const refLink = `${window.location.origin}/card-benefits/${id}?ref=GP12345`;
    const shareText = `Apply for the ${cardInfo.name} through GharKaPaisa! Check it out here:`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: cardInfo.name,
          text: shareText,
          url: refLink,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText} ${refLink}`);
        alert('Share link copied to clipboard!');
      } catch (clipErr) {
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + refLink)}`;
        window.open(url, '_blank');
      }
    }
  };

  const handleApply = () => {
    setIsApplyModalOpen(true);
  };

  if (loading) {
    return <div className="text-center p-12 font-bold text-gray-500">Loading benefits...</div>;
  }

  if (!cardInfo) {
    return <div className="text-center p-12 font-bold text-gray-500">Product not found.</div>;
  }

  const { specialOffers, features, eligibility, trainingVideoUrl, howItWorks, termsAndConditions, faqs } = cardInfo;

  const tabs = [
    { id: 'offer', label: 'Special Offer', icon: <FaGift /> },
    { id: 'benefits', label: 'Benefits', icon: <FaStar /> },
    { id: 'eligibility', label: 'Whom to Refer', icon: <FaInfoCircle /> },
    { id: 'howItWorks', label: 'How It Works', icon: <FaBolt /> },
    ...(trainingVideoUrl ? [{ id: 'video', label: 'Training Video', icon: <FaVideo /> }] : []),
    ...(faqs && faqs.length > 0 ? [{ id: 'faqs', label: "FAQ's", icon: <FaRegFileAlt /> }] : []),
    { id: 'tnc', label: 'T&C', icon: <FaRegFileAlt /> }
  ];

  return (
    <div className="cbp-container">
      
      {/* Premium Header */}
      <div className="cbp-header">
        <button onClick={() => navigate(-1)} className="cbp-back-btn" aria-label="Go Back">
          <FaArrowLeft size={16} />
        </button>
        <h1 className="cbp-header-title">Product Details</h1>
        <div className="cbp-header-actions">
          <button onClick={handleApply} className="cbp-header-apply-btn">
            Apply Now
          </button>
          <button onClick={handleShare} className="cbp-header-share-btn" aria-label="Share">
            <FaShareAlt size={16} />
            <span>Share</span>
          </button>
        </div>
      </div>

      <div className="cbp-scrollable-content">
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '24px' }}>

        {/* Hero Section */}
        <div className="cbp-hero">
          <h2 className="cbp-hero-title">{cardInfo.name}</h2>
          <p className="cbp-hero-subtitle">Unlock exclusive benefits and high rewards</p>
        </div>

        {/* Dynamic Tab Navigation */}
        <div className="cbp-tab-nav-wrapper">
          <div className="cbp-tab-nav">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`cbp-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="cbp-tab-icon">{tab.icon}</span>
                <span className="cbp-tab-label">{tab.label}</span>
                {activeTab === tab.id && <span className="cbp-tab-indicator"></span>}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content Area */}
        <div className="cbp-tab-content-container">
          
          {/* SPECIAL OFFER TAB */}
          {activeTab === 'offer' && (
            <div className="cbp-tab-pane slide-up">
              <h3 className="cbp-pane-title">Current Offers</h3>
              <div className="cbp-glass-grid" style={{ marginBottom: '16px', gridTemplateColumns: '1fr', maxWidth: '280px', margin: '0 auto 16px auto' }}>
                <div className="cbp-glass-card-dark" style={{ textAlign: 'center' }}>
                  <div className="cbp-glass-label">Total Earning</div>
                  <div className="cbp-glass-value highlight">{specialOffers?.totalEarning || "N/A"}</div>
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
          )}

          {/* BENEFITS TAB */}
          {activeTab === 'benefits' && (
            <div className="cbp-tab-pane slide-up">
              <h3 className="cbp-pane-title">Key Features & Benefits</h3>
              <ul className="cbp-feature-list">
                {features?.map((f, idx) => (
                  <li key={idx} className="cbp-feature-item">
                    <div className="cbp-feature-icon-wrapper"><FaCheckCircle /></div>
                    <span className="cbp-feature-text">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ELIGIBILITY TAB */}
          {activeTab === 'eligibility' && (
            <div className="cbp-tab-pane slide-up">
              <h3 className="cbp-pane-title">Whom to Refer</h3>
              <div className="cbp-info-box">
                <FaInfoCircle className="cbp-info-icon" />
                <p className="cbp-info-text">{eligibility?.criteria}</p>
              </div>
              
              <h4 className="cbp-pane-subtitle">Documents Required</h4>
              <div className="cbp-tag-container">
                {eligibility?.documentsRequired?.map((doc, idx) => (
                  <span key={idx} className="cbp-tag">
                    <FaRegFileAlt className="text-blue-500" /> {doc}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* HOW IT WORKS TAB */}
          {activeTab === 'howItWorks' && (
            <div className="cbp-tab-pane slide-up">
              <h3 className="cbp-pane-title">Application Process</h3>
              <div className="cbp-timeline">
                {howItWorks?.map((step, idx) => (
                  <div key={idx} className="cbp-step">
                    <div className="cbp-step-number">{idx + 1}</div>
                    <div className="cbp-step-content">
                      <h4 className="cbp-step-title">Step {idx + 1}</h4>
                      <p className="cbp-step-text">{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIDEO TAB */}
          {activeTab === 'video' && trainingVideoUrl && (
            <div className="cbp-tab-pane slide-up">
              <h3 className="cbp-pane-title">Training & Overview</h3>
              <div className="cbp-video-container">
                <iframe 
                  src={trainingVideoUrl} 
                  title="Training Video" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          )}

          {/* FAQS TAB */}
          {activeTab === 'faqs' && faqs && faqs.length > 0 && (
            <div className="cbp-tab-pane slide-up">
              <h3 className="cbp-pane-title">Frequently Asked Questions</h3>
              <div className="cbp-faq-list">
                {faqs.map((faq, idx) => (
                  <div key={idx} className={`cbp-faq-item ${openFaq === idx ? 'active' : ''}`}>
                    <button 
                      onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                      className="cbp-faq-btn"
                    >
                      <span>{faq.q}</span>
                      <div className="cbp-faq-icon-wrapper">
                        <FaChevronDown className="cbp-faq-icon" />
                      </div>
                    </button>
                    <div className="cbp-faq-answer-wrapper">
                      <div className="cbp-faq-answer">
                        {faq.a}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* T&C TAB */}
          {activeTab === 'tnc' && (
            <div className="cbp-tab-pane slide-up">
              <h3 className="cbp-pane-title">Terms & Conditions</h3>
              <div className="cbp-tnc-box">
                <p>{termsAndConditions}</p>
              </div>
            </div>
          )}

        </div>

      </div>

      {isApplyModalOpen && (
        <CardApplyVerificationModal 
          card={{
            cardName: cardInfo.name,
            bankName: dbProduct ? dbProduct.bank_name : (id.includes('hdfc') ? 'HDFC Bank' : id.includes('sbi') ? 'SBI Card' : id.includes('axis') ? 'Axis Bank' : id.includes('icici') ? 'ICICI Bank' : id.includes('idfc') ? 'IDFC FIRST Bank' : id.includes('bob') ? 'Bank of Baroda' : 'Credit Card'),
            bankId: dbProduct ? (dbProduct.bank_id || dbProduct.bank_name.toLowerCase().replace(/[^a-z]/g, '')) : (id.includes('hdfc') ? 'hdfc' : id.includes('sbi') ? 'sbi' : id.includes('axis') ? 'axis' : id.includes('icici') ? 'icici' : id.includes('idfc') ? 'idfc' : id.includes('bob') ? 'bob' : '')
          }}
          onClose={() => setIsApplyModalOpen(false)}
          C={C}
        />
      )}
      </div> {/* end cbp-scrollable-content */}
      
    </div>
  );
}
