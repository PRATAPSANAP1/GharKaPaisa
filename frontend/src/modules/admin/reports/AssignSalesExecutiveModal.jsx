import React, { useState, useEffect, useMemo } from 'react';
import api from '../../../services/api';
import { useAuthStore } from '../../../app/store/authStore';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  X,
  UserPlus,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield,
  Phone,
  Briefcase,
  FileText,
  UserCheck,
  ChevronRight
} from 'lucide-react';

export default function AssignSalesExecutiveModal({
  application,
  onClose,
  onSuccess
}) {
  const { C, isDark } = useTheme();
  const currentUser = useAuthStore((state) => state.user);

  const [executives, setExecutives] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExecId, setSelectedExecId] = useState(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Fetch list of assignable Administrative Sales Executives
  useEffect(() => {
    let isMounted = true;
    const fetchExecutives = async () => {
      try {
        setLoadingList(true);
        setListError('');
        let res;
        try {
          res = await api.get('/applications/assignable-employees', {
            params: { designation: 'sales_executive', limit: 100 }
          });
        } catch (firstErr) {
          if (firstErr?.response?.status === 404) {
            res = await api.get('/admin/assignable-employees', {
              params: { designation: 'sales_executive', limit: 100 }
            });
          } else {
            throw firstErr;
          }
        }

        const rawList = res?.data?.data || res?.data || [];
        const arr = Array.isArray(rawList) ? rawList : (rawList.rows || []);

        if (isMounted) {
          // Filter out current user from the assignable list
          const filtered = arr.filter(
            (e) => e.user_id !== currentUser?.id && e.id !== currentUser?.id
          );
          setExecutives(filtered);
        }
      } catch (err) {
        console.error('Failed to load assignable executives:', err);
        if (isMounted) {
          setListError(
            err?.response?.data?.message ||
              'Unable to load Administrative Sales Executives. Please try again.'
          );
        }
      } finally {
        if (isMounted) setLoadingList(false);
      }
    };

    fetchExecutives();
    return () => {
      isMounted = false;
    };
  }, [currentUser?.id]);

  // Filtered executives by search term
  const filteredExecutives = useMemo(() => {
    if (!searchTerm.trim()) return executives;
    const q = searchTerm.trim().toLowerCase();
    return executives.filter((e) => {
      const name = (e.full_name || '').toLowerCase();
      const code = (e.employee_id || '').toLowerCase();
      const phone = (e.mobile_number || '').toLowerCase();
      const desig = (e.designation || '').toLowerCase();
      return (
        name.includes(q) ||
        code.includes(q) ||
        phone.includes(q) ||
        desig.includes(q)
      );
    });
  }, [executives, searchTerm]);

  const selectedExec = useMemo(() => {
    return executives.find(
      (e) =>
        e.id === selectedExecId ||
        e.user_id === selectedExecId ||
        e.employee_id === selectedExecId
    );
  }, [executives, selectedExecId]);

  const handleAssign = async () => {
    if (!selectedExec) {
      setSubmitError('Please select a target Administrative Sales Executive.');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError('');

      const targetId =
        selectedExec.id || selectedExec.user_id || selectedExec.employee_id;
      const payload = {
        target_employee_id: targetId,
        target_user_id: selectedExec.user_id || null,
        notes: notes.trim()
      };

      const targetAppId = application?.id || application?.app_number;
      let res;
      try {
        res = await api.post(
          `/applications/${encodeURIComponent(targetAppId)}/assign-sales-executive`,
          payload
        );
      } catch (firstErr) {
        if (firstErr?.response?.status === 404) {
          res = await api.post(
            `/admin/applications/${encodeURIComponent(targetAppId)}/assign-sales-executive`,
            payload
          );
        } else {
          throw firstErr;
        }
      }

      if (res?.data?.success) {
        const assignedData = res.data?.data || {};
        if (typeof onSuccess === 'function') {
          onSuccess(assignedData);
        }
        alert(
          res.data?.message ||
            `Application successfully assigned to ${selectedExec.full_name} (${selectedExec.employee_id || 'EMP'})!`
        );
        onClose();
      } else {
        setSubmitError(res?.data?.message || 'Failed to assign application.');
      }
    } catch (err) {
      console.error('Error assigning application:', err);
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to assign application.';
      setSubmitError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(5px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          animation: 'modalSlideUp 0.22s ease-out'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 22px',
            borderBottom: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: isDark ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#8b5cf615',
                border: '1px solid #8b5cf640',
                color: '#8b5cf6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <UserPlus size={20} />
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: '16px',
                  fontWeight: 800,
                  color: C.text,
                  letterSpacing: '-0.01em'
                }}
              >
                Assign Application
              </h3>
              <p
                style={{
                  margin: '2px 0 0 0',
                  fontSize: '12px',
                  color: C.textLight
                }}
              >
                Transfer application to another Administrative Sales Executive
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              background: 'transparent',
              border: 'none',
              color: C.textLight,
              cursor: submitting ? 'not-allowed' : 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: '20px 22px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          {/* Target Application Summary Card */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f1f5f9',
              border: `1px solid ${C.border}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: '#8b5cf615',
                    color: '#8b5cf6',
                    border: '1px solid #8b5cf640'
                  }}
                >
                  #{application?.app_number || application?.id || '—'}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: C.text }}>
                  {application?.customer_name || 'Customer'}
                </span>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: C.textLight
                }}
              >
                🏦 {application?.bank_name || application?.bank_code || 'Bank'}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11.5px',
                color: C.textLight,
                marginTop: '4px'
              }}
            >
              <span>
                Current Claim:{' '}
                <strong
                  style={{
                    color: application?.sales_claimed_by ? '#16a34a' : '#f59e0b'
                  }}
                >
                  {application?.sales_claimed_by === currentUser?.id
                    ? 'Claimed by you'
                    : application?.sales_claimed_by_name || 'Unclaimed'}
                </strong>
              </span>
              {application?.product_name && (
                <span>Product: {application.product_name}</span>
              )}
            </div>
          </div>

          {/* Search Box */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12.5px',
                fontWeight: 700,
                color: C.text,
                marginBottom: '6px'
              }}
            >
              Select Target Administrative Sales Executive{' '}
              <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  color: C.textLight
                }}
              />
              <input
                type="text"
                placeholder="Search by name, employee code, or mobile number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  borderRadius: '10px',
                  border: `1px solid ${C.border}`,
                  background: C.card,
                  color: C.text,
                  fontSize: '12.5px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* List of Executives */}
          <div
            style={{
              maxHeight: '210px',
              overflowY: 'auto',
              borderRadius: '10px',
              border: `1px solid ${C.border}`,
              background: isDark ? 'rgba(0,0,0,0.1)' : '#fafafa',
              padding: '6px'
            }}
          >
            {loadingList ? (
              <div
                style={{
                  padding: '30px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  color: C.textLight
                }}
              >
                <Loader2
                  size={20}
                  style={{ animation: 'spin 1s linear infinite' }}
                />
                <span style={{ fontSize: '12px' }}>
                  Loading Administrative Sales Executives...
                </span>
              </div>
            ) : listError ? (
              <div
                style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: '#ef4444',
                  fontSize: '12px'
                }}
              >
                <AlertCircle size={18} style={{ marginBottom: '4px' }} />
                <div>{listError}</div>
              </div>
            ) : filteredExecutives.length === 0 ? (
              <div
                style={{
                  padding: '24px',
                  textAlign: 'center',
                  color: C.textLight,
                  fontSize: '12px'
                }}
              >
                {searchTerm
                  ? 'No Administrative Sales Executives matching your search.'
                  : 'No other active Administrative Sales Executives found in the system.'}
              </div>
            ) : (
              filteredExecutives.map((exec) => {
                const execIdentifier =
                  exec.id || exec.user_id || exec.employee_id;
                const isSelected = selectedExecId === execIdentifier;
                const initials = (exec.full_name || 'SE')
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                return (
                  <div
                    key={execIdentifier}
                    onClick={() => setSelectedExecId(execIdentifier)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: isSelected
                        ? '#8b5cf615'
                        : isDark
                        ? 'rgba(255,255,255,0.02)'
                        : '#ffffff',
                      border: isSelected
                        ? '1px solid #8b5cf680'
                        : `1px solid ${C.border}`,
                      marginBottom: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: isSelected ? '#8b5cf6' : C.bgSecondary,
                          color: isSelected ? '#ffffff' : C.text,
                          fontWeight: 800,
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `1px solid ${C.border}`
                        }}
                      >
                        {initials}
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: '12.5px',
                            fontWeight: 700,
                            color: C.text
                          }}
                        >
                          {exec.full_name}
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: C.textLight,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginTop: '1px'
                          }}
                        >
                          <span
                            style={{
                              background: '#3b82f615',
                              color: '#3b82f6',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              fontWeight: 700
                            }}
                          >
                            {exec.employee_id || 'EMP'}
                          </span>
                          {exec.mobile_number && (
                            <span>📱 {exec.mobile_number}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {isSelected ? (
                        <CheckCircle2 size={18} color="#8b5cf6" />
                      ) : (
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            border: `1.5px solid ${C.border}`
                          }}
                        />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Assignment Remarks / Handover Notes */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12.5px',
                fontWeight: 700,
                color: C.text,
                marginBottom: '6px'
              }}
            >
              Handover Remarks / Notes{' '}
              <span style={{ fontSize: '11px', color: C.textLight, fontWeight: 400 }}>
                (Optional)
              </span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Customer requested callback tomorrow; document verification pending..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '10px',
                border: `1px solid ${C.border}`,
                background: C.card,
                color: C.text,
                fontSize: '12px',
                fontFamily: 'inherit',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Submission Error Banner */}
          {submitError && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: '#ef444415',
                border: '1px solid #ef444440',
                color: '#ef4444',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <AlertCircle size={16} />
              <span>{submitError}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 22px',
            borderTop: `1px solid ${C.border}`,
            background: isDark ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'transparent',
              border: `1px solid ${C.border}`,
              color: C.text,
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: submitting ? 'not-allowed' : 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAssign}
            disabled={!selectedExec || submitting}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              background: !selectedExec || submitting ? '#94a3b8' : '#8b5cf6',
              border: 'none',
              color: '#ffffff',
              fontSize: '12.5px',
              fontWeight: 800,
              cursor: !selectedExec || submitting ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow:
                !selectedExec || submitting
                  ? 'none'
                  : '0 2px 8px rgba(139, 92, 246, 0.35)'
            }}
          >
            {submitting ? (
              <>
                <Loader2
                  size={14}
                  style={{ animation: 'spin 1s linear infinite' }}
                />{' '}
                Assigning...
              </>
            ) : (
              <>
                <UserPlus size={14} /> Confirm &amp; Assign
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
