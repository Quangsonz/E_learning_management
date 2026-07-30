import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SiteLayout from './components/layout/SiteLayout';
import AppErrorBoundary from './components/layout/AppErrorBoundary';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { LoadingScreen } from './components/ui/StateViews';

// Route-Based Code Splitting via React.lazy for ultra-fast initial bundle loading
const Home = React.lazy(() => import('./pages/Home'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Wishlist = React.lazy(() => import('./pages/Wishlist'));
const CourseList = React.lazy(() => import('./pages/CourseList'));
const CourseDetail = React.lazy(() => import('./pages/CourseDetail'));
const Checkout = React.lazy(() => import('./pages/Checkout'));
const Learning = React.lazy(() => import('./pages/Learning'));
const MyLearning = React.lazy(() => import('./pages/MyLearning'));
const Quiz = React.lazy(() => import('./pages/Quiz'));
const TeacherDashboard = React.lazy(() => import('./pages/TeacherDashboard'));
const TeacherCourses = React.lazy(() => import('./pages/TeacherCourses'));
const CourseBuilder = React.lazy(() => import('./pages/teacher/CourseBuilder'));
const CurriculumEditor = React.lazy(() => import('./pages/teacher/CurriculumEditor'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const Login = React.lazy(() => import('./pages/auth/Login'));
const Register = React.lazy(() => import('./pages/auth/Register'));
const ForgotPassword = React.lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/auth/ResetPassword'));
const Splash = React.lazy(() => import('./pages/Splash'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Leaderboard = React.lazy(() => import('./pages/Leaderboard'));
const CertificateVerify = React.lazy(() => import('./pages/CertificateVerify'));

// Routes that do not render the default SiteLayout header/sidebar
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

// 403 Unauthorized Fallback Component
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
        PROTECTED ROUTES - Authentication Required
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
      <ProtectedRoute allowedRoles={['teacher', 'admin']}>
        <TeacherCourses />
      </ProtectedRoute>
    } />
    <Route path="/teacher/courses/new" element={
      <ProtectedRoute allowedRoles={['teacher', 'admin']}>
        <CourseBuilder />
      </ProtectedRoute>
    } />
    <Route path="/teacher/courses/:courseId/curriculum" element={
      <ProtectedRoute allowedRoles={['teacher', 'admin']}>
        <CurriculumEditor />
      </ProtectedRoute>
    } />
    <Route path="/admin-dashboard" element={<Navigate to="/admin-dashboard/pulse" replace />} />
    <Route path="/admin-dashboard/:tabId" element={
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

  React.useEffect(() => {
    // Preload key page bundles immediately on mount for instant 0ms route switching
    Promise.all([
      import('./pages/CourseList'),
      import('./pages/CourseDetail'),
      import('./pages/Home'),
      import('./pages/MyLearning'),
      import('./pages/Leaderboard')
    ]).catch(() => {});
  }, []);

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
