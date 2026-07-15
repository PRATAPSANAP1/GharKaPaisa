import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  FaWallet, FaUniversity, FaHandHoldingUsd, FaShieldAlt,
  FaChartPie, FaEllipsisH, FaPlane, FaBolt, FaSearch,
  FaMobileAlt, FaTint, FaFire, FaPhone, FaTag, FaTv,
  FaQrcode, FaExchangeAlt, FaCreditCard, FaUser,
  FaHome, FaBriefcase, FaBuilding, FaGraduationCap, FaCoins,
  FaCar, FaMotorcycle, FaHeartbeat, FaLifeRing, FaGlobe,
  FaExclamationTriangle, FaClock, FaPiggyBank, FaCalendarAlt,
  FaUmbrella, FaGift, FaSubway, FaBus, FaHotel, FaUmbrellaBeach,
  FaPassport, FaCouch, FaTaxi, FaWifi, FaCity,
  FaChartBar, FaCalendar
} from 'react-icons/fa';

/* ── Catalog Data ────────────────────────────────────────────────── */
const serviceCatalog = {
  categories: [
    { id: 'money', name: 'Money Transfer & Payments', icon: FaWallet, color: '#4338CA' },
    { id: 'banks', name: 'Popular Credit Card Banks', icon: FaUniversity, color: '#4338CA' },
    { id: 'loans', name: 'Loans', icon: FaHandHoldingUsd, color: '#4338CA' },
    { id: 'insurance', name: 'Insurance', icon: FaShieldAlt, color: '#4338CA' },
    { id: 'invest', name: 'Accounts & Investments', icon: FaChartPie, color: '#4338CA' },
    { id: 'other', name: 'Other Services', icon: FaEllipsisH, color: '#4338CA' },
    { id: 'travel', name: 'Travel & Bookings', icon: FaPlane, color: '#4338CA' },
  ],
  services: [
    // Money Transfer & Payments
    { id: 'recharge', category: 'money', label: 'Recharge', icon: FaMobileAlt, color: '#7C3AED', route: '/cms/recharge' },
    { id: 'money-transfer', category: 'money', label: 'To Mobile', icon: FaExchangeAlt, color: '#22C55E', route: '/cms/money-transfer' },
    { id: 'loan-repay', category: 'money', label: 'Loans Repay', icon: FaHandHoldingUsd, color: '#F97316', route: '/cms/loan-repay' },
    { id: 'electricity', category: 'money', label: 'Electricity Bills', icon: FaBolt, color: '#F59E0B', route: '/cms/electricity' },
    { id: 'fastag', category: 'money', label: 'Fastag Recharge', icon: FaTag, color: '#16A34A', route: '/cms/fastag' },
    { id: 'dth', category: 'money', label: 'DTH Recharge', icon: FaTv, color: '#2563EB', route: '/cms/recharge' },
    { id: 'water', category: 'money', label: 'Water Bills', icon: FaTint, color: '#0EA5E9', route: '/cms/coming-soon' },
    { id: 'gas', category: 'money', label: 'Gas Booking', icon: FaFire, color: '#EF4444', route: '/cms/coming-soon' },
    { id: 'postpaid', category: 'money', label: 'Postpaid Bills', icon: FaPhone, color: '#8B5CF6', route: '/cms/coming-soon' },
    { id: 'landline', category: 'money', label: 'Landline Bills', icon: FaPhone, color: '#22C55E', route: '/cms/coming-soon' },

    // Popular Credit Card Banks
    { id: 'hdfc', category: 'banks', label: 'HDFC Bank', icon: FaUniversity, color: '#4F46E5', route: '/credit-cards/hdfc' },
    { id: 'sbi', category: 'banks', label: 'SBI Card', icon: FaUniversity, color: '#4F46E5', route: '/credit-cards/sbi' },
    { id: 'axis', category: 'banks', label: 'Axis Bank', icon: FaUniversity, color: '#4F46E5', route: '/credit-cards/axis' },
    { id: 'yes', category: 'banks', label: 'Yes Bank', icon: FaUniversity, color: '#4F46E5', route: '/credit-cards/yes-bank' },
    { id: 'icici', category: 'banks', label: 'ICICI Bank', icon: FaUniversity, color: '#4F46E5', route: '/credit-cards/icici' },
    { id: 'kotak', category: 'banks', label: 'Kotak Bank', icon: FaUniversity, color: '#4F46E5', route: '/credit-cards/kotak' },

    // Loans
    { id: 'personal-loan', category: 'loans', label: 'Personal Loan', icon: FaUser, color: '#22C55E', route: '/loans' },
    { id: 'home-loan', category: 'loans', label: 'Home Loan', icon: FaHome, color: '#2563EB', route: '/loans' },
    { id: 'business-loan', category: 'loans', label: 'Business Loan', icon: FaBriefcase, color: '#7C3AED', route: '/loans' },
    { id: 'lap', category: 'loans', label: 'Loan Against Property', icon: FaBuilding, color: '#F97316', route: '/loans' },
    { id: 'car-loan', category: 'loans', label: 'Car Loan', icon: FaCar, color: '#EF4444', route: '/loans' },
    { id: 'bike-loan', category: 'loans', label: 'Bike Loan', icon: FaMotorcycle, color: '#2563EB', route: '/loans' },
    { id: 'edu-loan', category: 'loans', label: 'Education Loan', icon: FaGraduationCap, color: '#EC4899', route: '/loans' },

    // Insurance
    { id: 'term-ins', category: 'insurance', label: 'Term Insurance', icon: FaClock, color: '#2563EB', route: '/insurance' },
    { id: 'health-ins', category: 'insurance', label: 'Health Insurance', icon: FaHeartbeat, color: '#EF4444', route: '/insurance' },
    { id: 'car-ins', category: 'insurance', label: 'Car Insurance', icon: FaCar, color: '#2563EB', route: '/insurance' },
    { id: 'bike-ins', category: 'insurance', label: 'Bike Insurance', icon: FaMotorcycle, color: '#22C55E', route: '/insurance' },
    { id: 'travel-ins', category: 'insurance', label: 'Travel Insurance', icon: FaGlobe, color: '#F97316', route: '/insurance' },
    { id: 'accident-ins', category: 'insurance', label: 'Personal Accident', icon: FaExclamationTriangle, color: '#7C3AED', route: '/insurance' },

    // Accounts & Investments
    { id: 'savings', category: 'invest', label: 'Savings Account', icon: FaPiggyBank, color: '#22C55E', route: '/cms/coming-soon' },
    { id: 'current', category: 'invest', label: 'Current Account', icon: FaBuilding, color: '#F97316', route: '/cms/coming-soon' },
    { id: 'demat', category: 'invest', label: 'Demat Account', icon: FaChartBar, color: '#7C3AED', route: '/cms/coming-soon' },
    { id: 'fd', category: 'invest', label: 'Fixed Deposit', icon: FaCalendar, color: '#EC4899', route: '/cms/coming-soon' },
    { id: 'mutual', category: 'invest', label: 'Mutual Funds', icon: FaChartPie, color: '#2563EB', route: '/cms/coming-soon' },
    { id: 'gold-invest', category: 'invest', label: 'Gold Investment', icon: FaCoins, color: '#F59E0B', route: '/cms/coming-soon' },

    // Other Services
    { id: 'upi-cc', category: 'other', label: 'UPI Credit Card', icon: FaQrcode, color: '#22C55E', route: '/cms/coming-soon' },
    { id: 'loan-cc', category: 'other', label: 'Loan on Credit Card', icon: FaHandHoldingUsd, color: '#7C3AED', route: '/cms/coming-soon' },
    { id: 'fd-backed', category: 'other', label: 'FD Backed Card', icon: FaCreditCard, color: '#7C3AED', route: '/cms/coming-soon' },
    { id: 'credit-score', category: 'other', label: 'CIBIL Score', icon: FaChartBar, color: '#2563EB', route: '/cms/coming-soon' },
    { id: 'offers', category: 'other', label: 'Offers & Rewards', icon: FaGift, color: '#EC4899', route: '/cms/coming-soon' },
    { id: 'refer-earn', category: 'other', label: 'Refer & Earn', icon: FaGift, color: '#7C3AED', route: '/cms/coming-soon' },

    // Travel & Bookings
    { id: 'flight', category: 'travel', label: 'Flight Booking', icon: FaPlane, color: '#2563EB', route: '/travel-transit/flight-booking' },
    { id: 'train', category: 'travel', label: 'Train Booking', icon: FaSubway, color: '#22C55E', route: '/cms/coming-soon' },
    { id: 'bus', category: 'travel', label: 'Bus Booking', icon: FaBus, color: '#F97316', route: '/cms/coming-soon' },
    { id: 'hotel', category: 'travel', label: 'Hotel Booking', icon: FaHotel, color: '#7C3AED', route: '/cms/coming-soon' },
  ]
};

