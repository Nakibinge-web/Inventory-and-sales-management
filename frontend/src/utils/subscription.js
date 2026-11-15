import { API_URL as API } from '../config/api';

const EXPIRED_STATUSES = ['expired', 'cancelled', 'canceled', 'suspended', 'past_due'];
export const MONTHLY_DURATION_DAYS = 30;
export const ANNUAL_DURATION_DAYS = 365;

export function getDurationDays(billingCycle = 'monthly') {
  return String(billingCycle || '').toLowerCase() === 'annual'
    ? ANNUAL_DURATION_DAYS
    : MONTHLY_DURATION_DAYS;
}

export function isSubscriptionExpiredResponse(status, data) {
  return (
    status === 403 &&
    Boolean(data && (data.code === 'SUBSCRIPTION_EXPIRED' || data.subscription_expired === true))
  );
}

export function isTenantSubscriptionExpired(tenant, blockedInfo = null) {
  if (
    blockedInfo &&
    (blockedInfo.subscription_expired === true || blockedInfo.code === 'SUBSCRIPTION_EXPIRED')
  ) {
    return true;
  }

  if (!tenant) return false;

  if (tenant.is_subscription_expired === true) {
    return true;
  }

  const status = String(tenant.subscription_status || '').toLowerCase();
  if (EXPIRED_STATUSES.includes(status)) {
    return true;
  }

  if (tenant.subscription_expires_at) {
    const expiry = new Date(tenant.subscription_expires_at);
    if (!Number.isNaN(expiry.getTime()) && expiry.getTime() <= Date.now()) {
      return true;
    }
  }

  return false;
}

export function getRemainingSubscriptionDays(tenant) {
  if (!tenant || isTenantSubscriptionExpired(tenant) || !tenant.subscription_expires_at) {
    return 0;
  }

  const expiry = new Date(tenant.subscription_expires_at);
  if (Number.isNaN(expiry.getTime())) return 0;

  const diffMs = expiry.getTime() - Date.now();
  if (diffMs <= 0) return 0;

  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function computeExtendedSubscriptionExpiry(
  tenant,
  planId,
  billingCycle = 'monthly',
  serverExpiresAt = null
) {
  if (serverExpiresAt) {
    const parsedServerDate = new Date(serverExpiresAt);
    if (!Number.isNaN(parsedServerDate.getTime())) {
      return typeof serverExpiresAt === 'string'
        ? serverExpiresAt
        : parsedServerDate.toISOString();
    }
  }

  const durationDays = getDurationDays(billingCycle);
  const durationMs = durationDays * 24 * 60 * 60 * 1000;
  const currentPlan = String(tenant?.subscription_plan || '').trim().toLowerCase();
  const targetPlan = String(planId || '').trim().toLowerCase();

  if (
    tenant &&
    !isTenantSubscriptionExpired(tenant) &&
    currentPlan !== '' &&
    currentPlan === targetPlan &&
    tenant.subscription_expires_at
  ) {
    const existingExpiry = new Date(tenant.subscription_expires_at);
    if (!Number.isNaN(existingExpiry.getTime()) && existingExpiry.getTime() > Date.now()) {
      return new Date(existingExpiry.getTime() + durationMs).toISOString();
    }
  }

  return new Date(Date.now() + durationMs).toISOString();
}

export function getDefaultExpiredMessage(user) {
  const isOwner = Boolean(user?.roles?.some((r) => r.name === 'owner'));
  if (isOwner) {
    return 'Your subscription period has ended. Please subscribe to a plan to continue using StockPro.';
  }
  return 'Your business subscription period has ended. Please subscribe to a plan or ask your business owner to subscribe to continue using the application.';
}

export function dispatchSubscriptionExpired(detail) {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent('subscription_expired', { detail }));
  } catch {
    // Ignore window event dispatch errors in restricted environments
  }
}

export function installSubscriptionInterceptor() {
  if (typeof window === 'undefined' || typeof window.fetch !== 'function') return;
  if (window.__spSubscriptionFetchPatched) return;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (...args) => {
    const response = await originalFetch(...args);

    try {
      const input = args[0];
      const url = typeof input === 'string' ? input : input?.url || '';
      const isApiCall = !API || url.startsWith(API) || url.includes('/api/');

      if (isApiCall && response && response.status === 403 && typeof response.clone === 'function') {
        const payload = await response.clone().json().catch(() => null);
        if (isSubscriptionExpiredResponse(response.status, payload)) {
          dispatchSubscriptionExpired(payload);
        }
      }
    } catch {
      // Ignore non-JSON or cloned body read errors
    }

    return response;
  };

  window.__spSubscriptionFetchPatched = true;
}
