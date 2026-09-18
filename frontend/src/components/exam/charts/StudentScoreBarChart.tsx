import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { PerStudentScore } from '../../../types';

interface Props {
  students: PerStudentScore[];
  averagePercentage: number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-xl text-xs">
        <p className="font-bold text-white mb-1">{data.student_name}</p>
        <p className="text-slate-400">Lớp: {data.student_class}</p>
        {data.total_score !== null ? (
          <>
            <p className="text-blue-400 font-semibold">Điểm: {data.total_score}</p>
            <p className="text-emerald-400">Tỉ lệ: {data.percentage}%</p>
          </>
        ) : (
          <p className="text-amber-400 font-semibold">Chưa làm bài</p>
        )}
      </div>
    );
  }
  return null;
};

export const StudentScoreBarChart: React.FC<Props> = ({ students, averagePercentage }) => {
  // Only show students who have submitted (have a percentage)
  const submittedStudents = students
    .filter((s) => s.percentage !== null && s.percentage !== undefined)
    .map((s) => ({
      ...s,
      displayName: (s.student_name || '').length > 12
        ? (s.student_name || '').substring(0, 10) + '...'
        : s.student_name || '',
    }));

  if (submittedStudents.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 text-sm">
        Chưa có học sinh nộp bài
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={submittedStudents} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
        <XAxis
          dataKey="displayName"
          tick={{ fill: '#94a3b8', fontSize: 10 }}
          angle={-45}
          textAnchor="end"
          interval={0}
          height={70}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: '#94a3b8', fontSize: 10 }}
          tickFormatter={(v) => `${v}%`}
          width={45}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
        <ReferenceLine
          y={averagePercentage}
          stroke="#f59e0b"
          strokeDasharray="5 3"
          strokeWidth={2}
          label={{
            value: `TB: ${averagePercentage.toFixed(1)}%`,
            position: 'right',
            fill: '#f59e0b',
            fontSize: 11,
            fontWeight: 700,
          }}
        />
        <Bar dataKey="percentage" radius={[4, 4, 0, 0]} maxBarSize={40}>
          {submittedStudents.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.percentage! >= averagePercentage ? '#1d4ed8' : '#1e3a5f'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
