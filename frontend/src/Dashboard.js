import { useState, useEffect, useCallback } from 'react';
import { theme } from './styles/theme';
import DashboardCard from './components/ui/DashboardCard';
import DataTable from './components/ui/DataTable';
import Badge from './components/ui/Badge';
import EmptyState from './components/ui/EmptyState';
import Button from './components/ui/Button';
import Modal from './components/ui/Modal';
import QuickActions from './components/ui/QuickActions';
import AddProductForm from './components/AddProductForm';
import EditProductForm from './components/EditProductForm';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export default function Dashboard({ user, token, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState({
    products: [],
    categories: [],
    suppliers: [],
    sales: [],
    purchases: [],
    lowStock: [],
    stats: {
      totalProducts: 0,
      totalSales: 0,
      totalPurchases: 0,
      lowStockCount: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      const [productsRes, categoriesRes, suppliersRes, salesRes, purchasesRes, lowStockRes] = await Promise.all([
        fetch(`${API}/products?tenant_id=${user.tenant_id}`, { headers }),
        fetch(`${API}/categories?tenant_id=${user.tenant_id}`, { headers }),
        fetch(`${API}/suppliers?tenant_id=${user.tenant_id}`, { headers }),
        fetch(`${API}/sales?tenant_id=${user.tenant_id}`, { headers }),
        fetch(`${API}/purchases?tenant_id=${user.tenant_id}`, { headers }),
        fetch(`${API}/products/low-stock?tenant_id=${user.tenant_id}`, { headers })
      ]);

      const products = await productsRes.json();
      const categories = await categoriesRes.json();
      const suppliers = await suppliersRes.json();
      const sales = await salesRes.json();
      const purchases = await purchasesRes.json();
      const lowStock = await lowStockRes.json();

      setData({
        products: products.data || [],
        categories: categories.data || [],
        suppliers: suppliers.data || [],
        sales: sales.data || [],
        purchases: purchases.data || [],
        lowStock: lowStock.data || [],
        stats: {
          totalProducts: (products.data || []).length,
          totalSales: (sales.data || []).reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0),
          totalPurchases: (purchases.data || []).reduce((sum, purchase) => sum + parseFloat(purchase.total_amount || 0), 0),
          lowStockCount: (lowStock.data || []).length
        }
      });
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  }, [user.tenant_id, token]);

  const handleAddProduct = (newProduct) => {
    setData(prev => ({
      ...prev,
      products: [...prev.products, newProduct],
      stats: {
        ...prev.stats,
        totalProducts: prev.stats.totalProducts + 1
      }
    }));
    setShowAddProduct(false);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: '📊', color: 'primary' },
    { id: 'products', label: 'Products', icon: '📦', color: 'success' },
    { id: 'categories', label: 'Categories', icon: '🏷️', color: 'warning' },
    { id: 'suppliers', label: 'Suppliers', icon: '🏭', color: 'neutral' },
    { id: 'sales', label: 'Sales', icon: '💰', color: 'success' },
    { id: 'purchases', label: 'Purchases', icon: '🛒', color: 'primary' },
    { id: 'reports', label: 'Reports', icon: '📈', color: 'danger' }
  ];

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div style={styles.dashboard}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logoContainer}>
            <span style={styles.logoIcon}>📊</span>
            <h1 style={styles.logo}>InventoryPro</h1>
          </div>
          <Badge variant="primary" size="sm">
            {user.tenant?.name || 'Business'}
          </Badge>
        </div>
        
        <div style={styles.headerCenter}>
          <div style={styles.searchContainer}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              style={styles.searchInput}
              type="text"
              placeholder="Search products, sales, suppliers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div style={styles.headerRight}>
          <div style={styles.notificationIcon}>🔔</div>
          <div style={styles.userInfo}>
            <div style={styles.userAvatar}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={styles.userDetails}>
              <span style={styles.userName}>{user.name}</span>
              <Badge variant="neutral" size="sm">{user.role}</Badge>
            </div>
          </div>
          <Button variant="danger" size="sm" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </header>

      <div style={styles.container}>
        {/* Sidebar */}
        <nav style={styles.sidebar}>
          <div style={styles.sidebarContent}>
            {menuItems.map(item => (
              <button
                key={item.id}
                style={{
                  ...styles.menuItem,
                  ...(activeTab === item.id ? styles.menuItemActive : {})
                }}
                onClick={() => setActiveTab(item.id)}
              >
                <span style={styles.menuIcon}>{item.icon}</span>
                <span style={styles.menuLabel}>{item.label}</span>
                {activeTab === item.id && <div style={styles.activeIndicator}></div>}
              </button>
            ))}
          </div>
        </nav>

        {/* Main Content */}
        <main style={styles.main}>
          {error && (
            <div style={styles.errorBanner}>
              <span style={styles.errorIcon}>⚠️</span>
              <span>{error}</span>
              <Button variant="secondary" size="sm" onClick={fetchData}>
                Retry
              </Button>
            </div>
          )}

          {activeTab === 'overview' && <OverviewTab data={data} loading={loading} />}
          {activeTab === 'products' && (
            <ProductsTab
              products={data.products}
              onAddProduct={() => setShowAddProduct(true)}
              loading={loading}
              token={token}
              user={user}
              categories={data.categories}
              suppliers={data.suppliers}
              onProductDeleted={(id) => setData(prev => ({ ...prev, products: prev.products.filter(p => p.id !== id) }))}
              onProductUpdated={(updated) => setData(prev => ({
                ...prev,
                products: prev.products.map(p => p.id === updated.id ? updated : p)
              }))}
            />
          )}
          {activeTab === 'categories' && (
            <CategoriesTab
              categories={data.categories}
              loading={loading}
              token={token}
              onCategoryAdded={cat => setData(prev => ({ ...prev, categories: [...prev.categories, cat] }))}
            />
          )}
          {activeTab === 'suppliers' && <SuppliersTab suppliers={data.suppliers} loading={loading} />}
          {activeTab === 'sales' && <SalesTab sales={data.sales} loading={loading} />}
          {activeTab === 'purchases' && <PurchasesTab purchases={data.purchases} loading={loading} />}
          {activeTab === 'reports' && <ReportsTab data={data} loading={loading} />}
        </main>
      </div>

      {/* Add Product Modal */}
      <Modal
        isOpen={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        title="Add New Product"
        size="lg"
      >
        <AddProductForm
          token={token}
          tenantId={user.tenant_id}
          categories={data.categories}
          suppliers={data.suppliers}
          onSuccess={handleAddProduct}
          onCancel={() => setShowAddProduct(false)}
        />
      </Modal>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ data, loading }) {
  const quickActions = [
    {
      id: 'new-sale',
      icon: '💰',
      title: 'New Sale',
      description: 'Process a new sale transaction',
      onClick: () => console.log('New Sale')
    },
    {
      id: 'add-product',
      icon: '📦',
      title: 'Add Product',
      description: 'Add a new product to inventory',
      onClick: () => console.log('Add Product')
    },
    {
      id: 'add-supplier',
      icon: '🏭',
      title: 'Add Supplier',
      description: 'Register a new supplier',
      onClick: () => console.log('Add Supplier')
    },
    {
      id: 'record-purchase',
      icon: '🛒',
      title: 'Record Purchase',
      description: 'Record a new purchase order',
      onClick: () => console.log('Record Purchase')
    }
  ];

  const recentSalesColumns = [
    { key: 'sale_date', title: 'Date', type: 'date' },
    { key: 'total_amount', title: 'Amount', type: 'currency' },
    { key: 'payment_method', title: 'Payment', render: (value) => <Badge variant="neutral" size="sm">{value}</Badge> },
    { key: 'user', title: 'Cashier', render: (value) => value?.name || 'N/A' }
  ];

  return (
    <div style={styles.pageContainer}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Dashboard Overview</h1>
          <p style={styles.pageSubtitle}>Welcome back! Here's what's happening with your business today.</p>
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions actions={quickActions} />

      {/* KPI Cards */}
      <div style={styles.kpiGrid}>
        <DashboardCard
          title="Total Products"
          value={data.stats.totalProducts}
          subtitle="Items in inventory"
          icon="📦"
          color="primary"
          trend="up"
          trendValue="+12% from last month"
          loading={loading}
        />
        <DashboardCard
          title="Total Sales"
          value={`UGX ${data.stats.totalSales.toLocaleString()}`}
          subtitle="Revenue generated"
          icon="💰"
          color="success"
          trend="up"
          trendValue="+8.2% from last month"
          loading={loading}
        />
        <DashboardCard
          title="Total Purchases"
          value={`UGX ${data.stats.totalPurchases.toLocaleString()}`}
          subtitle="Money invested"
          icon="🛒"
          color="warning"
          trend="down"
          trendValue="-3.1% from last month"
          loading={loading}
        />
        <DashboardCard
          title="Low Stock Alerts"
          value={data.stats.lowStockCount}
          subtitle="Items need reordering"
          icon="⚠️"
          color="danger"
          trend={data.stats.lowStockCount > 0 ? "up" : "neutral"}
          trendValue={data.stats.lowStockCount > 0 ? "Needs attention" : "All good"}
          loading={loading}
        />
      </div>

      {/* Recent Activity & Alerts */}
      <div style={styles.contentGrid}>
        <div style={styles.contentCard}>
          <h3 style={styles.cardTitle}>Recent Sales</h3>
          <DataTable
            columns={recentSalesColumns}
            data={data.sales.slice(0, 5)}
            loading={loading}
            emptyStateProps={{
              icon: '💰',
              title: 'No sales yet',
              description: 'Start processing sales to see them here.',
              actionLabel: 'Process First Sale',
              onAction: () => console.log('Process Sale')
            }}
          />
        </div>

        {data.lowStock.length > 0 && (
          <div style={styles.alertCard}>
            <div style={styles.alertHeader}>
              <h3 style={styles.alertTitle}>⚠️ Low Stock Alert</h3>
              <Badge variant="danger" size="sm">{data.lowStock.length} items</Badge>
            </div>
            <div style={styles.alertList}>
              {data.lowStock.slice(0, 5).map(product => (
                <div key={product.id} style={styles.alertItem}>
                  <div>
                    <span style={styles.alertItemName}>{product.name}</span>
                    <span style={styles.alertItemStock}>
                      Stock: {product.stock} (Reorder at: {product.reorder_level})
                    </span>
                  </div>
                  <Badge variant="danger" size="sm">Low</Badge>
                </div>
              ))}
            </div>
            {data.lowStock.length > 5 && (
              <div style={styles.alertFooter}>
                <Button variant="secondary" size="sm">
                  View All ({data.lowStock.length})
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Products Tab Component
function ProductsTab({ products, onAddProduct, loading, token, user, onProductDeleted, categories, suppliers, onProductUpdated }) {
  const API_BASE = process.env.REACT_APP_API_URL
    ? process.env.REACT_APP_API_URL.replace('/api', '')
    : 'http://localhost:8000';

  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [showExpiry, setShowExpiry] = useState(false);
  const [filters, setFilters] = useState({ search: '', category: '', status: '' });

  const setFilter = (key, value) => setFilters(f => ({ ...f, [key]: value }));

  const getStockStatus = (stock, reorder) => {
    const s = Number(stock ?? 0), r = Number(reorder ?? 0);
    if (s === 0)  return 'out';
    if (s <= r)   return 'low';
    return 'in';
  };

  const filteredProducts = products.filter(p => {
    const search = filters.search.toLowerCase();
    if (search && !p.name?.toLowerCase().includes(search) && !p.sku?.toLowerCase().includes(search)) return false;
    if (filters.category && String(p.category_id) !== String(filters.category)) return false;
    if (filters.status && getStockStatus(p.stock, p.reorder_level) !== filters.status) return false;
    return true;
  });

  const handleDelete = async () => {
    if (!deletingProduct) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch(`${API}/products/${deletingProduct.id}?tenant_id=${user.tenant_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      if (res.ok) {
        onProductDeleted(deletingProduct.id);
        setDeletingProduct(null);
      } else {
        const data = await res.json().catch(() => ({}));
        setDeleteError(data?.message || 'Failed to delete product.');
      }
    } catch {
      setDeleteError('Error deleting product. Check your connection.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      key: 'image_path',
      title: 'Image',
      render: (value) => value
        ? <img src={`${API_BASE}/storage/${value}`} alt="product"
            style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid #e2e8f0' }} />
        : <div style={{ width: 40, height: 40, borderRadius: 6, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📦</div>
    },
    { key: 'name', title: 'Product Name' },
    { key: 'sku', title: 'SKU', render: (value) => value || <span style={{ color: '#94a3b8' }}>—</span> },
    {
      key: 'category',
      title: 'Category',
      render: (value) => value?.name ? <Badge variant="neutral" size="sm">{value.name}</Badge> : 'N/A'
    },
    {
      key: 'stock',
      title: 'Stock',
      render: (value, row) => (
        <span>{value}{row.unit ? ` ${row.unit}` : ''}</span>
      )
    },
    {
      key: 'reorder_level',
      title: 'Reorder Level',
      render: (value) => value ?? '—'
    },
    {
      key: 'price',
      title: 'Price',
      render: (value, row) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>UGX {parseFloat(value || 0).toLocaleString()}</div>
          {row.cost_price != null && (
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
              Cost: UGX {parseFloat(row.cost_price).toLocaleString()}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      title: 'Status',
      render: (_, row) => {
        const stock = Number(row.stock ?? 0);
        const reorder = Number(row.reorder_level ?? 0);
        if (stock === 0) {
          return (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca'
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
              Out of Stock
            </span>
          );
        }
        if (stock <= reorder) {
          return (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a'
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
              Low Stock
            </span>
          );
        }
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: '#f0fdf4', color: '#065f46', border: '1px solid #bbf7d0'
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
            In Stock
          </span>
        );
      }
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setEditingProduct(row)}
            style={{
              padding: '4px 12px', borderRadius: 6, border: '1px solid #3b82f6',
              background: '#eff6ff', color: '#3b82f6', cursor: 'pointer', fontSize: 13, fontWeight: 500
            }}
          >
            Edit
          </button>
          <button
            onClick={() => { setDeleteError(null); setDeletingProduct(row); }}
            style={{
              padding: '4px 12px', borderRadius: 6, border: '1px solid #ef4444',
              background: '#fef2f2', color: '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 500
            }}
          >
            Delete
          </button>
        </div>
      )
    }
  ];

  return (
    <div style={styles.pageContainer}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Products</h1>
          <p style={styles.pageSubtitle}>Manage your inventory and track stock levels</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="primary" onClick={() => setShowExpiry(true)} icon="⏳" iconPosition="left">
            View Expiry Goods
          </Button>
          <Button variant="success" onClick={onAddProduct} icon="+" iconPosition="left">
            Add Product
          </Button>
        </div>
      </div>

      <div style={styles.contentCard}>
        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          <input
            style={fS.input}
            placeholder="🔍  Search by name or SKU…"
            value={filters.search}
            onChange={e => setFilter('search', e.target.value)}
          />
          <select style={fS.select} value={filters.category} onChange={e => setFilter('category', e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select style={fS.select} value={filters.status} onChange={e => setFilter('status', e.target.value)}>
            <option value="">All Statuses</option>
            <option value="in">🟢 In Stock</option>
            <option value="low">🟡 Low Stock</option>
            <option value="out">🔴 Out of Stock</option>
          </select>
          {(filters.search || filters.category || filters.status) && (
            <button style={fS.clear} onClick={() => setFilters({ search: '', category: '', status: '' })}>
              ✕ Clear filters
            </button>
          )}
        </div>

        <DataTable
          columns={columns}
          data={filteredProducts}
          loading={loading}
          emptyStateProps={{
            icon: '📦',
            title: filters.search || filters.category || filters.status ? 'No products match your filters' : 'No products yet',
            description: filters.search || filters.category || filters.status ? 'Try adjusting or clearing your filters.' : 'Start building your inventory by adding your first product.',
            actionLabel: filters.search || filters.category || filters.status ? 'Clear Filters' : 'Add First Product',
            onAction: filters.search || filters.category || filters.status ? () => setFilters({ search: '', category: '', status: '' }) : onAddProduct
          }}
        />
      </div>

      {/* Edit Product Modal */}
      <Modal
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        title="Edit Product"
        size="lg"
      >
        {editingProduct && (
          <EditProductForm
            token={token}
            product={editingProduct}
            categories={categories}
            suppliers={suppliers}
            onSuccess={(updated) => {
              onProductUpdated(updated);
              setEditingProduct(null);
            }}
            onCancel={() => setEditingProduct(null)}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingProduct}
        onClose={() => { setDeletingProduct(null); setDeleteError(null); }}
        title="Delete Product"
        size="sm"
      >
        {deletingProduct && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px', background: '#fef2f2',
              border: '1px solid #fecaca', borderRadius: 10
            }}>
              <span style={{ fontSize: 28 }}>🗑️</span>
              <div>
                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 15 }}>
                  {deletingProduct.name}
                </div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                  This action cannot be undone. The product and all its data will be permanently removed.
                </div>
              </div>
            </div>

            {deleteError && (
              <div style={{
                padding: '10px 14px', background: '#fef2f2',
                border: '1px solid #fecaca', borderRadius: 8,
                color: '#b91c1c', fontSize: 13
              }}>
                ⚠️ {deleteError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => { setDeletingProduct(null); setDeleteError(null); }}
                style={{ flex: 1 }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                loading={deleteLoading}
                onClick={handleDelete}
                style={{ flex: 1 }}
              >
                {deleteLoading ? 'Deleting…' : 'Delete Product'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Expiry Goods Modal */}
      <Modal
        isOpen={showExpiry}
        onClose={() => setShowExpiry(false)}
        title="⏳ Expiry Goods Tracker"
        size="lg"
      >
        <ExpiryGoodsView products={products} />
      </Modal>
    </div>
  );
}

// Expiry Goods View Component
function ExpiryGoodsView({ products }) {
  const now = new Date();

  const expiryProducts = products
    .filter(p => p.track_expiry && p.expiry_date)
    .map(p => {
      const expiry = new Date(p.expiry_date);
      const diffMs = expiry - now;
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return { ...p, diffDays, expiry };
    })
    .sort((a, b) => a.diffDays - b.diffDays);

  const getStatus = (days) => {
    if (days < 0)   return { label: 'Expired',        variant: 'danger',  color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' };
    if (days <= 7)  return { label: 'Critical',       variant: 'danger',  color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' };
    if (days <= 30) return { label: 'Expiring Soon',  variant: 'warning', color: '#92400e', bg: '#fffbeb', border: '#fde68a' };
    return              { label: 'Good',              variant: 'success', color: '#065f46', bg: '#f0fdf4', border: '#bbf7d0' };
  };

  const getTimeLabel = (days) => {
    if (days < 0)  return `Expired ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} ago`;
    if (days === 0) return 'Expires today!';
    if (days === 1) return '1 day remaining';
    if (days < 30)  return `${days} days remaining`;
    const months = Math.floor(days / 30);
    const rem    = days % 30;
    return rem > 0 ? `${months}mo ${rem}d remaining` : `${months} month${months !== 1 ? 's' : ''} remaining`;
  };

  if (expiryProducts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <div style={{ fontWeight: 600, fontSize: 16, color: '#0f172a' }}>No expiry-tracked products</div>
        <div style={{ fontSize: 13, marginTop: 6 }}>
          Enable "Track Expiry" on a product to monitor it here.
        </div>
      </div>
    );
  }

  const expired  = expiryProducts.filter(p => p.diffDays < 0).length;
  const critical = expiryProducts.filter(p => p.diffDays >= 0 && p.diffDays <= 7).length;
  const soon     = expiryProducts.filter(p => p.diffDays > 7 && p.diffDays <= 30).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Summary pills */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {expired  > 0 && <span style={exS.pill('#fef2f2','#fecaca','#b91c1c')}>🚫 {expired} Expired</span>}
        {critical > 0 && <span style={exS.pill('#fef2f2','#fecaca','#dc2626')}>🔴 {critical} Critical (≤7 days)</span>}
        {soon     > 0 && <span style={exS.pill('#fffbeb','#fde68a','#92400e')}>🟡 {soon} Expiring Soon (≤30 days)</span>}
        <span style={exS.pill('#f0fdf4','#bbf7d0','#065f46')}>
          ✅ {expiryProducts.length - expired - critical - soon} Good
        </span>
      </div>

      {/* Product rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 420, overflowY: 'auto' }}>
        {expiryProducts.map(p => {
          const st = getStatus(p.diffDays);
          return (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 14px', borderRadius: 10,
              background: st.bg, border: `1px solid ${st.border}`,
            }}>
              {/* Status bar */}
              <div style={{
                width: 4, alignSelf: 'stretch', borderRadius: 4,
                background: st.color, flexShrink: 0,
              }} />

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {p.name}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  {p.sku ? `SKU: ${p.sku} · ` : ''}
                  Stock: {p.stock}{p.unit ? ` ${p.unit}` : ''} ·{' '}
                  Expires: {new Date(p.expiry_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  {p.manufacture_date && ` · Mfg: ${new Date(p.manufacture_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`}
                </div>
              </div>

              {/* Time remaining badge */}
              <div style={{
                flexShrink: 0, padding: '4px 12px', borderRadius: 20,
                background: st.color, color: '#fff',
                fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
              }}>
                {getTimeLabel(p.diffDays)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const exS = {
  pill: (bg, border, color) => ({
    padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
    background: bg, border: `1px solid ${border}`, color,
  }),
};

const fS = {
  input: {
    flex: '1 1 200px', padding: '8px 12px', border: '1.5px solid #e2e8f0',
    borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none',
    background: '#fff', color: '#0f172a', minWidth: 0,
  },
  select: {
    flex: '0 0 auto', padding: '8px 12px', border: '1.5px solid #e2e8f0',
    borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none',
    background: '#fff', color: '#0f172a', cursor: 'pointer',
  },
  clear: {
    padding: '8px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8,
    background: '#f8fafc', color: '#64748b', fontSize: 13, cursor: 'pointer',
    fontWeight: 500, whiteSpace: 'nowrap',
  },
};

// Categories Tab Component
function CategoriesTab({ categories, loading, token, onCategoryAdded }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState({ name: '', description: '' });
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState(null);

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch(`${API}/categories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data?.message || `Error ${res.status}`); }
      else {
        onCategoryAdded(data.data);
        setForm({ name: '', description: '' });
        setShowModal(false);
      }
    } catch {
      setFormError('Failed to save. Check your connection.');
    } finally {
      setSaving(false);
    }
  };

  const openModal = () => { setForm({ name: '', description: '' }); setFormError(null); setShowModal(true); };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Categories</h1>
          <p style={styles.pageSubtitle}>Organize your products into logical groups</p>
        </div>
        <Button variant="primary" icon="+" iconPosition="left" onClick={openModal}>
          Add Category
        </Button>
      </div>

      {loading ? (
        <div style={styles.cardsGrid}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={styles.skeletonCard}></div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div style={styles.contentCard}>
          <EmptyState
            icon="🏷️"
            title="No categories yet"
            description="Create categories to organize your products better."
            actionLabel="Add First Category"
            onAction={openModal}
          />
        </div>
      ) : (
        <div style={styles.cardsGrid}>
          {categories.map(category => (
            <div key={category.id} style={styles.categoryCard}>
              <div style={styles.categoryIcon}>🏷️</div>
              <h3 style={styles.categoryTitle}>{category.name}</h3>
              <p style={styles.categoryDescription}>
                {category.description || 'No description provided'}
              </p>
              <div style={styles.categoryFooter}>
                <span style={styles.categoryDate}>
                  Created {new Date(category.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Category Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Category" size="sm">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={catS.label}>Category Name *</label>
            <input
              style={catS.input}
              placeholder="e.g. Electronics"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={catS.label}>Description (optional)</label>
            <textarea
              style={{ ...catS.input, minHeight: 80, resize: 'vertical' }}
              placeholder="Brief description of this category…"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          {formError && <div style={catS.error}>⚠️ {formError}</div>}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saving} style={{ flex: 1 }}>
              {saving ? 'Saving…' : 'Add Category'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

const catS = {
  label: { fontSize: 12, fontWeight: 600, color: '#374151', letterSpacing: '0.03em', textTransform: 'uppercase' },
  input: {
    padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8,
    fontSize: 14, fontFamily: 'inherit', outline: 'none', width: '100%',
    boxSizing: 'border-box', background: '#fff', color: '#0f172a',
  },
  error: {
    padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: 8, color: '#b91c1c', fontSize: 13,
  },
};

// Suppliers Tab Component
function SuppliersTab({ suppliers, loading }) {
  return (
    <div style={styles.pageContainer}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Suppliers</h1>
          <p style={styles.pageSubtitle}>Manage your vendor relationships and contacts</p>
        </div>
        <Button variant="primary" icon="+" iconPosition="left">
          Add Supplier
        </Button>
      </div>

      {loading ? (
        <div style={styles.cardsGrid}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={styles.skeletonCard}></div>
          ))}
        </div>
      ) : suppliers.length === 0 ? (
        <div style={styles.contentCard}>
          <EmptyState
            icon="🏭"
            title="No suppliers yet"
            description="Add suppliers to track where you purchase your products."
            actionLabel="Add First Supplier"
            onAction={() => console.log('Add Supplier')}
          />
        </div>
      ) : (
        <div style={styles.cardsGrid}>
          {suppliers.map(supplier => (
            <div key={supplier.id} style={styles.supplierCard}>
              <div style={styles.supplierHeader}>
                <div style={styles.supplierIcon}>🏭</div>
                <h3 style={styles.supplierName}>{supplier.name}</h3>
              </div>
              <div style={styles.supplierDetails}>
                <div style={styles.supplierDetail}>
                  <span style={styles.supplierDetailIcon}>📞</span>
                  <span>{supplier.contact || 'No contact'}</span>
                </div>
                <div style={styles.supplierDetail}>
                  <span style={styles.supplierDetailIcon}>📧</span>
                  <span>{supplier.email || 'No email'}</span>
                </div>
                <div style={styles.supplierDetail}>
                  <span style={styles.supplierDetailIcon}>📍</span>
                  <span>{supplier.address || 'No address'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Sales Tab Component
function SalesTab({ sales, loading }) {
  const columns = [
    { key: 'sale_date', title: 'Date', type: 'date' },
    { key: 'total_amount', title: 'Amount', type: 'currency' },
    { 
      key: 'payment_method', 
      title: 'Payment Method', 
      render: (value) => <Badge variant="success" size="sm">{value}</Badge>
    },
    { 
      key: 'sale_items', 
      title: 'Items', 
      render: (value) => `${value?.length || 0} items`
    },
    { 
      key: 'user', 
      title: 'Cashier', 
      render: (value) => value?.name || 'N/A'
    }
  ];

  return (
    <div style={styles.pageContainer}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Sales</h1>
          <p style={styles.pageSubtitle}>Track all your sales transactions and revenue</p>
        </div>
        <Button variant="success" icon="+" iconPosition="left">
          New Sale
        </Button>
      </div>

      <div style={styles.contentCard}>
        <DataTable
          columns={columns}
          data={sales}
          loading={loading}
          emptyStateProps={{
            icon: '💰',
            title: 'No sales yet',
            description: 'Start processing sales to see transaction history here.',
            actionLabel: 'Process First Sale',
            onAction: () => console.log('New Sale')
          }}
        />
      </div>
    </div>
  );
}

// Purchases Tab Component
function PurchasesTab({ purchases, loading }) {
  const columns = [
    { key: 'purchase_date', title: 'Date', type: 'date' },
    { key: 'total_amount', title: 'Amount', type: 'currency' },
    { 
      key: 'supplier', 
      title: 'Supplier', 
      render: (value) => value?.name ? <Badge variant="primary" size="sm">{value.name}</Badge> : 'N/A'
    },
    { 
      key: 'purchase_items', 
      title: 'Items', 
      render: (value) => `${value?.length || 0} items`
    }
  ];

  return (
    <div style={styles.pageContainer}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Purchases</h1>
          <p style={styles.pageSubtitle}>Track inventory purchases and supplier orders</p>
        </div>
        <Button variant="primary" icon="+" iconPosition="left">
          Record Purchase
        </Button>
      </div>

      <div style={styles.contentCard}>
        <DataTable
          columns={columns}
          data={purchases}
          loading={loading}
          emptyStateProps={{
            icon: '🛒',
            title: 'No purchases yet',
            description: 'Record purchases from suppliers to track inventory costs.',
            actionLabel: 'Record First Purchase',
            onAction: () => console.log('New Purchase')
          }}
        />
      </div>
    </div>
  );
}

// Reports Tab Component
function ReportsTab({ data, loading }) {
  const totalRevenue = data.stats.totalSales - data.stats.totalPurchases;
  
  return (
    <div style={styles.pageContainer}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Reports & Analytics</h1>
          <p style={styles.pageSubtitle}>Analyze your business performance and trends</p>
        </div>
        <Button variant="primary" icon="📊" iconPosition="left">
          Generate Report
        </Button>
      </div>

      <div style={styles.reportsGrid}>
        <div style={styles.reportCard}>
          <h3 style={styles.reportTitle}>Financial Summary</h3>
          <div style={styles.reportMetrics}>
            <div style={styles.reportMetric}>
              <span style={styles.reportLabel}>Total Sales</span>
              <span style={styles.reportValue}>UGX {data.stats.totalSales.toLocaleString()}</span>
            </div>
            <div style={styles.reportMetric}>
              <span style={styles.reportLabel}>Total Purchases</span>
              <span style={styles.reportValue}>UGX {data.stats.totalPurchases.toLocaleString()}</span>
            </div>
            <div style={styles.reportMetric}>
              <span style={styles.reportLabel}>Net Revenue</span>
              <span style={{
                ...styles.reportValue,
                color: totalRevenue >= 0 ? theme.colors.success[600] : theme.colors.danger[600]
              }}>
                UGX {totalRevenue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div style={styles.reportCard}>
          <h3 style={styles.reportTitle}>Inventory Summary</h3>
          <div style={styles.reportMetrics}>
            <div style={styles.reportMetric}>
              <span style={styles.reportLabel}>Total Products</span>
              <span style={styles.reportValue}>{data.stats.totalProducts}</span>
            </div>
            <div style={styles.reportMetric}>
              <span style={styles.reportLabel}>Categories</span>
              <span style={styles.reportValue}>{data.categories.length}</span>
            </div>
            <div style={styles.reportMetric}>
              <span style={styles.reportLabel}>Suppliers</span>
              <span style={styles.reportValue}>{data.suppliers.length}</span>
            </div>
            <div style={styles.reportMetric}>
              <span style={styles.reportLabel}>Low Stock Items</span>
              <span style={{
                ...styles.reportValue,
                color: data.stats.lowStockCount > 0 ? theme.colors.danger[600] : theme.colors.success[600]
              }}>
                {data.stats.lowStockCount}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  // Layout Styles
  dashboard: {
    minHeight: '100vh',
    backgroundColor: theme.colors.neutral[50],
    fontFamily: theme.typography.fontFamily,
    display: 'flex',
    flexDirection: 'column'
  },

  // Loading Styles
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: theme.spacing.lg,
    backgroundColor: theme.colors.neutral[50]
  },

  spinner: {
    width: '48px',
    height: '48px',
    border: `4px solid ${theme.colors.neutral[200]}`,
    borderTop: `4px solid ${theme.colors.primary[600]}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },

  loadingText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.neutral[600],
    margin: 0
  },

  // Header Styles
  header: {
    backgroundColor: '#ffffff',
    padding: `${theme.spacing.lg} ${theme.spacing['2xl']}`,
    borderBottom: `1px solid ${theme.colors.neutral[200]}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: theme.shadows.sm,
    position: 'sticky',
    top: 0,
    zIndex: 100
  },

  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.lg
  },

  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.sm
  },

  logoIcon: {
    fontSize: '32px'
  },

  logo: {
    margin: 0,
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.neutral[900],
    background: `linear-gradient(135deg, ${theme.colors.primary[600]}, ${theme.colors.primary[700]})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },

  headerCenter: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    maxWidth: '500px',
    margin: `0 ${theme.spacing.xl}`
  },

  searchContainer: {
    position: 'relative',
    width: '100%'
  },

  searchIcon: {
    position: 'absolute',
    left: theme.spacing.md,
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '16px',
    color: theme.colors.neutral[400]
  },

  searchInput: {
    width: '100%',
    padding: `${theme.spacing.sm} ${theme.spacing.md} ${theme.spacing.sm} ${theme.spacing['2xl']}`,
    border: `1px solid ${theme.colors.neutral[300]}`,
    borderRadius: theme.borderRadius.lg,
    fontSize: theme.typography.fontSize.sm,
    backgroundColor: theme.colors.neutral[50],
    transition: theme.transitions.default,
    outline: 'none'
  },

  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.lg
  },

  notificationIcon: {
    fontSize: '20px',
    cursor: 'pointer',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    transition: theme.transitions.default
  },

  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.md
  },

  userAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: theme.colors.primary[600],
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold
  },

  userDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.xs
  },

  userName: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.neutral[900]
  },

  // Container & Layout
  container: {
    display: 'flex',
    flex: 1,
    minHeight: 0
  },

  // Sidebar Styles
  sidebar: {
    width: '280px',
    backgroundColor: '#ffffff',
    borderRight: `1px solid ${theme.colors.neutral[200]}`,
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky',
    top: '73px',
    height: 'calc(100vh - 73px)',
    overflow: 'auto'
  },

  sidebarContent: {
    padding: theme.spacing.lg,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.xs
  },

  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.neutral[600],
    textAlign: 'left',
    borderRadius: theme.borderRadius.lg,
    transition: theme.transitions.default,
    position: 'relative',
    width: '100%'
  },

  menuItemActive: {
    backgroundColor: theme.colors.primary[50],
    color: theme.colors.primary[700],
    fontWeight: theme.typography.fontWeight.semibold
  },

  menuIcon: {
    fontSize: '20px',
    width: '24px',
    textAlign: 'center'
  },

  menuLabel: {
    flex: 1
  },

  activeIndicator: {
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    width: '3px',
    height: '20px',
    backgroundColor: theme.colors.primary[600],
    borderRadius: theme.borderRadius.sm
  },

  // Main Content
  main: {
    flex: 1,
    padding: theme.spacing['2xl'],
    overflow: 'auto',
    backgroundColor: theme.colors.neutral[50]
  },

  // Error Banner
  errorBanner: {
    backgroundColor: theme.colors.danger[50],
    color: theme.colors.danger[700],
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.xl,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.md,
    border: `1px solid ${theme.colors.danger[200]}`
  },

  errorIcon: {
    fontSize: '20px'
  },

  // Page Layout
  pageContainer: {
    maxWidth: '1400px',
    margin: '0 auto'
  },

  pageHeader: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: theme.spacing['2xl']
  },

  pageTitle: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.neutral[900],
    margin: `0 0 ${theme.spacing.xs} 0`
  },

  pageSubtitle: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.neutral[500],
    margin: 0
  },

  // Content Cards
  contentCard: {
    backgroundColor: '#ffffff',
    borderRadius: theme.borderRadius.xl,
    boxShadow: theme.shadows.md,
    border: `1px solid ${theme.colors.neutral[200]}`,
    overflow: 'hidden'
  },

  // KPI Grid
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: theme.spacing.xl,
    marginBottom: theme.spacing['2xl']
  },

  // Content Grid
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: theme.spacing.xl,
    marginTop: theme.spacing['2xl']
  },

  cardTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.neutral[900],
    margin: `0 0 ${theme.spacing.lg} 0`,
    padding: `${theme.spacing.xl} ${theme.spacing.xl} 0`
  },

  // Alert Card
  alertCard: {
    backgroundColor: '#ffffff',
    borderRadius: theme.borderRadius.xl,
    boxShadow: theme.shadows.md,
    border: `1px solid ${theme.colors.danger[200]}`,
    overflow: 'hidden'
  },

  alertHeader: {
    padding: theme.spacing.xl,
    borderBottom: `1px solid ${theme.colors.danger[200]}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.danger[50]
  },

  alertTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.danger[700],
    margin: 0
  },

  alertList: {
    padding: theme.spacing.xl,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.md
  },

  alertItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.neutral[50],
    borderRadius: theme.borderRadius.lg,
    border: `1px solid ${theme.colors.neutral[200]}`
  },

  alertItemName: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.neutral[900],
    display: 'block'
  },

  alertItemStock: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.neutral[500],
    display: 'block',
    marginTop: theme.spacing.xs
  },

  alertFooter: {
    padding: theme.spacing.xl,
    borderTop: `1px solid ${theme.colors.neutral[200]}`,
    textAlign: 'center'
  },

  // Cards Grid
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: theme.spacing.xl
  },

  // Category Card
  categoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    boxShadow: theme.shadows.md,
    border: `1px solid ${theme.colors.neutral[200]}`,
    transition: theme.transitions.default,
    cursor: 'pointer'
  },

  categoryIcon: {
    fontSize: '48px',
    marginBottom: theme.spacing.lg,
    display: 'block'
  },

  categoryTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.neutral[900],
    margin: `0 0 ${theme.spacing.sm} 0`
  },

  categoryDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.neutral[600],
    margin: `0 0 ${theme.spacing.lg} 0`,
    lineHeight: '1.5'
  },

  categoryFooter: {
    borderTop: `1px solid ${theme.colors.neutral[200]}`,
    paddingTop: theme.spacing.md
  },

  categoryDate: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.neutral[400]
  },

  // Supplier Card
  supplierCard: {
    backgroundColor: '#ffffff',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    boxShadow: theme.shadows.md,
    border: `1px solid ${theme.colors.neutral[200]}`,
    transition: theme.transitions.default,
    cursor: 'pointer'
  },

  supplierHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg
  },

  supplierIcon: {
    fontSize: '32px'
  },

  supplierName: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.neutral[900],
    margin: 0
  },

  supplierDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.sm
  },

  supplierDetail: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.sm,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.neutral[600]
  },

  supplierDetailIcon: {
    fontSize: '16px',
    width: '20px'
  },

  // Reports Grid
  reportsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: theme.spacing.xl
  },

  reportCard: {
    backgroundColor: '#ffffff',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    boxShadow: theme.shadows.md,
    border: `1px solid ${theme.colors.neutral[200]}`
  },

  reportTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.neutral[900],
    margin: `0 0 ${theme.spacing.lg} 0`
  },

  reportMetrics: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.md
  },

  reportMetric: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.neutral[50],
    borderRadius: theme.borderRadius.lg,
    border: `1px solid ${theme.colors.neutral[200]}`
  },

  reportLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.neutral[600],
    fontWeight: theme.typography.fontWeight.medium
  },

  reportValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.neutral[900]
  },

  // Skeleton Loading
  skeletonCard: {
    backgroundColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.xl,
    height: '200px',
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
  }
};

// Add CSS animation for spinner
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @media (max-width: 768px) {
    .dashboard-container {
      flex-direction: column;
    }
    .sidebar {
      width: 100% !important;
      order: 2;
    }
    .main {
      order: 1;
    }
  }
`;
document.head.appendChild(styleSheet);