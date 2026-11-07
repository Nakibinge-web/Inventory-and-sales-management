import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Button from '../components/ui/Button';
import {
  RevenueProfitBarChart,
  RevenueProfitLineChart,
  CostAccuracyBadge,
  formatUGX,
} from '../components/ui/AnalyticsCharts';
import styles, { supS } from '../styles/dashboardStyles';

function ReportExportBar({ title, onExportPdf, onExportWord, isPdfLoading, isWordLoading, extraActions }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: 12,
      padding: '12px 20px',
      marginBottom: 20,
      flexWrap: 'wrap',
      gap: 12,
      boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: '#eef2ff',
          color: '#4f46e5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18
        }}>
          📊
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{title || 'Export Report'}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Download this report in professional PDF or Microsoft Word (.docx) format</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        {extraActions}
        <button
          type="button"
          onClick={onExportPdf}
          disabled={isPdfLoading}
          style={{
            padding: '8px 16px',
            background: isPdfLoading ? '#94a3b8' : '#dc2626',
            color: '#ffffff',
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: isPdfLoading ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            transition: 'background 0.15s ease',
            boxShadow: '0 1px 2px rgba(220,38,38,0.2)'
          }}
          onMouseEnter={e => { if (!isPdfLoading) e.currentTarget.style.background = '#b91c1c'; }}
          onMouseLeave={e => { if (!isPdfLoading) e.currentTarget.style.background = '#dc2626'; }}
        >
          {isPdfLoading ? '⏳ Generating PDF...' : '📄 Export as PDF'}
        </button>
        <button
          type="button"
          onClick={onExportWord}
          disabled={isWordLoading}
          style={{
            padding: '8px 16px',
            background: isWordLoading ? '#94a3b8' : '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: isWordLoading ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            transition: 'background 0.15s ease',
            boxShadow: '0 1px 2px rgba(37,99,235,0.2)'
          }}
          onMouseEnter={e => { if (!isWordLoading) e.currentTarget.style.background = '#1d4ed8'; }}
          onMouseLeave={e => { if (!isWordLoading) e.currentTarget.style.background = '#2563eb'; }}
        >
          {isWordLoading ? '⏳ Generating Word...' : '📝 Export as Word'}
        </button>
      </div>
    </div>
  );
}

