let scriptLoaded = false;

function setupCaptchaPatches() {
  // --- hCaptcha Patching ---
  if (!window.hcaptchaPatched) {
    let _hcaptcha = window.hcaptcha;
    
    // Helper to patch a defined hcaptcha object
    const patchHCaptcha = (val) => {
      if (val && typeof val.render === 'function' && !val.render.isPatched) {
        const originalRender = val.render;
        val.render = function(container, config) {
          try {
            const el = typeof container === 'string' ? document.getElementById(container) : container;
            if (el && el.innerHTML.trim() !== '') {
              console.log('[hCaptcha] Container already populated, skipping duplicate render.');
              return null;
            }
            return originalRender.call(this, container, config);
          } catch (e) {
            if (e.message && (e.message.includes('already rendered') || e.message.includes('already'))) {
              console.log('[hCaptcha] Caught duplicate render error gracefully.');
              return null;
            }
            throw e;
          }
        };
        val.render.isPatched = true;
      }
    };

    // Patch current instance if exists
    if (_hcaptcha) patchHCaptcha(_hcaptcha);

    try {
      Object.defineProperty(window, 'hcaptcha', {
        get() { return _hcaptcha; },
        set(val) {
          _hcaptcha = val;
          patchHCaptcha(val);
        },
        configurable: true
      });
      window.hcaptchaPatched = true;
    } catch (err) {
      console.error('[MSG91] Failed to patch hcaptcha setter:', err);
    }
  }

  // --- Google reCAPTCHA Patching ---
  if (!window.grecaptchaPatched) {
    let _grecaptcha = window.grecaptcha;
    
    const patchGRecaptcha = (val) => {
      if (val && typeof val.render === 'function' && !val.render.isPatched) {
        const originalRender = val.render;
        val.render = function(container, config) {
          try {
            const el = typeof container === 'string' ? document.getElementById(container) : container;
            if (el && el.innerHTML.trim() !== '') {
              console.log('[grecaptcha] Container already populated, skipping duplicate render.');
              return null;
            }
            return originalRender.call(this, container, config);
          } catch (e) {
            if (e.message && (e.message.includes('already rendered') || e.message.includes('already'))) {
              console.log('[grecaptcha] Caught duplicate render error gracefully.');
              return null;
            }
            throw e;
          }
        };
        val.render.isPatched = true;
      }
    };

    if (_grecaptcha) patchGRecaptcha(_grecaptcha);

    try {
      Object.defineProperty(window, 'grecaptcha', {
        get() { return _grecaptcha; },
        set(val) {
          _grecaptcha = val;
          patchGRecaptcha(val);
        },
        configurable: true
      });
      window.grecaptchaPatched = true;
    } catch (err) {
      console.error('[MSG91] Failed to patch grecaptcha setter:', err);
    }
  }
}

export function initMsg91(dynamicId = 'msg91-captcha-global') {
  setupCaptchaPatches();
  
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