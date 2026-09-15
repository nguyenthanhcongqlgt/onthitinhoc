import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { StudentDashboard } from './pages/StudentDashboard';
import { ExamRoom } from './pages/ExamRoom';
import { ExamResult } from './pages/ExamResult';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { ExamCreator } from './pages/ExamCreator';
import { NotFound } from './pages/NotFound';
import { Forbidden } from './pages/Forbidden';
import { ChangePassword } from './pages/ChangePassword';
import { Home } from './pages/Home';
import { CodePlayground } from './pages/CodePlayground';

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: Array<'ADMIN' | 'TEACHER' | 'STUDENT'>;
}> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-300">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  {/* F2: Kiểm tra trạng thái tài khoản PENDING/REJECTED */}
  if (user.status === 'PENDING') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-center p-8">
        <div className="bg-slate-800 rounded-2xl p-8 max-w-md border border-amber-500/30">
          <div className="text-amber-400 text-5xl mb-4">⏳</div>
          <h2 className="text-xl font-bold text-amber-400 mb-3">Tài khoản đang chờ phê duyệt</h2>
          <p className="text-slate-300 mb-6">
            Tài khoản Giáo viên của bạn đang chờ Super Admin phê duyệt. Vui lòng thử lại sau.
          </p>
          <button
            onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
            className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition-all"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    );
  }

  if (user.status === 'REJECTED') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-center p-8">
        <div className="bg-slate-800 rounded-2xl p-8 max-w-md border border-red-500/30">
          <div className="text-red-400 text-5xl mb-4">🚫</div>
          <h2 className="text-xl font-bold text-red-400 mb-3">Tài khoản bị từ chối</h2>
          <p className="text-slate-300 mb-6">
            Tài khoản của bạn đã bị từ chối truy cập. Vui lòng liên hệ Admin để biết thêm chi tiết.
          </p>
          <button
            onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
            className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-all"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'STUDENT' ? '/dashboard' : '/teacher'} replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forbidden" element={<Forbidden />} />

            {/* Code Playground - Only for logged-in Users (Student, Teacher, Admin) */}
            <Route
              path="/playground"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN', 'TEACHER']}>
                  <CodePlayground />
                </ProtectedRoute>
              }
            />

            {/* Change Password */}
            <Route
              path="/change-password"
              element={
                <ProtectedRoute>
                  <ChangePassword />
                </ProtectedRoute>
              }
            />

            {/* Student Dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN', 'TEACHER']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />

            {/* Exam Room */}
            <Route
              path="/exam/:examId"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
                  <ExamRoom />
                </ProtectedRoute>
              }
            />

            {/* Exam Result & Breakdown */}
            <Route
              path="/result/:sessionId"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
                  <ExamResult />
                </ProtectedRoute>
              }
            />

            {/* Teacher Dashboard */}
            <Route
              path="/teacher"
              element={
                <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                  <TeacherDashboard />
                </ProtectedRoute>
              }
            />

            {/* Exam Creator */}
            <Route
              path="/teacher/create-exam"
              element={
                <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                  <ExamCreator />
                </ProtectedRoute>
              }
            />
            <Route
              path="/exam-creator"
              element={
                <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                  <ExamCreator />
                </ProtectedRoute>
              }
            />

            {/* 404 — Trang không tồn tại */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
