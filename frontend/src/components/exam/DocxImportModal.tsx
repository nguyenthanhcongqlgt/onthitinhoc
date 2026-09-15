import React, { useState, useEffect } from 'react';
import { examsApi, foldersApi } from '../../services/api';
import { ExamFolder } from '../../types';
import { CodeViewer } from './CodeViewer';
import { MathFormula } from './MathFormula';
import {
  FileText,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  X,
  Layers,
  Cpu,
  Globe,
  Sparkles,
  ArrowRight,
  Edit3,
  Check,
  Plus,
  Trash2,
  Folder,
} from 'lucide-react';

interface DocxImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialFolderId?: number | string;
}

export const DocxImportModal: React.FC<DocxImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialFolderId,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'visual_editor'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState<string>('');

  // Folders state
  const [folders, setFolders] = useState<ExamFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>(
    initialFolderId ? String(initialFolderId) : ''
  );

  // Form Metadata
  const [title, setTitle] = useState<string>('ĐỀ THI KHẢO SÁT TIN HỌC 2025 - THPT QUẤT LÂM');
  const [duration, setDuration] = useState<number>(50);
  const [matrixPreset, setMatrixPreset] = useState<string>('HSG_QUAT_LAM');
  const [accessType, setAccessType] = useState<'PUBLIC' | 'PROTECTED'>('PUBLIC');
  const [accessCode, setAccessCode] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      foldersApi.getFolders({ scope: 'all' }).then(setFolders).catch(console.error);
      if (initialFolderId !== undefined && initialFolderId !== null) {
        setSelectedFolderId(String(initialFolderId));
      }
    }
  }, [isOpen, initialFolderId]);

  // Processing state
  const [isPreviewing, setIsPreviewing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [parsedResult, setParsedResult] = useState<any | null>(null);
  const [editableQuestions, setEditableQuestions] = useState<any[]>([]);

  if (!isOpen) return null;

  const handleDownloadTemplate = async () => {
    try {
      await examsApi.downloadDocxTemplate();
    } catch (err) {
      alert('Không thể tải file mẫu. Vui lòng thử lại sau.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setErrorMsg('');
    }
  };

  const handlePreview = async () => {
    setErrorMsg('');
    if (activeTab === 'upload' && !selectedFile) {
      setErrorMsg('Vui lòng chọn file Word (.docx) để xem trước.');
      return;
    }
    if (activeTab === 'paste' && !pastedText.trim()) {
      setErrorMsg('Vui lòng dán nội dung văn bản đề thi.');
      return;
    }

    setIsPreviewing(true);
    const formData = new FormData();
    formData.append('action', 'preview');

    if (activeTab === 'upload' && selectedFile) {
      formData.append('file', selectedFile);
    } else {
      formData.append('text', pastedText);
    }

    try {
      const data = await examsApi.importDocx(formData);
      setParsedResult(data);
      setEditableQuestions(data.questions || []);
      if (data.exam_metadata?.title) {
        setTitle(data.exam_metadata.title);
      }
      if (data.exam_metadata?.duration_minutes) {
        setDuration(data.exam_metadata.duration_minutes);
      }
      if (data.exam_metadata?.matrix_preset) {
        setMatrixPreset(data.exam_metadata.matrix_preset);
      }
      setActiveTab('visual_editor');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || 'Lỗi bóc tách đề thi.');
    } finally {
      setIsPreviewing(false);
    }
  };

  // Visual Editor: Toggle Part 1 Correct Option
  const handleSelectPart1Option = (qIdx: number, optIdx: number) => {
    setEditableQuestions((prev) => {
      const updated = [...prev];
      const q = { ...updated[qIdx] };
      q.options = q.options.map((opt: any, i: number) => ({
        ...opt,
        is_correct: i === optIdx,
      }));
      updated[qIdx] = q;
      return updated;
    });
  };

  // Visual Editor: Toggle Part 2 Sub-item True/False
  const handleTogglePart2Subitem = (qIdx: number, optIdx: number) => {
    setEditableQuestions((prev) => {
      const updated = [...prev];
      const q = { ...updated[qIdx] };
      const opts = [...q.options];
      opts[optIdx] = {
        ...opts[optIdx],
        is_correct: !opts[optIdx].is_correct,
      };
      q.options = opts;
      updated[qIdx] = q;
      return updated;
    });
  };

  // Visual Editor: Change Difficulty Tag
  const handleChangeDifficulty = (qIdx: number, optIdx: number, diff: string) => {
    setEditableQuestions((prev) => {
      const updated = [...prev];
      const q = { ...updated[qIdx] };
      const opts = [...q.options];
      opts[optIdx] = {
        ...opts[optIdx],
        difficulty_level: diff,
      };
      q.options = opts;
      updated[qIdx] = q;
      return updated;
    });
  };

  const handleSaveExam = async () => {
    setIsSaving(true);
    setErrorMsg('');

    const formData = new FormData();
    formData.append('action', 'save');
    formData.append('title', title);
    formData.append('duration_minutes', String(duration));
    formData.append('matrix_preset', matrixPreset);
    formData.append('access_type', accessType);
    if (accessCode) {
      formData.append('access_code', accessCode);
    }
    if (selectedFolderId) {
      formData.append('folder_id', selectedFolderId);
    }

    if (activeTab === 'upload' && selectedFile && !parsedResult) {
      formData.append('file', selectedFile);
    } else {
      // Re-serialize questions if modified in Visual Editor
      formData.append('text', pastedText);
    }

    try {
      await examsApi.importDocx(formData);
      alert('Nhập đề thi và tạo ngân hàng câu hỏi thành công!');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || 'Lỗi khi lưu đề thi vào hệ thống.');
    } finally {
      setIsSaving(false);
    }
  };

  const part1List = editableQuestions.filter((q) => q.part_type === 'PART_I');
  const part2CommonList = editableQuestions.filter((q) => q.part_type === 'PART_II' && q.branch === 'COMMON');
  const part2CSList = editableQuestions.filter((q) => q.part_type === 'PART_II' && q.branch === 'CS');
  const part2ICTList = editableQuestions.filter((q) => q.part_type === 'PART_II' && q.branch === 'ICT');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-5 animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl text-slate-100 overflow-hidden">
        {/* Modal Header (Azota Style) */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-md text-white">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                TRÌNH SOẠN THẢO & NHẬP ĐỀ THI (CHUẨN AZOTA / BỘ GD&ĐT)
                <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                  v2.0
                </span>
              </h3>
              <p className="text-xs text-blue-400 font-medium">
                Tự động nhận diện Thẻ [0,NB], [1,TH], [2,VD], Dấu *, Chữ đỏ, Đa phương án/dòng & Bảng đáp án
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Helper & Template Download */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-blue-950/40 border border-blue-800/40 p-4">
            <div className="text-xs text-blue-200">
              💡 Hỗ trợ đầy đủ format Azota: <code className="text-amber-300 font-mono">*A. ... B. ...</code>, thẻ <code className="text-amber-300 font-mono">*a)[0,NB]</code> và bảng đáp án <code className="text-amber-300 font-mono">1A 2B 3C</code> ở cuối đề.
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 shadow-md transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              Tải File Word Mẫu (.docx)
            </button>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`pb-3 px-4 border-b-2 transition-all ${
                activeTab === 'upload'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              📁 Tải file Word (.docx)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`pb-3 px-4 border-b-2 transition-all ${
                activeTab === 'paste'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              📋 Dán văn bản đề (Azota Format)
            </button>
            {editableQuestions.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('visual_editor')}
                className={`pb-3 px-4 border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'visual_editor'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Trình Biên Tập Trực Quan ({editableQuestions.length} câu)</span>
              </button>
            )}
          </div>

          {/* TAB 1: UPLOAD FILE */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div className="rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/50 p-8 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  id="docx-file-input"
                  accept=".docx,.doc"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="docx-file-input"
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-blue-400 shadow-inner">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white">
                      {selectedFile ? selectedFile.name : 'Chọn hoặc kéo thả file Word (.docx) vào đây'}
                    </span>
                    <p className="text-xs text-slate-400 mt-1">
                      Hệ thống tự quét màu chữ đỏ, dấu *, thẻ [0,NB] và bảng đáp án ở cuối trang
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handlePreview}
                  disabled={isPreviewing}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-500 shadow-md disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  {isPreviewing ? 'Đang phân tích...' : 'Bóc Tách & Mở Trình Biên Tập'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PASTE RAW TEXT */}
          {activeTab === 'paste' && (
            <div className="space-y-4">
              <textarea
                rows={12}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder={`Phần 1. TRẮC NGHIỆM\nCâu 1. Trong cuộc khai thác thuộc địa...\n*A. Ngành chế tạo máy.    B. Công nghiệp luyện kim.\nC. Đồn điền cao su.      D. Công nghiệp hóa chất.\n\nPHẦN II. Câu trắc nghiệm đúng sai...\nCâu 4. Một cuộc thi bắn cung...\n*a)[0,NB] Số người bắn trượt...\nb)[1,NB] Số người bắn trượt...\n\n--------------------HẾT--------------------\nBảng đáp án\n1A 2B 3C\nCâu 4: a)Đ b)S c)S d)Đ`}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-4 font-mono text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none leading-relaxed"
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handlePreview}
                  disabled={isPreviewing}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-500 shadow-md disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  {isPreviewing ? 'Đang phân tích...' : 'Bóc Tách & Mở Trình Biên Tập'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: VISUAL EXAM EDITOR (AZOTA STYLE) */}
          {activeTab === 'visual_editor' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Exam Settings Toolbar */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300">
                    Cấu hình Đề thi:
                  </h4>
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <span className="rounded-lg bg-blue-500/20 px-2.5 py-1 text-blue-300 border border-blue-500/30">
                      Phần I: {part1List.length} câu
                    </span>
                    <span className="rounded-lg bg-indigo-500/20 px-2.5 py-1 text-indigo-300 border border-indigo-500/30">
                      Phần II Chung: {part2CommonList.length} câu
                    </span>
                    {(part2CSList.length > 0 || part2ICTList.length > 0) && (
                      <span className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-emerald-300 border border-emerald-500/30">
                        Phần II Riêng: {part2CSList.length} CS / {part2ICTList.length} ICT
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 font-semibold mb-1">Tên đề thi *</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Thời gian thi (phút)</label>
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Thư mục lưu trữ</label>
                    <select
                      value={selectedFolderId}
                      onChange={(e) => setSelectedFolderId(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">📁 Chưa phân loại (Gốc)</option>
                      {folders.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.is_shared ? '🌐' : '🔒'} {f.path_display || f.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* AZOTA SECTION 1: PHẦN 1. TRẮC NGHIỆM */}
              {part1List.length > 0 && (
                <div className="space-y-4">
                  {/* Group Header Bar (Azota Style) */}
                  <div className="flex items-center justify-between rounded-xl bg-slate-950 border border-slate-800 p-3.5">
                    <div className="flex items-center gap-2">
                      <span className="h-4 w-1 rounded-full bg-blue-500"></span>
                      <span className="font-bold text-xs uppercase text-slate-200">
                        PHẦN 1. TRẮC NGHIỆM ({part1List.length} câu • 0.4đ/câu)
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-semibold">
                      Click vào ô phương án để đổi đáp án đúng
                    </span>
                  </div>

                  {/* Questions List */}
                  <div className="space-y-4">
                    {part1List.map((q, qIdx) => {
                      const globalIdx = editableQuestions.findIndex((item) => item === q);
                      return (
                        <div
                          key={qIdx}
                          className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-3 shadow-sm hover:border-slate-700 transition-colors"
                        >
                          {/* Question Card Header (Azota Style) */}
                          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="rounded-lg bg-blue-600/20 px-2.5 py-1 font-bold text-xs text-blue-400 border border-blue-500/30">
                                Câu {q.order_index}.
                              </span>
                              <span className="text-xs font-semibold text-slate-400">
                                Trắc nghiệm 4 lựa chọn
                              </span>
                            </div>
                            <span className="rounded bg-slate-900 px-2 py-0.5 text-[11px] text-slate-400 border border-slate-800">
                              {q.competency_category} • {q.difficulty_level}
                            </span>
                          </div>

                          {/* Content */}
                          <div className="text-xs text-slate-200 leading-relaxed font-medium">
                            <MathFormula text={q.content} />
                          </div>

                          {q.code_snippet && (
                            <CodeViewer code={q.code_snippet} language={q.code_language} className="!my-2 !p-2 text-xs" />
                          )}

                          {/* Options Box (Azota Style) */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                            {q.options.map((opt: any, optIdx: number) => (
                              <button
                                key={optIdx}
                                type="button"
                                onClick={() => handleSelectPart1Option(globalIdx, optIdx)}
                                className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition-all ${
                                  opt.is_correct
                                    ? 'border-blue-500 bg-blue-500/15 text-blue-200 ring-1 ring-blue-500/40 shadow-sm'
                                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                                }`}
                              >
                                <span
                                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-bold text-xs ${
                                    opt.is_correct
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                                  }`}
                                >
                                  {opt.label}
                                </span>
                                <div className="flex-1 pt-0.5 text-xs font-medium">
                                  <MathFormula text={opt.content} />
                                </div>
                                {opt.is_correct && (
                                  <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0 self-center" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* AZOTA SECTION 2: PHẦN II. TRẮC NGHIỆM ĐÚNG SAI */}
              {(part2CommonList.length > 0 || part2CSList.length > 0 || part2ICTList.length > 0) && (
                <div className="space-y-4 pt-4">
                  {/* Group Header Bar */}
                  <div className="flex items-center justify-between rounded-xl bg-slate-950 border border-slate-800 p-3.5">
                    <div className="flex items-center gap-2">
                      <span className="h-4 w-1 rounded-full bg-indigo-500"></span>
                      <span className="font-bold text-xs uppercase text-slate-200">
                        PHẦN II. CÂU TRẮC NGHIỆM ĐÚNG SAI (Thí sinh chọn Đúng hoặc Sai trong mỗi ý a, b, c, d)
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-semibold">
                      Click checkbox để chuyển Đúng/Sai • Chọn mức độ NB, TH, VD ở góc phải
                    </span>
                  </div>

                  {/* Part 2 Questions List */}
                  <div className="space-y-4">
                    {editableQuestions
                      .filter((q) => q.part_type === 'PART_II')
                      .map((q, qIdx) => {
                        const globalIdx = editableQuestions.findIndex((item) => item === q);
                        return (
                          <div
                            key={qIdx}
                            className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-3 shadow-sm hover:border-slate-700 transition-colors"
                          >
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                              <div className="flex items-center gap-2">
                                <span className="rounded-lg bg-indigo-600/20 px-2.5 py-1 font-bold text-xs text-indigo-400 border border-indigo-500/30">
                                  Câu {q.order_index}.
                                </span>
                                <span className="text-xs font-semibold text-slate-400">
                                  Trắc nghiệm Đúng/Sai • {q.branch === 'COMMON' ? 'Phần Chung' : `Nhánh ${q.branch}`}
                                </span>
                              </div>
                              <span className="text-[11px] font-bold text-indigo-400 bg-indigo-950 px-2.5 py-0.5 rounded-lg border border-indigo-800/60">
                                Ma trận 4 ý
                              </span>
                            </div>

                            {/* Prompt */}
                            <div className="text-xs text-slate-200 leading-relaxed font-medium">
                              <MathFormula text={q.content} />
                            </div>

                            {q.code_snippet && (
                              <CodeViewer code={q.code_snippet} language={q.code_language} className="!my-2 !p-2 text-xs" />
                            )}

                            {/* Sub-items (Azota Style) */}
                            <div className="space-y-2 pt-1">
                              {q.options.map((opt: any, optIdx: number) => (
                                <div
                                  key={optIdx}
                                  className={`flex items-center justify-between gap-3 rounded-xl border p-3 transition-all ${
                                    opt.is_correct
                                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200'
                                      : 'border-slate-800 bg-slate-900/60 text-slate-400'
                                  }`}
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleTogglePart2Subitem(globalIdx, optIdx)}
                                    className="flex items-center gap-3 text-left flex-1"
                                  >
                                    <span
                                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-bold text-xs ${
                                        opt.is_correct
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                                      }`}
                                    >
                                      {opt.label})
                                    </span>
                                    <div className="text-xs font-medium flex-1">
                                      <MathFormula text={opt.content} />
                                    </div>
                                    <span
                                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                        opt.is_correct
                                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                          : 'bg-red-500/20 text-red-300 border border-red-500/40'
                                      }`}
                                    >
                                      {opt.is_correct ? 'ĐÚNG' : 'SAI'}
                                    </span>
                                  </button>

                                  {/* Difficulty Badge (Azota style tag: NB, TH, VD, VDC) */}
                                  <select
                                    value={opt.difficulty_level || 'TH'}
                                    onChange={(e) => handleChangeDifficulty(globalIdx, optIdx, e.target.value)}
                                    className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] font-mono font-bold text-slate-300 focus:border-blue-500 focus:outline-none"
                                  >
                                    <option value="NB">NB</option>
                                    <option value="TH">TH</option>
                                    <option value="VD">VD</option>
                                    <option value="VDC">VDC</option>
                                  </select>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 px-6 py-4 bg-slate-950/80">
          <div className="text-xs text-slate-400">
            {editableQuestions.length > 0 && (
              <span>Đã sẵn sàng nhập <strong>{editableQuestions.length} câu hỏi</strong> vào hệ thống.</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Hủy
            </button>
            {editableQuestions.length > 0 && (
              <button
                type="button"
                onClick={handleSaveExam}
                disabled={isSaving}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 disabled:opacity-50 transition-all"
              >
                <ArrowRight className="h-4 w-4" />
                {isSaving ? 'Đang lưu đề thi...' : 'Xác Nhận & Lưu Đề Thi Vào Hệ Thống'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
