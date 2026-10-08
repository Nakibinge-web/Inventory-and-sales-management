import React, { useState } from 'react';

export default function ProductPreview() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="sp-preview-window" role="region" aria-label="Interactive StockPro Dashboard Preview">
      {/* OS Titlebar */}
      <div className="sp-window-titlebar">
        <div className="sp-window-dots" aria-hidden="true">
          <span className="sp-window-dot sp-window-dot-red" />
          <span className="sp-window-dot sp-window-dot-yellow" />
          <span className="sp-window-dot sp-window-dot-green" />
        </div>
        <div className="sp-window-title">
          <span style={{ fontWeight: 700, color: '#FFFFFF' }}>StockPro</span>
          <span style={{ color: '#486581' }}>/</span>
          <span>Zziwa Retailers &amp; Wholesale</span>
          <span style={{ color: '#486581' }}>&bull;</span>
          <span style={{ color: '#94A3B8', fontSize: 11 }}>Main Store Terminal</span>
        </div>
        <div className="sp-window-status">
          <span className="sp-status-dot" style={{ width: 6, height: 6 }} aria-hidden="true" />
          <span>Real-time Sync</span>
        </div>
      </div>

      {/* Internal Navigation Bar */}
      <div className="sp-preview-toolbar">
        <div className="sp-preview-tabs" role="tablist" aria-label="Product UI tabs">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'overview'}
            className={`sp-toolbar-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'pos'}
            className={`sp-toolbar-tab ${activeTab === 'pos' ? 'active' : ''}`}
            onClick={() => setActiveTab('pos')}
          >
            POS Register #01
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'inventory'}
            className={`sp-toolbar-tab ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            Inventory Audit (4 Alerts)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'sales'}
            className={`sp-toolbar-tab ${activeTab === 'sales' ? 'active' : ''}`}
            onClick={() => setActiveTab('sales')}
          >
            Daily Reconciliation
          </button>
        </div>
        <div className="sp-toolbar-date sp-num">
          Today: 13:45 EAT
        </div>
      </div>

      {/* Main mockup canvas */}
      <div className="sp-preview-canvas">
        {/* VIEW 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="sp-preview-fade-in">
            {/* 4 Metric Columns with Monospace Figures */}
            <div className="sp-preview-metrics-grid">
              <div className="sp-metric-cell">
                <span className="sp-metric-header">Today's Sales</span>
                <div className="sp-metric-number sp-num">UGX 18,450,000</div>
                <div className="sp-metric-delta positive">
                  &uarr; 14.2% vs yesterday
                </div>
              </div>
              <div className="sp-metric-cell">
                <span className="sp-metric-header">Active Catalog</span>
                <div className="sp-metric-number sp-num">1,248 items</div>
                <div className="sp-metric-delta">
                  18 organized categories
                </div>
              </div>
              <div className="sp-metric-cell">
                <span className="sp-metric-header">Monthly Purchases</span>
                <div className="sp-metric-number sp-num">UGX 7,200,000</div>
                <div className="sp-metric-delta">
                  8 vendor orders received
                </div>
              </div>
              <div className="sp-metric-cell alert">
                <span className="sp-metric-header" style={{ color: '#DC2626' }}>Low Stock Warning</span>
                <div className="sp-metric-number sp-num" style={{ color: '#DC2626' }}>4 items</div>
                <div className="sp-metric-delta" style={{ color: '#B91C1C' }}>
                  Below reorder point
                </div>
              </div>
            </div>

            {/* Split Data Layout */}
            <div className="sp-preview-split-grid">
              {/* Transactions Table */}
              <div className="sp-preview-block">
                <div className="sp-block-head">
                  <span className="sp-block-title">Counter Sales &bull; Live Feed</span>
                  <span className="sp-block-meta sp-num">Terminal 1 &amp; 2</span>
                </div>
                <table className="sp-preview-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Cashier</th>
                      <th>Method</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="sp-num">13:42</td>
                      <td>Sarah N.</td>
                      <td><span className="sp-preview-badge">Mobile Money</span></td>
                      <td className="sp-num text-right bold">UGX 380,000</td>
                    </tr>
                    <tr>
                      <td className="sp-num">13:35</td>
                      <td>Brian M.</td>
                      <td><span className="sp-preview-badge">Cash</span></td>
                      <td className="sp-num text-right bold">UGX 125,000</td>
                    </tr>
                    <tr>
                      <td className="sp-num">13:18</td>
                      <td>Sarah N.</td>
                      <td><span className="sp-preview-badge">Card</span></td>
                      <td className="sp-num text-right bold">UGX 940,000</td>
                    </tr>
                    <tr>
                      <td className="sp-num">12:54</td>
                      <td>Brian M.</td>
                      <td><span className="sp-preview-badge">Cash</span></td>
                      <td className="sp-num text-right bold">UGX 54,000</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Stock Reorder Status */}
              <div className="sp-preview-block">
                <div className="sp-block-head">
                  <span className="sp-block-title">Reorder Priority</span>
                  <span className="sp-block-meta" style={{ color: '#DC2626', fontWeight: 600 }}>Action Required</span>
                </div>
                <div className="sp-stock-pills-list">
                  <div className="sp-stock-pill-row">
                    <div>
                      <div className="sp-stock-item-name">Galaxy A54 128GB</div>
                      <div className="sp-stock-item-sku sp-num">TEL-7721</div>
                    </div>
                    <div className="text-right">
                      <div className="sp-stock-critical sp-num">2 left</div>
                      <div className="sp-stock-min sp-num">Min: 10</div>
                    </div>
                  </div>

                  <div className="sp-stock-pill-row">
                    <div>
                      <div className="sp-stock-item-name">HP Toner Cartridge 85A</div>
                      <div className="sp-stock-item-sku sp-num">ACC-3042</div>
                    </div>
                    <div className="text-right">
                      <div className="sp-stock-critical sp-num">3 left</div>
                      <div className="sp-stock-min sp-num">Min: 8</div>
                    </div>
                  </div>

                  <div className="sp-stock-pill-row">
                    <div>
                      <div className="sp-stock-item-name">65W GaN Fast Charger</div>
                      <div className="sp-stock-item-sku sp-num">PWR-1904</div>
                    </div>
                    <div className="text-right">
                      <div className="sp-stock-critical sp-num">4 left</div>
                      <div className="sp-stock-min sp-num">Min: 15</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: POS REGISTER */}
        {activeTab === 'pos' && (
          <div className="sp-preview-fade-in">
            <div className="sp-pos-preview-wrap">
              <div className="sp-pos-left">
                <div className="sp-pos-searchbar">
                  <span style={{ color: '#94A3B8' }}>&gt; Scan barcode or type product name...</span>
                  <span className="sp-pos-shortcut sp-num">[F4]</span>
                </div>
                <table className="sp-preview-table" style={{ marginTop: 10 }}>
                  <thead>
                    <tr>
                      <th>Product Description</th>
                      <th>SKU</th>
                      <th>Qty</th>
                      <th style={{ textAlign: 'right' }}>Price</th>
                      <th style={{ textAlign: 'right' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Logitech MX Master 3S Wireless</strong></td>
                      <td className="sp-num">PER-4109</td>
                      <td className="sp-num">1</td>
                      <td className="sp-num text-right">420,000</td>
                      <td className="sp-num text-right bold">420,000</td>
                    </tr>
                    <tr>
                      <td><strong>USB-C Braided Heavy Cable 2M</strong></td>
                      <td className="sp-num">CAB-0291</td>
                      <td className="sp-num">2</td>
                      <td className="sp-num text-right">35,000</td>
                      <td className="sp-num text-right bold">70,000</td>
                    </tr>
                    <tr>
                      <td><strong>SanDisk Ultra Dual 128GB Flash</strong></td>
                      <td className="sp-num">STR-8812</td>
                      <td className="sp-num">1</td>
                      <td className="sp-num text-right">65,000</td>
                      <td className="sp-num text-right bold">65,000</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* POS Tender & Totals Panel */}
              <div className="sp-pos-right">
                <div className="sp-pos-totals">
                  <div className="sp-pos-totals-row">
                    <span>Subtotal</span>
                    <span className="sp-num">UGX 555,000</span>
                  </div>
                  <div className="sp-pos-totals-row">
                    <span>VAT (18% Tax Inclusive)</span>
                    <span className="sp-num">UGX 84,661</span>
                  </div>
                  <div className="sp-pos-totals-row grand">
                    <span>Amount Due</span>
                    <span className="sp-num" style={{ fontSize: 18, color: '#0F172A' }}>UGX 555,000</span>
                  </div>
                </div>

                <div className="sp-pos-tender-options">
                  <button type="button" className="sp-tender-btn active">
                    <span className="sp-num">[F1]</span> Cash
                  </button>
                  <button type="button" className="sp-tender-btn">
                    <span className="sp-num">[F2]</span> M-Money
                  </button>
                  <button type="button" className="sp-tender-btn">
                    <span className="sp-num">[F3]</span> Card
                  </button>
                </div>

                <button type="button" className="sp-btn sp-btn-primary" style={{ width: '100%', padding: '10px 14px', fontSize: 13 }}>
                  Print Receipt &amp; Open Drawer [Enter]
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: INVENTORY AUDIT */}
        {activeTab === 'inventory' && (
          <div className="sp-preview-fade-in">
            <div className="sp-preview-block">
              <div className="sp-block-head">
                <span className="sp-block-title">Continuous Stock Movements Audit Log</span>
                <span className="sp-block-meta sp-num">Filter: All Movements</span>
              </div>
              <table className="sp-preview-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Type</th>
                    <th>Product &amp; SKU</th>
                    <th>Adjustment</th>
                    <th>Reason / Reference</th>
                    <th>Staff</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="sp-num">Today 13:42</td>
                    <td><span className="sp-preview-badge">SALE</span></td>
                    <td>Galaxy A54 128GB (TEL-7721)</td>
                    <td className="sp-num" style={{ color: '#DC2626', fontWeight: 700 }}>-1 unit</td>
                    <td>Register POS #01</td>
                    <td>Sarah N.</td>
                  </tr>
                  <tr>
                    <td className="sp-num">Today 11:15</td>
                    <td><span className="sp-preview-badge" style={{ backgroundColor: '#ECFDF5', color: '#059669', borderColor: '#A7F3D0' }}>PURCHASE</span></td>
                    <td>HP LaserJet 85A (ACC-3042)</td>
                    <td className="sp-num" style={{ color: '#059669', fontWeight: 700 }}>+15 units</td>
                    <td>PO-2026-081 (Vendor Delivery)</td>
                    <td>Alex K.</td>
                  </tr>
                  <tr>
                    <td className="sp-num">Today 09:30</td>
                    <td><span className="sp-preview-badge" style={{ backgroundColor: '#FFFBEB', color: '#D97706', borderColor: '#FDE68A' }}>ADJUST</span></td>
                    <td>65W GaN Fast Charger (PWR-1904)</td>
                    <td className="sp-num" style={{ color: '#DC2626', fontWeight: 700 }}>-2 units</td>
                    <td>Damaged in transport container</td>
                    <td>Alex K.</td>
                  </tr>
                  <tr>
                    <td className="sp-num">Yesterday 17:45</td>
                    <td><span className="sp-preview-badge">SALE</span></td>
                    <td>Logitech MX Master 3S (PER-4109)</td>
                    <td className="sp-num" style={{ color: '#DC2626', fontWeight: 700 }}>-1 unit</td>
                    <td>Register POS #02</td>
                    <td>Brian M.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 4: DAILY RECONCILIATION */}
        {activeTab === 'sales' && (
          <div className="sp-preview-fade-in">
            <div className="sp-preview-block">
              <div className="sp-block-head">
                <span className="sp-block-title">Daily Cashier Reconciliation &bull; Shift Report</span>
                <span className="sp-block-meta sp-num">Date: Today</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                <div style={{ padding: 12, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6 }}>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>CASH IN DRAWER</div>
                  <div className="sp-num" style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>UGX 8,420,000</div>
                  <div style={{ fontSize: 11, color: '#059669', marginTop: 2 }}>Balanced &bull; Exact count</div>
                </div>
                <div style={{ padding: 12, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6 }}>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>MOBILE MONEY TOTAL</div>
                  <div className="sp-num" style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>UGX 6,190,000</div>
                  <div style={{ fontSize: 11, color: '#059669', marginTop: 2 }}>32 Transactions synced</div>
                </div>
                <div style={{ padding: 12, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6 }}>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>CARD &amp; BANK SETTLEMENTS</div>
                  <div className="sp-num" style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>UGX 3,840,000</div>
                  <div style={{ fontSize: 11, color: '#059669', marginTop: 2 }}>POS Terminal Batch #19</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#0B1F3A', color: '#FFFFFF', borderRadius: 6, fontSize: 13 }}>
                <span>Total Reconciled Day Volume: <strong className="sp-num">UGX 18,450,000</strong></span>
                <span style={{ color: '#A5F3FC', fontSize: 11, fontWeight: 600 }}>Shift Manager Verified &bull; Alex K.</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
