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
    { id: 'stock', label: 'Stock Management', icon: '📋', color: 'warning' },
    { id: 'users', label: 'User Management', icon: '👥', color: 'primary' },
    { id: 'settings', label: 'Settings', icon: '⚙️', color: 'neutral' },
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
              className="search-input"
              style={styles.searchInput}
              type="text"
              placeholder="Search products, sales, suppliers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div style={styles.headerRight}>
          <div className="notification-icon" style={styles.notificationIcon}>🔔</div>
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
                className={`menu-item ${activeTab === item.id ? 'active' : ''}`}
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
          {activeTab === 'products' && <ProductsTab products={data.products} onAddProduct={() => setShowAddProduct(true)} loading={loading} />}
          {activeTab === 'categories' && <CategoriesTab categories={data.categories} loading={loading} />}
          {activeTab === 'suppliers' && <SuppliersTab suppliers={data.suppliers} loading={loading} />}
          {activeTab === 'sales' && <SalesTab sales={data.sales} loading={loading} />}
          {activeTab === 'purchases' && <PurchasesTab purchases={data.purchases} loading={loading} />}
          {activeTab === 'stock' && <StockManagementTab data={data} loading={loading} />}
          {activeTab === 'users' && <UserManagementTab user={user} token={token} loading={loading} />}
          {activeTab === 'settings' && <SettingsTab user={user} token={token} loading={loading} />}
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
          value={`$${data.stats.totalSales.toFixed(2)}`}
          subtitle="Revenue generated"
          icon="💰"
          color="success"
          trend="up"
          trendValue="+8.2% from last month"
          loading={loading}
        />
        <DashboardCard
          title="Total Purchases"
          value={`$${data.stats.totalPurchases.toFixed(2)}`}
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
function ProductsTab({ products, onAddProduct, loading }) {
  const columns = [
    { key: 'name', title: 'Product Name' },
    { 
      key: 'category', 
      title: 'Category', 
      render: (value) => value?.name ? <Badge variant="neutral" size="sm">{value.name}</Badge> : 'N/A'
    },
    { 
      key: 'stock', 
      title: 'Stock', 
      type: 'number',
      render: (value, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: value <= row.reorder_level ? theme.colors.danger[600] : 'inherit' }}>
            {value}
          </span>
          {value <= row.reorder_level && <Badge variant="danger" size="sm">Low</Badge>}
        </div>
      )
    },
    { key: 'price', title: 'Price', type: 'currency' },
    { 
      key: 'supplier', 
      title: 'Supplier', 
      render: (value) => value?.name || 'N/A'
    }
  ];

  return (
    <div style={styles.pageContainer}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Products</h1>
          <p style={styles.pageSubtitle}>Manage your inventory and track stock levels</p>
        </div>
        <Button variant="success" onClick={onAddProduct} icon="+" iconPosition="left">
          Add Product
        </Button>
      </div>

      <div style={styles.contentCard}>
        <DataTable
          columns={columns}
          data={products}
          loading={loading}
          emptyStateProps={{
            icon: '📦',
            title: 'No products yet',
            description: 'Start building your inventory by adding your first product.',
            actionLabel: 'Add First Product',
            onAction: onAddProduct
          }}
        />
      </div>
    </div>
  );
}

