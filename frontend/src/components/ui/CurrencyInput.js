import React, { useRef, useLayoutEffect, forwardRef } from 'react';
import { formatNumberWithCommas, cleanNumber } from '../../utils/currency';

/**
 * CurrencyInput Component
 *
 * Automatically displays commas as a thousand separator as the user types,
 * while passing a clean numeric string (or sanitized decimal) to onChange.
 * Preserves cursor position across comma formatting changes and allows clean Backspace.
 */
const CurrencyInput = forwardRef(({
  value = '',
  onChange,
  onKeyDown,
  name,
  placeholder = '0',
  style,
  className,
  disabled = false,
  readOnly = false,
  required = false,
  autoFocus = false,
  onFocus,
  onBlur,
  ...rest
}, ref) => {
  const localRef = useRef(null);
  const inputRef = ref || localRef;
  const cursorPosRef = useRef(null);

  // Derive the formatted display string from value prop
  const displayValue = formatNumberWithCommas(value);

  const handleChange = (e) => {
    const input = e.target;
    const rawTyped = input.value;
    const oldCursor = input.selectionStart || 0;

    // Count non-comma characters before current cursor in raw typed string
    let nonCommasBefore = 0;
    for (let i = 0; i < oldCursor; i++) {
      if (rawTyped[i] !== ',') nonCommasBefore++;
    }

    const cleaned = cleanNumber(rawTyped);
    const newFormatted = formatNumberWithCommas(cleaned);

    // Compute equivalent cursor position in formatted string
    let newCursor = 0;
    let counted = 0;
    while (newCursor < newFormatted.length && counted < nonCommasBefore) {
      if (newFormatted[newCursor] !== ',') {
        counted++;
      }
      newCursor++;
    }

    cursorPosRef.current = newCursor;

    if (onChange) {
      const syntheticEvent = {
        target: {
          name: name || '',
          value: cleaned,
        },
        currentTarget: {
          name: name || '',
          value: cleaned,
        },
        persist: () => {},
        stopPropagation: () => {},
        preventDefault: () => {},
      };
      onChange(syntheticEvent);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Backspace' && !readOnly && !disabled) {
      const input = inputRef.current;
      if (input) {
        const { selectionStart, selectionEnd } = input;
        // If single cursor position and character right before cursor is a comma
        if (selectionStart === selectionEnd && selectionStart > 0) {
          if (input.value[selectionStart - 1] === ',') {
            e.preventDefault();
            // Delete the digit before the comma instead of getting stuck
            const before = input.value.slice(0, selectionStart - 2);
            const after = input.value.slice(selectionStart);
            const combined = before + after;
            const cleaned = cleanNumber(combined);
            const newFormatted = formatNumberWithCommas(cleaned);

            let newCursor = Math.max(0, selectionStart - 2);
            if (newCursor > 0 && newFormatted[newCursor - 1] === ',') {
              newCursor--;
            }
            cursorPosRef.current = newCursor;

            if (onChange) {
              const syntheticEvent = {
                target: {
                  name: name || '',
                  value: cleaned,
                },
                currentTarget: {
                  name: name || '',
                  value: cleaned,
                },
                persist: () => {},
                stopPropagation: () => {},
                preventDefault: () => {},
              };
              onChange(syntheticEvent);
            }
            return;
          }
        }
      }
    }

    if (onKeyDown) onKeyDown(e);
  };

  useLayoutEffect(() => {
    if (inputRef.current && cursorPosRef.current !== null && document.activeElement === inputRef.current) {
      const targetPos = Math.min(cursorPosRef.current, inputRef.current.value.length);
      inputRef.current.setSelectionRange(targetPos, targetPos);
      cursorPosRef.current = null;
    }
  }, [displayValue]);

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      name={name}
      value={displayValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      style={style}
      className={className}
      disabled={disabled}
      readOnly={readOnly}
      required={required}
      autoFocus={autoFocus}
      onFocus={onFocus}
      onBlur={onBlur}
      {...rest}
    />
  );
});

export default CurrencyInput;
