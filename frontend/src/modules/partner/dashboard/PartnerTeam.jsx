import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, Layers, List, TrendingUp, Activity, Target, 
  Settings, RefreshCw, AlertCircle 
} from 'lucide-react';

import TeamDashboardTab from './team/TeamDashboardTab';
import TeamTreeTab from './team/TeamTreeTab';
import TeamMembersTab from './team/TeamMembersTab';
import TeamAnalyticsTab from './team/TeamAnalyticsTab';
import TeamActivityTab from './team/TeamActivityTab';
import TeamGoalsTab from './team/TeamGoalsTab';
import TeamSettingsTab from './team/TeamSettingsTab';
import TeamMemberDrawer from './team/TeamMemberDrawer';

const API_URL = import.meta.env.VITE_API_URL || 'https://gharkapaisa.in/api/v1';

export default function PartnerTeam() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [error, setError] = useState(null);

  const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoadingDashboard(true);
    setError(null);
    try {
      const token = getAuthToken();
      const res = await axios.get(`${API_URL}/team/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setDashboardData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load team dashboard:', err);
      setError(err.response?.data?.message || 'Failed to load team dashboard metrics');
    } finally {
      setLoadingDashboard(false);
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Users },
    { id: 'tree', label: 'Team Tree', icon: Layers },
    { id: 'members', label: 'Team Members', icon: List },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'activity', label: 'Activity Stream', icon: Activity },
    { id: 'goals', label: 'Goals & Leaderboard', icon: Target },
    { id: 'settings', label: 'Referral & Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Module Title Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 border border-slate-800 shadow-2xl backdrop-blur-xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-indigo-400" />
            Team Management Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time downline network metrics, multi-tier team tree, business override analytics, and member management
          </p>
        </div>

        <button
          onClick={fetchDashboard}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all shadow-md"
        >
          <RefreshCw className={`w-4 h-4 ${loadingDashboard ? 'animate-spin text-indigo-400' : ''}`} />
          Refresh Metrics
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800 overflow-x-auto shadow-lg backdrop-blur-md">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/30 scale-[1.02]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Active Tab View Render */}
      <div className="transition-all duration-300">
        {activeTab === 'dashboard' && (
          <TeamDashboardTab 
            data={dashboardData} 
            loading={loadingDashboard} 
            onSelectMember={(id) => setSelectedMemberId(id)} 
          />
        )}

        {activeTab === 'tree' && (
          <TeamTreeTab 
            onSelectMember={(id) => setSelectedMemberId(id)} 
          />
        )}

        {activeTab === 'members' && (
          <TeamMembersTab 
            onSelectMember={(id) => setSelectedMemberId(id)} 
          />
        )}

        {activeTab === 'analytics' && (
          <TeamAnalyticsTab />
        )}

        {activeTab === 'activity' && (
          <TeamActivityTab 
            onSelectMember={(id) => setSelectedMemberId(id)} 
          />
        )}

        {activeTab === 'goals' && (
          <TeamGoalsTab 
            onSelectMember={(id) => setSelectedMemberId(id)} 
          />
        )}

        {activeTab === 'settings' && (
          <TeamSettingsTab />
        )}
      </div>

      {/* 360° Member Drawer */}
      {selectedMemberId && (
        <TeamMemberDrawer
          memberId={selectedMemberId}
          onClose={() => setSelectedMemberId(null)}
          onSelectSubMember={(id) => setSelectedMemberId(id)}
        />
      )}
    </div>
  );
}
