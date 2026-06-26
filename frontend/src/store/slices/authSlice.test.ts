import { describe, it, expect } from 'vitest';
import authReducer, { setAuth, clearAuth, AuthUser } from './authSlice';

describe('authSlice reducer', () => {
  const initialState = {
    accessToken: null,
    refreshToken: null,
    user: null,
    isAuthenticated: false,
    isLoading: false,
  };

  it('should handle initial state', () => {
    // Note: initial state may load from localStorage in real env,
    // but in test environment localStorage is empty so it matches.
    const state = authReducer(undefined, { type: 'unknown' });
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('should handle setAuth', () => {
    const user: AuthUser = {
      _id: '123',
      name: 'Test User',
      email: 'test@test.com',
      role: 'student',
      avatar: 'default-avatar.png',
      isVerified: false,
    };
    const accessToken = 'fake-token';

    const actual = authReducer(initialState, setAuth({ user, accessToken }));

    expect(actual.user?._id).toEqual('123');
    expect(actual.user?.name).toEqual('Test User');
    expect(actual.accessToken).toEqual(accessToken);
    expect(actual.isAuthenticated).toBe(true);
  });

  it('should handle clearAuth', () => {
    const loggedInState = {
      user: {
        _id: '123',
        name: 'Test User',
        email: 'test@test.com',
        role: 'student' as const,
        avatar: 'default-avatar.png',
        isVerified: false,
      },
      accessToken: 'fake-token',
      refreshToken: null,
      isAuthenticated: true,
      isLoading: false,
    };

    const actual = authReducer(loggedInState, clearAuth());

    expect(actual.accessToken).toBeNull();
    expect(actual.user).toBeNull();
    expect(actual.isAuthenticated).toBe(false);
  });
});
