import React, { useState } from 'react';
import { MdLockReset, MdClose, MdCheckCircle } from 'react-icons/md';
import api from '../api/api';
import { useAuthStore } from '../store/authStore';

export default function ForcePasswordChangeModal({ isOpen }) {
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0F172A]/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative">
        <div className="bg-[#0D5CAB] p-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <MdLockReset size={32} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">Action Required</h2>
          <p className="text-blue-100 text-sm mt-1">Please secure your account</p>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="text-center">
              <p className="text-[#334155] mb-6">
                As a new team member, you must change your temporary password before accessing the partner portal. We will send a verification code to your registered email to proceed.
              </p>
              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full bg-[#0D5CAB] text-white py-3 rounded-xl font-bold hover:bg-[#083E7A] transition-colors disabled:opacity-70"
              >
                {loading ? 'Sending Code...' : 'Send Verification Code'}
              </button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <p className="text-sm text-[#64748B] text-center mb-4">
                A verification code has been sent to <strong>{user?.email}</strong>.
              </p>
              <div>
                <label className="block text-sm font-semibold text-[#334155] mb-1">Verification Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5CAB]/20 focus:border-[#0D5CAB]"
                  placeholder="Enter 6-digit code"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#334155] mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5CAB]/20 focus:border-[#0D5CAB]"
                  placeholder="Enter new strong password"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0D5CAB] text-white py-3 rounded-xl font-bold hover:bg-[#083E7A] transition-colors disabled:opacity-70 mt-2"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}

          {step === 3 && (
            <div className="text-center py-4">
              <MdCheckCircle size={64} className="text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-[#0F172A] mb-2">Password Updated!</h3>
              <p className="text-[#64748B] mb-6">
                Your password has been successfully secured. You can now access your partner portal.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-[#0D5CAB] text-white py-3 rounded-xl font-bold hover:bg-[#083E7A] transition-colors"
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
