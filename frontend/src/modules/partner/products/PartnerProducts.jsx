import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useLocation } from 'react-router-dom';
import api from '../../../services/api';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import { useActiveBanks } from '../../../contexts/BanksContext';
import { getCleanImageUrl } from '../../../utils/urlHelper';
import { resolveAndApply } from '../../../services/applicationResolver';
import { useAuthStore } from '../../../app/store/authStore';
import { usePartnerStore } from '../../../app/store/partnerStore';

import { 
  MdFilterList, MdSearch, MdCheckCircle, MdLocalOffer, 
  MdAccessTime, MdInfoOutline, MdClose, MdShare, MdChevronRight 
} from 'react-icons/md';
import { FaBalanceScale } from 'react-icons/fa';
import { getCardDetails } from '../../home/components/CreditCards/CardDetailsData';
import { getBankApplyLink } from '../../home/components/CreditCards/cardLinkHelper';

const CATEGORIES = [
  { id: 'all', label: 'All Products' },
  { id: 'credit_card', label: 'Credit Cards' },
  { id: 'loans', label: 'Loans' },
  { id: 'insurance', label: 'Insurance' },
  { id: 'others', label: 'Others' },
];

const BANKS = ['All Banks', 'HDFC', 'SBI', 'AXIS', 'INDUSIND', 'KOTAK', 'YES', 'BOB', 'DCB', 'EQUITAS', 'FEDERAL', 'ICICI', 'IDFC', 'RBL', 'SMB'];

