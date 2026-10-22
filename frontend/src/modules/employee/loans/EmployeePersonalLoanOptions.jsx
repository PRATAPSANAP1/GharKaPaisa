import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import PartnerProducts from '../../partner/products/PartnerProducts';
import { 
  BANK_OPTIONS, 
  CIBIL_BANK_OPTIONS,
  INCOME_BANK_OPTIONS,
  FINANCE_COMPANY_OPTIONS 
} from '../../../utils/personalLoanHelpers';
import { 
  MdArrowBack, 
  MdChevronRight, 
  MdInfoOutline, 
  MdAccountBalance, 
  MdApartment, 
  MdAssignment
} from 'react-icons/md';

// Custom SVG CIBIL Speedometer / Credit Meter Icon
function CibilMeterIcon({ size = 42 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cibilGaugeGrad" x1="8" y1="52" x2="56" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="35%" stopColor="#F59E0B" />
          <stop offset="70%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>
      {/* Background arc track */}
      <path
        d="M 12 46 A 24 24 0 1 1 52 46"
        stroke="#E2E8F0"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      {/* Colored gauge arc */}
      <path
        d="M 12 46 A 24 24 0 1 1 52 46"
        stroke="url(#cibilGaugeGrad)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray="98"
        strokeDashoffset="18"
        fill="none"
      />
      {/* Gauge needle */}
      <line
        x1="32"
        y1="38"
        x2="44"
        y2="22"
        stroke="#1E293B"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Gauge center hub */}
      <circle cx="32" cy="38" r="5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
    </svg>
  );
}

// Custom SVG Income / Salary Wallet Icon
function IncomeWalletIcon({ size = 42 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Banknote sticking out */}
      <rect x="20" y="14" width="28" height="16" rx="3" fill="#10B981" />
      <circle cx="34" cy="22" r="3" fill="#A7F3D0" />
      {/* Main wallet body */}
      <rect x="12" y="22" width="40" height="28" rx="6" fill="#2563EB" />
      {/* Wallet flap / clip */}
      <path
        d="M 36 28 H 52 V 44 H 36 C 32 44 32 28 36 28 Z"
        fill="#1D4ED8"
      />
      <circle cx="44" cy="36" r="3" fill="#FBBF24" />
    </svg>
  );
}

// Finance chips for Screen 4 (the 7 canonical finance companies)
const QUICK_FINANCE_CHIPS = [
  'All Finance Companies',
  'Finable',
  'Punawalla Finance',
  'Bajaj Finance',
  'KreditBee',
  'Tata Capital',
  'Unity',
  'Ram Fincorp'
];

