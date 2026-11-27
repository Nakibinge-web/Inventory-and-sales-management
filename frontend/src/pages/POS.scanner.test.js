import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import POSTab from './POS';
import ProductsTab from './Products';
import { matchProductsByCode } from '../utils/hardwareScanner';

const mockScanner = vi.hoisted(() => ({
  start: vi.fn().mockResolvedValue(undefined),
  stop: vi.fn().mockResolvedValue(undefined),
  clear: vi.fn(),
  scanFile: vi.fn(),
  getCameras: vi.fn().mockResolvedValue([]),
  lastOptions: null,
  lastOnSuccess: null,
}));

vi.mock('html5-qrcode', () => {
  const Html5QrcodeSupportedFormats = {
    QR_CODE: 0,
    CODABAR: 2,
    CODE_39: 3,
    CODE_93: 4,
    CODE_128: 5,
    DATA_MATRIX: 6,
    ITF: 8,
    EAN_13: 9,
    EAN_8: 10,
    UPC_A: 14,
    UPC_E: 15,
    UPC_EAN_EXTENSION: 16,
  };

  class Html5Qrcode {
    static getCameras() {
      return mockScanner.getCameras();
    }

    constructor(_elementId, options) {
      mockScanner.lastOptions = options;
      this.isScanning = false;
    }

    async start(_camera, _config, onSuccess) {
      this.isScanning = true;
      mockScanner.lastOnSuccess = onSuccess;
      return mockScanner.start(_camera, _config, onSuccess);
    }

    async stop() {
      this.isScanning = false;
      return mockScanner.stop();
    }

    clear() {
      return mockScanner.clear();
    }
  }

  return { Html5Qrcode, Html5QrcodeSupportedFormats };
});

const SAMPLE_PRODUCTS = [
  {
    id: 1,
    name: 'Barcoded Olive Oil 1L',
    sku: 'OIL-1L',
    barcode: '8901234567890',
    qr_code: null,
    code_type: 'barcode',
    price: 32000,
    stock: 15,
    category_id: 10,
  },
  {
    id: 2,
    name: 'QR Roasted Coffee 500g',
    sku: 'COF-500',
    barcode: null,
    qr_code: 'QR-COFFEE-500G',
    code_type: 'qr_code',
    price: 45000,
    stock: 20,
    category_id: 10,
  },
  {
    id: 3,
    name: 'USB Serial Tea Box',
    sku: 'TEA-BOX',
    barcode: null,
    qr_code: 'QR-SERIAL-TEA-77',
    code_type: 'qr_code',
    price: 18000,
    stock: 8,
    category_id: 10,
  },
];

