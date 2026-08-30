import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  FaArrowLeft, FaBriefcase, FaGraduationCap, FaRocket, FaUsers, 
  FaHeart, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCheckCircle, 
  FaChevronRight, FaPaperPlane 
} from 'react-icons/fa';

export default function Careers() {
  const { C, isDark } = useTheme();
  const navigate = useNavigate();
  const [selectedJob, setSelectedJob] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Financial Sales Executive',
    experience: '1-3 years',
    message: ''
  });

  const openPositions = [
    {
      id: 1,
      title: 'Financial Sales Executive',
      department: 'Sales & Distribution',
      location: 'Pune / Remote',
      type: 'Full-time',
      experience: '1-3 Years',
      description: 'Expand our financial product distribution network, assist partners, and drive credit card and loan application volume.',
      requirements: [
        'Prior experience in selling credit cards, loans, or financial products.',
        'Strong communication skills in Hindi, English, and local languages.',
        'Ability to build and manage partner/DSA relationships.',
        'Self-motivated with a track record of achieving sales targets.'
      ]
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '40px 16px 80px', fontFamily: "'Inter', sans-serif", color: C.text }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Top Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
          <button 
            onClick={() => navigate('/')}
            style={{ 
              background: C.card, border: `1px solid ${C.border}`, borderRadius: '50%', 
              width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: C.textMid, boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              transition: 'all 0.2s'
            }}
          >
            <FaArrowLeft />
          </button>
          <div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: C.teal, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Work With Us
            </span>
            <h1 style={{ fontSize: '28px', fontWeight: 900, color: C.text, margin: 0 }}>Careers at GharKaPaisa</h1>
          </div>
        </div>

        {/* Hero Section */}
        <div style={{ 
          background: 'linear-gradient(135deg, #081424 0%, #0F2B48 100%)', 
          borderRadius: '24px', padding: '40px 32px', color: '#ffffff', marginBottom: '32px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.15)', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ maxWidth: '650px', position: 'relative', zIndex: 2 }}>
            <span style={{ 
              background: 'rgba(45, 212, 191, 0.15)', color: '#2DD4BF', padding: '6px 14px', 
              borderRadius: '20px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', 
              letterSpacing: '0.5px', display: 'inline-block', marginBottom: '16px', border: '1px solid rgba(45, 212, 191, 0.3)'
            }}>
              <FaRocket style={{ marginRight: '6px' }} /> We are Hiring
            </span>
            <h2 style={{ fontSize: '32px', fontWeight: 900, lineHeight: 1.2, margin: '0 0 16px 0', letterSpacing: '-0.5px' }}>
              Build the Future of Financial Product Distribution
            </h2>
            <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.6, margin: '0 0 24px 0' }}>
              Join a high-growth fintech startup empowering thousands of partners and millions of customers across India with seamless access to Credit Cards, Loans, and Financial Services.
            </p>
            <a 
              href="#openings" 
              style={{ 
                display: 'inline-flex', alignItems: 'center', gap: '8px', 
                background: C.teal, color: '#ffffff', padding: '12px 24px', 
                borderRadius: '12px', fontWeight: 800, fontSize: '14px', 
                textDecoration: 'none', boxShadow: '0 4px 14px rgba(45, 212, 191, 0.4)' 
              }}
            >
              Explore Open Positions <FaChevronRight size={12} />
            </a>
          </div>
        </div>

        {/* Why Join Us Cards */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: C.text, marginBottom: '20px', textAlign: 'center' }}>
            Why Build Your Career with GharKaPaisa?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            {[
              { icon: <FaRocket />, title: 'Rapid Growth', desc: 'Fast-track your professional journey in one of India\'s fastest-growing fintech sectors.' },
              { icon: <FaUsers />, title: 'Collaborative Team', desc: 'Work alongside driven professionals, banking domain experts, and innovative engineers.' },
              { icon: <FaGraduationCap />, title: 'Continuous Learning', desc: 'Gain deep exposure to financial technology, credit underwriting, and partner ecosystems.' },
              { icon: <FaHeart />, title: 'Impact At Scale', desc: 'Empower partners across tier 1, 2, and 3 cities to build sustainable financial incomes.' }
            ].map((item, idx) => (
              <div 
                key={idx}
                style={{ 
                  background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', 
                  padding: '24px 20px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                  transition: 'transform 0.2s', display: 'flex', flexDirection: 'column', gap: '12px'
                }}
              >
                <div style={{ fontSize: '28px', color: C.teal }}>{item.icon}</div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: C.text, margin: 0 }}>{item.title}</h3>
                <p style={{ fontSize: '13px', color: C.textMid, lineHeight: 1.5, margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Open Positions Section */}
        <div id="openings" style={{ marginBottom: '48px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: C.text, margin: '0 0 6px 0' }}>Current Job Openings</h2>
            <p style={{ fontSize: '14px', color: C.textMid, margin: 0 }}>Find your next role and apply directly to our talent acquisition team.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {openPositions.map((job) => {
              const isSelected = selectedJob === job.id;
              return (
                <div 
                  key={job.id} 
                  style={{ 
                    background: C.card, border: `1px solid ${isSelected ? C.teal : C.border}`, 
                    borderRadius: '20px', padding: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
                    transition: 'all 0.25s' 
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: 700, background: `${C.teal}15`, color: C.teal, padding: '3px 10px', borderRadius: '12px', display: 'inline-block', marginBottom: '8px' }}>
                        {job.department}
                      </span>
                      <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: '0 0 6px 0' }}>{job.title}</h3>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: C.textMid, flexWrap: 'wrap' }}>
                        <span>Location: {job.location}</span>
                        <span>Type: {job.type}</span>
                        <span>Experience: {job.experience} Exp</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => navigate('/careers/register')}
                        style={{ 
                          background: C.teal, color: '#ffffff', border: 'none', 
                          padding: '10px 18px', borderRadius: '10px', fontSize: '13px', 
                          fontWeight: 800, cursor: 'pointer' 
                        }}
                      >
                        Register for Interview
                      </button>
                      <button 
                        onClick={() => setSelectedJob(isSelected ? null : job.id)}
                        style={{ 
                          background: isSelected ? `${C.teal}20` : C.bgSecondary, 
                          color: isSelected ? C.teal : C.text, 
                          border: `1px solid ${C.border}`, 
                          padding: '10px 16px', borderRadius: '10px', fontSize: '13px', 
                          fontWeight: 700, cursor: 'pointer' 
                        }}
                      >
                        {isSelected ? 'Hide' : 'Details'}
                      </button>
                    </div>
                  </div>

                  <p style={{ fontSize: '14px', color: C.textMid, marginTop: '16px', lineHeight: 1.5, margin: '16px 0 0 0' }}>
                    {job.description}
                  </p>

                  {isSelected && (
                    <div style={{ borderTop: `1px solid ${C.border}`, marginTop: '20px', paddingTop: '20px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: '0 0 10px 0' }}>Key Requirements:</h4>
                      <ul style={{ paddingLeft: '20px', margin: '0 0 20px 0', fontSize: '14px', color: C.textMid, lineHeight: 1.7 }}>
                        {job.requirements.map((req, i) => (
                          <li key={i}>{req}</li>
                        ))}
                      </ul>

                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <button 
                          onClick={() => navigate('/careers/register')}
                          style={{ 
                            background: C.teal, color: '#ffffff', border: 'none', 
                            padding: '10px 20px', borderRadius: '10px', fontSize: '13px', 
                            fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' 
                          }}
                        >
                          <FaPaperPlane /> Apply & Register for Interview
                        </button>
                        <button 
                          onClick={() => navigate('/careers/status')}
                          style={{ 
                            background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, 
                            padding: '10px 20px', borderRadius: '10px', fontSize: '13px', 
                            fontWeight: 700, cursor: 'pointer' 
                          }}
                        >
                          Track Application Status
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Interview Registration Form Banner / Direct CTA */}
        <div style={{ 
          background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', 
          padding: '36px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '24px' }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 800, color: C.employeePrimary || C.teal || '#0F766E', textTransform: 'uppercase', letterSpacing: '0.5px', background: `${C.employeePrimary || C.teal || '#0F766E'}15`, padding: '4px 12px', borderRadius: '12px' }}>
                Official Candidate Onboarding
              </span>
              <h2 style={{ fontSize: '24px', fontWeight: 900, color: C.text, margin: '8px 0 4px 0' }}>
                Interview Registration Form – Required Details
              </h2>
              <p style={{ fontSize: '14px', color: C.textMid, margin: 0, lineHeight: 1.5 }}>
                Fill in your complete profile details, verify your mobile/email via OTP, and receive your Candidate Reference Code immediately.
              </p>
            </div>

            <button 
              onClick={() => navigate('/careers/register')}
              style={{ 
                background: C.employeePrimary || C.teal || '#0F766E', color: '#ffffff', border: 'none', 
                padding: '14px 28px', borderRadius: '14px', fontSize: '15px', 
                fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 16px rgba(15,118,110,0.3)',
                display: 'inline-flex', alignItems: 'center', gap: '10px'
              }}
            >
              <FaPaperPlane /> Register for Interview Now
            </button>
          </div>

          {/* Structured 4-Section Checklist Preview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', background: C.bgSecondary, padding: '20px', borderRadius: '18px', border: `1px solid ${C.border}` }}>
            <div>
              <strong style={{ fontSize: '14px', color: C.text, display: 'block', marginBottom: '6px' }}>1. Personal Details</strong>
              <span style={{ fontSize: '12.5px', color: C.textMid, lineHeight: 1.4, display: 'block' }}>Name, Mobile, Email ID, DOB / Age, Current Address</span>
            </div>
            <div>
              <strong style={{ fontSize: '14px', color: C.text, display: 'block', marginBottom: '6px' }}>2. Education</strong>
              <span style={{ fontSize: '12.5px', color: C.textMid, lineHeight: 1.4, display: 'block' }}>Highest Qualification & Passing Year</span>
            </div>
            <div>
              <strong style={{ fontSize: '14px', color: C.text, display: 'block', marginBottom: '6px' }}>3. Experience & Job Role</strong>
              <span style={{ fontSize: '12.5px', color: C.textMid, lineHeight: 1.4, display: 'block' }}>Target Role, Fresher/Exp, Last CTC, Expected Salary, Immediate Joining, Location Comfort</span>
            </div>
            <div>
              <strong style={{ fontSize: '14px', color: C.text, display: 'block', marginBottom: '6px' }}>4. Source & Resume Upload</strong>
              <span style={{ fontSize: '12.5px', color: C.textMid, lineHeight: 1.4, display: 'block' }}>How did you hear (Ref / WA / Insta / Job Portal), Resume PDF/DOCX</span>
            </div>
          </div>

          {/* Contact Details Footer inside Card */}
          <div style={{ borderTop: `1px solid ${C.border}`, marginTop: '28px', paddingTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '24px', fontSize: '13px', color: C.textMid }}>
            <div>
              <strong style={{ color: C.text }}>Direct Email:</strong>{' '}
              <a href="mailto:support@gharkapaisa.in" style={{ color: C.teal, textDecoration: 'none' }}>support@gharkapaisa.in</a>
            </div>
            <div>
              <strong style={{ color: C.text }}>HR Contact:</strong>{' '}
              <a href="tel:9270319438" style={{ color: C.teal, textDecoration: 'none' }}>+91 9270319438</a>
            </div>
            <div>
              <strong style={{ color: C.text }}>HQ Office:</strong> Rajnandini Tower Dighi, Pune 411015
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
