import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi, examsApi, assessmentApi, classApi, bankApi, sittingsApi, foldersApi } from '../services/api';
import { User, ExamInfo, ExamFolder, ExamSessionDetail, SystemStats, QuestionFeedback, ClassRoom, QuestionCategory, BankQuestion, ExamSitting } from '../types';
import { DocxImportModal } from '../components/exam/DocxImportModal';
import { AssignExamModal } from '../components/exam/AssignExamModal';
import { ShareExamModal } from '../components/exam/ShareExamModal';
import { CreateSittingModal } from '../components/exam/CreateSittingModal';
import { SittingResultsModal } from '../components/exam/SittingResultsModal';
import { AISettingsModal } from '../components/common/AISettingsModal';
import { LiveProctorModal } from '../components/exam/LiveProctorModal';
import { ExamAnalyticsModal } from '../components/exam/ExamAnalyticsModal';
import { BulkUserImportModal } from '../components/admin/BulkUserImportModal';
import { ResetPasswordModal } from '../components/admin/ResetPasswordModal';
import { EditUserModal } from '../components/admin/EditUserModal';
import { CreateClassModal } from '../components/classroom/CreateClassModal';
import { ClassManagementModal } from '../components/classroom/ClassManagementModal';
import { CreateCategoryModal } from '../components/bank/CreateCategoryModal';
import { CreateBankQuestionModal } from '../components/bank/CreateBankQuestionModal';
import { CreateFolderModal } from '../components/exam/CreateFolderModal';
import { MoveExamModal } from '../components/exam/MoveExamModal';
import { TwoFactorModal } from '../components/common/TwoFactorModal';
import { ThemeToggle } from '../components/common/ThemeToggle';
import {
  Home,
  GraduationCap,
  Users,
  FileText,
  Shield,
  ShieldCheck,
  Code2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  AlertCircle,
  X,
  LogOut,
  UserCheck,
  BarChart,
  Eye,
  Flag,
  MessageSquare,
  Upload,
  Plus,
  Edit3,
  Send,
  Trash2,
  RotateCw,
  Bot,
  Sparkles,
  Search,
  KeyRound,
  UserPlus,
  Radio,
  BarChart3,
  Activity,
  Layers,
  Settings2,
  Share2,
  Trophy,
  Award,
  Globe,
  Lock,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderPlus,
  FolderOpen,
  FolderSymlink,
  BookOpen,
} from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();

  const [pendingTeachers, setPendingTeachers] = useState<User[]>([]);
  const [exams, setExams] = useState<ExamInfo[]>([]);
  const [sessions, setSessions] = useState<ExamSessionDetail[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionMsg, setActionMsg] = useState<string>('');

  // Modals state
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [assigningExam, setAssigningExam] = useState<ExamInfo | null>(null);
  const [sharingExam, setSharingExam] = useState<ExamInfo | null>(null);
  const [showAISettingsModal, setShowAISettingsModal] = useState<boolean>(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState<boolean>(false);
  const [liveProctorExamId, setLiveProctorExamId] = useState<number | null>(null);
  const [analyticsExamId, setAnalyticsExamId] = useState<number | null>(null);
  const [showBulkImportModal, setShowBulkImportModal] = useState<boolean>(false);
  const [resetPasswordTargetUser, setResetPasswordTargetUser] = useState<User | null>(null);
  const [editUserTarget, setEditUserTarget] = useState<User | null>(null);

  // Question Feedbacks / Disputes state
  const [feedbacks, setFeedbacks] = useState<QuestionFeedback[]>([]);
  const [reviewingFeedback, setReviewingFeedback] = useState<QuestionFeedback | null>(null);
  const [feedbackFilter, setFeedbackFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED'>('ALL');

  // Classroom management states
  const [classRooms, setClassRooms] = useState<ClassRoom[]>([]);
  const [showCreateClassModal, setShowCreateClassModal] = useState<boolean>(false);
  const [classToEdit, setClassToEdit] = useState<ClassRoom | null>(null);
  const [managingClass, setManagingClass] = useState<ClassRoom | null>(null);
  const [classSearch, setClassSearch] = useState<string>('');
  const [classGradeFilter, setClassGradeFilter] = useState<string>('ALL');

  // Active Tab for Admin / Teacher
  const [activeTab, setActiveTab] = useState<
    'EXAMS' | 'SITTINGS' | 'SESSIONS' | 'FEEDBACKS' | 'CLASSES' | 'BANK' | 'USERS' | 'TEACHERS' | 'STATS'
  >('EXAMS');

  // Exam classification & ownership filter states
  const [examTypeFilter, setExamTypeFilter] = useState<'ALL' | 'HSG' | 'TN_THPT'>('ALL');
  const [ownershipFilter, setOwnershipFilter] = useState<'ALL' | 'MY_EXAMS' | 'SHARED_WITH_ME'>('ALL');
  const [examSearch, setExamSearch] = useState<string>('');

  // User filter state
  const [userSearch, setUserSearch] = useState<string>('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');

  const [bankCategories, setBankCategories] = useState<QuestionCategory[]>([]);
  const [bankQuestions, setBankQuestions] = useState<BankQuestion[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<QuestionCategory | null>(null);
  const [showBankQuestionModal, setShowBankQuestionModal] = useState(false);
  const [bankQuestionToEdit, setBankQuestionToEdit] = useState<BankQuestion | null>(null);
  
  // SITTINGS
  const [sittings, setSittings] = useState<ExamSitting[]>([]);
  const [isCreateSittingModalOpen, setIsCreateSittingModalOpen] = useState(false);
  const [sittingToEdit, setSittingToEdit] = useState<ExamSitting | null>(null);
  const [selectedSittingForResults, setSelectedSittingForResults] = useState<ExamSitting | null>(null);

  // EXAM FOLDERS STATE
  const [folders, setFolders] = useState<ExamFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | 'ALL' | 'UNCATEGORIZED'>('ALL');
  const [expandedFolders, setExpandedFolders] = useState<Record<number, boolean>>({});
  const [showCreateFolderModal, setShowCreateFolderModal] = useState<boolean>(false);
  const [folderToEdit, setFolderToEdit] = useState<ExamFolder | null>(null);
  const [parentFolderIdForCreate, setParentFolderIdForCreate] = useState<number | null>(null);
  const [movingExam, setMovingExam] = useState<ExamInfo | null>(null);
  const [folderScopeTab, setFolderScopeTab] = useState<'ALL' | 'SHARED' | 'MY_FOLDERS'>('ALL');
  const [folderSearch, setFolderSearch] = useState<string>('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      const [examsData, sessionsData, feedbacksData, classesData, categoriesData, questionsData, sittingsData, foldersData] = await Promise.all([
        examsApi.getExams(),
        assessmentApi.getSessions(),
        examsApi.getQuestionFeedbacks(),
        classApi.getClasses(),
        bankApi.getCategories(),
        bankApi.getQuestions(),
        sittingsApi.list(),
        foldersApi.getFolders(),
      ]);
      setExams(examsData);
      setSessions(sessionsData);
      setFeedbacks(feedbacksData);
      setClassRooms(classesData);
      setBankCategories(categoriesData);
      setBankQuestions(questionsData);
      setSittings(sittingsData);
      setFolders(foldersData);

      if (isAdmin) {
        const [teachersData, usersData, statsData] = await Promise.all([
          authApi.getPendingTeachers(),
          authApi.getUsers(),
          authApi.getSystemStats(),
        ]);
        setPendingTeachers(teachersData);
        setUsersList(usersData);
        setSystemStats(statsData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAdmin]);

  const handleToggleUserStatus = async (targetUser: User, newStatus: 'ACTIVE' | 'REJECTED' | 'PENDING') => {
    try {
      await authApi.toggleUserStatus(targetUser.id, newStatus);
      setActionMsg(`Đã cập nhật trạng thái tài khoản ${targetUser.username} thành công.`);
      fetchData();
      setTimeout(() => setActionMsg(''), 3000);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Thao tác thất bại.');
    }
  };

  const handleApproveTeacher = async (teacherId: number, status: 'ACTIVE' | 'REJECTED') => {
    try {
      await authApi.approveTeacher(teacherId, status);
      setActionMsg(`Đã cập nhật trạng thái giáo viên thành ${status === 'ACTIVE' ? 'Hoạt động' : 'Từ chối'}.`);
      fetchData();
      setTimeout(() => setActionMsg(''), 3000);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Thao tác thất bại.');
    }
  };

  const handleDeleteExam = async (examId: number, examTitle: string) => {
    if (!window.confirm(`Thầy có chắc chắn muốn xóa đề thi "${examTitle}" không?\nToàn bộ câu hỏi trong đề này sẽ bị xóa khỏi hệ thống.`)) {
      return;
    }
    try {
      await examsApi.deleteExam(examId);
      setActionMsg(`Đã xóa đề thi "${examTitle}" thành công.`);
      fetchData();
      setTimeout(() => setActionMsg(''), 3000);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Xóa đề thi thất bại.');
    }
  };

  const handleCreateFolder = (parentId?: number | null) => {
    setFolderToEdit(null);
    setParentFolderIdForCreate(parentId !== undefined ? parentId : null);
    setShowCreateFolderModal(true);
  };

  const handleEditFolder = (folder: ExamFolder, e: React.MouseEvent) => {
    e.stopPropagation();
    setFolderToEdit(folder);
    setShowCreateFolderModal(true);
  };

  const handleDeleteFolder = async (folder: ExamFolder, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Thầy/Cô có chắc chắn muốn xóa thư mục "${folder.name}" không?\n\n(Tất cả bài kiểm tra bên trong sẽ được chuyển an toàn ra thư mục cha hoặc mục Chưa phân loại, không bị mất đề thi).`)) {
      return;
    }
    try {
      await foldersApi.deleteFolder(folder.id);
      setActionMsg(`Đã xóa thư mục "${folder.name}" thành công.`);
      if (selectedFolderId === folder.id) {
        setSelectedFolderId('ALL');
      }
      fetchData();
      setTimeout(() => setActionMsg(''), 3000);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Xóa thư mục thất bại.');
    }
  };

  const toggleExpandFolder = (folderId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const handleDeleteClass = async (classId: number, className: string) => {
    if (!window.confirm(`Thầy/Cô có chắc chắn muốn xóa lớp học "${className}" không?\nThao tác này sẽ giải tán lớp học khỏi hệ thống.`)) {
      return;
    }
    try {
      await classApi.deleteClass(classId);
      setActionMsg(`Đã xóa lớp học "${className}" thành công.`);
      fetchData();
      setTimeout(() => setActionMsg(''), 4000);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Xóa lớp học thất bại.');
    }
  };

  const handleDeleteSitting = async (sittingId: number, sittingName: string) => {
    if (!window.confirm(`Thầy/Cô có chắc chắn muốn xóa Ca thi "${sittingName}" không?\n\nLưu ý: Các đề thi liên kết vẫn được giữ nguyên an toàn trong Ngân hàng đề, chỉ xóa thiết lập phòng thi và phân bổ của ca này.`)) {
      return;
    }
    try {
      await sittingsApi.delete(sittingId);
      setActionMsg(`Đã xóa ca thi "${sittingName}" thành công.`);
      fetchData();
      setTimeout(() => setActionMsg(''), 3000);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Xóa ca thi thất bại.');
    }
  };

  const handleRegradeExam = async (examId: number, examTitle: string) => {
    if (!window.confirm(`Thầy có muốn chấm lại toàn bộ các bài thi của học sinh cho đề "${examTitle}" không?\n\nHệ thống sẽ đối chiếu lại câu trả lời của từng học sinh với đáp án mới nhất và tự động cập nhật lại toàn bộ điểm số, xếp hạng và báo cáo năng lực.`)) {
      return;
    }
    try {
      const res = await assessmentApi.regradeExam(examId);
      setActionMsg(res.message || 'Đã chấm lại toàn bộ bài làm của học sinh thành công.');
      fetchData();
      setTimeout(() => setActionMsg(''), 6000);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Chấm lại bài thi thất bại.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-16">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-3 group hover:opacity-90 transition-opacity"
              title="Về Trang Chủ"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-md group-hover:scale-105 transition-transform">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col justify-center">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-white group-hover:text-blue-400 transition-colors uppercase leading-tight whitespace-nowrap">
                  Web App Ôn thi trắc nghiệm
                </span>
                <span className="font-extrabold text-xs sm:text-sm tracking-tight text-blue-400 transition-colors uppercase leading-tight whitespace-nowrap">
                  Môn Tin học THPT
                </span>
                <p className="text-[9px] sm:text-[10px] font-semibold text-emerald-400 uppercase mt-0.5 whitespace-nowrap">
                  {isAdmin ? 'SUPER ADMIN (THẦY CÔNG)' : 'BẢNG ĐIỀU KHIỂN GIÁO VIÊN BỘ MÔN'}
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

              <button
                onClick={() => setShowAISettingsModal(true)}
                className="p-2 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                title="Cài đặt API Key và AI"
              >
                <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>

              <Link
                to="/change-password"
                className="p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                title="Cài đặt tài khoản"
              >
                <UserCheck className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>

              <button
                onClick={() => setShowTwoFactorModal(true)}
                className="p-2 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors relative"
                title="Bảo mật 2FA"
              >
                {user?.is_two_factor_enabled ? (
                  <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
                ) : (
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
                {user?.is_two_factor_enabled && (
                  <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 border border-slate-900"></span>
                )}
              </button>
            </div>

            {/* User Profile & Logout */}
            <div className="flex items-center gap-2 border-l border-slate-700/50 pl-2 sm:pl-4 ml-1">
              <div className="hidden lg:block text-right">
                <div className="text-[13px] font-bold text-slate-200">{user?.full_name || user?.username}</div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">{user?.role}</div>
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {actionMsg && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-300 shadow-md">
            {actionMsg}
          </div>
        )}

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('EXAMS')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === 'EXAMS'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Ngân Hàng Đề Thi ({exams.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('SITTINGS')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === 'SITTINGS'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Ca Thi ({sittings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('SESSIONS')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === 'SESSIONS'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>Lịch Sử Bài Thi ({sessions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('CLASSES')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === 'CLASSES'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            <span>Quản Lý Lớp Học ({classRooms.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('BANK')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === 'BANK'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Thư Viện Câu Hỏi ({bankQuestions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('FEEDBACKS')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all relative ${
              activeTab === 'FEEDBACKS'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Flag className="h-4 w-4" />
            <span>Phản Ánh Câu Hỏi ({feedbacks.length})</span>
            {feedbacks.filter((f) => f.status === 'PENDING').length > 0 && (
              <span className="ml-1 rounded-full bg-amber-400 text-slate-950 px-1.5 py-0.2 text-[10px] font-black animate-pulse">
                {feedbacks.filter((f) => f.status === 'PENDING').length}
              </span>
            )}
          </button>

          {isAdmin && (
            <>
              <button
                onClick={() => setActiveTab('USERS')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                  activeTab === 'USERS'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Quản Lý Người Dùng ({usersList.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('TEACHERS')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                  activeTab === 'TEACHERS'
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <UserCheck className="h-4 w-4" />
                <span>Duyệt Giáo Viên</span>
                {pendingTeachers.length > 0 && (
                  <span className="rounded-full bg-amber-400 text-slate-950 px-1.5 py-0.2 text-[10px] font-black">
                    {pendingTeachers.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('STATS')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                  activeTab === 'STATS'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span>Thống Kê Toàn Trường</span>
              </button>
            </>
          )}
        </div>

        {/* TAB 1: EXAMS MANAGEMENT */}
        {activeTab === 'EXAMS' && (() => {
          // Folder helpers
          const getDescendantFolderIds = (folderId: number): number[] => {
            const ids = [folderId];
            const queue = [folderId];
            while (queue.length > 0) {
              const current = queue.shift()!;
              const children = folders.filter((f) => f.parent === current);
              for (const child of children) {
                ids.push(child.id);
                queue.push(child.id);
              }
            }
            return ids;
          };

          const getFolderExamCount = (folderId: number): number => {
            const descendantIds = getDescendantFolderIds(folderId);
            return exams.filter((e) => e.folder && descendantIds.includes(e.folder)).length;
          };

          const uncategorizedCount = exams.filter((e) => !e.folder).length;
          const sharedFoldersList = folders.filter((f) => f.is_shared);
          const myFoldersList = folders.filter((f) => !f.is_shared);

          let filteredFolderList = folders;
          if (folderScopeTab === 'SHARED') {
            filteredFolderList = sharedFoldersList;
          } else if (folderScopeTab === 'MY_FOLDERS') {
            filteredFolderList = myFoldersList;
          }

          if (folderSearch.trim()) {
            const q = folderSearch.toLowerCase();
            filteredFolderList = filteredFolderList.filter(
              (f) => f.name.toLowerCase().includes(q) || (f.full_path && f.full_path.toLowerCase().includes(q))
            );
          }

          const rootFolders = filteredFolderList.filter((f) => !f.parent);

          const getFolderColorClass = (color?: string) => {
            switch (color) {
              case 'emerald': return 'text-emerald-400';
              case 'purple': return 'text-purple-400';
              case 'amber': return 'text-amber-400';
              case 'cyan': return 'text-cyan-400';
              case 'rose': return 'text-rose-400';
              default: return 'text-blue-400';
            }
          };

          const renderFolderIcon = (iconName?: string, colorClass = 'text-blue-400') => {
            switch (iconName) {
              case 'book': return <BookOpen className={`h-4 w-4 shrink-0 ${colorClass}`} />;
              case 'trophy': return <Trophy className={`h-4 w-4 shrink-0 ${colorClass}`} />;
              case 'graduation-cap': return <GraduationCap className={`h-4 w-4 shrink-0 ${colorClass}`} />;
              case 'code': return <Code2 className={`h-4 w-4 shrink-0 ${colorClass}`} />;
              default: return <Folder className={`h-4 w-4 shrink-0 ${colorClass}`} />;
            }
          };

          // Render tree item recursively
          const renderFolderTreeItem = (f: ExamFolder, depth = 0) => {
            const children = filteredFolderList.filter((c) => c.parent === f.id);
            const hasChildren = children.length > 0;
            const isExpanded = expandedFolders[f.id] ?? true;
            const isSelected = selectedFolderId === f.id;
            const examCount = getFolderExamCount(f.id);
            const colorClass = getFolderColorClass(f.color);
            const canManage = f.is_owner || isAdmin;

            return (
              <div key={f.id} className="space-y-0.5">
                <div
                  onClick={() => setSelectedFolderId(f.id)}
                  className={`group flex items-center justify-between px-2 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                  style={{ paddingLeft: `${Math.max(8, depth * 14 + 8)}px` }}
                >
                  <div className="flex items-center gap-1.5 truncate mr-1">
                    {hasChildren ? (
                      <button
                        type="button"
                        onClick={(e) => toggleExpandFolder(f.id, e)}
                        className="p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                      >
                        {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      </button>
                    ) : (
                      <span className="w-3.5" />
                    )}

                    {renderFolderIcon(f.icon, isSelected ? 'text-white' : colorClass)}

                    <span className="truncate" title={f.name}>
                      {f.name}
                    </span>
                    {f.is_shared ? (
                      <span title="Toàn trường" className="inline-flex items-center">
                        <Globe className="h-2.5 w-2.5 text-blue-400 shrink-0 opacity-70" />
                      </span>
                    ) : (
                      <span title="Cá nhân" className="inline-flex items-center">
                        <Lock className="h-2.5 w-2.5 text-indigo-400 shrink-0 opacity-70" />
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {examCount}
                    </span>

                    {/* Quick action buttons on hover */}
                    <div className="flex lg:hidden lg:group-hover:flex items-center gap-0.5 ml-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateFolder(f.id);
                        }}
                        className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                        title="Thêm thư mục con"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      {canManage && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => handleEditFolder(f, e)}
                            className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                            title="Chỉnh sửa thư mục"
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteFolder(f, e)}
                            className="p-1 rounded-md hover:bg-red-500/30 text-red-300 hover:text-red-200"
                            title="Xóa thư mục"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Subfolders */}
                {hasChildren && isExpanded && (
                  <div className="border-l border-slate-800 ml-3 pl-1 space-y-0.5">
                    {children.map((child) => renderFolderTreeItem(child, depth + 1))}
                  </div>
                )}
              </div>
            );
          };

          // Calculate filtered list
          const totalExams = exams.length;
          const hsgExams = exams.filter((e) => (e.exam_type || (e.matrix_preset === 'BGD_2025' ? 'TN_THPT' : 'HSG')) === 'HSG');
          const tnExams = exams.filter((e) => (e.exam_type || (e.matrix_preset === 'BGD_2025' ? 'TN_THPT' : 'HSG')) === 'TN_THPT');
          const myExams = exams.filter((e) => e.is_owner);
          const sharedWithMeExams = exams.filter((e) => e.is_shared);

          const displayedExams = exams.filter((exam) => {
            // Folder filtering
            if (selectedFolderId === 'UNCATEGORIZED') {
              if (exam.folder) return false;
            } else if (typeof selectedFolderId === 'number') {
              const descendantIds = getDescendantFolderIds(selectedFolderId);
              if (!exam.folder || !descendantIds.includes(exam.folder)) return false;
            }

            const currentType = exam.exam_type || (exam.matrix_preset === 'BGD_2025' ? 'TN_THPT' : 'HSG');
            if (examTypeFilter !== 'ALL' && currentType !== examTypeFilter) return false;
            if (ownershipFilter === 'MY_EXAMS' && !exam.is_owner) return false;
            if (ownershipFilter === 'SHARED_WITH_ME' && !exam.is_shared) return false;
            if (examSearch.trim()) {
              const query = examSearch.toLowerCase();
              const matchTitle = exam.title?.toLowerCase().includes(query);
              const matchClasses = exam.assigned_classes?.toLowerCase().includes(query);
              const matchCreator = exam.creator_name?.toLowerCase().includes(query);
              const matchFolder = exam.folder_name?.toLowerCase().includes(query) || exam.folder_path?.toLowerCase().includes(query);
              if (!matchTitle && !matchClasses && !matchCreator && !matchFolder) return false;
            }
            return true;
          });

          return (
            <section className="space-y-5">
              {/* Header with Title & Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      NGÂN HÀNG ĐỀ THI & PHÒNG THI TRỰC TUYẾN
                    </h3>
                    <p className="text-xs text-slate-400">
                      Tổng cộng <strong className="text-white">{totalExams}</strong> đề thi ({myExams.length} của Thầy/Cô, {sharedWithMeExams.length} được chia sẻ)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    onClick={() => setShowAISettingsModal(true)}
                    className="flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-950/40 px-3.5 py-2.5 text-xs font-bold text-indigo-300 hover:bg-indigo-900/50 hover:text-white transition-all shadow-sm"
                    title="Cài đặt API Key AI (Gemini, ChatGPT, DeepSeek, Claude, Grok)"
                  >
                    <Sparkles className="h-4 w-4 text-yellow-400" />
                    <span>Cài Đặt AI</span>
                  </button>

                  <button
                    onClick={() => navigate(`/teacher/create-exam${typeof selectedFolderId === 'number' ? `?folder=${selectedFolderId}` : ''}`)}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Tạo Đề Thi Mới</span>
                  </button>

                  <button
                    onClick={() => setShowImportModal(true)}
                    className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-all cursor-pointer"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Nhập File Word / PDF</span>
                  </button>
                </div>
              </div>

              {/* 2-Column Main Layout: Left Folder Tree, Right Exams Grid */}
              <div className="flex flex-col lg:flex-row gap-5 items-start">
                {/* LEFT: CÂY THƯ MỤC SIDEBAR */}
                <div className="w-full lg:w-72 shrink-0 space-y-3">
                  <button
                    onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                    className="lg:hidden flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm font-bold text-slate-300 shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-blue-400" />
                      <span>Thư Mục Đề Thi</span>
                    </div>
                    <span>{isMobileSidebarOpen ? 'Thu gọn' : 'Mở rộng'}</span>
                  </button>
                  <div className={`rounded-2xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-3 shadow-md sticky top-20 ${isMobileSidebarOpen ? 'block' : 'hidden lg:block'}`}>
                    {/* Header with Title & Add Folder button */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-blue-400" />
                        <span className="font-bold text-xs uppercase tracking-wider text-slate-200">Thư Mục Đề Thi</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCreateFolder(null)}
                        className="flex items-center gap-1 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/30 px-2 py-1 text-[11px] font-bold transition-all"
                        title="Tạo thư mục mới"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Tạo mục</span>
                      </button>
                    </div>

                    {/* Scope Tabs (Choice C): Tất cả | Dùng chung | Cá nhân */}
                    <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setFolderScopeTab('ALL')}
                        className={`py-1 rounded-lg font-bold transition-all ${
                          folderScopeTab === 'ALL'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Tất cả
                      </button>
                      <button
                        type="button"
                        onClick={() => setFolderScopeTab('SHARED')}
                        className={`py-1 rounded-lg font-bold transition-all flex items-center justify-center gap-1 ${
                          folderScopeTab === 'SHARED'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-blue-400 hover:text-blue-300'
                        }`}
                        title="Thư mục dùng chung toàn trường / tổ bộ môn"
                      >
                        <Globe className="h-3 w-3" />
                        <span>Chung</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFolderScopeTab('MY_FOLDERS')}
                        className={`py-1 rounded-lg font-bold transition-all flex items-center justify-center gap-1 ${
                          folderScopeTab === 'MY_FOLDERS'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-indigo-400 hover:text-indigo-300'
                        }`}
                        title="Thư mục riêng tư của tôi"
                      >
                        <Lock className="h-3 w-3" />
                        <span>Của tôi</span>
                      </button>
                    </div>

                    {/* Search folder input */}
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                      <input
                        type="text"
                        value={folderSearch}
                        onChange={(e) => setFolderSearch(e.target.value)}
                        placeholder="Lọc thư mục..."
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-7 pr-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    {/* Tree Items List */}
                    <div className="space-y-1 max-h-[480px] overflow-y-auto pr-1">
                      {/* Tất cả bài kiểm tra */}
                      <button
                        type="button"
                        onClick={() => setSelectedFolderId('ALL')}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                          selectedFolderId === 'ALL'
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                            : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Layers className="h-4 w-4 shrink-0 text-blue-300" />
                          <span className="truncate">Tất cả đề thi</span>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            selectedFolderId === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {totalExams}
                        </span>
                      </button>

                      {/* Render Folder Nodes */}
                      {rootFolders.length === 0 ? (
                        <div className="py-4 text-center text-xs text-slate-500 italic">
                          Chưa có thư mục nào. Bấm "+ Tạo mục" để thêm.
                        </div>
                      ) : (
                        rootFolders.map((rootF) => renderFolderTreeItem(rootF, 0))
                      )}

                      {/* Chưa phân loại */}
                      <button
                        type="button"
                        onClick={() => setSelectedFolderId('UNCATEGORIZED')}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                          selectedFolderId === 'UNCATEGORIZED'
                            ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                            : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Folder className="h-4 w-4 shrink-0 text-amber-400" />
                          <span className="truncate">Chưa phân loại</span>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            selectedFolderId === 'UNCATEGORIZED' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {uncategorizedCount}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* RIGHT: MAIN EXAMS MANAGEMENT AREA */}
                <div className="flex-1 min-w-0 space-y-4">
                  {/* Active Folder Breadcrumb Bar */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
                    <div className="flex items-center gap-1.5 flex-wrap text-xs">
                      <button
                        type="button"
                        onClick={() => setSelectedFolderId('ALL')}
                        className="text-slate-400 hover:text-blue-400 font-semibold flex items-center gap-1"
                      >
                        <FolderOpen className="h-3.5 w-3.5" />
                        <span>Kho Đề Thi</span>
                      </button>

                      {typeof selectedFolderId === 'number' && (() => {
                        const activeFolder = folders.find((f) => f.id === selectedFolderId);
                        if (!activeFolder) return null;
                        return (
                          <>
                            <ChevronRight className="h-3 w-3 text-slate-600" />
                            <span className="font-bold text-white flex items-center gap-1.5 bg-blue-600/10 border border-blue-500/30 px-2.5 py-1 rounded-lg text-blue-300">
                              {renderFolderIcon(activeFolder.icon, getFolderColorClass(activeFolder.color))}
                              <span>{activeFolder.full_path || activeFolder.name}</span>
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium ml-1">
                              ({displayedExams.length} đề thi)
                            </span>
                          </>
                        );
                      })()}

                      {selectedFolderId === 'UNCATEGORIZED' && (
                        <>
                          <ChevronRight className="h-3 w-3 text-slate-600" />
                          <span className="font-bold text-amber-400 flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                            <Folder className="h-3.5 w-3.5 text-amber-400" />
                            <span>Chưa phân loại ({displayedExams.length} đề)</span>
                          </span>
                        </>
                      )}

                      {selectedFolderId === 'ALL' && (
                        <>
                          <ChevronRight className="h-3 w-3 text-slate-600" />
                          <span className="font-semibold text-slate-300">
                            Tất cả thư mục ({displayedExams.length} đề thi)
                          </span>
                        </>
                      )}
                    </div>

                    {typeof selectedFolderId === 'number' && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCreateFolder(selectedFolderId)}
                          className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all shadow-sm"
                          title="Thêm thư mục con vào thư mục này"
                        >
                          <FolderPlus className="h-3.5 w-3.5 text-blue-400" />
                          <span>+ Thư mục con</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 2-Tier Filter Navigation */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 space-y-3 shadow-md">
                    {/* Tier 1: Exam Type Classification (HSG vs Tốt Nghiệp) */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                        <button
                          type="button"
                          onClick={() => setExamTypeFilter('ALL')}
                          className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                            examTypeFilter === 'ALL'
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Layers className="h-3.5 w-3.5" />
                          <span>Tất cả ({totalExams})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setExamTypeFilter('HSG')}
                          className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                            examTypeFilter === 'HSG'
                              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
                              : 'text-purple-400 hover:text-purple-300'
                          }`}
                        >
                          <Trophy className="h-3.5 w-3.5 text-amber-400" />
                          <span>🏆 Đề HSG ({hsgExams.length})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setExamTypeFilter('TN_THPT')}
                          className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                            examTypeFilter === 'TN_THPT'
                              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
                              : 'text-cyan-400 hover:text-cyan-300'
                          }`}
                        >
                          <GraduationCap className="h-3.5 w-3.5 text-cyan-300" />
                          <span>🎓 Tốt Nghiệp ({tnExams.length})</span>
                        </button>
                      </div>

                      {/* Search Input */}
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={examSearch}
                          onChange={(e) => setExamSearch(e.target.value)}
                          placeholder="Tìm tên đề, thư mục..."
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Tier 2: Ownership & Sharing Filter */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-400 text-[11px] uppercase tracking-wider">
                          Phân quyền:
                        </span>
                        <button
                          type="button"
                          onClick={() => setOwnershipFilter('ALL')}
                          className={`px-3 py-1 rounded-lg font-bold transition-all ${
                            ownershipFilter === 'ALL'
                              ? 'bg-slate-800 text-white border border-slate-700'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Tất cả nguồn ({exams.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setOwnershipFilter('MY_EXAMS')}
                          className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                            ownershipFilter === 'MY_EXAMS'
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'text-blue-400 hover:bg-blue-950/40'
                          }`}
                        >
                          <span>👑 Đề của tôi ({myExams.length})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setOwnershipFilter('SHARED_WITH_ME')}
                          className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                            ownershipFilter === 'SHARED_WITH_ME'
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'text-indigo-400 hover:bg-indigo-950/40'
                          }`}
                        >
                          <Share2 className="h-3 w-3" />
                          <span>Được chia sẻ ({sharedWithMeExams.length})</span>
                        </button>
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Lock className="h-3 w-3 text-slate-500" />
                        <span>Đề riêng tư bảo mật theo từng Giáo viên</span>
                      </div>
                    </div>
                  </div>

                  {/* Exams Cards Grid */}
                  {displayedExams.length === 0 ? (
                    <div className="py-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 p-8 space-y-3">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-slate-500">
                        <FileText className="h-6 w-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-300">Không tìm thấy đề thi phù hợp trong thư mục này</h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Thầy/Cô có thể tạo đề mới vào thư mục này, nạp file Word (.docx) hoặc chọn "Tất cả đề thi" ở cây thư mục bên trái.
                      </p>
                      <button
                        onClick={() => {
                          setSelectedFolderId('ALL');
                          setExamTypeFilter('ALL');
                          setOwnershipFilter('ALL');
                          setExamSearch('');
                        }}
                        className="text-xs text-blue-400 hover:underline font-semibold"
                      >
                        Hiển thị tất cả đề thi
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                      {displayedExams.map((exam) => {
                        const isHSG = (exam.exam_type || (exam.matrix_preset === 'BGD_2025' ? 'TN_THPT' : 'HSG')) === 'HSG';
                        const canEditOrDelete = exam.is_owner || isAdmin;

                        return (
                          <div
                            key={exam.id}
                            className={`rounded-2xl border bg-slate-950/70 p-5 shadow-lg space-y-4 transition-all hover:border-slate-700 flex flex-col justify-between ${
                              exam.is_assigned
                                ? 'border-emerald-500/40 ring-1 ring-emerald-500/20'
                                : 'border-slate-800'
                            }`}
                          >
                            <div className="space-y-3">
                              {/* Top Status Badges */}
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                {/* Exam Type Badge */}
                                <span
                                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold border flex items-center gap-1.5 shadow-sm ${
                                    isHSG
                                      ? 'bg-purple-950/80 text-purple-300 border-purple-600/50'
                                      : 'bg-cyan-950/80 text-cyan-300 border-cyan-600/50'
                                  }`}
                                >
                                  {isHSG ? (
                                    <>
                                      <Trophy className="h-3 w-3 text-amber-400" />
                                      <span>🏆 Đề HSG THPT</span>
                                    </>
                                  ) : (
                                    <>
                                      <GraduationCap className="h-3 w-3 text-cyan-300" />
                                      <span>🎓 Ôn Tốt Nghiệp</span>
                                    </>
                                  )}
                                </span>

                                {/* Assigned Status */}
                                <span
                                  className={`rounded-lg px-2 py-0.5 text-[10px] font-bold border flex items-center gap-1 ${
                                    exam.is_assigned
                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  }`}
                                >
                                  <span className={`h-1.5 w-1.5 rounded-full ${exam.is_assigned ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                                  {exam.is_assigned ? 'Đã giao đề' : 'Bản nháp'}
                                </span>
                              </div>

                              {/* Title */}
                              <h4 className="font-bold text-slate-100 text-sm line-clamp-2 leading-snug" title={exam.title}>
                                {exam.title}
                              </h4>

                              {/* Folder Badge & Ownership */}
                              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                                {/* Folder location badge */}
                                {exam.folder_name ? (
                                  <button
                                    type="button"
                                    onClick={() => exam.folder && setSelectedFolderId(exam.folder)}
                                    className="inline-flex items-center gap-1 rounded-md bg-slate-900 border border-slate-700 px-2 py-0.5 text-[10px] font-medium text-slate-300 hover:border-blue-500 hover:text-blue-300 transition-colors"
                                    title={exam.folder_path || exam.folder_name}
                                  >
                                    <Folder className="h-3 w-3 text-blue-400 shrink-0" />
                                    <span className="truncate max-w-[150px]">{exam.folder_name}</span>
                                  </button>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-900/50 border border-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                                    <Folder className="h-3 w-3 text-slate-600 shrink-0" />
                                    <span>Chưa phân loại</span>
                                  </span>
                                )}

                                {exam.is_owner ? (
                                  <span className="rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 font-bold text-[10px] flex items-center gap-1">
                                    👑 Của tôi
                                  </span>
                                ) : (
                                  <span className="rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 font-bold text-[10px] flex items-center gap-1">
                                    👥 {exam.creator_name || 'Giáo viên khác'}
                                  </span>
                                )}

                                {exam.is_owner && exam.is_shared_with_all_teachers && (
                                  <span className="rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 font-semibold text-[10px] flex items-center gap-1">
                                    <Globe className="h-3 w-3" /> Toàn trường
                                  </span>
                                )}
                              </div>

                              {/* Info details */}
                              <div className="space-y-1 text-xs text-slate-400 pt-1">
                                <div className="flex items-center justify-between">
                                  <span>Thời gian làm bài:</span>
                                  <span className="font-semibold text-slate-200">⏱️ {exam.duration_minutes} phút</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span>Phân quyền lớp:</span>
                                  <span className="font-semibold text-slate-200">{exam.assigned_classes || 'Toàn trường'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span>Ngân hàng câu hỏi:</span>
                                  <span className="font-bold text-blue-400">
                                    {exam.questions_count?.total || 0} câu ({exam.questions_count?.part1 || 0} P1 / {(exam.questions_count?.part2_cs || 0) + (exam.questions_count?.part2_ict || 0)} P2)
                                  </span>
                                </div>
                                {exam.access_code && (
                                  <div className="flex items-center justify-between text-amber-400">
                                    <span>Mã bảo vệ:</span>
                                    <span className="font-mono font-bold">🔒 {exam.access_code}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                              {/* Action Buttons Redesign */}
                              <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
                                {/* Primary Actions: Edit & Assign */}
                                <div className="grid grid-cols-2 gap-2">
                                  {canEditOrDelete ? (
                                    <button
                                      type="button"
                                      onClick={() => navigate(`/teacher/create-exam?edit=${exam.id}`)}
                                      className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all shadow-sm"
                                      title="Chỉnh sửa nội dung, câu hỏi và đáp án đề thi"
                                    >
                                      <Edit3 className="h-3.5 w-3.5" />
                                      <span>Sửa đề thi</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => navigate(`/teacher/create-exam?edit=${exam.id}`)}
                                      className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all shadow-sm"
                                      title="Xem nội dung đề thi được chia sẻ"
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                      <span>Xem đề thi</span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => setAssigningExam(exam)}
                                    className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all shadow-sm ${
                                      exam.is_assigned
                                        ? 'bg-emerald-600/90 text-white hover:bg-emerald-500 shadow-emerald-600/20'
                                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/20'
                                    }`}
                                  >
                                    <Send className="h-3.5 w-3.5" />
                                    <span>{exam.is_assigned ? 'Cài đặt giao đề' : 'Giao đề ngay'}</span>
                                  </button>
                                </div>

                                {/* Secondary Tools Bar (Icons Only) */}
                                <div className="flex items-center justify-between rounded-xl bg-slate-900/50 p-1 border border-slate-800/50">
                                  <div className="flex items-center gap-0.5">
                                    <button
                                      type="button"
                                      onClick={() => window.open(`/exam/${exam.id}?preview=true`, '_blank')}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                                      title="Xem trước giao diện phòng thi của học sinh"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setLiveProctorExamId(exam.id)}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                      title="Giám sát trực tiếp thí sinh đang làm bài (Live)"
                                    >
                                      <Radio className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setAnalyticsExamId(exam.id)}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
                                      title="Xem phổ điểm và phân tích độ khó"
                                    >
                                      <BarChart3 className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setMovingExam(exam)}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-all"
                                      title="Chuyển bài kiểm tra sang thư mục khác"
                                    >
                                      <FolderSymlink className="h-4 w-4" />
                                    </button>
                                    {canEditOrDelete && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => setSharingExam(exam)}
                                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                                          title="Chia sẻ đề thi cho giáo viên khác"
                                        >
                                          <Share2 className="h-4 w-4" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleRegradeExam(exam.id, exam.title)}
                                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                                          title="Chấm lại toàn bộ bài làm của học sinh"
                                        >
                                          <RotateCw className="h-4 w-4" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                  
                                  {canEditOrDelete && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteExam(exam.id, exam.title)}
                                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all mr-0.5"
                                      title="Xóa đề thi này"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </section>
          );
        })()}

        {/* TAB 1.5: SITTINGS (Ca Thi) */}
        {activeTab === 'SITTINGS' && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-6 w-6 text-purple-400" />
                <div>
                  <h3 className="text-xl font-bold text-white uppercase">Quản lý Ca Thi (Tổ chức thi tập trung)</h3>
                  <p className="text-xs text-slate-400 mt-1">Gom nhiều đề thi thành một phòng thi, hỗ trợ phát đề ngẫu nhiên hoặc xoay vòng.</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateSittingModalOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:from-purple-500 hover:to-indigo-500 transition-all"
              >
                <Plus className="h-4 w-4" /> Tạo Ca Thi Mới
              </button>
            </div>

            {sittings.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-12 text-center text-sm text-slate-500">
                <Users className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                Chưa có Ca thi nào. Hãy tạo Ca thi để tổ chức thi tự động phát nhiều mã đề!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {sittings.map(sitting => (
                  <div key={sitting.id} className="rounded-2xl border border-slate-800 bg-slate-950 flex flex-col hover:border-slate-700 transition-all">
                    <div className="p-5 border-b border-slate-800">
                      <div className="flex justify-between items-start mb-3">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${sitting.is_active ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/50' : 'bg-amber-950/50 text-amber-400 border border-amber-800/50'}`}>
                          {sitting.is_active ? 'ĐANG MỞ' : 'BẢN NHÁP'}
                        </span>
                        <span className="font-mono bg-purple-500/20 text-purple-300 px-2 py-1 rounded font-bold text-[11px] border border-purple-500/30">
                          MÃ: {sitting.room_code}
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-base mb-1">{sitting.name}</h4>
                      <p className="text-xs text-slate-400 mb-4 line-clamp-2">{sitting.description || 'Không có mô tả'}</p>
                      
                      <div className="grid grid-cols-2 gap-3 mb-2">
                        <div className="bg-slate-900 rounded-lg p-2.5 border border-slate-800 flex items-center gap-2">
                          <Layers className="h-4 w-4 text-indigo-400" />
                          <div><div className="text-[10px] text-slate-500 uppercase">Số đề thi</div><div className="text-xs font-bold text-slate-300">{sitting.exams_count} đề</div></div>
                        </div>
                        <div className="bg-slate-900 rounded-lg p-2.5 border border-slate-800 flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-400" />
                          <div><div className="text-[10px] text-slate-500 uppercase">HS đã phân</div><div className="text-xs font-bold text-slate-300">{sitting.total_students} HS</div></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-slate-900/30 flex items-center gap-2 justify-end rounded-b-2xl">
                      <button 
                        onClick={async () => {
                          if (sitting.is_active) {
                            if(window.confirm('Thu hồi ca thi này? Học sinh sẽ không thể vào thi nữa.')) {
                              await sittingsApi.deactivate(sitting.id);
                              fetchData();
                            }
                          } else {
                            await sittingsApi.activate(sitting.id);
                            fetchData();
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${sitting.is_active ? 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white' : 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-600/30'}`}
                      >
                        {sitting.is_active ? 'Thu hồi' : 'Kích hoạt'}
                      </button>
                      <button 
                        onClick={() => {
                          setSittingToEdit(sitting);
                          setIsCreateSittingModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-600/20 text-amber-400 border border-amber-500/30 hover:bg-amber-600/30 text-xs font-bold transition-all"
                      >
                        Sửa
                      </button>
                      <button 
                        onClick={() => setSelectedSittingForResults(sitting)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 text-xs font-bold transition-all"
                      >
                        Bảng Điểm
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSitting(sitting.id, sitting.name)}
                        className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-500 hover:text-red-400 hover:border-red-800 transition-all"
                        title="Xóa ca thi này"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: LIVE SESSIONS & RESULTS */}
        {activeTab === 'SESSIONS' && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <BarChart className="h-5 w-5 text-blue-400" />
              <h3 className="text-lg font-bold text-white">
                GIÁM SÁT KẾT QUẢ & VI PHẠM THI CỦA THÍ SINH (REAL-TIME)
              </h3>
            </div>

            {sessions.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-6 text-center text-xs text-slate-500">
                Chưa có phiên làm bài nào của học sinh.
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60 shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="border-b border-slate-800 bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="px-5 py-3.5">Học sinh / SBD</th>
                        <th className="px-4 py-3.5">Lớp</th>
                        <th className="px-4 py-3.5">Đề thi</th>
                        <th className="px-4 py-3.5">Nhánh P2</th>
                        <th className="px-4 py-3.5">Điểm P1</th>
                        <th className="px-4 py-3.5">Điểm P2</th>
                        <th className="px-4 py-3.5">Tổng điểm</th>
                        <th className="px-4 py-3.5">Cảnh báo Vi phạm</th>
                        <th className="px-4 py-3.5">Trạng thái</th>
                        <th className="px-5 py-3.5 text-right">Chi tiết</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {sessions.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-900/50 transition-colors">
                          <td className="px-5 py-4 font-semibold text-white">
                            {s.student_name}
                          </td>
                          <td className="px-4 py-4 font-medium text-slate-400">{s.student_class || '12A1'}</td>
                          <td className="px-4 py-4 max-w-xs truncate text-slate-200">{s.exam_title}</td>
                          <td className="px-4 py-4">
                            <span className="inline-flex rounded-md bg-indigo-500/20 px-2 py-0.5 font-mono text-[11px] font-bold text-indigo-300">
                              {s.selected_branch}
                            </span>
                          </td>
                          <td className="px-4 py-4 font-mono">{s.part1_score}đ</td>
                          <td className="px-4 py-4 font-mono">{s.part2_score}đ</td>
                          <td className="px-4 py-4 font-mono text-sm font-bold text-blue-400">{s.total_score}đ</td>
                          <td className="px-4 py-4 font-mono">
                            {s.violation_count > 0 ? (
                              <span className="inline-flex items-center gap-1 text-red-400 font-bold">
                                <AlertTriangle className="h-3 w-3" /> {s.violation_count} lần
                              </span>
                            ) : (
                              <span className="text-slate-500">0</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-bold ${
                                s.status === 'SUBMITTED'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : s.status === 'LOCKED_VIOLATION'
                                  ? 'bg-red-500/20 text-red-300'
                                  : 'bg-amber-500/20 text-amber-300'
                              }`}
                            >
                              {s.status_display}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => navigate(`/result/${s.id}`)}
                              className="inline-flex items-center gap-1 rounded-lg bg-blue-600/20 px-3 py-1.5 text-xs font-bold text-blue-400 hover:bg-blue-600 hover:text-white transition-all"
                            >
                              <Eye className="h-3.5 w-3.5" /> Báo cáo
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {/* TAB: CLASSROOM MANAGEMENT */}
        {activeTab === 'CLASSES' && (
          <section className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">DANH SÁCH LỚP HỌC & ĐỘI TUYỂN BỒI DƯỠNG</h3>
              </div>

              <button
                onClick={() => {
                  setClassToEdit(null);
                  setShowCreateClassModal(true);
                }}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Tạo Lớp Học Mới</span>
              </button>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  value={classSearch}
                  onChange={(e) => setClassSearch(e.target.value)}
                  placeholder="Tìm kiếm theo tên lớp, mã lớp..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
                <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
              </div>

              {/* Grade Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {[
                  { key: 'ALL', label: `Tất cả (${classRooms.length})` },
                  { key: '12', label: 'Khối 12' },
                  { key: '11', label: 'Khối 11' },
                  { key: '10', label: 'Khối 10' },
                  { key: 'HSG', label: 'Đội tuyển HSG' },
                ].map((g) => (
                  <button
                    key={g.key}
                    onClick={() => setClassGradeFilter(g.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      classGradeFilter === g.key
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtered Classrooms */}
            {(() => {
              const filtered = classRooms.filter((c) => {
                if (classGradeFilter !== 'ALL' && c.grade !== classGradeFilter) return false;
                if (classSearch.trim()) {
                  const q = classSearch.toLowerCase();
                  return (
                    c.name.toLowerCase().includes(q) ||
                    c.code.toLowerCase().includes(q) ||
                    c.description?.toLowerCase().includes(q)
                  );
                }
                return true;
              });

              if (filtered.length === 0) {
                return (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-12 text-center text-slate-400 space-y-3">
                    <GraduationCap className="mx-auto h-10 w-10 text-slate-600" />
                    <p className="font-semibold text-slate-300">
                      {classRooms.length === 0
                        ? 'Thầy/Cô chưa tạo lớp học nào.'
                        : 'Không tìm thấy lớp học nào phù hợp với bộ lọc.'}
                    </p>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Hãy tạo các lớp học để quản lý danh sách học sinh, phân phối đề thi chính xác và theo dõi tiến độ học tập.
                    </p>
                    {classRooms.length === 0 && (
                      <button
                        onClick={() => {
                          setClassToEdit(null);
                          setShowCreateClassModal(true);
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg transition-all"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Tạo Lớp Đầu Tiên</span>
                      </button>
                    )}
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filtered.map((c) => (
                    <div
                      key={c.id}
                      className="flex flex-col justify-between rounded-3xl border border-slate-800 bg-slate-950/70 p-5 shadow-xl hover:border-slate-700 transition-all group"
                    >
                      <div className="space-y-3">
                        {/* Header Badge */}
                        <div className="flex items-center justify-between">
                          <span
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold border ${
                              c.grade === 'HSG'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            }`}
                          >
                            {c.grade_display || `Khối ${c.grade}`}
                          </span>

                          {/* Class Code */}
                          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-xs">
                            <span className="text-slate-400 text-[11px]">Mã:</span>
                            <span className="font-mono font-bold text-white tracking-wider">{c.code}</span>
                          </div>
                        </div>

                        {/* Title & Description */}
                        <div>
                          <h4 className="font-bold text-white text-base group-hover:text-emerald-300 transition-colors">
                            {c.name}
                          </h4>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                            {c.description || 'Chưa có mô tả lớp học.'}
                          </p>
                        </div>

                        {/* Stats Info */}
                        <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs text-slate-400">
                          <div>
                            <span className="text-[11px] text-slate-500 block">Sĩ số:</span>
                            <span className="font-semibold text-emerald-400">
                              {c.students_count} học sinh
                            </span>
                          </div>
                          <div>
                            <span className="text-[11px] text-slate-500 block">Năm học:</span>
                            <span className="font-semibold text-slate-300">{c.school_year}</span>
                          </div>
                        </div>

                        {isAdmin && c.teacher_name && (
                          <div className="text-[11px] text-slate-500 pt-1">
                            GV phụ trách: <span className="text-slate-300 font-medium">{c.teacher_name}</span>
                          </div>
                        )}
                      </div>

                      {/* Card Actions */}
                      <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <button
                          onClick={() => setManagingClass(c)}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white px-3 py-2 text-xs font-bold transition-all border border-blue-500/30"
                        >
                          <Users size={14} />
                          <span>Học Sinh ({c.students_count})</span>
                        </button>

                        <button
                          onClick={() => {
                            setClassToEdit(c);
                            setShowCreateClassModal(true);
                          }}
                          title="Chỉnh sửa lớp học"
                          className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:text-white hover:border-slate-700 transition-all"
                        >
                          <Edit3 size={15} />
                        </button>

                        <button
                          onClick={() => handleDeleteClass(c.id, c.name)}
                          title="Xóa lớp học"
                          className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-all"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </section>
        )}


        {/* TAB: QUESTION BANK */}
        {activeTab === 'BANK' && (
          <section className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">NGÂN HÀNG CÂU HỎI</h3>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setCategoryToEdit(null);
                    setShowCategoryModal(true);
                  }}
                  className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-xs font-bold text-white transition-all border border-slate-700"
                >
                  <Plus className="h-4 w-4" />
                  <span>Thêm Chuyên Đề</span>
                </button>
                <button
                  onClick={() => {
                    setBankQuestionToEdit(null);
                    setShowBankQuestionModal(true);
                  }}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  <span>Thêm Câu Hỏi Mới</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-5">
              {/* Sidebar: Categories */}
              <div className="w-full md:w-1/4 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chuyên Đề / Thư Mục</h4>
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-2 space-y-1">
                  <button className="w-full text-left px-3 py-2.5 rounded-xl bg-indigo-600/20 text-indigo-300 font-semibold text-sm border border-indigo-500/30">
                    📂 Tất cả câu hỏi ({bankQuestions.length})
                  </button>
                  {bankCategories.map((cat) => (
                    <button key={cat.id} className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-300 font-medium text-sm transition-colors flex items-center justify-between group">
                      <span>📁 {cat.name}</span>
                      <span className="text-xs text-slate-500 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800 group-hover:border-slate-700">
                        {cat.question_count || 0}
                      </span>
                    </button>
                  ))}
                  {bankCategories.length === 0 && (
                    <div className="px-3 py-4 text-xs text-slate-500 text-center italic">
                      Chưa có chuyên đề nào
                    </div>
                  )}
                </div>
              </div>

              {/* Main Content: Questions List */}
              <div className="w-full md:w-3/4 space-y-4">
                {/* Search Bar */}
                <div className="flex items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Tìm kiếm nội dung câu hỏi..."
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    />
                    <Search size={16} className="absolute left-3 top-2.5 text-slate-500" />
                  </div>
                </div>

                {bankQuestions.length === 0 ? (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-12 text-center text-slate-400 space-y-3">
                    <Layers className="mx-auto h-10 w-10 text-slate-600" />
                    <p className="font-semibold text-slate-300">Ngân hàng chưa có câu hỏi nào.</p>
                    <p className="text-xs text-slate-500">Hãy thêm câu hỏi mới hoặc tạo từ đề thi có sẵn.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bankQuestions.map((q, idx) => (
                      <div key={q.id} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 hover:border-slate-700 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-bold border border-slate-700">
                              {q.part_type === 'PART_I' ? 'Phần I' : 'Phần II'}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                              {q.branch}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                              q.difficulty_level === 'NB' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                              q.difficulty_level === 'TH' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                              q.difficulty_level === 'VD' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                              'bg-red-500/20 text-red-300 border-red-500/30'
                            }`}>
                              {q.difficulty_level}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => {
                                setBankQuestionToEdit(q);
                                setShowBankQuestionModal(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button 
                              onClick={async () => {
                                if (window.confirm('Xóa câu hỏi này khỏi thư viện?')) {
                                  try {
                                    await bankApi.deleteQuestion(q.id as number);
                                    fetchData();
                                  } catch(e) { alert('Lỗi'); }
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-950 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="text-sm text-slate-200 line-clamp-2">
                          {q.content}
                        </div>
                        {q.options && q.options.length > 0 && (
                          <div className="mt-3 flex gap-2">
                            {q.options.map(opt => (
                              <span key={opt.id} className={`text-xs font-mono px-1.5 py-0.5 rounded ${opt.is_correct ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500'}`}>
                                {opt.label}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="mt-2 text-[10px] text-slate-500">
                          Thư mục: <span className="text-slate-400">{q.category_name || '(Không phân loại)'}</span> • Người tạo: {q.created_by_name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* TAB: QUESTION FEEDBACKS & DISPUTES */}
        {activeTab === 'FEEDBACKS' && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-red-400" />
                <h3 className="text-lg font-bold text-white">DANH SÁCH PHẢN ÁNH CÂU HỎI TỪ HỌC SINH</h3>
              </div>

              {/* Filter */}
              <div className="flex items-center gap-2">
                {(['ALL', 'PENDING', 'ACCEPTED', 'REJECTED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setFeedbackFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      feedbackFilter === st
                        ? 'bg-red-600 border-red-500 text-white shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {st === 'ALL'
                      ? `Tất cả (${feedbacks.length})`
                      : st === 'PENDING'
                      ? `Chờ xử lý (${feedbacks.filter((f) => f.status === 'PENDING').length})`
                      : st === 'ACCEPTED'
                      ? `Đã sửa & chấm lại (${feedbacks.filter((f) => f.status === 'ACCEPTED').length})`
                      : `Từ chối (${feedbacks.filter((f) => f.status === 'REJECTED').length})`}
                  </button>
                ))}
              </div>
            </div>

            {feedbacks.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-12 text-center text-slate-400 space-y-2">
                <Flag className="mx-auto h-8 w-8 text-slate-600" />
                <p className="font-semibold text-slate-300">Hiện chưa có phản ánh câu hỏi nào từ học sinh.</p>
                <p className="text-xs text-slate-500">
                  Khi học sinh phát hiện sai sót về đáp án hoặc đề bài và gửi phản ánh, thông tin sẽ xuất hiện tại đây để Thầy/Cô duyệt và tự động chấm lại điểm.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {feedbacks
                  .filter((f) => feedbackFilter === 'ALL' || f.status === feedbackFilter)
                  .map((fb) => (
                    <div
                      key={fb.id}
                      className={`rounded-2xl border bg-slate-950/70 p-5 space-y-4 transition-all ${
                        fb.status === 'PENDING'
                          ? 'border-amber-500/40 bg-amber-950/10'
                          : fb.status === 'ACCEPTED'
                          ? 'border-emerald-500/40 bg-emerald-950/10'
                          : 'border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-bold ${
                                fb.status === 'PENDING'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : fb.status === 'ACCEPTED'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
                              }`}
                            >
                              {fb.status_display}
                            </span>
                            <span className="font-bold text-white text-sm">
                              {fb.exam_title} • Câu {fb.question_order_index} ({fb.question_part === 'PART_I' ? 'Phần I' : `Phần II ${fb.question_branch}`})
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">
                            Thí sinh: <strong className="text-slate-200">{fb.student_name}</strong> ({fb.student_class || 'Học sinh'}) • Gửi lúc: {new Date(fb.created_at).toLocaleString('vi-VN')}
                          </p>
                        </div>

                        <span className="rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300">
                          Loại lỗi: <strong className="text-blue-400">{fb.feedback_type_display}</strong>
                        </span>
                      </div>

                      {/* Question content */}
                      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
                        <span className="font-bold text-slate-400">Nội dung câu hỏi: </span>
                        {fb.question_content}
                      </div>

                      {/* Student argument & suggestion */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        <div className="md:col-span-2 p-3 rounded-xl bg-red-950/20 border border-red-900/40 text-red-200 space-y-1">
                          <span className="font-bold text-red-400">Học sinh phản ánh & giải thích:</span>
                          <p className="leading-relaxed">{fb.student_note}</p>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 space-y-1">
                          <span className="font-bold text-amber-400">Đáp án HS đề xuất:</span>
                          <p className="font-mono font-bold text-white text-sm">{fb.suggested_option || 'Không ghi rõ'}</p>
                        </div>
                      </div>

                      {/* Teacher Reply if any */}
                      {fb.teacher_reply && (
                        <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-900/40 text-indigo-200 text-xs space-y-1">
                          <span className="font-bold text-indigo-400">Phản hồi của Giáo viên ({fb.reviewer_name || 'Giáo viên'}):</span>
                          <p className="leading-relaxed">{fb.teacher_reply}</p>
                        </div>
                      )}

                      {/* Action buttons */}
                      {fb.status === 'PENDING' && (
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-end gap-2.5">
                          <button
                            type="button"
                            onClick={() => {
                              const reply = window.prompt('Nhập lý do từ chối phản ánh này (nếu có):', '');
                              if (reply !== null) {
                                examsApi.reviewQuestionFeedback(fb.id, {
                                  status: 'REJECTED',
                                  teacher_reply: reply,
                                }).then(() => {
                                  setActionMsg(`Đã từ chối phản ánh của ${fb.student_name}.`);
                                  fetchData();
                                });
                              }
                            }}
                            className="inline-flex items-center gap-1 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-bold text-red-300 hover:bg-red-500/20 transition-all"
                          >
                            <XCircle className="h-4 w-4" />
                            <span>Từ chối</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setReviewingFeedback(fb)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/30 transition-all"
                          >
                            <CheckCircle className="h-4 w-4" />
                            <span>Chấp Thuận & Sửa Đáp Án + Tự Động Chấm Lại</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 3: SUPER ADMIN - USER MANAGEMENT */}
        {isAdmin && activeTab === 'USERS' && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-400" />
                <h3 className="text-lg font-bold text-white">QUẢN LÝ NGƯỜI DÙNG TOÀN TRƯỜNG</h3>
              </div>
              <button
                onClick={() => setShowBulkImportModal(true)}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 transition-all shadow-md shadow-blue-600/30"
              >
                <UserPlus className="h-4 w-4" />
                <span>Nhập hàng loạt tài khoản</span>
              </button>
            </div>

            {/* Filter & Search */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-slate-800 bg-slate-950/60">
              <div className="relative flex-1 min-w-[220px]">
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Tìm theo tên, username, SBD, lớp..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 pl-9 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              </div>

              <div className="flex items-center gap-2 text-xs">
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                >
                  <option value="ALL">Tất cả vai trò</option>
                  <option value="STUDENT">Học sinh</option>
                  <option value="TEACHER">Giáo viên</option>
                  <option value="ADMIN">Super Admin</option>
                </select>

                <button
                  onClick={fetchData}
                  className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                  Làm mới
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60 shadow-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="border-b border-slate-800 bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-5 py-3.5">Họ và tên</th>
                    <th className="px-4 py-3.5">Username / SBD</th>
                    <th className="px-4 py-3.5">Vai trò</th>
                    <th className="px-4 py-3.5">Lớp / Đội tuyển</th>
                    <th className="px-4 py-3.5">Trạng thái</th>
                    <th className="px-5 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {usersList
                    .filter((u) => {
                      const matchesSearch =
                        u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
                        u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
                        (u.student_id && u.student_id.toLowerCase().includes(userSearch.toLowerCase())) ||
                        (u.class_name && u.class_name.toLowerCase().includes(userSearch.toLowerCase()));
                      const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
                      return matchesSearch && matchesRole;
                    })
                    .map((u) => (
                      <tr key={u.id} className="hover:bg-slate-900/50">
                        <td className="px-5 py-4 font-semibold text-white">{u.full_name || u.username}</td>
                        <td className="px-4 py-4 font-mono text-slate-300">{u.username} {u.student_id ? `(${u.student_id})` : ''}</td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold ${
                              u.role === 'ADMIN'
                                ? 'bg-amber-500/20 text-amber-300'
                                : u.role === 'TEACHER'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-400">{u.class_name || '-'}</td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold ${
                              u.status === 'ACTIVE'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : u.status === 'REJECTED'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right space-x-2">
                          <button
                            onClick={() => setEditUserTarget(u)}
                            className="inline-flex items-center gap-1 rounded-lg border border-blue-600/40 bg-blue-500/10 px-2.5 py-1.5 text-xs font-semibold text-blue-300 hover:bg-blue-500/20 transition-all"
                            title="Chỉnh sửa lớp học, họ tên, SBD"
                          >
                            <Edit3 className="h-3 w-3" /> Sửa thông tin
                          </button>

                          <button
                            onClick={() => setResetPasswordTargetUser(u)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-amber-300"
                            title="Đặt lại mật khẩu cho tài khoản này"
                          >
                            <KeyRound className="h-3 w-3" /> Đổi MK
                          </button>

                          {u.status !== 'ACTIVE' ? (
                            <button
                              onClick={() => handleToggleUserStatus(u, 'ACTIVE')}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600/80 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-600"
                            >
                              Kích hoạt
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleUserStatus(u, 'REJECTED')}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/20"
                            >
                              Khóa
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TAB 4: SUPER ADMIN - TEACHER APPROVAL */}
        {isAdmin && activeTab === 'TEACHERS' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">DUYỆT TÀI KHOẢN GIÁO VIÊN BỘ MÔN</h3>
              </div>
              <span className="text-xs text-amber-400 font-semibold">
                {pendingTeachers.length} tài khoản giáo viên
              </span>
            </div>

            {pendingTeachers.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-12 text-center text-xs text-slate-500">
                Không có tài khoản Giáo viên nào đang chờ phê duyệt.
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60 shadow-xl">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="border-b border-slate-800 bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-5 py-3.5">Họ và tên</th>
                      <th className="px-4 py-3.5">Username / Email</th>
                      <th className="px-4 py-3.5">Số điện thoại</th>
                      <th className="px-4 py-3.5">Trạng thái</th>
                      <th className="px-5 py-3.5 text-right">Thao tác duyệt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {pendingTeachers.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-900/50">
                        <td className="px-5 py-4 font-semibold text-white">{t.full_name || t.username}</td>
                        <td className="px-4 py-4">{t.username} • {t.email || 'Không có email'}</td>
                        <td className="px-4 py-4 font-mono">{t.phone_number || '-'}</td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-bold ${
                              t.status === 'ACTIVE'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : t.status === 'REJECTED'
                                ? 'bg-red-500/20 text-red-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {t.status === 'ACTIVE' ? 'Đã duyệt' : t.status === 'REJECTED' ? 'Đã từ chối' : 'Chờ duyệt'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right space-x-2">
                          <button
                            onClick={() => handleApproveTeacher(t.id, 'ACTIVE')}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
                          >
                            <CheckCircle className="h-3.5 w-3.5" /> Duyệt
                          </button>
                          <button
                            onClick={() => handleApproveTeacher(t.id, 'REJECTED')}
                            className="inline-flex items-center gap-1 rounded-lg bg-red-600/80 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-500"
                          >
                            <XCircle className="h-3.5 w-3.5" /> Từ chối
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* TAB 5: SUPER ADMIN - SYSTEM STATS & KPI */}
        {isAdmin && activeTab === 'STATS' && (
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-400" />
              <h3 className="text-lg font-bold text-white">BÁO CÁO & THỐNG KÊ TỔNG QUAN TOÀN TRƯỜNG</h3>
            </div>

            {systemStats && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 text-center">
                    <div className="text-xs font-bold uppercase text-slate-400 mb-1">Tổng Học Sinh</div>
                    <div className="text-3xl font-black text-white">{systemStats.total_students}</div>
                  </div>
                  <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5 text-center">
                    <div className="text-xs font-bold uppercase text-blue-400 mb-1">Giáo Viên Bộ Môn</div>
                    <div className="text-3xl font-black text-blue-300">{systemStats.total_teachers}</div>
                  </div>
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-center">
                    <div className="text-xs font-bold uppercase text-emerald-400 mb-1">Đề Thi Đang Mở</div>
                    <div className="text-3xl font-black text-emerald-300">{systemStats.active_exams} / {systemStats.total_exams}</div>
                  </div>
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 text-center">
                    <div className="text-xs font-bold uppercase text-amber-400 mb-1">Lượt Nộp & Điểm TB</div>
                    <div className="text-2xl font-black text-amber-300">{systemStats.total_completed_sessions} <span className="text-xs font-normal">({systemStats.average_score}đ)</span></div>
                  </div>
                </div>

                {/* Class Distribution */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-indigo-400" />
                    Phân Bố Thí Sinh Theo Khối / Lớp
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {systemStats.classes_distribution.map((cls, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-900/60 text-xs">
                        <span className="font-semibold text-slate-200">{cls.class_name}</span>
                        <span className="font-bold text-blue-400">{cls.count} học sinh</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </section>
        )}
      </main>

      {/* Docx Import Modal */}
      <DocxImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={fetchData}
        initialFolderId={selectedFolderId || undefined}
      />

      {/* Create / Edit Exam Folder Modal */}
      <CreateFolderModal
        isOpen={showCreateFolderModal}
        onClose={() => {
          setShowCreateFolderModal(false);
          setFolderToEdit(null);
          setParentFolderIdForCreate(null);
        }}
        onSuccess={() => {
          fetchData();
          setShowCreateFolderModal(false);
          setFolderToEdit(null);
          setParentFolderIdForCreate(null);
        }}
        folderToEdit={folderToEdit}
        parentFolderId={parentFolderIdForCreate}
        existingFolders={folders}
      />

      {/* Move Exam to Folder Modal */}
      {movingExam && (
        <MoveExamModal
          isOpen={!!movingExam}
          onClose={() => setMovingExam(null)}
          onSuccess={() => {
            fetchData();
            setMovingExam(null);
          }}
          exam={movingExam}
          folders={folders}
        />
      )}

      {/* Assign Exam Modal */}
      {assigningExam && (
        <AssignExamModal
          exam={assigningExam}
          isOpen={!!assigningExam}
          onClose={() => setAssigningExam(null)}
          onAssigned={fetchData}
        />
      )}

      {/* Share Exam Modal */}
      {sharingExam && (
        <ShareExamModal
          exam={sharingExam}
          isOpen={!!sharingExam}
          onClose={() => setSharingExam(null)}
          onSuccess={fetchData}
        />
      )}

      {/* AI Settings Modal */}
      <AISettingsModal
        isOpen={showAISettingsModal}
        onClose={() => setShowAISettingsModal(false)}
      />

      {/* Two-Factor Authentication Modal */}
      <TwoFactorModal
        isOpen={showTwoFactorModal}
        onClose={() => setShowTwoFactorModal(false)}
        onSuccess={fetchData}
      />

      {/* Live Proctor Modal */}
      {liveProctorExamId !== null && (
        <LiveProctorModal
          examId={liveProctorExamId}
          onClose={() => setLiveProctorExamId(null)}
        />
      )}

      {/* Exam Analytics Modal */}
      {analyticsExamId !== null && (
        <ExamAnalyticsModal
          examId={analyticsExamId}
          onClose={() => setAnalyticsExamId(null)}
        />
      )}

      {/* Bulk User Import Modal */}
      {showBulkImportModal && (
        <BulkUserImportModal
          onClose={() => setShowBulkImportModal(false)}
          onSuccess={fetchData}
        />
      )}

      {/* Reset Password Modal */}
      {resetPasswordTargetUser && (
        <ResetPasswordModal
          targetUser={resetPasswordTargetUser}
          onClose={() => setResetPasswordTargetUser(null)}
          onSuccess={fetchData}
        />
      )}

      {/* Edit User Modal */}
      {editUserTarget && (
        <EditUserModal
          targetUser={editUserTarget}
          onClose={() => setEditUserTarget(null)}
          onSuccess={fetchData}
        />
      )}

      {/* Review Feedback & Auto-Regrade Modal */}
      {reviewingFeedback && (
        <ReviewFeedbackModal
          feedback={reviewingFeedback}
          onClose={() => setReviewingFeedback(null)}
          onSuccess={() => {
            setActionMsg(`Đã duyệt phản ánh câu ${reviewingFeedback.question_order_index}, cập nhật đáp án chuẩn và tự động tính lại điểm cho toàn bộ thí sinh!`);
            fetchData();
          }}
        />
      )}

      {/* Create / Edit Class Modal */}
      <CreateClassModal
        isOpen={showCreateClassModal}
        onClose={() => {
          setShowCreateClassModal(false);
          setClassToEdit(null);
        }}
        onSuccess={() => {
          fetchData();
          setShowCreateClassModal(false);
          setClassToEdit(null);
        }}
        classToEdit={classToEdit}
      />

      {/* Class Detail & Student Roster Management Modal */}
      {managingClass && (
        <ClassManagementModal
          classRoom={managingClass}
          isOpen={!!managingClass}
          onClose={() => setManagingClass(null)}
          onClassUpdated={fetchData}
        />
      )}
      
      {/* Question Bank Modals */}
      <CreateCategoryModal
        isOpen={showCategoryModal}
        categoryToEdit={categoryToEdit}
        onClose={() => {
          setShowCategoryModal(false);
          setCategoryToEdit(null);
        }}
        onSuccess={() => {
          fetchData();
          setShowCategoryModal(false);
          setCategoryToEdit(null);
        }}
      />

      <CreateBankQuestionModal
        isOpen={showBankQuestionModal}
        questionToEdit={bankQuestionToEdit}
        categories={bankCategories}
        onClose={() => {
          setShowBankQuestionModal(false);
          setBankQuestionToEdit(null);
        }}
        onSuccess={() => {
          fetchData();
          setShowBankQuestionModal(false);
          setBankQuestionToEdit(null);
        }}
      />

      {/* CA THI MODALS */}
      <CreateSittingModal
        isOpen={isCreateSittingModalOpen}
        onClose={() => {
          setIsCreateSittingModalOpen(false);
          setSittingToEdit(null);
        }}
        onCreated={() => {
          fetchData();
          setSittingToEdit(null);
        }}
        availableExams={exams}
        availableClasses={classRooms.map(c => c.name)}
        sittingToEdit={sittingToEdit}
      />

      {selectedSittingForResults && (
        <SittingResultsModal
          sitting={selectedSittingForResults}
          isOpen={true}
          onClose={() => setSelectedSittingForResults(null)}
        />
      )}
    </div>
  );
};

// Inner component: Review Feedback Modal
interface ReviewFeedbackModalProps {
  feedback: QuestionFeedback;
  onClose: () => void;
  onSuccess: () => void;
}

const ReviewFeedbackModal: React.FC<ReviewFeedbackModalProps> = ({ feedback, onClose, onSuccess }) => {
  const [teacherReply, setTeacherReply] = useState<string>(
    feedback.suggested_option
      ? `Ghi nhận phản ánh chính xác từ học sinh. Đã điều chỉnh đáp án chuẩn thành: ${feedback.suggested_option}.`
      : 'Ghi nhận phản ánh chính xác từ học sinh. Đã điều chỉnh đáp án chuẩn và tự động tính lại điểm.'
  );
  const [selectedOptLabel, setSelectedOptLabel] = useState<string>(
    feedback.suggested_option?.toUpperCase().trim() || 'A'
  );
  const [part2Keys, setPart2Keys] = useState<Record<string, boolean>>({
    a: true,
    b: false,
    c: true,
    d: false,
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleApprove = async () => {
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // Find option ID if Part 1
      let payload: any = {
        status: 'ACCEPTED',
        teacher_reply: teacherReply,
        auto_regrade: true,
      };

      if (feedback.question_part === 'PART_I') {
        // Will send suggested_option label to backend review or target option
        payload.target_option_label = selectedOptLabel;
      } else {
        payload.part2_correct_keys = part2Keys;
      }

      await examsApi.reviewQuestionFeedback(feedback.id, payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Có lỗi xảy ra khi phê duyệt phản ánh.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Duyệt Phản Ánh & Sửa Đáp Án
              </h3>
              <p className="text-xs text-slate-400">
                Câu {feedback.question_order_index} ({feedback.question_part}) • {feedback.exam_title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 space-y-1">
          <p><strong className="text-slate-400">Học sinh phản ánh:</strong> {feedback.student_name} ({feedback.student_class})</p>
          <p><strong className="text-slate-400">Lý do/Phân tích:</strong> {feedback.student_note}</p>
          {feedback.suggested_option && (
            <p><strong className="text-amber-400">Đáp án HS đề xuất:</strong> <span className="font-bold text-white font-mono">{feedback.suggested_option}</span></p>
          )}
        </div>

        <div className="space-y-3.5 text-xs">
          {feedback.question_part === 'PART_I' ? (
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                Chọn đáp án đúng CHÍNH XÁC (Sau khi sửa):
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['A', 'B', 'C', 'D'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSelectedOptLabel(opt)}
                    className={`py-2 rounded-xl font-bold font-mono text-sm border transition-all ${
                      selectedOptLabel === opt
                        ? 'border-emerald-500 bg-emerald-600/30 text-emerald-300 shadow-sm'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Phương án {opt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                Cập nhật đáp án Đúng / Sai cho 4 ý a, b, c, d:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['a', 'b', 'c', 'd'] as const).map((key) => (
                  <div key={key} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="font-bold font-mono uppercase text-slate-300">Ý {key}:</span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPart2Keys((prev) => ({ ...prev, [key]: true }))}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          part2Keys[key]
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-900 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        Đúng
                      </button>
                      <button
                        type="button"
                        onClick={() => setPart2Keys((prev) => ({ ...prev, [key]: false }))}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          !part2Keys[key]
                            ? 'bg-red-600 text-white'
                            : 'bg-slate-900 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        Sai
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Lời nhắn gửi học sinh / Ghi chú của giáo viên:
            </label>
            <textarea
              rows={3}
              value={teacherReply}
              onChange={(e) => setTeacherReply(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none resize-none leading-relaxed"
            />
          </div>

          <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-800/40 text-blue-300 text-[11px] leading-relaxed">
            ℹ️ <strong>Cơ chế tự động:</strong> Khi bấm duyệt, hệ thống sẽ sửa đáp án câu hỏi trong đề, tự động quét lại toàn bộ bài thi đã nộp của tất cả học sinh, tính lại điểm theo ma trận Bộ GD&ĐT và cập nhật ngay lập tức.
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleApprove}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" />
              <span>{isSubmitting ? 'Đang chấm lại điểm...' : 'Xác Nhận Sửa & Chấm Lại'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


