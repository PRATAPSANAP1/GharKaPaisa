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
          Admin
        </button>
        <button
          onClick={() =>
            window.location.href = 'https://gharkapaisa.in/dashboard'
          }
        >
          Employee
        </button>
        {!isAuthPage && (
          <button onClick={() => { navigate('/login'); toggleLink(); }}>Partner</button>
        )}
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
          <LanguageSwitcher />
          <ThemeToggle />
          <button 
            onClick={() => navigate('/admin-login')}
            style={{ color: C.text, '--underline-color': C.teal }}
          >
            Admin
          </button>
          <button
            onClick={() => window.location.href = 'https://gharkapaisa.in/dashboard'}
            style={{ color: C.text, '--underline-color': C.teal }}
          >
            Employee
          </button>
          {!isAuthPage && (
            <button 
              onClick={() => navigate('/login')}
              style={{ color: C.text, '--underline-color': C.teal }}
            >
              Partner
            </button>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;