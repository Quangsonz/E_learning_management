import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import SiteLayout from './components/layout/SiteLayout';
import AppErrorBoundary from './components/layout/AppErrorBoundary';
import { LoadingScreen } from './components/ui/StateViews';
import Home from './pages/Home';
import CourseList from './pages/CourseList';
import CourseDetail from './pages/CourseDetail';
import Learning from './pages/Learning';
import Quiz from './pages/Quiz';
import TeacherDashboard from './pages/TeacherDashboard';
import CourseManagement from './pages/CourseManagement';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Splash from './pages/Splash';

const noLayoutPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/splash'];

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/" element={<Splash />} />
    <Route path="/home" element={<Home />} />
    <Route path="/dashboard" element={<Home />} />
    <Route path="/courses" element={<CourseList />} />
    <Route path="/course-list" element={<CourseList />} />
    <Route path="/courses/:courseId" element={<CourseDetail />} />
    <Route path="/course-detail" element={<CourseDetail />} />
    <Route path="/learning" element={<Learning />} />
    <Route path="/quiz" element={<Quiz />} />
    <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
    <Route path="/course-management" element={<CourseManagement />} />
    <Route path="/admin-dashboard" element={<AdminDashboard />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App: React.FC = () => {
  const location = useLocation();
  const isNoLayoutRoute = noLayoutPaths.some((path) => location.pathname.startsWith(path)) || location.pathname === '/';

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
