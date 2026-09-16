import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import { ThemeToggle } from '../components/common/ThemeToggle';

export const Forbidden: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const dashboardPath = user?.role === 'STUDENT' ? '/dashboard' : '/teacher';

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8 relative">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-4">
          <ShieldX size={80} className="text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-red-400 mb-3">
          403 — Không có quyền truy cập
        </h2>
        <p className="text-slate-400 mb-8">
          Bạn không có quyền truy cập trang này. Nếu bạn cho rằng đây là lỗi, vui lòng liên hệ quản trị viên.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate(user ? dashboardPath : '/');
              }
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-all"
          >
            <ArrowLeft size={18} />
            Quay lại
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all"
          >
            <Home size={18} />
            Trang chủ
          </button>
        </div>
      </div>
    </div>
  );
};
