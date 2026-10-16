import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { parseRetryAfter, computeBackoffMs } from '../utils/notificationPollingUtils';

export { parseRetryAfter, computeBackoffMs };

/**
 * Custom hook to safely poll notifications and messenger unread counts.
 *
 * Features:
 *  - 60s default polling interval (reduced from 10s to stop rate limit exhaustion).
 *  - Pauses periodic polling when the browser tab is hidden; resumes when visible.
 *  - Separates messenger unread updates from system notification requests.
 *  - Handles HTTP 429 gracefully using Retry-After and bounded fallback backoff.
 *  - Avoids retry loops and continuous hammering while rate-limited.
 *  - Cleans up all intervals, timeouts, and listeners on unmount.
 *  - Prevents duplicate requests on re-render.
 *
 * @param {object|null} user The authenticated user object from auth store.
 * @param {object} [options]
 * @param {number} [options.pollInterval=60000] Polling interval in ms (default: 60,000ms).
 * @param {number} [options.baseBackoff=60000] Base backoff in ms for 429 (default: 60,000ms).
 * @param {number} [options.maxBackoff=300000] Max backoff in ms for 429 (default: 300,000ms).
 */
export function useNotificationPolling(user, options = {}) {
  const {
    pollInterval = 60000,
    baseBackoff = 60000,
    maxBackoff = 300000,
  } = options;

  const [messengerUnread, setMessengerUnread] = useState(0);
  const [notificationsList, setNotificationsList] = useState([]);
  const [systemUnreadCount, setSystemUnreadCount] = useState(0);

  const isMountedRef = useRef(true);
  const userIdRef = useRef(user?.id || null);
  const intervalRef = useRef(null);
  const backoffTimeoutRef = useRef(null);
  const consecutive429Ref = useRef(0);
  const backoffUntilRef = useRef(0);
  const lastFetchTimeRef = useRef(0);
  const isFetchingNotifRef = useRef(false);
  const isFetchingMsgRef = useRef(false);

  // Keep userIdRef current
  userIdRef.current = user?.id || null;

  /**
   * Fetch system notifications (/notifications/unread).
   * Does NOT trigger messenger unread fetch.
   */
  const fetchNotifications = useCallback(async () => {
    if (!isMountedRef.current || !userIdRef.current) return;

    // Check if still within a rate-limit backoff window
    const now = Date.now();
    if (backoffUntilRef.current > now) {
      return;
    }

    // Prevent concurrent in-flight requests
    if (isFetchingNotifRef.current) return;
    isFetchingNotifRef.current = true;

    try {
      const res = await api.get('/notifications/unread');
      lastFetchTimeRef.current = Date.now();
      consecutive429Ref.current = 0;
      backoffUntilRef.current = 0;

      if (!isMountedRef.current) return;
      if (res?.data?.success) {
        setNotificationsList(res.data.data?.notifications || []);
        setSystemUnreadCount(res.data.data?.unread_count || 0);
      }
    } catch (err) {
      if (!isMountedRef.current) return;

      const status = err?.response?.status;
      if (status === 429) {
        const retryHeader =
          err.response?.headers?.['retry-after'] ||
          err.response?.headers?.['Retry-After'] ||
          err.response?.headers?.['ratelimit-reset'];

        const waitMs = computeBackoffMs(retryHeader, consecutive429Ref.current, baseBackoff, maxBackoff);
        consecutive429Ref.current += 1;
        backoffUntilRef.current = Date.now() + waitMs;

        console.warn(`[NotificationPolling] Rate limited (429). Backing off for ${Math.round(waitMs / 1000)}s.`);

        // Schedule resumption after waitMs
        if (backoffTimeoutRef.current) {
          clearTimeout(backoffTimeoutRef.current);
        }
        backoffTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current && typeof document !== 'undefined' && !document.hidden) {
            fetchNotifications();
          }
        }, waitMs);
      } else {
        // Non-429 error (network, 500, etc.)
        // Do not retry immediately; log and let normal interval retry later
        console.error('Error fetching unread notifications:', err?.message || err);
      }
    } finally {
      isFetchingNotifRef.current = false;
    }
  }, [baseBackoff, maxBackoff]);

  /**
   * Fetch messenger unread count (/messenger/unread-count).
   * Does NOT trigger system notifications fetch.
   */
  const fetchMessengerUnread = useCallback(async () => {
    if (!isMountedRef.current || !userIdRef.current) return;
    if (isFetchingMsgRef.current) return;
    isFetchingMsgRef.current = true;

    try {
      const res = await api.get('/messenger/unread-count');
      if (!isMountedRef.current) return;
      if (res?.data?.success && typeof res.data?.data?.unread_count === 'number') {
        setMessengerUnread(res.data.data.unread_count);
      }
    } catch (err) {
      if (err?.response?.status === 429) {
        console.warn('[MessengerPolling] Rate limited (429) on messenger unread count.');
      } else {
        console.error('Error fetching messenger unread count:', err?.message || err);
      }
    } finally {
      isFetchingMsgRef.current = false;
    }
  }, []);

  /**
   * Mark all notifications as read.
   */
  const handleMarkAllRead = useCallback(async () => {
    try {
      await api.post('/notifications/read-all').catch(() => {});
      if (isMountedRef.current) {
        setSystemUnreadCount(0);
        setNotificationsList((prev) => prev.map((n) => ({ ...n, is_read: true })));
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  }, []);

  // Main lifecycle effect for intervals, visibility, and messenger events
  useEffect(() => {
    isMountedRef.current = true;
    userIdRef.current = user?.id || null;

    if (!user?.id) {
      return () => {
        isMountedRef.current = false;
      };
    }

    // 1. Initial fetch on mount if document is visible
    if (typeof document === 'undefined' || !document.hidden) {
      fetchNotifications();
      fetchMessengerUnread();
    }

    // 2. Periodic polling interval scheduler
    const scheduleInterval = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        // Pause if document is hidden
        if (typeof document !== 'undefined' && document.hidden) {
          return;
        }
        fetchNotifications();
        fetchMessengerUnread();
      }, pollInterval);
    };

    scheduleInterval();

    // 3. Tab visibility listener
    const handleVisibilityChange = () => {
      if (typeof document === 'undefined') return;

      if (document.hidden) {
        // Tab is hidden: pause interval
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        // Tab is visible: restart interval
        scheduleInterval();

        // If rate-limited, wait for backoff timeout rather than firing immediately
        if (Date.now() < backoffUntilRef.current) {
          return;
        }

        // If at least 45s has elapsed since last fetch, fetch immediately
        const elapsed = Date.now() - lastFetchTimeRef.current;
        if (elapsed >= Math.min(pollInterval, 45000)) {
          fetchNotifications();
          fetchMessengerUnread();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 4. Messenger update event listener: ONLY refreshes messenger count, NEVER system notifications!
    const handleMessengerUpdate = () => {
      fetchMessengerUnread();
    };

    window.addEventListener('messenger:unread_updated', handleMessengerUpdate);

    // Cleanup on unmount or user change
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (backoffTimeoutRef.current) {
        clearTimeout(backoffTimeoutRef.current);
        backoffTimeoutRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('messenger:unread_updated', handleMessengerUpdate);
    };
  }, [user?.id, pollInterval, fetchNotifications, fetchMessengerUnread]);

  return {
    messengerUnread,
    setMessengerUnread,
    notificationsList,
    setNotificationsList,
    systemUnreadCount,
    setSystemUnreadCount,
    handleMarkAllRead,
    fetchNotifications,
    fetchMessengerUnread,
  };
}

export default useNotificationPolling;
