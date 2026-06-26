import React, { createContext, useContext, useCallback, useEffect, ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  setAuth,
  clearAuth,
  updateUser,
  selectCurrentUser,
  selectAccessToken,
  selectIsAuthenticated,
  selectIsAdmin,
  selectIsTeacher,
  AuthUser,
} from '../store/slices/authSlice';
import { authApi, LoginPayload, RegisterPayload } from '../services/auth.api';
import { userApi } from '../services/user.api';

// ==========================================
// CONTEXT TYPE
// ==========================================

interface AuthContextType {
  // State
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isTeacher: boolean;

  // Actions
  login: (data: LoginPayload) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: Partial<AuthUser>) => void;
}

// ==========================================
// CONTEXT
// ==========================================

const AuthContext = createContext<AuthContextType | null>(null);

// ==========================================
// PROVIDER
// ==========================================

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector(selectCurrentUser);
  const accessToken = useSelector(selectAccessToken);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isAdmin = useSelector(selectIsAdmin);
  const isTeacher = useSelector(selectIsTeacher);

  // Khi app khởi động, nếu đã có token (từ localStorage), fetch lại profile để ensure data fresh
  useEffect(() => {
    const syncProfile = async () => {
      if (isAuthenticated && accessToken && !user) {
        try {
          const res = await userApi.getMyProfile();
          if (res.data?.user) {
            dispatch(updateUser(res.data.user));
          }
        } catch {
          // Token hết hạn hoặc không hợp lệ
          dispatch(clearAuth());
        }
      }
    };

    syncProfile();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Đăng nhập
   */
  const login = useCallback(
    async (data: LoginPayload) => {
      const response = await authApi.login(data);
      if (response.status === 'success') {
        dispatch(
          setAuth({
            accessToken: response.token,
            user: response.data.user,
          })
        );
      }
    },
    [dispatch]
  );

  /**
   * Đăng ký
   */
  const register = useCallback(
    async (data: RegisterPayload) => {
      const response = await authApi.register(data);
      if (response.status === 'success') {
        dispatch(
          setAuth({
            accessToken: response.token,
            user: response.data.user,
          })
        );
      }
    },
    [dispatch]
  );

  /**
   * Đăng xuất
   */
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Bỏ qua lỗi server khi logout
    } finally {
      dispatch(clearAuth());
      navigate('/login', { replace: true });
    }
  }, [dispatch, navigate]);

  /**
   * Refresh profile từ server
   */
  const refreshProfile = useCallback(async () => {
    try {
      const res = await userApi.getMyProfile();
      if (res.data?.user) {
        dispatch(updateUser(res.data.user));
      }
    } catch (err) {
      console.error('[AuthContext] Refresh profile failed:', err);
    }
  }, [dispatch]);

  /**
   * Cập nhật user state (dùng sau updateMe)
   */
  const updateProfile = useCallback(
    (data: Partial<AuthUser>) => {
      dispatch(updateUser(data));
    },
    [dispatch]
  );

  const value: AuthContextType = {
    user,
    accessToken,
    isAuthenticated,
    isAdmin,
    isTeacher,
    login,
    register,
    logout,
    refreshProfile,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ==========================================
// HOOK
// ==========================================

/**
 * Hook để sử dụng AuthContext trong components
 * @example const { user, login, logout, isAdmin } = useAuth();
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider');
  }
  return context;
};

export default AuthContext;
