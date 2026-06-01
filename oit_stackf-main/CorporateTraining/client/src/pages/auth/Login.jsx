import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Mail, Lock, Eye, EyeOff, LogIn, GraduationCap, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { login } from '../../store/slices/authSlice';

const Login = () => {
  const passwordInputRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(state => state.auth || {});

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await dispatch(login({ email: formData.email, password: formData.password })).unwrap();
      toast.success(`Welcome back, ${result?.user?.name?.split(' ')[0] || 'User'}!`);
    } catch (err) {
      toast.error(err?.message || err || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const btnClass = 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
  const ringClass = 'focus:ring-blue-500';

  return (
    <div className="h-[100dvh] overflow-hidden bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Navbar */}
      <nav className="h-14 shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/60 flex items-center justify-between px-6">
        <div className="flex items-center gap-2.5">
          <img src="/logo.jpg" alt="OIT_STACK" className="w-12 h-12 object-cover rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm" />
          <span className="font-bold text-slate-900 dark:text-white text-lg">OIT_STACK</span>
        </div>
        <button
          onClick={() => {
            const isDark = document.documentElement.classList.toggle('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
          }}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
          </svg>
        </button>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center p-4">

      <div className="w-full max-w-md">
        {/* Card */}
        <div className="w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 transition-all duration-300 p-8 sm:p-12 sm:py-14">
          
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white mb-8 text-center">
            Sign In
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className={`absolute left-3 top-2.5 w-4 h-4 pointer-events-none ${errors.email ? 'text-red-400' : 'text-slate-400'}`} />
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@gmail.com"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition text-sm ${
                    errors.email ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                  } ${ringClass}`}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className={`absolute left-3 top-2.5 w-4 h-4 pointer-events-none ${errors.password ? 'text-red-400' : 'text-slate-400'}`} />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  ref={passwordInputRef}
                  placeholder="Enter your password"
                  className={`w-full pl-10 pr-12 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition text-sm ${
                    errors.password ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                  } ${ringClass}`}
                />
                <button
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => { setShowPassword(!showPassword); setTimeout(() => passwordInputRef.current?.focus(), 0); }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>

            <div className="text-right">
              <Link to="/forgot-password" className="text-xs text-blue-500 hover:underline">Forgot password?</Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${btnClass}`}
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            New to OIT_STACK?{' '}
            <Link to="/register" className="text-blue-600 hover:underline font-medium">Create an account</Link>
          </p>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Login;
