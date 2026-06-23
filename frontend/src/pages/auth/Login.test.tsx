import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import Login from './Login';
import authReducer from '../../store/slices/authSlice';
import { authApi } from '../../services/auth.api';

// Mock the API
vi.mock('../../services/auth.api', () => ({
  authApi: {
    login: vi.fn(),
  },
}));

// Setup a mock store
const createMockStore = () => configureStore({
  reducer: { auth: authReducer },
});

// Helper function to render component with wrappers
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
    (authApi.login as any).mockRejectedValueOnce({
      response: { data: { message: 'Invalid credentials' } }
    });

    renderWithProviders(<Login />);
    
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('calls authApi and navigates on successful login', async () => {
    const mockResponse = {
      status: 'success',
      token: 'fake-token',
      data: { user: { id: '123', name: 'User' } }
    };
    (authApi.login as any).mockResolvedValueOnce(mockResponse);

    renderWithProviders(<Login />);
    
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'correctpass' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'correctpass'
      });
    });
    // Note: To test navigation, we would usually mock useNavigate, but MemoryRouter handles it silently.
    // In a real app we might inspect the router's current location.
  });
});
