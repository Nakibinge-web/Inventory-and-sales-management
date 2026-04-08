import { useState } from 'react';
import { theme } from '../styles/theme';
import Button from './ui/Button';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export default function AddProductForm({ token, tenantId, categories, suppliers, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    name: '',
    category_id: '',
    supplier_id: '',
    stock: '',
    price: '',
    reorder_level: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API}/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          ...form,
          tenant_id: tenantId,
          stock: parseInt(form.stock),
          price: parseFloat(form.price),
          reorder_level: parseInt(form.reorder_level)
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || `Error ${res.status}`);
      } else {
        onSuccess(data.data);
        setForm({
          name: '',
          category_id: '',
          supplier_id: '',
          stock: '',
          price: '',
          reorder_level: ''
        });
      }
    } catch (err) {
      setError('Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  const formStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.lg
  };

  const inputStyles = {
    padding: theme.spacing.md,
    border: `1px solid ${theme.colors.neutral[300]}`,
    borderRadius: theme.borderRadius.lg,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily,
    transition: theme.transitions.default,
    outline: 'none'
  };

  const labelStyles = {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.neutral[700],
    marginBottom: theme.spacing.xs
  };

  const fieldStyles = {
    display: 'flex',
    flexDirection: 'column'
  };

  const errorStyles = {
    backgroundColor: theme.colors.danger[50],
    color: theme.colors.danger[700],
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    fontSize: theme.typography.fontSize.sm,
    border: `1px solid ${theme.colors.danger[200]}`
  };

  const footerStyles = {
    display: 'flex',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg
  };

  return (
    <form onSubmit={submit} style={formStyles}>
      <div style={fieldStyles}>
        <label style={labelStyles}>Product Name</label>
        <input
          style={inputStyles}
          name="name"
          placeholder="Enter product name"
          value={form.name}
          onChange={handle}
          required
        />
      </div>

      <div style={fieldStyles}>
        <label style={labelStyles}>Category</label>
        <select
          style={inputStyles}
          name="category_id"
          value={form.category_id}
          onChange={handle}
          required
        >
          <option value="">Select Category</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div style={fieldStyles}>
        <label style={labelStyles}>Supplier</label>
        <select
          style={inputStyles}
          name="supplier_id"
          value={form.supplier_id}
          onChange={handle}
          required
        >
          <option value="">Select Supplier</option>
          {suppliers.map(supplier => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.lg }}>
        <div style={fieldStyles}>
          <label style={labelStyles}>Initial Stock</label>
          <input
            style={inputStyles}
            name="stock"
            type="number"
            placeholder="0"
            value={form.stock}
            onChange={handle}
            min="0"
            required
          />
        </div>

        <div style={fieldStyles}>
          <label style={labelStyles}>Reorder Level</label>
          <input
            style={inputStyles}
            name="reorder_level"
            type="number"
            placeholder="0"
            value={form.reorder_level}
            onChange={handle}
            min="0"
            required
          />
        </div>
      </div>

      <div style={fieldStyles}>
        <label style={labelStyles}>Selling Price</label>
        <input
          style={inputStyles}
          name="price"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={form.price}
          onChange={handle}
          min="0"
          required
        />
      </div>

      {error && (
        <div style={errorStyles}>
          {error}
        </div>
      )}

      <div style={footerStyles}>
        <Button type="button" variant="secondary" onClick={onCancel} style={{ flex: 1 }}>
          Cancel
        </Button>
        <Button type="submit" variant="success" loading={loading} style={{ flex: 1 }}>
          Add Product
        </Button>
      </div>
    </form>
  );
}