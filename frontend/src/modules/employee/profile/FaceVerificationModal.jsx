import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Check, Camera, RefreshCw, ArrowRight, ShieldCheck, 
  AlertCircle, Sun, Eye, UserCheck, Loader2, Sparkles 
} from 'lucide-react';
import axios from 'axios';
import { getApiV1Url } from '../../../config/api';

export default function FaceVerificationModal({
  isOpen,
  onClose,
  onSuccess,
  employeeId = null,
  isReEnrollment = false,
  reEnrollReason = ''
}) {
  // Steps: 1 ('INSTRUCTIONS'), 2 ('CAMERA'), 3 ('REVIEW'), 4 ('PROCESSING'), 5 ('SUCCESS'), 'ERROR'
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [capturedPreviewUrl, setCapturedPreviewUrl] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [enrollmentResult, setEnrollmentResult] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Modal close handler
  const handleClose = useCallback(() => {
    stopCamera();
    setStep(1);
    setCapturedBlob(null);
    setCapturedPreviewUrl('');
    setSessionToken('');
    setErrorMsg('');
    onClose();
  }, [onClose, stopCamera]);

  // Clean up on unmount or close
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setStep(1);
      setCapturedBlob(null);
      setCapturedPreviewUrl('');
      setSessionToken('');
      setErrorMsg('');
    }
  }, [isOpen, stopCamera]);

  // Step 1 -> Step 2: Create Session & Start Camera
  const handleStartCamera = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // 1. Create Enrollment Session
      const sessionUrl = isReEnrollment 
        ? `${getApiV1Url()}/attendance/enrollment/re-enrollment/session`
        : `${getApiV1Url()}/attendance/enrollment/session`;

      const payload = isReEnrollment
        ? { employee_id: employeeId, reason: reEnrollReason || 'Super Admin Re-enrollment' }
        : (employeeId ? { employee_id: employeeId } : {});

      const sessionRes = await axios.post(sessionUrl, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!sessionRes.data?.success || !sessionRes.data?.data?.sessionToken) {
        throw new Error(sessionRes.data?.message || 'Failed to create enrollment session');
      }

      setSessionToken(sessionRes.data.data.sessionToken);
      setStep(2);

      // 2. Start Camera stream
      setTimeout(async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: 'user'
            },
            audio: false
          });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
          setCameraActive(true);
          setCameraError('');
        } catch (camErr) {
          console.error('Camera access error:', camErr);
          setCameraError('Camera access required. Please allow camera permissions in your browser.');
        }
      }, 300);

    } catch (err) {
      console.error('Enrollment session creation error:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Could not start face verification session');
      setStep('ERROR');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Capture Snapshot from Video Stream
  const handleCapturePhoto = () => {
    if (!videoRef.current) return;

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (blob) {
          const previewUrl = URL.createObjectURL(blob);
          setCapturedBlob(blob);
          setCapturedPreviewUrl(previewUrl);
          stopCamera();
          setStep(3); // Review step
        }
      }, 'image/jpeg', 0.95);
    } catch (err) {
      console.error('Capture snapshot error:', err);
      setCameraError('Failed to capture photo. Please try again.');
    }
  };

  // Step 3 -> Step 2: Retake Photo
  const handleRetakePhoto = () => {
    setCapturedBlob(null);
    setCapturedPreviewUrl('');
    setStep(2);
    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: false
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setCameraActive(true);
      } catch (e) {
        setCameraError('Camera error during retake.');
      }
    }, 200);
  };

  // Step 3 -> Step 4 -> Step 5: Submit Photo
  const handleSubmitPhoto = async () => {
    if (!capturedBlob || !sessionToken) {
      setErrorMsg('Captured image or session token is missing');
      setStep('ERROR');
      return;
    }

    setStep(4); // Processing step
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('session_token', sessionToken);
      formData.append('face_image', capturedBlob, 'kyc_face_reference.jpg');

      const commitUrl = isReEnrollment
        ? `${getApiV1Url()}/attendance/enrollment/re-enrollment/commit`
        : `${getApiV1Url()}/attendance/enrollment/commit`;

      const res = await axios.post(commitUrl, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Failed to enroll biometric face reference');
      }

      setEnrollmentResult(res.data.data);
      
      // Delay slightly for celebratory UX
      setTimeout(() => {
        setStep(5); // Success step
        if (onSuccess) {
          onSuccess(res.data.data);
        }
      }, 1000);

    } catch (err) {
      console.error('Biometric enrollment commit error:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Face verification enrollment failed. Please try again.');
      setStep('ERROR');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(17, 24, 39, 0.7)',
        backdropFilter: 'blur(6px)',
        padding: '16px'
      }}
      aria-live="polite"
    >
      <div style={{
        background: '#FFFFFF',
        borderRadius: '20px',
        padding: '28px',
        width: '100%',
        maxWidth: '480px',
        position: 'relative',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #E5E7EB',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header with Title & Stepper */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '20px',
          borderBottom: '1px solid #F3F4F6',
          paddingBottom: '14px'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#111827' }}>
              Face Verification
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#6B7280' }}>
              Create your secure KYC face reference
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close modal"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9CA3AF',
              cursor: 'pointer',
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

        {/* STEP 1: INSTRUCTIONS (Screen 2) */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column' }}
          >
            {/* Step 1 indicator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '18px' }}>
              <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#0B74F6', color: '#FFFFFF', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#0B74F6' }}>Instructions</span>
              <span style={{ color: '#D1D5DB' }}>──</span>
              <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#F3F4F6', color: '#9CA3AF', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
              <span style={{ fontSize: '13px', color: '#9CA3AF' }}>Camera</span>
              <span style={{ color: '#D1D5DB' }}>──</span>
              <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#F3F4F6', color: '#9CA3AF', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
            </div>

            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: '0 0 12px' }}>
              Before You Start
            </h3>

            {/* Instruction Checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
              {[
                'Keep your face clearly visible',
                'Remove mask and sunglasses',
                'Avoid caps that cover your face',
                'Stay in a well-lit area',
                'Look directly at the camera',
                'Keep your face inside the frame',
                'Use a plain/clear background'
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: '#374151' }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/* Security Notice */}
            <div style={{
              background: '#EFF6FF',
              border: '1px solid #DBEAFE',
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '22px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}>
              <ShieldCheck size={18} color="#0B74F6" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ fontSize: '12.5px', color: '#1E40AF', lineHeight: 1.4 }}>
                This photo will be used only as your registered KYC face reference for identity verification and future attendance.
              </span>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={handleClose}
                style={{
                  flex: 1,
                  height: '46px',
                  borderRadius: '12px',
                  border: '1px solid #E5E7EB',
                  background: '#FFFFFF',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleStartCamera}
                disabled={loading}
                style={{
                  flex: 1.5,
                  height: '46px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#0B74F6',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(11, 116, 246, 0.25)'
                }}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Continue'} <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: CAMERA CAPTURE (Screen 3) */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#111827' }}>Capture Face Photo</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#0B74F6', background: '#EFF6FF', padding: '2px 8px', borderRadius: '10px' }}>2 of 4</span>
            </div>

            {/* Live Camera View with Face Oval Overlay */}
            <div style={{
              position: 'relative',
              width: '100%',
              height: '320px',
              borderRadius: '16px',
              overflow: 'hidden',
              background: '#0F172A',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '14px'
            }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: 'scaleX(-1)' // Mirror view
                }}
              />

              {/* Oval Face Positioning Guide */}
              <div style={{
                position: 'absolute',
                width: '180px',
                height: '240px',
                borderRadius: '50%',
                border: '2.5px dashed rgba(255, 255, 255, 0.85)',
                boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.45)',
                pointerEvents: 'none'
              }} />

              {/* Bottom Instruction in Camera */}
              <div style={{
                position: 'absolute',
                bottom: '12px',
                background: 'rgba(15, 23, 42, 0.75)',
                color: '#FFFFFF',
                fontSize: '12.5px',
                fontWeight: 600,
                padding: '4px 12px',
                borderRadius: '14px'
              }}>
                Position your face inside the frame
              </div>
            </div>

            {cameraError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '10px 12px', borderRadius: '10px', fontSize: '13px', marginBottom: '14px' }}>
                {cameraError}
              </div>
            )}

            {/* Position indicator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px', color: '#16A34A', fontWeight: 600, marginBottom: '16px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16A34A' }} />
              Good position
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={handleClose}
                style={{
                  flex: 1,
                  height: '46px',
                  borderRadius: '12px',
                  border: '1px solid #E5E7EB',
                  background: '#FFFFFF',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCapturePhoto}
                style={{
                  flex: 1.8,
                  height: '46px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#0B74F6',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(11, 116, 246, 0.25)'
                }}
              >
                <Camera size={16} /> Capture Photo
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: REVIEW PHOTO (Screen 4) */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#111827' }}>Review Photo</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#0B74F6', background: '#EFF6FF', padding: '2px 8px', borderRadius: '10px' }}>3 of 4</span>
            </div>

            {/* Captured Preview Image */}
            <div style={{
              position: 'relative',
              width: '100%',
              height: '280px',
              borderRadius: '16px',
              overflow: 'hidden',
              background: '#0F172A',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '14px'
            }}>
              {capturedPreviewUrl && (
                <img
                  src={capturedPreviewUrl}
                  alt="Captured face preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              )}
            </div>

            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700, color: '#111827' }}>
                Review Your Photo
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#6B7280' }}>
                Make sure your face is clearly visible before submitting.
              </p>
            </div>

            {/* Action Buttons: Retake / Use This Photo */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={handleRetakePhoto}
                style={{
                  flex: 1,
                  height: '46px',
                  borderRadius: '12px',
                  border: '1px solid #E5E7EB',
                  background: '#FFFFFF',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <RefreshCw size={14} /> Retake Photo
              </button>

              <button
                type="button"
                onClick={handleSubmitPhoto}
                style={{
                  flex: 1.5,
                  height: '46px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#0B74F6',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(11, 116, 246, 0.25)'
                }}
              >
                Use This Photo <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 4: ENROLLMENT PROCESSING (Screen 5) */}
        {step === 4 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '16px 0' }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                border: '4px solid #E5E7EB',
                borderTopColor: '#0B74F6',
                marginBottom: '18px'
              }}
            />

            <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700, color: '#111827' }}>
              Saving your face verification photo...
            </h3>

            {/* Checklist */}
            <div style={{
              width: '100%',
              background: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '14px',
              padding: '16px 18px',
              margin: '18px 0 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#111827', fontWeight: 600 }}>
                <Check size={14} color="#16A34A" /> Validating image
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#111827', fontWeight: 600 }}>
                <Check size={14} color="#16A34A" /> Creating biometric reference
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#111827', fontWeight: 600 }}>
                <Check size={14} color="#16A34A" /> Storing securely
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#0B74F6', fontWeight: 600 }}>
                <Loader2 size={14} className="animate-spin" /> Finalizing enrollment...
              </div>
            </div>

            <span style={{ fontSize: '13px', color: '#6B7280' }}>
              Please wait...
            </span>
          </motion.div>
        )}

        {/* STEP 5: ENROLLMENT SUCCESS (Screen 6) */}
        {step === 5 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
          >
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: '#DCFCE7',
              color: '#16A34A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              boxShadow: '0 4px 16px rgba(22, 163, 74, 0.2)'
            }}>
              <Check size={40} strokeWidth={2.5} />
            </div>

            <h3 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 700, color: '#111827' }}>
              Face Verification Completed
            </h3>

            <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: '#6B7280', lineHeight: 1.4 }}>
              Your KYC face verification has been successfully completed.
            </p>

            {/* Information Card */}
            <div style={{
              width: '100%',
              background: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '14px',
              padding: '16px',
              marginBottom: '22px',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#6B7280' }}>Registered on</span>
                <strong style={{ color: '#111827' }}>
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#6B7280' }}>Reference</span>
                <strong style={{ color: '#0B74F6' }}>KYC Biometric</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#6B7280' }}>Status</span>
                <span style={{ color: '#16A34A', fontWeight: 700, background: '#DCFCE7', padding: '2px 8px', borderRadius: '10px' }}>Active</span>
              </div>
            </div>

            {/* Continue to Dashboard CTA */}
            <button
              type="button"
              onClick={handleClose}
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '12px',
                border: 'none',
                background: '#0B74F6',
                color: '#FFFFFF',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(11, 116, 246, 0.25)'
              }}
            >
              Continue to Dashboard
            </button>
          </motion.div>
        )}

        {/* ERROR STATE */}
        {step === 'ERROR' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '12px 0' }}
          >
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#FEE2E2',
              color: '#DC2626',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <AlertCircle size={34} />
            </div>

            <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: '#111827' }}>
              Face Verification Failed
            </h3>

            <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: '#6B7280', lineHeight: 1.4 }}>
              {errorMsg || 'An error occurred during face verification. Please try again.'}
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={handleClose}
                style={{
                  flex: 1,
                  height: '46px',
                  borderRadius: '12px',
                  border: '1px solid #E5E7EB',
                  background: '#FFFFFF',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  flex: 1.5,
                  height: '46px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#0B74F6',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Try Again
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
