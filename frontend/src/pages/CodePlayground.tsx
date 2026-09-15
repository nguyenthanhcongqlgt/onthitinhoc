import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Code2,
  ArrowLeft,
  Play,
  RotateCcw,
  Terminal,
  Database,
  Globe,
  Copy,
  Check,
  Table,
  AlertCircle,
  Clock,
  Cpu,
  Layers,
  Sparkles,
  Download,
  Info,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { CodeEditor } from '../components/common/CodeEditor';
import {
  PlaygroundLanguage,
  ExecutionResult,
  SQL_PRESETS,
  CODE_SAMPLES,
  executeSql,
  executeJudge0,
  buildHtmlPreviewDocument,
  initSqlEngine,
} from '../services/codeRunner';

export const CodePlayground: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  // Initial language & code from query params (if opened via ?lang=...&code=...)
  const queryLang = searchParams.get('lang') || 'python';
  const queryCode = searchParams.get('code') || '';

  const normalizeLang = (lang: string): PlaygroundLanguage => {
    const l = lang.toLowerCase();
    if (l === 'cpp' || l === 'c++' || l === 'c') return 'cpp';
    if (l === 'sql') return 'sql';
    if (l === 'html' || l === 'css' || l === 'html-css' || l === 'markup') return 'html-css';
    return 'python';
  };

  const [activeLang, setActiveLang] = useState<PlaygroundLanguage>(() => normalizeLang(queryLang));
  const [code, setCode] = useState<string>('');
  const [cssCode, setCssCode] = useState<string>('');
  const [stdin, setStdin] = useState<string>('');
  const [showStdin, setShowStdin] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [sqlPreset, setSqlPreset] = useState<string>('hoc_sinh');
  const [copied, setCopied] = useState<boolean>(false);
  const [activeHtmlTab, setActiveHtmlTab] = useState<'html' | 'css'>('html');

  useEffect(() => {
    if (queryCode && queryCode.trim()) {
      const normalized = normalizeLang(queryLang);
      setActiveLang(normalized);
      if (normalized === 'html-css') {
        if (queryLang.toLowerCase() === 'css') {
          setCssCode(queryCode);
          setCode('<div class="box">\n  <h3>Tiêu đề mẫu</h3>\n  <p>Thực hành CSS trực tiếp</p>\n</div>');
          setActiveHtmlTab('css');
        } else {
          setCode(queryCode);
          setCssCode('/* CSS kèm theo */\nbody { padding: 15px; font-family: sans-serif; }');
        }
      } else {
        setCode(queryCode);
      }
    } else {
      loadSample(0, activeLang);
    }
  }, []);

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
        setResult({
          success: true,
          stdout: 'Giao diện HTML & CSS đã được render thành công.',
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Quay lại</span>
            </button>

            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-md">
                <Code2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                  <span>Góc Thực Hành Lập Trình</span>
                  <span className="hidden sm:inline-flex items-center rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/30">
                    Live Playground ⚡
                  </span>
                </h1>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Phòng thí nghiệm code mini dành cho học sinh THPT (HTML, CSS, SQL, Python, C++)
                </p>
              </div>
            </div>
          </div>

          {/* Language Selector in Navbar */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => handleLanguageChange('python')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeLang === 'python'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🐍 Python</span>
            </button>

            <button
              type="button"
              onClick={() => handleLanguageChange('cpp')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeLang === 'cpp'
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>⚡ C++</span>
            </button>

            <button
              type="button"
              onClick={() => handleLanguageChange('sql')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeLang === 'sql'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🗄️ SQL</span>
            </button>

            <button
              type="button"
              onClick={() => handleLanguageChange('html-css')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeLang === 'html-css'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🌐 Web (HTML/CSS)</span>
            </button>

            {/* User profile indicator */}
            {user && (
              <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-800 text-xs">
                <span className="font-semibold text-slate-300">{user.full_name || user.username}</span>
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                  {user.role === 'STUDENT' ? (user.class_name || 'Học sinh') : user.role === 'TEACHER' ? 'Giáo viên' : 'Admin'}
                </span>
              </div>
            )}

            <div className="pl-2 border-l border-slate-800">
              <ThemeToggle variant="compact" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col p-3 sm:p-5 max-w-7xl w-full mx-auto min-h-0">
        <div className="flex-1 rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl flex flex-col overflow-hidden">
          {/* Sub Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 bg-slate-900/60 px-4 py-2.5 text-xs">
            <div className="flex items-center gap-2">
              {activeLang === 'sql' && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-400">CSDL Mẫu:</span>
                  <select
                    value={sqlPreset}
                    onChange={(e) => {
                      setSqlPreset(e.target.value);
                      initSqlEngine(e.target.value);
                    }}
                    className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-emerald-400 font-semibold focus:outline-none"
                  >
                    <option value="empty">➕ CSDL Trống (Tự tạo theo SGK KNTT)</option>
                    <option value="hoc_sinh">QL Học sinh & Điểm (SGK 12 KNTT)</option>
                    <option value="thu_vien">Thư viện Sách & Mượn trả</option>
                  </select>
                  <span className="hidden sm:inline-flex items-center rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30" title="Chế độ tương thích chuẩn HeidiSQL / MariaDB theo SGK Tin học 12 Kết nối tri thức">
                    HeidiSQL 🐬
                  </span>
                  <button
                    type="button"
                    onClick={handleResetSqlDb}
                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title="Khôi phục lại dữ liệu ban đầu của CSDL"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Sample Code Dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">Bài mẫu:</span>
                <select
                  onChange={(e) => {
                    const idx = parseInt(e.target.value, 10);
                    if (!isNaN(idx)) loadSample(idx);
                  }}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-slate-300 focus:outline-none"
                  defaultValue=""
                >
                  <option value="" disabled>
                    📋 Chọn bài mẫu...
                  </option>
                  {CODE_SAMPLES[activeLang]?.map((s, idx) => (
                    <option key={idx} value={idx}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>

              {(activeLang === 'python' || activeLang === 'cpp') && (
                <button
                  type="button"
                  onClick={() => setShowStdin(!showStdin)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                    showStdin
                      ? 'bg-blue-600/30 text-blue-400 border-blue-500/50'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                >
                  Đầu vào (Stdin)
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearCode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700/80 bg-slate-800 text-slate-300 hover:text-rose-300 hover:border-rose-500/50 hover:bg-rose-950/40 transition-all shadow-xs"
                title="Xóa sạch mã nguồn để bắt đầu viết mới"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                <span className="text-xs font-semibold">Xóa sạch</span>
              </button>

              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors"
                title="Sao chép code"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span className="text-xs">{copied ? 'Đã chép' : 'Sao chép'}</span>
              </button>

              <button
                type="button"
                onClick={handleRunCode}
                disabled={isRunning}
                className="flex items-center gap-1.5 px-5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
              >
                <Play className={`h-3.5 w-3.5 fill-white ${isRunning ? 'animate-spin' : ''}`} />
                <span>{isRunning ? 'Đang thực thi...' : activeLang === 'html-css' ? 'Cập nhật Preview' : 'Chạy Code'}</span>
              </button>
            </div>
          </div>

          {/* Stdin Drawer if opened */}
          {showStdin && (activeLang === 'python' || activeLang === 'cpp') && (
            <div className="border-b border-slate-800 bg-slate-900/80 p-3">
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                Dữ liệu đầu vào chuẩn (Standard Input - Stdin):
              </label>
              <textarea
                rows={2}
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                placeholder="Nhập các dòng input cho chương trình (ví dụ: 10 20)..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 font-mono text-xs text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
              />
            </div>
          )}

          {/* Workspace Body: 2 Columns */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 min-h-0 overflow-hidden">
            {/* Left: Code Editor */}
            <div className="flex flex-col h-full min-h-0 bg-slate-950">
              <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-2 text-xs bg-slate-900/40">
                {activeLang === 'html-css' ? (
                  <div className="flex items-center gap-1 rounded-lg bg-slate-900 p-0.5 border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setActiveHtmlTab('html')}
                      className={`px-3 py-1 rounded-md font-bold transition-colors ${
                        activeHtmlTab === 'html' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Mã HTML
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveHtmlTab('css')}
                      className={`px-3 py-1 rounded-md font-bold transition-colors ${
                        activeHtmlTab === 'css' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Mã CSS
                    </button>
                  </div>
                ) : (
                  <span className="font-mono text-slate-400 text-xs">
                    Mã nguồn ({lineCount} dòng)
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleClearCode}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-400 transition-colors font-sans"
                  title="Xóa sạch code hiện tại"
                >
                  <Trash2 className="h-3 w-3 text-rose-400" />
                  <span>Xóa sạch</span>
                </button>
              </div>

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

            {/* Right: Output Pane */}
            <div className="flex flex-col h-full min-h-0 bg-slate-950">
              <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-2.5 text-xs bg-slate-900/40">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-blue-400" />
                  <span className="font-bold text-slate-300">
                    {activeLang === 'html-css' ? 'Xem trước Trang web (Live Preview)' : 'Kết quả Thực thi'}
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

              <div className="flex-1 min-h-0 overflow-auto bg-slate-950 p-4">
                {activeLang === 'html-css' ? (
                  <div className="w-full h-full min-h-[350px] rounded-2xl border border-slate-800 bg-white overflow-hidden shadow-inner">
                    <iframe
                      title="Live Preview"
                      srcDoc={buildHtmlPreviewDocument(code, cssCode)}
                      sandbox="allow-scripts"
                      className="w-full h-full border-0"
                    />
                  </div>
                ) : activeLang === 'sql' ? (
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
                      <div className="text-center py-16 text-slate-400 space-y-2">
                        <Database className="h-12 w-12 mx-auto text-slate-500" />
                        <p className="text-xs">Bấm <strong>Chạy Code</strong> để thực thi câu lệnh SQL trên CSDL mẫu</p>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="space-y-3 font-mono text-xs">
                    {result?.error && !result?.compileOutput && (
                      <div className="p-3.5 rounded-2xl bg-red-950/60 border border-red-800 text-red-300 space-y-1">
                        <div className="font-bold flex items-center gap-1 text-red-400">
                          <AlertCircle className="h-4 w-4" />
                          Thông báo lỗi hệ thống:
                        </div>
                        <div className="text-xs leading-relaxed font-sans">{result.error}</div>
                      </div>
                    )}

                    {result?.compileOutput && (
                      <div className="p-3.5 rounded-2xl bg-red-950/60 border border-red-800 text-red-300 space-y-1">
                        <div className="font-bold flex items-center gap-1 text-red-400">
                          <AlertCircle className="h-4 w-4" />
                          Lỗi biên dịch (Compilation Error):
                        </div>
                        <pre className="whitespace-pre-wrap overflow-x-auto text-[11px] leading-relaxed">
                          {result.compileOutput}
                        </pre>
                      </div>
                    )}

                    {result?.stderr && (
                      <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-800 text-amber-300 space-y-1">
                        <div className="font-bold text-amber-400">Lỗi thực thi (Runtime Error / Stderr):</div>
                        <pre className="whitespace-pre-wrap overflow-x-auto text-[11px] leading-relaxed">
                          {result.stderr}
                        </pre>
                      </div>
                    )}

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
                        Chương trình chạy hoàn tất (Không có kết quả in ra màn hình).
                      </div>
                    ) : !result ? (
                      <div className="text-center py-16 text-slate-400 space-y-2">
                        <Terminal className="h-12 w-12 mx-auto text-slate-500" />
                        <p className="text-xs">Bấm <strong>Chạy Code</strong> để biên dịch và xem kết quả xuất ra màn hình</p>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CodePlayground;
