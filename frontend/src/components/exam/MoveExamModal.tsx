import React, { useState, useEffect } from 'react';
import { ExamInfo, ExamFolder } from '../../types';
import { foldersApi } from '../../services/api';
import {
  X,
  FolderSymlink,
  Check,
  Search,
  AlertCircle,
  Folder,
  Globe,
  Lock,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  exam: ExamInfo | null;
  folders: ExamFolder[];
}

export const MoveExamModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  exam,
  folders,
}) => {
  if (!isOpen || !exam) return null;

  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(exam.folder || null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (isOpen && exam) {
      setSelectedFolderId(exam.folder || null);
      setSearchTerm('');
      setErrorMsg('');
    }
  }, [isOpen, exam]);

  const filteredFolders = folders.filter((f) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return f.name.toLowerCase().includes(q) || (f.full_path && f.full_path.toLowerCase().includes(q));
  });

  const sharedFolders = filteredFolders.filter((f) => f.is_shared);
  const privateFolders = filteredFolders.filter((f) => !f.is_shared);

  const handleMove = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await foldersApi.moveExams([exam.id], selectedFolderId);
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Lỗi khi di chuyển bài thi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <FolderSymlink className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Chuyển Thư Mục Bài Thi</h3>
              <p className="text-xs text-slate-400 line-clamp-1">
                {exam.title}
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

        {/* Current location banner */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
          <span className="text-slate-400">Vị trí hiện tại:</span>
          <span className="font-semibold text-blue-400 truncate max-w-[200px]">
            {exam.folder_path || exam.folder_name || 'Chưa phân loại'}
          </span>
        </div>

        {/* Search destination */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm thư mục chuyển đến..."
            className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
          />
        </div>

        {/* Folder selection list */}
        <div className="max-h-60 overflow-y-auto space-y-1 pr-1 border border-slate-800 rounded-2xl p-2 bg-slate-950/50">
          {/* Option: Uncategorized */}
          <button
            type="button"
            onClick={() => setSelectedFolderId(null)}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs text-left transition-all ${
              selectedFolderId === null
                ? 'bg-purple-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <span className="flex items-center gap-2">
              <Folder className="h-4 w-4 text-slate-500" />
              <span>📂 [Chưa phân loại] (Gỡ khỏi thư mục)</span>
            </span>
            {selectedFolderId === null && <Check className="h-4 w-4 shrink-0" />}
          </button>

          {/* Shared Folders Section */}
          {sharedFolders.length > 0 && (
            <div className="pt-2">
              <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-blue-400 flex items-center gap-1">
                <Globe className="h-3 w-3" />
                <span>Thư mục Dùng chung Toàn trường</span>
              </div>
              {sharedFolders.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFolderId(f.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs text-left transition-all ${
                    selectedFolderId === f.id
                      ? 'bg-purple-600 text-white font-bold shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <Folder className={`h-4 w-4 shrink-0 ${f.parent ? 'ml-3 text-purple-400' : 'text-blue-400'}`} />
                    <span className="truncate">{f.full_path || f.name}</span>
                  </span>
                  {selectedFolderId === f.id && <Check className="h-4 w-4 shrink-0 ml-2" />}
                </button>
              ))}
            </div>
          )}

          {/* Private Folders Section */}
          {privateFolders.length > 0 && (
            <div className="pt-2">
              <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                <Lock className="h-3 w-3" />
                <span>Thư mục Cá nhân Của tôi</span>
              </div>
              {privateFolders.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFolderId(f.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs text-left transition-all ${
                    selectedFolderId === f.id
                      ? 'bg-purple-600 text-white font-bold shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <Folder className={`h-4 w-4 shrink-0 ${f.parent ? 'ml-3 text-indigo-400' : 'text-indigo-400'}`} />
                    <span className="truncate">{f.full_path || f.name}</span>
                  </span>
                  {selectedFolderId === f.id && <Check className="h-4 w-4 shrink-0 ml-2" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleMove}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white hover:bg-purple-500 transition-all shadow-md shadow-purple-600/30 disabled:opacity-50"
          >
            <FolderSymlink className="h-4 w-4" />
            <span>{isSubmitting ? 'Đang chuyển...' : 'Xác Nhận Chuyển'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
