import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { getApiV1Url } from '../../../config/api';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuthStore } from '../../../app/store/authStore';
import { 
  FaCoins, FaCalculator, FaCheckCircle, FaBolt, FaShieldAlt, 
  FaShareAlt, FaCopy, FaExternalLinkAlt, FaSearch, FaChevronRight,
  FaPercentage, FaCalendarAlt, FaUserCheck, FaInfoCircle
} from 'react-icons/fa';
import hdfcLogo from '../../home/components/banks/hdfc_bank.png';
import sbiLogo from '../../home/components/banks/sbi_card.png';
import iciciLogo from '../../home/components/banks/icici_bank.png';
import axisLogo from '../../home/components/banks/axis_bank.png';
import idfcLogo from '../../home/components/banks/idfc_first_bank.png';
import kotakLogo from '../../home/components/banks/kotak_bank.png';

const bankOffers = [
  {
    id: 'hdfc-insta',
    bank: 'HDFC Bank',
    title: 'Insta Loan & Jumbo Loan',
    logo: hdfcLogo,
    accent: '#2563EB',
    maxLoan: '₹10,000,000',
    minRoi: '11.49% p.a.',
    tenure: '12 - 60 Months',
    processingFee: '₹999 + GST',
    disbursalTime: 'Instant (10 Seconds)',
    badge: 'Pre-Approved',
    features: [
      'Over-and-above credit limit (Jumbo Loan option)',
      'Instant credit directly to savings account',
      'Flexible foreclosure options after 12 months'
    ]
  },
  {
    id: 'sbi-encash',
    bank: 'SBI Card',
    title: 'Encash & Encash Inline',
    logo: sbiLogo,
    accent: '#0284C7',
    maxLoan: '₹500,000',
    minRoi: '12.50% p.a.',
    tenure: '12 - 48 Months',
    processingFee: '1% (Min ₹500)',
    disbursalTime: 'Within 48 Hours / Instant NEFT',
    badge: 'Popular Choice',
    features: [
      'Available for all active SBI Card holders',
      'Encash Inline block/unblock limit options',
      'Convenient monthly EMI billing on card statement'
    ]
  },
  {
    id: 'icici-dial',
    bank: 'ICICI Bank',
    title: 'Dial-a-Loan on Credit Card',
    logo: iciciLogo,
    accent: '#F97316',
    maxLoan: '₹750,000',
    minRoi: '11.99% p.a.',
    tenure: '12 - 36 Months',
    processingFee: 'Flat ₹499',
    disbursalTime: 'Instant Credit via iMobile',
    badge: 'Low Processing Fee',
    features: [
      'Instant funds disbursal into any bank account',
      'Repay in easy 12 to 36 month EMIs',
      'Zero impact on existing credit card spending limit'
    ]
  },
  {
    id: 'axis-instant',
    bank: 'Axis Bank',
    title: 'Instant Cash on Credit Card',
    logo: axisLogo,
    accent: '#E11D48',
    maxLoan: '₹500,000',
    minRoi: '13.00% p.a.',
    tenure: '6 - 36 Months',
    processingFee: '1.5% (Max ₹1,500)',
    disbursalTime: 'Instant NetBanking Transfer',
    badge: 'Fast Transfer',
    features: [
      'Pre-approved cash disbursal directly from Axis Mobile',
      'Transparent repayment schedule in monthly statement'
    ]
  },
  {
    id: 'idfc-card-loan',
    bank: 'IDFC FIRST Bank',
    title: 'Card Limit to Cash Loan',
    logo: idfcLogo,
    accent: '#DC2626',
    maxLoan: '₹300,000',
    minRoi: '12.00% p.a.',
    tenure: '3 - 24 Months',
    processingFee: 'ZERO Processing Fee',
    disbursalTime: 'Instant 24x7 Disbursal',
    badge: 'Zero Processing Fee',
    features: [
      'Interest-free cash disbursal window for select users',
      'Digital 1-click execution'
    ]
  },
  {
    id: 'kotak-smart-loan',
    bank: 'Kotak Mahindra Bank',
    title: 'Kotak Smart Loan on Card',
    logo: kotakLogo,
    accent: '#DC2626',
    maxLoan: '₹400,000',
    minRoi: '12.99% p.a.',
    tenure: '12 - 48 Months',
    processingFee: '₹750 + GST',
    disbursalTime: 'Instant IMPS Disbursal',
    badge: 'High Conversion',
    features: [
      'Customized pre-approved limit based on card history',
      'Hassle-free auto-debit billing',
      'Zero foreclosure charges after 6 EMIs'
    ]
  }
];

