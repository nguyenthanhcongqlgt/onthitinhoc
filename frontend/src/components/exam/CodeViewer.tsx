import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-markup'; // HTML / XML
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-http';
import { Terminal, Shield, Code2, Copy, Check, Columns, Maximize2, Play, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatCode } from '../../utils/codeFormatter';
import { PlaygroundModal } from './PlaygroundModal';

interface CodeSnippet {
  language: string;
  code: string;
  title?: string;
}

interface CodeViewerProps {
  code: string;
  language?: string;
  snippets?: CodeSnippet[];
  className?: string;
  fontSize?: 'sm' | 'md' | 'lg';
  allowSideBySide?: boolean;
  defaultViewMode?: 'tabs' | 'split';
  allowRunCode?: boolean;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  code,
  language = 'python',
  snippets,
  className = '',
  fontSize = 'md',
  allowSideBySide = true,
  defaultViewMode = 'split',
  allowRunCode = true,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'tabs' | 'split'>(defaultViewMode);
  const [isPlaygroundOpen, setIsPlaygroundOpen] = useState<boolean>(false);

  const handleOpenPlayground = () => {
    if (!user) {
      if (window.confirm('Tính năng thực hành và chạy thử mã nguồn chỉ dành riêng cho người dùng đã đăng nhập hệ thống.\n\nBạn có muốn chuyển đến trang Đăng nhập ngay bây giờ không?')) {
        navigate('/login');
      }
      return;
    }
    setIsPlaygroundOpen(true);
  };

  // Extract multiple code blocks if embedded within a single string
  const extractedSnippets: CodeSnippet[] = React.useMemo(() => {
    let rawList: CodeSnippet[] = [];

    if (snippets && snippets.length > 0) {
      rawList = snippets;
    } else if (code && code.trim()) {
      const blocks: CodeSnippet[] = [];
      const codeBlockRegex = /```([a-zA-Z0-9_\+]*)\s*\n([\s\S]*?)```/g;
      let match;

      while ((match = codeBlockRegex.exec(code)) !== null) {
        let lang = match[1].trim().toLowerCase() || 'python';
        if (lang === 'c++' || lang === 'cplusplus') lang = 'cpp';
        if (lang === 'html5' || lang === 'htm') lang = 'markup';
        if (lang === 'html') lang = 'markup';
        if (lang === 'css' || lang === 'css3') lang = 'css';

        blocks.push({
          language: lang,
          code: match[2],
        });
      }

      // Also support [CODE] or [CODE_CPP] tags
      if (blocks.length === 0) {
        const tagRegex = /\[CODE(?:_|\s+)?([a-zA-Z0-9_\+]*)\]([\s\S]*?)\[\/CODE(?:_[a-zA-Z0-9_\+]*)?\]/gi;
        let tagMatch;
        while ((tagMatch = tagRegex.exec(code)) !== null) {
          let lang = tagMatch[1].trim().toLowerCase() || 'python';
          if (lang === 'c++' || lang === 'cplusplus') lang = 'cpp';
          if (lang === 'html5' || lang === 'htm') lang = 'markup';
          if (lang === 'html') lang = 'markup';
          if (lang === 'css' || lang === 'css3') lang = 'css';

          blocks.push({
            language: lang,
            code: tagMatch[2],
          });
        }
      }

      // If no code fences found, return single snippet
      if (blocks.length === 0) {
        let singleLang = language.toLowerCase();
        if (singleLang === 'c++' || singleLang === 'cplusplus') singleLang = 'cpp';
        if (singleLang === 'html' || singleLang === 'html5' || singleLang === 'htm') singleLang = 'markup';
        if (singleLang === 'css' || singleLang === 'css3') singleLang = 'css';

        blocks.push({
          language: singleLang,
          code: code,
        });
      }

      rawList = blocks;
    }

    // Apply smart formatting to ensure proper indentation
    return rawList.map((s) => ({
      ...s,
      code: formatCode(s.code, s.language),
    }));
  }, [code, language, snippets]);

  useEffect(() => {
    Prism.highlightAll();
  }, [extractedSnippets, activeTab, viewMode]);

  if (extractedSnippets.length === 0) return null;

