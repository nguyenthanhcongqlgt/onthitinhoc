import React, { useState, useEffect } from 'react';
import { BankQuestion, BankQuestionOption, QuestionCategory } from '../../types';
import { bankApi } from '../../services/api';
import { X, Save, AlertCircle, Plus, Trash2, Code2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: QuestionCategory[];
  questionToEdit?: BankQuestion | null;
}

export const CreateBankQuestionModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, categories, questionToEdit }) => {
  if (!isOpen) return null;

  const [partType, setPartType] = useState<'PART_I' | 'PART_II'>(questionToEdit?.part_type || 'PART_I');
  const [branch, setBranch] = useState<'COMMON' | 'CS' | 'ICT'>(questionToEdit?.branch || 'COMMON');
  const [difficulty, setDifficulty] = useState<'NB' | 'TH' | 'VD' | 'VDC'>(questionToEdit?.difficulty_level || 'TH');
  const [categoryId, setCategoryId] = useState<number | ''>(questionToEdit?.category || '');
  
  const [content, setContent] = useState(questionToEdit?.content || '');
  const [codeSnippet, setCodeSnippet] = useState(questionToEdit?.code_snippet || '');
  const [codeLanguage, setCodeLanguage] = useState(questionToEdit?.code_language || 'python');
  const [explanation, setExplanation] = useState(questionToEdit?.explanation || '');

  const defaultOptions: BankQuestionOption[] = [
    { label: 'A', content: '', is_correct: true },
    { label: 'B', content: '', is_correct: false },
    { label: 'C', content: '', is_correct: false },
    { label: 'D', content: '', is_correct: false },
  ];
  
  const defaultPart2Options: BankQuestionOption[] = [
    { label: 'a', content: '', is_correct: true },
    { label: 'b', content: '', is_correct: false },
    { label: 'c', content: '', is_correct: true },
    { label: 'd', content: '', is_correct: false },
  ];

  const [options, setOptions] = useState<BankQuestionOption[]>(
    questionToEdit?.options?.length 
      ? questionToEdit.options 
      : (partType === 'PART_I' ? defaultOptions : defaultPart2Options)
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle changing part type (reset options)
  const handlePartTypeChange = (type: 'PART_I' | 'PART_II') => {
    setPartType(type);
    if (!questionToEdit) {
      setOptions(type === 'PART_I' ? defaultOptions : defaultPart2Options);
    }
  };

  const updateOption = (index: number, field: keyof BankQuestionOption, value: any) => {
    const newOptions = [...options];
    if (field === 'is_correct' && partType === 'PART_I') {
      newOptions.forEach(o => o.is_correct = false); // Only 1 correct in Part I
    }
    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return setErrorMsg('Vui lòng nhập nội dung câu hỏi.');
    
    // Validate Part I: must have at least 1 correct option
    if (partType === 'PART_I' && !options.some(o => o.is_correct)) {
      return setErrorMsg('Câu hỏi trắc nghiệm (Phần I) phải có ít nhất 1 đáp án đúng.');
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const payload = {
      category: categoryId || null,
      part_type: partType,
      branch,
      difficulty_level: difficulty,
      competency_category: 'PROG_BASIC',
      content,
      code_snippet: codeSnippet,
      code_language: codeLanguage,
      explanation,
      options
    };

    try {
      if (questionToEdit?.id) {
        await bankApi.updateQuestion(questionToEdit.id, payload);
      } else {
        await bankApi.createQuestion(payload);
      }
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Lỗi khi lưu câu hỏi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-4xl rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">
                {questionToEdit ? 'Chỉnh Sửa Câu Hỏi Ngân Hàng' : 'Thêm Câu Hỏi Mới'}
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col min-h-0">
          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form id="question-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Metadata Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Phần đề thi</label>
                <select value={partType} onChange={(e) => handlePartTypeChange(e.target.value as any)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none">
                  <option value="PART_I">Phần I (Trắc nghiệm)</option>
                  <option value="PART_II">Phần II (Đúng/Sai)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Chuyên đề / Thư mục</label>
                <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value) || '')} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none">
                  <option value="">-- Không phân loại --</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Phân nhánh</label>
                <select value={branch} onChange={(e) => setBranch(e.target.value as any)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none">
                  <option value="COMMON">Phần Chung</option>
                  <option value="CS">Khoa học máy tính (CS)</option>
                  <option value="ICT">Tin học ứng dụng (ICT)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Độ khó</label>
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none">
                  <option value="NB">Nhận biết</option>
                  <option value="TH">Thông hiểu</option>
                  <option value="VD">Vận dụng</option>
                  <option value="VDC">Vận dụng cao</option>
                </select>
              </div>
            </div>

            {/* Question Content */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nội dung câu hỏi <span className="text-red-400">*</span></label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                placeholder="Nhập nội dung câu hỏi (hỗ trợ LaTeX)..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none resize-y"
              />
            </div>

            {/* Code Snippet (Optional) */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Code2 className="h-4 w-4 text-emerald-400" />
                  Đoạn mã code (Tùy chọn)
                </label>
                {codeSnippet && (
                  <select value={codeLanguage} onChange={(e) => setCodeLanguage(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white">
                    <option value="python">Python</option>
                    <option value="cpp">C++</option>
                    <option value="sql">SQL</option>
                    <option value="html">HTML</option>
                    <option value="css">CSS</option>
                  </select>
                )}
              </div>
              <textarea
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                rows={3}
                placeholder="def hello_world(): ..."
                className="w-full font-mono rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-emerald-400 placeholder-slate-600 focus:border-emerald-500 focus:outline-none resize-y"
              />
            </div>

            {/* Options */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-3">Các phương án trả lời</label>
              <div className="space-y-3">
                {options.map((opt, idx) => (
                  <div key={idx} className={`flex items-start gap-3 rounded-xl border p-3 transition-colors ${opt.is_correct ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-800 bg-slate-950'}`}>
                    
                    {/* Correct Checkbox */}
                    <div className="pt-2">
                      <input 
                        type={partType === 'PART_I' ? 'radio' : 'checkbox'} 
                        name="correct_option"
                        checked={opt.is_correct}
                        onChange={(e) => updateOption(idx, 'is_correct', e.target.checked)}
                        className="w-5 h-5 accent-emerald-500 cursor-pointer"
                      />
                    </div>

                    {/* Label */}
                    <div className="w-12">
                      <input
                        type="text"
                        value={opt.label}
                        onChange={(e) => updateOption(idx, 'label', e.target.value)}
                        className="w-full text-center rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm font-bold text-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <textarea
                        value={opt.content}
                        onChange={(e) => updateOption(idx, 'content', e.target.value)}
                        rows={2}
                        placeholder="Nội dung phương án..."
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none resize-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Explanation */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Lời giải / Giải thích chi tiết (Tùy chọn)</label>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                rows={2}
                placeholder="Gợi ý giải bài cho học sinh..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none resize-y"
              />
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 pt-4 border-t border-slate-800 shrink-0">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
            Hủy
          </button>
          <button 
            type="submit" 
            form="question-form"
            disabled={isSubmitting} 
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{isSubmitting ? 'Đang lưu...' : 'Lưu Câu Hỏi'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
