import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import attendanceService from '../../../services/attendance.service';

import AttendanceVerificationStepper from './components/AttendanceVerificationStepper';
import LivenessPreparation from './components/LivenessPreparation';
import CameraPermissionState from './components/CameraPermissionState';
import LivenessState from './components/LivenessState';
import LivenessAnalysis from './components/LivenessAnalysis';
import LivenessSuccess from './components/LivenessSuccess';
import IdentityVerificationProgress from './components/IdentityVerificationProgress';
import AttendanceSuccess from './components/AttendanceSuccess';
import AttendanceFailure from './components/AttendanceFailure';

export default function AttendanceVerificationModal({
  isOpen,
  onClose,
  onSuccess,
  actionType = 'CHECK_IN', // 'CHECK_IN' | 'CHECK_OUT'
  user
}) {
  // State Machine:
  // 'STEPPER_OVERVIEW' (Panel 2)
  // 'PREPARING' (Panel 3)
  // 'CAMERA_PERMISSION' | 'CAMERA_DENIED' (Panel 4)
  // 'LIVENESS_ACTIVE' (Panels 5 & 6)
  // 'LIVENESS_ANALYZING' (Panel 7)
  // 'LIVENESS_PASSED' (Panel 8)
  // 'IDENTITY_VERIFICATION' (Panel 9: Face Match & Environment)
  // 'SUCCESS' (Panel 10)
  // 'FAILURE' (Section 12)
  const [currentState, setCurrentState] = useState('STEPPER_OVERVIEW');
  const [identityStage, setIdentityStage] = useState('FACE_MATCH'); // 'FACE_MATCH' | 'ENVIRONMENT_CHECK' | 'COMPLETE_ATTENDANCE'
  const [failureType, setFailureType] = useState('LIVENESS_FAILED');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [sessionId, setSessionId] = useState(null);
  const [awsProviderSessionId, setAwsProviderSessionId] = useState(null);
  const [awsRegion, setAwsRegion] = useState('ap-south-1');
  const [awsCredentials, setAwsCredentials] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  // Authoritative Session ID Refs to avoid stale closure issues during async callbacks
  const sessionIdRef = useRef(null);
  const providerSessionIdRef = useRef(null);
  const credentialsRef = useRef(null);
  const isInitiatingRef = useRef(false);

  // Window resize listener
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cleanup & Close
  const handleModalClose = useCallback(() => {
    isInitiatingRef.current = false;
    setCurrentState('STEPPER_OVERVIEW');
    sessionIdRef.current = null;
    providerSessionIdRef.current = null;
    credentialsRef.current = null;
    setSessionId(null);
    setAwsProviderSessionId(null);
    setAwsCredentials(null);
    setErrorMessage('');
    setVerificationResult(null);
    onClose();
  }, [onClose]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      isInitiatingRef.current = false;
      setCurrentState('STEPPER_OVERVIEW');
      sessionIdRef.current = null;
      providerSessionIdRef.current = null;
      credentialsRef.current = null;
      setSessionId(null);
      setAwsProviderSessionId(null);
      setAwsCredentials(null);
      setErrorMessage('');
    }
  }, [isOpen]);

  // Step 1: Start Preparation (Panel 2 -> Panel 3 -> Panel 5)
  const handleStartLivenessSession = useCallback(async () => {
    if (isInitiatingRef.current) return;

    try {
      isInitiatingRef.current = true;
      setErrorMessage('');
      setCurrentState('PREPARING');

      // 1. Create Backend Verification Session (5 min expiry)
      const sessionRes = await attendanceService.createVerificationSession();
      const newSessionId = sessionRes?.data?.sessionId || sessionRes?.sessionId || sessionRes?.data?.session_id || sessionRes?.session_id;

      if (!newSessionId || typeof newSessionId !== 'string') {
        throw new Error('Failed to create verification session');
      }

      sessionIdRef.current = newSessionId;
      setSessionId(newSessionId);

      // 2. Initiate AWS Rekognition Face Liveness Session + fetch short-lived temporary AWS credentials
      const livenessRes = await attendanceService.initiateLivenessSession(newSessionId);
      const livenessData = livenessRes?.data || livenessRes;
      const rawProviderSessionId = livenessData?.providerSessionId || livenessData?.provider_session_id;
      const region = livenessData?.region || import.meta.env.VITE_AWS_REGION || 'ap-south-1';
      const tempCredentials = livenessData?.credentials;

      if (!rawProviderSessionId || typeof rawProviderSessionId !== 'string' || rawProviderSessionId.length < 36 || livenessData?.status === 'PROVIDER_NOT_CONFIGURED') {
        if (livenessData?.status === 'PROVIDER_NOT_CONFIGURED') {
          setFailureType('SERVICE_UNAVAILABLE');
          setErrorMessage('Liveness verification service is not configured in production environment');
        } else {
          setFailureType('LIVENESS_FAILED');
          setErrorMessage('Failed to initialize AWS Face Liveness session. Please retry.');
        }
        setCurrentState('FAILURE');
        return;
      }

      // Preserve untruncated 36-char AWS Rekognition SessionId in ref & state
      const cleanProviderSessionId = String(rawProviderSessionId).trim();
      providerSessionIdRef.current = cleanProviderSessionId;
      setAwsProviderSessionId(cleanProviderSessionId);
      setAwsRegion(region);

      if (tempCredentials) {
        credentialsRef.current = tempCredentials;
        setAwsCredentials(tempCredentials);
      }

      // Brief preparation completion delay before showing AWS Liveness Detector
      setTimeout(() => {
        setCurrentState('LIVENESS_ACTIVE');
      }, 1000);

    } catch (err) {
      console.error('Verification initiation error:', err);
      const errReason = err.response?.data?.reason || err.reason;
      const isExpired = errReason === 'LIVENESS_EXPIRED' || err.response?.status === 410;
      const errText = err.response?.data?.message || err.message || (isExpired ? 'Face verification session expired. Please retry.' : 'Could not initiate face liveness session');

      if (isExpired) {
        setFailureType('LIVENESS_FAILED');
        setErrorMessage('Face verification session expired. Please retry.');
      } else if (errReason === 'LIVENESS_PROVIDER_NOT_CONFIGURED' || err.response?.status === 503) {
        setFailureType('SERVICE_UNAVAILABLE');
        setErrorMessage('Liveness verification service is not configured in production environment');
      } else {
        setFailureType('LIVENESS_FAILED');
        setErrorMessage(errText);
      }
      setCurrentState('FAILURE');
    } finally {
      isInitiatingRef.current = false;
    }
  }, []);

  // Custom AWS Credential Provider for FaceLivenessDetectorCore
  const credentialProvider = useCallback(async () => {
    const currentSessionId = sessionIdRef.current;
    const currentCreds = credentialsRef.current;

    if (currentCreds?.accessKeyId && currentCreds?.secretAccessKey) {
      return {
        accessKeyId: currentCreds.accessKeyId,
        secretAccessKey: currentCreds.secretAccessKey,
        sessionToken: currentCreds.sessionToken,
        expiration: currentCreds.expiration ? new Date(currentCreds.expiration) : undefined,
      };
    }

    if (!currentSessionId) {
      throw new Error('Verification session lost. Please restart verification.');
    }

    // Fetch fresh temporary credentials from backend if not present
    const credsRes = await attendanceService.getLivenessCredentials(currentSessionId);
    const credsData = credsRes?.data?.credentials || credsRes?.credentials;

    if (!credsData || !credsData.accessKeyId) {
      throw new Error('Could not obtain temporary AWS credentials for liveness challenge');
    }

    credentialsRef.current = credsData;
    setAwsCredentials(credsData);

    return {
      accessKeyId: credsData.accessKeyId,
      secretAccessKey: credsData.secretAccessKey,
      sessionToken: credsData.sessionToken,
      expiration: credsData.expiration ? new Date(credsData.expiration) : undefined,
    };
  }, []);

  const livenessConfig = useMemo(() => ({
    credentialProvider
  }), [credentialProvider]);

  // Helper to fetch device coordinates with high accuracy
  const getDeviceLocation = useCallback(() => {
    return new Promise((resolve) => {
      if (!navigator?.geolocation) {
        console.warn('[ATTENDANCE GEOFENCE] Geolocation API not available on device');
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          console.log('[ATTENDANCE GEOFENCE] Device GPS Captured:', `Latitude: ${loc.latitude}, Longitude: ${loc.longitude}, Accuracy: ${loc.accuracy}m`);
          resolve(loc);
        },
        (err) => {
          console.warn('[ATTENDANCE GEOFENCE] Geolocation retrieval error:', err);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }, []);

  // Called when AWS Amplify FaceLivenessDetectorCore completes client-side challenge (Panel 5/6 -> Panel 7 -> Panel 8 -> Panel 9 -> Panel 10)
  const handleAnalysisComplete = useCallback(async () => {
    try {
      const activeSessionId = sessionIdRef.current || sessionId;
      const activeProviderSessionId = providerSessionIdRef.current || awsProviderSessionId;

      if (!activeSessionId || !activeProviderSessionId || typeof activeProviderSessionId !== 'string' || activeProviderSessionId.length < 36) {
        setFailureType('LIVENESS_FAILED');
        setErrorMessage('Face liveness session context was lost or invalid. Please retry.');
        setCurrentState('FAILURE');
        return;
      }

      // 1. Show Panel 7 (Analyzing...)
      setCurrentState('LIVENESS_ANALYZING');

      // 2. Fetch current GPS location for office building geofence verification
      const locationData = await getDeviceLocation();
      console.log('[ATTENDANCE GEOFENCE] Verifying location against office/test building 4-corner polygon coordinates:', locationData);

      // 3. Validate AWS Rekognition Liveness & Building Geofence on Backend
      const validateRes = await attendanceService.validateLivenessResult(
        activeSessionId,
        activeProviderSessionId,
        locationData || {}
      );

      // Save matched building info if returned
      if (validateRes?.data?.building_name || validateRes?.building_name) {
        setVerificationResult(prev => ({
          ...prev,
          buildingName: validateRes?.data?.building_name || validateRes?.building_name
        }));
      }

      // 4. Show Panel 8 (Liveness Check Passed!)
      setCurrentState('LIVENESS_PASSED');

    } catch (err) {
      console.error('Liveness analysis / location verification error:', err);
      const errReason = err.response?.data?.reason || err.reason;
      const isExpired = errReason === 'LIVENESS_EXPIRED' || err.response?.status === 410;
      const isMismatch = errReason === 'FACE_MISMATCH' || err.response?.data?.message?.toLowerCase().includes('face mismatch');
      const isLowAccuracy = errReason === 'LOW_ACCURACY' || err.response?.data?.message?.toLowerCase().includes('accurat');
      const isLocMismatch = errReason === 'LOCATION_MISMATCH' || errReason === 'OUTSIDE_BUILDING' || err.response?.data?.message?.toLowerCase().includes('location does not match') || err.response?.data?.message?.toLowerCase().includes('outside');
      const isLocDenied = errReason === 'LOCATION_REQUIRED' || errReason === 'LOCATION_DENIED';
      const errText = err.response?.data?.message || err.message || (isExpired ? 'Face verification session expired. Please retry.' : 'Face verification failed');

      if (isLowAccuracy) {
        setFailureType('LOCATION_MISMATCH');
        setErrorMessage(errText || 'Unable to verify your location accurately. Please enable GPS and try again.');
      } else if (isLocMismatch) {
        setFailureType('LOCATION_MISMATCH');
        setErrorMessage(errText || "Location doesn't match. You must be inside the office building.");
      } else if (isLocDenied) {
        setFailureType('LOCATION_DENIED');
        setErrorMessage('Location access is required to verify your office building presence.');
      } else if (isMismatch) {
        setFailureType('FACE_MISMATCH');
        setErrorMessage('Your face could not be matched with your registered KYC photo.');
      } else if (isExpired) {
        setFailureType('LIVENESS_FAILED');
        setErrorMessage('Face verification session expired. Please retry.');
      } else if (errReason === 'LIVENESS_PROVIDER_NOT_CONFIGURED' || err.response?.status === 503) {
        setFailureType('SERVICE_UNAVAILABLE');
        setErrorMessage('Liveness verification service is not configured in production environment');
      } else {
        setFailureType('LIVENESS_FAILED');
        setErrorMessage(errText);
      }
      setCurrentState('FAILURE');
    }
  }, [sessionId, awsProviderSessionId, getDeviceLocation]);

  // Step after Panel 8 (Liveness Passed) -> Panel 9 (KYC Face Match & Building Location Progress) -> Panel 10
  const handleProceedToIdentityVerification = useCallback(async () => {
    try {
      const activeSessionId = sessionIdRef.current || sessionId;
      setCurrentState('IDENTITY_VERIFICATION');
      setIdentityStage('FACE_MATCH');

      // Small UI tick for step 2 (KYC Face Match)
      await new Promise(r => setTimeout(r, 600));
      setIdentityStage('LOCATION_CHECK');

      // Small UI tick for step 3 (Building Location Check)
      await new Promise(r => setTimeout(r, 600));
      setIdentityStage('COMPLETE_ATTENDANCE');

      // Submit attendance check-in / check-out
      let attendanceRes;
      if (actionType === 'CHECK_OUT') {
        attendanceRes = await attendanceService.checkOut(activeSessionId);
      } else {
        attendanceRes = await attendanceService.checkIn(activeSessionId);
      }

      const attendanceData = attendanceRes?.data || attendanceRes;

      const finalResult = {
        checkInTime: attendanceData?.check_in_time,
        checkOutTime: attendanceData?.check_out_time,
        duration: attendanceData?.total_hours ? `${attendanceData.total_hours} hrs` : null,
        timestamp: attendanceData?.check_out_time || attendanceData?.check_in_time || new Date().toISOString(),
        attendanceDate: attendanceData?.attendance_date || attendanceData?.date || new Date().toISOString(),
        status: attendanceData?.status || 'PRESENT',
        buildingName: attendanceData?.matched_building_name,
        locationStatus: attendanceData?.location_status || 'INSIDE_BUILDING',
        action: actionType
      };

      setVerificationResult(finalResult);
      setCurrentState('SUCCESS');

      if (onSuccess) {
        onSuccess(finalResult);
      }
    } catch (err) {
      console.error('Identity verification completion error:', err);
      const errReason = err.response?.data?.reason || err.reason;
      const isMismatch = errReason === 'FACE_MISMATCH' || err.response?.data?.message?.toLowerCase().includes('face');
      const isLocMismatch = errReason === 'LOCATION_MISMATCH' || err.response?.data?.message?.toLowerCase().includes('location does not match') || err.response?.data?.message?.toLowerCase().includes('outside');
      const errText = err.response?.data?.message || err.message || 'Attendance submission failed. Please try again.';

      if (isLocMismatch) {
        setFailureType('LOCATION_MISMATCH');
        setErrorMessage(errText || 'Location does not match: You are outside the designated office/building premises.');
      } else if (isMismatch) {
        setFailureType('FACE_MISMATCH');
        setErrorMessage('Your face could not be matched with your registered KYC photo.');
      } else {
        setFailureType('GENERAL');
        setErrorMessage(errText);
      }
      setCurrentState('FAILURE');
    }
  }, [actionType, onSuccess, sessionId]);

  // Called on AWS Amplify FaceLivenessDetectorCore error
  const handleLivenessError = useCallback((livenessError) => {
    console.error('FaceLivenessDetector error:', livenessError);
    const msg = livenessError?.error?.message || livenessError?.message || '';
    if (msg.toLowerCase().includes('camera') || msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('notallowed')) {
      setFailureType('CAMERA_DENIED');
      setErrorMessage('Camera access is required. Please allow camera permissions.');
    } else {
      setFailureType('LIVENESS_FAILED');
      setErrorMessage(msg || 'Liveness verification error occurred');
    }
    setCurrentState('FAILURE');
  }, []);

  // Called on AWS Amplify FaceLivenessDetectorCore user cancel
  const handleLivenessCancel = useCallback(() => {
    handleModalClose();
  }, [handleModalClose]);

  // Retry Flow: create completely NEW verification session & AWS liveness session
  const handleRetry = useCallback(() => {
    isInitiatingRef.current = false;
    sessionIdRef.current = null;
    providerSessionIdRef.current = null;
    credentialsRef.current = null;
    setSessionId(null);
    setAwsProviderSessionId(null);
    setAwsCredentials(null);
    setErrorMessage('');
    setVerificationResult(null);
    handleStartLivenessSession();
  }, [handleStartLivenessSession]);

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
        background: 'rgba(17, 24, 39, 0.65)',
        backdropFilter: 'blur(6px)',
        padding: isMobile ? '16px' : '24px'
      }}
      aria-live="polite"
    >
      <AnimatePresence mode="wait">
        {/* PANEL 2: VERIFY YOUR IDENTITY STEPPER */}
        {currentState === 'STEPPER_OVERVIEW' && (
          <AttendanceVerificationStepper
            key="stepper"
            actionType={actionType}
            onContinue={handleStartLivenessSession}
            onClose={handleModalClose}
          />
        )}

        {/* PANEL 3: PREPARING LIVENESS */}
        {currentState === 'PREPARING' && (
          <LivenessPreparation
            key="preparing"
            onCancel={handleModalClose}
          />
        )}

        {/* PANEL 4: CAMERA PERMISSION */}
        {currentState === 'CAMERA_PERMISSION' && (
          <CameraPermissionState
            key="camera_perm"
            isDenied={false}
            onAllowCamera={handleStartLivenessSession}
            onCancel={handleModalClose}
          />
        )}

        {/* PANELS 5 & 6: LIVE AWS FACE LIVENESS DETECTOR */}
        {currentState === 'LIVENESS_ACTIVE' && awsProviderSessionId && (
          <LivenessState
            key="liveness_active"
            sessionId={awsProviderSessionId}
            region={awsRegion}
            livenessConfig={livenessConfig}
            onAnalysisComplete={handleAnalysisComplete}
            onError={handleLivenessError}
            onUserCancel={handleLivenessCancel}
            isMobile={isMobile}
          />
        )}

        {/* PANEL 7: LIVENESS ANALYZING */}
        {currentState === 'LIVENESS_ANALYZING' && (
          <LivenessAnalysis key="liveness_analyzing" />
        )}

        {/* PANEL 8: LIVENESS SUCCESS */}
        {currentState === 'LIVENESS_PASSED' && (
          <LivenessSuccess
            key="liveness_passed"
            onContinue={handleProceedToIdentityVerification}
          />
        )}

        {/* PANEL 9: FACE MATCH + BUILDING LOCATION PROGRESS */}
        {currentState === 'IDENTITY_VERIFICATION' && (
          <IdentityVerificationProgress
            key="identity_progress"
            stage={identityStage}
            actionType={actionType}
            buildingName={verificationResult?.buildingName}
            locationStatus={verificationResult?.locationStatus}
          />
        )}

        {/* PANEL 10: ATTENDANCE SUCCESS */}
        {currentState === 'SUCCESS' && (
          <AttendanceSuccess
            key="success"
            verResult={verificationResult}
            user={user}
            onClose={handleModalClose}
          />
        )}

        {/* SECTION 12: FAILURE STATES */}
        {currentState === 'FAILURE' && (
          <AttendanceFailure
            key="failure"
            failureType={failureType}
            errorMessage={errorMessage}
            onRetry={handleRetry}
            onClose={handleModalClose}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
