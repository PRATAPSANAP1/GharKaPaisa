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
    top_performing_teams = []
  } = data;

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
            <span style={{ fontSize: '12px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase' }}>Referral Conversion</span>
            <MdTrendingUp style={{ fontSize: '24px', color: C.green }} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: C.text, marginTop: '8px' }}>{referral_conversion_rate}%</div>
          <div style={{ fontSize: '12px', color: C.green, marginTop: '4px' }}>Avg Team Size: {average_team_size} members</div>
        </div>

        <div style={{ ...S.card, padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase' }}>KYC Approvals</span>
            <MdVerifiedUser style={{ fontSize: '24px', color: C.teal }} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: C.text, marginTop: '8px' }}>{approved_kyc}</div>
          <div style={{ fontSize: '12px', color: C.gold, marginTop: '4px' }}>{pending_kyc} Pending Approvals</div>
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
  );
}
