import { useState, useEffect, useRef } from 'react';
import Dashboard from './Dashboard';
import { API_URL as API } from '../config/api';
import NexumPayCheckoutModal from '../components/marketing/NexumPayCheckoutModal';
import { navigateTo } from '../utils/navigation';
import { isSubscriptionExpiredResponse } from '../utils/subscription';

/* ── Password strength evaluation ── */
function getStrength(pwd) {
  if (!pwd) return 0;
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return s;
}

const STRENGTH_LABEL = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLOR = ['', '#ef4444', '#f59e0b', '#10b981', '#059669'];

/* ── SVG icons ── */
const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

/* ── Password field with visibility toggle ── */
function PasswordField({ name, label, placeholder, value, onChange, showStrength, labelExtra }) {
  const [visible, setVisible] = useState(false);
  const strength = getStrength(value);

  return (
    <div className="field-group">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <label className="field-label" htmlFor={name}>{label}</label>
        {labelExtra}
      </div>
      <div className="pw-wrap">
        <input
          id={name}
          className="field-input"
          name={name}
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required
        />
        <button
          type="button"
          className="eye-btn"
          onClick={() => setVisible(v => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {showStrength && value && (
        <div className="strength-wrap">
          <div className="strength-bars">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="strength-bar"
                style={{ backgroundColor: i <= strength ? STRENGTH_COLOR[strength] : undefined }}
              />
            ))}
          </div>
          <span className="strength-label" style={{ color: STRENGTH_COLOR[strength] }}>
            {STRENGTH_LABEL[strength]} password
          </span>
        </div>
      )}
    </div>
  );
}

/* ── Helper to determine mode from pathname ── */
function getPathMode() {
  if (typeof window === 'undefined') return 'login';
  const rawPath = window.location.pathname.replace(/[\\/]+/g, '/').toLowerCase();
  if (rawPath === '/register' || rawPath.startsWith('/register/')) return 'register';
  if (rawPath === '/forgot-password' || rawPath.startsWith('/forgot-password/')) return 'forgot-password';
  return 'login';
}

