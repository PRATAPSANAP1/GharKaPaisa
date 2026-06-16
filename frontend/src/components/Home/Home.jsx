import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../Partner/ThemeContext";
import { useSearchStore } from "../../store/searchStore";
import {
  FaMobileAlt, FaBolt, FaMoneyBillWave, FaChevronRight, FaChevronLeft,
  FaRegCreditCard, FaLaptopHouse, FaUniversity, FaBuilding, FaCar,
  FaGraduationCap, FaHeartbeat, FaShieldAlt, FaUmbrella, FaFacebook,
  FaTwitter, FaInstagram, FaEnvelope, FaPhoneAlt, FaArrowLeft, FaHome,
  FaChartLine, FaFileInvoiceDollar, FaCalculator, FaUsers, FaMoneyCheckAlt,
  FaStar, FaGooglePlay, FaApple, FaLinkedin, FaYoutube, FaFileAlt,
  FaBuilding as FaBuildingAlt, FaReceipt, FaBriefcase, FaHandsHelping, FaIdCard
} from "react-icons/fa";

// Import modular data lists
import { bankCardsDetails, ltfCards } from "./CreditCards";
import { HDFCCardsPage } from "./CreditCards/HDFCCardsPage";
import { loansData } from "./Loans";
import { insuranceData } from "./Insurance";
import { servicesData } from "./Services";
import { banksList, trustBanks } from "./banks/banksData";
import { moneyTransfer } from "./MoneyTransfer";
import { attractiveCategories } from "./AttractiveSections";
import { popularCards } from "./PopularCards";

// Import banner images
import ltfDesktop from "./banner/Lifetime Free Credit Cards.png";
import ltfMobile from "./banner/Lifetime Free Credit Cards-m.png";
import personalDesktop from "./banner/Personal Loans.png";
import personalMobile from "./banner/Personal Loans-m.png";
import businessDesktop from "./banner/Business Loans.png";
import businessMobile from "./banner/Business Loans-m.png";
import insuranceDesktop from "./banner/Insurance Plans.png";
import insuranceMobile from "./banner/Insurance Plans-m.png";
import emiDesktop from "./banner/EMI Cards.png";
import emiMobile from "./banner/EMI Cards-m.png";
import hdfcDesktop from "./banner/HDFC pixel.png";
import hdfcMobile from "./banner/hdfc pixel-m.png";
import offerBanner from "./banner/offerbanner.png";

// Import attractive section card images
import ltfImg from "./AttractiveSections/lifetimefree.png";
import cibilImg from "./AttractiveSections/cibilbased.png";
import hdfcCcLoanImg from "./AttractiveSections/loan on credit card.png";
import smartEmiImg from "./AttractiveSections/smart emi.png";
import securedImg from "./AttractiveSections/fd backed.png";
import upiImg from "./AttractiveSections/upi.png";

// Import money transfer images
import toMobileImg from "./MoneyTransfer/tomobile.png";
import rechargeImg from "./MoneyTransfer/recharge.png";
import electricityImg from "./MoneyTransfer/electricitybill.png";
import loanRepayImg from "./MoneyTransfer/loan.png";


// ── Responsive Hook ──────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return isMobile;
}

// ── Responsive Grid Component ──────────────────────────────────────
function ResponsiveGrid({ items, C, onSeeMore, onItemClick }) {
  const isMobile = useIsMobile();
  const showSeeMore = isMobile && items.length > 4;
  const visibleItems = showSeeMore ? items.slice(0, 3) : items;
  const { t } = useTranslation();

  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(4, 1fr)" : "repeat(auto-fill, minmax(140px, 1fr))", gap: isMobile ? "6px" : "12px", marginTop: "12px" }}>
      {visibleItems.map((item, idx) => (
        <div key={idx} style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          background: C.bgSecondary, padding: isMobile ? "8px 4px" : "12px 8px", borderRadius: isMobile ? "10px" : "14px",
          border: `1px solid ${C.border}`, textAlign: "center", gap: isMobile ? "6px" : "10px",
          cursor: "pointer", transition: "all 0.2s",
          height: item.image ? (isMobile ? "55px" : "75px") : "auto"
        }}
          onClick={() => onItemClick && onItemClick(item)}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = C.teal}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = C.border}
        >
          {item.image ? (
            <img 
              src={item.image} 
              alt={t('banks.' + item.id, item.label)} 
              style={{ 
                maxWidth: "85%", 
                maxHeight: "85%", 
                objectFit: "contain",
                filter: C.text === '#fff' ? 'brightness(1.2)' : 'none'
              }} 
            />
          ) : (
            <>
              {item.icon && <div style={{ color: C.teal, fontSize: isMobile ? "18px" : "22px" }}>{item.icon}</div>}
              <div style={{ fontSize: isMobile ? "10px" : "13px", fontWeight: 700, color: C.text, lineHeight: 1.2 }}>{t('banks.' + item.id, item.label)}</div>
            </>
          )}
        </div>
      ))}

      {showSeeMore && (
        <div
          onClick={onSeeMore}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            background: `${C.teal}10`, padding: isMobile ? "8px 4px" : "12px 8px", borderRadius: isMobile ? "10px" : "14px",
            border: `1px dashed ${C.teal}`, textAlign: "center", gap: isMobile ? "6px" : "10px",
            cursor: "pointer", color: C.teal
          }}
        >
          <div style={{ fontSize: isMobile ? "18px" : "22px" }}><FaChevronRight /></div>
          <div style={{ fontSize: isMobile ? "10px" : "13px", fontWeight: 800 }}>{t('home.seeMore', 'See More')}</div>
        </div>
      )}
    </div>
  );
}


