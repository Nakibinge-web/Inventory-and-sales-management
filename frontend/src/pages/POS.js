import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import SaleReceipt from '../components/SaleReceipt';
import styles, { posS } from '../styles/dashboardStyles';
import { formatCurrencyInput, parseCurrency } from '../utils/currency';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const isPriceInvalid = (item) => {
  if (!item) return false;
  if (item.isInvalid) return true;
  if (item.price === null || item.price === undefined || typeof item.price !== 'number' || isNaN(item.price) || !isFinite(item.price) || item.price < 0) return true;
  if (typeof item.priceInput === 'string') {
    const t = item.priceInput.trim();
    if (t === '' || t.endsWith('.')) return true;
  }
  return false;
};

function CartPriceInput({ item, updatePrice, resetPrice, onBlurPrice }) {
  const inputRef = useRef(null);
  const cursorPosRef = useRef(null);

  useLayoutEffect(() => {
    if (cursorPosRef.current !== null && inputRef.current === document.activeElement) {
      inputRef.current.setSelectionRange(cursorPosRef.current, cursorPosRef.current);
      cursorPosRef.current = null;
    }
  });

  const handleChange = (e) => {
    const input = e.target;
    const raw = input.value;
    const cursor = input.selectionStart ?? raw.length;

    // Count how many price-significant characters (digits or dots) were before cursor
    const beforeCursor = raw.slice(0, cursor);
    const digitsBeforeCursor = beforeCursor.replace(/[^\d.]/g, '').length;

    const formatted = formatCurrencyInput(raw);

    // Map to position in newly formatted string
    let newCursor = 0;
    let digitsSeen = 0;
    while (newCursor < formatted.length && digitsSeen < digitsBeforeCursor) {
      if (/[\d.]/.test(formatted[newCursor])) {
        digitsSeen++;
      }
      newCursor++;
    }
    cursorPosRef.current = newCursor;

    updatePrice(item.product_id, raw, formatted);
  };

  const isInvalid = isPriceInvalid(item);
  const isCustom = !isInvalid && item.price !== item.defaultPrice;

  return (
    <div style={posS.cartPriceRow}>
      <span style={{ fontSize: 11, color: isInvalid ? '#dc2626' : '#64748b', fontWeight: 600 }}>UGX</span>
      <input
        ref={inputRef}
        style={{
          ...posS.cartPriceInput,
          color: isInvalid ? '#b91c1c' : isCustom ? '#2563eb' : '#0f172a',
          background: isInvalid ? '#fef2f2' : isCustom ? '#eff6ff' : '#f8fafc',
          border: isInvalid ? '1.5px solid #ef4444' : isCustom ? '1px solid #93c5fd' : '1px solid #cbd5e1',
        }}
        type="text"
        inputMode="decimal"
        value={item.priceInput !== undefined ? item.priceInput : formatCurrencyInput(item.price)}
        onChange={handleChange}
        onBlur={() => onBlurPrice(item.product_id)}
        title={isInvalid ? 'Please enter a valid price' : isCustom ? `Default: UGX ${Number(item.defaultPrice || 0).toLocaleString()}` : 'Custom unit price'}
        placeholder="0"
      />
      <span style={{ fontSize: 11, color: isInvalid ? '#dc2626' : '#94a3b8' }}>
        {isInvalid ? 'invalid' : 'each'}
      </span>
      {(isCustom || isInvalid) && (
        <button
          type="button"
          style={posS.cartPriceResetBtn}
          onClick={() => resetPrice(item.product_id)}
          title={`Reset to default price (UGX ${Number(item.defaultPrice || 0).toLocaleString()})`}
        >
          reset
        </button>
      )}
    </div>
  );
}

const createEmptyDraft = (id, label) => ({
  id,
  label: label || `Sale ${id}`,
  cart: [],
  paymentMethod: 'cash',
  customerType: 'walk_in',
  selectedCustomerId: '',
  customerSearch: '',
  newCustomer: { name: '', phone: '', email: '' },
  discountValue: '',
  taxValue: '',
  amountPaid: '',
  cashNote: '',
});

