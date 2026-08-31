import React, { useEffect, useState } from 'react';
import api from '../../../services/api';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import { 
  MdPeople, MdVerifiedUser, MdAccountBalanceWallet, MdTrendingUp, 
  MdGroupAdd, MdAssessment, MdOutlineCategory, MdStar 
} from 'react-icons/md';

export default function ReferralAnalyticsView() {
  const { C } = useTheme();
  const S = makeS(C);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    const fetchReferralAnalytics = async () => {
      setLoading(true);
      try {
        const res = await api.get('/superadmin/referral-analytics');
        if (res.data?.success) {
          setData(res.data.data);
        }
      } catch (e) {
        console.error('Failed to load referral analytics:', e);
        setErr(e.response?.data?.message || 'Failed to load referral analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchReferralAnalytics();
  }, []);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: C.textLight }}>Loading Platform Referral Insights...</div>;
  }

  if (err || !data) {
    return <div style={{ padding: '20px', color: C.red }}>{err || 'No referral data available.'}</div>;
  }

  const {
    total_partners = 0,
    active_partners = 0,
    inactive_partners = 0,
    pending_kyc = 0,
    approved_kyc = 0,
    total_team_members = 0,
    largest_team_size = 0,
    highest_team_commission = 0,
    daily_registrations = 0,
    weekly_registrations = 0,
    monthly_registrations = 0,
    referral_conversion_rate = 0,
    average_team_size = 0,
    top_referrers = [],
    top_performing_teams = [],
    employee_candidate_referrals = [],
    employee_partner_referrals = [],
    employee_referral_summary = { total_candidate_referrals: 0, total_partner_referrals: 0, total_employee_referrals: 0 }
  } = data;

  const [activeTab, setActiveTab] = useState('employee'); // 'employee' | 'partner'

  // Partner Team Hierarchy State for Super Admin inspection
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [partnerMembers, setPartnerMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const fetchTeamMembersForPartner = async (pId) => {
    if (!pId) return;
    setLoadingMembers(true);
    try {
      const res = await api.get(`/team/members?partner_id=${pId}&limit=50`);
      if (res.data?.success) {
        setPartnerMembers(res.data.data || []);
      }
    } catch (e) {
      console.error('Failed to load partner team members:', e);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    if (top_performing_teams.length > 0 && !selectedPartnerId) {
      setSelectedPartnerId(top_performing_teams[0].id);
      fetchTeamMembersForPartner(top_performing_teams[0].id);
    }
  }, [top_performing_teams]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        
        <div style={{ ...S.card, padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase' }}>Total Network Size</span>
            <MdPeople style={{ fontSize: '24px', color: C.blue }} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: C.text, marginTop: '8px' }}>{total_partners.toLocaleString()}</div>
          <div style={{ fontSize: '12px', color: C.textMid, marginTop: '4px' }}>{total_team_members} Downline Referral Members</div>
        </div>

        <div style={{ ...S.card, padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase' }}>Employee Referrals</span>
            <MdGroupAdd style={{ fontSize: '24px', color: C.teal }} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: C.text, marginTop: '8px' }}>{employee_referral_summary.total_employee_referrals}</div>
          <div style={{ fontSize: '12px', color: C.teal, marginTop: '4px' }}>{employee_referral_summary.total_candidate_referrals} Candidates • {employee_referral_summary.total_partner_referrals} Partners</div>
        </div>

        <div style={{ ...S.card, padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase' }}>Referral Conversion</span>
            <MdTrendingUp style={{ fontSize: '24px', color: C.green }} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: C.text, marginTop: '8px' }}>{referral_conversion_rate}%</div>
          <div style={{ fontSize: '12px', color: C.green, marginTop: '4px' }}>Avg Team Size: {average_team_size} members</div>
        </div>

        <div style={{ ...S.card, padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase' }}>Highest Team Commission</span>
            <MdAccountBalanceWallet style={{ fontSize: '24px', color: C.purple }} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: C.text, marginTop: '8px' }}>₹{highest_team_commission.toLocaleString()}</div>
          <div style={{ fontSize: '12px', color: C.textMid, marginTop: '4px' }}>Largest Team: {largest_team_size} partners</div>
        </div>

      </div>

      {/* Referral Analytics Tabs Switcher */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: `1px solid ${C.border}`, paddingBottom: '8px' }}>
        <button
          onClick={() => setActiveTab('employee')}
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            fontWeight: 800,
            fontSize: '14px',
            cursor: 'pointer',
            border: activeTab === 'employee' ? `1px solid ${C.teal}` : `1px solid ${C.border}`,
            background: activeTab === 'employee' ? `${C.teal}15` : C.card,
            color: activeTab === 'employee' ? C.teal : C.textMid
          }}
        >
          👨‍💼 Employee Referral Hub ({employee_referral_summary.total_employee_referrals})
        </button>
        <button
          onClick={() => setActiveTab('partner')}
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            fontWeight: 800,
            fontSize: '14px',
            cursor: 'pointer',
            border: activeTab === 'partner' ? `1px solid ${C.blue}` : `1px solid ${C.border}`,
            background: activeTab === 'partner' ? `${C.blue}15` : C.card,
            color: activeTab === 'partner' ? C.blue : C.textMid
          }}
        >
          🤝 Partner Downline Network ({total_team_members})
        </button>
      </div>

      {/* TAB 1: EMPLOYEE REFERRALS (Super Admin View) */}
      {activeTab === 'employee' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Employee Referred Candidates Table */}
          <div style={{ ...S.card, padding: '20px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MdPeople style={{ color: C.teal }} /> Employee Referred Candidates (Career Registration)
            </h4>
            
            {employee_candidate_referrals.length === 0 ? (
              <div style={{ fontSize: '13px', color: C.textLight, padding: '20px', textAlign: 'center' }}>No candidate referrals registered via employee links yet.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}` }}>
                      <th style={{ padding: '12px', color: C.textLight }}>Ref Code</th>
                      <th style={{ padding: '12px', color: C.textLight }}>Candidate Name</th>
                      <th style={{ padding: '12px', color: C.textLight }}>Contact Info</th>
                      <th style={{ padding: '12px', color: C.textLight }}>Referred By (Employee)</th>
                      <th style={{ padding: '12px', color: C.textLight }}>Interview Status</th>
                      <th style={{ padding: '12px', color: C.textLight }}>Registered Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employee_candidate_referrals.map((cand) => (
                      <tr key={cand.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: '12px', fontWeight: 800, color: C.teal }}>{cand.referral_code}</td>
                        <td style={{ padding: '12px', fontWeight: 700, color: C.text }}>{cand.referred_name}</td>
                        <td style={{ padding: '12px', color: C.textMid }}>
                          <div>{cand.referred_email}</div>
                          <div style={{ fontSize: '11px', color: C.textLight }}>{cand.referred_mobile}</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ fontWeight: 800, color: C.blue }}>{cand.referrer_name}</span>
                          <div style={{ fontSize: '11px', color: C.textLight }}>ID: {cand.referrer_code}</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ 
                            padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800,
                            background: cand.status === 'SELECTED' ? '#ECFDF5' : '#FEF3C7',
                            color: cand.status === 'SELECTED' ? '#059669' : '#D97706'
                          }}>
                            {cand.status || 'REGISTERED'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', color: C.textLight, fontSize: '12px' }}>
                          {new Date(cand.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Employee Referred Partners Table */}
          <div style={{ ...S.card, padding: '20px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MdGroupAdd style={{ color: C.blue }} /> Employee Referred Partners (Partner Onboarding)
            </h4>
            
            {employee_partner_referrals.length === 0 ? (
              <div style={{ fontSize: '13px', color: C.textLight, padding: '20px', textAlign: 'center' }}>No partners onboarded via employee referral links yet.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}` }}>
                      <th style={{ padding: '12px', color: C.textLight }}>Partner Code</th>
                      <th style={{ padding: '12px', color: C.textLight }}>Partner Name</th>
                      <th style={{ padding: '12px', color: C.textLight }}>Contact Info</th>
                      <th style={{ padding: '12px', color: C.textLight }}>Referred By (Employee)</th>
                      <th style={{ padding: '12px', color: C.textLight }}>KYC Status</th>
                      <th style={{ padding: '12px', color: C.textLight }}>Applications Lead</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employee_partner_referrals.map((part) => (
                      <tr key={part.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: '12px', fontWeight: 800, color: C.blue }}>{part.referral_code}</td>
                        <td style={{ padding: '12px', fontWeight: 700, color: C.text }}>{part.referred_name}</td>
                        <td style={{ padding: '12px', color: C.textMid }}>
                          <div>{part.referred_email}</div>
                          <div style={{ fontSize: '11px', color: C.textLight }}>{part.referred_mobile}</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ fontWeight: 800, color: C.teal }}>{part.referrer_name}</span>
                          <div style={{ fontSize: '11px', color: C.textLight }}>ID: {part.referrer_code}</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ 
                            padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800,
                            background: part.status === 'approved' ? '#ECFDF5' : '#FEF3C7',
                            color: part.status === 'approved' ? '#059669' : '#D97706'
                          }}>
                            {(part.status || 'DRAFT').toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '12px', fontWeight: 700, color: C.green }}>
                          {part.total_applications || 0} Apps Submitted
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: PARTNER DOWNLINE NETWORK */}
      {activeTab === 'partner' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Growth Trends Banner */}
          <div style={{ ...S.card, padding: '20px', background: C.bgSecondary }}>
            <h4 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MdGroupAdd style={{ color: C.blue }} /> Partner Registration Trajectory
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              <div style={{ background: C.card, padding: '14px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: C.textLight }}>Today</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: C.text, marginTop: '4px' }}>+{daily_registrations}</div>
              </div>
              <div style={{ background: C.card, padding: '14px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: C.textLight }}>This Week</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: C.blue, marginTop: '4px' }}>+{weekly_registrations}</div>
              </div>
              <div style={{ background: C.card, padding: '14px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: C.textLight }}>This Month</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: C.green, marginTop: '4px' }}>+{monthly_registrations}</div>
              </div>
            </div>
          </div>

          {/* Super Admin Partner Team Commission Inspector */}
          <div style={{ ...S.card, padding: '20px', background: C.bgSecondary, border: `1px solid ${C.blue}30` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MdPeople style={{ color: C.blue }} /> Partner Team Commission Split Hierarchy
                </h4>
                <span style={{ fontSize: '12px', color: C.textMid }}>
                  Inspect Partner → Team Member percentages set by partners
                </span>
              </div>

              {top_performing_teams.length > 0 && (
                <select
                  value={selectedPartnerId}
                  onChange={(e) => {
                    setSelectedPartnerId(e.target.value);
                    fetchTeamMembersForPartner(e.target.value);
                  }}
                  style={{ ...S.input, width: 'auto', padding: '8px 14px', fontSize: '13px', fontWeight: 700 }}
                >
                  {top_performing_teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      Partner: {t.first_name} {t.last_name} ({t.partner_code})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {loadingMembers ? (
              <div style={{ padding: '20px', textAlign: 'center', color: C.textLight, fontSize: '13px' }}>Loading downline team members...</div>
            ) : partnerMembers.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: C.textLight, fontSize: '13px' }}>No team members in this partner's downline network yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ padding: '10px 14px', background: C.card, borderRadius: '10px', fontWeight: 800, fontSize: '13px', color: C.blue, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Parent Partner</span>
                  <span>↓</span>
                  <span>Downline Team Member Split Breakdown</span>
                </div>
                
                {partnerMembers.map((m) => {
                  const memberPct = parseFloat(m.commission_rate || 90);
                  const partnerPct = parseFloat((100 - memberPct).toFixed(2));
                  return (
                    <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: C.card, borderRadius: '10px', border: `1px solid ${C.border}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '14px', color: C.textLight }}>├──</span>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: C.text }}>{m.full_name} ({m.partner_code})</div>
                          <div style={{ fontSize: '11px', color: C.textLight }}>Mobile: {m.mobile} • Joined: {new Date(m.joined_at).toLocaleDateString()}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: C.green, background: `${C.green}15`, padding: '4px 10px', borderRadius: '6px', border: `1px solid ${C.green}30` }}>
                          Member: {memberPct}%
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: C.purple, background: `${C.purple}15`, padding: '4px 10px', borderRadius: '6px', border: `1px solid ${C.purple}30` }}>
                          Partner Split: {partnerPct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Leaderboards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
            
            {/* Top Referrers */}
            <div style={{ ...S.card, padding: '20px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MdStar style={{ color: C.gold }} /> Top Referrers (Direct Invites)
              </h4>
              {top_referrers.length === 0 ? (
                <div style={{ fontSize: '13px', color: C.textLight }}>No referrer records found.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {top_referrers.map((ref, idx) => (
                    <div key={ref.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: C.bgSecondary, borderRadius: '10px' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: C.text }}>#{idx + 1} {ref.first_name} {ref.last_name} ({ref.partner_code})</div>
                        <div style={{ fontSize: '11px', color: C.textLight }}>{ref.email}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: C.green }}>{ref.referral_count || 0} Invites</div>
                        <div style={{ fontSize: '11px', color: C.textLight }}>{ref.children_count || 0} Direct Children</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Performing Teams */}
            <div style={{ ...S.card, padding: '20px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MdAssessment style={{ color: C.purple }} /> Top Performing Teams (Overrides)
              </h4>
              {top_performing_teams.length === 0 ? (
                <div style={{ fontSize: '13px', color: C.textLight }}>No team commission overrides generated yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {top_performing_teams.map((team, idx) => (
                    <div key={team.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: C.bgSecondary, borderRadius: '10px' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: C.text }}>#{idx + 1} {team.first_name} {team.last_name} ({team.partner_code})</div>
                        <div style={{ fontSize: '11px', color: C.textLight }}>Team Members: {team.children_count}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: C.purple }}>₹{parseFloat(team.team_commission || 0).toLocaleString()}</div>
                        <div style={{ fontSize: '11px', color: C.textLight }}>Team Overrides</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
