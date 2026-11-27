import React from 'react';

export const BarcodeGlyph = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 5v14M7 5v14M11 5v14M15 5v10M19 5v14M15 18v1" />
  </svg>
);

export const QrCodeGlyph = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <path d="M14 14h3v3h-3zM20 14v3h-3M14 20h7" />
  </svg>
);

export const ScanFrameGlyph = ({ isQr }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    {isQr ? (
      <>
        <rect x="7" y="7" width="4" height="4" rx="0.5" />
        <rect x="13" y="7" width="4" height="4" rx="0.5" />
        <rect x="7" y="13" width="4" height="4" rx="0.5" />
        <path d="M13 13h4v4" />
      </>
    ) : (
      <path d="M7 8v8M10 8v8M14 8v8M17 8v8" />
    )}
  </svg>
);

/**
 * Shared Barcode / QR Code segmented pill toggle used across Product forms and POS.
 */
export default function CodeTypeSwitcher({
  value = 'barcode',
  onChange,
  ariaLabel = 'Code type',
}) {
  return (
    <div role="group" aria-label={ariaLabel} style={switcherStyles.group}>
      {[
        { id: 'barcode', label: 'Barcode', Icon: BarcodeGlyph },
        { id: 'qr_code', label: 'QR Code', Icon: QrCodeGlyph },
      ].map(({ id, label, Icon }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange?.(id)}
            style={{
              ...switcherStyles.btn,
              ...(active ? switcherStyles.btnActive : {}),
            }}
          >
            <Icon />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

const switcherStyles = {
  group: {
    display: 'inline-flex',
    gap: 4,
    padding: 2,
    borderRadius: 8,
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
  },
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 8px',
    borderRadius: 6,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'transparent',
    background: 'transparent',
    color: '#64748b',
    fontSize: 11.5,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s ease',
  },
  btnActive: {
    background: '#ede9fe',
    borderColor: '#7c3aed',
    color: '#4f46e5',
    fontWeight: 600,
  },
};
