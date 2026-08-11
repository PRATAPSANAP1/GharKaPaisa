import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import api from '../../../services/api';
import { MdArrowBack, MdSend, MdContentCopy, MdShare, MdOpenInNew, MdCheckCircle, MdAssignment, MdLink, MdAccountBalance } from 'react-icons/md';

const PROCESS_OPTIONS = [
  {
    id: 'lead_punching',
    title: 'Lead Punching Only',
    badge: '1. Lead Punching',
    icon: <MdAssignment size={24} />,
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    darkBgColor: '#1E293B',
    description: 'Record lead directly into Partner CRM & Applications queue for internal processing.'
  },
  {
    id: 'linked_share',
    title: 'Linked Share',
    badge: '2. Tracked WhatsApp Share',
    icon: <MdLink size={24} />,
    color: '#10B981',
    bgColor: '#ECFDF5',
    darkBgColor: '#064E3B',
    description: 'Generates a tracked application link and opens WhatsApp to send directly to customer.'
  },
  {
    id: 'direct_bank',
    title: 'Direct Bank Process',
    badge: '3. Direct Bank Portal',
    icon: <MdAccountBalance size={24} />,
    color: '#8B5CF6',
    bgColor: '#F5F3FF',
    darkBgColor: '#2E1065',
    description: 'Immediately opens official bank portal in a new tab for instant application completion.'
  }
];

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
  const [processType, setProcessType] = useState('lead_punching');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Workflow result state
  const [shareResult, setShareResult] = useState(null);
  const [copied, setCopied] = useState(false);

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

    if (!selectedProductId) {
      newErrors.selectedProductId = 'Please select a product/card.';
    }
    if (!customerName.trim() || customerName.trim().length < 2) {
      newErrors.customerName = 'Full name must be at least 2 characters.';
    }
    if (!mobile.trim() || !/^[6-9]\d{9}$/.test(mobile.trim())) {
      newErrors.mobile = 'Please enter a valid 10-digit Indian mobile number.';
    }
    
    // Additional validations for Lead Punching process
    if (processType === 'lead_punching') {
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        newErrors.email = 'Please enter a valid email address.';
      }
      if (!pincode.trim() || !/^\d{6}$/.test(pincode.trim())) {
        newErrors.pincode = 'Please enter a valid 6-digit postal pincode.';
      }
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
        const data = res.data.data;
        
        if (processType === 'linked_share') {
          setShareResult(data);
          if (data?.whatsapp_url) {
            window.open(data.whatsapp_url, '_blank');
          }
        } else if (processType === 'direct_bank') {
          if (data?.bank_url) {
            window.open(data.bank_url, '_blank');
          }
          alert(`Application APP#${data?.app_number || ''} logged! Official Bank portal opened in a new tab.`);
          navigate('/partner/applications');
        } else {
          alert('Lead / Application logged successfully! Confirmation email sent.');
          navigate('/partner/applications');
        }
      }
    } catch (err) {
      if (err.response?.status === 409) {
        alert(err.response?.data?.message || 'Duplicate application detected within 30 days.');
      } else {
        alert(err.response?.data?.message || 'Failed to submit application lead. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', paddingBottom: '40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
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

      {/* SUCCESS SHARE MODAL FOR LINKED SHARE */}
      {shareResult && (
        <div style={{
          background: isDark ? '#064E3B' : '#ECFDF5',
          border: '1px solid #10B981',
          borderRadius: '20px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#10B981' }}>
            <MdCheckCircle size={28} />
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: isDark ? '#6EE7B7' : '#065F46' }}>
                Tracked Share Link Generated!
              </h3>
              <p style={{ fontSize: '13px', margin: '2px 0 0', color: isDark ? '#A7F3D0' : '#047857' }}>
                Application #{shareResult.app_number} logged. Share this tracked link with {customerName}:
              </p>
            </div>
          </div>

          <div style={{
            background: isDark ? '#022C22' : '#FFFFFF',
            padding: '12px 16px',
            borderRadius: '12px',
            border: `1px solid ${isDark ? '#059669' : '#A7F3D0'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <span style={{ fontSize: '13px', fontWeight: 700, wordBreak: 'break-all', color: isDark ? '#E6F4EA' : '#0F172A' }}>
              {shareResult.share_url}
            </span>
            <button
              onClick={() => copyToClipboard(shareResult.share_url)}
              style={{
                background: '#10B981',
                color: '#FFF',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap'
              }}
            >
              <MdContentCopy size={16} />
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {shareResult.whatsapp_url && (
              <a
                href={shareResult.whatsapp_url}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: '#25D366',
                  color: '#FFF',
                  textDecoration: 'none',
                  borderRadius: '10px',
                  padding: '10px 18px',
                  fontSize: '13px',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <MdShare size={18} />
                Open WhatsApp & Send
              </a>
            )}
            <button
              onClick={() => navigate('/partner/applications')}
              style={{
                background: isDark ? C.bgSecondary : '#FFF',
                color: C.text,
                border: `1px solid ${C.border}`,
                borderRadius: '10px',
                padding: '10px 18px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Go to Applications
            </button>
          </div>
        </div>
      )}

      {/* FORM CARD */}
      <div style={{
        background: C.card,
        borderRadius: '24px',
        padding: '24px',
        border: `1px solid ${C.border}`,
        boxShadow: isDark ? 'none' : '0 4px 20px rgba(15,23,42,0.04)'
      }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          
          {/* PROCESS ASSIGNMENT - 3 CARDS SELECTION */}
          <div>
            <label style={{ ...S.label, marginBottom: '10px', display: 'block' }}>Select Process Workflow *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '14px' }}>
              {PROCESS_OPTIONS.map((opt) => {
                const isSelected = processType === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => setProcessType(opt.id)}
                    style={{
                      border: `2px solid ${isSelected ? opt.color : C.border}`,
                      borderRadius: '16px',
                      padding: '16px',
                      background: isSelected 
                        ? (isDark ? opt.darkBgColor : opt.bgColor)
                        : (isDark ? C.bgSecondary : '#FAFAFA'),
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: isSelected ? opt.color : (isDark ? '#334155' : '#E2E8F0'),
                        color: isSelected ? '#FFFFFF' : C.textMid,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {opt.icon}
                      </div>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: isSelected ? opt.color : C.border,
                        color: isSelected ? '#FFFFFF' : C.textMid
                      }}>
                        {opt.badge}
                      </span>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 800, color: C.text, margin: '0 0 4px' }}>
                        {opt.title}
                      </h4>
                      <p style={{ fontSize: '12px', color: C.textMid, margin: 0, lineHeight: '1.4' }}>
                        {opt.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PRODUCT SELECTION */}
          <div>
            <label style={S.label}>Select Product / Card *</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              style={{ ...S.input, height: '46px', fontSize: '14px', fontWeight: 700, color: C.primary }}
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

          {/* ADDITIONAL FIELDS FOR LEAD PUNCHING */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={S.label}>Email Address {processType === 'lead_punching' ? '*' : '(Optional)'}</label>
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

          {/* LOCATION & COMPANY DETAILS */}
          {processType === 'lead_punching' && (
            <>
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
            </>
          )}

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
            <span>
              {submitting 
                ? 'Processing Workflow...' 
                : (processType === 'linked_share' 
                    ? 'Generate & Open Tracked WhatsApp Share' 
                    : (processType === 'direct_bank' ? 'Log & Open Official Bank Portal' : 'Submit Lead Application'))
              }
            </span>
          </button>

        </form>
      </div>

    </div>
  );
}
