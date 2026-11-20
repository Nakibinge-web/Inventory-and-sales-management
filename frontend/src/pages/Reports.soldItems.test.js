import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import ReportsTab from './Reports';

const baseProps = {
  loading: false,
  token: 'test-token',
  data: {
    stats: {
      totalSales: 55000,
      totalPurchases: 30000,
      lowStockCount: 0,
      totalProducts: 2,
    },
    sales: [],
    purchases: [],
    products: [],
    categories: [],
    suppliers: [],
    customers: [],
  },
};

describe('ReportsTab sold items dropdown in sales transactions table', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('renders items dropdown per sale in Daily Sales report and toggles sold item details on click', async () => {
    // 1st call: initial fetchAutomationPreferences on mount
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    });

    // 2nd call: Generate Daily Sales Report
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          date: '2026-11-19',
          total_sales: 55000,
          total_cost: 38000,
          total_profit: 17000,
          total_transactions: 2,
          sales: [
            {
              id: 101,
              created_at: '2026-11-19T09:15:00Z',
              payment_method: 'cash',
              total_amount: 35000,
              cost: 24000,
              profit: 11000,
              user: { id: 1, name: 'Alice Cashier' },
              sale_items: [
                {
                  id: 1,
                  product_id: 10,
                  quantity: 2,
                  price: 10000,
                  subtotal: 20000,
                  product: {
                    id: 10,
                    name: 'Kakira Sugar 2kg',
                    sku: 'SUG-2KG',
                    unit: 'packs',
                    cost_price: 7000,
                    category: { id: 1, name: 'Groceries' },
                  },
                },
                {
                  id: 2,
                  product_id: 11,
                  quantity: 3,
                  price: 5000,
                  subtotal: 15000,
                  product: {
                    id: 11,
                    name: 'Fresh Dairy Milk 1L',
                    sku: 'MLK-1L',
                    unit: 'pcs',
                    cost_price: 3500,
                    category: { id: 2, name: 'Dairy' },
                  },
                },
              ],
            },
            {
              id: 102,
              created_at: '2026-11-19T11:30:00Z',
              payment_method: 'mobile_money',
              total_amount: 20000,
              cost: 14000,
              profit: 6000,
              user: { id: 2, name: 'Bob Cashier' },
              sale_items: [
                {
                  id: 3,
                  product_id: 12,
                  quantity: 1,
                  price: 20000,
                  subtotal: 20000,
                  product: {
                    id: 12,
                    name: 'Sunflower Cooking Oil 3L',
                    sku: 'OIL-3L',
                    unit: 'btl',
                    cost_price: 14000,
                    category: { id: 1, name: 'Groceries' },
                  },
                },
              ],
            },
          ],
        },
      }),
    });

    render(<ReportsTab {...baseProps} />);

    // Navigate to Daily Sales tab
    fireEvent.click(screen.getByRole('button', { name: /daily sales/i }));

    // Click Generate Report
    fireEvent.click(screen.getByRole('button', { name: /generate report/i }));

    // Wait for transaction rows and dropdown buttons to appear
    const sale1Toggle = await screen.findByTestId('sale-items-toggle-101');
    const sale2Toggle = await screen.findByTestId('sale-items-toggle-102');

    // Verify Products Sold summary container appears below Net Profit with aggregated stats
    const productsSummary = screen.getByTestId('products-sold-summary-daily');
    expect(productsSummary).toBeInTheDocument();
    expect(within(productsSummary).getByText('Kakira Sugar 2kg')).toBeInTheDocument();
    expect(within(productsSummary).getByText(/2 units sold/i)).toBeInTheDocument();
    expect(within(productsSummary).getByText('Fresh Dairy Milk 1L')).toBeInTheDocument();
    expect(within(productsSummary).getByText(/3 units sold/i)).toBeInTheDocument();
    expect(within(productsSummary).getByText('Sunflower Cooking Oil 3L')).toBeInTheDocument();
    expect(within(productsSummary).getByText(/1 unit sold/i)).toBeInTheDocument();
    expect(within(productsSummary).getAllByText(/6 units sold/i).length).toBeGreaterThan(0);

    expect(sale1Toggle).toHaveTextContent(/2 items/i);
    expect(sale1Toggle).toHaveAttribute('aria-expanded', 'false');
    expect(sale2Toggle).toHaveTextContent(/1 item/i);
    expect(sale2Toggle).toHaveAttribute('aria-expanded', 'false');

    // Initially, sold items dropdown panels are closed
    expect(screen.queryByTestId('sale-items-dropdown-101')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sale-items-dropdown-102')).not.toBeInTheDocument();

    // Click the dropdown in the Items column for Sale #101
    fireEvent.click(sale1Toggle);

    expect(sale1Toggle).toHaveAttribute('aria-expanded', 'true');
    const dropdown101 = screen.getByTestId('sale-items-dropdown-101');
    expect(dropdown101).toBeInTheDocument();

    // Verify specific goods and details for Sale #101 are shown
    expect(within(dropdown101).getByText('Kakira Sugar 2kg')).toBeInTheDocument();
    expect(within(dropdown101).getByText(/SKU: SUG-2KG/i)).toBeInTheDocument();
    expect(within(dropdown101).getByText(/2 packs/i)).toBeInTheDocument();
    expect(within(dropdown101).getByText('UGX 10,000')).toBeInTheDocument();
    expect(within(dropdown101).getByText('UGX 20,000')).toBeInTheDocument();

    expect(within(dropdown101).getByText('Fresh Dairy Milk 1L')).toBeInTheDocument();
    expect(within(dropdown101).getByText(/SKU: MLK-1L/i)).toBeInTheDocument();
    expect(within(dropdown101).getByText(/3 pcs/i)).toBeInTheDocument();
    expect(within(dropdown101).getByText('UGX 5,000')).toBeInTheDocument();
    expect(within(dropdown101).getByText('UGX 15,000')).toBeInTheDocument();

    // Sale #102's items remain collapsed
    expect(screen.queryByTestId('sale-items-dropdown-102')).not.toBeInTheDocument();

    // Click Sale #102's items dropdown
    fireEvent.click(sale2Toggle);
    const dropdown102 = screen.getByTestId('sale-items-dropdown-102');
    expect(within(dropdown102).getByText('Sunflower Cooking Oil 3L')).toBeInTheDocument();
    expect(within(dropdown102).getByText(/SKU: OIL-3L/i)).toBeInTheDocument();

    // Clicking Sale #101's dropdown again collapses it
    fireEvent.click(sale1Toggle);
    await waitFor(() => {
      expect(screen.queryByTestId('sale-items-dropdown-101')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('sale-items-dropdown-102')).toBeInTheDocument();
  }, 15000);
});
