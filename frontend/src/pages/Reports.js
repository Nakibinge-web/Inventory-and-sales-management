import React, { useState, useEffect } from 'react';
import Button from '../components/ui/Button';
import styles, { supS } from '../styles/dashboardStyles';


function ReportsTab({ data, loading, token }) {
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

  // ── Automation & Saved Reports State ──────────────────────────────────────
  const [automationType, setAutomationType] = useState('daily_sales');
  const [automationPref, setAutomationPref] = useState(null);
  const [prefLoading, setPrefLoading] = useState(false);
  const [prefSaving, setPrefSaving] = useState(false);
  const [triggeringRun, setTriggeringRun] = useState(false);
  const [automationAlert, setAutomationAlert] = useState(null);

  // Automation Form fields
  const [autoFrequency, setAutoFrequency] = useState('every_5_minutes');
  const [autoIntervalMinutes, setAutoIntervalMinutes] = useState(5);
  const [customMinutesInput, setCustomMinutesInput] = useState('5');
  const [autoTimeOfDay, setAutoTimeOfDay] = useState('18:00');
  const [autoDayOfWeek, setAutoDayOfWeek] = useState('monday');
  const [autoDayOfMonth, setAutoDayOfMonth] = useState(1);
  const [autoIsEnabled, setAutoIsEnabled] = useState(true);
  const [autoDeliveryMethod, setAutoDeliveryMethod] = useState('dashboard');
  const [autoRecipientEmail, setAutoRecipientEmail] = useState('');

  // Live countdown state
  const [countdownSeconds, setCountdownSeconds] = useState(null);
  const [isExecutingDue, setIsExecutingDue] = useState(false);

  // Saved reports in DB
  const [savedReports, setSavedReports] = useState([]);
  const [savedReportsLoading, setSavedReportsLoading] = useState(false);
  const [savedFilterType, setSavedFilterType] = useState('all');
  const [savedFilterDate, setSavedFilterDate] = useState('');

  // Report Preview Modal
  const [viewingReport, setViewingReport] = useState(null);

  const formatCountdown = (sec) => {
    if (sec === null || sec === undefined) return '--:--';
    if (sec <= 0) return '00:00';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m >= 60) {
      const h = Math.floor(m / 60);
      const remM = m % 60;
      return `${h}h ${remM < 10 ? '0' : ''}${remM}m ${s < 10 ? '0' : ''}${s}s`;
    }
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSelectPresetMinutes = (minutes, freqId) => {
    setAutoFrequency(freqId);
    setAutoIntervalMinutes(minutes);
    setCustomMinutesInput(String(minutes));
  };

  const handleCustomMinutesChange = (val) => {
    setCustomMinutesInput(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setAutoFrequency('custom_minutes');
      setAutoIntervalMinutes(parsed);
    }
  };

  const fetchAutomationPreferences = async (type = 'daily_sales') => {
    setPrefLoading(true);
    try {
      const res = await fetch(`${API_URL}/report-preferences`, { headers });
      const json = await res.json();
      if (res.ok && json.data) {
        const pref = (json.data || []).find(p => p.report_type === type);
        if (pref) {
          setAutomationPref(pref);
          setAutoFrequency(pref.frequency || 'every_5_minutes');
          const interval = pref.interval_minutes || 5;
          setAutoIntervalMinutes(interval);
          setCustomMinutesInput(String(interval));
          setAutoTimeOfDay(pref.time_of_day || '18:00');
          setAutoDayOfWeek(pref.day_of_week || 'monday');
          setAutoDayOfMonth(pref.day_of_month || 1);
          setAutoIsEnabled(pref.is_enabled !== false);
          setAutoDeliveryMethod(pref.delivery_method || 'dashboard');
          setAutoRecipientEmail(pref.recipient_email || '');

          if (pref.is_enabled && pref.next_run_at) {
            const diff = Math.max(0, Math.floor((new Date(pref.next_run_at).getTime() - Date.now()) / 1000));
            setCountdownSeconds(diff);
          } else {
            setCountdownSeconds(null);
          }
        } else {
          setAutomationPref(null);
          setAutoFrequency('every_5_minutes');
          setAutoIntervalMinutes(5);
          setCustomMinutesInput('5');
          setAutoTimeOfDay('18:00');
          setAutoDayOfWeek('monday');
          setAutoDayOfMonth(1);
          setAutoIsEnabled(true);
          setAutoDeliveryMethod('dashboard');
          setAutoRecipientEmail('');
          setCountdownSeconds(null);
        }
      }
    } catch {
      // ignore
    } finally {
      setPrefLoading(false);
    }
  };

  // Continuous auto-execution when countdown finishes
  const triggerExecuteDue = async () => {
    if (!automationPref?.id || isExecutingDue) return;
    setIsExecutingDue(true);
    try {
      const res = await fetch(`${API_URL}/report-preferences/${automationPref.id}/execute-due`, {
        method: 'POST',
        headers,
      });
      const json = await res.json();
      if (res.ok && json.success) {
        if (json.preference) {
          setAutomationPref(json.preference);
          if (json.preference.next_run_at) {
            const diff = Math.max(0, Math.floor((new Date(json.preference.next_run_at).getTime() - Date.now()) / 1000));
            setCountdownSeconds(diff);
          }
        }
        fetchSavedReports(automationType);
        setAutomationAlert({
          type: 'success',
          text: `⚡ Automated report #${json.data?.id || ''} compiled & saved to database at ${new Date().toLocaleTimeString()}! Countdown restarted for next report.`,
        });
      }
    } catch (err) {
      console.error('Failed auto-execution:', err);
    } finally {
      setIsExecutingDue(false);
    }
  };

  // Live countdown timer running every second
  useEffect(() => {
    if (!automationPref || !automationPref.is_enabled || !automationPref.next_run_at) {
      setCountdownSeconds(null);
      return;
    }

    const intervalTimer = setInterval(() => {
      const targetTime = new Date(automationPref.next_run_at).getTime();
      const diffSec = Math.floor((targetTime - Date.now()) / 1000);

      if (diffSec <= 0) {
        setCountdownSeconds(0);
        if (!isExecutingDue) {
          triggerExecuteDue();
        }
      } else {
        setCountdownSeconds(diffSec);
      }
    }, 1000);

    return () => clearInterval(intervalTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [automationPref?.next_run_at, automationPref?.is_enabled, isExecutingDue]);

  // Initial load to catch active countdown on start
  useEffect(() => {
    fetchAutomationPreferences('daily_sales');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSavedReports = async (type = 'all', date = '') => {
    setSavedReportsLoading(true);
    try {
      let url = `${API_URL}/generated-reports?limit=100`;
      if (type && type !== 'all') {
        url += `&report_type=${type}`;
      }
      if (date) {
        url += `&date=${date}`;
      }
      const res = await fetch(url, { headers });
      const json = await res.json();
      if (res.ok && json.data) {
        setSavedReports(json.data);
      }
    } catch {
      // ignore
    } finally {
      setSavedReportsLoading(false);
    }
  };

  const openAutomationDetails = (type = 'daily_sales') => {
    setAutomationType(type);
    setActiveReport('automation-details');
    setAutomationAlert(null);
    fetchAutomationPreferences(type);
    fetchSavedReports(type);
  };

  const handleSaveAutomation = async () => {
    setPrefSaving(true);
    setAutomationAlert(null);
    try {
      let finalInterval = autoIntervalMinutes;
      if (autoFrequency === 'custom_minutes') {
        const parsed = parseInt(customMinutesInput, 10);
        finalInterval = !isNaN(parsed) && parsed > 0 ? parsed : 5;
      }

      const payload = {
        report_type: automationType,
        frequency: autoFrequency,
        time_of_day: ['daily', 'weekly', 'monthly'].includes(autoFrequency) ? autoTimeOfDay : null,
        day_of_week: autoFrequency === 'weekly' ? autoDayOfWeek : null,
        day_of_month: autoFrequency === 'monthly' ? parseInt(autoDayOfMonth, 10) : null,
        interval_minutes: ['every_5_minutes', 'every_10_minutes', 'every_15_minutes', 'every_30_minutes', 'hourly', 'every_2_hours', 'every_6_hours', 'custom_minutes'].includes(autoFrequency)
          ? finalInterval
          : null,
        is_enabled: autoIsEnabled,
        delivery_method: autoDeliveryMethod,
        recipient_email: (autoDeliveryMethod === 'email' || autoDeliveryMethod === 'both') ? autoRecipientEmail : null,
      };

      const res = await fetch(`${API_URL}/report-preferences`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setAutomationAlert({ type: 'error', text: json?.message || 'Failed to save automation settings.' });
        return;
      }

      // Immediately overwrite existing preference with new next_run_at countdown
      setAutomationPref(json.data);
      if (json.data?.next_run_at) {
        const diff = Math.max(0, Math.floor((new Date(json.data.next_run_at).getTime() - Date.now()) / 1000));
        setCountdownSeconds(diff);
      }
      setAutomationAlert({
        type: 'success',
        text: `Automation schedule saved! Countdown started for ${finalInterval} minutes. Report will automatically compile and save to database upon completion.`
      });
    } catch {
      setAutomationAlert({ type: 'error', text: 'Network error: could not connect to server.' });
    } finally {
      setPrefSaving(false);
    }
  };

  const handleRunNow = async () => {
    setTriggeringRun(true);
    setAutomationAlert(null);
    try {
      let prefId = automationPref?.id;
      if (!prefId) {
        let finalInterval = autoIntervalMinutes;
        if (autoFrequency === 'custom_minutes') {
          const parsed = parseInt(customMinutesInput, 10);
          finalInterval = !isNaN(parsed) && parsed > 0 ? parsed : 5;
        }

        const payload = {
          report_type: automationType,
          frequency: autoFrequency,
          time_of_day: ['daily', 'weekly', 'monthly'].includes(autoFrequency) ? autoTimeOfDay : null,
          day_of_week: autoFrequency === 'weekly' ? autoDayOfWeek : null,
          day_of_month: autoFrequency === 'monthly' ? parseInt(autoDayOfMonth, 10) : null,
          interval_minutes: ['every_5_minutes', 'every_10_minutes', 'every_15_minutes', 'every_30_minutes', 'hourly', 'every_2_hours', 'every_6_hours', 'custom_minutes'].includes(autoFrequency)
            ? finalInterval
            : null,
          is_enabled: autoIsEnabled,
          delivery_method: autoDeliveryMethod,
          recipient_email: (autoDeliveryMethod === 'email' || autoDeliveryMethod === 'both') ? autoRecipientEmail : null,
        };

        const saveRes = await fetch(`${API_URL}/report-preferences`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const saveJson = await saveRes.json();
        if (saveRes.ok && saveJson.data) {
          prefId = saveJson.data.id;
          setAutomationPref(saveJson.data);
        } else {
          setAutomationAlert({ type: 'error', text: saveJson?.message || 'Could not initialize preference.' });
          setTriggeringRun(false);
          return;
        }
      }

      const res = await fetch(`${API_URL}/report-preferences/${prefId}/run-now`, {
        method: 'POST',
        headers,
      });
      const json = await res.json();
      if (!res.ok) {
        setAutomationAlert({ type: 'error', text: json?.message || 'Failed to generate report.' });
        return;
      }

      setAutomationAlert({ type: 'success', text: 'Report generated and saved to database successfully!' });
      if (json.preference) {
        setAutomationPref(json.preference);
        if (json.preference.next_run_at) {
          const diff = Math.max(0, Math.floor((new Date(json.preference.next_run_at).getTime() - Date.now()) / 1000));
          setCountdownSeconds(diff);
        }
      }
      fetchSavedReports(automationType);
      if (json.data) {
        setViewingReport(json.data);
      }
    } catch {
      setAutomationAlert({ type: 'error', text: 'Could not connect to server.' });
    } finally {
      setTriggeringRun(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this saved report from database?')) return;
    try {
      const res = await fetch(`${API_URL}/generated-reports/${reportId}`, {
        method: 'DELETE',
        headers,
      });
      if (res.ok) {
        setSavedReports(prev => prev.filter(r => r.id !== reportId));
        if (viewingReport && viewingReport.id === reportId) {
          setViewingReport(null);
        }
      } else {
        alert('Failed to delete report.');
      }
    } catch {
      alert('Network error deleting report.');
    }
  };

  useEffect(() => {
    if (activeReport === 'saved-reports') {
      fetchSavedReports(savedFilterType, savedFilterDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeReport, savedFilterType, savedFilterDate]);

  const totalRevenue = data.stats.totalSales - data.stats.totalPurchases;

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
        const value = row[header] || '';
        // Escape commas and quotes
        return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
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
    { id: 'daily', label: 'Daily Sales' },
    { id: 'weekly', label: 'Weekly Sales' },
    { id: 'monthly-sales', label: 'Monthly Sales' },
    { id: 'yearly', label: 'Yearly Report' },
    { id: 'daily-purchases', label: 'Daily Purchases' },
    { id: 'saved-reports', label: '📁 Saved Reports' },
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
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
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
          <div className="reports-kpi-grid">
            {[
              { label: 'Total Revenue', value: `UGX ${data.stats.totalSales.toLocaleString()}`, icon: '💰', color: '#16a34a', bg: '#f0fdf4' },
              { label: 'Total Costs', value: `UGX ${data.stats.totalPurchases.toLocaleString()}`, icon: '🛒', color: '#d97706', bg: '#fffbeb' },
              { label: 'Net Profit', value: `UGX ${totalRevenue.toLocaleString()}`, icon: '📈', color: totalRevenue >= 0 ? '#16a34a' : '#dc2626', bg: totalRevenue >= 0 ? '#f0fdf4' : '#fef2f2' },
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
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={supS.label}>Select Date</label>
              <input style={{ ...supS.input, width: 200 }} type="date" value={dailyDate} onChange={e => setDailyDate(e.target.value)} />
            </div>
            <Button variant="primary" onClick={fetchReport} loading={reportLoading}>Generate Report</Button>

            <button
              type="button"
              onClick={() => openAutomationDetails('daily_sales')}
              style={{
                padding: '9px 18px',
                background: '#ffffff',
                color: '#2563eb',
                border: '1.5px solid #2563eb',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                boxShadow: '0 1px 3px rgba(37,99,235,0.08)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; }}
            >
              ⚙️ Automate daily sales report generation
            </button>

            {automationPref?.is_enabled && countdownSeconds !== null && countdownSeconds > 0 && (
              <div style={{
                padding: '9px 15px',
                borderRadius: 8,
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                color: '#065f46',
                fontSize: 12,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7
              }}>
                <span>⏱️</span>
                <span>Next automated report in: <strong style={{ fontFamily: 'monospace', fontSize: 13, color: '#047857' }}>{formatCountdown(countdownSeconds)}</strong></span>
              </div>
            )}
          </div>

          {reportError && <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 }}>⚠️ {reportError}</div>}

          {reportData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                {[
                  { label: 'Date', value: reportData.date },
                  { label: 'Transactions', value: reportData.total_transactions },
                  { label: 'Total Sales', value: `UGX ${parseFloat(reportData.total_sales || 0).toLocaleString()}` },
                  { label: 'Total Cost', value: `UGX ${parseFloat(reportData.total_cost || 0).toLocaleString()}` },
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
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={supS.label}>Any date within the week</label>
              <input style={{ ...supS.input, width: 200 }} type="date" value={weeklyDate} onChange={e => setWeeklyDate(e.target.value)} />
            </div>
            <Button variant="primary" onClick={fetchReport} loading={reportLoading}>Generate Report</Button>

            <button
              type="button"
              onClick={() => openAutomationDetails('weekly_sales')}
              style={{
                padding: '9px 18px',
                background: '#ffffff',
                color: '#2563eb',
                border: '1.5px solid #2563eb',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                boxShadow: '0 1px 3px rgba(37,99,235,0.08)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; }}
            >
              ⚙️ Automate weekly sales report generation
            </button>
          </div>

          {reportError && <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 }}>⚠️ {reportError}</div>}

          {reportData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={supS.label}>Select Month</label>
              <input style={{ ...supS.input, width: 200 }} type="month" value={monthlyMonth} onChange={e => setMonthlyMonth(e.target.value)} />
            </div>
            <Button variant="primary" onClick={fetchReport} loading={reportLoading}>Generate Report</Button>

            <button
              type="button"
              onClick={() => openAutomationDetails('monthly_sales')}
              style={{
                padding: '9px 18px',
                background: '#ffffff',
                color: '#2563eb',
                border: '1.5px solid #2563eb',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                boxShadow: '0 1px 3px rgba(37,99,235,0.08)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; }}
            >
              ⚙️ Automate monthly sales report generation
            </button>
          </div>

          {reportError && <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 }}>⚠️ {reportError}</div>}

          {reportData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
                  { label: 'Year', value: reportData.year, icon: '📅', color: '#4f46e5', bg: '#eef2ff' },
                  { label: 'Transactions', value: reportData.total_transactions, icon: '🧾', color: '#0891b2', bg: '#ecfeff' },
                  { label: 'Total Revenue', value: `UGX ${parseFloat(reportData.total_sales || 0).toLocaleString()}`, icon: '💰', color: '#16a34a', bg: '#f0fdf4' },
                  { label: 'Total Cost', value: `UGX ${parseFloat(reportData.total_cost || 0).toLocaleString()}`, icon: '🛒', color: '#d97706', bg: '#fffbeb' },
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
                        const revPct = Math.round((parseFloat(m.total || 0) / maxTotal) * 100);
                        const profitPct = Math.round((parseFloat(m.profit || 0) / maxTotal) * 100);
                        const isProfit = parseFloat(m.profit || 0) >= 0;
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
                      const pct = Math.round((parseFloat(q.total || 0) / maxQ) * 100);
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

      {/* ── AUTOMATION DETAILS PAGE ── */}
      {activeReport === 'automation-details' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Top navigation & status header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <button
              type="button"
              onClick={() => {
                if (automationType === 'weekly_sales') setActiveReport('weekly');
                else if (automationType === 'monthly_sales') setActiveReport('monthly-sales');
                else setActiveReport('daily');
                setAutomationAlert(null);
              }}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#334155',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
            >
              ← Back to {automationType === 'weekly_sales' ? 'Weekly Sales' : automationType === 'monthly_sales' ? 'Monthly Sales' : 'Daily Sales'} Report
            </button>

            {/* Status indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {automationPref?.last_sent_at && (
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  Last generated: <strong>{new Date(automationPref.last_sent_at).toLocaleString()}</strong>
                </span>
              )}
              <span
                style={{
                  padding: '5px 14px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  background: autoIsEnabled ? '#ecfdf5' : '#f1f5f9',
                  color: autoIsEnabled ? '#059669' : '#64748b',
                  border: `1px solid ${autoIsEnabled ? '#a7f3d0' : '#e2e8f0'}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: autoIsEnabled ? '#10b981' : '#94a3b8' }} />
                {autoIsEnabled ? 'Schedule Active' : 'Schedule Paused'}
              </span>
            </div>
          </div>

          {/* Hero Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
            borderRadius: 14,
            padding: '24px 28px',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            boxShadow: '0 4px 16px rgba(37,99,235,0.18)'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 24 }}>⚙️</span>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#ffffff' }}>
                  Automate {automationType === 'weekly_sales' ? 'Weekly' : automationType === 'monthly_sales' ? 'Monthly' : 'Daily'} Sales Report Generation
                </h2>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: '#dbeafe', maxWidth: 680, lineHeight: 1.5 }}>
                Configure your preferred schedule and interval. Reports are automatically compiled in the background, saved directly into your database, and can be previewed or exported anytime from this Reports module.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={handleRunNow}
                disabled={triggeringRun}
                style={{
                  background: '#ffffff',
                  color: '#1d4ed8',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 18px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: triggeringRun ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                  transition: 'transform 0.1s ease',
                }}
              >
                {triggeringRun ? '⏳ Generating Report...' : '⚡ Generate & Save Report Now'}
              </button>
            </div>
          </div>

          {/* Feedback banner */}
          {automationAlert && (
            <div style={{
              padding: '12px 18px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: automationAlert.type === 'success' ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${automationAlert.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
              color: automationAlert.type === 'success' ? '#15803d' : '#b91c1c',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{automationAlert.type === 'success' ? '✅' : '⚠️'}</span>
                <span>{automationAlert.text}</span>
              </div>
              <button
                onClick={() => setAutomationAlert(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700 }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Live Continuous Countdown Banner */}
          {autoIsEnabled && countdownSeconds !== null && (
            <div style={{
              background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
              borderRadius: 14,
              padding: '20px 24px',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
              boxShadow: '0 4px 14px rgba(4, 120, 87, 0.25)',
              border: '1.5px solid #10b981'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 26,
                  flexShrink: 0
                }}>
                  ⏱️
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, color: '#a7f3d0' }}>
                      Continuous Automated Generation Active
                    </span>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                  </div>
                  <div style={{ fontSize: 14, color: '#f0fdf4', marginTop: 4, fontWeight: 500 }}>
                    Auto-generating every <strong>{autoIntervalMinutes} minute{autoIntervalMinutes !== 1 ? 's' : ''}</strong> for your tenant. Upon countdown completion, the report is saved to the database and the countdown loops automatically.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: '#a7f3d0', textTransform: 'uppercase', fontWeight: 700 }}>
                    Next Report In
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 900, fontFamily: 'monospace', color: '#ffffff', letterSpacing: '1px' }}>
                    {formatCountdown(countdownSeconds)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={triggerExecuteDue}
                  disabled={isExecutingDue}
                  style={{
                    background: '#ffffff',
                    color: '#065f46',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 16px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: isExecutingDue ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                  }}
                >
                  {isExecutingDue ? '⏳ Compiling...' : '⚡ Generate Now'}
                </button>
              </div>
            </div>
          )}

          {/* Configuration Form Grid */}
          {prefLoading ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#64748b', fontSize: 14, background: '#ffffff', borderRadius: 14, border: '1px solid #e2e8f0' }}>
              Loading automation configuration...
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 20
            }}>
              {/* ── CARD 1: Schedule & Timing ── */}
              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 14,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}>
                <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 14 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                    1. Generation Time Frame & Frequency
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                    Choose how often your automated reports should generate or enter custom minutes.
                  </p>
                </div>

                {/* Quick Minute Presets */}
                <div>
                  <label style={supS.label}>Quick Minute Options</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginTop: 6 }}>
                    {[
                      { id: 'every_5_minutes', mins: 5, title: 'Every 5 Minutes', desc: 'Real-time tracking', tag: 'Fast' },
                      { id: 'every_10_minutes', mins: 10, title: 'Every 10 Minutes', desc: 'Frequent snapshots', tag: 'Fast' },
                      { id: 'every_15_minutes', mins: 15, title: 'Every 15 Minutes', desc: 'Quarter-hour sync', tag: 'Fast' },
                      { id: 'every_30_minutes', mins: 30, title: 'Every 30 Minutes', desc: 'Half-hour snapshot', tag: 'Fast' },
                      { id: 'hourly', mins: 60, title: 'Every 1 Hour', desc: 'Hourly sales summary', tag: 'Hourly' },
                      { id: 'every_2_hours', mins: 120, title: 'Every 2 Hours', desc: '2-hour batch update', tag: 'Sub-day' },
                    ].map(opt => {
                      const isSelected = autoFrequency === opt.id || (autoFrequency === 'custom_minutes' && autoIntervalMinutes === opt.mins);
                      return (
                        <div
                          key={opt.id}
                          onClick={() => handleSelectPresetMinutes(opt.mins, opt.id)}
                          style={{
                            border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                            background: isSelected ? '#eff6ff' : '#ffffff',
                            borderRadius: 10,
                            padding: '12px 14px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            position: 'relative',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: isSelected ? '#1d4ed8' : '#0f172a' }}>
                              {opt.title}
                            </span>
                            <span style={{
                              fontSize: 10,
                              fontWeight: 600,
                              padding: '2px 6px',
                              borderRadius: 12,
                              background: isSelected ? '#dbeafe' : '#f1f5f9',
                              color: isSelected ? '#1e40af' : '#64748b',
                            }}>
                              {opt.tag}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: 11, color: '#64748b', lineHeight: 1.3 }}>
                            {opt.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Minutes Input */}
                <div style={{
                  padding: '16px 18px',
                  background: autoFrequency === 'custom_minutes' ? '#eff6ff' : '#f8fafc',
                  border: autoFrequency === 'custom_minutes' ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                  borderRadius: 10,
                  transition: 'all 0.15s ease'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ ...supS.label, marginBottom: 0, color: autoFrequency === 'custom_minutes' ? '#1d4ed8' : '#374151' }}>
                      ⏱️ Or Enter Custom Minutes
                    </label>
                    {autoFrequency === 'custom_minutes' && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', background: '#dbeafe', padding: '2px 8px', borderRadius: 10 }}>
                        Custom Minutes Active
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                    <input
                      type="number"
                      min="1"
                      max="10080"
                      placeholder="e.g. 7"
                      value={customMinutesInput}
                      onChange={e => handleCustomMinutesChange(e.target.value)}
                      onFocus={() => {
                        setAutoFrequency('custom_minutes');
                        const parsed = parseInt(customMinutesInput, 10);
                        if (!isNaN(parsed) && parsed > 0) setAutoIntervalMinutes(parsed);
                      }}
                      style={{ ...supS.input, width: 140, background: '#ffffff', fontWeight: 800, fontSize: 16, color: '#0f172a' }}
                    />
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#334155' }}>minutes per report</span>
                  </div>
                  <p style={{ margin: '8px 0 0', fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>
                    Type any minute interval (e.g. 1, 2, 5, 7, 12, 45). The system will continuously generate and archive your report every {customMinutesInput || autoIntervalMinutes} minutes.
                  </p>
                </div>

                {/* Calendar Schedules */}
                <div>
                  <label style={supS.label}>Or Choose Calendar Schedule</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 6 }}>
                    {[
                      { id: 'daily', title: 'Daily', desc: 'At specific time of day' },
                      { id: 'weekly', title: 'Weekly', desc: 'Day of week & time' },
                      { id: 'monthly', title: 'Monthly', desc: 'Day of month & time' },
                    ].map(opt => {
                      const isSelected = autoFrequency === opt.id;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => setAutoFrequency(opt.id)}
                          style={{
                            border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                            background: isSelected ? '#eff6ff' : '#ffffff',
                            borderRadius: 10,
                            padding: '12px 14px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ fontSize: 13, fontWeight: 700, color: isSelected ? '#1d4ed8' : '#0f172a' }}>
                            {opt.title}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                            {opt.desc}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Conditional Timing Details */}
                {['daily', 'weekly', 'monthly'].includes(autoFrequency) && (
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                      ⏰ Day and Time Settings
                    </h4>

                    {autoFrequency === 'weekly' && (
                      <div>
                        <label style={supS.label}>Day of the Week</label>
                        <select
                          value={autoDayOfWeek}
                          onChange={e => setAutoDayOfWeek(e.target.value)}
                          style={{ ...supS.input, background: '#ffffff', cursor: 'pointer' }}
                        >
                          <option value="monday">Every Monday</option>
                          <option value="tuesday">Every Tuesday</option>
                          <option value="wednesday">Every Wednesday</option>
                          <option value="thursday">Every Thursday</option>
                          <option value="friday">Every Friday</option>
                          <option value="saturday">Every Saturday</option>
                          <option value="sunday">Every Sunday</option>
                        </select>
                      </div>
                    )}

                    {autoFrequency === 'monthly' && (
                      <div>
                        <label style={supS.label}>Day of the Month</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <select
                            value={autoDayOfMonth}
                            onChange={e => setAutoDayOfMonth(Number(e.target.value))}
                            style={{ ...supS.input, background: '#ffffff', cursor: 'pointer', maxWidth: 200 }}
                          >
                            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                              <option key={day} value={day}>Day {day} of the month</option>
                            ))}
                          </select>
                          <span style={{ fontSize: 12, color: '#64748b' }}>e.g. 1st or end of month</span>
                        </div>
                      </div>
                    )}

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <label style={{ ...supS.label, marginBottom: 0 }}>Time of Day</label>
                        <span style={{ fontSize: 11, color: '#64748b' }}>24-hour format</span>
                      </div>
                      <input
                        type="time"
                        value={autoTimeOfDay}
                        onChange={e => setAutoTimeOfDay(e.target.value)}
                        style={{ ...supS.input, background: '#ffffff', maxWidth: 200 }}
                      />
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                        {[
                          { label: 'Morning (08:00)', val: '08:00' },
                          { label: 'Lunch (13:00)', val: '13:00' },
                          { label: 'Close of Day (18:00)', val: '18:00' },
                          { label: 'Night (21:00)', val: '21:00' },
                          { label: 'Midnight (23:59)', val: '23:59' },
                        ].map(p => (
                          <button
                            key={p.val}
                            type="button"
                            onClick={() => setAutoTimeOfDay(p.val)}
                            style={{
                              border: '1px solid #cbd5e1',
                              borderRadius: 6,
                              background: autoTimeOfDay === p.val ? '#e0e7ff' : '#ffffff',
                              color: autoTimeOfDay === p.val ? '#3730a3' : '#475569',
                              fontSize: 11,
                              fontWeight: 600,
                              padding: '4px 8px',
                              cursor: 'pointer',
                            }}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-day Interval explanation */}
                {!['daily', 'weekly', 'monthly'].includes(autoFrequency) && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 14 }}>
                    <p style={{ margin: 0, fontSize: 13, color: '#166534', lineHeight: 1.4 }}>
                      ⚡ <strong>Continuous Automation:</strong> A report will automatically compile and save to the database 
                      <strong> every {customMinutesInput || autoIntervalMinutes} minutes</strong> containing the current day's up-to-the-minute sales.
                    </p>
                  </div>
                )}
              </div>

              {/* ── CARD 2: Storage & Notifications ── */}
              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 14,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}>
                <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 14 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                    2. Database Storage & Notifications
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                    Reports are saved in the database and optionally sent to email.
                  </p>
                </div>

                {/* Database Storage: Guaranteed */}
                <div style={{
                  border: '1.5px solid #22c55e',
                  background: '#f0fdf4',
                  borderRadius: 10,
                  padding: 16,
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                }}>
                  <span style={{ fontSize: 24 }}>💾</span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <strong style={{ fontSize: 14, color: '#14532d' }}>Save in Database for In-App Preview</strong>
                      <span style={{
                        background: '#22c55e', color: '#ffffff', fontSize: 10, fontWeight: 700,
                        padding: '1px 7px', borderRadius: 10, textTransform: 'uppercase'
                      }}>
                        Always Enabled
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: '#166534', lineHeight: 1.4 }}>
                      Whenever a report is generated, it is automatically archived in the database. You and your staff can preview, review financial metrics, print as PDF, or export as CSV anytime.
                    </p>
                  </div>
                </div>

                {/* Email delivery options */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 16 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 12 }}>
                    <input
                      type="checkbox"
                      checked={autoDeliveryMethod === 'both' || autoDeliveryMethod === 'email'}
                      onChange={e => setAutoDeliveryMethod(e.target.checked ? 'both' : 'dashboard')}
                      style={{ width: 17, height: 17, cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                      Also send an email summary when generated
                    </span>
                  </label>

                  {(autoDeliveryMethod === 'both' || autoDeliveryMethod === 'email') && (
                    <div>
                      <label style={supS.label}>Recipient Email Address</label>
                      <input
                        type="email"
                        placeholder="e.g. manager@example.com"
                        value={autoRecipientEmail}
                        onChange={e => setAutoRecipientEmail(e.target.value)}
                        style={{ ...supS.input, background: '#ffffff' }}
                      />
                    </div>
                  )}
                </div>

                {/* Active Toggle */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div>
                    <strong style={{ fontSize: 14, color: '#0f172a', display: 'block' }}>
                      Enable Automated Generation Schedule
                    </strong>
                    <span style={{ fontSize: 12, color: '#64748b' }}>
                      {autoIsEnabled ? 'Active: The system will generate reports according to your schedule.' : 'Paused: No automatic reports will run until resumed.'}
                    </span>
                  </div>

                  <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={autoIsEnabled}
                      onChange={e => setAutoIsEnabled(e.target.checked)}
                      style={{ width: 20, height: 20, cursor: 'pointer' }}
                    />
                  </label>
                </div>

                {/* Save Button */}
                <div style={{ display: 'flex', gap: 12, marginTop: 'auto' }}>
                  <Button
                    variant="primary"
                    onClick={handleSaveAutomation}
                    loading={prefSaving}
                    style={{ flex: 1, padding: '12px 18px', fontSize: 14, fontWeight: 700 }}
                  >
                    💾 Save Automation Settings
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ── CARD 3: Saved Reports for this Automation ── */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 14,
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                  Saved Reports in Database ({savedReports.length})
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                  Generated reports saved in the database for this automation.
                </p>
              </div>

              <button
                onClick={() => fetchSavedReports(automationType)}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#475569',
                  cursor: 'pointer',
                }}
              >
                🔄 Refresh
              </button>
            </div>

            {savedReportsLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: 14 }}>
                Loading saved reports from database...
              </div>
            ) : savedReports.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', background: '#f8fafc' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📁</div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
                  No reports generated yet
                </p>
                <p style={{ margin: '6px 0 16px', fontSize: 13, color: '#64748b', maxWidth: 460, marginInline: 'auto' }}>
                  Reports will be saved here automatically when the schedule triggers, or you can generate a report right now.
                </p>
                <button
                  onClick={handleRunNow}
                  disabled={triggeringRun}
                  style={{
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '9px 18px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  ⚡ Generate & Save Report Now
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      {['Report Title / Period', 'Source', 'Generated At', 'Transactions', 'Total Sales', 'Net Profit', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {savedReports.map(rpt => (
                      <tr key={rpt.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>
                            {rpt.title || `Report #${rpt.id}`}
                          </div>
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                            Period: {rpt.period_start || rpt.data?.date || 'N/A'} {rpt.period_end && rpt.period_end !== rpt.period_start ? `to ${rpt.period_end}` : ''}
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{
                            padding: '3px 9px',
                            borderRadius: 16,
                            fontSize: 11,
                            fontWeight: 700,
                            background: rpt.source === 'automated' ? '#e0f2fe' : '#f3e8ff',
                            color: rpt.source === 'automated' ? '#0369a1' : '#7e22ce',
                            border: `1px solid ${rpt.source === 'automated' ? '#bae6fd' : '#e9d5ff'}`,
                            textTransform: 'capitalize',
                          }}>
                            {rpt.source === 'automated' ? '🤖 Scheduled' : '⚡ On-Demand'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: 13, color: '#334155' }}>
                          {new Date(rpt.generated_at).toLocaleString()}
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                          {rpt.total_transactions}
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                          UGX {Number(rpt.total_sales || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: 14, fontWeight: 700, color: Number(rpt.total_profit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                          UGX {Number(rpt.total_profit || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <button
                              onClick={() => setViewingReport(rpt)}
                              style={{
                                background: '#2563eb',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: 6,
                                padding: '6px 12px',
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              👁️ Preview Report
                            </button>
                            <button
                              onClick={() => handleDeleteReport(rpt.id)}
                              style={{
                                background: '#fef2f2',
                                color: '#dc2626',
                                border: '1px solid #fecaca',
                                borderRadius: 6,
                                padding: '6px 10px',
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SAVED REPORTS ARCHIVE TAB ── */}
      {activeReport === 'saved-reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Header & Filter Controls */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 14,
            padding: '20px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: 16
          }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={supS.label}>Report Type</label>
                <select
                  value={savedFilterType}
                  onChange={e => setSavedFilterType(e.target.value)}
                  style={{ ...supS.input, width: 200, background: '#ffffff', cursor: 'pointer' }}
                >
                  <option value="all">All Saved Reports</option>
                  <option value="daily_sales">Daily Sales</option>
                  <option value="weekly_sales">Weekly Sales</option>
                  <option value="monthly_sales">Monthly Sales</option>
                  <option value="yearly_sales">Yearly Sales</option>
                  <option value="daily_purchases">Daily Purchases</option>
                  <option value="monthly_purchases">Monthly Purchases</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={supS.label}>Filter by Date</label>
                <input
                  type="date"
                  value={savedFilterDate}
                  onChange={e => setSavedFilterDate(e.target.value)}
                  style={{ ...supS.input, width: 180, background: '#ffffff' }}
                />
              </div>

              {savedFilterDate && (
                <button
                  onClick={() => setSavedFilterDate('')}
                  style={{
                    padding: '9px 14px',
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    background: '#f8fafc',
                    color: '#64748b',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Clear Date
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => fetchSavedReports(savedFilterType, savedFilterDate)}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  padding: '9px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#334155',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                🔄 Refresh Archive
              </button>
            </div>
          </div>

          {/* Quick Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px' }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Saved Reports</p>
              <p style={{ margin: '6px 0 0', fontSize: 24, fontWeight: 800, color: '#0f172a' }}>{savedReports.length}</p>
            </div>
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px' }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Combined Sales in Reports</p>
              <p style={{ margin: '6px 0 0', fontSize: 24, fontWeight: 800, color: '#16a34a' }}>
                UGX {savedReports.reduce((sum, r) => sum + Number(r.total_sales || 0), 0).toLocaleString()}
              </p>
            </div>
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px' }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Latest Generated Report</p>
              <p style={{ margin: '6px 0 0', fontSize: 15, fontWeight: 700, color: '#2563eb' }}>
                {savedReports[0]?.generated_at ? new Date(savedReports[0].generated_at).toLocaleString() : 'No reports yet'}
              </p>
            </div>
          </div>

          {/* Saved Reports List */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 14,
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            {savedReportsLoading ? (
              <div style={{ padding: 48, textAlign: 'center', color: '#64748b', fontSize: 14 }}>
                Loading saved reports from database...
              </div>
            ) : savedReports.length === 0 ? (
              <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📁</div>
                <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 700, color: '#0f172a' }}>No Saved Reports Found</h3>
                <p style={{ margin: 0, fontSize: 13, color: '#64748b', maxWidth: 450, marginInline: 'auto' }}>
                  There are no generated reports matching your filters. You can automate report generation from the Daily, Weekly, or Monthly sales tabs.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      {['Report Title / Period', 'Type', 'Source', 'Generated Date', 'Txns', 'Total Sales', 'Net Profit', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {savedReports.map(rpt => (
                      <tr key={rpt.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>
                            {rpt.title || `Report #${rpt.id}`}
                          </div>
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                            Period: {rpt.period_start || rpt.data?.date || 'N/A'} {rpt.period_end && rpt.period_end !== rpt.period_start ? `to ${rpt.period_end}` : ''}
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            background: '#f1f5f9',
                            color: '#334155',
                            textTransform: 'capitalize',
                          }}>
                            {(rpt.report_type || '').replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{
                            padding: '3px 9px',
                            borderRadius: 16,
                            fontSize: 11,
                            fontWeight: 700,
                            background: rpt.source === 'automated' ? '#e0f2fe' : '#f3e8ff',
                            color: rpt.source === 'automated' ? '#0369a1' : '#7e22ce',
                            border: `1px solid ${rpt.source === 'automated' ? '#bae6fd' : '#e9d5ff'}`,
                            textTransform: 'capitalize',
                          }}>
                            {rpt.source === 'automated' ? '🤖 Scheduled' : '⚡ On-Demand'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: 13, color: '#334155' }}>
                          {new Date(rpt.generated_at).toLocaleString()}
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                          {rpt.total_transactions}
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                          UGX {Number(rpt.total_sales || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: 14, fontWeight: 700, color: Number(rpt.total_profit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                          UGX {Number(rpt.total_profit || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <button
                              onClick={() => setViewingReport(rpt)}
                              style={{
                                background: '#2563eb',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: 6,
                                padding: '6px 12px',
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              👁️ Preview
                            </button>
                            <button
                              onClick={() => handleDeleteReport(rpt.id)}
                              style={{
                                background: '#fef2f2',
                                color: '#dc2626',
                                border: '1px solid #fecaca',
                                borderRadius: 6,
                                padding: '6px 10px',
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── REPORT PREVIEW MODAL ── */}
      {viewingReport && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16,
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 16,
            width: '100%',
            maxWidth: 960,
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
                    {viewingReport.title || 'Saved Report Preview'}
                  </h3>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 12,
                    background: viewingReport.source === 'automated' ? '#e0f2fe' : '#f3e8ff',
                    color: viewingReport.source === 'automated' ? '#0369a1' : '#7e22ce',
                  }}>
                    {viewingReport.source === 'automated' ? '🤖 Automated Schedule' : '⚡ On-Demand Run'}
                  </span>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 12,
                    background: '#dcfce7',
                    color: '#15803d',
                  }}>
                    💾 Database Archived
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  Generated on: {new Date(viewingReport.generated_at).toLocaleString()}
                </div>
              </div>

              <button
                onClick={() => setViewingReport(null)}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#64748b',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body - Scrollable & Printable */}
            <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
              <div id="printable-report-preview" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Header info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: 16 }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a' }}>
                      {viewingReport.title || 'Sales Report'}
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                      Period: {viewingReport.period_start || viewingReport.data?.date || 'N/A'} {viewingReport.period_end && viewingReport.period_end !== viewingReport.period_start ? `to ${viewingReport.period_end}` : ''}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Database Record ID</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>#RPT-{viewingReport.id}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                      Generated: {new Date(viewingReport.generated_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Key Metrics Bar */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                  {[
                    { label: 'Total Sales', value: `UGX ${Number(viewingReport.total_sales || viewingReport.data?.total_sales || 0).toLocaleString()}`, color: '#0f172a' },
                    { label: 'Total Cost', value: `UGX ${Number(viewingReport.data?.total_cost || 0).toLocaleString()}`, color: '#64748b' },
                    { label: 'Net Profit', value: `UGX ${Number(viewingReport.total_profit || viewingReport.data?.total_profit || 0).toLocaleString()}`, color: Number(viewingReport.total_profit || viewingReport.data?.total_profit || 0) >= 0 ? '#16a34a' : '#dc2626' },
                    { label: 'Profit Margin', value: Number(viewingReport.total_sales || viewingReport.data?.total_sales || 0) > 0 ? `${((Number(viewingReport.total_profit || viewingReport.data?.total_profit || 0) / Number(viewingReport.total_sales || viewingReport.data?.total_sales || 1)) * 100).toFixed(1)}%` : '0%', color: '#2563eb' },
                    { label: 'Transactions', value: viewingReport.total_transactions || viewingReport.data?.total_transactions || 0, color: '#0f172a' },
                  ].map(m => (
                    <div key={m.label} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{m.label}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: m.color, marginTop: 4 }}>{m.value}</div>
                    </div>
                  ))}
                </div>

                {/* Payment Methods breakdown */}
                {viewingReport.data?.payment_breakdown && (
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16 }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Payment Methods</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                      {Object.entries(viewingReport.data.payment_breakdown).map(([method, amount]) => (
                        <div key={method} style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: 11, color: '#64748b', textTransform: 'capitalize' }}>{method.replace(/_/g, ' ')}</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>UGX {Number(amount).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transaction breakdown table */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: 13, color: '#1e293b' }}>
                    Sales Transactions ({viewingReport.data?.sales?.length || 0})
                  </div>
                  {(!viewingReport.data?.sales || viewingReport.data.sales.length === 0) ? (
                    <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                      No sales transactions recorded in this report period.
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          {['#', 'Time', 'Cashier', 'Payment', 'Items', 'Amount', 'Cost', 'Profit'].map(th => (
                            <th key={th} style={{ padding: '8px 12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{th}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {viewingReport.data.sales.map((s, idx) => (
                          <tr key={s.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '8px 12px', color: '#64748b' }}>#{idx + 1}</td>
                            <td style={{ padding: '8px 12px', color: '#334155' }}>{new Date(s.created_at).toLocaleTimeString()}</td>
                            <td style={{ padding: '8px 12px', color: '#0f172a', fontWeight: 600 }}>{s.user?.name || 'Walk-in'}</td>
                            <td style={{ padding: '8px 12px', textTransform: 'capitalize', color: '#475569' }}>{(s.payment_method || '').replace(/_/g, ' ')}</td>
                            <td style={{ padding: '8px 12px', color: '#64748b' }}>{(s.sale_items || s.saleItems || []).length}</td>
                            <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0f172a' }}>UGX {Number(s.total_amount || 0).toLocaleString()}</td>
                            <td style={{ padding: '8px 12px', color: '#64748b' }}>UGX {Number(s.cost || 0).toLocaleString()}</td>
                            <td style={{ padding: '8px 12px', fontWeight: 700, color: Number(s.profit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                              UGX {Number(s.profit || 0).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '14px 24px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc',
            }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  🖨️ Print / Save as PDF
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!viewingReport.data?.sales || viewingReport.data.sales.length === 0) {
                      alert('No sales data to export');
                      return;
                    }
                    const exportRows = viewingReport.data.sales.map(s => ({
                      id: s.id,
                      time: s.created_at,
                      cashier: s.user?.name || 'Walk-in',
                      payment_method: s.payment_method,
                      total_amount: s.total_amount,
                      cost: s.cost || 0,
                      profit: s.profit || 0,
                    }));
                    exportToCSV(exportRows, `saved_report_${viewingReport.id}`);
                  }}
                  style={{
                    background: '#ffffff',
                    color: '#0f172a',
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  📥 Export CSV
                </button>
              </div>

              <button
                type="button"
                onClick={() => setViewingReport(null)}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#475569',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── AI Assistant Tab ──────────────────────────────────────────────────────────

export default ReportsTab;
export { ReportsTab };
