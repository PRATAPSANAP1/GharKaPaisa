import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useAuthStore } from '../../../app/store/authStore';
import { 
  X, CheckCircle, XCircle, Eye, Send, ShieldCheck, 
  Building2, User, Clock, AlertTriangle, FileText, Check, ArrowRight, ArrowLeft, Lock,
  Share2, Copy, MessageSquare, Smartphone, Save, Sliders, Activity
} from 'lucide-react';

const AdminDocumentVerificationModal = ({ application: rawApplication, app: rawApp, onClose, onRefresh, initialTab = 'qd', showAllTabs = false }) => {
  const application = rawApplication || rawApp || {};
  // Normalize initialTab ('qd' | 'remark' | 'final' | 'timeline' | legacy aliases)
  const getTabKey = (tab) => {
    if (tab === 'details' || tab === 'qd') return 'qd';
    if (tab === 'remark1' || tab === 'remark2' || tab === 'remark') return 'remark';
    if (tab === 'bank' || tab === 'final') return 'final';
    if (tab === 'timeline') return 'timeline';
    return 'qd';
  };

  const processTypeStr = String(application?.process_type || application?.process_by || '').toLowerCase();
  const isLinkedShare = processTypeStr.includes('linked_share') || processTypeStr.includes('link');
  const isDirectBank = processTypeStr.includes('direct_bank') || processTypeStr.includes('direct');
  const isDigitalProcess = isLinkedShare || isDirectBank;
  const isPhysical = processTypeStr.includes('physical');

  const initialTabKey = initialTab ? getTabKey(initialTab) : (isDigitalProcess ? 'remark' : 'qd');
  const [activeTab, setActiveTab] = useState(initialTabKey);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(getTabKey(initialTab));
    }
  }, [application?.id, initialTab]);

  // User Role & Permissions
  const user = useAuthStore((state) => state.user);
  const role = (user?.role || '').toUpperCase();
  const userDesignation = (user?.designation || '').toUpperCase();
  const isOpsOperator = ['ADMINISTRATIVE_OPERATOR', 'ADMINISTRATIVE OPERATOR', 'OPERATOR'].includes(role) || ['ADMINISTRATIVE OPERATOR', 'ADMINISTRATIVE_OPERATOR'].includes(userDesignation);
  const isOpsHead = ['ADMIN', 'SUPER_ADMIN', 'OPERATIONS_HEAD', 'OPERATIONAL_HEAD', 'OPERATIONS HEAD', 'OPERATIONAL HEAD'].includes(role) && !isOpsOperator;
  const isOpsOrAdmin = isOpsHead || isOpsOperator;
  const isPartner = ['PARTNER', 'TEAM_MEMBER'].includes(role) && !isOpsOrAdmin;

  const isPunchLead = processTypeStr.includes('punch') || processTypeStr.includes('lead_punching') || processTypeStr.includes('punching');
  const isDigital = isLinkedShare || isDirectBank;

  const [currentStatus, setCurrentStatus] = useState(application?.status || 'details_submitted');

  const isLockedStatus = ['approved', 'super_admin_approved', 'sanctioned', 'commission_processing', 'commission_released', 'commission_received', 'disbursed', 'rejected', 'cancelled'].includes(String(currentStatus || application?.status || '').toLowerCase());

  // Role & Status Access Rules:
  // After approved status, all form sections are locked for everyone.
  // Before approved status, QD, Remark, and Final forms are editable by admin/ops roles.
  const canEditQd = !isLockedStatus;
  const canEditRemark = !isLockedStatus;
  const canEditFinal = !isPartner && !isLockedStatus;

  const sanitizeVal = (val) => {
    if (!val || val === 'None' || val === 'none' || val === 'null' || val === 'undefined') return '';
    return val;
  };

  const formatDobInput = (val) => {
    if (!val) return '';
    const cleaned = val.replace(/\D/g, '').slice(0, 8);
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 4) return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 4)}-${cleaned.slice(4, 8)}`;
  };

  // 1. QD Customer Details State
  const [customerMobile, setCustomerMobile] = useState(application?.customer_mobile || application?.mobile || application?.phone || '');
  const [customerName, setCustomerName] = useState(application?.customer_name || application?.full_name || application?.name || '');
  const [dob, setDob] = useState(application?.dob || application?.date_of_birth || '');
  const [customerEmail, setCustomerEmail] = useState(application?.customer_email || application?.email || '');
  const [panNumber, setPanNumber] = useState(application?.pan_number || application?.pan || '');
  const [companyName, setCompanyName] = useState(application?.company_name || application?.employer_name || '');
  const [designation, setDesignation] = useState(application?.designation || application?.occupation || '');
  const [address1, setAddress1] = useState(application?.address1 || application?.flat_no || application?.address || '');
  const [address2, setAddress2] = useState(application?.address2 || application?.sub_area || '');
  const [landmark, setLandmark] = useState(application?.landmark || '');
  const [pincode, setPincode] = useState(application?.pincode || '');
  const [city, setCity] = useState(application?.city || '');
  const [state, setState] = useState(application?.state || '');
  const [companyAddress, setCompanyAddress] = useState(application?.company_address || application?.office_address || '');
  const [motherName, setMotherName] = useState(application?.mother_name || '');
  const [appNumber, setAppNumber] = useState(application?.app_number || application?.application_no || '');
  const [vkycUrl, setVkycUrl] = useState(application?.vkyc_url || application?.vkyc_link || '');

  // 2. Remark Form State (Appcode Status, Soft Approval, VKYC Stage, IQA Stage, Dispatch Status)
  const isSbi = String(application?.bank_name || application?.bank_code || '').toUpperCase().includes('SBI');
  const [appcodeStatus, setAppcodeStatus] = useState(sanitizeVal(application?.appcode_status) || sanitizeVal(application?.physical_details?.appcode_status));
  const [softApprovalStatus, setSoftApprovalStatus] = useState(sanitizeVal(application?.soft_approval_status) || sanitizeVal(application?.physical_details?.soft_approval_status));
  const [vkycStage, setVkycStage] = useState(sanitizeVal(application?.vkyc_stage) || sanitizeVal(application?.vkyc_status) || sanitizeVal(application?.physical_details?.vkyc_stage));
  const [iqaStage, setIqaStage] = useState(sanitizeVal(application?.iqa_stage) || sanitizeVal(application?.physical_details?.iqa_stage));
  const [dispatchStatus, setDispatchStatus] = useState(sanitizeVal(application?.dispatch_status) || sanitizeVal(application?.physical_details?.dispatch_status));

  // 3. Final Status & Bank Remarks State
  const [bankRemark, setBankRemark] = useState(sanitizeVal(application?.bank_remark) || sanitizeVal(application?.physical_details?.bank_remark));
  const [userRemark, setUserRemark] = useState(sanitizeVal(application?.user_remark) || sanitizeVal(application?.notes) || '');
  const [finalStatus, setFinalStatus] = useState(sanitizeVal(application?.final_status) || sanitizeVal(application?.physical_details?.final_status) || sanitizeVal(application?.status) || 'None');
  const [appFileGenerated, setAppFileGenerated] = useState(sanitizeVal(application?.app_file_generated) || sanitizeVal(application?.appfile_generated) || sanitizeVal(application?.physical_details?.app_file_generated) || 'None');
  const [declineReason, setDeclineReason] = useState(sanitizeVal(application?.decline_reason) || sanitizeVal(application?.physical_details?.decline_reason));
  const [eligibleReQd, setEligibleReQd] = useState(sanitizeVal(application?.eligible_reqd) || sanitizeVal(application?.physical_details?.eligible_reqd) || 'No');
  const [bankRefNumber, setBankRefNumber] = useState(sanitizeVal(application?.bank_ref_number) || sanitizeVal(application?.bank_application_number) || sanitizeVal(application?.physical_details?.bank_ref_number));
  const [approvedAmount, setApprovedAmount] = useState(sanitizeVal(application?.approved_amount) || sanitizeVal(application?.physical_details?.approved_amount) || sanitizeVal(application?.loan_amount));

  // 4. Real Database Status Snapshot (for Real DB Status vs Selected Status UI display)
  const [realData, setRealData] = useState({
    appcodeStatus: sanitizeVal(application?.appcode_status) || sanitizeVal(application?.physical_details?.appcode_status),
    softApprovalStatus: sanitizeVal(application?.soft_approval_status) || sanitizeVal(application?.physical_details?.soft_approval_status),
    vkycStage: sanitizeVal(application?.vkyc_stage) || sanitizeVal(application?.vkyc_status) || sanitizeVal(application?.physical_details?.vkyc_stage),
    iqaStage: sanitizeVal(application?.iqa_stage) || sanitizeVal(application?.physical_details?.iqa_stage),
    dispatchStatus: sanitizeVal(application?.dispatch_status) || sanitizeVal(application?.physical_details?.dispatch_status),
    finalStatus: sanitizeVal(application?.final_status) || sanitizeVal(application?.physical_details?.final_status) || sanitizeVal(application?.status) || 'In Process',
    bankRemark: sanitizeVal(application?.bank_remark) || sanitizeVal(application?.physical_details?.bank_remark),
    userRemark: sanitizeVal(application?.user_remark) || sanitizeVal(application?.notes)
  });

  // Share / Send to Customer State
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [smsSending, setSmsSending] = useState(false);

  const handleGenerateAndShare = async () => {
    setShareLoading(true);
    try {
      let finalUrl = shareUrl;
      if (!finalUrl) {
        const isPhysical = String(application?.process_type || application?.process_by || '').toLowerCase().includes('physical');
        const endpoint = isPhysical ? '/applications/generate-physical-link' : '/applications/generate-share-link';
        const res = await api.post(endpoint, {
          application_id: application.id,
          lead_id: application.lead_id || application.id,
          product_id: application.product_id || application.productId
        });
        if (res.data?.success && res.data.data?.share_url) {
          finalUrl = res.data.data.share_url;
          setShareUrl(finalUrl);
        } else if (application.share_token) {
          finalUrl = `${window.location.origin}/share/${application.share_token}`;
          setShareUrl(finalUrl);
        } else {
          finalUrl = `${window.location.origin}/share/${application.id}`;
          setShareUrl(finalUrl);
        }
      }

      if (navigator.share) {
        try {
          await navigator.share({
            title: 'GharKaPaisa Customer Form',
            text: `Dear ${customerName || 'Customer'}, please click link to submit your Quick Details (QD) for ${application.product_name || 'application'}:`,
            url: finalUrl
          });
        } catch (shareErr) {
          console.log('Native share closed:', shareErr);
        }
      } else {
        await navigator.clipboard.writeText(finalUrl);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate share link');
    } finally {
      setShareLoading(false);
    }
  };

  const handleSendSmsApi = async () => {
    if (!customerMobile) return alert('Customer mobile number is missing.');
    setSmsSending(true);
    try {
      const res = await api.post(`/applications/${application.id}/send-link`, {
        mobile: customerMobile
      });
      if (res.data?.success) {
        alert('SMS containing QD form link dispatched to customer successfully!');
      } else {
        alert(res.data?.message || 'Failed to send SMS');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error sending SMS to customer');
    } finally {
      setSmsSending(false);
    }
  };

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
        if (pd.address1 || pd.flat_no || app.address1 || app.address) setAddress1(pd.address1 || pd.flat_no || app.address1 || app.address || '');
        if (pd.address2 || pd.sub_area || app.address2) setAddress2(pd.address2 || pd.sub_area || app.address2 || '');
        if (pd.landmark || app.landmark) setLandmark(pd.landmark || app.landmark || '');
        if (pd.pincode || app.pincode || cust.pincode) setPincode(pd.pincode || app.pincode || cust.pincode || '');
        if (pd.city || app.city || cust.city) setCity(pd.city || app.city || cust.city || '');
        if (pd.state || app.state || cust.state) setState(pd.state || app.state || cust.state || '');
        if (pd.company_address || app.company_address) setCompanyAddress(pd.company_address || app.company_address || app.office_address || '');
        if (pd.mother_name || app.mother_name) setMotherName(pd.mother_name || app.mother_name || '');
        if (app.app_number) setAppNumber(app.app_number || app.application_no || '');
        if (app.bank_ref_number || app.bank_application_number || pd.bank_ref_number || pd.bank_application_number) setBankRefNumber(app.bank_ref_number || app.bank_application_number || pd.bank_ref_number || pd.bank_application_number || '');
        if (app.vkyc_url || pd.vkyc_url) setVkycUrl(app.vkyc_url || pd.vkyc_url || '');

        if (app.status) setCurrentStatus(app.status);
        const realAppcode = sanitizeVal(app.appcode_status) || sanitizeVal(pd.appcode_status);
        const realSoftApproval = sanitizeVal(app.soft_approval_status) || sanitizeVal(pd.soft_approval_status);
        const realVkyc = sanitizeVal(app.vkyc_stage) || sanitizeVal(app.vkyc_status) || sanitizeVal(pd.vkyc_stage);
        const realIqa = sanitizeVal(app.iqa_stage) || sanitizeVal(pd.iqa_stage);
        const realDispatch = sanitizeVal(app.dispatch_status) || sanitizeVal(pd.dispatch_status);
        const realFinal = sanitizeVal(app.final_status) || sanitizeVal(pd.final_status) || sanitizeVal(app.status) || 'In Process';
        const realRemark = sanitizeVal(app.bank_remark) || sanitizeVal(pd.bank_remark);
        const realUserRemark = sanitizeVal(app.user_remark) || sanitizeVal(app.notes) || '';

        setRealData({
          appcodeStatus: realAppcode,
          softApprovalStatus: realSoftApproval,
          vkycStage: realVkyc,
          iqaStage: realIqa,
          dispatchStatus: realDispatch,
          finalStatus: realFinal,
          bankRemark: realRemark,
          userRemark: realUserRemark
        });

        setAppcodeStatus(realAppcode);
        setSoftApprovalStatus(realSoftApproval);
        setVkycStage(realVkyc);
        setIqaStage(realIqa);
        setDispatchStatus(realDispatch);
        setBankRemark(realRemark);
        setUserRemark(realUserRemark);
        setFinalStatus(realFinal);
        if (app.decline_reason || pd.decline_reason) setDeclineReason(app.decline_reason || pd.decline_reason);
        if (app.eligible_reqd || pd.eligible_reqd) setEligibleReQd(app.eligible_reqd || pd.eligible_reqd);
        if (app.approved_amount || pd.approved_amount) setApprovedAmount(app.approved_amount || pd.approved_amount);
      }

      if (timelineRes?.data?.data) {
        setTimeline(timelineRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching verification details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [application?.id]);

  const handleSaveDetails = async (formType) => {
    setActionLoading(true);
    try {
      let payload = {
        user_remark: userRemark,
        notes: userRemark
      };
      if (formType === 'qd') {
        payload = {
          ...payload,
          customer_mobile: customerMobile,
          customer_name: customerName,
          dob,
          customer_email: customerEmail,
          pan_number: panNumber,
          company_name: companyName,
          designation,
          address1,
          address2,
          landmark,
          pincode,
          city,
          state,
          address: [address1, address2, landmark, city, state, pincode].filter(Boolean).join(', '),
          company_address: companyAddress,
          mother_name: motherName,
          app_number: appNumber,
          bank_application_number: bankRefNumber || undefined,
          bank_ref_number: bankRefNumber || undefined,
          vkyc_url: vkycUrl,
          status: 'submitted'
        };
      } else if (formType === 'remark') {
        payload = {
          ...payload,
          appcode_status: appcodeStatus,
          soft_approval_status: softApprovalStatus,
          iqa_stage: iqaStage,
          bank_ref_number: bankRefNumber,
          bank_application_number: bankRefNumber,
          vkyc_stage: vkycStage,
          vkyc_url: vkycUrl,
          dispatch_status: dispatchStatus
        };
        if (isOpsOrAdmin && !['approved', 'rejected', 'sanctioned'].includes(String(currentStatus).toLowerCase())) {
          payload.status = 'operational_verified';
        }
      } else if (formType === 'final') {
        let targetStatus = currentStatus;
        if (finalStatus && (finalStatus.toLowerCase().includes('decline') || finalStatus.toLowerCase().includes('reject'))) {
          targetStatus = 'rejected';
        } else if (finalStatus && finalStatus.toLowerCase().includes('approve')) {
          targetStatus = 'approved';
        }
        payload = {
          ...payload,
          bank_remark: bankRemark,
          final_status: finalStatus,
          app_file_generated: appFileGenerated,
          status: targetStatus
        };
      }

      const res = await api.put(`/applications/${application.id}/verification`, payload);
      if (res?.data?.success) {
        alert(`Application details saved successfully!`);
        await fetchData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update application details');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 10000,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: isMobile ? 'flex-end' : 'center',
      justifyContent: 'center',
      padding: isMobile ? '0' : '16px'
    }}>
      <div style={{
        background: '#ffffff',
        width: '100%',
        maxWidth: '920px',
        maxHeight: isMobile ? '92vh' : '94vh',
        borderRadius: isMobile ? '20px 20px 0 0' : '20px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)'
      }}>
        
        {/* Modal Header */}
        <div style={{ padding: isMobile ? '12px 16px' : '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Application #{appNumber || application.app_number || 'APP-REF'}
              </h3>
              <span style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '12px',
                background: (currentStatus === 'operational_verified' || currentStatus === 'approved') ? '#dcfce7' : (currentStatus === 'rejected') ? '#fee2e2' : '#ffedd5',
                color: (currentStatus === 'operational_verified' || currentStatus === 'approved') ? '#15803d' : (currentStatus === 'rejected') ? '#b91c1c' : '#c2410c'
              }}>
                {(currentStatus || application?.status || 'details_submitted').replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0', wordBreak: 'break-word' }}>
              Customer: <strong>{customerName || application.customer_name || 'Customer'}</strong> | Mobile: {customerMobile || application.customer_mobile} | Bank: {application.bank_name || application.bank_code || 'Partner Bank'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isOpsHead && currentStatus !== 'approved' && currentStatus !== 'super_admin_approved' && (
              <button
                disabled={actionLoading}
                onClick={async () => {
                  setActionLoading(true);
                  try {
                    const targetId = application.app_number || application.id || application.application_id || application.lead_id;
                    const res = await api.put(`/applications/${targetId}/verification`, {
                      status: 'approved',
                      final_status: 'Approved',
                      super_admin_remark: 'Approved by Operations Head / Super Admin',
                      bank_remark: 'Approved by Operations Head / Super Admin'
                    });
                    if (res.data?.success) {
                      alert('Application status updated to APPROVED successfully!');
                      setCurrentStatus('approved');
                      await fetchData();
                      if (onRefresh) onRefresh();
                    }
                  } catch (err) {
                    alert(err.response?.data?.message || 'Failed to approve application');
                  } finally {
                    setActionLoading(false);
                  }
                }}
                style={{
                  background: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 4px rgba(22,163,74,0.2)'
                }}
              >
                <CheckCircle size={15} /> Approve (Super Admin Approved)
              </button>
            )}

            {isOpsOperator && currentStatus !== 'operational_verified' && currentStatus !== 'approved' && currentStatus !== 'super_admin_approved' && (
              <button
                disabled={actionLoading}
                onClick={async () => {
                  setActionLoading(true);
                  try {
                    const targetId = application.app_number || application.id || application.application_id || application.lead_id;
                    const res = await api.put(`/applications/${targetId}/verification`, {
                      status: 'operational_verified',
                      final_status: 'Operational Verified',
                      ops_remark: 'Operational Verified by Administrative Operator',
                      super_admin_remark: 'Operational Verified by Administrative Operator'
                    });
                    if (res.data?.success) {
                      alert('Application status updated to OPERATIONAL VERIFIED successfully!');
                      setCurrentStatus('operational_verified');
                      await fetchData();
                      if (onRefresh) onRefresh();
                    }
                  } catch (err) {
                    alert(err.response?.data?.message || 'Failed to update application to Operational Verified');
                  } finally {
                    setActionLoading(false);
                  }
                }}
                style={{
                  background: '#8b5cf6',
                  color: '#ffffff',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 4px rgba(139,92,246,0.2)'
                }}
              >
                <CheckCircle size={15} /> Mark Operational Verified
              </button>
            )}
            <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', color: '#64748b', cursor: 'pointer', padding: '6px', borderRadius: '50%' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body Scrollable */}
        <div style={{ padding: isMobile ? '16px 16px 90px 16px' : '24px 24px 70px 24px', overflowY: 'auto', flex: 1 }}>
          

          {/* Navigation Tabs (Stage Specific View + Audit Log based on button clicked) */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '20px', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            
            {/* 1. QD Tab (Hidden for Digital processes) */}
            {!isDigitalProcess && (initialTabKey === 'qd' || showAllTabs) && (
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
                <FileText size={14} /> QD (Quick Details) {!canEditQd && <Lock size={12} style={{ color: '#94a3b8' }} />}
              </button>
            )}

            {/* 2. Remark Tab (Shown for all processes, titled Application Remark & Stage Tracking) */}
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
              <Sliders size={14} /> Application Remark & Stage Tracking
            </button>

            {/* 3. Final Tab (Shown for all processes including Customer Apply & Direct Bank) */}
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
                <Building2 size={14} /> Bank Remark & Final Status {!canEditFinal && <Lock size={12} style={{ color: '#94a3b8' }} />}
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
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Clock size={14} /> Audit Log
            </button>
          </div>

          {/* ═════════ TAB 1: QD (QUALIFICATION DETAILS — EDITABLE BY PARTNER ONLY) ═════════ */}
          {activeTab === 'qd' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#1e3a8a', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileText size={16} /> QD (Customer Quick Details)
                    </h4>
                    {!canEditQd && (
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Lock size={12} /> Locked (Approved Status)
                      </span>
                    )}
                  </div>
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
                      onChange={(e) => setDob(formatDobInput(e.target.value))}
                      placeholder="dd-mm-yyyy"
                      maxLength={10}
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
                    <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Address Line 1</label>
                    <input
                      type="text"
                      disabled={!canEditQd}
                      value={address1}
                      onChange={(e) => setAddress1(e.target.value)}
                      placeholder="Flat / House No / Building Name"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: !canEditQd ? '#f8fafc' : '#fff' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Address Line 2</label>
                    <input
                      type="text"
                      disabled={!canEditQd}
                      value={address2}
                      onChange={(e) => setAddress2(e.target.value)}
                      placeholder="Street / Area / Locality"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: !canEditQd ? '#f8fafc' : '#fff' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Landmark</label>
                    <input
                      type="text"
                      disabled={!canEditQd}
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="Nearby Landmark"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: !canEditQd ? '#f8fafc' : '#fff' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Pincode</label>
                    <input
                      type="text"
                      maxLength={6}
                      disabled={!canEditQd}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="e.g. 400001"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: !canEditQd ? '#f8fafc' : '#fff' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>City</label>
                    <input
                      type="text"
                      disabled={!canEditQd}
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Mumbai / Delhi"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: !canEditQd ? '#f8fafc' : '#fff' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>State</label>
                    <input
                      type="text"
                      disabled={!canEditQd}
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="e.g. Maharashtra"
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

                <div style={{
                  display: 'flex',
                  justify: 'flex-end',
                  gap: '12px',
                  marginTop: '20px',
                  position: 'sticky',
                  bottom: 0,
                  background: '#ffffff',
                  padding: '12px 0',
                  borderTop: '1px solid #e2e8f0',
                  zIndex: 20,
                  boxShadow: '0 -6px 16px rgba(0,0,0,0.06)'
                }}>
                  {canEditQd ? (
                    <button
                      type="button"
                      onClick={() => handleSaveDetails('qd')}
                      disabled={actionLoading}
                      style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', width: isMobile ? '100%' : 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <Save size={16} /> {actionLoading ? 'Saving...' : 'Save QD Details'}
                    </button>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, padding: '8px 14px', background: '#f1f5f9', borderRadius: '8px', width: '100%', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <Lock size={13} /> QD Form is read-only for admin/ops roles. Editable by Partner only.
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
                  <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#c2410c', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sliders size={16} /> Operational Remarks & Processing Stage
                  </h4>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
                  
                  {/* Order 1: APPCODE STATUS (Hidden for linked_share and direct_bank / direct_apply) */}
                  {!isLinkedShare && !isDirectBank && (
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>APPCODE STATUS</label>
                      <select
                        disabled={!canEditRemark}
                        value={appcodeStatus || 'None'}
                        onChange={(e) => setAppcodeStatus(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: !canEditRemark ? '#f8fafc' : '#fff', fontWeight: 600 }}
                      >
                        <option value="None">None</option>
                        <option value="Appcode Send">Appcode Send</option>
                        <option value="Appcode Pending">Appcode Pending</option>
                        <option value="Appcode submit">Appcode submit</option>
                        {appcodeStatus && !['None', 'Appcode Send', 'Appcode Pending', 'Appcode submit', ''].includes(appcodeStatus) && (
                          <option value={appcodeStatus}>{appcodeStatus}</option>
                        )}
                      </select>
                    </div>
                  )}

                  {/* Order 2: SOFT APPROVAL STATUS */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>SOFT APPROVAL STATUS</label>
                    <select
                      disabled={!canEditRemark}
                      value={softApprovalStatus || 'None'}
                      onChange={(e) => setSoftApprovalStatus(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: !canEditRemark ? '#f8fafc' : '#fff', fontWeight: 600 }}
                    >
                      <option value="None">None</option>
                      <option value="Approve">Approve</option>
                      <option value="Decline">Decline</option>
                      <option value="EQT">EQT</option>
                      <option value="Technical Error">Technical Error</option>
                      {softApprovalStatus && !['None', 'Approve', 'Decline', 'EQT', 'Technical Error', ''].includes(softApprovalStatus) && (
                        <option value={softApprovalStatus}>{softApprovalStatus}</option>
                      )}
                    </select>
                  </div>

                  {/* Order 3: IQA STAGE */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>IQA STAGE</label>
                    <select
                      disabled={!canEditRemark}
                      value={iqaStage || 'None'}
                      onChange={(e) => setIqaStage(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: !canEditRemark ? '#f8fafc' : '#fff', fontWeight: 600 }}
                    >
                      <option value="None">None</option>
                      <option value="IQT Send">IQT Send</option>
                      <option value="IQT Pending">IQT Pending</option>
                      <option value="IQT Complete">IQT Complete</option>
                      <option value="Blaze Continue">Blaze Continue</option>
                      <option value="Blaze Decline">Blaze Decline</option>
                      {iqaStage && !['None', 'IQT Send', 'IQT Pending', 'IQT Complete', 'Blaze Continue', 'Blaze Decline', ''].includes(iqaStage) && (
                        <option value={iqaStage}>{iqaStage}</option>
                      )}
                    </select>
                  </div>

                  {/* Order 4: BANK APPLICATION NUMBER */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>BANK APPLICATION NUMBER (13-digit number)</label>
                    <input
                      type="text"
                      maxLength={13}
                      disabled={!canEditRemark}
                      value={bankRefNumber}
                      onChange={(e) => setBankRefNumber(e.target.value.replace(/\D/g, '').slice(0, 13))}
                      placeholder="Enter 13-digit Bank App Reference Number"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 700, fontFamily: 'monospace', background: !canEditRemark ? '#f8fafc' : '#fff' }}
                    />
                  </div>

                  {/* Order 5: VKYC STAGE (Hidden for physical process) */}
                  {!isPhysical && (
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>VKYC STAGE</label>
                      <select
                        disabled={!canEditRemark}
                        value={vkycStage || 'None'}
                        onChange={(e) => setVkycStage(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: !canEditRemark ? '#f8fafc' : '#fff', fontWeight: 600 }}
                      >
                        <option value="None">None</option>
                        <option value="Pending">Pending</option>
                        <option value="Complete">Complete</option>
                        <option value="Failed">Failed</option>
                        {vkycStage && !['None', 'Pending', 'Complete', 'Failed', ''].includes(vkycStage) && (
                          <option value={vkycStage}>{vkycStage}</option>
                        )}
                      </select>
                    </div>
                  )}

                  {/* Order 6: VKYC LINK (Hidden for physical process) */}
                  {!isPhysical && (
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>VKYC LINK</label>
                      <input
                        type="url"
                        disabled={!canEditRemark}
                        value={vkycUrl}
                        onChange={(e) => setVkycUrl(e.target.value)}
                        placeholder="https://vkyc..."
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', background: !canEditRemark ? '#f8fafc' : '#fff' }}
                      />
                    </div>
                  )}

                  {/* Order 7: DISPATCH STATUS */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>DISPATCH STATUS</label>
                    <select
                      disabled={!canEditRemark}
                      value={dispatchStatus || 'None'}
                      onChange={(e) => setDispatchStatus(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: !canEditRemark ? '#f8fafc' : '#fff', fontWeight: 600 }}
                    >
                      <option value="None">None</option>
                      <option value="Dispatch Pending">Dispatch Pending</option>
                      <option value="Dispatch Complete">Dispatch Complete</option>
                      <option value="E-Sign Pending">E-Sign Pending</option>
                      <option value="E-sign Complete">E-sign Complete</option>
                      <option value="RTB(Error)">RTB(Error)</option>
                      {dispatchStatus && !['None', 'Dispatch Pending', 'Dispatch Complete', 'E-Sign Pending', 'E-sign Complete', 'RTB(Error)', ''].includes(dispatchStatus) && (
                        <option value={dispatchStatus}>{dispatchStatus}</option>
                      )}
                    </select>
                  </div>

                  {/* Order 8: USER REMARK (TEXT FIELD) */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', textTransform: 'uppercase' }}>
                      <MessageSquare size={14} /> USER REMARK (Employee / Partner Remark)
                    </label>
                    <textarea
                      disabled={isLockedStatus}
                      value={userRemark}
                      onChange={(e) => setUserRemark(e.target.value)}
                      placeholder="Enter user remark / notes for this application..."
                      rows={3}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #93c5fd', fontSize: '13px', background: isLockedStatus ? '#f8fafc' : '#eff6ff', fontWeight: 600, color: '#1e3a8a' }}
                    />
                  </div>

                </div>

                <div style={{
                  display: 'flex',
                  justify: 'flex-end',
                  gap: '12px',
                  marginTop: '20px',
                  position: 'sticky',
                  bottom: 0,
                  background: '#ffffff',
                  padding: '12px 0',
                  borderTop: '1px solid #e2e8f0',
                  zIndex: 20,
                  boxShadow: '0 -6px 16px rgba(0,0,0,0.06)'
                }}>
                  {canEditRemark ? (
                    <button
                      type="button"
                      onClick={() => handleSaveDetails('remark')}
                      disabled={actionLoading}
                      style={{ background: '#ea580c', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', width: isMobile ? '100%' : 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <Save size={16} /> {actionLoading ? 'Saving...' : 'Save Remarks & Stage'}
                    </button>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, padding: '8px 14px', background: '#f1f5f9', borderRadius: '8px', width: '100%', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <Lock size={13} /> Editing is disabled because application status is {currentStatus?.replace(/_/g, ' ')}.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═════════ TAB 3: FINAL (BANK REMARK, FINAL STATUS, RE-QD — EDITABLE BY ADMIN & OPS ONLY) ═════════ */}
          {activeTab === 'final' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#15803d', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building2 size={16} /> Bank Remark & Final Status
                  </h4>
                  {!canEditFinal && (
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Lock size={12} /> Read-Only Mode (Operations/Admin Edit Only)
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
                  
                  {/* 1. FINAL STATUS FROM BANK */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>1. FINAL STATUS FROM BANK</label>
                    <select
                      disabled={!canEditFinal}
                      value={finalStatus || 'None'}
                      onChange={(e) => setFinalStatus(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: !canEditFinal ? '#f8fafc' : '#fff', fontWeight: 700 }}
                    >
                      <option value="None">None</option>
                      <option value="In-Process">In-Process</option>
                      <option value="Approve">Approve</option>
                      <option value="Decline">Decline</option>
                      <option value="Technical Error">Technical Error</option>
                    </select>
                  </div>

                  {/* 2. App file generated */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>2. App file generated</label>
                    <select
                      disabled={!canEditFinal}
                      value={appFileGenerated || 'None'}
                      onChange={(e) => setAppFileGenerated(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: !canEditFinal ? '#f8fafc' : '#fff', fontWeight: 700 }}
                    >
                      <option value="None">None</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>

                  {/* 3. USER REMARK */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', textTransform: 'uppercase' }}>
                      <MessageSquare size={14} /> USER REMARK (Employee / Partner Remark)
                    </label>
                    <textarea
                      disabled={isLockedStatus}
                      value={userRemark}
                      onChange={(e) => setUserRemark(e.target.value)}
                      placeholder="Enter user remark / notes..."
                      rows={2}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #93c5fd', fontSize: '13px', background: isLockedStatus ? '#f8fafc' : '#eff6ff', fontWeight: 600, color: '#1e3a8a' }}
                    />
                  </div>

                  {/* 4. BANK REMARK */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>4. BANK REMARK</label>
                    <textarea
                      disabled={!canEditFinal}
                      value={bankRemark}
                      onChange={(e) => setBankRemark(e.target.value)}
                      placeholder="Enter Bank Remark..."
                      rows={3}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: !canEditFinal ? '#f8fafc' : '#fff' }}
                    />
                  </div>

                </div>

                <div style={{
                  display: 'flex',
                  justify: 'flex-end',
                  gap: '12px',
                  marginTop: '20px',
                  position: 'sticky',
                  bottom: 0,
                  background: '#ffffff',
                  padding: '12px 0',
                  borderTop: '1px solid #e2e8f0',
                  zIndex: 20,
                  boxShadow: '0 -6px 16px rgba(0,0,0,0.06)'
                }}>
                  {canEditFinal ? (
                    <button
                      type="button"
                      onClick={() => handleSaveDetails('final')}
                      disabled={actionLoading}
                      style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', width: isMobile ? '100%' : 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <Save size={16} /> {actionLoading ? 'Saving...' : 'Save Final Status & Remarks'}
                    </button>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, padding: '8px 14px', background: '#f1f5f9', borderRadius: '8px', width: '100%', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <Lock size={13} /> Editing is disabled because application status is {currentStatus?.replace(/_/g, ' ')}.
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

      {/* ═══ SHARE BY ALL APPS MODAL POPUP ═══ */}
      {showShareModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 20000,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justify: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '460px',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Share2 size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Send to Customer</h3>
                  <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>Share QD & Application link with customer</p>
                </div>
              </div>
              <button onClick={() => setShowShareModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', padding: '6px', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            {/* Share URL Box */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Customer Share Link</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  style={{ flex: 1, padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#ffffff', fontFamily: 'monospace', fontWeight: 600 }}
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    setCopySuccess(true);
                    setTimeout(() => setCopySuccess(false), 2000);
                  }}
                  style={{ background: copySuccess ? '#16a34a' : '#2563eb', color: '#ffffff', border: 'none', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
                >
                  {copySuccess ? <Check size={14} /> : <Copy size={14} />}
                  {copySuccess ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Share Options Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              
              {/* Option 1: Native Share Sheet (Share by All Apps) */}
              {navigator.share && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.share({
                      title: 'GharKaPaisa Application',
                      text: `Dear ${customerName || 'Customer'}, please click link to submit your Quick Details (QD) for ${application.product_name || 'application'}:`,
                      url: shareUrl
                    }).catch(() => {});
                  }}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}
                >
                  <Share2 size={16} /> Share via All Apps (Native Share Sheet)
                </button>
              )}

              {/* Option 2: WhatsApp Share */}
              <button
                type="button"
                onClick={() => {
                  const msg = encodeURIComponent(`Dear ${customerName || 'Customer'},\n\nPlease click the link below to submit your Quick Details (QD) for ${application.product_name || 'loan application'} with GharKaPaisa:\n\n${shareUrl}\n\nThank you!`);
                  const phone = customerMobile ? `91${customerMobile.replace(/\D/g, '').slice(-10)}` : '';
                  window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${msg}`, '_blank');
                }}
                style={{ width: '100%', padding: '12px', borderRadius: '10px', background: '#25D366', color: '#fff', border: 'none', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <MessageSquare size={16} /> Share via WhatsApp
              </button>

              {/* Option 3: Mobile SMS App Share */}
              <button
                type="button"
                onClick={() => {
                  const msg = encodeURIComponent(`Dear ${customerName || 'Customer'}, click link to submit your details for ${application.product_name || 'application'}: ${shareUrl}`);
                  const phone = customerMobile ? customerMobile.replace(/\D/g, '').slice(-10) : '';
                  window.open(`sms:${phone}?body=${msg}`, '_blank');
                }}
                style={{ width: '100%', padding: '12px', borderRadius: '10px', background: '#0284c7', color: '#fff', border: 'none', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Smartphone size={16} /> Send via Mobile SMS App
              </button>

              {/* Option 4: Dispatch Automatic SMS via MSG91 Gateway */}
              <button
                type="button"
                onClick={handleSendSmsApi}
                disabled={smsSending}
                style={{ width: '100%', padding: '12px', borderRadius: '10px', background: '#ea580c', color: '#fff', border: 'none', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Send size={16} /> {smsSending ? 'Sending SMS...' : 'Dispatch Automated SMS (MSG91)'}
              </button>

            </div>

            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <button type="button" onClick={() => setShowShareModal(false)} style={{ background: '#f1f5f9', border: 'none', padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDocumentVerificationModal;
