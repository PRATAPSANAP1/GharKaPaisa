import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  FileText, Upload, CheckCircle, XCircle, Clock, ShieldCheck, 
  AlertTriangle, ArrowUpRight, History, Building2, UserCheck, RefreshCw, File
} from 'lucide-react';
import ApplicationTracker from '../../components/common/ApplicationTracker';

const CustomerUploadPortal = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expired, setExpired] = useState(false);
  const [portalData, setPortalData] = useState(null);
  
  // Upload states per document type
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMsg, setUploadMsg] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [selectedHistoryDoc, setSelectedHistoryDoc] = useState(null);

  const fileInputRefs = useRef({});

  const API_BASE = '/api/v1';

  const fetchPortalData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/customer-portal/${token}`);
      if (res.data.success) {
        setPortalData(res.data.data);
      } else {
        setError(res.data.message || 'Unable to load portal');
      }
    } catch (err) {
      if (err.response && err.response.status === 410) {
        setExpired(true);
      } else {
        setError(err.response?.data?.message || 'Invalid or expired secure upload link');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, [token]);

  const handleFileChange = async (docType, e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Client-side validations
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      alert('File size exceeds 5MB limit. Please choose a smaller file.');
      return;
    }

    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert('Invalid file format. Please upload JPEG, PNG, WEBP, or PDF.');
      return;
    }

    const formData = new FormData();
    formData.append('document_type', docType);
    formData.append('document', file);

    setUploadingDoc(docType);
    setUploadProgress(10);

    try {
      const res = await axios.post(
        `${API_BASE}/customer-portal/${token}/upload`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      );

      if (res.data.success) {
        setUploadMsg(prev => ({ ...prev, [docType]: '✓ Uploaded Successfully' }));
        fetchPortalData(); // Refresh portal state
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploadingDoc(null);
      setUploadProgress(0);
      if (fileInputRefs.current[docType]) {
        fileInputRefs.current[docType].value = '';
      }
    }
  };

  const handleSubmitAll = async () => {
    try {
      setSubmitLoading(true);
      const res = await axios.post(`${API_BASE}/customer-portal/${token}/submit`);
      if (res.data.success) {
        setSubmitSuccess(true);
        fetchPortalData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit documents');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid #e2e8f0', borderTopColor: '#f97316', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ fontSize: '15px', color: '#475569', fontWeight: 600 }}>Loading Secure Portal...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (expired) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '20px' }}>
        <div style={{ maxWidth: '440px', width: '100%', background: '#ffffff', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', textAlign: 'center', border: '1px solid #fee2e2' }}>
          <div style={{ width: '64px', height: '64px', background: '#fef2f2', color: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <AlertTriangle size={32} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>Link Expired (72 Hours Exceeded)</h2>
          <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5', marginBottom: '20px' }}>
            This secure upload link has expired. Please contact your GharKaPaisa Partner or representative to generate a new document upload link.
          </p>
          <div style={{ fontSize: '13px', color: '#94a3b8' }}>GharKaPaisa Customer Care & Security</div>
        </div>
      </div>
    );
  }

  if (error || !portalData) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '20px' }}>
        <div style={{ maxWidth: '440px', width: '100%', background: '#ffffff', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', textAlign: 'center', border: '1px solid #e2e8f0' }}>
          <div style={{ width: '64px', height: '64px', background: '#fef3c7', color: '#d97706', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <AlertTriangle size={32} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>Invalid Upload Link</h2>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>{error || 'Unable to access portal'}</p>
        </div>
      </div>
    );
  }

  const { application, required_documents, uploaded_documents, document_history, timeline } = portalData;

  const uploadedDocMap = {};
  uploaded_documents.forEach(doc => {
    uploadedDocMap[doc.document_type] = doc;
  });

  const totalRequired = required_documents.length;
  const totalUploaded = required_documents.filter(doc => {
    const uploaded = uploadedDocMap[doc.type];
    return uploaded && uploaded.status !== 'rejected';
  }).length;

  const isAllUploaded = totalUploaded >= totalRequired;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <header style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 800, fontSize: '18px' }}>
              G
            </div>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>GharKaPaisa</h1>
              <p style={{ fontSize: '11px', color: '#64748b', margin: 0, fontWeight: 500 }}>Secure Customer Upload Portal</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', background: '#f0fdf4', color: '#166534', padding: '6px 12px', borderRadius: '20px', fontWeight: 600, border: '1px solid #bbf7d0' }}>
            <ShieldCheck size={16} />
            <span>256-bit Encrypted</span>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 16px 60px' }}>
        
        {/* Customer Welcome & Application Details */}
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', tracking: '0.05em' }}>Customer Portal</span>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '4px 0 2px' }}>Welcome, {application.customer_name}</h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Please complete your document submission to process your loan application.</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>App Number</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>#{application.app_number}</div>
            </div>
          </div>

          {/* Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>PRODUCT</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>{application.product_name || 'Loan Application'}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>BANK</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={16} color="#64748b" />
                {application.bank_name || 'Partner Bank'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>PARTNER NAME</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <UserCheck size={16} color="#64748b" />
                {application.partner_name}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>CURRENT STATUS</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#ea580c', textTransform: 'capitalize' }}>
                {application.status ? application.status.replace(/_/g, ' ') : 'Verification Pending'}
              </div>
            </div>
          </div>
        </div>

        {/* Module 12 — Visual Interactive Tracker */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>Application Tracker</h3>
          <ApplicationTracker currentStatus={application.status} />
        </div>

        {/* Upload Status Banner */}
        {submitSuccess ? (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px', color: '#166534' }}>
            <CheckCircle size={32} color="#16a34a" />
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px' }}>Documents Submitted Successfully!</h4>
              <p style={{ fontSize: '13px', margin: 0 }}>Your documents have been submitted to our team for verification. We will notify you once verified.</p>
            </div>
          </div>
        ) : null}

        {/* Documents Upload Section */}
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Required Documents</h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '2px 0 0' }}>Upload clear photos or PDF copies (Max 5MB each)</p>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, background: '#f1f5f9', padding: '6px 14px', borderRadius: '20px', color: '#334155' }}>
              {totalUploaded} / {totalRequired} Uploaded
            </div>
          </div>

          {/* Document List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {required_documents.map((doc, idx) => {
              const type = typeof doc === 'string' ? doc : doc.type;
              const label = typeof doc === 'string' ? doc.replace(/_/g, ' ').toUpperCase() : doc.label;
              const uploadedDoc = uploadedDocMap[type];
              const isUploading = uploadingDoc === type;

              const isApproved = uploadedDoc && uploadedDoc.status === 'approved';
              const isRejected = uploadedDoc && uploadedDoc.status === 'rejected';
              const isPending = !uploadedDoc || uploadedDoc.status === 'uploaded';

              return (
                <div 
                  key={type}
                  style={{
                    background: isRejected ? '#fff5f5' : isApproved ? '#f0fdf4' : '#ffffff',
                    border: `1px solid ${isRejected ? '#fecaca' : isApproved ? '#bbf7d0' : '#e2e8f0'}`,
                    borderRadius: '12px',
                    padding: '18px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    
                    {/* Left Details */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        background: isApproved ? '#dcfce7' : isRejected ? '#fee2e2' : '#f1f5f9',
                        color: isApproved ? '#15803d' : isRejected ? '#b91c1c' : '#475569',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FileText size={22} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', margin: 0 }}>{label}</h4>
                          {doc.required && <span style={{ fontSize: '10px', color: '#ef4444', background: '#fef2f2', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>REQUIRED</span>}
                        </div>
                        {uploadedDoc ? (
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{uploadedDoc.file_name}</span>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>• v{uploadedDoc.version || 1}</span>
                          </div>
                        ) : (
                          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Formats: PDF, PNG, JPEG, WEBP (Max 5MB)</div>
                        )}
                      </div>
                    </div>

                    {/* Right Action & Status */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {/* Status Badge */}
                      {isApproved && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700, color: '#166534', background: '#dcfce7', padding: '6px 12px', borderRadius: '20px' }}>
                          <CheckCircle size={14} /> Approved ✓
                        </span>
                      )}

                      {isRejected && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700, color: '#991b1b', background: '#fee2e2', padding: '6px 12px', borderRadius: '20px' }}>
                          <XCircle size={14} /> Rejected
                        </span>
                      )}

                      {uploadedDoc && uploadedDoc.status === 'uploaded' && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#0369a1', background: '#e0f2fe', padding: '6px 12px', borderRadius: '20px' }}>
                          <Clock size={14} /> Uploaded ✓
                        </span>
                      )}

                      {/* Hidden File Input */}
                      <input 
                        type="file"
                        ref={el => fileInputRefs.current[type] = el}
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileChange(type, e)}
                      />

                      {/* Upload / Re-upload Button */}
                      {!isApproved && (
                        <button
                          disabled={isUploading}
                          onClick={() => fileInputRefs.current[type]?.click()}
                          style={{
                            background: isRejected ? '#ef4444' : uploadedDoc ? '#f8fafc' : '#f97316',
                            color: isRejected || !uploadedDoc ? '#ffffff' : '#334155',
                            border: isRejected || !uploadedDoc ? 'none' : '1px solid #cbd5e1',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontWeight: 600,
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {isUploading ? (
                            <span>Uploading... {uploadProgress}%</span>
                          ) : isRejected ? (
                            <>
                              <RefreshCw size={14} /> Upload Again
                            </>
                          ) : uploadedDoc ? (
                            <>
                              <RefreshCw size={14} /> Replace
                            </>
                          ) : (
                            <>
                              <Upload size={14} /> Upload File
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Rejection Reason Notice */}
                  {isRejected && uploadedDoc.rejection_reason && (
                    <div style={{ marginTop: '12px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '13px', color: '#991b1b' }}>
                      <strong>Rejection Reason:</strong> {uploadedDoc.rejection_reason}
                    </div>
                  )}

                  {/* Upload Progress Bar */}
                  {isUploading && (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${uploadProgress}%`, height: '100%', background: '#f97316', transition: 'width 0.2s ease' }} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Submit Button */}
          <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              {isAllUploaded ? '✓ All required documents are ready to submit' : `${totalRequired - totalUploaded} remaining document(s)`}
            </div>
            <button
              onClick={handleSubmitAll}
              disabled={submitLoading || totalUploaded === 0}
              style={{
                background: totalUploaded > 0 ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' : '#cbd5e1',
                color: '#ffffff',
                border: 'none',
                padding: '12px 28px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '15px',
                cursor: totalUploaded > 0 ? 'pointer' : 'not-allowed',
                boxShadow: totalUploaded > 0 ? '0 4px 12px rgba(249, 115, 22, 0.3)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {submitLoading ? 'Submitting...' : 'Submit Remaining Documents'}
              <ArrowUpRight size={18} />
            </button>
          </div>
        </div>

        {/* Timeline Log Section (Module 8) */}
        {timeline && timeline.length > 0 && (
          <div style={{ marginTop: '28px', background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>Application Activity Timeline</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {timeline.map((item, i) => (
                <div key={item.id || i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', fontSize: '13px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f97316', marginTop: '6px' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#1e293b' }}>{item.title}</div>
                    <div style={{ color: '#64748b' }}>{item.description}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                      {new Date(item.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CustomerUploadPortal;
