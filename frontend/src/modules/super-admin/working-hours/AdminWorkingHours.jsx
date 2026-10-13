import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  ShieldAlert,
  UserCheck,
  PlusCircle,
  Edit2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  Filter,
  History,
  Building,
  Users,
  Zap,
  Power,
  Trash2,
  Check,
  Tag,
  Briefcase,
  UserPlus,
  MoreVertical,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Settings
} from 'lucide-react';
import {
  fetchWorkingHoursConfig,
  updateWorkingHours,
  extendWorkingHours,
  fetchExtensionHistory,
  savePolicy,
  deletePolicy,
  saveHoliday,
  deleteHoliday,
  revokeExtension
} from '../../../services/workingHours.api';
import {
  activateAccount,
  deactivateAccount,
  scheduleAccountStatus,
  bulkUpdateAccountStatus
} from '../../../services/accountStatus.api';

const DAYS_OF_WEEK = [
  { key: 'monday', short: 'Mon', label: 'Monday' },
  { key: 'tuesday', short: 'Tue', label: 'Tuesday' },
  { key: 'wednesday', short: 'Wed', label: 'Wednesday' },
  { key: 'thursday', short: 'Thu', label: 'Thursday' },
  { key: 'friday', short: 'Fri', label: 'Friday' },
  { key: 'saturday', short: 'Sat', label: 'Saturday' },
  { key: 'sunday', short: 'Sun', label: 'Sunday' }
];

const DEFAULT_SCHEDULE = {
  monday:    { is_working: true,  start_time: '09:00 AM', end_time: '06:00 PM' },
  tuesday:   { is_working: true,  start_time: '09:00 AM', end_time: '06:00 PM' },
  wednesday: { is_working: true,  start_time: '09:00 AM', end_time: '06:00 PM' },
  thursday:  { is_working: true,  start_time: '09:00 AM', end_time: '06:00 PM' },
  friday:    { is_working: true,  start_time: '09:00 AM', end_time: '06:00 PM' },
  saturday:  { is_working: false, start_time: '09:00 AM', end_time: '06:00 PM' },
  sunday:    { is_working: false, start_time: '09:00 AM', end_time: '06:00 PM' }
};

const TIME_OPTIONS = [
  '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM',
  '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM', '09:00 PM', '10:00 PM'
];

