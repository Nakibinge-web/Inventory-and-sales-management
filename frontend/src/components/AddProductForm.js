import { useState, useRef, useCallback } from 'react';
import Button from './ui/Button';
import { formatCurrencyInput, cleanCurrency, parseCurrency } from '../utils/currency';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const UNITS = [
  'Pieces (pcs)', 'Kilograms (kg)', 'Grams (g)', 'Litres (L)',
  'Millilitres (mL)', 'Metres (m)', 'Centimetres (cm)', 'Inches (in)',
  'Boxes', 'Cartons', 'Dozens', 'Pairs', 'Rolls', 'Bags', 'Bottles', 'Cans',
];

const EMPTY = {
  name: '', sku: '', barcode: '', unit: '',
  category_id: '', new_category: '', category_mode: 'existing',
  supplier_id: '',
  stock: '', cost_price: '', price: '', reorder_level: '',
  description: '', track_expiry: false,
  manufacture_date: '', expiry_date: '',
};

export default function AddProductForm({ token, categories, suppliers, onSuccess, onCancel }) {
  const [form, setForm]         = useState(EMPTY);
  const [skuAuto, setSkuAuto]   = useState(false);   // whether current SKU was auto-generated
  const [skuLoading, setSkuLoading] = useState(false);
  const [image, setImage]       = useState(null);
  const [preview, setPreview]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [fieldErrors, setFieldErrors] = useState({}); // inline field errors
  const fileRef                 = useRef();

  const handle = e => {
    const { name, type, checked } = e.target;
    let value = type === 'checkbox' ? checked : e.target.value;
    if (name === 'cost_price' || name === 'price') {
      value = formatCurrencyInput(value);
    }
    setForm(f => ({ ...f, [name]: value }));
    // Clear field error when user types
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: null }));
    }
    // If user manually edits SKU, stop treating it as auto
    if (name === 'sku') setSkuAuto(false);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!form.name.trim()) {
      errors.name = 'Product name is required';
    } else if (form.name.trim().length < 2) {
      errors.name = 'Product name must be at least 2 characters';
    }
    
    if (!form.unit) {
      errors.unit = 'Please select a unit of measure';
    }
    
    // Category is optional. Validate only if a new category name was provided
    if (form.category_mode === 'new' && form.new_category.trim() && form.new_category.trim().length < 2) {
      errors.new_category = 'Category name must be at least 2 characters';
    }
    
    if (!form.stock || form.stock < 0) {
      errors.stock = 'Quantity is required and must be 0 or greater';
    }
    
    const priceNum = parseCurrency(form.price);
    if (!form.price || priceNum <= 0) {
      errors.price = 'Selling price is required and must be greater than 0';
    }
    
    const costNum = parseCurrency(form.cost_price);
    if (costNum > 0 && priceNum > 0 && costNum > priceNum) {
      errors.price = 'Selling price should not be less than cost price';
    }
    
    if (form.track_expiry && !form.expiry_date) {
      errors.expiry_date = 'Expiry date is required when tracking expiry';
    }
    
    if (form.manufacture_date && form.expiry_date && form.manufacture_date > form.expiry_date) {
      errors.expiry_date = 'Expiry date must be after manufacture date';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Called when product name field loses focus
  const handleNameBlur = useCallback(async (e) => {
    const name = e.target.value.trim();
    if (!name) return;
    // Only auto-fill if SKU is currently empty or was previously auto-generated
    if (form.sku && !skuAuto) return;

    setSkuLoading(true);
    try {
      const res  = await fetch(`${API}/products/generate-sku?name=${encodeURIComponent(name)}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        setForm(f => ({ ...f, sku: data.sku }));
        setSkuAuto(true);
      }
    } catch { /* silent — user can still type SKU manually */ }
    finally { setSkuLoading(false); }
  }, [form.sku, skuAuto, token]);

  const handleImage = e => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const submit = async e => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      setError('Please fix the errors below before submitting');
      return;
    }
    
    setLoading(true);
    setError(null);
    setFieldErrors({});

    const fd = new FormData();
    fd.append('name',          form.name);
    fd.append('sku',           form.sku);
    fd.append('barcode',       form.barcode);
    fd.append('unit',          form.unit);
    fd.append('supplier_id',   form.supplier_id);
    fd.append('stock',         form.stock);
    fd.append('cost_price',    cleanCurrency(form.cost_price));
    fd.append('price',         cleanCurrency(form.price));
    fd.append('reorder_level', form.reorder_level || 0);
    fd.append('description',   form.description);
    fd.append('track_expiry',  form.track_expiry ? 1 : 0);
    if (form.track_expiry) {
      fd.append('manufacture_date', form.manufacture_date);
      fd.append('expiry_date',      form.expiry_date);
    }

    if (form.category_mode === 'existing') {
      if (form.category_id) {
        fd.append('category_id', form.category_id);
      }
    } else if (form.category_mode === 'new' && form.new_category.trim()) {
      fd.append('new_category', form.new_category.trim());
    }

    if (image) fd.append('image', image);

    try {
      const res = await fetch(`${API}/products`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.message || `Error ${res.status}`); }
      else { onSuccess(data.data); }
    } catch {
      setError('Failed to add product. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} style={s.form}>

      {/* ── Section 1: Basic Information ── */}
      <SectionHeader
        icon="🏷️"
        title="Basic Information"
        subtitle="Primary identification, naming and measurement unit"
      />

      {/* Row 1: Name + SKU */}
      <div className="product-form-row" style={s.row}>
        <Field label="Product Name" required error={fieldErrors.name}>
          <input
            className="product-modal-input"
            style={{ ...s.input, borderColor: fieldErrors.name ? '#dc2626' : '#cbd5e1' }}
            name="name"
            placeholder="e.g., Memory Foam Mattress Queen, Bedding Sheet King Size"
            value={form.name}
            onChange={handle}
            onBlur={handleNameBlur}
          />
        </Field>
        <Field
          label="SKU Code"
          optional
          hint={
            skuLoading ? (
              <span style={s.skuLoading}>generating…</span>
            ) : skuAuto ? (
              <span style={s.skuAutoBadge}>AUTO</span>
            ) : null
          }
        >
          <input
            className="product-modal-input"
            style={{ ...s.input, background: skuAuto ? '#fafbff' : '#fff', borderColor: skuAuto ? '#c4b5fd' : '#cbd5e1' }}
            name="sku"
            placeholder={skuLoading ? 'Generating…' : 'e.g., MAT-QN-001, BED-KG-050'}
            value={form.sku}
            onChange={handle}
            title={skuAuto ? 'Auto-generated from product name. You can edit this.' : ''}
          />
        </Field>
      </div>

      {/* Row 2: Barcode + Unit */}
      <div className="product-form-row" style={s.row}>
        <Field label="Product Barcode" optional>
          <input
            className="product-modal-input"
            style={s.input}
            name="barcode"
            placeholder="Scan or manually enter barcode"
            value={form.barcode}
            onChange={handle}
          />
        </Field>
        <Field label="Unit of Measure" required error={fieldErrors.unit}>
          <select
            className="product-modal-input"
            style={{ ...s.input, borderColor: fieldErrors.unit ? '#dc2626' : '#cbd5e1' }}
            name="unit"
            value={form.unit}
            onChange={handle}
          >
            <option value="">— Select measurement unit —</option>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </Field>
      </div>

      {/* ── Section 2: Category & Supplier ── */}
      <SectionHeader
        icon="📂"
        title="Category & Supplier"
        subtitle="Organize in store catalog and assign preferred supplier"
      />

      <div style={s.categorySupplierBox}>
        {/* Category */}
        <Field label="Product Category" optional error={fieldErrors.category_id || fieldErrors.new_category}>
          <div style={s.segmented}>
            {['existing', 'new'].map(m => (
              <button
                key={m}
                type="button"
                style={{ ...s.seg, ...(form.category_mode === m ? s.segActive : {}) }}
                onClick={() => setForm(f => ({ ...f, category_mode: m }))}
              >
                {m === 'existing' ? '📂 Existing Category' : '➕ Create New Category'}
              </button>
            ))}
          </div>
          {form.category_mode === 'existing' ? (
            <select
              className="product-modal-input"
              style={{ ...s.input, marginTop: 10, borderColor: fieldErrors.category_id ? '#dc2626' : '#cbd5e1' }}
              name="category_id"
              value={form.category_id}
              onChange={handle}
            >
              <option value="">— No category (Optional) —</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          ) : (
            <input
              className="product-modal-input"
              style={{ ...s.input, marginTop: 10, borderColor: fieldErrors.new_category ? '#dc2626' : '#cbd5e1' }}
              name="new_category"
              placeholder="e.g., Spring Mattresses, Orthopedic, Premium Bedding"
              value={form.new_category}
              onChange={handle}
            />
          )}
        </Field>

        {/* Supplier */}
        <Field label="Product Supplier" optional>
          <select
            className="product-modal-input"
            style={s.input}
            name="supplier_id"
            value={form.supplier_id}
            onChange={handle}
          >
            <option value="">— No supplier assigned —</option>
            {suppliers.map(sup => <option key={sup.id} value={sup.id}>{sup.name}</option>)}
          </select>
        </Field>
      </div>

      {/* ── Section 3: Inventory & Pricing ── */}
      <SectionHeader
        icon="💰"
        title="Inventory & Pricing"
        subtitle="Stock levels, alert thresholds, cost and selling prices"
      />

      {/* Row 3: Qty + Reorder */}
      <div className="product-form-row" style={s.row}>
        <Field label="Initial Stock Quantity" required error={fieldErrors.stock}>
          <input
            className="product-modal-input"
            style={{ ...s.input, borderColor: fieldErrors.stock ? '#dc2626' : '#cbd5e1' }}
            name="stock"
            type="number"
            min="0"
            placeholder="Enter current stock quantity"
            value={form.stock}
            onChange={handle}
          />
        </Field>
        <Field label="Low Stock Alert Level" optional>
          <input
            className="product-modal-input"
            style={s.input}
            name="reorder_level"
            type="number"
            min="0"
            placeholder="e.g., 5 (alert when stock is below this)"
            value={form.reorder_level}
            onChange={handle}
          />
        </Field>
      </div>

      {/* Row 4: Cost + Selling price */}
      <div className="product-form-row" style={s.row}>
        <Field label="Purchase Cost Price (UGX)" optional>
          <input
            className="product-modal-input"
            style={s.input}
            name="cost_price"
            type="text"
            inputMode="decimal"
            placeholder="e.g. 50,000"
            value={form.cost_price}
            onChange={handle}
          />
        </Field>
        <Field label="Selling Price (UGX)" required error={fieldErrors.price}>
          <input
            className="product-modal-input"
            style={{ ...s.input, borderColor: fieldErrors.price ? '#dc2626' : '#cbd5e1' }}
            name="price"
            type="text"
            inputMode="decimal"
            placeholder="e.g. 75,000"
            value={form.price}
            onChange={handle}
          />
        </Field>
      </div>

      {/* ── Section 4: Details & Media ── */}
      <SectionHeader
        icon="📝"
        title="Description & Media"
        subtitle="Product photo, details and warranty/expiry tracking"
      />

      {/* Description */}
      <Field label="Product Description" optional>
        <textarea
          className="product-modal-input"
          style={{ ...s.input, minHeight: 84, resize: 'vertical', lineHeight: 1.5 }}
          name="description"
          placeholder="e.g., 12-inch memory foam with cooling gel, hypoallergenic cover"
          value={form.description}
          onChange={handle}
        />
      </Field>

      {/* Product image */}
      <Field label="Product Photo" optional>
        <div
          style={s.imageArea}
          onClick={() => fileRef.current.click()}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.background = '#faf5ff'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f8fafc'; }}
        >
          {preview ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <img src={preview} alt="preview" style={s.imagePreview} />
              <span style={{ fontSize: 12, color: '#4f46e5', fontWeight: 600 }}>Click to change photo</span>
            </div>
          ) : (
            <div style={s.imagePlaceholder}>
              <div style={s.imageIconCircle}>🖼️</div>
              <span style={s.imageHint}>Click to upload product photo</span>
              <span style={s.imageHint2}>PNG, JPG or WEBP format, maximum 2 MB</span>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImage} />
        {preview && (
          <button
            type="button"
            style={s.removeImg}
            onClick={() => { setImage(null); setPreview(null); }}
          >
            ✕ Remove photo
          </button>
        )}
      </Field>

      {/* Track expiry toggle */}
      <label style={s.toggle}>
        <div style={{ ...s.toggleTrack, background: form.track_expiry ? '#4f46e5' : '#cbd5e1' }}>
          <div style={{ ...s.toggleThumb, transform: form.track_expiry ? 'translateX(20px)' : 'translateX(2px)' }} />
        </div>
        <input
          type="checkbox"
          name="track_expiry"
          checked={form.track_expiry}
          onChange={handle}
          style={{ display: 'none' }}
        />
        <div style={{ flex: 1 }}>
          <div style={s.toggleLabel}>Track Warranty / Expiry Date for this Product</div>
          <div style={s.toggleSub}>Enable if this product has a warranty period or expiration date</div>
        </div>
      </label>

      {/* Expiry date fields (shown when track_expiry is on) */}
      {form.track_expiry && (
        <div style={s.expiryBox}>
          <div style={s.expiryHeader}>
            <span style={{ fontSize: 14 }}>📅</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Warranty &amp; Expiry Configuration
            </span>
          </div>
          <div className="product-form-row" style={s.row}>
            <Field label="Manufacture Date" optional>
              <input
                className="product-modal-input"
                style={s.input}
                name="manufacture_date"
                type="date"
                value={form.manufacture_date}
                onChange={handle}
              />
            </Field>
            <Field label="Warranty / Expiry Date" required error={fieldErrors.expiry_date}>
              <input
                className="product-modal-input"
                style={{ ...s.input, borderColor: fieldErrors.expiry_date ? '#dc2626' : '#cbd5e1' }}
                name="expiry_date"
                type="date"
                value={form.expiry_date}
                onChange={handle}
                min={form.manufacture_date || undefined}
              />
            </Field>
          </div>
        </div>
      )}

      {error && <div style={s.error}>⚠️ {error}</div>}

      {/* ── Footer ── */}
      <div style={s.footer}>
        <Button type="button" variant="secondary" onClick={onCancel} style={{ flex: 1, padding: '12px' }}>
          Cancel
        </Button>
        <Button type="submit" variant="success" loading={loading} style={{ flex: 1.4, padding: '12px' }}>
          {loading ? 'Saving Product…' : '✓ Add Product to Inventory'}
        </Button>
      </div>
    </form>
  );
}

function SectionHeader({ icon, title, subtitle }) {
  return (
    <div style={s.sectionHeader}>
      <div style={s.sectionTitleWrap}>
        <span style={s.sectionIcon}>{icon}</span>
        <div>
          <h3 style={s.sectionTitle}>{title}</h3>
          {subtitle && <p style={s.sectionSubtitle}>{subtitle}</p>}
        </div>
      </div>
      <div style={s.sectionDivider} />
    </div>
  );
}

function Field({ label, required, optional, hint, children, error }) {
  return (
    <div style={s.field}>
      {label && (
        <label style={s.label}>
          <span style={s.labelText}>{label}</span>
          {required && <span style={s.requiredBadge}>Required</span>}
          {optional && <span style={s.optionalTag}>(Optional)</span>}
          {hint && <span style={s.fieldHint}>{hint}</span>}
        </label>
      )}
      {children}
      {error && (
        <span style={s.fieldError}>
          {error}
        </span>
      )}
    </div>
  );
}

const s = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
    marginBottom: 2,
  },
  sectionTitleWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    flexShrink: 0,
  },
  sectionIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: 7,
    background: '#f1f5f9',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#0f172a',
    letterSpacing: '-0.01em',
    margin: 0,
    lineHeight: 1.2,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#64748b',
    margin: '2px 0 0 0',
    fontWeight: 400,
  },
  sectionDivider: {
    flex: 1,
    height: 1,
    background: 'linear-gradient(90deg, #e2e8f0 0%, #f1f5f9 100%)',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px 20px',
  },
  categorySupplierBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  labelText: {
    color: '#0f172a',
    fontWeight: 600,
  },
  requiredBadge: {
    fontSize: 10,
    fontWeight: 700,
    color: '#e11d48',
    background: '#ffe4e6',
    border: '1px solid #fecdd3',
    padding: '1px 6px',
    borderRadius: 4,
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
  },
  optionalTag: {
    fontSize: 11,
    fontWeight: 400,
    color: '#94a3b8',
  },
  fieldHint: {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
  },
  skuLoading: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: 500,
  },
  skuAutoBadge: {
    fontSize: 10,
    fontWeight: 700,
    background: '#ede9fe',
    color: '#7c3aed',
    padding: '1px 7px',
    borderRadius: 20,
    letterSpacing: '0.04em',
  },
  input: {
    padding: '10px 14px',
    border: '1.5px solid #cbd5e1',
    borderRadius: 9,
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    background: '#fff',
    color: '#0f172a',
  },
  fieldError: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: 500,
    marginTop: 2,
    display: 'block',
  },
  // Category segmented control
  segmented: {
    display: 'flex',
    gap: 8,
  },
  seg: {
    flex: 1,
    padding: '9px 14px',
    border: '1.5px solid #e2e8f0',
    borderRadius: 9,
    background: '#f8fafc',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  segActive: {
    background: '#ede9fe',
    borderColor: '#7c3aed',
    color: '#4f46e5',
    fontWeight: 600,
    boxShadow: '0 1px 3px rgba(124, 58, 237, 0.12)',
  },
  // Image upload
  imageArea: {
    border: '2px dashed #cbd5e1',
    borderRadius: 12,
    padding: '20px 16px',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.2s ease',
    background: '#f8fafc',
    minHeight: 110,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
  },
  imageIconCircle: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: '#ede9fe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
    marginBottom: 2,
  },
  imageHint:  { fontSize: 13, color: '#1e293b', fontWeight: 600 },
  imageHint2: { fontSize: 12, color: '#94a3b8' },
  imagePreview: {
    maxHeight: 130,
    maxWidth: '100%',
    borderRadius: 8,
    objectFit: 'contain',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  removeImg: {
    marginTop: 8,
    alignSelf: 'flex-start',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 6,
    color: '#dc2626',
    padding: '4px 10px',
    fontSize: 12,
    cursor: 'pointer',
    fontWeight: 600,
  },
  // Expiry toggle
  toggle: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    cursor: 'pointer',
    padding: '14px 16px',
    background: '#f8fafc',
    borderRadius: 11,
    border: '1.5px solid #e2e8f0',
    transition: 'all 0.15s ease',
  },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    position: 'relative',
    flexShrink: 0,
    transition: 'background 0.25s ease',
  },
  toggleThumb: {
    position: 'absolute',
    top: 2,
    width: 20,
    height: 20,
    background: '#fff',
    borderRadius: '50%',
    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
    transition: 'transform 0.25s ease',
  },
  toggleLabel: { fontSize: 13, fontWeight: 600, color: '#0f172a' },
  toggleSub:   { fontSize: 12, color: '#64748b', marginTop: 2 },
  expiryBox: {
    padding: '16px',
    background: '#f0fdf4',
    border: '1.5px solid #bbf7d0',
    borderRadius: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  expiryHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: -2,
  },
  error: {
    padding: '12px 16px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 9,
    color: '#b91c1c',
    fontSize: 13,
    fontWeight: 500,
  },
  footer: {
    display: 'flex',
    gap: 12,
    paddingTop: 16,
    marginTop: 6,
    borderTop: '1px solid #e2e8f0',
  },
};
