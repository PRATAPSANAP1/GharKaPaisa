import React, { useState, useEffect } from 'react';
import { 
  FaWhatsapp, FaTimes, FaPaperPlane, FaFileAlt, FaCheckCircle, 
  FaExclamationTriangle, FaEye, FaUser, FaPhone, FaShieldAlt, FaSearch, FaSync, FaLink, FaPaperclip
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
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [variables, setVariables] = useState({});
  const [mobile, setMobile] = useState(recipientMobile);
  const [name, setName] = useState(recipientName);
  const [currentAppId, setCurrentAppId] = useState(applicationId);
  const [currentLeadId, setCurrentLeadId] = useState(leadId);
  const [currentCustomerId, setCurrentCustomerId] = useState(customerId);
  const [sending, setSending] = useState(false);
  const [successResult, setSuccessResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Document & Report Attachment State
  const [docName, setDocName] = useState(documentName || '');
  const [docUrl, setDocUrl] = useState(documentUrl || '');
  const [docType, setDocType] = useState(documentType || 'PDF');
  const [showAttachDoc, setShowAttachDoc] = useState(Boolean(documentName || documentUrl));

  // Application Search & Auto-Populate State
  const [appSearchQuery, setAppSearchQuery] = useState('');
  const [applicationsList, setApplicationsList] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [showAppDropdown, setShowAppDropdown] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMobile(recipientMobile || '');
      setName(recipientName || '');
      setCurrentAppId(applicationId);
      setCurrentLeadId(leadId);
      setCurrentCustomerId(customerId);
      setDocName(documentName || '');
      setDocUrl(documentUrl || '');
      setDocType(documentType || 'PDF');
      setShowAttachDoc(Boolean(documentName || documentUrl));
      setSelectedApp(null);
      setAppSearchQuery('');
      setSuccessResult(null);
      setErrorMsg(null);
      fetchTemplates();
      fetchInitialApplications();
    }
  }, [isOpen, recipientMobile, recipientName, applicationId, leadId, customerId, documentName, documentUrl, documentType]);

  // Fetch initial top 10 applications for instant dropdown access
  const fetchInitialApplications = async () => {
    setLoadingApps(true);
    try {
      const res = await api.get('/crm/applications', { params: { limit: 10 } });
      const apps = res.data?.data?.applications || res.data?.data || [];
      if (Array.isArray(apps)) setApplicationsList(apps);
    } catch (err) {
      console.warn('Initial applications fetch note:', err.message);
    } finally {
      setLoadingApps(false);
    }
  };

  // Dynamic application search on user input
  const handleAppSearch = async (queryStr) => {
    setAppSearchQuery(queryStr);
    setShowAppDropdown(true);

    if (!queryStr || queryStr.trim().length === 0) {
      fetchInitialApplications();
      return;
    }

    setLoadingApps(true);
    try {
      const res = await api.get('/crm/applications', { params: { search: queryStr.trim(), limit: 15 } });
      const apps = res.data?.data?.applications || res.data?.data || [];
      if (Array.isArray(apps)) setApplicationsList(apps);
    } catch (err) {
      console.error('Failed to search applications:', err);
    } finally {
      setLoadingApps(false);
    }
  };

  // Select Application from Dropdown and Auto-Populate details
  const handleSelectApplication = (app) => {
    setSelectedApp(app);
    setShowAppDropdown(false);

    const appNumber = app.app_number || app.application_number || app.id || '';
    const custName = app.customer_name || app.full_name || app.customer?.full_name || 'Customer';
    const custMobile = app.customer_mobile || app.mobile || app.customer?.mobile || '';
    const appStatus = app.status || app.bank_status || 'Under Review';
    const productName = app.product_name || app.bank_name || 'Financial Product';

    // Auto populate recipient name & mobile
    setName(custName);
    if (custMobile) setMobile(custMobile);

    setCurrentAppId(appNumber);
    setCurrentLeadId(app.lead_id || null);
    setCurrentCustomerId(app.customer_id || null);

    // Auto populate template variables if template is selected
    if (selectedTemplate) {
      populateTemplateVariables(selectedTemplate, {
        customer_name: custName,
        application_id: appNumber,
        status: appStatus,
        product_name: productName,
        remarks: app.remarks || app.notes || ''
      });
    }
  };

  const clearSelectedApp = () => {
    setSelectedApp(null);
    setAppSearchQuery('');
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
      setErrorMsg('Failed to load templates. Please try again.');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const populateTemplateVariables = (tpl, overrides = {}) => {
    const initialVars = {};
    const tplVars = Array.isArray(tpl.variables) ? tpl.variables : [];

    const custName = overrides.customer_name || name || recipientName || 'Customer';
    const appNum = overrides.application_id || currentAppId || applicationId || 'N/A';
    const statusVal = overrides.status || 'Under Review';
    const prodName = overrides.product_name || 'Financial Product';
    const documentNameVal = docName || overrides.document_name || 'Attached Report / Document';

    tplVars.forEach(v => {
      if (initialVariables[v]) initialVars[v] = initialVariables[v];
      else if (v === 'customer_name') initialVars[v] = custName;
      else if (v === 'application_id') initialVars[v] = appNum;
      else if (v === 'document_name') initialVars[v] = documentNameVal;
      else if (v === 'status') initialVars[v] = statusVal;
      else if (v === 'product_name') initialVars[v] = prodName;
      else if (v === 'report_url' || v === 'document_url') initialVars[v] = docUrl || 'https://gharkapaisa.in/reports';
      else if (overrides[v]) initialVars[v] = overrides[v];
      else initialVars[v] = tpl.sample_values?.[v] || '';
    });
    setVariables(initialVars);
  };

  const handleSelectTemplate = (tpl) => {
    setSelectedTemplate(tpl);
    const overrides = {};
    if (selectedApp) {
      overrides.customer_name = selectedApp.customer_name || selectedApp.full_name || name;
      overrides.application_id = selectedApp.app_number || selectedApp.application_number || currentAppId;
      overrides.status = selectedApp.status || selectedApp.bank_status || 'Under Review';
      overrides.product_name = selectedApp.product_name || selectedApp.bank_name || 'Financial Product';
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
    if (docName || docUrl) {
      text += `\n\n📄 Attached File: ${docName || 'Report'}${docUrl ? `\n🔗 Link: ${docUrl}` : ''}`;
    }
    return text;
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!mobile.trim()) {
      setErrorMsg('Please enter a valid recipient mobile number.');
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
        recipient_mobile: mobile.trim(),
        recipient_name: name.trim() || 'Customer',
        recipient_type: 'CUSTOMER',
        variables: variables,
        document_name: docName.trim() || null,
        document_url: docUrl.trim() || null,
        document_type: docType || 'PDF',
        application_id: currentAppId || applicationId,
        lead_id: currentLeadId || leadId,
        customer_id: currentCustomerId || customerId
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
        maxWidth: '740px',
        maxHeight: '92vh',
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
                Official GharKaPaisa Business Channel • Application Auto-Fetch & Document/Report Sharing
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
          {/* Sender Identity Attribution Badge */}
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
                Sending as <strong>GharKaPaisa Official</strong> (Initiated by {user?.full_name || 'Staff'} - {user?.designation || user?.role})
              </span>
            </div>
            <span style={{ fontSize: '11px', background: '#DCFCE7', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
              Audit Logged
            </span>
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
                WhatsApp Message & Report Dispatched!
              </h4>
              <p style={{ margin: 0, fontSize: '13.5px', color: '#64748B', maxWidth: '420px' }}>
                Message <strong>{successResult.message_uuid}</strong> sent to <strong>{successResult.recipient_mobile}</strong> using template <strong>{successResult.template_name}</strong>.
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
              
              {/* Application Selector & Auto-Fetch Card */}
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                  <FaFileAlt color="#059669" size={13} /> Select Application (Auto-Fetch Customer & Status Details)
                </label>

                {selectedApp ? (
                  /* Highlighted Selected Application Summary Card */
                  <div style={{
                    background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                    border: '1px solid #BFDBFE',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#1E40AF' }}>
                          #{selectedApp.app_number || selectedApp.application_number || selectedApp.id}
                        </span>
                        <span style={{ background: '#2563EB', color: '#FFFFFF', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
                          {selectedApp.status || selectedApp.bank_status || 'Under Review'}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#1E293B', fontWeight: 700 }}>
                        Customer: {selectedApp.customer_name || selectedApp.full_name || 'N/A'} ({selectedApp.customer_mobile || selectedApp.mobile || 'N/A'})
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#475569' }}>
                        Product: <strong>{selectedApp.product_name || selectedApp.bank_name || 'Financial Product'}</strong> {selectedApp.loan_amount ? `• Amount: ₹${selectedApp.loan_amount}` : ''}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={clearSelectedApp}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: '#FFFFFF',
                        border: '1px solid #93C5FD',
                        color: '#1D4ED8',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <FaTimes size={10} /> Change
                    </button>
                  </div>
                ) : (
                  /* Interactive Search Dropdown Input */
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
                        onChange={(e) => handleAppSearch(e.target.value)}
                        placeholder="Search Application #, Customer Name, Mobile Number..."
                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13.5px', fontWeight: 600, color: '#0F172A' }}
                      />
                      {loadingApps && <FaSync color="#059669" size={13} />}
                    </div>

                    {/* Auto-Complete Dropdown Menu */}
                    {showAppDropdown && (
                      <div style={{
                        position: 'absolute',
                        top: '105%',
                        left: 0,
                        right: 0,
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                        maxHeight: '230px',
                        overflowY: 'auto',
                        zIndex: 10,
                        padding: '6px'
                      }}>
                        {loadingApps ? (
                          <div style={{ padding: '12px', fontSize: '12.5px', color: '#64748B', textAlign: 'center' }}>
                            Searching database...
                          </div>
                        ) : applicationsList.length === 0 ? (
                          <div style={{ padding: '12px', fontSize: '12.5px', color: '#64748B', textAlign: 'center' }}>
                            No application records found matching "{appSearchQuery}"
                          </div>
                        ) : (
                          applicationsList.map(app => (
                            <div
                              key={app.id}
                              onClick={() => handleSelectApplication(app)}
                              style={{
                                padding: '10px 12px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderBottom: '1px solid #F1F5F9',
                                transition: 'background 0.15s ease'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#F0FDF4'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <div>
                                <div style={{ fontWeight: 800, fontSize: '13px', color: '#0F172A' }}>
                                  #{app.app_number || app.application_number || app.id} — {app.customer_name || app.full_name || 'Customer'}
                                </div>
                                <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                                  Mobile: {app.customer_mobile || app.mobile || 'N/A'} • Product: {app.product_name || app.bank_name || 'Product'}
                                </div>
                              </div>
                              <span style={{
                                background: '#E0E7FF',
                                color: '#3730A3',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 800
                              }}>
                                {app.status || 'Active'}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Recipient Details Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Recipient Customer / Staff Name *
                  </label>
                  <div style={{
                    display: 'flex', alignItems: 'center', background: '#F8FAFC',
                    border: '1px solid #E2E8F0', borderRadius: '10px', padding: '10px 14px'
                  }}>
                    <FaUser color="#94A3B8" size={13} style={{ marginRight: '8px' }} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        handleVariableChange('customer_name', e.target.value);
                      }}
                      placeholder="Customer Name"
                      required
                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13.5px', fontWeight: 600, color: '#0F172A' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Recipient Mobile Number *
                  </label>
                  <div style={{
                    display: 'flex', alignItems: 'center', background: '#F8FAFC',
                    border: '1px solid #E2E8F0', borderRadius: '10px', padding: '10px 14px'
                  }}>
                    <FaPhone color="#94A3B8" size={13} style={{ marginRight: '8px' }} />
                    <input
                      type="text"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="e.g. 9876543210"
                      required
                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13.5px', fontWeight: 600, color: '#0F172A' }}
                    />
                  </div>
                </div>
              </div>

              {/* Document / Report Sharing Section Toggle */}
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '14px 16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 800, color: '#1E293B', cursor: 'pointer' }}>
                    <FaPaperclip color="#059669" size={13} /> Share Report or Document Attachment via WhatsApp
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
                        Report / Document Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Delivery_Analytics_Report.pdf"
                        value={docName}
                        onChange={(e) => {
                          setDocName(e.target.value);
                          handleVariableChange('document_name', e.target.value);
                        }}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                        Report / Document Download URL
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0 8px' }}>
                        <FaLink color="#94A3B8" size={11} style={{ marginRight: '6px' }} />
                        <input
                          type="text"
                          placeholder="https://gharkapaisa.in/reports/report-123.pdf"
                          value={docUrl}
                          onChange={(e) => setDocUrl(e.target.value)}
                          style={{ width: '100%', padding: '8px 0', border: 'none', outline: 'none', fontSize: '12.5px' }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Template Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Select Approved Template *
                </label>
                {loadingTemplates ? (
                  <div style={{ fontSize: '13px', color: '#64748B', padding: '10px' }}>Loading approved templates...</div>
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

              {/* Dynamic Variables Inputs */}
              {selectedTemplate && selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                <div style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '14px 16px'
                }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#1E293B', marginBottom: '10px' }}>
                    Template Variables (Auto-Populated from Application / Report)
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
                    background: '#059669',
                    border: 'none',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)'
                  }}
                >
                  <FaPaperPlane size={12} /> {sending ? 'Sending WhatsApp...' : 'Send WhatsApp'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
