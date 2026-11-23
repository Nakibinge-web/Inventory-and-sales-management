import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import App from '../App';
import Dashboard from '../pages/Dashboard';
import DeveloperDashboard from './DeveloperDashboard';
import DeveloperSubscriptions from './DeveloperSubscriptions';
import DeveloperTenants from './DeveloperTenants';
import { can, isDeveloper, PERMISSIONS } from './developerPermissions';

const ACTIVE_TENANT = {
  id: 1,
  name: 'NK phones',
  email: 'nakibingecollins1@gmail.com',
  subscription_plan: 'business',
  subscription_status: 'active',
  subscription_expires_at: '2099-01-01T00:00:00.000Z',
  is_subscription_expired: false,
};

function makeDevUser(roles) {
  return {
    id: 1,
    name: 'Nakibinge Collins',
    email: 'nakibingecollins1@gmail.com',
    tenant_id: 1,
    roles,
    tenant: ACTIVE_TENANT,
  };
}

function mockFetch(ok = true) {
  global.fetch = vi.fn((url) => {
    if (String(url).includes('/developer/dashboard/stats')) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              tenants: { total: 1, active: 1, suspended: 0, cancelled: 0 },
              subscriptions: { total: 1, active: 1, trialing: 0, expired: 0 },
              telemetry_24h: { total_requests: 0, errors: 0, slow_requests: 0, avg_latency_ms: 0 },
              recent_errors: [],
              recent_activity: [],
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );
    }
    if (String(url).includes('/users/me')) {
      return Promise.resolve(new Response(JSON.stringify({ success: false }), { status: 401 }));
    }
    return Promise.resolve(
      new Response(JSON.stringify({ success: ok, data: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });
}

describe('Developer Portal strict role+permission & no-URL access', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState(null, '', '/overview');
    mockFetch();
  });

  test('enforces BOTH developer role and developer.portal.access permission', () => {
    const devWithPerms = makeDevUser([
      {
        name: 'developer',
        permissions: [{ name: PERMISSIONS.PORTAL_ACCESS }, { name: PERMISSIONS.TENANTS_VIEW }],
      },
    ]);
    expect(isDeveloper(devWithPerms)).toBe(true);
    expect(can(devWithPerms, PERMISSIONS.TENANTS_VIEW)).toBe(true);
    expect(can(devWithPerms, PERMISSIONS.ACTIVITY_VIEW)).toBe(false);

    // Role without permissions must be denied
    const devRoleOnly = makeDevUser([{ name: 'developer', permissions: [] }]);
    expect(isDeveloper(devRoleOnly)).toBe(false);
    expect(can(devRoleOnly, PERMISSIONS.TENANTS_VIEW)).toBe(false);

    // Non-developer role with permission must also be denied
    const nonDevWithPerm = makeDevUser([
      { name: 'owner', permissions: [{ name: PERMISSIONS.PORTAL_ACCESS }] },
    ]);
    expect(isDeveloper(nonDevWithPerm)).toBe(false);
  });

  test('shows top bar button only for user with developer role + permission and opens portal on click without URL route', async () => {
    const ownerOnly = makeDevUser([{ name: 'owner', permissions: [] }]);
    const { rerender } = render(
      <Dashboard user={ownerOnly} token="tok" onLogout={vi.fn()} onUserUpdate={vi.fn()} />
    );
    await screen.findByRole('button', { name: /Logout/i });
    expect(screen.queryByRole('button', { name: /Developer Portal/i })).not.toBeInTheDocument();

    const collinsUser = makeDevUser([
      { name: 'owner', permissions: [] },
      { name: 'developer', permissions: [{ name: PERMISSIONS.PORTAL_ACCESS }] },
    ]);
    rerender(
      <Dashboard user={collinsUser} token="tok" onLogout={vi.fn()} onUserUpdate={vi.fn()} />
    );

    const topBarBtn = await screen.findByRole('button', { name: /Developer Portal/i });
    expect(topBarBtn).toBeInTheDocument();
    expect(window.location.pathname).toBe('/overview');

    fireEvent.click(topBarBtn);

    expect(await screen.findByText(/Platform Ops Console/i)).toBeInTheDocument();
    expect(window.location.pathname).toBe('/overview');

    const switchBackBtn = screen.getByRole('button', { name: /Switch to Tenant App/i });
    fireEvent.click(switchBackBtn);
    expect(await screen.findByRole('button', { name: /Developer Portal/i })).toBeInTheDocument();
  }, 15000);

  test('navigating directly to /developer URL does NOT open the Developer Portal', () => {
    const collinsUser = makeDevUser([
      { name: 'owner', permissions: [] },
      { name: 'developer', permissions: [{ name: PERMISSIONS.PORTAL_ACCESS }] },
    ]);
    localStorage.setItem('user', JSON.stringify(collinsUser));
    localStorage.setItem('token', 'tok');
    window.history.replaceState(null, '', '/developer');

    render(<App />);

    expect(window.location.pathname).toBe('/overview');
    expect(screen.queryByText(/Platform Ops Console/i)).not.toBeInTheDocument();
  });

  test('displays active subscriptions count in overview, subscribed tenants in subscriptions, and plans + remaining days in tenants module', async () => {
    const devUser = makeDevUser([
      {
        name: 'developer',
        permissions: [
          { name: PERMISSIONS.PORTAL_ACCESS },
          { name: PERMISSIONS.SUBSCRIPTIONS_VIEW },
          { name: PERMISSIONS.TENANTS_VIEW },
        ],
      },
    ]);

    global.fetch = vi.fn((url) => {
      const s = String(url);
      if (s.includes('/developer/dashboard/stats')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              success: true,
              data: {
                tenants: { total: 2, active: 2, suspended: 0, cancelled: 0 },
                subscriptions: { total: 1, active: 5, trialing: 0, expired: 0 },
                telemetry_24h: { total_requests: 0, errors: 0, slow_requests: 0, avg_latency_ms: 0 },
                recent_errors: [],
                recent_activity: [],
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        );
      }
      if (s.includes('/developer/subscriptions')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              success: true,
              data: [
                {
                  id: 1,
                  tenant_id: 5,
                  plan_name: 'Business',
                  status: 'active',
                  effective_status: 'active',
                  max_users: 10,
                  max_products: 10000,
                  price: '2000.00',
                  currency: 'UGX',
                  billing_cycle: 'monthly',
                  expires_at: '2099-01-01T00:00:00.000Z',
                  remaining_days: 23,
                  tenant: { id: 5, name: 'ZZIWA AND SONS BEDDINGS', email: 'zziwa@gmail.com' },
                },
              ],
              pagination: { current_page: 1, per_page: 25, total: 1, last_page: 1 },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        );
      }
      if (s.includes('/developer/tenants')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              success: true,
              data: [
                {
                  id: 1,
                  name: 'NK phones',
                  email: 'nakibingecollins1@gmail.com',
                  status: 'active',
                  plan_name: 'Starter',
                  subscription_status: 'active',
                  subscription_expires_at: '2099-01-01T00:00:00.000Z',
                  remaining_days: 13,
                  users_count: 1,
                  products_count: 12,
                },
                {
                  id: 2,
                  name: 'MIREMBE BEDDINGS',
                  email: 'mirembe@gmail.com',
                  status: 'active',
                  plan_name: null,
                  subscription_status: 'inactive',
                  subscription_expires_at: null,
                  remaining_days: null,
                  users_count: 1,
                  products_count: 0,
                },
              ],
              pagination: { current_page: 1, per_page: 25, total: 2, last_page: 1 },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        );
      }
      return Promise.resolve(new Response(JSON.stringify({ success: true, data: [] }), { status: 200 }));
    });

    const { unmount } = render(
      <DeveloperDashboard user={devUser} token="tok" onNavigate={vi.fn()} onNotify={vi.fn()} />
    );
    expect(
      await screen.findByText((_, el) => el?.tagName === 'SPAN' && el.textContent.trim() === '5 subscribed')
    ).toBeInTheDocument();
    unmount();

    const subView = render(
      <DeveloperSubscriptions user={devUser} token="tok" onNotify={vi.fn()} />
    );
    expect(await screen.findByText('ZZIWA AND SONS BEDDINGS')).toBeInTheDocument();
    expect(screen.getByText('23 days left')).toBeInTheDocument();
    subView.unmount();

    render(<DeveloperTenants user={devUser} token="tok" onNotify={vi.fn()} />);
    expect(await screen.findByText('NK phones')).toBeInTheDocument();
    expect(screen.getByText('13 days left')).toBeInTheDocument();
    expect(screen.getByText('No Plan')).toBeInTheDocument();
    expect(screen.getByText('No active plan')).toBeInTheDocument();
  });
});
