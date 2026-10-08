import React, { useState } from 'react';
import MarketingHeader from '../../components/marketing/MarketingHeader';
import MarketingFooter from '../../components/marketing/MarketingFooter';
import SectionHeading from '../../components/marketing/SectionHeading';
import FAQAccordion from '../../components/marketing/FAQAccordion';
import CTASection from '../../components/marketing/CTASection';
import { MarketingLink } from '../../utils/navigation';
import { usePageMeta } from '../../utils/seo';
import { CheckIcon, ArrowRightIcon } from '../../components/marketing/Icons';

export const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'For single-store retailers and boutique shops getting organized.',
    monthlyPrice: 'UGX 75,000',
    annualPrice: 'UGX 64,000',
    period: '/ month',
    featured: false,
    ctaText: 'Start with Starter',
    ctaHref: '/register',
    features: [
      'Up to 500 catalog items',
      '1 active POS checkout terminal',
      '2 staff accounts (Owner & Cashier)',
      'Automated SKU generation',
      'Real-time stock deduction on sale',
      'Low-stock threshold alerts',
      'Thermal receipt printing',
      'Standard business support',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    badge: 'Recommended',
    tagline: 'For growing retail stores, supermarkets, and wholesale businesses.',
    monthlyPrice: 'UGX 180,000',
    annualPrice: 'UGX 150,000',
    period: '/ month',
    featured: true,
    ctaText: 'Get Started with Business',
    ctaHref: '/register',
    features: [
      'Unlimited catalog items & categories',
      'Unlimited POS sales transactions',
      'Up to 10 staff accounts with custom roles',
      'Granular permissions (sales, inventory, audit)',
      'Supplier purchase orders & vendor dues',
      'Proforma and formal tax invoices',
      'Daily, weekly & monthly financial reports',
      'Built-in AI business assistant queries',
      'Priority email and phone support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'For high-volume distributors, chains, and multi-branch operations.',
    monthlyPrice: 'Custom',
    annualPrice: 'Custom',
    period: 'billed annually',
    featured: false,
    ctaText: 'Contact Sales',
    ctaHref: '/contact',
    features: [
      'Multi-branch tenant architecture',
      'Unlimited users, registers, and items',
      'Custom role & permission matrices',
      'Dedicated database isolation',
      'Catalog migration & staff onboarding',
      'Custom invoice branding templates',
      'Direct account manager & SLA guarantee',
    ],
  },
];

