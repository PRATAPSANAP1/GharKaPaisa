// ═══════════════════════════════════════════════════════════════════════════════
// MSG91 OTP SDK — Singleton Manager
// Loads the SDK once, manages widget lifecycle, and provides an event-driven
// captcha verification API consumed by the useMsg91Captcha hook.
// ═══════════════════════════════════════════════════════════════════════════════

// ── Module-level singleton state ─────────────────────────────────────────────
let scriptLoaded = false;
let scriptLoading = false;
let widgetInitialized = false;
let captchaVerified = false;
let pollIntervalId = null;
const listeners = new Set();

// ── hCaptcha / grecaptcha Monkey-Patches ─────────────────────────────────────
// Intercepts render() to prevent "already rendered" errors when the MSG91
// Angular widget re-initializes (e.g. route changes, modal reopen).
function setupCaptchaPatches() {
  // --- hCaptcha ---
  if (!window.__msg91_hcaptchaPatched) {
    let _hcaptcha = window.hcaptcha;

    const patchRender = (obj) => {
      if (obj && typeof obj.render === 'function' && !obj.render.__patched) {
        const orig = obj.render;
        obj.render = function (container, config) {
          try {
            const el = typeof container === 'string' ? document.getElementById(container) : container;
            if (el && el.innerHTML.trim() !== '') {
              console.log('[hCaptcha] Container already populated, skipping duplicate render.');
              return null;
            }
            return orig.call(this, container, config);
          } catch (e) {
            if (e.message && e.message.includes('already')) {
              console.log('[hCaptcha] Caught duplicate render error gracefully.');
              return null;
            }
            throw e;
          }
        };
        obj.render.__patched = true;
      }
    };

    if (_hcaptcha) patchRender(_hcaptcha);
    try {
      Object.defineProperty(window, 'hcaptcha', {
        get() { return _hcaptcha; },
        set(val) { _hcaptcha = val; patchRender(val); },
        configurable: true,
      });
      window.__msg91_hcaptchaPatched = true;
    } catch (err) {
      console.error('[MSG91] Failed to patch hcaptcha:', err);
    }
  }

  // --- grecaptcha ---
  if (!window.__msg91_grecaptchaPatched) {
    let _grecaptcha = window.grecaptcha;

    const patchRender = (obj) => {
      if (obj && typeof obj.render === 'function' && !obj.render.__patched) {
        const orig = obj.render;
        obj.render = function (container, config) {
          try {
            const el = typeof container === 'string' ? document.getElementById(container) : container;
            if (el && el.innerHTML.trim() !== '') {
              console.log('[grecaptcha] Container already populated, skipping duplicate render.');
              return null;
            }
            return orig.call(this, container, config);
          } catch (e) {
            if (e.message && e.message.includes('already')) {
              console.log('[grecaptcha] Caught duplicate render error gracefully.');
              return null;
            }
            throw e;
          }
        };
        obj.render.__patched = true;
      }
    };

    if (_grecaptcha) patchRender(_grecaptcha);
    try {
      Object.defineProperty(window, 'grecaptcha', {
        get() { return _grecaptcha; },
        set(val) { _grecaptcha = val; patchRender(val); },
        configurable: true,
      });
      window.__msg91_grecaptchaPatched = true;
    } catch (err) {
      console.error('[MSG91] Failed to patch grecaptcha:', err);
    }
  }
}

// ── Notify all subscribers ───────────────────────────────────────────────────
function notifyListeners() {
  const state = {
    verified: captchaVerified,
    sdkReady: scriptLoaded && typeof window.sendOtp === 'function',
  };
  listeners.forEach((cb) => {
    try { cb(state); } catch (_) { /* swallow */ }
  });
}

