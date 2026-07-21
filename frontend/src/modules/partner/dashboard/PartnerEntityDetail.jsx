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
        padding: '16px 24px',
        border: `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={() => navigate('/partner/credit-cards')}
            style={{
              background: isDark ? C.bgSecondary : '#F1F5F9',
              border: `1px solid ${C.border}`,
              borderRadius: '10px',
              padding: '6px 14px',
              color: C.text,
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <MdArrowBack size={16} />
            All Banks
          </button>

          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Bank Workspace
            </span>
            <h2 style={{ fontSize: '22px', fontWeight: 900, color: C.text, margin: '2px 0 0' }}>
              🏦 {bankName}
            </h2>
          </div>
        </div>

        <button
          onClick={() => navigate(`/partner/credit-cards/${slug}/cards`)}
          style={{
            padding: '10px 18px', borderRadius: '12px', border: 'none',
            background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
            color: '#FFFFFF', fontWeight: 800, fontSize: '13px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
            boxShadow: `0 4px 16px ${C.primary}35`
          }}
        >
          <MdAdd size={18} />
          New Application
        </button>
      </div>

      {/* ── MAIN WORKSPACE CONTAINER WITH LEFT SUB-SIDEBAR ── */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: '20px',
        alignItems: 'flex-start'
      }}>
        {/* LEFT BANK WORKSPACE SUB-SIDEBAR */}
        <aside style={{
          width: isMobile ? '100%' : '240px',
          background: C.card,
          borderRadius: '20px',
          padding: '16px',
          border: `1px solid ${C.border}`,
          display: 'flex',
          flexDirection: isMobile ? 'row' : 'column',
          gap: '6px',
          flexShrink: 0,
          overflowX: isMobile ? 'auto' : 'visible'
        }}>
          <div style={{ padding: '4px 8px 10px', display: isMobile ? 'none' : 'block', borderBottom: `1px solid ${C.border}`, marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase' }}>
              {bankName}
            </span>
          </div>

          {BANK_WORKSPACE_TABS.map((tItem) => {
            const Icon = tItem.icon;
            const isActive = activeTab === tItem.id;
            const targetPath = tItem.id === 'dashboard'
              ? `/partner/credit-cards/${slug}`
              : `/partner/credit-cards/${slug}/${tItem.id}`;

            return (
              <Link
                key={tItem.id}
                to={targetPath}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '13.5px',
                  fontWeight: isActive ? 800 : 600,
                  textDecoration: 'none',
                  color: isActive ? '#FFFFFF' : C.text,
                  background: isActive ? `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)` : 'transparent',
                  whiteSpace: 'nowrap',
                  boxShadow: isActive ? `0 4px 12px ${C.primary}30` : 'none',
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={18} />
                <span>{tItem.label}</span>
              </Link>
            );
          })}
        </aside>

        {/* WORKSPACE CONTENT AREA */}
        <main style={{ flex: 1, width: '100%' }}>

          {/* 1. BANK DASHBOARD VIEW */}
          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* ACTION BUTTONS HEADER - STRICTLY NO KPIS / NO CHARTS */}
              <div style={{
                background: C.card,
                borderRadius: '20px',
                padding: '20px 24px',
                border: `1px solid ${C.border}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: 900, color: C.text, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Quick Actions
                </h3>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                  gap: '12px'
                }}>
                  <button
                    onClick={() => navigate(`/partner/credit-cards/${slug}/customers`)}
                    style={{
                      padding: '16px', borderRadius: '14px',
                      background: isDark ? C.bgSecondary : '#F8FAFC',
                      border: `1.5px solid ${C.border}`,
                      color: C.text, fontWeight: 800, fontSize: '14px',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                    }}
                  >
                    <MdSearch size={20} color={C.primary} />
                    <span>Search Customer</span>
                  </button>

                  <button
                    onClick={() => navigate(`/partner/credit-cards/${slug}/cards`)}
                    style={{
                      padding: '16px', borderRadius: '14px',
                      background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
                      border: 'none', color: '#FFFFFF', fontWeight: 800, fontSize: '14px',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                      boxShadow: `0 4px 14px ${C.primary}30`
                    }}
                  >
                    <MdAdd size={20} />
                    <span>New Application</span>
                  </button>

                  <button
                    onClick={() => navigate(`/partner/credit-cards/${slug}/applications`)}
                    style={{
                      padding: '16px', borderRadius: '14px',
                      background: isDark ? C.bgSecondary : '#F8FAFC',
                      border: `1.5px solid ${C.border}`,
                      color: C.text, fontWeight: 800, fontSize: '14px',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                    }}
                  >
                    <MdHourglassEmpty size={20} color="#F59E0B" />
                    <span>Continue Draft</span>
                  </button>
                </div>
              </div>

              {/* PRODUCTS QUICK LIST */}
              <div style={{
                background: C.card,
                borderRadius: '20px',
                padding: '20px 24px',
                border: `1px solid ${C.border}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 900, color: C.text, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Popular {bankName} Credit Cards
                  </h3>
                  <Link to={`/partner/credit-cards/${slug}/cards`} style={{ fontSize: '13px', fontWeight: 800, color: C.primary, textDecoration: 'none' }}>
                    View All Cards →
                  </Link>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: '14px'
                }}>
                  {products.slice(0, 6).map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => {
                        setSelectedProductWorkspace(prod);
                        setProductWorkspaceTab('overview');
                      }}
                      style={{
                        background: isDark ? C.bgSecondary : '#F8FAFC',
                        borderRadius: '16px',
                        padding: '16px',
                        border: `1px solid ${C.border}`,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: C.primary, textTransform: 'uppercase' }}>
                          {prod.is_ltf ? 'Lifetime Free' : 'Credit Card'}
                        </span>
                        <h4 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: '4px 0 2px' }}>
                          {prod.name}
                        </h4>
                        <span style={{ fontSize: '12px', color: C.textMid, fontWeight: 600 }}>
                          Annual Fee: {prod.annual_fee || '₹500 / yr'}
                        </span>
                      </div>

                      <button
                        style={{
                          width: '100%', padding: '10px', borderRadius: '10px', border: 'none',
                          background: C.primary, color: '#FFFFFF', fontWeight: 800, fontSize: '12px', cursor: 'pointer'
                        }}
                      >
                        Select Card
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* 2. CREDIT CARDS MENU TAB */}
          {activeTab === 'cards' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{
                background: C.card,
                borderRadius: '20px',
                padding: '16px 20px',
                border: `1px solid ${C.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <MdSearch size={22} color={C.textMid} />
                <input
                  type="text"
                  placeholder="Search Card..."
                  value={cardSearch}
                  onChange={(e) => setCardSearch(e.target.value)}
                  style={{
                    background: 'none', border: 'none', color: C.text, width: '100%', fontSize: '14.5px', fontWeight: 600, outline: 'none'
                  }}
                />
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '16px'
              }}>
                {filteredCardProducts.map((card) => (
                  <div
                    key={card.id}
                    style={{
                      background: C.card,
                      borderRadius: '20px',
                      padding: '20px',
                      border: `1px solid ${C.border}`,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '14px',
                      boxShadow: isDark ? 'none' : '0 4px 18px rgba(0,0,0,0.03)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '8px', background: `${C.primary}15`, color: C.primary, textTransform: 'uppercase' }}>
                          {card.is_ltf ? 'Lifetime Free' : 'Credit Card'}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#10B981' }}>
                          Earn ₹{card.commission_value || '2500'}
                        </span>
                      </div>

                      <h4 style={{ fontSize: '17px', fontWeight: 900, color: C.text, margin: '0 0 6px' }}>
                        {card.name}
                      </h4>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12.5px', color: C.textMid, margin: '8px 0' }}>
                        <div><strong>Annual Fee:</strong> {card.annual_fee || '₹500 / yr'}</div>
                        <div><strong>Eligibility:</strong> Min Income ₹{card.min_income ? parseFloat(card.min_income).toLocaleString('en-IN') : '25,000'}/mo</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => {
                          setSelectedProductWorkspace(card);
                          setProductWorkspaceTab('apply');
                        }}
                        style={{
                          flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                          background: C.primary, color: '#FFFFFF', fontWeight: 800, fontSize: '13px', cursor: 'pointer'
                        }}
                      >
                        Apply
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProductWorkspace(card);
                          setProductWorkspaceTab('applications');
                        }}
                        style={{
                          flex: 1, padding: '10px', borderRadius: '10px', border: `1px solid ${C.border}`,
                          background: isDark ? C.bgSecondary : '#F1F5F9', color: C.text, fontWeight: 800, fontSize: '12.5px', cursor: 'pointer'
                        }}
                      >
                        View Apps
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. CUSTOMERS TAB */}
          {activeTab === 'customers' && (
            <div style={{ background: C.card, borderRadius: '20px', padding: '20px', border: `1px solid ${C.border}` }}>
              <h3 style={{ fontSize: '17px', fontWeight: 900, color: C.text, margin: '0 0 16px' }}>
                {bankName} Customer Records
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { name: 'Rahul Sharma', apps: 2, date: '21 Jul 2026', phone: '+91 98765 43210' },
                  { name: 'Sneha Patil', apps: 5, date: '20 Jul 2026', phone: '+91 98123 45678' },
                  { name: 'Amit Verma', apps: 1, date: '19 Jul 2026', phone: '+91 99887 76655' }
                ].map((cust, idx) => (
                  <div key={idx} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '14px 18px', borderRadius: '14px', background: isDark ? C.bgSecondary : '#F8FAFC',
                    border: `1px solid ${C.border}`
                  }}>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: 0 }}>{cust.name}</h4>
                      <span style={{ fontSize: '12px', color: C.textMid, fontWeight: 600 }}>{cust.phone} • {cust.apps} Applications • Updated: {cust.date}</span>
                    </div>

                    <button
                      onClick={() => navigate('/partner/customers')}
                      style={{
                        padding: '8px 16px', borderRadius: '10px', border: 'none',
                        background: C.primary, color: '#fff', fontWeight: 800, fontSize: '12px', cursor: 'pointer'
                      }}
                    >
                      Open
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. APPLICATIONS TAB */}
          {activeTab === 'applications' && (
            <div style={{ background: C.card, borderRadius: '20px', padding: '20px', border: `1px solid ${C.border}` }}>
              <h3 style={{ fontSize: '17px', fontWeight: 900, color: C.text, margin: '0 0 16px' }}>
                {bankName} Applications Stream
              </h3>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: isDark ? C.bgSecondary : '#F8FAFC', textAlign: 'left', borderBottom: `1px solid ${C.border}` }}>
                      <th style={{ padding: '12px 14px' }}>App No</th>
                      <th style={{ padding: '12px 14px' }}>Customer</th>
                      <th style={{ padding: '12px 14px' }}>Card</th>
                      <th style={{ padding: '12px 14px' }}>Status</th>
                      <th style={{ padding: '12px 14px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { appNo: 'APP-9014', name: 'Rahul Sharma', card: `${bankName} Millennia`, status: 'Under Review' },
                      { appNo: 'APP-8920', name: 'Sneha Patil', card: `${bankName} Regalia Gold`, status: 'Approved' },
                      { appNo: 'APP-8812', name: 'Amit Verma', card: `${bankName} Pixel`, status: 'Draft' }
                    ].map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: '12px 14px', fontWeight: 800, color: C.text }}>#{row.appNo}</td>
                        <td style={{ padding: '12px 14px', fontWeight: 700 }}>{row.name}</td>
                        <td style={{ padding: '12px 14px', color: C.textMid }}>{row.card}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '8px', background: row.status === 'Approved' ? '#D1FAE5' : '#FEF3C7', color: row.status === 'Approved' ? '#065F46' : '#92400E', fontWeight: 800, fontSize: '11px' }}>
                            {row.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <button
                            onClick={() => navigate('/partner/applications')}
                            style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: C.primary, color: '#fff', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}
                          >
                            Open
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. DOCUMENTS TAB */}
          {activeTab === 'documents' && (
            <div style={{ background: C.card, borderRadius: '20px', padding: '20px', border: `1px solid ${C.border}` }}>
              <h3 style={{ fontSize: '17px', fontWeight: 900, color: C.text, margin: '0 0 16px' }}>
                Visual Documents Checklist
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '14px' }}>
                <div style={{ padding: '16px', borderRadius: '14px', background: '#D1FAE5', border: '1px solid #A7F3D0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, color: '#065F46' }}>PAN Card</span>
                  <span style={{ fontWeight: 900, color: '#047857' }}>✓ Uploaded</span>
                </div>
                <div style={{ padding: '16px', borderRadius: '14px', background: '#FEF3C7', border: '1px solid #FDE68A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, color: '#92400E' }}>Aadhaar Card</span>
                  <button style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: '#D97706', color: '#fff', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}>Upload</button>
                </div>
                <div style={{ padding: '16px', borderRadius: '14px', background: '#FEF3C7', border: '1px solid #FDE68A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, color: '#92400E' }}>Salary Slip</span>
                  <button style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: '#D97706', color: '#fff', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}>Upload</button>
                </div>
                <div style={{ padding: '16px', borderRadius: '14px', background: '#FEE2E2', border: '1px solid #FCA5A5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, color: '#991B1B' }}>Office ID</span>
                  <span style={{ fontWeight: 900, color: '#DC2626' }}>Missing</span>
                </div>
              </div>
            </div>
          )}

          {/* 6. REPORTS & COMMISSION & SUPPORT TABS */}
          {(activeTab === 'reports' || activeTab === 'commission' || activeTab === 'support') && (
            <div style={{ background: C.card, borderRadius: '20px', padding: '24px', border: `1px solid ${C.border}` }}>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: C.text, margin: '0 0 12px', textTransform: 'capitalize' }}>
                {activeTab} Overview
              </h3>
              
              {activeTab === 'commission' ? (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '14px', marginTop: '16px' }}>
                  <div style={{ padding: '16px', borderRadius: '14px', background: isDark ? C.bgSecondary : '#F8FAFC', border: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 700 }}>AVAILABLE</span>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: '#10B981', marginTop: '4px' }}>₹12,500</div>
                  </div>
                  <div style={{ padding: '16px', borderRadius: '14px', background: isDark ? C.bgSecondary : '#F8FAFC', border: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 700 }}>PENDING</span>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: '#F59E0B', marginTop: '4px' }}>₹7,000</div>
                  </div>
                  <div style={{ padding: '16px', borderRadius: '14px', background: isDark ? C.bgSecondary : '#F8FAFC', border: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 700 }}>RELEASED</span>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: C.primary, marginTop: '4px' }}>₹45,000</div>
                  </div>
                  <button onClick={() => navigate('/partner/wallet')} style={{ padding: '16px', borderRadius: '14px', background: C.primary, border: 'none', color: '#fff', fontWeight: 900, fontSize: '14px', cursor: 'pointer' }}>
                    Withdraw Now
                  </button>
                </div>
              ) : (
                <p style={{ fontSize: '13.5px', color: C.textMid }}>
                  Access {activeTab} tools directly for {bankName}. Use the navigation on the left to switch modules.
                </p>
              )}
            </div>
          )}

        </main>
      </div>

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

