import { io } from 'socket.io-client';
import { getApiV1Url } from '../config/api';
import { refreshAccessToken } from './api';

let socket = null;
let isRefreshingSocket = false;

// Synchronize socket auth whenever the access token is rotated in api.js
if (typeof window !== 'undefined') {
  window.addEventListener('auth:token_updated', (e) => {
    const newToken = e.detail?.token;
    if (socket && newToken) {
      socket.auth = { token: newToken };
      if (!socket.connected) {
        socket.connect();
      }
    }
  });

  window.addEventListener('auth:token_cleared', () => {
    if (socket) {
      disconnectMessengerSocket();
    }
  });
}

export function updateSocketToken(newToken) {
  if (socket && newToken) {
    socket.auth = { token: newToken };
    if (!socket.connected) {
      socket.connect();
    }
  }
}

export function getMessengerSocket() {
  const currentToken = localStorage.getItem('token');
  if (!currentToken) {
    return null;
  }

  if (socket) {
    // Keep socket.auth synchronized with current token
    socket.auth = { token: currentToken };
    if (!socket.connected) {
      socket.connect();
    }
    return socket;
  }

  // Extract base origin (protocol + host) from API URL
  const apiBase = getApiV1Url();
  let serverOrigin = window.location.origin;
  try {
    const urlObj = new URL(apiBase);
    serverOrigin = urlObj.origin;
  } catch (e) {
    console.warn('[Messenger Socket] Failed to parse API origin, falling back to window.location.origin');
  }

  // Socket.IO client v4 supports dynamic auth callback on every handshake/reconnect
  socket = io(serverOrigin, {
    path: '/socket.io',
    auth: (cb) => {
      const freshToken = localStorage.getItem('token');
      cb({ token: freshToken });
    },
    transports: ['polling', 'websocket'],
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 8,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000
  });

  socket.on('connect', () => {
    console.log('[Messenger Socket] Connected with ID:', socket.id);
  });

  socket.on('connect_error', async (err) => {
    console.warn('[Messenger Socket] Connection error:', err.message);

    // Detect authentication or expired token failure
    const isAuthError =
      err.message?.includes('Authentication failed') ||
      err.message?.includes('Unauthorized') ||
      err.message?.includes('jwt') ||
      err.message?.includes('token') ||
      err.data?.code === 'TOKEN_EXPIRED' ||
      err.data?.code === 'AUTH_FAILED';

    if (isAuthError) {
      console.warn('[Messenger Socket] Stale or expired token detected during handshake.');

      if (isRefreshingSocket) {
        return;
      }
      isRefreshingSocket = true;

      try {
        console.log('[Messenger Socket] Refreshing access token before reconnecting...');
        const newToken = await refreshAccessToken();
        if (newToken) {
          console.log('[Messenger Socket] Token refreshed. Reconnecting socket with fresh token...');
          socket.auth = { token: newToken };
          socket.connect();
        }
      } catch (refreshErr) {
        console.error('[Messenger Socket] Token refresh failed:', refreshErr.message);
        // Do NOT repeatedly reconnect using the expired token
        socket.disconnect();
      } finally {
        isRefreshingSocket = false;
      }
    }
  });

  return socket;
}

export function disconnectMessengerSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
