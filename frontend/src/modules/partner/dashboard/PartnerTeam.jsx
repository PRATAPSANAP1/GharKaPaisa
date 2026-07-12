import React, { useState, useEffect } from 'react';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { 
  MdAdd, MdPerson, MdEmail, MdPhone, MdCheckCircle, 
  MdPendingActions, MdClose, MdContentCopy,
  MdOutlineQrCode2, MdOutlineWhatsapp, MdMonetizationOn, 
  MdTrendingUp, MdDeviceHub, MdList, MdHistory, MdShare,
  MdLeaderboard, MdAnalytics, MdBlock, MdSearch, MdInfo,
  MdAccountBalance, MdTimeline, MdPeople, MdTrendingDown
} from 'react-icons/md';
import api from '../../../services/api';
import { useAuthStore } from '../../../app/store/authStore';

export default function PartnerTeam() {
  const { C, isDark } = useTheme();
  const S = makeS(C);

  const user = useAuthStore((state) => state.user);
  const { t } = useTranslation();

  const partnerId = user?.partner_id || user?.Partner_id || user?.PartnerId;
  const partnerCode = user?.partner_code || user?.Partner_code || user?.PartnerCode || '';
  
  // State variables
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Tabs: 'overview' | 'direct_team' | 'complete_tree' | 'performance' | 'commissions' | 'leaderboard' | 'pending_members' | 'inactive_members'
  const [activeTab, setActiveTab] = useState('overview');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', mobile: '', password: ''
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  const [referralInfo, setReferralInfo] = useState(null);
  const [teamTree, setTeamTree] = useState([]);
  const [teamDashboard, setTeamDashboard] = useState(null);
  const [teamEarnings, setTeamEarnings] = useState([]);
  const [selfProfile, setSelfProfile] = useState(null);

  // Drawer state for clicked partner
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [selectedChildProfile, setSelectedChildProfile] = useState(null);
  const [selectedChildDashboard, setSelectedChildDashboard] = useState(null);
  const [childLoading, setChildLoading] = useState(false);
  const [activeDrawerTab, setActiveDrawerTab] = useState('personal'); // 'personal' | 'business' | 'bank' | 'kyc' | 'leads' | 'commission' | 'performance'

  const fetchTeam = async () => {
    try {
      const res = await api.get(`/partner/${partnerId}/team`);
      setTeam(res.data.data || []);
    } catch (err) {
      setError('Failed to load direct team members');
    }
  };

  const loadSelfProfile = async () => {
    try {
      const res = await api.get('/partner/profile');
      setSelfProfile(res.data.data);
    } catch (err) {
      console.error('Failed to load self profile details:', err);
    }
  };

  const loadReferralInfo = async () => {
    try {
      const res = await api.get('/partner/referral');
      setReferralInfo(res.data.data);
    } catch (err) {
      console.error('Failed to load referral details:', err);
    }
  };

  const loadTeamTree = async () => {
    try {
      const res = await api.get('/partner/team-tree');
      setTeamTree(res.data.data || []);
    } catch (err) {
      console.error('Failed to load team tree:', err);
    }
  };

  const loadTeamDashboard = async () => {
    try {
      const res = await api.get('/partner/team-dashboard');
      setTeamDashboard(res.data.data);
    } catch (err) {
      console.error('Failed to load team dashboard:', err);
    }
  };

  const loadTeamEarnings = async () => {
    try {
      const res = await api.get('/partner/team-earnings');
      setTeamEarnings(res.data.data || []);
    } catch (err) {
      console.error('Failed to load team earnings:', err);
    }
  };

  const loadAllData = async () => {
    if (!partnerId) return;
    setLoading(true);
    setError('');
    try {
      await Promise.all([
        fetchTeam(),
        loadSelfProfile(),
        loadReferralInfo(),
        loadTeamTree(),
        loadTeamDashboard(),
        loadTeamEarnings()
      ]);
    } catch (err) {
      setError('Failed to load team network information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [user]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError('');
    try {
      await api.post(`/partner/${partnerId}/team`, formData);
      setIsAddModalOpen(false);
      setFormData({ first_name: '', last_name: '', email: '', mobile: '', password: '' });
      loadAllData();
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to add team member');
    } finally {
      setAddLoading(false);
    }
  };

  const handleViewChildProfile = async (childId) => {
    setSelectedChildId(childId);
    setChildLoading(true);
    setActiveDrawerTab('personal');
    try {
      const [profileRes, statsRes] = await Promise.all([
        api.get(`/partner/${childId}/profile`),
        api.get(`/partner/${childId}/dashboard`)
      ]);
      setSelectedChildProfile(profileRes.data.data);
      setSelectedChildDashboard(statsRes.data.data);
    } catch (err) {
      console.error('Failed to load child profile details:', err);
      alert('Failed to load child profile details. They might not have their dashboard initialized.');
      setSelectedChildId(null);
    } finally {
      setChildLoading(false);
    }
  };

  const copyReferralLink = () => {
    const link = referralInfo?.referral_link || `https://gharkapaisa.in/register?ref=${partnerCode || 'GKP'}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnWhatsapp = () => {
    const link = referralInfo?.referral_link || `https://gharkapaisa.in/register?ref=${partnerCode || 'GKP'}`;
    const text = `Join my GharKaPaisa partner network using my invite link and start earning: ${link}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareViaEmail = () => {
    const link = referralInfo?.referral_link || `https://gharkapaisa.in/register?ref=${partnerCode || 'GKP'}`;
    const subject = `Opportunity to partner with GharKaPaisa`;
    const body = `Hi,\n\nJoin my partner network at GharKaPaisa and start earning overrides on payouts. Register using this referral link:\n${link}\n\nRegards,\n${user.first_name}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  const shareViaSMS = () => {
    const link = referralInfo?.referral_link || `https://gharkapaisa.in/register?ref=${partnerCode || 'GKP'}`;
    const text = `Register as a GharKaPaisa partner using code ${partnerCode || 'GKP'}: ${link}`;
    window.open(`sms:?&body=${encodeURIComponent(text)}`, '_blank');
  };

  const thStyle = {
    padding: '12px 18px', fontSize: '11px', fontWeight: 700,
    color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.6px',
    textAlign: 'left', borderBottom: `1px solid ${C.border}`
  };

  const tdStyle = {
    padding: '14px 18px', fontSize: '13px', color: C.textMid,
    borderBottom: `1px solid ${C.border}`
  };

  // Collapsible Tree Node Component
  const TreeMemberNode = ({ member }) => {
    const [collapsed, setCollapsed] = useState(true);
    const hasChildren = member.children && member.children.length > 0;

    return (
      <div style={{ marginLeft: member.level > 1 ? '24px' : '0px', borderLeft: member.level > 1 ? `1px dashed ${C.border}` : 'none', paddingLeft: member.level > 1 ? '16px' : '0px', marginBottom: '8px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', background: C.card, border: `1px solid ${C.border}`,
          borderRadius: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          cursor: 'pointer'
        }} onClick={() => handleViewChildProfile(member.id)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: `${C.primary}12`, color: C.primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700
            }}>
              {member.first_name?.[0] || 'P'}
            </div>
            <div>
              <p style={{ fontWeight: 700, margin: 0, color: C.text }}>
                {member.first_name} {member.last_name}
              </p>
              <span style={{ fontSize: '11px', color: C.textLight, fontFamily: 'monospace' }}>
                {member.partner_code} • Level {member.level}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} onClick={(e) => e.stopPropagation()}>
            <span style={S.tag(member.kyc_status === 'approved' ? C.green : member.kyc_status === 'rejected' ? C.red : C.gold)}>
              {member.kyc_status}
            </span>
            {hasChildren && (
              <button
                onClick={() => setCollapsed(!collapsed)}
                style={{
                  background: `${C.primary}12`, color: C.primary, border: 'none',
                  borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 700, cursor: 'pointer'
                }}
              >
                {collapsed ? `Show Team (${member.children.length})` : 'Hide'}
              </button>
            )}
          </div>
        </div>
        {!collapsed && hasChildren && (
          <div style={{ marginTop: '8px' }}>
            {member.children.map(child => (
              <TreeMemberNode key={child.id} member={child} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Filter team listings based on search
  const getFilteredTeam = (list) => {
    return list.filter(member => {
      const name = `${member.first_name} ${member.last_name}`.toLowerCase();
      const code = (member.partner_code || '').toLowerCase();
      const email = (member.email || '').toLowerCase();
      const query = searchQuery.toLowerCase();
      return name.includes(query) || code.includes(query) || email.includes(query);
    });
  };

  const directTeamList = getFilteredTeam(team);
  const pendingKycTeam = getFilteredTeam(team.filter(m => m.kyc_status === 'pending' || m.kyc_status === 'rejected'));
  const inactiveTeam = getFilteredTeam(team.filter(m => m.status === 'inactive'));
  const leaderboardTeam = [...team].sort((a, b) => (b.commission_amount || 0) - (a.commission_amount || 0));

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: C.text, margin: 0 }}>{t('team.title', 'My Team & Hierarchy')}</h2>
          <p style={{ fontSize: '14px', color: C.textMid, margin: '4px 0 0' }}>{t('team.subtitle', 'Invite sub-partners, manage your team network, check commissions and monitor performance.')}</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          style={{
            ...S.btn('primary'), border: 'none', borderRadius: '10px',
            display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'
          }}
        >
          <MdAdd size={20} /> {t('team.addDirectPartner', 'Add Direct Partner')}
        </button>
      </div>

      {/* 8 Metric KPI Cards Grid */}
      {teamDashboard && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div style={{ ...S.card, padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', background: `${C.primary}12`, color: C.primary, borderRadius: '10px' }}>
              <MdPeople size={22} />
            </div>
            <div>
              <p style={{ fontSize: '11px', color: C.textLight, margin: 0, fontWeight: 600 }}>{t('team.totalTeamSize', 'Total Team Size')}</p>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '2px 0 0', color: C.text }}>{teamDashboard.total_members || 0}</h3>
            </div>
          </div>

          <div style={{ ...S.card, padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', background: `${C.green}12`, color: C.green, borderRadius: '10px' }}>
              <MdPerson size={22} />
            </div>
            <div>
              <p style={{ fontSize: '11px', color: C.textLight, margin: 0, fontWeight: 600 }}>{t('team.directPartnersL1', 'Direct Partners (L1)')}</p>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '2px 0 0', color: C.text }}>{teamDashboard.level_1_members || 0}</h3>
            </div>
          </div>

          <div style={{ ...S.card, padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', background: `${C.gold}12`, color: C.gold, borderRadius: '10px' }}>
              <MdDeviceHub size={22} />
            </div>
            <div>
              <p style={{ fontSize: '11px', color: C.textLight, margin: 0, fontWeight: 600 }}>{t('team.level2Team', 'Level 2 Team')}</p>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '2px 0 0', color: C.text }}>{teamDashboard.level_2_members || 0}</h3>
            </div>
          </div>

          <div style={{ ...S.card, padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', background: `${C.primary}12`, color: C.primary, borderRadius: '10px' }}>
              <MdDeviceHub size={22} />
            </div>
            <div>
              <p style={{ fontSize: '11px', color: C.textLight, margin: 0, fontWeight: 600 }}>{t('team.level3Team', 'Level 3 Team')}</p>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '2px 0 0', color: C.text }}>{teamDashboard.level_3_members || 0}</h3>
            </div>
          </div>

          <div style={{ ...S.card, padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', background: `${C.green}12`, color: C.green, borderRadius: '10px' }}>
              <MdTrendingUp size={22} />
            </div>
            <div>
              <p style={{ fontSize: '11px', color: C.textLight, margin: 0, fontWeight: 600 }}>{t('team.todaysRegistrations', "Today's Registrations")}</p>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '2px 0 0', color: C.text }}>{teamDashboard.joined_today || 0}</h3>
            </div>
          </div>

          <div style={{ ...S.card, padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', background: `${C.green}12`, color: C.green, borderRadius: '10px' }}>
              <MdCheckCircle size={22} />
            </div>
            <div>
              <p style={{ fontSize: '11px', color: C.textLight, margin: 0, fontWeight: 600 }}>{t('team.activePartners', 'Active Partners')}</p>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '2px 0 0', color: C.text }}>{teamDashboard.active_members || 0}</h3>
            </div>
          </div>

          <div style={{ ...S.card, padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', background: `${C.gold}12`, color: C.gold, borderRadius: '10px' }}>
              <MdPendingActions size={22} />
            </div>
            <div>
              <p style={{ fontSize: '11px', color: C.textLight, margin: 0, fontWeight: 600 }}>{t('team.inactivePartners', 'Inactive Partners')}</p>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '2px 0 0', color: C.text }}>{teamDashboard.inactive_members || 0}</h3>
            </div>
          </div>

          <div style={{ ...S.card, padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', background: `${C.red}12`, color: C.red, borderRadius: '10px' }}>
              <MdBlock size={22} />
            </div>
            <div>
              <p style={{ fontSize: '11px', color: C.textLight, margin: 0, fontWeight: 600 }}>{t('team.blockedSuspended', 'Blocked / Suspended')}</p>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '2px 0 0', color: C.text }}>{teamDashboard.blocked_partners || 0}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Referral Tools Card */}
      <div style={{
        background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
        borderRadius: '16px', padding: '24px 28px', color: '#fff',
        position: 'relative', overflow: 'hidden', display: 'flex',
        flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px'
      }}>
        <div style={{
          position: 'absolute', right: 0, top: 0, width: 200, height: 200,
          background: '#fff', opacity: 0.05, borderRadius: '50%', filter: 'blur(40px)',
          marginRight: '-40px', marginTop: '-40px', pointerEvents: 'none'
        }} />
        
        <div style={{ flex: 1, minWidth: '280px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>{t('team.inviteSubPartnersTitle', 'Invite Sub-Partners & Build Your Business Hierarchy')}</h3>
          <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)', margin: 0, maxWidth: '460px' }}>
            {t('team.inviteSubPartnersDesc', 'Every partner registered via your code becomes a child partner. Share your referral link via multiple social channels below:')}
          </p>
          <div style={{ marginTop: '12px', fontSize: '12.5px', background: 'rgba(255, 255, 255, 0.15)', padding: '8px 12px', borderRadius: '8px', display: 'inline-flex', flexDirection: 'column', gap: '4px', border: '1px solid rgba(255, 255, 255, 0.25)' }}>
            <div>
              <span style={{ fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)' }}>{t('team.partnerCodeLabel', 'Partner Code')}: </span>
              <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#fff', background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px', marginLeft: '4px' }}>
                {partnerCode || 'N/A'}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)' }}>
              <span>{t('team.partnerIdLabel', 'Partner ID')}: </span>
              <span style={{ fontFamily: 'monospace' }}>
                {partnerId || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button 
            onClick={copyReferralLink}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 18px', background: copied ? `${C.green}15` : C.card, color: copied ? C.green : C.primary,
              borderRadius: '10px', border: copied ? `1px solid ${C.green}` : 'none', fontWeight: 700, fontSize: '13px',
              cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'all 0.2s'
            }}
          >
            {copied ? <MdCheckCircle size={16} /> : <MdContentCopy size={16} />} {copied ? t('team.copied', 'Copied!') : t('team.copyLink', 'Copy Link')}
          </button>
          <button 
            onClick={shareOnWhatsapp}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 18px', background: '#25D366', color: '#fff',
              borderRadius: '10px', border: 'none', fontWeight: 700, fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <MdOutlineWhatsapp size={16} /> {t('team.whatsapp', 'WhatsApp')}
          </button>
          <button 
            onClick={shareViaEmail}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 18px', background: '#EA4335', color: '#fff',
              borderRadius: '10px', border: 'none', fontWeight: 700, fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <MdEmail size={16} /> {t('team.emailLink', 'Email Link')}
          </button>
          <button 
            onClick={shareViaSMS}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 18px', background: C.gold, color: '#fff',
              borderRadius: '10px', border: 'none', fontWeight: 700, fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <MdShare size={16} /> {t('team.smsInvite', 'SMS Invite')}
          </button>
          <button 
            onClick={() => setIsQrOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 18px', background: 'rgba(255,255,255,0.1)', color: '#fff',
              borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)', fontWeight: 700, fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <MdOutlineQrCode2 size={16} /> {t('team.qrCode', 'QR Code')}
          </button>
        </div>
      </div>

      {/* Unified Tab Selector & Directory */}
      <div style={{ ...S.card, padding: 0, borderRadius: '16px', overflow: 'hidden' }}>
        
        {/* Navigation Bar */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', borderBottom: `1px solid ${C.border}`,
          padding: '8px', gap: '6px', background: C.bgSecondary
        }}>
          {[
            { id: 'overview', label: t('team.tabs.overview', 'Overview'), icon: MdInfo },
            { id: 'direct_team', label: t('team.tabs.directTeam', 'Direct Team (L1)'), icon: MdPeople },
            { id: 'complete_tree', label: t('team.tabs.completeTree', 'Complete Tree'), icon: MdDeviceHub },
            { id: 'performance', label: t('team.tabs.performance', 'Performance'), icon: MdAnalytics },
            { id: 'commissions', label: t('team.tabs.mlmCommissions', 'MLM Commissions'), icon: MdMonetizationOn },
            { id: 'leaderboard', label: t('team.tabs.leaderboard', 'Leaderboard'), icon: MdLeaderboard },
            { id: 'pending_members', label: t('team.tabs.pendingKyc', 'Pending KYC'), icon: MdPendingActions },
            { id: 'inactive_members', label: t('team.tabs.inactiveMembers', 'Inactive Members'), icon: MdBlock }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', borderRadius: '8px', fontSize: '12px',
                fontWeight: 700, border: 'none', cursor: 'pointer',
                background: activeTab === tab.id ? C.card : 'transparent',
                color: activeTab === tab.id ? C.primary : C.textMid,
                boxShadow: activeTab === tab.id ? '0 2px 6px rgba(0,0,0,0.03)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div style={{ padding: '20px' }}>
          
          {/* Search bar inside lists */}
          {['direct_team', 'pending_members', 'inactive_members'].includes(activeTab) && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              border: `1px solid ${C.border}`, borderRadius: '10px',
              padding: '6px 14px', marginBottom: '16px', background: C.card
            }}>
              <MdSearch size={20} color={C.textLight} />
              <input 
                type="text" 
                placeholder={t('team.searchPlaceholder', 'Search sub-partners by name, code or email...')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  border: 'none', background: 'transparent', outline: 'none',
                  fontSize: '13px', color: C.text, width: '100%'
                }}
              />
            </div>
          )}

          {error ? (
            <div style={{
              padding: '14px 18px', background: `${C.red}12`, border: `1px solid ${C.red}25`,
              color: C.red, borderRadius: '12px', fontWeight: 600, fontSize: '13px'
            }}>{error}</div>
          ) : loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <span style={{
                width: 32, height: 32, borderRadius: '50%',
                border: `3px solid ${C.border}`, borderTopColor: C.primary,
                animation: 'spin .8s linear infinite', display: 'inline-block'
              }} />
            </div>
          ) : activeTab === 'overview' ? (
            
            /* TAB: OVERVIEW */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: C.text }}>{t("Link Activity & Statistics")}</h4>
                <div style={{ ...S.card, background: C.bgSecondary, padding: '20px', border: `1px dashed ${C.border}`, borderRadius: '12px' }}>
                  <p style={{ fontSize: '12px', color: C.textLight, margin: 0, fontWeight: 700 }}>{t("Total Referral Clicks")}</p>
                  <h2 style={{ fontSize: '32px', fontWeight: 800, margin: '8px 0', color: C.primary }}>{referralInfo?.total_invites || 0}</h2>
                  <p style={{ fontSize: '12px', color: C.textLight, margin: 0 }}>Registered Accounts: <span style={{ fontWeight: 700, color: C.text }}>{referralInfo?.total_registered || 0}</span></p>
                  
                  {/* Dynamic Conversion rate */}
                  {referralInfo?.total_invites > 0 && (
                    <div style={{ marginTop: '12px', fontSize: '12px', color: C.textLight }}>
                      Registration Conversion: <span style={{ fontWeight: 700, color: C.green }}>{((referralInfo.total_registered / referralInfo.total_invites) * 100).toFixed(1)}%</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px', color: C.text }}>{t("Hierarchy KYC Approvals")}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: C.bgSecondary, borderRadius: '10px' }}>
                    <span style={{ fontWeight: 600, fontSize: '12px' }}>{t("KYC Approved Team Members")}</span>
                    <span style={{ fontWeight: 700, fontSize: '12px', color: C.green }}>{teamDashboard?.approved_partners || 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: C.bgSecondary, borderRadius: '10px' }}>
                    <span style={{ fontWeight: 600, fontSize: '12px' }}>{t("Pending KYC Reviews")}</span>
                    <span style={{ fontWeight: 700, fontSize: '12px', color: C.gold }}>{teamDashboard?.pending_kyc || 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: C.bgSecondary, borderRadius: '10px' }}>
                    <span style={{ fontWeight: 600, fontSize: '12px' }}>{t("Rejected / Incomplete Uploads")}</span>
                    <span style={{ fontWeight: 700, fontSize: '12px', color: C.red }}>{teamDashboard?.rejected_partners || 0}</span>
                  </div>
                </div>
              </div>
            </div>

          ) : activeTab === 'direct_team' ? (
            
            /* TAB: DIRECT TEAM (L1) LIST */
            <div style={{ overflowX: 'auto' }}>
              {directTeamList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: C.textLight }}>
                  No direct team members match your criteria.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: C.bgSecondary }}>
                      <th style={thStyle}>{t("Partner")}</th>
                      <th style={thStyle}>{t("Code")}</th>
                      <th style={thStyle}>{t("Level")}</th>
                      <th style={thStyle}>{t("Leads")}</th>
                      <th style={thStyle}>{t("Commission Generated")}</th>
                      <th style={thStyle}>{t("Wallet Balance")}</th>
                      <th style={thStyle}>{t("KYC")}</th>
                      <th style={thStyle}>{t("Status")}</th>
                      <th style={thStyle}>{t("Actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {directTeamList.map((member) => (
                      <tr key={member.id}>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%',
                              background: `${C.primary}12`, color: C.primary,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 700, fontSize: '12px'
                            }}>
                              {member.first_name?.[0] || 'P'}
                            </div>
                            <div>
                              <p style={{ fontWeight: 700, color: C.text, margin: 0 }}>{member.first_name} {member.last_name}</p>
                              <span style={{ fontSize: '11px', color: C.textLight }}>{member.email}</span>
                            </div>
                          </div>
                        </td>
                        <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 600 }}>{member.partner_code}</td>
                        <td style={tdStyle}>{t("Level 1")}</td>
                        <td style={tdStyle}>{member.applications_count || 0}</td>
                        <td style={{ ...tdStyle, color: C.green, fontWeight: 700 }}>₹{parseFloat(member.commission_amount || 0).toFixed(2)}</td>
                        <td style={tdStyle}>₹{parseFloat(member.wallet_balance || 0).toFixed(2)}</td>
                        <td style={tdStyle}>
                          <span style={S.tag(member.kyc_status === 'approved' ? C.green : member.kyc_status === 'rejected' ? C.red : C.gold)}>
                            {member.kyc_status || 'pending'}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={S.tag(member.status === 'active' ? C.green : C.red)}>
                            {member.status || 'inactive'}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <button
                            onClick={() => handleViewChildProfile(member.id)}
                            style={{
                              padding: '5px 10px', background: `${C.primary}12`, color: C.primary,
                              border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            View Profile
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

          ) : activeTab === 'complete_tree' ? (

            /* TAB: GRAPHICAL COLLAPSIBLE TREE */
            <div style={{ padding: '10px 0' }}>
              {teamTree.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: C.textLight }}>
                  No sub-partners or team members registered under you yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {teamTree.map(member => (
                    <TreeMemberNode key={member.id} member={member} />
                  ))}
                </div>
              )}
            </div>

          ) : activeTab === 'performance' ? (

            /* TAB: PERFORMANCE / ANALYTICS */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ ...S.card, padding: '20px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 12px', color: C.textLight }}>{t("Monthly Growth Curve")}</h4>
                  
                  {/* Dynamic CSS mini bar chart */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '140px', padding: '10px 0' }}>
                    {[
                      { m: 'Jan', val: 12 }, { m: 'Feb', val: 24 }, { m: 'Mar', val: 40 },
                      { m: 'Apr', val: 30 }, { m: 'May', val: 56 }, { m: 'Jun', val: 78 },
                      { m: 'Jul', val: teamDashboard?.total_members || 0 }
                    ].map((h, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
                        <div style={{
                          width: '24px', 
                          height: `${Math.min(100, Math.max(8, (h.val / 100) * 100))}px`,
                          background: i === 6 ? C.primary : `${C.primary}50`, 
                          borderRadius: '4px 4px 0 0',
                          transition: 'height 0.3s ease'
                        }} />
                        <span style={{ fontSize: '10px', color: C.textLight, fontWeight: 700 }}>{h.m}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ ...S.card, padding: '20px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 12px', color: C.textLight }}>{t("Conversion Efficiency")}</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', justifyContent: 'center', height: '140px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                        <span>{t("Approved Applications")}</span>
                        <span>{teamDashboard?.approved_partners || 0} Accounts</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: C.border, borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${teamDashboard?.total_members > 0 ? (teamDashboard.approved_partners / teamDashboard.total_members) * 100 : 0}%`,
                          height: '100%', background: C.green
                        }} />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                        <span>{t("Pending Accounts")}</span>
                        <span>{teamDashboard?.pending_kyc || 0} Accounts</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: C.border, borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${teamDashboard?.total_members > 0 ? (teamDashboard.pending_kyc / teamDashboard.total_members) * 100 : 0}%`,
                          height: '100%', background: C.gold
                        }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          ) : activeTab === 'commissions' ? (

            /* TAB: COMMISSIONS & MLM INFO */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* MLM Summary Panel */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px'
              }}>
                <div style={{ ...S.card, background: C.bgSecondary, padding: '16px' }}>
                  <span style={{ fontSize: '11px', color: C.textLight, fontWeight: 700 }}>{t("SELF COMMISSION")}</span>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: C.text, margin: '4px 0 0' }}>
                    ₹{parseFloat(selfProfile?.personal_earnings || 0).toFixed(2)}
                  </h3>
                </div>
                <div style={{ ...S.card, background: C.bgSecondary, padding: '16px' }}>
                  <span style={{ fontSize: '11px', color: C.textLight, fontWeight: 700 }}>{t("TEAM OVERRIDE COMMISSION")}</span>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: C.primary, margin: '4px 0 0' }}>
                    ₹{parseFloat(selfProfile?.team_earnings || 0).toFixed(2)}
                  </h3>
                </div>
                <div style={{ ...S.card, background: C.bgSecondary, padding: '16px' }}>
                  <span style={{ fontSize: '11px', color: C.textLight, fontWeight: 700 }}>{t("PENDING COMMISSIONS")}</span>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: C.gold, margin: '4px 0 0' }}>
                    ₹{parseFloat(selfProfile?.pending_team_commission || 0).toFixed(2)}
                  </h3>
                </div>
                <div style={{ ...S.card, background: C.bgSecondary, padding: '16px' }}>
                  <span style={{ fontSize: '11px', color: C.textLight, fontWeight: 700 }}>{t("RELEASED COMMISSIONS")}</span>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: C.green, margin: '4px 0 0' }}>
                    ₹{parseFloat(selfProfile?.released_team_commission || 0).toFixed(2)}
                  </h3>
                </div>
              </div>

              {/* Commission Ledger Logs */}
              <div style={{ overflowX: 'auto', marginTop: '10px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px', color: C.text }}>{t("Recent Commission Override Transactions")}</h4>
                {teamEarnings.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: C.textLight }}>
                    No override commissions have been logged yet.
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: C.bgSecondary }}>
                        <th style={thStyle}>{t("Date")}</th>
                        <th style={thStyle}>{t("Amount")}</th>
                        <th style={thStyle}>{t("Product")}</th>
                        <th style={thStyle}>{t("Status")}</th>
                        <th style={thStyle}>{t("Details")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamEarnings.map((txn) => (
                        <tr key={txn.id}>
                          <td style={tdStyle}>{new Date(txn.created_at).toLocaleDateString()}</td>
                          <td style={{ ...tdStyle, fontWeight: 700, color: C.green }}>₹{parseFloat(txn.amount).toFixed(2)}</td>
                          <td style={tdStyle}>{txn.product_name || 'Commission Override'}</td>
                          <td style={tdStyle}>
                            <span style={S.tag(txn.status === 'approved' ? C.green : txn.status === 'pending' ? C.gold : C.red)}>
                              {txn.status}
                            </span>
                          </td>
                          <td style={tdStyle}>{txn.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

          ) : activeTab === 'leaderboard' ? (

            /* TAB: LEADERBOARD */
            <div style={{ overflowX: 'auto' }}>
              {leaderboardTeam.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: C.textLight }}>
                  No team members to show in the leaderboard.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: C.bgSecondary }}>
                      <th style={thStyle}>{t("Rank")}</th>
                      <th style={thStyle}>{t("Partner")}</th>
                      <th style={thStyle}>{t("Partner Code")}</th>
                      <th style={thStyle}>{t("Total Leads")}</th>
                      <th style={thStyle}>{t("Earnings Generated")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardTeam.map((member, idx) => (
                      <tr key={member.id}>
                        <td style={{ ...tdStyle, fontWeight: 800 }}>
                          {idx === 0 ? '🏆 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : idx + 1}
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: '50%',
                              background: `${C.primary}12`, color: C.primary,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 700, fontSize: '11px'
                            }}>
                              {member.first_name?.[0] || 'P'}
                            </div>
                            <span style={{ fontWeight: 700, color: C.text }}>{member.first_name} {member.last_name}</span>
                          </div>
                        </td>
                        <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{member.partner_code}</td>
                        <td style={tdStyle}>{member.applications_count || 0}</td>
                        <td style={{ ...tdStyle, color: C.green, fontWeight: 700 }}>₹{parseFloat(member.commission_amount || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

          ) : activeTab === 'pending_members' ? (

            /* TAB: PENDING MEMBERS */
            <div style={{ overflowX: 'auto' }}>
              {pendingKycTeam.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: C.textLight }}>
                  No pending or rejected KYC partners in your team.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: C.bgSecondary }}>
                      <th style={thStyle}>{t("Partner")}</th>
                      <th style={thStyle}>{t("Code")}</th>
                      <th style={thStyle}>{t("Contact")}</th>
                      <th style={thStyle}>{t("KYC Status")}</th>
                      <th style={thStyle}>{t("Actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingKycTeam.map((member) => (
                      <tr key={member.id}>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: 700, color: C.text }}>{member.first_name} {member.last_name}</span>
                        </td>
                        <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{member.partner_code}</td>
                        <td style={tdStyle}>{member.mobile}</td>
                        <td style={tdStyle}>
                          <span style={S.tag(member.kyc_status === 'rejected' ? C.red : C.gold)}>
                            {member.kyc_status || 'pending'}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <button
                            onClick={() => handleViewChildProfile(member.id)}
                            style={{
                              padding: '5px 10px', background: `${C.primary}12`, color: C.primary,
                              border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            View Uploads
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

          ) : (

            /* TAB: INACTIVE MEMBERS */
            <div style={{ overflowX: 'auto' }}>
              {inactiveTeam.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: C.textLight }}>
                  No inactive sub-partners in your team.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: C.bgSecondary }}>
                      <th style={thStyle}>{t("Partner")}</th>
                      <th style={thStyle}>{t("Code")}</th>
                      <th style={thStyle}>{t("Joined Date")}</th>
                      <th style={thStyle}>{t("KYC Status")}</th>
                      <th style={thStyle}>{t("Actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inactiveTeam.map((member) => (
                      <tr key={member.id}>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: 700, color: C.text }}>{member.first_name} {member.last_name}</span>
                        </td>
                        <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{member.partner_code}</td>
                        <td style={tdStyle}>{new Date(member.created_at).toLocaleDateString()}</td>
                        <td style={tdStyle}>
                          <span style={S.tag(member.kyc_status === 'approved' ? C.green : C.gold)}>
                            {member.kyc_status || 'pending'}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <button
                            onClick={() => handleViewChildProfile(member.id)}
                            style={{
                              padding: '5px 10px', background: `${C.primary}12`, color: C.primary,
                              border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Inspect Profile
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

          )}
        </div>
      </div>

      {/* Child Partner Details Side Drawer (Overlay) */}
      {selectedChildId && selectedChildProfile && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 110,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'flex-end'
        }} onClick={() => setSelectedChildId(null)}>
          
          <div style={{
            background: C.card, width: '100%', maxWidth: '580px', height: '100%',
            boxShadow: '-10px 0 40px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column',
            animation: 'slideIn .25s ease-out'
          }} onClick={e => e.stopPropagation()}>
            
            {/* Drawer Header */}
            <div style={{
              padding: '20px', borderBottom: `1px solid ${C.border}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: C.bgSecondary
            }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: 0 }}>
                  {selectedChildProfile.first_name} {selectedChildProfile.last_name}
                </h3>
                <span style={{ fontSize: '11px', color: C.textLight, fontFamily: 'monospace' }}>
                  Code: {selectedChildProfile.partner_code}
                </span>
              </div>
              <button 
                onClick={() => setSelectedChildId(null)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <MdClose size={24} />
              </button>
            </div>

            {/* Inner Drawer Navigation Tabs */}
            <div style={{
              display: 'flex', background: C.bgSecondary, borderBottom: `1px solid ${C.border}`,
              overflowX: 'auto', padding: '0 10px'
            }}>
              {[
                { id: 'personal', label: 'Personal' },
                { id: 'business', label: 'Business' },
                { id: 'bank', label: 'Bank' },
                { id: 'kyc', label: 'KYC & Video' },
                { id: 'leads', label: 'Leads List' },
                { id: 'commission', label: 'Commission' },
                { id: 'performance', label: 'Performance' }
              ].map(tTab => (
                <button
                  key={tTab.id}
                  onClick={() => setActiveDrawerTab(tTab.id)}
                  style={{
                    padding: '12px 14px', border: 'none', background: 'transparent',
                    fontSize: '12px', fontWeight: activeDrawerTab === tTab.id ? 800 : 500,
                    color: activeDrawerTab === tTab.id ? C.primary : C.textMid,
                    borderBottom: activeDrawerTab === tTab.id ? `2px solid ${C.primary}` : 'none',
                    cursor: 'pointer', whiteSpace: 'nowrap'
                  }}
                >
                  {tTab.label}
                </button>
              ))}
            </div>

            {/* Drawer Body Scroll Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              
              {activeDrawerTab === 'personal' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 800, margin: 0, color: C.primary }}>{t("Contact & Account Details")}</h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: C.textLight }}>{t("Email")}</span>
                      <p style={{ margin: '4px 0 0', fontWeight: 600, fontSize: '13px', color: C.text }}>{selectedChildProfile.email}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: C.textLight }}>{t("Mobile")}</span>
                      <p style={{ margin: '4px 0 0', fontWeight: 600, fontSize: '13px', color: C.text }}>{selectedChildProfile.mobile}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: C.textLight }}>{t("Address")}</span>
                      <p style={{ margin: '4px 0 0', fontWeight: 600, fontSize: '13px', color: C.text }}>{selectedChildProfile.current_address || 'N/A'}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: C.textLight }}>{t("Pincode")}</span>
                      <p style={{ margin: '4px 0 0', fontWeight: 600, fontSize: '13px', color: C.text }}>{selectedChildProfile.pincode || 'N/A'}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: C.textLight }}>{t("KYC Review Status")}</span>
                      <p style={{ margin: '4px 0 0' }}>
                        <span style={S.tag(selectedChildProfile.kyc_status === 'approved' ? C.green : C.gold)}>
                          {selectedChildProfile.kyc_status || 'pending'}
                        </span>
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: C.textLight }}>{t("Account Status")}</span>
                      <p style={{ margin: '4px 0 0' }}>
                        <span style={S.tag(selectedChildProfile.account_status === 'active' ? C.green : C.red)}>
                          {selectedChildProfile.account_status || 'inactive'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeDrawerTab === 'business' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 800, margin: 0, color: C.primary }}>{t("Company Profile Info")}</h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: C.textLight }}>{t("Company Name")}</span>
                      <p style={{ margin: '4px 0 0', fontWeight: 600, fontSize: '13px', color: C.text }}>{selectedChildProfile.company_name || 'N/A'}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: C.textLight }}>{t("Company Type")}</span>
                      <p style={{ margin: '4px 0 0', fontWeight: 600, fontSize: '13px', color: C.text }}>{selectedChildProfile.company_type || 'N/A'}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: C.textLight }}>{t("GST Number")}</span>
                      <p style={{ margin: '4px 0 0', fontWeight: 600, fontSize: '13px', color: C.text }}>{selectedChildProfile.gst_number || 'N/A'}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: C.textLight }}>{t("Location")}</span>
                      <p style={{ margin: '4px 0 0', fontWeight: 600, fontSize: '13px', color: C.text }}>{selectedChildProfile.business_location || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeDrawerTab === 'bank' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 800, margin: 0, color: C.primary }}>{t("Direct Settlement Bank Details")}</h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: C.textLight }}>{t("Bank Name")}</span>
                      <p style={{ margin: '4px 0 0', fontWeight: 600, fontSize: '13px', color: C.text }}>{selectedChildProfile.bank_name || 'N/A'}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: C.textLight }}>{t("Account Number")}</span>
                      <p style={{ margin: '4px 0 0', fontWeight: 600, fontSize: '13px', color: C.text }}>{selectedChildProfile.account_number || 'N/A'}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: C.textLight }}>{t("IFSC Code")}</span>
                      <p style={{ margin: '4px 0 0', fontWeight: 600, fontSize: '13px', color: C.text }}>{selectedChildProfile.ifsc_code || 'N/A'}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: C.textLight }}>{t("Holder Name")}</span>
                      <p style={{ margin: '4px 0 0', fontWeight: 600, fontSize: '13px', color: C.text }}>{selectedChildProfile.account_holder_name || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeDrawerTab === 'kyc' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 800, margin: 0, color: C.primary }}>{t("Verification Files & Docs")}</h4>
                  
                  {selectedChildProfile.kyc_documents?.length === 0 ? (
                    <p style={{ fontSize: '13px', color: C.textLight }}>{t("No documents have been uploaded by this sub-partner.")}</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {selectedChildProfile.kyc_documents.map(doc => (
                        <div key={doc.id} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '10px 14px', background: C.bgSecondary, borderRadius: '10px'
                        }}>
                          <div>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: C.text }}>
                              {doc.doc_type?.toUpperCase()}
                            </span>
                            <p style={{ margin: '2px 0 0', fontSize: '11px', color: C.textLight }}>
                              Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                            </p>
                          </div>
                          
                          <a 
                            href={doc.file_url} 
                            target="_blank" 
                            rel="noreferrer"
                            style={{
                              fontSize: '11px', fontWeight: 700, color: C.primary, textDecoration: 'none'
                            }}
                          >
                            Open Link
                          </a>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedChildProfile.partner_video && (
                    <div style={{ marginTop: '10px' }}>
                      <h5 style={{ fontSize: '12px', fontWeight: 700, margin: '0 0 6px', color: C.text }}>{t("Video KYC Submission")}</h5>
                      <video 
                        src={selectedChildProfile.partner_video.video_url} 
                        controls 
                        style={{ width: '100%', borderRadius: '12px', background: '#000' }} 
                      />
                    </div>
                  )}
                </div>
              )}

              {activeDrawerTab === 'leads' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 800, margin: 0, color: C.primary }}>{t("Submissions Ledger")}</h4>
                  
                  {!selectedChildDashboard?.recent_applications || selectedChildDashboard.recent_applications.length === 0 ? (
                    <p style={{ fontSize: '13px', color: C.textLight }}>{t("This partner hasn't logged any applications yet.")}</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {selectedChildDashboard.recent_applications.map((app, idx) => (
                        <div key={idx} style={{
                          padding: '12px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '12px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: C.text }}>{app.customer_name}</span>
                            <span style={S.tag(app.status === 'approved' ? C.green : app.status === 'rejected' ? C.red : C.gold)}>
                              {app.status}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: C.textLight }}>
                            <span>{app.product_name} ({app.bank_code})</span>
                            <span>{new Date(app.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeDrawerTab === 'commission' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 800, margin: 0, color: C.primary }}>{t("Earnings Profile")}</h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div style={{ padding: '12px', background: C.bgSecondary, borderRadius: '10px' }}>
                      <span style={{ fontSize: '11px', color: C.textLight }}>{t("Total Earnings")}</span>
                      <p style={{ margin: '4px 0 0', fontWeight: 700, fontSize: '14px', color: C.green }}>
                        ₹{parseFloat(selectedChildDashboard?.wallet?.total_earned || 0).toFixed(2)}
                      </p>
                    </div>
                    <div style={{ padding: '12px', background: C.bgSecondary, borderRadius: '10px' }}>
                      <span style={{ fontSize: '11px', color: C.textLight }}>{t("Available Balance")}</span>
                      <p style={{ margin: '4px 0 0', fontWeight: 700, fontSize: '14px', color: C.text }}>
                        ₹{parseFloat(selectedChildDashboard?.wallet?.available_balance || 0).toFixed(2)}
                      </p>
                    </div>
                    <div style={{ padding: '12px', background: C.bgSecondary, borderRadius: '10px' }}>
                      <span style={{ fontSize: '11px', color: C.textLight }}>{t("Hold / Pending balance")}</span>
                      <p style={{ margin: '4px 0 0', fontWeight: 700, fontSize: '14px', color: C.gold }}>
                        ₹{parseFloat(selectedChildDashboard?.wallet?.hold_balance || 0).toFixed(2)}
                      </p>
                    </div>
                    <div style={{ padding: '12px', background: C.bgSecondary, borderRadius: '10px' }}>
                      <span style={{ fontSize: '11px', color: C.textLight }}>{t("Total Settled / Withdrawn")}</span>
                      <p style={{ margin: '4px 0 0', fontWeight: 700, fontSize: '14px', color: C.text }}>
                        ₹{parseFloat(selectedChildDashboard?.wallet?.total_withdrawn || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeDrawerTab === 'performance' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 800, margin: 0, color: C.primary }}>{t("Sales & Leads Performance")}</h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div style={{ padding: '10px', background: C.bgSecondary, borderRadius: '10px' }}>
                      <span style={{ fontSize: '11px', color: C.textLight }}>{t("Applications")}</span>
                      <p style={{ margin: '2px 0 0', fontWeight: 700, color: C.text }}>
                        {selectedChildDashboard?.applications?.total || 0}
                      </p>
                    </div>
                    <div style={{ padding: '10px', background: C.bgSecondary, borderRadius: '10px' }}>
                      <span style={{ fontSize: '11px', color: C.textLight }}>{t("Approved")}</span>
                      <p style={{ margin: '2px 0 0', fontWeight: 700, color: C.green }}>
                        {selectedChildDashboard?.applications?.approved || 0}
                      </p>
                    </div>
                    <div style={{ padding: '10px', background: C.bgSecondary, borderRadius: '10px' }}>
                      <span style={{ fontSize: '11px', color: C.textLight }}>{t("Rejected")}</span>
                      <p style={{ margin: '2px 0 0', fontWeight: 700, color: C.red }}>
                        {selectedChildDashboard?.applications?.rejected || 0}
                      </p>
                    </div>
                    <div style={{ padding: '10px', background: C.bgSecondary, borderRadius: '10px' }}>
                      <span style={{ fontSize: '11px', color: C.textLight }}>{t("Pending")}</span>
                      <p style={{ margin: '2px 0 0', fontWeight: 700, color: C.gold }}>
                        {selectedChildDashboard?.applications?.pending || 0}
                      </p>
                    </div>
                  </div>

                  {selectedChildDashboard?.applications?.total > 0 && (
                    <div style={{ padding: '14px', background: `${C.green}12`, borderRadius: '12px', border: `1px solid ${C.green}20` }}>
                      <span style={{ fontSize: '11px', color: C.textLight, fontWeight: 700 }}>{t("SALES CONVERSION RATE")}</span>
                      <h4 style={{ fontSize: '22px', fontWeight: 800, color: C.green, margin: '4px 0 0' }}>
                        {((selectedChildDashboard.applications.approved / selectedChildDashboard.applications.total) * 100).toFixed(0)}%
                      </h4>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div style={{
              padding: '16px 20px', borderTop: `1px solid ${C.border}`,
              background: C.bgSecondary, display: 'flex'
            }}>
              <button 
                onClick={() => setSelectedChildId(null)}
                style={{ ...S.btn('outline'), width: '100%', padding: '10px' }}
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Direct Partner Modal */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', padding: '16px'
        }}>
          <div style={{
            background: C.card, borderRadius: '20px', width: '100%', maxWidth: '440px',
            overflow: 'hidden', border: `1px solid ${C.border}`,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{
              padding: '16px 20px', borderBottom: `1px solid ${C.border}`,
              background: C.bgSecondary, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: 0 }}>{t("Add Direct Partner")}</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: C.textLight, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <MdClose size={20} />
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {addError && <div style={{
                padding: '10px 14px', background: `${C.red}12`, border: `1px solid ${C.red}25`,
                color: C.red, borderRadius: '10px', fontSize: '13px', fontWeight: 600
              }}>{addError}</div>}
              
              <form id="add-team-form" onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={S.label}>{t("First Name *")}</label>
                    <input type="text" required value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} style={S.input} />
                  </div>
                  <div>
                    <label style={S.label}>{t("Last Name")}</label>
                    <input type="text" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} style={S.input} />
                  </div>
                </div>

                <div>
                  <label style={S.label}>{t("Email Address *")}</label>
                  <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={S.input} />
                </div>

                <div>
                  <label style={S.label}>{t("Mobile Number *")}</label>
                  <input type="tel" required pattern="[0-9]{10}" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} style={S.input} />
                </div>

                <div>
                  <label style={S.label}>{t("Initial Password *")}</label>
                  <input type="text" required minLength={6} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={S.input} />
                  <p style={{
                    fontSize: '11px', color: C.gold, background: `${C.gold}12`,
                    padding: '8px 12px', borderRadius: '8px', border: `1px solid ${C.gold}25`,
                    margin: '8px 0 0', fontWeight: 600
                  }}>
                    User will be forced to change this upon first login.
                  </p>
                </div>
              </form>
            </div>

            <div style={{
              padding: '16px 20px', borderTop: `1px solid ${C.border}`,
              background: C.bgSecondary, display: 'flex', gap: '10px'
            }}>
              <button type="button" onClick={() => setIsAddModalOpen(false)} style={{
                ...S.btn('outline'), flex: 1, padding: '10px', fontSize: '14px', borderRadius: '10px'
              }}>
                Cancel
              </button>
              <button type="submit" form="add-team-form" disabled={addLoading} style={{
                ...S.btn('primary'), flex: 2, padding: '10px', fontSize: '14px', border: 'none', borderRadius: '10px',
                cursor: addLoading ? 'not-allowed' : 'pointer', opacity: addLoading ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {addLoading ? (
                  <span style={{
                    width: 18, height: 18, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                    animation: 'spin .8s linear infinite', display: 'inline-block'
                  }} />
                ) : 'Create Partner Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {isQrOpen && referralInfo && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', padding: '16px'
        }}>
          <div style={{
            background: C.card, borderRadius: '20px', width: '100%', maxWidth: '320px',
            border: `1px solid ${C.border}`, padding: '24px', display: 'flex',
            flexDirection: 'column', alignItems: 'center', gap: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: C.text }}>{t("Referral QR Code")}</h3>
              <button 
                onClick={() => setIsQrOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textLight }}
              >
                <MdClose size={20} />
              </button>
            </div>
            
            <div style={{
              background: '#fff', padding: '12px', borderRadius: '12px',
              border: `1px solid ${C.border}`, boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(referralInfo.referral_link)}`} 
                alt="Referral QR Code" 
                style={{ width: '180px', height: '180px', display: 'block' }}
              />
            </div>

            <p style={{ fontSize: '11px', color: C.textLight, textAlign: 'center', margin: 0 }}>
              Scan this code to load the partner registration form with referral code <span style={{ fontWeight: 700, color: C.primary }}>{referralInfo.referral_code}</span>
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes slideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
      `}</style>
    </div>
  );
}
