import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { 
  FaUserCheck, FaFileAlt, FaVideo, FaExclamationTriangle, 
  FaCheckCircle, FaClock, FaTimesCircle, FaUpload, 
  FaEye, FaLock, FaSyncAlt, FaArrowRight, FaShieldAlt, FaIdCard,
  FaCamera, FaUserShield
} from 'react-icons/fa';
import axios from 'axios';
import { getApiV1Url } from '../../../config/api';

import LoadingLogo from '../../../components/Loader/LoadingLogo';
import FaceVerificationModal from './FaceVerificationModal';

export default function EmployeeVerification() {
  const { C } = useTheme();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [verState, setVerState] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState({});
  const [fileInputs, setFileInputs] = useState({});
  const [activeSection, setActiveSection] = useState('documents'); // 'information' | 'documents' | 'video' | 'face'
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [faceModalOpen, setFaceModalOpen] = useState(false);
  const [submittingVerification, setSubmittingVerification] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchVerificationStatus = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const res = await axios.get(`${getApiV1Url()}/employee/verification-status`);
      if (res.data?.success) {
        setVerState(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch verification status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  const handleFileChange = (docType, file) => {
    setFileInputs(prev => ({ ...prev, [docType]: file }));
  };

  const handleUploadDocument = async (docType) => {
    const file = fileInputs[docType];
    if (!file) {
      alert('Please select a file to upload.');
      return;
    }

    setUploadingDoc(prev => ({ ...prev, [docType]: true }));
    try {
      const payload = new FormData();
      payload.append('document_type', docType);
      payload.append('file', file);

      const res = await axios.post(`${getApiV1Url()}/employee/upload-document`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        alert(`✓ ${docType.toUpperCase()} document uploaded successfully for review!`);
        setFileInputs(prev => ({ ...prev, [docType]: null }));
        setVerState(res.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || `Failed to upload ${docType}`);
    } finally {
      setUploadingDoc(prev => ({ ...prev, [docType]: false }));
    }
  };

  const handleSubmitVerification = async () => {
    setSubmittingVerification(true);
    try {
      const token = localStorage.getItem('token');
      if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const res = await axios.post(`${getApiV1Url()}/employee/submit-verification`);
      if (res.data?.success) {
        alert('✓ ' + (res.data.message || 'Verification submitted successfully for HR review!'));
        if (res.data.data) {
          setVerState(res.data.data);
        } else {
          fetchVerificationStatus();
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit verification');
    } finally {
      setSubmittingVerification(false);
    }
  };

  if (loading) {
    return <LoadingLogo fullScreen size={120} />;
  }

  const {
    employee_code,
    full_name,
    overall_status,
    information_status,
    documents_summary,
    approved_docs_count,
    total_docs_count,
    video_status,
    face_status,
    face_biometric_status,
    has_biometric_reference,
    biometric_enrolled_at,
    documents = [],
    missing_items = [],
    missing_document_names = [],
    latest_reminder
  } = verState || {};

  const isOverallVerified = overall_status === 'VERIFIED';
  const isFaceVerified = Boolean(has_biometric_reference || face_status === 'VERIFIED' || face_biometric_status === 'VERIFIED');

  const isInfoDone = information_status === 'VERIFIED' || information_status === 'UNDER_REVIEW';
  const isDocsDone = approved_docs_count === total_docs_count || (documents.length > 0 && documents.every(d => d.status === 'APPROVED' || d.status === 'UNDER_REVIEW'));
  const isVideoDone = video_status === 'VERIFIED' || video_status === 'UNDER_REVIEW';

  const completedCount = (isInfoDone ? 1 : 0) + (isDocsDone ? 1 : 0) + (isVideoDone ? 1 : 0) + (isFaceVerified ? 1 : 0);
  const allStepsReady = completedCount === 4;

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: isMobile ? '16px 12px 60px' : '32px 24px 80px', fontFamily: "'Inter', sans-serif", color: C.text }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        {/* Top Header Card */}
        <div style={{ 
          background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', 
          padding: isMobile ? '20px' : '28px 32px', marginBottom: '24px', 
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          display: 'flex', flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center',
          gap: '20px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 900, color: C.teal, background: `${C.teal}15`, padding: '4px 10px', borderRadius: '8px', letterSpacing: '0.5px' }}>
                CODE: {employee_code || 'GKP-EMP'}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 800, color: C.textMid }}>Employee Verification Portal</span>
            </div>
            <h1 style={{ fontSize: isMobile ? '22px' : '26px', fontWeight: 900, color: C.text, margin: '2px 0 4px 0' }}>
              {full_name}
            </h1>
            <p style={{ fontSize: '13px', color: C.textMid, margin: 0 }}>
              Dynamic State Verification Engine — Information, Documents & Video Check
            </p>
          </div>

          <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: C.textMid, marginBottom: '6px' }}>Overall Status</div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '8px 18px', borderRadius: '30px', fontWeight: 900, fontSize: '13px',
              background: isOverallVerified ? '#D1FAE5' : '#FEF3C7',
              color: isOverallVerified ? '#065F46' : '#92400E',
              border: `1px solid ${isOverallVerified ? '#A7F3D0' : '#FDE68A'}`
            }}>
              {isOverallVerified ? <FaCheckCircle style={{ fontSize: '16px' }} /> : <FaClock style={{ fontSize: '16px' }} />}
              {isOverallVerified ? 'VERIFIED & APPROVED' : 'VERIFICATION PENDING'}
            </div>
          </div>
        </div>

        {/* Dynamic Warning Alert Banner (if pending) */}
        {!isOverallVerified && (
          <div style={{
            background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: '20px',
            padding: '20px 24px', marginBottom: '24px', boxShadow: '0 4px 16px rgba(217, 119, 6, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{ background: '#F59E0B', color: '#fff', borderRadius: '12px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FaExclamationTriangle style={{ fontSize: '20px' }} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#92400E', margin: '0 0 6px 0' }}>
                  Action Required: Complete Employee Verification
                </h3>
                <p style={{ fontSize: '13px', color: '#B45309', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                  Super Admin / HR requires you to complete the pending items below. Once approved, fields will be locked to ensure data integrity.
                </p>

                {latest_reminder && (
                  <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', color: '#78350F', fontWeight: 700, marginBottom: '12px' }}>
                    🔔 <strong>Super Admin Notification:</strong> "{latest_reminder.message}"
                  </div>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {missing_items.map((item, idx) => (
                    <span key={idx} style={{
                      fontSize: '11.5px', fontWeight: 800, padding: '4px 12px', borderRadius: '8px',
                      background: item.status === 'REJECTED' ? '#FEE2E2' : '#FFFFFF',
                      color: item.status === 'REJECTED' ? '#991B1B' : '#92400E',
                      border: `1px solid ${item.status === 'REJECTED' ? '#FCA5A5' : '#FDE68A'}`
                    }}>
                      • {item.text}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step Breakdown Cards Header */}
        <div style={{ 
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' 
        }}>
          {/* Card 1: Information */}
          <div 
            onClick={() => setActiveSection('information')}
            style={{
              background: C.card, border: `2px solid ${activeSection === 'information' ? C.teal : C.border}`,
              borderRadius: '20px', padding: '20px', cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: activeSection === 'information' ? '0 4px 16px rgba(15, 118, 110, 0.15)' : 'none'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${C.teal}15`, color: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FaUserCheck />
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase' }}>Section 1</div>
                  <strong style={{ fontSize: '14px', color: C.text }}>Personal Info</strong>
                </div>
              </div>
              <span style={{
                fontSize: '11px', fontWeight: 900, padding: '3px 10px', borderRadius: '6px',
                background: information_status === 'VERIFIED' ? '#D1FAE5' : '#FEF3C7',
                color: information_status === 'VERIFIED' ? '#065F46' : '#92400E'
              }}>
                {information_status}
              </span>
            </div>
            <p style={{ fontSize: '12px', color: C.textMid, margin: 0 }}>
              {information_status === 'VERIFIED' ? '✓ Profile & bank details verified & locked' : 'Pending verification review'}
            </p>
          </div>

          {/* Card 2: Documents */}
          <div 
            onClick={() => setActiveSection('documents')}
            style={{
              background: C.card, border: `2px solid ${activeSection === 'documents' ? C.teal : C.border}`,
              borderRadius: '20px', padding: '20px', cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: activeSection === 'documents' ? '0 4px 16px rgba(15, 118, 110, 0.15)' : 'none'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${C.teal}15`, color: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FaIdCard />
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase' }}>Section 2</div>
                  <strong style={{ fontSize: '14px', color: C.text }}>Documents</strong>
                </div>
              </div>
              <span style={{
                fontSize: '11px', fontWeight: 900, padding: '3px 10px', borderRadius: '6px',
                background: approved_docs_count === total_docs_count ? '#D1FAE5' : '#FEF3C7',
                color: approved_docs_count === total_docs_count ? '#065F46' : '#92400E'
              }}>
                {documents_summary} Verified
              </span>
            </div>
            <p style={{ fontSize: '12px', color: C.textMid, margin: 0 }}>
              {approved_docs_count === total_docs_count ? '✓ All required documents approved & locked' : `${total_docs_count - approved_docs_count} document(s) need attention`}
            </p>
          </div>

          {/* Card 3: Video */}
          <div 
            onClick={() => setActiveSection('video')}
            style={{
              background: C.card, border: `2px solid ${activeSection === 'video' ? C.teal : C.border}`,
              borderRadius: '20px', padding: '20px', cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: activeSection === 'video' ? '0 4px 16px rgba(15, 118, 110, 0.15)' : 'none'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${C.teal}15`, color: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FaVideo />
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase' }}>Section 3</div>
                  <strong style={{ fontSize: '14px', color: C.text }}>Video Check</strong>
                </div>
              </div>
              <span style={{
                fontSize: '11px', fontWeight: 900, padding: '3px 10px', borderRadius: '6px',
                background: video_status === 'VERIFIED' ? '#D1FAE5' : '#FEF3C7',
                color: video_status === 'VERIFIED' ? '#065F46' : '#92400E'
              }}>
                {video_status}
              </span>
            </div>
            <p style={{ fontSize: '12px', color: C.textMid, margin: 0 }}>
              {video_status === 'VERIFIED' ? '✓ Teleprompter video verified' : 'Upload or record video acceptance'}
            </p>
          </div>

          {/* Card 4: Face Verification */}
          <div 
            onClick={() => setActiveSection('face')}
            style={{
              background: C.card, border: `2px solid ${activeSection === 'face' ? C.teal : C.border}`,
              borderRadius: '20px', padding: '20px', cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: activeSection === 'face' ? '0 4px 16px rgba(15, 118, 110, 0.15)' : 'none'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${C.teal}15`, color: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FaUserShield />
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase' }}>Section 4</div>
                  <strong style={{ fontSize: '14px', color: C.text }}>Face Verification</strong>
                </div>
              </div>
              <span style={{
                fontSize: '11px', fontWeight: 900, padding: '3px 10px', borderRadius: '6px',
                background: isFaceVerified ? '#D1FAE5' : '#FEF3C7',
                color: isFaceVerified ? '#065F46' : '#92400E'
              }}>
                {isFaceVerified ? 'VERIFIED' : 'PENDING'}
              </span>
            </div>
            <p style={{ fontSize: '12px', color: C.textMid, margin: 0 }}>
              {isFaceVerified ? '✓ 3D Face biometric reference active' : 'Biometric camera check required'}
            </p>
          </div>
        </div>

        {/* SECTION 2: DOCUMENTS LIST (STATE-DRIVEN WORKFLOW) */}
        {activeSection === 'documents' && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', padding: isMobile ? '20px' : '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: `1px solid ${C.border}`, paddingBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 900, color: C.text, margin: 0 }}>Required Employee Documents</h3>
                <p style={{ fontSize: '12.5px', color: C.textMid, margin: '2px 0 0 0' }}>
                  Approved documents are locked for security. Rejected or missing documents allow re-upload.
                </p>
              </div>
              <button 
                type="button" 
                onClick={fetchVerificationStatus}
                style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, padding: '8px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <FaSyncAlt /> Refresh Status
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {documents.map((doc, idx) => {
                const isApproved = doc.status === 'APPROVED';
                const isRejected = doc.status === 'REJECTED';
                const isUnderReview = doc.status === 'UNDER_REVIEW';
                const isNotStarted = doc.status === 'NOT_STARTED';

                return (
                  <div key={idx} style={{
                    background: C.bgSecondary,
                    border: `1.5px solid ${isApproved ? '#A7F3D0' : (isRejected ? '#FCA5A5' : (isUnderReview ? '#FDE68A' : C.border))}`,
                    borderRadius: '18px', padding: '20px', position: 'relative',
                    transition: 'all 0.2s'
                  }}>
                    
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <strong style={{ fontSize: '14.5px', color: C.text, fontWeight: 900 }}>
                        {doc.label}
                      </strong>

                      {/* Status Badge */}
                      <span style={{
                        fontSize: '11px', fontWeight: 900, padding: '4px 10px', borderRadius: '8px',
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        background: isApproved ? '#D1FAE5' : (isRejected ? '#FEE2E2' : (isUnderReview ? '#FEF3C7' : '#E5E7EB')),
                        color: isApproved ? '#065F46' : (isRejected ? '#991B1B' : (isUnderReview ? '#92400E' : '#374151'))
                      }}>
                        {isApproved && <FaCheckCircle />}
                        {isRejected && <FaTimesCircle />}
                        {isUnderReview && <FaClock />}
                        {isNotStarted && <FaExclamationTriangle />}
                        {isApproved ? 'APPROVED' : (isRejected ? 'REJECTED' : (isUnderReview ? 'UNDER REVIEW' : 'NOT UPLOADED'))}
                      </span>
                    </div>

                    {/* Rejection Reason Notice */}
                    {isRejected && (
                      <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '10px 12px', borderRadius: '10px', fontSize: '12px', color: '#991B1B', fontWeight: 700, marginBottom: '12px' }}>
                        ⚠️ Rejection Reason: "{doc.rejection_reason || 'Please upload a clearer copy'}"
                      </div>
                    )}

                    {/* Approved Locked Banner */}
                    {isApproved && (
                      <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '8px 12px', borderRadius: '10px', fontSize: '11.5px', color: '#166534', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FaLock style={{ fontSize: '11px' }} /> Document verified & locked. Modification disabled.
                      </div>
                    )}

                    {/* Action Controls */}
                    <div>
                      {/* View Button if URL exists */}
                      {doc.file_url && (
                        <a 
                          href={doc.file_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            fontSize: '12px', fontWeight: 800, color: C.teal,
                            marginBottom: (isRejected || isNotStarted) ? '12px' : '0', textDecoration: 'none'
                          }}
                        >
                          <FaEye /> View Uploaded Document ↗
                        </a>
                      )}

                      {/* File Upload Controls for Not Uploaded or Rejected State */}
                      {(isNotStarted || isRejected) && (
                        <div style={{ marginTop: doc.file_url ? '8px' : '0' }}>
                          <input 
                            type="file" 
                            accept="image/*,.pdf"
                            onChange={(e) => handleFileChange(doc.type, e.target.files[0])}
                            style={{ fontSize: '12px', marginBottom: '10px', width: '100%' }}
                          />
                          <button
                            type="button"
                            disabled={!fileInputs[doc.type] || uploadingDoc[doc.type]}
                            onClick={() => handleUploadDocument(doc.type)}
                            style={{
                              width: '100%', padding: '10px', borderRadius: '10px', border: 'none',
                              background: fileInputs[doc.type] ? (C.teal || '#0F766E') : C.border,
                              color: '#ffffff', fontWeight: 800, fontSize: '12.5px', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                            }}
                          >
                            <FaUpload /> {uploadingDoc[doc.type] ? 'Uploading File...' : (isRejected ? 'Re-upload Correct Document' : 'Upload Document')}
                          </button>
                        </div>
                      )}

                      {/* Under Review Disabled Notice */}
                      {isUnderReview && (
                        <div style={{ fontSize: '11.5px', color: '#B45309', fontWeight: 700, marginTop: '6px' }}>
                          ⏳ File is undergoing verification review by Super Admin.
                        </div>
                      )}

                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* SECTION 1: INFORMATION VIEW */}
        {activeSection === 'information' && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', padding: isMobile ? '20px' : '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: `1px solid ${C.border}`, paddingBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 900, color: C.text, margin: 0 }}>Employee Personal & Bank Information</h3>
                <p style={{ fontSize: '12.5px', color: C.textMid, margin: '2px 0 0 0' }}>
                  Information status: <strong>{information_status}</strong>
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => navigate('/employee/joining-form')}
                disabled={information_status === 'VERIFIED'}
                style={{ background: information_status === 'VERIFIED' ? C.border : C.teal, color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '12px', fontSize: '12.5px', fontWeight: 800, cursor: 'pointer' }}
              >
                {information_status === 'VERIFIED' ? '🔒 Information Locked' : 'Edit Joining Information'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div style={{ background: C.bgSecondary, padding: '14px', borderRadius: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase' }}>Full Name</div>
                <strong style={{ fontSize: '14px', color: C.text }}>{full_name}</strong>
              </div>

              <div style={{ background: C.bgSecondary, padding: '14px', borderRadius: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase' }}>Employee Code</div>
                <strong style={{ fontSize: '14px', color: C.teal }}>{employee_code}</strong>
              </div>

              <div style={{ background: C.bgSecondary, padding: '14px', borderRadius: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase' }}>Information Status</div>
                <strong style={{ fontSize: '14px', color: information_status === 'VERIFIED' ? '#059669' : '#D97706' }}>{information_status}</strong>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: VIDEO VERIFICATION VIEW */}
        {activeSection === 'video' && (
          <div style={{ background: C.card, border: `1px solid ${video_status === 'REJECTED' ? '#FCA5A5' : C.border}`, borderRadius: '24px', padding: isMobile ? '20px' : '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: `1px solid ${C.border}`, paddingBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 900, color: C.text, margin: 0 }}>Video Teleprompter Verification</h3>
                <p style={{ fontSize: '12.5px', color: C.textMid, margin: '2px 0 0 0' }}>
                  Video status: <strong style={{ color: video_status === 'VERIFIED' ? '#059669' : (video_status === 'REJECTED' ? '#DC2626' : '#D97706') }}>{video_status}</strong>
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => navigate('/employee/terms')}
                style={{ background: video_status === 'REJECTED' ? '#DC2626' : C.teal, color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '12px', fontSize: '12.5px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <FaVideo /> {video_status === 'REJECTED' ? 'Re-record Video Now' : 'Go to Video Recorder Wizard →'}
              </button>
            </div>

            {/* Video Rejection Banner */}
            {video_status === 'REJECTED' && (
              <div style={{ background: '#FEF2F2', border: '1.5px solid #FCA5A5', padding: '16px 20px', borderRadius: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <FaExclamationTriangle style={{ color: '#DC2626', fontSize: '20px' }} />
                  <strong style={{ fontSize: '15px', color: '#991B1B', fontWeight: 900 }}>⚠️ Video Verification Rejected by Admin</strong>
                </div>
                <p style={{ fontSize: '13px', color: '#991B1B', margin: '0 0 10px 0', lineHeight: 1.5 }}>
                  Your previous video recording was rejected. Please re-record your video verification using the teleprompter wizard.
                </p>
                <div style={{ background: '#FFFFFF', border: '1px solid #FCA5A5', padding: '10px 14px', borderRadius: '10px', fontSize: '12.5px', color: '#991B1B', fontWeight: 800 }}>
                  🚨 <strong>Rejection Reason:</strong> "{verState.video_notes || (missing_items.find(i => i.type === 'video' && i.status === 'REJECTED')?.reason) || 'Video verification failed review. Please record a clear video with proper audio.'}"
                </div>
              </div>
            )}

            {verState.video_url ? (
              <div style={{ textAlign: 'center', padding: '20px', background: C.bgSecondary, borderRadius: '16px' }}>
                <video src={verState.video_url} controls style={{ maxWidth: '100%', maxHeight: '360px', borderRadius: '14px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <div style={{ marginTop: '12px', fontSize: '13px', fontWeight: 800, color: video_status === 'VERIFIED' ? '#059669' : (video_status === 'REJECTED' ? '#DC2626' : '#D97706') }}>
                  Status: {video_status}
                </div>
                {video_status === 'REJECTED' && (
                  <div style={{ marginTop: '16px' }}>
                    <button type="button" onClick={() => navigate('/employee/terms')} style={{ background: '#DC2626', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 900, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <FaVideo /> Re-record & Submit New Video
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: C.bgSecondary, borderRadius: '16px' }}>
                <FaVideo style={{ fontSize: '36px', color: C.textMid, marginBottom: '12px' }} />
                <h4 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 6px 0' }}>No Video Verification Recorded Yet</h4>
                <p style={{ fontSize: '13px', color: C.textMid, marginBottom: '16px' }}>Please complete your 15-second teleprompter video recording.</p>
                <button type="button" onClick={() => navigate('/employee/terms')} style={{ background: C.teal, color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 900, cursor: 'pointer' }}>
                  Start Video Recording Now
                </button>
              </div>
            )}
          </div>
        )}

        {/* SECTION 4: FACE BIOMETRIC VERIFICATION VIEW */}
        {activeSection === 'face' && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', padding: isMobile ? '20px' : '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: `1px solid ${C.border}`, paddingBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 900, color: C.text, margin: 0 }}>Face Biometric Verification</h3>
                <p style={{ fontSize: '12.5px', color: C.textMid, margin: '2px 0 0 0' }}>
                  Biometric Face Reference Status: <strong style={{ color: isFaceVerified ? '#059669' : '#D97706' }}>{isFaceVerified ? 'VERIFIED & ENROLLED' : 'ACTION REQUIRED'}</strong>
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setFaceModalOpen(true)}
                style={{ 
                  background: isFaceVerified ? C.bgSecondary : C.teal, 
                  color: isFaceVerified ? C.text : '#fff', 
                  border: isFaceVerified ? `1px solid ${C.border}` : 'none', 
                  padding: '10px 18px', borderRadius: '12px', fontSize: '12.5px', fontWeight: 800, 
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                  boxShadow: isFaceVerified ? 'none' : '0 4px 14px rgba(15, 118, 110, 0.25)'
                }}
              >
                <FaCamera /> {isFaceVerified ? 'Re-enroll Face Snapshot' : 'Start Face Verification Now →'}
              </button>
            </div>

            {isFaceVerified ? (
              <div style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: '20px', padding: isMobile ? '20px 16px' : '32px 24px', textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#D1FAE5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '28px' }}>
                  <FaShieldAlt />
                </div>
                <h4 style={{ fontSize: '18px', fontWeight: 900, color: '#065F46', margin: '0 0 8px 0' }}>
                  ✓ Biometric Face Reference Verified & Active
                </h4>
                <p style={{ fontSize: '13.5px', color: '#047857', maxWidth: '540px', margin: '0 auto 16px', lineHeight: 1.6 }}>
                  Your live 3D facial biometric reference is securely linked to your profile. This reference is used for daily attendance facial recognition, GPS punch-in validation, and fraud protection.
                </p>
                {biometric_enrolled_at && (
                  <div style={{ display: 'inline-block', background: '#FFFFFF', border: '1px solid #A7F3D0', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', color: '#065F46', fontWeight: 700, marginBottom: '20px' }}>
                    Reference Enrolled: {new Date(biometric_enrolled_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
                <div>
                  <button 
                    type="button" 
                    onClick={() => setFaceModalOpen(true)}
                    style={{ background: '#FFFFFF', color: '#065F46', border: '1.5px solid #059669', padding: '10px 20px', borderRadius: '12px', fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    <FaSyncAlt /> Update / Re-capture Face Snapshot
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: isMobile ? '24px 16px' : '40px 24px', background: C.bgSecondary, borderRadius: '20px', border: `1px dashed ${C.border}` }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: `${C.teal}15`, color: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '26px' }}>
                  <FaCamera />
                </div>
                <h4 style={{ fontSize: '17px', fontWeight: 900, color: C.text, margin: '0 0 8px 0' }}>
                  Face Biometric Snapshot Required
                </h4>
                <p style={{ fontSize: '13px', color: C.textMid, maxWidth: '480px', margin: '0 auto 20px', lineHeight: 1.6 }}>
                  Take a quick 5-second camera selfie check to register your facial reference. This ensures secure identity verification and enables automated daily attendance punch-ins.
                </p>

                {/* Instructions Pills */}
                <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '24px' }}>
                  <span style={{ background: C.card, border: `1px solid ${C.border}`, padding: '6px 14px', borderRadius: '20px', fontSize: '12px', color: C.text, fontWeight: 700 }}>
                    💡 Good Lighting
                  </span>
                  <span style={{ background: C.card, border: `1px solid ${C.border}`, padding: '6px 14px', borderRadius: '20px', fontSize: '12px', color: C.text, fontWeight: 700 }}>
                    🕶️ Remove Caps & Glasses
                  </span>
                  <span style={{ background: C.card, border: `1px solid ${C.border}`, padding: '6px 14px', borderRadius: '20px', fontSize: '12px', color: C.text, fontWeight: 700 }}>
                    📷 Face Centered in Frame
                  </span>
                </div>

                <button 
                  type="button" 
                  onClick={() => setFaceModalOpen(true)}
                  style={{
                    background: C.teal, color: '#ffffff', border: 'none',
                    padding: '14px 28px', borderRadius: '14px', fontWeight: 900, fontSize: '14px',
                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '10px',
                    boxShadow: '0 6px 20px rgba(15, 118, 110, 0.3)'
                  }}
                >
                  <FaCamera style={{ fontSize: '16px' }} /> Start Camera Face Verification Now
                </button>
              </div>
            )}
          </div>
        )}

        {/* SUBMIT VERIFICATION SECTION */}
        <div style={{
          marginTop: '28px', background: C.card, border: `1px solid ${isOverallVerified ? '#A7F3D0' : C.border}`,
          borderRadius: '24px', padding: isMobile ? '20px' : '28px 32px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
          display: 'flex', flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center',
          gap: '20px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{
                fontSize: '11px', fontWeight: 900, padding: '3px 10px', borderRadius: '8px',
                background: isOverallVerified ? '#D1FAE5' : (allStepsReady ? '#E0F2FE' : '#FEF3C7'),
                color: isOverallVerified ? '#065F46' : (allStepsReady ? '#0369A1' : '#92400E')
              }}>
                {isOverallVerified ? 'ALL VERIFIED' : (allStepsReady ? 'READY FOR FINAL SUBMISSION' : 'VERIFICATION IN PROGRESS')}
              </span>
              <span style={{ fontSize: '12.5px', fontWeight: 800, color: C.textMid }}>
                {completedCount}/4 Steps Complete
              </span>
            </div>
            <h3 style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: 900, color: C.text, margin: '0 0 6px 0' }}>
              Submit Employee Verification Package
            </h3>
            <p style={{ fontSize: '13px', color: C.textMid, margin: 0, maxWidth: '580px', lineHeight: 1.5 }}>
              {isOverallVerified 
                ? 'Your verification is fully approved and locked by Super Admin / HR.' 
                : 'Click submit below to transmit your completed personal information, documents, video recording, and face biometric snapshot for administrative review.'}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: isMobile ? '100%' : '260px' }}>
            <button
              type="button"
              disabled={submittingVerification || isOverallVerified}
              onClick={handleSubmitVerification}
              style={{
                padding: '14px 24px', borderRadius: '14px', border: 'none',
                background: isOverallVerified ? '#059669' : (allStepsReady ? C.teal : '#0284C7'),
                color: '#ffffff', fontWeight: 900, fontSize: '14px',
                cursor: (submittingVerification || isOverallVerified) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                boxShadow: isOverallVerified ? 'none' : '0 6px 20px rgba(15, 118, 110, 0.25)',
                opacity: (submittingVerification || isOverallVerified) ? 0.75 : 1
              }}
            >
              {submittingVerification ? (
                <>Submitting Verification...</>
              ) : isOverallVerified ? (
                <><FaCheckCircle /> Verification Complete</>
              ) : (
                <><FaShieldAlt /> Submit Verification for Review <FaArrowRight /></>
              )}
            </button>
            {!isOverallVerified && !allStepsReady && (
              <span style={{ fontSize: '11px', color: C.textMid, textAlign: 'center', fontWeight: 700 }}>
                💡 You can submit now or complete remaining steps first.
              </span>
            )}
          </div>
        </div>

        {/* Face Verification Modal */}
        <FaceVerificationModal
          isOpen={faceModalOpen}
          onClose={() => setFaceModalOpen(false)}
          onSuccess={() => {
            setFaceModalOpen(false);
            fetchVerificationStatus();
          }}
        />

      </div>
    </div>
  );
}
