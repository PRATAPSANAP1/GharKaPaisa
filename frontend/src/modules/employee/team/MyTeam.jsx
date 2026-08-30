import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { FaArrowLeft, FaSitemap, FaUsers, FaUserCheck } from 'react-icons/fa';
import axios from 'axios';

export default function MyTeam() {
  const { C } = useTheme();
  const navigate = useNavigate();

  const [team, setTeam] = useState([]);
  const [designation, setDesignation] = useState('');
  const [loading, setLoading] = useState(true);

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const res = await axios.get('/api/v1/employee/team');
      if (res.data.success) {
        setTeam(res.data.data || []);
        setDesignation(res.data.employee_designation || '');
      }
    } catch (err) {
      console.error('Fetch employee team error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: isMobile ? '16px 8px 60px' : '32px 24px 80px', fontFamily: "'Inter', sans-serif", color: C.text }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <button onClick={() => navigate('/employee/dashboard')} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.textMid, flexShrink: 0 }}>
            <FaArrowLeft />
          </button>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: C.teal, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Hierarchy Control</span>
            <h1 style={{ fontSize: isMobile ? '18px' : '26px', fontWeight: 900, color: C.text, margin: 0 }}>My Team & Reporting Hierarchy</h1>
          </div>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
          <div style={{ padding: '20px', borderBottom: `1px solid ${C.border}` }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: C.text }}>
              Direct Reports for {designation || 'Manager / TL'}
            </h3>
          </div>

          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: C.textMid }}>Loading team data...</div>
          ) : team.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: C.textMid }}>No team members assigned yet.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, color: C.textMid, fontWeight: 700 }}>
                    <th style={{ padding: '14px 20px' }}>EMP ID</th>
                    <th style={{ padding: '14px 20px' }}>Member Name</th>
                    <th style={{ padding: '14px 20px' }}>Contact</th>
                    <th style={{ padding: '14px 20px' }}>Role</th>
                    <th style={{ padding: '14px 20px' }}>Onboarding</th>
                    <th style={{ padding: '14px 20px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {team.map(member => (
                    <tr key={member.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '14px 20px', fontWeight: 900, color: C.teal }}>{member.employee_id}</td>
                      <td style={{ padding: '14px 20px', fontWeight: 700, color: C.text }}>{member.full_name}</td>
                      <td style={{ padding: '14px 20px', color: C.textMid }}>{member.mobile_number}</td>
                      <td style={{ padding: '14px 20px' }}>{member.designation}</td>
                      <td style={{ padding: '14px 20px' }}>{member.overall_progress || 20}%</td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ 
                          padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 800,
                          background: member.activation_status === 'APPROVED' ? '#D1FAE5' : '#FEF3C7',
                          color: member.activation_status === 'APPROVED' ? '#065F46' : '#92400E'
                        }}>
                          {member.activation_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
