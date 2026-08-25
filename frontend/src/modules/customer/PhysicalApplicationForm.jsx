import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import logo from '../../assets/logos/logo.png';
import { useTheme, LightDarkToggle } from '../../contexts/ThemeContext';
import LanguageSwitcher from '../../components/LanguageSwitcher/LanguageSwitcher';
import { useAuthStore } from '../../app/store/authStore';
import { 
  MdCheckCircle, MdError, MdLock, MdCloudUpload, 
  MdNavigateNext, MdNavigateBefore, MdSave, MdRefresh 
} from 'react-icons/md';

// Multi-language Translation Dictionary for Physical Application Form
const DICTIONARY = {
  en: {
    portalTitle: 'Physical Verification Portal',
    headerSub: 'Physical Application Verification',
    appNo: 'Application #',
    bank: 'Bank Partner',
    product: 'Product',
    customerDetails: 'Form 1: Customer Details',
    appcodeVkyc: 'Form 2 (Part 1): Appcode & VKYC',
    iqaDispatch: 'Form 2 (Part 2): IQA & Dispatch',
    bankFinalStatus: 'Part 3: Bank & Final Status',
    step1Short: 'Customer Info',
    step2Short: 'Appcode & VKYC',
    step3Short: 'IQA & Dispatch',
    step4Short: 'Bank & Final',
    aadhaarMobile: 'AADHAAR LINKED CONTACT NUMBER *',
    aadhaarMobilePlace: '10-digit mobile number',
    dob: 'AS PER PAN CARD DOB (DD-MM-YYYY)',
    dobPlace: 'DD-MM-YYYY',
    panName: 'NAME AS PER PAN CARD *',
    panNamePlace: 'Full Name as on PAN',
    email: 'PERSONAL EMAIL ID',
    emailPlace: 'email@example.com',
    panNumber: 'PAN CARD NUMBER *',
    panNumberPlace: 'ABCDE1234F',
    companyName: 'COMPANY NAME (AS PER SALARY SLIP)',
    companyNamePlace: 'Company Name',
    designation: 'DESIGNATION',
    designationPlace: 'Designation / Job Role',
    homeAddress: 'CURRENT HOME ADDRESS (WITH LANDMARK & PINCODE)',
    homeAddressPlace: 'Flat No, Building, Street, Landmark, Pincode',
    companyAddress: 'FULL OFFICIAL COMPANY ADDRESS',
    companyAddressPlace: 'Company / Office Address with Pincode',
    motherName: 'MOTHER NAME',
    motherNamePlace: 'Mother Name',
    appNumberBank: 'BANK APPLICATION NUMBER',
    appNumberBankPlace: 'Bank Application Reference Number',
    vkycUrl: 'VKYC LINK',
    vkycUrlPlace: 'https://vkyc...',
    appcodeStatus: 'APPCODE STATUS',
    softApprovalStatus: 'SOFT APPROVAL STATUS',
    vkycStage: 'VKYC STAGE',
    iqaStage: 'IQA STAGE',
    dispatchStatus: 'DISPATCH STATUS',
    eligibleReqd: 'ELIGIBLE FOR RE-QD',
    finalStatus: 'FINAL STATUS FROM BANK',
    bankRemark: 'BANK REMARK',
    bankRemarkPlace: 'Operations Head or Bank remark...',
    declineReason: 'DECLINE REASON REMARK',
    declineReasonPlace: 'Specify detailed decline reason...',
    nextStep: 'Next Step',
    backStep: 'Back',
    saveDetails: 'SAVE DETAILS 💾',
    savingDetails: 'Saving Details...',
    formSavedSuccess: 'Application details & Form status saved successfully!',
    successSub: 'Application details updated in database.',
    retry: 'Retry Loading Form',
    loading: 'Loading Physical Application Form...',
    errTitle: 'Application Form Error',
    yes: 'Yes',
    no: 'No'
  },
  hi: {
    portalTitle: 'भौतिक सत्यापन पोर्टल',
    headerSub: 'भौतिक आवेदन सत्यापन',
    appNo: 'आवेदन संख्या #',
    bank: 'बैंक पार्टनर',
    product: 'उत्पाद',
    customerDetails: 'फॉर्म 1: ग्राहक विवरण',
    appcodeVkyc: 'फॉर्म 2 (भाग 1): ऐपकोड और वीकेवाईसी',
    iqaDispatch: 'फॉर्म 2 (भाग 2): आईक्यूए और प्रेषण',
    bankFinalStatus: 'भाग 3: बैंक एवं अंतिम स्थिति',
    step1Short: 'ग्राहक जानकारी',
    step2Short: 'ऐपकोड एवं VKYC',
    step3Short: 'IQA एवं प्रेषण',
    step4Short: 'बैंक एवं अंतिम स्थिति',
    aadhaarMobile: 'आधार से जुड़ा मोबाइल नंबर *',
    aadhaarMobilePlace: '10 अंकों का मोबाइल नंबर',
    dob: 'पैन कार्ड के अनुसार जन्म तिथि (DD-MM-YYYY)',
    dobPlace: 'DD-MM-YYYY',
    panName: 'पैन कार्ड के अनुसार पूरा नाम *',
    panNamePlace: 'पैन कार्ड का नाम',
    email: 'व्यक्तिगत ईमेल आईडी',
    emailPlace: 'email@example.com',
    panNumber: 'पैन कार्ड नंबर *',
    panNumberPlace: 'ABCDE1234F',
    companyName: 'कंपनी का नाम (वेतन पर्ची के अनुसार)',
    companyNamePlace: 'कंपनी का नाम',
    designation: 'पदनाम / पद',
    designationPlace: 'पदनाम / भूमिका',
    homeAddress: 'वर्तमान घर का पता (लैंडमार्क और पिनकोड के साथ)',
    homeAddressPlace: 'मकान नं., बिल्डिंग, सड़क, लैंडमार्क, पिनकोड',
    companyAddress: 'कंपनी का पूरा आधिकारिक पता',
    companyAddressPlace: 'पिनकोड के साथ कार्यालय का पता',
    motherName: 'माता का नाम',
    motherNamePlace: 'माता का नाम',
    appNumberBank: 'बैंक आवेदन संख्या',
    appNumberBankPlace: 'बैंक संदर्भ संख्या',
    vkycUrl: 'वीकेवाईसी लिंक',
    vkycUrlPlace: 'https://vkyc...',
    appcodeStatus: 'ऐपकोड स्थिति',
    softApprovalStatus: 'सॉफ्ट अनुमोदन स्थिति',
    vkycStage: 'वीकेवाईसी चरण',
    iqaStage: 'आईक्यूए चरण',
    dispatchStatus: 'प्रेषण (Dispatch) स्थिति',
    eligibleReqd: 'पुनः पात्रता (RE-QD) योग्य',
    finalStatus: 'बैंक से अंतिम स्थिति',
    bankRemark: 'बैंक टिप्पणी (ऑपरेशन्स / एडमिन)',
    bankRemarkPlace: 'ऑपरेशन्स हेड या बैंक टिप्पणी...',
    declineReason: 'अस्वीकृति का कारण',
    declineReasonPlace: 'अस्वीकृति का विस्तृत कारण लिखें...',
    nextStep: 'अगला चरण',
    backStep: 'पीछे',
    saveDetails: 'विवरण सहेजें 💾',
    savingDetails: 'सहेजा जा रहा है...',
    formSavedSuccess: 'आवेदन विवरण सफलतापूर्वक सहेजा गया!',
    successSub: 'आवेदन विवरण डेटाबेस में अद्यतन हो गया है।',
    retry: 'पुनः प्रयास करें',
    loading: 'भौतिक आवेदन फॉर्म लोड हो रहा है...',
    errTitle: 'आवेदन फॉर्म त्रुटि',
    yes: 'हाँ',
    no: 'नहीं'
  }
};

