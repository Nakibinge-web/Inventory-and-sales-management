import React, { useState, useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import MarketingHeader from '../../components/marketing/MarketingHeader';
import MarketingFooter from '../../components/marketing/MarketingFooter';
import SectionHeading from '../../components/marketing/SectionHeading';
import FAQAccordion from '../../components/marketing/FAQAccordion';
import CTASection from '../../components/marketing/CTASection';
import NexumPayCheckoutModal from '../../components/marketing/NexumPayCheckoutModal';
import { MarketingLink } from '../../utils/navigation';
import { usePageMeta } from '../../utils/seo';
import { CheckIcon, ArrowRightIcon } from '../../components/marketing/Icons';

export const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'For single-store retailers and boutique shops getting organized.',
    monthlyPrice: 'UGX 1,000',
    annualPrice: 'UGX 1,000',
    period: '/ month',
    featured: false,
    ctaText: 'Start with Starter',
    ctaHref: '/checkout?plan=starter',
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
    monthlyPrice: 'UGX 2,000',
    annualPrice: 'UGX 2,000',
    period: '/ month',
    featured: true,
    ctaText: 'Get Started with Business',
    ctaHref: '/checkout?plan=business',
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
    'Simple, predictable pricing for retail and wholesale businesses. Subscribe with MTN Mobile Money or Airtel Money via NexumPay.'
  );

  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'annual'
  const [checkoutPlan, setCheckoutPlan] = useState(null);

  useEffect(() => {
    AOS.init({
      duration: 750,
      easing: 'ease-out-cubic',
      once: false,
      mirror: true,
      offset: 80,
      throttleDelay: 16,
    });
    AOS.refresh();

    const scrollToFaq = () => {
      if (window.location.hash === '#faq') {
        const el = document.getElementById('faq');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };

    scrollToFaq();
    const t1 = setTimeout(scrollToFaq, 80);
    const t2 = setTimeout(scrollToFaq, 250);

    window.addEventListener('popstate', scrollToFaq);
    window.addEventListener('hashchange', scrollToFaq);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('popstate', scrollToFaq);
      window.removeEventListener('hashchange', scrollToFaq);
    };
  }, []);

  return (
    <div className="marketing-root">
      <MarketingHeader />

      <main id="main-content">
        {/* Hero Section */}
        <section className="sp-section sp-section-white sp-pricing-hero-section" aria-labelledby="pricing-heading">
          <div className="sp-container">
            <div data-aos="fade-up">
              <SectionHeading
                eyebrow="TRANSPARENT PLANS"
                title="Pricing for different business packages."
                subtitle="No setup charges. Choose your business package and pay securely via Mobile Money."
                align="center"
                maxWidth="100%"
                className="sp-pricing-page-heading"
              />
            </div>

            {/* Monthly / Annually Toggle Container */}
            <div className="sp-pricing-billing-wrap" data-aos="fade-up" data-aos-delay="100">
              <div className="sp-pricing-billing-box" role="group" aria-label="Billing frequency selection">
                <div className="sp-pricing-billing-banner">
                  Save 15% on Annual Billing
                </div>
                <div className="sp-pricing-billing-options">
                  <button
                    type="button"
                    aria-pressed={billingCycle === 'monthly'}
                    className={`sp-pricing-billing-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
                    onClick={() => setBillingCycle('monthly')}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    aria-pressed={billingCycle === 'annual'}
                    className={`sp-pricing-billing-btn ${billingCycle === 'annual' ? 'active' : ''}`}
                    onClick={() => setBillingCycle('annual')}
                  >
                    Annually
                  </button>
                </div>
              </div>
            </div>

            {/* Pricing Cards Grid - Software Specification Format */}
            <div className="sp-pricing-grid" role="list" aria-label="Subscription Plans">
              {PLANS.map((plan, index) => {
                const price = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
                const isPayablePlan = plan.id === 'starter' || plan.id === 'business';

                return (
                  <div
                    key={plan.id}
                    className={`sp-pricing-doc-card ${plan.featured ? 'featured' : ''}`}
                    role="listitem"
                    data-aos="fade-up"
                    data-aos-delay={index * 110}
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
                      {isPayablePlan ? (
                        <button
                          type="button"
                          onClick={() => setCheckoutPlan(plan.id)}
                          className={`sp-btn ${plan.featured ? 'sp-btn-primary' : 'sp-btn-secondary'}`}
                          style={{ width: '100%' }}
                        >
                          <span>{plan.ctaText}</span>
                          <ArrowRightIcon size={14} />
                        </button>
                      ) : (
                        <MarketingLink
                          href={plan.ctaHref}
                          className={`sp-btn ${plan.featured ? 'sp-btn-primary' : 'sp-btn-secondary'}`}
                          style={{ width: '100%' }}
                        >
                          <span>{plan.ctaText}</span>
                          <ArrowRightIcon size={14} />
                        </MarketingLink>
                      )}
                    </div>
                  </div>
                );
              })}
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

      {/* Custom NexumPay Subscription Checkout Modal */}
      <NexumPayCheckoutModal
        isOpen={Boolean(checkoutPlan)}
        isModal={true}
        initialPlanId={checkoutPlan || 'starter'}
        initialBillingCycle={billingCycle}
        onClose={() => setCheckoutPlan(null)}
      />

      <MarketingFooter />
    </div>
  );
}