export default function EmployeeLoanOnCreditCard() {
  const { C, isDark } = useTheme();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [selectedBank, setSelectedBank] = useState('ALL');
  const [dbOffers, setDbOffers] = useState([]);
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

  // Fetch dynamic offers from backend API
  React.useEffect(() => {
    const fetchDynamicOffers = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${getApiV1Url()}/products?limit=1000`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const prods = res.data?.data?.rows || res.data?.data || res.data?.products || [];
        if (Array.isArray(prods) && prods.length > 0) {
          // Filter products relevant for Loan on Credit Card
          const cardLoanProds = prods.filter(p => {
            const cat = String(p.category || '').toLowerCase();
            const subCat = String(p.sub_category || '').toLowerCase();
            const pName = String(p.name || '').toLowerCase();
            return cat.includes('loan_on_credit_card') || 
                   subCat.includes('loan on credit card') || 
                   (cat.includes('loan') && (pName.includes('credit card') || pName.includes('insta') || pName.includes('jumbo') || pName.includes('encash') || pName.includes('dial') || subCat.includes('loan')));
          });

          const targetProds = cardLoanProds.length > 0 ? cardLoanProds : prods.filter(p => String(p.category || '').toLowerCase().includes('loan'));

          if (targetProds.length > 0) {
            const mapped = targetProds.map(p => {
              let parsedFeatures = [];
              try {
                parsedFeatures = typeof p.features === 'string' ? JSON.parse(p.features) : (Array.isArray(p.features) ? p.features : []);
              } catch (e) {
                parsedFeatures = [p.description || 'Pre-approved instant cash loan'];
              }
              const bName = p.bank_name || p.bank || 'Partner Bank';
              return {
                id: p.id,
                bank_id: p.bank_id,
                bank: bName,
                title: p.name,
                logo: getBankLogo(bName, p.bank_logo || p.logo || p.image_url),
                accent: '#0F766E',
                maxLoan: p.joining_fee || '₹10,000,000',
                minRoi: p.interest_rate || '11.49% p.a.',
                tenure: p.time_period || '12 - 60 Months',
                processingFee: p.annual_fee || '₹999 + GST',
                disbursalTime: 'Instant (10 Seconds)',
                badge: p.badge || 'Pre-Approved',
                features: parsedFeatures.length > 0 ? parsedFeatures : [p.description || 'Pre-approved cash loan over credit limit']
              };
            });
            setDbOffers(mapped);
          }
        }
      } catch (err) {
        console.error('Failed to load dynamic Card Loan offers:', err);
      } finally {
        setLoadingProds(false);
      }
    };
    fetchDynamicOffers();
  }, []);

  const activeOffers = dbOffers.length > 0 ? dbOffers : bankOffers;

  // Calculator States
  const [loanAmount, setLoanAmount] = useState(150000);
  const [interestRate, setInterestRate] = useState(13.5);
  const [tenureMonths, setTenureMonths] = useState(24);
  const [copiedId, setCopiedId] = useState(null);

  // Apply Modal State
  const [applyOffer, setApplyOffer] = useState(null);
  const [custName, setCustName] = useState('');
  const [custMobile, setCustMobile] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const empCode = user?.employee_id || user?.emp_code || user?.id || '';
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://gharkapaisa.in';

  // Calculate EMI
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
    return activeOffers.filter(offer => {
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
      await axios.post(`${getApiV1Url()}/employee/leads`, {
        full_name: custName,
        mobile: custMobile,
        card_bank: applyOffer?.bank,
        card_name: applyOffer?.title || applyOffer?.name,
        product_id: isUuid ? applyOffer?.id : undefined,
        product_type: 'loan_on_credit_card'
      });
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setApplyOffer(null);
        setCustName('');
        setCustMobile('');
      }, 2500);
    } catch (err) {
      console.error('Failed to submit card loan lead:', err);
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setApplyOffer(null);
        setCustName('');
        setCustMobile('');
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
            <option value="ALL">All Banks</option>
            <option value="HDFC Bank">HDFC Bank</option>
            <option value="SBI Card">SBI Card</option>
            <option value="ICICI Bank">ICICI Bank</option>
            <option value="Axis Bank">Axis Bank</option>
            <option value="IDFC FIRST Bank">IDFC FIRST Bank</option>
            <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
          </select>
        </div>
      </div>

      {/* ── 4. OFFERS GRID ── */}
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

            {/* Action Buttons */}
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => setApplyOffer(offer)}
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: '12px',
                  border: 'none',
                  background: C.employeePrimary || '#0F766E',
                  color: '#FFFFFF',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(15, 118, 110, 0.2)'
                }}
              >
                <FaUserCheck /> Apply for Customer Now
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleCopyShareLink(offer)}
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
                  <FaCopy size={12} /> {copiedId === offer.id ? 'Copied!' : 'Copy Link'}
                </button>

                <button
                  onClick={() => handleWhatsAppShare(offer)}
                  style={{
                    flex: 1,
                    padding: '9px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#25D366',
                    color: '#FFFFFF',
                    fontSize: '12.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <FaShareAlt size={12} /> WhatsApp
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── 5. QUICK APPLY MODAL ── */}
      {applyOffer && (
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
              Apply {applyOffer.bank} {applyOffer.title}
            </h3>
            <p style={{ fontSize: '13px', color: C.textMid, margin: '0 0 20px 0' }}>
              Submit lead details for customer card loan eligibility verification.
            </p>

            {submitSuccess ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <FaCheckCircle color="#10B981" size={48} style={{ marginBottom: '12px' }} />
                <h4 style={{ fontSize: '18px', fontWeight: 900, color: C.text, margin: '0 0 6px 0' }}>Application Submitted!</h4>
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
                  <label style={{ fontSize: '12px', fontWeight: 700, color: C.textMid, display: 'block', marginBottom: '4px' }}>Mobile Number</label>
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
