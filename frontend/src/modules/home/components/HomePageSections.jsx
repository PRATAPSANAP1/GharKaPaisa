import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../../contexts/ThemeContext";
import { getApiV1Url } from "../../../config/api";
import { FaChevronRight, FaChevronLeft, FaRegCreditCard, FaLaptopHouse, FaUniversity, FaBuilding, FaCar, FaGraduationCap, FaHeartbeat, FaShieldAlt, FaUmbrella, FaPlane, FaTrain, FaBus, FaHotel, FaStar, FaCheckCircle } from "react-icons/fa";
import * as FaIcons from "react-icons/fa";

// Import modular data lists
import { bankCardsDetails, ltfCards } from "./CreditCards/index";
import { loansData } from "./Loans/index";
import { insuranceData } from "./Insurance/index";
import { servicesData } from "./Services/index";
import { banksList, trustBanks } from "./banks/banksData";
import { moneyTransfer } from "./MoneyTransfer/index";
import { attractiveCategories } from "./AttractiveSections/index";
import { popularCards } from "./PopularCards/index";
import { travelTransitData } from "./TravelTransit/index";
import CategoryCardItem from "./CategoryCardItem";

// Import banner images
import ltfBanner from "./banner/lifetimefree card.png";
import loanBanner from "./banner/loan.png";
import insuranceBanner from "./banner/insurance.png";
import emiBanner from "./banner/smart emi.png";
import emiNewBanner from "./banner/emi.jpeg";
import hdfcBanner from "./banner/hdfc pixel card.png";
import offerBanner from "./banner/offerbanner.png";

// Responsive Hook
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

// Responsive Grid Component
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
          background: C.bgSecondary, padding: isMobile ? "6px 4px" : "10px 8px", borderRadius: isMobile ? "10px" : "14px",
          border: `1px solid ${C.border}`, textAlign: "center", gap: isMobile ? "6px" : "10px",
          cursor: "pointer", transition: "all 0.2s",
          height: item.image ? (isMobile ? "45px" : "60px") : "auto"
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

// Section Component
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

