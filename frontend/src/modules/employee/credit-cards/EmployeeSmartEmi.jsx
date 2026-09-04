import React, { useState, useMemo } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuthStore } from '../../../app/store/authStore';
import { 
  FaCreditCard, FaCalculator, FaCheckCircle, FaBolt, FaShieldAlt, 
  FaShareAlt, FaCopy, FaExternalLinkAlt, FaSearch, FaShoppingBag,
  FaPercentage, FaCalendarAlt, FaUserCheck, FaInfoCircle
} from 'react-icons/fa';
import hdfcLogo from '../../home/components/banks/hdfc_bank.png';
import sbiLogo from '../../home/components/banks/sbi_card.png';
import iciciLogo from '../../home/components/banks/icici_bank.png';
import axisLogo from '../../home/components/banks/axis_bank.png';
import rblLogo from '../../home/components/banks/rbl_bank.png';
import kotakLogo from '../../home/components/banks/kotak_bank.png';

const emiSchemes = [
  {
    id: 'hdfc-smart-emi',
    bank: 'HDFC Bank',
    title: 'SmartEMI on Credit Card',
    logo: hdfcLogo,
    accent: '#2563EB',
    minTransaction: '₹2,500',
    minRoi: '1.15% per month (13.8% p.a.)',
    tenure: '3 - 36 Months',
    processingFee: '₹199 + GST',
    conversionSpeed: 'Instant / Within 24 Hrs',
    badge: 'Popular Scheme',
    features: [
      'Convert card purchases into monthly EMIs instantly via NetBanking/App',
      'No-Cost EMI options available across 5,000+ merchant partners',
      'Earn reward points on initial transaction before conversion',
      'Zero pre-payment penalty after 3 EMIs'
    ]
  },
  {
    id: 'sbi-flexipay',
    bank: 'SBI Card',
    title: 'Flexipay (Post-Purchase EMI)',
    logo: sbiLogo,
    accent: '#0284C7',
    minTransaction: '₹5,000',
    minRoi: '1.25% per month (15.0% p.a.)',
    tenure: '6 - 24 Months',
    processingFee: '1% (Min ₹99)',
    disbursalTime: 'Instant 1-Click Convert',
    badge: 'Flexi Option',
    features: [
      'Convert transactions within 30 days of purchase',
      'Flexible repayment tenure options (6, 9, 12, 24 months)',
      'Manage EMIs directly from SBI Card App',
      'No income document needed'
    ]
  },
  {
    id: 'icici-emi-card',
    bank: 'ICICI Bank',
    title: 'Instant EMI on Card',
    logo: iciciLogo,
    accent: '#F97316',
    minTransaction: '₹3,000',
    minRoi: '1.08% per month (13.0% p.a.)',
    tenure: '3 - 24 Months',
    processingFee: 'Flat ₹199',
    conversionSpeed: 'Instant at Checkout / App',
    badge: 'Low Processing Fee',
    features: [
      'Instant checkout EMI at Amazon, Flipkart & leading stores',
      'Convert existing card balance into easy EMIs',
      'Exclusive 0% No-Cost EMI brand tie-ups',
      'Seamless auto-debit in monthly credit card bill'
    ]
  },
  {
    id: 'axis-dial-convert',
    bank: 'Axis Bank',
    title: 'Dial-a-Convert EMI',
    logo: axisLogo,
    accent: '#E11D48',
    minTransaction: '₹2,500',
    minRoi: '1.20% per month (14.4% p.a.)',
    tenure: '3 - 36 Months',
    processingFee: '1.5% (Min ₹150)',
    conversionSpeed: 'Instant via Axis Mobile',
    badge: 'Fast Convert',
    features: [
      'Convert transactions up to 60 days post-purchase',
      'No hassle 24x7 conversion feature',
      'Retain credit card reward points earned'
    ]
  },
  {
    id: 'rbl-split-pay',
    bank: 'RBL Bank',
    title: 'Split N Pay EMI',
    logo: rblLogo,
    accent: '#0284C7',
    minTransaction: '₹3,000',
    minRoi: '1.16% per month (14.0% p.a.)',
    tenure: '3 - 24 Months',
    processingFee: '₹150 + GST',
    conversionSpeed: 'Instant App Conversion',
    badge: 'Easy Split',
    features: [
      'Split single or multiple transaction items into EMIs',
      'Special zero interest promotional windows',
      'Zero foreclosure fees'
    ]
  },
  {
    id: 'kotak-smart-emi',
    bank: 'Kotak Mahindra Bank',
    title: 'Kotak Smart EMI Scheme',
    logo: kotakLogo,
    accent: '#DC2626',
    minTransaction: '₹2,500',
    minRoi: '1.25% per month (15.0% p.a.)',
    tenure: '3 - 48 Months',
    processingFee: '₹199 + GST',
    conversionSpeed: 'Instant 1-Tap EMI',
    badge: 'High Approval',
    features: [
      'Convert transactions online or SMS keyword',
      'Choose customized tenure options',
      'Complete visibility in monthly statement'
    ]
  }
];