/* ── Service Card ────────────────────────────────────────────────── */
const ServiceCard = ({ service, onClick, C, isDark }) => {
  const Icon = service.icon;

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onClick(service)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        height: '48px',
        padding: '0 14px',
        background: '#FFFFFF',
        borderRadius: '14px',
        border: '1px solid #E5E7EB',
        boxShadow: '0 4px 20px rgba(15,23,42,0.06)',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: 600,
        color: '#111827',
        whiteSpace: 'nowrap',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#6366F1';
        e.currentTarget.style.boxShadow = '0 10px 25px rgba(99,102,241,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#E5E7EB';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(15,23,42,0.06)';
      }}
    >
      <span style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '28px', height: '28px', borderRadius: '8px',
        background: `${service.color}14`, color: service.color,
        fontSize: '14px', flexShrink: 0,
      }}>
        <Icon />
      </span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{service.label}</span>
    </motion.button>
  );
};

/* ── Category Section ────────────────────────────────────────────── */
const CategorySection = ({ category, services, onServiceClick, C, isDark }) => {
  const Icon = category.icon;
  if (services.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{ marginBottom: '24px' }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        marginBottom: '12px',
      }}>
        <Icon style={{ fontSize: '17px', color: category.color }} />
        <h3 style={{
          fontSize: '15px', fontWeight: 700,
          color: category.color, margin: 0,
        }}>{category.name}</h3>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
        gap: '10px',
      }}>
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            onClick={onServiceClick}
            C={C}
            isDark={isDark}
          />
        ))}
      </div>
    </motion.div>
  );
};

