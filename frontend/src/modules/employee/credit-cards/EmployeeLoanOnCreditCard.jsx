import React, { useState, useMemo } from 'react';
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
      'Zero physical documentation required',
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
      'Convenient monthly EMI billing on card statement',
      'No income proof required'
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
      'Zero impact on existing credit card spending limit',
      'Attractive reduced interest rates for existing cardholders'
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
      'No branch visits or paperwork',
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
      'Digital 1-click execution',
      'No documentation required'
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
  
  // Calculator States
  const [loanAmount, setLoanAmount] = useState(150000);
  const [interestRate, setInterestRate] = useState(13.5);
  const [tenureMonths, setTenureMonths] = useState(24);
  const [copiedId, setCopiedId] = useState(null);

  // Apply Modal State
  const [applyOffer, setApplyOffer] = useState(null);
  const [custName, setCustName] = useState('');
  const [custMobile, setCustMobile] = useState('');
  const [custCardBank, setCustCardBank] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const empCode = user?.employee_id || user?.emp_code || user?.id || '';
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://gharkapaisa.in';

  // Calculate EMI
  const emiDetails = useMemo(() => {
    const principal = parseFloat(loanAmount) || 0;
    const r = (parseFloat(interestRate) || 0) / 12 / 100;
    const n = parseInt(tenureMonths, 10) || 12;

    if (principal <= 0 || r <= 0 || n <= 0) {
      return { emi: 0, totalInterest: 0, totalPayable: 0 };
    }

    const emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayable = emi * n;
    const totalInterest = totalPayable - principal;

    return {
      emi: Math.round(emi),
      totalInterest: Math.round(totalInterest),
      totalPayable: Math.round(totalPayable)
    };
  }, [loanAmount, interestRate, tenureMonths]);

  const filteredOffers = useMemo(() => {
    return bankOffers.filter(offer => {
      const matchesSearch = offer.title.toLowerCase().includes(search.toLowerCase()) || 
                            offer.bank.toLowerCase().includes(search.toLowerCase()) ||
                            offer.features.some(f => f.toLowerCase().includes(search.toLowerCase()));
      const matchesBank = selectedBank === 'ALL' || offer.bank === selectedBank;
      return matchesSearch && matchesBank;
    });
  }, [search, selectedBank]);

  const handleCopyShareLink = (offer) => {
    const link = `${baseUrl}/apply/${encodeURIComponent(empCode)}/${offer.id}?type=card_loan`;
    navigator.clipboard.writeText(link);
    setCopiedId(offer.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleWhatsAppShare = (offer) => {
    const link = `${baseUrl}/apply/${encodeURIComponent(empCode)}/${offer.id}?type=card_loan`;
    const msg = encodeURIComponent(`Get Instant Loan on your Credit Card (${offer.bank} ${offer.title}) up to ${offer.maxLoan} with 0 documentation & disbursal in minutes!\nApply here: ${link}`);
    window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
  };

  const handleSubmitLead = (e) => {
    e.preventDefault();
    setSubmitSuccess(true);
    setTimeout(() => {
      setSubmitSuccess(false);
      setApplyOffer(null);
      setCustName('');
      setCustMobile('');
      setCustCardBank('');
    }, 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* ── 1. HERO BANNER & BENEFITS ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 50%, #047857 100%)',
        borderRadius: '20px',
        padding: '28px 32px',
        color: '#FFFFFF',
        boxShadow: '0 10px 30px rgba(15, 118, 110, 0.25)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '800px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
            <FaBolt style={{ color: '#F59E0B' }} /> Pre-Approved Cash Module
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, margin: '0 0 10px 0', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
            Instant Loan on Credit Card
          </h1>
          <p style={{ fontSize: '14.5px', color: 'rgba(255,255,255,0.9)', margin: '0 0 20px 0', lineHeight: 1.6 }}>
            Convert existing unutilized credit card limits into pre-approved cash loans instantly deposited into customer bank accounts. Zero documentation, flexible EMIs up to 60 months.
          </p>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '10px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaBolt size={18} color="#F59E0B" />
              <div>
                <span style={{ fontSize: '11px', display: 'block', opacity: 0.85, fontWeight: 700 }}>Disbursal Speed</span>
                <strong style={{ fontSize: '13px', fontWeight: 900 }}>10 Sec - 24 Hrs</strong>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '10px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaPercentage size={18} color="#34D399" />
              <div>
                <span style={{ fontSize: '11px', display: 'block', opacity: 0.85, fontWeight: 700 }}>Starting ROI</span>
                <strong style={{ fontSize: '13px', fontWeight: 900 }}>From 11.49% p.a.</strong>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '10px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaShieldAlt size={18} color="#60A5FA" />
              <div>
                <span style={{ fontSize: '11px', display: 'block', opacity: 0.85, fontWeight: 700 }}>Documentation</span>
                <strong style={{ fontSize: '13px', fontWeight: 900 }}>100% Paperless</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. INTERACTIVE LOAN EMI CALCULATOR ── */}
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
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: C.text, margin: 0 }}>Card Loan Eligibility & EMI Calculator</h3>
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
              <FaInfoCircle size={14} /> Note: Actual offer ROI varies depending on customer credit card usage and bank internal risk scoring.
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. FEATURED BANK CARD LOAN PRODUCTS & OFFERS ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: C.text, margin: 0 }}>Available Bank Card Loan Schemes ({filteredOffers.length})</h3>
            <p style={{ fontSize: '13px', color: C.textMid, margin: '2px 0 0 0' }}>Pre-approved card loan offers available across partner banks</p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ position: 'relative' }}>
              <FaSearch size={12} color={C.textLight} style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input 
                type="text"
                placeholder="Search scheme or bank..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  padding: '8px 12px 8px 32px',
                  borderRadius: '10px',
                  border: `1px solid ${C.border}`,
                  background: C.card,
                  color: C.text,
                  fontSize: '13px',
                  fontWeight: 600,
                  outline: 'none',
                  width: '220px'
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

        {/* Offers Grid */}
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
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {offer.logo ? (
                      <img src={offer.logo} alt={offer.bank} style={{ height: '36px', objectFit: 'contain' }} />
                    ) : (
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${offer.accent}15`, color: offer.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                        {offer.bank.charAt(0)}
                      </div>
                    )}
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: offer.accent, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{offer.bank}</span>
                      <h4 style={{ fontSize: '16px', fontWeight: 900, color: C.text, margin: '2px 0 0 0' }}>{offer.title}</h4>
                    </div>
                  </div>

                  <span style={{ background: `${offer.accent}15`, color: offer.accent, fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '12px' }}>
                    {offer.badge}
                  </span>
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
      </div>

      {/* ── 4. QUICK APPLY MODAL ── */}
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
                  <label style={{ fontSize: '12px', fontWeight: 700, color: C.textMid, display: 'block', marginBottom: '4px' }}>Customer Full Name *</label>
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
                  <label style={{ fontSize: '12px', fontWeight: 700, color: C.textMid, display: 'block', marginBottom: '4px' }}>Mobile Number *</label>
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
                  <label style={{ fontSize: '12px', fontWeight: 700, color: C.textMid, display: 'block', marginBottom: '4px' }}>Existing Credit Card Bank *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. HDFC, SBI, ICICI..."
                    value={custCardBank}
                    onChange={(e) => setCustCardBank(e.target.value)}
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