export default function EmployeePersonalLoanOptions() {
  const { C, isDark } = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Parse eligibility from URL parameters (case-insensitive & robust)
  const parseEligibility = (param) => {
    if (!param) return null;
    const lower = String(param).toLowerCase().trim();
    if (lower.includes('cibil')) return 'cibil';
    if (lower.includes('income') || lower.includes('salary')) return 'income';
    return null;
  };

  // Parse provider from URL parameters (strictly 'bank' or 'finance')
  const parseProvider = (param) => {
    if (!param) return null;
    const lower = String(param).toLowerCase().trim();
    if (lower === 'bank') return 'bank';
    if (lower === 'finance') return 'finance';
    return null;
  };

  // Dual state: controlled by React state and synchronized with searchParams
  const [eligibilityType, setEligibilityType] = useState(() => parseEligibility(searchParams.get('type')));
  const [providerType, setProviderType] = useState(() => parseProvider(searchParams.get('provider')));

  // Synchronize with URL search parameters on changes (browser Back/Forward)
  useEffect(() => {
    const parsedElig = parseEligibility(searchParams.get('type'));
    const parsedProv = parseProvider(searchParams.get('provider'));
    setEligibilityType(parsedElig);
    setProviderType(parsedProv);
  }, [searchParams]);

  const isFinanceMode = providerType === 'finance';
  const defaultBankValue = isFinanceMode ? 'All Finance Companies' : 'All Banks';
  const activeBankOptions = isFinanceMode 
    ? FINANCE_COMPANY_OPTIONS 
    : (eligibilityType === 'cibil' ? CIBIL_BANK_OPTIONS : INCOME_BANK_OPTIONS);

  const rawBankParam = searchParams.get('bank');
  const isBankValidForMode = !rawBankParam || activeBankOptions.includes(rawBankParam) || rawBankParam === defaultBankValue || rawBankParam === 'All Banks';
  const selectedBank = isBankValidForMode ? (rawBankParam || defaultBankValue) : defaultBankValue;

  // Navigation handlers
  const handleSelectEligibility = (type) => {
    setEligibilityType(type);
    setProviderType(null); // Explicitly clear provider so Stage 2 (Bank + Finance) is ALWAYS displayed
    setSearchParams({ type });
  };

  const handleSelectProvider = (provider) => {
    setProviderType(provider);
    setSearchParams({ type: eligibilityType || 'cibil', provider });
  };

  const handleSelectBankChip = (bank) => {
    setSearchParams({ 
      type: eligibilityType || 'cibil', 
      provider: providerType || 'bank', 
      bank: bank === defaultBankValue ? defaultBankValue : bank 
    });
  };

  const handleBackToLanding = () => {
    setEligibilityType(null);
    setProviderType(null);
    setSearchParams({});
  };

  const handleBackToProviderSelection = () => {
    setProviderType(null);
    setSearchParams({ type: eligibilityType || 'cibil' });
  };

  const eligibilityLabel = eligibilityType === 'cibil' 
    ? 'CIBIL-Based Loan' 
    : eligibilityType === 'income' 
      ? 'Income-Based Loan' 
      : '';

  // ─────────────────────────────────────────────────────────────────────────────
  // STAGE 1: PERSONAL LOAN LANDING PAGE (ONLY 2 ELIGIBILITY OPTIONS)
  // ─────────────────────────────────────────────────────────────────────────────
  if (!eligibilityType) {
    return (
      <div 
        id="personal-loan-stage-1"
        data-testid="personal-loan-stage-1"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? '16px' : '24px',
          paddingBottom: isMobile ? '40px' : '60px',
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        {/* Header Card */}
        <div style={{
          background: C.card,
          borderRadius: isMobile ? '16px' : '22px',
          padding: isMobile ? '18px 16px' : '24px 30px',
          border: `1.5px solid ${C.border}`,
          boxShadow: isDark ? 'none' : '0 4px 20px rgba(15, 23, 42, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                background: `${C.primary}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: C.primary
              }}>
                <MdAssignment size={20} />
              </div>
              <div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: C.primary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  display: 'block'
                }}>
                  Loan Category Catalog
                </span>
                <h1 style={{
                  fontSize: isMobile ? '22px' : '28px',
                  fontWeight: 900,
                  color: C.text,
                  margin: '2px 0 0'
                }}>
                  Personal Loan
                </h1>
              </div>
            </div>

            <button
              onClick={() => navigate('/employee/loans')}
              style={{
                background: isDark ? C.bgSecondary : '#F1F5F9',
                border: `1px solid ${C.border}`,
                borderRadius: '10px',
                padding: '8px 16px',
                color: C.text,
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <MdArrowBack size={16} /> All Loans
            </button>
          </div>

          <p style={{
            fontSize: isMobile ? '13px' : '14px',
            color: C.textMid,
            margin: '4px 0 0',
            fontWeight: 500
          }}>
            Choose your loan eligibility type
          </p>
        </div>

        {/* 2 Eligibility Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
          gap: isMobile ? '16px' : '24px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {/* Card 1: CIBIL-Based Loan */}
          <div 
            id="eligibility-card-cibil"
            data-testid="eligibility-card-cibil"
            style={{
              background: C.card,
              borderRadius: '20px',
              padding: isMobile ? '28px 20px' : '38px 32px',
              border: `1.5px solid ${C.border}`,
              boxShadow: isDark ? 'none' : '0 8px 30px rgba(15, 23, 42, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '16px',
              visibility: 'visible',
              opacity: 1,
              width: '100%',
              boxSizing: 'border-box'
            }}
          >
            <div style={{
              width: 76,
              height: 76,
              borderRadius: '50%',
              background: isDark ? `${C.primary}20` : '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '4px'
            }}>
              <CibilMeterIcon size={46} />
            </div>

            <div>
              <h2 style={{
                fontSize: isMobile ? '20px' : '22px',
                fontWeight: 800,
                color: C.text,
                margin: '0 0 6px'
              }}>
                CIBIL-Based Loan
              </h2>
              <p style={{
                fontSize: '14px',
                color: C.textMid,
                margin: 0,
                fontWeight: 500
              }}>
                Credit score ke basis par
              </p>
            </div>

            <button
              id="btn-view-cibil-loan"
              data-testid="btn-view-cibil-loan"
              onClick={() => handleSelectEligibility('cibil')}
              style={{
                width: '100%',
                marginTop: '10px',
                padding: '12px 20px',
                borderRadius: '12px',
                background: C.primary,
                color: '#FFFFFF',
                border: 'none',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: isDark ? 'none' : `0 4px 14px ${C.primary}40`,
                transition: 'opacity 0.2s ease'
              }}
            >
              View →
            </button>
          </div>

          {/* Card 2: Income-Based Loan */}
          <div 
            id="eligibility-card-income"
            data-testid="eligibility-card-income"
            style={{
              background: C.card,
              borderRadius: '20px',
              padding: isMobile ? '28px 20px' : '38px 32px',
              border: `1.5px solid ${C.border}`,
              boxShadow: isDark ? 'none' : '0 8px 30px rgba(15, 23, 42, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '16px',
              visibility: 'visible',
              opacity: 1,
              width: '100%',
              boxSizing: 'border-box'
            }}
          >
            <div style={{
              width: 76,
              height: 76,
              borderRadius: '50%',
              background: isDark ? `${C.primary}20` : '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '4px'
            }}>
              <IncomeWalletIcon size={46} />
            </div>

            <div>
              <h2 style={{
                fontSize: isMobile ? '20px' : '22px',
                fontWeight: 800,
                color: C.text,
                margin: '0 0 6px'
              }}>
                Income-Based Loan
              </h2>
              <p style={{
                fontSize: '14px',
                color: C.textMid,
                margin: 0,
                fontWeight: 500
              }}>
                Income ke basis par
              </p>
            </div>

            <button
              id="btn-view-income-loan"
              data-testid="btn-view-income-loan"
              onClick={() => handleSelectEligibility('income')}
              style={{
                width: '100%',
                marginTop: '10px',
                padding: '12px 20px',
                borderRadius: '12px',
                background: C.primary,
                color: '#FFFFFF',
                border: 'none',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: isDark ? 'none' : `0 4px 14px ${C.primary}40`,
                transition: 'opacity 0.2s ease'
              }}
            >
              View →
            </button>
          </div>
        </div>

        {/* Bottom Helper Info Alert */}
        <div style={{
          background: isDark ? `${C.primary}15` : '#EFF6FF',
          border: `1px solid ${C.primary}30`,
          borderRadius: '12px',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: C.primary,
          fontSize: '13px',
          fontWeight: 600
        }}>
          <MdInfoOutline size={18} style={{ flexShrink: 0 }} />
          <span>Select a loan type to explore available Bank and Finance offers.</span>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STAGE 2: PROVIDER SELECTION SCREEN (BOTH BANK AND FINANCE OPTIONS)
  // ─────────────────────────────────────────────────────────────────────────────
  if (!providerType) {
    return (
      <div 
        id="personal-loan-stage-2"
        data-testid="personal-loan-stage-2"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? '16px' : '24px',
          paddingBottom: isMobile ? '40px' : '60px',
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        {/* Breadcrumb & Navigation */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13.5px',
          fontWeight: 600,
          flexWrap: 'wrap'
        }}>
          <button
            onClick={handleBackToLanding}
            style={{
              background: 'none',
              border: 'none',
              color: C.textMid,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 0',
              fontWeight: 700,
              fontSize: '13.5px'
            }}
          >
            <MdArrowBack size={16} /> Personal Loan
          </button>
          <span style={{ color: C.textMid }}>›</span>
          <span style={{ color: C.primary, fontWeight: 700 }}>
            {eligibilityLabel}
          </span>
        </div>

        {/* Page Title Header */}
        <div>
          <h1 style={{
            fontSize: isMobile ? '22px' : '28px',
            fontWeight: 900,
            color: C.text,
            margin: '0 0 6px'
          }}>
            Choose Your Provider Type
          </h1>
          <p style={{
            fontSize: isMobile ? '13px' : '14px',
            color: C.textMid,
            margin: 0,
            fontWeight: 500
          }}>
            Select between Bank or Finance to view available personal loan offers.
          </p>
        </div>

        {/* 2 Provider Cards (BOTH Bank AND Finance GUARANTEED to render) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
          gap: isMobile ? '16px' : '24px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {/* Provider Card 1: Bank */}
          <div 
            id="provider-card-bank"
            data-testid="provider-card-bank"
            style={{
              background: C.card,
              borderRadius: '20px',
              padding: isMobile ? '28px 20px' : '38px 32px',
              border: `1.5px solid ${C.border}`,
              boxShadow: isDark ? 'none' : '0 8px 30px rgba(15, 23, 42, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '16px',
              visibility: 'visible',
              opacity: 1,
              width: '100%',
              boxSizing: 'border-box'
            }}
          >
            <div style={{
              width: 76,
              height: 76,
              borderRadius: '50%',
              background: isDark ? `${C.primary}20` : '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: C.primary
            }}>
              <MdAccountBalance size={38} />
            </div>

            <div>
              <h2 style={{
                fontSize: isMobile ? '20px' : '22px',
                fontWeight: 800,
                color: C.text,
                margin: '0 0 6px'
              }}>
                Bank
              </h2>
              <p style={{
                fontSize: '14px',
                color: C.textMid,
                margin: 0,
                fontWeight: 500
              }}>
                Explore personal loan products from leading banks
              </p>
            </div>

            <button
              id="btn-view-bank-offers"
              data-testid="btn-view-bank-offers"
              onClick={() => handleSelectProvider('bank')}
              style={{
                width: '100%',
                marginTop: '10px',
                padding: '12px 20px',
                borderRadius: '12px',
                background: C.primary,
                color: '#FFFFFF',
                border: 'none',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: isDark ? 'none' : `0 4px 14px ${C.primary}40`,
                visibility: 'visible',
                opacity: 1
              }}
            >
              View Bank Offers →
            </button>
          </div>

          {/* Provider Card 2: Finance */}
          <div 
            id="provider-card-finance"
            data-testid="provider-card-finance"
            style={{
              background: C.card,
              borderRadius: '20px',
              padding: isMobile ? '28px 20px' : '38px 32px',
              border: `1.5px solid ${C.border}`,
              boxShadow: isDark ? 'none' : '0 8px 30px rgba(15, 23, 42, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '16px',
              visibility: 'visible',
              opacity: 1,
              width: '100%',
              boxSizing: 'border-box'
            }}
          >
            <div style={{
              width: 76,
              height: 76,
              borderRadius: '50%',
              background: isDark ? `${C.primary}20` : '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: C.primary
            }}>
              <MdApartment size={38} />
            </div>

            <div>
              <h2 style={{
                fontSize: isMobile ? '20px' : '22px',
                fontWeight: 800,
                color: C.text,
                margin: '0 0 6px'
              }}>
                Finance
              </h2>
              <p style={{
                fontSize: '14px',
                color: C.textMid,
                margin: 0,
                fontWeight: 500
              }}>
                Explore personal loan products from finance companies
              </p>
            </div>

            <button
              id="btn-view-finance-offers"
              data-testid="btn-view-finance-offers"
              onClick={() => handleSelectProvider('finance')}
              style={{
                width: '100%',
                marginTop: '10px',
                padding: '12px 20px',
                borderRadius: '12px',
                background: C.primary,
                color: '#FFFFFF',
                border: 'none',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: isDark ? 'none' : `0 4px 14px ${C.primary}40`,
                visibility: 'visible',
                opacity: 1
              }}
            >
              View Finance Offers →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STAGE 3 & STAGE 4: OFFERS LISTING (BANK OFFERS OR FINANCE OFFERS)
  // ─────────────────────────────────────────────────────────────────────────────
  const isFinance = providerType === 'finance';
  const providerLabel = isFinance ? 'Finance' : 'Bank';
  const pageTitle = isFinance ? 'Finance Personal Loan' : 'Bank Personal Loan';
  const pageSubtitle = isFinance 
    ? 'Choose a finance company to explore their personal loan offers' 
    : 'Choose a bank to explore their personal loan offers';

  const quickChips = isFinance ? QUICK_FINANCE_CHIPS : activeBankOptions;

  return (
    <div 
      id="personal-loan-stage-3"
      data-testid="personal-loan-stage-3"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? '14px' : '20px',
        paddingBottom: isMobile ? '40px' : '60px',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* Breadcrumb Navigation Header */}
      <div style={{
        background: C.card,
        borderRadius: isMobile ? '14px' : '18px',
        padding: isMobile ? '12px 14px' : '16px 22px',
        border: `1.5px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: isMobile ? '12.5px' : '13.5px',
          fontWeight: 600,
          flexWrap: 'wrap'
        }}>
          <button
            onClick={handleBackToLanding}
            style={{
              background: 'none',
              border: 'none',
              color: C.textMid,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: 0,
              fontWeight: 700,
              fontSize: 'inherit'
            }}
          >
            <MdArrowBack size={16} /> Personal Loan
          </button>
          <span style={{ color: C.textMid }}>›</span>
          <button
            onClick={handleBackToProviderSelection}
            style={{
              background: 'none',
              border: 'none',
              color: C.textMid,
              cursor: 'pointer',
              padding: 0,
              fontWeight: 700,
              fontSize: 'inherit'
            }}
          >
            {eligibilityLabel}
          </button>
          <span style={{ color: C.textMid }}>›</span>
          <span style={{ color: C.primary, fontWeight: 800 }}>
            {providerLabel}
          </span>
        </div>

        {/* Back step button */}
        <button
          onClick={handleBackToProviderSelection}
          style={{
            background: isDark ? C.bgSecondary : '#F1F5F9',
            border: `1px solid ${C.border}`,
            borderRadius: '8px',
            padding: '6px 12px',
            color: C.text,
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <MdArrowBack size={14} /> Back to Provider
        </button>
      </div>

      {/* Title & Banner Header Card */}
      <div style={{
        background: C.card,
        borderRadius: isMobile ? '16px' : '20px',
        padding: isMobile ? '16px 18px' : '20px 24px',
        border: `1.5px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: '14px'
      }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: '14px',
          background: `${C.primary}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: C.primary,
          flexShrink: 0
        }}>
          {isFinance ? <MdApartment size={28} /> : <MdAccountBalance size={28} />}
        </div>
        <div>
          <h1 style={{
            fontSize: isMobile ? '20px' : '24px',
            fontWeight: 900,
            color: C.text,
            margin: '0 0 4px'
          }}>
            {pageTitle}
          </h1>
          <p style={{
            fontSize: isMobile ? '12.5px' : '13.5px',
            color: C.textMid,
            margin: 0,
            fontWeight: 500
          }}>
            {pageSubtitle}
          </p>
        </div>
      </div>

      {/* Quick Chips Row (All Banks / Companies + individual company chips) */}
      <div style={{
        background: C.card,
        borderRadius: '16px',
        padding: '12px 16px',
        border: `1.5px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none'
      }}>
        {quickChips.map((chip) => {
          const isAll = chip === defaultBankValue || chip === 'All Banks' || chip === 'All Finance Companies';
          const isSelected = selectedBank === chip || (isAll && (selectedBank === defaultBankValue || selectedBank === 'All Banks'));
          return (
            <button
              key={chip}
              onClick={() => handleSelectBankChip(chip)}
              style={{
                background: isSelected 
                  ? C.primary 
                  : (isDark ? C.bgSecondary : '#F8FAFC'),
                color: isSelected ? '#FFFFFF' : C.text,
                border: isSelected 
                  ? `1.5px solid ${C.primary}` 
                  : `1.5px solid ${C.border}`,
                borderRadius: '20px',
                padding: '6px 14px',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              {isAll ? (
                isFinance ? '🏢 All Finance Companies' : '🏦 All Banks'
              ) : (
                chip
              )}
            </button>
          );
        })}
      </div>

      {/* Embedded Partner Products listing with full filtering & application actions */}
      <main style={{ width: '100%' }}>
        <PartnerProducts
          key={`${providerType}-${eligibilityType}`}
          initialCategory="personal_loan"
          initialSubCategory="personal-loan"
          providerType={providerType}
          eligibilityType={eligibilityType}
          customBankOptions={activeBankOptions}
          bankLabel={isFinance ? 'Choose Finance Company' : 'Choose Bank'}
          allBanksLabel={defaultBankValue}
          emptyStateMessage={isFinance 
            ? 'No Personal Loan offers available for this company yet.' 
            : 'No Personal Loan offers available for this bank yet.'}
          emptyStateSubtitle={isFinance
            ? 'Try selecting All Finance Companies or checking other options.'
            : 'Try selecting All Banks or checking other options.'}
          hideCategoryFilter={true}
          allowEmptyFilterSelection={true}
          initialBank={selectedBank}
          onBankChange={(newBank) => {
            if (newBank && newBank !== selectedBank) {
              setSearchParams({
                type: eligibilityType,
                provider: providerType,
                bank: newBank
              });
            }
          }}
        />
      </main>
    </div>
  );
}
