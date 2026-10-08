import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FaCommentDots,
  FaPaperPlane,
  FaHistory,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaCloudUploadAlt,
  FaFileCsv,
  FaFileExcel,
  FaFilePdf,
  FaCalendarAlt,
  FaClock,
  FaShieldAlt,
  FaDownload,
  FaEye,
  FaArrowRight,
  FaArrowLeft,
  FaSync,
  FaFilter,
  FaSearch,
  FaCheck,
  FaTimes,
  FaPhoneAlt,
  FaInfoCircle,
} from 'react-icons/fa';
import api from '../../../services/api';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuthStore } from '../../../app/store/authStore';

export default function BulkSmsDashboard({ defaultTab }) {
  const { C, isDark } = useTheme();
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  const navigate = useNavigate();

  // Determine initial tab from route or prop
  const getInitialTab = () => {
    if (defaultTab) return defaultTab;
    if (location.pathname.includes('/templates')) return 'templates';
    if (location.pathname.includes('/campaigns')) return 'campaigns';
    return 'create';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());

  useEffect(() => {
    if (location.pathname.includes('/templates')) setActiveTab('templates');
    else if (location.pathname.includes('/campaigns')) setActiveTab('campaigns');
  }, [location.pathname]);

  // ── Top Metrics ─────────────────────────────────────────────────────────────
  const [stats, setStats] = useState({
    total_campaigns: 0,
    messages_sent: 0,
    delivered: 0,
    failed: 0,
  });
  const [loadingStats, setLoadingStats] = useState(false);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await api.get('/admin/bulk-sms/stats');
      if (res.data?.success && res.data?.data) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to load stats, using fallback', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // ── Step-Based Wizard State ─────────────────────────────────────────────────
  // Step 1: Upload & Details | Step 2: Template | Step 3: Preview | Step 4: Schedule | Step 5: Review
  const [currentStep, setCurrentStep] = useState(1);
  const [campaignName, setCampaignName] = useState('');

  // File Upload State
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedMobileColumn, setSelectedMobileColumn] = useState('');
  const [previewFilter, setPreviewFilter] = useState('ALL'); // ALL | Valid | Invalid | Duplicate
  const fileInputRef = useRef(null);

  // Template Selection State
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [variableMappings, setVariableMappings] = useState({});

  // Schedule State
  const [scheduleType, setScheduleType] = useState('SEND_NOW'); // SEND_NOW | SCHEDULE_LATER
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  // Review & Confirmation State
  const [complianceConfirmed, setComplianceConfirmed] = useState(false);
  const [isSubmittingCampaign, setIsSubmittingCampaign] = useState(false);
  const [createdCampaignInfo, setCreatedCampaignInfo] = useState(null);

  // ── Campaign History State ──────────────────────────────────────────────────
  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [campaignSearch, setCampaignSearch] = useState('');
  const [campaignStatusFilter, setCampaignStatusFilter] = useState('ALL');
  const [campaignPagination, setCampaignPagination] = useState({ page: 1, total: 0, totalPages: 1 });

  // Campaign Details & Delivery Report Modal State
  const [selectedCampaignForModal, setSelectedCampaignForModal] = useState(null);
  const [modalRecipients, setModalRecipients] = useState([]);
  const [modalRecipientsLoading, setModalRecipientsLoading] = useState(false);
  const [modalRecipientsFilter, setModalRecipientsFilter] = useState('ALL');
  const [modalRecipientsPage, setModalRecipientsPage] = useState(1);
  const [modalBreakdown, setModalBreakdown] = useState(null);

  // Template Preview Modal
  const [previewingTemplate, setPreviewingTemplate] = useState(null);

  // ── Fetch Templates ─────────────────────────────────────────────────────────
  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await api.get('/admin/bulk-sms/templates');
      if (res.data?.success && res.data?.data) {
        setTemplates(res.data.data);
        if (!selectedTemplate && res.data.data.length > 0) {
          const approved = res.data.data.find((t) => t.approval_status === 'APPROVED');
          if (approved) setSelectedTemplate(approved);
        }
      }
    } catch (err) {
      console.warn('Failed to load templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // ── Fetch Campaigns ─────────────────────────────────────────────────────────
  const fetchCampaigns = async (page = 1) => {
    setLoadingCampaigns(true);
    try {
      const res = await api.get('/admin/bulk-sms/campaigns', {
        params: {
          page,
          limit: 10,
          status: campaignStatusFilter,
          search: campaignSearch,
        },
      });
      if (res.data?.success) {
        setCampaigns(res.data.data || []);
        if (res.data.pagination) setCampaignPagination(res.data.pagination);
      }
    } catch (err) {
      console.warn('Failed to load campaigns:', err);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'campaigns') {
      fetchCampaigns(1);
    }
  }, [activeTab, campaignStatusFilter, campaignSearch]);

  // ── Handle File Upload & Extraction ─────────────────────────────────────────
  const handleFileUpload = async (file, overrideColumn = null) => {
    if (!file) return;
    setUploadError('');
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    if (overrideColumn) {
      formData.append('manual_column', overrideColumn);
    }

    try {
      const res = await api.post('/admin/bulk-sms/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success && res.data?.data) {
        setUploadedFile(file);
        setUploadResult(res.data.data);
        setSelectedMobileColumn(res.data.data.detected_mobile_column || '');
      } else {
        setUploadError(res.data?.message || 'Failed to process file.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'File processing failed.';
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  // Re-process with manual column change
  const handleColumnChange = (newCol) => {
    setSelectedMobileColumn(newCol);
    if (uploadedFile) {
      handleFileUpload(uploadedFile, newCol);
    }
  };

  // ── Real-Time Message Preview Interpolation ─────────────────────────────────
  const renderMessageContent = () => {
    if (!selectedTemplate) return 'Select a template to view preview.';
    let text = selectedTemplate.content || '';

    // Sample data from first valid recipient or sensible defaults
    const sampleRec = uploadResult?.valid_recipients?.[0] || {};
    const sampleVars = sampleRec.variables || {};

    const availableVars = selectedTemplate.variables || [];
    availableVars.forEach((v) => {
      const mappedCol = variableMappings[v] || v;
      const sampleVal = sampleVars[mappedCol] || (v === 'customer_name' ? 'Rahul' : v === 'loan_amount' ? '5,00,000' : 'HDFC BANK');
      const regex = new RegExp(`{{${v}}}`, 'g');
      text = text.replace(regex, sampleVal);
    });

    return text;
  };

  // ── Submit Campaign Creation ────────────────────────────────────────────────
  const handleSendOrScheduleCampaign = async () => {
    if (!campaignName.trim()) {
      alert('Please enter a campaign name.');
      setCurrentStep(1);
      return;
    }

    if (!uploadResult || !uploadResult.valid_recipients || uploadResult.valid_recipients.length === 0) {
      alert('No valid recipients found. Please upload a valid recipient file.');
      setCurrentStep(1);
      return;
    }

    if (!selectedTemplate) {
      alert('Please select an approved SMS template.');
      setCurrentStep(2);
      return;
    }

    if (!complianceConfirmed) {
      alert('Please accept the DLT and consent compliance confirmation.');
      return;
    }

    let scheduledAt = null;
    if (scheduleType === 'SCHEDULE_LATER') {
      if (!scheduleDate || !scheduleTime) {
        alert('Please specify both scheduled date and time.');
        setCurrentStep(4);
        return;
      }
      scheduledAt = new Date(`${scheduleDate}T${scheduleTime}:00`);
      if (scheduledAt <= new Date()) {
        alert('Scheduled time must be in the future.');
        setCurrentStep(4);
        return;
      }
    }

    setIsSubmittingCampaign(true);

    try {
      const payload = {
        campaign_name: campaignName.trim(),
        template_id: selectedTemplate.id,
        sender_id: selectedTemplate.sender_id || 'GHARKP',
        schedule_type: scheduleType,
        scheduled_at: scheduledAt ? scheduledAt.toISOString() : null,
        recipients: uploadResult.valid_recipients,
        file_name: uploadResult.file_name,
        file_size: uploadResult.file_size,
        compliance_confirmed: true,
      };

      const res = await api.post('/admin/bulk-sms/campaigns', payload);

      if (res.data?.success && res.data?.data) {
        setCreatedCampaignInfo(res.data.data);
        fetchStats();
      } else {
        alert(res.data?.message || 'Failed to submit campaign.');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Campaign creation failed.';
      alert(`Error: ${errMsg}`);
    } finally {
      setIsSubmittingCampaign(false);
    }
  };

  // Reset Wizard
  const handleResetWizard = () => {
    setCurrentStep(1);
    setCampaignName('');
    setUploadedFile(null);
    setUploadResult(null);
    setSelectedTemplate(templates.find((t) => t.approval_status === 'APPROVED') || null);
    setVariableMappings({});
    setScheduleType('SEND_NOW');
    setScheduleDate('');
    setScheduleTime('');
    setComplianceConfirmed(false);
    setCreatedCampaignInfo(null);
  };

  // ── Open Campaign Details Modal ─────────────────────────────────────────────
  const openCampaignDetailsModal = async (campaign) => {
    setSelectedCampaignForModal(campaign);
    setModalRecipientsLoading(true);
    setModalRecipientsFilter('ALL');
    setModalRecipientsPage(1);

    try {
      const [reportRes, recRes] = await Promise.all([
        api.get(`/admin/bulk-sms/campaigns/${campaign.id}/report`),
        api.get(`/admin/bulk-sms/campaigns/${campaign.id}/recipients`, { params: { page: 1, limit: 30 } }),
      ]);

      if (reportRes.data?.success) {
        setModalBreakdown(reportRes.data.data.breakdown);
      }
      if (recRes.data?.success) {
        setModalRecipients(recRes.data.data);
      }
    } catch (err) {
      console.warn('Error loading campaign details modal:', err);
    } finally {
      setModalRecipientsLoading(false);
    }
  };

  // Export CSV Report
  const handleExportCsv = async (campaignId) => {
    try {
      const res = await api.get(`/admin/bulk-sms/campaigns/${campaignId}/export`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `campaign_${campaignId}_report.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export delivery report.');
    }
  };

  // Filtered Preview Records in Step 1
  const filteredPreview = (uploadResult?.preview || []).filter((r) => {
    if (previewFilter === 'ALL') return true;
    return r.status.toLowerCase() === previewFilter.toLowerCase();
  });

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1440px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      {/* ── Page Header ───────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4F46E5',
              }}
            >
              <FaCommentDots size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '700', color: C.text, margin: 0, letterSpacing: '-0.02em' }}>
                Bulk SMS
              </h1>
              <p style={{ fontSize: '13px', color: C.textMid, margin: '2px 0 0' }}>
                Send and manage approved DLT SMS campaigns with verified carrier delivery
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => {
              fetchStats();
              if (activeTab === 'campaigns') fetchCampaigns(1);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              borderRadius: '9px',
              border: `1px solid ${C.border}`,
              backgroundColor: C.card,
              color: C.text,
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            <FaSync size={12} className={loadingStats ? 'fa-spin' : ''} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => {
              handleResetWizard();
              setActiveTab('create');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              borderRadius: '9px',
              border: 'none',
              backgroundColor: '#4F46E5',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
            }}
          >
            <FaPaperPlane size={13} />
            New Campaign
          </button>
        </div>
      </div>

      {/* ── Top Statistics Cards ──────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        {/* Total Campaigns */}
        <div
          style={{
            backgroundColor: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: '14px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#EEF2FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4F46E5',
            }}
          >
            <FaPaperPlane size={20} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: C.textMid, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Campaigns
            </div>
            <div style={{ fontSize: '26px', fontWeight: '700', color: C.text, marginTop: '2px' }}>
              {stats.total_campaigns.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Messages Sent */}
        <div
          style={{
            backgroundColor: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: '14px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563EB',
            }}
          >
            <FaCommentDots size={20} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: C.textMid, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Messages Sent
            </div>
            <div style={{ fontSize: '26px', fontWeight: '700', color: C.text, marginTop: '2px' }}>
              {stats.messages_sent.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Delivered */}
        <div
          style={{
            backgroundColor: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: '14px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#ECFDF5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669',
            }}
          >
            <FaCheckCircle size={20} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: C.textMid, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Delivered
            </div>
            <div style={{ fontSize: '26px', fontWeight: '700', color: '#059669', marginTop: '2px' }}>
              {stats.delivered.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Failed */}
        <div
          style={{
            backgroundColor: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: '14px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#FEF2F2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#DC2626',
            }}
          >
            <FaTimesCircle size={20} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: C.textMid, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Failed
            </div>
            <div style={{ fontSize: '26px', fontWeight: '700', color: stats.failed > 0 ? '#DC2626' : C.text, marginTop: '2px' }}>
              {stats.failed.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Tab Navigation Bar ───────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          borderBottom: `1px solid ${C.border}`,
          marginBottom: '24px',
          gap: '8px',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('create')}
          style={{
            padding: '12px 20px',
            fontSize: '14px',
            fontWeight: '600',
            color: activeTab === 'create' ? '#4F46E5' : C.textMid,
            border: 'none',
            borderBottom: activeTab === 'create' ? '2px solid #4F46E5' : '2px solid transparent',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <FaPaperPlane size={14} />
          Create Campaign
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('campaigns');
            fetchCampaigns(1);
          }}
          style={{
            padding: '12px 20px',
            fontSize: '14px',
            fontWeight: '600',
            color: activeTab === 'campaigns' ? '#4F46E5' : C.textMid,
            border: 'none',
            borderBottom: activeTab === 'campaigns' ? '2px solid #4F46E5' : '2px solid transparent',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <FaHistory size={14} />
          Campaign History
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('templates')}
          style={{
            padding: '12px 20px',
            fontSize: '14px',
            fontWeight: '600',
            color: activeTab === 'templates' ? '#4F46E5' : C.textMid,
            border: 'none',
            borderBottom: activeTab === 'templates' ? '2px solid #4F46E5' : '2px solid transparent',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <FaShieldAlt size={14} />
          Approved Templates
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: CREATE BULK SMS CAMPAIGN WIZARD                                  */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'create' && (
        <div>
          {/* Success Result View */}
          {createdCampaignInfo ? (
            <div
              style={{
                backgroundColor: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: '16px',
                padding: '40px',
                textAlign: 'center',
                maxWidth: '680px',
                margin: '0 auto',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#ECFDF5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                }}
              >
                <FaCheckCircle size={32} />
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: '700', color: C.text, margin: '0 0 8px' }}>
                Campaign Created & Queued
              </h2>
              <p style={{ fontSize: '14px', color: C.textMid, margin: '0 0 24px', lineHeight: '1.5' }}>
                Your campaign <strong>{createdCampaignInfo.campaign_name}</strong> has been created.
                Recipients are being processed asynchronously through the MSG91 carrier queue.
              </p>

              <div
                style={{
                  backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '28px',
                  textAlign: 'left',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '14px',
                }}
              >
                <div>
                  <span style={{ fontSize: '12px', color: C.textMid }}>Campaign ID:</span>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: C.text, fontFamily: 'monospace' }}>
                    {createdCampaignInfo.campaign_id}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: C.textMid }}>Status:</span>
                  <div>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: '#FEF3C7',
                        color: '#B45309',
                      }}
                    >
                      {createdCampaignInfo.status}
                    </span>
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: C.textMid }}>Total Valid Recipients:</span>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#4F46E5' }}>
                    {createdCampaignInfo.valid_recipients.toLocaleString()}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: C.textMid }}>Estimated Messages:</span>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: C.text }}>
                    {createdCampaignInfo.estimated_messages.toLocaleString()}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    handleResetWizard();
                    setActiveTab('campaigns');
                    fetchCampaigns(1);
                  }}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '8px',
                    backgroundColor: '#4F46E5',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  View in Campaign History
                </button>
                <button
                  type="button"
                  onClick={handleResetWizard}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '8px',
                    backgroundColor: 'transparent',
                    color: C.text,
                    border: `1px solid ${C.border}`,
                    fontWeight: '500',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  Create Another Campaign
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Step Indicator Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: '14px',
                  padding: '16px 24px',
                  marginBottom: '24px',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                {[
                  { step: 1, label: 'Upload Recipients' },
                  { step: 2, label: 'Select Template' },
                  { step: 3, label: 'Message Preview' },
                  { step: 4, label: 'Schedule' },
                  { step: 5, label: 'Final Review' },
                ].map((s, idx) => (
                  <div
                    key={s.step}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: currentStep > s.step ? 'pointer' : 'default',
                    }}
                    onClick={() => {
                      if (currentStep > s.step) setCurrentStep(s.step);
                    }}
                  >
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor:
                          currentStep === s.step
                            ? '#4F46E5'
                            : currentStep > s.step
                            ? '#059669'
                            : isDark
                            ? '#374151'
                            : '#E5E7EB',
                        color: currentStep >= s.step ? '#FFFFFF' : C.textMid,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                        fontWeight: '600',
                      }}
                    >
                      {currentStep > s.step ? <FaCheck size={11} /> : s.step}
                    </div>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: currentStep === s.step ? '600' : '500',
                        color: currentStep === s.step ? C.text : C.textMid,
                      }}
                    >
                      {s.label}
                    </span>
                    {idx < 4 && (
                      <div
                        style={{
                          width: '24px',
                          height: '2px',
                          backgroundColor: currentStep > s.step ? '#059669' : C.border,
                          margin: '0 4px',
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* ────────────────────────────────────────────────────────────── */}
              {/* STEP 1: CAMPAIGN DETAILS & FILE UPLOAD                         */}
              {/* ────────────────────────────────────────────────────────────── */}
              {currentStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Campaign Name Field */}
                  <div
                    style={{
                      backgroundColor: C.card,
                      border: `1px solid ${C.border}`,
                      borderRadius: '14px',
                      padding: '24px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    }}
                  >
                    <label
                      htmlFor="campaign-name-input"
                      style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: C.text, marginBottom: '8px' }}
                    >
                      Campaign Name <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      id="campaign-name-input"
                      type="text"
                      placeholder="e.g. HDFC Loan Campaign - October 2026"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '9px',
                        border: `1px solid ${C.border}`,
                        backgroundColor: C.inputBg,
                        color: C.text,
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <div style={{ fontSize: '12px', color: C.textMid, marginTop: '6px' }}>
                      A descriptive identifier for tracking this campaign in history and audit reports.
                    </div>
                  </div>

                  {/* Recipient File Upload Card */}
                  <div
                    style={{
                      backgroundColor: C.card,
                      border: `1px solid ${C.border}`,
                      borderRadius: '14px',
                      padding: '24px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', color: C.text, margin: 0 }}>
                        Upload Recipient File
                      </h3>
                      <span style={{ fontSize: '12px', color: C.textMid }}>
                        Supported formats: <strong>CSV, XLSX, PDF</strong> (Max: 10MB)
                      </span>
                    </div>

                    {/* Drag & Drop Box */}
                    <div
                      onDragEnter={(e) => {
                        e.preventDefault();
                        setDragActive(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setDragActive(false);
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        border: `2px dashed ${dragActive ? '#4F46E5' : C.border}`,
                        borderRadius: '12px',
                        padding: '36px 20px',
                        textAlign: 'center',
                        backgroundColor: dragActive
                          ? 'rgba(79, 70, 229, 0.05)'
                          : isDark
                          ? '#1F2937'
                          : '#FAFAFA',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.xlsx,.xls,.pdf"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                      />
                      <div
                        style={{
                          width: '52px',
                          height: '52px',
                          borderRadius: '50%',
                          backgroundColor: '#EEF2FF',
                          color: '#4F46E5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 14px',
                        }}
                      >
                        <FaCloudUploadAlt size={26} />
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: C.text, marginBottom: '4px' }}>
                        Drag & Drop your file here
                      </div>
                      <div style={{ fontSize: '13px', color: C.textMid, marginBottom: '14px' }}>
                        or click to browse from your device
                      </div>
                      <button
                        type="button"
                        style={{
                          padding: '8px 18px',
                          borderRadius: '8px',
                          backgroundColor: '#4F46E5',
                          color: '#FFFFFF',
                          border: 'none',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        Choose File
                      </button>
                    </div>

                    {isUploading && (
                      <div style={{ textAlign: 'center', padding: '16px', color: '#4F46E5', fontSize: '13px' }}>
                        <FaSync className="fa-spin" style={{ marginRight: '8px' }} />
                        Processing and normalizing mobile numbers...
                      </div>
                    )}

                    {uploadError && (
                      <div
                        style={{
                          marginTop: '16px',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          backgroundColor: '#FEF2F2',
                          color: '#B91C1C',
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <FaExclamationTriangle size={14} />
                        {uploadError}
                      </div>
                    )}

                    {/* Upload Summary Statistics */}
                    {uploadResult && (
                      <div style={{ marginTop: '24px' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
                            padding: '14px 18px',
                            borderRadius: '10px',
                            marginBottom: '16px',
                            border: `1px solid ${C.border}`,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {uploadResult.file_name.endsWith('.pdf') ? (
                              <FaFilePdf size={22} color="#DC2626" />
                            ) : uploadResult.file_name.endsWith('.csv') ? (
                              <FaFileCsv size={22} color="#059669" />
                            ) : (
                              <FaFileExcel size={22} color="#16A34A" />
                            )}
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: '600', color: C.text }}>
                                {uploadResult.file_name}
                              </div>
                              <div style={{ fontSize: '12px', color: C.textMid }}>
                                {(uploadResult.file_size / 1024).toFixed(1)} KB
                              </div>
                            </div>
                          </div>

                          {/* Manual Mobile Column Mapping Selector */}
                          {uploadResult.columns && uploadResult.columns.length > 1 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '13px', color: C.textMid }}>Mobile Column:</span>
                              <select
                                value={selectedMobileColumn}
                                onChange={(e) => handleColumnChange(e.target.value)}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  border: `1px solid ${C.border}`,
                                  backgroundColor: C.card,
                                  color: C.text,
                                  fontSize: '13px',
                                }}
                              >
                                {uploadResult.columns.map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        {/* Metrics Grid */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                            gap: '12px',
                            marginBottom: '20px',
                          }}
                        >
                          <div style={{ padding: '12px', borderRadius: '8px', border: `1px solid ${C.border}`, textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', color: C.textMid }}>Total Records</div>
                            <div style={{ fontSize: '18px', fontWeight: '700', color: C.text, marginTop: '2px' }}>
                              {uploadResult.total_records.toLocaleString()}
                            </div>
                          </div>
                          <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid #BBF7D0', backgroundColor: '#F0FDF4', textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', color: '#166534' }}>Valid Numbers</div>
                            <div style={{ fontSize: '18px', fontWeight: '700', color: '#16A34A', marginTop: '2px' }}>
                              {uploadResult.valid_numbers.toLocaleString()}
                            </div>
                          </div>
                          <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid #FECACA', backgroundColor: '#FEF2F2', textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', color: '#991B1B' }}>Invalid Numbers</div>
                            <div style={{ fontSize: '18px', fontWeight: '700', color: '#DC2626', marginTop: '2px' }}>
                              {uploadResult.invalid_numbers.toLocaleString()}
                            </div>
                          </div>
                          <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid #FED7AA', backgroundColor: '#FFF7ED', textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', color: '#9A3412' }}>Duplicate Numbers</div>
                            <div style={{ fontSize: '18px', fontWeight: '700', color: '#EA580C', marginTop: '2px' }}>
                              {uploadResult.duplicate_numbers.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {/* Recipient Preview Table */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: '600', color: C.text, margin: 0 }}>
                              Recipient Preview (Masked for Security)
                            </h4>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {['ALL', 'Valid', 'Invalid', 'Duplicate'].map((f) => (
                                <button
                                  key={f}
                                  type="button"
                                  onClick={() => setPreviewFilter(f)}
                                  style={{
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    border: `1px solid ${previewFilter === f ? '#4F46E5' : C.border}`,
                                    backgroundColor: previewFilter === f ? '#EEF2FF' : C.card,
                                    color: previewFilter === f ? '#4F46E5' : C.textMid,
                                    cursor: 'pointer',
                                  }}
                                >
                                  {f}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div style={{ overflowX: 'auto', border: `1px solid ${C.border}`, borderRadius: '8px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                              <thead>
                                <tr style={{ backgroundColor: isDark ? '#1F2937' : '#F9FAFB', borderBottom: `1px solid ${C.border}` }}>
                                  <th style={{ padding: '10px 14px', textAlign: 'left', color: C.textMid, width: '48px' }}>#</th>
                                  <th style={{ padding: '10px 14px', textAlign: 'left', color: C.textMid }}>Mobile Number</th>
                                  <th style={{ padding: '10px 14px', textAlign: 'left', color: C.textMid }}>Recipient Name</th>
                                  <th style={{ padding: '10px 14px', textAlign: 'left', color: C.textMid }}>Validation Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredPreview.slice(0, 10).map((r, i) => (
                                  <tr key={r.id || i} style={{ borderBottom: `1px solid ${C.border}` }}>
                                    <td style={{ padding: '10px 14px', color: C.textMid }}>{r.id || i + 1}</td>
                                    <td style={{ padding: '10px 14px', fontWeight: '600', color: C.text, fontFamily: 'monospace' }}>
                                      {r.mobile_number}
                                    </td>
                                    <td style={{ padding: '10px 14px', color: C.text }}>{r.name || '—'}</td>
                                    <td style={{ padding: '10px 14px' }}>
                                      <span
                                        style={{
                                          padding: '3px 8px',
                                          borderRadius: '10px',
                                          fontSize: '11px',
                                          fontWeight: '600',
                                          backgroundColor:
                                            r.status === 'Valid'
                                              ? '#ECFDF5'
                                              : r.status === 'Duplicate'
                                              ? '#FFF7ED'
                                              : '#FEF2F2',
                                          color:
                                            r.status === 'Valid'
                                              ? '#059669'
                                              : r.status === 'Duplicate'
                                              ? '#EA580C'
                                              : '#DC2626',
                                        }}
                                      >
                                        {r.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                                {filteredPreview.length === 0 && (
                                  <tr>
                                    <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: C.textMid }}>
                                      No records match the filter: {previewFilter}
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                          {uploadResult.preview?.length > 10 && (
                            <div style={{ fontSize: '12px', color: C.textMid, marginTop: '8px', textAlign: 'right' }}>
                              Showing first 10 of {uploadResult.preview.length} sample preview records
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Navigation Button */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      disabled={!campaignName.trim() || !uploadResult || uploadResult.valid_numbers === 0}
                      onClick={() => setCurrentStep(2)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 28px',
                        borderRadius: '9px',
                        backgroundColor:
                          !campaignName.trim() || !uploadResult || uploadResult.valid_numbers === 0
                            ? isDark
                              ? '#374151'
                              : '#E5E7EB'
                            : '#4F46E5',
                        color:
                          !campaignName.trim() || !uploadResult || uploadResult.valid_numbers === 0
                            ? C.textLight
                            : '#FFFFFF',
                        border: 'none',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor:
                          !campaignName.trim() || !uploadResult || uploadResult.valid_numbers === 0
                            ? 'not-allowed'
                            : 'pointer',
                      }}
                    >
                      Next: Select Template
                      <FaArrowRight size={13} />
                    </button>
                  </div>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────────── */}
              {/* STEP 2: APPROVED SMS TEMPLATE SELECTION                       */}
              {/* ────────────────────────────────────────────────────────────── */}
              {currentStep === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div
                    style={{
                      backgroundColor: C.card,
                      border: `1px solid ${C.border}`,
                      borderRadius: '14px',
                      padding: '24px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div style={{ marginBottom: '18px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', color: C.text, margin: '0 0 4px' }}>
                        Select Approved SMS Template
                      </h3>
                      <p style={{ fontSize: '13px', color: C.textMid, margin: 0 }}>
                        Per Indian telecom regulations, only pre-registered DLT and approved MSG91 templates can be dispatched. Content is locked and cannot be edited.
                      </p>
                    </div>

                    {/* Template Cards Grid */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                        gap: '16px',
                        marginBottom: '24px',
                      }}
                    >
                      {templates.map((tpl) => {
                        const isSelected = selectedTemplate?.id === tpl.id;
                        const isApproved = tpl.approval_status === 'APPROVED';

                        return (
                          <div
                            key={tpl.id}
                            onClick={() => {
                              if (isApproved) setSelectedTemplate(tpl);
                            }}
                            style={{
                              border: `2px solid ${isSelected ? '#4F46E5' : C.border}`,
                              borderRadius: '12px',
                              padding: '18px',
                              backgroundColor: isSelected
                                ? 'rgba(79, 70, 229, 0.03)'
                                : C.card,
                              cursor: isApproved ? 'pointer' : 'not-allowed',
                              opacity: isApproved ? 1 : 0.6,
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                <h4 style={{ fontSize: '15px', fontWeight: '600', color: C.text, margin: 0 }}>
                                  {tpl.name}
                                </h4>
                                <span
                                  style={{
                                    padding: '3px 8px',
                                    borderRadius: '10px',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    backgroundColor: isApproved ? '#ECFDF5' : '#FEF3C7',
                                    color: isApproved ? '#059669' : '#B45309',
                                  }}
                                >
                                  {tpl.approval_status}
                                </span>
                              </div>

                              <div style={{ fontSize: '12px', color: C.textMid, marginBottom: '6px' }}>
                                Sender ID: <strong>{tpl.sender_id || 'GHARKP'}</strong>
                              </div>
                              <div style={{ fontSize: '12px', color: C.textMid, marginBottom: '12px' }}>
                                MSG91 Template ID: <span style={{ fontFamily: 'monospace' }}>{tpl.provider_template_id}</span>
                              </div>

                              <div
                                style={{
                                  fontSize: '12px',
                                  color: C.text,
                                  backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
                                  padding: '10px',
                                  borderRadius: '6px',
                                  marginBottom: '14px',
                                  maxHeight: '100px',
                                  overflowY: 'auto',
                                  whiteSpace: 'pre-line',
                                  lineHeight: '1.4',
                                }}
                              >
                                {tpl.content}
                              </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span
                                style={{
                                  fontSize: '11px',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  backgroundColor: isDark ? '#374151' : '#F3F4F6',
                                  color: C.textMid,
                                }}
                              >
                                {tpl.template_type || 'Promotional'}
                              </span>

                              <button
                                type="button"
                                disabled={!isApproved}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isApproved) setSelectedTemplate(tpl);
                                }}
                                style={{
                                  padding: '6px 14px',
                                  borderRadius: '6px',
                                  backgroundColor: isSelected ? '#4F46E5' : 'transparent',
                                  color: isSelected ? '#FFFFFF' : '#4F46E5',
                                  border: isSelected ? 'none' : '1px solid #4F46E5',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  cursor: isApproved ? 'pointer' : 'not-allowed',
                                }}
                              >
                                {isSelected ? 'Selected' : 'Use Template'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Template Variable Mapping UI */}
                    {selectedTemplate && selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                      <div
                        style={{
                          borderTop: `1px solid ${C.border}`,
                          paddingTop: '20px',
                        }}
                      >
                        <h4 style={{ fontSize: '14px', fontWeight: '600', color: C.text, margin: '0 0 10px' }}>
                          Map Template Variables
                        </h4>
                        <p style={{ fontSize: '12px', color: C.textMid, margin: '0 0 14px' }}>
                          Align variables in the approved message with the headers from your uploaded file:
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                          {selectedTemplate.variables.map((variable) => (
                            <div key={variable} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span
                                style={{
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  color: '#4F46E5',
                                  minWidth: '130px',
                                  fontFamily: 'monospace',
                                }}
                              >
                                {`{{${variable}}}`}
                              </span>
                              <span style={{ color: C.textMid }}>→</span>
                              <select
                                value={variableMappings[variable] || ''}
                                onChange={(e) =>
                                  setVariableMappings({
                                    ...variableMappings,
                                    [variable]: e.target.value,
                                  })
                                }
                                style={{
                                  flex: 1,
                                  padding: '8px 12px',
                                  borderRadius: '6px',
                                  border: `1px solid ${C.border}`,
                                  backgroundColor: C.card,
                                  color: C.text,
                                  fontSize: '13px',
                                }}
                              >
                                <option value="">Auto-Detect ({variable})</option>
                                {(uploadResult?.columns || []).map((col) => (
                                  <option key={col} value={col}>
                                    {col}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Navigation Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 22px',
                        borderRadius: '9px',
                        border: `1px solid ${C.border}`,
                        backgroundColor: C.card,
                        color: C.text,
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                      }}
                    >
                      <FaArrowLeft size={13} />
                      Back
                    </button>

                    <button
                      type="button"
                      disabled={!selectedTemplate}
                      onClick={() => setCurrentStep(3)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 28px',
                        borderRadius: '9px',
                        backgroundColor: selectedTemplate ? '#4F46E5' : isDark ? '#374151' : '#E5E7EB',
                        color: selectedTemplate ? '#FFFFFF' : C.textLight,
                        border: 'none',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: selectedTemplate ? 'pointer' : 'not-allowed',
                      }}
                    >
                      Next: Preview Message
                      <FaArrowRight size={13} />
                    </button>
                  </div>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────────── */}
              {/* STEP 3: MESSAGE PREVIEW                                        */}
              {/* ────────────────────────────────────────────────────────────── */}
              {currentStep === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div
                    style={{
                      backgroundColor: C.card,
                      border: `1px solid ${C.border}`,
                      borderRadius: '14px',
                      padding: '24px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div style={{ marginBottom: '20px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', color: C.text, margin: '0 0 4px' }}>
                        SMS Preview
                      </h3>
                      <p style={{ fontSize: '13px', color: C.textMid, margin: 0 }}>
                        Live rendering of how the SMS will look on the recipient&apos;s phone with interpolated customer data.
                      </p>
                    </div>

                    {/* Realistic Mobile Device Simulator */}
                    <div
                      style={{
                        maxWidth: '380px',
                        margin: '0 auto 24px',
                        backgroundColor: '#1E293B',
                        borderRadius: '36px',
                        padding: '16px 14px',
                        boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
                        border: '6px solid #334155',
                      }}
                    >
                      {/* Phone Speaker Notch */}
                      <div
                        style={{
                          width: '100px',
                          height: '6px',
                          backgroundColor: '#475569',
                          borderRadius: '10px',
                          margin: '0 auto 12px',
                        }}
                      />

                      {/* Phone Screen Area */}
                      <div
                        style={{
                          backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                          borderRadius: '24px',
                          minHeight: '340px',
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                        }}
                      >
                        {/* SMS Header */}
                        <div
                          style={{
                            textAlign: 'center',
                            borderBottom: '1px solid #E2E8F0',
                            paddingBottom: '10px',
                            marginBottom: '14px',
                          }}
                        >
                          <div style={{ fontSize: '13px', fontWeight: '700', color: isDark ? '#FFFFFF' : '#1E293B' }}>
                            {selectedTemplate?.sender_id || 'GHARKP'}
                          </div>
                          <div style={{ fontSize: '10px', color: '#64748B' }}>
                            Text Message • Today {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>

                        {/* SMS Message Bubble */}
                        <div
                          style={{
                            backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                            borderRadius: '16px',
                            padding: '14px',
                            fontSize: '13px',
                            color: isDark ? '#F8FAFC' : '#0F172A',
                            lineHeight: '1.5',
                            whiteSpace: 'pre-line',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                          }}
                        >
                          {renderMessageContent()}
                        </div>

                        {/* DLT Notice */}
                        <div
                          style={{
                            fontSize: '10px',
                            color: '#64748B',
                            textAlign: 'center',
                            marginTop: '16px',
                            padding: '4px',
                          }}
                        >
                          DLT Template: {selectedTemplate?.provider_template_id}
                        </div>
                      </div>
                    </div>

                    {/* DLT Regulatory Compliance Alert */}
                    <div
                      style={{
                        backgroundColor: '#EFF6FF',
                        border: '1px solid #BFDBFE',
                        borderRadius: '10px',
                        padding: '14px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        color: '#1E40AF',
                        fontSize: '13px',
                      }}
                    >
                      <FaShieldAlt size={18} />
                      <div>
                        <strong>Telecom DLT Verification:</strong> The template text, sender header (
                        {selectedTemplate?.sender_id}), and approved URLs are locked. Modifications at send time are
                        strictly blocked to comply with TRAI regulations.
                      </div>
                    </div>
                  </div>

                  {/* Navigation Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 22px',
                        borderRadius: '9px',
                        border: `1px solid ${C.border}`,
                        backgroundColor: C.card,
                        color: C.text,
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                      }}
                    >
                      <FaArrowLeft size={13} />
                      Back
                    </button>

                    <button
                      type="button"
                      onClick={() => setCurrentStep(4)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 28px',
                        borderRadius: '9px',
                        backgroundColor: '#4F46E5',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      Next: Campaign Schedule
                      <FaArrowRight size={13} />
                    </button>
                  </div>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────────── */}
              {/* STEP 4: CAMPAIGN SCHEDULE                                      */}
              {/* ────────────────────────────────────────────────────────────── */}
              {currentStep === 4 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div
                    style={{
                      backgroundColor: C.card,
                      border: `1px solid ${C.border}`,
                      borderRadius: '14px',
                      padding: '24px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div style={{ marginBottom: '20px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', color: C.text, margin: '0 0 4px' }}>
                        Campaign Schedule
                      </h3>
                      <p style={{ fontSize: '13px', color: C.textMid, margin: 0 }}>
                        Choose whether to dispatch this campaign immediately or schedule it for a specific date and time.
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '540px' }}>
                      {/* Send Now Radio Card */}
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '14px',
                          padding: '16px',
                          borderRadius: '12px',
                          border: `2px solid ${scheduleType === 'SEND_NOW' ? '#4F46E5' : C.border}`,
                          backgroundColor: scheduleType === 'SEND_NOW' ? 'rgba(79, 70, 229, 0.03)' : C.card,
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="radio"
                          name="scheduleOption"
                          value="SEND_NOW"
                          checked={scheduleType === 'SEND_NOW'}
                          onChange={() => setScheduleType('SEND_NOW')}
                          style={{ marginTop: '3px' }}
                        />
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: C.text }}>Send Now</div>
                          <div style={{ fontSize: '13px', color: C.textMid, marginTop: '2px' }}>
                            Dispatch to valid recipients immediately upon review confirmation.
                          </div>
                        </div>
                      </label>

                      {/* Schedule Later Radio Card */}
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '14px',
                          padding: '16px',
                          borderRadius: '12px',
                          border: `2px solid ${scheduleType === 'SCHEDULE_LATER' ? '#4F46E5' : C.border}`,
                          backgroundColor: scheduleType === 'SCHEDULE_LATER' ? 'rgba(79, 70, 229, 0.03)' : C.card,
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="radio"
                          name="scheduleOption"
                          value="SCHEDULE_LATER"
                          checked={scheduleType === 'SCHEDULE_LATER'}
                          onChange={() => setScheduleType('SCHEDULE_LATER')}
                          style={{ marginTop: '3px' }}
                        />
                        <div style={{ width: '100%' }}>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: C.text }}>Schedule Later</div>
                          <div style={{ fontSize: '13px', color: C.textMid, marginTop: '2px' }}>
                            Set a planned broadcast date and time (IST).
                          </div>

                          {scheduleType === 'SCHEDULE_LATER' && (
                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '12px',
                                marginTop: '14px',
                              }}
                            >
                              <div>
                                <label style={{ display: 'block', fontSize: '12px', color: C.textMid, marginBottom: '4px' }}>
                                  Date
                                </label>
                                <input
                                  type="date"
                                  min={new Date().toISOString().split('T')[0]}
                                  value={scheduleDate}
                                  onChange={(e) => setScheduleDate(e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    border: `1px solid ${C.border}`,
                                    backgroundColor: C.card,
                                    color: C.text,
                                    fontSize: '13px',
                                    boxSizing: 'border-box',
                                  }}
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '12px', color: C.textMid, marginBottom: '4px' }}>
                                  Time (IST)
                                </label>
                                <input
                                  type="time"
                                  value={scheduleTime}
                                  onChange={(e) => setScheduleTime(e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    border: `1px solid ${C.border}`,
                                    backgroundColor: C.card,
                                    color: C.text,
                                    fontSize: '13px',
                                    boxSizing: 'border-box',
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Navigation Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 22px',
                        borderRadius: '9px',
                        border: `1px solid ${C.border}`,
                        backgroundColor: C.card,
                        color: C.text,
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                      }}
                    >
                      <FaArrowLeft size={13} />
                      Back
                    </button>

                    <button
                      type="button"
                      disabled={scheduleType === 'SCHEDULE_LATER' && (!scheduleDate || !scheduleTime)}
                      onClick={() => setCurrentStep(5)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 28px',
                        borderRadius: '9px',
                        backgroundColor:
                          scheduleType === 'SCHEDULE_LATER' && (!scheduleDate || !scheduleTime)
                            ? isDark
                              ? '#374151'
                              : '#E5E7EB'
                            : '#4F46E5',
                        color:
                          scheduleType === 'SCHEDULE_LATER' && (!scheduleDate || !scheduleTime)
                            ? C.textLight
                            : '#FFFFFF',
                        border: 'none',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor:
                          scheduleType === 'SCHEDULE_LATER' && (!scheduleDate || !scheduleTime)
                            ? 'not-allowed'
                            : 'pointer',
                      }}
                    >
                      Next: Final Review
                      <FaArrowRight size={13} />
                    </button>
                  </div>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────────── */}
              {/* STEP 5: FINAL REVIEW & SEND                                   */}
              {/* ────────────────────────────────────────────────────────────── */}
              {currentStep === 5 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div
                    style={{
                      backgroundColor: C.card,
                      border: `1px solid ${C.border}`,
                      borderRadius: '14px',
                      padding: '24px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div style={{ marginBottom: '20px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '700', color: C.text, margin: '0 0 4px' }}>
                        Campaign Review
                      </h3>
                      <p style={{ fontSize: '13px', color: C.textMid, margin: 0 }}>
                        Review campaign parameters and confirm authorization before queueing for dispatch.
                      </p>
                    </div>

                    {/* Summary Parameters Table */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                        gap: '16px',
                        backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
                        borderRadius: '12px',
                        padding: '20px',
                        marginBottom: '24px',
                        border: `1px solid ${C.border}`,
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '12px', color: C.textMid }}>Campaign Name</span>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: C.text, marginTop: '2px' }}>
                          {campaignName}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '12px', color: C.textMid }}>Selected Template</span>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: C.text, marginTop: '2px' }}>
                          {selectedTemplate?.name}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '12px', color: C.textMid }}>Sender ID</span>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#4F46E5', marginTop: '2px' }}>
                          {selectedTemplate?.sender_id || 'GHARKP'}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '12px', color: C.textMid }}>Total Uploaded Records</span>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: C.text, marginTop: '2px' }}>
                          {uploadResult?.total_records?.toLocaleString()}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '12px', color: C.textMid }}>Valid Recipients (Eligible)</span>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: '#059669', marginTop: '2px' }}>
                          {uploadResult?.valid_numbers?.toLocaleString()}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '12px', color: C.textMid }}>Invalid / Duplicates Excluded</span>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#DC2626', marginTop: '2px' }}>
                          {((uploadResult?.invalid_numbers || 0) + (uploadResult?.duplicate_numbers || 0)).toLocaleString()}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '12px', color: C.textMid }}>Estimated Messages</span>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: '#4F46E5', marginTop: '2px' }}>
                          {uploadResult?.valid_numbers?.toLocaleString()}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '12px', color: C.textMid }}>Schedule Mode</span>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: C.text, marginTop: '2px' }}>
                          {scheduleType === 'SEND_NOW' ? 'Send Immediately' : `${scheduleDate} at ${scheduleTime} (IST)`}
                        </div>
                      </div>
                    </div>

                    {/* Mandatory Compliance Checkbox */}
                    <div
                      style={{
                        padding: '16px',
                        borderRadius: '10px',
                        border: '1px solid #E0E7FF',
                        backgroundColor: '#EEF2FF',
                        marginBottom: '24px',
                      }}
                    >
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={complianceConfirmed}
                          onChange={(e) => setComplianceConfirmed(e.target.checked)}
                          style={{
                            marginTop: '3px',
                            width: '16px',
                            height: '16px',
                            accentColor: '#4F46E5',
                          }}
                        />
                        <div style={{ fontSize: '13px', color: '#1E293B', lineHeight: '1.5' }}>
                          <strong>Regulatory Authorization Confirmation:</strong> I confirm that this campaign uses an
                          approved SMS template registered with TRAI/DLT and that the recipient list is authorized for
                          this communication. Messages will be queued and sent via MSG91.
                        </div>
                      </label>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(4)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '12px 22px',
                          borderRadius: '9px',
                          border: `1px solid ${C.border}`,
                          backgroundColor: C.card,
                          color: C.text,
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer',
                        }}
                      >
                        <FaArrowLeft size={13} />
                        Back
                      </button>

                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={handleResetWizard}
                          style={{
                            padding: '12px 20px',
                            borderRadius: '9px',
                            border: `1px solid ${C.border}`,
                            backgroundColor: 'transparent',
                            color: C.textMid,
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          disabled={!complianceConfirmed || isSubmittingCampaign}
                          onClick={handleSendOrScheduleCampaign}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 32px',
                            borderRadius: '9px',
                            backgroundColor:
                              !complianceConfirmed || isSubmittingCampaign
                                ? isDark
                                  ? '#374151'
                                  : '#E5E7EB'
                                : '#4F46E5',
                            color: !complianceConfirmed || isSubmittingCampaign ? C.textLight : '#FFFFFF',
                            border: 'none',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: !complianceConfirmed || isSubmittingCampaign ? 'not-allowed' : 'pointer',
                            boxShadow:
                              complianceConfirmed && !isSubmittingCampaign
                                ? '0 4px 12px rgba(79, 70, 229, 0.3)'
                                : 'none',
                          }}
                        >
                          {isSubmittingCampaign ? (
                            <>
                              <FaSync className="fa-spin" size={13} />
                              Queueing Campaign...
                            </>
                          ) : scheduleType === 'SEND_NOW' ? (
                            <>
                              <FaPaperPlane size={13} />
                              Send Campaign
                            </>
                          ) : (
                            <>
                              <FaCalendarAlt size={13} />
                              Schedule Campaign
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: CAMPAIGN HISTORY                                                 */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'campaigns' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Filters Bar */}
          <div
            style={{
              backgroundColor: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: '12px',
              padding: '16px 20px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
                <FaSearch
                  size={13}
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: C.textMid }}
                />
                <input
                  type="text"
                  placeholder="Search campaign name or template..."
                  value={campaignSearch}
                  onChange={(e) => setCampaignSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 34px',
                    borderRadius: '8px',
                    border: `1px solid ${C.border}`,
                    backgroundColor: C.inputBg,
                    color: C.text,
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <select
                value={campaignStatusFilter}
                onChange={(e) => setCampaignStatusFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${C.border}`,
                  backgroundColor: C.card,
                  color: C.text,
                  fontSize: '13px',
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="PROCESSING">Processing</option>
                <option value="QUEUED">Queued</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => fetchCampaigns(1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: `1px solid ${C.border}`,
                backgroundColor: C.card,
                color: C.text,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              <FaSync size={11} className={loadingCampaigns ? 'fa-spin' : ''} />
              Refresh Table
            </button>
          </div>

          {/* Campaigns History Table */}
          <div
            style={{
              backgroundColor: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: '14px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: isDark ? '#1F2937' : '#F9FAFB', borderBottom: `1px solid ${C.border}` }}>
                    <th style={{ padding: '12px 18px', textAlign: 'left', color: C.textMid, fontWeight: '600' }}>
                      Campaign Name
                    </th>
                    <th style={{ padding: '12px 18px', textAlign: 'left', color: C.textMid, fontWeight: '600' }}>
                      Template
                    </th>
                    <th style={{ padding: '12px 18px', textAlign: 'right', color: C.textMid, fontWeight: '600' }}>
                      Recipients
                    </th>
                    <th style={{ padding: '12px 18px', textAlign: 'right', color: C.textMid, fontWeight: '600' }}>
                      Sent
                    </th>
                    <th style={{ padding: '12px 18px', textAlign: 'right', color: C.textMid, fontWeight: '600' }}>
                      Delivered
                    </th>
                    <th style={{ padding: '12px 18px', textAlign: 'right', color: C.textMid, fontWeight: '600' }}>
                      Failed
                    </th>
                    <th style={{ padding: '12px 18px', textAlign: 'center', color: C.textMid, fontWeight: '600' }}>
                      Status
                    </th>
                    <th style={{ padding: '12px 18px', textAlign: 'left', color: C.textMid, fontWeight: '600' }}>
                      Created At
                    </th>
                    <th style={{ padding: '12px 18px', textAlign: 'center', color: C.textMid, fontWeight: '600' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => {
                    const statusColor =
                      c.status === 'COMPLETED'
                        ? { bg: '#ECFDF5', text: '#059669' }
                        : c.status === 'PROCESSING'
                        ? { bg: '#EFF6FF', text: '#2563EB' }
                        : c.status === 'QUEUED'
                        ? { bg: '#FEF3C7', text: '#B45309' }
                        : c.status === 'SCHEDULED'
                        ? { bg: '#F3E8FF', text: '#7E22CE' }
                        : { bg: '#F3F4F6', text: '#4B5563' };

                    return (
                      <tr key={c.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: '14px 18px', fontWeight: '600', color: C.text }}>
                          {c.campaign_name}
                        </td>
                        <td style={{ padding: '14px 18px', color: C.textMid }}>
                          {c.template_name || 'HDFC Pre-Approved Loan'}
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: '600', color: C.text }}>
                          {c.total_recipients?.toLocaleString()}
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'right', color: C.text }}>
                          {c.sent_count?.toLocaleString()}
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: '600', color: '#059669' }}>
                          {c.delivered_count?.toLocaleString()}
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'right', color: c.failed_count > 0 ? '#DC2626' : C.textMid }}>
                          {c.failed_count?.toLocaleString()}
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '700',
                              backgroundColor: statusColor.bg,
                              color: statusColor.text,
                            }}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', color: C.textMid, fontSize: '12px' }}>
                          {new Date(c.created_at).toLocaleString([], {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              type="button"
                              onClick={() => openCampaignDetailsModal(c)}
                              title="View Details"
                              style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: `1px solid ${C.border}`,
                                backgroundColor: C.card,
                                color: '#4F46E5',
                                fontSize: '12px',
                                cursor: 'pointer',
                              }}
                            >
                              <FaEye size={12} style={{ marginRight: '4px' }} />
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => handleExportCsv(c.id)}
                              title="Export CSV Report"
                              style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: `1px solid ${C.border}`,
                                backgroundColor: C.card,
                                color: '#059669',
                                fontSize: '12px',
                                cursor: 'pointer',
                              }}
                            >
                              <FaDownload size={11} style={{ marginRight: '4px' }} />
                              Report
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {campaigns.length === 0 && (
                    <tr>
                      <td colSpan="9" style={{ padding: '36px', textAlign: 'center', color: C.textMid }}>
                        No campaigns found. Click &quot;New Campaign&quot; to create your first bulk SMS campaign.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: APPROVED SMS TEMPLATES CATALOG                                   */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'templates' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              backgroundColor: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: '14px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: C.text, margin: '0 0 4px' }}>
                  Registered DLT / MSG91 Templates
                </h3>
                <p style={{ fontSize: '13px', color: C.textMid, margin: 0 }}>
                  Pre-approved templates with verified telecom headers and carrier routing.
                </p>
              </div>
            </div>

            <div style={{ overflowX: 'auto', border: `1px solid ${C.border}`, borderRadius: '10px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: isDark ? '#1F2937' : '#F9FAFB', borderBottom: `1px solid ${C.border}` }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: C.textMid }}>Template Name</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: C.textMid }}>Sender ID</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: C.textMid }}>MSG91 Template ID</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: C.textMid }}>Type</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', color: C.textMid }}>Approval Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: C.textMid }}>Created Date</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', color: C.textMid }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((t) => (
                    <tr key={t.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '14px 16px', fontWeight: '600', color: C.text }}>{t.name}</td>
                      <td style={{ padding: '14px 16px', color: '#4F46E5', fontWeight: '600' }}>
                        {t.sender_id || 'GHARKP'}
                      </td>
                      <td style={{ padding: '14px 16px', fontFamily: 'monospace', color: C.textMid }}>
                        {t.provider_template_id}
                      </td>
                      <td style={{ padding: '14px 16px', color: C.textMid }}>{t.template_type || 'Promotional'}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '700',
                            backgroundColor:
                              t.approval_status === 'APPROVED'
                                ? '#ECFDF5'
                                : t.approval_status === 'REJECTED'
                                ? '#FEF2F2'
                                : '#FEF3C7',
                            color:
                              t.approval_status === 'APPROVED'
                                ? '#059669'
                                : t.approval_status === 'REJECTED'
                                ? '#DC2626'
                                : '#B45309',
                          }}
                        >
                          {t.approval_status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: C.textMid }}>
                        {new Date(t.created_at || Date.now()).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setPreviewingTemplate(t)}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '6px',
                              border: `1px solid ${C.border}`,
                              backgroundColor: C.card,
                              color: C.text,
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}
                          >
                            Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTemplate(t);
                              setActiveTab('create');
                              setCurrentStep(1);
                            }}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '6px',
                              backgroundColor: '#4F46E5',
                              color: '#FFFFFF',
                              border: 'none',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                            }}
                          >
                            Use Template
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: CAMPAIGN DETAILS & DELIVERY REPORT                               */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {selectedCampaignForModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: C.card,
              borderRadius: '16px',
              maxWidth: '840px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: C.text, margin: '0 0 4px' }}>
                  {selectedCampaignForModal.campaign_name}
                </h3>
                <span style={{ fontSize: '13px', color: C.textMid }}>
                  Campaign ID: <span style={{ fontFamily: 'monospace' }}>{selectedCampaignForModal.id}</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCampaignForModal(null)}
                style={{
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  color: C.textMid,
                  padding: '4px',
                }}
              >
                <FaTimes size={18} />
              </button>
            </div>

            {/* Campaign Summary Grid */}
            <div
              style={{
                backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
                padding: '16px 20px',
                borderRadius: '12px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                border: `1px solid ${C.border}`,
              }}
            >
              <div>
                <span style={{ fontSize: '11px', color: C.textMid }}>Template</span>
                <div style={{ fontSize: '13px', fontWeight: '600', color: C.text }}>
                  {selectedCampaignForModal.template_name}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: C.textMid }}>Sender ID</span>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#4F46E5' }}>
                  {selectedCampaignForModal.sender_id || 'GHARKP'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: C.textMid }}>Total Recipients</span>
                <div style={{ fontSize: '13px', fontWeight: '600', color: C.text }}>
                  {selectedCampaignForModal.total_recipients?.toLocaleString()}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: C.textMid }}>Status</span>
                <div>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: '700',
                      backgroundColor:
                        selectedCampaignForModal.status === 'COMPLETED' ? '#ECFDF5' : '#FEF3C7',
                      color:
                        selectedCampaignForModal.status === 'COMPLETED' ? '#059669' : '#B45309',
                    }}
                  >
                    {selectedCampaignForModal.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery Stats Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center' }}>
              <div style={{ padding: '10px', border: `1px solid ${C.border}`, borderRadius: '8px' }}>
                <span style={{ fontSize: '11px', color: C.textMid }}>Sent</span>
                <div style={{ fontSize: '16px', fontWeight: '700', color: C.text }}>
                  {selectedCampaignForModal.sent_count?.toLocaleString() || 0}
                </div>
              </div>
              <div style={{ padding: '10px', border: '1px solid #BBF7D0', backgroundColor: '#F0FDF4', borderRadius: '8px' }}>
                <span style={{ fontSize: '11px', color: '#166534' }}>Delivered</span>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#16A34A' }}>
                  {selectedCampaignForModal.delivered_count?.toLocaleString() || 0}
                </div>
              </div>
              <div style={{ padding: '10px', border: '1px solid #FECACA', backgroundColor: '#FEF2F2', borderRadius: '8px' }}>
                <span style={{ fontSize: '11px', color: '#991B1B' }}>Failed</span>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#DC2626' }}>
                  {selectedCampaignForModal.failed_count?.toLocaleString() || 0}
                </div>
              </div>
              <div style={{ padding: '10px', border: `1px solid ${C.border}`, borderRadius: '8px' }}>
                <span style={{ fontSize: '11px', color: C.textMid }}>Pending</span>
                <div style={{ fontSize: '16px', fontWeight: '700', color: C.text }}>
                  {selectedCampaignForModal.pending_count?.toLocaleString() || 0}
                </div>
              </div>
            </div>

            {/* Recipient Level Report Table */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: C.text, margin: 0 }}>
                  Recipient Delivery Log
                </h4>
                <button
                  type="button"
                  onClick={() => handleExportCsv(selectedCampaignForModal.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    backgroundColor: '#059669',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  <FaDownload size={11} />
                  Export Report (CSV)
                </button>
              </div>

              <div style={{ maxHeight: '240px', overflowY: 'auto', border: `1px solid ${C.border}`, borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: isDark ? '#1F2937' : '#F9FAFB', borderBottom: `1px solid ${C.border}` }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: C.textMid }}>Mobile</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: C.textMid }}>Status</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: C.textMid }}>Message ID</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: C.textMid }}>Sent At</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: C.textMid }}>Delivered At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalRecipients.map((rec, i) => (
                      <tr key={rec.id || i} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: '8px 12px', fontWeight: '600', color: C.text, fontFamily: 'monospace' }}>
                          {rec.masked_mobile || rec.mobile_number}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '8px',
                              fontSize: '11px',
                              fontWeight: '600',
                              backgroundColor:
                                rec.status === 'DELIVERED'
                                  ? '#ECFDF5'
                                  : rec.status === 'SENT'
                                  ? '#EFF6FF'
                                  : rec.status === 'FAILED'
                                  ? '#FEF2F2'
                                  : '#FEF3C7',
                              color:
                                rec.status === 'DELIVERED'
                                  ? '#059669'
                                  : rec.status === 'SENT'
                                  ? '#2563EB'
                                  : rec.status === 'FAILED'
                                  ? '#DC2626'
                                  : '#B45309',
                            }}
                          >
                            {rec.status}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', color: C.textMid, fontFamily: 'monospace' }}>
                          {rec.msg91_message_id || 'N/A'}
                        </td>
                        <td style={{ padding: '8px 12px', color: C.textMid }}>
                          {rec.sent_at ? new Date(rec.sent_at).toLocaleTimeString() : '—'}
                        </td>
                        <td style={{ padding: '8px 12px', color: C.textMid }}>
                          {rec.delivered_at ? new Date(rec.delivered_at).toLocaleTimeString() : '—'}
                        </td>
                      </tr>
                    ))}
                    {modalRecipients.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: C.textMid }}>
                          {modalRecipientsLoading ? 'Loading delivery log...' : 'No recipient records found.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Close Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setSelectedCampaignForModal(null)}
                style={{
                  padding: '9px 20px',
                  borderRadius: '8px',
                  backgroundColor: C.card,
                  border: `1px solid ${C.border}`,
                  color: C.text,
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: TEMPLATE PREVIEW                                                 */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {previewingTemplate && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: C.card,
              borderRadius: '16px',
              maxWidth: '560px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: C.text, margin: '0 0 4px' }}>
                  {previewingTemplate.name}
                </h3>
                <span style={{ fontSize: '12px', color: C.textMid }}>
                  Sender ID: <strong>{previewingTemplate.sender_id || 'GHARKP'}</strong> • MSG91 ID:{' '}
                  <span style={{ fontFamily: 'monospace' }}>{previewingTemplate.provider_template_id}</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewingTemplate(null)}
                style={{
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  color: C.textMid,
                  padding: '4px',
                }}
              >
                <FaTimes size={18} />
              </button>
            </div>

            <div
              style={{
                backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
                padding: '16px',
                borderRadius: '12px',
                fontSize: '13px',
                color: C.text,
                lineHeight: '1.5',
                whiteSpace: 'pre-line',
                border: `1px solid ${C.border}`,
              }}
            >
              {previewingTemplate.content}
            </div>

            {previewingTemplate.preview_url && (
              <div style={{ fontSize: '12px', color: C.textMid }}>
                Destination URL: <strong style={{ color: '#4F46E5' }}>{previewingTemplate.preview_url}</strong>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setPreviewingTemplate(null)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: `1px solid ${C.border}`,
                  backgroundColor: C.card,
                  color: C.text,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedTemplate(previewingTemplate);
                  setPreviewingTemplate(null);
                  setActiveTab('create');
                  setCurrentStep(1);
                }}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  backgroundColor: '#4F46E5',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Use Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
