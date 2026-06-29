import React, { useState } from 'react';
import { MdLockReset, MdCheckCircle } from 'react-icons/md';
import api from '../../../services/api';
import { useAuthStore } from '../../../app/store/authStore';
import { useTheme, makeS } from '../../../contexts/ThemeContext';

export default function ForcePasswordChangeModal({ isOpen }) {
  const { C } = useTheme();
  const S = makeS(C);

  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [step, setStep] = useState(1); // 1: Info, 2: OTP Sent, 3: Success
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSendOtp = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/send-otp', { identity: user.email });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!otp || !newPassword) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/update-password-with-otp', { otp, newPassword });
      setStep(3);
      updateUser({ must_change_password: false });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const overlayStyle = {
    position: 'fixed', inset: 0, zIndex: 100,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
    padding: '16px'
  };

  const modalStyle = {
    background: C.card, borderRadius: '20px', width: '100%', maxWidth: '440px',
    overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    border: `1px solid ${C.border}`
  };

  const headerStyle = {
    background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
    padding: '28px', textAlign: 'center'
  };

  const errStyle = {
    background: `${C.red}12`, color: C.red, padding: '10px 14px',
    borderRadius: '10px', fontSize: '13px', fontWeight: 600,
    marginBottom: '16px', border: `1px solid ${C.red}25`
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px'
          }}>
            <MdLockReset size={28} style={{ color: '#fff' }} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', margin: 0 }}>Action Required</h2>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', margin: '6px 0 0' }}>Please secure your account</p>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {error && <div style={errStyle}>{error}</div>}

          {step === 1 && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: '0 0 24px' }}>
                As a new team member, you must change your temporary password before accessing the partner portal. We will send a verification code to your registered email to proceed.
              </p>
              <button
                onClick={handleSendOtp}
                disabled={loading}
                style={{
                  ...S.btn('primary'), width: '100%', padding: '14px',
                  fontSize: '15px', borderRadius: '12px', border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Sending Code...' : 'Send Verification Code'}
              </button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '13px', color: C.textMid, textAlign: 'center', margin: 0 }}>
                A verification code has been sent to <strong style={{ color: C.text }}>{user?.email}</strong>.
              </p>
              <div>
                <label style={S.label}>Verification Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  style={{ ...S.input, borderRadius: '12px', padding: '14px 16px' }}
                  placeholder="Enter 6-digit code"
                  required
                />
              </div>
              <div>
                <label style={S.label}>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ ...S.input, borderRadius: '12px', padding: '14px 16px' }}
                  placeholder="Enter new strong password"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{
                  ...S.btn('primary'), width: '100%', padding: '14px',
                  fontSize: '15px', borderRadius: '12px', border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                  marginTop: '4px'
                }}
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}

          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <MdCheckCircle size={56} style={{ color: C.green, marginBottom: '16px' }} />
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: C.text, margin: '0 0 8px' }}>Password Updated!</h3>
              <p style={{ color: C.textMid, fontSize: '14px', margin: '0 0 24px' }}>
                Your password has been successfully secured. You can now access your partner portal.
              </p>
              <button
                onClick={() => window.location.reload()}
                style={{
                  ...S.btn('primary'), width: '100%', padding: '14px',
                  fontSize: '15px', borderRadius: '12px', border: 'none', cursor: 'pointer'
                }}
              >
                Continue to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
