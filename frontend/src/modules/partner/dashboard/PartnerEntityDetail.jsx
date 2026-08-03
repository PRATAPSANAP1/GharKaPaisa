import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import api from '../../../services/api';
import { 
  MdDashboard, MdStorefront, MdPeople, MdLeaderboard, 
  MdFolder, MdBarChart, MdAccountBalanceWallet, MdSupportAgent,
  MdArrowBack, MdSearch, MdAdd, MdCheckCircle, MdClose,
  MdPhone, MdPerson, MdCreditCard, MdHelpOutline, MdTimeline,
  MdOutlineInsertDriveFile, MdDone, MdErrorOutline, MdHourglassEmpty
} from 'react-icons/md';

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

const BANK_WORKSPACE_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: MdDashboard },
  { id: 'cards', label: 'Credit Cards', icon: MdStorefront },
  { id: 'customers', label: 'Customers', icon: MdPeople },
  { id: 'applications', label: 'Applications', icon: MdLeaderboard },
  { id: 'documents', label: 'Documents', icon: MdFolder },
  { id: 'reports', label: 'Reports', icon: MdBarChart },
  { id: 'commission', label: 'Commission', icon: MdAccountBalanceWallet },
  { id: 'support', label: 'Support', icon: MdSupportAgent },
];

