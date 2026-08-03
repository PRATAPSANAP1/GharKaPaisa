import React, { useState } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { MdWarning, MdAccessTime, MdAccountBalanceWallet, MdArrowForward } from 'react-icons/md';

export default function PartnerActionableQueues({ onSelectCustomer }) {
  const { C, isDark } = useTheme();

  const urgentQueries = [
    { id: 'APP-9014', customer: 'Rahul Sharma', phone: '+91 98765 43210', bank: 'HDFC Bank', issue: 'Missing Salary Slip', slaRemaining: '4 hrs SLA', income: '55000' },
    { id: 'APP-8942', customer: 'Sneha Patil', phone: '+91 98123 45678', bank: 'SBI Card', issue: 'Aadhaar Address Mismatch', slaRemaining: '12 hrs SLA', income: '42000' },
  ];

  const pendingKyc = [
    { id: 'APP-8812', customer: 'Amit Verma', phone: '+91 99887 76655', bank: 'ICICI Bank', issue: 'Aadhaar e-KYC Pending', slaRemaining: '24 hrs SLA', income: '38000' },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '16px',
      marginBottom: '10px'
    }}>
      {/* QUEUE 1: URGENT BANK QUERIES */}
      <div style={{
        background: C.card, borderRadius: '18px', padding: '18px 20px',
        border: `1.5px solid ${isDark ? '#7F1D1D' : '#FCA5A5'}`,
        display: 'flex', flexDirection: 'column', gap: '14px',
        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 18px rgba(239,68,68,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ padding: '6px', borderRadius: '10px', background: '#FEE2E2', color: '#DC2626' }}>
              <MdWarning size={18} />
            </div>
            <h4 style={{ fontSize: '15px', fontWeight: 900, color: C.text, margin: 0 }}>
              Urgent Bank Queries ({urgentQueries.length})
            </h4>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '8px', background: '#FEE2E2', color: '#991B1B' }}>
            Action Required
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {urgentQueries.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectCustomer && onSelectCustomer({ name: item.customer, phone: item.phone, income: item.income })}
              style={{
                padding: '12px 14px', borderRadius: '12px',
                background: isDark ? C.bgSecondary : '#FFF5F5',
                border: `1px solid ${isDark ? '#991B1B' : '#FECDD3'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <strong style={{ fontSize: '13.5px', color: C.text }}>{item.customer}</strong>
                  <span style={{ fontSize: '11px', color: C.primary, fontWeight: 800 }}>({item.bank})</span>
                </div>
                <div style={{ fontSize: '12px', color: '#DC2626', fontWeight: 700, marginTop: '2px' }}>
                  ⚠️ {item.issue}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#D97706', display: 'block' }}>
                  ⏱️ {item.slaRemaining}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: C.primary, display: 'inline-flex', alignItems: 'center', gap: '2px', marginTop: '2px' }}>
                  Resolve <MdArrowForward size={14} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* QUEUE 2: PENDING E-KYC */}
      <div style={{
        background: C.card, borderRadius: '18px', padding: '18px 20px',
        border: `1.5px solid ${isDark ? '#78350F' : '#FDE68A'}`,
        display: 'flex', flexDirection: 'column', gap: '14px',
        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 18px rgba(245,158,11,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ padding: '6px', borderRadius: '10px', background: '#FEF3C7', color: '#D97706' }}>
              <MdAccessTime size={18} />
            </div>
            <h4 style={{ fontSize: '15px', fontWeight: 900, color: C.text, margin: 0 }}>
              e-KYC Pending ({pendingKyc.length})
            </h4>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '8px', background: '#FEF3C7', color: '#92400E' }}>
            Customer Action
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {pendingKyc.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectCustomer && onSelectCustomer({ name: item.customer, phone: item.phone, income: item.income })}
              style={{
                padding: '12px 14px', borderRadius: '12px',
                background: isDark ? C.bgSecondary : '#FFFBEB',
                border: `1px solid ${isDark ? '#B45309' : '#FDE68A'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <strong style={{ fontSize: '13.5px', color: C.text }}>{item.customer}</strong>
                  <span style={{ fontSize: '11px', color: C.primary, fontWeight: 800 }}>({item.bank})</span>
                </div>
                <div style={{ fontSize: '12px', color: '#D97706', fontWeight: 700, marginTop: '2px' }}>
                  ⏳ {item.issue}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: C.textMid, display: 'block' }}>
                  {item.slaRemaining}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: C.primary, display: 'inline-flex', alignItems: 'center', gap: '2px', marginTop: '2px' }}>
                  Remind <MdArrowForward size={14} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
