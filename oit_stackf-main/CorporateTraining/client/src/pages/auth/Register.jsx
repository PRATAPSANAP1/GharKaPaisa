import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Mail, Lock, Eye, EyeOff, UserPlus, User, Building2,
  GitBranch, Calendar, ArrowRight, ArrowLeft, CheckCircle2, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { register } from '../../store/slices/authSlice';

const InputField = ({ icon: Icon, label, name, type = 'text', placeholder, value, error, autoComplete, rightElement, inputRef, onChange }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
      {label}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Icon className={`w-5 h-5 ${error ? 'text-red-400' : 'text-slate-400 dark:text-slate-500'}`} />
      </div>
      <input
        ref={inputRef}
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full pl-12 ${rightElement ? 'pr-12' : 'pr-4'} py-3.5 rounded-xl border bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-200 ${
          error
            ? 'border-red-300 dark:border-red-500 focus:ring-red-500/20'
            : 'border-slate-300 dark:border-slate-600 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400'
        }`}
      />
      {rightElement}
    </div>
    {error && (
      <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
        <span className="inline-block w-1 h-1 bg-red-500 rounded-full" />
        {error}
      </p>
    )}
  </div>
);

const Register = () => {
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth || {});

  const [step, setStep] = useState(1); // Multi-step form: 1 = credentials, 2 = details
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    college: '',
    branch: '',
    year: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Minimum 6 characters required';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.college.trim()) newErrors.college = 'College name is required';
    if (!formData.branch.trim()) newErrors.branch = 'Branch is required';
    if (!formData.year) newErrors.year = 'Year is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    try {
      const result = await dispatch(register(formData)).unwrap();
      if (result?.token) {
        localStorage.setItem('token', result.token);
      }
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      const message = err?.message || err || 'Registration failed. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const branches = [
    'Computer Science & Engineering',
    'Information Technology',
    'Electronics & Communication',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Chemical Engineering',
    'Other',
  ];

  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

  return (
    <div className="h-[100dvh] flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Navbar */}
      <nav className="h-14 shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/60 flex items-center justify-between px-6 z-50 relative">
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

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel — Decorative */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#2e1065]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDJ2LTJoMzR6bTAtMzBWMkgydjJoMzR6TTIgMjBoMzR2Mkgydi0yem0wIDEyaDM0djJIMnYtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />

        {/* Floating orbs */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-cyan-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-pulse delay-1000" />

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-white w-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <img src="/logo.jpg" alt="OIT_STACK Logo" className="w-14 h-14 object-contain rounded-2xl border border-white/20 shadow-lg bg-white" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">OIT_STACK</h1>
              <p className="text-blue-200 text-sm">Your gateway to success</p>
            </div>
          </div>

          <h2 className="text-4xl xl:text-5xl font-extrabold leading-tight mb-6">
            Start Your
            <span className="block bg-gradient-to-r from-cyan-300 to-yellow-300 bg-clip-text text-transparent">
              Success Story
            </span>
          </h2>
          <p className="text-blue-100 text-lg mb-10 max-w-md leading-relaxed">
            Join thousands of students who are preparing smarter and landing their dream placements.
          </p>

          {/* Steps indicator */}
          <div className="space-y-4 max-w-sm">
            {[
              { num: 1, title: 'Create Account', desc: 'Set up your credentials' },
              { num: 2, title: 'Complete Profile', desc: 'Tell us about yourself' },
              { num: 3, title: 'Start Preparing', desc: 'Access all features' },
            ].map((s) => (
              <div key={s.num} className="flex items-center gap-4 group">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  step >= s.num
                    ? 'bg-white text-blue-600 shadow-lg'
                    : 'bg-white/20 text-white/60 border border-white/20'
                }`}>
                  {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
                </div>
                <div>
                  <p className={`font-semibold text-sm ${step >= s.num ? 'text-white' : 'text-white/50'}`}>{s.title}</p>
                  <p className={`text-xs ${step >= s.num ? 'text-blue-200' : 'text-white/30'}`}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="flex gap-8 mt-14">
            {[
              { value: '5000+', label: 'Students' },
              { value: '200+', label: 'Companies' },
              { value: '95%', label: 'Placement Rate' },
            ].map((stat, i) => (
              <div key={i}>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-blue-200 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Register Form */}
      <div className="w-full lg:w-1/2 xl:w-[45%] flex items-center justify-center p-6 sm:p-8 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md">

          {/* Step Indicator - Mobile */}
          <div className="flex items-center justify-center gap-3 mb-8 lg:hidden">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step >= s
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}>
                  {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                </div>
                {s < 2 && (
                  <div className={`w-12 h-0.5 ${step > 1 ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Form Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {step === 1 ? 'Create Account' : 'Complete Profile'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              {step === 1
                ? 'Enter your credentials to get started'
                : 'Tell us a bit about your academic background'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {step === 1 ? (
              <>
                <InputField
                  icon={User}
                  label="Full Name"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  error={errors.name}
                  autoComplete="name"
                  onChange={handleChange}
                />
                <InputField
                  icon={Mail}
                  label="Email Address"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  error={errors.email}
                  autoComplete="email"
                  onChange={handleChange}
                />
                <InputField
                  icon={Lock}
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  error={errors.password}
                  autoComplete="new-password"
                  inputRef={passwordRef}
                  onChange={handleChange}
                  rightElement={
                    <button
                      type="button"
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => {
                        setShowPassword(!showPassword);
                        setTimeout(() => {
                          passwordRef.current?.focus();
                        }, 0);
                      }}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  }
                />
                <InputField
                  icon={Lock}
                  label="Confirm Password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  error={errors.confirmPassword}
                  autoComplete="new-password"
                  inputRef={confirmPasswordRef}
                  onChange={handleChange}
                  rightElement={
                    <button
                      type="button"
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => {
                        setShowConfirmPassword(!showConfirmPassword);
                        setTimeout(() => {
                          confirmPasswordRef.current?.focus();
                        }, 0);
                      }}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  }
                />

                {/* Password strength indicator */}
                {formData.password && (
                  <div className="space-y-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => {
                        const strength = formData.password.length >= 12 ? 4
                          : formData.password.length >= 8 ? 3
                          : formData.password.length >= 6 ? 2 : 1;
                        return (
                          <div
                            key={level}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${
                              level <= strength
                                ? strength <= 1 ? 'bg-red-500'
                                : strength <= 2 ? 'bg-orange-500'
                                : strength <= 3 ? 'bg-yellow-500'
                                : 'bg-green-500'
                                : 'bg-slate-200 dark:bg-slate-700'
                            }`}
                          />
                        );
                      })}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formData.password.length < 6 ? 'Too short' :
                       formData.password.length < 8 ? 'Fair' :
                       formData.password.length < 12 ? 'Good' : 'Strong'} password
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </>
            ) : (
              <>
                {/* College */}
                <div>
                  <label htmlFor="college" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    College Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Building2 className={`w-5 h-5 ${errors.college ? 'text-red-400' : 'text-slate-400'}`} />
                    </div>
                    <input
                      id="college"
                      name="college"
                      value={formData.college}
                      onChange={handleChange}
                      placeholder="e.g. OIT_STACK"
                      className={`w-full pl-12 pr-4 py-3.5 rounded-xl border bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                        errors.college ? 'border-red-300 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500/20 focus:border-blue-500'
                      }`}
                    />
                  </div>
                  {errors.college && <p className="mt-1.5 text-sm text-red-500">{errors.college}</p>}
                </div>

                {/* Branch */}
                <div>
                  <label htmlFor="branch" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Branch / Department
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <GitBranch className={`w-5 h-5 ${errors.branch ? 'text-red-400' : 'text-slate-400'}`} />
                    </div>
                    <select
                      id="branch"
                      name="branch"
                      value={formData.branch}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-3.5 rounded-xl border bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 transition-all appearance-none ${
                        errors.branch ? 'border-red-300 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500/20 focus:border-blue-500'
                      }`}
                    >
                      <option value="">Select Branch</option>
                      {branches.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  {errors.branch && <p className="mt-1.5 text-sm text-red-500">{errors.branch}</p>}
                </div>

                {/* Year */}
                <div>
                  <label htmlFor="year" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Current Year
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Calendar className={`w-5 h-5 ${errors.year ? 'text-red-400' : 'text-slate-400'}`} />
                    </div>
                    <select
                      id="year"
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-3.5 rounded-xl border bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 transition-all appearance-none ${
                        errors.year ? 'border-red-300 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500/20 focus:border-blue-500'
                      }`}
                    >
                      <option value="">Select Year</option>
                      {years.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  {errors.year && <p className="mt-1.5 text-sm text-red-500">{errors.year}</p>}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-3.5 px-6 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:border-blue-500 hover:text-blue-600 focus:outline-none transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back</span>
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" />
                        <span>Create Account</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </form>

          {/* Login link */}
          <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Register;

