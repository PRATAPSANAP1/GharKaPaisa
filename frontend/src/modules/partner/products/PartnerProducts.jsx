import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../../services/api';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import { resolveAndApply } from '../../../services/applicationResolver';
import { usePartnerStore } from '../../../app/store/partnerStore';

import { 
  MdFilterList, MdSearch, MdCheckCircle, MdLocalOffer, 
  MdAccessTime, MdInfoOutline, MdClose, MdShare, MdChevronRight 
} from 'react-icons/md';

const CATEGORIES = [
  { id: 'all', label: 'All Products' },
  { id: 'credit_card', label: 'Credit Cards' },
  { id: 'personal_loan', label: 'Personal Loans' },
  { id: 'business_loan', label: 'Business Loans' },
  { id: 'home_loan', label: 'Home Loans' },
  { id: 'insurance', label: 'Insurance' },
  { id: 'demat', label: 'Demat Accounts' },
];

const BANKS = ['All Banks', 'HDFC', 'SBI', 'Axis', 'ICICI', 'BOB', 'IndusInd', 'AU Small Finance', 'IDFC'];

export default function PartnerProducts() {
  const { t } = useTranslation();
  const { C } = useTheme();
  const S = makeS(C);
  
  const { user } = useAuthStore();
  const partnerCode = user?.partner_code || user?.Partner_code || '';

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCopyLink = (product) => {
    if (!partnerCode) {
      alert("Partner profile code not found. Make sure you are fully onboarded.");
      return;
    }
    const trackingLink = `${window.location.origin}/redirect/${product.category}?id=${product.id}&partner=${partnerCode}`;
    navigator.clipboard.writeText(trackingLink);
    alert("Partner tracking link copied to clipboard!");
  };

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeBank, setActiveBank] = useState("All Banks");

  // Lead modal/form state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [mobile, setMobile] = useState("");
  const [city, setCity] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products', { params: { is_active: 'true', limit: 100 } });
      if (res.data?.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      setError("Failed to load available products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleApply = (product) => {
    resolveAndApply(product.id, {
      onInternalForm: () => {
        setSelectedProduct(product);
        setCustomerName("");
        setMobile("");
        setCity("");
      }
    });
  };

  const handleSubmitLead = async (e) => {
    e.preventDefault();
    if (!customerName.trim() || !mobile.trim() || !city.trim()) {
      return alert("Customer Name, Mobile number, and City are required.");
    }
    if (!/^[6-9]\d{9}$/.test(mobile.trim())) {
      return alert("Please enter a valid 10-digit mobile number.");
    }

    setSubmitting(true);
    try {
      const res = await api.post('/leads', {
        productId: selectedProduct.id,
        customerName: customerName.trim(),
        mobile: mobile.trim(),
        city: city.trim()
      });

      if (res.data?.success) {
        usePartnerStore.getState().fetchCustomers().catch(() => {});
        alert("Lead submitted successfully! Customer added to your Customers page.");
        setSelectedProduct(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit lead. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter Logic
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                        p.description?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === 'all' || p.category === activeCategory;
    const matchBank = activeBank === 'All Banks' || p.bank_code === activeBank || p.name.includes(activeBank);
    
    return matchSearch && matchCategory && matchBank;
  });

  const sectionLabel = { fontSize: '11px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' };

  // Helper to render filter options block
  const renderFilterContent = () => (
    <div style={{ ...S.card, padding: '20px', borderRadius: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontWeight: 700, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: '15px' }}>
          <MdFilterList /> Filter Market
        </h3>
        {isMobile && (
          <button 
            onClick={() => setShowMobileFilter(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMid, padding: '4px' }}
          >
            <MdClose size={20} />
          </button>
        )}
      </div>

      {/* Categories */}
      <p style={sectionLabel}>{t("Categories")}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '20px' }}>
        {CATEGORIES.map(cat => {
          const isActive = activeCategory === cat.id;
          return (
            <button 
              key={cat.id}
              onClick={() => { setActiveCategory(cat.id); if (isMobile) setShowMobileFilter(false); }}
              style={{
                textAlign: 'left', padding: '9px 12px', borderRadius: '10px',
                fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: isActive ? `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})` : 'transparent',
                color: isActive ? '#fff' : C.textMid,
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      <div style={{ height: 1, background: C.border, margin: '0 0 20px' }} />

      {/* Banks */}
      <p style={sectionLabel}>{t("Filter by Bank")}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '20px' }}>
        {BANKS.map(bank => {
          const isActive = activeBank === bank;
          return (
            <label key={bank} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '8px', cursor: 'pointer', borderRadius: '8px',
              background: isActive ? `${C.primary}08` : 'transparent'
            }}>
              <div style={{
                width: 16, height: 16, borderRadius: '4px',
                border: `1.5px solid ${isActive ? C.primary : C.border}`,
                background: isActive ? C.primary : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s ease', flexShrink: 0
              }}>
                {isActive && <MdCheckCircle style={{ color: '#fff', fontSize: '12px' }} />}
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: isActive ? C.text : C.textMid }}>{bank}</span>
              <input 
                type="radio" 
                name="bankFilter" 
                value={bank}
                checked={activeBank === bank}
                onChange={(e) => { setActiveBank(e.target.value); if (isMobile) setShowMobileFilter(false); }}
                style={{ display: 'none' }}
              />
            </label>
          );
        })}
      </div>

      <div style={{ height: 1, background: C.border, margin: '0 0 20px' }} />

      {/* Quick Features */}
      <p style={sectionLabel}>{t("Quick Features")}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {[
          { label: 'High Approval', color: C.green },
          { label: 'Lifetime Free', color: C.gold },
          { label: 'Highest Payout', color: C.primary }
        ].map(f => (
          <span key={f.label} style={{
            ...S.tag(f.color), padding: '6px 10px', fontSize: '11px', cursor: 'pointer'
          }}>
            {f.label}
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap: '20px',
      maxWidth: '1280px',
      margin: '0 auto',
      paddingBottom: isMobile ? '80px' : '40px',
      boxSizing: 'border-box'
    }}>
      
      {/* ═══ DESKTOP SIDEBAR FILTERS ═══ */}
      {!isMobile && (
        <aside style={{ width: '240px', flexShrink: 0, position: 'sticky', top: '94px', alignSelf: 'start', zIndex: 10 }}>
          {renderFilterContent()}
        </aside>
      )}

      {/* ═══ MOBILE FILTER MODAL / DRAWER ═══ */}
      {isMobile && showMobileFilter && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'flex-end'
        }}>
          <div style={{
            width: '85%', maxWidth: '320px', height: '100%',
            background: C.card, overflowY: 'auto', padding: '16px',
            boxShadow: '-10px 0 30px rgba(0,0,0,0.2)'
          }}>
            {renderFilterContent()}
          </div>
        </div>
      )}

      {/* ═══ MAIN CONTENT ═══ */}
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Search & Mobile Control Header */}
        <div style={{
          ...S.card, padding: isMobile ? '12px 16px' : '14px 20px', borderRadius: '16px',
          display: 'flex', flexDirection: 'column', gap: '12px'
        }}>
          {/* Search bar row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <MdSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: C.textLight }} size={20} />
              <input 
                type="text" 
                placeholder={t("Search products, cards, loans...")} 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ ...S.input, paddingLeft: '38px', height: '42px', fontSize: '13px' }}
              />
            </div>
            {isMobile && (
              <button
                onClick={() => setShowMobileFilter(true)}
                style={{
                  background: `${C.primary}12`,
                  border: `1.5px solid ${C.primary}30`,
                  color: C.primary,
                  borderRadius: '10px',
                  padding: '0 12px',
                  height: '42px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                <MdFilterList size={18} /> Filters
              </button>
            )}
          </div>

          {/* Mobile Horizontal Category Scroll Chips */}
          {isMobile && (
            <div style={{
              display: 'flex',
              overflowX: 'auto',
              gap: '8px',
              paddingBottom: '4px',
              msOverflowStyle: 'none',
              scrollbarWidth: 'none'
            }}>
              {CATEGORIES.map(cat => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    style={{
                      whiteSpace: 'nowrap',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: isActive ? 'none' : `1px solid ${C.border}`,
                      background: isActive ? C.primary : C.bgSecondary,
                      color: isActive ? '#FFFFFF' : C.textMid,
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Results count & Active filter status */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: C.textMid }}>
            <span>
              Showing <strong style={{ color: C.text }}>{filteredProducts.length}</strong> Products
            </span>
            {(activeCategory !== 'all' || activeBank !== 'All Banks' || search) && (
              <button
                onClick={() => { setActiveCategory('all'); setActiveBank('All Banks'); setSearch(''); }}
                style={{ background: 'none', border: 'none', color: C.primary, fontWeight: 700, cursor: 'pointer', fontSize: '11px' }}
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {error && (
          <div style={{
            padding: '14px 18px', background: `${C.red}12`, border: `1px solid ${C.red}25`,
            color: C.red, borderRadius: '12px', fontWeight: 600, fontSize: '13px'
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <span style={{
              width: 32, height: 32, borderRadius: '50%',
              border: `3px solid ${C.border}`, borderTopColor: C.primary,
              animation: 'spin .8s linear infinite', display: 'inline-block'
            }} />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{
            ...S.card, padding: '60px 24px', textAlign: 'center', borderRadius: '16px'
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: C.bgSecondary,
              color: C.textLight, display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <MdSearch size={28} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: C.text, margin: '0 0 4px' }}>{t("No products found")}</h3>
            <p style={{ color: C.textMid, margin: '0 0 20px', fontSize: '13px' }}>{t("Try adjusting your filters or search terms.")}</p>
            <button
              onClick={() => { setActiveCategory('all'); setActiveBank('All Banks'); setSearch(''); }}
              style={{ background: 'none', border: 'none', color: C.primary, fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
            gap: '16px'
          }}>
            {filteredProducts.map((product) => (
              <div key={product.id} style={{
                ...S.card,
                padding: isMobile ? '16px' : '20px',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '14px',
                transition: 'all 0.2s ease'
              }}>
                <div>
                  {/* Category Tag & Bank Code Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '8px' }}>
                    <span style={{ ...S.tag(C.primary), fontSize: '10px', padding: '4px 8px' }}>
                      {product.category?.replace(/_/g, ' ') || 'Finance'}
                    </span>
                    <span style={{
                      fontSize: '10.5px', fontWeight: 700, color: C.textMid,
                      background: C.bgSecondary, padding: '4px 8px', borderRadius: '6px',
                      textTransform: 'uppercase', letterSpacing: '0.5px'
                    }}>
                      {product.bank_code || 'BANK'}
                    </span>
                  </div>

                  {/* Product Logo & Info Header */}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: isMobile ? 48 : 56,
                      height: isMobile ? 48 : 56,
                      flexShrink: 0,
                      background: C.bgSecondary,
                      borderRadius: '12px',
                      border: `1px solid ${C.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}>
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }} />
                      ) : (
                        <MdLocalOffer style={{ color: C.textLight, fontSize: '22px' }} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: isMobile ? '15px' : '16px', fontWeight: 800, color: C.text, margin: '0 0 4px', lineHeight: 1.3 }}>{product.name}</h3>
                      <p style={{ fontSize: '12px', color: C.textMid, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>
                        {product.description || 'No specific details provided for this product.'}
                      </p>
                    </div>
                  </div>

                  {/* Highlights Bar */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-around',
                    margin: '14px 0 0', padding: '10px 8px', background: C.bgSecondary,
                    borderRadius: '12px', border: `1px solid ${C.border}`
                  }}>
                    {[
                      { icon: MdCheckCircle, label: 'Approval', val: '82%' },
                      { icon: MdAccessTime, label: 'Time', val: '2 Days' },
                      { icon: MdInfoOutline, label: 'CIBIL', val: '750+' },
                    ].map((h, i) => (
                      <React.Fragment key={h.label}>
                        {i > 0 && <div style={{ width: 1, height: 24, background: C.border }} />}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                          <span style={{ fontSize: '9.5px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 2 }}>
                            <h.icon size={11} /> {h.label}
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: 800, color: C.text, marginTop: '2px' }}>{h.val}</span>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div style={{
                  borderTop: `1px solid ${C.border}`,
                  paddingTop: '12px',
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: isMobile ? '10px' : '8px',
                  justifyContent: 'space-between',
                  alignItems: isMobile ? 'stretch' : 'center',
                  marginTop: 'auto'
                }}>
                  {/* Payout Tag */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '10px', color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t("Your Payout")}</span>
                    <span style={{ fontSize: '19px', fontWeight: 800, color: C.green }}>₹{parseFloat(product.commission_value || 0).toLocaleString('en-IN')}</span>
                  </div>

                  {/* Buttons */}
                  <div style={{ display: 'flex', gap: '6px', width: isMobile ? '100%' : 'auto' }}>
                    {(product.public_url || product.partner_url) && (
                      <button
                        onClick={() => handleCopyLink(product)}
                        type="button"
                        style={{
                          ...S.btn('outline'),
                          flex: isMobile ? 1 : 'none',
                          padding: '8px 10px',
                          fontSize: '11.5px',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                      >
                        <MdShare size={14} /> Link
                      </button>
                    )}
                    <button
                      onClick={() => handleApply(product)}
                      style={{
                        ...S.btn('primary'),
                        flex: isMobile ? 2 : 'none',
                        padding: '8px 16px',
                        fontSize: '12.5px',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      Apply Now <MdChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ═══ LEAD SUBMISSION MODAL ═══ */}
      {selectedProduct && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', padding: '16px'
        }}>
          <div style={{
            background: C.card, width: '100%', maxWidth: '440px',
            borderRadius: '20px', overflow: 'hidden', border: `1px solid ${C.border}`,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)', position: 'relative'
          }}>
            <button
              onClick={() => setSelectedProduct(null)}
              style={{
                position: 'absolute', top: '14px', right: '14px',
                background: C.bgSecondary, border: 'none', cursor: 'pointer',
                width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: C.textMid, fontSize: '16px', fontWeight: 700
              }}
            >
              ✕
            </button>

            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}` }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: '0 0 4px' }}>{t("Add Customer Lead")}</h3>
              <p style={{ fontSize: '13px', color: C.textMid, margin: 0 }}>
                Applying for <strong style={{ color: C.primary }}>{selectedProduct.name}</strong>.
              </p>
            </div>

            <form onSubmit={handleSubmitLead} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={S.label}>{t("Customer Full Name *")}</label>
                <input
                  type="text"
                  required
                  placeholder={t("e.g. Rahul Sharma")}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{ ...S.input, height: '42px', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={S.label}>{t("Mobile Number *")}</label>
                <input
                  type="tel"
                  required
                  placeholder={t("10-digit mobile number")}
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  style={{ ...S.input, height: '42px', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={S.label}>{t("City *")}</label>
                <input
                  type="text"
                  required
                  placeholder={t("e.g. Mumbai")}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  style={{ ...S.input, height: '42px', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', paddingTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  style={{
                    ...S.btn('outline'), flex: 1, padding: '12px', fontSize: '13px',
                    borderRadius: '12px', cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    ...S.btn('primary'), flex: 2, padding: '12px', fontSize: '13px',
                    border: 'none', borderRadius: '12px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.7 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700
                  }}
                >
                  {submitting ? (
                    <span style={{
                      width: 18, height: 18, borderRadius: '50%',
                      border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                      animation: 'spin .8s linear infinite', display: 'inline-block'
                    }} />
                  ) : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
