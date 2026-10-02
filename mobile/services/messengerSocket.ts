import { io, Socket } from 'socket.io-client';
import { getSecureItem } from './storage.service';
import { API_BASE_URL } from './api';

let socket: Socket | null = null;

export const getMessengerSocket = async (): Promise<Socket | null> => {
  if (socket) {
    if (!socket.connected) {
      socket.connect();
    }
    return socket;
  }

  const token = await getSecureItem<string>('auth_token');
  if (!token) {
    return null;
  }

  let serverOrigin = 'https://api.gharkapaisa.in';
  try {
    const urlObj = new URL(API_BASE_URL);
    serverOrigin = urlObj.origin;
  } catch (e) {
    console.warn('[MessengerSocket] Failed to parse API origin, using fallback');
  }

  socket = io(serverOrigin, {
    path: '/socket.io',
    auth: { token },
    transports: ['websocket', 'polling'],
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 15,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    // Socket connected successfully
  });

  socket.on('connect_error', (err) => {
    console.warn('[MessengerSocket] Connection error:', err.message);
  });

  return socket;
};

export const disconnectMessengerSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
};
