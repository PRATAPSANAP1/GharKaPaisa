import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../app/store/authStore';
import { useTheme, ThemeToggle } from '../contexts/ThemeContext';
import { Icons } from '../components/Icon/PartnerIcons';
import LanguageSwitcher from '../components/LanguageSwitcher/LanguageSwitcher';
import api from '../services/api';
import { MdExpandMore, MdChevronRight } from 'react-icons/md';

const DEFAULT_BANKS = [
  { id: 'hdfc', name: 'HDFC Bank', short_code: 'HDFC' },
  { id: 'sbi', name: 'SBI Bank', short_code: 'SBI' },
  { id: 'icici', name: 'ICICI Bank', short_code: 'ICICI' },
  { id: 'axis', name: 'AXIS Bank', short_code: 'AXIS' },
  { id: 'yes', name: 'YES Bank', short_code: 'YES' },
  { id: 'bob', name: 'BOB Bank', short_code: 'BOB' },
  { id: 'au', name: 'AU Bank', short_code: 'AU' },
  { id: 'idfc', name: 'IDFC First Bank', short_code: 'IDFC' },
  { id: 'hsbc', name: 'HSBC Bank', short_code: 'HSBC' },
  { id: 'federal', name: 'Federal Bank', short_code: 'FEDERAL' },
  { id: 'indusind', name: 'IndusInd Bank', short_code: 'INDUSIND' },
  { id: 'kotak', name: 'Kotak Bank', short_code: 'KOTAK' }
];

const LOAN_TYPES = [
  { slug: 'personal-loan', title: 'Personal Loan' },
  { slug: 'home-loan', title: 'Home Loan' },
  { slug: 'business-loan', title: 'Business Loan' },
  { slug: 'loan-against-property', title: 'LAP' },
  { slug: 'gold-loan', title: 'Gold Loan' },
  { slug: 'vehicle-loan', title: 'Vehicle Loan' },
  { slug: 'education-loan', title: 'Education Loan' },
  { slug: 'overdraft', title: 'Overdraft' },
  { slug: 'working-capital', title: 'Working Capital' }
];

const INSURANCE_TYPES = [
  { slug: 'health-insurance', title: 'Health Insurance' },
  { slug: 'life-insurance', title: 'Life Insurance' },
  { slug: 'general-insurance', title: 'General Insurance' }
];

