import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, Filter, Download, ChevronLeft, ChevronRight, 
  Eye, RefreshCw, UserCheck, ShieldAlert, CheckCircle, Clock
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://gharkapaisa.in/api/v1';

export default function TeamMembersTab({ onSelectMember }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, total_pages: 1 });

  // Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [rankFilter, setRankFilter] = useState('');
  const [kycFilter, setKycFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');

  const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  useEffect(() => {
    fetchMembers(1);
  }, [search, statusFilter, rankFilter, kycFilter, periodFilter]);

  const fetchMembers = async (page = 1) => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });

      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (rankFilter) params.append('rank', rankFilter);
      if (kycFilter) params.append('kyc_status', kycFilter);
      if (periodFilter) params.append('joined_period', periodFilter);

      const res = await axios.get(`${API_URL}/team/members?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setMembers(res.data.data || []);
        setPagination(res.data.pagination || { page: 1, limit: 20, total: 0, total_pages: 1 });
      }
    } catch (err) {
      console.error('Failed to fetch team members:', err);
    } finally {
      setLoading(false);
    }
  };

  // CSV Export Logic
  const handleExportCSV = () => {
    if (!members.length) return;
    const headers = ['Partner Code', 'Name', 'Email', 'Mobile', 'Rank', 'Level', 'Status', 'KYC Status', 'Parent Code', 'Applications', 'Total Business (INR)', 'Total Commission (INR)', 'Joined Date'];
    const csvRows = [headers.join(',')];

    members.forEach(m => {
      const row = [
        `"${m.partner_code || ''}"`,
        `"${m.full_name || ''}"`,
        `"${m.email || ''}"`,
        `"${m.mobile || ''}"`,
        `"${m.rank || ''}"`,
        m.level || 1,
        `"${m.status || ''}"`,
        `"${m.kyc_status || ''}"`,
        `"${m.parent_code || ''}"`,
        m.applications_count || 0,
        m.total_business || 0,
        m.total_commission || 0,
        `"${new Date(m.joined_at).toLocaleDateString()}"`
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `team_members_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls Bar */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white">Team Members List</h3>
            <p className="text-xs text-slate-400">Total {pagination.total} registered members in your downline network</p>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-800/80">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, code, mobile..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Rank Filter */}
          <select
            value={rankFilter}
            onChange={(e) => setRankFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Ranks</option>
            <option value="Partner">Partner</option>
            <option value="Silver">Silver</option>
            <option value="Gold">Gold</option>
            <option value="Diamond">Diamond</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>

          {/* KYC Filter */}
          <select
            value={kycFilter}
            onChange={(e) => setKycFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">All KYC Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
          </select>
        </div>
      </div>

      {/* Members Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <th className="p-4">Member Info</th>
                <th className="p-4">Code / Level</th>
                <th className="p-4">Rank</th>
                <th className="p-4">Account Status</th>
                <th className="p-4">KYC Status</th>
                <th className="p-4 text-right">Business</th>
                <th className="p-4 text-right">Commission</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={8} className="p-4"><div className="h-6 bg-slate-800/60 rounded-lg"></div></td>
                  </tr>
                ))
              ) : members.length > 0 ? (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Member Info */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-400 overflow-hidden shrink-0">
                          {member.profile_photo_url ? (
                            <img src={member.profile_photo_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            member.full_name?.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p 
                            onClick={() => onSelectMember(member.id)}
                            className="font-bold text-white hover:text-indigo-300 transition-colors cursor-pointer"
                          >
                            {member.full_name}
                          </p>
                          <p className="text-[11px] text-slate-400">{member.mobile} • {member.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Code / Level */}
                    <td className="p-4">
                      <span className="font-semibold text-slate-200">{member.partner_code}</span>
                      <p className="text-[11px] text-slate-400">Level {member.level}</p>
                    </td>

                    {/* Rank */}
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {member.rank}
                      </span>
                    </td>

                    {/* Account Status */}
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        member.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}>
                        {member.status}
                      </span>
                    </td>

                    {/* KYC Status */}
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        member.kyc_status === 'approved' 
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {member.kyc_status === 'approved' ? 'Verified' : 'Pending KYC'}
                      </span>
                    </td>

                    {/* Business */}
                    <td className="p-4 text-right font-bold text-emerald-400">
                      {formatCurrency(member.total_business)}
                    </td>

                    {/* Commission */}
                    <td className="p-4 text-right font-bold text-amber-400">
                      {formatCurrency(member.total_commission)}
                    </td>

                    {/* Action */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => onSelectMember(member.id)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white transition-all font-semibold"
                      >
                        View 360°
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">No team members match the search filters</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination.total_pages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Showing Page {pagination.page} of {pagination.total_pages}</span>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchMembers(pagination.page - 1)}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={pagination.page >= pagination.total_pages}
                onClick={() => fetchMembers(pagination.page + 1)}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