/* ── Main Auth Page ── */
export default function AuthPage({ initialMode, onAuthSuccess, onLogout }) {
  const [mode, setMode] = useState(() => initialMode || getPathMode());
  const [form, setForm] = useState({
    name: '',
    login: '',
    email: '',
    username: '',
    password: '',
    password_confirmation: '',
    business_name: '',
    phone: '',
    address: '',
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoDragOver, setLogoDragOver] = useState(false);
  const logoInputRef = useRef(null);
  const [error, setError] = useState(null);
  const [expiredSubscription, setExpiredSubscription] = useState(null);
  const [renewalPrefill, setRenewalPrefill] = useState(null);
  const [renewalCheckoutOpen, setRenewalCheckoutOpen] = useState(false);
  const [renewalSuccess, setRenewalSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ── Multi-step Forgot Password State (Owner OTP Flow) ── */
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotTenantId, setForgotTenantId] = useState(null);
  const [forgotResetToken, setForgotResetToken] = useState(null);
  const [otpVerified, setOtpVerified] = useState(false);
  const [forgotPassword, setForgotPassword] = useState('');
  const [forgotPasswordConfirmation, setForgotPasswordConfirmation] = useState('');
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState(null);
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => {
    return localStorage.getItem('token') || null;
  });

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleLogoChange = (file) => {
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const loginIdentifier = (form.login || form.email || '').trim();
    const trimmedEmail = (form.email || '').trim();
    const trimmedUsername = (form.username || '').trim();

    if (mode === 'login') {
      if (!loginIdentifier) {
        setError('Please enter your email or username');
        setLoading(false);
        return;
      }
      if (loginIdentifier.includes('@') && !emailRegex.test(loginIdentifier)) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }
    } else {
      if (!form.name.trim()) {
        setError('Full name is required');
        setLoading(false);
        return;
      }
      if (!emailRegex.test(trimmedEmail)) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }
      if (form.password.length < 8) {
        setError('Password must be at least 8 characters');
        setLoading(false);
        return;
      }
      if (form.password !== form.password_confirmation) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }
      if (!trimmedUsername || trimmedUsername.length < 3 || trimmedUsername.length > 30 || !/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
        setError('Username must be 3-30 characters (letters, numbers, underscores)');
        setLoading(false);
        return;
      }
      if (!form.business_name.trim()) {
        setError('Business name is required');
        setLoading(false);
        return;
      }
    }

    if (!form.password) {
      setError('Password is required');
      setLoading(false);
      return;
    }
    try {
      let res;
      if (mode === 'login') {
        res = await fetch(`${API}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ login: loginIdentifier, password: form.password }),
        });
      } else {
        // Use FormData to support file upload
        const fd = new FormData();
        fd.append('name', form.name.trim());
        fd.append('email', trimmedEmail);
        fd.append('username', trimmedUsername);
        fd.append('password', form.password);
        fd.append('password_confirmation', form.password_confirmation);
        fd.append('business_name', form.business_name.trim());
        if (form.phone) fd.append('phone', form.phone);
        if (form.address) fd.append('address', form.address);
        if (logoFile) fd.append('logo', logoFile);

        res = await fetch(`${API}/register`, {
          method: 'POST',
          headers: { 'Accept': 'application/json' }, // NO Content-Type – let browser set multipart boundary
          body: fd,
        });
      }

      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { message: text }; }

      if (!res.ok) {
        if (isSubscriptionExpiredResponse(res.status, data)) {
          setExpiredSubscription(data);
          setRenewalPrefill(data);
        } else {
          setExpiredSubscription(null);
        }
        setRenewalSuccess(null);
        setError(data?.message || `Error ${res.status}`);
      } else if (data.success && data.user && data.token) {
        setExpiredSubscription(null);
        setRenewalPrefill(null);
        setRenewalCheckoutOpen(false);
        setRenewalSuccess(null);
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        if (onAuthSuccess) {
          onAuthSuccess(data.user, data.token);
        }
        const savedRedirect = sessionStorage.getItem('redirect_after_login') || '/overview';
        sessionStorage.removeItem('redirect_after_login');
        window.history.pushState(null, '', savedRedirect);
        window.dispatchEvent(new Event('popstate'));
      }
    } catch {
      setError('Could not reach the server. Please verify the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setError(null);
    setForm({
      name: '',
      login: '',
      email: '',
      username: '',
      password: '',
      password_confirmation: '',
      business_name: '',
      phone: '',
      address: '',
    });
    setLogoFile(null);
    setLogoPreview(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    if (onLogout) onLogout();
    window.history.pushState(null, '', '/login');
    window.dispatchEvent(new Event('popstate'));
    setMode('login');
  };

  const resetForgotState = (prefillEmail = '') => {
    setForgotStep(1);
    setForgotEmail(prefillEmail);
    setForgotOtp('');
    setForgotTenantId(null);
    setForgotResetToken(null);
    setOtpVerified(false);
    setForgotPassword('');
    setForgotPasswordConfirmation('');
    setForgotSuccessMessage(null);
  };

  const switchMode = newMode => {
    setMode(newMode);
    setError(null);
    setExpiredSubscription(null);
    setRenewalPrefill(null);
    setRenewalCheckoutOpen(false);
    setRenewalSuccess(null);
    if (newMode === 'forgot-password') {
      const candidate = (form.login || form.email || '').trim();
      resetForgotState(candidate.includes('@') ? candidate : '');
    } else {
      resetForgotState('');
    }
    const target =
      newMode === 'register'
        ? '/register'
        : newMode === 'forgot-password'
          ? '/forgot-password'
          : '/login';
    if (window.location.pathname !== target) {
      window.history.pushState(null, '', target);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  /* ── Step 1: Send OTP to Owner Email ── */
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setForgotSuccessMessage(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const trimmedEmail = forgotEmail.trim();
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid owner email address');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/forgot-password/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { message: text }; }

      if (!res.ok || !data?.success) {
        setError(data?.message || `Error ${res.status}`);
        return;
      }

      setForgotTenantId(data.tenant_id ?? null);
      setForgotOtp('');
      setOtpVerified(false);
      setForgotResetToken(null);
      setForgotSuccessMessage(data.message || 'A 6-digit OTP has been sent to your email address.');
      setForgotStep(2);
    } catch {
      setError('Could not reach the server. Please verify the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 2: Verify OTP for Owner's Tenant ── */
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setForgotSuccessMessage(null);

    const cleanedOtp = forgotOtp.trim();
    if (!/^\d{6}$/.test(cleanedOtp)) {
      setOtpVerified(false);
      setForgotResetToken(null);
      setError('Please enter a valid 6-digit OTP code');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        email: forgotEmail.trim(),
        otp: cleanedOtp,
      };
      if (forgotTenantId !== null) {
        payload.tenant_id = forgotTenantId;
      }

      const res = await fetch(`${API}/forgot-password/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { message: text }; }

      if (!res.ok || !data?.success) {
        // Restrict user from accessing Step 3 when OTP is wrong
        setOtpVerified(false);
        setForgotResetToken(null);
        setForgotStep(2);
        setError(data?.message || 'Invalid OTP code. Please try again.');
        return;
      }

      setOtpVerified(true);
      setForgotResetToken(data.reset_token || null);
      if (data.tenant_id !== undefined) {
        setForgotTenantId(data.tenant_id);
      }
      setForgotSuccessMessage(data.message || 'OTP verified! Please enter your new password.');
      setForgotStep(3);
    } catch {
      setOtpVerified(false);
      setError('Could not reach the server. Please verify the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 3: Set New Password after OTP Verification ── */
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setForgotSuccessMessage(null);

    if (!otpVerified || forgotStep !== 3) {
      setError('Please verify your OTP before setting a new password.');
      setForgotStep(2);
      return;
    }

    if (!forgotPassword || forgotPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (forgotPassword !== forgotPasswordConfirmation) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        email: forgotEmail.trim(),
        otp: forgotOtp.trim(),
        reset_token: forgotResetToken,
        password: forgotPassword,
        password_confirmation: forgotPasswordConfirmation,
      };
      if (forgotTenantId !== null) {
        payload.tenant_id = forgotTenantId;
      }

      const res = await fetch(`${API}/forgot-password/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { message: text }; }

      if (!res.ok || !data?.success) {
        setError(data?.message || `Error ${res.status}`);
        return;
      }

      const resetEmail = forgotEmail.trim();
      setForm(f => ({ ...f, login: resetEmail, email: resetEmail, password: '' }));
      resetForgotState('');
      setMode('login');
      if (window.location.pathname !== '/login') {
        window.history.pushState(null, '', '/login');
        window.dispatchEvent(new Event('popstate'));
      }
      setRenewalSuccess(
        data.message || 'Password reset successfully! Please sign in with your new password.'
      );
    } catch {
      setError('Could not reach the server. Please verify the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const newMode = getPathMode();
      setMode(newMode);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const rawPath = window.location.pathname.replace(/[\\/]+/g, '/');
    const path = rawPath.toLowerCase();

    if (user && token) {
      if (
        path === '/login' ||
        path.startsWith('/login/') ||
        path === '/register' ||
        path.startsWith('/register/') ||
        path === '/forgot-password' ||
        path.startsWith('/forgot-password/')
      ) {
        const savedRedirect = sessionStorage.getItem('redirect_after_login') || '/overview';
        sessionStorage.removeItem('redirect_after_login');
        window.history.replaceState(null, '', savedRedirect);
        window.dispatchEvent(new Event('popstate'));
      }
      fetch(`${API}/users/me`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
      })
        .then(r => (r.ok ? r.json() : null))
        .then(data => {
          if (data?.data) {
            setUser(data.data);
            localStorage.setItem('user', JSON.stringify(data.data));
          }
        })
        .catch(() => {});
    } else {
      if (path === '/register' || path.startsWith('/register/')) {
        setMode('register');
      } else if (path === '/forgot-password' || path.startsWith('/forgot-password/')) {
        setMode('forgot-password');
      } else if (path === '/login' || path.startsWith('/login/')) {
        setMode('login');
      }
    }
  }, [user, token]);

  if (user && token) return <Dashboard user={user} token={token} onLogout={logout} onUserUpdate={setUser} />;

  const isLogin = mode === 'login';
  const isForgot = mode === 'forgot-password';

  return (
    <div className="auth-page">
      <div className={`auth-container ${mode === 'register' ? 'register-mode' : ''}`}>
        {/* Brand header */}
        <div className="auth-brand-header">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              window.history.pushState(null, '', '/');
              window.dispatchEvent(new Event('popstate'));
            }}
            className="auth-brand-badge-wrap"
            style={{ textDecoration: 'none', cursor: 'pointer' }}
            title="Return to StockPro Homepage"
          >
            <div className="auth-brand-logo" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <span className="auth-brand-name">StockPro</span>
            <span className="auth-brand-tag">Inventory &amp; Sales</span>
          </a>
        </div>

        {/* Card */}
        <div className="auth-card">
          {/* Segmented control tabs (Sign in / Register) */}
          {!isForgot && (
            <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
              <button
                type="button"
                role="tab"
                aria-selected={isLogin}
                className={`auth-tab ${isLogin ? 'active' : ''}`}
                onClick={() => switchMode('login')}
              >
                Sign in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'register'}
                className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
                onClick={() => switchMode('register')}
              >
                Register business
              </button>
            </div>
          )}

          {/* Multi-step progress indicator for Forgot Password */}
          {isForgot && (
            <div
              data-testid="forgot-password-stepper"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
                padding: '10px 12px',
                background: '#f8fafc',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
              }}
            >
              {[
                { step: 1, label: '1. Email' },
                { step: 2, label: '2. Verify OTP' },
                { step: 3, label: '3. New Password' },
              ].map((item) => {
                const isCurrent = forgotStep === item.step;
                const isDone =
                  forgotStep > item.step || (item.step === 2 && otpVerified && forgotStep === 3);
                return (
                  <div
                    key={item.step}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '6px 8px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: isCurrent || isDone ? 700 : 500,
                      backgroundColor: isCurrent
                        ? '#4f46e5'
                        : isDone
                          ? '#ecfdf5'
                          : 'transparent',
                      color: isCurrent
                        ? '#ffffff'
                        : isDone
                          ? '#059669'
                          : '#64748b',
                      border: isDone && !isCurrent ? '1px solid #a7f3d0' : '1px solid transparent',
                      textAlign: 'center',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {item.label}
                  </div>
                );
              })}
            </div>
          )}

          {/* Form Header */}
          <div className="auth-header">
            <h1 className="auth-title">
              {isForgot
                ? forgotStep === 1
                  ? 'Reset owner password'
                  : forgotStep === 2
                    ? 'Enter verification OTP'
                    : 'Create new password'
                : isLogin
                  ? 'Sign in to your account'
                  : 'Register your business'}
            </h1>
            <p className="auth-subtitle">
              {isForgot
                ? forgotStep === 1
                  ? 'Enter the email address associated with your business owner account to receive a one-time password (OTP).'
                  : forgotStep === 2
                    ? `Enter the 6-digit OTP sent to ${forgotEmail}.`
                    : 'Your OTP has been verified. Enter and confirm your new owner password below.'
                : isLogin
                  ? 'Enter your email or username and password to access your workspace.'
                  : 'Create a business profile and your primary administrator account.'}
            </p>
          </div>

          {/* Error notification */}
          {error && (
            <div className="auth-error" role="alert">
              <svg className="auth-error-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Forgot password step confirmation notice */}
          {isForgot && forgotSuccessMessage && (
            <div
              role="status"
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                backgroundColor: '#ecfdf5',
                border: '1px solid #6ee7b7',
                color: '#065f46',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {forgotSuccessMessage}
            </div>
          )}

          {/* Expired subscription renewal prompt */}
          {expiredSubscription && (
            <div
              data-testid="auth-subscription-expired-actions"
              style={{
                marginTop: 10,
                marginBottom: 14,
                padding: '12px 14px',
                borderRadius: 10,
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {expiredSubscription?.tenant?.name && (
                <div style={{ fontSize: 12, color: '#991b1b', fontWeight: 600 }}>
                  Workspace: {expiredSubscription.tenant.name}
                </div>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setRenewalCheckoutOpen(true)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: '#071629',
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Subscribe Now
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('/pricing')}
                  style={{
                    padding: '9px 14px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  View Pricing Plans
                </button>
              </div>
            </div>
          )}

          {/* Subscription renewal confirmation */}
          {renewalSuccess && (
            <div
              role="status"
              style={{
                marginBottom: 14,
                padding: '10px 12px',
                borderRadius: 8,
                backgroundColor: '#ecfdf5',
                border: '1px solid #6ee7b7',
                color: '#065f46',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {renewalSuccess}
            </div>
          )}

          {(expiredSubscription || renewalCheckoutOpen) && (
            <NexumPayCheckoutModal
              isOpen={renewalCheckoutOpen}
              isModal={true}
              initialPlanId={
                (expiredSubscription || renewalPrefill)?.tenant?.subscription_plan === 'business'
                  ? 'business'
                  : 'starter'
              }
              prefillCustomer={{
                name: (expiredSubscription || renewalPrefill)?.tenant?.name || '',
                email: (expiredSubscription || renewalPrefill)?.tenant?.email || '',
                businessName: (expiredSubscription || renewalPrefill)?.tenant?.name || '',
                phone: (expiredSubscription || renewalPrefill)?.tenant?.phone || '',
                renewalToken: (expiredSubscription || renewalPrefill)?.renewal_token || '',
              }}
              continueLabel="Sign In to Workspace"
              onContinue={() => setRenewalCheckoutOpen(false)}
              onClose={() => setRenewalCheckoutOpen(false)}
              onPaymentSuccess={() => {
                setExpiredSubscription(null);
                setError(null);
                setRenewalSuccess(
                  'Subscription activated! Sign in below to access your workspace.'
                );
              }}
            />
          )}

          {/* Multi-step Forgot Password Form */}
          {isForgot ? (
            <>
              {forgotStep === 1 && (
                <form onSubmit={handleSendOtp} className="auth-form" noValidate data-testid="forgot-step-1-form">
                  <div className="field-group">
                    <label className="field-label" htmlFor="forgot_email">Owner Email Address</label>
                    <input
                      id="forgot_email"
                      className="field-input"
                      name="forgot_email"
                      type="email"
                      placeholder="Enter your owner email address"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </div>

                  <button className="submit-btn" type="submit" disabled={loading}>
                    {loading && <span className="btn-spinner" />}
                    {loading ? 'Sending OTP...' : 'Send OTP'}
                  </button>
                </form>
              )}

              {forgotStep === 2 && (
                <form onSubmit={handleVerifyOtp} className="auth-form" noValidate data-testid="forgot-step-2-form">
                  <div className="field-group">
                    <label className="field-label" htmlFor="forgot_otp">One-Time Password (OTP)</label>
                    <input
                      id="forgot_otp"
                      className="field-input mono"
                      name="forgot_otp"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Enter 6-digit OTP"
                      value={forgotOtp}
                      onChange={e => setForgotOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      style={{ letterSpacing: '0.3em', fontSize: '1.05rem', textAlign: 'center', fontWeight: 700 }}
                      required
                    />
                  </div>

                  <button className="submit-btn" type="submit" disabled={loading}>
                    {loading && <span className="btn-spinner" />}
                    {loading ? 'Verifying OTP...' : 'Verify OTP'}
                  </button>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <button
                      type="button"
                      className="auth-toggle-link"
                      style={{ fontSize: '0.8rem' }}
                      disabled={loading}
                      onClick={() => {
                        setError(null);
                        setForgotSuccessMessage(null);
                        setOtpVerified(false);
                        setForgotResetToken(null);
                        setForgotStep(1);
                      }}
                    >
                      &larr; Change email
                    </button>
                    <button
                      type="button"
                      className="auth-toggle-link"
                      style={{ fontSize: '0.8rem' }}
                      disabled={loading}
                      onClick={handleSendOtp}
                    >
                      Resend OTP
                    </button>
                  </div>
                </form>
              )}

              {forgotStep === 3 && otpVerified && (
                <form onSubmit={handleResetPassword} className="auth-form" noValidate data-testid="forgot-step-3-form">
                  <PasswordField
                    name="forgot_password"
                    label="New password"
                    placeholder="Create a new password (min. 8 chars)"
                    value={forgotPassword}
                    onChange={e => setForgotPassword(e.target.value)}
                    showStrength={true}
                  />

                  <PasswordField
                    name="forgot_password_confirmation"
                    label="Confirm new password"
                    placeholder="Repeat your new password"
                    value={forgotPasswordConfirmation}
                    onChange={e => setForgotPasswordConfirmation(e.target.value)}
                    showStrength={false}
                  />

                  <button className="submit-btn" type="submit" disabled={loading}>
                    {loading && <span className="btn-spinner" />}
                    {loading ? 'Resetting password...' : 'Reset password'}
                  </button>
                </form>
              )}

              <p className="auth-toggle">
                Remembered your password?{' '}
                <button
                  type="button"
                  className="auth-toggle-link"
                  onClick={() => switchMode('login')}
                >
                  Sign in here
                </button>
              </p>
            </>
          ) : (
            <>
              {/* Login / Register Form */}
              <form onSubmit={submit} className="auth-form" noValidate>
                {!isLogin && (
                  <div className="field-group">
                    <label className="field-label" htmlFor="name">Full name</label>
                    <input
                      id="name"
                      className="field-input"
                      name="name"
                      placeholder="e.g. John Doe"
                      value={form.name}
                      onChange={handle}
                      required
                    />
                  </div>
                )}

                {isLogin ? (
                  <div className="field-group">
                    <label className="field-label" htmlFor="login">Email or Username</label>
                    <input
                      id="login"
                      className="field-input"
                      name="login"
                      type="text"
                      placeholder="Enter your email or username"
                      value={form.login || ''}
                      onChange={handle}
                      autoComplete="username"
                      required
                    />
                  </div>
                ) : (
                  <div className="field-group">
                    <label className="field-label" htmlFor="email">Email address</label>
                    <input
                      id="email"
                      className="field-input"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={form.email}
                      onChange={handle}
                      required
                    />
                  </div>
                )}

                <PasswordField
                  name="password"
                  label="Password"
                  placeholder={isLogin ? 'Enter your password' : 'Create a secure password (min. 8 chars)'}
                  value={form.password}
                  onChange={handle}
                  showStrength={!isLogin}
                  labelExtra={
                    isLogin ? (
                      <button
                        type="button"
                        className="auth-toggle-link"
                        style={{ fontSize: '0.78rem' }}
                        onClick={() => switchMode('forgot-password')}
                      >
                        Forgot password?
                      </button>
                    ) : null
                  }
                />

                {!isLogin && (
                  <>
                    <PasswordField
                      name="password_confirmation"
                      label="Confirm password"
                      placeholder="Repeat your password"
                      value={form.password_confirmation}
                      onChange={handle}
                      showStrength={false}
                    />

                    <div className="auth-section-divider">
                      <span>Business Profile</span>
                    </div>

                    {/* Username */}
                    <div className="field-group">
                      <label className="field-label" htmlFor="username">Username</label>
                      <input
                        id="username"
                        className="field-input"
                        name="username"
                        type="text"
                        placeholder="e.g. john_doe (3-30 chars, letters/numbers/underscores)"
                        value={form.username}
                        onChange={handle}
                        required
                        minLength={3}
                        maxLength={30}
                        pattern="^[a-zA-Z0-9_]+$"
                      />
                    </div>

                    {/* Logo upload */}
                    <div className="field-group">
                      <label className="field-label">Business logo (optional)</label>
                      <div
                        onClick={() => logoInputRef.current?.click()}
                        onDragOver={e => { e.preventDefault(); setLogoDragOver(true); }}
                        onDragLeave={() => setLogoDragOver(false)}
                        onDrop={e => {
                          e.preventDefault();
                          setLogoDragOver(false);
                          const f = e.dataTransfer.files[0];
                          if (f && f.type.startsWith('image/')) handleLogoChange(f);
                        }}
                        style={{
                          border: `2px dashed ${logoDragOver ? '#4f46e5' : '#e2e8f0'}`,
                          borderRadius: 12,
                          padding: '20px 16px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 10,
                          background: logoDragOver ? '#eef2ff' : '#fafafa',
                          transition: 'all 0.15s',
                        }}
                      >
                        {logoPreview ? (
                          <>
                            <img
                              src={logoPreview}
                              alt="Logo preview"
                              style={{ width: 72, height: 72, objectFit: 'contain', borderRadius: 10 }}
                            />
                            <span style={{ fontSize: 12, color: '#4f46e5', fontWeight: 600 }}>{logoFile?.name}</span>
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>Click to change</span>
                          </>
                        ) : (
                          <>
                            <div style={{
                              width: 48, height: 48, borderRadius: 12,
                              background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                              </svg>
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Upload your logo</span>
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>PNG, JPG, SVG · max 2 MB · drag or click</span>
                          </>
                        )}
                      </div>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => handleLogoChange(e.target.files[0])}
                      />
                    </div>

                    <div className="field-group">
                      <label className="field-label" htmlFor="business_name">Business or store name</label>
                      <input
                        id="business_name"
                        className="field-input"
                        name="business_name"
                        placeholder="e.g. Acme Retail Ltd."
                        value={form.business_name}
                        onChange={handle}
                        required
                      />
                    </div>

                    <div className="field-group">
                      <label className="field-label" htmlFor="phone">Phone number (optional)</label>
                      <input
                        id="phone"
                        className="field-input"
                        name="phone"
                        type="tel"
                        placeholder="+256 700 000 000"
                        value={form.phone}
                        onChange={handle}
                      />
                    </div>

                    <div className="field-group">
                      <label className="field-label" htmlFor="address">Business address (optional)</label>
                      <textarea
                        id="address"
                        className="field-input"
                        name="address"
                        placeholder="Plot, Street, City, Country"
                        value={form.address}
                        onChange={handle}
                      />
                    </div>
                  </>
                )}

                <button className="submit-btn" type="submit" disabled={loading}>
                  {loading && <span className="btn-spinner" />}
                  {loading
                    ? (isLogin ? 'Signing in...' : 'Creating account...')
                    : (isLogin ? 'Sign in' : 'Create business account')}
                </button>
              </form>

              {/* Toggle helper */}
              <p className="auth-toggle">
                {isLogin ? "Don't have an account yet? " : 'Already registered? '}
                <button
                  type="button"
                  className="auth-toggle-link"
                  onClick={() => switchMode(isLogin ? 'register' : 'login')}
                >
                  {isLogin ? 'Register your business' : 'Sign in here'}
                </button>
              </p>
            </>
          )}
        </div>

        {/* High-trust footer */}
        <div className="auth-footer">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>Multi-tenant data isolation &bull; 256-bit SSL session</span>
        </div>

        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              window.history.pushState(null, '', '/');
              window.dispatchEvent(new Event('popstate'));
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              color: '#64748b',
              textDecoration: 'none',
              fontWeight: 500,
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#0b1f3a')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
          >
            <span>&larr;</span>
            <span>Return to StockPro Homepage</span>
          </a>
        </div>
      </div>
    </div>
  );
}
