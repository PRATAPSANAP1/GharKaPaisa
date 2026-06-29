import React, { useState } from 'react';
import { MdLock, MdCheckCircle } from 'react-icons/md';
import api from '../../../services/api';
import { useAuthStore } from '../../../app/store/authStore';
import { useTheme, makeS } from '../../../contexts/ThemeContext';

export default function ChangePasswordWidget() {
  const { C } = useTheme();
  const S = makeS(C);

  const user = useAuthStore((state) => state.user);
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/send-otp', { identity: user.email || user.mobile });
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
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: C.card, borderRadius: '14px', border: `1px solid ${C.border}`,
      overflow: 'hidden', marginTop: '8px'
    }}>
      <div style={{
        padding: '14px 20px', borderBottom: `1px solid ${C.border}`,
        background: C.bgSecondary, display: 'flex', alignItems: 'center', gap: '8px'
      }}>
        <MdLock style={{ color: C.textMid }} size={18} />
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: C.text, margin: 0 }}>Security</h3>
      </div>

      <div style={{ padding: '20px' }}>
        {error && (
          <div style={{
            background: `${C.red}12`, color: C.red, padding: '10px 14px',
            borderRadius: '10px', fontSize: '13px', fontWeight: 600,
            marginBottom: '16px', border: `1px solid ${C.red}25`
          }}>
            {error}
          </div>
        )}

        {step === 1 && (
          <div>
            <p style={{ color: C.textMid, fontSize: '14px', margin: '0 0 16px', lineHeight: 1.6 }}>
              Update your account password securely. We will send a verification code to your registered email or mobile to confirm it's you.
            </p>
            <button
              onClick={handleSendOtp}
              disabled={loading}
              style={{
                ...S.btn('outline'), padding: '10px 24px', fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Sending Code...' : 'Change Password'}
            </button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleUpdatePassword} style={{ maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '13px', color: C.textMid, margin: 0 }}>
              Verification code sent to <strong style={{ color: C.text }}>{user?.email || user?.mobile}</strong>
            </p>
            <div>
              <label style={S.label}>Verification Code</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                style={S.input}
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
                style={S.input}
                placeholder="Enter new password"
                required
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  ...S.btn('ghost'), padding: '10px 20px', fontSize: '14px',
                  color: C.textMid, cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  ...S.btn('primary'), flex: 1, padding: '10px 20px', fontSize: '14px',
                  cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            background: `${C.green}12`, padding: '16px 20px', borderRadius: '12px',
            color: C.green
          }}>
            <MdCheckCircle size={24} />
            <div>
              <h4 style={{ fontWeight: 700, fontSize: '15px', margin: 0 }}>Password Updated Successfully</h4>
              <p style={{ fontSize: '13px', margin: '4px 0 0', opacity: 0.85 }}>Your account is secure.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
