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
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);
  const [isNarrowMobile, setIsNarrowMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 390 : false);
  const [faceModalOpen, setFaceModalOpen] = useState(false);
  const [submittingVerification, setSubmittingVerification] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      setIsNarrowMobile(window.innerWidth < 390);
    };
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
    <div style={{ background: C.bg, minHeight: '100vh', padding: isMobile ? '16px 12px 80px' : '24px 24px 80px', fontFamily: "'Inter', sans-serif", color: C.text }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>

        {/* Top Header Card */}
        <div style={{
          background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px',
          padding: isMobile ? '18px 16px' : '24px 28px', marginBottom: '20px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          display: 'flex', flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center',
          gap: '16px'
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: C.teal, background: `${C.teal}15`, padding: '4px 10px', borderRadius: '6px', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
                {employee_code || 'GKP-EMP'}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>Employee Verification</span>
            </div>
            <h1 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 800, color: C.text, margin: '0 0 4px 0', lineHeight: 1.2 }}>
              {full_name}
            </h1>
            <p style={{ fontSize: '13px', color: C.textMid, margin: 0, lineHeight: 1.4 }}>
              Complete your verification: personal information, documents, video check, and face biometric
            </p>
          </div>

          <div style={{ flexShrink: 0, textAlign: isMobile ? 'left' : 'right' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '8px 16px', borderRadius: '24px', fontWeight: 800, fontSize: '12px',
              background: isOverallVerified ? C.greenLight : C.goldLight,
              color: isOverallVerified ? C.green : C.gold,
              border: `1px solid ${isOverallVerified ? '#BBF7D0' : '#FDE68A'}`
            }}>
              {isOverallVerified ? <FaCheckCircle style={{ fontSize: '14px' }} /> : <FaClock style={{ fontSize: '14px' }} />}
              {isOverallVerified ? 'VERIFIED' : 'PENDING'}
            </div>
          </div>
        </div>

        {/* Dynamic Warning Alert Banner (if pending) */}
        {!isOverallVerified && (
          <div style={{
            background: C.goldLight, border: `1px solid ${C.gold}`, borderRadius: '16px',
            padding: isMobile ? '16px' : '18px 20px', marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ background: C.gold, color: '#fff', borderRadius: '10px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FaExclamationTriangle style={{ fontSize: '16px' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: isMobile ? '14px' : '15px', fontWeight: 800, color: '#92400E', margin: '0 0 6px 0' }}>
                  Action Required
                </h3>
                <p style={{ fontSize: '13px', color: '#B45309', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                  Complete pending items. Once approved, fields will be locked.
                </p>

                {latest_reminder && (
                  <div style={{ background: '#FFFFFF', border: '1px solid #FDE68A', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', color: '#78350F', fontWeight: 700, marginBottom: '10px' }}>
                    "{latest_reminder.message}"
                  </div>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {missing_items.map((item, idx) => (
                    <span key={idx} style={{
                      fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px',
                      background: item.status === 'REJECTED' ? '#FEE2E2' : '#FFFFFF',
                      color: item.status === 'REJECTED' ? '#991B1B' : '#92400E',
                      border: `1px solid ${item.status === 'REJECTED' ? '#FCA5A5' : '#FDE68A'}`
                    }}>
                      {item.text}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step Breakdown Cards Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isNarrowMobile ? '1fr' : isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: isMobile ? '12px' : '16px',
          marginBottom: '24px'
        }}>
          {/* Card 1: Information */}
          <div
            onClick={() => setActiveSection('information')}
            style={{
              background: C.card, border: `2px solid ${activeSection === 'information' ? C.teal : C.border}`,
              borderRadius: '14px', padding: isMobile ? '14px' : '16px', cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: activeSection === 'information' ? '0 2px 12px rgba(15, 118, 110, 0.12)' : 'none'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${C.teal}15`, color: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FaUserCheck style={{ fontSize: '14px' }} />
                </div>
                <div>
                  <strong style={{ fontSize: isMobile ? '13px' : '14px', color: C.text, fontWeight: 700 }}>Personal Info</strong>
                </div>
              </div>
              <span style={{
                fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '5px',
                background: information_status === 'VERIFIED' ? C.greenLight : C.goldLight,
                color: information_status === 'VERIFIED' ? C.green : C.gold,
                textTransform: 'uppercase'
              }}>
                {information_status}
              </span>
            </div>
            <p style={{ fontSize: '11px', color: C.textMid, margin: 0, lineHeight: 1.3 }}>
              {information_status === 'VERIFIED' ? 'Verified & locked' : 'Pending review'}
            </p>
          </div>

          {/* Card 2: Documents */}
          <div
            onClick={() => setActiveSection('documents')}
            style={{
              background: C.card, border: `2px solid ${activeSection === 'documents' ? C.teal : C.border}`,
              borderRadius: '14px', padding: isMobile ? '14px' : '16px', cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: activeSection === 'documents' ? '0 2px 12px rgba(15, 118, 110, 0.12)' : 'none'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${C.teal}15`, color: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FaIdCard style={{ fontSize: '14px' }} />
                </div>
                <div>
                  <strong style={{ fontSize: isMobile ? '13px' : '14px', color: C.text, fontWeight: 700 }}>Documents</strong>
                </div>
              </div>
              <span style={{
                fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '5px',
                background: approved_docs_count === total_docs_count ? C.greenLight : C.goldLight,
                color: approved_docs_count === total_docs_count ? C.green : C.gold,
                textTransform: 'uppercase'
              }}>
                {documents_summary}
              </span>
            </div>
            <p style={{ fontSize: '11px', color: C.textMid, margin: 0, lineHeight: 1.3 }}>
              {approved_docs_count === total_docs_count ? 'All approved' : `${total_docs_count - approved_docs_count} pending`}
            </p>
          </div>

          {/* Card 3: Video */}
          <div
            onClick={() => setActiveSection('video')}
            style={{
              background: C.card, border: `2px solid ${activeSection === 'video' ? C.teal : C.border}`,
              borderRadius: '14px', padding: isMobile ? '14px' : '16px', cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: activeSection === 'video' ? '0 2px 12px rgba(15, 118, 110, 0.12)' : 'none'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${C.teal}15`, color: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FaVideo style={{ fontSize: '14px' }} />
                </div>
                <div>
                  <strong style={{ fontSize: isMobile ? '13px' : '14px', color: C.text, fontWeight: 700 }}>Video Check</strong>
                </div>
              </div>
              <span style={{
                fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '5px',
                background: video_status === 'VERIFIED' ? C.greenLight : C.goldLight,
                color: video_status === 'VERIFIED' ? C.green : C.gold,
                textTransform: 'uppercase'
              }}>
                {video_status}
              </span>
            </div>
            <p style={{ fontSize: '11px', color: C.textMid, margin: 0, lineHeight: 1.3 }}>
              {video_status === 'VERIFIED' ? 'Verified' : 'Record teleprompter video'}
            </p>
          </div>

          {/* Card 4: Face Verification */}
          <div
            onClick={() => setActiveSection('face')}
            style={{
              background: C.card, border: `2px solid ${activeSection === 'face' ? C.teal : C.border}`,
              borderRadius: '14px', padding: isMobile ? '14px' : '16px', cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: activeSection === 'face' ? '0 2px 12px rgba(15, 118, 110, 0.12)' : 'none'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${C.teal}15`, color: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FaUserShield style={{ fontSize: '14px' }} />
                </div>
                <div>
                  <strong style={{ fontSize: isMobile ? '13px' : '14px', color: C.text, fontWeight: 700 }}>Face Verification</strong>
                </div>
              </div>
              <span style={{
                fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '5px',
                background: isFaceVerified ? C.greenLight : C.goldLight,
                color: isFaceVerified ? C.green : C.gold,
                textTransform: 'uppercase'
              }}>
                {isFaceVerified ? 'VERIFIED' : 'PENDING'}
              </span>
            </div>
            <p style={{ fontSize: '11px', color: C.textMid, margin: 0, lineHeight: 1.3 }}>
              {isFaceVerified ? 'Biometric active' : 'Camera check required'}
            </p>
          </div>
        </div>

        {/* SECTION 2: DOCUMENTS LIST (STATE-DRIVEN WORKFLOW) */}
        {activeSection === 'documents' && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: isMobile ? '16px' : '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: `1px solid ${C.border}`, paddingBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 800, color: C.text, margin: 0 }}>Required Documents</h3>
                <p style={{ fontSize: '12px', color: C.textMid, margin: '2px 0 0 0' }}>
                  Approved documents are locked. Rejected or missing documents allow re-upload.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchVerificationStatus}
                style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
              >
                <FaSyncAlt style={{ fontSize: '12px' }} /> Refresh
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isNarrowMobile ? '1fr' : isMobile ? 'repeat(auto-fit, minmax(280px, 1fr))' : 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {documents.map((doc, idx) => {
                const isApproved = doc.status === 'APPROVED';
                const isRejected = doc.status === 'REJECTED';
                const isUnderReview = doc.status === 'UNDER_REVIEW';
                const isNotStarted = doc.status === 'NOT_STARTED';

                return (
                  <div key={idx} style={{
                    background: C.bgSecondary,
                    border: `1.5px solid ${isApproved ? '#A7F3D0' : (isRejected ? '#FCA5A5' : (isUnderReview ? '#FDE68A' : C.border))}`,
                    borderRadius: '12px', padding: isMobile ? '14px' : '16px', position: 'relative',
                    transition: 'all 0.2s'
                  }}>

                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', gap: '8px' }}>
                      <strong style={{ fontSize: '14px', color: C.text, fontWeight: 700, flex: 1, minWidth: 0 }}>
                        {doc.label}
                      </strong>

                      {/* Status Badge */}
                      <span style={{
                        fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '5px',
                        display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0,
                        background: isApproved ? C.greenLight : (isRejected ? '#FEE2E2' : (isUnderReview ? C.goldLight : '#E5E7EB')),
                        color: isApproved ? C.green : (isRejected ? '#991B1B' : (isUnderReview ? C.gold : '#374151')),
                        textTransform: 'uppercase'
                      }}>
                        {isApproved && <FaCheckCircle style={{ fontSize: '10px' }} />}
                        {isRejected && <FaTimesCircle style={{ fontSize: '10px' }} />}
                        {isUnderReview && <FaClock style={{ fontSize: '10px' }} />}
                        {isNotStarted && <FaExclamationTriangle style={{ fontSize: '10px' }} />}
                        {isApproved ? 'APPROVED' : (isRejected ? 'REJECTED' : (isUnderReview ? 'REVIEW' : 'PENDING'))}
                      </span>
                    </div>

                    {/* Rejection Reason Notice */}
                    {isRejected && (
                      <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '8px 10px', borderRadius: '8px', fontSize: '11px', color: '#991B1B', fontWeight: 700, marginBottom: '10px' }}>
                        "{doc.rejection_reason || 'Please upload a clearer copy'}"
                      </div>
                    )}

                    {/* Approved Locked Banner */}
                    {isApproved && (
                      <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '6px 10px', borderRadius: '8px', fontSize: '11px', color: '#166534', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FaLock style={{ fontSize: '10px' }} /> Verified & locked
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
                            fontSize: '12px', fontWeight: 700, color: C.teal,
                            marginBottom: (isRejected || isNotStarted) ? '10px' : '0', textDecoration: 'none'
                          }}
                        >
                          <FaEye style={{ fontSize: '12px' }} /> View document
                        </a>
                      )}

                      {/* File Upload Controls for Not Uploaded or Rejected State */}
                      {(isNotStarted || isRejected) && (
                        <div style={{ marginTop: doc.file_url ? '8px' : '0' }}>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => handleFileChange(doc.type, e.target.files[0])}
                            style={{ fontSize: '12px', marginBottom: '8px', width: '100%' }}
                          />
                          <button
                            type="button"
                            disabled={!fileInputs[doc.type] || uploadingDoc[doc.type]}
                            onClick={() => handleUploadDocument(doc.type)}
                            style={{
                              width: '100%', padding: '10px', borderRadius: '8px', border: 'none',
                              background: fileInputs[doc.type] ? C.teal : C.border,
                              color: '#ffffff', fontWeight: 700, fontSize: '12px', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                            }}
                          >
                            <FaUpload style={{ fontSize: '12px' }} /> {uploadingDoc[doc.type] ? 'Uploading...' : (isRejected ? 'Re-upload' : 'Upload')}
                          </button>
                        </div>
                      )}

                      {/* Under Review Disabled Notice */}
                      {isUnderReview && (
                        <div style={{ fontSize: '11px', color: C.gold, fontWeight: 700, marginTop: '6px' }}>
                          ⏳ Under review by admin
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
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: isMobile ? '16px' : '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: `1px solid ${C.border}`, paddingBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 800, color: C.text, margin: 0 }}>Personal & Bank Information</h3>
                <p style={{ fontSize: '12px', color: C.textMid, margin: '2px 0 0 0' }}>
                  Status: <strong style={{ color: information_status === 'VERIFIED' ? C.green : C.gold }}>{information_status}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/employee/joining-form')}
                disabled={information_status === 'VERIFIED'}
                style={{ background: information_status === 'VERIFIED' ? C.border : C.teal, color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
              >
                {information_status === 'VERIFIED' ? '🔒 Locked' : 'Edit Information'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isNarrowMobile ? '1fr' : isMobile ? 'repeat(auto-fit, minmax(200px, 1fr))' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <div style={{ background: C.bgSecondary, padding: '12px', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: C.textMid, textTransform: 'uppercase', marginBottom: '4px' }}>Full Name</div>
                <strong style={{ fontSize: '14px', color: C.text }}>{full_name}</strong>
              </div>

              <div style={{ background: C.bgSecondary, padding: '12px', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: C.textMid, textTransform: 'uppercase', marginBottom: '4px' }}>Employee Code</div>
                <strong style={{ fontSize: '14px', color: C.teal }}>{employee_code}</strong>
              </div>

              <div style={{ background: C.bgSecondary, padding: '12px', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: C.textMid, textTransform: 'uppercase', marginBottom: '4px' }}>Status</div>
                <strong style={{ fontSize: '14px', color: information_status === 'VERIFIED' ? C.green : C.gold }}>{information_status}</strong>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: VIDEO VERIFICATION VIEW */}
        {activeSection === 'video' && (
          <div style={{ background: C.card, border: `1px solid ${video_status === 'REJECTED' ? '#FCA5A5' : C.border}`, borderRadius: '16px', padding: isMobile ? '16px' : '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: `1px solid ${C.border}`, paddingBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 800, color: C.text, margin: 0 }}>Video Teleprompter Verification</h3>
                <p style={{ fontSize: '12px', color: C.textMid, margin: '2px 0 0 0' }}>
                  Status: <strong style={{ color: video_status === 'VERIFIED' ? C.green : (video_status === 'REJECTED' ? '#DC2626' : C.gold) }}>{video_status}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/employee/terms')}
                style={{ background: video_status === 'REJECTED' ? '#DC2626' : C.teal, color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
              >
                <FaVideo style={{ fontSize: '12px' }} /> {video_status === 'REJECTED' ? 'Re-record Video' : 'Record Video'}
              </button>
            </div>

            {/* Video Rejection Banner */}
            {video_status === 'REJECTED' && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '12px 14px', borderRadius: '10px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <FaExclamationTriangle style={{ color: '#DC2626', fontSize: '16px' }} />
                  <strong style={{ fontSize: '13px', color: '#991B1B', fontWeight: 800 }}>Video Rejected</strong>
                </div>
                <p style={{ fontSize: '12px', color: '#991B1B', margin: '0 0 8px 0', lineHeight: 1.4 }}>
                  Please re-record your video verification using the teleprompter wizard.
                </p>
                <div style={{ background: '#FFFFFF', border: '1px solid #FCA5A5', padding: '8px 10px', borderRadius: '8px', fontSize: '11px', color: '#991B1B', fontWeight: 700 }}>
                  "{verState.video_notes || (missing_items.find(i => i.type === 'video' && i.status === 'REJECTED')?.reason) || 'Please record a clear video with proper audio.'}"
                </div>
              </div>
            )}

            {verState.video_url ? (
              <div style={{ textAlign: 'center', padding: '16px', background: C.bgSecondary, borderRadius: '12px' }}>
                <div style={{ maxWidth: '100%', aspectRatio: '16/9', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
                  <video src={verState.video_url} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ marginTop: '10px', fontSize: '12px', fontWeight: 700, color: video_status === 'VERIFIED' ? C.green : (video_status === 'REJECTED' ? '#DC2626' : C.gold) }}>
                  Status: {video_status}
                </div>
                {video_status === 'REJECTED' && (
                  <div style={{ marginTop: '12px' }}>
                    <button type="button" onClick={() => navigate('/employee/terms')} style={{ background: '#DC2626', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <FaVideo style={{ fontSize: '12px' }} /> Re-record Video
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 16px', background: C.bgSecondary, borderRadius: '12px' }}>
                <FaVideo style={{ fontSize: '32px', color: C.textMid, marginBottom: '10px' }} />
                <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 6px 0' }}>No Video Recorded</h4>
                <p style={{ fontSize: '12px', color: C.textMid, marginBottom: '14px' }}>Complete your 15-second teleprompter video recording.</p>
                <button type="button" onClick={() => navigate('/employee/terms')} style={{ background: C.teal, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                  Start Recording
                </button>
              </div>
            )}
          </div>
        )}

        {/* SECTION 4: FACE BIOMETRIC VERIFICATION VIEW */}
        {activeSection === 'face' && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: isMobile ? '16px' : '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: `1px solid ${C.border}`, paddingBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 800, color: C.text, margin: 0 }}>Face Biometric Verification</h3>
                <p style={{ fontSize: '12px', color: C.textMid, margin: '2px 0 0 0' }}>
                  Status: <strong style={{ color: isFaceVerified ? C.green : C.gold }}>{isFaceVerified ? 'VERIFIED' : 'ACTION REQUIRED'}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFaceModalOpen(true)}
                style={{
                  background: isFaceVerified ? C.bgSecondary : C.teal,
                  color: isFaceVerified ? C.text : '#fff',
                  border: isFaceVerified ? `1px solid ${C.border}` : 'none',
                  padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0
                }}
              >
                <FaCamera style={{ fontSize: '12px' }} /> {isFaceVerified ? 'Re-enroll' : 'Start Verification'}
              </button>
            </div>

            {isFaceVerified ? (
              <div style={{ background: C.greenLight, border: '1px solid #BBF7D0', borderRadius: '12px', padding: isMobile ? '16px' : '20px', textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#D1FAE5', color: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '20px' }}>
                  <FaShieldAlt />
                </div>
                <h4 style={{ fontSize: isMobile ? '15px' : '16px', fontWeight: 800, color: C.green, margin: '0 0 6px 0' }}>
                  ✓ Biometric Verified & Active
                </h4>
                <p style={{ fontSize: '12px', color: C.green, maxWidth: '480px', margin: '0 auto 12px', lineHeight: 1.4 }}>
                  Your facial biometric reference is used for daily attendance recognition and GPS punch-in validation.
                </p>
                {biometric_enrolled_at && (
                  <div style={{ display: 'inline-block', background: '#FFFFFF', border: '1px solid #A7F3D0', padding: '4px 12px', borderRadius: '16px', fontSize: '11px', color: C.green, fontWeight: 700, marginBottom: '12px' }}>
                    Enrolled: {new Date(biometric_enrolled_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                )}
                <div>
                  <button
                    type="button"
                    onClick={() => setFaceModalOpen(true)}
                    style={{ background: '#FFFFFF', color: C.green, border: '1px solid #059669', padding: '8px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <FaSyncAlt style={{ fontSize: '12px' }} /> Update Snapshot
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: isMobile ? '20px 16px' : '28px 20px', background: C.bgSecondary, borderRadius: '12px', border: `1px dashed ${C.border}` }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: `${C.teal}15`, color: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '20px' }}>
                  <FaCamera />
                </div>
                <h4 style={{ fontSize: isMobile ? '15px' : '16px', fontWeight: 800, color: C.text, margin: '0 0 6px 0' }}>
                  Face Biometric Required
                </h4>
                <p style={{ fontSize: '12px', color: C.textMid, maxWidth: '420px', margin: '0 auto 16px', lineHeight: 1.4 }}>
                  Take a quick camera selfie to register your facial reference for secure identity verification and automated attendance.
                </p>

                {/* Instructions Pills */}
                <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                  <span style={{ background: C.card, border: `1px solid ${C.border}`, padding: '4px 10px', borderRadius: '16px', fontSize: '11px', color: C.text, fontWeight: 700 }}>
                    💡 Good Lighting
                  </span>
                  <span style={{ background: C.card, border: `1px solid ${C.border}`, padding: '4px 10px', borderRadius: '16px', fontSize: '11px', color: C.text, fontWeight: 700 }}>
                    🕶️ Remove Caps & Glasses
                  </span>
                  <span style={{ background: C.card, border: `1px solid ${C.border}`, padding: '4px 10px', borderRadius: '16px', fontSize: '11px', color: C.text, fontWeight: 700 }}>
                    📷 Face Centered
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setFaceModalOpen(true)}
                  style={{
                    background: C.teal, color: '#ffffff', border: 'none',
                    padding: '10px 20px', borderRadius: '8px', fontWeight: 700, fontSize: '13px',
                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px'
                  }}
                >
                  <FaCamera style={{ fontSize: '14px' }} /> Start Face Verification
                </button>
              </div>
            )}
          </div>
        )}

        {/* SUBMIT VERIFICATION SECTION */}
        <div style={{
          marginTop: '24px', background: C.card, border: `1px solid ${isOverallVerified ? '#A7F3D0' : C.border}`,
          borderRadius: '16px', padding: isMobile ? '16px' : '20px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          display: 'flex', flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center',
          gap: '16px'
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '5px',
                background: isOverallVerified ? C.greenLight : (allStepsReady ? '#E0F2FE' : C.goldLight),
                color: isOverallVerified ? C.green : (allStepsReady ? '#0369A1' : C.gold),
                textTransform: 'uppercase'
              }}>
                {isOverallVerified ? 'ALL VERIFIED' : (allStepsReady ? 'READY' : 'IN PROGRESS')}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>
                {completedCount}/4 Steps Complete
              </span>
            </div>
            <h3 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 800, color: C.text, margin: '0 0 4px 0' }}>
              Submit Verification Package
            </h3>
            <p style={{ fontSize: '12px', color: C.textMid, margin: 0, maxWidth: '580px', lineHeight: 1.4 }}>
              {isOverallVerified
                ? 'Your verification is fully approved and locked by HR.'
                : 'Submit your completed information, documents, video, and face biometric for review.'}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: isMobile ? '100%' : '240px', flexShrink: 0 }}>
            <button
              type="button"
              disabled={submittingVerification || isOverallVerified}
              onClick={handleSubmitVerification}
              style={{
                padding: '10px 18px', borderRadius: '8px', border: 'none',
                background: isOverallVerified ? C.green : (allStepsReady ? C.teal : '#0284C7'),
                color: '#ffffff', fontWeight: 700, fontSize: '13px',
                cursor: (submittingVerification || isOverallVerified) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: isOverallVerified ? 'none' : '0 4px 12px rgba(15, 118, 110, 0.2)',
                opacity: (submittingVerification || isOverallVerified) ? 0.75 : 1
              }}
            >
              {submittingVerification ? (
                <>Submitting...</>
              ) : isOverallVerified ? (
                <><FaCheckCircle style={{ fontSize: '14px' }} /> Complete</>
              ) : (
                <><FaShieldAlt style={{ fontSize: '14px' }} /> Submit for Review <FaArrowRight style={{ fontSize: '14px' }} /></>
              )}
            </button>
            {!isOverallVerified && !allStepsReady && (
              <span style={{ fontSize: '11px', color: C.textMid, textAlign: 'center', fontWeight: 700 }}>
                You can submit now or complete remaining steps.
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
