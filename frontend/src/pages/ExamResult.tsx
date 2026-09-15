import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assessmentApi } from '../services/api';
import { ExamSessionDetail } from '../types';
import { MathFormula } from '../components/exam/MathFormula';
import { QuestionDisputeModal } from '../components/exam/QuestionDisputeModal';
import {
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  ShieldAlert,
  Layers,
  Sparkles,
  Flag,
  Lock,
  EyeOff,
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

export const ExamResult: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<ExamSessionDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Dispute / Report Question Modal State
  const [disputeQuestion, setDisputeQuestion] = useState<{ id: number; number: number; content: string } | null>(null);

  useEffect(() => {
    // Đảm bảo thoát hoàn toàn khỏi chế độ toàn màn hình khi vào trang kết quả thi
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    const fetchResult = async () => {
      if (!sessionId) return;
      try {
        const data = await assessmentApi.getSessionDetail(Number(sessionId));
        setSession(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchResult();
  }, [sessionId]);

  if (isLoading || !session) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-300">
        <div className="text-center space-y-3">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="text-sm font-semibold">Đang tổng hợp báo cáo khảo thí số...</p>
        </div>
      </div>
    );
  }

  // Prepare data for Competency Radar Chart
  const competencyMap: Record<string, string> = {
    PROG_BASIC: 'Lập trình cơ bản',
    ALGO_DS: 'Thuật toán & CTDL',
    OPTIMIZATION: 'Tối ưu hóa',
    DB_NETWORK: 'CSDL & Mạng',
    ICT_APP: 'Ứng dụng Tin học',
  };

  const radarData = Object.entries(session.competency_scores || {}).map(([key, val]) => ({
    subject: competencyMap[key] || key,
    score: val.percentage,
    fullMark: 100,
  }));

  const isViolationLocked = session.status === 'LOCKED_VIOLATION';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Top Action */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Về Bảng Điều Khiển
          </button>
          <span className="text-xs font-semibold text-slate-400">
            Mã phiên thi: #{session.id} • Thí sinh: {session.student_name}
          </span>
        </div>

        {/* Violation Banner if Locked */}
        {isViolationLocked && (
          <div className="rounded-3xl border border-red-500/40 bg-red-950/40 backdrop-blur-md p-6 text-red-200 space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">BÀI THI BỊ KHÓA DO VI PHẠM QUY CHẾ</h3>
                <p className="text-xs text-red-300">
                  {session.lock_reason || 'Vi phạm chuyển tab quá số lần cho phép.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Score Header Card */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/80 p-8 shadow-2xl">
          {session.total_score === null || session.total_score === undefined ? (
            <div className="text-center py-6 space-y-3">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <EyeOff className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-white">ĐIỂM SỐ ĐANG ĐƯỢC BẢO MẬT</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Giáo viên đã cấu hình giữ bí mật điểm số cho kỳ thi này. Điểm số và xếp hạng của bạn sẽ được Thầy/Cô công bố sau khi toàn bộ các lớp hoàn thành bài thi.
              </p>
              <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-slate-300 font-semibold">
                <span>Trạng thái: </span>
                <strong className="text-emerald-400">{session.status_display}</strong>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Total Score */}
              <div className="text-center md:text-left space-y-1">
                <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-blue-400">
                  <Award className="h-4 w-4" /> Tổng Điểm Đạt Được
                </span>
                <div className="flex items-baseline justify-center md:justify-start gap-2">
                  <span className="font-mono text-5xl sm:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
                    {session.total_score}
                  </span>
                  <span className="text-sm font-semibold text-slate-400">/ {session.exam_total_points || '20.00'} điểm</span>
                </div>
                <p className="text-xs text-slate-400">
                  Trạng thái: <strong className="text-slate-200">{session.status_display}</strong>
                </p>
              </div>

              {/* Part Breakdown */}
              <div className="grid grid-cols-2 gap-3 col-span-2">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                  <div className="text-[11px] font-bold uppercase text-blue-400 mb-1">
                    Phần I: Trắc nghiệm
                  </div>
                  <div className="font-mono text-2xl font-bold text-white">
                    {session.part1_score} <span className="text-sm text-slate-400 font-normal">/ {session.exam_part1_total_points || '12.00'}đ</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Đúng {session.part1_correct_count} câu
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                  <div className="text-[11px] font-bold uppercase text-indigo-400 mb-1">
                    Phần II: Đúng / Sai ({session.selected_branch === 'BOTH' ? 'Cả CS & ICT' : session.selected_branch})
                  </div>
                  <div className="font-mono text-2xl font-bold text-white">
                    {session.part2_score} <span className="text-sm text-slate-400 font-normal">/ {session.exam_part2_total_points || '8.00'}đ</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Đúng {session.part2_correct_subitems_count} ý
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Competency Radar Chart & Diagnostics */}
        <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white">
              BIỂU ĐỒ NĂNG LỰC HỌC SINH (SPIDER / RADAR CHART)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Radar Chart */}
            <div className="h-72 w-full flex items-center justify-center">
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" />
                    <Radar
                      name="Năng lực"
                      dataKey="score"
                      stroke="#6366f1"
                      fill="#6366f1"
                      fillOpacity={0.45}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-slate-500">Chưa đủ dữ liệu biểu đồ năng lực.</div>
              )}
            </div>

            {/* Learning Intelligence Feedback */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                Đánh giá Chuyên môn & Định hướng Bồi dưỡng:
              </h4>
              <div className="space-y-3">
                {Object.entries(session.competency_scores || {}).map(([key, val]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-300">{competencyMap[key] || key}</span>
                      <span className="font-mono text-indigo-400 font-bold">{val.percentage}% ({val.earned}/{val.max}đ)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, val.percentage))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Violations Log List */}
        {session.violations && session.violations.length > 0 && (
          <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">
                NHẬT KÝ GIÁM SÁT VI PHẠM TRONG PHÒNG THI ({session.violations.length} LẦN)
              </h3>
            </div>
            <div className="space-y-2">
              {session.violations.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-red-400">#{v.violation_number}</span>
                    <span className="font-semibold text-slate-200">{v.violation_type_display}</span>
                    <span className="text-slate-400">- {v.details || 'Hệ thống tự động phát hiện'}</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400">
                    {new Date(v.timestamp).toLocaleTimeString('vi-VN')}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Question by Question Review */}
        {session.answers && session.answers.length > 0 && (
          <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
              <Layers className="h-5 w-5 text-blue-400" />
              <h3 className="text-lg font-bold text-white">
                CHI TIẾT ĐÁP ÁN & LỜI GIẢI CÁC CÂU HỎI
              </h3>
            </div>

            <div className="space-y-4">
              {session.answers.map((ans, idx) => (
                <div
                  key={ans.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-200">
                      Câu {idx + 1} ({ans.question_part === 'PART_I' ? 'Phần I' : `Phần II - ${ans.question_branch}`})
                    </span>
                    <span
                      className={`font-mono text-xs font-bold px-2.5 py-1 rounded-lg ${
                        ans.score_awarded > 0
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}
                    >
                      +{ans.score_awarded} {ans.question_point ? `/ ${ans.question_point}` : ''} điểm
                    </span>
                  </div>

                  <div className="text-xs text-slate-300">
                    <MathFormula text={ans.question_content} />
                  </div>

                  {ans.question_part === 'PART_I' && (
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span>Lựa chọn của bạn:</span>
                      <strong className="text-white">
                        Ý {ans.selected_option_label || 'Chưa chọn'}
                      </strong>
                      {ans.is_correct ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> (Chính xác)
                        </span>
                      ) : (
                        <span className="text-red-400 font-semibold flex items-center gap-1">
                          <XCircle className="h-3.5 w-3.5" /> (Chưa chính xác)
                        </span>
                      )}
                    </div>
                  )}

                  {ans.question_part === 'PART_II' && (
                    <div className="text-xs text-slate-400">
                      <span>Số ý Đúng/Sai làm đúng: </span>
                      <strong className="text-indigo-300 font-bold font-mono">
                        {ans.correct_subitems_count} / 4 ý
                      </strong>
                    </div>
                  )}

                  {ans.question_explanation && (
                    <div className="mt-3 p-3.5 rounded-xl bg-slate-950/70 border border-amber-500/20 text-xs text-slate-300 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase text-amber-400 flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5" /> Lời giải & Hướng dẫn chi tiết:
                      </span>
                      <div className="leading-relaxed">
                        <MathFormula text={ans.question_explanation} />
                      </div>
                    </div>
                  )}

                  {/* Dispute / Report Question Button */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => setDisputeQuestion({ id: ans.question, number: idx + 1, content: ans.question_content })}
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-red-400 hover:bg-red-500/10 px-2.5 py-1 rounded-lg transition-all"
                      title="Nếu phát hiện câu hỏi hoặc đáp án này có sai sót, hãy gửi phản ánh cho Thầy/Cô"
                    >
                      <Flag className="h-3.5 w-3.5 text-red-400" />
                      <span>Báo lỗi câu hỏi này 🚩</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Question Dispute Modal */}
        {disputeQuestion && (
          <QuestionDisputeModal
            isOpen={true}
            onClose={() => setDisputeQuestion(null)}
            examId={session.exam}
            questionId={disputeQuestion.id}
            questionNumber={disputeQuestion.number}
            questionContent={disputeQuestion.content}
            sessionId={session.id}
          />
        )}
      </div>
    </div>
  );
};
