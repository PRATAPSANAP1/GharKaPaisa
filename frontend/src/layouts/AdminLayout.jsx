import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../app/store/authStore';
import { useTheme, ThemeToggle } from '../contexts/ThemeContext';
import { useActiveBanks } from '../contexts/BanksContext';
import { Icons } from '../components/Icon/PartnerIcons';
import LanguageSwitcher from '../components/LanguageSwitcher/LanguageSwitcher';
import Chatbot from '../components/Chatbot/Chatbot';
import api from '../services/api';
import { MdExpandMore, MdChevronRight, MdAccountBalance, MdShoppingBag, MdSettings, MdMenu, MdClose } from 'react-icons/md';

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
  { id: 'rbl', name: 'RBL Bank', short_code: 'RBL' },
  { id: 'equitas', name: 'Equitas Small Finance Bank', short_code: 'EQUITAS' },
  { id: 'dcb', name: 'DCB Bank', short_code: 'DCB' },
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

// Reusable active link style
const navLinkStyle = ({ isActive }) => ({
  display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '12px',
  fontSize: '13.5px', fontWeight: 800, color: isActive ? '#60a5fa' : 'rgba(255, 255, 255, 0.75)',
  background: isActive ? 'linear-gradient(90deg, rgba(59,130,246,0.22), rgba(37,99,235,0.08))' : 'transparent',
  borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent', textDecoration: 'none', transition: 'all 0.2s ease'
});

// Reusable submenu parent button style
const menuBtnStyle = (isOpen) => ({
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
  padding: '10px 14px', borderRadius: '12px', fontSize: '13.5px', fontWeight: 800,
  color: isOpen ? '#60a5fa' : 'rgba(255, 255, 255, 0.75)', background: isOpen ? 'rgba(59,130,246,0.08)' : 'transparent',
  border: 'none', cursor: 'pointer', outline: 'none', transition: 'all 0.2s ease',
  borderLeft: isOpen ? '3px solid #3b82f6' : '3px solid transparent'
});

const subLinkStyle = ({ isActive }) => ({
  display: 'block',
  padding: '7px 12px',
  borderRadius: '8px',
  fontSize: '12.5px',
  fontWeight: 700,
  color: isActive ? '#60a5fa' : 'rgba(255, 255, 255, 0.6)',
  background: isActive ? 'rgba(59,130,246,0.15)' : 'transparent',
  textDecoration: 'none',
  transition: 'all 0.15s ease'
});

