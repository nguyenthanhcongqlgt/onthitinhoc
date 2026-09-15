import React, { useState, useEffect } from 'react';
import katex from 'katex';
import { CodeViewer } from './CodeViewer';
import { X, ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';

interface MathFormulaProps {
  text: string;
  className?: string;
  allowRunCode?: boolean;
}

export const MathFormula: React.FC<MathFormulaProps> = ({ text, className = '', allowRunCode = true }) => {
  const [lightboxImg, setLightboxImg] = useState<{ url: string; alt: string } | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Handle ESC key to close image modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && lightboxImg) {
        setLightboxImg(null);
        setZoomLevel(1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImg]);

  const handleOpenLightbox = (url: string, alt: string) => {
    setLightboxImg({ url, alt });
    setZoomLevel(1);
  };

  const handleCloseLightbox = () => {
    setLightboxImg(null);
    setZoomLevel(1);
  };

  if (!text) return null;

  // Split text by Code Blocks (```lang...```, [CODE]...[/CODE]), Inline Code (`...`), Images, and LaTeX
  const renderFormattedText = (raw: string) => {
    const tokenRegex = /(```[a-zA-Z0-9_\+]*\s*\n[\s\S]*?```|\[CODE(?:_|\s+)?(?:[a-zA-Z0-9_\+]*)\][\s\S]*?\[\/CODE(?:_[a-zA-Z0-9_\+]*)?\]|`[^`\n]+`|\$\$[\s\S]*?\$\$|\$[^\$]+?\$|!\[(?:[^\]]*)\]\((?:[^\)]+)\)|\[IMAGE:\s*[^\]]+\])/gi;
    const parts = raw.split(tokenRegex);

    return parts.map((part, index) => {
      if (!part) return null;

      // 1. Code Block: ```lang\n...```
      const codeFenceMatch = /^```([a-zA-Z0-9_\+]*)\s*\n([\s\S]*?)```$/i.exec(part);
      if (codeFenceMatch) {
        const lang = codeFenceMatch[1].trim().toLowerCase() || 'python';
        const codeContent = codeFenceMatch[2].trim();
        return (
          <div key={index} className="my-1.5 text-left" onClick={(e) => e.stopPropagation()}>
            <CodeViewer code={codeContent} language={lang} className="!my-0 !p-1 text-xs" allowRunCode={allowRunCode} />
          </div>
        );
      }

      // [CODE_CPP]...[/CODE_CPP] tag
      const tagCodeMatch = /^\[CODE(?:_|\s+)?([a-zA-Z0-9_\+]*)\]([\s\S]*?)\[\/CODE(?:_[a-zA-Z0-9_\+]*)?\]$/i.exec(part);
      if (tagCodeMatch) {
        let lang = tagCodeMatch[1].trim().toLowerCase() || 'python';
        if (lang === 'c++' || lang === 'cplusplus') lang = 'cpp';
        const codeContent = tagCodeMatch[2].trim();
        return (
          <div key={index} className="my-1.5 text-left" onClick={(e) => e.stopPropagation()}>
            <CodeViewer code={codeContent} language={lang} className="!my-0 !p-1 text-xs" allowRunCode={allowRunCode} />
          </div>
        );
      }

      // 2. Inline Code: `code`
      const inlineCodeMatch = /^`([^`\n]+)`$/.exec(part);
      if (inlineCodeMatch) {
        return (
          <code
            key={index}
            className="rounded bg-slate-800/90 px-1.5 py-0.5 font-mono text-[11px] text-amber-300 border border-slate-700/80 mx-0.5 inline-block align-middle"
          >
            {inlineCodeMatch[1]}
          </code>
        );
      }

      // 3. Markdown image: ![alt](url)
      const imgMatch = /^!\[(.*?)\]\((.*?)\)$/i.exec(part);
      if (imgMatch) {
        const altText = imgMatch[1] || 'Hình ảnh';
        let imgUrl = imgMatch[2].trim();
        if (imgUrl.startsWith('/') && !imgUrl.startsWith('//') && !imgUrl.startsWith('/api') && !imgUrl.startsWith('http')) {
          imgUrl = `http://127.0.0.1:8000${imgUrl}`;
        }
        return (
          <span key={index} className="my-2 block text-center">
            <span className="relative inline-block group">
              <img
                src={imgUrl}
                alt={altText}
                className="max-h-72 max-w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-950 p-1 shadow-md object-contain inline-block hover:shadow-lg transition-all cursor-zoom-in"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenLightbox(imgUrl, altText);
                }}
                loading="lazy"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenLightbox(imgUrl, altText);
                }}
                className="absolute bottom-2 right-2 rounded-lg bg-slate-900/80 p-1.5 text-white backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-900"
                title="Phóng to ảnh"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </span>
          </span>
        );
      }

      // 4. Custom tag: [IMAGE: url]
      const customImgMatch = /^\[IMAGE:\s*(.*?)\]$/i.exec(part);
      if (customImgMatch) {
        let imgUrl = customImgMatch[1].trim();
        if (imgUrl.startsWith('/') && !imgUrl.startsWith('//') && !imgUrl.startsWith('/api') && !imgUrl.startsWith('http')) {
          imgUrl = `http://127.0.0.1:8000${imgUrl}`;
        }
        return (
          <span key={index} className="my-2 block text-center">
            <span className="relative inline-block group">
              <img
                src={imgUrl}
                alt="Hình ảnh đề thi"
                className="max-h-72 max-w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-950 p-1 shadow-md object-contain inline-block hover:shadow-lg transition-all cursor-zoom-in"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenLightbox(imgUrl, 'Hình ảnh đề thi');
                }}
                loading="lazy"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenLightbox(imgUrl, 'Hình ảnh đề thi');
                }}
                className="absolute bottom-2 right-2 rounded-lg bg-slate-900/80 p-1.5 text-white backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-900"
                title="Phóng to ảnh"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </span>
          </span>
        );
      }

      // 5. Block LaTeX: $$...$$
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const formula = part.slice(2, -2);
        try {
          const html = katex.renderToString(formula, { displayMode: true, throwOnError: false });
          return (
            <span
              key={index}
              className="my-2 block overflow-x-auto text-center"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch (e) {
          return <span key={index}>{part}</span>;
        }
      }

      // 6. Inline LaTeX: $...$
      if (part.startsWith('$') && part.endsWith('$')) {
        const formula = part.slice(1, -1);
        try {
          const html = katex.renderToString(formula, { displayMode: false, throwOnError: false });
          return (
            <span
              key={index}
              className="inline-block px-0.5 align-middle"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch (e) {
          return <span key={index}>{part}</span>;
        }
      }

      // 7. Plain text with Smart Code & HTML Tag Recognition
      return (
        <span key={index} className="whitespace-pre-line leading-relaxed">
          {renderSmartText(part)}
        </span>
      );
    });
  };

  // Auto-detect HTML tags, CSS rules, SQL queries, and multiline code grids in raw text
  const renderSmartText = (content: string) => {
    // If the content is multiline and structured like code or a table grid (e.g. Câu 11 options)
    const trimmed = content.trim();
    if (
      content.includes('\n') &&
      (content.includes('    ') || content.includes('\t') || /^(def |class |for |while |if |#include|SELECT |CREATE |DELETE |INSERT |UPDATE |<\w+|@media|[.#]?[a-zA-Z0-9_\-]+\s*\{)/m.test(trimmed))
    ) {
      return (
        <pre className="my-1.5 p-2 rounded-lg bg-slate-950/90 font-mono text-xs text-indigo-200 border border-slate-800 overflow-x-auto whitespace-pre leading-normal">
          {content}
        </pre>
      );
    }

    // Tokenize HTML tags (<tag>...</tag> or <tag />), CSS rules, and SQL statements (SELECT, DELETE FROM, UPDATE, INSERT INTO, DROP, REMOVE FROM, etc.)
    const smartRegex = /(<[a-zA-Z][a-zA-Z0-9_\-]*(?:\s+[^>]*)?>[\s\S]*?<\/[a-zA-Z][a-zA-Z0-9_\-]*>|<[a-zA-Z][a-zA-Z0-9_\-]*(?:\s+[^>]*)?\s*\/?>|[a-zA-Z0-9_\-\.#\s,>+]+?\s*\{[^}]+\}|\b(?:SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM|REMOVE\s+FROM|DROP\s+(?:TABLE|FROM)?|CLEAR\s+FROM|CREATE\s+TABLE|ALTER\s+TABLE|TRUNCATE\s+TABLE)\b[\s\S]*?(?:;|$))/gi;
    const subParts = content.split(smartRegex);

    if (subParts.length <= 1) {
      return content;
    }

    return subParts.map((sub, sIdx) => {
      if (!sub) return null;
      if (smartRegex.test(sub)) {
        return (
          <code
            key={sIdx}
            className="rounded bg-slate-900 px-1.5 py-0.5 font-mono text-[11px] text-sky-300 border border-slate-700/80 mx-0.5 inline-block align-middle shadow-xs"
          >
            {sub}
          </code>
        );
      }
      return <span key={sIdx}>{sub}</span>;
    });
  };

  return (
    <>
      <span className={className}>{renderFormattedText(text)}</span>

      {/* Image Zoom Lightbox Modal (Anti-Cheat Safe) */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in select-none"
          onClick={handleCloseLightbox}
        >
          {/* Top Controls Bar */}
          <div
            className="absolute top-4 right-4 flex items-center gap-2 z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center rounded-2xl bg-slate-900/90 border border-slate-700 p-1 shadow-lg text-slate-200">
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.max(0.5, prev - 0.25))}
                className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-300 hover:text-white"
                title="Thu nhỏ"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="px-2 font-mono text-xs font-bold text-slate-300">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.min(3, prev + 0.25))}
                className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-300 hover:text-white"
                title="Phóng to"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-300 hover:text-white border-l border-slate-700 ml-1 pl-2"
                title="Đặt lại kích thước (100%)"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleCloseLightbox}
              className="p-2.5 rounded-2xl bg-red-600/90 text-white hover:bg-red-600 shadow-lg transition-all"
              title="Đóng (Esc)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Image Container with Pan/Scroll */}
          <div
            className="max-h-[85vh] max-w-[90vw] overflow-auto rounded-2xl p-2 flex items-center justify-center cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImg.url}
              alt={lightboxImg.alt}
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
              className="max-h-[80vh] max-w-[85vw] object-contain rounded-xl shadow-2xl transition-transform duration-200 border border-slate-700/50"
            />
          </div>

          <p className="mt-3 text-xs text-slate-400 font-medium">
            💡 Nhấn phím <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-slate-200">Esc</kbd> hoặc bấm ra ngoài để quay lại bài thi
          </p>
        </div>
      )}
    </>
  );
};