const getCategoryEmoji = (cat) => {
  const c = cat?.toLowerCase() || '';
  if (c.includes('card') || c === 'credit_card') return '💳';
  if (c.includes('loan') || c === 'loans') return '🏦';
  if (c.includes('insurance')) return '🛡';
  if (c === 'others') return '📦';
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

export default function PartnerProducts({ initialSearch = '', initialBank = '', initialCategory = '' }) {
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

  const [shareModalProduct, setShareModalProduct] = useState(null);
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [generatingShareLink, setGeneratingShareLink] = useState(false);

  const handleCopyLink = async (product) => {
    setGeneratingShareLink(true);
    try {
      const res = await api.post('/partner/share-link', { productId: product.id });
      if (res.data?.success && res.data?.data) {
        const shareLink = res.data.data.share_link;
        const shareText = `Apply for ${product.name} on GharKaPaisa! Click here to apply: ${shareLink}`;
        
        if (navigator.share) {
          navigator.share({
            title: product.name,
            text: shareText,
            url: shareLink
          }).catch(() => {
            setShareModalProduct({ ...product, shareLink, trackingToken: res.data.data.tracking_token });
          });
        } else {
          setShareModalProduct({ ...product, shareLink, trackingToken: res.data.data.tracking_token });
        }
      } else {
        alert('Failed to generate share link. Please try again.');
      }
    } catch (err) {
      console.error('Share link generation error:', err);
      alert('Failed to generate share link. Please try again.');
    } finally {
      setGeneratingShareLink(false);
    }
  };

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters & Sorting & Pagination
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Normalize bank name string
  const getNormalizedBank = (bankStr) => {
    if (!bankStr || bankStr.toLowerCase() === 'all banks' || bankStr.toLowerCase() === 'all') return 'All Banks';
    const foundInBanks = BANKS.find(b => b.toLowerCase() === bankStr.toLowerCase());
    if (foundInBanks) return foundInBanks;
    const foundInActive = activeBanks.find(b => b.short_code?.toLowerCase() === bankStr.toLowerCase() || b.name?.toLowerCase().includes(bankStr.toLowerCase()));
    if (foundInActive) return foundInActive.short_code || foundInActive.name;
    return bankStr;
  };

  const [search, setSearch] = useState(() => initialSearch || searchParams.get('q') || searchParams.get('search') || "");
  const [activeCategory, setActiveCategory] = useState(() => initialCategory || searchParams.get('category') || "all");
  const [activeBank, setActiveBank] = useState(() => getNormalizedBank(initialBank || searchParams.get('bank') || "All Banks"));
  const [featureFilter, setFeatureFilter] = useState("all"); // 'all', 'ltf', 'high_payout', 'high_approval'
  const [filterTab, setFilterTab] = useState("products"); // 'products' or 'banks'
  const [sortBy, setSortBy] = useState("featured");
  const [minCommission, setMinCommission] = useState(0);
  const [minApproval, setMinApproval] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [cardsPerPage, setCardsPerPage] = useState(12);

  // Sync initialBank, initialCategory, or initialSearch props
  useEffect(() => {
    if (initialBank) setActiveBank(getNormalizedBank(initialBank));
  }, [initialBank, activeBanks]);

  useEffect(() => {
    if (initialCategory) setActiveCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    if (initialSearch) {
      setSearch(initialSearch);
    } else {
      const q = searchParams.get('q') || searchParams.get('search');
      if (q) setSearch(q);
    }
  }, [initialSearch, searchParams]);

  // Memoize active filters count for the badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (activeCategory !== 'all') count++;
    if (activeBank !== 'All Banks') count++;
    if (featureFilter !== 'all') count++;
    if (minCommission !== 0) count++;
    if (minApproval !== 0) count++;
    if (search.trim() !== '') count++;
    return count;
  }, [activeCategory, activeBank, featureFilter, minCommission, minApproval, search]);

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
  }, [search, activeCategory, activeBank, filterTab, sortBy, minCommission, minApproval, cardsPerPage]);

  // Apply Modal state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [mobile, setMobile] = useState("");
  const [processType, setProcessType] = useState("lead_punching"); // 'lead_punching', 'linked_share', 'direct_bank'
  const [submitting, setSubmitting] = useState(false);
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
    setSelectedProduct(product);
    setCustomerName("");
    setCountryCode("+91");
    setMobile("");
    setProcessType("lead_punching");
    setFormErrors({});
  };

  const handleSubmitLead = async (e) => {
    if (e) e.preventDefault();

    const errors = {};
    if (!customerName.trim() || customerName.trim().length < 2) {
      errors.customerName = "Customer Name must be at least 2 characters.";
    }
    if (!mobile.trim() || !/^[6-9]\d{9}$/.test(mobile.trim())) {
      errors.mobile = "Please enter a valid 10-digit mobile number.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);

    try {
      const code = partnerCode || user?.partner_code || 'PARTNER';
      const directBankUrl = selectedProduct.application_url || selectedProduct.apply_url || selectedProduct.public_url || selectedProduct.partner_url || selectedProduct.redirect_url || selectedProduct.bank_link || selectedProduct.tracking_url || getBankApplyLink(selectedProduct.name, selectedProduct.bank_code || selectedProduct.bank_name) || `${window.location.origin}/redirect/${selectedProduct.category}?id=${selectedProduct.id}&partner=${code}`;

      const payload = {
        product_id: selectedProduct.id,
        full_name: customerName.trim(),
        country_code: countryCode || '+91',
        mobile: mobile.trim(),
        process_type: processType,
        agree_terms: true
      };

      await api.post('/applications/partner-apply', payload).catch(err => console.warn('API save note:', err));
      usePartnerStore.getState().fetchCustomers().catch(() => {});

      if (processType === 'lead_punching') {
        alert(`✅ Lead punched successfully for ${customerName.trim()} (${mobile.trim()})!\nApplication recorded under your Partner account.`);
      } else if (processType === 'linked_share') {
        const shareMsg = `Hi ${customerName.trim()}, apply for ${selectedProduct.name} directly on official bank portal: ${directBankUrl}`;
        const waUrl = `https://wa.me/91${mobile.trim()}?text=${encodeURIComponent(shareMsg)}`;
        window.open(waUrl, '_blank');
        alert(`✅ Share link generated & opened for ${customerName.trim()}!\nLink: ${directBankUrl}`);
      } else if (processType === 'direct_bank') {
        window.open(directBankUrl, '_blank');
        alert(`✅ Opening direct bank application portal for ${selectedProduct.name}...`);
      }

      setSelectedProduct(null);
      setCustomerName("");
      setMobile("");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to process lead. Please try again.");
    } finally {
      setSubmitting(false);
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
    if (activeBank !== 'All Banks') {
      const activeBankLower = activeBank.toLowerCase().trim();
      const isAvailableInActive = banksForCategory.some(b => b.toLowerCase().trim() === activeBankLower);
      if (!isAvailableInActive && banksForCategory.length > 1) {
        const hasMatchingProduct = products.some(p => 
          p.bank_code?.toLowerCase() === activeBankLower || 
          p.bank_name?.toLowerCase().includes(activeBankLower) || 
          p.name?.toLowerCase().includes(activeBankLower)
        );
        if (!hasMatchingProduct) {
          setActiveBank('All Banks');
        }
      }
    }
  }, [banksForCategory, activeBank, products]);

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
                        
    const pCat = (p.category || '').toLowerCase();
    let matchCategory = false;
    if (activeCategory === 'all') {
      matchCategory = true;
    } else if (activeCategory === 'credit_card') {
      matchCategory = pCat.includes('card') || pCat.includes('credit');
    } else if (activeCategory === 'loans' || activeCategory === 'personal_loan' || activeCategory === 'business_loan' || activeCategory === 'home_loan') {
      matchCategory = pCat.includes('loan');
    } else if (activeCategory === 'insurance') {
      matchCategory = pCat.includes('insurance');
    } else if (activeCategory === 'others') {
      matchCategory = !pCat.includes('card') && !pCat.includes('credit') && !pCat.includes('loan') && !pCat.includes('insurance');
    } else {
      matchCategory = pCat === activeCategory;
    }
    const activeBankLower = (activeBank || '').toLowerCase().trim();
    const matchBank = !activeBank || activeBankLower === 'all banks' || activeBankLower === 'all' ||
      (p.bank_code && p.bank_code.toLowerCase() === activeBankLower) ||
      (p.bank_name && p.bank_name.toLowerCase().includes(activeBankLower)) ||
      (p.bank_slug && p.bank_slug.toLowerCase() === activeBankLower) ||
      (p.name && p.name.toLowerCase().includes(activeBankLower));
    
    // Commission Filter
    const matchCommission = parseFloat(p.commission_value || 0) >= minCommission;
    
    // Approval % Filter
    const matchApproval = approvalRate >= minApproval;
    
    // Feature Filter
    const pName = (p.name || '').toLowerCase();
    const pDesc = (p.description || '').toLowerCase();
    const matchFeature = featureFilter === 'all' ||
      (featureFilter === 'ltf' && (pName.includes('free') || pName.includes('ltf') || pName.includes('pixel') || pDesc.includes('free'))) ||
      (featureFilter === 'high_payout' && parseFloat(p.commission_value || 0) >= 1000) ||
      (featureFilter === 'high_approval' && approvalRate >= 88);
    
    return matchSearch && matchCategory && matchBank && matchCommission && matchApproval && matchFeature;
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
  const limitValue = cardsPerPage === 'all' ? sortedProducts.length : cardsPerPage;
  const indexOfLastCard = cardsPerPage === 'all' ? sortedProducts.length : currentPage * limitValue;
  const indexOfFirstCard = cardsPerPage === 'all' ? 0 : indexOfLastCard - limitValue;
  const currentCards = cardsPerPage === 'all' ? sortedProducts : sortedProducts.slice(indexOfFirstCard, indexOfLastCard);
  const totalPages = cardsPerPage === 'all' ? 1 : Math.ceil(sortedProducts.length / limitValue);

  // Smart Pagination helper to avoid overflowing mobile screen
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = isMobile ? 3 : 5;
    
    if (totalPages <= maxVisiblePages + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      let start = Math.max(2, currentPage - Math.floor(maxVisiblePages / 2));
      let end = Math.min(totalPages - 1, currentPage + Math.floor(maxVisiblePages / 2));
      
      if (currentPage <= Math.floor(maxVisiblePages / 2) + 1) {
        end = maxVisiblePages;
      } else if (currentPage >= totalPages - Math.floor(maxVisiblePages / 2)) {
        start = totalPages - maxVisiblePages + 1;
      }
      
      if (start > 2) {
        pages.push('...');
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < totalPages - 1) {
        pages.push('...');
      }
      
      pages.push(totalPages);
    }
    return pages;
  };

  const sectionLabel = { fontSize: '11px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' };

  // Helper to render filter options block
  const renderFilterContent = (isDrawer = false) => (
    <div style={isDrawer ? {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: '0 4px',
      boxSizing: 'border-box'
    } : {
      ...S.card,
      padding: '24px',
      borderRadius: '20px',
      background: C.card,
      border: `1.5px solid ${C.border}`,
      boxShadow: isDark ? 'none' : '0 10px 30px rgba(0,0,0,0.04)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexShrink: 0 }}>
        <h3 style={{ fontWeight: 800, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: '18px' }}>
          <MdFilterList size={20} style={{ color: C.primary }} /> {t("Filter Products")}
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

      {/* Filter Body Area */}
      <div style={isDrawer ? {
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        paddingBottom: '20px',
        paddingRight: '4px'
      } : {
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* ─── TWO MAIN FILTER SELECT DROPDOWNS: ALL PRODUCTS & ALL BANKS ─── */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexDirection: 'column' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px', display: 'block' }}>
              {t("Product Category")}
            </label>
            <select
              id="sidebar-select-products"
              value={activeCategory}
              onChange={(e) => {
                setActiveCategory(e.target.value);
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
              <option value="all" style={{ background: isDark ? '#18181B' : '#FFFFFF', color: isDark ? '#F8FAFC' : '#111827' }}>🛍️ {t("All Products")}</option>
              {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                <option key={cat.id} value={cat.id} style={{ background: isDark ? '#18181B' : '#FFFFFF', color: isDark ? '#F8FAFC' : '#111827' }}>
                  {getCategoryEmoji(cat.id)} {t(cat.label)}
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
              <option value="All Banks" style={{ background: isDark ? '#18181B' : '#FFFFFF', color: isDark ? '#F8FAFC' : '#111827' }}>🏦 {t("All Banks")}</option>
              {BANKS.filter(b => b !== 'All Banks').map(bank => (
                <option key={bank} value={bank} style={{ background: isDark ? '#18181B' : '#FFFFFF', color: isDark ? '#F8FAFC' : '#111827' }}>
                  🏦 {bank}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ height: 1, background: C.border, margin: '0 0 20px' }} />

        {/* Card Features */}
        <p style={sectionLabel}>{t("Card Features")}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
          {[
            { id: 'all', label: t('All Cards') },
            { id: 'ltf', label: `🎁 ${t('Lifetime Free')}` },
            { id: 'high_payout', label: `🔥 ${t('High Payout (₹1000+)')}` },
            { id: 'high_approval', label: `⭐ ${t('High Approval (88%+)')}` }
          ].map(feat => {
            const isActive = featureFilter === feat.id;
            return (
              <button
                key={feat.id}
                type="button"
                onClick={() => setFeatureFilter(feat.id)}
                style={{
                  textAlign: 'left', padding: '9px 12px', borderRadius: '10px',
                  fontSize: '13px', fontWeight: 650, border: 'none', cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: isActive ? `${C.primary}15` : 'transparent',
                  color: isActive ? C.primary : C.textMid,
                }}
                className={isActive ? "" : "hover-bg-button"}
              >
                {feat.label}
              </button>
            );
          })}
        </div>

        {/* Commission */}
        <p style={sectionLabel}>{t("Commission")}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
          {[0, 500, 1000, 1500].map(val => {
            const isActive = minCommission === val;
            return (
              <button
                key={val}
                type="button"
                onClick={() => { setMinCommission(val); }}
                style={{
                  textAlign: 'left', padding: '9px 12px', borderRadius: '10px',
                  fontSize: '13px', fontWeight: 650, border: 'none', cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: isActive ? `${C.primary}15` : 'transparent',
                  color: isActive ? C.primary : C.textMid,
                }}
                className={isActive ? "" : "hover-bg-button"}
              >
                {val === 0 ? t('Any Payout') : `₹${val}+`}
              </button>
            );
          })}
        </div>

        {/* Cards Per Page */}
        <p style={sectionLabel}>{t("Cards Per Page")}</p>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {[12, 24, 48, 'all'].map(val => {
            const isActive = cardsPerPage === val;
            return (
              <button
                key={val}
                type="button"
                onClick={() => setCardsPerPage(val)}
                style={{
                  flex: 1, padding: '8px 4px', borderRadius: '10px',
                  fontSize: '12px', fontWeight: 700,
                  border: isActive ? `1.5px solid ${C.primary}` : `1px solid ${C.border}`,
                  cursor: 'pointer',
                  background: isActive ? `${C.primary}15` : 'transparent',
                  color: isActive ? C.primary : C.textMid
                }}
              >
                {val === 'all' ? t('All') : `${val}`}
              </button>
            );
          })}
        </div>
      </div>

      {isDrawer ? (
        <div style={{
          marginTop: 'auto',
          paddingTop: '16px',
          display: 'flex',
          gap: '10px',
          borderTop: `1.5px solid ${C.border}`,
          background: C.card,
          flexShrink: 0
        }}>
          <button
            type="button"
            onClick={() => {
              setActiveCategory('all');
              setActiveBank('All Banks');
              setFeatureFilter('all');
              setMinCommission(0);
              setMinApproval(0);
              setSearch('');
              setSortBy('featured');
              setShowMobileFilter(false);
            }}
            style={{
              ...S.btn('outline'),
              flex: 1,
              padding: '12px 6px',
              fontSize: '13px',
              fontWeight: 700,
              borderRadius: '10px',
              cursor: 'pointer',
              borderColor: C.red,
              color: C.red
            }}
          >
            {t("Reset")}
          </button>
          <button
            type="button"
            onClick={() => setShowMobileFilter(false)}
            style={{
              ...S.btn('primary'),
              flex: 1.5,
              padding: '12px 6px',
              fontSize: '13px',
              fontWeight: 800,
              borderRadius: '10px',
              cursor: 'pointer',
              background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
              color: '#fff',
              border: 'none',
              textAlign: 'center'
            }}
          >
            {t("Show {{count}} Results", { count: filteredProducts.length })}
          </button>
        </div>
      ) : (
        <button
          onClick={() => {
            setActiveCategory('all');
            setActiveBank('All Banks');
            setFeatureFilter('all');
            setMinCommission(0);
            setMinApproval(0);
            setSearch('');
            setSortBy('featured');
          }}
          style={{
            width: '100%', padding: '12px', borderRadius: '10px',
            background: 'none', border: `1.5px solid ${C.border}`,
            color: C.red, fontWeight: 700, fontSize: '13px', cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          className="hover-bg-button-danger"
        >
          {t("Reset Filters")}
        </button>
      )}
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
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', justifyContent: 'flex-end'
          }}>
            <div style={{
              width: '85%', maxWidth: '320px', height: '100%',
              background: C.card, padding: '16px 20px',
              boxShadow: '-10px 0 30px rgba(0,0,0,0.15)',
              display: 'flex', flexDirection: 'column',
              boxSizing: 'border-box'
            }}>
              {renderFilterContent(true)}
            </div>
          </div>
        )}

      {/* ═══ MAIN CONTENT ═══ */}
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Smart & User-Friendly Filter Controls Header */}
        <div style={{
          ...S.card,
          padding: isMobile ? '14px' : '18px 22px',
          borderRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          background: C.card,
          border: `1.5px solid ${C.border}`,
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(15,23,42,0.04)'
        }}>
          
          {/* Row 1: Search Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', flexDirection: isMobile ? 'column' : 'row' }}>
            <div style={{ position: 'relative', flex: 1, width: '100%' }}>
              <MdSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: C.primary }} size={20} />
              <input 
                type="text" 
                placeholder={t("Search by card name, bank, category, or payout...")} 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  ...S.input,
                  paddingLeft: '42px',
                  paddingRight: search ? '36px' : '14px',
                  height: '44px',
                  fontSize: '13.5px',
                  borderRadius: '12px',
                  border: `1.5px solid ${search ? C.primary : C.border}`,
                  background: isDark ? '#18181B' : '#F8FAFC',
                  color: C.text,
                  boxShadow: search ? `0 0 0 3px ${C.primary}20` : 'none'
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: C.textMid, cursor: 'pointer', padding: '4px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                  title="Clear search"
                >
                  <MdClose size={18} />
                </button>
              )}
            </div>
            
            {!isMobile && (
              <div style={{ display: 'flex', gap: '8px', alignSelf: 'stretch' }}>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    ...S.input,
                    width: '170px',
                    height: '44px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    borderRadius: '12px',
                    padding: '0 10px',
                    background: isDark ? '#18181B' : '#F8FAFC',
                    border: `1.5px solid ${C.border}`
                  }}
                >
                  <option value="featured">✨ Featured</option>
                  <option value="highest_commission">💰 Highest Commission</option>
                  <option value="highest_approval">⭐ Highest Approval</option>
                  <option value="newest">🆕 Newest</option>
                  <option value="a_z">🔤 A-Z</option>
                  <option value="popular">🔥 Popular</option>
                </select>

                <select
                  value={cardsPerPage}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCardsPerPage(val === 'all' ? 'all' : parseInt(val, 10));
                  }}
                  style={{
                    ...S.input,
                    width: '130px',
                    height: '44px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    borderRadius: '12px',
                    padding: '0 10px',
                    background: isDark ? '#18181B' : '#F8FAFC',
                    border: `1.5px solid ${C.border}`
                  }}
                >
                  <option value={12}>12 / page</option>
                  <option value={24}>24 / page</option>
                  <option value={48}>48 / page</option>
                  <option value="all">Show All</option>
                </select>
              </div>
            )}
          </div>

          {/* Mobile Screen Controls: Product & Bank Select Buttons + Sort & Filter Buttons */}
          {isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
              {/* Row 2 on Mobile: Product Category & Select Bank Buttons */}
              <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                <select
                  id="mobile-select-products"
                  value={activeCategory}
                  onChange={(e) => setActiveCategory(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: '12px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: activeCategory !== 'all' ? `1.5px solid ${C.primary}` : `1.5px solid ${C.border}`,
                    background: activeCategory !== 'all' ? `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})` : (isDark ? '#18181B' : '#F8FAFC'),
                    color: activeCategory !== 'all' ? '#FFFFFF' : C.text,
                    outline: 'none'
                  }}
                >
                  <option value="all" style={{ background: isDark ? '#18181B' : '#FFFFFF', color: isDark ? '#F8FAFC' : '#111827' }}>🛍️ {t("Products (All)")}</option>
                  {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                    <option key={cat.id} value={cat.id} style={{ background: isDark ? '#18181B' : '#FFFFFF', color: isDark ? '#F8FAFC' : '#111827' }}>
                      {getCategoryEmoji(cat.id)} {t(cat.label)}
                    </option>
                  ))}
                </select>

                <select
                  id="mobile-select-banks"
                  value={activeBank}
                  onChange={(e) => setActiveBank(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: '12px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: activeBank !== 'All Banks' ? `1.5px solid ${C.primary}` : `1.5px solid ${C.border}`,
                    background: activeBank !== 'All Banks' ? `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})` : (isDark ? '#18181B' : '#F8FAFC'),
                    color: activeBank !== 'All Banks' ? '#FFFFFF' : C.text,
                    outline: 'none'
                  }}
                >
                  <option value="All Banks" style={{ background: isDark ? '#18181B' : '#FFFFFF', color: isDark ? '#F8FAFC' : '#111827' }}>🏦 {t("Banks (All)")}</option>
                  {BANKS.filter(b => b !== 'All Banks').map(bank => (
                    <option key={bank} value={bank} style={{ background: isDark ? '#18181B' : '#FFFFFF', color: isDark ? '#F8FAFC' : '#111827' }}>
                      🏦 {bank}
                    </option>
                  ))}
                </select>
              </div>

              {/* Row 3 on Mobile: Sort By & Filter Drawer Button */}
              <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    ...S.input,
                    flex: 1,
                    height: '42px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    borderRadius: '12px',
                    padding: '0 8px',
                    background: isDark ? '#18181B' : '#F8FAFC',
                    border: `1.5px solid ${C.border}`
                  }}
                >
                  <option value="featured">✨ {t("Featured")}</option>
                  <option value="highest_commission">💰 {t("Highest Commission")}</option>
                  <option value="highest_approval">⭐ {t("Highest Approval")}</option>
                  <option value="newest">🆕 {t("Newest")}</option>
                  <option value="a_z">🔤 {t("A-Z")}</option>
                  <option value="popular">🔥 {t("Popular")}</option>
                </select>

                <button
                  onClick={() => setShowMobileFilter(true)}
                  style={{
                    background: `${C.primary}15`,
                    border: `1.5px solid ${C.primary}`,
                    color: C.primary,
                    borderRadius: '12px',
                    padding: '0 14px',
                    height: '42px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontWeight: 800,
                    fontSize: '12px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flex: 1
                  }}
                >
                  <MdFilterList size={18} /> {t("Filters")} {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}
                </button>
              </div>
            </div>
          ) : null}

          {/* Row 4: Results Count & Active Filter Tags */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', paddingTop: '6px', borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 700, color: C.textMid }}>
                {t("Showing")} <strong style={{ color: C.text, fontSize: '14px' }}>{filteredProducts.length}</strong> {t("products")}
              </span>

              {/* Active Filter Removable Tags */}
              {activeCategory !== 'all' && (
                <span style={{
                  fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '12px',
                  background: `${C.primary}18`, color: C.primary, display: 'inline-flex', alignItems: 'center', gap: '4px'
                }}>
                  {t("Category:")} {t(CATEGORIES.find(c => c.id === activeCategory)?.label)}
                  <MdClose size={12} style={{ cursor: 'pointer' }} onClick={() => setActiveCategory('all')} />
                </span>
              )}

              {activeBank !== 'All Banks' && (
                <span style={{
                  fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '12px',
                  background: `${C.primary}18`, color: C.primary, display: 'inline-flex', alignItems: 'center', gap: '4px'
                }}>
                  {t("Bank:")} {activeBank}
                  <MdClose size={12} style={{ cursor: 'pointer' }} onClick={() => setActiveBank('All Banks')} />
                </span>
              )}

              {featureFilter !== 'all' && (
                <span style={{
                  fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '12px',
                  background: `${C.primary}18`, color: C.primary, display: 'inline-flex', alignItems: 'center', gap: '4px'
                }}>
                  {t("Feature:")} {featureFilter === 'ltf' ? t('Lifetime Free') : featureFilter === 'high_payout' ? t('High Payout') : t('High Approval')}
                  <MdClose size={12} style={{ cursor: 'pointer' }} onClick={() => setFeatureFilter('all')} />
                </span>
              )}

              {minCommission > 0 && (
                <span style={{
                  fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '12px',
                  background: `${C.primary}18`, color: C.primary, display: 'inline-flex', alignItems: 'center', gap: '4px'
                }}>
                  {t("Payout:")} ₹{minCommission}+
                  <MdClose size={12} style={{ cursor: 'pointer' }} onClick={() => setMinCommission(0)} />
                </span>
              )}

              {search && (
                <span style={{
                  fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '12px',
                  background: `${C.primary}18`, color: C.primary, display: 'inline-flex', alignItems: 'center', gap: '4px'
                }}>
                  {t("Search:")} "{search}"
                  <MdClose size={12} style={{ cursor: 'pointer' }} onClick={() => setSearch('')} />
                </span>
              )}
            </div>

            {activeFiltersCount > 0 && (
              <button
                onClick={() => {
                  setActiveCategory('all');
                  setActiveBank('All Banks');
                  setFeatureFilter('all');
                  setMinCommission(0);
                  setMinApproval(0);
                  setSearch('');
                  setSortBy('featured');
                }}
                style={{
                  background: 'none', border: 'none', color: C.red, fontWeight: 800,
                  cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px'
                }}
              >
                {t("Clear All")} ✕
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
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: isMobile ? '10px' : '20px'
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
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: isMobile ? '10px' : '20px'
            }}>
              {currentCards.map((product) => {
                const isSelectedForCompare = compareList.some(p => p.id === product.id);
                const approvalRate = getApprovalRate(product);
                const cardDetails = getCardDetails(product.id || product.name.toLowerCase().replace(/[^a-z0-9]/g, '-'), product.name);
                const eligibilityCriteria = cardDetails.eligibility?.criteria || 'Min Age: 21 | Income details apply';
                const badges = getMarketingBadges(product);
                const emoji = getCategoryEmoji(product.category);

                let keyFeatures = [];
                if (Array.isArray(product.features) && product.features.length > 0) {
                  keyFeatures = product.features;
                } else if (Array.isArray(product.features_list) && product.features_list.length > 0) {
                  keyFeatures = product.features_list;
                } else if (product.description && typeof product.description === 'string' && product.description.includes('•')) {
                  keyFeatures = product.description.split('•').map(s => s.trim()).filter(Boolean);
                } else if (cardDetails.features && cardDetails.features.length > 0) {
                  keyFeatures = cardDetails.features;
                } else if (product.description) {
                  keyFeatures = [product.description];
                }

                return (
                  <div 
                    key={product.id} 
                    className="gkp-product-card"
                    style={{
                      ...S.card,
                      padding: isMobile ? '14px 12px' : '20px',
                      borderRadius: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: isMobile ? '12px' : '14px',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      border: isSelectedForCompare ? `2.5px solid ${C.primary}` : `1.5px solid ${C.border}`,
                      boxShadow: isSelectedForCompare ? `0 12px 28px ${C.primary}20` : (isDark ? 'none' : '0 4px 15px rgba(0,0,0,0.02)'),
                      background: C.card
                    }}
                  >
                    <div>
                      {/* Top Badges Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '4px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{
                            ...S.tag(C.primary),
                            fontSize: isMobile ? '10px' : '11px',
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
                              fontSize: isMobile ? '10px' : '11px', fontWeight: 800, color: '#fff',
                              background: C.green, padding: isMobile ? '3px 8px' : '4px 10px', borderRadius: '8px'
                            }}>
                              ✓ Compare
                            </span>
                          )}
                        </div>
                        <span style={{
                          fontSize: isMobile ? '10px' : '11px', fontWeight: 700, color: C.textMid,
                          background: C.bgSecondary, padding: isMobile ? '3px 8px' : '4px 10px', borderRadius: '8px',
                          textTransform: 'uppercase', letterSpacing: '0.5px',
                          border: `1px solid ${C.border}`
                        }}>
                          {product.bank_code || 'BANK'}
                        </span>
                      </div>

                      {/* Product Logo & Info Header */}
                      <div style={{ display: 'flex', gap: isMobile ? '10px' : '12px', alignItems: 'center', marginBottom: '10px' }}>
                        <div style={{
                          width: isMobile ? 44 : 52,
                          height: isMobile ? 44 : 52,
                          flexShrink: 0,
                          background: C.bgSecondary,
                          borderRadius: '12px',
                          border: `1.5px solid ${C.border}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          fontSize: isMobile ? '20px' : '24px',
                          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                        }}>
                          {product.image_url ? (
                            <img src={getCleanImageUrl(product.image_url)} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '3px' }} />
                          ) : (
                            emoji
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={{
                            fontSize: isMobile ? '14.5px' : '16.5px',
                            fontWeight: 800,
                            color: C.text,
                            margin: '0 0 2px',
                            lineHeight: 1.3,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {product.name}
                          </h3>
                        </div>
                      </div>

                      {/* Key Features */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                        {keyFeatures.slice(0, 3).map((feat, idx) => {
                          const featStr = typeof feat === 'string' ? feat : (feat.title || feat.label || feat.description || '');
                          return featStr ? (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: isMobile ? '11.5px' : '12px', color: C.textMid, fontWeight: 550, lineHeight: 1.3 }}>
                              <MdCheckCircle color={C.green} size={isMobile ? 13 : 14} style={{ flexShrink: 0 }} />
                              <span style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {featStr}
                              </span>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>

                    {/* Footer Action Bar */}
                    <div style={{
                      borderTop: `1px solid ${C.border}`,
                      paddingTop: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      marginTop: 'auto'
                    }}>
                      {/* Payout & Commission Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: isMobile ? '11px' : '12.5px', color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {t("Partner Payout")}
                        </span>
                        <span style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 800, color: C.green }}>
                          ₹{parseFloat(product.commission_value || 0).toLocaleString('en-IN')}
                        </span>
                      </div>

                      {/* Buttons Row 1 */}
                      <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                        <button
                          onClick={() => handleCopyLink(product)}
                          type="button"
                          style={{
                            ...S.btn('outline'),
                            flex: 1,
                            padding: isMobile ? '9px 6px' : '10px 8px',
                            fontSize: isMobile ? '12px' : '12.5px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            fontWeight: 700
                          }}
                        >
                          <MdShare size={isMobile ? 13 : 14} /> {t("Share")}
                        </button>
                        
                        <button
                          onClick={() => handleToggleCompare(product)}
                          type="button"
                          style={{
                            ...S.btn(isSelectedForCompare ? 'primary' : 'outline'),
                            flex: 1,
                            padding: isMobile ? '9px 6px' : '10px 8px',
                            fontSize: isMobile ? '12px' : '12.5px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            fontWeight: 700,
                            borderColor: isSelectedForCompare ? 'transparent' : C.primary,
                            color: isSelectedForCompare ? '#fff' : C.primary
                          }}
                        >
                          <FaBalanceScale size={isMobile ? 13 : 15} />
                          {t("Compare")}
                        </button>
                      </div>

                      {/* Buttons Row 2 */}
                      <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                        <button
                          onClick={() => setShowBenefitsProduct(product)}
                          type="button"
                          style={{
                            ...S.btn('outline'),
                            borderColor: C.border,
                            color: C.textMid,
                            flex: 1,
                            padding: isMobile ? '9px 6px' : '11px 12px',
                            fontSize: isMobile ? '12px' : '13px',
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
                          {t("Benefits")}
                        </button>
                        
                        <button
                          onClick={() => handleApply(product)}
                          style={{
                            background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
                            color: '#fff',
                            border: 'none',
                            flex: 1.5,
                            padding: isMobile ? '9px 6px' : '11px 12px',
                            fontSize: isMobile ? '12px' : '13px',
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
                          {t("Apply")} <MdChevronRight size={isMobile ? 14 : 16} />
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
                
                {getPageNumbers().map((page, idx) => {
                  if (page === '...') {
                    return (
                      <span key={`ellipsis-${idx}`} style={{ padding: '8px', color: C.textLight, fontWeight: 700 }}>
                        ...
                      </span>
                    );
                  }
                  return (
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
                  );
                })}
                
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

      {/* ═══ STREAMLINED 3-OPTION PARTNER APPLY MODAL ═══ */}
      {selectedProduct && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', padding: isMobile ? '10px 10px 85px 10px' : '16px'
        }}>
          <div style={{
            background: C.card, width: '100%', maxWidth: '520px', maxHeight: isMobile ? 'calc(100vh - 100px)' : '90vh',
            borderRadius: '24px', border: `1px solid ${C.border}`,
            boxShadow: '0 25px 60px rgba(0,0,0,0.4)', position: 'relative',
            display: 'flex', flexDirection: 'column', overflow: 'hidden'
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
                Payout: <strong style={{ color: C.green }}>₹{parseFloat(selectedProduct.commission_value || 0).toLocaleString('en-IN')}</strong>
              </p>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitLead} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', margin: 0 }}>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', overflowY: 'auto', flex: 1 }}>
                
                {/* 1. Customer Name */}
                <div>
                  <label style={S.label}>1. Customer Name *</label>
                  <input
                    type="text"
                    placeholder="Enter customer full name"
                    value={customerName}
                    onChange={(e) => { setCustomerName(e.target.value); setFormErrors(prev => ({ ...prev, customerName: null })); }}
                    style={{ ...S.input, height: '44px', fontSize: '14px', borderColor: formErrors.customerName ? C.red : C.border }}
                  />
                  {formErrors.customerName && <span style={{ fontSize: '11.5px', color: C.red, marginTop: '4px', display: 'block' }}>{formErrors.customerName}</span>}
                </div>

                {/* 2. Mobile Number */}
                <div>
                  <label style={S.label}>2. Mobile Number *</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      style={{ ...S.input, width: '90px', height: '44px', fontSize: '13px', fontWeight: 700, padding: '0 8px' }}
                    >
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                    </select>
                    <input
                      type="tel"
                      placeholder="Enter 10-digit mobile number"
                      maxLength={10}
                      value={mobile}
                      onChange={(e) => { setMobile(e.target.value.replace(/\D/g, '')); setFormErrors(prev => ({ ...prev, mobile: null })); }}
                      style={{ ...S.input, flex: 1, height: '44px', fontSize: '14px', borderColor: formErrors.mobile ? C.red : C.border }}
                    />
                  </div>
                  {formErrors.mobile && <span style={{ fontSize: '11.5px', color: C.red, marginTop: '4px', display: 'block' }}>{formErrors.mobile}</span>}
                </div>

                {/* 3. Process By (3 Modes) */}
                <div>
                  <label style={S.label}>3. Process By *</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                    
                    {/* Mode 1: Lead punching only */}
                    <label style={{
                      display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 14px', borderRadius: '12px',
                      border: `2px solid ${processType === 'lead_punching' ? C.primary : C.border}`,
                      background: processType === 'lead_punching' ? `${C.primary}0D` : C.card,
                      cursor: 'pointer', transition: 'all 0.2s'
                    }}>
                      <input
                        type="radio"
                        name="processType"
                        value="lead_punching"
                        checked={processType === 'lead_punching'}
                        onChange={(e) => setProcessType(e.target.value)}
                        style={{ marginTop: '2px', accentColor: C.primary }}
                      />
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 800, color: C.text }}>
                          1. Lead punching only
                        </div>
                        <div style={{ fontSize: '11.5px', color: C.textMid, marginTop: '2px' }}>
                          Records lead directly into your Partner CRM & Applications queue for internal processing.
                        </div>
                      </div>
                    </label>

                    {/* Mode 2: Linked share */}
                    <label style={{
                      display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 14px', borderRadius: '12px',
                      border: `2px solid ${processType === 'linked_share' ? C.primary : C.border}`,
                      background: processType === 'linked_share' ? `${C.primary}0D` : C.card,
                      cursor: 'pointer', transition: 'all 0.2s'
                    }}>
                      <input
                        type="radio"
                        name="processType"
                        value="linked_share"
                        checked={processType === 'linked_share'}
                        onChange={(e) => setProcessType(e.target.value)}
                        style={{ marginTop: '2px', accentColor: C.primary }}
                      />
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 800, color: C.text }}>
                          2. Linked share
                        </div>
                        <div style={{ fontSize: '11.5px', color: C.textMid, marginTop: '2px' }}>
                          Generates & opens a pre-filled WhatsApp share link embedded with the official bank URL.
                        </div>
                      </div>
                    </label>

                    {/* Mode 3: Direct bank process */}
                    <label style={{
                      display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 14px', borderRadius: '12px',
                      border: `2px solid ${processType === 'direct_bank' ? C.primary : C.border}`,
                      background: processType === 'direct_bank' ? `${C.primary}0D` : C.card,
                      cursor: 'pointer', transition: 'all 0.2s'
                    }}>
                      <input
                        type="radio"
                        name="processType"
                        value="direct_bank"
                        checked={processType === 'direct_bank'}
                        onChange={(e) => setProcessType(e.target.value)}
                        style={{ marginTop: '2px', accentColor: C.primary }}
                      />
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 800, color: C.text }}>
                          3. Direct bank process
                        </div>
                        <div style={{ fontSize: '11.5px', color: C.textMid, marginTop: '2px' }}>
                          Immediately opens the official bank portal in a new tab for direct customer application.
                        </div>
                      </div>
                    </label>

                  </div>
                </div>

              </div>

              {/* Modal Sticky Footer Buttons */}
              <div style={{
                position: 'sticky', bottom: 0, zIndex: 10,
                background: C.card, padding: '14px 24px 18px 24px',
                borderTop: `1px solid ${C.border}`, display: 'flex', gap: '10px',
                boxShadow: '0 -4px 14px rgba(0,0,0,0.08)'
              }}>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  style={{
                    ...S.btn('outline'), flex: 1, padding: '12px', fontSize: '13.5px',
                    borderRadius: '12px', cursor: 'pointer', fontWeight: 700
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
                    color: '#ffffff', border: 'none', flex: 2, padding: '12px', fontSize: '13.5px',
                    borderRadius: '12px', cursor: submitting ? 'not-allowed' : 'pointer',
                    fontWeight: 800, boxShadow: `0 4px 14px ${C.primary}35`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                >
                  {submitting ? 'Processing...' : processType === 'lead_punching' ? 'Punch Lead' : processType === 'linked_share' ? 'Generate & Share Link' : 'Open Bank Portal'}
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
                opacity: compareList.length < 2 ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <FaBalanceScale size={15} />
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
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaBalanceScale size={22} style={{ color: C.primary }} />
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

      {/* ═══ UNIVERSAL MULTI-APP SHARE MODAL ═══ */}
      {shareModalProduct && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', padding: '16px'
        }}>
          <div style={{
            background: C.card, width: '100%', maxWidth: '480px',
            borderRadius: '24px', border: `1px solid ${C.border}`,
            boxShadow: '0 25px 60px rgba(0,0,0,0.35)', position: 'relative',
            padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            <button
              onClick={() => { setShareModalProduct(null); setCopiedNotice(false); }}
              style={{
                position: 'absolute', top: '16px', right: '16px',
                background: C.bgSecondary, border: `1px solid ${C.border}`, cursor: 'pointer',
                width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: C.textMid, fontSize: '16px', fontWeight: 700
              }}
            >
              ✕
            </button>

            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '12px', background: `${C.primary}15`, color: C.primary, textTransform: 'uppercase' }}>
                Partner Share Link
              </span>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: '8px 0 4px' }}>
                Share {shareModalProduct.name}
              </h3>
              <p style={{ fontSize: '12px', color: C.textMid, margin: 0 }}>
                Tracked referral link - captures customer info before redirecting to bank:
              </p>
            </div>

            {/* Direct Link Display Box */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 14px', background: C.bgSecondary, borderRadius: '12px',
              border: `1px solid ${C.border}`
            }}>
              <input
                type="text"
                readOnly
                value={shareModalProduct.shareLink}
                style={{
                  flex: 1, background: 'none', border: 'none', color: C.primary,
                  fontSize: '12.5px', fontWeight: 700, outline: 'none',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                }}
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(shareModalProduct.shareLink);
                  setCopiedNotice(true);
                  setTimeout(() => setCopiedNotice(false), 2500);
                }}
                style={{
                  background: C.primary, color: '#fff', border: 'none',
                  padding: '6px 12px', borderRadius: '8px', fontSize: '12px',
                  fontWeight: 700, cursor: 'pointer', flexShrink: 0
                }}
              >
                {copiedNotice ? '✓ Copied!' : 'Copy Link'}
              </button>
            </div>

            {/* Share across any app options */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '6px' }}>
              {/* WhatsApp */}
              <button
                type="button"
                onClick={() => {
                  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(`Apply for ${shareModalProduct.name} on GharKaPaisa! Click here: ${shareModalProduct.shareLink}`)}`;
                  window.open(url, '_blank');
                }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '12px', borderRadius: '12px', border: '1px solid #25D36640',
                  background: '#25D36615', color: '#25D366', fontWeight: 800, fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                <span>💬 WhatsApp</span>
              </button>

              {/* SMS / Messages */}
              <button
                type="button"
                onClick={() => {
                  const url = `sms:?body=${encodeURIComponent(`Apply for ${shareModalProduct.name} on GharKaPaisa! Click here: ${shareModalProduct.shareLink}`)}`;
                  window.open(url, '_blank');
                }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '12px', borderRadius: '12px', border: '1px solid #3B82F640',
                  background: '#3B82F615', color: '#3B82F6', fontWeight: 800, fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                <span>📱 Messages / SMS</span>
              </button>

              {/* Telegram */}
              <button
                type="button"
                onClick={() => {
                  const url = `https://t.me/share/url?url=${encodeURIComponent(shareModalProduct.shareLink)}&text=${encodeURIComponent(`Apply for ${shareModalProduct.name} on GharKaPaisa!`)}`;
                  window.open(url, '_blank');
                }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '12px', borderRadius: '12px', border: '1px solid #0088cc40',
                  background: '#0088cc15', color: '#0088cc', fontWeight: 800, fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                <span>✈️ Telegram</span>
              </button>

              {/* Email */}
              <button
                type="button"
                onClick={() => {
                  const url = `mailto:?subject=${encodeURIComponent(`Apply for ${shareModalProduct.name} on GharKaPaisa`)}&body=${encodeURIComponent(`Click here to apply for ${shareModalProduct.name}:\n${shareModalProduct.shareLink}`)}`;
                  window.open(url, '_blank');
                }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '12px', borderRadius: '12px', border: '1px solid #EA433540',
                  background: '#EA433515', color: '#EA4335', fontWeight: 800, fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                <span>✉️ Email</span>
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
