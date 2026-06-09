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
    customers: [],
    sales: [],
    purchases: [],
    lowStock: [],
    stockMovements: [],
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

      const safeJson = async (res) => {
        if (!res.ok) return { data: [] };
        try { return await res.json(); } catch { return { data: [] }; }
      };

      const [productsRes, categoriesRes, suppliersRes, customersRes, salesRes, purchasesRes, lowStockRes, stockMovementsRes] = await Promise.all([
        fetch(`${API}/products?tenant_id=${user.tenant_id}`, { headers }),
        fetch(`${API}/categories?tenant_id=${user.tenant_id}`, { headers }),
        fetch(`${API}/suppliers?tenant_id=${user.tenant_id}`, { headers }),
        fetch(`${API}/customers?tenant_id=${user.tenant_id}`, { headers }),
        fetch(`${API}/sales?tenant_id=${user.tenant_id}`, { headers }),
        fetch(`${API}/purchases?tenant_id=${user.tenant_id}`, { headers }),
        fetch(`${API}/products/low-stock?tenant_id=${user.tenant_id}`, { headers }),
        fetch(`${API}/stock-movements?tenant_id=${user.tenant_id}`, { headers }),
      ]);

      const [products, categories, suppliers, customers, sales, purchases, lowStock, stockMovements] = await Promise.all([
        safeJson(productsRes),
        safeJson(categoriesRes),
        safeJson(suppliersRes),
        safeJson(customersRes),
        safeJson(salesRes),
        safeJson(purchasesRes),
        safeJson(lowStockRes),
        safeJson(stockMovementsRes),
      ]);

      setData({
        products: products.data || [],
        categories: categories.data || [],
        suppliers: suppliers.data || [],
        customers: customers.data || [],
        sales: sales.data || [],
        purchases: purchases.data || [],
        lowStock: lowStock.data || [],
        stockMovements: stockMovements.data || [],
        stats: {
          totalProducts: (products.data || []).length,
          totalSales: (sales.data || []).reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0),
          totalPurchases: (purchases.data || []).reduce((sum, purchase) => sum + parseFloat(purchase.total_amount || 0), 0),
          lowStockCount: (lowStock.data || []).length
        }
      });
      setError(null);
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
    { id: 'overview',    label: 'Overview',    icon: '📊', color: 'primary' },
    { id: 'pos',         label: 'POS',         icon: '🖥️', color: 'success' },
    { id: 'products',    label: 'Products',    icon: '📦', color: 'success' },
    { id: 'categories',  label: 'Categories',  icon: '🏷️', color: 'warning' },
    { id: 'suppliers',   label: 'Suppliers',   icon: '🏭', color: 'neutral' },
    { id: 'customers',   label: 'Customers',   icon: '👥', color: 'primary' },
    { id: 'sales',       label: 'Sales',       icon: '💰', color: 'success' },
    { id: 'purchases',   label: 'Purchases',   icon: '🛒', color: 'primary' },
    { id: 'stock',       label: 'Stock',       icon: '🏗️', color: 'warning' },
    { id: 'reports',     label: 'Reports',     icon: '📈', color: 'danger' }
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
              <span style={styles.userRole}>
                {user.roles && user.roles.length > 0 
                  ? user.roles.map(r => r.name).join(', ')
                  : 'No role'}
              </span>
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
          {activeTab === 'pos' && (
            <POSTab
              products={data.products}
              categories={data.categories}
              customers={data.customers}
              token={token}
              user={user}
              onSaleCompleted={(sale) => {
                setData(prev => ({
                  ...prev,
                  sales: [sale, ...prev.sales],
                  stats: { ...prev.stats, totalSales: prev.stats.totalSales + parseFloat(sale.total_amount || 0) },
                  // update stock levels from the completed sale
                  products: prev.products.map(p => {
                    const item = sale.sale_items?.find(i => i.product_id === p.id)
                               || sale.saleItems?.find(i => i.product_id === p.id);
                    return item ? { ...p, stock: p.stock - item.quantity } : p;
                  })
                }));
              }}
            />
          )}
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
              onCategoryUpdated={cat => setData(prev => ({ ...prev, categories: prev.categories.map(c => c.id === cat.id ? cat : c) }))}
              onCategoryDeleted={id => setData(prev => ({ ...prev, categories: prev.categories.filter(c => c.id !== id) }))}
            />
          )}
          {activeTab === 'suppliers' && <SuppliersTab suppliers={data.suppliers} loading={loading} />}
          {activeTab === 'customers' && (
            <CustomersTab
              customers={data.customers}
              loading={loading}
              token={token}
              user={user}
              onCustomerAdded={customer => setData(prev => ({ ...prev, customers: [...prev.customers, customer] }))}
              onCustomerUpdated={customer => setData(prev => ({ ...prev, customers: prev.customers.map(c => c.id === customer.id ? customer : c) }))}
              onCustomerDeleted={id => setData(prev => ({ ...prev, customers: prev.customers.filter(c => c.id !== id) }))}
            />
          )}
          {activeTab === 'sales' && <SalesTab sales={data.sales} loading={loading} onNewSale={() => setActiveTab('pos')} token={token} user={user} />}
          {activeTab === 'purchases' && <PurchasesTab purchases={data.purchases} loading={loading} />}
          {activeTab === 'stock' && <StockTab products={data.products} stockMovements={data.stockMovements} token={token} onAdjusted={fetchData} />}
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
    { key: 'user', title: 'Staff', render: (value) => value?.name || 'N/A' }
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
function CategoriesTab({ categories, loading, token, onCategoryAdded, onCategoryUpdated, onCategoryDeleted }) {
  const [showAddModal, setShowAddModal]       = useState(false);
  const [editingCat, setEditingCat]           = useState(null);
  const [deletingCat, setDeletingCat]         = useState(null);
  const [form, setForm]                       = useState({ name: '', description: '' });
  const [saving, setSaving]                   = useState(false);
  const [deleteLoading, setDeleteLoading]     = useState(false);
  const [formError, setFormError]             = useState(null);
  const [deleteError, setDeleteError]         = useState(null);

  const openAdd  = () => { setForm({ name: '', description: '' }); setFormError(null); setShowAddModal(true); };
  const openEdit = (cat) => { setForm({ name: cat.name, description: cat.description || '' }); setFormError(null); setEditingCat(cat); };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    const isEdit = !!editingCat;
    try {
      const res = await fetch(
        isEdit ? `${API}/categories/${editingCat.id}` : `${API}/categories`,
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(form),
        }
      );
      const data = await res.json();
      if (!res.ok) { setFormError(data?.message || `Error ${res.status}`); }
      else {
        if (isEdit) { onCategoryUpdated(data.data); setEditingCat(null); }
        else        { onCategoryAdded(data.data);   setShowAddModal(false); }
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
        <label style={catS.label}>Category Name *</label>
        <input
          style={catS.input}
          placeholder="e.g. Electronics"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          required
          autoFocus
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
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Categories</h1>
          <p style={styles.pageSubtitle}>Organize your products into logical groups</p>
        </div>
        <Button variant="primary" icon="+" iconPosition="left" onClick={openAdd}>
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
            onAction={openAdd}
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
              <div style={{ ...styles.categoryFooter, justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={styles.categoryDate}>
                  Created {new Date(category.created_at).toLocaleDateString()}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => openEdit(category)}
                    style={catS.editBtn}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => { setDeleteError(null); setDeletingCat(category); }}
                    style={catS.deleteBtn}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px', background: '#fef2f2',
              border: '1px solid #fecaca', borderRadius: 10
            }}>
              <span style={{ fontSize: 28 }}>🗑️</span>
              <div>
                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 15 }}>{deletingCat.name}</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                  This will permanently delete the category. Products in this category will not be deleted.
                </div>
              </div>
            </div>
            {deleteError && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 }}>
                ⚠️ {deleteError}
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
  editBtn: {
    padding: '4px 10px', borderRadius: 6, border: '1px solid #3b82f6',
    background: '#eff6ff', color: '#3b82f6', cursor: 'pointer', fontSize: 12, fontWeight: 500,
  },
  deleteBtn: {
    padding: '4px 10px', borderRadius: 6, border: '1px solid #ef4444',
    background: '#fef2f2', color: '#ef4444', cursor: 'pointer', fontSize: 12, fontWeight: 500,
  },
};

