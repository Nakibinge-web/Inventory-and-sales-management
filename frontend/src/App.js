import React, { useState, useEffect, useCallback } from 'react';
import './styles/marketing/index.css';

// Public Marketing Pages
import LandingPage from './pages/marketing/LandingPage';
import HowItWorksPage from './pages/marketing/HowItWorksPage';
import PricingPage from './pages/marketing/PricingPage';
import ContactPage from './pages/marketing/ContactPage';

// Authentication & Dashboard
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';

const DASHBOARD_ROUTES = [
  'overview',
  'pos',
  'products',
  'categories',
  'suppliers',
  'customers',
  'sales',
  'invoices',
  'purchases',
  'stock-movements',
  'reports',
  'ai',
  'users',
  'settings',
  'dashboard',
  'stock',
  'stockmovements',
  'point-of-sale'
];

function getNormalizedPath() {
  if (typeof window === 'undefined') return '/';
  const clean = window.location.pathname.replace(/\/+/g, '/').toLowerCase();
  return clean === '' ? '/' : clean;
}

export default function App() {
  const [currentPath, setCurrentPath] = useState(getNormalizedPath);
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

  // Listen for browser navigation (popstate)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(getNormalizedPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleAuthSuccess = useCallback((newUser, newToken) => {
    setUser(newUser);
    setToken(newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.setItem('token', newToken);

    const target = sessionStorage.getItem('redirect_after_login') || '/overview';
    sessionStorage.removeItem('redirect_after_login');

    if (window.location.pathname !== target) {
      window.history.pushState(null, '', target);
    }
    setCurrentPath(target.toLowerCase());
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('redirect_after_login');

    if (window.location.pathname !== '/login') {
      window.history.pushState(null, '', '/login');
    }
    setCurrentPath('/login');
  }, []);

  const handleUserUpdate = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }, []);

  // Determine route type
  const pathSegment = currentPath.replace(/^\//, '').split('/')[0];
  const isDashboardRoute = DASHBOARD_ROUTES.includes(pathSegment);

  // 1. Dashboard Routes
  if (isDashboardRoute) {
    if (!user || !token) {
      // Unauthenticated access to dashboard: remember path and redirect to login
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('redirect_after_login', window.location.pathname);
        window.history.replaceState(null, '', '/login');
      }
      return (
        <AuthPage
          initialMode="login"
          onAuthSuccess={handleAuthSuccess}
          onLogout={handleLogout}
        />
      );
    }

    return (
      <Dashboard
        user={user}
        token={token}
        onLogout={handleLogout}
        onUserUpdate={handleUserUpdate}
      />
    );
  }

  // 2. Authentication Routes
  if (currentPath === '/login' || currentPath.startsWith('/login/')) {
    if (user && token) {
      // Already authenticated: redirect to dashboard
      const target = sessionStorage.getItem('redirect_after_login') || '/overview';
      sessionStorage.removeItem('redirect_after_login');
      window.history.replaceState(null, '', target);
      return (
        <Dashboard
          user={user}
          token={token}
          onLogout={handleLogout}
          onUserUpdate={handleUserUpdate}
        />
      );
    }
    return (
      <AuthPage
        initialMode="login"
        onAuthSuccess={handleAuthSuccess}
        onLogout={handleLogout}
      />
    );
  }

  if (currentPath === '/register' || currentPath.startsWith('/register/')) {
    if (user && token) {
      // Already authenticated: redirect to dashboard
      const target = sessionStorage.getItem('redirect_after_login') || '/overview';
      sessionStorage.removeItem('redirect_after_login');
      window.history.replaceState(null, '', target);
      return (
        <Dashboard
          user={user}
          token={token}
          onLogout={handleLogout}
          onUserUpdate={handleUserUpdate}
        />
      );
    }
    return (
      <AuthPage
        initialMode="register"
        onAuthSuccess={handleAuthSuccess}
        onLogout={handleLogout}
      />
    );
  }

  // 3. Public Marketing Routes
  if (currentPath === '/pricing' || currentPath.startsWith('/pricing/')) {
    return <PricingPage />;
  }

  if (currentPath === '/how-it-works' || currentPath.startsWith('/how-it-works/')) {
    return <HowItWorksPage />;
  }

  if (currentPath === '/contact' || currentPath.startsWith('/contact/')) {
    return <ContactPage />;
  }

  // Default: Landing / Home Page
  if (currentPath === '/' || currentPath === '') {
    return <LandingPage />;
  }

  // 4. Fallback for unmapped routes
  if (user && token) {
    window.history.replaceState(null, '', '/overview');
    return (
      <Dashboard
        user={user}
        token={token}
        onLogout={handleLogout}
        onUserUpdate={handleUserUpdate}
      />
    );
  }

  window.history.replaceState(null, '', '/');
  return <LandingPage />;
}
