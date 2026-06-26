let initialized = false;

export function initMsg91() {
  if (initialized) return;

  window.configuration = {
    widgetId: import.meta.env.VITE_MSG91_WIDGET_ID,
    tokenAuth: import.meta.env.VITE_MSG91_TOKEN_AUTH,
    exposeMethods: true,
    captchaRenderId: 'msg91-captcha-global',
    success: (data) => console.log('[MSG91] Widget ready', data),
    failure: (err) => console.error('[MSG91] Widget failed', err),
  };

  const existing = document.getElementById('msg91-otp-provider-script');
  if (existing) {
    if (typeof window.initSendOTP === 'function' && typeof window.sendOtp !== 'function') {
      window.initSendOTP(window.configuration);
    }
    initialized = true;
    return;
  }

  const script = document.createElement('script');
  script.id = 'msg91-otp-provider-script';
  script.src = 'https://verify.msg91.com/otp-provider.js';
  script.async = true;
  script.onload = () => {
    if (typeof window.sendOtp !== 'function' && typeof window.initSendOTP === 'function') {
      window.initSendOTP(window.configuration);
    }
  };
  document.body.appendChild(script);
  initialized = true;
}