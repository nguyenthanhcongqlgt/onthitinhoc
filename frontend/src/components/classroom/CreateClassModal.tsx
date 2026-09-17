import React, { useState, useEffect } from 'react';
import { ClassRoom, GradeLevel } from '../../types';
import { classApi } from '../../services/api';
import { X, GraduationCap, AlertCircle, CheckCircle2 } from 'lucide-react';

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (classroom: ClassRoom) => void;
  classToEdit?: ClassRoom | null;
}

export const CreateClassModal: React.FC<CreateClassModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  classToEdit,
}) => {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<GradeLevel>('12');
  const [schoolYear, setSchoolYear] = useState('2025-2026');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (classToEdit) {
      setName(classToEdit.name);
      setGrade(classToEdit.grade || '12');
      setSchoolYear(classToEdit.school_year || '2025-2026');
      setDescription(classToEdit.description || '');
    } else {
      setName('');
      setGrade('12');
      setSchoolYear('2025-2026');
      setDescription('');
    }
    setError('');
  }, [classToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Vui lòng nhập tên lớp học.');
      return;
    }

    setIsLoading(true);
    try {
      if (classToEdit) {
        const updated = await classApi.updateClass(classToEdit.id, {
          name: name.trim(),
          grade,
          school_year: schoolYear.trim(),
          description: description.trim(),
        });
        onSuccess(updated);
      } else {
        const created = await classApi.createClass({
          name: name.trim(),
          grade,
          school_year: schoolYear.trim(),
          description: description.trim(),
        });
        onSuccess(created);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || err.response?.data?.name?.[0] || 'Có lỗi xảy ra khi lưu thông tin lớp học.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-slate-400 hover:text-white transition-colors z-10"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="p-6 sm:p-8 shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-md">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div className="pr-6">
              <h3 className="text-lg font-bold text-white">
                {classToEdit ? 'Chỉnh Sửa Lớp Học' : 'Tạo Lớp Học Mới'}
              </h3>
              <p className="text-xs text-slate-400">
                {classToEdit
                  ? `Cập nhật thông tin cho lớp: ${classToEdit.name}`
                  : 'Khởi tạo lớp mới để phân nhóm học sinh và giao đề thi'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden min-h-0">
          <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar space-y-4">
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                <AlertCircle size={16} className="shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Tên lớp học <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="vd: 12A1 (HSG Tin học), Đội tuyển Tỉnh 2025"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Khối lớp
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value as GradeLevel)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-3 text-sm text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="12">Khối 12</option>
                  <option value="11">Khối 11</option>
                  <option value="10">Khối 10</option>
                  <option value="HSG">Đội tuyển HSG</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Năm học
                </label>
                <input
                  type="text"
                  value={schoolYear}
                  onChange={(e) => setSchoolYear(e.target.value)}
                  placeholder="2025-2026"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Ghi chú / Mô tả lớp học
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả mục tiêu lớp học, lịch học, lưu ý cho học sinh..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="p-6 sm:p-8 pt-4 border-t border-slate-800 shrink-0 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition-all"
            >
              {isLoading ? (
                <span>Đang lưu...</span>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>{classToEdit ? 'Cập Nhật Lớp' : 'Tạo Lớp Ngay'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
