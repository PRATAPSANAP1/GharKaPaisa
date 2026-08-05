import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import { MdWarning, MdArrowForward } from 'react-icons/md';
import api from '../../../services/api';

export default function PartnerActionableQueues({ onSelectCustomer, notifications = [], allLeads = [] }) {
  const { t } = useTranslation();
  const { C, isDark } = useTheme();
  const [urgentQueries, setUrgentQueries] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchQueues = async () => {
      setLoading(true);
      try {
        let notifs = notifications;
        let apps = allLeads;

        if (!notifs || notifs.length === 0) {
          const res = await api.get('/notifications', { params: { limit: 20 } }).catch(() => null);
          notifs = res?.data?.data?.notifications || res?.data?.notifications || [];
        }

        if (!apps || apps.length === 0) {
          const res = await api.get('/applications', { params: { limit: 20 } }).catch(() => null);
          apps = res?.data?.data?.applications || res?.data?.data || res?.data || [];
        }

        const queries = [];

        // Parse applications for action required & underwriting queries
        if (Array.isArray(apps)) {
          apps.forEach(app => {
            const st = (app.status || app.stage || '').toLowerCase();
            if (st.includes('query') || st.includes('action') || st.includes('missing') || st.includes('mismatch')) {
              queries.push({
                id: app.application_number || app.id || `APP-${app.id}`,
                customer: app.customer_name || app.name || 'Customer',
                phone: app.customer_phone || app.phone || '',
                bank: app.bank_name || app.bank_code || 'Bank Partner',
                issue: app.query_description || app.remark || 'Action Required by Bank',
                slaRemaining: app.sla_remaining || '4 hrs SLA',
                income: app.income || '45000'
              });
            }
          });
        }

        // Parse notifications for actionable items
        if (Array.isArray(notifs)) {
          notifs.forEach(n => {
            const title = (n.title || n.message || '').toLowerCase();
            const msg = (n.message || n.body || '').toLowerCase();

            if ((title.includes('query') || title.includes('action') || title.includes('missing') || msg.includes('missing') || msg.includes('mismatch')) && queries.length < 5) {
              const appNo = n.reference_id ? `APP-${n.reference_id}` : 'APP-REQ';
              if (!queries.some(q => q.id === appNo)) {
                queries.push({
                  id: appNo,
                  customer: n.customer_name || 'Customer',
                  phone: n.phone || '',
                  bank: n.bank_name || 'Bank Partner',
                  issue: n.title || n.message || 'Missing Document',
                  slaRemaining: '6 hrs SLA',
                  income: '50000'
                });
              }
            }
          });
        }

        if (isMounted) {
          setUrgentQueries(queries);
        }
      } catch (err) {
        console.warn('Failed to load actionable queues:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchQueues();
    return () => { isMounted = false; };
  }, [notifications, allLeads]);

  // Hide component completely if there are no dynamic actionable queries
  if (!loading && urgentQueries.length === 0) {
    return null;
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '16px',
      marginBottom: '10px'
    }}>
      {/* URGENT BANK QUERIES */}
      {urgentQueries.length > 0 && (
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
                {t('actionableQueues.urgentBankQueries', 'Urgent Bank Queries')} ({urgentQueries.length})
              </h4>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '8px', background: '#FEE2E2', color: '#991B1B' }}>
              {t('actionableQueues.actionRequired', 'Action Required')}
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
                    {t('actionableQueues.resolve', 'Resolve')} <MdArrowForward size={14} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
