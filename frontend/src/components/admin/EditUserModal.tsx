import React, { useState } from 'react';
import { authApi } from '../../services/api';
import { User } from '../../types';
import { UserCheck, X, CheckCircle2, AlertCircle, Save } from 'lucide-react';

interface Props {
  targetUser: User;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditUserModal: React.FC<Props> = ({ targetUser, onClose, onSuccess }) => {
  const [fullName, setFullName] = useState<string>(targetUser.full_name || '');
  const [className, setClassName] = useState<string>(targetUser.class_name || '');
  const [studentId, setStudentId] = useState<string>(targetUser.student_id || '');
  const [email, setEmail] = useState<string>(targetUser.email || '');
  const [phoneNumber, setPhoneNumber] = useState<string>(targetUser.phone_number || '');
  const [school, setSchool] = useState<string>(targetUser.school || 'THPT Quất Lâm');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      await authApi.updateUser(targetUser.id, {
        full_name: fullName.trim(),
        class_name: className.trim(),
        student_id: studentId.trim(),
        email: email.trim(),
        phone_number: phoneNumber.trim(),
        school: school.trim(),
      });

      setSuccessMsg('Cập nhật thông tin tài khoản thành công!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Không thể cập nhật thông tin người dùng.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Chỉnh Sửa Thông Tin Thí Sinh</h3>
              <p className="text-xs text-slate-400">
                Tài khoản: <span className="font-semibold text-blue-400">{targetUser.username}</span> ({targetUser.role})
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

        <form onSubmit={handleUpdate} className="flex flex-col overflow-hidden min-h-0">
          <div className="p-6 overflow-y-auto custom-scrollbar space-y-3.5 text-xs">
            {error && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Họ và tên thí sinh:
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Lớp học / Đội tuyển: <span className="text-blue-400 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="Ví dụ: 12A1, Đội tuyển HSG"
                  className="w-full rounded-xl border border-blue-500/50 bg-slate-950 px-3.5 py-2.5 text-white font-semibold placeholder-slate-500 focus:border-blue-400 focus:outline-none"
                  required
                />
                <p className="text-[10px] text-slate-500 mt-1">Đề thi giao theo tên lớp này</p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Số báo danh / Mã thí sinh:
                </label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="QL-2025-01"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-white font-mono placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Email:
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@quatlam.edu.vn"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Số điện thoại:
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="0987654321"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 p-6 pt-4 border-t border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-500 shadow-md shadow-blue-600/30 disabled:opacity-50 transition-all"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{isLoading ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