describe('POS Barcode / QR Code switcher & Hardware Scanners', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete navigator.serial;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      const parsed = new URL(String(url), 'http://localhost');
      const code = parsed.searchParams.get('code') || '';
      const mode = parsed.searchParams.get('code_type') || 'barcode';
      const matches = matchProductsByCode(SAMPLE_PRODUCTS, code, mode);
      return {
        ok: true,
        json: async () => ({
          success: true,
          code,
          code_type: mode,
          count: matches.length,
          data: matches,
        }),
      };
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    delete navigator.serial;
  });

  test('renders no hardware status/serial pill containers and switches Barcode vs QR Code camera modes', async () => {
    render(
      <POSTab
        products={SAMPLE_PRODUCTS}
        categories={[{ id: 10, name: 'Groceries' }]}
        customers={[]}
        token="tok"
        user={{ id: 1, tenant: { name: 'Demo Shop' } }}
      />
    );

    expect(screen.queryByTestId('pos-hardware-status')).not.toBeInTheDocument();
    expect(screen.queryByTestId('pos-serial-connect-btn')).not.toBeInTheDocument();
    expect(screen.queryByText(/Hardware Scanner Ready/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Connect USB\/Serial/i)).not.toBeInTheDocument();

    const modeGroup = screen.getByRole('group', { name: /pos scanner mode/i });
    const barcodeBtn = modeGroup.querySelectorAll('button')[0];
    const qrBtn = modeGroup.querySelectorAll('button')[1];

    expect(barcodeBtn).toHaveAttribute('aria-pressed', 'true');
    expect(qrBtn).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('pos-code-scan-btn')).toHaveAttribute('aria-label', 'Scan barcode with camera');

    // Open camera scanner in Barcode mode
    fireEvent.click(screen.getByTestId('pos-code-scan-btn'));
    await waitFor(() => expect(mockScanner.start).toHaveBeenCalledTimes(1));
    expect(mockScanner.lastOptions.formatsToSupport).not.toContain(0); // excludes QR_CODE
    expect(mockScanner.lastOptions.formatsToSupport).toContain(9); // EAN_13

    await act(async () => {
      mockScanner.lastOnSuccess('8901234567890');
    });

    await waitFor(() => {
      expect(screen.getByText(/Added: Barcoded Olive Oil 1L/i)).toBeInTheDocument();
    });

    // Switch POS to QR Code mode
    fireEvent.click(qrBtn);
    expect(barcodeBtn).toHaveAttribute('aria-pressed', 'false');
    expect(qrBtn).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('pos-code-scan-btn')).toHaveAttribute('aria-label', 'Scan QR code with camera');

    fireEvent.click(screen.getByTestId('pos-code-scan-btn'));
    await waitFor(() => expect(mockScanner.start).toHaveBeenCalledTimes(2));
    expect(mockScanner.lastOptions.formatsToSupport).toEqual([0]); // QR_CODE only

    await act(async () => {
      mockScanner.lastOnSuccess('QR-COFFEE-500G');
    });

    await waitFor(() => {
      expect(screen.getByText(/Added: QR Roasted Coffee 500g/i)).toBeInTheDocument();
    });
  });

  test('accepts Enter, Tab-terminated, and Ctrl+J hardware HID scanner input without concatenating sequential scans', async () => {
    render(
      <POSTab
        products={SAMPLE_PRODUCTS}
        categories={[{ id: 10, name: 'Groceries' }]}
        customers={[]}
        token="tok"
        user={{ id: 1, tenant: { name: 'Demo Shop' } }}
      />
    );

    const input = screen.getByTestId('pos-scanner-input');

    // 1. Hardware barcode scan ending with Enter (with trailing control chars stripped)
    fireEvent.change(input, { target: { value: '8901234567890' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText(/Added: Barcoded Olive Oil 1L/i)).toBeInTheDocument();
    });
    // Input clears immediately so the next scan cannot concatenate onto the old code
    expect(input).toHaveValue('');

    // 2. Switch to QR Code mode and simulate rapid Tab-terminated hardware QR scanner burst
    fireEvent.click(screen.getByRole('button', { name: 'QR Code' }));
    const qrChars = 'QR-COFFEE-500G';
    let acc = '';
    for (const ch of qrChars) {
      acc += ch;
      fireEvent.change(input, { target: { value: acc } });
    }
    const notCanceled = fireEvent.keyDown(input, { key: 'Tab' });
    expect(notCanceled).toBe(false);

    await waitFor(() => {
      expect(screen.getByText(/Added: QR Roasted Coffee 500g/i)).toBeInTheDocument();
    });
    expect(input).toHaveValue('');

    // 3. Hardware scanner ending with Ctrl+J (Linefeed)
    fireEvent.change(input, { target: { value: 'QR-SERIAL-TEA-77' } });
    fireEvent.keyDown(input, { key: 'j', ctrlKey: true });

    await waitFor(() => {
      expect(screen.getByText(/Added: USB Serial Tea Box/i)).toBeInTheDocument();
    });
  });

  test('captures hardware HID scan starting from another non-input element without losing first char and auto-submits suffix-less rapid bursts', async () => {
    vi.useFakeTimers();

    render(
      <POSTab
        products={SAMPLE_PRODUCTS}
        categories={[{ id: 10, name: 'Groceries' }]}
        customers={[]}
        token="tok"
        user={{ id: 1, tenant: { name: 'Demo Shop' } }}
      />
    );

    const input = screen.getByTestId('pos-scanner-input');
    // User clicked a category button away from the scanner input
    const categoryBtn = screen.getByRole('button', { name: /Groceries/i });
    categoryBtn.focus();
    expect(document.activeElement).toBe(categoryBtn);

    // Hardware scanner blasts 'QR-COFFEE-500G' without Enter
    const code = 'QR-COFFEE-500G';
    act(() => {
      fireEvent.keyDown(window, { key: code[0] });
    });
    expect(document.activeElement).toBe(input);
    expect(input).toHaveValue('Q');

    for (let i = 1; i < code.length; i += 1) {
      act(() => {
        vi.advanceTimersByTime(15);
        fireEvent.change(input, { target: { value: code.slice(0, i + 1) } });
      });
    }

    // Wait past burst idle auto-submit delay (160ms) and flush async DB lookup fallback
    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    vi.useRealTimers();

    await waitFor(() => {
      expect(screen.getByText(/Added: QR Roasted Coffee 500g/i)).toBeInTheDocument();
    });
    expect(input).toHaveValue('');
  });

  test('does not hijack typing when cashier is typing into product search input', () => {
    render(
      <POSTab
        products={SAMPLE_PRODUCTS}
        categories={[{ id: 10, name: 'Groceries' }]}
        customers={[]}
        token="tok"
        user={{ id: 1, tenant: { name: 'Demo Shop' } }}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search products by name or sku/i);
    const scannerInput = screen.getByTestId('pos-scanner-input');
    searchInput.focus();

    fireEvent.keyDown(window, { key: 'c' });
    expect(document.activeElement).toBe(searchInput);
    expect(scannerInput).toHaveValue('');
  });

  test('silently auto-connects granted USB/Serial hardware scanners with no UI containers and queries database for the scanned code', async () => {
    const encoder = new TextEncoder();
    const chunks = [encoder.encode('QR-DB-REMOTE-88\r\n')];
    let idx = 0;

    const fakePort = {
      readable: {
        getReader: () => ({
          read: vi.fn(async () => {
            if (idx < chunks.length) {
              const value = chunks[idx++];
              return { value, done: false };
            }
            return { value: undefined, done: true };
          }),
          cancel: vi.fn().mockResolvedValue(undefined),
          releaseLock: vi.fn(),
        }),
      },
      open: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
    };

    Object.defineProperty(navigator, 'serial', {
      configurable: true,
      value: {
        getPorts: vi.fn().mockResolvedValue([fakePort]),
        requestPort: vi.fn().mockResolvedValue(fakePort),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    });

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        count: 1,
        data: [
          {
            id: 99,
            name: 'Fresh DB Tea Caddy',
            sku: 'TEA-DB',
            barcode: null,
            qr_code: 'QR-DB-REMOTE-88',
            price: 22000,
            stock: 6,
            category_id: 10,
          },
        ],
      }),
    });

    render(
      <POSTab
        products={SAMPLE_PRODUCTS}
        categories={[{ id: 10, name: 'Groceries' }]}
        customers={[]}
        token="tok"
        user={{ id: 1, tenant: { name: 'Demo Shop' } }}
      />
    );

    expect(screen.queryByTestId('pos-serial-connect-btn')).not.toBeInTheDocument();

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\/products\/lookup-code\?code=QR-DB-REMOTE-88&code_type=barcode/),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer tok' }),
        })
      );
      expect(screen.getByText(/Added: Fresh DB Tea Caddy/i)).toBeInTheDocument();
    });
  });

  test('displays matching products modal when database returns multiple products for one scanned code and adds chosen product', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        count: 2,
        data: [
          {
            id: 101,
            name: 'Honey Jar 250g',
            sku: 'HNY-250',
            qr_code: 'QR-HONEY-SHARED',
            price: 15000,
            stock: 10,
            category: { id: 10, name: 'Groceries' },
          },
          {
            id: 102,
            name: 'Honey Jar 500g',
            sku: 'HNY-500',
            qr_code: 'QR-HONEY-SHARED',
            price: 27000,
            stock: 4,
            category: { id: 10, name: 'Groceries' },
          },
        ],
      }),
    });

    render(
      <POSTab
        products={[]}
        categories={[{ id: 10, name: 'Groceries' }]}
        customers={[]}
        token="tok"
        user={{ id: 1, tenant: { name: 'Demo Shop' } }}
      />
    );

    await user.click(screen.getByRole('button', { name: 'QR Code' }));
    const input = screen.getByTestId('pos-scanner-input');
    fireEvent.change(input, { target: { value: 'QR-HONEY-SHARED' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText(/Matching Products \(2\)/i)).toBeInTheDocument();
      expect(screen.getByText('Honey Jar 250g')).toBeInTheDocument();
      expect(screen.getByText('Honey Jar 500g')).toBeInTheDocument();
    });

    const addButtons = screen.getAllByRole('button', { name: 'Add to Sale' });
    await user.click(addButtons[1]);

    await waitFor(() => {
      expect(screen.queryByText(/Matching Products \(2\)/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Added: Honey Jar 500g/i)).toBeInTheDocument();
    });
  });

  test('ProductsTab queries database and returns matching products when hardware scanner scans a barcode or QR code', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        count: 2,
        data: [
          { id: 201, name: 'DB Match Alpha', sku: 'ALF-1', barcode: '555000111', stock: 8, reorder_level: 2, price: 12000 },
          { id: 202, name: 'DB Match Beta', sku: 'BET-2', barcode: '555000111', stock: 3, reorder_level: 2, price: 18000 },
        ],
      }),
    });

    render(
      <ProductsTab
        products={SAMPLE_PRODUCTS}
        categories={[{ id: 10, name: 'Groceries' }]}
        suppliers={[]}
        token="tok"
        user={{ id: 1, tenant_id: 1 }}
        loading={false}
        onAddProduct={vi.fn()}
        onProductDeleted={vi.fn()}
        onProductUpdated={vi.fn()}
        toast={{ success: vi.fn(), error: vi.fn() }}
      />
    );

    const searchInput = screen.getByTestId('products-search-input');
    fireEvent.change(searchInput, { target: { value: '555000111' } });
    fireEvent.keyDown(searchInput, { key: 'Enter' });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\/products\/lookup-code\?code=555000111/),
        expect.any(Object)
      );
      expect(screen.getAllByText('DB Match Alpha').length).toBeGreaterThan(0);
      expect(screen.getAllByText('DB Match Beta').length).toBeGreaterThan(0);
    });
    expect(screen.queryByText('Barcoded Olive Oil 1L')).not.toBeInTheDocument();
  });
});
