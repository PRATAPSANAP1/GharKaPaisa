import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';
import authService from '../../services/authService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setEmailSent(true);
      toast.success('Reset email sent successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]" />

      <Card className="w-full max-w-md relative z-10 p-8 border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl hover:-translate-y-0" hover={false}>
        <div className="flex flex-col items-center justify-center text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 mb-4 animate-bounce">
            <Mail className="text-white w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Forgot Password?</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
            Enter your student email and we'll send you instructions to reset your password.
          </p>
        </div>

        {emailSent ? (
          <div className="text-center">
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-sm mb-6 leading-relaxed">
              We have sent a password reset link to <span className="font-bold text-blue-600 dark:text-blue-400">{email}</span>. Please check your inbox and spam folders.
            </div>
            <Link
              to="/login"
              className="inline-flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input
              label="Student Email"
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@gmail.com"
              icon={Mail}
            />
            <Button
              variant="primary"
              type="submit"
              loading={loading}
              fullWidth
              icon={Send}
            >
              Send Reset Link
            </Button>
            <div className="text-center mt-2">
              <Link
                to="/login"
                className="inline-flex items-center text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
              </Link>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};

export default ForgotPassword;

