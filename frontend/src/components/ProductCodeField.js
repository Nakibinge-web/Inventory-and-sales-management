import React, { useState } from 'react';
import CodeScannerModal from './CodeScannerModal';
import CodeTypeSwitcher, { BarcodeGlyph, QrCodeGlyph, ScanFrameGlyph } from './CodeTypeSwitcher';
import { sanitizeScannedCode, stripControlChars } from '../utils/hardwareScanner';

/**
 * Shared Barcode / QR Code field with segmented mode toggle, hardware scanner safety, and camera icon.
 */
export default function ProductCodeField({
  codeType = 'barcode',
  value = '',
  onCodeTypeChange,
  onValueChange,
  error,
}) {
  const [scannerOpen, setScannerOpen] = useState(false);
  const isQr = codeType === 'qr_code';

  return (
    <div style={styles.field}>
      <div style={styles.headerRow}>
        <label htmlFor="product-code-input" style={styles.label}>
          <span style={styles.labelText}>{isQr ? 'Product QR Code' : 'Product Barcode'}</span>
          <span style={styles.optionalTag}>(Optional)</span>
        </label>
        <CodeTypeSwitcher
          value={codeType}
          onChange={onCodeTypeChange}
          ariaLabel="Product code type"
        />
      </div>

      <div style={styles.inputWrap}>
        <span style={styles.inputIcon}>
          {isQr ? <QrCodeGlyph /> : <BarcodeGlyph />}
        </span>
        <input
          id="product-code-input"
          className="product-modal-input"
          name={isQr ? 'qr_code' : 'barcode'}
          placeholder={isQr ? 'Scan or manually enter QR code' : 'Scan or manually enter barcode'}
          value={value}
          onChange={(e) => onValueChange(stripControlChars(e.target.value))}
          onKeyDown={(e) => {
            // Prevent hardware USB/Bluetooth scanners that append Enter or Ctrl+J from submitting the product form early
            if (e.key === 'Enter' || e.key === 'NumpadEnter' || (e.ctrlKey && e.key.toLowerCase() === 'j')) {
              e.preventDefault();
            }
          }}
          onPaste={(e) => {
            const pasted = e.clipboardData?.getData('text');
            if (!pasted) return;
            const clean = sanitizeScannedCode(pasted);
            if (clean !== pasted) {
              e.preventDefault();
              onValueChange(clean);
            }
          }}
          style={{
            ...styles.input,
            borderColor: error ? '#dc2626' : '#cbd5e1',
          }}
        />
        <button
          type="button"
          onClick={() => setScannerOpen(true)}
          aria-label={isQr ? 'Scan QR code with camera' : 'Scan barcode with camera'}
          title={isQr ? 'Open QR code camera scanner' : 'Open barcode camera scanner'}
          data-testid="product-code-scan-btn"
          style={styles.scanBtn}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#ede9fe';
            e.currentTarget.style.borderColor = '#7c3aed';
            e.currentTarget.style.color = '#4f46e5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f8fafc';
            e.currentTarget.style.borderColor = '#cbd5e1';
            e.currentTarget.style.color = '#475569';
          }}
        >
          <ScanFrameGlyph isQr={isQr} />
        </button>
      </div>

      {error && <span style={styles.fieldError}>{error}</span>}

      <CodeScannerModal
        isOpen={scannerOpen}
        mode={codeType}
        onScan={(decodedText) => {
          onValueChange(decodedText);
          setScannerOpen(false);
        }}
        onClose={() => setScannerOpen(false)}
      />
    </div>
  );
}

const styles = {
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  labelText: {
    color: '#0f172a',
    fontWeight: 600,
  },
  optionalTag: {
    fontSize: 11,
    fontWeight: 400,
    color: '#94a3b8',
  },
  inputWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    color: '#94a3b8',
    display: 'inline-flex',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  input: {
    padding: '10px 48px 10px 36px',
    borderWidth: '1.5px',
    borderStyle: 'solid',
    borderColor: '#cbd5e1',
    borderRadius: 9,
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    background: '#fff',
    color: '#0f172a',
  },
  scanBtn: {
    position: 'absolute',
    right: 6,
    width: 34,
    height: 32,
    borderRadius: 7,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#cbd5e1',
    background: '#f8fafc',
    color: '#475569',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
    transition: 'all 0.15s ease',
  },
  fieldError: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: 500,
    marginTop: 2,
    display: 'block',
  },
};
