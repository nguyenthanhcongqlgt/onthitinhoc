import React, { useState } from 'react';
import { examsApi } from '../../services/api';
import { FeedbackType } from '../../types';
import { AlertCircle, CheckCircle2, Flag, Send, X } from 'lucide-react';

interface QuestionDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  examId: number;
  questionId: number;
  questionNumber: number;
  questionContent: string;
  sessionId?: number | null;
  onSuccess?: () => void;
}

export const QuestionDisputeModal: React.FC<QuestionDisputeModalProps> = ({
  isOpen,
  onClose,
  examId,
  questionId,
  questionNumber,
  questionContent,
  sessionId,
  onSuccess,
}) => {
  if (!isOpen) return null;

  const [feedbackType, setFeedbackType] = useState<FeedbackType>('WRONG_KEY');
  const [studentNote, setStudentNote] = useState<string>('');
  const [suggestedOption, setSuggestedOption] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentNote.trim()) {
      setErrorMsg('Vui lòng nhập lý do / phân tích của bạn về câu hỏi này.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await examsApi.submitQuestionFeedback({
        exam: examId,
        question: questionId,
        session_id: sessionId || null,
        feedback_type: feedbackType,
        student_note: studentNote.trim(),
        suggested_option: suggestedOption.trim(),
      });

      setSuccessMsg('Đã gửi phản ánh thành công! Thầy/Cô sẽ xem xét và chấm lại điểm nếu phản ánh chính xác.');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Có lỗi xảy ra khi gửi phản ánh.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600/20 text-red-400 border border-red-500/30">
              <Flag className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">
                BÁO LỖI / PHẢN ÁNH CÂU {questionNumber}
              </h3>
              <p className="text-[11px] text-slate-400">
                Gửi thông tin sai sót về câu hỏi hoặc đáp án đến Giáo viên
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

        {/* Question content snippet */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-300 line-clamp-3">
          <span className="font-bold text-slate-400">Nội dung câu hỏi: </span>
          {questionContent}
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Feedback Type */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Phân loại vấn đề:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { type: 'WRONG_KEY', label: 'Sai đáp án chuẩn' },
                { type: 'WRONG_CONTENT', label: 'Lỗi đề bài / code' },
                { type: 'TYPO', label: 'Lỗi hiển thị / chính tả' },
                { type: 'OTHER', label: 'Vấn đề khác' },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setFeedbackType(item.type as FeedbackType)}
                  className={`p-2.5 rounded-xl border text-left font-semibold transition-all ${
                    feedbackType === item.type
                      ? 'border-blue-500 bg-blue-600/20 text-blue-300 shadow-sm'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Suggested Option */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Đáp án bạn cho là đúng (nếu có):
            </label>
            <input
              type="text"
              value={suggestedOption}
              onChange={(e) => setSuggestedOption(e.target.value)}
              placeholder="Ví dụ: B (hoặc: a Đúng, b Sai, c Đúng, d Sai)"
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Student Explanation */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Mô tả chi tiết / Phân tích vì sao bị sai: <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={4}
              value={studentNote}
              onChange={(e) => setStudentNote(e.target.value)}
              placeholder="Giải thích rõ lý do hoặc cách giải của bạn để Thầy/Cô xem xét..."
              className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-red-600/20 hover:from-red-500 hover:to-rose-500 transition-all disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isSubmitting ? 'Đang gửi...' : 'Gửi Phản Ánh'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
