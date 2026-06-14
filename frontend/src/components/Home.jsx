import React from "react";
import {
  FaCreditCard,
  FaMoneyBillWave,
  FaShieldAlt,
  FaChartLine,
  FaWallet,
  FaFileAlt,
  FaUniversity,
  FaEllipsisH,
  FaBell,
  FaUserCircle
} from "react-icons/fa";

import "./Home.css";

const services = [
  {
    title: "Credit Card",
    icon: <FaCreditCard />,
  },
  {
    title: "Loans",
    icon: <FaMoneyBillWave />,
  },
  {
    title: "Insurance",
    icon: <FaShieldAlt />,
  },
  {
    title: "Investment",
    icon: <FaChartLine />,
  },
  {
    title: "FD Cards",
    icon: <FaUniversity />,
  },
  {
    title: "Case Status",
    icon: <FaFileAlt />,
  },
  {
    title: "Wallet",
    icon: <FaWallet />,
  },
  {
    title: "See More",
    icon: <FaEllipsisH />,
  },
];

function Home() {
  return (
    <div className="home-dashboard">

      {/* Header */}

      <div className="header">
        <div className="menu">☰</div>

        <div className="logo">
          <img
            src="/logo.jpeg"
            alt="logo"
          />
          <h2>GharKaPaisa</h2>
        </div>

        <div className="header-right">
          <FaBell />
          <FaUserCircle />
        </div>
      </div>

      {/* Offer Banner */}

      <div className="offer-container">

        <div className="offer-card">
          <h3>HDFC Credit Card Offer</h3>
          <p>Earn payout upto ₹2500</p>
        </div>

        <div className="offer-card">
          <h3>Personal Loan Offer</h3>
          <p>Instant approval available</p>
        </div>

      </div>

      {/* Wallet */}

      <div className="wallet-card">

        <p className="wallet-title">
          Wallet Balance
        </p>

        <h1>₹1,25,000</h1>

        <div className="wallet-row">

          <div>
            <span>Approved</span>
            <h4>₹1,25,000</h4>
          </div>

          <div>
            <span>Withdrawable</span>
            <h4>₹80,000</h4>
          </div>

        </div>

        <button>
          View Wallet
        </button>

      </div>

      {/* Services */}

      <div className="service-section">

        <h3>Services</h3>

        <div className="service-grid">

          {services.map((item, index) => (
            <div className="service-card" key={index}>
              <div className="service-icon">
                {item.icon}
              </div>

              <p>{item.title}</p>
            </div>
          ))}

        </div>

      </div>

      {/* Footer */}

      <div className="footer-nav">

        <div>
          🏠
          <span>Dashboard</span>
        </div>

        <div>
          💳
          <span>Cards</span>
        </div>

        <div>
          💰
          <span>Loan</span>
        </div>

        <div>
          🛡
          <span>Insurance</span>
        </div>

        <div>
          📈
          <span>Investment</span>
        </div>

      </div>

    </div>
  );
}

export default Home;
