import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { assessmentApi, examsApi } from '../services/api';
import { ExamStartPayload, QuestionMasked } from '../types';
import { useAntiCheat } from '../hooks/useAntiCheat';
import { useExamTimer } from '../hooks/useExamTimer';
import { QuestionCardPart1 } from '../components/exam/QuestionCardPart1';
import { QuestionCardPart2 } from '../components/exam/QuestionCardPart2';
import { TabSwitchWarningModal } from '../components/exam/TabSwitchWarningModal';
import { ExamWatermark } from '../components/exam/ExamWatermark';
import { QuestionDisputeModal } from '../components/exam/QuestionDisputeModal';
import { ThemeToggle } from '../components/common/ThemeToggle';
import {
  LayoutGrid,
  Home,
  Shield,
  Clock,
  Send,
  AlertTriangle,
  Layers,
  Cpu,
  Globe,
  Maximize,
  Star,
  Type,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Filter,
  Wifi,
  WifiOff,
  CloudUpload,
  Eye,
} from 'lucide-react';

export const ExamRoom: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPreviewParam = searchParams.get('preview') === 'true';
  const { user } = useAuth();

  const [payload, setPayload] = useState<ExamStartPayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false);

  const isPreview = isPreviewParam || payload?.is_preview === true;
  const [showAnswerKey, setShowAnswerKey] = useState<boolean>(false);
  const [showSimulatedResultModal, setShowSimulatedResultModal] = useState<boolean>(false);
  const [simulatedScore, setSimulatedScore] = useState<{
    totalScore: number;
    maxScore: number;
    p1Score: number;
    p2Score: number;
    p1Correct: number;
    p1Total: number;
    p2SubCorrect: number;
    p2SubTotal: number;
  } | null>(null);

  // Student Answers state
  const [part1Answers, setPart1Answers] = useState<Record<number, number>>({});
  const [part2Answers, setPart2Answers] = useState<Record<number, Record<string, boolean>>>({});
  
  // Flagged questions for review ⭐
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());

  // Struck-through / Eliminated options (part 1)
  const [eliminatedOptions, setEliminatedOptions] = useState<Record<number, number[]>>({});

  // Network Connectivity State
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [showOnlineRestoredToast, setShowOnlineRestoredToast] = useState<boolean>(false);

  // Font size zoom: 'sm' | 'md' | 'lg'
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');

  // Palette Filter: 'ALL' | 'ANSWERED' | 'UNANSWERED' | 'FLAGGED'
  const [paletteFilter, setPaletteFilter] = useState<'ALL' | 'ANSWERED' | 'UNANSWERED' | 'FLAGGED'>('ALL');

  // Selected Branch for Part II
  const [selectedBranch, setSelectedBranch] = useState<'NONE' | 'CS' | 'ICT' | 'BOTH'>('NONE');
  const [showBranchModal, setShowBranchModal] = useState<boolean>(false);
  const [showMobilePalette, setShowMobilePalette] = useState<boolean>(false);
  const [pendingBranchChoice, setPendingBranchChoice] = useState<'CS' | 'ICT'>('CS');

  // Submit Modal & Incomplete Alert Modal
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [showIncompleteModal, setShowIncompleteModal] = useState<boolean>(false);
  const [incompleteReport, setIncompleteReport] = useState<{
    incompleteP1: Array<{ id: number; display_number: number }>;
    incompleteP2: Array<{ id: number; display_number: number; branch: string; branchLabel: string; missingOptions: string[] }>;
  }>({ incompleteP1: [], incompleteP2: [] });
  const [highlightedQuestionId, setHighlightedQuestionId] = useState<number | null>(null);

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Dispute / Report Question Modal State
  const [disputeQuestion, setDisputeQuestion] = useState<{ id: number; number: number; content: string } | null>(null);

  // Broadcast State
  const [broadcastMessage, setBroadcastMessage] = useState<string | null>(null);
  const [showBroadcastToast, setShowBroadcastToast] = useState<boolean>(false);
  const [latestBroadcastId, setLatestBroadcastId] = useState<number | null>(null);

  // Load Exam Session & Restore LocalStorage Cache / Server Draft
  useEffect(() => {
    const initExam = async () => {
      if (!examId) return;
      try {
        if (isPreviewParam) {
          const data = await examsApi.previewExam(Number(examId));
          setPayload(data);
          setHasStarted(true); // Auto-start in preview mode for immediate inspection
          const isBoth = data.data.exam.branch_mode === 'BOTH' || data.selected_branch === 'BOTH';
          if (isBoth) {
            setSelectedBranch('BOTH');
          } else if (data.selected_branch && data.selected_branch !== 'NONE') {
            setSelectedBranch(data.selected_branch);
          } else {
            setSelectedBranch('CS');
          }
          setIsLoading(false);
          return;
        }

        const data = await assessmentApi.startExam(Number(examId));
        setPayload(data);
        const isBoth = data.data.exam.branch_mode === 'BOTH' || data.selected_branch === 'BOTH';
        if (isBoth) {
          setSelectedBranch('BOTH');
        } else if (data.selected_branch && data.selected_branch !== 'NONE') {
          setSelectedBranch(data.selected_branch);
        }

        // Restore answers from LocalStorage cache if available
        const cacheKey = `exam_cache_${data.session_id}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const parsedCache = JSON.parse(cached);
            if (parsedCache.part1) setPart1Answers(parsedCache.part1);
            if (parsedCache.part2) setPart2Answers(parsedCache.part2);
            if (parsedCache.flagged) setFlaggedQuestions(new Set(parsedCache.flagged));
            if (parsedCache.eliminated) setEliminatedOptions(parsedCache.eliminated);
          } catch (e) {
            console.warn('Could not parse cached answers:', e);
          }
        }

        // Also fetch draft from server (for switching devices / browser crashes)
        try {
          const draftRes = await assessmentApi.getDraft(data.session_id);
          if (draftRes && draftRes.draft_answers) {
            const d = draftRes.draft_answers;
            if (d.part1 && Object.keys(d.part1).length > 0) {
              setPart1Answers((prev) => ({ ...d.part1, ...prev }));
            }
            if (d.part2 && Object.keys(d.part2).length > 0) {
              setPart2Answers((prev) => ({ ...d.part2, ...prev }));
            }
            if (d.flagged && d.flagged.length > 0) {
              setFlaggedQuestions((prev) => new Set([...Array.from(prev), ...d.flagged]));
            }
            if (d.eliminated && Object.keys(d.eliminated).length > 0) {
              setEliminatedOptions((prev) => ({ ...d.eliminated, ...prev }));
            }
          }
        } catch (draftErr) {
          console.warn('Server draft fetch skipped:', draftErr);
        }
      } catch (err: any) {
        console.error(err);
        const errorDetail =
          err.response?.data?.detail ||
          (err.response?.status === 404
            ? 'Đề thi không tồn tại hoặc máy chủ Backend Render đang deploy phiên bản mới. Vui lòng thử lại sau 1-2 phút!'
            : err.message === 'Network Error'
            ? 'Máy chủ Backend (Render) đang khởi động hoặc mất kết nối mạng. Vui lòng đợi giây lát rồi thử lại!'
            : 'Không thể tải đề thi.');
        setLoadError(errorDetail);
      } finally {
        setIsLoading(false);
      }
    };
    initExam();
  }, [examId, isPreviewParam, navigate]);

  // Auto-Save to LocalStorage Cache
  useEffect(() => {
    if (!payload || isPreview) return;
    const cacheKey = `exam_cache_${payload.session_id}`;
    const dataToCache = {
      part1: part1Answers,
      part2: part2Answers,
      flagged: Array.from(flaggedQuestions),
      eliminated: eliminatedOptions,
      timestamp: Date.now(),
    };
    localStorage.setItem(cacheKey, JSON.stringify(dataToCache));
  }, [payload, isPreview, part1Answers, part2Answers, flaggedQuestions, eliminatedOptions]);

  // C4: Dùng useRef để giữ reference ổn định, tránh reset interval liên tục
  const draftAnswersRef = React.useRef({ part1Answers, part2Answers, flaggedQuestions, eliminatedOptions });
  useEffect(() => {
    draftAnswersRef.current = { part1Answers, part2Answers, flaggedQuestions, eliminatedOptions };
  }, [part1Answers, part2Answers, flaggedQuestions, eliminatedOptions]);

  // Server-side Auto-Save periodic timer (every 15s)
  const syncDraftToServer = useCallback(async () => {
    if (isPreview || !payload || !payload.session_id || !navigator.onLine) return;
    setIsSyncing(true);
    try {
      const { part1Answers: p1, part2Answers: p2, flaggedQuestions: fg, eliminatedOptions: el } = draftAnswersRef.current;
      await assessmentApi.autoSaveDraft(payload.session_id, {
        part1: p1,
        part2: p2,
        flagged: Array.from(fg),
        eliminated: el,
      });
      setLastSyncTime(new Date());
    } catch (e) {
      console.warn('Server auto-save error:', e);
    } finally {
      setIsSyncing(false);
    }
  }, [payload]); // reference ổn định, không bị tạo lại khi đáp án thay đổi

  useEffect(() => {
    if (!hasStarted || !payload) return;
    const interval = setInterval(syncDraftToServer, 15000);
    return () => clearInterval(interval);
  }, [hasStarted, syncDraftToServer, payload]);

  // Broadcast Polling (every 15s) for Students
  useEffect(() => {
    if (!hasStarted || !payload || isPreview || user?.role !== 'STUDENT') return;
    const fetchBroadcasts = async () => {
      try {
        const broadcasts = await assessmentApi.getBroadcasts(payload.session_id);
        if (broadcasts.length > 0) {
          const latest = broadcasts[0]; // Assuming descending order by created_at
          if (latest.id !== latestBroadcastId) {
            setLatestBroadcastId(latest.id);
            setBroadcastMessage(latest.message);
            setShowBroadcastToast(true);
            setTimeout(() => setShowBroadcastToast(false), 15000);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch broadcasts:', err);
      }
    };
    fetchBroadcasts();
    const intervalId = setInterval(fetchBroadcasts, 15000);
    return () => clearInterval(intervalId);
  }, [hasStarted, payload, isPreview, user?.role, latestBroadcastId]);

  // Network Connectivity Event Listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineRestoredToast(true);
      setTimeout(() => setShowOnlineRestoredToast(false), 5000);
      syncDraftToServer();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncDraftToServer]);

  // Handle Flag Toggle
  const handleToggleFlag = (qId: number) => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  // Handle Strike-through / Option Elimination Toggle
  const handleToggleEliminate = (qId: number, optId: number) => {
    setEliminatedOptions((prev) => {
      const current = prev[qId] || [];
      const next = current.includes(optId)
        ? current.filter((id) => id !== optId)
        : [...current, optId];
      return { ...prev, [qId]: next };
    });
  };

  // Validation for 100% completion before manual submission
  const validateCompletion = useCallback(() => {
    if (!payload) {
      return { isComplete: false, needsBranchSelection: false, incompleteP1: [], incompleteP2: [] };
    }

    const isBoth = payload.data.exam.branch_mode === 'BOTH' || selectedBranch === 'BOTH';

    // Check branch choice in single mode
    if (!isBoth && selectedBranch === 'NONE') {
      return {
        isComplete: false,
        needsBranchSelection: true,
        incompleteP1: [],
        incompleteP2: [],
      };
    }

    // Check Part 1: every question must have an option selected
    const incompleteP1: Array<{ id: number; display_number: number }> = [];
    (payload.data.part1_questions || []).forEach((q) => {
      if (part1Answers[q.id] === undefined || part1Answers[q.id] === null) {
        incompleteP1.push({ id: q.id, display_number: q.display_number });
      }
    });

    // Check Part 2: every question in scope must have ALL sub-items selected true or false
    const incompleteP2: Array<{
      id: number;
      display_number: number;
      branch: string;
      branchLabel: string;
      missingOptions: string[];
    }> = [];

    const checkP2 = (q: QuestionMasked, branchLabel: string) => {
      const qAns = part2Answers[q.id] || {};
      const missing = (q.options || []).filter(
        (opt) => typeof qAns[String(opt.id)] !== 'boolean'
      );
      if (missing.length > 0) {
        incompleteP2.push({
          id: q.id,
          display_number: q.display_number,
          branch: q.branch,
          branchLabel,
          missingOptions: missing.map((o) => o.display_label),
        });
      }
    };

    (payload.data.part2_common_questions || []).forEach((q) => checkP2(q, 'Phần chung'));

    if (isBoth) {
      (payload.data.part2_branches?.CS || []).forEach((q) => checkP2(q, 'Khoa học Máy tính (CS)'));
      (payload.data.part2_branches?.ICT || []).forEach((q) => checkP2(q, 'Tin học Ứng dụng (ICT)'));
    } else if (selectedBranch === 'CS') {
      (payload.data.part2_branches?.CS || []).forEach((q) => checkP2(q, 'Khoa học Máy tính (CS)'));
    } else if (selectedBranch === 'ICT') {
      (payload.data.part2_branches?.ICT || []).forEach((q) => checkP2(q, 'Tin học Ứng dụng (ICT)'));
    }

    const isComplete = incompleteP1.length === 0 && incompleteP2.length === 0;
    return {
      isComplete,
      needsBranchSelection: false,
      incompleteP1,
      incompleteP2,
    };
  }, [payload, selectedBranch, part1Answers, part2Answers]);

  const scrollToQuestion = (questionId: number) => {
    setShowIncompleteModal(false);
    setShowSubmitModal(false);
    const el = document.getElementById(`question-${questionId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedQuestionId(questionId);
      setTimeout(() => {
        setHighlightedQuestionId((prev) => (prev === questionId ? null : prev));
      }, 3500);
    }
  };

  const handleOpenSubmitModal = useCallback(() => {
    const report = validateCompletion();
    if (report.needsBranchSelection) {
      setShowBranchModal(true);
      return;
    }
    if (!report.isComplete) {
      setIncompleteReport({
        incompleteP1: report.incompleteP1,
        incompleteP2: report.incompleteP2,
      });
      setShowIncompleteModal(true);
      return;
    }
    setShowSubmitModal(true);
  }, [validateCompletion]);

  // Ref to safely exit fullscreen on exam submit or unmount
  const exitFullscreenRef = React.useRef<() => Promise<void>>(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (e) {}
  });

  // Ensure fullscreen is cleared if student navigates away or unmounts
  useEffect(() => {
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  // Final Submit Handler
  const handleSubmitExam = useCallback(
    async (isAutoSubmit: boolean = false) => {
      if (!payload || isSubmitting) return;

      if (!isAutoSubmit) {
        const report = validateCompletion();
        if (!report.isComplete) {
          setShowSubmitModal(false);
          setIncompleteReport({
            incompleteP1: report.incompleteP1,
            incompleteP2: report.incompleteP2,
          });
          setShowIncompleteModal(true);
          return;
        }
      }

      setIsSubmitting(true);
      const isBoth = payload.data.exam.branch_mode === 'BOTH' || selectedBranch === 'BOTH';
      const effectiveBranch = isBoth ? 'BOTH' : (selectedBranch === 'NONE' ? 'CS' : selectedBranch);

      if (isPreview) {
        // Calculate simulated score locally without writing to backend
        let p1Points = 0;
        let p1Max = 0;
        let p1Correct = 0;
        const p1Total = (payload.data.part1_questions || []).length;

        (payload.data.part1_questions || []).forEach((q) => {
          const qPoint = Number(q.point !== undefined && q.point !== null ? q.point : 0.5);
          p1Max += qPoint;
          const userOptId = part1Answers[q.id];
          const correctOpt = q.options.find((o) => o.is_correct === true);
          if (userOptId && correctOpt && userOptId === correctOpt.id) {
            p1Points += qPoint;
            p1Correct += 1;
          }
        });

        let p2Points = 0;
        let p2Max = 0;
        let p2SubCorrect = 0;
        let p2SubTotal = 0;

        const scoreP2Question = (q: QuestionMasked) => {
          const qPoint = Number(q.point !== undefined && q.point !== null ? q.point : 2.0);
          p2Max += qPoint;
          const userMap = part2Answers[q.id] || {};
          let correctCountInQ = 0;
          q.options.forEach((opt) => {
            p2SubTotal += 1;
            const userVal = userMap[String(opt.id)];
            if (typeof userVal === 'boolean' && opt.is_correct !== undefined && userVal === opt.is_correct) {
              correctCountInQ += 1;
              p2SubCorrect += 1;
            }
          });
          if (correctCountInQ === 1) p2Points += qPoint * 0.1;
          else if (correctCountInQ === 2) p2Points += qPoint * 0.25;
          else if (correctCountInQ === 3) p2Points += qPoint * 0.5;
          else if (correctCountInQ === 4) p2Points += qPoint * 1.0;
        };

        (payload.data.part2_common_questions || []).forEach(scoreP2Question);

        if (isBoth) {
          (payload.data.part2_branches?.CS || []).forEach(scoreP2Question);
          (payload.data.part2_branches?.ICT || []).forEach(scoreP2Question);
        } else if (selectedBranch === 'CS') {
          (payload.data.part2_branches?.CS || []).forEach(scoreP2Question);
        } else if (selectedBranch === 'ICT') {
          (payload.data.part2_branches?.ICT || []).forEach(scoreP2Question);
        }

        const round2 = (num: number) => Math.round(num * 100) / 100;
        setSimulatedScore({
          totalScore: round2(p1Points + p2Points),
          maxScore: round2(p1Max + p2Max),
          p1Score: round2(p1Points),
          p2Score: round2(p2Points),
          p1Correct,
          p1Total,
          p2SubCorrect,
          p2SubTotal,
        });
        setShowSubmitModal(false);
        setShowSimulatedResultModal(true);
        setIsSubmitting(false);
        return;
      }

      const part1Formatted = Object.entries(part1Answers).map(([qId, optId]) => ({
        question_id: Number(qId),
        selected_option_id: optId,
      }));

      const part2Formatted = Object.entries(part2Answers).map(([qId, subMap]) => ({
        question_id: Number(qId),
        sub_answers: subMap,
      }));

      try {
        const res = await assessmentApi.submitExam(payload.session_id, {
          part1_answers: part1Formatted,
          part2_answers: part2Formatted,
          selected_branch: effectiveBranch as any,
        });

        // Clean up cache
        localStorage.removeItem(`exam_cache_${payload.session_id}`);
        // Thoát chế độ toàn màn hình an toàn sau khi nộp bài
        await exitFullscreenRef.current();
        navigate(`/result/${res.session_id}`);
      } catch (err: any) {
        console.error('Submit error:', err);
        await exitFullscreenRef.current();
        navigate(`/result/${payload.session_id}`);
      } finally {
        setIsSubmitting(false);
      }
    },
    [payload, isSubmitting, isPreview, part1Answers, part2Answers, selectedBranch, navigate, validateCompletion]
  );

  // Anti-Cheat Handlers
  const handleViolation = useCallback(
    async (type: string, details?: string) => {
      if (isPreview || !payload) return;

      const part1Formatted = Object.entries(part1Answers).map(([qId, optId]) => ({
        question_id: Number(qId),
        selected_option_id: optId,
      }));

      const part2Formatted = Object.entries(part2Answers).map(([qId, subMap]) => ({
        question_id: Number(qId),
        sub_answers: subMap,
      }));

      try {
        const res = await assessmentApi.logViolation(payload.session_id, type, details, {
          part1_answers: part1Formatted,
          part2_answers: part2Formatted,
        });

        if (res.is_auto_locked) {
          localStorage.removeItem(`exam_cache_${payload.session_id}`);
          await exitFullscreenRef.current();
          navigate(`/result/${payload.session_id}`);
        }
      } catch (err) {
        console.error('Failed to log violation:', err);
      }
    },
    [payload, isPreview, part1Answers, part2Answers, navigate]
  );

  const handleMaxViolationsReached = useCallback(() => {
    handleSubmitExam(true);
  }, [handleSubmitExam]);

  const {
    violationCount,
    showWarningModal,
    warningMessage,
    requestFullscreen,
    exitFullscreen,
    closeWarningModal,
  } = useAntiCheat({
    enabled: hasStarted && !isPreview,
    maxViolations: payload?.max_tab_violations || 3,
    onViolation: handleViolation,
    onMaxViolationsReached: handleMaxViolationsReached,
  });

  exitFullscreenRef.current = exitFullscreen;

  // Countdown Timer
  const { formattedTime, isUrgent } = useExamTimer({
    initialMinutes: payload?.data?.exam?.duration_minutes || 45,
    startTimeIso: payload?.start_time || '',
    onTimeUp: () => {
      alert('Hết giờ làm bài! Hệ thống đang tự động thu bài của bạn.');
      handleSubmitExam();
    },
  });

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid triggering when user is typing in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Escape') {
        setShowSimulatedResultModal(false);
        setShowBranchModal(false);
        setShowSubmitModal(false);
        setShowIncompleteModal(false);
        setDisputeQuestion(null);
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      } else if (['a', 'b', 'c', 'd'].includes(e.key.toLowerCase())) {
        const hoveredOrFocused = document.querySelector('[id^="question-"]:hover') || document.activeElement?.closest('[id^="question-"]');
        if (hoveredOrFocused) {
          const qIdMatch = hoveredOrFocused.id.match(/^question-(\d+)$/);
          if (qIdMatch) {
            const options = Array.from(hoveredOrFocused.querySelectorAll('div[role="button"]'));
            const keyMap: Record<string, number> = { 'a': 0, 'b': 1, 'c': 2, 'd': 3 };
            const idx = keyMap[e.key.toLowerCase()];
            if (idx !== undefined && options[idx]) {
               (options[idx] as HTMLElement).click();
            }
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleStartExamClick = async () => {
    setHasStarted(true);
    if (!isPreview) {
      await requestFullscreen();
    }
  };

  const handleConfirmBranch = async () => {
    if (!payload) return;
    if (isPreview) {
      setSelectedBranch(pendingBranchChoice);
      setShowBranchModal(false);
      return;
    }
    try {
      await assessmentApi.selectBranch(payload.session_id, pendingBranchChoice);
      setSelectedBranch(pendingBranchChoice);
      setShowBranchModal(false);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Không thể chọn nhánh này.');
    }
  };

  if (loadError) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl border border-red-500/40 bg-slate-950 p-6 sm:p-8 shadow-2xl text-center space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white">Không Thể Mở Đề Thi</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{loadError}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <Link
              to="/"
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-blue-500/40 bg-blue-950/60 px-4 py-2.5 text-xs font-bold text-blue-300 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
              title="Về Trang Chủ hệ thống"
            >
              <Home className="h-4 w-4" />
              Trang Chủ
            </Link>
            <button
              type="button"
              onClick={() => navigate(isPreviewParam ? '/teacher' : user?.role === 'STUDENT' ? '/dashboard' : '/teacher')}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-500 transition-colors shadow-sm"
            >
              Thử Lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || !payload) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-300">
        <div className="text-center space-y-3">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="text-sm font-semibold">Đang chuẩn bị đề thi an toàn...</p>
        </div>
      </div>
    );
  }

  // Pre-Exam Instruction Screen
  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full rounded-3xl border border-slate-800 bg-slate-950 p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2 border-b border-slate-800 pb-5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-400 border border-blue-500/20">
              <Shield className="h-3.5 w-3.5" /> Chế độ Phòng thi Chống Gian lận HSG
            </span>
            <h2 className="text-2xl font-extrabold text-white">{payload.data.exam.title}</h2>
            <p className="text-xs text-slate-400">
              Thời gian làm bài: <strong>{payload.data.exam.duration_minutes} phút</strong> • Thí sinh: <strong>{user?.full_name || user?.username}</strong>
            </p>
          </div>

          <div className="space-y-3 text-xs text-slate-300">
            <h4 className="font-bold text-slate-100 uppercase tracking-wider text-xs">
              Quy chế thi trực tuyến & Giám sát:
            </h4>
            <ul className="space-y-2.5 list-disc list-inside text-slate-300 leading-relaxed bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
              <li>Màn hình thi sẽ tự động chuyển sang <strong>Toàn màn hình (Fullscreen)</strong>.</li>
              <li>
                <span className="text-red-400 font-semibold">Tuyệt đối không chuyển tab, thu nhỏ hoặc mở ứng dụng khác</span>. Hệ thống giám sát realtime và tự động nộp bài khi vi phạm quá <strong>{payload.max_tab_violations} lần</strong>.
              </li>
              <li>Màn hình thi có <strong>Watermark bảo mật chìm</strong> mang tên và SBD của thí sinh chống chụp trộm màn hình.</li>
              {payload.data.exam.branch_mode === 'BOTH' ? (
                <li>Ở <strong>Phần II</strong>, bạn được làm <strong>toàn bộ câu hỏi của cả hai chuyên đề</strong>: Khoa học máy tính (CS) và Tin học ứng dụng (ICT) (thời gian làm bài giữ nguyên).</li>
              ) : (
                <li>Ở <strong>Phần II</strong>, bạn sẽ chọn 1 trong 2 nhánh: <strong>Khoa học máy tính (CS)</strong> hoặc <strong>Tin học ứng dụng (ICT)</strong>. Lựa chọn này là cố định và không thể thay đổi sau khi xác nhận.</li>
              )}
              <li><span className="text-amber-400 font-bold">Quy chế nộp bài:</span> Bạn phải điền đầy đủ đáp án cho tất cả các câu Phần I và chọn Đúng/Sai cho toàn bộ các ý Phần II trước khi được nộp bài.</li>
              <li>Tiến độ làm bài được <strong>tự động lưu liên tục</strong>, an toàn tuyệt đối ngay cả khi mạng chập chờn.</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Link
                to="/"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-2xl border border-blue-500/40 bg-blue-950/60 py-3.5 px-4 font-bold text-xs text-blue-300 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                title="Về Trang Chủ hệ thống"
              >
                <Home className="h-4 w-4" />
                Trang Chủ
              </Link>
              <button
                type="button"
                onClick={() => navigate(isPreviewParam ? '/teacher' : user?.role === 'STUDENT' ? '/dashboard' : '/teacher')}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-2xl border border-slate-800 bg-slate-900 py-3.5 px-4 font-semibold text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
              >
                Dashboard
              </button>
            </div>
            <button
              onClick={handleStartExamClick}
              className="w-full sm:flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-4 px-6 font-bold text-sm text-white shadow-xl shadow-blue-600/30 hover:from-blue-500 hover:to-indigo-500 transition-all"
            >
              <Maximize className="h-4 w-4" />
              Bắt Đầu Làm Bài Thi Ngay
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isBothMode = payload.data.exam.branch_mode === 'BOTH' || selectedBranch === 'BOTH';
  const { part1_questions, part2_branches } = payload.data;
  const part2_common_questions = payload.data.part2_common_questions || [];
  const part2_cs_questions = part2_branches?.CS || [];
  const part2_ict_questions = part2_branches?.ICT || [];

  const currentPart2BranchQuestions =
    selectedBranch === 'CS'
      ? part2_cs_questions
      : selectedBranch === 'ICT'
      ? part2_ict_questions
      : [];

  const answeredPart1Count = Object.keys(part1Answers).length;
  const totalPart1Count = part1_questions.length;
  
  // A Part 2 question is strictly fully answered if ALL its options have been assigned boolean values
  const isP2FullyAnswered = (q: QuestionMasked) => {
    const ans = part2Answers[q.id];
    if (!ans) return false;
    return q.options.length > 0 && q.options.every((opt) => typeof ans[String(opt.id)] === 'boolean');
  };

  const answeredPart2CommonCount = part2_common_questions.filter(isP2FullyAnswered).length;
  const answeredPart2CsCount = part2_cs_questions.filter(isP2FullyAnswered).length;
  const answeredPart2IctCount = part2_ict_questions.filter(isP2FullyAnswered).length;

  const totalPart2Count = isBothMode
    ? part2_common_questions.length + part2_cs_questions.length + part2_ict_questions.length
    : part2_common_questions.length + currentPart2BranchQuestions.length;

  const answeredPart2Count = isBothMode
    ? answeredPart2CommonCount + answeredPart2CsCount + answeredPart2IctCount
    : answeredPart2CommonCount + (selectedBranch === 'CS' ? answeredPart2CsCount : selectedBranch === 'ICT' ? answeredPart2IctCount : 0);

  const totalAnswered = answeredPart1Count + answeredPart2Count;
  const totalQuestions = totalPart1Count + totalPart2Count;
  const progressPct = totalQuestions > 0 ? Math.round((totalAnswered / totalQuestions) * 100) : 0;

  const answeredPart2BranchCount =
    selectedBranch === 'CS' ? answeredPart2CsCount : selectedBranch === 'ICT' ? answeredPart2IctCount : 0;

  const renderP2PaletteButton = (q: QuestionMasked) => {
    const answeredSubCount = (q.options || []).filter(
      (opt) => typeof part2Answers[q.id]?.[String(opt.id)] === 'boolean'
    ).length;
    const isFully = q.options.length > 0 && answeredSubCount === q.options.length;
    const isPartial = answeredSubCount > 0 && !isFully;
    const isFlagged = flaggedQuestions.has(q.id);

    if (paletteFilter === 'ANSWERED' && !isFully) return null;
    if (paletteFilter === 'UNANSWERED' && isFully) return null;
    if (paletteFilter === 'FLAGGED' && !isFlagged) return null;

    return (
      <button
        key={q.id}
        onClick={() => scrollToQuestion(q.id)}
        title={`Câu ${q.display_number}: ${
          isFully
            ? 'Đã chọn đủ tất cả các ý Đúng/Sai'
            : isPartial
            ? `Chưa hoàn thành: mới chọn ${answeredSubCount}/${q.options.length} ý`
            : 'Chưa làm'
        }`}
        className={`relative flex h-10 w-10 flex-col items-center justify-center rounded-xl font-bold text-xs transition-all ${
          isFlagged
            ? 'bg-amber-400 text-slate-950 shadow-sm ring-2 ring-amber-400/50'
            : isFully
            ? 'bg-indigo-600 text-white shadow-sm'
            : isPartial
            ? 'border-2 border-indigo-400 bg-indigo-50 text-indigo-700 font-extrabold shadow-sm'
            : 'border border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-400'
        }`}
      >
        <span className={isPartial ? 'text-[10px] -mt-0.5' : ''}>{q.display_number}</span>
        {isPartial && (
          <span className="text-[10px] leading-none text-indigo-600 font-bold">
            {answeredSubCount}/{q.options.length}
          </span>
        )}
        {isFlagged && (
          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-600 ring-1 ring-white" />
        )}
      </button>
    );
  };


  const renderPaletteContent = () => (
    <div className="sticky top-20 rounded-3xl border border-slate-200 bg-white p-5 shadow-lg space-y-5">
            {/* Header with Progress */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  Bảng Điều Hướng Câu Hỏi
                </h3>
                <span className="font-mono text-xs font-bold text-blue-600">
                  {totalAnswered}/{totalQuestions} ({progressPct}%)
                </span>
              </div>

              {/* Filter Tabs */}
              <div className="grid grid-cols-4 gap-1 mt-3 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setPaletteFilter('ALL')}
                  className={`py-1.5 rounded-lg transition-all ${
                    paletteFilter === 'ALL'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setPaletteFilter('ANSWERED')}
                  className={`py-1.5 rounded-lg transition-all ${
                    paletteFilter === 'ANSWERED'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Đã làm
                </button>
                <button
                  type="button"
                  onClick={() => setPaletteFilter('UNANSWERED')}
                  className={`py-1.5 rounded-lg transition-all ${
                    paletteFilter === 'UNANSWERED'
                      ? 'bg-slate-400 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Chưa
                </button>
                <button
                  type="button"
                  onClick={() => setPaletteFilter('FLAGGED')}
                  className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-0.5 ${
                    paletteFilter === 'FLAGGED'
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-500" />
                  <span>({flaggedQuestions.size})</span>
                </button>
              </div>
            </div>

            {/* Part 1 Question Numbers */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-blue-600 flex items-center justify-between">
                <span>Phần I ({totalPart1Count} câu)</span>
                <span>{answeredPart1Count}/{totalPart1Count}</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {part1_questions.map((q) => {
                  const isAnswered = part1Answers[q.id] !== undefined;
                  const isFlagged = flaggedQuestions.has(q.id);

                  if (paletteFilter === 'ANSWERED' && !isAnswered) return null;
                  if (paletteFilter === 'UNANSWERED' && isAnswered) return null;
                  if (paletteFilter === 'FLAGGED' && !isFlagged) return null;

                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        const el = document.getElementById(`question-${q.id}`);
                        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      className={`relative flex h-10 w-10 items-center justify-center rounded-xl font-bold text-xs transition-all ${
                        isFlagged
                          ? 'bg-amber-400 text-slate-950 shadow-sm ring-2 ring-amber-400/50'
                          : isAnswered
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'border border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-400'
                      }`}
                    >
                      {q.display_number}
                      {isFlagged && (
                        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-600 ring-1 ring-white" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Part 2 Common Question Numbers */}
            {part2_common_questions.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="text-[11px] font-bold text-indigo-600 flex items-center justify-between">
                  <span>Phần II - Chung ({part2_common_questions.length} câu)</span>
                  <span>{answeredPart2CommonCount}/{part2_common_questions.length}</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {part2_common_questions.map((q) => renderP2PaletteButton(q))}
                </div>
              </div>
            )}

            {/* Part 2 Branch Question Numbers */}
            {isBothMode ? (
              <>
                {part2_cs_questions.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="text-[11px] font-bold text-indigo-600 flex items-center justify-between">
                      <span>Phần II - CS ({part2_cs_questions.length} câu)</span>
                      <span>{answeredPart2CsCount}/{part2_cs_questions.length}</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {part2_cs_questions.map((q) => renderP2PaletteButton(q))}
                    </div>
                  </div>
                )}
                {part2_ict_questions.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="text-[11px] font-bold text-indigo-600 flex items-center justify-between">
                      <span>Phần II - ICT ({part2_ict_questions.length} câu)</span>
                      <span>{answeredPart2IctCount}/{part2_ict_questions.length}</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {part2_ict_questions.map((q) => renderP2PaletteButton(q))}
                    </div>
                  </div>
                )}
              </>
            ) : selectedBranch !== 'NONE' ? (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="text-[11px] font-bold text-indigo-600 flex items-center justify-between">
                  <span>Phần II - {selectedBranch} ({currentPart2BranchQuestions.length} câu)</span>
                  <span>{answeredPart2BranchCount}/{currentPart2BranchQuestions.length}</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {currentPart2BranchQuestions.map((q) => renderP2PaletteButton(q))}
                </div>
              </div>
            ) : null}

            {/* Submit Action */}
            <button
              onClick={handleOpenSubmitModal}
              className="w-full mt-4 flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition-all"
            >
              <Send className="h-4 w-4" />
              Nộp Bài Thi
            </button>
          </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col exam-secure-mode select-none relative">
      {/* Teacher Inspection Preview Banner */}
      {isPreview && (
        <div className="sticky top-0 z-50 bg-gradient-to-r from-emerald-800 via-teal-800 to-indigo-900 text-white px-4 sm:px-6 py-2.5 shadow-md flex items-center justify-between flex-wrap gap-2.5 text-xs border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1.5 bg-amber-400 text-slate-950 font-extrabold px-3 py-1 rounded-xl shadow-xs text-[11px] uppercase tracking-wide">
              <Eye className="h-3.5 w-3.5" /> Chế độ Xem Trước (Giáo Viên)
            </span>
            <span className="hidden lg:inline text-white/90 text-xs">
              Quan sát giao diện chuẩn học sinh • Không tính điểm • Không ghi nhận gian lận
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Toggle Answer Key Button */}
            <button
              type="button"
              onClick={() => setShowAnswerKey(!showAnswerKey)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all shadow-sm ${
                showAnswerKey
                  ? 'bg-amber-300 text-slate-950 ring-2 ring-white/50'
                  : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
              title="Bật/Tắt hiển thị đáp án đúng và lời giải chi tiết cho tất cả câu hỏi"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-200" />
              <span>{showAnswerKey ? 'Ẩn đáp án & Lời giải' : 'Hiện đáp án & Lời giải'}</span>
            </button>

            {/* Quick Branch Switching in Preview */}
            {!isBothMode && (
              <div className="flex items-center rounded-xl bg-black/30 p-0.5 border border-white/15 text-[11px]">
                <button
                  type="button"
                  onClick={() => setSelectedBranch('CS')}
                  className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                    selectedBranch === 'CS'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  Nhánh CS
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBranch('ICT')}
                  className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                    selectedBranch === 'ICT'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  Nhánh ICT
                </button>
              </div>
            )}

            {/* Exit Preview & Home Links */}
            <Link
              to="/"
              className="flex items-center gap-1 rounded-xl bg-blue-600/60 hover:bg-blue-600 px-3 py-1.5 font-bold text-white transition-all shadow-sm"
              title="Về Trang Chủ hệ thống"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Trang Chủ</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate('/teacher');
                }
              }}
              className="flex items-center gap-1 rounded-xl bg-white/20 hover:bg-white/30 px-3 py-1.5 font-bold text-white transition-all shadow-sm"
              title="Thoát xem trước và quay lại trang quản lý"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Thoát xem trước</span>
            </button>
          </div>
        </div>
      )}

      {/* Anti-Screen Capture Watermark */}
      <ExamWatermark
        studentName={isPreview ? `[XEM TRƯỚC] ${user?.full_name || user?.username || 'Giáo viên'}` : (user?.full_name || user?.username || 'Thí sinh HSG')}
        studentId={isPreview ? 'GIAO-VIEN-PREVIEW' : (user?.student_id || 'QL-2025')}
        sessionId={payload.session_id}
      />

      {/* Network Offline Alert Banner */}
      {!isOnline && (
        <div className="bg-red-600 text-white px-4 py-2.5 text-center text-xs font-bold flex items-center justify-center gap-2 shadow-lg sticky top-0 z-50 animate-pulse">
          <WifiOff className="h-4 w-4 shrink-0" />
          <span>⚠️ Đang mất kết nối mạng - Vui lòng không tải lại trang! Các câu trả lời của bạn vẫn đang được lưu an toàn trên máy.</span>
        </div>
      )}

      {/* Network Online Restored Toast */}
      {showOnlineRestoredToast && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-center text-xs font-bold flex items-center justify-center gap-2 shadow-lg sticky top-0 z-50 animate-in fade-in">
          <Wifi className="h-4 w-4 shrink-0" />
          <span>🟢 Đã khôi phục kết nối mạng! Dữ liệu bài làm đã được đồng bộ an toàn lên máy chủ.</span>
        </div>
      )}

      {/* Top Lockdown Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm px-4 sm:px-6 py-2.5">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-3">
          {/* Brand & Title */}
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-sm text-sm shrink-0">
              THPT
            </span>
            <div className="truncate max-w-xs sm:max-w-sm md:max-w-md">
              <h1 className="font-bold text-sm text-slate-900 truncate">
                {payload.data.exam.title}
              </h1>
              <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                <span>{isPreview ? (user?.full_name || user?.username || 'Giáo viên') : (user?.full_name || user?.username)}</span>
                <span>• SBD: {isPreview ? 'GV-XEMTRUOC' : (user?.student_id || 'QL-HSG')}</span>
                {selectedBranch === 'BOTH' ? (
                  <span className="text-indigo-600 font-bold">• Chuyên đề: Cả CS & ICT</span>
                ) : selectedBranch !== 'NONE' ? (
                  <span className="text-indigo-600 font-bold">• Nhánh: {selectedBranch}</span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Controls: Zoom, Violations, Timer, Submit */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Font Size Zoom Controls */}
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => setFontSize('sm')}
                className={`px-2 py-1.5 rounded-lg transition-all ${
                  fontSize === 'sm' ? 'bg-white text-blue-600 shadow-sm font-bold' : 'hover:text-slate-900'
                }`}
                title="Cỡ chữ nhỏ"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => setFontSize('md')}
                className={`px-2 py-1.5 rounded-lg transition-all ${
                  fontSize === 'md' ? 'bg-white text-blue-600 shadow-sm font-bold' : 'hover:text-slate-900'
                }`}
                title="Cỡ chữ vừa"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setFontSize('lg')}
                className={`px-2 py-1.5 rounded-lg transition-all ${
                  fontSize === 'lg' ? 'bg-white text-blue-600 shadow-sm font-bold' : 'hover:text-slate-900'
                }`}
                title="Cỡ chữ lớn"
              >
                A+
              </button>
            </div>

            {/* Server Sync / Offline Indicator */}
            {!isPreview && (
              <div
                className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all ${
                  !isOnline
                    ? 'border-red-300 bg-red-50 text-red-700 animate-pulse'
                    : isSyncing
                    ? 'border-amber-300 bg-amber-50 text-amber-700'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                }`}
              >
                {!isOnline ? (
                  <>
                    <WifiOff className="h-3.5 w-3.5 text-red-600" />
                    <span>🔴 Mất mạng (Lưu cục bộ)</span>
                  </>
                ) : isSyncing ? (
                  <>
                    <CloudUpload className="h-3.5 w-3.5 text-amber-600 animate-bounce" />
                    <span>Đang lưu lên máy chủ...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>🟢 Đã lưu lên máy chủ</span>
                  </>
                )}
              </div>
            )}

            {/* Violation Badge or Preview Immunity */}
            {isPreview ? (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 text-xs font-bold">
                <Shield className="h-3.5 w-3.5" />
                <span>Miễn giám sát (Xem trước)</span>
              </div>
            ) : (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors ${
                  violationCount > 0
                    ? 'border-red-300 bg-red-50 text-red-700 animate-bounce'
                    : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}
              >
                <Shield className="h-3.5 w-3.5" />
                <span>Vi phạm: {violationCount}/{payload.max_tab_violations}</span>
              </div>
            )}

            {/* Timer */}
            <div
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-mono text-sm font-bold shadow-sm ${
                isUrgent
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-slate-900 text-white'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>{formattedTime}</span>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleOpenSubmitModal}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition-all"
            >
              <Send className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{isPreview ? 'Nộp Thử' : 'Nộp Bài'}</span>
            </button>
          </div>
        </div>

        {/* Realtime Progress Bar */}
        <div className="max-w-[1600px] mx-auto mt-2">
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300 rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main Examination Layout */}
      <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 py-6 flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Questions Column */}
        <main className="lg:col-span-3 space-y-8">
          {/* SECTION 1: PHẦN I */}
          <section className="space-y-5" id="section-part1">
            <div className="flex items-center justify-between border-b-2 border-blue-600 pb-2.5">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-600" />
                <h2 className="font-bold text-lg text-slate-900">
                  PHẦN I: TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN
                </h2>
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-xl border border-blue-100">
                {totalPart1Count} Câu • 0.4đ/câu
              </span>
            </div>

            <div className="space-y-6">
              {part1_questions.map((q) => (
                <div
                  key={q.id}
                  id={`question-${q.id}`}
                  className={`transition-all duration-300 ${
                    highlightedQuestionId === q.id ? 'ring-4 ring-amber-400 rounded-3xl animate-pulse' : ''
                  }`}
                >
                  <QuestionCardPart1
                    question={q}
                    selectedOptionId={part1Answers[q.id] || null}
                    onSelectOption={(questionId, optionId) => {
                      setPart1Answers((prev) => ({ ...prev, [questionId]: optionId }));
                    }}
                    isFlagged={flaggedQuestions.has(q.id)}
                    onToggleFlag={handleToggleFlag}
                    onReportQuestion={(question) => setDisputeQuestion({ id: question.id, number: question.display_number, content: question.content })}
                    eliminatedOptionIds={eliminatedOptions[q.id] || []}
                    onToggleEliminate={handleToggleEliminate}
                    fontSize={fontSize}
                    allowRunCode={payload.data.exam.allow_run_code ?? true}
                    showAnswerKey={showAnswerKey}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 2: PHẦN II (ĐÚNG / SAI) */}
          <section className="space-y-6 pt-6" id="section-part2">
            <div className="flex items-center justify-between border-b-2 border-indigo-600 pb-2.5">
              <div className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-indigo-600" />
                <h2 className="font-bold text-lg text-slate-900">
                  PHẦN II: CÂU TRẮC NGHIỆM ĐÚNG / SAI
                </h2>
              </div>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-100">
                Ma trận: 1=0.3đ • 2=0.6đ • 3=1.0đ • 4=1.5đ
              </span>
            </div>

            {/* Mục A: Phần Chung (cho tất cả thí sinh) */}
            {part2_common_questions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 border border-slate-200">
                  <Layers className="h-4 w-4 text-indigo-600" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                    Mục A. Phần Chung cho tất cả các thí sinh ({part2_common_questions.length} câu)
                  </h3>
                </div>

                {part2_common_questions.map((q) => (
                  <div
                    key={q.id}
                    id={`question-${q.id}`}
                    className={`transition-all duration-300 ${
                      highlightedQuestionId === q.id ? 'ring-4 ring-amber-400 rounded-3xl animate-pulse' : ''
                    }`}
                  >
                    <QuestionCardPart2
                      question={q}
                      subAnswers={part2Answers[q.id] || {}}
                      onSelectSubAnswer={(questionId, optionId, val) => {
                        setPart2Answers((prev) => ({
                          ...prev,
                          [questionId]: {
                            ...(prev[questionId] || {}),
                            [String(optionId)]: val,
                          },
                        }));
                      }}
                      isFlagged={flaggedQuestions.has(q.id)}
                      onToggleFlag={handleToggleFlag}
                      onReportQuestion={(question) => setDisputeQuestion({ id: question.id, number: question.display_number, content: question.content })}
                      fontSize={fontSize}
                      allowRunCode={payload.data.exam.allow_run_code ?? true}
                      showAnswerKey={showAnswerKey}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Mục B & C: Phân nhánh Chuyên đề (CS và ICT) */}
            {selectedBranch === 'BOTH' ? (
              <div className="space-y-8 pt-2">
                <div className="flex items-center justify-between rounded-2xl bg-indigo-50 border border-indigo-200 p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-6 w-6 text-indigo-600 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-indigo-950 uppercase">
                        Bạn đang làm cả hai chuyên đề: Khoa học Máy tính (CS) & Tin học Ứng dụng (ICT)
                      </span>
                      <p className="text-[11px] text-indigo-700 font-medium">
                        Quy chế thi yêu cầu làm đầy đủ tất cả câu hỏi của cả hai chuyên đề (thời gian làm bài giữ nguyên).
                      </p>
                    </div>
                  </div>
                </div>

                {/* CS Branch */}
                {part2_cs_questions.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 border border-blue-100">
                      <Cpu className="h-4 w-4 text-blue-600" />
                      <h3 className="font-bold text-xs uppercase tracking-wider text-blue-900">
                        Mục B. Chuyên đề Khoa học Máy tính (CS) ({part2_cs_questions.length} câu)
                      </h3>
                    </div>

                    {part2_cs_questions.map((q) => (
                      <div
                        key={q.id}
                        id={`question-${q.id}`}
                        className={`transition-all duration-300 ${
                          highlightedQuestionId === q.id ? 'ring-4 ring-amber-400 rounded-3xl animate-pulse' : ''
                        }`}
                      >
                        <QuestionCardPart2
                          question={q}
                          subAnswers={part2Answers[q.id] || {}}
                          onSelectSubAnswer={(questionId, optionId, val) => {
                            setPart2Answers((prev) => ({
                              ...prev,
                              [questionId]: {
                                ...(prev[questionId] || {}),
                                [String(optionId)]: val,
                              },
                            }));
                          }}
                          isFlagged={flaggedQuestions.has(q.id)}
                          onToggleFlag={handleToggleFlag}
                          onReportQuestion={(question) => setDisputeQuestion({ id: question.id, number: question.display_number, content: question.content })}
                          fontSize={fontSize}
                          allowRunCode={payload.data.exam.allow_run_code ?? true}
                          showAnswerKey={showAnswerKey}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* ICT Branch */}
                {part2_ict_questions.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 rounded-xl bg-purple-50 px-4 py-2 border border-purple-100">
                      <Globe className="h-4 w-4 text-purple-600" />
                      <h3 className="font-bold text-xs uppercase tracking-wider text-purple-900">
                        Mục C. Chuyên đề Tin học Ứng dụng (ICT) ({part2_ict_questions.length} câu)
                      </h3>
                    </div>

                    {part2_ict_questions.map((q) => (
                      <div
                        key={q.id}
                        id={`question-${q.id}`}
                        className={`transition-all duration-300 ${
                          highlightedQuestionId === q.id ? 'ring-4 ring-amber-400 rounded-3xl animate-pulse' : ''
                        }`}
                      >
                        <QuestionCardPart2
                          question={q}
                          subAnswers={part2Answers[q.id] || {}}
                          onSelectSubAnswer={(questionId, optionId, val) => {
                            setPart2Answers((prev) => ({
                              ...prev,
                              [questionId]: {
                                ...(prev[questionId] || {}),
                                [String(optionId)]: val,
                              },
                            }));
                          }}
                          isFlagged={flaggedQuestions.has(q.id)}
                          onToggleFlag={handleToggleFlag}
                          onReportQuestion={(question) => setDisputeQuestion({ id: question.id, number: question.display_number, content: question.content })}
                          fontSize={fontSize}
                          allowRunCode={payload.data.exam.allow_run_code ?? true}
                          showAnswerKey={showAnswerKey}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2 border border-indigo-100">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-indigo-900">
                    Mục B. Phần Riêng Phân Hóa Chuyên Đề (CS hoặc ICT)
                  </h3>
                </div>

                {selectedBranch === 'NONE' ? (
                  <div className="rounded-3xl border-2 border-dashed border-indigo-300 bg-indigo-50/50 p-8 text-center space-y-4 shadow-inner">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg">
                      <Layers className="h-7 w-7" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Vui lòng Chọn Phân nhánh Chuyên đề Mục B
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                        Thí sinh chọn 1 trong 2 nhánh: <strong>Khoa học máy tính (CS)</strong> hoặc <strong>Tin học ứng dụng (ICT)</strong>.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowBranchModal(true)}
                      className="rounded-xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all"
                    >
                      Chọn Nhánh Chuyên Đề Ngay
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between rounded-2xl bg-indigo-50 border border-indigo-200 p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        {selectedBranch === 'CS' ? (
                          <Cpu className="h-6 w-6 text-indigo-600" />
                        ) : (
                          <Globe className="h-6 w-6 text-indigo-600" />
                        )}
                        <div>
                          <span className="text-xs font-bold text-indigo-950 uppercase">
                            Bạn đang làm nhánh:{' '}
                            {selectedBranch === 'CS'
                              ? 'Khoa học Máy tính (CS - Cấu trúc dữ liệu & Thuật toán)'
                              : 'Tin học Ứng dụng (ICT - CSDL SQL, Mạng & Bảo mật Web)'}
                          </span>
                          <p className="text-[11px] text-indigo-700 font-medium">
                            {isPreview
                              ? 'Ở chế độ xem trước, Thầy/Cô có thể tự do chuyển đổi giữa 2 nhánh CS và ICT ở thanh công cụ phía trên.'
                              : 'Lựa chọn đã được khóa cứng (Hard-lock) đảm bảo tính toàn vẹn của đề thi.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {currentPart2BranchQuestions.map((q) => (
                      <div
                        key={q.id}
                        id={`question-${q.id}`}
                        className={`transition-all duration-300 ${
                          highlightedQuestionId === q.id ? 'ring-4 ring-amber-400 rounded-3xl animate-pulse' : ''
                        }`}
                      >
                        <QuestionCardPart2
                          question={q}
                          subAnswers={part2Answers[q.id] || {}}
                          onSelectSubAnswer={(questionId, optionId, val) => {
                            setPart2Answers((prev) => ({
                              ...prev,
                              [questionId]: {
                                ...(prev[questionId] || {}),
                                [String(optionId)]: val,
                              },
                            }));
                          }}
                          isFlagged={flaggedQuestions.has(q.id)}
                          onToggleFlag={handleToggleFlag}
                          onReportQuestion={(question) => setDisputeQuestion({ id: question.id, number: question.display_number, content: question.content })}
                          fontSize={fontSize}
                          allowRunCode={payload.data.exam.allow_run_code ?? true}
                          showAnswerKey={showAnswerKey}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        </main>

        {/* Right Sidebar: Question Palette & Navigation */}
        <aside className="hidden lg:block lg:col-span-1">
          {renderPaletteContent()}
        </aside>

        {/* Mobile Floating Palette Button */}
        <button
          onClick={() => setShowMobilePalette(true)}
          className="fixed bottom-6 right-6 z-40 lg:hidden flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-white font-bold text-xs shadow-xl shadow-blue-600/30 hover:bg-blue-500 transition-all"
        >
          <LayoutGrid className="h-4 w-4" />
          <span>{totalAnswered}/{totalQuestions}</span>
        </button>

        {/* Mobile Question Palette Bottom Sheet */}
        {showMobilePalette && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowMobilePalette(false)} />
            <div className="absolute bottom-0 left-0 right-0 max-h-[75vh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl animate-in slide-in-from-bottom">
              {renderPaletteContent()}
            </div>
          </div>
        )}

      </div>

      {/* Tab Switch & Anti-Cheat Warning Modal */}
      <TabSwitchWarningModal
        isOpen={showWarningModal}
        violationCount={violationCount}
        maxViolations={payload.max_tab_violations}
        message={warningMessage}
        onAcknowledge={closeWarningModal}
      />

      {/* Branch Selection Modal (Hard-lock) */}
      {showBranchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl text-slate-100 space-y-5">
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white">
                <Cpu className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-extrabold text-white">CHỌN PHÂN NHÁNH PHẦN II</h3>
              <p className="text-xs text-amber-400 font-semibold">
                ⚠️ Lưu ý: Khi đã bấm xác nhận, hệ thống sẽ KHÓA CỨNG phân nhánh này cho cả bài thi!
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPendingBranchChoice('CS')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  pendingBranchChoice === 'CS'
                    ? 'border-indigo-500 bg-indigo-600/20 text-white ring-2 ring-indigo-500'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm text-indigo-300 mb-1">
                  <Cpu className="h-4 w-4" />
                  Khoa học Máy tính (CS)
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Thuật toán Đồ thị, Quy hoạch động, Độ phức tạp và Cấu trúc Dữ liệu nâng cao.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPendingBranchChoice('ICT')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  pendingBranchChoice === 'ICT'
                    ? 'border-indigo-500 bg-indigo-600/20 text-white ring-2 ring-indigo-500'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm text-indigo-300 mb-1">
                  <Globe className="h-4 w-4" />
                  Tin học Ứng dụng (ICT)
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Cơ sở dữ liệu SQL, Mạng máy tính & Bảo mật Web, Ứng dụng Đa phương tiện.
                </p>
              </button>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowBranchModal(false)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                Để Sau
              </button>
              <button
                type="button"
                onClick={handleConfirmBranch}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/30"
              >
                Xác Nhận & Khóa Lựa Chọn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incomplete Submission Alert Modal */}
      {showIncompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-rose-200 bg-white p-6 sm:p-7 shadow-2xl text-slate-900 space-y-5 max-h-[90vh] flex flex-col">
            <div className="flex items-start gap-3 border-b border-slate-100 pb-4 shrink-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                  Chưa Hoàn Thành Tất Cả Các Câu Hỏi
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Theo quy định của bài thi, bạn bắt buộc phải điền đáp án cho 100% câu hỏi và chọn đầy đủ Đúng/Sai cho tất cả các ý của Phần II trước khi nộp bài.
                </p>
              </div>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
              {/* Part 1 incomplete */}
              {incompleteReport.incompleteP1.length > 0 && (
                <div className="rounded-2xl bg-rose-50/70 border border-rose-100 p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-900 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-rose-500" />
                      Phần I (Trắc nghiệm): Còn {incompleteReport.incompleteP1.length} câu chưa chọn đáp án
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {incompleteReport.incompleteP1.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => scrollToQuestion(item.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-700 font-bold hover:bg-rose-600 hover:text-white transition-all shadow-xs"
                      >
                        Câu {item.display_number}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Part 2 incomplete */}
              {incompleteReport.incompleteP2.length > 0 && (
                <div className="rounded-2xl bg-amber-50/70 border border-amber-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-950 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      Phần II (Đúng/Sai): Còn {incompleteReport.incompleteP2.length} câu chưa chọn đủ ý
                    </span>
                  </div>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {incompleteReport.incompleteP2.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => scrollToQuestion(item.id)}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-amber-200 hover:border-amber-400 cursor-pointer transition-all shadow-xs group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-xs group-hover:text-indigo-600">
                            Câu {item.display_number} ({item.branchLabel}):
                          </span>
                          <span className="text-amber-700 font-semibold text-[11px]">
                            Chưa chọn ý: <strong className="text-rose-600">{item.missingOptions.join(', ')}</strong>
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-indigo-600 group-hover:underline flex items-center gap-0.5">
                          Đến câu này <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setShowIncompleteModal(false)}
                className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
              >
                Đóng thông báo
              </button>
              <button
                type="button"
                onClick={() => {
                  const firstQId =
                    incompleteReport.incompleteP1[0]?.id || incompleteReport.incompleteP2[0]?.id;
                  if (firstQId) {
                    scrollToQuestion(firstQId);
                  } else {
                    setShowIncompleteModal(false);
                  }
                }}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
              >
                <span>Làm tiếp câu còn thiếu đầu tiên</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-900 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Xác Nhận Nộp Bài Thi</h3>
                <p className="text-xs text-slate-500">Đã hoàn thành đầy đủ 100% các câu hỏi</p>
              </div>
            </div>

            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-2.5 text-emerald-800 text-xs font-semibold">
              <Sparkles className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>Tuyệt vời! Toàn bộ câu hỏi và các ý Đúng/Sai đã được hoàn tất đầy đủ.</span>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Phần I (Trắc nghiệm):</span>
                <span className="font-bold text-blue-600">{answeredPart1Count} / {totalPart1Count} câu (100%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Phần II (Đúng/Sai):</span>
                <span className="font-bold text-indigo-600">
                  {answeredPart2Count} / {totalPart2Count} câu (100%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Phân nhánh Phần II:</span>
                <span className="font-bold text-purple-700">
                  {isBothMode ? 'Cả hai chuyên đề (CS & ICT)' : selectedBranch === 'CS' ? 'Khoa học máy tính (CS)' : 'Tin học ứng dụng (ICT)'}
                </span>
              </div>
              {flaggedQuestions.size > 0 && (
                <div className="flex justify-between text-amber-700 bg-amber-50 p-2 rounded-lg font-semibold">
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-600" /> Còn câu đang gắn cờ:
                  </span>
                  <span>{flaggedQuestions.size} câu</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-600">Thời gian còn lại:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{formattedTime}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
              >
                Tiếp tục rà soát
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmitExam()}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/30 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{isSubmitting ? 'Đang chấm bài...' : 'Chắc Chắn Nộp Bài'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulated Score Result Modal for Preview Mode */}
      {showSimulatedResultModal && simulatedScore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl text-slate-900 space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 shadow-inner">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">
                  Kết Quả Chấm Thử (Mô Phỏng)
                </h3>
                <p className="text-xs text-slate-500">Chế độ xem trước dành riêng cho Giáo viên</p>
              </div>
            </div>

            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-900 leading-relaxed">
              <span className="font-bold">Lưu ý:</span> Điểm số dưới đây được tính tự động dựa trên ma trận chuẩn của Bộ GD&ĐT (Phần I trắc nghiệm 4 lựa chọn, Phần II trắc nghiệm Đúng/Sai). Dữ liệu này <strong>hoàn toàn không được lưu</strong> vào hệ thống hay ảnh hưởng đến học sinh.
            </div>

            <div className="text-center py-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="text-4xl font-extrabold text-blue-600 font-mono">
                {simulatedScore.totalScore}{' '}
                <span className="text-lg font-normal text-slate-500">/ {simulatedScore.maxScore}</span>
              </div>
              <p className="text-xs font-semibold text-slate-500 mt-1">Tổng điểm đạt được</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-1">
                <span className="font-bold text-blue-900">Phần I (Trắc nghiệm):</span>
                <p className="text-base font-extrabold text-blue-700 font-mono">{simulatedScore.p1Score} điểm</p>
                <p className="text-[11px] text-slate-500">Đúng {simulatedScore.p1Correct}/{simulatedScore.p1Total} câu</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-1">
                <span className="font-bold text-indigo-900">Phần II (Đúng/Sai):</span>
                <p className="text-base font-extrabold text-indigo-700 font-mono">{simulatedScore.p2Score} điểm</p>
                <p className="text-[11px] text-slate-500">Đúng {simulatedScore.p2SubCorrect}/{simulatedScore.p2SubTotal} ý</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowSimulatedResultModal(false);
                  setShowAnswerKey(true);
                }}
                className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-all flex items-center gap-1.5"
              >
                <Eye className="h-4 w-4 text-slate-600" />
                <span>Xem lại bài làm & Lời giải</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (window.history.length > 1) {
                    navigate(-1);
                  } else {
                    navigate('/teacher');
                  }
                }}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-500 shadow-md shadow-blue-600/30 transition-all flex items-center gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Hoàn tất & Thoát</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question Dispute Modal */}
      {disputeQuestion && payload && (
        <QuestionDisputeModal
          isOpen={true}
          onClose={() => setDisputeQuestion(null)}
          examId={payload.data.exam.id}
          questionId={disputeQuestion.id}
          questionNumber={disputeQuestion.number}
          questionContent={disputeQuestion.content}
          sessionId={payload.session_id}
        />
      )}

      {/* Broadcast Message Toast */}
      {showBroadcastToast && broadcastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-5 duration-300">
          <div className="bg-amber-100 border border-amber-300 text-amber-900 rounded-2xl p-4 shadow-2xl shadow-amber-900/20 max-w-lg w-[90vw] flex items-start gap-3 relative">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-200">
              <AlertTriangle className="h-5 w-5 text-amber-700" />
            </div>
            <div className="flex-1 pr-6 pt-0.5">
              <h4 className="font-bold text-sm mb-0.5 text-amber-900">Thông báo từ Giám thị</h4>
              <p className="text-xs text-amber-800 leading-relaxed whitespace-pre-wrap">{broadcastMessage}</p>
            </div>
            <button 
              onClick={() => setShowBroadcastToast(false)}
              className="absolute top-2 right-2 p-1.5 hover:bg-amber-200 rounded-full text-amber-600 transition-colors"
              title="Đóng thông báo"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
