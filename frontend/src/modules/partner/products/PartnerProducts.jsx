import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useLocation } from 'react-router-dom';
import api from '../../../services/api';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import { useActiveBanks } from '../../../contexts/BanksContext';
import { resolveAndApply } from '../../../services/applicationResolver';
import { useAuthStore } from '../../../app/store/authStore';
import { usePartnerStore } from '../../../app/store/partnerStore';

import { 
  MdFilterList, MdSearch, MdCheckCircle, MdLocalOffer, 
  MdAccessTime, MdInfoOutline, MdClose, MdShare, MdChevronRight 
} from 'react-icons/md';
import { getCardDetails } from '../../home/components/CreditCards/CardDetailsData';

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

const getCategoryEmoji = (cat) => {
  const c = cat?.toLowerCase() || '';
  if (c.includes('card')) return '💳';
  if (c.includes('loan')) return '🏦';
  if (c.includes('insurance')) return '🛡';
  if (c.includes('savings')) return '🏛';
  if (c.includes('fastag')) return '🚗';
  if (c.includes('demat')) return '📈';
  return '💰';
};

const getMarketingBadges = (p) => {
  const val = parseFloat(p.commission_value || 0);
  const cat = p.category?.toLowerCase() || '';
  const badges = [];
  if (val >= 1200) badges.push('High Commission');
  if (cat.includes('card')) {
    if (p.name.toLowerCase().includes('pixel') || p.name.toLowerCase().includes('zone')) {
      badges.push('Lifetime Free');
    } else {
      badges.push('Co Branded');
    }
  }
  if (cat.includes('loan')) badges.push('Instant Loan');
  if (badges.length === 0) badges.push('Trending');
  return badges.slice(0, 2);
};

