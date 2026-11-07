import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../components/ui/Modal';
import styles from '../styles/dashboardStyles';
import { formatCurrencyInput, parseCurrency } from '../utils/currency';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// ══════════════════════════════════════════════════════════════════════════
// PRINTABLE QUOTATION MODAL (Screen preview + PDF export / Browser Print)
// ══════════════════════════════════════════════════════════════════════════
function PrintableQuotationModal({ quotation, user, onClose, onConvertToInvoice }) {
  if (!quotation) return null;

  const handlePrint = () => {
    window.print();
  };

  const tenant = user?.tenant || quotation?.tenant || {};
  const businessName    = tenant.name    || user?.name  || 'Smart Trendz';
  const businessPhone   = tenant.phone   || user?.phone || '0776 293691';
  const businessEmail   = tenant.email   || user?.email || '';
  const businessAddress = tenant.address || 'Shop 311, Level 3, Kooki Tower Opp. City Square';
  const logoUrl         = tenant.logo_url || '';

  const items = quotation.items || [];
  const subtotal = quotation.subtotal != null
    ? parseFloat(quotation.subtotal)
    : items.reduce((s, i) => s + (parseFloat(i.subtotal) || (parseFloat(i.price || 0) * parseFloat(i.quantity || 1))), 0);
  const discount = parseFloat(quotation.discount_amount || 0);
  const tax      = parseFloat(quotation.tax_amount || 0);
  const total    = parseFloat(quotation.total_amount || (subtotal - discount + tax));

  const fmtDate = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    const utc = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    return utc.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  };

  const quoteNumber = quotation.quotation_number || `QT/26-27/${String(quotation.id || '0001').padStart(4, '0')}`;
  const quoteDate   = fmtDate(quotation.quotation_date || quotation.created_at);
  const validUntil  = fmtDate(quotation.valid_until);
  const customerName    = quotation.customer_name || quotation.customer?.name || 'Valued Customer';
  const customerPhone   = quotation.customer_phone || quotation.customer?.phone || '';
  const customerEmail   = quotation.customer_email || quotation.customer?.email || '';
  const customerAddress = quotation.customer_address || quotation.customer?.address || '';
  const status          = quotation.status || 'pending';

  // Export quotation to CSV
  const handleExportCSV = () => {
    const quoteData = items.map((item, idx) => ({
      no: idx + 1,
      item: item.description || item.name || `Item ${idx + 1}`,
      quantity: item.quantity || 1,
      unit_price: item.price || 0,
      subtotal: item.subtotal || (item.price * item.quantity),
    }));

    const csvHeader = ['#', 'Item Description', 'Quantity', 'Unit Price (UGX)', 'Subtotal (UGX)'].join(',');
    const csvRows = quoteData.map(r =>
      `"${r.no}","${r.item}",${r.quantity},${r.unit_price},${r.subtotal}`
    );

    csvRows.push('');
    csvRows.push(`"Subtotal",,,,"${subtotal}"`);
    if (discount > 0) csvRows.push(`"Discount",,,,"-${discount}"`);
    if (tax > 0) csvRows.push(`"Tax",,,,"${tax}"`);
    csvRows.push(`"Grand Total",,,,"${total}"`);

    const csvContent = [
      `Quotation: ${quoteNumber}`,
      `Customer: ${customerName}`,
      `Date Issued: ${quoteDate}`,
      `Valid Until: ${validUntil}`,
      `Status: ${status.toUpperCase()}`,
      '',
      csvHeader,
      ...csvRows,
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `quotation_${quoteNumber.replace(/[\\]/g, '_').replace(/\//g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="" size="xl" className="invoice-modal">
      {/* ── Screen Action Bar (Hidden on print) ── */}
      <div className="no-print" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid #e2e8f0',
        flexWrap: 'wrap', gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 8, background: '#eff6ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>
            📋
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{quoteNumber}</p>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Quote for {customerName}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              padding: '9px 16px', borderRadius: 7, border: 'none', background: '#16a34a',
              color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(22,163,74,0.25)',
            }}
          >
            📥 Export CSV
          </button>

          <button
            type="button"
            onClick={handlePrint}
            style={{
              padding: '9px 18px', borderRadius: 7, border: 'none', background: '#0f172a',
              color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(15,23,42,0.25)',
            }}
          >
            🖨️ Export PDF / Print
          </button>

          {status !== 'converted' && onConvertToInvoice && (
            <button
              type="button"
              onClick={() => onConvertToInvoice(quotation)}
              style={{
                padding: '9px 16px', borderRadius: 7, border: 'none', background: '#2563eb',
                color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
              }}
            >
              ⚡ Convert to Invoice
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 16px', borderRadius: 7, border: '1px solid #cbd5e1',
              background: '#fff', color: '#475569', fontWeight: 600, fontSize: 13, cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          PRINTABLE QUOTATION BODY
          ══════════════════════════════════════════════ */}
      <div id="printable-quotation" style={{
        background: '#ffffff',
        padding: '36px 44px 32px',
        fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
        color: '#0f172a',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative corner accent */}
        <div style={{
          position: 'absolute', top: -70, right: -70,
          width: 220, height: 220, borderRadius: '50%',
          background: 'rgba(37,99,235,0.05)', pointerEvents: 'none',
        }} />

        {/* ── HEADER: Business info left · Document details right ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 20 }}>
          {/* Company branding */}
          <div style={{ flex: 1 }}>
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" style={{ maxHeight: 48, maxWidth: 160, marginBottom: 8, objectFit: 'contain' }} />
            ) : null}
            <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.3px', textTransform: 'uppercase' }}>
              {businessName}
            </h2>
            <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
              {businessAddress && <div>{businessAddress}</div>}
              {businessPhone && <div>Tel: <span style={{ fontWeight: 600 }}>{businessPhone}</span></div>}
              {businessEmail && <div>Email: {businessEmail}</div>}
            </div>
          </div>

          {/* Quotation title & number */}
          <div style={{ textAlign: 'right' }}>
            <div style={{
              display: 'inline-block', background: '#0f172a', color: '#ffffff',
              padding: '6px 16px', borderRadius: 6, fontSize: 18, fontWeight: 900,
              letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6,
            }}>
              QUOTATION
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#2563eb', marginBottom: 4 }}>
              {quoteNumber}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>
              Official Price Estimate
            </div>
            <div style={{ marginTop: 6 }}>
              <span style={{
                display: 'inline-block',
                padding: '2px 10px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                background: status === 'accepted' ? '#dcfce7' : status === 'declined' ? '#fee2e2' : status === 'converted' ? '#dbeafe' : '#fef3c7',
                color: status === 'accepted' ? '#166534' : status === 'declined' ? '#991b1b' : status === 'converted' ? '#1e40af' : '#92400e',
              }}>
                ● {status}
              </span>
            </div>
          </div>
        </div>

        {/* ── CLIENT & QUOTATION META CARD ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1.2fr 0.8fr',
          border: '1.5px solid #cbd5e1', borderRadius: 10,
          overflow: 'hidden', marginBottom: 22,
        }}>
          {/* Customer box */}
          <div style={{ padding: '14px 18px', borderRight: '1.5px solid #cbd5e1', background: '#f8fafc' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              Quotation Prepared For
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
              {customerName}
            </div>
            <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
              {customerPhone && <div>Phone: {customerPhone}</div>}
              {customerEmail && <div>Email: {customerEmail}</div>}
              {customerAddress && <div>Address: {customerAddress}</div>}
            </div>
          </div>

          {/* Dates & Reference */}
          <div style={{ padding: '14px 18px', background: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Date Issued:</span>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>{quoteDate}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Valid Until:</span>
              <span style={{ fontWeight: 700, color: quotation.valid_until && new Date(quotation.valid_until) < new Date() ? '#dc2626' : '#0f172a' }}>
                {validUntil}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Prepared By:</span>
              <span style={{ fontWeight: 600, color: '#475569' }}>{quotation.user?.name || user?.name || 'Sales Officer'}</span>
            </div>
          </div>
        </div>

        {/* ── LINE ITEMS TABLE ── */}
        <div style={{ border: '1.5px solid #cbd5e1', borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0f172a', color: '#ffffff' }}>
                <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: 11, fontWeight: 800, width: 44, textTransform: 'uppercase', letterSpacing: '0.05em' }}>#</th>
                <th style={{ padding: '10px 14px', textAlign: 'left',   fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Item Description</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', width: 90 }}>Qty</th>
                <th style={{ padding: '10px 14px', textAlign: 'right',  fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', width: 140 }}>Unit Price</th>
                <th style={{ padding: '10px 14px', textAlign: 'right',  fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', width: 150 }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '24px 18px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No items added</td>
                </tr>
              ) : items.map((item, idx) => {
                const desc  = item.description || item.name || `Item #${idx + 1}`;
                const qty   = parseFloat(item.quantity || 1);
                const price = parseFloat(item.price || 0);
                const amt   = parseFloat(item.subtotal != null ? item.subtotal : qty * price);
                const isLast = idx === items.length - 1;

                return (
                  <tr key={idx} style={{ borderBottom: isLast ? 'none' : '1px solid #f1f5f9', background: idx % 2 === 0 ? '#ffffff' : '#fcfcfc' }}>
                    <td style={{ padding: '11px 14px', textAlign: 'center', fontSize: 12, color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#0f172a', fontWeight: 500 }}>{desc}</td>
                    <td style={{ padding: '11px 14px', textAlign: 'center', fontSize: 13, color: '#475569', fontWeight: 600 }}>{qty}</td>
                    <td style={{ padding: '11px 14px', textAlign: 'right', fontSize: 13, color: '#475569' }}>
                      {price.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                    </td>
                    <td style={{ padding: '11px 14px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                      UGX {amt.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── FINANCIAL SUMMARY ── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
          <div style={{ width: 340, border: '1.5px solid #cbd5e1', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Subtotal</span>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>UGX {subtotal.toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
            </div>

            {discount > 0 && (
              <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid #f1f5f9', color: '#dc2626' }}>
                <span style={{ fontWeight: 600 }}>Discount</span>
                <span style={{ fontWeight: 700 }}>− UGX {discount.toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
              </div>
            )}

            {tax > 0 && (
              <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid #f1f5f9', color: '#16a34a' }}>
                <span style={{ fontWeight: 600 }}>Tax</span>
                <span style={{ fontWeight: 700 }}>+ UGX {tax.toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
              </div>
            )}

            <div style={{
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#0f172a',
              color: '#ffffff',
            }}>
              <span style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Grand Total</span>
              <span style={{ fontSize: 16, fontWeight: 900 }}>UGX {total.toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
            </div>
          </div>
        </div>

        {/* ── NOTES & TERMS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 14px', background: '#f8fafc' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              Notes & Special Instructions
            </div>
            <div style={{ fontSize: 12, color: '#64748b', whiteSpace: 'pre-line', lineHeight: 1.5 }}>
              {quotation.notes || 'Thank you for requesting this quotation. We look forward to working with you.'}
            </div>
          </div>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 14px', background: '#f8fafc' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              Terms & Conditions
            </div>
            <div style={{ fontSize: 12, color: '#64748b', whiteSpace: 'pre-line', lineHeight: 1.5 }}>
              {quotation.terms || '1. Quotation valid for 14 days from issue date.\n2. Payment terms to be agreed upon order confirmation.\n3. Goods remain the property of the seller until settled.'}
            </div>
          </div>
        </div>

        {/* ── SIGNATURE BLOCKS ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', paddingTop: 20,
          borderTop: '1px dashed #cbd5e1', marginBottom: 16,
        }}>
          <div>
            <div style={{ borderBottom: '1px solid #0f172a', width: 200, height: 36, marginBottom: 6 }}></div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>Authorized Signature & Stamp</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>For {businessName}</div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ borderBottom: '1px solid #0f172a', width: 200, height: 36, marginBottom: 6, marginLeft: 'auto' }}></div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>Customer Acceptance Signature</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Date: ________________________</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
          This is an official commercial price quotation generated from {businessName} Management System.
        </div>
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// CREATE / EDIT QUOTATION MODAL (Multi-step wizard: 3 steps)
// ══════════════════════════════════════════════════════════════════════════
function QuotationCreateModal({
  user,
  customers = [],
  products = [],
  token,
  quotationToEdit = null,
  onClose,
  onSaved,
}) {
  const isEditing = Boolean(quotationToEdit);

  // Wizard Step: 1 = Customer Info, 2 = Items, 3 = Dates, Status & Terms
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Customer State
  const [customerType, setCustomerType] = useState('existing');
  const [selectedCustomerId, setSelectedCustomerId] = useState(quotationToEdit?.customer_id ? String(quotationToEdit.customer_id) : '');
  const [customerName, setCustomerName] = useState(quotationToEdit?.customer_name || '');
  const [customerPhone, setCustomerPhone] = useState(quotationToEdit?.customer_phone || '');
  const [customerEmail, setCustomerEmail] = useState(quotationToEdit?.customer_email || '');
  const [customerAddress, setCustomerAddress] = useState(quotationToEdit?.customer_address || '');

  // Step 2: Line Items State
  const [items, setItems] = useState(() => {
    if (quotationToEdit?.items && quotationToEdit.items.length > 0) {
      return quotationToEdit.items.map(i => ({
        product_id: i.product_id ? String(i.product_id) : '',
        mode: i.product_id ? 'product' : 'manual',
        description: i.description || '',
        quantity: String(i.quantity || 1),
        price: formatCurrencyInput(String(i.price || 0)),
      }));
    }
    return [{ product_id: '', mode: 'manual', description: '', quantity: '1', price: '' }];
  });

  const [discountValue, setDiscountValue] = useState(
    quotationToEdit?.discount_amount ? formatCurrencyInput(String(quotationToEdit.discount_amount)) : ''
  );
  const [taxValue, setTaxValue] = useState(
    quotationToEdit?.tax_amount ? formatCurrencyInput(String(quotationToEdit.tax_amount)) : ''
  );

  // Step 3: Dates, Status & Terms State
  const todayStr = new Date().toISOString().slice(0, 10);
  const defaultValidStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  })();

  const [quotationDate, setQuotationDate] = useState(
    quotationToEdit?.quotation_date ? String(quotationToEdit.quotation_date).slice(0, 10) : todayStr
  );
  const [validUntil, setValidUntil] = useState(
    quotationToEdit?.valid_until ? String(quotationToEdit.valid_until).slice(0, 10) : defaultValidStr
  );
  const [status, setStatus] = useState(quotationToEdit?.status || 'pending');

  const [notes, setNotes] = useState(quotationToEdit?.notes || '');
  const [terms, setTerms] = useState(
    quotationToEdit?.terms ||
      '1. Quotation valid for 14 days from issue date.\n2. Delivery terms to be agreed upon confirmation.\n3. Prices quoted in Uganda Shillings (UGX).'
  );

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle customer picker
  const handleSelectCustomer = (e) => {
    const custId = e.target.value;
    setSelectedCustomerId(custId);
    if (!custId) return;
    const cust = customers.find(c => String(c.id) === String(custId));
    if (cust) {
      setCustomerName(cust.name || '');
      setCustomerPhone(cust.phone || cust.contact || '');
      setCustomerEmail(cust.email || '');
      setCustomerAddress(cust.address || '');
    }
  };

  const handleAddItem = () => {
    setItems(prev => [...prev, { product_id: '', mode: 'manual', description: '', quantity: '1', price: '' }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index, field, val) => {
    const cleanVal = field === 'price' ? formatCurrencyInput(val) : val;
    setItems(prev => prev.map((item, idx) => idx === index ? { ...item, [field]: cleanVal } : item));
  };

  const handleProductSelect = (index, productId) => {
    if (!productId) {
      setItems(prev => prev.map((item, idx) => idx === index ? { ...item, product_id: '', mode: 'manual' } : item));
      return;
    }
    const prod = products.find(p => String(p.id) === String(productId));
    if (prod) {
      setItems(prev => prev.map((item, idx) => idx === index ? {
        ...item,
        product_id: String(prod.id),
        mode: 'product',
        description: prod.name,
        price: formatCurrencyInput(String(prod.price || 0)),
      } : item));
    }
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => {
    const q = parseFloat(item.quantity) || 0;
    const p = parseCurrency(item.price);
    return sum + (q * p);
  }, 0);

  const discountAmount = Math.min(parseCurrency(discountValue), subtotal);
  const taxAmount = parseCurrency(taxValue);
  const grandTotal = Math.max(0, subtotal - discountAmount + taxAmount);

  // Wizard Step Navigation Validations
  const goToStep2 = () => {
    setErrorMsg('');
    if (!customerName.trim()) {
      setErrorMsg('Please enter or select a customer name before proceeding.');
      return;
    }
    setCurrentStep(2);
  };

  const goToStep3 = () => {
    setErrorMsg('');
    const validItems = items.filter(
      i => i.description.trim() && parseCurrency(i.price) >= 0 && (parseFloat(i.quantity) || 0) > 0
    );
    if (validItems.length === 0) {
      setErrorMsg('Please add at least one line item with description, valid quantity, and price before proceeding.');
      return;
    }
    setCurrentStep(3);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (!customerName.trim()) {
      setErrorMsg('Please enter or select a customer name.');
      setCurrentStep(1);
      return;
    }

    const validItems = items.filter(
      i => i.description.trim() && parseCurrency(i.price) >= 0 && (parseFloat(i.quantity) || 0) > 0
    );
    if (validItems.length === 0) {
      setErrorMsg('Please add at least one line item with description, valid quantity, and price.');
      setCurrentStep(2);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        quotation_date: quotationDate,
        valid_until: validUntil || null,
        customer_id: selectedCustomerId ? parseInt(selectedCustomerId, 10) : null,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim() || null,
        customer_email: customerEmail.trim() || null,
        customer_address: customerAddress.trim() || null,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        status,
        notes: notes.trim() || null,
        terms: terms.trim() || null,
        items: validItems.map(i => ({
          product_id: i.product_id ? parseInt(i.product_id, 10) : null,
          description: i.description.trim(),
          quantity: parseFloat(i.quantity) || 1,
          price: parseCurrency(i.price),
          subtotal: (parseFloat(i.quantity) || 1) * parseCurrency(i.price),
        })),
      };

      const url = isEditing ? `${API}/quotations/${quotationToEdit.id}` : `${API}/quotations`;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || (isEditing ? 'Failed to update quotation' : 'Failed to create quotation'));
      }

      onSaved(data.data);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Network error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isEditing ? `Edit Quotation (${quotationToEdit?.quotation_number})` : 'Create New Quotation'}
      size="xl"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* ── STEPPER NAVIGATION TABS ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#f8fafc', padding: '14px 20px', borderRadius: 12,
          border: '1px solid #e2e8f0',
        }}>
          {[
            { step: 1, label: 'Customer Info', icon: '👤', desc: 'Client & contact details' },
            { step: 2, label: 'Quote Items', icon: '📦', desc: 'Products, prices & totals' },
            { step: 3, label: 'Dates & Terms', icon: '📅', desc: 'Validity, status & review' },
          ].map((s, idx) => {
            const isActive = currentStep === s.step;
            const isCompleted = currentStep > s.step;
            const canJump = s.step < currentStep || (s.step === 2 && customerName.trim()) || isEditing;

            return (
              <React.Fragment key={s.step}>
                <div
                  onClick={() => {
                    if (canJump) {
                      setErrorMsg('');
                      setCurrentStep(s.step);
                    }
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    cursor: canJump ? 'pointer' : 'default',
                    opacity: isActive || isCompleted ? 1 : 0.5,
                  }}
                  title={canJump ? `Go to Step ${s.step}` : 'Complete prior steps first'}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 800,
                    background: isActive ? '#0f172a' : isCompleted ? '#16a34a' : '#e2e8f0',
                    color: isActive || isCompleted ? '#ffffff' : '#64748b',
                    boxShadow: isActive ? '0 2px 8px rgba(15,23,42,0.25)' : 'none',
                    transition: 'all 0.2s',
                  }}>
                    {isCompleted ? '✓' : s.step}
                  </div>
                  <div>
                    <div style={{
                      fontSize: 13, fontWeight: 700,
                      color: isActive ? '#0f172a' : isCompleted ? '#16a34a' : '#64748b',
                    }}>
                      {s.label}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>
                      {s.desc}
                    </div>
                  </div>
                </div>

                {idx < 2 && (
                  <div style={{
                    flex: 1, height: 2, margin: '0 12px',
                    background: currentStep > idx + 1 ? '#16a34a' : '#e2e8f0',
                    transition: 'background 0.2s',
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* ── ERROR MESSAGE BANNER ── */}
        {errorMsg && (
          <div style={{
            padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: 8, color: '#b91c1c', fontSize: 13, fontWeight: 500,
          }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            STEP 1: CUSTOMER INFO
            ══════════════════════════════════════════════════════════════════ */}
        {currentStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              background: '#f8fafc', padding: 18, borderRadius: 10,
              border: '1px solid #e2e8f0',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                    Customer Details
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                    Select an existing client or enter new customer details for this quote.
                  </p>
                </div>

                {/* Customer entry mode toggle */}
                <div style={{ display: 'flex', gap: 4, background: '#e2e8f0', padding: 3, borderRadius: 8 }}>
                  <button
                    type="button"
                    onClick={() => setCustomerType('existing')}
                    style={{
                      padding: '5px 12px', borderRadius: 6, border: 'none',
                      background: customerType === 'existing' ? '#ffffff' : 'transparent',
                      color: customerType === 'existing' ? '#0f172a' : '#64748b',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      boxShadow: customerType === 'existing' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    }}
                  >
                    Select Existing
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerType('manual');
                      setSelectedCustomerId('');
                    }}
                    style={{
                      padding: '5px 12px', borderRadius: 6, border: 'none',
                      background: customerType === 'manual' ? '#ffffff' : 'transparent',
                      color: customerType === 'manual' ? '#0f172a' : '#64748b',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      boxShadow: customerType === 'manual' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    }}
                  >
                    Manual Entry
                  </button>
                </div>
              </div>

              {customerType === 'existing' && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Choose From Customers Database
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={handleSelectCustomer}
                    style={{ ...styles.input, width: '100%', fontSize: 13, background: '#ffffff' }}
                  >
                    <option value="">— Click to select registered customer —</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Customer / Business Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Uganda Ltd or Sarah Nakato"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    required
                    style={{ ...styles.input, width: '100%', fontSize: 13, background: '#ffffff' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 0776 123456"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    style={{ ...styles.input, width: '100%', fontSize: 13, background: '#ffffff' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. client@example.com"
                    value={customerEmail}
                    onChange={e => setCustomerEmail(e.target.value)}
                    style={{ ...styles.input, width: '100%', fontSize: 13, background: '#ffffff' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Delivery / Physical Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Plot 14 Kampala Road, Shop 3"
                    value={customerAddress}
                    onChange={e => setCustomerAddress(e.target.value)}
                    style={{ ...styles.input, width: '100%', fontSize: 13, background: '#ffffff' }}
                  />
                </div>
              </div>
            </div>

            {/* Step 1 Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '10px 18px', borderRadius: 8, border: '1px solid #cbd5e1',
                  background: '#fff', color: '#475569', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={goToStep2}
                style={{
                  padding: '10px 22px', borderRadius: 8, border: 'none',
                  background: '#0f172a', color: '#fff', fontWeight: 700, fontSize: 13,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                  boxShadow: '0 3px 10px rgba(15,23,42,0.25)',
                }}
              >
                Next: Quote Items →
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            STEP 2: ITEMS & PRICING
            ══════════════════════════════════════════════════════════════════ */}
        {currentStep === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Customer Pill Banner */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 16px', background: '#eff6ff', borderRadius: 8,
              border: '1px solid #bfdbfe',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <span style={{ fontSize: 16 }}>👤</span>
                <span style={{ color: '#1e40af', fontWeight: 700 }}>
                  Quoting For: {customerName}
                </span>
                {customerPhone && <span style={{ color: '#60a5fa' }}>• {customerPhone}</span>}
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                style={{
                  background: 'none', border: 'none', color: '#2563eb',
                  fontWeight: 600, fontSize: 12, cursor: 'pointer', textDecoration: 'underline',
                }}
              >
                Change Customer
              </button>
            </div>

            {/* Line items table */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', color: '#475569' }}>
                    <th style={{ padding: '9px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700 }}>
                      Item Description / Product
                    </th>
                    <th style={{ padding: '9px 12px', textAlign: 'center', fontSize: 12, fontWeight: 700, width: 90 }}>
                      Qty
                    </th>
                    <th style={{ padding: '9px 12px', textAlign: 'right', fontSize: 12, fontWeight: 700, width: 140 }}>
                      Unit Price (UGX)
                    </th>
                    <th style={{ padding: '9px 12px', textAlign: 'right', fontSize: 12, fontWeight: 700, width: 140 }}>
                      Subtotal (UGX)
                    </th>
                    <th style={{ padding: '9px 12px', textAlign: 'center', width: 44 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const qty = parseFloat(item.quantity) || 0;
                    const price = parseCurrency(item.price);
                    const lineSubtotal = qty * price;

                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {products.length > 0 && (
                              <select
                                value={item.product_id}
                                onChange={e => handleProductSelect(idx, e.target.value)}
                                style={{ ...styles.input, fontSize: 12, padding: '5px 8px', marginBottom: 4 }}
                              >
                                <option value="">— Pick from stock product (Optional) —</option>
                                {products.map(p => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} (In Stock: {p.stock} | UGX {Number(p.price || 0).toLocaleString()})
                                  </option>
                                ))}
                              </select>
                            )}
                            <input
                              type="text"
                              placeholder="Type item description, service or package…"
                              value={item.description}
                              onChange={e => handleItemChange(idx, 'description', e.target.value)}
                              required
                              style={{ ...styles.input, fontSize: 13, padding: '6px 8px', width: '100%' }}
                            />
                          </div>
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={item.quantity}
                            onFocus={e => e.target.select()}
                            onChange={e => handleItemChange(idx, 'quantity', e.target.value.replace(/[^\d.]/g, ''))}
                            style={{
                              ...styles.input, width: 64, textAlign: 'center',
                              fontSize: 13, fontWeight: 700, padding: '6px 4px',
                            }}
                          />
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="0"
                            value={item.price}
                            onFocus={e => e.target.select()}
                            onChange={e => handleItemChange(idx, 'price', e.target.value)}
                            style={{
                              ...styles.input, width: '100%', textAlign: 'right',
                              fontSize: 13, fontWeight: 600, padding: '6px 8px',
                            }}
                          />
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                          {lineSubtotal.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            disabled={items.length === 1}
                            style={{
                              background: 'none', border: 'none',
                              color: items.length === 1 ? '#cbd5e1' : '#ef4444',
                              cursor: items.length === 1 ? 'not-allowed' : 'pointer', fontSize: 16,
                            }}
                            title="Remove item"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
              <button
                type="button"
                onClick={handleAddItem}
                style={{
                  padding: '7px 14px', borderRadius: 6, border: '1px dashed #cbd5e1',
                  background: '#f8fafc', color: '#2563eb', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                + Add Another Item
              </button>

              {/* Subtotal, discount, tax calculations */}
              <div style={{
                width: 320, background: '#f8fafc', padding: 14, borderRadius: 10,
                border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b' }}>
                  <span>Items Subtotal:</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>UGX {subtotal.toLocaleString()}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#64748b' }}>Discount (UGX):</span>
                  <input
                    type="text"
                    placeholder="0"
                    value={discountValue}
                    onChange={e => setDiscountValue(formatCurrencyInput(e.target.value))}
                    style={{ ...styles.input, width: 120, textAlign: 'right', fontSize: 13 }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#64748b' }}>Tax (UGX):</span>
                  <input
                    type="text"
                    placeholder="0"
                    value={taxValue}
                    onChange={e => setTaxValue(formatCurrencyInput(e.target.value))}
                    style={{ ...styles.input, width: 120, textAlign: 'right', fontSize: 13 }}
                  />
                </div>

                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  paddingTop: 8, borderTop: '2px solid #e2e8f0', marginTop: 2,
                }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Total (UGX):</span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>
                    UGX {grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Step 2 Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                style={{
                  padding: '10px 18px', borderRadius: 8, border: '1px solid #cbd5e1',
                  background: '#fff', color: '#475569', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                }}
              >
                ← Back: Customer Info
              </button>

              <button
                type="button"
                onClick={goToStep3}
                style={{
                  padding: '10px 22px', borderRadius: 8, border: 'none',
                  background: '#0f172a', color: '#fff', fontWeight: 700, fontSize: 13,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                  boxShadow: '0 3px 10px rgba(15,23,42,0.25)',
                }}
              >
                Next: Dates & Terms →
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            STEP 3: QUOTE DATES, STATUS & TERMS
            ══════════════════════════════════════════════════════════════════ */}
        {currentStep === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Dates & Status Grid */}
            <div style={{
              background: '#f8fafc', padding: 18, borderRadius: 10,
              border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14,
            }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Quotation Date Issued *
                </label>
                <input
                  type="date"
                  value={quotationDate}
                  onChange={e => setQuotationDate(e.target.value)}
                  style={{ ...styles.input, width: '100%', fontSize: 13, background: '#ffffff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Valid Until (Expiry Date) *
                </label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={e => setValidUntil(e.target.value)}
                  style={{ ...styles.input, width: '100%', fontSize: 13, background: '#ffffff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Quote Status
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  style={{ ...styles.input, width: '100%', fontSize: 13, background: '#ffffff' }}
                >
                  <option value="pending">Pending (Sent to customer)</option>
                  <option value="accepted">Accepted (Customer approved)</option>
                  <option value="declined">Declined</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>

            {/* Notes & Terms */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Customer Notes & Remarks
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Optional note for the customer, e.g. Payment terms, special discounts..."
                  style={{ ...styles.input, width: '100%', resize: 'vertical', fontSize: 12, fontFamily: 'inherit' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Terms & Conditions
                </label>
                <textarea
                  rows={3}
                  value={terms}
                  onChange={e => setTerms(e.target.value)}
                  placeholder="Standard terms and conditions..."
                  style={{ ...styles.input, width: '100%', resize: 'vertical', fontSize: 12, fontFamily: 'inherit' }}
                />
              </div>
            </div>

            {/* Final Review Card */}
            <div style={{
              background: '#0f172a', color: '#ffffff', padding: '16px 20px',
              borderRadius: 10, display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', flexWrap: 'wrap', gap: 14,
            }}>
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                  Quotation Summary
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, marginTop: 2 }}>
                  {customerName} • {items.length} {items.length === 1 ? 'item' : 'items'}
                </div>
                <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 2 }}>
                  Valid: {quotationDate} to {validUntil || '—'}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                  Grand Total
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#38bdf8' }}>
                  UGX {grandTotal.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Step 3 Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                style={{
                  padding: '10px 18px', borderRadius: 8, border: '1px solid #cbd5e1',
                  background: '#fff', color: '#475569', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                }}
              >
                ← Back: Quote Items
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  padding: '10px 24px', borderRadius: 8, border: 'none',
                  background: submitting ? '#94a3b8' : '#be123c', color: '#fff',
                  fontWeight: 700, fontSize: 14, cursor: submitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 3px 12px rgba(190,18,60,0.3)', display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                {submitting ? 'Saving Quotation…' : isEditing ? '✓ Update Quotation' : '✓ Save & Generate Quotation'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// PRINT QUOTATIONS LIST MODAL (A4 print / PDF export for all quotations)
// ══════════════════════════════════════════════════════════════════════════
function PrintQuotationsListModal({ quotations = [], user, onClose }) {
  const tenant = user?.tenant || {};
  const businessName = tenant.name || user?.name || 'Smart Trendz';

  const handlePrint = () => {
    window.print();
  };

  const totalValue = quotations.reduce((sum, q) => sum + (parseFloat(q.total_amount) || 0), 0);

  return (
    <Modal isOpen={true} onClose={onClose} title="" size="xl" className="invoice-modal">
      <div className="no-print" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #e2e8f0',
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Quotations Register Preview</h3>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>Ready for printing or saving to PDF</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={handlePrint}
            style={{
              padding: '8px 18px', borderRadius: 6, border: 'none', background: '#0f172a',
              color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            }}
          >
            🖨️ Export PDF / Print
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px', borderRadius: 6, border: '1px solid #cbd5e1',
              background: '#fff', color: '#475569', fontWeight: 600, fontSize: 13, cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>

      <div id="printable-quotations-list" style={{
        background: '#ffffff', padding: '30px', fontFamily: "'Inter', Arial, sans-serif",
      }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 900, textTransform: 'uppercase' }}>{businessName}</h2>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#2563eb' }}>QUOTATIONS REGISTER</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>Generated on {new Date().toLocaleDateString()} | Total Quotes: {quotations.length}</div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#0f172a', color: '#ffffff' }}>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>Quote #</th>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>Customer</th>
              <th style={{ padding: '8px 10px', textAlign: 'center' }}>Date Issued</th>
              <th style={{ padding: '8px 10px', textAlign: 'center' }}>Valid Until</th>
              <th style={{ padding: '8px 10px', textAlign: 'center' }}>Status</th>
              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Total (UGX)</th>
            </tr>
          </thead>
          <tbody>
            {quotations.map((q, idx) => (
              <tr key={q.id} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                <td style={{ padding: '8px 10px', fontWeight: 700 }}>{q.quotation_number}</td>
                <td style={{ padding: '8px 10px' }}>{q.customer_name}</td>
                <td style={{ padding: '8px 10px', textAlign: 'center' }}>{q.quotation_date ? String(q.quotation_date).slice(0, 10) : '—'}</td>
                <td style={{ padding: '8px 10px', textAlign: 'center' }}>{q.valid_until ? String(q.valid_until).slice(0, 10) : '—'}</td>
                <td style={{ padding: '8px 10px', textAlign: 'center', textTransform: 'capitalize' }}>{q.status}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>
                  {Number(q.total_amount || 0).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: '#f1f5f9', fontWeight: 800 }}>
              <td colSpan="5" style={{ padding: '10px', textAlign: 'right' }}>Total Quotations Value:</td>
              <td style={{ padding: '10px', textAlign: 'right' }}>UGX {totalValue.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN QUOTATIONS TAB COMPONENT
// ══════════════════════════════════════════════════════════════════════════
export default function QuotationsTab({
  customers = [],
  products = [],
  user,
  token,
  toast,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  onNavigateToInvoices,
}) {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [quotationToEdit, setQuotationToEdit] = useState(null);
  const [viewingQuotation, setViewingQuotation] = useState(null);
  const [showPrintListModal, setShowPrintListModal] = useState(false);

  // Fetch quotations from API
  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/quotations`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to load quotations');
      }
      setQuotations(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  // Handle Quick Status Change
  const handleStatusChange = async (quoteId, newStatus) => {
    try {
      const res = await fetch(`${API}/quotations/${quoteId}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update status');

      setQuotations(prev => prev.map(q => q.id === quoteId ? { ...q, status: newStatus } : q));
      if (viewingQuotation && viewingQuotation.id === quoteId) {
        setViewingQuotation(prev => ({ ...prev, status: newStatus }));
      }
      toast?.success('Status Updated', `Quotation marked as ${newStatus}.`);
    } catch (err) {
      toast?.error('Error', err.message);
    }
  };

  // Handle Convert to Invoice
  const handleConvertToInvoice = async (quote) => {
    if (!window.confirm(`Convert Quotation ${quote.quotation_number} to an official Invoice?`)) {
      return;
    }
    try {
      const res = await fetch(`${API}/quotations/${quote.id}/convert`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to convert quotation');

      setQuotations(prev => prev.map(q => q.id === quote.id ? { ...q, status: 'converted' } : q));
      if (viewingQuotation && viewingQuotation.id === quote.id) {
        setViewingQuotation(prev => ({ ...prev, status: 'converted' }));
      }
      toast?.success('Converted!', `Quotation converted to Invoice successfully.`);
      if (onNavigateToInvoices) {
        onNavigateToInvoices();
      }
    } catch (err) {
      toast?.error('Error', err.message);
    }
  };

  // Handle Delete
  const handleDelete = async (quote) => {
    if (!window.confirm(`Are you sure you want to delete Quotation "${quote.quotation_number}" for ${quote.customer_name}?`)) {
      return;
    }
    try {
      const res = await fetch(`${API}/quotations/${quote.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete quotation');

      setQuotations(prev => prev.filter(q => q.id !== quote.id));
      toast?.success('Deleted', 'Quotation removed successfully.');
    } catch (err) {
      toast?.error('Error', err.message);
    }
  };

  // Filtered quotations
  const filteredQuotations = quotations.filter(q => {
    const s = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      (q.quotation_number || '').toLowerCase().includes(s) ||
      (q.customer_name || '').toLowerCase().includes(s) ||
      (q.customer_phone || '').toLowerCase().includes(s);

    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // KPI Calculations
  const totalCount = quotations.length;
  const pendingQuotes = quotations.filter(q => q.status === 'pending');
  const acceptedQuotes = quotations.filter(q => q.status === 'accepted');
  const convertedQuotes = quotations.filter(q => q.status === 'converted');

  const pendingValue = pendingQuotes.reduce((sum, q) => sum + (parseFloat(q.total_amount) || 0), 0);
  const acceptedValue = acceptedQuotes.reduce((sum, q) => sum + (parseFloat(q.total_amount) || 0), 0);

  return (
    <div style={styles.pageContainer}>
      {/* ── HERO BANNER ── */}
      <div className="section-hero" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        borderRadius: 16, padding: '24px 32px', marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 24px rgba(15,23,42,0.14)', flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Estimates & Bids
          </p>
          <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.3px' }}>
            Quotations
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
            Create professional price quotes, save them to your database, and export ready-to-sign PDFs.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setShowPrintListModal(true)}
            style={{
              padding: '10px 16px', borderRadius: 8, border: '1px solid #334155',
              background: 'rgba(255,255,255,0.06)', color: '#f8fafc', fontSize: 13,
              fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            🖨️ Print List
          </button>

          {canCreate && (
            <button
              type="button"
              onClick={() => {
                setQuotationToEdit(null);
                setShowCreateModal(true);
              }}
              style={{
                padding: '10px 20px', borderRadius: 8, border: 'none',
                background: '#be123c', color: '#ffffff', fontSize: 13,
                fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: '0 4px 14px rgba(190,18,60,0.35)',
              }}
            >
              + Create Quotation
            </button>
          )}
        </div>
      </div>

      {/* ── KPI METRICS CARDS ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16, marginBottom: 24,
      }}>
        <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Quotations</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{totalCount}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Issued estimates</div>
        </div>

        <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#d97706', textTransform: 'uppercase' }}>Pending / In Review</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#b45309', marginTop: 4 }}>{pendingQuotes.length}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>UGX {pendingValue.toLocaleString()} awaiting approval</div>
        </div>

        <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>Accepted Quotes</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#15803d', marginTop: 4 }}>{acceptedQuotes.length}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>UGX {acceptedValue.toLocaleString()} agreed value</div>
        </div>

        <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>Converted to Invoices</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#1d4ed8', marginTop: 4 }}>{convertedQuotes.length}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Ready for payment & fulfillment</div>
        </div>
      </div>

      {/* ── FILTER & SEARCH TOOLBAR ── */}
      <div style={{
        background: '#ffffff', padding: '16px 20px', borderRadius: 12,
        border: '1px solid #e2e8f0', marginBottom: 20, display: 'flex',
        justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
      }}>
        {/* Status tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Quotes' },
            { id: 'pending', label: 'Pending' },
            { id: 'accepted', label: 'Accepted' },
            { id: 'declined', label: 'Declined' },
            { id: 'converted', label: 'Converted' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              style={{
                padding: '6px 14px', borderRadius: 20, border: 'none',
                background: statusFilter === tab.id ? '#0f172a' : '#f1f5f9',
                color: statusFilter === tab.id ? '#ffffff' : '#475569',
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div style={{ width: 280 }}>
          <input
            type="text"
            placeholder="Search by quote # or customer…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ ...styles.input, width: '100%', fontSize: 13, padding: '7px 12px' }}
          />
        </div>
      </div>

      {/* ── QUOTATIONS TABLE ── */}
      <div style={{
        background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0',
        overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Loading quotations from database…</div>
          </div>
        ) : error ? (
          <div style={{ padding: 30, textAlign: 'center', color: '#dc2626' }}>
            <p>Failed to load quotations: {error}</p>
            <button
              type="button"
              onClick={fetchQuotations}
              style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #dc2626', background: '#fff', color: '#dc2626' }}
            >
              Retry
            </button>
          </div>
        ) : filteredQuotations.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
            <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>No Quotations Found</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
              {searchTerm || statusFilter !== 'all' ? 'Try adjusting your search or filters.' : 'Get started by creating your first price quote for a client.'}
            </p>
            {canCreate && (
              <button
                type="button"
                onClick={() => {
                  setQuotationToEdit(null);
                  setShowCreateModal(true);
                }}
                style={{
                  padding: '9px 18px', borderRadius: 8, border: 'none', background: '#be123c',
                  color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                }}
              >
                + Create Quotation Now
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700 }}>Quotation #</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700 }}>Customer</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700 }}>Date Issued</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700 }}>Valid Until</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700 }}>Items</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700 }}>Total Amount</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotations.map((q, idx) => {
                  const isExpired = q.valid_until && new Date(q.valid_until) < new Date() && q.status === 'pending';
                  const itemCount = (q.items || []).length;

                  return (
                    <tr
                      key={q.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                      }}
                    >
                      <td style={{ padding: '13px 16px', fontWeight: 800, color: '#2563eb' }}>
                        {q.quotation_number}
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{q.customer_name}</div>
                        {q.customer_phone && <div style={{ fontSize: 11, color: '#64748b' }}>{q.customer_phone}</div>}
                      </td>
                      <td style={{ padding: '13px 16px', textAlign: 'center', color: '#475569' }}>
                        {q.quotation_date ? String(q.quotation_date).slice(0, 10) : '—'}
                      </td>
                      <td style={{ padding: '13px 16px', textAlign: 'center' }}>
                        <span style={{ color: isExpired ? '#dc2626' : '#475569', fontWeight: isExpired ? 700 : 500 }}>
                          {q.valid_until ? String(q.valid_until).slice(0, 10) : '—'}
                        </span>
                        {isExpired && (
                          <div style={{ fontSize: 10, color: '#dc2626', fontWeight: 700 }}>Expired</div>
                        )}
                      </td>
                      <td style={{ padding: '13px 16px', textAlign: 'center', color: '#64748b' }}>
                        {itemCount} {itemCount === 1 ? 'item' : 'items'}
                      </td>
                      <td style={{ padding: '13px 16px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                        UGX {Number(q.total_amount || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '13px 16px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: q.status === 'accepted' ? '#dcfce7' : q.status === 'declined' ? '#fee2e2' : q.status === 'converted' ? '#dbeafe' : '#fef3c7',
                          color: q.status === 'accepted' ? '#166534' : q.status === 'declined' ? '#991b1b' : q.status === 'converted' ? '#1e40af' : '#92400e',
                        }}>
                          {q.status}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                          {/* View & PDF Export */}
                          <button
                            type="button"
                            onClick={() => setViewingQuotation(q)}
                            style={{
                              padding: '5px 10px', borderRadius: 6, border: '1px solid #cbd5e1',
                              background: '#ffffff', color: '#0f172a', fontWeight: 700, fontSize: 12,
                              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                            }}
                            title="View quote and export PDF"
                          >
                            <span>📄</span> PDF
                          </button>

                          {/* Quick status dropdown */}
                          <select
                            value={q.status}
                            onChange={e => handleStatusChange(q.id, e.target.value)}
                            style={{
                              padding: '4px 6px', borderRadius: 6, border: '1px solid #e2e8f0',
                              background: '#f8fafc', fontSize: 11, fontWeight: 600, color: '#475569',
                            }}
                            title="Update quotation status"
                          >
                            <option value="pending">Pending</option>
                            <option value="accepted">Accepted</option>
                            <option value="declined">Declined</option>
                            <option value="expired">Expired</option>
                            <option value="converted" disabled>Converted</option>
                          </select>

                          {/* Convert to invoice shortcut */}
                          {q.status !== 'converted' && (
                            <button
                              type="button"
                              onClick={() => handleConvertToInvoice(q)}
                              style={{
                                padding: '5px 8px', borderRadius: 6, border: '1px solid #bfdbfe',
                                background: '#eff6ff', color: '#1d4ed8', fontSize: 12,
                                fontWeight: 700, cursor: 'pointer',
                              }}
                              title="Convert directly to Invoice"
                            >
                              ⚡ Invoice
                            </button>
                          )}

                          {/* Edit */}
                          {canEdit && q.status !== 'converted' && (
                            <button
                              type="button"
                              onClick={() => {
                                setQuotationToEdit(q);
                                setShowCreateModal(true);
                              }}
                              style={{
                                padding: '5px 8px', borderRadius: 6, border: '1px solid #e2e8f0',
                                background: '#ffffff', color: '#475569', fontSize: 12, cursor: 'pointer',
                              }}
                              title="Edit quotation"
                            >
                              ✏️
                            </button>
                          )}

                          {/* Delete */}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDelete(q)}
                              style={{
                                padding: '5px 8px', borderRadius: 6, border: '1px solid #fecaca',
                                background: '#fef2f2', color: '#dc2626', fontSize: 12, cursor: 'pointer',
                              }}
                              title="Delete quotation"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── VIEW / PRINT QUOTATION MODAL ── */}
      {viewingQuotation && (
        <PrintableQuotationModal
          quotation={viewingQuotation}
          user={user}
          onClose={() => setViewingQuotation(null)}
          onConvertToInvoice={handleConvertToInvoice}
        />
      )}

      {/* ── CREATE / EDIT MODAL ── */}
      {showCreateModal && (
        <QuotationCreateModal
          user={user}
          customers={customers}
          products={products}
          token={token}
          quotationToEdit={quotationToEdit}
          onClose={() => {
            setShowCreateModal(false);
            setQuotationToEdit(null);
          }}
          onSaved={(savedQuote) => {
            fetchQuotations();
            setViewingQuotation(savedQuote);
            toast?.success(
              quotationToEdit ? 'Quotation Updated' : 'Quotation Created',
              `Saved ${savedQuote.quotation_number} successfully.`
            );
          }}
        />
      )}

      {/* ── PRINT LIST MODAL ── */}
      {showPrintListModal && (
        <PrintQuotationsListModal
          quotations={filteredQuotations}
          user={user}
          onClose={() => setShowPrintListModal(false)}
        />
      )}
    </div>
  );
}

