import React, { useState, useEffect } from 'react';
import {
  Users, Layers, List, TrendingUp, Activity, Target, Settings,
  RefreshCw, AlertCircle, UserPlus, Send
} from 'lucide-react';
import TeamDashboardTab from './team/TeamDashboardTab';
import TeamTreeTab from './team/TeamTreeTab';
import TeamMembersTab from './team/TeamMembersTab';
import TeamAnalyticsTab from './team/TeamAnalyticsTab';
import TeamActivityTab from './team/TeamActivityTab';
import TeamGoalsTab from './team/TeamGoalsTab';
import TeamSettingsTab from './team/TeamSettingsTab';
import TeamMemberDrawer from './team/TeamMemberDrawer';
import { useAuthStore } from '../../../app/store/authStore';
import { useTheme } from '../../../contexts/ThemeContext';
import api from '../../../services/api';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: Users },
  { id: 'tree', label: 'Team Tree', icon: Layers },
  { id: 'members', label: 'Members', icon: List },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function PartnerTeam() {
  const { C, isDark } = useTheme();
  const user = useAuthStore((s) => s.user);
  const isTeamMember = user?.role === 'TEAM_MEMBER';

  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [error, setError] = useState(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ fullName: '', email: '', mobile: '' });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');
  const [upgradeStatus, setUpgradeStatus] = useState(null);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeMsg, setUpgradeMsg] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (isTeamMember) checkUpgradeStatus();
    else fetchDashboard();
  }, [isTeamMember]);

  const checkUpgradeStatus = async () => {
    try {
      const res = await api.get('/team/upgrade-status');
      if (res.data?.success) setUpgradeStatus(res.data.data?.status);
    } catch { /* silent */ } finally { setLoadingDashboard(false); }
  };

  const handleRequestUpgrade = async () => {
    setUpgradeLoading(true);
    setUpgradeMsg('');
    try {
      const res = await api.post('/team/upgrade-request', {});
      if (res.data?.success) {
        setUpgradeStatus('PENDING');
        setUpgradeMsg(res.data.message || 'Upgrade request submitted.');
      }
    } catch (err) {
      setUpgradeMsg(err.response?.data?.message || 'Failed to submit upgrade request');
    } finally { setUpgradeLoading(false); }
  };

  const fetchDashboard = async () => {
    setLoadingDashboard(true);
    setError(null);
    try {
      const res = await api.get('/team/dashboard');
      if (res.data?.success) setDashboardData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load team dashboard');
    } finally { setLoadingDashboard(false); }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteMessage('');
    try {
      const res = await api.post('/partner/team/invite', inviteForm);
      if (res.data?.success) {
        setInviteMessage('✅ Invite sent successfully!');
        setInviteForm({ fullName: '', email: '', mobile: '' });
        setTimeout(() => { setInviteModalOpen(false); setInviteMessage(''); fetchDashboard(); }, 1500);
      }
    } catch (err) {
      setInviteMessage(err.response?.data?.message || '❌ Failed to send invite');
    } finally { setInviteLoading(false); }
  };

  const bg = isDark ? '#000' : C.bg;
  const cardBg = isDark ? '#0f0f0f' : '#fff';
  const border = isDark ? '#1f1f1f' : C.border;
  const textPrimary = C.text;
  const textMuted = C.textMid;
  const accent = C.primary;

  if (isTeamMember) {
    return (
      <div style={{ minHeight: '100vh', background: bg, padding: '16px' }}
        className="transition-all duration-500">
        <div style={{
          maxWidth: 680, margin: '0 auto',
          background: isDark ? 'linear-gradient(135deg,#0f0f0f,#1a1a2e)' : 'linear-gradient(135deg,#f0f4ff,#fff)',
          border: `1px solid ${border}`, borderRadius: 24,
          padding: '32px 24px', boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.6)' : '0 8px 40px rgba(79,70,229,0.1)',
          opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: `${accent}20`, border: `1px solid ${accent}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24
            }}>⭐</div>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: textPrimary, margin: 0 }}>Team Member Portal</h2>
              <p style={{ fontSize: 13, color: textMuted, margin: '4px 0 0' }}>You are registered as a Team Member</p>
            </div>
          </div>

          <div style={{ background: isDark ? '#111' : '#f8faff', border: `1px solid ${border}`, borderRadius: 16, padding: 20, marginBottom: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: textPrimary, marginBottom: 12 }}>What you can do:</h3>
            <ul style={{ paddingLeft: 20, margin: 0, color: textMuted, fontSize: 13, lineHeight: 2 }}>
              <li>Sell products directly and earn product commissions.</li>
              <li>Refer new partners and earn <span style={{ color: '#10b981', fontWeight: 700 }}>₹500 bonus</span> after 3 approvals.</li>
              <li>Track applications and wallet earnings in real time.</li>
            </ul>
          </div>

          <div style={{ background: isDark ? '#0d0d1a' : '#f0f4ff', border: `1px solid ${accent}30`, borderRadius: 16, padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: accent, marginBottom: 8 }}>Upgrade to Partner</h3>
            <p style={{ fontSize: 13, color: textMuted, marginBottom: 20, lineHeight: 1.7 }}>
              Build your own team network, manage downline partners, and earn multi-tier override commissions.
            </p>
            {upgradeStatus === 'PENDING' ? (
              <div style={{ padding: '12px 16px', borderRadius: 12, background: '#f59e0b15', border: '1px solid #f59e0b40', color: '#f59e0b', fontSize: 13, fontWeight: 600 }}>
                ⏳ Upgrade request is under review by Super Admin.
              </div>
            ) : upgradeStatus === 'APPROVED' ? (
              <div style={{ padding: '12px 16px', borderRadius: 12, background: '#10b98115', border: '1px solid #10b98140', color: '#10b981', fontSize: 13, fontWeight: 600 }}>
                ✅ Upgrade approved! Please refresh your session.
              </div>
            ) : (
              <>
                <button onClick={handleRequestUpgrade} disabled={upgradeLoading}
                  style={{
                    padding: '12px 24px', borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: `linear-gradient(135deg, ${accent}, ${C.primaryDark})`,
                    color: '#fff', fontWeight: 700, fontSize: 14,
                    boxShadow: `0 4px 20px ${accent}40`,
                    opacity: upgradeLoading ? 0.6 : 1,
                    transition: 'all 0.2s'
                  }}>
                  {upgradeLoading ? 'Submitting...' : '🚀 Request Partner Upgrade'}
                </button>
                {upgradeMsg && <p style={{ fontSize: 12, color: textMuted, marginTop: 8 }}>{upgradeMsg}</p>}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: bg, padding: '12px' }}
      className="transition-all duration-500">

      {/* Header */}
      <div style={{
        background: isDark
          ? 'linear-gradient(135deg,#0f0f0f 0%,#0d0d1a 100%)'
          : 'linear-gradient(135deg,#f0f4ff 0%,#fff 100%)',
        border: `1px solid ${border}`,
        borderRadius: 20, padding: '20px 24px', marginBottom: 16,
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        boxShadow: isDark ? '0 8px 40px rgba(0,0,0,0.5)' : '0 4px 24px rgba(79,70,229,0.08)',
        opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(-16px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease'
      }}>
        <div>
          <h1 style={{ fontSize: 'clamp(18px,4vw,26px)', fontWeight: 900, color: textPrimary, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={26} color={accent} />
            Team Management
          </h1>
          <p style={{ fontSize: 13, color: textMuted, margin: '4px 0 0' }}>
            Real-time downline metrics, team tree, analytics & member management
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => setInviteModalOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 18px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: `linear-gradient(135deg, ${accent}, ${C.primaryDark})`,
              color: '#fff', fontWeight: 700, fontSize: 13,
              boxShadow: `0 4px 16px ${accent}40`,
              transition: 'all 0.2s'
            }}>
            <UserPlus size={15} /> Invite Member
          </button>
          <button onClick={fetchDashboard}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 16px', borderRadius: 12, border: `1px solid ${border}`, cursor: 'pointer',
              background: isDark ? '#1a1a1a' : '#f8faff',
              color: textPrimary, fontWeight: 700, fontSize: 13,
              transition: 'all 0.2s'
            }}>
            <RefreshCw size={14} className={loadingDashboard ? 'animate-spin' : ''} style={{ color: accent }} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px', borderRadius: 14, marginBottom: 16,
          background: '#ef444415', border: '1px solid #ef444440', color: '#ef4444', fontSize: 13, fontWeight: 600
        }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 6, padding: 6,
        background: isDark ? '#0a0a0a' : '#f1f5f9',
        border: `1px solid ${border}`, borderRadius: 16, marginBottom: 16,
        overflowX: 'auto', scrollbarWidth: 'none'
      }}>
        {tabs.map((tab, i) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '9px 14px', borderRadius: 11, border: 'none', cursor: 'pointer',
                whiteSpace: 'nowrap', fontSize: 12, fontWeight: 700,
                background: isActive ? `linear-gradient(135deg, ${accent}, ${C.primaryDark})` : 'transparent',
                color: isActive ? '#fff' : textMuted,
                boxShadow: isActive ? `0 4px 14px ${accent}40` : 'none',
                transform: isActive ? 'scale(1.03)' : 'scale(1)',
                transition: 'all 0.2s ease',
                animationDelay: `${i * 50}ms`
              }}>
              <Icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div key={activeTab} style={{
        opacity: 0, animation: 'fadeSlideUp 0.35s ease forwards'
      }}>
        <style>{`
          @keyframes fadeSlideUp {
            from { opacity: 0; transform: translateY(12px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        {activeTab === 'dashboard' && <TeamDashboardTab data={dashboardData} loading={loadingDashboard} onSelectMember={setSelectedMemberId} />}
        {activeTab === 'tree' && <TeamTreeTab onSelectMember={setSelectedMemberId} />}
        {activeTab === 'members' && <TeamMembersTab onSelectMember={setSelectedMemberId} />}
        {activeTab === 'analytics' && <TeamAnalyticsTab />}
        {activeTab === 'activity' && <TeamActivityTab onSelectMember={setSelectedMemberId} />}
        {activeTab === 'goals' && <TeamGoalsTab onSelectMember={setSelectedMemberId} />}
        {activeTab === 'settings' && <TeamSettingsTab />}
      </div>

      {selectedMemberId && (
        <TeamMemberDrawer memberId={selectedMemberId} onClose={() => setSelectedMemberId(null)} onSelectSubMember={setSelectedMemberId} />
      )}

      {/* Invite Modal */}
      {inviteModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', padding: 16
        }}>
          <div style={{
            width: '100%', maxWidth: 460,
            background: isDark ? '#0f0f0f' : '#fff',
            border: `1px solid ${border}`, borderRadius: 24,
            overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
            animation: 'fadeSlideUp 0.3s ease'
          }}>
            <div style={{ padding: '20px 24px', background: `linear-gradient(135deg, ${accent}, ${C.primaryDark})` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.15)' }}>
                  <UserPlus size={18} color="#fff" />
                </div>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>Invite Team Member</h2>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', margin: '2px 0 0' }}>Add a new partner to your network</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleInviteSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Full Name *', name: 'fullName', type: 'text', placeholder: 'E.g., Rajesh Kumar' },
                { label: 'Email Address *', name: 'email', type: 'email', placeholder: 'rajesh@example.com' },
                { label: 'Mobile Number *', name: 'mobile', type: 'tel', placeholder: '9876543210' },
              ].map(f => (
                <div key={f.name}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: textMuted, display: 'block', marginBottom: 6 }}>{f.label}</label>
                  <input type={f.type} name={f.name} required placeholder={f.placeholder}
                    value={inviteForm[f.name]}
                    onChange={e => setInviteForm(p => ({ ...p, [f.name]: e.target.value }))}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 12, fontSize: 13,
                      border: `1.5px solid ${border}`, background: isDark ? '#1a1a1a' : '#f8faff',
                      color: textPrimary, outline: 'none', boxSizing: 'border-box',
                      transition: 'border-color 0.2s'
                    }} />
                </div>
              ))}

              {inviteMessage && (
                <div style={{
                  padding: '10px 14px', borderRadius: 12, fontSize: 13, fontWeight: 600,
                  background: inviteMessage.includes('✅') ? '#10b98115' : '#ef444415',
                  border: `1px solid ${inviteMessage.includes('✅') ? '#10b98140' : '#ef444440'}`,
                  color: inviteMessage.includes('✅') ? '#10b981' : '#ef4444'
                }}>{inviteMessage}</div>
              )}

              <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
                <button type="button" onClick={() => { setInviteModalOpen(false); setInviteMessage(''); setInviteForm({ fullName: '', email: '', mobile: '' }); }}
                  style={{
                    flex: 1, padding: '11px', borderRadius: 12, border: `1px solid ${border}`,
                    background: isDark ? '#1a1a1a' : '#f1f5f9', color: textPrimary,
                    fontWeight: 700, fontSize: 13, cursor: 'pointer'
                  }}>Cancel</button>
                <button type="submit" disabled={inviteLoading}
                  style={{
                    flex: 1, padding: '11px', borderRadius: 12, border: 'none',
                    background: `linear-gradient(135deg, ${accent}, ${C.primaryDark})`,
                    color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    opacity: inviteLoading ? 0.6 : 1, boxShadow: `0 4px 16px ${accent}40`
                  }}>
                  {inviteLoading ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                  {inviteLoading ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </form>

            <div style={{ padding: '12px 24px', background: isDark ? '#0a0a0a' : '#f8faff', borderTop: `1px solid ${border}`, fontSize: 11, color: textMuted }}>
              Invitation sent via email and SMS with registration link and team join code.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
