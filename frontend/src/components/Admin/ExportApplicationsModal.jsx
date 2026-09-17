import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuthStore } from '../../app/store/authStore';
import { Download, Calendar, Filter, X, Check, FileText, Clock, History, CalendarDays, BarChart2, Edit3, Globe } from 'lucide-react';
import api from '../../services/api';

export default function ExportApplicationsModal({ isOpen, onClose, defaultApplications = [] }) {
  const { C, isDark } = useTheme();
  const user = useAuthStore((state) => state.user);
  const userRole = (user?.role || user?.user_role || '').toUpperCase();
  const userDesignation = (user?.designation || '').toUpperCase();
  const isAdminOperator = ['ADMINISTRATIVE_OPERATOR', 'ADMINISTRATIVE OPERATOR', 'OPERATOR'].includes(userRole) || ['ADMINISTRATIVE OPERATOR', 'ADMINISTRATIVE_OPERATOR'].includes(userDesignation);
  const isEmployeeRole = userRole === 'EMPLOYEE' || window.location.pathname.startsWith('/employee');
  const hideCustomerMobile = isAdminOperator || isEmployeeRole;

  const maskMobileNumber = (mobile) => {
    if (!mobile) return 'N/A';
    const str = String(mobile).trim();
    const digitsOnly = str.replace(/\D/g, '');
    if (digitsOnly.length >= 10) {
      const mainDigits = digitsOnly.slice(-10);
      const visiblePart = mainDigits.slice(0, 4);
      const prefix = str.startsWith('+91') ? '+91 ' : (str.length > 10 ? str.slice(0, str.length - 10) : '');
      return `${prefix}${visiblePart}******`;
    }
    if (str.length > 6) {
      return str.slice(0, str.length - 6) + '******';
    }
    return str.replace(/\d/g, '*');
  };

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const [period, setPeriod] = useState('all'); // 'today', 'yesterday', '7days', '30days', 'this_month', 'custom', 'all'
  const [fromDate, setFromDate] = useState(getTodayStr());
  const [toDate, setToDate] = useState(getTodayStr());
  const [statusFilter, setStatusFilter] = useState('all');
  const [exporting, setExporting] = useState(false);

  if (!isOpen) return null;

  const handlePeriodChange = (val) => {
    setPeriod(val);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (val === 'today') {
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (val === 'yesterday') {
      const yest = new Date(today);
      yest.setDate(yest.getDate() - 1);
      const yestStr = yest.toISOString().split('T')[0];
      setFromDate(yestStr);
      setToDate(yestStr);
    } else if (val === '7days') {
      const d = new Date(today);
      d.setDate(d.getDate() - 7);
      setFromDate(d.toISOString().split('T')[0]);
      setToDate(todayStr);
    } else if (val === '30days') {
      const d = new Date(today);
      d.setDate(d.getDate() - 30);
      setFromDate(d.toISOString().split('T')[0]);
      setToDate(todayStr);
    } else if (val === 'this_month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setFromDate(firstDay.toISOString().split('T')[0]);
      setToDate(todayStr);
    }
  };

  const handleExportDownload = async () => {
    setExporting(true);
    try {
      let filtered = [];

      try {
        const queryParams = {
          page: 1,
          limit: 50000,
        };

        if (period !== 'all') {
          queryParams.from_date = fromDate;
          queryParams.to_date = toDate;
          queryParams.period = period;
        }

        if (statusFilter !== 'all') {
          queryParams.status = statusFilter;
        }

        const res = await api.get('/applications', { params: queryParams });
        if (res.data?.success && Array.isArray(res.data?.data)) {
          filtered = res.data.data;
        } else if (Array.isArray(res.data)) {
          filtered = res.data;
        } else {
          filtered = [...defaultApplications];
        }
      } catch (fetchErr) {
        console.warn('Backend full export fetch failed, falling back to loaded records:', fetchErr);
        filtered = [...defaultApplications];
      }

      if (period !== 'all' && filtered.length > 0 && !filtered[0]._fromBackendFiltered) {
        const from = new Date(fromDate + 'T00:00:00');
        const to = new Date(toDate + 'T23:59:59');

        filtered = filtered.filter(app => {
          const appDate = new Date(app.created_at || app.application_date || app.createdAt);
          return appDate >= from && appDate <= to;
        });
      }

      if (statusFilter !== 'all' && filtered.length > 0) {
        filtered = filtered.filter(app => {
          const stat = (app.status || '').toLowerCase();
          if (statusFilter === 'approved') {
            return ['approved', 'disbursed', 'commission_released', 'commission_received'].includes(stat);
          } else if (statusFilter === 'pending') {
            return ['pending', 'details_submitted', 'submitted', 'under_review', 'operational_verified'].includes(stat);
          } else if (statusFilter === 'rejected') {
            return ['rejected', 'cancelled', 'declined'].includes(stat);
          }
          return true;
        });
      }

      if (filtered.length === 0) {
        alert(`No applications found for the selected period (${period === 'custom' ? `${fromDate} to ${toDate}` : period}).`);
        setExporting(false);
        return;
      }

      // Determine relevant bank names for assigned banks and exported applications
      const userAssignedBanks = [
        ...(Array.isArray(user?.assigned_banks) ? user.assigned_banks : []),
        ...(Array.isArray(user?.permissions?.assigned_banks) ? user.permissions.assigned_banks : []),
        ...(Array.isArray(user?.permissions?.bank_codes) ? user.permissions.bank_codes : []),
        ...(Array.isArray(user?.assigned_bank_ids) ? user.assigned_bank_ids : [])
      ].map(b => typeof b === 'string' ? b.toLowerCase() : (b?.name || b?.bank_name || b?.short_code || b?.code || '').toLowerCase());

      const exportedBankNames = filtered.map(a => `${a.bank_name || ''} ${a.bank_code || ''} ${a.bank || ''} ${a.product_name || ''}`.toLowerCase());
      const allRelevantBanks = [...userAssignedBanks, ...exportedBankNames];

      const hasSbiData = filtered.some(a => 
        (a.appcode_status && a.appcode_status !== 'NA') ||
        (a.soft_approval_status && a.soft_approval_status !== 'NA') ||
        (a.iqa_stage && a.iqa_stage !== 'NA') ||
        (a.dispatch_status && a.dispatch_status !== 'NA') ||
        (a.app_file_generated && a.app_file_generated !== 'NA') ||
        a.physical_details?.appcode_status ||
        a.physical_details?.soft_approval_status ||
        a.physical_details?.iqa_stage ||
        a.physical_details?.dispatch_status ||
        a.physical_details?.app_file_generated
      );

      const hasHdfcData = filtered.some(a => 
        (a.bank_current_lead_status && a.bank_current_lead_status !== 'NA') ||
        (a.eligible_reqd && a.eligible_reqd !== 'NA') ||
        a.physical_details?.bank_current_lead_status ||
        a.physical_details?.eligible_reqd
      );

      const isSuperAdminOrGlobal = (userRole === 'SUPER_ADMIN' || userRole === 'SUPERADMIN') && userAssignedBanks.length === 0;
      const hasSbi = hasSbiData || isSuperAdminOrGlobal || allRelevantBanks.some(b => b.includes('sbi') || b.includes('state bank'));
      const hasHdfc = hasHdfcData || isSuperAdminOrGlobal || allRelevantBanks.some(b => b.includes('hdfc') || b.includes('tata'));

      const isSuperAdminPanel = (userRole === 'SUPER_ADMIN' || userRole === 'SUPERADMIN') || (typeof window !== 'undefined' && window.location.pathname.startsWith('/super-admin'));

      const getApprovedByAdminId = (a) => {
        const stat = String(a.status || '').toLowerCase();
        const isAppr = ['approved', 'disbursed', 'sanctioned', 'super_admin_approved', 'commission_released', 'commission_received'].includes(stat) || a.approved_at;
        if (!isAppr) return 'NA';
        if (a.approved_by_admin_id && String(a.approved_by_admin_id).trim()) return String(a.approved_by_admin_id).trim();
        if (a.approved_by_code && String(a.approved_by_code).trim()) return String(a.approved_by_code).trim();
        if (a.approved_by_emp_code && String(a.approved_by_emp_code).trim()) return String(a.approved_by_emp_code).trim();
        if (a.approved_by_name && String(a.approved_by_name).trim()) return String(a.approved_by_name).trim();
        if (a.approved_by && String(a.approved_by).trim()) return String(a.approved_by).trim();

        if (Array.isArray(a.status_history)) {
          const apprEntry = a.status_history.find(h => ['approved', 'super_admin_approved', 'disbursed', 'sanctioned'].includes(String(h.status || '').toLowerCase()) && (h.by || h.user_id || h.admin_id));
          if (apprEntry) {
            return String(apprEntry.by || apprEntry.user_id || apprEntry.admin_id).trim();
          }
        }
        return 'NA';
      };

      const colDefs = [
        { header: 'Application No', getVal: a => a.app_number || a.application_no || a.id || '' },
        { header: 'Customer Name', getVal: a => a.customer_name || a.full_name || 'N/A' },
        { header: 'Mobile Number', getVal: a => {
            const rawMob = a.customer_mobile || a.mobile || a.phone || '';
            if (!rawMob) return 'N/A';
            return hideCustomerMobile ? maskMobileNumber(rawMob) : String(rawMob).trim();
          }
        },
        { header: 'Email', getVal: a => a.customer_email || a.email || 'N/A' },
        { header: 'PAN Number', getVal: a => {
            const rawPan = a.pan_number || a.pan || '';
            if (!rawPan || String(rawPan).trim() === '' || String(rawPan).toUpperCase() === 'N/A' || String(rawPan).toUpperCase() === 'NA') return 'NA';
            const cleanPan = String(rawPan).trim().toUpperCase();
            if (isAdminOperator || isEmployeeRole) {
              return cleanPan.length >= 6 ? 'XXXXXX' + cleanPan.slice(6) : 'XXXXXX';
            }
            return cleanPan;
          }
        },
        { header: 'City', getVal: a => a.city || 'N/A' },
        { header: 'State', getVal: a => a.state || 'N/A' },
        { header: 'Pincode', getVal: a => a.pincode || 'N/A' },
        { header: 'Product Name', getVal: a => a.product_name || 'N/A' },
        { header: 'Bank Name', getVal: a => a.bank_name || 'N/A' },
        { header: 'Process Type', getVal: a => (a.process_type || a.process_by || 'Direct Link').replace(/_/g, ' ') },
        { header: 'Referrer / Code', getVal: a => a.emp_code || a.Partner_code || a.partner_code || a.referrer_code || 'N/A' },
        { header: 'Status', getVal: a => (a.status || 'pending').replace(/_/g, ' ') }
      ];

      if (isSuperAdminPanel) {
        colDefs.push({
          header: 'Approved By Admin ID',
          getVal: a => getApprovedByAdminId(a)
        });
      }

      colDefs.push(
        { header: 'Commission Amount', getVal: a => a.commission_amount || 0 }
      );

      // SBI-exclusive bank form fields
      if (hasSbi || isSuperAdminOrGlobal) {
        colDefs.push(
          { header: 'APPCODE Status', getVal: a => a.appcode_status || a.physical_details?.appcode_status || 'NA' },
          { header: 'Soft Approval Status', getVal: a => a.soft_approval_status || a.physical_details?.soft_approval_status || 'NA' },
          { header: 'IQA Stage', getVal: a => a.iqa_stage || a.physical_details?.iqa_stage || 'NA' }
        );
      }

      // Bank Reference No & VKYC
      colDefs.push(
        { header: 'Bank Application Number', getVal: a => {
            const raw = a.bank_application_number || a.bank_ref_number || a.physical_details?.bank_application_number || a.physical_details?.bank_ref_number || '';
            const sysAppNo = a.app_number || '';
            return (!raw || String(raw).trim() === '' || String(raw).trim() === String(sysAppNo).trim() || String(raw).toUpperCase() === 'N/A' || String(raw).toUpperCase() === 'NA') ? 'NA' : String(raw).trim();
          }
        },
        { header: 'VKYC Stage', getVal: a => a.vkyc_stage || a.kyc_stage || a.vkyc_status || a.physical_details?.vkyc_stage || 'NA' },
        { header: 'VKYC Link', getVal: a => {
            const rawUrl = a.vkyc_url || a.physical_details?.vkyc_url || '';
            return (rawUrl && String(rawUrl).trim() !== '' && String(rawUrl).toUpperCase() !== 'N/A') ? String(rawUrl).trim() : 'NA';
          }
        }
      );

      if (hasSbi || isSuperAdminOrGlobal) {
        colDefs.push(
          { header: 'Dispatch Status', getVal: a => a.dispatch_status || a.physical_details?.dispatch_status || 'NA' }
        );
      }

      // HDFC / Tata HDFC bank form fields
      if (hasHdfc || isSuperAdminOrGlobal) {
        colDefs.push(
          { header: 'Bank Current Lead Status', getVal: a => a.bank_current_lead_status || a.physical_details?.bank_current_lead_status || 'NA' }
        );
      }

      // Bank Final Status
      colDefs.push(
        { header: 'Final Status', getVal: a => {
            const raw = a.final_status || a.physical_details?.final_status || '';
            return (raw && String(raw).trim() !== '' && String(raw).toUpperCase() !== 'N/A') ? String(raw).replace(/"/g, '""') : 'NA';
          }
        }
      );

      if (hasSbi || isSuperAdminOrGlobal) {
        colDefs.push(
          { header: 'App File Generated', getVal: a => a.app_file_generated || a.appfile_generated || a.physical_details?.app_file_generated || 'NA' }
        );
      }

      // Bank Remarks & Decline Reason
      colDefs.push(
        { header: 'Bank Remark', getVal: a => {
            const raw = a.bank_remark || a.physical_details?.bank_remark || '';
            return (raw && String(raw).trim() !== '' && String(raw).toUpperCase() !== 'N/A') ? String(raw).replace(/"/g, '""') : 'NA';
          }
        },
        { header: 'Decline Reason', getVal: a => {
            const raw = a.decline_reason || a.physical_details?.decline_reason || '';
            return (raw && String(raw).trim() !== '' && String(raw).toUpperCase() !== 'N/A') ? String(raw).replace(/"/g, '""') : 'NA';
          }
        }
      );

      if (hasHdfc || isSuperAdminOrGlobal) {
        colDefs.push(
          { header: 'Eligible Re-QD', getVal: a => {
              const raw = a.eligible_reqd || a.physical_details?.eligible_reqd || '';
              return (raw && String(raw).trim() !== '' && String(raw).toUpperCase() !== 'N/A') ? String(raw).replace(/"/g, '""') : 'NA';
            }
          }
        );
      }

      colDefs.push(
        { header: 'Approved Amount', getVal: a => a.approved_amount || a.physical_details?.approved_amount || 0 },
        { header: 'Created Date', getVal: a => a.created_at ? new Date(a.created_at).toLocaleDateString('en-IN') : 'N/A' }
      );

      // Generate CSV string with UTF-8 BOM
      const csvLines = [colDefs.map(c => `"${c.header.replace(/"/g, '""')}"`).join(',')];

      filtered.forEach(a => {
        const rowVals = colDefs.map(c => {
          const val = c.getVal(a);
          return `"${String(val ?? '').replace(/"/g, '""')}"`;
        });
        csvLines.push(rowVals.join(','));
      });

      const csvString = '\uFEFF' + csvLines.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `applications_report_${period}_${fromDate}_to_${toDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 100);

      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to generate export file.');
    } finally {
      setExporting(false);
    }
  };

  const PERIOD_OPTIONS = [
    { id: 'today', label: 'Today', icon: <Calendar size={14} /> },
    { id: 'yesterday', label: 'Yesterday', icon: <History size={14} /> },
    { id: '7days', label: 'Last 7 Days', icon: <Clock size={14} /> },
    { id: '30days', label: 'Last 30 Days', icon: <CalendarDays size={14} /> },
    { id: 'this_month', label: 'This Month', icon: <BarChart2 size={14} /> },
    { id: 'custom', label: 'Custom Range', icon: <Edit3 size={14} /> },
    { id: 'all', label: 'All Time', icon: <Globe size={14} /> }
  ];

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10000,
      background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{
        background: C.card, borderRadius: '24px', border: `1px solid ${C.border}`,
        width: '100%', maxWidth: '540px', padding: '24px', position: 'relative',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: C.textLight, cursor: 'pointer' }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 900, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={22} color={C.primary} /> Export Applications Report
          </h3>
          <p style={{ fontSize: '13px', color: C.textLight, margin: '4px 0 0 0' }}>
            Download application records filtered by date period and status.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Quick Period Buttons */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
              Select Application Period
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {PERIOD_OPTIONS.map(item => (
                <button
                  key={item.id}
                  onClick={() => handlePeriodChange(item.id)}
                  style={{
                    padding: '9px 10px',
                    borderRadius: '10px',
                    border: `1px solid ${period === item.id ? C.primary : C.border}`,
                    background: period === item.id ? `${C.primary}15` : C.bg,
                    color: period === item.id ? C.primary : C.text,
                    fontSize: '12.5px',
                    fontWeight: period === item.id ? 800 : 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date Pickers for Custom / Active Period */}
          {(period === 'custom' || period === 'today' || period === 'yesterday' || period === '7days' || period === '30days' || period === 'this_month') && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: C.bg, padding: '12px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => { setPeriod('custom'); setFromDate(e.target.value); }}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => { setPeriod('custom'); setToDate(e.target.value); }}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: '13px' }}
                />
              </div>
            </div>
          )}

          {/* Status Filter */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
              Application Status Filter
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: '13px', fontWeight: 700 }}
            >
              <option value="all">All Application Statuses</option>
              <option value="approved">Approved & Disbursed Only</option>
              <option value="pending">Pending & Under Review Only</option>
              <option value="rejected">Rejected & Cancelled Only</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            <button
              onClick={onClose}
              style={{ flex: 1, padding: '12px', borderRadius: '12px', border: `1px solid ${C.border}`, background: 'transparent', color: C.text, fontWeight: 800, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              onClick={handleExportDownload}
              disabled={exporting}
              style={{
                flex: 2, padding: '12px', borderRadius: '12px', border: 'none',
                background: C.primary, color: '#fff', fontWeight: 900, fontSize: '14px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: `0 4px 14px ${C.primary}40`
              }}
            >
              <Download size={16} /> {exporting ? 'Generating CSV...' : 'Download CSV Report'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
