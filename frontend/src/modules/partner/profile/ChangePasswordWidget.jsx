import React, { useState } from 'react';
import { MdLock, MdCheckCircle } from 'react-icons/md';
import api from '../../../api/api';
import { useAuthStore } from '../../../store/authStore';

export default function ChangePasswordWidget() {
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mt-6">
      <div className="p-6 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
        <MdLock className="text-gray-500" size={20} />
        <h3 className="text-lg font-bold text-gray-800">Security</h3>
      </div>
      
      <div className="p-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100">
            {error}
          </div>
        )}

        {step === 1 && (
          <div>
            <p className="text-gray-600 mb-4">
              Update your account password securely. We will send a verification code to your registered email or mobile to confirm it's you.
            </p>
            <button
              onClick={handleSendOtp}
              disabled={loading}
              className="bg-white border border-[#0D5CAB] text-[#0D5CAB] px-6 py-2 rounded-lg font-semibold hover:bg-[#0D5CAB] hover:text-white transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending Code...' : 'Change Password'}
            </button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-sm">
            <p className="text-sm text-gray-500 mb-4">
              Verification code sent to <strong>{user?.email || user?.mobile}</strong>
            </p>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Verification Code</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D5CAB]/20 focus:border-[#0D5CAB]"
                placeholder="Enter 6-digit code"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D5CAB]/20 focus:border-[#0D5CAB]"
                placeholder="Enter new password"
                required
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#0D5CAB] text-white py-2 rounded-lg font-bold hover:bg-[#083E7A] transition-colors disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="flex items-center gap-3 text-green-600 bg-green-50 p-4 rounded-lg">
            <MdCheckCircle size={24} />
            <div>
              <h4 className="font-bold">Password Updated Successfully</h4>
              <p className="text-sm mt-1">Your account is secure.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
