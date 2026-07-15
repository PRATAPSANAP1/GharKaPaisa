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
  MdCloudDownload, MdSettings, MdChevronRight, MdExpandMore
} from 'react-icons/md';
import api from '../../../services/api';
import { useAuthStore } from '../../../app/store/authStore';

export default function PartnerTeam() {
  const { C } = useTheme();
  const S = makeS(C);
  const user = useAuthStore((state) => state.user);
  const { t } = useTranslation();

  const partnerId = user?.partner_id || user?.PartnerId;
  const partnerCode = user?.partner_code || user?.PartnerCode || '';

  // Tabs: 'dashboard' | 'tree' | 'analytics' | 'activity' | 'goals' | 'settings'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Data states
  const [dashboardData, setDashboardData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [teamList, setTeamList] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [treeNodes, setTreeNodes] = useState([]);
  
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

  // 360° Child Detail Slide-Over Drawer (8 Tabs)
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [childDetail, setChildDetail] = useState(null);
  const [loadingChild, setLoadingChild] = useState(false);
  const [activeDrawerTab, setActiveDrawerTab] = useState('overview'); // overview, applications, wallet, commission, activity, customers, team, reports

  // Fetch Dashboard & Analytics
  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [dashRes, anaRes] = await Promise.all([
        api.get('/team/dashboard'),
        api.get('/team/referral/analytics')
      ]);
      if (dashRes.data?.success) setDashboardData(dashRes.data.data);
      if (anaRes.data?.success) setAnalyticsData(anaRes.data.data);
    } catch (err) {
      console.error('Failed to load team metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Filtered Team Members List
  const loadTeamList = async () => {
    try {
      const res = await api.get('/team/list', {
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

  // Fetch Lazy Tree Nodes
  const loadTreeNodes = async (parentId = null) => {
    try {
      const res = await api.get('/team/tree', { params: { parent_id: parentId } });
      if (res.data?.success) setTreeNodes(res.data.data);
    } catch (err) {
      console.error('Failed to load tree hierarchy:', err);
    }
  };

  // Fetch Activity Log
  const loadActivityLogs = async () => {
    try {
      const res = await api.get('/team/activity');
      if (res.data?.success) setActivityLogs(res.data.data);
    } catch (err) {
      console.error('Failed to load activity logs:', err);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') loadTeamList();
    if (activeTab === 'tree') loadTreeNodes();
    if (activeTab === 'activity') loadActivityLogs();
  }, [activeTab, searchQuery, statusFilter, kycFilter, joinedFilter]);

  // Open 360 Child Detail
  const handleOpenChildDetail = async (childId) => {
    setSelectedChildId(childId);
    setLoadingChild(true);
    try {
      const res = await api.get(`/team/${childId}`);
      if (res.data?.success) setChildDetail(res.data.data);
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
      const res = await api.get('/team/referral/qr');
      if (res.data?.success) setQrResult(res.data.data);
    } catch (err) {
      alert('Failed to generate QR Code');
    } finally {
      setLoadingQr(false);
    }
  };

  const referralLink = `https://gharkapaisa.in/register?ref=${partnerId || partnerCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`Join my team on GharKaPaisa and earn highest financial commission payouts! Register here: ${referralLink}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: C.text, margin: 0 }}>Team & Referral Management System</h2>
          <p style={{ fontSize: '13px', color: C.textLight, margin: '4px 0 0 0' }}>Real-time referral link tracking, conversion funnels, parent override commissions & multi-level tree hierarchy.</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleCopyLink}
            style={{ ...S.btn('outline'), display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px' }}
          >
            <MdContentCopy size={16} />
            <span>{copied ? 'Copied!' : 'Copy Referral Link'}</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            style={{ ...S.btn('primary'), background: '#25D366', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px' }}
          >
            <MdOutlineWhatsapp size={18} />
            <span>Share WhatsApp</span>
          </button>

          <button
            onClick={handleOpenQR}
            style={{ ...S.btn('primary'), background: C.teal, display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px' }}
          >
            <MdOutlineQrCode2 size={18} />
            <span>Generate QR Code</span>
          </button>
        </div>
      </div>

      {/* Minimalist Summary Matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div style={{ ...S.card, padding: '20px', borderRadius: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: C.textLight, textTransform: 'uppercase' }}>Total Team Members</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: C.text, marginTop: '4px' }}>{dashboardData?.total_team || 0}</div>
        </div>

        <div style={{ ...S.card, padding: '20px', borderRadius: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: C.textLight, textTransform: 'uppercase' }}>Today's New Joins</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: C.teal, marginTop: '4px' }}>{dashboardData?.today_joins || 0}</div>
        </div>

        <div style={{ ...S.card, padding: '20px', borderRadius: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: C.textLight, textTransform: 'uppercase' }}>Active Team Partners</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: C.green, marginTop: '4px' }}>{dashboardData?.active_partners || 0}</div>
        </div>

        <div style={{ ...S.card, padding: '20px', borderRadius: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: C.textLight, textTransform: 'uppercase' }}>Total Team Override Earnings</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: C.gold, marginTop: '4px' }}>₹{parseFloat(dashboardData?.team_earnings || 0).toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* Referral Analytics Conversion Funnel Widget */}
      <div style={{ ...S.card, padding: '20px', borderRadius: '16px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: '0 0 16px 0' }}>Conversion Funnel Analytics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', textAlign: 'center' }}>
          {[
            { label: 'Referral Clicks', count: analyticsData?.clicks || 0, color: C.textMid },
            { label: 'Registrations', count: analyticsData?.registrations || 0, color: C.teal },
            { label: 'KYC Approved', count: analyticsData?.kyc_approved || 0, color: C.purple },
            { label: 'Applications', count: analyticsData?.applications || 0, color: C.gold },
            { label: 'Approved Payouts', count: analyticsData?.approved_applications || 0, color: C.green },
          ].map((item, idx) => (
            <div key={idx} style={{ background: C.bgSecondary, padding: '12px', borderRadius: '12px' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: item.color }}>{item.count}</div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, marginTop: '4px' }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: `1px solid ${C.border}`, paddingBottom: '2px', overflowX: 'auto' }}>
        {[
          { id: 'dashboard', label: 'Direct Team List', icon: MdPeople },
          { id: 'tree', label: 'Multi-Level Team Tree', icon: MdDeviceHub },
          { id: 'activity', label: 'Team Activity Feed', icon: MdTimeline },
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
                            360° Partner Details
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

      {/* TAB 2: LAZY-LOADING TEAM TREE */}
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
                    <div style={{ fontSize: '14px', fontWeight: 800, color: C.text }}>{node.full_name} ({node.partner_code})</div>
                    <div style={{ fontSize: '11px', color: C.textLight, marginTop: '2px' }}>
                      Level {node.level} • Joined {new Date(node.joined_at).toLocaleDateString()} • {node.children_count} Downline Members
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

      {/* TAB 3: TEAM ACTIVITY FEED */}
      {activeTab === 'activity' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activityLogs.map((act, idx) => (
            <div key={act.id || idx} style={{ ...S.card, padding: '14px 18px', display: 'flex', gap: '14px', alignItems: 'center' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: C.teal }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: C.text }}>{act.title}</div>
                <div style={{ fontSize: '12px', color: C.textLight, marginTop: '2px' }}>{act.description}</div>
              </div>
              <div style={{ fontSize: '11px', color: C.textLight }}>{new Date(act.created_at).toLocaleString()}</div>
            </div>
          ))}
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

      {/* 360° CHILD DETAIL SLIDE-OVER DRAWER (8 TABS) */}
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

            {/* Drawer 8 Tabs */}
            <div style={{ display: 'flex', overflowX: 'auto', background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, padding: '4px 12px' }}>
              {['overview', 'applications', 'wallet', 'commission', 'activity'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveDrawerTab(tab)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: activeDrawerTab === tab ? C.card : 'transparent',
                    color: activeDrawerTab === tab ? C.teal : C.textLight,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {loadingChild ? (
                <div style={{ padding: '40px', textAlign: 'center', color: C.textLight }}>Loading Child Profile...</div>
              ) : (
                childDetail && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {activeDrawerTab === 'overview' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                        <div>Email: <strong>{childDetail.profile?.email}</strong></div>
                        <div>Mobile: <strong>{childDetail.profile?.mobile}</strong></div>
                        <div>Joined Date: <strong>{new Date(childDetail.profile?.created_at).toLocaleDateString()}</strong></div>
                        <div>Available Balance: <strong style={{ color: C.green }}>₹{parseFloat(childDetail.profile?.available_balance || 0).toLocaleString()}</strong></div>
                        <div>Lifetime Total Earned: <strong>₹{parseFloat(childDetail.profile?.total_earned || 0).toLocaleString()}</strong></div>
                      </div>
                    )}

                    {activeDrawerTab === 'applications' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {childDetail.applications?.map(a => (
                          <div key={a.id} style={{ ...S.card, padding: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                            <div>Application #{a.id.substring(0,8)}</div>
                            <div style={{ fontWeight: 800, color: C.teal }}>{a.status?.toUpperCase()}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