function getInitials(name = '') {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function getRoleBadgeStyle(role = '') {
  const r = String(role).toUpperCase();
  switch (r) {
    case 'ADMIN':
    case 'SUPER_ADMIN':
      return { bg: '#FEE2E2', text: '#DC2626', label: r === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin' };
    case 'EMPLOYEE':
      return { bg: '#E0F2FE', text: '#0284C7', label: 'Employee' };
    case 'PARTNER':
      return { bg: '#DCFCE7', text: '#16A34A', label: 'Partner' };
    case 'VIEWER':
      return { bg: '#F3E8FF', text: '#9333EA', label: 'Viewer' };
    case 'MODERATOR':
      return { bg: '#FFEDD5', text: '#EA580C', label: 'Moderator' };
    case 'HR':
      return { bg: '#CCFBF1', text: '#0D9488', label: 'HR' };
    default:
      return { bg: '#F1F5F9', text: '#475569', label: role || 'User' };
  }
}

export default function AdminWorkingHours() {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [defaultConfig, setDefaultConfig] = useState({ start_time: '09:00 AM', end_time: '06:00 PM', is_enabled: true });
  const [extensionsToday, setExtensionsToday] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [distinctDesignations, setDistinctDesignations] = useState([]);
  const [distinctRoles, setDistinctRoles] = useState(['ADMIN', 'EMPLOYEE', 'PARTNER', 'VIEWER', 'MODERATOR', 'HR']);
  const [historyList, setHistoryList] = useState([]);

  // Active view tab: 'records' (primary view from user screenshot) | 'policies' | 'holidays' | 'history'
  const [activeTab, setActiveTab] = useState('records');

  // Filters & Search Bar (Screenshot matching)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedDaysFilter, setSelectedDaysFilter] = useState('ALL');

  // Selection
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  // Sorting
  const [sortField, setSortField] = useState('userId');
  const [sortAsc, setSortAsc] = useState(true);

  // Pagination
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [showGlobalDaysModal, setShowGlobalDaysModal] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showStatusConfirmModal, setShowStatusConfirmModal] = useState(false);
  const [showManageUsersModal, setShowManageUsersModal] = useState(false);
  const [manageUsersSearch, setManageUsersSearch] = useState('');
  const [manageUsersRoleFilter, setManageUsersRoleFilter] = useState('ALL');
  const [manageUsersStatusFilter, setManageUsersStatusFilter] = useState('ALL');
  const [manageUsersSelectedIds, setManageUsersSelectedIds] = useState([]);
  const [manageUsersBulkScope, setManageUsersBulkScope] = useState('ALL');
  const [manageUsersReason, setManageUsersReason] = useState('');
  const [manageUsersConfirmAction, setManageUsersConfirmAction] = useState(null);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);

  // Toast & Submitting state
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Edit User State
  const [editUserData, setEditUserData] = useState({
    userId: null,
    displayUserId: '',
    fullName: '',
    email: '',
    role: '',
    startTime: '09:00 AM',
    endTime: '06:00 PM',
    weeklyWorkingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    accountStatus: 'active'
  });

  // Global Working Days State
  const [globalDaysData, setGlobalDaysData] = useState({
    startTime: '09:00 AM',
    endTime: '06:00 PM',
    weeklyWorkingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  });

  // Holiday Modal State
  const [holidayForm, setHolidayForm] = useState({
    id: null,
    holidayName: '',
    holidayDate: new Date().toISOString().split('T')[0],
    scopeType: 'GLOBAL',
    roles: [],
    designations: [],
    userId: '',
    reason: '',
    isActive: true
  });

  // Extend Modal State
  const [extendForm, setExtendForm] = useState({
    applyTo: 'SPECIFIC',
    userId: '',
    userIds: [],
    roles: [],
    designations: [],
    dateMode: 'SINGLE',
    extensionDate: new Date().toISOString().split('T')[0],
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    extendedStartTime: '09:00 AM',
    extendedEndTime: '08:00 PM',
    reason: ''
  });

  // Policy Form State
  const [policyForm, setPolicyForm] = useState({
    id: null,
    name: 'Operating Shift Policy',
    scopeType: 'GLOBAL',
    roles: [],
    designations: [],
    userId: '',
    isEnabled: true,
    scheduleConfig: JSON.parse(JSON.stringify(DEFAULT_SCHEDULE))
  });

  // Status Change Confirmation Dialog State
  const [statusConfirmData, setStatusConfirmData] = useState({
    user: null,
    targetStatus: 'active', // 'active' or 'inactive'
    reason: ''
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchWorkingHoursConfig();
      if (res.success) {
        setUsers(res.data.users || []);
        if (res.data.defaultConfig) {
          setDefaultConfig(res.data.defaultConfig);
          setGlobalDaysData({
            startTime: res.data.defaultConfig.start_time || '09:00 AM',
            endTime: res.data.defaultConfig.end_time || '06:00 PM',
            weeklyWorkingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
          });
        }
        setExtensionsToday(res.data.extensionsToday || []);
        setPolicies(res.data.policies || []);
        setHolidays(res.data.holidays || []);
        if (res.data.distinctDesignations) setDistinctDesignations(res.data.distinctDesignations);
        if (res.data.distinctRoles) setDistinctRoles(res.data.distinctRoles);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load working hours data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await fetchExtensionHistory();
      if (res.success) setHistoryList(res.data || []);
    } catch (err) {
      console.error('Failed to load extension history:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'history') loadHistory();
  }, [activeTab]);

  // Close 3-dots dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.action-menu-container')) {
        setOpenActionMenuId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // Filter & Search Logic
  const filteredUsers = users.filter(u => {
    const query = searchTerm.toLowerCase().trim();
    const matchesSearch = !query ||
      (u.displayUserId && u.displayUserId.toLowerCase().includes(query)) ||
      (u.user && u.user.toLowerCase().includes(query)) ||
      (u.email && u.email.toLowerCase().includes(query)) ||
      (u.employeeId && u.employeeId.toLowerCase().includes(query));

    const matchesRole = selectedRole === 'ALL' || String(u.role).toUpperCase() === selectedRole;

    const matchesStatus = selectedStatus === 'ALL' ||
      (selectedStatus === 'ACTIVE' && (u.accountStatus === 'active' || u.status === 'Active')) ||
      (selectedStatus === 'INACTIVE' && (u.accountStatus === 'inactive' || u.status === 'Inactive')) ||
      (selectedStatus === 'SCHEDULED' && (u.accountStatus === 'scheduled' || u.status === 'Scheduled'));

    let matchesDays = true;
    if (selectedDaysFilter === '5_DAYS') {
      matchesDays = (u.weeklyWorkingDays || []).length === 5;
    } else if (selectedDaysFilter === '6_DAYS') {
      matchesDays = (u.weeklyWorkingDays || []).length === 6;
    } else if (selectedDaysFilter === '7_DAYS') {
      matchesDays = (u.weeklyWorkingDays || []).length === 7;
    }

    return matchesSearch && matchesRole && matchesStatus && matchesDays;
  });

  // Sorting Logic
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aVal = '';
    let bVal = '';

    switch (sortField) {
      case 'userId':
        aVal = a.displayUserId || a.employeeId || '';
        bVal = b.displayUserId || b.employeeId || '';
        break;
      case 'user':
        aVal = a.user || '';
        bVal = b.user || '';
        break;
      case 'role':
        aVal = a.role || '';
        bVal = b.role || '';
        break;
      case 'startTime':
        aVal = a.startTime || '';
        bVal = b.startTime || '';
        break;
      case 'endTime':
        aVal = a.endTime || '';
        bVal = b.endTime || '';
        break;
      case 'days':
        aVal = (a.weeklyWorkingDays || []).length;
        bVal = (b.weeklyWorkingDays || []).length;
        return sortAsc ? aVal - bVal : bVal - aVal;
      case 'status':
        aVal = a.accountStatus || a.status || '';
        bVal = b.accountStatus || b.status || '';
        break;
      default:
        aVal = a.displayUserId || '';
        bVal = b.displayUserId || '';
    }

    const cmp = String(aVal).localeCompare(String(bVal));
    return sortAsc ? cmp : -cmp;
  });

  // Pagination Logic
  const totalRecords = sortedUsers.length;
  const isShowAll = pageSize === 'ALL' || pageSize >= totalRecords;
  const effectivePageSize = isShowAll ? totalRecords : Number(pageSize);
  const totalPages = isShowAll || totalRecords === 0 ? 1 : Math.ceil(totalRecords / effectivePageSize);
  const startIndex = isShowAll ? 0 : (currentPage - 1) * effectivePageSize;
  const paginatedUsers = sortedUsers.slice(startIndex, isShowAll ? totalRecords : startIndex + effectivePageSize);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedRole('ALL');
    setSelectedStatus('ALL');
    setSelectedDaysFilter('ALL');
    setCurrentPage(1);
  };

  // Bulk Selection
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUserIds(paginatedUsers.map(u => u.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleToggleUserSelect = (id) => {
    if (selectedUserIds.includes(id)) {
      setSelectedUserIds(selectedUserIds.filter(item => item !== id));
    } else {
      setSelectedUserIds([...selectedUserIds, id]);
    }
  };

  // Open Edit User Modal
  const handleOpenEditUser = (user) => {
    setEditUserData({
      userId: user.id,
      displayUserId: user.displayUserId || user.employeeId || '',
      fullName: user.user || '',
      email: user.email || '',
      role: user.role || '',
      startTime: user.startTime || '09:00 AM',
      endTime: user.endTime || '06:00 PM',
      weeklyWorkingDays: user.weeklyWorkingDays && user.weeklyWorkingDays.length > 0
        ? [...user.weeklyWorkingDays]
        : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      accountStatus: user.accountStatus || (user.isActive ? 'active' : 'inactive')
    });
    setShowEditUserModal(true);
  };

  // Toggle Day in User Edit Form
  const toggleEditDay = (dayShort) => {
    const current = editUserData.weeklyWorkingDays || [];
    if (current.includes(dayShort)) {
      if (current.length === 1) {
        showToast('At least 1 working day must be active', 'error');
        return;
      }
      setEditUserData({ ...editUserData, weeklyWorkingDays: current.filter(d => d !== dayShort) });
    } else {
      setEditUserData({ ...editUserData, weeklyWorkingDays: [...current, dayShort] });
    }
  };

  const setEditPreset = (preset) => {
    if (preset === '5') {
      setEditUserData({ ...editUserData, weeklyWorkingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] });
    } else if (preset === '6') {
      setEditUserData({ ...editUserData, weeklyWorkingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] });
    } else if (preset === '7') {
      setEditUserData({ ...editUserData, weeklyWorkingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] });
    }
  };

  // Save User Edit Form
  const handleSaveUserEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        userId: editUserData.userId,
        startTime: editUserData.startTime,
        endTime: editUserData.endTime,
        weeklyWorkingDays: editUserData.weeklyWorkingDays,
        accountStatus: editUserData.accountStatus,
        isEnabled: editUserData.accountStatus === 'active'
      };
      const res = await updateWorkingHours(payload);
      if (res.success) {
        showToast(res.message || 'User working hours and status updated successfully');
        setShowEditUserModal(false);
        loadData();
      } else {
        showToast(res.message || 'Failed to update record', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Server error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Global Week Working Days Handlers
  const toggleGlobalDay = (dayShort) => {
    const current = globalDaysData.weeklyWorkingDays || [];
    if (current.includes(dayShort)) {
      if (current.length === 1) {
        showToast('At least 1 working day must be active', 'error');
        return;
      }
      setGlobalDaysData({ ...globalDaysData, weeklyWorkingDays: current.filter(d => d !== dayShort) });
    } else {
      setGlobalDaysData({ ...globalDaysData, weeklyWorkingDays: [...current, dayShort] });
    }
  };

  const setGlobalPreset = (preset) => {
    if (preset === '5') {
      setGlobalDaysData({ ...globalDaysData, weeklyWorkingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] });
    } else if (preset === '6') {
      setGlobalDaysData({ ...globalDaysData, weeklyWorkingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] });
    } else if (preset === '7') {
      setGlobalDaysData({ ...globalDaysData, weeklyWorkingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] });
    }
  };

  const handleSaveGlobalDaysSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        isGlobal: true,
        startTime: globalDaysData.startTime,
        endTime: globalDaysData.endTime,
        weeklyWorkingDays: globalDaysData.weeklyWorkingDays,
        isEnabled: true
      };
      const res = await updateWorkingHours(payload);
      if (res.success) {
        showToast('Global working days and default schedule updated successfully');
        setShowGlobalDaysModal(false);
        loadData();
      } else {
        showToast(res.message || 'Failed to update global schedule', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Server error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Direct Activate / Deactivate Toggle with Confirmation
  const handlePromptStatusToggle = (user) => {
    const isCurrentlyActive = user.accountStatus === 'active' || user.status === 'Active';
    const targetStatus = isCurrentlyActive ? 'inactive' : 'active';
    setStatusConfirmData({
      user,
      targetStatus,
      reason: ''
    });
    setShowStatusConfirmModal(true);
  };

  const handleConfirmStatusToggle = async () => {
    if (!statusConfirmData.user) return;
    setSubmitting(true);
    try {
      const u = statusConfirmData.user;
      if (statusConfirmData.targetStatus === 'active') {
        const res = await activateAccount(u.id, { reason: statusConfirmData.reason.trim() || undefined });
        if (res.success) {
          showToast(`Account for ${u.user} has been activated`);
        }
      } else {
        const res = await deactivateAccount(u.id, { reason: statusConfirmData.reason.trim() || undefined });
        if (res.success) {
          showToast(`Account for ${u.user} has been deactivated`);
        }
      }
      setShowStatusConfirmModal(false);
      loadData();
    } catch (err) {
      showToast(err.message || 'Status update failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Manage All Users Modal Handlers
  const handleQuickToggleUserInModal = async (u) => {
    const isCurrentlyActive = u.accountStatus === 'active' || u.status === 'Active';
    const newStatus = isCurrentlyActive ? 'inactive' : 'active';
    setSubmitting(true);
    try {
      if (newStatus === 'active') {
        const res = await activateAccount(u.id, { reason: 'Direct activation from Manage All Users' });
        if (res.success) {
          showToast(`Account for ${u.user} activated`);
        }
      } else {
        const res = await deactivateAccount(u.id, { reason: 'Direct deactivation from Manage All Users' });
        if (res.success) {
          showToast(`Account for ${u.user} deactivated`);
        }
      }
      await loadData();
    } catch (err) {
      showToast(err.message || 'Status update failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecuteBulkStatusUpdate = async (action, scope, userIds = []) => {
    setSubmitting(true);
    try {
      const res = await bulkUpdateAccountStatus({
        action,
        scope,
        userIds: userIds.length > 0 ? userIds : undefined,
        reason: manageUsersReason.trim() || undefined
      });
      if (res.success) {
        showToast(res.message || `Successfully updated accounts to ${action}`);
        setManageUsersConfirmAction(null);
        setManageUsersSelectedIds([]);
        await loadData();
      }
    } catch (err) {
      showToast(err.message || 'Bulk status update failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Extend Modal handlers
  const handleOpenExtendForUser = (user) => {
    setExtendForm({
      applyTo: 'SPECIFIC',
      userId: user.id,
      userIds: [user.id],
      roles: [],
      designations: [],
      dateMode: 'SINGLE',
      extensionDate: new Date().toISOString().split('T')[0],
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      extendedStartTime: user.startTime || '09:00 AM',
      extendedEndTime: '08:00 PM',
      reason: ''
    });
    setShowExtendModal(true);
  };

  const handleExtendSubmit = async (e) => {
    e.preventDefault();
    if (!extendForm.reason.trim()) {
      showToast('Reason is required for extending hours', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        applyTo: extendForm.applyTo,
        userId: extendForm.userIds?.[0] || extendForm.userId || null,
        userIds: extendForm.userIds || [],
        roles: extendForm.roles || [],
        designations: extendForm.designations || [],
        extensionDate: extendForm.dateMode === 'SINGLE' ? extendForm.extensionDate : null,
        startDate: extendForm.dateMode === 'RANGE' ? extendForm.startDate : null,
        endDate: extendForm.dateMode === 'RANGE' ? extendForm.endDate : null,
        extendedStartTime: extendForm.extendedStartTime || '09:00 AM',
        extendedEndTime: extendForm.extendedEndTime || '08:00 PM',
        reason: extendForm.reason.trim()
      };
      const res = await extendWorkingHours(payload);
      if (res.success) {
        showToast(res.message || 'Working hours extended successfully');
        setShowExtendModal(false);
        loadData();
      } else {
        showToast(res.message || 'Failed to extend hours', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Server error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Holiday Modal handlers
  const handleOpenHolidayForUser = (user) => {
    setHolidayForm({
      id: null,
      holidayName: 'Time Off / Individual Holiday',
      holidayDate: new Date().toISOString().split('T')[0],
      scopeType: 'USER',
      roles: [],
      designations: [],
      userId: user.id,
      reason: `Holiday granted for ${user.user}`,
      isActive: true
    });
    setShowHolidayModal(true);
  };

  const handleHolidaySubmit = async (e) => {
    e.preventDefault();
    if (!holidayForm.holidayName.trim()) {
      showToast('Holiday name is required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await saveHoliday(holidayForm);
      if (res.success) {
        showToast('Holiday calendar rule saved successfully');
        setShowHolidayModal(false);
        loadData();
      } else {
        showToast(res.message || 'Failed to save holiday', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Server error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteHolidayClick = async (id) => {
    if (!window.confirm('Are you sure you want to delete this holiday record?')) return;
    try {
      const res = await deleteHoliday(id);
      if (res.success) {
        showToast('Holiday deleted successfully');
        loadData();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete holiday', 'error');
    }
  };

  const handleRevokeExtension = async (id) => {
    if (!window.confirm('Are you sure you want to revoke this extension?')) return;
    try {
      const res = await revokeExtension(id);
      if (res.success) {
        showToast('Extension revoked successfully');
        loadData();
        loadHistory();
      }
    } catch (err) {
      showToast(err.message || 'Failed to revoke extension', 'error');
    }
  };

  return (
    <div style={{ padding: isMobile ? '12px' : '24px', backgroundColor: '#F8FAFC', minHeight: '100vh', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      {/* Toast Alert */}
      {toast && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 10000,
          backgroundColor: toast.type === 'error' ? '#FEF2F2' : '#F0FDF4',
          border: `1px solid ${toast.type === 'error' ? '#FCA5A5' : '#86EFAC'}`,
          color: toast.type === 'error' ? '#991B1B' : '#166534',
          padding: '12px 20px', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600, fontSize: '14px'
        }}>
          {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header & Upside Options */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div>
          <h1 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock style={{ color: '#6366F1' }} size={isMobile ? 24 : 28} />
            Working Hours & Staff Schedules
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#64748B', fontSize: isMobile ? '12.5px' : '14px' }}>
            Configure daily shifts, weekly working days, account access statuses, holiday rules, and time extensions.
          </p>
        </div>

        {/* Upside Action Controls (Global Week Working Day Manage, Add Holiday, Extend Time) */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
          <button
            onClick={() => setShowGlobalDaysModal(true)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: isMobile ? '9px 14px' : '10px 18px',
              backgroundColor: '#6366F1', color: '#FFFFFF', border: 'none', borderRadius: '10px',
              fontWeight: 700, cursor: 'pointer', fontSize: '13.5px', flex: isMobile ? '1 1 100%' : 'none',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)', transition: 'background 0.2s'
            }}
          >
            <Settings size={16} />
            <span>Global Week Working Days</span>
          </button>

          <button
            onClick={() => {
              setHolidayForm({
                id: null,
                holidayName: '',
                holidayDate: new Date().toISOString().split('T')[0],
                scopeType: 'GLOBAL',
                roles: [],
                designations: [],
                userId: '',
                reason: '',
                isActive: true
              });
              setShowHolidayModal(true);
            }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: isMobile ? '9px 14px' : '10px 18px',
              backgroundColor: '#0284C7', color: '#FFFFFF', border: 'none', borderRadius: '10px',
              fontWeight: 700, cursor: 'pointer', fontSize: '13.5px', flex: isMobile ? '1 1 140px' : 'none',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
            }}
          >
            <Calendar size={16} />
            <span>Add Holiday</span>
          </button>

          <button
            onClick={() => {
              setExtendForm({
                applyTo: 'SPECIFIC',
                userId: '',
                userIds: [],
                roles: [],
                designations: [],
                dateMode: 'SINGLE',
                extensionDate: new Date().toISOString().split('T')[0],
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                extendedStartTime: '09:00 AM',
                extendedEndTime: '08:00 PM',
                reason: ''
              });
              setShowExtendModal(true);
            }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: isMobile ? '9px 14px' : '10px 18px',
              backgroundColor: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '10px',
              fontWeight: 700, cursor: 'pointer', fontSize: '13.5px', flex: isMobile ? '1 1 120px' : 'none',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
            }}
          >
            <Zap size={16} />
            <span>Extend Time</span>
          </button>

          <button
            onClick={() => {
              setManageUsersSearch('');
              setManageUsersRoleFilter('ALL');
              setManageUsersStatusFilter('ALL');
              setManageUsersSelectedIds([]);
              setManageUsersBulkScope('ALL');
              setManageUsersReason('');
              setManageUsersConfirmAction(null);
              setShowManageUsersModal(true);
            }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: isMobile ? '9px 14px' : '10px 18px',
              backgroundColor: '#7C3AED', color: '#FFFFFF', border: 'none', borderRadius: '10px',
              fontWeight: 700, cursor: 'pointer', fontSize: '13.5px', flex: isMobile ? '1 1 140px' : 'none',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)', transition: 'background 0.2s'
            }}
            title="Manage active/inactive status for all employee and admin accounts"
          >
            <Users size={16} />
            <span>Manage All Users</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: isMobile ? '10px' : '14px',
        marginBottom: '20px'
      }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Total Staff Records</div>
          <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 900, color: '#4F46E5', marginTop: '4px' }}>{users.length}</div>
          <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '2px' }}>Operational accounts</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Active Accounts</div>
          <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 900, color: '#16A34A', marginTop: '4px' }}>
            {users.filter(u => u.accountStatus === 'active' || u.status === 'Active').length}
          </div>
          <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '2px' }}>Authorized & working</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Inactive Accounts</div>
          <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 900, color: '#DC2626', marginTop: '4px' }}>
            {users.filter(u => u.accountStatus === 'inactive' || u.status === 'Inactive').length}
          </div>
          <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '2px' }}>Deactivated access</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Extensions Today</div>
          <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 900, color: '#D97706', marginTop: '4px' }}>{extensionsToday.length}</div>
          <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '2px' }}>Active overtime shifts</div>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '2px solid #E2E8F0',
        marginBottom: '20px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: '2px'
      }}>
        {[
          { id: 'records', label: 'User Shift Records', icon: Users, count: users.length },
          { id: 'policies', label: 'Weekly Policies', icon: Clock, count: policies.length },
          { id: 'holidays', label: 'Holidays Calendar', icon: Calendar, count: holidays.length },
          { id: 'history', label: 'Extension Logs', icon: History, count: historyList.length }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: isMobile ? '10px 14px' : '12px 20px',
                border: 'none', background: 'none',
                borderBottom: isActive ? '3px solid #6366F1' : '3px solid transparent',
                color: isActive ? '#6366F1' : '#64748B', fontWeight: isActive ? 800 : 600,
                cursor: 'pointer', fontSize: isMobile ? '13px' : '14px', whiteSpace: 'nowrap', flexShrink: 0
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              <span style={{
                backgroundColor: isActive ? '#EEF2FF' : '#F1F5F9',
                color: isActive ? '#6366F1' : '#64748B',
                fontSize: '11px', padding: '2px 8px', borderRadius: '12px', fontWeight: 800
              }}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ================= PRIMARY VIEW: USER RECORDS TABLE (MATCHING SCREENSHOT 1:1) ================= */}
      {activeTab === 'records' && (
        <div>
          {/* Top Filter and Search Bar (Screenshot matching) */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '14px',
            padding: '16px',
            marginBottom: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '12px',
            alignItems: isMobile ? 'stretch' : 'center',
            justifyContent: 'space-between'
          }}>
            {/* Search Input */}
            <div style={{ flex: '1 1 300px', position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search by User ID, name or email..."
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 42px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13.5px',
                  outline: 'none',
                  backgroundColor: '#FFFFFF',
                  color: '#1E293B',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Role Filter */}
            <select
              value={selectedRole}
              onChange={e => { setSelectedRole(e.target.value); setCurrentPage(1); }}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                fontSize: '13.5px',
                backgroundColor: '#FFFFFF',
                color: '#334155',
                outline: 'none',
                minWidth: '130px',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Roles</option>
              {distinctRoles.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={e => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                fontSize: '13.5px',
                backgroundColor: '#FFFFFF',
                color: '#334155',
                outline: 'none',
                minWidth: '130px',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SCHEDULED">Scheduled</option>
            </select>

            {/* Working Days Filter */}
            <select
              value={selectedDaysFilter}
              onChange={e => { setSelectedDaysFilter(e.target.value); setCurrentPage(1); }}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                fontSize: '13.5px',
                backgroundColor: '#FFFFFF',
                color: '#334155',
                outline: 'none',
                minWidth: '160px',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Working Days</option>
              <option value="5_DAYS">5 Days (Mon-Fri)</option>
              <option value="6_DAYS">6 Days (Mon-Sat)</option>
              <option value="7_DAYS">7 Days (Full Week)</option>
            </select>

            {/* Reset Filters Button */}
            <button
              onClick={handleResetFilters}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px 16px',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC',
                color: '#4F46E5',
                fontWeight: 700,
                fontSize: '13.5px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              <RefreshCw size={14} />
              <span>Reset Filters</span>
            </button>
          </div>

          {/* Table Container Card */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '14px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#64748B' }}>
                Loading user shift records...
              </div>
            ) : paginatedUsers.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#94A3B8' }}>
                <Users size={36} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
                <div style={{ fontSize: '15px', fontWeight: 600 }}>No user records found</div>
                <div style={{ fontSize: '13px', marginTop: '4px' }}>Try modifying your search or reset filters</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#334155' }}>
                      {/* Checkbox */}
                      <th style={{ padding: '14px 16px', width: '40px' }}>
                        <input
                          type="checkbox"
                          checked={paginatedUsers.length > 0 && selectedUserIds.length === paginatedUsers.length}
                          onChange={handleSelectAll}
                          style={{ cursor: 'pointer', borderRadius: '4px' }}
                        />
                      </th>

                      {/* User ID */}
                      <th
                        onClick={() => handleSort('userId')}
                        style={{ padding: '14px 16px', fontWeight: 700, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          User ID {sortField === 'userId' ? (sortAsc ? '↑' : '↓') : '↑↓'}
                        </span>
                      </th>

                      {/* User Name */}
                      <th
                        onClick={() => handleSort('user')}
                        style={{ padding: '14px 16px', fontWeight: 700, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          User Name {sortField === 'user' ? (sortAsc ? '↑' : '↓') : '↑↓'}
                        </span>
                      </th>

                      {/* Role */}
                      <th
                        onClick={() => handleSort('role')}
                        style={{ padding: '14px 16px', fontWeight: 700, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          Role {sortField === 'role' ? (sortAsc ? '↑' : '↓') : '↑↓'}
                        </span>
                      </th>

                      {/* Starting Time */}
                      <th
                        onClick={() => handleSort('startTime')}
                        style={{ padding: '14px 16px', fontWeight: 700, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          Starting Time {sortField === 'startTime' ? (sortAsc ? '↑' : '↓') : '↑↓'}
                        </span>
                      </th>

                      {/* Ending Time */}
                      <th
                        onClick={() => handleSort('endTime')}
                        style={{ padding: '14px 16px', fontWeight: 700, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          Ending Time {sortField === 'endTime' ? (sortAsc ? '↑' : '↓') : '↑↓'}
                        </span>
                      </th>

                      {/* Weekly Working Days */}
                      <th
                        onClick={() => handleSort('days')}
                        style={{ padding: '14px 16px', fontWeight: 700, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          Weekly Working Days {sortField === 'days' ? (sortAsc ? '↑' : '↓') : '↑↓'}
                        </span>
                      </th>

                      {/* Account Status */}
                      <th
                        onClick={() => handleSort('status')}
                        style={{ padding: '14px 16px', fontWeight: 700, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          Account Status {sortField === 'status' ? (sortAsc ? '↑' : '↓') : '↑↓'}
                        </span>
                      </th>

                      {/* Action */}
                      <th style={{ padding: '14px 16px', fontWeight: 700, textAlign: 'left', whiteSpace: 'nowrap' }}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((u) => {
                      const roleStyle = getRoleBadgeStyle(u.role);
                      const isSelected = selectedUserIds.includes(u.id);
                      const isUserActive = u.accountStatus === 'active' || u.status === 'Active';
                      const isScheduled = u.accountStatus === 'scheduled' || u.status === 'Scheduled';

                      return (
                        <tr
                          key={u.id}
                          style={{
                            borderBottom: '1px solid #F1F5F9',
                            backgroundColor: isSelected ? '#F8FAFC' : '#FFFFFF',
                            transition: 'background 0.15s'
                          }}
                        >
                          {/* Checkbox */}
                          <td style={{ padding: '14px 16px' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleUserSelect(u.id)}
                              style={{ cursor: 'pointer' }}
                            />
                          </td>

                          {/* User ID */}
                          <td style={{ padding: '14px 16px', fontWeight: 700, color: '#334155', whiteSpace: 'nowrap' }}>
                            {u.displayUserId || u.employeeId || `PM-${String(u.id).slice(0, 8)}`}
                          </td>

                          {/* User Name + Avatar + Email */}
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{
                                width: '36px', height: '36px', borderRadius: '50%',
                                backgroundColor: '#6366F1', color: '#FFFFFF',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 800, fontSize: '13px', flexShrink: 0
                              }}>
                                {getInitials(u.user)}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '13.5px' }}>{u.user}</div>
                                <div style={{ fontSize: '12px', color: '#64748B' }}>{u.email}</div>
                              </div>
                            </div>
                          </td>

                          {/* Role Pill */}
                          <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '4px 12px',
                              borderRadius: '16px',
                              fontSize: '12px',
                              fontWeight: 700,
                              backgroundColor: roleStyle.bg,
                              color: roleStyle.text
                            }}>
                              {roleStyle.label}
                            </span>
                          </td>

                          {/* Starting Time */}
                          <td style={{ padding: '14px 16px', fontWeight: 600, color: '#1E293B', whiteSpace: 'nowrap' }}>
                            {u.startTime || '09:00 AM'}
                          </td>

                          {/* Ending Time */}
                          <td style={{ padding: '14px 16px', fontWeight: 600, color: '#1E293B', whiteSpace: 'nowrap' }}>
                            {u.endTime || '06:00 PM'}
                            {u.effectiveEndTime && u.effectiveEndTime !== u.endTime && (
                              <div style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>
                                Overtime: {u.effectiveEndTime}
                              </div>
                            )}
                          </td>

                          {/* Weekly Working Days */}
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              {(u.weeklyWorkingDays && u.weeklyWorkingDays.length > 0 ? u.weeklyWorkingDays : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']).map(day => (
                                <span
                                  key={day}
                                  style={{
                                    padding: '2px 7px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    backgroundColor: '#EEF2FF',
                                    color: '#4F46E5',
                                    border: '1px solid #E0E7FF'
                                  }}
                                >
                                  {day}
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* Account Status */}
                          <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                            {isScheduled ? (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: 700,
                                backgroundColor: '#E0F2FE', color: '#0284C7'
                              }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0284C7' }} />
                                Scheduled
                              </span>
                            ) : isUserActive ? (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: 700,
                                backgroundColor: '#DCFCE7', color: '#15803D'
                              }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16A34A' }} />
                                Active
                              </span>
                            ) : (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: 700,
                                backgroundColor: '#FFEDD5', color: '#C2410C'
                              }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#EA580C' }} />
                                Inactive
                              </span>
                            )}
                          </td>

                          {/* Action Buttons */}
                          <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {/* Edit Button */}
                              <button
                                onClick={() => handleOpenEditUser(u)}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                                  padding: '6px 12px', borderRadius: '8px',
                                  border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF',
                                  color: '#0F172A', fontWeight: 700, fontSize: '12.5px',
                                  cursor: 'pointer', transition: 'all 0.15s'
                                }}
                              >
                                <Edit2 size={13} />
                                <span>Edit</span>
                              </button>

                              {/* Activate / Deactivate Toggle Button */}
                              {isUserActive ? (
                                <button
                                  onClick={() => handlePromptStatusToggle(u)}
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                                    padding: '6px 12px', borderRadius: '8px',
                                    border: '1px solid #FECACA', backgroundColor: '#FEF2F2',
                                    color: '#DC2626', fontWeight: 700, fontSize: '12.5px',
                                    cursor: 'pointer', transition: 'all 0.15s'
                                  }}
                                >
                                  <Power size={13} />
                                  <span>Deactivate</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handlePromptStatusToggle(u)}
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                                    padding: '6px 12px', borderRadius: '8px',
                                    border: '1px solid #16A34A', backgroundColor: '#16A34A',
                                    color: '#FFFFFF', fontWeight: 700, fontSize: '12.5px',
                                    cursor: 'pointer', transition: 'all 0.15s'
                                  }}
                                >
                                  <Power size={13} />
                                  <span>Activate</span>
                                </button>
                              )}

                              {/* Three-dots Menu */}
                              <div className="action-menu-container" style={{ position: 'relative' }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenActionMenuId(openActionMenuId === u.id ? null : u.id);
                                  }}
                                  style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: '#64748B', padding: '6px', borderRadius: '6px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                  }}
                                >
                                  <MoreVertical size={16} />
                                </button>

                                {openActionMenuId === u.id && (
                                  <div style={{
                                    position: 'absolute', right: 0, top: '100%', zIndex: 100,
                                    backgroundColor: '#FFFFFF', borderRadius: '10px',
                                    border: '1px solid #E2E8F0', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12)',
                                    minWidth: '190px', padding: '6px', display: 'flex', flexDirection: 'column', gap: '2px'
                                  }}>
                                    <button
                                      onClick={() => { setOpenActionMenuId(null); handleOpenExtendForUser(u); }}
                                      style={{
                                        display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
                                        border: 'none', background: 'none', textAlign: 'left',
                                        fontSize: '12.5px', fontWeight: 600, color: '#334155', cursor: 'pointer',
                                        borderRadius: '6px', width: '100%'
                                      }}
                                    >
                                      <Zap size={14} color="#D97706" />
                                      <span>Extend Shift Time</span>
                                    </button>

                                    <button
                                      onClick={() => { setOpenActionMenuId(null); handleOpenHolidayForUser(u); }}
                                      style={{
                                        display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
                                        border: 'none', background: 'none', textAlign: 'left',
                                        fontSize: '12.5px', fontWeight: 600, color: '#334155', cursor: 'pointer',
                                        borderRadius: '6px', width: '100%'
                                      }}
                                    >
                                      <Calendar size={14} color="#0284C7" />
                                      <span>Add Holiday / Leave</span>
                                    </button>

                                    <button
                                      onClick={() => { setOpenActionMenuId(null); handleOpenEditUser(u); }}
                                      style={{
                                        display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
                                        border: 'none', background: 'none', textAlign: 'left',
                                        fontSize: '12.5px', fontWeight: 600, color: '#334155', cursor: 'pointer',
                                        borderRadius: '6px', width: '100%'
                                      }}
                                    >
                                      <Settings size={14} color="#6366F1" />
                                      <span>Manage Working Days</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Bottom Pagination & Records Summary */}
            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'flex-start' : 'center',
              padding: '14px 20px',
              borderTop: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF',
              gap: '12px'
            }}>
              <div style={{ fontSize: '13px', color: '#64748B' }}>
                Showing{' '}
                <strong>{totalRecords === 0 ? 0 : startIndex + 1}</strong> to{' '}
                <strong>{Math.min(startIndex + effectivePageSize, totalRecords)}</strong> of{' '}
                <strong>{totalRecords}</strong> records
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                {/* Page Size Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748B' }}>
                  <span>Rows per page:</span>
                  <select
                    value={pageSize}
                    onChange={e => {
                      setPageSize(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    style={{
                      padding: '4px 8px', borderRadius: '6px', border: '1px solid #CBD5E1',
                      fontSize: '13px', backgroundColor: '#FFFFFF', outline: 'none', cursor: 'pointer'
                    }}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value="ALL">All</option>
                  </select>
                </div>

                {/* Prev / Next Pagination */}
                {!isShowAll && totalPages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      style={{
                        padding: '6px 10px', borderRadius: '6px', border: '1px solid #E2E8F0',
                        backgroundColor: currentPage === 1 ? '#F8FAFC' : '#FFFFFF',
                        color: currentPage === 1 ? '#CBD5E1' : '#334155',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155', padding: '0 4px' }}>
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      style={{
                        padding: '6px 10px', borderRadius: '6px', border: '1px solid #E2E8F0',
                        backgroundColor: currentPage === totalPages ? '#F8FAFC' : '#FFFFFF',
                        color: currentPage === totalPages ? '#CBD5E1' : '#334155',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: WEEKLY SCHEDULE POLICIES ================= */}
      {activeTab === 'policies' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#0F172A' }}>Organization Shift Policies</h2>
              <p style={{ margin: '2px 0 0 0', color: '#64748B', fontSize: '13px' }}>Precedence: Specific User &gt; Designation &gt; Role &gt; Global Default</p>
            </div>
            <button
              onClick={() => {
                setPolicyForm({
                  id: null,
                  name: 'New Custom Schedule',
                  scopeType: 'GLOBAL',
                  roles: [],
                  designations: [],
                  userId: '',
                  isEnabled: true,
                  scheduleConfig: JSON.parse(JSON.stringify(DEFAULT_SCHEDULE))
                });
                setShowPolicyModal(true);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px',
                backgroundColor: '#6366F1', color: '#FFFFFF', border: 'none', borderRadius: '8px',
                fontWeight: 700, cursor: 'pointer', fontSize: '13px'
              }}
            >
              <PlusCircle size={15} />
              <span>Create Policy</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
            {policies.map(p => (
              <div key={p.id} style={{
                backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '18px',
                border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <span style={{
                      display: 'inline-block', fontSize: '11px', fontWeight: 800, padding: '2px 8px',
                      borderRadius: '6px', textTransform: 'uppercase', marginBottom: '6px',
                      backgroundColor: p.scope_type === 'GLOBAL' ? '#EEF2FF' : p.scope_type === 'USER' ? '#FEF3C7' : '#F0FDF4',
                      color: p.scope_type === 'GLOBAL' ? '#4F46E5' : p.scope_type === 'USER' ? '#D97706' : '#166534'
                    }}>
                      Scope: {p.scope_type}
                    </span>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>{p.name}</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => {
                        setPolicyForm({
                          id: p.id,
                          name: p.name,
                          scopeType: p.scope_type,
                          roles: p.roles || [],
                          designations: p.designations || [],
                          userId: p.user_id || '',
                          isEnabled: p.is_enabled !== false,
                          scheduleConfig: p.schedule_config || JSON.parse(JSON.stringify(DEFAULT_SCHEDULE))
                        });
                        setShowPolicyModal(true);
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4F46E5', padding: '4px' }}
                    >
                      <Edit2 size={16} />
                    </button>
                    {p.scope_type !== 'GLOBAL' && (
                      <button
                        onClick={async () => {
                          if (!window.confirm('Delete this policy?')) return;
                          await deletePolicy(p.id);
                          showToast('Policy deleted');
                          loadData();
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '4px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '12px' }}>
                  {p.scope_type === 'ROLE' && <div><strong>Roles:</strong> {p.roles?.join(', ')}</div>}
                  {p.scope_type === 'DESIGNATION' && <div><strong>Designations:</strong> {p.designations?.join(', ')}</div>}
                  {p.scope_type === 'USER' && <div><strong>User:</strong> {p.user_name || p.user_email}</div>}
                  {p.scope_type === 'GLOBAL' && <div>Default organizational schedule applied to all staff</div>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: '#F8FAFC', padding: '10px', borderRadius: '8px' }}>
                  {DAYS_OF_WEEK.map(d => {
                    const item = p.schedule_config?.[d.key] || { is_working: true, start_time: '09:00 AM', end_time: '06:00 PM' };
                    return (
                      <div key={d.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ fontWeight: 600, color: item.is_working ? '#1E293B' : '#94A3B8' }}>{d.label}</span>
                        {item.is_working ? (
                          <span style={{ fontWeight: 700, color: '#4F46E5' }}>{item.start_time} - {item.end_time}</span>
                        ) : (
                          <span style={{ color: '#EF4444', fontWeight: 600 }}>Off</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 3: HOLIDAYS CALENDAR ================= */}
      {activeTab === 'holidays' && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#0F172A' }}>Holiday Calendar & Scheduled Days Off</h2>
            <button
              onClick={() => {
                setHolidayForm({
                  id: null,
                  holidayName: '',
                  holidayDate: new Date().toISOString().split('T')[0],
                  scopeType: 'GLOBAL',
                  roles: [],
                  designations: [],
                  userId: '',
                  reason: '',
                  isActive: true
                });
                setShowHolidayModal(true);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
                backgroundColor: '#0284C7', color: '#FFFFFF', border: 'none', borderRadius: '8px',
                fontWeight: 700, cursor: 'pointer', fontSize: '13px'
              }}
            >
              <Calendar size={15} />
              <span>Add Holiday</span>
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Holiday Name</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Date</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Scope</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {holidays.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: '#94A3B8' }}>
                    No holiday records configured.
                  </td>
                </tr>
              ) : (
                holidays.map(h => (
                  <tr key={h.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0F172A' }}>{h.holiday_name}</td>
                    <td style={{ padding: '12px 16px', color: '#334155' }}>{h.holiday_date ? h.holiday_date.split('T')[0] : ''}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px',
                        backgroundColor: h.scope_type === 'GLOBAL' ? '#EEF2FF' : '#F0FDF4',
                        color: h.scope_type === 'GLOBAL' ? '#4F46E5' : '#166534'
                      }}>
                        {h.scope_type}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: '11.5px', fontWeight: 700, padding: '3px 8px', borderRadius: '12px',
                        backgroundColor: h.is_active ? '#DCFCE7' : '#FEE2E2',
                        color: h.is_active ? '#15803D' : '#B91C1C'
                      }}>
                        {h.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleDeleteHolidayClick(h.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= TAB 4: EXTENSION LOGS ================= */}
      {activeTab === 'history' && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 16px 0', color: '#0F172A' }}>Working Hour Extensions History</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Date</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Applied To</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Extended Hours</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Reason</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {historyList.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#94A3B8' }}>
                    No extensions recorded.
                  </td>
                </tr>
              ) : (
                historyList.map(h => (
                  <tr key={h.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 16px', color: '#334155' }}>
                      {h.start_date && h.end_date ? `${h.start_date.split('T')[0]} to ${h.end_date.split('T')[0]}` : (h.extension_date ? h.extension_date.split('T')[0] : 'Today')}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0F172A' }}>
                      {h.apply_to === 'ALL' ? 'All Staff' : (h.target_user_name || h.target_user_email || h.apply_to)}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#059669' }}>
                      {h.extended_start_time || '09:00 AM'} - {h.extended_end_time}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>{h.reason || 'N/A'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px',
                        backgroundColor: h.is_revoked ? '#F1F5F9' : '#DCFCE7',
                        color: h.is_revoked ? '#64748B' : '#15803D'
                      }}>
                        {h.is_revoked ? 'Revoked' : 'Active'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      {!h.is_revoked && (
                        <button
                          onClick={() => handleRevokeExtension(h.id)}
                          style={{ padding: '4px 8px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= MODAL: EDIT USER SHIFT, WORKING DAYS & STATUS ================= */}
      {showEditUserModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '540px',
            maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{
              padding: '18px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex',
              justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0F172A' }}>
                  Edit Shift & Account Status
                </h3>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                  {editUserData.fullName} • {editUserData.displayUserId}
                </div>
              </div>
              <button onClick={() => setShowEditUserModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveUserEditSubmit} style={{ padding: '24px' }}>
              {/* Shift Starting & Ending Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Starting Time
                  </label>
                  <select
                    value={editUserData.startTime}
                    onChange={e => setEditUserData({ ...editUserData, startTime: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px', backgroundColor: '#FFFFFF' }}
                  >
                    {TIME_OPTIONS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Ending Time
                  </label>
                  <select
                    value={editUserData.endTime}
                    onChange={e => setEditUserData({ ...editUserData, endTime: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px', backgroundColor: '#FFFFFF' }}
                  >
                    {TIME_OPTIONS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Weekly Working Days */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155' }}>
                    Weekly Working Days ({editUserData.weeklyWorkingDays.length} Selected)
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setEditPreset('5')}
                      style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', border: '1px solid #CBD5E1', background: '#F8FAFC', cursor: 'pointer', fontWeight: 600 }}
                    >
                      5 Days (Mon-Fri)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditPreset('6')}
                      style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', border: '1px solid #CBD5E1', background: '#F8FAFC', cursor: 'pointer', fontWeight: 600 }}
                    >
                      6 Days (Mon-Sat)
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {DAYS_OF_WEEK.map(d => {
                    const isSelected = editUserData.weeklyWorkingDays.includes(d.short);
                    return (
                      <button
                        key={d.short}
                        type="button"
                        onClick={() => toggleEditDay(d.short)}
                        style={{
                          padding: '7px 14px', borderRadius: '8px', border: '1px solid',
                          borderColor: isSelected ? '#6366F1' : '#CBD5E1',
                          backgroundColor: isSelected ? '#EEF2FF' : '#FFFFFF',
                          color: isSelected ? '#4F46E5' : '#64748B',
                          fontWeight: 700, fontSize: '13px', cursor: 'pointer'
                        }}
                      >
                        {d.short}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Account Status */}
              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                  Account Status
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <label style={{
                    flex: 1, display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 14px', borderRadius: '8px', border: '1px solid',
                    borderColor: editUserData.accountStatus === 'active' ? '#16A34A' : '#CBD5E1',
                    backgroundColor: editUserData.accountStatus === 'active' ? '#F0FDF4' : '#FFFFFF',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="radio"
                      name="accountStatus"
                      value="active"
                      checked={editUserData.accountStatus === 'active'}
                      onChange={() => setEditUserData({ ...editUserData, accountStatus: 'active' })}
                    />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#16A34A' }}>Active</span>
                  </label>

                  <label style={{
                    flex: 1, display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 14px', borderRadius: '8px', border: '1px solid',
                    borderColor: editUserData.accountStatus === 'inactive' ? '#DC2626' : '#CBD5E1',
                    backgroundColor: editUserData.accountStatus === 'inactive' ? '#FEF2F2' : '#FFFFFF',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="radio"
                      name="accountStatus"
                      value="inactive"
                      checked={editUserData.accountStatus === 'inactive'}
                      onChange={() => setEditUserData({ ...editUserData, accountStatus: 'inactive' })}
                    />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#DC2626' }}>Inactive</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowEditUserModal(false)}
                  style={{
                    padding: '9px 16px', borderRadius: '8px', border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: '13.5px'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '9px 20px', borderRadius: '8px', border: 'none',
                    backgroundColor: '#6366F1', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer', fontSize: '13.5px',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)'
                  }}
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: GLOBAL WEEK WORKING DAYS ================= */}
      {showGlobalDaysModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '520px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{
              padding: '18px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex',
              justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0F172A' }}>
                  Global Week Working Days
                </h3>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                  Default schedule applied across all accounts
                </div>
              </div>
              <button onClick={() => setShowGlobalDaysModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveGlobalDaysSubmit} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Default Start Time
                  </label>
                  <select
                    value={globalDaysData.startTime}
                    onChange={e => setGlobalDaysData({ ...globalDaysData, startTime: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px', backgroundColor: '#FFFFFF' }}
                  >
                    {TIME_OPTIONS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Default End Time
                  </label>
                  <select
                    value={globalDaysData.endTime}
                    onChange={e => setGlobalDaysData({ ...globalDaysData, endTime: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px', backgroundColor: '#FFFFFF' }}
                  >
                    {TIME_OPTIONS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155' }}>
                    Working Days of Week ({globalDaysData.weeklyWorkingDays.length} Active)
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setGlobalPreset('5')}
                      style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', border: '1px solid #CBD5E1', background: '#F8FAFC', cursor: 'pointer', fontWeight: 600 }}
                    >
                      5 Days (Mon-Fri)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGlobalPreset('6')}
                      style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', border: '1px solid #CBD5E1', background: '#F8FAFC', cursor: 'pointer', fontWeight: 600 }}
                    >
                      6 Days (Mon-Sat)
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {DAYS_OF_WEEK.map(d => {
                    const isSelected = globalDaysData.weeklyWorkingDays.includes(d.short);
                    return (
                      <button
                        key={d.short}
                        type="button"
                        onClick={() => toggleGlobalDay(d.short)}
                        style={{
                          padding: '7px 14px', borderRadius: '8px', border: '1px solid',
                          borderColor: isSelected ? '#6366F1' : '#CBD5E1',
                          backgroundColor: isSelected ? '#EEF2FF' : '#FFFFFF',
                          color: isSelected ? '#4F46E5' : '#64748B',
                          fontWeight: 700, fontSize: '13px', cursor: 'pointer'
                        }}
                      >
                        {d.short}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowGlobalDaysModal(false)}
                  style={{
                    padding: '9px 16px', borderRadius: '8px', border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: '13.5px'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '9px 20px', borderRadius: '8px', border: 'none',
                    backgroundColor: '#6366F1', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer', fontSize: '13.5px',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)'
                  }}
                >
                  {submitting ? 'Updating...' : 'Save Global Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD HOLIDAY ================= */}
      {showHolidayModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '500px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{
              padding: '18px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex',
              justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC'
            }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0F172A' }}>
                Add Holiday / Scheduled Day Off
              </h3>
              <button onClick={() => setShowHolidayModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleHolidaySubmit} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Holiday Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diwali, Independence Day, Annual Off"
                  value={holidayForm.holidayName}
                  onChange={e => setHolidayForm({ ...holidayForm, holidayName: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Holiday Date</label>
                <input
                  type="date"
                  required
                  value={holidayForm.holidayDate}
                  onChange={e => setHolidayForm({ ...holidayForm, holidayDate: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Apply Holiday To</label>
                <select
                  value={holidayForm.scopeType}
                  onChange={e => setHolidayForm({ ...holidayForm, scopeType: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px', backgroundColor: '#FFFFFF' }}
                >
                  <option value="GLOBAL">All Users (Global)</option>
                  <option value="ROLE">Specific Role</option>
                  <option value="USER">Specific User</option>
                </select>
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Reason / Notes</label>
                <textarea
                  rows={2}
                  value={holidayForm.reason}
                  onChange={e => setHolidayForm({ ...holidayForm, reason: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowHolidayModal(false)}
                  style={{
                    padding: '9px 16px', borderRadius: '8px', border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: '13.5px'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '9px 20px', borderRadius: '8px', border: 'none',
                    backgroundColor: '#0284C7', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer', fontSize: '13.5px',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
                  }}
                >
                  {submitting ? 'Saving...' : 'Save Holiday'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EXTEND WORKING HOURS ================= */}
      {showExtendModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '520px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{
              padding: '18px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex',
              justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC'
            }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0F172A' }}>
                Extend Shift Working Hours
              </h3>
              <button onClick={() => setShowExtendModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleExtendSubmit} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Target User(s) / Staff
                </label>
                <select
                  value={extendForm.userIds?.[0] || extendForm.userId || ''}
                  onChange={e => setExtendForm({ ...extendForm, userId: e.target.value, userIds: e.target.value ? [e.target.value] : [] })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px', backgroundColor: '#FFFFFF' }}
                >
                  <option value="">Select Staff User (or leave empty for All)</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.user} ({u.displayUserId || u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Extended Start Time
                  </label>
                  <select
                    value={extendForm.extendedStartTime}
                    onChange={e => setExtendForm({ ...extendForm, extendedStartTime: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px', backgroundColor: '#FFFFFF' }}
                  >
                    {TIME_OPTIONS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Extended End Time
                  </label>
                  <select
                    value={extendForm.extendedEndTime}
                    onChange={e => setExtendForm({ ...extendForm, extendedEndTime: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px', backgroundColor: '#FFFFFF' }}
                  >
                    {TIME_OPTIONS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Extension Date</label>
                <input
                  type="date"
                  required
                  value={extendForm.extensionDate}
                  onChange={e => setExtendForm({ ...extendForm, extensionDate: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Reason (Required)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Month-end audits, high volume loan processing"
                  value={extendForm.reason}
                  onChange={e => setExtendForm({ ...extendForm, reason: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowExtendModal(false)}
                  style={{
                    padding: '9px 16px', borderRadius: '8px', border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: '13.5px'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '9px 20px', borderRadius: '8px', border: 'none',
                    backgroundColor: '#10B981', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer', fontSize: '13.5px',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                  }}
                >
                  {submitting ? 'Applying...' : 'Grant Extension'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: STATUS CHANGE CONFIRMATION ================= */}
      {showStatusConfirmModal && statusConfirmData.user && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '440px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', padding: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                backgroundColor: statusConfirmData.targetStatus === 'active' ? '#DCFCE7' : '#FEE2E2',
                color: statusConfirmData.targetStatus === 'active' ? '#16A34A' : '#DC2626',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Power size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
                  {statusConfirmData.targetStatus === 'active' ? 'Activate Account?' : 'Deactivate Account?'}
                </h3>
                <div style={{ fontSize: '12px', color: '#64748B' }}>
                  {statusConfirmData.user.user} ({statusConfirmData.user.displayUserId})
                </div>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, marginBottom: '16px' }}>
              {statusConfirmData.targetStatus === 'active'
                ? `Are you sure you want to activate access for ${statusConfirmData.user.user}? The account will immediately regain system access within configured working hours.`
                : `Are you sure you want to deactivate ${statusConfirmData.user.user}? The account will immediately be blocked from logging into the system.`
              }
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Reason (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Leave of absence, role change, reactivation requested"
                value={statusConfirmData.reason}
                onChange={e => setStatusConfirmData({ ...statusConfirmData, reason: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowStatusConfirmModal(false)}
                style={{
                  padding: '9px 16px', borderRadius: '8px', border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: '13px'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusToggle}
                disabled={submitting}
                style={{
                  padding: '9px 18px', borderRadius: '8px', border: 'none',
                  backgroundColor: statusConfirmData.targetStatus === 'active' ? '#16A34A' : '#DC2626',
                  color: '#FFFFFF', fontWeight: 700, cursor: 'pointer', fontSize: '13px',
                  boxShadow: statusConfirmData.targetStatus === 'active' ? '0 4px 12px rgba(22, 163, 74, 0.25)' : '0 4px 12px rgba(220, 38, 38, 0.25)'
                }}
              >
                {submitting ? 'Updating...' : (statusConfirmData.targetStatus === 'active' ? 'Confirm Activate' : 'Confirm Deactivate')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: MANAGE ALL USERS (ACTIVE / INACTIVE STATUS) ================= */}
      {showManageUsersModal && (() => {
        const totalStaff = users.length;
        const activeStaff = users.filter(u => u.accountStatus === 'active' || u.status === 'Active').length;
        const inactiveStaff = users.filter(u => u.accountStatus === 'inactive' || u.status === 'Inactive').length;
        const totalEmployees = users.filter(u => String(u.role).toUpperCase() === 'EMPLOYEE').length;
        const totalAdmins = users.filter(u => String(u.role).toUpperCase() === 'ADMIN').length;

        // Filtered users for table
        const filteredModalUsers = users.filter(u => {
          const q = manageUsersSearch.toLowerCase().trim();
          const matchesSearch = !q ||
            (u.displayUserId && u.displayUserId.toLowerCase().includes(q)) ||
            (u.user && u.user.toLowerCase().includes(q)) ||
            (u.email && u.email.toLowerCase().includes(q)) ||
            (u.employeeId && u.employeeId.toLowerCase().includes(q));

          const roleUpper = String(u.role || '').toUpperCase();
          const matchesRole = manageUsersRoleFilter === 'ALL' || roleUpper === manageUsersRoleFilter;

          const isUserActive = u.accountStatus === 'active' || u.status === 'Active';
          const matchesStatus = manageUsersStatusFilter === 'ALL' ||
            (manageUsersStatusFilter === 'ACTIVE' && isUserActive) ||
            (manageUsersStatusFilter === 'INACTIVE' && !isUserActive);

          return matchesSearch && matchesRole && matchesStatus;
        });

        // Current target label and count based on selected scope
        let targetLabel = 'All Employees & Admins';
        let targetCount = totalEmployees + totalAdmins;
        if (manageUsersBulkScope === 'EMPLOYEES') {
          targetLabel = 'All Employees';
          targetCount = totalEmployees;
        } else if (manageUsersBulkScope === 'ADMINS') {
          targetLabel = 'All Admins';
          targetCount = totalAdmins;
        } else if (manageUsersBulkScope === 'SELECTED') {
          targetLabel = `${manageUsersSelectedIds.length} Selected Accounts`;
          targetCount = manageUsersSelectedIds.length;
        }

        const isAllSelected = filteredModalUsers.length > 0 &&
          filteredModalUsers.every(u => manageUsersSelectedIds.includes(u.id));

        const toggleSelectAll = () => {
          if (isAllSelected) {
            setManageUsersSelectedIds([]);
          } else {
            setManageUsersSelectedIds(filteredModalUsers.map(u => u.id));
          }
        };

        const toggleSelectUser = (id) => {
          if (manageUsersSelectedIds.includes(id)) {
            setManageUsersSelectedIds(manageUsersSelectedIds.filter(x => x !== id));
          } else {
            setManageUsersSelectedIds([...manageUsersSelectedIds, id]);
          }
        };

        return (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
          }}>
            <div style={{
              backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '880px',
              maxHeight: '92vh', display: 'flex', flexDirection: 'column',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)', overflow: 'hidden'
            }}>
              {/* Modal Header */}
              <div style={{
                padding: '20px 26px', borderBottom: '1px solid #E2E8F0', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '12px',
                    backgroundColor: '#EDE9FE', color: '#7C3AED',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Users size={22} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                      Manage All Users (Account Status)
                    </h3>
                    <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}>
                      Make employee and admin accounts inactive or active in bulk or individually
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowManageUsersModal(false)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', color: '#64748B',
                    padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center'
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Scrollable Body */}
              <div style={{ padding: '22px 26px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* Metric Summary Cards */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                  gap: '12px'
                }}>
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Total Staff</div>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: '#4F46E5', marginTop: '2px' }}>{totalStaff}</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>{totalEmployees} Emp · {totalAdmins} Admin</div>
                  </div>
                  <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ fontSize: '11px', color: '#15803D', fontWeight: 700, textTransform: 'uppercase' }}>Active Accounts</div>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: '#16A34A', marginTop: '2px' }}>{activeStaff}</div>
                    <div style={{ fontSize: '11px', color: '#16A34A' }}>Authorized & working</div>
                  </div>
                  <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ fontSize: '11px', color: '#B91C1C', fontWeight: 700, textTransform: 'uppercase' }}>Inactive Accounts</div>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: '#DC2626', marginTop: '2px' }}>{inactiveStaff}</div>
                    <div style={{ fontSize: '11px', color: '#DC2626' }}>Deactivated access</div>
                  </div>
                  <div style={{ background: '#FAF5FF', border: '1px solid #E9D5FF', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ fontSize: '11px', color: '#7E22CE', fontWeight: 700, textTransform: 'uppercase' }}>Selected</div>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: '#7C3AED', marginTop: '2px' }}>{manageUsersSelectedIds.length}</div>
                    <div style={{ fontSize: '11px', color: '#7C3AED' }}>Checked for batch</div>
                  </div>
                </div>

                {/* Bulk Status Control Card */}
                <div style={{
                  background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '14px',
                  padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '14px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Power size={17} style={{ color: '#7C3AED' }} />
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#1E293B' }}>
                        Bulk Status Action (All Employees & Admins)
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>
                      Affects <strong>{targetCount}</strong> account{targetCount === 1 ? '' : 's'}
                    </div>
                  </div>

                  {/* Target Scope Selection */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {[
                      { key: 'ALL', label: 'All Employees & Admins', count: totalEmployees + totalAdmins },
                      { key: 'EMPLOYEES', label: 'All Employees', count: totalEmployees },
                      { key: 'ADMINS', label: 'All Admins', count: totalAdmins },
                      ...(manageUsersSelectedIds.length > 0 ? [{ key: 'SELECTED', label: `Selected (${manageUsersSelectedIds.length})`, count: manageUsersSelectedIds.length }] : [])
                    ].map(scopeItem => (
                      <button
                        key={scopeItem.key}
                        type="button"
                        onClick={() => setManageUsersBulkScope(scopeItem.key)}
                        style={{
                          padding: '6px 14px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700,
                          border: manageUsersBulkScope === scopeItem.key ? '1.5px solid #7C3AED' : '1px solid #CBD5E1',
                          backgroundColor: manageUsersBulkScope === scopeItem.key ? '#EDE9FE' : '#FFFFFF',
                          color: manageUsersBulkScope === scopeItem.key ? '#6D28D9' : '#475569',
                          cursor: 'pointer', transition: 'all 0.15s'
                        }}
                      >
                        {scopeItem.label} ({scopeItem.count})
                      </button>
                    ))}
                  </div>

                  {/* Optional Reason Input */}
                  <div>
                    <input
                      type="text"
                      placeholder="Optional reason: e.g. Weekend shutdown, Staff reactivation, System maintenance..."
                      value={manageUsersReason}
                      onChange={e => setManageUsersReason(e.target.value)}
                      style={{
                        width: '100%', padding: '8px 12px', borderRadius: '8px',
                        border: '1px solid #CBD5E1', fontSize: '12.5px', boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Bulk Action Buttons or Confirmation Alert */}
                  {manageUsersConfirmAction ? (
                    <div style={{
                      padding: '14px', borderRadius: '10px',
                      backgroundColor: manageUsersConfirmAction.action === 'ACTIVATE' ? '#F0FDF4' : '#FEF2F2',
                      border: `1.5px solid ${manageUsersConfirmAction.action === 'ACTIVATE' ? '#86EFAC' : '#FCA5A5'}`,
                      display: 'flex', flexDirection: 'column', gap: '10px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertCircle size={18} style={{ color: manageUsersConfirmAction.action === 'ACTIVATE' ? '#16A34A' : '#DC2626' }} />
                        <span style={{ fontSize: '13px', fontWeight: 800, color: manageUsersConfirmAction.action === 'ACTIVATE' ? '#15803D' : '#991B1B' }}>
                          Are you sure you want to {manageUsersConfirmAction.action === 'ACTIVATE' ? 'ACTIVATE' : 'DEACTIVATE'} {targetLabel}?
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#475569' }}>
                        {manageUsersConfirmAction.action === 'ACTIVATE'
                          ? `This will immediately mark ${targetCount} account(s) as ACTIVE and permit system access during operating hours.`
                          : `This will immediately mark ${targetCount} account(s) as INACTIVE and revoke active sessions (Super Admin accounts are safely protected).`
                        }
                      </div>
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => setManageUsersConfirmAction(null)}
                          disabled={submitting}
                          style={{
                            padding: '6px 14px', borderRadius: '8px', border: '1px solid #CBD5E1',
                            backgroundColor: '#FFFFFF', color: '#475569', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExecuteBulkStatusUpdate(
                            manageUsersConfirmAction.action,
                            manageUsersBulkScope,
                            manageUsersBulkScope === 'SELECTED' ? manageUsersSelectedIds : []
                          )}
                          disabled={submitting}
                          style={{
                            padding: '6px 16px', borderRadius: '8px', border: 'none',
                            backgroundColor: manageUsersConfirmAction.action === 'ACTIVATE' ? '#16A34A' : '#DC2626',
                            color: '#FFFFFF', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer',
                            boxShadow: manageUsersConfirmAction.action === 'ACTIVATE' ? '0 4px 12px rgba(22, 163, 74, 0.25)' : '0 4px 12px rgba(220, 38, 38, 0.25)'
                          }}
                        >
                          {submitting ? 'Applying...' : `Yes, ${manageUsersConfirmAction.action === 'ACTIVATE' ? 'Activate All' : 'Deactivate All'}`}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setManageUsersConfirmAction({ action: 'ACTIVATE', scope: manageUsersBulkScope })}
                        disabled={submitting || targetCount === 0}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '7px',
                          padding: '9px 16px', borderRadius: '8px', border: 'none',
                          backgroundColor: '#16A34A', color: '#FFFFFF',
                          fontWeight: 700, fontSize: '13px', cursor: targetCount === 0 ? 'not-allowed' : 'pointer',
                          opacity: targetCount === 0 ? 0.6 : 1,
                          boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)'
                        }}
                      >
                        <CheckCircle2 size={16} />
                        <span>Make {targetLabel} Active</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setManageUsersConfirmAction({ action: 'DEACTIVATE', scope: manageUsersBulkScope })}
                        disabled={submitting || targetCount === 0}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '7px',
                          padding: '9px 16px', borderRadius: '8px', border: 'none',
                          backgroundColor: '#DC2626', color: '#FFFFFF',
                          fontWeight: 700, fontSize: '13px', cursor: targetCount === 0 ? 'not-allowed' : 'pointer',
                          opacity: targetCount === 0 ? 0.6 : 1,
                          boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)'
                        }}
                      >
                        <Power size={16} />
                        <span>Make {targetLabel} Inactive</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Filter and Search Bar for User List */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '360px' }}>
                    <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    <input
                      type="text"
                      placeholder="Search name, email, employee ID..."
                      value={manageUsersSearch}
                      onChange={e => setManageUsersSearch(e.target.value)}
                      style={{
                        width: '100%', padding: '8px 12px 8px 32px', borderRadius: '8px',
                        border: '1px solid #CBD5E1', fontSize: '12.5px', boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Role Filter */}
                    <div style={{ display: 'flex', gap: '4px', backgroundColor: '#F1F5F9', padding: '3px', borderRadius: '8px' }}>
                      {['ALL', 'EMPLOYEE', 'ADMIN'].map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setManageUsersRoleFilter(r)}
                          style={{
                            padding: '4px 10px', borderRadius: '6px', border: 'none', fontSize: '11.5px', fontWeight: 700,
                            backgroundColor: manageUsersRoleFilter === r ? '#FFFFFF' : 'transparent',
                            color: manageUsersRoleFilter === r ? '#1E293B' : '#64748B',
                            boxShadow: manageUsersRoleFilter === r ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                            cursor: 'pointer'
                          }}
                        >
                          {r === 'ALL' ? 'All Roles' : r}
                        </button>
                      ))}
                    </div>

                    {/* Status Filter */}
                    <div style={{ display: 'flex', gap: '4px', backgroundColor: '#F1F5F9', padding: '3px', borderRadius: '8px' }}>
                      {['ALL', 'ACTIVE', 'INACTIVE'].map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setManageUsersStatusFilter(s)}
                          style={{
                            padding: '4px 10px', borderRadius: '6px', border: 'none', fontSize: '11.5px', fontWeight: 700,
                            backgroundColor: manageUsersStatusFilter === s ? '#FFFFFF' : 'transparent',
                            color: manageUsersStatusFilter === s ? '#1E293B' : '#64748B',
                            boxShadow: manageUsersStatusFilter === s ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                            cursor: 'pointer'
                          }}
                        >
                          {s === 'ALL' ? 'All' : s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Individual Staff Table */}
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{
                    display: 'grid', gridTemplateColumns: '40px 1.8fr 1.1fr 1fr 1.1fr 1.2fr',
                    backgroundColor: '#F8FAFC', padding: '10px 14px', borderBottom: '1px solid #E2E8F0',
                    fontSize: '11.5px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase'
                  }}>
                    <div>
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                        style={{ cursor: 'pointer' }}
                        title="Select all shown accounts"
                      />
                    </div>
                    <div>Staff Member</div>
                    <div>Employee ID</div>
                    <div>Role</div>
                    <div>Status</div>
                    <div style={{ textAlign: 'right' }}>Action</div>
                  </div>

                  <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                    {filteredModalUsers.length === 0 ? (
                      <div style={{ padding: '32px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                        No accounts match your current filters.
                      </div>
                    ) : (
                      filteredModalUsers.map(u => {
                        const isUserActive = u.accountStatus === 'active' || u.status === 'Active';
                        const isSelected = manageUsersSelectedIds.includes(u.id);
                        const isSuperAdmin = String(u.role).toUpperCase() === 'SUPER_ADMIN';

                        return (
                          <div
                            key={u.id}
                            style={{
                              display: 'grid', gridTemplateColumns: '40px 1.8fr 1.1fr 1fr 1.1fr 1.2fr',
                              padding: '11px 14px', borderBottom: '1px solid #F1F5F9', alignItems: 'center',
                              fontSize: '12.5px', backgroundColor: isSelected ? '#FAF5FF' : '#FFFFFF',
                              transition: 'background 0.15s'
                            }}
                          >
                            <div>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectUser(u.id)}
                                style={{ cursor: 'pointer' }}
                              />
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: '#0F172A' }}>{u.user}</div>
                              <div style={{ fontSize: '11px', color: '#64748B' }}>{u.email}</div>
                            </div>
                            <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#475569', fontSize: '11.5px' }}>
                              {u.displayUserId || u.employeeId || '-'}
                            </div>
                            <div>
                              <span style={{
                                padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                                backgroundColor: String(u.role).toUpperCase() === 'ADMIN' ? '#E0E7FF' : String(u.role).toUpperCase() === 'EMPLOYEE' ? '#DCFCE7' : '#F1F5F9',
                                color: String(u.role).toUpperCase() === 'ADMIN' ? '#4338CA' : String(u.role).toUpperCase() === 'EMPLOYEE' ? '#15803D' : '#475569'
                              }}>
                                {u.role || 'STAFF'}
                              </span>
                            </div>
                            <div>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                padding: '3px 9px', borderRadius: '6px', fontSize: '11px', fontWeight: 800,
                                backgroundColor: isUserActive ? '#DCFCE7' : '#FEE2E2',
                                color: isUserActive ? '#15803D' : '#B91C1C'
                              }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isUserActive ? '#16A34A' : '#DC2626' }} />
                                {isUserActive ? 'ACTIVE' : 'INACTIVE'}
                              </span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              {isSuperAdmin ? (
                                <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>Protected</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleQuickToggleUserInModal(u)}
                                  disabled={submitting}
                                  style={{
                                    padding: '5px 12px', borderRadius: '7px', fontSize: '11.5px', fontWeight: 700,
                                    border: isUserActive ? '1px solid #FCA5A5' : '1px solid #86EFAC',
                                    backgroundColor: isUserActive ? '#FEF2F2' : '#F0FDF4',
                                    color: isUserActive ? '#DC2626' : '#16A34A',
                                    cursor: 'pointer', transition: 'all 0.15s'
                                  }}
                                  title={isUserActive ? 'Click to make inactive' : 'Click to make active'}
                                >
                                  {isUserActive ? 'Deactivate' : 'Activate'}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '16px 26px', borderTop: '1px solid #E2E8F0', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC'
              }}>
                <div style={{ fontSize: '12px', color: '#64748B' }}>
                  Showing <strong>{filteredModalUsers.length}</strong> of <strong>{totalStaff}</strong> accounts
                </div>
                <button
                  type="button"
                  onClick={() => setShowManageUsersModal(false)}
                  style={{
                    padding: '8px 20px', borderRadius: '8px', border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF', color: '#334155', fontWeight: 700, fontSize: '13px', cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
