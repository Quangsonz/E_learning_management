import { describe, it, expect } from 'vitest';
import authReducer, { setAuth, clearAuth } from './authSlice';

describe('authSlice reducer', () => {
  const initialState = {
    accessToken: null,
    refreshToken: null,
    user: null,
  };

  it('should handle initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setAuth', () => {
    const user = { id: '123', name: 'Test User' };
    const accessToken = 'fake-token';

    const actual = authReducer(initialState, setAuth({ user, accessToken }));
    
    expect(actual.user).toEqual(user);
    expect(actual.accessToken).toEqual(accessToken);
  });

  it('should handle clearAuth', () => {
    const loggedInState = {
      user: { id: '123', name: 'Test User' },
      accessToken: 'fake-token',
      refreshToken: null,
    };

    const actual = authReducer(loggedInState, clearAuth());
    
    expect(actual).toEqual(initialState);
  });
});
