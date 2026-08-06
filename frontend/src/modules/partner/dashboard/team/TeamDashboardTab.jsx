import React from 'react';
import { 
  Users, UserCheck, UserPlus, TrendingUp, DollarSign, Award, 
  CheckCircle2, Clock, FileText, Activity, AlertCircle, ArrowUpRight, Crown, ShieldAlert
} from 'lucide-react';

export default function TeamDashboardTab({ data, loading, onSelectMember }) {
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-800/50 rounded-2xl border border-slate-700/50"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-800/50 rounded-2xl border border-slate-700/50 lg:col-span-2"></div>
          <div className="h-64 bg-slate-800/50 rounded-2xl border border-slate-700/50"></div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Members */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-indigo-950/40 border border-slate-700/60 shadow-xl backdrop-blur-xl group hover:border-indigo-500/50 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Total Downline</span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-3xl font-extrabold text-white tracking-tight">{data.total_members}</h3>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {data.direct_members} Direct / {data.indirect_members} Indirect
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Entire team hierarchy count</p>
        </div>

        {/* Joinings (Today & Month) */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-emerald-950/40 border border-slate-700/60 shadow-xl backdrop-blur-xl group hover:border-emerald-500/50 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">New Joinings</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <UserPlus className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-3xl font-extrabold text-white tracking-tight">{data.today_joinings}</h3>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              +{data.this_month_joinings} This Month
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Active recruits growth rate</p>
        </div>

        {/* Team Business */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-blue-950/40 border border-slate-700/60 shadow-xl backdrop-blur-xl group hover:border-blue-500/50 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">Team Business</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-3xl font-extrabold text-white tracking-tight">{formatCurrency(data.team_business)}</h3>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {data.applications_approved} Approved
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Total disbursals & credit limits</p>
        </div>

        {/* Team Commission Override */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-amber-950/40 border border-slate-700/60 shadow-xl backdrop-blur-xl group hover:border-amber-500/50 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Team Commission</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-3xl font-extrabold text-white tracking-tight">{formatCurrency(data.monthly_commission)}</h3>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {formatCurrency(data.lifetime_commission)} Total
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Today: {formatCurrency(data.today_commission)}</p>
        </div>

        {/* Active vs Inactive */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Member Status</span>
            <UserCheck className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-center gap-4">
            <div>
              <span className="text-2xl font-bold text-emerald-400">{data.active_members}</span>
              <p className="text-xs text-slate-400">Active</p>
            </div>
            <div className="h-8 w-px bg-slate-800"></div>
            <div>
              <span className="text-2xl font-bold text-rose-400">{data.inactive_members}</span>
              <p className="text-xs text-slate-400">Inactive</p>
            </div>
          </div>
        </div>

        {/* KYC Verification */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>KYC Verification</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-center gap-4">
            <div>
              <span className="text-2xl font-bold text-emerald-400">{data.verified_members}</span>
              <p className="text-xs text-slate-400">Verified</p>
            </div>
            <div className="h-8 w-px bg-slate-800"></div>
            <div>
              <span className="text-2xl font-bold text-amber-400">{data.pending_kyc}</span>
              <p className="text-xs text-slate-400">Pending</p>
            </div>
          </div>
        </div>

        {/* Applications Breakdown */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Applications Status</span>
            <FileText className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xl font-bold text-white">{data.applications_submitted}</span>
              <p className="text-xs text-slate-400">Total</p>
            </div>
            <div>
              <span className="text-xl font-bold text-amber-400">{data.applications_pending}</span>
              <p className="text-xs text-slate-400">Pending</p>
            </div>
            <div>
              <span className="text-xl font-bold text-emerald-400">{data.applications_approved}</span>
              <p className="text-xs text-slate-400">Approved</p>
            </div>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Conversion Rate</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-purple-300">{data.average_conversion_rate}%</span>
            <span className="text-xs text-purple-400/80">Apps to Disbursal</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, data.average_conversion_rate)}%` }}></div>
          </div>
        </div>
      </div>

      {/* Top / Lowest Performers & Recent Joinings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performers Overview */}
        <div className="lg:col-span-1 space-y-4">
          {/* Top Performer Card */}
          {data.top_performer ? (
            <div 
              onClick={() => onSelectMember(data.top_performer.id)}
              className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-900 border border-amber-500/30 shadow-lg cursor-pointer hover:border-amber-500/60 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <Crown className="w-4 h-4 text-amber-400" /> Top Performer
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {data.top_performer.rank}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center overflow-hidden font-bold text-amber-400">
                  {data.top_performer.photo ? (
                    <img src={data.top_performer.photo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    data.top_performer.name?.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-white group-hover:text-amber-300 transition-colors">{data.top_performer.name}</h4>
                  <p className="text-xs text-slate-400">Code: {data.top_performer.code}</p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">Business:</span>
                  <span className="ml-1.5 font-bold text-white">{formatCurrency(data.top_performer.business)}</span>
                </div>
                <div>
                  <span className="text-slate-400">Approved Apps:</span>
                  <span className="ml-1.5 font-bold text-emerald-400">{data.top_performer.apps}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
              No top performer data available yet
            </div>
          )}

          {/* Lowest Performer Card */}
          {data.lowest_performer && (
            <div 
              onClick={() => onSelectMember(data.lowest_performer.id)}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg cursor-pointer hover:border-slate-700 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4 text-slate-400" /> Needs Support
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                  {data.lowest_performer.rank}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden font-bold text-slate-400">
                  {data.lowest_performer.photo ? (
                    <img src={data.lowest_performer.photo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    data.lowest_performer.name?.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm group-hover:text-indigo-300 transition-colors">{data.lowest_performer.name}</h4>
                  <p className="text-xs text-slate-400">Code: {data.lowest_performer.code}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Joinings List */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-400" />
              Recent Team Joinings
            </h3>
            <span className="text-xs text-slate-400">Latest 5 recruits</span>
          </div>

          <div className="divide-y divide-slate-800/60">
            {data.recent_joinings && data.recent_joinings.length > 0 ? (
              data.recent_joinings.map((member) => (
                <div 
                  key={member.id}
                  onClick={() => onSelectMember(member.id)}
                  className="py-3.5 flex items-center justify-between hover:bg-slate-800/40 px-3 rounded-xl transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm overflow-hidden">
                      {member.photo ? <img src={member.photo} alt="" className="w-full h-full object-cover" /> : member.name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">{member.name}</h4>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          L{member.level}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">Code: {member.code} • Joined {new Date(member.joined_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                      member.kyc_status === 'approved' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      {member.kyc_status === 'approved' ? 'Verified' : 'Pending KYC'}
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">No recent team members found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
