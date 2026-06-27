let scriptLoaded = false;

export function initMsg91(dynamicId = 'msg91-captcha-global') {
  window.configuration = {
    widgetId: import.meta.env.VITE_MSG91_WIDGET_ID,
    tokenAuth: import.meta.env.VITE_MSG91_TOKEN_AUTH,
    exposeMethods: true,
    captchaRenderId: dynamicId,
    success: (data) => console.log('[MSG91] Widget ready', data),
    failure: (err) => console.error('[MSG91] Widget failed', err),
  };

  const container = document.getElementById(dynamicId);
  if (!container) {
    console.log(`[MSG91] Captcha container ${dynamicId} not found in DOM, deferring initialization.`);
    return;
  }

  // If script was already loaded, clear the container and re-initialize the widget
  if (scriptLoaded) {
    container.innerHTML = '';
    if (typeof window.initSendOTP === 'function') {
      try {
        window.initSendOTP(window.configuration);
      } catch (e) {
        console.error('[MSG91] Failed to re-init send OTP:', e);
      }
    }
    return;
  }

  // First-time load: append the script
  const existing = document.getElementById('msg91-otp-provider-script');
  if (existing) {
    // Script tag exists but our flag was reset (e.g. HMR) — just re-init
    scriptLoaded = true;
    container.innerHTML = '';
    if (typeof window.initSendOTP === 'function') {
      try {
        window.initSendOTP(window.configuration);
      } catch (e) {
        console.error('[MSG91] Failed to re-init send OTP:', e);
      }
    }
    return;
  }

  const script = document.createElement('script');
  script.id = 'msg91-otp-provider-script';
  script.src = 'https://verify.msg91.com/otp-provider.js';
  script.async = true;
  script.onload = () => {
    scriptLoaded = true;
    console.log('[MSG91] SDK loaded successfully');
    if (typeof window.initSendOTP === 'function') {
      try {
        window.initSendOTP(window.configuration);
      } catch (e) {
        console.error('[MSG91] Failed to init send OTP:', e);
      }
    }
  };
  document.body.appendChild(script);
}