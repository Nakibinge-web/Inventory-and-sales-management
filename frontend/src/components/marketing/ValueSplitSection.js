import React from 'react';
import { MarketingLink } from '../../utils/navigation';
import { ArrowRightIcon } from './Icons';

export default function ValueSplitSection() {
  return (
    <section className="sp-section sp-section-white" aria-labelledby="value-split-heading">
      <div className="sp-container">
        <div className="sp-split-grid">
          {/* Left Column: Editorial Headline & Problem/Solution Statement */}
          <div>
            <div className="sp-eyebrow">BUILT FOR REAL COMMERCE</div>
            <h2 id="value-split-heading" className="sp-section-title" style={{ maxWidth: 500 }}>
              Eliminate stockouts, revenue leakage, and manual bookkeeping.
            </h2>
            <p className="sp-body" style={{ marginBottom: 20 }}>
              Most retail and wholesale operations struggle because their inventory count in the backroom never matches what cashiers ring up at the front counter. Purchases get recorded on paper, stock goes missing, and owners only discover shortages after customers walk away empty-handed.
            </p>
            <p className="sp-body" style={{ marginBottom: 32 }}>
              StockPro links your physical catalog directly to cashier registers and supplier purchase logs. Every single sale automatically decrements stock, alerts you before you run out, and rolls into daily revenue audits without manual tallying.
            </p>
            <MarketingLink href="/how-it-works" className="sp-btn sp-btn-secondary sp-btn-sm">
              <span>Read the operational walkthrough</span>
              <ArrowRightIcon size={14} />
            </MarketingLink>
          </div>

          {/* Right Column: Structured Operational Sequence */}
          <div className="sp-sequence-container" role="list" aria-label="Operational Lifecycle">
            {/* Step 1 */}
            <div className="sp-sequence-step" role="listitem">
              <div className="sp-step-num sp-num" aria-hidden="true">01</div>
              <div className="sp-step-info">
                <h3 className="sp-step-title">Track Stock Accurately</h3>
                <p className="sp-step-desc">
                  Products are cataloged with custom SKUs, cost prices, retail prices, and min-stock alert thresholds.
                </p>
              </div>
            </div>

            <div className="sp-sequence-arrow" aria-hidden="true">&darr;</div>

            {/* Step 2 */}
            <div className="sp-sequence-step" role="listitem">
              <div className="sp-step-num sp-num" aria-hidden="true">02</div>
              <div className="sp-step-info">
                <h3 className="sp-step-title">Make Sales at the Counter</h3>
                <p className="sp-step-desc">
                  Cashiers process transactions on the POS terminal. Quantities deduct instantly across all registers.
                </p>
              </div>
            </div>

            <div className="sp-sequence-arrow" aria-hidden="true">&darr;</div>

            {/* Step 3 */}
            <div className="sp-sequence-step" role="listitem">
              <div className="sp-step-num sp-num" aria-hidden="true">03</div>
              <div className="sp-step-info">
                <h3 className="sp-step-title">Monitor Purchases &amp; Vendors</h3>
                <p className="sp-step-desc">
                  Receive restock shipments from suppliers, log invoices, and calculate your true profit margins against cost.
                </p>
              </div>
            </div>

            <div className="sp-sequence-arrow" aria-hidden="true">&darr;</div>

            {/* Step 4 */}
            <div className="sp-sequence-step" role="listitem">
              <div className="sp-step-num sp-num" aria-hidden="true">04</div>
              <div className="sp-step-info">
                <h3 className="sp-step-title">Understand Business Performance</h3>
                <p className="sp-step-desc">
                  Review verified daily reconciliations, top-selling items, cash flow balances, and monthly growth trends.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
