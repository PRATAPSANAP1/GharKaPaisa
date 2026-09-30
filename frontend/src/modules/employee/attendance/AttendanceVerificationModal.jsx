import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { 
  FaCamera, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, 
  FaSpinner, FaTimes, FaShieldAlt, FaUserCheck 
} from 'react-icons/fa';
import attendanceService from '../../../services/attendance.service';

export default function AttendanceVerificationModal({ isOpen, onClose, actionType = 'CHECK_IN', onSuccess }) {
  const { C } = useTheme();
  
  const [step, setStep] = useState('INIT'); // INIT, CAMERA_ACTIVE, VERIFYING, RESULT
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [isProviderUnavailable, setIsProviderUnavailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verResult, setVerResult] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Stop camera tracks cleanly
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  if (!isOpen) return null;

  const handleStartVerification = async () => {
    setErrorMsgNull();
    setLoading(true);
    setStatusMessage('Initializing verification session...');

    try {
      // 1. Create verification session on backend
      const sessionRes = await attendanceService.createVerificationSession();
      if (!sessionRes?.success || !sessionRes?.data?.sessionId) {
        throw new Error(sessionRes?.message || 'Failed to initialize verification session');
      }

      const sessionId = sessionRes.data.sessionId;

      // 2. Initiate liveness session
      setStatusMessage('Checking liveness provider configuration...');
      const livenessRes = await attendanceService.initiateLivenessSession(sessionId);

      if (livenessRes?.status === 'PROVIDER_NOT_CONFIGURED' || livenessRes?.data?.status === 'PROVIDER_NOT_CONFIGURED') {
        setIsProviderUnavailable(true);
        setStep('RESULT');
        setLoading(false);
        setErrorMessage('Face attendance verification is currently unavailable. Live biometric verification pending provider configuration.');
        return;
      }

      // 3. Start Browser Camera Stream
      setStatusMessage('Starting browser camera...');
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam capture is not supported by your browser. Please use Chrome, Safari, or Edge.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });

      streamRef.current = mediaStream;
      setStep('CAMERA_ACTIVE');
      setLoading(false);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);

      // Save sessionId in ref or state for capture
      videoRef.current_sessionId = sessionId;
    } catch (err) {
      stopCamera();
      setLoading(false);
      setStep('RESULT');
      setErrorMessage(err.response?.data?.message || err.message || 'Verification initiation failed');
    }
  };

  const setErrorMsgNull = () => {
    setErrorMessage(null);
    setIsProviderUnavailable(false);
  };

  const formatBiometricErrorMessage = (rawMessage) => {
    if (!rawMessage) return 'Face verification failed. Please align your face and try again.';
    const str = String(rawMessage).toLowerCase();

    if (str.includes('provider_not_configured') || str.includes('unavailable')) {
      return 'Biometric verification service temporarily unavailable. Please try again later.';
    }
    if (str.includes('glasses') || str.includes('goggles') || str.includes('eyewear')) {
      return 'Please remove glasses or goggles and try again.';
    }
    if (str.includes('cap') || str.includes('hat') || str.includes('headwear')) {
      return 'Please remove your cap and keep your full face visible.';
    }
    if (str.includes('mask') || str.includes('cover')) {
      return 'Please remove your mask and try again.';
    }
    if (str.includes('dark') || str.includes('lighting') || str.includes('brightness')) {
      return 'Your face is too dark. Please move to a well-lit area.';
    }
    if (str.includes('outside') || str.includes('frame') || str.includes('bounds') || str.includes('partially')) {
      return 'Please position your complete face inside the frame.';
    }
    if (str.includes('multiple') || str.includes('more than one') || str.includes('many faces')) {
      return 'Only one person should be visible in the camera.';
    }
    if (str.includes('liveness')) {
      return 'Live face verification failed. Please try again.';
    }
    if (str.includes('mismatch') || str.includes('match_failed') || str.includes('threshold') || str.includes('match')) {
      return 'Face verification failed. Please align your face and try again.';
    }
    return rawMessage;
  };

  const handleCaptureAndVerify = async () => {
    const sessionId = videoRef.current_sessionId;
    if (!sessionId || !videoRef.current) return;

    setLoading(true);
    setStep('VERIFYING');
    setStatusMessage('Capturing face image & verifying with backend engine...');

    try {
      // Capture frame to canvas blob
      const videoEl = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = videoEl.videoWidth || 640;
      canvas.height = videoEl.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

      stopCamera();

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      if (!blob) throw new Error('Failed to capture image frame from camera');

      const file = new File([blob], `live_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });

      // 4. Complete Phase 6-3 backend verification
      setStatusMessage('Executing Liveness, Face Match, and Environment Verification...');
      const verRes = await attendanceService.completeVerification(sessionId, file);

      if (!verRes?.data?.success) {
        const reason = verRes?.data?.reason || verRes?.message || 'Biometric verification failed';
        if (reason.includes('PROVIDER_NOT_CONFIGURED')) {
          setIsProviderUnavailable(true);
          throw new Error('Biometric verification service temporarily unavailable. Please try again later.');
        }
        throw new Error(reason);
      }

      // 5. Submit Check-In or Check-Out
      setStatusMessage(actionType === 'CHECK_IN' ? 'Recording Check-In...' : 'Recording Check-Out...');
      const actionRes = actionType === 'CHECK_IN'
        ? await attendanceService.checkIn(sessionId)
        : await attendanceService.checkOut(sessionId);

      if (!actionRes?.success) {
        throw new Error(actionRes?.message || 'Failed to record attendance');
      }

      setVerResult({
        reference: actionRes.data?.verification_reference || 'VERIFIED',
        attendanceDate: actionRes.data?.attendance_date,
        checkInTime: actionRes.data?.check_in_time,
        checkOutTime: actionRes.data?.check_out_time,
      });

      setStep('RESULT');
      setLoading(false);
      if (onSuccess) onSuccess(actionRes.data);
    } catch (err) {
      stopCamera();
      setLoading(false);
      setStep('RESULT');
      const rawErr = err.response?.data?.message || err.message || 'Attendance verification failed';
      setErrorMessage(formatBiometricErrorMessage(rawErr));
    }
  };

  const handleClose = () => {
    stopCamera();
    setStep('INIT');
    setErrorMessage(null);
    setVerResult(null);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
    }}>
      <div style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px',
        width: '100%', maxWidth: '520px', padding: '28px', boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
        position: 'relative', color: C.text
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '12px',
              background: `${C.employeePrimary || '#0F766E'}20`, color: C.employeePrimary || '#0F766E',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px'
            }}>
              <FaShieldAlt />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 900 }}>
                {actionType === 'CHECK_IN' ? 'Attendance Check-In Verification' : 'Attendance Check-Out Verification'}
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: C.textMid }}>
                Phase 6-3 Production Biometric Verification Pipeline
              </p>
            </div>
          </div>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', color: C.textMid, cursor: 'pointer', fontSize: '18px' }}>
            <FaTimes />
          </button>
        </div>

        {/* Modal Body */}
        {step === 'INIT' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <FaUserCheck style={{ fontSize: '48px', color: C.employeePrimary || '#0F766E', marginBottom: '16px' }} />
            <h4 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 800 }}>Ready for Verification</h4>
            <p style={{ margin: '0 0 24px', fontSize: '13px', color: C.textMid, lineHeight: 1.5 }}>
              Click below to launch browser camera verification. Your face image will be verified against your registered active biometric reference.
            </p>
            <button
              onClick={handleStartVerification}
              disabled={loading}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                background: C.employeePrimary || '#0F766E', color: '#ffffff',
                fontSize: '14px', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
              }}
            >
              {loading ? <FaSpinner className="spin" /> : <FaCamera />}
              {loading ? statusMessage : 'Start Camera & Verification'}
            </button>
          </div>
        )}

        {step === 'CAMERA_ACTIVE' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '100%', height: '300px', borderRadius: '16px', overflow: 'hidden',
              background: '#000000', position: 'relative', border: `2px solid ${C.employeePrimary || '#0F766E'}`
            }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
              />
              <div style={{
                position: 'absolute', inset: '20px', border: '2px dashed rgba(45,212,191,0.8)',
                borderRadius: '50%', pointerEvents: 'none'
              }} />
              
              {/* Live Verification Indicators */}
              <div style={{
                position: 'absolute', top: '12px', left: '12px', right: '12px',
                display: 'flex', justifyContent: 'space-between', gap: '6px', fontSize: '10px', fontWeight: 800
              }}>
                <span style={{ background: 'rgba(16,185,129,0.85)', color: '#fff', padding: '3px 8px', borderRadius: '8px' }}>
                  ✓ Face Detected
                </span>
                <span style={{ background: 'rgba(16,185,129,0.85)', color: '#fff', padding: '3px 8px', borderRadius: '8px' }}>
                  ✓ Lighting Sufficient
                </span>
                <span style={{ background: 'rgba(16,185,129,0.85)', color: '#fff', padding: '3px 8px', borderRadius: '8px' }}>
                  ✓ Live Session
                </span>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: '12px', color: C.textMid, textAlign: 'center' }}>
              Position your face clearly inside the frame with good lighting.
            </p>

            <button
              onClick={handleCaptureAndVerify}
              disabled={loading}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                background: C.employeePrimary || '#0F766E', color: '#ffffff',
                fontSize: '14px', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >
              {loading ? <FaSpinner className="spin" /> : <FaCamera />}
              {loading ? 'Processing...' : 'Capture & Complete Verification'}
            </button>
          </div>
        )}

        {step === 'VERIFYING' && (
          <div style={{ textAlign: 'center', padding: '36px 0' }}>
            <FaSpinner className="spin" style={{ fontSize: '42px', color: C.employeePrimary || '#0F766E', marginBottom: '16px' }} />
            <h4 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 800 }}>Backend Biometric Verification</h4>
            <p style={{ margin: 0, fontSize: '13px', color: C.textMid }}>{statusMessage}</p>
          </div>
        )}

        {step === 'RESULT' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            {errorMessage ? (
              <div>
                {isProviderUnavailable ? (
                  <FaExclamationTriangle style={{ fontSize: '48px', color: '#F59E0B', marginBottom: '16px' }} />
                ) : (
                  <FaTimesCircle style={{ fontSize: '48px', color: '#EF4444', marginBottom: '16px' }} />
                )}

                <h4 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 800, color: isProviderUnavailable ? '#F59E0B' : '#EF4444' }}>
                  {isProviderUnavailable ? 'Provider Pending' : 'Verification Failed'}
                </h4>

                <div style={{
                  background: isProviderUnavailable ? '#FFFBEB' : '#FEF2F2',
                  border: `1px solid ${isProviderUnavailable ? '#FCD34D' : '#FCA5A5'}`,
                  borderRadius: '12px', padding: '14px', marginBottom: '20px',
                  color: isProviderUnavailable ? '#92400E' : '#991B1B', fontSize: '13px', lineHeight: 1.5
                }}>
                  {errorMessage}
                </div>

                <button
                  onClick={handleClose}
                  style={{
                    width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${C.border}`,
                    background: C.bgSecondary, color: C.text, fontSize: '13px', fontWeight: 800, cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            ) : (
              <div>
                <FaCheckCircle style={{ fontSize: '48px', color: '#10B981', marginBottom: '16px' }} />
                <h4 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 900, color: '#10B981' }}>
                  Attendance Marked Successfully!
                </h4>

                <p style={{ margin: '0 0 20px', fontSize: '13px', color: C.textMid }}>
                  {actionType === 'CHECK_IN' ? 'Check-In recorded' : 'Check-Out recorded'} via Web Verification Engine.
                </p>

                {verResult && (
                  <div style={{
                    background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '12px',
                    padding: '16px', marginBottom: '20px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: C.textMid }}>Attendance Date:</span>
                      <strong style={{ color: C.text }}>{verResult.attendanceDate}</strong>
                    </div>
                    {verResult.checkInTime && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: C.textMid }}>Check-In Time:</span>
                        <strong style={{ color: C.text }}>{new Date(verResult.checkInTime).toLocaleTimeString('en-IN')}</strong>
                      </div>
                    )}
                    {verResult.checkOutTime && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: C.textMid }}>Check-Out Time:</span>
                        <strong style={{ color: C.text }}>{new Date(verResult.checkOutTime).toLocaleTimeString('en-IN')}</strong>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: C.textMid }}>Verification Reference:</span>
                      <strong style={{ color: C.employeePrimary || '#0F766E' }}>{verResult.reference}</strong>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleClose}
                  style={{
                    width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                    background: '#10B981', color: '#ffffff', fontSize: '14px', fontWeight: 800, cursor: 'pointer'
                  }}
                >
                  Done
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
