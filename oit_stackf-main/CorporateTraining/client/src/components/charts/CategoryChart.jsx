import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const COLORS = ['#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 dark:bg-slate-800/95 text-white p-3 rounded-xl border border-slate-800/50 shadow-lg text-xs">
        <p className="font-bold">{payload[0].name}</p>
        <p className="text-indigo-400 mt-1">Value: <span className="font-semibold">{payload[0].value}</span></p>
      </div>
    );
  }
  return null;
};

const CategoryChart = ({ data = [] }) => {
  const chartData = data.map((d) => ({
    name: d.name || d.categoryName || 'Unknown',
    value: d.value || d.count || 0,
  }));

  return (
    <div className="w-full h-80 min-h-[300px] flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={5}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            iconType="circle"
            formatter={(value) => (
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CategoryChart;

