import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, ScanFace, CheckCircle2 } from 'lucide-react';
import { FaceLivenessDetector } from '@aws-amplify/ui-react-liveness';
import '@aws-amplify/ui-react-liveness/styles.css';

import attendanceService from '../../../services/attendance.service';
import AttendanceInstructions from './components/AttendanceInstructions';
import AttendanceVerificationSteps from './components/AttendanceVerificationSteps';
import AttendanceTips from './components/AttendanceTips';
import AttendanceSuccess from './components/AttendanceSuccess';
import AttendanceFailure from './components/AttendanceFailure';
import AttendanceServiceUnavailable from './components/AttendanceServiceUnavailable';

export default function AttendanceVerificationModal({
  isOpen,
  onClose,
  onSuccess,
  actionType = 'CHECK_IN', // 'CHECK_IN' | 'CHECK_OUT'
  user
}) {
  // State Machine State
  // 'INSTRUCTIONS' | 'LIVENESS_INITIATING' | 'LIVENESS_ACTIVE' | 'VERIFYING_RESULTS' | 'ATTENDANCE_SUBMITTING' | 'SUCCESS' | 'VERIFICATION_FAILED' | 'SERVICE_UNAVAILABLE'
  const [currentState, setCurrentState] = useState('INSTRUCTIONS');
  const [sessionId, setSessionId] = useState(null);
  const [awsProviderSessionId, setAwsProviderSessionId] = useState(null);
  const [awsRegion, setAwsRegion] = useState('ap-south-1');
  const [errorMessage, setErrorMessage] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [overlayMessage, setOverlayMessage] = useState('Preparing live face verification...');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Window resize listener
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Modal close handler
  const handleModalClose = useCallback(() => {
    setCurrentState('INSTRUCTIONS');
    setSessionId(null);
    setAwsProviderSessionId(null);
    setErrorMessage('');
    setVerificationResult(null);
    onClose();
  }, [onClose]);

  // Cleanup state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentState('INSTRUCTIONS');
      setSessionId(null);
      setAwsProviderSessionId(null);
      setErrorMessage('');
    }
  }, [isOpen]);

  // Initiate AWS Rekognition Face Liveness Flow
  const handleStartVerification = async () => {
    if (['LIVENESS_INITIATING', 'LIVENESS_ACTIVE', 'VERIFYING_RESULTS', 'ATTENDANCE_SUBMITTING'].includes(currentState)) {
      return; // Prevent duplicate execution
    }

    try {
      setErrorMessage('');
      setCurrentState('LIVENESS_INITIATING');
      setOverlayMessage('Starting secure verification session...');

      // Step 1: Create Backend Verification Session (5 min expiry)
      const sessionRes = await attendanceService.createVerificationSession();
      const newSessionId = sessionRes?.data?.sessionId || sessionRes?.sessionId || sessionRes?.data?.session_id || sessionRes?.session_id;

      if (!newSessionId) {
        throw new Error('Failed to create verification session');
      }

      setSessionId(newSessionId);

      // Step 2: Initiate AWS Rekognition Face Liveness Session
      setOverlayMessage('Initializing AWS Face Liveness...');
      const livenessRes = await attendanceService.initiateLivenessSession(newSessionId);
      const livenessData = livenessRes?.data || livenessRes;
      const providerSessionId = livenessData?.providerSessionId || livenessData?.sessionId;
      const region = livenessData?.region || import.meta.env.VITE_AWS_REGION || 'ap-south-1';

      if (!providerSessionId || livenessData?.status === 'PROVIDER_NOT_CONFIGURED') {
        setErrorMessage('Liveness verification service is not configured in production environment');
        setCurrentState('SERVICE_UNAVAILABLE');
        return;
      }

      setAwsProviderSessionId(providerSessionId);
      setAwsRegion(region);
      setCurrentState('LIVENESS_ACTIVE');
      setOverlayMessage('Position your face inside the oval frame and follow instructions');
    } catch (err) {
      console.error('Verification initiation error:', err);
      const errReason = err.response?.data?.reason || err.reason;
      const errText = err.response?.data?.message || err.message || 'Could not initiate face liveness session';

      if (errReason === 'LIVENESS_PROVIDER_NOT_CONFIGURED' || err.response?.status === 503) {
        setErrorMessage('Liveness verification service is not configured in production environment');
        setCurrentState('SERVICE_UNAVAILABLE');
      } else {
        setErrorMessage(errText);
        setCurrentState('VERIFICATION_FAILED');
      }
    }
  };

  // Called when AWS Amplify FaceLivenessDetector completes client-side challenge
  const handleAnalysisComplete = async () => {
    try {
      setCurrentState('VERIFYING_RESULTS');
      setOverlayMessage('Matching with your registered KYC identity...');

      // Validate AWS Rekognition Liveness + perform server-side KYC Face Matching
      await attendanceService.validateLivenessResult(sessionId, awsProviderSessionId);

      // Both Liveness & KYC Face Match Passed!
      setCurrentState('ATTENDANCE_SUBMITTING');
      setOverlayMessage(actionType === 'CHECK_OUT' ? 'Ending work session...' : 'Starting work session...');

      let attendanceRes;
      if (actionType === 'CHECK_OUT') {
        attendanceRes = await attendanceService.checkOut(sessionId);
      } else {
        attendanceRes = await attendanceService.checkIn(sessionId);
      }

      const finalResult = {
        checkInTime: attendanceRes?.data?.check_in_time || attendanceRes?.check_in_time,
        checkOutTime: attendanceRes?.data?.check_out_time || attendanceRes?.check_out_time,
        timestamp: attendanceRes?.data?.check_out_time || attendanceRes?.data?.check_in_time || attendanceRes?.check_in_time || new Date().toISOString(),
        attendanceDate: attendanceRes?.data?.date || new Date().toISOString(),
        action: actionType
      };

      setVerificationResult(finalResult);
      setCurrentState('SUCCESS');

      if (onSuccess) {
        onSuccess(finalResult);
      }
    } catch (err) {
      console.error('Liveness analysis error:', err);
      const errReason = err.response?.data?.reason || err.reason;
      const errText = err.response?.data?.message || err.message || 'Face verification failed';

      if (errReason === 'LIVENESS_PROVIDER_NOT_CONFIGURED' || err.response?.status === 503) {
        setErrorMessage('Liveness verification service is not configured in production environment');
        setCurrentState('SERVICE_UNAVAILABLE');
      } else {
        setErrorMessage(errText);
        setCurrentState('VERIFICATION_FAILED');
      }
    }
  };

  // Called on AWS Amplify FaceLivenessDetector error
  const handleLivenessError = (livenessError) => {
    console.error('FaceLivenessDetector error:', livenessError);
    const msg = livenessError?.error?.message || livenessError?.message || 'Liveness verification error occurred';
    setErrorMessage(msg);
    setCurrentState('VERIFICATION_FAILED');
  };

  // Called on AWS Amplify FaceLivenessDetector user cancel
  const handleLivenessCancel = () => {
    handleModalClose();
  };

  // Retry Flow: create completely NEW verification session & AWS liveness session
  const handleRetry = () => {
    setSessionId(null);
    setAwsProviderSessionId(null);
    setErrorMessage('');
    setVerificationResult(null);
    handleStartVerification();
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
            actionType={actionType}
            onContinue={handleStartVerification}
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
            onRetry={handleRetry}
            onClose={handleModalClose}
          />
        )}

        {/* SERVICE UNAVAILABLE SCREEN */}
        {currentState === 'SERVICE_UNAVAILABLE' && (
          <AttendanceServiceUnavailable
            key="unavailable"
            onRetry={handleRetry}
            onClose={handleModalClose}
          />
        )}

        {/* ACTIVE LIVENESS & VERIFICATION CONTAINER */}
        {[
          'LIVENESS_INITIATING',
          'LIVENESS_ACTIVE',
          'VERIFYING_RESULTS',
          'ATTENDANCE_SUBMITTING'
        ].includes(currentState) && (
          <motion.div
            key="liveness_modal"
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
                  {actionType === 'CHECK_OUT' ? 'AWS Face Verification to End Work' : 'AWS Face Verification to Start Work'}
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748B' }}>
                  Complete official AWS Rekognition Face Liveness challenge.
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
              gridTemplateColumns: isMobile ? '1fr' : '1.3fr 1fr',
              gap: '24px',
              alignItems: 'start'
            }}>
              {/* Left Column: Official AWS Amplify Face Liveness Component */}
              <div style={{
                position: 'relative',
                width: '100%',
                minHeight: isMobile ? '380px' : '480px',
                borderRadius: '16px',
                overflow: 'hidden',
                background: '#0F172A',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {currentState === 'LIVENESS_ACTIVE' && awsProviderSessionId ? (
                  <div style={{ width: '100%', height: '100%', minHeight: isMobile ? '380px' : '480px' }}>
                    <FaceLivenessDetector
                      sessionId={awsProviderSessionId}
                      region={awsRegion}
                      onAnalysisComplete={handleAnalysisComplete}
                      onError={handleLivenessError}
                      onUserCancel={handleLivenessCancel}
                    />
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px',
                    padding: '32px',
                    color: '#FFFFFF',
                    textAlign: 'center'
                  }}>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                      style={{ color: '#3B82F6' }}
                    >
                      <RefreshCw size={36} />
                    </motion.div>

                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>
                        {overlayMessage}
                      </div>
                      <div style={{ fontSize: '13px', color: '#94A3B8' }}>
                        Please wait while AWS biometric services initialize...
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Verification Progress Steps & Tips */}
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
                disabled={['VERIFYING_RESULTS', 'ATTENDANCE_SUBMITTING'].includes(currentState)}
                style={{
                  padding: '0 20px',
                  height: '44px',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  color: '#0F172A',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: ['VERIFYING_RESULTS', 'ATTENDANCE_SUBMITTING'].includes(currentState) ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