export default function PricingPage() {
  usePageMeta(
    'StockPro Pricing & Plans — Transparent Business Tiers',
    'Simple, predictable pricing for retail and wholesale businesses. Choose Starter, Business, or Enterprise tiers with zero hidden setup fees.'
  );

  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'annual'

  return (
    <div className="marketing-root">
      <MarketingHeader />

      <main id="main-content">
        {/* Hero Section */}
        <section className="sp-section sp-section-white" style={{ paddingBottom: 32 }} aria-labelledby="pricing-heading">
          <div className="sp-container">
            <SectionHeading
              eyebrow="TRANSPARENT PLANS"
              title="Predictable pricing for every stage of your business."
              subtitle="No hidden setup charges or surprise fees. Choose the tier that fits your catalog size and operational team."
              align="center"
            />

            {/* Monthly / Annual Toggle */}
            <div className="sp-billing-toggle" role="group" aria-label="Billing frequency selection">
              <div className="sp-toggle-pill">
                <button
                  type="button"
                  className={`sp-toggle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
                  onClick={() => setBillingCycle('monthly')}
                >
                  Monthly billing
                </button>
                <button
                  type="button"
                  className={`sp-toggle-btn ${billingCycle === 'annual' ? 'active' : ''}`}
                  onClick={() => setBillingCycle('annual')}
                >
                  Annual billing
                </button>
              </div>
              <span className="sp-save-tag">Save 15% on Annual</span>
            </div>

            {/* Pricing Cards Grid - Software Specification Format */}
            <div className="sp-pricing-grid" role="list" aria-label="Subscription Plans">
              {PLANS.map((plan) => {
                const price = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
                return (
                  <div
                    key={plan.id}
                    className={`sp-pricing-doc-card ${plan.featured ? 'featured' : ''}`}
                    role="listitem"
                  >
                    <div className="sp-doc-header">
                      <div className="sp-doc-tier">
                        {plan.featured ? 'RECOMMENDED TIER' : 'STANDARD SPECIFICATION'}
                      </div>
                      <h3 className="sp-doc-title">{plan.name}</h3>
                      <p className="sp-doc-desc">{plan.tagline}</p>
                    </div>

                    <div className="sp-doc-pricing-box">
                      <span className="sp-doc-price">{price}</span>
                      <span className="sp-doc-period">{price === 'Custom' ? '' : plan.period}</span>
                    </div>

                    <div className="sp-doc-specs-label">Includes System Capabilities</div>
                    <ul className="sp-doc-specs-list">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="sp-doc-spec-item">
                          <span style={{ color: 'var(--sp-navy-900)', flexShrink: 0, marginTop: 1 }}>
                            <CheckIcon size={14} />
                          </span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="sp-doc-cta-wrap">
                      <MarketingLink
                        href={plan.ctaHref}
                        className={`sp-btn ${plan.featured ? 'sp-btn-primary' : 'sp-btn-secondary'}`}
                        style={{ width: '100%' }}
                      >
                        <span>{plan.ctaText}</span>
                        <ArrowRightIcon size={14} />
                      </MarketingLink>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Feature Comparison Matrix */}
            <div className="sp-comparison-table-wrap">
              <table className="sp-comparison-table" aria-label="Detailed Plan Comparison">
                <thead>
                  <tr>
                    <th style={{ width: '40%' }}>Core Capabilities</th>
                    <th style={{ width: '20%' }}>Starter</th>
                    <th style={{ width: '20%' }}>Business</th>
                    <th style={{ width: '20%' }}>Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Catalog Items Limit</strong></td>
                    <td className="sp-num">Up to 500 items</td>
                    <td className="sp-num">Unlimited</td>
                    <td className="sp-num">Unlimited</td>
                  </tr>
                  <tr>
                    <td><strong>Point of Sale (POS) Terminals</strong></td>
                    <td>1 Register</td>
                    <td>Multi-Register</td>
                    <td>Multi-Branch</td>
                  </tr>
                  <tr>
                    <td><strong>Staff Accounts Included</strong></td>
                    <td>2 Users</td>
                    <td>Up to 10 Users</td>
                    <td>Unlimited Users</td>
                  </tr>
                  <tr>
                    <td><strong>Custom Roles &amp; Permissions</strong></td>
                    <td>Standard</td>
                    <td>Full Granular Control</td>
                    <td>Custom Enterprise Matrix</td>
                  </tr>
                  <tr>
                    <td><strong>Stock Movements Audit Trail</strong></td>
                    <td><CheckIcon size={14} /> Basic</td>
                    <td><CheckIcon size={14} /> Full Reason Codes</td>
                    <td><CheckIcon size={14} /> Full Reason Codes</td>
                  </tr>
                  <tr>
                    <td><strong>Supplier Orders &amp; Purchasing</strong></td>
                    <td>Standard logging</td>
                    <td>Full Supplier Ledger</td>
                    <td>Full Supplier Ledger</td>
                  </tr>
                  <tr>
                    <td><strong>Invoicing (Proforma &amp; Tax)</strong></td>
                    <td>Thermal receipts</td>
                    <td>Receipts &amp; Invoices</td>
                    <td>Custom Branded Invoices</td>
                  </tr>
                  <tr>
                    <td><strong>Financial &amp; Shift Reports</strong></td>
                    <td>Daily sales</td>
                    <td>Daily, Weekly, Monthly</td>
                    <td>Custom Exports &amp; Reports</td>
                  </tr>
                  <tr>
                    <td><strong>AI Business Assistant</strong></td>
                    <td>&mdash;</td>
                    <td><CheckIcon size={14} /> Included</td>
                    <td><CheckIcon size={14} /> Custom Prompts</td>
                  </tr>
                  <tr>
                    <td><strong>Data Partitioning &amp; Security</strong></td>
                    <td>Tenant Partitioned</td>
                    <td>Tenant Partitioned</td>
                    <td>Dedicated Isolation</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        </section>

        {/* Pricing FAQ Section */}
        <FAQAccordion
          title="Frequently Asked Pricing &amp; System Questions"
          subtitle="Everything you need to know about accounts, plans, billing, and data separation."
        />

        {/* Strategic Call to Action */}
        <CTASection
          eyebrow="READY TO CHOOSE"
          title="Start with the tier that fits today. Scale anytime."
          subtitle="Register your business in under two minutes. You can adjust your plan as your inventory catalog grows."
          primaryCtaText="Register Your Business"
          primaryCtaHref="/register"
          secondaryCtaText="Talk to Sales"
          secondaryCtaHref="/contact"
        />
      </main>

      <MarketingFooter />
    </div>
  );
}
