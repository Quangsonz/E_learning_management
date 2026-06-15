import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SiteLayout from './components/layout/SiteLayout';
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

const App: React.FC = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SiteLayout>
        <Routes>
          <Route path="/" element={<Home />} />
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
       