import React from 'react';
import { MarketingLink } from '../../utils/navigation';
import { ArrowRightIcon } from './Icons';

const COLUMN_ONE_AUDIENCES = [
  {
    id: '01',
    title: 'Retail Shops',
  },
  {
    id: '02',
    title: 'Supermarkets',
  },
  {
    id: '03',
    title: 'Wholesale Depots',
  },
  {
    id: '04',
    title: 'Pharmacies',
  },
  {
    id: '05',
    title: 'Hardwares',
  },
];

const COLUMN_TWO_AUDIENCES = [
  {
    id: '06',
    title: 'Electronics & Mobile shops',
  },
  {
    id: '07',
    title: 'Automotive & Spare Parts shops',
  },
  {
    id: '08',
    title: 'Boutiques',
  },
  {
    id: '09',
    title: 'Bookstores & Office Stationery',
  },
  {
    id: '10',
    title: 'All Small and medium sized Businesses',
  },
];

export default function WhoNeedsStock() {
  return (
    <section className="sp-who-section" aria-labelledby="who-needs-stock-heading">
      <div className="sp-container">
        {/* Section Header */}
        <div className="sp-who-header">
          <div className="sp-who-eyebrow">
            BUILT FOR MODERN COMMERCE
          </div>

          <h2 id="who-needs-stock-heading" className="sp-who-title">
            Who needs stock?
          </h2>

          <p className="sp-who-desc">
            Whether you operate a fast-paced retail counter or manage bulk wholesale warehouses, StockPro gives every inventory-driven business total control and peace of mind.
          </p>
        </div>

        {/* 10 Points in 2 Balanced Columns */}
        <div className="sp-who-grid">
          {/* Left Column (Points 1 - 5) */}
          <div className="sp-who-column">
            {COLUMN_ONE_AUDIENCES.map((point) => (
              <div key={point.id} className="sp-who-card">
                <div className="sp-who-marker" aria-hidden="true">
                  <span className="sp-who-dot" />
                </div>
                <div className="sp-who-content">
                  <h3 className="sp-who-point-title">{point.title}</h3>
                  <p className="sp-who-point-desc">{point.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column (Points 6 - 10) */}
          <div className="sp-who-column">
            {COLUMN_TWO_AUDIENCES.map((point) => (
              <div key={point.id} className="sp-who-card">
                <div className="sp-who-marker" aria-hidden="true">
                  <span className="sp-who-dot" />
                </div>
                <div className="sp-who-content">
                  <h3 className="sp-who-point-title">{point.title}</h3>
                  <p className="sp-who-point-desc">{point.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Elegant Bottom Reassurance Banner */}
        <div className="sp-who-footer-bar">
          <div className="sp-who-footer-text">
            <strong>Don't see your specific industry listed?</strong>
            <span style={{ display: 'block', fontSize: 13, color: 'var(--sp-text-muted)', marginTop: 3 }}>
              StockPro is built flexibly for any business that buys, holds, sells, or restocks physical goods.
            </span>
          </div>
          <div className="sp-who-footer-actions">
            <MarketingLink href="/register" className="sp-btn sp-btn-primary sp-btn-md">
              <span>Start Managing Today</span>
              <ArrowRightIcon size={15} />
            </MarketingLink>
          </div>
        </div>
      </div>
    </section>
  );
}
