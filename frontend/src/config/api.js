/**
 * API Configuration
 * Centralized API URL configuration for the entire application
 */

// Base API URL with /api endpoint
const envApiUrl = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL;

export const API_URL = envApiUrl || 'http://localhost:8000/api';

// Base URL without /api (for image uploads, etc.)
export const API_BASE_URL = envApiUrl
  ? envApiUrl.replace('/api', '')
  : 'http://localhost:8000';

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