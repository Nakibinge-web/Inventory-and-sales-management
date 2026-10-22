import React, { useState } from 'react';
import { MarketingLink } from '../../utils/navigation';
import { CheckIcon, ArrowRightIcon } from './Icons';

const PRICING_PLANS = [
  {
    id: 'trial',
    name: 'Free Trial',
    badge: '14 Days Free',
    badgeType: 'neutral',
    tagline: 'Test the full system in your shop with zero financial risk.',
    monthlyPrice: 'UGX 0',
    annualPrice: 'UGX 0',
    period: '/ 14 days',
    featured: false,
    ctaText: 'Start Free Trial',
    ctaHref: '/register',
    btnVariant: 'sp-btn-secondary',
    features: [
      'Up to 100 catalog items',
      '1 active POS counter register',
      '1 cashier + 1 owner account',
      'Instant barcode scanning',
      'Thermal receipt printing',
      'Real-time stock deduction',
      'No credit card required',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    badge: 'Solo Retailers',
    badgeType: 'neutral',
    tagline: 'For boutique shops, electronics counters, and solo store owners.',
    monthlyPrice: 'UGX 75,000',
    annualPrice: 'UGX 64,000',
    period: '/ month',
    featured: false,
    ctaText: 'Get Started',
    ctaHref: '/register',
    btnVariant: 'sp-btn-secondary',
    features: [
      'Up to 1,000 catalog items',
      '2 active POS registers',
      '3 staff accounts with roles',
      'Low-stock threshold alerts',
      'Customer accounts & receipts',
      'Automated SKU generation',
      'Daily sales & profit summaries',
      'Email & WhatsApp support',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    badge: 'Most Popular',
    badgeType: 'popular',
    tagline: 'For supermarkets, high-traffic retailers, and wholesale depots.',
    monthlyPrice: 'UGX 180,000',
    annualPrice: 'UGX 150,000',
    period: '/ month',
    featured: true,
    ctaText: 'Start Business Plan',
    ctaHref: '/register',
    btnVariant: 'sp-btn-primary',
    features: [
      'Unlimited catalog items',
      'Unlimited POS transactions',
      'Up to 10 staff accounts & shifts',
      'Granular cashier permissions',
      'Supplier purchase orders & dues',
      'Customer credit ledgers & tax bills',
      'Built-in AI inventory assistant',
      'Priority phone & on-site support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    badge: 'Multi-Branch',
    badgeType: 'enterprise',
    tagline: 'For retail chains, multi-store brands, and large distribution hubs.',
    monthlyPrice: 'Custom',
    annualPrice: 'Custom',
    period: 'tailored billing',
    featured: false,
    ctaText: 'Talk to Sales',
    ctaHref: '/contact',
    btnVariant: 'sp-btn-secondary',
    features: [
      'Multi-branch central sync',
      'Unlimited stores & registers',
      'Inter-store stock transfers',
      'Custom roles & audit logs',
      'Dedicated database backup',
      'Free catalog migration service',
      'Staff onboarding & training',
      'Dedicated account manager & SLA',
    ],
  },
];

export default function PricingSection() {
  const [billingCycle, setBillingCycle] = useState('monthly');

  return (
    <section className="sp-landing-pricing-section" aria-labelledby="pricing-plans-heading">
      <div className="sp-container">
        {/* Header Area */}
        <div className="sp-pricing-header">
          <div className="sp-pricing-eyebrow">
            TRANSPARENT PLANS
          </div>

          <h2 id="pricing-plans-heading" className="sp-pricing-title">
            Simple, predictable pricing for every store
          </h2>

          <p className="sp-pricing-desc">
            Choose the plan that fits your current operational scale. Upgrade, downgrade, or cancel anytime with zero hidden fees.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="sp-billing-toggle-wrap">
            <div className="sp-billing-toggle" role="group" aria-label="Billing frequency toggle">
              <button
                type="button"
                className={`sp-toggle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
                onClick={() => setBillingCycle('monthly')}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                className={`sp-toggle-btn ${billingCycle === 'annual' ? 'active' : ''}`}
                onClick={() => setBillingCycle('annual')}
              >
                <span>Annual Billing</span>
                <span className="sp-save-badge">Save 18%</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 Cards in 1 Row: Card 1 | Card 2 | Card 3 | Card 4 */}
        <div className="sp-landing-pricing-grid" role="list" aria-label="Subscription Plans">
          {PRICING_PLANS.map((plan) => {
            const displayPrice = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;

            return (
              <div
                key={plan.id}
                className={`sp-landing-plan-card ${plan.featured ? 'featured' : ''}`}
                role="listitem"
              >
                {/* Popular or Tier Badge */}
                <div className="sp-plan-card-top">
                  <span className={`sp-plan-badge sp-plan-badge-${plan.badgeType}`}>
                    {plan.badge}
                  </span>
                  <h3 className="sp-plan-name">{plan.name}</h3>
                  <p className="sp-plan-tagline">{plan.tagline}</p>
                </div>

                {/* Price Display */}
                <div className="sp-plan-price-wrap">
                  <div className="sp-plan-price-row">
                    <span className="sp-plan-price">{displayPrice}</span>
                    <span className="sp-plan-period">{plan.period}</span>
                  </div>
                  {billingCycle === 'annual' && plan.id !== 'trial' && plan.id !== 'enterprise' && (
                    <div className="sp-plan-billing-note">Billed annually</div>
                  )}
                  {plan.id === 'trial' && (
                    <div className="sp-plan-billing-note">Zero risk, no card required</div>
                  )}
                </div>

                {/* CTA Button */}
                <div className="sp-plan-cta-wrap">
                  <MarketingLink
                    href={plan.ctaHref}
                    className={`sp-btn ${plan.btnVariant} sp-plan-btn`}
                  >
                    <span>{plan.ctaText}</span>
                    <ArrowRightIcon size={14} />
                  </MarketingLink>
                </div>

                {/* Feature List */}
                <div className="sp-plan-features-wrap">
                  <div className="sp-plan-features-label">WHAT'S INCLUDED:</div>
                  <ul className="sp-plan-features-list">
                    {plan.features.map((feat, i) => (
                      <li key={i} className="sp-plan-feature-item">
                        <span className="sp-plan-check-icon">
                          <CheckIcon size={12} />
                        </span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Comparison Note */}
        <div className="sp-pricing-bottom-bar">
          <span>Need custom hardware integrations or enterprise multi-store consulting?</span>
          <MarketingLink href="/pricing" className="sp-pricing-link">
            <span>View Full Feature Comparison &amp; FAQs</span>
            <ArrowRightIcon size={14} />
          </MarketingLink>
        </div>
      </div>
    </section>
  );
}
