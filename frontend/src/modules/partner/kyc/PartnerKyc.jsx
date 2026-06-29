import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../app/store/authStore';
import { usePartnerStore } from '../../../app/store/partnerStore';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import api from '../../../services/api';
import { MdUploadFile, MdCheckCircle, MdPendingActions, MdError } from 'react-icons/md';

export default function PartnerKyc() {
  const { C } = useTheme();
  const S = makeS(C);

  const user = useAuthStore((state) => state.user);
  const profile = usePartnerStore((state) => state.profile);
  const fetchProfile = usePartnerStore((state) => state.fetchProfile);
  
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const [files, setFiles] = useState({
    pan: null,
    cancelled_cheque: null
  });

  const [documentNumbers, setDocumentNumbers] = useState({
    pan_number: ''
  });

  const [panHov, setPanHov] = useState(false);
  const [chequeHov, setChequeHov] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!files.pan || !files.cancelled_cheque) {
      setErrorMsg('Please upload both PAN Card and Cancelled Cheque.');
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
    formData.append('pan_number', documentNumbers.pan_number);

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

  // Dynamic colors for the banner
  const bannerBg = isApproved ? `${C.green}15` : isUnderReview ? `${C.gold}15` : isRejected ? `${C.red}15` : `${C.bgSecondary}`;
  const bannerBorder = isApproved ? C.green : isUnderReview ? C.gold : isRejected ? C.red : C.border;
  const bannerColor = isApproved ? C.green : isUnderReview ? C.gold : isRejected ? C.red : C.text;

  return (
    <div style={{ maxWidth: '768px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: C.text, margin: 0 }}>KYC Center</h2>
        <p style={{ fontSize: '14px', color: C.textLight, margin: 0 }}>Complete your identity verification to unlock full partner features.</p>
      </div>

      {/* Status Banner */}
      <div style={{
        padding: '16px',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        background: bannerBg,
        border: `1px solid ${bannerBorder}`,
        color: bannerColor
      }}>
        {isApproved ? <MdCheckCircle size={24} style={{ color: C.green }} /> : 
         isRejected ? <MdError size={24} style={{ color: C.red }} /> : 
         <MdPendingActions size={24} style={{ color: C.gold }} />}
        
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, textTransform: 'uppercase', color: bannerColor }}>
            Current Status: {kycStatus}
          </h3>
          <p style={{ fontSize: '13px', margin: '4px 0 0 0', opacity: 0.9, color: C.textMid }}>
            {isApproved ? 'Your KYC is verified. You have full access to the platform.' :
             isUnderReview ? 'Your documents are currently being reviewed by our team.' :
             isRejected ? `Your KYC was rejected. Reason: ${profile?.rejection_reason || 'Invalid documents'}. Please re-submit.` :
             'Please upload your required documents below to begin verification.'}
          </p>
        </div>
      </div>

      {/* Upload Form */}
      {(!isApproved && !isUnderReview) && (
        <form onSubmit={handleSubmit} style={{
          background: C.card,
          borderRadius: '16px',
          border: `1px solid ${C.border}`,
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
        }}>
          {errorMsg && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '10px',
              background: `${C.red}15`,
              border: `1px solid ${C.red}30`,
              color: C.red,
              fontSize: '13px',
              fontWeight: 600
            }}>
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '10px',
              background: `${C.green}15`,
              border: `1px solid ${C.green}30`,
              color: C.green,
              fontSize: '13px',
              fontWeight: 600
            }}>
              {successMsg}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={S.label}>PAN Card Number *</label>
              <input
                type="text"
                required
                style={{ ...S.input, textTransform: 'uppercase' }}
                placeholder="ABCDE1234F"
                value={documentNumbers.pan_number}
                onChange={(e) => setDocumentNumbers({...documentNumbers, pan_number: e.target.value.toUpperCase()})}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={S.label}>Upload PAN Card (Image/PDF) *</label>
              <div 
                onMouseEnter={() => setPanHov(true)}
                onMouseLeave={() => setPanHov(false)}
                style={{
                  border: `2px dashed ${panHov ? C.teal : C.border}`,
                  borderRadius: '12px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: C.bgSecondary,
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <input 
                  type="file" 
                  accept=".jpg,.jpeg,.png,.pdf" 
                  onChange={(e) => handleFileChange(e, 'pan')}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer'
                  }}
                  required
                />
                <MdUploadFile size={36} style={{ color: C.textLight, marginBottom: '8px' }} />
                <span style={{ fontSize: '14px', fontWeight: 600, color: C.text, textAlign: 'center' }}>
                  {files.pan ? files.pan.name : 'Click or drag file to upload'}
                </span>
                <span style={{ fontSize: '11px', color: C.textLight, marginTop: '4px' }}>Max 5MB</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={S.label}>Upload Cancelled Cheque (Image/PDF) *</label>
              <div 
                onMouseEnter={() => setChequeHov(true)}
                onMouseLeave={() => setChequeHov(false)}
                style={{
                  border: `2px dashed ${chequeHov ? C.teal : C.border}`,
                  borderRadius: '12px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: C.bgSecondary,
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <input 
                  type="file" 
                  accept=".jpg,.jpeg,.png,.pdf" 
                  onChange={(e) => handleFileChange(e, 'cancelled_cheque')}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer'
                  }}
                  required
                />
                <MdUploadFile size={36} style={{ color: C.textLight, marginBottom: '8px' }} />
                <span style={{ fontSize: '14px', fontWeight: 600, color: C.text, textAlign: 'center' }}>
                  {files.cancelled_cheque ? files.cancelled_cheque.name : 'Click or drag file to upload'}
                </span>
                <span style={{ fontSize: '11px', color: C.textLight, marginTop: '4px' }}>Max 5MB</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...S.btn('primary'),
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '14px',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading && (
              <span style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderTop: '2px solid #ffffff',
                animation: 'spin 0.8s linear infinite',
                display: 'inline-block'
              }} />
            )}
            {loading ? 'Uploading Documents...' : 'Submit KYC Documents'}
          </button>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </form>
      )}
    </div>
  );
}
