import { useState, useEffect } from 'react';
import { initMsg91Widget, onSdkChange, offSdkChange, isSdkReady } from '../app/msg91Init';

/**
 * Shared React hook for MSG91 OTP integration (captcha-free).
 *
 * Initialises the MSG91 widget once and subscribes to SDK-readiness state.
 *
 * @returns {{ sdkReady: boolean }}
 */
export function useMsg91OTP() {
  const [sdkReady, setSdkReady] = useState(isSdkReady());

  // Initialise widget once
  useEffect(() => {
    initMsg91Widget();
  }, []);

  // Subscribe to SDK readiness state
  useEffect(() => {
    const handler = ({ sdkReady: ready }) => {
      setSdkReady(ready);
    };
    onSdkChange(handler);
    return () => offSdkChange(handler);
  }, []);

  return { sdkReady };
}
