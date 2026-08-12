// Polyfill/stub window.TraceIQ for MSG91 SDK optional chaining support
if (typeof window !== 'undefined' && typeof window.TraceIQ === 'undefined') {
  window.TraceIQ = {
    track: function () {},
    page: function () {},
    identify: function () {},
  };
}

// Silence known third-party widget spam/harmless warnings in console
const origLog = console.log;
const origWarn = console.warn;
const origError = console.error;

const SPAM_PATTERNS = [
  'MSG91_SDK_Load',
  'Widget initialized in container',
  'MSG91_Captcha_Init',
  'Slow network is detected',
  'recaptchacompat disabled',
  'hCaptcha was already rendered',
  'Timer \'MSG91_Captcha_Verify\' already exists',
  'TCaptcha verified',
  'TCaptcha verification cleared/expired',
  'MSG91_Captcha_Verify',
  'AxiosError: Request failed with status code 401',
  'status code 401',
  'Unauthorized',
  'TraceIQ is not defined',
  'TraceIQ'
];

const shouldSuppress = (args) => {
  return args.some(arg => {
    if (typeof arg === 'string') {
      return SPAM_PATTERNS.some(pat => arg.includes(pat));
    }
    if (arg instanceof Error || (arg && typeof arg.message === 'string')) {
      const msg = arg.message;
      return SPAM_PATTERNS.some(pat => msg.includes(pat));
    }
    return false;
  });
};

console.log = function (...args) {
  if (shouldSuppress(args)) return;
  origLog.apply(console, args);
};

console.warn = function (...args) {
  if (shouldSuppress(args)) return;
  origWarn.apply(console, args);
};

console.error = function (...args) {
  if (shouldSuppress(args)) return;
  origError.apply(console, args);
};

const origTime = console.time;
const origTimeEnd = console.timeEnd;

console.time = function (label) {
  if (label && (label.includes('MSG91') || label.includes('Captcha') || label.includes('TCaptcha'))) return;
  if (typeof origTime === 'function') origTime.call(console, label);
};

console.timeEnd = function (label) {
  if (label && (label.includes('MSG91') || label.includes('Captcha') || label.includes('TCaptcha'))) return;
  if (typeof origTimeEnd === 'function') origTimeEnd.call(console, label);
};

// Silence unhandled rejections globally for expected authentication errors
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  if (reason) {
    const msg = reason.message || String(reason);
    if (SPAM_PATTERNS.some(pat => msg.includes(pat))) {
      event.preventDefault();
    }
  }
});

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App.jsx'
import './app/i18n';
import { preloadMsg91SDK } from './app/msg91Init';
import { initGlobalFormPersistence } from './utils/formPersist';

// Load MSG91 SDK script once at app startup
preloadMsg91SDK();

// Initialize automatic page reload form persistence for all input fields across the website
initGlobalFormPersistence();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)