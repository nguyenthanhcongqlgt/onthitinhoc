import React from 'react';
import { QuestionMasked } from '../../types';
import { CodeViewer } from './CodeViewer';
import { MathFormula } from './MathFormula';
import { Star, CheckCircle2, Ban, Flag } from 'lucide-react';

interface QuestionCardPart1Props {
  question: QuestionMasked;
  selectedOptionId: number | null;
  onSelectOption: (questionId: number, optionId: number) => void;
  isFlagged?: boolean;
  onToggleFlag?: (questionId: number) => void;
  onReportQuestion?: (question: QuestionMasked) => void;
  eliminatedOptionIds?: number[];
  onToggleEliminate?: (questionId: number, optionId: number) => void;
  fontSize?: 'sm' | 'md' | 'lg';
  allowRunCode?: boolean;
}

export const QuestionCardPart1: React.FC<QuestionCardPart1Props> = ({
  question,
  selectedOptionId,
  onSelectOption,
  isFlagged = false,
  onToggleFlag,
  onReportQuestion,
  eliminatedOptionIds = [],
  onToggleEliminate,
  fontSize = 'md',
  allowRunCode = true,
}) => {
  const contentFontClass =
    fontSize === 'sm' ? 'text-sm' : fontSize === 'lg' ? 'text-lg leading-relaxed' : 'text-base';
  const optionFontClass =
    fontSize === 'sm' ? 'text-xs' : fontSize === 'lg' ? 'text-base' : 'text-sm';

  return (
    <div
      className={`rounded-3xl border transition-all duration-200 p-6 sm:p-7 shadow-sm ${
        isFlagged
          ? 'border-amber-400 bg-amber-50/20 shadow-amber-500/5 ring-2 ring-amber-400/30'
          : selectedOptionId !== null
          ? 'border-blue-200 bg-white hover:border-blue-300 hover:shadow-md'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-xl font-bold text-sm shadow-sm transition-colors ${
              selectedOptionId !== null
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            {question.display_number}
          </span>
          <div>
            <span className="font-bold text-slate-900 text-sm">
              Câu {question.display_number}
            </span>
            <span className="ml-2 text-xs font-semibold text-slate-500 hidden sm:inline">
              (Phần I • Trắc nghiệm 4 lựa chọn)
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

          <span className="inline-flex items-center rounded-xl bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-100">
            +{question.point !== undefined && question.point !== null ? question.point : 0.5} điểm
          </span>
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

      {/* 4 Options Grid */}
      <div className="mt-5 grid grid-cols-1 gap-3">
        {question.options.map((option) => {
          const isSelected = selectedOptionId === option.id;
          const isEliminated = eliminatedOptionIds.includes(option.id);

          return (
            <div
              key={option.id}
              onClick={() => onSelectOption(question.id, option.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onToggleEliminate) {
                  onToggleEliminate(question.id, option.id);
                }
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectOption(question.id, option.id);
                }
              }}
              className={`group flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition-all sm:p-4 ${
                isEliminated
                  ? 'border-slate-200 bg-slate-50 text-slate-400 opacity-70'
                  : isSelected
                  ? 'border-blue-400 bg-blue-50/50 ring-1 ring-blue-400 shadow-sm'
                  : 'border-slate-200 bg-slate-50/50 hover:border-blue-300 hover:bg-blue-50/30'
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl font-bold text-xs transition-all ${
                  isEliminated
                    ? 'bg-slate-200 text-slate-400 line-through'
                    : isSelected
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white border border-slate-300 text-slate-700 group-hover:border-blue-400 group-hover:text-blue-600'
                }`}
              >
                {option.display_label}
              </span>

              <div className={`flex-1 pt-0.5 font-medium leading-relaxed ${optionFontClass} ${isEliminated ? 'line-through' : ''}`}>
                <MathFormula text={option.content} allowRunCode={allowRunCode} />
                {option.code_snippet && (
                  <CodeViewer
                    code={option.code_snippet}
                    language="python"
                    className="!my-1.5 !p-2 text-xs"
                    allowRunCode={allowRunCode}
                  />
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 self-center">
                {/* Strike-through / Elimination Toggle Button */}
                {onToggleEliminate && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleEliminate(question.id, option.id);
                    }}
                    className={`p-1.5 rounded-xl transition-all ${
                      isEliminated
                        ? 'text-red-600 bg-red-100 hover:bg-red-200'
                        : 'text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50'
                    }`}
                    title={isEliminated ? 'Hủy gạch bỏ (Chuột phải)' : 'Gạch bỏ đáp án sai (Chuột phải)'}
                  >
                    <Ban className="h-4 w-4" />
                  </button>
                )}

                {isSelected && !isEliminated && (
                  <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
