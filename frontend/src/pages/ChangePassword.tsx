import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { 
  Home,
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  User as UserIcon, 
  Save, 
  Mail, 
  Phone, 
  School, 
  GraduationCap, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { SCHOOL_NAME } from '../config/constants';
import { ThemeToggle } from '../components/common/ThemeToggle';

export const ChangePassword: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, refreshUserProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  // Form State: Profile Info (Họ và tên)
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Form State: Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Sync state if user changes
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setEmail(user.email || '');
      setPhoneNumber(user.phone_number || '');
    }
  }, [user]);

  // Handle Profile Update (Họ và tên)
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!fullName.trim()) {
      setProfileError('Vui lòng nhập họ và tên của bạn.');
      return;
    }

    setIsProfileLoading(true);
    try {
      await authApi.updateProfile({
        full_name: fullName.trim(),
        email: email.trim(),
        phone_number: phoneNumber.trim(),
      });
      await refreshUserProfile();
      setProfileSuccess('Đã cập nhật họ và tên thành công!');
      setTimeout(() => setProfileSuccess(''), 4000);
    } catch (err: any) {
      setProfileError(err?.response?.data?.detail || 'Cập nhật thông tin thất bại. Vui lòng thử lại.');
    } finally {
      setIsProfileLoading(false);
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">Quản trị viên (Admin)</span>;
      case 'TEACHER':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">Giáo viên</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">Học sinh</span>;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Vui lòng điền đầy đủ các trường.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu mới và xác nhận mật khẩu không khớp.');
      return;
    }
    if (currentPassword === newPassword) {
      setError('Mật khẩu mới phải khác mật khẩu hiện tại.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setSuccess(true);
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-slate-900 rounded-3xl p-8 max-w-md w-full text-center border border-emerald-500/30 shadow-2xl">
          <CheckCircle2 size={64} className="text-emerald-400 mx-auto mb-4 animate-bounce" />
          <h2 className="text-2xl font-bold text-emerald-400 mb-2">Đổi mật khẩu thành công!</h2>
          <p className="text-slate-300 text-sm mb-6">Mật khẩu tài khoản đã được cập nhật. Bạn sẽ được chuyển về trang đăng nhập để đăng nhập lại...</p>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 animate-[pulse_1.5s_infinite]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-xl bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
        {/* Header navigation */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-500/40 bg-blue-950/60 text-xs font-bold text-blue-300 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
              title="Về Trang Chủ hệ thống"
            >
              <Home size={15} />
              <span className="hidden sm:inline">Trang Chủ</span>
            </Link>
            <button
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate(user?.role === 'STUDENT' ? '/dashboard' : '/teacher');
                }
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Quay lại"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Cài đặt tài khoản
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">Quản lý thông tin hồ sơ và bảo mật tài khoản</p>
            </div>
          </div>
          <div>
            {getRoleBadge(user?.role)}
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-2 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800 my-6">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'profile'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <UserIcon size={16} />
            <span>Thông tin cá nhân</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'password'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Lock size={16} />
            <span>Đổi mật khẩu</span>
          </button>
        </div>

        {/* TAB 1: THÔNG TIN CÁ NHÂN (HỌ VÀ TÊN) */}
        {activeTab === 'profile' && (
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            {profileSuccess && (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl text-sm animate-fadeIn">
                <CheckCircle2 size={18} className="shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-xl text-sm animate-fadeIn">
                <AlertTriangle size={18} className="shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tên đăng nhập (Read-only) */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Tên đăng nhập
                </label>
                <div className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-2.5 text-slate-400 text-sm font-mono ">
                  @{user?.username}
                </div>
              </div>

              {/* Mã học sinh / Giáo viên */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  {user?.role === 'STUDENT' ? 'Số báo danh / Mã HS' : 'Mã định danh'}
                </label>
                <div className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-2.5 text-slate-400 text-sm font-mono ">
                  {user?.student_id || 'Chưa thiết lập'}
                </div>
              </div>
            </div>

            {/* Họ và tên (EDITABLE) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                <span>Họ và tên hiển thị <span className="text-rose-400">*</span></span>
                <span className="text-[11px] text-blue-400 lowercase font-normal flex items-center gap-1">
                  <Sparkles size={12} /> dùng trong bảng điểm
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-white font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                />
                <UserIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Email
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                  />
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {/* Số điện thoại */}
              <div>
                <label htmlFor="phone" className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Số điện thoại
                </label>
                <div className="relative">
                  <input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0912xxxxxx"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                  />
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Lớp học & Trường (Read-only reference) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap size={14} /> Lớp học
                </label>
                <div className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-2.5 text-slate-400 text-sm ">
                  {user?.class_name || 'Chưa phân lớp'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                  <School size={14} /> Trường
                </label>
                <div className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-2.5 text-slate-400 text-sm ">
                  {user?.school || SCHOOL_NAME}
                </div>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={isProfileLoading}
                className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isProfileLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-r-transparent" />
                ) : (
                  <>
                    <Save size={18} />
                    <span>Lưu thay đổi họ và tên</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: ĐỔI MẬT KHẨU */}
        {activeTab === 'password' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-xl text-sm animate-fadeIn">
                <AlertTriangle size={18} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Mật khẩu hiện tại
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-4 pr-11 py-2.5 text-white font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                  placeholder="Nhập mật khẩu hiện tại"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Mật khẩu mới
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-4 pr-11 py-2.5 text-white font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                  placeholder="Tối thiểu 6 ký tự"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Xác nhận mật khẩu mới
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                placeholder="Nhập lại mật khẩu mới"
              />
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs flex items-start gap-2.5">
              <ShieldCheck size={18} className="shrink-0 mt-0.5 text-amber-400" />
              <span>Sau khi đổi mật khẩu thành công, bạn sẽ tự động được đăng xuất và cần đăng nhập lại bằng mật khẩu mới.</span>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-r-transparent" />
                ) : (
                  <>
                    <Lock size={18} />
                    <span>Cập nhật mật khẩu mới</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
