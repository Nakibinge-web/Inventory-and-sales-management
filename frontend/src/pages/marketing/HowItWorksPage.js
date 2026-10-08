import React from 'react';
import MarketingHeader from '../../components/marketing/MarketingHeader';
import MarketingFooter from '../../components/marketing/MarketingFooter';
import CTASection from '../../components/marketing/CTASection';
import SectionHeading from '../../components/marketing/SectionHeading';
import { usePageMeta } from '../../utils/seo';
import { CheckIcon } from '../../components/marketing/Icons';

export default function HowItWorksPage() {
  usePageMeta(
    'How StockPro Works — Step-by-Step Business Guide',
    'Follow the 5-step operational journey from initial workspace registration and inventory setup to counter checkout, supplier procurement, and verified daily reporting.'
  );

  return (
    <div className="marketing-root">
      <MarketingHeader />

      <main id="main-content">
        {/* Page Hero */}
        <section className="sp-section sp-section-white" style={{ paddingBottom: 40 }} aria-labelledby="how-heading">
          <div className="sp-container">
            <SectionHeading
              eyebrow="OPERATIONAL JOURNEY"
              title="A structured workflow for total commerce control."
              subtitle="StockPro guides you through a connected sequence that turns chaotic stockrooms, loose register receipts, and supplier invoices into a clean, auditable operational machine."
              align="center"
            />

            {/* Connected Journey Ribbon */}
            <div style={{ maxWidth: 840, margin: '36px auto 0', border: '1px solid var(--sp-border)', borderRadius: 8, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', backgroundColor: 'var(--sp-white)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 10px', textAlign: 'center', borderRight: '1px solid var(--sp-border)', backgroundColor: 'var(--sp-surface-soft)' }}>
                <span className="sp-num" style={{ fontSize: 11, fontWeight: 700, color: 'var(--sp-accent)' }}>01</span>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--sp-navy-950)' }}>CREATE</div>
              </div>
              <div style={{ padding: '12px 10px', textAlign: 'center', borderRight: '1px solid var(--sp-border)' }}>
                <span className="sp-num" style={{ fontSize: 11, fontWeight: 700, color: 'var(--sp-text-light)' }}>02</span>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--sp-navy-950)' }}>CONFIGURE</div>
              </div>
              <div style={{ padding: '12px 10px', textAlign: 'center', borderRight: '1px solid var(--sp-border)' }}>
                <span className="sp-num" style={{ fontSize: 11, fontWeight: 700, color: 'var(--sp-text-light)' }}>03</span>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--sp-navy-950)' }}>SELL</div>
              </div>
              <div style={{ padding: '12px 10px', textAlign: 'center', borderRight: '1px solid var(--sp-border)' }}>
                <span className="sp-num" style={{ fontSize: 11, fontWeight: 700, color: 'var(--sp-text-light)' }}>04</span>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--sp-navy-950)' }}>TRACK</div>
              </div>
              <div style={{ padding: '12px 10px', textAlign: 'center' }}>
                <span className="sp-num" style={{ fontSize: 11, fontWeight: 700, color: 'var(--sp-text-light)' }}>05</span>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--sp-navy-950)' }}>GROW</div>
              </div>
            </div>
          </div>
        </section>

        {/* Vertical Operational Timeline */}
        <section className="sp-section sp-section-soft" style={{ paddingTop: 20 }} aria-label="Step-by-Step Workflow Timeline">
          <div className="sp-container">
            <div className="sp-timeline-wrap">

              {/* Step 01: CREATE */}
              <div id="step-01" className="sp-timeline-node">
                <div className="sp-timeline-marker">
                  <span>01</span>
                </div>
                <div className="sp-timeline-content">
                  <div className="sp-step-text-col">
                    <div className="sp-editorial-eyebrow">
                      <span>01 / CREATE</span>
                    </div>
                    <h2 className="sp-editorial-title" style={{ fontSize: 24, marginBottom: 12 }}>
                      Create your business workspace
                    </h2>
                    <p className="sp-editorial-body" style={{ fontSize: 14.5, marginBottom: 18 }}>
                      Sign up with your store name, business email, contact details, and optional logo. StockPro provisions a private tenant workspace where your catalog and transaction records are isolated and encrypted from day one.
                    </p>
                    <ul className="sp-editorial-checklist">
                      <li className="sp-editorial-check-item">
                        <span className="sp-check-bullet"><CheckIcon size={12} /></span>
                        <span>Instant multi-tenant workspace initialization</span>
                      </li>
                      <li className="sp-editorial-check-item">
                        <span className="sp-check-bullet"><CheckIcon size={12} /></span>
                        <span>Preconfigured local currency (UGX) and receipt branding</span>
                      </li>
                      <li className="sp-editorial-check-item">
                        <span className="sp-check-bullet"><CheckIcon size={12} /></span>
                        <span>Root owner credentials established with full administrative rights</span>
                      </li>
                    </ul>
                  </div>

                  {/* UI Representation: Setup Card */}
                  <div className="sp-editorial-visual">
                    <div style={{ backgroundColor: 'var(--sp-navy-900)', padding: '10px 14px', borderBottom: '1px solid var(--sp-navy-800)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#FFFFFF' }}>WORKSPACE PROVISIONING</span>
                      <span className="sp-num" style={{ fontSize: 10, color: '#10B981' }}>&bull; Provisioned</span>
                    </div>
                    <div style={{ padding: 16, backgroundColor: 'var(--sp-off-white)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ background: '#FFFFFF', padding: 12, borderRadius: 6, border: '1px solid var(--sp-border)' }}>
                        <div style={{ fontSize: 11, color: '#64748B' }}>Business Entity Name</div>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 14 }}>Zziwa Retailers &amp; Wholesale Ltd</div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div style={{ background: '#FFFFFF', padding: 10, borderRadius: 6, border: '1px solid var(--sp-border)' }}>
                          <div style={{ fontSize: 10.5, color: '#64748B' }}>Operating Currency</div>
                          <div className="sp-num" style={{ fontWeight: 700, color: '#0F172A', fontSize: 13 }}>UGX (Uganda)</div>
                        </div>
                        <div style={{ background: '#FFFFFF', padding: 10, borderRadius: 6, border: '1px solid var(--sp-border)' }}>
                          <div style={{ fontSize: 10.5, color: '#64748B' }}>Branch Architecture</div>
                          <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 13 }}>Main Terminal #01</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 02: CONFIGURE */}
              <div id="step-02" className="sp-timeline-node">
                <div className="sp-timeline-marker">
                  <span>02</span>
                </div>
                <div className="sp-timeline-content">
                  <div className="sp-step-text-col">
                    <div className="sp-editorial-eyebrow">
                      <span>02 / CONFIGURE</span>
                    </div>
                    <h2 className="sp-editorial-title" style={{ fontSize: 24, marginBottom: 12 }}>
                      Configure catalog &amp; auto-SKU rules
                    </h2>
                    <p className="sp-editorial-body" style={{ fontSize: 14.5, marginBottom: 18 }}>
                      Populate your products with categories, auto-generated SKU identifiers, buying costs, and retail selling prices. Set minimum reorder points so the system notifies your team before popular items run dry.
                    </p>
                    <ul className="sp-editorial-checklist">
                      <li className="sp-editorial-check-item">
                        <span className="sp-check-bullet"><CheckIcon size={12} /></span>
                        <span>Auto-SKU generator with convention rules (`TEL-`, `ACC-`, `PER-`)</span>
                      </li>
                      <li className="sp-editorial-check-item">
                        <span className="sp-check-bullet"><CheckIcon size={12} /></span>
                        <span>Dual price entry: wholesale buying cost vs cashier retail rate</span>
                      </li>
                      <li className="sp-editorial-check-item">
                        <span className="sp-check-bullet"><CheckIcon size={12} /></span>
                        <span>Individual item threshold trigger limits for low-stock alarms</span>
                      </li>
                    </ul>
                  </div>

                  {/* UI Representation: Product Form */}
                  <div className="sp-editorial-visual">
                    <div style={{ backgroundColor: 'var(--sp-navy-900)', padding: '10px 14px', borderBottom: '1px solid var(--sp-navy-800)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#FFFFFF' }}>CATALOG ITEM DEFINITION</span>
                      <span className="sp-num" style={{ fontSize: 10, color: '#93C5FD' }}>Auto-SKU Active</span>
                    </div>
                    <div style={{ padding: 16, backgroundColor: 'var(--sp-off-white)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
                        <div style={{ background: '#FFFFFF', padding: 10, borderRadius: 6, border: '1px solid var(--sp-border)' }}>
                          <div style={{ fontSize: 10.5, color: '#64748B' }}>Product Name</div>
                          <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 13 }}>Samsung Galaxy A54 128GB</div>
                        </div>
                        <div style={{ background: '#FFFFFF', padding: 10, borderRadius: 6, border: '1px solid var(--sp-border)' }}>
                          <div style={{ fontSize: 10.5, color: '#64748B' }}>Auto SKU</div>
                          <div className="sp-num" style={{ fontWeight: 700, color: 'var(--sp-accent)', fontSize: 13 }}>TEL-7721</div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                        <div style={{ background: '#FFFFFF', padding: 8, borderRadius: 6, border: '1px solid var(--sp-border)' }}>
                          <div style={{ fontSize: 10, color: '#64748B' }}>Cost Price</div>
                          <div className="sp-num" style={{ fontWeight: 600, fontSize: 12 }}>UGX 820,000</div>
                        </div>
                        <div style={{ background: '#FFFFFF', padding: 8, borderRadius: 6, border: '1px solid var(--sp-border)' }}>
                          <div style={{ fontSize: 10, color: '#64748B' }}>Selling Price</div>
                          <div className="sp-num" style={{ fontWeight: 700, color: '#0F172A', fontSize: 12 }}>UGX 980,000</div>
                        </div>
                        <div style={{ background: '#FFFFFF', padding: 8, borderRadius: 6, border: '1px solid var(--sp-border)' }}>
                          <div style={{ fontSize: 10, color: '#64748B' }}>Min Threshold</div>
                          <div className="sp-num" style={{ fontWeight: 700, color: '#DC2626', fontSize: 12 }}>10 units</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 03: SELL */}
              <div id="step-03" className="sp-timeline-node">
                <div className="sp-timeline-marker">
                  <span>03</span>
                </div>
                <div className="sp-timeline-content">
                  <div className="sp-step-text-col">
                    <div className="sp-editorial-eyebrow">
                      <span>03 / SELL</span>
                    </div>
                    <h2 className="sp-editorial-title" style={{ fontSize: 24, marginBottom: 12 }}>
                      Ring up transactions on the POS counter
                    </h2>
                    <p className="sp-editorial-body" style={{ fontSize: 14.5, marginBottom: 18 }}>
                      Cashiers sign in to designated register shifts. Scan barcodes or select products by search, choose payment methods (Cash, Mobile Money, Card), and print customer receipts. Quantities decrement immediately across the network.
                    </p>
                    <ul className="sp-editorial-checklist">
                      <li className="sp-editorial-check-item">
                        <span className="sp-check-bullet"><CheckIcon size={12} /></span>
                        <span>Zero double-selling: stock balances decrement with every confirmed order</span>
                      </li>
                      <li className="sp-editorial-check-item">
                        <span className="sp-check-bullet"><CheckIcon size={12} /></span>
                        <span>Flexible split payments and immediate receipt generation</span>
                      </li>
                      <li className="sp-editorial-check-item">
                        <span className="sp-check-bullet"><CheckIcon size={12} /></span>
                        <span>Cashier shift opening float and closing drawer handoffs</span>
                      </li>
                    </ul>
                  </div>

                  {/* UI Representation: POS Terminal / Receipt */}
                  <div className="sp-editorial-visual">
                    <div style={{ backgroundColor: 'var(--sp-navy-900)', padding: '10px 14px', borderBottom: '1px solid var(--sp-navy-800)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#FFFFFF' }}>COUNTER REGISTER TERMINAL</span>
                      <span className="sp-num" style={{ fontSize: 10, color: '#A5F3FC' }}>Shift: Sarah N.</span>
                    </div>
                    <div style={{ padding: 16, backgroundColor: 'var(--sp-white)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '1px solid var(--sp-border)', fontSize: 11.5, color: '#64748B' }}>
                        <span>Cart Summary (3 Items)</span>
                        <span className="sp-num">Receipt #0941</span>
                      </div>
                      <div style={{ padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>1x Logitech MX Master 3S</span>
                          <span className="sp-num bold">UGX 420,000</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>2x USB-C Braided Heavy Cable</span>
                          <span className="sp-num bold">UGX 70,000</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>1x SanDisk Ultra 128GB Flash</span>
                          <span className="sp-num bold">UGX 65,000</span>
                        </div>
                      </div>
                      <div style={{ borderTop: '1px solid var(--sp-border)', paddingTop: 8, marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11.5, color: '#64748B' }}>Amount Tendered (Cash)</span>
                        <span className="sp-num" style={{ fontSize: 16, fontWeight: 800, color: 'var(--sp-navy-950)' }}>
                          UGX 555,000
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 04: TRACK */}
              <div id="step-04" className="sp-timeline-node">
                <div className="sp-timeline-marker">
                  <span>04</span>
                </div>
                <div className="sp-timeline-content">
                  <div className="sp-step-text-col">
                    <div className="sp-editorial-eyebrow">
                      <span>04 / TRACK</span>
                    </div>
                    <h2 className="sp-editorial-title" style={{ fontSize: 24, marginBottom: 12 }}>
                      Ingest supplier restocks &amp; audit trails
                    </h2>
                    <p className="sp-editorial-body" style={{ fontSize: 14.5, marginBottom: 18 }}>
                      Log purchase orders to suppliers, receive deliveries with one click, and watch catalog stock counts automatically increment. Any manual adjustments or damaged goods are logged with staff attribution and reason notes.
                    </p>
                    <ul className="sp-editorial-checklist">
                      <li className="sp-editorial-check-item">
                        <span className="sp-check-bullet"><CheckIcon size={12} /></span>
                        <span>Complete supplier purchase ledger with vendor balances</span>
                      </li>
                      <li className="sp-editorial-check-item">
                        <span className="sp-check-bullet"><CheckIcon size={12} /></span>
                        <span>Instant quantity ingestion upon delivery note confirmation</span>
                      </li>
                      <li className="sp-editorial-check-item">
                        <span className="sp-check-bullet"><CheckIcon size={12} /></span>
                        <span>Irreversible audit trail: trace every unit from receipt to checkout</span>
                      </li>
                    </ul>
                  </div>

                  {/* UI Representation: PO & Audit Row */}
                  <div className="sp-editorial-visual">
                    <div style={{ backgroundColor: 'var(--sp-navy-900)', padding: '10px 14px', borderBottom: '1px solid var(--sp-navy-800)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#FFFFFF' }}>PROCUREMENT AUDIT LOG</span>
                      <span className="sp-num" style={{ fontSize: 10, color: '#93C5FD' }}>PO-2026-081</span>
                    </div>
                    <div style={{ padding: 16, backgroundColor: 'var(--sp-off-white)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#FFFFFF', borderRadius: 6, border: '1px solid var(--sp-border)' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 12.5 }}>HP LaserJet Toner 85A</div>
                          <div style={{ fontSize: 10.5, color: '#64748B' }}>Supplier: East Africa Tech Supplies</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="sp-num" style={{ fontWeight: 700, color: '#059669', fontSize: 12.5 }}>+15 units</div>
                          <span className="sp-badge sp-badge-success" style={{ fontSize: 9.5 }}>Received</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#FFFFFF', borderRadius: 6, border: '1px solid var(--sp-border)' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 12.5 }}>65W GaN Fast Charger</div>
                          <div style={{ fontSize: 10.5, color: '#64748B' }}>Reason: Damaged in transit</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="sp-num" style={{ fontWeight: 700, color: '#DC2626', fontSize: 12.5 }}>-2 units</div>
                          <span className="sp-badge sp-badge-warning" style={{ fontSize: 9.5 }}>Adjusted</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 05: GROW */}
              <div id="step-05" className="sp-timeline-node">
                <div className="sp-timeline-marker">
                  <span>05</span>
                </div>
                <div className="sp-timeline-content">
                  <div className="sp-step-text-col">
                    <div className="sp-editorial-eyebrow">
                      <span>05 / GROW</span>
                    </div>
                    <h2 className="sp-editorial-title" style={{ fontSize: 24, marginBottom: 12 }}>
                      Inspect financial reports &amp; delegate roles
                    </h2>
                    <p className="sp-editorial-body" style={{ fontSize: 14.5, marginBottom: 18 }}>
                      Review end-of-day gross turnover, cashier shift balancing, and gross profit margins. Invite additional managers or accountants and delegate permissions safely so your business scales smoothly.
                    </p>
                    <ul className="sp-editorial-checklist">
                      <li className="sp-editorial-check-item">
                        <span className="sp-check-bullet"><CheckIcon size={12} /></span>
                        <span>Daily reconciliation report: cash drawer count vs register recorded total</span>
                      </li>
                      <li className="sp-editorial-check-item">
                        <span className="sp-check-bullet"><CheckIcon size={12} /></span>
                        <span>Staff permission boundaries: Owner, Admin, Manager, Cashier</span>
                      </li>
                      <li className="sp-editorial-check-item">
                        <span className="sp-check-bullet"><CheckIcon size={12} /></span>
                        <span>Integrated AI business assistant for rapid turnover inquiries</span>
                      </li>
                    </ul>
                  </div>

                  {/* UI Representation: Reports & Role Matrix */}
                  <div className="sp-editorial-visual">
                    <div style={{ backgroundColor: 'var(--sp-navy-900)', padding: '10px 14px', borderBottom: '1px solid var(--sp-navy-800)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#FFFFFF' }}>EXECUTIVE VERIFICATION</span>
                      <span className="sp-num" style={{ fontSize: 10, color: '#10B981' }}>Shift Balanced</span>
                    </div>
                    <div style={{ padding: 16, backgroundColor: 'var(--sp-off-white)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <div style={{ background: '#FFFFFF', padding: 10, borderRadius: 6, border: '1px solid var(--sp-border)' }}>
                          <div style={{ fontSize: 10.5, color: '#64748B' }}>Total Day Volume</div>
                          <div className="sp-num" style={{ fontWeight: 800, color: '#0F172A', fontSize: 15 }}>UGX 18,450,000</div>
                        </div>
                        <div style={{ background: '#FFFFFF', padding: 10, borderRadius: 6, border: '1px solid var(--sp-border)' }}>
                          <div style={{ fontSize: 10.5, color: '#64748B' }}>Gross Profit Margin</div>
                          <div className="sp-num" style={{ fontWeight: 800, color: '#059669', fontSize: 15 }}>32.4%</div>
                        </div>
                      </div>
                      <div style={{ background: '#FFFFFF', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--sp-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 12 }}>Cashier: Sarah N. &bull; Shift #01</div>
                          <div style={{ fontSize: 10.5, color: '#64748B' }}>Drawer cash match: UGX 8,420,000</div>
                        </div>
                        <span className="sp-badge sp-badge-success" style={{ fontSize: 9.5 }}>Verified</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Strategic Call to Action */}
        <CTASection
          eyebrow="READY TO OPERATE"
          title="See how simple business control can be."
          subtitle="Set up your store today and start ringing up transactions with real-time inventory precision."
          primaryCtaText="Register Your Business"
          primaryCtaHref="/register"
          secondaryCtaText="View Pricing Plans"
          secondaryCtaHref="/pricing"
        />
      </main>

      <MarketingFooter />
    </div>
  );
}
