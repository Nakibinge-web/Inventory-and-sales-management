import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import StockMovementsTab from './StockMovements';

describe('StockMovementsTab table columns', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('renders Date, Product, Type, Quantity, and Source columns without Reference column', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: [
          {
            id: 1,
            product_id: 10,
            product: { id: 10, name: 'Galaxy A54' },
            type: 'IN',
            quantity: 5,
            reference_id: 9876,
            reference_type: 'purchase',
            date: '2026-11-16T00:00:00.000Z',
          },
        ],
      }),
    });

    const { container } = render(
      <StockMovementsTab token="test-token" products={[{ id: 10, name: 'Galaxy A54', stock: 15 }]} />
    );

    await waitFor(() => {
      expect(container.querySelector('table tbody')).not.toBeNull();
    });

    const headers = Array.from(container.querySelectorAll('table thead th')).map((th) => th.textContent);
    expect(headers).toEqual(['Date', 'Product', 'Type', 'Quantity', 'Source']);
    expect(headers).not.toContain('Reference');

    const cells = container.querySelectorAll('table tbody tr:first-child td');
    expect(cells).toHaveLength(5);
    expect(container.querySelector('table tbody').textContent).not.toContain('#9876');
  });
});
