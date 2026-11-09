import { useState, useEffect } from 'react';

const CASHFREE_SDK_URL = 'https://sdk.cashfree.com/js/v3/cashfree.js';

export function useCashfree() {
  const [cashfree, setCashfree] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const initCashfree = () => {
      if (window.Cashfree) {
        const mode = import.meta.env.VITE_CASHFREE_ENV === 'PROD' ? 'production' : 'sandbox';
        const cfInstance = window.Cashfree({ mode });
        setCashfree(cfInstance);
        setIsLoaded(true);
        return true;
      }
      return false;
    };

    if (initCashfree()) return;

    const script = document.createElement('script');
    script.src = CASHFREE_SDK_URL;
    script.async = true;
    script.onload = () => {
      initCashfree();
    };
    script.onerror = () => {
      console.error('[CASHFREE] Failed to load Cashfree SDK script.');
      setIsLoaded(false);
    };

    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return { isLoaded, cashfree };
}

export default useCashfree;

