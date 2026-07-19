import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import api from '../../../services/api';
import { MdArrowBack, MdSend, MdCheckCircle } from 'react-icons/md';

export default function PartnerAddLead() {
  const navigate = useNavigate();
  const { C, isDark } = useTheme();
  const S = makeS(C);
  const { t } = useTranslation();

  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [monthlySalary, setMonthlySalary] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [businessType, setBusinessType] = useState('Micro-Enterprise');
  const [processType, setProcessType] = useState('partner_cell');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products', { params: { is_active: 'true', limit: 100 } });
        if (res.data?.success && res.data?.data) {
          setProducts(res.data.data);
          if (res.data.data.length > 0) {
            setSelectedProductId(res.data.data[0].id);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch products:', err);
      }
    };
    fetchProducts();
  }, []);

  const handlePincodeChange = async (val) => {
    const clean = val.replace(/\D/g, '').slice(0, 6);
    setPincode(clean);
    if (clean.length === 6) {
      try {
        setPincodeLoading(true);
        const res = await api.get(`/location/pincode/${clean}`);
        if (res.data?.success && res.data?.data) {
          setCity(res.data.data.city || res.data.data.district || '');
          setStateName(res.data.data.state || '');
        }
      } catch (err) {
        console.warn('Pincode lookup error:', err);
      } finally {
        setPincodeLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!customerName.trim() || customerName.trim().length < 2) {
      newErrors.customerName = 'Full name must be at least 2 characters.';
    }
    if (!mobile.trim() || !/^[6-9]\d{9}$/.test(mobile.trim())) {
      newErrors.mobile = 'Please enter a valid 10-digit Indian mobile number.';
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!pincode.trim() || !/^\d{6}$/.test(pincode.trim())) {
      newErrors.pincode = 'Please enter a valid 6-digit postal pincode.';
    }
    if (!agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the terms and conditions.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        product_id: selectedProductId,
        full_name: customerName.trim(),
        country_code: countryCode,
        mobile: mobile.trim(),
        email: email.trim(),
        monthly_salary: monthlySalary ? parseFloat(monthlySalary) : 0,
        company_name: companyName.trim(),
        pincode: pincode.trim(),
        city: city.trim(),
        state: stateName.trim(),
        business_type: businessType,
        process_type: processType,
        agree_terms: agreeTerms,
        is_draft: false
      };

      const res = await api.post('/applications/partner-apply', payload);
      if (res.data?.success) {
        alert('Application lead logged successfully! Confirmation emails sent.');
        navigate('/partner/applications');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit application lead. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* HEADER BAR */}
      <div style={{
        background: C.card,
        borderRadius: '20px',
        padding: '20px 24px',
        border: `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: isDark ? C.bgSecondary : '#F1F5F9',
              border: `1px solid ${C.border}`,
              borderRadius: '10px',
              padding: '6px 12px',
              color: C.text,
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <MdArrowBack size={16} />
            Back
          </button>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Partner Portal
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: 900, color: C.text, margin: '2px 0 0' }}>
              Add Customer Lead / Application
            </h2>
          </div>
        </div>
      </div>

      {/* FORM CARD */}
      <div style={{
        background: C.card,
        borderRadius: '24px',
        padding: '24px',
        border: `1px solid ${C.border}`,
        boxShadow: isDark ? 'none' : '0 4px 20px rgba(15,23,42,0.04)'
      }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* PRODUCT SELECTION */}
          <div>
            <label style={S.label}>Select Product / Card *</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              style={{ ...S.input, height: '44px', fontSize: '14px', fontWeight: 700, color: C.primary }}
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.bank_name || p.bank_code || 'Bank'}) — Commission ₹{parseFloat(p.commission_value || 0).toLocaleString('en-IN')}
                </option>
              ))}
            </select>
          </div>

          {/* DEMOGRAPHICS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={S.label}>Customer Full Name *</label>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={customerName}
                onChange={(e) => { setCustomerName(e.target.value); setErrors(prev => ({ ...prev, customerName: null })); }}
                style={{ ...S.input, height: '42px', fontSize: '13px', borderColor: errors.customerName ? C.red : C.border }}
              />
              {errors.customerName && <span style={{ fontSize: '11px', color: C.red, marginTop: '2px', display: 'block' }}>{errors.customerName}</span>}
            </div>

            <div>
              <label style={S.label}>Contact Mobile Number *</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  style={{ ...S.input, width: '80px', height: '42px', fontSize: '12px', fontWeight: 700 }}
                >
                  <option value="+91">+91</option>
                  <option value="+1">+1</option>
                  <option value="+44">+44</option>
                </select>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  value={mobile}
                  onChange={(e) => { setMobile(e.target.value.replace(/\D/g, '')); setErrors(prev => ({ ...prev, mobile: null })); }}
                  style={{ ...S.input, flex: 1, height: '42px', fontSize: '13px', borderColor: errors.mobile ? C.red : C.border }}
                />
              </div>
              {errors.mobile && <span style={{ fontSize: '11px', color: C.red, marginTop: '2px', display: 'block' }}>{errors.mobile}</span>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={S.label}>Email Address *</label>
              <input
                type="email"
                placeholder="rahul@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: null })); }}
                style={{ ...S.input, height: '42px', fontSize: '13px', borderColor: errors.email ? C.red : C.border }}
              />
              {errors.email && <span style={{ fontSize: '11px', color: C.red, marginTop: '2px', display: 'block' }}>{errors.email}</span>}
            </div>

            <div>
              <label style={S.label}>Monthly Income / Salary (₹)</label>
              <input
                type="number"
                placeholder="e.g. 45000"
                value={monthlySalary}
                onChange={(e) => setMonthlySalary(e.target.value)}
                style={{ ...S.input, height: '42px', fontSize: '13px' }}
              />
            </div>
          </div>

          {/* LOCATION & COMPANY */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={S.label}>Company / Employer Name</label>
              <input
                type="text"
                placeholder="e.g. Infosys Ltd"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                style={{ ...S.input, height: '42px', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={S.label}>
                Pincode *
                {pincodeLoading && <span style={{ fontSize: '11px', color: C.primary, marginLeft: '6px' }}>Searching...</span>}
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="6-digit Pincode"
                value={pincode}
                onChange={(e) => handlePincodeChange(e.target.value)}
                style={{ ...S.input, height: '42px', fontSize: '13px', borderColor: errors.pincode ? C.red : C.border }}
              />
              {errors.pincode && <span style={{ fontSize: '11px', color: C.red, marginTop: '2px', display: 'block' }}>{errors.pincode}</span>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={S.label}>City</label>
              <input
                type="text"
                placeholder="Auto-filled City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={{ ...S.input, height: '42px', fontSize: '13px', background: C.bgSecondary }}
              />
            </div>

            <div>
              <label style={S.label}>State</label>
              <input
                type="text"
                placeholder="Auto-filled State"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                style={{ ...S.input, height: '42px', fontSize: '13px', background: C.bgSecondary }}
              />
            </div>
          </div>

          {/* PROCESS & CLASSIFICATION */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={S.label}>Business / Enterprise Type</label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                style={{ ...S.input, height: '42px', fontSize: '13px' }}
              >
                <option value="Micro-Enterprise">Micro-Enterprise</option>
                <option value="Small Business">Small Business</option>
                <option value="Mid-Size Enterprise">Mid-Size Enterprise</option>
                <option value="Large Corporation">Large Corporation</option>
                <option value="Startup">Startup</option>
              </select>
            </div>

            <div>
              <label style={S.label}>Process Assignment *</label>
              <select
                value={processType}
                onChange={(e) => setProcessType(e.target.value)}
                style={{ ...S.input, height: '42px', fontSize: '13px', fontWeight: 700, color: C.primary }}
              >
                <option value="partner_cell">1. Partner Cell Process</option>
                <option value="customer_sell">2. Customer Sell Process</option>
                <option value="punching_process">3. Punching Process</option>
              </select>
            </div>
          </div>

          {/* TERMS */}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', color: C.textMid, fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: C.primary, cursor: 'pointer' }}
              />
              <span>I confirm applicant details are accurate and agree to GharKaPaisa terms & conditions. *</span>
            </label>
            {errors.agreeTerms && <span style={{ fontSize: '11px', color: C.red, marginTop: '4px', display: 'block' }}>{errors.agreeTerms}</span>}
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '14px', borderRadius: '14px', border: 'none',
              background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
              color: '#FFFFFF', fontWeight: 800, fontSize: '15px', cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              boxShadow: `0 4px 16px ${C.primary}35`, marginTop: '8px'
            }}
          >
            <MdSend size={20} />
            <span>{submitting ? 'Submitting Application Lead...' : 'Submit Application Lead'}</span>
          </button>

        </form>
      </div>

    </div>
  );
}