// ── Global Captcha Poll (single timer for whole app) ─────────────────────────
function startCaptchaPoll() {
  if (pollIntervalId) return;

  let wasVerified = false;
  pollIntervalId = setInterval(() => {
    let token = '';

    // 1. Try hcaptcha API
    try {
      if (window.hcaptcha && typeof window.hcaptcha.getResponse === 'function') {
        token = window.hcaptcha.getResponse() || '';
      }
    } catch (_) { /* ignore */ }

    // 2. Try grecaptcha API
    if (!token) {
      try {
        if (window.grecaptcha && typeof window.grecaptcha.getResponse === 'function') {
          token = window.grecaptcha.getResponse() || '';
        }
      } catch (_) { /* ignore */ }
    }

    // 3. Fallback: scan hidden form fields (Safari compatibility)
    if (!token) {
      const els = document.querySelectorAll('textarea, input');
      for (const el of els) {
        const name = el.getAttribute('name') || '';
        if ((name.includes('recaptcha-response') || name.includes('captcha-response')) && el.value.trim()) {
          token = el.value.trim();
          break;
        }
      }
    }

    const verified = !!token;
    if (verified !== captchaVerified) {
      captchaVerified = verified;
      if (verified && !wasVerified) {
        console.timeEnd('MSG91_Captcha_Verify');
        console.log('[MSG91] TCaptcha verified');
      } else if (!verified && wasVerified) {
        console.log('[MSG91] TCaptcha verification cleared/expired');
        console.time('MSG91_Captcha_Verify');
      }
      wasVerified = verified;
      notifyListeners();
    }

    // Also notify if sdkReady status changed
    if (scriptLoaded && typeof window.sendOtp === 'function') {
      notifyListeners();
    }
  }, 500);
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Preload the MSG91 SDK script. Call once from main.jsx at app startup.
 * Does NOT need a captcha container — just loads the <script> tag.
 */
export function preloadMsg91SDK() {
  setupCaptchaPatches();

  if (scriptLoaded || scriptLoading) return;

  const existing = document.getElementById('msg91-otp-provider-script');
  if (existing) {
    scriptLoaded = true;
    console.log('[MSG91] SDK already in DOM');
    startCaptchaPoll();
    return;
  }

  scriptLoading = true;
  console.time('MSG91_SDK_Load');

  const script = document.createElement('script');
  script.id = 'msg91-otp-provider-script';
  script.src = 'https://verify.msg91.com/otp-provider.js';
  script.async = true;
  script.onload = () => {
    scriptLoaded = true;
    scriptLoading = false;
    console.timeEnd('MSG91_SDK_Load');
    notifyListeners();
  };
  script.onerror = () => {
    scriptLoading = false;
    console.error('[MSG91] Failed to load SDK script');
  };
  document.head.appendChild(script);

  startCaptchaPoll();
}

/**
 * Initialize (or re-initialize) the MSG91 widget into a DOM container.
 * Called by the useMsg91Captcha hook when the component's container div mounts.
 */
export function initMsg91Widget(containerId) {
  if (!containerId) return;

  window.configuration = {
    widgetId: import.meta.env.VITE_MSG91_WIDGET_ID,
    tokenAuth: import.meta.env.VITE_MSG91_TOKEN_AUTH,
    exposeMethods: true,
    captchaRenderId: containerId,
    success: (data) => console.log('[MSG91] Widget ready', data),
    failure: (err) => console.error('[MSG91] Widget failed', err),
  };

  const container = document.getElementById(containerId);
  if (!container) {
    console.log(`[MSG91] Container ${containerId} not found in DOM, deferring.`);
    return;
  }

  container.innerHTML = '';

  const doInit = () => {
    if (typeof window.initSendOTP !== 'function') return false;
    console.time('MSG91_Captcha_Init');
    try {
      window.initSendOTP(window.configuration);
      widgetInitialized = true;
      console.log('[MSG91] Widget initialized in container:', containerId);
    } catch (e) {
      console.error('[MSG91] Widget init error:', e);
    }
    console.timeEnd('MSG91_Captcha_Init');
    // Start verify timer (ends when user solves captcha)
    console.time('MSG91_Captcha_Verify');
    return true;
  };

  if (scriptLoaded) {
    doInit();
  } else {
    // SDK still loading — poll until ready (max 10s)
    let elapsed = 0;
    const check = setInterval(() => {
      elapsed += 100;
      if (scriptLoaded && doInit()) clearInterval(check);
      if (elapsed >= 10000) clearInterval(check);
    }, 100);
  }
}

/**
 * Subscribe to captcha/SDK state changes.
 * Callback receives { verified: boolean, sdkReady: boolean }.
 * Called immediately with current state upon subscription.
 */
export function onCaptchaChange(callback) {
  listeners.add(callback);
  callback({
    verified: captchaVerified,
    sdkReady: scriptLoaded && typeof window.sendOtp === 'function',
  });
}

/** Unsubscribe from captcha state changes. */
export function offCaptchaChange(callback) {
  listeners.delete(callback);
}

/** Synchronous check: is window.sendOtp available? */
export function isSdkReady() {
  return scriptLoaded && typeof window.sendOtp === 'function';
}

/** Synchronous check: has the user completed captcha? */
export function getCaptchaVerified() {
  return captchaVerified;
}