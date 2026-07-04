import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import { resolveAndApply } from '../../../services/applicationResolver';

import { MdFilterList, MdSearch, MdCheckCircle, MdLocalOffer, MdAccessTime, MdInfoOutline } from 'react-icons/md';

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
  const { C } = useTheme();
  const S = makeS(C);

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
        alert("Lead submitted successfully! Check your Lead Management timeline.");
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

  return (
    <div style={{ display: 'flex', gap: '24px', maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px', flexWrap: 'wrap' }}>
      
      {/* ═══ SIDEBAR FILTERS ═══ */}
      <aside style={{ width: '240px', flexShrink: 0 }}>
        <div style={{ ...S.card, padding: '20px', borderRadius: '16px' }}>
          <h3 style={{ fontWeight: 700, color: C.text, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8, fontSize: '15px' }}>
            <MdFilterList /> Filter Market
          </h3>

          {/* Categories */}
          <p style={sectionLabel}>Categories</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '20px' }}>
            {CATEGORIES.map(cat => {
              const isActive = activeCategory === cat.id;
              return (
                <button 
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    textAlign: 'left', padding: '8px 12px', borderRadius: '10px',
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
          <p style={sectionLabel}>Filter by Bank</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '20px' }}>
            {BANKS.map(bank => {
              const isActive = activeBank === bank;
              return (
                <label key={bank} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '6px 8px', cursor: 'pointer'
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
                    onChange={(e) => setActiveBank(e.target.value)}
                    style={{ display: 'none' }}
                  />
                </label>
              );
            })}
          </div>

          <div style={{ height: 1, background: C.border, margin: '0 0 20px' }} />

          {/* Quick Features */}
          <p style={sectionLabel}>Quick Features</p>
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
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Search Header */}
        <div style={{
          ...S.card, padding: '14px 20px', borderRadius: '14px',
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', justifyContent: 'space-between'
        }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
            <MdSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: C.textLight }} size={20} />
            <input 
              type="text" 
              placeholder="Search products, cards, loans..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...S.input, paddingLeft: '38px' }}
            />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: C.textMid, flexShrink: 0 }}>
            Showing <span style={{ color: C.text }}>{filteredProducts.length}</span> Products
          </span>
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
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: C.text, margin: '0 0 4px' }}>No products found</h3>
            <p style={{ color: C.textMid, margin: '0 0 20px' }}>Try adjusting your filters or search terms.</p>
            <button
              onClick={() => { setActiveCategory('all'); setActiveBank('All Banks'); setSearch(''); }}
              style={{ background: 'none', border: 'none', color: C.primary, fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
            {filteredProducts.map((product) => (
              <div key={product.id} style={{
                ...S.card, padding: '20px', borderRadius: '16px',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                transition: 'all 0.2s ease'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <span style={S.tag(C.primary)}>
                      {product.category?.replace(/_/g, ' ') || 'Finance'}
                    </span>
                    <span style={{
                      fontSize: '11px', fontWeight: 700, color: C.textMid,
                      background: C.bgSecondary, padding: '4px 10px', borderRadius: '6px',
                      textTransform: 'uppercase', letterSpacing: '0.5px'
                    }}>
                      {product.bank_code || 'BANK'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '14px' }}>
                    <div style={{
                      width: 56, height: 56, flexShrink: 0, background: C.bgSecondary,
                      borderRadius: '12px', border: `1px solid ${C.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                    }}>
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px' }} />
                      ) : (
                        <MdLocalOffer style={{ color: C.textLight, fontSize: '24px' }} />
                      )}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, color: C.text, margin: '0 0 4px' }}>{product.name}</h3>
                      <p style={{ fontSize: '13px', color: C.textMid, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {product.description || 'No specific details provided for this product.'}
                      </p>
                    </div>
                  </div>

                  {/* Highlights */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    margin: '16px 0', padding: '12px', background: C.bgSecondary,
                    borderRadius: '12px', border: `1px solid ${C.border}`
                  }}>
                    {[
                      { icon: MdCheckCircle, label: 'Approval', val: '82%' },
                      { icon: MdAccessTime, label: 'Time', val: '2 Days' },
                      { icon: MdInfoOutline, label: 'CIBIL', val: '750+' },
                    ].map((h, i) => (
                      <React.Fragment key={h.label}>
                        {i > 0 && <div style={{ width: 1, height: 28, background: C.border }} />}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <h.icon size={12} /> {h.label}
                          </span>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: C.text }}>{h.val}</span>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  <div>
                    <span style={{ fontSize: '10px', color: C.textLight, display: 'block', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Your Payout</span>
                    <span style={{ fontSize: '20px', fontWeight: 800, color: C.green }}>₹{parseFloat(product.commission_value).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{
                      ...S.btn('outline'), padding: '8px 16px', fontSize: '13px', borderRadius: '10px'
                    }}>
                      Details
                    </button>
                    <button
                      onClick={() => handleApply(product)}
                      style={{
                        ...S.btn('primary'), padding: '8px 20px', fontSize: '13px',
                        border: 'none', borderRadius: '10px', cursor: 'pointer'
                      }}
                    >
                      Apply Now
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
          position: 'fixed', inset: 0, zIndex: 50,
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

            <div style={{ padding: '24px', borderBottom: `1px solid ${C.border}` }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: '0 0 4px' }}>Add Customer Lead</h3>
              <p style={{ fontSize: '13px', color: C.textMid, margin: 0 }}>
                Applying for <strong style={{ color: C.primary }}>{selectedProduct.name}</strong>.
              </p>
            </div>

            <form onSubmit={handleSubmitLead} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={S.label}>Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={S.input}
                />
              </div>
              <div>
                <label style={S.label}>Mobile Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  style={S.input}
                />
              </div>
              <div>
                <label style={S.label}>City *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mumbai"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  style={S.input}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', paddingTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  style={{
                    ...S.btn('outline'), flex: 1, padding: '12px', fontSize: '14px',
                    borderRadius: '12px', cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    ...S.btn('primary'), flex: 2, padding: '12px', fontSize: '14px',
                    border: 'none', borderRadius: '12px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.7 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
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
