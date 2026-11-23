import React, { useState } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { vi } from 'vitest';
import CategoriesTab from './Categories';

function StatefulCategoriesHarness({ initialCategories = [], products = [] }) {
  const [categories, setCategories] = useState(initialCategories);

  return (
    <CategoriesTab
      categories={categories}
      products={products}
      loading={false}
      token="test-token"
      onCategoryAdded={(cat) => setCategories((prev) => [...prev, cat])}
      onCategoryUpdated={(cat) => setCategories((prev) => prev.map((c) => (c.id === cat.id ? cat : c)))}
      onCategoryDeleted={(id) => setCategories((prev) => prev.filter((c) => c.id !== id))}
    />
  );
}

describe('CategoriesTab clickable category cards and product list modal', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('creating a category lets user click its card to view total count and empty state', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          id: 99,
          name: 'Beverages',
          description: 'Cold drinks and juices',
          created_at: '2026-11-23T12:00:00Z',
          products_count: 0,
        },
      }),
    });

    render(<StatefulCategoriesHarness initialCategories={[]} products={[]} />);

    fireEvent.click(screen.getByRole('button', { name: '+ Add Category' }));

    fireEvent.change(
      screen.getByPlaceholderText(/Spring Mattresses/i),
      { target: { value: 'Beverages' } }
    );
    fireEvent.change(
      screen.getByPlaceholderText(/High-quality memory foam/i),
      { target: { value: 'Cold drinks and juices' } }
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add Category' }));

    const card = await screen.findByTestId('category-card-99');
    expect(within(card).getByText('Beverages')).toBeInTheDocument();
    expect(within(card).getByTestId('category-count-99').textContent).toBe('0 products');

    fireEvent.click(card);

    expect(screen.getByTestId('category-modal-total-products').textContent).toBe('0');
    expect(screen.getByText('No products in this category yet')).toBeInTheDocument();
  });

  test('clicking a category card displays total number of products and lists only products in that category', () => {
    const categories = [
      { id: 1, name: 'Smartphones', description: 'Mobile handsets', created_at: '2026-11-20T10:00:00Z' },
      { id: 2, name: 'Accessories', description: 'Cables and chargers', created_at: '2026-11-20T10:00:00Z' },
    ];
    const products = [
      { id: 101, category_id: 1, name: 'Samsung Galaxy A54', sku: 'SAM-A54', stock: 12, unit: 'pcs', reorder_level: 5, price: 980000, cost_price: 820000 },
      { id: 102, category_id: 1, name: 'Xiaomi Redmi Note 13', sku: 'XIA-RN13', stock: 3, unit: 'pcs', reorder_level: 5, price: 760000, cost_price: 620000 },
      { id: 103, category_id: 2, name: '65W GaN Fast Charger', sku: 'PWR-GAN65', stock: 20, unit: 'pcs', reorder_level: 8, price: 85000, cost_price: 55000 },
    ];

    render(<StatefulCategoriesHarness initialCategories={categories} products={products} />);

    expect(screen.getByTestId('category-count-1').textContent).toBe('2 products');
    expect(screen.getByTestId('category-count-2').textContent).toBe('1 product');

    fireEvent.click(screen.getByTestId('category-card-1'));

    expect(screen.getByTestId('category-modal-total-products').textContent).toBe('2');
    expect(screen.getByText('Samsung Galaxy A54')).toBeInTheDocument();
    expect(screen.getByText('Xiaomi Redmi Note 13')).toBeInTheDocument();
    expect(screen.queryByText('65W GaN Fast Charger')).not.toBeInTheDocument();

    // Filter inside modal
    fireEvent.change(
      screen.getByPlaceholderText(/Search products in this category/i),
      { target: { value: 'Xiaomi' } }
    );
    expect(screen.queryByText('Samsung Galaxy A54')).not.toBeInTheDocument();
    expect(screen.getByText('Xiaomi Redmi Note 13')).toBeInTheDocument();
  });

  test('clicking Edit or Delete on a category card does not open the category products modal', () => {
    const categories = [
      { id: 1, name: 'Smartphones', description: 'Mobile handsets', created_at: '2026-11-20T10:00:00Z' },
    ];
    render(<StatefulCategoriesHarness initialCategories={categories} products={[]} />);

    const card = screen.getByTestId('category-card-1');
    fireEvent.click(within(card).getByRole('button', { name: 'Edit' }));

    expect(screen.getByText('Edit Category')).toBeInTheDocument();
    expect(screen.queryByTestId('category-modal-total-products')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(within(card).getByRole('button', { name: 'Delete' }));

    expect(screen.getByRole('heading', { name: 'Delete Category' })).toBeInTheDocument();
    expect(screen.queryByTestId('category-modal-total-products')).not.toBeInTheDocument();
  });

  test('falls back to GET /api/categories/{id} when products prop is not provided', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          id: 5,
          name: 'Printers & Ink',
          description: 'Office print supplies',
          products_count: 1,
          products: [
            { id: 201, category_id: 5, name: 'HP LaserJet Toner 85A', sku: 'HP-85A', stock: 8, unit: 'box', reorder_level: 4, price: 195000 },
          ],
        },
      }),
    });

    render(
      <CategoriesTab
        categories={[{ id: 5, name: 'Printers & Ink', description: 'Office print supplies', products_count: 1, created_at: '2026-11-20T10:00:00Z' }]}
        loading={false}
        token="test-token"
      />
    );

    expect(screen.getByTestId('category-count-5').textContent).toBe('1 product');
    fireEvent.click(screen.getByTestId('category-card-5'));

    await waitFor(() => {
      expect(screen.getByTestId('category-modal-total-products').textContent).toBe('1');
      expect(screen.getByText('HP LaserJet Toner 85A')).toBeInTheDocument();
    });
  });
});
