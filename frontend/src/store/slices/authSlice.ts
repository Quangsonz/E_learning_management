import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// ==========================================
// TYPES
// ==========================================

export interface AuthUser {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  avatar: string;
  isVerified: boolean;
  studyStreakDays?: number;
  totalFocusMinutes?: number;
  createdAt?: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ==========================================
// HELPERS - Persist auth state to localStorage
// ==========================================

const TOKEN_KEY = 'elearning_token';
const USER_KEY = 'elearning_user';

const persistAuth = (token: string, user: AuthUser) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // Bỏ qua lỗi localStorage (ví dụ: private mode)
  }
};

const clearPersistedAuth = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // Bỏ qua lỗi
  }
};

const loadPersistedAuth = (): Partial<AuthState> => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    if (token && userStr) {
      const user = JSON.parse(userStr) as AuthUser;
      return { accessToken: token, user, isAuthenticated: true };
    }
  } catch {
    // Bỏ qua lỗi parse
  }
  return {};
};

// ==========================================
// INITIAL STATE (load từ localStorage)
// ==========================================

const persisted = loadPersistedAuth();

const initialState: AuthState = {
  accessToken: persisted.accessToken ?? null,
  refreshToken: null,
  user: persisted.user ?? null,
  isAuthenticated: persisted.isAuthenticated ?? false,
  isLoading: false,
};

// ==========================================
// SLICE
// ==========================================

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Gọi sau khi login/register thành công
     */
    setAuth(
      state,
      action: PayloadAction<{
        accessToken: string;
        refreshToken?: string;
        user?: AuthUser;
      }>
    ) {
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken;
      }
      if (action.payload.user) {
        state.user = action.payload.user;
        // Normalize _id thành id nếu cần
        if (action.payload.user._id && !action.payload.user.id) {
          state.user = { ...action.payload.user, id: action.payload.user._id };
        }
        // Persist to localStorage
        persistAuth(action.payload.accessToken, state.user!);
      }
    },

    /**
     * Cập nhật thông tin user (profile update)
     */
    updateUser(state, action: PayloadAction<Partial<AuthUser>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        // Persist updated user
        if (state.accessToken) {
          persistAuth(state.accessToken, state.user);
        }
      }
    },

    /**
     * Gọi khi logout
     */
    clearAuth(state) {
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      state.isAuthenticated = false;
      clearPersistedAuth();
    },

    /**
     * Set loading state
     */
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
  },
});

export const { setAuth, clearAuth, updateUser, setLoading } = authSlice.actions;

// ==========================================
// SELECTORS
// ==========================================

export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectAccessToken = (state: { auth: AuthState }) => state.auth.accessToken;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectIsAdmin = (state: { auth: AuthState }) => state.auth.user?.role === 'admin';
export const selectIsTeacher = (state: { auth: AuthState }) =>
  state.auth.user?.role === 'teacher' || state.auth.user?.role === 'admin';

export default authSlice.reducer;
