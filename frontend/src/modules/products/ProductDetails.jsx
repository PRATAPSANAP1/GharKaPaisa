import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useTheme, makeS } from '../../contexts/ThemeContext';
import { 
  MdArrowBack, MdCheckCircle, MdStar, MdShare, MdBookmarkBorder, 
  MdBookmark, MdCompareArrows, MdExpandMore, MdExpandLess,
  MdCreditCard, MdAccountBalance, MdAttachMoney, MdVerifiedUser,
  MdFlightTakeoff, MdLocalGasStation, MdRestaurant, MdMovie,
  MdShield, MdLoyalty, MdFolderOpen, MdHelpOutline
} from 'react-icons/md';
import { resolveAndApply } from '../../services/applicationResolver';
import CardApplyVerificationModal from '../home/components/CreditCards/CardApplyVerificationModal';

export default function ProductDetails() {
  const { category, slug, id } = useParams();
  const productIdentifier = slug || id;
  const navigate = useNavigate();
  const { C, isDark } = useTheme();
  const S = makeS(C);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [verifyCard, setVerifyCard] = useState(null);

  useEffect(() => {
    if (!productIdentifier) return;
    setLoading(true);
    setErrorMsg("");

    api.get(`/products/${productIdentifier}`)
      .then(res => {
        if (res.data?.success) {
          const raw = res.data.data;
          // Format payload consistently
          const formatted = {
            product: raw,
            bank: raw.bank || { name: raw.bank_name, logo_url: raw.bank_logo, short_code: raw.bank_code },
            fees: raw.fees || raw.fees_structure || {},
            eligibility: raw.eligibility || raw.eligibility_criteria || {},
            features: raw.features || raw.features_list || [],
            benefits: raw.benefits || raw.benefits_list || [],
            documents: raw.documents || raw.required_documents || [],
            compare: raw.compare || raw.compare_specs || {},
            faqs: raw.faqs || [],
            gallery: raw.gallery || []
          };
          setData(formatted);
          setIsBookmarked(!!raw.is_bookmarked);
        } else {
          setErrorMsg("Product details unavailable.");
        }
      })
      .catch(err => {
        console.error("[ProductDetails] Fetch Error:", err);
        setErrorMsg("Failed to load product details.");
      })
      .finally(() => setLoading(false));
  }, [productIdentifier]);

  const handleApply = () => {
    if (!data?.product) return;
    const prod = data.product;
    const bankName = data.bank?.name || prod.bank_name || 'Bank';

    resolveAndApply(prod.name, {
      onInternalForm: () => {
        setVerifyCard({
          cardName: prod.name,
          bankName: bankName,
          bankId: (data.bank?.short_code || bankName).toLowerCase().replace(/[^a-z]/g, '')
        });
      }
    });
  };

  const handleBookmark = async () => {
    if (!data?.product?.id) return;
    try {
      const res = await api.post('/products/bookmark', { product_id: data.product.id });
      if (res.data?.success) {
        setIsBookmarked(!isBookmarked);
      }
    } catch (e) {
      console.warn("Bookmark toggle requires authentication");
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: data?.product?.name || 'GharKaPaisa Product',
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Product URL copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textLight }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '36px', height: '36px', border: `4px solid ${C.teal}`, borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontWeight: 700 }}>Loading product specifications...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (errorMsg || !data?.product) {
    return (
      <div style={{ background: C.bg, minHeight: '100vh', padding: '60px 20px', textAlign: 'center', color: C.text }}>
        <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '12px' }}>Product Not Found</h2>
        <p style={{ color: C.textLight, marginBottom: '24px' }}>{errorMsg || "The requested product could not be loaded."}</p>
        <button onClick={() => navigate(-1)} style={{ padding: '10px 20px', background: C.teal, color: '#FFF', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}>
          ← Back to Marketplace
        </button>
      </div>
    );
  }

  const { product, bank, fees, eligibility, features, benefits, documents, compare, faqs, gallery } = data;

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: 'Inter, sans-serif', paddingBottom: '100px' }}>
      
      {/* VERIFICATION MODAL */}
      {verifyCard && (
        <CardApplyVerificationModal
          card={verifyCard}
          onClose={() => setVerifyCard(null)}
          C={C}
        />
      )}

      {/* BACK NAVIGATION BAR */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '16px 20px 0' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent',
            border: 'none', color: C.textLight, fontWeight: 700, fontSize: '13.5px', cursor: 'pointer'
          }}
        >
          <MdArrowBack size={18} />
          <span>Back</span>
        </button>
      </div>

      <div style={{ maxWidth: '1100px', margin: '16px auto 0', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

        {/* ── HERO SECTION ── */}
        <div style={{
          background: isDark ? 'linear-gradient(135deg, #1E293B, #0F172A)' : 'linear-gradient(135deg, #FFFFFF, #F1F5F9)',
          borderRadius: '24px',
          border: `1px solid ${C.border}`,
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
          position: 'relative'
        }}>
          {/* BANNER BACKGROUND IMAGE (IF EXISTS) */}
          {product.banner_url && (
            <div style={{ height: '140px', width: '100%', overflow: 'hidden', position: 'relative' }}>
              <img src={product.banner_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.6))' }} />
            </div>
          )}

          <div style={{ padding: '28px', display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center' }}>
            
            {/* CARD IMAGE & BANK LOGO */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '160px', height: '100px', borderRadius: '14px', overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)', background: C.card,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px'
              }}>
                <img src={product.image_url || bank.logo_url} alt={product.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </div>
              {bank.logo_url && (
                <img src={bank.logo_url} alt={bank.name} style={{ height: '22px', maxWidth: '100px', objectFit: 'contain' }} />
              )}
            </div>

            {/* DETAILS & TITLE */}
            <div style={{ flex: 1, minWidth: '260px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{
                  padding: '4px 12px', borderRadius: '20px', background: `${C.teal}20`,
                  color: C.teal, fontWeight: 800, fontSize: '11px', textTransform: 'uppercase'
                }}>
                  {(product.category || category || 'FINANCIAL').replace('_', ' ')}
                </span>
                {bank.name && (
                  <span style={{ fontSize: '12px', fontWeight: 700, color: C.textLight }}>
                    Issued by {bank.name}
                  </span>
                )}
              </div>

              <h1 style={{ fontSize: '26px', fontWeight: 900, color: C.text, margin: '0 0 8px 0', lineHeight: 1.2 }}>
                {product.name}
              </h1>

              <p style={{ fontSize: '13.5px', color: C.textLight, margin: 0, lineHeight: 1.5 }}>
                {product.short_description || product.description || 'Exclusive financial product offering tailored rewards, low fees, and flexible benefits.'}
              </p>
            </div>

            {/* ACTION BUTTONS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '160px' }}>
              <button
                onClick={handleApply}
                style={{
                  padding: '14px 28px', borderRadius: '14px', border: 'none',
                  background: 'linear-gradient(135deg, #10B981, #059669)', color: '#FFFFFF',
                  fontWeight: 900, fontSize: '15px', cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(16, 185, 129, 0.3)', textAlign: 'center'
                }}
              >
                Apply Now
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleBookmark}
                  style={{
                    flex: 1, padding: '8px', borderRadius: '10px', border: `1px solid ${C.border}`,
                    background: C.card, color: isBookmarked ? C.teal : C.text, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '12px', fontWeight: 700
                  }}
                >
                  {isBookmarked ? <MdBookmark size={18} /> : <MdBookmarkBorder size={18} />}
                  <span>{isBookmarked ? 'Saved' : 'Save'}</span>
                </button>

                <button
                  onClick={handleShare}
                  style={{
                    flex: 1, padding: '8px', borderRadius: '10px', border: `1px solid ${C.border}`,
                    background: C.card, color: C.text, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '12px', fontWeight: 700
                  }}
                >
                  <MdShare size={18} />
                  <span>Share</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* ── QUICK INFORMATION HIGHLIGHT CARDS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px' }}>
          {[
            { label: 'Joining Fee', value: fees.joining_fee || '₹0', icon: MdAttachMoney, color: '#10B981' },
            { label: 'Annual Fee', value: fees.annual_fee || product.annual_fee || '₹500', icon: MdCreditCard, color: '#3B82F6' },
            { label: 'Min Monthly Income', value: eligibility.min_income ? `₹${eligibility.min_income.toLocaleString()}` : '₹25,000', icon: MdAccountBalance, color: '#8B5CF6' },
            { label: 'Required Age', value: eligibility.min_age ? `${eligibility.min_age} - ${eligibility.max_age || 60} yrs` : '21 - 60 yrs', icon: MdVerifiedUser, color: '#F59E0B' },
            { label: 'Reward Rate / Interest', value: compare.reward_rate || fees.interest_rate || 'Up to 5%', icon: MdLoyalty, color: '#EC4899' },
            { label: 'Credit Score', value: eligibility.cibil_required ? `${eligibility.cibil_required}+ CIBIL` : '750+ CIBIL', icon: MdStar, color: '#6366F1' }
          ].map((item, idx) => (
            <div key={idx} style={{
              background: C.card, borderRadius: '16px', padding: '16px', border: `1px solid ${C.border}`,
              display: 'flex', flexDirection: 'column', gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: item.color }}>
                <item.icon size={20} />
                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: C.textLight }}>{item.label}</span>
              </div>
              <span style={{ fontSize: '16px', fontWeight: 900, color: C.text }}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* ── KEY FEATURES ── */}
        {features.length > 0 && (
          <div style={{ background: C.card, borderRadius: '20px', padding: '24px', border: `1px solid ${C.border}` }}>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: C.text, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MdStar color={C.teal} size={22} />
              <span>Key Features</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {features.map((f, idx) => {
                const title = typeof f === 'string' ? f : f.title;
                const desc = typeof f === 'object' ? f.description : '';
                return (
                  <div key={idx} style={{
                    background: isDark ? C.bgSecondary : '#F8FAFC', borderRadius: '14px',
                    padding: '14px', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'flex-start', gap: '10px'
                  }}>
                    <MdCheckCircle color={C.teal} size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: C.text }}>{title}</h4>
                      {desc && <p style={{ margin: '4px 0 0', fontSize: '11.5px', color: C.textLight, lineHeight: 1.3 }}>{desc}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── BENEFITS SECTION ── */}
        {benefits.length > 0 && (
          <div style={{ background: C.card, borderRadius: '20px', padding: '24px', border: `1px solid ${C.border}` }}>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: C.text, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MdLoyalty color={C.teal} size={22} />
              <span>Exclusive Benefits</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
              {benefits.map((b, idx) => (
                <div key={idx} style={{
                  background: isDark ? C.bgSecondary : '#F8FAFC', borderRadius: '16px',
                  padding: '16px', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: '6px'
                }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: C.text }}>{b.title}</h4>
                  <p style={{ margin: 0, fontSize: '12.5px', color: C.textLight, lineHeight: 1.4 }}>{b.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ELIGIBILITY & FEES TABLE ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          
          {/* ELIGIBILITY CRITERIA */}
          <div style={{ background: C.card, borderRadius: '20px', padding: '24px', border: `1px solid ${C.border}` }}>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: C.text, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MdVerifiedUser color={C.teal} size={22} />
              <span>Eligibility Criteria</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}`, paddingBottom: '8px' }}>
                <span style={{ color: C.textLight }}>Age Limit</span>
                <span style={{ fontWeight: 800, color: C.text }}>{eligibility.min_age ? `${eligibility.min_age} - ${eligibility.max_age || 60} years` : '21 - 60 years'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}`, paddingBottom: '8px' }}>
                <span style={{ color: C.textLight }}>Minimum Income</span>
                <span style={{ fontWeight: 800, color: C.text }}>{eligibility.min_income ? `₹${eligibility.min_income.toLocaleString()} / month` : '₹25,000 / month'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}`, paddingBottom: '8px' }}>
                <span style={{ color: C.textLight }}>Employment Type</span>
                <span style={{ fontWeight: 800, color: C.text }}>{eligibility.employment_type || 'Salaried / Self-Employed'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}`, paddingBottom: '8px' }}>
                <span style={{ color: C.textLight }}>CIBIL Score</span>
                <span style={{ fontWeight: 800, color: C.text }}>{eligibility.cibil_required ? `${eligibility.cibil_required}+` : '750+'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: C.textLight }}>Residential Status</span>
                <span style={{ fontWeight: 800, color: C.text }}>{eligibility.resident_type || 'Indian Resident'}</span>
              </div>
            </div>
          </div>

          {/* FEES & CHARGES */}
          <div style={{ background: C.card, borderRadius: '20px', padding: '24px', border: `1px solid ${C.border}` }}>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: C.text, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MdAttachMoney color={C.teal} size={22} />
              <span>Fees & Charges</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}`, paddingBottom: '8px' }}>
                <span style={{ color: C.textLight }}>Joining Fee</span>
                <span style={{ fontWeight: 800, color: C.text }}>{fees.joining_fee || '₹0'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}`, paddingBottom: '8px' }}>
                <span style={{ color: C.textLight }}>Annual Fee</span>
                <span style={{ fontWeight: 800, color: C.text }}>{fees.annual_fee || product.annual_fee || '₹500'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}`, paddingBottom: '8px' }}>
                <span style={{ color: C.textLight }}>Interest Rate</span>
                <span style={{ fontWeight: 800, color: C.text }}>{fees.interest_rate || '3.5% p.m.'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}`, paddingBottom: '8px' }}>
                <span style={{ color: C.textLight }}>Fuel Surcharge</span>
                <span style={{ fontWeight: 800, color: C.text }}>{fees.fuel_surcharge || '1% Waiver'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: C.textLight }}>Forex Charges</span>
                <span style={{ fontWeight: 800, color: C.text }}>{fees.foreign_markup || '3.5%'}</span>
              </div>
            </div>
          </div>

        </div>

        {/* ── REQUIRED DOCUMENTS ── */}
        {documents.length > 0 && (
          <div style={{ background: C.card, borderRadius: '20px', padding: '24px', border: `1px solid ${C.border}` }}>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: C.text, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MdFolderOpen color={C.teal} size={22} />
              <span>Required Documents</span>
            </h3>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {documents.map((doc, idx) => (
                <div key={idx} style={{
                  padding: '8px 16px', borderRadius: '12px', background: isDark ? C.bgSecondary : '#F1F5F9',
                  border: `1px solid ${C.border}`, fontWeight: 700, fontSize: '13px', color: C.text,
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                  <MdCheckCircle color={C.teal} size={16} />
                  <span>{typeof doc === 'string' ? doc : doc.title || doc.document_type}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── FREQUENTLY ASKED QUESTIONS (FAQS ACCORDION) ── */}
        {faqs.length > 0 && (
          <div style={{ background: C.card, borderRadius: '20px', padding: '24px', border: `1px solid ${C.border}` }}>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: C.text, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MdHelpOutline color={C.teal} size={22} />
              <span>Frequently Asked Questions</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {faqs.map((faq, idx) => {
                const isOpen = expandedFaq === idx;
                return (
                  <div key={idx} style={{
                    borderRadius: '12px', border: `1px solid ${C.border}`, overflow: 'hidden', background: isDark ? C.bgSecondary : '#F8FAFC'
                  }}>
                    <button
                      onClick={() => setExpandedFaq(isOpen ? null : idx)}
                      style={{
                        width: '100%', padding: '14px 16px', display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', background: 'transparent', border: 'none', textAlign: 'left',
                        fontWeight: 800, fontSize: '14px', color: C.text, cursor: 'pointer'
                      }}
                    >
                      <span>{faq.question}</span>
                      {isOpen ? <MdExpandLess size={20} /> : <MdExpandMore size={20} />}
                    </button>
                    {isOpen && (
                      <div style={{ padding: '0 16px 14px 16px', fontSize: '13px', color: C.textLight, lineHeight: 1.5 }}>
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── GALLERY / OFFERS CAROUSEL ── */}
        {gallery.length > 0 && (
          <div style={{ background: C.card, borderRadius: '20px', padding: '24px', border: `1px solid ${C.border}` }}>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: C.text, margin: '0 0 16px 0' }}>Promotional Offers & Banners</h3>
            <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
              {gallery.map((g, idx) => (
                <div key={idx} style={{ flexShrink: 0, width: '280px', borderRadius: '14px', overflow: 'hidden', border: `1px solid ${C.border}` }}>
                  <img src={g.image_url} alt={g.title || 'Offer'} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ── STICKY FOOTER CTA BAR ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 900,
        background: isDark ? '#0F172A' : '#FFFFFF',
        borderTop: `1px solid ${C.border}`,
        padding: '12px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.1)'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 900, color: C.text }}>{product.name}</h4>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: C.teal, fontWeight: 800 }}>
              Annual Fee: {fees.annual_fee || product.annual_fee || '₹500'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleApply}
              style={{
                padding: '12px 28px', borderRadius: '12px', border: 'none',
                background: 'linear-gradient(135deg, #10B981, #059669)', color: '#FFFFFF',
                fontWeight: 900, fontSize: '14px', cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
              }}
            >
              Apply Now
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
