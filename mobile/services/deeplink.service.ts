import { setSecureItem, getSecureItem, removeSecureItem } from './storage.service';

const PENDING_DEEP_LINK_KEY = 'pending_deep_link';

export interface DeepLinkRoute {
  path: string;
  params?: Record<string, string>;
  fullTarget: string;
}

// Whitelisted route patterns
const WHITELISTED_PATHS: Record<string, string> = {
  '/attendance': '/(app)/attendance',
  '/applications': '/(app)/application-details',
  '/application-details': '/(app)/application-details',
  '/leads': '/(app)/lead-details',
  '/lead-details': '/(app)/lead-details',
  '/customers': '/(app)/customer-details',
  '/customer-details': '/(app)/customer-details',
  '/products': '/(app)/products',
  '/notifications': '/(app)/notifications',
  '/finance-buddy': '/(app)/finance-buddy',
  '/whatsapp': '/(app)/whatsapp',
  '/reports': '/(app)/reports',
  '/wallet': '/(app)/wallet',
  '/team': '/(app)/team',
  '/profile': '/(app)/profile',
  '/security': '/(app)/security',
  '/dashboard': '/(app)/dashboard',
  '/partner-dashboard': '/(app)/partner-dashboard',
  '/team-dashboard': '/(app)/team-dashboard',
};

// Simple ID sanitizer (alphanumeric, hyphens, underscores only)
const sanitizeParam = (val?: string): string | null => {
  if (!val) return null;
  const clean = val.trim();
  if (/^[a-zA-Z0-9\-_]{1,64}$/.test(clean)) {
    return clean;
  }
  return null;
};

/**
 * Validates and parses an incoming deep link URL string.
 * Supports both scheme format (gharkapaisa://applications/123 or gharkapaisa://applications?id=123)
 * and web URL format (https://gharkapaisa.in/applications/123).
 */
export const parseDeepLinkUrl = (url: string): DeepLinkRoute | null => {
  if (!url || typeof url !== 'string') return null;

  try {
    // Extract path and query parameters
    let pathAndQuery = url;
    if (url.includes('://')) {
      pathAndQuery = url.split('://')[1] || '';
    } else if (url.startsWith('https://') || url.startsWith('http://')) {
      const parts = url.split('/');
      pathAndQuery = parts.slice(3).join('/');
    }

    // Strip hostname if scheme format gharkapaisa://host/path
    if (pathAndQuery.startsWith('gharkapaisa.in/')) {
      pathAndQuery = pathAndQuery.replace('gharkapaisa.in/', '');
    }

    if (!pathAndQuery.startsWith('/')) {
      pathAndQuery = '/' + pathAndQuery;
    }

    const [rawPath, rawQuery] = pathAndQuery.split('?');
    const pathSegments = rawPath.split('/').filter(Boolean);

    if (pathSegments.length === 0) return null;

    const mainRoute = '/' + pathSegments[0];
    const targetBase = WHITELISTED_PATHS[mainRoute];

    if (!targetBase) {
      console.warn(`[DeepLinkService] Route not whitelisted: ${mainRoute}`);
      return null;
    }

    // Extract params from path segment (e.g. /applications/123) or query params (?id=123)
    const params: Record<string, string> = {};

    if (pathSegments.length > 1) {
      const pathId = sanitizeParam(pathSegments[1]);
      if (pathId) {
        params.id = pathId;
      }
    }

    if (rawQuery) {
      const queryPairs = rawQuery.split('&');
      for (const pair of queryPairs) {
        const [k, v] = pair.split('=');
        if (k && v) {
          const cleanK = decodeURIComponent(k).trim();
          const cleanV = sanitizeParam(decodeURIComponent(v));
          if (cleanK && cleanV) {
            params[cleanK] = cleanV;
          }
        }
      }
    }

    let fullTarget = targetBase;
    if (params.id) {
      fullTarget += `?id=${params.id}`;
    }

    return {
      path: targetBase,
      params,
      fullTarget,
    };
  } catch (err) {
    console.warn('[DeepLinkService] Failed to parse URL:', err);
    return null;
  }
};

// Deduplication state
let lastProcessedUrl: string | null = null;
let lastProcessedTime = 0;

export const isDuplicateLinkEvent = (url: string): boolean => {
  const now = Date.now();
  if (lastProcessedUrl === url && now - lastProcessedTime < 800) {
    return true;
  }
  lastProcessedUrl = url;
  lastProcessedTime = now;
  return false;
};

// Pending destination management
export const savePendingDestination = async (target: string): Promise<boolean> => {
  return setSecureItem(PENDING_DEEP_LINK_KEY, target);
};

export const getAndClearPendingDestination = async (): Promise<string | null> => {
  const target = await getSecureItem<string>(PENDING_DEEP_LINK_KEY);
  if (target) {
    await removeSecureItem(PENDING_DEEP_LINK_KEY);
  }
  return target;
};

export const clearPendingDestination = async (): Promise<boolean> => {
  return removeSecureItem(PENDING_DEEP_LINK_KEY);
};