const AdminLayout = () => {
  const { C } = useTheme();
  const { t } = useTranslation();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const location = useLocation();

  const { activeBanks } = useActiveBanks();
  let banks = activeBanks.length > 0 ? activeBanks : DEFAULT_BANKS;

  const userRole = (user?.role || '').toUpperCase();
  const isHR = userRole === 'HR' || location.pathname.startsWith('/hr');
  const userDesignation = user?.designation || '';
  const isOpHead = userDesignation === 'Operational Head' || userDesignation === 'OPERATIONAL_HEAD';
  const isBackend = ['Backend', 'BACKEND', 'Backend Operation', 'BACKEND_OPERATION', 'Administrative Operator', 'ADMINISTRATIVE OPERATOR', 'ADMINISTRATIVE_OPERATOR'].includes(userDesignation);
  const assignedList = user?.assigned_banks?.length ? user.assigned_banks : (user?.permissions?.assigned_banks || []);
  if ((isOpHead || isBackend || assignedList.length > 0) && assignedList.length > 0) {
    banks = assignedList.map(b => ({
      id: b.id,
      name: b.name || b.bank_name || b.short_code,
      short_code: b.short_code || b.code || b.name,
      logo: b.logo_url || b.logo
    }));
  }

  const [openCcMenu, setOpenCcMenu] = useState(false);
  const [openLoansMenu, setOpenLoansMenu] = useState(false);
  const [openInsuranceMenu, setOpenInsuranceMenu] = useState(false);
  const [openProductsMenu, setOpenProductsMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change & restrict HR and Backend Operator navigation
  useEffect(() => {
    setMobileMenuOpen(false);
    if (isHR) {
      if (!location.pathname.startsWith('/hr')) {
        navigate('/hr/dashboard', { replace: true });
      }
    } else if (isBackend) {
      const allowedPaths = ['/admin/applications', '/admin/credit-cards', '/admin/loans', '/admin/insurance'];
      const isAllowed = allowedPaths.some(p => location.pathname.startsWith(p));
      if (!isAllowed) {
        navigate('/admin/applications', { replace: true });
      }
    }
  }, [location.pathname, isHR, isBackend, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/admin-login');
  };

  // Sidebar Navigation Content (shared between desktop and mobile)
  const SidebarContent = () => (
    <>
      {/* Sidebar Header / Logo */}
      <div style={{ padding: '20px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 20 }}>⚡</span>
        <div>
          <h2 id="admin-sidebar-title" style={{ fontSize: '17px', fontWeight: 900, margin: 0, background: 'linear-gradient(90deg, #60a5fa, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {t('adminLayout.title', 'GharKaPaisa')}
          </h2>
          <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {isHR ? 'HR Management Portal' : isBackend ? 'Administrative Operator' : 'Admin Operations Portal'}
          </span>
        </div>
      </div>

      <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        {isHR ? (
          <>
            {/* HR Dashboard / Candidates Management */}
            <NavLink to="/hr/dashboard" style={navLinkStyle}>
              <Icons.profile size={18} />
              <span>HR Dashboard & Candidates</span>
            </NavLink>
          </>
        ) : (
          <>
            {/* Full Admin Nav Items (Hidden for Backend admins) */}
            {!isBackend && (
              <>
                {/* Dashboard */}
                <NavLink to="/admin/dashboard" style={navLinkStyle}>
                  <Icons.dashboard size={18} />
                  <span>Dashboard</span>
                </NavLink>

                {/* Partners */}
                <NavLink to="/admin/partners" style={navLinkStyle}>
                  <Icons.profile size={18} />
                  <span>Partners</span>
                </NavLink>

                {/* Employees */}
                <NavLink to="/super-admin/employees" style={navLinkStyle}>
                  <Icons.profile size={18} />
                  <span>Employees</span>
                </NavLink>

                {/* HR */}
                <NavLink to="/hr" style={navLinkStyle}>
                  <Icons.profile size={18} />
                  <span>HR</span>
                </NavLink>
              </>
            )}

            {/* CREDIT CARDS — Only Assigned Banks */}
            <div>
              <button onClick={() => setOpenCcMenu(!openCcMenu)} style={menuBtnStyle(openCcMenu)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Icons.creditCard size={18} />
                  <span>Credit Cards</span>
                </div>
                {openCcMenu ? <MdExpandMore size={18} /> : <MdChevronRight size={18} />}
              </button>

              {openCcMenu && (
                <div style={{ paddingLeft: '28px', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                  {banks.map((bank) => {
                    const slug = (bank.short_code || bank.name).toLowerCase().replace(/[^a-z0-9]/g, '');
                    return (
                      <NavLink key={bank.id} to={`/admin/credit-cards/${slug}/applications`} style={subLinkStyle}>
                        {bank.name}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>

            {/* LOANS — Only Assigned Banks */}
            <div>
              <button onClick={() => setOpenLoansMenu(!openLoansMenu)} style={menuBtnStyle(openLoansMenu)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Icons.wallet size={18} />
                  <span>Loans</span>
                </div>
                {openLoansMenu ? <MdExpandMore size={18} /> : <MdChevronRight size={18} />}
              </button>

              {openLoansMenu && (
                <div style={{ paddingLeft: '28px', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                  {banks.map((bank) => {
                    const slug = (bank.short_code || bank.name).toLowerCase().replace(/[^a-z0-9]/g, '');
                    return (
                      <NavLink key={bank.id} to={`/admin/loans/${slug}`} style={subLinkStyle}>
                        {bank.name}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>

            {/* INSURANCE — Only Assigned Banks */}
            <div>
              <button onClick={() => setOpenInsuranceMenu(!openInsuranceMenu)} style={menuBtnStyle(openInsuranceMenu)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Icons.trending size={18} />
                  <span>Insurance</span>
                </div>
                {openInsuranceMenu ? <MdExpandMore size={18} /> : <MdChevronRight size={18} />}
              </button>

              {openInsuranceMenu && (
                <div style={{ paddingLeft: '28px', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                  {banks.map((bank) => {
                    const slug = (bank.short_code || bank.name).toLowerCase().replace(/[^a-z0-9]/g, '');
                    return (
                      <NavLink key={bank.id} to={`/admin/insurance/${slug}`} style={subLinkStyle}>
                        {bank.name}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Applications */}
            <NavLink to="/admin/applications" style={navLinkStyle}>
              <Icons.creditCard size={18} />
              <span>Applications</span>
            </NavLink>

            {/* Full Admin Nav Items (Hidden for Backend admins) */}
            {!isBackend && (
              <>
                {/* Customers */}
                <NavLink to="/admin/leads" style={navLinkStyle}>
                  <Icons.trending size={18} />
                  <span>Customers</span>
                </NavLink>

                <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '6px 0' }} />

                {/* BANKS MANAGEMENT */}
                <NavLink to="/admin/banks" style={navLinkStyle}>
                  <MdAccountBalance size={18} />
                  <span>Banks</span>
                </NavLink>

                {/* PRODUCTS MANAGEMENT */}
                <div>
                  <button onClick={() => setOpenProductsMenu(!openProductsMenu)} style={menuBtnStyle(openProductsMenu)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <MdShoppingBag size={18} />
                      <span>Products</span>
                    </div>
                    {openProductsMenu ? <MdExpandMore size={18} /> : <MdChevronRight size={18} />}
                  </button>

                  {openProductsMenu && (
                    <div style={{ paddingLeft: '28px', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                      <NavLink to="/admin/products/credit_card" style={subLinkStyle}>Credit Cards</NavLink>
                      <NavLink to="/admin/products/loans" style={subLinkStyle}>Loans</NavLink>
                      <NavLink to="/admin/products/insurance" style={subLinkStyle}>Insurance</NavLink>
                      <NavLink to="/admin/products/savings_account" style={subLinkStyle}>Savings Account</NavLink>
                      <NavLink to="/admin/products/current_account" style={subLinkStyle}>Current Account</NavLink>
                      <NavLink to="/admin/products/fixed_deposit" style={subLinkStyle}>Fixed Deposit</NavLink>
                      <NavLink to="/admin/products/demat_account" style={subLinkStyle}>DEMAT</NavLink>
                      <NavLink to="/admin/products/upi_credit" style={subLinkStyle}>UPI Credit</NavLink>
                      <NavLink to="/admin/products/fastag" style={subLinkStyle}>FASTag</NavLink>
                      <NavLink to="/admin/products/recharge" style={subLinkStyle}>Recharge & Bills</NavLink>
                      <NavLink to="/admin/products/other" style={subLinkStyle}>Other Products</NavLink>
                    </div>
                  )}
                </div>

                <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '6px 0' }} />

                {/* Wallet & Withdrawals */}
                <NavLink to="/admin/withdrawals" style={navLinkStyle}>
                  <Icons.wallet size={18} />
                  <span>Wallet & Payouts</span>
                </NavLink>

                {/* Commissions */}
                <NavLink to="/admin/commissions" style={navLinkStyle}>
                  <Icons.trending size={18} />
                  <span>Commissions</span>
                </NavLink>

                {/* Reports & Analytics */}
                <NavLink to="/admin/reports" style={navLinkStyle}>
                  <Icons.dashboard size={18} />
                  <span>Reports</span>
                </NavLink>

                {/* Settings */}
                <NavLink to="/admin/sections" style={navLinkStyle}>
                  <MdSettings size={18} />
                  <span>Settings</span>
                </NavLink>
              </>
            )}
          </>
        )}

        <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <button
            id="admin-sidebar-logout-button"
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '12px',
              fontSize: '13.5px', fontWeight: 800, color: '#EF4444',
              background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)',
              cursor: 'pointer', transition: 'all 0.2s ease'
            }}
          >
            <Icons.logout size={18} />
            <span>Log Out</span>
          </button>
        </div>
      </nav>
    </>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.bg, overflow: 'hidden' }}>
      
      {/* ── Desktop Sidebar ── */}
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
        <SidebarContent />
      </aside>

      {/* ── Mobile Sidebar Overlay ── */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 998,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)'
          }}
          className="md:hidden"
        />
      )}

      {/* ── Mobile Sidebar Drawer ── */}
      <aside
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0,
          width: '280px', maxWidth: '85vw',
          background: C.sidebar,
          color: C.sidebarText,
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: mobileMenuOpen ? '8px 0 30px rgba(0,0,0,0.3)' : 'none'
        }}
        className="md:hidden"
      >
        {/* Close button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 16px 0' }}>
          <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}>
            <MdClose size={22} />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* ── Main Content Area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Header */}
        <header style={{
          background: C.card,
          borderBottom: `1px solid ${C.border}`,
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden"
              style={{ background: 'transparent', border: 'none', color: C.text, cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
            >
              <MdMenu size={24} />
            </button>
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: 0 }} className="md:hidden">
              {t('adminLayout.titleMobile', 'GKP Admin')}
            </h2>
            <div className="hidden md:block" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <ThemeToggle />
            <LanguageSwitcher />
            <button
              id="admin-logout-button"
              onClick={handleLogout}
              className="hidden md:flex"
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
        <main style={{ flex: 1, overflowY: 'auto', padding: '16px', boxSizing: 'border-box' }}>
          <Outlet />
          {!isHR && <Chatbot />}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
