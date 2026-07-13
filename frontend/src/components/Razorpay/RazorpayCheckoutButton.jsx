import React, { useState } from 'react';
import api from '../../services/api';

/**
 * Razorpay Standard Web Checkout Component
 *
 * Props:
 * @param {number} amount - Amount to charge (in INR or Paise)
 * @param {string} buttonText - Text to display on button
 * @param {object} userDetails - { name, email, contact }
 * @param {function} onSuccess - Callback when payment is verified
 * @param {function} onFailure - Callback when payment fails or is cancelled
 * @param {object} style - Inline styles for button
 */
export default function RazorpayCheckoutButton({
  amount = 500,
  buttonText = "Pay with Razorpay",
  description = "GharKaPaisa Secure Checkout",
  userDetails = {},
  onSuccess,
  onFailure,
  style = {}
}) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      // 1. Ensure Razorpay script loaded
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Razorpay SDK failed to load. Please check your internet connection.");
      }

      // 2. Step 1: Create Order on Backend
      const orderRes = await api.post('/create-order', {
        amount,
        currency: 'INR',
        receipt: `rcpt_${Date.now()}`
      }).catch(async (err) => {
        // Fallback to /payment/create-order or /api/v1/payment/create-order if top level endpoint route varies
        return await api.post('/payment/create-order', {
          amount,
          currency: 'INR',
          receipt: `rcpt_${Date.now()}`
        });
      });

      if (!orderRes.data?.success && !orderRes.data?.order_id) {
        throw new Error(orderRes.data?.message || "Failed to initiate payment order.");
      }

      const { order_id, amount: orderAmount, currency, key_id } = orderRes.data;
      const razorpayKey = key_id || import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_TCqZGvr7067i7N";

      // 3. Step 2: Configure Razorpay Standard Modal Options
      const options = {
        key: razorpayKey,
        amount: orderAmount,
        currency: currency || "INR",
        name: "GharKaPaisa",
        description: description,
        image: "https://gharkapaisa.in/assets/logos/logo.png",
        order_id: order_id,
        prefill: {
          name: userDetails.name || "",
          email: userDetails.email || "",
          contact: userDetails.contact || userDetails.mobile || ""
        },
        theme: {
          color: "#0D5CAB"
        },
        handler: async function (response) {
          try {
            // Step 3: Verify Payment Signature on Backend
            const verifyRes = await api.post('/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            }).catch(async () => {
              return await api.post('/payment/verify-payment', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              });
            });

            if (verifyRes.data?.success) {
              if (onSuccess) {
                onSuccess(verifyRes.data, response);
              } else {
                alert(`Payment Successful! Payment ID: ${response.razorpay_payment_id}`);
              }
            } else {
              throw new Error(verifyRes.data?.message || "Signature verification failed.");
            }
          } catch (verifyErr) {
            console.error("Payment Verification Error:", verifyErr);
            const msg = verifyErr.response?.data?.message || verifyErr.message || "Payment verification failed.";
            setErrorMsg(msg);
            if (onFailure) onFailure(verifyErr);
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            console.log("Razorpay checkout modal dismissed by user.");
            setLoading(false);
            if (onFailure) onFailure(new Error("Payment modal dismissed by user."));
          }
        }
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', function (response) {
        console.error("Razorpay Payment Failed:", response.error);
        const failMsg = response.error?.description || "Payment process failed.";
        setErrorMsg(failMsg);
        setLoading(false);
        if (onFailure) onFailure(response.error);
      });

      rzp.open();
    } catch (err) {
      console.error("Razorpay Checkout Error:", err);
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
          background: 'linear-gradient(135deg, #0D5CAB, #083E7A)',
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
          boxShadow: '0 4px 12px rgba(13, 92, 171, 0.25)',
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
            Processing Order...
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
