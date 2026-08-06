import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, UserPlus, FileCheck, CheckCircle2, DollarSign, Clock } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://gharkapaisa.in/api/v1';

export default function TeamActivityTab({ onSelectMember }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  useEffect(() => {
    fetchActivity();
  }, []);

  const fetchActivity = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await axios.get(`${API_URL}/team/activity`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setActivities(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch team activity:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'MEMBER_JOINED':
        return <UserPlus className="w-4 h-4 text-emerald-400" />;
      case 'APPLICATION_SUBMITTED':
        return <FileCheck className="w-4 h-4 text-amber-400" />;
      case 'APPLICATION_APPROVED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'COMMISSION_EARNED':
        return <DollarSign className="w-4 h-4 text-amber-300" />;
      default:
        return <Activity className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            Live Team Activity Stream
          </h3>
          <p className="text-xs text-slate-400">Real-time updates on team recruitments, sales, and milestone approvals</p>
        </div>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-800/40 rounded-xl animate-pulse"></div>
          ))
        ) : activities.length > 0 ? (
          activities.map((act) => (
            <div key={act.id} className="relative flex items-start gap-4 group">
              {/* Activity Dot */}
              <div className="absolute -left-6 top-1 p-1.5 rounded-full bg-slate-900 border border-slate-700 shadow-md">
                {getActivityIcon(act.type)}
              </div>

              {/* Activity Content */}
              <div className="flex-1 p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 hover:border-indigo-500/40 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">{act.description}</span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {new Date(act.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                  <span>Actor: <strong className="text-indigo-300">{act.actor_name}</strong></span>
                  <span>({act.actor_code})</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">No activity recorded yet</div>
        )}
      </div>
    </div>
  );
}
