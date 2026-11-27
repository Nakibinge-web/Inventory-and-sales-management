/**
 * API Configuration
 * Centralized API URL configuration for the entire application
 */

const envApiUrl = (import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL || '').trim();
const isLoopbackUrl = (url) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(url);

/**
 * Resolve API endpoints cleanly across Vitest, localhost, LAN IPs, and production builds.
 * Loopback env URLs are ignored on non-loopback LAN clients so phones never call their own localhost.
 */
export function resolveApiConfig({
  envUrl = envApiUrl,
  mode = import.meta.env.MODE,
  isDev = import.meta.env.DEV,
  location = typeof window !== 'undefined' ? window.location : null,
} = {}) {
  const trimmedEnv = String(envUrl || '').trim().replace(/\/+$/, '');

  if (!location || mode === 'test') {
    const apiUrl = trimmedEnv || 'http://localhost:8000/api';
    return {
      apiUrl,
      apiBaseUrl: apiUrl.replace(/\/api\/?$/, ''),
    };
  }

  if (trimmedEnv && !isLoopbackUrl(trimmedEnv)) {
    return {
      apiUrl: trimmedEnv,
      apiBaseUrl: trimmedEnv.replace(/\/api\/?$/, ''),
    };
  }

  const hostname = location.hostname || 'localhost';
  const port = String(location.port || '');
  const isBrowserLoopback = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';

  if (isBrowserLoopback && trimmedEnv) {
    return {
      apiUrl: trimmedEnv,
      apiBaseUrl: trimmedEnv.replace(/\/api\/?$/, ''),
    };
  }

  if (isDev || port === '3000' || port === '5173') {
    return {
      apiUrl: '/api',
      apiBaseUrl: '',
    };
  }

  if (!isBrowserLoopback) {
    const base = `${location.protocol || 'http:'}//${hostname}:8000`;
    return {
      apiUrl: `${base}/api`,
      apiBaseUrl: base,
    };
  }

  return {
    apiUrl: '/api',
    apiBaseUrl: '',
  };
}

const resolved = resolveApiConfig();

// Base API URL with /api endpoint
export const API_URL = resolved.apiUrl;

// Base URL without /api (for image uploads, etc.)
export const API_BASE_URL = resolved.apiBaseUrl;

// Helper function to create headers with authorization
export const createHeaders = (token, includeContentType = true) => {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  };

  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
};

const apiConfig = {
  API_URL,
  API_BASE_URL,
  createHeaders,
};

export default apiConfig;