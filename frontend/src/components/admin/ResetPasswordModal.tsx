import React, { useState } from 'react';
import { authApi } from '../../services/api';
import { User } from '../../types';
import { KeyRound, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  targetUser: User;
  onClose: () => void;
  onSuccess: () => void;
}

export const ResetPasswordModal: React.FC<Props> = ({ targetUser, onClose, onSuccess }) => {
  const [newPassword, setNewPassword] = useState<string>('student123');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const res = await authApi.resetPassword(targetUser.id, newPassword);
      setSuccessMsg(res.message || 'Đặt lại mật khẩu thành công!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Không thể đặt lại mật khẩu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Đặt Lại Mật Khẩu</h3>
              <p className="text-xs text-slate-400">
                Tài khoản: <span className="font-semibold text-blue-400">{targetUser.username}</span>
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

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleReset} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Mật khẩu mới (Tối thiểu 6 ký tự)
            </label>
            <input
              type="text"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-400 hover:bg-slate-800 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-amber-500 transition-colors shadow-lg shadow-amber-600/30 disabled:opacity-50"
            >
              {isLoading ? 'Đang lưu...' : 'Xác nhận Đổi Mật Khẩu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
