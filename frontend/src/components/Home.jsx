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



      {/* Main Single Offer Banner */}

      <div className="offer-container" style={{ display: 'block' }}>
        <div className="offer-card" style={{ width: '100%', padding: '30px 20px', textAlign: 'center', background: 'linear-gradient(135deg, #0d6efd, #0a58ca)', boxShadow: '0 8px 20px rgba(13, 110, 253, 0.2)' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>Exclusive Partner Offer</h2>
          <p style={{ fontSize: '15px', marginBottom: '20px', opacity: 0.9 }}>Join GharKaPaisa today and earn guaranteed payouts on every successful lead!</p>
          <button style={{ background: '#fff', color: '#0d6efd', border: 'none', padding: '12px 24px', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
            Start Earning Now
          </button>
        </div>
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
