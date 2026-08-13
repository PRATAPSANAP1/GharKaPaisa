import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { MdArrowBack } from 'react-icons/md';
import PartnerProducts from '../products/PartnerProducts';

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
    kotak: 'Kotak Mahindra Bank',
    dcb: 'DCB Bank',
    rbl: 'RBL Bank',
    equitas: 'Equitas Small Finance Bank',
    sbm: 'SBM Bank'
  };
  return nameMap[slug.toLowerCase()] || slug.toUpperCase().replace(/-/g, ' ');
};

export default function PartnerEntityDetail() {
  const { bankSlug, loanTypeSlug, insuranceTypeSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { C, isDark } = useTheme();
  const { t } = useTranslation();

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Determine category, targetBank/type, back path, and title based on URL path
  let targetCategory = 'credit_card';
  let entitySlug = bankSlug || 'hdfc';
  let backPath = '/partner/credit-cards';
  let backLabel = 'All Banks';
  let badgeLabel = 'Bank Credit Cards';
  let pageTitle = `🏦 ${getBankName(entitySlug)} Cards`;

  if (location.pathname.includes('/partner/loans')) {
    targetCategory = 'loans';
    entitySlug = loanTypeSlug || bankSlug || 'personal-loan';
    backPath = '/partner/loans';
    backLabel = 'All Loans';
    badgeLabel = 'Loan Category Catalog';
    const formattedName = entitySlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    pageTitle = `🏦 ${formattedName} Offers`;
  } else if (location.pathname.includes('/partner/insurance')) {
    targetCategory = 'insurance';
    entitySlug = insuranceTypeSlug || bankSlug || 'health-insurance';
    backPath = '/partner/insurance';
    backLabel = 'All Insurance';
    badgeLabel = 'Insurance Policy Catalog';
    const formattedName = entitySlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    pageTitle = `🛡️ ${formattedName} Plans`;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '20px', paddingBottom: isMobile ? '40px' : '60px' }}>
      
      {/* ── TOP BREADCRUMB / BANK HEADER ── */}
      <div style={{
        background: C.card,
        borderRadius: isMobile ? '14px' : '20px',
        padding: isMobile ? '12px 16px' : '18px 24px',
        border: `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: isDark ? 'none' : '0 4px 18px rgba(15,23,42,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '14px', width: '100%', justifyContent: 'space-between' }}>
          <button
            onClick={() => navigate(backPath)}
            style={{
              background: isDark ? C.bgSecondary : '#F1F5F9',
              border: `1px solid ${C.border}`,
              borderRadius: '10px',
              padding: isMobile ? '6px 12px' : '8px 16px',
              color: C.text,
              fontSize: isMobile ? '12px' : '13.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0
            }}
          >
            <MdArrowBack size={isMobile ? 16 : 18} />
            {backLabel}
          </button>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: isMobile ? '9.5px' : '11px', fontWeight: 800, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              {badgeLabel}
            </span>
            <h2 style={{ fontSize: isMobile ? '17px' : '22px', fontWeight: 900, color: C.text, margin: '2px 0 0' }}>
              {pageTitle}
            </h2>
          </div>
        </div>
      </div>

      {/* ── WORKSPACE CONTENT AREA: FULL PARTNER PRODUCTS CATALOG WITH PRE-APPLIED BANK FILTER ── */}
      <main style={{ width: '100%' }}>
        <PartnerProducts 
          initialBank={entitySlug} 
          initialCategory={targetCategory} 
        />
      </main>

    </div>
  );
}