export default function PhysicalApplicationForm() {
  const { token } = useParams();
  const { i18n } = useTranslation();
  const { C, isDark } = useTheme();

  const currentLang = i18n.language === 'hi' ? 'hi' : 'en';
  const txt = (key) => DICTIONARY[currentLang]?.[key] || DICTIONARY.en[key] || key;

  const user = useAuthStore(state => state.user);
  const userRole = (user?.role || '').toUpperCase();
  const isOperationsOrAdmin = ['ADMIN', 'SUPER_ADMIN', 'OPERATIONS', 'OPERATIONS_HEAD', 'ADMINISTRATIVE_OPERATOR', 'ADMIN_OPERATOR', 'OPERATOR'].includes(userRole);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [appData, setAppData] = useState(null);
  const [activeTab, setActiveTab] = useState('step1'); // 'step1' | 'step2' | 'step3' | 'step4'

  // Responsive state for screen layout
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Form states
  const [form, setForm] = useState({
    aadhaar_linked_mobile: '',
    pan_name: '',
    dob: '',
    pan_number: '',
    mother_name: '',
    personal_email: '',
    company_name: '',
    designation: '',
    flat_no: '',
    city: '',
    state: '',
    sub_area: '',
    landmark: '',
    pincode: '',
    company_address: '',
    bank_ref_number: '',
    vkyc_url: '',
    appcode_status: 'Appcode Pending',
    soft_approval_status: 'Approval-income 25k',
    vkyc_stage: 'VKYC Pending',
    iqa_stage: 'IQA Pending',
    dispatch_status: 'E-sign Pending',
    eligible_reqd: 'No',
    final_status: 'In Process',
    bank_remark: '',
    decline_reason: ''
  });

  const bankNameStr = String(appData?.bank_name || appData?.bank?.name || appData?.product_name || appData?.product?.name || appData?.application?.bank_name || '').toLowerCase();
  const isSbi = bankNameStr.includes('sbi');
  const processTypeStr = String(appData?.process_type || appData?.process_by || appData?.application?.process_type || appData?.application?.process_by || '').toLowerCase();
  const isPunchLead = processTypeStr.includes('punch') || processTypeStr.includes('lead_punching') || processTypeStr.includes('punching');
  const isDigitalProcess = processTypeStr.includes('linked') || processTypeStr.includes('share') || processTypeStr.includes('direct') || processTypeStr.includes('link');

  useEffect(() => {
    fetchApplicationDetails();
  }, [token]);

  const fetchApplicationDetails = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get(`/applications/physical-application/${token}`);
      if (res.data?.success) {
        const data = res.data.data;
        setAppData(data);

        const formatDobStr = (raw) => {
          if (!raw) return '';
          if (typeof raw === 'string' && raw.includes('T')) {
            try {
              const d = new Date(raw);
              if (!isNaN(d.getTime())) {
                const day = String(d.getDate()).padStart(2, '0');
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const year = d.getFullYear();
                return `${day}-${month}-${year}`;
              }
            } catch (e) {}
          }
          return raw;
        };

        const pd = data.physical_details || data || {};
        const cust = data.customer || data || {};
        const app = data.application || data || {};

        setForm({
          aadhaar_linked_mobile: pd.aadhaar_linked_mobile || cust.mobile || app.customer_mobile || '',
          pan_name: pd.pan_name || cust.full_name || app.customer_name || '',
          dob: formatDobStr(pd.dob || cust.dob || app.dob || ''),
          pan_number: pd.pan_number || cust.pan_number || app.pan_number || '',
          mother_name: pd.mother_name || app.mother_name || '',
          personal_email: pd.personal_email || cust.email || app.customer_email || '',
          company_name: pd.company_name || app.company_name || '',
          designation: pd.designation || app.designation || '',
          flat_no: pd.flat_no || app.address || '',
          city: pd.city || app.city || cust.city || '',
          state: pd.state || app.state || cust.state || '',
          sub_area: pd.sub_area || '',
          landmark: pd.landmark || '',
          pincode: pd.pincode || app.pincode || cust.pincode || '',
          company_address: pd.company_address || app.company_address || '',
          bank_ref_number: pd.bank_ref_number || app.bank_ref_number || app.bank_application_number || '',
          vkyc_url: app.vkyc_url || '',
          appcode_status: app.appcode_status || 'Appcode Pending',
          soft_approval_status: app.soft_approval_status || 'Approval-income 25k',
          vkyc_stage: app.vkyc_stage || 'VKYC Pending',
          iqa_stage: app.iqa_stage || 'IQA Pending',
          dispatch_status: app.dispatch_status || 'E-sign Pending',
          eligible_reqd: app.eligible_reqd || 'No',
          final_status: app.final_status || 'In Process',
          bank_remark: app.bank_remark || '',
          decline_reason: app.decline_reason || ''
        });

        const procType = String(app.process_type || app.process_by || data.process_type || '').toLowerCase();
        if (procType.includes('linked') || procType.includes('share') || procType.includes('direct')) {
          setActiveTab('step2');
        }
      } else {
        setErrorMsg(res.data?.message || 'Unable to load application details.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Invalid or expired physical application link.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await api.post(`/applications/physical-application/${token}/submit`, form);
      if (res.data?.success) {
        setSubmitted(true);
      } else {
        setErrorMsg(res.data?.message || 'Failed to submit application details.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Submission failed. Please check your inputs and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDobInput = (val) => {
    if (!val) return '';
    const cleaned = val.replace(/\D/g, '').slice(0, 8);
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 4) return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 4)}-${cleaned.slice(4, 8)}`;
  };

  const handleChange = (field, val) => {
    setForm(prev => ({ ...prev, [field]: field === 'dob' ? formatDobInput(val) : val }));
  };

  // Modern input styles using Theme Context C
  const inputStyle = {
    width: '100%',
    padding: isMobile ? '12px 14px' : '14px 16px',
    borderRadius: '12px',
    border: `1.5px solid ${C.border}`,
    background: C.inputBg,
    color: C.text,
    fontSize: isMobile ? '13px' : '14px',
    fontWeight: '600',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    fontFamily: "'Inter', sans-serif"
  };

  const labelStyle = {
    display: 'block',
    fontSize: '11.5px',
    fontWeight: '800',
    color: C.textMid,
    marginBottom: '6px',
    letterSpacing: '0.04em',
    textTransform: 'uppercase'
  };

  // Loading Screen
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg, color: C.text, fontFamily: "'Inter', sans-serif" }}>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <div style={{ width: 48, height: 48, border: `4px solid ${C.teal}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ fontWeight: 800, fontSize: 15, color: C.text }}>{txt('loading')}</p>
        </div>
      </div>
    );
  }

  // Error Screen
  if (errorMsg && !appData) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg, color: C.text, padding: 20, fontFamily: "'Inter', sans-serif" }}>
        <div style={{ maxWidth: 480, width: '100%', background: C.card, borderRadius: 24, padding: isMobile ? 24 : 36, border: `1px solid ${C.border}`, textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
          <MdError size={56} color={C.red} style={{ marginBottom: 12 }} />
          <h2 style={{ margin: '0 0 10px', fontSize: 20, fontWeight: 900, color: C.red }}>{txt('errTitle')}</h2>
          <p style={{ fontSize: 13.5, color: C.textMid, margin: '0 0 24px', lineHeight: 1.6 }}>{errorMsg}</p>
          <button 
            onClick={fetchApplicationDetails} 
            style={{ 
              padding: '12px 28px', 
              borderRadius: 14, 
              border: 'none', 
              background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`, 
              color: '#fff', 
              fontWeight: 800, 
              fontSize: 14, 
              cursor: 'pointer', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: 8,
              boxShadow: `0 6px 18px ${C.primary}40` 
            }}
          >
            <MdRefresh size={18} /> {txt('retry')}
          </button>
        </div>
      </div>
    );
  }

  // Success Screen
  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg, color: C.text, padding: 20, fontFamily: "'Inter', sans-serif" }}>
        <div style={{ maxWidth: 520, width: '100%', background: C.card, borderRadius: 28, padding: isMobile ? 24 : 36, border: `1px solid ${C.border}`, textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,0.25)' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', border: `2px solid #10b981`, color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <MdCheckCircle size={44} />
          </div>
          <h2 style={{ margin: '0 0 10px', fontSize: 20, fontWeight: 900, color: C.text }}>{txt('formSavedSuccess')}</h2>
          <p style={{ fontSize: 13.5, color: C.textMid, margin: '0 0 24px', lineHeight: 1.6 }}>
            {txt('appNo')} <strong style={{ color: C.teal }}>#{appData?.app_number}</strong> {txt('successSub')}
          </p>

          <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, padding: 20, borderRadius: 20, fontSize: 13.5, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px dashed ${C.border}`, paddingBottom: 8 }}>
              <span style={{ color: C.textMid }}>{txt('bank')}:</span>
              <strong style={{ color: C.text }}>{appData?.bank_name || 'SBI Bank'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px dashed ${C.border}`, paddingBottom: 8 }}>
              <span style={{ color: C.textMid }}>{txt('product')}:</span>
              <strong style={{ color: C.text }}>{appData?.product_name || 'Credit Card / Loan'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: C.textMid }}>{txt('finalStatus')}:</span>
              <strong style={{ color: '#10b981', textTransform: 'uppercase' }}>{form.final_status}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 24 }}>
            <button 
              onClick={() => window.location.href = '/'} 
              style={{ 
                padding: '14px 28px', 
                borderRadius: 16, 
                border: 'none', 
                background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`, 
                color: '#fff', 
                fontWeight: 800, 
                fontSize: 14, 
                cursor: 'pointer',
                boxShadow: `0 8px 24px ${C.primary}35`
              }}
            >
              🏠 Open Home Page
            </button>

            <button 
              onClick={() => setSubmitted(false)} 
              style={{ 
                padding: '14px 22px', 
                borderRadius: 16, 
                border: `1px solid ${C.border}`, 
                background: C.bgSecondary, 
                color: C.text, 
                fontWeight: 800, 
                fontSize: 13.5, 
                cursor: 'pointer'
              }}
            >
              ✏️ Edit / View Form Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Responsive Layout
  const steps = isDigitalProcess
    ? [{ id: 'step2', num: '1', title: 'Application Remark & Stage Tracking', desc: 'Remark Form' }]
    : [
        { id: 'step1', num: '1', title: txt('step1Short'), desc: 'Customer Details' },
        { id: 'step2', num: '2', title: txt('step2Short'), desc: 'Appcode & VKYC' },
        { id: 'step3', num: '3', title: txt('step3Short'), desc: 'IQA & Dispatch' },
        { id: 'step4', num: '4', title: txt('step4Short'), desc: 'Bank & Ops Status' }
      ];

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, padding: isMobile ? '14px 12px 36px' : '24px 20px 48px', fontFamily: "'Inter', sans-serif", transition: 'background 0.3s ease, color 0.3s ease' }}>
      
      {/* ═══ TOP NAVBAR HEADER ═══ */}
      <div style={{ 
        maxWidth: 820, 
        margin: '0 auto 20px', 
        display: 'flex', 
        alignItems: 'center', 
        justify: 'space-between', 
        padding: isMobile ? '10px 4px' : '14px 4px', 
        background: 'transparent', 
        gap: 12,
        flexWrap: 'wrap'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {logo && <img src={logo} alt="GharKaPaisa Logo" style={{ height: isMobile ? 28 : 34, width: 'auto' }} />}
          <span style={{ fontSize: isMobile ? 18 : 22, fontWeight: 900, color: C.text }}>
            GharKaPaisa
          </span>
        </div>

        {/* Right Header Utilities: Portal Badge, Language Switcher, Theme Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {!isMobile && (
            <div style={{ fontSize: 11, fontWeight: 800, color: C.teal, background: C.bgSecondary, border: `1px solid ${C.border}`, padding: '5px 12px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
              <MdLock size={14} color={C.teal} /> {isDigitalProcess ? 'Application Verification Portal' : txt('portalTitle')}
            </div>
          )}
          <LanguageSwitcher />
          <LightDarkToggle />
        </div>
      </div>

      {/* ═══ MAIN CONTAINER ═══ */}
      <div style={{ maxWidth: 820, margin: '0 auto' }}>

        {/* Top Summary Banner */}
        <div style={{ background: C.card, borderRadius: 24, padding: isMobile ? '18px 20px' : '24px 28px', border: `1px solid ${C.border}`, marginBottom: 20, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.teal, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                ⚡ {appData?.bank_name || 'Bank'} {isDigitalProcess ? 'Application Verification' : 'Application Verification'}
              </div>
              <h1 style={{ margin: '0 0 6px', fontSize: isMobile ? 18 : 22, fontWeight: 900, color: C.text }}>
                {isDigitalProcess ? 'Application Remark & Stage Tracking' : 'Application Verification'}
              </h1>
              <p style={{ margin: 0, fontSize: 13, color: C.textMid, lineHeight: 1.5 }}>
                {txt('appNo')} <strong style={{ color: C.text }}>#{appData?.app_number}</strong> • {txt('bank')}: <strong style={{ color: C.text }}>{appData?.bank_name || 'SBI Bank'}</strong> • {txt('product')}: <strong style={{ color: C.text }}>{appData?.product_name || 'Credit Card'}</strong>
              </p>
            </div>
            
            {/* Step Completion Indicator Pill */}
            <div style={{ padding: '6px 14px', borderRadius: 20, background: C.bgSecondary, border: `1px solid ${C.border}`, fontSize: 12, fontWeight: 800, color: C.primary }}>
              Step {isDigitalProcess ? 1 : steps.findIndex(s => s.id === activeTab) + 1} of {isDigitalProcess ? 1 : 4}
            </div>
          </div>
        </div>

        {errorMsg && (
          <div style={{ background: `${C.red}15`, border: `1px solid ${C.red}40`, color: C.red, padding: '14px 18px', borderRadius: 16, fontSize: 13, fontWeight: 700, marginBottom: 20 }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* ═══ STEP TAB WIZARD (RESPONSIVE GRID / SCROLL) ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
          {steps.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: isMobile ? '10px 12px' : '12px 14px',
                  borderRadius: 16,
                  border: isActive ? `2px solid ${C.primary}` : `1px solid ${C.border}`,
                  background: isActive ? (isDark ? '#1d4ed825' : '#eef2ff') : C.card,
                  color: isActive ? C.primary : C.textMid,
                  fontWeight: 800,
                  fontSize: 12,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? `0 4px 14px ${C.primary}20` : 'none'
                }}
              >
                <div style={{ fontSize: 10, color: isActive ? C.primary : C.textLight, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Step {tab.num}
                </div>
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2, fontSize: 12.5, fontWeight: 800 }}>
                  {tab.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* ═══ FORM CONTAINER ═══ */}
        <form onSubmit={handleSubmit} style={{ background: C.card, borderRadius: 28, padding: isMobile ? 20 : 32, border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 20, boxShadow: '0 12px 40px rgba(0,0,0,0.1)' }}>

          {/* ═══ STEP 1: CUSTOMER & PHYSICAL DETAILS ═══ */}
          {activeTab === 'step1' && (
            <>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1px solid ${C.border}`, paddingBottom: 10, marginBottom: 4 }}>
                📋 {txt('customerDetails')}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>{txt('aadhaarMobile')}</label>
                  <input
                    type="text"
                    required
                    value={form.aadhaar_linked_mobile}
                    onChange={e => handleChange('aadhaar_linked_mobile', e.target.value)}
                    placeholder={txt('aadhaarMobilePlace')}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>{txt('dob')}</label>
                  <input
                    type="text"
                    value={form.dob}
                    onChange={e => handleChange('dob', e.target.value)}
                    placeholder={txt('dobPlace')}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>{txt('panName')}</label>
                <input
                  type="text"
                  required
                  value={form.pan_name}
                  onChange={e => handleChange('pan_name', e.target.value)}
                  placeholder={txt('panNamePlace')}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>{txt('email')}</label>
                  <input
                    type="email"
                    value={form.personal_email}
                    onChange={e => handleChange('personal_email', e.target.value)}
                    placeholder={txt('emailPlace')}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>{txt('panNumber')}</label>
                  <input
                    type="text"
                    maxLength={10}
                    required
                    value={form.pan_number}
                    onChange={e => handleChange('pan_number', e.target.value.toUpperCase())}
                    placeholder={txt('panNumberPlace')}
                    style={{ ...inputStyle, textTransform: 'uppercase', letterSpacing: '1px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>{txt('companyName')}</label>
                  <input
                    type="text"
                    value={form.company_name}
                    onChange={e => handleChange('company_name', e.target.value)}
                    placeholder={txt('companyNamePlace')}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>{txt('designation')}</label>
                  <input
                    type="text"
                    value={form.designation}
                    onChange={e => handleChange('designation', e.target.value)}
                    placeholder={txt('designationPlace')}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>ADDRESS LINE 1</label>
                <input
                  type="text"
                  value={form.flat_no}
                  onChange={e => handleChange('flat_no', e.target.value)}
                  placeholder="Flat / House No / Building Name"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>ADDRESS LINE 2</label>
                <input
                  type="text"
                  value={form.sub_area}
                  onChange={e => handleChange('sub_area', e.target.value)}
                  placeholder="Street / Area / Locality"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>LANDMARK</label>
                <input
                  type="text"
                  value={form.landmark}
                  onChange={e => handleChange('landmark', e.target.value)}
                  placeholder="Nearby Landmark"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>PINCODE</label>
                <input
                  type="text"
                  maxLength={6}
                  value={form.pincode}
                  onChange={e => handleChange('pincode', e.target.value)}
                  placeholder="e.g. 400001"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>CITY</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={e => handleChange('city', e.target.value)}
                  placeholder="e.g. Mumbai / Delhi"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>STATE</label>
                <input
                  type="text"
                  value={form.state}
                  onChange={e => handleChange('state', e.target.value)}
                  placeholder="e.g. Maharashtra"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>{txt('motherName')}</label>
                <input
                  type="text"
                  value={form.mother_name}
                  onChange={e => handleChange('mother_name', e.target.value)}
                  placeholder={txt('motherNamePlace')}
                  style={inputStyle}
                />
              </div>

              {isSbi && (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>{txt('appNumberBank')}</label>
                    <input
                      type="text"
                      value={form.bank_ref_number}
                      onChange={e => handleChange('bank_ref_number', e.target.value)}
                      placeholder={txt('appNumberBankPlace')}
                      style={inputStyle}
                    />
                  </div>
                  {!isPunchLead && (
                    <div>
                      <label style={labelStyle}>{txt('vkycUrl')}</label>
                      <input
                        type="text"
                        value={form.vkyc_url}
                        onChange={e => handleChange('vkyc_url', e.target.value)}
                        placeholder={txt('vkycUrlPlace')}
                        style={inputStyle}
                      />
                    </div>
                  )}
                </div>
              )}

              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20, marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('step2')}
                  style={{
                    padding: '14px 28px',
                    borderRadius: '16px',
                    border: 'none',
                    background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: `0 6px 20px ${C.primary}35`
                  }}
                >
                  {txt('nextStep')} 2: Appcode & VKYC <MdNavigateNext size={20} />
                </button>
              </div>
            </>
          )}

          {/* ═══ STEP 2: APPLICATION REMARK & STAGE TRACKING FORM ═══ */}
          {activeTab === 'step2' && (
            <>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1px solid ${C.border}`, paddingBottom: 10, marginBottom: 4 }}>
                ⚙️ Application Remark & Stage Tracking Form
              </div>

              {/* Order: 1. Appcode Status, 2. Soft Approval Status */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>{txt('appcodeStatus') || 'APPCODE STATUS'}</label>
                  <select
                    value={form.appcode_status}
                    onChange={e => handleChange('appcode_status', e.target.value)}
                    style={inputStyle}
                  >
                    <option value="None">None</option>
                    <option value="Appcode Send">Appcode Send</option>
                    <option value="Appcode Pending">Appcode Pending</option>
                    <option value="Appcode submit">Appcode submit</option>
                    {form.appcode_status && !['None', 'Appcode Send', 'Appcode Pending', 'Appcode submit'].includes(form.appcode_status) && (
                      <option value={form.appcode_status}>{form.appcode_status}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>{txt('softApprovalStatus') || 'SOFT APPROVAL STATUS'}</label>
                  <select
                    value={form.soft_approval_status}
                    onChange={e => handleChange('soft_approval_status', e.target.value)}
                    style={inputStyle}
                  >
                    <option value="None">None</option>
                    <option value="Approve">Approve</option>
                    <option value="Decline">Decline</option>
                    <option value="EQT">EQT</option>
                    <option value="Technical Error">Technical Error</option>
                    {form.soft_approval_status && !['None', 'Approve', 'Decline', 'EQT', 'Technical Error'].includes(form.soft_approval_status) && (
                      <option value={form.soft_approval_status}>{form.soft_approval_status}</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Order: 3. IQA Stage, 4. Bank Application Number */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>{txt('iqaStage') || 'IQA STAGE'}</label>
                  <select
                    value={form.iqa_stage}
                    onChange={e => handleChange('iqa_stage', e.target.value)}
                    style={inputStyle}
                  >
                    <option value="None">None</option>
                    <option value="IQT Send">IQT Send</option>
                    <option value="IQT Pending">IQT Pending</option>
                    <option value="IQT Complete">IQT Complete</option>
                    <option value="Blaze Continue">Blaze Continue</option>
                    <option value="Blaze Decline">Blaze Decline</option>
                    {form.iqa_stage && !['None', 'IQT Send', 'IQT Pending', 'IQT Complete', 'Blaze Continue', 'Blaze Decline'].includes(form.iqa_stage) && (
                      <option value={form.iqa_stage}>{form.iqa_stage}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>BANK APPLICATION NUMBER (13-digit number)</label>
                  <input
                    type="text"
                    maxLength={13}
                    value={form.bank_ref_number}
                    onChange={e => handleChange('bank_ref_number', e.target.value.replace(/\D/g, '').slice(0, 13))}
                    placeholder="Enter 13-digit Bank App Reference Number"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Order: 5. VKYC Status, 6. VKYC Link */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>{txt('vkycStage') || 'VKYC STAGE'}</label>
                  <select
                    value={form.vkyc_stage}
                    onChange={e => handleChange('vkyc_stage', e.target.value)}
                    style={inputStyle}
                  >
                    <option value="None">None</option>
                    <option value="Pending">Pending</option>
                    <option value="Complete">Complete</option>
                    <option value="Failed">Failed</option>
                    {form.vkyc_stage && !['None', 'Pending', 'Complete', 'Failed'].includes(form.vkyc_stage) && (
                      <option value={form.vkyc_stage}>{form.vkyc_stage}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>{txt('vkycUrl') || 'VKYC LINK'}</label>
                  <input
                    type="url"
                    value={form.vkyc_url}
                    onChange={e => handleChange('vkyc_url', e.target.value)}
                    placeholder="https://vkyc..."
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Order: 7. Dispatch Status */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>{txt('dispatchStatus') || 'DISPATCH STATUS'}</label>
                  <select
                    value={form.dispatch_status}
                    onChange={e => handleChange('dispatch_status', e.target.value)}
                    style={inputStyle}
                  >
                    <option value="None">None</option>
                    <option value="Dispatch Pending">Dispatch Pending</option>
                    <option value="Dispatch Complete">Dispatch Complete</option>
                    <option value="E-Sign Pending">E-Sign Pending</option>
                    <option value="E-sign Complete">E-sign Complete</option>
                    <option value="RTB(Error)">RTB(Error)</option>
                    {form.dispatch_status && !['None', 'Dispatch Pending', 'Dispatch Complete', 'E-Sign Pending', 'E-sign Complete', 'RTB(Error)'].includes(form.dispatch_status) && (
                      <option value={form.dispatch_status}>{form.dispatch_status}</option>
                    )}
                  </select>
                </div>
              </div>

              {isDigitalProcess ? (
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20, marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    style={{
                      padding: '14px 28px',
                      borderRadius: '16px',
                      border: 'none',
                      background: '#10b981',
                      color: '#ffffff',
                      fontWeight: 900,
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)'
                    }}
                  >
                    {submitting ? 'Submitting...' : 'SUBMIT DETAILS 💾'}
                  </button>
                </div>
              ) : (
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20, marginTop: 10, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('step1')}
                    style={{
                      padding: '14px 22px',
                      borderRadius: '16px',
                      border: `1px solid ${C.border}`,
                      background: C.bgSecondary,
                      color: C.text,
                      fontWeight: 800,
                      fontSize: '13.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <MdNavigateBefore size={20} /> {txt('backStep')} Step 1
                  </button>

                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitting}
                      style={{
                        padding: '14px 24px',
                        borderRadius: '16px',
                        border: 'none',
                        background: '#10b981',
                        color: '#ffffff',
                        fontWeight: 900,
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)'
                      }}
                    >
                      {submitting ? 'Submitting...' : 'Submit Details'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('step3')}
                      style={{
                        padding: '14px 28px',
                        borderRadius: '16px',
                        border: 'none',
                        background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
                        color: '#ffffff',
                        fontWeight: 900,
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        boxShadow: `0 6px 20px ${C.primary}35`
                      }}
                    >
                      {txt('nextStep')} 3: IQA & Dispatch <MdNavigateNext size={20} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ═══ STEP 3: IQA & DISPATCH STAGE ═══ */}
          {activeTab === 'step3' && (
            <>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1px solid ${C.border}`, paddingBottom: 10, marginBottom: 4 }}>
                📦 {txt('iqaDispatch')}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>{txt('iqaStage')}</label>
                  <select
                    value={form.iqa_stage}
                    onChange={e => handleChange('iqa_stage', e.target.value)}
                    style={inputStyle}
                  >
                    <option value="IQA SENT">1. IQA SENT</option>
                    <option value="IQA COMPLETE">2. IQA COMPLETE</option>
                    <option value="IQA PENDING">3. IQA PENDING</option>
                    <option value="BLAZE CONTINUE">4. BLAZE CONTINUE</option>
                    <option value="BLAZE DECLINE">5. BLAZE DECLINE</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>{txt('dispatchStatus')}</label>
                  <select
                    value={form.dispatch_status}
                    onChange={e => handleChange('dispatch_status', e.target.value)}
                    style={inputStyle}
                  >
                    <option value="DISPATCH DONE">1. DISPATCH DONE</option>
                    <option value="WCP STAGE">2. WCP STAGE</option>
                    <option value="E-sign Done">3. E-sign Done</option>
                    <option value="E-sign Pending">4. E-sign Pending</option>
                    <option value="RTB(ERROR)">5. RTB(ERROR)</option>
                  </select>
                </div>
              </div>

              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20, marginTop: 10, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('step2')}
                  style={{
                    padding: '14px 22px',
                    borderRadius: '16px',
                    border: `1px solid ${C.border}`,
                    background: C.bgSecondary,
                    color: C.text,
                    fontWeight: 800,
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <MdNavigateBefore size={20} /> {txt('backStep')} Step 2
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('step4')}
                  style={{
                    padding: '14px 28px',
                    borderRadius: '16px',
                    border: 'none',
                    background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: `0 6px 20px ${C.primary}35`
                  }}
                >
                  {txt('nextStep')} 4: Bank & Final Status <MdNavigateNext size={20} />
                </button>
              </div>
            </>
          )}

          {/* ═══ STEP 4: BANK REMARK & FINAL STATUS ═══ */}
          {activeTab === 'step4' && (
            <>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1px solid ${C.border}`, paddingBottom: 10, marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>🏦 {txt('bankFinalStatus')}</span>
                <span style={{ fontSize: '11px', fontWeight: 800, color: isOperationsOrAdmin ? C.teal : C.red }}>
                  {isOperationsOrAdmin ? '✏️ Editable' : '🔒 Read-Only'}
                </span>
              </div>

              {!isOperationsOrAdmin && (
                <div style={{ background: isDark ? '#1e293b' : '#f8fafc', border: `1.5px solid ${C.border}`, padding: '10px 14px', borderRadius: 12, fontSize: 12, fontWeight: 700, color: C.red, display: 'flex', alignItems: 'center', gap: 6 }}>
                  🔒 Part 3 (Bank & Final Status) can only be added or edited by Operations Head, Super Admin, or Administrative Operator.
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : (isPunchLead ? '1fr' : '1fr 1fr'), gap: 16 }}>
                <div>
                  <label style={labelStyle}>{txt('appNumberBank')}</label>
                  <input
                    type="text"
                    disabled={!isOperationsOrAdmin}
                    readOnly={!isOperationsOrAdmin}
                    value={form.bank_ref_number}
                    onChange={e => handleChange('bank_ref_number', e.target.value)}
                    placeholder={txt('appNumberBankPlace')}
                    style={{
                      ...inputStyle,
                      fontWeight: 'bold',
                      fontFamily: 'monospace',
                      opacity: isOperationsOrAdmin ? 1 : 0.8,
                      cursor: isOperationsOrAdmin ? 'text' : 'not-allowed',
                      background: isOperationsOrAdmin ? C.inputBg : (isDark ? '#1a1a1a' : '#f1f5f9')
                    }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>{txt('vkycUrl')}</label>
                  <input
                    type="url"
                    disabled={!isOperationsOrAdmin}
                    readOnly={!isOperationsOrAdmin}
                    value={form.vkyc_url}
                    onChange={e => handleChange('vkyc_url', e.target.value)}
                    placeholder={txt('vkycUrlPlace')}
                    style={{
                      ...inputStyle,
                      opacity: isOperationsOrAdmin ? 1 : 0.8,
                      cursor: isOperationsOrAdmin ? 'text' : 'not-allowed',
                      background: isOperationsOrAdmin ? C.inputBg : (isDark ? '#1a1a1a' : '#f1f5f9')
                    }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>{txt('finalStatus')}</label>
                  <select
                    disabled={!isOperationsOrAdmin}
                    value={form.final_status}
                    onChange={e => handleChange('final_status', e.target.value)}
                    style={{
                      ...inputStyle,
                      opacity: isOperationsOrAdmin ? 1 : 0.8,
                      cursor: isOperationsOrAdmin ? 'pointer' : 'not-allowed',
                      background: isOperationsOrAdmin ? C.inputBg : (isDark ? '#1a1a1a' : '#f1f5f9')
                    }}
                  >
                    <option value="App file generated (approved)">1. App file generated (approved)</option>
                    <option value="Decline">2. Decline</option>
                    <option value="In Process">3. In Process</option>
                    <option value="Technical Error">4. Technical Error</option>
                  </select>
                </div>

                {/* Hide QD / RE-QD if process is punching only */}
                {!isPunchLead && (
                  <div>
                    <label style={labelStyle}>{txt('eligibleReqd')}</label>
                    <select
                      disabled={!isOperationsOrAdmin}
                      value={form.eligible_reqd}
                      onChange={e => handleChange('eligible_reqd', e.target.value)}
                      style={{
                        ...inputStyle,
                        opacity: isOperationsOrAdmin ? 1 : 0.8,
                        cursor: isOperationsOrAdmin ? 'pointer' : 'not-allowed',
                        background: isOperationsOrAdmin ? C.inputBg : (isDark ? '#1a1a1a' : '#f1f5f9')
                      }}
                    >
                      <option value="Yes">{txt('yes')}</option>
                      <option value="No">{txt('no')}</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>{txt('bankRemark')}</label>
                  <span style={{ fontSize: '10.5px', fontWeight: 800, color: isOperationsOrAdmin ? C.teal : C.textMid }}>
                    {isOperationsOrAdmin ? '✏️ Editable' : '🔒 Read-Only'}
                  </span>
                </div>
                <textarea
                  rows={3}
                  disabled={!isOperationsOrAdmin}
                  readOnly={!isOperationsOrAdmin}
                  value={form.bank_remark}
                  onChange={e => handleChange('bank_remark', e.target.value)}
                  placeholder={isOperationsOrAdmin ? txt('bankRemarkPlace') : "Read-Only"}
                  style={{
                    ...inputStyle,
                    resize: 'vertical',
                    opacity: isOperationsOrAdmin ? 1 : 0.8,
                    cursor: isOperationsOrAdmin ? 'text' : 'not-allowed',
                    background: isOperationsOrAdmin ? C.inputBg : (isDark ? '#1a1a1a' : '#f1f5f9')
                  }}
                />
              </div>

              {form.final_status === 'Decline' && (
                <div>
                  <label style={{ ...labelStyle, color: C.red }}>{txt('declineReason')}</label>
                  <textarea
                    rows={2}
                    disabled={!isOperationsOrAdmin}
                    readOnly={!isOperationsOrAdmin}
                    value={form.decline_reason}
                    onChange={e => handleChange('decline_reason', e.target.value)}
                    placeholder={txt('declineReasonPlace')}
                    style={{
                      ...inputStyle,
                      borderColor: `${C.red}60`,
                      resize: 'vertical',
                      opacity: isOperationsOrAdmin ? 1 : 0.8,
                      cursor: isOperationsOrAdmin ? 'text' : 'not-allowed',
                      background: isOperationsOrAdmin ? C.inputBg : (isDark ? '#1a1a1a' : '#f1f5f9')
                    }}
                  />
                </div>
              )}

              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20, marginTop: 10, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('step3')}
                  style={{
                    padding: '14px 22px',
                    borderRadius: '16px',
                    border: `1px solid ${C.border}`,
                    background: C.bgSecondary,
                    color: C.text,
                    fontWeight: 800,
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <MdNavigateBefore size={20} /> {txt('backStep')} Step 3
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '14px 32px',
                    borderRadius: '16px',
                    border: 'none',
                    background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '14px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: `0 8px 24px ${C.primary}40`,
                    letterSpacing: '0.02em'
                  }}
                >
                  {submitting ? txt('savingDetails') : txt('saveDetails')}
                </button>
              </div>
            </>
          )}

        </form>
      </div>
    </div>
  );
}
