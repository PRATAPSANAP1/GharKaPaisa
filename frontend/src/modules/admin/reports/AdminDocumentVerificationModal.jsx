import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  X, CheckCircle, XCircle, Eye, Send, ShieldCheck, 
  Building2, User, Clock, AlertTriangle, FileText, Check, ArrowRight, ArrowLeft
} from 'lucide-react';
import ApplicationTracker from '../../../components/common/ApplicationTracker';

const AdminDocumentVerificationModal = ({ application, onClose, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('details'); // 'details' (Form 1) | 'bank' (Form 2) | 'timeline'
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Form 2 Status & Operations Head Remarks
  const [appcodeStatus, setAppcodeStatus] = useState(application?.appcode_status || 'Appcode Pending');
  const [softApprovalStatus, setSoftApprovalStatus] = useState(application?.soft_approval_status || 'Approval-income 25k');
  const [vkycStage, setVkycStage] = useState(application?.vkyc_stage || 'VKYC Pending');
  const [iqaStage, setIqaStage] = useState(application?.iqa_stage || 'IQA Pending');
  const [dispatchStatus, setDispatchStatus] = useState(application?.dispatch_status || 'E-sign Pending');
  const [bankRemark, setBankRemark] = useState(application?.bank_remark || '');
  const [finalStatus, setFinalStatus] = useState(application?.final_status || application?.status || 'In Process');
  const [declineReason, setDeclineReason] = useState(application?.decline_reason || application?.rejection_reason || '');
  const [eligibleReQd, setEligibleReQd] = useState(application?.eligible_reqd || 'No');
  
  const [bankRefNumber, setBankRefNumber] = useState(application?.bank_ref_number || application?.app_number || '');
  const [approvedAmount, setApprovedAmount] = useState(application?.approved_amount || application?.loan_amount || '');

  const API_BASE = '/api/v1';

  const fetchData = async () => {
    if (!application?.id) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const timelineRes = await axios.get(`${API_BASE}/applications/${application.id}/timeline`, { headers }).catch(() => ({ data: { data: [] } }));
      setTimeline(timelineRes.data.data || []);
    } catch (err) {
      console.error('Error loading application timeline details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [application?.id]);

  const handleUpdateBankStatus = async () => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      
      let backendStatus = 'under_review';
      if (finalStatus.toLowerCase().includes('approved') || finalStatus.toLowerCase().includes('generated')) backendStatus = 'approved';
      else if (finalStatus.toLowerCase().includes('decline') || finalStatus.toLowerCase().includes('rejected')) backendStatus = 'rejected';
      else if (finalStatus.toLowerCase().includes('process')) backendStatus = 'under_review';

      const res = await axios.put(
        `${API_BASE}/applications/${application.id}/bank-status`,
        {
          status: backendStatus,
          bank_ref_number: bankRefNumber || undefined,
          approved_amount: approvedAmount ? Number(approvedAmount) : undefined,
          rejection_reason: declineReason || undefined,
          appcode_status: appcodeStatus,
          soft_approval_status: softApprovalStatus,
          vkyc_stage: vkycStage,
          iqa_stage: iqaStage,
          dispatch_status: dispatchStatus,
          bank_remark: bankRemark,
          final_status: finalStatus,
          decline_reason: declineReason,
          eligible_reqd: eligibleReQd
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        alert(`Form 2 Status & Operations Remarks updated successfully!`);
        fetchData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update bank status');
    } finally {
      setActionLoading(false);
    }
  };

  const vkycLink = application?.vkyc_url || application?.vkyc_link || '';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: '#ffffff', width: '100%', maxWidth: '960px', maxHeight: '92vh', borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        
        {/* Modal Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Application #{application.app_number || application.bank_ref_number || 'APP-REF'}
              </h3>
              <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '12px', background: '#ffedd5', color: '#c2410c' }}>
                {application.status ? application.status.replace(/_/g, ' ').toUpperCase() : 'UNDER REVIEW'}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0', wordBreak: 'break-word' }}>
              Customer: <strong>{application.customer_name || application.full_name || application.name}</strong> | Mobile: {application.customer_mobile || application.mobile} | Bank: {application.bank_name || application.bank_code || 'SBI Bank'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
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

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '20px', gap: '24px' }}>
            <button
              onClick={() => setActiveTab('details')}
              style={{
                background: 'none',
                border: 'none',
                padding: '10px 4px',
                fontWeight: activeTab === 'details' ? 700 : 500,
                fontSize: '14px',
                color: activeTab === 'details' ? '#ea580c' : '#64748b',
                borderBottom: activeTab === 'details' ? '2px solid #ea580c' : 'none',
                cursor: 'pointer'
              }}
            >
              Form 1: Customer & Physical Application Details
            </button>

            <button
              onClick={() => setActiveTab('bank')}
              style={{
                background: 'none',
                border: 'none',
                padding: '10px 4px',
                fontWeight: activeTab === 'bank' ? 700 : 500,
                fontSize: '14px',
                color: activeTab === 'bank' ? '#ea580c' : '#64748b',
                borderBottom: activeTab === 'bank' ? '2px solid #ea580c' : 'none',
                cursor: 'pointer'
              }}
            >
              Form 2: Partners / Operations Remark & Bank Statuses
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              style={{
                background: 'none',
                border: 'none',
                padding: '10px 4px',
                fontWeight: activeTab === 'timeline' ? 700 : 500,
                fontSize: '14px',
                color: activeTab === 'timeline' ? '#ea580c' : '#64748b',
                borderBottom: activeTab === 'timeline' ? '2px solid #ea580c' : 'none',
                cursor: 'pointer'
              }}
            >
              Audit Timeline Log
            </button>
          </div>

          {/* FORM 1: CUSTOMER & PHYSICAL APPLICATION DETAILS */}
          {activeTab === 'details' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                  📋 Form 1: Customer Details & Identification Fields
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', fontSize: '13px' }}>
                  
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Aadhaar Link Contact Number *</div>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '14px', marginTop: '2px' }}>
                      {application.customer_mobile || application.mobile || application.phone || '9370470694'}
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Name As Per PAN Card *</div>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '14px', marginTop: '2px', textTransform: 'capitalize' }}>
                      {application.customer_name || application.full_name || application.name || 'pratap'}
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>DOB As Per PAN Card</div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px', marginTop: '2px' }}>
                      {application.dob || application.date_of_birth || 'dd-mm-yyyy'}
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Personal Email ID</div>
                    <div style={{ fontWeight: 700, color: '#334155', fontSize: '13px', marginTop: '2px' }}>
                      {application.customer_email || application.email || 'email@example.com'}
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>PAN Card Number *</div>
                    <div style={{ fontWeight: 800, color: '#ea580c', fontSize: '14px', fontFamily: 'monospace', marginTop: '2px', textTransform: 'uppercase' }}>
                      {application.pan_number || application.pan || 'ABCDE1234F'}
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>As Per Salary Slip Company Name</div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px', marginTop: '2px' }}>
                      {application.company_name || application.employer_name || 'Company Name'}
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Designation</div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px', marginTop: '2px' }}>
                      {application.designation || application.occupation || 'Designation / Role'}
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Current Home Address with Landmark & Pincode</div>
                    <div style={{ fontWeight: 700, color: '#334155', fontSize: '13px', marginTop: '2px' }}>
                      {application.address || application.residential_address || 'Address with landmark & pincode'} {application.pincode ? `- ${application.pincode}` : ''}
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Full Company Address</div>
                    <div style={{ fontWeight: 700, color: '#334155', fontSize: '13px', marginTop: '2px' }}>
                      {application.company_address || application.office_address || 'Full official company address'}
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Mother Name</div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px', marginTop: '2px' }}>
                      {application.mother_name || 'Mother Name'}
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Application Number</div>
                    <div style={{ fontWeight: 900, color: '#0284c7', fontSize: '14px', fontFamily: 'monospace', marginTop: '2px' }}>
                      {application.app_number || application.bank_ref_number || application.application_no || 'Bank Application Number'}
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>VKYC Link</div>
                    {vkycLink ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="text"
                          readOnly
                          value={vkycLink}
                          style={{ flex: 1, padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11px', background: '#fff' }}
                        />
                        <button
                          onClick={() => window.open(vkycLink, '_blank')}
                          style={{ background: '#ea580c', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Open
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>https://vkyc...</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Navigation Action Bar */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  onClick={() => setActiveTab('bank')}
                  style={{
                    background: '#f97316',
                    color: '#ffffff',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(249, 115, 22, 0.25)'
                  }}
                >
                  Next Form: Partners/Operation Remark <ArrowRight size={18} />
                </button>
              </div>

            </div>
          )}

          {/* FORM 2: PARTNERS / OPERATIONS REMARK & BANK STATUS WORKFLOW */}
          {activeTab === 'bank' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                  ⚙️ Form 2: Operations Remarks & Bank Status Update
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
                  
                  {/* 1. Appcode Status */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Appcode Status</label>
                    <select
                      value={appcodeStatus}
                      onChange={(e) => setAppcodeStatus(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff' }}
                    >
                      <option value="Appcode Pending">1. Appcode Pending</option>
                      <option value="Appcode Submit">2. Appcode Submit</option>
                    </select>
                  </div>

                  {/* 2. Soft Approval Status */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Soft Approval Status</label>
                    <select
                      value={softApprovalStatus}
                      onChange={(e) => setSoftApprovalStatus(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff' }}
                    >
                      <option value="Approval-income 25k">1. Approval-income 25k</option>
                      <option value="Approval-income 30k">2. Approval-income 30k</option>
                      <option value="Approval-NSDP-Cibil based">3. Approval-NSDP-Cibil based</option>
                    </select>
                  </div>

                  {/* 3. VKYC Stage */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>VKYC Stage</label>
                    <select
                      value={vkycStage}
                      onChange={(e) => setVkycStage(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff' }}
                    >
                      <option value="VKYC Pending">1. VKYC Pending</option>
                      <option value="VKYC Complete">2. VKYC Complete</option>
                      <option value="VKYC Failed">3. VKYC Failed</option>
                    </select>
                  </div>

                  {/* 4. IQA Stage */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>IQA Stage</label>
                    <select
                      value={iqaStage}
                      onChange={(e) => setIqaStage(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff' }}
                    >
                      <option value="IQA Sent">1. IQA Sent</option>
                      <option value="IQA Complete">2. IQA Complete</option>
                      <option value="IQA Pending">3. IQA Pending</option>
                      <option value="BLAZE Continue">4. BLAZE Continue</option>
                      <option value="BLAZE Decline">5. BLAZE Decline</option>
                    </select>
                  </div>

                  {/* 5. Dispatch Status */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Dispatch Status</label>
                    <select
                      value={dispatchStatus}
                      onChange={(e) => setDispatchStatus(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff' }}
                    >
                      <option value="Dispatch Done">1. DISPATCH DONE</option>
                      <option value="WCP Stage">2. WCP STAGE</option>
                      <option value="E-sign Done">3. E-sign Done</option>
                      <option value="E-sign Pending">4. E-sign Pending</option>
                      <option value="RTB(ERROR)">5. RTB(ERROR)</option>
                    </select>
                  </div>

                  {/* 6. Eligible for Re-QD */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Eligible for Re-QD</label>
                    <select
                      value={eligibleReQd}
                      onChange={(e) => setEligibleReQd(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff' }}
                    >
                      <option value="Yes">1. Yes</option>
                      <option value="No">2. No</option>
                    </select>
                  </div>

                </div>

                <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '20px 0' }} />

                {/* Bank Remarks & Final Stage Section */}
                <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#991b1b', margin: '0 0 14px 0', textTransform: 'uppercase' }}>
                  🏦 Bank Remark & Final Status (Operations Head Only)
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
                  
                  {/* Final Status from the Bank / Current Stage */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Final Status from Bank / Current Stage</label>
                    <select
                      value={finalStatus}
                      onChange={(e) => setFinalStatus(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff', fontWeight: 700 }}
                    >
                      <option value="App File Generated (Approved)">1. App file generated (approved)</option>
                      <option value="Decline">2. Decline</option>
                      <option value="In Process">3. In Process</option>
                      <option value="Technical Error">4. Technical Error</option>
                    </select>
                  </div>

                  {/* Bank Reference Number */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Bank Reference Number</label>
                    <input
                      type="text"
                      value={bankRefNumber}
                      onChange={(e) => setBankRefNumber(e.target.value)}
                      placeholder="Enter Bank Application Ref No."
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>

                  {/* Bank Remark (Operations Head) */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Bank Remark (Operations Head)</label>
                    <textarea
                      value={bankRemark}
                      onChange={(e) => setBankRemark(e.target.value)}
                      placeholder="Enter detailed bank remark (Operations Head edit only)..."
                      rows={3}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>

                  {/* Decline Reason Remark */}
                  {(finalStatus === 'Decline' || finalStatus.toLowerCase().includes('decline')) && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626', display: 'block', marginBottom: '6px' }}>Decline Reason Remark</label>
                      <textarea
                        value={declineReason}
                        onChange={(e) => setDeclineReason(e.target.value)}
                        placeholder="Specify reason for decline..."
                        rows={2}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #fecaca', fontSize: '13px', background: '#fff5f5' }}
                      />
                    </div>
                  )}

                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', flexWrap: 'wrap', gap: '12px' }}>
                  <button
                    onClick={() => setActiveTab('details')}
                    style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <ArrowLeft size={16} /> Back to Form 1
                  </button>

                  <button
                    onClick={handleUpdateBankStatus}
                    disabled={actionLoading}
                    style={{ background: '#16a34a', color: '#ffffff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <CheckCircle size={18} /> {actionLoading ? 'Saving Form 2 Status...' : 'Save & Update Bank Status'}
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: TIMELINE */}
          {activeTab === 'timeline' && (
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', marginBottom: '16px' }}>Application Timeline Log</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {timeline.map((event, idx) => (
                  <div key={event.id || idx} style={{ display: 'flex', gap: '14px', padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ea580c', marginTop: '4px' }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>{event.title}</div>
                      <div style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>{event.description}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{new Date(event.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDocumentVerificationModal;
