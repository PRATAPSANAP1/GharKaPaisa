import React, { useState } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { 
  MdClose, MdPerson, MdPhone, MdEmail, MdWork, MdAttachMoney, 
  MdFolder, MdAssignment, MdSend, MdUploadFile, MdCheckCircle, MdHourglassEmpty
} from 'react-icons/md';

export default function Customer360Drawer({ customer, onClose }) {
  const { C, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' | 'documents' | 'history' | 'communication'

  if (!customer) return null;

  const mockApplications = [
    { id: 'APP-9014', bank: 'HDFC Bank', card: 'HDFC Millennia', status: 'Under Review', stage: 'Bank Verification', date: '02 Aug 2026', payout: '₹2,500' },
    { id: 'APP-8812', bank: 'SBI Card', card: 'SBI SimplyCLICK', status: 'Approved', stage: 'Disbursed', date: '28 Jul 2026', payout: '₹2,200' },
  ];

  const mockDocuments = [
    { name: 'PAN Card', status: 'Verified', uploadedDate: '01 Aug 2026' },
    { name: 'Aadhaar Card', status: 'Verified', uploadedDate: '01 Aug 2026' },
    { name: 'Salary Slip (3 Months)', status: 'Pending Upload', uploadedDate: null },
    { name: 'Bank Statement (6 Months)', status: 'Pending Upload', uploadedDate: null },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1100,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', justifyContent: 'flex-end'
    }}>
      <div style={{
        width: '100%', maxWidth: '580px', height: '100%',
        background: C.card, borderLeft: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-10px 0 40px rgba(0,0,0,0.3)',
        animation: 'slideInRight 0.3s ease-out'
      }}>
        {/* DRAWER HEADER */}
        <div style={{
          padding: '20px 24px', borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: isDark ? '#0F172A' : '#F8FAFC'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '46px', height: '46px', borderRadius: '14px',
              background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#FFF', fontSize: '20px', fontWeight: 900
            }}>
              {customer.name ? customer.name.substring(0, 2).toUpperCase() : 'CU'}
            </div>

            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Customer 360° Profile
              </span>
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: C.text, margin: '2px 0 0' }}>
                {customer.name || 'Customer Profile'}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: C.textMid, cursor: 'pointer', padding: '6px' }}
          >
            <MdClose size={24} />
          </button>
        </div>

        {/* QUICK STATS STRIP */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          padding: '14px 24px', background: isDark ? '#1E293B' : '#FFFFFF',
          borderBottom: `1px solid ${C.border}`, gap: '10px'
        }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: C.textMid }}>MOBILE</span>
            <div style={{ fontSize: '13px', fontWeight: 800, color: C.text, marginTop: '2px' }}>
              {customer.phone || '+91 98765 43210'}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: C.textMid }}>MONTHLY SALARY</span>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#10B981', marginTop: '2px' }}>
              ₹{customer.income ? parseFloat(customer.income).toLocaleString('en-IN') : '45,000'}/mo
            </div>
          </div>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: C.textMid }}>EST. PAYOUT</span>
            <div style={{ fontSize: '13px', fontWeight: 900, color: C.primary, marginTop: '2px' }}>
              ₹4,700 Total
            </div>
          </div>
        </div>

        {/* WORKSPACE TABS */}
        <div style={{
          display: 'flex', borderBottom: `1px solid ${C.border}`,
          padding: '0 24px', background: isDark ? '#0F172A' : '#F8FAFC', gap: '8px'
        }}>
          {[
            { id: 'pipeline', label: 'Pipeline Apps', icon: MdAssignment },
            { id: 'documents', label: 'Doc Vault', icon: MdFolder },
            { id: 'communication', label: 'Contact Customer', icon: MdSend },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '12px 14px', border: 'none', background: 'none',
                  fontSize: '13px', fontWeight: isActive ? 800 : 600,
                  color: isActive ? C.primary : C.textMid,
                  borderBottom: isActive ? `3px solid ${C.primary}` : '3px solid transparent',
                  cursor: 'pointer'
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB CONTENT AREA */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* TAB 1: PIPELINE APPLICATIONS */}
          {activeTab === 'pipeline' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 900, color: C.text, margin: 0 }}>
                Active Applications & Live Bank Pipeline
              </h4>

              {mockApplications.map((app) => (
                <div key={app.id} style={{
                  background: isDark ? '#1E293B' : '#F8FAFC',
                  borderRadius: '16px', padding: '16px',
                  border: `1px solid ${C.border}`,
                  display: 'flex', flexDirection: 'column', gap: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: C.primary, textTransform: 'uppercase' }}>
                        {app.bank}
                      </span>
                      <h5 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: '2px 0 0' }}>
                        {app.card} (#{app.id})
                      </h5>
                    </div>

                    <span style={{
                      fontSize: '11.5px', fontWeight: 800, padding: '4px 10px', borderRadius: '10px',
                      background: app.status === 'Approved' ? '#D1FAE5' : '#FEF3C7',
                      color: app.status === 'Approved' ? '#065F46' : '#92400E'
                    }}>
                      {app.status}
                    </span>
                  </div>

                  {/* STAGE TIMELINE BAR */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: '12px',
                    background: isDark ? '#0F172A' : '#FFFFFF', border: `1px solid ${C.border}`,
                    fontSize: '12px', color: C.textMid
                  }}>
                    <span>Stage: <strong>{app.stage}</strong></span>
                    <span style={{ fontWeight: 800, color: '#10B981' }}>Payout: {app.payout}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: DOCUMENT VAULT */}
          {activeTab === 'documents' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 900, color: C.text, margin: 0 }}>
                Verification Documents Checklist
              </h4>

              {mockDocuments.map((doc, idx) => (
                <div key={idx} style={{
                  background: isDark ? '#1E293B' : '#F8FAFC',
                  borderRadius: '14px', padding: '14px 16px',
                  border: `1px solid ${C.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {doc.status === 'Verified' ? (
                      <MdCheckCircle size={20} color="#10B981" />
                    ) : (
                      <MdHourglassEmpty size={20} color="#F59E0B" />
                    )}
                    <div>
                      <h5 style={{ fontSize: '14px', fontWeight: 800, color: C.text, margin: 0 }}>
                        {doc.name}
                      </h5>
                      <span style={{ fontSize: '11.5px', color: C.textMid, fontWeight: 600 }}>
                        {doc.status === 'Verified' ? `Uploaded ${doc.uploadedDate}` : 'Action Required'}
                      </span>
                    </div>
                  </div>

                  {doc.status !== 'Verified' && (
                    <button style={{
                      padding: '6px 14px', borderRadius: '10px', border: 'none',
                      background: C.primary, color: '#FFFFFF', fontWeight: 800, fontSize: '12px',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                    }}>
                      <MdUploadFile size={16} /> Upload
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: COMMUNICATION */}
          {activeTab === 'communication' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 900, color: C.text, margin: 0 }}>
                Instant Customer Engagement
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <button
                  onClick={() => window.open(`https://wa.me/${(customer.phone || '9876543210').replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(customer.name || 'Customer')},%20your%20credit%20card%20application%20is%20in%20progress.%20Please%20share%20pending%20documents.`)}
                  style={{
                    padding: '14px', borderRadius: '12px', border: 'none',
                    background: '#25D366', color: '#FFFFFF', fontWeight: 900, fontSize: '13px',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                >
                  <MdSend size={18} /> WhatsApp Message
                </button>

                <button
                  onClick={() => window.open(`tel:${customer.phone || '+919876543210'}`)}
                  style={{
                    padding: '14px', borderRadius: '12px', border: `1px solid ${C.border}`,
                    background: isDark ? C.bgSecondary : '#F1F5F9', color: C.text, fontWeight: 900, fontSize: '13px',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                >
                  <MdPhone size={18} /> Call Customer
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
