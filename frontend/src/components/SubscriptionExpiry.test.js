import React, { useState } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import AuthPage from '../pages/AuthPage';
import Dashboard from '../pages/Dashboard';
import NexumPayCheckoutModal from './marketing/NexumPayCheckoutModal';
import {
  computeExtendedSubscriptionExpiry,
  getRemainingSubscriptionDays,
  installSubscriptionInterceptor,
} from '../utils/subscription';

const EXPIRED_TENANT = {
  id: 7,
  name: 'Acme Mart',
  email: 'owner@acmemart.test',
  phone: '+256770000111',
  subscription_plan: 'starter',
  subscription_status: 'expired',
  subscription_expires_at: '2025-01-01T00:00:00.000Z',
  is_subscription_expired: true,
};

const ACTIVE_TENANT = {
  id: 7,
  name: 'Acme Mart',
  email: 'owner@acmemart.test',
  phone: '+256770000111',
  subscription_plan: 'business',
  subscription_status: 'active',
  subscription_expires_at: '2099-01-01T00:00:00.000Z',
  is_subscription_expired: false,
};

function makeOwner(tenant = EXPIRED_TENANT) {
  return {
    id: 10,
    name: 'Alice Owner',
    email: 'owner@acmemart.test',
    tenant_id: tenant.id,
    roles: [{ name: 'owner', permissions: [] }],
    tenant,
  };
}

function makeStaff(tenant = EXPIRED_TENANT) {
  return {
    id: 25,
    name: 'Sam Cashier',
    email: 'cashier@acmemart.test',
    tenant_id: tenant.id,
    roles: [{ name: 'cashier', permissions: [] }],
    tenant,
  };
}

