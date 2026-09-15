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

  useEffect(() => { if (isOpen) fetchResults(); }, [isOpen, sitting.id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white text-slate-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-emerald-600 text-white">
          <h2 className="text-xl font-bold flex items-center gap-2"><BarChart3 /> Điểm Ca Thi: {sitting.name}</h2>
          <div className="flex gap-2">
            <button onClick={fetchResults} className="p-2 hover:bg-white/20 rounded-full"><RotateCcw className={`h-5 w-5 ${isLoading?'animate-spin':''}`} /></button>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full"><X className="h-5 w-5" /></button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
          {errorMsg && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">{errorMsg}</div>}
          {summary && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-xl border text-center"><span className="text-xs text-gray-500 uppercase">Đã nộp / Tổng</span><div className="text-xl font-bold">{summary.total_submitted}/{summary.total_assigned}</div></div>
              <div className="bg-white p-4 rounded-xl border text-center"><span className="text-xs text-gray-500 uppercase">Đang thi</span><div className="text-xl font-bold">{summary.total_in_progress}</div></div>
              <div className="bg-white p-4 rounded-xl border text-center"><span className="text-xs text-gray-500 uppercase">Điểm TB</span><div className="text-xl font-bold text-blue-600">{summary.average_score ?? '-'}</div></div>
              <div className="bg-white p-4 rounded-xl border text-center"><span className="text-xs text-gray-500 uppercase">Cao Nhất</span><div className="text-xl font-bold text-emerald-600">{summary.highest_score ?? '-'}</div></div>
            </div>
          )}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                <tr><th className="p-3 w-12">#</th><th className="p-3">Họ và Tên</th><th className="p-3">Lớp</th><th className="p-3">Mã Đề Thi</th><th className="p-3">Trạng Thái</th><th className="p-3 text-center">Tổng Điểm</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.length === 0 && !isLoading ? (<tr><td colSpan={6} className="p-8 text-center text-gray-500">Chưa có dữ liệu thí sinh</td></tr>) : 
                results.map((r, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="p-3 text-center text-gray-500">{idx + 1}</td>
                    <td className="p-3 font-medium text-gray-900">{r.student_name}</td>
                    <td className="p-3 text-gray-600">{r.student_class}</td>
                    <td className="p-3 text-blue-600">{r.exam_title}</td>
                    <td className="p-3">
                      {r.status === 'SUBMITTED' && <span className="text-emerald-600 font-bold">Đã nộp</span>}
                      {r.status === 'IN_PROGRESS' && <span className="text-blue-600">Đang làm</span>}
                      {r.status === 'LOCKED_VIOLATION' && <span className="text-red-600 font-bold">Khóa vi phạm</span>}
                      {r.status === 'NOT_STARTED' && <span className="text-gray-400">Chưa thi</span>}
                    </td>
                    <td className="p-3 text-center font-bold">{r.total_score !== null ? r.total_score.toFixed(2) : '-'}</td>
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
