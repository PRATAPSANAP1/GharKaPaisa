import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  AreaChart, Area, CartesianGrid 
} from 'recharts';
import { 
  TrendingUp, Users, DollarSign, Filter, Layers, 
  ArrowRight, ShieldCheck, FileCheck, CheckCircle2
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://gharkapaisa.in/api/v1';

export default function TeamAnalyticsTab() {
  const [analytics, setAnalytics] = useState(null);
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);

  const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await axios.get(`${API_URL}/team/analytics?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setAnalytics(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch team analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  };

  if (loading) {
    return (
      <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 animate-pulse">
        <div className="h-64 bg-slate-800/40 rounded-xl mb-4"></div>
        <div className="h-48 bg-slate-800/40 rounded-xl"></div>
      </div>
    );
  }

  if (!analytics) return null;

  const funnel = analytics.conversion_funnel || {};

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            Team Performance Analytics & Conversion Funnel
          </h3>
          <p className="text-xs text-slate-400">Deep insights into team recruitment velocity, business sales, and commission growth</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-xl border border-slate-700">
          {['7d', '30d', '90d', '1y'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase transition-colors ${
                period === p ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Conversion Funnel Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-500/30 shadow-xl backdrop-blur-md">
        <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-4">
          Team Referral & Application Conversion Funnel
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Clicks */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 text-center relative">
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Referral Clicks</p>
            <p className="text-xl font-extrabold text-white mt-1">{funnel.referral_clicks}</p>
          </div>

          {/* Registrations */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 text-center relative">
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Registrations</p>
            <p className="text-xl font-extrabold text-indigo-400 mt-1">{funnel.registrations}</p>
            <span className="text-[10px] font-bold text-indigo-300">
              {funnel.referral_clicks > 0 ? ((funnel.registrations / funnel.referral_clicks) * 100).toFixed(1) : 0}% Conv
            </span>
          </div>

          {/* KYC Approved */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 text-center relative">
            <p className="text-[10px] text-slate-400 font-semibold uppercase">KYC Approved</p>
            <p className="text-xl font-extrabold text-emerald-400 mt-1">{funnel.kyc_approved}</p>
            <span className="text-[10px] font-bold text-emerald-300">
              {funnel.registrations > 0 ? ((funnel.kyc_approved / funnel.registrations) * 100).toFixed(1) : 0}% Conv
            </span>
          </div>

          {/* Apps Submitted */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 text-center relative">
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Apps Submitted</p>
            <p className="text-xl font-extrabold text-amber-400 mt-1">{funnel.applications_submitted}</p>
          </div>

          {/* Apps Approved */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 text-center relative">
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Apps Approved</p>
            <p className="text-xl font-extrabold text-emerald-400 mt-1">{funnel.applications_approved}</p>
            <span className="text-[10px] font-bold text-emerald-300">
              {funnel.applications_submitted > 0 ? ((funnel.applications_approved / funnel.applications_submitted) * 100).toFixed(1) : 0}% Conv
            </span>
          </div>

          {/* Commission Credited */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 text-center relative">
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Commission</p>
            <p className="text-lg font-extrabold text-amber-300 mt-1">{formatCurrency(funnel.commissions_earned)}</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business & Commission Growth Chart */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
          <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            Monthly Business & Commission Trend
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.business_trend || []}>
                <defs>
                  <linearGradient id="colorBusiness" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  formatter={(val) => [formatCurrency(val), 'Business']}
                />
                <Area type="monotone" dataKey="business" stroke="#10b981" fillOpacity={1} fill="url(#colorBusiness)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Member Recruitment Velocity Chart */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
          <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            Recruitment Velocity (Daily Joinings)
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.daily_joining_trend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                />
                <Bar dataKey="joinings" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Products Breakdown */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
        <h4 className="text-sm font-bold text-white mb-4">Top Financial Products Sold by Team</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {analytics.top_products && analytics.top_products.length > 0 ? (
            analytics.top_products.map((prod, index) => (
              <div key={index} className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white">{prod.product_name}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                    {prod.category}
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-xs mt-3">
                  <span className="text-slate-400">Total Sales: <strong className="text-white">{prod.sales_count}</strong></span>
                  <span className="font-bold text-emerald-400">{formatCurrency(prod.total_amount)}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-8 text-center text-xs text-slate-400">No product sales recorded yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