function jsonResponse(body, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

function StatefulDashboardHarness({ initialUser }) {
  const [user, setUser] = useState(initialUser);
  return (
    <Dashboard
      user={user}
      token="test-bearer-token"
      onLogout={vi.fn()}
      onUserUpdate={setUser}
    />
  );
}

describe('Subscription expiration enforcement', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    delete window.__spSubscriptionFetchPatched;
    window.history.pushState(null, '', '/login');
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('AuthPage displays subscribe error and checkout option when login returns 403 SUBSCRIPTION_EXPIRED', async () => {
    const expiredPayload = {
      success: false,
      code: 'SUBSCRIPTION_EXPIRED',
      subscription_expired: true,
      is_owner: false,
      message:
        'Your business subscription period has ended. Please subscribe to a plan or ask your business owner to subscribe to continue using the application.',
      renewal_token: 'encrypted-renewal-token',
      tenant: EXPIRED_TENANT,
    };

    const fetchMock = vi.fn(() => jsonResponse(expiredPayload, 403));
    vi.stubGlobal('fetch', fetchMock);

    const { container } = render(<AuthPage />);

    const form = container.querySelector('form');
    const textInput = form.querySelector('input:not([type="password"]):not([type="checkbox"])');
    const passwordInput = form.querySelector('input[type="password"]');

    fireEvent.change(textInput, { target: { value: 'cashier@acmemart.test' } });
    fireEvent.change(passwordInput, { target: { value: 'secret123' } });
    fireEvent.submit(form);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('subscription period has ended');
    expect(alert.textContent).toContain('subscribe');

    const actionsBox = screen.getByTestId('auth-subscription-expired-actions');
    expect(actionsBox.textContent).toContain('Acme Mart');

    const subscribeButton = screen.getByRole('button', { name: /Subscribe Now/i });
    fireEvent.click(subscribeButton);

    expect(screen.queryByTestId('subscription-expired-screen')).toBeNull();
    expect(screen.getAllByText(/Choose Your Plan|Starter|Business/i).length).toBeGreaterThan(0);
  });

  test('Dashboard locks expired tenant owner out of operational workspace', async () => {
    const fetchMock = vi.fn((url) => {
      if (String(url).includes('/users/me')) {
        return jsonResponse(
          {
            success: false,
            code: 'SUBSCRIPTION_EXPIRED',
            subscription_expired: true,
            is_owner: true,
            message:
              'Your subscription period has ended. Please subscribe to a plan to continue using StockPro.',
            tenant: EXPIRED_TENANT,
          },
          403
        );
      }
      return jsonResponse({ success: true, data: [] }, 200);
    });
    vi.stubGlobal('fetch', fetchMock);

    const owner = makeOwner({
      ...ACTIVE_TENANT,
      subscription_expires_at: '2025-01-01T00:00:00.000Z',
      is_subscription_expired: false,
    });

    render(<StatefulDashboardHarness initialUser={owner} />);

    const lockScreen = await screen.findByTestId('subscription-expired-screen');
    expect(lockScreen.textContent).toContain('subscription period has ended');
    expect(lockScreen.textContent).toContain('subscribe');
    expect(screen.getByRole('button', { name: /Subscribe Now/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /View Plans/i })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /Sign Out/i }).length).toBeGreaterThan(0);

    expect(screen.queryByText(/Point of Sale/i)).toBeNull();
    // Should not fire the 8 dashboard data fetches while already expired
    const productCalls = fetchMock.mock.calls.filter(([u]) => String(u).includes('/products'));
    expect(productCalls).toHaveLength(0);
  });

  test('Dashboard locks created staff user when business subscription status is expired', async () => {
    const staffTenant = {
      id: 7,
      name: 'Acme Mart',
      subscription_plan: 'starter',
      subscription_status: 'expired',
      subscription_expires_at: null,
    };
    const staff = makeStaff(staffTenant);

    const fetchMock = vi.fn((url) => {
      if (String(url).includes('/users/me')) {
        return jsonResponse(
          {
            success: false,
            code: 'SUBSCRIPTION_EXPIRED',
            subscription_expired: true,
            is_owner: false,
            message:
              'Your business subscription period has ended. Please subscribe to a plan or ask your business owner to subscribe to continue using the application.',
            tenant: staffTenant,
          },
          403
        );
      }
      return jsonResponse({ success: true, data: [] }, 200);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<StatefulDashboardHarness initialUser={staff} />);

    const lockScreen = await screen.findByTestId('subscription-expired-screen');
    expect(lockScreen.textContent).toContain('subscription period has ended');
    expect(lockScreen.textContent).toContain('Acme Mart');
    expect(lockScreen.textContent).toContain('All accounts created under');
    expect(screen.queryByText(/Point of Sale/i)).toBeNull();
  });

  test('Dashboard locks an initially active session when API responds 403 SUBSCRIPTION_EXPIRED and unlocks on renewal', async () => {
    let blockedOnServer = true;

    const fetchMock = vi.fn((url) => {
      const target = String(url);
      if (blockedOnServer) {
        return jsonResponse(
          {
            success: false,
            code: 'SUBSCRIPTION_EXPIRED',
            subscription_expired: true,
            is_owner: true,
            message:
              'Your subscription period has ended. Please subscribe to continue using StockPro.',
            tenant: EXPIRED_TENANT,
          },
          403
        );
      }
      if (target.includes('/users/me')) {
        return jsonResponse({ success: true, data: makeOwner(ACTIVE_TENANT) }, 200);
      }
      return jsonResponse({ success: true, data: [] }, 200);
    });

    vi.stubGlobal('fetch', fetchMock);
    installSubscriptionInterceptor();

    window.history.pushState(null, '', '/overview');
    render(<StatefulDashboardHarness initialUser={makeOwner(ACTIVE_TENANT)} />);

    const lockScreen = await screen.findByTestId('subscription-expired-screen');
    expect(lockScreen.textContent).toContain('Your subscription period has ended');

    blockedOnServer = false;
    act(() => {
      window.dispatchEvent(
        new CustomEvent('subscription_updated', {
          detail: makeOwner(ACTIVE_TENANT),
        })
      );
    });

    await waitFor(() => {
      expect(screen.queryByTestId('subscription-expired-screen')).toBeNull();
    });
  });

  test('subscribing again on same active package adds 30 days to remaining 20 days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-15T12:00:00.000Z'));

    try {
      const twentyDaysOut = new Date('2026-12-05T12:00:00.000Z').toISOString();
      const activeStarterTenant = {
        id: 7,
        name: 'Acme Mart',
        email: 'owner@acmemart.test',
        subscription_plan: 'starter',
        subscription_status: 'active',
        subscription_expires_at: twentyDaysOut,
      };

      expect(getRemainingSubscriptionDays(activeStarterTenant)).toBe(20);

      const extendedIso = computeExtendedSubscriptionExpiry(
        activeStarterTenant,
        'starter',
        'monthly'
      );
      expect(extendedIso).toBe('2027-01-04T12:00:00.000Z');
      expect(
        getRemainingSubscriptionDays({
          ...activeStarterTenant,
          subscription_expires_at: extendedIso,
        })
      ).toBe(50);

      // Switching package does not stack old starter days
      const switchedIso = computeExtendedSubscriptionExpiry(
        activeStarterTenant,
        'business',
        'monthly'
      );
      expect(
        getRemainingSubscriptionDays({
          ...activeStarterTenant,
          subscription_plan: 'business',
          subscription_expires_at: switchedIso,
        })
      ).toBe(30);

      vi.stubGlobal('fetch', vi.fn(() => jsonResponse({ configuration: { mode: 'simulation' } }, 200)));

      render(
        <NexumPayCheckoutModal
          isOpen={true}
          isModal={true}
          initialPlanId="starter"
          initialBillingCycle="monthly"
          currentTenant={activeStarterTenant}
          onClose={vi.fn()}
        />
      );

      const extensionRow = screen.getByTestId('nxp-extension-summary');
      expect(extensionRow.textContent).toContain('+30 days');
      expect(extensionRow.textContent).toContain('20 + 30 = 50 days');
    } finally {
      vi.useRealTimers();
    }
  });
});
