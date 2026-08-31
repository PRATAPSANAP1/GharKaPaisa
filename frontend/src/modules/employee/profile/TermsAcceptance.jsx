import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { 
  FaArrowLeft, FaVideo, FaCheckCircle, FaFileContract, FaUpload, 
  FaLanguage, FaCopy, FaPlay, FaStop, FaRedo, FaMicrophone 
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
    text: (name) => `నా పేరు ${name || '[మీ పూర్తి పేరు]'}. నేను ఘర్‌కాపైసా (GharKaPaisa) ఉద్యోగ నిబంధనలు మరియు షరతులను అంగీకరిస్తున్నాను.`
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

export default function TermsAcceptance() {
  const { C } = useTheme();
  const navigate = useNavigate();

  const [accepted, setAccepted] = useState(false);
  const [employeeName, setEmployeeName] = useState('');
  const [selectedLang, setSelectedLang] = useState('en');
  const [copied, setCopied] = useState(false);

  // Mode: 'record' or 'upload'
  const [videoMode, setVideoMode] = useState('record');
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('');

  // MediaRecorder States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [camError, setCamError] = useState('');

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch Employee Profile for Name
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        const res = await axios.get(`${getApiV1Url()}/employee/profile`);
        if (res.data?.success && res.data?.data) {
          const emp = res.data.data.employee || res.data.data;
          if (emp.full_name) setEmployeeName(emp.full_name);
        }
      } catch (e) {
        console.warn('Profile fetch note:', e.message);
      }
    };
    fetchProfile();
  }, []);

  // Clean up media streams on unmount
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

  const handleCopyScript = () => {
    const scriptText = SCRIPTS[selectedLang].text(employeeName);
    navigator.clipboard.writeText(scriptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Start Live Recording
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
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = ''; // Browser default
        }
      }

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' });
        const file = new File([blob], `video_verification_${Date.now()}.${mimeType.includes('mp4') ? 'mp4' : 'webm'}`, { type: blob.type });
        setVideoFile(file);
        const previewUrl = URL.createObjectURL(blob);
        setVideoPreviewUrl(previewUrl);
        stopCameraStream();
      };

      mediaRecorder.start(500); // chunk every 500ms
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Camera access error:', err);
      setCamError('Unable to access camera and microphone. Please allow browser permissions or switch to File Upload mode.');
    }
  };

  // Stop Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // Retake Recording
  const retakeVideo = () => {
    setVideoFile(null);
    setVideoPreviewUrl('');
    setRecordingTime(0);
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    stopCameraStream();
  };

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVideoFile(file);
      setVideoPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accepted) {
      alert('Please check and accept the Employee Workplace Terms & Conditions.');
      return;
    }

    if (!videoFile) {
      alert('Please record or upload a video verification file before submitting.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const payload = new FormData();
      payload.append('accepted', 'true');
      payload.append('terms_version', '1.0');
      payload.append('language_selected', selectedLang);
      payload.append('video', videoFile);

      const res = await axios.post(`${getApiV1Url()}/employee/terms-acceptance`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        setSubmitted(true);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit terms acceptance');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ background: C.bg, minHeight: '100vh', padding: isMobile ? '32px 16px' : '60px 24px', fontFamily: "'Inter', sans-serif", color: C.text }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', padding: isMobile ? '24px 16px' : '40px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          <FaCheckCircle size={56} style={{ color: C.teal || '#0F766E', marginBottom: '16px' }} />
          <h2 style={{ fontSize: isMobile ? '20px' : '26px', fontWeight: 900, margin: '0 0 8px 0', color: C.text }}>
            Terms & Video Verification Completed!
          </h2>
          <p style={{ fontSize: '14px', color: C.textMid, margin: '0 0 24px 0', lineHeight: 1.6 }}>
            Your agreement acceptance and video verification recording have been securely recorded. You can now proceed to upload your KYC documents.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/employee/kyc')} style={{ background: C.teal || '#0F766E', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>
              Upload KYC Documents →
            </button>
            <button onClick={() => navigate('/employee/dashboard')} style={{ background: C.bgSecondary, color: C.text, border: `1px solid ${C.border}`, padding: '12px 24px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: isMobile ? '16px 8px 60px' : '32px 24px 80px', fontFamily: "'Inter', sans-serif", color: C.text }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
          <button onClick={() => navigate('/employee/dashboard')} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.textMid, flexShrink: 0 }}>
            <FaArrowLeft />
          </button>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: C.teal || '#0F766E', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Onboarding Phase 2</span>
            <h1 style={{ fontSize: isMobile ? '20px' : '28px', fontWeight: 900, color: C.text, margin: 0 }}>Terms & Video Verification</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', padding: isMobile ? '20px 16px' : '36px', boxShadow: '0 4px 24px rgba(0,0,0,0.03)' }}>
          
          {/* Terms Container Box */}
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 900, color: C.teal || '#0F766E', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaFileContract /> GharKaPaisa Workplace Agreement
            </h3>
            <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '20px', maxHeight: '200px', overflowY: 'auto', fontSize: '13px', lineHeight: 1.6, color: C.textMid }}>
              <p style={{ margin: '0 0 8px 0' }}>1. <strong>Incentives & Distribution:</strong> Employees are entitled to employee-specific referral link incentives as configured by Super Admin upon successful customer application conversion.</p>
              <p style={{ margin: '0 0 8px 0' }}>2. <strong>Data Confidentiality:</strong> Employees must maintain confidentiality regarding customer data, loan application numbers, and bank credentials.</p>
              <p style={{ margin: '0 0 8px 0' }}>3. <strong>Code of Conduct:</strong> Misrepresentation of financial product features, interest rates, or fees to customer leads is strictly prohibited.</p>
              <p style={{ margin: 0 }}>4. <strong>Attribution:</strong> All credit card & loan applications punched must carry the assigned employee ID for accurate incentive calculation.</p>
            </div>
          </div>

          {/* Terms Checkbox */}
          <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'flex-start', gap: '12px', background: `${C.teal || '#0F766E'}10`, border: `1px solid ${C.teal || '#0F766E'}30`, padding: '16px', borderRadius: '14px' }}>
            <input type="checkbox" id="accept" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} style={{ marginTop: '3px', width: '18px', height: '18px', cursor: 'pointer' }} />
            <label htmlFor="accept" style={{ fontSize: '13.5px', fontWeight: 700, color: C.text, cursor: 'pointer', lineHeight: 1.5 }}>
              I have read, understood, and accept the GharKaPaisa Employee Terms & Workplace Guidelines.
            </label>
          </div>

          {/* Multilingual Script & Video Verification Section */}
          <div style={{ borderTop: `2px dashed ${C.border}`, paddingTop: '28px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '19px', fontWeight: 900, color: C.teal || '#0F766E', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FaVideo /> Video Verification Recording & Teleprompter
                </h3>
                <p style={{ fontSize: '13px', color: C.textMid, margin: 0 }}>
                  Record a short 10–15 second video reading out the script in your preferred language.
                </p>
              </div>

              {/* Language Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '6px 12px' }}>
                <FaLanguage style={{ color: C.teal || '#0F766E', fontSize: '18px' }} />
                <label style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>Script Language:</label>
                <select 
                  value={selectedLang} 
                  onChange={(e) => setSelectedLang(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: C.text, fontWeight: 800, fontSize: '13px', cursor: 'pointer', outline: 'none' }}
                >
                  {Object.keys(SCRIPTS).map((langKey) => (
                    <option key={langKey} value={langKey} style={{ background: C.card, color: C.text }}>
                      {SCRIPTS[langKey].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Script Teleprompter Card */}
            <div style={{ background: 'linear-gradient(135deg, #081424 0%, #0F2B48 100%)', borderRadius: '18px', padding: '24px', color: '#ffffff', marginBottom: '24px', position: 'relative', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ background: 'rgba(45, 212, 191, 0.2)', color: '#2DD4BF', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  📜 Verification Script ({SCRIPTS[selectedLang].label})
                </span>
                <button
                  type="button"
                  onClick={handleCopyScript}
                  style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <FaCopy /> {copied ? 'Copied!' : 'Copy Script'}
                </button>
              </div>

              <p style={{ fontSize: isMobile ? '15px' : '17px', fontWeight: 700, lineHeight: 1.6, margin: 0, color: '#F3F4F6' }}>
                "{SCRIPTS[selectedLang].text(employeeName)}"
              </p>
            </div>

            {/* Mode Switch Tabs: Live Record vs Upload */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => { setVideoMode('record'); setCamError(''); }}
                style={{
                  flex: 1, padding: '12px', borderRadius: '12px', fontWeight: 800, fontSize: '13.5px', cursor: 'pointer',
                  background: videoMode === 'record' ? (C.teal || '#0F766E') : C.bgSecondary,
                  color: videoMode === 'record' ? '#ffffff' : C.text,
                  border: `1px solid ${videoMode === 'record' ? (C.teal || '#0F766E') : C.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                <FaVideo /> Record Live Camera Video
              </button>
              <button
                type="button"
                onClick={() => { setVideoMode('upload'); stopCameraStream(); }}
                style={{
                  flex: 1, padding: '12px', borderRadius: '12px', fontWeight: 800, fontSize: '13.5px', cursor: 'pointer',
                  background: videoMode === 'upload' ? (C.teal || '#0F766E') : C.bgSecondary,
                  color: videoMode === 'upload' ? '#ffffff' : C.text,
                  border: `1px solid ${videoMode === 'upload' ? (C.teal || '#0F766E') : C.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                <FaUpload /> Upload Recorded Video File
              </button>
            </div>

            {camError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '12px 16px', borderRadius: '12px', marginBottom: '16px', fontSize: '13px', fontWeight: 600 }}>
                ⚠️ {camError}
              </div>
            )}

            {/* Mode 1: Live Record Container */}
            {videoMode === 'record' && (
              <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '24px', textAlign: 'center' }}>
                {!videoPreviewUrl ? (
                  <div>
                    <div style={{ width: '100%', maxWidth: '480px', height: '270px', margin: '0 auto 16px', background: '#000', borderRadius: '16px', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <video ref={videoRef} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      
                      {!isRecording && !mediaStreamRef.current && (
                        <div style={{ position: 'absolute', color: '#9CA3AF', textAlign: 'center', padding: '20px' }}>
                          <FaMicrophone size={36} style={{ marginBottom: '8px', color: '#6B7280' }} />
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>Click 'Start Live Recording' to activate camera</p>
                        </div>
                      )}

                      {isRecording && (
                        <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(220, 38, 38, 0.9)', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '8px', height: '8px', background: '#fff', borderRadius: '50%', animation: 'pulse 1s infinite' }} />
                          REC 00:{recordingTime < 10 ? `0${recordingTime}` : recordingTime}
                        </div>
                      )}
                    </div>

                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={startRecording}
                        style={{ background: '#059669', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '12px', fontSize: '14px', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                      >
                        <FaPlay /> Start Live Recording
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopRecording}
                        style={{ background: '#DC2626', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '12px', fontSize: '14px', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                      >
                        <FaStop /> Stop Recording & Save
                      </button>
                    )}
                  </div>
                ) : (
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: '0 0 12px 0' }}>✓ Recorded Video Preview</h4>
                    <div style={{ width: '100%', maxWidth: '480px', height: '270px', margin: '0 auto 16px', background: '#000', borderRadius: '16px', overflow: 'hidden' }}>
                      <video src={videoPreviewUrl} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>

                    <button
                      type="button"
                      onClick={retakeVideo}
                      style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                    >
                      <FaRedo /> Retake Video Recording
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mode 2: File Upload Container */}
            {videoMode === 'upload' && (
              <div style={{ background: C.bgSecondary, border: `2px dashed ${C.border}`, borderRadius: '20px', padding: '32px 24px', textAlign: 'center' }}>
                <FaUpload size={36} style={{ color: C.teal || '#0F766E', marginBottom: '12px' }} />
                <h4 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: '0 0 6px 0' }}>Select Video File from Device</h4>
                <p style={{ fontSize: '12.5px', color: C.textMid, margin: '0 0 16px 0' }}>Accepted formats: MP4, WEBM, MOV (Max size: 25MB)</p>

                <input type="file" accept="video/*" onChange={handleFileUpload} style={{ display: 'block', margin: '0 auto', fontSize: '13px', color: C.text }} />

                {videoPreviewUrl && (
                  <div style={{ marginTop: '20px' }}>
                    <span style={{ display: 'block', fontSize: '12px', color: C.teal || '#0F766E', marginBottom: '8px', fontWeight: 700 }}>
                      Selected: {videoFile?.name} ({(videoFile?.size / 1024 / 1024).toFixed(1)} MB)
                    </span>
                    <video src={videoPreviewUrl} controls style={{ maxWidth: '360px', maxHeight: '200px', borderRadius: '12px', border: `1px solid ${C.border}` }} />
                  </div>
                )}
              </div>
            )}

          </div>

          <button type="submit" disabled={loading || !accepted || !videoFile} style={{ width: '100%', background: (accepted && videoFile) ? (C.teal || '#0F766E') : C.border, color: '#fff', border: 'none', padding: '16px', borderRadius: '14px', fontSize: '16px', fontWeight: 900, cursor: (accepted && videoFile) ? 'pointer' : 'not-allowed', boxShadow: (accepted && videoFile) ? '0 4px 16px rgba(15,118,110,0.3)' : 'none' }}>
            {loading ? 'Submitting Agreement & Video...' : 'Submit Terms & Video Verification'}
          </button>

        </form>

      </div>
    </div>
  );
}
