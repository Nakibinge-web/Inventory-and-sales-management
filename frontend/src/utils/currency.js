/**
 * Currency Formatting and Parsing Utilities
 * Provides automatic thousand separator formatting for currency inputs
 * and cleans values for API submissions and numeric calculations.
 */

/**
 * Format a numeric or string value with thousand commas in real time.
 * Preserves decimals and active typing state (e.g. trailing dot).
 *
 * Examples:
 *   formatCurrencyInput('1000')      => '1,000'
 *   formatCurrencyInput('1000000')   => '1,000,000'
 *   formatCurrencyInput('1000.')     => '1,000.'
 *   formatCurrencyInput('1000.50')   => '1,000.50'
 *   formatCurrencyInput('')          => ''
 */
export function formatCurrencyInput(val) {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  if (!str) return '';

  // If user just typed '.', start with '0.'
  if (str === '.') return '0.';

  // Strip all non-digit and non-dot characters
  const clean = str.replace(/[^\d.]/g, '');
  if (!clean) return '';

  const dotIndex = clean.indexOf('.');
  let intPart = dotIndex !== -1 ? clean.slice(0, dotIndex) : clean;
  let decPart = dotIndex !== -1 ? clean.slice(dotIndex + 1).replace(/\./g, '').slice(0, 2) : null;

  // Clean leading zeros from integer part
  if (intPart.length > 1) {
    intPart = intPart.replace(/^0+/, '') || '0';
  } else if (intPart.length === 0 && dotIndex !== -1) {
    intPart = '0';
  }

  // Format integer part with commas as thousand separators
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  if (dotIndex !== -1) {
    return `${formattedInt}.${decPart}`;
  }

  return formattedInt;
}

/**
 * Strips commas and spaces from a formatted currency string, returning
 * a clean numeric string for API requests or formData payloads.
 *
 * Example:
 *   cleanCurrency('1,500,000.50') => '1500000.50'
 */
export function cleanCurrency(val) {
  if (val === null || val === undefined) return '';
  return String(val).replace(/,/g, '').trim();
}

/**
 * Parses a currency input string (with or without commas) into a Float number.
 * Returns 0 if invalid or empty.
 *
 * Example:
 *   parseCurrency('1,500,000') => 1500000
 */
export function parseCurrency(val) {
  const cleaned = cleanCurrency(val);
  if (!cleaned) return 0;
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Formats a value for standard UI display with currency symbol and commas.
 *
 * Example:
 *   formatCurrencyDisplay(15000) => 'UGX 15,000'
 */
export function formatCurrencyDisplay(val, currency = 'UGX') {
  const num = typeof val === 'number' ? val : parseCurrency(val);
  return `${currency} ${Number(num || 0).toLocaleString()}`;
}

// Aliases for compatibility
export const formatNumberWithCommas = formatCurrencyInput;
export const cleanNumber = cleanCurrency;
