import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { FaArrowLeft, FaCoins, FaClock, FaCheckCircle } from 'react-icons/fa';
import axios from 'axios';

export default function MyIncentives() {
  const { C } = useTheme();
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({ total_paid: 0, pending_incentive: 0, total_leads_converted: 0 });
  const [loading, setLoading] = useState(true);

  const fetchIncentives = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const res = await axios.get('/api/v1/employee/incentives');
      if (res.data.success) {
        setTransactions(res.data.transactions || []);
        setStats(res.data.stats || {});
      }
    } catch (err) {
      console.error('Fetch employee incentives error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncentives();
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
            <span style={{ fontSize: '13px', fontWeight: 700, color: C.teal, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Financial Ledger</span>
            <h1 style={{ fontSize: '26px', fontWeight: 900, color: C.text, margin: 0 }}>My Incentives & Earnings</h1>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: `${C.teal}15`, color: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
              <FaCoins />
            </div>
            <div>
              <span style={{ fontSize: '13px', color: C.textMid, fontWeight: 700 }}>Total Paid Earnings</span>
              <div style={{ fontSize: '24px', fontWeight: 900, color: C.text }}>₹{stats.total_paid || 0}</div>
            </div>
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: '#F59E0B15', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
              <FaClock />
            </div>
            <div>
              <span style={{ fontSize: '13px', color: C.textMid, fontWeight: 700 }}>Pending Payouts</span>
              <div style={{ fontSize: '24px', fontWeight: 900, color: C.text }}>₹{stats.pending_incentive || 0}</div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
          <div style={{ padding: '20px', borderBottom: `1px solid ${C.border}` }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: C.text }}>Incentive Transactions Ledger</h3>
          </div>

          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: C.textMid }}>Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: C.textMid }}>No incentive transactions recorded yet.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, color: C.textMid, fontWeight: 700 }}>
                    <th style={{ padding: '14px 20px' }}>Customer Lead</th>
                    <th style={{ padding: '14px 20px' }}>Product</th>
                    <th style={{ padding: '14px 20px' }}>Incentive Amount</th>
                    <th style={{ padding: '14px 20px' }}>Status</th>
                    <th style={{ padding: '14px 20px' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '14px 20px', fontWeight: 700, color: C.text }}>{tx.customer_name || 'Customer Lead'}</td>
                      <td style={{ padding: '14px 20px' }}>{tx.product_name || 'Credit Card'}</td>
                      <td style={{ padding: '14px 20px', fontWeight: 900, color: C.teal }}>₹{tx.amount}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ 
                          padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 800,
                          background: tx.status === 'COMPLETED' ? '#D1FAE5' : '#FEF3C7',
                          color: tx.status === 'COMPLETED' ? '#065F46' : '#92400E'
                        }}>
                          {tx.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', color: C.textMid }}>
                        {new Date(tx.created_at).toLocaleDateString()}
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
