import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import api from '../../../services/api';
import { MdSearch, MdClose, MdChevronRight, MdCreditCard, MdAccountBalanceWallet, MdShield, MdStorefront, MdPeople, MdDeviceHub, MdVerifiedUser, MdSupportAgent, MdCampaign } from 'react-icons/md';

// Preset static search catalog
const STATIC_CATALOG = [
  // ── BANKS & CARDS ──
  { id: 'hdfc-card', title: 'HDFC Credit Cards', category: 'Credit Cards', sub: 'Lifetime Free & Cashback Cards', icon: '💳', route: '/partner/credit-cards', tags: ['hdfc', 'bank', 'credit card', 'ltf', 'pixel'] },
  { id: 'sbi-card', title: 'SBI Credit Cards', category: 'Credit Cards', sub: 'SimplyClick & Cashback Cards', icon: '💳', route: '/partner/credit-cards', tags: ['sbi', 'bank', 'credit card', 'simplyclick'] },
  { id: 'axis-card', title: 'Axis Bank Credit Cards', category: 'Credit Cards', sub: 'Flipkart & Rewards Cards', icon: '💳', route: '/partner/credit-cards', tags: ['axis', 'bank', 'credit card', 'flipkart'] },
  { id: 'icici-card', title: 'ICICI Bank Credit Cards', category: 'Credit Cards', sub: 'Amazon Pay & Coral Cards', icon: '💳', route: '/partner/credit-cards', tags: ['icici', 'bank', 'credit card', 'amazon'] },
  { id: 'indusind-card', title: 'IndusInd Bank Credit Cards', category: 'Credit Cards', sub: 'Legend & Pinnacle Cards', icon: '💳', route: '/partner/credit-cards', tags: ['indusind', 'bank', 'credit card'] },
  { id: 'au-card', title: 'AU Small Finance Credit Cards', category: 'Credit Cards', sub: 'Altura & Vetta Cards', icon: '💳', route: '/partner/credit-cards', tags: ['au', 'bank', 'credit card'] },
  { id: 'bob-card', title: 'Bank of Baroda Credit Cards', category: 'Credit Cards', sub: 'Premier & Select Cards', icon: '💳', route: '/partner/credit-cards', tags: ['bob', 'baroda', 'bank', 'credit card'] },
  { id: 'idfc-card', title: 'IDFC FIRST Credit Cards', category: 'Credit Cards', sub: 'FIRST Millennia & Wealth Cards', icon: '💳', route: '/partner/credit-cards', tags: ['idfc', 'bank', 'credit card'] },
  { id: 'ltf-cards', title: 'Lifetime Free (LTF) Credit Cards', category: 'Credit Cards', sub: 'Zero Joining & Annual Fee Cards', icon: '🎁', route: '/partner/credit-cards', tags: ['lifetime free', 'ltf', 'zero fee'] },

  // ── LOAN PRODUCTS ──
  { id: 'personal-loan', title: 'Personal Loans', category: 'Loans', sub: 'Instant disbursal up to ₹45 Lakhs', icon: '🏦', route: '/partner/products?category=personal_loan', tags: ['personal loan', 'instant loan', 'borrow', 'loan'] },
  { id: 'business-loan', title: 'Business Loans', category: 'Loans', sub: 'Collateral-free business capital', icon: '💼', route: '/partner/products?category=business_loan', tags: ['business loan', 'msme', 'working capital'] },
  { id: 'home-loan', title: 'Home Loans', category: 'Loans', sub: 'Low interest housing loans', icon: '🏠', route: '/partner/products?category=home_loan', tags: ['home loan', 'housing', 'property'] },
  { id: 'lap-loan', title: 'Loan Against Property (LAP)', category: 'Loans', sub: 'High value property loans', icon: '🏛', route: '/partner/products?category=home_loan', tags: ['lap', 'property loan'] },
  { id: 'gold-loan', title: 'Gold Loans', category: 'Loans', sub: 'Quick gold evaluation & loan', icon: '🪙', route: '/partner/products?category=personal_loan', tags: ['gold loan'] },
  { id: 'emi-card', title: 'Smart EMI Cards', category: 'Loans', sub: 'No-cost EMI purchasing cards', icon: '⚡', route: '/partner/products?category=personal_loan', tags: ['emi', 'smart emi', 'card'] },

  // ── INSURANCE & INVESTMENT ──
  { id: 'health-insurance', title: 'Health Insurance', category: 'Insurance', sub: 'Medical cover for individuals & family', icon: '🩺', route: '/partner/products?category=insurance', tags: ['health', 'insurance', 'medical'] },
  { id: 'life-insurance', title: 'Term & Life Insurance', category: 'Insurance', sub: 'High sum assured protection', icon: '🛡', route: '/partner/products?category=insurance', tags: ['life insurance', 'term plan'] },
  { id: 'motor-insurance', title: 'Car & Bike Insurance', category: 'Insurance', sub: 'Instant vehicle policy renewal', icon: '🚗', route: '/partner/products?category=insurance', tags: ['motor', 'car', 'bike', 'vehicle'] },
  { id: 'demat-account', title: 'Demat & Trading Accounts', category: 'Investments', sub: 'Free stock trading accounts', icon: '📈', route: '/partner/products?category=demat', tags: ['demat', 'trading', 'stocks'] },

  // ── PARTNER NAVIGATION & TOOLS ──
  { id: 'add-lead', title: 'Submit New Product Lead', category: 'Quick Action', sub: 'Apply product for customer', icon: '➕', route: '/partner/products', tags: ['lead', 'apply', 'submit', 'customer'] },
  { id: 'crm-customers', title: 'Customer Management (CRM)', category: 'Partner Portal', sub: 'View customer profiles & leads', icon: '👥', route: '/partner/customers', tags: ['customer', 'crm', 'client'] },
  { id: 'partner-wallet', title: 'Wallet & Payouts', category: 'Partner Portal', sub: 'Check balance & withdraw earnings', icon: '👛', route: '/partner/wallet', tags: ['wallet', 'payout', 'commission', 'balance'] },
  { id: 'kyc-centre', title: 'KYC Centre', category: 'Partner Portal', sub: 'Upload & verify PAN, Aadhaar, Bank', icon: '📑', route: '/partner/kyc-centre', tags: ['kyc', 'pan', 'aadhaar', 'verification'] },
  { id: 'team-network', title: 'Team Referrals & Network', category: 'Partner Portal', sub: 'Invite partners & earn overrides', icon: '🤝', route: '/partner/team-network', tags: ['refer', 'team', 'network', 'invite'] },
  { id: 'marketing-assets', title: 'Marketing Materials & Banners', category: 'Partner Portal', sub: 'Promotional posters & links', icon: '📢', route: '/partner/marketing', tags: ['marketing', 'banner', 'poster'] },
  { id: 'partner-support', title: 'Help & Support Desk', category: 'Partner Portal', sub: 'Raise support tickets & query', icon: '🎧', route: '/partner/support', tags: ['support', 'help', 'ticket'] }
];

