import React, { useState, useEffect } from 'react';
import { ExamInfo } from '../../types';
import { examsApi, classApi } from '../../services/api';
import {
  Send,
  X,
  Users,
  Clock,
  KeyRound,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Layers,
  Code2,
} from 'lucide-react';

interface AssignExamModalProps {
  exam: ExamInfo;
  isOpen: boolean;
  onClose: () => void;
  onAssigned: () => void;
}

const DEFAULT_CLASSES = ['Toàn trường', '12A1 (HSG Tin)', '12A2', '11A1 (HSG)', '11A2', '10A1', 'Đội tuyển HSG'];

export const AssignExamModal: React.FC<AssignExamModalProps> = ({
  exam,
  isOpen,
  onClose,
  onAssigned,
}) => {
  if (!isOpen) return null;

  const [classList, setClassList] = useState<string[]>(DEFAULT_CLASSES);
  const [isAssigned, setIsAssigned] = useState<boolean>(exam.is_assigned ?? true);
  const [assignedClasses, setAssignedClasses] = useState<string>(exam.assigned_classes || 'Toàn trường');

  useEffect(() => {
    const loadTeacherClasses = async () => {
      try {
        const classes = await classApi.getClasses();
        if (classes && classes.length > 0) {
          const names = classes.map((c) => c.name);
          // Gộp 'Toàn trường' lên đầu, sau đó là các lớp do giáo viên quản lý
          const merged = ['Toàn trường', ...names.filter((n) => n !== 'Toàn trường')];
          setClassList(merged);
        }
      } catch (err) {
        console.error('Error loading classes for assignment', err);
      }
    };
    loadTeacherClasses();
  }, []);
  const [accessCode, setAccessCode] = useState<string>(exam.access_code || '');
  const [maxAttempts, setMaxAttempts] = useState<number>(exam.max_attempts || 1);
  const [allowRunCode, setAllowRunCode] = useState<boolean>(exam.allow_run_code ?? true);

  // Scheduled Release Times
  const formatDatetimeForInput = (isoString?: string | null) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    // YYYY-MM-DDTHH:mm
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [assignedStartTime, setAssignedStartTime] = useState<string>(formatDatetimeForInput(exam.assigned_start_time));
  const [assignedEndTime, setAssignedEndTime] = useState<string>(formatDatetimeForInput(exam.assigned_end_time));

  // Score & Explanation Permission
  const [showScoreAfterTest, setShowScoreAfterTest] = useState<boolean>(exam.show_score_after_test ?? true);
  const [showExplanationAfterTest, setShowExplanationAfterTest] = useState<boolean>(exam.show_explanation_after_test ?? true);

  // CS / ICT Branch Mode
  const [branchMode, setBranchMode] = useState<'SINGLE' | 'BOTH'>(exam.branch_mode || 'SINGLE');

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const toggleClass = (className: string) => {
    if (className === 'Toàn trường') {
      setAssignedClasses('Toàn trường');
      return;
    }

    const currentList = assignedClasses
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c && c !== 'Toàn trường');

    if (currentList.includes(className)) {
      const updated = currentList.filter((c) => c !== className);
      setAssignedClasses(updated.length > 0 ? updated.join(', ') : 'Toàn trường');
    } else {
      currentList.push(className);
      setAssignedClasses(currentList.join(', '));
    }
  };

  const handleSaveAssignment = async (assignState: boolean) => {
    setIsSaving(true);
    setErrorMsg('');

    try {
      await examsApi.assignExam(exam.id, {
        is_assigned: assignState,
        assigned_classes: assignedClasses,
        assigned_start_time: assignedStartTime ? new Date(assignedStartTime).toISOString() : null,
        assigned_end_time: assignedEndTime ? new Date(assignedEndTime).toISOString() : null,
        max_attempts: maxAttempts,
        allow_run_code: allowRunCode,
        branch_mode: branchMode,
        show_score_after_test: showScoreAfterTest,
        show_explanation_after_test: showExplanationAfterTest,
        access_code: accessCode,
        access_type: accessCode ? 'PROTECTED' : 'PUBLIC',
      });
      onAssigned();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Có lỗi xảy ra khi cập nhật trạng thái giao đề.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-md">
              <Send className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">GIAO ĐỀ THI CHO HỌC SINH</h3>
              <p className="text-xs text-slate-400">
                Chỉ định lớp và mở quyền cho học sinh vào làm bài
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Exam Preview Summary */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-1 text-xs">
          <div className="font-bold text-slate-200 line-clamp-1">{exam.title}</div>
          <div className="text-slate-400 flex items-center gap-3">
            <span>⏱️ {exam.duration_minutes} phút</span>
            <span>•</span>
            <span>📚 {exam.questions_count?.total || 0} câu hỏi</span>
            <span>•</span>
            <span className={exam.is_assigned ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {exam.is_assigned ? '● Đang giao đề' : '○ Bản nháp trong ngân hàng'}
            </span>
          </div>
        </div>

        {/* Target Classes Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-blue-400" />
              Lớp / Đối tượng được giao đề:
            </span>
            <span className="text-[11px] text-slate-400">Chọn nhanh bên dưới</span>
          </label>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {classList.map((cls) => {
              const isSelected = assignedClasses.includes(cls);
              return (
                <button
                  key={cls}
                  type="button"
                  onClick={() => toggleClass(cls)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all border ${
                    isSelected
                      ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cls}
                </button>
              );
            })}
          </div>

          <input
            type="text"
            value={assignedClasses}
            onChange={(e) => setAssignedClasses(e.target.value)}
            placeholder="Hoặc nhập tên lớp (phân cách bằng dấu phẩy: 12A1, 12A2...)"
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none mt-2"
          />
        </div>

        {/* Options Grid: Password & Max Attempts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5 text-amber-400" />
              Mật khẩu vào thi (Tùy chọn)
            </label>
            <input
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="Để trống nếu không cần"
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-indigo-400" />
              Số lần làm bài tối đa
            </label>
            <select
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value={1}>1 lần duy nhất</option>
              <option value={2}>2 lần</option>
              <option value={3}>3 lần</option>
              <option value={99}>Không giới hạn</option>
            </select>
          </div>
        </div>

        {/* Scheduled Release Times */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-blue-400" />
              Hẹn giờ mở đề & Hạn chót nộp bài
            </span>
            <span className="text-[11px] text-slate-500">Tùy chọn hẹn giờ</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Thời gian mở đề (Bắt đầu):
              </label>
              <input
                type="datetime-local"
                value={assignedStartTime}
                onChange={(e) => setAssignedStartTime(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-200 focus:border-blue-500 focus:outline-none font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">Để trống nếu cho làm bài ngay</p>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Hạn chót nộp bài (Kết thúc):
              </label>
              <input
                type="datetime-local"
                value={assignedEndTime}
                onChange={(e) => setAssignedEndTime(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-200 focus:border-blue-500 focus:outline-none font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">Để trống nếu không giới hạn hạn chót</p>
            </div>
          </div>
        </div>

        {/* Part II Branch Mode Configuration (CS vs ICT) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3.5 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-indigo-400" />
              Tùy chọn Phân nhánh Phần II (CS & ICT):
            </span>
            <span className="text-[10px] text-slate-400">Quy chế thi</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setBranchMode('SINGLE')}
              className={`p-3 rounded-xl border text-left transition-all ${
                branchMode === 'SINGLE'
                  ? 'border-indigo-500 bg-indigo-950/40 text-white ring-1 ring-indigo-500 shadow-sm'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-xs text-indigo-300 mb-1">
                <span>1) Chỉ làm CS hoặc ICT</span>
                {branchMode === 'SINGLE' && <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" />}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Học sinh chỉ được phép chọn 1 trong 2 chuyên đề (CS hoặc ICT). Khóa cứng sau khi chọn.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setBranchMode('BOTH')}
              className={`p-3 rounded-xl border text-left transition-all ${
                branchMode === 'BOTH'
                  ? 'border-indigo-500 bg-indigo-950/40 text-white ring-1 ring-indigo-500 shadow-sm'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-xs text-indigo-300 mb-1">
                <span>2) Được làm cả CS & ICT</span>
                {branchMode === 'BOTH' && <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" />}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Học sinh được phép làm cả 2 chuyên đề CS và ICT. Thời gian làm bài vẫn giữ nguyên.
              </p>
            </button>
          </div>
        </div>

        {/* Score & Explanation View Permissions */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3.5 space-y-2.5 text-xs">
          <span className="font-bold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-amber-400" />
            Cài đặt hiển thị kết quả sau khi thi
          </span>

          <div className="space-y-2 pt-1">
            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
              <span className="text-slate-300">Cho phép học sinh xem điểm số ngay sau khi nộp bài</span>
              <input
                type="checkbox"
                checked={showScoreAfterTest}
                onChange={(e) => setShowScoreAfterTest(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
              <span className="text-slate-300">Cho phép học sinh xem đáp án chi tiết sau khi nộp bài</span>
              <input
                type="checkbox"
                checked={showExplanationAfterTest}
                onChange={(e) => setShowExplanationAfterTest(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
              <span className="text-slate-300 flex items-center gap-1.5"><Code2 className="h-3.5 w-3.5 text-emerald-400" /> Cho phép học sinh sử dụng tính năng Chạy thử Code (IDE)</span>
              <input
                type="checkbox"
                checked={allowRunCode}
                onChange={(e) => setAllowRunCode(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-slate-800 pt-4 flex items-center justify-between gap-3">
          {exam.is_assigned ? (
            <button
              type="button"
              onClick={() => handleSaveAssignment(false)}
              disabled={isSaving}
              className="flex items-center gap-1.5 rounded-xl border border-amber-600/40 bg-amber-500/10 px-4 py-2.5 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition-all disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Thu hồi (Hủy giao)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Để sau
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSaveAssignment(true)}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-400 transition-all disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{isSaving ? 'Đang cập nhật...' : 'Xác Nhận Giao Đề Ngay'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
