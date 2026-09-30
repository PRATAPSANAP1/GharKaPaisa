import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, RefreshCw } from 'lucide-react';
import attendanceService from '../../../services/attendance.service';

import AttendanceInstructions from './components/AttendanceInstructions';
import AttendanceCamera from './components/AttendanceCamera';
import AttendanceVerificationSteps from './components/AttendanceVerificationSteps';
import AttendanceTips from './components/AttendanceTips';
import AttendanceSuccess from './components/AttendanceSuccess';
import AttendanceFailure from './components/AttendanceFailure';
import AttendanceServiceUnavailable from './components/AttendanceServiceUnavailable';
import CameraPermissionError from './components/CameraPermissionError';
import CameraError from './components/CameraError';

export default function AttendanceVerificationModal({
  isOpen,
  onClose,
  onSuccess,
  actionType = 'CHECK_IN', // 'CHECK_IN' | 'CHECK_OUT'
  user
}) {
  // State Machine State
  const [currentState, setCurrentState] = useState('INSTRUCTIONS');
  const [sessionId, setSessionId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [overlayMessage, setOverlayMessage] = useState('Align your face inside the frame');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Stop camera tracks cleanly
  const stopCameraTracks = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Modal close handler
  const handleModalClose = useCallback(() => {
    stopCameraTracks();
    setCurrentState('INSTRUCTIONS');
    setSessionId(null);
    setErrorMessage('');
    setVerificationResult(null);
    onClose();
  }, [stopCameraTracks, onClose]);

  // Cleanup camera on unmount or modal close
  useEffect(() => {
    if (!isOpen) {
      stopCameraTracks();
      setCurrentState('INSTRUCTIONS');
    }
  }, [isOpen, stopCameraTracks]);

  // Start Camera Stream
  const startCamera = async () => {
    try {
      setCurrentState('CAMERA_INITIALIZING');
      setErrorMessage('');
      setOverlayMessage('Initializing camera...');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });

      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch(() => {});
          setCurrentState('CAMERA_READY');
          setOverlayMessage('Align your face inside the frame');
        };
      } else {
        // Retry binding stream once ref mounts
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
            setCurrentState('CAMERA_READY');
            setOverlayMessage('Align your face inside the frame');
          }
        }, 300);
      }
    } catch (err) {
      console.error('Camera initialization error:', err);
      stopCameraTracks();
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCurrentState('CAMERA_PERMISSION_DENIED');
      } else {
        setCurrentState('CAMERA_ERROR');
      }
    }
  };

  // Helper to capture JPEG blob from video stream
  const captureFrameBlob = () => {
    return new Promise((resolve, reject) => {
      if (!videoRef.current) {
        return reject(new Error('Video element not available'));
      }
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to capture frame blob'));
        },
        'image/jpeg',
        0.92
      );
    });
  };

  // Run Verification Pipeline
  const handleStartVerification = async () => {
    if (['LIVENESS_IN_PROGRESS', 'FACE_MATCHING', 'ATTENDANCE_SUBMITTING'].includes(currentState)) {
      return; // Prevent double trigger
    }

    try {
      // 1. Session Creation
      setCurrentState('LIVENESS_STARTING');
      setOverlayMessage('Starting verification session...');
      const sessionRes = await attendanceService.createVerificationSession();
      const newSessionId = sessionRes?.session_id || sessionRes?.data?.session_id;
      if (!newSessionId) {
        throw new Error('Could not create verification session');
      }
      setSessionId(newSessionId);

      // 2. Liveness Check
      setCurrentState('LIVENESS_IN_PROGRESS');
      setOverlayMessage('Verifying you are live...');
      await attendanceService.initiateLivenessSession(newSessionId);

      // Capture frame
      const faceBlob = await captureFrameBlob();
      const faceFile = new File([faceBlob], `attendance_${Date.now()}.jpg`, { type: 'image/jpeg' });

      // 3. Face Matching
      setCurrentState('LIVENESS_PASSED');
      setTimeout(() => {
        setCurrentState('FACE_MATCHING');
        setOverlayMessage('Matching with your registered KYC identity...');
      }, 400);

      const completeRes = await attendanceService.completeVerification(newSessionId, faceFile);
      if (!completeRes || completeRes.status === 'FAILED' || completeRes.success === false) {
        const errorMsg = completeRes?.message || completeRes?.error || 'Face verification failed';
        if (errorMsg.toLowerCase().includes('unavailable') || errorMsg.toLowerCase().includes('service')) {
          stopCameraTracks();
          setCurrentState('SERVICE_UNAVAILABLE');
          return;
        }
        stopCameraTracks();
        setErrorMessage(errorMsg);
        setCurrentState('VERIFICATION_FAILED');
        return;
      }

      // 4. Attendance Submitting
      setCurrentState('FACE_MATCHED');
      setCurrentState('ATTENDANCE_SUBMITTING');
      setOverlayMessage("Recording today's attendance...");

      let attendanceRes;
      if (actionType === 'CHECK_OUT') {
        attendanceRes = await attendanceService.checkOut(newSessionId);
      } else {
        attendanceRes = await attendanceService.checkIn(newSessionId);
      }

      stopCameraTracks();

      // 5. Success State
      const finalResult = {
        checkInTime: attendanceRes?.data?.check_in_time || attendanceRes?.check_in_time || new Date().toISOString(),
        attendanceDate: attendanceRes?.data?.date || new Date().toISOString(),
        action: actionType
      };

      setVerificationResult(finalResult);
      setCurrentState('SUCCESS');

      if (onSuccess) {
        onSuccess(finalResult);
      }
    } catch (err) {
      console.error('Verification error:', err);
      stopCameraTracks();
      const errText = err.response?.data?.message || err.message || 'Verification process failed';

      if (errText.toLowerCase().includes('unavailable') || err.response?.status === 503) {
        setCurrentState('SERVICE_UNAVAILABLE');
      } else {
        setErrorMessage(errText);
        setCurrentState('VERIFICATION_FAILED');
      }
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
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        padding: isMobile ? '12px' : '24px'
      }}
      aria-live="polite"
    >
      <AnimatePresence mode="wait">
        {/* INSTRUCTIONS SCREEN */}
        {currentState === 'INSTRUCTIONS' && (
          <AttendanceInstructions
            key="instructions"
            onContinue={() => {
              setCurrentState('CAMERA_INITIALIZING');
              startCamera();
            }}
            onClose={handleModalClose}
          />
        )}

        {/* SUCCESS SCREEN */}
        {currentState === 'SUCCESS' && (
          <AttendanceSuccess
            key="success"
            verResult={verificationResult}
            user={user}
            onClose={handleModalClose}
          />
        )}

        {/* FAILURE SCREEN */}
        {currentState === 'VERIFICATION_FAILED' && (
          <AttendanceFailure
            key="failure"
            errorMessage={errorMessage}
            onRetry={() => {
              setCurrentState('CAMERA_INITIALIZING');
              startCamera();
            }}
            onClose={handleModalClose}
          />
        )}

        {/* SERVICE UNAVAILABLE SCREEN */}
        {currentState === 'SERVICE_UNAVAILABLE' && (
          <AttendanceServiceUnavailable
            key="unavailable"
            onRetry={() => {
              setCurrentState('CAMERA_INITIALIZING');
              startCamera();
            }}
            onClose={handleModalClose}
          />
        )}

        {/* CAMERA PERMISSION ERROR SCREEN */}
        {currentState === 'CAMERA_PERMISSION_DENIED' && (
          <CameraPermissionError
            key="permission_error"
            onRetry={() => {
              setCurrentState('CAMERA_INITIALIZING');
              startCamera();
            }}
            onClose={handleModalClose}
          />
        )}

        {/* CAMERA DISCONNECTED SCREEN */}
        {currentState === 'CAMERA_ERROR' && (
          <CameraError
            key="camera_error"
            onRetry={() => {
              setCurrentState('CAMERA_INITIALIZING');
              startCamera();
            }}
            onClose={handleModalClose}
          />
        )}

        {/* ACTIVE CAMERA & VERIFICATION SCREEN */}
        {[
          'CAMERA_INITIALIZING',
          'CAMERA_READY',
          'LIVENESS_STARTING',
          'LIVENESS_IN_PROGRESS',
          'LIVENESS_PASSED',
          'FACE_MATCHING',
          'FACE_MATCHED',
          'ATTENDANCE_SUBMITTING'
        ].includes(currentState) && (
          <motion.div
            key="camera_modal"
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              padding: isMobile ? '20px 16px' : '28px',
              width: '100%',
              maxWidth: '920px',
              position: 'relative',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '92vh',
              overflowY: 'auto'
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              borderBottom: '1px solid #E2E8F0',
              paddingBottom: '14px'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '19px', fontWeight: 700, color: '#0F172A' }}>
                  Face Verification for Attendance
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748B' }}>
                  Look into the camera and follow the instructions.
                </p>
              </div>

              <button
                type="button"
                onClick={handleModalClose}
                aria-label="Close face verification"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#64748B',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Desktop 2-Column / Mobile 1-Column Layout */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr',
              gap: '24px',
              alignItems: 'start'
            }}>
              {/* Left: Camera Preview Area */}
              <div>
                <AttendanceCamera
                  videoRef={videoRef}
                  isCameraActive={currentState !== 'CAMERA_INITIALIZING'}
                  currentState={currentState}
                  overlayMessage={overlayMessage}
                  isMobile={isMobile}
                />
              </div>

              {/* Right: Verification Steps & Tips */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                height: '100%',
                justifyContent: 'space-between'
              }}>
                <AttendanceVerificationSteps currentState={currentState} />
                <AttendanceTips />
              </div>
            </div>

            {/* Footer Action Buttons */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '14px',
              marginTop: '24px',
              paddingTop: '16px',
              borderTop: '1px solid #E2E8F0'
            }}>
              <button
                type="button"
                onClick={handleModalClose}
                disabled={['LIVENESS_IN_PROGRESS', 'FACE_MATCHING', 'ATTENDANCE_SUBMITTING'].includes(currentState)}
                style={{
                  padding: '0 20px',
                  height: '48px',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  color: '#0F172A',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: ['LIVENESS_IN_PROGRESS', 'FACE_MATCHING', 'ATTENDANCE_SUBMITTING'].includes(currentState) ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleStartVerification}
                disabled={currentState !== 'CAMERA_READY'}
                style={{
                  padding: '0 28px',
                  height: '48px',
                  borderRadius: '12px',
                  border: 'none',
                  background: currentState === 'CAMERA_READY' ? '#2563EB' : '#CBD5E1',
                  color: '#FFFFFF',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: currentState === 'CAMERA_READY' ? 'pointer' : 'not-allowed',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: currentState === 'CAMERA_READY' ? '0 4px 14px rgba(37, 99, 235, 0.3)' : 'none',
                  transition: 'background 0.2s ease'
                }}
              >
                {['LIVENESS_STARTING', 'LIVENESS_IN_PROGRESS'].includes(currentState) ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" /> Verifying you are live...
                  </>
                ) : currentState === 'FACE_MATCHING' ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" /> Matching identity...
                  </>
                ) : currentState === 'ATTENDANCE_SUBMITTING' ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" /> Marking attendance...
                  </>
                ) : (
                  <>
                    <Camera size={18} /> Verify & Mark Attendance
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