// Categories Tab Component
function CategoriesTab({ categories, loading }) {
  return (
    <div style={styles.pageContainer}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Categories</h1>
          <p style={styles.pageSubtitle}>Organize your products into logical groups</p>
        </div>
        <Button variant="primary" icon="+" iconPosition="left">
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
            onAction={() => console.log('Add Category')}
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
    </div>
  );
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
              <span style={styles.reportValue}>${data.stats.totalSales.toFixed(2)}</span>
            </div>
            <div style={styles.reportMetric}>
              <span style={styles.reportLabel}>Total Purchases</span>
              <span style={styles.reportValue}>${data.stats.totalPurchases.toFixed(2)}</span>
            </div>
            <div style={styles.reportMetric}>
              <span style={styles.reportLabel}>Net Revenue</span>
              <span style={{
                ...styles.reportValue,
                color: totalRevenue >= 0 ? theme.colors.success[600] : theme.colors.danger[600]
              }}>
                ${totalRevenue.toFixed(2)}
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

// Stock Management Tab Component
function StockManagementTab({ data, loading }) {
  const [stockMovements, setStockMovements] = useState([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  const stockColumns = [
    { key: 'name', title: 'Product Name' },
    { 
      key: 'stock', 
      title: 'Current Stock', 
      render: (value, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ 
            color: value <= row.reorder_level ? theme.colors.danger[600] : 
                   value <= row.reorder_level * 2 ? theme.colors.warning[600] : 
                   theme.colors.success[600],
            fontWeight: 'bold'
          }}>
            {value}
          </span>
          {value <= row.reorder_level && <Badge variant="danger" size="sm">Critical</Badge>}
          {value > row.reorder_level && value <= row.reorder_level * 2 && <Badge variant="warning" size="sm">Low</Badge>}
        </div>
      )
    },
    { key: 'reorder_level', title: 'Reorder Level', type: 'number' },
    { 
      key: 'category', 
      title: 'Category', 
      render: (value) => value?.name ? <Badge variant="neutral" size="sm">{value.name}</Badge> : 'N/A'
    },
    { key: 'price', title: 'Unit Price', type: 'currency' }
  ];

  return (
    <div style={styles.pageContainer}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Stock Management</h1>
          <p style={styles.pageSubtitle}>Monitor inventory levels and stock movements</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="warning" icon="📊" iconPosition="left">
            Stock Report
          </Button>
          <Button variant="primary" icon="📦" iconPosition="left">
            Adjust Stock
          </Button>
        </div>
      </div>

      {/* Stock Level Summary Cards */}
      <div style={styles.kpiGrid}>
        <DashboardCard
          title="Critical Stock"
          value={data.products.filter(p => p.stock <= p.reorder_level).length}
          subtitle="Items need immediate reorder"
          icon="🚨"
          color="danger"
          trend="up"
          trendValue="Requires attention"
          loading={loading}
        />
        <DashboardCard
          title="Low Stock"
          value={data.products.filter(p => p.stock > p.reorder_level && p.stock <= p.reorder_level * 2).length}
          subtitle="Items running low"
          icon="⚠️"
          color="warning"
          trend="neutral"
          trendValue="Monitor closely"
          loading={loading}
        />
        <DashboardCard
          title="Healthy Stock"
          value={data.products.filter(p => p.stock > p.reorder_level * 2).length}
          subtitle="Items with good levels"
          icon="✅"
          color="success"
          trend="up"
          trendValue="All good"
          loading={loading}
        />
        <DashboardCard
          title="Total Value"
          value={`$${data.products.reduce((sum, p) => sum + (p.stock * p.price), 0).toFixed(2)}`}
          subtitle="Current inventory value"
          icon="💰"
          color="primary"
          trend="up"
          trendValue="Asset value"
          loading={loading}
        />
      </div>

      {/* Stock Levels Table */}
      <div style={styles.contentCard}>
        <h3 style={styles.cardTitle}>Current Stock Levels</h3>
        <DataTable
          columns={stockColumns}
          data={data.products}
          loading={loading}
          emptyStateProps={{
            icon: '📦',
            title: 'No products in inventory',
            description: 'Add products to start tracking stock levels.',
            actionLabel: 'Add First Product',
            onAction: () => console.log('Add Product')
          }}
        />
      </div>
    </div>
  );
}

// User Management Tab Component
function UserManagementTab({ user, token, loading }) {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const userColumns = [
    { key: 'name', title: 'Name' },
    { key: 'email', title: 'Email' },
    { 
      key: 'roles', 
      title: 'Role', 
      render: (value) => value && value.length > 0 ? 
        <Badge variant="primary" size="sm">{value[0].name}</Badge> : 
        <Badge variant="neutral" size="sm">No Role</Badge>
    },
    { 
      key: 'created_at', 
      title: 'Joined', 
      type: 'date',
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (value, row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="secondary" size="sm">Edit</Button>
          {row.id !== user.id && <Button variant="danger" size="sm">Remove</Button>}
        </div>
      )
    }
  ];

  return (
    <div style={styles.pageContainer}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>User Management</h1>
          <p style={styles.pageSubtitle}>Manage team members and their permissions</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="secondary" icon="🔑" iconPosition="left">
            Manage Roles
          </Button>
          <Button variant="primary" icon="+" iconPosition="left">
            Add User
          </Button>
        </div>
      </div>

      {/* User Stats */}
      <div style={styles.kpiGrid}>
        <DashboardCard
          title="Total Users"
          value={users.length || 1}
          subtitle="Active team members"
          icon="👥"
          color="primary"
          trend="up"
          trendValue="Growing team"
          loading={loadingUsers}
        />
        <DashboardCard
          title="Roles Defined"
          value={roles.length || 3}
          subtitle="Permission levels"
          icon="🔑"
          color="warning"
          trend="neutral"
          trendValue="Well organized"
          loading={loadingUsers}
        />
        <DashboardCard
          title="Active Sessions"
          value="1"
          subtitle="Currently online"
          icon="🟢"
          color="success"
          trend="up"
          trendValue="Users active"
          loading={loadingUsers}
        />
        <DashboardCard
          title="Last Login"
          value="Now"
          subtitle="Most recent activity"
          icon="⏰"
          color="neutral"
          trend="neutral"
          trendValue="Real-time"
          loading={loadingUsers}
        />
      </div>

      {/* Users Table */}
      <div style={styles.contentCard}>
        <h3 style={styles.cardTitle}>Team Members</h3>
        <DataTable
          columns={userColumns}
          data={users.length > 0 ? users : [user]}
          loading={loadingUsers}
          emptyStateProps={{
            icon: '👥',
            title: 'No team members yet',
            description: 'Invite team members to collaborate on your inventory.',
            actionLabel: 'Invite First Member',
            onAction: () => console.log('Add User')
          }}
        />
      </div>
    </div>
  );
}

// Settings Tab Component
function SettingsTab({ user, token, loading }) {
  const [settings, setSettings] = useState({
    businessName: user.tenant?.name || '',
    email: user.email || '',
    phone: '',
    address: '',
    currency: 'USD',
    timezone: 'UTC',
    lowStockAlert: true,
    emailNotifications: true,
    autoBackup: false
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Settings</h1>
          <p style={styles.pageSubtitle}>Configure your business preferences and system settings</p>
        </div>
        <Button variant="primary" icon="💾" iconPosition="left">
          Save Changes
        </Button>
      </div>

      <div style={styles.settingsGrid}>
        {/* Business Information */}
        <div style={styles.settingsCard}>
          <h3 style={styles.settingsCardTitle}>Business Information</h3>
          <div style={styles.settingsForm}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Business Name</label>
              <input
                className="form-input"
                style={styles.formInput}
                type="text"
                value={settings.businessName}
                onChange={(e) => handleSettingChange('businessName', e.target.value)}
                placeholder="Enter business name"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Email Address</label>
              <input
                style={styles.formInput}
                type="email"
                value={settings.email}
                onChange={(e) => handleSettingChange('email', e.target.value)}
                placeholder="Enter email address"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Phone Number</label>
              <input
                style={styles.formInput}
                type="tel"
                value={settings.phone}
                onChange={(e) => handleSettingChange('phone', e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Business Address</label>
              <textarea
                style={{ ...styles.formInput, minHeight: '80px', resize: 'vertical' }}
                value={settings.address}
                onChange={(e) => handleSettingChange('address', e.target.value)}
                placeholder="Enter business address"
              />
            </div>
          </div>
        </div>

        {/* System Preferences */}
        <div style={styles.settingsCard}>
          <h3 style={styles.settingsCardTitle}>System Preferences</h3>
          <div style={styles.settingsForm}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Currency</label>
              <select
                style={styles.formInput}
                value={settings.currency}
                onChange={(e) => handleSettingChange('currency', e.target.value)}
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="CAD">CAD - Canadian Dollar</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Timezone</label>
              <select
                style={styles.formInput}
                value={settings.timezone}
                onChange={(e) => handleSettingChange('timezone', e.target.value)}
              >
                <option value="UTC">UTC - Coordinated Universal Time</option>
                <option value="EST">EST - Eastern Standard Time</option>
                <option value="PST">PST - Pacific Standard Time</option>
                <option value="GMT">GMT - Greenwich Mean Time</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div style={styles.settingsCard}>
          <h3 style={styles.settingsCardTitle}>Notifications</h3>
          <div style={styles.settingsForm}>
            <div style={styles.toggleGroup}>
              <div style={styles.toggleItem}>
                <div>
                  <span style={styles.toggleLabel}>Low Stock Alerts</span>
                  <span style={styles.toggleDescription}>Get notified when products are running low</span>
                </div>
                <label style={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={settings.lowStockAlert}
                    onChange={(e) => handleSettingChange('lowStockAlert', e.target.checked)}
                  />
                  <span className="toggle-slider" style={styles.toggleSlider}></span>
                </label>
              </div>
              <div style={styles.toggleItem}>
                <div>
                  <span style={styles.toggleLabel}>Email Notifications</span>
                  <span style={styles.toggleDescription}>Receive important updates via email</span>
                </div>
                <label style={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                  />
                  <span className="toggle-slider" style={styles.toggleSlider}></span>
                </label>
              </div>
              <div style={styles.toggleItem}>
                <div>
                  <span style={styles.toggleLabel}>Auto Backup</span>
                  <span style={styles.toggleDescription}>Automatically backup your data daily</span>
                </div>
                <label style={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={settings.autoBackup}
                    onChange={(e) => handleSettingChange('autoBackup', e.target.checked)}
                  />
                  <span className="toggle-slider" style={styles.toggleSlider}></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Security */}
        <div style={styles.settingsCard}>
          <h3 style={styles.settingsCardTitle}>Security</h3>
          <div style={styles.settingsForm}>
            <div style={styles.securityActions}>
              <div style={styles.securityAction}>
                <div>
                  <span style={styles.securityActionTitle}>Change Password</span>
                  <span style={styles.securityActionDescription}>Update your account password</span>
                </div>
                <Button variant="secondary" size="sm">Change</Button>
              </div>
              <div style={styles.securityAction}>
                <div>
                  <span style={styles.securityActionTitle}>Two-Factor Authentication</span>
                  <span style={styles.securityActionDescription}>Add an extra layer of security</span>
                </div>
                <Button variant="primary" size="sm">Enable</Button>
              </div>
              <div style={styles.securityAction}>
                <div>
                  <span style={styles.securityActionTitle}>Active Sessions</span>
                  <span style={styles.securityActionDescription}>Manage your active login sessions</span>
                </div>
                <Button variant="neutral" size="sm">View</Button>
              </div>
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
    backgroundColor: theme.colors.neutral[800],
    padding: `${theme.spacing.lg} ${theme.spacing['2xl']}`,
    borderBottom: `1px solid ${theme.colors.neutral[700]}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
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
    color: '#ffffff'
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
    color: theme.colors.neutral[300]
  },

  searchInput: {
    width: '100%',
    padding: `${theme.spacing.sm} ${theme.spacing.md} ${theme.spacing.sm} ${theme.spacing['2xl']}`,
    border: `1px solid ${theme.colors.neutral[600]}`,
    borderRadius: theme.borderRadius.lg,
    fontSize: theme.typography.fontSize.sm,
    backgroundColor: theme.colors.neutral[700],
    color: '#ffffff',
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
    transition: theme.transitions.default,
    color: theme.colors.neutral[300]
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
    color: '#ffffff'
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
    backgroundColor: theme.colors.neutral[800],
    borderRight: `1px solid ${theme.colors.neutral[700]}`,
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
    color: theme.colors.neutral[300],
    textAlign: 'left',
    borderRadius: theme.borderRadius.lg,
    transition: theme.transitions.default,
    position: 'relative',
    width: '100%'
  },

  menuItemActive: {
    backgroundColor: theme.colors.primary[600],
    color: '#ffffff',
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
  },

  // Settings Styles
  settingsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: theme.spacing.xl
  },

  settingsCard: {
    backgroundColor: '#ffffff',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    boxShadow: theme.shadows.md,
    border: `1px solid ${theme.colors.neutral[200]}`
  },

  settingsCardTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.neutral[900],
    margin: `0 0 ${theme.spacing.lg} 0`
  },

  settingsForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.lg
  },

  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.sm
  },

  formLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.neutral[700]
  },

  formInput: {
    padding: theme.spacing.md,
    border: `1px solid ${theme.colors.neutral[300]}`,
    borderRadius: theme.borderRadius.lg,
    fontSize: theme.typography.fontSize.sm,
    backgroundColor: '#ffffff',
    transition: theme.transitions.default,
    outline: 'none'
  },

  toggleGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.lg
  },

  toggleItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.neutral[50],
    borderRadius: theme.borderRadius.lg,
    border: `1px solid ${theme.colors.neutral[200]}`
  },

  toggleLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.neutral[900],
    display: 'block'
  },

  toggleDescription: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.neutral[500],
    display: 'block',
    marginTop: theme.spacing.xs
  },

  toggle: {
    position: 'relative',
    display: 'inline-block',
    width: '44px',
    height: '24px'
  },

  toggleSlider: {
    position: 'absolute',
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.neutral[300],
    transition: theme.transitions.default,
    borderRadius: '24px'
  },

  securityActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.lg
  },

  securityAction: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.neutral[50],
    borderRadius: theme.borderRadius.lg,
    border: `1px solid ${theme.colors.neutral[200]}`
  },

  securityActionTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.neutral[900],
    display: 'block'
  },

  securityActionDescription: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.neutral[500],
    display: 'block',
    marginTop: theme.spacing.xs
  }
};

// Add CSS animation for spinner
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  /* Toggle Switch Styles */
  input[type="checkbox"] {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  input:checked + .toggle-slider {
    background-color: #4f46e5 !important;
  }
  
  input:checked + .toggle-slider:before {
    transform: translateX(20px);
  }
  
  .toggle-slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
  }
  
  /* Hover effects for menu items */
  .menu-item:hover {
    background-color: rgba(255, 255, 255, 0.1) !important;
    color: #ffffff !important;
  }
  
  .menu-item.active:hover {
    background-color: #4338ca !important;
  }
  
  /* Form input focus styles */
  .form-input:focus {
    border-color: #4f46e5 !important;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1) !important;
  }
  
  /* Search input placeholder */
  .search-input::placeholder {
    color: #9ca3af;
  }
  
  /* Notification icon hover */
  .notification-icon:hover {
    background-color: rgba(255, 255, 255, 0.1) !important;
    color: #ffffff !important;
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