export default function EmployeeSmartEmi() {
  const { C, isDark } = useTheme();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [selectedBank, setSelectedBank] = useState('ALL');

  // Calculator States
  const [purchaseAmt, setPurchaseAmt] = useState(75000);
  const [tenure, setTenure] = useState(12);
  const [rateType, setRateType] = useState('LOW_COST'); // 'NO_COST', 'LOW_COST', 'STANDARD'
  const [copiedId, setCopiedId] = useState(null);

  // Apply Modal State
  const [applyScheme, setApplyScheme] = useState(null);
  const [custName, setCustName] = useState('');
  const [custMobile, setCustMobile] = useState('');
  const [custCardBank, setCustCardBank] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const empCode = user?.employee_id || user?.emp_code || user?.id || '';
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
    return emiSchemes.filter(scheme => {
      const matchesSearch = scheme.title.toLowerCase().includes(search.toLowerCase()) || 
                            scheme.bank.toLowerCase().includes(search.toLowerCase()) ||
                            scheme.features.some(f => f.toLowerCase().includes(search.toLowerCase()));
      const matchesBank = selectedBank === 'ALL' || scheme.bank === selectedBank;
      return matchesSearch && matchesBank;
    });
  }, [search, selectedBank]);

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

  const handleSubmitLead = (e) => {
    e.preventDefault();
    setSubmitSuccess(true);
    setTimeout(() => {
      setSubmitSuccess(false);
      setApplyScheme(null);
      setCustName('');
      setCustMobile('');
      setCustCardBank('');
    }, 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* ── 1. HERO BANNER & HIGHLIGHTS ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)',
        borderRadius: '20px',
        padding: '28px 32px',
        color: '#FFFFFF',
        boxShadow: '0 10px 30px rgba(49, 46, 129, 0.25)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '800px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
            <FaShoppingBag style={{ color: '#A7F3D0' }} /> Smart Purchase-to-EMI Module
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, margin: '0 0 10px 0', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
            Smart EMI on Credit Card
          </h1>
          <p style={{ fontSize: '14.5px', color: 'rgba(255,255,255,0.9)', margin: '0 0 20px 0', lineHeight: 1.6 }}>
            Convert customer credit card swipes, electronics purchases, medical bills, or travel expenses into low-cost or no-cost monthly EMIs with instant bank partner approvals.
          </p>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '10px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaBolt size={18} color="#F59E0B" />
              <div>
                <span style={{ fontSize: '11px', display: 'block', opacity: 0.85, fontWeight: 700 }}>Conversion Time</span>
                <strong style={{ fontSize: '13px', fontWeight: 900 }}>Instant 1-Tap</strong>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '10px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaPercentage size={18} color="#34D399" />
              <div>
                <span style={{ fontSize: '11px', display: 'block', opacity: 0.85, fontWeight: 700 }}>EMI Schemes</span>
                <strong style={{ fontSize: '13px', fontWeight: 900 }}>0% No-Cost & Low Interest</strong>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '10px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaCalendarAlt size={18} color="#818CF8" />
              <div>
                <span style={{ fontSize: '11px', display: 'block', opacity: 0.85, fontWeight: 700 }}>Tenure Flexibility</span>
                <strong style={{ fontSize: '13px', fontWeight: 900 }}>3 to 36 Months</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. INTERACTIVE PURCHASE-TO-EMI CONVERTER ── */}
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

            {/* Scheme Type Selector */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, color: C.textMid, display: 'block', marginBottom: '10px' }}>Select Scheme Offer Type:</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                <button
                  onClick={() => setRateType('NO_COST')}
                  style={{
                    padding: '10px 8px',
                    borderRadius: '10px',
                    border: `1px solid ${rateType === 'NO_COST' ? '#10B981' : C.border}`,
                    background: rateType === 'NO_COST' ? '#10B981' : C.bgSecondary,
                    color: rateType === 'NO_COST' ? '#FFFFFF' : C.text,
                    fontSize: '12.5px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  0% No-Cost EMI
                </button>
                <button
                  onClick={() => setRateType('LOW_COST')}
                  style={{
                    padding: '10px 8px',
                    borderRadius: '10px',
                    border: `1px solid ${rateType === 'LOW_COST' ? '#4338CA' : C.border}`,
                    background: rateType === 'LOW_COST' ? '#4338CA' : C.bgSecondary,
                    color: rateType === 'LOW_COST' ? '#FFFFFF' : C.text,
                    fontSize: '12.5px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Low Cost (1.15%/mo)
                </button>
                <button
                  onClick={() => setRateType('STANDARD')}
                  style={{
                    padding: '10px 8px',
                    borderRadius: '10px',
                    border: `1px solid ${rateType === 'STANDARD' ? '#F59E0B' : C.border}`,
                    background: rateType === 'STANDARD' ? '#F59E0B' : C.bgSecondary,
                    color: rateType === 'STANDARD' ? '#FFFFFF' : C.text,
                    fontSize: '12.5px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Standard (1.35%/mo)
                </button>
              </div>
            </div>

            {/* Tenure Options */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, color: C.textMid, display: 'block', marginBottom: '10px' }}>Select Repayment Duration:</label>
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
                <span style={{ color: C.textMid, fontWeight: 600 }}>Interest Charge:</span>
                <strong style={{ color: rateType === 'NO_COST' ? '#10B981' : '#F59E0B', fontWeight: 800 }}>
                  {rateType === 'NO_COST' ? '₹0 (0% No-Cost)' : `₹${emiDetails.totalInterest.toLocaleString('en-IN')}`}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px' }}>
                <span style={{ color: C.textMid, fontWeight: 600 }}>Processing Fee:</span>
                <strong style={{ color: C.text, fontWeight: 700 }}>
                  {emiDetails.processingFee === 0 ? 'FREE' : `₹${emiDetails.processingFee}`}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderTop: `1px dashed ${C.border}`, paddingTop: '10px' }}>
                <span style={{ color: C.text, fontWeight: 800 }}>Total Repayment Amount:</span>
                <strong style={{ color: C.text, fontWeight: 900 }}>₹{emiDetails.totalPayable.toLocaleString('en-IN')}</strong>
              </div>
            </div>

            <div style={{ background: '#4338CA10', padding: '10px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#4338CA', fontWeight: 700 }}>
              <FaInfoCircle size={14} /> Note: Customer can request EMI conversion via netbanking app or SMS keyword within 30-60 days of purchase.
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. SMART EMI SCHEMES & BANK PARTNERS ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: C.text, margin: 0 }}>Smart EMI Card Partner Schemes ({filteredSchemes.length})</h3>
            <p style={{ fontSize: '13px', color: C.textMid, margin: '2px 0 0 0' }}>Conversion offers & No-cost EMI partner schemes</p>
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
              <option value="RBL Bank">RBL Bank</option>
              <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
            </select>
          </div>
        </div>

        {/* Schemes Grid */}
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
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {scheme.logo ? (
                      <img src={scheme.logo} alt={scheme.bank} style={{ height: '36px', objectFit: 'contain' }} />
                    ) : (
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${scheme.accent}15`, color: scheme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                        {scheme.bank.charAt(0)}
                      </div>
                    )}
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: scheme.accent, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{scheme.bank}</span>
                      <h4 style={{ fontSize: '16px', fontWeight: 900, color: C.text, margin: '2px 0 0 0' }}>{scheme.title}</h4>
                    </div>
                  </div>

                  <span style={{ background: `${scheme.accent}15`, color: scheme.accent, fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '12px' }}>
                    {scheme.badge}
                  </span>
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

              {/* Action Buttons */}
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => setApplyScheme(scheme)}
                  style={{
                    width: '100%',
                    padding: '11px',
                    borderRadius: '12px',
                    border: 'none',
                    background: '#4338CA',
                    color: '#FFFFFF',
                    fontSize: '13.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(67, 56, 202, 0.2)'
                  }}
                >
                  <FaUserCheck /> Submit Smart EMI Lead
                </button>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleCopyShareLink(scheme)}
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
                    <FaCopy size={12} /> {copiedId === scheme.id ? 'Copied!' : 'Copy Link'}
                  </button>

                  <button
                    onClick={() => handleWhatsAppShare(scheme)}
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

      {/* ── 4. QUICK SUBMIT MODAL ── */}
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
                  <label style={{ fontSize: '12px', fontWeight: 700, color: C.textMid, display: 'block', marginBottom: '4px' }}>Credit Card Bank Name *</label>
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
