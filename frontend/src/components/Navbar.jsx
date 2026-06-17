import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaSearch } from 'react-icons/fa';
import './Navbar.css';
import logo from '../logo.png';
import { ThemeToggle, useTheme } from './Partner/ThemeContext';
import { useSearchStore } from '../store/searchStore';
import LanguageSwitcher from './LanguageSwitcher';

const searchCatalog = [
  // Categories/Banks
  { type: "category", label: "Lifetime Free Credit Cards (LTF)", target: { id: "ltf-detail-page" } },
  { type: "category", label: "CIBIL Based Loan", target: { id: "cibil-loans" } },
  { type: "category", label: "Loan on credit card", target: { id: "hdfc-cc-loan" } },
  { type: "category", label: "Smart Emi on hdfc credit card", target: { id: "smart-emi" } },
  { type: "category", label: "FD/Secured card(no Cibil required)", target: { id: "secured-cards" } },
  { type: "category", label: "HDFC Express Loan", target: { id: "hdfc-express" } },
  { type: "category", label: "All Rupey Upi credit card", target: { id: "upi-cards" } },
  
  { type: "category", label: "HDFC Bank Credit Cards", target: { id: "bank-hdfc" } },
  { type: "category", label: "SBI Card Credit Cards", target: { id: "bank-sbi" } },
  { type: "category", label: "Axis Bank Credit Cards", target: { id: "bank-axis" } },
  { type: "category", label: "BOB Credit Cards", target: { id: "bank-bob" } },
  
  { type: "category", label: "Credit Cards (All Banks)", target: { id: "credit-cards" } },
  { type: "category", label: "Loans", target: { id: "loans" } },
  { type: "category", label: "Insurance", target: { id: "insurance" } },
  { type: "category", label: "Services", target: { id: "services" } },

  // Loans items
  { type: "loan", label: "Personal Loan", target: { id: "loans" } },
  { type: "loan", label: "Home Loan", target: { id: "loans" } },
  { type: "loan", label: "Business Loan", target: { id: "loans" } },
  { type: "loan", label: "Education Loan", target: { id: "loans" } },
  { type: "loan", label: "Car Loan", target: { id: "loans" } },
  { type: "loan", label: "Used Car Loan", target: { id: "loans" } },
  { type: "loan", label: "Instant Loan", target: { id: "loans" } },

  // Insurance items
  { type: "insurance", label: "Health Insurance", target: { id: "insurance" } },
  { type: "insurance", label: "Life Insurance", target: { id: "insurance" } },
  { type: "insurance", label: "General Insurance", target: { id: "insurance" } },
  { type: "insurance", label: "Loan Protection Insurance", target: { id: "insurance" } },

  // Business Services items
  { type: "service", label: "GST Returns", target: { id: "services" } },
  { type: "service", label: "Company Registration", target: { id: "services" } },
  { type: "service", label: "ITR Filing", target: { id: "services" } },
  { type: "service", label: "PF & ESIC", target: { id: "services" } },
  { type: "service", label: "TDS Filing", target: { id: "services" } },
  { type: "service", label: "Trade License", target: { id: "services" } },
  { type: "service", label: "MSME Registration", target: { id: "services" } },
  { type: "service", label: "DSC Services", target: { id: "services" } },

  // Individual Credit Cards (HDFC)
  { type: "card", label: "HDFC Freedom Credit Card", target: { id: "bank-hdfc" } },
  { type: "card", label: "HDFC MoneyBack+ Credit Card", target: { id: "bank-hdfc" } },
  { type: "card", label: "HDFC Millennia Credit Card", target: { id: "bank-hdfc" } },
  { type: "card", label: "HDFC Regalia Gold Credit Card", target: { id: "bank-hdfc" } },
  { type: "card", label: "HDFC BizGrow Credit Card", target: { id: "bank-hdfc" } },
  { type: "card", label: "HDFC BizPower Credit Card", target: { id: "bank-hdfc" } },
  { type: "card", label: "HDFC BizFirst Credit Card", target: { id: "bank-hdfc" } },
  { type: "card", label: "HDFC Pixel Play Credit Card", target: { id: "bank-hdfc" } },
  { type: "card", label: "HDFC Pixel Go Credit Card", target: { id: "bank-hdfc" } },
  { type: "card", label: "HDFC Tata Neu Plus Credit Card", target: { id: "bank-hdfc" } },
  { type: "card", label: "HDFC Tata Neu Infinity Credit Card", target: { id: "bank-hdfc" } },
  { type: "card", label: "Swiggy HDFC Bank Credit Card", target: { id: "bank-hdfc" } },
  { type: "card", label: "IndianOil HDFC Bank Credit Card", target: { id: "bank-hdfc" } },
  { type: "card", label: "IRCTC HDFC Bank Credit Card", target: { id: "bank-hdfc" } },
  { type: "card", label: "HDFC Diners Club Privilege Credit Card", target: { id: "bank-hdfc" } },
  { type: "card", label: "HDFC Diners Club Black Credit Card", target: { id: "bank-hdfc" } },
  { type: "card", label: "Marriott Bonvoy HDFC Bank Credit Card", target: { id: "bank-hdfc" } },
  { type: "card", label: "Shoppers Stop Black HDFC Bank Credit Card", target: { id: "bank-hdfc" } },
  { type: "card", label: "Shoppers Stop Credit Card", target: { id: "bank-hdfc" } },

  // Individual Credit Cards (SBI)
  { type: "card", label: "SimplySAVE SBI Credit Card", target: { id: "bank-sbi" } },
  { type: "card", label: "SimplyCLICK SBI Credit Card", target: { id: "bank-sbi" } },
  { type: "card", label: "BPCL SBI Card OCTANE", target: { id: "bank-sbi" } },
  { type: "card", label: "BPCL SBI Card", target: { id: "bank-sbi" } },
  { type: "card", label: "SBI Card PULSE", target: { id: "bank-sbi" } },
  { type: "card", label: "Tata Neu SBI Card", target: { id: "bank-sbi" } },
  { type: "card", label: "IRCTC SBI Card Premier", target: { id: "bank-sbi" } },
  { type: "card", label: "Apollo SBI Card", target: { id: "bank-sbi" } },
  { type: "card", label: "Air India SBI Signature Card", target: { id: "bank-sbi" } },
  { type: "card", label: "Air India SBI Platinum Card", target: { id: "bank-sbi" } },
  { type: "card", label: "Club Vistara SBI Prime Card", target: { id: "bank-sbi" } },
  { type: "card", label: "Club Vistara SBI Card", target: { id: "bank-sbi" } },

  // Individual Credit Cards (Axis)
  { type: "card", label: "Axis Bank Neo Credit Card", target: { id: "bank-axis" } },
  { type: "card", label: "Axis Bank ACE Credit Card", target: { id: "bank-axis" } },
  { type: "card", label: "Axis Bank MY Zone Credit Card", target: { id: "bank-axis" } },
  { type: "card", label: "Axis Bank Rewards Credit Card", target: { id: "bank-axis" } },
  { type: "card", label: "Axis Bank Flipkart Credit Card", target: { id: "bank-axis" } },
  { type: "card", label: "Axis Bank IndianOil Credit Card", target: { id: "bank-axis" } },
  { type: "card", label: "Axis Bank Atlas Credit Card", target: { id: "bank-axis" } },
  { type: "card", label: "Axis Bank Select Credit Card", target: { id: "bank-axis" } },
  { type: "card", label: "Axis Bank Privilege Credit Card", target: { id: "bank-axis" } },
  { type: "card", label: "Axis Bank Vistara Credit Card", target: { id: "bank-axis" } },
  { type: "card", label: "Axis Bank Vistara Infinite Credit Card", target: { id: "bank-axis" } },
  { type: "card", label: "Axis Bank Aura Credit Card", target: { id: "bank-axis" } },

  // Individual Credit Cards (BOB)
  { type: "card", label: "BOB Eterna Credit Card", target: { id: "bank-bob" } },
  { type: "card", label: "BOB Premier Credit Card", target: { id: "bank-bob" } },
  { type: "card", label: "BOB Easy Credit Card", target: { id: "bank-bob" } },
  { type: "card", label: "BOB Select Credit Card", target: { id: "bank-bob" } },
  { type: "card", label: "BOB HPCL Energy Card", target: { id: "bank-bob" } },
  { type: "card", label: "BOB Prime Credit Card", target: { id: "bank-bob" } },
  { type: "card", label: "BOB Snapdeal Credit Card", target: { id: "bank-bob" } },

  // Lifetime Free Credit Cards (LTF Detail Page)
  { type: "card", label: "Federal Bank Scapia Credit Card", target: { id: "ltf-detail-page" } },
  { type: "card", label: "AU Bank SPONT Credit Card", target: { id: "ltf-detail-page" } },
  { type: "card", label: "Kiwi RuPay Credit Card", target: { id: "ltf-detail-page" } },
  { type: "card", label: "IDFC FIRST Classic Credit Card", target: { id: "ltf-detail-page" } },
  { type: "card", label: "IDFC FIRST Millennia Credit Card", target: { id: "ltf-detail-page" } },
  { type: "card", label: "IDFC FIRST Select Credit Card", target: { id: "ltf-detail-page" } },
  { type: "card", label: "IndusInd Legend Credit Card", target: { id: "ltf-detail-page" } },
  { type: "card", label: "OneCard Metal Credit Card", target: { id: "ltf-detail-page" } },
  { type: "card", label: "SBM Uni Card", target: { id: "ltf-detail-page" } },
  { type: "card", label: "Federal Bank OneCard", target: { id: "ltf-detail-page" } },
  { type: "card", label: "Yes Bank Paisabazaar Step Up Credit Card", target: { id: "ltf-detail-page" } },
];

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { C } = useTheme();
  const { t } = useTranslation();
  const setSearchItem = useSearchStore(state => state.setSearchItem);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const path = location.pathname.toLowerCase().replace(/\/$/, '');
  const isAuthPage = path === '/login' || path === '/register';

  const toggleLink = () => {
    const next = !menuOpen;
    setMenuOpen(next);
    document.body.classList.toggle('no-scroll', next);
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest(".navbar-search-container")) {
        setShowDropdown(false);
      }
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const handleResultClick = (item) => {
    setSearchItem(item);
    setSearchQuery("");
    setShowDropdown(false);
    navigate("/");
  };

  const filteredCatalog = searchQuery.trim() === ""
    ? []
    : searchCatalog.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <>
      <div id="mainOverlay" className={`overlay ${menuOpen ? 'active' : ''}`} onClick={toggleLink} />

      {/* Mobile Side Drawer */}
      <div id="nav-menu" className={`side-drawer ${menuOpen ? 'show1' : ''}`} style={{ background: C.bg }}>
        <button className="close-btn" onClick={toggleLink} style={{ filter: C.text === '#fff' ? 'invert(1)' : 'none' }}>
          <span></span>
          <span></span>
          <span></span>
        </button>
        <button onClick={() => { navigate('/admin-login'); toggleLink(); }}>
          {t('nav.admin', 'Admin')}
        </button>
        <button
          onClick={() =>
            window.location.href = 'https://gharkapaisa.in/dashboard'
          }
        >
          {t('nav.employee', 'Employee')}
        </button>
        {!isAuthPage && (
          <button onClick={() => { navigate('/login'); toggleLink(); }}>{t('nav.partner', 'Partner')}</button>
        )}
        <div className="mobile-widgets" style={{ marginTop: "24px", borderTop: `1px solid ${C.border}`, paddingTop: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: C.text, fontSize: "14px", fontWeight: 600 }}>{t('drawer.language', 'Language')}</span>
            <LanguageSwitcher />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: C.text, fontSize: "14px", fontWeight: 600 }}>{t('drawer.theme', 'Theme')}</span>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <nav className="navbar" style={{ background: C.card, borderBottom: `1px solid ${C.border}` }}>
        <div className="navbar-left" style={{ display: "flex", alignItems: "center", gap: "12px", flex: "0 0 auto" }}>
          <button id="toggle-Link" className={`hamburger ${menuOpen ? 'active' : ''}`} onClick={toggleLink} style={{ margin: 0, filter: C.text === '#fff' ? 'invert(1)' : 'none' }}>
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div onClick={() => navigate('/')} style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
            <img src={logo} alt="logo" className="logo" />
            <h1 style={{ color: C.text, margin: 0, fontSize: "22px", fontWeight: "bold" }}>GharKaPaisa</h1>
          </div>
        </div>

        {/* Search Bar Container */}
        <div className="navbar-search-container" style={{ position: "relative", flex: "1 1 auto", maxWidth: "450px", margin: "0 20px" }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <FaSearch style={{ position: "absolute", left: "12px", color: C.textLight }} />
            <input
              type="text"
              placeholder={t('searchPlaceholder', 'Search for cards, loans, insurance & services')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              style={{
                width: "100%",
                padding: "10px 16px 10px 36px",
                borderRadius: "10px",
                border: `1px solid ${C.border}`,
                background: C.bgSecondary,
                color: C.text,
                fontSize: "13px",
                outline: "none",
                transition: "all 0.2s"
              }}
            />
          </div>
          {showDropdown && filteredCatalog.length > 0 && (
            <div style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              marginTop: "6px",
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: "10px",
              maxHeight: "250px",
              overflowY: "auto",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              zIndex: 1000
            }}>
              {filteredCatalog.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleResultClick(item)}
                  style={{
                    padding: "12px 16px",
                    cursor: "pointer",
                    fontSize: "13px",
                    color: C.text,
                    borderBottom: idx < filteredCatalog.length - 1 ? `1px solid ${C.border}` : "none",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "background 0.2s"
                  }}
                  onMouseEnter={(e) => e.target.style.background = C.bgSecondary}
                  onMouseLeave={(e) => e.target.style.background = "transparent"}
                >
                  <span>{item.label}</span>
                  <span style={{ fontSize: "10px", color: C.textLight, textTransform: "uppercase", fontWeight: 700 }}>{item.type}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="navbar-right" style={{ display: "flex", alignItems: "center", gap: "10px", flex: "0 0 auto", justifyContent: "flex-end" }}>
          <button 
            onClick={() => navigate('/admin-login')}
            style={{ color: C.text, '--underline-color': C.teal }}
          >
            {t('nav.admin', 'Admin')}
          </button>
          <button
            onClick={() => window.location.href = 'https://gharkapaisa.in/dashboard'}
            style={{ color: C.text, '--underline-color': C.teal }}
          >
            {t('nav.employee', 'Employee')}
          </button>
          {!isAuthPage && (
            <button 
              onClick={() => navigate('/login')}
              style={{ color: C.text, '--underline-color': C.teal }}
            >
              {t('nav.partner', 'Partner')}
            </button>
          )}
          <div className="desktop-widgets" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;