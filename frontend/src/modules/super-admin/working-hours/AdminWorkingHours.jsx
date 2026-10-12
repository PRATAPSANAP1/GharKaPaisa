import React, { useState, useEffect } from 'react';
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
  UserPlus
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

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' }
];

const DEFAULT_SCHEDULE = {
  monday:    { is_working: true,  start_time: '09:30 AM', end_time: '08:00 PM' },
  tuesday:   { is_working: true,  start_time: '09:30 AM', end_time: '08:00 PM' },
  wednesday: { is_working: true,  start_time: '09:30 AM', end_time: '08:00 PM' },
  thursday:  { is_working: true,  start_time: '09:30 AM', end_time: '08:00 PM' },
  friday:    { is_working: true,  start_time: '09:30 AM', end_time: '08:00 PM' },
  saturday:  { is_working: true,  start_time: '09:30 AM', end_time: '08:00 PM' },
  sunday:    { is_working: false, start_time: '09:30 AM', end_time: '08:00 PM' }
};

function SearchableUserSelect({
  users = [],
  selectedUserIds = [],
  onChange,
  placeholder = "Search by staff name, employee ID, email...",
  multi = true,
  label = "Select Staff Users"
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filtered = users.filter(u => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      (u.user && u.user.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.employeeId && u.employeeId.toLowerCase().includes(q)) ||
      (u.designation && u.designation.toLowerCase().includes(q))
    );
  });

  const selectedList = users.filter(u => selectedUserIds.includes(u.id));

  const toggleUser = (userId) => {
    if (!multi) {
      onChange([userId]);
      setIsOpen(false);
      return;
    }
    if (selectedUserIds.includes(userId)) {
      onChange(selectedUserIds.filter(id => id !== userId));
    } else {
      onChange([...selectedUserIds, userId]);
    }
  };

  const handleSelectAll = () => {
    const allFilteredIds = filtered.map(u => u.id);
    const combined = Array.from(new Set([...selectedUserIds, ...allFilteredIds]));
    onChange(combined);
  };

  const handleDeselectAll = () => {
    const filteredIdSet = new Set(filtered.map(u => u.id));
    onChange(selectedUserIds.filter(id => !filteredIdSet.has(id)));
  };

  return (
    <div style={{ position: 'relative', marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
        {label} {multi && `(${selectedUserIds.length} selected)`}
      </label>

      {/* Selected tags */}
      {selectedList.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px', maxHeight: '110px', overflowY: 'auto' }}>
          {selectedList.map(u => (
            <span key={u.id} style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '3px 8px', borderRadius: '6px', backgroundColor: '#EEF2FF',
              color: '#4F46E5', fontSize: '12px', fontWeight: 600, border: '1px solid #C7D2FE'
            }}>
              <span>{u.user}</span>
              {u.employeeId && <span style={{ fontSize: '10px', color: '#6366F1' }}>({u.employeeId})</span>}
              <button
                type="button"
                onClick={() => toggleUser(u.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4F46E5', padding: 0, display: 'flex', alignItems: 'center' }}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div style={{ position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
          style={{
            width: '100%', padding: '10px 14px 10px 36px', borderRadius: '8px',
            border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none', boxSizing: 'border-box'
          }}
        />
        {selectedUserIds.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B8', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Dropdown Options */}
      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
          backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)', zIndex: 100, maxHeight: '220px',
          overflowY: 'auto'
        }}>
          {multi && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '1px solid #F1F5F9', backgroundColor: '#F8FAFC', fontSize: '12px' }}>
              <button type="button" onClick={handleSelectAll} style={{ background: 'none', border: 'none', color: '#4F46E5', fontWeight: 700, cursor: 'pointer' }}>
                Select All ({filtered.length})
              </button>
              <button type="button" onClick={handleDeselectAll} style={{ background: 'none', border: 'none', color: '#64748B', fontWeight: 600, cursor: 'pointer' }}>
                Deselect All
              </button>
              <button type="button" onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#0F172A', fontWeight: 700, cursor: 'pointer' }}>
                Done ✕
              </button>
            </div>
          )}

          {filtered.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
              No staff found matching "{query}"
            </div>
          ) : (
            filtered.map(u => {
              const isSelected = selectedUserIds.includes(u.id);
              return (
                <div
                  key={u.id}
                  onClick={() => toggleUser(u.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', borderBottom: '1px solid #F8FAFC', cursor: 'pointer',
                    backgroundColor: isSelected ? '#EEF2FF' : '#FFFFFF'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      style={{ cursor: 'pointer' }}
                    />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                        {u.user} {u.employeeId && <span style={{ color: '#4F46E5', fontSize: '11px', fontWeight: 600 }}>({u.employeeId})</span>}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                        {u.designation} • {u.role} {u.email && `• ${u.email}`}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check size={16} color="#4F46E5" />}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
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
  const [defaultConfig, setDefaultConfig] = useState({ start_time: '09:30 AM', end_time: '08:00 PM', is_enabled: true });
  const [extensionsToday, setExtensionsToday] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [distinctDesignations, setDistinctDesignations] = useState([]);
  const [distinctRoles, setDistinctRoles] = useState(['ADMIN', 'EMPLOYEE', 'HR', 'SUPER_ADMIN']);
  const [historyList, setHistoryList] = useState([]);

  // Active Tab: 'policies' | 'holidays' | 'list' | 'history'
  const [activeTab, setActiveTab] = useState('policies');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');

  // Modals
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Policy Form State
  const [policyForm, setPolicyForm] = useState({
    id: null,
    name: 'Standard Working Hours',
    scopeType: 'GLOBAL', // GLOBAL, ROLE, DESIGNATION, USER
    roles: [],
    designations: [],
    userId: '',
    isEnabled: true,
    scheduleConfig: JSON.parse(JSON.stringify(DEFAULT_SCHEDULE))
  });

  // Holiday Form State
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

  // Extend Modal Form
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
    extendedStartTime: '09:30 AM',
    extendedEndTime: '09:00 PM',
    reason: ''
  });

  // Legacy Edit Working Hours Modal Form
  const [editForm, setEditForm] = useState({
    userId: null,
    userLabel: '',
    designation: '',
    startTime: '09:30 AM',
    endTime: '08:00 PM',
    isEnabled: true,
    isGlobal: false
  });

  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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
        if (res.data.defaultConfig) setDefaultConfig(res.data.defaultConfig);
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

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (activeTab === 'history') loadHistory();
  }, [activeTab]);

  // Policy modal handlers
  const handleOpenNewPolicy = () => {
    setPolicyForm({
      id: null,
      name: 'Custom Operating Schedule',
      scopeType: 'GLOBAL',
      roles: [],
      designations: [],
      userId: '',
      isEnabled: true,
      scheduleConfig: JSON.parse(JSON.stringify(DEFAULT_SCHEDULE))
    });
    setShowPolicyModal(true);
  };

  const handleEditPolicy = (p) => {
    setPolicyForm({
      id: p.id,
      name: p.name || 'Working Hours Policy',
      scopeType: p.scope_type || 'GLOBAL',
      roles: p.roles || [],
      designations: p.designations || [],
      userId: p.user_id || '',
      isEnabled: p.is_enabled !== false,
      scheduleConfig: p.schedule_config || JSON.parse(JSON.stringify(DEFAULT_SCHEDULE))
    });
    setShowPolicyModal(true);
  };

  const handleSavePolicySubmit = async (e) => {
    e.preventDefault();
    if (policyForm.scopeType === 'USER' && !policyForm.userId && (!policyForm.userIds || policyForm.userIds.length === 0)) {
      showToast('Please select a staff user for the policy', 'error');
      return;
    }
    if (policyForm.scopeType === 'DESIGNATION' && (!policyForm.designations || policyForm.designations.length === 0)) {
      showToast('Please select at least one target designation', 'error');
      return;
    }
    if (policyForm.scopeType === 'ROLE' && (!policyForm.roles || policyForm.roles.length === 0)) {
      showToast('Please select at least one target role', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const selectedUserId = policyForm.userId || (policyForm.userIds?.[0] || null);
      const res = await savePolicy({
        ...policyForm,
        userId: selectedUserId,
        userIds: policyForm.userIds || (selectedUserId ? [selectedUserId] : [])
      });
      if (res.success) {
        showToast('Weekly Schedule Policy saved successfully');
        setShowPolicyModal(false);
        loadData();
      } else {
        showToast(res.message || 'Failed to save policy', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Server error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePolicyClick = async (id) => {
    if (!window.confirm('Are you sure you want to delete this policy schedule?')) return;
    try {
      const res = await deletePolicy(id);
      if (res.success) {
        showToast('Policy schedule deleted successfully');
        loadData();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete policy', 'error');
    }
  };

  // Holiday modal handlers
  const handleOpenNewHoliday = () => {
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
  };

  const handleEditHoliday = (h) => {
    setHolidayForm({
      id: h.id,
      holidayName: h.holiday_name,
      holidayDate: h.holiday_date ? h.holiday_date.split('T')[0] : new Date().toISOString().split('T')[0],
      scopeType: h.scope_type || 'GLOBAL',
      roles: h.roles || [],
      designations: h.designations || [],
      userId: h.user_id || '',
      reason: h.reason || '',
      isActive: h.is_active !== false
    });
    setShowHolidayModal(true);
  };

  const handleSaveHolidaySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await saveHoliday(holidayForm);
      if (res.success) {
        showToast('Holiday saved successfully');
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

  // Extension Modal Submit
  const handleCreateExtension = async (e) => {
    e.preventDefault();
    if (!extendForm.reason?.trim()) {
      showToast('Please provide a reason for the extension', 'error');
      return;
    }
    if (extendForm.applyTo === 'SPECIFIC' && (!extendForm.userIds || extendForm.userIds.length === 0) && !extendForm.userId) {
      showToast('Please select at least one staff user', 'error');
      return;
    }
    if (extendForm.applyTo === 'DESIGNATION' && (!extendForm.designations || extendForm.designations.length === 0)) {
      showToast('Please select at least one target designation', 'error');
      return;
    }
    if (extendForm.applyTo === 'ROLE' && (!extendForm.roles || extendForm.roles.length === 0)) {
      showToast('Please select at least one target role', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const selectedUserIds = extendForm.userIds && extendForm.userIds.length > 0 
        ? extendForm.userIds 
        : (extendForm.userId ? [extendForm.userId] : []);

      const payload = {
        applyTo: extendForm.applyTo,
        userId: selectedUserIds[0] || null,
        userIds: selectedUserIds,
        roles: extendForm.roles || [],
        designations: extendForm.designations || [],
        extensionDate: extendForm.dateMode === 'SINGLE' ? extendForm.extensionDate : null,
        startDate: extendForm.dateMode === 'RANGE' ? extendForm.startDate : null,
        endDate: extendForm.dateMode === 'RANGE' ? extendForm.endDate : null,
        extendedStartTime: extendForm.extendedStartTime || '09:30 AM',
        extendedEndTime: extendForm.extendedEndTime || '09:00 PM',
        reason: extendForm.reason.trim()
      };
      const res = await extendWorkingHours(payload);
      if (res.success) {
        showToast(res.message || 'Working hours extended successfully');
        setShowExtendModal(false);
        loadData();
        loadHistory();
      } else {
        showToast(res.message || 'Failed to create extension', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Failed to extend working hours', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeExtension = async (id) => {
    if (!window.confirm('Are you sure you want to revoke this working hours extension?')) return;
    try {
      const res = await revokeExtension(id);
      if (res.success) {
        showToast('Extension revoked successfully');
        loadData();
        loadHistory();
      } else {
        showToast(res.message || 'Failed to revoke extension', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Failed to revoke extension', 'error');
    }
  };

  // Legacy Edit Submit
  const handleSaveWorkingHours = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        userId: editForm.isGlobal ? null : editForm.userId,
        designation: editForm.isGlobal ? null : editForm.designation,
        startTime: editForm.startTime,
        endTime: editForm.endTime,
        isEnabled: editForm.isEnabled,
        isGlobal: editForm.isGlobal
      };
      const res = await updateWorkingHours(payload);
      if (res.success) {
        showToast(res.message || 'Working hours updated successfully');
        setShowEditModal(false);
        loadData();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update working hours', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Multi-select toggle helpers
  const toggleRole = (formState, setFormState, role) => {
    const current = formState.roles || [];
    const updated = current.includes(role) ? (Array.isArray(current) ? current : []).filter(r => r !== role) : [...current, role];
    setFormState({ ...formState, roles: updated });
  };

  const toggleDesignation = (formState, setFormState, desig) => {
    const current = formState.designations || [];
    const updated = current.includes(desig) ? (Array.isArray(current) ? current : []).filter(d => d !== desig) : [...current, desig];
    setFormState({ ...formState, designations: updated });
  };

  // Filtered Users
  const filteredUsers = (Array.isArray(users) ? users : []).filter(u => {
    const matchesSearch =
      u.user?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'ALL' || u.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div style={{ padding: isMobile ? '12px' : '24px', backgroundColor: '#F8FAFC', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 10000,
          backgroundColor: toast.type === 'error' ? '#FEF2F2' : '#F0FDF4',
          border: `1px solid ${toast.type === 'error' ? '#FCA5A5' : '#86EFAC'}`,
          color: toast.type === 'error' ? '#991B1B' : '#166534',
          padding: '12px 20px', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600
        }}>
          {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock style={{ color: '#4F46E5' }} size={isMobile ? 24 : 28} />
            Working Hours & Holiday Schedule
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#64748B', fontSize: isMobile ? '12.5px' : '14px' }}>
            Day-wise schedules, holiday calendars, multi-role policies, and operational extensions.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
          <button
            onClick={handleOpenNewPolicy}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: isMobile ? '8px 12px' : '10px 18px',
              backgroundColor: '#4F46E5', color: '#FFFFFF', border: 'none', borderRadius: '10px',
              fontWeight: 700, cursor: 'pointer', fontSize: isMobile ? '12px' : '13.5px', flex: isMobile ? '1 1 140px' : 'none',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)'
            }}
          >
            <PlusCircle size={16} />
            <span>Add Policy</span>
          </button>
          <button
            onClick={handleOpenNewHoliday}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: isMobile ? '8px 12px' : '10px 18px',
              backgroundColor: '#0284C7', color: '#FFFFFF', border: 'none', borderRadius: '8px',
              fontWeight: 700, cursor: 'pointer', fontSize: isMobile ? '12px' : '13.5px', flex: isMobile ? '1 1 120px' : 'none',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
            }}
          >
            <Calendar size={16} />
            <span>Add Holiday</span>
          </button>
          <button
            onClick={() => setShowExtendModal(true)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: isMobile ? '8px 12px' : '10px 18px',
              backgroundColor: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '8px',
              fontWeight: 700, cursor: 'pointer', fontSize: isMobile ? '12px' : '13.5px', flex: isMobile ? '1 1 100%' : 'none',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
            }}
          >
            <Zap size={16} />
            <span>Extend Working Hours</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: isMobile ? '10px' : '14px',
        marginBottom: '20px'
      }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px' }}>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Active Policies</div>
          <div style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 900, color: '#4F46E5', marginTop: '4px' }}>{policies.length}</div>
          <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>Weekly shift schedules</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px' }}>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Holiday Rules</div>
          <div style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 900, color: '#0284C7', marginTop: '4px' }}>{holidays.length}</div>
          <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>Configured calendar days</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px' }}>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Monitored Staff</div>
          <div style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 900, color: '#10B981', marginTop: '4px' }}>{users.length}</div>
          <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>Active employees & admins</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px' }}>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Extensions Today</div>
          <div style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 900, color: '#D97706', marginTop: '4px' }}>{extensionsToday.length}</div>
          <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>Active shift overrides</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '2px solid #E2E8F0',
        marginBottom: '20px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: '4px'
      }}>
        {[
          { id: 'policies', label: 'Weekly Policies', icon: Clock, count: policies.length },
          { id: 'holidays', label: 'Holidays', icon: Calendar, count: holidays.length },
          { id: 'list', label: 'Staff & Status', icon: Users, count: users.length },
          { id: 'history', label: 'History', icon: History, count: historyList.length }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: isMobile ? '10px 12px' : '12px 18px',
                border: 'none', background: 'none', borderBottom: isActive ? '3px solid #4F46E5' : '3px solid transparent',
                color: isActive ? '#4F46E5' : '#64748B', fontWeight: isActive ? 800 : 600,
                cursor: 'pointer', fontSize: isMobile ? '13px' : '14.5px', whiteSpace: 'nowrap', flexShrink: 0
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              <span style={{
                backgroundColor: isActive ? '#EEF2FF' : '#F1F5F9',
                color: isActive ? '#4F46E5' : '#64748B',
                fontSize: '11px', padding: '1px 6px', borderRadius: '10px', fontWeight: 800
              }}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
          Loading working hours data...
        </div>
      )}

      {/* TAB 1: WEEKLY SCHEDULES & POLICIES */}
      {!loading && activeTab === 'policies' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
            {policies.map(p => (
              <div key={p.id} style={{
                backgroundColor: '#FFFFFF', borderRadius: '8px', padding: '20px',
                border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <span style={{
                      display: 'inline-block', fontSize: '11px', fontWeight: 800, padding: '3px 8px',
                      borderRadius: '6px', textTransform: 'uppercase', marginBottom: '6px',
                      backgroundColor: p.scope_type === 'GLOBAL' ? '#EEF2FF' : p.scope_type === 'USER' ? '#FEF3C7' : '#F0FDF4',
                      color: p.scope_type === 'GLOBAL' ? '#4F46E5' : p.scope_type === 'USER' ? '#D97706' : '#166534'
                    }}>
                      Scope: {p.scope_type}
                    </span>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>{p.name}</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => handleEditPolicy(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4F46E5' }}>
                      <Edit2 size={18} />
                    </button>
                    {p.scope_type !== 'GLOBAL' && (
                      <button onClick={() => handleDeletePolicyClick(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}>
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Targeting details */}
                <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '14px' }}>
                  {p.scope_type === 'ROLE' && (
                    <div><strong>Roles:</strong> {p.roles?.join(', ') || 'All Roles'}</div>
                  )}
                  {p.scope_type === 'DESIGNATION' && (
                    <div><strong>Designations:</strong> {p.designations?.join(', ') || 'All Designations'}</div>
                  )}
                  {p.scope_type === 'USER' && (
                    <div><strong>User:</strong> {p.user_name || p.user_email || p.user_id}</div>
                  )}
                  {p.scope_type === 'GLOBAL' && (
                    <div>Applies to all administrative accounts by default.</div>
                  )}
                </div>

                {/* Day-wise Schedule Table Preview */}
                <div style={{ backgroundColor: '#F8FAFC', borderRadius: '10px', padding: '10px 12px' }}>
                  {DAYS_OF_WEEK.map(d => {
                    const dayItem = p.schedule_config?.[d.key] || { is_working: true, start_time: '09:30 AM', end_time: '08:00 PM' };
                    return (
                      <div key={d.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '3px 0' }}>
                        <span style={{ fontWeight: 600, color: '#334155' }}>{d.label}:</span>
                        {dayItem.is_working ? (
                          <span style={{ color: '#059669', fontWeight: 600 }}>{dayItem.start_time} - {dayItem.end_time}</span>
                        ) : (
                          <span style={{ color: '#EF4444', fontWeight: 700 }}>Non-Working</span>
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

      {/* TAB 2: HOLIDAY MANAGEMENT */}
      {!loading && activeTab === 'holidays' && (
        <div>
          {isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {holidays.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#94A3B8', background: '#FFFFFF', borderRadius: '8px' }}>
                  No holiday rules configured yet.
                </div>
              ) : (
                holidays.map(h => (
                  <div key={h.id} style={{ background: '#FFFFFF', borderRadius: '8px', padding: '14px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '14px', color: '#0F172A' }}>{h.holiday_name}</div>
                        <div style={{ fontSize: '12px', color: '#4F46E5', fontWeight: 700, marginTop: '2px' }}>📅 {h.holiday_date ? h.holiday_date.split('T')[0] : ''}</div>
                      </div>
                      <span style={{
                        fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '8px',
                        backgroundColor: h.is_active ? '#DCFCE7' : '#FEE2E2',
                        color: h.is_active ? '#15803D' : '#B91C1C'
                      }}>
                        {h.is_active ? '● Active' : '● Inactive'}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Scope: <strong>{h.scope_type}</strong></span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleEditHoliday(h)} style={{ padding: '6px 10px', background: '#EEF2FF', color: '#4F46E5', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>
                          Edit
                        </button>
                        <button onClick={() => handleDeleteHolidayClick(h.id)} style={{ padding: '6px 10px', background: '#FEF2F2', color: '#EF4444', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '0px', border: '1px solid #E2E8F0', overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                    <th style={{ padding: '14px 20px', fontWeight: 700 }}>Holiday Name</th>
                    <th style={{ padding: '14px 20px', fontWeight: 700 }}>Date</th>
                    <th style={{ padding: '14px 20px', fontWeight: 700 }}>Scope</th>
                    <th style={{ padding: '14px 20px', fontWeight: 700 }}>Targeting</th>
                    <th style={{ padding: '14px 20px', fontWeight: 700 }}>Status</th>
                    <th style={{ padding: '14px 20px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {holidays.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
                        No holiday rules configured yet. Click <strong>Add Holiday</strong> above to create one.
                      </td>
                    </tr>
                  ) : (
                    holidays.map(h => (
                      <tr key={h.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '14px 20px', fontWeight: 700, color: '#0F172A' }}>{h.holiday_name}</td>
                        <td style={{ padding: '14px 20px', color: '#334155' }}>{h.holiday_date ? h.holiday_date.split('T')[0] : ''}</td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{
                            fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px',
                            backgroundColor: h.scope_type === 'GLOBAL' ? '#EEF2FF' : '#F0FDF4',
                            color: h.scope_type === 'GLOBAL' ? '#4F46E5' : '#166534'
                          }}>
                            {h.scope_type}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px', color: '#64748B', fontSize: '13px' }}>
                          {h.scope_type === 'ROLE' && (h.roles?.join(', ') || 'All Roles')}
                          {h.scope_type === 'DESIGNATION' && (h.designations?.join(', ') || 'All Designations')}
                          {h.scope_type === 'USER' && (h.user_name || h.user_email)}
                          {h.scope_type === 'GLOBAL' && 'All Staff (Global)'}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{
                            fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '12px',
                            backgroundColor: h.is_active ? '#DCFCE7' : '#FEE2E2',
                            color: h.is_active ? '#15803D' : '#B91C1C'
                          }}>
                            {h.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <button onClick={() => handleEditHoliday(h)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4F46E5', marginRight: '12px' }}>
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDeleteHolidayClick(h.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}>
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
        </div>
      )}

      {/* TAB 3: RESTRICTED STAFF LIST */}
      {!loading && activeTab === 'list' && (
        <div>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search staff by name, email, designation, or ID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px 10px 42px', borderRadius: '10px',
                  border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none'
                }}
              />
            </div>
            <select
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value)}
              style={{
                padding: '10px 16px', borderRadius: '10px', border: '1px solid #CBD5E1',
                fontSize: '14px', backgroundColor: '#FFFFFF', outline: 'none', width: isMobile ? '100%' : 'auto'
              }}
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">ADMIN</option>
              <option value="EMPLOYEE">EMPLOYEE</option>
              <option value="HR">HR</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            </select>
          </div>

          {isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredUsers.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#94A3B8', background: '#FFFFFF', borderRadius: '8px' }}>
                  No staff records matching filter.
                </div>
              ) : (
                filteredUsers.map(u => (
                  <div key={u.id} style={{ background: '#FFFFFF', borderRadius: '8px', padding: '14px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '14px', color: '#0F172A' }}>{u.user}</div>
                        <div style={{ fontSize: '12px', color: '#64748B' }}>{u.designation || 'Staff'} • <span style={{ fontWeight: 700 }}>{u.role}</span></div>
                      </div>
                      {u.isExempt ? (
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#2563EB', backgroundColor: '#EFF6FF', padding: '3px 8px', borderRadius: '8px' }}>
                          Exempt (24/7)
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', fontWeight: 800, color: u.isEnabled ? '#166534' : '#991B1B', backgroundColor: u.isEnabled ? '#DCFCE7' : '#FEE2E2', padding: '3px 8px', borderRadius: '8px' }}>
                          {u.status}
                        </span>
                      )}
                    </div>

                    <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '10px', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ color: '#64748B', display: 'block', fontSize: '11px' }}>Base Shift:</span>
                        <strong style={{ color: '#334155' }}>{u.startTime} - {u.endTime}</strong>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ color: '#64748B', display: 'block', fontSize: '11px' }}>Effective Today:</span>
                        <strong style={{ color: u.effectiveEndTime !== u.endTime ? '#059669' : '#0F172A' }}>{u.effectiveEndTime}</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button onClick={() => {
                        setExtendForm({ ...extendForm, applyTo: 'SPECIFIC', userId: u.id });
                        setShowExtendModal(true);
                      }} style={{ padding: '8px 14px', backgroundColor: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '12px', width: '100%' }}>
                        ⚡ Extend Today's Hours
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '0px', border: '1px solid #E2E8F0', overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                    <th style={{ padding: '14px 20px', fontWeight: 700 }}>Staff User</th>
                    <th style={{ padding: '14px 20px', fontWeight: 700 }}>Designation & Role</th>
                    <th style={{ padding: '14px 20px', fontWeight: 700 }}>Base Hours</th>
                    <th style={{ padding: '14px 20px', fontWeight: 700 }}>Effective End Time Today</th>
                    <th style={{ padding: '14px 20px', fontWeight: 700 }}>Status</th>
                    <th style={{ padding: '14px 20px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>{u.user}</div>
                        <div style={{ fontSize: '12px', color: '#64748B' }}>{u.email}</div>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ fontWeight: 600, color: '#334155' }}>{u.designation}</div>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: '#F1F5F9', color: '#475569' }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', fontWeight: 600, color: '#334155' }}>
                        {u.startTime} - {u.endTime}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontWeight: 700, color: u.effectiveEndTime !== u.endTime ? '#059669' : '#0F172A' }}>
                          {u.effectiveEndTime}
                        </span>
                        {u.activeExtension && (
                          <span style={{ fontSize: '11px', marginLeft: '6px', color: '#059669', fontWeight: 700 }}>
                            (Extended)
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        {u.isExempt ? (
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#2563EB', backgroundColor: '#EFF6FF', padding: '4px 10px', borderRadius: '12px' }}>
                            Exempt (24/7)
                          </span>
                        ) : (
                          <span style={{ fontSize: '12px', fontWeight: 700, color: u.isEnabled ? '#166534' : '#991B1B', backgroundColor: u.isEnabled ? '#DCFCE7' : '#FEE2E2', padding: '4px 10px', borderRadius: '12px' }}>
                            {u.status}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <button onClick={() => {
                          setExtendForm({ ...extendForm, applyTo: 'SPECIFIC', userId: u.id });
                          setShowExtendModal(true);
                        }} style={{ padding: '6px 12px', backgroundColor: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                          Extend Today
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: EXTENSION HISTORY */}
      {!loading && activeTab === 'history' && (
        <div>
          {isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {historyList.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#94A3B8', background: '#FFFFFF', borderRadius: '8px' }}>
                  No past extensions recorded.
                </div>
              ) : (
                historyList.map(h => (
                  <div key={h.id} style={{ background: '#FFFFFF', borderRadius: '8px', padding: '14px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '14px', color: '#0F172A' }}>
                          {h.apply_to === 'ALL' ? 'All Staff' : (h.target_user_name || h.target_user_email || h.apply_to)}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748B' }}>
                          📅 {h.start_date && h.end_date ? `${h.start_date.split('T')[0]} to ${h.end_date.split('T')[0]}` : (h.extension_date ? h.extension_date.split('T')[0] : 'Single Day')}
                        </div>
                      </div>
                      <span style={{
                        fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px',
                        backgroundColor: h.is_revoked ? '#F1F5F9' : '#DCFCE7',
                        color: h.is_revoked ? '#64748B' : '#15803D'
                      }}>
                        {h.is_revoked ? 'Revoked' : 'Active'}
                      </span>
                    </div>

                    <div style={{ background: '#F8FAFC', borderRadius: '6px', padding: '8px 10px', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Extended Shift:</span>
                      <strong style={{ color: '#059669' }}>{h.extended_start_time || '09:30 AM'} - {h.extended_end_time}</strong>
                    </div>

                    <div style={{ fontSize: '12px', color: '#475569' }}>Reason: {h.reason || 'N/A'}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#94A3B8' }}>By {h.created_by_name || h.created_by_email || 'Super Admin'}</span>
                      {!h.is_revoked && (
                        <button
                          onClick={() => handleRevokeExtension(h.id)}
                          style={{ padding: '4px 8px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '0px', border: '1px solid #E2E8F0', overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                    <th style={{ padding: '14px 20px', fontWeight: 700 }}>Date / Range</th>
                    <th style={{ padding: '14px 20px', fontWeight: 700 }}>Applied To</th>
                    <th style={{ padding: '14px 20px', fontWeight: 700 }}>Extended Hours</th>
                    <th style={{ padding: '14px 20px', fontWeight: 700 }}>Reason</th>
                    <th style={{ padding: '14px 20px', fontWeight: 700 }}>Granted By</th>
                    <th style={{ padding: '14px 20px', fontWeight: 700 }}>Status</th>
                    <th style={{ padding: '14px 20px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {historyList.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#94A3B8' }}>
                        No past working hour extensions found.
                      </td>
                    </tr>
                  ) : (
                    historyList.map(h => (
                      <tr key={h.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '14px 20px', fontWeight: 600 }}>
                          {h.start_date && h.end_date ? `${h.start_date.split('T')[0]} to ${h.end_date.split('T')[0]}` : (h.extension_date ? h.extension_date.split('T')[0] : 'Today')}
                        </td>
                        <td style={{ padding: '14px 20px', fontWeight: 700, color: '#0F172A' }}>
                          {h.apply_to === 'ALL' ? 'All Staff' : (h.target_user_name || h.target_user_email || h.apply_to)}
                        </td>
                        <td style={{ padding: '14px 20px', fontWeight: 700, color: '#059669' }}>
                          {h.extended_start_time || '09:30 AM'} - {h.extended_end_time}
                        </td>
                        <td style={{ padding: '14px 20px', color: '#475569' }}>{h.reason || 'N/A'}</td>
                        <td style={{ padding: '14px 20px', color: '#64748B' }}>{h.created_by_name || h.created_by_email || 'Super Admin'}</td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{
                            fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px',
                            backgroundColor: h.is_revoked ? '#F1F5F9' : '#DCFCE7',
                            color: h.is_revoked ? '#64748B' : '#15803D'
                          }}>
                            {h.is_revoked ? 'Revoked' : 'Active'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          {!h.is_revoked ? (
                            <button
                              onClick={() => handleRevokeExtension(h.id)}
                              style={{ padding: '6px 12px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}
                            >
                              Revoke
                            </button>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#94A3B8' }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL 1: ADD/EDIT POLICY MODAL ================= */}
      {showPolicyModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '640px',
            maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex',
              justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                {policyForm.id ? 'Edit Day Schedule Policy' : 'Create Day Schedule Policy'}
              </h3>
              <button onClick={() => setShowPolicyModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePolicySubmit} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Policy Name</label>
                <input
                  type="text"
                  required
                  value={policyForm.name}
                  onChange={e => setPolicyForm({ ...policyForm, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '14px' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Apply Schedule To (Scope)</label>
                <select
                  value={policyForm.scopeType}
                  onChange={e => setPolicyForm({ ...policyForm, scopeType: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '14px', backgroundColor: '#FFFFFF' }}
                >
                  <option value="GLOBAL">Global (Default for all staff)</option>
                  <option value="ROLE">Specific Role(s)</option>
                  <option value="DESIGNATION">Specific Designation(s)</option>
                  <option value="USER">Specific User Account</option>
                </select>
              </div>

              {/* Multi-role picker */}
              {policyForm.scopeType === 'ROLE' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Select Roles (Multiple)</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {distinctRoles.map(r => {
                      const selected = policyForm.roles?.includes(r);
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => toggleRole(policyForm, setPolicyForm, r)}
                          style={{
                            padding: '6px 12px', borderRadius: '8px', border: '1px solid',
                            borderColor: selected ? '#4F46E5' : '#CBD5E1',
                            backgroundColor: selected ? '#EEF2FF' : '#FFFFFF',
                            color: selected ? '#4F46E5' : '#475569', fontWeight: 700, cursor: 'pointer', fontSize: '13px'
                          }}
                        >
                          {r} {selected && '✓'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Multi-designation picker */}
              {policyForm.scopeType === 'DESIGNATION' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Select Designations (Multiple)</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {distinctDesignations.map(d => {
                      const selected = policyForm.designations?.includes(d);
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => toggleDesignation(policyForm, setPolicyForm, d)}
                          style={{
                            padding: '6px 12px', borderRadius: '8px', border: '1px solid',
                            borderColor: selected ? '#4F46E5' : '#CBD5E1',
                            backgroundColor: selected ? '#EEF2FF' : '#FFFFFF',
                            color: selected ? '#4F46E5' : '#475569', fontWeight: 700, cursor: 'pointer', fontSize: '13px'
                          }}
                        >
                          {d} {selected && '✓'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* User search / select */}
              {policyForm.scopeType === 'USER' && (
                <SearchableUserSelect
                  users={users}
                  selectedUserIds={policyForm.userId ? [policyForm.userId] : (policyForm.userIds || [])}
                  onChange={(ids) => setPolicyForm({ ...policyForm, userId: ids[0] || '', userIds: ids })}
                  multi={false}
                  label="Target Staff User"
                  placeholder="Search staff by name, employee code, email..."
                />
              )}

              {/* Weekly Schedule Days (Monday - Sunday) */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>Day-Wise Operating Windows</h4>
                {DAYS_OF_WEEK.map(d => {
                  const dayData = policyForm.scheduleConfig?.[d.key] || { is_working: true, start_time: '09:30 AM', end_time: '08:00 PM' };
                  return (
                    <div key={d.key} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 12px', borderBottom: '1px solid #F1F5F9'
                    }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, width: '120px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={dayData.is_working !== false}
                          onChange={e => {
                            const updated = {
                              ...policyForm.scheduleConfig,
                              [d.key]: { ...dayData, is_working: e.target.checked }
                            };
                            setPolicyForm({ ...policyForm, scheduleConfig: updated });
                          }}
                        />
                        <span>{d.label}</span>
                      </label>

                      {dayData.is_working !== false ? (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            type="text"
                            value={dayData.start_time || '09:30 AM'}
                            onChange={e => {
                              const updated = {
                                ...policyForm.scheduleConfig,
                                [d.key]: { ...dayData, start_time: e.target.value }
                              };
                              setPolicyForm({ ...policyForm, scheduleConfig: updated });
                            }}
                            style={{ width: '90px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', textAlign: 'center' }}
                          />
                          <span style={{ fontSize: '12px', color: '#64748B' }}>to</span>
                          <input
                            type="text"
                            value={dayData.end_time || '08:00 PM'}
                            onChange={e => {
                              const updated = {
                                ...policyForm.scheduleConfig,
                                [d.key]: { ...dayData, end_time: e.target.value }
                              };
                              setPolicyForm({ ...policyForm, scheduleConfig: updated });
                            }}
                            style={{ width: '90px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', textAlign: 'center' }}
                          />
                        </div>
                      ) : (
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#EF4444' }}>Off / Non-Working</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowPolicyModal(false)} style={{ padding: '10px 18px', backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '10px', fontWeight: 600 }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '10px 22px', backgroundColor: '#4F46E5', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontWeight: 700 }}>
                  {submitting ? 'Saving...' : 'Save Policy Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: ADD/EDIT HOLIDAY MODAL ================= */}
      {showHolidayModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '520px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex',
              justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                {holidayForm.id ? 'Edit Holiday Rule' : 'Add Calendar Holiday'}
              </h3>
              <button onClick={() => setShowHolidayModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveHolidaySubmit} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Holiday Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Independence Day"
                  value={holidayForm.holidayName}
                  onChange={e => setHolidayForm({ ...holidayForm, holidayName: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '14px' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Holiday Date *</label>
                <input
                  type="date"
                  required
                  value={holidayForm.holidayDate}
                  onChange={e => setHolidayForm({ ...holidayForm, holidayDate: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '14px' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Apply Holiday To (Scope)</label>
                <select
                  value={holidayForm.scopeType}
                  onChange={e => setHolidayForm({ ...holidayForm, scopeType: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '14px', backgroundColor: '#FFFFFF' }}
                >
                  <option value="GLOBAL">Global (All Staff)</option>
                  <option value="ROLE">Specific Role(s)</option>
                  <option value="DESIGNATION">Specific Designation(s)</option>
                  <option value="USER">Specific User Account</option>
                </select>
              </div>

              {holidayForm.scopeType === 'ROLE' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Target Roles</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {distinctRoles.map(r => {
                      const selected = holidayForm.roles?.includes(r);
                      return (
                        <button key={r} type="button" onClick={() => toggleRole(holidayForm, setHolidayForm, r)} style={{
                          padding: '6px 12px', borderRadius: '8px', border: '1px solid',
                          borderColor: selected ? '#0284C7' : '#CBD5E1', backgroundColor: selected ? '#F0F9FF' : '#FFFFFF',
                          color: selected ? '#0284C7' : '#475569', fontWeight: 700, cursor: 'pointer', fontSize: '13px'
                        }}>
                          {r} {selected && '✓'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {holidayForm.scopeType === 'DESIGNATION' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Target Designations</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {distinctDesignations.map(d => {
                      const selected = holidayForm.designations?.includes(d);
                      return (
                        <button key={d} type="button" onClick={() => toggleDesignation(holidayForm, setHolidayForm, d)} style={{
                          padding: '6px 12px', borderRadius: '8px', border: '1px solid',
                          borderColor: selected ? '#0284C7' : '#CBD5E1', backgroundColor: selected ? '#F0F9FF' : '#FFFFFF',
                          color: selected ? '#0284C7' : '#475569', fontWeight: 700, cursor: 'pointer', fontSize: '13px'
                        }}>
                          {d} {selected && '✓'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {holidayForm.scopeType === 'USER' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Select User</label>
                  <select
                    value={holidayForm.userId}
                    onChange={e => setHolidayForm({ ...holidayForm, userId: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '14px', backgroundColor: '#FFFFFF' }}
                  >
                    <option value="">-- Select User Account --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.user} ({u.designation})</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Reason / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. National Holiday"
                  value={holidayForm.reason}
                  onChange={e => setHolidayForm({ ...holidayForm, reason: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '14px' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={holidayForm.isActive !== false}
                    onChange={e => setHolidayForm({ ...holidayForm, isActive: e.target.checked })}
                  />
                  <span>Active Holiday (Enforce Login Block)</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowHolidayModal(false)} style={{ padding: '10px 18px', backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '10px', fontWeight: 600 }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '10px 22px', backgroundColor: '#0284C7', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontWeight: 700 }}>
                  {submitting ? 'Saving...' : 'Save Holiday'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: EXTEND HOURS MODAL ================= */}
      {showExtendModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '8px', width: '100%', maxWidth: '560px',
            maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>Extend Working Hours</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748B' }}>Adjust start and end shift times for specific staff, roles, or all employees.</p>
              </div>
              <button onClick={() => setShowExtendModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateExtension} style={{ padding: '24px' }}>
              {/* Target Scope Selection */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Apply Extension To</label>
                <select
                  value={extendForm.applyTo}
                  onChange={e => setExtendForm({ ...extendForm, applyTo: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', backgroundColor: '#FFFFFF' }}
                >
                  <option value="SPECIFIC">Specific Staff User(s)</option>
                  <option value="DESIGNATION">Specific Designation(s)</option>
                  <option value="ROLE">Specific Role(s)</option>
                  <option value="COMBINED">Combined (Users + Roles + Designations)</option>
                  <option value="ALL">All Staff Users</option>
                </select>
              </div>

              {/* Searchable Multi-User Selector */}
              {(extendForm.applyTo === 'SPECIFIC' || extendForm.applyTo === 'COMBINED') && (
                <SearchableUserSelect
                  users={users}
                  selectedUserIds={extendForm.userIds || []}
                  onChange={(ids) => setExtendForm({ ...extendForm, userIds: ids, userId: ids[0] || '' })}
                  multi={true}
                  label="Target Staff Users"
                  placeholder="Search staff by name, employee code, email..."
                />
              )}

              {/* Multi-role selector */}
              {(extendForm.applyTo === 'ROLE' || extendForm.applyTo === 'COMBINED') && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Target Roles</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {distinctRoles.map(r => {
                      const selected = extendForm.roles?.includes(r);
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => toggleRole(extendForm, setExtendForm, r)}
                          style={{
                            padding: '6px 12px', borderRadius: '6px', border: '1px solid',
                            borderColor: selected ? '#10B981' : '#CBD5E1',
                            backgroundColor: selected ? '#ECFDF5' : '#FFFFFF',
                            color: selected ? '#047857' : '#475569', fontWeight: 700, cursor: 'pointer', fontSize: '12.5px'
                          }}
                        >
                          {r} {selected && '✓'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Multi-designation selector */}
              {(extendForm.applyTo === 'DESIGNATION' || extendForm.applyTo === 'COMBINED') && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Target Designations</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '130px', overflowY: 'auto' }}>
                    {distinctDesignations.map(d => {
                      const selected = extendForm.designations?.includes(d);
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => toggleDesignation(extendForm, setExtendForm, d)}
                          style={{
                            padding: '6px 12px', borderRadius: '6px', border: '1px solid',
                            borderColor: selected ? '#10B981' : '#CBD5E1',
                            backgroundColor: selected ? '#ECFDF5' : '#FFFFFF',
                            color: selected ? '#047857' : '#475569', fontWeight: 700, cursor: 'pointer', fontSize: '12.5px'
                          }}
                        >
                          {d} {selected && '✓'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Date Scope Mode */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>Extension Date</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setExtendForm({ ...extendForm, dateMode: 'SINGLE' })}
                      style={{
                        padding: '3px 8px', fontSize: '11px', fontWeight: 700, borderRadius: '4px', border: '1px solid',
                        borderColor: extendForm.dateMode === 'SINGLE' ? '#4F46E5' : '#CBD5E1',
                        backgroundColor: extendForm.dateMode === 'SINGLE' ? '#EEF2FF' : '#FFFFFF',
                        color: extendForm.dateMode === 'SINGLE' ? '#4F46E5' : '#64748B', cursor: 'pointer'
                      }}
                    >
                      Single Day
                    </button>
                    <button
                      type="button"
                      onClick={() => setExtendForm({ ...extendForm, dateMode: 'RANGE' })}
                      style={{
                        padding: '3px 8px', fontSize: '11px', fontWeight: 700, borderRadius: '4px', border: '1px solid',
                        borderColor: extendForm.dateMode === 'RANGE' ? '#4F46E5' : '#CBD5E1',
                        backgroundColor: extendForm.dateMode === 'RANGE' ? '#EEF2FF' : '#FFFFFF',
                        color: extendForm.dateMode === 'RANGE' ? '#4F46E5' : '#64748B', cursor: 'pointer'
                      }}
                    >
                      Date Range
                    </button>
                  </div>
                </div>

                {extendForm.dateMode === 'SINGLE' ? (
                  <div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                      <input
                        type="date"
                        value={extendForm.extensionDate}
                        onChange={e => setExtendForm({ ...extendForm, extensionDate: e.target.value })}
                        style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setExtendForm({ ...extendForm, extensionDate: new Date().toISOString().split('T')[0] })}
                        style={{ padding: '8px 12px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const tom = new Date(Date.now() + 86400000).toISOString().split('T')[0];
                          setExtendForm({ ...extendForm, extensionDate: tom });
                        }}
                        style={{ padding: '8px 12px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Tomorrow
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#64748B', marginBottom: '2px' }}>Start Date</label>
                      <input
                        type="date"
                        value={extendForm.startDate}
                        onChange={e => setExtendForm({ ...extendForm, startDate: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#64748B', marginBottom: '2px' }}>End Date</label>
                      <input
                        type="date"
                        value={extendForm.endDate}
                        onChange={e => setExtendForm({ ...extendForm, endDate: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* START TIME & END TIME MODIFICATION */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                {/* Start Time */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Extension Start Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 08:30 AM"
                    value={extendForm.extendedStartTime}
                    onChange={e => setExtendForm({ ...extendForm, extendedStartTime: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px', boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                    {['08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM'].map(st => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setExtendForm({ ...extendForm, extendedStartTime: st })}
                        style={{
                          padding: '2px 6px', fontSize: '10.5px', borderRadius: '4px', border: '1px solid #CBD5E1',
                          background: extendForm.extendedStartTime === st ? '#EEF2FF' : '#F8FAFC',
                          color: extendForm.extendedStartTime === st ? '#4F46E5' : '#475569',
                          cursor: 'pointer', fontWeight: 600
                        }}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* End Time */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Extension End Time *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 10:00 PM"
                    value={extendForm.extendedEndTime}
                    onChange={e => setExtendForm({ ...extendForm, extendedEndTime: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px', boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                    {[
                      { label: '+1h', val: '09:00 PM' },
                      { label: '+2h', val: '10:00 PM' },
                      { label: '+3h', val: '11:00 PM' },
                      { label: 'Midnight', val: '11:59 PM' }
                    ].map(preset => (
                      <button
                        key={preset.val}
                        type="button"
                        onClick={() => setExtendForm({ ...extendForm, extendedEndTime: preset.val })}
                        style={{
                          padding: '2px 6px', fontSize: '10.5px', borderRadius: '4px', border: '1px solid #CBD5E1',
                          background: extendForm.extendedEndTime === preset.val ? '#DCFCE7' : '#F8FAFC',
                          color: extendForm.extendedEndTime === preset.val ? '#15803D' : '#475569',
                          cursor: 'pointer', fontWeight: 600
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reason (Required) */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Reason for Extension *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Month-end financial audits, urgent leads clearance, special campaign shift"
                  value={extendForm.reason}
                  onChange={e => setExtendForm({ ...extendForm, reason: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px', boxSizing: 'border-box', outline: 'none', resize: 'vertical' }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowExtendModal(false)}
                  style={{ padding: '10px 18px', backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '10px 22px', backgroundColor: '#10B981', color: '#FFFFFF', border: 'none',
                    borderRadius: '8px', fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                  }}
                >
                  {submitting ? 'Saving...' : 'Save Extension'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