const AdminLayout = () => {
  const { C } = useTheme();
  const { t } = useTranslation();
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();

  const [banks, setBanks] = useState(DEFAULT_BANKS);
  const [openCcMenu, setOpenCcMenu] = useState(false);
  const [openBankSlug, setOpenBankSlug] = useState(null);
  const [openLoansMenu, setOpenLoansMenu] = useState(false);
  const [openInsuranceMenu, setOpenInsuranceMenu] = useState(false);
  const [openProductsMenu, setOpenProductsMenu] = useState(false);

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const res = await api.get('/banks', { params: { limit: 100 } });
        if (res.data?.success && res.data?.data && res.data.data.length > 0) {
          setBanks(res.data.data);
        }
      } catch (err) {
        console.warn('Using default banks list for Admin sidebar');
      }
    };
    fetchBanks();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/admin-login');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.bg, overflow: 'hidden' }}>
      {/* Sidebar - Desktop */}
      <aside style={{
        width: '270px',
        background: C.sidebar,
        color: C.sidebarText,
        display: 'flex',
        flexDirection: 'column',
        borderRight: `1px solid ${C.border}30`,
        flexShrink: 0,
        overflowY: 'auto'
      }} className="hidden md:flex">
        <div style={{ padding: '24px 20px', borderBottom: `1px solid ${C.border}20` }}>
          <h2 id="admin-sidebar-title" style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '0.5px', margin: 0 }}>
            {t('adminLayout.title', 'GharKaPaisa Admin')}
          </h2>
        </div>

        <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          
          {/* Dashboard */}
          <NavLink
            to="/admin/dashboard"
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '10px',
              fontSize: '13.5px', fontWeight: 700, color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.7)',
              background: isActive ? `${C.teal}35` : 'transparent', textDecoration: 'none'
            })}
          >
            <Icons.dashboard size={18} />
            <span>📊 Dashboard</span>
          </NavLink>

          {/* User Management */}
          <NavLink
            to="/admin/partners"
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '10px',
              fontSize: '13.5px', fontWeight: 700, color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.7)',
              background: isActive ? `${C.teal}35` : 'transparent', textDecoration: 'none'
            })}
          >
            <Icons.profile size={18} />
            <span>👥 User Management</span>
          </NavLink>

          {/* 💳 CREDIT CARDS (Dynamic Bank Submenu) */}
          <div>
            <button
              onClick={() => setOpenCcMenu(!openCcMenu)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                padding: '10px 14px', borderRadius: '10px', fontSize: '13.5px', fontWeight: 700,
                color: openCcMenu ? '#fff' : 'rgba(255, 255, 255, 0.7)', background: 'transparent',
                border: 'none', cursor: 'pointer', outline: 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Icons.creditCard size={18} />
                <span>💳 Credit Cards</span>
              </div>
              {openCcMenu ? <MdExpandMore size={18} /> : <MdChevronRight size={18} />}
            </button>

            {openCcMenu && (
              <div style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                {banks.map((bank) => {
                  const slug = (bank.short_code || bank.name).toLowerCase().replace(/[^a-z0-9]/g, '');
                  const isBankOpen = openBankSlug === slug;

                  return (
                    <div key={bank.id}>
                      <button
                        onClick={() => setOpenBankSlug(isBankOpen ? null : slug)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                          padding: '8px 12px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700,
                          color: isBankOpen ? '#FFF' : 'rgba(255,255,255,0.65)', background: 'transparent',
                          border: 'none', cursor: 'pointer', outline: 'none'
                        }}
                      >
                        <span>{bank.name}</span>
                        {isBankOpen ? <MdExpandMore size={16} /> : <MdChevronRight size={16} />}
                      </button>

                      {isBankOpen && (
                        <div style={{ paddingLeft: '14px', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                          <NavLink to={`/admin/credit-cards/${slug}/add`} style={subLinkStyle}>Add {bank.short_code || 'Card'}</NavLink>
                          <NavLink to={`/admin/credit-cards/${slug}/list`} style={subLinkStyle}>Card List</NavLink>
                          <NavLink to={`/admin/credit-cards/${slug}/applications`} style={subLinkStyle}>Applications</NavLink>
                          <NavLink to={`/admin/credit-cards/${slug}/reports`} style={subLinkStyle}>Reports</NavLink>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 🏦 LOANS */}
          <div>
            <button
              onClick={() => setOpenLoansMenu(!openLoansMenu)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                padding: '10px 14px', borderRadius: '10px', fontSize: '13.5px', fontWeight: 700,
                color: openLoansMenu ? '#fff' : 'rgba(255, 255, 255, 0.7)', background: 'transparent',
                border: 'none', cursor: 'pointer', outline: 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Icons.wallet size={18} />
                <span>🏦 Loans</span>
              </div>
              {openLoansMenu ? <MdExpandMore size={18} /> : <MdChevronRight size={18} />}
            </button>

            {openLoansMenu && (
              <div style={{ paddingLeft: '28px', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                {LOAN_TYPES.map(loan => (
                  <NavLink key={loan.slug} to={`/admin/loans/${loan.slug}/list`} style={subLinkStyle}>
                    {loan.title}
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          {/* 🛡 INSURANCE */}
          <div>
            <button
              onClick={() => setOpenInsuranceMenu(!openInsuranceMenu)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                padding: '10px 14px', borderRadius: '10px', fontSize: '13.5px', fontWeight: 700,
                color: openInsuranceMenu ? '#fff' : 'rgba(255, 255, 255, 0.7)', background: 'transparent',
                border: 'none', cursor: 'pointer', outline: 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Icons.trending size={18} />
                <span>🛡 Insurance</span>
              </div>
              {openInsuranceMenu ? <MdExpandMore size={18} /> : <MdChevronRight size={18} />}
            </button>

            {openInsuranceMenu && (
              <div style={{ paddingLeft: '28px', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                {INSURANCE_TYPES.map(ins => (
                  <NavLink key={ins.slug} to={`/admin/insurance/${ins.slug}/list`} style={subLinkStyle}>
                    {ins.title}
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          {/* 📋 Applications */}
          <NavLink
            to="/admin/applications"
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '10px',
              fontSize: '13.5px', fontWeight: 700, color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.7)',
              background: isActive ? `${C.teal}35` : 'transparent', textDecoration: 'none'
            })}
          >
            <Icons.creditCard size={18} />
            <span>📋 Applications</span>
          </NavLink>

          {/* 👥 Customers */}
          <NavLink
            to="/admin/leads"
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '10px',
              fontSize: '13.5px', fontWeight: 700, color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.7)',
              background: isActive ? `${C.teal}35` : 'transparent', textDecoration: 'none'
            })}
          >
            <Icons.trending size={18} />
            <span>👥 Customers</span>
          </NavLink>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '6px 0' }} />

          {/* 🏦 BANKS MANAGEMENT */}
          <NavLink
            to="/super-admin/banks"
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '10px',
              fontSize: '13.5px', fontWeight: 700, color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.7)',
              background: isActive ? `${C.teal}35` : 'transparent', textDecoration: 'none'
            })}
          >
            <Icons.university size={18} />
            <span>🏦 Banks</span>
          </NavLink>

          {/* 📦 PRODUCTS MANAGEMENT */}
          <div>
            <button
              onClick={() => setOpenProductsMenu(!openProductsMenu)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                padding: '10px 14px', borderRadius: '10px', fontSize: '13.5px', fontWeight: 700,
                color: openProductsMenu ? '#fff' : 'rgba(255, 255, 255, 0.7)', background: 'transparent',
                border: 'none', cursor: 'pointer', outline: 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Icons.product size={18} />
                <span>📦 Products</span>
              </div>
              {openProductsMenu ? <MdExpandMore size={18} /> : <MdChevronRight size={18} />}
            </button>

            {openProductsMenu && (
              <div style={{ paddingLeft: '28px', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                <NavLink to="/super-admin/products/credit_card" style={subLinkStyle}>Credit Cards</NavLink>
                <NavLink to="/super-admin/products/loans" style={subLinkStyle}>Loans</NavLink>
                <NavLink to="/super-admin/products/insurance" style={subLinkStyle}>Insurance</NavLink>
                <NavLink to="/super-admin/products/savings_account" style={subLinkStyle}>Savings Account</NavLink>
                <NavLink to="/super-admin/products/current_account" style={subLinkStyle}>Current Account</NavLink>
                <NavLink to="/super-admin/products/fixed_deposit" style={subLinkStyle}>Fixed Deposit</NavLink>
                <NavLink to="/super-admin/products/demat_account" style={subLinkStyle}>DEMAT</NavLink>
                <NavLink to="/super-admin/products/upi_credit" style={subLinkStyle}>UPI Credit</NavLink>
                <NavLink to="/super-admin/products/fastag" style={subLinkStyle}>FASTag</NavLink>
                <NavLink to="/super-admin/products/recharge" style={subLinkStyle}>Recharge & Bills</NavLink>
                <NavLink to="/super-admin/products/other" style={subLinkStyle}>Other Products</NavLink>
              </div>
            )}
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '6px 0' }} />

          {/* 💰 Wallet */}
          <NavLink
            to="/admin/withdrawals"
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '10px',
              fontSize: '13.5px', fontWeight: 700, color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.7)',
              background: isActive ? `${C.teal}35` : 'transparent', textDecoration: 'none'
            })}
          >
            <Icons.wallet size={18} />
            <span>💰 Wallet</span>
          </NavLink>

          {/* ⚙ Settings */}
          <NavLink
            to="/super-admin/sections"
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '10px',
              fontSize: '13.5px', fontWeight: 700, color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.7)',
              background: isActive ? `${C.teal}35` : 'transparent', textDecoration: 'none'
            })}
          >
            <Icons.settings size={18} />
            <span>⚙ Settings</span>
          </NavLink>

        </nav>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <header style={{
          background: C.card,
          borderBottom: `1px solid ${C.border}`,
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
        }}>
          <h2 id="admin-header-title-mobile" style={{ fontSize: '16px', fontWeight: 800, color: C.text }} className="md:hidden">
            {t('adminLayout.titleMobile', 'GKP Admin')}
          </h2>
          <div className="hidden md:block"></div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <ThemeToggle />
            <LanguageSwitcher />
            <button
              id="admin-logout-button"
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', background: `${C.red}10`,
                color: C.red, border: 'none', borderRadius: '8px', padding: '8px 16px',
                fontSize: '13px', fontWeight: 700, cursor: 'pointer'
              }}
            >
              <Icons.logout size={14} /> Log Out
            </button>
          </div>
        </header>

        {/* Dynamic Inner Page Content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px', boxSizing: 'border-box' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const subLinkStyle = ({ isActive }) => ({
  display: 'block',
  padding: '6px 10px',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: 600,
  color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.6)',
  background: isActive ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
  textDecoration: 'none'
});

export default AdminLayout;

