import React, { useState } from 'react';
import './Navbar.css';
import logo from '../logo.jpeg';

const Navbar = ({ onAgentLoginClick }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleLink = () => {
    const next = !menuOpen;
    setMenuOpen(next);
    document.body.classList.toggle('no-scroll', next);
  };

  return (
    <>
      <div id="mainOverlay" className={`overlay ${menuOpen ? 'active' : ''}`} onClick={toggleLink} />

      <div id="nav-menu" className={`side-drawer ${menuOpen ? 'show1' : ''}`}>
        <button className="close-btn" onClick={toggleLink}>
          <span></span>
          <span></span>
          <span></span>
        </button>
        <button
          onClick={() =>
            window.location.href =
              'https://yohesa-test-three.vercel.app/dashboard'
          }
        >
          Admin Login
        </button>
        <button
          onClick={() =>
            window.location.href =
              'https://yohesa-test-three.vercel.app/dashboard'
          }
        >
          Employee Login
        </button>
        <button onClick={() => { onAgentLoginClick(); toggleLink(); }}>Agent Login</button>
      </div>

      <nav className="navbar">
        <div className="navbar-left">
          <img src={logo} alt="logo" className="logo" />
        </div>

        <div className="navbar-center">
          <h1>GharKaPaisa</h1>
        </div>

        <div className="navbar-right">
          <button
  onClick={() =>
    window.location.href =
      'https://yohesa-test-three.vercel.app/dashboard'
  }
>
  Admin Login
</button>
         <button
  onClick={() =>
    window.location.href =
      'https://yohesa-test-three.vercel.app/dashboard'
  }
>
  Employee Login
</button>
          <button onClick={onAgentLoginClick}>Agent Login</button>
        </div>

        <button id="toggle-Link" className={`hamburger ${menuOpen ? 'active' : ''}`} onClick={toggleLink}>
          <span></span>
          <span></span>
          <span></span>
        </button>
      </nav>
    </>
  );
};

export default Navbar;