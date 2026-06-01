import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 dark:bg-slate-800/95 text-white p-3 rounded-xl border border-slate-800/50 shadow-lg text-xs flex flex-col gap-1">
        <p className="font-bold">{payload[0].payload.name}</p>
        <p className="text-blue-400">Score: <span className="font-semibold">{payload[0].value}</span></p>
        <p className="text-slate-400">Max Score: <span className="font-semibold">{payload[0].payload.maxScore}</span></p>
      </div>
    );
  }
  return null;
};

const ScoreChart = ({ data = [] }) => {
  const chartData = data.map((d) => ({
    name: d.name,
    Score: d.score,
    maxScore: d.maxScore || 100,
  }));

  return (
    <div className="w-full h-80 min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800/60" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#94A3B8', fontSize: 11 }}
            axisLine={{ stroke: '#E2E8F0' }}
            className="dark:axisLine-slate-800"
          />
          <YAxis
            tick={{ fill: '#94A3B8', fontSize: 11 }}
            axisLine={{ stroke: '#E2E8F0' }}
            className="dark:axisLine-slate-800"
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} />
          <Bar
            dataKey="Score"
            fill="url(#scoreColor)"
            radius={[8, 8, 0, 0]}
            maxBarSize={45}
          />
          <defs>
            <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.85} />
              <stop offset="95%" stopColor="#6366F1" stopOpacity={0.85} />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ScoreChart;

