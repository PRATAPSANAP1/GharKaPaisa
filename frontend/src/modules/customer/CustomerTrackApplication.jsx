import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  FaSearch, FaCheckCircle, FaClock, FaTimesCircle, FaShieldAlt,
  FaBuilding, FaCreditCard, FaUser, FaPhoneAlt, FaCalendarAlt,
  FaRupeeSign, FaArrowLeft, FaSync, FaExclamationTriangle
} from 'react-icons/fa';
import axios from 'axios';
import { getApiV1Url } from '../../config/api';

export default function CustomerTrackApplication() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Extract query params (supports multiple variations like appNumber / app_number / mobile / phone)
  const queryAppNumber = searchParams.get('appNumber') || searchParams.get('app_number') || searchParams.get('app') || searchParams.get('applicationNumber') || '';
  const queryMobile = searchParams.get('mobile') || searchParams.get('mobileNumber') || searchParams.get('phone') || '';

  const [appNumber, setAppNumber] = useState(queryAppNumber);
  const [mobile, setMobile] = useState(queryMobile);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trackResult, setTrackResult] = useState(null);
  const [autoTracked, setAutoTracked] = useState(false);

  // Auto-Track Trigger when URL query parameters are present
  useEffect(() => {
    if (queryAppNumber && queryMobile && !autoTracked) {
      setAutoTracked(true);
      performTracking(queryAppNumber, queryMobile);
    }
  }, [queryAppNumber, queryMobile]);

  const performTracking = async (appNumToUse, mobileToUse) => {
    const cleanApp = (appNumToUse || appNumber || '').trim();
    const cleanMob = (mobileToUse || mobile || '').trim();

    if (!cleanApp || !cleanMob) {
      setError('Please enter both Application Number and Mobile Number.');
      return;
    }

    setLoading(true);
    setError('');
    setTrackResult(null);

    try {
      const url = `${getApiV1Url()}/customer-portal/public/track-application?app_number=${encodeURIComponent(cleanApp)}&mobile=${encodeURIComponent(cleanMob)}`;
      const response = await axios.get(url);

      if (response.data && response.data.success) {
        setTrackResult(response.data.data);
      } else {
        setError(response.data?.message || 'Application record not found. Please check details.');
      }
    } catch (err) {
      console.error('Tracking fetch error:', err);
      setError(err.response?.data?.message || 'Unable to locate application. Please check your Application Number and Mobile Number.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    performTracking(appNumber, mobile);
  };

  // Helper Stage Map
  const stages = [
    { id: 1, title: 'Submitted', desc: 'Application received successfully' },
    { id: 2, title: 'Under Review', desc: 'Document & profile verification' },
    { id: 3, title: 'Bank Processing', desc: 'Sent to bank for credit evaluation' },
    { id: 4, title: 'Approved & Disbursed', desc: 'Application approved by bank' }
  ];

  const getStageIcon = (stageId, currentStage, stageStatus) => {
    if (stageStatus === 'rejected') {
      return <FaTimesCircle style={{ color: '#EF4444' }} />;
    }
    if (stageId < currentStage || (stageId === currentStage && stageStatus === 'completed')) {
      return <FaCheckCircle style={{ color: '#10B981' }} />;
    }
    if (stageId === currentStage) {
      return <FaClock style={{ color: '#F59E0B', animation: 'spin 3s linear infinite' }} />;
    }
    return <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#CBD5E1' }} />;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      color: '#F8FAFC',
      padding: '40px 16px 80px',
      boxSizing: 'border-box'
    }}>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .glass-card {
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
        }
        .track-input:focus {
          border-color: #38BDF8 !important;
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.25) !important;
        }
      `}</style>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={() => navigate('/')}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#94A3B8',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              title="Go Home"
            >
              <FaArrowLeft size={16} />
            </button>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#38BDF8', letterSpacing: '1px', textTransform: 'uppercase' }}>
                GHARKAPAISA CUSTOMER PORTAL
              </div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '2px 0 0', color: '#FFFFFF' }}>
                Track Application Status
              </h1>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '6px 12px', borderRadius: '20px', color: '#34D399', fontSize: '12px', fontWeight: 700 }}>
            <FaShieldAlt size={12} /> 100% Encrypted & Secure
          </div>
        </div>

        {/* Input Form Card */}
        <div className="glass-card" style={{ borderRadius: '24px', padding: '28px', marginBottom: '32px', animation: 'fadeIn 0.4s ease-out' }}>
          <form onSubmit={handleFormSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#94A3B8', marginBottom: '8px' }}>
                  Application Number / Lead ID
                </label>
                <div style={{ relative: 'relative' }}>
                  <input
                    type="text"
                    placeholder="e.g. GKP100293 or LEAD-8812"
                    value={appNumber}
                    onChange={(e) => setAppNumber(e.target.value)}
                    className="track-input"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '12px',
                      color: '#F8FAFC',
                      fontSize: '15px',
                      fontWeight: 600,
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'all 0.2s'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#94A3B8', marginBottom: '8px' }}>
                  Registered Mobile Number
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="Enter 10-digit mobile number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  className="track-input"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    color: '#F8FAFC',
                    fontSize: '15px',
                    fontWeight: 600,
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px 24px',
                background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                border: 'none',
                borderRadius: '14px',
                color: '#FFFFFF',
                fontSize: '16px',
                fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 8px 24px rgba(2, 132, 199, 0.35)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? (
                <>
                  <FaSync className="spin" size={16} /> Fetching Application Status...
                </>
              ) : (
                <>
                  <FaSearch size={16} /> Track Application Status
                </>
              )}
            </button>
          </form>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '16px',
            padding: '16px 20px',
            marginBottom: '28px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#FCA5A5',
            fontSize: '14px',
            lineHeight: 1.5,
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <FaExclamationTriangle size={20} style={{ flexShrink: 0, color: '#EF4444' }} />
            <div>{error}</div>
          </div>
        )}

        {/* Tracking Details View */}
        {trackResult && (
          <div className="glass-card" style={{ borderRadius: '24px', padding: '32px', animation: 'fadeIn 0.5s ease-out' }}>
            
            {/* Top Info Banner */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              paddingBottom: '24px',
              marginBottom: '28px'
            }}>
              <div>
                <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
                  Application Number
                </span>
                <div style={{ fontSize: '22px', fontWeight: 900, color: '#38BDF8', letterSpacing: '0.5px' }}>
                  {trackResult.app_number}
                </div>
                {trackResult.bank_application_number && (
                  <div style={{ fontSize: '12px', color: '#CBD5E1', marginTop: '4px' }}>
                    Bank Ref #: <strong>{trackResult.bank_application_number}</strong>
                  </div>
                )}
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
                  Current Status
                </span>
                <div style={{
                  marginTop: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 800,
                  background: trackResult.stage_status === 'rejected'
                    ? 'rgba(239, 68, 68, 0.2)'
                    : trackResult.current_stage === 4
                    ? 'rgba(16, 185, 129, 0.2)'
                    : 'rgba(245, 158, 11, 0.2)',
                  color: trackResult.stage_status === 'rejected'
                    ? '#FCA5A5'
                    : trackResult.current_stage === 4
                    ? '#34D399'
                    : '#FCD34D',
                  border: trackResult.stage_status === 'rejected'
                    ? '1px solid rgba(239, 68, 68, 0.3)'
                    : trackResult.current_stage === 4
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : '1px solid rgba(245, 158, 11, 0.3)'
                }}>
                  {trackResult.stage_status === 'rejected' ? <FaTimesCircle /> : trackResult.current_stage === 4 ? <FaCheckCircle /> : <FaClock />}
                  {trackResult.status_label}
                </div>
              </div>
            </div>

            {/* Application Overview Details */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              background: 'rgba(15, 23, 42, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '32px'
            }}>
              <div>
                <div style={{ fontSize: '12px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <FaUser size={12} /> Customer Name
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#F8FAFC' }}>
                  {trackResult.customer_name_masked}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <FaPhoneAlt size={12} /> Mobile Number
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#F8FAFC' }}>
                  {trackResult.customer_mobile_masked}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <FaCreditCard size={12} /> Product
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#F8FAFC' }}>
                  {trackResult.product_name}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <FaBuilding size={12} /> Partner Bank
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#F8FAFC' }}>
                  {trackResult.bank_name}
                </div>
              </div>

              {trackResult.loan_amount && (
                <div>
                  <div style={{ fontSize: '12px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <FaRupeeSign size={12} /> Requested / Limit
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#34D399' }}>
                    ₹{Number(trackResult.loan_amount).toLocaleString('en-IN')}
                  </div>
                </div>
              )}

              <div>
                <div style={{ fontSize: '12px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <FaCalendarAlt size={12} /> Applied Date
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#F8FAFC' }}>
                  {new Date(trackResult.applied_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>

            {/* Visual 4-Stage Progress Stepper */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF', marginBottom: '20px' }}>
                Application Journey
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
                {stages.map((stage) => {
                  const isDone = stage.id < trackResult.current_stage || (stage.id === trackResult.current_stage && trackResult.stage_status === 'completed');
                  const isCurrent = stage.id === trackResult.current_stage && trackResult.stage_status !== 'completed' && trackResult.stage_status !== 'rejected';
                  const isRejected = stage.id === trackResult.current_stage && trackResult.stage_status === 'rejected';

                  return (
                    <div
                      key={stage.id}
                      style={{
                        background: isCurrent
                          ? 'rgba(56, 189, 248, 0.12)'
                          : isDone
                          ? 'rgba(16, 185, 129, 0.1)'
                          : isRejected
                          ? 'rgba(239, 68, 68, 0.1)'
                          : 'rgba(15, 23, 42, 0.4)',
                        border: isCurrent
                          ? '1px solid rgba(56, 189, 248, 0.4)'
                          : isDone
                          ? '1px solid rgba(16, 185, 129, 0.3)'
                          : isRejected
                          ? '1px solid rgba(239, 68, 68, 0.3)'
                          : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '16px',
                        padding: '16px',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: isCurrent ? '#38BDF8' : isDone ? '#34D399' : '#64748B' }}>
                          STAGE 0{stage.id}
                        </span>
                        {getStageIcon(stage.id, trackResult.current_stage, trackResult.stage_status)}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: isCurrent ? '#F8FAFC' : isDone ? '#F8FAFC' : '#94A3B8', marginBottom: '4px' }}>
                        {stage.title}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B', lineHeight: 1.4 }}>
                        {stage.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rejection Remarks Warning if Rejected */}
            {trackResult.rejection_reason && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '16px',
                padding: '18px 20px',
                color: '#FCA5A5',
                fontSize: '14px',
                lineHeight: 1.5,
                marginBottom: '28px'
              }}>
                <strong style={{ color: '#EF4444' }}>Status Remark:</strong> {trackResult.rejection_reason}
              </div>
            )}

            {/* Event Timeline History */}
            {trackResult.timeline && trackResult.timeline.length > 0 && (
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#F8FAFC', marginBottom: '16px' }}>
                  Activity Audit Logs
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {trackResult.timeline.map((evt, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        background: 'rgba(15, 23, 42, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '12px',
                        padding: '12px 16px'
                      }}
                    >
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38BDF8', marginTop: '6px' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#F8FAFC' }}>
                          {evt.title || evt.event_type}
                        </div>
                        {evt.description && (
                          <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
                            {evt.description}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>
                        {new Date(evt.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
