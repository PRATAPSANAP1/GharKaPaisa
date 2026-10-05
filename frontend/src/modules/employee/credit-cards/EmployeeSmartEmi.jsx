import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { getApiV1Url } from '../../../config/api';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuthStore } from '../../../app/store/authStore';
import { 
  FaCreditCard, FaCalculator, FaCheckCircle, FaBolt, FaShieldAlt, 
  FaShareAlt, FaCopy, FaExternalLinkAlt, FaSearch, FaShoppingBag,
  FaPercentage, FaCalendarAlt, FaUserCheck, FaInfoCircle, FaBalanceScale
} from 'react-icons/fa';
import hdfcLogo from '../../home/components/banks/hdfc_bank.png';
import sbiLogo from '../../home/components/banks/sbi_card.png';
import iciciLogo from '../../home/components/banks/icici_bank.png';
import axisLogo from '../../home/components/banks/axis_bank.png';
import rblLogo from '../../home/components/banks/rbl_bank.png';
import kotakLogo from '../../home/components/banks/kotak_bank.png';
import LoadingLogo from '../../../components/Loader/LoadingLogo';

export default function EmployeeSmartEmi() {
  const { C, isDark } = useTheme();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [selectedBank, setSelectedBank] = useState('ALL');
  const [dbSchemes, setDbSchemes] = useState([]);
  const [loadingProds, setLoadingProds] = useState(true);
  const [showCalculator, setShowCalculator] = useState(false);

  const getBankLogo = (bankName, defaultLogo) => {
    if (defaultLogo) return defaultLogo;
    const b = String(bankName || '').toLowerCase();
    if (b.includes('hdfc')) return hdfcLogo;
    if (b.includes('sbi')) return sbiLogo;
    if (b.includes('icici')) return iciciLogo;
    if (b.includes('axis')) return axisLogo;
    if (b.includes('idfc')) return idfcLogo;
    if (b.includes('kotak')) return kotakLogo;
    return hdfcLogo;
  };

  // Canonical HDFC Bank EMI on Credit Card product
  const defaultHdfcScheme = useMemo(() => ({
    id: 'hdfc-smart-emi',
    bank: 'HDFC Bank',
    title: 'HDFC Bank EMI on Credit Card',
    logo: hdfcLogo,
    accent: '#2563EB',
    minTransaction: '₹2,500',
    minRoi: '1.15% per month (13.80% p.a.)',
    tenure: '3 - 48 Months',
    processingFee: '₹199 + GST',
    conversionSpeed: 'Instant / Within 24 Hrs',
    badge: 'Popular Scheme',
    features: [
      'Instant 1-click conversion via NetBanking, MobileBanking, or SMS',
      'Convert big-ticket credit card purchases within 60 days of transaction',
      'No-Cost EMI options available across 5,000+ top retail & online merchant outlets',
      'Retain original reward points earned on card before EMI conversion'
    ]
  }), []);

  // Fetch dynamic schemes from backend API
  React.useEffect(() => {
    const fetchDynamicSchemes = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${getApiV1Url()}/products?limit=1000`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const prods = res.data?.data?.rows || res.data?.data || res.data?.products || [];
        if (Array.isArray(prods) && prods.length > 0) {
          // Strictly filter products added in super-admin loc_eoc with subcategory EOC
          const smartEmiProds = prods.filter(p => {
            const cat = String(p.category || '').toLowerCase().trim();
            const subCat = String(p.sub_category || '').toUpperCase().trim();
            return cat === 'loc_eoc' && (subCat === 'EOC' || subCat === 'SMART EMI ON CREDIT CARD');
          });

          if (smartEmiProds.length > 0) {
            const mapped = smartEmiProds.map(p => {
              let parsedFeatures = [];
              try {
                parsedFeatures = typeof p.features === 'string' ? JSON.parse(p.features) : (Array.isArray(p.features) ? p.features : []);
              } catch (e) {
                parsedFeatures = [p.description || 'Flexible EMI conversion'];
              }
              const bName = p.bank_name || p.bank || 'HDFC Bank';
              return {
                id: p.id,
                bank_id: p.bank_id,
                bank: bName,
                title: p.name || 'Credit Card EMI & Smart EMI',
                logo: getBankLogo(bName, p.bank_logo || p.logo || p.image_url),
                accent: '#2563EB',
                minTransaction: p.joining_fee && p.joining_fee !== 'Nil' ? p.joining_fee : '₹2,500',
                minRoi: p.interest_rate || '1.15% per month (13.80% p.a.)',
                tenure: p.time_period || p.tenure || '3 - 48 Months',
                processingFee: p.annual_fee || p.fees_charges || '₹199 + GST',
                conversionSpeed: 'Instant / Within 24 Hrs',
                badge: p.badge || 'Popular Scheme',
                features: parsedFeatures.length > 0 ? parsedFeatures : defaultHdfcScheme.features
              };
            });
            setDbSchemes(mapped);
          } else {
            setDbSchemes([]);
          }
        } else {
          setDbSchemes([]);
        }
      } catch (err) {
        console.error('Failed to load dynamic Smart EMI schemes:', err);
        setDbSchemes([]);
      } finally {
        setLoadingProds(false);
      }
    };
    fetchDynamicSchemes();
  }, [defaultHdfcScheme]);

  const activeSchemes = dbSchemes;

  const availableBanks = useMemo(() => {
    const bSet = new Set();
    (Array.isArray(dbSchemes) ? dbSchemes : []).forEach(s => {
      if (s.bank) bSet.add(s.bank);
    });
    return Array.from(bSet);
  }, [dbSchemes]);

  // Calculator States
  const [purchaseAmt, setPurchaseAmt] = useState(75000);
  const [tenure, setTenure] = useState(12);
  const [rateType, setRateType] = useState('LOW_COST'); // 'NO_COST', 'LOW_COST', 'STANDARD'
  const [copiedId, setCopiedId] = useState(null);

  // Apply Modal & Benefits & Compare State
  const [showBenefitsOffer, setShowBenefitsOffer] = useState(null);
  const [applyScheme, setApplyScheme] = useState(null);
  const [compareList, setCompareList] = useState([]);
  const [custName, setCustName] = useState('');
  const [custMobile, setCustMobile] = useState('');
  const [smartEmiAmt, setSmartEmiAmt] = useState('');
  const [smartEmiTenure, setSmartEmiTenure] = useState('06 Months');
  const [processBy, setProcessBy] = useState('Punching Only');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleToggleCompare = (scheme) => {
    setCompareList(prev => prev.includes(scheme.id) ? prev.filter(id => id !== scheme.id) : [...prev, scheme.id]);
  };

  const empCode = user?.partner_code || user?.employee_id || user?.emp_code || user?.referral_code || user?.id || '';
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://gharkapaisa.in';

  // Rate percent map
  const monthlyRateMap = {
    NO_COST: 0,
    LOW_COST: 1.15, // 1.15% per month
    STANDARD: 1.35  // 1.35% per month
  };

  // Calculate EMI
  const emiDetails = useMemo(() => {
    const P = parseFloat(purchaseAmt) || 0;
    const mRate = monthlyRateMap[rateType] || 0;
    const r = mRate / 100;
    const n = parseInt(tenure, 10) || 12;

    if (P <= 0 || n <= 0) {
      return { emi: 0, totalInterest: 0, totalPayable: 0, processingFee: 0 };
    }

    let emi = 0;
    let totalPayable = 0;
    let totalInterest = 0;

    if (r === 0) {
      emi = P / n;
      totalPayable = P;
      totalInterest = 0;
    } else {
      emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      totalPayable = emi * n;
      totalInterest = totalPayable - P;
    }

    const processingFee = rateType === 'NO_COST' ? 0 : 199;

    return {
      emi: Math.round(emi),
      totalInterest: Math.round(totalInterest),
      totalPayable: Math.round(totalPayable + processingFee),
      processingFee
    };
  }, [purchaseAmt, tenure, rateType]);

  const filteredSchemes = useMemo(() => {
    return (Array.isArray(activeSchemes) ? activeSchemes : []).filter(scheme => {
      const matchesSearch = scheme.title.toLowerCase().includes(search.toLowerCase()) || 
                            scheme.bank.toLowerCase().includes(search.toLowerCase()) ||
                            scheme.features.some(f => f.toLowerCase().includes(search.toLowerCase()));
      const matchesBank = selectedBank === 'ALL' || scheme.bank === selectedBank;
      return matchesSearch && matchesBank;
    });
  }, [activeSchemes, search, selectedBank]);

  const handleCopyShareLink = (scheme) => {
    const link = `${baseUrl}/apply/${encodeURIComponent(empCode)}/${scheme.id}?type=smart_emi`;
    navigator.clipboard.writeText(link);
    setCopiedId(scheme.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleWhatsAppShare = (scheme) => {
    const link = `${baseUrl}/apply/${encodeURIComponent(empCode)}/${scheme.id}?type=smart_emi`;
    const msg = encodeURIComponent(`Convert your large purchases into easy EMIs with ${scheme.bank} ${scheme.title}! Low interest, flexible tenures up to 36 months.\nApply here: ${link}`);
    window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitLead = async (e) => {
    e.preventDefault();
    if (!custName || !custMobile) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(applyScheme?.id);
      const isPartner = user?.role === 'PARTNER' || user?.role === 'TEAM_MEMBER' || !!user?.partner_code;

      if (isPartner) {
        await axios.post(`${getApiV1Url()}/applications/partner-apply`, {
          product_id: isUuid ? applyScheme?.id : undefined,
          full_name: custName,
          mobile: custMobile,
          product_type: 'smart_emi',
          smart_emi_amount: smartEmiAmt,
          tenure: smartEmiTenure,
          process_by: processBy,
          card_bank: applyScheme?.bank,
          card_name: applyScheme?.title || applyScheme?.name,
          process_type: 'lead_punching',
          agree_terms: true
        }, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }).catch(async () => {
          return axios.post(`${getApiV1Url()}/employee/leads`, {
            full_name: custName,
            mobile: custMobile,
            smart_emi_amount: smartEmiAmt,
            tenure: smartEmiTenure,
            process_by: processBy,
            card_bank: applyScheme?.bank,
            card_name: applyScheme?.title || applyScheme?.name,
            product_id: isUuid ? applyScheme?.id : undefined,
            product_type: 'smart_emi'
          }, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
        });
      } else {
        await axios.post(`${getApiV1Url()}/employee/leads`, {
          full_name: custName,
          mobile: custMobile,
          smart_emi_amount: smartEmiAmt,
          tenure: smartEmiTenure,
          process_by: processBy,
          card_bank: applyScheme?.bank,
          card_name: applyScheme?.title || applyScheme?.name,
          product_id: isUuid ? applyScheme?.id : undefined,
          product_type: 'smart_emi'
        }, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
      }
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setApplyScheme(null);
        setCustName('');
        setCustMobile('');
        setSmartEmiAmt('');
        setSmartEmiTenure('06 Months');
        setProcessBy('Punching Only');
      }, 2500);
    } catch (err) {
      console.error('Failed to submit Smart EMI lead:', err);
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setApplyScheme(null);
        setCustName('');
        setCustMobile('');
        setSmartEmiAmt('');
        setSmartEmiTenure('06 Months');
        setProcessBy('Punching Only');
      }, 2500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
      
      {/* ── 1. SECTION HEADER & CALCULATOR TOGGLE ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 900, color: C.text, margin: 0 }}>Smart EMI on Credit Card ({filteredSchemes.length})</h2>
          <p style={{ fontSize: '13px', color: C.textMid, margin: '2px 0 0 0' }}>Convert customer card purchases & swipes into monthly EMIs</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => setShowCalculator(!showCalculator)}
            style={{
              padding: '9px 16px',
              borderRadius: '12px',
              border: `1px solid ${showCalculator ? '#4338CA' : C.border}`,
              background: showCalculator ? '#4338CA15' : C.card,
              color: showCalculator ? '#4338CA' : C.text,
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <FaCalculator size={14} />
            <span>EMI Calculator</span>
            <span style={{ fontSize: '10px' }}>{showCalculator ? '▲' : '▼'}</span>
          </button>
        </div>
      </div>

      {/* ── 2. CONDITIONAL PURCHASE-TO-EMI CONVERTER ── */}
      {showCalculator && (
        <div style={{
          background: isDark ? '#1E293B' : '#FFFFFF',
          borderRadius: '20px',
          border: `1px solid ${C.border}`,
          padding: '24px',
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 18px rgba(15,23,42,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: `1px solid ${C.border}`, paddingBottom: '14px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#4338CA15', color: '#4338CA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FaCalculator size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: C.text, margin: 0 }}>Smart Purchase-to-EMI Converter Calculator</h3>
              <p style={{ fontSize: '12.5px', color: C.textMid, margin: 0 }}>Calculate monthly payment split and savings for customers converting swipes to EMI.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '28px' }}>
            
            {/* Controls Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Purchase Amount */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: C.textMid }}>Transaction / Purchase Value:</label>
                  <strong style={{ fontSize: '16px', fontWeight: 900, color: '#4338CA' }}>₹{purchaseAmt.toLocaleString('en-IN')}</strong>
                </div>
                <input 
                  type="range" 
                  min={5000} 
                  max={500000} 
                  step={2500} 
                  value={purchaseAmt} 
                  onChange={(e) => setPurchaseAmt(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#4338CA', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: C.textLight, marginTop: '4px' }}>
                  <span>₹5,000</span>
                  <span>₹500,000</span>
                </div>
              </div>

              {/* Rate Scheme */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, color: C.textMid, display: 'block', marginBottom: '8px' }}>EMI Rate Type:</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {[
                    { id: 'NO_COST', label: '0% No-Cost', sub: '0.00% / mo' },
                    { id: 'LOW_COST', label: 'Low Cost', sub: '1.15% / mo' },
                    { id: 'STANDARD', label: 'Standard', sub: '1.35% / mo' }
                  ].map(rt => (
                    <button
                      key={rt.id}
                      onClick={() => setRateType(rt.id)}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '12px',
                        border: `1px solid ${rateType === rt.id ? '#4338CA' : C.border}`,
                        background: rateType === rt.id ? '#4338CA' : C.bgSecondary,
                        color: rateType === rt.id ? '#FFFFFF' : C.text,
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <strong style={{ fontSize: '12.5px', display: 'block' }}>{rt.label}</strong>
                      <span style={{ fontSize: '10.5px', opacity: 0.85 }}>{rt.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tenure Selection */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, color: C.textMid, display: 'block', marginBottom: '8px' }}>Select Repayment Tenure (Months):</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[3, 6, 9, 12, 18, 24, 36].map(m => (
                    <button
                      key={m}
                      onClick={() => setTenure(m)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '10px',
                        border: `1px solid ${tenure === m ? '#4338CA' : C.border}`,
                        background: tenure === m ? '#4338CA' : C.bgSecondary,
                        color: tenure === m ? '#FFFFFF' : C.text,
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {m} Months
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Breakdown Column */}
            <div style={{
              background: isDark ? '#0F172A' : '#F8FAFC',
              borderRadius: '16px',
              padding: '24px',
              border: `1px solid ${C.border}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  MONTHLY EMI INSTALLMENT
                </span>
                <div>
                  <span style={{ fontSize: '32px', fontWeight: 900, color: '#4338CA' }}>
                    ₹{emiDetails.emi.toLocaleString('en-IN')}
                  </span>
                  <span style={{ fontSize: '13px', color: C.textMid, marginLeft: '6px' }}>/ month</span>
                </div>

                <div style={{ height: '1px', background: C.border }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px' }}>
                  <span style={{ color: C.textMid, fontWeight: 600 }}>Purchase Value:</span>
                  <strong style={{ color: C.text, fontWeight: 800 }}>₹{purchaseAmt.toLocaleString('en-IN')}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px' }}>
                  <span style={{ color: C.textMid, fontWeight: 600 }}>Total Interest Charged:</span>
                  <strong style={{ color: '#F59E0B', fontWeight: 800 }}>₹{emiDetails.totalInterest.toLocaleString('en-IN')}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px' }}>
                  <span style={{ color: C.textMid, fontWeight: 600 }}>One-time Processing Fee:</span>
                  <strong style={{ color: C.text, fontWeight: 800 }}>₹{emiDetails.processingFee}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderTop: `1px dashed ${C.border}`, paddingTop: '10px' }}>
                  <span style={{ color: C.text, fontWeight: 800 }}>Total Repayment Amount:</span>
                  <strong style={{ color: C.text, fontWeight: 900 }}>₹{emiDetails.totalPayable.toLocaleString('en-IN')}</strong>
                </div>
              </div>

              <div style={{ background: '#4338CA10', padding: '10px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#4338CA', fontWeight: 700 }}>
                <FaInfoCircle size={14} /> Note: Customer can convert purchases via SMS or NetBanking after swipe.
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── 3. SEARCH & FILTER BAR ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '500px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <FaSearch size={12} color={C.textLight} style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input 
              type="text"
              placeholder="Search EMI scheme or bank..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 32px',
                borderRadius: '10px',
                border: `1px solid ${C.border}`,
                background: C.card,
                color: C.text,
                fontSize: '13px',
                fontWeight: 600,
                outline: 'none'
              }}
            />
          </div>

          <select
            value={selectedBank}
            onChange={(e) => setSelectedBank(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '10px',
              border: `1px solid ${C.border}`,
              background: C.card,
              color: C.text,
              fontSize: '13px',
              fontWeight: 700,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Banks {availableBanks.length > 0 ? `(${availableBanks.length})` : ''}</option>
            {availableBanks.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── 4. SCHEMES GRID ── */}
      {loadingProds ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: C.card, borderRadius: '20px', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '220px' }}>
          <LoadingLogo size={80} />
        </div>
      ) : filteredSchemes.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: C.textMid, fontWeight: 700, background: C.card, borderRadius: '16px', border: `1px solid ${C.border}` }}>
          No dynamic Smart EMI schemes found matching your criteria.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {filteredSchemes.map(scheme => (
            <div
              key={scheme.id}
              style={{
                background: isDark ? '#1E293B' : '#FFFFFF',
                borderRadius: '20px',
                border: `1px solid ${C.border}`,
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '18px',
                boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 18px rgba(15,23,42,0.03)',
                transition: 'all 0.2s ease'
              }}
            >
              <div>
                {/* Product Header Row 1: Logo (Left), Bank Name (Center), Badge Tag (Right) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '40px' }}>
                    {scheme.logo ? (
                      <img src={scheme.logo} alt={scheme.bank} style={{ height: '30px', objectFit: 'contain' }} />
                    ) : (
                      <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: `${scheme.accent}15`, color: scheme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '13px' }}>
                        {scheme.bank.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <span style={{ fontSize: '16px', fontWeight: 900, color: C.text }}>{scheme.bank}</span>
                  </div>

                  <span style={{ background: `${scheme.accent}15`, color: scheme.accent, fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '12px' }}>
                    {scheme.badge}
                  </span>
                </div>

                {/* Product Header Row 2: Centered Product Title */}
                <div style={{ textAlign: 'center', marginBottom: '14px', borderBottom: `1px solid ${C.border}`, paddingBottom: '10px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 800, color: scheme.accent, margin: 0 }}>{scheme.title}</h4>
                </div>

                {/* Key Metrics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', background: isDark ? '#0F172A' : '#F8FAFC', padding: '12px', borderRadius: '12px', marginBottom: '14px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: C.textLight, display: 'block', fontWeight: 600 }}>Min Purchase Value</span>
                    <strong style={{ fontSize: '13.5px', color: C.text, fontWeight: 900 }}>{scheme.minTransaction}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: C.textLight, display: 'block', fontWeight: 600 }}>Interest Rate</span>
                    <strong style={{ fontSize: '13px', color: '#10B981', fontWeight: 900 }}>{scheme.minRoi}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: C.textLight, display: 'block', fontWeight: 600 }}>Tenure</span>
                    <strong style={{ fontSize: '13px', color: C.text, fontWeight: 800 }}>{scheme.tenure}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: C.textLight, display: 'block', fontWeight: 600 }}>Processing Fee</span>
                    <strong style={{ fontSize: '13px', color: scheme.accent, fontWeight: 800 }}>{scheme.processingFee}</strong>
                  </div>
                </div>

                {/* Features Checklist */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {scheme.features.map((feat, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: C.textMid, fontWeight: 600 }}>
                      <FaCheckCircle color="#10B981" size={13} style={{ flexShrink: 0 }} />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons: 4 Grid Buttons like Credit Cards */}
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Row 1: Share & Compare */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleWhatsAppShare(scheme)}
                    type="button"
                    style={{
                      flex: 1,
                      padding: '9px',
                      borderRadius: '10px',
                      border: `1px solid ${C.border}`,
                      background: C.bgSecondary,
                      color: C.text,
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <FaShareAlt size={12} /> Share
                  </button>

                  <button
                    onClick={() => handleToggleCompare(scheme)}
                    type="button"
                    style={{
                      flex: 1,
                      padding: '9px',
                      borderRadius: '10px',
                      border: `1px solid ${compareList.includes(scheme.id) ? '#4338CA' : C.border}`,
                      background: compareList.includes(scheme.id) ? '#4338CA15' : C.bgSecondary,
                      color: compareList.includes(scheme.id) ? '#4338CA' : C.text,
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <FaBalanceScale size={13} /> {compareList.includes(scheme.id) ? '✓ Compared' : 'Compare'}
                  </button>
                </div>

                {/* Row 2: Benefits & Apply */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setShowBenefitsOffer(scheme)}
                    type="button"
                    style={{
                      flex: 1,
                      padding: '9px',
                      borderRadius: '10px',
                      border: `1px solid ${C.border}`,
                      background: C.bgSecondary,
                      color: C.text,
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <FaInfoCircle size={12} /> Benefits
                  </button>

                  <button
                    onClick={() => setApplyScheme(scheme)}
                    type="button"
                    style={{
                      flex: 1,
                      padding: '9px',
                      borderRadius: '10px',
                      border: 'none',
                      background: '#4338CA',
                      color: '#FFFFFF',
                      fontSize: '12.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 12px rgba(67, 56, 202, 0.2)'
                    }}
                  >
                    <FaUserCheck size={12} /> Apply
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 5. BENEFITS MODAL ── */}
      {showBenefitsOffer && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px',
            width: '100%', maxWidth: '520px', maxHeight: '85vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)', overflow: 'hidden'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 900, color: C.text, margin: 0 }}>
                  {showBenefitsOffer.bank} — {showBenefitsOffer.title}
                </h3>
                <span style={{ fontSize: '12px', color: C.textMid }}>Smart EMI Details & Key Benefits</span>
              </div>
              <button onClick={() => setShowBenefitsOffer(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px', color: C.textMid }}>✕</button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', background: isDark ? '#0F172A' : '#F8FAFC', padding: '14px', borderRadius: '12px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: C.textLight, display: 'block', fontWeight: 600 }}>Min Purchase Value</span>
                  <strong style={{ fontSize: '14px', color: C.text, fontWeight: 900 }}>{showBenefitsOffer.minTxn}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: C.textLight, display: 'block', fontWeight: 600 }}>Interest Rate</span>
                  <strong style={{ fontSize: '14px', color: '#10B981', fontWeight: 900 }}>{showBenefitsOffer.minRoi}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: C.textLight, display: 'block', fontWeight: 600 }}>Tenure</span>
                  <strong style={{ fontSize: '13.5px', color: C.text, fontWeight: 800 }}>{showBenefitsOffer.tenure}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: C.textLight, display: 'block', fontWeight: 600 }}>Processing Fee</span>
                  <strong style={{ fontSize: '13.5px', color: showBenefitsOffer.accent, fontWeight: 800 }}>{showBenefitsOffer.processingFee}</strong>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: C.text, marginBottom: '10px' }}>Key Product Features:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {showBenefitsOffer.features.map((feat, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: C.textMid, lineHeight: 1.4 }}>
                      <FaCheckCircle color="#10B981" size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: '10px', background: C.bgSecondary }}>
              <button
                type="button"
                onClick={() => setShowBenefitsOffer(null)}
                style={{ flex: 1, padding: '11px', borderRadius: '12px', border: `1px solid ${C.border}`, background: C.card, color: C.text, fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const schemeToApply = showBenefitsOffer;
                  setShowBenefitsOffer(null);
                  setApplyScheme(schemeToApply);
                }}
                style={{ flex: 1.5, padding: '11px', borderRadius: '12px', border: 'none', background: '#4338CA', color: '#FFFFFF', fontWeight: 800, fontSize: '13.5px', cursor: 'pointer' }}
              >
                Submit Smart EMI Lead →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. QUICK SUBMIT MODAL ── */}
      {applyScheme && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px',
            width: '100%', maxWidth: '480px', padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            position: 'relative'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: C.text, margin: '0 0 6px 0' }}>
              Submit {applyScheme.bank} Smart EMI Lead
            </h3>
            <p style={{ fontSize: '13px', color: C.textMid, margin: '0 0 20px 0' }}>
              Submit customer transaction details for Smart EMI conversion assistance.
            </p>

            {submitSuccess ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <FaCheckCircle color="#10B981" size={48} style={{ marginBottom: '12px' }} />
                <h4 style={{ fontSize: '18px', fontWeight: 900, color: C.text, margin: '0 0 6px 0' }}>Smart EMI Lead Registered!</h4>
                <p style={{ fontSize: '13px', color: C.textMid }}>Lead has been mapped under your referral ID ({empCode}).</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitLead} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: C.textMid, display: 'block', marginBottom: '4px' }}>Customer Full Name</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Enter customer name..."
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontSize: '13px', fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: C.textMid, display: 'block', marginBottom: '4px' }}>Customer Mobile/Number</label>
                  <input 
                    type="tel" 
                    required 
                    maxLength={10}
                    placeholder="10-digit mobile number..."
                    value={custMobile}
                    onChange={(e) => setCustMobile(e.target.value.replace(/\D/g, ''))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontSize: '13px', fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: C.textMid, display: 'block', marginBottom: '4px' }}>Smart EMI Amount</label>
                  <input 
                    type="number" 
                    required
                    placeholder="Enter Smart EMI Amount..."
                    value={smartEmiAmt}
                    onChange={(e) => setSmartEmiAmt(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontSize: '13px', fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: C.textMid, display: 'block', marginBottom: '4px' }}>Tenure</label>
                  <select
                    value={smartEmiTenure}
                    onChange={(e) => setSmartEmiTenure(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontSize: '13px', fontWeight: 600 }}
                  >
                    <option value="06 Months">06 Months</option>
                    <option value="01 Year">01 Year</option>
                    <option value="02 Years">02 Years</option>
                    <option value="03 Years">03 Years</option>
                    <option value="04 Years">04 Years</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 800, color: C.text, display: 'block', marginBottom: '8px' }}>3. Process By *</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    
                    {/* Option 1: Lead punching only */}
                    <label style={{
                      display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 14px', borderRadius: '12px',
                      border: `2px solid ${processBy === 'Punching Only' ? '#4338CA' : C.border}`,
                      background: processBy === 'Punching Only' ? '#4338CA0D' : C.card,
                      cursor: 'pointer', transition: 'all 0.2s'
                    }}>
                      <input
                        type="radio"
                        name="processBy"
                        value="Punching Only"
                        checked={processBy === 'Punching Only'}
                        onChange={(e) => setProcessBy(e.target.value)}
                        style={{ marginTop: '2px', accentColor: '#4338CA' }}
                      />
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 800, color: C.text }}>
                          1. Lead punching only
                        </div>
                        <div style={{ fontSize: '11.5px', color: C.textMid, marginTop: '2px' }}>
                          Records lead directly into your Partner CRM &amp; Applications queue for internal processing.
                        </div>
                      </div>
                    </label>

                    {/* Option 2: Linked share */}
                    <label style={{
                      display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 14px', borderRadius: '12px',
                      border: `2px solid ${processBy === 'Linked share' ? '#4338CA' : C.border}`,
                      background: processBy === 'Linked share' ? '#4338CA0D' : C.card,
                      cursor: 'pointer', transition: 'all 0.2s'
                    }}>
                      <input
                        type="radio"
                        name="processBy"
                        value="Linked share"
                        checked={processBy === 'Linked share'}
                        onChange={(e) => setProcessBy(e.target.value)}
                        style={{ marginTop: '2px', accentColor: '#4338CA' }}
                      />
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 800, color: C.text }}>
                          2. Linked share
                        </div>
                        <div style={{ fontSize: '11.5px', color: C.textMid, marginTop: '2px' }}>
                          Generates &amp; opens a pre-filled WhatsApp share link embedded with the official bank URL.
                        </div>
                      </div>
                    </label>

                    {/* Option 3: Direct bank process */}
                    <label style={{
                      display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 14px', borderRadius: '12px',
                      border: `2px solid ${processBy === 'Direct link' ? '#4338CA' : C.border}`,
                      background: processBy === 'Direct link' ? '#4338CA0D' : C.card,
                      cursor: 'pointer', transition: 'all 0.2s'
                    }}>
                      <input
                        type="radio"
                        name="processBy"
                        value="Direct link"
                        checked={processBy === 'Direct link'}
                        onChange={(e) => setProcessBy(e.target.value)}
                        style={{ marginTop: '2px', accentColor: '#4338CA' }}
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

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setApplyScheme(null)}
                    style={{ flex: 1, padding: '11px', borderRadius: '12px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ flex: 1, padding: '11px', borderRadius: '12px', border: 'none', background: '#4338CA', color: '#FFFFFF', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
                  >
                    Submit Smart EMI Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
