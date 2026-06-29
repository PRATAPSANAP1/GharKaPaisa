import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import { Icons } from '../../../components/Icon/PartnerIcons';

const MiniChart = ({ color }) => (
  <svg width="100%" height="30" viewBox="0 0 100 30" preserveAspectRatio="none" style={{ marginTop: 'auto', paddingTop: '10px' }}>
    <path
      d="M0,25 C10,15 20,25 30,10 C40,-5 50,20 60,15 C70,10 80,25 90,5 L100,10 L100,30 L0,30 Z"
      fill={`${color}15`}
    />
    <path
      d="M0,25 C10,15 20,25 30,10 C40,-5 50,20 60,15 C70,10 80,25 90,5 L100,10"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export default function SuperAdminDashboard() {
  const { C, isDark } = useTheme();
  const S = makeS(C);
  const navigate = useNavigate();
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Data State
  const [admins, setAdmins] = useState([]);
  const [businessStats, setBusinessStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  // Form State
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    mobile: '',
    role: 'ADMIN',
    password: '',
    confirmPassword: '',
    department: 'Operations',
    designation: ''
  });
  
  const [formLoading, setFormLoading] = useState(false);
  const [formErr, setFormErr] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Fetch Admins
  const fetchAdmins = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get('/superadmin/admins');
      if (res.data && res.data.success) {
        setAdmins(res.data.data);
      } else {
        setErrorMsg('Failed to load admins list');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Error fetching administrative directory');
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinessStats = async () => {
    try {
      const res = await api.get('/reports/overview');
      if (res.data && res.data.success) {
        setBusinessStats(res.data.data);
      }
    } catch (e) {
      console.error('Failed to load business stats', e);
    }
  };

  useEffect(() => {
    fetchAdmins();
    fetchBusinessStats();
  }, []);

  // Handle Input change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Create Admin Submission
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setFormErr('');
    setFormSuccess('');

    // Validations
    if (!form.fullName || !form.email || !form.mobile || !form.role || !form.password || !form.confirmPassword || !form.department || !form.designation) {
      return setFormErr('All fields marked with * are required');
    }

    if (form.password !== form.confirmPassword) {
      return setFormErr('Passwords do not match');
    }

    if (form.password.length < 8) {
      return setFormErr('Password must be at least 8 characters long');
    }

    setFormLoading(true);
    try {
      const res = await api.post('/superadmin/create-admin', form);
      if (res.data && res.data.success) {
        setFormSuccess('Admin created successfully.');
        setForm({
          fullName: '',
          email: '',
          mobile: '',
          role: 'ADMIN',
          password: '',
          confirmPassword: '',
          department: 'Operations',
          designation: ''
        });
        fetchAdmins(); // Refresh
        setTimeout(() => setShowCreateModal(false), 1500);
      }
    } catch (err) {
      setFormErr(err.response?.data?.message || 'Failed to create administrative user');
    } finally {
      setFormLoading(false);
    }
  };

  // Toggle Admin block status
  const handleToggleBlock = async (userId, currentStatus) => {
    const shouldBlock = currentStatus === 'active';
    const actionLabel = shouldBlock ? 'suspend' : 'activate';
    
    if (!window.confirm(`Are you sure you want to ${actionLabel} this administrator?`)) {
      return;
    }

    try {
      const res = await api.post('/superadmin/block-user', {
        userId,
        block: shouldBlock
      });
      if (res.data && res.data.success) {
        fetchAdmins();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  // Delete Admin account
  const handleDeleteAdmin = async (userId) => {
    if (!window.confirm('Are you sure you want to PERMANENTLY delete this administrator? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await api.delete(`/superadmin/admins/${userId}`);
      if (res.data && res.data.success) {
        alert('Administrator account deleted successfully.');
        fetchAdmins();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  // Stats calculations
  const stats = {
    total: admins.length,
    active: admins.filter(a => a.status === 'active' || a.isActive).length,
    suspended: admins.filter(a => a.status === 'suspended').length
  };

  const bStats = businessStats || {
    Partners: { total: 0, active: 0, pending_kyc: 0 },
    leads: { total_leads: 0, approved_leads: 0, rejected_leads: 0, pending_leads: 0 },
    withdrawal: { pending_withdrawals: 0, total_commission_paid: 0 },
    banks: { total_banks: 0 },
    products: { total_products: 0 }
  };

  const cardData = [
    { label: "Total Admins", desc: "All registered administrators", val: stats.total, icon: <Icons.profile size={24} />, color: "#3B82F6", path: "/superadmin" },
    { label: "Active Admins", desc: "Currently active", val: stats.active, icon: <Icons.check size={24} />, color: "#10B981", path: "/superadmin" },
    { label: "Pending KYC", desc: "Awaiting verification", val: bStats.Partners?.pending_kyc || 0, icon: <Icons.clock size={24} />, color: "#F59E0B", path: "/superadmin/partners" },
    { label: "Total Leads", desc: "All leads generated", val: bStats.leads?.total_leads || 0, icon: <Icons.trending size={24} />, color: "#8B5CF6", path: "/superadmin/leads" },
    { label: "Approved Leads", desc: "Successfully approved", val: bStats.leads?.approved_leads || 0, icon: <Icons.check size={24} />, color: "#10B981", path: "/superadmin/leads" },
    { label: "Rejected Leads", desc: "Not approved", val: bStats.leads?.rejected_leads || 0, icon: <Icons.x size={24} />, color: "#EF4444", path: "/superadmin/leads" },
    { label: "Commission Paid", desc: "Total payout", val: `₹${parseFloat(bStats.withdrawal?.total_commission_paid || 0).toLocaleString("en-IN")}`, icon: <Icons.wallet size={24} />, color: "#10B981", path: "/superadmin/commissions" },
    { label: "Pending Withdrawals", desc: "Withdrawal requests", val: bStats.withdrawal?.pending_withdrawals || 0, icon: <Icons.clock size={24} />, color: "#F59E0B", path: "/superadmin/commissions" },
    { label: "Total Banks", desc: "Connected banks", val: bStats.banks?.total_banks || 0, icon: <Icons.wallet size={24} />, color: "#3B82F6", path: "/superadmin/banks" },
    { label: "Total Products", desc: "Available products", val: bStats.products?.total_products || 0, icon: <Icons.creditCard size={24} />, color: "#8B5CF6", path: "/superadmin/products" }
  ];

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `Joined ${date.getDate()} ${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
  };

  const getInitials = (name) => {
    if (!name) return 'NA';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // Pagination logic
  const totalPages = Math.ceil(admins.length / itemsPerPage);
  const paginatedAdmins = admins.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Top Banner / Welcome */}
      <div className="responsive-header" style={{ marginBottom: "4px", width: "100%" }}>
        <div>
          <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#111827", margin: 0, letterSpacing: "-0.5px" }}>System Administrators</h2>
          <p style={{ fontSize: "14px", color: "#6B7280", margin: "4px 0 0 0" }}>Manage and provision administrator credentials and permission settings.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(5, 1fr)", gap: "20px" }}>
        {cardData.map((card, idx) => (
          <div 
            key={idx} 
            onClick={() => navigate(card.path)}
            style={{ 
              background: C.card, 
              borderRadius: "16px", 
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)", 
              border: `1px solid ${C.border}`,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)";
            }}
          >
            <div style={{ padding: "20px 20px 10px 20px", display: "flex", alignItems: "flex-start", gap: "16px" }}>
              <div style={{ width: "48px", height: "48px", background: `${card.color}15`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: card.color, flexShrink: 0 }}>
                {card.icon}
              </div>
              <div>
                <div style={{ fontSize: "24px", fontWeight: 800, color: C.text, lineHeight: 1 }}>{card.val}</div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: C.textMid, marginTop: "4px" }}>{card.label}</div>
                <div style={{ fontSize: "12px", color: C.textLight, marginTop: "2px" }}>{card.desc}</div>
              </div>
            </div>
            <MiniChart color={card.color} />
          </div>
        ))}
      </div>

      {/* Main Container */}
      <div style={{ background: C.card, borderRadius: "16px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)", border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <div style={{ padding: "24px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "40px", height: "40px", background: isDark ? "rgba(255, 255, 255, 0.05)" : "#EFF6FF", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: isDark ? C.teal : "#3B82F6" }}>
                <Icons.profile size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: C.text, margin: 0 }}>Administrator Directory</h3>
                <p style={{ fontSize: "13px", color: C.textLight, margin: "2px 0 0 0" }}>View and manage all system administrators and employees</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button 
                onClick={fetchAdmins}
                style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#F9FAFB", border: `1px solid ${C.border}`, color: C.text, borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 600, padding: "8px 16px", transition: "all 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.1)" : "#F3F4F6"}
                onMouseLeave={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "#F9FAFB"}
              >
                🔄 Refresh
              </button>
              <button 
                onClick={() => setShowCreateModal(true)}
                style={{ background: C.teal, border: "none", color: "#FFFFFF", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 600, padding: "8px 16px", transition: "all 0.2s", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}
                onMouseEnter={e => e.currentTarget.style.background = C.tealDim}
                onMouseLeave={e => e.currentTarget.style.background = C.teal}
              >
                + Create Admin / Employee
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "64px", color: C.textLight }}>
              <div className="animate-spin" style={{ width: "32px", height: "32px", border: `3px solid ${C.teal}`, borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto 16px" }}></div>
              Loading directory list...
            </div>
          ) : errorMsg ? (
            <div style={{ padding: "24px", textAlign: "center", color: C.red, background: isDark ? "rgba(239, 68, 68, 0.1)" : "#FEF2F2", margin: "24px", borderRadius: "12px", border: `1px solid ${C.red}30` }}>
              <Icons.x size={24} style={{ margin: "0 auto 8px" }} />
              <p style={{ fontWeight: 600, margin: 0 }}>{errorMsg}</p>
            </div>
          ) : admins.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px", color: C.textLight }}>
              <p style={{ fontSize: "16px", margin: 0, color: C.text }}>No administrators provisioned yet.</p>
              <button 
                onClick={() => setShowCreateModal(true)}
                style={{ background: C.teal, border: "none", color: "#FFFFFF", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: 600, padding: "10px 20px", marginTop: "16px" }}
              >
                Create First Admin
              </button>
            </div>
          ) : (
            <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#F9FAFB", borderBottom: `1px solid #F3F4F6`, color: "#6B7280", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    <th style={{ padding: "16px 24px" }}>Administrator</th>
                    <th style={{ padding: "16px 24px" }}>Role & Emp ID</th>
                    <th style={{ padding: "16px 24px" }}>Contact Info</th>
                    <th style={{ padding: "16px 24px" }}>Department</th>
                    <th style={{ padding: "16px 24px" }}>Designation</th>
                    <th style={{ padding: "16px 24px" }}>Status</th>
                    <th style={{ padding: "16px 24px", textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: "14px", color: "#374151" }}>
                  {paginatedAdmins.map((admin) => {
                    const initials = getInitials(admin.fullName);
                    const isPS = initials === 'PS';
                    const avatarColor = isPS ? "#DBEAFE" : "#D1FAE5";
                    const avatarText = isPS ? "#1D4ED8" : "#047857";

                    return (
                    <tr key={admin._id} style={{ borderBottom: `1px solid #F3F4F6`, transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "16px 24px", display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: avatarColor, color: avatarText, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700 }}>
                          {initials}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: "#111827", fontSize: "14px" }}>{admin.fullName || 'No Name Provided'}</div>
                          <div style={{ fontSize: "12px", color: "#6B7280", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                            <Icons.calendar size={12} /> {formatDate(admin.createdAt)}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 800, color: "#2563EB", background: "#DBEAFE", padding: "2px 8px", borderRadius: "4px", textTransform: "uppercase", display: "inline-block", marginBottom: "4px" }}>{admin.role}</span>
                        <div style={{ fontFamily: "monospace", fontSize: "13px", color: "#4B5563", fontWeight: 600 }}>
                          {admin.employeeId}
                        </div>
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        <div style={{ fontWeight: 500, color: "#111827", display: "flex", alignItems: "center", gap: "6px" }}>
                          <Icons.mail size={14} color="#6B7280" /> {admin.email}
                        </div>
                        <div style={{ fontSize: "13px", color: "#4B5563", display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                          <Icons.phone size={14} color="#6B7280" /> {admin.mobile}
                        </div>
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, background: "#EFF6FF", color: "#2563EB" }}>
                          {admin.department}
                        </span>
                      </td>
                      <td style={{ padding: "16px 24px", color: "#374151", fontWeight: 500 }}>
                        {admin.designation}
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        {admin.status === 'active' || admin.isActive ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, color: "#059669" }}>
                            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10B981" }}></span> Active
                          </span>
                        ) : (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, color: "#DC2626" }}>
                            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#EF4444" }}></span> Suspended
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "16px 24px", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                          <button
                            onClick={() => handleToggleBlock(admin._id, admin.status)}
                            style={{
                              background: "#FFFFFF",
                              color: "#374151",
                              border: "1px solid #E5E7EB",
                              width: "32px",
                              height: "32px",
                              borderRadius: "8px",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              transition: "all 0.2s",
                              boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                            }}
                            title={admin.status === 'active' ? 'Suspend' : 'Activate'}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = "#F9FAFB";
                              e.currentTarget.style.borderColor = "#D1D5DB";
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = "#FFFFFF";
                              e.currentTarget.style.borderColor = "#E5E7EB";
                            }}
                          >
                            <span style={{ fontWeight: "bold", fontSize: "16px", lineHeight: "1", transform: "translateY(-4px)" }}>...</span>
                          </button>
                          <button
                            onClick={() => handleDeleteAdmin(admin._id)}
                            style={{
                              background: "#FFFFFF",
                              color: "#DC2626",
                              border: "1px solid #FEE2E2",
                              width: "32px",
                              height: "32px",
                              borderRadius: "8px",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              transition: "all 0.2s",
                              boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                            }}
                            title="Delete Admin"
                            onMouseEnter={e => {
                              e.currentTarget.style.background = "#FEF2F2";
                              e.currentTarget.style.borderColor = "#FCA5A5";
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = "#FFFFFF";
                              e.currentTarget.style.borderColor = "#FEE2E2";
                            }}
                          >
                            <span style={{ fontSize: "14px" }}>🗑️</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ padding: "16px 24px", borderTop: "1px solid #F3F4F6", display: "flex", alignItems: "center", justifyContent: "space-between", color: "#6B7280", fontSize: "14px" }}>
                <div>
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, admins.length)} of {admins.length} entries
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    style={{ padding: "6px 12px", background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "6px", cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.5 : 1 }}
                  >
                    &lt;
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button 
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      style={{ 
                        padding: "6px 12px", 
                        background: currentPage === i + 1 ? "#2563EB" : "#FFFFFF", 
                        color: currentPage === i + 1 ? "#FFFFFF" : "#374151",
                        border: "1px solid",
                        borderColor: currentPage === i + 1 ? "#2563EB" : "#E5E7EB",
                        borderRadius: "6px", 
                        cursor: "pointer" 
                      }}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    style={{ padding: "6px 12px", background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "6px", cursor: currentPage === totalPages ? "not-allowed" : "pointer", opacity: currentPage === totalPages ? 0.5 : 1 }}
                  >
                    &gt;
                  </button>
                </div>
              </div>
            )}
            </>
          )}
        </div>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(17, 24, 39, 0.7)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "20px", backdropFilter: "blur(4px)"
        }}>
          <div style={{ background: "#FFFFFF", borderRadius: "16px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)", padding: "24px", maxWidth: "600px", width: "100%", maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
            <div style={{ borderBottom: `1px solid #F3F4F6`, paddingBottom: "16px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#111827", margin: 0 }}>Provision Administrator</h3>
                <p style={{ fontSize: "13px", color: "#6B7280", margin: "4px 0 0 0" }}>Create a new admin or employee account.</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} style={{ background: "#F3F4F6", border: "none", color: "#4B5563", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#E5E7EB"} onMouseLeave={e => e.currentTarget.style.background = "#F3F4F6"}>
                <Icons.x size={18} />
              </button>
            </div>
          
          <form onSubmit={handleCreateAdmin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {formErr && (
              <div style={{ padding: "12px", background: "#FEF2F2", border: `1px solid #FCA5A5`, borderRadius: "10px", color: "#EF4444", fontSize: "14px", fontWeight: 500, display: "flex", alignItems: "center", gap: "8px" }}>
                <Icons.x size={18} /> {formErr}
              </div>
            )}
            
            {formSuccess && (
              <div style={{ padding: "12px", background: "#ECFDF5", border: `1px solid #6EE7B7`, borderRadius: "10px", color: "#059669", fontSize: "14px", fontWeight: 500, display: "flex", alignItems: "center", gap: "8px" }}>
                <Icons.check size={18} /> {formSuccess}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
              {/* Full Name */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Full Name *</label>
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="e.g. Pratap Sanap"
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: "8px", fontSize: "14px", color: "#111827", outline: "none", transition: "border-color 0.2s", boxSizing: "border-box" }}
                  onFocus={e => e.currentTarget.style.borderColor = "#3B82F6"}
                  onBlur={e => e.currentTarget.style.borderColor = "#D1D5DB"}
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Email Address *</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="e.g. manager@gharkapaisa.in"
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: "8px", fontSize: "14px", color: "#111827", outline: "none", transition: "border-color 0.2s", boxSizing: "border-box" }}
                  onFocus={e => e.currentTarget.style.borderColor = "#3B82F6"}
                  onBlur={e => e.currentTarget.style.borderColor = "#D1D5DB"}
                  required
                />
              </div>

              {/* Mobile */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Mobile Number *</label>
                <input
                  name="mobile"
                  value={form.mobile}
                  onChange={handleChange}
                  placeholder="10-digit number"
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: "8px", fontSize: "14px", color: "#111827", outline: "none", transition: "border-color 0.2s", boxSizing: "border-box" }}
                  onFocus={e => e.currentTarget.style.borderColor = "#3B82F6"}
                  onBlur={e => e.currentTarget.style.borderColor = "#D1D5DB"}
                  required
                />
              </div>

              {/* Role */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Role *</label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: "8px", fontSize: "14px", color: "#111827", outline: "none", transition: "border-color 0.2s", boxSizing: "border-box", background: "#FFFFFF" }}
                  onFocus={e => e.currentTarget.style.borderColor = "#3B82F6"}
                  onBlur={e => e.currentTarget.style.borderColor = "#D1D5DB"}
                  required
                >
                  <option value="ADMIN">Admin</option>
                  <option value="EMPLOYEE">Employee</option>
                </select>
              </div>

              {/* Password */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Password *</label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min 8 characters"
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: "8px", fontSize: "14px", color: "#111827", outline: "none", transition: "border-color 0.2s", boxSizing: "border-box" }}
                  onFocus={e => e.currentTarget.style.borderColor = "#3B82F6"}
                  onBlur={e => e.currentTarget.style.borderColor = "#D1D5DB"}
                  required
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Confirm Password *</label>
                <input
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat password"
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: "8px", fontSize: "14px", color: "#111827", outline: "none", transition: "border-color 0.2s", boxSizing: "border-box" }}
                  onFocus={e => e.currentTarget.style.borderColor = "#3B82F6"}
                  onBlur={e => e.currentTarget.style.borderColor = "#D1D5DB"}
                  required
                />
              </div>

              {/* Department */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Department *</label>
                <select
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: "8px", fontSize: "14px", color: "#111827", outline: "none", transition: "border-color 0.2s", boxSizing: "border-box", background: "#FFFFFF" }}
                  onFocus={e => e.currentTarget.style.borderColor = "#3B82F6"}
                  onBlur={e => e.currentTarget.style.borderColor = "#D1D5DB"}
                  required
                >
                  <option value="Operations">Operations</option>
                  <option value="Sales">Sales</option>
                  <option value="Credit">Credit</option>
                  <option value="Collection">Collection</option>
                  <option value="Support">Support</option>
                  <option value="Accounts">Accounts</option>
                  <option value="Marketing">Marketing</option>
                </select>
              </div>

              {/* Designation */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Designation *</label>
                <input
                  name="designation"
                  value={form.designation}
                  onChange={handleChange}
                  placeholder="e.g. Credit Officer"
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: "8px", fontSize: "14px", color: "#111827", outline: "none", transition: "border-color 0.2s", boxSizing: "border-box" }}
                  onFocus={e => e.currentTarget.style.borderColor = "#3B82F6"}
                  onBlur={e => e.currentTarget.style.borderColor = "#D1D5DB"}
                  required
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px", borderTop: `1px solid #F3F4F6`, paddingTop: "20px" }}>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ background: "#FFFFFF", border: "1px solid #D1D5DB", color: "#374151", padding: "10px 20px", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"}
                onMouseLeave={e => e.currentTarget.style.background = "#FFFFFF"}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                style={{ background: "#2563EB", border: "none", color: "#FFFFFF", padding: "10px 20px", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: formLoading ? "not-allowed" : "pointer", opacity: formLoading ? 0.7 : 1, transition: "background 0.2s", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}
                onMouseEnter={e => { if(!formLoading) e.currentTarget.style.background = "#1D4ED8"; }}
                onMouseLeave={e => { if(!formLoading) e.currentTarget.style.background = "#2563EB"; }}
              >
                {formLoading ? 'Creating User...' : 'Provision Admin'}
              </button>
            </div>
          </form>
          </div>
        </div>
      )}
    </div>
  );
}
