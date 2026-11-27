import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import AddProductForm from './AddProductForm';
import EditProductForm from './EditProductForm';

const { mockStart, mockStop, mockClear, mockScanFile, mockGetCameras, capturedConfigs } = vi.hoisted(() => ({
  mockStart: vi.fn(),
  mockStop: vi.fn().mockResolvedValue(undefined),
  mockClear: vi.fn(),
  mockScanFile: vi.fn(),
  mockGetCameras: vi.fn().mockResolvedValue([]),
  capturedConfigs: [],
}));

vi.mock('html5-qrcode', () => ({
  Html5QrcodeSupportedFormats: {
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
  },
  Html5Qrcode: class MockHtml5Qrcode {
    constructor(elementId, config) {
      capturedConfigs.push({ elementId, config });
      this.isScanning = false;
    }
    async start(constraint, scanConfig, onSuccess) {
      this.isScanning = true;
      mockStart(constraint, scanConfig, onSuccess);
      return null;
    }
    async stop() {
      this.isScanning = false;
      return mockStop();
    }
    clear() {
      return mockClear();
    }
    async scanFile(file, showImage) {
      return mockScanFile(file, showImage);
    }
    static getCameras() {
      return mockGetCameras();
    }
  },
}));

describe('AddProductForm & EditProductForm Barcode / QR Code switcher', () => {
  beforeEach(() => {
    mockStart.mockClear();
    mockStop.mockClear();
    mockClear.mockClear();
    mockScanFile.mockClear();
    mockGetCameras.mockClear();
    capturedConfigs.length = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('allows switching between Barcode and QR code in the product addition modal and submits qr_code', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { id: 10, name: 'Organic Honey 500g', code_type: 'qr_code', qr_code: 'QR-HONEY-2026' },
      }),
    });
    const onSuccess = vi.fn();

    render(
      <AddProductForm
        token="test-token"
        categories={[{ id: 1, name: 'Groceries' }]}
        suppliers={[]}
        onSuccess={onSuccess}
        onCancel={vi.fn()}
      />
    );

    // Starts on Barcode mode
    const barcodeBtn = screen.getByRole('button', { name: 'Barcode' });
    const qrBtn = screen.getByRole('button', { name: 'QR Code' });
    expect(barcodeBtn).toHaveAttribute('aria-pressed', 'true');
    expect(qrBtn).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByPlaceholderText('Scan or manually enter barcode')).toBeInTheDocument();

    // Type a code, then switch to QR Code — value is preserved
    const codeInput = screen.getByLabelText(/Product Barcode/i);
    fireEvent.change(codeInput, { target: { value: 'QR-HONEY-2026' } });
    fireEvent.click(qrBtn);

    expect(qrBtn).toHaveAttribute('aria-pressed', 'true');
    expect(barcodeBtn).toHaveAttribute('aria-pressed', 'false');
    const qrInput = screen.getByPlaceholderText('Scan or manually enter QR code');
    expect(qrInput).toHaveValue('QR-HONEY-2026');

    // Fill required fields and submit
    fireEvent.change(screen.getByPlaceholderText(/Memory Foam Mattress Queen/i), {
      target: { value: 'Organic Honey 500g' },
    });
    fireEvent.change(screen.getByDisplayValue('— Select measurement unit —'), {
      target: { value: 'Bottles' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter current stock quantity'), {
      target: { value: '12' },
    });
    fireEvent.change(screen.getByPlaceholderText('e.g. 75,000'), {
      target: { value: '25000' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Add Product to Inventory/i }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    const [, requestInit] = fetchSpy.mock.calls[0];
    const submitted = requestInit.body;
    expect(submitted.get('code_type')).toBe('qr_code');
    expect(submitted.get('qr_code')).toBe('QR-HONEY-2026');
    expect(submitted.get('barcode')).toBe('');
  });

  test('submits barcode mode cleanly when Barcode is selected', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { id: 11, name: 'USB-C Hub', code_type: 'barcode', barcode: '8806094910211' },
      }),
    });
    const onSuccess = vi.fn();

    render(
      <AddProductForm
        token="test-token"
        categories={[]}
        suppliers={[]}
        onSuccess={onSuccess}
        onCancel={vi.fn()}
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/Memory Foam Mattress Queen/i), {
      target: { value: 'USB-C Hub' },
    });
    fireEvent.change(screen.getByPlaceholderText('Scan or manually enter barcode'), {
      target: { value: '8806094910211' },
    });
    fireEvent.change(screen.getByDisplayValue('— Select measurement unit —'), {
      target: { value: 'Pieces (pcs)' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter current stock quantity'), {
      target: { value: '5' },
    });
    fireEvent.change(screen.getByPlaceholderText('e.g. 75,000'), {
      target: { value: '45000' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Add Product to Inventory/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    const [, requestInit] = fetchSpy.mock.calls[0];
    const submitted = requestInit.body;
    expect(submitted.get('code_type')).toBe('barcode');
    expect(submitted.get('barcode')).toBe('8806094910211');
    expect(submitted.get('qr_code')).toBe('');
  });

  test('EditProductForm initializes in QR Code mode when product has a qr_code', () => {
    render(
      <EditProductForm
        token="test-token"
        product={{
          id: 22,
          name: 'Smart Thermostat',
          sku: 'SMT-01',
          barcode: null,
          qr_code: 'https://qr.example.com/item/22',
          code_type: 'qr_code',
          unit: 'Pieces (pcs)',
          stock: 4,
          price: 150000,
        }}
        categories={[]}
        suppliers={[]}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'QR Code' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByPlaceholderText('Scan or manually enter QR code')).toHaveValue(
      'https://qr.example.com/item/22'
    );
  });

  test('clicking the scan icon opens a Barcode scanner in Barcode mode and a QR scanner in QR Code mode', async () => {
    render(
      <AddProductForm
        token="test-token"
        categories={[]}
        suppliers={[]}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // 1. Click scan icon while in Barcode mode
    const barcodeScanBtn = screen.getByRole('button', { name: 'Scan barcode with camera' });
    fireEvent.click(barcodeScanBtn);

    expect(screen.getByText('Scan Product Barcode')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockStart).toHaveBeenCalledTimes(1);
    });

    expect(capturedConfigs[0].config.formatsToSupport).not.toContain(0); // excludes QR_CODE
    expect(capturedConfigs[0].config.formatsToSupport).toContain(9); // EAN_13
    expect(mockStart.mock.calls[0][0]).toEqual({ facingMode: 'environment' });

    const onBarcodeDecoded = mockStart.mock.calls[0][2];
    await act(async () => {
      onBarcodeDecoded('8901234567890');
    });

    await waitFor(() => {
      expect(screen.queryByText('Scan Product Barcode')).not.toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText('Scan or manually enter barcode')).toHaveValue('8901234567890');

    // 2. Switch to QR Code mode and click scan icon
    fireEvent.click(screen.getByRole('button', { name: 'QR Code' }));
    const qrScanBtn = screen.getByRole('button', { name: 'Scan QR code with camera' });
    fireEvent.click(qrScanBtn);

    expect(screen.getByText('Scan Product QR Code')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockStart).toHaveBeenCalledTimes(2);
    });

    expect(capturedConfigs[1].config.formatsToSupport).toEqual([0]); // QR_CODE only

    const onQrDecoded = mockStart.mock.calls[1][2];
    await act(async () => {
      onQrDecoded('QR-PACK-7788');
    });

    await waitFor(() => {
      expect(screen.queryByText('Scan Product QR Code')).not.toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText('Scan or manually enter QR code')).toHaveValue('QR-PACK-7788');
  });

  test('hardware scanner trailing Enter inside ProductCodeField does not prematurely submit AddProductForm', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const onSuccess = vi.fn();

    render(
      <AddProductForm
        token="test-token"
        categories={[{ id: 1, name: 'Groceries' }]}
        suppliers={[]}
        onSuccess={onSuccess}
        onCancel={vi.fn()}
      />
    );

    const codeInput = screen.getByPlaceholderText('Scan or manually enter barcode');
    fireEvent.change(codeInput, { target: { value: '1234567890128' } });
    const notCanceled = fireEvent.keyDown(codeInput, { key: 'Enter' });

    expect(notCanceled).toBe(false); // preventDefault called
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(codeInput).toHaveValue('1234567890128');
  });
});
