import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../../../app/store/authStore';
import {
  ShieldCheck, Camera, ScanFace, Sun, CheckCircle, AlertTriangle,
  XCircle, Info, RefreshCw, Loader, X, Eye, Glasses, Monitor, User
} from 'lucide-react';
import attendanceService from '../../../services/attendance.service';

// ─── Design Spec Color Palette ──────────────────────────────────────────────
const COLORS = {
  primary:       '#2563EB',
  primaryHover:  '#1D4ED8',
  navy:          '#0F172A',
  secondaryNavy: '#1E3A5F',
  background:    '#F8FAFC',
  white:         '#FFFFFF',
  border:        '#E2E8F0',
  text:          '#0F172A',
  textSecondary: '#64748B',
  success:       '#16A34A',
  successBg:     '#DCFCE7',
  warning:       '#F59E0B',
  warningBg:     '#FEF3C7',
  error:         '#DC2626',
  errorBg:       '#FEE2E2',
  info:          '#2563EB',
  infoBg:        '#EFF6FF',
  infoBorder:    '#DBEAFE',
  tipsBg:        '#F0FDF4',
  tipsBorder:    '#DCFCE7',
  disabled:      '#CBD5E1',
};

// ─── CSS Animations (injected once) ─────────────────────────────────────────
const STYLE_ID = 'face-verification-animations';
const injectStyles = () => {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes fv-spin { to { transform: rotate(360deg); } }
    @keyframes fv-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    @keyframes fv-scale-in {
      0% { transform: scale(0.5); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes fv-scan-line {
      0% { top: 15%; }
      50% { top: 75%; }
      100% { top: 15%; }
    }
    @keyframes fv-fade-in {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .fv-spin { animation: fv-spin 1s linear infinite; }
    .fv-pulse { animation: fv-pulse 1.8s ease-in-out infinite; }
    .fv-scale-in { animation: fv-scale-in 0.4s ease-out forwards; }
    .fv-fade-in { animation: fv-fade-in 0.3s ease-out forwards; }
  `;
  document.head.appendChild(style);
};

// ─── Face Guide Oval SVG ────────────────────────────────────────────────────
function FaceGuideOval({ color = COLORS.warning, pulsing = false }) {
  return (
    <svg
      viewBox="0 0 300 400"
      style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '55%', height: '75%',
        pointerEvents: 'none',
        overflow: 'visible',
      }}
    >
      <ellipse
        cx="150" cy="200" rx="110" ry="155"
        fill="none"
        stroke={color}
        strokeWidth="3.5"
        strokeDasharray={pulsing ? '12 6' : 'none'}
        className={pulsing ? 'fv-pulse' : ''}
        style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
      />
      {/* Corner guides */}
      <path d="M 70 80 Q 70 55, 95 50" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <path d="M 230 80 Q 230 55, 205 50" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <path d="M 70 320 Q 70 345, 95 350" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <path d="M 230 320 Q 230 345, 205 350" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// ─── Scan Line Animation ────────────────────────────────────────────────────
function ScanLine() {
  return (
    <div style={{
      position: 'absolute', left: '12%', right: '12%', height: '2px',
      background: `linear-gradient(90deg, transparent, ${COLORS.primary}, transparent)`,
      animation: 'fv-scan-line 2.5s ease-in-out infinite',
      pointerEvents: 'none', opacity: 0.7,
    }} />
  );
}

// ─── Verification Step Item ─────────────────────────────────────────────────
function VerificationStep({ icon: Icon, label, description, status }) {
  const getStepColor = () => {
    switch (status) {
      case 'completed': return COLORS.success;
      case 'active':    return COLORS.primary;
      case 'error':     return COLORS.error;
      default:          return COLORS.textSecondary;
    }
  };

  const getStepIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={18} color={COLORS.success} />;
      case 'active':
        return (
          <div style={{
            width: 18, height: 18, borderRadius: '50%',
            background: COLORS.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: COLORS.white }} />
          </div>
        );
      case 'error':
        return <XCircle size={18} color={COLORS.error} />;
      default:
        return (
          <div style={{
            width: 18, height: 18, borderRadius: '50%',
            border: `2px solid ${COLORS.border}`,
          }} />
        );
    }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '12px',
      opacity: status === 'pending' ? 0.55 : 1,
      transition: 'opacity 0.3s ease',
    }}>
      <div style={{ paddingTop: '2px', flexShrink: 0 }}>{getStepIcon()}</div>
      <div>
        <div style={{
          fontSize: '13px', fontWeight: 600, color: getStepColor(),
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          <Icon size={14} />
          {label}
        </div>
        <div style={{ fontSize: '12px', color: COLORS.textSecondary, marginTop: '2px' }}>
          {description}
        </div>
      </div>
    </div>
  );
}

// ─── Main Modal Component ───────────────────────────────────────────────────
export default function AttendanceVerificationModal({ isOpen, onClose, actionType = 'CHECK_IN', onSuccess }) {
  const { user } = useAuthStore();

  // Steps: INSTRUCTIONS → CAMERA_ACTIVE → VERIFYING → SUCCESS → FAILURE
  const [step, setStep] = useState('INSTRUCTIONS');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [isProviderUnavailable, setIsProviderUnavailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verResult, setVerResult] = useState(null);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  // Verification progress tracking
  const [verSteps, setVerSteps] = useState({
    camera: 'pending',     // pending | completed | error
    liveness: 'pending',   // pending | active | completed | error
    faceMatch: 'pending',  // pending | active | completed | error
    attendance: 'pending', // pending | active | completed | error
  });

  // Button text tracking
  const [buttonText, setButtonText] = useState('Verify & Mark Attendance');

  // Face guide color
  const [guideColor, setGuideColor] = useState(COLORS.warning);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const sessionIdRef = useRef(null);
  const autoCloseTimerRef = useRef(null);

  // ── Inject CSS animations on mount ──
  useEffect(() => { injectStyles(); }, []);

  // ── Responsive listener ──
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      stopCamera();
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    };
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const resetState = useCallback(() => {
    setStep('INSTRUCTIONS');
    setStatusMessage('');
    setErrorMessage(null);
    setIsProviderUnavailable(false);
    setLoading(false);
    setVerResult(null);
    setVerSteps({ camera: 'pending', liveness: 'pending', faceMatch: 'pending', attendance: 'pending' });
    setButtonText('Verify & Mark Attendance');
    setGuideColor(COLORS.warning);
    sessionIdRef.current = null;
  }, []);

  if (!isOpen) return null;

  // ── Format biometric error messages ──
  const formatBiometricErrorMessage = (rawMessage) => {
    if (!rawMessage) return 'Face verification failed. Please align your face and try again.';
    const str = String(rawMessage).toLowerCase();
    if (str.includes('provider_not_configured') || str.includes('unavailable'))
      return 'Biometric verification service temporarily unavailable. Please try again later.';
    if (str.includes('glasses') || str.includes('goggles') || str.includes('eyewear'))
      return 'Please remove glasses or goggles and try again.';
    if (str.includes('cap') || str.includes('hat') || str.includes('headwear'))
      return 'Please remove your cap and keep your full face visible.';
    if (str.includes('mask') || str.includes('cover'))
      return 'Please remove your mask and try again.';
    if (str.includes('dark') || str.includes('lighting') || str.includes('brightness'))
      return 'Your face is too dark. Please move to a well-lit area.';
    if (str.includes('outside') || str.includes('frame') || str.includes('bounds') || str.includes('partially'))
      return 'Please position your complete face inside the frame.';
    if (str.includes('multiple') || str.includes('more than one') || str.includes('many faces'))
      return 'Only one person should be visible in the camera.';
    if (str.includes('liveness'))
      return 'Live face verification failed. Please try again.';
    if (str.includes('mismatch') || str.includes('match_failed') || str.includes('threshold') || str.includes('match'))
      return 'Face verification failed. Your face did not match your registered identity.';
    return rawMessage;
  };

  // ── Start Camera & Verification Session ──
  const handleStartCamera = async () => {
    setLoading(true);
    setStatusMessage('Initializing verification session...');

    try {
      // 1. Create session
      const sessionRes = await attendanceService.createVerificationSession();
      if (!sessionRes?.success || !sessionRes?.data?.sessionId) {
        throw new Error(sessionRes?.message || 'Failed to initialize verification session');
      }
      sessionIdRef.current = sessionRes.data.sessionId;

      // 2. Check liveness provider
      setStatusMessage('Checking verification provider...');
      const livenessRes = await attendanceService.initiateLivenessSession(sessionIdRef.current);

      if (livenessRes?.status === 'PROVIDER_NOT_CONFIGURED' || livenessRes?.data?.status === 'PROVIDER_NOT_CONFIGURED') {
        setIsProviderUnavailable(true);
        setStep('FAILURE');
        setLoading(false);
        setErrorMessage('Live biometric verification is temporarily unavailable. Provider configuration pending.');
        return;
      }

      // 3. Request camera
      setStatusMessage('Starting camera...');
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera is not supported by your browser. Please use Chrome, Safari, or Edge.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });

      streamRef.current = mediaStream;
      setVerSteps(prev => ({ ...prev, camera: 'completed' }));
      setGuideColor(COLORS.warning);
      setStep('CAMERA_ACTIVE');
      setLoading(false);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (err) {
      stopCamera();
      setLoading(false);
      setStep('FAILURE');
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to start verification');
    }
  };

  // ── Capture & Verify ──
  const handleCaptureAndVerify = async () => {
    if (!sessionIdRef.current || !videoRef.current) return;

    setLoading(true);
    setGuideColor(COLORS.primary);
    setButtonText('Verifying...');

    try {
      // Capture frame
      const videoEl = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = videoEl.videoWidth || 640;
      canvas.height = videoEl.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

      stopCamera();
      setStep('VERIFYING');

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      if (!blob) throw new Error('Failed to capture image from camera');
      const file = new File([blob], `live_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });

      // Liveness verification
      setButtonText('Verifying you are live...');
      setStatusMessage('Performing liveness verification...');
      setVerSteps(prev => ({ ...prev, liveness: 'active' }));

      const verRes = await attendanceService.completeVerification(sessionIdRef.current, file);

      if (!verRes?.data?.success) {
        const reason = verRes?.data?.reason || verRes?.message || 'Biometric verification failed';
        if (reason.includes('PROVIDER_NOT_CONFIGURED')) {
          setIsProviderUnavailable(true);
          throw new Error('Biometric verification service temporarily unavailable.');
        }
        throw new Error(reason);
      }

      setVerSteps(prev => ({ ...prev, liveness: 'completed' }));

      // Face matching
      setButtonText('Matching identity...');
      setStatusMessage('Matching face with registered identity...');
      setVerSteps(prev => ({ ...prev, faceMatch: 'active' }));

      // Small delay for UX so user sees the step transition
      await new Promise(r => setTimeout(r, 400));
      setVerSteps(prev => ({ ...prev, faceMatch: 'completed' }));

      // Record attendance
      setStatusMessage(actionType === 'CHECK_IN' ? 'Recording Check-In...' : 'Recording Check-Out...');
      setVerSteps(prev => ({ ...prev, attendance: 'active' }));

      const actionRes = actionType === 'CHECK_IN'
        ? await attendanceService.checkIn(sessionIdRef.current)
        : await attendanceService.checkOut(sessionIdRef.current);

      if (!actionRes?.success) {
        throw new Error(actionRes?.message || 'Failed to record attendance');
      }

      setVerSteps(prev => ({ ...prev, attendance: 'completed' }));

      setVerResult({
        reference: actionRes.data?.verification_reference || 'VERIFIED',
        attendanceDate: actionRes.data?.attendance_date,
        checkInTime: actionRes.data?.check_in_time,
        checkOutTime: actionRes.data?.check_out_time,
      });

      setStep('SUCCESS');
      setLoading(false);
      if (onSuccess) onSuccess(actionRes.data);

      // Auto-close after 2 seconds
      autoCloseTimerRef.current = setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (err) {
      stopCamera();
      setLoading(false);
      setGuideColor(COLORS.error);
      setVerSteps(prev => {
        const next = { ...prev };
        if (next.liveness === 'active') next.liveness = 'error';
        if (next.faceMatch === 'active') next.faceMatch = 'error';
        if (next.attendance === 'active') next.attendance = 'error';
        return next;
      });
      setStep('FAILURE');
      const rawErr = err.response?.data?.message || err.message || 'Attendance verification failed';
      setErrorMessage(formatBiometricErrorMessage(rawErr));
    }
  };

  const handleClose = () => {
    stopCamera();
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    resetState();
    onClose();
  };

  const handleRetry = () => {
    stopCamera();
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    resetState();
  };

  // ── Format time display ──
  const formatTimeDisplay = (timeStr) => {
    if (!timeStr) return '--:--';
    try {
      return new Date(timeStr).toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: true,
      });
    } catch { return timeStr; }
  };

  const formatDateDisplay = () => {
    const now = new Date();
    return now.toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  const employeeName = user?.name || user?.full_name || 'Employee';
  const employeeId = user?.employee_id || user?.emp_id || '';

  // ════════════════════════════════════════════════════════════════════════════
  //  RENDER: INSTRUCTIONS SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  const renderInstructions = () => (
    <div className="fv-fade-in" style={{ textAlign: 'center', padding: isMobile ? '16px 0' : '20px 0' }}>
      {/* Face icon */}
      <div style={{
        width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
        background: COLORS.infoBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <ScanFace size={36} color={COLORS.primary} />
      </div>

      <h3 style={{
        margin: '0 0 8px', fontSize: '20px', fontWeight: 700, color: COLORS.navy,
      }}>
        {actionType === 'CHECK_IN' ? 'Mark Today\'s Attendance' : 'Mark Check-Out'}
      </h3>
      <p style={{
        margin: '0 0 24px', fontSize: '15px', color: COLORS.textSecondary, lineHeight: 1.6,
      }}>
        Verify your identity before marking today's attendance.
      </p>

      {/* Employee info */}
      {(employeeName || employeeId) && (
        <div style={{
          background: COLORS.infoBg, border: `1px solid ${COLORS.infoBorder}`,
          borderRadius: '12px', padding: '12px 16px', marginBottom: '20px',
          display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: COLORS.primary, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <User size={18} color={COLORS.white} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: COLORS.navy }}>{employeeName}</div>
            {employeeId && (
              <div style={{ fontSize: '12px', color: COLORS.textSecondary }}>
                Employee ID: {employeeId}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Before you start checklist */}
      <div style={{
        background: COLORS.infoBg, border: `1px solid ${COLORS.infoBorder}`,
        borderRadius: '14px', padding: '18px 20px', marginBottom: '24px', textAlign: 'left',
      }}>
        <h4 style={{
          margin: '0 0 14px', fontSize: '14px', fontWeight: 700, color: COLORS.navy,
        }}>
          Before you start
        </h4>
        {[
          'Make sure your face is clearly visible',
          'Sit in a well-lit area',
          'Look directly at the camera',
          'Remove sunglasses or face covering',
          'Keep your face inside the frame',
        ].map((tip, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            marginBottom: i < 4 ? '10px' : 0,
            fontSize: '13.5px', color: COLORS.text,
          }}>
            <CheckCircle size={16} color={COLORS.success} />
            {tip}
          </div>
        ))}
      </div>

      <p style={{
        margin: '0 0 24px', fontSize: '12px', color: COLORS.textSecondary,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
      }}>
        <ShieldCheck size={14} color={COLORS.textSecondary} />
        This verification uses live face verification.
      </p>

      {/* Action buttons */}
      <div style={{
        display: 'flex', gap: '12px',
        flexDirection: isMobile ? 'column-reverse' : 'row',
        justifyContent: 'center',
      }}>
        <button
          onClick={handleClose}
          style={{
            flex: isMobile ? undefined : 1,
            padding: '14px 24px', borderRadius: '10px',
            border: `1px solid ${COLORS.border}`, background: COLORS.white,
            color: COLORS.text, fontSize: '15px', fontWeight: 600, cursor: 'pointer',
            transition: 'background 0.2s',
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleStartCamera}
          disabled={loading}
          style={{
            flex: isMobile ? undefined : 1.5,
            padding: '14px 24px', borderRadius: '10px', border: 'none',
            background: loading ? COLORS.disabled : COLORS.primary,
            color: COLORS.white, fontSize: '15px', fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'background 0.2s',
          }}
        >
          {loading ? (
            <>
              <Loader size={18} className="fv-spin" />
              {statusMessage || 'Initializing...'}
            </>
          ) : (
            <>
              <Camera size={18} />
              Continue
            </>
          )}
        </button>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  //  RENDER: CAMERA ACTIVE SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  const renderCamera = () => (
    <div className="fv-fade-in">
      <div style={{
        display: 'flex', flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '16px' : '20px',
      }}>
        {/* ── Left: Camera Preview ── */}
        <div style={{ flex: isMobile ? undefined : '0 0 58%' }}>
          <div style={{
            width: '100%',
            height: isMobile ? '52vw' : '380px',
            maxHeight: isMobile ? '320px' : undefined,
            borderRadius: '16px', overflow: 'hidden',
            background: '#0A0A0A', position: 'relative',
            border: `2px solid ${COLORS.border}`,
          }}>
            <video
              ref={videoRef}
              autoPlay playsInline muted
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                transform: 'scaleX(-1)',
              }}
            />

            {/* Subtle dark edge vignette */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.35) 100%)',
            }} />

            {/* Face guide oval */}
            <FaceGuideOval color={guideColor} pulsing={false} />

            {/* Camera active badge */}
            <div style={{
              position: 'absolute', top: '12px', left: '12px',
              background: 'rgba(22, 163, 74, 0.9)', color: COLORS.white,
              padding: '5px 12px', borderRadius: '999px',
              fontSize: '11px', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '6px',
              backdropFilter: 'blur(4px)',
            }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%', background: COLORS.white,
              }} />
              Camera Active
            </div>

            {/* Status instruction at bottom */}
            <div style={{
              position: 'absolute', bottom: '14px', left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(15, 23, 42, 0.8)', color: COLORS.white,
              padding: '8px 18px', borderRadius: '999px',
              fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap',
              backdropFilter: 'blur(4px)',
            }}>
              Align your face inside the frame
            </div>
          </div>
        </div>

        {/* ── Right: Information Panel ── */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', gap: '14px',
          minWidth: 0,
        }}>
          {/* Live Face Verification info card */}
          <div style={{
            background: COLORS.infoBg, border: `1px solid ${COLORS.infoBorder}`,
            borderRadius: '14px', padding: '16px',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px',
            }}>
              <Info size={18} color={COLORS.primary} />
              <span style={{ fontSize: '14px', fontWeight: 700, color: COLORS.navy }}>
                Live Face Verification
              </span>
            </div>
            <p style={{
              margin: 0, fontSize: '12.5px', color: COLORS.textSecondary, lineHeight: 1.5,
            }}>
              We are verifying that you are a real person before marking your attendance.
            </p>
          </div>

          {/* Verification Steps */}
          <div style={{
            background: COLORS.white, border: `1px solid ${COLORS.border}`,
            borderRadius: '14px', padding: '16px',
            display: 'flex', flexDirection: 'column', gap: '14px',
          }}>
            <VerificationStep
              icon={Camera}
              label="Camera"
              description="Camera connected"
              status={verSteps.camera}
            />
            <VerificationStep
              icon={ScanFace}
              label="Live Verification"
              description="Verify that you are physically present"
              status={verSteps.liveness}
            />
            <VerificationStep
              icon={Eye}
              label="Face Matching"
              description="Match with your registered KYC identity"
              status={verSteps.faceMatch}
            />
            <VerificationStep
              icon={CheckCircle}
              label="Attendance"
              description="Mark today's attendance"
              status={verSteps.attendance}
            />
          </div>

          {/* Tips card */}
          {!isMobile && (
            <div style={{
              background: COLORS.tipsBg, border: `1px solid ${COLORS.tipsBorder}`,
              borderRadius: '14px', padding: '14px 16px',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px',
              }}>
                <Sun size={15} color={COLORS.success} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: COLORS.navy }}>
                  Tips for best results
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {[
                  'Be in a well-lit environment',
                  'Look directly at the camera',
                  'Keep your face inside the frame',
                  'Remove sunglasses or face mask',
                  'Avoid strong backlighting',
                ].map((tip, i) => (
                  <div key={i} style={{
                    fontSize: '11.5px', color: COLORS.textSecondary,
                    display: 'flex', alignItems: 'center', gap: '6px',
                  }}>
                    <div style={{
                      width: 4, height: 4, borderRadius: '50%', background: COLORS.success, flexShrink: 0,
                    }} />
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile tips (collapsed) */}
      {isMobile && (
        <div style={{
          background: COLORS.tipsBg, border: `1px solid ${COLORS.tipsBorder}`,
          borderRadius: '14px', padding: '12px 16px', marginTop: '4px',
          display: 'flex', flexWrap: 'wrap', gap: '8px',
        }}>
          {['Good lighting', 'Look at camera', 'Face clearly visible'].map((tip, i) => (
            <span key={i} style={{
              fontSize: '11px', color: COLORS.success, fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: '4px',
            }}>
              <CheckCircle size={12} /> {tip}
            </span>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div style={{
        display: 'flex', gap: '12px', marginTop: '18px',
        flexDirection: isMobile ? 'column-reverse' : 'row',
        justifyContent: 'flex-end',
      }}>
        <button
          onClick={handleClose}
          style={{
            padding: '14px 28px', borderRadius: '10px',
            border: `1px solid ${COLORS.border}`, background: COLORS.white,
            color: COLORS.text, fontSize: '15px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleCaptureAndVerify}
          disabled={loading}
          style={{
            padding: '14px 32px', borderRadius: '10px', border: 'none',
            background: loading ? COLORS.disabled : COLORS.primary,
            color: COLORS.white, fontSize: '15px', fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            minWidth: '220px',
            transition: 'background 0.2s',
          }}
        >
          {loading ? (
            <>
              <Loader size={18} className="fv-spin" />
              {buttonText}
            </>
          ) : (
            <>
              <CheckCircle size={18} />
              Verify & Mark Attendance
            </>
          )}
        </button>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  //  RENDER: VERIFYING SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  const renderVerifying = () => (
    <div className="fv-fade-in" style={{ padding: isMobile ? '24px 0' : '32px 0' }}>
      <div style={{
        display: 'flex', flexDirection: isMobile ? 'column' : 'row',
        gap: '28px', alignItems: 'flex-start',
      }}>
        {/* Left: processing visual */}
        <div style={{
          flex: isMobile ? undefined : '0 0 50%',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '20px',
        }}>
          <div style={{
            width: 120, height: 120, borderRadius: '50%',
            background: COLORS.infoBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '24px', position: 'relative',
          }}>
            <ScanFace size={48} color={COLORS.primary} />
            {/* Spinning ring */}
            <div style={{
              position: 'absolute', inset: -4,
              border: `3px solid ${COLORS.border}`,
              borderTopColor: COLORS.primary,
              borderRadius: '50%',
            }} className="fv-spin" />
          </div>

          <h3 style={{
            margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: COLORS.navy,
            textAlign: 'center',
          }}>
            Verification in Progress
          </h3>
          <p style={{
            margin: 0, fontSize: '13px', color: COLORS.textSecondary, textAlign: 'center',
          }}>
            {statusMessage || 'Please wait while we verify your identity...'}
          </p>
        </div>

        {/* Right: Verification Steps */}
        <div style={{
          flex: 1,
          background: COLORS.white, border: `1px solid ${COLORS.border}`,
          borderRadius: '14px', padding: '20px',
          display: 'flex', flexDirection: 'column', gap: '16px',
        }}>
          <h4 style={{
            margin: 0, fontSize: '14px', fontWeight: 700, color: COLORS.navy,
          }}>
            Verification Steps
          </h4>
          <VerificationStep
            icon={Camera}
            label="Camera"
            description="Camera connected"
            status={verSteps.camera}
          />
          <VerificationStep
            icon={ScanFace}
            label="Live Verification"
            description={verSteps.liveness === 'active' ? 'Verifying you are live...' : 'Liveness check'}
            status={verSteps.liveness}
          />
          <VerificationStep
            icon={Eye}
            label="Face Matching"
            description={verSteps.faceMatch === 'active' ? 'Matching identity...' : 'Match with KYC identity'}
            status={verSteps.faceMatch}
          />
          <VerificationStep
            icon={CheckCircle}
            label="Attendance"
            description={verSteps.attendance === 'active' ? 'Recording attendance...' : 'Mark attendance'}
            status={verSteps.attendance}
          />
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  //  RENDER: SUCCESS SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  const renderSuccess = () => (
    <div className="fv-fade-in" style={{
      textAlign: 'center', padding: isMobile ? '28px 8px' : '40px 20px',
    }}>
      {/* Success icon */}
      <div className="fv-scale-in" style={{
        width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px',
        background: COLORS.successBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <CheckCircle size={40} color={COLORS.success} />
      </div>

      <h3 style={{
        margin: '0 0 8px', fontSize: '22px', fontWeight: 700, color: COLORS.success,
      }}>
        Attendance Marked Successfully
      </h3>

      {verResult && (
        <div style={{
          margin: '20px auto 0', maxWidth: '320px',
          display: 'flex', flexDirection: 'column', gap: '10px',
        }}>
          {verResult.checkInTime && (
            <div style={{
              fontSize: '16px', fontWeight: 600, color: COLORS.navy,
            }}>
              Check-in: {formatTimeDisplay(verResult.checkInTime)}
            </div>
          )}
          {verResult.checkOutTime && (
            <div style={{
              fontSize: '16px', fontWeight: 600, color: COLORS.navy,
            }}>
              Check-out: {formatTimeDisplay(verResult.checkOutTime)}
            </div>
          )}
          <div style={{
            fontSize: '14px', color: COLORS.textSecondary,
          }}>
            {formatDateDisplay()}
          </div>
        </div>
      )}

      <button
        onClick={handleClose}
        style={{
          marginTop: '28px', padding: '14px 48px', borderRadius: '10px', border: 'none',
          background: COLORS.success, color: COLORS.white,
          fontSize: '15px', fontWeight: 600, cursor: 'pointer',
        }}
      >
        Done
      </button>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  //  RENDER: FAILURE SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  const renderFailure = () => {
    const isServiceIssue = isProviderUnavailable ||
      (errorMessage && (errorMessage.toLowerCase().includes('unavailable') || errorMessage.toLowerCase().includes('provider')));

    const iconColor = isServiceIssue ? COLORS.warning : COLORS.error;
    const iconBg = isServiceIssue ? COLORS.warningBg : COLORS.errorBg;
    const IconComponent = isServiceIssue ? AlertTriangle : XCircle;

    return (
      <div className="fv-fade-in" style={{
        textAlign: 'center', padding: isMobile ? '24px 8px' : '32px 20px',
      }}>
        {/* Error icon */}
        <div className="fv-scale-in" style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
          background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <IconComponent size={36} color={iconColor} />
        </div>

        <h3 style={{
          margin: '0 0 8px', fontSize: '20px', fontWeight: 700, color: COLORS.navy,
        }}>
          {isServiceIssue ? 'Verification Service Unavailable' : 'Verification Unsuccessful'}
        </h3>

        {/* Error message card */}
        <div style={{
          background: isServiceIssue ? COLORS.warningBg : COLORS.errorBg,
          border: `1px solid ${isServiceIssue ? '#FCD34D' : '#FECACA'}`,
          borderRadius: '12px', padding: '14px 18px',
          margin: '16px auto 0', maxWidth: '400px',
          color: isServiceIssue ? '#92400E' : '#991B1B',
          fontSize: '13.5px', lineHeight: 1.6, textAlign: 'left',
        }}>
          {isServiceIssue ? (
            <>
              <p style={{ margin: '0 0 8px' }}>{errorMessage}</p>
              <p style={{ margin: 0, fontWeight: 600 }}>
                Your attendance has NOT been marked.
              </p>
            </>
          ) : (
            <>
              <p style={{ margin: '0 0 12px' }}>
                {errorMessage || 'We couldn\'t verify your identity.'}
              </p>
              <p style={{ margin: '0 0 8px', fontWeight: 600 }}>Please make sure:</p>
              <ul style={{ margin: 0, paddingLeft: '18px' }}>
                <li>Your face is clearly visible</li>
                <li>Lighting is sufficient</li>
                <li>You are looking at the camera</li>
                <li>You are not wearing sunglasses</li>
              </ul>
            </>
          )}
        </div>

        {/* Retry button */}
        <button
          onClick={handleRetry}
          style={{
            marginTop: '24px', padding: '14px 40px', borderRadius: '10px', border: 'none',
            background: COLORS.primary, color: COLORS.white,
            fontSize: '15px', fontWeight: 600, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: '8px',
          }}
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════════════════════
  //  RENDER: MODAL WRAPPER
  // ════════════════════════════════════════════════════════════════════════════
  const isWideStep = step === 'CAMERA_ACTIVE' || step === 'VERIFYING';

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(4px)',
      zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: isMobile ? '12px' : '20px',
    }}>
      <div style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.border}`,
        borderRadius: '20px',
        width: '100%',
        maxWidth: isWideStep && !isMobile ? '900px' : '520px',
        maxHeight: '92vh',
        overflowY: 'auto',
        padding: isMobile ? '20px' : '28px',
        boxShadow: '0 24px 48px rgba(15, 23, 42, 0.15)',
        position: 'relative',
        transition: 'max-width 0.3s ease',
      }}>
        {/* ── Modal Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: `1px solid ${COLORS.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: 40, height: 40, borderRadius: '12px',
              background: COLORS.infoBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ShieldCheck size={22} color={COLORS.primary} />
            </div>
            <div>
              <h2 style={{
                margin: 0, fontSize: isMobile ? '16px' : '18px',
                fontWeight: 700, color: COLORS.navy,
              }}>
                Face Verification for Attendance
              </h2>
              <p style={{
                margin: 0, fontSize: '12.5px', color: COLORS.textSecondary,
              }}>
                {step === 'INSTRUCTIONS' && 'Verify your identity to mark attendance'}
                {step === 'CAMERA_ACTIVE' && 'Look into the camera and follow the instructions'}
                {step === 'VERIFYING' && 'Processing your verification...'}
                {step === 'SUCCESS' && 'Verification complete'}
                {step === 'FAILURE' && 'Verification could not be completed'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              width: 36, height: 36, borderRadius: '10px',
              border: `1px solid ${COLORS.border}`, background: COLORS.white,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: COLORS.textSecondary,
              flexShrink: 0, transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = COLORS.background; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = COLORS.white; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Modal Body ── */}
        {step === 'INSTRUCTIONS' && renderInstructions()}
        {step === 'CAMERA_ACTIVE' && renderCamera()}
        {step === 'VERIFYING' && renderVerifying()}
        {step === 'SUCCESS' && renderSuccess()}
        {step === 'FAILURE' && renderFailure()}

        {/* ── Security Footer ── */}
        <div style={{
          marginTop: '16px', paddingTop: '12px',
          borderTop: `1px solid ${COLORS.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          fontSize: '11.5px', color: COLORS.textSecondary,
        }}>
          <ShieldCheck size={13} color={COLORS.textSecondary} />
          Secure biometric verification
        </div>
      </div>
    </div>
  );
}
