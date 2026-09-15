import React, { useState, useEffect } from 'react';
import { ExamFolder } from '../../types';
import { foldersApi } from '../../services/api';
import {
  X,
  FolderPlus,
  Save,
  AlertCircle,
  Folder,
  BookOpen,
  Trophy,
  GraduationCap,
  Code2,
  Bookmark,
  Layers,
  Globe,
  Lock,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  folderToEdit?: ExamFolder | null;
  parentFolderId?: number | null;
  existingFolders: ExamFolder[];
}

const COLOR_OPTIONS = [
  { id: 'blue', name: 'Xanh dương', bg: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500' },
  { id: 'emerald', name: 'Xanh ngọc', bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500' },
  { id: 'purple', name: 'Tím hoa cà', bg: 'bg-purple-500', text: 'text-purple-400', border: 'border-purple-500' },
  { id: 'amber', name: 'Cam đất', bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500' },
  { id: 'cyan', name: 'Xanh lơ', bg: 'bg-cyan-500', text: 'text-cyan-400', border: 'border-cyan-500' },
  { id: 'rose', name: 'Hồng đỏ', bg: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500' },
];

const ICON_OPTIONS = [
  { id: 'folder', label: 'Thư mục', Icon: Folder },
  { id: 'book', label: 'Sách / Khối', Icon: BookOpen },
  { id: 'trophy', label: 'Học sinh giỏi', Icon: Trophy },
  { id: 'graduation-cap', label: 'Tốt nghiệp', Icon: GraduationCap },
  { id: 'code', label: 'Lập trình', Icon: Code2 },
  { id: 'layers', label: 'Chuyên đề', Icon: Layers },
  { id: 'bookmark', label: 'Ghi nhớ', Icon: Bookmark },
];

export const CreateFolderModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  folderToEdit,
  parentFolderId,
  existingFolders,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(folderToEdit?.name || '');
  const [description, setDescription] = useState(folderToEdit?.description || '');
  const [parentId, setParentId] = useState<number | null>(
    folderToEdit ? folderToEdit.parent : parentFolderId !== undefined ? parentFolderId : null
  );
  const [isShared, setIsShared] = useState<boolean>(folderToEdit ? folderToEdit.is_shared : true);
  const [color, setColor] = useState<string>(folderToEdit?.color || 'blue');
  const [icon, setIcon] = useState<string>(folderToEdit?.icon || 'folder');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setName(folderToEdit?.name || '');
      setDescription(folderToEdit?.description || '');
      setParentId(folderToEdit ? folderToEdit.parent : parentFolderId !== undefined ? parentFolderId : null);
      setIsShared(folderToEdit ? folderToEdit.is_shared : true);
      setColor(folderToEdit?.color || 'blue');
      setIcon(folderToEdit?.icon || 'folder');
      setErrorMsg('');
    }
  }, [isOpen, folderToEdit, parentFolderId]);

  // Exclude current folder and its potential descendants from parent choices when editing
  const eligibleParents = existingFolders.filter((f) => {
    if (!folderToEdit) return true;
    if (f.id === folderToEdit.id) return false;
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setErrorMsg('Vui lòng nhập tên thư mục.');

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const payload: Partial<ExamFolder> = {
        name: name.trim(),
        description: description.trim(),
        parent: parentId,
        is_shared: isShared,
        color,
        icon,
      };

      if (folderToEdit) {
        await foldersApi.updateFolder(folderToEdit.id, payload);
      } else {
        await foldersApi.createFolder(payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Lỗi khi lưu thư mục đề thi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-md`}>
              <FolderPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {folderToEdit ? 'Chỉnh Sửa Thư Mục Đề Thi' : parentId ? 'Thêm Thư Mục Con' : 'Tạo Thư Mục Gốc Mới'}
              </h3>
              <p className="text-xs text-slate-400">
                Tổ chức bài kiểm tra theo Khối, Chuyên đề hoặc Chủ đề môn học
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {/* Tên thư mục */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Tên thư mục <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Bài kiểm tra Khối 10, Chủ đề 1: Python,..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs sm:text-sm"
              autoFocus
            />
          </div>

          {/* Vị trí / Thư mục cha */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Vị trí thư mục (Thư mục cha)
            </label>
            <select
              value={parentId === null ? '' : parentId}
              onChange={(e) => setParentId(e.target.value === '' ? null : Number(e.target.value))}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="">📁 [Thư mục Gốc - Cấp cao nhất]</option>
              {eligibleParents.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.parent ? `↳ ${f.full_path || f.name}` : `📁 ${f.name}`}
                </option>
              ))}
            </select>
          </div>

          {/* Chế độ chia sẻ (Lựa chọn C) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Phạm vi sử dụng thư mục
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setIsShared(true)}
                className={`flex items-start gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                  isShared
                    ? 'border-blue-500 bg-blue-950/40 text-blue-200 shadow-sm shadow-blue-500/10'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <Globe className={`h-4 w-4 mt-0.5 shrink-0 ${isShared ? 'text-blue-400' : 'text-slate-500'}`} />
                <div>
                  <div className="font-bold text-xs">🌐 Dùng Chung Toàn Trường</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Tất cả GV cùng nhìn thấy & sử dụng chung trong Tổ Tin học.</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsShared(false)}
                className={`flex items-start gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                  !isShared
                    ? 'border-indigo-500 bg-indigo-950/40 text-indigo-200 shadow-sm shadow-indigo-500/10'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <Lock className={`h-4 w-4 mt-0.5 shrink-0 ${!isShared ? 'text-indigo-400' : 'text-slate-500'}`} />
                <div>
                  <div className="font-bold text-xs">🔒 Cá Nhân Của Tôi</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Thư mục riêng tư, chỉ tài khoản của Thầy/Cô nhìn thấy.</div>
                </div>
              </button>
            </div>
          </div>

          {/* Chọn Màu Sắc & Biểu Tượng Icon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Color picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Màu sắc nhận diện</label>
              <div className="flex items-center gap-2 flex-wrap bg-slate-950 p-2 rounded-xl border border-slate-800">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColor(c.id)}
                    className={`h-6 w-6 rounded-full ${c.bg} transition-all flex items-center justify-center ${
                      color === c.id ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                    }`}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Icon picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Biểu tượng Icon</label>
              <div className="flex items-center gap-1.5 flex-wrap bg-slate-950 p-2 rounded-xl border border-slate-800">
                {ICON_OPTIONS.map((item) => {
                  const IconComp = item.Icon;
                  const isSelected = icon === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setIcon(item.id)}
                      className={`p-1.5 rounded-lg text-xs transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                      title={item.label}
                    >
                      <IconComp className="h-3.5 w-3.5" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Mô tả thêm (Tùy chọn)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Ghi chú về nội dung các bài kiểm tra trong thư mục này..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>

          {/* Footer actions */}
          <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-500 transition-all shadow-md shadow-blue-600/30 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? 'Đang lưu...' : folderToEdit ? 'Cập Nhật Thư Mục' : 'Tạo Thư Mục'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
