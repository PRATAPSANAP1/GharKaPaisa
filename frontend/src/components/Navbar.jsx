import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';
import logo from '../logo.jpeg';

const Navbar = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleLink = () => {
    const next = !menuOpen;
    setMenuOpen(next);
    document.body.classList.toggle('no-scroll', next);
  };

  return (
    <>
      <div id="mainOverlay" className={`overlay ${menuOpen ? 'active' : ''}`} onClick={toggleLink} />

      {/* Mobile Side Drawer */}
      <div id="nav-menu" className={`side-drawer ${menuOpen ? 'show1' : ''}`}>
        <button className="close-btn" onClick={toggleLink}>
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
        <button onClick={() => { navigate('/login'); toggleLink(); }}>Partner Login</button>
      </div>

      <nav className="navbar">
        <div className="navbar-left" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button id="toggle-Link" className={`hamburger ${menuOpen ? 'active' : ''}`} onClick={toggleLink} style={{ margin: 0 }}>
            <span></span>
            <span></span>
            <span></span>
          </button>
          <img src={logo} alt="logo" className="logo" />
          <h1 style={{ color: "#0d47a1", margin: 0, fontSize: "22px", fontWeight: "bold" }}>GharKaPaisa</h1>
        </div>

        <div className="navbar-right">
          <button onClick={() => navigate('/admin-login')}>
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
          <button onClick={() => navigate('/login')}>Partner Login</button>
        </div>


      </nav>
    </>
  );
};

export default Navbar;