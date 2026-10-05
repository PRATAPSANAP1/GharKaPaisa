import { io } from 'socket.io-client';
import { getApiV1Url } from '../config/api';

let socket = null;

export function getMessengerSocket() {
  if (socket) {
    if (!socket.connected) {
      socket.connect();
    }
    return socket;
  }

  const token = localStorage.getItem('token');
  if (!token) {
    return null;
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

  socket = io(serverOrigin, {
    path: '/socket.io',
    auth: { token },
    transports: ['websocket', 'polling'],
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 3000
  });

  socket.on('connect', () => {
    console.log('[Messenger Socket] Connected with ID:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.warn('[Messenger Socket] Connection error:', err.message);
  });

  return socket;
}

export function disconnectMessengerSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
