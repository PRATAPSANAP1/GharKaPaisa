import React, { useState } from 'react';
import api from '../../services/api';
import { useCashfree } from './useCashfree';

/**
 * Cashfree Seamless Web Checkout Component
 *
 * Props:
 * @param {number} amount - Amount to charge (in INR)
 * @param {string} buttonText - Text to display on button
 * @param {string} description - Order note
 * @param {object} userDetails - { name, email, contact }
 * @param {function} onSuccess - Callback when payment is verified
 * @param {function} onFailure - Callback when payment fails or is cancelled
 * @param {object} style - Custom styling
 */
export default function CashfreeCheckoutButton({
  amount = 500,
  buttonText = "Pay with Cashfree",
  description = "GharKaPaisa Secure Checkout",
  userDetails = {},
  onSuccess,
  onFailure,
  style = {}
}) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const { isLoaded, cashfree } = useCashfree();

  const handlePayment = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      if (!isLoaded || !cashfree) {
        throw new Error("Cashfree SDK is initializing. Please wait a moment and try again.");
      }

      // Step 1: Create Order on Backend
      const orderRes = await api.post('/payment/cashfree/create-order', {
        amount,
        customerPhone: userDetails.contact || userDetails.mobile || '9999999999',
        customerName: userDetails.name || 'GKP Customer',
        customerEmail: userDetails.email || 'customer@gharkapaisa.in',
        note: description,
        returnUrl: `${window.location.origin}/payment/status?order_id={order_id}`
      });

      if (!orderRes.data?.success || !orderRes.data?.payment_session_id) {
        throw new Error(orderRes.data?.message || "Failed to initiate Cashfree order.");
      }

      const { payment_session_id, order_id } = orderRes.data;

      // Step 2: Open Cashfree Checkout Modal
      const checkoutOptions = {
        paymentSessionId: payment_session_id,
        redirectTarget: "_modal", // Opens inside standard modal overlay
      };

      cashfree.checkout(checkoutOptions).then(async (result) => {
        if (result.error) {
          console.error("[CASHFREE] Checkout Error:", result.error);
          setErrorMsg(result.error.message || "Payment process cancelled or failed.");
          setLoading(false);
          if (onFailure) onFailure(result.error);
          return;
        }

        if (result.paymentDetails) {
          console.log("[CASHFREE] Payment Completed, Verifying...", result.paymentDetails);
          try {
            // Step 3: Verify with Backend
            const verifyRes = await api.post('/payment/cashfree/verify-payment', { order_id });
            if (verifyRes.data?.success) {
              if (onSuccess) {
                onSuccess(verifyRes.data, result.paymentDetails);
              } else {
                alert(`Payment Successful! Order ID: ${order_id}`);
              }
            } else {
              throw new Error(verifyRes.data?.message || "Verification failed.");
            }
          } catch (verifyErr) {
            console.error("[CASHFREE] Verification Error:", verifyErr);
            const msg = verifyErr.response?.data?.message || verifyErr.message || "Payment verification failed.";
            setErrorMsg(msg);
            if (onFailure) onFailure(verifyErr);
          } finally {
            setLoading(false);
          }
        }
      });
    } catch (err) {
      console.error("[CASHFREE] Payment Error:", err);
      const msg = err.response?.data?.message || err.message || "An unexpected error occurred.";
      setErrorMsg(msg);
      setLoading(false);
      if (onFailure) onFailure(err);
    }
  };

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <button
        type="button"
        onClick={handlePayment}
        disabled={loading}
        style={{
          background: 'linear-gradient(135deg, #1B74BB, #0851A1)',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '10px',
          padding: '10px 20px',
          fontSize: '14px',
          fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 12px rgba(27, 116, 187, 0.25)',
          transition: 'all 0.2s ease',
          ...style
        }}
      >
        {loading ? (
          <>
            <span style={{
              width: '14px',
              height: '14px',
              border: '2px solid #fff',
              borderTop: '2px solid transparent',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} />
            Initiating Payment...
          </>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
            {buttonText}
          </>
        )}
      </button>
      {errorMsg && (
        <span style={{ fontSize: '11px', color: '#EF4444', fontWeight: 600 }}>
          {errorMsg}
        </span>
      )}
    </div>
  );
}

