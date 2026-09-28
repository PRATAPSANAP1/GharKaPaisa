import React, { useState, useEffect, useRef } from 'react';
import { 
  FaWhatsapp, FaTimes, FaPaperPlane, FaFileAlt, FaCheckCircle, 
  FaExclamationTriangle, FaEye, FaUser, FaPhone, FaShieldAlt, FaSearch, FaSync, FaLink, FaPaperclip, FaUserTie, FaBoxOpen, FaLock, FaCheck, FaBuilding, FaTag
} from 'react-icons/fa';
import api from '../../services/api';
import { useAuthStore } from '../../app/store/authStore';

export default function SendWhatsAppModal({
  isOpen,
  onClose,
  recipientMobile = '',
  recipientName = '',
  applicationId = null,
  leadId = null,
  customerId = null,
  documentName = '',
  documentUrl = '',
  documentType = 'PDF',
  initialTemplateCategory = null,
  initialVariables = {},
  onSuccess = null
}) {
  const { user } = useAuthStore();
  
  // Send To Toggle: CUSTOMER | STAFF
  const [recipientCategory, setRecipientCategory] = useState('CUSTOMER');

  // Staff Share Type: GENERAL | PRODUCT | APPLICATION | DOCUMENT
  const [staffShareType, setStaffShareType] = useState('GENERAL');

  // Core Form State
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [variables, setVariables] = useState({});
  const [mobile, setMobile] = useState('');
  const [mobileMasked, setMobileMasked] = useState('');
  const [name, setName] = useState('');
  const [allowAlternateMobile, setAllowAlternateMobile] = useState(false);
  const [alternateMobile, setAlternateMobile] = useState('');
  const [sending, setSending] = useState(false);
  const [successResult, setSuccessResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Document & Report Attachment State
  const [docName, setDocName] = useState(documentName || '');
  const [docUrl, setDocUrl] = useState(documentUrl || '');
  const [docType, setDocType] = useState(documentType || 'PDF');
  const [showAttachDoc, setShowAttachDoc] = useState(Boolean(documentName || documentUrl));

  // Application State
  const [appSearchQuery, setAppSearchQuery] = useState('');
  const [applicationsList, setApplicationsList] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null); // Authoritative Context Object
  const [showAppDropdown, setShowAppDropdown] = useState(false);

  // Staff State
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null); // Authoritative Staff Context
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);

  // Product Context State
  const [productsList, setProductsList] = useState([]);
  const [selectedProductContext, setSelectedProductContext] = useState(null);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const appSearchTimeoutRef = useRef(null);
  const staffSearchTimeoutRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setRecipientCategory('CUSTOMER');
      setStaffShareType('GENERAL');
      setMobile('');
      setMobileMasked('');
      setName('');
      setAllowAlternateMobile(false);
      setAlternateMobile('');
      setDocName(documentName || '');
      setDocUrl(documentUrl || '');
      setDocType(documentType || 'PDF');
      setShowAttachDoc(Boolean(documentName || documentUrl));
      setSelectedApp(null);
      setSelectedStaff(null);
      setSelectedProductContext(null);
      setAppSearchQuery('');
      setStaffSearchQuery('');
      setSuccessResult(null);
      setErrorMsg(null);
      fetchTemplates();
      fetchInitialProductsList();

      if (applicationId) {
        fetchApplicationContext(applicationId);
      }
    }
  }, [isOpen, applicationId, documentName, documentUrl, documentType]);

  // Search Applications DB with 300ms Debounce
  const handleAppSearchInputChange = (val) => {
    setAppSearchQuery(val);
    setShowAppDropdown(true);

    if (appSearchTimeoutRef.current) clearTimeout(appSearchTimeoutRef.current);

    appSearchTimeoutRef.current = setTimeout(async () => {
      setLoadingApps(true);
      try {
        const res = await api.get('/whatsapp/search/applications', { params: { q: val.trim(), limit: 10 } });
        setApplicationsList(res.data?.data || []);
      } catch (err) {
        console.error('Application search error:', err);
      } finally {
        setLoadingApps(false);
      }
    }, 300);
  };

  // Authoritative Application Context Fetch
  const fetchApplicationContext = async (appId) => {
    try {
      const res = await api.get(`/whatsapp/recipient-context/application/${appId}`);
      if (res.data?.success) {
        const ctx = res.data.data;
        setSelectedApp(ctx);
        setShowAppDropdown(false);

        setName(ctx.customer.name);
        setMobile(ctx.customer.mobile);
        setMobileMasked(ctx.customer.mobile_masked);

        const overrides = ctx.template_variables || {};
        if (selectedTemplate) {
          populateTemplateVariables(selectedTemplate, overrides);
        }
      }
    } catch (err) {
      console.error('Failed to fetch application context:', err);
      setErrorMsg('Failed to fetch application details from database.');
    }
  };

  // Select Application from Dropdown
  const handleSelectAppItem = (appItem) => {
    fetchApplicationContext(appItem.id || appItem.app_number);
  };

  const clearSelectedApp = () => {
    setSelectedApp(null);
    setAppSearchQuery('');
    setName('');
    setMobile('');
    setMobileMasked('');
  };

  // Search Staff DB with 300ms Debounce
  const handleStaffSearchInputChange = (val) => {
    setStaffSearchQuery(val);
    setShowStaffDropdown(true);

    if (staffSearchTimeoutRef.current) clearTimeout(staffSearchTimeoutRef.current);

    staffSearchTimeoutRef.current = setTimeout(async () => {
      setLoadingStaff(true);
      try {
        const res = await api.get('/whatsapp/search/staff', { params: { q: val.trim(), limit: 10 } });
        setStaffList(res.data?.data || []);
      } catch (err) {
        console.error('Staff search error:', err);
      } finally {
        setLoadingStaff(false);
      }
    }, 300);
  };

  // Authoritative Staff Context Fetch
  const fetchStaffContext = async (staffId) => {
    try {
      const res = await api.get(`/whatsapp/recipient-context/staff/${staffId}`);
      if (res.data?.success) {
        const ctx = res.data.data;
        setSelectedStaff(ctx);
        setShowStaffDropdown(false);

        setName(ctx.staff.name);
        setMobile(ctx.staff.mobile);
        setMobileMasked(ctx.staff.mobile_masked);

        const overrides = ctx.template_variables || {};
        if (selectedTemplate) {
          populateTemplateVariables(selectedTemplate, overrides);
        }
      }
    } catch (err) {
      console.error('Failed to fetch staff context:', err);
      setErrorMsg('Failed to fetch staff details from database.');
    }
  };

  const handleSelectStaffItem = (staffItem) => {
    fetchStaffContext(staffItem.id || staffItem.staff_code);
  };

  const clearSelectedStaff = () => {
    setSelectedStaff(null);
    setStaffSearchQuery('');
    setName('');
    setMobile('');
    setMobileMasked('');
  };

  // Fetch Initial Products List
  const fetchInitialProductsList = async () => {
    setLoadingProducts(true);
    try {
      const res = await api.get('/whatsapp/products-list');
      setProductsList(res.data?.data || []);
    } catch (err) {
      console.warn('Products list fetch warning:', err.message);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Authoritative Product Context Fetch
  const fetchProductContext = async (productId) => {
    try {
      const res = await api.get(`/whatsapp/product-context/${productId}`);
      if (res.data?.success) {
        const prodCtx = res.data.data;
        setSelectedProductContext(prodCtx);

        if (prodCtx.apply_url) {
          setDocName(`${prodCtx.product_name} Brochure & Details`);
          setDocUrl(prodCtx.apply_url);
          setShowAttachDoc(true);
        }

        const overrides = prodCtx.template_variables || {};
        if (selectedTemplate) {
          populateTemplateVariables(selectedTemplate, overrides);
        }
      }
    } catch (err) {
      console.error('Failed to fetch product context:', err);
    }
  };

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await api.get('/whatsapp/templates');
      if (res.data?.success) {
        const tpls = res.data.data || [];
        setTemplates(tpls);

        if (tpls.length > 0) {
          let defaultTpl = tpls[0];
          if (initialTemplateCategory) {
            const match = tpls.find(t => t.template_category === initialTemplateCategory);
            if (match) defaultTpl = match;
          }
          handleSelectTemplate(defaultTpl);
        }
      }
    } catch (err) {
      console.error('Failed to load WhatsApp templates:', err);
      setErrorMsg('Failed to load WhatsApp templates.');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const populateTemplateVariables = (tpl, overrides = {}) => {
    const initialVars = {};
    const tplVars = Array.isArray(tpl.variables) ? tpl.variables : [];

    const custName = overrides.customer_name || selectedApp?.customer?.name || selectedStaff?.staff?.name || name || 'Recipient';
    const appNum = overrides.application_id || selectedApp?.application?.application_number || 'N/A';
    const panMaskedVal = overrides.pan_masked || selectedApp?.customer?.pan_masked || 'ABCD******';
    const bankNameVal = overrides.bank_name || selectedApp?.bank?.name || selectedProductContext?.bank_name || 'HDFC Bank';
    const prodNameVal = overrides.product_name || selectedApp?.product?.name || selectedProductContext?.product_name || 'Credit Card';

    tplVars.forEach(v => {
      if (overrides[v] !== undefined) {
        initialVars[v] = overrides[v];
      } else if (v === 'customer_name' || v === 'recipient_name') {
        initialVars[v] = custName;
      } else if (v === 'application_id') {
        initialVars[v] = appNum;
      } else if (v === 'pan_masked') {
        initialVars[v] = panMaskedVal;
      } else if (v === 'bank_name') {
        initialVars[v] = bankNameVal;
      } else if (v === 'product_name') {
        initialVars[v] = prodNameVal;
      } else if (v === 'staff_name') {
        initialVars[v] = selectedStaff?.staff?.name || custName;
      } else if (v === 'staff_code') {
        initialVars[v] = selectedStaff?.staff?.staff_code || 'YOH-TC0042';
      } else if (v === 'designation') {
        initialVars[v] = selectedStaff?.staff?.designation || 'Team Coordinator';
      } else if (selectedProductContext && selectedProductContext.template_variables?.[v]) {
        initialVars[v] = selectedProductContext.template_variables[v];
      } else {
        initialVars[v] = tpl.sample_values?.[v] || '';
      }
    });
    setVariables(initialVars);
  };

  const handleSelectTemplate = (tpl) => {
    setSelectedTemplate(tpl);
    let overrides = {};
    if (selectedApp) {
      overrides = selectedApp.template_variables || {};
    } else if (selectedStaff) {
      overrides = selectedStaff.template_variables || {};
    }
    if (selectedProductContext) {
      overrides = { ...overrides, ...(selectedProductContext.template_variables || {}) };
    }
    populateTemplateVariables(tpl, overrides);
  };

  const handleVariableChange = (varKey, val) => {
    setVariables(prev => ({ ...prev, [varKey]: val }));
  };

  const renderPreviewText = () => {
    if (!selectedTemplate) return '';
    let text = selectedTemplate.body || '';
    for (const [k, v] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${k}\\s*}}`, 'gi');
      text = text.replace(regex, v || `[${k}]`);
    }

    if (recipientCategory === 'STAFF' && staffShareType === 'PRODUCT' && selectedProductContext) {
      text = `Hello ${selectedStaff?.staff?.name || 'Staff'},\n\nPlease find the latest information regarding ${selectedProductContext.bank_name} ${selectedProductContext.product_name}.\n\n• Interest Rate: ${selectedProductContext.interest_rate}\n• Processing Fee: ${selectedProductContext.processing_fee}\n• Max Loan/Card Limit: ${selectedProductContext.loan_amount}\n• Tenure: ${selectedProductContext.tenure}\n• Required Documents: ${selectedProductContext.documents_required}\n\nRegards,\nGharKaPaisa`;
    }

    if (docName || docUrl) {
      text += `\n\n📄 Attached File: ${docName || 'Report'}${docUrl ? `\n🔗 Link: ${docUrl}` : ''}`;
    }
    return text;
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    const finalMobile = allowAlternateMobile && alternateMobile.trim() ? alternateMobile.trim() : mobile.trim();
    if (!finalMobile) {
      setErrorMsg('Recipient mobile number is required.');
      return;
    }
    if (!selectedTemplate) {
      setErrorMsg('Please select an approved template.');
      return;
    }

    setSending(true);
    setErrorMsg(null);

    try {
      const payload = {
        template_name: selectedTemplate.template_name,
        recipient_mobile: finalMobile,
        recipient_name: name.trim() || 'Recipient',
        recipient_type: recipientCategory === 'STAFF' ? 'STAFF' : 'CUSTOMER',
        variables: variables,
        document_name: docName.trim() || null,
        document_url: docUrl.trim() || null,
        document_type: docType || 'PDF',
        application_id: selectedApp?.application?.id || applicationId,
        staff_id: selectedStaff?.staff?.id || null,
        product_id: selectedProductContext?.id || null,
        allow_alternate_mobile: allowAlternateMobile
      };

      const res = await api.post('/whatsapp/send-template', payload);
      if (res.data?.success) {
        setSuccessResult(res.data.data);
        if (onSuccess) onSuccess(res.data.data);
      }
    } catch (err) {
      console.error('Send WhatsApp failed:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to dispatch WhatsApp message.');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px'
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '18px',
        width: '100%',
        maxWidth: '760px',
        maxHeight: '94vh',
        overflowY: 'auto',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Inter', sans-serif"
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px',
          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTopLeftRadius: '18px',
          borderTopRightRadius: '18px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px', color: '#FFFFFF'
            }}>
              <FaWhatsapp />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, letterSpacing: '-0.2px' }}>
                Send Official WhatsApp Message
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.85)' }}>
                Official GharKaPaisa Business Channel
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#FFFFFF',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <FaTimes />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Sender Attribution & Audit Badge */}
          <div style={{
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: '12px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12.5px',
            color: '#166534'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaShieldAlt size={14} color="#15803D" />
              <span>
                Sending as <strong>GharKaPaisa Official</strong> • Initiated by: <strong>{user?.full_name || 'Sharad Yohesa'} - {user?.designation || 'TC'}</strong>
              </span>
            </div>
            <span style={{ fontSize: '11px', background: '#DCFCE7', color: '#15803D', padding: '3px 8px', borderRadius: '6px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FaCheck size={10} /> Audit Logged
            </span>
          </div>

          {/* Send To Selection Radio Buttons */}
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
              Send To
            </label>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px', fontWeight: 700, color: recipientCategory === 'CUSTOMER' ? '#059669' : '#475569' }}>
                <input
                  type="radio"
                  name="recipientCategory"
                  value="CUSTOMER"
                  checked={recipientCategory === 'CUSTOMER'}
                  onChange={() => {
                    setRecipientCategory('CUSTOMER');
                    setSelectedStaff(null);
                  }}
                  style={{ accentColor: '#059669', width: '16px', height: '16px' }}
                />
                Customer
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px', fontWeight: 700, color: recipientCategory === 'STAFF' ? '#059669' : '#475569' }}>
                <input
                  type="radio"
                  name="recipientCategory"
                  value="STAFF"
                  checked={recipientCategory === 'STAFF'}
                  onChange={() => {
                    setRecipientCategory('STAFF');
                    setSelectedApp(null);
                  }}
                  style={{ accentColor: '#059669', width: '16px', height: '16px' }}
                />
                Staff
              </label>
            </div>
          </div>

          {errorMsg && (
            <div style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#991B1B',
              padding: '12px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FaExclamationTriangle color="#DC2626" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successResult ? (
            <div style={{
              padding: '30px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: '#DCFCE7', color: '#16A34A',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '28px'
              }}>
                <FaCheckCircle />
              </div>
              <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                WhatsApp Message Dispatched!
              </h4>
              <p style={{ margin: 0, fontSize: '13.5px', color: '#64748B', maxWidth: '420px' }}>
                Message <strong>{successResult.message_uuid || successResult.id}</strong> sent to <strong>{successResult.recipient_mobile}</strong> using template <strong>{successResult.template_name}</strong>.
              </p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  onClick={() => { setSuccessResult(null); onClose(); }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '10px',
                    background: '#059669',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* ──────────────── CUSTOMER WORKFLOW ──────────────── */}
              {recipientCategory === 'CUSTOMER' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Select Application Field */}
                  <div style={{ position: 'relative' }}>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                      Select Application
                    </label>

                    {selectedApp ? (
                      /* Selected Application Authoritative Card */
                      <div style={{
                        background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
                        border: '1px solid #86EFAC',
                        borderRadius: '12px',
                        padding: '14px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FaCheckCircle color="#16A34A" size={14} /> {selectedApp.customer.name}
                          </div>
                          <div style={{ fontSize: '12.5px', color: '#15803D', fontWeight: 700 }}>
                            Application #: <strong>{selectedApp.application.application_number}</strong>
                          </div>
                          <div style={{ fontSize: '12px', color: '#166534' }}>
                            {selectedApp.customer.mobile_masked} • {selectedApp.bank.name} • {selectedApp.product.name}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#15803D', fontWeight: 700 }}>
                            Status: <span style={{ background: '#BBF7D0', padding: '1px 6px', borderRadius: '4px' }}>{selectedApp.application.status}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={clearSelectedApp}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            background: '#FFFFFF',
                            border: '1px solid #86EFAC',
                            color: '#15803D',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      /* Autocomplete Application Search Input */
                      <div style={{ position: 'relative' }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', background: '#F8FAFC',
                          border: '1px solid #CBD5E1', borderRadius: '10px', padding: '10px 14px'
                        }}>
                          <FaSearch color="#64748B" size={13} style={{ marginRight: '8px' }} />
                          <input
                            type="text"
                            value={appSearchQuery}
                            onFocus={() => setShowAppDropdown(true)}
                            onChange={(e) => handleAppSearchInputChange(e.target.value)}
                            placeholder="Search Application #, Customer Name, Mobile..."
                            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13.5px', fontWeight: 600, color: '#0F172A' }}
                          />
                          {loadingApps && <FaSync className="fa-spin" color="#059669" size={13} />}
                        </div>

                        {/* Autocomplete Card Dropdown */}
                        {showAppDropdown && (
                          <div style={{
                            position: 'absolute',
                            top: '105%',
                            left: 0, right: 0,
                            background: '#FFFFFF',
                            border: '1px solid #CBD5E1',
                            borderRadius: '12px',
                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                            maxHeight: '260px',
                            overflowY: 'auto',
                            zIndex: 20,
                            padding: '6px'
                          }}>
                            {loadingApps ? (
                              <div style={{ padding: '12px', fontSize: '12.5px', color: '#64748B', textAlign: 'center' }}>
                                Searching database...
                              </div>
                            ) : applicationsList.length === 0 ? (
                              <div style={{ padding: '12px', fontSize: '12.5px', color: '#64748B', textAlign: 'center' }}>
                                No matching applications found
                              </div>
                            ) : (
                              applicationsList.map(appItem => (
                                <div
                                  key={appItem.id}
                                  onClick={() => handleSelectAppItem(appItem)}
                                  style={{
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid #F1F5F9',
                                    background: '#FFFFFF',
                                    transition: 'background 0.15s ease'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = '#F0FDF4'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = '#FFFFFF'}
                                >
                                  <div style={{ fontWeight: 800, fontSize: '13.5px', color: '#0F172A' }}>
                                    {appItem.app_number}
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#334155', fontWeight: 600 }}>
                                    Customer: {appItem.customer_name} • Mobile: {appItem.customer_mobile_masked}
                                  </div>
                                  <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                                    PAN: {appItem.pan_masked} • Bank: {appItem.bank_name} • Product: {appItem.product_name}
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#059669', fontWeight: 700, marginTop: '2px' }}>
                                    Status: {appItem.status}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Recipient Mobile - Locked Read Only */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Recipient Mobile
                    </label>
                    <div style={{
                      display: 'flex', alignItems: 'center', background: '#F1F5F9',
                      border: '1px solid #CBD5E1', borderRadius: '10px', padding: '10px 14px'
                    }}>
                      <FaLock color="#64748B" size={13} style={{ marginRight: '8px' }} />
                      <input
                        type="text"
                        readOnly
                        value={allowAlternateMobile ? (alternateMobile || mobileMasked) : (mobileMasked || mobile || 'Select an application')}
                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13.5px', fontWeight: 700, color: '#334155' }}
                      />
                      <span style={{ fontSize: '11px', background: '#E2E8F0', padding: '2px 8px', borderRadius: '6px', fontWeight: 700, color: '#475569' }}>
                        🔒 Auto-filled
                      </span>
                    </div>

                    <div style={{ marginTop: '6px' }}>
                      <label style={{ fontSize: '11.5px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={allowAlternateMobile}
                          onChange={(e) => setAllowAlternateMobile(e.target.checked)}
                          style={{ accentColor: '#059669' }}
                        />
                        Send to alternate mobile (requires custom audit entry)
                      </label>
                      {allowAlternateMobile && (
                        <input
                          type="text"
                          placeholder="Enter alternate 10-digit mobile number"
                          value={alternateMobile}
                          onChange={(e) => setAlternateMobile(e.target.value)}
                          style={{ width: '100%', marginTop: '6px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #FCA5A5', background: '#FEF2F2', fontSize: '13px' }}
                        />
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* ──────────────── STAFF WORKFLOW ──────────────── */}
              {recipientCategory === 'STAFF' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Select Staff Field */}
                  <div style={{ position: 'relative' }}>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                      Select Staff
                    </label>

                    {selectedStaff ? (
                      /* Selected Staff Authoritative Card */
                      <div style={{
                        background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
                        border: '1px solid #6EE7B7',
                        borderRadius: '12px',
                        padding: '14px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: '#065F46', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FaUserTie color="#059669" size={14} /> {selectedStaff.staff.name}
                          </div>
                          <div style={{ fontSize: '12.5px', color: '#047857', fontWeight: 700 }}>
                            Staff Code: <strong>{selectedStaff.staff.staff_code}</strong> • Designation: {selectedStaff.staff.designation}
                          </div>
                          <div style={{ fontSize: '12px', color: '#065F46' }}>
                            Mobile: {selectedStaff.staff.mobile_masked} • Branch: {selectedStaff.staff.branch}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={clearSelectedStaff}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            background: '#FFFFFF',
                            border: '1px solid #6EE7B7',
                            color: '#047857',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      /* Autocomplete Staff Search Field */
                      <div style={{ position: 'relative' }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', background: '#F8FAFC',
                          border: '1px solid #CBD5E1', borderRadius: '10px', padding: '10px 14px'
                        }}>
                          <FaSearch color="#64748B" size={13} style={{ marginRight: '8px' }} />
                          <input
                            type="text"
                            value={staffSearchQuery}
                            onFocus={() => setShowStaffDropdown(true)}
                            onChange={(e) => handleStaffSearchInputChange(e.target.value)}
                            placeholder="Search staff name or staff code (e.g. SHARAD, YOH-TC0042)..."
                            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13.5px', fontWeight: 600, color: '#0F172A' }}
                          />
                          {loadingStaff && <FaSync className="fa-spin" color="#059669" size={13} />}
                        </div>

                        {/* Staff Dropdown Matches */}
                        {showStaffDropdown && (
                          <div style={{
                            position: 'absolute',
                            top: '105%',
                            left: 0, right: 0,
                            background: '#FFFFFF',
                            border: '1px solid #CBD5E1',
                            borderRadius: '12px',
                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                            maxHeight: '260px',
                            overflowY: 'auto',
                            zIndex: 20,
                            padding: '6px'
                          }}>
                            {loadingStaff ? (
                              <div style={{ padding: '12px', fontSize: '12.5px', color: '#64748B', textAlign: 'center' }}>
                                Searching staff database...
                              </div>
                            ) : staffList.length === 0 ? (
                              <div style={{ padding: '12px', fontSize: '12.5px', color: '#64748B', textAlign: 'center' }}>
                                No matching staff found
                              </div>
                            ) : (
                              staffList.map(stf => (
                                <div
                                  key={stf.id}
                                  onClick={() => handleSelectStaffItem(stf)}
                                  style={{
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid #F1F5F9',
                                    background: '#FFFFFF'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = '#ECFDF5'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = '#FFFFFF'}
                                >
                                  <div style={{ fontWeight: 800, fontSize: '13.5px', color: '#0F172A' }}>
                                    {stf.full_name}
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#047857', fontWeight: 700 }}>
                                    Staff Code: {stf.staff_code} • {stf.designation}
                                  </div>
                                  <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                                    Mobile: {stf.mobile_masked} • Branch: {stf.branch}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Share Type Options */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                      Share Type
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {[
                        { id: 'GENERAL', label: 'General Message' },
                        { id: 'PRODUCT', label: 'Product Information' },
                        { id: 'APPLICATION', label: 'Application Information' },
                        { id: 'DOCUMENT', label: 'Report / Document' }
                      ].map(typeItem => (
                        <label
                          key={typeItem.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 12px',
                            borderRadius: '10px',
                            background: staffShareType === typeItem.id ? '#ECFDF5' : '#F8FAFC',
                            border: `1px solid ${staffShareType === typeItem.id ? '#6EE7B7' : '#E2E8F0'}`,
                            cursor: 'pointer',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            color: staffShareType === typeItem.id ? '#065F46' : '#475569'
                          }}
                        >
                          <input
                            type="radio"
                            name="staffShareType"
                            value={typeItem.id}
                            checked={staffShareType === typeItem.id}
                            onChange={() => setStaffShareType(typeItem.id)}
                            style={{ accentColor: '#059669' }}
                          />
                          {typeItem.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Product Information Sub-Workflow */}
                  {staffShareType === 'PRODUCT' && (
                    <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '12px', padding: '14px' }}>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                        Select Product
                      </label>
                      <select
                        value={selectedProductContext?.id || ''}
                        onChange={(e) => fetchProductContext(e.target.value)}
                        style={{
                          width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1',
                          background: '#FFFFFF', fontSize: '13px', fontWeight: 600
                        }}
                      >
                        <option value="">-- Select Product --</option>
                        {productsList.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.product_name} ({p.bank_name || 'Bank'})
                          </option>
                        ))}
                      </select>

                      {selectedProductContext && (
                        <div style={{ marginTop: '12px', background: '#FFFFFF', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px', color: '#1E293B', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ fontWeight: 800, fontSize: '13px', color: '#0F172A' }}>
                            Product Information Master
                          </div>
                          <div><strong>Interest Rate:</strong> {selectedProductContext.interest_rate}</div>
                          <div><strong>Processing Fee:</strong> {selectedProductContext.processing_fee}</div>
                          <div><strong>Joining / Annual Fee:</strong> {selectedProductContext.joining_fee}</div>
                          <div><strong>Loan / Card Limit:</strong> {selectedProductContext.loan_amount}</div>
                          <div><strong>Tenure:</strong> {selectedProductContext.tenure}</div>
                          <div><strong>Eligibility:</strong> {selectedProductContext.eligibility}</div>
                          <div><strong>Required Documents:</strong> {selectedProductContext.documents_required}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Application Information Sub-Workflow */}
                  {staffShareType === 'APPLICATION' && (
                    <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '12px', padding: '14px' }}>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                        Select Application to Share with Staff
                      </label>
                      <input
                        type="text"
                        placeholder="Search Application #, Customer Name..."
                        value={appSearchQuery}
                        onChange={(e) => handleAppSearchInputChange(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                      />
                      {selectedApp && (
                        <div style={{ marginTop: '8px', background: '#FFFFFF', padding: '10px', borderRadius: '8px', fontSize: '12px', color: '#15803D', fontWeight: 700 }}>
                          Selected Application: {selectedApp.application.application_number} • Customer: {selectedApp.customer.name} • Status: {selectedApp.application.status}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}

              {/* Template Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Select Approved Template *
                </label>
                {loadingTemplates ? (
                  <div style={{ fontSize: '13px', color: '#64748B', padding: '10px' }}>Loading templates...</div>
                ) : (
                  <select
                    value={selectedTemplate?.template_name || ''}
                    onChange={(e) => {
                      const found = templates.find(t => t.template_name === e.target.value);
                      if (found) handleSelectTemplate(found);
                    }}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      background: '#FFFFFF',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      color: '#0F172A',
                      outline: 'none'
                    }}
                  >
                    {templates.map(tpl => (
                      <option key={tpl.id} value={tpl.template_name}>
                        [{tpl.template_category.toUpperCase()}] {tpl.template_name.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Template Variables (Auto Populated from DB) */}
              {selectedTemplate && selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                <div style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '14px 16px'
                }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#1E293B', marginBottom: '10px' }}>
                    Template Variables (Auto-Populated from DB Source of Truth)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {selectedTemplate.variables.map(varKey => (
                      <div key={varKey}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'capitalize', marginBottom: '4px' }}>
                          {varKey.replace(/_/g, ' ')}
                        </label>
                        <input
                          type="text"
                          value={variables[varKey] || ''}
                          onChange={(e) => handleVariableChange(varKey, e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #CBD5E1',
                            fontSize: '13px',
                            outline: 'none',
                            background: '#FFFFFF',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Document / Report Sharing Section */}
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '14px 16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 800, color: '#1E293B' }}>
                    <FaPaperclip color="#059669" size={13} /> Attach Report / Document
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAttachDoc(!showAttachDoc)}
                    style={{
                      background: showAttachDoc ? '#E0E7FF' : '#F1F5F9',
                      color: showAttachDoc ? '#3730A3' : '#475569',
                      border: 'none',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {showAttachDoc ? 'Hide Document Fields' : '+ Attach Report / Doc'}
                  </button>
                </div>

                {showAttachDoc && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                        Document Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. PAN_Verification_Report.pdf"
                        value={docName}
                        onChange={(e) => setDocName(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                        Document URL
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0 8px' }}>
                        <FaLink color="#94A3B8" size={11} style={{ marginRight: '6px' }} />
                        <input
                          type="text"
                          placeholder="https://gharkapaisa.in/reports/doc.pdf"
                          value={docUrl}
                          onChange={(e) => setDocUrl(e.target.value)}
                          style={{ width: '100%', padding: '8px 0', border: 'none', outline: 'none', fontSize: '12.5px' }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Message Live Preview */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  <FaEye color="#059669" size={13} /> Live WhatsApp Message Preview
                </label>
                <div style={{
                  background: '#ECE5DD',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid #D1D5DB'
                }}>
                  <div style={{
                    background: '#FFFFFF',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    maxWidth: '85%',
                    position: 'relative'
                  }}>
                    <p style={{ margin: '0 0 6px', fontSize: '13.5px', color: '#111827', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                      {renderPreviewText()}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '10.5px', color: '#9CA3AF' }}>
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • GharKaPaisa ✓✓
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={sending}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    background: '#F1F5F9',
                    border: '1px solid #E2E8F0',
                    color: '#475569',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={sending}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '10px',
                    background: sending ? '#9CA3AF' : '#059669',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '13.5px',
                    border: 'none',
                    cursor: sending ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {sending ? (
                    <>
                      <FaSync className="fa-spin" /> Sending...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane /> Send WhatsApp
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
