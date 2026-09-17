import React, { useState, useEffect } from 'react';
import { examsApi, assessmentApi } from '../../services/api';
import { ExamAnalyticsData, ExamSessionDetail } from '../../types';
import {
  BarChart3,
  Award,
  Users,
  Target,
  X,
  TrendingUp,
  Cpu,
  Layers,
  HelpCircle,
  CheckCircle2,
  List,
  Eye,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

interface Props {
  examId: number;
  onClose: () => void;
}

export const ExamAnalyticsModal: React.FC<Props> = ({ examId, onClose }) => {
  const [data, setData] = useState<ExamAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  
  // Submission list states
  const [showSubmissions, setShowSubmissions] = useState<boolean>(false);
  const [sessions, setSessions] = useState<ExamSessionDetail[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState<boolean>(false);
  const [sessionsError, setSessionsError] = useState<string>('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await examsApi.getExamAnalytics(examId);
        setData(res);
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.detail || 'Không thể tải dữ liệu phân tích đề thi.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, [examId]);

  const handleFetchSessions = async () => {
    setShowSubmissions(true);
    setIsLoadingSessions(true);
    setSessionsError('');
    try {
      const res = await assessmentApi.getSessions({ exam_id: examId });
      setSessions(res);
    } catch (err: any) {
      console.error(err);
      setSessionsError(err.response?.data?.detail || 'Không thể tải danh sách bài làm.');
    } finally {
      setIsLoadingSessions(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl p-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Phân Tích Phổ Điểm & Chất Lượng Đề Thi</h3>
              <p className="text-xs text-slate-400">
                Đề thi: <span className="font-semibold text-blue-400">{data?.exam_title || 'Đang tải...'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-slate-400 text-sm">Đang tính toán phân tích thống kê...</div>
        ) : error ? (
          <div className="my-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">{error}</div>
        ) : !data || data.total_submissions === 0 ? (
          <div className="py-20 text-center text-slate-500 text-sm">Chưa có bài nộp nào cho đề thi này để thống kê phổ điểm.</div>
        ) : showSubmissions ? (
          <div className="flex-1 overflow-y-auto space-y-4 pt-4 pr-1">
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setShowSubmissions(false)}
                className="flex items-center gap-1 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Quay lại thống kê
              </button>
            </div>
            
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
                <List className="h-4 w-4 text-blue-400" />
                Danh sách chi tiết lượt nộp bài
              </h4>
              
              {isLoadingSessions ? (
                <div className="py-12 text-center text-slate-400 text-sm">Đang tải danh sách bài làm...</div>
              ) : sessionsError ? (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">{sessionsError}</div>
              ) : sessions.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm">Chưa có bài nộp nào.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                        <th className="pb-2.5 font-bold">Thí sinh</th>
                        <th className="pb-2.5 font-bold">Lớp</th>
                        <th className="pb-2.5 font-bold">Trạng thái</th>
                        <th className="pb-2.5 font-bold">Nộp lúc</th>
                        <th className="pb-2.5 font-bold text-center">Điểm số</th>
                        <th className="pb-2.5 font-bold text-right">Báo cáo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {sessions.map((session) => (
                        <tr key={session.id} className="hover:bg-slate-800/30">
                          <td className="py-3 font-semibold text-white">{session.student_name}</td>
                          <td className="py-3 text-slate-400">{session.student_class || '-'}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              session.status === 'SUBMITTED' ? 'bg-emerald-500/20 text-emerald-400' :
                              session.status === 'LOCKED_VIOLATION' ? 'bg-red-500/20 text-red-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              {session.status_display}
                            </span>
                          </td>
                          <td className="py-3 text-slate-400">
                            {session.submit_time ? new Date(session.submit_time).toLocaleString('vi-VN') : '-'}
                          </td>
                          <td className="py-3 text-center font-bold text-indigo-300 text-sm">
                            {session.total_score}
                          </td>
                          <td className="py-3 text-right">
                            <a
                              href={`/result/${session.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 transition-colors text-[11px] font-bold"
                            >
                              <Eye className="h-3 w-3" />
                              Chi tiết
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-6 pt-4 pr-1">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={handleFetchSessions}
                className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-center hover:border-blue-500/50 hover:bg-slate-900 transition-all group"
              >
                <div className="text-xs font-bold uppercase text-slate-400 mb-1 group-hover:text-blue-400 flex items-center justify-center gap-1">
                  Số Lượt Nộp <List className="h-3 w-3" />
                </div>
                <div className="text-2xl font-black text-white">{data.total_submissions}</div>
              </button>
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-center">
                <div className="text-xs font-bold uppercase text-blue-400 mb-1">Điểm Trung Bình</div>
                <div className="text-2xl font-black text-blue-300">{data.average_score} <span className="text-xs font-normal">/ {data.max_scale}đ</span></div>
              </div>
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center">
                <div className="text-xs font-bold uppercase text-emerald-400 mb-1">Điểm Cao Nhất</div>
                <div className="text-2xl font-black text-emerald-300">{data.highest_score}đ</div>
              </div>
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-center">
                <div className="text-xs font-bold uppercase text-amber-400 mb-1">Điểm Thấp Nhất</div>
                <div className="text-2xl font-black text-amber-300">{data.lowest_score}đ</div>
              </div>
            </div>

            {/* Score Distribution Histogram */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-400" />
                Phổ Điểm Thí Sinh (Score Distribution)
              </h4>
              <div className="space-y-3">
                {data.score_distribution.map((bracket, i) => {
                  const pct = data.total_submissions > 0 ? Math.round((bracket.count / data.total_submissions) * 100) : 0;
                  return (
                    <div key={i} className="flex items-center gap-3 text-xs">
                      <span className="w-24 font-mono font-semibold text-slate-300">{bracket.range}đ</span>
                      <div className="flex-1 h-5 rounded-lg bg-slate-800 overflow-hidden flex items-center">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-lg transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-16 text-right font-bold text-slate-200">
                        {bracket.count} thí sinh ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Branch Distribution (CS vs ICT) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-blue-500/20 bg-blue-950/20 p-4 flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-600/20 text-blue-400">
                  <Cpu className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium">Nhánh CS (Khoa học Máy tính)</div>
                  <div className="text-lg font-bold text-white">{data.branch_stats.CS} thí sinh lựa chọn</div>
                </div>
              </div>

              <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/20 p-4 flex items-center gap-3">
                <div className="p-3 rounded-xl bg-indigo-600/20 text-indigo-400">
                  <Layers className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium">Nhánh ICT (Tin học Ứng dụng)</div>
                  <div className="text-lg font-bold text-white">{data.branch_stats.ICT} thí sinh lựa chọn</div>
                </div>
              </div>
            </div>

            {/* Question Item Analysis Table */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-emerald-400" />
                Độ Khó Thực Tế & Độ Phân Hóa Từng Câu Hỏi (Item Analysis)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                      <th className="pb-2.5 font-bold">Câu</th>
                      <th className="pb-2.5 font-bold">Phần / Nhánh</th>
                      <th className="pb-2.5 font-bold">Nội dung tóm tắt</th>
                      <th className="pb-2.5 font-bold text-center">Tỷ lệ đúng (% Facility)</th>
                      <th className="pb-2.5 font-bold text-center">Đánh giá độ khó</th>
                      <th className="pb-2.5 font-bold text-center">Độ phân hóa (Discrimination)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {data.questions_analysis.map((q) => (
                      <tr key={q.question_id} className="hover:bg-slate-800/30">
                        <td className="py-2.5 font-bold font-mono text-white">#{q.order_index}</td>
                        <td className="py-2.5">
                          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
                            {q.part_type} {q.branch !== 'COMMON' ? `(${q.branch})` : ''}
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-400 max-w-xs truncate">{q.content_snippet}</td>
                        <td className="py-2.5 text-center font-bold text-white">{q.facility_index}%</td>
                        <td className="py-2.5 text-center">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                              q.facility_index >= 70
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : q.facility_index >= 40
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {q.difficulty_label}
                          </span>
                        </td>
                        <td className="py-2.5 text-center font-mono font-semibold text-indigo-300">
                          +{q.discrimination_index}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
