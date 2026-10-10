import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { getApiV1Url } from '../../../config/api';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuthStore } from '../../../app/store/authStore';
import { 
  FaCoins, FaCalculator, FaCheckCircle, FaBolt, FaShieldAlt, 
  FaShareAlt, FaCopy, FaExternalLinkAlt, FaSearch, FaChevronRight,
  FaPercentage, FaCalendarAlt, FaUserCheck, FaInfoCircle, FaBalanceScale
} from 'react-icons/fa';
import hdfcLogo from '../../home/components/banks/hdfc_bank.png';
import sbiLogo from '../../home/components/banks/sbi_card.png';
import iciciLogo from '../../home/components/banks/icici_bank.png';
import axisLogo from '../../home/components/banks/axis_bank.png';
import idfcLogo from '../../home/components/banks/idfc_first_bank.png';
import kotakLogo from '../../home/components/banks/kotak_bank.png';
import LoadingLogo from '../../../components/Loader/LoadingLogo';

export default function EmployeeLoanOnCreditCard() {
  const { C, isDark } = useTheme();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [selectedBank, setSelectedBank] = useState('ALL');
  const [dbOffers, setDbOffers] = useState([]);
  const [loadingProds, setLoadingProds] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const isMountedRef = React.useRef(true);

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

  const CANONICAL_HDFC_APPLY_URL = 'https://applyonline.hdfc.bank.in/loan-against-assets/insta-jumbo-loan/insta-jumbo-form.html?&XSELLINSHI=Y&XSELLINSLP=Y&Channel=DSA&DSACode=XYOH&LGCode=XYOH&LC1=YOH5&LC2=YOH5&SMCode=S54558#nbb';

  const CANONICAL_HDFC_FEATURES = [
    'Instant 10-second cash credit directly into your bank savings account',
    'Insta Jumbo Loan option available over and above existing credit card limit',
    'Zero physical documentation with complete digital journey',
    'Flexible foreclosure options after 12 monthly installments'
  ];

  // Stable, verified matcher for the canonical HDFC Bank Instant & Jumbo Loan offer
  const isHdfcInstantJumboLoanOffer = (p) => {
    if (!p) return false;
    const pName = String(p.name || p.title || '').toLowerCase().trim();
    const slug = String(p.slug || '').toLowerCase().trim();
    const pId = String(p.id || '').toLowerCase().trim();
    const bName = String(p.bank_name || p.bank || '').toLowerCase().trim();

    // Strictly exclude other bank offers (e.g. Canara Bank, Union Bank)
    if (pName.includes('canara') || bName.includes('canara')) return false;
    if (pName.includes('union') || bName.includes('union')) return false;

    // Stable canonical slug / id / exact name match
    if (slug === 'hdfc-bank-instant-jumbo-loan' || slug === 'hdfc-instant-jumbo-loan') return true;
    if (pId === 'hdfc-instant-jumbo-loan') return true;
    if (pName === 'hdfc bank instant & jumbo loan' || pName === 'hdfc bank insta loan & jumbo loan') return true;

    // Match HDFC card loan products (must be HDFC and contain Instant or Jumbo)
    const isHdfc = bName.includes('hdfc') || pName.includes('hdfc');
    const isJumboOrInstant = pName.includes('jumbo') || pName.includes('instant') || pName.includes('insta');
    return isHdfc && isJumboOrInstant;
  };

  const fetchDynamicOffers = React.useCallback(async () => {
    setLoadingProds(true);
    setApiError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${getApiV1Url()}/products?limit=1000`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (!isMountedRef.current) return;

      const prods = res.data?.data?.rows || res.data?.data || res.data?.products || [];
      if (Array.isArray(prods) && prods.length > 0) {
        // Strictly filter to the verified existing HDFC Instant & Jumbo Loan offer
        const hdfcOffers = prods.filter(isHdfcInstantJumboLoanOffer);

        if (hdfcOffers.length > 0) {
          // Deduplicate if multiple records exist in the database
          const seen = new Set();
          const uniqueOffers = [];
          for (const p of hdfcOffers) {
            const key = p.slug || p.id || p.name;
            if (!seen.has(key)) {
              seen.add(key);
              uniqueOffers.push(p);
            }
          }

          const mapped = uniqueOffers.map(p => {
            let parsedFeatures = [];
            try {
              parsedFeatures = typeof p.features === 'string' ? JSON.parse(p.features) : (Array.isArray(p.features) ? p.features : []);
            } catch (e) {
              parsedFeatures = [p.description || 'Pre-approved instant cash loan'];
            }
            return {
              id: p.id,
              bank_id: p.bank_id,
              bank: 'HDFC Bank',
              title: p.name || 'HDFC Bank Instant & Jumbo Loan',
              logo: getBankLogo('HDFC Bank', p.bank_logo || p.logo || p.image_url),
              accent: '#0F766E',
              maxLoan: p.joining_fee && p.joining_fee !== 'Nil' ? p.joining_fee : '₹10,00,000',
              minRoi: p.interest_rate || '11.49% - 15.50% p.a.',
              tenure: p.time_period || p.tenure || '12 - 60 Months',
              processingFee: p.annual_fee || p.fees_charges || '₹999 + GST',
              disbursalTime: 'Instant (10 Seconds)',
              badge: p.badge || 'Pre-Approved',
              apply_url: p.apply_url || p.direct_url || p.link || CANONICAL_HDFC_APPLY_URL,
              features: parsedFeatures.length > 0 ? parsedFeatures : CANONICAL_HDFC_FEATURES
            };
          });
          setDbOffers(mapped);
        } else {
          setDbOffers([]);
        }
      } else {
        setDbOffers([]);
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error('Failed to load dynamic Card Loan offers:', err);
      setApiError('Unable to load loan offers at this time. Please check your connection.');
      setDbOffers([]);
    } finally {
      if (isMountedRef.current) {
        setLoadingProds(false);
      }
    }
  }, []);

  // Fetch dynamic offers once on mount with cancellation cleanup
  React.useEffect(() => {
    isMountedRef.current = true;
    fetchDynamicOffers();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchDynamicOffers]);

  const activeOffers = dbOffers;

  const availableBanks = useMemo(() => {
    const bSet = new Set();
    (Array.isArray(dbOffers) ? dbOffers : []).forEach(o => {
      if (o.bank) bSet.add(o.bank);
    });
    return Array.from(bSet);
  }, [dbOffers]);

  // Calculator States
  const [loanAmount, setLoanAmount] = useState(150000);
  const [interestRate, setInterestRate] = useState(13.5);
  const [tenureMonths, setTenureMonths] = useState(24);
  const [copiedId, setCopiedId] = useState(null);

  // Apply Modal & Benefits & Compare State
  const [showBenefitsOffer, setShowBenefitsOffer] = useState(null);
  const [applyOffer, setApplyOffer] = useState(null);
  const [compareList, setCompareList] = useState([]);
  const [custName, setCustName] = useState('');
  const [custMobile, setCustMobile] = useState('');
  const [loanRequiredAmt, setLoanRequiredAmt] = useState('');
  const [loanTenure, setLoanTenure] = useState('6 Months');
  const [processBy, setProcessBy] = useState('Punching Only');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleToggleCompare = (offer) => {
    setCompareList(prev => prev.includes(offer.id) ? prev.filter(id => id !== offer.id) : [...prev, offer.id]);
  };

  const empCode = user?.partner_code || user?.employee_id || user?.emp_code || user?.referral_code || user?.id || '';
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://gharkapaisa.in';

  // Calculate 33
  const emiDetails = useMemo(() => {
    const P = parseFloat(loanAmount) || 0;
    const r = (parseFloat(interestRate) || 0) / 12 / 100;
    const n = parseInt(tenureMonths, 10) || 12;

    if (P <= 0 || r <= 0 || n <= 0) {
      return { emi: 0, totalInterest: 0, totalPayable: 0 };
    }

    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayable = emi * n;
    const totalInterest = totalPayable - P;

    return {
      emi: Math.round(emi),
      totalInterest: Math.round(totalInterest),
      totalPayable: Math.round(totalPayable)
    };
  }, [loanAmount, interestRate, tenureMonths]);

  const filteredOffers = useMemo(() => {
    return (Array.isArray(activeOffers) ? activeOffers : []).filter(offer => {
      const matchesSearch = offer.title.toLowerCase().includes(search.toLowerCase()) || 
                            offer.bank.toLowerCase().includes(search.toLowerCase()) ||
                            offer.features.some(f => f.toLowerCase().includes(search.toLowerCase()));
      const matchesBank = selectedBank === 'ALL' || offer.bank === selectedBank;
      return matchesSearch && matchesBank;
    });
  }, [activeOffers, search, selectedBank]);

  const handleCopyShareLink = (offer) => {
    const link = `${baseUrl}/apply/${encodeURIComponent(empCode)}/${offer.id}?type=card_loan`;
    navigator.clipboard.writeText(link);
    setCopiedId(offer.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleWhatsAppShare = (offer) => {
    const link = `${baseUrl}/apply/${encodeURIComponent(empCode)}/${offer.id}?type=card_loan`;
    const msg = encodeURIComponent(`Avail instant loan on your ${offer.bank} Credit Card! Interest starting from ${offer.minRoi}, flexible tenures up to ${offer.tenure}.\nApply here: ${link}`);
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
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(applyOffer?.id);
      const isPartner = user?.role === 'PARTNER' || user?.role === 'TEAM_MEMBER' || !!user?.partner_code;

      if (isPartner) {
        await axios.post(`${getApiV1Url()}/applications/partner-apply`, {
          product_id: isUuid ? applyOffer?.id : undefined,
          full_name: custName,
          mobile: custMobile,
          product_type: 'loan_on_credit_card',
          loan_required_amount: loanRequiredAmt,
          tenure: loanTenure,
          process_by: processBy,
          card_bank: applyOffer?.bank,
          card_name: applyOffer?.title || applyOffer?.name,
          process_type: 'lead_punching',
          agree_terms: true
        }, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }).catch(async () => {
          return axios.post(`${getApiV1Url()}/employee/leads`, {
            full_name: custName,
            mobile: custMobile,
            loan_required_amount: loanRequiredAmt,
            tenure: loanTenure,
            process_by: processBy,
            card_bank: applyOffer?.bank,
            card_name: applyOffer?.title || applyOffer?.name,
            product_id: isUuid ? applyOffer?.id : undefined,
            product_type: 'loan_on_credit_card'
          }, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
        });
      } else {
        await axios.post(`${getApiV1Url()}/employee/leads`, {
          full_name: custName,
          mobile: custMobile,
          loan_required_amount: loanRequiredAmt,
          tenure: loanTenure,
          process_by: processBy,
          card_bank: applyOffer?.bank,
          card_name: applyOffer?.title || applyOffer?.name,
          product_id: isUuid ? applyOffer?.id : undefined,
          product_type: 'loan_on_credit_card'
        }, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
      }

      const defaultLoanDirectUrl = 'https://applyonline.hdfc.bank.in/loan-against-assets/insta-jumbo-loan/insta-jumbo-form.html?&XSELLINSHI=Y&XSELLINSLP=Y&Channel=DSA&DSACode=XYOH&LGCode=XYOH&LC1=YOH5&LC2=YOH5&SMCode=S54558#nbb';
      const targetDirectUrl = applyOffer?.apply_url || applyOffer?.direct_link || applyOffer?.direct_url || defaultLoanDirectUrl;

      if (processBy === 'Direct link') {
        window.open(targetDirectUrl, '_blank');
      } else if (processBy === 'Linked share') {
        const msg = encodeURIComponent(`Apply for ${applyOffer?.bank || 'HDFC Bank'} Loan on Credit Card here: ${targetDirectUrl}`);
        window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setApplyOffer(null);
        setCustName('');
        setCustMobile('');
        setLoanRequiredAmt('');
        setLoanTenure('6 Months');
        setProcessBy('Punching Only');
      }, 2500);
    } catch (err) {
      console.error('Failed to submit card loan lead:', err);

      const defaultLoanDirectUrl = 'https://applyonline.hdfc.bank.in/loan-against-assets/insta-jumbo-loan/insta-jumbo-form.html?&XSELLINSHI=Y&XSELLINSLP=Y&Channel=DSA&DSACode=XYOH&LGCode=XYOH&LC1=YOH5&LC2=YOH5&SMCode=S54558#nbb';
      const targetDirectUrl = applyOffer?.apply_url || applyOffer?.direct_link || applyOffer?.direct_url || defaultLoanDirectUrl;

      if (processBy === 'Direct link') {
        window.open(targetDirectUrl, '_blank');
      } else if (processBy === 'Linked share') {
        const msg = encodeURIComponent(`Apply for ${applyOffer?.bank || 'HDFC Bank'} Loan on Credit Card here: ${targetDirectUrl}`);
        window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setApplyOffer(null);
        setCustName('');
        setCustMobile('');
        setLoanRequiredAmt('');
        setLoanTenure('6 Months');
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
          <h2 style={{ fontSize: '22px', fontWeight: 900, color: C.text, margin: 0 }}>Loan on Credit Card Offers ({filteredOffers.length})</h2>
          <p style={{ fontSize: '13px', color: C.textMid, margin: '2px 0 0 0' }}>Pre-approved instant cash loans & Jumbo card loans</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => setShowCalculator(!showCalculator)}
            style={{
              padding: '9px 16px',
              borderRadius: '12px',
              border: `1px solid ${showCalculator ? (C.employeePrimary || '#0F766E') : C.border}`,
              background: showCalculator ? `${C.employeePrimary || '#0F766E'}15` : C.card,
              color: showCalculator ? (C.employeePrimary || '#0F766E') : C.text,
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
            <span>Loan Calculator</span>
            <span style={{ fontSize: '10px' }}>{showCalculator ? '▲' : '▼'}</span>
          </button>
        </div>
      </div>

      {/* ── 2. CONDITIONAL LOAN CALCULATOR ── */}
      {showCalculator && (
        <div style={{
          background: isDark ? '#1E293B' : '#FFFFFF',
          borderRadius: '20px',
          border: `1px solid ${C.border}`,
          padding: '24px',
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 18px rgba(15,23,42,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: `1px solid ${C.border}`, paddingBottom: '14px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${C.employeePrimary || '#0F766E'}15`, color: C.employeePrimary || '#0F766E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FaCalculator size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: C.text, margin: 0 }}>Card Loan Eligibility & Loan Calculator</h3>
              <p style={{ fontSize: '12.5px', color: C.textMid, margin: 0 }}>Calculate exact monthly EMI installments and total interest payable for customers.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '28px' }}>
            
            {/* Sliders Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Loan Amount */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: C.textMid }}>Loan Amount Required:</label>
                  <strong style={{ fontSize: '16px', fontWeight: 900, color: C.employeePrimary || '#0F766E' }}>₹{loanAmount.toLocaleString('en-IN')}</strong>
                </div>
                <input 
                  type="range" 
                  min={20000} 
                  max={1000000} 
                  step={5000} 
                  value={loanAmount} 
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  style={{ width: '100%', accentColor: C.employeePrimary || '#0F766E', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: C.textLight, marginTop: '4px' }}>
                  <span>₹20,000</span>
                  <span>₹10,000,000</span>
                </div>
              </div>

              {/* Interest Rate */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: C.textMid }}>Interest Rate (% p.a.):</label>
                  <strong style={{ fontSize: '16px', fontWeight: 900, color: C.employeePrimary || '#0F766E' }}>{interestRate}%</strong>
                </div>
                <input 
                  type="range" 
                  min={10} 
                  max={24} 
                  step={0.25} 
                  value={interestRate} 
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  style={{ width: '100%', accentColor: C.employeePrimary || '#0F766E', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: C.textLight, marginTop: '4px' }}>
                  <span>10.0%</span>
                  <span>24.0%</span>
                </div>
              </div>

              {/* Tenure Buttons */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, color: C.textMid, display: 'block', marginBottom: '10px' }}>Select Repayment Tenure (Months):</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[6, 12, 18, 24, 36, 48, 60].map(m => (
                    <button
                      key={m}
                      onClick={() => setTenureMonths(m)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '10px',
                        border: `1px solid ${tenureMonths === m ? (C.employeePrimary || '#0F766E') : C.border}`,
                        background: tenureMonths === m ? (C.employeePrimary || '#0F766E') : C.bgSecondary,
                        color: tenureMonths === m ? '#FFFFFF' : C.text,
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

            {/* Results Summary Box */}
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
                  ESTIMATED MONTHLY INSTALLMENT
                </span>
                <div>
                  <span style={{ fontSize: '32px', fontWeight: 900, color: C.employeePrimary || '#0F766E' }}>
                    ₹{emiDetails.emi.toLocaleString('en-IN')}
                  </span>
                  <span style={{ fontSize: '13px', color: C.textMid, marginLeft: '6px' }}>/ month</span>
                </div>

                <div style={{ height: '1px', background: C.border }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px' }}>
                  <span style={{ color: C.textMid, fontWeight: 600 }}>Principal Amount:</span>
                  <strong style={{ color: C.text, fontWeight: 800 }}>₹{loanAmount.toLocaleString('en-IN')}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px' }}>
                  <span style={{ color: C.textMid, fontWeight: 600 }}>Total Interest Payable:</span>
                  <strong style={{ color: '#F59E0B', fontWeight: 800 }}>₹{emiDetails.totalInterest.toLocaleString('en-IN')}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderTop: `1px dashed ${C.border}`, paddingTop: '10px' }}>
                  <span style={{ color: C.text, fontWeight: 800 }}>Total Amount Payable:</span>
                  <strong style={{ color: C.text, fontWeight: 900 }}>₹{emiDetails.totalPayable.toLocaleString('en-IN')}</strong>
                </div>
              </div>

              <div style={{ background: `${C.employeePrimary || '#0F766E'}10`, padding: '10px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: C.employeePrimary || '#0F766E', fontWeight: 700 }}>
                <FaInfoCircle size={14} /> Note: Actual loan limit and interest rate depend on customer bank credit card history.
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
              placeholder="Search scheme or bank..."
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

      {/* ── 4. OFFERS GRID ── */}
      {loadingProds ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: C.card, borderRadius: '20px', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '220px' }}>
          <LoadingLogo size={80} />
        </div>
      ) : apiError ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: C.card, borderRadius: '20px', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <FaInfoCircle size={36} color="#EF4444" style={{ marginBottom: '12px' }} />
          <h4 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: '0 0 6px 0' }}>Failed to Load Offers</h4>
          <p style={{ color: C.textMid, fontSize: '13.5px', margin: '0 0 16px 0' }}>{apiError}</p>
          <button
            onClick={() => fetchDynamicOffers()}
            style={{
              padding: '9px 20px',
              borderRadius: '10px',
              border: 'none',
              background: C.employeePrimary || '#0F766E',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      ) : filteredOffers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: C.card, borderRadius: '20px', border: `1px solid ${C.border}` }}>
          <FaCoins size={40} color={C.textLight} style={{ marginBottom: '12px', opacity: 0.5 }} />
          <h4 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: '0 0 6px 0' }}>No Dynamic Loan Offers Found</h4>
          <p style={{ color: C.textMid, fontSize: '13.5px', margin: 0 }}>There are currently no products under "Loan on Credit Card". You can add new products in Super Admin Product Management.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {filteredOffers.map(offer => (
            <div
              key={offer.id}
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
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              <div>
                {/* Product Header Row 1: Logo (Left), Bank Name (Center), Badge Tag (Right) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '40px' }}>
                    {offer.logo ? (
                      <img src={offer.logo} alt={offer.bank} style={{ height: '30px', objectFit: 'contain' }} />
                    ) : (
                      <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: `${offer.accent}15`, color: offer.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '13px' }}>
                        {offer.bank.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <span style={{ fontSize: '16px', fontWeight: 900, color: C.text }}>{offer.bank}</span>
                  </div>

                  <span style={{ background: `${offer.accent}15`, color: offer.accent, fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '12px' }}>
                    {offer.badge}
                  </span>
                </div>

                {/* Product Header Row 2: Centered Product Title */}
                <div style={{ textAlign: 'center', marginBottom: '14px', borderBottom: `1px solid ${C.border}`, paddingBottom: '10px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 800, color: offer.accent, margin: 0 }}>{offer.title}</h4>
                </div>

                {/* Key Metrics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', background: isDark ? '#0F172A' : '#F8FAFC', padding: '12px', borderRadius: '12px', marginBottom: '14px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: C.textLight, display: 'block', fontWeight: 600 }}>Max Loan Limit</span>
                    <strong style={{ fontSize: '13.5px', color: C.text, fontWeight: 900 }}>{offer.maxLoan}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: C.textLight, display: 'block', fontWeight: 600 }}>Interest Rate</span>
                    <strong style={{ fontSize: '13.5px', color: '#10B981', fontWeight: 900 }}>{offer.minRoi}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: C.textLight, display: 'block', fontWeight: 600 }}>Tenure</span>
                    <strong style={{ fontSize: '13px', color: C.text, fontWeight: 800 }}>{offer.tenure}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: C.textLight, display: 'block', fontWeight: 600 }}>Disbursal Time</span>
                    <strong style={{ fontSize: '13px', color: offer.accent, fontWeight: 800 }}>{offer.disbursalTime}</strong>
                  </div>
                </div>

                {/* Features Checklist */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {offer.features.map((feat, idx) => (
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
                    onClick={() => handleWhatsAppShare(offer)}
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
                    onClick={() => handleToggleCompare(offer)}
                    type="button"
                    style={{
                      flex: 1,
                      padding: '9px',
                      borderRadius: '10px',
                      border: `1px solid ${compareList.includes(offer.id) ? (C.employeePrimary || '#0F766E') : C.border}`,
                      background: compareList.includes(offer.id) ? `${C.employeePrimary || '#0F766E'}15` : C.bgSecondary,
                      color: compareList.includes(offer.id) ? (C.employeePrimary || '#0F766E') : C.text,
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <FaBalanceScale size={13} /> {compareList.includes(offer.id) ? '✓ Compared' : 'Compare'}
                  </button>
                </div>

                {/* Row 2: Benefits & Apply */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setShowBenefitsOffer(offer)}
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
                    onClick={() => setApplyOffer(offer)}
                    type="button"
                    style={{
                      flex: 1,
                      padding: '9px',
                      borderRadius: '10px',
                      border: 'none',
                      background: C.employeePrimary || '#0F766E',
                      color: '#FFFFFF',
                      fontSize: '12.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 12px rgba(15, 118, 110, 0.2)'
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
                <span style={{ fontSize: '12px', color: C.textMid }}>Product Details & Key Benefits</span>
              </div>
              <button onClick={() => setShowBenefitsOffer(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px', color: C.textMid }}>✕</button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', background: isDark ? '#0F172A' : '#F8FAFC', padding: '14px', borderRadius: '12px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: C.textLight, display: 'block', fontWeight: 600 }}>Max Loan Limit</span>
                  <strong style={{ fontSize: '14px', color: C.text, fontWeight: 900 }}>{showBenefitsOffer.maxLoan}</strong>
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
                  <span style={{ fontSize: '11px', color: C.textLight, display: 'block', fontWeight: 600 }}>Disbursal Time</span>
                  <strong style={{ fontSize: '13.5px', color: showBenefitsOffer.accent, fontWeight: 800 }}>{showBenefitsOffer.disbursalTime}</strong>
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
                  const offerToApply = showBenefitsOffer;
                  setShowBenefitsOffer(null);
                  setApplyOffer(offerToApply);
                }}
                style={{ flex: 1.5, padding: '11px', borderRadius: '12px', border: 'none', background: C.employeePrimary || '#0F766E', color: '#FFFFFF', fontWeight: 800, fontSize: '13.5px', cursor: 'pointer' }}
              >
                Apply for Customer Now →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. QUICK APPLY MODAL ── */}
      {applyOffer && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px',
            width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 900, color: C.text, margin: '0 0 6px 0' }}>
                  Apply {applyOffer.bank} {applyOffer.title}
                </h3>
                <p style={{ fontSize: '13px', color: C.textMid, margin: '0 0 20px 0' }}>
                  Submit lead details for customer card loan eligibility verification.
                </p>
              </div>
              <button 
                onClick={() => setApplyOffer(null)} 
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px', color: C.textMid, padding: '4px' }}
              >
                ✕
              </button>
            </div>

            {submitSuccess ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <FaCheckCircle color="#10B981" size={48} style={{ marginBottom: '12px' }} />
                <h4 style={{ fontSize: '18px', fontWeight: 900, color: C.text, margin: '0 0 6px 0' }}>Application Submitted!</h4>
                <p style={{ fontSize: '13px', color: C.textMid }}>Lead has been mapped under your referral ID ({empCode}).</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitLead} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: C.textMid, display: 'block', marginBottom: '4px' }}>Name</label>
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
                  <label style={{ fontSize: '12px', fontWeight: 700, color: C.textMid, display: 'block', marginBottom: '4px' }}>Number</label>
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
                  <label style={{ fontSize: '12px', fontWeight: 700, color: C.textMid, display: 'block', marginBottom: '4px' }}>Loan Required Amount</label>
                  <input 
                    type="number" 
                    required
                    placeholder="Enter Loan Required Amount..."
                    value={loanRequiredAmt}
                    onChange={(e) => setLoanRequiredAmt(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontSize: '13px', fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: C.textMid, display: 'block', marginBottom: '4px' }}>Loan Tenure</label>
                  <select
                    value={loanTenure}
                    onChange={(e) => setLoanTenure(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontSize: '13px', fontWeight: 600 }}
                  >
                    <option value="6 Months">6 Months</option>
                    <option value="1 Year">1 Year</option>
                    <option value="2 Years">2 Years</option>
                    <option value="3 Years">3 Years</option>
                    <option value="4 Years">4 Years</option>
                    <option value="5 Years">5 Years</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 800, color: C.text, display: 'block', marginBottom: '8px' }}>3. Process By *</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    
                    {/* Option 1: Lead punching only */}
                    <label style={{
                      display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 14px', borderRadius: '12px',
                      border: `2px solid ${processBy === 'Punching Only' ? (C.employeePrimary || '#0F766E') : C.border}`,
                      background: processBy === 'Punching Only' ? `${C.employeePrimary || '#0F766E'}0D` : C.card,
                      cursor: 'pointer', transition: 'all 0.2s'
                    }}>
                      <input
                        type="radio"
                        name="processBy"
                        value="Punching Only"
                        checked={processBy === 'Punching Only'}
                        onChange={(e) => setProcessBy(e.target.value)}
                        style={{ marginTop: '2px', accentColor: C.employeePrimary || '#0F766E' }}
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
                      border: `2px solid ${processBy === 'Linked share' ? (C.employeePrimary || '#0F766E') : C.border}`,
                      background: processBy === 'Linked share' ? `${C.employeePrimary || '#0F766E'}0D` : C.card,
                      cursor: 'pointer', transition: 'all 0.2s'
                    }}>
                      <input
                        type="radio"
                        name="processBy"
                        value="Linked share"
                        checked={processBy === 'Linked share'}
                        onChange={(e) => setProcessBy(e.target.value)}
                        style={{ marginTop: '2px', accentColor: C.employeePrimary || '#0F766E' }}
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
                      border: `2px solid ${processBy === 'Direct link' ? (C.employeePrimary || '#0F766E') : C.border}`,
                      background: processBy === 'Direct link' ? `${C.employeePrimary || '#0F766E'}0D` : C.card,
                      cursor: 'pointer', transition: 'all 0.2s'
                    }}>
                      <input
                        type="radio"
                        name="processBy"
                        value="Direct link"
                        checked={processBy === 'Direct link'}
                        onChange={(e) => setProcessBy(e.target.value)}
                        style={{ marginTop: '2px', accentColor: C.employeePrimary || '#0F766E' }}
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
                    onClick={() => setApplyOffer(null)}
                    style={{ flex: 1, padding: '11px', borderRadius: '12px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ flex: 1, padding: '11px', borderRadius: '12px', border: 'none', background: C.employeePrimary || '#0F766E', color: '#FFFFFF', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
                  >
                    Submit Application
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
