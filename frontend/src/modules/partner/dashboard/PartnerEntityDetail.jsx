import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import api from '../../../services/api';
import { 
  MdDashboard, MdStorefront, MdPeople, MdLeaderboard, 
  MdFolder, MdBarChart, MdAccountBalanceWallet, MdSupportAgent,
  MdArrowBack, MdArrowForward, MdSearch, MdAdd, MdCheckCircle, MdClose,
  MdPhone, MdPerson, MdCreditCard, MdHelpOutline, MdTimeline,
  MdOutlineInsertDriveFile, MdDone, MdErrorOutline, MdHourglassEmpty,
  MdShare, MdSwapHoriz, MdInfo, MdContentCopy
} from 'react-icons/md';

import { getCardSpecificImage } from '../../home/components/CreditCards/cardImageHelper';
import { useAuthStore } from '../../../app/store/authStore';

const getBankName = (slug) => {
  if (!slug) return 'Bank Workspace';
  const nameMap = {
    hdfc: 'HDFC Bank',
    sbi: 'State Bank of India',
    icici: 'ICICI Bank',
    axis: 'Axis Bank',
    indusind: 'IndusInd Bank',
    idfc: 'IDFC FIRST Bank',
    au: 'AU Small Finance Bank',
    hsbc: 'HSBC Bank',
    federal: 'Federal Bank',
    bob: 'Bank of Baroda',
    yes: 'YES Bank',
    kotak: 'Kotak Mahindra Bank'
  };
  return nameMap[slug.toLowerCase()] || slug.toUpperCase().replace(/-/g, ' ');
};

const getCardKeyFeatures = (card) => {
  if (card.features && Array.isArray(card.features) && card.features.length > 0) {
    return card.features;
  }
  if (card.rewards) {
    return [card.rewards, "✈️ Lounge Access & Reward Points", "⚡ 1% Fuel Surcharge Waiver"];
  }
  const nameLower = (card.name || '').toLowerCase();
  if (nameLower.includes('millennia')) {
    return ["🎁 5% Cashback on Amazon, Flipkart & Swiggy", "✈️ 4 Free Airport Lounge Visits / Year", "⚡ 1% Fuel Surcharge Waiver"];
  }
  if (nameLower.includes('regalia')) {
    return ["👑 4 Reward Points per ₹150 Spent", "✈️ 12 Domestic & International Lounge Visits", "🛡️ ₹1 Cr Air Accidental Insurance Cover"];
  }
  if (nameLower.includes('simplyclick') || nameLower.includes('click')) {
    return ["🛒 10X Reward Points on Amazon, Cleartrip & BookMyShow", "🎁 ₹500 E-Voucher Welcome Gift", "⚡ 1% Fuel Surcharge Waiver"];
  }
  if (nameLower.includes('amazon') || nameLower.includes('icici')) {
    return ["🛒 Unlimited 5% Cashback for Amazon Prime Users", "🍽️ 15% Savings on Dining Partner Restaurants", "⚡ Zero Joining Fee & Lifetime Free"];
  }
  if (nameLower.includes('freedom')) {
    return ["🎁 10X CashPoints on Movies & Dining", "⚡ 1% Fuel Surcharge Waiver", "🛒 1,500 CashPoints Milestone Rewards"];
  }
  return ["🎁 Reward Points on All Spends", "✈️ Complimentary Lounge Access", "⚡ Fuel Surcharge Waiver"];
};