// Hero Banner Carousel Component
export function HeroBannerCarousel({ C, navigate }) {
  const [bannerIndex, setBannerIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [dynamicBanners, setDynamicBanners] = useState([]);
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  const localBannerMap = {
    'lifetimefree card.png': ltfBanner,
    'loan.png': loanBanner,
    'insurance.png': insuranceBanner,
    'smart emi.png': emiBanner,
    'emi.jpeg': emiNewBanner,
    'hdfc pixel card.png': hdfcBanner,
    'offerbanner.png': offerBanner
  };

  const getBannerAction = (title, image_url) => {
    const tLower = (title || "").toLowerCase();
    const imgLower = (image_url || "").toLowerCase();
    if (tLower.includes("pixel") || imgLower.includes("pixel")) {
      return () => navigate("/credit-cards/hdfc-bank");
    }
    if (tLower.includes("lifetime") || tLower.includes("ltf") || imgLower.includes("lifetimefree")) {
      return () => navigate("/credit-cards/lifetime-free-credit-cards-ltf");
    }
    if (tLower.includes("personal loan") || tLower.includes("business loan") || tLower.includes("loans") || imgLower.includes("loan")) {
      return () => navigate("/loans");
    }
    if (tLower.includes("insurance") || imgLower.includes("insurance")) {
      return () => navigate("/insurance");
    }
    if (tLower.includes("emi") || imgLower.includes("emi")) {
      return () => navigate("/attractive-cards-loans/smart-emi-card");
    }
    if (tLower.includes("offer") || imgLower.includes("offer")) {
      return () => navigate("/credit-cards");
    }
    return () => navigate("/credit-cards");
  };

  useEffect(() => {
    const fetchBanners = async () => {
      const apiBase = getApiV1Url();
      try {
        const cachedBanners = sessionStorage.getItem('gkp_banners');
        if (cachedBanners) {
          setDynamicBanners(JSON.parse(cachedBanners));
        } else {
          const res = await fetch(`${apiBase}/banners`);
          const data = await res.json();
          if (data && data.success && data.data?.length > 0) {
            setDynamicBanners(data.data);
            sessionStorage.setItem('gkp_banners', JSON.stringify(data.data));
          }
        }
      } catch (err) {
        console.warn("Failed to load banners:", err);
      }
    };
    fetchBanners();
  }, []);

  const bannerSlides = dynamicBanners.length > 0 ? dynamicBanners.map(b => ({
    title: b.title,
    subtitle: b.subtitle,
    btnText: b.btn_text || 'Apply Now',
    bgImage: localBannerMap[b.image_url] || b.image_url,
    action: () => {
      const target = b.click_url || "/credit-cards";
      if (target.startsWith("http://") || target.startsWith("https://")) {
        window.open(target, "_blank");
      } else {
        navigate(target);
      }
    }
  })) : [
    { 
      title: t('home.banners.slideOffer.title', 'Special Offer'), 
      subtitle: t('home.banners.slideOffer.subtitle', 'Exclusive credit card and loan deals'), 
      btnText: t('home.banners.slideOffer.btn', 'View Offers'),
      bgImage: offerBanner,
      action: () => navigate("/credit-cards")
    },
    { 
      title: t('home.banners.slide0.title', 'Lifetime Free Credit Cards'), 
      subtitle: t('home.banners.slide0.subtitle', 'Zero Joining Fee • Zero Annual Fee'), 
      btnText: t('home.banners.slide0.btn', 'Explore Now'),
      bgImage: ltfBanner,
      action: () => navigate("/credit-cards/lifetime-free-credit-cards-ltf")
    },
    { 
      title: t('home.banners.slide1.title', 'Personal Loans'), 
      subtitle: t('home.banners.slide1.subtitle', 'Low Interest Rates • Quick Disbursal'), 
      btnText: t('home.banners.slide1.btn', 'Apply Now'),
      bgImage: loanBanner,
      action: () => navigate("/loans")
    },
    { 
      title: t('home.banners.slide3.title', 'Insurance Plans'), 
      subtitle: t('home.banners.slide3.subtitle', 'Comprehensive health, life and general insurance cover'), 
      btnText: t('home.banners.slide3.btn', 'Get Quotes'),
      bgImage: insuranceBanner,
      action: () => navigate("/insurance")
    }
  ];

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % bannerSlides.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isPaused, bannerSlides.length]);

  return (
    <div 
      style={{
        position: "relative",
        height: isMobile ? "200px" : "320px",
        borderRadius: "20px",
        overflow: "hidden",
        marginBottom: isMobile ? "20px" : "32px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.1)"
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {bannerSlides.map((slide, idx) => (
        <div
          key={idx}
          onClick={slide.action}
          style={{
            position: "absolute",
            inset: 0,
            opacity: bannerIndex === idx ? 1 : 0,
            transition: "opacity 0.5s ease-in-out",
            cursor: "pointer",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundImage: `url(${slide.bgImage})`
          }}
        >
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 100%)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: isMobile ? "flex-start" : "center",
            padding: isMobile ? "24px" : "40px",
            textAlign: isMobile ? "left" : "center"
          }}>
            <h2 style={{ 
              color: "#fff", 
              fontSize: isMobile ? "24px" : "36px", 
              fontWeight: 800, 
              margin: "0 0 8px 0",
              textShadow: "0 2px 8px rgba(0,0,0,0.3)"
            }}>
              {slide.title}
            </h2>
            <p style={{ 
              color: "rgba(255,255,255,0.9)", 
              fontSize: isMobile ? "14px" : "16px", 
              margin: "0 0 16px 0",
              fontWeight: 500
            }}>
              {slide.subtitle}
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); slide.action(); }}
              style={{
                background: "#fff",
                color: "#0D5CAB",
                border: "none",
                padding: isMobile ? "10px 20px" : "12px 28px",
                borderRadius: "30px",
                fontSize: isMobile ? "13px" : "14px",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"}
              onMouseLeave={(e) => e.target.style.transform = "none"}
            >
              {slide.btnText}
            </button>
          </div>
        </div>
      ))}

      {/* Navigation Dots */}
      <div style={{
        position: "absolute",
        bottom: "16px",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: "8px"
      }}>
        {bannerSlides.map((_, idx) => (
          <div
            key={idx}
            onClick={() => setBannerIndex(idx)}
            style={{
              width: bannerIndex === idx ? "24px" : "8px",
              height: "8px",
              borderRadius: "4px",
              background: bannerIndex === idx ? "#fff" : "rgba(255,255,255,0.5)",
              cursor: "pointer",
              transition: "all 0.3s"
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Credit Cards Section
export function CreditCardsSection({ C, navigate }) {
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  return (
    <Section 
      title={t('home.breadcrumbs.creditCards', 'Credit Cards')} 
      viewAllLabel={t('home.viewAll', 'View All')}
      onViewAll={() => navigate("/credit-cards")}
      C={C}
    >
      <ResponsiveGrid 
        items={banksList} 
        C={C} 
        onItemClick={(item) => navigate(`/credit-cards/${item.id}-bank`)}
      />
    </Section>
  );
}

// Loans Section
export function LoansSection({ C, navigate }) {
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  return (
    <Section 
      title={t('sections.loans', 'Loans')} 
      viewAllLabel={t('home.viewAll', 'View All')}
      onViewAll={() => navigate("/loans")}
      C={C}
    >
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
        {loansData.map((loan, idx) => (
          <div
            key={idx}
            onClick={() => navigate(`/category/${loan.id}`)}
            style={{
              background: C.card,
              borderRadius: "16px",
              padding: "20px",
              border: `1px solid ${C.border}`,
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.teal; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "none"; }}
          >
            <div style={{ fontSize: "24px", color: C.teal }}>{loan.icon}</div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: C.text }}>{loan.label}</h3>
            <p style={{ margin: 0, fontSize: "12px", color: C.textLight, lineHeight: 1.4 }}>{loan.desc}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

// Insurance Section
export function InsuranceSection({ C, navigate }) {
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  return (
    <Section 
      title={t('sections.insurance', 'Insurance')} 
      viewAllLabel={t('home.viewAll', 'View All')}
      onViewAll={() => navigate("/insurance")}
      C={C}
    >
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
        {insuranceData.map((insurance, idx) => (
          <div
            key={idx}
            onClick={() => navigate(`/category/${insurance.id}`)}
            style={{
              background: C.card,
              borderRadius: "16px",
              padding: "20px",
              border: `1px solid ${C.border}`,
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.teal; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "none"; }}
          >
            <div style={{ fontSize: "24px", color: C.teal }}>{insurance.icon}</div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: C.text }}>{insurance.label}</h3>
            <p style={{ margin: 0, fontSize: "12px", color: C.textLight, lineHeight: 1.4 }}>{insurance.desc}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

// Travel Services Section
export function TravelServicesSection({ C, navigate }) {
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  return (
    <Section 
      title={t('sections.travelTransit', 'Travel & Transit')} 
      viewAllLabel={t('home.viewAll', 'View All')}
      onViewAll={() => navigate("/travel-transit")}
      C={C}
    >
      <ResponsiveGrid 
        items={travelTransitData} 
        C={C} 
        onItemClick={(item) => {
          if (item.id === 'flight') navigate('/travel-transit/flight-booking');
          else if (item.id === 'fastag') navigate('/money-transfer/fastag');
        }}
      />
    </Section>
  );
}

// Utility Services Section
export function UtilityServicesSection({ C, navigate }) {
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  return (
    <Section 
      title={t('sections.businessServices', 'Utility Services')} 
      viewAllLabel={t('home.viewAll', 'View All')}
      onViewAll={() => navigate("/services")}
      C={C}
    >
      <ResponsiveGrid 
        items={servicesData} 
        C={C} 
        onItemClick={(item) => {
          if (item.id === 'fastag') navigate('/money-transfer/fastag');
        }}
      />
    </Section>
  );
}

// Bank Logos Section
export function BankLogosSection({ C }) {
  const isMobile = useIsMobile();

  return (
    <div style={{
      background: C.card,
      borderRadius: "20px",
      padding: isMobile ? "16px" : "24px",
      marginBottom: isMobile ? "20px" : "32px",
      border: `1px solid ${C.border}`,
      boxShadow: "0 4px 12px rgba(0,0,0,0.02)"
    }}>
      <div style={{ 
        display: "flex", 
        gap: isMobile ? "20px" : "32px", 
        flexWrap: "wrap", 
        justifyContent: "center",
        alignItems: "center",
        fontSize: isMobile ? "16px" : "18px", 
        fontWeight: 700, 
        color: C.text 
      }}>
        {trustBanks.map((bank, idx) => (
          <span key={idx} style={{ cursor: "default", letterSpacing: "-0.2px" }}>{bank}</span>
        ))}
      </div>
      <div style={{ 
        textAlign: "center",
        marginTop: "16px",
        background: `${C.teal}15`, 
        color: C.teal, 
        padding: "8px 16px", 
        borderRadius: "30px", 
        fontSize: "13px", 
        fontWeight: 700,
        display: "inline-block"
      }}>
        🏦 Trusted Partner Banks
      </div>
    </div>
  );
}

// Why Choose Us Section
export function WhyChooseUsSection({ C }) {
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  const features = [
    { icon: <FaCheckCircle />, title: t('whyChoose.feature1', 'Instant Approval'), desc: t('whyChoose.feature1Desc', 'Get quick decisions on your applications') },
    { icon: <FaShieldAlt />, title: t('whyChoose.feature2', 'Secure & Safe'), desc: t('whyChoose.feature2Desc', 'Your data is protected with bank-grade security') },
    { icon: <FaStar />, title: t('whyChoose.feature3', 'Best Rates'), desc: t('whyChoose.feature3Desc', 'Competitive interest rates and fees') },
    { icon: <FaRegCreditCard />, title: t('whyChoose.feature4', 'Wide Range'), desc: t('whyChoose.feature4Desc', 'Access to 100+ financial products') },
  ];

  return (
    <div style={{
      background: C.card,
      borderRadius: "20px",
      padding: isMobile ? "20px" : "32px",
      marginBottom: isMobile ? "20px" : "32px",
      border: `1px solid ${C.border}`,
      boxShadow: "0 4px 12px rgba(0,0,0,0.02)"
    }}>
      <h2 style={{ 
        fontSize: isMobile ? "20px" : "24px", 
        fontWeight: 800, 
        color: C.text, 
        margin: "0 0 24px 0",
        textAlign: "center"
      }}>
        {t('whyChoose.title', 'Why Choose GharKaPaisa?')}
      </h2>
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", 
        gap: "20px" 
      }}>
        {features.map((feature, idx) => (
          <div key={idx} style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
            <div style={{ 
              fontSize: "24px", 
              color: C.teal, 
              flexShrink: 0,
              marginTop: "4px"
            }}>
              {feature.icon}
            </div>
            <div>
              <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: 800, color: C.text }}>
                {feature.title}
              </h3>
              <p style={{ margin: 0, fontSize: "13px", color: C.textLight, lineHeight: 1.5 }}>
                {feature.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Partner Referral Banner
export function PartnerReferralBanner({ C, navigate }) {
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  return (
    <div
      onClick={() => navigate("/partner/referral")}
      style={{
        background: "linear-gradient(135deg, #0D5CAB 0%, #083E7A 100%)",
        borderRadius: "20px",
        padding: isMobile ? "24px" : "32px",
        marginBottom: isMobile ? "20px" : "32px",
        cursor: "pointer",
        boxShadow: "0 8px 24px rgba(13, 92, 171, 0.3)",
        transition: "all 0.3s"
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
      onMouseLeave={(e) => e.currentTarget.style.transform = "none"}
    >
      <div style={{ color: "#fff" }}>
        <h2 style={{ 
          fontSize: isMobile ? "20px" : "24px", 
          fontWeight: 800, 
          margin: "0 0 8px 0" 
        }}>
          {t('partnerReferral.title', 'Become a Partner')}
        </h2>
        <p style={{ 
          fontSize: isMobile ? "14px" : "16px", 
          margin: "0 0 16px 0",
          opacity: 0.9,
          lineHeight: 1.5
        }}>
          {t('partnerReferral.desc', 'Earn commissions by referring customers. Join our partner network today!')}
        </p>
        <button
          style={{
            background: "#fff",
            color: "#0D5CAB",
            border: "none",
            padding: isMobile ? "10px 20px" : "12px 28px",
            borderRadius: "30px",
            fontSize: isMobile ? "13px" : "14px",
            fontWeight: 800,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
          }}
        >
          {t('partnerReferral.cta', 'Learn More')}
        </button>
      </div>
    </div>
  );
}

// Testimonials Section
export function TestimonialsSection({ C }) {
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  const testimonials = [
    { name: "Rajesh Kumar", role: "Business Owner", text: t('testimonial.t1', 'GharKaPaisa helped me get a business loan within 24 hours. Amazing service!') },
    { name: "Priya Sharma", role: "Homemaker", text: t('testimonial.t2', 'The credit card comparison feature is excellent. Found the perfect card for my needs.') },
    { name: "Amit Patel", role: "Software Engineer", text: t('testimonial.t3', 'Fast, reliable, and transparent. Best financial platform I have used.') },
  ];

  return (
    <div style={{
      background: C.card,
      borderRadius: "20px",
      padding: isMobile ? "20px" : "32px",
      marginBottom: isMobile ? "20px" : "32px",
      border: `1px solid ${C.border}`,
      boxShadow: "0 4px 12px rgba(0,0,0,0.02)"
    }}>
      <h2 style={{ 
        fontSize: isMobile ? "20px" : "24px", 
        fontWeight: 800, 
        color: C.text, 
        margin: "0 0 24px 0",
        textAlign: "center"
      }}>
        {t('testimonials.title', 'What Our Customers Say')}
      </h2>
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", 
        gap: "20px" 
      }}>
        {testimonials.map((testimonial, idx) => (
          <div key={idx} style={{
            background: C.bgSecondary,
            borderRadius: "16px",
            padding: "20px",
            border: `1px solid ${C.border}`
          }}>
            <div style={{ fontSize: "24px", color: C.teal, marginBottom: "12px" }}>
              <FaStar />
              <FaStar />
              <FaStar />
              <FaStar />
              <FaStar />
            </div>
            <p style={{ 
              margin: "0 0 16px 0", 
              fontSize: "14px", 
              color: C.text, 
              lineHeight: 1.5,
              fontStyle: "italic"
            }}>
              "{testimonial.text}"
            </p>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 800, color: C.text }}>
                {testimonial.name}
              </div>
              <div style={{ fontSize: "12px", color: C.textLight }}>
                {testimonial.role}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// FAQ Section
export function FAQSection({ C }) {
  const [openIndex, setOpenIndex] = useState(null);
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  const faqs = [
    { q: t('faq.q1', 'How do I apply for a credit card?'), a: t('faq.a1', 'Simply browse our credit card section, select a card that suits your needs, and click Apply. Fill in your details and submit.') },
    { q: t('faq.q2', 'What documents are required for loan application?'), a: t('faq.a2', 'Typically, you need ID proof, address proof, income proof, and passport-sized photographs. Requirements vary by product.') },
    { q: t('faq.q3', 'How long does approval take?'), a: t('faq.a3', 'Approval times vary. Credit cards can be approved within minutes, while loans may take 24-48 hours depending on the bank.') },
    { q: t('faq.q4', 'Is my data secure?'), a: t('faq.a4', 'Yes, we use bank-grade encryption and follow strict security protocols to protect your personal and financial information.') },
  ];

  return (
    <div style={{
      background: C.card,
      borderRadius: "20px",
      padding: isMobile ? "20px" : "32px",
      marginBottom: isMobile ? "20px" : "32px",
      border: `1px solid ${C.border}`,
      boxShadow: "0 4px 12px rgba(0,0,0,0.02)"
    }}>
      <h2 style={{ 
        fontSize: isMobile ? "20px" : "24px", 
        fontWeight: 800, 
        color: C.text, 
        margin: "0 0 24px 0",
        textAlign: "center"
      }}>
        {t('faq.title', 'Frequently Asked Questions')}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {faqs.map((faq, idx) => (
          <div key={idx} style={{
            background: C.bgSecondary,
            borderRadius: "12px",
            border: `1px solid ${C.border}`,
            overflow: "hidden"
          }}>
            <button
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              style={{
                width: "100%",
                background: "none",
                border: "none",
                padding: "16px 20px",
                textAlign: "left",
                fontSize: "14px",
                fontWeight: 700,
                color: C.text,
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              {faq.q}
              <span style={{ fontSize: "12px", transition: "transform 0.3s" }}>
                {openIndex === idx ? '−' : '+'}
              </span>
            </button>
            {openIndex === idx && (
              <div style={{ padding: "0 20px 16px 20px", fontSize: "13px", color: C.textLight, lineHeight: 1.5 }}>
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Latest Offers Section
export function LatestOffersSection({ C, navigate }) {
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  const offers = [
    { title: "Lifetime Free Cards", desc: "Zero joining fee on select cards", color: "#10B981" },
    { title: "Personal Loan Special", desc: "Interest rates starting from 10.5%", color: "#3B82F6" },
    { title: "Insurance Bonus", desc: "Get 20% extra coverage", color: "#F59E0B" },
  ];

  return (
    <Section 
      title={t('offers.title', 'Latest Offers')} 
      viewAllLabel={t('home.viewAll', 'View All')}
      onViewAll={() => navigate("/credit-cards")}
      C={C}
    >
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: "16px" }}>
        {offers.map((offer, idx) => (
          <div
            key={idx}
            onClick={() => navigate("/credit-cards")}
            style={{
              background: C.card,
              borderRadius: "16px",
              padding: "20px",
              border: `1px solid ${C.border}`,
              cursor: "pointer",
              transition: "all 0.2s",
              borderLeft: `4px solid ${offer.color}`
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = offer.color; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "none"; }}
          >
            <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: 800, color: C.text }}>
              {offer.title}
            </h3>
            <p style={{ margin: 0, fontSize: "13px", color: C.textLight }}>
              {offer.desc}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

// Featured Products Section
export function FeaturedProductsSection({ C, navigate }) {
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const cached = sessionStorage.getItem('gkp_featured_products');
    if (cached) {
      try { setProducts(JSON.parse(cached)); return; } catch (e) {}
    }
    const baseUrl = getApiV1Url();
    fetch(`${baseUrl}/products?featured=true&limit=6`)
      .then(r => r.json())
      .then(data => {
        const items = data?.data || data?.products || [];
        setProducts(items.slice(0, 6));
        sessionStorage.setItem('gkp_featured_products', JSON.stringify(items.slice(0, 6)));
      })
      .catch(() => {});
  }, []);

  if (products.length === 0) return null;

  return (
    <Section
      title={t('featuredProducts.title', 'Featured Products')}
      viewAllLabel={t('home.viewAll', 'View All')}
      onViewAll={() => navigate("/credit-cards")}
      C={C}
    >
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: "16px" }}>
        {products.map((product, idx) => (
          <div
            key={product.id || idx}
            onClick={() => navigate(`/product/${product.id}`)}
            style={{
              background: C.card,
              borderRadius: "16px",
              padding: "16px",
              border: `1px solid ${C.border}`,
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.teal; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "none"; }}
          >
            {product.image_url && (
              <div style={{ height: "80px", display: "flex", alignItems: "center", justifyContent: "center", background: C.bgSecondary, borderRadius: "12px", padding: "8px" }}>
                <img src={product.image_url} alt={product.name} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
              </div>
            )}
            <div>
              <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: 700, color: C.text }}>{product.name}</h4>
              {product.bank_name && (
                <span style={{ fontSize: "11px", color: C.teal, fontWeight: 600 }}>{product.bank_name}</span>
              )}
            </div>
            <button
              style={{
                background: `${C.teal}15`, color: C.teal, border: "none", borderRadius: "8px",
                padding: "8px 12px", fontSize: "12px", fontWeight: 700, cursor: "pointer",
                width: "100%", textAlign: "center"
              }}
            >
              {t('home.applyNow', 'Apply Now')}
            </button>
          </div>
        ))}
      </div>
    </Section>
  );
}

// Footer Section (reusable across public home and partner dashboard)
export function FooterSection({ C, navigate }) {
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  return (
    <div style={{
      marginTop: isMobile ? "24px" : "32px",
      padding: isMobile ? "32px 20px" : "48px 48px",
      background: "#081424",
      color: "#ffffff",
      borderRadius: "24px"
    }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr 1fr" : "2fr 1fr 1fr 1fr",
        gap: "40px",
        marginBottom: "32px"
      }}>
        <div style={{ gridColumn: isMobile ? "1 / -1" : "auto" }}>
          <h2 style={{ margin: "0 0 12px 0", fontSize: "28px", fontWeight: 900, letterSpacing: "-0.5px", color: "#ffffff" }}>
            GharKaPaisa
          </h2>
          <p style={{ margin: "0 0 24px 0", fontSize: "14px", color: "#ffffff", opacity: 0.85, lineHeight: 1.5 }}>
            {t('footer.desc', "India's trusted platform for Credit Cards, Loans, Insurance & Financial Services.")}
          </p>
        </div>

        <div>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: 800, color: "#ffffff" }}>
            {t('footer.products', 'Products')}
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <span onClick={() => navigate?.("/credit-cards")} style={{ fontSize: "13px", color: "#ffffff", opacity: 0.85, cursor: "pointer" }}>
              {t('footer.creditCards', 'Credit Cards')}
            </span>
            <span onClick={() => navigate?.("/loans")} style={{ fontSize: "13px", color: "#ffffff", opacity: 0.85, cursor: "pointer" }}>
              {t('footer.loans', 'Loans')}
            </span>
            <span onClick={() => navigate?.("/insurance")} style={{ fontSize: "13px", color: "#ffffff", opacity: 0.85, cursor: "pointer" }}>
              {t('footer.insurance', 'Insurance')}
            </span>
          </div>
        </div>

        <div>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: 800, color: "#ffffff" }}>
            {t('footer.company', 'Company')}
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", color: "#ffffff", opacity: 0.85 }}>
            <span onClick={() => navigate?.("/contact")} style={{ cursor: "pointer" }}>{t('footer.contactUs', 'Contact Us')}</span>
            <span onClick={() => navigate?.("/privacy-policy")} style={{ cursor: "pointer" }}>{t('footer.privacy', 'Privacy Policy')}</span>
            <span onClick={() => navigate?.("/terms-and-conditions")} style={{ cursor: "pointer" }}>{t('footer.terms', 'Terms & Conditions')}</span>
          </div>
        </div>

        <div>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: 800, color: "#ffffff" }}>
            {t('footer.support', 'Support')}
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", color: "#ffffff", opacity: 0.85 }}>
            <span>support@gharkapaisa.com</span>
            <span>+91 99999 99999</span>
          </div>
        </div>
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: "20px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", fontSize: "12px", color: "#ffffff", opacity: 0.7 }}>
        <span>{t('footer.rights', '© 2026 GharKaPaisa. All rights reserved.')}</span>
        <span>{t('footer.made', 'Made with ♥ in India')}</span>
      </div>
    </div>
  );
}
