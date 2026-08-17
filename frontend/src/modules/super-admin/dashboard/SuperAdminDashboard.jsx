import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import { Icons } from '../../../components/Icon/PartnerIcons';

const MiniChart = ({ color }) => (
  <svg width="100%" height="16" viewBox="0 0 100 30" preserveAspectRatio="none" style={{ marginTop: 'auto', paddingTop: '2px' }}>
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
    designation: ''
  });
  
  const [formLoading, setFormLoading] = useState(false);
  const [formErr, setFormErr] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // ── Edit Admin State ──
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editForm, setEditForm] = useState({
    id: '',
    fullName: '',
    email: '',
    mobile: '',
    designation: '',
    status: 'active',
    bank_ids: [],
    password: ''
  });
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editBankSearchQuery, setEditBankSearchQuery] = useState('');

  const handleOpenEditAdminModal = (admin) => {
    const bankIds = admin.bank_ids || admin.assigned_banks?.map(b => b.id || b._id) || [];
    setEditingAdmin(admin);
    setEditForm({
      id: admin._id || admin.id,
      fullName: admin.fullName || admin.full_name || '',
      email: admin.email || '',
      mobile: admin.mobile || '',
      designation: admin.designation || 'Operation Head',
      status: admin.status || 'active',
      bank_ids: bankIds,
      password: ''
    });
    setEditBankSearchQuery('');
    setShowEditModal(true);
  };

  const handleEditAdminSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.id) return;
    setSubmittingEdit(true);
    try {
      const isOpHead = ['Operational Head', 'OPERATIONAL_HEAD', 'Backend', 'BACKEND'].includes(editForm.designation);
      if (isOpHead && editForm.bank_ids.length === 0) {
        alert('Please select at least one assigned bank for Operational Head / Backend designation');
        setSubmittingEdit(false);
        return;
      }
      const payload = {
        fullName: editForm.fullName,
        email: editForm.email,
        mobile: editForm.mobile,
        designation: editForm.designation,
        status: editForm.status,
        bank_ids: editForm.bank_ids
      };
      if (editForm.password) {
        payload.password = editForm.password;
      }
      const res = await api.put(`/superadmin/admins/${editForm.id}`, payload);
      if (res.data?.success) {
        alert('Admin record updated successfully!');
        setShowEditModal(false);
        fetchAdmins();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update admin record');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // ── Operation Head Bank Assignment State ──
  const [selectedOpHead, setSelectedOpHead] = useState(null);
  const [allBanks, setAllBanks] = useState([]);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [assignedBankIds, setAssignedBankIds] = useState([]);
  const [selectedCreateBankIds, setSelectedCreateBankIds] = useState([]);
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [expandedAdminBanks, setExpandedAdminBanks] = useState({});

  // Fetch Admins
  const fetchAdmins = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get('/superadmin/admins');
      if (res.data && res.data.success) {
        setAdmins(res.data.data.map(a => ({ ...a, _id: a.id, fullName: a.fullName || a.full_name, employeeId: a.employeeId || a.employee_id })));
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

  const handleOpenBankModal = async (admin) => {
    setSelectedOpHead(admin);
    setAssignedBankIds(admin.bank_ids || admin.assigned_banks?.map(b => b.id) || []);
    setBankSearchQuery('');
    setBankModalOpen(true);

    try {
      const res = await api.get('/banks');
      if (res.data && res.data.data) {
        setAllBanks(res.data.data);
      }
      const assignedRes = await api.get(`/superadmin/admins/${admin._id || admin.id}/banks`);
      if (assignedRes.data && assignedRes.data.data) {
        setAssignedBankIds(assignedRes.data.data.map(b => b.id || b));
      }
    } catch (err) {
      console.error('Failed to load bank assignment info:', err);
    }
  };

  const handleToggleBankAssignment = async (bankId) => {
    let updated;
    if (assignedBankIds.includes(bankId)) {
      updated = assignedBankIds.filter(id => id !== bankId);
    } else {
      updated = [...assignedBankIds, bankId];
    }
    setAssignedBankIds(updated);

    try {
      await api.put(`/superadmin/admins/${selectedOpHead.id}/banks`, {
        bank_ids: updated
      });
      fetchAdmins();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update bank assignment');
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
    if (!form.fullName || !form.email || !form.mobile || !form.role || !form.password || !form.confirmPassword || !form.designation) {
      return setFormErr('All fields marked with * are required');
    }

    if (form.password !== form.confirmPassword) {
      return setFormErr('Passwords do not match');
    }

    if (form.password.length < 8) {
      return setFormErr('Password must be at least 8 characters long');
    }

    const isOpHead = ['Operational Head', 'OPERATIONAL_HEAD', 'Backend', 'BACKEND', 'Administrative Operator', 'ADMINISTRATIVE OPERATOR', 'ADMINISTRATIVE_OPERATOR'].includes(form.designation);
    if (isOpHead && selectedCreateBankIds.length === 0) {
      return setFormErr('At least one bank must be selected for Operational Head or Administrative Operator designation');
    }

    setFormLoading(true);
    try {
      const payload = {
        ...form,
        bank_ids: selectedCreateBankIds
      };
      const res = await api.post('/superadmin/create-admin', payload);
      if (res.data && res.data.success) {
        setFormSuccess('Admin created successfully.');
        setForm({
          fullName: '',
          email: '',
          mobile: '',
          role: 'ADMIN',
          password: '',
          confirmPassword: '',
          designation: ''
        });
        setSelectedCreateBankIds([]);
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
    total: businessStats?.admins?.total_admins ?? admins.length,
    active: businessStats?.admins?.active_admins ?? admins.filter(a => a.status === 'active' || a.isActive).length,
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
    { label: "Total Admins", val: stats.total, icon: <Icons.profile size={18} />, color: "#3B82F6", path: "/super-admin/dashboard" },
    { label: "Active Admins", val: stats.active, icon: <Icons.check size={18} />, color: "#10B981", path: "/super-admin/dashboard" },
    { label: "Pending KYC", val: bStats.Partners?.pending_kyc ?? bStats.partners?.pending_kyc ?? 0, icon: <Icons.clock size={18} />, color: "#F59E0B", path: "/super-admin/partners?kyc_status=pending" },
    { label: "Pending Leads", val: bStats.applications?.pending_leads ?? bStats.leads?.pending_leads ?? 0, icon: <Icons.clock size={18} />, color: "#F97316", path: "/super-admin/crm?status=operational_verified" },
    { label: "Total Leads", val: bStats.leads?.total_leads ?? bStats.applications?.total ?? 0, icon: <Icons.trending size={18} />, color: "#8B5CF6", path: "/super-admin/leads" },
    { label: "Approved Leads", val: bStats.leads?.approved_leads ?? bStats.applications?.approved ?? 0, icon: <Icons.check size={18} />, color: "#10B981", path: "/super-admin/crm?status=super_admin_approved" },
    { label: "Rejected Leads", val: bStats.leads?.rejected_leads ?? bStats.applications?.rejected ?? 0, icon: <Icons.x size={18} />, color: "#EF4444", path: "/super-admin/leads?status=rejected" },
    { label: "Commission Paid", val: `₹${parseFloat(bStats.withdrawal?.total_commission_paid ?? bStats.applications?.total_commission ?? 0).toLocaleString("en-IN")}`, icon: <Icons.wallet size={18} />, color: "#10B981", path: "/super-admin/commissions" },
    { label: "Pending Withdrawals", val: bStats.withdrawal?.pending_withdrawals ?? 0, icon: <Icons.clock size={18} />, color: "#F59E0B", path: "/super-admin/wallet?tab=withdrawals" },
    { label: "Total Banks", val: bStats.banks?.total_banks ?? 0, icon: <Icons.wallet size={18} />, color: "#3B82F6", path: "/super-admin/banks" },
    { label: "Total Products", val: bStats.products?.total_products ?? 0, icon: <Icons.creditCard size={18} />, color: "#8B5CF6", path: "/super-admin/products" }
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
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(5, 1fr)", gap: "10px" }}>
        {cardData.map((card, idx) => (
          <div 
            key={idx} 
            onClick={() => navigate(card.path)}
            style={{ 
              background: C.card, 
              borderRadius: "12px", 
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.04)", 
              border: `1px solid ${C.border}`,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              cursor: "pointer",
              transition: "transform 0.15s, box-shadow 0.15s",
              padding: "10px 12px"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 12px rgba(0, 0, 0, 0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.04)";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "34px", height: "34px", background: `${card.color}15`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: card.color, flexShrink: 0 }}>
                {card.icon}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: "18px", fontWeight: 800, color: C.text, lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.val}</div>
                <div style={{ fontSize: "11.5px", fontWeight: 700, color: C.textMid, marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.label}</div>
              </div>
            </div>
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
                    <th style={{ padding: "16px 24px" }}>Assigned Banks</th>
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
                        <button
                          onClick={() => handleOpenBankModal(admin)}
                          style={{
                            background: admin.assigned_banks?.length ? "#ECFDF5" : "#F3F4F6",
                            color: admin.assigned_banks?.length ? "#059669" : "#6B7280",
                            border: `1px solid ${admin.assigned_banks?.length ? "#6EE7B7" : "#D1D5DB"}`,
                            borderRadius: "6px",
                            padding: "4px 10px",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px"
                          }}
                        >
                          🏦 {admin.assigned_banks?.length ? `${admin.assigned_banks.length} Banks` : 'Assign Banks'}
                        </button>
                        {admin.assigned_banks?.length > 0 && (() => {
                          const bankList = admin.assigned_banks;
                          const adminKey = admin._id || admin.id;
                          const isExpanded = !!expandedAdminBanks[adminKey];

                          if (bankList.length > 5 && !isExpanded) {
                            const firstBank = bankList[0]?.name || bankList[0]?.short_code || 'Bank';
                            return (
                              <div style={{ fontSize: "11px", color: "#4B5563", marginTop: "4px", maxWidth: "200px", lineHeight: 1.4 }}>
                                <span>{firstBank}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedAdminBanks(prev => ({ ...prev, [adminKey]: true }));
                                  }}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    color: "#2563EB",
                                    cursor: "pointer",
                                    fontWeight: 800,
                                    fontSize: "11px",
                                    padding: 0,
                                    marginLeft: "4px",
                                    textDecoration: "underline"
                                  }}
                                >
                                  ...Read More (+{bankList.length - 1} more)
                                </button>
                              </div>
                            );
                          }

                          return (
                            <div style={{ fontSize: "11px", color: "#4B5563", marginTop: "4px", maxWidth: "220px", lineHeight: 1.4 }}>
                              {bankList.map(b => b.name || b.short_code).join(', ')}
                              {bankList.length > 5 && isExpanded && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedAdminBanks(prev => ({ ...prev, [adminKey]: false }));
                                  }}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    color: "#2563EB",
                                    cursor: "pointer",
                                    fontWeight: 800,
                                    fontSize: "11px",
                                    padding: 0,
                                    marginLeft: "6px",
                                    textDecoration: "underline"
                                  }}
                                >
                                  Show Less
                                </button>
                              )}
                            </div>
                          );
                        })()}
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
                            onClick={() => handleOpenEditAdminModal(admin)}
                            style={{
                              background: "#FFFFFF",
                              color: "#2563EB",
                              border: "1px solid #BFDBFE",
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
                            title="Edit Admin"
                            onMouseEnter={e => {
                              e.currentTarget.style.background = "#EFF6FF";
                              e.currentTarget.style.borderColor = "#93C5FD";
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = "#FFFFFF";
                              e.currentTarget.style.borderColor = "#BFDBFE";
                            }}
                          >
                            <span style={{ fontSize: "14px" }}>✏️</span>
                          </button>
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



              {/* Designation */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Designation *</label>
                <select
                  name="designation"
                  value={form.designation}
                  onChange={(e) => {
                    handleChange(e);
                    if (['Operational Head', 'Backend', 'Administrative Operator'].includes(e.target.value) && allBanks.length === 0) {
                      api.get('/banks').then(res => {
                        if (res.data && res.data.data) setAllBanks(res.data.data);
                      }).catch(err => console.error(err));
                    }
                  }}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: "8px", fontSize: "14px", color: "#111827", outline: "none", transition: "border-color 0.2s", boxSizing: "border-box", background: "#FFFFFF" }}
                  onFocus={e => e.currentTarget.style.borderColor = "#3B82F6"}
                  onBlur={e => e.currentTarget.style.borderColor = "#D1D5DB"}
                  required
                >
                  <option value="">Select Designation...</option>
                  <option value="Operational Head">Operational Head</option>
                  <option value="Administrative Operator">Administrative Operator</option>
                  <option value="Super Admin">Super Admin</option>
                </select>
              </div>

              {/* Operational Head / Administrative Operator Bank Assignment Section */}
              {(['Operational Head', 'OPERATIONAL_HEAD', 'Backend', 'BACKEND', 'Administrative Operator', 'ADMINISTRATIVE OPERATOR', 'ADMINISTRATIVE_OPERATOR'].includes(form.designation)) && (
                <div style={{ gridColumn: "span 2", background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: "12px", padding: "16px", marginTop: "4px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <div>
                      <label style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A", display: "block" }}>Assign Banks *</label>
                      <span style={{ fontSize: "12px", color: "#64748B" }}>Select one or multiple banks assigned to this Admin</span>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        type="button"
                        onClick={() => setSelectedCreateBankIds(allBanks.map(b => b.id))}
                        style={{ padding: "4px 10px", fontSize: "12px", fontWeight: 600, background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", borderRadius: "6px", cursor: "pointer" }}
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedCreateBankIds([])}
                        style={{ padding: "4px 10px", fontSize: "12px", fontWeight: 600, background: "#F1F5F9", color: "#64748B", border: "1px solid #CBD5E1", borderRadius: "6px", cursor: "pointer" }}
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="Search Banks..."
                    value={bankSearchQuery}
                    onChange={(e) => setBankSearchQuery(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #CBD5E1", borderRadius: "6px", fontSize: "13px", marginBottom: "12px", outline: "none", boxSizing: "border-box" }}
                  />

                  <div style={{ maxHeight: "180px", overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px", paddingRight: "4px" }}>
                    {allBanks.filter(b => b.name.toLowerCase().includes((bankSearchQuery || '').toLowerCase()) || (b.short_code || '').toLowerCase().includes((bankSearchQuery || '').toLowerCase())).map(bank => {
                      const isChecked = selectedCreateBankIds.includes(bank.id);
                      return (
                        <div
                          key={bank.id}
                          onClick={() => {
                            if (isChecked) {
                              setSelectedCreateBankIds(selectedCreateBankIds.filter(id => id !== bank.id));
                            } else {
                              setSelectedCreateBankIds([...selectedCreateBankIds, bank.id]);
                            }
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            border: `1px solid ${isChecked ? "#2563EB" : "#CBD5E1"}`,
                            background: isChecked ? "#EFF6FF" : "#FFFFFF",
                            cursor: "pointer",
                            transition: "all 0.15s"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            {bank.logo_url ? (
                              <img src={bank.logo_url} alt={bank.name} style={{ width: "20px", height: "20px", objectFit: "contain" }} />
                            ) : (
                              <div style={{ width: "20px", height: "20px", background: "#DBEAFE", borderRadius: "4px", fontSize: "10px", fontWeight: 800, color: "#1E40AF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {bank.short_code?.substring(0, 2) || 'BK'}
                              </div>
                            )}
                            <span style={{ fontSize: "13px", fontWeight: 600, color: "#1E293B" }}>{bank.name}</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // Handled by parent div
                            style={{ cursor: "pointer" }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  {selectedCreateBankIds.length === 0 && (
                    <div style={{ fontSize: "12px", color: "#EF4444", marginTop: "6px", fontWeight: 500 }}>
                      ⚠️ At least one bank must be selected for an Operational Head.
                    </div>
                  )}
                </div>
              )}
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

      {/* Edit Admin Modal */}
      {showEditModal && editingAdmin && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(17, 24, 39, 0.7)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "20px", backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: "#FFFFFF", borderRadius: "16px", padding: "24px",
            maxWidth: "650px", width: "100%", maxHeight: "90vh", overflowY: "auto",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
          }}>
            <div style={{ borderBottom: `1px solid #F3F4F6`, paddingBottom: "14px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#111827", margin: 0 }}>✏️ Edit Administrator Details</h3>
                <p style={{ fontSize: "13px", color: "#6B7280", margin: "2px 0 0 0" }}>Update admin designation, permissions, status and bank assignments</p>
              </div>
              <button onClick={() => setShowEditModal(false)} style={{ background: "#F3F4F6", border: "none", color: "#4B5563", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icons.x size={18} />
              </button>
            </div>

            <form onSubmit={handleEditAdminSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
                
                {/* Full Name */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Full Name *</label>
                  <input
                    type="text"
                    value={editForm.fullName}
                    onChange={e => setEditForm({ ...editForm, fullName: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Email Address *</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                    required
                  />
                </div>

                {/* Mobile */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Mobile Number *</label>
                  <input
                    type="text"
                    value={editForm.mobile}
                    onChange={e => setEditForm({ ...editForm, mobile: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                    required
                  />
                </div>

                {/* Designation */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Designation *</label>
                  <select
                    value={editForm.designation}
                    onChange={e => {
                      const val = e.target.value;
                      setEditForm({ ...editForm, designation: val });
                      if (['Operational Head', 'Backend', 'Administrative Operator'].includes(val) && allBanks.length === 0) {
                        api.get('/banks').then(res => {
                          if (res.data && res.data.data) setAllBanks(res.data.data);
                        }).catch(err => console.error(err));
                      }
                    }}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                    required
                  >
                    <option value="Operational Head">Operational Head</option>
                    <option value="Administrative Operator">Administrative Operator</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Account Status *</label>
                  <select
                    value={editForm.status}
                    onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                    required
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {/* Password (Optional reset) */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>New Password (Optional)</label>
                  <input
                    type="password"
                    placeholder="Leave blank to keep unchanged"
                    value={editForm.password}
                    onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                  />
                </div>

                {/* Bank Assignments (If Operational Head or Administrative Operator) */}
                {(['Operational Head', 'OPERATIONAL_HEAD', 'Backend', 'BACKEND', 'Administrative Operator', 'ADMINISTRATIVE OPERATOR', 'ADMINISTRATIVE_OPERATOR'].includes(editForm.designation)) && (
                  <div style={{ gridColumn: "span 2", background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: "12px", padding: "16px", marginTop: "4px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <div>
                        <label style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A", display: "block" }}>Assigned Banks *</label>
                        <span style={{ fontSize: "12px", color: "#64748B" }}>Select banks assigned to this Admin</span>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          type="button"
                          onClick={() => setEditForm({ ...editForm, bank_ids: allBanks.map(b => b.id) })}
                          style={{ padding: "4px 10px", fontSize: "12px", fontWeight: 600, background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", borderRadius: "6px", cursor: "pointer" }}
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditForm({ ...editForm, bank_ids: [] })}
                          style={{ padding: "4px 10px", fontSize: "12px", fontWeight: 600, background: "#F1F5F9", color: "#64748B", border: "1px solid #CBD5E1", borderRadius: "6px", cursor: "pointer" }}
                        >
                          Clear All
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder="Search Banks..."
                      value={editBankSearchQuery}
                      onChange={(e) => setEditBankSearchQuery(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #CBD5E1", borderRadius: "6px", fontSize: "13px", marginBottom: "12px", outline: "none", boxSizing: "border-box" }}
                    />

                    <div style={{ maxHeight: "180px", overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px", paddingRight: "4px" }}>
                      {allBanks.filter(b => b.name.toLowerCase().includes((editBankSearchQuery || '').toLowerCase()) || (b.short_code || '').toLowerCase().includes((editBankSearchQuery || '').toLowerCase())).map(bank => {
                        const isChecked = editForm.bank_ids.includes(bank.id);
                        return (
                          <div
                            key={bank.id}
                            onClick={() => {
                              if (isChecked) {
                                setEditForm({ ...editForm, bank_ids: editForm.bank_ids.filter(id => id !== bank.id) });
                              } else {
                                setEditForm({ ...editForm, bank_ids: [...editForm.bank_ids, bank.id] });
                              }
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "8px 12px",
                              borderRadius: "8px",
                              border: `1px solid ${isChecked ? "#2563EB" : "#CBD5E1"}`,
                              background: isChecked ? "#EFF6FF" : "#FFFFFF",
                              cursor: "pointer",
                              transition: "all 0.15s"
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              {bank.logo_url ? (
                                <img src={bank.logo_url} alt={bank.name} style={{ width: "20px", height: "20px", objectFit: "contain" }} />
                              ) : (
                                <div style={{ width: "20px", height: "20px", background: "#DBEAFE", borderRadius: "4px", fontSize: "10px", fontWeight: 800, color: "#1E40AF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  {bank.short_code?.substring(0, 2) || 'BK'}
                                </div>
                              )}
                              <span style={{ fontSize: "13px", fontWeight: 600, color: "#1E293B" }}>{bank.name}</span>
                            </div>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              style={{ cursor: "pointer" }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px", borderTop: `1px solid #F3F4F6`, paddingTop: "20px" }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{ background: "#FFFFFF", border: "1px solid #D1D5DB", color: "#374151", padding: "10px 20px", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  style={{ background: "#2563EB", border: "none", color: "#FFFFFF", padding: "10px 20px", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: submittingEdit ? "not-allowed" : "pointer", opacity: submittingEdit ? 0.7 : 1 }}
                >
                  {submittingEdit ? 'Saving Changes...' : 'Save Admin Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Assign Banks Modal */}
      {bankModalOpen && selectedOpHead && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(17, 24, 39, 0.7)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "20px", backdropFilter: "blur(4px)"
        }}>
          <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: "24px", maxWidth: "550px", width: "100%", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}>
            <div style={{ borderBottom: `1px solid #F3F4F6`, paddingBottom: "14px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#111827", margin: 0 }}>Assign Banks & Products</h3>
                <p style={{ fontSize: "13px", color: "#6B7280", margin: "2px 0 0 0" }}>
                  Operation Head: <strong style={{ color: "#2563EB" }}>{selectedOpHead.fullName || selectedOpHead.full_name}</strong> ({selectedOpHead.department})
                </p>
              </div>
              <button onClick={() => setBankModalOpen(false)} style={{ background: "#F3F4F6", border: "none", color: "#4B5563", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icons.x size={18} />
              </button>
            </div>

            <p style={{ fontSize: "13px", color: "#374151", marginBottom: "14px", fontWeight: 600 }}>
              Select Banks managed by this Operation Head. All applications under selected banks will be routed to this Operation Head:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {allBanks.length === 0 ? (
                <div style={{ color: "#6B7280", padding: "20px", textAlign: "center" }}>Loading banks list...</div>
              ) : (
                allBanks.map(bank => {
                  const isChecked = assignedBankIds.includes(bank.id);
                  return (
                    <div
                      key={bank.id}
                      onClick={() => handleToggleBankAssignment(bank.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 16px",
                        borderRadius: "10px",
                        border: `1.5px solid ${isChecked ? "#2563EB" : "#E5E7EB"}`,
                        background: isChecked ? "#EFF6FF" : "#F9FAFB",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        {bank.logo_url ? (
                          <img src={bank.logo_url} alt={bank.name} style={{ width: "32px", height: "32px", objectFit: "contain", borderRadius: "6px" }} />
                        ) : (
                          <div style={{ width: "32px", height: "32px", background: "#DBEAFE", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#1D4ED8", fontSize: "12px" }}>
                            {bank.short_code?.substring(0, 3) || 'BNK'}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "14px", color: "#111827" }}>{bank.name}</div>
                          <div style={{ fontSize: "11px", color: "#6B7280" }}>Short code: {bank.short_code}</div>
                        </div>
                      </div>

                      <div style={{ width: "22px", height: "22px", borderRadius: "6px", border: `2px solid ${isChecked ? "#2563EB" : "#9CA3AF"}`, background: isChecked ? "#2563EB" : "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF", fontWeight: 800, fontSize: "13px" }}>
                        {isChecked ? '✓' : ''}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px", paddingTop: "14px", borderTop: "1px solid #F3F4F6" }}>
              <button
                onClick={() => setBankModalOpen(false)}
                style={{ background: "#2563EB", border: "none", color: "#FFFFFF", padding: "10px 24px", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
              >
                Done / Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
