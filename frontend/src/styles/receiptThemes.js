// Curated Color Themes for Receipts & Invoices
// Each theme defines high-contrast, print-safe colors for headers, tables, badges, and accents.

export const RECEIPT_THEMES = {
  rose: {
    id: 'rose',
    name: 'Rose Pink',
    description: 'Vibrant rose pink (default)',
    primary: '#be123c',        // Rose 700 - Brand name, accents, total amount
    dark: '#881337',           // Rose 900 - Table header, badge text, section headers
    light: '#fff1f2',          // Rose 50 - Badge bg, totals bar bg, notes bg
    border: '#fda4af',         // Rose 300 - Badge border
    noteBorder: '#fecdd3',     // Rose 200 - Notes container border
    watermark: 'rgba(190, 18, 60, 0.06)',
    previewColor: '#be123c',
  },
  classicBlue: {
    id: 'classicBlue',
    name: 'Royal Blue',
    description: 'Executive corporate navy & royal blue',
    primary: '#1d4ed8',        // Blue 700
    dark: '#1e3a8a',           // Blue 900
    light: '#eff6ff',          // Blue 50
    border: '#93c5fd',         // Blue 300
    noteBorder: '#bfdbfe',     // Blue 200
    watermark: 'rgba(29, 78, 216, 0.06)',
    previewColor: '#1d4ed8',
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Green',
    description: 'Trustworthy, clean forest & emerald green',
    primary: '#047857',        // Emerald 700
    dark: '#064e3b',           // Emerald 900
    light: '#ecfdf5',          // Emerald 50
    border: '#6ee7b7',         // Emerald 300
    noteBorder: '#a7f3d0',     // Emerald 200
    watermark: 'rgba(4, 120, 87, 0.06)',
    previewColor: '#047857',
  },
  slate: {
    id: 'slate',
    name: 'Slate Charcoal',
    description: 'Modern minimalist monochrome & charcoal',
    primary: '#334155',        // Slate 700
    dark: '#0f172a',           // Slate 900
    light: '#f8fafc',          // Slate 50
    border: '#cbd5e1',         // Slate 300
    noteBorder: '#e2e8f0',     // Slate 200
    watermark: 'rgba(15, 23, 42, 0.05)',
    previewColor: '#0f172a',
  },
  purple: {
    id: 'purple',
    name: 'Deep Purple',
    description: 'Prestigious violet & deep royal purple',
    primary: '#6d28d9',        // Purple 700
    dark: '#4c1d95',           // Purple 900
    light: '#f5f3ff',          // Purple 50
    border: '#c4b5fd',         // Purple 300
    noteBorder: '#ddd6fe',     // Purple 200
    watermark: 'rgba(109, 40, 217, 0.06)',
    previewColor: '#6d28d9',
  },
  amber: {
    id: 'amber',
    name: 'Warm Amber',
    description: 'Rich warm amber & deep bronze',
    primary: '#b45309',        // Amber 700
    dark: '#78350f',           // Amber 900
    light: '#fffbeb',          // Amber 50
    border: '#fcd34d',         // Amber 300
    noteBorder: '#fde68a',     // Amber 200
    watermark: 'rgba(180, 83, 9, 0.06)',
    previewColor: '#b45309',
  },
};

export const THEME_OPTIONS = Object.values(RECEIPT_THEMES);

export function getReceiptTheme(themeId) {
  if (!themeId) return RECEIPT_THEMES.rose;
  return RECEIPT_THEMES[themeId] || RECEIPT_THEMES.rose;
}
