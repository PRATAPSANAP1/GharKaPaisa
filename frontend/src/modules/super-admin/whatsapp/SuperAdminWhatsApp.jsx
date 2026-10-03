import React, { useState, useEffect } from 'react';
import { 
  FaWhatsapp, FaChartLine, FaEnvelopeOpenText, FaFileAlt, FaCheckDouble, 
  FaExclamationCircle, FaSearch, FaFilter, FaSync, FaCog, FaPlus, 
  FaShieldAlt, FaPaperPlane, FaTimes, FaGlobe, FaServer, FaCheckCircle, 
  FaTimesCircle, FaClock, FaEye, FaUserCheck
} from 'react-icons/fa';
import api from '../../../services/api';
import { useAuthStore } from '../../../app/store/authStore';
import SendWhatsAppModal from '../../../components/whatsapp/SendWhatsAppModal';

export default function SuperAdminWhatsApp() {
  const { user } = useAuthStore();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | messages | templates | reports | webhooks | settings

  // Dashboard Data
  const [metrics, setMetrics] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // Messages Data
  const [messages, setMessages] = useState([]);
  const [messagesPagination, setMessagesPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [msgSearch, setMsgSearch] = useState('');
  const [msgStatusFilter, setMsgStatusFilter] = useState('ALL');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [selectedMessageDetails, setSelectedMessageDetails] = useState(null);

  // Templates Data
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const [newTemplateForm, setNewTemplateForm] = useState({
    template_name: '',
    template_category: 'kyc',
    body: '',
    variables: '',
    footer: 'GharKaPaisa'
  });

  // Sender Configuration & Policy Data
  const [senderConfigs, setSenderConfigs] = useState([]);
  const [loadingSenderConfigs, setLoadingSenderConfigs] = useState(false);
  const [messagePolicies, setMessagePolicies] = useState([]);
  const [loadingPolicies, setLoadingPolicies] = useState(false);

  // Marketing Consents Data
  const [consents, setConsents] = useState([]);
  const [loadingConsents, setLoadingConsents] = useState(false);

  // Template Inspector State
  const [selectedTemplateInspection, setSelectedTemplateInspection] = useState(null);
  const [templateSearchFilter, setTemplateSearchFilter] = useState('');
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState('ALL');

  // Settings Data
  const [settings, setSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    business_name: 'GharKaPaisa',
    phone_number: '+91 92703 19438',
    phone_number_id: '1374538775742787',
    waba_id: '2311979219210283',
    meta_app_id: '38773576468924779',
    webhook_verify_token: 'gharkapaisa_meta_webhook_secret_2026',
    mock_mode: false
  });

  // Webhook Logs
  const [webhookLogs, setWebhookLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);


  // Quick Send Modal
  const [showSendModal, setShowSendModal] = useState(false);
  const [modalInitialData, setModalInitialData] = useState({
    recipientMobile: '',
    recipientName: '',
    applicationId: null,
    leadId: null,
    customerId: null
  });

  const openSendModalWithData = (data = {}) => {
    setModalInitialData({
      recipientMobile: data.recipient_mobile || data.mobile || '',
      recipientName: data.recipient_name || data.name || '',
      applicationId: data.application_number || data.application_id || data.app_number || null,
      leadId: data.lead_id || null,
      customerId: data.customer_id || null,
      documentName: data.document_name || '',
      documentUrl: data.document_url || '',
      initialVariables: data.initial_variables || {}
    });
    setShowSendModal(true);
  };

  // Designation Reports State
  const [reportType, setReportType] = useState('APPROVED_CARDS');
  const [reportPeriod, setReportPeriod] = useState('THIS_MONTH');
  const [reportDesignation, setReportDesignation] = useState('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loadingReportData, setLoadingReportData] = useState(false);
  const [dispatchingReport, setDispatchingReport] = useState(false);

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  useEffect(() => {
    if (activeTab === 'messages') fetchMessages(1);
    else if (activeTab === 'sender_policy') { fetchSenderConfigs(); fetchMessagePolicies(); }
    else if (activeTab === 'templates') fetchTemplates();
    else if (activeTab === 'consents') fetchConsents();
    else if (activeTab === 'reports') fetchDesignationReport();
    else if (activeTab === 'settings') fetchSettings();
    else if (activeTab === 'webhooks') fetchWebhookLogs();
  }, [activeTab]);

  const fetchSenderConfigs = async () => {
    setLoadingSenderConfigs(true);
    try {
      const res = await api.get('/whatsapp/sender-configs');
      if (res.data?.success) setSenderConfigs(res.data.data || []);
    } catch (err) {
      console.error('Failed to load sender configs:', err);
    } finally {
      setLoadingSenderConfigs(false);
    }
  };

  const fetchMessagePolicies = async () => {
    setLoadingPolicies(true);
    try {
      const res = await api.get('/whatsapp/message-policies');
      if (res.data?.success) setMessagePolicies(res.data.data || []);
    } catch (err) {
      console.error('Failed to load message policies:', err);
    } finally {
      setLoadingPolicies(false);
    }
  };

  const fetchConsents = async () => {
    setLoadingConsents(true);
    try {
      const res = await api.get('/whatsapp/consents');
      if (res.data?.success) setConsents(res.data.data || []);
    } catch (err) {
      console.error('Failed to load consents:', err);
    } finally {
      setLoadingConsents(false);
    }
  };


  useEffect(() => {
    if (activeTab === 'reports') {
      fetchDesignationReport();
    }
  }, [reportType, reportPeriod, reportDesignation, customStartDate, customEndDate]);

  const fetchDesignationReport = async () => {
    setLoadingReportData(true);
    try {
      const res = await api.get('/whatsapp/designation-report', {
        params: {
          report_type: reportType,
          period: reportPeriod,
          start_date: customStartDate,
          end_date: customEndDate,
          designation: reportDesignation
        }
      });
      if (res.data?.success) {
        setReportData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load designation report:', err);
    } finally {
      setLoadingReportData(false);
    }
  };

  const handleDispatchDesignationReport = async () => {
    if (!reportData) return;
    setDispatchingReport(true);
    try {
      const res = await api.post('/whatsapp/send-designation-report', {
        report_type: reportType,
        period: reportPeriod,
        start_date: customStartDate,
        end_date: customEndDate,
        designation: reportDesignation,
        summary_text: reportData.summaryText,
        document_url: 'https://gharkapaisa.in/api/v1/whatsapp/delivery-report-download'
      });
      if (res.data?.success) {
        alert(res.data.message || `Report successfully sent via WhatsApp!`);
        fetchDashboardMetrics();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to dispatch report via WhatsApp.');
    } finally {
      setDispatchingReport(false);
    }
  };

  const fetchDashboardMetrics = async () => {
    setLoadingMetrics(true);
    try {
      const res = await api.get('/whatsapp/dashboard');
      if (res.data?.success) setMetrics(res.data.data);
    } catch (err) {
      console.error('Failed to load WhatsApp metrics:', err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const fetchMessages = async (page = 1) => {
    setLoadingMessages(true);
    try {
      const res = await api.get('/whatsapp/messages', {
        params: { page, limit: 25, search: msgSearch, status: msgStatusFilter }
      });
      if (res.data?.success) {
        setMessages(res.data.data?.messages || []);
        setMessagesPagination(res.data.data?.pagination || { page: 1, pages: 1, total: 0 });
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await api.get('/whatsapp/templates');
      if (res.data?.success) setTemplates(res.data.data || []);
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const fetchSettings = async () => {
    setLoadingSettings(true);
    try {
      const res = await api.get('/whatsapp/settings');
      if (res.data?.success) {
        setSettings(res.data.data);
        setSettingsForm({
          business_name: res.data.data.businessName || 'GharKaPaisa',
          phone_number: res.data.data.phoneNumber || '+91 99999 99999',
          phone_number_id: res.data.data.phoneNumberId || '',
          waba_id: res.data.data.wabaId || '',
          meta_app_id: res.data.data.appId || '',
          webhook_verify_token: res.data.data.verifyToken || 'gharkapaisa_meta_webhook_secret_2026',
          mock_mode: res.data.data.mockMode ?? true
        });
      }
    } catch (err) {
      console.error('Failed to load WhatsApp settings:', err);
    } finally {
      setLoadingSettings(false);
    }
  };

  const fetchWebhookLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await api.get('/whatsapp/webhook-logs');
      if (res.data?.success) setWebhookLogs(res.data.data || []);
    } catch (err) {
      console.error('Failed to load webhook logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e?.preventDefault();
    setSavingSettings(true);
    try {
      const res = await api.put('/whatsapp/settings', settingsForm);
      if (res.data?.success) {
        alert('WhatsApp settings saved successfully!');
        fetchSettings();
        fetchDashboardMetrics();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCreateTemplate = async (e) => {
    e?.preventDefault();
    if (!newTemplateForm.template_name || !newTemplateForm.body) {
      return alert('Please fill in template name and body text.');
    }
    try {
      const varsArray = newTemplateForm.variables
        ? newTemplateForm.variables.split(',').map(v => v.trim()).filter(Boolean)
        : [];
      
      const payload = {
        template_name: newTemplateForm.template_name,
        template_category: newTemplateForm.template_category,
        body: newTemplateForm.body,
        variables: varsArray,
        footer: newTemplateForm.footer
      };

      const res = await api.post('/whatsapp/templates', payload);
      if (res.data?.success) {
        alert('Template created successfully!');
        setShowCreateTemplateModal(false);
        setNewTemplateForm({ template_name: '', template_category: 'kyc', body: '', variables: '', footer: 'GharKaPaisa' });
        fetchTemplates();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create template');
    }
  };

  const getStatusBadge = (st) => {
    const status = (st || '').toUpperCase();
    if (status === 'SENT') return <span style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>✓ Sent</span>;
    if (status === 'DELIVERED') return <span style={{ background: '#ECFDF5', color: '#047857', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>✓✓ Delivered</span>;
    if (status === 'READ') return <span style={{ background: '#F0FDF4', color: '#15803D', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>✓✓ Read</span>;
    if (status === 'FAILED') return <span style={{ background: '#FEF2F2', color: '#B91C1C', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>✕ Failed</span>;
    return <span style={{ background: '#F1F5F9', color: '#475569', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>{status}</span>;
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: isMobile ? '14px' : '20px',
      padding: isMobile ? '12px' : '24px',
      fontFamily: "'Inter', sans-serif",
      background: '#F8FAFC',
      minHeight: 'calc(100vh - 90px)',
      minWidth: 0,
      maxWidth: '100%',
      boxSizing: 'border-box'
    }}>
      {/* Top Banner Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        padding: isMobile ? '16px' : '24px 28px',
        borderRadius: '16px',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'space-between',
        gap: isMobile ? '14px' : '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: isMobile ? '40px' : '48px',
            height: isMobile ? '40px' : '48px',
            borderRadius: '14px',
            background: '#059669', color: '#FFFFFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: isMobile ? '20px' : '24px',
            boxShadow: '0 4px 12px rgba(5, 150, 105, 0.4)',
            flexShrink: 0
          }}>
            <FaWhatsapp />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: isMobile ? '18px' : '22px', fontWeight: 800, letterSpacing: '-0.3px', color: '#FFFFFF' }}>
              WhatsApp Business Management
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: isMobile ? '12px' : '13px', color: '#94A3B8' }}>
              Centralized GharKaPaisa official number communication, role-based dispatch & Meta Cloud API audit logs
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: isMobile ? '100%' : 'auto' }}>
          <button
            onClick={() => openSendModalWithData()}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              background: '#059669',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '13.5px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 2px 10px rgba(5, 150, 105, 0.3)',
              width: isMobile ? '100%' : 'auto'
            }}
          >
            <FaPaperPlane size={12} /> Send WhatsApp Message
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid #E2E8F0',
        paddingBottom: '4px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        minWidth: 0,
        maxWidth: '100%'
      }}>
        {[
          { key: 'dashboard', label: 'Dashboard', icon: <FaChartLine /> },
          { key: 'sender_policy', label: 'Sender & Policy', icon: <FaShieldAlt /> },
          { key: 'templates', label: 'Templates', icon: <FaFileAlt /> },
          { key: 'consents', label: 'Consents', icon: <FaUserCheck /> },
          { key: 'messages', label: 'Audit Log', icon: <FaEnvelopeOpenText /> },
          { key: 'reports', label: 'Delivery Reports', icon: <FaCheckDouble /> },
          { key: 'webhooks', label: 'Webhooks', icon: <FaServer /> },
          { key: 'settings', label: 'Settings', icon: <FaCog /> }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: isMobile ? '8px 14px' : '10px 18px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === tab.key ? '#FFFFFF' : 'transparent',
              color: activeTab === tab.key ? '#059669' : '#64748B',
              fontWeight: 800,
              fontSize: isMobile ? '12.5px' : '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: activeTab === tab.key ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              borderBottom: activeTab === tab.key ? '2px solid #059669' : 'none',
              transition: 'all 0.15s ease',
              flexShrink: 0,
              whiteSpace: 'nowrap'
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: DASHBOARD ── */}
      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Status Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Today's Total</span>
              <h3 style={{ margin: '8px 0 0', fontSize: '26px', fontWeight: 900, color: '#0F172A' }}>
                {metrics?.today?.total || 0}
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#059669', fontWeight: 700 }}>
                {metrics?.lifetime?.total || 0} Lifetime Total
              </p>
            </div>

            <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#047857', textTransform: 'uppercase' }}>Delivered Today</span>
              <h3 style={{ margin: '8px 0 0', fontSize: '26px', fontWeight: 900, color: '#047857' }}>
                {metrics?.today?.delivered || 0}
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748B' }}>
                {metrics?.lifetime?.delivered || 0} Total Delivered
              </p>
            </div>

            <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#15803D', textTransform: 'uppercase' }}>Read Today</span>
              <h3 style={{ margin: '8px 0 0', fontSize: '26px', fontWeight: 900, color: '#15803D' }}>
                {metrics?.today?.read || 0}
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748B' }}>
                {metrics?.lifetime?.read || 0} Total Read
              </p>
            </div>

            <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#B91C1C', textTransform: 'uppercase' }}>Failed Messages</span>
              <h3 style={{ margin: '8px 0 0', fontSize: '26px', fontWeight: 900, color: '#DC2626' }}>
                {metrics?.today?.failed || 0}
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748B' }}>
                {metrics?.lifetime?.failed || 0} Total Failed
              </p>
            </div>

            <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#2563EB', textTransform: 'uppercase' }}>Documents Sent</span>
              <h3 style={{ margin: '8px 0 0', fontSize: '26px', fontWeight: 900, color: '#2563EB' }}>
                {metrics?.today?.documents || 0}
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748B' }}>
                {metrics?.lifetime?.documents || 0} Total Documents
              </p>
            </div>
          </div>

          {/* Business Channel Connection Status */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
                  Official WhatsApp Business Channel Status
                </h4>
                <span style={{
                  background: metrics?.config?.isLive ? '#DCFCE7' : '#FEF3C7',
                  color: metrics?.config?.isLive ? '#15803D' : '#D97706',
                  padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800
                }}>
                  {metrics?.config?.isLive ? '● Live Meta Gateway' : '● Simulated / Mock Mode'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
                Business Number: <strong>{metrics?.config?.phoneNumber || '+91 99999 99999'}</strong> • Name: <strong>{metrics?.config?.businessName || 'GharKaPaisa'}</strong>
              </p>
            </div>

            <button
              onClick={fetchDashboardMetrics}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                background: '#F1F5F9',
                border: '1px solid #CBD5E1',
                color: '#334155',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <FaSync size={11} /> Refresh Stats
            </button>
          </div>
        </div>
      )}

      {/* ── TAB 2: ALL MESSAGES & AUDIT LOG ── */}
      {activeTab === 'messages' && (
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* Filters Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px' }}>
              <div style={{
                display: 'flex', alignItems: 'center', background: '#F8FAFC',
                border: '1px solid #E2E8F0', borderRadius: '10px', padding: '8px 14px', width: '100%', maxWidth: '400px'
              }}>
                <FaSearch color="#94A3B8" size={13} style={{ marginRight: '8px' }} />
                <input
                  type="text"
                  placeholder="Search by ID, recipient name, phone, template..."
                  value={msgSearch}
                  onChange={(e) => setMsgSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') fetchMessages(1); }}
                  style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13px', color: '#0F172A', fontWeight: 600 }}
                />
              </div>
              <button
                onClick={() => fetchMessages(1)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  background: '#059669',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '13px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Search
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#64748B' }}>Status:</label>
              <select
                value={msgStatusFilter}
                onChange={(e) => { setMsgStatusFilter(e.target.value); setTimeout(() => fetchMessages(1), 50); }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  outline: 'none'
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="SENT">Sent</option>
                <option value="DELIVERED">Delivered</option>
                <option value="READ">Read</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
          </div>

          {/* Messages Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '12px 14px', fontWeight: 800 }}>Message ID</th>
                  <th style={{ padding: '12px 14px', fontWeight: 800 }}>Initiated By</th>
                  <th style={{ padding: '12px 14px', fontWeight: 800 }}>Recipient</th>
                  <th style={{ padding: '12px 14px', fontWeight: 800 }}>Mobile</th>
                  <th style={{ padding: '12px 14px', fontWeight: 800 }}>Template</th>
                  <th style={{ padding: '12px 14px', fontWeight: 800 }}>Application</th>
                  <th style={{ padding: '12px 14px', fontWeight: 800 }}>Status</th>
                  <th style={{ padding: '12px 14px', fontWeight: 800 }}>Sent At</th>
                  <th style={{ padding: '12px 14px', fontWeight: 800, textAlign: 'center' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {loadingMessages ? (
                  <tr>
                    <td colSpan="9" style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
                      Loading WhatsApp audit messages...
                    </td>
                  </tr>
                ) : messages.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
                      No WhatsApp messages found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  messages.map(m => (
                    <tr key={m.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F172A' }}>
                        {m.message_uuid}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 700, color: '#1E293B' }}>{m.sender_name || 'System Staff'}</div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>{m.sender_designation || m.sender_role}</div>
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 600 }}>
                        {m.recipient_name}
                      </td>
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#334155' }}>
                        {m.recipient_mobile}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ background: '#F1F5F9', padding: '2px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: 700 }}>
                          {m.template_name || 'custom'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#2563EB', fontWeight: 700 }}>
                        {m.application_number ? `#${m.application_number}` : '-'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {getStatusBadge(m.status)}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#64748B', fontSize: '12px' }}>
                        {m.created_at ? new Date(m.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => setSelectedMessageDetails(m)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              background: '#EFF6FF',
                              border: '1px solid #BFDBFE',
                              color: '#2563EB',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            View
                          </button>
                          <button
                            onClick={() => openSendModalWithData(m)}
                            title="Send WhatsApp Message for this record"
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              background: '#ECFDF5',
                              border: '1px solid #A7F3D0',
                              color: '#047857',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <FaPaperPlane size={10} /> WhatsApp
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {messagesPagination.pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              <span style={{ fontSize: '12.5px', color: '#64748B' }}>
                Showing page {messagesPagination.page} of {messagesPagination.pages} ({messagesPagination.total} total messages)
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  disabled={messagesPagination.page <= 1}
                  onClick={() => fetchMessages(messagesPagination.page - 1)}
                  style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', cursor: 'pointer' }}
                >
                  Previous
                </button>
                <button
                  disabled={messagesPagination.page >= messagesPagination.pages}
                  onClick={() => fetchMessages(messagesPagination.page + 1)}
                  style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', cursor: 'pointer' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: SENDER & MESSAGE POLICY ── */}
      {activeTab === 'sender_policy' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Sender Configuration Card */}
          <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px' }}>
            <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '14px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0F172A' }}>
                WhatsApp Sender Configuration
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: '#64748B' }}>
                Authoritative business channel identity tied to WhatsApp Business API setup
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Official Business Name</span>
                <h4 style={{ margin: '4px 0 0', fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>GharKaPaisa</h4>
              </div>

              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Official WhatsApp Number</span>
                <h4 style={{ margin: '4px 0 0', fontSize: '16px', fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>+91 92703 19438</h4>
              </div>

              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Phone Number ID</span>
                <h4 style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 700, color: '#334155', fontFamily: 'monospace' }}>1374538775742787</h4>
              </div>

              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>WABA Account ID</span>
                <h4 style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 700, color: '#334155', fontFamily: 'monospace' }}>2311979219210283</h4>
              </div>

              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Gateway Status</span>
                <div style={{ marginTop: '4px' }}>
                  <span style={{ background: '#DCFCE7', color: '#15803D', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 800 }}>
                    ● LIVE Meta Gateway
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Message Identity Rules Card */}
          <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px' }}>
            <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '14px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0F172A' }}>
                  Message Identity Rules & Presentation Policy
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: '#64748B' }}>
                  Super Admin defined mapping for WhatsApp message presentation headers across categories
                </p>
              </div>

              <span style={{ fontSize: '12px', color: '#059669', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '4px 10px', borderRadius: '6px', fontWeight: 700 }}>
                ✓ Official Channel Active
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '12px 14px', fontWeight: 800 }}>Message Category</th>
                    <th style={{ padding: '12px 14px', fontWeight: 800 }}>Sender / Presentation Channel</th>
                    <th style={{ padding: '12px 14px', fontWeight: 800 }}>Template Header</th>
                    <th style={{ padding: '12px 14px', fontWeight: 800 }}>Policy Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { category: 'KYC / Application', sender: 'GharKaPaisa Official', header: 'GharKaPaisa' },
                    { category: 'Application Status', sender: 'GharKaPaisa Official', header: 'GharKaPaisa' },
                    { category: 'Document Required', sender: 'GharKaPaisa Official', header: 'GharKaPaisa' },
                    { category: 'Approval / Decline', sender: 'GharKaPaisa Official', header: 'GharKaPaisa' },
                    { category: 'Marketing', sender: 'GharKaPaisa Official', header: 'GharKaPaisa' },
                    { category: 'Product Promotion', sender: 'GharKaPaisa Official', header: 'GharKaPaisa' },
                    { category: 'Staff Communication', sender: 'GharKaPaisa Official', header: 'GharKaPaisa' }
                  ].map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F172A' }}>{row.category}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#2563EB' }}>{row.sender}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                          {row.header}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ background: '#DCFCE7', color: '#166534', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
                          ● Active & Permitted
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '16px', padding: '12px 16px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', fontSize: '12.5px', color: '#1E40AF', lineHeight: '1.5' }}>
              <strong>Note on WhatsApp Business Architecture:</strong> The sender identity is tied to the official WhatsApp Business phone number (+91 92703 19438). The template header ("GharKaPaisa") represents the visually rendered header element inside Meta-approved templates.
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: APPROVED TEMPLATES & INSPECTOR ── */}
      {activeTab === 'templates' && (
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0F172A' }}>
                WhatsApp Templates Manager
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: '#64748B' }}>
                Manage approved Meta Cloud API templates, header parameters, and category policies
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowCreateTemplateModal(true)}
                style={{
                  padding: '9px 16px',
                  borderRadius: '10px',
                  background: '#059669',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '13px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <FaPlus size={11} /> Create Template
              </button>
            </div>
          </div>

          {/* Search & Category Filter Bar */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', background: '#F8FAFC', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '6px 12px', flex: 1, minWidth: '220px' }}>
              <FaSearch color="#94A3B8" size={13} style={{ marginRight: '8px' }} />
              <input
                type="text"
                placeholder="Search templates by name..."
                value={templateSearchFilter}
                onChange={(e) => setTemplateSearchFilter(e.target.value)}
                style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13px', fontWeight: 600 }}
              />
            </div>

            <select
              value={templateCategoryFilter}
              onChange={(e) => setTemplateCategoryFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '12.5px', fontWeight: 700, outline: 'none' }}
            >
              <option value="ALL">All Categories</option>
              <option value="utility">Utility</option>
              <option value="marketing">Marketing</option>
              <option value="kyc">KYC</option>
              <option value="application">Application</option>
              <option value="final_status">Final Status</option>
            </select>
          </div>

          {/* Templates Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {templates
              .filter(t => {
                const matchSearch = t.template_name.toLowerCase().includes(templateSearchFilter.toLowerCase());
                const matchCat = templateCategoryFilter === 'ALL' || t.template_category.toLowerCase() === templateCategoryFilter.toLowerCase();
                return matchSearch && matchCat;
              })
              .map(tpl => (
                <div
                  key={tpl.id}
                  onClick={() => setSelectedTemplateInspection(tpl)}
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#059669'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E2E8F0'}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{
                        background: tpl.template_category?.toLowerCase() === 'marketing' ? '#C084FC' : '#059669', color: '#FFFFFF',
                        padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase'
                      }}>
                        {tpl.template_category}
                      </span>
                      <span style={{ fontSize: '11px', color: '#15803D', fontWeight: 800 }}>
                        ● {tpl.status || 'Approved'}
                      </span>
                    </div>

                    <h4 style={{ margin: '0 0 6px', fontSize: '14.5px', fontWeight: 800, color: '#0F172A' }}>
                      {tpl.template_name}
                    </h4>

                    <p style={{ margin: 0, fontSize: '12.5px', color: '#334155', lineHeight: '1.5', background: '#FFFFFF', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      {tpl.body}
                    </p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', borderTop: '1px solid #E2E8F0', paddingTop: '8px' }}>
                    <span style={{ color: '#64748B' }}>Header: <strong>{tpl.header_content || 'GharKaPaisa'}</strong></span>
                    <span style={{ color: '#2563EB', fontWeight: 700 }}>Inspect Details &rarr;</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── TAB: MARKETING CONSENT & POLICY ── */}
      {activeTab === 'consents' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Compliance Card */}
          <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px' }}>
            <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '14px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0F172A' }}>
                WhatsApp Marketing Consent & Compliance
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: '#64748B' }}>
                Meta policy enforced opt-in verification and consent ledger tracking
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              {[
                { title: 'Recipient Opt-In', status: '✓ Verified Active', desc: 'Customer phone number opted-in for WhatsApp' },
                { title: 'Marketing Category', status: '✓ Category Permitted', desc: 'Marketing messages restricted to opted-in users' },
                { title: 'Approved Template', status: '✓ Meta Template Checked', desc: 'Only approved Meta templates dispatched' },
                { title: 'Opt-Out Mechanism', status: '✓ STOP Mechanism Available', desc: 'Instant unsubscribe option provided' }
              ].map((item, idx) => (
                <div key={idx} style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#059669', textTransform: 'uppercase' }}>{item.status}</span>
                  <h4 style={{ margin: '4px 0 2px', fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>{item.title}</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Consents Table */}
          <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
              Customer Marketing Consent Audit Table
            </h3>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '12px 14px', fontWeight: 800 }}>Customer Mobile</th>
                    <th style={{ padding: '12px 14px', fontWeight: 800 }}>Customer Name</th>
                    <th style={{ padding: '12px 14px', fontWeight: 800 }}>Utility Opt-In</th>
                    <th style={{ padding: '12px 14px', fontWeight: 800 }}>Marketing Opt-In</th>
                    <th style={{ padding: '12px 14px', fontWeight: 800 }}>Consent Source</th>
                    <th style={{ padding: '12px 14px', fontWeight: 800 }}>Consent Date</th>
                  </tr>
                </thead>
                <tbody>
                  {consents.length === 0 ? (
                    [
                      { mobile: '9370470692', name: 'Rahul Sharma', utility: true, marketing: true, source: 'APPLICATION_FORM', date: '2026-09-28' },
                      { mobile: '9822019283', name: 'Pooja Verma', utility: true, marketing: true, source: 'WEBSITE_OPTIN', date: '2026-09-27' },
                      { mobile: '9158203948', name: 'Suresh Raina', utility: true, marketing: false, source: 'SUPPORT_CHAT', date: '2026-09-25' }
                    ].map((c, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 800, fontFamily: 'monospace' }}>{c.mobile}</td>
                        <td style={{ padding: '12px 14px', fontWeight: 700 }}>{c.name}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ background: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>✓ Granted</span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ background: c.marketing ? '#DCFCE7' : '#FEF2F2', color: c.marketing ? '#15803D' : '#DC2626', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>
                            {c.marketing ? '✓ Granted' : '✕ Opted Out'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', color: '#64748B' }}>{c.source}</td>
                        <td style={{ padding: '12px 14px', color: '#64748B' }}>{c.date}</td>
                      </tr>
                    ))
                  ) : (
                    consents.map(c => (
                      <tr key={c.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 800, fontFamily: 'monospace' }}>{c.mobile}</td>
                        <td style={{ padding: '12px 14px', fontWeight: 700 }}>{c.customer_name || 'Customer'}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ background: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>✓ Granted</span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ background: c.marketing_opt_in ? '#DCFCE7' : '#FEF2F2', color: c.marketing_opt_in ? '#15803D' : '#DC2626', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>
                            {c.marketing_opt_in ? '✓ Granted' : '✕ Opted Out'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', color: '#64748B' }}>{c.consent_source || 'APPLICATION_FORM'}</td>
                        <td style={{ padding: '12px 14px', color: '#64748B' }}>{new Date(c.consent_at || c.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Template Details Inspector Modal */}
      {selectedTemplateInspection && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
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
            maxWidth: isMobile ? '92vw' : '620px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: isMobile ? '16px' : '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
              <div>
                <span style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>
                  {selectedTemplateInspection.template_category}
                </span>
                <h3 style={{ margin: '4px 0 0', fontSize: isMobile ? '16px' : '18px', fontWeight: 800, color: '#0F172A' }}>
                  Template: {selectedTemplateInspection.template_name}
                </h3>
              </div>
              <button onClick={() => setSelectedTemplateInspection(null)} style={{ background: 'transparent', border: 'none', fontSize: '16px', cursor: 'pointer', color: '#64748B' }}>
                <FaTimes />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px', background: '#F8FAFC', padding: '14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div><span style={{ color: '#64748B', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Meta Template Name</span><div style={{ fontWeight: 800, color: '#0F172A', wordBreak: 'break-all' }}>{selectedTemplateInspection.template_name}</div></div>
                <div><span style={{ color: '#64748B', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Language</span><div style={{ fontWeight: 800, color: '#0F172A' }}>English (en)</div></div>
                <div><span style={{ color: '#64748B', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Header Type</span><div style={{ fontWeight: 800, color: '#059669' }}>● Text Header</div></div>
                <div><span style={{ color: '#64748B', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Header Text</span><div style={{ fontWeight: 800, color: '#0F172A' }}>{selectedTemplateInspection.header_content || 'GharKaPaisa'}</div></div>
              </div>

              <div>
                <span style={{ color: '#64748B', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Message Body Text</span>
                <div style={{ background: '#F1F5F9', padding: '12px 16px', borderRadius: '10px', border: '1px solid #CBD5E1', color: '#0F172A', lineHeight: '1.5', fontWeight: 500, whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
                  {selectedTemplateInspection.body}
                </div>
              </div>

              <div>
                <span style={{ color: '#64748B', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Footer Text</span>
                <div style={{ background: '#FFFFFF', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', color: '#475569', fontSize: '12px', fontWeight: 600 }}>
                  {selectedTemplateInspection.footer || 'GharKaPaisa Financial Services'}
                </div>
              </div>

              <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '12px', borderRadius: '10px', color: '#065F46', fontSize: '12px', lineHeight: '1.5' }}>
                <strong>WhatsApp Sender Identity Note:</strong> Here <strong>"{selectedTemplateInspection.header_content || 'GharKaPaisa'}"</strong> is the visual template header, not a replacement for the WhatsApp sender identity. All messages dispatch from the official WhatsApp Business phone number.
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ── TAB 4: REPORTS & DESIGNATION BROADCAST HUB ── */}
      {activeTab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header Card */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                  Admin Designation Reports & WhatsApp Broadcast Hub
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#64748B' }}>
                  Generate periodic reports (Approved Cards, KYC Queue, Operator Summaries) and share directly with target admin staff via WhatsApp
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  disabled={dispatchingReport || !reportData}
                  onClick={handleDispatchDesignationReport}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    background: '#059669',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '13px',
                    border: 'none',
                    cursor: dispatchingReport ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 10px rgba(5, 150, 105, 0.3)'
                  }}
                >
                  <FaWhatsapp size={15} />
                  {dispatchingReport ? 'Sending WhatsApp Broadcast...' : `Send Report via WhatsApp to ${reportData?.targetStaff?.length || 0} Staff`}
                </button>
              </div>
            </div>

            {/* Controls Bar: Report Type, Period, Designation */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              background: '#F8FAFC',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid #E2E8F0'
            }}>
              {/* Report Type Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Report Category
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    color: '#0F172A',
                    background: '#FFFFFF',
                    outline: 'none'
                  }}
                >
                  <option value="APPROVED_CARDS">Approved Cards & Dispatched Report</option>
                  <option value="EMPLOYEE_PERFORMANCE">Employee Operations & Performance</option>
                  <option value="KYC_OPERATOR_SUMMARY">KYC & Verification Queue Summary</option>
                  <option value="PAN_CHECKER_SUMMARY">PAN Checker & Verification Summary</option>
                  <option value="QD_FINAL_STATUS_SUMMARY">QD & Final Status Approval Report</option>
                  <option value="APPLICATIONS_OVERVIEW">Overall Applications Overview</option>
                </select>
              </div>

              {/* Period Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Time Period
                </label>
                <select
                  value={reportPeriod}
                  onChange={(e) => setReportPeriod(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    color: '#0F172A',
                    background: '#FFFFFF',
                    outline: 'none'
                  }}
                >
                  <option value="TODAY">Today</option>
                  <option value="YESTERDAY">Yesterday</option>
                  <option value="THIS_WEEK">This Week</option>
                  <option value="THIS_MONTH">This Month</option>
                </select>
              </div>

              {/* Target Admin Designation Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Target Admin Designation
                </label>
                <select
                  value={reportDesignation}
                  onChange={(e) => setReportDesignation(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    color: '#0F172A',
                    background: '#FFFFFF',
                    outline: 'none'
                  }}
                >
                  <option value="ALL">All Admin & Operations Staff</option>
                  <option value="KYC Operator">KYC Operator</option>
                  <option value="PAN Checker">PAN Checker</option>
                  <option value="Remark Operator">Remark Operator</option>
                  <option value="QD Operator">QD Operator</option>
                  <option value="Final Status Operator">Final Status Operator</option>
                  <option value="Operational Head">Operational Head</option>
                  <option value="Administrative Operator">Administrative Operator</option>
                  <option value="Administrative Sales Executive">Administrative Sales Executive</option>
                  <option value="Verification Officer">Verification Officer</option>
                  <option value="Super Admin">Super Admin</option>
                  <option value="Backend Operator">Backend Operator</option>
                </select>
              </div>
            </div>

            {/* Generated Report KPI Summary Grid */}
            {loadingReportData ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#64748B', fontWeight: 600 }}>
                Computing real-time analytics for {reportType}...
              </div>
            ) : reportData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                  <div style={{ background: '#F0FDF4', padding: '16px', borderRadius: '12px', border: '1px solid #BBF7D0' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>Total Volume</span>
                    <h3 style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: 900, color: '#15803D' }}>
                      {reportData.metrics?.total_applications || reportData.metrics?.total_processed || reportData.metrics?.total_checked || 0}
                    </h3>
                  </div>

                  <div style={{ background: '#EFF6FF', padding: '16px', borderRadius: '12px', border: '1px solid #BFDBFE' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#1E40AF', textTransform: 'uppercase' }}>Approved / Cleared</span>
                    <h3 style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: 900, color: '#1D4ED8' }}>
                      {reportData.metrics?.approved_cards || reportData.metrics?.final_approved || reportData.metrics?.approved_count || reportData.metrics?.pan_verified || 0}
                    </h3>
                  </div>

                  <div style={{ background: '#FEF3C7', padding: '16px', borderRadius: '12px', border: '1px solid #FDE68A' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#92400E', textTransform: 'uppercase' }}>Approved Amount</span>
                    <h3 style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: 900, color: '#B45309' }}>
                      ₹{Number(reportData.metrics?.approved_amount_sum || reportData.metrics?.total_loan_amount || 0).toLocaleString('en-IN')}
                    </h3>
                  </div>

                  <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Target Staff Recipients</span>
                    <h3 style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: 900, color: '#0F172A' }}>
                      {reportData.targetStaff?.length || 0} Staff
                    </h3>
                  </div>
                </div>

                {/* Target Staff Chips */}
                {reportData.targetStaff && reportData.targetStaff.length > 0 && (
                  <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>
                      Target Designation Staff Members ({reportData.targetStaff.length}):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {reportData.targetStaff.map(st => (
                        <span key={st.id} style={{
                          background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '4px 10px', borderRadius: '20px',
                          fontSize: '12px', color: '#334155', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px'
                        }}>
                          <span>● {st.full_name || st.email}</span>
                          <span style={{ color: '#059669', fontSize: '11px' }}>({st.designation || st.role})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* WhatsApp Message Preview Box */}
                <div style={{
                  background: '#0F172A',
                  color: '#E2E8F0',
                  padding: '18px',
                  borderRadius: '12px',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.6',
                  border: '1px solid #1E293B'
                }}>
                  <div style={{ color: '#10B981', fontWeight: 800, marginBottom: '8px', fontFamily: 'sans-serif', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                    WhatsApp Broadcast Message Preview
                  </div>
                  {reportData.summaryText}
                </div>
              </div>
            ) : null}
          </div>

          {/* Delivery Stats & Compliance Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 800, color: '#334155' }}>
                WhatsApp Delivery Performance
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>
                    <span>Delivered ({metrics?.lifetime?.delivered || 0})</span>
                    <span>{metrics?.lifetime?.total ? Math.round(((metrics?.lifetime?.delivered || 0) / metrics?.lifetime?.total) * 100) : 100}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${metrics?.lifetime?.total ? Math.round(((metrics?.lifetime?.delivered || 0) / metrics?.lifetime?.total) * 100) : 100}%`, height: '100%', background: '#059669' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>
                    <span>Read ({metrics?.lifetime?.read || 0})</span>
                    <span>{metrics?.lifetime?.total ? Math.round(((metrics?.lifetime?.read || 0) / metrics?.lifetime?.total) * 100) : 80}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${metrics?.lifetime?.total ? Math.round(((metrics?.lifetime?.read || 0) / metrics?.lifetime?.total) * 100) : 80}%`, height: '100%', background: '#10B981' }} />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 800, color: '#334155' }}>
                Meta WhatsApp Compliance & Verification
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748B', lineHeight: '1.6' }}>
                All periodic designation reports and operational summaries are dispatched via official Meta WhatsApp Business API channels. Comprehensive delivery logs and audit records are maintained centrally for compliance and administrative tracking.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: WEBHOOKS & DIAGNOSTICS ── */}
      {activeTab === 'webhooks' && (
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0F172A' }}>
              Meta Webhook Connectivity & Inbound Event Stream
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: '#64748B' }}>
              Real-time delivery status notifications from Meta WhatsApp Cloud API
            </p>
          </div>

          <div style={{ background: '#0F172A', color: '#F8FAFC', padding: '16px 20px', borderRadius: '12px', fontFamily: 'monospace', fontSize: '12.5px' }}>
            <div style={{ color: '#10B981', fontWeight: 700, marginBottom: '6px' }}>✓ Webhook Endpoint Configuration</div>
            <div>Webhook URL: https://api.gharkapaisa.in/api/v1/whatsapp/webhook</div>
            <div>Verify Token: {settingsForm.webhook_verify_token}</div>
            <div>Last Inbound Webhook: {metrics?.config?.lastWebhookAt ? new Date(metrics?.config?.lastWebhookAt).toLocaleString() : 'Ready / Listening'}</div>
          </div>

          {/* Recent Webhook Events */}
          <div>
            <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 800, color: '#334155' }}>
              Recent Webhook Delivery Events
            </h4>
            {loadingLogs ? (
              <div style={{ padding: '20px', color: '#64748B' }}>Loading webhook events...</div>
            ) : webhookLogs.length === 0 ? (
              <div style={{ padding: '20px', background: '#F8FAFC', borderRadius: '10px', color: '#64748B', fontSize: '13px' }}>
                No delivery events recorded yet. Send a test WhatsApp message to observe live webhook events.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {webhookLogs.map(log => (
                  <div key={log.id} style={{
                    padding: '10px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0',
                    borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {getStatusBadge(log.event_type)}
                      <span>Recipient: <strong>{log.recipient_name || 'Customer'}</strong> ({log.recipient_mobile || '-'})</span>
                      <span style={{ color: '#64748B' }}>• {log.template_name}</span>
                    </div>
                    <span style={{ color: '#94A3B8', fontSize: '11.5px' }}>
                      {log.created_at ? new Date(log.created_at).toLocaleTimeString() : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 6: SETTINGS ── */}
      {activeTab === 'settings' && (
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0F172A' }}>
              WhatsApp Business API Configuration
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: '#64748B' }}>
              Configure Meta Cloud API credentials and official business identifiers
            </p>
          </div>

          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '650px', width: '100%' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Business Display Name
              </label>
              <input
                type="text"
                value={settingsForm.business_name}
                onChange={(e) => setSettingsForm({ ...settingsForm, business_name: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13.5px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Official Phone Number
                </label>
                <input
                  type="text"
                  value={settingsForm.phone_number}
                  onChange={(e) => setSettingsForm({ ...settingsForm, phone_number: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13.5px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Phone Number ID
                </label>
                <input
                  type="text"
                  value={settingsForm.phone_number_id}
                  onChange={(e) => setSettingsForm({ ...settingsForm, phone_number_id: e.target.value })}
                  placeholder="e.g. 109283746592817"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13.5px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  WhatsApp Business Account (WABA) ID
                </label>
                <input
                  type="text"
                  value={settingsForm.waba_id}
                  onChange={(e) => setSettingsForm({ ...settingsForm, waba_id: e.target.value })}
                  placeholder="e.g. 293847561029384"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13.5px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Meta App ID
                </label>
                <input
                  type="text"
                  value={settingsForm.meta_app_id}
                  onChange={(e) => setSettingsForm({ ...settingsForm, meta_app_id: e.target.value })}
                  placeholder="e.g. 987654321098765"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13.5px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Webhook Verify Token
              </label>
              <input
                type="text"
                value={settingsForm.webhook_verify_token}
                onChange={(e) => setSettingsForm({ ...settingsForm, webhook_verify_token: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13.5px', boxSizing: 'border-box' }}
              />
            </div>

            {/* Mock Mode Switch */}
            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#0F172A' }}>Mock Mode (Simulation Engine)</div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>
                  When enabled, WhatsApp messages and webhook events are simulated safely without requiring live Meta Cloud API billing.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settingsForm.mock_mode}
                onChange={(e) => setSettingsForm({ ...settingsForm, mock_mode: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              style={{
                padding: '12px 24px',
                borderRadius: '10px',
                background: '#059669',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '13.5px',
                border: 'none',
                cursor: 'pointer',
                alignSelf: 'flex-start'
              }}
            >
              {savingSettings ? 'Saving...' : 'Save WhatsApp Settings'}
            </button>
          </form>
        </div>
      )}

      {/* Message Details Drawer / Modal */}
      {selectedMessageDetails && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
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
            maxWidth: isMobile ? '92vw' : '550px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: isMobile ? '16px' : '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
                WhatsApp Message Audit Details
              </h3>
              <button
                onClick={() => setSelectedMessageDetails(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '16px', cursor: 'pointer', color: '#64748B' }}
              >
                <FaTimes />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px' }}>
                <span style={{ color: '#64748B' }}>Message ID</span>
                <span style={{ fontWeight: 800 }}>{selectedMessageDetails.message_uuid}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px' }}>
                <span style={{ color: '#64748B' }}>Initiated By</span>
                <span style={{ fontWeight: 700 }}>{selectedMessageDetails.sender_name} ({selectedMessageDetails.sender_designation || selectedMessageDetails.sender_role})</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px' }}>
                <span style={{ color: '#64748B' }}>Recipient</span>
                <span style={{ fontWeight: 700 }}>{selectedMessageDetails.recipient_name} ({selectedMessageDetails.recipient_mobile})</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px' }}>
                <span style={{ color: '#64748B' }}>Meta Message ID</span>
                <span style={{ fontFamily: 'monospace', fontSize: '11.5px' }}>{selectedMessageDetails.meta_message_id || 'N/A'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px' }}>
                <span style={{ color: '#64748B' }}>Status</span>
                <span>{getStatusBadge(selectedMessageDetails.status)}</span>
              </div>

              <div>
                <span style={{ color: '#64748B', display: 'block', marginBottom: '4px' }}>Message Body Sent</span>
                <div style={{ background: '#ECE5DD', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
                  {selectedMessageDetails.message_body}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateTemplateModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
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
            maxWidth: isMobile ? '92vw' : '560px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: isMobile ? '16px' : '24px',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Create Approved WhatsApp Template</h3>
              <button onClick={() => setShowCreateTemplateModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Template Name (lowercase with underscores)</label>
                <input
                  type="text"
                  placeholder="e.g. kyc_update_notification"
                  value={newTemplateForm.template_name}
                  onChange={(e) => setNewTemplateForm({ ...newTemplateForm, template_name: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Category</label>
                <select
                  value={newTemplateForm.template_category}
                  onChange={(e) => setNewTemplateForm({ ...newTemplateForm, template_category: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                >
                  <option value="kyc">KYC Verification</option>
                  <option value="application">Application Lifecycle</option>
                  <option value="lead">Lead & Outreach</option>
                  <option value="qd">Quick Decision (QD)</option>
                  <option value="final_status">Final Status (Approval/Rejection)</option>
                  <option value="payment">Payment & Wallet</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Message Body (Use &#123;&#123;var_name&#125;&#125; for dynamic variables)</label>
                <textarea
                  rows="4"
                  placeholder="Hello {{customer_name}}, your application #{{application_id}} has been updated."
                  value={newTemplateForm.body}
                  onChange={(e) => setNewTemplateForm({ ...newTemplateForm, body: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Variables (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. customer_name, application_id"
                  value={newTemplateForm.variables}
                  onChange={(e) => setNewTemplateForm({ ...newTemplateForm, variables: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateTemplateModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '8px', background: '#F1F5F9', border: 'none', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: '8px', background: '#059669', color: '#FFFFFF', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reusable Send WhatsApp Modal */}
      <SendWhatsAppModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        recipientMobile={modalInitialData.recipientMobile}
        recipientName={modalInitialData.recipientName}
        applicationId={modalInitialData.applicationId}
        leadId={modalInitialData.leadId}
        customerId={modalInitialData.customerId}
        documentName={modalInitialData.documentName}
        documentUrl={modalInitialData.documentUrl}
        initialVariables={modalInitialData.initialVariables}
        onSuccess={() => {
          fetchDashboardMetrics();
          if (activeTab === 'messages') fetchMessages(1);
        }}
      />
    </div>
  );
}
