import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import AuthPage from './AuthPage';

describe('AuthPage multi-step Forgot Password flow', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.history.pushState(null, '', '/login');
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('completes 3-step forgot password flow and restricts step 3 when OTP is wrong', async () => {
    render(<AuthPage initialMode="login" />);

    // Click "Forgot password?" on login screen
    const forgotBtn = screen.getByRole('button', { name: /forgot password\?/i });
    fireEvent.click(forgotBtn);

    // Step 1 is displayed
    expect(screen.getByTestId('forgot-step-1-form')).toBeInTheDocument();
    expect(screen.queryByTestId('forgot-step-2-form')).not.toBeInTheDocument();
    expect(screen.queryByTestId('forgot-step-3-form')).not.toBeInTheDocument();

    // Enter owner email and submit Step 1
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          success: true,
          message: 'A 6-digit OTP has been sent to your email address.',
          tenant_id: 42,
        }),
    });

    fireEvent.change(screen.getByLabelText(/owner email address/i), {
      target: { value: 'owner@tenant42.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send otp/i }));

    // Wait for Step 2 (OTP input)
    await waitFor(() => {
      expect(screen.getByTestId('forgot-step-2-form')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('forgot-step-3-form')).not.toBeInTheDocument();

    // Enter WRONG OTP -> must stay on Step 2 and restrict access to Step 3
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      text: async () =>
        JSON.stringify({
          success: false,
          message: 'The OTP entered is incorrect. Please check your email and try again.',
        }),
    });

    const otpInput = screen.getByLabelText(/one-time password \(otp\)/i);
    fireEvent.change(otpInput, { target: { value: '111111' } });
    fireEvent.click(screen.getByRole('button', { name: /verify otp/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/the otp entered is incorrect/i);
    });
    expect(screen.getByTestId('forgot-step-2-form')).toBeInTheDocument();
    expect(screen.queryByTestId('forgot-step-3-form')).not.toBeInTheDocument();

    // Enter CORRECT OTP -> proceeds to Step 3 (New password form)
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          success: true,
          message: 'OTP verified successfully. Please enter your new password.',
          reset_token: 'tenant-42-secret-token',
          tenant_id: 42,
        }),
    });

    fireEvent.change(otpInput, { target: { value: '654321' } });
    fireEvent.click(screen.getByRole('button', { name: /verify otp/i }));

    await waitFor(() => {
      expect(screen.getByTestId('forgot-step-3-form')).toBeInTheDocument();
    });

    // Submit new password in Step 3
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          success: true,
          message: 'Password reset successfully. You can now sign in with your new password.',
        }),
    });

    fireEvent.change(screen.getByLabelText(/^new password$/i), {
      target: { value: 'NewStrongPass1!' },
    });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: 'NewStrongPass1!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    // Verify it returns to Sign In and shows confirmation message
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('status')).toHaveTextContent(/password reset successfully/i);

    // Verify tenant_id and reset_token were sent in Step 3 request
    const lastCall = global.fetch.mock.calls[global.fetch.mock.calls.length - 1];
    expect(lastCall[0]).toContain('/forgot-password/reset-password');
    const sentBody = JSON.parse(lastCall[1].body);
    expect(sentBody).toMatchObject({
      email: 'owner@tenant42.com',
      otp: '654321',
      reset_token: 'tenant-42-secret-token',
      tenant_id: 42,
      password: 'NewStrongPass1!',
      password_confirmation: 'NewStrongPass1!',
    });
  }, 20000);
});
