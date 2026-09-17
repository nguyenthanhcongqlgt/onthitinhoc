import React, { useState } from 'react';
import { authApi } from '../../services/api';
import { Users, Upload, X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export const BulkUserImportModal: React.FC<Props> = ({ onClose, onSuccess }) => {
  const [jsonInput, setJsonInput] = useState<string>(`[
  {
    "username": "hsg_tung",
    "full_name": "Nguyễn Thanh Tùng",
    "role": "STUDENT",
    "class_name": "12A1 - Đội tuyển HSG Tin",
    "student_id": "QL-2025-03",
    "password": "student123"
  },
  {
    "username": "hsg_mai",
    "full_name": "Phạm Tuyết Mai",
    "role": "STUDENT",
    "class_name": "12A1 - Đội tuyển HSG Tin",
    "student_id": "QL-2025-04",
    "password": "student123"
  }
]`);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [resultMsg, setResultMsg] = useState<string>('');

  const handleImport = async () => {
    setError('');
    setResultMsg('');
    setIsLoading(true);

    try {
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed)) {
        throw new Error("Dữ liệu nhập vào phải là một mảng danh sách người dùng (Array []).");
      }
      const res = await authApi.bulkImportUsers(parsed);
      setResultMsg(res.message || 'Nhập danh sách người dùng thành công!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || err.response?.data?.detail || 'Dữ liệu không đúng cú pháp JSON.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Nhập Người Dùng Hàng Loạt (Bulk Import)</h3>
              <p className="text-xs text-slate-400">Dành cho Super Admin import danh sách học sinh / giáo viên</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col min-h-0">
          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {resultMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{resultMsg}</span>
            </div>
          )}

          <div className="space-y-3 flex flex-col flex-1">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-slate-300">Dữ liệu JSON danh sách tài khoản:</label>
              <span className="text-[11px] text-slate-500 font-mono">Role: STUDENT | TEACHER</span>
            </div>

            <textarea
              rows={10}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="w-full flex-1 font-mono text-xs rounded-xl border border-slate-700 bg-slate-950 p-4 text-emerald-400 placeholder-slate-600 focus:border-blue-500 focus:outline-none custom-scrollbar"
            />

            <p className="text-[11px] text-slate-400 italic">
              * Mẹo: Thầy có thể copy trực tiếp danh sách học sinh từ file Excel chuyển sang định dạng JSON hoặc dùng mẫu trên.
            </p>
          </div>
        </div>

        <div className="p-6 pt-4 flex items-center justify-end gap-3 border-t border-slate-800 shrink-0">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-400 hover:bg-slate-800 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleImport}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/30 disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {isLoading ? 'Đang nhập...' : 'Xác nhận Nhập Dữ Liệu'}
          </button>
        </div>
      </div>
    </div>
  );
};
