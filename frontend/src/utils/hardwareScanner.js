import { useCallback, useEffect, useRef, useState } from 'react';

const SCAN_CHAR_INTERVAL_MS = 85;
const SCAN_IDLE_SUBMIT_MS = 160;
const MIN_BURST_AUTO_CHARS = 4;

/** Strip ASCII control characters (STX/ETX/CR/LF/TAB/GS, DEL) safely without control-regex literals. */
export function stripControlChars(raw) {
  if (raw === null || raw === undefined) return '';
  const str = String(raw);
  let out = '';
  for (let i = 0; i < str.length; i += 1) {
    const code = str.charCodeAt(i);
    if (code >= 32 && code !== 127) {
      out += str[i];
    }
  }
  return out;
}

/** Normalize scanned barcode or QR payload from camera, HID keyboard wedge, or serial reader. */
export function sanitizeScannedCode(raw) {
  return stripControlChars(raw).trim();
}

/**
 * Resolve all matching products from a list for an incoming barcode/QR/SKU,
 * ordered with the active scan mode ('barcode' vs 'qr_code') prioritized first.
 */
export function matchProductsByCode(products, rawCode, preferredMode = 'barcode') {
  const code = sanitizeScannedCode(rawCode);
  if (!code || !Array.isArray(products)) return [];

  const matchesField = (val) => Boolean(val && String(val).trim() === code);
  const matchesSku = (val) => Boolean(val && String(val).trim().toLowerCase() === code.toLowerCase());

  const primary = [];
  const secondary = [];
  const skuFallback = [];
  const seen = new Set();

  const pushUnique = (bucket, product, idx) => {
    const key = product?.id ?? `idx-${idx}`;
    if (seen.has(key)) return;
    seen.add(key);
    bucket.push(product);
  };

  products.forEach((p, idx) => {
    const isBarcode = matchesField(p?.barcode);
    const isQr = matchesField(p?.qr_code);
    const isSku = matchesSku(p?.sku);

    if (preferredMode === 'qr_code') {
      if (isQr) pushUnique(primary, p, idx);
      else if (isBarcode) pushUnique(secondary, p, idx);
      else if (isSku) pushUnique(skuFallback, p, idx);
    } else if (isBarcode) {
      pushUnique(primary, p, idx);
    } else if (isQr) {
      pushUnique(secondary, p, idx);
    } else if (isSku) {
      pushUnique(skuFallback, p, idx);
    }
  });

  return [...primary, ...secondary, ...skuFallback];
}

/**
 * Resolve the top-priority product matching an incoming code.
 */
export function matchProductByCode(products, rawCode, preferredMode = 'barcode') {
  return matchProductsByCode(products, rawCode, preferredMode)[0] || null;
}

/**
 * Query the backend database (/api/products/lookup-code) for all products matching
 * the scanned barcode, QR code, or SKU, with safe local fallback when offline.
 */
