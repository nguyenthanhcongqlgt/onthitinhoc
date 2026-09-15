import React, { useState, useEffect } from 'react';
import { assessmentApi } from '../../services/api';
import { LiveProctorData, ProctorCandidate } from '../../types';
import {
  Shield,
  Clock,
  User,
  AlertTriangle,
  Lock,
  Unlock,
  PlusCircle,
  CheckCircle2,
  X,
  RotateCw,
  Send,
  AlertCircle,
  Search,
  Filter,
} from 'lucide-react';

interface Props {
  examId: number;
  onClose: () => void;
}

export const LiveProctorModal: React.FC<Props> = ({ examId, onClose }) => {
  const [data, setData] = useState<LiveProctorData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_PROGRESS' | 'SUBMITTED' | 'LOCKED_VIOLATION'>('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const fetchLiveProctor = async () => {
    try {
      const res = await assessmentApi.getLiveProctor(examId);
      setData(res);
      setError('');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Không thể tải dữ liệu giám sát phòng thi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveProctor();
    const interval = setInterval(fetchLiveProctor, 8000);
    return () => clearInterval(interval);
  }, [examId]);

  const handleUnlock = async (candidate: ProctorCandidate) => {
    if (!window.confirm(`Mở khóa cho thí sinh ${candidate.full_name}?`)) return;
    setActionLoadingId(candidate.session_id);
    try {
      await assessmentApi.controlSession(candidate.session_id, 'unlock');
      await fetchLiveProctor();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Mở khóa thất bại.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAddExtraTime = async (candidate: ProctorCandidate) => {
    const minStr = window.prompt(`Cộng thêm bao nhiêu phút cho thí sinh ${candidate.full_name}?`, '5');
    if (!minStr) return;
    const minutes = parseInt(minStr, 10);
    if (isNaN(minutes) || minutes <= 0) return;

    setActionLoadingId(candidate.session_id);
    try {
      await assessmentApi.controlSession(candidate.session_id, 'add_extra_time', { minutes });
      await fetchLiveProctor();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Cộng thời gian thất bại.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleForceSubmit = async (candidate: ProctorCandidate) => {
    if (!window.confirm(`CƯỠNG CHẾ THU BÀI cho thí sinh ${candidate.full_name}?\nBài thi sẽ được chấm ngay lập tức với các đáp án hiện tại.`)) return;
    setActionLoadingId(candidate.session_id);
    try {
      const res = await assessmentApi.controlSession(candidate.session_id, 'force_submit');
      alert(res.message || 'Đã thu bài thành công.');
      await fetchLiveProctor();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Thu bài thất bại.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredCandidates = (data?.candidates || []).filter((c) => {
    const matchesSearch =
      c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.school_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.class_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl p-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600/20 text-red-400 border border-red-500/30">
              <Shield className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Giám Sát Trực Tiếp Phòng Thi (Live Proctor)</h3>
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
              </div>
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

        {/* Stats KPIs */}
        {data && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-b border-slate-800">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-center">
              <div className="text-[11px] font-bold uppercase text-slate-400">Tổng Thí Sinh</div>
              <div className="text-xl font-black text-white">{data.total_candidates}</div>
            </div>
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3 text-center">
              <div className="text-[11px] font-bold uppercase text-blue-400">Đang Làm Bài</div>
              <div className="text-xl font-black text-blue-300">{data.in_progress_count}</div>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-center">
              <div className="text-[11px] font-bold uppercase text-emerald-400">Đã Nộp Bài</div>
              <div className="text-xl font-black text-emerald-300">{data.submitted_count}</div>
            </div>
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-center">
              <div className="text-[11px] font-bold uppercase text-red-400">Bị Khóa / Vi Phạm</div>
              <div className="text-xl font-black text-red-400">{data.locked_count}</div>
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên học sinh, SBD, lớp..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2 pl-9 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="IN_PROGRESS">Đang làm bài</option>
              <option value="SUBMITTED">Đã nộp bài</option>
              <option value="LOCKED_VIOLATION">Bị khóa do vi phạm</option>
            </select>

            <button
              onClick={fetchLiveProctor}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <RotateCw className="h-3.5 w-3.5" />
              Làm mới
            </button>
          </div>
        </div>

        {/* Candidate List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Đang tải trạng thái phòng thi...</div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">{error}</div>
          ) : filteredCandidates.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">Chưa có thí sinh nào tham gia phòng thi này.</div>
          ) : (
            filteredCandidates.map((c) => {
              const isLocked = c.is_locked || c.status === 'LOCKED_VIOLATION';
              const isDone = c.status === 'SUBMITTED';

              return (
                <div
                  key={c.session_id}
                  className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-2xl border transition-all ${
                    isLocked
                      ? 'border-red-500/50 bg-red-950/20'
                      : isDone
                      ? 'border-emerald-500/30 bg-slate-950/40'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-[240px]">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${
                        isLocked
                          ? 'bg-red-500 text-white'
                          : isDone
                          ? 'bg-emerald-600 text-white'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      {c.full_name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{c.full_name}</span>
                        {isLocked && (
                          <span className="rounded-md bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold text-red-400 border border-red-500/30 flex items-center gap-1">
                            <Lock className="h-2.5 w-2.5" /> BỊ KHÓA
                          </span>
                        )}
                        {isDone && (
                          <span className="rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="h-2.5 w-2.5" /> ĐÃ NỘP ({c.total_score}đ)
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {c.class_name} • SBD: <span className="font-mono text-slate-300">{c.school_id}</span>
                        {c.extra_time_minutes > 0 && (
                          <span className="ml-2 text-amber-400 font-bold">+{c.extra_time_minutes}p</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress & Violations */}
                  <div className="my-2 sm:my-0 flex items-center gap-4 w-full sm:w-auto">
                    <div className="w-32">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>Tiến độ</span>
                        <span className="font-bold text-slate-200">
                          {c.answered_count}/{c.total_questions} ({c.progress_percentage}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isDone ? 'bg-emerald-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${c.progress_percentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 min-w-[70px]">
                      <AlertTriangle
                        className={`h-3.5 w-3.5 ${
                          c.violation_count > 0 ? 'text-amber-400' : 'text-slate-600'
                        }`}
                      />
                      <span
                        className={`text-xs font-bold ${
                          c.violation_count > 0 ? 'text-amber-400' : 'text-slate-500'
                        }`}
                      >
                        {c.violation_count}/{c.max_violations}
                      </span>
                    </div>
                  </div>

                  {/* Live Controls */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    {isLocked && (
                      <button
                        onClick={() => handleUnlock(c)}
                        disabled={actionLoadingId === c.session_id}
                        className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-sm disabled:opacity-50"
                      >
                        <Unlock className="h-3 w-3" />
                        Mở Khóa
                      </button>
                    )}

                    {!isDone && (
                      <>
                        <button
                          onClick={() => handleAddExtraTime(c)}
                          disabled={actionLoadingId === c.session_id}
                          className="flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                        >
                          <PlusCircle className="h-3 w-3" />
                          +Thời gian
                        </button>

                        <button
                          onClick={() => handleForceSubmit(c)}
                          disabled={actionLoadingId === c.session_id}
                          className="flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                        >
                          <Send className="h-3 w-3" />
                          Thu bài
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
