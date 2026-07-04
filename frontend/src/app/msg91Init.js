// ═══════════════════════════════════════════════════════════════════════════════
// MSG91 OTP SDK — Singleton Manager
// Loads the SDK once, manages widget lifecycle, and provides an event-driven
// SDK-readiness API consumed by the useMsg91OTP hook.
// ═══════════════════════════════════════════════════════════════════════════════

// ── Module-level singleton state ─────────────────────────────────────────────
let scriptLoaded = false;
let scriptLoading = false;
let widgetInitialized = false;
const listeners = new Set();

// ── Notify all subscribers ───────────────────────────────────────────────────
function notifyListeners() {
  const state = {
    sdkReady: scriptLoaded && typeof window.sendOtp === 'function',
  };
  listeners.forEach((cb) => {
    try { cb(state); } catch (_) { /* swallow */ }
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Preload the MSG91 SDK script. Call once from main.jsx at app startup.
 */
export function preloadMsg91SDK() {
  if (scriptLoaded || scriptLoading) return;

  const existing = document.getElementById('msg91-otp-provider-script');
  if (existing) {
    scriptLoaded = true;
    console.log('[MSG91] SDK already in DOM');
    notifyListeners();
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
}

/**
 * Initialize (or re-initialize) the MSG91 OTP widget.
 * Called once to set up window.configuration and invoke initSendOTP.
 */
export function initMsg91Widget() {
  window.configuration = {
    widgetId: import.meta.env.VITE_MSG91_WIDGET_ID,
    tokenAuth: import.meta.env.VITE_MSG91_TOKEN_AUTH,
    exposeMethods: true,
    success: (data) => console.log('[MSG91] Widget ready', data),
    failure: (err) => console.error('[MSG91] Widget failed', err),
  };

  const doInit = () => {
    if (typeof window.initSendOTP !== 'function') return false;
    try {
      window.initSendOTP(window.configuration);
      widgetInitialized = true;
      console.log('[MSG91] Widget initialized (captcha-free)');
    } catch (e) {
      console.error('[MSG91] Widget init error:', e);
    }
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
 * Subscribe to SDK state changes.
 * Callback receives { sdkReady: boolean }.
 * Called immediately with current state upon subscription.
 */
export function onSdkChange(callback) {
  listeners.add(callback);
  callback({
    sdkReady: scriptLoaded && typeof window.sendOtp === 'function',
  });
}

/** Unsubscribe from SDK state changes. */
export function offSdkChange(callback) {
  listeners.delete(callback);
}

/** Synchronous check: is window.sendOtp available? */
export function isSdkReady() {
  return scriptLoaded && typeof window.sendOtp === 'function';
}