import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import LanguageSwitcher from '../../../components/LanguageSwitcher/LanguageSwitcher';
import { registerPartner, sendRegistrationOtp, verifyRegistrationOtp } from '../../../services/auth.api';

const COMPANY_TYPES = [
  ['individual', 'Individual'], ['proprietorship', 'Proprietorship'], ['partnership', 'Partnership'], ['pvt_ltd', 'Private Limited Company'], ['llp', 'LLP'], ['other', 'Other']
];

const initialForm = {
  first_name: '', last_name: '', email: '', mobile: '', aadhaar: '', password: '', confirmPassword: '',
  company_name: '', company_type: 'individual', current_address: '', business_location: '', pincode: '', gst_number: '',
  bank_name: '', account_number: '', ifsc_code: '', account_holder_name: '', pan: ''
};

const Input = ({ label, required = false, error, ...props }) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 700 }}>
    <span>{label}{required && ' *'}</span>
    <input {...props} style={{ padding: '11px 12px', borderRadius: 10, border: `1px solid ${error ? '#DC2626' : '#CBD5E1'}`, fontSize: 14, ...props.style }} />
    {error && <small style={{ color: '#DC2626', fontWeight: 600 }}>{error}</small>}
  </label>
);

export default function PartnerRegister() {
  const navigate = useNavigate();
  const { C } = useTheme();
  const S = makeS(C);
  const referralCode = useMemo(() => new URLSearchParams(window.location.search).get('ref') || '', []);
  const [form, setForm] = useState(initialForm);
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const update = (event) => {
    const { name, value } = event.target;
    setForm(current => ({ ...current, [name]: value }));
    setFieldErrors(current => ({ ...current, [name]: undefined }));
    if (name === 'email') setEmailVerified(false);
  };

  const sendEmailCode = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError('Enter a valid email address first.');
    setOtpLoading(true); setError(''); setMessage('');
    try {
      await sendRegistrationOtp(form.email);
      setEmailOtpSent(true);
      setMessage('A verification code has been sent to your email.');
    } catch (err) { setError(err.message); }
    finally { setOtpLoading(false); }
  };

  const verifyEmailCode = async () => {
    if (emailOtp.length !== 6) return setError('Enter the 6-digit email verification code.');
    setOtpLoading(true); setError('');
    try {
      await verifyRegistrationOtp(form.email, emailOtp);
      setEmailVerified(true);
      setMessage('Email verified. You can submit your registration.');
    } catch (err) { setError(err.message); }
    finally { setOtpLoading(false); }
  };

  const submit = async (event) => {
    event.preventDefault();
    setError(''); setMessage(''); setFieldErrors({});
    if (form.password.length < 8) return setError('Password must contain at least 8 characters.');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    if (!emailVerified) return setError('Verify your email before submitting registration.');
    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      await registerPartner({ ...payload, password: form.password, referral_code: referralCode || undefined });
      navigate('/login', { replace: true, state: { registered: true, email: form.email } });
    } catch (err) {
      const errors = err.response?.data?.errors || [];
      setFieldErrors(Object.fromEntries(errors.map(item => [item.field, item.message])));
      setError(err.message || 'Registration could not be completed.');
    } finally { setLoading(false); }
  };

  const sectionStyle = { ...S.card, padding: 20, borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 14 };
  const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 };

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, padding: '32px 16px', boxSizing: 'border-box' }}>
      <form onSubmit={submit} style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26 }}>Partner Registration</h1>
            <p style={{ margin: '6px 0 0', color: C.textMid }}>Enter your details to create a partner account.</p>
          </div>
          <LanguageSwitcher />
        </header>

        {error && <div role="alert" style={{ padding: 12, borderRadius: 10, background: '#FEE2E2', color: '#B91C1C', fontWeight: 600 }}>{error}</div>}
        {message && <div style={{ padding: 12, borderRadius: 10, background: '#DCFCE7', color: '#166534', fontWeight: 600 }}>{message}</div>}

        <section style={sectionStyle}>
          <h2 style={{ fontSize: 18, margin: 0 }}>Account details</h2>
          <div style={gridStyle}>
            <Input label="First name" required name="first_name" value={form.first_name} onChange={update} error={fieldErrors.first_name} />
            <Input label="Last name" required name="last_name" value={form.last_name} onChange={update} error={fieldErrors.last_name} />
            <Input label="Mobile number" required name="mobile" inputMode="numeric" maxLength={10} value={form.mobile} onChange={update} error={fieldErrors.mobile} />
            <Input label="Aadhaar number" required name="aadhaar" inputMode="numeric" maxLength={12} value={form.aadhaar} onChange={update} error={fieldErrors.aadhaar} />
            <Input label="Email address" required name="email" type="email" value={form.email} onChange={update} error={fieldErrors.email} />
            <div style={{ display: 'flex', gap: 8, alignItems: 'end' }}>
              <button type="button" onClick={sendEmailCode} disabled={otpLoading || emailVerified} style={{ ...S.btn('outline'), height: 42, flex: 1 }}>{emailVerified ? 'Email verified' : emailOtpSent ? 'Resend code' : 'Verify email'}</button>
              {emailOtpSent && !emailVerified && <Input label="Code" inputMode="numeric" maxLength={6} value={emailOtp} onChange={event => setEmailOtp(event.target.value.replace(/\D/g, ''))} style={{ width: 104 }} />}
              {emailOtpSent && !emailVerified && <button type="button" onClick={verifyEmailCode} disabled={otpLoading} style={{ ...S.btn('primary'), height: 42 }}>Confirm</button>}
            </div>
            <Input label="Password" required name="password" type="password" value={form.password} onChange={update} error={fieldErrors.password} />
            <Input label="Confirm password" required name="confirmPassword" type="password" value={form.confirmPassword} onChange={update} />
          </div>
        </section>

        <section style={sectionStyle}>
          <h2 style={{ fontSize: 18, margin: 0 }}>Business details</h2>
          <div style={gridStyle}>
            <Input label="Company name" required name="company_name" value={form.company_name} onChange={update} error={fieldErrors.company_name} />
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 700 }}>Company type *
              <select name="company_type" value={form.company_type} onChange={update} style={{ padding: '11px 12px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 14 }}>{COMPANY_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            </label>
            <Input label="Business location" required name="business_location" value={form.business_location} onChange={update} error={fieldErrors.business_location} />
            <Input label="Pincode" required name="pincode" inputMode="numeric" maxLength={6} value={form.pincode} onChange={update} error={fieldErrors.pincode} />
            <Input label="GST number" name="gst_number" value={form.gst_number} onChange={update} error={fieldErrors.gst_number} />
            <Input label="Business address" required name="current_address" value={form.current_address} onChange={update} error={fieldErrors.current_address} />
          </div>
        </section>

        <section style={sectionStyle}>
          <h2 style={{ fontSize: 18, margin: 0 }}>Settlement bank details</h2>
          <div style={gridStyle}>
            <Input label="Bank name" required name="bank_name" value={form.bank_name} onChange={update} error={fieldErrors.bank_name} />
            <Input label="Account holder name" required name="account_holder_name" value={form.account_holder_name} onChange={update} error={fieldErrors.account_holder_name} />
            <Input label="Account number" required name="account_number" inputMode="numeric" value={form.account_number} onChange={update} error={fieldErrors.account_number} />
            <Input label="IFSC code" required name="ifsc_code" value={form.ifsc_code} onChange={event => update({ ...event, target: { ...event.target, value: event.target.value.toUpperCase() } })} error={fieldErrors.ifsc_code} />
            <Input label="PAN number" required name="pan" value={form.pan} onChange={event => update({ ...event, target: { ...event.target, value: event.target.value.toUpperCase() } })} error={fieldErrors.pan} />
          </div>
        </section>

        <button type="submit" disabled={loading} style={{ ...S.btn('primary'), alignSelf: 'center', minWidth: 220, padding: '13px 22px', borderRadius: 10 }}>{loading ? 'Creating account…' : 'Create partner account'}</button>
        <button type="button" onClick={() => navigate('/login')} style={{ ...S.btn('outline'), alignSelf: 'center', border: 'none', color: C.textMid }}>Already registered? Sign in</button>
      </form>
    </main>
  );
}
