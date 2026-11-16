import { render, screen } from '@testing-library/react';
import App from './App';

test('renders StockPro brand on landing page', () => {
  render(<App />);
  const brandElements = screen.getAllByText(/StockPro/i);
  expect(brandElements.length).toBeGreaterThan(0);
});

