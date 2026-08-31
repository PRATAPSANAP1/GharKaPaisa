import React, { useState } from 'react';
import { MdLockReset, MdCheckCircle } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { useAuthStore } from '../../../app/store/authStore';
import { useTheme, makeS } from '../../../contexts/ThemeContext';

export default function EmployeeForcePasswordModal({ isOpen, onClose }) {
  const { C } = useTheme();
  const S = makeS(C);
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  if (!isOpen) return null;

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setError('Please fill in both password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.post('/auth/change-password', { newPassword });
      updateUser({ must_change_password: false });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToForm = () => {
    onClose();
    navigate('/employee/joining-form');
  };

  const overlayStyle = {
    position: 'fixed', inset: 0, zIndex: 9999,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
    padding: '16px'
  };

  const modalStyle = {
    background: C.card, borderRadius: '24px', width: '100%', maxWidth: '460px',
    overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
    border: `1px solid ${C.border}`
  };

  const headerStyle = {
    background: `linear-gradient(135deg, ${C.employeePrimary || '#0F766E'}, #0D9488)`,
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
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#fff', margin: 0 }}>Set Permanent Password</h2>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', margin: '6px 0 0' }}>
            {user?.full_name ? `Welcome ${user.full_name}!` : 'Welcome!'} Please create a new password to secure your account.
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {error && <div style={errStyle}>{error}</div>}

          {step === 1 ? (
            <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: C.bgSecondary, padding: '12px 16px', borderRadius: '12px', fontSize: '13px', color: C.textMid, border: `1px solid ${C.border}` }}>
                <strong>Account ID:</strong> {user?.emp_code || user?.employee_id || user?.email}<br />
                <span style={{ fontSize: '12px' }}>This is your first login. You must change your temporary password.</span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.textMid, marginBottom: '6px' }}>
                  New Password *
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ ...S.input, borderRadius: '12px', padding: '12px 16px' }}
                  placeholder="Enter new password (min 6 characters)"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.textMid, marginBottom: '6px' }}>
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ ...S.input, borderRadius: '12px', padding: '12px 16px' }}
                  placeholder="Re-enter new password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  ...S.btn('primary'),
                  background: C.employeePrimary || '#0F766E',
                  width: '100%', padding: '14px',
                  fontSize: '15px', borderRadius: '12px', border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                  marginTop: '6px'
                }}
              >
                {loading ? 'Updating Password...' : 'Save Password & Continue'}
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <MdCheckCircle size={60} style={{ color: C.green || '#10B981', marginBottom: '16px' }} />
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: C.text, margin: '0 0 8px' }}>Password Secured!</h3>
              <p style={{ color: C.textMid, fontSize: '13.5px', margin: '0 0 24px', lineHeight: 1.5 }}>
                Your password has been successfully updated. Please complete your <strong>Employee Onboarding & Joining Form</strong> to activate your workspace.
              </p>
              <button
                onClick={handleProceedToForm}
                style={{
                  ...S.btn('primary'),
                  background: C.employeePrimary || '#0F766E',
                  width: '100%', padding: '14px',
                  fontSize: '15px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 800
                }}
              >
                Proceed to Employee Onboarding Form →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
