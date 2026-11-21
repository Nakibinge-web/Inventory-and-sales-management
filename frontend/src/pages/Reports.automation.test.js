import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import ReportsTab from './Reports';
import Dashboard from './Dashboard';

// Stub Dashboard's sibling tabs so global scheduler tests isolate Dashboard + polling behavior
vi.mock('./Overview', () => ({ default: () => <div data-testid="overview-stub">Overview</div> }));
vi.mock('./Products', () => ({ default: () => <div /> }));
vi.mock('./Categories', () => ({ default: () => <div /> }));
vi.mock('./Suppliers', () => ({ default: () => <div /> }));
vi.mock('./Customers', () => ({ default: () => <div /> }));
vi.mock('./POS', () => ({ default: () => <div /> }));
vi.mock('./Sales', () => ({ default: () => <div /> }));
vi.mock('./Purchases', () => ({ default: () => <div /> }));
vi.mock('./Ai', () => ({ default: () => <div /> }));
vi.mock('./Users', () => ({ default: () => <div /> }));
vi.mock('./StockMovements', () => ({ default: () => <div /> }));
vi.mock('./Invoices', () => ({ default: () => <div /> }));
vi.mock('./Quotations', () => ({ default: () => <div /> }));
vi.mock('./Settings', () => ({ default: () => <div /> }));

const baseProps = {
  loading: false,
  token: 'test-token',
  data: {
    stats: {
      totalSales: 100000,
      totalPurchases: 40000,
      lowStockCount: 1,
      totalProducts: 5,
    },
    sales: [],
    purchases: [],
    products: [],
    categories: [],
    suppliers: [],
    customers: [],
  },
};

function mockJsonResponse(body, ok = true) {
  return Promise.resolve({
    ok,
    status: ok ? 200 : 422,
    json: async () => body,
  });
}

