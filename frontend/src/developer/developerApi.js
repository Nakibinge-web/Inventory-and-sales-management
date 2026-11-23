import { API_URL, createHeaders } from '../config/api';

/**
 * Handle HTTP responses consistently with parsed JSON or message.
 */
async function handleResponse(res) {
  let data;
  const contentType = res.headers.get('content-type');
  
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = { success: false, message: 'Invalid JSON response from server.' };
    }
  } else {
    const text = await res.text();
    data = { success: res.ok, message: text };
  }

  if (!res.ok) {
    const error = new Error(data.message || `Request failed with status ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * Build a query string from parameters object, omitting empty/null values.
 */
function buildQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== null && val !== undefined && val !== '') {
      query.append(key, val);
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

export const developerApi = {
  // Dashboard Metrics
  async getDashboardStats(token) {
    const res = await fetch(`${API_URL}/developer/dashboard/stats`, {
      headers: createHeaders(token),
    });
    return handleResponse(res);
  },

  // Tenant Directory
  async getTenants(token, params = {}) {
    const qs = buildQuery(params);
    const res = await fetch(`${API_URL}/developer/tenants${qs}`, {
      headers: createHeaders(token),
    });
    return handleResponse(res);
  },

  async getTenant(token, id) {
    const res = await fetch(`${API_URL}/developer/tenants/${id}`, {
      headers: createHeaders(token),
    });
    return handleResponse(res);
  },

  async updateTenantStatus(token, id, status, reason = null) {
    const res = await fetch(`${API_URL}/developer/tenants/${id}/status`, {
      method: 'PATCH',
      headers: createHeaders(token),
      body: JSON.stringify({ status, reason }),
    });
    return handleResponse(res);
  },

  // Subscriptions
  async getSubscriptions(token, params = {}) {
    const qs = buildQuery(params);
    const res = await fetch(`${API_URL}/developer/subscriptions${qs}`, {
      headers: createHeaders(token),
    });
    return handleResponse(res);
  },

  async getSubscription(token, id) {
    const res = await fetch(`${API_URL}/developer/subscriptions/${id}`, {
      headers: createHeaders(token),
    });
    return handleResponse(res);
  },

  async getTenantSubscription(token, tenantId) {
    const res = await fetch(`${API_URL}/developer/tenants/${tenantId}/subscription`, {
      headers: createHeaders(token),
    });
    return handleResponse(res);
  },

  async extendTrial(token, tenantId, days, reason = null) {
    const res = await fetch(`${API_URL}/developer/tenants/${tenantId}/subscription/extend-trial`, {
      method: 'POST',
      headers: createHeaders(token),
      body: JSON.stringify({ days: parseInt(days, 10), reason }),
    });
    return handleResponse(res);
  },

  async changePlan(token, tenantId, payload) {
    const res = await fetch(`${API_URL}/developer/tenants/${tenantId}/subscription/change-plan`, {
      method: 'POST',
      headers: createHeaders(token),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  // API Request Telemetry
  async getRequests(token, params = {}) {
    const qs = buildQuery(params);
    const res = await fetch(`${API_URL}/developer/requests${qs}`, {
      headers: createHeaders(token),
    });
    return handleResponse(res);
  },

  async getRequest(token, id) {
    const res = await fetch(`${API_URL}/developer/requests/${id}`, {
      headers: createHeaders(token),
    });
    return handleResponse(res);
  },

  // Activity & Audit Logs
  async getActivity(token, params = {}) {
    const qs = buildQuery(params);
    const res = await fetch(`${API_URL}/developer/activity${qs}`, {
      headers: createHeaders(token),
    });
    return handleResponse(res);
  },

  async getActivityItem(token, id) {
    const res = await fetch(`${API_URL}/developer/activity/${id}`, {
      headers: createHeaders(token),
    });
    return handleResponse(res);
  },
};

export default developerApi;
