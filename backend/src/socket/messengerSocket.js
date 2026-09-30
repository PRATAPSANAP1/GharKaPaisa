const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');
const JWT_SECRET = process.env.JWT_SECRET || 'gharkapaisa_secret_jwt';

const { query } = require('../config/database');

// Track online users & active calls
const onlineUsers = new Map(); // userId -> socketId
const activeCalls = new Map(); // callId -> { caller_id, recipient_id, call_type, status }

/**
 * Helper to resolve input recipient identifier into canonical user_id (UUID)
 */
async function resolveTargetUserId(recipientInput) {
  if (!recipientInput) return null;
  const inputStr = String(recipientInput).trim();

  // If input matches user_id in onlineUsers or active rooms directly
  if (onlineUsers.has(inputStr)) {
    return inputStr;
  }

  try {
    // Try resolving from users table, employees table, or partner_profiles table
    const { rows: [foundUser] } = await query(
      `SELECT u.id AS user_id 
       FROM users u
       LEFT JOIN employees e ON e.user_id = u.id
       LEFT JOIN partner_profiles p ON p.user_id = u.id
       WHERE u.id::text = $1 
          OR e.id::text = $1 
          OR e.employee_id = $1 
          OR p.id::text = $1 
          OR p.partner_code = $1 
       LIMIT 1`,
      [inputStr]
    );

    if (foundUser && foundUser.user_id) {
      return foundUser.user_id;
    }
  } catch (err) {
    logger.warn('[Socket Signal] Error resolving target user ID:', err.message);
  }

  return inputStr;
}

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

    onlineUsers.set(userId, socket.id);
    socket.join(`user:${userId}`);

    logger.info(`[CALL SOCKET] userId=${userId} socketId=${socket.id} connected=${socket.connected} room=user:${userId}`);

    // Broadcast online status
    io.emit('user:online', { userId });

    // ── 1. CALL INITIATE ──
    socket.on('call:initiate', async (data, ack) => {
      const { recipient_id, conversation_id, call_type } = data || {};
      logger.info(`[CALL SIGNAL] call:initiate received`);
      logger.info(`[CALL SIGNAL] callerUserId=${userId}`);
      logger.info(`[CALL SIGNAL] rawRecipientInput=${recipient_id}`);

      if (!recipient_id) {
        if (typeof ack === 'function') ack({ success: false, reason: 'RECIPIENT_ID_MISSING' });
        return socket.emit('call:error', { message: 'Recipient ID is required.' });
      }

      // Resolve canonical user ID
      const targetUserId = await resolveTargetUserId(recipient_id);
      logger.info(`[CALL SIGNAL] receiverUserId=${targetUserId}`);
      logger.info(`[CALL SIGNAL] receiver socket lookup`);

      // Check room presence in Socket.IO adapter & onlineUsers Map
      const roomSockets = io.sockets.adapter.rooms.get(`user:${targetUserId}`);
      const hasRoomSockets = Boolean(roomSockets && roomSockets.size > 0);
      const isOnlineMap = onlineUsers.has(targetUserId);
      const recipientFound = hasRoomSockets || isOnlineMap;

      logger.info(`[CALL SIGNAL] receiver socket found=${recipientFound} (roomSockets=${hasRoomSockets}, onlineMap=${isOnlineMap})`);

      // Check if recipient or caller is already in an active call
      let recipientBusy = false;
      for (const [_, callInfo] of activeCalls.entries()) {
        if (
          (callInfo.recipient_id === targetUserId ||
           callInfo.caller_id === targetUserId ||
           callInfo.caller_id === userId ||
           callInfo.recipient_id === userId) &&
          callInfo.status !== 'ENDED'
        ) {
          recipientBusy = true;
          break;
        }
      }

      const callId = `call_${uuidv4()}`;
      activeCalls.set(callId, {
        call_id: callId,
        caller_id: userId,
        recipient_id: targetUserId,
        call_type: call_type || 'voice',
        status: recipientBusy ? 'BUSY' : 'RINGING',
        created_at: new Date()
      });

      if (recipientBusy) {
        logger.warn(`[CALL SIGNAL] Recipient ${targetUserId} is BUSY`);
        socket.emit('call:busy', { call_id: callId, recipient_id: targetUserId });
        activeCalls.delete(callId);
        if (typeof ack === 'function') ack({ success: false, reason: 'BUSY', call_id: callId });
        return;
      }

      if (!recipientFound) {
        logger.warn(`[CALL SIGNAL] Recipient ${targetUserId} socket NOT found / OFFLINE`);
        socket.emit('call:unavailable', {
          call_id: callId,
          recipient_id: targetUserId,
          message: 'Recipient is currently offline or unreachable.'
        });
        activeCalls.delete(callId);
        if (typeof ack === 'function') ack({ success: false, reason: 'RECIPIENT_OFFLINE', call_id: callId });
        return;
      }

      // Notify recipient of incoming call
      logger.info(`[CALL SIGNAL] emitting call:incoming to room user:${targetUserId}`);
      io.to(`user:${targetUserId}`).emit('call:incoming', {
        call_id: callId,
        caller_id: userId,
        caller_name: socket.user.full_name || 'User',
        call_type: call_type || 'voice',
        conversation_id
      });

      // Confirm to caller that ringing started
      socket.emit('call:ringing', { call_id: callId, recipient_id: targetUserId });

      if (typeof ack === 'function') {
        ack({
          success: true,
          delivered: true,
          call_id: callId,
          recipient_id: targetUserId
        });
      }
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
