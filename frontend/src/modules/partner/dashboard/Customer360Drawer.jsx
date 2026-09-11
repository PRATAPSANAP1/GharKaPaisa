import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import { 
  MdClose, MdPerson, MdPhone, MdEmail, MdWork, MdAttachMoney, 
  MdFolder, MdAssignment, MdSend, MdUploadFile, MdCheckCircle, MdHourglassEmpty
} from 'react-icons/md';

export default function Customer360Drawer({ customer, allLeads = [], onClose }) {
  const { t } = useTranslation();
  const { C, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' | 'documents' | 'history' | 'communication'

  if (!customer) return null;

  // Filter real applications for this customer
  const customerApps = (() => {
    if (Array.isArray(customer.applications) && customer.applications.length > 0) {
      return customer.applications;
    }
    if (Array.isArray(allLeads) && allLeads.length > 0) {
      const matched = allLeads.filter(lead => {
        const leadName = (lead.customer_name || lead.name || '').toLowerCase();
        const leadPhone = String(lead.customer_phone || lead.phone || '').replace(/[^0-9]/g, '');
        const custName = (customer.name || customer.customer_name || '').toLowerCase();
        const custPhone = String(customer.phone || customer.mobile || '').replace(/[^0-9]/g, '');
        
        return (custPhone && leadPhone && leadPhone.includes(custPhone)) || 
               (custName && leadName && leadName === custName) ||
               (customer.id && lead.id === customer.id) ||
               (customer.application_id && lead.id === customer.application_id);
      });
      if (matched.length > 0) return matched;
    }
    // If specific item has bank/card info attached
    if (customer.bank || customer.issue) {
      return [{
        id: customer.id || 'APP-LIVE',
        bank_name: customer.bank || 'Partner Bank',
        product_name: customer.product || customer.issue || 'Credit Card / Loan Lead',
        status: customer.status || 'Under Review',
        stage: customer.stage || 'Bank Processing',
        commission_amount: customer.payout || customer.commission || 0
      }];
    }
    return [];
  })();

  // Calculate total estimated payout from real applications
  const estPayoutTotal = customerApps.reduce((acc, app) => {
    const amt = parseFloat(app.commission_amount || app.payout || app.amount || 0);
    return acc + (isNaN(amt) ? 0 : amt);
  }, 0);

  const displayPhone = customer.phone || customer.mobile || customer.customer_phone || 'N/A';
  const displayIncome = customer.income || customer.monthly_salary || customer.monthly_income;

  const defaultDocs = [
    { name: 'PAN Card', status: customer.pan_verified ? 'Verified' : 'Action Required', uploadedDate: customer.created_at ? new Date(customer.created_at).toLocaleDateString() : null },
    { name: 'Aadhaar Card', status: customer.aadhaar_verified ? 'Verified' : 'Action Required', uploadedDate: customer.created_at ? new Date(customer.created_at).toLocaleDateString() : null },
    { name: 'Salary Slip / Income Proof', status: 'Pending Upload', uploadedDate: null },
    { name: 'Bank Statement (6 Months)', status: 'Pending Upload', uploadedDate: null },
  ];

  const customerDocs = (Array.isArray(customer.documents) && customer.documents.length > 0)
    ? customer.documents
    : defaultDocs;

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
              {(customer.name || customer.customer_name || 'CU').substring(0, 2).toUpperCase()}
            </div>

            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                {isEmployee ? 'Employee 360° Profile' : t('customer360.title', 'Customer 360° Profile')}
              </span>
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: C.text, margin: '2px 0 0' }}>
                {customer.name || customer.customer_name || (isEmployee ? 'Employee Profile' : t('customer360.defaultName', 'Customer Profile'))}
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
            <span style={{ fontSize: '11px', fontWeight: 700, color: C.textMid }}>{t('customer360.mobile', 'MOBILE')}</span>
            <div style={{ fontSize: '13px', fontWeight: 800, color: C.text, marginTop: '2px' }}>
              {displayPhone}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: C.textMid }}>{t('customer360.monthlySalary', 'MONTHLY SALARY')}</span>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#10B981', marginTop: '2px' }}>
              {displayIncome ? `₹${parseFloat(displayIncome).toLocaleString('en-IN')}/${t('customer360.perMonth', 'mo')}` : 'N/A'}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: C.textMid }}>{t('customer360.estPayout', 'EST. PAYOUT')}</span>
            <div style={{ fontSize: '13px', fontWeight: 900, color: C.primary, marginTop: '2px' }}>
              ₹{estPayoutTotal.toLocaleString('en-IN')} {t('customer360.total', 'Total')}
            </div>
          </div>
        </div>

        {/* WORKSPACE TABS */}
        <div style={{
          display: 'flex', borderBottom: `1px solid ${C.border}`,
          padding: '0 24px', background: isDark ? '#0F172A' : '#F8FAFC', gap: '8px'
        }}>
          {[
            { id: 'pipeline', label: t('customer360.tabPipeline', 'Pipeline Apps'), icon: MdAssignment },
            { id: 'documents', label: t('customer360.tabDocs', 'Doc Vault'), icon: MdFolder },
            { id: 'communication', label: isEmployee ? 'Contact Member' : t('customer360.tabContact', 'Contact Customer'), icon: MdSend },
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
                {t('customer360.activePipelineHeader', 'Active Applications & Live Bank Pipeline')}
              </h4>

              {customerApps.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: C.textMid, fontSize: '13px' }}>
                  No active applications recorded for this customer yet.
                </div>
              ) : (
                customerApps.map((app, idx) => {
                  const statusStr = app.status || 'Under Review';
                  const isApproved = ['approved', 'disbursed', 'sanctioned'].includes(String(statusStr).toLowerCase());
                  const bankName = app.bank_name || app.bank || 'Partner Bank';
                  const productName = app.product_name || app.card || 'Credit Card / Loan';
                  const appIdStr = app.app_number || app.application_number || app.id || `APP-${idx + 1}`;
                  const payoutVal = parseFloat(app.commission_amount || app.payout || 0);

                  return (
                    <div key={appIdStr || idx} style={{
                      background: isDark ? '#1E293B' : '#F8FAFC',
                      borderRadius: '16px', padding: '16px',
                      border: `1px solid ${C.border}`,
                      display: 'flex', flexDirection: 'column', gap: '12px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: C.primary, textTransform: 'uppercase' }}>
                            {bankName}
                          </span>
                          <h5 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: '2px 0 0' }}>
                            {productName} (#{appIdStr})
                          </h5>
                        </div>

                        <span style={{
                          fontSize: '11.5px', fontWeight: 800, padding: '4px 10px', borderRadius: '10px',
                          background: isApproved ? '#D1FAE5' : '#FEF3C7',
                          color: isApproved ? '#065F46' : '#92400E'
                        }}>
                          {isApproved ? t('status.approved', 'Approved') : (statusStr.replace('_', ' ').toUpperCase())}
                        </span>
                      </div>

                      {/* STAGE TIMELINE BAR */}
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', borderRadius: '12px',
                        background: isDark ? '#0F172A' : '#FFFFFF', border: `1px solid ${C.border}`,
                        fontSize: '12px', color: C.textMid
                      }}>
                        <span>{t('customer360.stageLabel', 'Stage:')} <strong>{app.stage || app.status || 'Verification'}</strong></span>
                        <span style={{ fontWeight: 800, color: '#10B981' }}>{t('customer360.payoutLabel', 'Payout:')} ₹{payoutVal.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: DOCUMENT VAULT */}
          {activeTab === 'documents' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 900, color: C.text, margin: 0 }}>
                {t('customer360.docsChecklistHeader', 'Verification Documents Checklist')}
              </h4>

              {customerDocs.map((doc, idx) => (
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
                        {doc.name || doc.document_type}
                      </h5>
                      <span style={{ fontSize: '11.5px', color: C.textMid, fontWeight: 600 }}>
                        {doc.status === 'Verified' ? `${t('customer360.uploadedOn', 'Uploaded')} ${doc.uploadedDate || 'Verified'}` : t('customer360.actionRequired', 'Action Required')}
                      </span>
                    </div>
                  </div>

                  {doc.status !== 'Verified' && (
                    <button style={{
                      padding: '6px 14px', borderRadius: '10px', border: 'none',
                      background: C.primary, color: '#FFFFFF', fontWeight: 800, fontSize: '12px',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                    }}>
                      <MdUploadFile size={16} /> {t('common.upload', 'Upload')}
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
                {t('customer360.engagementHeader', 'Instant Customer Engagement')}
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <button
                  onClick={() => {
                    const phoneNum = (displayPhone !== 'N/A' ? displayPhone : '').replace(/[^0-9]/g, '');
                    if (!phoneNum) return alert('No phone number available for WhatsApp message');
                    window.open(`https://wa.me/91${phoneNum}?text=Hi%20${encodeURIComponent(customer.name || customer.customer_name || 'Customer')},%20your%20credit%20card%20application%20is%20in%20progress.%20Please%20share%20pending%20documents.`);
                  }}
                  style={{
                    padding: '14px', borderRadius: '12px', border: 'none',
                    background: '#25D366', color: '#FFFFFF', fontWeight: 900, fontSize: '13px',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                >
                  <MdSend size={18} /> {t('customer360.whatsappMsg', 'WhatsApp Message')}
                </button>

                <button
                  onClick={() => {
                    if (displayPhone === 'N/A') return alert('No phone number available to call');
                    window.open(`tel:${displayPhone}`);
                  }}
                  style={{
                    padding: '14px', borderRadius: '12px', border: `1px solid ${C.border}`,
                    background: isDark ? C.bgSecondary : '#F1F5F9', color: C.text, fontWeight: 900, fontSize: '13px',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                >
                  <MdPhone size={18} /> {t('customer360.callCustomer', 'Call Customer')}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
