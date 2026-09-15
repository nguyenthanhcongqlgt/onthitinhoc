import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, GraduationCap, UserCheck, Lock, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { ThemeToggle } from '../components/common/ThemeToggle';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();

  const targetExamCode = searchParams.get('exam_code') || '';
  const targetExamId = searchParams.get('exam_id') || '';
  const targetExamTitle = searchParams.get('exam_title') || '';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await login({ username, password });
      if (user.role === 'STUDENT') {
        if (targetExamId || targetExamCode) {
          navigate(`/dashboard?code=${encodeURIComponent(targetExamCode || targetExamId)}&auto=true`);
        } else {
          navigate('/dashboard');
        }
      } else {
        navigate('/teacher');
      }
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.';
      setError(detail);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Theme Toggle Button at Top Right */}
      <div className="absolute top-4 right-4 z-30">
        <ThemeToggle />
      </div>

      {/* Background Glow */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/30">
          <GraduationCap className="h-9 w-9 text-white" />
        </div>
        <h2 className="mt-4 text-xl sm:text-2xl font-extrabold tracking-tight text-white px-2">
          WEB APP ÔN THI TRẮC NGHIỆM HSG - TỐT NGHIỆP MÔN TIN HỌC
        </h2>
        <p className="mt-1 text-sm font-semibold uppercase tracking-wider text-blue-400">
          TRƯỜNG THPT QUẤT LÂM - NINH BÌNH
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 backdrop-blur-xl p-8 shadow-2xl">
          {targetExamTitle && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-xs text-blue-300 animate-in fade-in">
              <Sparkles className="h-5 w-5 shrink-0 text-blue-400 mt-0.5" />
              <div>
                <div className="font-bold text-white text-xs">Ca thi đang chờ bạn:</div>
                <div className="mt-0.5 font-semibold text-blue-200 line-clamp-1">{targetExamTitle}</div>
                <p className="mt-1 text-[11px] text-slate-400">Đăng nhập tài khoản học sinh để vào làm bài trực tiếp.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs font-medium text-red-300">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Tên đăng nhập / Số báo danh
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="vd: admin, gv_tinhoc, hsg_nam"
                className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-sm text-white placeholder-slate-500 shadow-inner focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-sm text-white placeholder-slate-500 shadow-inner focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <Lock className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-500" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 px-4 font-bold text-white shadow-lg shadow-blue-600/30 hover:from-blue-500 hover:to-indigo-500 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Đang xác thực...' : 'Đăng nhập vào Hệ thống'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Quick Login for Testing */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 text-center">
              ⚡ Đăng nhập nhanh tài khoản mẫu:
            </div>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-left hover:border-blue-500/50 hover:bg-slate-800/80 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-amber-400" />
                  <span className="font-semibold text-slate-200">Super Admin (Thầy Công)</span>
                </div>
                <span className="font-mono text-[11px] text-slate-400">admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('gv_tinhoc', 'teacher123')}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-left hover:border-blue-500/50 hover:bg-slate-800/80 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="h-3.5 w-3.5 text-blue-400" />
                  <span className="font-semibold text-slate-200">Giáo viên (Cô Mai)</span>
                </div>
                <span className="font-mono text-[11px] text-slate-400">gv_tinhoc</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('hsg_nam', 'student123')}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-left hover:border-blue-500/50 hover:bg-slate-800/80 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="font-semibold text-slate-200">Học sinh HSG (Trần Hải Nam)</span>
                </div>
                <span className="font-mono text-[11px] text-slate-400">hsg_nam</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-4">
              Đăng ký tài khoản mới
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
