import React, { useState, useEffect, useRef } from 'react';
import MarketingHeader from '../../components/marketing/MarketingHeader';
import MarketingFooter from '../../components/marketing/MarketingFooter';
import { MarketingLink, navigateTo } from '../../utils/navigation';
import { usePageMeta } from '../../utils/seo';
import { CheckIcon, ArrowRightIcon } from '../../components/marketing/Icons';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const PLAN_DATA = {
  starter: {
    id: 'starter',
    name: 'Starter Plan',
    monthlyPrice: 10000,
    annualPrice: 100000,
    period: '/ month',
    tagline: 'Ideal for solo retailers and boutique shops.',
    features: [
      'Up to 500 catalog items',
      '1 active POS checkout terminal',
      '2 staff accounts (Owner & Cashier)',
      'Automated SKU generation',
      'Real-time stock deduction on sale',
      'Low-stock threshold alerts',
      'Thermal receipt printing',
    ],
  },
  business: {
    id: 'business',
    name: 'Business Plan',
    monthlyPrice: 180000,
    annualPrice: 1500000,
    period: '/ month',
    tagline: 'For supermarkets, high-traffic stores & wholesale depots.',
    features: [
      'Unlimited catalog items & categories',
      'Unlimited POS sales transactions',
      'Up to 10 staff accounts with custom roles',
      'Granular permissions & audit logs',
      'Supplier purchase orders & vendor dues',
      'Proforma & formal tax invoices',
      'Built-in AI business assistant',
      'Priority email & phone support',
    ],
  },
};

function formatUgx(amount) {
  return 'UGX ' + Number(amount).toLocaleString('en-US');
}

