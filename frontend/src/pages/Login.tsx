import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, GraduationCap, Lock, AlertCircle, ArrowRight, Sparkles, ShieldCheck, KeyRound, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { ThemeToggle } from '../components/common/ThemeToggle';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginWith2FA } = useAuth();
  const [searchParams] = useSearchParams();

  const targetExamCode = searchParams.get('exam_code') || '';
  const targetExamId = searchParams.get('exam_id') || '';
  const targetExamTitle = searchParams.get('exam_title') || '';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 2FA States
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [userDisplayName, setUserDisplayName] = useState('');

  const handleRedirectAfterLogin = (user: any) => {
    if (user.role === 'STUDENT') {
      if (targetExamId || targetExamCode) {
        navigate(`/dashboard?code=${encodeURIComponent(targetExamCode || targetExamId)}&auto=true`);
      } else {
        navigate('/dashboard');
      }
    } else {
      navigate('/teacher');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await login({ username, password });
      if (res.requires_2fa && res.temp_token) {
        setTempToken(res.temp_token);
        setUserDisplayName(res.full_name || res.username || username);
        setRequires2FA(true);
        setIsLoading(false);
        return;
      }
      if (res.user) {
        handleRedirectAfterLogin(res.user);
      }
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.';
      setError(detail);
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorCode.trim()) {
      setError('Vui lòng nhập mã xác thực từ ứng dụng.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const user = await loginWith2FA(tempToken, twoFactorCode.trim());
      handleRedirectAfterLogin(user);
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail || 'Mã xác thực không đúng hoặc đã hết hạn.';
      setError(detail);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
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

          {requires2FA ? (
            <form onSubmit={handle2FASubmit} className="space-y-5 animate-in fade-in">
              <div className="text-center pb-2">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-3 shadow-lg shadow-emerald-500/10">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <h3 className="text-base font-bold text-white">Xác Thực 2 Lớp (2FA)</h3>
                <p className="text-xs text-slate-300 mt-1">
                  Tài khoản <strong className="text-blue-400">{userDisplayName}</strong> đã kích hoạt bảo mật.
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Mở ứng dụng <strong>Google Authenticator</strong> lấy mã 6 số (hoặc nhập 1 trong các mã dự phòng).
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 text-center">
                  Mã 6 số hoặc Mã khôi phục
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  placeholder="vd: 849201 hoặc XXXX-XXXX"
                  className="w-full text-center tracking-widest font-mono font-bold text-lg rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-3.5 text-white placeholder-slate-600 shadow-inner focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !twoFactorCode.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 px-4 font-bold text-white shadow-lg shadow-emerald-600/30 hover:from-emerald-500 hover:to-teal-500 transition-all disabled:opacity-50"
              >
                {isLoading ? 'Đang xác thực...' : 'Xác Nhận & Đăng Nhập'}
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setRequires2FA(false);
                  setTempToken('');
                  setTwoFactorCode('');
                  setError('');
                }}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-white py-2 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Quay lại nhập tài khoản khác</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="username" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Tên đăng nhập / Số báo danh
                </label>
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tên đăng nhập hoặc số báo danh"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-sm text-white placeholder-slate-500 shadow-inner focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-sm text-white placeholder-slate-500 shadow-inner focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
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
          )}

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
