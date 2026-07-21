import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../contexts/ThemeContext';
import { 
  FaArrowLeft, FaGift, FaShieldAlt, FaClock, FaSearch, 
  FaCheckCircle, FaArrowRight, FaQuestionCircle, 
  FaChevronDown, FaChevronUp, FaTimes, FaLock, 
  FaPlane, FaShoppingBag, FaBriefcase, FaRegCreditCard,
  FaMobileAlt, FaInfoCircle, FaStar, FaWhatsapp, FaUniversity
} from 'react-icons/fa';
import { getApiV1Url } from '../../../../config/api';
import CardApplyVerificationModal from './CardApplyVerificationModal';
import { resolveAndApply } from '../../../../services/applicationResolver';
import { getCardSpecificImage } from './cardImageHelper';
import { getCleanImageUrl } from '../../../../utils/urlHelper';

export default function DynamicCreditCardsPage() {
  const { bankSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { isDark, C } = useTheme();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [bank, setBank] = useState(null);
  const [cards, setCards] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [seoData, setSeoData] = useState({});

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedCard, setSelectedCard] = useState(null);
  const [verifyCard, setVerifyCard] = useState(null);

  // Comparison State
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [showCardBSelector, setShowCardBSelector] = useState(false);

  // Tab details inside Card Details modal
  const [detailTab, setDetailTab] = useState('features');
  const [selectedCardFaqs, setSelectedCardFaqs] = useState([]);

  useEffect(() => {
    if (selectedCard) {
      setDetailTab('features');
      setSelectedCardFaqs([]);
      fetch(`${getApiV1Url()}/products/${selectedCard.id}/faqs`)
        .then(res => res.json())
        .then(data => {
          if (data && data.success && Array.isArray(data.data)) {
            setSelectedCardFaqs(data.data);
          }
        })
        .catch(err => console.error("Error fetching card FAQs:", err));
    }
  }, [selectedCard]);

  // Fetch bank and credit cards from API
  useEffect(() => {
    const fetchBankCards = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const res = await fetch(`${getApiV1Url()}/banks/${bankSlug}/cards`);
        const json = await res.json();
        if (json && json.success && json.data) {
          const { bank: b, cards: cList, categories: cats, seo } = json.data;
          setBank(b);
          setCards(cList || []);
          setCategories(['All', ...(cats || [])]);
          setSeoData(seo || {});

          // Dynamic SEO update
          if (seo?.title) {
            document.title = seo.title;
          } else if (b?.name) {
            document.title = `${b.name} Credit Cards - Apply Online | GharKaPaisa`;
          }

          if (seo?.description) {
            let metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) {
              metaDesc.setAttribute('content', seo.description);
            }
          }
        } else {
          setErrorMsg(json.message || 'Bank credit cards not found');
        }
      } catch (err) {
        console.error('Error loading bank credit cards:', err);
        setErrorMsg('Network error loading credit card products.');
      } finally {
        setLoading(false);
      }
    };

    if (bankSlug) {
      fetchBankCards();
    }
  }, [bankSlug]);

  const handleApplyClick = (card) => {
    resolveAndApply(card.name, {
      onInternalForm: () => {
        setVerifyCard({
          cardName: card.name,
          bankName: bank?.name || 'Partner Bank',
          bankId: bank?.short_code?.toLowerCase() || 'partner',
          card: card
        });
      }
    });
  };

  const handleWhatsAppShare = (card) => {
    const cardSlug = card.slug || card.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const refLink = `${window.location.origin}/products/${cardSlug}`;
    const shareText = `Apply for ${card.name} (${bank?.name || 'Bank'}) on GharKaPaisa! Details: ${refLink}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };



  // Filter cards by category & search query
  const filteredCards = cards.filter(card => {
    const matchesFilter = activeFilter === 'All' || 
                          card.sub_category === activeFilter || 
                          card.category === activeFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
                          card.name.toLowerCase().includes(q) ||
                          (card.description && card.description.toLowerCase().includes(q));
    return matchesFilter && matchesSearch;
  });

  // Group cards by sub_category (e.g. Core Cards, Co-Branded Cards, Secured Cards)
  const groupedSections = React.useMemo(() => {
    const groups = {};
    filteredCards.forEach(c => {
      const sec = c.sub_category || 'Credit Cards';
      if (!groups[sec]) groups[sec] = [];
      groups[sec].push(c);
    });
    return Object.keys(groups).map(title => ({
      title,
      cards: groups[title]
    }));
  }, [filteredCards]);

  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const bankThemeColor = bank?.theme_color || '#004B87';
  const bankSecondaryColor = bank?.secondary_color || '#00296B';
  const bankGradient = bank?.gradient || `linear-gradient(135deg, ${bankThemeColor} 0%, ${bankSecondaryColor} 100%)`;
  const bankButtonColor = bank?.button_color || bankThemeColor;
  const bankAccentColor = bank?.accent_color || '#10B981';
  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: isDark ? '#0f172a' : '#f8fafc', color: isDark ? '#f8fafc' : '#1e293b' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid #e2e8f0', borderTopColor: bankThemeColor, borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
        <p style={{ fontSize: '15px', fontWeight: 600 }}>Loading {bankSlug ? bankSlug.toUpperCase() : ''} Credit Cards...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (errorMsg || !bank) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center', background: isDark ? '#0f172a' : '#f8fafc', color: isDark ? '#f8fafc' : '#1e293b' }}>
        <FaUniversity size={56} style={{ color: '#94a3b8', marginBottom: '16px' }} />
        <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 8px' }}>{errorMsg || 'Bank Not Found'}</h2>
        <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>We couldn't find active credit cards for this bank partner.</p>
        <button onClick={() => navigate('/credit-cards')} style={{ padding: '10px 24px', background: bankButtonColor, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>
          Explore All Credit Cards
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: isDark ? '#0f172a' : '#f8fafc', color: isDark ? '#f1f5f9' : '#1e293b', paddingBottom: '48px' }}>
      
      {/* ── BREADCRUMB ── */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', alignItems: 'center' }}>
            <FaArrowLeft size={14} style={{ marginRight: '6px' }} /> Back
          </button>
          <span>/</span>
          <span onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Home</span>
          <span>/</span>
          <span onClick={() => navigate('/credit-cards')} style={{ cursor: 'pointer' }}>Credit Cards</span>
          <span>/</span>
          <span style={{ fontWeight: 700, color: bankThemeColor }}>{bank.name}</span>
        </div>
      </div>

      {/* ── HERO BANNER SECTION (Full Screen Width) ── */}
      <div style={{
        width: '100%',
        overflow: 'hidden',
        background: isDark ? '#1e293b' : '#f1f5f9',
        height: isMobile ? '200px' : '320px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {(bank.banner && bank.banner !== 'null' && bank.banner !== 'undefined' && bank.banner.trim() !== '') ? (
          <img 
            src={getCleanImageUrl(bank.banner)} 
            alt={`${bank.name} Credit Cards Banner`} 
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} 
          />
        ) : bank.logo_url ? (
          <img 
            src={getCleanImageUrl(bank.logo_url)} 
            alt={bank.name} 
            style={{ maxWidth: '40%', maxHeight: '50%', objectFit: 'contain' }} 
          />
        ) : (
          <span style={{ fontSize: '64px' }}>💳</span>
        )}
      </div>

      {/* ── SEARCH & DYNAMIC CATEGORY FILTERS ── */}
      <div style={{ maxWidth: '1280px', margin: '24px auto 0', padding: '0 24px' }}>
        <div style={{
          background: isDark ? '#1e293b' : '#ffffff',
          padding: '16px 20px',
          borderRadius: '16px',
          border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px'
        }}>
          {/* Search */}
          <div style={{ position: 'relative', width: isMobile ? '100%' : '300px' }}>
            <FaSearch size={14} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: isDark ? '#94a3b8' : '#64748b' }} />
            <input
              type="text"
              placeholder={`Search ${bank.name} cards...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 38px',
                background: isDark ? '#0f172a' : '#f1f5f9',
                border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                borderRadius: '10px',
                fontSize: '13px',
                color: isDark ? '#f8fafc' : '#0f172a',
                outline: 'none'
              }}
            />
            {searchQuery && (
              <FaTimes size={12} onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#64748b' }} />
            )}
          </div>

          {/* Dynamic Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', width: isMobile ? '100%' : 'auto', paddingBottom: isMobile ? '4px' : 0 }}>
            {categories.map((cat, idx) => {
              const isActive = activeFilter === cat;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveFilter(cat)}
                  style={{
                    background: isActive ? bankThemeColor : (isDark ? '#0f172a' : '#f1f5f9'),
                    color: isActive ? '#ffffff' : (isDark ? '#cbd5e1' : '#334155'),
                    border: `1px solid ${isActive ? bankThemeColor : (isDark ? '#334155' : '#cbd5e1')}`,
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s'
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── CARDS LISTING & COMPARISON TOOL BAR ── */}
      <div style={{ maxWidth: '1280px', margin: '24px auto 0', padding: '0 24px' }}>
        


        {filteredCards.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {groupedSections.map(sec => (
              <div key={sec.title}>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 16px 0', borderBottom: `2.5px solid ${bankThemeColor}`, display: 'inline-block', paddingBottom: '6px' }}>
                  {sec.title}
                </h2>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: isMobile ? '1fr' : (isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)'), 
                  gap: isMobile ? '16px' : '20px' 
                }}>
                  {sec.cards.map(card => {
                    const isComparing = selectedForCompare.some(c => c.id === card.id);
                    const features = Array.isArray(card.features) ? card.features : (card.features_list || []);

                    return (
                      <div
                        key={card.id}
                        style={{
                          background: isDark ? '#1e293b' : '#ffffff',
                          borderRadius: '20px',
                          border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                          padding: '20px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                          position: 'relative',
                          transition: 'all 0.2s'
                        }}
                      >
                        {/* Top Badges */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: bankThemeColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {card.sub_category || card.category || 'Credit Card'}
                          </span>
                          {card.is_featured && (
                            <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', background: '#F59E0B20', color: '#D97706' }}>★ Featured</span>
                          )}
                        </div>

                        {/* Card Graphic & Name Header */}
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
                          <div style={{ width: '80px', height: '52px', borderRadius: '10px', background: isDark ? '#0f172a' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: '4px', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
                            <img
                              src={getCleanImageUrl(card.card_image_url || card.image_url || card.thumbnail_url) || getCardSpecificImage(card.name) || bank.logo_url}
                              alt={card.name}
                              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                              onError={(e) => { e.target.src = bank.logo_url; }}
                            />
                          </div>

                          <div style={{ flex: 1 }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 4px 0', lineHeight: 1.3 }}>{card.name}</h3>
                            <p style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b', margin: 0, lineHeight: 1.3 }}>
                              {card.annual_fee || (card.fees_structure?.annual_fee ? `Fee: ₹${card.fees_structure.annual_fee}` : 'Lifetime Free Option')}
                            </p>
                          </div>
                        </div>

                        {/* Key Highlights / Features */}
                        <div style={{ marginBottom: '20px', flex: 1 }}>
                          {features.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {features.slice(0, 3).map((feat, fIdx) => (
                                <div key={fIdx} style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: isDark ? '#94a3b8' : '#64748b' }}>
                                  <FaCheckCircle size={12} style={{ color: bankAccentColor, flexShrink: 0 }} />
                                  <span>{typeof feat === 'string' ? feat : (feat.title || feat.label)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => setSelectedCard(card)}
                              style={{
                                flex: 1,
                                padding: '8px',
                                background: isDark ? '#334155' : '#f1f5f9',
                                color: isDark ? '#f8fafc' : '#334155',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              Details
                            </button>
                            <button
                              onClick={() => {
                                setSelectedForCompare([card]);
                                setIsCompareOpen(true);
                              }}
                              style={{
                                flex: 1,
                                padding: '8px',
                                background: 'transparent',
                                color: isDark ? '#94a3b8' : '#64748b',
                                border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              + Compare
                            </button>
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleApplyClick(card)}
                              style={{
                                flex: 1,
                                padding: '10px',
                                background: bankButtonColor,
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '10px',
                                fontSize: '13px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                            >
                              Apply Now
                            </button>
                            <button
                              onClick={() => handleWhatsAppShare(card)}
                              title="Share on WhatsApp"
                              style={{
                                padding: '10px 14px',
                                background: '#25D36620',
                                color: '#25D366',
                                border: 'none',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <FaWhatsapp size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: isDark ? '#1e293b' : '#ffffff', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '20px', padding: '48px 24px', textAlign: 'center' }}>
            <FaSearch size={36} style={{ color: '#94a3b8', marginBottom: '12px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0' }}>No Cards Match Your Filter</h3>
            <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 16px 0' }}>Try adjusting your search keywords or switching category filters.</p>
            <button onClick={() => { setSearchQuery(''); setActiveFilter('All'); }} style={{ padding: '8px 20px', background: bankThemeColor, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Reset Filters</button>
          </div>
        )}
      </div>

      {/* ── CARD DETAILS MODAL ── */}
      {selectedCard && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '12px' : '20px' }}>
          <div style={{ background: isDark ? '#1e293b' : '#ffffff', borderRadius: '24px', maxWidth: '640px', width: '100%', maxHeight: '92vh', overflowY: 'auto', padding: isMobile ? '16px' : '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', position: 'relative' }}>
            <button onClick={() => setSelectedCard(null)} style={{ position: 'absolute', right: '16px', top: '16px', background: 'none', border: 'none', cursor: 'pointer', color: isDark ? '#94a3b8' : '#64748b' }}>
              <FaTimes size={18} />
            </button>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ width: '90px', height: '60px', borderRadius: '12px', background: isDark ? '#0f172a' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, flexShrink: 0 }}>
                <img src={getCleanImageUrl(selectedCard.card_image_url || selectedCard.image_url) || getCardSpecificImage(selectedCard.name) || bank.logo_url} alt={selectedCard.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </div>
              <div>
                <h3 style={{ fontSize: isMobile ? '17px' : '20px', fontWeight: 800, margin: '0 0 4px 0' }}>{selectedCard.name}</h3>
                <p style={{ fontSize: '13px', color: bankThemeColor, fontWeight: 700, margin: 0 }}>{bank.name} • {selectedCard.sub_category || selectedCard.category}</p>
              </div>
            </div>

            {/* Horizontal Tabs */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, paddingBottom: '10px', marginBottom: '20px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              {[
                { id: 'features', label: 'Features' },
                { id: 'fees', label: 'Fees & Charges' },
                { id: 'eligibility', label: 'Eligibility' },
                { id: 'documents', label: 'Documents' },
                { id: 'faqs', label: 'FAQs' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setDetailTab(t.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: detailTab === t.id ? bankThemeColor : 'transparent',
                    color: detailTab === t.id ? '#FFF' : (isDark ? '#94a3b8' : '#475569'),
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div style={{ minHeight: '200px', marginBottom: '24px' }}>
              {detailTab === 'features' && (
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 12px 0' }}>Key Features & Benefits</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(Array.isArray(selectedCard.features) ? selectedCard.features : (selectedCard.features_list || [])).map((f, i) => (
                      <div key={i} style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', color: isDark ? '#cbd5e1' : '#334155' }}>
                        <FaCheckCircle size={14} style={{ color: '#10B981', flexShrink: 0 }} />
                        <span>{typeof f === 'string' ? f : (f.title || f.label)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detailTab === 'fees' && (
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 12px 0' }}>Fees & Charges</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ padding: '12px', background: isDark ? '#0f172a' : '#f8fafc', borderRadius: '10px', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Joining Fee</span>
                      <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '2px' }}>{selectedCard.joining_fee || selectedCard.fees_structure?.joining_fee || '₹0'}</div>
                    </div>
                    <div style={{ padding: '12px', background: isDark ? '#0f172a' : '#f8fafc', borderRadius: '10px', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Annual Fee</span>
                      <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '2px' }}>{selectedCard.annual_fee || selectedCard.fees_structure?.annual_fee || '₹500'}</div>
                    </div>
                    <div style={{ padding: '12px', background: isDark ? '#0f172a' : '#f8fafc', borderRadius: '10px', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Interest Rate</span>
                      <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '2px' }}>{selectedCard.interest_rate || selectedCard.fees_structure?.interest_rate || '3.5% p.m.'}</div>
                    </div>
                    <div style={{ padding: '12px', background: isDark ? '#0f172a' : '#f8fafc', borderRadius: '10px', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Late Payment Charges</span>
                      <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '2px' }}>{selectedCard.fees_structure?.late_payment_charges || 'Up to ₹1300'}</div>
                    </div>
                  </div>
                  {selectedCard.fees_charges && (
                    <p style={{ fontSize: '11px', color: '#64748b', marginTop: '12px', lineHeight: 1.4 }}>{selectedCard.fees_charges}</p>
                  )}
                </div>
              )}

              {detailTab === 'eligibility' && (
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 12px 0' }}>Eligibility Requirements</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: isDark ? '#cbd5e1' : '#334155' }}>
                    <div><strong>Min Age:</strong> {selectedCard.min_age || 21} Years</div>
                    <div><strong>Max Age:</strong> {selectedCard.max_age || 65} Years</div>
                    <div><strong>Min monthly income:</strong> ₹{selectedCard.min_income ? Number(selectedCard.min_income).toLocaleString('en-IN') : '25,000'}</div>
                    {selectedCard.eligibility_criteria && (
                      typeof selectedCard.eligibility_criteria === 'string' ? (
                        <div style={{ marginTop: '8px', padding: '10px', background: isDark ? '#0f172a' : '#f8fafc', borderRadius: '8px', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, whiteSpace: 'pre-line', lineHeight: 1.4 }}>{selectedCard.eligibility_criteria}</div>
                      ) : (
                        Object.entries(selectedCard.eligibility_criteria).map(([k, v]) => (
                          <div key={k} style={{ textTransform: 'capitalize' }}>
                            <strong>{k.replace(/_/g, ' ')}:</strong> {String(v)}
                          </div>
                        ))
                      )
                    )}
                  </div>
                </div>
              )}

              {detailTab === 'documents' && (
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 12px 0' }}>Documents Required</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(Array.isArray(selectedCard.required_documents) && selectedCard.required_documents.length > 0 ? selectedCard.required_documents : ['PAN Card', 'Aadhaar Card', 'Income Proof / Salary Slip']).map((doc, dI) => (
                      <div key={dI} style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', color: isDark ? '#cbd5e1' : '#334155' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: bankThemeColor, flexShrink: 0 }} />
                        <span>{doc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detailTab === 'faqs' && (
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 12px 0' }}>Frequently Asked Questions</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {selectedCardFaqs.length > 0 ? (
                      selectedCardFaqs.map((faq, idx) => (
                        <div key={idx} style={{ padding: '10px', background: isDark ? '#0f172a' : '#f8fafc', borderRadius: '8px', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
                          <div style={{ fontWeight: 700, fontSize: '12.5px', marginBottom: '4px' }}>Q: {faq.question}</div>
                          <div style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.4 }}>A: {faq.answer}</div>
                        </div>
                      ))
                    ) : (
                      [
                        { question: 'What is the annual fee for this card?', answer: `The annual fee is ${selectedCard.annual_fee || selectedCard.fees_structure?.annual_fee || '₹500'}.` },
                        { question: 'Who is eligible to apply?', answer: `Any Indian resident aged between ${selectedCard.min_age || 21} and ${selectedCard.max_age || 65} with a regular monthly income source starting from ₹${selectedCard.min_income ? Number(selectedCard.min_income).toLocaleString('en-IN') : '25,000'}.` },
                        { question: 'What documents are required for application?', answer: 'You will need a PAN Card, Aadhaar Card, and income proof (like the latest 3 months salary slips or ITR).' }
                      ].map((faq, idx) => (
                        <div key={idx} style={{ padding: '10px', background: isDark ? '#0f172a' : '#f8fafc', borderRadius: '8px', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
                          <div style={{ fontWeight: 700, fontSize: '12.5px', marginBottom: '4px' }}>Q: {faq.question}</div>
                          <div style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.4 }}>A: {faq.answer}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => { setSelectedCard(null); handleApplyClick(selectedCard); }} style={{ width: '100%', padding: '12px', background: bankThemeColor, color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 800, cursor: 'pointer' }}>
              Proceed to Apply
            </button>
          </div>
        </div>
      )}

      {/* ── CARD COMPARISON MODAL ── */}
      {isCompareOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '12px' : '20px' }}>
          <div style={{ background: isDark ? '#1e293b' : '#ffffff', borderRadius: '24px', maxWidth: '900px', width: '100%', maxHeight: '92vh', display: 'flex', flexDirection: 'column', padding: isMobile ? '16px' : '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexShrink: 0 }}>
              <h3 style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: 800, margin: 0 }}>Compare Credit Cards</h3>
              <button onClick={() => { setIsCompareOpen(false); setShowCardBSelector(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDark ? '#94a3b8' : '#64748b' }}><FaTimes size={18} /></button>
            </div>

            <div style={{ display: 'flex', gap: isMobile ? '10px' : '20px', marginBottom: '16px', flexDirection: isMobile ? 'column' : 'row', flexShrink: 0 }}>
              {/* Card A Box */}
              <div style={{ flex: 1, padding: '12px 14px', background: isDark ? '#0f172a' : '#f8fafc', borderRadius: '16px', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, minWidth: isMobile ? '100%' : '200px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 800 }}>Base Card</div>
                {selectedForCompare[0] && (
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: '60px', height: '40px', borderRadius: '8px', background: isDark ? '#1e293b' : '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, flexShrink: 0 }}>
                      <img src={getCleanImageUrl(selectedForCompare[0].card_image_url || selectedForCompare[0].image_url) || getCardSpecificImage(selectedForCompare[0].name) || bank.logo_url} alt={selectedForCompare[0].name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '13.5px', fontWeight: 800, margin: 0 }}>{selectedForCompare[0].name}</h4>
                      <p style={{ fontSize: '11px', color: bankThemeColor, margin: 0, fontWeight: 700 }}>{selectedForCompare[0].annual_fee || 'Standard Fee'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Card B Box */}
              <div style={{ flex: 1, padding: '12px 14px', background: isDark ? '#0f172a' : '#f8fafc', borderRadius: '16px', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, minWidth: isMobile ? '100%' : '200px', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {selectedForCompare[1] ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Comparing With</span>
                      <button onClick={() => setShowCardBSelector(true)} style={{ background: 'none', border: 'none', color: bankThemeColor, fontSize: '12px', fontWeight: 700, cursor: 'pointer', padding: 0 }}>Change</button>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ width: '60px', height: '40px', borderRadius: '8px', background: isDark ? '#1e293b' : '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, flexShrink: 0 }}>
                        <img src={selectedForCompare[1].card_image_url || selectedForCompare[1].image_url || getCardSpecificImage(selectedForCompare[1].name) || bank.logo_url} alt={selectedForCompare[1].name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '14px', fontWeight: 800, margin: 0 }}>{selectedForCompare[1].name}</h4>
                        <p style={{ fontSize: '11px', color: bankThemeColor, margin: 0, fontWeight: 700 }}>{selectedForCompare[1].annual_fee || 'Standard Fee'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <button
                      onClick={() => setShowCardBSelector(true)}
                      style={{
                        padding: '8px 16px',
                        background: bankThemeColor,
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      + Select Card to Compare
                    </button>
                  </div>
                )}

                {showCardBSelector && (
                  <div style={{
                    position: 'absolute',
                    top: '55px',
                    left: '16px',
                    right: '16px',
                    background: isDark ? '#1e293b' : '#ffffff',
                    border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                    borderRadius: '12px',
                    maxHeight: '220px',
                    overflowY: 'auto',
                    zIndex: 100,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
                  }}>
                    <div style={{ padding: '8px 12px', fontWeight: 700, borderBottom: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                      <span>Select Card to Compare</span>
                      <FaTimes size={10} style={{ cursor: 'pointer' }} onClick={() => setShowCardBSelector(false)} />
                    </div>
                    {cards.filter(c => c.id !== selectedForCompare[0]?.id).map(c => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setSelectedForCompare([selectedForCompare[0], c]);
                          setShowCardBSelector(false);
                        }}
                        style={{
                          padding: '10px 12px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          borderBottom: `1px solid ${isDark ? '#334155' : '#f1f5f9'}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <img src={c.card_image_url || c.image_url || getCardSpecificImage(c.name) || bank.logo_url} style={{ width: '30px', height: '20px', objectFit: 'contain' }} />
                        <span style={{ fontWeight: 600 }}>{c.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ overflowY: 'auto', overflowX: 'auto', flex: 1 }}>
              {selectedForCompare[1] ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: isDark ? '#1e293b' : '#ffffff' }}>
                    <tr style={{ borderBottom: `2px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
                      <th style={{ padding: '12px', width: '180px', background: isDark ? '#1e293b' : '#ffffff' }}>Feature</th>
                      <th style={{ padding: '12px', background: isDark ? '#1e293b' : '#ffffff' }}>{selectedForCompare[0]?.name}</th>
                      <th style={{ padding: '12px', background: isDark ? '#1e293b' : '#ffffff' }}>{selectedForCompare[1]?.name}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: `1px solid ${isDark ? '#334155' : '#f1f5f9'}` }}>
                      <td style={{ padding: '12px', fontWeight: 700 }}>Category</td>
                      <td style={{ padding: '12px' }}>{selectedForCompare[0]?.sub_category || selectedForCompare[0]?.category}</td>
                      <td style={{ padding: '12px' }}>{selectedForCompare[1]?.sub_category || selectedForCompare[1]?.category}</td>
                    </tr>
                    <tr style={{ borderBottom: `1px solid ${isDark ? '#334155' : '#f1f5f9'}` }}>
                      <td style={{ padding: '12px', fontWeight: 700 }}>Min Age</td>
                      <td style={{ padding: '12px' }}>{selectedForCompare[0]?.min_age || 21} Years</td>
                      <td style={{ padding: '12px' }}>{selectedForCompare[1]?.min_age || 21} Years</td>
                    </tr>
                    <tr style={{ borderBottom: `1px solid ${isDark ? '#334155' : '#f1f5f9'}` }}>
                      <td style={{ padding: '12px', fontWeight: 700 }}>Min Income</td>
                      <td style={{ padding: '12px' }}>₹{selectedForCompare[0]?.min_income ? Number(selectedForCompare[0]?.min_income).toLocaleString('en-IN') : '25,000'}/mo</td>
                      <td style={{ padding: '12px' }}>₹{selectedForCompare[1]?.min_income ? Number(selectedForCompare[1]?.min_income).toLocaleString('en-IN') : '25,000'}/mo</td>
                    </tr>
                    <tr style={{ borderBottom: `1px solid ${isDark ? '#334155' : '#f1f5f9'}` }}>
                      <td style={{ padding: '12px', fontWeight: 700 }}>Joining Fee</td>
                      <td style={{ padding: '12px' }}>{selectedForCompare[0]?.joining_fee || selectedForCompare[0]?.fees_structure?.joining_fee || '₹0'}</td>
                      <td style={{ padding: '12px' }}>{selectedForCompare[1]?.joining_fee || selectedForCompare[1]?.fees_structure?.joining_fee || '₹0'}</td>
                    </tr>
                    <tr style={{ borderBottom: `1px solid ${isDark ? '#334155' : '#f1f5f9'}` }}>
                      <td style={{ padding: '12px', fontWeight: 700 }}>Annual Fee</td>
                      <td style={{ padding: '12px' }}>{selectedForCompare[0]?.annual_fee || selectedForCompare[0]?.fees_structure?.annual_fee || '₹500'}</td>
                      <td style={{ padding: '12px' }}>{selectedForCompare[1]?.annual_fee || selectedForCompare[1]?.fees_structure?.annual_fee || '₹500'}</td>
                    </tr>
                    <tr style={{ borderBottom: `1px solid ${isDark ? '#334155' : '#f1f5f9'}` }}>
                      <td style={{ padding: '12px', fontWeight: 700 }}>Interest Rate</td>
                      <td style={{ padding: '12px' }}>{selectedForCompare[0]?.interest_rate || selectedForCompare[0]?.fees_structure?.interest_rate || '3.5% p.m.'}</td>
                      <td style={{ padding: '12px' }}>{selectedForCompare[1]?.interest_rate || selectedForCompare[1]?.fees_structure?.interest_rate || '3.5% p.m.'}</td>
                    </tr>
                    <tr style={{ borderBottom: `1px solid ${isDark ? '#334155' : '#f1f5f9'}` }}>
                      <td style={{ padding: '12px', fontWeight: 700 }}>Lounge Access</td>
                      <td style={{ padding: '12px' }}>{selectedForCompare[0]?.lounge_access || selectedForCompare[0]?.compare_specs?.lounge || 'Nil'}</td>
                      <td style={{ padding: '12px' }}>{selectedForCompare[1]?.lounge_access || selectedForCompare[1]?.compare_specs?.lounge || 'Nil'}</td>
                    </tr>

                  </tbody>
                </table>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', border: `1px dashed ${isDark ? '#334155' : '#cbd5e1'}`, borderRadius: '16px' }}>
                  <FaRegCreditCard size={36} style={{ color: bankThemeColor, marginBottom: '12px', opacity: 0.6 }} />
                  <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>Select a Second Card to Compare</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Click "+ Select Card to Compare" above to choose another card and view detailed specs.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── OTP VERIFICATION & APPLY MODAL ── */}
      {verifyCard && (
        <CardApplyVerificationModal
          card={verifyCard}
          onClose={() => setVerifyCard(null)}
          C={C}
        />
      )}

    </div>
  );
}
