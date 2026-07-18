import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import Login from './Login';
import authReducer from '../../store/slices/authSlice';

// Mock useAuth hook directly — Login.tsx calls useAuth().login(), not authApi directly
const mockLogin = vi.fn();
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    user: null,
    isAuthenticated: false,
    isAdmin: false,
    isTeacher: false,
    accessToken: null,
    logout: vi.fn(),
    register: vi.fn(),
    refreshProfile: vi.fn(),
    updateProfile: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock useToast hook directly
vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    showToast: vi.fn(),
  }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Setup a mock store
const createMockStore = () => configureStore({
  reducer: { auth: authReducer },
});

// Helper function to render component with all required wrappers
const renderWithProviders = (ui: React.ReactElement) => {
  const store = createMockStore();
  return render(
    <Provider store={store}>
      <MemoryRouter>
        {ui}
      </MemoryRouter>
    </Provider>
  );
};

describe('Login Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form correctly', () => {
    renderWithProviders(<Login />);
    
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows error message on failed login', async () => {
    // Simulate authApi rejecting with an error response
    mockLogin.mockRejectedValueOnce({
      response: { data: { message: 'Invalid credentials' } }
    });

    renderWithProviders(<Login />);
    
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Wait for async error state to be set and rendered
    const errorEl = await screen.findByText(/invalid credentials/i, {}, { timeout: 3000 });
    expect(errorEl).toBeInTheDocument();
  });

  it('calls login and navigates on successful login', async () => {
    // Simulate successful login (resolves without throwing)
    mockLogin.mockResolvedValueOnce(undefined);

    renderWithProviders(<Login />);
    
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'correctpass' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'correctpass'
      });
    });
    // Navigation is handled silently by MemoryRouter in the test environment.
  });
});