export default function PartnerSearchBar() {
  const { C, isDark } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [dynamicProducts, setDynamicProducts] = useState([]);
  const containerRef = useRef(null);

  // Fetch dynamic products from API to enrich search
  useEffect(() => {
    let isMounted = true;
    api.get('/products')
      .then(res => {
        if (isMounted && res.data?.success && Array.isArray(res.data.data)) {
          const mapped = res.data.data.map(p => ({
            id: `api-prod-${p.id}`,
            title: p.name,
            category: p.category ? p.category.replace('_', ' ').toUpperCase() : 'Product',
            sub: p.bank_name ? `${p.bank_name} • Earn ${p.commission_value || ''}` : `Earn ${p.commission_value || ''}`,
            icon: p.category?.includes('card') ? '💳' : p.category?.includes('loan') ? '🏦' : '💰',
            route: `/partner/products?search=${encodeURIComponent(p.name)}`,
            tags: [p.name.toLowerCase(), (p.bank_name || '').toLowerCase(), (p.category || '').toLowerCase()]
          }));
          setDynamicProducts(mapped);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter combined search items
  const allCatalog = [...STATIC_CATALOG, ...dynamicProducts];
  const searchQuery = query.trim().toLowerCase();

  const filteredItems = searchQuery.length === 0
    ? STATIC_CATALOG.slice(0, 6)
    : allCatalog.filter(item => {
        if (item.title.toLowerCase().includes(searchQuery)) return true;
        if (item.category.toLowerCase().includes(searchQuery)) return true;
        if (item.sub.toLowerCase().includes(searchQuery)) return true;
        return item.tags?.some(tag => tag.includes(searchQuery));
      }).slice(0, 10);

  const handleSelect = (item) => {
    setIsOpen(false);
    setQuery('');
    navigate(item.route);
  };



  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        flex: 1,
        maxWidth: '480px',
        margin: '0 16px',
        zIndex: 40
      }}
    >
      {/* Search Input Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: isDark ? C.card : '#FFFFFF',
          border: `2px solid ${isOpen ? C.teal : isDark ? C.border : '#E2E8F0'}`,
          borderRadius: '16px',
          padding: '4px 14px',
          boxShadow: isOpen
            ? `0 8px 24px ${C.teal}25`
            : '0 4px 16px rgba(0,0,0,0.03)',
          transition: 'all 0.25s ease'
        }}
      >
        <MdSearch size={24} style={{ color: isOpen ? C.teal : C.textLight, flexShrink: 0, marginRight: '10px' }} />
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder="Search anything: Banks, Credit Cards, Loans, Insurance, Payouts..."
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: '14.5px',
            fontWeight: 600,
            color: C.text,
            padding: '10px 0'
          }}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: C.textLight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px'
            }}
          >
            <MdClose size={18} />
          </button>
        )}
      </div>



      {/* Live Dropdown Results Modal */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            background: isDark ? C.card : '#FFFFFF',
            borderRadius: '16px',
            border: `1px solid ${C.border}`,
            boxShadow: '0 12px 36px rgba(0,0,0,0.12)',
            overflow: 'hidden',
            maxHeight: '420px',
            overflowY: 'auto',
            zIndex: 100
          }}
        >
          <div style={{ padding: '10px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isDark ? C.bgSecondary : '#F8FAFC' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {searchQuery ? `Search Results (${filteredItems.length})` : 'Popular Partner Products'}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: C.teal }}>
              Press click to open
            </span>
          </div>

          {filteredItems.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: C.textLight, fontSize: '13px' }}>
              No matching bank, card, or loan found for "<strong>{query}</strong>".
              <div style={{ marginTop: '8px' }}>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/partner/products');
                  }}
                  style={{
                    background: C.teal,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Browse All Products Catalog
                </button>
              </div>
            </div>
          ) : (
            <div>
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderBottom: `1px solid ${C.border}40`,
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = isDark ? `${C.teal}15` : '#F0F9FF'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '22px', flexShrink: 0 }}>{item.icon}</div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: C.text }}>{item.title}</span>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: `${C.teal}15`,
                            color: C.teal
                          }}
                        >
                          {item.category}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: C.textLight, marginTop: '2px' }}>{item.sub}</div>
                    </div>
                  </div>

                  <MdChevronRight size={20} style={{ color: C.textLight }} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
