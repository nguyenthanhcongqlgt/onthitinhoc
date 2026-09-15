import React from 'react';
import { QuestionMasked } from '../../types';
import { CodeViewer } from './CodeViewer';
import { MathFormula } from './MathFormula';
import { Check, X, Star, Flag } from 'lucide-react';

interface QuestionCardPart2Props {
  question: QuestionMasked;
  subAnswers: Record<string, boolean>; // { [optionId]: true/false }
  onSelectSubAnswer: (questionId: number, optionId: number, value: boolean) => void;
  isFlagged?: boolean;
  onToggleFlag?: (questionId: number) => void;
  onReportQuestion?: (question: QuestionMasked) => void;
  fontSize?: 'sm' | 'md' | 'lg';
  allowRunCode?: boolean;
}

export const QuestionCardPart2: React.FC<QuestionCardPart2Props> = ({
  question,
  subAnswers,
  onSelectSubAnswer,
  isFlagged = false,
  onToggleFlag,
  onReportQuestion,
  fontSize = 'md',
  allowRunCode = true,
}) => {
  const branchName =
    question.branch === 'CS'
      ? 'Khoa học Máy tính (CS)'
      : 'Tin học Ứng dụng (ICT)';

  const contentFontClass =
    fontSize === 'sm' ? 'text-sm' : fontSize === 'lg' ? 'text-lg leading-relaxed' : 'text-base';
  const optionFontClass =
    fontSize === 'sm' ? 'text-xs' : fontSize === 'lg' ? 'text-base' : 'text-sm';

  return (
    <div
      className={`rounded-3xl border transition-all duration-200 p-6 sm:p-7 shadow-sm ${
        isFlagged
          ? 'border-amber-400 bg-amber-50/20 shadow-amber-500/5 ring-2 ring-amber-400/30'
          : 'border-indigo-200 bg-white hover:border-indigo-300 hover:shadow-md'
      }`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-indigo-100 pb-3.5 mb-4 gap-2">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white shadow-sm text-sm">
            {question.display_number}
          </span>
          <div>
            <span className="font-bold text-slate-900 text-sm">
              Câu {question.display_number}
            </span>
            <span className="ml-2 inline-flex items-center rounded-lg bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-100">
              {branchName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Flag for Review Button */}
          {onToggleFlag && (
            <button
              type="button"
              onClick={() => onToggleFlag(question.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isFlagged
                  ? 'bg-amber-400 text-slate-950 shadow-sm font-bold ring-1 ring-amber-500'
                  : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
              }`}
            >
              <Star className={`h-3.5 w-3.5 ${isFlagged ? 'fill-slate-950' : ''}`} />
              <span>{isFlagged ? 'Đã Gắn Cờ' : 'Gắn Cờ ⭐'}</span>
            </button>
          )}

          {/* Report Question Dispute Button */}
          {onReportQuestion && (
            <button
              type="button"
              onClick={() => onReportQuestion(question)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
              title="Báo lỗi câu hỏi hoặc sai đáp án"
            >
              <Flag className="h-3.5 w-3.5 text-red-500" />
              <span className="hidden sm:inline">Báo lỗi</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-100">
            <span>+{(question.point !== undefined && question.point !== null ? question.point : 2.0)} điểm</span>
            <span className="hidden md:inline text-indigo-500 font-normal">
              (1ý={((question.point || 2.0) * 0.2).toFixed(1)}đ • 2ý={((question.point || 2.0) * 0.4).toFixed(1)}đ • 3ý={((question.point || 2.0) * 0.67).toFixed(1)}đ • 4ý={question.point || 2.0}đ)
            </span>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className={`text-slate-900 font-medium leading-relaxed mb-3 ${contentFontClass}`}>
        <MathFormula text={question.content} allowRunCode={allowRunCode} />
      </div>

      {/* Code Snippet if any */}
      {question.code_snippet && (
        <CodeViewer
          code={question.code_snippet}
          language={question.code_language || 'python'}
          fontSize={fontSize}
          allowRunCode={allowRunCode}
        />
      )}

      {/* Sub-items Table (a, b, c, d with True/False buttons) */}
      <div className="mt-5 space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
          <span>Xác định tính Đúng / Sai của từng mệnh đề dưới đây:</span>
          <span className="text-[11px] font-semibold text-indigo-600">
            {Object.keys(subAnswers).length}/4 ý đã chọn
          </span>
        </div>

        {question.options.map((option) => {
          const optKey = String(option.id);
          const currentAnswer = subAnswers[optKey]; // true, false, or undefined

          return (
            <div
              key={option.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border p-4 transition-all ${
                currentAnswer !== undefined
                  ? 'border-indigo-200 bg-indigo-50/40'
                  : 'border-slate-200 bg-slate-50/60 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-3.5 flex-1">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-slate-200 font-bold text-xs text-slate-800">
                  {option.display_label})
                </span>
                <div className={`font-medium text-slate-900 pt-0.5 leading-relaxed ${optionFontClass}`}>
                  <MathFormula text={option.content} allowRunCode={allowRunCode} />
                  {option.code_snippet && (
                    <CodeViewer
                      code={option.code_snippet}
                      language="python"
                      className="!my-1 !p-2 text-xs"
                      allowRunCode={allowRunCode}
                    />
                  )}
                </div>
              </div>

              {/* True / False Buttons */}
              <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => onSelectSubAnswer(question.id, option.id, true)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    currentAnswer === true
                      ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-600/30'
                      : 'bg-white border border-slate-300 text-slate-700 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50/50'
                  }`}
                >
                  <Check className="h-4 w-4" />
                  ĐÚNG
                </button>

                <button
                  type="button"
                  onClick={() => onSelectSubAnswer(question.id, option.id, false)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    currentAnswer === false
                      ? 'bg-red-600 text-white shadow-md ring-2 ring-red-600/30'
                      : 'bg-white border border-slate-300 text-slate-700 hover:border-red-500 hover:text-red-700 hover:bg-red-50/50'
                  }`}
                >
                  <X className="h-4 w-4" />
                  SAI
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
