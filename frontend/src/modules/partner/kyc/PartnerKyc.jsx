import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../app/store/authStore';
import { usePartnerStore } from '../../../app/store/partnerStore';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import api from '../../../services/api';
import { Link } from 'react-router-dom';
import { 
  MdUploadFile, MdCheckCircle, MdPendingActions, MdError, 
  MdHelpOutline, MdSecurity, MdVisibility, MdDescription, 
  MdAccountBalance, MdTimeline, MdAssignment, MdInfoOutline,
  MdArrowForward, MdClose, MdLock
} from 'react-icons/md';

// Responsive Hook
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  const [isTablet, setIsTablet] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 768 && window.innerWidth < 1024 : false
  );
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return { isMobile, isTablet };
}

export default function PartnerKyc() {
  const { C, isDark } = useTheme();
  const S = makeS(C);
  const { isMobile, isTablet } = useIsMobile();

  const user = useAuthStore((state) => state.user);
  const profile = usePartnerStore((state) => state.profile);
  const fetchProfile = usePartnerStore((state) => state.fetchProfile);
  
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showGuidelines, setShowGuidelines] = useState(false);
  
  const [files, setFiles] = useState({
    pan: null,
    cancelled_cheque: null
  });

  const [documentNumbers, setDocumentNumbers] = useState({
    pan_number: ''
  });

  // Hover states for file uploads
  const [hovStates, setHovStates] = useState({
    pan: false,
    cancelled_cheque: false
  });

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleViewFile = async (docId) => {
    console.log('[KYC] handleViewFile called with docId:', docId);
    console.log('[KYC] current profile:', profile);
    if (!docId || docId === 'undefined') {
      alert('Secure document ID is missing. Please refresh the page or try re-logging.');
      return;
    }
    try {
      const res = await api.get(`/kyc/documents/${docId}/view`);
      if (res.data?.success && res.data?.data?.url) {
        window.open(res.data.data.url, '_blank');
      } else {
        alert('Failed to get secure view link');
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error generating secure view link');
    }
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('File size must be less than 5MB');
        return;
      }
      setFiles(prev => ({ ...prev, [type]: file }));
      setErrorMsg('');
    }
  };

  const setHov = (type, val) => {
    setHovStates(prev => ({ ...prev, [type]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!files.pan || !files.cancelled_cheque) {
      setErrorMsg('Please upload all required documents: PAN Card and Cancelled Cheque.');
      return;
    }
    if (!documentNumbers.pan_number.trim()) {
      setErrorMsg('Please enter your PAN Card number.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const formData = new FormData();
    formData.append('pan', files.pan);
    formData.append('cancelled_cheque', files.cancelled_cheque);
    formData.append('pan_number', documentNumbers.pan_number.trim());

    try {
      await api.post('/partner/upload-docs', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccessMsg('Documents uploaded successfully! Your KYC is now under review.');
      setFiles({ pan: null, cancelled_cheque: null });
      fetchProfile(); // Refresh profile to update KYC status
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to upload documents. Ensure your AWS S3 config is correct.');
    } finally {
      setLoading(false);
    }
  };

  const kycStatus = profile?.kyc_status || user?.kyc_status || 'pending';
  const isApproved = kycStatus === 'approved';
  const isUnderReview = kycStatus === 'under_review';
  const isRejected = kycStatus === 'rejected';

  // Colors & Themes matching instructions
  const primaryColor = '#2563EB';
  const secondaryColor = '#F59E0B';
  const successColor = '#10B981';
  const errorColor = '#EF4444';

  const themeBg = isDark 
    ? 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)' 
    : 'linear-gradient(135deg, #FFFFFF 0%, #EFF6FF 100%)';

  const cardBg = isDark ? '#1E293B' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(226, 232, 240, 0.8)';
  const cardShadow = isDark 
    ? '0 10px 30px -10px rgba(0,0,0,0.5)' 
    : '0 8px 30px -6px rgba(37, 99, 235, 0.04)';

  const textPrimary = isDark ? '#F1F5F9' : '#1E293B';
  const textSecondary = isDark ? '#94A3B8' : '#475569';
  const textLight = isDark ? '#64748B' : '#94A3B8';

  // Dynamic colors for the banner
  const bannerBg = isApproved 
    ? 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)' 
    : isUnderReview 
    ? 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)' 
    : isRejected 
    ? 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)' 
    : 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)';

  const bannerBorder = isApproved ? successColor : isUnderReview ? secondaryColor : isRejected ? errorColor : '#E2E8F0';
  const bannerColor = isApproved ? '#065F46' : isUnderReview ? '#92400E' : isRejected ? '#991B1B' : '#475569';

  const getDoc = (type) => {
    return profile?.kyc_documents?.find(d => d.doc_type === type);
  };

  const getUploadTime = (doc) => {
    if (!doc?.uploaded_at) return '';
    const date = new Date(doc.uploaded_at);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getStepState = (stepIndex) => {
    if (stepIndex === 1) return 'completed';
    if (stepIndex === 2) {
      return (isUnderReview || isApproved || isRejected) ? 'completed' : 'current';
    }
    if (stepIndex === 3) {
      if (isApproved) return 'completed';
      if (isUnderReview) return 'current';
      return 'pending';
    }
    if (stepIndex === 4) {
      if (isApproved) return 'completed';
      return 'pending';
    }
    return 'pending';
  };

  const getStepColor = (state) => {
    if (state === 'completed') return primaryColor;
    if (state === 'current') return secondaryColor;
    return textLight;
  };

  const getMostRecentUploadDate = () => {
    if (!profile?.kyc_documents || profile.kyc_documents.length === 0) return null;
    const dates = profile.kyc_documents
      .map(d => d.uploaded_at ? new Date(d.uploaded_at).getTime() : 0)
      .filter(t => t > 0);
    if (dates.length === 0) return null;
    const maxTime = Math.max(...dates);
    return new Date(maxTime).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const documentsToRender = [
    { key: 'pan', label: 'PAN Card', icon: <MdDescription size={20} color={secondaryColor} /> },
    { key: 'cancelled_cheque', label: 'Bank Account Proof', icon: <MdAccountBalance size={20} color={successColor} /> }
  ];

  return (
    <div style={{
      background: themeBg,
      minHeight: '100%',
      padding: isMobile ? '16px' : isTablet ? '20px 24px' : '24px 32px 48px 32px',
      overflowY: 'auto',
      overflowX: 'hidden',
      boxSizing: 'border-box'
    }}>
      {/* ──── HEADER SECTION ──── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: isMobile ? '24px' : '32px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: isMobile ? 'auto' : '200px' }}>
          <h1 style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: 800, color: textPrimary, margin: 0, letterSpacing: '-0.5px' }}>KYC Center</h1>
          <p style={{ fontSize: isMobile ? '13px' : '14px', color: textSecondary, margin: 0, lineHeight: 1.4 }}>Complete your identity verification to unlock all partner features.</p>
        </div>

        {/* Need Help Card */}
        <div style={{
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          boxShadow: cardShadow,
          borderRadius: '16px',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
          onClick={() => setShowGuidelines(true)}
        >
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: `${primaryColor}10`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: primaryColor
          }}>
            <MdHelpOutline size={20} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '12px', color: textSecondary, fontWeight: 500 }}>Need Help?</span>
            <span style={{ fontSize: '13px', color: primaryColor, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              View KYC Guidelines <MdArrowForward size={14} />
            </span>
          </div>
        </div>
      </div>

      {/* ──── MAIN GRID LAYOUT ──── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr' : '7fr 4fr',
        gap: isMobile ? '24px' : '32px',
        alignItems: 'start'
      }}>
        {/* LEFT COLUMN: Stepper + Status + Form/Documents */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Status Banner */}
          <div style={{
            background: bannerBg,
            border: `1px solid ${bannerBorder}`,
            borderRadius: isMobile ? '16px' : '20px',
            padding: isMobile ? '16px' : '24px',
            display: 'flex',
            alignItems: isMobile ? 'flex-start' : 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: isMobile ? '12px' : '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.01)'
          }}>
            <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '12px' : '18px', flex: 1, minWidth: isMobile ? 'auto' : '200px' }}>
              <div style={{
                width: isMobile ? '44px' : '52px',
                height: isMobile ? '44px' : '52px',
                borderRadius: isMobile ? '12px' : '14px',
                background: '#FFFFFF',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isApproved ? successColor : isUnderReview ? secondaryColor : isRejected ? errorColor : primaryColor,
                flexShrink: 0
              }}>
                {isApproved ? <MdCheckCircle size={isMobile ? 24 : 28} /> : 
                 isRejected ? <MdError size={isMobile ? 24 : 28} /> : 
                 <MdPendingActions size={isMobile ? 24 : 28} />}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                <h3 style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: 800, margin: 0, color: bannerColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {isRejected ? '🔴 KYC Rejected' : `Current Status: ${kycStatus.replace('_', ' ')}`}
                </h3>
                <p style={{ fontSize: isMobile ? '12px' : '13.5px', margin: 0, color: textSecondary, fontWeight: 500, lineHeight: 1.4 }}>
                  {isApproved && 'Your KYC is verified successfully. All platform features are now unlocked.'}
                  {isUnderReview && 'Your documents are currently being verified by our compliance team.'}
                  {isRejected && `Reason: ${profile?.rejection_reason || 'Invalid details'}. Please upload again.`}
                  {kycStatus === 'pending' && 'Please upload the required documents below to begin your account verification.'}
                </p>
              </div>
            </div>

            {/* Estimated Review Time badge */}
            <div style={{
              background: '#FFFFFF',
              border: `1px solid ${bannerBorder}30`,
              color: bannerColor,
              borderRadius: '8px',
              padding: isMobile ? '4px 10px' : '6px 12px',
              fontSize: isMobile ? '11px' : '12px',
              fontWeight: 700,
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}>
              {isApproved ? 'Verified Partner' :
               isUnderReview ? (getMostRecentUploadDate() ? `Submitted on: ${getMostRecentUploadDate()}` : 'Under Review') :
               isRejected ? 'Action Required' :
               'Awaiting Upload'}
            </div>
          </div>

          {/* Progress Stepper */}
          <div style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: isMobile ? '16px' : '20px',
            padding: isMobile ? '16px' : '24px',
            boxShadow: cardShadow
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative',
              flexWrap: isMobile ? 'wrap' : 'nowrap',
              gap: isMobile ? '8px' : '0'
            }}>
              {[
                { step: 1, label: 'Pending', sub: 'Completed' },
                { step: 2, label: 'Documents Uploaded', sub: isApproved || isUnderReview || isRejected ? 'Completed' : 'Current Step' },
                { step: 3, label: 'Under Review', sub: isApproved ? 'Completed' : isUnderReview ? 'In Progress' : 'Pending' },
                { step: 4, label: isRejected ? 'Rejected' : 'Approved', sub: isApproved ? 'Completed' : isRejected ? 'Action Required' : 'Pending' }
              ].map((s, idx) => {
                const state = getStepState(s.step);
                const stepColor = getStepColor(state);

                return (
                  <React.Fragment key={s.step}>
                    {/* Step Circle & Label */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      zIndex: 2,
                      width: isMobile ? 'auto' : '120px',
                      flex: isMobile ? '1' : 'auto',
                      minWidth: isMobile ? '60px' : 'auto'
                    }}>
                      <div style={{
                        width: isMobile ? '28px' : '32px',
                        height: isMobile ? '28px' : '32px',
                        borderRadius: '50%',
                        background: state === 'completed' ? `${successColor}10` : state === 'current' ? `${secondaryColor}15` : state === 'failed' ? `${errorColor}10` : isDark ? '#334155' : '#F1F5F9',
                        border: `2px solid ${stepColor}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: stepColor,
                        fontWeight: 700,
                        fontSize: isMobile ? '11px' : '13px',
                        transition: 'all 0.3s',
                        marginBottom: isMobile ? '6px' : '8px'
                      }}>
                        {state === 'completed' ? '✓' : state === 'failed' ? '✗' : s.step}
                      </div>
                      <span style={{ fontSize: isMobile ? '10px' : '12px', fontWeight: 700, color: textPrimary, textAlign: 'center', display: 'block', wordWrap: 'break-word' }}>
                        {isMobile ? s.step === 1 ? 'Pending' : s.step === 2 ? 'Upload' : s.step === 3 ? 'Review' : s.step === 4 ? (isRejected ? 'Rejected' : 'Approved') : s.label : s.label}
                      </span>
                      {!isMobile && <span style={{ fontSize: '10px', color: stepColor, textAlign: 'center', marginTop: '2px' }}>{s.sub}</span>}
                    </div>

                    {/* Line between circles */}
                    {idx < 3 && !isMobile && (
                      <div style={{
                        flex: 1,
                        height: '2px',
                        background: getStepState(s.step + 1) === 'completed' ? successColor : getStepState(s.step + 1) === 'failed' ? errorColor : getStepState(s.step) === 'completed' && getStepState(s.step + 1) === 'current' ? secondaryColor : isDark ? '#334155' : '#E2E8F0',
                        marginTop: '-24px',
                        zIndex: 1,
                        transition: 'all 0.3s'
                      }} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Submitted Documents List Card (if they exist) */}
          {profile?.kyc_documents && profile.kyc_documents.length > 0 && (
            <div style={{
              background: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: isMobile ? '16px' : '20px',
              padding: isMobile ? '20px' : '28px',
              boxShadow: cardShadow
            }}>
              <div style={{ borderBottom: `1px solid ${cardBorder}`, paddingBottom: isMobile ? '12px' : '16px', marginBottom: isMobile ? '16px' : '20px' }}>
                <h3 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 800, color: textPrimary, margin: 0 }}>Submitted Documents</h3>
                <p style={{ fontSize: isMobile ? '12px' : '13px', color: textSecondary, margin: '4px 0 0 0', lineHeight: 1.4 }}>
                  {isApproved ? 'Your uploaded documents are verified.' : isRejected ? 'Your previously uploaded documents were rejected. Please upload correct documents below.' : 'Your documents have been uploaded successfully. Verification is currently active.'}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {documentsToRender.map((docItem) => {
                  const dbDoc = getDoc(docItem.key);
                  console.log(`[KYC Render] type: ${docItem.key}, dbDoc:`, dbDoc);
                  const uploadTime = getUploadTime(dbDoc);

                  return (
                    <div key={docItem.key} style={{
                      display: 'flex',
                      alignItems: isMobile ? 'flex-start' : 'center',
                      justifyContent: 'space-between',
                      background: isDark ? '#1E293B' : '#F8FAFC',
                      border: `1px solid ${cardBorder}`,
                      borderRadius: isMobile ? '12px' : '16px',
                      padding: isMobile ? '12px 16px' : '16px 20px',
                      transition: 'transform 0.15s ease',
                      flexWrap: isMobile ? 'wrap' : 'nowrap',
                      gap: isMobile ? '12px' : '0'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '14px', flex: 1, minWidth: isMobile ? 'auto' : '200px' }}>
                        <div style={{
                          width: isMobile ? '36px' : '40px',
                          height: isMobile ? '36px' : '40px',
                          borderRadius: isMobile ? '8px' : '10px',
                          background: `${primaryColor}10`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {docItem.icon}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                          <span style={{ fontSize: isMobile ? '12px' : '13.5px', fontWeight: 700, color: textPrimary, wordWrap: 'break-word' }}>{docItem.label}</span>
                          <span style={{ fontSize: isMobile ? '10px' : '11px', color: textSecondary }}>
                            {dbDoc ? `Uploaded on ${uploadTime}` : 'Not Uploaded'}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                         {dbDoc && (
                          <span style={{
                            background: dbDoc.verified 
                              ? `${successColor}15` 
                              : isRejected 
                              ? `${errorColor}15` 
                              : isUnderReview 
                              ? `${secondaryColor}15` 
                              : `${secondaryColor}15`,
                            color: dbDoc.verified 
                              ? successColor 
                              : isRejected 
                              ? errorColor 
                              : secondaryColor,
                            padding: isMobile ? '3px 8px' : '4px 10px',
                            borderRadius: '6px',
                            fontSize: isMobile ? '10px' : '11px',
                            fontWeight: 700,
                            whiteSpace: 'nowrap'
                          }}>
                            {dbDoc.verified 
                              ? 'Verified' 
                              : isRejected 
                              ? 'Rejected' 
                              : isUnderReview 
                              ? 'Under Review' 
                              : 'Pending Verification'}
                          </span>
                        )}
                        {(dbDoc?.id || dbDoc?.doc_type) && (
                          <button
                            onClick={() => handleViewFile(dbDoc.id || dbDoc.doc_type)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              textDecoration: 'none',
                              fontSize: isMobile ? '12px' : '13px',
                              fontWeight: 700,
                              color: primaryColor,
                              border: `1px solid ${primaryColor}20`,
                              padding: isMobile ? '5px 10px' : '6px 12px',
                              borderRadius: '8px',
                              background: '#FFFFFF',
                              boxShadow: '0 2px 4px rgba(37,99,235,0.03)',
                              transition: 'all 0.2s',
                              cursor: 'pointer'
                            }}
                          >
                            <MdVisibility size={isMobile ? 14 : 15} /> View
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* View All Documents link to Vault */}
              <div style={{
                marginTop: isMobile ? '16px' : '24px',
                display: 'flex',
                justifyContent: 'center',
                borderTop: `1px solid ${cardBorder}`,
                paddingTop: isMobile ? '16px' : '20px'
              }}>
                <Link
                  to="/partner/vault"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    textDecoration: 'none',
                    fontSize: isMobile ? '13px' : '14px',
                    fontWeight: 700,
                    color: primaryColor,
                    background: `${primaryColor}10`,
                    padding: isMobile ? '8px 20px' : '10px 24px',
                    borderRadius: '10px',
                    transition: 'all 0.2s'
                  }}
                >
                  <MdUploadFile size={isMobile ? 14 : 16} /> View All Documents
                </Link>
              </div>
            </div>
          )}

          {/* Upload Documents Form */}
          {(!isApproved && !isUnderReview) && (
            <form onSubmit={handleSubmit} style={{
              background: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: isMobile ? '16px' : '20px',
              padding: isMobile ? '20px' : '32px',
              boxShadow: cardShadow,
              display: 'flex',
              flexDirection: 'column',
              gap: isMobile ? '16px' : '24px'
            }}>
              <div style={{ borderBottom: `1px solid ${cardBorder}`, paddingBottom: isMobile ? '12px' : '16px', marginBottom: '8px' }}>
                <h3 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 800, color: textPrimary, margin: 0 }}>
                  {isRejected ? 'Re-upload Identity Documents' : 'Identity Document Upload'}
                </h3>
                <p style={{ fontSize: isMobile ? '12px' : '13px', color: textSecondary, margin: '4px 0 0 0', lineHeight: 1.4 }}>Provide your government credentials. All uploads must be clearly readable original documents.</p>
              </div>

              {errorMsg && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: `${errorColor}10`,
                  border: `1px solid ${errorColor}20`,
                  color: errorColor,
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <MdInfoOutline size={18} /> {errorMsg}
                </div>
              )}

              {successMsg && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: `${successColor}10`,
                  border: `1px solid ${successColor}20`,
                  color: successColor,
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <MdCheckCircle size={18} /> {successMsg}
                </div>
              )}

              {/* PAN Number Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: textPrimary }}>PAN Card Number *</label>
                <input
                  type="text"
                  required
                  style={{ ...S.input, textTransform: 'uppercase', background: isDark ? '#1E293B' : '#F8FAFC', borderRadius: '12px', padding: '12px 16px' }}
                  placeholder="ABCDE1234F"
                  value={documentNumbers.pan_number}
                  onChange={(e) => setDocumentNumbers({...documentNumbers, pan_number: e.target.value.toUpperCase()})}
                />
              </div>

              {/* Upload Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: isMobile ? '16px' : '20px'
              }}>
                {[
                  { id: 'pan', label: 'PAN Card Photo *' },
                  { id: 'cancelled_cheque', label: 'Cancelled Cheque / Bank Passbook *' }
                ].map((upField) => (
                  <div key={upField.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: textPrimary }}>{upField.label}</label>
                    <div
                      onMouseEnter={() => setHov(upField.id, true)}
                      onMouseLeave={() => setHov(upField.id, false)}
                      style={{
                        border: `2px dashed ${hovStates[upField.id] ? primaryColor : isDark ? '#334155' : '#cbd5e1'}`,
                        borderRadius: isMobile ? '12px' : '16px',
                        padding: isMobile ? '20px 16px' : '24px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: hovStates[upField.id] ? `${primaryColor}05` : isDark ? '#1E293B' : '#F8FAFC',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        minHeight: isMobile ? '100px' : '120px',
                        width: '100%'
                      }}
                    >
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        required
                        onChange={(e) => handleFileChange(e, upField.id)}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          opacity: 0,
                          cursor: 'pointer',
                          zIndex: 5
                        }}
                      />
                      <MdUploadFile size={isMobile ? 28 : 32} style={{ color: hovStates[upField.id] ? primaryColor : textLight, marginBottom: '8px' }} />
                      <span style={{ fontSize: isMobile ? '12px' : '13px', fontWeight: 600, color: textPrimary, textAlign: 'center', padding: '0 8px', wordBreak: 'break-word' }}>
                        {files[upField.id] ? files[upField.id].name : 'Click to upload file'}
                      </span>
                      <span style={{ fontSize: isMobile ? '10px' : '11px', color: textSecondary, marginTop: '4px' }}>Max 5MB • JPG, PNG, PDF</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  ...S.btn('primary'),
                  background: primaryColor,
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: isMobile ? '12px' : '14px',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: isMobile ? '14px' : '15px',
                  fontWeight: 700,
                  boxShadow: `0 4px 14px ${primaryColor}30`,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginTop: '12px',
                  transition: 'all 0.2s'
                }}
              >
                {loading ? (
                  <span style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '2px solid #ffffff',
                    animation: 'spin 0.8s linear infinite',
                    display: 'inline-block'
                  }} />
                ) : <MdCheckCircle size={18} />}
                {loading ? 'Uploading Documents...' : 'Submit Documents for Verification'}
              </button>
            </form>
          )}

          {/* Security Banner */}
          <div style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: isMobile ? '16px' : '20px',
            padding: isMobile ? '16px' : '20px 24px',
            boxShadow: cardShadow,
            display: 'flex',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: isMobile ? '12px' : '16px',
            flexWrap: isMobile ? 'wrap' : 'nowrap'
          }}>
            <div style={{
              width: isMobile ? '36px' : '40px',
              height: isMobile ? '36px' : '40px',
              borderRadius: '50%',
              background: `${successColor}10`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: successColor,
              flexShrink: 0
            }}>
              <MdSecurity size={isMobile ? 18 : 22} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: isMobile ? 'auto' : '200px' }}>
              <span style={{ fontSize: isMobile ? '12px' : '13.5px', fontWeight: 700, color: textPrimary }}>Your Data is Safe</span>
              <span style={{ fontSize: isMobile ? '11px' : '12.5px', color: textSecondary, lineHeight: 1.4 }}>Your KYC documents are protected with bank-level encryption and stored securely.</span>
            </div>
            <Link to="/partner/settings" style={{ fontSize: isMobile ? '12px' : '13px', fontWeight: 700, color: primaryColor, textDecoration: 'none', whiteSpace: 'nowrap' }}>
              Learn More
            </Link>
          </div>

        </div>

        {/* RIGHT COLUMN: What happens next + Tips for Approval */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* What Happens Next Card */}
          <div style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, #1D4ED8 100%)`,
            borderRadius: isMobile ? '16px' : '20px',
            padding: isMobile ? '20px' : '28px',
            color: '#FFFFFF',
            boxShadow: '0 10px 30px rgba(37,99,235,0.15)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background design elements */}
            <div style={{
              position: 'absolute',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
              top: '-30px',
              right: '-30px'
            }} />

            <h3 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 800, margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MdTimeline size={isMobile ? 18 : 22} /> What Happens Next?
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
              {/* Vertical line connecting timeline steps */}
              <div style={{
                position: 'absolute',
                left: '11px',
                top: '16px',
                bottom: '16px',
                width: '2px',
                background: 'rgba(255,255,255,0.2)'
              }} />

              {[
                { text: 'Our team reviews your documents', desc: 'Compliance agents cross-check government DB registries.' },
                { text: 'You receive SMS & Email updates', desc: 'Real-time alerts sent instantly when validation status changes.' },
                { text: 'Once approved, all partner features unlock', desc: 'Unlock payouts, lead generator links, and product catalogs.' }
              ].map((step, idx) => (
                <div key={idx} style={{ display: 'flex', gap: isMobile ? '10px' : '14px', alignItems: 'start', position: 'relative', zIndex: 5 }}>
                  <div style={{
                    width: isMobile ? '20px' : '24px',
                    height: isMobile ? '20px' : '24px',
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    color: primaryColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isMobile ? '10px' : '11px',
                    fontWeight: 800,
                    flexShrink: 0
                  }}>
                    {idx + 1}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                    <span style={{ fontSize: isMobile ? '12px' : '13px', fontWeight: 700, lineHeight: 1.4 }}>{step.text}</span>
                    <span style={{ fontSize: isMobile ? '10px' : '11.5px', opacity: 0.8, lineHeight: 1.4 }}>{step.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom time banner */}
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: isMobile ? '10px 14px' : '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '8px' : '10px',
              marginTop: isMobile ? '16px' : '24px',
              backdropFilter: 'blur(4px)'
            }}>
              <MdPendingActions size={isMobile ? 16 : 18} />
              <span style={{ fontSize: isMobile ? '12px' : '13px', fontWeight: 700 }}>Review Time: 24–48 Hours</span>
            </div>
          </div>

          {/* Tips for Faster Approval Card */}
          <div style={{
            background: isDark ? '#1E293B' : '#ECFDF5',
            border: `1px solid ${isDark ? cardBorder : '#D1FAE5'}`,
            borderRadius: isMobile ? '16px' : '20px',
            padding: isMobile ? '20px' : '28px',
            boxShadow: cardShadow
          }}>
            <h3 style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: 800, color: isDark ? textPrimary : '#065F46', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MdAssignment size={isMobile ? 16 : 20} color={successColor} /> Tips for Faster Approval
            </h3>

            <ul style={{
              listStyleType: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {[
                { title: 'Upload clear images', desc: 'Text must not be blurred or out of focus.' },
                { title: 'Use original documents', desc: 'Do not use photos of photocopies or screens.' },
                { title: 'Ensure names match', desc: 'Aadhaar, PAN, and Bank details must match your profile.' },
                { title: 'File size below 5 MB', desc: 'Compress files if they exceed the size limits.' }
              ].map((tip, idx) => (
                <li key={idx} style={{ display: 'flex', gap: isMobile ? '8px' : '10px', alignItems: 'start' }}>
                  <span style={{ color: successColor, fontSize: isMobile ? '12px' : '14px', fontWeight: 900, lineHeight: 1.2 }}>✓</span>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <span style={{ fontSize: isMobile ? '12px' : '13px', fontWeight: 700, color: isDark ? textPrimary : '#065F46', lineHeight: 1.4 }}>{tip.title}</span>
                    <span style={{ fontSize: isMobile ? '10px' : '11px', color: isDark ? textSecondary : '#047857', lineHeight: 1.4 }}>{tip.desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* ──── KYC GUIDELINES HELP MODAL ──── */}
      {showGuidelines && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: '24px',
            width: '100%',
            maxWidth: '560px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: `1px solid ${cardBorder}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MdHelpOutline size={20} color={primaryColor} />
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: textPrimary, margin: 0 }}>KYC Compliance Guidelines</h3>
              </div>
              <button 
                onClick={() => setShowGuidelines(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: textSecondary,
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = isDark ? '#334155' : '#F1F5F9'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                <MdClose size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', overflowY: 'auto', maxHeight: '400px' }}>
              <p style={{ fontSize: '13px', color: textSecondary, margin: 0, lineHeight: 1.6 }}>
                Under regulatory guidelines, all digital partners must fulfill identity checking before commissions or wallets can be adjusted or withdrawn. Please review the criteria below:
              </p>

              {[
                { title: 'PAN Card Rules', details: 'Ensure you enter the exact 10-character alphanumeric PAN. The name printed on the card must match your bank account details.' },
                { title: 'Aadhaar Card Rules', details: 'Upload both the Front side (showing name and photo) and Back side (showing full address and barcodes) as individual files.' },
                { title: 'Bank Account Verification', details: 'Upload a clear, printed cancelled check showing your name, account number, and IFSC code, or a bank passbook first-page photo.' },
                { title: 'Encryption & Privacy', details: 'All documents are stored on secure AWS S3 buckets with server-side AES-256 encryption. We mask details on admin screens using global privacy switches.' }
              ].map((rule, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  background: isDark ? '#1E293B' : '#F8FAFC',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  borderLeft: `3px solid ${primaryColor}`
                }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: textPrimary }}>{rule.title}</span>
                  <span style={{ fontSize: '12px', color: textSecondary, lineHeight: 1.4 }}>{rule.details}</span>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: `1px solid ${cardBorder}`,
              display: 'flex',
              justifyContent: 'flex-end',
              background: isDark ? '#111827' : '#F8FAFC'
            }}>
              <button
                onClick={() => setShowGuidelines(false)}
                style={{
                  ...S.btn('primary'),
                  background: primaryColor,
                  borderRadius: '8px',
                  padding: '10px 24px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spin animation styles */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}
