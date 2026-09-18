import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface Props {
  submitted: number;
  total: number;
}

export const SubmissionDonutChart: React.FC<Props> = ({ submitted, total }) => {
  const percentage = total > 0 ? ((submitted / total) * 100).toFixed(2) : '0';
  const data = [
    { name: 'Đã nộp', value: submitted },
    { name: 'Chưa nộp', value: Math.max(total - submitted, 0) },
  ];
  const COLORS = ['#3b82f6', '#1e293b'];

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={2}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              stroke="none"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-blue-400">{percentage}%</span>
        </div>
      </div>
      <div className="mt-3 text-center">
        <div className="text-sm text-slate-300">
          Đã nộp: <span className="font-bold text-white">{submitted}</span>
          <span className="text-slate-500 mx-1">|</span>
          Được giao: <span className="font-bold text-white">{total}</span>
        </div>
      </div>
    </div>
  );
};
