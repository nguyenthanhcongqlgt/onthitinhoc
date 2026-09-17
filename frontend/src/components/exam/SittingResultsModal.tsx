import React, { useState, useEffect } from 'react';
import { ExamSitting } from '../../types';
import { sittingsApi } from '../../services/api';
import { X, BarChart3, RotateCcw, CheckCircle2, Clock, ShieldAlert, AlertTriangle } from 'lucide-react';

interface SittingResultsModalProps {
  sitting: ExamSitting;
  isOpen: boolean;
  onClose: () => void;
}

export const SittingResultsModal: React.FC<SittingResultsModalProps> = ({ sitting, isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [summary, setSummary] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);

  // Broadcast state
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const fetchResults = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await sittingsApi.results(sitting.id);
      if (res.success) {
        setSummary(res.summary);
        setResults(res.results || []);
      } else setErrorMsg('Lỗi tải dữ liệu');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Lỗi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    setIsBroadcasting(true);
    try {
      await sittingsApi.createBroadcast(sitting.id, broadcastMsg.trim());
      setBroadcastMsg('');
      alert('Đã gửi thông báo thành công!');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Lỗi gửi thông báo');
    } finally {
      setIsBroadcasting(false);
    }
  };

  useEffect(() => { if (isOpen) fetchResults(); }, [isOpen, sitting.id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 text-slate-300 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-4 duration-300 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <h2 className="text-xl font-bold flex items-center gap-2 text-white"><BarChart3 className="text-blue-500" /> Điểm Ca Thi: {sitting.name}</h2>
          <div className="flex gap-2">
            <button onClick={fetchResults} className="p-2 hover:bg-slate-800 hover:text-white rounded-full transition-colors" aria-label="Làm mới" title="Làm mới">
              <RotateCcw className={`h-5 w-5 ${isLoading?'animate-spin text-blue-500':''}`} />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 hover:text-white rounded-full transition-colors" aria-label="Đóng" title="Đóng">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto flex-1 bg-slate-950/50">
          {errorMsg && <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">{errorMsg}</div>}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center"><span className="text-xs text-slate-500 uppercase font-semibold">Đã nộp / Tổng</span><div className="text-xl font-bold text-white mt-1">{summary.total_submitted}/{summary.total_assigned}</div></div>
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center"><span className="text-xs text-slate-500 uppercase font-semibold">Đang thi</span><div className="text-xl font-bold text-blue-400 mt-1">{summary.total_in_progress}</div></div>
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center"><span className="text-xs text-slate-500 uppercase font-semibold">Điểm TB</span><div className="text-xl font-bold text-amber-400 mt-1">{summary.average_score ?? '-'}</div></div>
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center"><span className="text-xs text-slate-500 uppercase font-semibold">Cao Nhất</span><div className="text-xl font-bold text-emerald-400 mt-1">{summary.highest_score ?? '-'}</div></div>
            </div>
          )}

          {/* Gửi thông báo cho toàn ca thi */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 mb-6 shadow-md flex flex-col md:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
                Gửi thông báo toàn ca thi (Broadcast)
              </label>
              <input
                type="text"
                placeholder="Nhập nội dung thông báo cho tất cả thí sinh đang làm bài..."
                value={broadcastMsg}
                onChange={(e) => setBroadcastMsg(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendBroadcast();
                }}
              />
            </div>
            <button
              onClick={handleSendBroadcast}
              disabled={isBroadcasting || !broadcastMsg.trim()}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isBroadcasting ? 'Đang gửi...' : 'Gửi thông báo'}
            </button>
          </div>

          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-x-auto overflow-y-hidden shadow-xl">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-800/50 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                <tr><th className="p-4 w-12 text-center">#</th><th className="p-4">Họ và Tên</th><th className="p-4">Lớp</th><th className="p-4">Mã Đề Thi</th><th className="p-4">Trạng Thái</th><th className="p-4 text-center">Tổng Điểm</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {results.length === 0 && !isLoading ? (<tr><td colSpan={6} className="p-8 text-center text-slate-500">Chưa có dữ liệu thí sinh</td></tr>) : 
                results.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 text-center text-slate-500 font-medium">{idx + 1}</td>
                    <td className="p-4 font-bold text-white">{r.student_name}</td>
                    <td className="p-4 text-slate-400">{r.student_class}</td>
                    <td className="p-4 text-blue-400">{r.exam_title}</td>
                    <td className="p-4">
                      {r.status === 'SUBMITTED' && <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20"><CheckCircle2 className="w-3.5 h-3.5"/>Đã nộp</span>}
                      {r.status === 'IN_PROGRESS' && <span className="inline-flex items-center gap-1 text-blue-400 text-xs font-bold bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/20"><Clock className="w-3.5 h-3.5"/>Đang làm</span>}
                      {r.status === 'LOCKED_VIOLATION' && <span className="inline-flex items-center gap-1 text-red-400 text-xs font-bold bg-red-500/10 px-2 py-1 rounded-lg border border-red-500/20"><ShieldAlert className="w-3.5 h-3.5"/>Khóa vi phạm</span>}
                      {r.status === 'NOT_STARTED' && <span className="inline-flex items-center gap-1 text-slate-500 text-xs font-bold bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">Chưa thi</span>}
                    </td>
                    <td className="p-4 text-center font-bold text-amber-400 text-base">{r.total_score !== null ? r.total_score.toFixed(2) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
