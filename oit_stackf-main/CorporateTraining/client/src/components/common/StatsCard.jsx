import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const colorMap = {
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-500/10',
    icon: 'text-indigo-600 dark:text-indigo-400',
    ring: 'ring-indigo-500/20',
    gradient: 'from-indigo-500 to-indigo-600',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-500/10',
    icon: 'text-purple-600 dark:text-purple-400',
    ring: 'ring-purple-500/20',
    gradient: 'from-purple-500 to-purple-600',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    icon: 'text-emerald-600 dark:text-emerald-400',
    ring: 'ring-emerald-500/20',
    gradient: 'from-emerald-500 to-emerald-600',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    icon: 'text-amber-600 dark:text-amber-400',
    ring: 'ring-amber-500/20',
    gradient: 'from-amber-500 to-amber-600',
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-500/10',
    icon: 'text-rose-600 dark:text-rose-400',
    ring: 'ring-rose-500/20',
    gradient: 'from-rose-500 to-rose-600',
  },
  cyan: {
    bg: 'bg-cyan-50 dark:bg-cyan-500/10',
    icon: 'text-cyan-600 dark:text-cyan-400',
    ring: 'ring-cyan-500/20',
    gradient: 'from-cyan-500 to-cyan-600',
  },
};

const StatsCard = ({ title, value, icon: Icon, color = 'indigo', trend, trendLabel }) => {
  const c = colorMap[color] || colorMap.indigo;

  return (
    <div className="glass-card p-6 hover:shadow-xl transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {value}
          </h3>
          {trend !== undefined && (
            <div className="flex items-center gap-1.5 mt-2">
              {trend > 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              ) : trend < 0 ? (
                <TrendingDown className="w-4 h-4 text-rose-500" />
              ) : (
                <Minus className="w-4 h-4 text-gray-400" />
              )}
              <span className={`text-sm font-semibold ${trend > 0 ? 'text-emerald-500' : trend < 0 ? 'text-rose-500' : 'text-gray-400'}`}>
                {Math.abs(trend)}%
              </span>
              {trendLabel && (
                <span className="text-xs text-gray-400 dark:text-gray-500">{trendLabel}</span>
              )}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-2xl ${c.bg} ring-1 ${c.ring} group-hover:scale-110 transition-transform duration-300`}>
          {Icon && <Icon className={`w-6 h-6 ${c.icon}`} />}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;