export default function CheckoutPage() {
  usePageMeta(
    'Checkout — MTN MoMo Direct Payment | StockPro',
    'Securely complete your subscription via MTN Mobile Money direct push payment with PIN authorization.'
  );

  // Parse query parameters
  const [selectedPlanId, setSelectedPlanId] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const p = (params.get('plan') || '').toLowerCase();
      if (p === 'business') return 'business';
    }
    return 'starter';
  });

  const [billingCycle, setBillingCycle] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const c = (params.get('cycle') || '').toLowerCase();
      if (c === 'annual') return 'annual';
    }
    return 'monthly';
  });

  // Customer Form state
  const [formData, setFormData] = useState(() => {
    let savedUser = null;
    try {
      const u = localStorage.getItem('user');
      if (u) savedUser = JSON.parse(u);
    } catch {}

    return {
      name: savedUser?.name || '',
      email: savedUser?.email || '',
      businessName: savedUser?.tenant?.name || '',
      phone: '',
    };
  });

  // Diagnostics & System status
  const [configStatus, setConfigStatus] = useState(null);

  // Transaction state
  // 'IDLE' | 'INITIATING' | 'AWAITING_PIN' | 'SUCCESSFUL' | 'FAILED'
  const [txState, setTxState] = useState('IDLE');
  const [txData, setTxData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(120);

  const pollIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);

  const currentPlan = PLAN_DATA[selectedPlanId] || PLAN_DATA.starter;
  const currentPrice = billingCycle === 'annual' ? currentPlan.annualPrice : currentPlan.monthlyPrice;

  // Fetch backend MoMo configuration status
  useEffect(() => {
    fetch(`${API}/momo/config-check`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.configuration) {
          setConfigStatus(data.configuration);
        }
      })
      .catch(() => {
        // Quiet fallback if offline
      });
  }, []);

  // Cleanup polling timers on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Handle form change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Start Countdown Timer
  const startTimer = () => {
    setTimerSeconds(120);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    timerIntervalRef.current = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeout = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (txState === 'AWAITING_PIN') {
      setTxState('FAILED');
      setErrorMessage('The authorization request timed out. Please verify your phone has signal and try again.');
    }
  };

  // Poll transaction status from backend
  const startPolling = (referenceId) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API}/momo/status/${referenceId}`);
        const data = await res.json();

        if (data && data.success) {
          const status = (data.status || '').toUpperCase();

          if (status === 'SUCCESSFUL') {
            clearInterval(pollIntervalRef.current);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            setTxState('SUCCESSFUL');
            setTxData(data.transaction);
          } else if (status === 'FAILED' || status === 'REJECTED' || status === 'TIMEOUT') {
            clearInterval(pollIntervalRef.current);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            setTxState('FAILED');
            setErrorMessage(data.transaction?.failure_reason || 'Payment was declined or cancelled on your mobile phone.');
          }
        }
      } catch (err) {
        // Polling network blip, retry next tick
      }
    }, 3000);
  };

  // Form submit -> Initiate Request to Pay
  const handleInitiatePayment = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMessage('Please enter a valid email address for your receipt.');
      return;
    }
    if (!formData.phone.trim() || formData.phone.trim().length < 9) {
      setErrorMessage('Please enter a valid MTN Mobile Money phone number.');
      return;
    }

    setTxState('INITIATING');

    try {
      const response = await fetch(`${API}/momo/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: selectedPlanId,
          billing_cycle: billingCycle,
          phone: formData.phone.trim(),
          customer_name: formData.name.trim(),
          customer_email: formData.email.trim(),
          business_name: formData.businessName.trim() || formData.name.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setTxState('FAILED');
        setErrorMessage(data.message || 'Failed to initiate payment. Please check your credentials.');
        return;
      }

      // Success initiating -> prompt sent to user's phone!
      setTxState('AWAITING_PIN');
      setTxData(data);
      startTimer();
      startPolling(data.reference_id);

    } catch (err) {
      setTxState('FAILED');
      setErrorMessage('Network connection error. Please verify the backend server is running at ' + API);
    }
  };

  const handleCancel = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setTxState('IDLE');
    setErrorMessage('');
  };

  return (
    <div className="sp-checkout-page">
      <MarketingHeader />

      <main className="sp-checkout-container">
        {/* Back Link */}
        <MarketingLink href="/pricing" className="sp-checkout-back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Plans & Pricing
        </MarketingLink>

        {/* Page Heading */}
        <div className="sp-checkout-header">
          <div className="sp-checkout-badge-row">
            <span className="sp-momo-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" />
              </svg>
              MTN MoMo Direct Checkout
            </span>
            {configStatus?.is_configured ? (
              <span className="sp-sandbox-pill">
                ✓ MoMo Sandbox Connected
              </span>
            ) : (
              <span className="sp-sandbox-pill" style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }}>
                Sandbox Mode (Awaiting .env credentials)
              </span>
            )}
          </div>
          <h1 className="sp-checkout-title">Complete Your Store Subscription</h1>
          <p className="sp-checkout-subtitle">
            Authorize payment instantly on your phone with your confidential MTN Mobile Money PIN. Zero setup fees, instant activation.
          </p>
        </div>

        {/* Configuration Notice if API credentials are empty in .env */}
        {configStatus && !configStatus.is_configured && (
          <div className="sp-alert-warning">
            <strong>Developer Notice:</strong> MTN MoMo API credentials are not yet configured in <code>backend/.env</code>.
            Please add your <code>MOMO_API_USER_ID</code>, <code>MOMO_API_KEY</code>, and <code>MOMO_COLLECTION_SUBSCRIPTION_KEY</code> to enable live sandbox transactions.
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && txState !== 'AWAITING_PIN' && (
          <div className="sp-alert-error" role="alert">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <div>
              <strong>Payment Error:</strong> {errorMessage}
            </div>
          </div>
        )}

        {/* Success Screen Card (if completed) */}
        {txState === 'SUCCESSFUL' && (
          <div className="sp-checkout-card sp-success-card">
            <div className="sp-success-icon-wrap">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h2 className="sp-checkout-title" style={{ fontSize: '28px' }}>Payment Approved & Confirmed!</h2>
            <p className="sp-checkout-subtitle" style={{ margin: '0 auto 20px', textAlign: 'center' }}>
              Your payment was received successfully through MTN Mobile Money. Your <strong>{currentPlan.name}</strong> subscription is now active!
            </p>

            <div className="sp-receipt-box">
              <div className="sp-receipt-row">
                <span className="sp-receipt-label">Subscription Tier:</span>
                <span className="sp-receipt-value">{currentPlan.name} ({billingCycle === 'annual' ? 'Annual' : 'Monthly'})</span>
              </div>
              <div className="sp-receipt-row">
                <span className="sp-receipt-label">Amount Paid:</span>
                <span className="sp-receipt-value" style={{ color: '#059669', fontSize: '15px' }}>{formatUgx(currentPrice)}</span>
              </div>
              <div className="sp-receipt-row">
                <span className="sp-receipt-label">Subscriber Phone:</span>
                <span className="sp-receipt-value">{txData?.customer_phone || formData.phone}</span>
              </div>
              <div className="sp-receipt-row">
                <span className="sp-receipt-label">MTN Reference ID:</span>
                <span className="sp-receipt-value" style={{ fontFamily: 'monospace', fontSize: '12px' }}>{txData?.reference_id}</span>
              </div>
              {txData?.financial_transaction_id && (
                <div className="sp-receipt-row">
                  <span className="sp-receipt-label">MTN Financial ID:</span>
                  <span className="sp-receipt-value" style={{ fontFamily: 'monospace' }}>{txData.financial_transaction_id}</span>
                </div>
              )}
              <div className="sp-receipt-row">
                <span className="sp-receipt-label">Status:</span>
                <span className="sp-badge-success">CONFIRMED & ACTIVE</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="sp-btn sp-btn-primary"
                onClick={() => navigateTo('/register')}
                style={{ minWidth: '220px' }}
              >
                <span>Continue to Store Setup</span>
                <ArrowRightIcon size={16} />
              </button>
              <button
                type="button"
                className="sp-btn sp-btn-secondary"
                onClick={() => window.print()}
              >
                Print Receipt
              </button>
            </div>
          </div>
        )}

        {/* Main Checkout Grid (when not completed) */}
        {txState !== 'SUCCESSFUL' && (
          <div className="sp-checkout-grid">
            {/* Left Column: Form Details */}
            <div className="sp-checkout-main">
              <form onSubmit={handleInitiatePayment}>
                {/* Step 1: Account Information */}
                <div className="sp-checkout-card">
                  <div className="sp-checkout-section-header">
                    <span className="sp-step-num">1</span>
                    <h2 className="sp-checkout-section-title">Account & Business Details</h2>
                  </div>

                  <div className="sp-form-row">
                    <div className="sp-form-group">
                      <label className="sp-form-label" htmlFor="customer_name">Full Name *</label>
                      <input
                        id="customer_name"
                        type="text"
                        name="name"
                        className="sp-form-input"
                        placeholder="e.g. Sarah Namubiru"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        disabled={txState === 'INITIATING'}
                      />
                    </div>
                    <div className="sp-form-group">
                      <label className="sp-form-label" htmlFor="customer_email">Email Address (for receipt) *</label>
                      <input
                        id="customer_email"
                        type="email"
                        name="email"
                        className="sp-form-input"
                        placeholder="sarah@retailshop.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={txState === 'INITIATING'}
                      />
                    </div>
                  </div>

                  <div className="sp-form-group" style={{ marginBottom: 0 }}>
                    <label className="sp-form-label" htmlFor="business_name">Store / Business Name (Optional)</label>
                    <input
                      id="business_name"
                      type="text"
                      name="businessName"
                      className="sp-form-input"
                      placeholder="e.g. Kampala Boutique & Retail"
                      value={formData.businessName}
                      onChange={handleChange}
                      disabled={txState === 'INITIATING'}
                    />
                    <div className="sp-form-hint">
                      This will be the default business name displayed on your POS receipts and invoices.
                    </div>
                  </div>
                </div>

                {/* Step 2: MTN MoMo Details */}
                <div className="sp-checkout-card">
                  <div className="sp-checkout-section-header">
                    <span className="sp-step-num">2</span>
                    <h2 className="sp-checkout-section-title">Payment Method — MTN Mobile Money</h2>
                  </div>

                  {/* MoMo Provider Card */}
                  <div className="sp-momo-card">
                    <div className="sp-momo-card-left">
                      <div className="sp-momo-icon-bubble">
                        MoMo
                      </div>
                      <div className="sp-momo-card-info">
                        <h4>MTN Mobile Money Direct Push</h4>
                        <p>Prompt arrives on your mobile phone to enter PIN</p>
                      </div>
                    </div>
                    <span className="sp-momo-tag">INSTANT</span>
                  </div>

                  {/* Phone Number Field */}
                  <div className="sp-form-group">
                    <label className="sp-form-label" htmlFor="momo_phone">
                      MTN Registered Phone Number *
                    </label>
                    <div className="sp-phone-input-wrap">
                      <div className="sp-phone-prefix">
                        <span>🇺🇬</span>
                        <span>+256</span>
                      </div>
                      <input
                        id="momo_phone"
                        type="tel"
                        name="phone"
                        className="sp-form-input"
                        placeholder="772 123 456"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        disabled={txState === 'INITIATING'}
                      />
                    </div>
                    <div className="sp-form-hint">
                      Enter your MTN number (e.g. 077X XXX XXX or 078X XXX XXX). In sandbox mode, test numbers such as <code>0772000000</code> or <code>46733123453</code> are supported.
                    </div>
                  </div>

                  {/* USSD Steps explanation */}
                  <div className="sp-ussd-steps">
                    <div className="sp-ussd-steps-title">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                        <line x1="12" y1="18" x2="12.01" y2="18"></line>
                      </svg>
                      How MTN MoMo Checkout Works:
                    </div>
                    <ol className="sp-ussd-list">
                      <li>Click the <strong>Pay with MTN MoMo</strong> button below.</li>
                      <li>A secure authorization prompt will appear on your MTN phone screen.</li>
                      <li>Enter your <strong>MTN MoMo PIN</strong> to authorize the deduction of {formatUgx(currentPrice)}.</li>
                      <li>Your subscription will activate instantly on this screen!</li>
                    </ol>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="sp-momo-submit-btn"
                    disabled={txState === 'INITIATING'}
                  >
                    {txState === 'INITIATING' ? (
                      <>
                        <span className="sp-spinner"></span>
                        <span>Sending Request to Phone...</span>
                      </>
                    ) : (
                      <>
                        <span>Pay {formatUgx(currentPrice)} with MTN MoMo</span>
                        <ArrowRightIcon size={16} />
                      </>
                    )}
                  </button>

                  <div className="sp-security-note">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    256-Bit SSL Encrypted. Powered by MTN MoMo Open API Gateway.
                  </div>
                </div>
              </form>
            </div>

            {/* Right Column: Order Summary (Sticky) */}
            <aside className="sp-checkout-sidebar">
              <div className="sp-order-summary-card">
                <h3 className="sp-summary-title">Order Summary</h3>

                {/* Plan switcher */}
                <div className="sp-plan-switcher">
                  <button
                    type="button"
                    className={`sp-plan-tab ${selectedPlanId === 'starter' ? 'active' : ''}`}
                    onClick={() => setSelectedPlanId('starter')}
                  >
                    Starter
                  </button>
                  <button
                    type="button"
                    className={`sp-plan-tab ${selectedPlanId === 'business' ? 'active' : ''}`}
                    onClick={() => setSelectedPlanId('business')}
                  >
                    Business
                  </button>
                </div>

                {/* Billing cycle switcher */}
                <div className="sp-cycle-toggle-wrap">
                  <span className="sp-cycle-label">Billing Term:</span>
                  <div className="sp-cycle-btns">
                    <button
                      type="button"
                      className={`sp-cycle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
                      onClick={() => setBillingCycle('monthly')}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      className={`sp-cycle-btn ${billingCycle === 'annual' ? 'active' : ''}`}
                      onClick={() => setBillingCycle('annual')}
                    >
                      Annual (Save 15%)
                    </button>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="sp-breakdown-row">
                  <span>Selected Plan:</span>
                  <span style={{ fontWeight: 600, color: 'var(--sp-navy-900)' }}>{currentPlan.name}</span>
                </div>
                <div className="sp-breakdown-row">
                  <span>Billing Period:</span>
                  <span>{billingCycle === 'annual' ? '12 Months' : '1 Month'}</span>
                </div>
                <div className="sp-breakdown-row">
                  <span>Subtotal:</span>
                  <span>{formatUgx(currentPrice)}</span>
                </div>
                <div className="sp-breakdown-row">
                  <span>MTN MoMo Gateway Fee:</span>
                  <span style={{ color: '#059669', fontWeight: 600 }}>FREE (UGX 0)</span>
                </div>

                <div className="sp-breakdown-row total">
                  <span>Total Due Today:</span>
                  <span className="sp-total-amount">{formatUgx(currentPrice)}</span>
                </div>

                {/* Included Capabilities */}
                <div className="sp-summary-features">
                  <div className="sp-summary-features-title">Plan Includes:</div>
                  {currentPlan.features.slice(0, 5).map((f, i) => (
                    <div key={i} className="sp-summary-feature-item">
                      <CheckIcon size={14} />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* Live PIN Approval Modal Overlay */}
        {txState === 'AWAITING_PIN' && (
          <div className="sp-modal-backdrop" role="dialog" aria-modal="true">
            <div className="sp-modal-card">
              <div className="sp-pulse-wrapper">
                <div className="sp-pulse-circle"></div>
                <div className="sp-pulse-circle-2"></div>
                <div className="sp-pulse-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                    <line x1="12" y1="18" x2="12.01" y2="18"></line>
                  </svg>
                </div>
              </div>

              <h3 className="sp-modal-title">Check Your Phone Now</h3>
              <p className="sp-modal-desc">
                We sent a secure payment authorization prompt to <strong>{formData.phone}</strong>.
              </p>

              <div className="sp-modal-prompt-box">
                <div style={{ flexShrink: 0, color: '#0b1f3a' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 14 14"></polyline>
                  </svg>
                </div>
                <div>
                  <strong>Phone Prompt:</strong> Enter your <strong>MTN MoMo PIN</strong> to authorize {formatUgx(currentPrice)} for {currentPlan.name}.
                </div>
              </div>

              <div className="sp-timer-badge">
                <span className="sp-spinner" style={{ width: '12px', height: '12px', borderWidth: '1.5px' }}></span>
                <span>Awaiting PIN approval ({timerSeconds}s remaining)</span>
              </div>

              <div className="sp-modal-actions">
                <button
                  type="button"
                  className="sp-btn-cancel"
                  onClick={handleCancel}
                >
                  Cancel Payment
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <MarketingFooter />
    </div>
  );
}
