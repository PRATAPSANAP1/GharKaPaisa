import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuthStore } from '../../app/store/authStore';
import { Download, Calendar, Filter, X, Check, FileText, Clock, History, CalendarDays, BarChart2, Edit3, Globe } from 'lucide-react';
import api from '../../services/api';

export default function ExportApplicationsModal({ isOpen, onClose, defaultApplications = [], initialBank = 'all', banksList = [] }) {
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
  const KNOWN_HDFC_UUIDS = [
    'f0b5742d-f04d-4a91-b162-6009ddf6e345',
    '1eacfa67-1187-48c7-adde-8a6edcfe9969'
  ];

  const isHdfcApp = (app) => {
    if (!app) return false;
    const bId = String(app.bank_id || '').toLowerCase();
    if (KNOWN_HDFC_UUIDS.includes(bId)) return true;
    const bName = `${app.bank_name || ''} ${app.bank || ''} ${app.bank_code || ''} ${app.product_name || ''} ${app.product || ''}`.toLowerCase();
    return bName.includes('hdfc');
  };

  const checkIsAllHdfcApplications = (list) => {
    if (!Array.isArray(list) || list.length === 0) return false;
    return list.every(isHdfcApp);
  };

  const isHdfcCurableOperator = ['PHYSICAL CURABLE', 'PHYSICAL_CURABLE', 'DIGITAL CURABLE', 'DIGITAL_CURABLE', 'EMAIL CURABLE', 'EMAIL_CURABLE'].some(r =>
    userRole.includes(r) || userDesignation.includes(r)
  );

  const resolveIsHdfc = (bVal) => {
    if (!bVal || bVal === 'all') return false;
    const lower = String(bVal).toLowerCase().trim();
    if (lower === 'hdfc' || lower.includes('hdfc') || KNOWN_HDFC_UUIDS.includes(lower)) return true;
    if (Array.isArray(banksList) && banksList.length > 0) {
      const match = banksList.find(b => {
        const id = String(b.id || b.bank_id || b._id || '').toLowerCase();
        return id === lower;
      });
      if (match && `${match.name || ''} ${match.bank_name || ''} ${match.short_code || ''}`.toLowerCase().includes('hdfc')) {
        return true;
      }
    }
    if (Array.isArray(defaultApplications) && defaultApplications.length > 0) {
      const match = defaultApplications.find(a => {
        const bId = String(a.bank_id || a.bank || '').toLowerCase();
        return bId === lower;
      });
      if (match && isHdfcApp(match)) {
        return true;
      }
    }
    return false;
  };

  const [bankFilter, setBankFilter] = useState(() => {
    const isInitHdfc = resolveIsHdfc(initialBank) || checkIsAllHdfcApplications(defaultApplications) || isHdfcCurableOperator;
    return isInitHdfc ? 'hdfc' : (initialBank || 'all');
  });
  const [exporting, setExporting] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      const isInitHdfc = resolveIsHdfc(initialBank) || checkIsAllHdfcApplications(defaultApplications) || isHdfcCurableOperator;
      setBankFilter(isInitHdfc ? 'hdfc' : (initialBank || 'all'));
    }
  }, [isOpen, initialBank, banksList, defaultApplications]);

  const isHdfcSelected = resolveIsHdfc(bankFilter) || (bankFilter === 'all' && (checkIsAllHdfcApplications(defaultApplications) || isHdfcCurableOperator));

  const dynamicBankNames = Array.from(new Set(
    (Array.isArray(defaultApplications) ? defaultApplications : [])
      .map(a => a.bank_name || a.bank || '')
      .filter(Boolean)
  )).sort();

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

        if (isHdfcSelected || resolveIsHdfc(bankFilter) || resolveIsHdfc(initialBank)) {
          queryParams.bank = 'hdfc';
        } else if (bankFilter !== 'all') {
          queryParams.bank = bankFilter;
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

        filtered = (Array.isArray(filtered) ? filtered : []).filter(app => {
          const appDate = new Date(app.created_at || app.application_date || app.createdAt);
          return appDate >= from && appDate <= to;
        });
      }

      if (statusFilter !== 'all' && filtered.length > 0) {
        filtered = (Array.isArray(filtered) ? filtered : []).filter(app => {
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

      if (bankFilter !== 'all' && filtered.length > 0) {
        if (isHdfcSelected || resolveIsHdfc(bankFilter)) {
          filtered = (Array.isArray(filtered) ? filtered : []).filter(isHdfcApp);
        } else {
          const bFilterLower = bankFilter.toLowerCase();
          filtered = (Array.isArray(filtered) ? filtered : []).filter(app => {
            const bName = `${app.bank_name || ''} ${app.bank_code || ''} ${app.bank || ''} ${app.product_name || ''}`.toLowerCase();
            return bName.includes(bFilterLower) || (app.bank_id && String(app.bank_id).toLowerCase() === bFilterLower);
          });
        }
      }

      if (filtered.length === 0) {
        const bankNotice = bankFilter !== 'all' ? ` for ${bankFilter.toUpperCase()}` : '';
        alert(`No applications found${bankNotice} for the selected period (${period === 'custom' ? `${fromDate} to ${toDate}` : period}).`);
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

      const isAuthorizedForOpCodesAndReQd = ['SUPER_ADMIN', 'ADMIN', 'OPERATIONAL_HEAD', 'OPERATIONAL HEAD', 'OPERATIONS_HEAD', 'OPERATIONS HEAD', 'ADMINISTRATIVE_OPERATOR', 'ADMINISTRATIVE OPERATOR'].includes(userRole) || ['ADMINISTRATIVE OPERATOR', 'ADMINISTRATIVE_OPERATOR', 'OPERATIONAL HEAD', 'OPERATIONAL_HEAD'].includes(userDesignation);

      if (isAuthorizedForOpCodesAndReQd) {
        colDefs.push(
          { header: 'Re-QD Date', getVal: a => a.requery_date || a.re_query_date || a.physical_details?.requery_date || 'NA' },
          { header: 'Sales Operator Code', getVal: a => a.sales_operator_code || a.physical_details?.sales_operator_code || 'NA' },
          { header: 'PAN Checker Code', getVal: a => a.pan_checker_code || a.physical_details?.pan_checker_code || 'NA' },
          { header: 'Remark Operator Code', getVal: a => a.remark_operator_code || a.physical_details?.remark_operator_code || 'NA' }
        );
      }

      colDefs.push(
        { header: 'Approved Amount', getVal: a => a.approved_amount || a.physical_details?.approved_amount || 0 },
        { header: 'Created Date', getVal: a => a.created_at ? new Date(a.created_at).toLocaleDateString('en-IN') : 'N/A' }
      );

      // 33-column HDFC GharKaPaisa dump format
      const HDFC_COL_DEFS = [
        { header: 'Application no', getVal: a => a.app_number || a.application_no || a.id || '' },
        { header: 'Customer name', getVal: a => a.customer_name || a.full_name || a.pan_name || 'N/A' },
        { header: 'Mobile number', getVal: a => {
            const rawMob = a.customer_mobile || a.mobile || a.phone || a.aadhaar_linked_mobile || '';
            if (!rawMob) return 'N/A';
            return hideCustomerMobile ? maskMobileNumber(rawMob) : String(rawMob).trim();
          }
        },
        { header: 'Email ID', getVal: a => a.customer_email || a.email || a.personal_email || 'N/A' },
        { header: 'Pan no', getVal: a => {
            const rawPan = a.pan_number || a.pan || '';
            if (!rawPan || String(rawPan).trim() === '' || String(rawPan).toUpperCase() === 'N/A' || String(rawPan).toUpperCase() === 'NA') return 'NA';
            const cleanPan = String(rawPan).trim().toUpperCase();
            if (isAdminOperator || isEmployeeRole) {
              return cleanPan.length >= 6 ? 'XXXXXX' + cleanPan.slice(6) : 'XXXXXX';
            }
            return cleanPan;
          }
        },
        { header: 'City', getVal: a => a.city || a.physical_details?.city || 'N/A' },
        { header: 'State', getVal: a => a.state || a.physical_details?.state || 'N/A' },
        { header: 'Pincode', getVal: a => a.pincode || a.physical_details?.pincode || 'N/A' },
        { header: 'Product name', getVal: a => a.product_name || a.product || 'N/A' },
        { header: 'Bank name', getVal: a => a.bank_name || a.bank || 'HDFC Bank' },
        { header: 'Process type', getVal: a => (a.process_type || a.process_by || 'Direct Link').replace(/_/g, ' ') },
        { header: 'Reference/ code', getVal: a => a.emp_code || a.Partner_code || a.partner_code || a.referrer_code || a.submitted_by_name || 'N/A' },
        { header: 'Status', getVal: a => (a.status || 'pending').replace(/_/g, ' ') },
        { header: 'Incentive amount', getVal: a => a.incentive_amount ?? a.commission_amount ?? 0 },
        { header: 'Bank application no', getVal: a => {
            const raw = a.bank_application_number || a.bank_ref_number || a.physical_details?.bank_application_number || a.physical_details?.bank_ref_number || '';
            const sysAppNo = a.app_number || '';
            return (!raw || String(raw).trim() === '' || String(raw).trim() === String(sysAppNo).trim() || String(raw).toUpperCase() === 'N/A' || String(raw).toUpperCase() === 'NA') ? 'NA' : String(raw).trim();
          }
        },
        { header: 'IPA STAGE', getVal: a => a.ipa_stage || a.physical_details?.ipa_stage || a.iqa_stage || a.physical_details?.iqa_stage || 'NA' },
        { header: 'Soft approval stage', getVal: a => a.soft_approval_stage || a.soft_approval_status || a.physical_details?.soft_approval_stage || a.physical_details?.soft_approval_status || 'NA' },
        { header: 'KYC stage', getVal: a => a.kyc_stage || a.vkyc_stage || a.vkyc_status || a.physical_details?.kyc_stage || a.physical_details?.vkyc_stage || 'NA' },
        { header: 'KYC link', getVal: a => {
            const rawUrl = a.vkyc_url || a.physical_details?.vkyc_url || a.kyc_link || a.physical_details?.kyc_link || '';
            return (rawUrl && String(rawUrl).trim() !== '' && String(rawUrl).toUpperCase() !== 'N/A') ? String(rawUrl).trim() : 'NA';
          }
        },
        { header: 'Dispatch status', getVal: a => a.dispatch_status || a.physical_details?.dispatch_status || 'NA' },
        { header: 'Final status form bank', getVal: a => a.final_status || a.physical_details?.final_status || a.bank_current_lead_status || a.physical_details?.bank_current_lead_status || 'NA' },
        { header: 'Final card approval', getVal: a => a.final_card_approval || a.card_approval_stage || a.card_approval_status || a.digital_card_issued || a.card_activation_stage || a.physical_details?.final_card_approval || a.physical_details?.card_approval_stage || 'NA' },
        { header: 'User remark', getVal: a => a.user_remark || a.notes || a.user_notes || a.operational_remarks || a.physical_details?.user_remark || 'NA' },
        { header: 'Bank remark', getVal: a => a.bank_remark || a.physical_details?.bank_remark || 'NA' },
        { header: 'Cureble stage', getVal: a => a.cureble_stage || a.curable_stage || a.queryable_remark || a.physical_details?.cureble_stage || a.physical_details?.queryable_remark || 'NA' },
        { header: 'Primary code', getVal: a => a.primary_code || a.decline_code || a.physical_details?.primary_code || a.physical_details?.decline_code || 'NA' },
        { header: 'Secondary code', getVal: a => a.secondary_code || a.physical_details?.secondary_code || 'NA' },
        { header: 'Cureble type', getVal: a => a.cureble_type || a.curable_type || a.digital_remark || a.physical_details?.cureble_type || a.physical_details?.digital_remark || 'NA' },
        { header: 'Cureble operator code', getVal: a => a.cureble_operator_code || a.curable_operator_code || a.curable_executive || a.physical_details?.cureble_operator_code || 'NA' },
        { header: 'Salas operator code', getVal: a => a.salas_operator_code || a.sales_operator_code || a.queryable_sales_remark || a.physical_details?.sales_operator_code || a.physical_details?.salas_operator_code || 'NA' },
        { header: 'Remark opretor code', getVal: a => a.remark_opretor_code || a.remark_operator_code || a.last_operator_code || a.physical_details?.remark_operator_code || a.physical_details?.remark_opretor_code || 'NA' },
        { header: 'Decline reason', getVal: a => a.decline_reason || a.decline_remark || a.offer_decline_reason || a.physical_details?.decline_reason || a.physical_details?.decline_remark || 'NA' },
        { header: 'Created date', getVal: a => (a.created_at || a.createdAt || a.application_date) ? new Date(a.created_at || a.createdAt || a.application_date).toLocaleDateString('en-IN') : 'N/A' }
      ];

      const isFinalHdfcDump = isHdfcSelected ||
        resolveIsHdfc(bankFilter) ||
        resolveIsHdfc(initialBank) ||
        (filtered.length > 0 && checkIsAllHdfcApplications(filtered)) ||
        (defaultApplications.length > 0 && checkIsAllHdfcApplications(defaultApplications));

      const activeColDefs = isFinalHdfcDump ? HDFC_COL_DEFS : colDefs;
      const downloadFileName = isFinalHdfcDump
        ? `hdfc_gharkapaisa_dump_${period}${period === 'all' ? '' : `_${fromDate}_to_${toDate}`}.csv`
        : `applications_report_${period}_${fromDate}_to_${toDate}.csv`;

      const formatCsvVal = (val) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/[\r\n]+/g, ' ').replace(/"/g, '""');
        return `"${str}"`;
      };

      // Generate CSV string with UTF-8 BOM
      const csvLines = [activeColDefs.map(c => `"${c.header.replace(/"/g, '""')}"`).join(',')];

      filtered.forEach(a => {
        const rowVals = activeColDefs.map(c => formatCsvVal(c.getVal(a)));
        csvLines.push(rowVals.join(','));
      });

      const csvString = '\uFEFF' + csvLines.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', downloadFileName);
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

          {/* Bank Filter */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Bank Filter / Dump Format</span>
              {isHdfcSelected && (
                <span style={{ color: '#2563eb', fontSize: '11px', fontWeight: 900, textTransform: 'none', background: '#dbeafe', padding: '2px 8px', borderRadius: '6px' }}>
                  HDFC 33-Column Dump
                </span>
              )}
            </label>
            <select
              value={isHdfcSelected ? 'hdfc' : bankFilter}
              onChange={(e) => setBankFilter(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '10px',
                border: `1px solid ${isHdfcSelected ? '#3b82f6' : C.border}`,
                background: isHdfcSelected ? (isDark ? '#1e293b' : '#f0f9ff') : C.bg,
                color: C.text, fontSize: '13px', fontWeight: 700
              }}
            >
              <option value="all">All Banks (Standard Dump)</option>
              <option value="hdfc">HDFC Bank (Hdfc gharkapaisa dump format)</option>
              <option value="sbi">State Bank of India (SBI)</option>
              <option value="axis">Axis Bank</option>
              <option value="icici">ICICI Bank</option>
              <option value="idfc">IDFC First Bank</option>
              <option value="kotak">Kotak Mahindra Bank</option>
              {dynamicBankNames
                .filter(b => !['all', 'hdfc', 'sbi', 'axis', 'icici', 'idfc', 'kotak'].some(k => b.toLowerCase().includes(k)))
                .map(b => (
                  <option key={b} value={b}>{b}</option>
                ))
              }
            </select>
          </div>

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
                background: isHdfcSelected ? '#2563eb' : C.primary, color: '#fff', fontWeight: 900, fontSize: '14px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: isHdfcSelected ? '0 4px 14px rgba(37, 99, 235, 0.4)' : `0 4px 14px ${C.primary}40`
              }}
            >
              <Download size={16} /> {exporting ? 'Generating CSV...' : (isHdfcSelected ? 'Download HDFC Dump CSV (33 Cols)' : 'Download CSV Report')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
