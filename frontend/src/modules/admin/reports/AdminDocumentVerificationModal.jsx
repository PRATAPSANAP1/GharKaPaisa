import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useAuthStore } from '../../../app/store/authStore';
import { 
  X, CheckCircle, XCircle, Eye, Send, ShieldCheck, 
  Building2, User, Clock, AlertTriangle, FileText, Check, ArrowRight, ArrowLeft, Lock
} from 'lucide-react';
import ApplicationTracker from '../../../components/common/ApplicationTracker';

const AdminDocumentVerificationModal = ({ application, onClose, onRefresh, initialTab = 'qd', showAllTabs = false }) => {
  // Normalize initialTab ('qd' | 'remark' | 'final' | 'timeline' | legacy aliases)
  const getTabKey = (tab) => {
    if (tab === 'details' || tab === 'qd') return 'qd';
    if (tab === 'remark1' || tab === 'remark2' || tab === 'remark') return 'remark';
    if (tab === 'bank' || tab === 'final') return 'final';
    if (tab === 'timeline') return 'timeline';
    return 'qd';
  };

  const initialTabKey = getTabKey(initialTab);
  const [activeTab, setActiveTab] = useState(initialTabKey);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // User Role & Permissions
  const user = useAuthStore((state) => state.user);
  const role = (user?.role || '').toUpperCase();

  // Role Access Rules:
  // QD Form: Editable ONLY by Partner. Read-only for others.
  // Remark Form: Editable by Administrative Operator / Operational Head / Partner / Admin / Super Admin.
  // Final Form: Editable ONLY by Administrative Operator / Operational Head / Admin / Super Admin. Read-only for Partner.
  const isPartner = ['PARTNER', 'TEAM_MEMBER'].includes(role);
  const isOpsOrAdmin = ['ADMIN', 'SUPER_ADMIN', 'OPERATIONS', 'OPERATIONS_HEAD', 'ADMINISTRATIVE_OPERATOR', 'OPERATOR'].includes(role) || !isPartner;

  const canEditQd = isPartner;
  const canEditRemark = true;
  const canEditFinal = isOpsOrAdmin;

  // 1. QD Customer Details State
  const [customerMobile, setCustomerMobile] = useState(application?.customer_mobile || application?.mobile || application?.phone || '');
  const [customerName, setCustomerName] = useState(application?.customer_name || application?.full_name || application?.name || '');
  const [dob, setDob] = useState(application?.dob || application?.date_of_birth || '');
  const [customerEmail, setCustomerEmail] = useState(application?.customer_email || application?.email || '');
  const [panNumber, setPanNumber] = useState(application?.pan_number || application?.pan || '');
  const [companyName, setCompanyName] = useState(application?.company_name || application?.employer_name || '');
  const [designation, setDesignation] = useState(application?.designation || application?.occupation || '');
  const [address, setAddress] = useState(application?.address || application?.residential_address || '');
  const [companyAddress, setCompanyAddress] = useState(application?.company_address || application?.office_address || '');
  const [motherName, setMotherName] = useState(application?.mother_name || '');
  const [appNumber, setAppNumber] = useState(application?.app_number || application?.bank_ref_number || application?.application_no || '');
  const [vkycUrl, setVkycUrl] = useState(application?.vkyc_url || application?.vkyc_link || '');

  // 2. Remark Form State (Soft Approval, VKYC Stage, IQA Stage, Dispatch Status)
  const [softApprovalStatus, setSoftApprovalStatus] = useState(application?.soft_approval_status || 'Approval-income 25k');
  const [vkycStage, setVkycStage] = useState(application?.vkyc_stage || 'VKYC Pending');
  const [iqaStage, setIqaStage] = useState(application?.iqa_stage || 'IQA Pending');
  const [dispatchStatus, setDispatchStatus] = useState(application?.dispatch_status || 'E-sign Pending');

  // 3. Final Status & Bank Remarks State
  const [bankRemark, setBankRemark] = useState(application?.bank_remark || '');
  const [finalStatus, setFinalStatus] = useState(application?.final_status || application?.status || 'In Process');
  const [declineReason, setDeclineReason] = useState(application?.decline_reason || application?.rejection_reason || '');
  const [eligibleReQd, setEligibleReQd] = useState(application?.eligible_reqd || 'No');
  const [bankRefNumber, setBankRefNumber] = useState(application?.bank_ref_number || application?.app_number || '');
  const [approvedAmount, setApprovedAmount] = useState(application?.approved_amount || application?.loan_amount || '');

  const fetchData = async () => {
    if (!application?.id) return;
    try {
      setLoading(true);
      const [appRes, timelineRes] = await Promise.all([
        api.get(`/applications/${application.id}`).catch(() => null),
        api.get(`/applications/${application.id}/timeline`).catch(() => ({ data: { data: [] } }))
      ]);

      if (appRes?.data?.success && appRes.data.data) {
        const app = appRes.data.data;
        const cust = app.customer || {};
        const pd = app.physical_details || {};

        if (pd.aadhaar_linked_mobile || cust.mobile || app.customer_mobile) setCustomerMobile(pd.aadhaar_linked_mobile || cust.mobile || app.customer_mobile || app.mobile || '');
        if (pd.pan_name || cust.full_name || app.customer_name) setCustomerName(pd.pan_name || cust.full_name || app.customer_name || app.full_name || '');
        if (pd.dob || cust.dob || app.dob) setDob(pd.dob || cust.dob || app.dob || '');
        if (pd.personal_email || cust.email || app.customer_email) setCustomerEmail(pd.personal_email || cust.email || app.customer_email || app.email || '');
        if (pd.pan_number || cust.pan_number || app.pan_number) setPanNumber(pd.pan_number || cust.pan_number || app.pan_number || app.pan || '');
        if (pd.company_name || app.company_name) setCompanyName(pd.company_name || app.company_name || app.employer_name || '');
        if (pd.designation || app.designation) setDesignation(pd.designation || app.designation || app.occupation || '');
        if (pd.flat_no || app.address) setAddress(pd.flat_no || app.address || app.residential_address || '');
        if (pd.company_address || app.company_address) setCompanyAddress(pd.company_address || app.company_address || app.office_address || '');
        if (pd.mother_name || app.mother_name) setMotherName(pd.mother_name || app.mother_name || '');
        if (app.bank_ref_number || app.app_number) setAppNumber(app.bank_ref_number || app.app_number || app.application_no || '');
        if (app.vkyc_url) setVkycUrl(app.vkyc_url || app.vkyc_link || '');

        if (app.soft_approval_status) setSoftApprovalStatus(app.soft_approval_status);
        if (app.vkyc_stage) setVkycStage(app.vkyc_stage);
        if (app.iqa_stage) setIqaStage(app.iqa_stage);
        if (app.dispatch_status) setDispatchStatus(app.dispatch_status);
        if (app.bank_remark) setBankRemark(app.bank_remark);
        if (app.final_status) setFinalStatus(app.final_status);
        if (app.decline_reason) setDeclineReason(app.decline_reason);
        if (app.eligible_reqd) setEligibleReQd(app.eligible_reqd);
        if (app.bank_ref_number) setBankRefNumber(app.bank_ref_number);
        if (app.approved_amount) setApprovedAmount(app.approved_amount);
      }

      setTimeline(timelineRes?.data?.data || []);
    } catch (err) {
      console.error('Error loading application details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [application?.id]);

  const handleSaveDetails = async (targetSection = 'all') => {
    try {
      setActionLoading(true);
      
      let backendStatus = 'under_review';
      if (finalStatus.toLowerCase().includes('approved') || finalStatus.toLowerCase().includes('generated')) backendStatus = 'approved';
      else if (finalStatus.toLowerCase().includes('decline') || finalStatus.toLowerCase().includes('rejected')) backendStatus = 'rejected';
      else if (finalStatus.toLowerCase().includes('process')) backendStatus = 'under_review';

      const payload = {
        status: backendStatus,
        bank_ref_number: bankRefNumber || appNumber || undefined,
        approved_amount: approvedAmount ? Number(approvedAmount) : undefined,
        rejection_reason: declineReason || undefined,
        soft_approval_status: softApprovalStatus,
        vkyc_stage: vkycStage,
        iqa_stage: iqaStage,
        dispatch_status: dispatchStatus,
        bank_remark: bankRemark,
        final_status: finalStatus,
        decline_reason: declineReason,
        eligible_reqd: eligibleReQd,
        // QD Details
        customer_mobile: customerMobile,
        customer_name: customerName,
        dob: dob,
        customer_email: customerEmail,
        pan_number: panNumber,
        company_name: companyName,
        designation: designation,
        address: address,
        company_address: companyAddress,
        mother_name: motherName,
        vkyc_url: vkycUrl
      };

      let res;
      try {
        res = await api.put(`/applications/${application.id}/bank-status`, payload);
      } catch (putErr) {
        if (putErr.response?.status === 405 || putErr.response?.status === 403 || putErr.response?.status === 404) {
          try {
            res = await api.patch(`/applications/${application.id}/bank-status`, payload);
          } catch (patchErr) {
            try {
              res = await api.post(`/applications/${application.id}/bank-status`, payload);
            } catch (postErr) {
              res = await api.put(`/applications/${application.id}`, payload);
            }
          }
        } else {
          throw putErr;
        }
      }

      if (res?.data?.success) {
        alert(`Application details saved successfully!`);
        fetchData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update application details');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: '#ffffff', width: '100%', maxWidth: '920px', maxHeight: '94vh', borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)' }}>
        
        {/* Modal Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Application #{appNumber || application.app_number || 'APP-REF'}
              </h3>
              <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '12px', background: '#ffedd5', color: '#c2410c' }}>
                {finalStatus ? finalStatus.toUpperCase() : 'UNDER REVIEW'}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0', wordBreak: 'break-word' }}>
              Customer: <strong>{customerName || application.customer_name || 'Customer'}</strong> | Mobile: {customerMobile || application.customer_mobile} | Bank: {application.bank_name || application.bank_code || 'Partner Bank'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}>
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Modal Body Scrollable */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          
          {/* Application Tracker */}
          <div style={{ marginBottom: '24px' }}>
            <ApplicationTracker currentStatus={application.status} />
          </div>

          {/* Navigation Tabs (Stage Specific View + Audit Log based on button clicked) */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '20px', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            
            {/* 1. QD Tab (Shown only when QD button is clicked) */}
            {(initialTabKey === 'qd' || showAllTabs) && (
              <button
                onClick={() => setActiveTab('qd')}
                style={{
                  background: activeTab === 'qd' ? '#eff6ff' : 'none',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontWeight: activeTab === 'qd' ? 800 : 600,
                  fontSize: '13px',
                  color: activeTab === 'qd' ? '#2563eb' : '#64748b',
                  borderBottom: activeTab === 'qd' ? '3px solid #2563eb' : '3px solid transparent',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                📋 QD (Quick Details) {!canEditQd && <Lock size={12} style={{ color: '#94a3b8' }} />}
              </button>
            )}

            {/* 2. Remark Tab (Shown only when Remark button is clicked) */}
            {(initialTabKey === 'remark' || showAllTabs) && (
              <button
                onClick={() => setActiveTab('remark')}
                style={{
                  background: activeTab === 'remark' ? '#fff7ed' : 'none',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontWeight: activeTab === 'remark' ? 800 : 600,
                  fontSize: '13px',
                  color: activeTab === 'remark' ? '#ea580c' : '#64748b',
                  borderBottom: activeTab === 'remark' ? '3px solid #ea580c' : '3px solid transparent',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                ⚙️ Operational Remarks
              </button>
            )}

            {/* 3. Final Tab (Shown only when Final button is clicked) */}
            {(initialTabKey === 'final' || showAllTabs) && (
              <button
                onClick={() => setActiveTab('final')}
                style={{
                  background: activeTab === 'final' ? '#f0fdf4' : 'none',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontWeight: activeTab === 'final' ? 800 : 600,
                  fontSize: '13px',
                  color: activeTab === 'final' ? '#16a34a' : '#64748b',
                  borderBottom: activeTab === 'final' ? '3px solid #16a34a' : '3px solid transparent',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                🏦 Bank Remark & Final Status {!canEditFinal && <Lock size={12} style={{ color: '#94a3b8' }} />}
              </button>
            )}

            {/* 4. Timeline Log */}
            <button
              onClick={() => setActiveTab('timeline')}
              style={{
                background: activeTab === 'timeline' ? '#f8fafc' : 'none',
                border: 'none',
                padding: '10px 16px',
                borderRadius: '8px',
                fontWeight: activeTab === 'timeline' ? 800 : 600,
                fontSize: '13px',
                color: activeTab === 'timeline' ? '#475569' : '#64748b',
                borderBottom: activeTab === 'timeline' ? '3px solid #475569' : '3px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              📜 Audit Log
            </button>
          </div>

          {/* ═════════ TAB 1: QD (QUALIFICATION DETAILS — EDITABLE BY PARTNER ONLY) ═════════ */}
          {activeTab === 'qd' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#1e3a8a', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    📋 QD (Customer Quick Details)
                  </h4>
                  {!canEditQd && (
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Lock size={12} /> Read-Only Mode (Partner Edit Only)
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', fontSize: '13px' }}>
                  
                  <div>
                    <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Aadhaar Link Contact Number *</label>
                    <input
                      type="text"
                      disabled={!canEditQd}
                      value={customerMobile}
                      onChange={(e) => setCustomerMobile(e.target.value)}
                      placeholder="9876543210"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 700, background: !canEditQd ? '#f8fafc' : '#fff' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Name As Per PAN Card</label>
                    <input
                      type="text"
                      disabled={!canEditQd}
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Customer PAN Name"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 700, background: !canEditQd ? '#f8fafc' : '#fff' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>DOB As Per PAN Card (dd-mm-yyyy)</label>
                    <input
                      type="text"
                      disabled={!canEditQd}
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      placeholder="dd-mm-yyyy"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: !canEditQd ? '#f8fafc' : '#fff' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Personal Email ID</label>
                    <input
                      type="email"
                      disabled={!canEditQd}
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="email@example.com"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: !canEditQd ? '#f8fafc' : '#fff' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>PAN Card Number</label>
                    <input
                      type="text"
                      disabled={!canEditQd}
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                      placeholder="ABCDE1234F"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 800, fontFamily: 'monospace', textTransform: 'uppercase', background: !canEditQd ? '#f8fafc' : '#fff' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>As Per Salary Slip Company Name</label>
                    <input
                      type="text"
                      disabled={!canEditQd}
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Company Name"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: !canEditQd ? '#f8fafc' : '#fff' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Designation</label>
                    <input
                      type="text"
                      disabled={!canEditQd}
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="Designation / Role"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: !canEditQd ? '#f8fafc' : '#fff' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Current Home Address with Landmark & Pincode</label>
                    <input
                      type="text"
                      disabled={!canEditQd}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Home address with landmark & pincode"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: !canEditQd ? '#f8fafc' : '#fff' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Full Company Address</label>
                    <input
                      type="text"
                      disabled={!canEditQd}
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      placeholder="Full official office address"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: !canEditQd ? '#f8fafc' : '#fff' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Mother Name</label>
                    <input
                      type="text"
                      disabled={!canEditQd}
                      value={motherName}
                      onChange={(e) => setMotherName(e.target.value)}
                      placeholder="Mother Name"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: !canEditQd ? '#f8fafc' : '#fff' }}
                    />
                  </div>

                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                  {canEditQd ? (
                    <button
                      type="button"
                      onClick={() => handleSaveDetails('qd')}
                      disabled={actionLoading}
                      style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
                    >
                      {actionLoading ? 'Saving...' : 'Save QD Details 💾'}
                    </button>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, padding: '8px 14px', background: '#f1f5f9', borderRadius: '8px' }}>
                      🔒 QD Form is read-only for admin/ops roles. Editable by Partner only.
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* ═════════ TAB 2: REMARK (SOFT APPROVAL, VKYC STAGE, IQA STAGE, DISPATCH STATUS) ═════════ */}
          {activeTab === 'remark' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#c2410c', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    ⚙️ Operational Remarks & Processing Stage
                  </h4>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: '#fff7ed', color: '#c2410c' }}>
                    Editable by Admin, Operations & Partner
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
                  
                  {/* 1. Soft Approval Status */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Soft Approval Status</label>
                    <select
                      value={softApprovalStatus}
                      onChange={(e) => setSoftApprovalStatus(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff', fontWeight: 600 }}
                    >
                      <option value="Approval-income 25k">1. Approval-income 25k</option>
                      <option value="Approval-income 30k">2. Approval-income 30k</option>
                      <option value="Approval-NSDP-Cibil based">3. Approval-NSDP-Cibil based</option>
                    </select>
                  </div>

                  {/* 2. VKYC Stage */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>VKYC Stage</label>
                    <select
                      value={vkycStage}
                      onChange={(e) => setVkycStage(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff', fontWeight: 600 }}
                    >
                      <option value="VKYC Pending">1. VKYC Pending</option>
                      <option value="VKYC Complete">2. VKYC Complete</option>
                      <option value="VKYC Failed">3. VKYC Failed</option>
                    </select>
                  </div>

                  {/* 3. IQA Stage */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>IQA Stage</label>
                    <select
                      value={iqaStage}
                      onChange={(e) => setIqaStage(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff', fontWeight: 600 }}
                    >
                      <option value="IQA Sent">1. IQA Sent</option>
                      <option value="IQA Complete">2. IQA Complete</option>
                      <option value="IQA Pending">3. IQA Pending</option>
                      <option value="BLAZE Continue">4. BLAZE Continue</option>
                      <option value="BLAZE Decline">5. BLAZE Decline</option>
                    </select>
                  </div>

                  {/* 4. Dispatch Status */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Dispatch Status</label>
                    <select
                      value={dispatchStatus}
                      onChange={(e) => setDispatchStatus(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff', fontWeight: 600 }}
                    >
                      <option value="Dispatch Done">1. DISPATCH DONE</option>
                      <option value="WCP Stage">2. WCP STAGE</option>
                      <option value="E-sign Done">3. E-sign Done</option>
                      <option value="E-sign Pending">4. E-sign Pending</option>
                      <option value="RTB(ERROR)">5. RTB(ERROR)</option>
                    </select>
                  </div>

                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                  <button
                    type="button"
                    onClick={() => handleSaveDetails('remark')}
                    disabled={actionLoading}
                    style={{ background: '#ea580c', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
                  >
                    {actionLoading ? 'Saving...' : 'Save Remarks & Stage 💾'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═════════ TAB 3: FINAL (BANK REMARK, FINAL STATUS, RE-QD — EDITABLE BY ADMIN & OPS ONLY) ═════════ */}
          {activeTab === 'final' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#15803d', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    🏦 Bank Remark & Final Status
                  </h4>
                  {!canEditFinal && (
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Lock size={12} /> Read-Only Mode (Operations/Admin Edit Only)
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
                  
                  {/* 1. Bank Application Reference Number */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Bank Application Ref No.</label>
                    <input
                      type="text"
                      disabled={!canEditFinal}
                      value={appNumber || bankRefNumber}
                      onChange={(e) => {
                        setAppNumber(e.target.value);
                        setBankRefNumber(e.target.value);
                      }}
                      placeholder="Enter Bank Application Ref No."
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 700, fontFamily: 'monospace', background: !canEditFinal ? '#f8fafc' : '#fff' }}
                    />
                  </div>

                  {/* 2. VKYC Link with Open V-KYC Button */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>VKYC Link</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="text"
                        disabled={!canEditFinal}
                        value={vkycUrl}
                        onChange={(e) => setVkycUrl(e.target.value)}
                        placeholder="https://vkyc..."
                        style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', background: !canEditFinal ? '#f8fafc' : '#fff' }}
                      />
                      {vkycUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            const raw = (vkycUrl || '').trim();
                            if (!raw) return;
                            const target = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
                            window.open(target, '_blank', 'noopener,noreferrer');
                          }}
                          style={{ background: '#ea580c', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          Open V-KYC
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 3. Final Status from Bank / Current Stage */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Final Status from Bank / Current Stage</label>
                    <select
                      disabled={!canEditFinal}
                      value={finalStatus}
                      onChange={(e) => setFinalStatus(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: !canEditFinal ? '#f8fafc' : '#fff', fontWeight: 700 }}
                    >
                      <option value="App File Generated (Approved)">1. App file generated (approved)</option>
                      <option value="Decline">2. Decline</option>
                      <option value="In Process">3. In Process</option>
                      <option value="Technical Error">4. Technical Error</option>
                    </select>
                  </div>

                  {/* 4. Eligible for Re-QD */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Eligible for Re-QD</label>
                    <select
                      disabled={!canEditFinal}
                      value={eligibleReQd}
                      onChange={(e) => setEligibleReQd(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: !canEditFinal ? '#f8fafc' : '#fff', fontWeight: 600 }}
                    >
                      <option value="Yes">1. Yes</option>
                      <option value="No">2. No</option>
                    </select>
                  </div>

                  {/* 5. Bank Remark (Operations Head) */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Bank Remark (Operations Head)</label>
                    <textarea
                      disabled={!canEditFinal}
                      value={bankRemark}
                      onChange={(e) => setBankRemark(e.target.value)}
                      placeholder="Enter detailed bank remark (Operations Head edit only)..."
                      rows={3}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: !canEditFinal ? '#f8fafc' : '#fff' }}
                    />
                  </div>

                  {/* Decline Reason Remark */}
                  {(finalStatus === 'Decline' || finalStatus.toLowerCase().includes('decline')) && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626', display: 'block', marginBottom: '6px' }}>Decline Reason Remark</label>
                      <textarea
                        disabled={!canEditFinal}
                        value={declineReason}
                        onChange={(e) => setDeclineReason(e.target.value)}
                        placeholder="Specify reason for decline..."
                        rows={2}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #fecaca', fontSize: '13px', background: !canEditFinal ? '#f8fafc' : '#fff5f5' }}
                      />
                    </div>
                  )}

                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                  {canEditFinal ? (
                    <button
                      type="button"
                      onClick={() => handleSaveDetails('final')}
                      disabled={actionLoading}
                      style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
                    >
                      {actionLoading ? 'Saving...' : 'Save Final Status & Remarks 💾'}
                    </button>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, padding: '8px 14px', background: '#f1f5f9', borderRadius: '8px' }}>
                      🔒 Final Form is read-only for partner roles. Editable by Admin & Operations only.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═════════ TAB 4: AUDIT LOG / TIMELINE ═════════ */}
          {activeTab === 'timeline' && (
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', marginBottom: '16px' }}>Application Timeline & Audit Log</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {timeline.length === 0 ? (
                  <div style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '24px' }}>No timeline events recorded.</div>
                ) : (
                  timeline.map((event, idx) => (
                    <div key={event.id || idx} style={{ display: 'flex', gap: '14px', padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ea580c', marginTop: '4px' }} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>{event.title}</div>
                        <div style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>{event.description}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{new Date(event.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminDocumentVerificationModal;