export default function PartnerEntityDetail() {
  const { bankSlug } = useParams();
  const slug = bankSlug || 'hdfc';
  const bankName = getBankName(slug);

  const navigate = useNavigate();
  const location = useLocation();
  const { C, isDark } = useTheme();
  const S = makeS(C);
  const user = useAuthStore((state) => state.user);
  const { t } = useTranslation();

  const [cardSearch, setCardSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  // Comparison & Modal States
  const [selectedCompareCards, setSelectedCompareCards] = useState([]);
  const [showCompareBar, setShowCompareBar] = useState(false);
  const [selectedProductWorkspace, setSelectedProductWorkspace] = useState(null);
  const [productWorkspaceTab, setProductWorkspaceTab] = useState('overview');

  // Customer Apply Form State
  const [applyCustomerName, setApplyCustomerName] = useState('');
  const [applyCustomerMobile, setApplyCustomerMobile] = useState('');
  const [applyProcessBy, setApplyProcessBy] = useState('lead_punching');
  const [applySubmitted, setApplySubmitted] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchEntityProducts = async () => {
      setLoading(true);
      try {
        const res = await api.get('/products', { params: { is_active: 'true', category: 'credit_card', limit: 100 } });
        if (res.data?.success) {
          const allProds = res.data.data || [];
          const slugLower = slug.toLowerCase();
          const filtered = allProds.filter(p => {
            const bName = (p.bank_name || p.bank_code || p.bank_slug || '').toLowerCase();
            const pName = (p.name || '').toLowerCase();
            return bName.includes(slugLower) || pName.includes(slugLower);
          });
          
          setProducts(filtered.length > 0 ? filtered : [
            { id: 1, name: `${bankName} Millennia`, annual_fee: '₹1,000 / yr', joining_fee: '₹1,000', min_income: '25000', commission_value: '2500', is_ltf: false, rewards: '5% Cashback on Amazon, Flipkart & Swiggy', category: 'credit_card' },
            { id: 2, name: `${bankName} Regalia Gold`, annual_fee: '₹2,500 / yr', joining_fee: '₹2,500', min_income: '100000', commission_value: '3500', is_ltf: false, rewards: '4 Reward Points / ₹150 spent', category: 'credit_card' },
            { id: 3, name: `${bankName} Freedom`, annual_fee: '₹500 / yr', joining_fee: '₹500', min_income: '15000', commission_value: '1800', is_ltf: false, rewards: '10x CashPoints on Movies & Dining', category: 'credit_card' },
            { id: 4, name: `${bankName} MoneyBack+`, annual_fee: '₹500 / yr', joining_fee: '₹500', min_income: '20000', commission_value: '2000', is_ltf: false, rewards: '10X CashPoints on BigBasket & Swiggy', category: 'credit_card' },
            { id: 5, name: `${bankName} Business MoneyBack`, annual_fee: '₹500 / yr', joining_fee: '₹500', min_income: '25000', commission_value: '2200', is_ltf: false, rewards: '5X CashPoints on Business Spends', category: 'credit_card' },
            { id: 6, name: `${bankName} Pixel Play`, annual_fee: 'Lifetime Free', joining_fee: '₹0', min_income: '20000', commission_value: '2200', is_ltf: true, rewards: 'Customizable Merchant Cashback', category: 'credit_card' },
          ]);
        }
      } catch (err) {
        console.warn('Failed to fetch entity products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEntityProducts();
  }, [slug, bankName]);

  const filteredCardProducts = useMemo(() => {
    return products.filter(p => !cardSearch || p.name.toLowerCase().includes(cardSearch.toLowerCase()));
  }, [products, cardSearch]);

  const handleShareCard = (card) => {
    const code = user?.partner_code || 'PARTNER';
    const bankUrl = card.apply_url || card.redirect_url || card.bank_link || `${window.location.origin}/redirect/${card.category || 'credit_card'}?id=${card.id || card.slug}&partner=${code}`;
    
    if (navigator.share) {
      navigator.share({
        title: card.name,
        text: `Apply for ${card.name} directly on official bank portal: ${bankUrl}`,
        url: bankUrl
      }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(bankUrl);
      alert(`Direct Bank Link for ${card.name} copied to clipboard!\n${bankUrl}`);
    } else {
      alert(`Direct Bank Link for ${card.name}:\n${bankUrl}`);
    }
  };

  const handleCompareCard = (card) => {
    if (selectedCompareCards.some(c => c.id === card.id)) {
      const updated = selectedCompareCards.filter(c => c.id !== card.id);
      setSelectedCompareCards(updated);
      if (updated.length === 0) setShowCompareBar(false);
    } else {
      if (selectedCompareCards.length >= 3) {
        alert('You can compare up to 3 cards at a time.');
        return;
      }
      setSelectedCompareCards([...selectedCompareCards, card]);
      setShowCompareBar(true);
    }
  };

  const handleCustomerSearch = () => {
    setCustomerSearched(true);
    if (customerSearchQuery.trim().length >= 3) {
      setFoundCustomer({
        id: 'CUST-8819',
        name: 'Rahul Sharma',
        phone: customerSearchQuery,
        pan: 'ABCDE1234F',
        cibil: 765
      });
    } else {
      setFoundCustomer(null);
    }
  };

  const handleFinalSubmitApply = async () => {
    if (!applyCustomerName.trim()) {
      alert('Please enter customer full name.');
      return;
    }
    if (!applyCustomerMobile.trim() || applyCustomerMobile.trim().length < 10) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      if (applyProcessBy === 'lead_punching' || applyProcessBy === 'linked_share') {
        await api.post('/applications', {
          customer_name: applyCustomerName,
          customer_mobile: applyCustomerMobile,
          product_id: selectedProductWorkspace.id,
          bank_code: selectedProductWorkspace.bank_code || bankName,
          process_type: applyProcessBy
        });
      }
    } catch (e) {
      console.warn('Application submit note:', e);
    }

    if (applyProcessBy === 'direct_bank') {
      const targetUrl = selectedProductWorkspace.apply_url || selectedProductWorkspace.tracking_url || `https://www.google.com/search?q=${encodeURIComponent(selectedProductWorkspace.name + ' apply')}`;
      window.open(targetUrl, '_blank');
    }

    setApplySubmitted(true);
    setTimeout(() => {
      setApplySubmitted(false);
      setSelectedProductWorkspace(null);
      setApplyCustomerName('');
      setApplyCustomerMobile('');
      setApplyProcessBy('lead_punching');
    }, 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '60px' }}>
      
      {/* ── TOP BREADCRUMB / BANK HEADER ── */}
      <div style={{
        background: C.card,
        borderRadius: '20px',
        padding: '18px 24px',
        border: `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: isDark ? 'none' : '0 4px 18px rgba(15,23,42,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={() => navigate('/partner/credit-cards')}
            style={{
              background: isDark ? C.bgSecondary : '#F1F5F9',
              border: `1px solid ${C.border}`,
              borderRadius: '12px',
              padding: '8px 16px',
              color: C.text,
              fontSize: '13.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <MdArrowBack size={18} />
            All Banks
          </button>

          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Bank Credit Cards
            </span>
            <h2 style={{ fontSize: '22px', fontWeight: 900, color: C.text, margin: '2px 0 0' }}>
              🏦 {bankName} Cards
            </h2>
          </div>
        </div>

        {/* Card Search Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: isDark ? C.bgSecondary : '#F8FAFC',
          padding: '9px 16px',
          borderRadius: '14px',
          border: `1px solid ${C.border}`,
          width: isMobile ? '100%' : '280px'
        }}>
          <MdSearch size={20} color={C.textMid} />
          <input
            type="text"
            placeholder={`Search ${bankName} cards...`}
            value={cardSearch}
            onChange={(e) => setCardSearch(e.target.value)}
            style={{
              background: 'none',
              border: 'none',
              color: C.text,
              width: '100%',
              fontSize: '13.5px',
              fontWeight: 600,
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* ── WORKSPACE CONTENT AREA: ALL CARDS OF THIS BANK ── */}
      <main style={{ width: '100%' }}>
        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '48px',
            background: C.card,
            borderRadius: '20px',
            border: `1px solid ${C.border}`,
            color: C.textMid,
            fontWeight: 600
          }}>
            Loading {bankName} credit cards...
          </div>
        ) : filteredCardProducts.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px',
            background: C.card,
            borderRadius: '20px',
            border: `1px solid ${C.border}`,
            color: C.textMid,
            fontWeight: 600
          }}>
            No credit card found matching "{cardSearch}"
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '18px'
          }}>
            {filteredCardProducts.map((card) => {
              const cardImg = getCardSpecificImage(card.name) || card.image || card.logo;
              const keyFeatures = getCardKeyFeatures(card);
              const isComparing = selectedCompareCards.some(c => c.id === card.id);

              return (
                <div
                  key={card.id}
                  style={{
                    background: C.card,
                    borderRadius: '20px',
                    padding: '20px',
                    border: `1.5px solid ${isComparing ? C.primary : C.border}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '16px',
                    boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 18px rgba(15,23,42,0.03)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    position: 'relative'
                  }}
                >
                  <div>
                    {/* Top Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '8px', background: `${C.primary}15`, color: C.primary, textTransform: 'uppercase' }}>
                        {card.is_ltf ? 'Lifetime Free' : 'Credit Card'}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 900, color: '#10B981' }}>
                        Earn ₹{card.commission_value || '2,500'}
                      </span>
                    </div>

                    {/* Card Image & Name Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                      {cardImg ? (
                        <div style={{
                          width: '72px', height: '46px', borderRadius: '8px', overflow: 'hidden',
                          background: isDark ? '#0F172A' : '#F8FAFC', border: `1px solid ${C.border}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', flexShrink: 0
                        }}>
                          <img src={cardImg} alt={card.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                      ) : (
                        <div style={{
                          width: '72px', height: '46px', borderRadius: '8px',
                          background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
                          color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '12px', fontWeight: 900, flexShrink: 0
                        }}>
                          {bankName.substring(0, 3).toUpperCase()}
                        </div>
                      )}

                      <h3 style={{ fontSize: '17px', fontWeight: 900, color: C.text, margin: 0, lineHeight: 1.25 }}>
                        {card.name}
                      </h3>
                    </div>

                    {/* KEY FEATURES ONLY (NO Annual Fee, NO Joining Fee, NO Eligibility) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '10px 0' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Key Features
                      </span>
                      {keyFeatures.slice(0, 3).map((feat, fIdx) => (
                        <div key={fIdx} style={{
                          display: 'flex', alignItems: 'flex-start', gap: '6px',
                          fontSize: '12.5px', fontWeight: 600, color: C.text, lineHeight: 1.35
                        }}>
                          <span style={{ color: C.primary, flexShrink: 0 }}>✓</span>
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ACTION BUTTONS: Apply Now (Primary) + Share, Compare, Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '12px', borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}` }}>
                    {/* Primary Apply Now Button */}
                    <button
                      onClick={() => {
                        setSelectedProductWorkspace(card);
                        setProductWorkspaceTab('apply');
                      }}
                      style={{
                        width: '100%',
                        padding: '11px',
                        borderRadius: '12px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        color: '#FFFFFF',
                        fontWeight: 900,
                        fontSize: '13.5px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <span>Apply Now</span>
                      <MdArrowForward size={16} />
                    </button>

                    {/* Secondary Actions: Share, Compare, Details */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                      {/* Share Button */}
                      <button
                        onClick={() => handleShareCard(card)}
                        style={{
                          padding: '8px 4px', borderRadius: '10px', border: `1px solid ${C.border}`,
                          background: isDark ? C.bgSecondary : '#F8FAFC', color: C.text,
                          fontWeight: 800, fontSize: '12px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                        }}
                      >
                        <MdShare size={14} color={C.primary} />
                        <span>Share</span>
                      </button>

                      {/* Compare Button */}
                      <button
                        onClick={() => handleCompareCard(card)}
                        style={{
                          padding: '8px 4px', borderRadius: '10px',
                          border: `1px solid ${isComparing ? C.primary : C.border}`,
                          background: isComparing ? `${C.primary}18` : isDark ? C.bgSecondary : '#F8FAFC',
                          color: isComparing ? C.primary : C.text,
                          fontWeight: 800, fontSize: '12px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                        }}
                      >
                        <MdSwapHoriz size={15} color={C.primary} />
                        <span>{isComparing ? 'Added' : 'Compare'}</span>
                      </button>

                      {/* Details Button */}
                      <button
                        onClick={() => {
                          setSelectedProductWorkspace(card);
                          setProductWorkspaceTab('overview');
                        }}
                        style={{
                          padding: '8px 4px', borderRadius: '10px', border: `1px solid ${C.border}`,
                          background: isDark ? C.bgSecondary : '#F8FAFC',
                          color: C.text, fontWeight: 800, fontSize: '12px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                        }}
                      >
                        <MdInfo size={14} color={C.primary} />
                        <span>Details</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── FLOATING CARD COMPARISON BAR ── */}
      {showCompareBar && selectedCompareCards.length > 0 && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 1000, background: isDark ? '#1E293B' : '#FFFFFF',
          borderRadius: '16px', padding: '12px 20px',
          border: `1.5px solid ${C.primary}`,
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', gap: '16px'
        }}>
          <span style={{ fontSize: '13px', fontWeight: 800, color: C.text }}>
            Comparing ({selectedCompareCards.length}/3 cards):
          </span>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            {selectedCompareCards.map(c => (
              <span key={c.id} style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '8px', background: `${C.primary}18`, color: C.primary }}>
                {c.name}
              </span>
            ))}
          </div>

          <button
            onClick={() => {
              setSelectedProductWorkspace(selectedCompareCards[0]);
              setProductWorkspaceTab('overview');
            }}
            style={{
              padding: '6px 14px', borderRadius: '10px', border: 'none',
              background: C.primary, color: '#FFF', fontWeight: 800, fontSize: '12.5px', cursor: 'pointer'
            }}
          >
            Compare Details →
          </button>

          <button
            onClick={() => {
              setSelectedCompareCards([]);
              setShowCompareBar(false);
            }}
            style={{ background: 'none', border: 'none', color: C.textMid, cursor: 'pointer' }}
          >
            <MdClose size={18} />
          </button>
        </div>
      )}

      {/* ═══ PRODUCT WORKSPACE MODAL (FULL CARD DETAILS) ═══ */}
      {selectedProductWorkspace && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', padding: '16px'
        }}>
          <div style={{
            background: C.card,
            borderRadius: '24px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: `1px solid ${C.border}`,
            boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
            position: 'relative'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: `1px solid ${C.border}`,
              background: isDark ? C.bgSecondary : '#F8FAFC',
              position: 'sticky', top: 0, zIndex: 10
            }}>
              <button
                onClick={() => setSelectedProductWorkspace(null)}
                style={{
                  position: 'absolute', top: '20px', right: '20px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: C.textMid, fontSize: '18px', fontWeight: 700
                }}
              >
                ✕
              </button>

              <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '10px', background: `${C.primary}15`, color: C.primary, textTransform: 'uppercase' }}>
                Product Workspace Details
              </span>
              <h3 style={{ fontSize: '22px', fontWeight: 900, color: C.text, margin: '4px 0 2px' }}>
                {selectedProductWorkspace.name}
              </h3>
              <span style={{ fontSize: '13px', color: C.textMid, fontWeight: 600 }}>
                Payout: <strong style={{ color: '#10B981' }}>₹{selectedProductWorkspace.commission_value || '2500'}</strong> / approval
              </span>

              {/* Sub-tabs inside Product Workspace */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px', overflowX: 'auto' }}>
                {['overview', 'apply', 'eligibility', 'documents'].map((tabKey) => (
                  <button
                    key={tabKey}
                    onClick={() => setProductWorkspaceTab(tabKey)}
                    style={{
                      padding: '8px 14px', borderRadius: '10px', border: 'none',
                      fontSize: '12.5px', fontWeight: 800, cursor: 'pointer', textTransform: 'capitalize',
                      background: productWorkspaceTab === tabKey ? C.primary : (isDark ? C.card : '#FFFFFF'),
                      color: productWorkspaceTab === tabKey ? '#FFFFFF' : C.text,
                      boxShadow: productWorkspaceTab === tabKey ? `0 3px 10px ${C.primary}30` : 'none'
                    }}
                  >
                    {tabKey}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* TAB 1: OVERVIEW & FULL DETAILS */}
              {productWorkspaceTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '12px' }}>
                    <div style={{ padding: '14px', borderRadius: '12px', background: isDark ? C.bgSecondary : '#F8FAFC', border: `1px solid ${C.border}` }}>
                      <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 700 }}>JOINING FEE</span>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: C.text, marginTop: '2px' }}>{selectedProductWorkspace.joining_fee || '₹500'}</div>
                    </div>
                    <div style={{ padding: '14px', borderRadius: '12px', background: isDark ? C.bgSecondary : '#F8FAFC', border: `1px solid ${C.border}` }}>
                      <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 700 }}>ANNUAL FEE</span>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: C.text, marginTop: '2px' }}>{selectedProductWorkspace.annual_fee || '₹500 / yr'}</div>
                    </div>
                    <div style={{ padding: '14px', borderRadius: '12px', background: isDark ? C.bgSecondary : '#F8FAFC', border: `1px solid ${C.border}` }}>
                      <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 700 }}>MIN ELIGIBILITY</span>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: C.primary, marginTop: '2px' }}>₹{selectedProductWorkspace.min_income ? parseFloat(selectedProductWorkspace.min_income).toLocaleString('en-IN') : '25,000'}/mo</div>
                    </div>
                  </div>

                  <div style={{ padding: '16px', borderRadius: '14px', background: isDark ? C.bgSecondary : '#F8FAFC', border: `1px solid ${C.border}` }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: C.text, margin: '0 0 6px' }}>Full Key Features & Rewards</h4>
                    <p style={{ fontSize: '13px', color: C.textMid, margin: 0, lineHeight: 1.5 }}>
                      {selectedProductWorkspace.rewards || 'Accelerated reward points on online spends, complimentary airport lounge access, and 1% fuel surcharge waiver across India.'}
                    </p>
                  </div>

                  <button
                    onClick={() => setProductWorkspaceTab('apply')}
                    style={{
                      width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                      background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
                      color: '#FFFFFF', fontWeight: 900, fontSize: '15px', cursor: 'pointer',
                      boxShadow: `0 4px 16px ${C.primary}35`
                    }}
                  >
                    Start Application Now
                  </button>
                </div>
              )}

              {/* TAB 2: APPLY WORKFLOW FORM */}
              {productWorkspaceTab === 'apply' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {applySubmitted ? (
                    <div style={{ padding: '36px 24px', textAlign: 'center', background: '#D1FAE5', borderRadius: '20px', border: '1.5px solid #6EE7B7' }}>
                      <MdCheckCircle size={48} color="#059669" />
                      <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#065F46', margin: '12px 0 6px' }}>
                        Application Processed Successfully!
                      </h3>
                      <p style={{ fontSize: '13.5px', color: '#047857', margin: 0, fontWeight: 600 }}>
                        Lead for <strong>{applyCustomerName || 'Customer'}</strong> ({applyCustomerMobile}) has been processed via <strong>{applyProcessBy === 'lead_punching' ? 'Lead Punching Only' : applyProcessBy === 'linked_share' ? 'Linked Share' : 'Direct Bank Process'}</strong> for {selectedProductWorkspace.name}.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* 1. Customer Full Name */}
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: C.text, marginBottom: '6px' }}>
                          Customer Full Name <span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Enter customer full name (e.g. Rahul Sharma)"
                          value={applyCustomerName}
                          onChange={(e) => setApplyCustomerName(e.target.value)}
                          style={{
                            width: '100%', padding: '12px 16px', borderRadius: '12px',
                            border: `1.5px solid ${C.border}`, background: isDark ? C.bgSecondary : '#F8FAFC',
                            color: C.text, fontSize: '14px', fontWeight: 600, outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      {/* 2. Mobile Number */}
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: C.text, marginBottom: '6px' }}>
                          Mobile Number <span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', fontWeight: 800, color: C.textMid }}>
                            +91
                          </span>
                          <input
                            type="tel"
                            maxLength={10}
                            placeholder="10-digit mobile number"
                            value={applyCustomerMobile}
                            onChange={(e) => setApplyCustomerMobile(e.target.value.replace(/[^0-9]/g, ''))}
                            style={{
                              width: '100%', padding: '12px 16px 12px 50px', borderRadius: '12px',
                              border: `1.5px solid ${C.border}`, background: isDark ? C.bgSecondary : '#F8FAFC',
                              color: C.text, fontSize: '14px', fontWeight: 700, outline: 'none',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>
                      </div>

                      {/* 3. Process By Options */}
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: C.text, marginBottom: '8px' }}>
                          Process By <span style={{ color: '#EF4444' }}>*</span>
                        </label>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {[
                            {
                              id: 'lead_punching',
                              num: '1',
                              title: '1. Lead punching only',
                              desc: 'Submit lead directly to CRM pipeline for backend verification & processing',
                              icon: '📝',
                              badgeColor: C.primary
                            },
                            {
                              id: 'linked_share',
                              num: '2',
                              title: '2. Linked share',
                              desc: 'Generate & share custom tracking application link via WhatsApp, SMS, or copy link',
                              icon: '🔗',
                              badgeColor: '#10B981'
                            },
                            {
                              id: 'direct_bank',
                              num: '3',
                              title: '3. Direct bank process',
                              desc: 'Direct customer to bank official portal with partner affiliate tracking parameters',
                              icon: '🏦',
                              badgeColor: '#8B5CF6'
                            }
                          ].map((proc) => {
                            const isSelected = applyProcessBy === proc.id;
                            return (
                              <div
                                key={proc.id}
                                onClick={() => setApplyProcessBy(proc.id)}
                                style={{
                                  padding: '14px 16px',
                                  borderRadius: '14px',
                                  border: `2px solid ${isSelected ? proc.badgeColor : C.border}`,
                                  background: isSelected ? `${proc.badgeColor}12` : isDark ? C.bgSecondary : '#F8FAFC',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  transition: 'all 0.2s'
                                }}
                              >
                                <div style={{
                                  width: '32px', height: '32px', borderRadius: '10px',
                                  background: isSelected ? proc.badgeColor : C.border,
                                  color: isSelected ? '#FFFFFF' : C.textMid,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontWeight: 900, fontSize: '14px', flexShrink: 0
                                }}>
                                  {proc.num}
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '14px' }}>{proc.icon}</span>
                                    <h5 style={{ margin: 0, fontSize: '14px', fontWeight: 900, color: isSelected ? proc.badgeColor : C.text }}>
                                      {proc.title}
                                    </h5>
                                  </div>
                                  <p style={{ margin: '3px 0 0', fontSize: '12px', color: C.textMid, fontWeight: 500, lineHeight: 1.3 }}>
                                    {proc.desc}
                                  </p>
                                </div>

                                <input
                                  type="radio"
                                  name="applyProcessBy"
                                  checked={isSelected}
                                  onChange={() => setApplyProcessBy(proc.id)}
                                  style={{ width: '18px', height: '18px', accentColor: proc.badgeColor, cursor: 'pointer' }}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Linked Share Quick Actions */}
                      {applyProcessBy === 'linked_share' && applyCustomerMobile && (
                        <div style={{ padding: '14px', borderRadius: '12px', background: `${C.green}12`, border: `1px solid ${C.green}40`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 800, color: C.green, textTransform: 'uppercase' }}>
                            🔗 Share Link Ready
                          </span>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => {
                                const text = `Hello ${applyCustomerName || 'Customer'}, apply for ${selectedProductWorkspace.name} here: https://gharkapaisa.in/apply?prod=${selectedProductWorkspace.id}&p=partner`;
                                window.open(`https://wa.me/91${applyCustomerMobile}?text=${encodeURIComponent(text)}`, '_blank');
                              }}
                              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#25D366', color: '#fff', fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                            >
                              💬 Send on WhatsApp
                            </button>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(`https://gharkapaisa.in/apply?prod=${selectedProductWorkspace.id}&p=partner`);
                                alert('Application link copied to clipboard!');
                              }}
                              style={{ padding: '10px 16px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, color: C.text, fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}
                            >
                              📋 Copy Link
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Submit Action Button */}
                      <button
                        onClick={handleFinalSubmitApply}
                        style={{
                          width: '100%', padding: '15px', borderRadius: '14px', border: 'none',
                          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                          color: '#FFF', fontWeight: 900, fontSize: '15.5px', cursor: 'pointer',
                          boxShadow: '0 4px 16px rgba(16,185,129,0.35)', marginTop: '8px'
                        }}
                      >
                        {applyProcessBy === 'lead_punching'
                          ? 'Submit Lead Punching Application'
                          : applyProcessBy === 'linked_share'
                          ? 'Generate & Share Application Link'
                          : 'Proceed to Direct Bank Process'}
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* TAB 3: ELIGIBILITY */}
              {productWorkspaceTab === 'eligibility' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 900, color: C.text, margin: 0 }}>
                    Bank Approval & Eligibility Criteria
                  </h4>

                  <div style={{ padding: '16px', borderRadius: '14px', background: isDark ? C.bgSecondary : '#F8FAFC', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                    <div><strong>Min Age:</strong> 21 years (Max 65 years)</div>
                    <div><strong>Employment:</strong> Salaried (Private Ltd / Govt) or Self-Employed</div>
                    <div><strong>Min Monthly Salary:</strong> ₹{selectedProductWorkspace.min_income ? parseFloat(selectedProductWorkspace.min_income).toLocaleString('en-IN') : '25,000'} / mo</div>
                    <div><strong>Required CIBIL Score:</strong> 720+ with zero 30+ DPD defaults</div>
                  </div>
                </div>
              )}

              {/* TAB 4: DOCUMENTS */}
              {productWorkspaceTab === 'documents' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 900, color: C.text, margin: 0 }}>
                    Required Document Checklist
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '12px' }}>
                    {['PAN Card Copy', 'Aadhaar Card Front & Back', '3 Months Salary Slips', '6 Months Bank Statement'].map((doc, idx) => (
                      <div key={idx} style={{ padding: '14px', borderRadius: '12px', background: isDark ? C.bgSecondary : '#F8FAFC', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700 }}>
                        <span style={{ color: C.primary }}>✓</span>
                        <span>{doc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
