import React from 'react';
import { BarChart3, Layers } from 'lucide-react';
import { SystemStats } from '../../types';

interface SystemStatsTabProps {
  systemStats: SystemStats | null;
}

export const SystemStatsTab: React.FC<SystemStatsTabProps> = ({ systemStats }) => {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-blue-400" />
        <h3 className="text-lg font-bold text-white">BÁO CÁO & THỐNG KÊ TỔNG QUAN TOÀN TRƯỜNG</h3>
      </div>

      {systemStats && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 text-center">
              <div className="text-xs font-bold uppercase text-slate-400 mb-1">Tổng Học Sinh</div>
              <div className="text-3xl font-black text-white">{systemStats.total_students}</div>
            </div>
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5 text-center">
              <div className="text-xs font-bold uppercase text-blue-400 mb-1">Giáo Viên Bộ Môn</div>
              <div className="text-3xl font-black text-blue-300">{systemStats.total_teachers}</div>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-center">
              <div className="text-xs font-bold uppercase text-emerald-400 mb-1">Đề Thi Đang Mở</div>
              <div className="text-3xl font-black text-emerald-300">{systemStats.active_exams} / {systemStats.total_exams}</div>
            </div>
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 text-center">
              <div className="text-xs font-bold uppercase text-amber-400 mb-1">Lượt Nộp & Điểm TB</div>
              <div className="text-2xl font-black text-amber-300">{systemStats.total_completed_sessions} <span className="text-xs font-normal">({systemStats.average_score}đ)</span></div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-400" />
              Phân Bố Thí Sinh Theo Khối / Lớp
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {systemStats.classes_distribution.map((cls, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-900/60 text-xs">
                  <span className="font-semibold text-slate-200">{cls.class_name}</span>
                  <span className="font-bold text-blue-400">{cls.count} học sinh</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
};
