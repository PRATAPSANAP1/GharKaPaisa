import React, { useState, useEffect } from 'react';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import { 
  MdAdd, MdPerson, MdEmail, MdPhone, MdCheckCircle, 
  MdPendingActions, MdClose, MdContentCopy,
  MdOutlineQrCode2, MdOutlineWhatsapp, MdMonetizationOn, 
  MdTrendingUp, MdDeviceHub, MdList, MdHistory, MdShare
} from 'react-icons/md';
import api from '../../../services/api';
import { useAuthStore } from '../../../app/store/authStore';

export default function PartnerTeam() {
  const { C, isDark } = useTheme();
  const S = makeS(C);

  const user = useAuthStore((state) => state.user);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'tree' | 'list' | 'earnings'
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', mobile: '', password: ''
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  const [referralInfo, setReferralInfo] = useState(null);
  const [teamTree, setTeamTree] = useState([]);
  const [teamDashboard, setTeamDashboard] = useState(null);
  const [teamEarnings, setTeamEarnings] = useState([]);

  const fetchTeam = async () => {
    try {
      const res = await api.get(`/partner/${user.PartnerId}/team`);
      setTeam(res.data.data || []);
    } catch (err) {
      setError('Failed to load direct team members');
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
    if (!user?.PartnerId) return;
    setLoading(true);
    setError('');
    try {
      await Promise.all([
        fetchTeam(),
        loadReferralInfo(),
        loadTeamTree(),
        loadTeamDashboard(),
        loadTeamEarnings()
      ]);
    } catch (err) {
      setError('Failed to load team information');
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
      await api.post(`/partner/${user.PartnerId}/team`, formData);
      setIsAddModalOpen(false);
      setFormData({ first_name: '', last_name: '', email: '', mobile: '', password: '' });
      loadAllData();
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to add team member');
    } finally {
      setAddLoading(false);
    }
  };

  const copyReferralLink = () => {
    const link = referralInfo?.referral_link || `https://gharkapaisa.in/register?ref=${user?.PartnerCode || 'GKP'}`;
    navigator.clipboard.writeText(link);
    alert('Referral link copied to clipboard!');
  };

  const shareOnWhatsapp = () => {
    const link = referralInfo?.referral_link || `https://gharkapaisa.in/register?ref=${user?.PartnerCode || 'GKP'}`;
    const text = `Join my GharKaPaisa partner network using my invite link and start earning: ${link}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
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
          borderRadius: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}>
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
                {member.Partner_code} • Level {member.level}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: C.text, margin: 0 }}>Team Network</h2>
          <p style={{ fontSize: '14px', color: C.textMid, margin: '4px 0 0' }}>Manage your DSA partners, monitor structure hierarchy, and view override commissions.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          style={{
            ...S.btn('primary'), border: 'none', borderRadius: '10px',
            display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'
          }}
        >
          <MdAdd size={20} /> Add Direct Partner
        </button>
      </div>

      {/* Overview Cards (DSA Dashboard Stats) */}
      {teamDashboard && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ ...S.card, padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ padding: '12px', background: `${C.primary}12`, color: C.primary, borderRadius: '12px' }}>
              <MdPerson size={24} />
            </div>
            <div>
              <p style={{ fontSize: '12px', color: C.textLight, margin: 0, fontWeight: 600 }}>Total Team Size</p>
              <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '4px 0 0', color: C.text }}>{teamDashboard.total_members}</h3>
            </div>
          </div>

          <div style={{ ...S.card, padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ padding: '12px', background: `${C.green}12`, color: C.green, borderRadius: '12px' }}>
              <MdTrendingUp size={24} />
            </div>
            <div>
              <p style={{ fontSize: '12px', color: C.textLight, margin: 0, fontWeight: 600 }}>Today's Joins</p>
              <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '4px 0 0', color: C.text }}>{teamDashboard.joined_today}</h3>
            </div>
          </div>

          <div style={{ ...S.card, padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ padding: '12px', background: `${C.gold}12`, color: C.gold, borderRadius: '12px' }}>
              <MdPendingActions size={24} />
            </div>
            <div>
              <p style={{ fontSize: '12px', color: C.textLight, margin: 0, fontWeight: 600 }}>Pending KYC</p>
              <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '4px 0 0', color: C.text }}>{teamDashboard.pending_kyc}</h3>
            </div>
          </div>

          <div style={{ ...S.card, padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ padding: '12px', background: `${C.primary}12`, color: C.primary, borderRadius: '12px' }}>
              <MdMonetizationOn size={24} />
            </div>
            <div>
              <p style={{ fontSize: '12px', color: C.textLight, margin: 0, fontWeight: 600 }}>Monthly Team Earn</p>
              <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '4px 0 0', color: C.text }}>₹{teamDashboard.monthly_team_earnings.toFixed(2)}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Referral Tools Banner */}
      <div style={{
        background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
        borderRadius: '16px',
        padding: '24px 28px',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div style={{
          position: 'absolute', right: 0, top: 0, width: 200, height: 200,
          background: '#fff', opacity: 0.05, borderRadius: '50%', filter: 'blur(40px)',
          marginRight: '-40px', marginTop: '-40px', pointerEvents: 'none'
        }} />
        
        <div style={{ flex: 1, minWidth: '280px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>Invite Partners & Earn Override Commissions</h3>
          <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)', margin: 0, maxWidth: '440px' }}>
            Invite other partners. Share your link, track total registrations, and earn configurable team share overrides.
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button 
            onClick={copyReferralLink}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 18px', background: C.card, color: C.primary,
              borderRadius: '10px', border: 'none', fontWeight: 700, fontSize: '13px',
              cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
          >
            <MdContentCopy size={16} /> Copy Link
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
            <MdOutlineWhatsapp size={16} /> WhatsApp
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
            <MdOutlineQrCode2 size={16} /> QR Code
          </button>
        </div>
      </div>

      {/* Network View Controls */}
      <div style={{ ...S.card, padding: 0, borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{
          display: 'flex', borderBottom: `1px solid ${C.border}`,
          padding: '6px', gap: '6px', background: C.bgSecondary
        }}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: MdPerson },
            { id: 'tree', label: 'Graphical Tree', icon: MdDeviceHub },
            { id: 'list', label: 'Directory List', icon: MdList },
            { id: 'earnings', label: 'Commission Logs', icon: MdHistory }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px', borderRadius: '10px', fontSize: '13px',
                fontWeight: 700, border: 'none', cursor: 'pointer',
                background: activeTab === tab.id ? C.card : 'transparent',
                color: activeTab === tab.id ? C.primary : C.textMid,
                boxShadow: activeTab === tab.id ? '0 2px 6px rgba(0,0,0,0.04)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '24px' }}>
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
          ) : activeTab === 'dashboard' ? (
            /* REFERRAL SUMMARY STATS */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px', color: C.text }}>Link Activity</h4>
                <div style={{ ...S.card, background: C.bgSecondary, padding: '20px', border: `1px dashed ${C.border}` }}>
                  <p style={{ fontSize: '12px', color: C.textLight, margin: 0, fontWeight: 700 }}>Total Invite Clicks</p>
                  <h2 style={{ fontSize: '32px', fontWeight: 800, margin: '8px 0', color: C.primary }}>{referralInfo?.total_invites || 0}</h2>
                  <p style={{ fontSize: '12px', color: C.textLight, margin: 0 }}>Registered Accounts: <span style={{ fontWeight: 700, color: C.text }}>{referralInfo?.total_registered || 0}</span></p>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px', color: C.text }}>Network Overview</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: C.bgSecondary, borderRadius: '12px' }}>
                    <span style={{ fontWeight: 600, fontSize: '13px' }}>KYC Approved Partners</span>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: C.green }}>{teamDashboard?.approved_partners || 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: C.bgSecondary, borderRadius: '12px' }}>
                    <span style={{ fontWeight: 600, fontSize: '13px' }}>KYC Rejected / Pending</span>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: C.gold }}>{(teamDashboard?.pending_kyc || 0) + (teamDashboard?.rejected_partners || 0)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: C.bgSecondary, borderRadius: '12px' }}>
                    <span style={{ fontWeight: 600, fontSize: '13px' }}>Blocked / Suspended Accounts</span>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: C.red }}>{(teamDashboard?.suspended_partners || 0) + (teamDashboard?.blocked_partners || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'tree' ? (
            /* COLLAPSIBLE GRAPHICAL TREE VIEW */
            <div style={{ padding: '10px 0' }}>
              {teamTree.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: C.textLight }}>
                  No members found in the hierarchy.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {teamTree.map(member => (
                    <TreeMemberNode key={member.id} member={member} />
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'list' ? (
            /* DIRECTORY TABLE LIST */
            <div style={{ overflowX: 'auto' }}>
              {team.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: C.textLight }}>
                  No team members to show in the list.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: C.bgSecondary }}>
                      <th style={thStyle}>Partner Info</th>
                      <th style={thStyle}>Contact</th>
                      <th style={thStyle}>Code</th>
                      <th style={thStyle}>KYC Status</th>
                      <th style={thStyle}>Date Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {team.map((member) => (
                      <tr key={member.id}>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: '50%',
                              background: `${C.primary}12`, color: C.primary,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 700, fontSize: '14px', border: `1px solid ${C.primary}20`
                            }}>
                              {member.first_name?.[0] || 'P'}
                            </div>
                            <div>
                              <p style={{ fontWeight: 700, color: C.text, margin: 0 }}>{member.first_name} {member.last_name}</p>
                            </div>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ fontSize: '13px' }}>{member.email}</div>
                            <div style={{ fontSize: '13px' }}>{member.mobile}</div>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            fontFamily: 'monospace', color: C.primary, background: `${C.primary}12`,
                            padding: '2px 8px', borderRadius: '4px', border: `1px solid ${C.primary}20`,
                            fontWeight: 700, fontSize: '11px', display: 'inline-block'
                          }}>
                            {member.Partner_code}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={S.tag(member.kyc_status === 'approved' ? C.green : member.kyc_status === 'rejected' ? C.red : C.gold)}>
                            {member.kyc_status || 'PENDING'}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 500 }}>
                          {new Date(member.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            /* COMMISSION LOGS */
            <div style={{ overflowX: 'auto' }}>
              {teamEarnings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: C.textLight }}>
                  No override commissions have been logged yet.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: C.bgSecondary }}>
                      <th style={thStyle}>Date</th>
                      <th style={thStyle}>Amount</th>
                      <th style={thStyle}>Product / Bank</th>
                      <th style={thStyle}>Status</th>
                      <th style={thStyle}>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamEarnings.map((txn) => (
                      <tr key={txn.id}>
                        <td style={tdStyle}>
                          {new Date(txn.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 700, color: C.green }}>
                          ₹{parseFloat(txn.amount).toFixed(2)}
                        </td>
                        <td style={tdStyle}>
                          <div>
                            <p style={{ fontWeight: 700, margin: 0, color: C.text }}>{txn.product_name || 'N/A'}</p>
                            <span style={{ fontSize: '11px', color: C.textLight }}>{txn.bank_name || 'N/A'}</span>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <span style={S.tag(txn.status === 'approved' ? C.green : txn.status === 'pending' ? C.gold : C.red)}>
                            {txn.status}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, fontSize: '12px', color: C.textLight }}>
                          {txn.description}
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
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: 0 }}>Add Direct Partner</h3>
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
                    <label style={S.label}>First Name *</label>
                    <input type="text" required value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} style={S.input} />
                  </div>
                  <div>
                    <label style={S.label}>Last Name</label>
                    <input type="text" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} style={S.input} />
                  </div>
                </div>

                <div>
                  <label style={S.label}>Email Address *</label>
                  <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={S.input} />
                </div>

                <div>
                  <label style={S.label}>Mobile Number *</label>
                  <input type="tel" required pattern="[0-9]{10}" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} style={S.input} />
                </div>

                <div>
                  <label style={S.label}>Initial Password *</label>
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
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: C.text }}>Referral QR Code</h3>
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

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
