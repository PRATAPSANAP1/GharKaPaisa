import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../app/store/authStore';
import { useTheme } from '../../../contexts/ThemeContext';
import { 
  FaUserCircle, FaIdCard, FaBuilding, FaEnvelope, FaPhone, FaCheckCircle, 
  FaLock, FaShieldAlt, FaMapMarkerAlt, FaUniversity, FaVideo, FaFileAlt, 
  FaClock, FaExclamationTriangle, FaExternalLinkAlt, FaBriefcase, FaGraduationCap
} from 'react-icons/fa';
import api from '../../../services/api';

export default function EmployeeProfile() {
  const { user } = useAuthStore();
  const { C } = useTheme();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/employee/profile');
      if (res.data?.success && res.data?.data) {
        setProfileData(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch employee profile", err);
    } finally {
      setLoading(false);
    }
  };

  const emp = profileData?.employee || user || {};
  const jDetails = profileData?.joining_details || {};
  const kyc = profileData?.kyc || {};
  const terms = profileData?.terms || {};

  const fullName = jDetails.full_name || emp.full_name || emp.name || 'Employee Profile';
  const designation = jDetails.designation || emp.designation || 'Telecaller';
  const department = jDetails.department || emp.department || 'Sales & Operations';
  const empCode = emp.employee_id || emp.emp_code || emp.id || 'N/A';
  const accountStatus = (emp.employee_status || emp.status || emp.activation_status || 'PENDING').toUpperCase();
  const kycState = kyc.kyc_status || 'NOT_SUBMITTED';

  if (loading) {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '60px 24px', textAlign: 'center', color: C.textMid, fontFamily: "'Inter', sans-serif" }}>
        Loading Employee Official Profile...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: "'Inter', sans-serif", color: C.text }}>
      
      {/* Profile Header Banner */}
      <div style={{ 
        background: `linear-gradient(135deg, ${C.teal || '#0F766E'} 0%, #1E293B 100%)`, 
        borderRadius: '24px', padding: isMobile ? '20px 16px' : '32px', color: '#FFF', display: 'flex', 
        alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', flexDirection: isMobile ? 'column' : 'row', gap: '16px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
          <div style={{ 
            width: isMobile ? '64px' : '84px', height: isMobile ? '64px' : '84px', borderRadius: '50%', background: '#FFF', 
            color: C.teal || '#0F766E', display: 'flex', alignItems: 'center', justifyContent: 'center', 
            fontSize: isMobile ? '28px' : '40px', fontWeight: 900, boxShadow: '0 10px 25px rgba(0,0,0,0.2)', flexShrink: 0 
          }}>
            {fullName.charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 style={{ fontSize: isMobile ? '20px' : '26px', fontWeight: 900, margin: 0, wordBreak: 'break-word', color: '#FFF' }}>
              {fullName}
            </h1>
            <p style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: isMobile ? '13px' : '14px', fontWeight: 700, color: '#E2E8F0' }}>
              {designation} • {department}
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '8px', background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, color: '#FFF' }}>
              <FaShieldAlt /> Employee Ref ID: {empCode}
            </div>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', padding: '14px 18px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.2)', width: isMobile ? '100%' : 'auto', display: 'flex', justifyContent: isMobile ? 'space-between' : 'flex-end', alignItems: 'center', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', opacity: 0.8, fontWeight: 700, color: '#CBD5E1' }}>Account Status</div>
            <div style={{ fontSize: '14px', fontWeight: 900, color: (accountStatus === 'ACTIVE' || accountStatus === 'APPROVED') ? '#34D399' : '#FBBF24', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FaCheckCircle /> {accountStatus}
            </div>
          </div>
        </div>
      </div>

      {/* Grid Information Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        
        {/* Card 1: Personal & Contact Info */}
        <div style={{ background: C.card, borderRadius: '20px', padding: '24px', border: `1px solid ${C.border}`, boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 900, margin: '0 0 16px 0', color: C.teal || '#0F766E', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaUserCircle /> Personal & Contact Information
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 800, textTransform: 'uppercase' }}>Full Legal Name</div>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: C.text }}>{fullName}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 800, textTransform: 'uppercase' }}>Email Address</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: C.text, wordBreak: 'break-all' }}>{jDetails.email_id || emp.email_id || emp.email || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 800, textTransform: 'uppercase' }}>Mobile Contact</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: C.text }}>{jDetails.mobile_number || emp.mobile_number || emp.mobile || 'N/A'}</div>
              </div>
            </div>

            {jDetails.whatsapp_number && (
              <div>
                <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 800, textTransform: 'uppercase' }}>WhatsApp Number</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: C.text }}>{jDetails.whatsapp_number}</div>
              </div>
            )}

            {jDetails.emergency_contact_name && (
              <div>
                <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 800, textTransform: 'uppercase' }}>Emergency Contact</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: C.text }}>{jDetails.emergency_contact_name} ({jDetails.emergency_contact_number || 'N/A'})</div>
              </div>
            )}

            <div>
              <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 800, textTransform: 'uppercase' }}>Current Address</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: C.text, lineHeight: 1.4 }}>{jDetails.current_address || emp.current_address || 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Card 2: Work & Employment Details */}
        <div style={{ background: C.card, borderRadius: '20px', padding: '24px', border: `1px solid ${C.border}`, boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 900, margin: '0 0 16px 0', color: C.teal || '#0F766E', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaBriefcase /> Employment & Organizational Role
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 800, textTransform: 'uppercase' }}>Designation</div>
                <div style={{ fontSize: '13.5px', fontWeight: 800, color: C.teal || '#0F766E' }}>{designation}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 800, textTransform: 'uppercase' }}>Department</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: C.text }}>{department}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 800, textTransform: 'uppercase' }}>Date of Joining</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: C.text }}>
                  {jDetails.joining_date ? new Date(jDetails.joining_date).toLocaleDateString() : (emp.joining_date ? new Date(emp.joining_date).toLocaleDateString() : 'N/A')}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 800, textTransform: 'uppercase' }}>Work Location</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: C.text }}>{jDetails.work_location || emp.work_location || 'Office'}</div>
              </div>
            </div>

            {jDetails.offered_salary && (
              <div>
                <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 800, textTransform: 'uppercase' }}>Offered Salary</div>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#059669' }}>₹{Number(jDetails.offered_salary).toLocaleString('en-IN')} / month</div>
              </div>
            )}

            {jDetails.reporting_manager && (
              <div>
                <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 800, textTransform: 'uppercase' }}>Reporting Manager</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: C.text }}>{jDetails.reporting_manager}</div>
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Banking & Compliance Verification */}
        <div style={{ background: C.card, borderRadius: '20px', padding: '24px', border: `1px solid ${C.border}`, boxShadow: '0 4px 16px rgba(0,0,0,0.02)', gridColumn: isMobile ? 'auto' : '1 / -1' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 900, margin: '0 0 16px 0', color: C.teal || '#0F766E', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaUniversity /> Banking, Compliance & Document Status
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            
            {/* PAN Detail */}
            <div style={{ background: C.bgSecondary, padding: '14px 16px', borderRadius: '14px', border: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase' }}>PAN Card</span>
                <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: kyc.pan_status === 'VERIFIED' ? '#D1FAE5' : '#FEF3C7', color: kyc.pan_status === 'VERIFIED' ? '#065F46' : '#92400E' }}>
                  {kyc.pan_status || 'PENDING'}
                </span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: C.text, letterSpacing: '0.5px' }}>
                {kyc.pan_number || jDetails.pan_number || 'N/A'}
              </div>
              {kyc.pan_document_url && (
                <a href={kyc.pan_document_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 800, color: C.teal, marginTop: '6px', textDecoration: 'none' }}>
                  <FaFileAlt /> View Document <FaExternalLinkAlt size={9} />
                </a>
              )}
            </div>

            {/* Aadhaar Detail */}
            <div style={{ background: C.bgSecondary, padding: '14px 16px', borderRadius: '14px', border: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase' }}>Aadhaar Card</span>
                <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: kyc.aadhaar_status === 'VERIFIED' ? '#D1FAE5' : '#FEF3C7', color: kyc.aadhaar_status === 'VERIFIED' ? '#065F46' : '#92400E' }}>
                  {kyc.aadhaar_status || 'PENDING'}
                </span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: C.text, letterSpacing: '0.5px' }}>
                {kyc.aadhaar_number || jDetails.aadhaar_number || 'N/A'}
              </div>
              {kyc.aadhaar_document_url && (
                <a href={kyc.aadhaar_document_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 800, color: C.teal, marginTop: '6px', textDecoration: 'none' }}>
                  <FaFileAlt /> View Document <FaExternalLinkAlt size={9} />
                </a>
              )}
            </div>

            {/* Bank Proof Detail */}
            <div style={{ background: C.bgSecondary, padding: '14px 16px', borderRadius: '14px', border: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase' }}>Bank Account Details</span>
                <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: kyc.bank_status === 'VERIFIED' ? '#D1FAE5' : '#FEF3C7', color: kyc.bank_status === 'VERIFIED' ? '#065F46' : '#92400E' }}>
                  {kyc.bank_status || 'PENDING'}
                </span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: C.text }}>
                {kyc.bank_account_number || jDetails.bank_account_number || 'N/A'}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: C.textMid }}>
                IFSC: {kyc.ifsc_code || jDetails.ifsc_code || 'N/A'}
              </div>
              {kyc.bank_document_url && (
                <a href={kyc.bank_document_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 800, color: C.teal, marginTop: '6px', textDecoration: 'none' }}>
                  <FaFileAlt /> View Bank Proof <FaExternalLinkAlt size={9} />
                </a>
              )}
            </div>

            {/* Terms & Video Statement Detail */}
            <div style={{ background: C.bgSecondary, padding: '14px 16px', borderRadius: '14px', border: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase' }}>Terms & Video Statement</span>
                <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: terms.terms_accepted ? '#D1FAE5' : '#FEF3C7', color: terms.terms_accepted ? '#065F46' : '#92400E' }}>
                  {terms.terms_accepted ? '✓ ACCEPTED' : 'PENDING'}
                </span>
              </div>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: C.text }}>
                Script Language: {terms.language_selected ? terms.language_selected.toUpperCase() : 'ENGLISH'}
              </div>
              {terms.video_url && (
                <a href={terms.video_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 800, color: C.teal, marginTop: '6px', textDecoration: 'none' }}>
                  <FaVideo /> Play Recorded Video <FaExternalLinkAlt size={9} />
                </a>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
