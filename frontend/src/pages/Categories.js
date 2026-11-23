import React, { useState, useMemo } from 'react';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import styles, { catS } from '../styles/dashboardStyles';
import { API_URL as API, API_BASE_URL as API_BASE } from '../config/api';

function getProductStatusMeta(product) {
  const stock = Number(product?.stock ?? 0);
  const reorder = Number(product?.reorder_level ?? 0);
  if (stock === 0) {
    return {
      label: 'Out of Stock',
      bg: '#fef2f2',
      color: '#b91c1c',
      border: '#fecaca',
      dot: '#ef4444',
    };
  }
  if (stock <= reorder) {
    return {
      label: 'Low Stock',
      bg: '#fffbeb',
      color: '#92400e',
      border: '#fde68a',
      dot: '#f59e0b',
    };
  }
  return {
    label: 'In Stock',
    bg: '#f0fdf4',
    color: '#065f46',
    border: '#bbf7d0',
    dot: '#22c55e',
  };
}

function CategoriesTab({ categories, products, loading, token, canCreate = true, canEdit = true, canDelete = true, onCategoryAdded, onCategoryUpdated, onCategoryDeleted }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [deletingCat, setDeletingCat] = useState(null);
  const [viewingCat, setViewingCat] = useState(null);
  const [fetchedCategoryProducts, setFetchedCategoryProducts] = useState([]);
  const [loadingCategoryProducts, setLoadingCategoryProducts] = useState(false);
  const [categoryProductsError, setCategoryProductsError] = useState(null);
  const [productSearch, setProductSearch] = useState('');
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [deleteError, setDeleteError] = useState(null);

  const hasProductsProp = Array.isArray(products);

  const productsByCategory = useMemo(() => {
    const map = new Map();
    if (!hasProductsProp) return map;
    for (const product of products) {
      if (product?.category_id == null) continue;
      const key = String(product.category_id);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(product);
    }
    return map;
  }, [hasProductsProp, products]);

  const getCategoryProductCount = (category) => {
    if (!category) return 0;
    if (hasProductsProp) {
      return (productsByCategory.get(String(category.id)) || []).length;
    }
    if (typeof category.products_count === 'number') return category.products_count;
    if (Array.isArray(category.products)) return category.products.length;
    return 0;
  };

  const openAdd = () => { setForm({ name: '', description: '' }); setFormError(null); setFieldErrors({}); setShowAddModal(true); };
  const openEdit = (cat) => { setForm({ name: cat.name, description: cat.description || '' }); setFormError(null); setFieldErrors({}); setEditingCat(cat); };

  const openCategoryDetails = async (category) => {
    setViewingCat(category);
    setProductSearch('');
    setCategoryProductsError(null);

    if (hasProductsProp) {
      setFetchedCategoryProducts([]);
      setLoadingCategoryProducts(false);
      return;
    }

    if (Array.isArray(category.products)) {
      setFetchedCategoryProducts(category.products);
      setLoadingCategoryProducts(false);
      return;
    }

    if (!token) {
      setFetchedCategoryProducts([]);
      setLoadingCategoryProducts(false);
      return;
    }

    setFetchedCategoryProducts([]);
    setLoadingCategoryProducts(true);
    try {
      const res = await fetch(`${API}/categories/${category.id}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json?.data) {
        setViewingCat(json.data);
        setFetchedCategoryProducts(Array.isArray(json.data.products) ? json.data.products : []);
      } else {
        setCategoryProductsError(json?.message || 'Could not load products for this category.');
      }
    } catch {
      setCategoryProductsError('Failed to load category products. Check your connection.');
    } finally {
      setLoadingCategoryProducts(false);
    }
  };

  const closeCategoryDetails = () => {
    setViewingCat(null);
    setProductSearch('');
    setFetchedCategoryProducts([]);
    setCategoryProductsError(null);
    setLoadingCategoryProducts(false);
  };

  const activeCategoryProducts = useMemo(() => {
    if (!viewingCat) return [];
    if (hasProductsProp) {
      return productsByCategory.get(String(viewingCat.id)) || [];
    }
    return fetchedCategoryProducts;
  }, [viewingCat, hasProductsProp, productsByCategory, fetchedCategoryProducts]);

  const filteredModalProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return activeCategoryProducts;
    return activeCategoryProducts.filter((p) =>
      p.name?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.barcode?.toLowerCase().includes(q)
    );
  }, [activeCategoryProducts, productSearch]);

  const totalUnitsInCategory = useMemo(
    () => activeCategoryProducts.reduce((sum, p) => sum + Number(p.stock ?? 0), 0),
    [activeCategoryProducts]
  );

  const lowStockInCategory = useMemo(
    () => activeCategoryProducts.filter((p) => Number(p.stock ?? 0) <= Number(p.reorder_level ?? 0)).length,
    [activeCategoryProducts]
  );

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    // Custom validation
    const errors = {};
    if (!form.name.trim()) {
      errors.name = 'Category name is required';
    } else if (form.name.trim().length < 2) {
      errors.name = 'Category name must be at least 2 characters';
    } else if (form.name.trim().length > 100) {
      errors.name = 'Category name must not exceed 100 characters';
    }

    if (form.description && form.description.length > 500) {
      errors.description = 'Description must not exceed 500 characters';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError('Please fix the errors below');
      setSaving(false);
      return;
    }

    const isEdit = !!editingCat;
    try {
      const res = await fetch(
        isEdit ? `${API}/categories/${editingCat.id}` : `${API}/categories`,
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ name: form.name.trim(), description: form.description.trim() }),
        }
      );
      const data = await res.json();
      if (!res.ok) { setFormError(data?.message || `Error ${res.status}`); }
      else {
        if (isEdit) {
          onCategoryUpdated(data.data);
          if (viewingCat && String(viewingCat.id) === String(data.data.id)) {
            setViewingCat(data.data);
          }
          setEditingCat(null);
        } else {
          onCategoryAdded(data.data);
          setShowAddModal(false);
        }
        setForm({ name: '', description: '' });
      }
    } catch {
      setFormError('Failed to save. Check your connection.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCat) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch(`${API}/categories/${deletingCat.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
      });
      if (res.ok) {
        if (viewingCat && String(viewingCat.id) === String(deletingCat.id)) {
          closeCategoryDetails();
        }
        onCategoryDeleted(deletingCat.id);
        setDeletingCat(null);
      } else {
        const data = await res.json().catch(() => ({}));
        setDeleteError(data?.message || 'Failed to delete category.');
      }
    } catch {
      setDeleteError('Error deleting category. Check your connection.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const categoryFormJsx = (onCancel) => (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={catS.label}>Category Name (Required)</label>
        <input
          style={{ ...catS.input, borderColor: fieldErrors.name ? '#dc2626' : '#e2e8f0' }}
          placeholder="e.g., Spring Mattresses, Memory Foam, Bedding Sheets, Pillows"
          value={form.name}
          onChange={e => { setForm(f => ({ ...f, name: e.target.value })); if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: null })); }}
          autoFocus
        />
        {fieldErrors.name && <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 500, marginTop: 2 }}>{fieldErrors.name}</span>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={catS.label}>Category Description (Optional)</label>
        <textarea
          style={{ ...catS.input, minHeight: 80, resize: 'vertical', borderColor: fieldErrors.description ? '#dc2626' : '#e2e8f0' }}
          placeholder="e.g., High-quality memory foam mattresses in various sizes"
          value={form.description}
          onChange={e => { setForm(f => ({ ...f, description: e.target.value })); if (fieldErrors.description) setFieldErrors(prev => ({ ...prev, description: null })); }}
        />
        {fieldErrors.description && <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 500, marginTop: 2 }}>{fieldErrors.description}</span>}
      </div>
      {formError && <div style={catS.error}>{formError}</div>}
      <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
        <Button type="button" variant="secondary" onClick={onCancel} style={{ flex: 1 }}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={saving} style={{ flex: 1 }}>
          {saving ? 'Saving…' : editingCat ? 'Save Changes' : 'Add Category'}
        </Button>
      </div>
    </form>
  );

  return (
    <div style={styles.pageContainer}>
      {/* Hero header */}
      <div className="section-hero" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 24px rgba(15,23,42,0.14)',
      }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Inventory</p>
          <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.3px' }}>Categories</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
            {categories.length} {categories.length === 1 ? 'category' : 'categories'} — click any category card to view its products
          </p>
        </div>
        {canCreate && (
          <button onClick={openAdd} style={{
            padding: '9px 20px', borderRadius: 8, border: 'none',
            background: '#4f46e5', color: '#fff', cursor: 'pointer',
            fontSize: 13, fontWeight: 600,
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#4338ca'}
            onMouseLeave={e => e.currentTarget.style.background = '#4f46e5'}>
            + Add Category
          </button>
        )}
      </div>

      {loading ? (
        <div style={styles.cardsGrid}>
          {[...Array(6)].map((_, i) => <div key={i} style={styles.skeletonCard} />)}
        </div>
      ) : categories.length === 0 ? (
        <div style={styles.contentCard}>
          <EmptyState
            title="No categories yet"
            description="Create categories to organise your products better."
            actionLabel={canCreate ? "Add First Category" : undefined}
            onAction={canCreate ? openAdd : undefined}
          />
        </div>
      ) : (
        <div style={styles.cardsGrid}>
          {categories.map((category, idx) => {
            const colors = ['#4f46e5', '#16a34a', '#0891b2', '#d97706', '#dc2626', '#7c3aed'];
            const accent = colors[idx % colors.length];
            const productCount = getCategoryProductCount(category);

            return (
              <div
                key={category.id}
                role="button"
                tabIndex={0}
                aria-label={`View products in ${category.name}`}
                data-testid={`category-card-${category.id}`}
                onClick={() => openCategoryDetails(category)}
                onKeyDown={(e) => {
                  if (e.target !== e.currentTarget) return;
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openCategoryDetails(category);
                  }
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(15, 23, 42, 0.08)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
                style={{
                  ...styles.categoryCard,
                  borderTop: `3px solid ${accent}`,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                    <h3 style={{ ...styles.categoryTitle, margin: 0 }}>{category.name}</h3>
                    <span
                      data-testid={`category-count-${category.id}`}
                      style={{
                        flexShrink: 0,
                        padding: '3px 10px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 600,
                        background: '#f1f5f9',
                        color: '#334155',
                        border: '1px solid #e2e8f0',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {productCount} {productCount === 1 ? 'product' : 'products'}
                    </span>
                  </div>
                  <p style={styles.categoryDescription}>
                    {category.description || <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>No description</span>}
                  </p>
                </div>

                <div style={{ ...styles.categoryFooter, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                  <span style={styles.categoryDate}>
                    {category.created_at ? new Date(category.created_at).toLocaleDateString() : ''}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); openEdit(category); }}
                        style={catS.editBtn}
                      >
                        Edit
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setDeleteError(null); setDeletingCat(category); }}
                        style={catS.deleteBtn}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Category Products Modal */}
      <Modal
        isOpen={!!viewingCat}
        onClose={closeCategoryDetails}
        title={viewingCat ? viewingCat.name : 'Category Products'}
        size="lg"
        maxWidth="820px"
        footer={
          <Button type="button" variant="secondary" onClick={closeCategoryDetails}>
            Close
          </Button>
        }
      >
        {viewingCat && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {viewingCat.description && (
              <p style={{ margin: 0, fontSize: 13.5, color: '#64748b', lineHeight: 1.55 }}>
                {viewingCat.description}
              </p>
            )}

            {/* Summary Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              <div style={{ padding: '14px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                  Total Products
                </div>
                <div data-testid="category-modal-total-products" style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>
                  {activeCategoryProducts.length}
                </div>
              </div>
              <div style={{ padding: '14px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                  Total Units in Stock
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>
                  {totalUnitsInCategory.toLocaleString()}
                </div>
              </div>
              <div style={{ padding: '14px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                  Low / Out of Stock
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: lowStockInCategory > 0 ? '#d97706' : '#059669' }}>
                  {lowStockInCategory}
                </div>
              </div>
            </div>

            {categoryProductsError && (
              <div style={catS.error}>{categoryProductsError}</div>
            )}

            {loadingCategoryProducts ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#64748b', fontSize: 14 }}>
                Loading products in this category…
              </div>
            ) : activeCategoryProducts.length === 0 ? (
              <EmptyState
                title="No products in this category yet"
                description={`Products assigned to "${viewingCat.name}" will appear here along with their stock levels and prices.`}
              />
            ) : (
              <>
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products in this category by name or SKU..."
                  style={{ ...catS.input, fontSize: 13.5 }}
                />

                {filteredModalProducts.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: '#64748b', fontSize: 13.5, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    No products match "{productSearch}".
                  </div>
                ) : (
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                          <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Product</th>
                          <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SKU</th>
                          <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stock</th>
                          <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price</th>
                          <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredModalProducts.map((product) => {
                          const status = getProductStatusMeta(product);
                          const imgSrc = product.image_url || (product.image_path ? `${API_BASE}/storage/${product.image_path}` : null);
                          return (
                            <tr key={product.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '11px 14px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  {imgSrc ? (
                                    <img
                                      src={imgSrc}
                                      alt={product.name}
                                      style={{ width: 34, height: 34, objectFit: 'cover', borderRadius: 7, border: '1px solid #e2e8f0', flexShrink: 0 }}
                                    />
                                  ) : (
                                    <div style={{ width: 34, height: 34, borderRadius: 7, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="18" height="18" rx="3" /><path d="M3 9h18M9 21V9" />
                                      </svg>
                                    </div>
                                  )}
                                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{product.name}</span>
                                </div>
                              </td>
                              <td style={{ padding: '11px 14px', color: '#64748b' }}>
                                {product.sku || '—'}
                              </td>
                              <td style={{ padding: '11px 14px', fontWeight: 600, color: '#0f172a' }}>
                                {product.stock}{product.unit ? ` ${product.unit}` : ''}
                              </td>
                              <td style={{ padding: '11px 14px' }}>
                                <div style={{ fontWeight: 600, color: '#0f172a' }}>
                                  UGX {parseFloat(product.price || 0).toLocaleString()}
                                </div>
                                {product.cost_price != null && (
                                  <div style={{ fontSize: 11.5, color: '#94a3b8' }}>
                                    Cost: UGX {parseFloat(product.cost_price).toLocaleString()}
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: '11px 14px' }}>
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  padding: '3px 10px',
                                  borderRadius: 20,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  background: status.bg,
                                  color: status.color,
                                  border: `1px solid ${status.border}`,
                                  whiteSpace: 'nowrap',
                                }}>
                                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: status.dot, display: 'inline-block' }} />
                                  {status.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Add Category Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Category" size="sm">
        {categoryFormJsx(() => setShowAddModal(false))}
      </Modal>

      {/* Edit Category Modal */}
      <Modal isOpen={!!editingCat} onClose={() => setEditingCat(null)} title="Edit Category" size="sm">
        {categoryFormJsx(() => setEditingCat(null))}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingCat}
        onClose={() => { setDeletingCat(null); setDeleteError(null); }}
        title="Delete Category"
        size="sm"
      >
        {deletingCat && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: '14px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10 }}>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 15, marginBottom: 4 }}>{deletingCat.name}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>
                This will permanently delete the category. Products in this category will not be deleted.
              </div>
            </div>
            {deleteError && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 }}>
                {deleteError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <Button type="button" variant="secondary"
                onClick={() => { setDeletingCat(null); setDeleteError(null); }}
                style={{ flex: 1 }}>
                Cancel
              </Button>
              <Button type="button" variant="danger" loading={deleteLoading} onClick={handleDelete} style={{ flex: 1 }}>
                {deleteLoading ? 'Deleting…' : 'Delete Category'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default CategoriesTab;
export { CategoriesTab };
