import React, { useMemo } from 'react';
import MarketingHeader from '../../components/marketing/MarketingHeader';
import MarketingFooter from '../../components/marketing/MarketingFooter';
import NexumPayCheckoutModal from '../../components/marketing/NexumPayCheckoutModal';
import { MarketingLink } from '../../utils/navigation';
import { usePageMeta } from '../../utils/seo';

export default function CheckoutPage() {
  usePageMeta(
    'Subscription Checkout — NexumPay Mobile Money | StockPro',
    'Complete your StockPro subscription securely with MTN Mobile Money or Airtel Money via NexumPay Uganda.'
  );

  const { initialPlan, initialCycle } = useMemo(() => {
    if (typeof window === 'undefined') {
      return { initialPlan: 'starter', initialCycle: 'monthly' };
    }
    const params = new URLSearchParams(window.location.search);
    const p = (params.get('plan') || '').toLowerCase();
    const c = (params.get('cycle') || '').toLowerCase();

    return {
      initialPlan: p === 'business' ? 'business' : 'starter',
      initialCycle: c === 'annual' ? 'annual' : 'monthly',
    };
  }, []);

  return (
    <div className="sp-checkout-page">
      <MarketingHeader />

      <main className="sp-checkout-container">
        <MarketingLink href="/pricing" className="sp-checkout-back">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Back to Plans &amp; Pricing</span>
        </MarketingLink>

        <NexumPayCheckoutModal
          isOpen={true}
          isModal={false}
          initialPlanId={initialPlan}
          initialBillingCycle={initialCycle}
        />
      </main>

      <MarketingFooter />
    </div>
  );
}