export default function PartnerProducts() {
  const { t } = useTranslation();
  const { C, isDark } = useTheme();
  const S = makeS(C);
  const { activeBanks } = useActiveBanks();
  
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
      alert("Partner profile code not found.");
      return;
    }
    const trackingLink = `${window.location.origin}/redirect/${product.category}?id=${product.id}&partner=${partnerCode}`;
    navigator.clipboard.writeText(trackingLink);
    alert("Partner tracking link copied to clipboard!");
  };

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters & Sorting & Pagination
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeBank, setActiveBank] = useState("All Banks");
  const [filterTab, setFilterTab] = useState("products"); // 'products' or 'banks'
  const [sortBy, setSortBy] = useState("featured");
  const [minCommission, setMinCommission] = useState(0);
  const [minApproval, setMinApproval] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 6;

  // Sync category from URL search query parameter or navigation state
  useEffect(() => {
    const cat = searchParams.get('category') || location.state?.category;
    if (cat) {
      if (cat === 'loans' || cat === 'personal_loan') {
        setActiveCategory('personal_loan');
      } else {
        setActiveCategory(cat);
      }
    }
  }, [searchParams, location.state]);

  // Reset pagination when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeCategory, activeBank, filterTab, sortBy, minCommission, minApproval]);

  // Enhanced Lead modal/form state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [monthlySalary, setMonthlySalary] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [businessType, setBusinessType] = useState("Micro-Enterprise");
  const [gstNumber, setGstNumber] = useState("");
  const [tradeLicenseNumber, setTradeLicenseNumber] = useState("");
  const [processType, setProcessType] = useState("partner_cell");
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Benefits & Compare state
  const [showBenefitsProduct, setShowBenefitsProduct] = useState(null);
  const [compareList, setCompareList] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [loadingCompare, setLoadingCompare] = useState(false);

  const handleToggleCompare = (product) => {
    setCompareList(prev => {
      const exists = prev.find(p => p.id === product.id);
      if (exists) {
        return prev.filter(p => p.id !== product.id);
      } else {
        if (prev.length >= 2) {
          alert("You can select up to 2 products to compare.");
          return prev;
        }
        return [...prev, product];
      }
    });
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products', { params: { is_active: 'true', limit: 1000 } });
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
        setCountryCode("+91");
        setMobile("");
        setEmail("");
        setMonthlySalary("");
        setCompanyName("");
        setPincode("");
        setCity("");
        setStateName("");
        setBusinessType("Micro-Enterprise");
        setGstNumber("");
        setTradeLicenseNumber("");
        setProcessType("partner_cell");
        setAgreeTerms(true);
        setFormErrors({});
      }
    });
  };

  const handlePincodeChange = async (val) => {
    const clean = val.replace(/\D/g, '').slice(0, 6);
    setPincode(clean);
    if (clean.length === 6) {
      try {
        setPincodeLoading(true);
        const res = await api.get(`/location/pincode/${clean}`);
        if (res.data?.success && res.data?.data) {
          setCity(res.data.data.city || res.data.data.district || '');
          setStateName(res.data.data.state || '');
        }
      } catch (err) {
        console.warn('Pincode lookup error:', err);
      } finally {
        setPincodeLoading(false);
      }
    }
  };

  const handleSubmitLead = async (e, isDraft = false) => {
    if (e) e.preventDefault();

    const errors = {};
    if (!isDraft) {
      if (!customerName.trim() || customerName.trim().length < 2) {
        errors.customerName = "Full Name must be at least 2 characters.";
      }
      if (!mobile.trim() || !/^[6-9]\d{9}$/.test(mobile.trim())) {
        errors.mobile = "Please enter a valid 10-digit mobile number.";
      }
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        errors.email = "Please enter a valid email address.";
      }
      if (!monthlySalary || parseFloat(monthlySalary) <= 0) {
        errors.monthlySalary = "Please enter a valid monthly salary.";
      } else if (selectedProduct.min_income && parseFloat(monthlySalary) < parseFloat(selectedProduct.min_income)) {
        errors.monthlySalary = `Monthly salary is below minimum required ₹${parseFloat(selectedProduct.min_income).toLocaleString('en-IN')}.`;
      }
      if (!pincode.trim() || !/^\d{6}$/.test(pincode.trim())) {
        errors.pincode = "Please enter a valid 6-digit postal pincode.";
      }
      if (!agreeTerms) {
        errors.agreeTerms = "You must agree to the Terms & Conditions.";
      }
    } else {
      if (!customerName.trim() && !mobile.trim()) {
        errors.customerName = "Enter at least Customer Name or Mobile to save draft.";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (isDraft) setSavingDraft(true);
    else setSubmitting(true);

    try {
      const payload = {
        product_id: selectedProduct.id,
        full_name: customerName.trim(),
        country_code: countryCode,
        mobile: mobile.trim(),
        email: email.trim(),
        monthly_salary: monthlySalary ? parseFloat(monthlySalary) : 0,
        company_name: companyName.trim(),
        pincode: pincode.trim(),
        city: city.trim(),
        state: stateName.trim(),
        business_type: businessType,
        gst_number: gstNumber.trim(),
        trade_license_number: tradeLicenseNumber.trim(),
        process_type: processType,
        agree_terms: agreeTerms,
        is_draft: isDraft
      };

      const res = await api.post('/applications/partner-apply', payload);

      if (res.data?.success) {
        usePartnerStore.getState().fetchCustomers().catch(() => {});
        alert(isDraft ? "Draft saved successfully!" : "Application submitted successfully! Confirmation emails sent to Partner and Applicant.");
        setSelectedProduct(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit application. Please try again.");
    } finally {
      setSubmitting(false);
      setSavingDraft(false);
    }
  };

  // Get simulated approval rate for a product
  const getApprovalRate = (p) => {
    return p.approval_rate || (p.id ? (p.id.charCodeAt(0) % 20) + 78 : 85);
  };

  // Compute banks available for the selected category (dynamic bank list)
  const banksForCategory = useMemo(() => {
    return ['All Banks', ...activeBanks.map(b => b.short_code).filter(Boolean)];
  }, [activeBanks]);

  // Reset bank filter when category changes and selected bank is no longer available
  useEffect(() => {
    if (activeBank !== 'All Banks' && !banksForCategory.includes(activeBank)) {
      setActiveBank('All Banks');
    }
  }, [banksForCategory, activeBank]);

  // Filter Logic
  const filteredProducts = products.filter(p => {
    const approvalRate = getApprovalRate(p);
    
    // Deep Search: by Name, Bank Code, Category, Commission, Eligibility
    const details = getCardDetails(p.id || p.name.toLowerCase().replace(/[^a-z0-9]/g, '-'), p.name);
    const eligibilityText = details.eligibility?.criteria || '';
    
    const query = search.toLowerCase();
    const matchSearch = !query || 
                        p.name.toLowerCase().includes(query) || 
                        p.bank_code?.toLowerCase().includes(query) ||
                        p.category?.toLowerCase().includes(query) ||
                        p.commission_value?.toString().includes(query) ||
                        eligibilityText.toLowerCase().includes(query);
                        
    const matchCategory = activeCategory === 'all' || 
                        p.category === activeCategory ||
                        (activeCategory === 'personal_loan' && p.category?.toLowerCase().includes('loan')) ||
                        (activeCategory === 'credit_card' && p.category?.toLowerCase().includes('card'));
    const matchBank = activeBank === 'All Banks' || p.bank_code === activeBank || p.name.includes(activeBank);
    
    // Commission Filter
    const matchCommission = parseFloat(p.commission_value || 0) >= minCommission;
    
    // Approval % Filter
    const matchApproval = approvalRate >= minApproval;
    
    return matchSearch && matchCategory && matchBank && matchCommission && matchApproval;
  });

  // Sort Logic
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'highest_commission') {
      return parseFloat(b.commission_value || 0) - parseFloat(a.commission_value || 0);
    }
    if (sortBy === 'newest') {
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    }
    if (sortBy === 'highest_approval') {
      return getApprovalRate(b) - getApprovalRate(a);
    }
    if (sortBy === 'a_z') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'popular') {
      const popA = a.id ? a.id.charCodeAt(0) % 100 : 50;
      const popB = b.id ? b.id.charCodeAt(0) % 100 : 50;
      return popB - popA;
    }
    // Default: featured
    return (b.id || '').localeCompare(a.id || '');
  });

  // Pagination Logic
  const indexOfLastCard = currentPage * cardsPerPage;
  const indexOfFirstCard = indexOfLastCard - cardsPerPage;
  const currentCards = sortedProducts.slice(indexOfFirstCard, indexOfLastCard);
  const totalPages = Math.ceil(sortedProducts.length / cardsPerPage);

  const sectionLabel = { fontSize: '11px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' };

  // Helper to render filter options block
  const renderFilterContent = () => (
    <div style={{ ...S.card, padding: '24px', borderRadius: '20px', background: C.card, border: `1.5px solid ${C.border}`, boxShadow: isDark ? 'none' : '0 10px 30px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontWeight: 800, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: '18px' }}>
          <MdFilterList size={20} style={{ color: C.primary }} /> Filter Products
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

      {/* ─── TWO MAIN FILTER SELECT DROPDOWNS: ALL PRODUCTS & ALL BANKS ─── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexDirection: 'column' }}>
        <div>
          <label style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px', display: 'block' }}>
            {t("Product Category")}
          </label>
          <select
            id="sidebar-select-products"
            value={activeCategory}
            onChange={(e) => {
              setActiveCategory(e.target.value);
              if (isMobile) setShowMobileFilter(false);
            }}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: activeCategory !== 'all' ? `1.5px solid ${C.primary}` : `1.5px solid ${C.border}`,
              background: activeCategory !== 'all' ? `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})` : (isDark ? '#18181B' : '#F8FAFC'),
              color: activeCategory !== 'all' ? '#FFFFFF' : C.text,
              boxShadow: activeCategory !== 'all' ? `0 4px 12px ${C.primary}35` : 'none',
              outline: 'none'
            }}
          >
            <option value="all" style={{ background: isDark ? '#18181B' : '#FFFFFF', color: isDark ? '#F8FAFC' : '#111827' }}>🛍️ All Products</option>
            {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
              <option key={cat.id} value={cat.id} style={{ background: isDark ? '#18181B' : '#FFFFFF', color: isDark ? '#F8FAFC' : '#111827' }}>
                {getCategoryEmoji(cat.id)} {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px', display: 'block' }}>
            {t("Select Bank")}
          </label>
          <select
            id="sidebar-select-banks"
            value={activeBank}
            onChange={(e) => {
              setActiveBank(e.target.value);
              if (isMobile) setShowMobileFilter(false);
            }}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: activeBank !== 'All Banks' ? `1.5px solid ${C.primary}` : `1.5px solid ${C.border}`,
              background: activeBank !== 'All Banks' ? `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})` : (isDark ? '#18181B' : '#F8FAFC'),
              color: activeBank !== 'All Banks' ? '#FFFFFF' : C.text,
              boxShadow: activeBank !== 'All Banks' ? `0 4px 12px ${C.primary}35` : 'none',
              outline: 'none'
            }}
          >
            <option value="All Banks" style={{ background: isDark ? '#18181B' : '#FFFFFF', color: isDark ? '#F8FAFC' : '#111827' }}>🏦 All Banks</option>
            {banksForCategory.filter(b => b !== 'All Banks').map(bank => (
              <option key={bank} value={bank} style={{ background: isDark ? '#18181B' : '#FFFFFF', color: isDark ? '#F8FAFC' : '#111827' }}>
                🏦 {bank}
              </option>
            ))}
          </select>
        </div>
      </div>



      <div style={{ height: 1, background: C.border, margin: '0 0 20px' }} />

      {/* Commission */}
      <p style={sectionLabel}>{t("Commission")}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '20px' }}>
        {[0, 500, 1000, 1500].map(val => {
          const isActive = minCommission === val;
          return (
            <button
              key={val}
              onClick={() => { setMinCommission(val); if (isMobile) setShowMobileFilter(false); }}
              style={{
                textAlign: 'left', padding: '9px 12px', borderRadius: '10px',
                fontSize: '13px', fontWeight: 650, border: 'none', cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: isActive ? `${C.primary}15` : 'transparent',
                color: isActive ? C.primary : C.textMid,
              }}
              className={isActive ? "" : "hover-bg-button"}
            >
              {val === 0 ? 'Any Payout' : `₹${val}+`}
            </button>
          );
        })}
      </div>


      <button
        onClick={() => {
          setActiveCategory('all');
          setActiveBank('All Banks');
          setMinCommission(0);
          setMinApproval(0);
          setSearch('');
          setSortBy('featured');
          if (isMobile) setShowMobileFilter(false);
        }}
        style={{
          width: '100%', padding: '12px', borderRadius: '10px',
          background: 'none', border: `1.5px solid ${C.border}`,
          color: C.red, fontWeight: 700, fontSize: '13px', cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
        className="hover-bg-button-danger"
      >
        Reset Filters
      </button>
    </div>
  );

  return (
    <div style={{
      padding: isMobile ? '16px 12px' : '24px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      maxWidth: '1280px',
      margin: '0 auto',
      boxSizing: 'border-box'
    }}>
      {/* ─── PAGE HEADER ROW ─── */}
      <div style={{
        width: '100%',
        borderBottom: `1.5px solid ${C.border}`,
        paddingBottom: '16px'
      }}>
        <h1 style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: 800, color: C.text, margin: 0, letterSpacing: '-0.5px' }}>
          Products Marketplace
        </h1>
      </div>

      {/* ─── MAIN SIDEBAR + GRID CONTAINER ─── */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: '24px',
        width: '100%'
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
          {/* Top Filter Select Dropdowns Row (Desktop Only) */}
          {!isMobile && (
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <select
                id="header-select-products"
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: activeCategory !== 'all' ? `1.5px solid ${C.primary}` : `1.5px solid ${C.border}`,
                  background: activeCategory !== 'all' ? `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})` : (isDark ? '#18181B' : '#F8FAFC'),
                  color: activeCategory !== 'all' ? '#FFFFFF' : C.text,
                  outline: 'none'
                }}
              >
                <option value="all" style={{ background: isDark ? '#18181B' : '#FFFFFF', color: isDark ? '#F8FAFC' : '#111827' }}>🛍️ All Products</option>
                {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                  <option key={cat.id} value={cat.id} style={{ background: isDark ? '#18181B' : '#FFFFFF', color: isDark ? '#F8FAFC' : '#111827' }}>
                    {getCategoryEmoji(cat.id)} {cat.label}
                  </option>
                ))}
              </select>

              <select
                id="header-select-banks"
                value={activeBank}
                onChange={(e) => setActiveBank(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: activeBank !== 'All Banks' ? `1.5px solid ${C.primary}` : `1.5px solid ${C.border}`,
                  background: activeBank !== 'All Banks' ? `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})` : (isDark ? '#18181B' : '#F8FAFC'),
                  color: activeBank !== 'All Banks' ? '#FFFFFF' : C.text,
                  outline: 'none'
                }}
              >
                <option value="All Banks" style={{ background: isDark ? '#18181B' : '#FFFFFF', color: isDark ? '#F8FAFC' : '#111827' }}>🏦 All Banks</option>
                {banksForCategory.filter(b => b !== 'All Banks').map(bank => (
                  <option key={bank} value={bank} style={{ background: isDark ? '#18181B' : '#FFFFFF', color: isDark ? '#F8FAFC' : '#111827' }}>
                    🏦 {bank}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search bar row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', flexDirection: isMobile ? 'column' : 'row' }}>
            <div style={{ position: 'relative', flex: 1, width: '100%' }}>
              <MdSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: C.textLight }} size={20} />
              <input 
                type="text" 
                placeholder={t("🔍 Search products, cards, loans, insurance...")} 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ ...S.input, paddingLeft: '38px', height: '42px', fontSize: '13px' }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '8px', width: isMobile ? '100%' : 'auto', alignSelf: 'stretch' }}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  ...S.input,
                  width: isMobile ? '100%' : '180px',
                  height: '42px',
                  fontSize: '13px',
                  fontWeight: 650,
                  cursor: 'pointer',
                  padding: '0 12px'
                }}
              >
                <option value="featured">Featured</option>
                <option value="highest_commission">Highest Commission</option>
                <option value="newest">Newest</option>
                <option value="highest_approval">Highest Approval</option>
                <option value="a_z">A-Z</option>
                <option value="popular">Popular</option>
              </select>

              {isMobile && (
                <button
                  onClick={() => setShowMobileFilter(true)}
                  style={{
                    background: `${C.primary}12`,
                    border: `1.5px solid ${C.primary}30`,
                    color: C.primary,
                    borderRadius: '10px',
                    padding: '0 16px',
                    height: '42px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 700,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <MdFilterList size={18} /> Filters
                </button>
              )}
            </div>
          </div>

          {/* Mobile Select Dropdowns for Product & Bank */}
          {isMobile && (
            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              <select
                id="mobile-select-products"
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '10px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: activeCategory !== 'all' ? `1.5px solid ${C.primary}` : `1.5px solid ${C.border}`,
                  background: activeCategory !== 'all' ? `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})` : (isDark ? '#18181B' : '#F8FAFC'),
                  color: activeCategory !== 'all' ? '#FFFFFF' : C.text,
                  outline: 'none'
                }}
              >
                <option value="all" style={{ background: isDark ? '#18181B' : '#FFFFFF', color: isDark ? '#F8FAFC' : '#111827' }}>🛍️ All Products</option>
                {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                  <option key={cat.id} value={cat.id} style={{ background: isDark ? '#18181B' : '#FFFFFF', color: isDark ? '#F8FAFC' : '#111827' }}>
                    {getCategoryEmoji(cat.id)} {cat.label}
                  </option>
                ))}
              </select>

              <select
                id="mobile-select-banks"
                value={activeBank}
                onChange={(e) => setActiveBank(e.target.value)}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '10px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: activeBank !== 'All Banks' ? `1.5px solid ${C.primary}` : `1.5px solid ${C.border}`,
                  background: activeBank !== 'All Banks' ? `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})` : (isDark ? '#18181B' : '#F8FAFC'),
                  color: activeBank !== 'All Banks' ? '#FFFFFF' : C.text,
                  outline: 'none'
                }}
              >
                <option value="All Banks" style={{ background: isDark ? '#18181B' : '#FFFFFF', color: isDark ? '#F8FAFC' : '#111827' }}>🏦 All Banks</option>
                {banksForCategory.filter(b => b !== 'All Banks').map(bank => (
                  <option key={bank} value={bank} style={{ background: isDark ? '#18181B' : '#FFFFFF', color: isDark ? '#F8FAFC' : '#111827' }}>
                    🏦 {bank}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Results count & Active filter status */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: C.textMid }}>
            <span>
              Showing <strong style={{ color: C.text }}>{filteredProducts.length}</strong> Products
            </span>
            {(activeCategory !== 'all' || activeBank !== 'All Banks' || minCommission !== 0 || minApproval !== 0 || search) && (
              <button
                onClick={() => {
                  setActiveCategory('all');
                  setActiveBank('All Banks');
                  setMinCommission(0);
                  setMinApproval(0);
                  setSearch('');
                  setSortBy('featured');
                }}
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
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '24px'
          }}>
            {[1, 2, 3, 4, 5, 6].map(idx => (
              <div key={idx} style={{
                ...S.card,
                padding: '24px',
                borderRadius: '16px',
                border: `1.5px solid ${C.border}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                minHeight: '280px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ width: '60px', height: '18px', borderRadius: '4px', background: C.border, opacity: 0.5 }} />
                  <div style={{ width: '50px', height: '18px', borderRadius: '4px', background: C.border, opacity: 0.5 }} />
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: C.border, opacity: 0.5 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ width: '80%', height: '16px', borderRadius: '4px', background: C.border, opacity: 0.5 }} />
                    <div style={{ width: '40%', height: '12px', borderRadius: '4px', background: C.border, opacity: 0.5 }} />
                  </div>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'center' }}>
                  <div style={{ width: '100%', height: '12px', borderRadius: '4px', background: C.border, opacity: 0.5 }} />
                  <div style={{ width: '90%', height: '12px', borderRadius: '4px', background: C.border, opacity: 0.5 }} />
                </div>
                <div style={{ height: '40px', borderRadius: '8px', background: C.border, opacity: 0.5 }} />
              </div>
            ))}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: isMobile ? '12px' : '24px'
            }}>
              {currentCards.map((product) => {
                const isSelectedForCompare = compareList.some(p => p.id === product.id);
                const approvalRate = getApprovalRate(product);
                const cardDetails = getCardDetails(product.id || product.name.toLowerCase().replace(/[^a-z0-9]/g, '-'), product.name);
                const eligibilityCriteria = cardDetails.eligibility?.criteria || 'Min Age: 21 | Income details apply';
                const badges = getMarketingBadges(product);
                const emoji = getCategoryEmoji(product.category);

                return (
                  <div 
                    key={product.id} 
                    className="gkp-product-card"
                    style={{
                      ...S.card,
                      padding: isMobile ? '14px 12px' : '24px',
                      borderRadius: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: isMobile ? '12px' : '16px',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      border: isSelectedForCompare ? `2.5px solid ${C.primary}` : `1.5px solid ${C.border}`,
                      boxShadow: isSelectedForCompare ? `0 12px 28px ${C.primary}20` : (isDark ? 'none' : '0 4px 15px rgba(0,0,0,0.02)'),
                      background: C.card
                    }}
                  >
                    <div>
                      {/* Top Badges Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '4px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{
                            ...S.tag(C.primary),
                            fontSize: isMobile ? '9.5px' : '11px',
                            fontWeight: 750,
                            padding: isMobile ? '3px 8px' : '4px 10px',
                            borderRadius: '8px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            {product.category?.replace(/_/g, ' ') || 'Finance'}
                          </span>
                          {isSelectedForCompare && (
                            <span style={{
                              fontSize: isMobile ? '9.5px' : '11px', fontWeight: 800, color: '#fff',
                              background: C.green, padding: isMobile ? '3px 8px' : '4px 10px', borderRadius: '8px'
                            }}>
                              ✓ Compare
                            </span>
                          )}
                        </div>
                        <span style={{
                          fontSize: isMobile ? '9.5px' : '11px', fontWeight: 700, color: C.textMid,
                          background: C.bgSecondary, padding: isMobile ? '3px 8px' : '4px 10px', borderRadius: '8px',
                          textTransform: 'uppercase', letterSpacing: '0.5px',
                          border: `1px solid ${C.border}`
                        }}>
                          {product.bank_code || 'BANK'}
                        </span>
                      </div>

                      {/* Product Logo & Info Header */}
                      <div style={{ display: 'flex', gap: isMobile ? '10px' : '14px', alignItems: 'center', marginBottom: '14px' }}>
                        <div style={{
                          width: isMobile ? 44 : 58,
                          height: isMobile ? 44 : 58,
                          flexShrink: 0,
                          background: C.bgSecondary,
                          borderRadius: '14px',
                          border: `1.5px solid ${C.border}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          fontSize: isMobile ? '22px' : '28px',
                          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                        }}>
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} />
                          ) : (
                            emoji
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={{ fontSize: isMobile ? '15px' : '18px', fontWeight: 800, color: C.text, margin: '0 0 4px', lineHeight: 1.25 }}>
                            {product.name}
                          </h3>
                        </div>
                      </div>

                      {/* Description */}
                      {product.description && (
                        <p style={{ fontSize: isMobile ? '12px' : '13.5px', fontWeight: 500, color: C.textMid, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.45 }}>
                          {product.description}
                        </p>
                      )}
                    </div>

                    {/* Footer Action Bar */}
                    <div style={{
                      borderTop: `1px solid ${C.border}`,
                      paddingTop: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      marginTop: 'auto'
                    }}>
                      {/* Payout & Commission Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: isMobile ? '11px' : '12.5px', color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Partner Payout
                        </span>
                        <span style={{ fontSize: isMobile ? '20px' : '28px', fontWeight: 800, color: C.green }}>
                          ₹{parseFloat(product.commission_value || 0).toLocaleString('en-IN')}
                        </span>
                      </div>

                      {/* Buttons Row */}
                      <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                        {(product.public_url || product.partner_url) && (
                          <button
                            onClick={() => handleCopyLink(product)}
                            type="button"
                            style={{
                              ...S.btn('outline'),
                              flex: 1,
                              padding: isMobile ? '8px 4px' : '10px 8px',
                              fontSize: isMobile ? '11px' : '12.5px',
                              borderRadius: '10px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              fontWeight: 700
                            }}
                          >
                            <MdShare size={isMobile ? 12 : 14} /> Link
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleToggleCompare(product)}
                          type="button"
                          style={{
                            ...S.btn(isSelectedForCompare ? 'primary' : 'outline'),
                            flex: 1,
                            padding: isMobile ? '8px 4px' : '10px 8px',
                            fontSize: isMobile ? '11px' : '12.5px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            fontWeight: 700,
                            borderColor: isSelectedForCompare ? 'transparent' : C.primary,
                            color: isSelectedForCompare ? '#fff' : C.primary
                          }}
                        >
                          Compare
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                        <button
                          onClick={() => setShowBenefitsProduct(product)}
                          type="button"
                          style={{
                            ...S.btn('outline'),
                            borderColor: C.border,
                            color: C.textMid,
                            flex: 1,
                            padding: isMobile ? '8px 4px' : '11px 12px',
                            fontSize: isMobile ? '11.5px' : '13px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            fontWeight: 700
                          }}
                          className="hover-bg-button"
                        >
                          Benefits
                        </button>
                        
                        <button
                          onClick={() => handleApply(product)}
                          style={{
                            background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
                            color: '#fff',
                            border: 'none',
                            flex: 1.5,
                            padding: isMobile ? '8px 4px' : '11px 12px',
                            fontSize: isMobile ? '11.5px' : '13px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            boxShadow: isDark ? 'none' : `0 4px 12px ${C.primary}20`
                          }}
                          className="hover-scale-button"
                        >
                          Apply <MdChevronRight size={isMobile ? 14 : 16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                marginTop: '24px',
                paddingBottom: '20px'
              }}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  style={{
                    ...S.btn('outline'),
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    opacity: currentPage === 1 ? 0.4 : 1,
                    fontSize: '14px',
                    fontWeight: 700
                  }}
                >
                  &lt;
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{
                      ...S.btn(currentPage === page ? 'primary' : 'outline'),
                      padding: '8px 14px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 750,
                      boxShadow: currentPage === page && !isDark ? `0 4px 10px ${C.primary}30` : 'none'
                    }}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  style={{
                    ...S.btn('outline'),
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    opacity: currentPage === totalPages ? 0.4 : 1,
                    fontSize: '14px',
                    fontWeight: 700
                  }}
                >
                  &gt;
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ═══ ENHANCED PARTNER APPLICATION FORM MODAL ═══ */}
      {selectedProduct && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', padding: '16px'
        }}>
          <div style={{
            background: C.card, width: '100%', maxWidth: '640px', maxHeight: '90vh',
            borderRadius: '24px', overflowY: 'auto', border: `1px solid ${C.border}`,
            boxShadow: '0 25px 60px rgba(0,0,0,0.35)', position: 'relative',
            display: 'flex', flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, background: C.bgSecondary, position: 'sticky', top: 0, zIndex: 10 }}>
              <button
                onClick={() => setSelectedProduct(null)}
                style={{
                  position: 'absolute', top: '16px', right: '16px',
                  background: C.card, border: `1px solid ${C.border}`, cursor: 'pointer',
                  width: 32, height: 32, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: C.textMid, fontSize: '16px', fontWeight: 700
                }}
              >
                ✕
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '12px', background: `${C.primary}15`, color: C.primary, textTransform: 'uppercase' }}>
                  {selectedProduct.category?.replace(/_/g, ' ')}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: C.textLight }}>
                  Bank: {selectedProduct.bank_code || 'Partner Bank'}
                </span>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: C.text, margin: '6px 0 2px' }}>
                Apply for {selectedProduct.name}
              </h3>
              <p style={{ fontSize: '12px', color: C.textMid, margin: 0 }}>
                Log customer application details. Payout: <strong style={{ color: C.green }}>₹{parseFloat(selectedProduct.commission_value || 0).toLocaleString('en-IN')}</strong>
              </p>
            </div>

            {/* Modal Form */}
            <form onSubmit={(e) => handleSubmitLead(e, false)} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* SECTION 1: APPLICANT DEMOGRAPHICS */}
              <div>
                <h4 style={{ fontSize: '12px', fontWeight: 800, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                  1. Applicant Demographics
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px' }}>
                  {/* Full Name */}
                  <div>
                    <label style={S.label}>Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={customerName}
                      onChange={(e) => { setCustomerName(e.target.value); setFormErrors(prev => ({ ...prev, customerName: null })); }}
                      style={{ ...S.input, height: '42px', fontSize: '13px', borderColor: formErrors.customerName ? C.red : C.border }}
                    />
                    {formErrors.customerName && <span style={{ fontSize: '11px', color: C.red, marginTop: '2px', display: 'block' }}>{formErrors.customerName}</span>}
                  </div>

                  {/* Contact Number with Country Code */}
                  <div>
                    <label style={S.label}>Contact Number *</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        style={{ ...S.input, width: '85px', height: '42px', fontSize: '12px', fontWeight: 700, padding: '0 6px' }}
                      >
                        <option value="+91">🇮🇳 +91</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+971">🇦🇪 +971</option>
                      </select>
                      <input
                        type="tel"
                        placeholder="10-digit mobile number"
                        maxLength={10}
                        value={mobile}
                        onChange={(e) => { setMobile(e.target.value.replace(/\D/g, '')); setFormErrors(prev => ({ ...prev, mobile: null })); }}
                        style={{ ...S.input, flex: 1, height: '42px', fontSize: '13px', borderColor: formErrors.mobile ? C.red : C.border }}
                      />
                    </div>
                    {formErrors.mobile && <span style={{ fontSize: '11px', color: C.red, marginTop: '2px', display: 'block' }}>{formErrors.mobile}</span>}
                  </div>

                  {/* Email Address */}
                  <div>
                    <label style={S.label}>Email Address *</label>
                    <input
                      type="email"
                      placeholder="rahul@example.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setFormErrors(prev => ({ ...prev, email: null })); }}
                      style={{ ...S.input, height: '42px', fontSize: '13px', borderColor: formErrors.email ? C.red : C.border }}
                    />
                    {formErrors.email && <span style={{ fontSize: '11px', color: C.red, marginTop: '2px', display: 'block' }}>{formErrors.email}</span>}
                  </div>

                  {/* Monthly Salary */}
                  <div>
                    <label style={S.label}>
                      Monthly Salary / Income (₹) *
                      {selectedProduct.min_income && (
                        <span style={{ fontSize: '11px', color: C.textLight, fontWeight: 500, marginLeft: '4px' }}>
                          (Min: ₹{parseFloat(selectedProduct.min_income).toLocaleString('en-IN')})
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 45000"
                      value={monthlySalary}
                      onChange={(e) => { setMonthlySalary(e.target.value); setFormErrors(prev => ({ ...prev, monthlySalary: null })); }}
                      style={{ ...S.input, height: '42px', fontSize: '13px', borderColor: formErrors.monthlySalary ? C.red : C.border }}
                    />
                    {formErrors.monthlySalary && <span style={{ fontSize: '11px', color: C.red, marginTop: '2px', display: 'block' }}>{formErrors.monthlySalary}</span>}
                  </div>
                </div>
              </div>

              {/* SECTION 2: COMPANY & ADDRESS DETAILS */}
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '16px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 800, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                  2. Company & Location Info
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px' }}>
                  {/* Company Name */}
                  <div>
                    <label style={S.label}>Company / Employer Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Infosys Ltd / Self Employed"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      style={{ ...S.input, height: '42px', fontSize: '13px' }}
                    />
                  </div>

                  {/* Residence / Office Pincode with Auto Lookup */}
                  <div>
                    <label style={S.label}>
                      Residence / Office Pincode *
                      {pincodeLoading && <span style={{ fontSize: '11px', color: C.primary, marginLeft: '6px' }}>Searching location...</span>}
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Enter 6-digit Pincode"
                      value={pincode}
                      onChange={(e) => handlePincodeChange(e.target.value)}
                      style={{ ...S.input, height: '42px', fontSize: '13px', borderColor: formErrors.pincode ? C.red : C.border }}
                    />
                    {formErrors.pincode && <span style={{ fontSize: '11px', color: C.red, marginTop: '2px', display: 'block' }}>{formErrors.pincode}</span>}
                  </div>

                  {/* City */}
                  <div>
                    <label style={S.label}>City (Auto-filled)</label>
                    <input
                      type="text"
                      placeholder="City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      style={{ ...S.input, height: '42px', fontSize: '13px', background: C.bgSecondary }}
                    />
                  </div>

                  {/* State */}
                  <div>
                    <label style={S.label}>State (Auto-filled)</label>
                    <input
                      type="text"
                      placeholder="State"
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      style={{ ...S.input, height: '42px', fontSize: '13px', background: C.bgSecondary }}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: BUSINESS TYPE & DYNAMIC SUBFIELDS */}
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '16px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 800, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                  3. Business & Enterprise Classification
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px' }}>
                  {/* Business Type Dropdown */}
                  <div>
                    <label style={S.label}>Business / Company Type *</label>
                    <select
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      style={{ ...S.input, height: '42px', fontSize: '13px', fontWeight: 600 }}
                    >
                      <option value="Micro-Enterprise">Micro-Enterprise</option>
                      <option value="Small Business">Small Business</option>
                      <option value="Mid-Size Enterprise">Mid-Size Enterprise</option>
                      <option value="Large Corporation">Large Corporation</option>
                      <option value="Startup">Startup</option>
                    </select>
                  </div>

                  {/* Conditional Sub-field: GST Number */}
                  {['Micro-Enterprise', 'Small Business', 'Mid-Size Enterprise', 'Large Corporation', 'Startup'].includes(businessType) && (
                    <div>
                      <label style={S.label}>GST Registration Number</label>
                      <input
                        type="text"
                        placeholder="15-digit GSTIN (Optional/If registered)"
                        value={gstNumber}
                        onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                        style={{ ...S.input, height: '42px', fontSize: '13px' }}
                      />
                    </div>
                  )}

                  {/* Conditional Sub-field: Trade License Number for Physical Retail / Small Business */}
                  {['Micro-Enterprise', 'Small Business'].includes(businessType) && (
                    <div>
                      <label style={S.label}>Trade License Number</label>
                      <input
                        type="text"
                        placeholder="Trade License Number"
                        value={tradeLicenseNumber}
                        onChange={(e) => setTradeLicenseNumber(e.target.value)}
                        style={{ ...S.input, height: '42px', fontSize: '13px' }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 4: PROCESS ASSIGNMENT & META */}
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '16px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 800, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                  4. Process Assignment & Date
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px' }}>
                  {/* Process Assignment Dropdown */}
                  <div>
                    <label style={S.label}>Process Assignment *</label>
                    <select
                      value={processType}
                      onChange={(e) => setProcessType(e.target.value)}
                      style={{ ...S.input, height: '42px', fontSize: '13px', fontWeight: 700, color: C.primary }}
                    >
                      <option value="partner_cell">1. Partner Cell Process</option>
                      <option value="customer_sell">2. Customer Sell Process</option>
                      <option value="punching_process">3. Punching Process</option>
                    </select>
                  </div>

                  {/* Application Date */}
                  <div>
                    <label style={S.label}>Application Date (Read-Only)</label>
                    <input
                      type="text"
                      readOnly
                      value={new Date().toISOString().split('T')[0]}
                      style={{ ...S.input, height: '42px', fontSize: '13px', background: C.bgSecondary, fontWeight: 700 }}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 5: AGREEMENT CHECKBOX */}
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', color: C.textMid, fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => { setAgreeTerms(e.target.checked); setFormErrors(prev => ({ ...prev, agreeTerms: null })); }}
                    style={{ width: '18px', height: '18px', accentColor: C.primary, cursor: 'pointer' }}
                  />
                  <span>I confirm applicant details are accurate and agree to GharKaPaisa terms & conditions. *</span>
                </label>
                {formErrors.agreeTerms && <span style={{ fontSize: '11px', color: C.red, marginTop: '4px', display: 'block' }}>{formErrors.agreeTerms}</span>}
              </div>

              {/* ACTION BUTTONS: CANCEL, SAVE DRAFT, SUBMIT APPLICATION */}
              <div style={{ display: 'flex', gap: '10px', paddingTop: '12px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  style={{
                    ...S.btn('outline'), flex: 1, padding: '12px', fontSize: '13px',
                    borderRadius: '12px', cursor: 'pointer', fontWeight: 600
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={(e) => handleSubmitLead(e, true)}
                  disabled={savingDraft || submitting}
                  style={{
                    ...S.btn('outline'), flex: 1.2, padding: '12px', fontSize: '13px',
                    borderRadius: '12px', cursor: savingDraft ? 'not-allowed' : 'pointer',
                    fontWeight: 700, borderColor: C.primary, color: C.primary
                  }}
                >
                  {savingDraft ? 'Saving Draft...' : 'Save Draft'}
                </button>

                <button
                  type="submit"
                  disabled={submitting || savingDraft}
                  style={{
                    background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
                    color: '#ffffff', border: 'none', flex: 2, padding: '12px', fontSize: '13px',
                    borderRadius: '12px', cursor: submitting ? 'not-allowed' : 'pointer',
                    fontWeight: 800, boxShadow: `0 4px 14px ${C.primary}35`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ BENEFITS MODAL ═══ */}
      {showBenefitsProduct && (() => {
        const cardDetails = getCardDetails(
          showBenefitsProduct.id || showBenefitsProduct.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          showBenefitsProduct.name
        );
        const { features, eligibility, howItWorks, termsAndConditions } = cardDetails;
        
        return (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', padding: '16px'
          }}>
            <div style={{
              background: C.card, width: '100%', maxWidth: '520px',
              borderRadius: '20px', overflow: 'hidden', border: `1px solid ${C.border}`,
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)', position: 'relative',
              maxHeight: '85vh', display: 'flex', flexDirection: 'column'
            }}>
              <button
                onClick={() => setShowBenefitsProduct(null)}
                style={{
                  position: 'absolute', top: '16px', right: '16px', zIndex: 10,
                  width: '32px', height: '32px', borderRadius: '50%', background: C.bgSecondary,
                  border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: C.textMid, fontSize: '16px', fontWeight: 700
                }}
              >
                ✕
              </button>

              <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}` }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: '0 0 4px' }}>
                  {showBenefitsProduct.name} Benefits
                </h3>
                <p style={{ fontSize: '13px', color: C.textLight, margin: 0 }}>
                  Bank: <strong style={{ color: C.text }}>{showBenefitsProduct.bank_code}</strong> | Category: <strong style={{ color: C.text }}>{showBenefitsProduct.category?.replace(/_/g, ' ')}</strong>
                </p>
              </div>

              <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Features & Highlights */}
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 800, color: C.primary, textTransform: 'uppercase', margin: '0 0 10px 0', letterSpacing: '0.5px' }}>
                    Key Features
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {features && features.map((f, idx) => (
                      <li key={idx} style={{ fontSize: '13.5px', color: C.text, lineHeight: 1.4 }}>{f}</li>
                    ))}
                  </ul>
                </div>

                {/* Eligibility Criteria */}
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 800, color: C.primary, textTransform: 'uppercase', margin: '0 0 10px 0', letterSpacing: '0.5px' }}>
                    Eligibility Criteria
                  </h4>
                  <p style={{ fontSize: '13.5px', color: C.text, margin: 0, lineHeight: 1.4 }}>
                    {eligibility?.criteria || 'Stable income required. Minimum age 21 years.'}
                  </p>
                </div>

                {/* Documents Required */}
                {eligibility?.documentsRequired && eligibility.documentsRequired.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 800, color: C.primary, textTransform: 'uppercase', margin: '0 0 10px 0', letterSpacing: '0.5px' }}>
                      Documents Required
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {eligibility.documentsRequired.map((doc, idx) => (
                        <span key={idx} style={{
                          fontSize: '11.5px', fontWeight: 600, color: C.textMid, background: C.bgSecondary,
                          padding: '4px 10px', borderRadius: '6px', border: `1px solid ${C.border}`
                        }}>
                          {doc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* How it Works */}
                {howItWorks && howItWorks.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 800, color: C.primary, textTransform: 'uppercase', margin: '0 0 10px 0', letterSpacing: '0.5px' }}>
                      How It Works
                    </h4>
                    <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {howItWorks.map((step, idx) => (
                        <li key={idx} style={{ fontSize: '13px', color: C.text, lineHeight: 1.4 }}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Terms and Conditions */}
                {termsAndConditions && (
                  <div style={{ background: C.bgSecondary, padding: '12px', borderRadius: '10px', border: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                      Terms &amp; Conditions
                    </span>
                    <p style={{ fontSize: '12px', color: C.textMid, margin: 0, lineHeight: 1.4 }}>
                      {termsAndConditions}
                    </p>
                  </div>
                )}
              </div>

              <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: '10px', background: C.bgSecondary }}>
                <button
                  onClick={() => {
                    handleToggleCompare(showBenefitsProduct);
                    setShowBenefitsProduct(null);
                  }}
                  style={{
                    ...S.btn(compareList.some(p => p.id === showBenefitsProduct.id) ? 'outline' : 'primary'),
                    flex: 1, padding: '12px', fontSize: '13px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  {compareList.some(p => p.id === showBenefitsProduct.id) ? '✓ Selected for Compare' : 'Add to Compare'}
                </button>
                <button
                  onClick={() => {
                    setShowBenefitsProduct(null);
                    handleApply(showBenefitsProduct);
                  }}
                  style={{
                    ...S.btn('primary'),
                    background: C.green,
                    borderColor: C.green,
                    flex: 1, padding: '12px', fontSize: '13px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Apply Now
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══ FLOATING COMPARE BAR ═══ */}
      {compareList.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: isMobile ? '64px' : '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: '600px',
          background: C.card,
          border: `2px solid ${C.primary}`,
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          padding: '12px 18px',
          zIndex: 900,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: C.primary, whiteSpace: 'nowrap', display: isMobile ? 'none' : 'inline' }}>
              Compare ({compareList.length}/2):
            </span>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
              {compareList.map(prod => (
                <div key={prod.id} style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: C.bgSecondary, border: `1px solid ${C.border}`,
                  padding: '4px 10px', borderRadius: '8px', flexShrink: 0
                }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: C.text, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: isMobile ? '100px' : '150px' }}>
                    {prod.name}
                  </span>
                  <button
                    onClick={() => handleToggleCompare(prod)}
                    style={{ background: 'none', border: 'none', color: C.textLight, cursor: 'pointer', fontWeight: 900, fontSize: '11px', padding: '2px' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              {compareList.length === 1 && (
                <div style={{
                  display: 'flex', alignItems: 'center',
                  background: 'transparent', border: `1px dashed ${C.border}`,
                  padding: '4px 10px', borderRadius: '8px', color: C.textLight, fontSize: '11.5px', fontWeight: 600, whiteSpace: 'nowrap'
                }}>
                  + Add second product
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            <button
              onClick={() => {
                setLoadingCompare(true);
                setShowCompareModal(true);
                setTimeout(() => {
                  setLoadingCompare(false);
                }, 800);
              }}
              disabled={compareList.length < 2}
              style={{
                ...S.btn('primary'),
                padding: '8px 16px',
                fontSize: '12px',
                borderRadius: '10px',
                fontWeight: 750,
                cursor: compareList.length < 2 ? 'not-allowed' : 'pointer',
                opacity: compareList.length < 2 ? 0.5 : 1
              }}
            >
              Compare
            </button>
            <button
              onClick={() => setCompareList([])}
              style={{
                ...S.btn('outline'),
                padding: '8px 12px',
                fontSize: '12px',
                borderRadius: '10px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ═══ COMPARISON SIDE-BY-SIDE MODAL ═══ */}
      {showCompareModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1001,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', padding: '16px'
        }}>
          <div style={{
            background: C.card, width: '100%', maxWidth: '800px',
            borderRadius: '24px', overflow: 'hidden', border: `1.5px solid ${C.border}`,
            boxShadow: '0 25px 70px rgba(0,0,0,0.3)', position: 'relative',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column'
          }}>
            <button
              onClick={() => setShowCompareModal(false)}
              style={{
                position: 'absolute', top: '16px', right: '16px', zIndex: 10,
                width: '32px', height: '32px', borderRadius: '50%', background: C.bgSecondary,
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: C.textMid, fontSize: '16px', fontWeight: 700
              }}
            >
              ✕
            </button>

            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}` }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: 0 }}>
                Product Comparison
              </h3>
              <p style={{ fontSize: '13px', color: C.textLight, margin: '4px 0 0' }}>
                Comparing selected finance options side-by-side
              </p>
            </div>

            {loadingCompare ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '60px 0' }}>
                <span style={{
                  width: 38, height: 38, borderRadius: '50%',
                  border: `3px solid ${C.border}`, borderTopColor: C.primary,
                  animation: 'spin .8s linear infinite', display: 'inline-block'
                }} />
                <div style={{ fontSize: '14px', fontWeight: 700, color: C.textMid }}>Analyzing features and rates...</div>
              </div>
            ) : (() => {
              const p1 = compareList[0];
              const p2 = compareList[1];
              if (!p1 || !p2) return null;

              const c1Details = getCardDetails(p1.id || p1.name.toLowerCase().replace(/[^a-z0-9]/g, '-'), p1.name);
              const c2Details = getCardDetails(p2.id || p2.name.toLowerCase().replace(/[^a-z0-9]/g, '-'), p2.name);

              return (
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', color: C.text }}>
                    <thead>
                      <tr>
                        <th style={{ width: '25%', padding: '12px', borderBottom: `2px solid ${C.border}`, textAlign: 'left' }}>Parameter</th>
                        <th style={{ width: '37.5%', padding: '12px', borderBottom: `2px solid ${C.border}`, textAlign: 'left', color: C.primary, fontWeight: 800 }}>
                          {p1.name}
                        </th>
                        <th style={{ width: '37.5%', padding: '12px', borderBottom: `2px solid ${C.border}`, textAlign: 'left', color: C.primary, fontWeight: 800 }}>
                          {p2.name}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Payout */}
                      <tr>
                        <td style={{ padding: '14px 12px', borderBottom: `1px solid ${C.border}`, fontWeight: 800, color: C.textLight }}>Your Payout</td>
                        <td style={{ padding: '14px 12px', borderBottom: `1px solid ${C.border}`, fontWeight: 800, color: C.green, fontSize: '15px' }}>
                          ₹{parseFloat(p1.commission_value || 0).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '14px 12px', borderBottom: `1px solid ${C.border}`, fontWeight: 800, color: C.green, fontSize: '15px' }}>
                          ₹{parseFloat(p2.commission_value || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                      {/* Bank Code */}
                      <tr>
                        <td style={{ padding: '14px 12px', borderBottom: `1px solid ${C.border}`, fontWeight: 700, color: C.textLight }}>Partner Bank</td>
                        <td style={{ padding: '14px 12px', borderBottom: `1px solid ${C.border}`, fontWeight: 700 }}>{p1.bank_code || 'BANK'}</td>
                        <td style={{ padding: '14px 12px', borderBottom: `1px solid ${C.border}`, fontWeight: 700 }}>{p2.bank_code || 'BANK'}</td>
                      </tr>
                      {/* Category */}
                      <tr>
                        <td style={{ padding: '14px 12px', borderBottom: `1px solid ${C.border}`, fontWeight: 700, color: C.textLight }}>Category</td>
                        <td style={{ padding: '14px 12px', borderBottom: `1px solid ${C.border}`, textTransform: 'capitalize' }}>
                          {p1.category?.replace(/_/g, ' ') || 'Finance'}
                        </td>
                        <td style={{ padding: '14px 12px', borderBottom: `1px solid ${C.border}`, textTransform: 'capitalize' }}>
                          {p2.category?.replace(/_/g, ' ') || 'Finance'}
                        </td>
                      </tr>
                      {/* Key Features */}
                      <tr>
                        <td style={{ padding: '14px 12px', borderBottom: `1px solid ${C.border}`, fontWeight: 700, color: C.textLight }}>Key Features</td>
                        <td style={{ padding: '14px 12px', borderBottom: `1px solid ${C.border}`, verticalAlign: 'top' }}>
                          <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {c1Details.features.map((f, idx) => <li key={idx}>{f}</li>)}
                          </ul>
                        </td>
                        <td style={{ padding: '14px 12px', borderBottom: `1px solid ${C.border}`, verticalAlign: 'top' }}>
                          <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {c2Details.features.map((f, idx) => <li key={idx}>{f}</li>)}
                          </ul>
                        </td>
                      </tr>
                      {/* Eligibility */}
                      <tr>
                        <td style={{ padding: '14px 12px', borderBottom: `1px solid ${C.border}`, fontWeight: 700, color: C.textLight }}>Eligibility</td>
                        <td style={{ padding: '14px 12px', borderBottom: `1px solid ${C.border}`, verticalAlign: 'top' }}>
                          {c1Details.eligibility.criteria}
                        </td>
                        <td style={{ padding: '14px 12px', borderBottom: `1px solid ${C.border}`, verticalAlign: 'top' }}>
                          {c2Details.eligibility.criteria}
                        </td>
                      </tr>
                      {/* Documents Required */}
                      <tr>
                        <td style={{ padding: '14px 12px', borderBottom: `1px solid ${C.border}`, fontWeight: 700, color: C.textLight }}>Documents</td>
                        <td style={{ padding: '14px 12px', borderBottom: `1px solid ${C.border}`, verticalAlign: 'top' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {c1Details.eligibility.documentsRequired.map((doc, idx) => (
                              <span key={idx} style={{ fontSize: '10.5px', background: C.bgSecondary, padding: '2px 6px', borderRadius: '4px', border: `1px solid ${C.border}` }}>
                                {doc}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: '14px 12px', borderBottom: `1px solid ${C.border}`, verticalAlign: 'top' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {c2Details.eligibility.documentsRequired.map((doc, idx) => (
                              <span key={idx} style={{ fontSize: '10.5px', background: C.bgSecondary, padding: '2px 6px', borderRadius: '4px', border: `1px solid ${C.border}` }}>
                                {doc}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })()}

            <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', gap: '10px', background: C.bgSecondary }}>
              <button
                onClick={() => {
                  setShowCompareModal(false);
                  setCompareList([]);
                }}
                style={{
                  ...S.btn('outline'), padding: '10px 20px', fontSize: '13px', borderRadius: '10px', cursor: 'pointer'
                }}
              >
                Reset Comparison
              </button>
              <button
                onClick={() => setShowCompareModal(false)}
                style={{
                  ...S.btn('primary'), padding: '10px 24px', fontSize: '13px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700
                }}
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .gkp-product-card {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .gkp-product-card:hover {
          transform: translateY(-6px) !important;
          box-shadow: ${isDark ? '0 10px 30px rgba(249, 115, 22, 0.15)' : '0 20px 40px rgba(99, 102, 241, 0.15)'} !important;
          border-color: ${C.primary} !important;
        }
        .hover-bg-button {
          transition: background-color 0.2s ease, color 0.2s ease !important;
        }
        .hover-bg-button:hover {
          background-color: ${C.bgSecondary} !important;
        }
        .hover-bg-button-danger {
          transition: all 0.2s ease !important;
        }
        .hover-bg-button-danger:hover {
          background-color: ${C.red}12 !important;
          border-color: ${C.red}40 !important;
        }
        .hover-scale-button {
          transition: all 0.2s ease !important;
        }
        .hover-scale-button:hover {
          transform: scale(1.02);
          box-shadow: ${isDark ? 'none' : `0 6px 20px ${C.primary}30`} !important;
        }
        .hover-scale-button:active {
          transform: scale(0.98);
        }
        .hover-scale-button svg {
          transition: transform 0.2s ease;
        }
        .hover-scale-button:hover svg {
          transform: translateX(3px);
        }
      `}</style>
      </div>
    </div>
  );
}
