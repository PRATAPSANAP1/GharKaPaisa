import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  FaWallet, FaUniversity, FaHandHoldingUsd, FaShieldAlt,
  FaChartPie, FaEllipsisH, FaPlane, FaBolt,
  FaMobileAlt, FaTint, FaFire, FaPhone, FaTag, FaTv,
  FaQrcode, FaExchangeAlt, FaCreditCard, FaUser,
  FaHome, FaBriefcase, FaBuilding, FaGraduationCap, FaCoins,
  FaCar, FaMotorcycle, FaHeartbeat, FaLifeRing, FaGlobe,
  FaExclamationTriangle, FaClock, FaPiggyBank, FaCalendarAlt,
  FaUmbrella, FaGift, FaSubway, FaBus, FaHotel, FaUmbrellaBeach,
  FaPassport, FaCouch, FaTaxi, FaWifi, FaCity,
  FaChartBar, FaCalendar,
  FaChevronDown, FaChevronRight
} from 'react-icons/fa';

/* ── Catalog Data ────────────────────────────────────────────────── */
const serviceCatalog = {
  categories: [
    { id: 'money', name: 'Recharge & Bills', icon: FaWallet, color: '#4f46e5' },
    { id: 'banks', name: 'Popular Credit Card Banks', icon: FaUniversity, color: '#0ea5e9' },
    { id: 'loans', name: 'Loans', icon: FaHandHoldingUsd, color: '#10b981' },
    { id: 'insurance', name: 'Insurance', icon: FaShieldAlt, color: '#f59e0b' },
    { id: 'invest', name: 'Accounts & Investments', icon: FaChartPie, color: '#8b5cf6' },
    { id: 'other', name: 'Other Services', icon: FaEllipsisH, color: '#ec4899' },
    { id: 'travel', name: 'Travel & Bookings', icon: FaPlane, color: '#f43f5e' },
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

/* ── Desktop Service Card ────────────────────────────────────────── */
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
        background: C.card || '#FFFFFF',
        borderRadius: '14px',
        border: `1px solid ${C.border || '#E5E7EB'}`,
        boxShadow: '0 4px 20px rgba(15,23,42,0.03)',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: 600,
        color: C.text || '#111827',
        whiteSpace: 'nowrap',
        transition: 'all 0.2s ease',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = C.primary || '#6366F1';
        e.currentTarget.style.boxShadow = `0 10px 25px ${(C.primary || '#6366F1')}20`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = C.border || '#E5E7EB';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(15,23,42,0.03)';
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

/* ── Desktop Category Section ────────────────────────────────────── */
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
          color: C.text || category.color, margin: 0,
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

/* ── Mobile Service Item ─────────────────────────────────────────── */
const ServiceCardMobile = ({ service, onClick, C }) => {
  const Icon = service.icon;

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(service)}
      aria-label={`Open ${service.label} service`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '14px 16px',
        background: C.bgSecondary || '#F8FAFC',
        borderRadius: '12px',
        border: `1.5px solid ${C.border || '#E5E7EB'}`,
        cursor: 'pointer',
        textAlign: 'left',
        outline: 'none',
        transition: 'all 0.2s ease',
        minHeight: '52px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '32px', height: '32px', borderRadius: '8px',
          background: `${service.color}14`, color: service.color,
          fontSize: '15px', flexShrink: 0,
        }}>
          <Icon />
        </span>
        <span style={{
          fontSize: '14px',
          fontWeight: 600,
          color: C.text || '#111827',
        }}>{service.label}</span>
      </div>
      <FaChevronRight style={{ fontSize: '11px', color: C.textLight || '#94A3B8' }} />
    </motion.button>
  );
};

