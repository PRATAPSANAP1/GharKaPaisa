import React, { useState, useEffect } from 'react';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { 
  MdAdd, MdPerson, MdEmail, MdPhone, MdCheckCircle, 
  MdPendingActions, MdClose, MdContentCopy,
  MdOutlineQrCode2, MdOutlineWhatsapp, MdMonetizationOn, 
  MdTrendingUp, MdDeviceHub, MdList, MdHistory, MdShare,
  MdLeaderboard, MdAnalytics, MdBlock, MdSearch, MdInfo,
  MdAccountBalance, MdTimeline, MdPeople, MdFilterList,
  MdCloudDownload, MdSettings, MdChevronRight, MdExpandMore,
  MdEdit, MdSave, MdSms, MdCampaign, MdOutlineSend, MdRefresh,
  MdShield, MdArrowForward
} from 'react-icons/md';
import api from '../../../services/api';
import { useAuthStore } from '../../../app/store/authStore';
import { FiUsers, FiUserCheck, FiUserPlus, FiSend } from 'react-icons/fi';

export default function PartnerTeam() {
  const { C } = useTheme();
  const S = makeS(C);
  const user = useAuthStore((state) => state.user);
  const { t } = useTranslation();

  const partnerId = user?.partner_id || user?.PartnerId;
  const partnerCode = user?.partner_code || user?.PartnerCode || '';

  // Tabs: 'dashboard' | 'invitations' | 'campaigns' | 'tree' | 'activity'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Data states
  const [dashboardData, setDashboardData] = useState(null);
  const [referralInfo, setReferralInfo] = useState(null);
  const [teamList, setTeamList] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [treeNodes, setTreeNodes] = useState([]);
  
  // Custom Referral Message State
  const [isEditingMsg, setIsEditingMsg] = useState(false);
  const [customMsg, setCustomMsg] = useState('');
  const [savingMsg, setSavingMsg] = useState(false);

  // Direct Invitations State
  const [invitations, setInvitations] = useState([]);
  const [invForm, setInvForm] = useState({
    recipient_name: '',
    recipient_email: '',
    recipient_mobile: '',
    invite_type: 'EMAIL'
  });
  const [invSubmitting, setInvSubmitting] = useState(false);
  const [invMsg, setInvMsg] = useState('');

  // Referral Campaigns State
  const [campaigns, setCampaigns] = useState([]);
  const [showCampModal, setShowCampModal] = useState(false);
  const [campForm, setCampForm] = useState({
    campaign_name: '',
    platform: 'WhatsApp',
    budget: '',
    target: '',
    bonus_type: 'FIXED',
    bonus_amount: ''
  });
  const [campSubmitting, setCampSubmitting] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [kycFilter, setKycFilter] = useState('');
  const [joinedFilter, setJoinedFilter] = useState('');

  // QR Modal
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrResult, setQrResult] = useState(null);
  const [loadingQr, setLoadingQr] = useState(false);

  // Copy Feedback
  const [copied, setCopied] = useState(false);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 360° Child Detail Slide-Over Drawer
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [childDetail, setChildDetail] = useState(null);
  const [loadingChild, setLoadingChild] = useState(false);
  const [activeDrawerTab, setActiveDrawerTab] = useState('overview');

  // Fetch Dashboard & Referral Info
  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [dashRes, refRes] = await Promise.all([
        api.get('/partner/team-dashboard'),
        api.get('/partner/referral')
      ]);
      if (dashRes.data?.success) {
        setDashboardData(dashRes.data.data);
      }
      if (refRes.data?.success) {
        setReferralInfo(refRes.data.data);
        setCustomMsg(refRes.data.data.referral_message || '');
      }
    } catch (err) {
      console.error('Failed to load team metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Filtered Team Members List
  const loadTeamList = async () => {
    try {
      const res = await api.get('/partner/team-members', {
        params: {
          search: searchQuery || undefined,
          status: statusFilter || undefined,
          kyc_status: kycFilter || undefined,
          joined_period: joinedFilter || undefined
        }
      });
      if (res.data?.success) setTeamList(res.data.data);
    } catch (err) {
      console.error('Failed to load team list:', err);
    }
  };

  // Fetch Invitations
  const loadInvitations = async () => {
    try {
      const res = await api.get('/partner/invitations');
      if (res.data?.success) setInvitations(res.data.data);
    } catch (err) {
      console.error('Failed to load invitations:', err);
    }
  };

  // Fetch Campaigns
  const loadCampaigns = async () => {
    try {
      const res = await api.get('/partner/referral-campaigns');
      if (res.data?.success) setCampaigns(res.data.data);
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    }
  };

  // Fetch Tree Nodes
  const loadTreeNodes = async (parentId = null) => {
    try {
      const res = await api.get('/partner/team-tree', { params: { parent_id: parentId } });
      if (res.data?.success) setTreeNodes(res.data.data);
    } catch (err) {
      console.error('Failed to load tree hierarchy:', err);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') loadTeamList();
    if (activeTab === 'invitations') loadInvitations();
    if (activeTab === 'campaigns') loadCampaigns();
    if (activeTab === 'tree') loadTreeNodes();
  }, [activeTab, searchQuery, statusFilter, kycFilter, joinedFilter]);

  // Save Custom Referral Message
  const handleSaveMessage = async () => {
    if (!customMsg.trim()) return;
    setSavingMsg(true);
    try {
      const res = await api.put('/partner/referral-message', { referral_message: customMsg });
      if (res.data?.success) {
        setIsEditingMsg(false);
        if (referralInfo) {
          setReferralInfo({ ...referralInfo, referral_message: customMsg });
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update referral message');
    } finally {
      setSavingMsg(false);
    }
  };

  // Submit Direct Invitation Form
  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!invForm.recipient_name || (!invForm.recipient_email && !invForm.recipient_mobile)) {
      setInvMsg('Please provide recipient name and at least an email or mobile number.');
      return;
    }
    setInvSubmitting(true);
    setInvMsg('');
    try {
      const res = await api.post('/partner/invitations', invForm);
      if (res.data?.success) {
        setInvMsg('Invitation sent successfully!');
        setInvForm({ recipient_name: '', recipient_email: '', recipient_mobile: '', invite_type: 'EMAIL' });
        loadInvitations();
      }
    } catch (err) {
      setInvMsg(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setInvSubmitting(false);
    }
  };

  // Resend Invitation
  const handleResendInvite = async (invId) => {
    try {
      const res = await api.post(`/partner/invitations/${invId}/resend`);
      if (res.data?.success) {
        alert('Invitation resent successfully!');
        loadInvitations();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resend invitation');
    }
  };

  // Create Campaign
  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    if (!campForm.campaign_name) return;
    setCampSubmitting(true);
    try {
      const res = await api.post('/partner/referral-campaigns', campForm);
      if (res.data?.success) {
        setShowCampModal(false);
        setCampForm({ campaign_name: '', platform: 'WhatsApp', budget: '', target: '', bonus_type: 'FIXED', bonus_amount: '' });
        loadCampaigns();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create campaign');
    } finally {
      setCampSubmitting(false);
    }
  };

  // Open 360 Child Detail
  const handleOpenChildDetail = async (childId) => {
    setSelectedChildId(childId);
    setLoadingChild(true);
    try {
      const res = await api.get('/partner/team-members');
      if (res.data?.success) {
        const child = res.data.data.find(m => m.id === childId);
        setChildDetail({ profile: child, applications: [] });
      }
    } catch (err) {
      alert('Failed to load partner detail');
    } finally {
      setLoadingChild(false);
    }
  };

  // Open QR Modal
  const handleOpenQR = async () => {
    setShowQrModal(true);
    setLoadingQr(true);
    try {
      const res = await api.get('/partner/referral');
      if (res.data?.success) setQrResult(res.data.data);
    } catch (err) {
      alert('Failed to generate QR Code');
    } finally {
      setLoadingQr(false);
    }
  };

  const referralLink = referralInfo?.referral_link || `https://gharkapaisa.in/register?ref=${partnerCode || partnerId}`;
  const displayMsg = referralInfo?.referral_message || 'Join my team on GharKaPaisa and earn highest financial commission payouts!';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`${displayMsg}\n\nRegister here: ${referralLink}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShareSMS = () => {
    const text = encodeURIComponent(`${displayMsg} ${referralLink}`);
    window.open(`sms:?body=${text}`, '_blank');
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent('Join my partner network on GharKaPaisa');
    const body = encodeURIComponent(`${displayMsg}\n\nClick the link below to register:\n${referralLink}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const funnel = referralInfo?.funnel || {
    clicks: 0,
    registrations: dashboardData?.total_members || 0,
    kyc_approved: dashboardData?.approved_partners || 0,
    active_partners: dashboardData?.active_members || 0,
    applications: 0,
    approved_applications: 0,
    commission_earned: dashboardData?.monthly_team_earnings || 0
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 id="partner-team-title" style={{ fontSize: '24px', fontWeight: 800, color: C.text, margin: 0 }}>{t("team.titleHeader", "Refer & Earn Partner Hub")}</h2>
          <p id="partner-team-desc" style={{ fontSize: '13px', color: C.textLight, margin: '4px 0 0 0' }}>{t("team.descHeader", "Invite partners, track conversion funnels, manage direct invites, and earn 10% team override commissions.")}</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            id="partner-team-copy-referral"
            onClick={handleCopyLink}
            style={{ ...S.btn('outline'), display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px' }}
          >
            <MdContentCopy size={16} />
            <span>{copied ? t('team.copied', 'Copied!') : t('team.copyLinkText', 'Copy Link')}</span>
          </button>

          <button
            id="partner-team-share-whatsapp"
            onClick={handleShareWhatsApp}
            style={{ ...S.btn('primary'), background: '#25D366', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px' }}
          >
            <MdOutlineWhatsapp size={18} />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={handleShareSMS}
            style={{ ...S.btn('outline'), display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px' }}
          >
            <MdSms size={16} />
            <span>SMS</span>
          </button>

          <button
            onClick={handleShareEmail}
            style={{ ...S.btn('outline'), display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px' }}
          >
            <MdEmail size={16} />
            <span>Email</span>
          </button>

          <button
            id="partner-team-generate-qr"
            onClick={handleOpenQR}
            style={{ ...S.btn('primary'), background: C.teal, display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px' }}
          >
            <MdOutlineQrCode2 size={18} />
            <span>QR Code</span>
          </button>
        </div>
      </div>

      {/* Hero Banner: Custom Referral Link & Message Editing */}
      <div style={{
        ...S.card,
        padding: '24px',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(20,184,166,0.08) 0%, rgba(99,102,241,0.08) 100%)',
        border: `1.5px solid ${C.teal}30`,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: C.teal, textTransform: 'uppercase', letterSpacing: '1px' }}>Your Exclusive Referral Link</span>
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <input
                readOnly
                value={referralLink}
                style={{ ...S.input, background: C.card, fontWeight: 700, fontSize: '14px' }}
              />
              <button
                onClick={handleCopyLink}
                style={{ ...S.btn('primary'), background: C.teal, padding: '0 20px', whiteSpace: 'nowrap', borderRadius: '12px' }}
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: '280px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, textTransform: 'uppercase', letterSpacing: '1px' }}>Custom Referral Message</span>
              {!isEditingMsg ? (
                <button
                  onClick={() => setIsEditingMsg(true)}
                  style={{ background: 'none', border: 'none', color: C.teal, cursor: 'pointer', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <MdEdit size={14} /> Edit Message
                </button>
              ) : (
                <button
                  onClick={handleSaveMessage}
                  disabled={savingMsg}
                  style={{ background: 'none', border: 'none', color: C.green, cursor: 'pointer', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <MdSave size={14} /> {savingMsg ? 'Saving...' : 'Save'}
                </button>
              )}
            </div>

            {!isEditingMsg ? (
              <div style={{
                background: C.card,
                padding: '12px 14px',
                borderRadius: '12px',
                fontSize: '13px',
                color: C.text,
                marginTop: '8px',
                border: `1px solid ${C.border}`,
                fontStyle: 'italic'
              }}>
                "{displayMsg}"
              </div>
            ) : (
              <textarea
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                style={{
                  ...S.input,
                  background: C.card,
                  fontSize: '13px',
                  marginTop: '8px',
                  minHeight: '60px',
                  resize: 'vertical'
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      {(() => {
        const diff = (dashboardData?.today_joins || 0) - (dashboardData?.yesterday_joins || 0);
        const diffText = diff >= 0 ? `+${diff} vs yesterday` : `${diff} vs yesterday`;
        const isThemeDark = C.bg === '#000000';

        const cards = [
          {
            title: 'Total Team Members',
            value: dashboardData?.total_members || 0,
            subtitle: `+${dashboardData?.joined_today || 0} joined today`,
            icon: <FiUsers size={20} />,
            color: C.primary,
            bg: isThemeDark ? `${C.primary}12` : '#EEF2FF',
            iconColor: C.primary
          },
          {
            title: 'Active Team Partners',
            value: dashboardData?.active_members || 0,
            subtitle: `${dashboardData?.total_members ? Math.round((dashboardData.active_members / dashboardData.total_members) * 100) : 0}% Active Rate`,
            icon: <FiUserCheck size={20} />,
            color: C.green,
            bg: isThemeDark ? `${C.green}12` : '#ECFDF5',
            iconColor: C.green
          },
          {
            title: "Today's New Joins",
            value: dashboardData?.today_joins || 0,
            subtitle: diffText,
            icon: <FiUserPlus size={20} />,
            color: C.teal,
            bg: isThemeDark ? `${C.teal}12` : '#F0FDF4',
            iconColor: C.teal
          },
          {
            title: '10% Override Earnings',
            value: `₹${parseFloat(dashboardData?.today_team_commission || 0).toLocaleString('en-IN')}`,
            subtitle: `+₹${parseFloat(dashboardData?.monthly_team_earnings || 0).toLocaleString('en-IN')} this month`,
            icon: <MdMonetizationOn size={22} />,
            color: C.gold,
            bg: isThemeDark ? `${C.gold}12` : '#FFFBEB',
            iconColor: C.gold
          }
        ];

        return (
          <div 
            className="gkp-team-stats-row"
            style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? '10px' : '16px' }}
          >
            {cards.map((card, idx) => (
              <div 
                key={idx} 
                className="gkp-team-kpi-card"
                style={{
                  ...S.card,
                  padding: isMobile ? '14px 12px' : '24px',
                  borderRadius: isMobile ? '14px' : '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: isMobile ? '110px' : '140px',
                  boxShadow: isThemeDark ? 'none' : '0 10px 25px rgba(0,0,0,0.02)',
                  border: `1.5px solid ${C.border}`,
                  transition: 'all 0.25s ease',
                  background: C.card,
                  overflow: 'hidden'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                    <span style={{ fontSize: isMobile ? '10px' : '12px', fontWeight: 750, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {card.title}
                    </span>
                    <span style={{ fontSize: isMobile ? '22px' : '30px', fontWeight: 800, color: C.text, marginTop: '2px' }}>
                      {card.value}
                    </span>
                  </div>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '10px',
                    background: card.bg, color: card.iconColor,
                    display: isMobile ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {card.icon}
                  </div>
                </div>
                
                <div style={{ fontSize: '11px', fontWeight: 700, color: card.color, marginTop: '8px' }}>
                  {card.subtitle}
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Conversion Funnel Visualization Widget */}
      <div style={{ ...S.card, padding: '24px', borderRadius: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: 0 }}>Referral Conversion Funnel Analytics</h3>
            <p style={{ fontSize: '12px', color: C.textLight, margin: '2px 0 0 0' }}>Track drop-offs from link click to approved payouts</p>
          </div>
          <span style={{ background: `${C.teal}15`, color: C.teal, padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 800 }}>Real-Time Funnel</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(6, 1fr)', gap: '10px' }}>
          {[
            { label: 'Referral Clicks', count: funnel.clicks, color: C.textMid },
            { label: 'Registrations', count: funnel.registrations, color: C.teal, rate: funnel.clicks ? `${((funnel.registrations / funnel.clicks) * 100).toFixed(1)}%` : null },
            { label: 'KYC Approved', count: funnel.kyc_approved, color: C.purple, rate: funnel.registrations ? `${((funnel.kyc_approved / funnel.registrations) * 100).toFixed(1)}%` : null },
            { label: 'Active Partners', count: funnel.active_partners, color: C.primary, rate: funnel.kyc_approved ? `${((funnel.active_partners / funnel.kyc_approved) * 100).toFixed(1)}%` : null },
            { label: 'Applications', count: funnel.applications, color: C.gold },
            { label: 'Approved Payouts', count: funnel.approved_applications, color: C.green, rate: funnel.applications ? `${((funnel.approved_applications / funnel.applications) * 100).toFixed(1)}%` : null },
          ].map((step, idx) => (
            <div key={idx} style={{
              background: C.bgSecondary,
              padding: '14px 10px',
              borderRadius: '14px',
              textAlign: 'center',
              border: `1px solid ${C.border}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: step.color }}>{step.count}</div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, marginTop: '4px' }}>{step.label}</div>
              </div>
              {step.rate && (
                <div style={{ fontSize: '10px', fontWeight: 800, color: step.color, background: C.card, padding: '2px 6px', borderRadius: '6px', marginTop: '8px', display: 'inline-block', margin: '8px auto 0 auto' }}>
                  {step.rate} conv.
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Section F: Commission Structure Explainer Banner */}
      <div style={{
        ...S.card,
        padding: '18px 24px',
        borderRadius: '16px',
        background: 'linear-gradient(90deg, #1E1B4B 0%, #312E81 100%)',
        color: '#FFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MdMonetizationOn size={26} color="#FBBF24" />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800 }}>Dual Earnings Policy: 90% Direct + 10% Parent Override Split</div>
            <div style={{ fontSize: '12px', color: '#C7D2FE', marginTop: '2px' }}>
              Your direct referrals receive 90% of loan commissions on their closed deals, while you automatically earn a 10% override payout into your wallet!
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: `1px solid ${C.border}`, paddingBottom: '2px', overflowX: 'auto' }}>
        {[
          { id: 'dashboard', label: 'Direct Team Members', icon: MdPeople },
          { id: 'invitations', label: 'Direct Invites & History', icon: FiSend },
          { id: 'campaigns', label: 'Referral Campaigns', icon: MdCampaign },
          { id: 'tree', label: 'Multi-Level Team Tree', icon: MdDeviceHub },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: active ? `3px solid ${C.teal}` : '3px solid transparent',
                color: active ? C.teal : C.textLight,
                padding: '10px 18px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: DIRECT TEAM LIST WITH SEARCH & FILTERS */}
      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Filters Bar */}
          <div style={{ ...S.card, padding: '14px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <input
                style={S.input}
                placeholder="Search team by name, code, mobile, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select style={{ ...S.input, width: 'auto' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>

            <select style={{ ...S.input, width: 'auto' }} value={kycFilter} onChange={(e) => setKycFilter(e.target.value)}>
              <option value="">All KYC Statuses</option>
              <option value="approved">KYC Approved</option>
              <option value="pending">KYC Pending</option>
              <option value="submitted">KYC Submitted</option>
            </select>

            <select style={{ ...S.input, width: 'auto' }} value={joinedFilter} onChange={(e) => setJoinedFilter(e.target.value)}>
              <option value="">All Join Dates</option>
              <option value="today">Joined Today</option>
              <option value="this_month">Joined This Month</option>
            </select>
          </div>

          {/* Members Table */}
          <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, textAlign: 'left', color: C.textLight, fontSize: '11px' }}>
                    <th style={{ padding: '12px 16px' }}>Partner Details</th>
                    <th style={{ padding: '12px 16px' }}>Level</th>
                    <th style={{ padding: '12px 16px' }}>Contact Information</th>
                    <th style={{ padding: '12px 16px' }}>KYC Status</th>
                    <th style={{ padding: '12px 16px' }}>Account Status</th>
                    <th style={{ padding: '12px 16px' }}>Team Size</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody style={{ color: C.text }}>
                  {teamList.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: C.textLight }}>No team members found matching search parameters.</td></tr>
                  ) : (
                    teamList.map((member) => (
                      <tr key={member.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 800 }}>{member.first_name} {member.last_name || ''}</div>
                          <div style={{ fontSize: '10px', color: C.textLight }}>Code: {member.partner_code}</div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ background: C.bgSecondary, padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>Level {member.level}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div>{member.mobile || 'N/A'}</div>
                          <div style={{ fontSize: '11px', color: C.textLight }}>{member.email}</div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800,
                            background: member.kyc_status === 'approved' ? '#ECFDF5' : '#FEF3C7',
                            color: member.kyc_status === 'approved' ? '#059669' : '#D97706'
                          }}>
                            {member.kyc_status?.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800,
                            background: member.status === 'active' ? '#ECFDF5' : '#FEE2E2',
                            color: member.status === 'active' ? '#059669' : '#DC2626'
                          }}>
                            {member.status?.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 700 }}>
                          {member.children_count || 0} Members
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleOpenChildDetail(member.id)}
                            style={{ ...S.btn('primary'), padding: '6px 12px', fontSize: '12px', borderRadius: '8px' }}
                          >
                            360° Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DIRECT INVITES FORM & INVITATION HISTORY */}
      {activeTab === 'invitations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Direct Invite Form */}
          <div style={{ ...S.card, padding: '24px', borderRadius: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: '0 0 4px 0' }}>Invite Someone Directly</h3>
            <p style={{ fontSize: '12px', color: C.textLight, margin: '0 0 16px 0' }}>Send an invitation directly via Email, SMS, or WhatsApp with your referral link attached.</p>

            {invMsg && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 700,
                marginBottom: '16px',
                background: invMsg.includes('success') ? '#ECFDF5' : '#FEE2E2',
                color: invMsg.includes('success') ? '#059669' : '#DC2626'
              }}>
                {invMsg}
              </div>
            )}

            <form onSubmit={handleSendInvite} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '14px', alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>Recipient Full Name *</label>
                <input
                  required
                  style={S.input}
                  placeholder="e.g. Rahul Sharma"
                  value={invForm.recipient_name}
                  onChange={(e) => setInvForm({ ...invForm, recipient_name: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>Recipient Email</label>
                <input
                  type="email"
                  style={S.input}
                  placeholder="rahul@example.com"
                  value={invForm.recipient_email}
                  onChange={(e) => setInvForm({ ...invForm, recipient_email: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>Recipient Mobile</label>
                <input
                  style={S.input}
                  placeholder="10-digit Mobile"
                  value={invForm.recipient_mobile}
                  onChange={(e) => setInvForm({ ...invForm, recipient_mobile: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>Method</label>
                  <select
                    style={S.input}
                    value={invForm.invite_type}
                    onChange={(e) => setInvForm({ ...invForm, invite_type: e.target.value })}
                  >
                    <option value="EMAIL">Email</option>
                    <option value="SMS">SMS</option>
                    <option value="WHATSAPP">WhatsApp</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={invSubmitting}
                  style={{ ...S.btn('primary'), background: C.teal, padding: '0 20px', height: '42px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                >
                  <FiSend size={16} />
                  <span>{invSubmitting ? 'Sending...' : 'Send'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Invitation History List */}
          <div style={{ ...S.card, padding: '24px', borderRadius: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: '0 0 16px 0' }}>Sent Invitation History</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, textAlign: 'left', color: C.textLight, fontSize: '11px' }}>
                    <th style={{ padding: '12px 16px' }}>Recipient</th>
                    <th style={{ padding: '12px 16px' }}>Method</th>
                    <th style={{ padding: '12px 16px' }}>Contact Info</th>
                    <th style={{ padding: '12px 16px' }}>Sent Date</th>
                    <th style={{ padding: '12px 16px' }}>Expiry Date</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: C.textLight }}>No direct invitations sent yet.</td></tr>
                  ) : (
                    invitations.map((inv) => (
                      <tr key={inv.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: '12px 16px', fontWeight: 800 }}>{inv.recipient_name}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ background: C.bgSecondary, padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>
                            {inv.invite_type || 'EMAIL'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {inv.recipient_email || inv.recipient_mobile || 'N/A'}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '12px', color: C.textLight }}>
                          {new Date(inv.sent_at).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '12px', color: C.textLight }}>
                          {inv.expired_at ? new Date(inv.expired_at).toLocaleDateString() : '30 Days'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800,
                            background: inv.status === 'REGISTERED' ? '#ECFDF5' : inv.status === 'EXPIRED' ? '#FEE2E2' : '#FEF3C7',
                            color: inv.status === 'REGISTERED' ? '#059669' : inv.status === 'EXPIRED' ? '#DC2626' : '#D97706'
                          }}>
                            {inv.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          {inv.status === 'PENDING' && (
                            <button
                              onClick={() => handleResendInvite(inv.id)}
                              style={{ ...S.btn('outline'), padding: '4px 10px', fontSize: '12px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <MdRefresh size={14} /> Resend
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REFERRAL CAMPAIGNS */}
      {activeTab === 'campaigns' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ ...S.card, padding: '24px', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: 0 }}>Referral Marketing Campaigns</h3>
              <p style={{ fontSize: '12px', color: C.textLight, margin: '4px 0 0 0' }}>Track specific marketing channels and custom bonuses for your team recruitment.</p>
            </div>

            <button
              onClick={() => setShowCampModal(true)}
              style={{ ...S.btn('primary'), background: C.teal, padding: '10px 18px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <MdAdd size={18} />
              <span>Create Campaign</span>
            </button>
          </div>

          <div style={{ ...S.card, padding: 0, borderRadius: '20px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, textAlign: 'left', color: C.textLight, fontSize: '11px' }}>
                    <th style={{ padding: '12px 16px' }}>Campaign Name</th>
                    <th style={{ padding: '12px 16px' }}>Code</th>
                    <th style={{ padding: '12px 16px' }}>Platform</th>
                    <th style={{ padding: '12px 16px' }}>Target / Budget</th>
                    <th style={{ padding: '12px 16px' }}>Bonus</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px' }}>Start Date</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: C.textLight }}>No custom campaigns created yet. Click "Create Campaign" to start.</td></tr>
                  ) : (
                    campaigns.map((camp) => (
                      <tr key={camp.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: '12px 16px', fontWeight: 800 }}>{camp.campaign_name}</td>
                        <td style={{ padding: '12px 16px' }}><code>{camp.campaign_code}</code></td>
                        <td style={{ padding: '12px 16px' }}>{camp.platform}</td>
                        <td style={{ padding: '12px 16px' }}>{camp.target || 0} Joins / ₹{camp.budget || 0}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: C.teal }}>₹{camp.bonus_amount || 0}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800, background: '#ECFDF5', color: '#059669' }}>
                            {camp.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '12px', color: C.textLight }}>
                          {new Date(camp.start_date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LAZY-LOADING TEAM TREE */}
      {activeTab === 'tree' && (
        <div style={{ ...S.card, padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: '0 0 16px 0' }}>Interactive Multi-Level Team Tree Node Hierarchy</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {treeNodes.length === 0 ? (
              <div style={{ color: C.textLight }}>No team children mapped in hierarchy yet.</div>
            ) : (
              treeNodes.map(node => (
                <div key={node.id} style={{ ...S.card, padding: '14px', borderLeft: `4px solid ${C.teal}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: C.text }}>{node.full_name || `${node.first_name || ''} ${node.last_name || ''}`} ({node.partner_code})</div>
                    <div style={{ fontSize: '11px', color: C.textLight, marginTop: '2px' }}>
                      Level {node.level} • Joined {new Date(node.created_at || Date.now()).toLocaleDateString()} • {node.children?.length || 0} Downline Members
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenChildDetail(node.id)}
                    style={{ ...S.btn('outline'), padding: '6px 12px', fontSize: '12px' }}
                  >
                    View Node Details
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Section G: Terms & Anti-Abuse Notice */}
      <div style={{
        ...S.card,
        padding: '16px 20px',
        borderRadius: '16px',
        background: C.bgSecondary,
        border: `1px dashed ${C.border}`,
        display: 'flex',
        gap: '12px',
        alignItems: 'center'
      }}>
        <MdShield size={22} color={C.teal} style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '12px', color: C.textLight, lineHeight: 1.5 }}>
          <strong>Referral & Commission Compliance Policy:</strong> Self-referral for personal loan applications is strictly prohibited. Team override commissions (10%) are disbursed only upon verified disbursal of customer/team partner applications. Accounts engaging in artificial click generation or fraudulent KYC registrations will be suspended immediately.
        </div>
      </div>

      {/* CREATE CAMPAIGN MODAL */}
      {showCampModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '480px', background: C.card, borderRadius: '20px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: 0 }}>Create Referral Campaign</h3>
              <button onClick={() => setShowCampModal(false)} style={{ background: 'none', border: 'none', color: C.textLight, cursor: 'pointer' }}><MdClose size={20} /></button>
            </div>

            <form onSubmit={handleCreateCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>Campaign Name *</label>
                <input
                  required
                  style={S.input}
                  placeholder="e.g. Diwali Team Drive 2025"
                  value={campForm.campaign_name}
                  onChange={(e) => setCampForm({ ...campForm, campaign_name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>Platform</label>
                  <select
                    style={S.input}
                    value={campForm.platform}
                    onChange={(e) => setCampForm({ ...campForm, platform: e.target.value })}
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Instagram">Instagram</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Email">Email</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>Target Joins</label>
                  <input
                    type="number"
                    style={S.input}
                    placeholder="e.g. 50"
                    value={campForm.target}
                    onChange={(e) => setCampForm({ ...campForm, target: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>Bonus Amount (₹)</label>
                  <input
                    type="number"
                    style={S.input}
                    placeholder="e.g. 500"
                    value={campForm.bonus_amount}
                    onChange={(e) => setCampForm({ ...campForm, bonus_amount: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>Budget (₹)</label>
                  <input
                    type="number"
                    style={S.input}
                    placeholder="e.g. 5000"
                    value={campForm.budget}
                    onChange={(e) => setCampForm({ ...campForm, budget: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={campSubmitting}
                style={{ ...S.btn('primary'), background: C.teal, padding: '12px', borderRadius: '12px', marginTop: '10px' }}
              >
                {campSubmitting ? 'Creating Campaign...' : 'Launch Campaign'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* QR CODE GENERATOR MODAL */}
      {showQrModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '420px', background: C.card, borderRadius: '20px', padding: '24px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: 0 }}>Referral QR Code</h3>
              <button onClick={() => setShowQrModal(false)} style={{ background: 'none', border: 'none', color: C.textLight, cursor: 'pointer' }}><MdClose size={20} /></button>
            </div>

            {loadingQr ? (
              <div style={{ padding: '40px', color: C.textLight }}>Generating High-Resolution QR...</div>
            ) : (
              qrResult && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                  <img src={qrResult.qr_data_url} alt="Referral QR Code" style={{ width: '220px', height: '220px', borderRadius: '16px', border: `2px solid ${C.border}`, padding: '10px', background: '#FFF' }} />
                  <div style={{ fontSize: '12px', color: C.textLight }}>Scan to open partner registration page</div>
                  <a
                    href={qrResult.qr_data_url}
                    download={`GharKaPaisa_Referral_QR_${partnerCode}.png`}
                    style={{ ...S.btn('primary'), textDecoration: 'none', padding: '10px 20px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                  >
                    <MdCloudDownload size={18} /> Download High-Res QR
                  </a>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* 360° CHILD DETAIL SLIDE-OVER DRAWER */}
      {selectedChildId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1150, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '100%', maxWidth: '820px', height: '100%', background: C.card, boxShadow: '-10px 0 30px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '20px', background: 'linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)', color: '#FFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9 }}>360° Child Partner Hub</div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>{childDetail?.profile?.first_name} {childDetail?.profile?.last_name} ({childDetail?.profile?.partner_code})</h3>
              </div>
              <button onClick={() => setSelectedChildId(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#FFF', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MdClose size={20} /></button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {loadingChild ? (
                <div style={{ padding: '40px', textAlign: 'center', color: C.textLight }}>Loading Child Profile...</div>
              ) : (
                childDetail && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                      <div>Email: <strong>{childDetail.profile?.email}</strong></div>
                      <div>Mobile: <strong>{childDetail.profile?.mobile}</strong></div>
                      <div>Joined Date: <strong>{new Date(childDetail.profile?.created_at || Date.now()).toLocaleDateString()}</strong></div>
                      <div>Available Balance: <strong style={{ color: C.green }}>₹{parseFloat(childDetail.profile?.wallet_balance || 0).toLocaleString()}</strong></div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .gkp-team-kpi-card {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .gkp-team-kpi-card:hover {
          transform: translateY(-4px) !important;
          box-shadow: ${C.bg === '#000000' ? 'none' : '0 12px 30px rgba(0,0,0,0.06)'} !important;
          border-color: ${C.primary}50 !important;
        }
      `}</style>
    </div>
  );
}
