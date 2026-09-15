import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '../components/common/ThemeToggle';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const dashboardPath = user?.role === 'STUDENT' ? '/dashboard' : '/teacher';

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8 relative">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      <div className="text-center max-w-md">
        <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-4">
          404
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">
          Trang không tồn tại
        </h2>
        <p className="text-slate-400 mb-8">
          Trang bạn tìm kiếm không tồn tại hoặc đã bị di chuyển. Vui lòng kiểm tra lại đường dẫn.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-all"
          >
            <ArrowLeft size={18} />
            Quay lại
          </button>
          <button
            onClick={() => navigate(user ? dashboardPath : '/login')}
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