/* ── Mobile Category Section (Accordion) ─────────────────────────── */
const CategorySectionMobile = ({ category, services, onServiceClick, isExpanded, onToggle, C }) => {
  const Icon = category.icon;
  if (services.length === 0) return null;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle();
    }
  };

  return (
    <div style={{
      borderBottom: `1.5px solid ${C.border || '#E5E7EB'}`,
      overflow: 'hidden',
    }}>
      <button
        onClick={onToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={isExpanded}
        aria-controls={`qa-group-${category.id}`}
        aria-label={`${category.name} section`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '16px 8px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          outline: 'none',
          textAlign: 'left',
          minHeight: '54px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '36px', height: '36px', borderRadius: '10px',
            background: `${category.color}12`, color: category.color,
            fontSize: '16px',
          }}>
            <Icon />
          </span>
          <span style={{
            fontSize: '15px',
            fontWeight: 700,
            color: C.text || '#111827',
          }}>{category.name}</span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ display: 'flex', alignItems: 'center', color: C.textLight || '#6B7280' }}
        >
          <FaChevronDown style={{ fontSize: '14px' }} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            id={`qa-group-${category.id}`}
            role="region"
            aria-label={`${category.name} services`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '4px 8px 16px',
            }}>
              {services.map((service) => (
                <ServiceCardMobile
                  key={service.id}
                  service={service}
                  onClick={onServiceClick}
                  C={C}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── Skeleton loader ────────────────────────────────────────────── */
const SkeletonGrid = ({ C }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
    gap: '10px',
  }}>
    {Array.from({ length: 12 }).map((_, i) => (
      <div key={i} style={{
        height: '48px', borderRadius: '14px',
        background: C.bgSecondary || '#F8FAFC',
        border: `1px solid ${C.border || '#E5E7EB'}`,
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

/* ── Main Export component ───────────────────────────────────────── */
export default function QuickAccessSection() {
  const { C, isDark } = useTheme();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 200);
    return () => clearTimeout(t);
  }, []);

  const [dynamicBankServices, setDynamicBankServices] = useState([]);

  useEffect(() => {
    const fetchActiveBanks = async () => {
      try {
        const res = await api.get('/banks', { params: { status: 'Active', limit: 100 } });
        if (res.data?.success && res.data?.data && res.data.data.length > 0) {
          const mapped = res.data.data.map(b => {
            const slug = (b.short_code || b.name).toLowerCase().replace(/[^a-z0-9]/g, '');
            return {
              id: slug,
              category: 'banks',
              label: b.name,
              icon: FaUniversity,
              color: '#4F46E5',
              route: `/partner/credit-cards/${slug}`
            };
          });
          setDynamicBankServices(mapped);
        }
      } catch (err) {
        console.warn('Using default bank services in QuickAccessSection');
      }
    };
    fetchActiveBanks();
  }, []);

  const groupedServices = useMemo(() => {
    const groups = {};
    serviceCatalog.categories.forEach((cat) => {
      if (cat.id === 'banks' && dynamicBankServices.length > 0) {
        groups[cat.id] = dynamicBankServices;
      } else {
        groups[cat.id] = serviceCatalog.services.filter((s) => s.category === cat.id);
      }
    });
    return groups;
  }, [dynamicBankServices]);

  const toggleCategory = useCallback((categoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  }, []);

  const handleServiceClick = useCallback((service) => {
    if (service.route) {
      navigate(service.route);
    }
  }, [navigate]);

  return (
    <div style={{
      background: C.card || '#FFFFFF',
      borderRadius: '18px',
      padding: isMobile ? '16px' : '24px',
      border: `1px solid ${C.border || '#EEF2FF'}`,
      boxShadow: '0 4px 20px rgba(15,23,42,0.05)',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center',
        justifyContent: 'space-between', gap: '16px',
        marginBottom: '22px',
      }}>
        <div>
          <h3 style={{
            fontSize: '18px', fontWeight: 800, color: C.primary || '#4338CA', margin: 0,
          }}>Quick Access</h3>
          <p style={{
            fontSize: '13px', color: C.textLight || '#6B7280', margin: '4px 0 0',
            fontWeight: 500,
          }}>Access all GharKaPaisa services from one place</p>
        </div>
      </div>

      {/* Content */}
      {!ready ? (
        <SkeletonGrid C={C} />
      ) : isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {serviceCatalog.categories.map((category) => {
            const catServices = groupedServices[category.id] || [];
            if (catServices.length === 0) return null;
            return (
              <CategorySectionMobile
                key={category.id}
                category={category}
                services={catServices}
                onServiceClick={handleServiceClick}
                isExpanded={!!expandedCategories[category.id]}
                onToggle={() => toggleCategory(category.id)}
                C={C}
              />
            );
          })}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <div>
            {serviceCatalog.categories.map((category) => {
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
