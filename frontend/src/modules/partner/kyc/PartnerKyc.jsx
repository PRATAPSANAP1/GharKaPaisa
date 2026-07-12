import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../../app/store/authStore';
import { usePartnerStore } from '../../../app/store/partnerStore';
import { useTheme } from '../../../contexts/ThemeContext';
import api from '../../../services/api';
import { 
  MdUploadFile, MdCheckCircle, MdPendingActions, MdError, 
  MdHelpOutline, MdSecurity, MdVisibility, MdDescription, 
  MdAccountBalance, MdTimeline, MdAssignment, MdInfoOutline,
  MdArrowForward, MdClose, MdLock, MdVideocam, MdStop,
  MdRefresh, MdPlayArrow, MdDelete
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
  const { isMobile, isTablet } = useIsMobile();

  const user = useAuthStore((state) => state.user);
  const fetchProfile = usePartnerStore((state) => state.fetchProfile);
  const profile = usePartnerStore((state) => state.profile);

  // KYC details fetched from our backend
  const [kycData, setKycData] = useState({
    kyc_status: 'draft',
    rejection_reason: null,
    documents: [],
    video: null
  });

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showGuidelines, setShowGuidelines] = useState(false);

  // File uploads
  const [panFile, setPanFile] = useState(null);
  const [chequeFile, setChequeFile] = useState(null);
  const [panNumber, setPanNumber] = useState('');

  // Video recording states
  const [cameraActive, setCameraActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [videoBlob, setVideoBlob] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('');
  const [videoPlayUrl, setVideoPlayUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const videoChunksRef = useRef([]);
  const liveVideoRef = useRef(null);
  const timerRef = useRef(null);
  const elapsedRef = useRef(0);

  const loadKycDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get('/partner/kyc/details');
      if (res.data?.success) {
        const data = res.data.data;
        setKycData(data);
        const panDoc = data.documents?.find(d => d.doc_type === 'pan');
        if (panDoc?.doc_number) {
          setPanNumber(panDoc.doc_number);
        }

        if (data.video) {
          try {
            const viewRes = await api.get('/partner/kyc/documents/video/view');
            if (viewRes.data?.success && viewRes.data?.data?.url) {
              setVideoPlayUrl(viewRes.data.data.url);
            }
          } catch (videoErr) {
            console.error('Failed to load video signed url:', videoErr);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching KYC details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKycDetails();
    fetchProfile();
  }, []);

  // Compute progress percentage
  const getProgress = () => {
    const hasPan = kycData.documents?.some(d => d.doc_type === 'pan' && d.verification_status !== 'rejected');
    const hasCheque = kycData.documents?.some(d => d.doc_type === 'cancelled_cheque' && d.verification_status !== 'rejected');
    const hasVideo = kycData.video && kycData.video.verification_status !== 'rejected';
    
    let count = 0;
    if (hasPan) count++;
    if (hasCheque) count++;
    if (hasVideo) count++;

    if (count === 0) return 0;
    if (count === 1) return 33;
    if (count === 2) return 66;
    return 100;
  };

  // Document Helpers
  const getDoc = (type) => kycData.documents?.find(d => d.doc_type === type);
  const isDocApproved = (type) => getDoc(type)?.verification_status === 'approved';
  const isDocRejected = (type) => getDoc(type)?.verification_status === 'rejected';

  const isVideoApproved = () => kycData.video?.verification_status === 'approved';
  const isVideoRejected = () => kycData.video?.verification_status === 'rejected';

  // Camera & recording logic
  const startCamera = async () => {
    setErrorMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: true
      });
      streamRef.current = stream;
      setCameraActive(true);
      setVideoBlob(null);
      setVideoPreviewUrl('');
      
      setTimeout(() => {
        if (liveVideoRef.current) {
          liveVideoRef.current.srcObject = stream;
        }
      }, 200);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to access camera/microphone. Please ensure permissions are granted.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const autoUploadVideo = async (blob, duration) => {
    if (!blob) return;
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setUploadProgress(0);

    try {
      const formData = new FormData();
      const mimeType = MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : 'video/webm';
      const fileExt = mimeType.includes('mp4') ? 'mp4' : 'webm';
      // Wrap blob in a File object to bypass iOS Safari FormData filename bug
      const videoFile = new File([blob], `verification-video.${fileExt}`, { type: blob.type || mimeType });
      formData.append('video', videoFile);
      formData.append('duration', duration || 10);

      const res = await api.post('/partner/kyc/upload-video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      if (res.data?.success) {
        setSuccessMsg('Verification Video uploaded successfully!');
        deleteRecording();
        stopCamera();
        // Wait a tiny bit and reload details
        setTimeout(async () => {
          await loadKycDetails();
        }, 300);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Verification Video upload failed.');
    } finally {
      setActionLoading(false);
      setUploadProgress(0);
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    videoChunksRef.current = [];
    elapsedRef.current = 0;
    const mimeType = MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : 'video/webm';
    
    try {
      const recorder = new MediaRecorder(streamRef.current, { mimeType });
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          videoChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(videoChunksRef.current, { type: mimeType });
        setVideoBlob(blob);
        setVideoPreviewUrl(URL.createObjectURL(blob));
        // Auto upload the video!
        await autoUploadVideo(blob, elapsedRef.current);
      };

      recorder.start(10);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        elapsedRef.current += 1;
        setRecordingTime(elapsedRef.current);
        if (elapsedRef.current >= 60) {
          stopRecording();
        }
      }, 1000);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to start MediaRecorder.');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    stopCamera();
  };

  const deleteRecording = () => {
    setVideoBlob(null);
    setVideoPreviewUrl('');
    setRecordingTime(0);
  };

  // Upload handlers
  const handleUploadPan = async (selectedFile) => {
    const fileToUpload = selectedFile || panFile;
    if (!fileToUpload && !isDocApproved('pan')) return setErrorMsg('Please choose a file for PAN Card.');
    if (!panNumber.trim()) return setErrorMsg('Please enter your PAN Card number.');
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    try {
      const formData = new FormData();
      if (fileToUpload) formData.append('document', fileToUpload);
      formData.append('pan_number', panNumber.trim().toUpperCase());

      const res = await api.post('/partner/kyc/upload-pan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success) {
        setSuccessMsg('PAN Card uploaded successfully!');
        setPanFile(null);
        loadKycDetails();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'PAN Card upload failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadCheque = async (selectedFile) => {
    const fileToUpload = selectedFile || chequeFile;
    if (!fileToUpload) return setErrorMsg('Please choose a file for Cancelled Cheque.');
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const formData = new FormData();
      formData.append('document', fileToUpload);

      const res = await api.post('/partner/kyc/upload-cheque', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success) {
        setSuccessMsg('Cancelled Cheque uploaded successfully!');
        setChequeFile(null);
        loadKycDetails();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Cancelled Cheque upload failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewFile = async (docId) => {
    if (!docId || docId === 'undefined') {
      alert('Secure document ID is missing. Please refresh the page or try re-logging.');
      return;
    }
    try {
      const res = await api.get(`/partner/kyc/documents/${docId}/view`);
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

  const handleUploadVideo = async () => {
    if (!videoBlob) return setErrorMsg('Please record a video verification first.');
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setUploadProgress(0);

    try {
      const formData = new FormData();
      const mimeType = MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : 'video/webm';
      const fileExt = mimeType.includes('mp4') ? 'mp4' : 'webm';
      // Wrap blob in a File object to bypass iOS Safari FormData filename bug
      const videoFile = new File([videoBlob], `verification-video.${fileExt}`, { type: videoBlob.type || mimeType });
      formData.append('video', videoFile);
      formData.append('duration', recordingTime);

      const res = await api.post('/partner/kyc/upload-video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      if (res.data?.success) {
        setSuccessMsg('Verification Video uploaded successfully!');
        deleteRecording();
        loadKycDetails();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Verification Video upload failed.');
    } finally {
      setActionLoading(false);
      setUploadProgress(0);
    }
  };

  const handleSubmitKyc = async () => {
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.post('/partner/kyc/submit');
      if (res.data?.success) {
        setSuccessMsg('KYC Verification Submitted Successfully!');
        loadKycDetails();
        fetchProfile();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'KYC Submission failed. Please ensure all 3 items are uploaded.');
    } finally {
      setActionLoading(false);
    }
  };

  // Styling Helpers
  const cardBg = isDark ? '#1E293B' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(226, 232, 240, 0.8)';
  const textPrimary = isDark ? '#F1F5F9' : '#1E293B';
  const textSecondary = isDark ? '#94A3B8' : '#475569';

  const status = kycData.kyc_status || 'draft';
  const isApproved = status === 'approved';
  const isUnderReview = status === 'under_review' || status === 'pending';
  const isRejected = status === 'rejected';

  return (
    <div style={{
      background: isDark ? 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' : 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',
      minHeight: '100%',
      padding: isMobile ? '16px' : isTablet ? '20px 24px 40px 24px' : '24px 32px 48px 32px',
      color: textPrimary,
      fontFamily: 'Inter, sans-serif',
      overflowX: 'hidden'
    }}>

      {/* Header */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        marginBottom: isMobile ? '20px' : '24px',
        gap: isMobile ? '12px' : '16px'
      }}>
        <div>
          <h1 style={{ fontSize: isMobile ? '22px' : isTablet ? '26px' : '32px', fontWeight: 800, margin: 0, wordBreak: 'break-word' }}>KYC Center</h1>
          <p style={{ fontSize: isMobile ? '13px' : '14px', color: textSecondary, margin: '4px 0 0 0', wordBreak: 'break-word' }}>Complete verification to unlock full dashboard capabilities.</p>
        </div>
        <button 
          onClick={() => setShowGuidelines(true)}
          style={{
            background: isDark ? '#334155' : '#E2E8F0',
            color: textPrimary,
            border: 'none',
            borderRadius: '10px',
            padding: isMobile ? '10px 16px' : '8px 16px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            width: isMobile ? '100%' : 'auto',
            justifyContent: isMobile ? 'center' : 'flex-start',
            flexShrink: 0
          }}
        >
          <MdHelpOutline size={16} /> Guidelines
        </button>
      </div>

      {/* Overview Status Banner */}
      <div style={{
        background: isApproved 
          ? 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)' 
          : isUnderReview 
          ? 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)' 
          : isRejected 
          ? 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)' 
          : 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
        border: `1px solid ${isApproved ? '#10B981' : isUnderReview ? '#F59E0B' : isRejected ? '#EF4444' : '#E2E8F0'}`,
        color: isApproved ? '#065F46' : isUnderReview ? '#92400E' : isRejected ? '#991B1B' : '#475569',
        borderRadius: isMobile ? '12px' : '16px',
        padding: isMobile ? '16px' : '20px',
        marginBottom: isMobile ? '20px' : '24px',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: isMobile ? '12px' : '16px'
      }}>
        <div style={{ fontSize: isMobile ? '24px' : '28px', flexShrink: 0 }}>
          {isApproved ? '✅' : isUnderReview ? '⏳' : isRejected ? '❌' : '📋'}
        </div>
        <div style={{ minWidth: 0, width: '100%' }}>
          <h3 style={{ margin: 0, fontSize: isMobile ? '14px' : '16px', fontWeight: 800, textTransform: 'uppercase', wordBreak: 'break-word' }}>
            {isApproved ? 'KYC Approved' : isUnderReview ? 'KYC Under Review' : isRejected ? 'KYC Rejected' : 'KYC Pending'}
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: isMobile ? '12.5px' : '13.5px', opacity: 0.9, wordBreak: 'break-word', lineHeight: 1.5 }}>
            {isApproved && 'Your identity is fully verified. You now have unrestricted access to Products, Wallet, and Leads.'}
            {isUnderReview && 'Your documentation has been submitted and is pending compliance team approval.'}
            {isRejected && `Reason: ${kycData.rejection_reason || 'Blurry document images'}. Please correct and re-upload the rejected items.`}
            {status === 'draft' && 'Please complete all three verification stages below and submit your documents.'}
          </p>
        </div>
      </div>

      {/* Progress Tracker */}
      <div style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: isMobile ? '12px' : '16px',
        padding: isMobile ? '16px' : '20px',
        marginBottom: isMobile ? '24px' : '32px',
        boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: isMobile ? '12.5px' : '13.5px', fontWeight: 700 }}>Verification Completion Progress</span>
          <span style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: 800, color: '#2563EB' }}>{getProgress()}%</span>
        </div>
        <div style={{ background: isDark ? '#334155' : '#E2E8F0', height: isMobile ? '8px' : '10px', borderRadius: '5px', overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(90deg, #2563EB, #3B82F6)', width: `${getProgress()}%`, height: '100%', transition: 'width 0.4s ease', borderRadius: '5px' }} />
        </div>
      </div>

      {/* Grid containing upload zones */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
        gap: isMobile ? '16px' : isTablet ? '20px' : '24px',
        marginBottom: isMobile ? '24px' : '32px'
      }}>

        {/* Card 1: PAN Card */}
        <div style={{
          background: cardBg,
          border: `1px solid ${isDocRejected('pan') ? '#EF4444' : cardBorder}`,
          borderRadius: isMobile ? '12px' : '16px',
          padding: isMobile ? '16px' : '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          opacity: (isApproved || isUnderReview) ? 0.75 : 1,
          boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
          wordBreak: 'break-word'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: isMobile ? '15px' : '16px', fontWeight: 800 }}>1. PAN Card</h3>
              {isDocApproved('pan') ? (
                <span style={{ color: '#10B981', fontWeight: 700, fontSize: '12px', background: '#ECFDF5', padding: '4px 8px', borderRadius: '6px' }}>Verified</span>
              ) : getDoc('pan') ? (
                <span style={{ color: isDocRejected('pan') ? '#EF4444' : '#F59E0B', fontWeight: 700, fontSize: '12px', background: isDocRejected('pan') ? '#FEF2F2' : '#FFFBEB', padding: '4px 8px', borderRadius: '6px' }}>
                  {isDocRejected('pan') ? 'Rejected' : 'Uploaded'}
                </span>
              ) : (
                <span style={{ color: '#64748B', fontWeight: 700, fontSize: '12px', background: '#F1F5F9', padding: '4px 8px', borderRadius: '6px' }}>Pending</span>
              )}
            </div>

            <p style={{ fontSize: isMobile ? '12px' : '13px', color: textSecondary, margin: '0 0 16px 0', lineHeight: 1.5 }}>Upload clear digital photo or PDF of your PAN Card. Max 5MB.</p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: textSecondary, display: 'block', marginBottom: '6px' }}>PAN Card Number</label>
              <input 
                type="text"
                disabled={isDocApproved('pan') || isUnderReview}
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value)}
                placeholder="Enter 10-digit PAN"
                maxLength={10}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px',
                  background: isDark ? '#0F172A' : '#F8FAFC',
                  border: `1px solid ${cardBorder}`,
                  borderRadius: '8px',
                  color: textPrimary,
                  textTransform: 'uppercase',
                  fontWeight: 600
                }}
              />
            </div>

            {!isDocApproved('pan') && !isUnderReview && (
              <div style={{ marginBottom: '16px' }}>
                <input 
                  type="file"
                  id="pan-file"
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setPanFile(file);
                      if (panNumber.trim()) {
                        handleUploadPan(file);
                      } else {
                        setErrorMsg('Please enter your PAN Card number first.');
                      }
                    }
                  }}
                  style={{ display: 'none' }}
                />
                <label 
                  htmlFor="pan-file"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    border: `2px dashed ${cardBorder}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    background: isDark ? '#1E293B' : '#F8FAFC'
                  }}
                >
                  <MdUploadFile size={24} color="#2563EB" />
                  <span style={{ fontSize: '12px', fontWeight: 600, marginTop: '8px', wordBreak: 'break-all', textAlign: 'center', maxWidth: '100%' }}>
                    {panFile ? panFile.name : 'Choose File'}
                  </span>
                </label>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '8px', marginTop: '16px' }}>
            {getDoc('pan') && (
              <button 
                onClick={() => handleViewFile(getDoc('pan').id)}
                style={{
                  flex: isMobile ? 'unset' : 1,
                  width: isMobile ? '100%' : 'auto',
                  background: 'transparent',
                  border: `1px solid ${cardBorder}`,
                  color: textPrimary,
                  borderRadius: '10px',
                  padding: isMobile ? '10px' : '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                View Upload
              </button>
            )}
            {!isDocApproved('pan') && !isUnderReview && (
              <button 
                onClick={handleUploadPan}
                disabled={actionLoading}
                style={{
                  flex: isMobile ? 'unset' : 2,
                  width: isMobile ? '100%' : 'auto',
                  background: '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: isMobile ? '10px' : '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {actionLoading ? 'Uploading...' : 'Upload PAN'}
              </button>
            )}
          </div>
        </div>

        {/* Card 2: Cancelled Cheque */}
        <div style={{
          background: cardBg,
          border: `1px solid ${isDocRejected('cancelled_cheque') ? '#EF4444' : cardBorder}`,
          borderRadius: isMobile ? '12px' : '16px',
          padding: isMobile ? '16px' : '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          opacity: (isApproved || isUnderReview) ? 0.75 : 1,
          boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
          wordBreak: 'break-word'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: isMobile ? '15px' : '16px', fontWeight: 800 }}>2. Bank Account Proof</h3>
              {isDocApproved('cancelled_cheque') ? (
                <span style={{ color: '#10B981', fontWeight: 700, fontSize: '12px', background: '#ECFDF5', padding: '4px 8px', borderRadius: '6px' }}>Verified</span>
              ) : getDoc('cancelled_cheque') ? (
                <span style={{ color: isDocRejected('cancelled_cheque') ? '#EF4444' : '#F59E0B', fontWeight: 700, fontSize: '12px', background: isDocRejected('cancelled_cheque') ? '#FEF2F2' : '#FFFBEB', padding: '4px 8px', borderRadius: '6px' }}>
                  {isDocRejected('cancelled_cheque') ? 'Rejected' : 'Uploaded'}
                </span>
              ) : (
                <span style={{ color: '#64748B', fontWeight: 700, fontSize: '12px', background: '#F1F5F9', padding: '4px 8px', borderRadius: '6px' }}>Pending</span>
              )}
            </div>

            <p style={{ fontSize: isMobile ? '12px' : '13px', color: textSecondary, margin: '0 0 16px 0', lineHeight: 1.5 }}>Upload cancelled cheque or latest bank account statement. Max 5MB.</p>

            {!isDocApproved('cancelled_cheque') && !isUnderReview && (
              <div style={{ marginBottom: '16px' }}>
                <input 
                  type="file"
                  id="cheque-file"
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setChequeFile(file);
                      handleUploadCheque(file);
                    }
                  }}
                  style={{ display: 'none' }}
                />
                <label 
                  htmlFor="cheque-file"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    border: `2px dashed ${cardBorder}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    background: isDark ? '#1E293B' : '#F8FAFC'
                  }}
                >
                  <MdUploadFile size={24} color="#2563EB" />
                  <span style={{ fontSize: '12px', fontWeight: 600, marginTop: '8px', wordBreak: 'break-all', textAlign: 'center', maxWidth: '100%' }}>
                    {chequeFile ? chequeFile.name : 'Choose File'}
                  </span>
                </label>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '8px', marginTop: '16px' }}>
            {getDoc('cancelled_cheque') && (
              <button 
                onClick={() => handleViewFile(getDoc('cancelled_cheque').id)}
                style={{
                  flex: isMobile ? 'unset' : 1,
                  width: isMobile ? '100%' : 'auto',
                  background: 'transparent',
                  border: `1px solid ${cardBorder}`,
                  color: textPrimary,
                  borderRadius: '10px',
                  padding: isMobile ? '10px' : '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                View Upload
              </button>
            )}
            {!isDocApproved('cancelled_cheque') && !isUnderReview && (
              <button 
                onClick={handleUploadCheque}
                disabled={actionLoading}
                style={{
                  flex: isMobile ? 'unset' : 2,
                  width: isMobile ? '100%' : 'auto',
                  background: '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: isMobile ? '10px' : '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {actionLoading ? 'Uploading...' : 'Upload Cheque'}
              </button>
            )}
          </div>
        </div>

        {/* Card 3: Video Verification */}
        <div style={{
          background: cardBg,
          border: `1px solid ${isVideoRejected() ? '#EF4444' : cardBorder}`,
          borderRadius: isMobile ? '12px' : '16px',
          padding: isMobile ? '16px' : '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          opacity: (isApproved || isUnderReview) ? 0.75 : 1,
          boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
          wordBreak: 'break-word'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: isMobile ? '15px' : '16px', fontWeight: 800 }}>3. Video Verification</h3>
              {isVideoApproved() ? (
                <span style={{ color: '#10B981', fontWeight: 700, fontSize: '12px', background: '#ECFDF5', padding: '4px 8px', borderRadius: '6px' }}>Verified</span>
              ) : kycData.video ? (
                <span style={{ color: isVideoRejected() ? '#EF4444' : '#F59E0B', fontWeight: 700, fontSize: '12px', background: isVideoRejected() ? '#FEF2F2' : '#FFFBEB', padding: '4px 8px', borderRadius: '6px' }}>
                  {isVideoRejected() ? 'Rejected' : 'Uploaded'}
                </span>
              ) : (
                <span style={{ color: '#64748B', fontWeight: 700, fontSize: '12px', background: '#F1F5F9', padding: '4px 8px', borderRadius: '6px' }}>Pending</span>
              )}
            </div>

            <p style={{ fontSize: isMobile ? '12px' : '13px', color: textSecondary, margin: '0 0 16px 0', lineHeight: 1.5 }}>Record a short browser video reading the official compliance declaration. Max 100MB.</p>

            {kycData.video && (
              <div style={{ borderRadius: '12px', overflow: 'hidden', border: `1px solid ${cardBorder}`, background: '#000000', height: isMobile ? '180px' : '140px', position: 'relative' }}>
                <video 
                  src={videoPlayUrl || videoPreviewUrl || kycData.video.video_url} 
                  controls 
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
            )}
          </div>

          <div style={{ marginTop: '16px' }}>
            {!isVideoApproved() && !isUnderReview && (
              <button 
                onClick={startCamera}
                style={{
                  width: '100%',
                  background: '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <MdVideocam size={18} />
                {kycData.video ? 'Re-record Video' : 'Record Video'}
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Video Recording Modal / Panel overlay if cameraActive */}
      {cameraActive && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.95)',
          display: 'flex',
          alignItems: isMobile ? 'stretch' : 'center',
          justifyContent: isMobile ? 'stretch' : 'center',
          zIndex: 9999,
          padding: isMobile ? '0' : '20px',
          overflowY: 'auto'
        }}>
          <div style={{
            background: isDark ? '#1E293B' : '#FFFFFF',
            borderRadius: isMobile ? '0' : '24px',
            width: '100%',
            maxWidth: isMobile ? '100%' : '680px',
            minHeight: isMobile ? '100%' : 'auto',
            padding: isMobile ? '16px' : '24px',
            border: isMobile ? 'none' : '1px solid rgba(255,255,255,0.1)',
            boxShadow: isMobile ? 'none' : '0 20px 40px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '16px' : '20px',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: isMobile ? '16px' : '18px', fontWeight: 800 }}>Record Verification Video</h3>
              <button 
                onClick={() => { stopCamera(); deleteRecording(); }}
                style={{ background: 'transparent', border: 'none', color: textSecondary, cursor: 'pointer' }}
              >
                <MdClose size={24} />
              </button>
            </div>

            {/* Declaration Script */}
            <div style={{
              background: isDark ? '#0F172A' : '#EFF6FF',
              borderLeft: '4px solid #2563EB',
              padding: isMobile ? '12px' : '16px',
              borderRadius: '8px'
            }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Please read this statement aloud:</span>
              <p style={{ margin: 0, fontSize: isMobile ? '12.5px' : '14px', fontWeight: 600, lineHeight: 1.6, color: textPrimary, wordBreak: 'break-word' }}>
                "My name is {profile ? `${profile.first_name} ${profile.last_name}` : (user ? `${user.first_name} ${user.last_name || ''}` : 'Partner')} and my partner code is {profile?.partner_code || user?.Partner_code || 'GKP'}. I confirm that I have read and understood all the Terms & Conditions of GharKaPaisa. I declare that all the information submitted by me is true and correct. I understand that providing false information may lead to account suspension."
              </p>
            </div>

            {/* Live Camera Box / Preview Box */}
            <div style={{
              borderRadius: isMobile ? '12px' : '16px',
              overflow: 'hidden',
              background: '#000000',
              height: isMobile ? '220px' : isTablet ? '280px' : '320px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {!videoPreviewUrl ? (
                <video 
                  id="live-preview"
                  ref={liveVideoRef}
                  autoPlay 
                  muted 
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                />
              ) : (
                <video 
                  src={videoPreviewUrl}
                  controls 
                  autoPlay
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              )}

              {/* Timer/Status Badge */}
              <div style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(0,0,0,0.7)',
                color: '#FFFFFF',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isRecording ? '#EF4444' : '#64748B', display: 'inline-block' }} />
                {isRecording ? `Recording: ${recordingTime}s / 60s` : 'Camera Ready'}
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: isMobile ? '12px' : '0' }}>
              <div>
                {!videoPreviewUrl ? (
                  !isRecording ? (
                    <button 
                      onClick={startRecording}
                      style={{
                        background: '#EF4444',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '12px',
                        padding: isMobile ? '12px 20px' : '10px 24px',
                        fontSize: isMobile ? '13px' : '14px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        width: isMobile ? '100%' : 'auto'
                      }}
                    >
                      <MdVideocam size={18} /> Start Recording
                    </button>
                  ) : (
                    <button 
                      onClick={stopRecording}
                      style={{
                        background: '#334155',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '12px',
                        padding: isMobile ? '12px 20px' : '10px 24px',
                        fontSize: isMobile ? '13px' : '14px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        width: isMobile ? '100%' : 'auto'
                      }}
                    >
                      <MdStop size={18} /> Stop Recording (Save)
                    </button>
                  )
                ) : (
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '8px', width: isMobile ? '100%' : 'auto' }}>
                    <button 
                      onClick={() => { deleteRecording(); startCamera(); }}
                      style={{
                        background: 'transparent',
                        border: `1px solid ${cardBorder}`,
                        color: textPrimary,
                        borderRadius: '12px',
                        padding: isMobile ? '12px 20px' : '10px 20px',
                        fontSize: isMobile ? '13px' : '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        width: isMobile ? '100%' : 'auto'
                      }}
                    >
                      <MdRefresh size={18} /> Record Again
                    </button>
                    <button 
                      onClick={handleUploadVideo}
                      disabled={actionLoading}
                      style={{
                        background: '#10B981',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '12px',
                        padding: isMobile ? '12px 20px' : '10px 24px',
                        fontSize: isMobile ? '13px' : '14px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        width: isMobile ? '100%' : 'auto',
                        textAlign: 'center'
                      }}
                    >
                      {actionLoading ? 'Uploading...' : 'Upload Video'}
                    </button>
                  </div>
                )}
              </div>

              {uploadProgress > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: isMobile ? '100%' : '120px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, textAlign: 'right' }}>Uploading: {uploadProgress}%</div>
                  <div style={{ height: '4px', background: '#E2E8F0', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${uploadProgress}%`, height: '100%', background: '#10B981' }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global Alerts */}
      {errorMsg && (
        <div style={{ background: '#FEF2F2', border: '1px solid #EF4444', color: '#991B1B', borderRadius: '12px', padding: isMobile ? '12px' : '16px', marginBottom: isMobile ? '16px' : '24px', fontSize: isMobile ? '12.5px' : '13.5px', fontWeight: 600, wordBreak: 'break-word' }}>
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div style={{ background: '#ECFDF5', border: '1px solid #10B981', color: '#065F46', borderRadius: '12px', padding: isMobile ? '12px' : '16px', marginBottom: isMobile ? '16px' : '24px', fontSize: isMobile ? '12.5px' : '13.5px', fontWeight: 600, wordBreak: 'break-word' }}>
          {successMsg}
        </div>
      )}

      {/* Submit Section */}
      {!isApproved && !isUnderReview && (
        <div style={{
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: isMobile ? '12px' : '16px',
          padding: isMobile ? '16px' : '24px',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'stretch' : 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: isMobile ? '15px' : '16px', fontWeight: 800 }}>Submit KYC for Approval</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: isMobile ? '12px' : '13px', color: textSecondary, wordBreak: 'break-word' }}>Ensure all three sections show "Uploaded" or "Verified" before clicking submit.</p>
          </div>
          <button 
            onClick={handleSubmitKyc}
            disabled={actionLoading || getProgress() < 100}
            style={{
              background: getProgress() < 100 ? '#64748B' : '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              padding: isMobile ? '14px 20px' : '12px 28px',
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: 800,
              cursor: getProgress() < 100 ? 'not-allowed' : 'pointer',
              boxShadow: getProgress() < 100 ? 'none' : '0 4px 14px rgba(37,99,235,0.3)',
              transition: 'all 0.2s',
              width: isMobile ? '100%' : 'auto',
              textAlign: 'center'
            }}
          >
            {actionLoading ? 'Submitting...' : 'Submit Verification'}
          </button>
        </div>
      )}

      {/* Guidelines Modal overlay */}
      {showGuidelines && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          display: 'flex',
          alignItems: isMobile ? 'stretch' : 'center',
          justifyContent: isMobile ? 'stretch' : 'center',
          zIndex: 9999,
          padding: isMobile ? '0' : '20px',
          overflowY: 'auto'
        }}>
          <div style={{
            background: isDark ? '#1E293B' : '#FFFFFF',
            borderRadius: isMobile ? '0' : '24px',
            width: '100%',
            maxWidth: isMobile ? '100%' : '520px',
            minHeight: isMobile ? '100%' : 'auto',
            padding: isMobile ? '20px' : '28px',
            border: isMobile ? 'none' : `1px solid ${cardBorder}`,
            boxShadow: isMobile ? 'none' : '0 20px 40px rgba(0,0,0,0.3)',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: isMobile ? '17px' : '20px', fontWeight: 800 }}>KYC Guidelines</h3>
              <button 
                onClick={() => setShowGuidelines(false)}
                style={{ background: 'transparent', border: 'none', color: textSecondary, cursor: 'pointer' }}
              >
                <MdClose size={24} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: isMobile ? '12.5px' : '13.5px', color: textSecondary, lineHeight: 1.6, wordBreak: 'break-word' }}>
              <p style={{ margin: 0 }}>To ensure quick verification, please verify the following instructions:</p>
              <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <li><strong>PAN Card:</strong> Make sure the text, photo, and signature are completely visible. No corners of the card should be cropped out.</li>
                <li><strong>Cancelled Cheque:</strong> Your printed name, account number, and IFSC code must be completely readable. Draw two parallel diagonal lines across the cheque writing "CANCELLED" clearly.</li>
                <li><strong>Video Declaration:</strong> Read the printed statement in a clear voice. Ensure your face is fully lit, looking straight at the camera. Do not wear sunglasses or hats.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
