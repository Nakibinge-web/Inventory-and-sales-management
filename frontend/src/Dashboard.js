import { useState, useEffect, useCallback, useRef } from 'react';
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
    { id: 'ai',               label: 'AI Assistant',    icon: '🤖', color: 'primary' },
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
            <div style={{ width: 28, height: 28, borderRadius: 6, background: theme.colors.primary[600], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
            </div>
            <h1 style={styles.logo}>BusinessYo</h1>
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
          <div style={{ ...styles.notificationIcon, color: '#94a3b8', fontSize: '18px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
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
          <div style={{ padding: '20px 12px 12px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* App label */}
            <p style={{ fontSize: 10, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 8px', marginBottom: 12 }}>
              Main Menu
            </p>

            {/* Main nav items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {menuItems.filter(i => i.id !== 'users').map(item => (
                <button
                  key={item.id}
                  style={{
                    ...styles.menuItem,
                    ...(activeTab === item.id ? styles.menuItemActive : {})
                  }}
                  onClick={() => setActiveTab(item.id)}
                  onMouseEnter={e => { if (activeTab !== item.id) { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.color = '#f1f5f9'; }}}
                  onMouseLeave={e => { if (activeTab !== item.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}}
                >
                  <span style={styles.menuIcon}>{item.icon}</span>
                  <span style={styles.menuLabel}>{item.label}</span>
                  {activeTab === item.id && <div style={styles.activeIndicator} />}
                </button>
              ))}
            </div>

            {/* Spacer pushes admin section to bottom */}
            <div style={{ flex: 1 }} />

            {/* Admin section */}
            {isOwnerOrAdmin && (
              <div>
                <div style={{ height: 1, background: '#1e293b', margin: '12px 8px 14px' }} />
                <p style={{ fontSize: 10, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 8px', marginBottom: 8 }}>
                  Administration
                </p>
                <button
                  style={{
                    ...styles.menuItem,
                    ...(activeTab === 'users' ? styles.menuItemActive : {})
                  }}
                  onClick={() => setActiveTab('users')}
                  onMouseEnter={e => { if (activeTab !== 'users') e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.color = '#f1f5f9'; }}
                  onMouseLeave={e => { if (activeTab !== 'users') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}}
                >
                  <span style={styles.menuIcon}>🔑</span>
                  <span style={styles.menuLabel}>Users</span>
                  {activeTab === 'users' && <div style={styles.activeIndicator} />}
                </button>
                <div style={{ height: 20 }} />
              </div>
            )}
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
              categories={data.categories}
              customers={data.customers}
              token={token}
              user={user}
              toast={toast}
              onSaleCompleted={(sale) => {
                setData(prev => {
                  // If the sale created a new customer, add them to the customers list
                  const newCustomerEntry = sale.customer;
                  const customerAlreadyExists = newCustomerEntry
                    ? prev.customers.some(c => c.id === newCustomerEntry.id)
                    : true;
                  return {
                    ...prev,
                    sales: [sale, ...prev.sales],
                    stats: { ...prev.stats, totalSales: prev.stats.totalSales + parseFloat(sale.total_amount || 0) },
                    products: prev.products.map(p => {
                      const item = sale.sale_items?.find(i => i.product_id === p.id)
                                 || sale.saleItems?.find(i => i.product_id === p.id);
                      return item ? { ...p, stock: p.stock - item.quantity } : p;
                    }),
                    customers: (!customerAlreadyExists && newCustomerEntry)
                      ? [...prev.customers, newCustomerEntry]
                      : prev.customers,
                  };
                });
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
              onPurchaseAdded={(p, newProducts) => {
                setData(prev => {
                  // Update stock for existing products that were purchased
                  const updatedProducts = prev.products.map(prod => {
                    const item = p.purchase_items?.find(i => i.product_id === prod.id);
                    return item ? { ...prod, stock: prod.stock + item.quantity } : prod;
                  });
                  // Append any brand-new products created during this purchase
                  const mergedProducts = newProducts && newProducts.length > 0
                    ? [...updatedProducts, ...newProducts.filter(np => !updatedProducts.some(ep => ep.id === np.id))]
                    : updatedProducts;
                  return {
                    ...prev,
                    purchases: [p, ...prev.purchases],
                    stats: { ...prev.stats, totalPurchases: prev.stats.totalPurchases + parseFloat(p.total_amount || 0) },
                    products: mergedProducts,
                  };
                });
              }}
            />
          )}
          {activeTab === 'reports' && <ReportsTab data={data} loading={loading} token={token} />}
          {activeTab === 'ai' && <AiTab token={token} data={data} />}
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
  const today = new Date().toLocaleDateString('en-UG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const hour  = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const recentSalesColumns = [
    { key: 'sale_date',      title: 'Date',    type: 'date' },
    { key: 'total_amount',   title: 'Amount',  type: 'currency' },
    { key: 'payment_method', title: 'Payment', render: v => (
      <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
        background: '#f1f5f9', color: '#475569', textTransform: 'capitalize' }}>
        {v?.replace(/_/g, ' ') || '—'}
      </span>
    )},
    { key: 'user', title: 'Cashier', render: v => v?.name || '—' }
  ];

  const kpi = [
    { label: 'Total Products',   value: data.stats.totalProducts,                          sub: 'Items in inventory',  color: 'primary' },
    { label: 'Total Sales',      value: `UGX ${data.stats.totalSales.toLocaleString()}`,   sub: 'Revenue generated',   color: 'success' },
    { label: 'Total Purchases',  value: `UGX ${data.stats.totalPurchases.toLocaleString()}`, sub: 'Stock investment',  color: 'warning' },
    { label: 'Low Stock Alerts', value: data.stats.lowStockCount,                          sub: 'Items need reordering', color: 'danger', trend: data.stats.lowStockCount > 0 ? 'up' : 'neutral', tv: data.stats.lowStockCount > 0 ? 'Needs attention' : 'All good' },
  ];

  const quickActions = [
    { label: 'New Sale',        sub: 'Process a sale transaction', action: () => onNavigate('pos'),       accent: '#4f46e5' },
    { label: 'Add Product',     sub: 'Add to your inventory',       action: onAddProduct,                  accent: '#16a34a' },
    { label: 'Add Supplier',    sub: 'Register a new vendor',       action: () => onNavigate('suppliers'), accent: '#0891b2' },
    { label: 'Record Purchase', sub: 'Log a supplier order',        action: () => onNavigate('purchases'), accent: '#d97706' },
  ];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '4px 0 32px' }}>

      {/* ── Hero header ───────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        borderRadius: 16, padding: '32px 36px', marginBottom: 36,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 24px rgba(15,23,42,0.14)',
      }}>
        <div>
          <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{today}</p>
          <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.5px' }}>
            {greeting} 👋
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: '#94a3b8', maxWidth: 440, lineHeight: 1.5 }}>
            Here's a live snapshot of your business. Use the quick actions below to get things done fast.
          </p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Today's Sales</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#f8fafc', letterSpacing: '-1px' }}>
            UGX {data.sales
              .filter(s => new Date(s.sale_date).toDateString() === new Date().toDateString())
              .reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0)
              .toLocaleString()}
          </div>
        </div>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 36 }}>
        {kpi.map(k => (
          <DashboardCard key={k.label} title={k.label} value={k.value} subtitle={k.sub}
            color={k.color} trend={k.trend} trendValue={k.tv} loading={loading} />
        ))}
      </div>

      {/* ── Quick Actions ──────────────────────────────────── */}
      <div style={{ marginBottom: 36 }}>
        <h2 style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Quick Actions
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {quickActions.map(q => (
            <button key={q.label} onClick={q.action} style={{
              padding: '18px 20px', borderRadius: 12,
              border: `1.5px solid #e2e8f0`,
              background: '#ffffff', cursor: 'pointer', textAlign: 'left',
              transition: 'all 0.15s', outline: 'none', position: 'relative', overflow: 'hidden',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = q.accent;
              e.currentTarget.style.background = q.accent + '08';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 4px 16px ${q.accent}22`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}>
              {/* Accent dot */}
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: q.accent, marginBottom: 12 }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{q.label}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>{q.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Bottom row: Recent Sales + Low Stock ──────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: data.lowStock.length > 0 ? '1fr 340px' : '1fr', gap: 20 }}>

        {/* Recent Sales */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Recent Sales</h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>Last {Math.min(data.sales.length, 5)} transactions</p>
            </div>
            <button onClick={() => onNavigate('sales')} style={{
              fontSize: 12, color: '#6366f1', background: '#ede9fe', border: 'none',
              cursor: 'pointer', fontWeight: 600, padding: '5px 12px', borderRadius: 20,
            }}>
              View all
            </button>
          </div>
          <DataTable
            columns={recentSalesColumns}
            data={data.sales.slice(0, 5)}
            loading={loading}
            emptyStateProps={{
              title: 'No sales recorded yet',
              description: 'Head to the POS to process your first transaction.',
              actionLabel: 'Open POS',
              onAction: () => onNavigate('pos')
            }}
          />
        </div>

        {/* Low Stock */}
        {data.lowStock.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Low Stock</h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>Needs reordering</p>
              </div>
              <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                {data.lowStock.length} items
              </span>
            </div>
            <div>
              {data.lowStock.slice(0, 6).map((product, i) => (
                <div key={product.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 22px',
                  borderBottom: i < Math.min(data.lowStock.length, 6) - 1 ? '1px solid #f8fafc' : 'none',
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Min: {product.reorder_level} units</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#dc2626' }}>{product.stock}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>in stock</div>
                  </div>
                </div>
              ))}
              {data.lowStock.length > 6 && (
                <div style={{ padding: '12px 22px' }}>
                  <button onClick={() => onNavigate('products')} style={{
                    fontSize: 12, color: '#6366f1', background: 'none', border: 'none',
                    cursor: 'pointer', fontWeight: 600, padding: 0,
                  }}>
                    +{data.lowStock.length - 6} more items →
                  </button>
                </div>
              )}
            </div>
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
      render: (value, row) => {
        const src = row.image_url || (value ? `${API_BASE}/storage/${value}` : null);
        return src
          ? <img src={src} alt="product"
              style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' }} />
          : <div style={{ width: 40, height: 40, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M9 21V9"/>
              </svg>
            </div>;
      }
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
      {/* Hero header */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 24px rgba(15,23,42,0.14)',
      }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Inventory Management</p>
          <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.4px' }}>Products</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
            {products.length} product{products.length !== 1 ? 's' : ''} in your inventory
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowExpiry(true)} style={{
            padding: '9px 18px', borderRadius: 8, border: '1px solid #334155',
            background: 'transparent', color: '#94a3b8', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#a5b4fc'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.color = '#94a3b8'; }}>
            Expiry Tracker
          </button>
          <button onClick={onAddProduct} style={{
            padding: '9px 20px', borderRadius: 8, border: 'none',
            background: '#4f46e5', color: '#fff', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#4338ca'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#4f46e5'; }}>
            + Add Product
          </button>
        </div>
      </div>

      {/* Summary stats */}
      {!loading && products.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total Products', value: products.length, color: '#4f46e5' },
            { label: 'In Stock',       value: products.filter(p => Number(p.stock) > Number(p.reorder_level || 0)).length, color: '#16a34a' },
            { label: 'Low Stock',      value: products.filter(p => Number(p.stock) > 0 && Number(p.stock) <= Number(p.reorder_level || 0)).length, color: '#d97706' },
            { label: 'Out of Stock',   value: products.filter(p => Number(p.stock) === 0).length, color: '#dc2626' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px', borderTop: `3px solid ${s.color}` }}>
              <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
              <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a' }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div style={styles.contentCard}>
        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <input
            style={{ ...fS.input, flex: '1 1 220px' }}
            placeholder="Search by name or SKU…"
            value={filters.search}
            onChange={e => setFilter('search', e.target.value)}
          />
          <select style={fS.select} value={filters.category} onChange={e => setFilter('category', e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select style={fS.select} value={filters.status} onChange={e => setFilter('status', e.target.value)}>
            <option value="">All Statuses</option>
            <option value="in">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
          {(filters.search || filters.category || filters.status) && (
            <button style={fS.clear} onClick={() => setFilters({ search: '', category: '', status: '' })}>
              Clear filters
            </button>
          )}
        </div>

        <DataTable
          columns={columns}
          data={filteredProducts}
          loading={loading}
          emptyStateProps={{
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
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 24px rgba(15,23,42,0.14)',
      }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Inventory</p>
          <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.3px' }}>Categories</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
            {categories.length} {categories.length === 1 ? 'category' : 'categories'} — organise your products into logical groups
          </p>
        </div>
        <button onClick={openAdd} style={{
          padding: '9px 20px', borderRadius: 8, border: 'none',
          background: '#4f46e5', color: '#fff', cursor: 'pointer',
          fontSize: 13, fontWeight: 600,
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#4338ca'}
        onMouseLeave={e => e.currentTarget.style.background = '#4f46e5'}>
          + Add Category
        </button>
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
            actionLabel="Add First Category"
            onAction={openAdd}
          />
        </div>
      ) : (
        <div style={styles.cardsGrid}>
          {categories.map((category, idx) => {
            const colors = ['#4f46e5','#16a34a','#0891b2','#d97706','#dc2626','#7c3aed'];
            const accent = colors[idx % colors.length];
            return (
              <div key={category.id} style={{
                ...styles.categoryCard,
                borderTop: `3px solid ${accent}`,
              }}>
                <h3 style={styles.categoryTitle}>{category.name}</h3>
                <p style={styles.categoryDescription}>
                  {category.description || <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>No description</span>}
                </p>
                <div style={{ ...styles.categoryFooter, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={styles.categoryDate}>
                    {new Date(category.created_at).toLocaleDateString()}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => openEdit(category)} style={catS.editBtn}>Edit</button>
                    <button onClick={() => { setDeleteError(null); setDeletingCat(category); }} style={catS.deleteBtn}>Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
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
      {/* Hero header */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 24px rgba(15,23,42,0.14)',
      }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Procurement</p>
          <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.3px' }}>Suppliers</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
            {suppliers.length} {suppliers.length === 1 ? 'supplier' : 'suppliers'} — manage your vendor relationships
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {suppliers.length > 0 && (
            <input
              style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#f1f5f9', fontSize: 13, outline: 'none', width: 220 }}
              placeholder="Search suppliers…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          )}
          <button onClick={openAdd} style={{
            padding: '9px 20px', borderRadius: 8, border: 'none',
            background: '#4f46e5', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#4338ca'}
          onMouseLeave={e => e.currentTarget.style.background = '#4f46e5'}>
            + Add Supplier
          </button>
        </div>
      </div>

      {loading ? (
        <div style={styles.cardsGrid}>
          {[...Array(6)].map((_, i) => <div key={i} style={styles.skeletonCard} />)}
        </div>
      ) : suppliers.length === 0 ? (
        <div style={styles.contentCard}>
          <EmptyState title="No suppliers yet" description="Add suppliers to track where you purchase your products." actionLabel="Add First Supplier" onAction={openAdd} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={styles.contentCard}>
          <EmptyState title="No suppliers match your search" description="Try a different name, email, or contact." actionLabel="Clear Search" onAction={() => setSearch('')} />
        </div>
      ) : (
        <div style={styles.cardsGrid}>
          {filtered.map(supplier => (
            <div key={supplier.id} style={{ ...styles.supplierCard, transition: 'box-shadow 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'}>
              {/* Avatar + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: '#ede9fe', color: '#4f46e5', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {supplier.name?.charAt(0).toUpperCase()}
                </div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{supplier.name}</h3>
              </div>
              {/* Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {[
                  { label: 'Phone',   value: supplier.contact },
                  { label: 'Email',   value: supplier.email },
                  { label: 'Address', value: supplier.address },
                ].map(d => (
                  <div key={d.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', width: 52, flexShrink: 0, paddingTop: 1 }}>{d.label}</span>
                    <span style={{ fontSize: 13, color: d.value ? '#0f172a' : '#cbd5e1', fontStyle: d.value ? 'normal' : 'italic' }}>{d.value || '—'}</span>
                  </div>
                ))}
              </div>
              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
                <button onClick={() => openEdit(supplier)} style={{ flex: 1, padding: '7px 0', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  Edit
                </button>
                <button onClick={() => handleDelete(supplier)} disabled={deletingId === supplier.id} style={{ flex: 1, padding: '7px 0', borderRadius: 6, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  {deletingId === supplier.id ? 'Deleting…' : 'Delete'}
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
      const res = await fetch(`${API}/customers/${customer.id}?tenant_id=${user.tenant_id}`, {
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
      {/* Hero header */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 24px rgba(15,23,42,0.14)',
      }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>CRM</p>
          <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.3px' }}>Customers</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
            {customers.length} {customers.length === 1 ? 'customer' : 'customers'} — {customers.filter(c => c.status === 'active').length} active
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {customers.length > 0 && (
            <input
              style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#f1f5f9', fontSize: 13, outline: 'none', width: 220 }}
              placeholder="Search customers…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          )}
          <button onClick={openAdd} style={{
            padding: '9px 20px', borderRadius: 8, border: 'none',
            background: '#4f46e5', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#4338ca'}
          onMouseLeave={e => e.currentTarget.style.background = '#4f46e5'}>
            + Add Customer
          </button>
        </div>
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

          {formError && (
            <div style={custS.error}>
              <span>⚠️</span>
              <span>{formError}</span>
            </div>
          )}
        </form>
      </Modal>

      {/* ── Customer cards grid ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
          <div>Loading customers…</div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>👥</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
            {search ? 'No customers match your search' : 'No customers yet'}
          </div>
          {!search && (
            <div style={{ fontSize: 13, marginBottom: 16 }}>Add your first customer to get started.</div>
          )}
          {!search && (
            <Button variant="primary" icon="+" iconPosition="left" onClick={openAdd}>Add Customer</Button>
          )}
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {pagedCustomers.map(c => (
              <div key={c.id} style={{
                background: '#fff', borderRadius: 16, padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.07)', border: '1px solid #f1f5f9',
                display: 'flex', flexDirection: 'column', gap: 12,
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: '#ede9fe', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 22, flexShrink: 0,
                  }}>
                    👤
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>{c.name}</div>
                </div>

                {/* Contact info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {c.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569' }}>
                      <span>📞</span> {c.phone}
                    </div>
                  )}
                  {c.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569' }}>
                      <span>📧</span> {c.email}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569' }}>
                    <span>🚀</span>
                    <span style={{
                      fontWeight: 600,
                      color: c.status === 'active' ? '#16a34a' : '#64748b',
                    }}>
                      {c.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button
                    onClick={() => openEdit(c)}
                    style={{
                      padding: '8px 18px', borderRadius: 10, border: '1.5px solid #e2e8f0',
                      background: '#fff', color: '#0f172a', fontWeight: 600, fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(c)}
                    disabled={deletingId === c.id}
                    style={{
                      padding: '8px 18px', borderRadius: 10, border: 'none',
                      background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: 13,
                      cursor: deletingId === c.id ? 'not-allowed' : 'pointer',
                      opacity: deletingId === c.id ? 0.6 : 1,
                    }}
                  >
                    {deletingId === c.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {cTotalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 20 }}>
              <button onClick={() => setCPage(p => Math.max(1, p - 1))} disabled={cPage === 1}
                style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', cursor: cPage === 1 ? 'not-allowed' : 'pointer', color: '#64748b', fontWeight: 600 }}>
                ← Prev
              </button>
              <span style={{ fontSize: 13, color: '#64748b' }}>Page {cPage} of {cTotalPages} &nbsp;·&nbsp; {cTotal} customers</span>
              <button onClick={() => setCPage(p => Math.min(cTotalPages, p + 1))} disabled={cPage === cTotalPages}
                style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', cursor: cPage === cTotalPages ? 'not-allowed' : 'pointer', color: '#64748b', fontWeight: 600 }}>
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
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

  // ── Barcode scanner state ────────────────────────────────
  const barcodeInputRef                     = useRef(null);
  const [barcodeValue, setBarcodeValue]     = useState('');
  const [barcodeFlash, setBarcodeFlash]     = useState(null); // 'success' | 'error' | null
  const [barcodeMsg, setBarcodeMsg]         = useState('');
  const barcodeTimerRef                     = useRef(null);
  // Tracks rapid keystrokes to distinguish scanner input from manual typing
  const barcodeLastKeyTime                  = useRef(0);
  const barcodeAccumRef                     = useRef('');

  // Auto-focus barcode input when the POS mounts
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // ── Global keydown listener: redirect keystrokes to barcode field
  // even if the user has clicked elsewhere on the page.
  // Only redirects if the active element is not another input/textarea/select.
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
    }, 1800);
  };

  const handleBarcodeScan = (rawValue) => {
    const code = rawValue.trim();
    if (!code) return;

    // Match against barcode field first, then SKU as fallback
    const product = products.find(
      p => (p.barcode && p.barcode.trim() === code) ||
           (p.sku    && p.sku.trim().toLowerCase() === code.toLowerCase())
    );

    if (!product) {
      flashBarcode('error', `No product found for "${code}"`);
      return;
    }
    if (Number(product.stock) <= 0) {
      flashBarcode('error', `"${product.name}" is out of stock`);
      return;
    }

    addToCart(product);
    flashBarcode('success', `✓ Added: ${product.name}`);
  };

  // Detect scanner input: scanners fire characters in <50ms bursts then send Enter.
  // If Enter arrives after a rapid burst, treat as a scan (auto-submit).
  // If Enter arrives after slow typing, also submit — keeps manual entry working.
  const handleBarcodeKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBarcodeScan(barcodeValue);
      return;
    }
    // Track timing so we know if input was fast (scanner) vs slow (keyboard)
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
        <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Success banner */}
          <div style={{ background: 'linear-gradient(135deg, #065f46, #16a34a)', borderRadius: 16, padding: '28px 32px', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 style={{ margin: '0 0 6px', color: '#fff', fontSize: 22, fontWeight: 700 }}>Sale Complete</h2>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Transaction recorded successfully</p>
          </div>

          {/* Receipt */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 24 }}>
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #e2e8f0', paddingBottom: 14, marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>{user.tenant?.name || 'InventoryPro'}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{new Date().toLocaleString()}</div>
            </div>
            {lastReceipt.cartSnapshot.map(item => (
              <div key={item.product_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '5px 0', color: '#475569' }}>
                <span>{item.name} × {item.quantity}</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>UGX {item.subtotal.toLocaleString()}</span>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#16a34a', marginBottom: 4 }}>
                  <span>Tax</span>
                  <span>+ UGX {lastReceipt.taxAmount.toLocaleString()}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16, marginTop: 4 }}>
                <span>Total</span>
                <span>UGX {parseFloat(lastReceipt.total_amount).toLocaleString()}</span>
              </div>
            </div>
            <div style={{ marginTop: 6, fontSize: 13, color: '#64748b', textAlign: 'right', textTransform: 'capitalize' }}>
              Payment: <strong>{lastReceipt.paymentMethod?.replace(/_/g, ' ')}</strong>
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

          <button onClick={() => setLastReceipt(null)} style={{
            padding: '12px', borderRadius: 10, border: '1.5px solid #e2e8f0',
            background: '#fff', color: '#0f172a', cursor: 'pointer', fontSize: 14, fontWeight: 600,
          }}>
            New Sale
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        borderRadius: 16, padding: '24px 32px', marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 24px rgba(15,23,42,0.14)',
      }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sales</p>
          <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.3px' }}>Point of Sale</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>Search products, build a cart, and process payment</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Items in cart</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#f8fafc' }}>{cart.reduce((s, i) => s + i.quantity, 0)}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>

        {/* Left — product search & grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* ── Barcode scanner input ── */}
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                📷 Barcode Scanner
              </span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>— scan barcode to add instantly</span>
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
              {/* Barcode icon */}
              <svg style={{ position: 'absolute', left: 12, pointerEvents: 'none', opacity: 0.4 }}
                width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 5v14M7 5v14M11 5v14M15 5v10M19 5v14M15 18v1"/>
              </svg>
            </div>
            {/* Feedback message */}
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
            onFocus={() => { /* don't steal focus from barcode field on click */ }}
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
                <button key={p.id} style={posS.productCard} onClick={() => addToCart(p)}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(79,70,229,0.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}
                >
                  {/* Product initial avatar */}
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, fontSize: 15, fontWeight: 700, color: '#4f46e5' }}>
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={posS.productName}>{p.name}</div>
                  {p.sku && <div style={posS.productSku}>SKU: {p.sku}</div>}
                  <div style={posS.productPrice}>UGX {parseFloat(p.price).toLocaleString()}</div>
                  <div style={{ marginTop: 6, fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#f0fdf4', color: '#16a34a', fontWeight: 600 }}>
                    {p.stock} in stock
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right column — customer + cart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 20 }}>

          {/* Customer Card */}
          <div style={posS.cartPanel}>
            <div style={posS.cartHeader}>
              <div>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Customer</span>
                <span style={{ marginLeft: 6, fontSize: 11, color: '#94a3b8', fontWeight: 400 }}>Optional</span>
              </div>
            </div>
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { value: 'walk_in',  label: 'Walk-in Customer' },
                { value: 'existing', label: 'Existing Customer' },
                { value: 'new',      label: 'New Customer' },
              ].map(type => (
                <label key={type.value} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                  border: `1.5px solid ${customerType === type.value ? '#4f46e5' : '#e2e8f0'}`,
                  background: customerType === type.value ? '#f5f3ff' : '#fff',
                  transition: 'all 0.15s',
                }}>
                  <input type="radio" name="customerType" value={type.value}
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
              <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Cart {cart.length > 0 && <span style={{ marginLeft: 6, padding: '1px 8px', borderRadius: 20, background: '#ede9fe', color: '#4f46e5', fontSize: 12 }}>{cart.length}</span>}</span>
              {cart.length > 0 && <button style={posS.clearBtn} onClick={() => setCart([])}>Clear all</button>}
            </div>

            {cart.length === 0 ? (
              <div style={posS.emptyCart}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                </div>
                <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>Select products to add to cart</div>
              </div>
            ) : (
              <div style={posS.cartItems}>
                {cart.map(item => (
                  <div key={item.product_id} style={posS.cartItem}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={posS.cartItemName}>{item.name}</div>
                      <div style={posS.cartItemPrice}>UGX {item.price.toLocaleString()} each</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <button style={posS.qtyBtn} onClick={() => updateQty(item.product_id, item.quantity - 1)}>−</button>
                      <input style={posS.qtyInput} type="number" min={1} max={item.maxStock}
                        value={item.quantity} onChange={e => updateQty(item.product_id, e.target.value)} />
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
                <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13, marginBottom: 12 }}>
                  {saleError}
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || submitting}
                style={{
                  width: '100%', padding: '13px', borderRadius: 10, border: 'none',
                  background: cart.length === 0 ? '#e2e8f0' : '#16a34a',
                  color: cart.length === 0 ? '#94a3b8' : '#fff',
                  fontSize: 14, fontWeight: 700, cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s', letterSpacing: '0.02em',
                }}
                onMouseEnter={e => { if (cart.length > 0 && !submitting) e.currentTarget.style.background = '#15803d'; }}
                onMouseLeave={e => { if (cart.length > 0 && !submitting) e.currentTarget.style.background = '#16a34a'; }}
              >
                {submitting ? 'Processing…' : 'Complete Sale'}
              </button>
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
    boxSizing: 'border-box', background: '#fff', color: '#0f172a',
  },
  discountInput: {
    padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10,
    fontSize: 14, fontFamily: 'inherit', outline: 'none', width: 120,
    boxSizing: 'border-box', background: '#fff', textAlign: 'right',
  },
  productGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: 12,
  },
  productCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    padding: '16px 12px', border: '1.5px solid #e2e8f0', borderRadius: 12,
    background: '#fff', cursor: 'pointer', textAlign: 'center',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)', outline: 'none',
  },
  productName:  { fontSize: 13, fontWeight: 600, color: '#0f172a', lineHeight: 1.3, marginBottom: 2 },
  productSku:   { fontSize: 11, color: '#94a3b8' },
  productPrice: { fontSize: 13, fontWeight: 700, color: '#16a34a', marginTop: 4 },
  cartPanel: {
    background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14,
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  cartHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 16px', borderBottom: '1px solid #f1f5f9',
    background: '#fafafa',
  },
  clearBtn: {
    background: 'none', border: 'none', color: '#ef4444', fontSize: 12,
    cursor: 'pointer', fontWeight: 600, padding: 0,
  },
  emptyCart: {
    padding: '28px 16px', textAlign: 'center',
  },
  cartItems: {
    display: 'flex', flexDirection: 'column', maxHeight: 280, overflowY: 'auto',
  },
  cartItem: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 14px', borderBottom: '1px solid #f8fafc',
    flexWrap: 'wrap',
  },
  cartItemName:     { fontSize: 13, fontWeight: 600, color: '#0f172a' },
  cartItemPrice:    { fontSize: 11, color: '#94a3b8' },
  cartItemSubtotal: { fontSize: 13, fontWeight: 700, color: '#0f172a', width: '100%', textAlign: 'right', marginTop: 2 },
  qtyBtn: {
    width: 28, height: 28, borderRadius: 6, border: '1px solid #e2e8f0',
    background: '#f8fafc', color: '#475569', cursor: 'pointer', fontSize: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
    flexShrink: 0,
  },
  qtyInput: {
    width: 40, textAlign: 'center', border: '1px solid #e2e8f0',
    borderRadius: 6, padding: '4px 2px', fontSize: 13, outline: 'none',
  },
  removeBtn: {
    background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer',
    fontSize: 14, padding: '2px 4px', borderRadius: 4,
  },
  cartFooter: {
    padding: '16px 14px', borderTop: '1px solid #f1f5f9', background: '#fafafa',
  },
  select: {
    width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0',
    borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none',
    background: '#fff', color: '#0f172a', cursor: 'pointer',
  },
  label: {
    fontSize: 11, fontWeight: 700, color: '#64748b',
    textTransform: 'uppercase', letterSpacing: '0.06em',
    display: 'block', marginBottom: 6,
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

  const totalTx = filteredSales.length;
  const totalRevenue = filteredSales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0);

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
      render: (value) => (
        <span style={{
          padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
          background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0',
          textTransform: 'capitalize'
        }}>
          {value?.replace(/_/g, ' ') || '—'}
        </span>
      )
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

      {/* ── Page header ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 24px rgba(15,23,42,0.14)',
      }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Revenue</p>
          <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.3px' }}>Sales</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>Track all your sales transactions and revenue</p>
        </div>
        <button onClick={onNewSale}
          style={{ padding: '10px 22px', borderRadius: 9, border: 'none', background: '#16a34a', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, letterSpacing: '0.01em', display: 'flex', alignItems: 'center', gap: 7 }}
          onMouseEnter={e => e.currentTarget.style.background = '#15803d'}
          onMouseLeave={e => e.currentTarget.style.background = '#16a34a'}>
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> New Sale
        </button>
      </div>

      {/* ── KPI cards ── */}
      {!loading && sales.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
          {[
            { label: 'Total Transactions', value: totalTx,                                                                          icon: '🧾', color: '#4f46e5', bg: '#eef2ff' },
            { label: 'Total Revenue',      value: `UGX ${totalRevenue.toLocaleString()}`,                                           icon: '💰', color: '#16a34a', bg: '#f0fdf4' },
            { label: 'Average Sale',       value: `UGX ${totalTx ? Math.round(totalRevenue / totalTx).toLocaleString() : 0}`,       icon: '📊', color: '#0891b2', bg: '#ecfeff' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 22px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 11, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{s.icon}</div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={styles.contentCard}>

        {/* ── Filter bar ── */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, padding: '4px', background: '#f1f5f9', borderRadius: 12, width: 'fit-content' }}>
          {[
            { key: 'all',   label: 'All Sales',  icon: '⊞' },
            { key: 'today', label: 'Today',       icon: '◎' },
            { key: 'week',  label: 'This Week',   icon: '▦' },
            { key: 'month', label: 'This Month',  icon: '▤' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setDateFilter(f.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 16px', borderRadius: 9, border: 'none',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: dateFilter === f.key ? '#fff' : 'transparent',
                color:      dateFilter === f.key ? '#4f46e5' : '#64748b',
                boxShadow:  dateFilter === f.key ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 11, opacity: 0.7 }}>{f.icon}</span> {f.label}
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
                background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
                borderRadius: 14, padding: '20px 24px', marginBottom: 14,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                boxShadow: '0 2px 12px rgba(59,130,246,0.25)',
              }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                    This week's sales
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
                    UGX {weekTotal.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                    {weekCount} transaction{weekCount !== 1 ? 's' : ''} &nbsp;·&nbsp; {startLabel} – {endLabel}
                  </div>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '10px 18px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Daily avg</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>UGX {weekCount ? Math.round(weekTotal / 7).toLocaleString() : 0}</div>
                </div>
              </div>

              {/* Day cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                {dayTotals.map(({ day, count, total, isToday }) => {
                  const maxTotal = Math.max(...dayTotals.map(d => d.total), 1);
                  const barPct = Math.round((total / maxTotal) * 100);
                  return (
                    <div key={day.getTime()} style={{
                      background: isToday ? '#eff6ff' : '#fff',
                      border: `1.5px solid ${isToday ? '#3b82f6' : '#e2e8f0'}`,
                      borderRadius: 12, padding: '12px 10px',
                      display: 'flex', flexDirection: 'column', gap: 6,
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: isToday ? '#3b82f6' : '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                        {dayNames[day.getDay()]}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                        {day.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </div>
                      {/* Mini bar */}
                      <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${barPct}%`, background: count > 0 ? '#3b82f6' : '#e2e8f0', borderRadius: 2, transition: 'width 0.4s ease' }} />
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: count > 0 ? '#1d4ed8' : '#d1d5db', lineHeight: 1 }}>
                        {count}
                      </div>
                      <div style={{ fontSize: 10, color: count > 0 ? '#64748b' : '#d1d5db', fontWeight: 500 }}>
                        {count > 0 ? `UGX ${total.toLocaleString()}` : '—'}
                      </div>
                    </div>
                  );
                })}
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
                background: 'linear-gradient(135deg, #6d28d9 0%, #9333ea 100%)',
                borderRadius: 14, padding: '20px 24px', marginBottom: 14,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                boxShadow: '0 2px 12px rgba(109,40,217,0.25)',
              }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                    {monthName} sales
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
                    UGX {monthTotal.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                    {monthCount} transaction{monthCount !== 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '10px 18px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Weekly avg</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>UGX {weeks.length ? Math.round(monthTotal / weeks.length).toLocaleString() : 0}</div>
                </div>
              </div>

              {/* Week cards */}
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${weeks.length}, 1fr)`, gap: 10 }}>
                {weeks.map(({ label, start, end, count, total, isCurrent }) => {
                  const maxWeekTotal = Math.max(...weeks.map(w => w.total), 1);
                  const barPct = Math.round((total / maxWeekTotal) * 100);
                  return (
                    <div key={label} style={{
                      background: isCurrent ? '#faf5ff' : '#fff',
                      border: `1.5px solid ${isCurrent ? '#9333ea' : '#e2e8f0'}`,
                      borderRadius: 12, padding: '16px 14px',
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: isCurrent ? '#9333ea' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>
                        {label}
                      </div>
                      <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 10 }}>
                        {start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} – {end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </div>
                      {/* Mini bar */}
                      <div style={{ height: 5, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
                        <div style={{ height: '100%', width: `${barPct}%`, background: count > 0 ? '#9333ea' : '#e2e8f0', borderRadius: 3, transition: 'width 0.4s ease' }} />
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: count > 0 ? '#6d28d9' : '#d1d5db', marginBottom: 2, lineHeight: 1 }}>
                        {count}
                      </div>
                      <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>sale{count !== 1 ? 's' : ''}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: count > 0 ? '#16a34a' : '#d1d5db' }}>
                        {count > 0 ? `UGX ${total.toLocaleString()}` : '—'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        <DataTable
          columns={columns}
          data={filteredSales}
          loading={loading}
          emptyStateProps={{
            title: 'No sales yet',
            description: 'Start processing sales to see transaction history here.',
            actionLabel: 'Process First Sale',
            onAction: onNewSale
          }}
        />
      </div>

      {/* ── Custom Day Lookup ── */}
      <div style={{ ...styles.contentCard, marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🔍</div>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>Sales by Specific Day</h3>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>Select any date to view all sales made on that day</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Select Date</label>
            <input
              type="date"
              value={customDate}
              onChange={e => { setCustomDate(e.target.value); setCustomDaySales(null); }}
              style={{ padding: '9px 13px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 14, fontFamily: 'inherit', outline: 'none', background: '#fff', color: '#0f172a', cursor: 'pointer', minWidth: 180 }}
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
            style={{ padding: '9px 22px', borderRadius: 9, border: 'none', background: customDate ? '#4f46e5' : '#e2e8f0', color: customDate ? '#fff' : '#94a3b8', fontSize: 13, fontWeight: 700, cursor: customDate ? 'pointer' : 'not-allowed', transition: 'background 0.15s' }}
          >
            View Sales
          </button>
          {customDaySales !== null && (
            <button onClick={() => { setCustomDaySales(null); setCustomDate(''); }}
              style={{ padding: '9px 16px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Clear
            </button>
          )}
        </div>

        {customDaySales !== null && (
          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: 0, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ padding: '16px 22px', background: '#4f46e5', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Date</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', maxWidth: 200 }}>
                  {new Date(...customDate.split('-').map((v,i) => i===1 ? v-1 : +v))
                    .toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
              </div>
              <div style={{ padding: '16px 22px', borderRight: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Transactions</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#4f46e5' }}>{customDaySales.length}</div>
              </div>
              <div style={{ padding: '16px 22px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Total Revenue</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#16a34a' }}>
                  UGX {customDaySales.reduce((s, sale) => s + parseFloat(sale.total_amount || 0), 0).toLocaleString()}
                </div>
              </div>
            </div>
            {customDaySales.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: 38, marginBottom: 10 }}>🗓️</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>No sales recorded on this day</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Try selecting a different date</div>
              </div>
            ) : (
              <DataTable columns={columns} data={customDaySales} loading={false} emptyStateProps={{ title: 'No sales', description: '' }} />
            )}
          </div>
        )}
      </div>

      {/* ── Custom Week Lookup ── */}
      <div style={{ ...styles.contentCard, marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📅</div>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>Sales by Specific Week</h3>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>Pick any date — shows all sales for that full week (Mon – Sun)</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Any date in the week</label>
            <input
              type="date"
              value={customWeekDate}
              onChange={e => { setCustomWeekDate(e.target.value); setCustomWeekSales(null); setCustomWeekRange(null); }}
              style={{ padding: '9px 13px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 14, fontFamily: 'inherit', outline: 'none', background: '#fff', color: '#0f172a', cursor: 'pointer', minWidth: 180 }}
            />
          </div>
          <button
            onClick={() => {
              if (!customWeekDate) return;
              const [y, m, d] = customWeekDate.split('-').map(Number);
              const picked = new Date(y, m - 1, d);
              const dow = picked.getDay();
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
            style={{ padding: '9px 22px', borderRadius: 9, border: 'none', background: customWeekDate ? '#4f46e5' : '#e2e8f0', color: customWeekDate ? '#fff' : '#94a3b8', fontSize: 13, fontWeight: 700, cursor: customWeekDate ? 'pointer' : 'not-allowed', transition: 'background 0.15s' }}
          >
            View Week
          </button>
          {customWeekSales !== null && (
            <button onClick={() => { setCustomWeekSales(null); setCustomWeekDate(''); setCustomWeekRange(null); }}
              style={{ padding: '9px 16px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Clear
            </button>
          )}
        </div>

        {customWeekSales !== null && customWeekRange !== null && (() => {
          const { monday, sunday } = customWeekRange;
          const fmt = d => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
          const weekTotal = customWeekSales.reduce((s, sale) => s + parseFloat(sale.total_amount || 0), 0);
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
          const maxDayTotal = Math.max(...dayBreakdown.map(d => d.total), 1);

          return (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: 0, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
                <div style={{ padding: '16px 22px', background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Week</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{fmt(monday)}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>to {fmt(sunday)}</div>
                </div>
                <div style={{ padding: '16px 22px', borderRight: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Transactions</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#1d4ed8' }}>{customWeekSales.length}</div>
                </div>
                <div style={{ padding: '16px 22px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Total Revenue</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#16a34a' }}>UGX {weekTotal.toLocaleString()}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 20 }}>
                {dayBreakdown.map(({ day, name, count, total }) => {
                  const now = new Date();
                  const isToday = day.getTime() === new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                  const barPct = Math.round((total / maxDayTotal) * 100);
                  return (
                    <div key={name} style={{ background: isToday ? '#eff6ff' : '#fff', border: `1.5px solid ${isToday ? '#3b82f6' : '#e2e8f0'}`, borderRadius: 12, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: isToday ? '#3b82f6' : '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{name}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{day.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                      <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${barPct}%`, background: count > 0 ? '#3b82f6' : '#e2e8f0', borderRadius: 2, transition: 'width 0.4s ease' }} />
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: count > 0 ? '#1d4ed8' : '#d1d5db', lineHeight: 1 }}>{count}</div>
                      <div style={{ fontSize: 10, fontWeight: 500, color: count > 0 ? '#64748b' : '#d1d5db' }}>{count > 0 ? `UGX ${total.toLocaleString()}` : '—'}</div>
                    </div>
                  );
                })}
              </div>

              {customWeekSales.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{ fontSize: 38, marginBottom: 10 }}>📅</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>No sales recorded in this week</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Try picking a date from a different week</div>
                </div>
              ) : (
                <DataTable columns={columns} data={customWeekSales} loading={false} emptyStateProps={{ title: 'No sales', description: '' }} />
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
                  {tax > 0      && rRow('Tax:',      `+ UGX ${tax.toLocaleString()}`,      false, '#16a34a')}
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
function PurchasesTab({ purchases, loading, token, user, suppliers, products, toast, onPurchaseAdded }) {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  // Each line can be 'existing' (select from products) or 'new' (fill in details)
  const EMPTY_LINE = {
    mode: 'existing',          // 'existing' | 'new'
    product_id: '',            // used when mode === 'existing'
    // new product fields
    np_name: '', np_sku: '', np_unit: '', np_price: '', np_reorder: '',
    // shared
    quantity: '', cost_price: '',
  };

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

  const setLine = (i, key, val) =>
    setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [key]: val } : l));

  const toggleMode = (i) =>
    setLines(prev => prev.map((l, idx) =>
      idx === i ? { ...EMPTY_LINE, mode: l.mode === 'existing' ? 'new' : 'existing' } : l
    ));

  const addLine    = () => setLines(prev => [...prev, { ...EMPTY_LINE }]);
  const removeLine = (i) => setLines(prev => prev.filter((_, idx) => idx !== i));

  const lineTotal = (l) => (parseFloat(l.quantity) || 0) * (parseFloat(l.cost_price) || 0);
  const grandTotal = lines.reduce((s, l) => s + lineTotal(l), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supplierId) { setFormError('Please select a supplier.'); return; }

    // Validate lines
    const validLines = lines.filter(l => {
      if (l.mode === 'existing') return l.product_id && l.quantity && l.cost_price;
      return l.np_name && l.np_price && l.quantity && l.cost_price;
    });
    if (validLines.length === 0) {
      setFormError('Add at least one complete product line.');
      return;
    }

    const items = validLines.map(l => {
      if (l.mode === 'existing') {
        return {
          product_id: l.product_id,
          quantity:   parseInt(l.quantity),
          cost_price: parseFloat(l.cost_price),
        };
      }
      // new product — omit product_id, include new_product object
      return {
        quantity:   parseInt(l.quantity),
        cost_price: parseFloat(l.cost_price),
        new_product: {
          name:          l.np_name,
          sku:           l.np_sku   || undefined,
          unit:          l.np_unit  || undefined,
          price:         parseFloat(l.np_price),
          reorder_level: l.np_reorder ? parseFloat(l.np_reorder) : undefined,
        },
      };
    });

    setSaving(true);
    setFormError(null);
    try {
      const res  = await fetch(`${API_URL}/purchases`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ supplier_id: supplierId, items }),
      });
      const json = await res.json();
      if (!res.ok) { setFormError(json?.message || 'Something went wrong.'); return; }
      onPurchaseAdded(json.data, json.new_products || []);
      toast.success('Purchase recorded', `UGX ${parseFloat(json.data.total_amount || 0).toLocaleString()} purchase recorded.`);
      setShowModal(false);
    } catch { setFormError('Could not reach the server.'); }
    finally { setSaving(false); }
  };

  const filtered = purchases.filter(p =>
    p.supplier?.name?.toLowerCase().includes(search.toLowerCase()) ||
    new Date(p.purchase_date).toLocaleDateString().includes(search)
  );

  const inp = { ...supS.input };

  return (
    <div style={styles.pageContainer}>
      {/* Header banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 24px rgba(15,23,42,0.14)',
      }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Procurement</p>
          <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.3px' }}>Purchases</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>{purchases.length} purchase{purchases.length !== 1 ? 's' : ''} recorded</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {purchases.length > 0 && (
            <input
              style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#f1f5f9', fontSize: 13, outline: 'none', width: 220 }}
              placeholder="Search by supplier or date…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          )}
          <button
            onClick={openModal}
            style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
            onMouseEnter={e => e.currentTarget.style.background = '#4338ca'}
            onMouseLeave={e => e.currentTarget.style.background = '#4f46e5'}
          >
            + Record Purchase
          </button>
        </div>
      </div>

      {/* Purchases table */}
      <div style={styles.contentCard}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading purchases…</div>
        ) : filtered.length === 0 ? (
          <EmptyState
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
                    <td style={{ padding: '14px', color: '#475569', fontSize: 14 }}>{new Date(p.purchase_date).toLocaleDateString()}</td>
                    <td style={{ padding: '14px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                        {p.supplier?.name || 'N/A'}
                      </span>
                    </td>
                    <td style={{ padding: '14px', color: '#475569', fontSize: 14 }}>
                      {p.purchase_items?.length || 0} item{(p.purchase_items?.length || 0) !== 1 ? 's' : ''}
                    </td>
                    <td style={{ padding: '14px', fontWeight: 700, color: '#0f172a', fontSize: 14 }}>
                      UGX {parseFloat(p.total_amount || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '14px' }}>
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
                      <td colSpan={5} style={{ padding: '0 14px 16px', background: '#fafbff' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={supS.label}>Products *</label>
              <button type="button" onClick={addLine} style={{ fontSize: 13, color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                + Add Line
              </button>
            </div>

            {lines.map((line, i) => (
              <div key={i} style={{ border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '14px', background: line.mode === 'new' ? '#fafbff' : '#fff' }}>

                {/* Mode toggle + remove */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['existing', 'new'].map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => toggleMode(i)}
                        style={{
                          padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                          border: '1.5px solid',
                          borderColor: line.mode === m ? '#4f46e5' : '#e2e8f0',
                          background:  line.mode === m ? '#4f46e5' : '#fff',
                          color:       line.mode === m ? '#fff'    : '#94a3b8',
                          cursor: 'pointer',
                        }}
                      >
                        {m === 'existing' ? '📦 Existing Product' : '✨ New Product'}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLine(i)}
                    disabled={lines.length === 1}
                    style={{ padding: '5px 9px', borderRadius: 6, border: '1px solid #fecaca', background: '#fef2f2', color: '#ef4444', cursor: lines.length === 1 ? 'not-allowed' : 'pointer', opacity: lines.length === 1 ? 0.4 : 1, fontSize: 13 }}
                  >
                    ✕ Remove
                  </button>
                </div>

                {/* Existing product row */}
                {line.mode === 'existing' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Product *</span>
                      <select style={inp} value={line.product_id} onChange={e => setLine(i, 'product_id', e.target.value)}>
                        <option value="">— Select product —</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
                      </select>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Qty *</span>
                      <input style={inp} type="number" min="1" placeholder="0" value={line.quantity}
                        onChange={e => setLine(i, 'quantity', e.target.value)} />
                    </div>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Cost Price (UGX) *</span>
                      <input style={inp} type="number" min="0" step="0.01" placeholder="0.00" value={line.cost_price}
                        onChange={e => setLine(i, 'cost_price', e.target.value)} />
                    </div>
                  </div>
                )}

                {/* New product rows */}
                {line.mode === 'new' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Product Name *</span>
                        <input style={inp} placeholder="e.g. Brown Sugar 1kg" value={line.np_name}
                          onChange={e => setLine(i, 'np_name', e.target.value)} />
                      </div>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>SKU</span>
                        <input style={inp} placeholder="e.g. SGR-001" value={line.np_sku}
                          onChange={e => setLine(i, 'np_sku', e.target.value)} />
                      </div>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Unit</span>
                        <input style={inp} placeholder="e.g. kg, pcs, box" value={line.np_unit}
                          onChange={e => setLine(i, 'np_unit', e.target.value)} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Selling Price (UGX) *</span>
                        <input style={inp} type="number" min="0" step="0.01" placeholder="0.00" value={line.np_price}
                          onChange={e => setLine(i, 'np_price', e.target.value)} />
                      </div>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Reorder Level</span>
                        <input style={inp} type="number" min="0" placeholder="0" value={line.np_reorder}
                          onChange={e => setLine(i, 'np_reorder', e.target.value)} />
                      </div>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Qty Purchased *</span>
                        <input style={inp} type="number" min="1" placeholder="0" value={line.quantity}
                          onChange={e => setLine(i, 'quantity', e.target.value)} />
                      </div>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Cost Price (UGX) *</span>
                        <input style={inp} type="number" min="0" step="0.01" placeholder="0.00" value={line.cost_price}
                          onChange={e => setLine(i, 'cost_price', e.target.value)} />
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: '#6366f1', background: '#eef2ff', borderRadius: 6, padding: '6px 10px' }}>
                      ✨ This product will be created in your inventory with the quantity above as its initial stock.
                    </div>
                  </div>
                )}

                {/* Line subtotal */}
                {lineTotal(line) > 0 && (
                  <div style={{ marginTop: 8, textAlign: 'right', fontSize: 13, color: '#64748b' }}>
                    Subtotal: <strong style={{ color: '#0f172a' }}>UGX {lineTotal(line).toLocaleString()}</strong>
                  </div>
                )}
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

// Stock Tab Component
function StockTab({ products, stockMovements, token, onAdjusted }) {
  const [form, setForm]               = useState({ product_id: '', type: 'IN', quantity: '', reason: '', date: '' });
  const [submitting, setSubmitting]   = useState(false);
  const [formError, setFormError]     = useState(null);
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
      setFormSuccess(`Stock updated for "${data.data?.product?.name}".`);
      setForm({ product_id: '', type: 'IN', quantity: '', reason: '', date: '' });
      onAdjusted();
    } catch { setFormError('Network error. Check your connection.'); }
    finally { setSubmitting(false); }
  };

  const typeConfig = {
    IN:         { label: 'Stock In',    color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
    OUT:        { label: 'Stock Out',   color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
    ADJUSTMENT: { label: 'Adjustment', color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  };

  const filtered = stockMovements.filter(m => {
    const matchType   = typeFilter === 'ALL' || m.type === typeFilter;
    const matchSearch = !search || (m.product?.name || '').toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const totalIn  = stockMovements.filter(m => m.type === 'IN').reduce((s, m) => s + Number(m.quantity), 0);
  const totalOut = stockMovements.filter(m => m.type === 'OUT').reduce((s, m) => s + Number(m.quantity), 0);
  const lowStock = products.filter(p => Number(p.stock) <= Number(p.reorder_level || 0));

  // Safe date formatter — avoids UTC shift by parsing YYYY-MM-DD as local
  const fmtDate = (raw) => {
    if (!raw) return '—';
    const s = String(raw).slice(0, 10);
    const [y, m, d] = s.split('-').map(Number);
    if (!y || !m || !d) return '—';
    return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const inputStyle = {
    width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0',
    borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none',
    background: '#fff', boxSizing: 'border-box',
  };
  const labelStyle = { fontSize: 13, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 5 };

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
          { label: 'Total Products',  value: products.length, icon: '📦', iconBg: '#fff7ed', numColor: '#ea580c' },
          { label: 'Total Stock In',  value: totalIn,          icon: '⬆',  iconBg: '#eff6ff', numColor: '#2563eb' },
          { label: 'Total Stock Out', value: totalOut,         icon: '⬇',  iconBg: '#eff6ff', numColor: '#2563eb' },
        ].map(c => (
          <div key={c.label} style={{
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14,
            padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 10, background: c.iconBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
            }}>{c.icon}</div>
            <div>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 2 }}>{c.label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: c.numColor, lineHeight: 1 }}>{c.value.toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20, alignItems: 'start' }}>

        {/* ── Left: Adjust Stock form ── */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
            🗒️ Adjust Stock
          </h3>

          {formError   && <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 }}>⚠️ {formError}</div>}
          {formSuccess && <div style={{ padding: '8px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, color: '#15803d', fontSize: 13 }}>✅ {formSuccess}</div>}

          {/* Product */}
          <div>
            <label style={labelStyle}>Product *</label>
            <select style={inputStyle} value={form.product_id} onChange={e => setForm(p => ({ ...p, product_id: e.target.value }))}>
              <option value="">— Select product —</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
            </select>
          </div>

          {/* Adjustment Type */}
          <div>
            <label style={labelStyle}>Adjustment Type *</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { val: 'IN',         label: '⬆ Stock In'  },
                { val: 'OUT',        label: '⬇ Stock Out' },
                { val: 'ADJUSTMENT', label: '⚙ Set Level' },
              ].map(t => (
                <button key={t.val} onClick={() => setForm(p => ({ ...p, type: t.val }))} style={{
                  flex: 1, padding: '8px 6px', borderRadius: 8, border: '1.5px solid',
                  borderColor: form.type === t.val ? '#16a34a' : '#e2e8f0',
                  background:  form.type === t.val ? '#f0fdf4' : '#fff',
                  color:       form.type === t.val ? '#16a34a' : '#64748b',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                }}>{t.label}</button>
              ))}
            </div>
            <div style={{ marginTop: 5, fontSize: 12, color: '#94a3b8' }}>
              {form.type === 'IN'         && 'Adds quantity to current stock.'}
              {form.type === 'OUT'        && 'Removes quantity from current stock.'}
              {form.type === 'ADJUSTMENT' && 'Sets stock to an exact absolute value.'}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label style={labelStyle}>{form.type === 'ADJUSTMENT' ? 'New Stock Level *' : 'Quantity *'}</label>
            <input style={inputStyle} type="number" min="1"
              placeholder={form.type === 'ADJUSTMENT' ? 'Enter new total stock' : 'Enter quantity'}
              value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} />
          </div>

          {/* Reason */}
          <div>
            <label style={labelStyle}>Reason (Optional)</label>
            <input style={inputStyle} type="text"
              placeholder="e.g. Damaged goods, Stock count correction…"
              value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} />
          </div>

          {/* Date */}
          <div>
            <label style={labelStyle}>Date <span style={{ color: '#94a3b8', fontWeight: 400 }}>(defaults to today)</span></label>
            <input style={inputStyle} type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
          </div>

          <Button variant="success" style={{ width: '100%', justifyContent: 'center' }} loading={submitting} onClick={handleSubmit}>
            Apply Adjustment
          </Button>

          {/* Low stock alert */}
          {lowStock.length > 0 && (
            <div style={{ padding: '10px 12px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 6 }}>
                ⚠️ {lowStock.length} product{lowStock.length > 1 ? 's' : ''} low on stock
              </div>
              {lowStock.slice(0, 4).map(p => (
                <div key={p.id} style={{ fontSize: 12, color: '#92400e', padding: '2px 0', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{p.name}</span><span style={{ fontWeight: 700 }}>{p.stock} left</span>
                </div>
              ))}
              {lowStock.length > 4 && <div style={{ fontSize: 11, color: '#92400e', marginTop: 2 }}>+{lowStock.length - 4} more…</div>}
            </div>
          )}
        </div>

        {/* ── Right: Movement History ── */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px' }}>

          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
              📋 Movement History
            </h3>
            <div style={{ display: 'flex', gap: 6 }}>
              {['ALL', 'IN', 'OUT', 'ADJUSTMENT'].map(t => (
                <button key={t} onClick={() => setTypeFilter(t)} style={{
                  padding: '5px 14px', borderRadius: 8, border: '1.5px solid',
                  borderColor: typeFilter === t ? '#4f46e5' : '#e2e8f0',
                  background:  typeFilter === t ? '#4f46e5' : '#fff',
                  color:       typeFilter === t ? '#fff'    : '#64748b',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}>{t}</button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 15 }}>🔍</span>
            <input
              style={{ ...inputStyle, paddingLeft: 36 }}
              placeholder="Search by product name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📦</div>
              <div style={{ fontSize: 14 }}>No movements found</div>
            </div>
          ) : (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['PRODUCT', 'TYPE', 'QTY', 'REASON', 'DATE'].map(h => (
                      <th key={h} style={{
                        padding: '10px 14px', textAlign: 'left', fontSize: 11,
                        fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em',
                        borderBottom: '1px solid #e2e8f0',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m, i) => {
                    const tc = typeConfig[m.type] || typeConfig['IN'];
                    const qty = Number(m.quantity);
                    const qtyColor = m.type === 'IN' ? '#16a34a' : m.type === 'OUT' ? '#dc2626' : '#b45309';
                    const qtyPrefix = m.type === 'IN' ? '+' : m.type === 'OUT' ? '−' : '=';
                    return (
                      <tr key={m.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f1f5f9' : 'none', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{m.product?.name || `#${m.product_id}`}</div>
                          {m.product?.sku && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{m.product.sku}</div>}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            background: tc.bg, color: tc.color, border: `1px solid ${tc.border}`,
                            borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
                          }}>{tc.label}</span>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, fontSize: 15, color: qtyColor }}>
                          {qtyPrefix}{qty}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 13, color: m.reason ? '#475569' : '#cbd5e1' }}>
                          {m.reason || '—'}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 13, color: '#64748b', whiteSpace: 'nowrap' }}>
                          {fmtDate(m.date)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Reports Tab Component
function ReportsTab({ data, loading, token }) {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };

  const [activeReport, setActiveReport] = useState('overview');
  const [dailyDate, setDailyDate]       = useState(new Date().toISOString().split('T')[0]);
  const [weeklyDate, setWeeklyDate]     = useState(new Date().toISOString().split('T')[0]);
  const [monthlyMonth, setMonthlyMonth] = useState(new Date().toISOString().slice(0, 7));
  const [yearlyYear, setYearlyYear]     = useState(new Date().getFullYear().toString());
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

  // ── Fetch reports ──────────────────────────────────────────────────────────
  const fetchReport = async () => {
    setReportLoading(true);
    setReportError(null);
    setReportData(null);
    try {
      let url;
      if (activeReport === 'daily')   url = `${API_URL}/sales/daily-report?date=${dailyDate}`;
      else if (activeReport === 'weekly') url = `${API_URL}/sales/weekly-report?date=${weeklyDate}`;
      else if (activeReport === 'monthly-sales') url = `${API_URL}/sales/monthly-report?month=${monthlyMonth}`;
      else if (activeReport === 'yearly') url = `${API_URL}/sales/yearly-report?year=${yearlyYear}`;
      else url = `${API_URL}/purchases/monthly-report?month=${monthlyMonth}`;

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
    { id: 'overview',       label: 'Overview'         },
    { id: 'daily',          label: 'Daily Sales'       },
    { id: 'weekly',         label: 'Weekly Sales'      },
    { id: 'monthly-sales',  label: 'Monthly Sales'     },
    { id: 'yearly',         label: 'Yearly Report'     },
  ];

  return (
    <div style={styles.pageContainer}>
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 28,
        boxShadow: '0 4px 24px rgba(15,23,42,0.14)',
      }}>
        <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Business Intelligence</p>
        <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.3px' }}>Reports & Analytics</h1>
        <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>Analyse your business performance and trends</p>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                {[
                  { label: 'Date',         value: reportData.date },
                  { label: 'Transactions', value: reportData.total_transactions },
                  { label: 'Total Sales',  value: `UGX ${parseFloat(reportData.total_sales || 0).toLocaleString()}` },
                  { label: 'Total Cost',   value: `UGX ${parseFloat(reportData.total_cost || 0).toLocaleString()}` },
                ].map(k => (
                  <div key={k.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px' }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{k.label}</p>
                    <p style={{ margin: '8px 0 0', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{k.value}</p>
                  </div>
                ))}
              </div>
              {/* Profit highlight */}
              <div style={{ background: parseFloat(reportData.total_profit || 0) >= 0 ? '#f0fdf4' : '#fef2f2', border: `1px solid ${parseFloat(reportData.total_profit || 0) >= 0 ? '#bbf7d0' : '#fecaca'}`, borderRadius: 12, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: 32 }}>{parseFloat(reportData.total_profit || 0) >= 0 ? '📈' : '📉'}</div>
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Net Profit</p>
                  <p style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 800, color: parseFloat(reportData.total_profit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                    UGX {parseFloat(reportData.total_profit || 0).toLocaleString()}
                  </p>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Margin</p>
                  <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 700, color: '#374151' }}>
                    {parseFloat(reportData.total_sales) > 0
                      ? `${((parseFloat(reportData.total_profit) / parseFloat(reportData.total_sales)) * 100).toFixed(1)}%`
                      : '—'}
                  </p>
                </div>
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
                        {['Time', 'Cashier', 'Payment', 'Items', 'Amount', 'Cost', 'Profit'].map(h => (
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
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#475569' }}>{(s.sale_items || s.saleItems || []).length}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>UGX {parseFloat(s.total_amount || 0).toLocaleString()}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#64748b' }}>UGX {parseFloat(s.cost || 0).toLocaleString()}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: parseFloat(s.profit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>UGX {parseFloat(s.profit || 0).toLocaleString()}</td>
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

      {/* ── WEEKLY SALES REPORT ── */}
      {activeReport === 'weekly' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={supS.label}>Any date within the week</label>
              <input style={{ ...supS.input, width: 200 }} type="date" value={weeklyDate} onChange={e => setWeeklyDate(e.target.value)} />
            </div>
            <Button variant="primary" onClick={fetchReport} loading={reportLoading}>Generate Report</Button>
          </div>

          {reportError && <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 }}>⚠️ {reportError}</div>}

          {reportData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* KPI cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                {[
                  { label: 'Week Start',    value: reportData.week_start },
                  { label: 'Week End',      value: reportData.week_end },
                  { label: 'Transactions',  value: reportData.total_transactions },
                  { label: 'Total Sales',   value: `UGX ${parseFloat(reportData.total_sales || 0).toLocaleString()}` },
                ].map(k => (
                  <div key={k.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px' }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{k.label}</p>
                    <p style={{ margin: '8px 0 0', fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{k.value}</p>
                  </div>
                ))}
              </div>

              {/* Profit highlight */}
              <div style={{ background: parseFloat(reportData.total_profit || 0) >= 0 ? '#f0fdf4' : '#fef2f2', border: `1px solid ${parseFloat(reportData.total_profit || 0) >= 0 ? '#bbf7d0' : '#fecaca'}`, borderRadius: 12, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: 32 }}>{parseFloat(reportData.total_profit || 0) >= 0 ? '📈' : '📉'}</div>
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Net Profit</p>
                  <p style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 800, color: parseFloat(reportData.total_profit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                    UGX {parseFloat(reportData.total_profit || 0).toLocaleString()}
                  </p>
                </div>
                <div style={{ marginLeft: 16 }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Total Cost</p>
                  <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 700, color: '#374151' }}>UGX {parseFloat(reportData.total_cost || 0).toLocaleString()}</p>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Margin</p>
                  <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 700, color: '#374151' }}>
                    {parseFloat(reportData.total_sales) > 0
                      ? `${((parseFloat(reportData.total_profit) / parseFloat(reportData.total_sales)) * 100).toFixed(1)}%`
                      : '—'}
                  </p>
                </div>
              </div>

              {/* Daily breakdown bar chart */}
              {reportData.by_day && reportData.by_day.length > 0 && (
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 22 }}>
                  <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Daily Breakdown</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {(() => {
                      const maxTotal = Math.max(...reportData.by_day.map(d => parseFloat(d.total || 0)), 1);
                      return reportData.by_day.map(d => (
                        <div key={d.date}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{d.day} <span style={{ color: '#94a3b8', fontWeight: 400 }}>({d.date})</span></span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                              UGX {parseFloat(d.total || 0).toLocaleString()} &nbsp;
                              <span style={{ color: '#94a3b8', fontWeight: 400 }}>{d.transactions} txn{d.transactions !== 1 ? 's' : ''}</span>
                              &nbsp;·&nbsp;
                              <span style={{ color: parseFloat(d.profit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                                profit: UGX {parseFloat(d.profit || 0).toLocaleString()}
                              </span>
                            </span>
                          </div>
                          <div style={{ height: 10, background: '#f1f5f9', borderRadius: 5, overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              width: `${(parseFloat(d.total || 0) / maxTotal) * 100}%`,
                              background: d.transactions > 0 ? '#4f46e5' : '#e2e8f0',
                              borderRadius: 5,
                              transition: 'width 0.4s ease',
                            }} />
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* Transactions table */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Sales Transactions</h3>
                </div>
                {reportData.sales?.length === 0 ? (
                  <p style={{ padding: 20, color: '#94a3b8', fontSize: 14 }}>No sales this week.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['Date', 'Cashier', 'Customer', 'Payment', 'Items', 'Amount', 'Cost', 'Profit'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.sales?.map(s => (
                        <tr key={s.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#475569' }}>{new Date(s.sale_date).toLocaleDateString()}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#0f172a' }}>{s.user?.name || '—'}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#475569' }}>{s.customer?.name || 'Walk-in'}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: getPayColor(s.payment_method) + '18', color: getPayColor(s.payment_method), border: `1px solid ${getPayColor(s.payment_method)}40`, textTransform: 'capitalize' }}>
                              {s.payment_method?.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#475569' }}>{(s.sale_items || s.saleItems || []).length}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>UGX {parseFloat(s.total_amount || 0).toLocaleString()}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#64748b' }}>UGX {parseFloat(s.cost || 0).toLocaleString()}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: parseFloat(s.profit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>UGX {parseFloat(s.profit || 0).toLocaleString()}</td>
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

      {/* ── MONTHLY SALES REPORT ── */}
      {activeReport === 'monthly-sales' && (
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
              {/* KPI cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {[
                  { label: 'Month',        value: reportData.month },
                  { label: 'Transactions', value: reportData.total_transactions },
                  { label: 'Total Sales',  value: `UGX ${parseFloat(reportData.total_sales || 0).toLocaleString()}` },
                ].map(k => (
                  <div key={k.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px' }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{k.label}</p>
                    <p style={{ margin: '8px 0 0', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{k.value}</p>
                  </div>
                ))}
              </div>

              {/* Profit highlight */}
              <div style={{ background: parseFloat(reportData.total_profit || 0) >= 0 ? '#f0fdf4' : '#fef2f2', border: `1px solid ${parseFloat(reportData.total_profit || 0) >= 0 ? '#bbf7d0' : '#fecaca'}`, borderRadius: 12, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: 32 }}>{parseFloat(reportData.total_profit || 0) >= 0 ? '📈' : '📉'}</div>
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Net Profit</p>
                  <p style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 800, color: parseFloat(reportData.total_profit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                    UGX {parseFloat(reportData.total_profit || 0).toLocaleString()}
                  </p>
                </div>
                <div style={{ marginLeft: 16 }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Total Cost</p>
                  <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 700, color: '#374151' }}>UGX {parseFloat(reportData.total_cost || 0).toLocaleString()}</p>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Margin</p>
                  <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 700, color: '#374151' }}>
                    {parseFloat(reportData.total_sales) > 0
                      ? `${((parseFloat(reportData.total_profit) / parseFloat(reportData.total_sales)) * 100).toFixed(1)}%`
                      : '—'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Payment method breakdown */}
                {reportData.by_payment && reportData.by_payment.length > 0 && (
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 22 }}>
                    <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Sales by Payment Method</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {(() => {
                        const methodTotal = reportData.by_payment.reduce((sum, p) => sum + parseFloat(p.total || 0), 0) || 1;
                        return reportData.by_payment.map(p => (
                          <div key={p.method}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', textTransform: 'capitalize' }}>{(p.method || '').replace(/_/g, ' ')}</span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                                UGX {parseFloat(p.total || 0).toLocaleString()} &nbsp;
                                <span style={{ color: '#94a3b8', fontWeight: 400 }}>({Math.round((parseFloat(p.total || 0) / methodTotal) * 100)}%)</span>
                                &nbsp;·&nbsp;
                                <span style={{ color: parseFloat(p.profit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                                  profit: UGX {parseFloat(p.profit || 0).toLocaleString()}
                                </span>
                              </span>
                            </div>
                            <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${(parseFloat(p.total || 0) / methodTotal) * 100}%`, background: getPayColor(p.method), borderRadius: 4, transition: 'width 0.4s ease' }} />
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}

                {/* Daily breakdown within the month */}
                {reportData.by_day && reportData.by_day.length > 0 && (
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 22, maxHeight: 340, overflowY: 'auto' }}>
                    <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Daily Breakdown</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {(() => {
                        const maxDayTotal = Math.max(...reportData.by_day.map(d => parseFloat(d.total || 0)), 1);
                        return reportData.by_day.map(d => (
                          <div key={d.date}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{new Date(d.date + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
                                UGX {parseFloat(d.total || 0).toLocaleString()} <span style={{ color: '#94a3b8', fontWeight: 400 }}>({d.transactions})</span>
                                &nbsp;·&nbsp;
                                <span style={{ color: parseFloat(d.profit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                                  UGX {parseFloat(d.profit || 0).toLocaleString()}
                                </span>
                              </span>
                            </div>
                            <div style={{ height: 7, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${(parseFloat(d.total || 0) / maxDayTotal) * 100}%`, background: '#16a34a', borderRadius: 4 }} />
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {/* Transactions table */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Sales Transactions</h3>
                </div>
                {reportData.sales?.length === 0 ? (
                  <p style={{ padding: 20, color: '#94a3b8', fontSize: 14 }}>No sales this month.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['Date', 'Cashier', 'Customer', 'Payment', 'Items', 'Amount', 'Cost', 'Profit'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.sales?.map(s => (
                        <tr key={s.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#475569' }}>{new Date(s.sale_date).toLocaleDateString()}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#0f172a' }}>{s.user?.name || '—'}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#475569' }}>{s.customer?.name || 'Walk-in'}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: getPayColor(s.payment_method) + '18', color: getPayColor(s.payment_method), border: `1px solid ${getPayColor(s.payment_method)}40`, textTransform: 'capitalize' }}>
                              {s.payment_method?.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#475569' }}>{(s.sale_items || s.saleItems || []).length}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>UGX {parseFloat(s.total_amount || 0).toLocaleString()}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#64748b' }}>UGX {parseFloat(s.cost || 0).toLocaleString()}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: parseFloat(s.profit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>UGX {parseFloat(s.profit || 0).toLocaleString()}</td>
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

      {/* ── YEARLY REPORT ── */}
      {activeReport === 'yearly' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={supS.label}>Select Year</label>
              <select
                value={yearlyYear}
                onChange={e => { setYearlyYear(e.target.value); setReportData(null); }}
                style={{ ...supS.input, width: 140 }}
              >
                {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <Button variant="primary" onClick={fetchReport} loading={reportLoading}>Generate Report</Button>
          </div>

          {reportError && <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 }}>⚠️ {reportError}</div>}

          {reportData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* ── KPI row ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                {[
                  { label: 'Year',          value: reportData.year,                                                                          icon: '📅', color: '#4f46e5', bg: '#eef2ff' },
                  { label: 'Transactions',  value: reportData.total_transactions,                                                            icon: '🧾', color: '#0891b2', bg: '#ecfeff' },
                  { label: 'Total Revenue', value: `UGX ${parseFloat(reportData.total_sales || 0).toLocaleString()}`,                        icon: '💰', color: '#16a34a', bg: '#f0fdf4' },
                  { label: 'Total Cost',    value: `UGX ${parseFloat(reportData.total_cost  || 0).toLocaleString()}`,                        icon: '🛒', color: '#d97706', bg: '#fffbeb' },
                ].map(k => (
                  <div key={k.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{k.icon}</div>
                    <div>
                      <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.label}</p>
                      <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{k.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Profit highlight ── */}
              <div style={{ background: parseFloat(reportData.total_profit || 0) >= 0 ? '#f0fdf4' : '#fef2f2', border: `1px solid ${parseFloat(reportData.total_profit || 0) >= 0 ? '#bbf7d0' : '#fecaca'}`, borderRadius: 12, padding: '20px 26px', display: 'flex', alignItems: 'center', gap: 18 }}>
                <div style={{ fontSize: 36 }}>{parseFloat(reportData.total_profit || 0) >= 0 ? '📈' : '📉'}</div>
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Annual Net Profit</p>
                  <p style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 800, color: parseFloat(reportData.total_profit || 0) >= 0 ? '#16a34a' : '#dc2626', letterSpacing: '-0.5px' }}>
                    UGX {parseFloat(reportData.total_profit || 0).toLocaleString()}
                  </p>
                </div>
                <div style={{ marginLeft: 20 }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Profit Margin</p>
                  <p style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 700, color: '#374151' }}>
                    {parseFloat(reportData.total_sales) > 0 ? `${((parseFloat(reportData.total_profit) / parseFloat(reportData.total_sales)) * 100).toFixed(1)}%` : '—'}
                  </p>
                </div>
                {reportData.best_month && (
                  <div style={{ marginLeft: 20 }}>
                    <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Best Month</p>
                    <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 700, color: '#16a34a' }}>
                      {reportData.best_month.month_name} — UGX {parseFloat(reportData.best_month.total || 0).toLocaleString()}
                    </p>
                  </div>
                )}
                {reportData.worst_month && (
                  <div style={{ marginLeft: 20 }}>
                    <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Lowest Month</p>
                    <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 700, color: '#64748b' }}>
                      {reportData.worst_month.month_name} — UGX {parseFloat(reportData.worst_month.total || 0).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* ── Monthly bar chart ── */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24 }}>
                <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Monthly Revenue & Profit</h3>
                {(() => {
                  const maxTotal = Math.max(...(reportData.by_month || []).map(m => parseFloat(m.total || 0)), 1);
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {(reportData.by_month || []).map(m => {
                        const revPct    = Math.round((parseFloat(m.total  || 0) / maxTotal) * 100);
                        const profitPct = Math.round((parseFloat(m.profit || 0) / maxTotal) * 100);
                        const isProfit  = parseFloat(m.profit || 0) >= 0;
                        return (
                          <div key={m.month}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#334155', minWidth: 36 }}>{m.month_name}</span>
                              <span style={{ fontSize: 12, color: '#64748b' }}>
                                UGX {parseFloat(m.total || 0).toLocaleString()}
                                &nbsp;·&nbsp;
                                <span style={{ color: isProfit ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                                  {isProfit ? '+' : ''}UGX {parseFloat(m.profit || 0).toLocaleString()}
                                </span>
                                &nbsp;·&nbsp;
                                <span style={{ color: '#94a3b8' }}>{m.transactions} txns</span>
                              </span>
                            </div>
                            {/* Revenue bar */}
                            <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden', marginBottom: 3 }}>
                              <div style={{ height: '100%', width: `${revPct}%`, background: m.transactions > 0 ? '#4f46e5' : '#e2e8f0', borderRadius: 4, transition: 'width 0.4s ease' }} />
                            </div>
                            {/* Profit bar */}
                            <div style={{ height: 5, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${Math.abs(profitPct)}%`, background: isProfit ? '#16a34a' : '#dc2626', borderRadius: 3, transition: 'width 0.4s ease' }} />
                            </div>
                          </div>
                        );
                      })}
                      <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#64748b' }}><span style={{ width: 12, height: 8, background: '#4f46e5', borderRadius: 2, display: 'inline-block' }}></span>Revenue</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#64748b' }}><span style={{ width: 12, height: 5, background: '#16a34a', borderRadius: 2, display: 'inline-block' }}></span>Profit</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* ── Quarter breakdown ── */}
              {reportData.by_quarter && (
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24 }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Quarterly Breakdown</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                    {reportData.by_quarter.map(q => {
                      const maxQ = Math.max(...reportData.by_quarter.map(x => parseFloat(x.total || 0)), 1);
                      const pct  = Math.round((parseFloat(q.total || 0) / maxQ) * 100);
                      return (
                        <div key={q.quarter} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '16px 14px' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{q.quarter}</div>
                          <div style={{ height: 5, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden', marginBottom: 12 }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: '#4f46e5', borderRadius: 3, transition: 'width 0.4s ease' }} />
                          </div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>UGX {parseFloat(q.total || 0).toLocaleString()}</div>
                          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{q.transactions} transactions</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: parseFloat(q.profit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                            Profit: UGX {parseFloat(q.profit || 0).toLocaleString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Payment method breakdown ── */}
              {reportData.by_payment && reportData.by_payment.length > 0 && (
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24 }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Sales by Payment Method</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {(() => {
                      const total = reportData.by_payment.reduce((s, p) => s + parseFloat(p.total || 0), 0) || 1;
                      return reportData.by_payment.map(p => (
                        <div key={p.method}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', textTransform: 'capitalize' }}>{(p.method || '').replace(/_/g, ' ')}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                              UGX {parseFloat(p.total || 0).toLocaleString()}
                              &nbsp;<span style={{ color: '#94a3b8', fontWeight: 400 }}>({Math.round((parseFloat(p.total || 0) / total) * 100)}%)</span>
                              &nbsp;·&nbsp;
                              <span style={{ color: parseFloat(p.profit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>profit: UGX {parseFloat(p.profit || 0).toLocaleString()}</span>
                            </span>
                          </div>
                          <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${(parseFloat(p.total || 0) / total) * 100}%`, background: getPayColor(p.method), borderRadius: 4, transition: 'width 0.4s ease' }} />
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── AI Assistant Tab ──────────────────────────────────────────────────────────
function AiTab({ token, data }) {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' };

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hi! I'm your AI business analyst. I have access to your sales, purchases, inventory, and revenue data.\n\nAsk me anything — or pick a quick question below to get started.",
    },
  ]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [cooldown, setCooldown] = useState(0); // seconds remaining
  const bottomRef               = useRef(null);
  const cooldownRef             = useRef(null);

  const QUICK_PROMPTS = [
    { label: 'Sales performance', icon: '📊', text: 'How did my sales perform this month compared to last month?' },
    { label: 'Top products',      icon: '🏆', text: 'Which are my top 5 best-performing products by revenue?' },
    { label: 'Forecast',          icon: '🔮', text: 'Based on my sales trend over the last 6 months, forecast my revenue for next month.' },
    { label: 'Low stock alert',   icon: '⚠️',  text: 'Which products are running low on stock and what should I reorder first?' },
    { label: 'Profit analysis',   icon: '💰', text: 'What is my estimated gross profit this month and how can I improve it?' },
    { label: 'Busiest days',      icon: '📅', text: 'What are my busiest sales days and peak revenue periods?' },
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const startCooldown = (seconds) => {
    setCooldown(seconds);
    clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const send = async (questionText) => {
    const q = (questionText ?? input).trim();
    if (!q || loading || cooldown > 0) return;
    setInput('');
    setError(null);
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/ai/chat`, { method: 'POST', headers, body: JSON.stringify({ question: q }) });
      const json = await res.json();
      if (!res.ok || !json.success) {
        const msg = res.status === 429
          ? '⏳ The AI service is rate-limited right now. Please wait 30 seconds and try again.'
          : json.message || 'The AI service returned an error.';
        setError(msg);
        setMessages(prev => [...prev, { role: 'assistant', text: msg }]);
        if (res.status === 429) startCooldown(30);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: json.answer }]);
      }
    } catch {
      setError('Could not reach the server.');
      setMessages(prev => [...prev, { role: 'assistant', text: '⚠️ Could not reach the server. Please check your connection.' }]);
    } finally {
      setLoading(false);
    }
  };

  // Simple markdown-ish renderer: bold, bullets, line breaks
  const renderText = (text) => {
    return text.split('\n').map((line, i) => {
      // Bold: **text**
      const parts = line.split(/\*\*(.*?)\*\*/g).map((part, j) =>
        j % 2 === 1 ? <strong key={j}>{part}</strong> : part
      );
      const isBullet = line.startsWith('- ') || line.startsWith('• ');
      if (isBullet) {
        return <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 3 }}><span style={{ color: '#4f46e5', flexShrink: 0 }}>•</span><span>{parts}</span></div>;
      }
      return <div key={i} style={{ marginBottom: line ? 4 : 8 }}>{parts}</div>;
    });
  };

  return (
    <div style={styles.pageContainer}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', borderRadius: 16, padding: '28px 32px', marginBottom: 24, boxShadow: '0 4px 24px rgba(15,23,42,0.14)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0, boxShadow: '0 4px 16px rgba(79,70,229,0.4)' }}>🤖</div>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Powered by Mistral AI</p>
            <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.3px' }}>AI Business Assistant</h1>
            <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>Analyse your financial data, spot trends, and forecast business performance</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>

        {/* ── Chat panel ── */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, minHeight: 420, maxHeight: 560 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                {/* Avatar */}
                <div style={{
                  width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                  background: msg.role === 'user' ? '#4f46e5' : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, color: '#fff', fontWeight: 700,
                }}>
                  {msg.role === 'user' ? '👤' : '🤖'}
                </div>
                {/* Bubble */}
                <div style={{
                  maxWidth: '78%', padding: '12px 16px', borderRadius: msg.role === 'user' ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                  background: msg.role === 'user' ? '#4f46e5' : '#f8fafc',
                  border: msg.role === 'user' ? 'none' : '1px solid #e2e8f0',
                  color: msg.role === 'user' ? '#fff' : '#0f172a',
                  fontSize: 14, lineHeight: '1.6',
                }}>
                  {renderText(msg.text)}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>🤖</div>
                <div style={{ padding: '12px 18px', borderRadius: '4px 14px 14px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', gap: 5, alignItems: 'center' }}>
                  {[0, 1, 2].map(d => (
                    <div key={d} style={{ width: 7, height: 7, borderRadius: '50%', background: '#94a3b8', animation: `aiPulse 1.2s ease-in-out ${d * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div style={{ padding: '14px 20px', borderTop: '1px solid #f1f5f9', background: '#fafbff' }}>
            {cooldown > 0 && (
              <div style={{ marginBottom: 10, padding: '8px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: 13, color: '#92400e', display: 'flex', alignItems: 'center', gap: 8 }}>
                ⏳ Rate limited — ready again in <strong>{cooldown}s</strong>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Ask anything about your business… (Enter to send, Shift+Enter for new line)"
                rows={2}
                style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', resize: 'none', outline: 'none', background: '#fff', color: '#0f172a', lineHeight: '1.5' }}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading || cooldown > 0}
                style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: input.trim() && !loading && !cooldown ? '#4f46e5' : '#e2e8f0', color: input.trim() && !loading && !cooldown ? '#fff' : '#94a3b8', cursor: input.trim() && !loading && !cooldown ? 'pointer' : 'not-allowed', fontSize: 18, transition: 'all 0.15s', flexShrink: 0, lineHeight: 1 }}
              >
                {cooldown > 0 ? `${cooldown}s` : '➤'}
              </button>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: 11, color: '#94a3b8' }}>Your live business data is sent as context. No data is stored by the AI.</p>
          </div>
        </div>

        {/* ── Right panel: quick prompts + data snapshot ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Quick prompts */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Quick Questions</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {QUICK_PROMPTS.map(p => (
                <button key={p.label} onClick={() => send(p.text)} disabled={loading || cooldown > 0}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#f8fafc', cursor: loading || cooldown > 0 ? 'not-allowed' : 'pointer', textAlign: 'left', opacity: loading || cooldown > 0 ? 0.5 : 1, transition: 'all 0.15s' }}
                  onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = '#a5b4fc'; e.currentTarget.style.background = '#eef2ff'; } }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
                >
                  <span style={{ fontSize: 16 }}>{p.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Live data snapshot */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Data in Context</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { icon: '💰', label: 'Total Sales',     value: `UGX ${data.stats.totalSales.toLocaleString()}` },
                { icon: '🛒', label: 'Total Purchases', value: `UGX ${data.stats.totalPurchases.toLocaleString()}` },
                { icon: '📦', label: 'Products',        value: data.stats.totalProducts },
                { icon: '🧾', label: 'Transactions',    value: data.sales.length },
                { icon: '⚠️',  label: 'Low Stock',       value: data.stats.lowStockCount },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #f8fafc' }}>
                  <span style={{ fontSize: 13, color: '#475569' }}>{s.icon} {s.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Clear chat */}
          <button onClick={() => setMessages([{ role: 'assistant', text: "Chat cleared. What would you like to know?" }])}
            style={{ padding: '9px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            🗑 Clear Chat
          </button>
        </div>
      </div>
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
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 24px rgba(15,23,42,0.14)',
      }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Administration</p>
          <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.3px' }}>User Management</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>Manage team members and their access roles</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {users.length > 0 && (
            <input style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#f1f5f9', fontSize: 13, outline: 'none', width: 220 }}
              placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} />
          )}
          <button onClick={openAdd} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
            onMouseEnter={e => e.currentTarget.style.background = '#4338ca'}
            onMouseLeave={e => e.currentTarget.style.background = '#4f46e5'}>
            + Add User
          </button>
        </div>
      </div>
      {/* Users table */}

      <div style={styles.contentCard}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading users…</div>
        ) : filtered.length === 0 ? (
          <EmptyState
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
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 28,
        boxShadow: '0 4px 24px rgba(15,23,42,0.14)',
      }}>
        <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Inventory</p>
        <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.3px' }}>Stock Movements</h1>
        <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>Full audit trail of all inventory changes</p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Movements', value: movements.length, color: '#4f46e5', borderColor: '#4f46e5' },
          { label: 'Stock In',        value: totalIn,           color: '#16a34a', borderColor: '#16a34a' },
          { label: 'Stock Out',       value: totalOut,          color: '#dc2626', borderColor: '#dc2626' },
        ].map(k => (
          <div key={k.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderTop: `3px solid ${k.borderColor}`, borderRadius: 12, padding: '18px 22px' }}>
            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.label}</p>
            <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: k.color, letterSpacing: '-0.5px' }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <input style={{ ...fS.input, maxWidth: 240 }} placeholder="Search by product…"
          value={search} onChange={e => setSearch(e.target.value)} />
        <select style={fS.select} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          <option value="IN">Stock In</option>
          <option value="OUT">Stock Out</option>
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
    backgroundColor: '#0f172a',
    padding: `${theme.spacing.lg} ${theme.spacing['2xl']}`,
    borderBottom: '1px solid #1e293b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: 'none',
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
    fontSize: '22px',
    display: 'none'
  },

  logo: {
    margin: 0,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#ffffff',
    letterSpacing: '-0.5px',
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
    fontSize: '14px',
    color: '#94a3b8'
  },

  searchInput: {
    width: '100%',
    padding: `${theme.spacing.sm} ${theme.spacing.md} ${theme.spacing.sm} ${theme.spacing['2xl']}`,
    border: '1px solid #334155',
    borderRadius: theme.borderRadius.lg,
    fontSize: theme.typography.fontSize.sm,
    backgroundColor: '#1e293b',
    color: '#f1f5f9',
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
    color: '#f1f5f9'
  },

  userRole: {
    fontSize: theme.typography.fontSize.xs,
    color: '#94a3b8',
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
    width: '260px',
    backgroundColor: '#0f172a',
    borderRight: '1px solid #1e293b',
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
    padding: '13px 14px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: '#94a3b8',
    textAlign: 'left',
    borderRadius: theme.borderRadius.lg,
    transition: theme.transitions.default,
    position: 'relative',
    width: '100%'
  },

  menuItemActive: {
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    fontWeight: theme.typography.fontWeight.semibold
  },

  menuIcon: {
    fontSize: '16px',
    width: '20px',
    textAlign: 'center',
    opacity: 0.8
  },

  menuLabel: {
    flex: 1,
    fontSize: '14px'
  },

  activeIndicator: {
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    width: '3px',
    height: '18px',
    backgroundColor: theme.colors.primary[500],
    borderRadius: theme.borderRadius.sm
  },

  // Main Content
  main: {
    flex: 1,
    padding: '32px 36px',
    overflow: 'auto',
    backgroundColor: '#f8fafc'
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
    margin: '0 auto',
    paddingBottom: 32
  },

  pageHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
    paddingBottom: 20,
    borderBottom: '1px solid #f1f5f9'
  },

  pageTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: '#0f172a',
    margin: '0 0 4px 0',
    letterSpacing: '-0.3px'
  },

  pageSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    margin: 0
  },

  // Content Cards
  contentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 20
  },

  // Category Card
  categoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: '20px 22px',
    border: '1px solid #e2e8f0',
    transition: 'all 0.15s',
    cursor: 'pointer',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
  },

  categoryIcon: {
    fontSize: '32px',
    marginBottom: 12,
    display: 'block'
  },

  categoryTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#0f172a',
    margin: '0 0 6px 0'
  },

  categoryDescription: {
    fontSize: 13,
    color: '#64748b',
    margin: '0 0 14px 0',
    lineHeight: '1.5'
  },

  categoryFooter: {
    borderTop: '1px solid #f1f5f9',
    paddingTop: 12
  },

  categoryDate: {
    fontSize: 12,
    color: '#94a3b8'
  },

  // Supplier Card
  supplierCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: '20px 22px',
    border: '1px solid #e2e8f0',
    transition: 'all 0.15s',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
  },

  supplierHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14
  },

  supplierIcon: {
    fontSize: '24px'
  },

  supplierName: {
    fontSize: 15,
    fontWeight: 700,
    color: '#0f172a',
    margin: 0
  },

  supplierDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  },

  supplierDetail: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    color: '#475569'
  },

  supplierDetailIcon: {
    fontSize: '14px',
    width: '18px',
    opacity: 0.6
  },

  // Reports Grid
  reportsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: 20
  },

  reportCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: '20px 22px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
  },

  reportTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#0f172a',
    margin: '0 0 16px 0',
    letterSpacing: '-0.2px'
  },

  reportMetrics: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },

  reportMetric: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    border: '1px solid #f1f5f9'
  },

  reportLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: 500
  },

  reportValue: {
    fontSize: 15,
    fontWeight: 700,
    color: '#0f172a'
  },

  // Skeleton Loading
  skeletonCard: {
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    height: '180px',
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

  @keyframes aiPulse {
    0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
    40% { transform: scale(1); opacity: 1; }
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