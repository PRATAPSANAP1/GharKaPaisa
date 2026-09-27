import React, { useState, useEffect } from 'react';
import { 
  FaWhatsapp, FaChartLine, FaEnvelopeOpenText, FaFileAlt, FaCheckDouble, 
  FaExclamationCircle, FaSearch, FaFilter, FaSync, FaCog, FaPlus, 
  FaShieldAlt, FaPaperPlane, FaTimes, FaGlobe, FaServer, FaCheckCircle, 
  FaTimesCircle, FaClock, FaEye
} from 'react-icons/fa';
import api from '../../../services/api';
import { useAuthStore } from '../../../app/store/authStore';
import SendWhatsAppModal from '../../../components/whatsapp/SendWhatsAppModal';

export default function SuperAdminWhatsApp() {
  const { user } = useAuthStore();
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

  // Settings Data
  const [settings, setSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    business_name: 'GharKaPaisa',
    phone_number: '+91 99999 99999',
    phone_number_id: '',
    waba_id: '',
    meta_app_id: '',
    webhook_verify_token: 'gharkapaisa_meta_webhook_secret_2026',
    mock_mode: true
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

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  useEffect(() => {
    if (activeTab === 'messages') fetchMessages(1);
    else if (activeTab === 'templates') fetchTemplates();
    else if (activeTab === 'settings') fetchSettings();
    else if (activeTab === 'webhooks') fetchWebhookLogs();
  }, [activeTab]);

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
      gap: '20px',
      padding: '24px',
      fontFamily: "'Inter', sans-serif",
      background: '#F8FAFC',
      minHeight: 'calc(100vh - 90px)'
    }}>
      {/* Top Banner Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        padding: '24px 28px',
        borderRadius: '16px',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '14px',
            background: '#059669', color: '#FFFFFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.4)'
          }}>
            <FaWhatsapp />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, letterSpacing: '-0.3px', color: '#FFFFFF' }}>
              WhatsApp Business Management
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94A3B8' }}>
              Centralized GharKaPaisa official number communication, role-based dispatch & Meta Cloud API audit logs
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
              gap: '8px',
              boxShadow: '0 2px 10px rgba(5, 150, 105, 0.3)'
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
        overflowX: 'auto'
      }}>
        {[
          { key: 'dashboard', label: 'Dashboard', icon: <FaChartLine /> },
          { key: 'messages', label: 'All Messages & Audit Log', icon: <FaEnvelopeOpenText /> },
          { key: 'templates', label: 'Approved Templates', icon: <FaFileAlt /> },
          { key: 'reports', label: 'Delivery Reports', icon: <FaCheckDouble /> },
          { key: 'webhooks', label: 'Webhook & Diagnostics', icon: <FaServer /> },
          { key: 'settings', label: 'WhatsApp Settings', icon: <FaCog /> }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === tab.key ? '#FFFFFF' : 'transparent',
              color: activeTab === tab.key ? '#059669' : '#64748B',
              fontWeight: 800,
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: activeTab === tab.key ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              borderBottom: activeTab === tab.key ? '2px solid #059669' : 'none',
              transition: 'all 0.15s ease'
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

      {/* ── TAB 3: TEMPLATES ── */}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0F172A' }}>
                Approved WhatsApp Templates
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: '#64748B' }}>
                Central templates approved for GharKaPaisa customer and application notifications
              </p>
            </div>

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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {templates.map(tpl => (
              <div
                key={tpl.id}
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{
                      background: '#059669', color: '#FFFFFF',
                      padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase'
                    }}>
                      {tpl.template_category}
                    </span>
                    <span style={{ fontSize: '11px', color: '#15803D', fontWeight: 800 }}>
                      ● {tpl.status}
                    </span>
                  </div>

                  <h4 style={{ margin: '0 0 6px', fontSize: '14.5px', fontWeight: 800, color: '#0F172A' }}>
                    {tpl.template_name}
                  </h4>

                  <p style={{ margin: 0, fontSize: '12.5px', color: '#334155', lineHeight: '1.5', background: '#FFFFFF', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    {tpl.body}
                  </p>
                </div>

                {tpl.variables && tpl.variables.length > 0 && (
                  <div style={{ fontSize: '11px', color: '#64748B' }}>
                    Variables: <strong>{Array.isArray(tpl.variables) ? tpl.variables.join(', ') : ''}</strong>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: DELIVERY REPORTS ── */}
      {activeTab === 'reports' && (
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0F172A' }}>
                Delivery Success Rate & Performance Reports
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: '#64748B' }}>
                Track delivery metrics and dispatch summary reports directly via WhatsApp
              </p>
            </div>

            <button
              onClick={() => openSendModalWithData({
                recipient_name: 'Management / Stakeholder',
                recipient_mobile: '',
                document_name: `GharKaPaisa_WhatsApp_Delivery_Report_${new Date().toISOString().slice(0,10)}.pdf`,
                document_url: 'https://gharkapaisa.in/api/v1/whatsapp/delivery-report-download'
              })}
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
                gap: '6px',
                boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)'
              }}
            >
              <FaPaperPlane size={11} /> Share Report via WhatsApp
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 800, color: '#334155' }}>
                Delivery Breakdown
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

            <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 800, color: '#334155' }}>
                Compliance & Verification
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748B', lineHeight: '1.6' }}>
                All outgoing messages are routed strictly through the official GharKaPaisa WhatsApp Business account via Meta Cloud API. Full internal audit trails preserve the initiating operator identity while customers receive authorized, branded communications.
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

          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '650px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Business Display Name
              </label>
              <input
                type="text"
                value={settingsForm.business_name}
                onChange={(e) => setSettingsForm({ ...settingsForm, business_name: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13.5px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Official Phone Number
                </label>
                <input
                  type="text"
                  value={settingsForm.phone_number}
                  onChange={(e) => setSettingsForm({ ...settingsForm, phone_number: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13.5px' }}
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
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13.5px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  WhatsApp Business Account (WABA) ID
                </label>
                <input
                  type="text"
                  value={settingsForm.waba_id}
                  onChange={(e) => setSettingsForm({ ...settingsForm, waba_id: e.target.value })}
                  placeholder="e.g. 293847561029384"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13.5px' }}
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
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13.5px' }}
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
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13.5px' }}
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
            maxWidth: '550px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
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
                <div style={{ background: '#ECE5DD', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', whiteSpace: 'pre-line' }}>
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
            maxWidth: '560px',
            padding: '24px'
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
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Category</label>
                <select
                  value={newTemplateForm.template_category}
                  onChange={(e) => setNewTemplateForm({ ...newTemplateForm, template_category: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
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
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Variables (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. customer_name, application_id"
                  value={newTemplateForm.variables}
                  onChange={(e) => setNewTemplateForm({ ...newTemplateForm, variables: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
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
