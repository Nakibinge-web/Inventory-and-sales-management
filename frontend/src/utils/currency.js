/**
 * Utility functions for currency formatting, sanitization, and parsing.
 */

/**
 * Strips formatting characters (like commas) and non-numeric input,
 * preserving only digits and at most one decimal point.
 * Also normalizes leading zeros (e.g., '05' -> '5', but keeps '0' and '0.5').
 *
 * @param {string|number} val
 * @returns {string} Clean numeric string (e.g., '1000', '1000.50', or '')
 */
export const cleanNumber = (val) => {
  if (val === null || val === undefined) return '';
  const str = String(val).replace(/,/g, '').trim();
  if (str === '') return '';

  let cleaned = '';
  let hasDecimal = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char >= '0' && char <= '9') {
      cleaned += char;
    } else if (char === '.' && !hasDecimal) {
      cleaned += '.';
      hasDecimal = true;
    }
  }

  if (cleaned === '' || cleaned === '.') return cleaned === '.' ? '0.' : '';

  // Handle leading zeros in the integer part
  const parts = cleaned.split('.');
  if (parts[0].length > 1 && parts[0].startsWith('0')) {
    parts[0] = parts[0].replace(/^0+/, '') || '0';
  }

  return parts.join('.');
};

/**
 * Formats a numeric value or numeric string with thousand separator commas.
 * Handles decimal portions seamlessly without losing trailing dots or zeroes while typing.
 *
 * Examples:
 *   formatNumberWithCommas('1000')      => '1,000'
 *   formatNumberWithCommas('1000000')   => '1,000,000'
 *   formatNumberWithCommas('1000.')     => '1,000.'
 *   formatNumberWithCommas('1000.5')    => '1,000.5'
 *   formatNumberWithCommas('1000.50')   => '1,000.50'
 *   formatNumberWithCommas(25000)       => '25,000'
 *
 * @param {string|number} val
 * @returns {string} Formatted string with commas
 */
export const formatNumberWithCommas = (val) => {
  if (val === null || val === undefined || val === '') return '';
  const cleaned = cleanNumber(val);
  if (!cleaned) return '';

  const parts = cleaned.split('.');
  // Add commas to the integer portion
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};

/**
 * Parses a currency input string (with or without commas) into a float.
 * Returns 0 if invalid or empty.
 *
 * @param {string|number} val
 * @returns {number}
 */
export const parseNumber = (val) => {
  if (val === null || val === undefined || val === '') return 0;
  const cleaned = cleanNumber(val);
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};
