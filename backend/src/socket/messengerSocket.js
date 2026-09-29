const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');
const JWT_SECRET = process.env.JWT_SECRET || 'gharkapaisa_secret_jwt';

// Track online users & active calls
const onlineUsers = new Map(); // userId -> socketId
const activeCalls = new Map(); // callId -> { caller_id, recipient_id, call_type, status }

function init(io) {
  // Authentication middleware for Socket.IO
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Authentication token required'));
      }
      const cleanToken = token.replace(/^Bearer\s+/i, '');
      const decoded = jwt.verify(cleanToken, JWT_SECRET);
      socket.user = decoded;
      return next();
    } catch (err) {
      logger.warn('[Socket Auth] Token verification failed:', err.message);
      return next(new Error('Unauthorized socket connection'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user?.id;
    if (!userId) {
      socket.disconnect(true);
      return;
    }

    logger.info(`[Socket] User connected: ${userId} (Socket: ${socket.id})`);
    onlineUsers.set(userId, socket.id);
    socket.join(`user:${userId}`);

    // Broadcast online status if needed
    io.emit('user:online', { userId });

    // ── 1. CALL INITIATE ──
    socket.on('call:initiate', (data) => {
      const { recipient_id, conversation_id, call_type } = data || {};
      if (!recipient_id) {
        return socket.emit('call:error', { message: 'Recipient ID is required.' });
      }

      // Check if recipient is online
      const recipientSocketId = onlineUsers.get(recipient_id);

      // Check if recipient is already in a call
      let recipientBusy = false;
      for (const [_, callInfo] of activeCalls.entries()) {
        if ((callInfo.recipient_id === recipient_id || callInfo.caller_id === recipient_id) && callInfo.status !== 'ENDED') {
          recipientBusy = true;
          break;
        }
      }

      const callId = `call_${uuidv4()}`;
      activeCalls.set(callId, {
        call_id: callId,
        caller_id: userId,
        recipient_id,
        call_type: call_type || 'voice',
        status: recipientBusy ? 'BUSY' : 'RINGING',
        created_at: new Date()
      });

      if (recipientBusy) {
        socket.emit('call:busy', { call_id: callId, recipient_id });
        activeCalls.delete(callId);
        return;
      }

      if (!recipientSocketId) {
        socket.emit('call:unavailable', { call_id: callId, recipient_id, message: 'Recipient is currently offline.' });
        activeCalls.delete(callId);
        return;
      }

      // Notify recipient of incoming call
      io.to(`user:${recipient_id}`).emit('call:incoming', {
        call_id: callId,
        caller_id: userId,
        caller_name: socket.user.full_name || 'User',
        call_type: call_type || 'voice',
        conversation_id
      });

      // Confirm to caller that ringing started
      socket.emit('call:ringing', { call_id: callId, recipient_id });
    });

    // ── 2. CALL OFFER (WebRTC SDP) ──
    socket.on('call:offer', (data) => {
      const { call_id, recipient_id, sdp } = data || {};
      if (recipient_id) {
        io.to(`user:${recipient_id}`).emit('call:offer', {
          call_id,
          caller_id: userId,
          sdp
        });
      }
    });

    // ── 3. CALL ANSWER (WebRTC SDP) ──
    socket.on('call:answer', (data) => {
      const { call_id, caller_id, sdp } = data || {};
      const call = activeCalls.get(call_id);
      if (call) {
        call.status = 'CONNECTED';
      }
      if (caller_id) {
        io.to(`user:${caller_id}`).emit('call:answer', {
          call_id,
          responder_id: userId,
          sdp
        });
      }
    });

    // ── 4. ICE CANDIDATE EXCHANGES ──
    socket.on('call:ice-candidate', (data) => {
      const { call_id, target_user_id, candidate } = data || {};
      if (target_user_id) {
        io.to(`user:${target_user_id}`).emit('call:ice-candidate', {
          call_id,
          sender_id: userId,
          candidate
        });
      }
    });

    // ── 5. REJECT CALL ──
    socket.on('call:reject', (data) => {
      const { call_id, caller_id, reason } = data || {};
      activeCalls.delete(call_id);
      if (caller_id) {
        io.to(`user:${caller_id}`).emit('call:rejected', {
          call_id,
          recipient_id: userId,
          reason: reason || 'Call declined'
        });
      }
    });

    // ── 6. CANCEL CALL (by caller before answer) ──
    socket.on('call:cancel', (data) => {
      const { call_id, recipient_id } = data || {};
      activeCalls.delete(call_id);
      if (recipient_id) {
        io.to(`user:${recipient_id}`).emit('call:cancelled', {
          call_id,
          caller_id: userId
        });
      }
    });

    // ── 7. END CALL ──
    socket.on('call:end', (data) => {
      const { call_id, target_user_id } = data || {};
      activeCalls.delete(call_id);
      if (target_user_id) {
        io.to(`user:${target_user_id}`).emit('call:ended', {
          call_id,
          sender_id: userId
        });
      }
    });

    // ── DISCONNECT HANDLER ──
    socket.on('disconnect', () => {
      logger.info(`[Socket] User disconnected: ${userId}`);
      onlineUsers.delete(userId);
      io.emit('user:offline', { userId });

      // Clean up any active calls involving this user
      for (const [callId, call] of activeCalls.entries()) {
        if (call.caller_id === userId || call.recipient_id === userId) {
          const peerId = call.caller_id === userId ? call.recipient_id : call.caller_id;
          io.to(`user:${peerId}`).emit('call:ended', {
            call_id: callId,
            sender_id: userId,
            reason: 'User disconnected'
          });
          activeCalls.delete(callId);
        }
      }
    });
  });
}

module.exports = { init };
