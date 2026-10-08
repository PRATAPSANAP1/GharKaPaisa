import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import attendanceService from '../../../services/attendance.service';

import AttendanceVerificationStepper from './components/AttendanceVerificationStepper';
import GpsAcquisitionProgress from './components/GpsAcquisitionProgress';
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
  // 'GPS_ACQUISITION' (Step 1: Bounded Precise GPS Acquisition)
  // 'PREPARING' (Step 2: Create Verification Session & AWS Credentials)
  // 'CAMERA_PERMISSION' | 'CAMERA_DENIED'
  // 'LIVENESS_ACTIVE' (Step 3: Biometric Challenge)
  // 'LIVENESS_ANALYZING' (Step 4: Backend Rekognition & Building Geofence Validation)
  // 'LIVENESS_PASSED'
  // 'IDENTITY_VERIFICATION' (Face Match & Environment Check)
  // 'SUCCESS'
  // 'FAILURE'
  const [currentState, setCurrentState] = useState('STEPPER_OVERVIEW');
  const [identityStage, setIdentityStage] = useState('FACE_MATCH');
  const [failureType, setFailureType] = useState('LIVENESS_FAILED');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [sessionId, setSessionId] = useState(null);
  const [awsProviderSessionId, setAwsProviderSessionId] = useState(null);
  const [awsRegion, setAwsRegion] = useState('ap-south-1');
  const [awsCredentials, setAwsCredentials] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  
  // GPS acquisition progress state for UI
  const [gpsProgress, setGpsProgress] = useState(null);

  // Authoritative Session & Location Refs to prevent stale closure issues during async callbacks
  const sessionIdRef = useRef(null);
  const providerSessionIdRef = useRef(null);
  const credentialsRef = useRef(null);
  const isInitiatingRef = useRef(false);
  const verifiedLocationRef = useRef(null);

  // Bounded window settings (STRICT: 50m threshold cannot be weakened)
  const MAX_ACCURACY_THRESHOLD = 50; // meters
  const MAX_GPS_ACQUISITION_DURATION = 25000; // 25 seconds bounded acquisition window

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
    verifiedLocationRef.current = null;
    setSessionId(null);
    setAwsProviderSessionId(null);
    setAwsCredentials(null);
    setErrorMessage('');
    setVerificationResult(null);
    setGpsProgress(null);
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
      verifiedLocationRef.current = null;
      setSessionId(null);
      setAwsProviderSessionId(null);
      setAwsCredentials(null);
      setErrorMessage('');
      setGpsProgress(null);
    }
  }, [isOpen]);

  // Safely check if browser/device location permission is available
  const checkLocationPermission = useCallback(async () => {
    if (!navigator?.geolocation) {
      return { supported: false, state: 'unsupported' };
    }
    if (navigator?.permissions?.query) {
      try {
        const status = await navigator.permissions.query({ name: 'geolocation' });
        return { supported: true, state: status.state }; // 'granted' | 'prompt' | 'denied'
      } catch (e) {
        return { supported: true, state: 'unknown' };
      }
    }
    return { supported: true, state: 'unknown' };
  }, []);

  // STEP 1: Bounded GPS Acquisition Engine
  // Collects GPS readings using watchPosition for a bounded window (25s max).
  // Tracks bestAccuracy, bestLatitude, bestLongitude, bestTimestamp.
  // Immediately accepts once accuracy <= 50m.
  // If bounded period ends and accuracy > 50m, cleanly stops and returns LOW_ACCURACY.
  const acquirePreciseLocation = useCallback(() => {
    return new Promise((resolve) => {
      if (!navigator?.geolocation) {
        console.warn('[ATTENDANCE GEOFENCE] Geolocation API not available on device');
        resolve({
          success: false,
          error: 'NO_GEOLOCATION',
          reason: 'LOCATION_PERMISSION_DENIED',
          message: 'Location permission is required for attendance. Please allow location access and try again.'
        });
        return;
      }

      console.log('[ATTENDANCE GPS] Acquisition started');

      let watchId = null;
      let masterTimeoutId = null;
      let isResolved = false;

      let bestAccuracy = Infinity;
      let bestLatitude = null;
      let bestLongitude = null;
      let bestTimestamp = null;
      let readingCount = 0;

      const cleanup = () => {
        if (watchId !== null) {
          navigator.geolocation.clearWatch(watchId);
          watchId = null;
        }
        if (masterTimeoutId !== null) {
          clearTimeout(masterTimeoutId);
          masterTimeoutId = null;
        }
      };

      const safeResolve = (result) => {
        if (isResolved) return;
        isResolved = true;
        cleanup();
        resolve(result);
      };

      const geoOptions = {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000
      };

      const processPosition = (pos) => {
        if (isResolved) return;

        const lat = pos?.coords?.latitude;
        const lng = pos?.coords?.longitude;
        const accuracy = pos?.coords?.accuracy;
        const timestamp = pos?.timestamp || Date.now();

        // Strict sanity validation
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(accuracy) ||
            lat < -90 || lat > 90 || lng < -180 || lng > 180 || accuracy <= 0) {
          console.log('[ATTENDANCE GPS] Skipping invalid reading (non-finite or out-of-range coordinates)');
          return;
        }

        readingCount++;
        const roundedAcc = Math.round(accuracy);

        console.log(`[ATTENDANCE GPS] Reading #${readingCount}:\nlat=${lat.toFixed(6)},\nlng=${lng.toFixed(6)},\naccuracy=${roundedAcc}m`);

        // Track best reading (lowest accuracy value)
        if (accuracy < bestAccuracy) {
          console.log(`[ATTENDANCE GPS] Best accuracy updated:\n${bestAccuracy === Infinity ? 'Initial' : Math.round(bestAccuracy) + 'm'} -> ${roundedAcc}m`);
          bestAccuracy = accuracy;
          bestLatitude = lat;
          bestLongitude = lng;
          bestTimestamp = timestamp;
        }

        // Update UI progress
        setGpsProgress({
          status: 'acquiring',
          currentAccuracy: roundedAcc,
          bestAccuracy: Math.round(bestAccuracy),
          readingCount
        });

        // If a reading meets the <= 50m threshold, accept immediately!
        if (accuracy <= MAX_ACCURACY_THRESHOLD) {
          console.log('[ATTENDANCE GPS] Acquisition completed');
          console.log(`[ATTENDANCE GPS] Best accuracy: ${roundedAcc}m`);
          safeResolve({
            success: true,
            latitude: lat,
            longitude: lng,
            accuracy: accuracy,
            bestAccuracy: accuracy,
            readingCount
          });
        }
      };

      const handleError = (err) => {
        if (isResolved) return;

        // If we already collected a reading, let the acquisition stream continue for the remaining bounded duration
        if (bestAccuracy !== Infinity) {
          console.warn('[ATTENDANCE GPS] Transient position update error:', err?.message);
          return;
        }

        if (err?.code === 1 /* PERMISSION_DENIED */) {
          console.warn('[ATTENDANCE GPS] Location permission denied by user/browser');
          safeResolve({
            success: false,
            error: 'LOCATION_PERMISSION_DENIED',
            reason: 'LOCATION_PERMISSION_DENIED',
            message: 'Location permission is required for attendance. Please allow location access and try again.'
          });
          return;
        }

        if (err?.code === 2 /* POSITION_UNAVAILABLE */) {
          console.warn('[ATTENDANCE GPS] Position unavailable');
          safeResolve({
            success: false,
            error: 'GPS_UNAVAILABLE',
            reason: 'GPS_UNAVAILABLE',
            message: 'GPS signal unavailable. Please ensure Location/GPS is turned on in your device settings.'
          });
          return;
        }

        // code === 3 (TIMEOUT per query): allow watchPosition to continue until master bounded timeout
        console.warn('[ATTENDANCE GPS] Position query timeout, waiting for next fix...');
      };

      // Master bounded window timer
      masterTimeoutId = setTimeout(() => {
        if (isResolved) return;

        console.log('[ATTENDANCE GPS] Acquisition completed');
        console.log(`[ATTENDANCE GPS] Best accuracy: ${bestAccuracy === Infinity ? 'None' : Math.round(bestAccuracy) + 'm'}`);

        if (bestAccuracy <= MAX_ACCURACY_THRESHOLD && bestLatitude !== null && bestLongitude !== null) {
          safeResolve({
            success: true,
            latitude: bestLatitude,
            longitude: bestLongitude,
            accuracy: bestAccuracy,
            bestAccuracy,
            readingCount
          });
        } else if (bestAccuracy !== Infinity) {
          const roundedBest = Math.round(bestAccuracy);
          console.log(`[ATTENDANCE GPS] LOW_ACCURACY:\nbestAccuracy=${roundedBest}m\nthreshold=${MAX_ACCURACY_THRESHOLD}m`);
          console.warn('[ATTENDANCE GEOFENCE] Aborting /liveness/result due to LOW_ACCURACY');
          safeResolve({
            success: false,
            error: 'LOW_ACCURACY',
            reason: 'LOW_ACCURACY',
            accuracy: roundedBest,
            bestAccuracy: roundedBest,
            readingCount,
            message: `Your GPS accuracy is currently ${roundedBest}m. Please enable Precise Location and try again from an open area or near a window.`
          });
        } else {
          console.warn('[ATTENDANCE GPS] ❌ TIMEOUT: No GPS reading obtained within bounded acquisition period');
          console.warn('[ATTENDANCE GEOFENCE] Aborting /liveness/result due to GPS_TIMEOUT');
          safeResolve({
            success: false,
            error: 'GPS_TIMEOUT',
            reason: 'GPS_TIMEOUT',
            message: 'Unable to obtain sufficiently accurate GPS. Please ensure Location/GPS is enabled and try again.'
          });
        }
      }, MAX_GPS_ACQUISITION_DURATION);

      // Initial query to kick off hardware GPS provider
      navigator.geolocation.getCurrentPosition(processPosition, handleError, geoOptions);

      // Continuous bounded watch stream
      watchId = navigator.geolocation.watchPosition(processPosition, handleError, geoOptions);
    });
  }, [MAX_ACCURACY_THRESHOLD, MAX_GPS_ACQUISITION_DURATION]);

  // STEP 2: Prepare AWS Face Liveness Session (ONLY reached after GPS is validated <= 50m)
  const handleStartLivenessSession = useCallback(async () => {
    try {
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

      // 2. Initiate AWS Rekognition Face Liveness Session + fetch temporary AWS credentials
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

      const cleanProviderSessionId = String(rawProviderSessionId).trim();
      providerSessionIdRef.current = cleanProviderSessionId;
      setAwsProviderSessionId(cleanProviderSessionId);
      setAwsRegion(region);

      if (tempCredentials) {
        credentialsRef.current = tempCredentials;
        setAwsCredentials(tempCredentials);
      }

      // Transition to active live detector challenge
      setTimeout(() => {
        setCurrentState('LIVENESS_ACTIVE');
      }, 800);

    } catch (err) {
      console.error('Liveness session initialization error:', err);
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
    }
  }, []);

  // MASTER FLOW: Initiates GPS first -> validates <= 50m -> then runs Liveness
  const handleStartVerificationFlow = useCallback(async () => {
    if (isInitiatingRef.current) return;

    try {
      isInitiatingRef.current = true;
      setErrorMessage('');
      verifiedLocationRef.current = null;

      // 1. Check Location Permission
      const perm = await checkLocationPermission();
      if (perm.state === 'denied') {
        setFailureType('LOCATION_PERMISSION_DENIED');
        setErrorMessage('Location permission is required for attendance. Please allow location access and try again.');
        setCurrentState('FAILURE');
        return;
      }

      // 2. Start Bounded GPS Acquisition (Panel 1: GPS_ACQUISITION)
      setCurrentState('GPS_ACQUISITION');
      setGpsProgress({ status: 'acquiring', readingCount: 0, accuracy: null });

      const gpsResult = await acquirePreciseLocation();

      if (!gpsResult || !gpsResult.success) {
        setGpsProgress(null);
        const errType = gpsResult?.error || gpsResult?.reason || 'LOW_ACCURACY';
        const msg = gpsResult?.message || 'Unable to obtain sufficiently accurate GPS.';
        setFailureType(errType);
        setErrorMessage(msg);
        setCurrentState('FAILURE');
        return;
      }

      // 3. Accuracy is verified <= 50m! Store coordinates
      verifiedLocationRef.current = {
        latitude: gpsResult.latitude,
        longitude: gpsResult.longitude,
        accuracy: gpsResult.accuracy
      };

      // 4. Continue with AWS Rekognition Face Liveness
      await handleStartLivenessSession();

    } catch (err) {
      console.error('Verification flow error:', err);
      setFailureType('GENERAL');
      setErrorMessage(err?.message || 'Failed to initialize attendance verification');
      setCurrentState('FAILURE');
    } finally {
      isInitiatingRef.current = false;
    }
  }, [checkLocationPermission, acquirePreciseLocation, handleStartLivenessSession]);

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

  // Called when AWS Amplify FaceLivenessDetectorCore completes client challenge
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

      // Show Panel: LIVENESS_ANALYZING
      setCurrentState('LIVENESS_ANALYZING');

      // Retrieve verified GPS location from step 1
      const locationData = verifiedLocationRef.current;

      // Fail-closed guard: Do NOT call /liveness/result if GPS is missing, invalid, or > 50m
      if (!locationData || !Number.isFinite(locationData.latitude) || !Number.isFinite(locationData.longitude) ||
          !Number.isFinite(locationData.accuracy) || locationData.accuracy <= 0 || locationData.accuracy > MAX_ACCURACY_THRESHOLD) {
        const measuredAcc = locationData?.accuracy ? Math.round(locationData.accuracy) : 'unknown';
        console.warn(`[ATTENDANCE GEOFENCE] ⛔ Aborting /liveness/result call due to LOW_ACCURACY: bestAccuracy=${measuredAcc}m > ${MAX_ACCURACY_THRESHOLD}m threshold`);
        setFailureType('LOW_ACCURACY');
        setErrorMessage(`Your GPS accuracy is currently ${measuredAcc}m. Please enable Precise Location and try again from an open area or near a window.`);
        setCurrentState('FAILURE');
        return;
      }

      console.log('[ATTENDANCE GEOFENCE] Submitting verified GPS to backend validation:', locationData);

      // Validate AWS Rekognition Liveness & Building Geofence on Backend
      const validateRes = await attendanceService.validateLivenessResult(
        activeSessionId,
        activeProviderSessionId,
        locationData
      );

      // Save matched building info if returned
      if (validateRes?.data?.building_name || validateRes?.building_name) {
        setVerificationResult(prev => ({
          ...prev,
          buildingName: validateRes?.data?.building_name || validateRes?.building_name
        }));
      }

      // Show Panel 8 (Liveness Check Passed!)
      setCurrentState('LIVENESS_PASSED');

    } catch (err) {
      console.error('[ATTENDANCE VERIFICATION] Backend validation error:', err);
      const errReason = err.response?.data?.reason || err.reason;
      const isExpired = errReason === 'LIVENESS_EXPIRED' || err.response?.status === 410;
      const isMismatch = errReason === 'FACE_MISMATCH' || err.response?.data?.message?.toLowerCase().includes('face mismatch');
      const isLowAccuracy = errReason === 'LOW_ACCURACY' || err.response?.data?.message?.toLowerCase().includes('accurat');
      const isLocMismatch = errReason === 'LOCATION_MISMATCH' || errReason === 'OUTSIDE_BUILDING' || err.response?.data?.message?.toLowerCase().includes('location does not match') || err.response?.data?.message?.toLowerCase().includes('outside');
      const isLocDenied = errReason === 'LOCATION_REQUIRED' || errReason === 'LOCATION_DENIED';
      const errText = err.response?.data?.message || err.message || (isExpired ? 'Face verification session expired. Please retry.' : 'Face verification failed');

      if (isLowAccuracy) {
        setFailureType('LOW_ACCURACY');
        setErrorMessage(errText || 'Unable to verify your location accurately. Please enable GPS and try again.');
      } else if (isLocMismatch) {
        setFailureType('LOCATION_MISMATCH');
        setErrorMessage(errText || "Location doesn't match. You must be inside the office building.");
      } else if (isLocDenied) {
        setFailureType('LOCATION_PERMISSION_DENIED');
        setErrorMessage('Location permission is required for attendance. Please allow location access and try again.');
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
  }, [sessionId, awsProviderSessionId, MAX_ACCURACY_THRESHOLD]);

  // Step after Panel 8 (Liveness Passed) -> Panel 9 (KYC Face Match & Building Location Progress) -> Panel 10
  const handleProceedToIdentityVerification = useCallback(async () => {
    try {
      const activeSessionId = sessionIdRef.current || sessionId;
      setCurrentState('IDENTITY_VERIFICATION');
      setIdentityStage('FACE_MATCH');

      // Brief progress UI ticks
      await new Promise(r => setTimeout(r, 600));
      setIdentityStage('LOCATION_CHECK');

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

  // Retry Flow: restarts fresh from permission check & GPS acquisition
  const handleRetry = useCallback(() => {
    isInitiatingRef.current = false;
    sessionIdRef.current = null;
    providerSessionIdRef.current = null;
    credentialsRef.current = null;
    verifiedLocationRef.current = null;
    setSessionId(null);
    setAwsProviderSessionId(null);
    setAwsCredentials(null);
    setErrorMessage('');
    setVerificationResult(null);
    handleStartVerificationFlow();
  }, [handleStartVerificationFlow]);

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
            onContinue={handleStartVerificationFlow}
            onClose={handleModalClose}
          />
        )}

        {/* STEP 1: BOUNDED GPS ACQUISITION PROGRESS */}
        {currentState === 'GPS_ACQUISITION' && (
          <GpsAcquisitionProgress
            key="gps_acquisition"
            gpsProgress={gpsProgress}
            onCancel={handleModalClose}
          />
        )}

        {/* STEP 2: PREPARING LIVENESS (Session & Credential Creation) */}
        {currentState === 'PREPARING' && (
          <LivenessPreparation
            key="preparing"
            onCancel={handleModalClose}
          />
        )}

        {/* CAMERA PERMISSION STATE */}
        {currentState === 'CAMERA_PERMISSION' && (
          <CameraPermissionState
            key="camera_perm"
            isDenied={false}
            onAllowCamera={handleStartVerificationFlow}
            onCancel={handleModalClose}
          />
        )}

        {/* STEP 3: LIVE AWS FACE LIVENESS DETECTOR */}
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

        {/* STEP 4: LIVENESS & BACKEND GEOFENCE ANALYZING */}
        {currentState === 'LIVENESS_ANALYZING' && (
          <LivenessAnalysis key="liveness_analyzing" gpsProgress={gpsProgress} />
        )}

        {/* LIVENESS SUCCESS */}
        {currentState === 'LIVENESS_PASSED' && (
          <LivenessSuccess
            key="liveness_passed"
            onContinue={handleProceedToIdentityVerification}
          />
        )}

        {/* IDENTITY VERIFICATION PROGRESS (KYC Face Match & Office Geofence) */}
        {currentState === 'IDENTITY_VERIFICATION' && (
          <IdentityVerificationProgress
            key="identity_progress"
            stage={identityStage}
            actionType={actionType}
            buildingName={verificationResult?.buildingName}
            locationStatus={verificationResult?.locationStatus}
          />
        )}

        {/* ATTENDANCE SUCCESS */}
        {currentState === 'SUCCESS' && (
          <AttendanceSuccess
            key="success"
            verResult={verificationResult}
            user={user}
            onClose={handleModalClose}
          />
        )}

        {/* FAILURE STATES (Categorized: Permission Denied, GPS Unavailable, Timeout, Low Accuracy, Outside Building) */}
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
