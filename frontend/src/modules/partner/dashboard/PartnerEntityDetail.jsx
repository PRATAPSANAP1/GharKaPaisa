import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import api from '../../../services/api';
import { 
  MdDashboard, MdStorefront, MdArrowBack, MdCheckCircle, 
  MdAccountBalanceWallet, MdDescription, MdTrendingUp, MdAdd
} from 'react-icons/md';

// Helpers to format slug names
const formatEntityTitle = (slug) => {
  if (!slug) return 'Entity Overview';
  const formatted = slug.replace(/-/g, ' ').toUpperCase();
  return formatted.includes('CARD') || formatted.includes('LOAN') || formatted.includes('INSURANCE') 
    ? formatted 
    : `${formatted} Performance`;
};

export default function PartnerEntityDetail() {
  const { bankSlug, loanTypeSlug, insuranceTypeSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { C, isDark } = useTheme();
  const S = makeS(C);
  const { t } = useTranslation();

  const slug = bankSlug || loanTypeSlug || insuranceTypeSlug || 'overview';
  
  const categoryType = useMemo(() => {
    if (location.pathname.includes('/partner/loans')) return 'loan';
    if (location.pathname.includes('/partner/insurance')) return 'insurance';
    return 'credit_card';
  }, [location.pathname]);

  const activeTab = useMemo(() => {
    return location.pathname.endsWith('/product') ? 'product' : 'dashboard';
  }, [location.pathname]);

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchEntityProducts = async () => {
      setLoading(true);
      try {
        const res = await api.get('/products', { params: { is_active: 'true', limit: 100 } });
        if (res.data?.success) {
          const allProds = res.data.data || [];
          const slugLower = slug.toLowerCase().replace(/-/g, '');
          const filtered = allProds.filter(p => {
            const nameLower = (p.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            const bankLower = (p.bank_name || p.bank_code || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            const catLower = (p.category || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            return nameLower.includes(slugLower) || bankLower.includes(slugLower) || catLower.includes(slugLower);
          });
          setProducts(filtered.length > 0 ? filtered : allProds.slice(0, 6));
        }
      } catch (err) {
        console.warn('Failed to fetch entity products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEntityProducts();
  }, [slug]);

  const basePath = useMemo(() => {
    if (categoryType === 'loan') return `/partner/loans/${slug}`;
    if (categoryType === 'insurance') return `/partner/insurance/${slug}`;
    return `/partner/credit-cards/${slug}`;
  }, [categoryType, slug]);

  const entityTitle = useMemo(() => formatEntityTitle(slug), [slug]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
      
      {/* ── TOP BREADCRUMB / HEADER ── */}
      <div style={{
        background: C.card,
        borderRadius: '20px',
        padding: '16px 24px',
        border: `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => {
              if (categoryType === 'loan') navigate('/partner/loans');
              else if (categoryType === 'insurance') navigate('/partner/insurance');
              else navigate('/partner/credit-cards');
            }}
            style={{
              background: isDark ? C.bgSecondary : '#F1F5F9',
              border: `1px solid ${C.border}`,
              borderRadius: '10px',
              padding: '6px 12px',
              color: C.text,
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <MdArrowBack size={16} />
            Back to Category
          </button>

          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Entity Management
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: 900, color: C.text, margin: '2px 0 0' }}>
              {entityTitle}
            </h2>
          </div>
        </div>

        <button
          onClick={() => navigate('/partner/leads/add')}
          style={{
            padding: '10px 18px', borderRadius: '12px', border: 'none',
            background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
            color: '#FFFFFF', fontWeight: 800, fontSize: '13px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
            boxShadow: `0 4px 16px ${C.primary}35`
          }}
        >
          <MdAdd size={18} />
          Add Lead Now
        </button>
      </div>

      {/* ── MAIN CONTAINER WITH DEDICATED ENTITY SIDEBAR ── */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: '20px',
        alignItems: 'flex-start'
      }}>
        {/* DEDICATED ENTITY SECONDARY SIDEBAR */}
        <aside style={{
          width: isMobile ? '100%' : '240px',
          background: C.card,
          borderRadius: '20px',
          padding: '16px',
          border: `1px solid ${C.border}`,
          display: 'flex',
          flexDirection: isMobile ? 'row' : 'column',
          gap: '8px',
          flexShrink: 0
        }}>
          <Link
            to={basePath}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 800,
              textDecoration: 'none',
              color: activeTab === 'dashboard' ? '#FFFFFF' : C.text,
              background: activeTab === 'dashboard' ? `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)` : 'transparent',
              flex: isMobile ? 1 : 'initial',
              justifyContent: isMobile ? 'center' : 'flex-start',
              boxShadow: activeTab === 'dashboard' ? `0 4px 14px ${C.primary}30` : 'none'
            }}
          >
            <MdDashboard size={20} />
            <span>Dashboard</span>
          </Link>

          <Link
            to={`${basePath}/product`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 800,
              textDecoration: 'none',
              color: activeTab === 'product' ? '#FFFFFF' : C.text,
              background: activeTab === 'product' ? `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)` : 'transparent',
              flex: isMobile ? 1 : 'initial',
              justifyContent: isMobile ? 'center' : 'flex-start',
              boxShadow: activeTab === 'product' ? `0 4px 14px ${C.primary}30` : 'none'
            }}
          >
            <MdStorefront size={20} />
            <span>Product</span>
          </Link>
        </aside>

        {/* INNER CONTENT AREA */}
        <main style={{ flex: 1, width: '100%' }}>
          {activeTab === 'dashboard' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* 2 Cards per row on Mobile Viewport */}
              <style>{`
                @media (max-width: 767px) {
                  .entity-perf-grid {
                    display: grid !important;
                    grid-template-columns: repeat(2, 1fr) !important;
                    gap: 10px !important;
                  }
                }
              `}</style>

              <div className="entity-perf-grid" style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: isMobile ? '10px' : '16px'
              }}>
                {/* Applications Card */}
                <div style={{ background: C.card, borderRadius: '18px', padding: '20px', border: `1px solid ${C.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>Entity Applications</span>
                    <MdDescription size={20} color={C.primary} />
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: C.text, marginTop: '8px' }}>142</div>
                  <span style={{ fontSize: '11px', color: C.green, fontWeight: 700 }}>+12 this week</span>
                </div>

                {/* Approvals Card */}
                <div style={{ background: C.card, borderRadius: '18px', padding: '20px', border: `1px solid ${C.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>Approvals</span>
                    <MdCheckCircle size={20} color="#10B981" />
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: C.text, marginTop: '8px' }}>118</div>
                  <span style={{ fontSize: '11px', color: C.green, fontWeight: 700 }}>83% approval rate</span>
                </div>

                {/* Commission Earned Card */}
                <div style={{ background: C.card, borderRadius: '18px', padding: '20px', border: `1px solid ${C.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>Commission Earned</span>
                    <MdAccountBalanceWallet size={20} color="#10B981" />
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: C.text, marginTop: '8px' }}>₹2,84,000</div>
                  <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 600 }}>Calculated live</span>
                </div>

                {/* Conversion Payout Rate Card */}
                <div style={{ background: C.card, borderRadius: '18px', padding: '20px', border: `1px solid ${C.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>Avg Payout / Approval</span>
                    <MdTrendingUp size={20} color={C.primary} />
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: C.text, marginTop: '8px' }}>₹2,400</div>
                  <span style={{ fontSize: '11px', color: C.primary, fontWeight: 700 }}>High yield tier</span>
                </div>
              </div>

              {/* Performance Summary Banner */}
              <div style={{
                background: C.card,
                borderRadius: '20px',
                padding: '24px',
                border: `1px solid ${C.border}`,
                boxShadow: isDark ? 'none' : '0 4px 20px rgba(15,23,42,0.04)'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: '0 0 12px' }}>
                  {entityTitle} Summary
                </h3>
                <p style={{ fontSize: '13px', color: C.textMid, margin: 0, lineHeight: 1.6 }}>
                  Manage leads and payouts for <strong>{slug.toUpperCase()}</strong>. Select the <strong>Product</strong> tab on the sidebar to view available variants and start customer applications directly.
                </p>
              </div>

            </div>
          ) : (
            /* PRODUCT TAB VIEW */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                background: C.card,
                borderRadius: '20px',
                padding: '20px 24px',
                border: `1px solid ${C.border}`
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 900, color: C.text, margin: '0 0 4px' }}>
                  Available Products & Variants for {slug.toUpperCase()}
                </h3>
                <p style={{ fontSize: '13px', color: C.textMid, margin: 0 }}>
                  Select a product below to launch instant applicant lead generation.
                </p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '16px'
              }}>
                {products.map((prod, idx) => (
                  <div key={idx} style={{
                    background: C.card,
                    borderRadius: '18px',
                    padding: '20px',
                    border: `1px solid ${C.border}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px',
                    boxShadow: isDark ? 'none' : '0 4px 16px rgba(0,0,0,0.03)'
                  }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '10px', background: `${C.primary}15`, color: C.primary, textTransform: 'uppercase' }}>
                        {prod.bank_name || prod.bank_code || slug.toUpperCase()}
                      </span>
                      <h4 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: '8px 0 4px' }}>
                        {prod.name}
                      </h4>
                      <p style={{ fontSize: '12px', color: C.textMid, margin: 0 }}>
                        {prod.min_income ? `Min Income: ₹${parseFloat(prod.min_income).toLocaleString('en-IN')}/mo` : 'Instant Verification'}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${C.border}`, paddingTop: '12px' }}>
                      <div>
                        <span style={{ fontSize: '11px', color: C.textMid }}>Payout Commission</span>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#10B981' }}>
                          ₹{parseFloat(prod.commission_value || 2000).toLocaleString('en-IN')}
                        </div>
                      </div>

                      <button
                        onClick={() => navigate('/partner/leads/add')}
                        style={{
                          padding: '8px 16px', borderRadius: '10px', border: 'none',
                          background: C.primary, color: '#FFFFFF', fontWeight: 800,
                          fontSize: '12px', cursor: 'pointer'
                        }}
                      >
                        Apply Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

    </div>
  );
}
