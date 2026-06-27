export function initMsg91() {
  window.configuration = {
    widgetId: import.meta.env.VITE_MSG91_WIDGET_ID,
    tokenAuth: import.meta.env.VITE_MSG91_TOKEN_AUTH,
    exposeMethods: true,
    captchaRenderId: 'msg91-captcha-global',
    success: (data) => console.log('[MSG91] Widget ready', data),
    failure: (err) => console.error('[MSG91] Widget failed', err),
  };

  const container = document.getElementById('msg91-captcha-global');
  if (!container) {
    console.log('[MSG91] Captcha container not found in DOM, deferring initialization.');
    return;
  }

  const existing = document.getElementById('msg91-otp-provider-script');
  if (existing) {
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