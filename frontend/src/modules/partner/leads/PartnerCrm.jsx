import React, { useEffect, useState } from 'react';
import { usePartnerStore } from '../../../app/store/partnerStore';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import {
  MdSearch, MdPerson, MdPhone, MdEmail, MdWork,
  MdLocationOn, MdHistory, MdOutlineWhatsapp,
  MdAddBox, MdCreditCard
} from 'react-icons/md';

export default function PartnerCrm() {
  const { C } = useTheme();
  const S = makeS(C);

  const fetchCustomers = usePartnerStore((state) => state.fetchCustomers);
  const customers = usePartnerStore((state) => state.customers);
  const isLoading = usePartnerStore((state) => state.isLoading);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    fetchCustomers();
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fetchCustomers]);

  const isMobile = width < 992;

  const filteredCustomers = (customers || []).filter((c) =>
    c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.mobile?.includes(searchTerm)
  );

  const openWhatsApp = (mobile) => {
    window.open(`https://wa.me/91${mobile}`, '_blank', 'noopener,noreferrer');
  };

  const openCall = (mobile) => {
    window.location.href = `tel:+91${mobile}`;
  };

  const crmContainerStyle = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    gap: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
    height: isMobile ? 'auto' : 'calc(100vh - 160px)',
    paddingBottom: '40px'
  };

  const listPaneStyle = {
    width: isMobile ? '100%' : '340px',
    background: C.card,
    borderRadius: '16px',
    border: `1px solid ${C.border}`,
    display: 'flex',
    flexDirection: 'column',
    height: isMobile ? '400px' : '100%',
    overflow: 'hidden',
    flexShrink: 0
  };

  const detailPaneStyle = {
    flex: 1,
    minWidth: 0,
    background: C.card,
    borderRadius: '16px',
    border: `1px solid ${C.border}`,
    overflowY: 'auto',
    height: isMobile ? 'auto' : '100%',
    padding: isMobile ? '20px' : '32px',
    position: 'relative'
  };

  const labelStyle = { fontSize: '11px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.5px' };
  const valStyle = { fontSize: '14px', fontWeight: 600, color: C.text, display: 'flex', alignItems: 'center', gap: '6px', margin: '4px 0 0' };

  return (
    <div style={crmContainerStyle}>
      {/* ═══ CUSTOMER LIST SIDEBAR ═══ */}
      <div style={listPaneStyle}>
        <div style={{ padding: '20px', borderBottom: `1px solid ${C.border}` }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: '0 0 14px' }}>Customer CRM</h2>
          <div style={{ position: 'relative' }}>
            <MdSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: C.textLight }} size={18} />
            <input
              type="text"
              placeholder="Search by name or mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ ...S.input, paddingLeft: '36px', paddingTop: '10px', paddingBottom: '10px' }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '30px 0' }}>
              <span style={{
                width: 24, height: 24, borderRadius: '50%',
                border: `2px solid ${C.border}`, borderTopColor: C.primary,
                animation: 'spin .8s linear infinite', display: 'inline-block'
              }} />
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div style={{ textCenter: 'center', padding: '30px 16px', color: C.textLight, textAlign: 'center' }}>
              <MdPerson size={36} style={{ color: C.border, marginBottom: '8px' }} />
              <p style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>No customers found.</p>
              <p style={{ fontSize: '12px', margin: '4px 0 0' }}>Customers appear here after you submit leads.</p>
            </div>
          ) : (
            filteredCustomers.map((customer) => {
              const isSelected = selectedCustomer?.id === customer.id;
              return (
                <div
                  key={customer.id}
                  onClick={() => setSelectedCustomer(customer)}
                  style={{
                    padding: '14px', borderRadius: '12px', cursor: 'pointer',
                    border: `1px solid ${isSelected ? C.primary : C.border}`,
                    background: isSelected ? `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})` : C.card,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <h4 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: isSelected ? '#fff' : C.text }}>
                    {customer.full_name}
                  </h4>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px',
                    fontSize: '12px', color: isSelected ? 'rgba(255,255,255,0.8)' : C.textMid
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MdPhone size={13} /> {customer.mobile}
                    </span>
                    <span style={{
                      padding: '2px 6px', borderRadius: '4px',
                      background: isSelected ? 'rgba(255,255,255,0.2)' : C.bgSecondary,
                      fontSize: '9px', fontWeight: 700, uppercase: 'true'
                    }}>
                      {customer.application_count} Products
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ═══ DETAIL VIEW PANE ═══ */}
      <div style={detailPaneStyle}>
        {selectedCustomer ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Header */}
            <div style={{
              display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between',
              alignItems: 'center', gap: '16px', borderBottom: `1px solid ${C.border}`, paddingBottom: '20px'
            }}>
              <div style={{ display: 'flex', items: 'center', gap: '16px' }}>
                <div style={{
                  width: 52, height: 52, background: C.bgSecondary, border: `1px solid ${C.border}`,
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.primary
                }}>
                  <MdPerson size={28} />
                </div>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: C.text, margin: 0 }}>{selectedCustomer.full_name}</h2>
                  <p style={{ fontSize: '13px', color: C.textMid, margin: '4px 0 0', fontWeight: 500 }}>
                    Customer since {selectedCustomer.first_application_at
                      ? new Date(selectedCustomer.first_application_at).getFullYear()
                      : '—'}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => openWhatsApp(selectedCustomer.mobile)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', background: '#25D366', color: '#fff', border: 'none',
                    borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  <MdOutlineWhatsapp size={18} /> WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => openCall(selectedCustomer.mobile)}
                  style={{
                    ...S.btn('outline'), display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', borderRadius: '10px', fontSize: '13px',
                    color: C.textMid, border: `1px solid ${C.border}`
                  }}
                >
                  <MdPhone size={18} /> Call
                </button>
              </div>
            </div>

            {/* Profile Info and Products applied */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: C.textMid, textTransform: 'uppercase', letterSpacing: '0.6px', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MdPerson /> Profile Information
                </h3>
                <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <span style={labelStyle}>Mobile</span>
                      <span style={valStyle}><MdPhone size={14} style={{ color: C.textLight }} /> {selectedCustomer.mobile || '—'}</span>
                    </div>
                    <div>
                      <span style={labelStyle}>Email</span>
                      <span style={valStyle}><MdEmail size={14} style={{ color: C.textLight }} /> {selectedCustomer.email || '—'}</span>
                    </div>
                    <div>
                      <span style={labelStyle}>Employment</span>
                      <span style={valStyle}><MdWork size={14} style={{ color: C.textLight }} /> {selectedCustomer.employment_type || '—'}</span>
                    </div>
                    <div>
                      <span style={labelStyle}>City</span>
                      <span style={valStyle}><MdLocationOn size={14} style={{ color: C.textLight }} /> {[selectedCustomer.city, selectedCustomer.state].filter(Boolean).join(', ') || '—'}</span>
                    </div>
                    <div>
                      <span style={labelStyle}>PAN</span>
                      <span style={{ ...valStyle, fontFamily: 'monospace', background: C.card, padding: '2px 8px', borderRadius: '4px', border: `1px solid ${C.border}`, display: 'inline-block' }}>{selectedCustomer.pan_number || '—'}</span>
                    </div>
                    <div>
                      <span style={labelStyle}>Aadhaar</span>
                      <span style={{ ...valStyle, fontFamily: 'monospace', background: C.card, padding: '2px 8px', borderRadius: '4px', border: `1px solid ${C.border}`, display: 'inline-block' }}>
                        {selectedCustomer.aadhaar_last4 ? `XXXX-XXXX-${selectedCustomer.aadhaar_last4}` : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: C.textMid, textTransform: 'uppercase', letterSpacing: '0.6px', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MdCreditCard /> Products Applied
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(selectedCustomer.applications || []).map((p) => (
                    <div key={p.app_number || p.id} style={{ padding: '14px', border: `1px solid ${C.border}`, borderRadius: '12px', background: C.card }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ fontSize: '14px', fontWeight: 700, color: C.text, margin: 0 }}>{p.product_name}</h4>
                          <p style={{ fontSize: '12px', color: C.textLight, margin: '4px 0 0' }}>{p.bank_code} • {new Date(p.created_at).toLocaleDateString()}</p>
                        </div>
                        <span style={S.tag(p.status === 'approved' ? C.green : p.status === 'rejected' ? C.red : C.gold)}>
                          {p.status?.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                  <button type="button" style={{
                    width: '100%', padding: '12px', border: `1px dashed ${C.border}`,
                    borderRadius: '12px', color: C.textMid, fontWeight: 700, fontSize: '13px',
                    background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '6px'
                  }}>
                    <MdAddBox size={18} /> Recommend New Product
                  </button>
                </div>
              </div>
            </div>

            {/* Application Timeline */}
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '24px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: C.textMid, textTransform: 'uppercase', letterSpacing: '0.6px', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <MdHistory /> Application Timeline
              </h3>
              <div style={{
                position: 'relative', paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '20px'
              }}>
                <div style={{
                  position: 'absolute', top: 4, bottom: 4, left: 5, width: 2, background: C.border
                }} />
                {(selectedCustomer.applications || []).map((app) => (
                  <div key={app.id} style={{ position: 'relative' }}>
                    <div style={{
                      position: 'absolute', left: '-24px', top: '2px', width: 12, height: 12,
                      borderRadius: '50%', background: C.card, border: `2.5px solid ${C.primary}`,
                      marginLeft: '-1px'
                    }} />
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: C.text, margin: 0 }}>{app.product_name}</h4>
                    <p style={{ fontSize: '11px', color: C.textLight, margin: '2px 0 6px' }}>{new Date(app.created_at).toLocaleDateString()} • {app.status?.replace('_', ' ')}</p>
                    <div style={{
                      background: C.bgSecondary, border: `1px solid ${C.border}`,
                      padding: '10px 14px', borderRadius: '8px', fontSize: '13px', color: C.textMid
                    }}>
                      {app.bank_name} — App #{app.app_number}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: '300px', height: '100%', textAlign: 'center'
          }}>
            <div style={{
              width: 72, height: 72, bg: C.bgSecondary, border: `1px solid ${C.border}`,
              color: C.textLight, borderRadius: '50%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', marginBottom: '16px', background: C.bgSecondary
            }}>
              <MdPerson size={36} />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: '0 0 6px' }}>Select a Customer</h2>
            <p style={{ fontSize: '14px', color: C.textMid, maxWidth: '340px', margin: 0 }}>
              Choose a customer from the left panel to view their profile and application history.
            </p>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
