import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { 
  FaUser, FaBriefcase, FaUserTag, FaIdCard, FaGraduationCap, 
  FaCheckCircle, FaVideo, FaFileContract, FaUpload, FaLanguage, 
  FaCopy, FaPlay, FaStop, FaRedo, FaMicrophone, FaClock, 
  FaExclamationTriangle, FaExternalLinkAlt, FaFileAlt, FaChevronRight, FaChevronLeft
} from 'react-icons/fa';
import axios from 'axios';
import { getApiV1Url } from '../../../config/api';

const SCRIPTS = {
  en: {
    label: 'English',
    text: (name) => `My name is ${name || '[Your Full Name]'}. I hereby accept the employment terms & conditions of GharKaPaisa and confirm that all details provided by me are true and accurate.`
  },
  hi: {
    label: 'Hindi (हिंदी)',
    text: (name) => `मेरा नाम ${name || '[आपका पूरा नाम]'} है। मैं घरकापैसा (GharKaPaisa) के रोजगार नियमों और शर्तों को स्वीकार करता/करती हूँ और पुष्टि करता/करती हूँ कि मेरे द्वारा दिए गए सभी विवरण सत्य हैं।`
  },
  mr: {
    label: 'Marathi (मराठी)',
    text: (name) => `माझे नाव ${name || '[तुमचे पूर्ण नाव]'} आहे. मी घरकापैसा (GharKaPaisa) च्या नोकरीच्या सर्व अटी आणि शर्ती मान्य करत आहे आणि जाहीर करतो/करते की माझी सर्व माहिती खरी आहे.`
  },
  gu: {
    label: 'Gujarati (ગુજરાતી)',
    text: (name) => `મારું નામ ${name || '[તમારું પૂરૂં નામ]'} છે. હું ઘરકાપૈસા (GharKaPaisa) ના નોકરીના નિયમો અને શરતોનો સ્વીકાર કરું છું અને ખાતરી આપું છું કે મારી વિગતો સાચી છે.`
  },
  ta: {
    label: 'Tamil (தமிழ்)',
    text: (name) => `என் பெயர் ${name || '[உங்கள் முழு பெயர்]'}. நான் கார்காபைசா (GharKaPaisa) வேலைவாய்ப்பு விதிகள் மற்றும் நிபந்தனைகளை ஏற்றுக் கொள்கிறேன்.`
  },
  te: {
    label: 'Telugu (తెలుగు)',
    text: (name) => `నా పేరు ${name || '[మీ పూర్తి పేరు]'}. నేను ఘర్‌కాపైసా (GharKaPaisa) ఉద్యోગ నిబంధనలు మరియు షరతులను అంగీకరిస్తున్నాను.`
  },
  kn: {
    label: 'Kannada (ಕನ್ನಡ)',
    text: (name) => `ನನ್ನ ಹೆಸರು ${name || '[ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರು]'}. ನಾನು ಘರ್‌ಕಾಪೈಸಾ (GharKaPaisa) ಉದ್ಯೋಗ ನಿಯಮಗಳು ಮತ್ತು ಷರತ್ತುಗಳನ್ನು ಒಪ್ಪಿಕೊಳ್ಳುತ್ತೇನೆ.`
  },
  bn: {
    label: 'Bengali (বাংলা)',
    text: (name) => `আমার নাম ${name || '[আপনার পুরো নাম]'}। আমি ঘরকাপয়সা (GharKaPaisa)-এর চাকরির সমস্ত শর্তাবলী স্বীকার করছি।`
  }
};

