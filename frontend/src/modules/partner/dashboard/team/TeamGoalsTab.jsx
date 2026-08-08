import React, { useState, useEffect } from 'react';
import { Target, Trophy, Award, Crown, CheckCircle2, TrendingUp, Users, DollarSign } from 'lucide-react';
import api from '../../../../services/api';

export default function TeamGoalsTab({ onSelectMember }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/team/goals');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch team goals:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading goals and leaderboard...</div>;
  }

  if (!data) return null;

  const { goals, leaderboard, badges } = data;

  const calcProgress = (current, target) => {
    if (!target) return 0;
    return Math.min(100, Math.round((current / target) * 100));
  };

  return (
    <div className="space-y-6">
      {/* Monthly Goals Progress Grid */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Target className="w-4 h-4 text-indigo-400" />
          Monthly Target Goals & Progress
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Recruitment Target */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-slate-300">Recruitment Target</span>
              <span className="font-bold text-indigo-400">{goals.current_month_members} / {goals.member_target} Members</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div className="bg-indigo-500 h-2 rounded-full transition-all duration-500" style={{ width: `${calcProgress(goals.current_month_members, goals.member_target)}%` }}></div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 text-right">{calcProgress(goals.current_month_members, goals.member_target)}% Completed</p>
          </div>

          {/* Business Target */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-slate-300">Business Target</span>
              <span className="font-bold text-emerald-400">{formatCurrency(goals.current_month_business)} / {formatCurrency(goals.business_target)}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${calcProgress(goals.current_month_business, goals.business_target)}%` }}></div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 text-right">{calcProgress(goals.current_month_business, goals.business_target)}% Completed</p>
          </div>

          {/* Commission Target */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-slate-300">Commission Target</span>
              <span className="font-bold text-amber-400">{formatCurrency(goals.current_month_commission)} / {formatCurrency(goals.commission_target)}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div className="bg-amber-500 h-2 rounded-full transition-all duration-500" style={{ width: `${calcProgress(goals.current_month_commission, goals.commission_target)}%` }}></div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 text-right">{calcProgress(goals.current_month_commission, goals.commission_target)}% Completed</p>
          </div>

          {/* Applications Target */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-slate-300">Applications Target</span>
              <span className="font-bold text-purple-400">{goals.current_month_apps} / {goals.app_target} Apps</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div className="bg-purple-500 h-2 rounded-full transition-all duration-500" style={{ width: `${calcProgress(goals.current_month_apps, goals.app_target)}%` }}></div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 text-right">{calcProgress(goals.current_month_apps, goals.app_target)}% Completed</p>
          </div>
        </div>
      </div>

      {/* Badges Earned */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" />
          Achievement Badges
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {badges && badges.length > 0 ? (
            badges.map((b, i) => (
              <div key={i} className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
                <span className="text-3xl">{b.icon}</span>
                <h4 className="font-bold text-white text-xs mt-2">{b.title}</h4>
                <p className="text-[10px] text-slate-400 mt-1">{b.desc}</p>
              </div>
            ))
          ) : (
            <div className="col-span-full py-4 text-center text-xs text-slate-400">Achieve monthly targets to unlock badges!</div>
          )}
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          Team Leaderboard (Top Performers)
        </h3>

        <div className="divide-y divide-slate-800">
          {leaderboard && leaderboard.length > 0 ? (
            leaderboard.map((lb) => (
              <div 
                key={lb.id}
                onClick={() => onSelectMember(lb.id)}
                className="py-3 flex items-center justify-between hover:bg-slate-800/40 px-3 rounded-xl transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center font-extrabold text-sm text-slate-400">#{lb.rank_position}</span>
                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300 overflow-hidden">
                    {lb.photo ? <img src={lb.photo} alt="" className="w-full h-full object-cover" /> : lb.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{lb.name}</h4>
                    <p className="text-xs text-slate-400">Code: {lb.code} • {lb.badge}</p>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <p className="font-bold text-emerald-400">{formatCurrency(lb.business)}</p>
                  <p className="text-slate-400">{lb.apps} Apps</p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">No leaderboard members yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
