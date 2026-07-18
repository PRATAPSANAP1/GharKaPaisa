import React from 'react';
import { Check, Clock, AlertCircle } from 'lucide-react';

const STEPS = [
  { id: 'applied', label: 'Applied' },
  { id: 'documents_uploaded', label: 'Documents Uploaded' },
  { id: 'verification', label: 'Verification' },
  { id: 'bank_review', label: 'Bank Review' },
  { id: 'approved', label: 'Approved' },
  { id: 'disbursed', label: 'Disbursed' }
];

const getStepIndex = (status) => {
  const norm = (status || '').toLowerCase();
  if (['draft', 'submitted', 'applied'].includes(norm)) return 0;
  if (['link_sent', 'documents_uploaded'].includes(norm)) return 1;
  if (['under_review', 'verification_pending'].includes(norm)) return 2;
  if (['verification_completed', 'sent_to_bank', 'bank_review'].includes(norm)) return 3;
  if (['approved'].includes(norm)) return 4;
  if (['disbursed'].includes(norm)) return 5;
  return 0;
};

const ApplicationTracker = ({ currentStatus }) => {
  const isRejected = (currentStatus || '').toLowerCase() === 'rejected';
  const activeIndex = isRejected ? -1 : getStepIndex(currentStatus);

  return (
    <div style={{ width: '100%', padding: '20px 10px', background: '#ffffff', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
      {isRejected && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', marginBottom: '16px', fontSize: '14px', fontWeight: 600 }}>
          <AlertCircle size={18} />
          <span>Application Status: REJECTED</span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        {STEPS.map((step, idx) => {
          const isCompleted = idx < activeIndex;
          const isCurrent = idx === activeIndex && !isRejected;
          const isPending = idx > activeIndex || isRejected;

          let circleBg = '#e2e8f0';
          let circleColor = '#64748b';
          let borderColor = '#cbd5e1';

          if (isCompleted) {
            circleBg = '#10b981'; // Green
            circleColor = '#ffffff';
            borderColor = '#10b981';
          } else if (isCurrent) {
            circleBg = '#f97316'; // Orange
            circleColor = '#ffffff';
            borderColor = '#f97316';
          }

          return (
            <React.Fragment key={step.id}>
              {/* Connector line */}
              {idx > 0 && (
                <div
                  style={{
                    flex: 1,
                    height: '3px',
                    backgroundColor: idx <= activeIndex && !isRejected ? '#10b981' : '#e2e8f0',
                    transition: 'all 0.3s ease',
                    margin: '0 4px',
                    marginTop: '-20px'
                  }}
                />
              )}

              {/* Step circle & label */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, minWidth: '70px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: circleBg,
                    color: circleColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '14px',
                    border: `2px solid ${borderColor}`,
                    boxShadow: isCurrent ? '0 0 0 4px rgba(249, 115, 22, 0.2)' : 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {isCompleted ? <Check size={18} /> : isCurrent ? <Clock size={18} className="animate-spin" /> : idx + 1}
                </div>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: isCurrent ? 700 : isCompleted ? 600 : 500,
                    color: isCurrent ? '#ea580c' : isCompleted ? '#059669' : '#64748b',
                    marginTop: '8px',
                    textAlign: 'center',
                    lineHeight: '1.2'
                  }}
                >
                  {step.label}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default ApplicationTracker;
