import React, { useState, useEffect } from 'react';
import { QuestionCategory } from '../../types';
import { bankApi } from '../../services/api';
import { X, FolderPlus, Save, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categoryToEdit?: QuestionCategory | null;
}

export const CreateCategoryModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, categoryToEdit }) => {
  if (!isOpen) return null;

  const [name, setName] = useState(categoryToEdit?.name || '');
  const [description, setDescription] = useState(categoryToEdit?.description || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(categoryToEdit?.name || '');
      setDescription(categoryToEdit?.description || '');
      setErrorMsg('');
    }
  }, [isOpen, categoryToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setErrorMsg('Vui lòng nhập tên chuyên đề/thư mục.');
    
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      if (categoryToEdit) {
        await bankApi.updateCategory(categoryToEdit.id, { name, description });
      } else {
        await bankApi.createCategory({ name, description });
      }
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Lỗi khi lưu chuyên đề.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <FolderPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {categoryToEdit ? 'Chỉnh Sửa Chuyên Đề' : 'Tạo Chuyên Đề Mới'}
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden min-h-0">
          <div className="p-6 overflow-y-auto custom-scrollbar space-y-4 text-sm">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tên chuyên đề <span className="text-red-400">*</span></label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (e.target.value.trim()) setErrorMsg('');
                }}
                placeholder="Ví dụ: Hàm và mảng một chiều"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Mô tả thêm (Tùy chọn)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Ghi chú về độ khó hoặc nội dung bao quát..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              />
            </div>
          </div>

          <div className="p-6 pt-4 border-t border-slate-800 flex justify-end gap-3 shrink-0">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white">
              Hủy
            </button>
            <button type="submit" disabled={isSubmitting} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-all disabled:opacity-50">
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? 'Đang lưu...' : 'Lưu Chuyên Đề'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
