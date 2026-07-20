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

export default function DynamicCreditCardsPage() {
  const { bankSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { theme, C } = useTheme();
  const isDark = theme === 'dark';

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

  const toggleCompareSelection = (card) => {
    if (selectedForCompare.find(c => c.id === card.id)) {
      setSelectedForCompare(selectedForCompare.filter(c => c.id !== card.id));
    } else {
      if (selectedForCompare.length >= 4) {
        alert('You can compare up to 4 credit cards at a time.');
        return;
      }
      setSelectedForCompare([...selectedForCompare, card]);
    }
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

  const bankThemeColor = bank?.theme_color || '#004B87';
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

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
        <button onClick={() => navigate('/credit-cards')} style={{ padding: '10px 24px', background: bankThemeColor, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>
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

      {/* ── HERO BANNER SECTION ── */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{
          background: isDark ? '#1e293b' : '#ffffff',
          borderRadius: '24px',
          padding: isMobile ? '20px' : '32px',
          border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1.2fr 0.8fr',
          gap: '24px',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              {bank.logo_url && (
                <img src={bank.logo_url} alt={bank.name} style={{ height: '36px', maxWidth: '120px', objectFit: 'contain' }} />
              )}
              <span style={{ fontSize: '12px', fontWeight: 800, padding: '4px 10px', borderRadius: '20px', background: `${bankThemeColor}15`, color: bankThemeColor, textTransform: 'uppercase' }}>
                Verified Partner
              </span>
            </div>
            <h1 style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: 800, margin: '0 0 8px 0', lineHeight: 1.2 }}>
              {bank.hero_title || `${bank.name} Credit Cards`}
            </h1>
            <p style={{ fontSize: '14px', color: isDark ? '#94a3b8' : '#64748b', margin: 0, lineHeight: 1.6 }}>
              {bank.hero_description || `Compare interest rates, cashback, lounge access, and apply online for pre-approved ${bank.name} credit cards with instant digital verification.`}
            </p>
          </div>

          <div style={{
            width: '100%',
            height: '160px',
            background: bank.banner ? `url(${bank.banner}) center/cover no-repeat` : `linear-gradient(135deg, ${bankThemeColor} 0%, #1e293b 100%)`,
            borderRadius: '16px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}>
            {!bank.banner && (
              <div style={{ textAlign: 'center', color: '#ffffff' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 6px 0' }}>{bank.name} Cards</h3>
                <p style={{ fontSize: '12px', opacity: 0.9, margin: 0 }}>Apply Online • Zero Pre-Approval Paperwork</p>
              </div>
            )}
          </div>
        </div>
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
        
        {/* Sticky Compare Bar if items selected */}
        {selectedForCompare.length > 0 && (
          <div style={{
            background: isDark ? '#1e293b' : '#ffffff',
            border: `2px solid ${bankThemeColor}`,
            borderRadius: '16px',
            padding: '14px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', fontWeight: 800 }}>Compare ({selectedForCompare.length}/4 selected):</span>
              {selectedForCompare.map(c => (
                <span key={c.id} style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '14px', background: `${bankThemeColor}20`, color: bankThemeColor, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {c.name}
                  <FaTimes size={10} style={{ cursor: 'pointer' }} onClick={() => toggleCompareSelection(c)} />
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setSelectedForCompare([])} style={{ padding: '6px 12px', background: 'none', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`, borderRadius: '8px', fontSize: '12px', cursor: 'pointer', color: 'inherit' }}>Clear</button>
              <button onClick={() => setIsCompareOpen(true)} style={{ padding: '6px 16px', background: bankThemeColor, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>Compare Now</button>
            </div>
          </div>
        )}

        {filteredCards.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {groupedSections.map(sec => (
              <div key={sec.title}>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 16px 0', borderBottom: `2.5px solid ${bankThemeColor}`, display: 'inline-block', paddingBottom: '6px' }}>
                  {sec.title}
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '20px' }}>
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
                              src={card.card_image_url || card.image_url || card.thumbnail_url || bank.logo_url}
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
                          <p style={{ fontSize: '13px', color: isDark ? '#cbd5e1' : '#475569', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                            {card.description || card.short_description}
                          </p>
                          {features.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {features.slice(0, 3).map((feat, fIdx) => (
                                <div key={fIdx} style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: isDark ? '#94a3b8' : '#64748b' }}>
                                  <FaCheckCircle size={12} style={{ color: '#10B981', flexShrink: 0 }} />
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
                              onClick={() => toggleCompareSelection(card)}
                              style={{
                                flex: 1,
                                padding: '8px',
                                background: isComparing ? `${bankThemeColor}20` : 'transparent',
                                color: isComparing ? bankThemeColor : (isDark ? '#94a3b8' : '#64748b'),
                                border: `1px solid ${isComparing ? bankThemeColor : (isDark ? '#334155' : '#cbd5e1')}`,
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              {isComparing ? '✓ Comparing' : '+ Compare'}
                            </button>
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleApplyClick(card)}
                              style={{
                                flex: 1,
                                padding: '10px',
                                background: bankThemeColor,
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
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: isDark ? '#1e293b' : '#ffffff', borderRadius: '24px', maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', position: 'relative' }}>
            <button onClick={() => setSelectedCard(null)} style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', cursor: 'pointer', color: isDark ? '#94a3b8' : '#64748b' }}>
              <FaTimes size={18} />
            </button>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ width: '90px', height: '60px', borderRadius: '12px', background: isDark ? '#0f172a' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
                <img src={selectedCard.card_image_url || selectedCard.image_url || bank.logo_url} alt={selectedCard.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px 0' }}>{selectedCard.name}</h3>
                <p style={{ fontSize: '13px', color: bankThemeColor, fontWeight: 700, margin: 0 }}>{bank.name} • {selectedCard.sub_category || selectedCard.category}</p>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: isDark ? '#cbd5e1' : '#475569', lineHeight: 1.5, marginBottom: '20px' }}>{selectedCard.description}</p>

            {/* Features */}
            {(selectedCard.features || selectedCard.features_list) && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 10px 0' }}>Key Features</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(Array.isArray(selectedCard.features) ? selectedCard.features : (selectedCard.features_list || [])).map((f, i) => (
                    <div key={i} style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', color: isDark ? '#cbd5e1' : '#334155' }}>
                      <FaCheckCircle size={14} style={{ color: '#10B981', flexShrink: 0 }} />
                      <span>{typeof f === 'string' ? f : (f.title || f.label)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Eligibility & Documents */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div style={{ padding: '14px', background: isDark ? '#0f172a' : '#f8fafc', borderRadius: '12px', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
                <h4 style={{ fontSize: '13px', fontWeight: 800, margin: '0 0 8px 0', color: bankThemeColor }}>Eligibility Criteria</h4>
                <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px', color: isDark ? '#94a3b8' : '#64748b' }}>
                  <div>Age: {selectedCard.min_age || 21} - {selectedCard.max_age || 65} Years</div>
                  <div>Min Income: ₹{selectedCard.min_income ? Number(selectedCard.min_income).toLocaleString('en-IN') : '25,000'}/mo</div>
                  {selectedCard.eligibility_criteria && Object.entries(selectedCard.eligibility_criteria).map(([k, v]) => (
                    <div key={k}>{k.replace(/_/g, ' ')}: {String(v)}</div>
                  ))}
                </div>
              </div>

              <div style={{ padding: '14px', background: isDark ? '#0f172a' : '#f8fafc', borderRadius: '12px', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
                <h4 style={{ fontSize: '13px', fontWeight: 800, margin: '0 0 8px 0', color: bankThemeColor }}>Required Documents</h4>
                <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px', color: isDark ? '#94a3b8' : '#64748b' }}>
                  {(Array.isArray(selectedCard.required_documents) && selectedCard.required_documents.length > 0 ? selectedCard.required_documents : ['PAN Card', 'Aadhaar Card', 'Income Proof / Salary Slip']).map((doc, dI) => (
                    <div key={dI}>• {doc}</div>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={() => { setSelectedCard(null); handleApplyClick(selectedCard); }} style={{ width: '100%', padding: '12px', background: bankThemeColor, color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 800, cursor: 'pointer' }}>
              Proceed to Apply
            </button>
          </div>
        </div>
      )}

      {/* ── CARD COMPARISON MODAL ── */}
      {isCompareOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: isDark ? '#1e293b' : '#ffffff', borderRadius: '24px', maxWidth: '900px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Compare Credit Cards</h3>
              <button onClick={() => setIsCompareOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDark ? '#94a3b8' : '#64748b' }}><FaTimes size={18} /></button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
                    <th style={{ padding: '12px', width: '180px' }}>Feature / Card</th>
                    {selectedForCompare.map(c => (
                      <th key={c.id} style={{ padding: '12px', minWidth: '160px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 800, color: bankThemeColor }}>{c.name}</div>
                        <div style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b' }}>{c.annual_fee || 'Standard Fee'}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: `1px solid ${isDark ? '#334155' : '#f1f5f9'}` }}>
                    <td style={{ padding: '12px', fontWeight: 700 }}>Category</td>
                    {selectedForCompare.map(c => <td key={c.id} style={{ padding: '12px' }}>{c.sub_category || c.category}</td>)}
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${isDark ? '#334155' : '#f1f5f9'}` }}>
                    <td style={{ padding: '12px', fontWeight: 700 }}>Min Age</td>
                    {selectedForCompare.map(c => <td key={c.id} style={{ padding: '12px' }}>{c.min_age || 21} Years</td>)}
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${isDark ? '#334155' : '#f1f5f9'}` }}>
                    <td style={{ padding: '12px', fontWeight: 700 }}>Min Income</td>
                    {selectedForCompare.map(c => <td key={c.id} style={{ padding: '12px' }}>₹{c.min_income ? Number(c.min_income).toLocaleString('en-IN') : '25,000'}/mo</td>)}
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${isDark ? '#334155' : '#f1f5f9'}` }}>
                    <td style={{ padding: '12px', fontWeight: 700 }}>Highlights</td>
                    {selectedForCompare.map(c => (
                      <td key={c.id} style={{ padding: '12px' }}>
                        <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.4 }}>{c.description}</p>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── OTP VERIFICATION & APPLY MODAL ── */}
      {verifyCard && (
        <CardApplyVerificationModal
          cardName={verifyCard.cardName}
          bankName={verifyCard.bankName}
          bankId={verifyCard.bankId}
          onClose={() => setVerifyCard(null)}
          onSuccess={() => {
            const c = verifyCard.card;
            if (c) {
              const redirectUrl = c.redirect_type === 'partner' && c.partner_url ? c.partner_url : (c.public_url || c.application_url || '#');
              window.open(redirectUrl, '_blank');
            }
            setVerifyCard(null);
          }}
        />
      )}

    </div>
  );
}
