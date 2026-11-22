import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import AuthPage from './AuthPage';

vi.mock('./Dashboard', () => ({
  default: () => <div data-testid="dashboard-stub">Dashboard</div>,
}));

describe('AuthPage login with email or username', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.history.pushState(null, '', '/login');
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  test('logs in cleanly when user enters a valid email address in Email or Username field', async () => {
    const onAuthSuccess = vi.fn();
    globalThis.fetch.mockImplementation((url) => {
      if (String(url).includes('/users/me')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: { id: 1, name: 'Owner', email: 'owner@stockpro.test' } }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            success: true,
            user: { id: 1, name: 'Owner', email: 'owner@stockpro.test' },
            token: 'tok-123',
          }),
      });
    });

    render(<AuthPage initialMode="login" onAuthSuccess={onAuthSuccess} />);

    fireEvent.change(screen.getByLabelText(/email or username/i), {
      target: { value: 'owner@stockpro.test' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'Secret123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() => expect(onAuthSuccess).toHaveBeenCalledTimes(1));

    const loginCall = globalThis.fetch.mock.calls.find(([url]) => String(url).endsWith('/login'));
    expect(loginCall).toBeDefined();
    expect(JSON.parse(loginCall[1].body)).toEqual({
      login: 'owner@stockpro.test',
      password: 'Secret123!',
    });
    expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
  });

  test('logs in cleanly when user enters a username in Email or Username field', async () => {
    const onAuthSuccess = vi.fn();
    globalThis.fetch.mockImplementation((url) => {
      if (String(url).includes('/users/me')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: { id: 2, name: 'Cashier', username: 'cashier_john' } }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            success: true,
            user: { id: 2, name: 'Cashier', username: 'cashier_john' },
            token: 'tok-456',
          }),
      });
    });

    render(<AuthPage initialMode="login" onAuthSuccess={onAuthSuccess} />);

    fireEvent.change(screen.getByLabelText(/email or username/i), {
      target: { value: 'cashier_john' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'Secret123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() => expect(onAuthSuccess).toHaveBeenCalledTimes(1));

    const loginCall = globalThis.fetch.mock.calls.find(([url]) => String(url).endsWith('/login'));
    expect(loginCall).toBeDefined();
    expect(JSON.parse(loginCall[1].body)).toEqual({
      login: 'cashier_john',
      password: 'Secret123!',
    });
  });

  test('shows clear error when Email or Username field is blank on login', async () => {
    render(<AuthPage initialMode="login" />);

    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'Secret123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/please enter your email or username/i);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
