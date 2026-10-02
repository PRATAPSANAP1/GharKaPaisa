import React, { useState, useEffect, useRef } from 'react';
import { 
  FaPhone, FaPhoneSlash, FaVideo, FaVideoSlash, 
  FaMicrophone, FaMicrophoneSlash, FaExclamationTriangle
} from 'react-icons/fa';
import { getMessengerSocket } from '../../services/messengerSocket';
import api from '../../services/api';

const DEFAULT_STUN_CONFIG = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
];

const RINGING_TIMEOUT_MS = 45000; // 45s ringing timeout

export default function MessengerCallModal({
  activeCall, // { callId, recipientId, recipientName, callType: 'voice' | 'video', isIncoming: boolean, callerId, callerName, conversationId, sdp }
  onCloseCall
}) {
  const [callState, setCallState] = useState(
    activeCall?.isIncoming ? 'INCOMING_RINGING' : 'OUTGOING_RINGING'
  );
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(activeCall?.callType === 'voice');
  const [errorMessage, setErrorMessage] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isActionPending, setIsActionPending] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const durationTimerRef = useRef(null);
  const ringingTimerRef = useRef(null);
  const closeTimeoutRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);
  const isActionPendingRef = useRef(false);
  const isEndedRef = useRef(false);
  const currentCallIdRef = useRef(activeCall?.callId || null);
  const pendingOfferRef = useRef(activeCall?.sdp || null);

  const isVideoCall = activeCall?.callType === 'video';
  const peerName = activeCall?.isIncoming 
    ? (activeCall.callerName || 'Caller') 
    : (activeCall.recipientName || 'User');

  // Fetch dynamic ICE servers (STUN/TURN) securely from backend
  const fetchIceServers = async () => {
    try {
      const res = await api.get('/messenger/turn-credentials');
      if (res.data?.success && res.data?.data?.iceServers) {
        return res.data.data.iceServers;
      }
    } catch (err) {
      // Fallback to default STUN without leaking technical details
    }
    return DEFAULT_STUN_CONFIG;
  };

  // Safely stop and release all hardware media tracks
  const stopLocalMedia = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (_) {}
      });
      localStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  const clearRingingTimer = () => {
    if (ringingTimerRef.current) {
      clearTimeout(ringingTimerRef.current);
      ringingTimerRef.current = null;
    }
  };

  const clearDurationTimer = () => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
  };

  // Teardown WebRTC peer connection & media streams
  const cleanupCall = () => {
    clearRingingTimer();
    clearDurationTimer();
    pendingIceCandidatesRef.current = [];

    stopLocalMedia();

    if (pcRef.current) {
      try {
        pcRef.current.onicecandidate = null;
        pcRef.current.ontrack = null;
        pcRef.current.oniceconnectionstatechange = null;
        pcRef.current.onconnectionstatechange = null;
        pcRef.current.onicegatheringstatechange = null;
        pcRef.current.close();
      } catch (_) {}
      pcRef.current = null;
    }
  };

  // Deterministic end session
  const endCallSession = (finalState = 'ENDED', errorMsg = null) => {
    if (isEndedRef.current && finalState === 'ENDED') return;
    isEndedRef.current = true;

    clearRingingTimer();
    clearDurationTimer();
    cleanupCall();

    setCallState(finalState);
    if (errorMsg) setErrorMessage(errorMsg);

    console.log(`[CALL] ${finalState.toLowerCase()}`);

    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      onCloseCall();
    }, 1600);
  };

  // Drain pending ICE candidates once remote description is set
  const drainPendingIceCandidates = async (pc) => {
    if (!pc || !pc.remoteDescription) return;
    while (pendingIceCandidatesRef.current.length > 0) {
      const cand = pendingIceCandidatesRef.current.shift();
      if (cand) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        } catch (err) {
          console.warn('[WEBRTC] ICE candidate drain error');
        }
      }
    }
  };

  // Initialize WebRTC Peer Connection with lifecycle safeguards
  const createPeerConnection = (socket, targetUserId, iceServersConfig) => {
    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch (_) {}
      pcRef.current = null;
    }

    const rtcConfig = {
      iceServers: iceServersConfig || DEFAULT_STUN_CONFIG
    };

    const pc = new RTCPeerConnection(rtcConfig);
    pcRef.current = pc;

    // Send local ICE candidates to peer via signaling
    pc.onicecandidate = (event) => {
      if (event.candidate && socket && !isEndedRef.current) {
        socket.emit('call:ice-candidate', {
          call_id: currentCallIdRef.current,
          target_user_id: targetUserId,
          candidate: event.candidate
        });
      }
    };

    // Attach remote stream to audio/video element exactly once
    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Diagnostics for ICE states
    pc.onicegatheringstatechange = () => {
      // Safe gathering state
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[WEBRTC] ICE state: ${pc.iceConnectionState}`);
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        clearRingingTimer();
        setCallState('CONNECTED');
        startTimer();
        console.log('[CALL] connected');
      } else if (pc.iceConnectionState === 'failed') {
        console.log('[CALL] failed');
        endCallSession('FAILED', 'Unable to establish the call connection. Please check your network and try again.');
      } else if (pc.iceConnectionState === 'disconnected') {
        console.log('[WEBRTC] ICE state: disconnected (transient network recovery allowed)');
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WEBRTC] connection state: ${pc.connectionState}`);
      if (pc.connectionState === 'connected') {
        clearRingingTimer();
        setCallState('CONNECTED');
        startTimer();
        console.log('[CALL] connected');
      } else if (pc.connectionState === 'failed') {
        console.log('[CALL] failed');
        endCallSession('FAILED', 'Unable to establish the call connection. Please check your network and try again.');
      } else if (pc.connectionState === 'closed') {
        endCallSession('ENDED', 'Call ended.');
      }
    };

    return pc;
  };

  const startTimer = () => {
    if (durationTimerRef.current) return;
    setCallDuration(0);
    durationTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  // Initialize local Camera / Microphone with user-friendly error handling
  const startLocalStream = async (wantVideo) => {
    try {
      const constraints = {
        audio: true,
        video: wantVideo ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      let msg = 'Failed to access media devices.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = wantVideo 
          ? 'Camera access is required for video calling.'
          : 'Microphone access is required for audio calling.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No microphone or camera device found on this system.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = 'Camera or microphone is currently in use by another application.';
      }
      setErrorMessage(msg);
      throw new Error(msg);
    }
  };

  // Start Outgoing Call Flow with in-flight guard and ringing timeout
  const startOutgoingCall = async () => {
    const socket = getMessengerSocket();
    if (!socket || !socket.connected) {
      endCallSession('FAILED', 'User is currently unavailable.');
      return;
    }

    try {
      console.log('[CALL] initiate');
      setCallState('OUTGOING_RINGING');

      // Start ringing timeout for unanswered outgoing call
      clearRingingTimer();
      ringingTimerRef.current = setTimeout(() => {
        if (!isEndedRef.current) {
          const s = getMessengerSocket();
          if (s && currentCallIdRef.current) {
            s.emit('call:cancel', {
              call_id: currentCallIdRef.current,
              recipient_id: activeCall.recipientId
            });
          }
          endCallSession('ENDED', 'User is currently unavailable.');
        }
      }, RINGING_TIMEOUT_MS);

      const [stream, iceServers] = await Promise.all([
        startLocalStream(isVideoCall),
        fetchIceServers()
      ]);

      if (isEndedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      const pc = createPeerConnection(socket, activeCall.recipientId, iceServers);

      // Add tracks exactly once
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Create WebRTC SDP offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('call:initiate', {
        recipient_id: activeCall.recipientId,
        conversation_id: activeCall.conversationId,
        call_type: activeCall.callType,
        sdp: offer
      }, (ack) => {
        if (!ack?.success) {
          const reason = ack?.reason === 'BUSY'
            ? 'User is already on another call.'
            : 'User is currently unavailable.';
          endCallSession(ack?.reason === 'BUSY' ? 'BUSY' : 'FAILED', reason);
        }
      });
    } catch (err) {
      endCallSession('FAILED', err.message || 'Unable to initiate call.');
    }
  };

  // Accept Incoming Call Flow with double-action protection
  const acceptIncomingCall = async () => {
    if (isActionPendingRef.current || isEndedRef.current) return;
    isActionPendingRef.current = true;
    setIsActionPending(true);
    clearRingingTimer();

    const socket = getMessengerSocket();
    if (!socket || !socket.connected) {
      endCallSession('FAILED', 'Unable to establish the call connection. Please check your network and try again.');
      return;
    }

    try {
      console.log('[CALL] connecting');
      setCallState('CONNECTING');

      const [stream, iceServers] = await Promise.all([
        startLocalStream(isVideoCall),
        fetchIceServers()
      ]);

      if (isEndedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      const pc = createPeerConnection(socket, activeCall.callerId, iceServers);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const sdpOffer = activeCall.sdp || pendingOfferRef.current;
      if (sdpOffer) {
        await pc.setRemoteDescription(new RTCSessionDescription(sdpOffer));
        await drainPendingIceCandidates(pc);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('call:answer', {
          call_id: currentCallIdRef.current,
          caller_id: activeCall.callerId,
          sdp: answer
        });
      }
    } catch (err) {
      endCallSession('FAILED', err.message || 'Unable to establish the call connection.');
    } finally {
      setIsActionPending(false);
      isActionPendingRef.current = false;
    }
  };

  // Reject Incoming Call
  const rejectIncomingCall = () => {
    if (isActionPendingRef.current || isEndedRef.current) return;
    isActionPendingRef.current = true;
    setIsActionPending(true);
    clearRingingTimer();

    const socket = getMessengerSocket();
    if (socket && currentCallIdRef.current) {
      socket.emit('call:reject', {
        call_id: currentCallIdRef.current,
        caller_id: activeCall.callerId,
        reason: 'Call declined'
      });
    }
    endCallSession('ENDED', 'Call declined.');
  };

  // Hangup Outgoing or Active Call
  const hangupCall = () => {
    if (isActionPendingRef.current || isEndedRef.current) return;
    isActionPendingRef.current = true;
    setIsActionPending(true);
    clearRingingTimer();

    setCallState('ENDING');

    const socket = getMessengerSocket();
    if (socket && currentCallIdRef.current) {
      const targetUserId = activeCall.isIncoming ? activeCall.callerId : activeCall.recipientId;
      if (callState === 'OUTGOING_RINGING') {
        socket.emit('call:cancel', { call_id: currentCallIdRef.current, recipient_id: targetUserId });
      } else {
        socket.emit('call:end', { call_id: currentCallIdRef.current, target_user_id: targetUserId });
      }
    }
    endCallSession('ENDED', 'Call ended.');
  };

  // Register Socket Event Listeners with strict cleanup
  useEffect(() => {
    const socket = getMessengerSocket();
    if (!socket) return;

    // Outgoing ringing confirmation
    const handleRinging = (data) => {
      console.log('[CALL] ringing');
      if (data.call_id) currentCallIdRef.current = data.call_id;
    };

    // Recipient Unavailable
    const handleUnavailable = (data) => {
      endCallSession('FAILED', 'User is currently unavailable.');
    };

    // Socket Call Error
    const handleError = (data) => {
      endCallSession('FAILED', 'Unable to establish the call connection. Please check your network and try again.');
    };

    // Incoming Call SDP Offer
    const handleOffer = async (data) => {
      const { call_id, caller_id, sdp } = data || {};
      if (call_id) currentCallIdRef.current = call_id;
      if (sdp) pendingOfferRef.current = sdp;

      if (pcRef.current && sdp) {
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
          await drainPendingIceCandidates(pcRef.current);
          if (callState === 'CONNECTING' || callState === 'CONNECTED') {
            const answer = await pcRef.current.createAnswer();
            await pcRef.current.setLocalDescription(answer);
            socket.emit('call:answer', { call_id, caller_id, sdp: answer });
          }
        } catch (e) {
          console.warn('[WEBRTC] Error processing remote offer');
        }
      }
    };

    // Outgoing Call SDP Answer
    const handleAnswer = async (data) => {
      const { sdp } = data || {};
      clearRingingTimer();
      console.log('[CALL] connecting');
      setCallState('CONNECTING');
      if (pcRef.current && sdp) {
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
          await drainPendingIceCandidates(pcRef.current);
        } catch (e) {
          console.warn('[WEBRTC] Error processing remote answer');
        }
      }
    };

    // ICE Candidate handler with queuing
    const handleIceCandidate = async (data) => {
      const { candidate } = data || {};
      if (!candidate) return;

      if (pcRef.current && pcRef.current.remoteDescription && pcRef.current.remoteDescription.type) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('[WEBRTC] Error adding ICE candidate');
        }
      } else {
        pendingIceCandidatesRef.current.push(candidate);
      }
    };

    // Peer Rejected
    const handleRejected = () => {
      endCallSession('ENDED', 'User is currently unavailable.');
    };

    // Peer Cancelled
    const handleCancelled = () => {
      endCallSession('ENDED', 'Caller cancelled the call.');
    };

    // Peer Busy
    const handleBusy = () => {
      endCallSession('BUSY', 'User is already on another call.');
    };

    // Call Ended by Peer
    const handleEnded = () => {
      endCallSession('ENDED', 'Call ended.');
    };

    socket.on('call:ringing', handleRinging);
    socket.on('call:unavailable', handleUnavailable);
    socket.on('call:error', handleError);
    socket.on('call:offer', handleOffer);
    socket.on('call:answer', handleAnswer);
    socket.on('call:ice-candidate', handleIceCandidate);
    socket.on('call:rejected', handleRejected);
    socket.on('call:cancelled', handleCancelled);
    socket.on('call:busy', handleBusy);
    socket.on('call:ended', handleEnded);

    if (activeCall.isIncoming) {
      console.log('[CALL] incoming');
      // Set incoming ringing timeout
      clearRingingTimer();
      ringingTimerRef.current = setTimeout(() => {
        if (!isEndedRef.current && callState === 'INCOMING_RINGING') {
          rejectIncomingCall();
        }
      }, RINGING_TIMEOUT_MS);
    } else {
      startOutgoingCall();
    }

    return () => {
      socket.off('call:ringing', handleRinging);
      socket.off('call:unavailable', handleUnavailable);
      socket.off('call:error', handleError);
      socket.off('call:offer', handleOffer);
      socket.off('call:answer', handleAnswer);
      socket.off('call:ice-candidate', handleIceCandidate);
      socket.off('call:rejected', handleRejected);
      socket.off('call:cancelled', handleCancelled);
      socket.off('call:busy', handleBusy);
      socket.off('call:ended', handleEnded);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      cleanupCall();
    };
  }, []);

  // Controls Mute / Unmute
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Controls Video On / Off
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getStatusSubtext = () => {
    if (callState === 'CONNECTED') return `In Call • ${formatDuration(callDuration)}`;
    if (callState === 'INCOMING_RINGING') return `Incoming ${isVideoCall ? 'Video' : 'Audio'} Call...`;
    if (callState === 'OUTGOING_RINGING') return 'Calling...';
    if (callState === 'CONNECTING') return 'Connecting...';
    if (callState === 'ENDING') return 'Ending call...';
    if (callState === 'ENDED') return 'Call ended';
    if (callState === 'BUSY') return 'User busy';
    if (callState === 'FAILED') return 'Call failed';
    return callState;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: callState === 'INCOMING_RINGING' ? 'rgba(15, 23, 42, 0.65)' : 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(12px)',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: callState === 'INCOMING_RINGING' ? 'flex-start' : 'center',
        padding: '24px',
        fontFamily: "'Inter', sans-serif"
      }}
    >
      {/* ── TOP FLOATING INCOMING CALL BANNER ── */}
      {callState === 'INCOMING_RINGING' ? (
        <div
          style={{
            marginTop: '20px',
            width: '100%',
            maxWidth: '440px',
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
            borderRadius: '24px',
            border: '2px solid rgba(16, 185, 129, 0.5)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.7), 0 0 25px rgba(16, 185, 129, 0.25)',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            animation: 'slideDown 0.3s ease-out'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#2563EB',
                color: '#FFFFFF',
                fontSize: '22px',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(37,99,235,0.4)',
                border: '3px solid rgba(255,255,255,0.2)'
              }}
            >
              {peerName.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#F8FAFC', marginBottom: '2px' }}>
                {peerName}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                Incoming {isVideoCall ? 'Video' : 'Audio'} Call...
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '100%' }}>
            {/* Green Accept Button */}
            <button
              type="button"
              onClick={acceptIncomingCall}
              disabled={isActionPending || isEndedRef.current}
              style={{
                flex: 1,
                background: isActionPending ? '#059669' : '#10B981',
                opacity: isActionPending ? 0.7 : 1,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '16px',
                padding: '14px',
                fontSize: '15px',
                fontWeight: 900,
                cursor: isActionPending ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 6px 20px rgba(16,185,129,0.5)',
                transition: 'all 0.2s'
              }}
            >
              <FaPhone size={18} /> {isActionPending ? 'Connecting...' : 'Receive Call'}
            </button>

            {/* Red Reject Button */}
            <button
              type="button"
              onClick={rejectIncomingCall}
              disabled={isActionPending || isEndedRef.current}
              style={{
                flex: 1,
                background: isActionPending ? '#DC2626' : '#EF4444',
                opacity: isActionPending ? 0.7 : 1,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '16px',
                padding: '14px',
                fontSize: '15px',
                fontWeight: 900,
                cursor: isActionPending ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 6px 20px rgba(239,68,68,0.5)',
                transition: 'all 0.2s'
              }}
            >
              <FaPhoneSlash size={18} /> Decline
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            width: '100%',
            maxWidth: isVideoCall ? '880px' : '420px',
            background: '#1E293B',
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative'
          }}
        >
          {/* Error / Status Warning Banner */}
          {errorMessage && (
            <div style={{
              background: '#FEF2F2',
              borderBottom: '1px solid #FCA5A5',
              color: '#991B1B',
              padding: '12px 18px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FaExclamationTriangle size={16} color="#DC2626" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Video Stage / Avatar Header */}
          {isVideoCall ? (
            <div style={{ position: 'relative', width: '100%', height: '420px', background: '#0F172A', overflow: 'hidden' }}>
              {/* Remote Main Video */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />

              {/* Local Inset Self Video */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '16px',
                  right: '16px',
                  width: '140px',
                  height: '180px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '2px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
                  background: '#1E293B'
                }}
              >
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                />
              </div>

              {/* Top Bar overlay */}
              <div style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                background: 'rgba(15,23,42,0.75)',
                backdropFilter: 'blur(8px)',
                padding: '8px 16px',
                borderRadius: '20px',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 800,
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                {peerName} • {getStatusSubtext()}
              </div>
            </div>
          ) : (
            <div style={{
              padding: '40px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              background: 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)'
            }}>
              {/* User Avatar */}
              <div
                style={{
                  width: '88px',
                  height: '88px',
                  borderRadius: '50%',
                  background: '#2563EB',
                  color: '#FFFFFF',
                  fontSize: '32px',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 10px 25px rgba(37,99,235,0.4)',
                  border: '4px solid rgba(255,255,255,0.1)'
                }}
              >
                {peerName.charAt(0).toUpperCase()}
              </div>

              <div style={{ textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: 900, color: '#F8FAFC' }}>
                  {peerName}
                </h3>
                <p style={{
                  margin: 0,
                  fontSize: '13px',
                  fontWeight: 700,
                  color: callState === 'CONNECTED' ? '#10B981' : (callState === 'FAILED' || callState === 'BUSY' ? '#EF4444' : '#94A3B8')
                }}>
                  {getStatusSubtext()}
                </p>
              </div>

              {/* Remote audio stream */}
              <audio ref={remoteVideoRef} autoPlay style={{ display: 'none' }} />
            </div>
          )}

          {/* ── Control Action Buttons Bar ── */}
          <div style={{
            padding: '20px',
            background: '#0F172A',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px'
          }}>
            {/* Mute Microphone */}
            <button
              type="button"
              onClick={toggleMute}
              disabled={callState === 'ENDING' || callState === 'ENDED'}
              style={{
                background: isMuted ? '#EF4444' : 'rgba(255,255,255,0.12)',
                color: '#FFFFFF',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: (callState === 'ENDING' || callState === 'ENDED') ? 'not-allowed' : 'pointer'
              }}
              title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
            >
              {isMuted ? <FaMicrophoneSlash size={18} /> : <FaMicrophone size={18} />}
            </button>

            {/* Camera Video Toggle */}
            {isVideoCall && (
              <button
                type="button"
                onClick={toggleVideo}
                disabled={callState === 'ENDING' || callState === 'ENDED'}
                style={{
                  background: isVideoOff ? '#EF4444' : 'rgba(255,255,255,0.12)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '50%',
                  width: '48px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: (callState === 'ENDING' || callState === 'ENDED') ? 'not-allowed' : 'pointer'
                }}
                title={isVideoOff ? 'Turn On Camera' : 'Turn Off Camera'}
              >
                {isVideoOff ? <FaVideoSlash size={18} /> : <FaVideo size={18} />}
              </button>
            )}

            {/* End Call Button */}
            <button
              type="button"
              onClick={hangupCall}
              disabled={isActionPending || callState === 'ENDING' || callState === 'ENDED'}
              style={{
                background: '#EF4444',
                opacity: (isActionPending || callState === 'ENDING' || callState === 'ENDED') ? 0.6 : 1,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '50%',
                width: '56px',
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: (isActionPending || callState === 'ENDING' || callState === 'ENDED') ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 20px rgba(239,68,68,0.5)',
                marginLeft: '12px'
              }}
              title="End Call"
            >
              <FaPhoneSlash size={22} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
