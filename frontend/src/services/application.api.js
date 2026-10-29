import api from './api';

const MAX_RETRIES = 3;
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// Short-lived in-memory query cache for client-side navigation (15s TTL)
const clientQueryCache = new Map();
const CLIENT_CACHE_TTL_MS = 15 * 1000;

// Map of in-flight promises to deduplicate identical concurrent requests
const inFlightRequests = new Map();

/**
 * Builds a deterministic string key from query parameters
 */
const buildParamKey = (params = {}) => {
  if (!params || typeof params !== 'object') return '';
  const sortedKeys = Object.keys(params).sort();
  const pairs = [];
  for (const k of sortedKeys) {
    const val = params[k];
    if (val !== undefined && val !== null && val !== '') {
      pairs.push(`${k}=${String(val).trim()}`);
    }
  }
  return pairs.join('&');
};

/**
 * Purge expired entries from client query cache
 */
const cleanExpiredClientCache = () => {
  const now = Date.now();
  for (const [key, entry] of clientQueryCache.entries()) {
    if (entry.expiresAt <= now) {
      clientQueryCache.delete(key);
    }
  }
};

export const applicationService = {
  submit: async (data) => {
    applicationService.clearCache();
    return api.post('/applications', data);
  },

  list: async (params = {}, options = {}) => {
    const cacheKey = buildParamKey(params);
    const { skipCache = false, forceRefresh = false, signal } = options;

    cleanExpiredClientCache();

    // 1. Check client-side memory cache if not force refreshing
    if (!skipCache && !forceRefresh && cacheKey) {
      const cached = clientQueryCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.data;
      }
    }

    // 2. Check if an identical request is currently in-flight (Request Deduplication)
    if (cacheKey && inFlightRequests.has(cacheKey) && !signal) {
      return inFlightRequests.get(cacheKey);
    }

    // 3. Dispatch fresh request and register in in-flight tracker
    const requestPromise = (async () => {
      try {
        const config = { params };
        if (signal) config.signal = signal;

        const res = await api.get('/applications', config);

        // Store in short-lived client cache (cap at 50 queries)
        if (cacheKey && res?.data?.success) {
          if (clientQueryCache.size >= 50) {
            const firstKey = clientQueryCache.keys().next().value;
            if (firstKey) clientQueryCache.delete(firstKey);
          }
          clientQueryCache.set(cacheKey, {
            data: res,
            expiresAt: Date.now() + CLIENT_CACHE_TTL_MS
          });
        }

        return res;
      } finally {
        if (cacheKey) {
          inFlightRequests.delete(cacheKey);
        }
      }
    })();

    if (cacheKey && !signal) {
      inFlightRequests.set(cacheKey, requestPromise);
    }

    return requestPromise;
  },

  getById: (id) => api.get(`/applications/${id}`),

  updateStatus: async (id, data) => {
    applicationService.clearCache();
    return api.put(`/applications/${id}/status`, data);
  },

  clearCache: () => {
    clientQueryCache.clear();
    inFlightRequests.clear();
  },

  uploadDoc: async (id, file, doc_type, onUploadProgress) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      throw new Error(`Invalid file type. Only PDF, JPG, and PNG are allowed.`);
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error(`File is too large. Max size is 5MB.`);
    }

    const form = new FormData();
    form.append('document', file);
    form.append('doc_type', doc_type);

    let attempt = 0;
    while (attempt < MAX_RETRIES) {
      try {
        const res = await api.post(`/applications/${id}/documents`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress
        });
        applicationService.clearCache();
        return res;
      } catch (err) {
        attempt++;
        if (err.message === 'Network Error' && attempt < MAX_RETRIES) {
          await delay(1000 * attempt);
          continue;
        }
        throw err;
      }
    }
  },
};

export default applicationService;
