import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { getSecureItem, setSecureItem, removeSecureItem } from './storage.service';
import { API_BASE_URL } from './api';

let socket: Socket | null = null;
let isRefreshingMobileSocket = false;

async function refreshMobileToken(): Promise<string | null> {
  const refreshToken = await getSecureItem<string>('refresh_token');
  if (!refreshToken) return null;

  const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
  if (res.data?.token) {
    const newToken = res.data.token;
    await setSecureItem('auth_token', newToken);
    return newToken;
  }
  return null;
}

export const getMessengerSocket = async (): Promise<Socket | null> => {
  const currentToken = await getSecureItem<string>('auth_token');
  if (!currentToken) {
    return null;
  }

  if (socket) {
    socket.auth = { token: currentToken };
    if (!socket.connected) {
      socket.connect();
    }
    return socket;
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
    auth: async (cb: (data: { token?: string | null }) => void) => {
      const freshToken = await getSecureItem<string>('auth_token');
      cb({ token: freshToken });
    },
    transports: ['websocket', 'polling'],
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 8,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    // Socket connected successfully
  });

  socket.on('connect_error', async (err: any) => {
    console.warn('[MessengerSocket] Connection error:', err.message);

    const isAuthError =
      err.message?.includes('Authentication failed') ||
      err.message?.includes('Unauthorized') ||
      err.message?.includes('jwt') ||
      err.message?.includes('token') ||
      err.data?.code === 'TOKEN_EXPIRED' ||
      err.data?.code === 'AUTH_FAILED';

    if (isAuthError) {
      console.warn('[MessengerSocket] Stale or expired token during socket handshake.');

      if (isRefreshingMobileSocket) return;
      isRefreshingMobileSocket = true;

      try {
        const newToken = await refreshMobileToken();
        if (newToken && socket) {
          console.log('[MessengerSocket] Reconnecting with refreshed token...');
          socket.auth = { token: newToken };
          socket.connect();
        } else if (socket) {
          socket.disconnect();
        }
      } catch (refreshErr) {
        console.error('[MessengerSocket] Mobile token refresh failed:', refreshErr);
        if (socket) {
          socket.disconnect();
        }
      } finally {
        isRefreshingMobileSocket = false;
      }
    }
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
