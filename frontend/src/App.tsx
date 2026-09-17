import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { CommandPalette } from './components/common/CommandPalette';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

// Lazy load all pages for optimal code splitting & lightning-fast initial load
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard').then(m => ({ default: m.StudentDashboard })));
const ExamRoom = lazy(() => import('./pages/ExamRoom').then(m => ({ default: m.ExamRoom })));
const ExamResult = lazy(() => import('./pages/ExamResult').then(m => ({ default: m.ExamResult })));
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard').then(m => ({ default: m.TeacherDashboard })));
const ExamCreator = lazy(() => import('./pages/ExamCreator').then(m => ({ default: m.ExamCreator })));
const CodePlayground = lazy(() => import('./pages/CodePlayground').then(m => ({ default: m.CodePlayground })));
const ChangePassword = lazy(() => import('./pages/ChangePassword').then(m => ({ default: m.ChangePassword })));
const Forbidden = lazy(() => import('./pages/Forbidden').then(m => ({ default: m.Forbidden })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));

const PageLoadingSpinner: React.FC = () => (
  <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-300">
    <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent mb-4"></div>
    <p className="text-sm text-slate-400 font-medium">Đang tải trang...</p>
  </div>
);

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
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
        <BrowserRouter>
          <CommandPalette />
          <ErrorBoundary>
            <Suspense fallback={<PageLoadingSpinner />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Code Playground - Only for logged-in Users (Student, Teacher, Admin) */}
                <Route
                  path="/playground"
                  element={
                    <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN', 'TEACHER']}>
                      <CodePlayground />
                    </ProtectedRoute>
                  }
                />

                {/* Account Settings / Change Password / Profile */}
                <Route
                  path="/change-password"
                  element={
                    <ProtectedRoute>
                      <ChangePassword />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
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
                <Route
                  path="/exam/:examId"
                  element={
                    <ProtectedRoute>
                      <ExamRoom />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/result/:sessionId"
                  element={
                    <ProtectedRoute>
                      <ExamResult />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/playground"
                  element={
                    <ProtectedRoute>
                      <CodePlayground />
                    </ProtectedRoute>
                  }
                />

                {/* 403 Forbidden */}
                <Route path="/forbidden" element={<Forbidden />} />

                {/* Teacher / Admin Routes */}
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
            </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
        </AuthProvider>
        <Toaster position="top-right" richColors theme="dark" />
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
