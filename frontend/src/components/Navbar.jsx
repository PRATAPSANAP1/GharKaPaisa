import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';
import logo from '../logo.jpeg';
import { ThemeToggle, useTheme } from './Partner/ThemeContext';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { C } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const path = location.pathname.toLowerCase().replace(/\/$/, '');
  const isAuthPage = path === '/login' || path === '/register';

  const toggleLink = () => {
    const next = !menuOpen;
    setMenuOpen(next);
    document.body.classList.toggle('no-scroll', next);
  };

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
          Admin Login
        </button>
        <button
          onClick={() =>
            window.location.href =
              'https://gharkapaisa.in/dashboard'
          }
        >
          Employee Login
        </button>
        {!isAuthPage && (
          <button onClick={() => { navigate('/login'); toggleLink(); }}>Partner Login</button>
        )}
      </div>

      <nav className="navbar" style={{ background: C.card, borderBottom: `1px solid ${C.border}` }}>
        <div className="navbar-left" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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

        <div className="navbar-right" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <ThemeToggle />
          <button 
            onClick={() => navigate('/admin-login')}
            style={{ color: C.text, '--underline-color': C.teal }}
          >
            Admin Login
          </button>
          <button
            onClick={() =>
              window.location.href =
                'https://gharkapaisa.in/dashboard'
            }
            style={{ color: C.text, '--underline-color': C.teal }}
          >
            Employee Login
          </button>
          {!isAuthPage && (
            <button 
              onClick={() => navigate('/login')}
              style={{ color: C.text, '--underline-color': C.teal }}
            >
              Partner Login
            </button>
          )}
        </div>


      </nav>
    </>
  );
};

export default Navbar;