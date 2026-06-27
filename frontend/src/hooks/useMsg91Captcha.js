import { useState, useEffect } from 'react';
import { initMsg91Widget, onCaptchaChange, offCaptchaChange, isSdkReady } from '../msg91Init';

/**
 * Shared React hook for MSG91 captcha integration.
 *
 * Generates a unique container ID, initialises the widget once the container
 * is in the DOM, and subscribes to the global captcha-verification poll.
 *
 * @param {{ enabled?: boolean }} opts
 *   `enabled` (default `true`) — set to `false` to defer widget init
 *   (e.g. PartnerRegister only shows captcha on step 0).
 *
 * @returns {{ isCaptchaVerified: boolean, sdkReady: boolean, containerId: string }}
 */
export function useMsg91Captcha({ enabled = true } = {}) {
  const [containerId] = useState(
    () => `msg91-captcha-${Math.random().toString(36).substr(2, 9)}`
  );
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [sdkReady, setSdkReady] = useState(isSdkReady());

  // Initialise widget when container is in the DOM
  useEffect(() => {
    if (enabled) {
      // useEffect runs after paint, so the container div is already in the DOM
      initMsg91Widget(containerId);
    }
  }, [containerId, enabled]);

  // Subscribe to the singleton captcha/SDK state
  useEffect(() => {
    const handler = ({ verified, sdkReady: ready }) => {
      setIsCaptchaVerified(verified);
      setSdkReady(ready);
    };
    onCaptchaChange(handler);
    return () => offCaptchaChange(handler);
  }, []);

  return { isCaptchaVerified, sdkReady, containerId };
}
