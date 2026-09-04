import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { FaArrowLeft, FaCoins, FaClock, FaCheckCircle, FaMoneyBillWave, FaShieldAlt } from 'react-icons/fa';
import api from '../../../services/api';

import MonthlyIncentiveReportView from './MonthlyIncentiveReportView';

export default function MyIncentives() {
  const { C } = useTheme();
  const navigate = useNavigate();

  const [activeView, setActiveView] = useState('monthly'); // 'monthly' or 'all'
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({ total_paid: 0, pending_incentive: 0, total_leads_converted: 0 });
  const [loading, setLoading] = useState(true);

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchIncentives = async () => {
    setLoading(true);
    try {
      const res = await api.get('/employee/incentives');
      if (res.data?.success) {
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

  const formatINR = (amt) => {
    const val = parseFloat(amt || 0);
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  const renderStatusBadge = (st) => {
    const s = String(st || 'PENDING').toUpperCase();
    if (s === 'PAID' || s === 'COMPLETED') {
      return <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800, background: '#10B98120', color: '#10B981', border: '1px solid #10B98140' }}>PAID</span>;
    } else if (s === 'PENDING') {
      return <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800, background: '#F59E0B20', color: '#F59E0B', border: '1px solid #F59E0B40' }}>PENDING</span>;
    } else if (s === 'IN_REVIEW') {
      return <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800, background: '#3B82F620', color: '#3B82F6', border: '1px solid #3B82F640' }}>IN REVIEW</span>;
    } else {
      return <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800, background: '#EF444420', color: '#EF4444', border: '1px solid #EF444440' }}>REJECTED</span>;
    }
  };

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: isMobile ? '16px 8px 60px' : '32px 24px 80px', fontFamily: "'Inter', sans-serif", color: C.text }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={() => navigate('/employee/dashboard')} 
              style={{ 
                background: C.card, border: `1px solid ${C.border}`, borderRadius: '50%', 
                width: '38px', height: '38px', display: 'flex', alignItems: 'center', 
                justifyContent: 'center', cursor: 'pointer', color: C.textMid, flexShrink: 0 
              }}
            >
              <FaArrowLeft />
            </button>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: C.teal, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Financial Ledger</span>
              <h1 style={{ fontSize: isMobile ? '20px' : '26px', fontWeight: 900, color: C.text, margin: 0 }}>My Incentives & Earnings</h1>
            </div>
          </div>

          {/* View Switcher */}
          <div style={{ display: 'flex', gap: '6px', background: C.card, padding: '4px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
            <button
              onClick={() => setActiveView('monthly')}
              style={{
                padding: '8px 16px', borderRadius: '9px', border: 'none',
                background: activeView === 'monthly' ? C.teal : 'transparent',
                color: activeView === 'monthly' ? '#FFF' : C.textMid,
                fontSize: '13px', fontWeight: 800, cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              🗓️ Monthly Audit & Structure
            </button>
            <button
              onClick={() => setActiveView('all')}
              style={{
                padding: '8px 16px', borderRadius: '9px', border: 'none',
                background: activeView === 'all' ? C.teal : 'transparent',
                color: activeView === 'all' ? '#FFF' : C.textMid,
                fontSize: '13px', fontWeight: 800, cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              📜 All Transactions Ledger
            </button>
          </div>
        </div>

        {activeView === 'monthly' ? (
          <MonthlyIncentiveReportView />
        ) : (
          <>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${C.teal}15`, color: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              <FaCoins />
            </div>
            <div>
              <span style={{ fontSize: '12px', color: C.textMid, fontWeight: 700, display: 'block' }}>Total Paid Earnings</span>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#10B981' }}>{formatINR(stats.total_paid)}</div>
            </div>
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#F59E0B15', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              <FaClock />
            </div>
            <div>
              <span style={{ fontSize: '12px', color: C.textMid, fontWeight: 700, display: 'block' }}>Pending Incentives</span>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#F59E0B' }}>{formatINR(stats.pending_incentive)}</div>
            </div>
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#3B82F615', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              <FaCheckCircle />
            </div>
            <div>
              <span style={{ fontSize: '12px', color: C.textMid, fontWeight: 700, display: 'block' }}>Leads Converted</span>
              <div style={{ fontSize: '22px', fontWeight: 900, color: C.text }}>{stats.total_leads_converted || transactions.length}</div>
            </div>
          </div>

        </div>

        {/* Transactions Table */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
          <div style={{ padding: '20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: C.text }}>Incentive Transactions Ledger</h3>
            <span style={{ fontSize: '12px', color: C.textMid, fontWeight: 600 }}>{transactions.length} Total Entries</span>
          </div>

          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: C.textMid }}>Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: C.textMid }}>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>No incentive transactions recorded yet.</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: C.textLight }}>Your earned incentives will automatically appear here once approved.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, color: C.textMid, fontWeight: 700 }}>
                    <th style={{ padding: '14px 20px' }}>App / Customer</th>
                    <th style={{ padding: '14px 20px' }}>Product</th>
                    <th style={{ padding: '14px 20px', textAlign: 'right' }}>Incentive Amount</th>
                    <th style={{ padding: '14px 20px', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '14px 20px' }}>Payment Ref / Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx, idx) => (
                    <tr key={tx.id || idx} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontWeight: 800, color: C.text, display: 'block' }}>{tx.customer_name || 'Customer Lead'}</span>
                        <span style={{ fontSize: '11px', color: C.textLight }}>App: {tx.app_number || 'N/A'}</span>
                      </td>
                      <td style={{ padding: '14px 20px', fontWeight: 600, color: C.text }}>{tx.product_name || 'Financial Product'}</td>
                      <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 900, color: C.teal }}>{formatINR(tx.amount)}</td>
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>{renderStatusBadge(tx.status)}</td>
                      <td style={{ padding: '14px 20px', color: C.textMid, fontSize: '12px' }}>
                        <span style={{ display: 'block', fontWeight: 600, color: C.text }}>{tx.created_at ? new Date(tx.created_at).toLocaleDateString() : 'N/A'}</span>
                        {tx.payment_reference && <span style={{ fontSize: '11px', color: C.teal }}>Ref: {tx.payment_reference}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </>
        )}
      </div>
    </div>
  );
}
