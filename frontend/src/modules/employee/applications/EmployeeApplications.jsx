import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { FaArrowLeft, FaUserPlus, FaCheckCircle, FaClock, FaSearch, FaTimesCircle } from 'react-icons/fa';
import axios from 'axios';

export default function EmployeeApplications() {
  const { C } = useTheme();
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchApps = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const res = await axios.get('/api/v1/employee/applications');
      if (res.data.success) {
        setApplications(res.data.data || []);
      }
    } catch (err) {
      console.error('Fetch employee applications error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '32px 24px 80px', fontFamily: "'Inter', sans-serif", color: C.text }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
          <button onClick={() => navigate('/employee/dashboard')} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '50%', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.textMid }}>
            <FaArrowLeft />
          </button>
          <div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: C.teal, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sales Attribution</span>
            <h1 style={{ fontSize: '26px', fontWeight: 900, color: C.text, margin: 0 }}>My Customer Applications</h1>
          </div>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: C.textMid }}>Loading applications...</div>
          ) : applications.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: C.textMid }}>No applications punched yet.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, color: C.textMid, fontWeight: 700 }}>
                    <th style={{ padding: '14px 20px' }}>App Number</th>
                    <th style={{ padding: '14px 20px' }}>Customer Details</th>
                    <th style={{ padding: '14px 20px' }}>Product</th>
                    <th style={{ padding: '14px 20px' }}>Incentive Amount</th>
                    <th style={{ padding: '14px 20px' }}>Status</th>
                    <th style={{ padding: '14px 20px' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map(app => (
                    <tr key={app.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '14px 20px', fontWeight: 900, color: C.teal }}>{app.app_number}</td>
                      <td style={{ padding: '14px 20px', fontWeight: 700, color: C.text }}>
                        {app.customer_name}
                        <div style={{ fontSize: '12px', color: C.textMid, fontWeight: 400 }}>{app.customer_mobile}</div>
                      </td>
                      <td style={{ padding: '14px 20px' }}>{app.product_name}</td>
                      <td style={{ padding: '14px 20px', fontWeight: 800, color: C.teal }}>₹{app.commission_amount || 500}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ 
                          padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 800,
                          background: app.status === 'approved' || app.status === 'disbursed' ? '#D1FAE5' : app.status === 'rejected' ? '#FEE2E2' : '#FEF3C7',
                          color: app.status === 'approved' || app.status === 'disbursed' ? '#065F46' : app.status === 'rejected' ? '#991B1B' : '#92400E'
                        }}>
                          {app.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', color: C.textMid }}>
                        {new Date(app.created_at).toLocaleDateString()}
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
