import React, { useState, useEffect, useRef } from 'react';
import { 
  FaPhone, FaPhoneSlash, FaVideo, FaVideoSlash, 
  FaMicrophone, FaMicrophoneSlash, FaExclamationTriangle, FaCheck
} from 'react-icons/fa';
import { getMessengerSocket } from '../../services/messengerSocket';

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export default function MessengerCallModal({
  activeCall, // { callId, recipientId, recipientName, callType: 'voice' | 'video', isIncoming: boolean, callerId, conversationId }
  onCloseCall
}) {
  const [callState, setCallState] = useState(activeCall?.isIncoming ? 'INCOMING_RINGING' : 'OUTGOING_RINGING');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(activeCall?.callType === 'voice');
  const [errorMessage, setErrorMessage] = useState(null);
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const durationTimerRef = useRef(null);
  const currentCallIdRef = useRef(activeCall?.callId || null);
  const pendingOfferRef = useRef(activeCall?.sdp || null);

  const isVideoCall = activeCall?.callType === 'video';
  const peerName = activeCall?.isIncoming ? (activeCall.callerName || 'Caller') : (activeCall.recipientName || 'User');

  // Helper to safely stop all media tracks
  const stopLocalMedia = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        try { track.stop(); } catch (_) {}
      });
      localStreamRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  };

  // Cleanup WebRTC Peer Connection & Media Streams
  const cleanupCall = () => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    stopLocalMedia();
    if (pcRef.current) {
      try {
        pcRef.current.onicecandidate = null;
        pcRef.current.ontrack = null;
        pcRef.current.close();
      } catch (_) {}
      pcRef.current = null;
    }
  };

  const endCallSession = (finalState = 'ENDED', errorMsg = null) => {
    cleanupCall();
    setCallState(finalState);
    if (errorMsg) setErrorMessage(errorMsg);
    setTimeout(() => {
      onCloseCall();
    }, 1800);
  };

  // ── Initialize WebRTC Peer Connection ──
  const createPeerConnection = (socket, targetUserId) => {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;

    // Send local ICE candidates to peer
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('call:ice-candidate', {
          call_id: currentCallIdRef.current,
          target_user_id: targetUserId,
          candidate: event.candidate
        });
      }
    };

    // Attach remote media stream to remote video tag
    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Connection state changes
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setCallState('CONNECTED');
        startTimer();
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        endCallSession('ENDED', 'Connection lost with peer.');
      }
    };

    return pc;
  };

  const startTimer = () => {
    if (durationTimerRef.current) return;
    setCallDuration(0);
    durationTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  // ── Initialize Local Camera / Microphone ──
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
      console.error('[WebRTC] getUserMedia failed:', err);
      let msg = 'Failed to access camera or microphone.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Microphone/Camera permission denied. Please enable permissions in browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No microphone or camera device found on this system.';
      }
      setErrorMessage(msg);
      throw new Error(msg);
    }
  };

  // ── Start Outgoing Call Flow ──
  const startOutgoingCall = async () => {
    const socket = getMessengerSocket();
    if (!socket || !socket.connected) {
      console.warn('[CALL DEBUG] Cannot emit initiate - socket disconnected');
      endCallSession('FAILED', 'Real-time messenger socket is disconnected.');
      return;
    }

    try {
      console.log('[CALL DEBUG] emitting call:initiate');
      const stream = await startLocalStream(isVideoCall);
      const pc = createPeerConnection(socket, activeCall.recipientId);

      // Add local stream tracks to WebRTC peer connection
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // Create WebRTC SDP offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Emit initiate event to backend with acknowledgment callback
      socket.emit('call:initiate', {
        recipient_id: activeCall.recipientId,
        conversation_id: activeCall.conversationId,
        call_type: activeCall.callType,
        sdp: offer
      }, (ack) => {
        console.log('[CALL DEBUG] initiate ACK', ack);
        if (!ack?.success) {
          endCallSession(
            'UNAVAILABLE',
            ack?.reason === 'RECIPIENT_OFFLINE' 
              ? 'Recipient is currently offline or unreachable.' 
              : (ack?.reason || 'Unable to initiate call.')
          );
        }
      });

      console.log('[CALL DEBUG] call:initiate emitted with SDP offer');
    } catch (err) {
      endCallSession('FAILED', err.message);
    }
  };

  // ── Accept Incoming Call Flow ──
  const acceptIncomingCall = async () => {
    const socket = getMessengerSocket();
    if (!socket) return;

    try {
      setCallState('CONNECTING');
      const stream = await startLocalStream(isVideoCall);
      const pc = createPeerConnection(socket, activeCall.callerId);

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const sdpOffer = activeCall.sdp || pendingOfferRef.current;
      if (sdpOffer) {
        await pc.setRemoteDescription(new RTCSessionDescription(sdpOffer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('call:answer', {
          call_id: currentCallIdRef.current,
          caller_id: activeCall.callerId,
          sdp: answer
        });
      }
    } catch (err) {
      console.error('[WebRTC] Accept call error:', err);
      endCallSession('FAILED', err.message);
    }
  };

  // ── Reject Incoming Call ──
  const rejectIncomingCall = () => {
    const socket = getMessengerSocket();
    if (socket && currentCallIdRef.current) {
      socket.emit('call:reject', {
        call_id: currentCallIdRef.current,
        caller_id: activeCall.callerId,
        reason: 'Call declined by user'
      });
    }
    endCallSession('REJECTED', 'Call declined.');
  };

  // ── Hangup Active / Outgoing Call ──
  const hangupCall = () => {
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

  // ── Socket Event Listeners setup ──
  useEffect(() => {
    const socket = getMessengerSocket();
    if (!socket) return;

    // Outgoing ringing confirmation
    const handleRinging = (data) => {
      console.log('[CALL DEBUG] call:ringing received', data);
      if (data.call_id) currentCallIdRef.current = data.call_id;
    };

    // Recipient Unavailable
    const handleUnavailable = (data) => {
      console.log('[CALL DEBUG] call:unavailable received', data);
      endCallSession('UNAVAILABLE', data?.message || 'Recipient is currently offline.');
    };

    // Socket Call Error
    const handleError = (data) => {
      console.log('[CALL DEBUG] call:error received', data);
      endCallSession('FAILED', data?.message || 'Call error occurred.');
    };

    // Incoming Call SDP Offer
    const handleOffer = async (data) => {
      const { call_id, caller_id, sdp } = data || {};
      if (call_id) currentCallIdRef.current = call_id;
      if (sdp) pendingOfferRef.current = sdp;

      if (pcRef.current && sdp) {
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
          if (callState === 'CONNECTING' || callState === 'CONNECTED') {
            const answer = await pcRef.current.createAnswer();
            await pcRef.current.setLocalDescription(answer);
            socket.emit('call:answer', { call_id, caller_id, sdp: answer });
          }
        } catch (e) {
          console.error('[WebRTC] Set remote description error:', e);
        }
      }
    };

    // Outgoing Call SDP Answer
    const handleAnswer = async (data) => {
      const { sdp } = data || {};
      console.log('[CALL DEBUG] call:answer received from recipient');
      setCallState('CONNECTING');
      if (pcRef.current && sdp) {
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
        } catch (e) {
          console.error('[WebRTC] Set remote answer error:', e);
        }
      }
    };

    // ICE Candidate
    const handleIceCandidate = async (data) => {
      const { candidate } = data;
      if (pcRef.current && candidate) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Add ICE candidate error:', e);
        }
      }
    };

    // Peer Rejected
    const handleRejected = () => {
      endCallSession('REJECTED', 'User declined the call.');
    };

    // Peer Cancelled
    const handleCancelled = () => {
      endCallSession('ENDED', 'Caller cancelled the call.');
    };

    // Peer Busy
    const handleBusy = () => {
      endCallSession('BUSY', 'User is currently busy on another call.');
    };

    // Call Ended by Peer
    const handleEnded = () => {
      endCallSession('ENDED', 'Call ended by remote user.');
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

    if (!activeCall.isIncoming) {
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

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: callState === 'INCOMING_RINGING' ? 'rgba(15, 23, 42, 0.65)' : 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(12px)', zIndex: 999999, display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: callState === 'INCOMING_RINGING' ? 'flex-start' : 'center',
        padding: '24px', fontFamily: "'Inter', sans-serif"
      }}
    >
      {/* ── TOP FLOATING INCOMING CALL BANNER ── */}
      {callState === 'INCOMING_RINGING' ? (
        <div
          style={{
            marginTop: '20px', width: '100%', maxWidth: '440px',
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
            borderRadius: '24px', border: '2px solid rgba(16, 185, 129, 0.5)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.7), 0 0 25px rgba(16, 185, 129, 0.25)',
            padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px',
            animation: 'slideDown 0.3s ease-out'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '56px', height: '56px', borderRadius: '50%', background: '#2563EB',
                color: '#FFFFFF', fontSize: '22px', fontWeight: 900, display: 'flex',
                alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(37,99,235,0.4)',
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
              style={{
                flex: 1, background: '#10B981', color: '#FFFFFF', border: 'none',
                borderRadius: '16px', padding: '14px', fontSize: '15px',
                fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '10px', boxShadow: '0 6px 20px rgba(16,185,129,0.5)',
                transition: 'all 0.2s'
              }}
            >
              <FaPhone size={18} /> Receive Call
            </button>

            {/* Red Reject Button */}
            <button
              type="button"
              onClick={rejectIncomingCall}
              style={{
                flex: 1, background: '#EF4444', color: '#FFFFFF', border: 'none',
                borderRadius: '16px', padding: '14px', fontSize: '15px',
                fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '10px', boxShadow: '0 6px 20px rgba(239,68,68,0.5)',
                transition: 'all 0.2s'
              }}
            >
              <FaPhoneSlash size={18} /> Reject
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            width: '100%', maxWidth: isVideoCall ? '880px' : '420px',
            background: '#1E293B', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.6)', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', position: 'relative'
          }}
        >
        {/* Error / Status Warning Banner */}
        {errorMessage && (
          <div style={{
            background: '#FEF2F2', borderBottom: '1px solid #FCA5A5', color: '#991B1B',
            padding: '12px 18px', fontSize: '13px', fontWeight: 700, display: 'flex',
            alignItems: 'center', gap: '8px'
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
                position: 'absolute', bottom: '16px', right: '16px',
                width: '140px', height: '180px', borderRadius: '16px',
                overflow: 'hidden', border: '2px solid rgba(255,255,255,0.2)',
                boxShadow: '0 8px 20px rgba(0,0,0,0.4)', background: '#1E293B'
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
              position: 'absolute', top: '16px', left: '16px',
              background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(8px)',
              padding: '8px 16px', borderRadius: '20px', color: '#FFFFFF',
              fontSize: '13px', fontWeight: 800, border: '1px solid rgba(255,255,255,0.1)'
            }}>
              {peerName} • {callState === 'CONNECTED' ? formatDuration(callDuration) : callState}
            </div>
          </div>
        ) : (
          <div style={{
            padding: '40px 24px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: '16px', background: 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)'
          }}>
            {/* User Avatar */}
            <div
              style={{
                width: '88px', height: '88px', borderRadius: '50%', background: '#2563EB',
                color: '#FFFFFF', fontSize: '32px', fontWeight: 900, display: 'flex',
                alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px rgba(37,99,235,0.4)',
                border: '4px solid rgba(255,255,255,0.1)'
              }}
            >
              {peerName.charAt(0).toUpperCase()}
            </div>

            <div style={{ textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: 900, color: '#F8FAFC' }}>
                {peerName}
              </h3>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: callState === 'CONNECTED' ? '#10B981' : '#94A3B8' }}>
                {callState === 'CONNECTED' ? `In Call • ${formatDuration(callDuration)}` : callState === 'INCOMING_RINGING' ? 'Incoming Voice Call...' : callState === 'OUTGOING_RINGING' ? 'Calling...' : callState}
              </p>
            </div>

            {/* Hidden audio element for remote audio stream */}
            <audio ref={remoteVideoRef} autoPlay style={{ display: 'none' }} />
          </div>
        )}

        {/* ── Control Action Buttons Bar ── */}
        <div style={{
          padding: '20px', background: '#0F172A', borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px'
        }}>
          {callState === 'INCOMING_RINGING' ? (
            <>
              {/* Accept Call Button */}
              <button
                type="button"
                onClick={acceptIncomingCall}
                style={{
                  background: '#10B981', color: '#FFFFFF', border: 'none',
                  borderRadius: '16px', padding: '12px 28px', fontSize: '14px',
                  fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center',
                  gap: '10px', boxShadow: '0 4px 16px rgba(16,185,129,0.4)'
                }}
              >
                <FaPhone size={16} /> Accept Call
              </button>

              {/* Decline Call Button */}
              <button
                type="button"
                onClick={rejectIncomingCall}
                style={{
                  background: '#EF4444', color: '#FFFFFF', border: 'none',
                  borderRadius: '16px', padding: '12px 28px', fontSize: '14px',
                  fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center',
                  gap: '10px', boxShadow: '0 4px 16px rgba(239,68,68,0.4)'
                }}
              >
                <FaPhoneSlash size={16} /> Decline
              </button>
            </>
          ) : (
            <>
              {/* Mute Microphone */}
              <button
                type="button"
                onClick={toggleMute}
                style={{
                  background: isMuted ? '#EF4444' : 'rgba(255,255,255,0.12)',
                  color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '50%', width: '48px', height: '48px', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
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
                  style={{
                    background: isVideoOff ? '#EF4444' : 'rgba(255,255,255,0.12)',
                    color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '50%', width: '48px', height: '48px', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
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
                style={{
                  background: '#EF4444', color: '#FFFFFF', border: 'none',
                  borderRadius: '50%', width: '56px', height: '56px', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(239,68,68,0.5)', marginLeft: '12px'
                }}
                title="End Call"
              >
                <FaPhoneSlash size={22} />
              </button>
            </>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
