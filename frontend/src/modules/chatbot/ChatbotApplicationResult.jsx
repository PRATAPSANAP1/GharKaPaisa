import React from 'react';
import { FaFileInvoice, FaClock, FaCheckCircle, FaTimesCircle, FaRupeeSign, FaUser } from 'react-icons/fa';

export default function ChatbotApplicationResult({ applications, userRole, C }) {
  if (!applications || applications.length === 0) return null;

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('approved')) {
      return { label: 'APPROVED', bg: '#22c55e15', color: '#22c55e', icon: <FaCheckCircle size={10} /> };
    }
    if (s.includes('reject') || s.includes('cancel')) {
      return { label: 'REJECTED', bg: '#ef444415', color: '#ef4444', icon: <FaTimesCircle size={10} /> };
    }
    return { label: (status || 'PENDING').toUpperCase(), bg: '#f59e0b15', color: '#f59e0b', icon: <FaClock size={10} /> };
  };

  return (
    <div className="chatbot-application-results" style={{ width: '100%', margin: '8px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {applications.map((app, idx) => {
        const badge = getStatusBadge(app.status);
        const amountType = app.amountType || (userRole === 'EMPLOYEE' ? 'INCENTIVE' : 'COMMISSION');

        return (
          <div
            key={app.id || idx}
            style={{
              background: C.card,
              border: `1.5px solid ${C.border}`,
              borderRadius: '14px',
              padding: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: '700', color: C.text, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FaFileInvoice color={C.primary} size={12} />
                <span>Ref: #{app.appNumber || app.id?.substring(0, 8)}</span>
              </span>

              <span
                style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: badge.bg,
                  color: badge.color,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {badge.icon}
                <span>{badge.label}</span>
              </span>
            </div>

            <h5 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '700', color: C.text }}>
              {app.productName}
            </h5>
            <span style={{ fontSize: '11px', color: C.textMid }}>{app.bankName || 'GharKaPaisa'}</span>

            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: `1px dashed ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {app.customerName && (
                <span style={{ fontSize: '11px', color: C.textMid, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <FaUser size={10} color={C.primary} />
                  <span>{app.customerName}</span>
                </span>
              )}

              {app.amount !== undefined && (
                <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#22c55e' }}>
                  {amountType === 'INCENTIVE' ? 'Incentive' : 'Commission'}: ₹{app.amount}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
