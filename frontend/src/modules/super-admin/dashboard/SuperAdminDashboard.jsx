import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { useAuthStore } from '../../../app/store/authStore';
import * as accountApi from '../../../services/accountStatus.api';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import { Icons } from '../../../components/Icon/PartnerIcons';
import { 
  Edit, 
  Trash2, 
  RefreshCw, 
  Search, 
  CreditCard, 
  Building2, 
  Check, 
  X, 
  AlertTriangle,
  Clock,
  UserCheck,
  UserX,
  History,
  Calendar,
  CalendarX,
  ShieldAlert,
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  Filter
} from 'lucide-react';

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

const CategoryWiseBankSelector = ({
  allBanks = [],
  categoryAssignments = [],
  onChange = () => {}
}) => {
  const [activeTab, setActiveTab] = useState('credit_card');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'credit_card', label: 'Credit Card', desc: 'Credit Card Applications' },
    { id: 'loc_eoc', label: 'LOC/EOC', desc: 'Loan on Credit Card & Smart EMI Applications' }
  ];

  const standardBanks = (Array.isArray(allBanks) ? allBanks : []).filter(b => {
    const isVirtualLocBank = (b.short_code || '').toUpperCase() === 'LOC_EOC' || b.is_loc_eoc || /loc[\s/_]*eoc|loan\s+on\s+card/i.test(b.name || '');
    return !isVirtualLocBank;
  });

  const isSelected = (cat, bankId) => {
    return (Array.isArray(categoryAssignments) ? categoryAssignments : []).some(
      item => (item.category || 'credit_card').toLowerCase() === cat && (item.bank_id === bankId || item.id === bankId)
    );
  };

  const handleToggle = (cat, bankId) => {
    let next;
    if (isSelected(cat, bankId)) {
      next = (Array.isArray(categoryAssignments) ? categoryAssignments : []).filter(
        item => !((item.category || 'credit_card').toLowerCase() === cat && (item.bank_id === bankId || item.id === bankId))
      );
    } else {
      next = [...(Array.isArray(categoryAssignments) ? categoryAssignments : []), { category: cat, bank_id: bankId }];
    }
    onChange(next);
  };

  const handleSelectAll = (cat) => {
    const otherCatItems = (Array.isArray(categoryAssignments) ? categoryAssignments : []).filter(
      item => (item.category || 'credit_card').toLowerCase() !== cat
    );
    const newCatItems = standardBanks.map(b => ({ category: cat, bank_id: b.id }));
    onChange([...otherCatItems, ...newCatItems]);
  };

  const handleClearAll = (cat) => {
    const next = (Array.isArray(categoryAssignments) ? categoryAssignments : []).filter(
      item => (item.category || 'credit_card').toLowerCase() !== cat
    );
    onChange(next);
  };

  return (
    <div style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: "12px", padding: "16px", marginTop: "8px" }}>
      <div style={{ marginBottom: "12px" }}>
        <label style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A", display: "block" }}>Assign Access (Category & Bank pairs) *</label>
        <span style={{ fontSize: "12px", color: "#64748B" }}>Select banks independently under each product category</span>
      </div>

      <div style={{ display: "flex", gap: "8px", borderBottom: "1.5px solid #E2E8F0", paddingBottom: "10px", marginBottom: "12px" }}>
        {categories.map(cat => {
          const count = (Array.isArray(categoryAssignments) ? categoryAssignments : []).filter(
            item => (item.category || 'credit_card').toLowerCase() === cat.id
          ).length;
          const isActive = activeTab === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveTab(cat.id)}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                border: "1px solid",
                borderColor: isActive ? "#2563EB" : "#CBD5E1",
                background: isActive ? "#EFF6FF" : "#FFFFFF",
                color: isActive ? "#1D4ED8" : "#475569",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.15s"
              }}
            >
              <span>{cat.label}</span>
              <span style={{
                background: isActive ? "#2563EB" : "#E2E8F0",
                color: isActive ? "#FFFFFF" : "#475569",
                fontSize: "11px",
                fontWeight: 800,
                padding: "1px 6px",
                borderRadius: "10px"
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {categories.filter(cat => cat.id === activeTab).map(cat => {
        const catAssignments = (Array.isArray(categoryAssignments) ? categoryAssignments : []).filter(
          item => (item.category || 'credit_card').toLowerCase() === cat.id
        );
        const filteredBanks = standardBanks.filter(b => 
          (b.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || 
          (b.short_code || '').toLowerCase().includes((searchQuery || '').toLowerCase())
        );

        return (
          <div key={cat.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>
                {cat.desc} ({catAssignments.length} selected)
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => handleSelectAll(cat.id)}
                  style={{ padding: "4px 10px", fontSize: "12px", fontWeight: 600, background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", borderRadius: "6px", cursor: "pointer" }}
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => handleClearAll(cat.id)}
                  style={{ padding: "4px 10px", fontSize: "12px", fontWeight: 600, background: "#F1F5F9", color: "#64748B", border: "1px solid #CBD5E1", borderRadius: "6px", cursor: "pointer" }}
                >
                  Clear All
                </button>
              </div>
            </div>

            <div style={{ position: "relative", marginBottom: "12px" }}>
              <input
                type="text"
                placeholder={`Search banks under ${cat.label}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "100%", padding: "8px 12px 8px 34px", border: "1px solid #CBD5E1", borderRadius: "6px", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
              />
              <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", pointerEvents: "none" }}>
                <Search size={14} color="#9CA3AF" />
              </span>
            </div>

            <div style={{ maxHeight: "200px", overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px", paddingRight: "4px" }}>
              {filteredBanks.map(bank => {
                const checked = isSelected(cat.id, bank.id);
                return (
                  <div
                    key={bank.id}
                    onClick={() => handleToggle(cat.id, bank.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: `1px solid ${checked ? (cat.id === 'loc_eoc' ? "#059669" : "#2563EB") : "#CBD5E1"}`,
                      background: checked ? (cat.id === 'loc_eoc' ? "#ECFDF5" : "#EFF6FF") : "#FFFFFF",
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
                      <div>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#1E293B" }}>{bank.name}</span>
                        {bank.short_code && (
                          <span style={{ fontSize: "10px", color: "#64748B", display: "block" }}>{bank.short_code}</span>
                        )}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}}
                      style={{ cursor: "pointer" }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {(Array.isArray(categoryAssignments) ? categoryAssignments : []).length === 0 && (
        <div style={{ fontSize: "12px", color: "#EF4444", marginTop: "8px", fontWeight: 500, display: "flex", alignItems: "center", gap: "4px" }}>
          <AlertTriangle size={14} /> At least one bank must be selected under Credit Card or LOC/EOC.
        </div>
      )}
    </div>
  );
};

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
  
  // Current User
  const currentUser = useAuthStore(state => state.user);

  // Status Filter State
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Account Lifecycle Action & Confirmation Modal State
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    admin: null,
    targetAction: 'ACTIVATE',
    mode: 'IMMEDIATE',
    scheduledAt: '',
    reason: '',
    submitting: false,
    error: ''
  });

  // Account Status Audit History Modal State
  const [auditModal, setAuditModal] = useState({
    isOpen: false,
    admin: null,
    loading: false,
    history: [],
    error: ''
  });

  // Notification Toast State
  const [actionToast, setActionToast] = useState(null);

  useEffect(() => {
    if (actionToast) {
      const timer = setTimeout(() => setActionToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [actionToast]);

  // Data State
  const [admins, setAdmins] = useState([]);
  const [adminSearch, setAdminSearch] = useState('');
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

  // ── Category-Wise Bank Assignment State ──
  const [createCategoryAssignments, setCreateCategoryAssignments] = useState([]);
  const [editCategoryAssignments, setEditCategoryAssignments] = useState([]);
  const [opHeadCategoryAssignments, setOpHeadCategoryAssignments] = useState([]);

  // ── Edit Admin State ──
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editForm, setEditForm] = useState({
    id: '',
    fullName: '',
    email: '',
    mobile: '',
    role: 'ADMIN',
    designation: '',
    status: 'active',
    bank_ids: [],
    password: ''
  });
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editBankSearchQuery, setEditBankSearchQuery] = useState('');

  const handleOpenEditAdminModal = (admin) => {
    const assigned = admin.assigned_banks || [];
    const catAssignments = assigned.map(b => ({
      category: (b.category || (b.is_loc_eoc ? 'loc_eoc' : 'credit_card')).toLowerCase(),
      bank_id: b.id || b._id || b.bank_id
    }));
    setEditingAdmin(admin);
    setEditCategoryAssignments(catAssignments);
    const validRoles = ['ADMIN', 'SUPER_ADMIN', 'EMPLOYEE', 'PARTNER', 'HR'];
    let currentRole = String(admin.role || '').toUpperCase().trim();
    if (!validRoles.includes(currentRole)) {
      currentRole = 'ADMIN';
    }
    setEditForm({
      id: admin._id || admin.id,
      fullName: admin.fullName || admin.full_name || '',
      email: admin.email || '',
      mobile: admin.mobile || '',
      role: currentRole,
      designation: admin.designation || 'Operational Head',
      status: admin.status || 'active',
      bank_ids: catAssignments.map(a => a.bank_id),
      password: ''
    });
    setEditBankSearchQuery('');
    if (allBanks.length === 0) {
      api.get('/banks').then(res => {
        if (res.data && res.data.data) setAllBanks(res.data.data);
      }).catch(err => console.error(err));
    }
    setShowEditModal(true);
  };

  const handleEditAdminSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.id) return;
    setSubmittingEdit(true);
    try {
      const isOpHead = ['Operational Head', 'OPERATIONAL_HEAD', 'Backend', 'BACKEND', 'Administrative Operator', 'ADMINISTRATIVE OPERATOR', 'ADMINISTRATIVE_OPERATOR', 'Administrative Sales Executive', 'ADMINISTRATIVE SALES EXECUTIVE', 'ADMINISTRATIVE_SALES_EXECUTIVE', 'PAN Checker', 'PAN CHECKER', 'PAN_CHECKER', 'Remark Operator', 'REMARK OPERATOR', 'REMARK_OPERATOR', 'QD Operator', 'QD OPERATOR', 'QD_OPERATOR', 'KYC Operator', 'KYC OPERATOR', 'KYC_OPERATOR', 'Final Status Operator', 'FINAL STATUS OPERATOR', 'FINAL_STATUS_OPERATOR', 'Querable Operator', 'QUERABLE OPERATOR', 'QUERABLE_OPERATOR', 'Queryable Operator', 'QUERYABLE OPERATOR', 'QUERYABLE_OPERATOR', 'Physical Curable Operator', 'PHYSICAL CURABLE OPERATOR', 'PHYSICAL_CURABLE_OPERATOR', 'Digital Curable Operator', 'DIGITAL CURABLE OPERATOR', 'DIGITAL_CURABLE_OPERATOR', 'Email Curable Operator', 'EMAIL CURABLE OPERATOR', 'EMAIL_CURABLE_OPERATOR', 'Physical Curable', 'Digital Curable', 'Email Curable'].includes(editForm.designation);
      if (isOpHead && editCategoryAssignments.length === 0) {
        alert('Please select at least one category and bank pair for this user');
        setSubmittingEdit(false);
        return;
      }
      const payload = {
        fullName: editForm.fullName,
        email: editForm.email,
        mobile: editForm.mobile,
        role: editForm.role,
        designation: editForm.designation,
        status: editForm.status,
        category_assignments: editCategoryAssignments,
        bank_ids: editCategoryAssignments.map(a => a.bank_id)
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
        const adminUsers = (res.data.data || [])
          .map(a => ({
            ...a,
            id: a.id || a._id,
            _id: a._id || a.id,
            fullName: a.fullName || a.full_name,
            employeeId: a.employeeId || a.employee_id
          }));
        setAdmins(adminUsers);
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
    const assigned = admin.assigned_banks || [];
    const catAssignments = assigned.map(b => ({
      category: (b.category || (b.is_loc_eoc ? 'loc_eoc' : 'credit_card')).toLowerCase(),
      bank_id: b.id || b._id || b.bank_id
    }));
    setOpHeadCategoryAssignments(catAssignments);
    setBankSearchQuery('');
    setBankModalOpen(true);

    try {
      const res = await api.get('/banks?limit=1000');
      let banksList = res.data && res.data.data ? (Array.isArray(res.data.data) ? res.data.data : res.data.data.rows || []) : [];
      setAllBanks(banksList);

      const assignedRes = await api.get(`/superadmin/admins/${admin._id || admin.id}/banks`);
      if (assignedRes.data && assignedRes.data.data) {
        const fetched = assignedRes.data.data.map(b => ({
          category: (b.category || (b.is_loc_eoc ? 'loc_eoc' : 'credit_card')).toLowerCase(),
          bank_id: b.id || b.bank_id
        }));
        setOpHeadCategoryAssignments(fetched);
      }
    } catch (err) {
      console.error('Failed to load bank assignment info:', err);
    }
  };

  const isBankAssigned = (bank) => {
    if (!bank) return false;
    if (assignedBankIds.includes(bank.id)) return true;
    const isLocEoc = (bank.short_code || '').toUpperCase() === 'LOC_EOC' || bank.is_loc_eoc || /loc[\s/_]*eoc|loan\s+on\s+card/i.test(bank.name || '');
    if (isLocEoc) {
      return assignedBankIds.some(id => {
        if (id === 'LOC_EOC' || id === bank.id) return true;
        const b = allBanks.find(item => item.id === id);
        return b && ((b.short_code || '').toUpperCase() === 'LOC_EOC' || b.is_loc_eoc || /loc[\s/_]*eoc|loan\s+on\s+card/i.test(b.name || ''));
      });
    }
    return false;
  };

  const handleToggleBankAssignment = async (bankId) => {
    const targetBank = allBanks.find(b => b.id === bankId) || { id: bankId };
    const isLocEoc = (targetBank.short_code || '').toUpperCase() === 'LOC_EOC' || targetBank.is_loc_eoc || /loc[\s/_]*eoc|loan\s+on\s+card/i.test(targetBank.name || '');
    const isCurrentlyAssigned = isBankAssigned(targetBank);

    let updated;
    if (isCurrentlyAssigned) {
      if (isLocEoc) {
        updated = (Array.isArray(assignedBankIds) ? assignedBankIds : []).filter(id => {
          if (id === 'LOC_EOC' || id === bankId) return false;
          const b = allBanks.find(item => item.id === id);
          return !(b && ((b.short_code || '').toUpperCase() === 'LOC_EOC' || b.is_loc_eoc || /loc[\s/_]*eoc|loan\s+on\s+card/i.test(b.name || '')));
        });
      } else {
        updated = (Array.isArray(assignedBankIds) ? assignedBankIds : []).filter(id => id !== bankId);
      }
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

  const handleSelectAllBanks = async (selectAll) => {
    const updated = selectAll ? allBanks.map(b => b.id) : [];
    setAssignedBankIds(updated);
    try {
      await api.put(`/superadmin/admins/${selectedOpHead.id}/banks`, {
        bank_ids: updated
      });
      fetchAdmins();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update bank assignments');
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

  const fetchAllBanksList = async () => {
    try {
      const res = await api.get('/banks?limit=1000');
      let banksList = res.data && res.data.data ? (Array.isArray(res.data.data) ? res.data.data : res.data.data.rows || []) : [];
      const hasLocEoc = banksList.some(b => (b.short_code || '').toUpperCase() === 'LOC_EOC' || String(b.name || '').toLowerCase().includes('loc/eoc') || String(b.name || '').toLowerCase().includes('loan on card'));
      if (!hasLocEoc) {
        banksList = [
          {
            id: 'LOC_EOC',
            name: 'LOC/EOC (Loan on Card & Smart EMI)',
            short_code: 'LOC_EOC',
            is_loc_eoc: true
          },
          ...banksList
        ];
      }
      setAllBanks(banksList);
      return banksList;
    } catch (err) {
      console.error('Failed to load banks:', err);
      return [];
    }
  };

  useEffect(() => {
    fetchAdmins();
    fetchBusinessStats();
    fetchAllBanksList();
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

    const isOpHead = ['Operational Head', 'OPERATIONAL_HEAD', 'Backend', 'BACKEND', 'Administrative Operator', 'ADMINISTRATIVE OPERATOR', 'ADMINISTRATIVE_OPERATOR', 'Administrative Sales Executive', 'ADMINISTRATIVE SALES EXECUTIVE', 'ADMINISTRATIVE_SALES_EXECUTIVE', 'PAN Checker', 'PAN CHECKER', 'PAN_CHECKER', 'Remark Operator', 'REMARK OPERATOR', 'REMARK_OPERATOR', 'QD Operator', 'QD OPERATOR', 'QD_OPERATOR', 'KYC Operator', 'KYC OPERATOR', 'KYC_OPERATOR', 'Final Status Operator', 'FINAL STATUS OPERATOR', 'FINAL_STATUS_OPERATOR', 'Querable Operator', 'QUERABLE OPERATOR', 'QUERABLE_OPERATOR', 'Queryable Operator', 'QUERYABLE OPERATOR', 'QUERYABLE_OPERATOR', 'Physical Curable Operator', 'PHYSICAL CURABLE OPERATOR', 'PHYSICAL_CURABLE_OPERATOR', 'Digital Curable Operator', 'DIGITAL CURABLE OPERATOR', 'DIGITAL_CURABLE_OPERATOR', 'Email Curable Operator', 'EMAIL CURABLE OPERATOR', 'EMAIL_CURABLE_OPERATOR', 'Physical Curable', 'Digital Curable', 'Email Curable'].includes(form.designation);
    if (isOpHead && createCategoryAssignments.length === 0) {
      return setFormErr('At least one category and bank pair must be selected.');
    }

    setFormLoading(true);
    try {
      const payload = {
        ...form,
        category_assignments: createCategoryAssignments,
        bank_ids: createCategoryAssignments.map(a => a.bank_id)
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
        setCreateCategoryAssignments([]);
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
    active: businessStats?.admins?.active_admins ?? (Array.isArray(admins) ? admins : []).filter(a => a.status === 'active' || a.isActive).length,
    suspended: (Array.isArray(admins) ? admins : []).filter(a => a.status === 'suspended').length
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

  const formatDateTimeIST = (dateString) => {
    if (!dateString) return '-';
    try {
      const d = new Date(dateString);
      return d.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }) + ' IST';
    } catch (e) {
      return String(dateString);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'NA';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getAccountLifecycleStatus = (admin) => {
    if (admin.account_status) return admin.account_status;
    if (admin.activation_scheduled_at || admin.deactivation_scheduled_at || admin.scheduled_status_action) {
      return 'SCHEDULED';
    }
    if (admin.is_active === false || admin.status === 'suspended' || admin.status === 'inactive') {
      return 'INACTIVE';
    }
    return 'ACTIVE';
  };

  const getShiftPresets = (admin) => {
    const startStr = admin?.working_hours?.shiftStart || '09:30';
    const endStr = admin?.working_hours?.shiftEnd || '20:00';
    const [sH, sM] = (startStr || '09:30').split(':').map(Number);
    const [eH, eM] = (endStr || '20:00').split(':').map(Number);

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');

    // Next Shift Start: today if before start, otherwise tomorrow
    const nextStart = new Date(now);
    nextStart.setHours(sH, sM, 0, 0);
    if (nextStart <= now) {
      nextStart.setDate(nextStart.getDate() + 1);
    }
    const nextStartIso = `${nextStart.getFullYear()}-${pad(nextStart.getMonth() + 1)}-${pad(nextStart.getDate())}T${pad(sH)}:${pad(sM)}`;

    // Shift End: today if before end, otherwise tomorrow
    const nextEnd = new Date(now);
    nextEnd.setHours(eH, eM, 0, 0);
    if (nextEnd <= now) {
      nextEnd.setDate(nextEnd.getDate() + 1);
    }
    const nextEndIso = `${nextEnd.getFullYear()}-${pad(nextEnd.getMonth() + 1)}-${pad(nextEnd.getDate())}T${pad(eH)}:${pad(eM)}`;

    // In 1 hour
    const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
    const inOneHourIso = `${inOneHour.getFullYear()}-${pad(inOneHour.getMonth() + 1)}-${pad(inOneHour.getDate())}T${pad(inOneHour.getHours())}:${pad(inOneHour.getMinutes())}`;

    return {
      nextStartIso,
      nextEndIso,
      inOneHourIso,
      startLabel: `Next Shift Start (${startStr} IST)`,
      endLabel: `Shift End (${endStr} IST)`
    };
  };

  const handleOpenStatusModal = (admin, targetAction, initialMode = 'IMMEDIATE') => {
    const presets = getShiftPresets(admin);
    const defaultScheduled = initialMode === 'SCHEDULED'
      ? (targetAction === 'ACTIVATE' ? presets.nextStartIso : presets.nextEndIso)
      : presets.inOneHourIso;

    setStatusModal({
      isOpen: true,
      admin,
      targetAction,
      mode: initialMode,
      scheduledAt: defaultScheduled,
      reason: '',
      submitting: false,
      error: ''
    });
  };

  const handleConfirmStatusChange = async () => {
    const { admin, targetAction, mode, scheduledAt, reason } = statusModal;
    if (!admin) return;

    const targetId = admin._id || admin.id;
    const currentUserId = currentUser?.id || currentUser?._id;

    if (targetAction === 'DEACTIVATE' && (targetId === currentUserId || admin.email === currentUser?.email)) {
      setStatusModal(prev => ({
        ...prev,
        error: 'Self-deactivation is prohibited. Super Admins cannot deactivate their own account.'
      }));
      return;
    }

    const activeSuperAdmins = (Array.isArray(admins) ? admins : []).filter(a =>
      String(a.role || '').toUpperCase() === 'SUPER_ADMIN' &&
      getAccountLifecycleStatus(a) === 'ACTIVE'
    );
    if (targetAction === 'DEACTIVATE' && String(admin.role || '').toUpperCase() === 'SUPER_ADMIN' && activeSuperAdmins.length <= 1 && (activeSuperAdmins[0]?._id === targetId || activeSuperAdmins[0]?.id === targetId)) {
      setStatusModal(prev => ({
        ...prev,
        error: 'Safety Rule: Cannot deactivate the last remaining active Super Admin.'
      }));
      return;
    }

    if (mode === 'SCHEDULED' && !scheduledAt) {
      setStatusModal(prev => ({
        ...prev,
        error: 'Please select a scheduled date and time.'
      }));
      return;
    }

    setStatusModal(prev => ({ ...prev, submitting: true, error: '' }));
    try {
      if (mode === 'SCHEDULED') {
        const scheduledIso = new Date(scheduledAt).toISOString();
        await accountApi.scheduleAccountStatus(targetId, {
          action: targetAction,
          scheduled_at: scheduledIso,
          reason: reason.trim() || undefined
        });
        setActionToast({
          type: 'success',
          message: `Scheduled ${targetAction.toLowerCase()} for ${admin.fullName || admin.email} on ${formatDateTimeIST(scheduledIso)}.`
        });
      } else {
        if (targetAction === 'ACTIVATE') {
          await accountApi.activateAccount(targetId, { reason: reason.trim() || undefined });
          setActionToast({
            type: 'success',
            message: `Account ${admin.fullName || admin.email} activated successfully.`
          });
        } else {
          await accountApi.deactivateAccount(targetId, { reason: reason.trim() || undefined });
          setActionToast({
            type: 'success',
            message: `Account ${admin.fullName || admin.email} deactivated successfully.`
          });
        }
      }
      setStatusModal({
        isOpen: false,
        admin: null,
        targetAction: 'ACTIVATE',
        mode: 'IMMEDIATE',
        scheduledAt: '',
        reason: '',
        submitting: false,
        error: ''
      });
      fetchAdmins();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Operation failed';
      setStatusModal(prev => ({ ...prev, submitting: false, error: msg }));
    }
  };

  const handleCancelSchedule = async (admin) => {
    const targetId = admin._id || admin.id;
    const name = admin.fullName || admin.email || 'this account';
    if (!window.confirm(`Cancel the scheduled status transition for ${name}?`)) {
      return;
    }
    try {
      await accountApi.cancelScheduledStatus(targetId);
      setActionToast({
        type: 'success',
        message: `Scheduled transition for ${name} has been cancelled.`
      });
      fetchAdmins();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel schedule');
    }
  };

  const handleOpenAuditModal = async (admin) => {
    const targetId = admin._id || admin.id;
    setAuditModal({
      isOpen: true,
      admin,
      loading: true,
      history: [],
      error: ''
    });
    try {
      const res = await accountApi.fetchAccountAuditHistory(targetId);
      if (res?.success) {
        setAuditModal(prev => ({
          ...prev,
          loading: false,
          history: res.data || []
        }));
      } else {
        setAuditModal(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to retrieve audit history'
        }));
      }
    } catch (err) {
      setAuditModal(prev => ({
        ...prev,
        loading: false,
        error: err.response?.data?.message || 'Failed to load audit history'
      }));
    }
  };

  // Filter directory admins based on role criteria
  const directoryAdmins = (Array.isArray(admins) ? admins : []).filter(admin => {
    const r = String(admin.role || '').toUpperCase();
    const desig = String(admin.designation || '').toLowerCase();
    
    const isAdminRoleOrDesig = ['ADMIN', 'SUPER_ADMIN', 'KYC_OPERATOR', 'HR'].includes(r) ||
      ['operational head', 'backend', 'administrative operator', 'administrative sales executive', 'pan checker', 'remark operator', 'qd operator', 'kyc operator', 'final status operator', 'querable operator', 'physical curable', 'digital curable', 'email curable', 'curable operator'].some(d => desig.includes(d));
    
    if (!isAdminRoleOrDesig && r === 'EMPLOYEE') return false;
    return true;
  });

  // Calculate status counts for filter tabs
  const statusCounts = {
    total: directoryAdmins.length,
    active: directoryAdmins.filter(a => getAccountLifecycleStatus(a) === 'ACTIVE').length,
    inactive: directoryAdmins.filter(a => getAccountLifecycleStatus(a) === 'INACTIVE').length,
    scheduled: directoryAdmins.filter(a => getAccountLifecycleStatus(a) === 'SCHEDULED').length
  };

  // Filter admins based on status tab and search query
  const filteredAdmins = directoryAdmins.filter(admin => {
    const statusKey = getAccountLifecycleStatus(admin);
    if (statusFilter !== 'ALL' && statusKey !== statusFilter) {
      return false;
    }

    if (!adminSearch.trim()) return true;
    const q = adminSearch.toLowerCase().trim();
    const name = String(admin.fullName || '').toLowerCase();
    const email = String(admin.email || '').toLowerCase();
    const mobile = String(admin.mobile || '').toLowerCase();
    const empId = String(admin.employeeId || admin.employee_id || '').toLowerCase();
    const desig = String(admin.designation || '').toLowerCase();
    const r = String(admin.role || '').toLowerCase();
    const reason = String(admin.deactivation_reason || admin.scheduled_reason || '').toLowerCase();
    return name.includes(q) || email.includes(q) || mobile.includes(q) || empId.includes(q) || desig.includes(q) || r.includes(q) || statusKey.toLowerCase().includes(q) || reason.includes(q);
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredAdmins.length / itemsPerPage);
  const paginatedAdmins = filteredAdmins.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Main Container */}
      <div style={{ background: C.card, borderRadius: "16px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)", border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <div style={{ padding: "24px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "40px", height: "40px", background: isDark ? "rgba(255, 255, 255, 0.05)" : "#EFF6FF", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: isDark ? C.teal : "#3B82F6" }}>
                <Icons.profile size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: C.text, margin: 0 }}>Administrator Directory</h3>
                <p style={{ fontSize: "13px", color: C.textLight, margin: "2px 0 0 0" }}>View and manage all system administrators</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button 
                onClick={fetchAdmins}
                style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#F9FAFB", border: `1px solid ${C.border}`, color: C.text, borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 600, padding: "8px 16px", transition: "all 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.1)" : "#F3F4F6"}
                onMouseLeave={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "#F9FAFB"}
              >
                <RefreshCw size={14} /> Refresh
              </button>
              <button 
                onClick={() => setShowCreateModal(true)}
                style={{ background: C.teal, border: "none", color: "#FFFFFF", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 600, padding: "8px 16px", transition: "all 0.2s", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}
                onMouseEnter={e => e.currentTarget.style.background = C.tealDim}
                onMouseLeave={e => e.currentTarget.style.background = C.teal}
              >
                + Create Admin
              </button>
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div style={{
            padding: '12px 24px 0 24px',
            background: isDark ? 'rgba(255,255,255,0.02)' : '#F9FAFB',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderBottom: `1px solid ${C.border}`,
            overflowX: 'auto'
          }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.5px', marginRight: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Filter size={13} /> Account Status:
            </span>
            {[
              { id: 'ALL', label: 'All Accounts', count: statusCounts.total, color: '#6D3DF5' },
              { id: 'ACTIVE', label: 'Active', count: statusCounts.active, color: '#059669' },
              { id: 'INACTIVE', label: 'Inactive', count: statusCounts.inactive, color: '#64748B' },
              { id: 'SCHEDULED', label: 'Scheduled', count: statusCounts.scheduled, color: '#8B5CF6' }
            ].map(tab => {
              const isSelected = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => { setStatusFilter(tab.id); setCurrentPage(1); }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px 8px 0 0',
                    fontSize: '13px',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    border: 'none',
                    borderBottom: isSelected ? `2.5px solid ${tab.color}` : '2.5px solid transparent',
                    background: isSelected ? (isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF') : 'transparent',
                    color: isSelected ? (isDark ? '#FFFFFF' : '#111827') : C.textLight,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.15s'
                  }}
                >
                  <span>{tab.label}</span>
                  <span style={{
                    background: isSelected ? `${tab.color}15` : (isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'),
                    color: isSelected ? tab.color : C.textLight,
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '10px'
                  }}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Administrator Directory Search Bar */}
          <div style={{ padding: '14px 24px', background: isDark ? 'rgba(255,255,255,0.02)' : '#F9FAFB', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                value={adminSearch}
                onChange={(e) => { setAdminSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Search administrators by name, email, mobile, admin ID, designation..."
                style={{
                  width: '100%',
                  height: '38px',
                  paddingLeft: '36px',
                  paddingRight: adminSearch ? '36px' : '12px',
                  borderRadius: '8px',
                  border: `1px solid ${C.border}`,
                  background: C.card,
                  color: C.text,
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                <Search size={15} color={C.textLight} />
              </span>
              {adminSearch && (
                <button
                  type="button"
                  onClick={() => { setAdminSearch(''); setCurrentPage(1); }}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.textLight, cursor: 'pointer', fontSize: '14px' }}
                >
                  ✕
                </button>
              )}
            </div>
            {adminSearch && (
              <div style={{ fontSize: '12px', fontWeight: 700, color: C.teal, whiteSpace: 'nowrap' }}>
                Found {filteredAdmins.length} result{filteredAdmins.length !== 1 ? 's' : ''}
              </div>
            )}
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
          ) : filteredAdmins.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px", color: C.textLight }}>
              <p style={{ fontSize: "16px", margin: 0, color: C.text }}>
                {adminSearch ? 'No administrators match your search query.' : 'No administrators provisioned yet.'}
              </p>
              {adminSearch ? (
                <button
                  onClick={() => setAdminSearch('')}
                  style={{ background: C.teal, border: "none", color: "#FFFFFF", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600, padding: "8px 16px", marginTop: "12px" }}
                >
                  Clear Search
                </button>
              ) : (
                <button 
                  onClick={() => setShowCreateModal(true)}
                  style={{ background: C.teal, border: "none", color: "#FFFFFF", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: 600, padding: "10px 20px", marginTop: "16px" }}
                >
                  Create First Admin
                </button>
              )}
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
                    <th style={{ padding: "16px 24px" }}>Account Status</th>
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
                        <span style={{ fontSize: "11px", fontWeight: 800, color: "#2563EB", background: "#DBEAFE", padding: "2px 8px", borderRadius: "4px", textTransform: "uppercase", display: "inline-block", marginBottom: "4px" }}>
                          {String(admin.role || 'ADMIN').replace(/_/g, ' ')}
                        </span>
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
                          <Building2 size={13} /> {admin.assigned_banks?.length ? `${admin.assigned_banks.length} Banks` : 'Assign Banks'}
                        </button>
                        {admin.assigned_banks?.length > 0 && (() => {
                          const bankList = admin.assigned_banks;
                          const adminKey = admin._id || admin.id;
                          const isExpanded = !!expandedAdminBanks[adminKey];

                          const renderBankBadge = (b, i) => {
                            const catLabel = (b.category === 'loc_eoc' || b.is_loc_eoc) ? 'LOC/EOC' : 'CC';
                            const badgeBg = (b.category === 'loc_eoc' || b.is_loc_eoc) ? '#ECFDF5' : '#EFF6FF';
                            const badgeColor = (b.category === 'loc_eoc' || b.is_loc_eoc) ? '#047857' : '#1D4ED8';
                            const borderCol = (b.category === 'loc_eoc' || b.is_loc_eoc) ? '#A7F3D0' : '#BFDBFE';
                            return (
                              <span key={i} style={{ background: badgeBg, color: badgeColor, border: `1px solid ${borderCol}`, borderRadius: "4px", padding: "1px 5px", fontSize: "10px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "3px" }}>
                                {b.short_code || b.name} <span style={{ opacity: 0.75, fontSize: "9px" }}>({catLabel})</span>
                              </span>
                            );
                          };

                          return (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "6px", maxWidth: "240px" }}>
                              {(isExpanded ? bankList : bankList.slice(0, 3)).map((b, idx) => renderBankBadge(b, idx))}
                              {bankList.length > 3 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedAdminBanks(prev => ({ ...prev, [adminKey]: !isExpanded }));
                                  }}
                                  style={{
                                    background: "#F3F4F6",
                                    border: "1px solid #D1D5DB",
                                    color: "#2563EB",
                                    cursor: "pointer",
                                    fontWeight: 700,
                                    fontSize: "10px",
                                    borderRadius: "4px",
                                    padding: "1px 6px"
                                  }}
                                >
                                  {isExpanded ? 'Less' : `+${bankList.length - 3} more`}
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
                        {(() => {
                          const statusKey = getAccountLifecycleStatus(admin);
                          const isSched = statusKey === 'SCHEDULED';
                          const isAct = statusKey === 'ACTIVE';
                          const isPendingAct = admin.scheduled_status_action === 'ACTIVATE' || admin.activation_scheduled_at;
                          const scheduledTime = isPendingAct ? admin.activation_scheduled_at : (admin.deactivation_scheduled_at || admin.scheduled_at);

                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {/* Primary Status Badge */}
                              <div>
                                {isAct && (
                                  <span style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "4px 10px",
                                    borderRadius: "16px",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    color: "#059669",
                                    background: "#ECFDF5",
                                    border: "1px solid #A7F3D0"
                                  }}>
                                    <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10B981" }}></span>
                                    Active
                                  </span>
                                )}

                                {!isAct && !isSched && (
                                  <span style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "4px 10px",
                                    borderRadius: "16px",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    color: "#64748B",
                                    background: "#F1F5F9",
                                    border: "1px solid #CBD5E1"
                                  }}>
                                    <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#94A3B8" }}></span>
                                    Inactive
                                  </span>
                                )}

                                {isSched && (
                                  <span style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "4px 10px",
                                    borderRadius: "16px",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    color: "#6D3DF5",
                                    background: "#F5F3FF",
                                    border: "1px solid #DDD6FE"
                                  }}>
                                    <Clock size={13} color="#6D3DF5" />
                                    <span>Scheduled ({isPendingAct ? 'Activate' : 'Deactivate'})</span>
                                  </span>
                                )}
                              </div>

                              {/* Scheduled details if applicable */}
                              {isSched && scheduledTime && (
                                <div style={{ fontSize: "11px", color: "#6D3DF5", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                                  <Calendar size={11} /> {formatDateTimeIST(scheduledTime)}
                                </div>
                              )}

                              {/* Deactivation Reason if inactive */}
                              {!isAct && !isSched && admin.deactivation_reason && (
                                <div style={{ fontSize: "11px", color: "#64748B", fontStyle: "italic", maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={admin.deactivation_reason}>
                                  Reason: {admin.deactivation_reason}
                                </div>
                              )}

                              {/* Working Hours & Shift tag */}
                              {admin.working_hours && (
                                <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap", marginTop: "2px" }}>
                                  <span style={{
                                    fontSize: "10px",
                                    fontWeight: 600,
                                    color: "#475569",
                                    background: "#F8FAFC",
                                    border: "1px solid #E2E8F0",
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px"
                                  }}>
                                    <Clock size={10} color="#64748B" />
                                    {admin.working_hours.schedule || '09:30 AM - 08:00 PM IST'}
                                  </span>

                                  <span style={{
                                    fontSize: "10px",
                                    fontWeight: 700,
                                    padding: "1px 6px",
                                    borderRadius: "4px",
                                    background: admin.working_hours.isShiftActive ? "#ECFDF5" : "#FEF3C7",
                                    color: admin.working_hours.isShiftActive ? "#047857" : "#B45309",
                                    border: `1px solid ${admin.working_hours.isShiftActive ? '#A7F3D0' : '#FDE68A'}`
                                  }}>
                                    {admin.working_hours.currentStatusTag || (admin.working_hours.isShiftActive ? 'Shift Active' : 'Shift Closed')}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td style={{ padding: "16px 24px", textAlign: "center" }}>
                        {(() => {
                          const statusKey = getAccountLifecycleStatus(admin);
                          const isAct = statusKey === 'ACTIVE';
                          const isSched = statusKey === 'SCHEDULED';
                          const isSelf = (admin._id || admin.id) === (currentUser?.id || currentUser?._id);

                          return (
                            <div style={{ display: "flex", gap: "6px", justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
                              {/* Activate Account Button */}
                              {!isAct && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenStatusModal(admin, 'ACTIVATE', 'IMMEDIATE')}
                                  style={{
                                    background: "#ECFDF5",
                                    color: "#059669",
                                    border: "1px solid #A7F3D0",
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "8px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    transition: "all 0.15s"
                                  }}
                                  title="Activate Account"
                                  onMouseEnter={e => e.currentTarget.style.background = "#D1FAE5"}
                                  onMouseLeave={e => e.currentTarget.style.background = "#ECFDF5"}
                                >
                                  <UserCheck size={15} color="#059669" />
                                </button>
                              )}

                              {/* Deactivate Account Button */}
                              {isAct && (
                                <button
                                  type="button"
                                  disabled={isSelf}
                                  onClick={() => handleOpenStatusModal(admin, 'DEACTIVATE', 'IMMEDIATE')}
                                  style={{
                                    background: isSelf ? "#F3F4F6" : "#FEF2F2",
                                    color: isSelf ? "#9CA3AF" : "#DC2626",
                                    border: `1px solid ${isSelf ? '#E5E7EB' : '#FEE2E2'}`,
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "8px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: isSelf ? "not-allowed" : "pointer",
                                    opacity: isSelf ? 0.6 : 1,
                                    transition: "all 0.15s"
                                  }}
                                  title={isSelf ? "Self-deactivation is prohibited" : "Deactivate Account"}
                                  onMouseEnter={e => { if (!isSelf) e.currentTarget.style.background = "#FEE2E2"; }}
                                  onMouseLeave={e => { if (!isSelf) e.currentTarget.style.background = "#FEF2F2"; }}
                                >
                                  <UserX size={15} color={isSelf ? "#9CA3AF" : "#DC2626"} />
                                </button>
                              )}

                              {/* Schedule Activation / Deactivation Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenStatusModal(admin, isAct ? 'DEACTIVATE' : 'ACTIVATE', 'SCHEDULED')}
                                style={{
                                  background: "#F5F3FF",
                                  color: "#6D3DF5",
                                  border: "1px solid #DDD6FE",
                                  width: "32px",
                                  height: "32px",
                                  borderRadius: "8px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                  transition: "all 0.15s"
                                }}
                                title="Schedule Activation/Deactivation"
                                onMouseEnter={e => e.currentTarget.style.background = "#EDE9FE"}
                                onMouseLeave={e => e.currentTarget.style.background = "#F5F3FF"}
                              >
                                <Clock size={15} color="#6D3DF5" />
                              </button>

                              {/* Cancel Scheduled Action Button if scheduled */}
                              {isSched && (
                                <button
                                  type="button"
                                  onClick={() => handleCancelSchedule(admin)}
                                  style={{
                                    background: "#FFFBEB",
                                    color: "#D97706",
                                    border: "1px solid #FDE68A",
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "8px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    transition: "all 0.15s"
                                  }}
                                  title="Cancel Scheduled Transition"
                                  onMouseEnter={e => e.currentTarget.style.background = "#FEF3C7"}
                                  onMouseLeave={e => e.currentTarget.style.background = "#FFFBEB"}
                                >
                                  <CalendarX size={15} color="#D97706" />
                                </button>
                              )}

                              {/* Status Change Audit History */}
                              <button
                                type="button"
                                onClick={() => handleOpenAuditModal(admin)}
                                style={{
                                  background: "#F8FAFC",
                                  color: "#475569",
                                  border: "1px solid #E2E8F0",
                                  width: "32px",
                                  height: "32px",
                                  borderRadius: "8px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                  transition: "all 0.15s"
                                }}
                                title="View Status Audit History"
                                onMouseEnter={e => e.currentTarget.style.background = "#F1F5F9"}
                                onMouseLeave={e => e.currentTarget.style.background = "#F8FAFC"}
                              >
                                <History size={15} color="#475569" />
                              </button>

                              {/* Edit Admin */}
                              <button
                                type="button"
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
                                  transition: "all 0.15s"
                                }}
                                title="Edit Admin"
                                onMouseEnter={e => e.currentTarget.style.background = "#EFF6FF"}
                                onMouseLeave={e => e.currentTarget.style.background = "#FFFFFF"}
                              >
                                <Edit size={14} color="#2563EB" />
                              </button>

                              {/* Delete Admin */}
                              <button
                                type="button"
                                onClick={() => handleDeleteAdmin(admin._id || admin.id)}
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
                                  transition: "all 0.15s"
                                }}
                                title="Delete Admin"
                                onMouseEnter={e => e.currentTarget.style.background = "#FEF2F2"}
                                onMouseLeave={e => e.currentTarget.style.background = "#FFFFFF"}
                              >
                                <Trash2 size={14} color="#DC2626" />
                              </button>
                            </div>
                          );
                        })()}
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
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAdmins.length)} of {filteredAdmins.length} entries
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
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="EMPLOYEE">Employee</option>
                  <option value="PARTNER">Partner</option>
                  <option value="HR">HR</option>
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
                    if (['Operational Head', 'Backend', 'Administrative Operator', 'Administrative Sales Executive', 'PAN Checker', 'Remark Operator', 'REMARK_OPERATOR', 'QD Operator', 'QD OPERATOR', 'QD_OPERATOR', 'KYC Operator', 'KYC OPERATOR', 'KYC_OPERATOR', 'Final Status Operator', 'FINAL STATUS OPERATOR', 'FINAL_STATUS_OPERATOR', 'Querable Operator', 'QUERABLE OPERATOR', 'QUERABLE_OPERATOR', 'Queryable Operator', 'QUERYABLE OPERATOR', 'QUERYABLE_OPERATOR', 'Physical Curable Operator', 'PHYSICAL CURABLE OPERATOR', 'PHYSICAL_CURABLE_OPERATOR', 'Digital Curable Operator', 'DIGITAL CURABLE OPERATOR', 'DIGITAL_CURABLE_OPERATOR', 'Email Curable Operator', 'EMAIL CURABLE OPERATOR', 'EMAIL_CURABLE_OPERATOR', 'Physical Curable', 'Digital Curable', 'Email Curable'].includes(e.target.value) && allBanks.length === 0) {
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
                  <option value="Administrative Sales Executive">Administrative Sales Executive</option>
                  <option value="PAN Checker">PAN Checker</option>
                  <option value="Remark Operator">Remark Operator</option>
                  <option value="QD Operator">QD Operator</option>
                  <option value="KYC Operator">KYC Operator</option>
                  <option value="Final Status Operator">Final Status Operator</option>
                  <option value="Querable Operator">Querable Operator</option>
                  <option value="Physical Curable Operator">Physical Curable Operator</option>
                  <option value="Digital Curable Operator">Digital Curable Operator</option>
                  <option value="Email Curable Operator">Email Curable Operator</option>
                  <option value="Backend">Backend</option>
                  <option value="Super Admin">Super Admin</option>
                  <option value="Senior Manager">Senior Manager</option>
                  <option value="Manager">Manager</option>
                  <option value="Team Leader">Team Leader</option>
                  <option value="Telecaller">Telecaller</option>
                </select>
              </div>

              {/* Category-Wise Bank Assignment Section */}
              {(['Operational Head', 'OPERATIONAL_HEAD', 'Backend', 'BACKEND', 'Administrative Operator', 'ADMINISTRATIVE OPERATOR', 'ADMINISTRATIVE_OPERATOR', 'Administrative Sales Executive', 'ADMINISTRATIVE SALES EXECUTIVE', 'ADMINISTRATIVE_SALES_EXECUTIVE', 'PAN Checker', 'PAN CHECKER', 'PAN_CHECKER', 'Remark Operator', 'REMARK OPERATOR', 'REMARK_OPERATOR', 'QD Operator', 'QD OPERATOR', 'QD_OPERATOR', 'KYC Operator', 'KYC OPERATOR', 'KYC_OPERATOR', 'Final Status Operator', 'FINAL STATUS OPERATOR', 'FINAL_STATUS_OPERATOR', 'Querable Operator', 'QUERABLE OPERATOR', 'QUERABLE_OPERATOR', 'Queryable Operator', 'QUERYABLE OPERATOR', 'QUERYABLE_OPERATOR', 'Physical Curable Operator', 'PHYSICAL CURABLE OPERATOR', 'PHYSICAL_CURABLE_OPERATOR', 'Digital Curable Operator', 'DIGITAL CURABLE OPERATOR', 'DIGITAL_CURABLE_OPERATOR', 'Email Curable Operator', 'EMAIL CURABLE OPERATOR', 'EMAIL_CURABLE_OPERATOR', 'Physical Curable', 'Digital Curable', 'Email Curable'].includes(form.designation)) && (
                <div style={{ gridColumn: "span 2" }}>
                  <CategoryWiseBankSelector
                    allBanks={allBanks}
                    categoryAssignments={createCategoryAssignments}
                    onChange={setCreateCategoryAssignments}
                  />
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
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#EFF6FF", color: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Edit size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#111827", margin: 0 }}>Edit Administrator Details</h3>
                  <p style={{ fontSize: "13px", color: "#6B7280", margin: "2px 0 0 0" }}>Update admin role, designation, status and bank assignments</p>
                </div>
              </div>
              <button onClick={() => setShowEditModal(false)} style={{ background: "#F3F4F6", border: "none", color: "#4B5563", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={18} />
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

                {/* Role */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Role *</label>
                  <select
                    value={editForm.role}
                    onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box", background: "#FFFFFF" }}
                    required
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="EMPLOYEE">Employee</option>
                    <option value="PARTNER">Partner</option>
                    <option value="HR">HR</option>
                  </select>
                </div>

                {/* Designation */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Designation *</label>
                  <select
                    value={editForm.designation}
                    onChange={e => {
                      const val = e.target.value;
                      setEditForm({ ...editForm, designation: val });
                      if (['Operational Head', 'OPERATIONAL_HEAD', 'Backend', 'BACKEND', 'Administrative Operator', 'ADMINISTRATIVE OPERATOR', 'ADMINISTRATIVE_OPERATOR', 'Administrative Sales Executive', 'ADMINISTRATIVE SALES EXECUTIVE', 'ADMINISTRATIVE_SALES_EXECUTIVE', 'PAN Checker', 'PAN CHECKER', 'PAN_CHECKER', 'Remark Operator', 'REMARK OPERATOR', 'REMARK_OPERATOR', 'QD Operator', 'QD OPERATOR', 'QD_OPERATOR', 'KYC Operator', 'KYC OPERATOR', 'KYC_OPERATOR', 'Final Status Operator', 'FINAL STATUS OPERATOR', 'FINAL_STATUS_OPERATOR', 'Querable Operator', 'QUERABLE OPERATOR', 'QUERABLE_OPERATOR', 'Queryable Operator', 'QUERYABLE OPERATOR', 'QUERYABLE_OPERATOR', 'Physical Curable Operator', 'PHYSICAL CURABLE OPERATOR', 'PHYSICAL_CURABLE_OPERATOR', 'Digital Curable Operator', 'DIGITAL CURABLE OPERATOR', 'DIGITAL_CURABLE_OPERATOR', 'Email Curable Operator', 'EMAIL CURABLE OPERATOR', 'EMAIL_CURABLE_OPERATOR', 'Physical Curable', 'Digital Curable', 'Email Curable'].includes(val) && allBanks.length === 0) {
                        api.get('/banks').then(res => {
                          if (res.data && res.data.data) setAllBanks(res.data.data);
                        }).catch(err => console.error(err));
                      }
                    }}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                    required
                  >
                    <option value="">Select Designation...</option>
                    <option value="Operational Head">Operational Head</option>
                    <option value="Administrative Operator">Administrative Operator</option>
                    <option value="Administrative Sales Executive">Administrative Sales Executive</option>
                    <option value="PAN Checker">PAN Checker</option>
                    <option value="Remark Operator">Remark Operator</option>
                    <option value="QD Operator">QD Operator</option>
                    <option value="KYC Operator">KYC Operator</option>
                    <option value="Final Status Operator">Final Status Operator</option>
                    <option value="Querable Operator">Querable Operator</option>
                    <option value="Physical Curable Operator">Physical Curable Operator</option>
                    <option value="Digital Curable Operator">Digital Curable Operator</option>
                    <option value="Email Curable Operator">Email Curable Operator</option>
                    <option value="Backend">Backend</option>
                    <option value="Super Admin">Super Admin</option>
                    <option value="Senior Manager">Senior Manager</option>
                    <option value="Manager">Manager</option>
                    <option value="Team Leader">Team Leader</option>
                    <option value="Telecaller">Telecaller</option>
                    {editForm.designation && !['Operational Head', 'Administrative Operator', 'Administrative Sales Executive', 'PAN Checker', 'Remark Operator', 'QD Operator', 'KYC Operator', 'Final Status Operator', 'Querable Operator', 'Queryable Operator', 'Physical Curable Operator', 'Digital Curable Operator', 'Email Curable Operator', 'Physical Curable', 'Digital Curable', 'Email Curable', 'Backend', 'Super Admin', 'Senior Manager', 'Manager', 'Team Leader', 'Telecaller', ''].includes(editForm.designation) && (
                      <option value={editForm.designation}>{editForm.designation}</option>
                    )}
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
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>New Password (Optional)</label>
                  <input
                    type="password"
                    placeholder="Leave blank to keep unchanged"
                    value={editForm.password}
                    onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                  />
                </div>

                {/* Bank Assignments (Category-Wise Access Control) */}
                {(['Operational Head', 'OPERATIONAL_HEAD', 'Backend', 'BACKEND', 'Administrative Operator', 'ADMINISTRATIVE OPERATOR', 'ADMINISTRATIVE_OPERATOR', 'Administrative Sales Executive', 'ADMINISTRATIVE SALES EXECUTIVE', 'ADMINISTRATIVE_SALES_EXECUTIVE', 'PAN Checker', 'PAN CHECKER', 'PAN_CHECKER', 'Remark Operator', 'REMARK OPERATOR', 'REMARK_OPERATOR', 'QD Operator', 'QD OPERATOR', 'QD_OPERATOR', 'KYC Operator', 'KYC OPERATOR', 'KYC_OPERATOR', 'Final Status Operator', 'FINAL STATUS OPERATOR', 'FINAL_STATUS_OPERATOR', 'Querable Operator', 'QUERABLE OPERATOR', 'QUERABLE_OPERATOR', 'Queryable Operator', 'QUERYABLE OPERATOR', 'QUERYABLE_OPERATOR', 'Physical Curable Operator', 'PHYSICAL CURABLE OPERATOR', 'PHYSICAL_CURABLE_OPERATOR', 'Digital Curable Operator', 'DIGITAL CURABLE OPERATOR', 'DIGITAL_CURABLE_OPERATOR', 'Email Curable Operator', 'EMAIL CURABLE OPERATOR', 'EMAIL_CURABLE_OPERATOR', 'Physical Curable', 'Digital Curable', 'Email Curable'].includes(editForm.designation)) && (
                  <div style={{ gridColumn: "span 2" }}>
                    <CategoryWiseBankSelector
                      allBanks={allBanks}
                      categoryAssignments={editCategoryAssignments}
                      onChange={setEditCategoryAssignments}
                    />
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
          <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: "24px", maxWidth: "600px", width: "100%", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}>
            <div style={{ borderBottom: `1px solid #F3F4F6`, paddingBottom: "14px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#111827", margin: 0 }}>Assign Category & Bank Access</h3>
                <p style={{ fontSize: "13px", color: "#6B7280", margin: "2px 0 0 0" }}>
                  Operator: <strong style={{ color: "#2563EB" }}>{selectedOpHead.fullName || selectedOpHead.full_name}</strong> ({selectedOpHead.department || selectedOpHead.designation || 'Admin'})
                </p>
              </div>
              <button onClick={() => setBankModalOpen(false)} style={{ background: "#F3F4F6", border: "none", color: "#4B5563", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={18} />
              </button>
            </div>

            <CategoryWiseBankSelector
              allBanks={allBanks}
              categoryAssignments={opHeadCategoryAssignments}
              onChange={setOpHeadCategoryAssignments}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px", paddingTop: "14px", borderTop: "1px solid #F3F4F6" }}>
              <button
                type="button"
                onClick={() => setBankModalOpen(false)}
                style={{ background: "#FFFFFF", border: "1px solid #D1D5DB", color: "#374151", padding: "10px 18px", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!selectedOpHead) return;
                  try {
                    await api.put(`/superadmin/admins/${selectedOpHead._id || selectedOpHead.id}/banks`, {
                      category_assignments: opHeadCategoryAssignments,
                      bank_ids: opHeadCategoryAssignments.map(a => a.bank_id)
                    });
                    setBankModalOpen(false);
                    fetchAdmins();
                  } catch (err) {
                    alert(err.response?.data?.message || 'Failed to update bank assignments');
                  }
                }}
                style={{ background: "#2563EB", border: "none", color: "#FFFFFF", padding: "10px 24px", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
              >
                Save Category Access
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Banner */}
      {actionToast && (
        <div style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 10000,
          background: actionToast.type === 'success' ? '#065F46' : '#991B1B',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '14px',
          fontWeight: 600
        }}>
          {actionToast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{actionToast.message}</span>
          <button
            onClick={() => setActionToast(null)}
            style={{ background: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer', padding: 0, marginLeft: '8px' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Account Activation / Deactivation Confirmation & Scheduling Modal */}
      {statusModal.isOpen && statusModal.admin && (() => {
        const admin = statusModal.admin;
        const targetId = admin._id || admin.id;
        const currentUserId = currentUser?.id || currentUser?._id;
        const isSelf = targetId === currentUserId || admin.email === currentUser?.email;
        const activeSuperAdmins = directoryAdmins.filter(a =>
          String(a.role || '').toUpperCase() === 'SUPER_ADMIN' &&
          getAccountLifecycleStatus(a) === 'ACTIVE'
        );
        const isLastSuperAdmin = statusModal.targetAction === 'DEACTIVATE' &&
          String(admin.role || '').toUpperCase() === 'SUPER_ADMIN' &&
          activeSuperAdmins.length <= 1 &&
          (activeSuperAdmins[0]?._id === targetId || activeSuperAdmins[0]?.id === targetId);
        const isActionBlocked = (statusModal.targetAction === 'DEACTIVATE' && isSelf) || isLastSuperAdmin;
        const presets = getShiftPresets(admin);
        const currentStatus = getAccountLifecycleStatus(admin);
        const isAct = statusModal.targetAction === 'ACTIVATE';

        return (
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(15, 23, 42, 0.7)", zIndex: 9999,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "20px", backdropFilter: "blur(4px)"
          }}>
            <div style={{
              background: "#FFFFFF",
              borderRadius: "16px",
              padding: "24px",
              maxWidth: "580px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
            }}>
              {/* Modal Header */}
              <div style={{ borderBottom: "1px solid #F1F5F9", paddingBottom: "16px", marginBottom: "18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "10px",
                    background: isAct ? "#ECFDF5" : "#FEF2F2",
                    color: isAct ? "#059669" : "#DC2626",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    {isAct ? <UserCheck size={20} /> : <UserX size={20} />}
                  </div>
                  <div>
                    <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0F172A", margin: 0 }}>
                      {statusModal.mode === 'SCHEDULED' ? `Schedule ${isAct ? 'Activation' : 'Deactivation'}` : `${isAct ? 'Activate' : 'Deactivate'} Account`}
                    </h3>
                    <p style={{ fontSize: "13px", color: "#64748B", margin: "2px 0 0 0" }}>
                      Confirm account status transition & working hours alignment
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setStatusModal(prev => ({ ...prev, isOpen: false, admin: null }))}
                  style={{ background: "#F1F5F9", border: "none", color: "#64748B", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Safety Rule Warning Banner */}
              {isSelf && statusModal.targetAction === 'DEACTIVATE' && (
                <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "10px", padding: "12px 14px", marginBottom: "16px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <ShieldAlert size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#991B1B" }}>Self-Deactivation Prohibited</div>
                    <div style={{ fontSize: "12px", color: "#B91C1C", marginTop: "2px" }}>
                      Security policy prevents Super Admins from deactivating their own account to prevent lockouts.
                    </div>
                  </div>
                </div>
              )}

              {isLastSuperAdmin && (
                <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "10px", padding: "12px 14px", marginBottom: "16px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <AlertTriangle size={18} color="#D97706" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#92400E" }}>Last Active Super Admin Protected</div>
                    <div style={{ fontSize: "12px", color: "#B45309", marginTop: "2px" }}>
                      This user is the only active Super Admin. System requires at least one active Super Admin to retain system governance.
                    </div>
                  </div>
                </div>
              )}

              {/* Account Details Card */}
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "14px 16px", marginBottom: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Account Name</span>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A", marginTop: "2px" }}>
                      {admin.fullName || admin.email}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Role & Designation</span>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#334155", marginTop: "2px" }}>
                      {admin.role} • {admin.designation || 'Admin'}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Account ID</span>
                    <div style={{ fontFamily: "monospace", fontSize: "12px", color: "#475569", marginTop: "2px" }}>
                      {targetId}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Current Status</span>
                    <div style={{ marginTop: "2px" }}>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "12px",
                        background: currentStatus === 'ACTIVE' ? '#ECFDF5' : (currentStatus === 'SCHEDULED' ? '#F5F3FF' : '#F1F5F9'),
                        color: currentStatus === 'ACTIVE' ? '#059669' : (currentStatus === 'SCHEDULED' ? '#6D3DF5' : '#64748B'),
                        border: `1px solid ${currentStatus === 'ACTIVE' ? '#A7F3D0' : (currentStatus === 'SCHEDULED' ? '#DDD6FE' : '#CBD5E1')}`
                      }}>
                        {currentStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Working Hours & Timezone Context */}
              <div style={{ background: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: "12px", padding: "14px 16px", marginBottom: "18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <Clock size={15} color="#4F46E5" />
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#312E81" }}>Working Hours & Shift Policy</span>
                </div>
                <div style={{ fontSize: "12px", color: "#3730A3", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
                  <div>
                    <span style={{ opacity: 0.8 }}>Shift Schedule:</span> <strong>{admin.working_hours?.schedule || '09:30 AM - 08:00 PM IST (Mon-Sat)'}</strong>
                  </div>
                  <div>
                    <span style={{ opacity: 0.8 }}>Timezone:</span> <strong>{admin.working_hours?.timezone || 'Asia/Kolkata'}</strong>
                  </div>
                  <div>
                    <span style={{ opacity: 0.8 }}>Shift Status:</span> <strong>{admin.working_hours?.currentStatusTag || 'Unrestricted'}</strong>
                  </div>
                  <div>
                    <span style={{ opacity: 0.8 }}>Access Enforcement:</span> <strong>{admin.role === 'SUPER_ADMIN' ? '24/7 Super Admin' : 'Working-Hours Bound'}</strong>
                  </div>
                </div>
                <div style={{ fontSize: "11px", color: "#4338CA", marginTop: "8px", borderTop: "1px dashed #C7D2FE", paddingTop: "6px" }}>
                  <Info size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
                  Account status determines enabled/disabled lifecycle. Deactivating terminates active sessions and blocks future logins.
                </div>
              </div>

              {/* Mode Selection Tabs (Immediate vs Scheduled) */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "6px" }}>
                  Execution Timing *
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setStatusModal(prev => ({ ...prev, mode: 'IMMEDIATE', error: '' }))}
                    style={{
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1.5px solid",
                      borderColor: statusModal.mode === 'IMMEDIATE' ? '#6D3DF5' : '#E2E8F0',
                      background: statusModal.mode === 'IMMEDIATE' ? '#F5F3FF' : '#FFFFFF',
                      color: statusModal.mode === 'IMMEDIATE' ? '#6D3DF5' : '#475569',
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px"
                    }}
                  >
                    <CheckCircle2 size={15} /> Immediate Execution
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusModal(prev => ({ ...prev, mode: 'SCHEDULED', error: '' }))}
                    style={{
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1.5px solid",
                      borderColor: statusModal.mode === 'SCHEDULED' ? '#6D3DF5' : '#E2E8F0',
                      background: statusModal.mode === 'SCHEDULED' ? '#F5F3FF' : '#FFFFFF',
                      color: statusModal.mode === 'SCHEDULED' ? '#6D3DF5' : '#475569',
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px"
                    }}
                  >
                    <Clock size={15} /> Schedule for Later
                  </button>
                </div>
              </div>

              {/* Scheduled Time Pickers and Shift Boundary Presets */}
              {statusModal.mode === 'SCHEDULED' && (
                <div style={{ background: "#FAFAFA", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "14px", marginBottom: "16px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "6px" }}>
                    Scheduled Time (Asia/Kolkata IST) *
                  </label>
                  <input
                    type="datetime-local"
                    value={statusModal.scheduledAt}
                    onChange={(e) => setStatusModal(prev => ({ ...prev, scheduledAt: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #CBD5E1",
                      fontSize: "13px",
                      outline: "none",
                      boxSizing: "border-box",
                      marginBottom: "10px"
                    }}
                  />

                  {/* Shift Boundary Presets */}
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748B" }}>Presets:</span>
                    <button
                      type="button"
                      onClick={() => setStatusModal(prev => ({ ...prev, scheduledAt: presets.nextStartIso }))}
                      style={{ padding: "4px 8px", fontSize: "11px", fontWeight: 600, background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "6px", cursor: "pointer", color: "#334155" }}
                    >
                      {presets.startLabel}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusModal(prev => ({ ...prev, scheduledAt: presets.nextEndIso }))}
                      style={{ padding: "4px 8px", fontSize: "11px", fontWeight: 600, background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "6px", cursor: "pointer", color: "#334155" }}
                    >
                      {presets.endLabel}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusModal(prev => ({ ...prev, scheduledAt: presets.inOneHourIso }))}
                      style={{ padding: "4px 8px", fontSize: "11px", fontWeight: 600, background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "6px", cursor: "pointer", color: "#334155" }}
                    >
                      In 1 Hour
                    </button>
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748B", marginTop: "8px" }}>
                    Scheduler background daemon evaluates pending tasks every 60 seconds.
                  </div>
                </div>
              )}

              {/* Reason Field */}
              <div style={{ marginBottom: "18px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "6px" }}>
                  Reason / Notes ({isAct ? 'Optional' : 'Recommended'})
                </label>
                <textarea
                  rows={2}
                  value={statusModal.reason}
                  onChange={(e) => setStatusModal(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder={isAct ? "Reason for account reactivation (e.g. Return from leave, policy review passed)..." : "Reason for deactivation (e.g. Offboarding, shift completion, security precaution)..."}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
                    resize: "vertical"
                  }}
                />
              </div>

              {/* Error Alert */}
              {statusModal.error && (
                <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "12px", color: "#B91C1C", display: "flex", alignItems: "center", gap: "6px" }}>
                  <AlertTriangle size={15} />
                  <span>{statusModal.error}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid #F1F5F9", paddingTop: "16px" }}>
                <button
                  type="button"
                  onClick={() => setStatusModal(prev => ({ ...prev, isOpen: false, admin: null }))}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #CBD5E1",
                    color: "#334155",
                    padding: "9px 18px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isActionBlocked || statusModal.submitting}
                  onClick={handleConfirmStatusChange}
                  style={{
                    background: isActionBlocked ? "#94A3B8" : (isAct ? "#059669" : "#DC2626"),
                    border: "none",
                    color: "#FFFFFF",
                    padding: "9px 22px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: (isActionBlocked || statusModal.submitting) ? "not-allowed" : "pointer",
                    opacity: (isActionBlocked || statusModal.submitting) ? 0.7 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  {statusModal.submitting ? (
                    <>
                      <div className="animate-spin" style={{ width: "14px", height: "14px", border: "2px solid #FFFFFF", borderTopColor: "transparent", borderRadius: "50%" }}></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      {isAct ? <UserCheck size={16} /> : <UserX size={16} />}
                      {statusModal.mode === 'SCHEDULED' ? `Schedule ${isAct ? 'Activation' : 'Deactivation'}` : `Confirm ${isAct ? 'Activation' : 'Deactivation'}`}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Account Status Change Audit History Modal */}
      {auditModal.isOpen && auditModal.admin && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.7)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "20px", backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: "#FFFFFF",
            borderRadius: "16px",
            padding: "24px",
            maxWidth: "680px",
            width: "100%",
            maxHeight: "85vh",
            overflowY: "auto",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
          }}>
            {/* Header */}
            <div style={{ borderBottom: "1px solid #F1F5F9", paddingBottom: "14px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#F5F3FF", color: "#6D3DF5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <History size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#0F172A", margin: 0 }}>Status Change Audit History</h3>
                  <p style={{ fontSize: "12px", color: "#64748B", margin: "2px 0 0 0" }}>
                    Account: <strong style={{ color: "#334155" }}>{auditModal.admin.fullName || auditModal.admin.email}</strong> • Role: {auditModal.admin.role}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAuditModal(prev => ({ ...prev, isOpen: false, admin: null }))}
                style={{ background: "#F1F5F9", border: "none", color: "#64748B", cursor: "pointer", width: "30px", height: "30px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            {auditModal.loading ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#64748B" }}>
                <div className="animate-spin" style={{ width: "28px", height: "28px", border: "3px solid #6D3DF5", borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto 12px" }}></div>
                Loading audit trail...
              </div>
            ) : auditModal.error ? (
              <div style={{ padding: "16px", textAlign: "center", color: "#DC2626", background: "#FEF2F2", borderRadius: "10px", border: "1px solid #FCA5A5" }}>
                <p style={{ fontWeight: 600, margin: 0 }}>{auditModal.error}</p>
              </div>
            ) : auditModal.history.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#64748B" }}>
                <p style={{ fontSize: "14px", color: "#334155", margin: 0 }}>No status changes recorded for this account yet.</p>
                <span style={{ fontSize: "12px", color: "#94A3B8" }}>All activation and deactivation events are logged in immutable append-only audit trail.</span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {auditModal.history.map((item, idx) => {
                  const act = String(item.action || '').toUpperCase();
                  const isAct = act === 'ACTIVATE';
                  const isDeact = act === 'DEACTIVATE';

                  return (
                    <div key={item.id || idx} style={{
                      border: "1px solid #E2E8F0",
                      borderRadius: "10px",
                      padding: "12px 16px",
                      background: "#FAFAFA",
                      transition: "background 0.15s"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "12px",
                            background: isAct ? '#ECFDF5' : (isDeact ? '#FEF2F2' : '#F5F3FF'),
                            color: isAct ? '#059669' : (isDeact ? '#DC2626' : '#6D3DF5'),
                            border: `1px solid ${isAct ? '#A7F3D0' : (isDeact ? '#FCA5A5' : '#DDD6FE')}`
                          }}>
                            {item.action || 'STATUS_UPDATE'}
                          </span>
                          <span style={{ fontSize: "12px", fontWeight: 600, color: "#334155" }}>
                            {item.previous_status || 'UNKNOWN'} <ArrowRight size={12} style={{ display: "inline", verticalAlign: "middle" }} /> {item.new_status || 'UNKNOWN'}
                          </span>
                        </div>
                        <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 500 }}>
                          {formatDateTimeIST(item.timestamp || item.created_at)}
                        </span>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", fontSize: "12px", color: "#475569" }}>
                        <div>
                          <span>Administrator: </span>
                          <strong style={{ color: "#0F172A" }}>{item.admin_name || item.changed_by_name || item.changed_by || 'Super Admin'}</strong>
                          {item.is_scheduled && (
                            <span style={{ marginLeft: "8px", fontSize: "10px", background: "#F5F3FF", color: "#6D3DF5", padding: "1px 6px", borderRadius: "4px", border: "1px solid #DDD6FE" }}>
                              Scheduled Execution
                            </span>
                          )}
                        </div>
                      </div>

                      {item.reason && (
                        <div style={{ marginTop: "6px", fontSize: "12px", color: "#64748B", background: "#FFFFFF", padding: "6px 10px", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
                          <span style={{ fontWeight: 600, color: "#475569" }}>Reason:</span> {item.reason}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Footer */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px", borderTop: "1px solid #F1F5F9", paddingTop: "14px" }}>
              <button
                type="button"
                onClick={() => setAuditModal(prev => ({ ...prev, isOpen: false, admin: null }))}
                style={{
                  background: "#2563EB",
                  border: "none",
                  color: "#FFFFFF",
                  padding: "8px 20px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Close Audit History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
