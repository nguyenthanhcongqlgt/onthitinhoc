import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../services/api';
import { Home, GraduationCap, UserPlus, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '../components/common/ThemeToggle';

export const Register: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    full_name: '',
    role: 'STUDENT' as 'STUDENT' | 'TEACHER',
    phone_number: '',
    school: 'THPT Quất Lâm',
    class_name: '',
    student_id: '',
  });

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (formData.password !== formData.confirm_password) {
      setError('Mật khẩu xác nhận không khớp!');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.register(formData);
      setSuccessMsg(res.message || 'Đăng ký thành công!');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err: any) {
      console.error(err);
      const data = err.response?.data;
      if (data) {
        const firstErr = Object.values(data)[0];
        setError(Array.isArray(firstErr) ? firstErr[0] : String(firstErr));
      } else {
        setError('Đăng ký thất bại. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative">
      {/* Top Bar Actions */}
      <div className="absolute top-4 left-4 z-30">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/40 bg-blue-950/70 px-3.5 py-2 text-xs font-bold text-blue-300 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
          title="Về Trang Chủ hệ thống"
        >
          <Home className="h-4 w-4" />
          <span>Trang Chủ</span>
        </Link>
      </div>
      <div className="absolute top-4 right-4 z-30">
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg">
          <GraduationCap className="h-8 w-8 text-white" />
        </div>
        <h2 className="mt-3 text-lg sm:text-2xl font-extrabold text-white">WEB APP ÔN THI TRẮC NGHIỆM HSG - TỐT NGHIỆP MÔN TIN HỌC</h2>
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-400 mt-1">
          TRƯỜNG THPT QUẤT LÂM - NINH BÌNH
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 backdrop-blur-xl p-8 shadow-2xl">
          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{successMsg} Đang chuyển sang trang Đăng nhập...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-2">Vai trò tài khoản</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'STUDENT' })}
                  className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all ${
                    formData.role === 'STUDENT'
                      ? 'border-blue-500 bg-blue-600/20 text-blue-300 ring-1 ring-blue-500'
                      : 'border-slate-800 bg-slate-900 text-slate-400'
                  }`}
                >
                  🎓 Học sinh / HSG
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'TEACHER' })}
                  className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all ${
                    formData.role === 'TEACHER'
                      ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300 ring-1 ring-indigo-500'
                      : 'border-slate-800 bg-slate-900 text-slate-400'
                  }`}
                >
                  👨‍🏫 Giáo viên bộ môn
                </button>
              </div>
              {formData.role === 'TEACHER' && (
                <p className="mt-1.5 text-[11px] text-amber-400">
                  * Tài khoản Giáo viên sẽ ở trạng thái Chờ duyệt bởi Super Admin (Thầy Công).
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tên đăng nhập *</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="vd: nguyenvana"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Họ và tên đầy đủ *</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="vd: Nguyễn Văn A"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@domain.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Số điện thoại</label>
                <input
                  type="text"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="0987654321"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Lớp / Đội tuyển</label>
                <input
                  type="text"
                  value={formData.class_name}
                  onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                  placeholder="vd: 12A1 - Đội tuyển HSG"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Mã học sinh / SBD</label>
                <input
                  type="text"
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  placeholder="vd: QL-2025-09"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Mật khẩu *</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Xác nhận mật khẩu *</label>
                <input
                  type="password"
                  required
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 px-4 text-xs font-bold text-white shadow-lg hover:bg-blue-500 transition-all disabled:opacity-50"
            >
              <UserPlus className="h-4 w-4" />
              {isLoading ? 'Đang tạo tài khoản...' : 'Đăng Ký Tài Khoản'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            <Link to="/login" className="inline-flex items-center gap-1 font-semibold text-blue-400 hover:text-blue-300">
              <ArrowLeft className="h-3.5 w-3.5" /> Quay lại trang Đăng nhập
            </Link>
          </div>
        </div>

        {/* Footer Contact */}
        <div className="mt-8 text-center text-xs text-slate-500 max-w-sm mx-auto z-10">
          <p>Mọi thắc mắc và hỗ trợ kỹ thuật, vui lòng liên hệ:</p>
          <p className="mt-1 font-semibold text-slate-400">Zalo: 0988999303 (Thầy Công)</p>
        </div>
      </div>
    </div>
  );
};
