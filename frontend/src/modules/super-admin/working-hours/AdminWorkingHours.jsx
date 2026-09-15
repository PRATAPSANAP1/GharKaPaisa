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
  Power
} from 'lucide-react';
import {
  fetchWorkingHoursConfig,
  updateWorkingHours,
  extendWorkingHours,
  fetchExtensionHistory
} from '../../../services/workingHours.api';

export default function AdminWorkingHours() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [defaultConfig, setDefaultConfig] = useState({
    start_time: '09:30 AM',
    end_time: '08:00 PM',
    is_enabled: true
  });
  const [extensionsToday, setExtensionsToday] = useState([]);
  const [historyList, setHistoryList] = useState([]);
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'history'
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');

  // Modal States
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Extend Modal Form
  const [extendForm, setExtendForm] = useState({
    applyTo: 'SPECIFIC', // 'SPECIFIC' or 'ALL'
    userId: '',
    extensionDate: new Date().toISOString().split('T')[0],
    extendedEndTime: '09:00 PM',
    reason: ''
  });

  // Edit Working Hours Modal Form
  const [editForm, setEditForm] = useState({
    userId: null,
    userLabel: '',
    designation: '',
    startTime: '09:30 AM',
    endTime: '08:00 PM',
    isEnabled: true,
    isGlobal: false
  });

  // Feedback Toast
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
      }
    } catch (err) {
      showToast(err.message || 'Failed to load working hours settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await fetchExtensionHistory();
      if (res.success) {
        setHistoryList(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load extension history:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  // Open Edit Modal for a specific user or global
  const handleOpenEdit = (userItem = null) => {
    if (userItem) {
      setEditForm({
        userId: userItem.id,
        userLabel: userItem.user,
        designation: userItem.designation,
        startTime: userItem.startTime || '09:30 AM',
        endTime: userItem.endTime || '08:00 PM',
        isEnabled: userItem.isEnabled,
        isGlobal: false
      });
    } else {
      setEditForm({
        userId: null,
        userLabel: 'All Restricted Users (Global Default)',
        designation: '',
        startTime: defaultConfig.start_time || '09:30 AM',
        endTime: defaultConfig.end_time || '08:00 PM',
        isEnabled: defaultConfig.is_enabled,
        isGlobal: true
      });
    }
    setShowEditModal(true);
  };

  // Submit Working Hours Edit
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
        showToast(res.message || 'Working hours updated successfully!');
        setShowEditModal(false);
        loadData();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update working hours', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Extension Form
  const handleSaveExtension = async (e) => {
    e.preventDefault();
    if (extendForm.applyTo === 'SPECIFIC' && !extendForm.userId) {
      return showToast('Please select a target user', 'error');
    }
    if (!extendForm.extendedEndTime) {
      return showToast('Please select extended end time', 'error');
    }

    setSubmitting(true);
    try {
      const payload = {
        applyTo: extendForm.applyTo,
        userId: extendForm.applyTo === 'SPECIFIC' ? extendForm.userId : null,
        extensionDate: extendForm.extensionDate,
        extendedEndTime: extendForm.extendedEndTime,
        reason: extendForm.reason
      };

      const res = await extendWorkingHours(payload);
      if (res.success) {
        showToast(res.message || 'Working hours extended successfully!');
        setShowExtendModal(false);
        setExtendForm({
          applyTo: 'SPECIFIC',
          userId: '',
          extensionDate: new Date().toISOString().split('T')[0],
          extendedEndTime: '09:00 PM',
          reason: ''
        });
        loadData();
      }
    } catch (err) {
      showToast(err.message || 'Failed to create extension', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered User List
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.designation && u.designation.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.bank && u.bank.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole =
      selectedRole === 'ALL' || u.role.toUpperCase() === selectedRole.toUpperCase();

    return matchesSearch && matchesRole;
  });

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: toast.type === 'error' ? '#FEF2F2' : '#F0FDF4',
            color: toast.type === 'error' ? '#991B1B' : '#166534',
            border: `1px solid ${toast.type === 'error' ? '#FCA5A5' : '#86EFAC'}`,
            padding: '14px 20px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontWeight: 600,
            animation: 'fadeIn 0.2s ease-in'
          }}
        >
          {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Section */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span
              style={{
                backgroundColor: '#EEF2FF',
                color: '#4F46E5',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              Super Admin Security Control
            </span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            Admin Working Hours Management
          </h1>
          <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px', margin: 0 }}>
            Enforce operational login windows, configure bank/designation access hours, and issue date-specific extensions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => handleOpenEdit(null)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              backgroundColor: '#F1F5F9',
              color: '#334155',
              border: '1px solid #CBD5E1',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Clock size={16} />
            <span>Configure Global Base</span>
          </button>

          <button
            onClick={() => {
              setExtendForm({
                applyTo: 'SPECIFIC',
                userId: '',
                extensionDate: new Date().toISOString().split('T')[0],
                extendedEndTime: '09:00 PM',
                reason: ''
              });
              setShowExtendModal(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: '#4F46E5',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
              transition: 'all 0.15s ease'
            }}
          >
            <PlusCircle size={18} />
            <span>Extend Working Hours</span>
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          marginBottom: '28px'
        }}
      >
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: '#64748B', fontSize: '13px', fontWeight: 600 }}>Standard Working Hours</span>
            <div style={{ backgroundColor: '#EEF2FF', padding: '8px', borderRadius: '10px', color: '#4F46E5' }}>
              <Clock size={20} />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>
            {defaultConfig.start_time || '09:30 AM'} - {defaultConfig.end_time || '08:00 PM'}
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>Asia/Kolkata (IST Timezone)</div>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: '#64748B', fontSize: '13px', fontWeight: 600 }}>Backend Restriction Engine</span>
            <div style={{ backgroundColor: defaultConfig.is_enabled ? '#ECFDF5' : '#FEF2F2', padding: '8px', borderRadius: '10px', color: defaultConfig.is_enabled ? '#059669' : '#DC2626' }}>
              <ShieldAlert size={20} />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: defaultConfig.is_enabled ? '#059669' : '#DC2626' }}>
            {defaultConfig.is_enabled ? 'Enforced & Active' : 'Disabled Globally'}
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>Enforced BEFORE password login</div>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: '#64748B', fontSize: '13px', fontWeight: 600 }}>Active Extensions Today</span>
            <div style={{ backgroundColor: '#FFFBEB', padding: '8px', borderRadius: '10px', color: '#D97706' }}>
              <Zap size={20} />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#D97706' }}>
            {extensionsToday.length} Active Extension{extensionsToday.length !== 1 ? 's' : ''}
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>Date-specific override permissions</div>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: '#64748B', fontSize: '13px', fontWeight: 600 }}>Restricted Admin Roles</span>
            <div style={{ backgroundColor: '#F0F9FF', padding: '8px', borderRadius: '10px', color: '#0284C7' }}>
              <Users size={20} />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>
            {users.length} Administrative Staff
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>Super Admin exempt by default</div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px 16px 0 0',
          padding: '16px 24px',
          border: '1px solid #E2E8F0',
          borderBottom: 'none'
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('list')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'list' ? '#EEF2FF' : 'transparent',
              color: activeTab === 'list' ? '#4F46E5' : '#64748B',
              transition: 'all 0.15s ease'
            }}
          >
            <Users size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            Restricted Admins & Staff ({filteredUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'history' ? '#EEF2FF' : 'transparent',
              color: activeTab === 'history' ? '#4F46E5' : '#64748B',
              transition: 'all 0.15s ease'
            }}
          >
            <History size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            Extension Audit History
          </button>
        </div>

        {activeTab === 'list' && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search user, designation, bank..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '8px 12px 8px 36px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13px',
                  width: '240px',
                  outline: 'none'
                }}
              />
            </div>

            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '13px',
                color: '#334155',
                outline: 'none',
                backgroundColor: '#FFFFFF'
              }}
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="EMPLOYEE">Employee / Staff</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '0 0 16px 16px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden'
        }}
      >
        {activeTab === 'list' ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>User</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Designation</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bank Assignment</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Start Time</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>End Time</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
                      Loading administrative working hours...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
                      No matching restricted admin users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u, idx) => {
                    const isExtended = u.effectiveEndTime !== u.endTime;
                    return (
                      <tr
                        key={u.id}
                        style={{
                          borderBottom: idx === filteredUsers.length - 1 ? 'none' : '1px solid #F1F5F9',
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        {/* User */}
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '14px' }}>{u.user}</div>
                          <div style={{ color: '#64748B', fontSize: '12px' }}>{u.email}</div>
                        </td>

                        {/* Designation */}
                        <td style={{ padding: '16px 20px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '4px 10px',
                              backgroundColor: '#F8FAFC',
                              border: '1px solid #E2E8F0',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              color: '#334155'
                            }}
                          >
                            {u.designation}
                          </span>
                        </td>

                        {/* Bank */}
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155', fontSize: '13px', fontWeight: 500 }}>
                            <Building size={15} style={{ color: '#64748B' }} />
                            <span>{u.bank}</span>
                          </div>
                        </td>

                        {/* Start Time */}
                        <td style={{ padding: '16px 20px', fontWeight: 700, color: '#0F172A', fontSize: '14px' }}>
                          {u.startTime}
                        </td>

                        {/* End Time */}
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, color: isExtended ? '#D97706' : '#0F172A', fontSize: '14px' }}>
                              {u.effectiveEndTime}
                            </span>
                            {isExtended && (
                              <span
                                style={{
                                  backgroundColor: '#FEF3C7',
                                  color: '#B45309',
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  textTransform: 'uppercase'
                                }}
                              >
                                Extended
                              </span>
                            )}
                          </div>
                          {isExtended && (
                            <div style={{ fontSize: '11px', color: '#92400E', marginTop: '2px' }}>
                              Base: {u.endTime}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '16px 20px' }}>
                          {u.isExempt ? (
                            <span style={{ padding: '4px 10px', backgroundColor: '#F1F5F9', color: '#475569', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
                              Exempt (Super Admin)
                            </span>
                          ) : u.isEnabled ? (
                            <span style={{ padding: '4px 10px', backgroundColor: '#ECFDF5', color: '#047857', borderRadius: '20px', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }}></span>
                              Active
                            </span>
                          ) : (
                            <span style={{ padding: '4px 10px', backgroundColor: '#FEF2F2', color: '#B91C1C', borderRadius: '20px', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#EF4444' }}></span>
                              Disabled
                            </span>
                          )}
                        </td>

                        {/* Action */}
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleOpenEdit(u)}
                            style={{
                              padding: '6px 14px',
                              backgroundColor: '#F8FAFC',
                              border: '1px solid #CBD5E1',
                              borderRadius: '8px',
                              color: '#334155',
                              fontWeight: 600,
                              fontSize: '13px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <Edit2 size={14} />
                            <span>Edit</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Extension Audit History Tab */
          <div style={{ padding: '20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#475569' }}>Target Scope / User</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#475569' }}>Extension Date</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#475569' }}>Original End</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#475569' }}>Extended End</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#475569' }}>Reason</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#475569' }}>Granted By</th>
                </tr>
              </thead>
              <tbody>
                {historyList.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#64748B' }}>
                      No working hour extension logs found.
                    </td>
                  </tr>
                ) : (
                  historyList.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0F172A' }}>
                        {item.apply_to === 'ALL' ? (
                          <span style={{ color: '#4F46E5', fontWeight: 800 }}>🌐 All Restricted Users</span>
                        ) : (
                          item.target_user_name || item.target_user_email || 'Specific Admin User'
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#334155' }}>
                        {new Date(item.extension_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#64748B' }}>{item.original_end_time}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 800, color: '#D97706' }}>{item.extended_end_time}</td>
                      <td style={{ padding: '14px 16px', color: '#334155', fontSize: '13px' }}>{item.reason}</td>
                      <td style={{ padding: '14px 16px', color: '#64748B', fontSize: '12px' }}>{item.created_by_name || item.created_by_email || 'Super Admin'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= EXTEND WORKING HOURS MODAL ================= */}
      {showExtendModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '520px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#F8FAFC'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '8px', backgroundColor: '#EEF2FF', borderRadius: '10px', color: '#4F46E5' }}>
                  <Zap size={20} />
                </div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                  Extend Working Hours
                </h3>
              </div>
              <button
                onClick={() => setShowExtendModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveExtension} style={{ padding: '24px' }}>
              {/* Apply To Radio Buttons */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                  Apply To:
                </label>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, color: '#0F172A' }}>
                    <input
                      type="radio"
                      name="applyTo"
                      value="SPECIFIC"
                      checked={extendForm.applyTo === 'SPECIFIC'}
                      onChange={() => setExtendForm({ ...extendForm, applyTo: 'SPECIFIC' })}
                    />
                    Specific User
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, color: '#0F172A' }}>
                    <input
                      type="radio"
                      name="applyTo"
                      value="ALL"
                      checked={extendForm.applyTo === 'ALL'}
                      onChange={() => setExtendForm({ ...extendForm, applyTo: 'ALL', userId: '' })}
                    />
                    All Users
                  </label>
                </div>
              </div>

              {/* User Selector if Specific User */}
              {extendForm.applyTo === 'SPECIFIC' && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Select User <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={extendForm.userId}
                    onChange={(e) => setExtendForm({ ...extendForm, userId: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '14px',
                      backgroundColor: '#FFFFFF',
                      outline: 'none'
                    }}
                  >
                    <option value="">-- Select Admin / Staff User --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.user} ({u.designation} - {u.bank})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Extension Date */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Extension Date <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="date"
                  value={extendForm.extensionDate}
                  onChange={(e) => setExtendForm({ ...extendForm, extensionDate: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* New End Time */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  New End Time <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select
                  value={extendForm.extendedEndTime}
                  onChange={(e) => setExtendForm({ ...extendForm, extendedEndTime: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '14px',
                    backgroundColor: '#FFFFFF',
                    outline: 'none'
                  }}
                >
                  <option value="08:30 PM">08:30 PM</option>
                  <option value="09:00 PM">09:00 PM</option>
                  <option value="09:30 PM">09:30 PM</option>
                  <option value="10:00 PM">10:00 PM</option>
                  <option value="10:30 PM">10:30 PM</option>
                  <option value="11:00 PM">11:00 PM</option>
                  <option value="11:59 PM">11:59 PM</option>
                </select>
              </div>

              {/* Reason */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Reason for Extension
                </label>
                <input
                  type="text"
                  placeholder="e.g. Month-end application processing"
                  value={extendForm.reason}
                  onChange={(e) => setExtendForm({ ...extendForm, reason: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowExtendModal(false)}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: '#F1F5F9',
                    color: '#475569',
                    border: '1px solid #CBD5E1',
                    borderRadius: '10px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '10px 22px',
                    backgroundColor: '#4F46E5',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 700,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)'
                  }}
                >
                  {submitting
                    ? 'Saving...'
                    : extendForm.applyTo === 'ALL'
                    ? 'Extend For All'
                    : 'Save Extension'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT BASE WORKING HOURS MODAL ================= */}
      {showEditModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '480px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#F8FAFC'
              }}
            >
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                {editForm.isGlobal ? 'Global Working Hours Configuration' : `Edit Working Hours: ${editForm.userLabel}`}
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveWorkingHours} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Start Time
                </label>
                <input
                  type="text"
                  placeholder="e.g. 09:30 AM"
                  value={editForm.startTime}
                  onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  End Time
                </label>
                <input
                  type="text"
                  placeholder="e.g. 08:00 PM"
                  value={editForm.endTime}
                  onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 600, color: '#0F172A' }}>
                  <input
                    type="checkbox"
                    checked={editForm.isEnabled}
                    onChange={(e) => setEditForm({ ...editForm, isEnabled: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: '#4F46E5' }}
                  />
                  <span>Enable Working Hours Restriction</span>
                </label>
                <p style={{ margin: '4px 0 0 28px', fontSize: '12px', color: '#64748B' }}>
                  When unchecked, users will be allowed to log in 24/7 without restriction.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: '#F1F5F9',
                    color: '#475569',
                    border: '1px solid #CBD5E1',
                    borderRadius: '10px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '10px 22px',
                    backgroundColor: '#4F46E5',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 700,
                    cursor: submitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
