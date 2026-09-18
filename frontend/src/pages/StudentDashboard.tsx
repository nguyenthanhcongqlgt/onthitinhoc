import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { examsApi, assessmentApi } from '../services/api';
import { ExamInfo, ExamSessionDetail, StudentAnalyticsData } from '../types';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { PaginationBar } from '../components/common/PaginationBar';
import { Skeleton } from '../components/common/Skeleton';
import {
  Home,
  GraduationCap,
  Clock,
  Shield,
  Code2,
  FileText,
  CheckCircle2,
  Lock,
  ChevronRight,
  LogOut,
  AlertTriangle,
  BarChart3,
  KeyRound,
  Award,
  TrendingUp,
  Target,
  Zap,
  Check,
  AlertCircle,
  Calendar,
  Timer,
  Search,
  Sparkles,
  User,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchParams] = useSearchParams();

  const codeParam = searchParams.get('code') || '';
  const autoParam = searchParams.get('auto') === 'true';

  const { data, isLoading } = useQuery({
    queryKey: ['student-dashboard-data'],
    queryFn: async () => {
      const [examsData, sessionsData, analyticsData] = await Promise.all([
        examsApi.getExams(),
        assessmentApi.getSessions(),
        assessmentApi.getStudentAnalytics(),
      ]);
      return { exams: examsData, sessions: sessionsData, analytics: analyticsData };
    },
  });

  const exams = data?.exams || [];
  const sessions = data?.sessions || [];
  const analytics = data?.analytics || null;

  const [examSearch, setExamSearch] = useState<string>(codeParam);
  const [selectedFolderFilter, setSelectedFolderFilter] = useState<string>('ALL');

  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'ALL' | 'SUBMITTED' | 'LOCKED_VIOLATION' | 'IN_PROGRESS'>('ALL');
  const [historyBranchFilter, setHistoryBranchFilter] = useState<'ALL' | 'CS' | 'ICT'>('ALL');
  const [historySortBy, setHistorySortBy] = useState<string>('newest');
  const [historyPage, setHistoryPage] = useState<number>(1);

  const availableFolderNames = React.useMemo(() => {
    const names = new Set<string>();
    exams.forEach((ex) => {
      if (ex.folder_name) names.add(ex.folder_name);
    });
    return Array.from(names);
  }, [exams]);

  // Access Code Modal state
  const [selectedExam, setSelectedExam] = useState<ExamInfo | null>(null);
  const [accessCode, setAccessCode] = useState<string>('');
  const [codeError, setCodeError] = useState<string>('');
  const [isVerifyingCode, setIsVerifyingCode] = useState<boolean>(false);

  useEffect(() => {
    // Auto-join / auto-open if codeParam was supplied from quick join
    if (codeParam && exams.length > 0) {
      const trimmed = codeParam.trim().toLowerCase();
      const matched = exams.find(
        (ex) =>
          ex.id.toString() === trimmed ||
          (ex.title && ex.title.toLowerCase().includes(trimmed))
      );
      if (matched && autoParam) {
        handleStartExam(matched);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeParam, autoParam, exams.length]);

  const handleStartExam = (exam: ExamInfo) => {
    // If protected, prompt access code
    if (exam.access_type === 'PROTECTED') {
      setSelectedExam(exam);
      setAccessCode('');
      setCodeError('');
      return;
    }
    navigate(`/exam/${exam.id}`);
  };

  const handleVerifyAccessCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExam) return;

    setIsVerifyingCode(true);
    setCodeError('');

    try {
      await examsApi.verifyAccessCode(selectedExam.id, accessCode);
      const examId = selectedExam.id;
      setSelectedExam(null);
      navigate(`/exam/${examId}`);
    } catch (err: any) {
      setCodeError(err.response?.data?.detail || 'Mã truy cập không hợp lệ.');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const SESSIONS_PER_PAGE = 10;

  let filteredSessions = sessions.filter(s => {
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase();
      if (!s.exam_title.toLowerCase().includes(q)) return false;
    }
    if (historyStatusFilter !== 'ALL' && s.status !== historyStatusFilter) return false;
    if (historyBranchFilter !== 'ALL' && s.selected_branch !== historyBranchFilter) return false;
    return true;
  });

  filteredSessions = [...filteredSessions].sort((a, b) => {
    switch (historySortBy) {
      case 'oldest': return (a.id) - (b.id);
      case 'score_high': return (parseFloat(String(b.total_score)) || 0) - (parseFloat(String(a.total_score)) || 0);
      case 'score_low': return (parseFloat(String(a.total_score)) || 0) - (parseFloat(String(b.total_score)) || 0);
      case 'newest':
      default: return (b.id) - (a.id);
    }
  });

  const totalHistoryPages = Math.ceil(filteredSessions.length / SESSIONS_PER_PAGE);
  const paginatedSessions = filteredSessions.slice((historyPage - 1) * SESSIONS_PER_PAGE, historyPage * SESSIONS_PER_PAGE);

  useEffect(() => {
    setHistoryPage(1);
  }, [historySearch, historyStatusFilter, historyBranchFilter, historySortBy]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-16">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-3 group hover:opacity-90 transition-opacity"
              title="Về Trang Chủ"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col justify-center">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-white group-hover:text-blue-400 transition-colors uppercase leading-tight whitespace-nowrap">
                  Web App Ôn thi trắc nghiệm
                </span>
                <span className="font-extrabold text-xs sm:text-sm tracking-tight text-blue-400 transition-colors uppercase leading-tight whitespace-nowrap">
                  Môn Tin học THPT
                </span>
                <p className="text-[9px] sm:text-[10px] font-semibold text-blue-400 mt-0.5 whitespace-nowrap">
                  TRƯỜNG THPT QUẤT LÂM - NINH BÌNH
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all whitespace-nowrap"
              title="Về Trang Chủ hệ thống"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Trang Chủ</span>
            </Link>

            <Link
              to="/playground"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all whitespace-nowrap"
              title="Góc Thực Hành Lập Trình & CSDL (Python, C++, SQL, HTML/CSS)"
            >
              <Code2 className="h-4 w-4" />
              <span className="hidden sm:inline">Góc Thực Hành ⚡</span>
            </Link>

            {/* Utility Icons */}
            <div className="flex items-center gap-1 sm:gap-1.5 ml-2">
              <ThemeToggle variant="switch-only" className="mr-1" />

              <Link
                to="/change-password"
                className="p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                title="Cài đặt tài khoản"
              >
                <User className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </div>

            {/* User Profile & Logout */}
            <div className="flex items-center gap-2 border-l border-slate-700/50 pl-2 sm:pl-4 ml-1">
              <div className="hidden lg:block text-right">
                <div className="text-[13px] font-bold text-slate-200">{user?.full_name || user?.username}</div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">{user?.class_name || 'Học sinh'} • SBD: {user?.student_id || 'Chưa cấp'}</div>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Đăng xuất"
              >
                <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-blue-900/60 via-slate-900 to-indigo-950/60 p-6 sm:p-8 shadow-xl">
          <div className="max-w-2xl relative z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-300 mb-3 border border-blue-500/30">
              <Award className="h-3.5 w-3.5" /> Đấu trường Học sinh Giỏi 2025 - 2026
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Chào mừng, {user?.full_name || user?.username}!
            </h2>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              Các bài thi được thiết kế bám sát cấu trúc đề thi HSG & HSA 2025: Phần I trắc nghiệm nhiều lựa chọn + Phần II trắc nghiệm Đúng/Sai phân hóa định hướng <strong>CS (Khoa học máy tính)</strong> và <strong>ICT (Tin học ứng dụng)</strong>.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link
                to="/playground"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-emerald-950/40 transition-all hover:scale-105"
              >
                <Code2 className="h-4 w-4" />
                Mở Góc Thực Hành Code & SQL Sandbox ⚡
              </Link>
            </div>
          </div>
        </div>

        {/* Available Exams Section */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-400" />
              <h3 className="text-lg font-bold text-white">ĐỀ THI ĐƯỢC GIÁO VIÊN GIAO</h3>
            </div>
            <div className="flex items-center gap-3">
              {exams.length > 0 && (
                <div className="relative w-64 sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={examSearch}
                    onChange={(e) => setExamSearch(e.target.value)}
                    placeholder="Tìm kiếm mã đề / tên đề..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-700/60 bg-slate-950/60 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}
              <span className="text-xs text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-lg shrink-0">
                {exams.length} đề thi sẵn sàng
              </span>
            </div>
          </div>

          {/* Category / Folder Filter Bar */}
          {availableFolderNames.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 font-semibold text-[11px] shrink-0">Chủ đề / Khối:</span>
              <button
                type="button"
                onClick={() => setSelectedFolderFilter('ALL')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  selectedFolderFilter === 'ALL'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Tất cả ({exams.length})
              </button>
              {availableFolderNames.map((name) => {
                const count = exams.filter((e) => e.folder_name === name).length;
                const sampleExam = exams.find((e) => e.folder_name === name);
                const color = sampleExam?.folder_color || '#3b82f6';
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setSelectedFolderFilter(name)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                      selectedFolderFilter === name
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    <span
                      className="h-2 w-2 rounded-full inline-block"
                      style={{ backgroundColor: color }}
                    />
                    <span>📁 {name}</span>
                    <span className="text-[10px] opacity-75">({count})</span>
                  </button>
                );
              })}
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-lg h-[240px]">
                  <div>
                    <div className="flex justify-between mb-3">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                  <Skeleton className="h-10 w-full mt-4" />
                </div>
              ))}
            </div>
          ) : exams.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-12 text-center text-slate-400 space-y-2">
              <FileText className="mx-auto h-8 w-8 text-slate-600" />
              <p className="font-semibold text-slate-300">Hiện chưa có đề thi nào được Thầy/Cô giao cho bạn.</p>
              <p className="text-xs text-slate-500">Giáo viên cần thao tác "Giao đề" trong ngân hàng đề thi thì bài thi mới xuất hiện tại đây.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {exams
                .filter((exam) => {
                  if (selectedFolderFilter !== 'ALL' && exam.folder_name !== selectedFolderFilter) {
                    return false;
                  }
                  if (!examSearch.trim()) return true;
                  const q = examSearch.trim().toLowerCase();
                  return (
                    exam.id.toString() === q ||
                    (exam.title && exam.title.toLowerCase().includes(q)) ||
                    (exam.description && exam.description.toLowerCase().includes(q)) ||
                    (exam.folder_name && exam.folder_name.toLowerCase().includes(q)) ||
                    (exam.assigned_classes && exam.assigned_classes.toLowerCase().includes(q))
                  );
                })
                .map((exam) => {
                const existingSession = sessions.find((s) => s.exam === exam.id);
                const isCompleted = existingSession && existingSession.status !== 'IN_PROGRESS';

                const now = new Date();
                const startTime = exam.assigned_start_time ? new Date(exam.assigned_start_time) : null;
                const endTime = exam.assigned_end_time ? new Date(exam.assigned_end_time) : null;
                const isNotStarted = startTime !== null && now < startTime;
                const isExpired = endTime !== null && now > endTime;

                return (
                  <div
                    key={exam.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-lg hover:border-blue-500/50 hover:shadow-blue-500/10 transition-all group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-600/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/30">
                            🎓 Lớp: {exam.assigned_classes || 'Toàn trường'}
                          </span>
                          {exam.folder_name && (
                            <span
                              className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold border"
                              style={{
                                backgroundColor: `${exam.folder_color || '#3b82f6'}18`,
                                borderColor: `${exam.folder_color || '#3b82f6'}40`,
                                color: exam.folder_color || '#60a5fa',
                              }}
                            >
                              📁 {exam.folder_name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>{exam.duration_minutes} phút</span>
                        </div>
                      </div>

                      <h4 className="font-bold text-slate-100 text-base group-hover:text-blue-300 transition-colors line-clamp-2">
                        {exam.title}
                      </h4>

                      <p className="mt-2 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {exam.description || 'Đề thi trắc nghiệm kết hợp Đúng/Sai phân hóa định hướng CS/ICT.'}
                      </p>

                      {/* Scheduled Time Notice Banner */}
                      {startTime && (
                        <div className="mt-3 p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
                          <span className="flex items-center gap-1 text-slate-400">
                            <Calendar className="h-3 w-3 text-blue-400" /> Giờ mở đề:
                          </span>
                          <span className={`font-semibold ${isNotStarted ? 'text-amber-300' : 'text-slate-300'}`}>
                            {startTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ngày {startTime.toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      )}

                      {endTime && (
                        <div className="mt-1.5 p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
                          <span className="flex items-center gap-1 text-slate-400">
                            <Timer className="h-3 w-3 text-red-400" /> Hạn chót:
                          </span>
                          <span className={`font-semibold ${isExpired ? 'text-red-400' : 'text-slate-300'}`}>
                            {endTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ngày {endTime.toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      )}

                      <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-900 pt-3">
                        <div className="flex items-center gap-1">
                          <Shield className="h-3.5 w-3.5 text-amber-400" />
                          <span>Max {exam.max_tab_violations} lần chuyển tab</span>
                        </div>
                        {exam.access_type === 'PROTECTED' && (
                          <div className="flex items-center gap-1 text-amber-400 font-semibold">
                            <Lock className="h-3 w-3" /> Cần mật khẩu
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 pt-3">
                      {isCompleted ? (
                        <button
                          onClick={() => navigate(`/result/${existingSession.id}`)}
                          className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-2.5 px-4 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition-all"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Đã thi {existingSession.total_score !== null && existingSession.total_score !== undefined ? `(${existingSession.total_score}đ)` : ''} • Xem Kết quả
                        </button>
                      ) : isNotStarted ? (
                        <div className="w-full text-center py-2.5 px-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs font-bold text-amber-300">
                          ⏳ Chưa mở thi (Đến giờ mới được vào)
                        </div>
                      ) : isExpired && !existingSession ? (
                        <div className="w-full text-center py-2.5 px-4 rounded-xl border border-red-500/30 bg-red-500/10 text-xs font-bold text-red-400">
                          ⛔ Đã hết hạn làm bài
                        </div>
                      ) : isExpired && existingSession ? (
                        <button
                          onClick={() => handleStartExam(exam)}
                          className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-600 py-2.5 px-4 text-xs font-bold text-white shadow-md shadow-orange-600/30 hover:bg-orange-500 transition-all"
                        >
                          <span>Tiếp tục nộp bài (đã hết giờ)</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStartExam(exam)}
                          className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 px-4 text-xs font-bold text-white shadow-md shadow-blue-600/30 hover:bg-blue-500 transition-all"
                        >
                          <span>Bắt đầu làm bài</span>
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Competency Radar & Personal Analytics Section */}
        {analytics && analytics.total_exams_taken > 0 && (
          <section className="space-y-4 pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              <h3 className="text-lg font-bold text-white">BÁO CÁO NĂNG LỰC CÁ NHÂN & ĐIỂM MẠNH / YẾU</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Radar Bars */}
              <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-950/60 p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-400" />
                    Độ Chuẩn Xác Theo Nhóm Năng Lực
                  </span>
                  <span className="text-xs text-blue-400 font-semibold">
                    Đã hoàn thành {analytics.total_exams_taken} bài thi (ĐTB: {analytics.average_score}đ)
                  </span>
                </div>

                <div className="space-y-3 pt-2">
                  {[
                    { key: 'PROG_BASIC', label: 'Lập trình Cơ bản (C++ / Python)' },
                    { key: 'ALGO_DS', label: 'Thuật toán & Cấu trúc Dữ liệu' },
                    { key: 'OPTIMIZATION', label: 'Tối ưu hóa Thời gian & Không gian' },
                    { key: 'DB_NETWORK', label: 'Cơ sở Dữ liệu & Mạng máy tính' },
                    { key: 'MATH_LOGIC', label: 'Toán rời rạc & Tư duy Logic' },
                  ].map((cat) => {
                    const score = analytics.radar_scores[cat.key] || 0;
                    return (
                      <div key={cat.key} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-300">{cat.label}</span>
                          <span className="font-mono font-bold text-white">{score}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              score >= 80
                                ? 'bg-emerald-500'
                                : score >= 60
                                ? 'bg-blue-500'
                                : score >= 40
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Strengths & Weaknesses Recommendations */}
              <div className="space-y-4">
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-5 space-y-2 shadow-lg">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase text-emerald-400">
                    <Zap className="h-4 w-4" />
                    <span>Thế Mạnh Nổi Trội:</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-emerald-200">
                    {analytics.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-5 space-y-2 shadow-lg">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase text-amber-400">
                    <AlertCircle className="h-4 w-4" />
                    <span>Cần Ôn Luyện Bổ Sung:</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-amber-200">
                    {analytics.weaknesses.map((w, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Test History Section */}
        <section className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-400" />
              <h3 className="text-lg font-bold text-white">LỊCH SỬ THI TRỰC TUYẾN</h3>
              <span className="text-xs text-indigo-400 font-semibold bg-indigo-950/60 border border-indigo-800/60 px-2.5 py-1 rounded-lg">
                Hiển thị {paginatedSessions.length} / {sessions.length} lượt thi
              </span>
            </div>
          </div>

          {sessions.length > 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Tìm kiếm tên đề thi..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none pl-9 pr-4 py-2"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-400 font-semibold pl-1">Trạng thái:</span>
                {(['ALL', 'SUBMITTED', 'LOCKED_VIOLATION', 'IN_PROGRESS'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setHistoryStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      historyStatusFilter === status 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {status === 'ALL' ? 'Tất cả' : status === 'SUBMITTED' ? 'Hoàn thành' : status === 'LOCKED_VIOLATION' ? 'Bị khóa' : 'Đang làm'}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-400 font-semibold pl-1 border-l border-slate-700 ml-1">Nhánh:</span>
                {(['ALL', 'CS', 'ICT'] as const).map(branch => (
                  <button
                    key={branch}
                    onClick={() => setHistoryBranchFilter(branch)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      historyBranchFilter === branch 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {branch === 'ALL' ? 'Tất cả' : branch}
                  </button>
                ))}
              </div>
              <select
                value={historySortBy}
                onChange={(e) => setHistorySortBy(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-950 text-xs text-slate-300 px-3 py-2 focus:outline-none focus:border-blue-500 ml-auto"
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="score_high">Điểm cao→thấp</option>
                <option value="score_low">Điểm thấp→cao</option>
              </select>
            </div>
          )}

          {sessions.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-6 text-center text-xs text-slate-500">
              Bạn chưa tham gia bài thi nào. Hãy chọn một đề thi phía trên để thử sức!
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-6 text-center text-xs text-slate-500">
              Không tìm thấy lượt thi phù hợp với bộ lọc.
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60 shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="border-b border-slate-800 bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="px-5 py-3.5">Đề thi</th>
                        <th className="px-4 py-3.5">Nhánh Phần II</th>
                        <th className="px-4 py-3.5">Điểm Phần I</th>
                        <th className="px-4 py-3.5">Điểm Phần II</th>
                        <th className="px-4 py-3.5">Tổng điểm</th>
                        <th className="px-4 py-3.5">Trạng thái</th>
                        <th className="px-5 py-3.5 text-right">Chi tiết</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {paginatedSessions.map((session) => (
                        <tr key={session.id} className="hover:bg-slate-900/50 transition-colors">
                          <td className="px-5 py-4 font-semibold text-white max-w-xs truncate">
                            {session.exam_title}
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex rounded-md bg-indigo-500/10 px-2 py-0.5 text-[11px] font-bold text-indigo-400 border border-indigo-500/20">
                              {session.selected_branch === 'CS' ? 'CS (Khoa học MT)' : session.selected_branch === 'ICT' ? 'ICT (Tin học UD)' : 'Chưa chọn'}
                            </span>
                          </td>
                          <td className="px-4 py-4 font-mono font-medium text-slate-300">
                            {session.part1_score}đ ({session.part1_correct_count} câu)
                          </td>
                          <td className="px-4 py-4 font-mono font-medium text-slate-300">
                            {session.part2_score}đ
                          </td>
                          <td className="px-4 py-4 font-mono text-sm font-bold text-blue-400">
                            {session.total_score}đ
                          </td>
                          <td className="px-4 py-4">
                            {session.status === 'SUBMITTED' ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Hoàn thành
                              </span>
                            ) : session.status === 'LOCKED_VIOLATION' ? (
                              <span className="inline-flex items-center gap-1 text-red-400 font-semibold">
                                <AlertTriangle className="h-3.5 w-3.5" /> Bị khóa ({session.violation_count} vi phạm)
                              </span>
                            ) : (
                              <span className="text-amber-400 font-semibold">Đang làm dở</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => navigate(`/result/${session.id}`)}
                              className="rounded-lg bg-blue-600/20 px-3.5 py-2 font-bold text-blue-400 hover:bg-blue-600 hover:text-white transition-all text-xs"
                            >
                              Xem Phân Tích
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <PaginationBar
                currentPage={historyPage}
                totalPages={totalHistoryPages}
                totalItems={filteredSessions.length}
                itemsPerPage={SESSIONS_PER_PAGE}
                onPageChange={setHistoryPage}
                label="lượt thi"
              />
            </>
          )}
        </section>
      </main>

      {/* Access Code Modal */}
      {selectedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Yêu cầu Mã Truy Cập</h3>
                <p className="text-xs text-slate-400 truncate max-w-xs">{selectedExam.title}</p>
              </div>
            </div>

            {codeError && (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                {codeError}
              </div>
            )}

            <form onSubmit={handleVerifyAccessCode} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nhập Mã Access Code / Mật khẩu do Giáo viên cung cấp:
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="vd: QL2025"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedExam(null)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingCode}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-500 shadow-md shadow-blue-600/30 disabled:opacity-50"
                >
                  {isVerifyingCode ? 'Đang kiểm tra...' : 'Vào Thi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
