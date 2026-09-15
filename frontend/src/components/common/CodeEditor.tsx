import React, { useRef, useMemo, useState, useEffect } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';
import { Trash2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: 'python' | 'cpp' | 'sql' | 'html' | 'css' | 'markup' | string;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  onRun?: () => void;
  onClear?: () => void;
  showLineNumbers?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language,
  placeholder = 'Nhập mã nguồn tại đây...',
  readOnly = false,
  className = '',
  onRun,
  onClear,
  showLineNumbers = true,
}) => {
  const { isDarkMode } = useTheme();
  const isDark = isDarkMode;

  const preRef = useRef<HTMLPreElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const lineNumbersRef = useRef<HTMLDivElement | null>(null);

  // Map language to Prism grammar & key
  const { grammar, langKey, langBadge } = useMemo(() => {
    const l = (language || '').toLowerCase().trim();
    if (l === 'cpp' || l === 'c++' || l === 'c') {
      return { grammar: Prism.languages.cpp || Prism.languages.c, langKey: 'cpp', langBadge: '⚡ C++ (GCC)' };
    }
    if (l === 'sql') {
      return { grammar: Prism.languages.sql, langKey: 'sql', langBadge: '🗄️ SQL (SQLite)' };
    }
    if (l === 'html' || l === 'markup' || l === 'htm') {
      return { grammar: Prism.languages.markup, langKey: 'markup', langBadge: '🌐 HTML5' };
    }
    if (l === 'css' || l === 'css3') {
      return { grammar: Prism.languages.css, langKey: 'css', langBadge: '🎨 CSS3' };
    }
    if (l === 'javascript' || l === 'js') {
      return { grammar: Prism.languages.javascript, langKey: 'javascript', langBadge: '⚡ JavaScript' };
    }
    return { grammar: Prism.languages.python, langKey: 'python', langBadge: '🐍 Python 3' };
  }, [language]);

  // Syntax highlighting HTML string
  const highlightedHtml = useMemo(() => {
    const raw = value || '';
    // Ensure trailing newline renders properly in pre
    const codeToHighlight = raw + (raw.endsWith('\n') ? ' ' : '');
    try {
      if (grammar) {
        return Prism.highlight(codeToHighlight, grammar, langKey);
      }
      return codeToHighlight
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    } catch {
      return codeToHighlight
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }
  }, [value, grammar, langKey]);

  // Total lines
  const lines = useMemo(() => {
    return (value || '').split('\n');
  }, [value]);

  // Synchronized scroll
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    if (preRef.current) {
      preRef.current.scrollTop = target.scrollTop;
      preRef.current.scrollLeft = target.scrollLeft;
    }
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = target.scrollTop;
    }
  };

  // Keyboard ergonomics: Tab (4 spaces), Auto-indent on Enter, Ctrl+Enter to run
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl + Enter or Cmd + Enter -> Run code
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (onRun) onRun();
      return;
    }

    if (readOnly) return;

    // Tab key -> 4 spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const val = target.value;

      const newVal = val.substring(0, start) + '    ' + val.substring(end);
      onChange(newVal);

      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      }, 0);
      return;
    }

    // Enter key -> preserve & smart indentation
    if (e.key === 'Enter') {
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      if (start === end) {
        const val = target.value;
        const lineStart = val.lastIndexOf('\n', start - 1) + 1;
        const currentLine = val.substring(lineStart, start);
        const matchIndent = currentLine.match(/^(\s*)/);
        let indent = matchIndent ? matchIndent[1] : '';

        // Check if previous line ended with colon (Python) or open brace (C++/CSS/JS)
        const trimmed = currentLine.trimEnd();
        if (trimmed.endsWith(':') || trimmed.endsWith('{')) {
          indent += '    ';
        }

        if (indent.length > 0) {
          e.preventDefault();
          const newVal = val.substring(0, start) + '\n' + indent + val.substring(end);
          onChange(newVal);

          setTimeout(() => {
            target.selectionStart = target.selectionEnd = start + 1 + indent.length;
          }, 0);
        }
      }
    }
  };

  return (
    <div
      className={`relative flex flex-col h-full w-full overflow-hidden font-mono text-xs sm:text-sm ${
        isDark ? 'code-editor-dark-theme bg-[#090d16] text-[#e2e8f0]' : 'code-editor-light-theme bg-white text-[#0f172a]'
      } ${className}`}
    >
      <style>{`
        /* =========================================================
           CODE EDITOR EXPLICIT TRANSPARENCY OVERRIDES
           Bắt buộc textarea trong suốt 100% để hiển thị lớp code tô màu bên dưới
           ========================================================= */
        .custom-code-editor textarea.code-editor-textarea,
        html.light-teal .custom-code-editor textarea.code-editor-textarea {
          background-color: transparent !important;
          background: transparent !important;
          border: none !important;
          border-color: transparent !important;
          box-shadow: none !important;
          color: transparent !important;
          -webkit-text-fill-color: transparent !important;
          outline: none !important;
          resize: none !important;
        }

        .custom-code-editor pre.code-editor-pre,
        .custom-code-editor pre.code-editor-pre code,
        html.light-teal .custom-code-editor pre.code-editor-pre,
        html.light-teal .custom-code-editor pre.code-editor-pre code {
          background-color: transparent !important;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }

        /* =========================================================
           DARK THEME TOKENS (VS Code / OneDark Style)
           ========================================================= */
        .code-editor-dark-theme pre code {
          color: #f1f5f9 !important; /* Biến, định danh: Trắng sáng */
        }
        .code-editor-dark-theme .token.keyword {
          color: #c084fc !important; /* Tím đậm rực rỡ */
          font-weight: 700 !important;
        }
        .code-editor-dark-theme .token.string,
        .code-editor-dark-theme .token.char,
        .code-editor-dark-theme .token.attr-value {
          color: #34d399 !important; /* Xanh ngọc lục bảo */
          font-weight: 500 !important;
        }
        .code-editor-dark-theme .token.function,
        .code-editor-dark-theme .token.class-name {
          color: #60a5fa !important; /* Xanh lam hoàng gia */
          font-weight: 600 !important;
        }
        .code-editor-dark-theme .token.number,
        .code-editor-dark-theme .token.boolean {
          color: #fb923c !important; /* Cam ấm */
          font-weight: 600 !important;
        }
        .code-editor-dark-theme .token.operator {
          color: #38bdf8 !important; /* Xanh da trời */
          font-weight: 700 !important;
        }
        .code-editor-dark-theme .token.punctuation {
          color: #cbd5e1 !important; /* Trắng xám sáng, không bị chìm vào nền tối */
          font-weight: 500 !important;
        }
        .code-editor-dark-theme .token.comment {
          color: #94a3b8 !important; /* Xám bạc sáng rõ nét, không bị trùng màu nền đen */
          font-style: italic !important;
          font-weight: 500 !important;
        }
        .code-editor-dark-theme .token.macro,
        .code-editor-dark-theme .token.directive,
        .code-editor-dark-theme .token.directive-hash {
          color: #fb7185 !important; /* Tiền xử lý C++ đỏ hồng tươi sáng */
          font-weight: 700 !important;
        }
        .code-editor-dark-theme .token.builtin {
          color: #38bdf8 !important; /* Hàm tích hợp sẵn xanh cyan sáng */
          font-weight: 600 !important;
        }
        .code-editor-dark-theme .token.tag {
          color: #f43f5e !important; /* Đỏ hoa hồng */
          font-weight: 700 !important;
        }
        .code-editor-dark-theme .token.attr-name,
        .code-editor-dark-theme .token.property {
          color: #facc15 !important; /* Vàng hổ phách */
          font-weight: 600 !important;
        }
        .code-editor-dark-theme .token.selector {
          color: #a855f7 !important;
          font-weight: 700 !important;
        }
        .code-editor-dark-theme .token.variable {
          color: #f1f5f9 !important;
        }
        .code-editor-dark-theme .token.constant {
          color: #fbbf24 !important;
        }
        .code-editor-dark-theme .token.sql-keyword {
          color: #c084fc !important;
          font-weight: 700 !important;
        }
        .code-editor-dark-theme textarea::placeholder {
          color: #94a3b8 !important; /* Placeholder sáng rõ, không bị trùng nền đen #090d16 */
          -webkit-text-fill-color: #94a3b8 !important;
          opacity: 0.75;
        }

        /* =========================================================
           LIGHT THEME TOKENS (Paper-Sharp High Contrast)
           ========================================================= */
        .code-editor-light-theme pre code {
          color: #0f172a !important; /* Biến, định danh: Đen than chì 100% */
          font-weight: 600 !important;
        }
        .code-editor-light-theme .token.keyword {
          color: #7c3aed !important; /* Tím sẫm siêu nét */
          font-weight: 800 !important;
        }
        .code-editor-light-theme .token.string,
        .code-editor-light-theme .token.char,
        .code-editor-light-theme .token.attr-value {
          color: #047857 !important; /* Xanh lá cây sẫm */
          font-weight: 600 !important;
        }
        .code-editor-light-theme .token.function,
        .code-editor-light-theme .token.class-name {
          color: #1d4ed8 !important; /* Xanh dương đậm */
          font-weight: 700 !important;
        }
        .code-editor-light-theme .token.number,
        .code-editor-light-theme .token.boolean {
          color: #b45309 !important; /* Nâu cam sẫm */
          font-weight: 700 !important;
        }
        .code-editor-light-theme .token.operator {
          color: #008a73 !important; /* Xanh ngọc đậm */
          font-weight: 800 !important;
        }
        .code-editor-light-theme .token.punctuation {
          color: #1e293b !important; /* Đen xám */
          font-weight: 700 !important;
        }
        .code-editor-light-theme .token.comment {
          color: #64748b !important;
          font-style: italic !important;
        }
        .code-editor-light-theme .token.tag {
          color: #0369a1 !important;
          font-weight: 800 !important;
        }
        .code-editor-light-theme .token.attr-name,
        .code-editor-light-theme .token.property {
          color: #92400e !important;
          font-weight: 700 !important;
        }
        .code-editor-light-theme .token.selector {
          color: #6d28d9 !important;
          font-weight: 800 !important;
        }
        .code-editor-light-theme .token.variable {
          color: #0f172a !important;
        }
        .code-editor-light-theme .token.constant {
          color: #b45309 !important;
        }
        .code-editor-light-theme .token.macro,
        .code-editor-light-theme .token.directive,
        .code-editor-light-theme .token.directive-hash {
          color: #b91c1c !important;
          font-weight: 800 !important;
        }
        .code-editor-light-theme .token.builtin {
          color: #0284c7 !important;
          font-weight: 700 !important;
        }
        .code-editor-light-theme .token.sql-keyword {
          color: #7c3aed !important;
          font-weight: 800 !important;
        }
        .code-editor-light-theme textarea::placeholder {
          color: #94a3b8 !important;
          -webkit-text-fill-color: #94a3b8 !important;
        }
      `}</style>

      {/* Mini Sub-Toolbar: Language Badge & Actions */}
      <div
        className={`flex items-center justify-between px-3 py-1.5 border-b text-[11px] font-sans select-none shrink-0 ${
          isDark ? 'border-slate-800 bg-[#060910] text-slate-400' : 'border-slate-200 bg-[#f8fafc] text-slate-600'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs">{langBadge}</span>
          <span className="text-[10px] opacity-70">({lines.length} dòng)</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-[10px] opacity-60 font-mono">Phím tắt: Ctrl + Enter để chạy</span>
          
          {onClear && !readOnly && (
            <button
              type="button"
              onClick={onClear}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-semibold transition-all ${
                isDark
                  ? 'bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border-slate-700 hover:border-rose-600/50'
                  : 'bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 border-slate-300 hover:border-rose-300 shadow-xs'
              }`}
              title="Xóa sạch toàn bộ mã nguồn"
            >
              <Trash2 className="h-3 w-3 text-rose-400" />
              <span>Xóa sạch</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Code Editing Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Line Numbers Column */}
        {showLineNumbers && (
          <div
            ref={lineNumbersRef}
            className={`select-none text-right font-mono text-xs shrink-0 w-11 overflow-hidden border-r ${
              isDark
                ? 'bg-[#060910] border-slate-800/80 text-slate-400 font-medium'
                : 'bg-[#f8fafc] border-slate-200 text-slate-400'
            }`}
            style={{
              paddingTop: '12px',
              paddingBottom: '12px',
              paddingRight: '10px',
              boxSizing: 'border-box',
            }}
          >
            {lines.map((_, i) => (
              <div key={i} style={{ height: '24px', lineHeight: '24px' }}>
                {i + 1}
              </div>
            ))}
          </div>
        )}

        {/* Interactive Editor Container */}
        <div className="custom-code-editor relative flex-1 h-full min-h-0 overflow-hidden">
          {/* Highlighted Pre (Behind) */}
          <pre
            ref={preRef}
            aria-hidden="true"
            className={`code-editor-pre absolute inset-0 m-0 pointer-events-none font-mono text-xs sm:text-sm overflow-hidden whitespace-pre language-${langKey}`}
            style={{
              padding: '12px',
              margin: 0,
              border: 0,
              background: 'transparent',
              lineHeight: '24px',
              fontSize: '13px',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              tabSize: 4,
              whiteSpace: 'pre',
              wordBreak: 'normal',
              boxSizing: 'border-box',
              zIndex: 1,
            }}
          >
            <code
              className={`language-${langKey}`}
              style={{
                background: 'transparent',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                lineHeight: 'inherit',
                whiteSpace: 'pre',
              }}
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            />
          </pre>

          {/* Transparent Interactive Textarea (Foreground) */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            readOnly={readOnly}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            className="code-editor-textarea absolute inset-0 w-full h-full m-0 font-mono text-xs sm:text-sm resize-none focus:outline-none overflow-auto whitespace-pre selection:bg-blue-500/30"
            style={{
              padding: '12px',
              margin: 0,
              border: 0,
              background: 'transparent',
              backgroundColor: 'transparent',
              lineHeight: '24px',
              fontSize: '13px',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              tabSize: 4,
              whiteSpace: 'pre',
              wordBreak: 'normal',
              boxSizing: 'border-box',
              color: 'transparent',
              WebkitTextFillColor: 'transparent',
              caretColor: isDark ? '#34d399' : '#008a73',
              zIndex: 2,
            }}
          />
        </div>
      </div>
    </div>
  );
};