export default function UnifiedEmployeeOnboarding({ initialStep = 1 }) {
  const { C } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Active Tab Step: 1, 2, or 3
  const [activeTab, setActiveTab] = useState(() => {
    if (location.pathname.includes('terms')) return 2;
    if (location.pathname.includes('kyc')) return 3;
    if (location.pathname.includes('joining')) return 1;
    return initialStep;
  });

  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  // Status flags
  const [joiningCompleted, setJoiningCompleted] = useState(false);
  const [termsCompleted, setTermsCompleted] = useState(false);
  const [kycCompleted, setKycCompleted] = useState(false);

  // --- Step 1: Joining Form State ---
  const [joiningForm, setJoiningForm] = useState({
    full_name: '', mobile_number: '', whatsapp_number: '', email_id: '', current_address: '', permanent_address: '',
    designation: '', department: '', joining_date: new Date().toISOString().split('T')[0], work_location: 'Office',
    reporting_manager: '', employment_type: 'Full-time', offered_salary: '', incentive_structure: 'Standard Performance Incentive',
    notice_period_days: '30', referred_by: '', recruitment_source: 'Direct / Portal', interviewer_name: 'HR Executive',
    pan_number: '', aadhaar_number: '', bank_account_holder_name: '', bank_account_number: '', ifsc_code: '',
    highest_qualification: 'Graduate', passing_year: '2022', experience_type: 'Fresher', previous_company: '',
    previous_designation: '', total_experience_years: '0', declaration_accepted: true, digital_signature: ''
  });

  // --- Step 2: Terms & Video State ---
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en');
  const [copied, setCopied] = useState(false);
  const [videoMode, setVideoMode] = useState('record');
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('');
  const [existingVideoUrl, setExistingVideoUrl] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [camError, setCamError] = useState('');

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  // --- Step 3: KYC Documents State ---
  const [panNum, setPanNum] = useState('');
  const [aadhaarNum, setAadhaarNum] = useState('');
  const [bankAccNum, setBankAccNum] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [existingPanUrl, setExistingPanUrl] = useState('');
  const [existingAadhaarUrl, setExistingAadhaarUrl] = useState('');
  const [existingBankUrl, setExistingBankUrl] = useState('');
  const [kycStatus, setKycStatus] = useState('NOT_SUBMITTED');
  const [panStatus, setPanStatus] = useState('');
  const [aadhaarStatus, setAadhaarStatus] = useState('');
  const [bankStatus, setBankStatus] = useState('');
  const [panReason, setPanReason] = useState('');
  const [aadhaarReason, setAadhaarReason] = useState('');
  const [bankReason, setBankReason] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');

  const [panFile, setPanFile] = useState(null);
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [bankFile, setBankFile] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch Master Profile
  const loadMasterProfile = async () => {
    setFetchingProfile(true);
    try {
      const token = localStorage.getItem('token');
      if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const res = await axios.get(`${getApiV1Url()}/employee/profile`);
      if (res.data?.success && res.data?.data) {
        const emp = res.data.data.employee || {};
        const jDetails = res.data.data.joining_details || {};
        const terms = res.data.data.terms || {};
        const kyc = res.data.data.kyc || {};

        // 1. Fill Joining Form
        setJoiningForm(prev => ({
          ...prev,
          full_name: jDetails.full_name || emp.full_name || '',
          mobile_number: jDetails.mobile_number || emp.mobile_number || '',
          whatsapp_number: jDetails.whatsapp_number || emp.whatsapp_number || '',
          email_id: jDetails.email_id || emp.email_id || emp.email || '',
          current_address: jDetails.current_address || emp.current_address || '',
          permanent_address: jDetails.permanent_address || '',
          designation: jDetails.designation || emp.designation || 'None',
          department: jDetails.department || emp.department || 'None',
          joining_date: jDetails.joining_date ? new Date(jDetails.joining_date).toISOString().split('T')[0] : (emp.joining_date ? new Date(emp.joining_date).toISOString().split('T')[0] : prev.joining_date),
          work_location: jDetails.work_location || emp.work_location || 'None',
          reporting_manager: jDetails.reporting_manager || '',
          employment_type: jDetails.employment_type || emp.employment_type || 'None',
          offered_salary: jDetails.offered_salary || emp.offered_salary || '',
          incentive_structure: jDetails.incentive_structure || 'None',
          notice_period_days: jDetails.notice_period_days || emp.notice_period_days || 'None',
          referred_by: jDetails.referred_by || emp.referred_by || '',
          recruitment_source: jDetails.recruitment_source || emp.recruitment_source || 'None',
          pan_number: jDetails.pan_number || kyc.pan_number || '',
          aadhaar_number: jDetails.aadhaar_number || kyc.aadhaar_number || '',
          bank_account_holder_name: jDetails.bank_account_holder_name || emp.full_name || '',
          bank_account_number: jDetails.bank_account_number || kyc.bank_account_number || '',
          ifsc_code: jDetails.ifsc_code || kyc.ifsc_code || '',
          highest_qualification: jDetails.highest_qualification || 'None',
          passing_year: jDetails.passing_year || 'None',
          experience_type: jDetails.experience_type || 'None',
          previous_company: jDetails.previous_company || '',
          previous_designation: jDetails.previous_designation || '',
          total_experience_years: jDetails.total_experience_years || '0',
          digital_signature: jDetails.full_name || emp.full_name || ''
        }));

        if (jDetails.form_status === 'SUBMITTED' || jDetails.form_status === 'APPROVED') {
          setJoiningCompleted(true);
        }

        // 2. Fill Terms & Video
        if (terms.terms_accepted) {
          setAcceptedTerms(true);
          setTermsCompleted(true);
        }
        if (terms.video_url) {
          setExistingVideoUrl(terms.video_url);
        }

        // 3. Fill KYC
        setPanNum(kyc.pan_number || jDetails.pan_number || '');
        setAadhaarNum(kyc.aadhaar_number || jDetails.aadhaar_number || '');
        setBankAccNum(kyc.bank_account_number || jDetails.bank_account_number || '');
        setIfsc(kyc.ifsc_code || jDetails.ifsc_code || '');

        setExistingPanUrl(kyc.pan_document_url || '');
        setExistingAadhaarUrl(kyc.aadhaar_document_url || '');
        setExistingBankUrl(kyc.bank_document_url || '');
        setPanStatus(kyc.pan_status || (kyc.pan_verified ? 'VERIFIED' : 'PENDING'));
        setAadhaarStatus(kyc.aadhaar_status || (kyc.aadhaar_verified ? 'VERIFIED' : 'PENDING'));
        setBankStatus(kyc.bank_status || (kyc.bank_verified ? 'VERIFIED' : 'PENDING'));
        setPanReason(kyc.pan_rejection_reason || '');
        setAadhaarReason(kyc.aadhaar_rejection_reason || '');
        setBankReason(kyc.bank_rejection_reason || '');
        setReviewNotes(kyc.review_notes || '');

        const hasKycData = !!(kyc.pan_number || jDetails.pan_number || kyc.aadhaar_number || jDetails.aadhaar_number || kyc.bank_account_number || jDetails.bank_account_number || kyc.pan_document_url || kyc.aadhaar_document_url || kyc.bank_document_url);
        const resolvedKycStatus = (kyc.kyc_status && kyc.kyc_status !== 'NOT_SUBMITTED') ? kyc.kyc_status : (hasKycData ? 'SUBMITTED' : 'NOT_SUBMITTED');
        setKycStatus(resolvedKycStatus);
        if (resolvedKycStatus === 'VERIFIED') {
          setKycCompleted(true);
        }
      }
    } catch (err) {
      console.warn('Master profile fetch error:', err.message);
    } finally {
      setFetchingProfile(false);
    }
  };

  useEffect(() => {
    loadMasterProfile();
  }, []);

  useEffect(() => {
    return () => {
      stopCameraStream();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const stopCameraStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  };

  // --- Step 1 Handlers ---
  const handleJoiningChange = (e) => {
    const { name, value, type, checked } = e.target;
    setJoiningForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleJoiningSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${getApiV1Url()}/employee/joining-form`, joiningForm);
      if (res.data.success) {
        setJoiningCompleted(true);
        alert('✓ Step 1: Employee Joining Registration Submitted! Proceeding to Terms & Video Verification.');
        setActiveTab(2);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit Joining Form');
    } finally {
      setLoading(false);
    }
  };

  // --- Step 2 Handlers ---
  const handleCopyScript = () => {
    const scriptText = SCRIPTS[selectedLang].text(joiningForm.full_name);
    navigator.clipboard.writeText(scriptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startRecording = async () => {
    setCamError('');
    chunksRef.current = [];
    setRecordingTime(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: true
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      let mimeType = 'video/webm;codecs=vp8,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/mp4';
        if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = '';
      }

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' });
        const file = new File([blob], `vkyc_${Date.now()}.${mimeType.includes('mp4') ? 'mp4' : 'webm'}`, { type: blob.type });
        setVideoFile(file);
        setVideoPreviewUrl(URL.createObjectURL(blob));
        stopCameraStream();
      };

      mediaRecorder.start(500);
      setIsRecording(true);
      timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);

    } catch (err) {
      setCamError('Unable to access camera. Please check browser permissions or use Upload Video mode.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const retakeVideo = () => {
    setVideoFile(null);
    setVideoPreviewUrl('');
    setRecordingTime(0);
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    stopCameraStream();
  };

  const handleTermsSubmit = async (e) => {
    e.preventDefault();
    if (!acceptedTerms) {
      alert('Please check and accept the Workplace Terms & Conditions.');
      return;
    }
    if (!videoFile && !existingVideoUrl) {
      alert('Please record or upload a video verification file.');
      return;
    }

    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('accepted', 'true');
      payload.append('terms_version', '1.0');
      payload.append('language_selected', selectedLang);
      if (videoFile) payload.append('video', videoFile);

      const res = await axios.post(`${getApiV1Url()}/employee/terms-acceptance`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        setTermsCompleted(true);
        alert('✓ Step 2: Terms & Video Verification Saved! Proceeding to Document Upload.');
        setActiveTab(3);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit terms acceptance');
    } finally {
      setLoading(false);
    }
  };

  // --- Step 3 Handlers ---
  const handleKycSubmit = async (e) => {
    e.preventDefault();
    if (!panNum || !aadhaarNum || !bankAccNum) {
      alert('Please fill in PAN, Aadhaar, and Bank details.');
      return;
    }

    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('pan_number', panNum.toUpperCase());
      payload.append('aadhaar_number', aadhaarNum);
      payload.append('bank_account_number', bankAccNum);
      payload.append('ifsc_code', ifsc.toUpperCase());

      if (panFile) payload.append('pan_document', panFile);
      if (aadhaarFile) payload.append('aadhaar_document', aadhaarFile);
      if (bankFile) payload.append('bank_document', bankFile);

      const res = await axios.post(`${getApiV1Url()}/employee/kyc`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        alert('✓ Step 3: KYC Documents Submitted Successfully!');
        loadMasterProfile();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit KYC documents');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingProfile) {
    return (
      <div style={{ background: C.bg, minHeight: '100vh', padding: '60px 24px', textAlign: 'center', color: C.textMid, fontFamily: "'Inter', sans-serif" }}>
        Loading Employee Onboarding Portal...
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: isMobile ? '16px 8px 60px' : '32px 24px 80px', fontFamily: "'Inter', sans-serif", color: C.text }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        
        {/* Page Header */}
        <div style={{ marginBottom: '24px', textAlign: isMobile ? 'center' : 'left' }}>
          <span style={{ fontSize: '11px', fontWeight: 900, color: C.teal || '#0F766E', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Unified Onboarding & Verification Portal
          </span>
          <h1 style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 900, color: C.text, margin: '4px 0 6px 0' }}>
            EMPLOYEE KYC & ONBOARDING WIZARD
          </h1>
          <p style={{ fontSize: '13px', color: C.textMid, margin: 0 }}>
            Complete all three required steps on this single page to activate your official GharKaPaisa Employee Portal.
          </p>
        </div>

        {/* 3-Step Navigation Wizard Tabs */}
        <div style={{ 
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', 
          background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', 
          padding: '8px', marginBottom: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' 
        }}>
          
          {/* Step 1 Tab */}
          <button
            type="button"
            onClick={() => setActiveTab(1)}
            style={{
              padding: isMobile ? '10px 4px' : '14px 16px', borderRadius: '14px', border: 'none', cursor: 'pointer',
              background: activeTab === 1 ? (C.teal || '#0F766E') : (joiningCompleted ? `${C.teal}15` : C.bgSecondary),
              color: activeTab === 1 ? '#ffffff' : (joiningCompleted ? (C.teal || '#0F766E') : C.textMid),
              textAlign: 'center', transition: 'all 0.2s', display: 'flex', flexDirection: isMobile ? 'column' : 'row',
              alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
          >
            <span style={{ fontSize: '16px' }}>{joiningCompleted ? <FaCheckCircle color={activeTab === 1 ? '#fff' : '#10B981'} /> : <FaFileAlt />}</span>
            <div style={{ textAlign: isMobile ? 'center' : 'left' }}>
              <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', display: 'block', opacity: 0.8 }}>Step 1</span>
              <strong style={{ fontSize: isMobile ? '11px' : '13px', display: 'block' }}>Joining Registration</strong>
            </div>
          </button>

          {/* Step 2 Tab */}
          <button
            type="button"
            onClick={() => setActiveTab(2)}
            style={{
              padding: isMobile ? '10px 4px' : '14px 16px', borderRadius: '14px', border: 'none', cursor: 'pointer',
              background: activeTab === 2 ? (C.teal || '#0F766E') : (termsCompleted ? `${C.teal}15` : C.bgSecondary),
              color: activeTab === 2 ? '#ffffff' : (termsCompleted ? (C.teal || '#0F766E') : C.textMid),
              textAlign: 'center', transition: 'all 0.2s', display: 'flex', flexDirection: isMobile ? 'column' : 'row',
              alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
          >
            <span style={{ fontSize: '16px' }}>{termsCompleted ? <FaCheckCircle color={activeTab === 2 ? '#fff' : '#10B981'} /> : <FaVideo />}</span>
            <div style={{ textAlign: isMobile ? 'center' : 'left' }}>
              <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', display: 'block', opacity: 0.8 }}>Step 2</span>
              <strong style={{ fontSize: isMobile ? '11px' : '13px', display: 'block' }}>Terms & Video</strong>
            </div>
          </button>

          {/* Step 3 Tab */}
          <button
            type="button"
            onClick={() => setActiveTab(3)}
            style={{
              padding: isMobile ? '10px 4px' : '14px 16px', borderRadius: '14px', border: 'none', cursor: 'pointer',
              background: activeTab === 3 ? (C.teal || '#0F766E') : (kycCompleted ? `${C.teal}15` : C.bgSecondary),
              color: activeTab === 3 ? '#ffffff' : (kycCompleted ? (C.teal || '#0F766E') : C.textMid),
              textAlign: 'center', transition: 'all 0.2s', display: 'flex', flexDirection: isMobile ? 'column' : 'row',
              alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
          >
            <span style={{ fontSize: '16px' }}>{kycCompleted ? <FaCheckCircle color={activeTab === 3 ? '#fff' : '#10B981'} /> : <FaIdCard />}</span>
            <div style={{ textAlign: isMobile ? 'center' : 'left' }}>
              <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', display: 'block', opacity: 0.8 }}>Step 3</span>
              <strong style={{ fontSize: isMobile ? '11px' : '13px', display: 'block' }}>KYC & Documents</strong>
            </div>
          </button>

        </div>

        {/* STEP 1 FORM: JOINING REGISTRATION */}
        {activeTab === 1 && (
          <form onSubmit={handleJoiningSubmit} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', padding: isMobile ? '20px 16px' : '36px', boxShadow: '0 4px 24px rgba(0,0,0,0.03)' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: `2px solid ${C.teal || '#0F766E'}20`, paddingBottom: '12px' }}>
              <FaUser style={{ color: C.teal || '#0F766E', fontSize: '20px' }} />
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 900, color: C.teal || '#0F766E', margin: 0 }}>Step 1: Candidate & Employment Joining Registration</h3>
                <p style={{ fontSize: '12px', color: C.textMid, margin: 0 }}>Provide your personal, employment, and bank details for internal record generation.</p>
              </div>
            </div>

            {joiningCompleted && (
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#166534', padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaCheckCircle style={{ color: '#16A34A' }} /> ✓ Employee Joining Details form has been saved. You can update any fields below or proceed to Step 2.
              </div>
            )}

            {/* Candidate Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '28px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>1. Full Legal Name *</label>
                <input type="text" name="full_name" required value={joiningForm.full_name} onChange={handleJoiningChange} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontWeight: 700 }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>2. Mobile Contact Number *</label>
                <input type="tel" name="mobile_number" required value={joiningForm.mobile_number} onChange={handleJoiningChange} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontWeight: 700 }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>WhatsApp Number</label>
                <input type="tel" name="whatsapp_number" value={joiningForm.whatsapp_number} onChange={handleJoiningChange} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>3. Email Address *</label>
                <input type="email" name="email_id" required value={joiningForm.email_id} onChange={handleJoiningChange} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontWeight: 700 }} />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>4. Current Address *</label>
                <textarea rows={2} name="current_address" required value={joiningForm.current_address} onChange={handleJoiningChange} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
              </div>
            </div>

            {/* Employment Grid */}
            <h4 style={{ fontSize: '15px', fontWeight: 800, color: C.text, marginBottom: '14px', borderTop: `1px dashed ${C.border}`, paddingTop: '20px' }}>Employment & Role Details</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '28px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>Designation *</label>
                <select
                  name="designation"
                  required
                  value={joiningForm.designation}
                  onChange={handleJoiningChange}
                  style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontWeight: 700, cursor: 'pointer' }}
                >
                  <option value="Manager">Manager</option>
                  <option value="Team Leader">Team Leader</option>
                  <option value="Telecaller">Telecaller</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>Department *</label>
                <input type="text" name="department" required value={joiningForm.department} onChange={handleJoiningChange} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>Date of Joining *</label>
                <input type="date" name="joining_date" required value={joiningForm.joining_date} onChange={handleJoiningChange} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>Offered Monthly Salary (₹) *</label>
                <input type="number" name="offered_salary" required value={joiningForm.offered_salary} onChange={handleJoiningChange} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontWeight: 700 }} />
              </div>
            </div>

            {/* Compliance Numbers */}
            <h4 style={{ fontSize: '15px', fontWeight: 800, color: C.text, marginBottom: '14px', borderTop: `1px dashed ${C.border}`, paddingTop: '20px' }}>Identification & Bank Details</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '28px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>PAN Number *</label>
                <input type="text" name="pan_number" required value={joiningForm.pan_number} onChange={(e) => setJoiningForm(p => ({ ...p, pan_number: e.target.value.toUpperCase() }))} placeholder="ABCDE1234F" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontWeight: 700, textTransform: 'uppercase' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>Aadhaar Number *</label>
                <input type="text" name="aadhaar_number" required value={joiningForm.aadhaar_number} onChange={(e) => setJoiningForm(p => ({ ...p, aadhaar_number: e.target.value.replace(/\D/g, '') }))} placeholder="12 Digit Aadhaar" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontWeight: 700 }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>Bank Account Number *</label>
                <input type="text" name="bank_account_number" required value={joiningForm.bank_account_number} onChange={handleJoiningChange} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontWeight: 700 }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>Bank IFSC Code *</label>
                <input type="text" name="ifsc_code" required value={joiningForm.ifsc_code} onChange={(e) => setJoiningForm(p => ({ ...p, ifsc_code: e.target.value.toUpperCase() }))} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, textTransform: 'uppercase', fontWeight: 700 }} />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              style={{ 
                width: '100%', background: C.teal || '#0F766E', color: '#fff', border: 'none', 
                padding: '16px', borderRadius: '14px', fontSize: '15px', fontWeight: 900, 
                cursor: 'pointer', boxShadow: '0 4px 14px rgba(15, 118, 110, 0.3)'
              }}
            >
              {loading ? 'Submitting Step 1 Details...' : 'Save Step 1 & Continue to Terms & Video Verification →'}
            </button>

          </form>
        )}

        {/* STEP 2 FORM: TERMS & VIDEO VERIFICATION */}
        {activeTab === 2 && (
          <form onSubmit={handleTermsSubmit} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', padding: isMobile ? '20px 16px' : '36px', boxShadow: '0 4px 24px rgba(0,0,0,0.03)' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: `2px solid ${C.teal || '#0F766E'}20`, paddingBottom: '12px' }}>
              <FaVideo style={{ color: C.teal || '#0F766E', fontSize: '20px' }} />
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 900, color: C.teal || '#0F766E', margin: 0 }}>Step 2: Workplace Agreement & Video Verification</h3>
                <p style={{ fontSize: '12px', color: C.textMid, margin: 0 }}>Accept company terms and record/upload a brief video verification statement.</p>
              </div>
            </div>

            {termsCompleted && (
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#166534', padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaCheckCircle style={{ color: '#16A34A' }} /> ✓ Workplace Terms & Video Verification already accepted & uploaded.
              </div>
            )}

            {/* Agreement Box */}
            <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '16px 20px', maxHeight: '160px', overflowY: 'auto', fontSize: '12.5px', lineHeight: 1.6, color: C.textMid, marginBottom: '20px' }}>
              <p style={{ margin: '0 0 6px 0' }}>1. <strong>Incentives:</strong> Employees earn official lead performance incentives per approved application.</p>
              <p style={{ margin: '0 0 6px 0' }}>2. <strong>Confidentiality:</strong> Strict non-disclosure of customer PII and internal financial guidelines.</p>
              <p style={{ margin: 0 }}>3. <strong>Attribution:</strong> All punched leads must carry your assigned employee ID code.</p>
            </div>

            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '12px', background: `${C.teal || '#0F766E'}10`, border: `1px solid ${C.teal || '#0F766E'}30`, padding: '14px 16px', borderRadius: '12px' }}>
              <input type="checkbox" id="accept_unified" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} style={{ marginTop: '3px', width: '18px', height: '18px', cursor: 'pointer' }} />
              <label htmlFor="accept_unified" style={{ fontSize: '13px', fontWeight: 700, color: C.text, cursor: 'pointer', lineHeight: 1.4 }}>
                I have read and accept the GharKaPaisa Employee Workplace Terms & Code of Conduct.
              </label>
            </div>

            {/* Script & Teleprompter */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: 0 }}>Multilingual Teleprompter Script</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '4px 10px' }}>
                <FaLanguage style={{ color: C.teal, fontSize: '16px' }} />
                <select value={selectedLang} onChange={(e) => setSelectedLang(e.target.value)} style={{ background: 'transparent', border: 'none', color: C.text, fontWeight: 800, fontSize: '12px', cursor: 'pointer', outline: 'none' }}>
                  {Object.keys(SCRIPTS).map(k => <option key={k} value={k}>{SCRIPTS[k].label}</option>)}
                </select>
              </div>
            </div>

            <div style={{ background: '#0F2B48', borderRadius: '16px', padding: '20px', color: '#fff', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#2DD4BF', textTransform: 'uppercase' }}>Script ({SCRIPTS[selectedLang].label})</span>
                <button type="button" onClick={handleCopyScript} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                  {copied ? 'Copied!' : 'Copy Script'}
                </button>
              </div>
              <p style={{ fontSize: '15px', fontWeight: 700, lineHeight: 1.5, margin: 0, color: '#F3F4F6' }}>
                "{SCRIPTS[selectedLang].text(joiningForm.full_name)}"
              </p>
            </div>

            {/* Video Input Controls */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <button type="button" onClick={() => setVideoMode('record')} style={{ flex: 1, padding: '10px', borderRadius: '10px', fontWeight: 800, fontSize: '12.5px', cursor: 'pointer', background: videoMode === 'record' ? C.teal : C.bgSecondary, color: videoMode === 'record' ? '#fff' : C.text, border: `1px solid ${C.border}` }}>
                <FaVideo /> Record Live Webcam
              </button>
              <button type="button" onClick={() => { setVideoMode('upload'); stopCameraStream(); }} style={{ flex: 1, padding: '10px', borderRadius: '10px', fontWeight: 800, fontSize: '12.5px', cursor: 'pointer', background: videoMode === 'upload' ? C.teal : C.bgSecondary, color: videoMode === 'upload' ? '#fff' : C.text, border: `1px solid ${C.border}` }}>
                <FaUpload /> Upload Video File
              </button>
            </div>

            {camError && <div style={{ background: '#FEF2F2', color: '#991B1B', padding: '10px', borderRadius: '10px', fontSize: '12px', marginBottom: '16px' }}>⚠️ {camError}</div>}

            {videoMode === 'record' && (
              <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '20px', textAlign: 'center', marginBottom: '24px' }}>
                {!videoPreviewUrl ? (
                  <div>
                    <div style={{ width: '100%', maxWidth: '440px', height: '240px', margin: '0 auto 12px', background: '#000', borderRadius: '12px', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <video ref={videoRef} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {isRecording && <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#DC2626', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>REC {recordingTime}s</div>}
                    </div>
                    {!isRecording ? (
                      <button type="button" onClick={startRecording} style={{ background: '#059669', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}><FaPlay /> Start Recording</button>
                    ) : (
                      <button type="button" onClick={stopRecording} style={{ background: '#DC2626', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}><FaStop /> Stop Recording</button>
                    )}
                  </div>
                ) : (
                  <div>
                    <video src={videoPreviewUrl} controls style={{ maxWidth: '440px', maxHeight: '240px', borderRadius: '12px', marginBottom: '10px' }} />
                    <div><button type="button" onClick={retakeVideo} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, padding: '8px 16px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}><FaRedo /> Retake Video</button></div>
                  </div>
                )}
              </div>
            )}

            {videoMode === 'upload' && (
              <div style={{ background: C.bgSecondary, border: `2px dashed ${C.border}`, borderRadius: '16px', padding: '24px', textAlign: 'center', marginBottom: '24px' }}>
                <input type="file" accept="video/*" onChange={(e) => { if (e.target.files[0]) { setVideoFile(e.target.files[0]); setVideoPreviewUrl(URL.createObjectURL(e.target.files[0])); } }} style={{ fontSize: '13px' }} />
              </div>
            )}

            <button type="submit" disabled={loading || !acceptedTerms || (!videoFile && !existingVideoUrl)} style={{ width: '100%', background: (acceptedTerms && (videoFile || existingVideoUrl)) ? (C.teal || '#0F766E') : C.border, color: '#fff', border: 'none', padding: '16px', borderRadius: '14px', fontSize: '15px', fontWeight: 900, cursor: 'pointer' }}>
              {loading ? 'Saving Step 2 Details...' : 'Save Step 2 & Proceed to Document Upload →'}
            </button>

          </form>
        )}

        {/* STEP 3 FORM: KYC & DOCUMENT UPLOAD */}
        {activeTab === 3 && (
          <form onSubmit={handleKycSubmit} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', padding: isMobile ? '20px 16px' : '36px', boxShadow: '0 4px 24px rgba(0,0,0,0.03)' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: `2px solid ${C.teal || '#0F766E'}20`, paddingBottom: '12px' }}>
              <FaIdCard style={{ color: C.teal || '#0F766E', fontSize: '20px' }} />
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 900, color: C.teal || '#0F766E', margin: 0 }}>Step 3: Document Upload & KYC Verification</h3>
                <p style={{ fontSize: '12px', color: C.textMid, margin: 0 }}>Upload valid PAN, Aadhaar, and Bank proof files for HR/Super Admin approval.</p>
              </div>
            </div>

            {/* Overall KYC Banner */}
            {kycStatus !== 'NOT_SUBMITTED' && (
              <div style={{
                background: kycStatus === 'VERIFIED' ? '#F0FDF4' : (kycStatus === 'REJECTED' ? '#FEF2F2' : '#FFFBEB'),
                border: `1px solid ${kycStatus === 'VERIFIED' ? '#BBF7D0' : (kycStatus === 'REJECTED' ? '#FCA5A5' : '#FDE68A')}`,
                borderRadius: '16px', padding: '16px 20px', marginBottom: '24px'
              }}>
                <h4 style={{ fontSize: '15px', fontWeight: 900, margin: '0 0 4px 0', color: kycStatus === 'VERIFIED' ? '#15803D' : (kycStatus === 'REJECTED' ? '#991B1B' : '#B45309') }}>
                  {kycStatus === 'VERIFIED' ? '✓ Employee KYC Approved & Activated' : (kycStatus === 'REJECTED' ? '❌ KYC Action Required — Upload Corrections Below' : '⏳ KYC Submitted — Under HR Verification')}
                </h4>
                <p style={{ fontSize: '12.5px', margin: 0, color: C.textMid }}>
                  {kycStatus === 'VERIFIED' ? 'All documents verified.' : 'Upload required documents below.'}
                </p>
                {reviewNotes && <div style={{ fontSize: '12px', fontWeight: 800, color: '#991B1B', marginTop: '8px' }}>Admin Note: "{reviewNotes}"</div>}
              </div>
            )}

            {/* PAN Upload */}
            <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '16px 20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <strong style={{ fontSize: '14px', color: C.text }}>1. PAN Card Upload</strong>
                <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: panStatus === 'VERIFIED' ? '#D1FAE5' : (panStatus === 'REJECTED' ? '#FEE2E2' : '#FEF3C7'), color: panStatus === 'VERIFIED' ? '#065F46' : (panStatus === 'REJECTED' ? '#991B1B' : '#92400E') }}>
                  {panStatus}
                </span>
              </div>
              {panReason && <div style={{ fontSize: '11.5px', color: '#EF4444', marginBottom: '8px' }}>⚠️ Rejection Reason: {panReason}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                <input type="text" value={panNum} onChange={(e) => setPanNum(e.target.value.toUpperCase())} placeholder="PAN Number (ABCDE1234F)" style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, color: C.text, fontWeight: 700 }} />
                <input type="file" accept="image/*,.pdf" onChange={(e) => setPanFile(e.target.files[0])} style={{ fontSize: '12px' }} />
              </div>
              {existingPanUrl && <div style={{ marginTop: '8px' }}><a href={existingPanUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11.5px', color: C.teal, fontWeight: 800 }}>View Current PAN File ↗</a></div>}
            </div>

            {/* Aadhaar Upload */}
            <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '16px 20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <strong style={{ fontSize: '14px', color: C.text }}>2. Aadhaar Card Upload</strong>
                <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: aadhaarStatus === 'VERIFIED' ? '#D1FAE5' : (aadhaarStatus === 'REJECTED' ? '#FEE2E2' : '#FEF3C7'), color: aadhaarStatus === 'VERIFIED' ? '#065F46' : (aadhaarStatus === 'REJECTED' ? '#991B1B' : '#92400E') }}>
                  {aadhaarStatus}
                </span>
              </div>
              {aadhaarReason && <div style={{ fontSize: '11.5px', color: '#EF4444', marginBottom: '8px' }}>⚠️ Rejection Reason: {aadhaarReason}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                <input type="text" value={aadhaarNum} onChange={(e) => setAadhaarNum(e.target.value.replace(/\D/g, ''))} placeholder="12 Digit Aadhaar Number" style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, color: C.text, fontWeight: 700 }} />
                <input type="file" accept="image/*,.pdf" onChange={(e) => setAadhaarFile(e.target.files[0])} style={{ fontSize: '12px' }} />
              </div>
              {existingAadhaarUrl && <div style={{ marginTop: '8px' }}><a href={existingAadhaarUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11.5px', color: C.teal, fontWeight: 800 }}>View Current Aadhaar File ↗</a></div>}
            </div>

            {/* Bank Proof Upload */}
            <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '16px 20px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <strong style={{ fontSize: '14px', color: C.text }}>3. Bank Account Proof Upload</strong>
                <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: bankStatus === 'VERIFIED' ? '#D1FAE5' : (bankStatus === 'REJECTED' ? '#FEE2E2' : '#FEF3C7'), color: bankStatus === 'VERIFIED' ? '#065F46' : (bankStatus === 'REJECTED' ? '#991B1B' : '#92400E') }}>
                  {bankStatus}
                </span>
              </div>
              {bankReason && <div style={{ fontSize: '11.5px', color: '#EF4444', marginBottom: '8px' }}>⚠️ Rejection Reason: {bankReason}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '10px' }}>
                <input type="text" value={bankAccNum} onChange={(e) => setBankAccNum(e.target.value)} placeholder="Bank Account Number" style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, color: C.text, fontWeight: 700 }} />
                <input type="text" value={ifsc} onChange={(e) => setIfsc(e.target.value.toUpperCase())} placeholder="IFSC Code" style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, color: C.text, fontWeight: 700, textTransform: 'uppercase' }} />
              </div>
              <input type="file" accept="image/*,.pdf" onChange={(e) => setBankFile(e.target.files[0])} style={{ fontSize: '12px' }} />
              {existingBankUrl && <div style={{ marginTop: '8px' }}><a href={existingBankUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11.5px', color: C.teal, fontWeight: 800 }}>View Current Bank Proof File ↗</a></div>}
            </div>

            <button type="submit" disabled={loading} style={{ width: '100%', background: C.teal || '#0F766E', color: '#fff', border: 'none', padding: '16px', borderRadius: '14px', fontSize: '15px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 16px rgba(15,118,110,0.3)' }}>
              {loading ? 'Submitting & Updating KYC...' : 'Submit & Save KYC Documents'}
            </button>

          </form>
        )}

      </div>
    </div>
  );
}