const custS = {
  hero: {
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '16px 18px', marginBottom: 20,
    background: 'linear-gradient(135deg, #eef2ff 0%, #f0fdf4 100%)',
    borderRadius: 12, border: '1px solid #e0e7ff',
  },
  heroIcon: {
    width: 48, height: 48, borderRadius: '50%',
    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 22, flexShrink: 0,
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
  },
  heroTitle: { margin: 0, fontSize: 15, fontWeight: 600, color: '#1e293b' },
  heroSub: { margin: '3px 0 0', fontSize: 13, color: '#64748b', lineHeight: 1.4 },
  form: { display: 'flex', flexDirection: 'column', gap: 18 },
  section: {
    display: 'flex', flexDirection: 'column', gap: 14,
    padding: '16px', background: '#f8fafc',
    borderRadius: 12, border: '1px solid #e2e8f0',
  },
  sectionTitle: {
    fontSize: 11, fontWeight: 700, color: '#6366f1',
    textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0,
  },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  required: { color: '#ef4444', marginLeft: 2 },
  inputWrap: {
    display: 'flex', alignItems: 'center',
    background: '#fff', border: '1.5px solid #e2e8f0',
    borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  inputIcon: {
    padding: '0 12px', fontSize: 16, color: '#94a3b8',
    display: 'flex', alignItems: 'center', flexShrink: 0,
    borderRight: '1px solid #f1f5f9', background: '#fafafa',
    alignSelf: 'stretch',
  },
  input: {
    flex: 1, padding: '11px 12px', border: 'none', outline: 'none',
    fontSize: 14, fontFamily: 'inherit', color: '#0f172a', background: 'transparent',
    width: '100%', boxSizing: 'border-box',
  },
  hint: { fontSize: 12, color: '#94a3b8', margin: 0 },
  statusRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  statusPill: {
    padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0',
    background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500,
    color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    transition: 'all 0.15s ease', fontFamily: 'inherit',
  },
  statusPillActive: {
    border: '1.5px solid #6366f1', background: '#eef2ff', color: '#4f46e5',
    boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.12)',
  },
  error: {
    display: 'flex', alignItems: 'flex-start', gap: 8,
    padding: '12px 14px', background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: 10, color: '#b91c1c', fontSize: 13, lineHeight: 1.4,
  },
};

function focusInputWrap(e, focused) {
  const wrap = e.target.closest('[data-input-wrap]');
  if (!wrap) return;
  wrap.style.borderColor = focused ? '#6366f1' : '#e2e8f0';
  wrap.style.boxShadow = focused ? '0 0 0 3px rgba(99, 102, 241, 0.12)' : 'none';
}

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

