import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { QuestionBreakdown } from '../../../types';

interface Props {
  questions: QuestionBreakdown[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-xl text-xs max-w-xs">
        <p className="font-bold text-white mb-1">Câu {label}</p>
        <p className="text-slate-400 mb-2 truncate">{data?.content_snippet}</p>
        <div className="space-y-1">
          <p className="text-emerald-400">✓ Đúng: {data?.correct_count} ({data?.correct_percentage}%)</p>
          <p className="text-red-400">✗ Sai: {data?.wrong_count} ({data?.wrong_percentage}%)</p>
          {data?.partial_count > 0 && (
            <p className="text-amber-400">◐ Đúng 1 phần: {data?.partial_count} ({data?.partial_percentage}%)</p>
          )}
          {data?.skipped_count > 0 && (
            <p className="text-slate-400">○ Bỏ qua: {data?.skipped_count} ({data?.skipped_percentage}%)</p>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const QuestionBreakdownChart: React.FC<Props> = ({ questions }) => {
  const chartData = questions.map((q) => ({
    ...q,
    name: `${q.order_index}`,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
        <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: '#94a3b8', fontSize: 10 }}
          tickFormatter={(v) => `${v}%`}
          width={45}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
        <Legend
          wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
          formatter={(value: string) => <span style={{ color: '#cbd5e1' }}>{value}</span>}
        />
        <Bar dataKey="correct_percentage" stackId="a" fill="#22c55e" name="Làm đúng" radius={[0, 0, 0, 0]} />
        <Bar dataKey="wrong_percentage" stackId="a" fill="#ef4444" name="Làm sai" />
        <Bar dataKey="partial_percentage" stackId="a" fill="#f59e0b" name="Đúng một phần" />
        <Bar dataKey="skipped_percentage" stackId="a" fill="#475569" name="Bỏ qua" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};
