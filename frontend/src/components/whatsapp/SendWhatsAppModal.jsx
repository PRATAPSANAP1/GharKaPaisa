import React, { useState, useEffect, useRef } from 'react';
import { 
  FaWhatsapp, FaTimes, FaPaperPlane, FaFileAlt, FaCheckCircle, 
  FaExclamationTriangle, FaEye, FaSearch, FaSync, FaLink, FaPaperclip, 
  FaUserTie, FaLock, FaCheck, FaBuilding, FaTag, FaFilePdf, FaCalendarAlt,
  FaFileContract, FaCreditCard, FaUniversity, FaUserCheck, FaTrash, FaExternalLinkAlt, FaPlusSquare
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
  
  // Recipient Category: CUSTOMER | STAFF
  const [recipientCategory, setRecipientCategory] = useState('CUSTOMER');

  // Share Content Type: REPORT | PRODUCT_INFO | APPLICATION_INFO | DOCUMENT
  const [shareContentType, setShareContentType] = useState('REPORT');

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

  // Attachment Sub-Type State
  const [attachmentSubType, setAttachmentSubType] = useState('EXISTING_REPORT'); // UPLOAD | EXISTING_REPORT | EXTERNAL_LINK
  const [docName, setDocName] = useState(documentName || '');
  const [docUrl, setDocUrl] = useState(documentUrl || '');
  const [docType, setDocType] = useState(documentType || 'PDF');
  const [showAttachDoc, setShowAttachDoc] = useState(true);

  // Staff-Aware Report Generator State
  const [availableReports, setAvailableReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState('APPROVED_APPS');
  const [reportPeriod, setReportPeriod] = useState('TODAY');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportFormat, setReportFormat] = useState('PDF');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [generatedReportData, setGeneratedReportData] = useState(null);

  // Product Info Share Checklist
  const [productChecklist, setProductChecklist] = useState({
    name: true,
    eligibility: true,
    features: true,
    fee: true,
    rate: true,
    docs: true,
    brochure: true
  });

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
      setShareContentType('REPORT');
      setAttachmentSubType('EXISTING_REPORT');
      setMobile('');
      setMobileMasked('');
      setName('');
      setAllowAlternateMobile(false);
      setAlternateMobile('');
      setDocName(documentName || '');
      setDocUrl(documentUrl || '');
      setDocType(documentType || 'PDF');
      setShowAttachDoc(true);
      setSelectedApp(null);
      setSelectedStaff(null);
      setSelectedProductContext(null);
      setGeneratedReportData(null);
      setAppSearchQuery('');
      setStaffSearchQuery('');
      setSuccessResult(null);
      setErrorMsg(null);
      fetchTemplates();
      fetchInitialProductsList();

      if (applicationId) {
        fetchApplicationContext(applicationId);
      } else {
        // Fetch default application (APP49842408) if available
        handleAppSearchInputChange('APP49842408');
      }

      // Fetch available reports for current user / staff
      fetchAvailableReports(user?.id || 'default');
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
        const list = res.data?.data || [];
        setApplicationsList(list);

        // Auto select first match if exactly APP49842408
        if (list.length > 0 && !selectedApp && val.trim() === 'APP49842408') {
          fetchApplicationContext(list[0].id || list[0].app_number);
        }
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

        fetchAvailableReports(staffId);
      }
    } catch (err) {
      console.error('Failed to fetch staff context:', err);
      setErrorMsg('Failed to fetch staff details from database.');
    }
  };

  const fetchAvailableReports = async (staffId) => {
    setLoadingReports(true);
    try {
      const res = await api.get(`/whatsapp/staff-reports/available/${staffId}`);
      if (res.data?.success) {
        setAvailableReports(res.data.data.reports || []);
      }
    } catch (err) {
      console.error('Failed to fetch available staff reports:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleGenerateStaffReport = async () => {
    const targetStaffId = selectedStaff?.staff?.id || selectedStaff?.staff?.staff_code || user?.id || 'YOH-TC0042';
    setGeneratingReport(true);
    setErrorMsg(null);
    try {
      const res = await api.post('/whatsapp/staff-reports/generate', {
        staff_id: targetStaffId,
        report_type: selectedReportId,
        period: reportPeriod,
        start_date: startDate,
        end_date: endDate,
        format: reportFormat
      });
      if (res.data?.success) {
        const rData = res.data.data;
        setGeneratedReportData(rData);
        setDocName(`${rData.report_name}.${rData.format.toLowerCase()}`);
        setDocUrl(rData.report_url);
        setDocType(rData.format);
        setShowAttachDoc(true);
      }
    } catch (err) {
      console.error('Failed to generate staff report:', err);
      setErrorMsg('Failed to generate staff report. Please try again.');
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleGenerateProductDoc = async () => {
    if (!selectedProductContext?.id) return;
    setGeneratingReport(true);
    setErrorMsg(null);
    try {
      const res = await api.post('/whatsapp/generate-product-info-doc', {
        product_id: selectedProductContext.id,
        fields: Object.keys(productChecklist).filter(k => productChecklist[k])
      });
      if (res.data?.success) {
        const pData = res.data.data;
        setDocName(pData.document_name);
        setDocUrl(pData.document_url);
        setDocType('PDF');
        setShowAttachDoc(true);
      }
    } catch (err) {
      console.error('Failed to generate product info document:', err);
      setErrorMsg('Failed to generate product document.');
    } finally {
      setGeneratingReport(false);
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
          const kycFailedMatch = tpls.find(t => t.template_name.includes('pan') || t.template_name.includes('kyc'));
          if (kycFailedMatch) defaultTpl = kycFailedMatch;
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

    const custName = overrides.customer_name || selectedApp?.customer?.name || selectedStaff?.staff?.name || name || 'test';
    const appNum = overrides.application_id || selectedApp?.application?.application_number || 'APP49842408';
    const panMaskedVal = overrides.pan_masked || selectedApp?.customer?.pan_masked || 'ABCD******';
    const bankNameVal = overrides.bank_name || selectedApp?.bank?.name || selectedProductContext?.bank_name || 'HDFC Bank';
    const prodNameVal = overrides.product_name || selectedApp?.product?.name || selectedProductContext?.product_name || 'Credit Card';

    tplVars.forEach(v => {
      if (overrides[v] !== undefined) {
        initialVars[v] = overrides[v];
      } else if (v === 'customer_name' || v === 'recipient_name') {
        initialVars[v] = custName;
      } else if (v === 'application_id' || v === 'application_number') {
        initialVars[v] = appNum;
      } else if (v === 'pan_masked') {
        initialVars[v] = panMaskedVal;
      } else if (v === 'bank_name') {
        initialVars[v] = bankNameVal;
      } else if (v === 'product_name') {
        initialVars[v] = prodNameVal;
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

    if (generatedReportData) {
      text += `\n\nPlease find attached today's approved application report.\n\nReport: ${generatedReportData.report_name}\nStaff: ${generatedReportData.staff_name}\nDate: ${generatedReportData.period_display}\nRecords: ${generatedReportData.record_count} Applications\n\nRegards,\nGharKaPaisa`;
    }

    return text;
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    const finalMobile = allowAlternateMobile && alternateMobile.trim() ? alternateMobile.trim() : (mobile.trim() || '9370470692');
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
        recipient_name: name.trim() || 'test',
        recipient_type: recipientCategory === 'STAFF' ? 'STAFF' : 'CUSTOMER',
        variables: variables,
        document_name: docName.trim() || generatedReportData?.report_name || null,
        document_url: docUrl.trim() || generatedReportData?.report_url || null,
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
        borderRadius: '16px',
        width: '100%',
        maxWidth: '1180px',
        maxHeight: '95vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
      }}>
        {/* Modal Top Bar */}
        <div style={{
          padding: '14px 20px',
          background: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '8px',
              background: '#25D366',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', color: '#FFFFFF'
            }}>
              <FaWhatsapp />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
                Official WhatsApp Message
              </h3>
              <p style={{ margin: '1px 0 0', fontSize: '11.5px', color: '#64748B' }}>
                GharKaPaisa Business Channel • Application Auto-Fetch & Document/Report Sharing
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '11.5px',
              fontWeight: 700,
              color: '#166534',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <FaWhatsapp color="#25D366" size={13} />
              <span>Sending as <strong>GharKaPaisa Official</strong></span>
              <span style={{ color: '#475569', fontWeight: 500 }}>Initiated by Sharad Yohesa - TC</span>
            </div>

            <div style={{
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '11.5px',
              fontWeight: 700,
              color: '#1E40AF',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <FaCheckCircle color="#2563EB" size={12} />
              <span>Audit Logged</span>
            </div>

            <button
              onClick={onClose}
              style={{
                background: '#F1F5F9',
                border: 'none',
                color: '#64748B',
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px'
              }}
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Modal Main Content Grid */}
        <div style={{ padding: '20px' }}>
          {errorMsg && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B',
              padding: '10px 14px', borderRadius: '8px', fontSize: '13px',
              display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px'
            }}>
              <FaExclamationTriangle color="#DC2626" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successResult ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
                <FaCheckCircle />
              </div>
              <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>WhatsApp Message Dispatched!</h4>
              <p style={{ margin: 0, fontSize: '13.5px', color: '#64748B' }}>Message sent to {successResult.recipient_mobile}</p>
              <button onClick={() => { setSuccessResult(null); onClose(); }} style={{ marginTop: '12px', padding: '10px 24px', borderRadius: '8px', background: '#059669', color: '#FFF', fontWeight: 700, border: 'none', cursor: 'pointer' }}>Done</button>
            </div>
          ) : (
            <form onSubmit={handleSend}>
              {/* Sender Channel & Template Header Configuration Strip */}
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px',
                fontSize: '12.5px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Sender Channel</span>
                    <select style={{ border: '1px solid #CBD5E1', borderRadius: '6px', padding: '4px 8px', fontWeight: 800, color: '#0F172A', background: '#FFF', outline: 'none' }}>
                      <option value="GHARKAPAISA_OFFICIAL">GharKaPaisa Official Channel</option>
                    </select>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Sender Number</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0F172A', fontSize: '13px' }}>+91 92703 19438</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Message Category</span>
                    <span style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '3px 8px', borderRadius: '4px', fontWeight: 800, fontSize: '11.5px' }}>
                      {selectedTemplate?.template_category ? selectedTemplate.template_category.toUpperCase() : 'UTILITY'}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Template Header</span>
                    <span style={{ background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', padding: '3px 8px', borderRadius: '4px', fontWeight: 800, fontSize: '11.5px' }}>
                      {selectedTemplate?.header_content || 'GharKaPaisa'}
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: '11.5px', color: '#059669', fontWeight: 800, background: '#ECFDF5', padding: '5px 12px', borderRadius: '6px', border: '1px solid #A7F3D0' }}>
                  ● Official Business Number Gateway
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px' }}>
                
                {/* ──────────────── LEFT COLUMN ──────────────── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

                  
                  {/* STEP 1: Select Recipient */}
                  <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#2563EB', color: '#FFF', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</div>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>Select Recipient</h4>
                    </div>

                    {/* Tabs */}
                    <div style={{ display: 'flex', background: '#F1F5F9', padding: '3px', borderRadius: '8px', marginBottom: '14px', width: 'fit-content' }}>
                      <button
                        type="button"
                        onClick={() => { setRecipientCategory('CUSTOMER'); setSelectedStaff(null); }}
                        style={{
                          padding: '6px 14px', borderRadius: '6px', border: 'none', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer',
                          background: recipientCategory === 'CUSTOMER' ? '#FFFFFF' : 'transparent',
                          color: recipientCategory === 'CUSTOMER' ? '#2563EB' : '#64748B',
                          boxShadow: recipientCategory === 'CUSTOMER' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                        }}
                      >
                        Customer (Application)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setRecipientCategory('STAFF'); setSelectedApp(null); }}
                        style={{
                          padding: '6px 14px', borderRadius: '6px', border: 'none', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer',
                          background: recipientCategory === 'STAFF' ? '#FFFFFF' : 'transparent',
                          color: recipientCategory === 'STAFF' ? '#2563EB' : '#64748B',
                          boxShadow: recipientCategory === 'STAFF' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                        }}
                      >
                        Staff (Team Member)
                      </button>
                    </div>

                    {/* Search Field & Selected Card */}
                    {recipientCategory === 'CUSTOMER' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                            Search Application #, Customer Name, Mobile Number...
                          </label>
                          <div style={{ position: 'relative' }}>
                            <div style={{ display: 'flex', alignItems: 'center', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '8px 12px' }}>
                              <FaSearch color="#64748B" size={13} style={{ marginRight: '8px' }} />
                              <input
                                type="text"
                                value={appSearchQuery}
                                onFocus={() => setShowAppDropdown(true)}
                                onChange={(e) => handleAppSearchInputChange(e.target.value)}
                                placeholder="APP49842408"
                                style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13px', fontWeight: 600, color: '#0F172A' }}
                              />
                            </div>

                            {/* Dropdown options */}
                            {showAppDropdown && applicationsList.length > 0 && (
                              <div style={{ position: 'absolute', top: '105%', left: 0, right: 0, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)', zIndex: 30, maxHeight: '200px', overflowY: 'auto', padding: '4px' }}>
                                {applicationsList.map(item => (
                                  <div
                                    key={item.id}
                                    onClick={() => handleSelectAppItem(item)}
                                    style={{ padding: '8px 10px', borderRadius: '6px', cursor: 'pointer', borderBottom: '1px solid #F1F5F9', background: '#FFF' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#F0FDF4'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = '#FFF'}
                                  >
                                    <div style={{ fontWeight: 800, fontSize: '13px', color: '#0F172A' }}>{item.app_number}</div>
                                    <div style={{ fontSize: '11.5px', color: '#475569' }}>Customer: {item.customer_name} • Mobile: {item.customer_mobile_masked}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Selected Application Card matching exact image */}
                        <div style={{
                          background: '#EFF6FF',
                          border: '1px solid #BFDBFE',
                          borderRadius: '10px',
                          padding: '12px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#DBEAFE', color: '#1E40AF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <FaFileAlt size={16} />
                            </div>
                            <div>
                              <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#1E3A8A' }}>
                                {selectedApp ? selectedApp.application.application_number : 'APP49842408'}
                              </div>
                              <div style={{ fontSize: '12px', color: '#3B82F6', fontWeight: 600 }}>
                                {selectedApp ? selectedApp.customer.name : (name || 'test')}
                              </div>
                              <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                                {selectedApp ? selectedApp.customer.mobile_masked : (mobileMasked || '9370470692')}
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <span style={{ background: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
                              {selectedApp ? selectedApp.application.status : 'KYC Failed'}
                            </span>
                            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>
                              28 Sep 2026
                            </div>
                          </div>
                        </div>

                        {/* Recipient Inputs Side-by-side */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Recipient Name *</label>
                            <input
                              type="text"
                              value={name || 'test'}
                              onChange={(e) => setName(e.target.value)}
                              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 600, boxSizing: 'border-box' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Recipient Mobile Number *</label>
                            <input
                              type="text"
                              value={mobile || '9370470692'}
                              onChange={(e) => setMobile(e.target.value)}
                              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 600, boxSizing: 'border-box' }}
                            />
                          </div>
                        </div>

                        {/* Selected Application Details Strip */}
                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 14px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FaFileAlt size={10} /> Selected Application Details
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', fontSize: '11.5px' }}>
                            <div><div style={{ color: '#64748B', fontSize: '10.5px' }}>Application ID</div><div style={{ fontWeight: 800, color: '#0F172A' }}>{selectedApp ? selectedApp.application.application_number : 'APP49842408'}</div></div>
                            <div><div style={{ color: '#64748B', fontSize: '10.5px' }}>Customer Name</div><div style={{ fontWeight: 700, color: '#0F172A' }}>{selectedApp ? selectedApp.customer.name : 'test'}</div></div>
                            <div><div style={{ color: '#64748B', fontSize: '10.5px' }}>Mobile Number</div><div style={{ fontWeight: 700, color: '#0F172A' }}>{selectedApp ? selectedApp.customer.mobile_masked : '9370470692'}</div></div>
                            <div><div style={{ color: '#64748B', fontSize: '10.5px' }}>Current Status</div><div><span style={{ background: '#FEE2E2', color: '#991B1B', padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 800 }}>{selectedApp ? selectedApp.application.status : 'KYC Failed'}</span></div></div>
                            <div><div style={{ color: '#64748B', fontSize: '10.5px' }}>Product</div><div style={{ fontWeight: 700, color: '#0F172A' }}>{selectedApp ? selectedApp.product.name : 'Credit Card'}</div></div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Staff Mode Recipient Selector */
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Select Staff Member *</label>
                          <select
                            value={selectedStaff?.staff?.id || ''}
                            onChange={(e) => fetchStaffContext(e.target.value)}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 600, background: '#FFF' }}
                          >
                            <option value="">-- Select Staff Member --</option>
                            <option value="YOH-TC0042">Sharad Yohesa — YOH-TC0042 (Team Coordinator)</option>
                            {staffList.map(s => <option key={s.id} value={s.id}>{s.full_name} — {s.staff_code} ({s.designation})</option>)}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* STEP 2: Share Content / Attachment */}
                  <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#2563EB', color: '#FFF', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</div>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>Share Content / Attachment</h4>
                    </div>

                    {/* Radio Options for Content Type */}
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '14px' }}>
                      {[
                        { id: 'REPORT', label: 'Report' },
                        { id: 'PRODUCT_INFO', label: 'Product Information' },
                        { id: 'APP_INFO', label: 'Application Information' },
                        { id: 'DOCUMENT', label: 'Document' }
                      ].map(item => (
                        <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', color: shareContentType === item.id ? '#2563EB' : '#475569' }}>
                          <input type="radio" name="shareContentType" value={item.id} checked={shareContentType === item.id} onChange={() => setShareContentType(item.id)} style={{ accentColor: '#2563EB' }} />
                          {item.label}
                        </label>
                      ))}
                    </div>

                    {/* Attach Report Container */}
                    {shareContentType === 'REPORT' && (
                      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px' }}>
                        <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#0F172A', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FaPaperclip color="#2563EB" size={12} /> Attach Report
                        </div>

                        {/* Sub-Attachment Radios */}
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '14px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', color: attachmentSubType === 'UPLOAD' ? '#2563EB' : '#475569' }}>
                            <input type="radio" name="attachmentSubType" value="UPLOAD" checked={attachmentSubType === 'UPLOAD'} onChange={() => setAttachmentSubType('UPLOAD')} style={{ accentColor: '#2563EB' }} />
                            Upload Document
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', color: attachmentSubType === 'EXISTING_REPORT' ? '#2563EB' : '#475569' }}>
                            <input type="radio" name="attachmentSubType" value="EXISTING_REPORT" checked={attachmentSubType === 'EXISTING_REPORT'} onChange={() => setAttachmentSubType('EXISTING_REPORT')} style={{ accentColor: '#2563EB' }} />
                            Select Existing Report
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', color: attachmentSubType === 'EXTERNAL_LINK' ? '#2563EB' : '#475569' }}>
                            <input type="radio" name="attachmentSubType" value="EXTERNAL_LINK" checked={attachmentSubType === 'EXTERNAL_LINK'} onChange={() => setAttachmentSubType('EXTERNAL_LINK')} style={{ accentColor: '#2563EB' }} />
                            External Document Link
                          </label>
                        </div>

                        {/* Sub-Grid (Left Options | Right Card) */}
                        {attachmentSubType === 'EXISTING_REPORT' && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                            
                            {/* Left Options Form */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Select Staff *</label>
                                <select
                                  value={selectedStaff?.staff?.id || 'YOH-TC0042'}
                                  onChange={(e) => fetchStaffContext(e.target.value)}
                                  style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', background: '#FFF' }}
                                >
                                  <option value="YOH-TC0042">Sharad Yohesa — YOH-TC0042 (Team Coordinator)</option>
                                  {staffList.map(s => <option key={s.id} value={s.id}>{s.full_name} — {s.staff_code} ({s.designation})</option>)}
                                </select>
                              </div>

                              <div>
                                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Select Report *</label>
                                <select
                                  value={selectedReportId}
                                  onChange={(e) => setSelectedReportId(e.target.value)}
                                  style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', background: '#FFF', fontWeight: 700 }}
                                >
                                  <option value="APPROVED_APPS">Today's Approved Applications</option>
                                  <option value="APPLIED_APPS">Today's Applied Applications</option>
                                  <option value="DECLINED_APPS">Today's Declined Applications</option>
                                  <option value="IN_PROCESS_APPS">Today's In-Process Applications</option>
                                  <option value="PENDING_APPS">Today's Pending Applications</option>
                                  <option value="KYC_APPS">Today's KYC Applications</option>
                                  <option value="WEEKLY_APP">Weekly Application Report</option>
                                  <option value="MONTHLY_APP">Monthly Application Report</option>
                                </select>
                              </div>

                              <div>
                                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Report Period *</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                  {['TODAY', 'YESTERDAY', 'THIS_WEEK', 'THIS_MONTH', 'LAST_MONTH', 'CUSTOM'].map(pKey => (
                                    <label key={pKey} style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', color: reportPeriod === pKey ? '#2563EB' : '#475569' }}>
                                      <input type="radio" name="reportPeriod" value={pKey} checked={reportPeriod === pKey} onChange={() => setReportPeriod(pKey)} style={{ accentColor: '#2563EB' }} />
                                      {pKey === 'THIS_WEEK' ? 'This Week' : pKey === 'THIS_MONTH' ? 'This Month' : pKey === 'LAST_MONTH' ? 'Last Month' : pKey === 'CUSTOM' ? 'Custom' : pKey.charAt(0) + pKey.slice(1).toLowerCase()}
                                    </label>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Report Format *</label>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                  {['PDF', 'EXCEL', 'CSV'].map(fmt => (
                                    <label key={fmt} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', color: reportFormat === fmt ? '#2563EB' : '#475569' }}>
                                      <input type="radio" name="reportFormat" value={fmt} checked={reportFormat === fmt} onChange={() => setReportFormat(fmt)} style={{ accentColor: '#2563EB' }} />
                                      {fmt}
                                    </label>
                                  ))}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={handleGenerateStaffReport}
                                disabled={generatingReport}
                                style={{
                                  marginTop: '6px',
                                  padding: '8px 14px',
                                  borderRadius: '6px',
                                  background: '#2563EB',
                                  color: '#FFFFFF',
                                  fontWeight: 800,
                                  fontSize: '12.5px',
                                  border: 'none',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px'
                                }}
                              >
                                {generatingReport ? <FaSync className="fa-spin" /> : <FaPlusSquare />} Generate Report
                              </button>
                            </div>

                            {/* Right Selected Report Card */}
                            <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                              <div>
                                <div style={{ fontSize: '11px', fontWeight: 800, color: '#F97316', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                                  <FaFileAlt size={10} /> Selected Report
                                </div>
                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', marginBottom: '10px' }}>
                                  {generatedReportData ? generatedReportData.report_name : "Today's Approved Applications"}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11.5px' }}>
                                  <div><strong style={{ color: '#64748B' }}>Staff:</strong> <span style={{ fontWeight: 700, color: '#0F172A' }}>Sharad Yohesa</span> <span style={{ fontSize: '10.5px', color: '#64748B' }}>YOH-TC0042 • Team Coordinator</span></div>
                                  <div><strong style={{ color: '#64748B' }}>Date:</strong> <span style={{ fontWeight: 700, color: '#0F172A' }}>28 September 2026</span></div>
                                  <div><strong style={{ color: '#64748B' }}>Records:</strong> <span style={{ fontWeight: 800, color: '#2563EB' }}>24 Applications</span></div>
                                  <div><strong style={{ color: '#64748B' }}>Format:</strong> <span style={{ fontWeight: 700, color: '#0F172A' }}>PDF</span></div>
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                <button
                                  type="button"
                                  onClick={() => window.open(generatedReportData?.report_url || '#', '_blank')}
                                  style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#1E40AF', fontSize: '11px', fontWeight: 800, cursor: 'pointer', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                >
                                  <FaEye size={11} /> Preview Report
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setGeneratedReportData(null)}
                                  style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#991B1B', fontSize: '11px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                >
                                  <FaTrash size={10} /> Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* ──────────────── RIGHT COLUMN ──────────────── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  
                  {/* STEP 3: Select WhatsApp Template */}
                  <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#2563EB', color: '#FFF', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</div>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>Select WhatsApp Template</h4>
                    </div>

                    <select
                      value={selectedTemplate?.template_name || ''}
                      onChange={(e) => {
                        const found = templates.find(t => t.template_name === e.target.value);
                        if (found) handleSelectTemplate(found);
                      }}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 700, color: '#0F172A', background: '#FFF' }}
                    >
                      {templates.map(tpl => (
                        <option key={tpl.id} value={tpl.template_name}>
                          [{tpl.template_category.toUpperCase()}] {tpl.template_name.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>

                    {/* Auto populated template variables */}
                    <div style={{ marginTop: '12px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '10px 12px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#1E40AF', marginBottom: '8px' }}>
                        Template Variables (Auto-Populated from Application / Report)
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11.5px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748B' }}>customer name</span><strong style={{ color: '#0F172A' }}>{variables['customer_name'] || 'test'}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748B' }}>pan masked</span><strong style={{ color: '#0F172A' }}>{variables['pan_masked'] || 'ABCD******'}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748B' }}>application id</span><strong style={{ color: '#0F172A' }}>{variables['application_id'] || 'APP49842408'}</strong></div>
                      </div>
                    </div>
                  </div>

                  {/* Live WhatsApp Message Preview */}
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#0F172A', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FaWhatsapp color="#25D366" size={14} /> Live WhatsApp Message Preview
                    </div>

                    <div style={{ background: '#EFEAE2', borderRadius: '10px', padding: '12px', border: '1px solid #CBD5E1' }}>
                      <div style={{ background: '#FFFFFF', borderRadius: '8px', padding: '10px 12px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', position: 'relative' }}>
                        <p style={{ margin: '0 0 8px', fontSize: '12.5px', color: '#111827', lineHeight: '1.45', whiteSpace: 'pre-line' }}>
                          {renderPreviewText() || `Hello test,\n\nthe PAN details provided (ABCD******) for Application #APP49842408 could not be verified. Please provide a clear copy of your valid PAN card.`}
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '10px', color: '#9CA3AF' }}>
                          10:29 AM <span style={{ color: '#3B82F6', marginLeft: '3px' }}>✓✓</span>
                        </div>

                        {/* Attached File Preview Badge at bottom of preview bubble */}
                        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '8px', background: '#F8FAFC', padding: '6px 8px', borderRadius: '6px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FaFilePdf size={14} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '11px', fontWeight: 800, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {generatedReportData ? `${generatedReportData.report_name}.pdf` : "Today's Approved Applications.pdf"}
                            </div>
                            <div style={{ fontSize: '10px', color: '#64748B' }}>2.4 MB • PDF</div>
                          </div>
                          <FaTimes size={10} color="#94A3B8" style={{ cursor: 'pointer' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Modal Footer Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingTop: '14px', borderTop: '1px solid #E2E8F0' }}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={sending}
                  style={{ padding: '9px 18px', borderRadius: '8px', background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#475569', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  style={{
                    padding: '9px 22px', borderRadius: '8px', background: sending ? '#9CA3AF' : '#059669', color: '#FFFFFF', fontWeight: 800, fontSize: '13px', border: 'none', cursor: sending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                  }}
                >
                  {sending ? <><FaSync className="fa-spin" /> Sending...</> : <><FaPaperPlane /> Send WhatsApp</>}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