// Customers Tab Component
function CustomersTab({ customers, loading, token, user, onCustomerAdded, onCustomerUpdated, onCustomerDeleted }) {
  const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  const [showModal, setShowModal]   = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm]             = useState({ name: '', phone: '', email: '', status: 'active' });
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState(null);

  const openAdd = () => {
    setEditTarget(null);
    setForm({ name: '', phone: '', email: '', status: 'active' });
    setError(null);
    setShowModal(true);
  };

  const openEdit = (customer) => {
    setEditTarget(customer);
    setForm({ name: customer.name, phone: customer.phone || '', email: customer.email || '', status: customer.status });
    setError(null);
    setShowModal(true);
  };

  const handleDelete = async (customer) => {
    if (!window.confirm(`Delete customer "${customer.name}"?`)) return;
    try {
      const res = await fetch(`${API}/customers/${customer.id}?tenant_id=${user.tenant_id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete customer');
      onCustomerDeleted(customer.id);
    } catch (e) {
      alert(e.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const isEdit = !!editTarget;
      const url    = isEdit ? `${API}/customers/${editTarget.id}` : `${API}/customers`;
      const res    = await fetch(url, {
        method:  isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ ...form, tenant_id: user.tenant_id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to save customer');
      isEdit ? onCustomerUpdated(json.data) : onCustomerAdded(json.data);
      setShowModal(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Customers</h1>
          <p style={styles.pageSubtitle}>Manage your customer records and contacts</p>
        </div>
        <Button variant="primary" icon="+" iconPosition="left" onClick={openAdd}>
          Add Customer
        </Button>
      </div>

      {loading ? (
        <div style={styles.cardsGrid}>
          {[...Array(6)].map((_, i) => <div key={i} style={styles.skeletonCard}></div>)}
        </div>
      ) : customers.length === 0 ? (
        <div style={styles.contentCard}>
          <EmptyState
            icon="👥"
            title="No customers yet"
            description="Add customers to keep track of who you sell to."
            actionLabel="Add First Customer"
            onAction={openAdd}
          />
        </div>
      ) : (
        <div style={styles.cardsGrid}>
          {customers.map(customer => (
            <div key={customer.id} style={styles.supplierCard}>
              <div style={styles.supplierHeader}>
                <div style={styles.supplierIcon}>👤</div>
                <h3 style={styles.supplierName}>{customer.name}</h3>
              </div>
              <div style={styles.supplierDetails}>
                <div style={styles.supplierDetail}>
                  <span style={styles.supplierDetailIcon}>📞</span>
                  <span>{customer.phone || 'No phone'}</span>
                </div>
                <div style={styles.supplierDetail}>
                  <span style={styles.supplierDetailIcon}>📧</span>
                  <span>{customer.email || 'No email'}</span>
                </div>
                <div style={styles.supplierDetail}>
                  <span style={styles.supplierDetailIcon}>🔖</span>
                  <span style={{ textTransform: 'capitalize' }}>{customer.status}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <Button variant="secondary" onClick={() => openEdit(customer)}>Edit</Button>
                <Button variant="danger" onClick={() => handleDelete(customer)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editTarget ? 'Edit Customer' : 'Add New Customer'}
        size="sm"
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={saving}
              onClick={() => document.getElementById('customer-form')?.requestSubmit()}
            >
              {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Add Customer'}
            </Button>
          </>
        }
      >
        <div style={custS.hero}>
          <div style={custS.heroIcon}>
            {form.name ? form.name.charAt(0).toUpperCase() : '👤'}
          </div>
          <div>
            <p style={custS.heroTitle}>
              {form.name || (editTarget ? 'Update customer details' : 'New customer profile')}
            </p>
            <p style={custS.heroSub}>
              {editTarget
                ? 'Update contact information and account status.'
                : 'Add a customer to link them to future sales and track purchase history.'}
            </p>
          </div>
        </div>

        <form id="customer-form" onSubmit={handleSubmit} style={custS.form}>
          <div style={custS.section}>
            <p style={custS.sectionTitle}>Contact Information</p>

            <div style={custS.field}>
              <label style={custS.label}>
                Full Name<span style={custS.required}>*</span>
              </label>
              <div style={custS.inputWrap} data-input-wrap>
                <span style={custS.inputIcon}>👤</span>
                <input
                  style={custS.input}
                  placeholder="e.g. Jane Nakato"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  onFocus={e => focusInputWrap(e, true)}
                  onBlur={e => focusInputWrap(e, false)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div style={custS.field}>
              <label style={custS.label}>Phone Number</label>
              <div style={custS.inputWrap} data-input-wrap>
                <span style={custS.inputIcon}>📞</span>
                <input
                  style={custS.input}
                  type="tel"
                  placeholder="+256 700 000 000"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  onFocus={e => focusInputWrap(e, true)}
                  onBlur={e => focusInputWrap(e, false)}
                />
              </div>
              <p style={custS.hint}>Optional — used for receipts and follow-ups</p>
            </div>

            <div style={custS.field}>
              <label style={custS.label}>Email Address</label>
              <div style={custS.inputWrap} data-input-wrap>
                <span style={custS.inputIcon}>✉️</span>
                <input
                  style={custS.input}
                  type="email"
                  placeholder="customer@example.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  onFocus={e => focusInputWrap(e, true)}
                  onBlur={e => focusInputWrap(e, false)}
                />
              </div>
            </div>
          </div>

          <div style={custS.section}>
            <p style={custS.sectionTitle}>Account Status</p>
            <div style={custS.statusRow}>
              {[
                { value: 'active', label: 'Active', icon: '✓' },
                { value: 'inactive', label: 'Inactive', icon: '○' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  style={{
                    ...custS.statusPill,
                    ...(form.status === opt.value ? custS.statusPillActive : {}),
                  }}
                  onClick={() => setForm(f => ({ ...f, status: opt.value }))}
                >
                  <span>{opt.icon}</span> {opt.label}
                </button>
              ))}
            </div>
            <p style={custS.hint}>
              Inactive customers are hidden from POS customer selection.
            </p>
          </div>

          {error && (
            <div style={custS.error}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}

// POS Tab Component
function POSTab({ products, categories, customers, token, user, onSaleCompleted }) {
  const [search, setSearch]           = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart]               = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [submitting, setSubmitting]   = useState(false);
  const [saleError, setSaleError]     = useState(null);
  const [lastReceipt, setLastReceipt] = useState(null);

  // Customer selection state
  const [customerType, setCustomerType]         = useState('walk_in');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerSearch, setCustomerSearch]     = useState('');
  const [newCustomer, setNewCustomer]           = useState({ name: '', phone: '', email: '' });

  // Discount & tax state
  const [discountValue, setDiscountValue] = useState('');
  const [taxValue, setTaxValue]           = useState('');

  // Cash payment state
  const [amountPaid, setAmountPaid] = useState('');
  const [cashNote, setCashNote]     = useState('');

  const inStockProducts = products.filter(p => Number(p.stock) > 0);

  const filtered = inStockProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === null || p.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev; // cap at available stock
        return prev.map(i => i.product_id === product.id
          ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.price }
          : i
        );
      }
      return [...prev, {
        product_id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        quantity: 1,
        subtotal: parseFloat(product.price),
        maxStock: product.stock,
      }];
    });
  };

  const updateQty = (product_id, qty) => {
    const n = parseInt(qty, 10);
    if (isNaN(n) || n < 1) return;
    setCart(prev => prev.map(i => i.product_id === product_id
      ? { ...i, quantity: Math.min(n, i.maxStock), subtotal: Math.min(n, i.maxStock) * i.price }
      : i
    ));
  };

  const removeFromCart = (product_id) => setCart(prev => prev.filter(i => i.product_id !== product_id));

  const cartSubtotal   = cart.reduce((sum, i) => sum + i.subtotal, 0);
  const discountAmount = (() => {
    const v = parseFloat(discountValue) || 0;
    return Math.min(v, cartSubtotal);
  })();
  const taxAmount  = parseFloat(taxValue) || 0;
  const cartTotal  = cartSubtotal - discountAmount + taxAmount;
  const changeAmount = paymentMethod === 'cash'
    ? Math.max(0, (parseFloat(amountPaid) || 0) - cartTotal)
    : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
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
          items: cart.map(i => ({ product_id: i.product_id, quantity: i.quantity, price: i.price })),
          customer_type: customerType,
          ...(customerType === 'existing' && selectedCustomerId ? { customer_id: parseInt(selectedCustomerId) } : {}),
          ...(customerType === 'new' ? { new_customer: newCustomer } : {}),
          discount_type:   discountAmount > 0 ? 'fixed' : null,
          discount_amount: discountAmount > 0 ? discountAmount : null,
          tax_amount:      taxAmount > 0 ? taxAmount : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setSaleError(data?.message || 'Checkout failed.'); return; }
      setLastReceipt({ ...data.data, cartSnapshot: cart, paymentMethod, taxAmount, discountAmount, amountPaid: parseFloat(amountPaid) || cartTotal, changeAmount });
      onSaleCompleted(data.data);
      setCart([]);
      setSearch('');
      setCustomerType('walk_in');
      setSelectedCustomerId('');
      setNewCustomer({ name: '', phone: '', email: '' });
      setCustomerSearch('');
      setDiscountValue('');
      setTaxValue('');
      setAmountPaid('');
      setCashNote('');
    } catch {
      setSaleError('Network error. Check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  if (lastReceipt) {
    return (
      <div style={styles.pageContainer}>
        <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 52 }}>✅</div>
            <h2 style={{ margin: '8px 0 4px', color: '#065f46', fontSize: 22 }}>Sale Complete!</h2>
            <p style={{ color: '#64748b', fontSize: 14 }}>Transaction recorded successfully</p>
          </div>

          {/* Receipt */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #e2e8f0', paddingBottom: 12, marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{user.tenant?.name || 'InventoryPro'}</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>{new Date().toLocaleString()}</div>
            </div>
            {lastReceipt.cartSnapshot.map(item => (
              <div key={item.product_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '4px 0' }}>
                <span>{item.name} × {item.quantity}</span>
                <span style={{ fontWeight: 600 }}>UGX {item.subtotal.toLocaleString()}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px dashed #e2e8f0', marginTop: 12, paddingTop: 12 }}>
              {lastReceipt.discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#dc2626', marginBottom: 4 }}>
                  <span>Discount</span>
                  <span>− UGX {lastReceipt.discountAmount.toLocaleString()}</span>
                </div>
              )}
              {lastReceipt.taxAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#b45309', marginBottom: 4 }}>
                  <span>Tax</span>
                  <span>+ UGX {lastReceipt.taxAmount.toLocaleString()}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16, marginTop: 4 }}>
                <span>Total</span>
                <span>UGX {parseFloat(lastReceipt.total_amount).toLocaleString()}</span>
              </div>
            </div>
            <div style={{ marginTop: 6, fontSize: 13, color: '#64748b', textAlign: 'right' }}>
              Payment: <strong>{lastReceipt.paymentMethod.replace('_', ' ')}</strong>
            </div>
            {lastReceipt.paymentMethod === 'cash' && (
              <div style={{ marginTop: 8, borderTop: '1px dashed #e2e8f0', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b' }}>
                  <span>Amount Paid</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>UGX {(lastReceipt.amountPaid || 0).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b' }}>
                  <span>Change</span>
                  <span style={{ fontWeight: 700, color: '#16a34a' }}>UGX {(lastReceipt.changeAmount || 0).toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" style={{ flex: 1 }} onClick={() => setLastReceipt(null)}>
              New Sale
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Point of Sale</h1>
          <p style={styles.pageSubtitle}>Search products, build a cart, and process payment</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>

        {/* Left — product search & grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input
            style={posS.searchInput}
            placeholder="🔍  Search products by name or SKU…"
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
            <div style={posS.productGrid}>
              {filtered.map(p => (
                <button key={p.id} style={posS.productCard} onClick={() => addToCart(p)}>
                  <div style={posS.productEmoji}>📦</div>
                  <div style={posS.productName}>{p.name}</div>
                  {p.sku && <div style={posS.productSku}>{p.sku}</div>}
                  <div style={posS.productPrice}>UGX {parseFloat(p.price).toLocaleString()}</div>
                  <div style={posS.productStock}>Stock: {p.stock}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right column — customer card + cart card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 20 }}>

          {/* Customer Card */}
          <div style={posS.cartPanel}>
            <div style={posS.cartHeader}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>👤 Customer <span style={{ fontWeight: 400, fontSize: 12, color: '#94a3b8' }}>(Optional)</span></span>
            </div>
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['walk_in', 'existing', 'new'].map(type => (
                <label
                  key={type}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                    border: `1.5px solid ${customerType === type ? '#16a34a' : '#e2e8f0'}`,
                    background: customerType === type ? '#f0fdf4' : '#fff',
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                >
                  <input
                    type="radio"
                    name="customerType"
                    value={type}
                    checked={customerType === type}
                    onChange={() => { setCustomerType(type); setSelectedCustomerId(''); setCustomerSearch(''); setNewCustomer({ name: '', phone: '', email: '' }); }}
                    style={{ accentColor: '#16a34a', width: 16, height: 16 }}
                  />
                  <span style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>
                    {type === 'walk_in' ? 'Walk-in Customer' : type === 'existing' ? 'Existing Customer' : 'New Customer'}
                  </span>
                </label>
              ))}

              {customerType === 'existing' && (
                <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <input
                    style={posS.searchInput}
                    placeholder="Search by name or phone…"
                    value={customerSearch}
                    onChange={e => setCustomerSearch(e.target.value)}
                  />
                  <select
                    style={posS.select}
                    value={selectedCustomerId}
                    onChange={e => setSelectedCustomerId(e.target.value)}
                  >
                    <option value="">— Select customer —</option>
                    {(customers || [])
                      .filter(c => c.status === 'active' && (
                        !customerSearch ||
                        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                        (c.phone || '').includes(customerSearch)
                      ))
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ''}</option>
                      ))
                    }
                  </select>
                </div>
              )}

              {customerType === 'new' && (
                <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input
                    style={posS.searchInput}
                    placeholder="Name *"
                    value={newCustomer.name}
                    onChange={e => setNewCustomer(p => ({ ...p, name: e.target.value }))}
                  />
                  <input
                    style={posS.searchInput}
                    placeholder="Phone"
                    value={newCustomer.phone}
                    onChange={e => setNewCustomer(p => ({ ...p, phone: e.target.value }))}
                  />
                  <input
                    style={posS.searchInput}
                    placeholder="Email"
                    type="email"
                    value={newCustomer.email}
                    onChange={e => setNewCustomer(p => ({ ...p, email: e.target.value }))}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Cart Card */}
          <div style={posS.cartPanel}>
            <div style={posS.cartHeader}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>🛒 Cart</span>
              {cart.length > 0 && (
                <button style={posS.clearBtn} onClick={() => setCart([])}>Clear all</button>
              )}
            </div>

            {cart.length === 0 ? (
              <div style={posS.emptyCart}>
                <div style={{ fontSize: 32 }}>🛒</div>
                <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 8 }}>Tap a product to add it</div>
              </div>
            ) : (
              <div style={posS.cartItems}>
                {cart.map(item => (
                  <div key={item.product_id} style={posS.cartItem}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={posS.cartItemName}>{item.name}</div>
                      <div style={posS.cartItemPrice}>UGX {item.price.toLocaleString()} each</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button style={posS.qtyBtn} onClick={() => updateQty(item.product_id, item.quantity - 1)}>−</button>
                      <input
                        style={posS.qtyInput}
                        type="number"
                        min={1}
                        max={item.maxStock}
                        value={item.quantity}
                        onChange={e => updateQty(item.product_id, e.target.value)}
                      />
                      <button style={posS.qtyBtn} onClick={() => updateQty(item.product_id, item.quantity + 1)}>+</button>
                      <button style={posS.removeBtn} onClick={() => removeFromCart(item.product_id)}>✕</button>
                    </div>
                    <div style={posS.cartItemSubtotal}>UGX {item.subtotal.toLocaleString()}</div>
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
                  type="number"
                  min="0"
                  placeholder="0"
                  value={discountValue}
                  onChange={e => setDiscountValue(e.target.value)}
                />
              </div>

              {/* Tax */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>Tax:</span>
                <input
                  style={posS.discountInput}
                  type="number"
                  min="0"
                  placeholder="0"
                  value={taxValue}
                  onChange={e => setTaxValue(e.target.value)}
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#b45309' }}>
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
                      type="number"
                      min="0"
                      placeholder="0"
                      value={amountPaid}
                      onChange={e => setAmountPaid(e.target.value)}
                    />
                  </div>

                  {/* Exact Amount shortcut */}
                  <button
                    style={{
                      width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #bfdbfe',
                      background: '#eff6ff', color: '#1d4ed8', fontWeight: 600, fontSize: 13,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                    onClick={() => setAmountPaid(cartTotal.toString())}
                  >
                    ≡ Exact Amount
                  </button>

                  {/* Change */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 10, padding: '10px 14px',
                  }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Change:</span>
                    <span style={{ fontWeight: 700, fontSize: 16, color: (parseFloat(amountPaid) || 0) < cartTotal ? '#dc2626' : '#16a34a' }}>
                      UGX {changeAmount.toLocaleString()}
                    </span>
                  </div>

                  {/* Underpayment warning */}
                  {amountPaid !== '' && (parseFloat(amountPaid) || 0) < cartTotal && (
                    <div style={{ fontSize: 12, color: '#dc2626', fontWeight: 600 }}>
                      ⚠️ Amount paid is less than total by UGX {(cartTotal - (parseFloat(amountPaid) || 0)).toLocaleString()}
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 4 }}>Notes (Optional)</label>
                    <textarea
                      style={{ ...posS.searchInput, resize: 'vertical', minHeight: 64, fontFamily: 'inherit' }}
                      placeholder="Add any notes…"
                      value={cashNote}
                      onChange={e => setCashNote(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {saleError && (
                <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13, marginBottom: 10 }}>
                  ⚠️ {saleError}
                </div>
              )}

              <Button
                variant="success"
                style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: '12px' }}
                loading={submitting}
                onClick={handleCheckout}
                disabled={cart.length === 0}
              >
                {submitting ? 'Processing…' : '✅ Complete Sale'}
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

const posS = {
  searchInput: {
    padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10,
    fontSize: 14, fontFamily: 'inherit', outline: 'none', width: '100%',
    boxSizing: 'border-box', background: '#fff',
  },
  discountInput: {
    padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10,
    fontSize: 14, fontFamily: 'inherit', outline: 'none', width: 120,
    boxSizing: 'border-box', background: '#fff', textAlign: 'right',
  },
  productGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: 12,
  },
  productCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    padding: '14px 10px', border: '1.5px solid #e2e8f0', borderRadius: 12,
    background: '#fff', cursor: 'pointer', textAlign: 'center',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  productEmoji: { fontSize: 28 },
  productName:  { fontSize: 13, fontWeight: 600, color: '#0f172a', lineHeight: 1.3 },
  productSku:   { fontSize: 11, color: '#94a3b8' },
  productPrice: { fontSize: 13, fontWeight: 700, color: '#16a34a', marginTop: 2 },
  productStock: { fontSize: 11, color: '#64748b' },
  cartPanel: {
    background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14,
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },
  cartHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 16px', borderBottom: '1px solid #f1f5f9',
  },
  clearBtn: {
    background: 'none', border: 'none', color: '#ef4444', fontSize: 12,
    cursor: 'pointer', fontWeight: 500,
  },
  emptyCart: {
    padding: '40px 20px', textAlign: 'center', color: '#94a3b8',
  },
  cartItems: {
    display: 'flex', flexDirection: 'column', gap: 0,
    maxHeight: 340, overflowY: 'auto',
  },
  cartItem: {
    display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
    padding: '10px 16px', borderBottom: '1px solid #f8fafc',
  },
  cartItemName:     { fontSize: 13, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  cartItemPrice:    { fontSize: 11, color: '#94a3b8' },
  cartItemSubtotal: { fontSize: 13, fontWeight: 700, color: '#0f172a', marginLeft: 'auto' },
  qtyBtn: {
    width: 26, height: 26, borderRadius: 6, border: '1px solid #e2e8f0',
    background: '#f8fafc', cursor: 'pointer', fontSize: 14, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  qtyInput: {
    width: 40, textAlign: 'center', border: '1px solid #e2e8f0', borderRadius: 6,
    padding: '3px 4px', fontSize: 13, fontFamily: 'inherit',
  },
  removeBtn: {
    background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer',
    fontSize: 13, fontWeight: 700, padding: '2px 4px',
  },
  cartFooter: {
    padding: '14px 16px', borderTop: '1px solid #f1f5f9',
  },
  label: {
    display: 'block', fontSize: 11, fontWeight: 600, color: '#374151',
    textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6,
  },
  select: {
    width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0',
    borderRadius: 8, fontSize: 14, fontFamily: 'inherit', background: '#fff',
    boxSizing: 'border-box',
  },
};

function formatSaleDateTime(saleDate, createdAt) {
  const dateSource = saleDate || createdAt;
  if (!dateSource) return { date: '-', time: '' };
  const d = new Date(dateSource);
  if (isNaN(d.getTime())) return { date: '-', time: '' };
  const date = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  const timeSource = createdAt || saleDate;
  const time = new Date(timeSource).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return { date, time };
}

// Sales Tab Component
function SalesTab({ sales, loading, onNewSale, token, user }) {
  const [viewingSale, setViewingSale]   = useState(null);
  const [editingSale, setEditingSale]   = useState(null);
  const [editForm, setEditForm]         = useState({});
  const [editSaving, setEditSaving]     = useState(false);
  const [editError, setEditError]       = useState(null);
  const [localSales, setLocalSales]     = useState(sales);

  // Keep localSales in sync when parent refreshes
  useEffect(() => setLocalSales(sales), [sales]);

  // Date filter
  const [dateFilter, setDateFilter] = useState('all');

  // Custom day lookup
  const [customDate, setCustomDate]           = useState('');
  const [customDaySales, setCustomDaySales]   = useState(null);

  // Custom week lookup
  const [customWeekDate, setCustomWeekDate]     = useState('');
  const [customWeekSales, setCustomWeekSales]   = useState(null);
  const [customWeekRange, setCustomWeekRange]   = useState(null);

  const filteredSales = localSales.filter(sale => {
    if (dateFilter === 'all') return true;

    // Parse the date string as local date (YYYY-MM-DD) to avoid UTC offset shifting
    const raw = (sale.sale_date || sale.created_at || '').slice(0, 10); // "YYYY-MM-DD"
    const [y, m, d] = raw.split('-').map(Number);
    const saleDate = new Date(y, m - 1, d); // local midnight

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (dateFilter === 'today') {
      return saleDate.getTime() === today.getTime();
    }
    if (dateFilter === 'week') {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      return saleDate >= startOfWeek;
    }
    if (dateFilter === 'month') {
      return saleDate.getMonth() === today.getMonth() && saleDate.getFullYear() === today.getFullYear();
    }
    return true;
  });

  const openEdit = (sale) => {
    setEditingSale(sale);
    setEditForm({
      payment_method: sale.payment_method || 'cash',
      discount_amount: sale.discount_amount || '',
      tax_amount: sale.tax_amount || '',
      notes: sale.notes || '',
    });
    setEditError(null);
  };

  const handleEditSave = async () => {
    setEditSaving(true);
    setEditError(null);
    try {
      const res = await fetch(`${API}/sales/${editingSale.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          payment_method:  editForm.payment_method,
          discount_amount: editForm.discount_amount !== '' ? parseFloat(editForm.discount_amount) : null,
          tax_amount:      editForm.tax_amount !== ''      ? parseFloat(editForm.tax_amount)      : null,
          notes:           editForm.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data?.message || 'Failed to update sale.'); return; }
      setLocalSales(prev => prev.map(s => s.id === data.data.id ? data.data : s));
      setEditingSale(null);
    } catch {
      setEditError('Network error. Check your connection.');
    } finally {
      setEditSaving(false);
    }
  };

  const columns = [
    {
      key: 'sale_date',
      title: 'Date',
      render: (value, row) => {
        const { date, time } = formatSaleDateTime(value, row.created_at);
        return (
          <div>
            <div style={{ color: '#1e293b', fontWeight: 500 }}>{date}</div>
            {time && <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>{time}</div>}
          </div>
        );
      }
    },
    { key: 'total_amount', title: 'Amount', type: 'currency' },
    {
      key: 'payment_method',
      title: 'Payment Method',
      render: (value) => <Badge variant="success" size="sm">{value}</Badge>
    },
    {
      key: 'customer',
      title: 'Customer',
      render: (value) => value?.name
        ? <Badge variant="primary" size="sm">{value.name}</Badge>
        : <span style={{ color: '#94a3b8' }}>Walk-in Customer</span>
    },
    {
      key: 'sale_items',
      title: 'Items',
      render: (value, row) => {
        const items = value || row.saleItems || [];
        return `${items.length} item${items.length === 1 ? '' : 's'}`;
      }
    },
    {
      key: 'user',
      title: 'Staff',
      render: (value) => value?.name || 'N/A'
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            title="View sale"
            onClick={() => setViewingSale(row)}
            style={{
              padding: '5px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0',
              background: '#f8fafc', color: '#0369a1', cursor: 'pointer',
              fontSize: 15, fontWeight: 600, lineHeight: 1,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#e0f2fe'}
            onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
          >
            👁
          </button>
          <button
            title="Edit sale"
            onClick={() => openEdit(row)}
            style={{
              padding: '5px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0',
              background: '#f8fafc', color: '#b45309', cursor: 'pointer',
              fontSize: 15, fontWeight: 600, lineHeight: 1,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#fef3c7'}
            onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
          >
            ✏️
          </button>
        </div>
      )
    },
  ];

  // ── helpers ──────────────────────────────────────────────
  const detailRow = (label, value) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: 14 }}>
      <span style={{ color: '#64748b', fontWeight: 500 }}>{label}</span>
      <span style={{ color: '#0f172a', fontWeight: 600 }}>{value}</span>
    </div>
  );

  return (
    <div style={styles.pageContainer}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Sales</h1>
          <p style={styles.pageSubtitle}>Track all your sales transactions and revenue</p>
        </div>
        <Button variant="success" icon="+" iconPosition="left" onClick={onNewSale}>
          New Sale
        </Button>
      </div>

      <div style={styles.contentCard}>
        {/* Filter buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {[
            { key: 'all',   label: 'All Sales',   icon: '≡' },
            { key: 'today', label: 'Today',        icon: '📅' },
            { key: 'week',  label: 'This Week',    icon: '📅' },
            { key: 'month', label: 'This Month',   icon: '📅' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setDateFilter(f.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 18px', borderRadius: 10, border: 'none',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                background: dateFilter === f.key ? '#4f46e5' : '#f1f5f9',
                color:      dateFilter === f.key ? '#fff'     : '#334155',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              <span>{f.icon}</span> {f.label}
            </button>
          ))}
        </div>

        {/* ── Weekly breakdown (only when This Week is active) ── */}
        {dateFilter === 'week' && (() => {
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday

          // Build 7 day slots Mon–Sun (reorder so Mon is first)
          const dayNames = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
          const days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            return d;
          });
          // Reorder: Mon(1)…Sat(6), Sun(0)
          const ordered = [...days.slice(1), days[0]];

          // Build totals per day
          const weekTotal     = filteredSales.reduce((s, sale) => s + parseFloat(sale.total_amount || 0), 0);
          const weekCount     = filteredSales.length;
          const startLabel    = startOfWeek.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }).replace(/ /g, ' ');
          const endLabel      = today.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }).replace(/ /g, ' ');

          const dayTotals = ordered.map(day => {
            const daySales = filteredSales.filter(sale => {
              const raw = (sale.sale_date || sale.created_at || '').slice(0, 10);
              const [y, m, d] = raw.split('-').map(Number);
              const sd = new Date(y, m - 1, d);
              return sd.getTime() === day.getTime();
            });
            return {
              day,
              count: daySales.length,
              total: daySales.reduce((s, sale) => s + parseFloat(sale.total_amount || 0), 0),
              isToday: day.getTime() === today.getTime(),
            };
          });

          return (
            <div style={{ marginBottom: 20 }}>
              {/* Summary banner */}
              <div style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                borderRadius: 14, padding: '20px 24px', marginBottom: 14,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                    Total Sales This Week
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
                    UGX {weekTotal.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
                    {weekCount} transaction{weekCount !== 1 ? 's' : ''} &bull; {startLabel} – {endLabel}
                  </div>
                </div>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                }}>
                  📅
                </div>
              </div>

              {/* Day cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                {dayTotals.map(({ day, count, total, isToday }) => (
                  <div key={day.getTime()} style={{
                    background: '#fff',
                    border: `1.5px solid ${isToday ? '#3b82f6' : '#e2e8f0'}`,
                    borderRadius: 10, padding: '10px 12px',
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em' }}>
                      {dayNames[day.getDay()]}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                      {day.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: count > 0 ? '#2563eb' : '#cbd5e1', marginBottom: 2 }}>
                      {count}
                    </div>
                    <div style={{ fontSize: 11, color: count > 0 ? '#475569' : '#cbd5e1', fontWeight: 500 }}>
                      UGX {total.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ── Monthly breakdown (only when This Month is active) ── */}
        {dateFilter === 'month' && (() => {
          const now   = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const monthName = today.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

          // Month totals
          const monthTotal = filteredSales.reduce((s, sale) => s + parseFloat(sale.total_amount || 0), 0);
          const monthCount = filteredSales.length;

          // Build calendar weeks for this month (week starts Monday)
          const firstDay  = new Date(today.getFullYear(), today.getMonth(), 1);
          const lastDay   = new Date(today.getFullYear(), today.getMonth() + 1, 0);

          // Find Monday on or before the 1st
          const startMon = new Date(firstDay);
          const dow = firstDay.getDay(); // 0=Sun
          startMon.setDate(firstDay.getDate() - (dow === 0 ? 6 : dow - 1));

          // Collect weeks until we pass the last day of the month
          const weeks = [];
          let cursor = new Date(startMon);
          while (cursor <= lastDay) {
            const weekStart = new Date(cursor);
            const weekEnd   = new Date(cursor);
            weekEnd.setDate(cursor.getDate() + 6);

            const daySales = filteredSales.filter(sale => {
              const raw = (sale.sale_date || sale.created_at || '').slice(0, 10);
              const [y, m, d] = raw.split('-').map(Number);
              const sd = new Date(y, m - 1, d);
              return sd >= weekStart && sd <= weekEnd;
            });

            weeks.push({
              label: `Week ${weeks.length + 1}`,
              start: weekStart,
              end:   weekEnd,
              count: daySales.length,
              total: daySales.reduce((s, sale) => s + parseFloat(sale.total_amount || 0), 0),
              isCurrent: today >= weekStart && today <= weekEnd,
            });
            cursor.setDate(cursor.getDate() + 7);
          }

          return (
            <div style={{ marginBottom: 20 }}>
              {/* Summary banner */}
              <div style={{
                background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)',
                borderRadius: 14, padding: '20px 24px', marginBottom: 14,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                    Total Sales This Month
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
                    UGX {monthTotal.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
                    {monthCount} transaction{monthCount !== 1 ? 's' : ''} &bull; {monthName}
                  </div>
                </div>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                }}>
                  📅
                </div>
              </div>

              {/* Week cards */}
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${weeks.length}, 1fr)`, gap: 10 }}>
                {weeks.map(({ label, start, end, count, total, isCurrent }) => (
                  <div key={label} style={{
                    background: '#fff',
                    border: `1.5px solid ${isCurrent ? '#9333ea' : '#e2e8f0'}`,
                    borderRadius: 10, padding: '14px 16px',
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>
                      {label}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>
                      {start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} – {end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: count > 0 ? '#7c3aed' : '#cbd5e1', marginBottom: 2 }}>
                      {count}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>Sales</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: count > 0 ? '#16a34a' : '#cbd5e1' }}>
                      UGX {total.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        <DataTable
          columns={columns}
          data={filteredSales}
          loading={loading}
          emptyStateProps={{
            icon: '💰',
            title: 'No sales yet',
            description: 'Start processing sales to see transaction history here.',
            actionLabel: 'Process First Sale',
            onAction: onNewSale
          }}
        />
      </div>

      {/* ── Custom Day Lookup ── */}
      <div style={{ ...styles.contentCard, marginTop: 20 }}>
        <div style={{ marginBottom: 14 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>🔍 Sales by Specific Day</h3>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Select any date to view all sales made on that day</p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Select Date</label>
            <input
              type="date"
              value={customDate}
              onChange={e => { setCustomDate(e.target.value); setCustomDaySales(null); }}
              style={{
                padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10,
                fontSize: 14, fontFamily: 'inherit', outline: 'none', background: '#fff',
                color: '#0f172a', cursor: 'pointer',
              }}
            />
          </div>
          <button
            onClick={() => {
              if (!customDate) return;
              const [y, m, d] = customDate.split('-').map(Number);
              const target = new Date(y, m - 1, d);
              const results = localSales.filter(sale => {
                const raw = (sale.sale_date || sale.created_at || '').slice(0, 10);
                const [sy, sm, sd] = raw.split('-').map(Number);
                return new Date(sy, sm - 1, sd).getTime() === target.getTime();
              });
              setCustomDaySales(results);
            }}
            style={{
              padding: '9px 20px', borderRadius: 10, border: 'none',
              background: '#4f46e5', color: '#fff', fontSize: 14, fontWeight: 600,
              cursor: customDate ? 'pointer' : 'not-allowed',
              opacity: customDate ? 1 : 0.5,
            }}
          >
            View Sales
          </button>
          {customDaySales !== null && (
            <button
              onClick={() => { setCustomDaySales(null); setCustomDate(''); }}
              style={{
                padding: '9px 16px', borderRadius: 10, border: '1.5px solid #e2e8f0',
                background: '#fff', color: '#64748b', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Results */}
        {customDaySales !== null && (
          <div style={{ marginTop: 16 }}>
            {/* Summary strip */}
            <div style={{
              background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10,
              padding: '12px 16px', marginBottom: 14,
              display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Date</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                  {new Date(...customDate.split('-').map((v,i) => i===1 ? v-1 : +v))
                    .toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Transactions</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#4f46e5' }}>{customDaySales.length}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Revenue</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#16a34a' }}>
                  UGX {customDaySales.reduce((s, sale) => s + parseFloat(sale.total_amount || 0), 0).toLocaleString()}
                </div>
              </div>
            </div>

            {customDaySales.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🗓️</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>No sales on this day</div>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={customDaySales}
                loading={false}
                emptyStateProps={{ icon: '💰', title: 'No sales', description: '' }}
              />
            )}
          </div>
        )}
      </div>

      {/* ── Custom Week Lookup ── */}
      <div style={{ ...styles.contentCard, marginTop: 20 }}>
        <div style={{ marginBottom: 14 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>📅 Sales by Specific Week</h3>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Pick any date — the system will show all sales for that entire week (Mon – Sun)</p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Pick any date in the week</label>
            <input
              type="date"
              value={customWeekDate}
              onChange={e => { setCustomWeekDate(e.target.value); setCustomWeekSales(null); setCustomWeekRange(null); }}
              style={{
                padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10,
                fontSize: 14, fontFamily: 'inherit', outline: 'none', background: '#fff',
                color: '#0f172a', cursor: 'pointer',
              }}
            />
          </div>
          <button
            onClick={() => {
              if (!customWeekDate) return;
              const [y, m, d] = customWeekDate.split('-').map(Number);
              const picked = new Date(y, m - 1, d);
              // Find Monday of that week
              const dow = picked.getDay(); // 0=Sun
              const monday = new Date(picked);
              monday.setDate(picked.getDate() - (dow === 0 ? 6 : dow - 1));
              const sunday = new Date(monday);
              sunday.setDate(monday.getDate() + 6);

              const results = localSales.filter(sale => {
                const raw = (sale.sale_date || sale.created_at || '').slice(0, 10);
                const [sy, sm, sd] = raw.split('-').map(Number);
                const sd2 = new Date(sy, sm - 1, sd);
                return sd2 >= monday && sd2 <= sunday;
              });
              setCustomWeekSales(results);
              setCustomWeekRange({ monday, sunday });
            }}
            style={{
              padding: '9px 20px', borderRadius: 10, border: 'none',
              background: '#4f46e5', color: '#fff', fontSize: 14, fontWeight: 600,
              cursor: customWeekDate ? 'pointer' : 'not-allowed',
              opacity: customWeekDate ? 1 : 0.5,
            }}
          >
            View Week
          </button>
          {customWeekSales !== null && (
            <button
              onClick={() => { setCustomWeekSales(null); setCustomWeekDate(''); setCustomWeekRange(null); }}
              style={{
                padding: '9px 16px', borderRadius: 10, border: '1.5px solid #e2e8f0',
                background: '#fff', color: '#64748b', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Results */}
        {customWeekSales !== null && customWeekRange !== null && (() => {
          const { monday, sunday } = customWeekRange;
          const fmt = d => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
          const weekTotal = customWeekSales.reduce((s, sale) => s + parseFloat(sale.total_amount || 0), 0);

          // Day-by-day breakdown for that week
          const dayNames = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
          const dayBreakdown = Array.from({ length: 7 }, (_, i) => {
            const day = new Date(monday);
            day.setDate(monday.getDate() + i);
            const daySales = customWeekSales.filter(sale => {
              const raw = (sale.sale_date || sale.created_at || '').slice(0, 10);
              const [sy, sm, sd] = raw.split('-').map(Number);
              return new Date(sy, sm - 1, sd).getTime() === day.getTime();
            });
            return { day, name: dayNames[i], count: daySales.length, total: daySales.reduce((s, sale) => s + parseFloat(sale.total_amount || 0), 0) };
          });

          return (
            <div style={{ marginTop: 16 }}>
              {/* Summary strip */}
              <div style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                borderRadius: 12, padding: '16px 20px', marginBottom: 14,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
              }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Week</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{fmt(monday)} – {fmt(sunday)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Transactions</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{customWeekSales.length}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Total Revenue</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>UGX {weekTotal.toLocaleString()}</div>
                </div>
              </div>

              {/* Day-by-day cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 16 }}>
                {dayBreakdown.map(({ day, name, count, total }) => {
                  const now = new Date();
                  const isToday = day.getTime() === new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                  return (
                    <div key={name} style={{
                      background: '#fff', borderRadius: 10, padding: '10px 12px',
                      border: `1.5px solid ${isToday ? '#3b82f6' : '#e2e8f0'}`,
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{name}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>
                        {day.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: count > 0 ? '#2563eb' : '#cbd5e1', marginBottom: 2 }}>{count}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: count > 0 ? '#475569' : '#cbd5e1' }}>
                        UGX {total.toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Sales table */}
              {customWeekSales.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>📅</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>No sales in this week</div>
                </div>
              ) : (
                <DataTable
                  columns={columns}
                  data={customWeekSales}
                  loading={false}
                  emptyStateProps={{ icon: '💰', title: 'No sales', description: '' }}
                />
              )}
            </div>
          );
        })()}
      </div>

      {/* ── View Modal (Receipt) ── */}
      <Modal
        isOpen={!!viewingSale}
        onClose={() => setViewingSale(null)}
        title=""
        size="md"
        footer={
          <div style={{ display: 'flex', gap: 10, width: '100%', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setViewingSale(null)}>Close</Button>
            <Button
              variant="success"
              onClick={() => {
                const src = document.getElementById('receipt-content');
                if (!src) return;
                const win = window.open('', '_blank', 'width=800,height=900');
                win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Receipt</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; background: #fff; color: #000; padding: 32px; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px 10px; }
    @media print {
      body { padding: 20px; }
      button { display: none !important; }
    }
  </style>
</head>
<body>${src.innerHTML}</body>
</html>`);
                win.document.close();
                win.focus();
                setTimeout(() => { win.print(); win.close(); }, 400);
              }}
            >
              🖨️ Print / Save PDF
            </Button>
          </div>
        }
      >
        {viewingSale && (() => {
          const items       = viewingSale.sale_items || viewingSale.saleItems || [];
          const subtotal    = items.reduce((s, i) => s + parseFloat(i.subtotal || 0), 0);
          const discount    = parseFloat(viewingSale.discount_amount) || 0;
          const tax         = parseFloat(viewingSale.tax_amount) || 0;
          const total       = parseFloat(viewingSale.total_amount) || 0;
          const { date, time } = formatSaleDateTime(viewingSale.sale_date, viewingSale.created_at);
          const tenant      = user?.tenant || {};
          const tenantName  = tenant.name || 'InventoryPro';
          // Build a SAL-YYYYMMDD-NNNN style ref using the sale date
          const saleDate    = viewingSale.sale_date || viewingSale.created_at || '';
          const datePart    = saleDate.replace(/-/g, '').slice(0, 8);
          const saleId      = String(viewingSale.id).padStart(4, '0');
          const receiptRef  = `SAL-${datePart}-${saleId}`;

          const rRow = (label, value, bold = false, color = '#0f172a') => (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', fontSize: 14 }}>
              <span style={{ color: '#64748b' }}>{label}</span>
              <span style={{ fontWeight: bold ? 700 : 500, color }}>{value}</span>
            </div>
          );

          return (
            <div id="receipt-content" style={{ fontFamily: 'inherit' }}>

              {/* ── Business Header ── */}
              <div style={{ textAlign: 'center', paddingBottom: 20, borderBottom: '1px solid #e2e8f0' }}>
                {/* Avatar */}
                <div style={{
                  width: 64, height: 64, borderRadius: '50%', background: '#4f46e5',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 10,
                }}>
                  {tenantName.charAt(0).toLowerCase()}
                </div>
                <div style={{ fontWeight: 700, fontSize: 20, color: '#0f172a' }}>{tenantName}</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                  {[tenant.phone && `Tel: ${tenant.phone}`, tenant.email && `Email: ${tenant.email}`].filter(Boolean).join(' | ')}
                </div>
                {tenant.address && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{tenant.address}</div>}
              </div>

              {/* ── Receipt Details + Customer ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, padding: '18px 0', borderBottom: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Receipt Details</div>
                  <div style={{ color: '#4f46e5', fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{receiptRef}</div>
                  <div style={{ fontSize: 13, color: '#475569', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                    <span>📅</span> {date}
                  </div>
                  {time && (
                    <div style={{ fontSize: 13, color: '#475569', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                      <span>🕐</span> {time}
                    </div>
                  )}
                  <div style={{ fontSize: 13, color: '#475569', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span>👤</span> Served by: {viewingSale.user?.name || 'N/A'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Customer</div>
                  <div style={{ fontSize: 14, color: '#0f172a', fontWeight: 500 }}>
                    {viewingSale.customer?.name || 'Walk-in Customer'}
                  </div>
                  {viewingSale.customer?.phone && (
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>📞 {viewingSale.customer.phone}</div>
                  )}
                  {viewingSale.customer?.email && (
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>✉️ {viewingSale.customer.email}</div>
                  )}
                </div>
              </div>

              {/* ── Items Table ── */}
              <div style={{ paddingTop: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Items Purchased</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      {['#', 'Product', 'Qty', 'Unit Price', 'Total'].map((h, i) => (
                        <th key={h} style={{
                          padding: '8px 10px', fontSize: 11, fontWeight: 700, color: '#94a3b8',
                          letterSpacing: '0.06em', textTransform: 'uppercase',
                          textAlign: i === 0 ? 'center' : i >= 2 ? 'right' : 'left',
                          borderBottom: '1px solid #e2e8f0',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 13 }}>No items recorded.</td></tr>
                    ) : items.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px', textAlign: 'center', fontSize: 14, color: '#64748b' }}>{idx + 1}</td>
                        <td style={{ padding: '10px' }}>
                          <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{item.product?.name || `Product #${item.product_id}`}</div>
                          {item.product?.sku && <div style={{ fontSize: 12, color: '#94a3b8' }}>{item.product.sku}</div>}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', fontSize: 14, color: '#475569' }}>
                          {parseFloat(item.quantity).toFixed(2)} {item.product?.unit || 'pcs'}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', fontSize: 14, color: '#475569' }}>
                          UGX {parseFloat(item.price).toLocaleString()}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                          UGX {parseFloat(item.subtotal).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── Totals ── */}
              <div style={{ marginTop: 10, borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
                <div style={{ maxWidth: 280, marginLeft: 'auto' }}>
                  {rRow('Subtotal:', `UGX ${subtotal.toLocaleString()}`)}
                  {discount > 0 && rRow('Discount:', `− UGX ${discount.toLocaleString()}`, false, '#dc2626')}
                  {tax > 0      && rRow('Tax:',      `+ UGX ${tax.toLocaleString()}`,      false, '#b45309')}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid #e2e8f0', marginTop: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 16 }}>TOTAL:</span>
                    <span style={{ fontWeight: 700, fontSize: 18, color: '#0f172a' }}>UGX {total.toLocaleString()}</span>
                  </div>
                  {rRow('Payment Method:', viewingSale.payment_method?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', fontSize: 14 }}>
                    <span style={{ color: '#64748b' }}>Payment Status:</span>
                    <span style={{ background: '#dcfce7', color: '#16a34a', fontWeight: 700, fontSize: 12, padding: '2px 10px', borderRadius: 20 }}>Paid</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {viewingSale.notes && (
                <div style={{ marginTop: 14, padding: '10px 12px', background: '#f8fafc', borderRadius: 8, fontSize: 13, color: '#475569', borderLeft: '3px solid #e2e8f0' }}>
                  📝 {viewingSale.notes}
                </div>
              )}

              {/* ── Thank you footer ── */}
              <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#1e293b', marginBottom: 4 }}>Thank you!</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>We appreciate your business. Visit us again!</div>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal
        isOpen={!!editingSale}
        onClose={() => setEditingSale(null)}
        title={`Edit Sale #${editingSale?.id}`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingSale(null)}>Cancel</Button>
            <Button variant="success" loading={editSaving} onClick={handleEditSave}>Save Changes</Button>
          </>
        }
      >
        {editingSale && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {editError && (
              <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 }}>
                ⚠️ {editError}
              </div>
            )}

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Payment Method</label>
              <select
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', background: '#fff' }}
                value={editForm.payment_method}
                onChange={e => setEditForm(p => ({ ...p, payment_method: e.target.value }))}
              >
                <option value="cash">💵 Cash</option>
                <option value="card">💳 Card</option>
                <option value="mobile_money">📱 Mobile Money</option>
                <option value="bank_transfer">🏦 Bank Transfer</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Discount (UGX)</label>
              <input
                type="number" min="0"
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                value={editForm.discount_amount}
                onChange={e => setEditForm(p => ({ ...p, discount_amount: e.target.value }))}
                placeholder="0"
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Tax (UGX)</label>
              <input
                type="number" min="0"
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                value={editForm.tax_amount}
                onChange={e => setEditForm(p => ({ ...p, tax_amount: e.target.value }))}
                placeholder="0"
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Notes (Optional)</label>
              <textarea
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'vertical', minHeight: 72, boxSizing: 'border-box' }}
                value={editForm.notes}
                onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Add any notes…"
              />
            </div>
          </div>
        )}
      </Modal>
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

// Stock Tab Component
function StockTab({ products, stockMovements, token, onAdjusted }) {
  const [form, setForm]         = useState({ product_id: '', type: 'IN', quantity: '', reason: '', date: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const [typeFilter, setTypeFilter]   = useState('ALL');
  const [search, setSearch]           = useState('');

  const handleSubmit = async () => {
    if (!form.product_id || !form.quantity) { setFormError('Product and quantity are required.'); return; }
    if (parseInt(form.quantity) < 1) { setFormError('Quantity must be at least 1.'); return; }
    setSubmitting(true); setFormError(null); setFormSuccess(null);
    try {
      const res = await fetch(`${API}/stock-movements`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          product_id: parseInt(form.product_id),
          type:       form.type,
          quantity:   parseInt(form.quantity),
          reason:     form.reason || null,
          date:       form.date || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data?.message || 'Failed to update stock.'); return; }
      setFormSuccess(`Stock updated successfully for "${data.data?.product?.name}".`);
      setForm({ product_id: '', type: 'IN', quantity: '', reason: '', date: '' });
      onAdjusted();
    } catch { setFormError('Network error. Check your connection.'); }
    finally { setSubmitting(false); }
  };

  const typeConfig = {
    IN:         { label: 'Stock In',    color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
    OUT:        { label: 'Stock Out',   color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
    ADJUSTMENT: { label: 'Adjustment', color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
    sale:       { label: 'Sale',        color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
  };

  const filtered = stockMovements.filter(m => {
    const matchType = typeFilter === 'ALL' || m.type === typeFilter || (typeFilter === 'sale' && m.reference_type === 'sale');
    const matchSearch = !search || (m.product?.name || '').toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  // Stock overview cards
  const totalIn  = stockMovements.filter(m => m.type === 'IN').reduce((s, m) => s + m.quantity, 0);
  const totalOut = stockMovements.filter(m => m.type === 'OUT').reduce((s, m) => s + m.quantity, 0);
  const lowStock = products.filter(p => Number(p.stock) <= Number(p.reorder_level || 0));

  return (
    <div style={styles.pageContainer}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Stock Management</h1>
          <p style={styles.pageSubtitle}>Adjust stock levels and view movement history</p>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Products',   value: products.length,   icon: '📦', color: '#4f46e5', bg: '#eef2ff' },
          { label: 'Total Stock In',   value: totalIn,            icon: '⬆️', color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Total Stock Out',  value: totalOut,           icon: '⬇️', color: '#dc2626', bg: '#fef2f2' },
        ].map(c => (
          <div key={c.label} style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{c.icon}</div>
            <div>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{c.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: c.color }}>{c.value.toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20, alignItems: 'start' }}>

        {/* ── Left: Adjustment form ── */}
        <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>📝 Adjust Stock</h3>

          {formError && <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 }}>⚠️ {formError}</div>}
          {formSuccess && <div style={{ padding: '8px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, color: '#15803d', fontSize: 13 }}>✅ {formSuccess}</div>}

          {/* Product */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Product *</label>
            <select
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', background: '#fff' }}
              value={form.product_id}
              onChange={e => setForm(p => ({ ...p, product_id: e.target.value }))}
            >
              <option value="">— Select product —</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>Adjustment Type *</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { val: 'IN',         label: '⬆️ Stock In',    activeColor: '#16a34a', activeBg: '#f0fdf4' },
                { val: 'OUT',        label: '⬇️ Stock Out',   activeColor: '#dc2626', activeBg: '#fef2f2' },
                { val: 'ADJUSTMENT', label: '🔧 Set Level',   activeColor: '#b45309', activeBg: '#fffbeb' },
              ].map(t => (
                <button key={t.val} onClick={() => setForm(p => ({ ...p, type: t.val }))} style={{
                  flex: 1, padding: '8px 6px', borderRadius: 8, border: '1.5px solid',
                  borderColor: form.type === t.val ? t.activeColor : '#e2e8f0',
                  background:  form.type === t.val ? t.activeBg   : '#fff',
                  color:       form.type === t.val ? t.activeColor : '#64748b',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                }}>{t.label}</button>
              ))}
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: '#94a3b8' }}>
              {form.type === 'IN'         && 'Adds quantity to current stock.'}
              {form.type === 'OUT'        && 'Removes quantity from current stock.'}
              {form.type === 'ADJUSTMENT' && 'Sets stock to an exact absolute value.'}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>
              {form.type === 'ADJUSTMENT' ? 'New Stock Level *' : 'Quantity *'}
            </label>
            <input
              type="number" min="1"
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
              placeholder={form.type === 'ADJUSTMENT' ? 'Enter new total stock' : 'Enter quantity'}
              value={form.quantity}
              onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}
            />
          </div>

          {/* Reason */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Reason (Optional)</label>
            <input
              type="text"
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
              placeholder="e.g. Damaged goods, Stock count correction…"
              value={form.reason}
              onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
            />
          </div>

          {/* Date */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Date (Optional — defaults to today)</label>
            <input
              type="date"
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
              value={form.date}
              onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
            />
          </div>

          <Button variant="success" style={{ width: '100%', justifyContent: 'center' }} loading={submitting} onClick={handleSubmit}>
            Apply Adjustment
          </Button>

          {/* Low stock alert */}
          {lowStock.length > 0 && (
            <div style={{ marginTop: 4, padding: '10px 12px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 6 }}>⚠️ {lowStock.length} product{lowStock.length > 1 ? 's' : ''} low on stock</div>
              {lowStock.slice(0, 4).map(p => (
                <div key={p.id} style={{ fontSize: 12, color: '#92400e', padding: '2px 0', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{p.name}</span>
                  <span style={{ fontWeight: 700 }}>{p.stock} left</span>
                </div>
              ))}
              {lowStock.length > 4 && <div style={{ fontSize: 11, color: '#92400e', marginTop: 2 }}>+{lowStock.length - 4} more…</div>}
            </div>
          )}
        </div>

        {/* ── Right: Movement history ── */}
        <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>📋 Movement History</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['ALL', 'IN', 'OUT', 'ADJUSTMENT'].map(t => (
                <button key={t} onClick={() => setTypeFilter(t)} style={{
                  padding: '5px 12px', borderRadius: 8, border: '1.5px solid',
                  borderColor: typeFilter === t ? '#4f46e5' : '#e2e8f0',
                  background:  typeFilter === t ? '#4f46e5' : '#fff',
                  color:       typeFilter === t ? '#fff'    : '#64748b',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>{t}</button>
              ))}
            </div>
          </div>

          <input
            style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 14 }}
            placeholder="🔍  Search by product name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
              <div style={{ fontSize: 36 }}>📦</div>
              <div style={{ marginTop: 8, fontSize: 14 }}>No movements found</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {/* Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 80px 1fr 100px', gap: 8, padding: '8px 12px', background: '#f8fafc', borderRadius: 8, marginBottom: 4 }}>
                {['Product', 'Type', 'Qty', 'Reason', 'Date'].map(h => (
                  <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
                ))}
              </div>
              {/* Rows */}
              <div style={{ maxHeight: 480, overflowY: 'auto' }}>
                {filtered.map((m, i) => {
                  const tc = typeConfig[m.type] || typeConfig['IN'];
                  return (
                    <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 80px 1fr 100px', gap: 8, padding: '10px 12px', borderBottom: '1px solid #f1f5f9', alignItems: 'center', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{m.product?.name || `#${m.product_id}`}</div>
                        {m.product?.sku && <div style={{ fontSize: 11, color: '#94a3b8' }}>{m.product.sku}</div>}
                      </div>
                      <div>
                        <span style={{ background: tc.bg, color: tc.color, border: `1px solid ${tc.border}`, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{tc.label}</span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: m.type === 'IN' ? '#16a34a' : m.type === 'OUT' ? '#dc2626' : '#b45309' }}>
                        {m.type === 'IN' ? '+' : m.type === 'OUT' ? '−' : '='}{m.quantity}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{m.reason || <span style={{ color: '#cbd5e1' }}>—</span>}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{m.date ? new Date(m.date + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
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

  userRole: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.neutral[600],
    fontWeight: theme.typography.fontWeight.normal
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