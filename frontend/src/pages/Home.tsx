import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { examsApi } from '../services/api';
import {
  GraduationCap,
  Shield,
  ShieldCheck,
  Maximize,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
  Clock,
  LogIn,
  UserPlus,
  LogOut,
  ChevronRight,
  Menu,
  X,
  AlertCircle,
  BookOpen,
  KeyRound,
  FileCheck2,
  Scale,
  MessageSquare,
  BarChart3,
  MonitorCheck,
  Lock,
  Eye,
  Loader2,
  FileText,
} from 'lucide-react';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickExamCode, setQuickExamCode] = useState('');
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  const [quickCodeError, setQuickCodeError] = useState('');
  const [isCheckingCode, setIsCheckingCode] = useState(false);

  // Password / Access Code Prompt Modal for Protected Exams
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalExam, setPasswordModalExam] = useState<{ id: number; title: string; duration_minutes?: number; isSitting?: boolean } | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);

  // States for Manual Exam Selection (Sitting)
  const [showChooseExamModal, setShowChooseExamModal] = useState(false);
  const [chooseExamData, setChooseExamData] = useState<any>(null);

  const handleQuickExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickExamCode.trim();
    if (!trimmed) {
      setQuickCodeError('Vui lòng nhập mã phòng thi hoặc mã đề.');
      return;
    }

    setQuickCodeError('');
    setIsCheckingCode(true);

    try {
      const res = await examsApi.quickJoinExam(trimmed);

      if (res.status === 'CAN_ENTER') {
        // Logged in student with valid exam -> DIRECT ENTRY INTO EXAM ROOM!
        navigate(`/exam/${res.exam_id}`);
      } else if (res.status === 'CHOOSE_EXAM') {
        // Ca thi Manual -> Cần học sinh tự chọn đề
        setChooseExamData(res);
        setShowChooseExamModal(true);
      } else if (res.status === 'SITTING_INFO') {
        // Teacher testing room code
        setQuickCodeError(res.message);
      } else if (res.status === 'NEED_PASSWORD') {
        // Exam requires password modal
        setPasswordModalExam({
          id: res.exam_id || res.sitting_id, // Could be exam or sitting
          title: res.title || res.sitting_name,
          duration_minutes: res.duration_minutes || 0,
          isSitting: !!res.sitting_id
        });
        setPasswordInput('');
        setPasswordError('');
        setShowPasswordModal(true);
      } else if (res.status === 'REQUIRE_LOGIN') {
        // Not logged in -> forward with full details so login lands straight into the exam
        navigate(
          `/login?exam_code=${encodeURIComponent(trimmed)}&exam_id=${res.exam_id || ''}&exam_title=${encodeURIComponent(res.title || res.sitting_name || '')}`
        );
      } else {
        setQuickCodeError(res.detail || 'Không thể vào ca thi.');
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Mã ca thi không tồn tại hoặc chưa được mở. Vui lòng kiểm tra lại.';
      setQuickCodeError(detail);
    } finally {
      setIsCheckingCode(false);
    }
  };

  const handleConfirmPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalExam) return;
    const pass = passwordInput.trim();
    if (!pass) {
      setPasswordError('Vui lòng nhập mật khẩu ca thi.');
      return;
    }

    setIsVerifyingPassword(true);
    setPasswordError('');

    try {
      if (passwordModalExam.isSitting) {
        // Lặp lại logic join với password
        const res = await examsApi.quickJoinExam(quickExamCode.trim(), pass);
        setShowPasswordModal(false);
        if (res.status === 'CAN_ENTER') {
          navigate(`/exam/${res.exam_id}`);
        } else if (res.status === 'CHOOSE_EXAM') {
          setChooseExamData(res);
          setShowChooseExamModal(true);
        } else {
          setQuickCodeError(res.detail || 'Không thể vào ca thi.');
        }
      } else {
        // Đề đơn
        await examsApi.verifyAccessCode(passwordModalExam.id, pass);
        setShowPasswordModal(false);
        navigate(`/exam/${passwordModalExam.id}`);
      }
    } catch (err: any) {
      setPasswordError(err.response?.data?.detail || 'Mật khẩu ca thi không chính xác.');
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  const handleSelectManualExam = async (examId: number) => {
    try {
      const res = await examsApi.quickJoinExam(
        quickExamCode.trim(), 
        passwordInput.trim() || undefined, 
        examId
      );
      if (res.status === 'CAN_ENTER') {
        setShowChooseExamModal(false);
        navigate(`/exam/${res.exam_id}`);
      } else {
        setQuickCodeError(res.detail || 'Không thể vào đề thi này.');
        setShowChooseExamModal(false);
      }
    } catch (err: any) {
      setQuickCodeError(err.response?.data?.detail || 'Lỗi khi chọn đề thi.');
      setShowChooseExamModal(false);
    }
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white relative overflow-x-hidden">
      {/* Background Ambience Glow */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-96 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-40 left-10 w-[450px] h-[450px] bg-teal-600/10 rounded-full blur-[130px] pointer-events-none" />

      {/* =========================================================================
          1. HEADER & TOP NAVIGATION BAR
      ========================================================================= */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex flex-col justify-center">
                <span className="font-extrabold text-sm sm:text-base md:text-lg tracking-tight text-white group-hover:text-blue-400 transition-colors uppercase leading-tight whitespace-nowrap">
                  Web App Ôn thi trắc nghiệm
                </span>
                <span className="font-extrabold text-xs sm:text-sm md:text-base tracking-tight text-blue-400 transition-colors uppercase leading-tight whitespace-nowrap">
                  Môn Tin học THPT
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <button
              onClick={() => scrollToSection('about')}
              className="hover:text-blue-400 transition-colors py-2 cursor-pointer"
            >
              Giới thiệu
            </button>
            <button
              onClick={() => scrollToSection('structure')}
              className="hover:text-blue-400 transition-colors py-2 cursor-pointer"
            >
              Cấu trúc đề
            </button>
            <button
              onClick={() => scrollToSection('security')}
              className="hover:text-blue-400 transition-colors py-2 cursor-pointer"
            >
              Anti-Cheat
            </button>
            <button
              onClick={() => scrollToSection('steps')}
              className="hover:text-blue-400 transition-colors py-2 cursor-pointer"
            >
              Quy trình
            </button>
            <button
              onClick={() => setShowDisclaimerModal(true)}
              className="hover:text-amber-400 text-slate-400 transition-colors py-2 cursor-pointer flex items-center gap-1.5"
            >
              <Scale className="h-4 w-4 text-amber-400" />
              Miễn trừ
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="hover:text-blue-400 transition-colors py-2 cursor-pointer"
            >
              Liên hệ
            </button>
          </nav>

          {/* Desktop Right Actions: ThemeToggle + Auth Status */}
          <div className="hidden sm:flex items-center gap-4">
            <ThemeToggle variant="switch-only" />

            {user ? (
              <div className="flex items-center gap-3 pl-4 border-l border-slate-700">
                <div className="text-right hidden md:block">
                  <div className="text-sm font-bold text-slate-200 truncate max-w-[150px]">
                    {user.full_name || user.username}
                  </div>
                  <div className="text-xs font-semibold text-blue-400">
                    {user.role === 'STUDENT'
                      ? user.class_name || 'Học sinh'
                      : user.role === 'ADMIN'
                      ? 'Super Admin'
                      : 'Giáo viên'}
                  </div>
                </div>

                <Link
                  to={user.role === 'STUDENT' ? '/dashboard' : '/teacher'}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 transition-all"
                >
                  <span>Bảng điều khiển</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <button
                  onClick={logout}
                  title="Đăng xuất"
                  className="p-2.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-4 border-l border-slate-700">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 text-sm font-bold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Đăng nhập</span>
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 transition-all"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Đăng ký</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-3 sm:hidden">
            <ThemeToggle variant="switch-only" />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-800 bg-slate-950 px-4 pt-3 pb-5 space-y-4">
            <div className="flex flex-col space-y-1.5 text-sm font-semibold text-slate-300">
              <button
                onClick={() => scrollToSection('about')}
                className="text-left py-3 px-4 rounded-xl hover:bg-slate-900"
              >
                Giới thiệu
              </button>
              <button
                onClick={() => scrollToSection('structure')}
                className="text-left py-3 px-4 rounded-xl hover:bg-slate-900"
              >
                Cấu trúc đề thi Bộ GD&ĐT
              </button>
              <button
                onClick={() => scrollToSection('security')}
                className="text-left py-3 px-4 rounded-xl hover:bg-slate-900"
              >
                Phòng thi Anti-Cheat
              </button>
              <button
                onClick={() => scrollToSection('steps')}
                className="text-left py-3 px-4 rounded-xl hover:bg-slate-900"
              >
                Quy trình thi
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowDisclaimerModal(true);
                }}
                className="text-left py-3 px-4 rounded-xl text-amber-400 hover:bg-slate-900 flex items-center gap-2"
              >
                <Scale className="h-4 w-4" />
                Miễn trừ trách nhiệm
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="text-left py-3 px-4 rounded-xl hover:bg-slate-900"
              >
                Liên hệ kỹ thuật
              </button>
            </div>

            <div className="pt-4 border-t border-slate-800">
              {user ? (
                <div className="space-y-3">
                  <div className="text-sm font-bold text-white px-2">
                    {user.full_name || user.username} <span className="text-blue-400 font-semibold">({user.role})</span>
                  </div>
                  <Link
                    to={user.role === 'STUDENT' ? '/dashboard' : '/teacher'}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-sm font-bold text-white"
                  >
                    <span>Vào Bảng điều khiển</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-sm font-semibold text-red-400 hover:bg-slate-800"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/login"
                    className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl border border-slate-700 bg-slate-900 text-sm font-bold text-white text-center"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Đăng nhập</span>
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl bg-blue-600 text-sm font-bold text-white text-center"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Đăng ký</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          2. HERO SECTION & QUICK EXAM ENTRY
      ========================================================================= */}
      <section id="about" className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-5xl mx-auto text-center space-y-7">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-bold text-blue-400 backdrop-blur-md shadow-inner">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            <span>Chuẩn cấu trúc Đề thi Mới Bộ GD&ĐT • Phòng thi Chống Gian Lận HSG</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            HỆ THỐNG KHẢO THÍ & ÔN LUYỆN{' '}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-teal-300 bg-clip-text text-transparent">
              TRẮC NGHIỆM TIN HỌC
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Nền tảng thi và ôn luyện chuyên sâu phục vụ Kỳ thi Tốt nghiệp THPT & Học sinh giỏi (HSG) các cấp dành riêng cho học sinh và giáo viên{' '}
            <strong className="text-white font-bold">Trường THPT Quất Lâm - Ninh Bình</strong>.
          </p>

          {/* Quick Exam Code Entry Widget */}
          <div className="max-w-lg mx-auto pt-2">
            <form
              onSubmit={handleQuickExamSubmit}
              className="rounded-2xl border border-slate-700/80 bg-slate-950/70 backdrop-blur-xl p-2.5 shadow-2xl flex flex-col sm:flex-row items-center gap-2"
            >
              <div className="relative w-full">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={quickExamCode}
                  onChange={(e) => setQuickExamCode(e.target.value)}
                  placeholder="Nhập Mã phòng thi / Mã đề thi..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-700/60 bg-slate-900/90 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isCheckingCode}
                className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:from-blue-500 hover:to-indigo-500 transition-all cursor-pointer whitespace-nowrap disabled:opacity-60"
              >
                {isCheckingCode ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Đang xác thực...</span>
                  </>
                ) : (
                  <>
                    <span>Vào ca thi ngay</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {quickCodeError && (
              <p className="text-xs text-red-400 mt-2 text-left px-2 font-medium flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {quickCodeError}
              </p>
            )}

            <p className="text-[11px] text-slate-400 mt-2 text-center">
              💡 Thí sinh có thể nhập trực tiếp mã phòng do giáo viên cấp để vào thẳng ca thi.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              to={user ? (user.role === 'STUDENT' ? '/dashboard' : '/teacher') : '/login'}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-blue-600/30 hover:from-blue-500 hover:to-indigo-500 transition-all hover:scale-105"
            >
              <BookOpen className="h-4 w-4" />
              <span>{user ? 'Vào Bảng Điều Khiển Của Tôi' : 'Bắt Đầu Làm Bài Thi Ngay'}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <button
              onClick={() => scrollToSection('structure')}
              className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 px-6 py-4 text-sm font-bold text-slate-200 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
            >
              <FileCheck2 className="h-4 w-4 text-blue-400" />
              <span>Tìm hiểu cấu trúc đề thi</span>
            </button>
          </div>
        </div>

        {/* Highlight Feature Badges Grid */}
        <div className="max-w-6xl mx-auto mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 backdrop-blur-md hover:border-blue-500/40 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <Maximize className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-white">Khóa Toàn Màn Hình</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Tự động thoát bảo mật sau khi nộp bài</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 backdrop-blur-md hover:border-indigo-500/40 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-white">Định Dạng Chuẩn Bộ GD</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Phần I 4 lựa chọn & Phần II Đúng/Sai đa ý</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 backdrop-blur-md hover:border-teal-500/40 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-white">2 Phân Môn CS & ICT</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Khoa học máy tính & Tin học ứng dụng</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 backdrop-blur-md hover:border-amber-500/40 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-white">Chấm Điểm Lũy Tiến</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Biểu đồ Radar phân tích điểm mạnh yếu</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. SECTION: CẤU TRÚC ĐỀ THI MỚI CHUẨN BỘ GIÁO DỤC & ĐÀO TẠO
      ========================================================================= */}
      <section id="structure" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-950/50 border-y border-slate-800/80">
        <div className="max-w-[1600px] mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-400 border border-indigo-500/20">
              <FileCheck2 className="h-3.5 w-3.5" />
              Định dạng Đề thi 2025+
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              CẤU TRÚC ĐỀ THI CHUẨN ĐỊNH DẠNG MỚI CỦA BỘ GD&ĐT
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Áp dụng thống nhất cho các kỳ kiểm tra định kỳ, thi thử Tốt nghiệp THPT và bồi dưỡng Học sinh giỏi môn Tin học tại THPT Quất Lâm - Ninh Bình.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Card Phần I */}
            <div className="rounded-3xl border border-blue-500/30 bg-slate-900/80 p-8 shadow-xl space-y-6 relative overflow-hidden group hover:border-blue-500/60 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all pointer-events-none" />
              
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-lg bg-blue-600/20 border border-blue-500/40 px-3 py-1 text-xs font-extrabold text-blue-400">
                  PHẦN I • 6.0 ĐIỂM
                </span>
                <span className="text-xs font-semibold text-slate-400">24 Câu hỏi • 0.25đ / câu</span>
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-white">
                  Trắc Nghiệm Nhiều Lựa Chọn (Multiple Choice)
                </h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Mỗi câu hỏi có 4 phương án trả lời <strong>A, B, C, D</strong>, trong đó thí sinh chỉ được lựa chọn một phương án đúng duy nhất.
                </p>
              </div>

              <div className="space-y-3 text-xs bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                  <span><strong>Mức độ nhận thức:</strong> Nhận biết (40%), Thông hiểu (40%), Vận dụng (20%).</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                  <span><strong>Nội dung:</strong> Máy tính & xã hội tri thức, Mạng & Internet, Đạo đức & pháp luật số, Kiến thức cơ bản về Hệ quản trị CSDL & Thuật toán.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                  <span><strong>Tính năng hỗ trợ:</strong> Thí sinh có thể gạch bỏ phương án loại trừ trực tiếp trên màn hình thi để tập trung suy luận.</span>
                </div>
              </div>
            </div>

            {/* Card Phần II */}
            <div className="rounded-3xl border border-indigo-500/30 bg-slate-900/80 p-8 shadow-xl space-y-6 relative overflow-hidden group hover:border-indigo-500/60 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all pointer-events-none" />

              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-600/20 border border-indigo-500/40 px-3 py-1 text-xs font-extrabold text-indigo-400">
                  PHẦN II • 4.0 ĐIỂM
                </span>
                <span className="text-xs font-semibold text-slate-400">4 Câu hỏi đa ý • Thang điểm lũy tiến</span>
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-white">
                  Trắc Nghiệm Đúng / Sai Phức Hợp (True/False Matrix)
                </h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Mỗi câu hỏi gồm 4 ý tiểu mục <strong>a, b, c, d</strong>. Thí sinh phải xác định mỗi ý là Đúng (Đ) hoặc Sai (S).
                </p>
              </div>

              <div className="space-y-3 text-xs bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between font-bold text-slate-200 border-b border-slate-800 pb-2">
                  <span>Quy tắc chấm điểm lũy tiến:</span>
                  <span className="text-indigo-400">Tối đa 1.0đ / câu</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="font-bold text-slate-300">1 ý đúng</div>
                    <div className="text-emerald-400 font-extrabold mt-1">0.1 điểm</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="font-bold text-slate-300">2 ý đúng</div>
                    <div className="text-emerald-400 font-extrabold mt-1">0.25 điểm</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="font-bold text-slate-300">3 ý đúng</div>
                    <div className="text-emerald-400 font-extrabold mt-1">0.5 điểm</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="font-bold text-slate-300">4 ý đúng</div>
                    <div className="text-emerald-400 font-extrabold mt-1">1.0 điểm</div>
                  </div>
                </div>

                <div className="pt-2 text-slate-300 flex items-start gap-2">
                  <Cpu className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Phân nhánh chuyên sâu:</strong> Thí sinh lựa chọn nhánh <strong>Khoa học máy tính (CS)</strong> (Lập trình, Cấu trúc dữ liệu, Thuật toán) hoặc <strong>Tin học ứng dụng (ICT)</strong> (Phần mềm ứng dụng, CSDL, Đồ họa, Mạng).
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. SECTION: CÔNG NGHỆ PHÒNG THI AN TOÀN (ANTI-CHEAT SECURITY)
      ========================================================================= */}
      <section id="security" className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-[1600px] mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-400 border border-red-500/20">
              <Shield className="h-3.5 w-3.5" />
              Công nghệ An toàn & Trung thực
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              HỆ THỐNG PHÒNG THI AN TOÀN CHỐNG GIAN LẬN CAO CẤP
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Môi trường làm bài nghiêm túc, khách quan và minh bạch được thiết kế đặc thù cho các kỳ thi HSG và khảo sát chất lượng tại THPT Quất Lâm - Ninh Bình.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-7 space-y-4 hover:border-blue-500/50 transition-all">
              <div className="h-12 w-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Maximize className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-white">
                Khóa Toàn Màn Hình Cưỡng Chế (Fullscreen Lock)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Thí sinh phải kích hoạt chế độ Toàn màn hình để mở đề thi. <strong>Đặc biệt: Hệ thống tự động thoát chế độ toàn màn hình ngay khi hoàn thành và nộp bài xong</strong>, giúp thí sinh trở về giao diện bình thường một cách an toàn và thuận tiện.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-7 space-y-4 hover:border-red-500/50 transition-all">
              <div className="h-12 w-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                <MonitorCheck className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-white">
                Giám Sát Chuyển Tab & Thu Nhỏ
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tự động phát hiện ngay lập tức khi thí sinh rời khỏi cửa sổ làm bài hoặc mở tab mới. Hệ thống phát âm thanh cảnh báo và tự động nộp/khóa bài nếu số lần vi phạm vượt ngưỡng quy định.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-7 space-y-4 hover:border-amber-500/50 transition-all">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-white">
                Vô Hiệu Hóa Phím Tắt & DevTools
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Chặn hoàn toàn chuột phải (Context Menu), phím F11, F12, Ctrl+Shift+I, phím tắt sao chép Ctrl+C, dán Ctrl+V... bảo vệ tuyệt đối tính nguyên bản của đề thi.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-7 space-y-4 hover:border-teal-500/50 transition-all">
              <div className="h-12 w-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <Eye className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-white">
                Watermark Chìm Thông Tin Thí Sinh
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tên, lớp học và Số báo danh của thí sinh được in mờ dưới dạng watermark chìm phủ khắp màn hình thi, ngăn chặn triệt để hành vi chụp trộm đề thi gửi ra ngoài.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-7 space-y-4 hover:border-indigo-500/50 transition-all">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-white">
                Lưu Bài & Đồng Bộ Real-time
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Từng thao tác chọn đáp án được tự động sao lưu tức thì cả vào bộ nhớ đệm máy và đồng bộ lên máy chủ Cloud. Nếu gặp sự cố mất điện hay trình duyệt tắt đột ngột, thí sinh đăng nhập lại để tiếp tục làm bài bình thường.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-7 space-y-4 hover:border-emerald-500/50 transition-all">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-white">
                Trợ Lý Khảo Thí AI Thông Minh
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Hỗ trợ giáo viên tạo đề thi ma trận chuẩn theo định dạng Word .docx, tích hợp AI Gemini giải thích chi tiết câu hỏi và phân tích phổ điểm học sinh tự động.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. SECTION: QUY TRÌNH 4 BƯỚC THAM GIA THI
      ========================================================================= */}
      <section id="steps" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-950/50 border-t border-slate-800/80">
        <div className="max-w-[1600px] mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/10 px-3 py-1 text-xs font-bold text-teal-400 border border-teal-500/20">
              <Clock className="h-3.5 w-3.5" />
              Hướng Dẫn Thí Sinh
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              QUY TRÌNH 4 BƯỚC THAM GIA THI TRỰC TUYẾN
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Các bước đơn giản, thuận tiện và an toàn tuyệt đối từ lúc bắt đầu cho đến khi nhận kết quả phân tích điểm số.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 relative">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-blue-500/30">01</span>
                <div className="h-8 w-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 font-bold text-xs">
                  B1
                </div>
              </div>
              <h4 className="text-sm font-bold text-white">Đăng Nhập & Chọn Đề</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Đăng nhập bằng tài khoản hoặc Số báo danh, hoặc nhập mã ca thi được giáo viên cấp để vào phòng thi.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 relative">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-indigo-500/30">02</span>
                <div className="h-8 w-8 rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
                  B2
                </div>
              </div>
              <h4 className="text-sm font-bold text-white">Bật Toàn Màn Hình</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Đọc kỹ quy chế phòng thi, bấm xác nhận để kích hoạt chế độ Toàn màn hình (Fullscreen) và khởi động tính giờ.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 relative">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-teal-500/30">03</span>
                <div className="h-8 w-8 rounded-full bg-teal-600/20 flex items-center justify-center text-teal-400 font-bold text-xs">
                  B3
                </div>
              </div>
              <h4 className="text-sm font-bold text-white">Làm Bài Thi 2 Phần</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Hoàn thành 24 câu hỏi Phần I và chọn phương án Đúng/Sai cho các câu hỏi chuyên đề CS/ICT ở Phần II.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 relative">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-emerald-500/30">04</span>
                <div className="h-8 w-8 rounded-full bg-emerald-600/20 flex items-center justify-center text-emerald-400 font-bold text-xs">
                  B4
                </div>
              </div>
              <h4 className="text-sm font-bold text-white">Nộp Bài & Xem Điểm</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Bấm nộp bài: <strong>Hệ thống tự động thoát toàn màn hình</strong> và mở ngay trang kết quả, biểu đồ Radar phân tích chi tiết.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. SECTION: TUYÊN BỐ MIỄN TRỪ TRÁCH NHIỆM (DISCLAIMER)
      ========================================================================= */}
      <section id="disclaimer" className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-5xl mx-auto rounded-3xl border border-amber-500/30 bg-gradient-to-b from-amber-500/5 to-slate-950/80 p-8 sm:p-12 shadow-2xl space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-amber-500/20 pb-6">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Scale className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                  TUYÊN BỐ MIỄN TRỪ TRÁCH NHIỆM (DISCLAIMER)
                </h3>
                <p className="text-xs font-semibold text-amber-400/90 mt-0.5">
                  Quy định & Cam kết Trách nhiệm Sử dụng Hệ thống Khảo thí Tin học - THPT Quất Lâm - Ninh Bình
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowDisclaimerModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-amber-500/40 bg-amber-500/10 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition-colors cursor-pointer shrink-0"
            >
              <span>Xem toàn văn văn bản</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-300 leading-relaxed">
            <div className="space-y-2.5 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
              <h4 className="font-bold text-amber-300 uppercase tracking-wider text-[11px] flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-amber-400" />
                1. Mục Đích Giáo Dục & Phi Thương Mại
              </h4>
              <p>
                Hệ thống website khảo thí và ôn luyện trắc nghiệm trực tuyến được phát triển phục vụ công tác giảng dạy, học tập, rèn luyện kỹ năng và kiểm tra đánh giá năng lực nội bộ cho cán bộ giáo viên và học sinh Trường THPT Quất Lâm - Ninh Bình, hoàn toàn phi thương mại.
              </p>
            </div>

            <div className="space-y-2.5 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
              <h4 className="font-bold text-amber-300 uppercase tracking-wider text-[11px] flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-amber-400" />
                2. Tính Tham Khảo Của Học Liệu & Đề Thi
              </h4>
              <p>
                Tất cả các đề thi thử, câu hỏi minh họa và đáp án được biên soạn, tham khảo và tổng hợp theo cấu trúc định dạng đề thi mới của Bộ Giáo dục & Đào tạo. Nội dung mang tính chất định hướng, rèn luyện tư duy và không thay thế cho các kỳ thi chính thức của Nhà nước.
              </p>
            </div>

            <div className="space-y-2.5 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
              <h4 className="font-bold text-amber-300 uppercase tracking-wider text-[11px] flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-400" />
                3. Trách Nhiệm Bảo Mật & Ý Thức Thí Sinh
              </h4>
              <p>
                Học sinh và giáo viên có trách nhiệm bảo mật thông tin tài khoản cá nhân, tuân thủ nghiêm ngặt quy chế phòng thi và phòng chống gian lận. Hệ thống không chịu trách nhiệm đối với các tổn thất hoặc sự cố phát sinh do người dùng tự ý làm lộ thông tin tài khoản.
              </p>
            </div>

            <div className="space-y-2.5 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
              <h4 className="font-bold text-amber-300 uppercase tracking-wider text-[11px] flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-amber-400" />
                4. Quyền Tác Giả & Tiếp Nhận Phản Hồi
              </h4>
              <p>
                Các câu hỏi, hình ảnh trích dẫn đều tôn trọng bản quyền giáo dục. Mọi đóng góp về nội dung câu hỏi, điều chỉnh đáp án hoặc sự cố kỹ thuật xin vui lòng phản hồi về Ban Quản trị qua Quản trị viên kỹ thuật: <strong>Thầy Công (Zalo: 0988999303)</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. FOOTER
      ========================================================================= */}
      <footer id="contact" className="border-t border-slate-800 bg-slate-950 pt-16 pb-12 px-4 sm:px-6 lg:px-8 mt-auto z-10">
        <div className="max-w-[1600px] mx-auto space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* School Info */}
            <div className="md:col-span-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-md">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-white">
                    TRƯỜNG THPT QUẤT LÂM - NINH BÌNH
                  </h3>
                  <p className="text-xs font-semibold text-blue-400">
                    Hệ thống Khảo thí & Ôn luyện Trắc nghiệm Môn Tin học
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                Nền tảng hỗ trợ đổi mới phương pháp kiểm tra đánh giá, bồi dưỡng học sinh giỏi và ôn luyện kỳ thi Tốt nghiệp THPT theo Chương trình Giáo dục phổ thông 2018.
              </p>
              <div className="text-xs text-slate-300 space-y-1">
                <p>📍 <strong>Địa chỉ:</strong> Trường THPT Quất Lâm - Ninh Bình</p>
                <p>📞 <strong>Hỗ trợ kỹ thuật:</strong> Thầy Công (Zalo: 0988999303)</p>
              </div>
            </div>

            {/* Quick Links */}
            <div className="md:col-span-3 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-white">
                Liên Kết Nhanh
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <button onClick={() => scrollToSection('about')} className="hover:text-blue-400 transition-colors cursor-pointer">
                    Trang chủ & Giới thiệu
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('structure')} className="hover:text-blue-400 transition-colors cursor-pointer">
                    Cấu trúc đề thi Bộ GD&ĐT
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('security')} className="hover:text-blue-400 transition-colors cursor-pointer">
                    Công nghệ Anti-Cheat
                  </button>
                </li>
                <li>
                  <button onClick={() => setShowDisclaimerModal(true)} className="hover:text-amber-400 text-amber-400/80 transition-colors cursor-pointer">
                    Tuyên bố miễn trừ trách nhiệm
                  </button>
                </li>
                <li>
                  <Link to="/login" className="hover:text-blue-400 transition-colors">
                    Đăng nhập hệ thống
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-blue-400 transition-colors">
                    Đăng ký tài khoản mới
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support Info */}
            <div className="md:col-span-3 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-white">
                Ban Quản Trị & Kỹ Thuật
              </h4>
              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="font-bold text-slate-200">Quản trị viên Hệ thống:</div>
                <div className="text-blue-400 font-semibold">Thầy Công</div>
                <div className="text-slate-400">Bộ môn Tin học - THPT Quất Lâm</div>
                <div className="pt-2 border-t border-slate-800 flex items-center gap-2 text-amber-400 font-mono">
                  <span>Zalo: 0988999303</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p>© 2025 - 2026 Trường THPT Quất Lâm - Ninh Bình. Phát triển phục vụ giáo dục nội bộ.</p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowDisclaimerModal(true)}
                className="hover:text-slate-400 underline underline-offset-4 cursor-pointer"
              >
                Miễn trừ trách nhiệm
              </button>
              <span>•</span>
              <a
                href="https://zalo.me/0988999303"
                target="_blank"
                rel="noreferrer"
                className="hover:text-blue-400 underline underline-offset-4"
              >
                Hỗ trợ Zalo: 0988999303
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* =========================================================================
          8. MODAL: TOÀN VĂN TUYÊN BỐ MIỄN TRỪ TRÁCH NHIỆM
      ========================================================================= */}
      {showDisclaimerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl max-h-[85vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Scale className="h-6 w-6 text-amber-400" />
                <h3 className="text-lg font-bold text-white">
                  Toàn Văn Tuyên Bố Miễn Trừ Trách Nhiệm
                </h3>
              </div>
              <button
                onClick={() => setShowDisclaimerModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 font-medium">
                Văn bản này quy định về quyền, nghĩa vụ và trách nhiệm pháp lý khi khai thác, sử dụng Hệ thống Khảo thí & Ôn luyện Trắc nghiệm Môn Tin học tại Trường THPT Quất Lâm - Ninh Bình.
              </div>

              <div>
                <h4 className="font-bold text-white uppercase tracking-wider mb-1.5">
                  1. Mục đích vận hành & Phạm vi áp dụng
                </h4>
                <p>
                  Hệ thống được thiết kế, triển khai phi lợi nhuận nhằm hỗ trợ công tác giảng dạy, ôn tập, luyện giải đề và kiểm tra đánh giá chất lượng học tập môn Tin học của học sinh và giáo viên Trường THPT Quất Lâm - Ninh Bình. Hệ thống không hoạt động vì mục đích thương mại.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white uppercase tracking-wider mb-1.5">
                  2. Về tính chính xác của đề thi & Học liệu tham khảo
                </h4>
                <p>
                  Các đề thi thử, câu hỏi, đáp án mẫu và bài giải tham khảo được tổng hợp và biên soạn bám sát theo cấu trúc, ma trận định dạng mới của Bộ Giáo dục & Đào tạo. Mặc dù ban biên soạn luôn nỗ lực rà soát với độ chính xác cao nhất, nội dung trên hệ thống mang tính chất ôn tập định hướng và không cam kết trùng lặp tuyệt đối với đề thi các kỳ thi chính thức của Quốc gia hay của Sở GD&ĐT.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white uppercase tracking-wider mb-1.5">
                  3. Trách nhiệm của Thí sinh & Giáo viên
                </h4>
                <p>
                  Người dùng có nghĩa vụ bảo mật tên đăng nhập và mật khẩu cá nhân. Mọi hành vi chia sẻ tài khoản cho người ngoài, gian lận trong phòng thi trực tuyến, cố ý can thiệp mã nguồn hoặc phát tán nội dung đề thi đều bị nghiêm cấm và sẽ bị xử lý theo nội quy của nhà trường. Ban Quản trị không chịu trách nhiệm đối với các sự cố bắt nguồn từ việc người dùng tự làm lộ tài khoản.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white uppercase tracking-wider mb-1.5">
                  4. Bản quyền học liệu & Kênh tiếp nhận ý kiến
                </h4>
                <p>
                  Tất cả các trích dẫn tài liệu, hình ảnh minh họa đều phục vụ mục đích giảng dạy giáo dục. Khi có bất kỳ góp ý về học thuật, kiến nghị điều chỉnh đáp án hoặc báo lỗi kỹ thuật, xin vui lòng liên hệ ngay Quản trị viên kỹ thuật: <strong>Thầy Công (Zalo: 0988999303)</strong>.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowDisclaimerModal(false)}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white transition-all cursor-pointer"
              >
                Đã hiểu & Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          9. MODAL: NHẬP MẬT KHẨU CA THI HOẶC ĐỀ THI
      ========================================================================= */}
      {showPasswordModal && passwordModalExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Yêu Cầu Mật Khẩu {passwordModalExam.isSitting ? 'Ca Thi' : 'Đề Thi'}</h3>
                  <p className="text-[11px] text-slate-400">{passwordModalExam.isSitting ? 'Ca thi' : 'Đề thi'} được bảo vệ bằng mã truy cập</p>
                </div>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1 text-xs">
              <div className="font-bold text-slate-200 line-clamp-2">{passwordModalExam.title}</div>
              {passwordModalExam.duration_minutes !== undefined && passwordModalExam.duration_minutes > 0 && (
                <div className="text-slate-400 flex items-center gap-1.5 pt-0.5">
                  <Clock className="h-3.5 w-3.5 text-blue-400" />
                  <span>Thời gian làm bài: {passwordModalExam.duration_minutes} phút</span>
                </div>
              )}
            </div>

            <form onSubmit={handleConfirmPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nhập Mật khẩu / Access Code do Thầy/Cô cấp:
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Ví dụ: TIN12A1, HSG2025..."
                    autoFocus
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                {passwordError && (
                  <p className="text-xs text-red-400 mt-1.5 font-medium flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {passwordError}
                  </p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingPassword}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-blue-600/30 disabled:opacity-50"
                >
                  {isVerifyingPassword ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Đang kiểm tra...</span>
                    </>
                  ) : (
                    <>
                      <span>Vào phòng thi</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TỰ CHỌN ĐỀ THI (CHOOSE EXAM) CHO CA THI MANUAL */}
      {showChooseExamModal && chooseExamData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl p-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white uppercase">{chooseExamData.sitting_name}</h3>
              <p className="text-sm text-slate-400 mt-1">Ca thi này cho phép bạn tự chọn đề thi. Vui lòng chọn 1 đề dưới đây để bắt đầu làm bài.</p>
            </div>

            <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-1">
              {chooseExamData.exam_choices?.map((exam: any) => (
                <button
                  key={exam.id}
                  onClick={() => handleSelectManualExam(exam.id)}
                  className="w-full text-left p-4 rounded-xl border border-slate-700 bg-slate-950 hover:border-purple-500 hover:bg-slate-900 transition-all flex items-center justify-between group"
                >
                  <div>
                    <h4 className="font-bold text-slate-200 group-hover:text-purple-300">{exam.title}</h4>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" /> {exam.duration_minutes} phút
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-purple-400" />
                </button>
              ))}
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => setShowChooseExamModal(false)}
                className="px-6 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
