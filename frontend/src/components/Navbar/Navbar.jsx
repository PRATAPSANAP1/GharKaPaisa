import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaSearch, FaSignInAlt, FaUserPlus } from 'react-icons/fa';
import './Navbar.css';
import logo from '../../assets/logos/logo.png';
import { ThemeToggle, useTheme } from '../../contexts/ThemeContext';
import { useSearchStore } from '../../app/store/searchStore';
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher';
import { getApiV1Url } from '../../config/api';

const staticLinks = [
  { type: "info", label: "Terms and Conditions", target: { id: "terms-and-conditions" } },
  { type: "info", label: "Privacy Policy", target: { id: "privacy-policy" } },
  { type: "info", label: "Contact Us", target: { id: "contact" } },
  { type: "info", label: "Partner Login", target: { id: "login" } },
  { type: "info", label: "Partner Registration", target: { id: "register" } },
  { type: "info", label: "Admin Login", target: { id: "admin-login" } },
  { type: "partner", label: "Partner Dashboard", target: { id: "partner-dashboard" } },
  { type: "partner", label: "Partner Wallet & Balance", target: { id: "partner-wallet" } },
  { type: "partner", label: "Partner Applications & Status", target: { id: "partner-applications" } },
  { type: "partner", label: "Partner Profile & Bank Info", target: { id: "partner-profile" } },
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
  const [dynamicCatalog, setDynamicCatalog] = useState(staticLinks);

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

  useEffect(() => {
    const fetchCatalog = async () => {
      const cached = sessionStorage.getItem('gkp_catalog');
      if (cached) {
        setDynamicCatalog(JSON.parse(cached));
        return;
      }
      try {
        const res = await fetch(`${getApiV1Url()}/products?is_active=true&limit=200`);
        const data = await res.json();
        if (data?.success) {
          const fetchedItems = data.data.map(p => ({
            type: p.category.replace(/_/g, ' '),
            label: `${p.bank_name} ${p.name}`,
            desc: p.description || p.bank_code,
            target: { id: `product-${p.id}` }
          }));
          const catalog = [...fetchedItems, ...staticLinks];
          setDynamicCatalog(catalog);
          sessionStorage.setItem('gkp_catalog', JSON.stringify(catalog));
        }
      } catch (err) {
        console.error("Failed to load catalog", err);
      }
    };
    fetchCatalog();
  }, []);

  const filteredCatalog = searchQuery.trim() === ""
    ? []
    : dynamicCatalog.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.desc && item.desc.toLowerCase().includes(searchQuery.toLowerCase()))
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
        {!isAuthPage && (
          <>
            <button 
              id="drawer-login-button"
              onClick={() => { navigate('/login'); toggleLink(); }}
              style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", textAlign: "left", padding: "10px 16px", background: "transparent", border: "none", color: C.text, fontSize: "15px", fontWeight: 600, cursor: "pointer" }}
            >
              <FaSignInAlt /> {t('nav.login', 'Login')}
            </button>
            <button 
              id="drawer-register-button"
              onClick={() => { navigate('/register'); toggleLink(); }}
              style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", textAlign: "left", padding: "10px 16px", background: "transparent", border: "none", color: C.text, fontSize: "15px", fontWeight: 600, cursor: "pointer" }}
            >
              <FaUserPlus /> {t('nav.register', 'Register')}
            </button>
          </>
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
          {!isAuthPage && (
            <>
              <button 
                id="nav-login-button"
                onClick={() => navigate('/login')}
                className="nav-auth-btn nav-login-btn"
                style={{ color: C.text }}
                onMouseEnter={(e) => e.currentTarget.style.background = C.bgSecondary}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                title={t('nav.login', 'Login')}
              >
                <FaSignInAlt className="nav-btn-icon" />
                <span className="nav-btn-text">{t('nav.login', 'Login')}</span>
              </button>
              <button 
                id="nav-register-button"
                onClick={() => navigate('/register')}
                className="nav-auth-btn nav-register-btn"
                title={t('nav.register', 'Register')}
              >
                <FaUserPlus className="nav-btn-icon" />
                <span className="nav-btn-text">{t('nav.register', 'Register')}</span>
              </button>
            </>
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