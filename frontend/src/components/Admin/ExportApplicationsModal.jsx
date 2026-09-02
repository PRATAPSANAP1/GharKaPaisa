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
      let filtered = [...defaultApplications];

      if (period !== 'all') {
        const from = new Date(fromDate + 'T00:00:00');
        const to = new Date(toDate + 'T23:59:59');

        filtered = filtered.filter(app => {
          const appDate = new Date(app.created_at || app.application_date || app.createdAt);
          return appDate >= from && appDate <= to;
        });
      }

      if (statusFilter !== 'all') {
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

      // Generate CSV
      let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
      csvContent += 'Application No,Customer Name,Customer Mobile,Email,PAN Number,City,State,Pincode,Product Name,Bank Name,Process Type,Referrer / Code,Status,Commission Amount,APPCODE Status,Soft Approval Status,IQA Stage,Bank Application Number,VKYC Stage,VKYC Link,Dispatch Status,Final Status,App File Generated,Bank Remark,Decline Reason,Eligible Re-QD,Approved Amount,Created Date\n';

      filtered.forEach(a => {
        const appNo = a.app_number || a.application_no || a.id || '';
        const custName = a.customer_name || a.full_name || 'N/A';
        const rawMobile = a.customer_mobile || a.mobile || 'N/A';
        const custMobile = hideCustomerMobile ? 'REDACTED' : rawMobile;
        const custEmail = a.customer_email || a.email || 'N/A';
        
        const rawPan = a.pan_number || a.pan || '';
        let panNo = 'NA';
        if (rawPan && String(rawPan).trim() !== '' && String(rawPan).toUpperCase() !== 'N/A' && String(rawPan).toUpperCase() !== 'NA') {
          const strPan = String(rawPan).trim().toUpperCase();
          if (hideCustomerMobile) {
            panNo = strPan.length >= 6 ? 'XXXXXX' + strPan.slice(6) : 'XXXXXX';
          } else {
            panNo = strPan;
          }
        }

        const city = a.city || 'N/A';
        const state = a.state || 'N/A';
        const pincode = a.pincode || 'N/A';
        const prodName = a.product_name || 'N/A';
        const bankName = a.bank_name || 'N/A';
        const process = (a.process_type || a.process_by || 'Direct Link').replace(/_/g, ' ');
        const refCode = a.emp_code || a.Partner_code || a.partner_code || a.referrer_code || 'N/A';
        const status = (a.status || 'pending').replace(/_/g, ' ');
        const comm = a.commission_amount || 0;

        // Remark & Final form fields
        const appcodeStatus = a.appcode_status || 'N/A';
        const softApprovalStatus = a.soft_approval_status || 'N/A';
        const iqaStage = a.iqa_stage || 'N/A';
        
        const rawBankAppNo = a.bank_application_number || a.bank_ref_number || '';
        const bankAppNo = (!rawBankAppNo || String(rawBankAppNo).trim() === '' || String(rawBankAppNo).toUpperCase() === 'N/A' || String(rawBankAppNo).toUpperCase() === 'NA') ? 'NA' : String(rawBankAppNo).trim();
        
        const vkycStage = a.vkyc_stage || a.vkyc_status || 'N/A';
        const vkycLink = a.vkyc_url || 'N/A';
        const dispatchStatus = a.dispatch_status || 'N/A';
        const finalStatus = a.final_status || 'N/A';
        const appFileGen = a.app_file_generated || 'N/A';
        const bankRemark = String(a.bank_remark || 'N/A').replace(/"/g, '""');
        const declineReason = String(a.decline_reason || 'N/A').replace(/"/g, '""');
        const eligibleReqd = a.eligible_reqd || 'N/A';
        const appAmt = a.approved_amount || 0;
        const date = a.created_at ? new Date(a.created_at).toLocaleDateString('en-IN') : 'N/A';

        csvContent += `"${appNo}","${custName}","${custMobile}","${custEmail}","${panNo}","${city}","${state}","${pincode}","${prodName}","${bankName}","${process}","${refCode}","${status}","${comm}","${appcodeStatus}","${softApprovalStatus}","${iqaStage}","${bankAppNo}","${vkycStage}","${vkycLink}","${dispatchStatus}","${finalStatus}","${appFileGen}","${bankRemark}","${declineReason}","${eligibleReqd}","${appAmt}","${date}"\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `applications_report_${period}_${fromDate}_to_${toDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

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