export default function PartnerEntityDetail() {
  const { bankSlug, tab: currentTabParam } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { C, isDark } = useTheme();
  const S = makeS(C);
  const { t } = useTranslation();

  const slug = bankSlug || 'hdfc';
  const bankName = useMemo(() => getBankName(slug), [slug]);

  const activeTab = useMemo(() => {
    if (!currentTabParam || currentTabParam === 'dashboard') return 'dashboard';
    if (currentTabParam === 'product' || currentTabParam === 'cards') return 'cards';
    return currentTabParam;
  }, [currentTabParam]);

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cardSearch, setCardSearch] = useState('');

  // Product Workspace Modal state
  const [selectedProductWorkspace, setSelectedProductWorkspace] = useState(null);
  const [productWorkspaceTab, setProductWorkspaceTab] = useState('overview'); // overview, apply, applications, documents, eligibility, timeline

  // Apply Process state
  const [applyProcess, setApplyProcess] = useState('customer_sell'); // customer_sell, partner_sell, lead_punching
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [foundCustomer, setFoundCustomer] = useState(null);
  const [customerSearched, setCustomerSearched] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerPan, setNewCustomerPan] = useState('');
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
            const bName = (p.bank_name || p.bank_code || '').toLowerCase();
            const pName = (p.name || '').toLowerCase();
            return bName.includes(slugLower) || pName.includes(slugLower);
          });
          
          setProducts(filtered.length > 0 ? filtered : [
            { id: 1, name: `${bankName} Millennia`, annual_fee: '₹1,000 / yr', joining_fee: '₹1,000', min_income: '25000', commission_value: '2500', is_ltf: false, rewards: '5% Cashback on Amazon, Flipkart', category: 'credit_card' },
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

  const handleCustomerSearch = () => {
    if (!customerSearchQuery.trim()) return;
    setCustomerSearched(true);
    if (customerSearchQuery.includes('98') || customerSearchQuery.includes('99') || customerSearchQuery.toLowerCase().includes('rahul')) {
      setFoundCustomer({
        id: 'CUST-1042',
        name: 'Rahul Sharma',
        phone: customerSearchQuery.length === 10 ? customerSearchQuery : '9876543210',
        pan: 'ABCDE1234F',
        status: 'Active'
      });
    } else {
      setFoundCustomer(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
      
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
            {filteredCardProducts.map((card) => (
              <div
                key={card.id}
                style={{
                  background: C.card,
                  borderRadius: '20px',
                  padding: '22px',
                  border: `1px solid ${C.border}`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px',
                  boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 18px rgba(15,23,42,0.03)',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '8px', background: `${C.primary}15`, color: C.primary, textTransform: 'uppercase' }}>
                      {card.is_ltf ? 'Lifetime Free' : 'Credit Card'}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 900, color: '#10B981' }}>
                      Earn ₹{card.commission_value || '2,500'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '18px', fontWeight: 900, color: C.text, margin: '0 0 6px' }}>
                    {card.name}
                  </h3>
                  
                  {card.rewards && (
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: C.primary, marginBottom: '10px' }}>
                      🎁 {card.rewards}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '13px', color: C.textMid, margin: '10px 0' }}>
                    <div><strong>Annual Fee:</strong> {card.annual_fee || '₹500 / yr'}</div>
                    <div><strong>Joining Fee:</strong> {card.joining_fee || '₹0'}</div>
                    <div><strong>Eligibility:</strong> Min Income ₹{card.min_income ? parseFloat(card.min_income).toLocaleString('en-IN') : '25,000'}/mo</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', paddingTop: '10px', borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}` }}>
                  <button
                    onClick={() => {
                      setSelectedProductWorkspace(card);
                      setProductWorkspaceTab('apply');
                    }}
                    style={{
                      flex: 1, padding: '12px', borderRadius: '12px', border: 'none',
                      background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
                      color: '#FFFFFF', fontWeight: 900, fontSize: '13.5px', cursor: 'pointer',
                      boxShadow: `0 4px 14px ${C.primary}30`
                    }}
                  >
                    Apply Now
                  </button>
                  <button
                    onClick={() => {
                      setSelectedProductWorkspace(card);
                      setProductWorkspaceTab('overview');
                    }}
                    style={{
                      padding: '12px 16px', borderRadius: '12px', border: `1px solid ${C.border}`,
                      background: isDark ? C.bgSecondary : '#F1F5F9', color: C.text, fontWeight: 800, fontSize: '13px', cursor: 'pointer'
                    }}
                  >
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ═══ PRODUCT WORKSPACE MODAL (STEP 4) ═══ */}
      {selectedProductWorkspace && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', padding: '16px'
        }}>
          <div style={{
            background: C.card, width: '100%', maxWidth: '850px', maxHeight: '90vh',
            borderRadius: '24px', overflowY: 'auto', border: `1px solid ${C.border}`,
            boxShadow: '0 25px 60px rgba(0,0,0,0.4)', position: 'relative',
            display: 'flex', flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, background: isDark ? C.bgSecondary : '#F8FAFC', position: 'relative' }}>
              <button
                onClick={() => {
                  setSelectedProductWorkspace(null);
                  setApplySubmitted(false);
                }}
                style={{
                  position: 'absolute', top: '16px', right: '16px',
                  background: C.card, border: `1px solid ${C.border}`, cursor: 'pointer',
                  width: 34, height: 34, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: C.textMid, fontSize: '18px', fontWeight: 700
                }}
              >
                ✕
              </button>

              <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '10px', background: `${C.primary}15`, color: C.primary, textTransform: 'uppercase' }}>
                Product Workspace
              </span>
              <h3 style={{ fontSize: '22px', fontWeight: 900, color: C.text, margin: '4px 0 2px' }}>
                {selectedProductWorkspace.name}
              </h3>
              <span style={{ fontSize: '13px', color: C.textMid, fontWeight: 600 }}>
                Payout: <strong style={{ color: '#10B981' }}>₹{selectedProductWorkspace.commission_value || '2500'}</strong> / approval
              </span>

              {/* Sub-tabs inside Product Workspace */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px', overflowX: 'auto' }}>
                {['overview', 'apply', 'applications', 'documents', 'eligibility', 'timeline'].map((tabKey) => (
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

              {/* TAB 1: OVERVIEW */}
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
                      <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 700 }}>COMMISSION</span>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#10B981', marginTop: '2px' }}>₹{selectedProductWorkspace.commission_value || '2500'}</div>
                    </div>
                  </div>

                  <div style={{ padding: '16px', borderRadius: '14px', background: isDark ? C.bgSecondary : '#F8FAFC', border: `1px solid ${C.border}` }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: C.text, margin: '0 0 6px' }}>Key Rewards & Benefits</h4>
                    <p style={{ fontSize: '13px', color: C.textMid, margin: 0, lineHeight: 1.5 }}>
                      {selectedProductWorkspace.rewards || 'Accelerated reward points on online spends, complimentary airport lounge access, and fuel surcharge waiver.'}
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

              {/* TAB 2: APPLY WORKFLOW */}
              {productWorkspaceTab === 'apply' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {applySubmitted ? (
                    <div style={{ padding: '40px', textAlign: 'center', background: '#D1FAE5', borderRadius: '16px', border: '1px solid #6EE7B7' }}>
                      <MdCheckCircle size={48} color="#059669" />
                      <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#065F46', margin: '12px 0 6px' }}>
                        Application Submitted Successfully!
                      </h3>
                      <p style={{ fontSize: '13px', color: '#047857', margin: 0 }}>
                        Lead for <strong>{foundCustomer?.name || 'Customer'}</strong> has been punched for {selectedProductWorkspace.name}.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Step 1: Process Selection */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: C.primary, textTransform: 'uppercase' }}>
                          Step 1: Choose Process
                        </span>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                          {[
                            { id: 'customer_sell', label: 'Customer Sell' },
                            { id: 'partner_sell', label: 'Partner Sell' },
                            { id: 'lead_punching', label: 'Lead Punching' }
                          ].map((proc) => (
                            <button
                              key={proc.id}
                              onClick={() => setApplyProcess(proc.id)}
                              style={{
                                padding: '12px', borderRadius: '12px',
                                border: applyProcess === proc.id ? `2px solid ${C.primary}` : `1px solid ${C.border}`,
                                background: applyProcess === proc.id ? `${C.primary}15` : (isDark ? C.bgSecondary : '#F8FAFC'),
                                color: applyProcess === proc.id ? C.primary : C.text,
                                fontWeight: 800, fontSize: '13px', cursor: 'pointer'
                              }}
                            >
                              {proc.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Step 2: Customer Pre-Search */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: C.primary, textTransform: 'uppercase' }}>
                          Step 2: Customer Search
                        </span>
                        
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            placeholder="Search by Phone, PAN, or Customer ID (e.g. 9876543210)..."
                            value={customerSearchQuery}
                            onChange={(e) => setCustomerSearchQuery(e.target.value)}
                            style={{
                              flex: 1, padding: '12px 16px', borderRadius: '12px', border: `1px solid ${C.border}`,
                              background: isDark ? C.bgSecondary : '#F8FAFC', color: C.text, fontSize: '13.5px', outline: 'none'
                            }}
                          />
                          <button
                            onClick={handleCustomerSearch}
                            style={{ padding: '12px 20px', borderRadius: '12px', border: 'none', background: C.primary, color: '#fff', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}
                          >
                            Search
                          </button>
                        </div>

                        {customerSearched && (
                          foundCustomer ? (
                            <div style={{ padding: '14px', borderRadius: '12px', background: '#D1FAE5', border: '1px solid #6EE7B7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <h5 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#065F46' }}>Customer Found: {foundCustomer.name}</h5>
                                <span style={{ fontSize: '12px', color: '#047857' }}>Phone: {foundCustomer.phone} • PAN: {foundCustomer.pan}</span>
                              </div>
                              <span style={{ fontSize: '12px', fontWeight: 900, color: '#047857' }}>Auto-selected</span>
                            </div>
                          ) : (
                            <div style={{ padding: '16px', borderRadius: '14px', background: isDark ? C.bgSecondary : '#F8FAFC', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 800, color: C.text }}>No customer found. Create New Customer:</span>
                              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '10px' }}>
                                <input placeholder="Full Name" value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, color: C.text }} />
                                <input placeholder="Phone Number" value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, color: C.text }} />
                                <input placeholder="PAN Number" value={newCustomerPan} onChange={(e) => setNewCustomerPan(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, color: C.text }} />
                              </div>
                            </div>
                          )
                        )}
                      </div>

                      <button
                        onClick={() => setApplySubmitted(true)}
                        style={{
                          width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                          background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
                          color: '#FFFFFF', fontWeight: 900, fontSize: '15px', cursor: 'pointer', marginTop: '10px'
                        }}
                      >
                        Submit Application
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* TAB 3: APPLICATIONS */}
              {productWorkspaceTab === 'applications' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: 0 }}>Applications for {selectedProductWorkspace.name}</h4>
                  <div style={{ padding: '16px', borderRadius: '12px', background: isDark ? C.bgSecondary : '#F8FAFC', border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ color: C.text }}>#APP-9014 (Rahul Sharma)</strong>
                      <div style={{ fontSize: '12px', color: C.textMid }}>Submitted on 21 Jul 2026</div>
                    </div>
                    <span style={{ padding: '4px 10px', borderRadius: '8px', background: '#FEF3C7', color: '#92400E', fontWeight: 800, fontSize: '11px' }}>Under Review</span>
                  </div>
                </div>
              )}

              {/* TAB 4: DOCUMENTS VISUAL CHECKLIST */}
              {productWorkspaceTab === 'documents' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: 0 }}>Required Documents Status</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '12px' }}>
                    <div style={{ padding: '14px', borderRadius: '12px', background: '#D1FAE5', border: '1px solid #A7F3D0', fontWeight: 800, color: '#065F46' }}>PAN: ✓ Uploaded</div>
                    <div style={{ padding: '14px', borderRadius: '12px', background: '#FEF3C7', border: '1px solid #FDE68A', fontWeight: 800, color: '#92400E' }}>Aadhaar: Pending Upload</div>
                    <div style={{ padding: '14px', borderRadius: '12px', background: '#FEF3C7', border: '1px solid #FDE68A', fontWeight: 800, color: '#92400E' }}>Salary Slip: Pending Upload</div>
                    <div style={{ padding: '14px', borderRadius: '12px', background: '#FEE2E2', border: '1px solid #FCA5A5', fontWeight: 800, color: '#991B1B' }}>Office ID: Missing</div>
                  </div>
                </div>
              )}

              {/* TAB 5: ELIGIBILITY */}
              {productWorkspaceTab === 'eligibility' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: 0 }}>Eligibility Criteria</h4>
                  <ul style={{ fontSize: '13px', color: C.textMid, lineHeight: 1.8, margin: 0, paddingLeft: '20px' }}>
                    <li>Minimum Monthly Income: ₹{selectedProductWorkspace.min_income ? parseFloat(selectedProductWorkspace.min_income).toLocaleString('en-IN') : '25,000'}</li>
                    <li>Age Range: 21 to 60 Years</li>
                    <li>CIBIL Score Requirement: 750+</li>
                    <li>Employment: Salaried or Self-Employed Professional</li>
                  </ul>
                </div>
              )}

              {/* TAB 6: TIMELINE PIPELINE */}
              {productWorkspaceTab === 'timeline' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: 0 }}>Application Timeline Lifecycle</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      { step: 'Application Created', status: 'completed' },
                      { step: 'PAN Verified', status: 'completed' },
                      { step: 'Income Verified', status: 'active' },
                      { step: 'VKYC Completed', status: 'pending' },
                      { step: 'Approved', status: 'pending' },
                      { step: 'Commission Released', status: 'pending' }
                    ].map((st, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', fontWeight: 800, color: st.status === 'completed' ? '#059669' : st.status === 'active' ? C.primary : C.textMid }}>
                        <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: st.status === 'completed' ? '#10B981' : st.status === 'active' ? C.primary : C.border, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                          {st.status === 'completed' ? '✓' : idx + 1}
                        </span>
                        <span>{st.step}</span>
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

