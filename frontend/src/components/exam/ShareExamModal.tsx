import React, { useState, useEffect } from 'react';
import { examsApi } from '../../services/api';
import { ExamInfo } from '../../types';
import {
  X,
  Share2,
  Users,
  Search,
  CheckCircle2,
  Globe,
  Lock,
  UserCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface TeacherItem {
  id: number;
  full_name: string;
  username: string;
  email: string;
  is_shared: boolean;
}

interface ShareExamModalProps {
  exam: ExamInfo;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ShareExamModal: React.FC<ShareExamModalProps> = ({
  exam,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSharedAll, setIsSharedAll] = useState<boolean>(false);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  useEffect(() => {
    if (!isOpen || !exam) return;

    const fetchShareStatus = async () => {
      setIsLoading(true);
      setErrorMsg('');
      setSuccessMsg('');
      try {
        const res = await examsApi.getExamShareStatus(exam.id);
        setIsSharedAll(!!res.is_shared_with_all_teachers);
        setTeachers(res.available_teachers || []);
        setSelectedIds(res.shared_teacher_ids || []);
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.response?.data?.detail || 'Không thể tải thông tin chia sẻ đề thi.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchShareStatus();
  }, [isOpen, exam]);

  if (!isOpen) return null;

  const handleToggleTeacher = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(teachers.map((t) => t.id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await examsApi.updateExamShare(exam.id, {
        teacher_ids: selectedIds,
        is_shared_with_all_teachers: isSharedAll,
      });
      setSuccessMsg('Đã lưu cấu hình chia sẻ đề thi thành công!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 700);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || 'Lỗi khi lưu phân quyền chia sẻ đề thi.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredTeachers = teachers.filter(
    (t) =>
      t.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Phân quyền Chia sẻ Đề thi
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-md" title={exam.title}>
                Đề: <span className="text-indigo-300 font-semibold">{exam.title}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 min-h-0">
          {errorMsg && (
            <div className="rounded-xl border border-red-500/40 bg-red-950/50 p-3.5 text-sm text-red-200 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/50 p-3.5 text-sm text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Privacy Note */}
          <div className="rounded-xl border border-blue-500/30 bg-blue-950/30 p-3.5 text-xs text-blue-200 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-blue-300">
              <Lock className="h-3.5 w-3.5" />
              Quy định Bảo mật Đề thi:
            </div>
            <p className="opacity-90">
              Mặc định, đề thi do Thầy/Cô tạo ra chỉ có duy nhất Thầy/Cô và Super Admin có quyền xem và sử dụng.
              Các giáo viên khác chỉ có thể xem và giao đề này khi được Thầy/Cô cấp quyền chia sẻ dưới đây.
            </p>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
              <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
              <span className="text-sm">Đang tải danh sách giáo viên...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Public to all teachers switch */}
              <div
                onClick={() => setIsSharedAll(!isSharedAll)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  isSharedAll
                    ? 'border-indigo-500/70 bg-indigo-950/40 ring-1 ring-indigo-500'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg border ${
                    isSharedAll ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40' : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}>
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-slate-100 block">
                      Chia sẻ công khai cho tất cả Giáo viên trong trường
                    </span>
                    <span className="text-xs text-slate-400 block mt-0.5">
                      Bất kỳ giáo viên nào trong trường cũng có thể xem và sử dụng đề thi này.
                    </span>
                  </div>
                </div>
                <div className={`h-6 w-11 rounded-full transition-colors flex items-center px-0.5 ${
                  isSharedAll ? 'bg-indigo-600' : 'bg-slate-800'
                }`}>
                  <div className={`h-5 w-5 rounded-full bg-white transition-transform ${
                    isSharedAll ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </div>
              </div>

              {/* Specific Teachers Selection */}
              {!isSharedAll && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-indigo-400" />
                      Chỉ định từng Giáo viên cụ thể ({selectedIds.length}/{teachers.length}):
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                      >
                        Chọn tất cả
                      </button>
                      <span className="text-slate-600">|</span>
                      <button
                        type="button"
                        onClick={handleDeselectAll}
                        className="text-xs text-slate-400 hover:text-slate-200"
                      >
                        Bỏ chọn
                      </button>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Tìm kiếm giáo viên theo tên, tài khoản, email..."
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* Teachers List */}
                  {filteredTeachers.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                      {teachers.length === 0
                        ? 'Chưa có giáo viên nào khác trong hệ thống để chia sẻ.'
                        : 'Không tìm thấy giáo viên phù hợp với từ khóa.'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                      {filteredTeachers.map((t) => {
                        const isChecked = selectedIds.includes(t.id);
                        return (
                          <div
                            key={t.id}
                            onClick={() => handleToggleTeacher(t.id)}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                              isChecked
                                ? 'border-indigo-500/70 bg-indigo-950/40 text-white'
                                : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-bold text-xs ${
                                isChecked ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                              }`}>
                                {t.full_name?.charAt(0)?.toUpperCase() || 'G'}
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-xs block truncate">
                                  {t.full_name || t.username}
                                </span>
                                <span className="text-[10px] text-slate-400 block truncate font-mono">
                                  @{t.username}
                                </span>
                              </div>
                            </div>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}} // Handled by parent div
                              className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 cursor-pointer"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 px-6 py-4 bg-slate-950/80">
          <div className="text-xs text-slate-400">
            {isSharedAll ? (
              <span className="text-indigo-400 font-bold">🌐 Công khai cho toàn bộ giáo viên</span>
            ) : (
              <span>Đang chọn chia sẻ cho <strong className="text-white">{selectedIds.length}</strong> giáo viên</span>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-500 shadow-md hover:shadow-indigo-500/25 transition-all disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
              <span>{isSaving ? 'Đang lưu...' : 'Lưu phân quyền'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