describe('Report Automation UI & Global Background Scheduler', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('allows entering custom loop period and saving loop schedule', async () => {
    let savedPayload = null;
    const futureNextRun = new Date(Date.now() + 3 * 60000).toISOString();

    global.fetch.mockImplementation((url, options = {}) => {
      if (String(url).includes('/report-preferences') && (!options.method || options.method === 'GET')) {
        return mockJsonResponse({ success: true, data: [] });
      }
      if (String(url).includes('/report-preferences') && options.method === 'POST') {
        savedPayload = JSON.parse(options.body);
        return mockJsonResponse({
          success: true,
          data: {
            id: 11,
            report_type: savedPayload.report_type,
            frequency: savedPayload.frequency,
            interval_minutes: savedPayload.interval_minutes,
            is_enabled: true,
            next_run_at: futureNextRun,
            delivery_method: 'dashboard',
          },
        });
      }
      if (String(url).includes('/generated-reports')) {
        return mockJsonResponse({ success: true, data: [] });
      }
      return mockJsonResponse({ success: true, data: [] });
    });

    const prefsUpdatedSpy = vi.fn();
    window.addEventListener('report_preferences_updated', prefsUpdatedSpy);

    render(<ReportsTab {...baseProps} />);

    // Open automation details via Saved Reports -> Automate Reports
    fireEvent.click(screen.getByRole('button', { name: /Saved Reports/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Automate Reports/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Automate Reports/i }));

    const loopInput = await screen.findByLabelText('Custom loop period');
    fireEvent.change(loopInput, { target: { value: '3' } });

    const saveBtn = screen.getByRole('button', { name: /Save Automation Settings/i });
    fireEvent.click(saveBtn);

    await waitFor(() => expect(savedPayload).not.toBeNull());
    expect(savedPayload.frequency).toBe('custom_minutes');
    expect(savedPayload.interval_minutes).toBe(3);
    expect(typeof savedPayload.timezone_offset).toBe('number');
    expect(prefsUpdatedSpy).toHaveBeenCalled();

    expect(await screen.findByText(/Continuous Loop Automation Active/i)).toBeInTheDocument();

    window.removeEventListener('report_preferences_updated', prefsUpdatedSpy);
  });

  test('schedules specific near-future date/time and shows generated report in Saved Reports when triggered', async () => {
    let savedPayload = null;
    let savedReportsList = [];
    const targetIso = new Date(Date.now() + 5 * 60000).toISOString();

    const newlyGeneratedReport = {
      id: 77,
      report_type: 'daily_sales',
      title: 'Daily Sales Report - Automated Once',
      period_start: '2026-11-20',
      period_end: '2026-11-20',
      total_sales: 85000,
      total_cost: 50000,
      total_profit: 35000,
      total_transactions: 4,
      generated_at: new Date().toISOString(),
      source: 'automated',
    };

    global.fetch.mockImplementation((url, options = {}) => {
      const urlStr = String(url);
      if (urlStr.endsWith('/report-preferences') && (!options.method || options.method === 'GET')) {
        return mockJsonResponse({ success: true, data: [] });
      }
      if (urlStr.endsWith('/report-preferences') && options.method === 'POST') {
        savedPayload = JSON.parse(options.body);
        return mockJsonResponse({
          success: true,
          data: {
            id: 22,
            report_type: savedPayload.report_type,
            frequency: savedPayload.frequency,
            interval_minutes: null,
            is_enabled: true,
            next_run_at: savedPayload.scheduled_at || targetIso,
            delivery_method: 'dashboard',
          },
        });
      }
      if (urlStr.includes('/generated-reports')) {
        return mockJsonResponse({ success: true, data: savedReportsList });
      }
      return mockJsonResponse({ success: true, data: [] });
    });

    render(<ReportsTab {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /Saved Reports/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Automate Reports/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Automate Reports/i }));

    // Select Specific Time (scheduled_once) card, then use +5 mins shortcut
    fireEvent.click(await screen.findByText('📅 Specific Time'));
    const plusFiveBtn = await screen.findByRole('button', { name: '+5 mins' });
    fireEvent.click(plusFiveBtn);

    expect(screen.getByLabelText('Scheduled future date').value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(screen.getByLabelText('Scheduled future time').value).toMatch(/^\d{2}:\d{2}$/);

    fireEvent.click(screen.getByRole('button', { name: /Save Automation Settings/i }));

    await waitFor(() => expect(savedPayload).not.toBeNull());
    expect(savedPayload.frequency).toBe('scheduled_once');
    expect(savedPayload.scheduled_at).toMatch(/Z$/);
    expect(new Date(savedPayload.scheduled_at).getTime()).toBeGreaterThan(Date.now());
    expect(await screen.findByText(/Scheduled Near-Future Report Active/i)).toBeInTheDocument();

    // Simulate Dashboard background scheduler completing the due scheduled_once report
    savedReportsList = [newlyGeneratedReport];
    window.dispatchEvent(
      new CustomEvent('automated_reports_generated', {
        detail: [
          {
            report_type: 'daily_sales',
            saved_report: newlyGeneratedReport,
            next_run_at: null,
            is_enabled: false,
          },
        ],
      })
    );

    // Report should automatically appear in Saved Reports card AND Saved Reports archive tab
    expect(await screen.findByText('Daily Sales Report - Automated Once')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Saved Reports/i }));
    expect(await screen.findByText('Daily Sales Report - Automated Once')).toBeInTheDocument();
  });

  test('executes due schedule automatically via execute-due when countdown reaches 0 and disables one-time schedule', async () => {
    const pastIso = new Date(Date.now() - 2000).toISOString();
    let savedReportsList = [];
    const autoReport = {
      id: 88,
      report_type: 'daily_sales',
      title: 'Daily Sales - Countdown Triggered',
      period_start: '2026-11-20',
      period_end: '2026-11-20',
      total_sales: 12000,
      total_cost: 7000,
      total_profit: 5000,
      total_transactions: 1,
      generated_at: new Date().toISOString(),
      source: 'automated',
    };

    let executeDueCalled = false;

    global.fetch.mockImplementation((url, options = {}) => {
      const urlStr = String(url);
      if (urlStr.includes('/execute-due') && options.method === 'POST') {
        executeDueCalled = true;
        savedReportsList = [autoReport];
        return mockJsonResponse({
          success: true,
          data: autoReport,
          preference: {
            id: 33,
            report_type: 'daily_sales',
            frequency: 'scheduled_once',
            is_enabled: false,
            next_run_at: null,
          },
        });
      }
      if (urlStr.includes('/report-preferences')) {
        return mockJsonResponse({
          success: true,
          data: [
            {
              id: 33,
              report_type: 'daily_sales',
              frequency: 'scheduled_once',
              is_enabled: true,
              next_run_at: pastIso,
              delivery_method: 'dashboard',
            },
          ],
        });
      }
      if (urlStr.includes('/generated-reports')) {
        return mockJsonResponse({ success: true, data: savedReportsList });
      }
      return mockJsonResponse({ success: true, data: [] });
    });

    render(<ReportsTab {...baseProps} />);

    await waitFor(() => expect(executeDueCalled).toBe(true));

    fireEvent.click(screen.getByRole('button', { name: /Saved Reports/i }));
    expect(await screen.findByText('Daily Sales - Countdown Triggered')).toBeInTheDocument();
  });

  test('Dashboard global background scheduler calls check-due and dispatches automated_reports_generated outside Reports tab', async () => {
    const generatedItem = {
      report_type: 'daily_sales',
      saved_report: {
        id: 99,
        report_type: 'daily_sales',
        title: 'Daily Sales - Background Global Run',
      },
      next_run_at: null,
      is_enabled: false,
    };

    let checkDueCalls = 0;
    global.fetch.mockImplementation((url, options = {}) => {
      const urlStr = String(url);
      if (urlStr.includes('/report-preferences/check-due') && options.method === 'POST') {
        checkDueCalls += 1;
        return mockJsonResponse({
          success: true,
          generated: checkDueCalls === 1 ? [generatedItem] : [],
        });
      }
      if (urlStr.includes('/report-preferences')) {
        return mockJsonResponse({ success: true, data: [] });
      }
      if (urlStr.includes('/tenant/info') || urlStr.includes('/settings/business')) {
        return mockJsonResponse({
          success: true,
          data: { enabled_modules: ['overview', 'reports'] },
        });
      }
      return mockJsonResponse({ success: true, data: [] });
    });

    const eventListener = vi.fn();
    window.addEventListener('automated_reports_generated', eventListener);

    window.history.replaceState(null, '', '/overview');
    render(
      <Dashboard
        user={{ id: 1, name: 'Owner', roles: [{ name: 'owner', permissions: [] }] }}
        token="test-token"
        onLogout={vi.fn()}
        onUserUpdate={vi.fn()}
      />
    );

    await waitFor(() => expect(checkDueCalls).toBeGreaterThanOrEqual(1));
    await waitFor(() => expect(eventListener).toHaveBeenCalled());
    expect(eventListener.mock.calls[0][0].detail).toEqual([generatedItem]);
    expect(await screen.findByText(/Automated Report Saved/i)).toBeInTheDocument();

    window.removeEventListener('automated_reports_generated', eventListener);
  });
});
