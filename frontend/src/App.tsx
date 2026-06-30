import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SiteLayout from './components/layout/SiteLayout';
import AppErrorBoundary from './components/layout/AppErrorBoundary';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { LoadingScreen } from './components/ui/StateViews';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Wishlist from './pages/Wishlist';
import CourseList from './pages/CourseList';
import CourseDetail from './pages/CourseDetail';
import Checkout from './pages/Checkout';
import Learning from './pages/Learning';
import MyLearning from './pages/MyLearning';
import Quiz from './pages/Quiz';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherCourses from './pages/TeacherCourses';
import CourseBuilder from './pages/teacher/CourseBuilder';
import CurriculumEditor from './pages/teacher/CurriculumEditor';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Splash from './pages/Splash';
import Settings from './pages/Settings';
import Leaderboard from './pages/Leaderboard';
import CertificateVerify from './pages/CertificateVerify';

// Các routes không cần SiteLayout (không có header/sidebar)
const noLayoutPaths = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/splash',
  '/admin-dashboard',
  '/unauthorized',
  '/certificates/verify',
];

// Trang hiển thị khi không có quyền truy cập
const UnauthorizedPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-black text-rose-400">403</h1>
        <p className="text-xl font-bold">{t('app.unauthorized.title')}</p>
        <p className="text-slate-400">{t('app.unauthorized.desc')}</p>
        <a href="/home" className="inline-block mt-4 px-6 py-2 bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-colors">
          {t('app.unauthorized.back')}
        </a>
      </div>
    </div>
  );
};

const AppRoutes: React.FC = () => (
  <Routes>
    {/* ==========================================
        PUBLIC ROUTES
    ========================================== */}
    <Route path="/" element={<Splash />} />
    <Route path="/splash" element={<Splash />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/unauthorized" element={<UnauthorizedPage />} />
    <Route path="/certificates/verify/:certificateId" element={<CertificateVerify />} />

    {/* ==========================================
        PROTECTED ROUTES - Yêu cầu đăng nhập
    ========================================== */}
    <Route path="/home" element={
      <ProtectedRoute>
        <Home />
      </ProtectedRoute>
    } />
    <Route path="/dashboard" element={
      <ProtectedRoute>
        <Home />
      </ProtectedRoute>
    } />
    <Route path="/courses" element={
      <ProtectedRoute>
        <CourseList />
      </ProtectedRoute>
    } />
    <Route path="/course-list" element={
      <ProtectedRoute>
        <CourseList />
      </ProtectedRoute>
    } />
    <Route path="/courses/:courseId" element={
      <ProtectedRoute>
        <CourseDetail />
      </ProtectedRoute>
    } />
    <Route path="/course-detail" element={
      <ProtectedRoute>
        <CourseDetail />
      </ProtectedRoute>
    } />
    <Route path="/checkout/:courseId" element={
      <ProtectedRoute>
        <Checkout />
      </ProtectedRoute>
    } />
    <Route path="/learning" element={
      <ProtectedRoute>
        <MyLearning />
      </ProtectedRoute>
    } />
    <Route path="/courses/:courseId/learn" element={
      <ProtectedRoute>
        <Learning />
      </ProtectedRoute>
    } />
    <Route path="/courses/:courseId/quizzes/:quizId/take" element={
      <ProtectedRoute>
        <Quiz />
      </ProtectedRoute>
    } />
    <Route path="/profile" element={
      <ProtectedRoute>
        <Profile />
      </ProtectedRoute>
    } />
    <Route path="/wishlist" element={
      <ProtectedRoute>
        <Wishlist />
      </ProtectedRoute>
    } />
    <Route path="/leaderboard" element={
      <ProtectedRoute>
        <Leaderboard />
      </ProtectedRoute>
    } />
    <Route path="/settings" element={
      <ProtectedRoute>
        <Settings />
      </ProtectedRoute>
    } />

    {/* ==========================================
        ROLE-BASED PROTECTED ROUTES
    ========================================== */}
    <Route path="/teacher-dashboard" element={
      <ProtectedRoute allowedRoles={['teacher', 'admin']}>
        <TeacherDashboard />
      </ProtectedRoute>
    } />
    <Route path="/teacher-courses" element={
      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
        <TeacherCourses />
      </ProtectedRoute>
    } />
    <Route path="/teacher/courses/new" element={
      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
        <CourseBuilder />
      </ProtectedRoute>
    } />
    <Route path="/teacher/courses/:courseId/curriculum" element={
      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
        <CurriculumEditor />
      </ProtectedRoute>
    } />
    <Route path="/admin-dashboard" element={
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminDashboard />
      </ProtectedRoute>
    } />

    {/* Fallback */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App: React.FC = () => {
  const location = useLocation();
  const isNoLayoutRoute =
    noLayoutPaths.some((path) => location.pathname.startsWith(path)) ||
    location.pathname === '/';

  return (
    <AppErrorBoundary>
      <Suspense
        fallback={
          <LoadingScreen title="Loading application" message="Preparing your dashboard, routes, and shared UI states..." />
        }
      >
        {isNoLayoutRoute ? (
          <AppRoutes />
        ) : (
          <SiteLayout>
            <AppRoutes />
          </SiteLayout>
        )}
      </Suspense>
    </AppErrorBoundary>
  );
};

export default App;
