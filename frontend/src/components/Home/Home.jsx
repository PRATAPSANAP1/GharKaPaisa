import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../Partner/ThemeContext";
import { useSearchStore } from "../../store/searchStore";
import {
  FaMobileAlt, FaBolt, FaMoneyBillWave, FaChevronRight, FaChevronLeft,
  FaRegCreditCard, FaLaptopHouse, FaUniversity, FaBuilding, FaCar,
  FaGraduationCap, FaHeartbeat, FaShieldAlt, FaUmbrella, FaFacebook,
  FaTwitter, FaInstagram, FaEnvelope, FaPhoneAlt, FaArrowLeft, FaHome,
  FaChartLine, FaFileInvoiceDollar, FaCalculator, FaUsers, FaMoneyCheckAlt,
  FaStar, FaGooglePlay, FaApple, FaLinkedin, FaYoutube, FaFileAlt,
  FaBuilding as FaBuildingAlt, FaReceipt, FaBriefcase, FaHandsHelping, FaIdCard,
  FaPlane, FaTrain, FaBus, FaHotel, FaTimes, FaWhatsapp
} from "react-icons/fa";
import * as FaIcons from "react-icons/fa";

// Import modular data lists
import { bankCardsDetails, ltfCards } from "./CreditCards";
import { HDFCCardsPage } from "./CreditCards/HDFCCardsPage";
import CardApplyVerificationModal from "./CreditCards/CardApplyVerificationModal";
import { loansData } from "./Loans";
import { insuranceData } from "./Insurance";
import { servicesData } from "./Services";
import { banksList, trustBanks } from "./banks/banksData";
import { moneyTransfer } from "./MoneyTransfer";
import { attractiveCategories } from "./AttractiveSections";
import { popularCards } from "./PopularCards";
import { travelTransitData } from "./TravelTransit";
import CategoryCardItem from "./CategoryCardItem";
import "../Home.css";

// Import banner images
import ltfBanner from "./banner/lifetimefree card.png";
import loanBanner from "./banner/loan.png";
import insuranceBanner from "./banner/insurance.png";
import emiBanner from "./banner/smart emi.png";
import emiNewBanner from "./banner/emi.jpeg";
import hdfcBanner from "./banner/hdfc pixel card.png";
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
import fastagImg from "./MoneyTransfer/fastag.png";

// Import travel transit images
import flightImg from "./TravelTransit/flight.png";
import trainImg from "./TravelTransit/train.png";
import busImg from "./TravelTransit/bus.png";
import hotelImg from "./TravelTransit/hotel.png";


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

// Helper to map UI labels/IDs to backend product categories
const mapToCategoryKey = (item) => {
  const label = item.label || "";
  const id = item.id || "";
  const clean = (label || id).toLowerCase();
  
  if (clean.includes("personal loan") || clean === "personal-loan") return "personal_loan";
  if (clean.includes("home loan") || clean === "home-loan") return "home_loan";
  if (clean.includes("business loan") || clean === "business-loan") return "business_loan";
  if (clean.includes("instant loan") || clean === "instant-loan") return "instant_loan";
  if (clean.includes("used car loan") || clean === "used-car-loan") return "used_car_loan";
  if (clean.includes("education loan") || clean === "education-loan") return "education_loan";
  
  if (clean.includes("health insurance") || clean === "health-insurance") return "health_insurance";
  if (clean.includes("life insurance") || clean === "life-insurance") return "life_insurance";
  if (clean.includes("general insurance") || clean === "general-insurance") return "general_insurance";
  
  if (clean.includes("lifetime free cards") || clean === "ltf-cards") return "credit_card";
  if (clean.includes("fd based") || clean.includes("fd backed") || clean === "secured-cards") return "fd_card";
  if (clean.includes("co-brand") || clean === "upi-cards" || clean === "smart-emi") return "co_branded_card";
  
  return null;
};

