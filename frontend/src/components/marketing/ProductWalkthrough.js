import React, { useState } from 'react';
import SectionHeading from './SectionHeading';

const DEMO_PRODUCTS = [
  { id: 1, name: 'Samsung Galaxy A54 5G 128GB', sku: 'TEL-7721', category: 'Smartphones', cost: '820,000', price: '980,000', stock: 2, min: 10, status: 'low' },
  { id: 2, name: 'HP LaserJet Toner Cartridge 85A', sku: 'ACC-3042', category: 'Printers & Ink', cost: '140,000', price: '195,000', stock: 3, min: 8, status: 'low' },
  { id: 3, name: 'Logitech MX Master 3S Wireless', sku: 'PER-4109', category: 'Peripherals', cost: '310,000', price: '420,000', stock: 14, min: 5, status: 'in-stock' },
  { id: 4, name: 'SanDisk Ultra Dual Drive USB-C 128GB', sku: 'STR-8812', category: 'Storage', cost: '42,000', price: '65,000', stock: 28, min: 10, status: 'in-stock' },
  { id: 5, name: '65W GaN Fast Charger Multi-Port', sku: 'PWR-1904', category: 'Power & Cables', cost: '55,000', price: '85,000', stock: 4, min: 15, status: 'low' },
  { id: 6, name: 'Dell 24" Full HD IPS Monitor', sku: 'MON-5520', category: 'Monitors', cost: '580,000', price: '720,000', stock: 9, min: 4, status: 'in-stock' },
];

export default function ProductWalkthrough() {
  const [filter, setFilter] = useState('all');

  const filteredProducts = filter === 'low'
    ? DEMO_PRODUCTS.filter(p => p.status === 'low')
    : DEMO_PRODUCTS;

  return (
    <section className="sp-section sp-section-white" aria-labelledby="showcase-heading">
      <div className="sp-container">
        <SectionHeading
          eyebrow="PRODUCT DEMO"
          title="Designed for daily operational clarity."
          subtitle="A live look at the central inventory manager. See stock levels, margins, and threshold alerts at a single glance without clunky navigation."
          align="center"
        />

        {/* Walkthrough Container */}
        <div className="sp-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--sp-border)' }}>
          {/* Top Overview Strip */}
          <div style={{ padding: '24px 28px', backgroundColor: 'var(--sp-off-white)', borderBottom: '1px solid var(--sp-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--sp-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                Inventory Live Overview
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: 13, color: 'var(--sp-text-muted)' }}>Catalog Items: </span>
                  <strong className="sp-num" style={{ fontSize: 18, color: 'var(--sp-navy-950)' }}>1,248</strong>
                </div>
                <div>
                  <span style={{ fontSize: 13, color: 'var(--sp-text-muted)' }}>Month Sales: </span>
                  <strong className="sp-num" style={{ fontSize: 18, color: 'var(--sp-navy-950)' }}>UGX 18.4M</strong>
                </div>
                <div>
                  <span style={{ fontSize: 13, color: 'var(--sp-text-muted)' }}>Month Purchases: </span>
                  <strong className="sp-num" style={{ fontSize: 18, color: 'var(--sp-navy-950)' }}>UGX 7.2M</strong>
                </div>
              </div>
            </div>

            {/* Filter buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                className={`sp-btn sp-btn-sm ${filter === 'all' ? 'sp-btn-primary' : 'sp-btn-secondary'}`}
                onClick={() => setFilter('all')}
              >
                All Products ({DEMO_PRODUCTS.length})
              </button>
              <button
                type="button"
                className={`sp-btn sp-btn-sm ${filter === 'low' ? 'sp-btn-primary' : 'sp-btn-secondary'}`}
                onClick={() => setFilter('low')}
                style={filter === 'low' ? { backgroundColor: '#DC2626', borderColor: '#DC2626' } : {}}
              >
                Needs Reorder (3)
              </button>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="sp-comparison-table" style={{ margin: 0, border: 'none' }}>
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th>SKU Code</th>
                  <th>Category</th>
                  <th style={{ textAlign: 'right' }}>Cost Price</th>
                  <th style={{ textAlign: 'right' }}>Selling Price</th>
                  <th>Stock Quantity</th>
                  <th style={{ textAlign: 'center' }}>Health Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--sp-navy-950)' }}>{p.name}</div>
                    </td>
                    <td>
                      <span className="sp-num" style={{ fontSize: 12.5, color: 'var(--sp-text-muted)' }}>
                        {p.sku}
                      </span>
                    </td>
                    <td>
                      <span className="sp-badge sp-badge-navy" style={{ fontSize: 11 }}>
                        {p.category}
                      </span>
                    </td>
                    <td className="sp-num" style={{ textAlign: 'right', color: 'var(--sp-text-muted)' }}>
                      UGX {p.cost}
                    </td>
                    <td className="sp-num" style={{ textAlign: 'right', fontWeight: 700, color: 'var(--sp-navy-950)' }}>
                      UGX {p.price}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="sp-num" style={{ fontWeight: 700, color: p.status === 'low' ? '#DC2626' : 'var(--sp-navy-950)' }}>
                          {p.stock} units
                        </span>
                        <span style={{ fontSize: 11, color: '#94A3B8' }}>
                          (min: {p.min})
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {p.status === 'low' ? (
                        <span className="sp-badge" style={{ backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
                          Low Stock Alert
                        </span>
                      ) : (
                        <span className="sp-badge sp-badge-success">
                          Healthy Level
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
