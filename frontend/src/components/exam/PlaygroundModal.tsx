import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  RotateCcw,
  Terminal,
  Database,
  Globe,
  Code2,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Table,
  AlertCircle,
  Clock,
  Cpu,
  Layers,
  Sparkles,
  Lock,
  Trash2,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CodeEditor } from '../common/CodeEditor';
import {
  PlaygroundLanguage,
  ExecutionResult,
  SQL_PRESETS,
  CODE_SAMPLES,
  executeSql,
  executeJudge0,
  buildHtmlPreviewDocument,
  initSqlEngine,
} from '../../services/codeRunner';

interface PlaygroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
  initialLanguage?: string;
  title?: string;
}

export const PlaygroundModal: React.FC<PlaygroundModalProps> = ({
  isOpen,
  onClose,
  initialCode = '',
  initialLanguage = 'python',
  title = 'Phòng Thực Hành Lập Trình (Code Playground)',
}) => {
  // Normalize initial language
  const normalizeLang = (lang: string): PlaygroundLanguage => {
    const l = lang.toLowerCase();
    if (l === 'cpp' || l === 'c++' || l === 'c') return 'cpp';
    if (l === 'sql') return 'sql';
    if (l === 'html' || l === 'css' || l === 'html-css' || l === 'markup') return 'html-css';
    return 'python';
  };

  const [activeLang, setActiveLang] = useState<PlaygroundLanguage>(() => normalizeLang(initialLanguage));
  const [code, setCode] = useState<string>(initialCode);
  const [cssCode, setCssCode] = useState<string>('');
  const [stdin, setStdin] = useState<string>('');
  const [showStdin, setShowStdin] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [sqlPreset, setSqlPreset] = useState<string>('hoc_sinh');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeHtmlTab, setActiveHtmlTab] = useState<'html' | 'css'>('html');

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Sync initial props when opened
  useEffect(() => {
    if (isOpen) {
      const normalized = normalizeLang(initialLanguage);
      setActiveLang(normalized);

      if (initialCode && initialCode.trim()) {
        if (normalized === 'html-css') {
          // If pure CSS was passed
          if (initialLanguage.toLowerCase() === 'css') {
            setCssCode(initialCode);
            setCode('<div class="box">\n  <h3>Tiêu đề mẫu</h3>\n  <p>Thực hành CSS trực tiếp</p>\n</div>');
            setActiveHtmlTab('css');
          } else {
            setCode(initialCode);
            setCssCode('/* CSS kèm theo */\nbody { padding: 15px; font-family: sans-serif; }');
            setActiveHtmlTab('html');
          }
        } else {
          setCode(initialCode);
        }
      } else {
        // Load default sample if empty
        loadSample(0, normalized);
      }
      setResult(null);
    }
  }, [isOpen, initialCode, initialLanguage]);

  if (!isOpen) return null;

  const loadSample = (index: number, lang: PlaygroundLanguage = activeLang) => {
    const samples = CODE_SAMPLES[lang];
    if (samples && samples[index]) {
      setCode(samples[index].code);
      if (lang === 'html-css' && samples[index].secondaryCode) {
        setCssCode(samples[index].secondaryCode!);
      }
      if (samples[index].stdin) {
        setStdin(samples[index].stdin!);
        setShowStdin(true);
      }
      setResult(null);
    }
  };

  const handleLanguageChange = (lang: PlaygroundLanguage) => {
    setActiveLang(lang);
    loadSample(0, lang);
    setResult(null);
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setResult(null);

    try {
      if (activeLang === 'html-css') {
        // HTML & CSS renders directly in preview
        setResult({
          success: true,
          stdout: 'Giao diện HTML & CSS đã được cập nhật thành công.',
          time: '0ms',
        });
      } else if (activeLang === 'sql') {
        const res = await executeSql(code, sqlPreset);
        setResult(res);
      } else if (activeLang === 'python') {
        const res = await executeJudge0(code, 'python', stdin);
        setResult(res);
      } else if (activeLang === 'cpp') {
        const res = await executeJudge0(code, 'cpp', stdin);
        setResult(res);
      }
    } catch (err: any) {
      setResult({
        success: false,
        error: err.message || 'Lỗi khi thực thi mã nguồn.',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleResetSqlDb = async () => {
    try {
      await initSqlEngine(sqlPreset);
      handleRunCode();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleClearCode = () => {
    const isHtmlCss = activeLang === 'html-css';
    const targetName = isHtmlCss ? (activeHtmlTab === 'css' ? 'Mã CSS' : 'Mã HTML') : 'Mã nguồn';
    const currentCode = isHtmlCss ? (activeHtmlTab === 'css' ? cssCode : code) : code;

    if (!currentCode.trim()) {
      if (isHtmlCss) {
        setCode('');
        setCssCode('');
      } else {
        setCode('');
      }
      setResult(null);
      return;
    }

    if (window.confirm(`Bạn có chắc chắn muốn xóa sạch ${targetName} đang soạn thảo không?`)) {
      if (isHtmlCss) {
        if (activeHtmlTab === 'css') {
          setCssCode('');
        } else {
          setCode('');
        }
      } else {
        setCode('');
      }
      setResult(null);
    }
  };

  const handleCopyCode = () => {
    const textToCopy = activeLang === 'html-css' && activeHtmlTab === 'css' ? cssCode : code;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Support Tab key in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const val = target.value;
      const newVal = val.substring(0, start) + '    ' + val.substring(end);

      if (activeLang === 'html-css' && activeHtmlTab === 'css') {
        setCssCode(newVal);
      } else {
        setCode(newVal);
      }

      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      }, 0);
    }
  };

  const lineCount = (activeLang === 'html-css' && activeHtmlTab === 'css' ? cssCode : code).split('\n').length;
  const { user } = useAuth();

  if (!isOpen) return null;

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
        <div className="w-full max-w-md rounded-3xl border border-slate-700/80 bg-slate-900 p-6 text-center space-y-4 shadow-2xl text-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-md">
            <Lock className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Yêu cầu Đăng nhập</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Tính năng thực hành lập trình & CSDL (Code Playground) chỉ dành riêng cho học sinh và giáo viên đã đăng nhập hệ thống.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Đóng lại
            </button>
            <a
              href="/login"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-md shadow-blue-600/30 transition-all"
            >
              Đăng nhập ngay
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div
        className={`w-full rounded-3xl border border-slate-700/80 bg-slate-950 shadow-2xl flex flex-col overflow-hidden text-slate-100 transition-all duration-200 ${
          isFullscreen ? 'h-full max-w-full rounded-none' : 'max-w-6xl h-[92vh]'
        }`}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-md">
              <Code2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <span>{title}</span>
                <span className="hidden sm:inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                  Vercel Live Runner ⚡
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Học sinh thực hành gõ code, kiểm tra câu hỏi trắc nghiệm và xem kết quả trực tiếp
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Đóng (Esc)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Language Tabs & Sample Selector Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 bg-slate-900/60 px-4 py-2 text-xs shrink-0">
          {/* Language Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => handleLanguageChange('python')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                activeLang === 'python'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>🐍 Python 3</span>
            </button>

            <button
              type="button"
              onClick={() => handleLanguageChange('cpp')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                activeLang === 'cpp'
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                  : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>⚡ C++ (GCC)</span>
            </button>

            <button
              type="button"
              onClick={() => handleLanguageChange('sql')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                activeLang === 'sql'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>🗄️ SQL (SQLite)</span>
            </button>

            <button
              type="button"
              onClick={() => handleLanguageChange('html-css')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                activeLang === 'html-css'
                  ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                  : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>🌐 HTML & CSS</span>
            </button>
          </div>

          {/* Preset & Sample Quick Selector */}
          <div className="flex items-center gap-2">
            {activeLang === 'sql' && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400 hidden sm:inline">CSDL mẫu:</span>
                <select
                  value={sqlPreset}
                  onChange={(e) => {
                    setSqlPreset(e.target.value);
                    initSqlEngine(e.target.value);
                  }}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-emerald-400 font-semibold focus:outline-none"
                >
                  <option value="empty">➕ CSDL Trống (Tự tạo theo SGK KNTT)</option>
                  <option value="hoc_sinh">QL Học sinh (SGK 12 KNTT)</option>
                  <option value="thu_vien">Thư viện Trường học</option>
                </select>
                <span className="hidden sm:inline-flex items-center rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30" title="Chế độ tương thích chuẩn HeidiSQL / MariaDB theo SGK Tin học 12 Kết nối tri thức">
                  HeidiSQL 🐬
                </span>
                <button
                  type="button"
                  onClick={handleResetSqlDb}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                  title="Đặt lại dữ liệu gốc của CSDL"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Sample Selector Dropdown */}
            <select
              onChange={(e) => {
                const idx = parseInt(e.target.value, 10);
                if (!isNaN(idx)) loadSample(idx);
              }}
              className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-slate-300 focus:outline-none"
              defaultValue=""
            >
              <option value="" disabled>
                📋 Nạp bài mẫu...
              </option>
              {CODE_SAMPLES[activeLang]?.map((s, idx) => (
                <option key={idx} value={idx}>
                  {s.title}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleClearCode}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-rose-300 hover:border-rose-500/50 hover:bg-rose-950/40 transition-all"
              title="Xóa sạch mã nguồn để bắt đầu viết mới"
            >
              <Trash2 className="h-3.5 w-3.5 text-rose-400" />
              <span className="hidden sm:inline">Xóa sạch</span>
            </button>

            <button
              type="button"
              onClick={handleCopyCode}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Sao chép mã nguồn"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Đã chép' : 'Sao chép'}</span>
            </button>
          </div>
        </div>

        {/* Main Workspace Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 min-h-0 overflow-hidden">
          {/* Left Column: Code Editor */}
          <div className="flex flex-col h-full min-h-0 bg-slate-950">
            {/* Editor Toolbar */}
            <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-2 text-xs bg-slate-900/40">
              <div className="flex items-center gap-2">
                {activeLang === 'html-css' ? (
                  <div className="flex items-center gap-1 rounded-lg bg-slate-900 p-0.5 border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setActiveHtmlTab('html')}
                      className={`px-2.5 py-0.5 rounded-md font-bold transition-colors ${
                        activeHtmlTab === 'html' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      HTML
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveHtmlTab('css')}
                      className={`px-2.5 py-0.5 rounded-md font-bold transition-colors ${
                        activeHtmlTab === 'css' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      CSS
                    </button>
                  </div>
                ) : (
                  <span className="font-mono text-slate-400 text-xs flex items-center gap-1">
                    <span>Editor ({lineCount} dòng)</span>
                  </span>
                )}

                {(activeLang === 'python' || activeLang === 'cpp') && (
                  <button
                    type="button"
                    onClick={() => setShowStdin(!showStdin)}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-colors ${
                      showStdin
                        ? 'bg-blue-600/30 text-blue-400 border-blue-500/50'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    Dữ liệu vào (Stdin)
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClearCode}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-400 transition-colors font-sans mr-1"
                  title="Xóa sạch code hiện tại"
                >
                  <Trash2 className="h-3 w-3 text-rose-400" />
                  <span>Xóa sạch</span>
                </button>

                <button
                  type="button"
                  onClick={handleRunCode}
                  disabled={isRunning}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
                >
                  <Play className={`h-3.5 w-3.5 fill-white ${isRunning ? 'animate-spin' : ''}`} />
                  <span>{isRunning ? 'Đang chạy...' : activeLang === 'html-css' ? 'Cập nhật View' : 'Chạy thử'}</span>
                </button>
              </div>
            </div>

            {/* Optional Stdin Input Box for Python/C++ */}
            {showStdin && (activeLang === 'python' || activeLang === 'cpp') && (
              <div className="border-b border-slate-800 bg-slate-900/80 p-2.5">
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Đầu vào chuẩn (Standard Input - Stdin):
                </label>
                <textarea
                  rows={2}
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  placeholder="Nhập các giá trị cho cin >> hoặc input(), mỗi dòng một giá trị..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 font-mono text-xs text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                />
              </div>
            )}

            {/* Syntax-Highlighted Code Editor */}
            <div className="flex-1 flex min-h-0 overflow-hidden relative">
              <CodeEditor
                value={activeLang === 'html-css' && activeHtmlTab === 'css' ? cssCode : code}
                onChange={(val) => {
                  if (activeLang === 'html-css' && activeHtmlTab === 'css') {
                    setCssCode(val);
                  } else {
                    setCode(val);
                  }
                }}
                language={activeLang === 'html-css' ? activeHtmlTab : activeLang}
                onRun={handleRunCode}
                onClear={handleClearCode}
                placeholder={
                  activeLang === 'sql'
                    ? '-- Nhập câu lệnh truy vấn SQL (SELECT, INSERT, UPDATE...)'
                    : activeLang === 'cpp'
                    ? '// Nhập mã nguồn C++ (#include <iostream>...)'
                    : activeLang === 'python'
                    ? '# Nhập mã nguồn Python (def solve(): ...)'
                    : activeHtmlTab === 'css'
                    ? '/* Nhập quy tắc CSS (selector { property: value; }) */'
                    : '<!-- Nhập cấu trúc mã HTML -->'
                }
              />
            </div>
          </div>

          {/* Right Column: Execution Output / Live Preview */}
          <div className="flex flex-col h-full min-h-0 bg-slate-950">
            {/* Output Header */}
            <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-2 text-xs bg-slate-900/40 shrink-0">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-blue-400" />
                <span className="font-bold text-slate-300">
                  {activeLang === 'html-css' ? 'Xem trước Trực tiếp (Live Preview)' : 'Kết quả Thực thi'}
                </span>
              </div>

              {result?.time && (
                <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-amber-400" />
                    {result.time}
                  </span>
                  {result.memory && (
                    <span className="flex items-center gap-1">
                      <Cpu className="h-3 w-3 text-sky-400" />
                      {Math.round(result.memory / 1024)} MB
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Output Body */}
            <div className="flex-1 min-h-0 overflow-auto bg-slate-950 p-4">
              {/* HTML & CSS Live Preview (IFrame Sandbox) */}
              {activeLang === 'html-css' ? (
                <div className="w-full h-full min-h-[300px] rounded-2xl border border-slate-800 bg-white overflow-hidden shadow-inner">
                  <iframe
                    title="Live Preview"
                    srcDoc={buildHtmlPreviewDocument(code, cssCode)}
                    sandbox="allow-scripts"
                    className="w-full h-full border-0"
                  />
                </div>
              ) : /* SQL Data Table View */
              activeLang === 'sql' ? (
                <div className="space-y-3">
                  {result?.notice && (
                    <div className="p-3.5 rounded-2xl bg-blue-950/50 border border-blue-800/80 text-blue-200 text-xs flex items-start gap-2.5 shadow-sm">
                      <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                      <div className="font-sans leading-relaxed whitespace-pre-line">{result.notice}</div>
                    </div>
                  )}

                  {result?.error && (
                    <div className="p-3.5 rounded-2xl bg-red-950/50 border border-red-800/80 text-red-300 text-xs flex items-start gap-2.5">
                      <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      <div className="font-mono">{result.error}</div>
                    </div>
                  )}

                  {result?.tableData && result.tableData.columns.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-semibold text-emerald-400">
                          ✓ Trả về {result.tableData.rowCount} hàng kết quả
                        </span>
                      </div>
                      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-md">
                        <table className="w-full text-left text-xs font-mono">
                          <thead className="bg-slate-900 border-b border-slate-800 text-slate-300 font-bold">
                            <tr>
                              <th className="px-3 py-2 text-slate-400 text-center w-10">#</th>
                              {result.tableData.columns.map((col, idx) => (
                                <th key={idx} className="px-3.5 py-2.5 border-r border-slate-800/60 last:border-r-0">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {result.tableData.rows.map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-slate-800/40 transition-colors">
                                <td className="px-3 py-2 text-slate-400 text-center text-[11px]">{rIdx + 1}</td>
                                {row.map((val, cIdx) => (
                                  <td
                                    key={cIdx}
                                    className="px-3.5 py-2 border-r border-slate-800/40 last:border-r-0 text-slate-200"
                                  >
                                    {val !== null && val !== undefined ? String(val) : <span className="text-slate-400 italic">NULL</span>}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : result?.stdout ? (
                    <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/60 text-emerald-300 text-xs font-mono">
                      {result.stdout}
                    </div>
                  ) : !result ? (
                    <div className="text-center py-12 text-slate-400 space-y-2">
                      <Database className="h-10 w-10 mx-auto text-slate-500" />
                      <p className="text-xs">Bấm <strong>Chạy thử</strong> để thực thi câu lệnh SQL trên CSDL mẫu</p>
                    </div>
                  ) : null}
                </div>
              ) : (
                /* Python & C++ Terminal Output */
                <div className="space-y-3 font-mono text-xs">
                  {/* System Error Message */}
                  {result?.error && !result?.compileOutput && (
                    <div className="p-3.5 rounded-2xl bg-red-950/60 border border-red-800 text-red-300 space-y-1">
                      <div className="font-bold flex items-center gap-1 text-red-400">
                        <AlertCircle className="h-4 w-4" />
                        Thông báo lỗi hệ thống:
                      </div>
                      <div className="text-xs leading-relaxed font-sans">{result.error}</div>
                    </div>
                  )}

                  {/* Compilation Output (C++) */}
                  {result?.compileOutput && (
                    <div className="p-3.5 rounded-2xl bg-red-950/60 border border-red-800 text-red-300 space-y-1">
                      <div className="font-bold flex items-center gap-1 text-red-400">
                        <AlertCircle className="h-4 w-4" />
                        Lỗi biên dịch (Compilation Error):
                      </div>
                      <pre className="whitespace-pre-wrap overflow-x-auto text-[11px] leading-relaxed font-mono">
                        {result.compileOutput}
                      </pre>
                    </div>
                  )}

                  {/* Runtime Error (stderr) */}
                  {result?.stderr && (
                    <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-800 text-amber-300 space-y-1">
                      <div className="font-bold text-amber-400">Lỗi thực thi (Runtime Error / Stderr):</div>
                      <pre className="whitespace-pre-wrap overflow-x-auto text-[11px] leading-relaxed font-mono">
                        {result.stderr}
                      </pre>
                    </div>
                  )}

                  {/* Standard Output (stdout) */}
                  {result?.stdout ? (
                    <div
                      className="p-4 rounded-2xl border border-slate-800 space-y-1 shadow-inner"
                      style={{ backgroundColor: '#090d16', color: '#34d399' }}
                    >
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Đầu ra chương trình (Stdout):
                      </div>
                      <pre className="whitespace-pre-wrap overflow-x-auto text-xs leading-relaxed font-mono">
                        {result.stdout}
                      </pre>
                    </div>
                  ) : result && !result.compileOutput && !result.stderr && !result.error ? (
                    <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-slate-300 text-xs italic">
                      Chương trình chạy hoàn tất (Không có gì được in ra qua cout / print).
                    </div>
                  ) : !result ? (
                    <div className="text-center py-12 text-slate-400 space-y-2">
                      <Terminal className="h-10 w-10 mx-auto text-slate-500" />
                      <p className="text-xs">Bấm <strong>Chạy thử</strong> để biên dịch và xem kết quả xuất ra màn hình</p>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="border-t border-slate-800/80 bg-slate-900/60 px-4 py-2 text-[11px] text-slate-500 flex items-center justify-between shrink-0">
          <span>
            💡 Mẹo: Nhấn <kbd className="px-1 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-slate-300">Tab</kbd> để thụt lề code 4 khoảng trắng.
          </span>
          <span className="font-semibold text-slate-400">Hỗ trợ đầy đủ GDPT 2018: HTML, CSS, SQL, Python, C++</span>
        </div>
      </div>
    </div>
  );
};