/* ── Skeleton ────────────────────────────────────────────────────── */
const SkeletonGrid = ({ C }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
    gap: '10px',
  }}>
    {Array.from({ length: 12 }).map((_, i) => (
      <div key={i} style={{
        height: '48px', borderRadius: '14px',
        background: C.bgSecondary,
        border: `1px solid ${C.border}`,
        animation: 'qa-shimmer 1.2s infinite',
      }} />
    ))}
    <style>{`
      @keyframes qa-shimmer {
        0% { opacity: 0.5; }
        50% { opacity: 1; }
        100% { opacity: 0.5; }
      }
    `}</style>
  </div>
);

/* ── Main: Quick Access Section ──────────────────────────────────── */
export default function QuickAccessSection() {
  const { C, isDark } = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 200);
    return () => clearTimeout(t);
  }, []);

  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return serviceCatalog;

    const filtered = serviceCatalog.services.filter((s) => {
      const matchLabel = s.label.toLowerCase().includes(query);
      const cat = serviceCatalog.categories.find((c) => c.id === s.category);
      const matchCategory = cat?.name.toLowerCase().includes(query);
      return matchLabel || matchCategory;
    });

    return { ...serviceCatalog, services: filtered };
  }, [searchQuery]);

  const groupedServices = useMemo(() => {
    const groups = {};
    filteredData.categories.forEach((cat) => {
      groups[cat.id] = filteredData.services.filter((s) => s.category === cat.id);
    });
    return groups;
  }, [filteredData]);

  const handleServiceClick = useCallback((service) => {
    if (service.route) {
      navigate(service.route);
    }
  }, [navigate]);

  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: '18px',
      padding: '24px',
      border: '1px solid #EEF2FF',
      boxShadow: '0 4px 20px rgba(15,23,42,0.06)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center',
        justifyContent: 'space-between', gap: '16px',
        marginBottom: '22px',
      }}>
        <div>
          <h3 style={{
            fontSize: '18px', fontWeight: 800, color: '#4338CA', margin: 0,
          }}>Quick Access</h3>
          <p style={{
            fontSize: '13px', color: '#6B7280', margin: '4px 0 0',
            fontWeight: 500,
          }}>Access all GharKaPaisa services from one place</p>
        </div>

        <div style={{
          position: 'relative', minWidth: '220px', flex: '0 1 300px',
        }}>
          <FaSearch style={{
            position: 'absolute', top: '50%', left: '14px',
            transform: 'translateY(-50%)',
            color: '#64748B', fontSize: '13px',
          }} />
          <input
            type="text"
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px 10px 36px',
              borderRadius: '12px', border: '1px solid #E2E8F0',
              background: '#FFFFFF', color: '#111827',
              fontSize: '13px', fontFamily: 'Inter, system-ui, sans-serif',
              outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#6366F1';
              e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#E2E8F0';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
      </div>

      {/* Content */}
      {!ready ? (
        <SkeletonGrid C={C} />
      ) : filteredData.services.length === 0 ? (
        <div style={{
          padding: '40px 20px', textAlign: 'center',
          color: C.textLight, fontSize: '14px', fontWeight: 600,
        }}>
          No services found for "{searchQuery}"
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <div>
            {filteredData.categories.map((category) => {
              const catServices = groupedServices[category.id] || [];
              if (catServices.length === 0) return null;
              return (
                <CategorySection
                  key={category.id}
                  category={category}
                  services={catServices}
                  onServiceClick={handleServiceClick}
                  C={C}
                  isDark={isDark}
                />
              );
            })}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
