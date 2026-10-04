import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../app/store/authStore';
import { useTheme, ThemeToggle } from '../contexts/ThemeContext';
import { useActiveBanks } from '../contexts/BanksContext';
import { Icons } from '../components/Icon/PartnerIcons';
import LanguageSwitcher from '../components/LanguageSwitcher/LanguageSwitcher';
import Chatbot from '../components/Chatbot/Chatbot';
import AnnouncementBanner from '../components/AnnouncementBanner';
import api from '../services/api';
import { MdExpandMore, MdChevronRight, MdAccountBalance, MdShoppingBag, MdSettings, MdMenu, MdClose, MdNotifications } from 'react-icons/md';
import { FaComments } from 'react-icons/fa';

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
  const isSuperAdmin = userRole === 'SUPER_ADMIN' || userRole === 'SUPERADMIN';
  const isHR = userRole === 'HR' || location.pathname.startsWith('/hr');
  const userDesignation = user?.designation || '';
  const isOpHead = userDesignation === 'Operational Head' || userDesignation === 'OPERATIONAL_HEAD';
  const isSalesExec = ['Administrative Sales Executive', 'ADMINISTRATIVE SALES EXECUTIVE', 'ADMINISTRATIVE_SALES_EXECUTIVE'].includes(userDesignation);
  const isPanChecker = ['PAN Checker', 'PAN CHECKER', 'PAN_CHECKER'].includes(userDesignation) || ['PAN CHECKER', 'PAN_CHECKER'].includes(userRole);
  const isRemarkOperator = ['Remark Operator', 'REMARK OPERATOR', 'REMARK_OPERATOR'].includes(userDesignation) || ['REMARK OPERATOR', 'REMARK_OPERATOR'].includes(userRole);
  const isQdOperator = ['QD Checker', 'QD Operator', 'QD OPERATOR', 'QD_OPERATOR'].includes(userDesignation) || ['QD OPERATOR', 'QD_OPERATOR'].includes(userRole);
  const isKycOperator = ['KYC Operator', 'KYC OPERATOR', 'KYC_OPERATOR'].includes(userDesignation) || userRole === 'KYC_OPERATOR';
  const isFinalStatusOperator = ['Final Status Operator', 'FINAL STATUS OPERATOR', 'FINAL_STATUS_OPERATOR'].includes(userDesignation) || ['FINAL STATUS OPERATOR', 'FINAL_STATUS_OPERATOR'].includes(userRole);
  const isBackend = ['Backend', 'BACKEND', 'Backend Operation', 'BACKEND_OPERATION', 'Administrative Operator', 'ADMINISTRATIVE OPERATOR', 'ADMINISTRATIVE_OPERATOR'].includes(userDesignation);
  const assignedList = user?.assigned_banks?.length ? user.assigned_banks : (user?.permissions?.assigned_banks || []);
  if ((isOpHead || isBackend || isRemarkOperator || isSalesExec || isPanChecker || isQdOperator || isKycOperator || isFinalStatusOperator || assignedList.length > 0) && assignedList.length > 0) {
    banks = assignedList.map(b => ({
      id: b.id,
      name: b.name || b.bank_name || b.short_code,
      short_code: b.short_code || b.code || b.name,
      logo: b.logo_url || b.logo
    }));
  } else if (isOpHead || isBackend || isRemarkOperator || isSalesExec || isPanChecker || isQdOperator || isKycOperator || isFinalStatusOperator) {
    banks = [];
  }

  const [openCcMenu, setOpenCcMenu] = useState(false);
  const [openLoansMenu, setOpenLoansMenu] = useState(false);
  const [openInsuranceMenu, setOpenInsuranceMenu] = useState(false);
  const [openProductsMenu, setOpenProductsMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Responsive Mobile State
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Notification & Messenger State
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [messengerUnread, setMessengerUnread] = useState(0);
  const [notificationsList, setNotificationsList] = useState([]);
  const [systemUnreadCount, setSystemUnreadCount] = useState(0);
  const notifDropdownRef = useRef(null);

  const fetchNotificationCounts = async () => {
    try {
      const [msgRes, notifRes] = await Promise.all([
        api.get('/messenger/unread-count').catch(() => ({ data: { success: false } })),
        api.get('/notifications/unread').catch(() => ({ data: { success: false } }))
      ]);

      if (msgRes?.data?.success && typeof msgRes.data?.data?.unread_count === 'number') {
        setMessengerUnread(msgRes.data.data.unread_count);
      }
      if (notifRes?.data?.success) {
        setNotificationsList(notifRes.data.data?.notifications || []);
        setSystemUnreadCount(notifRes.data.data?.unread_count || 0);
      }
    } catch (err) {
      console.error('Error fetching notification counts:', err);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchNotificationCounts();

    const handleUnreadUpdate = () => {
      fetchNotificationCounts();
    };

    window.addEventListener('messenger:unread_updated', handleUnreadUpdate);
    const interval = setInterval(fetchNotificationCounts, 10000);
    return () => {
      window.removeEventListener('messenger:unread_updated', handleUnreadUpdate);
      clearInterval(interval);
    };
  }, [user?.id]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target)) {
        setNotifMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/read-all').catch(() => {});
      setSystemUnreadCount(0);
      setNotificationsList(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };


  // Close mobile menu on route change & restrict navigation based on role designation
  useEffect(() => {
    setMobileMenuOpen(false);
    
    // Disallow /admin/reports for all admin designation panels
    if (location.pathname.startsWith('/admin/reports') && !isSuperAdmin) {
      navigate('/admin/dashboard', { replace: true });
      return;
    }

    // Disallow /admin/kyc-operator for all panels
    if (location.pathname.startsWith('/admin/kyc-operator')) {
      const fallback = isSuperAdmin ? '/super-admin/overview' : '/admin/applications';
      navigate(fallback, { replace: true });
      return;
    }

    if (isHR) {
      if (!location.pathname.startsWith('/hr')) {
        navigate('/hr/dashboard', { replace: true });
      }
    } else if (isKycOperator) {
      const allowedPaths = ['/admin/applications', '/admin/kyc', '/admin/messenger'];
      const isAllowed = allowedPaths.some(p => location.pathname.startsWith(p));
      if (!isAllowed) {
        navigate('/admin/applications', { replace: true });
      }
    } else if (isRemarkOperator || isQdOperator || isFinalStatusOperator) {
      const allowedPaths = ['/admin/applications', '/admin/messenger'];
      const isAllowed = allowedPaths.some(p => location.pathname.startsWith(p));
      if (!isAllowed) {
        navigate('/admin/applications', { replace: true });
      }
    } else if (isSalesExec) {
      const allowedPaths = ['/admin/dashboard', '/admin/applications', '/admin/messenger'];
      const isAllowed = allowedPaths.some(p => location.pathname === p || location.pathname.startsWith(p));
      if (!isAllowed) {
        navigate('/admin/dashboard', { replace: true });
      }
    } else if (isBackend) {
      const allowedPaths = ['/admin/dashboard', '/admin/applications', '/admin/credit-cards', '/admin/loans', '/admin/insurance', '/admin/messenger'];
      const isAllowed = allowedPaths.some(p => location.pathname.startsWith(p));
      if (!isAllowed) {
        navigate('/admin/dashboard', { replace: true });
      }
    }
  }, [location.pathname, isHR, isKycOperator, isSuperAdmin, isRemarkOperator, isQdOperator, isFinalStatusOperator, isSalesExec, isBackend, navigate]);

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
            {isHR ? 'HR Management Portal' : isKycOperator ? 'KYC Operator Portal' : isRemarkOperator ? 'Remark Operator' : isPanChecker ? 'PAN Checker' : isFinalStatusOperator ? 'Final Status Operator' : isSalesExec ? 'Administrative Sales Executive' : isBackend ? 'Administrative Operator' : 'Admin Operations Portal'}
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
            {/* Dashboard (Available to all Admin Roles except Remark Operator, QD Operator, KYC Operator, and Final Status Operator) */}
            {!isRemarkOperator && !isQdOperator && !isKycOperator && !isFinalStatusOperator && (
              <NavLink to="/admin/dashboard" style={navLinkStyle}>
                <Icons.dashboard size={18} />
                <span>Dashboard</span>
              </NavLink>
            )}

            {/* Full Admin Nav Items */}
            {isSuperAdmin && (
              <>
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
              </>
            )}

            {isHR && (
              <NavLink to="/hr" style={navLinkStyle}>
                <Icons.profile size={18} />
                <span>HR</span>
              </NavLink>
            )}

            {/* CREDIT CARDS — Only Assigned Banks */}
            {!isPanChecker && !isRemarkOperator && !isSalesExec && !isQdOperator && !isKycOperator && (
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
            )}

            {/* LOANS — Only Assigned Banks */}
            {!isPanChecker && !isRemarkOperator && !isSalesExec && !isQdOperator && !isKycOperator && (
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
            )}

            {/* INSURANCE — Only Assigned Banks */}
            {!isPanChecker && !isRemarkOperator && !isSalesExec && !isQdOperator && !isKycOperator && (
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
            )}

            {/* Applications */}
            <NavLink to="/admin/applications" style={navLinkStyle}>
              <Icons.creditCard size={18} />
              <span>{isKycOperator ? 'KYC Operator' : isQdOperator ? 'QD Operator' : isRemarkOperator ? 'Remark Operator' : isPanChecker ? 'PAN Checker' : isFinalStatusOperator ? 'Final Status Operator' : 'Applications'}</span>
            </NavLink>

            {/* Messenger */}
            <NavLink to="/admin/messenger" style={navLinkStyle}>
              <Icons.profile size={18} />
              <span>Messenger</span>
              {messengerUnread > 0 && (
                <span style={{
                  marginLeft: 'auto',
                  background: '#EF4444',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 700,
                  borderRadius: '10px',
                  padding: '2px 7px'
                }}>
                  {messengerUnread > 99 ? '99+' : messengerUnread}
                </span>
              )}
            </NavLink>

            {/* Additional Admin Nav Items */}
            {!isBackend && !isSalesExec && !isPanChecker && !isRemarkOperator && !isQdOperator && !isKycOperator && !isFinalStatusOperator && (
              <>
                {/* Customers */}
                <NavLink to="/admin/leads" style={navLinkStyle}>
                  <Icons.trending size={18} />
                  <span>Customers</span>
                </NavLink>

                <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '6px 0' }} />

                {/* BANKS MANAGEMENT */}
                {isSuperAdmin && (
                  <NavLink to="/admin/banks" style={navLinkStyle}>
                    <MdAccountBalance size={18} />
                    <span>Banks</span>
                  </NavLink>
                )}

                {/* PRODUCTS MANAGEMENT */}
                {isSuperAdmin && (
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
                )}

                <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '6px 0' }} />

                {/* Wallet & Withdrawals */}
                {(isSuperAdmin || (userRole === 'ADMIN' && !isOpHead)) && (
                  <NavLink to="/admin/withdrawals" style={navLinkStyle}>
                    <Icons.wallet size={18} />
                    <span>Wallet & Payouts</span>
                  </NavLink>
                )}

                {/* Commissions */}
                {(isSuperAdmin || (userRole === 'ADMIN' && !isOpHead)) && (
                  <NavLink to="/admin/commissions" style={navLinkStyle}>
                    <Icons.trending size={18} />
                    <span>Commissions</span>
                  </NavLink>
                )}

                {/* Settings */}
                {isSuperAdmin && (
                  <NavLink to="/admin/sections" style={navLinkStyle}>
                    <MdSettings size={18} />
                    <span>Settings</span>
                  </NavLink>
                )}
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
            <LanguageSwitcher />
            {/* Messenger Button */}
            <button
              id="admin-messenger-button"
              onClick={() => navigate('/admin/messenger')}
              title="Messenger"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: `1px solid ${C.border}`,
                borderRadius: '50%',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
                color: C.text,
                transition: 'all 0.2s',
                outline: 'none'
              }}
            >
              <FaComments size={18} color="#3b82f6" />
              {messengerUnread > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  background: '#EF4444',
                  color: '#FFFFFF',
                  fontSize: '10px',
                  fontWeight: 900,
                  minWidth: '18px',
                  height: '18px',
                  borderRadius: '9px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                  boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)',
                  border: `2px solid ${C.card}`
                }}>
                  {messengerUnread > 99 ? '99+' : messengerUnread}
                </span>
              )}
            </button>

            {/* Notification Bell Button & Popover Dropdown */}
            <div style={{ position: 'relative' }} ref={notifDropdownRef}>
              <button
                id="admin-notification-bell"
                onClick={() => setNotifMenuOpen(!notifMenuOpen)}
                title="Notifications"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid ${notifMenuOpen ? '#3b82f6' : C.border}`,
                  borderRadius: '50%',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  color: C.text,
                  transition: 'all 0.2s',
                  outline: 'none'
                }}
              >
                <MdNotifications size={20} color={systemUnreadCount > 0 ? '#3b82f6' : C.text} />
                {systemUnreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    background: '#EF4444',
                    color: '#FFFFFF',
                    fontSize: '10px',
                    fontWeight: 900,
                    minWidth: '18px',
                    height: '18px',
                    borderRadius: '9px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                    boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)',
                    border: `2px solid ${C.card}`
                  }}>
                    {systemUnreadCount > 99 ? '99+' : systemUnreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {notifMenuOpen && (
                <div style={{
                  position: 'absolute',
                  top: '48px',
                  right: 0,
                  width: '340px',
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: '16px',
                  boxShadow: '0 12px 36px rgba(0,0,0,0.25)',
                  padding: '16px',
                  zIndex: 1000,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}`, paddingBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: C.text }}>Notifications</h4>
                      {systemUnreadCount > 0 && (
                        <span style={{ background: '#3b82f620', color: '#3b82f6', fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px' }}>
                          {systemUnreadCount} Unread
                        </span>
                      )}
                    </div>
                    {systemUnreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* System Notifications List */}
                    {notificationsList.length > 0 ? (
                      notificationsList.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={async () => {
                            if (!notif.is_read) {
                              try {
                                await api.post('/notifications/read', { id: notif.id, ids: [notif.id] });
                                setSystemUnreadCount(prev => Math.max(0, prev - 1));
                                setNotificationsList(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
                              } catch (e) {
                                /* silent */
                              }
                            }
                            if (notif.link || notif.redirect_url) {
                              setNotifMenuOpen(false);
                              navigate(notif.link || notif.redirect_url);
                            }
                          }}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '10px',
                            background: notif.is_read ? 'transparent' : C.bgSecondary,
                            border: `1px solid ${C.border}`,
                            cursor: notif.link || notif.redirect_url ? 'pointer' : 'default',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                          }}
                        >
                          <div style={{ fontSize: '13px', fontWeight: 800, color: C.text, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{notif.title || 'Notification'}</span>
                            {!notif.is_read && (
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} />
                            )}
                          </div>
                          <p style={{ margin: 0, fontSize: '12px', color: C.textMid, lineHeight: 1.4 }}>
                            {notif.message}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign: 'center', padding: '24px 12px', color: C.textMid, fontSize: '13px' }}>
                        <MdNotifications style={{ fontSize: '24px', opacity: 0.4, marginBottom: '6px' }} />
                        <p style={{ margin: 0, fontWeight: 600 }}>No new notifications</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

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
        {(() => {
          const isMessenger = location.pathname.includes('/messenger');
          return (
            <main style={{ 
              flex: 1, 
              overflowY: isMessenger ? 'hidden' : 'auto', 
              padding: isMessenger ? 0 : '16px', 
              paddingBottom: isMobile && !isMessenger ? '76px' : isMessenger ? 0 : '16px',
              boxSizing: 'border-box',
              display: isMessenger ? 'flex' : 'block',
              flexDirection: 'column'
            }}>
              {!isMessenger && <AnnouncementBanner />}
              <Outlet />
              {!isHR && !isMessenger && <Chatbot />}
            </main>
          );
        })()}

        {/* ── Mobile Bottom Navigation Bar ── */}
        {isMobile && (
          <nav
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, height: 'calc(60px + env(safe-area-inset-bottom, 0px))',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              background: C.card, borderTop: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-around',
              zIndex: 990, boxShadow: '0 -4px 15px rgba(0,0,0,0.08)',
              boxSizing: 'border-box'
            }}
            className="md:hidden"
          >
            {/* Dashboard */}
            <NavLink
              to={isHR ? "/hr/dashboard" : "/admin/dashboard"}
              onClick={() => setMobileMenuOpen(false)}
              style={({ isActive }) => ({
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '3px', textDecoration: 'none', color: isActive ? '#3b82f6' : C.textSecondary,
                fontSize: '11px', fontWeight: isActive ? 800 : 600, flex: 1
              })}
            >
              <Icons.dashboard size={18} />
              <span>{isHR ? 'HR' : 'Dashboard'}</span>
            </NavLink>

            {/* Applications */}
            {!isHR && (
              <NavLink
                to="/admin/applications"
                onClick={() => setMobileMenuOpen(false)}
                style={({ isActive }) => ({
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: '3px', textDecoration: 'none', color: isActive ? '#3b82f6' : C.textSecondary,
                  fontSize: '11px', fontWeight: isActive ? 800 : 600, flex: 1
                })}
              >
                <Icons.creditCard size={18} />
                <span>Apps</span>
              </NavLink>
            )}

            {/* Messenger */}
            <NavLink
              to="/admin/messenger"
              onClick={() => setMobileMenuOpen(false)}
              style={({ isActive }) => ({
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '3px', textDecoration: 'none', color: isActive ? '#3b82f6' : C.textSecondary,
                fontSize: '11px', fontWeight: isActive ? 800 : 600, flex: 1, position: 'relative'
              })}
            >
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <FaComments size={18} />
                {messengerUnread > 0 && (
                  <span style={{
                    position: 'absolute', top: '-6px', right: '-8px',
                    background: '#EF4444', color: '#fff', fontSize: '9px', fontWeight: 900,
                    minWidth: '14px', height: '14px', borderRadius: '7px', padding: '0 2px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {messengerUnread > 99 ? '99+' : messengerUnread}
                  </span>
                )}
              </div>
              <span>Message</span>
            </NavLink>

            {/* Customers / Leads */}
            {!isHR && !isPanChecker && !isRemarkOperator && !isQdOperator && !isKycOperator && (
              <NavLink
                to="/admin/leads"
                onClick={() => setMobileMenuOpen(false)}
                style={({ isActive }) => ({
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: '3px', textDecoration: 'none', color: isActive ? '#3b82f6' : C.textSecondary,
                  fontSize: '11px', fontWeight: isActive ? 800 : 600, flex: 1
                })}
              >
                <Icons.trending size={18} />
                <span>Leads</span>
              </NavLink>
            )}

            {/* Menu / More Drawer Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '3px', background: 'none', border: 'none', cursor: 'pointer',
                color: mobileMenuOpen ? '#3b82f6' : C.textSecondary, fontSize: '11px', fontWeight: mobileMenuOpen ? 800 : 600,
                flex: 1
              }}
            >
              <div style={{ fontSize: '16px', fontWeight: 900, lineHeight: 1 }}>☰</div>
              <span>Menu</span>
            </button>
          </nav>
        )}
      </div>
    </div>
  );
};

export default AdminLayout;