// ── Section Component ──────────────────────────────────────────────
function Section({ title, viewAllLabel, onViewAll, C, children }) {
  const isMobile = useIsMobile();
  return (
    <div style={{ marginBottom: isMobile ? "20px" : "24px" }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: "16px"
      }}>
        <h2 style={{ fontSize: "20px", fontWeight: 800, color: C.text, margin: 0, letterSpacing: "-0.5px" }}>{title}</h2>
        {onViewAll && (
          <span
            onClick={onViewAll}
            style={{ fontSize: "13px", fontWeight: 800, color: C.teal, cursor: "pointer" }}
          >
            {viewAllLabel || "View All"} →
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

// ── CategoryPage Component ──────────────────────────────────────────
function CategoryPage({ category, onBack, C, onItemClick, breadcrumbs }) {
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  const renderBreadcrumbs = () => {
    if (!breadcrumbs) return null;
    return (
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 600 }}>
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <span style={{ color: C.textLight }}>/</span>}
            {crumb.action ? (
              <span 
                onClick={crumb.action} 
                style={{ color: C.teal, cursor: "pointer" }}
                onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
                onMouseLeave={(e) => e.target.style.textDecoration = "none"}
              >
                {crumb.label}
              </span>
            ) : (
              <span style={{ color: C.textLight }}>{crumb.label}</span>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const BackRow = () => (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
      <div onClick={onBack} style={{ cursor: "pointer", color: C.text }}><FaArrowLeft size={16} /></div>
      {renderBreadcrumbs()}
    </div>
  );

  if (category.id === "credit-cards") {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Inter', sans-serif", paddingBottom: "80px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 16px" }}>
          <BackRow />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: C.text, margin: 0 }}>{t('home.selectPartnerBank', 'Select Partner Bank')}</h2>
            <button
              onClick={() => onItemClick && onItemClick({ id: "ltf-detail-page-trigger" })}
              style={{
                background: C.teal, color: "#fff", border: "none", padding: "8px 16px",
                borderRadius: "10px", fontSize: "13px", fontWeight: 800, cursor: "pointer",
                boxShadow: `0 4px 12px ${C.teal}30`, transition: "opacity 0.2s"
              }}
              onMouseEnter={(e) => e.target.style.opacity = 0.9}
              onMouseLeave={(e) => e.target.style.opacity = 1}
            >
              {t('home.ltfCardsTitle', 'Lifetime Free Credit Cards (LTF)')}
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(auto-fill, minmax(130px, 1fr))", gap: "10px" }}>
            {category.items.map((item, idx) => (
              <div key={idx}
                onClick={() => onItemClick && onItemClick(item)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  background: C.bgSecondary, padding: "16px 10px", borderRadius: "14px",
                  border: `1px solid ${C.border}`, textAlign: "center", gap: "10px", cursor: "pointer",
                  transition: "all 0.2s",
                  height: item.image ? (isMobile ? "55px" : "75px") : "auto"
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.teal}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
              >
                {item.image ? (
                  <img 
                    src={item.image} 
                    alt={t('banks.' + item.id, item.label)} 
                    style={{ 
                      maxWidth: "85%", 
                      maxHeight: "85%", 
                      objectFit: "contain",
                      filter: C.text === '#fff' ? 'brightness(1.2)' : 'none'
                    }} 
                  />
                ) : (
                  <>
                    {item.icon && <div style={{ color: C.teal, fontSize: "24px" }}>{item.icon}</div>}
                    <div style={{ fontSize: "13px", fontWeight: 700, color: C.text, lineHeight: 1.2 }}>{t('banks.' + item.id, item.label)}</div>
                  </>
                )}
              </div>
            ))}

          </div>
        </div>
      </div>
    );
  }

  if (category.type === "hierarchy") {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Inter', sans-serif", paddingBottom: "80px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px 16px" }}>
          <BackRow />
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {category.items.map((sec, sIdx) => (
              <div key={sIdx} style={{ background: C.card, padding: "20px", borderRadius: "18px", border: `1px solid ${C.border}`, boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
                <h3 style={{ margin: "0 0 14px 0", fontSize: "16px", fontWeight: 800, color: C.teal }}>{sec.section}</h3>
                {sec.subcategories && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {sec.subcategories.map((sub, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", background: C.bgSecondary, padding: "10px 14px", borderRadius: "10px", border: `1px solid ${C.border}` }}>
                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: C.teal }} />
                        <span style={{ fontSize: "13px", fontWeight: 600, color: C.text }}>{sub}</span>
                      </div>
                    ))}
                  </div>
                )}
                {sec.cards && (
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "10px", marginTop: sec.subcategories ? "14px" : "0" }}>
                    {sec.cards.map((card, cIdx) => (
                      <div key={cIdx} style={{ display: "flex", flexDirection: "column", gap: "4px", background: C.bgSecondary, padding: "14px", borderRadius: "12px", border: `1px solid ${C.border}` }}>
                        <span style={{ fontSize: "14px", fontWeight: 800, color: C.text }}>{card.name}</span>
                        <span style={{ fontSize: "12px", color: C.textLight, lineHeight: 1.4 }}>{card.desc}</span>
                        <button style={{ alignSelf: "flex-start", marginTop: "8px", background: C.teal, color: "#fff", border: "none", padding: "6px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: 800, cursor: "pointer", transition: "opacity 0.2s" }} onMouseEnter={(e) => e.target.style.opacity = 0.9} onMouseLeave={(e) => e.target.style.opacity = 1}>
                          {t('popularCardsList.applyNow', 'Apply Now')}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (category.id === "bank-hdfc") {
    return <HDFCCardsPage onBack={onBack} C={C} isMobile={isMobile} breadcrumbs={breadcrumbs} />;
  }

  if (category.type === "bank-detail") {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Inter', sans-serif", paddingBottom: "80px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px 16px" }}>
          <BackRow />
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {category.sections.map((sec, sIdx) => (
              <div key={sIdx} style={{ background: C.card, padding: "20px", borderRadius: "18px", border: `1px solid ${C.border}`, boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
                <h3 style={{ margin: "0 0 14px 0", fontSize: "16px", fontWeight: 800, color: C.teal }}>{sec.title}</h3>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "10px" }}>
                  {sec.cards.map((card, cIdx) => (
                    <div key={cIdx} style={{ display: "flex", flexDirection: "column", gap: "4px", background: C.bgSecondary, padding: "14px", borderRadius: "12px", border: `1px solid ${C.border}` }}>
                      <span style={{ fontSize: "14px", fontWeight: 800, color: C.text }}>{card.name}</span>
                      <span style={{ fontSize: "12px", color: C.textLight, lineHeight: 1.4 }}>{card.desc}</span>
                      <button style={{ alignSelf: "flex-start", marginTop: "8px", background: C.teal, color: "#fff", border: "none", padding: "6px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: 800, cursor: "pointer", transition: "opacity 0.2s" }} onMouseEnter={(e) => e.target.style.opacity = 0.9} onMouseLeave={(e) => e.target.style.opacity = 1}>
                        {t('popularCardsList.applyNow', 'Apply Now')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Inter', sans-serif", paddingBottom: "80px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 16px" }}>
        <BackRow />
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(auto-fill, minmax(140px, 1fr))", gap: "12px" }}>
          {category.items && category.items.length > 0 ? category.items.map((item, idx) => (
            <div key={idx}
              onClick={() => onItemClick && onItemClick(item)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start",
                background: C.bgSecondary, padding: isMobile ? "12px 8px" : "16px 12px", borderRadius: "14px",
                border: `1px solid ${C.border}`, textAlign: "center", gap: "10px", cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.teal}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
            >
              {item.icon && <div style={{ color: C.teal, fontSize: isMobile ? "20px" : "24px" }}>{item.icon}</div>}
              <div style={{ fontSize: isMobile ? "12px" : "14px", fontWeight: 700, color: C.text, lineHeight: 1.2 }}>
                {item.label === "Co-Brand" ? t('home.breadcrumbs.cobrand', 'Co-Brand') : 
                 item.label === "FD Based Cards" ? t('home.breadcrumbs.fdBasedCards', 'FD Based Cards') : 
                 t(category.id + 'List.' + item.label.toLowerCase().replace(/[^a-z0-9]/g, ''), item.label)}
              </div>
            </div>
          )) : (
            <div style={{ color: C.textLight, gridColumn: "1 / -1", textAlign: "center", padding: "40px" }}>{t('home.noItems', 'No items available in this category.')}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Mobile Bottom Navigation ────────────────────────────────────────
function MobileBottomNav({ C, onNavigate, activeTab }) {
  const { t } = useTranslation();
  const navItems = [
    { id: "home", label: t('home.dashboard', 'Dashboard'), icon: <FaHome /> },
    { id: "credit-cards", label: t('home.creditCard', 'Credit Card'), icon: <FaRegCreditCard /> },
    { id: "loans", label: t('home.loan', 'Loan'), icon: <FaMoneyBillWave /> },
    { id: "insurance", label: t('home.insurance', 'Insurance'), icon: <FaShieldAlt /> },
    { id: "investment", label: t('home.investment', 'Investment'), icon: <FaChartLine /> },
    { id: "services", label: t('home.services', 'Services'), icon: <FaFileInvoiceDollar /> }
  ];

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: C.card, borderTop: `1px solid ${C.border}`,
      display: "flex", justifyContent: "flex-start", padding: "10px 16px", gap: "24px",
      overflowX: "auto", whiteSpace: "nowrap", WebkitOverflowScrolling: "touch",
      zIndex: 100, boxShadow: "0 -4px 12px rgba(0,0,0,0.05)"
    }}>
      {navItems.map(item => (
        <div key={item.id} onClick={() => onNavigate(item.id)} style={{ flexShrink: 0, minWidth: "50px", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", color: activeTab === item.id ? C.teal : C.textLight, cursor: "pointer" }}>
          <div style={{ fontSize: "20px" }}>{item.icon}</div>
          <div style={{ fontSize: "10px", fontWeight: 700, whiteSpace: "nowrap" }}>{item.label}</div>
        </div>
      ))}
    </div>
  );
}



export default function Home({ onNavigate }) {
  const { C } = useTheme();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [bannerIndex, setBannerIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [isTickerPaused, setIsTickerPaused] = useState(false);

  const searchItem = useSearchStore(state => state.searchItem);
  const setSearchItem = useSearchStore(state => state.setSearchItem);

  const attractiveImages = {
    "ltf-cards": ltfImg,
    "cibil-loans": cibilImg,
    "hdfc-cc-loan": hdfcCcLoanImg,
    "smart-emi": smartEmiImg,
    "secured-cards": securedImg,
    "upi-cards": upiImg
  };

  const moneyTransferImages = {
    "to mobile": toMobileImg,
    "recharge": rechargeImg,
    "electricity": electricityImg,
    "loan repay": loanRepayImg
  };

  // Auto rotate banner slides (height 320px)
  const bannerSlides = [
    { 
      title: t('home.banners.slideOffer.title', 'Special Offer'), 
      subtitle: t('home.banners.slideOffer.subtitle', 'Exclusive credit card and loan deals'), 
      btnText: t('home.banners.slideOffer.btn', 'View Offers'),
      bgImage: offerBanner,
      action: () => setActiveCategory({ id: "credit-cards", title: "Credit Cards", titleKey: "home.breadcrumbs.creditCards", items: banksList })
    },
    { 
      title: t('home.banners.slide0.title', 'Lifetime Free Credit Cards'), 
      subtitle: t('home.banners.slide0.subtitle', 'Zero Joining Fee • Zero Annual Fee'), 
      btnText: t('home.banners.slide0.btn', 'Explore Now'),
      bgImage: isMobile ? ltfMobile : ltfDesktop,
      action: () => setActiveCategory({ id: "ltf-detail-page", title: "Lifetime Free Credit Cards (LTF)", titleKey: "home.ltfCardsTitle", parentId: "credit-cards", items: ltfCards.map(c => ({ id: c.name.toLowerCase().replace(/\s+/g, "-"), label: c.name, icon: <FaRegCreditCard /> })) })
    },
    { 
      title: t('home.banners.slide1.title', 'Personal Loans'), 
      subtitle: t('home.banners.slide1.subtitle', 'Low Interest Rates • Quick Disbursal'), 
      btnText: t('home.banners.slide1.btn', 'Apply Now'),
      bgImage: isMobile ? personalMobile : personalDesktop,
      action: () => setActiveCategory({ id: "loans", title: "Loans", titleKey: "sections.loans", items: loansData })
    },
    { 
      title: t('home.banners.slide2.title', 'Business Loans'), 
      subtitle: t('home.banners.slide2.subtitle', 'Flexible repayment options for growing businesses'), 
      btnText: t('home.banners.slide2.btn', 'Check Eligibility'),
      bgImage: isMobile ? businessMobile : businessDesktop,
      action: () => setActiveCategory({ id: "loans", title: "Loans", titleKey: "sections.loans", items: loansData })
    },
    { 
      title: t('home.banners.slide3.title', 'Insurance Plans'), 
      subtitle: t('home.banners.slide3.subtitle', 'Comprehensive health, life and general insurance cover'), 
      btnText: t('home.banners.slide3.btn', 'Get Quotes'),
      bgImage: isMobile ? insuranceMobile : insuranceDesktop,
      action: () => setActiveCategory({ id: "insurance", title: "Insurance", titleKey: "sections.insurance", items: insuranceData })
    },
    { 
      title: t('home.banners.slide4.title', 'EMI Cards'), 
      subtitle: t('home.banners.slide4.subtitle', 'Convert purchases to no-cost EMIs instantly'), 
      btnText: t('home.banners.slide4.btn', 'Get EMI Card'),
      bgImage: isMobile ? emiMobile : emiDesktop,
      action: () => handleAttractiveCategoryClick(attractiveCategories.find(c => c.id === "smart-emi"))
    },
    { 
      title: t('home.banners.slide5.title', 'HDFC Pixel Credit Cards'), 
      subtitle: t('home.banners.slide5.subtitle', 'Customizable rewards on dining, shopping & entertainment'), 
      btnText: t('home.banners.slide5.btn', 'Explore Pixel Cards'),
      bgImage: isMobile ? hdfcMobile : hdfcDesktop,
      action: () => setActiveCategory({
        id: "bank-hdfc",
        title: bankCardsDetails.hdfc.title,
        titleKey: "hdfc.title",
        parentId: "credit-cards",
        type: "bank-detail",
        sections: bankCardsDetails.hdfc.sections
      })
    }
  ];


  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % bannerSlides.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isPaused, bannerSlides.length]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeCategory]);

  // Handle Search events from Navbar
  useEffect(() => {
    if (searchItem) {
      if (searchItem.type === "category") {
        if (searchItem.target.id === "credit-cards") {
          setActiveCategory({ id: "credit-cards", title: "Credit Cards", titleKey: "home.breadcrumbs.creditCards", items: banksList });
        } else if (searchItem.target.id === "loans") {
          setActiveCategory({ id: "loans", title: "Loans", titleKey: "sections.loans", items: loansData });
        } else if (searchItem.target.id === "insurance") {
          setActiveCategory({ id: "insurance", title: "Insurance", titleKey: "sections.insurance", items: insuranceData });
        } else if (searchItem.target.id === "services") {
          setActiveCategory({ id: "services", title: "Services", titleKey: "sections.businessServices", items: servicesData });
        } else if (searchItem.target.id === "ltf-detail-page") {
          setActiveCategory({ id: "ltf-detail-page", title: "Lifetime Free Credit Cards (LTF)", titleKey: "home.ltfCardsTitle", parentId: "credit-cards", items: ltfCards.map(c => ({ id: c.name.toLowerCase().replace(/\s+/g, "-"), label: c.name, icon: <FaRegCreditCard /> })) });
        } else if (searchItem.target.id.startsWith("bank-")) {
          const bankId = searchItem.target.id.split("-")[1];
          const bankItem = banksList.find(b => b.id === bankId);
          if (bankItem) handleItemClick(bankItem);
        } else {
          const attractiveCat = attractiveCategories.find(c => c.id === searchItem.target.id);
          if (attractiveCat) handleAttractiveCategoryClick(attractiveCat);
        }
      } else if (searchItem.type === "loan") {
        setActiveCategory({ id: "loans", title: "Loans", titleKey: "sections.loans", items: loansData });
      } else if (searchItem.type === "insurance") {
        setActiveCategory({ id: "insurance", title: "Insurance", titleKey: "sections.insurance", items: insuranceData });
      } else if (searchItem.type === "service") {
        setActiveCategory({ id: "services", title: "Services", titleKey: "sections.businessServices", items: servicesData });
      }
      setSearchItem(null); // Reset store
    }
  }, [searchItem]);

  const handleBannerClick = () => {
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 5000);
  };

  const getBreadcrumbs = (cat) => {
    const crumbs = [{ label: t('home.breadcrumbs.home', 'Home'), action: () => setActiveCategory(null) }];
    
    if (!cat) return crumbs;

    if (cat.id.startsWith("cobrand-") || cat.id.startsWith("fd-")) {
      const bankId = cat.id.split("-")[1];
      const bankName = banksList.find(b => b.id === bankId)?.label || "Bank";
      crumbs.push({ label: t('home.breadcrumbs.creditCards', 'Credit Cards'), action: () => setActiveCategory({ id: "credit-cards", title: "Credit Cards", titleKey: "home.breadcrumbs.creditCards", items: banksList }) });
      crumbs.push({ 
        label: t('banks.' + bankId, bankName), 
        action: () => handleItemClick({ id: bankId, label: bankName }) 
      });
      crumbs.push({ label: cat.id.startsWith("cobrand-") ? t('home.breadcrumbs.cobrand', 'Co-Brand') : t('home.breadcrumbs.fdBasedCards', 'FD Based Cards'), action: null });
    } else if (cat.parentId === "credit-cards" || cat.id.startsWith("bank-")) {
      crumbs.push({ label: t('home.breadcrumbs.creditCards', 'Credit Cards'), action: () => setActiveCategory({ id: "credit-cards", title: "Credit Cards", titleKey: "home.breadcrumbs.creditCards", items: banksList }) });
      crumbs.push({ label: t(cat.titleKey || cat.title, cat.title), action: null });
    } else if (cat.id === "credit-cards") {
      crumbs.push({ label: t('home.breadcrumbs.creditCards', 'Credit Cards'), action: null });
    } else if (cat.id === "loans") {
      crumbs.push({ label: t('sections.loans', 'Loans'), action: null });
    } else if (cat.id === "insurance") {
      crumbs.push({ label: t('sections.insurance', 'Insurance'), action: null });
    } else if (cat.id === "services") {
      crumbs.push({ label: t('sections.businessServices', 'Services'), action: null });
    } else {
      crumbs.push({ label: t('home.breadcrumbs.attractiveSections', 'Attractive Sections'), action: () => setActiveCategory(null) });
      crumbs.push({ label: t(cat.titleKey || cat.title, cat.title), action: null });
    }
    
    return crumbs;
  };

  const handleBottomNavClick = (id) => {
    if (id === "home") setActiveCategory(null);
    else if (id === "credit-cards") setActiveCategory({ id: "credit-cards", title: "Credit Cards", titleKey: "home.breadcrumbs.creditCards", items: banksList });
    else if (id === "loans") setActiveCategory({ id: "loans", title: "Loans", titleKey: "sections.loans", items: loansData });
    else if (id === "insurance") setActiveCategory({ id: "insurance", title: "Insurance", titleKey: "sections.insurance", items: insuranceData });
    else if (id === "investment") setActiveCategory({ id: "investment", title: "Investment", titleKey: "home.investment", items: [] });
    else if (id === "services") setActiveCategory({ id: "services", title: "Services", titleKey: "sections.businessServices", items: servicesData });
  };

  const handleItemClick = (item) => {
    if (item.id === "ltf-detail-page-trigger") {
      setActiveCategory({
        id: "ltf-detail-page",
        title: "Lifetime Free Credit Cards (LTF)",
        titleKey: "home.ltfCardsTitle",
        parentId: "credit-cards",
        items: ltfCards.map(card => ({
          id: card.name.toLowerCase().replace(/\s+/g, "-"),
          label: card.name,
          icon: <FaRegCreditCard />
        }))
      });
      return;
    }
    if (activeCategory?.id === "credit-cards" || banksList.find(b => b.id === item.id)) {
      if (bankCardsDetails[item.id]) {
        setActiveCategory({
          id: `bank-${item.id}`,
          title: bankCardsDetails[item.id].title,
          titleKey: `${item.id}.title`,
          parentId: "credit-cards",
          type: "bank-detail",
          sections: bankCardsDetails[item.id].sections
        });
      } else {
        setActiveCategory({
          id: `bank-${item.id}`,
          title: item.label,
          titleKey: `banks.${item.id}`,
          parentId: "credit-cards",
          items: [
            { id: `cobrand-${item.id}`, label: "Co-Brand", icon: <FaLaptopHouse /> },
            { id: `fd-${item.id}`, label: "FD Based Cards", icon: <FaUniversity /> }
          ]
        });
      }
    }
  };

  const handleAttractiveCategoryClick = (cat) => {
    setActiveCategory({
      id: cat.id,
      title: cat.title,
      titleKey: `attractiveCards.${cat.id}`,
      type: "hierarchy",
      items: cat.items
    });
  };

  const handleTrustBankClick = (bankId) => {
    const bankItem = banksList.find(b => b.id === bankId);
    if (bankItem) {
      handleItemClick(bankItem);
    }
  };

  const handleBack = () => {
    if (activeCategory?.parentId === "credit-cards") {
      setActiveCategory({ id: "credit-cards", title: "Credit Cards", titleKey: "home.breadcrumbs.creditCards", items: banksList });
    } else {
      setActiveCategory(null);
    }
  };

  // If a category page is active, render it
  if (activeCategory) {
    return (
      <>
        <CategoryPage category={activeCategory} onBack={handleBack} onItemClick={handleItemClick} C={C} breadcrumbs={getBreadcrumbs(activeCategory)} />
        {isMobile && <MobileBottomNav C={C} onNavigate={handleBottomNavClick} activeTab={activeCategory.id || "home"} />}
      </>
    );
  }



  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Inter', sans-serif", paddingBottom: isMobile ? "60px" : "30px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: isMobile ? "12px 16px" : "20px 16px" }}>

        {/* ── HERO BANNER OVERHAUL ── */}
        <div 
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          style={{ 
            width: "100%", height: isMobile ? "180px" : "320px", 
            borderRadius: "20px", marginBottom: isMobile ? "20px" : "24px", display: "flex", 
            alignItems: "center", justifyContent: "center", overflow: "hidden", 
            position: "relative", boxShadow: `0 8px 32px rgba(0,0,0,0.12)` 
          }}
        >
          {bannerSlides.map((slide, idx) => (
            <div key={idx} 
              onClick={() => slide.action()}
              style={{
                position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
                background: `url(${slide.bgImage}) center/100% 100% no-repeat`,
                opacity: idx === bannerIndex ? 1 : 0,
                pointerEvents: idx === bannerIndex ? "auto" : "none",
                transition: "opacity 0.6s ease-in-out",
                cursor: "pointer"
              }}
            />
          ))}

          {/* Left Arrow */}
          <div 
            onClick={(e) => { e.stopPropagation(); setBannerIndex((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length); setIsPaused(true); setTimeout(() => setIsPaused(false), 5000); }}
            style={{ position: "absolute", left: "16px", zIndex: 10, background: "rgba(255,255,255,0.7)", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", color: "#333", boxShadow: "0 2px 8px rgba(0,0,0,0.2)", cursor: "pointer" }}
          >
            <FaChevronLeft size={14} />
          </div>

          {/* Right Arrow */}
          <div 
            onClick={(e) => { e.stopPropagation(); setBannerIndex((prev) => (prev + 1) % bannerSlides.length); setIsPaused(true); setTimeout(() => setIsPaused(false), 5000); }}
            style={{ position: "absolute", right: "16px", zIndex: 10, background: "rgba(255,255,255,0.7)", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", color: "#333", boxShadow: "0 2px 8px rgba(0,0,0,0.2)", cursor: "pointer" }}
          >
            <FaChevronRight size={14} />
          </div>


          {/* Slider Indicators */}
          <div style={{ position: "absolute", bottom: "16px", display: "flex", gap: "8px", zIndex: 10 }}>
            {bannerSlides.map((_, idx) => (
              <div 
                key={idx} 
                onClick={(e) => { e.stopPropagation(); setBannerIndex(idx); setIsPaused(true); setTimeout(() => setIsPaused(false), 5000); }}
                style={{ 
                  width: idx === bannerIndex ? "24px" : "8px", 
                  height: "8px", borderRadius: "4px", 
                  background: idx === bannerIndex ? "#fff" : "rgba(255,255,255,0.5)", 
                  transition: "all 0.3s ease", cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.3)"
                }} 
              />
            ))}
          </div>
        </div>

        {/* ── SECTION 1: Money Transfer & Payments ── */}
        <Section title={t('sections.moneyTransfer')} C={C}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: isMobile ? "8px" : "16px", marginTop: "12px" }}>
            {moneyTransfer.map((item, idx) => {
              const imgKey = item.label.toLowerCase();
              const img = moneyTransferImages[imgKey] || toMobileImg;
              return (
                <div key={idx} 
                  style={{ 
                    display: "flex", 
                    flexDirection: "row", 
                    alignItems: "center", 
                    gap: "12px", 
                    background: C.bgSecondary, 
                    padding: isMobile ? "10px 12px" : "14px 16px", 
                    borderRadius: "14px", 
                    cursor: "pointer", 
                    border: `1px solid ${C.border}`, 
                    transition: "all 0.2s ease" 
                  }} 
                  onMouseEnter={(e) => !isMobile && (e.currentTarget.style.borderColor = C.teal)} 
                  onMouseLeave={(e) => !isMobile && (e.currentTarget.style.borderColor = C.border)}
                >
                  {/* Left side Image Box */}
                  <div style={{ 
                    width: isMobile ? "36px" : "44px", 
                    height: isMobile ? "36px" : "44px", 
                    borderRadius: "10px", 
                    background: C.bg, 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    flexShrink: 0,
                    padding: "6px",
                    boxSizing: "border-box",
                    border: `1px solid ${C.border}`
                  }}>
                    <img 
                      src={img} 
                      alt={item.label} 
                      style={{ 
                        width: "100%", 
                        height: "100%", 
                        objectFit: "contain",
                        filter: C.text === '#fff' ? 'brightness(1.2)' : 'none'
                      }} 
                    />
                  </div>
                  
                  {/* Right side Text & Arrow */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: isMobile ? "11px" : "13px", fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t('moneyTransfer.' + item.label.toLowerCase().replace(/[^a-z0-9]/g, ''), item.label)}
                    </div>
                    <div style={{ color: C.teal, display: "flex", alignItems: "center", marginLeft: "6px" }}>
                      <FaChevronRight size={isMobile ? 10 : 12} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>


        {/* ── SECTION 2: Attractive Cards/Loans (ticker) ── */}
        <Section title={t('sections.attractiveCards')} C={C}>
          <style>{`
            @keyframes ticker-scroll {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .ticker-wrap {
              display: flex; gap: 16px; width: max-content;
              animation: ticker-scroll 35s linear infinite;
            }
            .ticker-wrap.paused { animation-play-state: paused !important; }
          `}</style>
          <div 
            onMouseEnter={() => setIsTickerPaused(true)}
            onMouseLeave={() => setIsTickerPaused(false)}
            onTouchStart={() => setIsTickerPaused(true)}
            onTouchEnd={() => setIsTickerPaused(false)}
            style={{
              overflow: "hidden", width: "100%", padding: "8px 0", position: "relative", display: "flex",
              maskImage: "linear-gradient(to right, transparent, white 10%, white 90%, transparent)",
              WebkitMaskImage: "linear-gradient(to right, transparent, white 10%, white 90%, transparent)"
            }}
          >
            <div className={`ticker-wrap ${isTickerPaused ? "paused" : ""}`}>
              {[...attractiveCategories, ...attractiveCategories].map((cat, idx) => (
                <div key={`${cat.id}-${idx}`} style={{
                  background: C.bgSecondary,
                  borderRadius: "20px",
                  border: `1px solid ${C.border}`,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  display: "flex",
                  flexDirection: "column",
                  width: isMobile ? "200px" : "280px",
                  flexShrink: 0,
                  overflow: "hidden",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.02)"
                }}
                onClick={() => handleAttractiveCategoryClick(cat)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = C.teal;
                  e.currentTarget.style.boxShadow = `0 8px 20px ${C.teal}15`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = C.border;
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.02)";
                }}
                >
                  {/* Image Header */}
                  <div style={{ width: "100%", height: isMobile ? "90px" : "130px", background: "rgba(0,0,0,0.02)", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", padding: "8px", boxSizing: "border-box" }}>
                    <img 
                      src={attractiveImages[cat.id]} 
                      alt={cat.label} 
                      style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} 
                    />
                  </div>
                  
                  {/* Card Body */}
                  <div style={{ padding: isMobile ? "12px" : "16px", display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between", gap: "8px", boxSizing: "border-box" }}>
                    <h3 style={{ margin: 0, fontSize: isMobile ? "12px" : "14px", fontWeight: 800, color: C.text, lineHeight: 1.3 }}>
                      {t('attractiveCards.' + cat.id, cat.label)}
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: isMobile ? "10px" : "12px", fontWeight: 700, color: C.teal, marginTop: "auto" }}>
                      {t('attractiveCards.explore', 'Explore')} <FaChevronRight size={isMobile ? 8 : 10} />
                    </div>
                  </div>
                </div>
              ))}

            </div>
          </div>
        </Section>

        {/* ── SECTION 3: Popular Credit Cards ── */}
        <Section 
          title={t('sections.popularCards')} 
          viewAllLabel={t('popularCardsList.viewAll', 'View All Cards')} 
          onViewAll={() => setActiveCategory({ id: "credit-cards", title: "Credit Cards", items: banksList })}
          C={C}
        >
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(6, 1fr)", gap: "16px" }}>
            {popularCards.map((card, idx) => (
              <div key={idx} style={{
                background: C.bgSecondary, borderRadius: "18px", border: `1px solid ${C.border}`,
                padding: "12px", display: "flex", flexDirection: "column", gap: "12px",
                transition: "all 0.2s ease", cursor: "pointer"
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = C.teal}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = C.border}
              >
                {/* Visual Card Card */}
                <div style={{
                  height: "100px",
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                  background: C.bgSecondary,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <img 
                    src={card.image} 
                    alt={card.name} 
                    style={{ 
                      width: "100%", 
                      height: "100%", 
                      objectFit: "contain",
                      transition: "transform 0.3s"
                    }} 
                    onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
                    onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                  />
                </div>

                {/* Details */}
                <div>
                  <h3 style={{ margin: "0 0 4px 0", fontSize: "13px", fontWeight: 800, color: C.text, lineHeight: 1.2 }}>{card.name}</h3>
                  <p style={{ margin: "0 0 10px 0", fontSize: "10px", color: C.textLight, lineHeight: 1.3 }}>{t('popularCardsList.' + card.name.toLowerCase().replace(/[^a-z0-9]/g, ''), card.benefit)}</p>
                  <button 
                    onClick={() => setActiveCategory({ id: "credit-cards", title: "Credit Cards", items: banksList })}
                    style={{
                      width: "100%", background: `${C.teal}15`, color: C.teal, border: `1px solid ${C.teal}`,
                      padding: "6px 0", borderRadius: "8px", fontSize: "11px", fontWeight: 800, cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => { e.target.style.background = C.teal; e.target.style.color = "#fff"; }}
                    onMouseLeave={(e) => { e.target.style.background = `${C.teal}15`; e.target.style.color = C.teal; }}
                  >
                    {t('popularCardsList.applyNow', 'Apply Now')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── SECTION 4: Popular Credit Card Banks ── */}
        <Section title={t('sections.popularBanks')} C={C}>
          <ResponsiveGrid C={C} items={banksList} onSeeMore={() => setActiveCategory({ id: "credit-cards", title: "Credit Cards", items: banksList })} onItemClick={handleItemClick} />
        </Section>

        {/* ── SECTION 5: Loans ── */}
        <Section title={t('sections.loans')} C={C}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(6, 1fr)", gap: "10px" }}>
            {loansData.slice(0, 6).map((item, idx) => (
              <div key={idx}
                onClick={() => handleBottomNavClick("loans")}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  background: C.bgSecondary, padding: "16px 8px", borderRadius: "12px",
                  border: `1px solid ${C.border}`, textAlign: "center", gap: "8px", cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.teal}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
              >
                <div style={{ color: C.teal, fontSize: "22px" }}>{item.icon}</div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: C.text, lineHeight: 1.2 }}>{t('loansList.' + item.label.toLowerCase().replace(/[^a-z0-9]/g, ''), item.label)}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── SECTION 6: Insurance ── */}
        <Section title={t('sections.insurance')} C={C}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: "10px" }}>
            {insuranceData.map((item, idx) => (
              <div key={idx}
                onClick={() => handleBottomNavClick("insurance")}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  background: C.bgSecondary, padding: "16px 8px", borderRadius: "12px",
                  border: `1px solid ${C.border}`, textAlign: "center", gap: "8px", cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.teal}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
              >
                <div style={{ color: C.teal, fontSize: "22px" }}>{item.icon}</div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: C.text, lineHeight: 1.2 }}>{t('insuranceList.' + item.label.toLowerCase().replace(/[^a-z0-9]/g, ''), item.label)}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── SECTION 7: Business Services ── */}
        <Section title={t('sections.businessServices')} C={C}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(4, 1fr)" : "repeat(8, 1fr)", gap: "10px" }}>
            {servicesData.map((item, idx) => (
              <div key={idx}
                onClick={() => handleBottomNavClick("services")}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  background: C.bgSecondary, padding: "14px 6px", borderRadius: "12px",
                  border: `1px solid ${C.border}`, textAlign: "center", gap: "6px", cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.teal}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
              >
                <div style={{ color: C.teal, fontSize: "20px" }}>{item.icon}</div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: C.text, lineHeight: 1.2 }}>{t('servicesList.' + item.label.toLowerCase().replace(/[^a-z0-9]/g, ''), item.label)}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── SECTION 8: Partner Banks (Logo strip) ── */}
        <Section title={t('sections.partnerBanks')} C={C}>
          <style>{`
            @keyframes bank-ticker-scroll {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .bank-ticker-wrap {
              display: flex; gap: 16px; width: max-content;
              animation: bank-ticker-scroll 25s linear infinite;
            }
          `}</style>
          <div style={{
            overflow: "hidden", width: "100%", padding: "12px 0", position: "relative", display: "flex",
            maskImage: "linear-gradient(to right, transparent, white 10%, white 90%, transparent)",
            WebkitMaskImage: "linear-gradient(to right, transparent, white 10%, white 90%, transparent)"
          }}>
            <div className="bank-ticker-wrap">
              {[...trustBanks, ...trustBanks].map((bank, idx) => (
                <div key={`${bank.id}-${idx}`} 
                  onClick={() => handleTrustBankClick(bank.id)}
                  style={{
                    background: C.bgSecondary, border: `1px solid ${C.border}`,
                    borderRadius: "12px", padding: "8px 16px", display: "flex",
                    alignItems: "center", justifyContent: "center", height: "45px",
                    width: "120px", cursor: "pointer", transition: "all 0.2s ease",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = C.teal}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = C.border}
                >
                  <img 
                    src={bank.logo} 
                    alt={bank.name} 
                    style={{ 
                      maxWidth: "100%", 
                      maxHeight: "100%", 
                      objectFit: "contain",
                      filter: C.text === '#fff' ? 'brightness(1.2)' : 'none'
                    }} 
                  />
                </div>
              ))}
            </div>
          </div>
        </Section>


        {/* ── MODERN FOOTER ── */}
        <div style={{ 
          marginTop: isMobile ? "24px" : "32px", padding: isMobile ? "32px 20px" : "48px 48px", 
          background: "#081424", color: "#ffffff", borderRadius: "24px" 
        }}>
          <div style={{
            display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "2fr 1fr 1fr 1fr",
            gap: "40px", marginBottom: "32px"
          }}>
            <div style={{ gridColumn: isMobile ? "1 / -1" : "auto" }}>
              <h2 style={{ margin: "0 0 12px 0", fontSize: "28px", fontWeight: 900, letterSpacing: "-0.5px", color: "#ffffff" }}>GharKaPaisa</h2>
              <p style={{ margin: "0 0 24px 0", fontSize: "14px", color: "#ffffff", opacity: 0.85, lineHeight: 1.5 }}>
                {t('footer.desc', "India's trusted platform for Credit Cards, Loans, Insurance & Financial Services.")}
              </p>
              <div style={{ display: "flex", gap: "12px" }}>
                {[FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaYoutube].map((Icon, i) => (
                  <div key={i} style={{ cursor: "pointer", color: "#ffffff", background: "rgba(255,255,255,0.15)", width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={16} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: 800, color: "#ffffff" }}>{t('footer.products', 'Products')}</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <span onClick={() => handleBottomNavClick("credit-cards")} style={{ fontSize: "13px", color: "#ffffff", opacity: 0.85, cursor: "pointer" }}>{t('footer.creditCards', 'Credit Cards')}</span>
                <span onClick={() => handleBottomNavClick("loans")} style={{ fontSize: "13px", color: "#ffffff", opacity: 0.85, cursor: "pointer" }}>{t('footer.loans', 'Loans')}</span>
                <span onClick={() => handleBottomNavClick("insurance")} style={{ fontSize: "13px", color: "#ffffff", opacity: 0.85, cursor: "pointer" }}>{t('footer.insurance', 'Insurance')}</span>
              </div>
            </div>

            <div>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: 800, color: "#ffffff" }}>{t('footer.company', 'Company')}</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <span onClick={() => onNavigate && onNavigate("contact")} style={{ fontSize: "13px", color: "#ffffff", opacity: 0.85, cursor: "pointer" }}>{t('footer.aboutUs', 'About Us')}</span>
                <span style={{ fontSize: "13px", color: "#ffffff", opacity: 0.85, cursor: "default" }}>{t('footer.careers', 'Careers')}</span>
                <span onClick={() => onNavigate && onNavigate("contact")} style={{ fontSize: "13px", color: "#ffffff", opacity: 0.85, cursor: "pointer" }}>{t('footer.contactUs', 'Contact Us')}</span>
              </div>
            </div>

            <div>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: 800, color: "#ffffff" }}>{t('footer.support', 'Support')}</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <span style={{ fontSize: "13px", color: "#ffffff", opacity: 0.85, cursor: "default" }}>{t('footer.privacy', 'Privacy Policy')}</span>
                <span style={{ fontSize: "13px", color: "#ffffff", opacity: 0.85, cursor: "default" }}>{t('footer.terms', 'Terms & Conditions')}</span>
                <span style={{ fontSize: "13px", color: "#ffffff", opacity: 0.85, cursor: "default" }}>{t('footer.refund', 'Refund Policy')}</span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: "20px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", fontSize: "12px", color: "#ffffff", opacity: 0.7 }}>
            <span>{t('footer.rights', '© 2026 GharKaPaisa. All rights reserved.')}</span>
            <span>{t('footer.made', 'Made with ♥ in India')}</span>
          </div>
        </div>


      </div>
      
      {/* Show Bottom Nav only on Mobile */}
      {isMobile && <MobileBottomNav C={C} onNavigate={handleBottomNavClick} activeTab="home" />}
    </div>
  );
}
