import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  selectIsAuthenticated,
  selectCurrentUser,
} from '../../store/slices/authSlice';

// ==========================================
// TYPES
// ==========================================

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Role(s) được phép truy cập. Nếu không truyền, chỉ yêu cầu đăng nhập. */
  allowedRoles?: Array<'student' | 'teacher' | 'admin'>;
  /** Redirect về trang này nếu không đủ quyền (default: /login) */
  redirectTo?: string;
}

// ==========================================
// COMPONENT
// ==========================================

/**
 * Bảo vệ route - Yêu cầu đăng nhập và kiểm tra role
 * 
 * @example
 * // Chỉ yêu cầu đăng nhập
 * <ProtectedRoute><Profile /></ProtectedRoute>
 * 
 * @example
 * // Yêu cầu role admin
 * <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>
 * 
 * @example
 * // Yêu cầu teacher hoặc admin
 * <ProtectedRoute allowedRoles={['teacher', 'admin']}><TeacherDashboard /></ProtectedRoute>
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  redirectTo = '/login',
}) => {
  const location = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);

  // CHẾ ĐỘ DEV: Tắt bắt buộc đăng nhập
  // // Chưa đăng nhập → redirect về login
  // if (!isAuthenticated) {
  //   return (
  //     <Navigate
  //       to={redirectTo}
  //       state={{ from: location }} // Lưu lại route để redirect sau khi login
  //       replace
  //     />
  //   );
  // }
  //
  // // Kiểm tra role nếu được chỉ định
  // if (allowedRoles && user && !allowedRoles.includes(user.role)) {
  //   return (
  //     <Navigate
  //       to="/unauthorized"
  //       state={{ from: location, requiredRoles: allowedRoles }}
  //       replace
  //     />
  //   );
  // }

  return <>{children}</>;
};

export default ProtectedRoute;