  const getLanguageLabel = (lang: string) => {
    const l = lang.toLowerCase();
    switch (l) {
      case 'cpp':
      case 'c++':
        return { name: 'C++ (GCC)', badge: '⚡ C++', color: 'text-sky-400 border-sky-500/40 bg-sky-500/10' };
      case 'python':
      case 'py':
        return { name: 'Python 3', badge: '🐍 Python', color: 'text-amber-400 border-amber-500/40 bg-amber-500/10' };
      case 'sql':
        return { name: 'SQL (RDBMS)', badge: '🗄️ SQL', color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' };
      case 'markup':
      case 'html':
      case 'html5':
        return { name: 'HTML5', badge: '🌐 HTML', color: 'text-orange-400 border-orange-500/40 bg-orange-500/10' };
      case 'css':
      case 'css3':
        return { name: 'CSS3', badge: '🎨 CSS', color: 'text-pink-400 border-pink-500/40 bg-pink-500/10' };
      case 'javascript':
      case 'js':
        return { name: 'JavaScript', badge: '📜 JS', color: 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10' };
      case 'java':
        return { name: 'Java', badge: '☕ Java', color: 'text-red-400 border-red-500/40 bg-red-500/10' };
      default:
        return { name: lang.toUpperCase(), badge: lang.toUpperCase(), color: 'text-blue-400 border-blue-500/40 bg-blue-500/10' };
    }
  };

  const handleCopy = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fontClass =
    fontSize === 'sm' ? 'text-xs' : fontSize === 'lg' ? 'text-base' : 'text-xs sm:text-sm';

  const isMultiLanguage = extractedSnippets.length > 1;

  return (
    <div className={`my-3 overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-950 shadow-xl ${className}`}>
      {/* Code Header Bar with Multi-Language Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900/90 px-3 sm:px-4 py-2 text-xs">
        {/* Language Tabs or Title */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {isMultiLanguage ? (
            extractedSnippets.map((snippet, idx) => {
              const langInfo = getLanguageLabel(snippet.language);
              const isActive = activeTab === idx && viewMode === 'tabs';
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setActiveTab(idx);
                    setViewMode('tabs');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-700/50'
                  }`}
                >
                  <span>{langInfo.badge}</span>
                </button>
              );
            })
          ) : (
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-blue-400" />
              <span className="font-mono text-blue-300 font-bold">
                {getLanguageLabel(extractedSnippets[0].language).name}
              </span>
            </div>
          )}

          {isMultiLanguage && allowSideBySide && (
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'split' ? 'tabs' : 'split')}
              className={`hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                viewMode === 'split'
                  ? 'bg-indigo-600 text-white shadow-md border-indigo-400'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700/50 hover:text-slate-200'
              }`}
              title="Xem song song 2 ngôn ngữ"
            >
              <Columns className="h-3.5 w-3.5" />
              <span>Song song</span>
            </button>
          )}
        </div>

        {/* Action Controls & Protection Tag */}
        <div className="flex items-center gap-2 sm:gap-3">
          {allowRunCode && (
            <button
              type="button"
              onClick={handleOpenPlayground}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all shadow-xs ${
                user
                  ? 'bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border-emerald-500/40'
                  : 'bg-slate-800/80 hover:bg-amber-600/20 text-slate-400 hover:text-amber-300 border-slate-700/60 hover:border-amber-500/40'
              }`}
              title={user ? 'Mở phòng thực hành để chạy thử đoạn code này' : 'Đăng nhập để chạy thử đoạn code này'}
            >
              {user ? <Play className="h-3 w-3 fill-current" /> : <Lock className="h-3 w-3 text-amber-400" />}
              <span>Chạy thử</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleCopy(extractedSnippets[activeTab]?.code || '')}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
            title="Sao chép mã"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Đã chép</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Sao chép</span>
              </>
            )}
          </button>

          <div className="hidden sm:flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/80"></span>
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80"></span>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80"></span>
          </div>
        </div>
      </div>

      {/* Code Body */}
      {viewMode === 'split' && isMultiLanguage ? (
        /* Split View: Side by Side */
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 bg-slate-950">
          {extractedSnippets.map((snippet, sIdx) => {
            const lines = snippet.code.split('\n');
            const langClass = snippet.language === 'cpp' ? 'cpp' : snippet.language === 'markup' ? 'markup' : snippet.language;
            return (
              <div key={sIdx} className="overflow-x-auto p-4 font-mono leading-relaxed">
                <div className="text-[11px] font-bold text-slate-400 mb-2 flex items-center justify-between border-b border-slate-900 pb-1">
                  <span>{getLanguageLabel(snippet.language).name}</span>
                </div>
                <div className="flex">
                  <div className="select-none pr-3 text-right text-slate-400 border-r border-slate-800/80 shrink-0 font-mono text-xs pt-0.5 font-medium">
                    {lines.map((_, i) => (
                      <div key={i} className="leading-relaxed">{i + 1}</div>
                    ))}
                  </div>
                  <div className={`pl-3 flex-1 ${fontClass}`}>
                    <pre
                      className={`language-${langClass} !m-0 !bg-transparent !p-0`}
                      style={{ whiteSpace: 'pre', tabSize: 4, WebkitUserSelect: 'text', userSelect: 'text' }}
                    >
                      <code style={{ whiteSpace: 'pre', tabSize: 4 }}>{snippet.code}</code>
                    </pre>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Tab View: Single Active Language */
        <div className="overflow-x-auto p-4 flex font-mono leading-relaxed bg-slate-950">
          {/* Line Numbers */}
          <div className="select-none pr-4 text-right text-slate-400 border-r border-slate-800 shrink-0 font-mono text-xs pt-0.5 font-medium">
            {extractedSnippets[activeTab].code.split('\n').map((_, i) => (
              <div key={i} className="leading-relaxed">
                {i + 1}
              </div>
            ))}
          </div>

          {/* Code Syntax Highlight */}
          <div className={`pl-4 flex-1 ${fontClass}`}>
            <pre
              className={`language-${
                extractedSnippets[activeTab].language === 'cpp'
                  ? 'cpp'
                  : extractedSnippets[activeTab].language === 'markup'
                  ? 'markup'
                  : extractedSnippets[activeTab].language
              } !m-0 !bg-transparent !p-0`}
              style={{ whiteSpace: 'pre', tabSize: 4, WebkitUserSelect: 'text', userSelect: 'text' }}
            >
              <code style={{ whiteSpace: 'pre', tabSize: 4 }}>{extractedSnippets[activeTab].code}</code>
            </pre>
          </div>
        </div>
      )}

      {/* Interactive Code Playground Modal */}
      <PlaygroundModal
        isOpen={isPlaygroundOpen}
        onClose={() => setIsPlaygroundOpen(false)}
        initialCode={extractedSnippets[activeTab]?.code || ''}
        initialLanguage={extractedSnippets[activeTab]?.language || language}
      />
    </div>
  );
};
