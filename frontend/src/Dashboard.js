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
import { ToastContainer, useToast } from './components/ui/Toast';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export default function Dashboard({ user, token, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const { toasts, toast, remove } = useToast();
  const [data, setData] = useState({
    products: [],
    categories: [],
    suppliers: [],
    customers: [],
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      const [productsRes, categoriesRes, suppliersRes, customersRes, salesRes, purchasesRes, lowStockRes] = await Promise.all([
        fetch(`${API}/products?tenant_id=${user.tenant_id}`, { headers }),
        fetch(`${API}/categories?tenant_id=${user.tenant_id}`, { headers }),
        fetch(`${API}/suppliers?tenant_id=${user.tenant_id}`, { headers }),
        fetch(`${API}/customers?tenant_id=${user.tenant_id}`, { headers }),
        fetch(`${API}/sales?tenant_id=${user.tenant_id}`, { headers }),
        fetch(`${API}/purchases?tenant_id=${user.tenant_id}`, { headers }),
        fetch(`${API}/products/low-stock?tenant_id=${user.tenant_id}`, { headers })
      ]);

      const products = await productsRes.json();
      const categories = await categoriesRes.json();
      const suppliers = await suppliersRes.json();
      const customers = await customersRes.json();
      const sales = await salesRes.json();
      const purchases = await purchasesRes.json();
      const lowStock = await lowStockRes.json();

      setData({
        products: products.data || [],
        categories: categories.data || [],
        suppliers: suppliers.data || [],
        customers: customers.data || [],
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

  // ── Global search ──────────────────────────────────────────────────────────
  const handleSearch = (q) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); setSearchOpen(false); return; }
    const lower = q.toLowerCase();
    const results = [];
    data.products.forEach(p => {
      if (p.name?.toLowerCase().includes(lower) || p.sku?.toLowerCase().includes(lower))
        results.push({ type: 'Product', icon: '📦', label: p.name, sub: p.sku ? `SKU: ${p.sku}` : `Stock: ${p.stock}`, tab: 'products' });
    });
    data.suppliers.forEach(s => {
      if (s.name?.toLowerCase().includes(lower) || s.email?.toLowerCase().includes(lower))
        results.push({ type: 'Supplier', icon: '🏭', label: s.name, sub: s.email || s.contact || '', tab: 'suppliers' });
    });
    data.customers.forEach(c => {
      if (c.name?.toLowerCase().includes(lower) || c.email?.toLowerCase().includes(lower))
        results.push({ type: 'Customer', icon: '👥', label: c.name, sub: c.email || c.phone || '', tab: 'customers' });
    });
    data.categories.forEach(c => {
      if (c.name?.toLowerCase().includes(lower))
        results.push({ type: 'Category', icon: '🏷️', label: c.name, sub: '', tab: 'categories' });
    });
    data.sales.forEach(s => {
      const amount = `UGX ${parseFloat(s.total_amount || 0).toLocaleString()}`;
      if (amount.toLowerCase().includes(lower) || s.payment_method?.toLowerCase().includes(lower))
        results.push({ type: 'Sale', icon: '💰', label: `Sale — ${amount}`, sub: s.payment_method?.replace('_', ' '), tab: 'sales' });
    });
    setSearchResults(results.slice(0, 8));
    setSearchOpen(results.length > 0);
  };

  const goToResult = (result) => {
    setActiveTab(result.tab);
    setSearchQuery('');
    setSearchResults([]);
    setSearchOpen(false);
  };

  const isOwnerOrAdmin = user.roles && user.roles.some(r => ['owner', 'admin'].includes(r.name));

  const menuItems = [
    { id: 'overview',         label: 'Overview',        icon: '📊', color: 'primary' },
    { id: 'pos',              label: 'POS',             icon: '🖥️', color: 'success' },
    { id: 'products',         label: 'Products',        icon: '📦', color: 'success' },
    { id: 'categories',       label: 'Categories',      icon: '🏷️', color: 'warning' },
    { id: 'suppliers',        label: 'Suppliers',       icon: '🏭', color: 'neutral' },
    { id: 'customers',        label: 'Customers',       icon: '👥', color: 'primary' },
    { id: 'sales',            label: 'Sales',           icon: '💰', color: 'success' },
    { id: 'purchases',        label: 'Purchases',       icon: '🛒', color: 'primary' },
    { id: 'stock-movements',  label: 'Stock Movements', icon: '🔄', color: 'neutral' },
    { id: 'reports',          label: 'Reports',         icon: '📈', color: 'danger' },
    ...(isOwnerOrAdmin ? [{ id: 'users', label: 'Users', icon: '🔑', color: 'primary' }] : []),
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
          <div style={{ ...styles.searchContainer, position: 'relative' }}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              style={styles.searchInput}
              type="text"
              placeholder="Search products, suppliers, customers..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
              onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
            />
            {searchOpen && searchResults.length > 0 && (
              <div style={{
                position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 1000,
                background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden',
              }}>
                {searchResults.map((r, i) => (
                  <div key={i} onMouseDown={() => goToResult(r)} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
                    cursor: 'pointer', borderBottom: i < searchResults.length - 1 ? '1px solid #f8fafc' : 'none',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ fontSize: 18 }}>{r.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.label}</div>
                      {r.sub && <div style={{ fontSize: 12, color: '#94a3b8' }}>{r.sub}</div>}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#4f46e5', background: '#ede9fe', padding: '2px 8px', borderRadius: 20 }}>{r.type}</span>
                  </div>
                ))}
              </div>
            )}
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

          {activeTab === 'overview' && <OverviewTab data={data} loading={loading} onNavigate={setActiveTab} onAddProduct={() => setShowAddProduct(true)} />}
          {activeTab === 'pos' && (
            <POSTab
              products={data.products}
              customers={data.customers}
              token={token}
              user={user}
              toast={toast}
              onSaleCompleted={(sale) => {
                setData(prev => ({
                  ...prev,
                  sales: [sale, ...prev.sales],
                  stats: { ...prev.stats, totalSales: prev.stats.totalSales + parseFloat(sale.total_amount || 0) },
                  products: prev.products.map(p => {
                    const item = sale.sale_items?.find(i => i.product_id === p.id)
                               || sale.saleItems?.find(i => i.product_id === p.id);
                    return item ? { ...p, stock: p.stock - item.quantity } : p;
                  })
                }));
                toast.success('Sale completed!', `UGX ${parseFloat(sale.total_amount || 0).toLocaleString()} recorded.`);
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
              toast={toast}
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
          {activeTab === 'suppliers' && (
            <SuppliersTab
              suppliers={data.suppliers}
              loading={loading}
              token={token}
              user={user}
              toast={toast}
              onSupplierAdded={s => setData(prev => ({ ...prev, suppliers: [...prev.suppliers, s] }))}
              onSupplierUpdated={s => setData(prev => ({ ...prev, suppliers: prev.suppliers.map(x => x.id === s.id ? s : x) }))}
              onSupplierDeleted={id => setData(prev => ({ ...prev, suppliers: prev.suppliers.filter(s => s.id !== id) }))}
            />
          )}
          {activeTab === 'customers' && (
            <CustomersTab
              customers={data.customers}
              loading={loading}
              token={token}
              user={user}
              toast={toast}
              onCustomerAdded={customer => setData(prev => ({ ...prev, customers: [...prev.customers, customer] }))}
              onCustomerUpdated={customer => setData(prev => ({ ...prev, customers: prev.customers.map(c => c.id === customer.id ? customer : c) }))}
              onCustomerDeleted={id => setData(prev => ({ ...prev, customers: prev.customers.filter(c => c.id !== id) }))}
            />
          )}
          {activeTab === 'sales' && <SalesTab sales={data.sales} loading={loading} onNewSale={() => setActiveTab('pos')} />}
          {activeTab === 'purchases' && (
            <PurchasesTab
              purchases={data.purchases}
              loading={loading}
              token={token}
              user={user}
              suppliers={data.suppliers}
              products={data.products}
              toast={toast}
              onPurchaseAdded={(p) => {
                setData(prev => ({
                  ...prev,
                  purchases: [p, ...prev.purchases],
                  stats: { ...prev.stats, totalPurchases: prev.stats.totalPurchases + parseFloat(p.total_amount || 0) },
                  products: prev.products.map(prod => {
                    const item = p.purchase_items?.find(i => i.product_id === prod.id);
                    return item ? { ...prod, stock: prod.stock + item.quantity } : prod;
                  })
                }));
              }}
            />
          )}
          {activeTab === 'reports' && <ReportsTab data={data} loading={loading} token={token} />}
          {activeTab === 'stock-movements' && <StockMovementsTab token={token} products={data.products} />}
          {activeTab === 'users' && isOwnerOrAdmin && (
            <UsersTab token={token} user={user} toast={toast} />
          )}
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
          onSuccess={(p) => { handleAddProduct(p); toast.success('Product added', `"${p.name}" added to inventory.`); }}
          onCancel={() => setShowAddProduct(false)}
        />
      </Modal>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onRemove={remove} />
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ data, loading, onNavigate, onAddProduct }) {
  const quickActions = [
    {
      id: 'new-sale',
      icon: '💰',
      title: 'New Sale',
      description: 'Process a new sale transaction',
      onClick: () => onNavigate('pos')
    },
    {
      id: 'add-product',
      icon: '📦',
      title: 'Add Product',
      description: 'Add a new product to inventory',
      onClick: onAddProduct
    },
    {
      id: 'add-supplier',
      icon: '🏭',
      title: 'Add Supplier',
      description: 'Register a new supplier',
      onClick: () => onNavigate('suppliers')
    },
    {
      id: 'record-purchase',
      icon: '🛒',
      title: 'Record Purchase',
      description: 'Record a new purchase order',
      onClick: () => onNavigate('purchases')
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
              onAction: () => onNavigate('pos')
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
function ProductsTab({ products, onAddProduct, loading, token, user, onProductDeleted, categories, suppliers, onProductUpdated, toast }) {
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
        toast.success('Product deleted', `"${deletingProduct.name}" has been removed.`);
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

const supS = {
  label: { fontSize: 12, fontWeight: 600, color: '#374151', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6, display: 'block' },
  input: {
    padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10,
    fontSize: 14, fontFamily: 'inherit', outline: 'none', width: '100%',
    boxSizing: 'border-box', background: '#f8fafc', color: '#0f172a',
    transition: 'border-color 0.2s, background 0.2s',
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

// Suppliers Tab Component
function SuppliersTab({ suppliers, loading, token, user, toast, onSupplierAdded, onSupplierUpdated, onSupplierDeleted }) {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  const EMPTY_FORM = { name: '', contact: '', email: '', address: '' };
  const [showModal, setShowModal]   = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch]         = useState('');

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (supplier) => {
    setEditTarget(supplier);
    setForm({ name: supplier.name, contact: supplier.contact || '', email: supplier.email || '', address: supplier.address || '' });
    setFormError(null);
    setShowModal(true);
  };

  const handleDelete = async (supplier) => {
    if (!window.confirm(`Delete supplier "${supplier.name}"? This cannot be undone.`)) return;
    setDeletingId(supplier.id);
    try {
      const res = await fetch(`${API_URL}/suppliers/${supplier.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to delete supplier');
      onSupplierDeleted(supplier.id);
      toast.success('Supplier deleted', `"${supplier.name}" has been removed.`);
    } catch (e) {
      toast.error('Delete failed', e.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const isEdit = !!editTarget;
      const url    = isEdit ? `${API_URL}/suppliers/${editTarget.id}` : `${API_URL}/suppliers`;
      const res    = await fetch(url, {
        method:  isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, Accept: 'application/json' },
        body:    JSON.stringify({ ...form, tenant_id: user.tenant_id }),
      });
      const json = await res.json();
      if (!res.ok) { setFormError(json?.message || 'Something went wrong.'); return; }
      isEdit ? onSupplierUpdated(json.data) : onSupplierAdded(json.data);
      toast.success(isEdit ? 'Supplier updated' : 'Supplier added', `"${json.data.name}" has been ${isEdit ? 'updated' : 'added'}.`);
      setShowModal(false);
    } catch {
      setFormError('Could not reach the server.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = suppliers.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.contact?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.pageContainer}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Suppliers</h1>
          <p style={styles.pageSubtitle}>Manage your vendor relationships and contacts</p>
        </div>
        <Button variant="primary" icon="+" iconPosition="left" onClick={openAdd}>
          Add Supplier
        </Button>
      </div>

      {/* Search bar */}
      {suppliers.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <input
            style={{ ...fS.input, maxWidth: 320 }}
            placeholder="🔍  Search suppliers…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}

      {loading ? (
        <div style={styles.cardsGrid}>
          {[...Array(6)].map((_, i) => <div key={i} style={styles.skeletonCard} />)}
        </div>
      ) : suppliers.length === 0 ? (
        <div style={styles.contentCard}>
          <EmptyState
            icon="🏭"
            title="No suppliers yet"
            description="Add suppliers to track where you purchase your products."
            actionLabel="Add First Supplier"
            onAction={openAdd}
          />
        </div>
      ) : filtered.length === 0 ? (
        <div style={styles.contentCard}>
          <EmptyState
            icon="🔍"
            title="No suppliers match your search"
            description="Try a different name, email, or contact."
            actionLabel="Clear Search"
            onAction={() => setSearch('')}
          />
        </div>
      ) : (
        <div style={styles.cardsGrid}>
          {filtered.map(supplier => (
            <div key={supplier.id} style={styles.supplierCard}>
              <div style={styles.supplierHeader}>
                <div style={styles.supplierIcon}>🏭</div>
                <h3 style={styles.supplierName}>{supplier.name}</h3>
              </div>
              <div style={styles.supplierDetails}>
                <div style={styles.supplierDetail}>
                  <span style={styles.supplierDetailIcon}>📞</span>
                  <span style={{ color: supplier.contact ? '#0f172a' : '#94a3b8' }}>
                    {supplier.contact || 'No contact'}
                  </span>
                </div>
                <div style={styles.supplierDetail}>
                  <span style={styles.supplierDetailIcon}>📧</span>
                  <span style={{ color: supplier.email ? '#0f172a' : '#94a3b8' }}>
                    {supplier.email || 'No email'}
                  </span>
                </div>
                <div style={styles.supplierDetail}>
                  <span style={styles.supplierDetailIcon}>📍</span>
                  <span style={{ color: supplier.address ? '#0f172a' : '#94a3b8' }}>
                    {supplier.address || 'No address'}
                  </span>
                </div>
              </div>
              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
                <button
                  onClick={() => openEdit(supplier)}
                  style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: '1px solid #3b82f6', background: '#eff6ff', color: '#3b82f6', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleDelete(supplier)}
                  disabled={deletingId === supplier.id}
                  style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: '1px solid #ef4444', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
                >
                  {deletingId === supplier.id ? 'Deleting…' : '🗑️ Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editTarget ? 'Edit Supplier' : 'Add New Supplier'}
        size="lg"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {/* Row 1: Name (full width) */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={supS.label}>Supplier Name *</label>
            <input style={supS.input} placeholder="e.g. Kampala Distributors" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          {/* Row 2: Contact + Email side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={supS.label}>Contact / Phone</label>
              <input style={supS.input} placeholder="+256 700 000 000" value={form.contact}
                onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={supS.label}>Email</label>
              <input style={supS.input} type="email" placeholder="supplier@example.com" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
          </div>
          {/* Row 3: Address (full width) */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={supS.label}>Address</label>
            <input style={supS.input} placeholder="Street, City, Country" value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          </div>

          {formError && (
            <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 }}>
              ⚠️ {formError}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, paddingTop: 8, borderTop: '1px solid #f1f5f9', marginTop: 4 }}>
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saving} style={{ flex: 1 }}>
              {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Add Supplier'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// Customers Tab Component
function CustomersTab({ customers, loading, token, user, toast, onCustomerAdded, onCustomerUpdated, onCustomerDeleted }) {
  const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  const [showModal, setShowModal]   = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm]             = useState({ name: '', phone: '', email: '', status: 'active' });
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch]         = useState('');

  const openAdd = () => {
    setEditTarget(null);
    setForm({ name: '', phone: '', email: '', status: 'active' });
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (customer) => {
    setEditTarget(customer);
    setForm({ name: customer.name, phone: customer.phone || '', email: customer.email || '', status: customer.status || 'active' });
    setFormError(null);
    setShowModal(true);
  };

  const handleDelete = async (customer) => {
    if (!window.confirm(`Delete customer "${customer.name}"? This cannot be undone.`)) return;
    setDeletingId(customer.id);
    try {
      const res = await fetch(`${API}/customers/${customer.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      if (!res.ok) { const j = await res.json(); toast.error('Delete failed', j?.message || 'Failed to delete.'); return; }
      onCustomerDeleted(customer.id);
      toast.success('Customer deleted', `"${customer.name}" has been removed.`);
    } catch { toast.error('Delete failed', 'Could not reach the server.'); }
    finally { setDeletingId(null); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const isEdit = !!editTarget;
      const url    = isEdit ? `${API}/customers/${editTarget.id}` : `${API}/customers`;
      const res    = await fetch(url, {
        method:  isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, Accept: 'application/json' },
        body:    JSON.stringify({ ...form, tenant_id: user.tenant_id }),
      });
      const json = await res.json();
      if (!res.ok) { setFormError(json?.message || 'Failed to save customer.'); return; }
      isEdit ? onCustomerUpdated(json.data) : onCustomerAdded(json.data);
      toast.success(isEdit ? 'Customer updated' : 'Customer added', `"${json.data.name}" has been ${isEdit ? 'updated' : 'added'}.`);
      setShowModal(false);
    } catch { setFormError('Could not reach the server.'); }
    finally { setSaving(false); }
  };

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.toLowerCase().includes(search.toLowerCase())
  );
  const { paged: pagedCustomers, page: cPage, setPage: setCPage, totalPages: cTotalPages, total: cTotal, pageSize: cPageSize } = usePagination(filtered);

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

      {/* Search */}
      {customers.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <input
            style={{ ...supS.input, maxWidth: 320 }}
            placeholder="🔍  Search by name, email or phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}

      {loading ? (
        <div style={styles.cardsGrid}>
          {[...Array(6)].map((_, i) => <div key={i} style={styles.skeletonCard} />)}
        </div>
      ) : customers.length === 0 ? (
        <div style={styles.contentCard}>
          <EmptyState icon="👥" title="No customers yet"
            description="Add customers to keep track of who you sell to."
            actionLabel="Add First Customer" onAction={openAdd} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={styles.contentCard}>
          <EmptyState icon="🔍" title="No customers match your search"
            description="Try a different name, email or phone."
            actionLabel="Clear Search" onAction={() => setSearch('')} />
        </div>
      ) : (
        <div style={styles.contentCard}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                {['Customer', 'Phone', 'Email', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedCustomers.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '14px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {c.name?.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>{c.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 14px', color: '#475569', fontSize: 14 }}>{c.phone || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                  <td style={{ padding: '14px 14px', color: '#475569', fontSize: 14 }}>{c.email || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                  <td style={{ padding: '14px 14px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      background: c.status === 'active' ? '#f0fdf4' : '#f8fafc',
                      color: c.status === 'active' ? '#16a34a' : '#64748b',
                      border: `1px solid ${c.status === 'active' ? '#bbf7d0' : '#e2e8f0'}`,
                      textTransform: 'capitalize',
                    }}>{c.status || 'active'}</span>
                  </td>
                  <td style={{ padding: '14px 14px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => openEdit(c)} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #3b82f6', background: '#eff6ff', color: '#3b82f6', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Edit</button>
                      <button onClick={() => handleDelete(c)} disabled={deletingId === c.id} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #ef4444', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                        {deletingId === c.id ? '…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <InlinePager page={cPage} totalPages={cTotalPages} total={cTotal} pageSize={cPageSize} setPage={setCPage} />
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}
        title={editTarget ? 'Edit Customer' : 'Add New Customer'} size="lg">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {/* Row 1: Name + Phone */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={supS.label}>Full Name *</label>
              <input style={supS.input} placeholder="e.g. John Doe" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={supS.label}>Phone</label>
              <input style={supS.input} placeholder="+256 700 000 000" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>
          {/* Row 2: Email + Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={supS.label}>Email</label>
              <input style={supS.input} type="email" placeholder="customer@example.com" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={supS.label}>Status</label>
              <select style={supS.input} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {formError && (
            <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 }}>
              ⚠️ {formError}
            </div>
          )}
          <div style={{ display: 'flex', gap: 12, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</Button>
            <Button type="submit" variant="primary" loading={saving} style={{ flex: 1 }}>
              {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Add Customer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// POS Tab Component
function POSTab({ products, customers, token, user, onSaleCompleted }) {
  const [search, setSearch]           = useState('');
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

  const inStockProducts = products.filter(p => Number(p.stock) > 0);

  const filtered = inStockProducts.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(search.toLowerCase())
  );

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

  const cartTotal = cart.reduce((sum, i) => sum + i.subtotal, 0);

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
        }),
      });
      const data = await res.json();
      if (!res.ok) { setSaleError(data?.message || 'Checkout failed.'); return; }
      setLastReceipt({ ...data.data, cartSnapshot: cart, paymentMethod });
      onSaleCompleted(data.data);
      setCart([]);
      setSearch('');
      setCustomerType('walk_in');
      setSelectedCustomerId('');
      setNewCustomer({ name: '', phone: '', email: '' });
      setCustomerSearch('');
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
            <div style={{ borderTop: '1px dashed #e2e8f0', marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16 }}>
              <span>Total</span>
              <span>UGX {parseFloat(lastReceipt.total_amount).toLocaleString()}</span>
            </div>
            <div style={{ marginTop: 6, fontSize: 13, color: '#64748b', textAlign: 'right' }}>
              Payment: <strong>{lastReceipt.paymentMethod.replace('_', ' ')}</strong>
            </div>
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

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
              <div style={{ fontSize: 36 }}>📦</div>
              <div style={{ marginTop: 8 }}>{search ? 'No products match your search' : 'No products in stock'}</div>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 700, fontSize: 18 }}>Total</span>
                <span style={{ fontWeight: 700, fontSize: 20, color: '#0f172a' }}>UGX {cartTotal.toLocaleString()}</span>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={posS.label}>Payment Method</label>
                <select style={posS.select} value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                  <option value="cash">💵 Cash</option>
                  <option value="card">💳 Card</option>
                  <option value="mobile_money">📱 Mobile Money</option>
                  <option value="bank_transfer">🏦 Bank Transfer</option>
                </select>
              </div>

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

// Sales Tab Component
function SalesTab({ sales, loading, onNewSale }) {
  const columns = [
    { key: 'sale_date', title: 'Date', type: 'date' },
    { key: 'total_amount', title: 'Amount', type: 'currency' },
    {
      key: 'payment_method',
      title: 'Payment Method',
      render: (value) => <Badge variant="success" size="sm">{value}</Badge>
    },
    {
      key: 'saleItems',
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
        <Button variant="success" icon="+" iconPosition="left" onClick={onNewSale}>
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
            onAction: onNewSale
          }}
        />
      </div>
    </div>
  );
}

// Purchases Tab Component
function PurchasesTab({ purchases, loading, token, user, suppliers, products, toast, onPurchaseAdded }) {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  const EMPTY_LINE = { product_id: '', quantity: '', cost_price: '' };
  const [showModal, setShowModal]   = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [lines, setLines]           = useState([{ ...EMPTY_LINE }]);
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch]         = useState('');

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' };

  const openModal = () => {
    setSupplierId('');
    setLines([{ ...EMPTY_LINE }]);
    setFormError(null);
    setShowModal(true);
  };

  const setLine = (i, key, val) => setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [key]: val } : l));
  const addLine    = () => setLines(prev => [...prev, { ...EMPTY_LINE }]);
  const removeLine = (i) => setLines(prev => prev.filter((_, idx) => idx !== i));

  const lineTotal = (l) => {
    const q = parseFloat(l.quantity) || 0;
    const c = parseFloat(l.cost_price) || 0;
    return q * c;
  };
  const grandTotal = lines.reduce((s, l) => s + lineTotal(l), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supplierId) { setFormError('Please select a supplier.'); return; }
    const validLines = lines.filter(l => l.product_id && l.quantity && l.cost_price);
    if (validLines.length === 0) { setFormError('Add at least one complete product line.'); return; }

    setSaving(true);
    setFormError(null);
    try {
      const res  = await fetch(`${API_URL}/purchases`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          supplier_id: supplierId,
          items: validLines.map(l => ({ product_id: l.product_id, quantity: parseInt(l.quantity), cost_price: parseFloat(l.cost_price) })),
        }),
      });
      const json = await res.json();
      if (!res.ok) { setFormError(json?.message || 'Something went wrong.'); return; }
      onPurchaseAdded(json.data);
      toast.success('Purchase recorded', `UGX ${parseFloat(json.data.total_amount || 0).toLocaleString()} purchase recorded.`);
      setShowModal(false);
    } catch { setFormError('Could not reach the server.'); }
    finally { setSaving(false); }
  };

  const filtered = purchases.filter(p =>
    p.supplier?.name?.toLowerCase().includes(search.toLowerCase()) ||
    new Date(p.purchase_date).toLocaleDateString().includes(search)
  );

  return (
    <div style={styles.pageContainer}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Purchases</h1>
          <p style={styles.pageSubtitle}>Track inventory purchases and supplier orders</p>
        </div>
        <Button variant="primary" icon="+" iconPosition="left" onClick={openModal}>
          Record Purchase
        </Button>
      </div>

      {/* Search */}
      {purchases.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <input
            style={{ ...supS.input, maxWidth: 320 }}
            placeholder="🔍  Search by supplier or date…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}

      <div style={styles.contentCard}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading purchases…</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="🛒"
            title={search ? 'No purchases match your search' : 'No purchases yet'}
            description={search ? 'Try a different supplier or date.' : 'Record purchases from suppliers to track inventory costs.'}
            actionLabel={search ? 'Clear Search' : 'Record First Purchase'}
            onAction={search ? () => setSearch('') : openModal}
          />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                {['Date', 'Supplier', 'Items', 'Total Amount', 'Details'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <>
                  <tr key={p.id} style={{ borderBottom: expandedId === p.id ? 'none' : '1px solid #f8fafc', background: expandedId === p.id ? '#fafbff' : 'transparent' }}>
                    <td style={{ padding: '14px 14px', color: '#475569', fontSize: 14 }}>
                      {new Date(p.purchase_date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '14px 14px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                        {p.supplier?.name || 'N/A'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 14px', color: '#475569', fontSize: 14 }}>
                      {p.purchase_items?.length || 0} item{(p.purchase_items?.length || 0) !== 1 ? 's' : ''}
                    </td>
                    <td style={{ padding: '14px 14px', fontWeight: 700, color: '#0f172a', fontSize: 14 }}>
                      UGX {parseFloat(p.total_amount || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 14px' }}>
                      <button
                        onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                        style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
                      >
                        {expandedId === p.id ? '▲ Hide' : '▼ View'}
                      </button>
                    </td>
                  </tr>
                  {expandedId === p.id && (
                    <tr key={`${p.id}-exp`}>
                      <td colSpan={5} style={{ padding: '0 14px 16px 14px', background: '#fafbff' }}>
                        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                {['Product', 'Qty', 'Cost Price', 'Subtotal'].map(h => (
                                  <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {(p.purchase_items || []).map((item, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '10px 14px', fontSize: 14, color: '#0f172a' }}>{item.product?.name || `Product #${item.product_id}`}</td>
                                  <td style={{ padding: '10px 14px', fontSize: 14, color: '#475569' }}>{item.quantity}</td>
                                  <td style={{ padding: '10px 14px', fontSize: 14, color: '#475569' }}>UGX {parseFloat(item.cost_price || 0).toLocaleString()}</td>
                                  <td style={{ padding: '10px 14px', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>UGX {(item.quantity * item.cost_price).toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Record Purchase Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Record New Purchase" size="lg">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* Supplier */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={supS.label}>Supplier *</label>
            <select style={supS.input} value={supplierId} onChange={e => setSupplierId(e.target.value)} required>
              <option value="">— Select supplier —</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* Product Lines */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={supS.label}>Products *</label>
              <button type="button" onClick={addLine} style={{ fontSize: 13, color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                + Add Line
              </button>
            </div>

            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, padding: '0 4px' }}>
              {['Product', 'Qty', 'Cost Price (UGX)', ''].map(h => (
                <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</span>
              ))}
            </div>

            {lines.map((line, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, alignItems: 'center' }}>
                <select style={supS.input} value={line.product_id} onChange={e => setLine(i, 'product_id', e.target.value)}>
                  <option value="">— Select product —</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input style={supS.input} type="number" min="1" placeholder="0" value={line.quantity}
                  onChange={e => setLine(i, 'quantity', e.target.value)} />
                <input style={supS.input} type="number" min="0" step="0.01" placeholder="0.00" value={line.cost_price}
                  onChange={e => setLine(i, 'cost_price', e.target.value)} />
                <button type="button" onClick={() => removeLine(i)} disabled={lines.length === 1}
                  style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #fecaca', background: '#fef2f2', color: '#ef4444', cursor: lines.length === 1 ? 'not-allowed' : 'pointer', opacity: lines.length === 1 ? 0.4 : 1, fontSize: 14 }}>
                  ✕
                </button>
              </div>
            ))}

            {/* Grand total */}
            {grandTotal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                  Total: UGX {grandTotal.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {formError && (
            <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 }}>
              ⚠️ {formError}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</Button>
            <Button type="submit" variant="primary" loading={saving} style={{ flex: 1 }}>
              {saving ? 'Recording…' : 'Record Purchase'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// Reports Tab Component
function ReportsTab({ data, loading, token }) {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };

  const [activeReport, setActiveReport] = useState('overview');
  const [dailyDate, setDailyDate]       = useState(new Date().toISOString().split('T')[0]);
  const [monthlyMonth, setMonthlyMonth] = useState(new Date().toISOString().slice(0, 7));
  const [reportData, setReportData]     = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError]   = useState(null);

  const totalRevenue = data.stats.totalSales - data.stats.totalPurchases;

  // ── Derived analytics from existing data ──────────────────────────────────

  // Sales by payment method
  const paymentBreakdown = data.sales.reduce((acc, s) => {
    const m = s.payment_method || 'unknown';
    acc[m] = (acc[m] || 0) + parseFloat(s.total_amount || 0);
    return acc;
  }, {});
  const paymentTotal = Object.values(paymentBreakdown).reduce((a, b) => a + b, 0);

  // Top 5 products by revenue (from sale items)
  const productRevenue = {};
  data.sales.forEach(s => {
    (s.sale_items || s.saleItems || []).forEach(item => {
      const name = item.product?.name || `#${item.product_id}`;
      productRevenue[name] = (productRevenue[name] || 0) + parseFloat(item.subtotal || 0);
    });
  });
  const topProducts = Object.entries(productRevenue)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxProductRev = topProducts[0]?.[1] || 1;

  // Top 5 suppliers by purchase spend
  const supplierSpend = {};
  data.purchases.forEach(p => {
    const name = p.supplier?.name || `#${p.supplier_id}`;
    supplierSpend[name] = (supplierSpend[name] || 0) + parseFloat(p.total_amount || 0);
  });
  const topSuppliers = Object.entries(supplierSpend).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxSupplierSpend = topSuppliers[0]?.[1] || 1;

  // ── Fetch daily / monthly reports ─────────────────────────────────────────
  const fetchReport = async () => {
    setReportLoading(true);
    setReportError(null);
    setReportData(null);
    try {
      const url = activeReport === 'daily'
        ? `${API_URL}/sales/daily-report?date=${dailyDate}`
        : `${API_URL}/purchases/monthly-report?month=${monthlyMonth}`;
      const res  = await fetch(url, { headers });
      const json = await res.json();
      if (!res.ok) { setReportError(json?.message || 'Failed to load report.'); return; }
      setReportData(json.data);
    } catch { setReportError('Could not reach the server.'); }
    finally { setReportLoading(false); }
  };

  const paymentColors = { cash: '#16a34a', card: '#2563eb', mobile_money: '#7c3aed', bank_transfer: '#0891b2' };
  const getPayColor = (m) => paymentColors[m] || '#64748b';

  const tabs = [
    { id: 'overview',  label: '📊 Overview'  },
    { id: 'daily',     label: '📅 Daily Sales' },
    { id: 'monthly',   label: '🗓️ Monthly Purchases' },
  ];

  return (
    <div style={styles.pageContainer}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Reports & Analytics</h1>
          <p style={styles.pageSubtitle}>Analyze your business performance and trends</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '2px solid #f1f5f9', paddingBottom: 0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setActiveReport(t.id); setReportData(null); setReportError(null); }} style={{
            padding: '9px 18px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: 600,
            color: activeReport === t.id ? '#4f46e5' : '#64748b',
            borderBottom: activeReport === t.id ? '2px solid #4f46e5' : '2px solid transparent',
            marginBottom: -2, transition: 'all 0.15s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeReport === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              { label: 'Total Revenue', value: `UGX ${data.stats.totalSales.toLocaleString()}`, icon: '💰', color: '#16a34a', bg: '#f0fdf4' },
              { label: 'Total Costs',   value: `UGX ${data.stats.totalPurchases.toLocaleString()}`, icon: '🛒', color: '#d97706', bg: '#fffbeb' },
              { label: 'Net Profit',    value: `UGX ${totalRevenue.toLocaleString()}`, icon: '📈', color: totalRevenue >= 0 ? '#16a34a' : '#dc2626', bg: totalRevenue >= 0 ? '#f0fdf4' : '#fef2f2' },
              { label: 'Low Stock',     value: data.stats.lowStockCount, icon: '⚠️', color: data.stats.lowStockCount > 0 ? '#dc2626' : '#16a34a', bg: data.stats.lowStockCount > 0 ? '#fef2f2' : '#f0fdf4' },
            ].map(k => (
              <div key={k.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px 22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k.label}</p>
                    <p style={{ margin: '8px 0 0', fontSize: 22, fontWeight: 700, color: k.color }}>{k.value}</p>
                  </div>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{k.icon}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Payment method breakdown */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 22 }}>
              <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Sales by Payment Method</h3>
              {Object.keys(paymentBreakdown).length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: 14 }}>No sales data yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {Object.entries(paymentBreakdown).map(([method, amount]) => (
                    <div key={method}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', textTransform: 'capitalize' }}>{method.replace('_', ' ')}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>UGX {amount.toLocaleString()} <span style={{ color: '#94a3b8', fontWeight: 400 }}>({Math.round(amount / paymentTotal * 100)}%)</span></span>
                      </div>
                      <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(amount / paymentTotal) * 100}%`, background: getPayColor(method), borderRadius: 4, transition: 'width 0.4s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Inventory summary */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 22 }}>
              <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Inventory Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Total Products',  value: data.stats.totalProducts, icon: '📦' },
                  { label: 'Categories',      value: data.categories.length,   icon: '🏷️' },
                  { label: 'Suppliers',       value: data.suppliers.length,    icon: '🏭' },
                  { label: 'Customers',       value: data.customers.length,    icon: '👥' },
                  { label: 'Total Sales',     value: data.sales.length,        icon: '💰' },
                  { label: 'Total Purchases', value: data.purchases.length,    icon: '🛒' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
                    <span style={{ fontSize: 14, color: '#475569' }}>{r.icon} {r.label}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Top products */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 22 }}>
              <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Top Products by Revenue</h3>
              {topProducts.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: 14 }}>No sales data yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {topProducts.map(([name, rev], i) => (
                    <div key={name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>#{i + 1} {name}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>UGX {rev.toLocaleString()}</span>
                      </div>
                      <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(rev / maxProductRev) * 100}%`, background: '#4f46e5', borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top suppliers */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 22 }}>
              <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Top Suppliers by Spend</h3>
              {topSuppliers.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: 14 }}>No purchase data yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {topSuppliers.map(([name, spend], i) => (
                    <div key={name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>#{i + 1} {name}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>UGX {spend.toLocaleString()}</span>
                      </div>
                      <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(spend / maxSupplierSpend) * 100}%`, background: '#0891b2', borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── DAILY SALES REPORT ── */}
      {activeReport === 'daily' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={supS.label}>Select Date</label>
              <input style={{ ...supS.input, width: 200 }} type="date" value={dailyDate} onChange={e => setDailyDate(e.target.value)} />
            </div>
            <Button variant="primary" onClick={fetchReport} loading={reportLoading}>Generate Report</Button>
          </div>

          {reportError && <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 }}>⚠️ {reportError}</div>}

          {reportData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {[
                  { label: 'Date',         value: reportData.date },
                  { label: 'Transactions', value: reportData.total_transactions },
                  { label: 'Total Sales',  value: `UGX ${parseFloat(reportData.total_sales || 0).toLocaleString()}` },
                ].map(k => (
                  <div key={k.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px' }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{k.label}</p>
                    <p style={{ margin: '8px 0 0', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{k.value}</p>
                  </div>
                ))}
              </div>
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Sales Transactions</h3>
                </div>
                {reportData.sales?.length === 0 ? (
                  <p style={{ padding: 20, color: '#94a3b8', fontSize: 14 }}>No sales on this date.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['Time', 'Cashier', 'Payment', 'Items', 'Amount'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.sales?.map(s => (
                        <tr key={s.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#475569' }}>{new Date(s.created_at).toLocaleTimeString()}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#0f172a' }}>{s.user?.name || '—'}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: getPayColor(s.payment_method) + '18', color: getPayColor(s.payment_method), border: `1px solid ${getPayColor(s.payment_method)}40`, textTransform: 'capitalize' }}>
                              {s.payment_method?.replace('_', ' ')}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#475569' }}>{s.sale_items?.length || 0}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>UGX {parseFloat(s.total_amount || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MONTHLY PURCHASES REPORT ── */}
      {activeReport === 'monthly' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={supS.label}>Select Month</label>
              <input style={{ ...supS.input, width: 200 }} type="month" value={monthlyMonth} onChange={e => setMonthlyMonth(e.target.value)} />
            </div>
            <Button variant="primary" onClick={fetchReport} loading={reportLoading}>Generate Report</Button>
          </div>

          {reportError && <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 }}>⚠️ {reportError}</div>}

          {reportData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {[
                  { label: 'Month',            value: reportData.month },
                  { label: 'Transactions',     value: reportData.total_transactions },
                  { label: 'Total Purchases',  value: `UGX ${parseFloat(reportData.total_purchases || 0).toLocaleString()}` },
                ].map(k => (
                  <div key={k.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px' }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{k.label}</p>
                    <p style={{ margin: '8px 0 0', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{k.value}</p>
                  </div>
                ))}
              </div>
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Purchase Transactions</h3>
                </div>
                {reportData.purchases?.length === 0 ? (
                  <p style={{ padding: 20, color: '#94a3b8', fontSize: 14 }}>No purchases this month.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['Date', 'Supplier', 'Items', 'Total Amount'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.purchases?.map(p => (
                        <tr key={p.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#475569' }}>{new Date(p.purchase_date).toLocaleDateString()}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#0f172a' }}>{p.supplier?.name || '—'}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#475569' }}>{p.purchase_items?.length || 0}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>UGX {parseFloat(p.total_amount || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Users Tab Component
function UsersTab({ token, user: currentUser, toast }) {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  const EMPTY_FORM = { name: '', email: '', password: '', role_ids: [] };
  const [users, setUsers]           = useState([]);
  const [roles, setRoles]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch]         = useState('');

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [uRes, rRes] = await Promise.all([
          fetch(`${API_URL}/users`, { headers }),
          fetch(`${API_URL}/roles`, { headers }),
        ]);
        const uJson = await uRes.json();
        const rJson = await rRes.json();
        setUsers(uJson.data || []);
        setRoles(rJson.data || []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    load();
  }, [token]);

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditTarget(u);
    setForm({ name: u.name, email: u.email, password: '', role_ids: (u.roles || []).map(r => r.id) });
    setFormError(null);
    setShowModal(true);
  };

  const toggleRole = (id) => {
    setForm(f => ({
      ...f,
      role_ids: f.role_ids.includes(id) ? f.role_ids.filter(r => r !== id) : [...f.role_ids, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.role_ids.length === 0) { setFormError('Please assign at least one role.'); return; }
    setSaving(true);
    setFormError(null);
    try {
      const isEdit = !!editTarget;
      const body   = isEdit
        ? { name: form.name, email: form.email, role_ids: form.role_ids, ...(form.password ? { password: form.password } : {}) }
        : { name: form.name, email: form.email, password: form.password, role_ids: form.role_ids };

      const res  = await fetch(`${API_URL}/users${isEdit ? `/${editTarget.id}` : ''}`, {
        method: isEdit ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) { setFormError(json?.message || 'Something went wrong.'); return; }

      if (isEdit) {
        setUsers(prev => prev.map(u => u.id === editTarget.id ? json.data : u));
      } else {
        setUsers(prev => [...prev, json.data]);
      }
      toast.success(isEdit ? 'User updated' : 'User added', `"${json.data.name}" has been ${isEdit ? 'updated' : 'added'}.`);
      setShowModal(false);
    } catch { setFormError('Could not reach the server.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Delete user "${u.name}"? This cannot be undone.`)) return;
    setDeletingId(u.id);
    try {
      const res = await fetch(`${API_URL}/users/${u.id}`, { method: 'DELETE', headers });
      if (!res.ok) { const j = await res.json(); toast.error('Delete failed', j?.message || 'Failed to delete user.'); return; }
      setUsers(prev => prev.filter(x => x.id !== u.id));
      toast.success('User deleted', `"${u.name}" has been removed.`);
    } catch { toast.error('Delete failed', 'Could not reach the server.'); }
    finally { setDeletingId(null); }
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );
  const { paged: pagedUsers, page: uPage, setPage: setUPage, totalPages: uTotalPages, total: uTotal, pageSize: uPageSize } = usePagination(filtered);

  const isOwner = currentUser.roles?.some(r => r.name === 'owner');

  const roleColors = { owner: '#7c3aed', admin: '#2563eb', manager: '#0891b2', cashier: '#16a34a' };
  const getRoleColor = (name) => roleColors[name] || '#64748b';

  return (
    <div style={styles.pageContainer}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>User Management</h1>
          <p style={styles.pageSubtitle}>Manage team members and their access roles</p>
        </div>
        <Button variant="primary" icon="+" iconPosition="left" onClick={openAdd}>
          Add User
        </Button>
      </div>

      {/* Search */}
      {users.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <input
            style={{ ...supS.input, maxWidth: 320 }}
            placeholder="🔍  Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}

      <div style={styles.contentCard}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading users…</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="👤"
            title={search ? 'No users match your search' : 'No users yet'}
            description={search ? 'Try a different name or email.' : 'Add team members to get started.'}
            actionLabel={search ? 'Clear Search' : 'Add First User'}
            onAction={search ? () => setSearch('') : openAdd}
          />
        ) : (
          <>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                {['User', 'Email', 'Roles', 'Joined', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedUsers.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  {/* Avatar + Name */}
                  <td style={{ padding: '14px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', background: '#ede9fe',
                        color: '#7c3aed', fontWeight: 700, fontSize: 15,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>{u.name}</div>
                        {u.id === currentUser.id && (
                          <span style={{ fontSize: 11, color: '#7c3aed', fontWeight: 500 }}>You</span>
                        )}
                      </div>
                    </div>
                  </td>
                  {/* Email */}
                  <td style={{ padding: '14px 14px', color: '#475569', fontSize: 14 }}>{u.email}</td>
                  {/* Roles */}
                  <td style={{ padding: '14px 14px' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {(u.roles || []).length > 0 ? u.roles.map(r => (
                        <span key={r.id} style={{
                          padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                          background: getRoleColor(r.name) + '18', color: getRoleColor(r.name),
                          border: `1px solid ${getRoleColor(r.name)}40`,
                        }}>{r.name}</span>
                      )) : <span style={{ color: '#94a3b8', fontSize: 13 }}>No role</span>}
                    </div>
                  </td>
                  {/* Joined */}
                  <td style={{ padding: '14px 14px', color: '#94a3b8', fontSize: 13 }}>
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                  </td>
                  {/* Actions */}
                  <td style={{ padding: '14px 14px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => openEdit(u)} style={{
                        padding: '5px 12px', borderRadius: 6, border: '1px solid #3b82f6',
                        background: '#eff6ff', color: '#3b82f6', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                      }}>Edit</button>
                      {u.id !== currentUser.id && (isOwner || !u.roles?.some(r => r.name === 'owner')) && (
                        <button onClick={() => handleDelete(u)} disabled={deletingId === u.id} style={{
                          padding: '5px 12px', borderRadius: 6, border: '1px solid #ef4444',
                          background: '#fef2f2', color: '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                        }}>
                          {deletingId === u.id ? '…' : 'Delete'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <InlinePager page={uPage} totalPages={uTotalPages} total={uTotal} pageSize={uPageSize} setPage={setUPage} />
          </>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editTarget ? 'Edit User' : 'Add New User'}
        size="lg"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {/* Row 1: Name + Email */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={supS.label}>Full Name *</label>
              <input style={supS.input} placeholder="John Doe" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={supS.label}>Email *</label>
              <input style={supS.input} type="email" placeholder="user@business.com" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
          </div>

          {/* Password */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={supS.label}>{editTarget ? 'New Password (leave blank to keep current)' : 'Password *'}</label>
            <input style={supS.input} type="password" placeholder={editTarget ? '••••••••' : 'Min 8 chars, upper, lower, number'}
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required={!editTarget} minLength={editTarget ? 0 : 8} />
          </div>

          {/* Roles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={supS.label}>Assign Roles *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {roles.map(r => {
                const selected = form.role_ids.includes(r.id);
                const color    = getRoleColor(r.name);
                return (
                  <button key={r.id} type="button" onClick={() => toggleRole(r.id)} style={{
                    padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    border: `2px solid ${selected ? color : '#e2e8f0'}`,
                    background: selected ? color + '18' : '#f8fafc',
                    color: selected ? color : '#64748b',
                    transition: 'all 0.15s',
                  }}>
                    {selected ? '✓ ' : ''}{r.name}
                  </button>
                );
              })}
            </div>
            {form.role_ids.length === 0 && (
              <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Select at least one role</p>
            )}
          </div>

          {formError && (
            <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 }}>
              ⚠️ {formError}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, paddingTop: 8, borderTop: '1px solid #f1f5f9', marginTop: 4 }}>
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saving} style={{ flex: 1 }}>
              {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Add User'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// Stock Movements Tab Component
function StockMovementsTab({ token, products }) {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };

  const [movements, setMovements] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res  = await fetch(`${API_URL}/stock-movements`, { headers });
        const json = await res.json();
        setMovements(json.data || []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    load();
  }, [token]);

  const filtered = movements.filter(m => {
    const productName = m.product?.name || '';
    if (search && !productName.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter && m.type !== typeFilter) return false;
    if (productFilter && String(m.product_id) !== String(productFilter)) return false;
    return true;
  });

  const totalIn  = movements.filter(m => m.type === 'IN').reduce((s, m) => s + m.quantity, 0);
  const totalOut = movements.filter(m => m.type === 'OUT').reduce((s, m) => s + m.quantity, 0);

  return (
    <div style={styles.pageContainer}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Stock Movements</h1>
          <p style={styles.pageSubtitle}>Full audit trail of all inventory changes</p>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Movements', value: movements.length, icon: '🔄', color: '#4f46e5', bg: '#ede9fe' },
          { label: 'Stock In',        value: totalIn,           icon: '📥', color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Stock Out',       value: totalOut,          icon: '📤', color: '#dc2626', bg: '#fef2f2' },
        ].map(k => (
          <div key={k.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{k.icon}</div>
            <div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k.label}</p>
              <p style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 700, color: k.color }}>{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <input style={{ ...fS.input, maxWidth: 240 }} placeholder="🔍  Search by product…"
          value={search} onChange={e => setSearch(e.target.value)} />
        <select style={fS.select} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          <option value="IN">📥 Stock In</option>
          <option value="OUT">📤 Stock Out</option>
        </select>
        <select style={fS.select} value={productFilter} onChange={e => setProductFilter(e.target.value)}>
          <option value="">All Products</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {(search || typeFilter || productFilter) && (
          <button style={fS.clear} onClick={() => { setSearch(''); setTypeFilter(''); setProductFilter(''); }}>✕ Clear</button>
        )}
      </div>

      <div style={styles.contentCard}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading movements…</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="🔄" title="No stock movements found"
            description={search || typeFilter || productFilter ? 'Try adjusting your filters.' : 'Stock movements are recorded automatically when sales and purchases are made.'}
            actionLabel={search || typeFilter || productFilter ? 'Clear Filters' : null}
            onAction={search || typeFilter || productFilter ? () => { setSearch(''); setTypeFilter(''); setProductFilter(''); } : null}
          />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                {['Date', 'Product', 'Type', 'Quantity', 'Reference', 'Source'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '13px 14px', color: '#475569', fontSize: 13 }}>
                    {new Date(m.date || m.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '13px 14px', fontWeight: 600, color: '#0f172a', fontSize: 14 }}>
                    {m.product?.name || `#${m.product_id}`}
                  </td>
                  <td style={{ padding: '13px 14px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      background: m.type === 'IN' ? '#f0fdf4' : '#fef2f2',
                      color: m.type === 'IN' ? '#16a34a' : '#dc2626',
                      border: `1px solid ${m.type === 'IN' ? '#bbf7d0' : '#fecaca'}`,
                    }}>
                      {m.type === 'IN' ? '📥' : '📤'} {m.type}
                    </span>
                  </td>
                  <td style={{ padding: '13px 14px', fontWeight: 700, fontSize: 14, color: m.type === 'IN' ? '#16a34a' : '#dc2626' }}>
                    {m.type === 'IN' ? '+' : '-'}{m.quantity}
                  </td>
                  <td style={{ padding: '13px 14px', color: '#475569', fontSize: 13 }}>
                    #{m.reference_id || '—'}
                  </td>
                  <td style={{ padding: '13px 14px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      background: m.reference_type === 'sale' ? '#eff6ff' : '#fefce8',
                      color: m.reference_type === 'sale' ? '#2563eb' : '#92400e',
                      border: `1px solid ${m.reference_type === 'sale' ? '#bfdbfe' : '#fde68a'}`,
                      textTransform: 'capitalize',
                    }}>
                      {m.reference_type || '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Shared inline pagination ──────────────────────────────────────────────────
function usePagination(items, pageSize = 15) {
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [items]);
  const totalPages = Math.ceil(items.length / pageSize);
  const paged = items.slice((page - 1) * pageSize, page * pageSize);
  return { paged, page, setPage, totalPages, total: items.length, pageSize };
}

function InlinePager({ page, totalPages, total, pageSize, setPage }) {
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) pages.push(i);
    else if (pages[pages.length - 1] !== '...') pages.push('...');
  }
  const btn = (active) => ({
    minWidth: 32, height: 32, borderRadius: 7,
    border: `1px solid ${active ? '#4f46e5' : '#e2e8f0'}`,
    background: active ? '#4f46e5' : '#fff',
    color: active ? '#fff' : '#475569',
    fontSize: 13, fontWeight: 500, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  });
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderTop: '1px solid #f1f5f9', background: '#fafbff' }}>
      <span style={{ fontSize: 13, color: '#64748b' }}>Showing <strong>{from}–{to}</strong> of <strong>{total}</strong></span>
      <div style={{ display: 'flex', gap: 6 }}>
        <button style={{ ...btn(false), opacity: page === 1 ? 0.4 : 1 }} onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
        {pages.map((p, i) => p === '...'
          ? <span key={`e${i}`} style={{ padding: '0 4px', color: '#94a3b8', fontSize: 13, alignSelf: 'center' }}>…</span>
          : <button key={p} style={btn(p === page)} onClick={() => setPage(p)}>{p}</button>
        )}
        <button style={{ ...btn(false), opacity: page === totalPages ? 0.4 : 1 }} onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>›</button>
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