export async function lookupProductsByCodeInDb({
  apiUrl,
  token,
  code,
  codeType,
  fallbackProducts = [],
}) {
  const clean = sanitizeScannedCode(code);
  if (!clean) {
    return { source: 'none', code: '', products: [] };
  }

  if (apiUrl && token && typeof fetch === 'function') {
    try {
      const params = new URLSearchParams({ code: clean });
      if (codeType) params.set('code_type', codeType);
      const res = await fetch(`${apiUrl}/products/lookup-code?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      if (res?.ok) {
        const json = await res.json();
        const rows = Array.isArray(json?.data) ? json.data : [];
        return { source: 'database', code: clean, products: rows };
      }
    } catch {
      // Offline / unreachable API fallback below
    }
  }

  return {
    source: 'local',
    code: clean,
    products: matchProductsByCode(fallbackProducts, clean, codeType),
  };
}

/** Split buffered serial data on CR, LF, Tab, or ETX into complete tokens plus trailing remainder. */
function splitSerialBuffer(buffer) {
  const tokens = [];
  let start = 0;
  for (let i = 0; i < buffer.length; i += 1) {
    const c = buffer.charCodeAt(i);
    if (c === 13 || c === 10 || c === 9 || c === 3) {
      const piece = sanitizeScannedCode(buffer.slice(start, i));
      if (piece) tokens.push(piece);
      start = i + 1;
    }
  }
  return { tokens, remainder: buffer.slice(start) };
}

/**
 * Supports physical USB/Bluetooth barcode & QR scanners across:
 * 1. HID Keyboard-Wedge scanners (global capture without dropping char #1, Enter/NumpadEnter/Ctrl+J/Tab terminators,
 *    and suffix-less rapid burst auto-match)
 * 2. Clipboard-wedge paste with CR/LF terminator
 * 3. Web Serial (USB COM / CDC) hardware scanners in Chromium browsers
 */
export function useHardwareScanner({
  inputRef,
  value,
  onValueChange,
  onScan,
  canAutoMatch,
  disabled = false,
}) {
  const latestRef = useRef({ value, onValueChange, onScan, canAutoMatch, disabled });
  latestRef.current = { value, onValueChange, onScan, canAutoMatch, disabled };

  const syncedValueRef = useRef(value || '');
  useEffect(() => {
    syncedValueRef.current = value || '';
  }, [value]);

  const lastKeyTimeRef = useRef(0);
  const fastStreakRef = useRef(0);
  const idleTimerRef = useRef(null);

  const serialSupported =
    typeof navigator !== 'undefined' &&
    'serial' in navigator &&
    typeof navigator.serial?.requestPort === 'function';

  const [serialStatus, setSerialStatus] = useState(
    serialSupported ? 'disconnected' : 'unsupported'
  );
  const [serialError, setSerialError] = useState(null);
  const activePortRef = useRef(null);
  const activeReaderRef = useRef(null);
  const closingSerialRef = useRef(false);

  const clearBurstState = useCallback(() => {
    clearTimeout(idleTimerRef.current);
    idleTimerRef.current = null;
    fastStreakRef.current = 0;
  }, []);

  const submitScannedValue = useCallback((raw) => {
    const clean = sanitizeScannedCode(raw);
    clearBurstState();
    lastKeyTimeRef.current = 0;
    if (!clean) return;
    syncedValueRef.current = '';
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    latestRef.current.onValueChange?.('');
    latestRef.current.onScan?.(clean);
  }, [clearBurstState, inputRef]);

  const recordCharTiming = useCallback(() => {
    const now = Date.now();
    const delta =
      lastKeyTimeRef.current > 0 ? now - lastKeyTimeRef.current : Number.POSITIVE_INFINITY;
    fastStreakRef.current =
      delta >= 0 && delta <= SCAN_CHAR_INTERVAL_MS ? fastStreakRef.current + 1 : 1;
    lastKeyTimeRef.current = now;

    clearTimeout(idleTimerRef.current);
    if (fastStreakRef.current >= MIN_BURST_AUTO_CHARS) {
      idleTimerRef.current = setTimeout(() => {
        const candidate = sanitizeScannedCode(
          inputRef.current?.value ?? syncedValueRef.current
        );
        if (candidate && latestRef.current.canAutoMatch?.(candidate)) {
          submitScannedValue(candidate);
        }
      }, SCAN_IDLE_SUBMIT_MS);
    }
  }, [inputRef, submitScannedValue]);

  const handleInputChange = useCallback((nextRaw) => {
    const cleaned = stripControlChars(nextRaw);
    const grew = cleaned.length > syncedValueRef.current.length;
    syncedValueRef.current = cleaned;
    latestRef.current.onValueChange?.(cleaned);
    if (grew) {
      recordCharTiming();
    } else {
      clearBurstState();
    }
  }, [clearBurstState, recordCharTiming]);

  const handleInputKeyDown = useCallback((e) => {
    const isCtrlJ = e.ctrlKey && e.key?.toLowerCase() === 'j';
    const isRapidTab =
      e.key === 'Tab' &&
      fastStreakRef.current >= 2 &&
      Date.now() - lastKeyTimeRef.current <= 140;

    if (e.key === 'Enter' || e.key === 'NumpadEnter' || isCtrlJ || isRapidTab) {
      e.preventDefault();
      const raw = e.currentTarget?.value ?? syncedValueRef.current;
      submitScannedValue(raw);
    }
  }, [submitScannedValue]);

  const handleInputPaste = useCallback((e) => {
    const pasted = e.clipboardData?.getData('text');
    if (!pasted) return;

    const clean = sanitizeScannedCode(pasted);
    if (/[\r\n\t]/.test(pasted) && clean) {
      e.preventDefault();
      submitScannedValue(clean);
      return;
    }

    if (clean !== pasted) {
      e.preventDefault();
      syncedValueRef.current = clean;
      if (inputRef.current) inputRef.current.value = clean;
      latestRef.current.onValueChange?.(clean);
    }
  }, [inputRef, submitScannedValue]);

  // Capture-phase global listener catches USB/Bluetooth HID scans even when focus isn't inside the input
  useEffect(() => {
    const handleGlobalKey = (e) => {
      if (latestRef.current.disabled) return;
      if (typeof document !== 'undefined' && document.querySelector('[role="dialog"]')) return;

      const active = document.activeElement;
      const tag = active?.tagName?.toLowerCase();
      const isOtherEditable =
        (['input', 'textarea', 'select'].includes(tag) && active !== inputRef.current) ||
        Boolean(active?.isContentEditable);
      if (isOtherEditable) return;

      // Focused scanner input already receives events through React handlers
      if (active === inputRef.current) return;

      const isCtrlJ = e.ctrlKey && e.key?.toLowerCase() === 'j';
      const recentBurst =
        fastStreakRef.current >= 1 &&
        Date.now() - lastKeyTimeRef.current <= 250 &&
        Boolean(sanitizeScannedCode(syncedValueRef.current));

      if (recentBurst && (e.key === 'Enter' || e.key === 'NumpadEnter' || e.key === 'Tab' || isCtrlJ)) {
        e.preventDefault();
        inputRef.current?.focus();
        submitScannedValue(inputRef.current?.value || syncedValueRef.current);
        return;
      }

      if (e.key && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        inputRef.current?.focus();
        const next = syncedValueRef.current + e.key;
        syncedValueRef.current = next;
        if (inputRef.current) {
          inputRef.current.value = next;
        }
        latestRef.current.onValueChange?.(next);
        recordCharTiming();
      }
    };

    window.addEventListener('keydown', handleGlobalKey, true);
    return () => {
      window.removeEventListener('keydown', handleGlobalKey, true);
      clearTimeout(idleTimerRef.current);
    };
  }, [inputRef, recordCharTiming, submitScannedValue]);

  const stopSerialReader = useCallback(async () => {
    closingSerialRef.current = true;
    try {
      await activeReaderRef.current?.cancel();
    } catch {
      // Ignore already-closed reader
    }
    try {
      activeReaderRef.current?.releaseLock?.();
    } catch {
      // Ignore lock errors
    }
    activeReaderRef.current = null;

    try {
      await activePortRef.current?.close();
    } catch {
      // Ignore close errors
    }
    activePortRef.current = null;
    if (serialSupported) {
      setSerialStatus('disconnected');
    }
  }, [serialSupported]);

  const startReadingPort = useCallback(async (port) => {
    if (!port || !serialSupported) return;
    if (activePortRef.current === port && activeReaderRef.current) return;

    await stopSerialReader();
    closingSerialRef.current = false;
    setSerialStatus('connecting');
    setSerialError(null);

    try {
      if (!port.readable) {
        await port.open({ baudRate: 9600 });
      }
      if (!port.readable) {
        throw new Error('Selected device has no readable serial stream.');
      }

      activePortRef.current = port;
      setSerialStatus('connected');

      const reader = port.readable.getReader();
      activeReaderRef.current = reader;
      const decoder = new TextDecoder();
      let buffer = '';

      while (!closingSerialRef.current) {
        const { value: chunk, done } = await reader.read();
        if (done) break;
        if (!chunk) continue;

        buffer += decoder.decode(chunk, { stream: true });
        const { tokens, remainder } = splitSerialBuffer(buffer);
        buffer = remainder;
        for (const token of tokens) {
          latestRef.current.onScan?.(token);
        }
      }
    } catch (err) {
      if (!closingSerialRef.current) {
        setSerialStatus('error');
        setSerialError(err?.message || 'Unable to read from hardware serial scanner.');
      }
    } finally {
      try {
        activeReaderRef.current?.releaseLock?.();
      } catch {
        // Ignore
      }
      activeReaderRef.current = null;
      if (!closingSerialRef.current && activePortRef.current === port) {
        activePortRef.current = null;
        setSerialStatus((prev) => (prev === 'error' ? 'error' : 'disconnected'));
      }
    }
  }, [serialSupported, stopSerialReader]);

  const connectSerial = useCallback(async () => {
    if (!serialSupported || !navigator?.serial?.requestPort) return;
    setSerialError(null);
    try {
      const port = await navigator.serial.requestPort();
      await startReadingPort(port);
    } catch (err) {
      if (err?.name === 'NotFoundError') return; // User canceled picker
      setSerialStatus('error');
      setSerialError(err?.message || 'Failed to connect hardware scanner.');
    }
  }, [serialSupported, startReadingPort]);

  useEffect(() => {
    const serial = typeof navigator !== 'undefined' ? navigator.serial : null;
    if (!serialSupported || !serial) return undefined;

    let mounted = true;
    if (typeof serial.getPorts === 'function') {
      serial
        .getPorts()
        .then((ports) => {
          if (mounted && Array.isArray(ports) && ports.length > 0) {
            startReadingPort(ports[0]);
          }
        })
        .catch(() => {});
    }

    const handleConnect = (ev) => {
      if (ev?.target) startReadingPort(ev.target);
    };
    const handleDisconnect = (ev) => {
      if (!activePortRef.current || ev?.target === activePortRef.current) {
        stopSerialReader();
      }
    };

    serial.addEventListener?.('connect', handleConnect);
    serial.addEventListener?.('disconnect', handleDisconnect);

    return () => {
      mounted = false;
      serial?.removeEventListener?.('connect', handleConnect);
      serial?.removeEventListener?.('disconnect', handleDisconnect);
      stopSerialReader();
    };
  }, [serialSupported, startReadingPort, stopSerialReader]);

  return {
    serialSupported,
    serialStatus,
    serialError,
    connectSerial,
    disconnectSerial: stopSerialReader,
    handleInputChange,
    handleInputKeyDown,
    handleInputPaste,
  };
}