function ReportsTab({ data, loading, token, user }) {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };

  const [activeReport, setActiveReport] = useState('overview');
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0]);
  const [weeklyDate, setWeeklyDate] = useState(new Date().toISOString().split('T')[0]);
  const [monthlyMonth, setMonthlyMonth] = useState(new Date().toISOString().slice(0, 7));
  const [yearlyYear, setYearlyYear] = useState(new Date().getFullYear().toString());
  const [dailyPurchasesDate, setDailyPurchasesDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(null);

  // Expandable sale transaction receipts
  const [expandedSales, setExpandedSales] = useState({});
  const toggleExpandSale = (saleId) => {
    setExpandedSales(prev => ({ ...prev, [saleId]: !prev[saleId] }));
  };

  // Sub-view toggle in Daily / Weekly / Monthly reports: 'transactions' vs 'items'
  const [reportSubView, setReportSubView] = useState('transactions');

  // Dedicated Sold Items Details view states
  const [soldItemRange, setSoldItemRange] = useState('all'); // 'all', 'today', 'week', 'month', 'custom'
  const [soldItemCustomStart, setSoldItemCustomStart] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [soldItemCustomEnd, setSoldItemCustomEnd] = useState(new Date().toISOString().split('T')[0]);
  const [soldItemSearch, setSoldItemSearch] = useState('');
  const [soldItemCategory, setSoldItemCategory] = useState('all');
  const [soldItemSort, setSoldItemSort] = useState('revenue-desc');
  const [expandedSoldProducts, setExpandedSoldProducts] = useState({});
  const toggleExpandSoldProduct = (prodId) => {
    setExpandedSoldProducts(prev => ({ ...prev, [prodId]: !prev[prodId] }));
  };

  // Search filter inside period items view
  const [periodItemSearch, setPeriodItemSearch] = useState('');

  const [exportingKey, setExportingKey] = useState(null);
  const [savedReports, setSavedReports] = useState([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [savedError, setSavedError] = useState(null);

  // ── Revenue & Gross Profit Analytics State (Overview Tab) ─────────────────
  const formatLocalYMD = (d) => {
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${da}`;
  };

  const computePresetRange = useCallback((preset) => {
    const now = new Date();
    const todayStr = formatLocalYMD(now);
    if (preset === 'last_7_days') {
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      return { start: formatLocalYMD(start), end: todayStr };
    }
    if (preset === 'last_30_days') {
      const start = new Date(now);
      start.setDate(now.getDate() - 29);
      return { start: formatLocalYMD(start), end: todayStr };
    }
    if (preset === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: formatLocalYMD(start), end: todayStr };
    }
    if (preset === 'this_year') {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      return { start: formatLocalYMD(start), end: formatLocalYMD(end) };
    }
    return { start: todayStr, end: todayStr };
  }, []);

  const initialRange = useMemo(() => computePresetRange('last_30_days'), [computePresetRange]);
  const [analyticsPreset, setAnalyticsPreset] = useState('last_30_days');
  const [analyticsGroupBy, setAnalyticsGroupBy] = useState('daily');
  const [analyticsStartDate, setAnalyticsStartDate] = useState(initialRange.start);
  const [analyticsEndDate, setAnalyticsEndDate] = useState(initialRange.end);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);

  const handleSelectAnalyticsPreset = (preset) => {
    setAnalyticsPreset(preset);
    if (preset !== 'custom') {
      const { start, end } = computePresetRange(preset);
      setAnalyticsStartDate(start);
      setAnalyticsEndDate(end);
      if (preset === 'this_year') {
        setAnalyticsGroupBy('monthly');
      } else if (preset === 'last_7_days') {
        setAnalyticsGroupBy('daily');
      }
    }
  };

  const fetchRevenueProfitAnalytics = useCallback(async () => {
    if (!token) return;
    if (analyticsStartDate && analyticsEndDate && analyticsStartDate > analyticsEndDate) {
      setAnalyticsError('Start date cannot be after end date.');
      setAnalyticsData(null);
      setAnalyticsLoading(false);
      return;
    }
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    setAnalyticsData(null);
    try {
      const params = new URLSearchParams();
      params.set('group_by', analyticsGroupBy);
      if (analyticsStartDate) params.set('start_date', analyticsStartDate);
      if (analyticsEndDate) params.set('end_date', analyticsEndDate);
      if (analyticsPreset === 'this_year' && analyticsGroupBy === 'monthly') {
        params.set('year', String(new Date().getFullYear()));
      }

      const res = await fetch(`${API_URL}/reports/revenue-profit?${params.toString()}`, { headers });
      const json = await res.json();
      if (!res.ok || !json.success) {
        const msg =
          json?.message ||
          (json?.errors ? Object.values(json.errors).flat().join(' ') : 'Failed to load revenue & profit analytics.');
        setAnalyticsError(msg);
        setAnalyticsData(null);
        return;
      }
      setAnalyticsData(json.data);
    } catch {
      setAnalyticsError('Could not reach the server to load revenue & profit analytics.');
      setAnalyticsData(null);
    } finally {
      setAnalyticsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_URL, token, analyticsGroupBy, analyticsStartDate, analyticsEndDate, analyticsPreset]);

  useEffect(() => {
    if (activeReport === 'overview') {
      fetchRevenueProfitAnalytics();
    }
  }, [activeReport, fetchRevenueProfitAnalytics]);

  const formatReportTypeName = (type) => {
    if (!type) return 'Report';
    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  const fetchSavedReports = async () => {
    setSavedLoading(true);
    setSavedError(null);
    try {
      const res = await fetch(`${API_URL}/reports/generated`, { headers });
      const json = await res.json();
      if (!res.ok) {
        setSavedError(json?.message || 'Failed to load saved reports.');
        return;
      }
      setSavedReports(json.data || []);
    } catch {
      setSavedError('Could not reach the server to load saved reports.');
    } finally {
      setSavedLoading(false);
    }
  };

  useEffect(() => {
    if (activeReport === 'saved-reports') {
      fetchSavedReports();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeReport]);

  const handleExport = async (endpoint, payload, fallbackFileName, format = 'pdf') => {
    const key = `${endpoint}_${format}`;
    setExportingKey(key);
    try {
      const res = await fetch(`${API_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...payload, format }),
      });

      if (!res.ok) {
        let errMessage = 'Export failed.';
        try {
          const errData = await res.json();
          errMessage = errData.message || (errData.errors ? Object.values(errData.errors).flat().join(', ') : errMessage);
        } catch (_) {}
        alert(`Export failed: ${errMessage}`);
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get('content-disposition');
      let filename = `${fallbackFileName}.${format}`;
      if (disposition && disposition.includes('filename=')) {
        const matches = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (matches && matches[1]) {
          filename = matches[1].replace(/['"]/g, '').trim();
        }
      }

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Export error:', err);
      alert('Network error while exporting document. Please try again.');
    } finally {
      setExportingKey(null);
    }
  };

  const handleDownloadSaved = async (reportId, format, reportType) => {
    const key = `saved_${reportId}_${format}`;
    setExportingKey(key);
    try {
      const res = await fetch(`${API_URL}/reports/generated/${reportId}/export?format=${format}`, {
        headers,
      });
      if (!res.ok) {
        let errMessage = 'Download failed.';
        try {
          const errData = await res.json();
          errMessage = errData.message || errMessage;
        } catch (_) {}
        alert(`Download failed: ${errMessage}`);
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get('content-disposition');
      let filename = `${reportType}_#${reportId}.${format}`;
      if (disposition && disposition.includes('filename=')) {
        const matches = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (matches && matches[1]) {
          filename = matches[1].replace(/['"]/g, '').trim();
        }
      }

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download error:', err);
      alert('Network error while downloading report.');
    } finally {
      setExportingKey(null);
    }
  };

  const totalRevenue = data.stats.totalSales - data.stats.totalPurchases;

  // ── Helper: Aggregate sold items from any list of sales ────────────────────
  // Preserves recorded (snapshot), estimated (current product cost), and unavailable cost states.
  // Never silently treats missing product costs as zero.
  const aggregateSoldItems = (salesList) => {
    if (!salesList || !Array.isArray(salesList)) return [];
    const map = {};
    salesList.forEach(sale => {
      const items = sale.sale_items || sale.saleItems || [];
      const saleDate = sale.sale_date || sale.created_at;
      const customerName = sale.customer?.name || 'Walk-in';
      const cashierName = sale.user?.name || 'Staff';
      const saleId = sale.id;

      items.forEach(item => {
        const prod = item.product || {};
        const prodId = item.product_id || prod.id || `custom-${item.id || Math.random()}`;
        const name = prod.name || item.name || `Product #${prodId}`;
        const sku = prod.sku || '—';
        const categoryName = prod.category?.name || 'Uncategorized';
        const unit = prod.unit || 'pcs';
        const qty = parseFloat(item.quantity || 0);
        const unitPrice = parseFloat(item.price || 0);
        const subtotal = parseFloat(item.subtotal || (qty * unitPrice) || 0);

        let itemCostStatus = 'unavailable';
        let unitCost = null;
        if (item.cost_price !== null && item.cost_price !== undefined && item.cost_price !== '') {
          itemCostStatus = 'recorded';
          unitCost = parseFloat(item.cost_price);
        } else if (prod.cost_price !== null && prod.cost_price !== undefined && prod.cost_price !== '') {
          itemCostStatus = 'estimated';
          unitCost = parseFloat(prod.cost_price);
        }

        const itemCost = unitCost !== null ? qty * unitCost : null;
        const profit = itemCost !== null ? subtotal - itemCost : null;

        if (!map[prodId]) {
          map[prodId] = {
            id: prodId,
            name,
            sku,
            category: categoryName,
            unit,
            cost_price: unitCost,
            totalQty: 0,
            totalRevenue: 0,
            knownCost: 0,
            totalCost: 0,
            totalProfit: 0,
            recordedCount: 0,
            estimatedCount: 0,
            unavailableCount: 0,
            cost_status: 'recorded',
            salesCount: 0,
            salesHistory: []
          };
        }
        map[prodId].totalQty += qty;
        map[prodId].totalRevenue += subtotal;
        if (unitCost !== null) {
          map[prodId].knownCost += itemCost;
          map[prodId].cost_price = unitCost;
        }
        if (itemCostStatus === 'unavailable') {
          map[prodId].unavailableCount += 1;
        } else if (itemCostStatus === 'estimated') {
          map[prodId].estimatedCount += 1;
        } else {
          map[prodId].recordedCount += 1;
        }
        map[prodId].salesCount += 1;
        map[prodId].salesHistory.push({
          saleId,
          date: saleDate,
          customer: customerName,
          cashier: cashierName,
          quantity: qty,
          unitPrice,
          subtotal,
          unitCost,
          profit,
          cost_status: itemCostStatus
        });
      });
    });

    return Object.values(map).map(p => {
      const avgSellingPrice = p.totalQty > 0 ? (p.totalRevenue / p.totalQty) : 0;
      const costStatus = p.unavailableCount > 0
        ? 'unavailable'
        : p.estimatedCount > 0
        ? 'estimated'
        : 'recorded';
      const totalCost = costStatus === 'unavailable' ? null : p.knownCost;
      const totalProfit = costStatus === 'unavailable' ? null : (p.totalRevenue - p.knownCost);
      const marginPct = costStatus === 'unavailable'
        ? null
        : (p.totalRevenue > 0 ? ((totalProfit / p.totalRevenue) * 100) : 0);
      return {
        ...p,
        cost_status: costStatus,
        cost_price: costStatus === 'unavailable' ? null : p.cost_price,
        totalCost,
        totalProfit,
        avgSellingPrice,
        marginPct
      };
    });
  };

  // ── Export Functions ──────────────────────────────────────────────────────
  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header] ?? '';
        return typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n')) 
          ? `"${value.replace(/"/g, '""')}"` 
          : value;
      }).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportSoldItemsToCSV = (items, filename = 'sold_items_report') => {
    if (!items || items.length === 0) {
      alert('No sold items to export');
      return;
    }
    const exportData = items.map(item => ({
      product_name: item.name,
      sku: item.sku || '—',
      category: item.category || 'Uncategorized',
      quantity_sold: item.totalQty,
      unit: item.unit || 'pcs',
      cost_status: item.cost_status || 'recorded',
      unit_cost_ugx: item.cost_status === 'unavailable' || item.cost_price === null ? 'Unavailable' : Math.round(item.cost_price || 0),
      avg_selling_price_ugx: Math.round(item.avgSellingPrice || 0),
      total_revenue_ugx: Math.round(item.totalRevenue || 0),
      total_cost_ugx: item.cost_status === 'unavailable' || item.totalCost === null ? 'Unavailable' : Math.round(item.totalCost || 0),
      gross_profit_ugx: item.cost_status === 'unavailable' || item.totalProfit === null ? 'Unavailable' : Math.round(item.totalProfit || 0),
      profit_margin_pct: item.cost_status === 'unavailable' || item.marginPct === null ? 'Unavailable' : `${(item.marginPct || 0).toFixed(1)}%`,
      orders_count: item.salesCount || 0
    }));
    exportToCSV(exportData, filename);
  };

  const exportOverviewToCSV = () => {
    const overviewData = [
      { metric: 'Total Revenue', value: `UGX ${data.stats.totalSales.toLocaleString()}` },
      { metric: 'Total Costs', value: `UGX ${data.stats.totalPurchases.toLocaleString()}` },
      { metric: 'Net Profit', value: `UGX ${totalRevenue.toLocaleString()}` },
      { metric: 'Low Stock Items', value: data.stats.lowStockCount },
      { metric: 'Total Products', value: data.stats.totalProducts },
      { metric: 'Total Sales Count', value: data.sales.length },
      { metric: 'Total Purchases Count', value: data.purchases.length },
      { metric: 'Total Customers', value: data.customers.length },
      { metric: 'Total Suppliers', value: data.suppliers.length },
    ];
    exportToCSV(overviewData, 'overview_report');
  };

  const exportSalesData = () => {
    const salesData = data.sales.map(sale => ({
      id: sale.id,
      date: sale.sale_date || sale.created_at,
      customer: sale.customer?.name || 'Walk-in',
      payment_method: sale.payment_method,
      total_amount: sale.total_amount,
      discount: sale.discount_amount || 0,
      tax: sale.tax_amount || 0,
      items_count: (sale.sale_items || []).length
    }));
    exportToCSV(salesData, 'sales_report');
  };

  const exportPurchasesData = () => {
    const purchasesData = data.purchases.map(purchase => ({
      id: purchase.id,
      date: purchase.purchase_date || purchase.created_at,
      supplier: purchase.supplier?.name || 'Unknown',
      total_amount: purchase.total_amount,
      items_count: (purchase.purchase_items || []).length
    }));
    exportToCSV(purchasesData, 'purchases_report');
  };

  const exportProductsData = () => {
    const productsData = data.products.map(product => ({
      sku: product.sku || '',
      name: product.name,
      category: product.category?.name || '',
      stock: product.stock,
      unit: product.unit || '',
      cost_price: product.cost_price || 0,
      selling_price: product.price,
      reorder_level: product.reorder_level || 0,
      status: product.stock <= (product.reorder_level || 10) ? 'Low Stock' : 'In Stock'
    }));
    exportToCSV(productsData, 'products_inventory');
  };

  // ── Derived Sold Items for Dedicated Tab ─────────────────────────────────
  const filteredSalesForSoldItems = useMemo(() => {
    const allSales = data.sales || [];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return allSales.filter(sale => {
      const rawDate = sale.sale_date || sale.created_at;
      if (!rawDate) return true;
      const saleDateStr = rawDate.split('T')[0];

      if (soldItemRange === 'today') {
        return saleDateStr === todayStr;
      }
      if (soldItemRange === 'week') {
        const saleTime = new Date(saleDateStr).getTime();
        const weekAgo = now.getTime() - (7 * 24 * 60 * 60 * 1000);
        return saleTime >= weekAgo;
      }
      if (soldItemRange === 'month') {
        const thisMonthStr = now.toISOString().slice(0, 7);
        return saleDateStr.startsWith(thisMonthStr);
      }
      if (soldItemRange === 'custom') {
        if (soldItemCustomStart && saleDateStr < soldItemCustomStart) return false;
        if (soldItemCustomEnd && saleDateStr > soldItemCustomEnd) return false;
        return true;
      }
      return true;
    });
  }, [data.sales, soldItemRange, soldItemCustomStart, soldItemCustomEnd]);

  const aggregatedSoldItemsList = useMemo(() => {
    let items = aggregateSoldItems(filteredSalesForSoldItems);

    if (soldItemCategory !== 'all') {
      items = items.filter(it => it.category?.toLowerCase() === soldItemCategory.toLowerCase());
    }

    if (soldItemSearch.trim()) {
      const q = soldItemSearch.toLowerCase();
      items = items.filter(it =>
        it.name.toLowerCase().includes(q) ||
        (it.sku && it.sku.toLowerCase().includes(q)) ||
        (it.category && it.category.toLowerCase().includes(q))
      );
    }

    items.sort((a, b) => {
      if (soldItemSort === 'revenue-desc') return b.totalRevenue - a.totalRevenue;
      if (soldItemSort === 'qty-desc') return b.totalQty - a.totalQty;
      if (soldItemSort === 'profit-desc') return (b.totalProfit ?? -Infinity) - (a.totalProfit ?? -Infinity);
      if (soldItemSort === 'name-asc') return a.name.localeCompare(b.name);
      return 0;
    });

    return items;
  }, [filteredSalesForSoldItems, soldItemCategory, soldItemSearch, soldItemSort]);

  const soldItemsTotals = useMemo(() => {
    const acc = aggregatedSoldItemsList.reduce((sum, item) => {
      sum.totalQty += item.totalQty;
      sum.totalRevenue += item.totalRevenue;
      sum.knownCost += (item.knownCost || 0);
      if (item.cost_status === 'unavailable' || item.totalCost === null) {
        sum.hasUnavailable = true;
      } else if (item.cost_status === 'estimated') {
        sum.hasEstimated = true;
      }
      return sum;
    }, { totalQty: 0, totalRevenue: 0, knownCost: 0, hasUnavailable: false, hasEstimated: false });

    const costStatus = aggregatedSoldItemsList.length === 0
      ? 'no_sales'
      : acc.hasUnavailable
      ? 'unavailable'
      : acc.hasEstimated
      ? 'estimated'
      : 'recorded';

    return {
      totalQty: acc.totalQty,
      totalRevenue: acc.totalRevenue,
      knownCost: acc.knownCost,
      totalCost: costStatus === 'unavailable' ? null : acc.knownCost,
      totalProfit: costStatus === 'unavailable' ? null : (acc.totalRevenue - acc.knownCost),
      cost_status: costStatus,
    };
  }, [aggregatedSoldItemsList]);

  // ── Render Nested Receipt Breakdown Table ────────────────────────────────
  const renderSaleItemsDetailTable = (sale) => {
    const items = sale.sale_items || sale.saleItems || [];
    if (!items || items.length === 0) {
      return (
        <div style={{ padding: '14px 20px', background: '#f8fafc', color: '#94a3b8', fontSize: 13, fontStyle: 'italic' }}>
          No item breakdown recorded for this transaction.
        </div>
      );
    }
    let knownCost = 0;
    let hasUnavailable = false;
    let hasEstimated = false;
    items.forEach(item => {
      const qty = parseFloat(item.quantity || 0);
      if (item.cost_price !== null && item.cost_price !== undefined && item.cost_price !== '') {
        knownCost += qty * parseFloat(item.cost_price);
      } else if (item.product?.cost_price !== null && item.product?.cost_price !== undefined && item.product?.cost_price !== '') {
        knownCost += qty * parseFloat(item.product.cost_price);
        hasEstimated = true;
      } else {
        hasUnavailable = true;
      }
    });
    const totalRev = items.reduce((sum, item) => sum + parseFloat(item.subtotal || (item.quantity * item.price) || 0), 0);
    const totalCost = hasUnavailable ? null : knownCost;
    const totalProfit = hasUnavailable ? null : (totalRev - knownCost);

    return (
      <div style={{ background: '#f8fafc', padding: '16px 20px', borderTop: '1px dashed #cbd5e1', borderBottom: '2px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14 }}>📦</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
              Items in Transaction #{sale.id}
            </span>
            <span style={{ fontSize: 11, background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
            {sale.customer?.name && (
              <span style={{ fontSize: 12, color: '#64748b' }}>
                • Customer: <strong style={{ color: '#0f172a' }}>{sale.customer.name}</strong>
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 14, fontSize: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ color: '#64748b' }}>Revenue: <strong style={{ color: '#0f172a' }}>UGX {Math.round(totalRev).toLocaleString()}</strong></span>
            <span style={{ color: '#64748b' }}>
              Cost:{' '}
              <strong style={{ color: hasUnavailable ? '#b91c1c' : '#475569' }}>
                {hasUnavailable ? 'Unavailable' : `UGX ${Math.round(totalCost).toLocaleString()}${hasEstimated ? ' (Est.)' : ''}`}
              </strong>
            </span>
            <span style={{ color: hasUnavailable ? '#b91c1c' : totalProfit >= 0 ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
              Profit: {hasUnavailable ? 'Unavailable' : `UGX ${Math.round(totalProfit).toLocaleString()}${hasEstimated ? ' (Est.)' : ''}`}
            </span>
          </div>
        </div>
        <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>#</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Product Name & SKU</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Category</th>
                <th style={{ padding: '8px 12px', fontWeight: 600, textAlign: 'center' }}>Qty</th>
                <th style={{ padding: '8px 12px', fontWeight: 600, textAlign: 'right' }}>Unit Cost</th>
                <th style={{ padding: '8px 12px', fontWeight: 600, textAlign: 'right' }}>Unit Price</th>
                <th style={{ padding: '8px 12px', fontWeight: 600, textAlign: 'right' }}>Subtotal</th>
                <th style={{ padding: '8px 12px', fontWeight: 600, textAlign: 'right' }}>Profit</th>
                <th style={{ padding: '8px 12px', fontWeight: 600, textAlign: 'right' }}>Margin</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const prod = item.product || {};
                const name = prod.name || item.name || `Product #${item.product_id}`;
                const sku = prod.sku || '—';
                const catName = prod.category?.name || '—';
                const qty = parseFloat(item.quantity || 0);
                const unit = prod.unit || 'pcs';
                const unitPrice = parseFloat(item.price || 0);
                const subtotal = parseFloat(item.subtotal || (qty * unitPrice) || 0);
                const hasRecordedCost = item.cost_price !== null && item.cost_price !== undefined && item.cost_price !== '';
                const hasProdCost = prod.cost_price !== null && prod.cost_price !== undefined && prod.cost_price !== '';
                const isItemUnavailable = !hasRecordedCost && !hasProdCost;
                const isItemEstimated = !hasRecordedCost && hasProdCost;
                const unitCost = isItemUnavailable ? null : parseFloat(hasRecordedCost ? item.cost_price : prod.cost_price);
                const cost = isItemUnavailable ? null : qty * unitCost;
                const profit = isItemUnavailable ? null : subtotal - cost;
                const margin = isItemUnavailable ? null : (subtotal > 0 ? ((profit / subtotal) * 100).toFixed(1) : '0');

                return (
                  <tr key={idx} style={{ borderBottom: idx < items.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <td style={{ padding: '8px 12px', color: '#94a3b8' }}>{idx + 1}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{name}</div>
                      {sku !== '—' && <div style={{ fontSize: 11, color: '#64748b' }}>SKU: {sku}</div>}
                    </td>
                    <td style={{ padding: '8px 12px', color: '#64748b' }}>
                      <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>
                        {catName}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: '#0f172a' }}>
                      {qty} <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>{unit}</span>
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', color: isItemUnavailable ? '#b91c1c' : '#64748b' }}>
                      {isItemUnavailable ? 'Unavailable' : `UGX ${Math.round(unitCost).toLocaleString()}${isItemEstimated ? ' (Est.)' : ''}`}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                      UGX {Math.round(unitPrice).toLocaleString()}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                      UGX {Math.round(subtotal).toLocaleString()}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: isItemUnavailable ? '#b91c1c' : profit >= 0 ? '#16a34a' : '#dc2626' }}>
                      {isItemUnavailable ? 'Unavailable' : `UGX ${Math.round(profit).toLocaleString()}`}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                      {isItemUnavailable ? (
                        <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: '#fee2e2', color: '#b91c1c' }}>
                          Unavailable
                        </span>
                      ) : (
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          background: profit >= 0 ? '#dcfce7' : '#fee2e2',
                          color: profit >= 0 ? '#15803d' : '#b91c1c'
                        }}>
                          {profit >= 0 ? '+' : ''}{margin}%
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ── Render Sold Items Summary View for Daily/Weekly/Monthly ──────────────
  const renderSoldItemsSummaryView = (sales, periodLabel, exportFilename) => {
    const rawItems = aggregateSoldItems(sales);
    const filteredItems = rawItems.filter(it => {
      if (!periodItemSearch.trim()) return true;
      const q = periodItemSearch.toLowerCase();
      return it.name.toLowerCase().includes(q) ||
        (it.sku && it.sku.toLowerCase().includes(q)) ||
        (it.category && it.category.toLowerCase().includes(q));
    });

    const totalUnits = filteredItems.reduce((s, it) => s + it.totalQty, 0);
    const totalRev = filteredItems.reduce((s, it) => s + it.totalRevenue, 0);
    const hasUnavailable = filteredItems.some(it => it.cost_status === 'unavailable' || it.totalCost === null);
    const hasEstimated = filteredItems.some(it => it.cost_status === 'estimated');
    const knownCost = filteredItems.reduce((s, it) => s + (it.knownCost || 0), 0);
    const totalProfit = hasUnavailable ? null : (totalRev - knownCost);
    const overallMargin = hasUnavailable ? null : (totalRev > 0 ? ((totalProfit / totalRev) * 100).toFixed(1) : '0');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '18px 20px' }}>
        {/* Summary mini cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Distinct Items</span>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>{filteredItems.length} products</div>
          </div>
          <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Total Units Sold</span>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#2563eb', marginTop: 4 }}>{totalUnits.toLocaleString()} units</div>
          </div>
          <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Items Revenue</span>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#16a34a', marginTop: 4 }}>UGX {Math.round(totalRev).toLocaleString()}</div>
          </div>
          <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Items Profit & Margin</span>
            <div style={{ fontSize: 18, fontWeight: 700, color: hasUnavailable ? '#b91c1c' : totalProfit >= 0 ? '#16a34a' : '#dc2626', marginTop: 4 }}>
              {hasUnavailable ? (
                'Cost Unavailable'
              ) : (
                <>
                  UGX {Math.round(totalProfit).toLocaleString()}{' '}
                  <span style={{ fontSize: 12, fontWeight: 600 }}>
                    ({overallMargin}%{hasEstimated ? ' Est.' : ''})
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Filter input & export button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: 280 }}>
            <input
              type="text"
              placeholder="Filter sold items by name or SKU..."
              value={periodItemSearch}
              onChange={e => setPeriodItemSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 32px',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 13 }}>🔍</span>
          </div>
          <button
            onClick={() => exportSoldItemsToCSV(filteredItems, exportFilename || `sold_items_${periodLabel.toLowerCase()}`)}
            style={{
              padding: '8px 14px',
              background: '#0891b2',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            📥 Export Items CSV
          </button>
        </div>

        {/* Sold items table */}
        {filteredItems.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: 13, background: '#f8fafc', borderRadius: 8 }}>
            No sold items found matching query.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Product & SKU', 'Category', 'Units Sold', 'Avg Price', 'Unit Cost', 'Revenue', 'Cost', 'Gross Profit', 'Margin', 'Orders', ''].map((h, i) => (
                    <th key={i} style={{ padding: '10px 14px', textAlign: i >= 2 && i <= 8 ? 'right' : 'left', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(item => {
                  const isExp = !!expandedSoldProducts[item.id];
                  const isUnav = item.cost_status === 'unavailable' || item.totalCost === null;
                  const isEst = item.cost_status === 'estimated';
                  return (
                    <React.Fragment key={item.id}>
                      <tr style={{ borderBottom: '1px solid #f1f5f9', background: isExp ? '#fafbff' : '#fff' }}>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.name}</div>
                          {item.sku && item.sku !== '—' && (
                            <span style={{ fontSize: 11, color: '#64748b' }}>SKU: {item.sku}</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#475569' }}>
                          <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: 6, fontSize: 11 }}>
                            {item.category}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                          {item.totalQty} <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>{item.unit}</span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', color: '#334155' }}>
                          UGX {Math.round(item.avgSellingPrice).toLocaleString()}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', color: isUnav ? '#b91c1c' : '#64748b' }}>
                          {isUnav ? 'Unavailable' : `UGX ${Math.round(item.cost_price).toLocaleString()}${isEst ? ' (Est.)' : ''}`}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                          UGX {Math.round(item.totalRevenue).toLocaleString()}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', color: isUnav ? '#b91c1c' : '#64748b' }}>
                          {isUnav ? 'Unavailable' : `UGX ${Math.round(item.totalCost).toLocaleString()}${isEst ? ' (Est.)' : ''}`}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: isUnav ? '#b91c1c' : item.totalProfit >= 0 ? '#16a34a' : '#dc2626' }}>
                          {isUnav ? 'Unavailable' : `UGX ${Math.round(item.totalProfit).toLocaleString()}`}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          {isUnav ? (
                            <span style={{ padding: '3px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: '#fee2e2', color: '#b91c1c' }}>
                              Unavailable
                            </span>
                          ) : (
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: 12,
                              fontSize: 11,
                              fontWeight: 700,
                              background: item.totalProfit >= 0 ? '#dcfce7' : '#fee2e2',
                              color: item.totalProfit >= 0 ? '#15803d' : '#b91c1c'
                            }}>
                              {item.totalProfit >= 0 ? '+' : ''}{item.marginPct.toFixed(1)}%
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', color: '#64748b' }}>
                          <span style={{ background: '#f8fafc', padding: '2px 8px', borderRadius: 10, fontSize: 11, border: '1px solid #e2e8f0' }}>
                            {item.salesCount} txn{item.salesCount !== 1 ? 's' : ''}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => toggleExpandSoldProduct(item.id)}
                            style={{
                              background: isExp ? '#4f46e5' : '#f1f5f9',
                              color: isExp ? '#fff' : '#475569',
                              border: 'none',
                              borderRadius: 6,
                              padding: '5px 10px',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            <span>Receipts</span>
                            <span>{isExp ? '▲' : '▼'}</span>
                          </button>
                        </td>
                      </tr>
                      {isExp && (
                        <tr>
                          <td colSpan={11} style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                            <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                              <div style={{ padding: '10px 14px', background: '#f1f5f9', fontSize: 12, fontWeight: 700, color: '#334155', borderBottom: '1px solid #e2e8f0' }}>
                                🧾 Transactions containing "{item.name}" ({item.salesHistory.length})
                              </div>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                <thead>
                                  <tr style={{ background: '#f8fafc', color: '#64748b' }}>
                                    <th style={{ padding: '6px 12px', textAlign: 'left' }}>Date</th>
                                    <th style={{ padding: '6px 12px', textAlign: 'left' }}>Order #</th>
                                    <th style={{ padding: '6px 12px', textAlign: 'left' }}>Customer</th>
                                    <th style={{ padding: '6px 12px', textAlign: 'left' }}>Cashier</th>
                                    <th style={{ padding: '6px 12px', textAlign: 'right' }}>Qty</th>
                                    <th style={{ padding: '6px 12px', textAlign: 'right' }}>Sold At</th>
                                    <th style={{ padding: '6px 12px', textAlign: 'right' }}>Subtotal</th>
                                    <th style={{ padding: '6px 12px', textAlign: 'right' }}>Profit</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {item.salesHistory.map((h, hi) => (
                                    <tr key={hi} style={{ borderTop: '1px solid #f1f5f9' }}>
                                      <td style={{ padding: '6px 12px', color: '#475569' }}>{new Date(h.date).toLocaleDateString()}</td>
                                      <td style={{ padding: '6px 12px', fontWeight: 600, color: '#4f46e5' }}>#{h.saleId}</td>
                                      <td style={{ padding: '6px 12px', color: '#334155' }}>{h.customer}</td>
                                      <td style={{ padding: '6px 12px', color: '#64748b' }}>{h.cashier}</td>
                                      <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 600 }}>{h.quantity}</td>
                                      <td style={{ padding: '6px 12px', textAlign: 'right' }}>UGX {Math.round(h.unitPrice).toLocaleString()}</td>
                                      <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 700 }}>UGX {Math.round(h.subtotal).toLocaleString()}</td>
                                      <td style={{ padding: '6px 12px', textAlign: 'right', color: h.profit === null ? '#b91c1c' : h.profit >= 0 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                                        {h.profit === null ? 'Unavailable' : `UGX ${Math.round(h.profit).toLocaleString()}`}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // ── Render Sales Transactions with Expandable Item Receipts ──────────────
  const renderSalesTransactionsSection = (sales, periodLabel, exportFilename, showCustomer = false) => {
    const soldItems = aggregateSoldItems(sales);

    return (
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
        {/* Header toolbar */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
              {reportSubView === 'transactions' ? `${periodLabel} Transactions` : `${periodLabel} Sold Items Breakdown`}
            </h3>
            <span style={{ fontSize: 11, color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 20, padding: '3px 10px', fontWeight: 600 }}>
              {sales?.length || 0} transaction{sales?.length !== 1 ? 's' : ''} · {soldItems.length} item{soldItems.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 3 }}>
              <button
                type="button"
                onClick={() => setReportSubView('transactions')}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: 6,
                  background: reportSubView === 'transactions' ? '#fff' : 'transparent',
                  color: reportSubView === 'transactions' ? '#0f172a' : '#64748b',
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: 'pointer',
                  boxShadow: reportSubView === 'transactions' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s'
                }}
              >
                🧾 Transactions ({sales?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setReportSubView('items')}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: 6,
                  background: reportSubView === 'items' ? '#fff' : 'transparent',
                  color: reportSubView === 'items' ? '#0f172a' : '#64748b',
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: 'pointer',
                  boxShadow: reportSubView === 'items' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s'
                }}
              >
                📦 Sold Items Details ({soldItems.length})
              </button>
            </div>
          </div>
        </div>

        {/* View Mode Switching */}
        {reportSubView === 'items' ? (
          renderSoldItemsSummaryView(sales, periodLabel, exportFilename)
        ) : (
          sales?.length === 0 ? (
            <p style={{ padding: 20, color: '#94a3b8', fontSize: 14 }}>No sales recorded for this period.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {(showCustomer
                    ? ['Date', 'Cashier', 'Customer', 'Payment', 'Sold Items Breakdown', 'Amount', 'Cost', 'Profit']
                    : ['Time', 'Cashier', 'Payment', 'Sold Items Breakdown', 'Amount', 'Cost', 'Profit']
                  ).map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sales?.map(s => {
                  const itemsCount = (s.sale_items || s.saleItems || []).length;
                  const isExp = !!expandedSales[s.id];
                  const colSpanCount = showCustomer ? 8 : 7;
                  const isSaleCostUnavailable = s.cost_status === 'unavailable' || s.cost === null || s.profit === null;
                  const isSaleCostEstimated = s.cost_status === 'estimated';
                  return (
                    <React.Fragment key={s.id}>
                      <tr style={{ borderTop: '1px solid #f1f5f9', background: isExp ? '#fafbff' : '#fff' }}>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>
                          {showCustomer
                            ? new Date(s.sale_date).toLocaleDateString()
                            : new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 14, color: '#0f172a' }}>{s.user?.name || '—'}</td>
                        {showCustomer && (
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#475569' }}>{s.customer?.name || 'Walk-in'}</td>
                        )}
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: getPayColor(s.payment_method) + '18', color: getPayColor(s.payment_method), border: `1px solid ${getPayColor(s.payment_method)}40`, textTransform: 'capitalize' }}>
                            {s.payment_method?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <button
                            type="button"
                            onClick={() => toggleExpandSale(s.id)}
                            style={{
                              background: isExp ? '#4f46e5' : '#eef2ff',
                              color: isExp ? '#fff' : '#4f46e5',
                              border: `1px solid ${isExp ? '#4f46e5' : '#c7d2fe'}`,
                              borderRadius: 6,
                              padding: '5px 12px',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              transition: 'all 0.15s'
                            }}
                          >
                            <span>📦 {itemsCount} {itemsCount === 1 ? 'item' : 'items'}</span>
                            <span style={{ fontSize: 10 }}>{isExp ? '▲ Hide' : '▼ Details'}</span>
                          </button>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                          UGX {parseFloat(s.total_amount || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 14, color: isSaleCostUnavailable ? '#b91c1c' : '#64748b' }}>
                          {isSaleCostUnavailable
                            ? 'Unavailable'
                            : `UGX ${parseFloat(s.cost || 0).toLocaleString()}${isSaleCostEstimated ? ' (Est.)' : ''}`}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: isSaleCostUnavailable ? '#b91c1c' : parseFloat(s.profit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                          {isSaleCostUnavailable
                            ? 'Unavailable'
                            : `UGX ${parseFloat(s.profit || 0).toLocaleString()}${isSaleCostEstimated ? ' (Est.)' : ''}`}
                        </td>
                      </tr>
                      {isExp && (
                        <tr>
                          <td colSpan={colSpanCount} style={{ padding: 0 }}>
                            {renderSaleItemsDetailTable(s)}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )
        )}
      </div>
    );
  };

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
      if (activeReport === 'daily') url = `${API_URL}/sales/daily-report?date=${dailyDate}`;
      else if (activeReport === 'weekly') url = `${API_URL}/sales/weekly-report?date=${weeklyDate}`;
      else if (activeReport === 'monthly-sales') url = `${API_URL}/sales/monthly-report?month=${monthlyMonth}`;
      else if (activeReport === 'yearly') url = `${API_URL}/sales/yearly-report?year=${yearlyYear}`;
      else if (activeReport === 'daily-purchases') url = `${API_URL}/purchases/daily-report?date=${dailyPurchasesDate}`;
      else url = `${API_URL}/purchases/monthly-report?month=${monthlyMonth}`;

      const res = await fetch(url, { headers });
      const json = await res.json();
      if (!res.ok) { setReportError(json?.message || 'Failed to load report.'); return; }
      setReportData(json.data);
    } catch { setReportError('Could not reach the server.'); }
    finally { setReportLoading(false); }
  };

  const paymentColors = { cash: '#16a34a', card: '#2563eb', mobile_money: '#7c3aed', bank_transfer: '#0891b2' };
  const getPayColor = (m) => paymentColors[m] || '#64748b';

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'sold-items', label: '📦 Sold Items Details' },
    { id: 'daily', label: 'Daily Sales' },
    { id: 'weekly', label: 'Weekly Sales' },
    { id: 'monthly-sales', label: 'Monthly Sales' },
    { id: 'yearly', label: 'Yearly Report' },
    { id: 'daily-purchases', label: 'Daily Purchases' },
    { id: 'saved-reports', label: 'Saved Reports' },
  ];

  return (
    <div style={styles.pageContainer}>
      <div className="section-hero" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 28,
        boxShadow: '0 4px 24px rgba(15,23,42,0.14)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Business Intelligence</p>
          <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.3px' }}>Reports & Analytics</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>Analyse your business performance and trends</p>
        </div>
        
        {/* Export Buttons */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => handleExport('reports/overview/export', {}, 'business_overview_report', 'pdf')}
            disabled={exportingKey === 'reports/overview/export_pdf'}
            style={{
              padding: '10px 16px',
              background: exportingKey === 'reports/overview/export_pdf' ? '#94a3b8' : '#dc2626',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: exportingKey === 'reports/overview/export_pdf' ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'background 0.15s',
              boxShadow: '0 2px 6px rgba(220,38,38,0.2)'
            }}
            onMouseEnter={e => { if (exportingKey !== 'reports/overview/export_pdf') e.currentTarget.style.background = '#b91c1c'; }}
            onMouseLeave={e => { if (exportingKey !== 'reports/overview/export_pdf') e.currentTarget.style.background = '#dc2626'; }}
          >
            {exportingKey === 'reports/overview/export_pdf' ? '⏳ Generating...' : '📄 Overview PDF'}
          </button>
          <button
            onClick={() => handleExport('reports/overview/export', {}, 'business_overview_report', 'docx')}
            disabled={exportingKey === 'reports/overview/export_docx'}
            style={{
              padding: '10px 16px',
              background: exportingKey === 'reports/overview/export_docx' ? '#94a3b8' : '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: exportingKey === 'reports/overview/export_docx' ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'background 0.15s',
              boxShadow: '0 2px 6px rgba(37,99,235,0.2)'
            }}
            onMouseEnter={e => { if (exportingKey !== 'reports/overview/export_docx') e.currentTarget.style.background = '#1d4ed8'; }}
            onMouseLeave={e => { if (exportingKey !== 'reports/overview/export_docx') e.currentTarget.style.background = '#2563eb'; }}
          >
            {exportingKey === 'reports/overview/export_docx' ? '⏳ Generating...' : '📝 Overview Word'}
          </button>
          <button
            onClick={() => exportSoldItemsToCSV(aggregateSoldItems(data.sales), 'all_sold_items_report')}
            style={{
              padding: '10px 16px',
              background: '#0891b2',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'background 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#0e7490'}
            onMouseLeave={e => e.currentTarget.style.background = '#0891b2'}
          >
            📦 Export Sold Items
          </button>
          <button
            onClick={exportOverviewToCSV}
            style={{
              padding: '10px 16px',
              background: '#16a34a',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'background 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#15803d'}
            onMouseLeave={e => e.currentTarget.style.background = '#16a34a'}
          >
            📊 Export Overview
          </button>
          <button
            onClick={exportSalesData}
            style={{
              padding: '10px 16px',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'background 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#1d4ed8'}
            onMouseLeave={e => e.currentTarget.style.background = '#2563eb'}
          >
            💰 Export Sales
          </button>
          <button
            onClick={exportPurchasesData}
            style={{
              padding: '10px 16px',
              background: '#7c3aed',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'background 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#6d28d9'}
            onMouseLeave={e => e.currentTarget.style.background = '#7c3aed'}
          >
            🛒 Export Purchases
          </button>
          <button
            onClick={exportProductsData}
            style={{
              padding: '10px 16px',
              background: '#d97706',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'background 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#c2410c'}
            onMouseLeave={e => e.currentTarget.style.background = '#d97706'}
          >
            📦 Export Inventory
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '2px solid #f1f5f9', paddingBottom: 0, overflowX: 'auto' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setActiveReport(t.id); setReportData(null); setReportError(null); setReportSubView('transactions'); }} style={{
            padding: '9px 18px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: 600,
            whiteSpace: 'nowrap',
            color: activeReport === t.id ? '#4f46e5' : '#64748b',
            borderBottom: activeReport === t.id ? '2px solid #4f46e5' : '2px solid transparent',
            marginBottom: -2, transition: 'all 0.15s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeReport === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <ReportExportBar
            title="Business Overview Report"
            onExportPdf={() => handleExport('reports/overview/export', {}, 'business_overview_report', 'pdf')}
            onExportWord={() => handleExport('reports/overview/export', {}, 'business_overview_report', 'docx')}
            isPdfLoading={exportingKey === 'reports/overview/export_pdf'}
            isWordLoading={exportingKey === 'reports/overview/export_docx'}
            extraActions={
              <button
                type="button"
                onClick={exportOverviewToCSV}
                style={{
                  padding: '8px 14px',
                  background: '#f8fafc',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                📊 Export CSV
              </button>
            }
          />

          {/* KPI row */}
          <div className="reports-kpi-grid">
            {[
              { label: 'Total Collected Sales', value: `UGX ${data.stats.totalSales.toLocaleString()}`, icon: '💰', color: '#16a34a', bg: '#f0fdf4' },
              { label: 'Total Stock Purchases', value: `UGX ${data.stats.totalPurchases.toLocaleString()}`, icon: '🛒', color: '#d97706', bg: '#fffbeb' },
              { label: 'Net Cash Flow (Sales − Purchases)', value: `UGX ${totalRevenue.toLocaleString()}`, icon: '📈', color: totalRevenue >= 0 ? '#16a34a' : '#dc2626', bg: totalRevenue >= 0 ? '#f0fdf4' : '#fef2f2' },
              { label: 'Low Stock', value: data.stats.lowStockCount, icon: '⚠️', color: data.stats.lowStockCount > 0 ? '#dc2626' : '#16a34a', bg: data.stats.lowStockCount > 0 ? '#fef2f2' : '#f0fdf4' },
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

          {/* ── REVENUE & GROSS PROFIT ANALYTICS SECTION ── */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 14,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              boxShadow: '0 1px 4px rgba(15,23,42,0.04)',
            }}
          >
            {/* Header & Filter Controls */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: 16,
                borderBottom: '1px solid #f1f5f9',
                paddingBottom: 16,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0f172a' }}>
                    📊 Revenue & Gross Profit Analytics
                  </h2>
                  {analyticsData?.cost_status && (
                    <CostAccuracyBadge status={analyticsData.cost_status} size="md" />
                  )}
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                  Net Sales Revenue excludes tax collected and subtracts discounts. Gross Profit = Net Sales Revenue − COGS (operating expenses are not tracked).
                </p>
              </div>

              {/* Filter Bar: Date Range Presets + Grouping */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginRight: 4 }}>
                    Range:
                  </span>
                  {[
                    { id: 'last_7_days', label: 'Last 7 Days' },
                    { id: 'last_30_days', label: 'Last 30 Days' },
                    { id: 'this_month', label: 'This Month' },
                    { id: 'this_year', label: 'This Year' },
                    { id: 'custom', label: 'Custom Range' },
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectAnalyticsPreset(p.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 20,
                        border: analyticsPreset === p.id ? '1px solid #4f46e5' : '1px solid #cbd5e1',
                        background: analyticsPreset === p.id ? '#4f46e5' : '#f8fafc',
                        color: analyticsPreset === p.id ? '#fff' : '#475569',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                  {/* Custom or active date inputs */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <input
                      type="date"
                      value={analyticsStartDate}
                      onChange={e => {
                        setAnalyticsPreset('custom');
                        setAnalyticsStartDate(e.target.value);
                      }}
                      aria-label="Analytics Start Date"
                      style={{
                        padding: '5px 10px',
                        borderRadius: 6,
                        border: '1px solid #cbd5e1',
                        fontSize: 12,
                        color: '#0f172a',
                      }}
                    />
                    <span style={{ fontSize: 12, color: '#64748b' }}>to</span>
                    <input
                      type="date"
                      value={analyticsEndDate}
                      onChange={e => {
                        setAnalyticsPreset('custom');
                        setAnalyticsEndDate(e.target.value);
                      }}
                      aria-label="Analytics End Date"
                      style={{
                        padding: '5px 10px',
                        borderRadius: 6,
                        border: '1px solid #cbd5e1',
                        fontSize: 12,
                        color: '#0f172a',
                      }}
                    />
                  </div>

                  {/* Grouping Toggle: Daily / Weekly / Monthly */}
                  <div
                    style={{
                      display: 'inline-flex',
                      background: '#f1f5f9',
                      borderRadius: 8,
                      padding: 3,
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    {[
                      { id: 'daily', label: 'Daily' },
                      { id: 'weekly', label: 'Weekly' },
                      { id: 'monthly', label: 'Monthly' },
                    ].map(g => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setAnalyticsGroupBy(g.id)}
                        style={{
                          padding: '5px 12px',
                          border: 'none',
                          borderRadius: 6,
                          background: analyticsGroupBy === g.id ? '#ffffff' : 'transparent',
                          color: analyticsGroupBy === g.id ? '#4f46e5' : '#64748b',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          boxShadow: analyticsGroupBy === g.id ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                        }}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Cost Completeness / Accuracy Banner when Estimated or Unavailable */}
            {analyticsData?.cost_accuracy && analyticsData.cost_status === 'unavailable' && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 10,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  color: '#991b1b',
                  fontSize: 12,
                }}
              >
                <span style={{ fontSize: 16 }}>⚠️</span>
                <div>
                  <strong style={{ display: 'block', marginBottom: 2 }}>
                    Incomplete Cost Data — Gross Profit Cannot Be Accurately Calculated
                  </strong>
                  <span>
                    {analyticsData.cost_accuracy.unavailable_items} sold item(s) across{' '}
                    {analyticsData.cost_accuracy.unavailable_sales} sale(s) have neither a recorded historical cost snapshot nor a current product cost price.
                    Unknown COGS is never treated as zero to avoid reporting inflated profit figures.
                    Known partial COGS for the remaining items is{' '}
                    <strong>{formatUGX(analyticsData.known_cogs)}</strong>.
                  </span>
                </div>
              </div>
            )}

            {analyticsData?.cost_accuracy && analyticsData.cost_status === 'estimated' && (
              <div
                style={{
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: 10,
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 10,
                  color: '#92400e',
                  fontSize: 12,
                }}
              >
                <div>
                  <strong>≈ Historical Cost Estimate Active: </strong>
                  {analyticsData.cost_accuracy.estimated_items} of {analyticsData.cost_accuracy.total_items} sold item(s) ({analyticsData.cost_accuracy.estimated_items_pct}%) predated cost snapshotting and use current product catalog cost prices as an estimate.
                  {' '}({analyticsData.cost_accuracy.recorded_items} item(s) use recorded snapshots.)
                </div>
              </div>
            )}

            {/* Analytics Summary KPI Cards */}
            <div className="reports-kpi-grid">
              {/* 1. Net Sales Revenue */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px', minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Net Sales Revenue
                    </p>
                    <p style={{ margin: '6px 0 4px', fontSize: 21, fontWeight: 700, color: '#2563eb' }}>
                      {analyticsLoading
                        ? '...'
                        : analyticsError || !analyticsData
                        ? '—'
                        : formatUGX(analyticsData.net_sales_revenue ?? 0)}
                    </p>
                    <div style={{ fontSize: 11, color: '#64748b', display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span>
                        Gross Item Sales:{' '}
                        <strong>
                          {analyticsError || !analyticsData ? '—' : formatUGX(analyticsData.gross_item_sales ?? 0)}
                        </strong>
                      </span>
                      <span>
                        Discounts Subtracted:{' '}
                        <strong style={{ color: '#d97706' }}>
                          {analyticsError || !analyticsData
                            ? '—'
                            : `-${formatUGX(analyticsData.effective_discounts ?? analyticsData.total_discounts ?? 0)}`}
                        </strong>
                      </span>
                      {analyticsData &&
                        Number(analyticsData.total_discounts ?? 0) >
                          Number(analyticsData.effective_discounts ?? analyticsData.total_discounts ?? 0) && (
                          <span style={{ color: '#b45309' }}>
                            Raw Discount: <strong>{formatUGX(analyticsData.total_discounts)}</strong> (Excess Capped:{' '}
                            <strong>
                              {formatUGX(
                                analyticsData.excess_discounts ??
                                  Number(analyticsData.total_discounts || 0) -
                                    Number(analyticsData.effective_discounts ?? 0)
                              )}
                            </strong>
                            )
                          </span>
                        )}
                      <span>
                        Tax Collected (Excl.):{' '}
                        <strong>
                          {analyticsError || !analyticsData ? '—' : formatUGX(analyticsData.tax_collected ?? 0)}
                        </strong>
                      </span>
                      <span>
                        Total Collected:{' '}
                        <strong>
                          {analyticsError || !analyticsData ? '—' : formatUGX(analyticsData.total_collected ?? 0)}
                        </strong>
                      </span>
                    </div>
                  </div>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    💵
                  </div>
                </div>
              </div>

              {/* 2. Cost of Goods Sold (COGS) */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px', minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Cost of Goods Sold (COGS)
                    </p>
                    <p
                      style={{
                        margin: '6px 0 4px',
                        fontSize: 21,
                        fontWeight: 700,
                        color: analyticsData?.cost_status === 'unavailable' ? '#b91c1c' : '#d97706',
                      }}
                    >
                      {analyticsLoading
                        ? '...'
                        : analyticsError || !analyticsData
                        ? '—'
                        : analyticsData.cost_status === 'unavailable'
                        ? 'Cost Unavailable'
                        : formatUGX(analyticsData.total_cogs ?? 0)}
                    </p>
                    <div style={{ fontSize: 11, color: '#64748b', display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {analyticsData?.cost_status === 'unavailable' && (
                        <span style={{ color: '#b91c1c', fontWeight: 600 }}>
                          Known Partial COGS: {formatUGX(analyticsData?.known_cogs ?? 0)}
                        </span>
                      )}
                      <span>
                        Recorded Snapshots:{' '}
                        <strong>{analyticsError || !analyticsData ? '—' : (analyticsData?.cost_accuracy?.recorded_items ?? 0)}</strong>{' '}
                        {analyticsError || !analyticsData ? '' : `item(s) (${formatUGX(analyticsData?.cost_accuracy?.recorded_cogs ?? 0)})`}
                      </span>
                      <span>
                        Estimated Historical:{' '}
                        <strong>{analyticsError || !analyticsData ? '—' : (analyticsData?.cost_accuracy?.estimated_items ?? 0)}</strong>{' '}
                        {analyticsError || !analyticsData ? '' : `item(s) (${formatUGX(analyticsData?.cost_accuracy?.estimated_cogs ?? 0)})`}
                      </span>
                      {(analyticsData?.cost_accuracy?.unavailable_items ?? 0) > 0 && (
                        <span style={{ color: '#b91c1c', fontWeight: 600 }}>
                          Unavailable Cost: {analyticsData.cost_accuracy.unavailable_items} item(s)
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    📦
                  </div>
                </div>
              </div>

              {/* 3. Gross Profit */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px', minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Gross Profit
                      </p>
                      {analyticsData?.cost_status === 'estimated' && (
                        <span style={{ fontSize: 10, fontWeight: 700, background: '#fef3c7', color: '#b45309', padding: '1px 6px', borderRadius: 999 }}>
                          Estimated
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        margin: '6px 0 4px',
                        fontSize: 21,
                        fontWeight: 700,
                        color:
                          analyticsError || !analyticsData
                            ? '#64748b'
                            : analyticsData?.cost_status === 'unavailable'
                            ? '#b91c1c'
                            : Number(analyticsData?.gross_profit ?? 0) >= 0
                            ? '#16a34a'
                            : '#dc2626',
                      }}
                    >
                      {analyticsLoading
                        ? '...'
                        : analyticsError || !analyticsData
                        ? '—'
                        : analyticsData.cost_status === 'unavailable'
                        ? 'Unavailable'
                        : formatUGX(analyticsData.gross_profit ?? 0)}
                    </p>
                    <div style={{ fontSize: 11, color: '#64748b', display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span>Formula: Net Sales Revenue − COGS</span>
                      <span>
                        {analyticsError || !analyticsData
                          ? 'Select a valid date range to calculate gross profit.'
                          : analyticsData?.cost_status === 'unavailable'
                          ? 'Missing product cost prevents accurate gross profit calculation.'
                          : analyticsData?.cost_status === 'estimated'
                          ? 'Includes estimated COGS from current catalog costs.'
                          : 'Based on recorded cost snapshots.'}
                      </span>
                    </div>
                  </div>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    📈
                  </div>
                </div>
              </div>

              {/* 4. Gross Profit Margin */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px', minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Gross Profit Margin
                    </p>
                    <p
                      style={{
                        margin: '6px 0 4px',
                        fontSize: 21,
                        fontWeight: 700,
                        color:
                          analyticsError || !analyticsData
                            ? '#64748b'
                            : analyticsData?.cost_status === 'unavailable'
                            ? '#b91c1c'
                            : Number(analyticsData?.gross_profit_margin ?? 0) >= 0
                            ? '#0f172a'
                            : '#dc2626',
                      }}
                    >
                      {analyticsLoading
                        ? '...'
                        : analyticsError || !analyticsData
                        ? '—'
                        : analyticsData.cost_status === 'unavailable' || analyticsData.gross_profit_margin === null
                        ? 'Unavailable'
                        : `${Number(analyticsData.gross_profit_margin ?? 0).toFixed(1)}%`}
                    </p>
                    <div style={{ fontSize: 11, color: '#64748b', display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span>(Gross Profit ÷ Net Sales Revenue) × 100</span>
                      <span>
                        Transactions in range:{' '}
                        <strong>{analyticsError || !analyticsData ? '—' : (analyticsData?.transaction_count ?? 0)}</strong>
                      </span>
                    </div>
                  </div>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    🎯
                  </div>
                </div>
              </div>
            </div>

            {/* Graphs Grid: Bar Graph + Line Graph */}
            <div className="reports-2col">
              {/* Bar Graph */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                      Revenue, COGS & Gross Profit Comparison
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                      Grouped bar graph ({analyticsGroupBy} buckets, {analyticsData?.filters?.start_date || analyticsStartDate} to {analyticsData?.filters?.end_date || analyticsEndDate})
                    </p>
                  </div>
                </div>
                <RevenueProfitBarChart
                  series={analyticsData?.series || []}
                  loading={analyticsLoading}
                  error={analyticsError}
                  groupBy={analyticsGroupBy}
                  onRetry={fetchRevenueProfitAnalytics}
                />
              </div>

              {/* Line Graph */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                      Net Sales Revenue & Gross Profit Trend
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                      Continuous time-series trend line ({analyticsData?.series?.length || 0} {analyticsGroupBy} buckets)
                    </p>
                  </div>
                </div>
                <RevenueProfitLineChart
                  series={analyticsData?.series || []}
                  loading={analyticsLoading}
                  error={analyticsError}
                  groupBy={analyticsGroupBy}
                  onRetry={fetchRevenueProfitAnalytics}
                />
              </div>
            </div>
          </div>

          <div className="reports-2col">

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
                  { label: 'Total Products', value: data.stats.totalProducts, icon: '📦' },
                  { label: 'Categories', value: data.categories.length, icon: '🏷️' },
                  { label: 'Suppliers', value: data.suppliers.length, icon: '🏭' },
                  { label: 'Customers', value: data.customers.length, icon: '👥' },
                  { label: 'Total Sales', value: data.sales.length, icon: '💰' },
                  { label: 'Total Purchases', value: data.purchases.length, icon: '🛒' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
                    <span style={{ fontSize: 14, color: '#475569' }}>{r.icon} {r.label}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="reports-2col">

            {/* Top products */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Top Products by Revenue</h3>
                <button
                  type="button"
                  onClick={() => setActiveReport('sold-items')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#4f46e5',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  View Sold Items Details &rarr;
                </button>
              </div>
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

      {/* ── DEDICATED SOLD ITEMS DETAILS REPORT ── */}
      {activeReport === 'sold-items' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Controls Bar: Time Filter, Category, Search, Sort, Export */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Top row: Date Range Pills */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginRight: 4, letterSpacing: '0.04em' }}>Period:</span>
                {[
                  { id: 'all', label: 'All Time' },
                  { id: 'today', label: 'Today' },
                  { id: 'week', label: 'This Week (7d)' },
                  { id: 'month', label: 'This Month' },
                  { id: 'custom', label: 'Custom Range' },
                ].map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSoldItemRange(r.id)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 20,
                      border: soldItemRange === r.id ? '1.5px solid #4f46e5' : '1px solid #cbd5e1',
                      background: soldItemRange === r.id ? '#4f46e5' : '#fff',
                      color: soldItemRange === r.id ? '#fff' : '#475569',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              {soldItemRange === 'custom' && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="date"
                    value={soldItemCustomStart}
                    onChange={e => setSoldItemCustomStart(e.target.value)}
                    style={{ ...supS.input, width: 140, padding: '5px 8px', fontSize: 12 }}
                  />
                  <span style={{ color: '#94a3b8', fontSize: 12 }}>to</span>
                  <input
                    type="date"
                    value={soldItemCustomEnd}
                    onChange={e => setSoldItemCustomEnd(e.target.value)}
                    style={{ ...supS.input, width: 140, padding: '5px 8px', fontSize: 12 }}
                  />
                </div>
              )}
            </div>

            {/* Bottom row: Search, Category, Sort, Export */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flex: 1 }}>
                <div style={{ position: 'relative', minWidth: 260 }}>
                  <input
                    type="text"
                    placeholder="Search by product, SKU, category..."
                    value={soldItemSearch}
                    onChange={e => setSoldItemSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 34px',
                      border: '1px solid #cbd5e1',
                      borderRadius: 8,
                      fontSize: 13,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 14 }}>🔍</span>
                </div>

                <select
                  value={soldItemCategory}
                  onChange={e => setSoldItemCategory(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    fontSize: 13,
                    color: '#334155',
                    outline: 'none',
                    background: '#fff'
                  }}
                >
                  <option value="all">All Categories</option>
                  {(data.categories || []).map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>

                <select
                  value={soldItemSort}
                  onChange={e => setSoldItemSort(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    fontSize: 13,
                    color: '#334155',
                    outline: 'none',
                    background: '#fff'
                  }}
                >
                  <option value="revenue-desc">Sort by Revenue (Highest)</option>
                  <option value="qty-desc">Sort by Units Sold (Most)</option>
                  <option value="profit-desc">Sort by Profit (Highest)</option>
                  <option value="name-asc">Sort by Product Name (A-Z)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => exportSoldItemsToCSV(aggregatedSoldItemsList, `sold_items_${soldItemRange}`)}
                style={{
                  padding: '9px 16px',
                  background: '#0891b2',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                📥 Export Sold Items CSV
              </button>
            </div>
          </div>

          {/* KPI Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Units Sold</p>
                <p style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 800, color: '#2563eb' }}>
                  {soldItemsTotals.totalQty.toLocaleString()} <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>units</span>
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 11, color: '#94a3b8' }}>Across {aggregatedSoldItemsList.length} distinct products</p>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📦</div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Sold Items Revenue</p>
                <p style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 800, color: '#16a34a' }}>
                  UGX {Math.round(soldItemsTotals.totalRevenue).toLocaleString()}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 11, color: '#94a3b8' }}>Gross customer payments</p>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>💰</div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Cost of Goods Sold (COGS)</p>
                <p style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 800, color: soldItemsTotals.totalCost === null ? '#b91c1c' : '#d97706' }}>
                  {soldItemsTotals.totalCost === null
                    ? 'Unavailable'
                    : `UGX ${Math.round(soldItemsTotals.totalCost).toLocaleString()}${soldItemsTotals.cost_status === 'estimated' ? ' (Est.)' : ''}`}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 11, color: '#94a3b8' }}>
                  {soldItemsTotals.totalCost === null ? 'Some items missing cost price' : 'Wholesale acquisition cost'}
                </p>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🛒</div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Gross Profit & Margin</p>
                <p style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 800, color: soldItemsTotals.totalProfit === null ? '#b91c1c' : soldItemsTotals.totalProfit >= 0 ? '#16a34a' : '#dc2626' }}>
                  {soldItemsTotals.totalProfit === null
                    ? 'Unavailable'
                    : `UGX ${Math.round(soldItemsTotals.totalProfit).toLocaleString()}${soldItemsTotals.cost_status === 'estimated' ? ' (Est.)' : ''}`}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 11, color: '#64748b' }}>
                  Margin: <strong style={{ color: soldItemsTotals.totalProfit === null ? '#b91c1c' : soldItemsTotals.totalProfit >= 0 ? '#16a34a' : '#dc2626' }}>
                    {soldItemsTotals.totalProfit === null
                      ? '—'
                      : soldItemsTotals.totalRevenue > 0
                        ? `${((soldItemsTotals.totalProfit / soldItemsTotals.totalRevenue) * 100).toFixed(1)}%`
                        : '0%'}
                  </strong>
                </p>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: soldItemsTotals.totalProfit === null ? '#fef2f2' : soldItemsTotals.totalProfit >= 0 ? '#f0fdf4' : '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                {soldItemsTotals.totalProfit === null ? '⚠️' : soldItemsTotals.totalProfit >= 0 ? '📈' : '📉'}
              </div>
            </div>
          </div>

          {/* Sold Items Table Card */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Sold Items Detailed Breakdown</h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                  Showing {aggregatedSoldItemsList.length} items sold across selected time frame
                </p>
              </div>
              <span style={{ fontSize: 12, color: '#4f46e5', background: '#eef2ff', padding: '4px 10px', borderRadius: 12, fontWeight: 600 }}>
                {soldItemsTotals.totalQty.toLocaleString()} Total Units Sold
              </span>
            </div>

            {aggregatedSoldItemsList.length === 0 ? (
              <div style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8' }}>
                <p style={{ fontSize: 32, margin: '0 0 10px' }}>📦</p>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#334155' }}>No sold items found</p>
                <p style={{ margin: '6px 0 0', fontSize: 13, color: '#94a3b8' }}>Try adjusting your date range or search filter.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      {['#', 'Product & SKU', 'Category', 'Units Sold', 'Unit Cost', 'Avg Price', 'Total Revenue', 'Total Cost', 'Gross Profit', 'Margin', 'Orders', 'Actions'].map((h, i) => (
                        <th key={i} style={{ padding: '12px 14px', textAlign: i >= 3 && i <= 9 ? 'right' : i === 10 ? 'center' : 'left', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {aggregatedSoldItemsList.map((item, index) => {
                      const isExp = !!expandedSoldProducts[item.id];
                      const itemUnavailable = item.cost_status === 'unavailable' || item.totalProfit === null;
                      const itemEstimated = item.cost_status === 'estimated';
                      return (
                        <React.Fragment key={item.id}>
                          <tr style={{ borderBottom: '1px solid #f1f5f9', background: isExp ? '#fafbff' : '#fff' }}>
                            <td style={{ padding: '12px 14px', color: '#94a3b8', fontSize: 12 }}>{index + 1}</td>
                            <td style={{ padding: '12px 14px' }}>
                              <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.name}</div>
                              {item.sku && item.sku !== '—' && (
                                <span style={{ fontSize: 11, color: '#64748b', background: '#f1f5f9', padding: '1px 6px', borderRadius: 4, marginTop: 2, display: 'inline-block' }}>
                                  SKU: {item.sku}
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '12px 14px', color: '#475569' }}>
                              <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500 }}>
                                {item.category}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                              {item.totalQty.toLocaleString()} <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>{item.unit}</span>
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'right', color: itemUnavailable ? '#b91c1c' : '#64748b' }}>
                              {itemUnavailable || item.cost_price === null
                                ? 'Unavailable'
                                : `UGX ${Math.round(item.cost_price).toLocaleString()}${itemEstimated ? ' (Est.)' : ''}`}
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600, color: '#334155' }}>
                              UGX {Math.round(item.avgSellingPrice).toLocaleString()}
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                              UGX {Math.round(item.totalRevenue).toLocaleString()}
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'right', color: itemUnavailable ? '#b91c1c' : '#64748b' }}>
                              {itemUnavailable || item.totalCost === null
                                ? 'Unavailable'
                                : `UGX ${Math.round(item.totalCost).toLocaleString()}${itemEstimated ? ' (Est.)' : ''}`}
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: itemUnavailable ? '#b91c1c' : item.totalProfit >= 0 ? '#16a34a' : '#dc2626' }}>
                              {itemUnavailable
                                ? 'Unavailable'
                                : `UGX ${Math.round(item.totalProfit).toLocaleString()}${itemEstimated ? ' (Est.)' : ''}`}
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                              {itemUnavailable || item.marginPct === null ? (
                                <span style={{ color: '#94a3b8', fontSize: 11 }}>—</span>
                              ) : (
                                <span style={{
                                  padding: '3px 8px',
                                  borderRadius: 12,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  background: item.totalProfit >= 0 ? '#dcfce7' : '#fee2e2',
                                  color: item.totalProfit >= 0 ? '#15803d' : '#b91c1c'
                                }}>
                                  {item.totalProfit >= 0 ? '+' : ''}{item.marginPct.toFixed(1)}%
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'center', color: '#64748b' }}>
                              <span style={{ background: '#f8fafc', padding: '2px 8px', borderRadius: 10, fontSize: 11, border: '1px solid #e2e8f0', fontWeight: 600 }}>
                                {item.salesCount} txn{item.salesCount !== 1 ? 's' : ''}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                              <button
                                type="button"
                                onClick={() => toggleExpandSoldProduct(item.id)}
                                style={{
                                  background: isExp ? '#4f46e5' : '#f1f5f9',
                                  color: isExp ? '#fff' : '#475569',
                                  border: 'none',
                                  borderRadius: 6,
                                  padding: '5px 10px',
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  transition: 'all 0.15s'
                                }}
                              >
                                <span>Receipts</span>
                                <span>{isExp ? '▲' : '▼'}</span>
                              </button>
                            </td>
                          </tr>
                          {isExp && (
                            <tr>
                              <td colSpan={12} style={{ padding: '12px 18px', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                  <div style={{ padding: '10px 16px', background: '#f1f5f9', fontSize: 12, fontWeight: 700, color: '#334155', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>🧾 All Sales Containing "{item.name}"</span>
                                    <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>{item.salesHistory.length} orders recorded</span>
                                  </div>
                                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                    <thead>
                                      <tr style={{ background: '#f8fafc', color: '#64748b' }}>
                                        <th style={{ padding: '7px 14px', textAlign: 'left' }}>Date</th>
                                        <th style={{ padding: '7px 14px', textAlign: 'left' }}>Invoice #</th>
                                        <th style={{ padding: '7px 14px', textAlign: 'left' }}>Customer</th>
                                        <th style={{ padding: '7px 14px', textAlign: 'left' }}>Cashier</th>
                                        <th style={{ padding: '7px 14px', textAlign: 'right' }}>Qty Sold</th>
                                        <th style={{ padding: '7px 14px', textAlign: 'right' }}>Unit Price</th>
                                        <th style={{ padding: '7px 14px', textAlign: 'right' }}>Line Subtotal</th>
                                        <th style={{ padding: '7px 14px', textAlign: 'right' }}>Line Profit</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {item.salesHistory.map((h, hi) => (
                                        <tr key={hi} style={{ borderTop: '1px solid #f1f5f9' }}>
                                          <td style={{ padding: '7px 14px', color: '#475569' }}>{new Date(h.date).toLocaleDateString()}</td>
                                          <td style={{ padding: '7px 14px', fontWeight: 600, color: '#4f46e5' }}>#{h.saleId}</td>
                                          <td style={{ padding: '7px 14px', color: '#334155' }}>{h.customer}</td>
                                          <td style={{ padding: '7px 14px', color: '#64748b' }}>{h.cashier}</td>
                                          <td style={{ padding: '7px 14px', textAlign: 'right', fontWeight: 600 }}>{h.quantity} {item.unit}</td>
                                          <td style={{ padding: '7px 14px', textAlign: 'right' }}>UGX {Math.round(h.unitPrice).toLocaleString()}</td>
                                          <td style={{ padding: '7px 14px', textAlign: 'right', fontWeight: 700 }}>UGX {Math.round(h.subtotal).toLocaleString()}</td>
                                          <td style={{ padding: '7px 14px', textAlign: 'right', color: h.profit === null ? '#b91c1c' : h.profit >= 0 ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
                                            {h.profit === null
                                              ? 'Unavailable'
                                              : `UGX ${Math.round(h.profit).toLocaleString()}${h.cost_status === 'estimated' ? ' (Est.)' : ''}`}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
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
              <ReportExportBar
                title={`Daily Sales Report (${reportData.date})`}
                onExportPdf={() => handleExport('reports/sales/export', { report_type: 'daily', date: dailyDate }, `sales_daily_${dailyDate}`, 'pdf')}
                onExportWord={() => handleExport('reports/sales/export', { report_type: 'daily', date: dailyDate }, `sales_daily_${dailyDate}`, 'docx')}
                isPdfLoading={exportingKey === 'reports/sales/export_pdf'}
                isWordLoading={exportingKey === 'reports/sales/export_docx'}
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                {[
                  { label: 'Date', value: reportData.date },
                  { label: 'Transactions', value: reportData.total_transactions },
                  { label: 'Total Sales', value: `UGX ${parseFloat(reportData.total_sales || 0).toLocaleString()}` },
                  {
                    label: 'Total Cost',
                    value: reportData.total_cost === null || reportData.cost_status === 'unavailable'
                      ? 'Unavailable'
                      : `UGX ${parseFloat(reportData.total_cost || 0).toLocaleString()}${reportData.cost_status === 'estimated' ? ' (Est.)' : ''}`,
                  },
                ].map(k => (
                  <div key={k.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px' }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{k.label}</p>
                    <p style={{ margin: '8px 0 0', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{k.value}</p>
                  </div>
                ))}
              </div>
              {/* Profit highlight */}
              <div style={{ background: reportData.total_profit === null ? '#fef2f2' : parseFloat(reportData.total_profit || 0) >= 0 ? '#f0fdf4' : '#fef2f2', border: `1px solid ${reportData.total_profit !== null && parseFloat(reportData.total_profit || 0) >= 0 ? '#bbf7d0' : '#fecaca'}`, borderRadius: 12, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: 32 }}>{reportData.total_profit === null ? '⚠️' : parseFloat(reportData.total_profit || 0) >= 0 ? '📈' : '📉'}</div>
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Gross Profit</p>
                  <p style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 800, color: reportData.total_profit === null ? '#b91c1c' : parseFloat(reportData.total_profit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                    {reportData.total_profit === null || reportData.cost_status === 'unavailable'
                      ? 'Cost Unavailable'
                      : `UGX ${parseFloat(reportData.total_profit || 0).toLocaleString()}${reportData.cost_status === 'estimated' ? ' (Est.)' : ''}`}
                  </p>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Margin</p>
                  <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 700, color: '#374151' }}>
                    {reportData.total_profit !== null && parseFloat(reportData.total_sales) > 0
                      ? `${((parseFloat(reportData.total_profit) / parseFloat(reportData.total_sales)) * 100).toFixed(1)}%`
                      : '—'}
                  </p>
                </div>
              </div>
              {renderSalesTransactionsSection(reportData.sales, 'Daily Sales', `daily_sales_${reportData.date}`, false)}
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
              <ReportExportBar
                title={`Weekly Sales Report (${reportData.week_start} to ${reportData.week_end})`}
                onExportPdf={() => handleExport('reports/sales/export', { report_type: 'weekly', date: weeklyDate }, `sales_weekly_${weeklyDate}`, 'pdf')}
                onExportWord={() => handleExport('reports/sales/export', { report_type: 'weekly', date: weeklyDate }, `sales_weekly_${weeklyDate}`, 'docx')}
                isPdfLoading={exportingKey === 'reports/sales/export_pdf'}
                isWordLoading={exportingKey === 'reports/sales/export_docx'}
              />
              {/* KPI cards */}
              <div className="reports-kpi-grid">
                {[
                  { label: 'Week Start', value: reportData.week_start },
                  { label: 'Week End', value: reportData.week_end },
                  { label: 'Transactions', value: reportData.total_transactions },
                  { label: 'Total Sales', value: `UGX ${parseFloat(reportData.total_sales || 0).toLocaleString()}` },
                ].map(k => (
                  <div key={k.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px' }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{k.label}</p>
                    <p style={{ margin: '8px 0 0', fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{k.value}</p>
                  </div>
                ))}
              </div>

              {/* Profit highlight */}
              <div style={{ background: reportData.total_profit === null ? '#fef2f2' : parseFloat(reportData.total_profit || 0) >= 0 ? '#f0fdf4' : '#fef2f2', border: `1px solid ${reportData.total_profit !== null && parseFloat(reportData.total_profit || 0) >= 0 ? '#bbf7d0' : '#fecaca'}`, borderRadius: 12, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: 32 }}>{reportData.total_profit === null ? '⚠️' : parseFloat(reportData.total_profit || 0) >= 0 ? '📈' : '📉'}</div>
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Gross Profit</p>
                  <p style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 800, color: reportData.total_profit === null ? '#b91c1c' : parseFloat(reportData.total_profit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                    {reportData.total_profit === null || reportData.cost_status === 'unavailable'
                      ? 'Cost Unavailable'
                      : `UGX ${parseFloat(reportData.total_profit || 0).toLocaleString()}${reportData.cost_status === 'estimated' ? ' (Est.)' : ''}`}
                  </p>
                </div>
                <div style={{ marginLeft: 16 }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Total Cost</p>
                  <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 700, color: '#374151' }}>
                    {reportData.total_cost === null || reportData.cost_status === 'unavailable'
                      ? 'Unavailable'
                      : `UGX ${parseFloat(reportData.total_cost || 0).toLocaleString()}${reportData.cost_status === 'estimated' ? ' (Est.)' : ''}`}
                  </p>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Margin</p>
                  <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 700, color: '#374151' }}>
                    {reportData.total_profit !== null && parseFloat(reportData.total_sales) > 0
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
                              <span style={{ color: d.profit === null ? '#b91c1c' : parseFloat(d.profit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                                profit: {d.profit === null ? 'Unavailable' : `UGX ${parseFloat(d.profit || 0).toLocaleString()}`}
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

              {renderSalesTransactionsSection(reportData.sales, 'Weekly Sales', `weekly_sales_${reportData.week_start}_to_${reportData.week_end}`, true)}
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
              <ReportExportBar
                title={`Monthly Sales Report (${reportData.month})`}
                onExportPdf={() => handleExport('reports/sales/export', { report_type: 'monthly', month: monthlyMonth }, `sales_monthly_${monthlyMonth}`, 'pdf')}
                onExportWord={() => handleExport('reports/sales/export', { report_type: 'monthly', month: monthlyMonth }, `sales_monthly_${monthlyMonth}`, 'docx')}
                isPdfLoading={exportingKey === 'reports/sales/export_pdf'}
                isWordLoading={exportingKey === 'reports/sales/export_docx'}
              />
              {/* KPI cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {[
                  { label: 'Month', value: reportData.month },
                  { label: 'Transactions', value: reportData.total_transactions },
                  { label: 'Total Sales', value: `UGX ${parseFloat(reportData.total_sales || 0).toLocaleString()}` },
                ].map(k => (
                  <div key={k.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px' }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{k.label}</p>
                    <p style={{ margin: '8px 0 0', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{k.value}</p>
                  </div>
                ))}
              </div>

              {/* Profit highlight */}
              <div style={{ background: reportData.total_profit === null ? '#fef2f2' : parseFloat(reportData.total_profit || 0) >= 0 ? '#f0fdf4' : '#fef2f2', border: `1px solid ${reportData.total_profit !== null && parseFloat(reportData.total_profit || 0) >= 0 ? '#bbf7d0' : '#fecaca'}`, borderRadius: 12, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: 32 }}>{reportData.total_profit === null ? '⚠️' : parseFloat(reportData.total_profit || 0) >= 0 ? '📈' : '📉'}</div>
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Gross Profit</p>
                  <p style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 800, color: reportData.total_profit === null ? '#b91c1c' : parseFloat(reportData.total_profit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                    {reportData.total_profit === null || reportData.cost_status === 'unavailable'
                      ? 'Cost Unavailable'
                      : `UGX ${parseFloat(reportData.total_profit || 0).toLocaleString()}${reportData.cost_status === 'estimated' ? ' (Est.)' : ''}`}
                  </p>
                </div>
                <div style={{ marginLeft: 16 }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Total Cost</p>
                  <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 700, color: '#374151' }}>
                    {reportData.total_cost === null || reportData.cost_status === 'unavailable'
                      ? 'Unavailable'
                      : `UGX ${parseFloat(reportData.total_cost || 0).toLocaleString()}${reportData.cost_status === 'estimated' ? ' (Est.)' : ''}`}
                  </p>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Margin</p>
                  <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 700, color: '#374151' }}>
                    {reportData.total_profit !== null && parseFloat(reportData.total_sales) > 0
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
                                <span style={{ color: p.profit === null ? '#b91c1c' : parseFloat(p.profit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                                  profit: {p.profit === null ? 'Unavailable' : `UGX ${parseFloat(p.profit || 0).toLocaleString()}`}
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
                                <span style={{ color: d.profit === null ? '#b91c1c' : parseFloat(d.profit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                                  {d.profit === null ? 'Unavailable' : `UGX ${parseFloat(d.profit || 0).toLocaleString()}`}
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

              {renderSalesTransactionsSection(reportData.sales, 'Monthly Sales', `monthly_sales_${reportData.month}`, true)}
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
              <ReportExportBar
                title={`Yearly Sales Report (${reportData.year})`}
                onExportPdf={() => handleExport('reports/sales/export', { report_type: 'yearly', year: parseInt(yearlyYear, 10) }, `sales_yearly_${yearlyYear}`, 'pdf')}
                onExportWord={() => handleExport('reports/sales/export', { report_type: 'yearly', year: parseInt(yearlyYear, 10) }, `sales_yearly_${yearlyYear}`, 'docx')}
                isPdfLoading={exportingKey === 'reports/sales/export_pdf'}
                isWordLoading={exportingKey === 'reports/sales/export_docx'}
              />

              {/* ── KPI row ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                {[
                  { label: 'Year', value: reportData.year, icon: '📅', color: '#4f46e5', bg: '#eef2ff' },
                  { label: 'Transactions', value: reportData.total_transactions, icon: '🧾', color: '#0891b2', bg: '#ecfeff' },
                  { label: 'Total Revenue', value: `UGX ${parseFloat(reportData.total_sales || 0).toLocaleString()}`, icon: '💰', color: '#16a34a', bg: '#f0fdf4' },
                  {
                    label: 'Total Cost',
                    value: reportData.total_cost === null || reportData.cost_status === 'unavailable'
                      ? 'Unavailable'
                      : `UGX ${parseFloat(reportData.total_cost || 0).toLocaleString()}${reportData.cost_status === 'estimated' ? ' (Est.)' : ''}`,
                    icon: '🛒', color: '#d97706', bg: '#fffbeb',
                  },
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
              <div style={{ background: reportData.total_profit === null ? '#fef2f2' : parseFloat(reportData.total_profit || 0) >= 0 ? '#f0fdf4' : '#fef2f2', border: `1px solid ${reportData.total_profit !== null && parseFloat(reportData.total_profit || 0) >= 0 ? '#bbf7d0' : '#fecaca'}`, borderRadius: 12, padding: '20px 26px', display: 'flex', alignItems: 'center', gap: 18 }}>
                <div style={{ fontSize: 36 }}>{reportData.total_profit === null ? '⚠️' : parseFloat(reportData.total_profit || 0) >= 0 ? '📈' : '📉'}</div>
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Annual Gross Profit</p>
                  <p style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 800, color: reportData.total_profit === null ? '#b91c1c' : parseFloat(reportData.total_profit || 0) >= 0 ? '#16a34a' : '#dc2626', letterSpacing: '-0.5px' }}>
                    {reportData.total_profit === null || reportData.cost_status === 'unavailable'
                      ? 'Cost Unavailable'
                      : `UGX ${parseFloat(reportData.total_profit || 0).toLocaleString()}${reportData.cost_status === 'estimated' ? ' (Est.)' : ''}`}
                  </p>
                </div>
                <div style={{ marginLeft: 20 }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Profit Margin</p>
                  <p style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 700, color: '#374151' }}>
                    {reportData.total_profit !== null && parseFloat(reportData.total_sales) > 0 ? `${((parseFloat(reportData.total_profit) / parseFloat(reportData.total_sales)) * 100).toFixed(1)}%` : '—'}
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
                        const revPct = Math.round((parseFloat(m.total || 0) / maxTotal) * 100);
                        const profitUnavailable = m.profit === null || m.cost_status === 'unavailable';
                        const profitPct = profitUnavailable ? 0 : Math.round((parseFloat(m.profit || 0) / maxTotal) * 100);
                        const isProfit = !profitUnavailable && parseFloat(m.profit || 0) >= 0;
                        return (
                          <div key={m.month}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#334155', minWidth: 36 }}>{m.month_name}</span>
                              <span style={{ fontSize: 12, color: '#64748b' }}>
                                UGX {parseFloat(m.total || 0).toLocaleString()}
                                &nbsp;·&nbsp;
                                <span style={{ color: profitUnavailable ? '#b91c1c' : isProfit ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                                  {profitUnavailable ? 'Profit Unavailable' : `${isProfit ? '+' : ''}UGX ${parseFloat(m.profit || 0).toLocaleString()}`}
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
                      const pct = Math.round((parseFloat(q.total || 0) / maxQ) * 100);
                      return (
                        <div key={q.quarter} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '16px 14px' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{q.quarter}</div>
                          <div style={{ height: 5, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden', marginBottom: 12 }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: '#4f46e5', borderRadius: 3, transition: 'width 0.4s ease' }} />
                          </div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>UGX {parseFloat(q.total || 0).toLocaleString()}</div>
                          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{q.transactions} transactions</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: q.profit === null ? '#b91c1c' : parseFloat(q.profit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                            Profit: {q.profit === null ? 'Unavailable' : `UGX ${parseFloat(q.profit || 0).toLocaleString()}`}
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
                              <span style={{ color: p.profit === null ? '#b91c1c' : parseFloat(p.profit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                                profit: {p.profit === null ? 'Unavailable' : `UGX ${parseFloat(p.profit || 0).toLocaleString()}`}
                              </span>
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

      {/* ── DAILY PURCHASES REPORT ── */}
      {activeReport === 'daily-purchases' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Date picker + button */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={supS.label}>Select Date</label>
              <input
                type="date"
                value={dailyPurchasesDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={e => { setDailyPurchasesDate(e.target.value); setReportData(null); }}
                style={{ ...supS.input, width: 180 }}
              />
            </div>
            <Button variant="primary" onClick={fetchReport} loading={reportLoading}>Generate Report</Button>
          </div>

          {reportError && (
            <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 }}>
              ⚠️ {reportError}
            </div>
          )}

          {reportData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <ReportExportBar
                title={`Daily Purchases Report (${reportData.date})`}
                onExportPdf={() => handleExport('reports/purchases/export', { report_type: 'daily', date: dailyPurchasesDate }, `purchases_daily_${dailyPurchasesDate}`, 'pdf')}
                onExportWord={() => handleExport('reports/purchases/export', { report_type: 'daily', date: dailyPurchasesDate }, `purchases_daily_${dailyPurchasesDate}`, 'docx')}
                isPdfLoading={exportingKey === 'reports/purchases/export_pdf'}
                isWordLoading={exportingKey === 'reports/purchases/export_docx'}
              />

              {/* KPI row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {[
                  { label: 'Date', value: new Date(reportData.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }), icon: '📅', color: '#4f46e5', bg: '#eef2ff' },
                  { label: 'Transactions', value: reportData.total_transactions, icon: '🧾', color: '#0891b2', bg: '#ecfeff' },
                  { label: 'Total Spent', value: `UGX ${parseFloat(reportData.total_amount || 0).toLocaleString()}`, icon: '💸', color: '#dc2626', bg: '#fef2f2' },
                ].map(k => (
                  <div key={k.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{k.icon}</div>
                    <div>
                      <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.label}</p>
                      <p style={{ margin: '4px 0 0', fontSize: k.label === 'Date' ? 13 : 20, fontWeight: 700, color: k.color }}>{k.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* No purchases message */}
              {reportData.total_transactions === 0 && (
                <div style={{ padding: '32px', textAlign: 'center', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: 32, margin: '0 0 8px' }}>🛒</p>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#334155' }}>No purchases on this day</p>
                  <p style={{ margin: '6px 0 0', fontSize: 13, color: '#94a3b8' }}>Try selecting a different date.</p>
                </div>
              )}

              {reportData.total_transactions > 0 && (
                <>
                  {/* Supplier breakdown */}
                  {reportData.by_supplier && reportData.by_supplier.length > 0 && (
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24 }}>
                      <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Spend by Supplier</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {(() => {
                          const maxSpend = Math.max(...reportData.by_supplier.map(s => parseFloat(s.total_amount || 0)), 1);
                          return reportData.by_supplier.map(s => (
                            <div key={s.supplier}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{s.supplier}</span>
                                <span style={{ fontSize: 13, color: '#64748b' }}>
                                  {s.transactions} order{s.transactions !== 1 ? 's' : ''}
                                  &nbsp;·&nbsp;
                                  <strong style={{ color: '#0f172a' }}>UGX {parseFloat(s.total_amount || 0).toLocaleString()}</strong>
                                </span>
                              </div>
                              <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${(parseFloat(s.total_amount || 0) / maxSpend) * 100}%`, background: '#4f46e5', borderRadius: 4, transition: 'width 0.4s ease' }} />
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Detailed purchases table */}
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Purchase Details</h3>
                      <span style={{ fontSize: 12, color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 20, padding: '3px 10px' }}>
                        {reportData.total_transactions} order{reportData.total_transactions !== 1 ? 's' : ''} · {reportData.total_items} item{reportData.total_items !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {(reportData.purchases || []).map((purchase, pi) => (
                      <div key={purchase.id} style={{ borderBottom: pi < reportData.purchases.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                        {/* Purchase header */}
                        <div style={{ padding: '14px 24px', background: '#fafbff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ width: 28, height: 28, borderRadius: 8, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#4f46e5', flexShrink: 0 }}>
                              #{pi + 1}
                            </span>
                            <div>
                              <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                                {purchase.supplier?.name || 'Unknown Supplier'}
                              </span>
                              <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 8 }}>
                                Order #{purchase.id}
                              </span>
                            </div>
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#4f46e5' }}>
                            UGX {parseFloat(purchase.total_amount || 0).toLocaleString()}
                          </span>
                        </div>

                        {/* Line items */}
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ background: '#f8fafc' }}>
                              {['Product', 'Qty', 'Unit Cost', 'Subtotal'].map(h => (
                                <th key={h} style={{ padding: '8px 24px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(purchase.purchase_items || []).map((item, idx) => (
                              <tr key={idx} style={{ borderTop: '1px solid #f8fafc' }}>
                                <td style={{ padding: '10px 24px', fontSize: 13, color: '#0f172a', fontWeight: 500 }}>
                                  {item.product?.name || `Product #${item.product_id}`}
                                  {item.product?.sku && <span style={{ marginLeft: 6, fontSize: 11, color: '#94a3b8' }}>({item.product.sku})</span>}
                                </td>
                                <td style={{ padding: '10px 24px', fontSize: 13, color: '#475569' }}>{item.quantity}</td>
                                <td style={{ padding: '10px 24px', fontSize: 13, color: '#475569' }}>UGX {parseFloat(item.cost_price || 0).toLocaleString()}</td>
                                <td style={{ padding: '10px 24px', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                                  UGX {(item.quantity * parseFloat(item.cost_price || 0)).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}

                    {/* Grand total footer */}
                    <div style={{ padding: '16px 24px', background: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>TOTAL SPENT ON {new Date(reportData.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}</span>
                      <span style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc' }}>UGX {parseFloat(reportData.total_amount || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── SAVED / AUTOMATED REPORTS ── */}
      {activeReport === 'saved-reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: '16px 20px',
            flexWrap: 'wrap',
            gap: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Saved &amp; Automated Reports</h3>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                System-generated periodic reports archive. Download any report as PDF or Microsoft Word (.docx).
              </p>
            </div>
            <button
              type="button"
              onClick={fetchSavedReports}
              disabled={savedLoading}
              style={{
                padding: '8px 16px',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                color: '#334155',
                cursor: savedLoading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              {savedLoading ? '🔄 Loading...' : '🔄 Refresh'}
            </button>
          </div>

          {savedError && (
            <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 }}>
              ⚠️ {savedError}
            </div>
          )}

          {savedLoading && (
            <div style={{ padding: '40px', textAlign: 'center', background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>Loading saved reports...</p>
            </div>
          )}

          {!savedLoading && savedReports.length === 0 && (
            <div style={{ padding: '48px 24px', textAlign: 'center', background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📁</div>
              <h4 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>No Saved Reports Yet</h4>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b', maxWidth: 480, marginInline: 'auto', lineHeight: 1.5 }}>
                Automated periodic reports (daily, weekly, monthly) will appear here once generated by the scheduled background task. You can also generate and export reports on-demand directly using the other tabs above.
              </p>
            </div>
          )}

          {!savedLoading && savedReports.length > 0 && (
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Report ID</th>
                    <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Type</th>
                    <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Generated Date</th>
                    <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Export Document</th>
                  </tr>
                </thead>
                <tbody>
                  {savedReports.map(report => {
                    const isPdfLoading = exportingKey === `saved_${report.id}_pdf`;
                    const isWordLoading = exportingKey === `saved_${report.id}_docx`;
                    return (
                      <tr key={report.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                          #{report.id}
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: 14, color: '#334155' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '4px 10px',
                            borderRadius: 6,
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            fontSize: 12,
                            fontWeight: 600
                          }}>
                            📄 {formatReportTypeName(report.report_type)}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: 13, color: '#64748b' }}>
                          {new Date(report.generated_at).toLocaleString()}
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => handleDownloadSaved(report.id, 'pdf', report.report_type)}
                              disabled={isPdfLoading}
                              style={{
                                padding: '6px 14px',
                                background: isPdfLoading ? '#94a3b8' : '#dc2626',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: isPdfLoading ? 'not-allowed' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                transition: 'background 0.15s ease'
                              }}
                              onMouseEnter={e => { if (!isPdfLoading) e.currentTarget.style.background = '#b91c1c'; }}
                              onMouseLeave={e => { if (!isPdfLoading) e.currentTarget.style.background = '#dc2626'; }}
                            >
                              {isPdfLoading ? '⏳ PDF...' : '📄 Export PDF'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadSaved(report.id, 'docx', report.report_type)}
                              disabled={isWordLoading}
                              style={{
                                padding: '6px 14px',
                                background: isWordLoading ? '#94a3b8' : '#2563eb',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: isWordLoading ? 'not-allowed' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                transition: 'background 0.15s ease'
                              }}
                              onMouseEnter={e => { if (!isWordLoading) e.currentTarget.style.background = '#1d4ed8'; }}
                              onMouseLeave={e => { if (!isWordLoading) e.currentTarget.style.background = '#2563eb'; }}
                            >
                              {isWordLoading ? '⏳ Word...' : '📝 Export Word'}
                            </button>
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
      )}
    </div>
  );
}

// ── AI Assistant Tab ──────────────────────────────────────────────────────────

export default ReportsTab;
export { ReportsTab };