// Dynamic Products List Component for dynamic category views
function DynamicProductsList({ categoryKey, C, isMobile }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError("");
      try {
        const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const res = await fetch(`${baseUrl}/api/v1/products?category=${categoryKey}`);
        const data = await res.json();
        if (data && data.success) {
          setProducts(data.data);
        } else {
          setError(data.message || "Failed to load products");
        }
      } catch (err) {
        console.error(err);
        setError("Network error loading products.");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [categoryKey]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "48px", color: C.textLight }}>
        <div style={{ width: "24px", height: "24px", border: `3px solid ${C.teal}`, borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto 8px", animation: "spin 1s linear infinite" }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        Loading matching products...
      </div>
    );
  }

  if (error) {
    return <div style={{ color: C.red, padding: "20px", textAlign: "center" }}>{error}</div>;
  }

  if (products.length === 0) {
    return <div style={{ color: C.textLight, padding: "48px", textAlign: "center" }}>No products available under this category currently.</div>;
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px", marginTop: "16px" }}>
      {products.map((prod) => (
        <div key={prod.id} style={{
          background: C.card,
          borderRadius: "16px",
          border: `1px solid ${C.border}`,
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
          transition: "all 0.25s ease",
          color: C.text
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.teal; e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "none"; }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, background: `${C.teal}15`, color: C.teal, padding: "3px 8px", borderRadius: "20px", textTransform: "uppercase" }}>
                {prod.category.replace(/_/g, ' ')}
              </span>
              <span style={{ fontSize: "12px", fontWeight: 700, color: C.textLight }}>
                {prod.bank_code || "Partner Bank"}
              </span>
            </div>
            <h4 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: 800 }}>{prod.name}</h4>
            <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: C.textLight, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {prod.description || "Get instant approval and flexible tenure."}
            </p>
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${C.border}60`, paddingTop: "12px", marginTop: "8px" }}>
            <div>
              <span style={{ fontSize: "10px", color: C.textLight, display: "block", textTransform: "uppercase", fontWeight: 700 }}>Commission</span>
              <span style={{ fontSize: "18px", fontWeight: 800, color: C.green }}>₹{parseFloat(prod.commission_value).toLocaleString("en-IN")}</span>
            </div>
            <button
              onClick={() => navigate(`/product/${prod.id}`)}
              style={{
                background: C.teal,
                color: "#ffffff",
                border: "none",
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: `0 4px 10px ${C.teal}25`
              }}
            >
              Apply
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── CategoryPage Component ──────────────────────────────────────────
function CategoryPage({ category, onBack, C, onItemClick, breadcrumbs }) {
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const [selectedDetailCard, setSelectedDetailCard] = useState(null);
  const [compareCard1, setCompareCard1] = useState(null);
  const [compareCard2, setCompareCard2] = useState(null);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [dbProducts, setDbProducts] = useState([]);

  useEffect(() => {
    const fetchDbProducts = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const res = await fetch(`${baseUrl}/api/v1/products?limit=100`);
        const data = await res.json();
        if (data && data.success) {
          setDbProducts(data.data);
        }
      } catch (err) {
        console.warn("Failed to load products for mapping in Home.jsx:", err);
      }
    };
    fetchDbProducts();
  }, []);

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
                  background: C.bgSecondary, padding: isMobile ? "8px 10px" : "12px 10px", borderRadius: "14px",
                  border: `1px solid ${C.border}`, textAlign: "center", gap: "10px", cursor: "pointer",
                  transition: "all 0.2s",
                  height: item.image ? (isMobile ? "45px" : "60px") : "auto"
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
                      <CategoryCardItem key={cIdx} card={card} C={C} t={t} isMobile={isMobile} />
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
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "10px" }}>
                  {sec.cards.map((card, cIdx) => (
                    <button
                      key={cIdx}
                      onClick={() => setSelectedDetailCard(card)}
                      style={{
                        background: C.bgSecondary,
                        color: C.text,
                        border: `1px solid ${C.border}`,
                        padding: "8px 16px",
                        borderRadius: "20px",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = C.teal;
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = C.border;
                        e.currentTarget.style.transform = "none";
                      }}
                    >
                      {card.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Generic Card Details Modal Overlay */}
        {selectedDetailCard && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            backdropFilter: "blur(4px)"
          }}>
            <div style={{
              background: C.card,
              width: "100%",
              maxWidth: "450px",
              borderRadius: "24px",
              border: `1px solid ${C.border}`,
              padding: "24px",
              position: "relative",
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
              color: C.text
            }}>
              {/* Close button */}
              <span 
                onClick={() => setSelectedDetailCard(null)}
                style={{ position: "absolute", right: "20px", top: "20px", cursor: "pointer", color: C.textLight, zIndex: 20 }}
              >
                <FaTimes size={18} />
              </span>

              {/* Card Mockup Graphic */}
              {(() => {
                const getCardGradient = (name) => {
                  const n = name.toLowerCase();
                  if (n.includes('neo')) return 'linear-gradient(135deg, #87123F 0%, #5C0D2B 100%)';
                  if (n.includes('zone')) return 'linear-gradient(135deg, #1D4ED8 0%, #0D5CAB 100%)';
                  if (n.includes('flipkart')) return 'linear-gradient(135deg, #0D5CAB 0%, #87123F 100%)';
                  if (n.includes('atlas')) return 'linear-gradient(135deg, #111 0%, #444 100%)';
                  if (n.includes('eterna')) return 'linear-gradient(135deg, #FF6600 0%, #B34700 100%)';
                  if (n.includes('premier')) return 'linear-gradient(135deg, #00A0E9 0%, #0067B1 100%)';
                  if (n.includes('click') || n.includes('save')) return 'linear-gradient(135deg, #0067B1 0%, #004D80 100%)';
                  if (n.includes('octane')) return 'linear-gradient(135deg, #107C41 0%, #0B5A2F 100%)';
                  return 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)';
                };
                
                const getBankLogoText = () => {
                  const bid = (category.id || "").toLowerCase();
                  if (bid.includes("sbi")) return "SBI CARD";
                  if (bid.includes("axis")) return "AXIS BANK";
                  if (bid.includes("bob")) return "BANK OF BARODA";
                  return category.title ? category.title.toUpperCase() : "BANK CARD";
                };

                const getNetwork = () => {
                  const name = selectedDetailCard.name.toLowerCase();
                  if (name.includes("rupay")) return "RuPay";
                  if (name.includes("mastercard")) return "Mastercard";
                  return "Visa";
                };

                return (
                  <div style={{
                    background: getCardGradient(selectedDetailCard.name),
                    height: "150px",
                    borderRadius: "20px",
                    padding: "24px",
                    color: "#fff",
                    marginBottom: "20px",
                    boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                    position: "relative",
                    overflow: "hidden"
                  }}>
                    <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "1px", opacity: 0.9 }}>{getBankLogoText()}</div>
                    <div style={{ fontSize: "20px", fontWeight: 800, margin: "20px 0 10px 0" }}>{selectedDetailCard.name}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", opacity: 0.8 }}>
                      <span>{getNetwork()}</span>
                      <span>•••• •••• •••• 8888</span>
                    </div>
                  </div>
                );
              })()}

              {/* Card Info Details */}
              <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: 800, color: C.text }}>
                {selectedDetailCard.name}
              </h3>
              <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: C.textLight, lineHeight: 1.4 }}>
                {selectedDetailCard.desc}
              </p>

              {/* Highlights */}
              {(() => {
                const highlights = selectedDetailCard.highlights || (selectedDetailCard.desc ? selectedDetailCard.desc.split(/,|and/i).map(s => s.trim()).filter(Boolean).slice(0, 3) : ["Standard Benefits"]);
                return (
                  <div style={{ marginBottom: "16px" }}>
                    <h4 style={{ margin: "0 0 8px 0", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", color: C.textLight, letterSpacing: "0.5px" }}>Key Features</h4>
                    <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "12px", color: C.text, display: "flex", flexDirection: "column", gap: "6px" }}>
                      {highlights.map((hl, i) => (
                        <li key={i}>{hl}</li>
                      ))}
                    </ul>
                  </div>
                );
              })()}

              {/* Annual Fee */}
              {(() => {
                const dbProduct = dbProducts.find(p => p.name.toLowerCase().replace(/[^a-z0-9]/g, '') === selectedDetailCard.name.toLowerCase().replace(/[^a-z0-9]/g, ''));
                let feeText = "";
                if (dbProduct && dbProduct.annual_fee) {
                  feeText = `Annual Fee: ${dbProduct.annual_fee}`;
                } else {
                  const isCardLTF = ltfCards.some(lc => lc.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(selectedDetailCard.name.toLowerCase().replace(/[^a-z0-9]/g, ''))) ||
                                    (selectedDetailCard.desc && (selectedDetailCard.desc.toLowerCase().includes('lifetime free') || selectedDetailCard.desc.toLowerCase().includes('ltf') || selectedDetailCard.desc.toLowerCase().includes('no annual fee')));
                  feeText = isCardLTF ? "Annual Fee: Zero" : "Annual Fee: ₹499 (Waived on milestone spend)";
                }
                return (
                  <div style={{
                    background: C.bgSecondary,
                    padding: "12px",
                    borderRadius: "10px",
                    fontSize: "12px",
                    fontWeight: 700,
                    marginBottom: "20px",
                    color: C.text
                  }}>
                    {feeText}
                  </div>
                );
              })()}

              {/* Actions */}
              {(() => {
                const dbProduct = dbProducts.find(p => p.name.toLowerCase().replace(/[^a-z0-9]/g, '') === selectedDetailCard.name.toLowerCase().replace(/[^a-z0-9]/g, ''));
                let showBanner = false;
                let bannerText = "";
                
                if (dbProduct && dbProduct.time_period) {
                  showBanner = true;
                  bannerText = dbProduct.time_period;
                } else {
                  const isCardLTF = ltfCards.some(lc => lc.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(selectedDetailCard.name.toLowerCase().replace(/[^a-z0-9]/g, ''))) ||
                                    (selectedDetailCard.desc && (selectedDetailCard.desc.toLowerCase().includes('lifetime free') || selectedDetailCard.desc.toLowerCase().includes('ltf') || selectedDetailCard.desc.toLowerCase().includes('no annual fee')));
                  if (isCardLTF) {
                    showBanner = true;
                    bannerText = "Offer till 30 June";
                  }
                }
                
                return showBanner && (
                  <div style={{
                    background: "#FEF3C7",
                    border: "1px solid #F59E0B",
                    color: "#D97706",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: 700,
                    textAlign: "center",
                    marginBottom: "12px"
                  }}>
                    {bannerText}
                  </div>
                );
              })()}

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button 
                  onClick={() => {
                    setCompareCard1(selectedDetailCard);
                    const allBankCards = category.sections.flatMap(s => s.cards);
                    const otherCard = allBankCards.find(c => c.name !== selectedDetailCard.name) || selectedDetailCard;
                    setCompareCard2(otherCard);
                    setIsCompareOpen(true);
                    setSelectedDetailCard(null);
                  }}
                  style={{
                    flex: "1 1 auto",
                    background: "none",
                    border: `1px solid ${C.teal}`,
                    color: C.teal,
                    padding: "10px",
                    borderRadius: "10px",
                    fontSize: "12px",
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px"
                  }}
                >
                  Compare
                </button>
                <button 
                  onClick={() => {
                    const cleanId = selectedDetailCard.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                    const refLink = `gharkapaisa.com/card/${cleanId}?ref=GP12345`;
                    const shareText = `Apply for the ${selectedDetailCard.name} of ${category.title} through GharKaPaisa! Check it out here: ${refLink}`;
                    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
                    window.open(url, '_blank');
                  }}
                  style={{
                    flex: "1 1 auto",
                    background: "none",
                    border: "1px solid #25D366",
                    color: "#25D366",
                    padding: "10px",
                    borderRadius: "10px",
                    fontSize: "12px",
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px"
                  }}
                >
                  <FaWhatsapp size={15} />
                  Share
                </button>
                <button 
                  onClick={() => {
                    const bankId = (category.id || "").replace("bank-", "");
                    if (onItemClick) {
                      onItemClick({ 
                        id: `apply-${selectedDetailCard.name.toLowerCase().replace(/\s+/g, "-")}`, 
                        label: selectedDetailCard.name,
                        isApplyAction: true,
                        bankId,
                        bankName: category.title || "Partner Bank"
                      });
                    }
                    setSelectedDetailCard(null);
                  }}
                  style={{
                    flex: "2 1 auto",
                    background: C.teal,
                    color: "#ffffff",
                    border: "none",
                    padding: "10px",
                    borderRadius: "10px",
                    fontSize: "12px",
                    fontWeight: 800,
                    cursor: "pointer",
                    textAlign: "center"
                  }}
                >
                  {t('popularCardsList.applyNow', 'Apply Now')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Generic Bank Card Compare Modal */}
        {isCompareOpen && compareCard1 && compareCard2 && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            backdropFilter: "blur(4px)"
          }}>
            <div style={{
              background: C.card,
              width: "100%",
              maxWidth: "600px",
              borderRadius: "24px",
              border: `1px solid ${C.border}`,
              padding: "24px",
              position: "relative",
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
              color: C.text
            }}>
              {/* Close button */}
              <span 
                onClick={() => setIsCompareOpen(false)}
                style={{ position: "absolute", right: "20px", top: "20px", cursor: "pointer", color: C.textLight }}
              >
                <FaTimes size={18} />
              </span>

              <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: 900 }}>Compare {category.title}</h3>
              
              {/* Selector Dropdowns */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                <div>
                  <label style={{ fontSize: "11px", color: C.textLight, display: "block", marginBottom: "4px", fontWeight: 700 }}>Card 1</label>
                  <select 
                    value={compareCard1.name} 
                    onChange={(e) => setCompareCard1(category.sections.flatMap(s => s.cards).find(c => c.name === e.target.value))}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      background: C.bgSecondary,
                      border: `1px solid ${C.border}`,
                      color: C.text,
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 700,
                      outline: "none"
                    }}
                  >
                    {category.sections.flatMap(s => s.cards).map((c, idx) => (
                      <option key={idx} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label style={{ fontSize: "11px", color: C.textLight, display: "block", marginBottom: "4px", fontWeight: 700 }}>Card 2</label>
                  <select 
                    value={compareCard2.name} 
                    onChange={(e) => setCompareCard2(category.sections.flatMap(s => s.cards).find(c => c.name === e.target.value))}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      background: C.bgSecondary,
                      border: `1px solid ${C.border}`,
                      color: C.text,
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 700,
                      outline: "none"
                    }}
                  >
                    {category.sections.flatMap(s => s.cards).map((c, idx) => (
                      <option key={idx} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Comparison Grid Table */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", border: `1px solid ${C.border}`, borderRadius: "12px", overflow: "hidden", background: C.bgSecondary }}>
                {[
                  { 
                    label: "Joining/Annual Fee", 
                    val1: ltfCards.some(lc => lc.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(compareCard1.name.toLowerCase().replace(/[^a-z0-9]/g, ''))) || (compareCard1.desc && (compareCard1.desc.toLowerCase().includes('lifetime free') || compareCard1.desc.toLowerCase().includes('ltf') || compareCard1.desc.toLowerCase().includes('no annual fee'))) ? "Zero" : "₹499 (Waived on milestone spend)",
                    val2: ltfCards.some(lc => lc.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(compareCard2.name.toLowerCase().replace(/[^a-z0-9]/g, ''))) || (compareCard2.desc && (compareCard2.desc.toLowerCase().includes('lifetime free') || compareCard2.desc.toLowerCase().includes('ltf') || compareCard2.desc.toLowerCase().includes('no annual fee'))) ? "Zero" : "₹499 (Waived on milestone spend)"
                  },
                  { 
                    label: "Key Spend Benefit", 
                    val1: compareCard1.desc, 
                    val2: compareCard2.desc 
                  },
                  { 
                    label: "Payment network", 
                    val1: compareCard1.name.toLowerCase().includes('rupay') ? "RuPay" : compareCard1.name.toLowerCase().includes('mastercard') ? "Mastercard" : "Visa", 
                    val2: compareCard2.name.toLowerCase().includes('rupay') ? "RuPay" : compareCard2.name.toLowerCase().includes('mastercard') ? "Mastercard" : "Visa" 
                  }
                ].map((row, idx) => (
                  <div key={idx} style={{ 
                    display: "grid", 
                    gridTemplateColumns: "1.2fr 1fr 1fr", 
                    borderBottom: idx === 2 ? "none" : `1px solid ${C.border}`,
                    fontSize: "11px",
                    lineHeight: 1.4
                  }}>
                    <div style={{ padding: "10px", fontWeight: 800, background: C.card, borderRight: `1px solid ${C.border}` }}>{row.label}</div>
                    <div style={{ padding: "10px", borderRight: `1px solid ${C.border}`, color: C.text }}>{row.val1}</div>
                    <div style={{ padding: "10px", color: C.text }}>{row.val2}</div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setIsCompareOpen(false)}
                style={{
                  marginTop: "20px",
                  width: "100%",
                  background: C.teal,
                  color: "#ffffff",
                  border: "none",
                  padding: "10px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                Close Comparison
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Inter', sans-serif", paddingBottom: "80px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 16px" }}>
        <BackRow />
        {category.type === "dynamic-products" ? (
          <DynamicProductsList categoryKey={category.categoryKey} C={C} isMobile={isMobile} />
        ) : (
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
                 category.id === "attractive-sections" ? t('attractiveCards.' + item.id, item.label) :
                 t(category.id + 'List.' + item.label.toLowerCase().replace(/[^a-z0-9]/g, ''), item.label)}
              </div>
            </div>
          )) : (
            <div style={{ color: C.textLight, gridColumn: "1 / -1", textAlign: "center", padding: "40px" }}>{t('home.noItems', 'No items available in this category.')}</div>
          )}
          </div>
        )}
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



function FastagPage({ onBack, C, isMobile, breadcrumbs }) {
  const { t } = useTranslation();
  const [vehicleNo, setVehicleNo] = useState("");
  const [amount, setAmount] = useState("");
  const [bank, setBank] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRecharge = (e) => {
    e.preventDefault();
    if (!vehicleNo || !amount || !bank) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1500);
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Inter', sans-serif", paddingBottom: "80px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", fontSize: isMobile ? "11px" : "13px", fontWeight: 700, color: C.textLight, marginBottom: "20px" }}>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <span 
                onClick={crumb.action} 
                style={{ cursor: crumb.action ? "pointer" : "default", color: crumb.action ? C.teal : C.textLight }}
                onMouseEnter={e => crumb.action && (e.target.style.textDecoration = "underline")}
                onMouseLeave={e => crumb.action && (e.target.style.textDecoration = "none")}
              >
                {crumb.label}
              </span>
              {idx < breadcrumbs.length - 1 && <span>/</span>}
            </React.Fragment>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <button onClick={onBack} style={{ background: "none", border: "none", color: C.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: "8px", borderRadius: "50%", transition: "background 0.2s" }} onMouseEnter={e => e.target.style.background = C.bgSecondary} onMouseLeave={e => e.target.style.background = "none"}>
            <FaArrowLeft size={18} />
          </button>
          <h2 style={{ margin: 0, fontSize: isMobile ? "20px" : "26px", fontWeight: 800, color: C.text }}>
            {t('moneyTransfer.fastag', 'FASTag Recharge')}
          </h2>
        </div>

        {success ? (
          <div style={{ background: C.card, padding: "30px", borderRadius: "20px", border: `1px solid ${C.border}`, textAlign: "center", boxShadow: "0 8px 24px rgba(0,0,0,0.05)" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#27ae60", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px auto", fontSize: "28px" }}>✓</div>
            <h3 style={{ margin: "0 0 10px 0", color: C.text, fontSize: "20px", fontWeight: 800 }}>Recharge Initiated!</h3>
            <p style={{ margin: "0 0 20px 0", color: C.textLight, fontSize: "14px" }}>Recharge of ₹{amount} for {vehicleNo.toUpperCase()} is successful.</p>
            <button onClick={() => { setSuccess(false); setVehicleNo(""); setAmount(""); setBank(""); }} style={{ background: C.teal, color: "#fff", border: "none", padding: "10px 24px", borderRadius: "10px", fontWeight: 700, cursor: "pointer" }}>
              Recharge Another Card
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "3fr 2fr", gap: "24px" }}>
            <form onSubmit={handleRecharge} style={{ background: C.card, padding: "24px", borderRadius: "20px", border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: "16px", boxShadow: "0 8px 24px rgba(0,0,0,0.02)" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: C.textLight, marginBottom: "6px" }}>Vehicle Registration Number</label>
                <input 
                  type="text" 
                  value={vehicleNo}
                  onChange={e => setVehicleNo(e.target.value)}
                  placeholder="e.g. MH12AB1234" 
                  required
                  style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: "14px", fontWeight: 600, boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: C.textLight, marginBottom: "6px" }}>Select FASTag Bank</label>
                <select 
                  value={bank}
                  onChange={e => setBank(e.target.value)}
                  required
                  style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: "14px", fontWeight: 600, boxSizing: "border-box" }}
                >
                  <option value="">-- Select Bank --</option>
                  <option value="hdfc">HDFC Bank FASTag</option>
                  <option value="sbi">SBI FASTag</option>
                  <option value="icici">ICICI Bank FASTag</option>
                  <option value="idfc">IDFC First Bank FASTag</option>
                  <option value="axis">Axis Bank FASTag</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: C.textLight, marginBottom: "6px" }}>Recharge Amount (₹)</label>
                <input 
                  type="number" 
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="Enter amount" 
                  min="100"
                  required
                  style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: "14px", fontWeight: 600, boxSizing: "border-box" }}
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                style={{ width: "100%", background: C.teal, color: "#fff", border: "none", padding: "14px", borderRadius: "12px", fontSize: "15px", fontWeight: 800, cursor: "pointer", marginTop: "10px", transition: "opacity 0.2s" }}
              >
                {loading ? "Processing Payment..." : "Proceed to Pay"}
              </button>
            </form>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ background: C.card, padding: "20px", borderRadius: "18px", border: `1px solid ${C.border}` }}>
                <h4 style={{ margin: "0 0 10px 0", color: C.text, fontSize: "14px", fontWeight: 800 }}>Instant and Secure</h4>
                <p style={{ margin: 0, color: C.textLight, fontSize: "12px", lineHeight: 1.5 }}>Enjoy a completely automated and secure FASTag recharge experience. Receipts are generated instantly upon bank clearance.</p>
              </div>
              <div style={{ background: C.card, padding: "20px", borderRadius: "18px", border: `1px solid ${C.border}` }}>
                <h4 style={{ margin: "0 0 10px 0", color: C.text, fontSize: "14px", fontWeight: 800 }}>Need Assistance?</h4>
                <p style={{ margin: 0, color: C.textLight, fontSize: "12px", lineHeight: 1.5 }}>If your recharge fails or is delayed, contact our round-the-clock helpdesk for fast resolution.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TravelBookingPage({ onBack, C, isMobile, breadcrumbs }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("flight");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [hotelDest, setHotelDest] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearching(true);
    setTimeout(() => {
      setSearching(false);
      setSearchResults(true);
    }, 1200);
  };

  const tabs = [
    { id: "flight", label: "Flights", icon: <FaPlane /> },
    { id: "train", label: "Trains", icon: <FaTrain /> },
    { id: "bus", label: "Buses", icon: <FaBus /> },
    { id: "hotel", label: "Hotels", icon: <FaHotel /> }
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Inter', sans-serif", paddingBottom: "80px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", fontSize: isMobile ? "11px" : "13px", fontWeight: 700, color: C.textLight, marginBottom: "20px" }}>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <span 
                onClick={crumb.action} 
                style={{ cursor: crumb.action ? "pointer" : "default", color: crumb.action ? C.teal : C.textLight }}
                onMouseEnter={e => crumb.action && (e.target.style.textDecoration = "underline")}
                onMouseLeave={e => crumb.action && (e.target.style.textDecoration = "none")}
              >
                {crumb.label}
              </span>
              {idx < breadcrumbs.length - 1 && <span>/</span>}
            </React.Fragment>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <button onClick={onBack} style={{ background: "none", border: "none", color: C.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: "8px", borderRadius: "50%", transition: "background 0.2s" }} onMouseEnter={e => e.target.style.background = C.bgSecondary} onMouseLeave={e => e.target.style.background = "none"}>
            <FaArrowLeft size={18} />
          </button>
          <h2 style={{ margin: 0, fontSize: isMobile ? "20px" : "26px", fontWeight: 800, color: C.text }}>
            {t('sections.travelTransit', 'Travel & Transit Booking')}
          </h2>
        </div>

        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", borderBottom: `1px solid ${C.border}`, paddingBottom: "10px", overflowX: "auto" }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearchResults(null); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: activeTab === tab.id ? C.teal : "none",
                color: activeTab === tab.id ? "#fff" : C.text,
                border: activeTab === tab.id ? `1px solid ${C.teal}` : `1px solid ${C.border}`,
                padding: "8px 16px",
                borderRadius: "10px",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.2s",
                whiteSpace: "nowrap"
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {searchResults ? (
          <div style={{ background: C.card, padding: "30px", borderRadius: "20px", border: `1px solid ${C.border}`, textAlign: "center", boxShadow: "0 8px 24px rgba(0,0,0,0.05)" }}>
            <h3 style={{ margin: "0 0 10px 0", color: C.text, fontSize: "18px", fontWeight: 800 }}>Search Results Found!</h3>
            <p style={{ margin: "0 0 20px 0", color: C.textLight, fontSize: "14px" }}>We found several premium options for your request. Proceeding to checkout partner gateway...</p>
            <button onClick={() => setSearchResults(null)} style={{ background: C.teal, color: "#fff", border: "none", padding: "10px 24px", borderRadius: "10px", fontWeight: 700, cursor: "pointer" }}>
              Modify Search
            </button>
          </div>
        ) : (
          <form onSubmit={handleSearch} style={{ background: C.card, padding: "24px", borderRadius: "20px", border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: "16px", boxShadow: "0 8px 24px rgba(0,0,0,0.02)" }}>
            {activeTab !== "hotel" ? (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: C.textLight, marginBottom: "6px" }}>From</label>
                  <input 
                    type="text" 
                    value={from}
                    onChange={e => setFrom(e.target.value)}
                    placeholder="Origin City / Station" 
                    required
                    style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: "14px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: C.textLight, marginBottom: "6px" }}>To</label>
                  <input 
                    type="text" 
                    value={to}
                    onChange={e => setTo(e.target.value)}
                    placeholder="Destination City / Station" 
                    required
                    style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: "14px", boxSizing: "border-box" }}
                  />
                </div>
              </div>
            ) : (
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: C.textLight, marginBottom: "6px" }}>Destination or Hotel Name</label>
                <input 
                  type="text" 
                  value={hotelDest}
                  onChange={e => setHotelDest(e.target.value)}
                  placeholder="e.g. Mumbai, Goa" 
                  required
                  style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: "14px", boxSizing: "border-box" }}
                />
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: C.textLight, marginBottom: "6px" }}>Travel Date</label>
              <input 
                type="date" 
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: "14px", boxSizing: "border-box" }}
              />
            </div>

            <button 
              type="submit" 
              disabled={searching}
              style={{ width: "100%", background: C.teal, color: "#fff", border: "none", padding: "14px", borderRadius: "12px", fontSize: "15px", fontWeight: 800, cursor: "pointer", marginTop: "10px" }}
            >
              {searching ? "Searching..." : `Search ${tabs.find(t => t.id === activeTab).label}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function Home({ onNavigate }) {
  const { C } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [bannerIndex, setBannerIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [verifyCard, setVerifyCard] = useState(null);
  const [isTickerPaused, setIsTickerPaused] = useState(false);
  const [dynamicBanners, setDynamicBanners] = useState([]);
  const [services, setServices] = useState([]);
  const [settings, setSettings] = useState({});
  const [cmsSections, setCmsSections] = useState([]);
  const [dynamicProducts, setDynamicProducts] = useState([]);

  const getSectionItems = (sectionKey, fallbackData) => {
    const cmsSection = cmsSections.find(s => s.key === sectionKey);
    if (cmsSection && cmsSection.is_active && cmsSection.items?.length > 0) {
      return cmsSection.items.map(item => {
        if (typeof item.icon === 'string') {
          const IconComp = FaIcons[item.icon] || FaIcons.FaRegCreditCard;
          return { ...item, icon: <IconComp /> };
        }
        return item;
      });
    }
    return fallbackData;
  };

  const searchItem = useSearchStore(state => state.searchItem);
  const setSearchItem = useSearchStore(state => state.setSearchItem);

  useEffect(() => {
    const fetchBannersSettingsAndCms = async () => {
      const baseUrl = import.meta.env.VITE_API_URL || "https://api.gharkapaisa.in";

      // 1) Fetch banners
      try {
        const cachedBanners = sessionStorage.getItem('gkp_banners');
        if (cachedBanners) {
          setDynamicBanners(JSON.parse(cachedBanners));
        } else {
          const res = await fetch(`${baseUrl}/api/v1/banners`);
          const data = await res.json();
          if (data && data.success && data.data?.length > 0) {
            setDynamicBanners(data.data);
            sessionStorage.setItem('gkp_banners', JSON.stringify(data.data));
          }
        }
      } catch (err) {
        console.warn("Failed to load banners:", err);
      }

      // 2) Fetch Settings
      try {
        const cachedSettings = sessionStorage.getItem('gkp_settings');
        if (cachedSettings) {
          setSettings(JSON.parse(cachedSettings));
        } else {
          const res = await fetch(`${baseUrl}/api/v1/settings`);
          const data = await res.json();
          if (data && data.success) {
            setSettings(data.data);
            sessionStorage.setItem('gkp_settings', JSON.stringify(data.data));
          }
        }
      } catch (err) {
        console.warn("Failed to load settings:", err);
      }

      // 3) Fetch CMS Sections
      try {
        const cachedCms = sessionStorage.getItem('gkp_cms');
        if (cachedCms) {
          setCmsSections(JSON.parse(cachedCms));
        } else {
          const res = await fetch(`${baseUrl}/api/v1/cms/sections`);
          const data = await res.json();
          if (data && data.success && data.data?.length > 0) {
            setCmsSections(data.data);
            sessionStorage.setItem('gkp_cms', JSON.stringify(data.data));
          }
        }
      } catch (err) {
        console.warn("Failed to load CMS:", err);
      }

      // 4) Fetch all products to create bank details
      try {
        const cachedProducts = sessionStorage.getItem('gkp_all_products');
        if (cachedProducts) {
          setDynamicProducts(JSON.parse(cachedProducts));
        } else {
          const res = await fetch(`${baseUrl}/api/v1/products`);
          const data = await res.json();
          if (data && data.success && data.data?.length > 0) {
            setDynamicProducts(data.data);
            sessionStorage.setItem('gkp_all_products', JSON.stringify(data.data));
          }
        }
      } catch (err) {
        console.warn("Failed to load products for banks:", err);
      }

      // 5) Fetch active services
      try {
        const cachedServices = sessionStorage.getItem('gkp_services');
        if (cachedServices) {
          setServices(JSON.parse(cachedServices));
        } else {
          const resServices = await fetch(`${baseUrl}/api/v1/service-catalog`);
          const dataServices = await resServices.json();
          if (dataServices?.success) {
            setServices(dataServices.data);
            sessionStorage.setItem('gkp_services', JSON.stringify(dataServices.data));
          }
        }
      } catch (err) {
        console.warn("Failed to load services:", err);
      }
    };
    fetchBannersSettingsAndCms();
  }, []);

  useEffect(() => {
    const path = location.pathname;
    
    if (path === "/") {
      setActiveCategory(null);
      return;
    }
    
    // Parse /credit-cards/lifetime-free-credit-cards-ltf
    if (path === "/credit-cards/lifetime-free-credit-cards-ltf") {
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
    
    // Parse /credit-cards/:bankId-bank/:type
    const cardsSubMatch = path.match(/^\/credit-cards\/([^/]+)-bank\/([^/]+)$/);
    if (cardsSubMatch) {
      const bankId = cardsSubMatch[1];
      const typeParam = cardsSubMatch[2]; // co-brand or fd-based-cards
      const type = typeParam === "co-brand" ? "cobrand" : "fd";
      setActiveCategory({
        id: `${type}-${bankId}`,
        title: type === "cobrand" ? "Co-Brand" : "FD Based Cards",
        titleKey: type === "cobrand" ? "home.breadcrumbs.cobrand" : "home.breadcrumbs.fdBasedCards",
        parentId: `bank-${bankId}`,
        items: []
      });
      return;
    }

    // Parse /credit-cards/:bankId-bank
    const cardsMatch = path.match(/^\/credit-cards\/([^/]+)-bank$/);
    if (cardsMatch) {
      const bankId = cardsMatch[1];
      const bankItem = banksList.find(b => b.id === bankId);
      if (bankItem) {
        if (bankCardsDetails[bankId]) {
          setActiveCategory({
            id: `bank-${bankId}`,
            title: bankCardsDetails[bankId].title,
            titleKey: `${bankId}.title`,
            parentId: "credit-cards",
            type: "bank-detail",
            sections: bankCardsDetails[bankId].sections
          });
        } else {
          setActiveCategory({
            id: `bank-${bankId}`,
            title: bankItem.label,
            titleKey: `banks.${bankId}`,
            parentId: "credit-cards",
            items: [
              { id: `cobrand-${bankId}`, label: "Co-Brand", icon: <FaLaptopHouse /> },
              { id: `fd-${bankId}`, label: "FD Based Cards", icon: <FaUniversity /> }
            ]
          });
        }
      }
      return;
    }

    // Parse /attractive-cards-loans/:catParam
    const attractiveMatch = path.match(/^\/attractive-cards-loans\/([^/]+)$/);
    if (attractiveMatch) {
      const catParam = attractiveMatch[1];
      const attractiveIds = {
        "lifetime-free-cards": "ltf-cards",
        "cibil-loan": "cibil-loans",
        "loan-on-credit-card": "hdfc-cc-loan",
        "smart-emi-card": "smart-emi",
        "fd-backed-card": "secured-cards",
        "upi-credit-card": "upi-cards"
      };
      const catId = attractiveIds[catParam];
      const cat = attractiveCategories.find(c => c.id === catId);
      if (cat) {
        setActiveCategory({
          id: cat.id,
          title: cat.title,
          titleKey: `attractiveCards.${cat.id}`,
          parentId: "attractive-sections",
          type: "hierarchy",
          items: cat.items
        });
      }
      return;
    }

    // Parse /category/:categoryKey
    const categoryMatch = path.match(/^\/category\/([^/]+)$/);
    if (categoryMatch) {
      const categoryKey = categoryMatch[1];
      const categoryName = categoryKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      setActiveCategory({
        id: `category-${categoryKey}`,
        title: categoryName,
        parentId: categoryKey.includes("loan") ? "loans" : (categoryKey.includes("insurance") ? "insurance" : "credit-cards"),
        type: "dynamic-products",
        categoryKey: categoryKey
      });
      return;
    }

    // Direct path matchers
    if (path === "/loans") {
      setActiveCategory({ id: "loans", title: "Loans", titleKey: "sections.loans", items: getSectionItems("loans", loansData) });
    } else if (path === "/insurance") {
      setActiveCategory({ id: "insurance", title: "Insurance", titleKey: "sections.insurance", items: getSectionItems("insurance", insuranceData) });
    } else if (path === "/credit-cards") {
      setActiveCategory({ id: "credit-cards", title: "Credit Cards", titleKey: "home.breadcrumbs.creditCards", items: banksList });
    } else if (path === "/services") {
      setActiveCategory({ id: "services", title: "Services", titleKey: "sections.businessServices", items: getSectionItems("recharge", servicesData) });
    } else if (path === "/travel-transit") {
      setActiveCategory({ id: "travel-transit", title: "Travel & Transit", titleKey: "sections.travelTransit", items: getSectionItems("travel", travelTransitData) });
    } else if (path === "/attractive-cards-loans") {
      setActiveCategory({ id: "attractive-sections", title: "Attractive Cards & Loans", titleKey: "sections.attractiveCards", items: getSectionItems("attractive_cards", attractiveCategories) });
    } else if (path === "/money-transfer/fastag") {
      setActiveCategory({ id: "fastag", title: "FASTag Recharge", titleKey: "moneyTransfer.fastag", items: [] });
    } else if (path === "/travel-transit/flight-booking") {
      setActiveCategory({ id: "flight-booking", title: "Travel & Transit Booking", titleKey: "sections.travelTransit", items: [] });
    }
  }, [location.pathname]);

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
    "loan repay": loanRepayImg,
    "fastag": fastagImg
  };

  const travelTransitImages = {
    "flight": flightImg,
    "train": trainImg,
    "bus": busImg,
    "hotels": hotelImg
  };


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

  // Auto rotate banner slides (height 320px)
  const bannerSlides = dynamicBanners.length > 0 ? dynamicBanners.map(b => ({
    title: b.title,
    subtitle: b.subtitle,
    btnText: b.btn_text || 'Apply Now',
    bgImage: localBannerMap[b.image_url] || b.image_url,
    action: getBannerAction(b.title, b.image_url)
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
      title: t('home.banners.slide2.title', 'Business Loans'), 
      subtitle: t('home.banners.slide2.subtitle', 'Flexible repayment options for growing businesses'), 
      btnText: t('home.banners.slide2.btn', 'Check Eligibility'),
      bgImage: loanBanner,
      action: () => navigate("/loans")
    },
    { 
      title: t('home.banners.slide3.title', 'Insurance Plans'), 
      subtitle: t('home.banners.slide3.subtitle', 'Comprehensive health, life and general insurance cover'), 
      btnText: t('home.banners.slide3.btn', 'Get Quotes'),
      bgImage: insuranceBanner,
      action: () => navigate("/insurance")
    },
    { 
      title: t('home.banners.slide4.title', 'EMI Cards'), 
      subtitle: t('home.banners.slide4.subtitle', 'Convert purchases to no-cost EMIs instantly'), 
      btnText: t('home.banners.slide4.btn', 'Get EMI Card'),
      bgImage: emiBanner,
      action: () => navigate("/attractive-cards-loans/smart-emi-card")
    },
    { 
      title: t('home.banners.slideEmiNew.title', 'New EMI Schemes'), 
      subtitle: t('home.banners.slideEmiNew.subtitle', 'Convert your spends into easy EMIs'), 
      btnText: t('home.banners.slideEmiNew.btn', 'Explore EMI'),
      bgImage: emiNewBanner,
      action: () => navigate("/attractive-cards-loans/smart-emi-card")
    },
    { 
      title: t('home.banners.slide5.title', 'HDFC Pixel Credit Cards'), 
      subtitle: t('home.banners.slide5.subtitle', 'Customizable rewards on dining, shopping & entertainment'), 
      btnText: t('home.banners.slide5.btn', 'Explore Pixel Cards'),
      bgImage: hdfcBanner,
      action: () => navigate("/credit-cards/hdfc-bank")
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
          navigate("/credit-cards");
        } else if (searchItem.target.id === "loans") {
          navigate("/loans");
        } else if (searchItem.target.id === "insurance") {
          navigate("/insurance");
        } else if (searchItem.target.id === "services") {
          navigate("/services");
        } else if (searchItem.target.id === "ltf-detail-page") {
          navigate("/credit-cards/lifetime-free-credit-cards-ltf");
        } else if (searchItem.target.id.startsWith("bank-")) {
          const bankId = searchItem.target.id.split("-")[1];
          navigate(`/credit-cards/${bankId}-bank`);
        } else {
          const attractiveCat = attractiveCategories.find(c => c.id === searchItem.target.id);
          if (attractiveCat) {
            handleAttractiveCategoryClick(attractiveCat);
          } else if (searchItem.target.id === "attractive-sections") {
            navigate("/attractive-cards-loans");
          }
        }
      } else if (searchItem.type === "loan") {
        navigate("/loans");
      } else if (searchItem.type === "insurance") {
        navigate("/insurance");
      } else if (searchItem.type === "service") {
        navigate("/services");
      } else if (searchItem.type === "card") {
        if (searchItem.target.id === "ltf-detail-page") {
          navigate("/credit-cards/lifetime-free-credit-cards-ltf");
        } else if (searchItem.target.id.startsWith("bank-")) {
          const bankId = searchItem.target.id.split("-")[1];
          navigate(`/credit-cards/${bankId}-bank`);
        }
      } else if (searchItem.type === "info") {
        if (searchItem.target.id === "terms-and-conditions") {
          navigate("/terms-and-conditions");
        } else if (searchItem.target.id === "privacy-policy") {
          navigate("/privacy-policy");
        } else if (searchItem.target.id === "contact") {
          navigate("/contact");
        } else if (searchItem.target.id === "login") {
          navigate("/login");
        } else if (searchItem.target.id === "register") {
          navigate("/register");
        } else if (searchItem.target.id === "admin-login") {
          navigate("/admin-login");
        }
      } else if (searchItem.type === "partner") {
        if (searchItem.target.id === "partner-dashboard") {
          navigate("/partner/dashboard");
        } else if (searchItem.target.id === "partner-wallet") {
          navigate("/partner/wallet");
        } else if (searchItem.target.id === "partner-applications") {
          navigate("/partner/applications");
        } else if (searchItem.target.id === "partner-profile") {
          navigate("/partner/profile");
        }
      } else if (searchItem.type === "payment") {
        if (searchItem.target.id === "fastag") {
          navigate("/money-transfer/fastag");
        } else {
          navigate("/");
        }
      } else if (searchItem.type === "travel") {
        if (searchItem.target.id === "flight-booking") {
          navigate("/travel-transit/flight-booking");
        } else {
          navigate("/travel-transit");
        }
      }
      setSearchItem(null); // Reset store
    }
  }, [searchItem]);

  const handleBannerClick = () => {
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 5000);
  };

  const getBreadcrumbs = (cat) => {
    const crumbs = [{ label: t('home.breadcrumbs.home', 'Home'), action: () => navigate("/") }];
    
    if (!cat) return crumbs;

    if (cat.id.startsWith("cobrand-") || cat.id.startsWith("fd-")) {
      const bankId = cat.id.split("-")[1];
      const bankName = banksList.find(b => b.id === bankId)?.label || "Bank";
      crumbs.push({ 
        label: t('home.breadcrumbs.creditCards', 'Credit Cards'), 
        action: () => {
          if (location.pathname === "/credit-cards") {
            setActiveCategory({ id: "credit-cards", title: "Credit Cards", titleKey: "home.breadcrumbs.creditCards", items: banksList });
          } else {
            navigate("/credit-cards");
          }
        } 
      });
      crumbs.push({ 
        label: t('banks.' + bankId, bankName), 
        action: () => handleItemClick({ id: bankId, label: bankName }) 
      });
      crumbs.push({ label: cat.id.startsWith("cobrand-") ? t('home.breadcrumbs.cobrand', 'Co-Brand') : t('home.breadcrumbs.fdBasedCards', 'FD Based Cards'), action: null });
    } else if (cat.parentId === "credit-cards" || cat.id.startsWith("bank-")) {
      crumbs.push({ 
        label: t('home.breadcrumbs.creditCards', 'Credit Cards'), 
        action: () => {
          if (location.pathname === "/credit-cards") {
            setActiveCategory({ id: "credit-cards", title: "Credit Cards", titleKey: "home.breadcrumbs.creditCards", items: banksList });
          } else {
            navigate("/credit-cards");
          }
        } 
      });
      crumbs.push({ label: t(cat.titleKey || cat.title, cat.title), action: null });
    } else if (cat.id === "credit-cards") {
      crumbs.push({ label: t('home.breadcrumbs.creditCards', 'Credit Cards'), action: null });
    } else if (cat.id === "loans") {
      crumbs.push({ label: t('sections.loans', 'Loans'), action: null });
    } else if (cat.id === "insurance") {
      crumbs.push({ label: t('sections.insurance', 'Insurance'), action: null });
    } else if (cat.id === "services") {
      crumbs.push({ label: t('sections.businessServices', 'Services'), action: null });
    } else if (cat.id === "travel-transit") {
      crumbs.push({ label: t('sections.travelTransit', 'Travel & Transit'), action: null });
    } else if (cat.id === "attractive-sections") {
      crumbs.push({ label: t('sections.attractiveCards', 'Attractive Cards & Loans'), action: null });
    } else if (cat.parentId === "attractive-sections") {
      crumbs.push({ 
        label: t('sections.attractiveCards', 'Attractive Cards & Loans'), 
        action: () => {
          if (location.pathname === "/attractive-cards-loans") {
            setActiveCategory({ id: "attractive-sections", title: "Attractive Cards & Loans", titleKey: "sections.attractiveCards", items: attractiveCategories });
          } else {
            navigate("/attractive-cards-loans");
          }
        } 
      });
      crumbs.push({ label: t(cat.titleKey || cat.title, cat.title), action: null });
    } else {
      crumbs.push({ label: t('home.breadcrumbs.attractiveSections', 'Attractive Sections'), action: () => navigate("/") });
      crumbs.push({ label: t(cat.titleKey || cat.title, cat.title), action: null });
    }
    
    return crumbs;
  };

  const handleBottomNavClick = (id) => {
    if (id === "home") navigate("/");
    else if (id === "credit-cards") navigate("/credit-cards");
    else if (id === "loans") navigate("/loans");
    else if (id === "insurance") navigate("/insurance");
    else if (id === "investment") setActiveCategory({ id: "investment", title: "Investment", titleKey: "home.investment", items: [] });
    else if (id === "services") navigate("/services");
    else if (id === "travel-transit") navigate("/travel-transit");
  };

  const handleItemClick = (item) => {
    if (item.isApplyAction) {
      setVerifyCard({
        cardName: item.label,
        bankName: item.bankName || "Partner Bank",
        bankId: item.bankId || "unknown"
      });
      return;
    }

    if (activeCategory?.id === "ltf-detail-page") {
      const matchedLtf = ltfCards.find(c => c.name === item.label);
      if (matchedLtf) {
        const nameLower = matchedLtf.name.toLowerCase();
        let bankId = "unknown";
        let bankName = "Partner Bank";
        if (nameLower.includes("hdfc")) {
          bankId = "hdfc";
          bankName = "HDFC Bank";
        } else if (nameLower.includes("axis")) {
          bankId = "axis";
          bankName = "Axis Bank";
        } else if (nameLower.includes("bob") || nameLower.includes("baroda")) {
          bankId = "bob";
          bankName = "Bank of Baroda";
        } else if (nameLower.includes("federal") || nameLower.includes("scapia")) {
          bankId = "federal";
          bankName = "Federal Bank";
        } else if (nameLower.includes("au bank")) {
          bankId = "au";
          bankName = "AU Small Finance Bank";
        } else if (nameLower.includes("idfc")) {
          bankId = "idfc";
          bankName = "IDFC First Bank";
        } else if (nameLower.includes("indusind")) {
          bankId = "indusind";
          bankName = "IndusInd Bank";
        } else if (nameLower.includes("onecard")) {
          bankId = "onecard";
          bankName = "OneCard";
        } else if (nameLower.includes("sbm") || nameLower.includes("uni")) {
          bankId = "sbm";
          bankName = "SBM Bank";
        } else if (nameLower.includes("yes bank") || nameLower.includes("kiwi")) {
          bankId = "yes";
          bankName = "Yes Bank";
        }

        setVerifyCard({
          cardName: matchedLtf.name,
          bankName,
          bankId
        });
      }
      return;
    }

    if (item.id === "ltf-detail-page-trigger") {
      navigate("/credit-cards/lifetime-free-credit-cards-ltf");
      return;
    }
    const attractiveCat = attractiveCategories.find(c => c.id === item.id);
    if (attractiveCat) {
      handleAttractiveCategoryClick(attractiveCat);
      return;
    }
    if (item.id && (item.id.startsWith("cobrand-") || item.id.startsWith("fd-"))) {
      const parts = item.id.split("-");
      const type = parts[0] === "cobrand" ? "co-brand" : "fd-based-cards";
      const bankId = parts[1];
      navigate(`/credit-cards/${bankId}-bank/${type}`);
      return;
    }
    const bankItem = banksList.find(b => b.id === item.id);
    if (bankItem) {
      navigate(`/credit-cards/${bankItem.id}-bank`);
      return;
    }
    const categoryKey = mapToCategoryKey(item);
    if (categoryKey) {
      navigate(`/category/${categoryKey}`);
      return;
    }
  };

  const handleAttractiveCategoryClick = (cat) => {
    const attractiveSlugs = {
      "ltf-cards": "lifetime-free-cards",
      "cibil-loans": "cibil-loan",
      "hdfc-cc-loan": "loan-on-credit-card",
      "smart-emi": "smart-emi-card",
      "secured-cards": "fd-backed-card",
      "upi-cards": "upi-credit-card"
    };
    const slug = attractiveSlugs[cat.id] || cat.id;
    navigate(`/attractive-cards-loans/${slug}`);
  };

  const handleTrustBankClick = (bankId) => {
    const bankItem = banksList.find(b => b.id === bankId);
    if (bankItem) {
      handleItemClick(bankItem);
    }
  };

  const handleBack = () => {
    if (activeCategory?.parentId === "credit-cards") {
      if (location.pathname === "/credit-cards") {
        setActiveCategory({ id: "credit-cards", title: "Credit Cards", titleKey: "home.breadcrumbs.creditCards", items: banksList });
      } else {
        navigate("/credit-cards");
      }
    } else if (activeCategory?.parentId === "attractive-sections") {
      if (location.pathname === "/attractive-cards-loans") {
        setActiveCategory({ id: "attractive-sections", title: "Attractive Cards & Loans", titleKey: "sections.attractiveCards", items: attractiveCategories });
      } else {
        navigate("/attractive-cards-loans");
      }
    } else if (activeCategory?.parentId && activeCategory.parentId.startsWith("bank-")) {
      const bankId = activeCategory.parentId.replace("bank-", "");
      navigate(`/credit-cards/${bankId}-bank`);
    } else {
      navigate("/");
    }
  };

  if (activeCategory?.id === "fastag") {
    return (
      <>
        <FastagPage onBack={handleBack} C={C} isMobile={isMobile} breadcrumbs={getBreadcrumbs(activeCategory)} />
        {isMobile && <MobileBottomNav C={C} onNavigate={handleBottomNavClick} activeTab="home" />}
      </>
    );
  }

  if (activeCategory?.id === "flight-booking") {
    return (
      <>
        <TravelBookingPage onBack={handleBack} C={C} isMobile={isMobile} breadcrumbs={getBreadcrumbs(activeCategory)} />
        {isMobile && <MobileBottomNav C={C} onNavigate={handleBottomNavClick} activeTab="travel-transit" />}
      </>
    );
  }

  if (activeCategory) {
    return (
      <>
        <CategoryPage category={activeCategory} onBack={handleBack} onItemClick={handleItemClick} C={C} breadcrumbs={getBreadcrumbs(activeCategory)} />
        {isMobile && <MobileBottomNav C={C} onNavigate={handleBottomNavClick} activeTab={activeCategory.id || "home"} />}
        {verifyCard && (
          <CardApplyVerificationModal
            card={verifyCard}
            onClose={() => setVerifyCard(null)}
            C={C}
          />
        )}
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
        {settings.section_visibility_money_transfer !== "hide" && (
          <Section title={t('sections.moneyTransfer')} C={C}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(5, 1fr)" : "repeat(5, 1fr)", gap: isMobile ? "6px" : "16px", marginTop: "12px" }}>
              {getSectionItems("money_transfer", moneyTransfer).map((item, idx) => (
                <div key={idx}
                  onClick={() => {
                    const id = item.id;
                    if (id === "recharge" || id === "tomobile") navigate("/recharge");
                    else if (id === "electricity") navigate("/electricity");
                    else if (id === "loanrepay") navigate("/loan-repay");
                    else if (id === "fastag") navigate("/fastag");
                    else navigate("/money-transfer");
                  }}
                  style={{
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    alignItems: "center",
                    justifyContent: isMobile ? "center" : "flex-start",
                    gap: isMobile ? "6px" : "12px",
                    background: C.bgSecondary,
                    padding: isMobile ? "8px 4px" : "14px 16px",
                    borderRadius: isMobile ? "10px" : "14px",
                    cursor: "pointer",
                    border: `1px solid ${C.border}`,
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => !isMobile && (e.currentTarget.style.borderColor = C.teal)}
                  onMouseLeave={(e) => !isMobile && (e.currentTarget.style.borderColor = C.border)}
                >
                  <div style={{
                    width: isMobile ? "38px" : "58px",
                    height: isMobile ? "38px" : "58px",
                    borderRadius: isMobile ? "8px" : "12px",
                    background: C.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    padding: "4px",
                    boxSizing: "border-box",
                    border: `1px solid ${C.border}`,
                    fontSize: isMobile ? "16px" : "20px",
                    color: item.color || C.teal
                  }}>
                    {item.icon}
                  </div>
                  <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: "center", justifyContent: "center", flex: 1, minWidth: 0, width: "100%" }}>
                    <div style={{ fontSize: isMobile ? "9px" : "13px", fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%", textAlign: "center" }}>
                      {t('moneyTransfer.' + item.label.toLowerCase().replace(/[^a-z0-9]/g, ''), item.label)}
                    </div>
                    {!isMobile && (
                      <div style={{ color: C.teal, display: "flex", alignItems: "center", marginLeft: "6px" }}>
                        <FaChevronRight size={12} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── SECTION 8: Travel & Transit ── */}
        {settings.section_visibility_travel !== "hide" && (
          <Section title={t('sections.travelTransit')} C={C}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(4, 1fr)" : "repeat(4, 1fr)", gap: isMobile ? "6px" : "16px", marginTop: "12px" }}>
              {getSectionItems("travel", travelTransitData).map((item, idx) => {
                return (
                  <div key={idx} 
                    onClick={() => navigate("/travel-transit/flight-booking")}
                    style={{ 
                      display: "flex", 
                      flexDirection: isMobile ? "column" : "row", 
                      alignItems: "center", 
                      justifyContent: isMobile ? "center" : "flex-start",
                      gap: isMobile ? "6px" : "12px", 
                      background: C.bgSecondary, 
                      padding: isMobile ? "8px 4px" : "14px 16px", 
                      borderRadius: isMobile ? "10px" : "14px", 
                      cursor: "pointer", 
                      border: `1px solid ${C.border}`, 
                      transition: "all 0.2s ease" 
                    }} 
                    onMouseEnter={(e) => !isMobile && (e.currentTarget.style.borderColor = C.teal)} 
                    onMouseLeave={(e) => !isMobile && (e.currentTarget.style.borderColor = C.border)}
                  >
                    {/* Left side Icon Box */}
                    <div style={{ 
                      width: isMobile ? "38px" : "58px", 
                      height: isMobile ? "38px" : "58px", 
                      borderRadius: isMobile ? "8px" : "12px", 
                      background: C.bg, 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      flexShrink: 0,
                      padding: "4px",
                      boxSizing: "border-box",
                      border: `1px solid ${C.border}`,
                      fontSize: isMobile ? "16px" : "20px",
                      color: C.teal
                    }}>
                      {item.icon}
                    </div>
                    
                    {/* Right side Text & Arrow */}
                    <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: "center", justifyContent: "center", flex: 1, minWidth: 0, width: "100%" }}>
                      <div style={{ fontSize: isMobile ? "9px" : "13px", fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%", textAlign: "center" }}>
                        {t('travel-transitList.' + item.label.toLowerCase().replace(/[^a-z0-9]/g, ''), item.label)}
                      </div>
                      {!isMobile && (
                        <div style={{ color: C.teal, display: "flex", alignItems: "center", marginLeft: "6px" }}>
                          <FaChevronRight size={12} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* ── SECTION 2: Attractive Cards & Loans ── */}
        {settings.section_visibility_attractive_cards !== "hide" && (() => {
          const attractiveCards = [
            { id: "ltf-cards", title: "Lifetime Free Cards", desc: "Zero annual fees forever", img: ltfImg, gradient: "linear-gradient(135deg, #166397, #0F4F7A)" },
            { id: "cibil-loans", title: "CIBIL Loan", desc: "Personalized loan offers", img: cibilImg, gradient: "linear-gradient(135deg, #27ae60, #0c6b30)" },
            { id: "hdfc-cc-loan", title: "Loan on Credit Card", desc: "Instant cash on card limit", img: hdfcCcLoanImg, gradient: "linear-gradient(135deg, #8e44ad, #5b2c6f)" },
            { id: "smart-emi", title: "Smart EMI Card", desc: "No-cost EMI purchases", img: smartEmiImg, gradient: "linear-gradient(135deg, #f39c12, #d35400)" },
            { id: "secured-cards", title: "FD Backed Card", desc: "Build credit with FD", img: securedImg, gradient: "linear-gradient(135deg, #16a085, #117864)" },
            { id: "upi-cards", title: "UPI Credit Card", desc: "Pay via UPI with credit", img: upiImg, gradient: "linear-gradient(135deg, #c0392b, #962d22)" },
          ];
          const doubled = [...attractiveCards, ...attractiveCards];
          const cardW = isMobile ? 160 : 220;
          const gap = 16;
          const totalW = attractiveCards.length * (cardW + gap);
          return (
          <Section 
            title={t('sections.attractiveCards')} 
            viewAllLabel={t('home.seeAll', 'See All')}
            onViewAll={() => navigate("/attractive-cards-loans")}
            C={C}
          >
            <style>{`
              @keyframes attractive-scroll {
                0% { transform: translateX(0); }
                100% { transform: translateX(-${totalW}px); }
              }
              .attractive-carousel {
                display: flex; gap: ${gap}px; width: max-content;
                animation: attractive-scroll ${attractiveCards.length * 6}s linear infinite;
              }
              .attractive-carousel.paused { animation-play-state: paused; }
              .attractive-card {
                width: ${cardW}px; flex-shrink: 0; border-radius: 18px; overflow: hidden;
                cursor: pointer; transition: all 0.35s cubic-bezier(.4,0,.2,1);
                position: relative; display: flex; flex-direction: column; align-items: stretch;
                background: ${C.bgSecondary}; border: 1px solid ${C.border};
                padding: ${isMobile ? '8px' : '12px'};
                gap: 8px;
                height: ${isMobile ? '190px' : '250px'};
                box-sizing: border-box;
              }
              .attractive-card:hover {
                transform: translateY(-4px) scale(1.02);
                box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                border-color: ${C.teal};
              }
              .attractive-card-img-container {
                width: 100%; height: ${isMobile ? '90px' : '130px'}; border-radius: 12px; overflow: hidden;
                display: flex; align-items: center; justify-content: center; flex-shrink: 0;
              }
              .attractive-card-img {
                width: 100%; height: 100%; object-fit: contain; display: block;
                transition: transform 0.5s ease;
              }
              .attractive-card:hover .attractive-card-img { transform: scale(1.06); }
              .attractive-card-text-container {
                width: 100%; flex: 1; display: flex; flex-direction: column; justify-content: flex-start; gap: 4px;
                text-align: left; padding: 4px 2px 0 2px;
              }
              .attractive-card-title {
                color: ${C.text}; font-weight: 800; font-size: ${isMobile ? '12.5px' : '15px'};
                line-height: 1.25; margin: 0;
              }
              .attractive-card-desc {
                color: ${C.textLight}; font-size: ${isMobile ? '10px' : '11.5px'};
                font-weight: 500; margin: 0; line-height: 1.3;
              }
            `}</style>
            <div 
              onMouseEnter={() => setIsTickerPaused(true)}
              onMouseLeave={() => setIsTickerPaused(false)}
              onTouchStart={() => setIsTickerPaused(true)}
              onTouchEnd={() => setIsTickerPaused(false)}
              style={{
                overflow: "hidden", width: "100%", padding: "8px 0", position: "relative",
                maskImage: "linear-gradient(to right, transparent 0%, white 4%, white 96%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(to right, transparent 0%, white 4%, white 96%, transparent 100%)"
              }}
            >
              <div className={`attractive-carousel ${isTickerPaused ? "paused" : ""}`}>
                {doubled.map((card, idx) => (
                  <div 
                    key={`${card.id}-${idx}`} 
                    className="attractive-card"
                    onClick={() => {
                      const slugs = { "ltf-cards":"lifetime-free-cards","cibil-loans":"cibil-loan","hdfc-cc-loan":"loan-on-credit-card","smart-emi":"smart-emi-card","secured-cards":"fd-backed-card","upi-cards":"upi-credit-card" };
                      navigate(`/attractive-cards-loans/${slugs[card.id] || card.id}`);
                    }}
                  >
                    {/* Top Div: Image Container */}
                    <div className="attractive-card-img-container">
                      <img src={card.img} alt={card.title} className="attractive-card-img" />
                    </div>

                    {/* Bottom Div: Text Container */}
                    <div className="attractive-card-text-container">
                      <h3 className="attractive-card-title">{t('attractiveCards.' + card.id, card.title)}</h3>
                      <p className="attractive-card-desc">{card.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Section>
          );
        })()}

        {/* ── SECTION 3: Popular Credit Cards ── */}
        {settings.section_visibility_attractive_cards !== "hide" && !isMobile && (
          <Section 
            title={t('sections.popularCards')} 
            viewAllLabel={t('popularCardsList.viewAll', 'View All Cards')} 
            onViewAll={() => navigate("/credit-cards")}
            C={C}
          >
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "16px" }}>
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
                      onClick={() => navigate("/credit-cards")}
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
        )}

        {/* ── SECTION 4: Popular Credit Card Banks ── */}
        <Section title={t('sections.popularBanks')} C={C}>
          <ResponsiveGrid C={C} items={banksList} onSeeMore={() => navigate("/credit-cards")} onItemClick={handleItemClick} />
        </Section>

        {/* ── SECTION 5: Loans ── */}
        {settings.section_visibility_attractive_cards !== "hide" && (
          <Section title={t('sections.loans')} C={C}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(4, 1fr)" : "repeat(6, 1fr)", gap: "10px" }}>
              {((isMobile && getSectionItems("loans", loansData).length > 8) ? getSectionItems("loans", loansData).slice(0, 7) : getSectionItems("loans", loansData)).map((item, idx) => (
                <div key={idx}
                  onClick={() => {
                    const key = mapToCategoryKey(item);
                    if (key) navigate(`/category/${key}`);
                    else handleBottomNavClick("loans");
                  }}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    background: C.bgSecondary, padding: isMobile ? "10px 4px" : "16px 8px", borderRadius: "12px",
                    border: `1px solid ${C.border}`, textAlign: "center", gap: isMobile ? "4px" : "8px", cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = C.teal}
                  onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                >
                  <div style={{ color: C.teal, fontSize: isMobile ? "18px" : "22px" }}>{item.icon}</div>
                  <div style={{ fontSize: isMobile ? "10px" : "12px", fontWeight: 700, color: C.text, lineHeight: 1.2 }}>
                    {t('loansList.' + item.label.toLowerCase().replace(/[^a-z0-9]/g, ''), item.label)}
                  </div>
                </div>
              ))}
              {isMobile && getSectionItems("loans", loansData).length > 8 && (
                <div
                  onClick={() => handleBottomNavClick("loans")}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    background: C.bgSecondary, padding: "10px 4px", borderRadius: "12px",
                    border: `1px solid ${C.border}`, textAlign: "center", gap: "4px", cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = C.teal}
                  onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                >
                  <div style={{ color: C.teal, fontSize: "18px" }}><FaChevronRight /></div>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: C.text, lineHeight: 1.2 }}>
                    {t('home.seeMore', 'See More')}
                  </div>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* ── SECTION 6: Insurance ── */}
        {settings.section_visibility_insurance !== "hide" && (
          <Section title={t('sections.insurance')} C={C}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: "10px" }}>
              {getSectionItems("insurance", insuranceData).map((item, idx) => (
                <div key={idx}
                  onClick={() => {
                    const key = mapToCategoryKey(item);
                    if (key) navigate(`/category/${key}`);
                    else handleBottomNavClick("insurance");
                  }}
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
        )}

        {/* ── SECTION 7: Business Services ── */}
        {settings.section_visibility_recharge !== "hide" && (
          <Section title={t('sections.businessServices')} C={C}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(4, 1fr)" : "repeat(8, 1fr)", gap: "10px" }}>
              {getSectionItems("recharge", servicesData).map((item, idx) => (
                <div key={idx}
                  onClick={() => {
                    const key = mapToCategoryKey(item);
                    if (key) navigate(`/category/${key}`);
                    else handleBottomNavClick("services");
                  }}
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
        )}



        {/* ── SECTION 9: Partner Banks (Logo strip) ── */}
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
              <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: 800, color: "#ffffff" }}>{t('footer.contactUs', 'Contact Us')}</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <span onClick={() => navigate("/contact")} style={{ fontSize: "13px", color: "#ffffff", opacity: 0.85, cursor: "pointer" }}>{t('footer.contactUs', 'Contact Us')}</span>
              </div>
            </div>

            <div>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: 800, color: "#ffffff" }}>{t('footer.support', 'Support')}</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <span onClick={() => navigate("/privacy-policy")} style={{ fontSize: "13px", color: "#ffffff", opacity: 0.85, cursor: "pointer" }}>{t('footer.privacy', 'Privacy Policy')}</span>
                <span onClick={() => navigate("/terms-and-conditions")} style={{ fontSize: "13px", color: "#ffffff", opacity: 0.85, cursor: "pointer" }}>{t('footer.terms', 'Terms & Conditions')}</span>
                <span onClick={() => navigate("/contact")} style={{ fontSize: "13px", color: "#ffffff", opacity: 0.85, cursor: "pointer" }}>{t('footer.refund', 'Refund Policy')}</span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: "20px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", fontSize: "12px", color: "#ffffff", opacity: 0.7 }}>
            <span>@2026 OIT_stack</span>
          </div>
        </div>


      </div>
      
      {/* Show Bottom Nav only on Mobile */}
      {isMobile && <MobileBottomNav C={C} onNavigate={handleBottomNavClick} activeTab="home" />}
      {verifyCard && (
        <CardApplyVerificationModal
          card={verifyCard}
          onClose={() => setVerifyCard(null)}
          C={C}
        />
      )}
    </div>
  );
}
