import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { examsApi, assessmentApi } from '../services/api';
import { ExamAnalyticsData, PerStudentScore } from '../types';
import { SubmissionDonutChart } from '../components/exam/charts/SubmissionDonutChart';
import { StudentScoreBarChart } from '../components/exam/charts/StudentScoreBarChart';
import { QuestionBreakdownChart } from '../components/exam/charts/QuestionBreakdownChart';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Bell,
  FileSpreadsheet,
  Eye,
  BarChart3,
  Users,
  Award,
  TrendingUp,
  Target,
  Download,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';

export const ExamReport: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ExamAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotStarted, setShowNotStarted] = useState(false);
  const [sortBy, setSortBy] = useState<'score_desc' | 'score_asc' | 'name'>('score_desc');
  const [isReminding, setIsReminding] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showClassComparison, setShowClassComparison] = useState(false);

  const fetchAnalytics = useCallback(async (classFilter?: string) => {
    if (!examId) return;
    setIsLoading(true);
    setError('');
    try {
      const params = classFilter && classFilter !== 'ALL' ? `?class_name=${classFilter}` : '';
      const res = await examsApi.getExamAnalytics(Number(examId), params);
      setData(res);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Không thể tải dữ liệu phân tích.');
    } finally {
      setIsLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    fetchAnalytics(selectedClass);
  }, [fetchAnalytics, selectedClass]);

  const handleRemindStudents = async () => {
    if (!examId) return;
    setIsReminding(true);
    try {
      const res = await examsApi.remindStudents(Number(examId));
      toast.success(res.message || `Đã tìm thấy ${res.total_not_started} học sinh chưa làm bài.`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Không thể lấy danh sách nhắc nhở.');
    } finally {
      setIsReminding(false);
    }
  };

  const handleExportExcel = async () => {
    if (!examId) return;
    setIsExporting(true);
    try {
      const blob = await examsApi.exportExcel(Number(examId));
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bang_diem_${examId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Đã tải xuống bảng điểm Excel!');
    } catch (err: any) {
      toast.error('Không thể xuất file Excel.');
    } finally {
      setIsExporting(false);
    }
  };

  // Filter and sort students
  const getFilteredStudents = (): PerStudentScore[] => {
    if (!data?.per_student_scores) return [];
    let filtered = [...data.per_student_scores];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.student_name.toLowerCase().includes(q) ||
          s.student_class.toLowerCase().includes(q)
      );
    }

    // Show/hide not started
    if (!showNotStarted) {
      filtered = filtered.filter((s) => s.status !== 'NOT_STARTED');
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'score_desc') {
        return (b.total_score ?? -1) - (a.total_score ?? -1);
      } else if (sortBy === 'score_asc') {
        return (a.total_score ?? 999) - (b.total_score ?? 999);
      } else {
        const nameA = a.student_name || '';
        const nameB = b.student_name || '';
        return nameA.localeCompare(nameB, 'vi');
      }
    });

    return filtered;
  };

  const filteredStudents = getFilteredStudents();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent mb-4"></div>
          <p className="text-slate-400 text-sm">Đang tải báo cáo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-300 mb-4">{error}</p>
          <button onClick={() => navigate(-1)} className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700">
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const avgPercentage = data.max_scale > 0 ? (data.average_score / data.max_scale) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/teacher')}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-400" />
                Báo cáo: {data.exam_title}
              </h1>
              <p className="text-xs text-slate-400">Tổng quan kết quả bài kiểm tra</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRemindStudents}
              disabled={isReminding}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-bold transition-colors disabled:opacity-50"
            >
              <Bell className="h-3.5 w-3.5" />
              {isReminding ? 'Đang kiểm tra...' : 'Nhắc HS chưa làm'}
            </button>
            <button
              onClick={handleExportExcel}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-bold transition-colors disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              {isExporting ? 'Đang xuất...' : 'Xuất Excel'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Row 1: KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-center">
            <div className="text-xs font-bold uppercase text-slate-400 mb-1">Số Lượt Nộp</div>
            <div className="text-2xl font-black text-white">{data.total_submissions}</div>
          </div>
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

        {/* Row 2: Donut + Bar Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Donut Chart - Submission Rate */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-400" />
              Tỉ Lệ Nộp Bài
            </h3>
            <SubmissionDonutChart
              submitted={data.submission_rate?.submitted ?? data.total_submissions}
              total={data.submission_rate?.total_assigned ?? data.total_submissions}
            />
          </div>

          {/* Bar Chart - Per Student Scores */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-400" />
              Tỉ Lệ Hoàn Thành Từng Học Sinh
            </h3>
            <div className="h-72">
              <StudentScoreBarChart
                students={data.per_student_scores || []}
                averagePercentage={Number(avgPercentage.toFixed(1))}
              />
            </div>
          </div>
        </div>

        {/* Row 3: Question Breakdown Stacked Bar */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
            <Target className="h-4 w-4 text-emerald-400" />
            Tỉ Lệ Đúng / Sai Từng Câu Hỏi
          </h3>
          <div className="h-72">
            <QuestionBreakdownChart questions={data.per_question_breakdown || []} />
          </div>
        </div>

        {/* Row 4: Student List Table */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-400" />
              Danh Sách Học Sinh
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Tìm theo tên, lớp..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-48"
                />
              </div>
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs rounded-lg bg-slate-800 border border-slate-700 text-slate-300 px-2 py-1.5 focus:outline-none focus:border-blue-500"
              >
                <option value="score_desc">Điểm cao → thấp</option>
                <option value="score_asc">Điểm thấp → cao</option>
                <option value="name">Theo tên A-Z</option>
              </select>
              {/* Toggle not started */}
              <button
                onClick={() => setShowNotStarted(!showNotStarted)}
                className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                  showNotStarted
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="h-3 w-3" />
                {showNotStarted ? 'Ẩn chưa làm' : 'Hiện chưa làm'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="pb-2.5 font-bold">STT</th>
                  <th className="pb-2.5 font-bold">Họ và tên</th>
                  <th className="pb-2.5 font-bold">Lớp</th>
                  <th className="pb-2.5 font-bold text-center">Lần làm</th>
                  <th className="pb-2.5 font-bold text-center">Điểm số</th>
                  <th className="pb-2.5 font-bold text-center">Trạng thái</th>
                  <th className="pb-2.5 font-bold text-center">Vi phạm</th>
                  <th className="pb-2.5 font-bold text-center">Xếp loại</th>
                  <th className="pb-2.5 font-bold text-right">Xem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredStudents.map((student, idx) => (
                  <tr key={student.student_id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 font-mono text-slate-500">{idx + 1}</td>
                    <td className="py-2.5 font-semibold text-white">{student.student_name}</td>
                    <td className="py-2.5 text-slate-400">{student.student_class}</td>
                    <td className="py-2.5 text-center">{student.attempts_count}</td>
                    <td className="py-2.5 text-center font-bold">
                      {student.total_score !== null ? (
                        <span className="text-indigo-300">{student.total_score}</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-2.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          student.status === 'SUBMITTED'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : student.status === 'LOCKED_VIOLATION'
                            ? 'bg-red-500/20 text-red-400'
                            : student.status === 'IN_PROGRESS'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-slate-700/50 text-slate-400'
                        }`}
                      >
                        {student.status === 'SUBMITTED'
                          ? 'Đã nộp'
                          : student.status === 'LOCKED_VIOLATION'
                          ? 'Bị khóa'
                          : student.status === 'IN_PROGRESS'
                          ? 'Đang làm'
                          : 'Chưa làm'}
                      </span>
                    </td>
                    <td className="py-2.5 text-center">
                      {student.violation_count > 0 ? (
                        <span className="text-red-400 font-bold">{student.violation_count}</span>
                      ) : (
                        <span className="text-slate-600">0</span>
                      )}
                    </td>
                    <td className="py-2.5 text-center">
                      {student.grade_classification_display ? (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            student.grade_classification === 'XUAT_SAC'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : student.grade_classification === 'GIOI'
                              ? 'bg-blue-500/20 text-blue-400'
                              : student.grade_classification === 'KHA'
                              ? 'bg-indigo-500/20 text-indigo-400'
                              : student.grade_classification === 'TRUNG_BINH'
                              ? 'bg-amber-500/20 text-amber-400'
                              : student.grade_classification === 'YEU'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-slate-700/50 text-slate-400'
                          }`}
                        >
                          {student.grade_classification_display}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-2.5 text-right">
                      {student.status === 'SUBMITTED' || student.status === 'LOCKED_VIOLATION' ? (
                        <a
                          href={`/result/${student.student_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-[10px] font-bold transition-colors"
                        >
                          <Eye className="h-3 w-3" />
                          Chi tiết
                        </a>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredStudents.length === 0 && (
            <div className="py-8 text-center text-slate-500 text-sm">Không tìm thấy học sinh nào.</div>
          )}
        </div>

        {/* Row 5: Score Distribution (Enhanced with recharts) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-400" />
            Phổ Điểm (Score Distribution)
          </h3>
          <div className="space-y-3">
            {data.score_distribution.map((bracket, i) => {
              const pct = data.total_submissions > 0 ? Math.round((bracket.count / data.total_submissions) * 100) : 0;
              return (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <span className="w-28 font-mono font-semibold text-slate-300">{bracket.range}đ</span>
                  <div className="flex-1 h-6 rounded-lg bg-slate-800 overflow-hidden flex items-center">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-lg transition-all flex items-center justify-end pr-2"
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    >
                      {pct > 10 && <span className="text-[10px] font-bold text-white">{pct}%</span>}
                    </div>
                  </div>
                  <span className="w-24 text-right font-bold text-slate-200">
                    {bracket.count} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Row 6: Class Comparison (if available) */}
        {data.classes_comparison && data.classes_comparison.length > 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <button
              onClick={() => setShowClassComparison(!showClassComparison)}
              className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-300 mb-2"
            >
              <span className="flex items-center gap-2">
                <Award className="h-4 w-4 text-purple-400" />
                So Sánh Giữa Các Lớp
              </span>
              {showClassComparison ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showClassComparison && (
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                      <th className="pb-2.5 font-bold">Lớp</th>
                      <th className="pb-2.5 font-bold text-center">Số lượt</th>
                      <th className="pb-2.5 font-bold text-center">TB</th>
                      <th className="pb-2.5 font-bold text-center">Cao nhất</th>
                      <th className="pb-2.5 font-bold text-center">Thấp nhất</th>
                      <th className="pb-2.5 font-bold text-center">Xuất sắc</th>
                      <th className="pb-2.5 font-bold text-center">Giỏi</th>
                      <th className="pb-2.5 font-bold text-center">Khá</th>
                      <th className="pb-2.5 font-bold text-center">Chưa đạt</th>
                      <th className="pb-2.5 font-bold text-center">Tỉ lệ đạt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {data.classes_comparison.map((cls) => (
                      <tr key={cls.class_name} className="hover:bg-slate-800/30">
                        <td className="py-2.5 font-semibold text-white">{cls.class_name}</td>
                        <td className="py-2.5 text-center">{cls.total_submissions}</td>
                        <td className="py-2.5 text-center font-bold text-blue-300">{cls.average_score}</td>
                        <td className="py-2.5 text-center text-emerald-400">{cls.highest_score}</td>
                        <td className="py-2.5 text-center text-amber-400">{cls.lowest_score}</td>
                        <td className="py-2.5 text-center">
                          <span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded text-[10px] font-bold">{cls.excellent_count}</span>
                        </td>
                        <td className="py-2.5 text-center">
                          <span className="bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded text-[10px] font-bold">{cls.good_count}</span>
                        </td>
                        <td className="py-2.5 text-center">
                          <span className="bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded text-[10px] font-bold">{cls.average_count}</span>
                        </td>
                        <td className="py-2.5 text-center">
                          <span className="bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded text-[10px] font-bold">{cls.below_average_count}</span>
                        </td>
                        <td className="py-2.5 text-center font-bold">
                          <span className={cls.pass_rate >= 80 ? 'text-emerald-400' : cls.pass_rate >= 50 ? 'text-amber-400' : 'text-red-400'}>
                            {cls.pass_rate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Row 7: Item Analysis Table */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-emerald-400" />
            Phân Tích Chất Lượng Câu Hỏi (Item Analysis)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="pb-2.5 font-bold">Câu</th>
                  <th className="pb-2.5 font-bold">Phần / Nhánh</th>
                  <th className="pb-2.5 font-bold">Nội dung tóm tắt</th>
                  <th className="pb-2.5 font-bold text-center">Tỷ lệ đúng</th>
                  <th className="pb-2.5 font-bold text-center">Đánh giá</th>
                  <th className="pb-2.5 font-bold text-center">Độ phân hóa</th>
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
    </div>
  );
};
