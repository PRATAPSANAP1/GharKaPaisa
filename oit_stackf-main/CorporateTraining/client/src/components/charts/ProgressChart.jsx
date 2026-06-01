import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area
} from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 dark:bg-slate-800/95 text-white p-3 rounded-xl border border-slate-800/50 shadow-lg text-xs flex flex-col gap-1">
        <p className="text-slate-400">{payload[0].payload.date}</p>
        <p className="text-emerald-400">Score Obtained: <span className="font-bold">{payload[0].value}</span></p>
      </div>
    );
  }
  return null;
};

const ProgressChart = ({ data = [] }) => {
  const chartData = data.map((d) => ({
    date: d.date,
    Score: d.score,
  }));

  return (
    <div className="w-full h-80 min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800/60" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#94A3B8', fontSize: 11 }}
            axisLine={{ stroke: '#E2E8F0' }}
          />
          <YAxis
            tick={{ fill: '#94A3B8', fontSize: 11 }}
            axisLine={{ stroke: '#E2E8F0' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="Score"
            stroke="#6366F1"
            strokeWidth={3}
            dot={{ r: 4, stroke: '#6366F1', strokeWidth: 2, fill: '#fff' }}
            activeDot={{ r: 6, fill: '#6366F1' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProgressChart;

