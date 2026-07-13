import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePartnerStore } from '../../../app/store/partnerStore';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import api from '../../../services/api';
import {
  MdSearch, MdPerson, MdPhone, MdEmail, MdWork,
  MdLocationOn, MdHistory, MdOutlineWhatsapp,
  MdAddBox, MdCreditCard
} from 'react-icons/md';

export default function PartnerCrm() {
  const { t } = useTranslation();
  const { C } = useTheme();
  const S = makeS(C);

  const fetchCustomers = usePartnerStore((state) => state.fetchCustomers);
  const customers = usePartnerStore((state) => state.customers);
  const isLoading = usePartnerStore((state) => state.isLoading);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [width, setWidth] = useState(window.innerWidth);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCust, setNewCust] = useState({
    fullName: '',
    mobile: '',
    email: '',
    panNumber: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  // Recommend Product Modal states
  const [showRecommendModal, setShowRecommendModal] = useState(false);
  const [productList, setProductList] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState('');

  useEffect(() => {
    fetchCustomers();
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fetchCustomers]);

  const createCustomer = usePartnerStore((state) => state.createCustomer);

  const handleOpenRecommendModal = async () => {
    setRecError('');
    setShowRecommendModal(true);
    try {
      const res = await api.get('/products');
      if (res.data?.success) {
        const rawData = res.data.data;
        const products = Array.isArray(rawData) ? rawData : (rawData?.items || rawData?.rows || []);
        setProductList(products);
        if (products.length > 0) setSelectedProductId(products[0].id);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
      setRecError('Failed to load product list.');
    }
  };

  const handleRecommendSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProductId) return setRecError('Please select a product to recommend.');
    if (!selectedCustomer) return setRecError('No customer selected.');

    setRecLoading(true);
    setRecError('');
    try {
      await api.post('/leads', {
        productId: selectedProductId,
        customerName: selectedCustomer.full_name,
        mobile: selectedCustomer.mobile,
        city: selectedCustomer.city || 'Shevgaon'
      });

      await fetchCustomers();
      // Update selected customer with refreshed store data
      const updatedCustomers = usePartnerStore.getState().customers;
      const refreshed = updatedCustomers.find(c => c.id === selectedCustomer.id || c.mobile === selectedCustomer.mobile);
      if (refreshed) setSelectedCustomer(refreshed);

      setShowRecommendModal(false);
    } catch (err) {
      setRecError(err.response?.data?.message || err.message || 'Failed to submit recommendation.');
    } finally {
      setRecLoading(false);
    }
  };

  const handleAddCustomerSubmit = async (e) => {
    e.preventDefault();
    if (!newCust.fullName.trim()) return setAddError('Full Name is required.');
    if (!newCust.mobile.trim() || newCust.mobile.trim().length < 10) return setAddError('Please enter a valid 10-digit mobile number.');
    
    setAddError('');
    setAddLoading(true);
    try {
      await createCustomer({
        fullName: newCust.fullName.trim(),
        mobile: newCust.mobile.trim(),
        email: newCust.email.trim() || null,
        panNumber: newCust.panNumber.trim() || null,
        city: newCust.city.trim() || null,
        state: newCust.state.trim() || null,
        pincode: newCust.pincode.trim() || null
      });

      // Refresh and select the newly added customer
      const freshCustomers = usePartnerStore.getState().customers;
      if (freshCustomers && freshCustomers.length > 0) {
        const justAdded = freshCustomers.find(c => c.mobile === newCust.mobile.trim());
        if (justAdded) setSelectedCustomer(justAdded);
      }

      setNewCust({
        fullName: '',
        mobile: '',
        email: '',
        panNumber: '',
        city: '',
        state: '',
        pincode: ''
      });
      setShowAddModal(false);
    } catch (err) {
      setAddError(err.message || 'Failed to add customer. Please try again.');
    } finally {
      setAddLoading(false);
    }
  };

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* ═══ PAGE HEADER WITH ADD CUSTOMER BUTTON ═══ */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 900, color: C.text, margin: 0 }}>{t("Customers")}</h1>
          <p style={{ fontSize: '13px', color: C.textMid || '#64748B', margin: '4px 0 0' }}>
            Manage your customer relationships and track applications
          </p>
        </div>
        <button
          id="btn-page-add-customer"
          type="button"
          onClick={() => { setShowAddModal(true); setAddError(''); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark || C.primary})`,
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: `0 4px 14px ${C.primary}30`,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 6px 20px ${C.primary}40`; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 14px ${C.primary}30`; }}
        >
          <MdAddBox size={18} /> Add Customer
        </button>
      </div>

    <div style={crmContainerStyle}>
      {/* ═══ CUSTOMER LIST SIDEBAR ═══ */}
      <div style={listPaneStyle}>
        <div style={{ padding: '20px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: 0 }}>{t("Customer CRM")}</h2>
          </div>
          <div style={{ position: 'relative' }}>
            <MdSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: C.textLight }} size={18} />
            <input
              type="text"
              placeholder={t("Search by name or mobile...")}
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
              <p style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>{t("No customers found.")}</p>
              <p style={{ fontSize: '12px', margin: '4px 0 0' }}>{t("Customers appear here after you submit leads.")}</p>
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
                      <span style={labelStyle}>{t("Mobile")}</span>
                      <span style={valStyle}><MdPhone size={14} style={{ color: C.textLight }} /> {selectedCustomer.mobile || '—'}</span>
                    </div>
                    <div>
                      <span style={labelStyle}>{t("Email")}</span>
                      <span style={valStyle}><MdEmail size={14} style={{ color: C.textLight }} /> {selectedCustomer.email || '—'}</span>
                    </div>
                    <div>
                      <span style={labelStyle}>{t("Employment")}</span>
                      <span style={valStyle}><MdWork size={14} style={{ color: C.textLight }} /> {selectedCustomer.employment_type || '—'}</span>
                    </div>
                    <div>
                      <span style={labelStyle}>{t("City")}</span>
                      <span style={valStyle}><MdLocationOn size={14} style={{ color: C.textLight }} /> {[selectedCustomer.city, selectedCustomer.state].filter(Boolean).join(', ') || '—'}</span>
                    </div>
                    <div>
                      <span style={labelStyle}>{t("PAN")}</span>
                      <span style={{ ...valStyle, fontFamily: 'monospace', background: C.card, padding: '2px 8px', borderRadius: '4px', border: `1px solid ${C.border}`, display: 'inline-block' }}>{selectedCustomer.pan_number || '—'}</span>
                    </div>
                    <div>
                      <span style={labelStyle}>{t("Aadhaar")}</span>
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
                  <button
                    type="button"
                    onClick={handleOpenRecommendModal}
                    style={{
                      width: '100%', padding: '12px', border: `1px dashed ${C.border}`,
                      borderRadius: '12px', color: C.primary, fontWeight: 700, fontSize: '13px',
                      background: `${C.primary}0D`, cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: '6px', transition: 'all 0.2s ease'
                    }}
                  >
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
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: '0 0 6px' }}>{t("Select a Customer")}</h2>
            <p style={{ fontSize: '14px', color: C.textMid, maxWidth: '340px', margin: 0 }}>
              Choose a customer from the left panel to view their profile and application history.
            </p>
          </div>
        )}
      </div>

      {/* ═══ ADD CUSTOMER MODAL ═══ */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: C.card,
            border: `1.5px solid ${C.border}`,
            borderRadius: '24px',
            padding: '28px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: 0 }}>{t("Add New Customer")}</h3>
              <button 
                onClick={() => { setShowAddModal(false); setAddError(''); }} 
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: C.textLight }}
              >
                ✕
              </button>
            </div>

            {addError && (
              <div style={{
                background: `${C.red}12`, border: `1.5px solid ${C.red}30`,
                borderRadius: '10px', padding: '10px 14px',
                fontSize: '12.5px', color: C.red,
                marginBottom: '16px'
              }}>
                {addError}
              </div>
            )}

            <form onSubmit={handleAddCustomerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Group 1: Basic Info */}
              <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: C.text }}>{t("Full Name *")}</label>
                  <input
                    type="text"
                    required
                    placeholder={t("Enter full name")}
                    value={newCust.fullName}
                    onChange={e => setNewCust(n => ({ ...n, fullName: e.target.value }))}
                    style={{ ...S.input, paddingVertical: '10px' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: C.text }}>{t("Mobile Number *")}</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder={t("Enter 10-digit mobile")}
                    value={newCust.mobile}
                    onChange={e => setNewCust(n => ({ ...n, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                    style={{ ...S.input, paddingVertical: '10px' }}
                  />
                </div>
              </div>

              {/* Group 2: Additional Contact */}
              <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: C.text }}>{t("Email Address")}</label>
                  <input
                    type="email"
                    placeholder={t("Enter email address")}
                    value={newCust.email}
                    onChange={e => setNewCust(n => ({ ...n, email: e.target.value }))}
                    style={{ ...S.input, paddingVertical: '10px' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: C.text }}>{t("PAN Number")}</label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder={t("ABCDE1234F")}
                    value={newCust.panNumber}
                    onChange={e => setNewCust(n => ({ ...n, panNumber: e.target.value.toUpperCase().slice(0, 10) }))}
                    style={{ ...S.input, paddingVertical: '10px' }}
                  />
                </div>
              </div>

              {/* Group 4: Address Info */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: C.text }}>{t("City")}</label>
                  <input
                    type="text"
                    placeholder={t("City")}
                    value={newCust.city}
                    onChange={e => setNewCust(n => ({ ...n, city: e.target.value }))}
                    style={{ ...S.input, paddingVertical: '10px' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: C.text }}>{t("State")}</label>
                  <input
                    type="text"
                    placeholder={t("State")}
                    value={newCust.state}
                    onChange={e => setNewCust(n => ({ ...n, state: e.target.value }))}
                    style={{ ...S.input, paddingVertical: '10px' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: C.text }}>{t("Pincode")}</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder={t("Pincode")}
                    value={newCust.pincode}
                    onChange={e => setNewCust(n => ({ ...n, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                    style={{ ...S.input, paddingVertical: '10px' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={addLoading}
                style={{
                  background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark || C.primary})`,
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '12px 16px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: addLoading ? 'not-allowed' : 'pointer',
                  opacity: addLoading ? 0.8 : 1,
                  marginTop: '12px',
                  boxShadow: `0 4px 14px ${C.primary}30`
                }}
              >
                {addLoading ? 'Adding Customer...' : 'Add Customer'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ═══ RECOMMEND NEW PRODUCT MODAL ═══ */}
      {showRecommendModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: C.card,
            border: `1.5px solid ${C.border}`,
            borderRadius: '24px',
            maxWidth: '520px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '12px', background: `${C.primary}15`,
                  color: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <MdCreditCard size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: C.text, margin: 0 }}>Recommend New Product</h3>
                  <span style={{ fontSize: '12px', color: C.textLight }}>
                    For {selectedCustomer?.full_name} ({selectedCustomer?.mobile})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRecommendModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textLight, fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            {recError && (
              <div style={{
                background: `${C.red}15`, border: `1px solid ${C.red}40`, color: C.red,
                padding: '10px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 600
              }}>
                {recError}
              </div>
            )}

            <form onSubmit={handleRecommendSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: C.text }}>Select Product to Recommend</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  style={{
                    ...S.input,
                    paddingVertical: '12px',
                    background: C.inputBg || C.card,
                    color: C.text,
                    cursor: 'pointer',
                    borderRadius: '12px'
                  }}
                >
                  {productList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.bank_name ? `(${p.bank_name})` : ''} — ₹{parseFloat(p.commission_value || p.payout_amount || 0).toLocaleString('en-IN')} Payout
                    </option>
                  ))}
                </select>
              </div>

              {selectedProductId && (() => {
                const selectedProd = productList.find(p => p.id === selectedProductId);
                if (!selectedProd) return null;
                return (
                  <div style={{
                    background: C.bgSecondary, border: `1px solid ${C.border}`,
                    borderRadius: '14px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px'
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: C.text }}>{selectedProd.name}</div>
                    <div style={{ fontSize: '11px', color: C.textLight }}>Category: {selectedProd.category || 'Financial Product'}</div>
                    <div style={{ fontSize: '14px', fontWeight: 900, color: C.green }}>
                      Commission Payout: ₹{parseFloat(selectedProd.commission_value || selectedProd.payout_amount || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                );
              })()}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowRecommendModal(false)}
                  style={{ ...S.btn('outline', false), padding: '10px 18px', fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recLoading || !selectedProductId}
                  style={{
                    background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark || C.primary})`,
                    color: '#FFFFFF', border: 'none', borderRadius: '12px', padding: '10px 20px',
                    fontSize: '13px', fontWeight: 700, cursor: recLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {recLoading ? 'Submitting...' : 'Confirm Recommendation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
    </div>
  );
}
