import React from 'react';
import { MarketingLink } from '../../utils/navigation';
import { ArrowRightIcon } from './Icons';

const COLUMN_ONE_POINTS = [
  {
    id: '01',
    title: 'Real-Time Stock Tracking & Zero Stockouts',
    desc: 'Automatically tracks item quantities across all sales so shelves stay stocked and you never disappoint a customer.',
  },
  {
    id: '02',
    title: 'Fast Point of Sale',
    desc: 'Point of Sale section with fast barcode scanning, quick item lookup, and instant receipts keeps checkout queues short and customers happy.',
  },
  {
    id: '03',
    title: 'Eliminates Manual Calculation Errors',
    desc: 'Auto calculates item totals, discounts, balances, and taxes on every order stopping costly human math mistakes and cash register mistakes.',
  },
  {
    id: '04',
    title: 'Instant Daily Profit & Margin Clarity',
    desc: 'See your true daily revenue, gross profit margins, and closing cash balances at a single glance with zero manual paper bookkeeping.',
  },
  {
    id: '05',
    title: 'Reports',
    desc: 'Get detailed reports on sales, profits, stock levels, and more to track your business performance and make informed decisions.',
  },
];

const COLUMN_TWO_POINTS = [
  {
    id: '06',
    title: 'Seamless Supplier Purchases & Restocks',
    desc: 'Record supplier delivery invoices and update catalog stock levels in seconds with no handwritten delivery slips or repetitive catalog entry.',
  },
  {
    id: '07',
    title: 'Can be accessed anywhere',
    desc: 'access all your business operations from anywhere, anytime whether you are on phone, tablet or PC',
  },
  {
    id: '08',
    title: 'Better Business Decisions',
    desc: 'Use advanced analytics and real-time insights to make smarter business decisions and improve profitability.',
  },
  {
    id: '09',
    title: 'Smart AI-Powered Business Insights',
    desc: 'Ask questions in plain English to immediately identify fast-moving items, spot dead stock, and calculate ideal reorder quantities with precision.',
  },
  {
    id: '10',
    title: 'Supports Multiple Users',
    desc: 'Add your staff members as users and assign them specific roles and permissions to manage your store together securely.',
  },
];

export default function WhyStockPro() {
  return (
    <section className="sp-why-section" aria-labelledby="why-stockpro-heading">
      <div className="sp-container">
        {/* Section Header */}
        <div className="sp-why-header">
          <div className="sp-why-eyebrow">
            OPERATIONAL SIMPLICITY AND COMPLETE CONTROL
          </div>

          <h2 id="why-stockpro-heading" className="sp-why-title">
            How Stockpro helps to simplify your business?
          </h2>

          <p className="sp-why-desc">
            Running a growing retail or wholesale store shouldn't mean drowning in messy logbooks, stock discrepancies, and endless manual math. Here is why modern businesses rely on StockPro.
          </p>
        </div>

        {/* 10 Points in 2 Balanced Columns */}
        <div className="sp-why-grid">
          {/* Left Column (Points 1 - 5) */}
          <div className="sp-why-column">
            {COLUMN_ONE_POINTS.map((point) => (
              <div key={point.id} className="sp-why-card">
                <div className="sp-why-marker" aria-hidden="true">
                  <span className="sp-why-chevron">&gt;</span>
                </div>
                <div className="sp-why-content">
                  <h3 className="sp-why-point-title">{point.title}</h3>
                  <p className="sp-why-point-desc">{point.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column (Points 6 - 10) */}
          <div className="sp-why-column">
            {COLUMN_TWO_POINTS.map((point) => (
              <div key={point.id} className="sp-why-card">
                <div className="sp-why-marker" aria-hidden="true">
                  <span className="sp-why-chevron">&gt;</span>
                </div>
                <div className="sp-why-content">
                  <h3 className="sp-why-point-title">{point.title}</h3>
                  <p className="sp-why-point-desc">{point.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Professional Reassurance & Quick Action Strip */}
        <div className="sp-why-footer-bar">
          <div className="sp-why-footer-text">
            <strong>Ready to take the friction out of your daily business operations?</strong>
            <span style={{ display: 'block', fontSize: 13, color: '#94A3B8', marginTop: 3 }}>
              Set up in minutes. Works on your existing phone, tablet, or PC.
            </span>
          </div>
          <div className="sp-why-footer-actions">
            <MarketingLink href="/register" className="sp-btn sp-btn-primary sp-btn-md">
              <span>Get Started Free</span>
              <ArrowRightIcon size={15} />
            </MarketingLink>
          </div>
        </div>
      </div>
    </section>
  );
}