function POSTab({ products = [], categories = [], customers = [], token, user, onSaleCompleted, canSell = true }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Multi-draft sale state
  const [drafts, setDrafts] = useState([createEmptyDraft(1, 'Sale 1')]);
  const [activeDraftId, setActiveDraftId] = useState(1);
  const nextDraftIdRef = useRef(2);

  const [submitting, setSubmitting] = useState(false);
  const [saleError, setSaleError] = useState(null);

  // Receipt Modal state (supports single and batch)
  const [viewingBatchSales, setViewingBatchSales] = useState(null); // Array of sales
  const [batchReceiptIndex, setBatchReceiptIndex] = useState(0);

  // Active draft resolution
  const activeDraft = drafts.find(d => d.id === activeDraftId) || drafts[0] || createEmptyDraft(1, 'Sale 1');

  const updateActiveDraft = (updater) => {
    setDrafts(prev => prev.map(d => {
      if (d.id !== activeDraft.id) return d;
      return typeof updater === 'function' ? updater(d) : { ...d, ...updater };
    }));
  };

  // Active draft field getters & setters for existing UI compatibility
  const cart = activeDraft.cart;
  const paymentMethod = activeDraft.paymentMethod;
  const customerType = activeDraft.customerType;
  const selectedCustomerId = activeDraft.selectedCustomerId;
  const customerSearch = activeDraft.customerSearch;
  const newCustomer = activeDraft.newCustomer;
  const discountValue = activeDraft.discountValue;
  const taxValue = activeDraft.taxValue;
  const amountPaid = activeDraft.amountPaid;
  const cashNote = activeDraft.cashNote;

  const setCart = (action) => {
    updateActiveDraft(d => ({
      ...d,
      cart: typeof action === 'function' ? action(d.cart) : action
    }));
  };
  const setPaymentMethod = (val) => updateActiveDraft({ paymentMethod: val });
  const setCustomerType = (val) => updateActiveDraft({ customerType: val });
  const setSelectedCustomerId = (val) => updateActiveDraft({ selectedCustomerId: val });
  const setCustomerSearch = (val) => updateActiveDraft({ customerSearch: val });
  const setNewCustomer = (action) => {
    updateActiveDraft(d => ({
      ...d,
      newCustomer: typeof action === 'function' ? action(d.newCustomer) : action
    }));
  };
  const setDiscountValue = (val) => updateActiveDraft({ discountValue: val });
  const setTaxValue = (val) => updateActiveDraft({ taxValue: val });
  const setAmountPaid = (val) => updateActiveDraft({ amountPaid: val });
  const setCashNote = (val) => updateActiveDraft({ cashNote: val });

  // ── Stock Reservation across drafts ────────────────────────
  const getReservedInOtherDrafts = (productId) => {
    let reserved = 0;
    for (const d of drafts) {
      if (d.id === activeDraft.id) continue;
      const item = d.cart.find(i => i.product_id === productId);
      if (item) {
        reserved += (item.quantity || 0);
      }
    }
    return reserved;
  };

  const getAvailableStockForActive = (product) => {
    const reserved = getReservedInOtherDrafts(product.id);
    return Math.max(0, Number(product.stock || 0) - reserved);
  };

  // ── Barcode scanner state ────────────────────────────────
  const barcodeInputRef = useRef(null);
  const [barcodeValue, setBarcodeValue] = useState('');
  const [barcodeFlash, setBarcodeFlash] = useState(null); // 'success' | 'error' | null
  const [barcodeMsg, setBarcodeMsg] = useState('');
  const barcodeTimerRef = useRef(null);
  const barcodeLastKeyTime = useRef(0);

  // Auto-focus barcode input when the POS mounts
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // Global keydown listener: redirect keystrokes to barcode field
  useEffect(() => {
    const handleGlobalKey = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      const isOtherInput = ['input', 'textarea', 'select'].includes(tag) &&
        document.activeElement !== barcodeInputRef.current;
      if (isOtherInput) return;
      if (e.key === 'Tab' || e.key === 'Escape' || e.ctrlKey || e.altKey || e.metaKey) return;
      barcodeInputRef.current?.focus();
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  const flashBarcode = (type, msg) => {
    setBarcodeFlash(type);
    setBarcodeMsg(msg);
    clearTimeout(barcodeTimerRef.current);
    barcodeTimerRef.current = setTimeout(() => {
      setBarcodeFlash(null);
      setBarcodeMsg('');
      setBarcodeValue('');
    }, 2200);
  };

  const handleBarcodeScan = (rawValue) => {
    const code = rawValue.trim();
    if (!code) return;

    // Match against barcode field first, then SKU as fallback
    const product = products.find(
      p => (p.barcode && p.barcode.trim() === code) ||
        (p.sku && p.sku.trim().toLowerCase() === code.toLowerCase())
    );

    if (!product) {
      flashBarcode('error', `No product found for "${code}"`);
      return;
    }

    const availableStock = getAvailableStockForActive(product);
    if (availableStock <= 0) {
      const reserved = getReservedInOtherDrafts(product.id);
      if (reserved > 0) {
        flashBarcode('error', `"${product.name}" out of stock (${reserved} reserved in other sales)`);
      } else {
        flashBarcode('error', `"${product.name}" is out of stock`);
      }
      return;
    }

    const inActiveCart = cart.find(i => i.product_id === product.id)?.quantity || 0;
    if (inActiveCart >= availableStock) {
      flashBarcode('error', `Cannot add more "${product.name}" (${availableStock} max available)`);
      return;
    }

    addToCart(product);
    flashBarcode('success', `✓ Added: ${product.name}`);
  };

  const handleBarcodeKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBarcodeScan(barcodeValue);
      return;
    }
    const now = Date.now();
    barcodeLastKeyTime.current = now;
  };

  const inStockProducts = products.filter(p => Number(p.stock) > 0);

  const filtered = inStockProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === null || p.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product) => {
    const availableStock = getAvailableStockForActive(product);
    if (availableStock <= 0) return;

    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) {
        if (existing.quantity >= availableStock) return prev; // cap at available stock
        const effectivePrice = isPriceInvalid(existing) ? 0 : (existing.price ?? parseFloat(product.price) ?? 0);
        return prev.map(i => i.product_id === product.id
          ? { ...i, quantity: i.quantity + 1, maxStock: availableStock, subtotal: (i.quantity + 1) * effectivePrice }
          : i
        );
      }
      const initialPrice = parseFloat(product.price) || 0;
      return [...prev, {
        product_id: product.id,
        name: product.name,
        price: initialPrice,
        defaultPrice: initialPrice,
        priceInput: formatCurrencyInput(initialPrice),
        isInvalid: false,
        quantity: 1,
        subtotal: initialPrice,
        maxStock: availableStock,
      }];
    });
  };

  const updatePrice = (product_id, raw, formatted) => {
    const trimmed = (raw || '').trim();
    const isIncomplete = trimmed === '' || trimmed.endsWith('.');
    const numeric = isIncomplete ? null : parseCurrency(formatted);
    const isInvalid = isIncomplete || numeric === null || isNaN(numeric) || !isFinite(numeric) || numeric < 0;

    setCart(prev => prev.map(i => {
      if (i.product_id !== product_id) return i;
      return {
        ...i,
        price: isInvalid ? null : numeric,
        priceInput: formatted,
        isInvalid,
        subtotal: isInvalid ? 0 : i.quantity * numeric,
      };
    }));
  };

  const resetPrice = (product_id) => {
    setCart(prev => prev.map(i => {
      if (i.product_id !== product_id) return i;
      const def = i.defaultPrice ?? (parseFloat(i.price) || 0);
      return {
        ...i,
        price: def,
        priceInput: formatCurrencyInput(def),
        isInvalid: false,
        subtotal: i.quantity * def,
      };
    }));
  };

  const handlePriceBlur = (product_id) => {
    setCart(prev => prev.map(i => {
      if (i.product_id !== product_id) return i;
      if (!isPriceInvalid(i) && i.price !== null && !isNaN(i.price) && isFinite(i.price)) {
        return {
          ...i,
          priceInput: formatCurrencyInput(i.price),
        };
      }
      return i;
    }));
  };

  const updateQty = (product_id, qty) => {
    const n = parseInt(qty, 10);
    if (isNaN(n) || n < 1) return;
    const product = products.find(p => p.id === product_id);
    const availableStock = product ? getAvailableStockForActive(product) : 999999;
    setCart(prev => prev.map(i => {
      if (i.product_id !== product_id) return i;
      const effectivePrice = isPriceInvalid(i) ? 0 : (i.price ?? 0);
      const clampedQty = Math.min(n, availableStock);
      return {
        ...i,
        quantity: clampedQty,
        maxStock: availableStock,
        subtotal: clampedQty * effectivePrice,
      };
    }));
  };

  const removeFromCart = (product_id) => setCart(prev => prev.filter(i => i.product_id !== product_id));

  // ── Draft management handlers ─────────────────────────────
  const handleAddDraft = () => {
    if (drafts.length >= 200) {
      alert('Maximum 200 sales can be prepared in a batch.');
      return;
    }
    const newId = nextDraftIdRef.current++;
    const newDraft = createEmptyDraft(newId, `Sale ${drafts.length + 1}`);
    setDrafts(prev => [...prev, newDraft]);
    setActiveDraftId(newId);
  };

  const handleCloseDraft = (draftId, e) => {
    if (e) e.stopPropagation();
    if (drafts.length <= 1) {
      if (activeDraft.cart.length > 0) {
        if (window.confirm('Clear all items and details for this sale?')) {
          updateActiveDraft(createEmptyDraft(draftId, activeDraft.label));
        }
      }
      return;
    }
    const draftToClose = drafts.find(d => d.id === draftId);
    if (draftToClose && draftToClose.cart.length > 0) {
      if (!window.confirm(`"${draftToClose.label}" has ${draftToClose.cart.length} item(s). Are you sure you want to discard it?`)) {
        return;
      }
    }
    const remaining = drafts.filter(d => d.id !== draftId);
    setDrafts(remaining);
    if (activeDraftId === draftId) {
      setActiveDraftId(remaining[0].id);
    }
  };

  // ── Calculations for active draft ──────────────────────────
  const hasInvalidPrice = cart.some(isPriceInvalid);
  const cartSubtotal = cart.reduce((sum, i) => sum + (isPriceInvalid(i) ? 0 : i.subtotal), 0);
  const discountAmount = (() => {
    const v = parseCurrency(discountValue);
    return Math.min(v, cartSubtotal);
  })();
  const taxAmount = parseCurrency(taxValue);
  const cartTotal = cartSubtotal - discountAmount + taxAmount;
  const changeAmount = paymentMethod === 'cash'
    ? Math.max(0, parseCurrency(amountPaid) - cartTotal)
    : 0;

  // Multi-draft counts
  const validDrafts = drafts.filter(d => d.cart.length > 0);
  const totalDraftItems = drafts.reduce((sum, d) => sum + d.cart.reduce((s, i) => s + i.quantity, 0), 0);

  // ── Single Checkout ───────────────────────────────────────
  const handleCheckoutSingle = async () => {
    if (cart.length === 0) return;
    const invalidItem = cart.find(isPriceInvalid);
    if (invalidItem) {
      setSaleError(`Please enter a valid price for "${invalidItem.name}" before completing the sale.`);
      return;
    }
    setSubmitting(true);
    setSaleError(null);
    try {
      const res = await fetch(`${API}/sales`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          payment_method: paymentMethod,
          items: cart.map(i => ({ product_id: i.product_id, quantity: i.quantity, price: parseFloat(i.price) })),
          customer_type: customerType,
          ...(customerType === 'existing' && selectedCustomerId ? { customer_id: parseInt(selectedCustomerId) } : {}),
          ...(customerType === 'new' ? { new_customer: newCustomer } : {}),
          discount_type: discountAmount > 0 ? 'fixed' : null,
          discount_amount: discountAmount > 0 ? discountAmount : null,
          tax_amount: taxAmount > 0 ? taxAmount : null,
          notes: cashNote || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaleError(data?.message || 'Checkout failed.');
        return;
      }
      const saleWithDetails = data.data;

      // Show receipt modal
      setViewingBatchSales([saleWithDetails]);
      setBatchReceiptIndex(0);
      onSaleCompleted(saleWithDetails);

      // Remove completed draft if other drafts exist; otherwise reset
      if (drafts.length > 1) {
        const remaining = drafts.filter(d => d.id !== activeDraft.id);
        setDrafts(remaining);
        setActiveDraftId(remaining[0].id);
      } else {
        setDrafts([createEmptyDraft(activeDraft.id, activeDraft.label)]);
      }
    } catch {
      setSaleError('Network error. Check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Batch Checkout (All Valid Drafts) ──────────────────────
  const handleCheckoutBatch = async () => {
    if (validDrafts.length === 0) {
      setSaleError('No sales have items in their cart to submit.');
      return;
    }
    if (validDrafts.length > 200) {
      setSaleError('Cannot submit more than 200 sales in one batch.');
      return;
    }

    // Verify all drafts have valid prices
    for (const draft of validDrafts) {
      const invalidItem = draft.cart.find(isPriceInvalid);
      if (invalidItem) {
        setSaleError(`Sale "${draft.label}": Please enter a valid price for "${invalidItem.name}".`);
        setActiveDraftId(draft.id);
        return;
      }
    }

    setSubmitting(true);
    setSaleError(null);

    // Generate Idempotency Key
    const idempotencyKey = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : 'bulk-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);

    const payload = {
      idempotency_key: idempotencyKey,
      sales: validDrafts.map(draft => {
        const dSubtotal = draft.cart.reduce((sum, i) => sum + (isPriceInvalid(i) ? 0 : i.subtotal), 0);
        const dDiscountAmount = Math.min(parseCurrency(draft.discountValue), dSubtotal);
        const dTaxAmount = parseCurrency(draft.taxValue);
        return {
          payment_method: draft.paymentMethod,
          items: draft.cart.map(i => ({
            product_id: i.product_id,
            quantity: i.quantity,
            price: parseFloat(i.price),
          })),
          customer_type: draft.customerType,
          ...(draft.customerType === 'existing' && draft.selectedCustomerId ? { customer_id: parseInt(draft.selectedCustomerId) } : {}),
          ...(draft.customerType === 'new' ? { new_customer: draft.newCustomer } : {}),
          discount_type: dDiscountAmount > 0 ? 'fixed' : null,
          discount_amount: dDiscountAmount > 0 ? dDiscountAmount : null,
          tax_amount: dTaxAmount > 0 ? dTaxAmount : null,
          notes: draft.cashNote || null,
        };
      })
    };

    try {
      const res = await fetch(`${API}/sales/bulk`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setSaleError(data?.message || 'Batch checkout failed.');
        return;
      }

      const returnedSales = data.data || [];
      setViewingBatchSales(returnedSales);
      setBatchReceiptIndex(0);
      onSaleCompleted(returnedSales);

      // Reset drafts to a single fresh draft
      const freshDraft = createEmptyDraft(1, 'Sale 1');
      setDrafts([freshDraft]);
      setActiveDraftId(1);
      nextDraftIdRef.current = 2;
    } catch {
      setSaleError('Network error during batch checkout. No changes were committed.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Print helper for batch receipts ────────────────────────
  const printBatchReceipts = (salesToPrint) => {
    if (!salesToPrint || salesToPrint.length === 0) return;
    const container = document.getElementById('batch-all-receipts-container');
    if (!container) {
      alert('Receipts content not ready for printing.');
      return;
    }

    const win = window.open('', '_blank', 'width=800,height=900');
    if (!win) {
      alert('Pop-up blocked. Please allow pop-ups for this site.');
      return;
    }

    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Batch Receipts (${salesToPrint.length})</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: 'Inter', 'Segoe UI', Arial, sans-serif; 
      background: #fff; 
      color: #000; 
      padding: 32px; 
      font-size: 14px; 
      max-width: 800px;
      margin: 0 auto;
    }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px 10px; }
    img { max-width: 100%; height: auto; }
    
    .batch-receipt-page {
      page-break-after: always;
      break-after: page;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px dashed #cbd5e1;
    }
    .batch-receipt-page:last-child {
      page-break-after: avoid;
      break-after: avoid;
      margin-bottom: 0;
      border-bottom: none;
    }
    
    @media print {
      body { padding: 20px; }
      button { display: none !important; }
      .batch-receipt-page {
        page-break-after: always;
        break-after: page;
        margin-bottom: 0;
        padding-bottom: 0;
        border-bottom: none;
      }
      .batch-receipt-page:last-child {
        page-break-after: avoid;
        break-after: avoid;
      }
      @page { 
        margin: 0.5in;
        size: A4;
      }
    }
  </style>
</head>
<body>${container.innerHTML}</body>
</html>`);
    win.document.close();
    win.addEventListener('load', () => {
      setTimeout(() => {
        win.focus();
        win.print();
      }, 500);
    });
  };

  const currentModalSale = viewingBatchSales && viewingBatchSales[batchReceiptIndex];

  return (
    <div style={styles.pageContainer}>
      {/* Header */}
      <div className="section-hero" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        borderRadius: 16, padding: '24px 32px', marginBottom: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 24px rgba(15,23,42,0.14)',
      }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sales</p>
          <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.3px' }}>Point of Sale</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
            Build carts for one or multiple independent sales, and checkout individually or in an atomic batch (up to 200).
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            {drafts.length > 1 ? `Active / Total Items (${drafts.length} Sales)` : 'Items in cart'}
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#f8fafc' }}>
            {cart.reduce((s, i) => s + i.quantity, 0)}
            {drafts.length > 1 && (
              <span style={{ fontSize: 16, fontWeight: 500, color: '#94a3b8', marginLeft: 8 }}>
                / {totalDraftItems} total
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="pos-layout">

        {/* Left column — product search & grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* ── Barcode scanner input ── */}
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                📷 Barcode Scanner
              </span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>— scan barcode to add directly to {activeDraft.label}</span>
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeValue}
                onChange={e => setBarcodeValue(e.target.value)}
                onKeyDown={handleBarcodeKeyDown}
                placeholder="Scan barcode or type SKU…"
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 42px',
                  border: `2px solid ${barcodeFlash === 'success' ? '#16a34a' : barcodeFlash === 'error' ? '#dc2626' : '#e2e8f0'}`,
                  borderRadius: 10,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  outline: 'none',
                  background: barcodeFlash === 'success' ? '#f0fdf4' : barcodeFlash === 'error' ? '#fef2f2' : '#fff',
                  color: '#0f172a',
                  transition: 'border-color 0.2s, background 0.2s',
                  letterSpacing: '0.03em',
                }}
              />
              <svg style={{ position: 'absolute', left: 12, pointerEvents: 'none', opacity: 0.4 }}
                width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 5v14M7 5v14M11 5v14M15 5v10M19 5v14M15 18v1" />
              </svg>
            </div>
            {barcodeFlash && (
              <div style={{
                marginTop: 6, padding: '7px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: barcodeFlash === 'success' ? '#dcfce7' : '#fee2e2',
                color: barcodeFlash === 'success' ? '#15803d' : '#b91c1c',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {barcodeFlash === 'success' ? '✓' : '✕'} {barcodeMsg}
              </div>
            )}
          </div>

          {/* ── Name / SKU search ── */}
          <input
            style={posS.searchInput}
            placeholder="Search products by name or SKU…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          {/* Category filter pills */}
          {categories && categories.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <button
                style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', border: '1.5px solid',
                  borderColor: selectedCategory === null ? '#16a34a' : '#e2e8f0',
                  background: selectedCategory === null ? '#f0fdf4' : '#fff',
                  color: selectedCategory === null ? '#16a34a' : '#64748b',
                  transition: 'all 0.15s',
                }}
                onClick={() => setSelectedCategory(null)}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', border: '1.5px solid',
                    borderColor: selectedCategory === cat.id ? '#16a34a' : '#e2e8f0',
                    background: selectedCategory === cat.id ? '#f0fdf4' : '#fff',
                    color: selectedCategory === cat.id ? '#16a34a' : '#64748b',
                    transition: 'all 0.15s',
                  }}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
              <div style={{ fontSize: 36 }}>📦</div>
              <div style={{ marginTop: 8 }}>
                {search || selectedCategory
                  ? 'No products match your filters'
                  : 'No products in stock'}
              </div>
            </div>
          ) : (
            <div className="pos-product-grid">
              {filtered.map(p => {
                const reserved = getReservedInOtherDrafts(p.id);
                const available = Math.max(0, Number(p.stock || 0) - reserved);
                const isOutOfStock = available <= 0;

                return (
                  <button
                    key={p.id}
                    style={{
                      ...posS.productCard,
                      opacity: isOutOfStock ? 0.6 : 1,
                      cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                    }}
                    onClick={() => !isOutOfStock && addToCart(p)}
                    disabled={isOutOfStock}
                    onMouseEnter={e => {
                      if (!isOutOfStock) {
                        e.currentTarget.style.borderColor = '#4f46e5';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(79,70,229,0.12)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isOutOfStock) {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                      }
                    }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, fontSize: 15, fontWeight: 700, color: '#4f46e5' }}>
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={posS.productName}>{p.name}</div>
                    {p.sku && <div style={posS.productSku}>SKU: {p.sku}</div>}
                    <div style={posS.productPrice}>UGX {parseFloat(p.price).toLocaleString()}</div>
                    <div style={{
                      marginTop: 6, fontSize: 11, padding: '2px 8px', borderRadius: 20,
                      background: isOutOfStock ? '#fef2f2' : reserved > 0 ? '#eff6ff' : '#f0fdf4',
                      color: isOutOfStock ? '#dc2626' : reserved > 0 ? '#2563eb' : '#16a34a',
                      fontWeight: 600,
                      textAlign: 'center',
                    }}>
                      {isOutOfStock
                        ? (reserved > 0 ? `0 available (${reserved} in other sales)` : 'Out of stock')
                        : reserved > 0
                          ? `${available} avail (${reserved} in other sales)`
                          : `${available} in stock`}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column — Drafts Tabs + Customer + Cart */}
        <div className="pos-cart-sticky" style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 20 }}>

          {/* ── Multi-Sale Drafts Tabs ── */}
          <div style={{
            background: '#ffffff',
            borderRadius: 12,
            border: '1.5px solid #e2e8f0',
            padding: '10px 12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Sales Queue</span>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 12,
                  background: '#f1f5f9', color: '#475569'
                }}>
                  {drafts.length} / 200
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddDraft}
                disabled={drafts.length >= 200 || submitting}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: '1px solid #c7d2fe',
                  background: drafts.length >= 200 ? '#f1f5f9' : '#eff6ff',
                  color: drafts.length >= 200 ? '#94a3b8' : '#3730a3',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: drafts.length >= 200 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                + New Sale
              </button>
            </div>

            <div style={{
              display: 'flex',
              gap: 6,
              overflowX: 'auto',
              paddingBottom: 4,
              scrollbarWidth: 'thin',
            }}>
              {drafts.map((draft, idx) => {
                const isActive = draft.id === activeDraft.id;
                const draftItemCount = draft.cart.reduce((s, i) => s + i.quantity, 0);

                return (
                  <div
                    key={draft.id}
                    onClick={() => setActiveDraftId(draft.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 10px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      border: `1.5px solid ${isActive ? '#4f46e5' : '#e2e8f0'}`,
                      background: isActive ? '#f5f3ff' : '#f8fafc',
                      color: isActive ? '#4338ca' : '#475569',
                      fontSize: 12,
                      fontWeight: isActive ? 700 : 500,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{draft.label || `Sale ${idx + 1}`}</span>
                    <span style={{
                      padding: '1px 6px',
                      borderRadius: 10,
                      fontSize: 10,
                      fontWeight: 700,
                      background: isActive ? '#4f46e5' : '#e2e8f0',
                      color: isActive ? '#ffffff' : '#475569',
                    }}>
                      {draftItemCount}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleCloseDraft(draft.id, e)}
                      title={drafts.length > 1 ? "Close and discard this sale" : "Clear this sale"}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: isActive ? '#6366f1' : '#94a3b8',
                        cursor: 'pointer',
                        padding: '0 2px',
                        fontSize: 12,
                        lineHeight: 1,
                        marginLeft: 2,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customer Card */}
          <div style={posS.cartPanel}>
            <div style={posS.cartHeader}>
              <div>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Customer</span>
                <span style={{ marginLeft: 6, fontSize: 11, color: '#94a3b8', fontWeight: 400 }}>Optional ({activeDraft.label})</span>
              </div>
            </div>
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { value: 'walk_in', label: 'Walk-in Customer' },
                { value: 'existing', label: 'Existing Customer' },
                { value: 'new', label: 'New Customer' },
              ].map(type => (
                <label key={type.value} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                  border: `1.5px solid ${customerType === type.value ? '#4f46e5' : '#e2e8f0'}`,
                  background: customerType === type.value ? '#f5f3ff' : '#fff',
                  transition: 'all 0.15s',
                }}>
                  <input type="radio" name={`customerType-${activeDraft.id}`} value={type.value}
                    checked={customerType === type.value}
                    onChange={() => { setCustomerType(type.value); setSelectedCustomerId(''); setCustomerSearch(''); setNewCustomer({ name: '', phone: '', email: '' }); }}
                    style={{ accentColor: '#4f46e5', width: 15, height: 15 }} />
                  <span style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{type.label}</span>
                </label>
              ))}

              {customerType === 'existing' && (
                <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <input style={posS.searchInput} placeholder="Search by name or phone…"
                    value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} />
                  <select style={posS.select} value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)}>
                    <option value="">— Select customer —</option>
                    {(customers || []).filter(c => c.status === 'active' && (!customerSearch || c.name.toLowerCase().includes(customerSearch.toLowerCase()) || (c.phone || '').includes(customerSearch)))
                      .map(c => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ''}</option>)}
                  </select>
                </div>
              )}

              {customerType === 'new' && (
                <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input style={posS.searchInput} placeholder="Full name *" value={newCustomer.name} onChange={e => setNewCustomer(p => ({ ...p, name: e.target.value }))} />
                  <input style={posS.searchInput} placeholder="Phone" value={newCustomer.phone} onChange={e => setNewCustomer(p => ({ ...p, phone: e.target.value }))} />
                  <input style={posS.searchInput} placeholder="Email" type="email" value={newCustomer.email} onChange={e => setNewCustomer(p => ({ ...p, email: e.target.value }))} />
                </div>
              )}
            </div>
          </div>

          {/* Cart Card */}
          <div style={posS.cartPanel}>
            <div style={posS.cartHeader}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>
                Cart: {activeDraft.label} {cart.length > 0 && <span style={{ marginLeft: 6, padding: '1px 8px', borderRadius: 20, background: '#ede9fe', color: '#4f46e5', fontSize: 12 }}>{cart.length}</span>}
              </span>
              {cart.length > 0 && <button style={posS.clearBtn} onClick={() => setCart([])}>Clear all</button>}
            </div>

            {cart.length === 0 ? (
              <div style={posS.emptyCart}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                </div>
                <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>Select products to add to {activeDraft.label}</div>
              </div>
            ) : (
              <div style={posS.cartItems}>
                {cart.map(item => (
                  <div key={item.product_id} style={posS.cartItem}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={posS.cartItemName}>{item.name}</div>
                      <CartPriceInput
                        item={item}
                        updatePrice={updatePrice}
                        resetPrice={resetPrice}
                        onBlurPrice={handlePriceBlur}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <button style={posS.qtyBtn} onClick={() => updateQty(item.product_id, item.quantity - 1)}>−</button>
                      <input style={posS.qtyInput} type="number" min={1} max={item.maxStock}
                        value={item.quantity} onChange={e => updateQty(item.product_id, e.target.value)} />
                      <button style={posS.qtyBtn} onClick={() => updateQty(item.product_id, item.quantity + 1)}>+</button>
                      <button style={posS.removeBtn} onClick={() => removeFromCart(item.product_id)}>✕</button>
                    </div>
                    <div style={{
                      ...posS.cartItemSubtotal,
                      color: isPriceInvalid(item) ? '#ef4444' : '#0f172a',
                    }}>
                      {isPriceInvalid(item) ? 'UGX —' : `UGX ${item.subtotal.toLocaleString()}`}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={posS.cartFooter}>
              {/* Subtotal row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b', marginBottom: 8 }}>
                <span>Subtotal:</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>UGX {cartSubtotal.toLocaleString()}</span>
              </div>

              {/* Discount */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>Discount:</span>
                <input
                  style={posS.discountInput}
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={discountValue}
                  onChange={e => setDiscountValue(formatCurrencyInput(e.target.value))}
                />
              </div>

              {/* Tax */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>Tax:</span>
                <input
                  style={posS.discountInput}
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={taxValue}
                  onChange={e => setTaxValue(formatCurrencyInput(e.target.value))}
                />
              </div>

              {/* Total row */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12, paddingTop: 10, borderTop: '1px dashed #e2e8f0' }}>
                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#dc2626' }}>
                    <span>Discount applied</span>
                    <span>− UGX {discountAmount.toLocaleString()}</span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#16a34a' }}>
                    <span>Tax</span>
                    <span>+ UGX {taxAmount.toLocaleString()}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 18 }}>Total</span>
                  <span style={{ fontWeight: 700, fontSize: 20, color: '#0f172a' }}>UGX {cartTotal.toLocaleString()}</span>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={posS.label}>Payment Method</label>
                <select style={posS.select} value={paymentMethod} onChange={e => { setPaymentMethod(e.target.value); setAmountPaid(''); setCashNote(''); }}>
                  <option value="cash">💵 Cash</option>
                  <option value="card">💳 Card</option>
                  <option value="mobile_money">📱 Mobile Money</option>
                  <option value="bank_transfer">🏦 Bank Transfer</option>
                </select>
              </div>

              {/* Cash payment panel */}
              {paymentMethod === 'cash' && (
                <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '14px 16px', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                    💵 Payment (Cash)
                  </div>

                  {/* Amount Paid */}
                  <div>
                    <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 4 }}>Amount Paid</label>
                    <input
                      style={{ ...posS.searchInput, textAlign: 'right', fontWeight: 700, fontSize: 16 }}
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={amountPaid}
                      onChange={e => setAmountPaid(formatCurrencyInput(e.target.value))}
                    />
                  </div>

                  {/* Exact Amount shortcut */}
                  <button
                    style={{
                      width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #bfdbfe',
                      background: '#eff6ff', color: '#1d4ed8', fontWeight: 600, fontSize: 13,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                    onClick={() => setAmountPaid(formatCurrencyInput(cartTotal.toString()))}
                  >
                    ≡ Exact Amount
                  </button>

                  {/* Change */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 10, padding: '10px 14px',
                  }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Change:</span>
                    <span style={{ fontWeight: 700, fontSize: 16, color: parseCurrency(amountPaid) < cartTotal ? '#dc2626' : '#16a34a' }}>
                      UGX {changeAmount.toLocaleString()}
                    </span>
                  </div>

                  {/* Underpayment warning */}
                  {amountPaid !== '' && parseCurrency(amountPaid) < cartTotal && (
                    <div style={{ fontSize: 12, color: '#dc2626', fontWeight: 600 }}>
                      ⚠️ Amount paid is less than total by UGX {(cartTotal - parseCurrency(amountPaid)).toLocaleString()}
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 4 }}>Notes (Optional)</label>
                    <textarea
                      style={{ ...posS.searchInput, resize: 'vertical', minHeight: 64, fontFamily: 'inherit' }}
                      placeholder="Add any notes for this sale…"
                      value={cashNote}
                      onChange={e => setCashNote(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Notes for non-cash payment methods */}
              {paymentMethod !== 'cash' && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 4 }}>Notes (Optional)</label>
                  <textarea
                    style={{ ...posS.searchInput, resize: 'vertical', minHeight: 60, fontFamily: 'inherit' }}
                    placeholder="Add reference or transaction notes…"
                    value={cashNote}
                    onChange={e => setCashNote(e.target.value)}
                  />
                </div>
              )}

              {saleError && (
                <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13, marginBottom: 12 }}>
                  {saleError}
                </div>
              )}

              {/* ── Dual Checkout Action Buttons ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Button 1: Complete Current Sale */}
                <button
                  type="button"
                  onClick={handleCheckoutSingle}
                  disabled={cart.length === 0 || submitting || !canSell || hasInvalidPrice}
                  style={{
                    width: '100%', padding: '13px', borderRadius: 10, border: 'none',
                    background: (cart.length === 0 || !canSell || hasInvalidPrice) ? '#e2e8f0' : '#be123c',
                    color: (cart.length === 0 || !canSell || hasInvalidPrice) ? '#94a3b8' : '#fff',
                    fontSize: 14, fontWeight: 700, cursor: (cart.length === 0 || !canSell || hasInvalidPrice) ? 'not-allowed' : 'pointer',
                    transition: 'background 0.15s', letterSpacing: '0.02em',
                  }}
                  onMouseEnter={e => { if (cart.length > 0 && !submitting && canSell && !hasInvalidPrice) e.currentTarget.style.background = '#881337'; }}
                  onMouseLeave={e => { if (cart.length > 0 && !submitting && canSell && !hasInvalidPrice) e.currentTarget.style.background = '#be123c'; }}
                >
                  {!canSell
                    ? 'No permission to sell'
                    : hasInvalidPrice
                      ? 'Fix invalid item price'
                      : submitting
                        ? 'Processing…'
                        : drafts.length > 1
                          ? `Complete Current Sale (${activeDraft.label})`
                          : 'Complete Sale'}
                </button>

                {/* Button 2: Complete All Sales (Batch) - shown when multiple drafts exist */}
                {drafts.length > 1 && (
                  <button
                    type="button"
                    onClick={handleCheckoutBatch}
                    disabled={validDrafts.length === 0 || submitting || !canSell}
                    style={{
                      width: '100%', padding: '13px', borderRadius: 10, border: 'none',
                      background: (validDrafts.length === 0 || submitting || !canSell) ? '#e2e8f0' : '#4f46e5',
                      color: (validDrafts.length === 0 || submitting || !canSell) ? '#94a3b8' : '#fff',
                      fontSize: 14, fontWeight: 700, cursor: (validDrafts.length === 0 || submitting || !canSell) ? 'not-allowed' : 'pointer',
                      transition: 'background 0.15s', letterSpacing: '0.02em',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                    onMouseEnter={e => { if (validDrafts.length > 0 && !submitting && canSell) e.currentTarget.style.background = '#4338ca'; }}
                    onMouseLeave={e => { if (validDrafts.length > 0 && !submitting && canSell) e.currentTarget.style.background = '#4f46e5'; }}
                  >
                    <span>⚡ Complete All Sales ({validDrafts.length} in 1 Batch)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Hidden container for printing all batch receipts ── */}
      {viewingBatchSales && viewingBatchSales.length > 0 && (
        <div style={{ display: 'none' }}>
          <div id="batch-all-receipts-container">
            {viewingBatchSales.map((sale, idx) => (
              <div key={sale.id || idx} className="batch-receipt-page">
                <SaleReceipt sale={sale} user={user} elementId={`batch-receipt-item-${idx}`} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Receipt Modal (Single & Batch Carousel) ── */}
      {currentModalSale && (
        <Modal
          isOpen={true}
          onClose={() => setViewingBatchSales(null)}
          title=""
          size="md"
          footer={
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
              {/* Stepper controls if multiple receipts exist */}
              {viewingBatchSales.length > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#f8fafc',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                }}>
                  <button
                    type="button"
                    onClick={() => setBatchReceiptIndex(prev => Math.max(0, prev - 1))}
                    disabled={batchReceiptIndex === 0}
                    style={{
                      padding: '5px 12px', borderRadius: 6, border: '1px solid #cbd5e1',
                      background: batchReceiptIndex === 0 ? '#f1f5f9' : '#ffffff',
                      color: batchReceiptIndex === 0 ? '#94a3b8' : '#0f172a',
                      fontSize: 12, fontWeight: 600, cursor: batchReceiptIndex === 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    ← Previous
                  </button>

                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                    Receipt {batchReceiptIndex + 1} of {viewingBatchSales.length}
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#64748b', marginLeft: 6 }}>
                      (Sale #{currentModalSale.id})
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setBatchReceiptIndex(prev => Math.min(viewingBatchSales.length - 1, prev + 1))}
                    disabled={batchReceiptIndex === viewingBatchSales.length - 1}
                    style={{
                      padding: '5px 12px', borderRadius: 6, border: '1px solid #cbd5e1',
                      background: batchReceiptIndex === viewingBatchSales.length - 1 ? '#f1f5f9' : '#ffffff',
                      color: batchReceiptIndex === viewingBatchSales.length - 1 ? '#94a3b8' : '#0f172a',
                      fontSize: 12, fontWeight: 600, cursor: batchReceiptIndex === viewingBatchSales.length - 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Next →
                  </button>
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 10, width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 22 }}>✓</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#be123c' }}>
                    {viewingBatchSales.length > 1
                      ? `Batch of ${viewingBatchSales.length} Sales Completed!`
                      : 'Sale Completed Successfully!'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <Button variant="secondary" onClick={() => setViewingBatchSales(null)}>
                    Close
                  </Button>

                  {/* Print Active Receipt */}
                  <Button
                    variant="success"
                    style={{ background: '#be123c', borderColor: '#be123c' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#881337'}
                    onMouseLeave={e => e.currentTarget.style.background = '#be123c'}
                    onClick={() => {
                      const src = document.getElementById('pos-receipt-content');
                      if (!src) {
                        alert('Receipt content not found. Please try again.');
                        return;
                      }
                      const win = window.open('', '_blank', 'width=800,height=900');
                      if (!win) {
                        alert('Pop-up blocked. Please allow pop-ups for this site.');
                        return;
                      }
                      win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Receipt - ${currentModalSale?.id || 'RECEIPT'}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: 'Inter', 'Segoe UI', Arial, sans-serif; 
      background: #fff; 
      color: #000; 
      padding: 32px; 
      font-size: 14px; 
      max-width: 800px;
      margin: 0 auto;
    }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px 10px; }
    img { max-width: 100%; height: auto; }
    
    @media print {
      body { padding: 20px; }
      button { display: none !important; }
      @page { 
        margin: 0.5in;
        size: A4;
      }
    }
    @media screen {
      body {
        box-shadow: 0 0 20px rgba(0,0,0,0.1);
        margin: 20px auto;
      }
    }
  </style>
</head>
<body>${src.innerHTML}</body>
</html>`);
                      win.document.close();
                      win.addEventListener('load', () => {
                        setTimeout(() => {
                          win.focus();
                          win.print();
                        }, 500);
                      });
                    }}
                  >
                    🖨️ {viewingBatchSales.length > 1 ? `Print This (#${currentModalSale.id})` : 'Print / Save PDF'}
                  </Button>

                  {/* Print All Receipts (when batch > 1) */}
                  {viewingBatchSales.length > 1 && (
                    <Button
                      variant="primary"
                      style={{ background: '#4f46e5', borderColor: '#4f46e5' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#4338ca'}
                      onMouseLeave={e => e.currentTarget.style.background = '#4f46e5'}
                      onClick={() => printBatchReceipts(viewingBatchSales)}
                    >
                      📑 Print All ({viewingBatchSales.length})
                    </Button>
                  )}
                </div>
              </div>
            </div>
          }
        >
          <SaleReceipt sale={currentModalSale} user={user} elementId="pos-receipt-content" />
        </Modal>
      )}
    </div>
  );
}

export default POSTab;
export { POSTab };
