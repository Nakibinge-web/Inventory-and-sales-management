import React, { useState, useEffect, useRef, useCallback } from 'react';
import { navigateTo } from '../../utils/navigation';
import { CheckIcon, ArrowRightIcon } from './Icons';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const NEXUMPAY_PLANS = {
  starter: {
    id: 'starter',
    name: 'Starter Plan',
    badge: 'Solo Retailers',
    tagline: 'For boutique shops, electronics counters, and solo store owners.',
    monthlyPrice: 1000,
    annualMonthlyRate: 1000,
    annualPrice: 1000,
    features: [
      'Up to 1,000 catalog items',
      '2 active POS registers',
      '3 staff accounts with roles',
      'Low-stock threshold alerts',
      'Customer accounts & receipts',
      'Automated SKU generation',
      'Daily sales & profit summaries',
    ],
  },
  business: {
    id: 'business',
    name: 'Business Plan',
    badge: 'Most Popular',
    tagline: 'For supermarkets, high-traffic retailers, and wholesale depots.',
    monthlyPrice: 2000,
    annualMonthlyRate: 2000,
    annualPrice: 2000,
    features: [
      'Unlimited catalog items & categories',
      'Unlimited POS sales transactions',
      'Up to 10 staff accounts & shifts',
      'Granular cashier permissions',
      'Supplier purchase orders & dues',
      'Customer credit ledgers & tax bills',
      'Built-in AI inventory assistant',
      'Priority phone & on-site support',
    ],
  },
};

export function formatUgx(amount) {
  return 'UGX ' + Number(amount || 0).toLocaleString('en-US');
}

export function detectUgandanNetwork(phoneInput, fallbackNetwork = 'mtn') {
  const digits = String(phoneInput || '').replace(/[^0-9]/g, '');
  let local = digits;
  if (digits.startsWith('256') && digits.length >= 5) {
    local = '0' + digits.slice(3);
  } else if (digits.length >= 2 && !digits.startsWith('0')) {
    local = '0' + digits;
  }

  const prefix = local.slice(0, 3);
  if (['077', '078', '076', '039'].includes(prefix)) return 'mtn';
  if (['070', '075', '074', '020'].includes(prefix)) return 'airtel';
  return fallbackNetwork;
}

/**
 * NexumPayCheckoutModal
 * Custom Subscription Checkout UI powered by NexumPay (https://nexumpay.araknerd.com).
 * Supports both Modal Overlay presentation (`isModal={true}`) and Full-Page presentation (`isModal={false}`).
 */
export default function NexumPayCheckoutModal({
  isOpen = true,
  isModal = true,
  initialPlanId = 'starter',
  initialBillingCycle = 'monthly',
  onClose,
  onPaymentSuccess,
}) {
  const [selectedPlanId, setSelectedPlanId] = useState(
    initialPlanId === 'business' ? 'business' : 'starter'
  );
  const [billingCycle, setBillingCycle] = useState(
    initialBillingCycle === 'annual' ? 'annual' : 'monthly'
  );
  const [selectedNetwork, setSelectedNetwork] = useState('mtn'); // 'mtn' | 'airtel'

  // Sync props when opened with a new plan/cycle
  useEffect(() => {
    if (initialPlanId === 'starter' || initialPlanId === 'business') {
      setSelectedPlanId(initialPlanId);
    }
  }, [initialPlanId]);

  useEffect(() => {
    if (initialBillingCycle === 'monthly' || initialBillingCycle === 'annual') {
      setBillingCycle(initialBillingCycle);
    }
  }, [initialBillingCycle]);

  // Pre-fill from logged-in user if available
  const [formData, setFormData] = useState(() => {
    let savedUser = null;
    try {
      const raw = localStorage.getItem('user');
      if (raw) savedUser = JSON.parse(raw);
    } catch {}

    return {
      name: savedUser?.name || '',
      email: savedUser?.email || savedUser?.tenant?.email || '',
      businessName: savedUser?.tenant?.name || '',
      phone: savedUser?.tenant?.phone || '',
    };
  });

  // Gateway configuration state
  const [configStatus, setConfigStatus] = useState(null);

  // Payment lifecycle state: 'IDLE' | 'INITIATING' | 'AWAITING_PIN' | 'SUCCESSFUL' | 'FAILED'
  const [txState, setTxState] = useState('IDLE');
  const [txData, setTxData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(120);
  const [checkingNow, setCheckingNow] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const pollIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);

  const currentPlan = NEXUMPAY_PLANS[selectedPlanId] || NEXUMPAY_PLANS.starter;
  const currentPrice =
    billingCycle === 'annual' ? currentPlan.annualPrice : currentPlan.monthlyPrice;

  const stopTimers = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  // Check backend NexumPay config on mount
  useEffect(() => {
    if (!isOpen) return;
    fetch(`${API}/nexumpay/config-check`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.configuration) {
          setConfigStatus(data.configuration);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  // Cleanup timers on unmount or close
  useEffect(() => {
    return () => stopTimers();
  }, [stopTimers]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isModal || !isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isModal, isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isModal || !isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && txState !== 'INITIATING') {
        if (onClose) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModal, isOpen, txState, onClose]);

  const syncLocalSubscription = useCallback(
    (transactionObj) => {
      try {
        const rawUser = localStorage.getItem('user');
        if (rawUser) {
          const parsed = JSON.parse(rawUser);
          if (parsed && parsed.tenant) {
            parsed.tenant.subscription_plan = selectedPlanId;
            parsed.tenant.subscription_status = 'active';
            if (transactionObj?.tenant_subscription?.subscription_expires_at) {
              parsed.tenant.subscription_expires_at =
                transactionObj.tenant_subscription.subscription_expires_at;
            } else {
              const months = billingCycle === 'annual' ? 12 : 1;
              const date = new Date();
              date.setMonth(date.getMonth() + months);
              parsed.tenant.subscription_expires_at = date.toISOString();
            }
            localStorage.setItem('user', JSON.stringify(parsed));
            try {
              window.dispatchEvent(new CustomEvent('subscription_updated', { detail: parsed }));
            } catch {}
          }
        }
        // Also store pending checkout details for new users heading to /register
        sessionStorage.setItem(
          'nexumpay_completed_subscription',
          JSON.stringify({
            plan_id: selectedPlanId,
            plan_name: currentPlan.name,
            billing_cycle: billingCycle,
            amount: currentPrice,
            client_ref: transactionObj?.client_ref || transactionObj?.external_id,
            internal_ref: transactionObj?.internal_ref || transactionObj?.financial_transaction_id,
            customer_name: formData.name,
            customer_email: formData.email,
            business_name: formData.businessName,
            customer_phone: formData.phone,
          })
        );
      } catch {}

      if (onPaymentSuccess) {
        onPaymentSuccess(transactionObj);
      }
    },
    [selectedPlanId, currentPlan.name, billingCycle, currentPrice, formData, onPaymentSuccess]
  );

  // Poll transaction status from backend (/api/nexumpay/status/{reference})
  const checkStatusOnce = useCallback(
    async (reference) => {
      if (!reference) return;
      try {
        const res = await fetch(`${API}/nexumpay/status/${encodeURIComponent(reference)}`);
        const data = await res.json();

        if (data && data.success) {
          const status = (data.status || '').toUpperCase();

          if (status === 'SUCCESSFUL' || status === 'SUCCESS') {
            stopTimers();
            setTxState('SUCCESSFUL');
            setTxData(data.transaction || data);
            syncLocalSubscription(data.transaction || data);
          } else if (['FAILED', 'REJECTED', 'TIMEOUT', 'CANCELLED'].includes(status)) {
            stopTimers();
            setTxState('FAILED');
            const rawReason = data.transaction?.failure_reason || '';
            const isGenericFail = !rawReason || /status is:\s*failed/i.test(rawReason);
            setErrorMessage(
              isGenericFail
                ? 'The Mobile Money payment was declined or cancelled on your phone. Please ensure you have sufficient mobile money balance (including operator fees) and approve the PIN prompt on your phone.'
                : rawReason
            );
          }
        }
      } catch {
        // Ignore transient network hiccup during polling
      }
    },
    [stopTimers, syncLocalSubscription]
  );

  const startPolling = useCallback(
    (reference) => {
      stopTimers();

      // Countdown timer (120s matching NexumPay short-lived API key window)
      setTimerSeconds(120);
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            stopTimers();
            setTxState('FAILED');
            setErrorMessage(
              'The Mobile Money PIN prompt timed out after 120 seconds. Please try again.'
            );
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Status polling every 3 seconds
      pollIntervalRef.current = setInterval(() => {
        checkStatusOnce(reference);
      }, 3000);
    },
    [stopTimers, checkStatusOnce]
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'phone') {
      const detected = detectUgandanNetwork(value, selectedNetwork);
      setSelectedNetwork(detected);
    }
  };

  // Initiate NexumPay Collection Request
  const handleInitiatePayment = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMessage('Please enter a valid email address for your subscription receipt.');
      return;
    }
    const cleanDigits = formData.phone.replace(/[^0-9]/g, '');
    if (cleanDigits.length < 9) {
      setErrorMessage(
        'Please enter a valid Ugandan MTN or Airtel Mobile Money number (e.g. 0772 123 456 or 0701 123 456).'
      );
      return;
    }

    setTxState('INITIATING');

    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API}/nexumpay/initiate`, {
        method: 'POST',
        headers,
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
        setErrorMessage(
          data.message || 'Could not initiate NexumPay payment request. Please verify your details.'
        );
        return;
      }

      setTxData(data);
      setTxState('AWAITING_PIN');
      startPolling(data.client_ref || data.reference_id);
    } catch (err) {
      setTxState('FAILED');
      setErrorMessage(
        `Unable to reach the payment server at ${API}. Make sure your Laravel backend is running (php artisan serve).`
      );
    }
  };

  const handleManualCheck = async () => {
    if (!txData) return;
    setCheckingNow(true);
    await checkStatusOnce(txData.client_ref || txData.reference_id);
    setTimeout(() => setCheckingNow(false), 600);
  };

  const handleSimulateOutcome = async (action = 'SUCCESS') => {
    if (!txData) return;
    setSimulating(true);
    try {
      const ref = txData.client_ref || txData.reference_id;
      const res = await fetch(`${API}/nexumpay/simulate/${encodeURIComponent(ref)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data && data.success) {
        if (data.status === 'SUCCESSFUL') {
          stopTimers();
          setTxState('SUCCESSFUL');
          setTxData(data.transaction);
          syncLocalSubscription(data.transaction);
        } else {
          stopTimers();
          setTxState('FAILED');
          setErrorMessage(
            data.transaction?.failure_reason || 'Simulated transaction cancellation.'
          );
        }
      }
    } catch {
      setErrorMessage('Failed to trigger simulation.');
    } finally {
      setSimulating(false);
    }
  };

  const handleReset = () => {
    stopTimers();
    setTxState('IDLE');
    setErrorMessage('');
  };

  const handleContinueAfterSuccess = () => {
    const isLoggedIn = Boolean(localStorage.getItem('token') && localStorage.getItem('user'));
    if (onClose) onClose();
    if (isLoggedIn) {
      navigateTo('/overview');
    } else {
      navigateTo('/register');
    }
  };

  if (!isOpen) return null;

  const isLoggedIn = Boolean(localStorage.getItem('token') && localStorage.getItem('user'));
  const networkLabel =
    selectedNetwork === 'airtel' ? 'Airtel Money Uganda' : 'MTN Mobile Money';

  const checkoutContent = (
    <div
      className={`nxp-checkout-shell ${isModal ? 'nxp-is-modal' : 'nxp-is-page'}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Gateway Header Bar */}
      <div className="nxp-shell-topbar">
        <div className="nxp-brand-cluster">
          <div className="nxp-logo-mark" aria-hidden="true">
            <span>NX</span>
          </div>
          <div>
            <div className="nxp-brand-title-row">
              <span className="nxp-brand-name">NexumPay Checkout</span>
              <span className="nxp-verified-pill">
                <span className="nxp-dot" />
                {configStatus?.mode === 'live'
                  ? 'Live Gateway Active'
                  : 'Instant Mobile Money Push'}
              </span>
            </div>
            <p className="nxp-brand-sub">
              Powered by Araknerd Uganda &bull; MTN Mobile Money &amp; Airtel Money Collections
            </p>
          </div>
        </div>

        <div className="nxp-topbar-actions">
          {isModal && (
            <button
              type="button"
              className="nxp-open-page-link"
              onClick={() => {
                if (onClose) onClose();
                navigateTo(`/checkout?plan=${selectedPlanId}&cycle=${billingCycle}`);
              }}
              title="Open in full checkout page"
            >
              Full Page View &nearr;
            </button>
          )}
          {isModal && onClose && (
            <button
              type="button"
              className="nxp-close-btn"
              onClick={onClose}
              aria-label="Close checkout"
            >
              &#10005;
            </button>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="nxp-shell-body">
        {/* LEFT COLUMN: Plan Switcher & Order Summary */}
        <aside className="nxp-summary-pane">
          <div className="nxp-pane-eyebrow">SUBSCRIPTION SUMMARY</div>

          {/* Plan Switcher Tabs */}
          <div className="nxp-plan-tabs" role="tablist" aria-label="Choose Subscription Plan">
            {Object.values(NEXUMPAY_PLANS).map((plan) => (
              <button
                key={plan.id}
                type="button"
                role="tab"
                aria-selected={selectedPlanId === plan.id}
                className={`nxp-plan-tab ${selectedPlanId === plan.id ? 'active' : ''}`}
                onClick={() => {
                  if (txState === 'IDLE' || txState === 'FAILED') {
                    setSelectedPlanId(plan.id);
                  }
                }}
                disabled={txState === 'INITIATING' || txState === 'AWAITING_PIN'}
              >
                <span className="nxp-plan-tab-name">{plan.name.replace(' Plan', '')}</span>
                <span className="nxp-plan-tab-badge">{plan.badge}</span>
              </button>
            ))}
          </div>

          {/* Billing Cycle Toggle */}
          <div className="nxp-cycle-box">
            <span className="nxp-cycle-label">Billing Cycle</span>
            <div className="nxp-cycle-switch">
              <button
                type="button"
                className={`nxp-cycle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
                onClick={() => setBillingCycle('monthly')}
                disabled={txState === 'INITIATING' || txState === 'AWAITING_PIN'}
              >
                Monthly
              </button>
              <button
                type="button"
                className={`nxp-cycle-btn ${billingCycle === 'annual' ? 'active' : ''}`}
                onClick={() => setBillingCycle('annual')}
                disabled={txState === 'INITIATING' || txState === 'AWAITING_PIN'}
              >
                Annual <span className="nxp-cycle-save">-15%</span>
              </button>
            </div>
          </div>

          {/* Selected Plan Card */}
          <div className="nxp-selected-plan-box">
            <div className="nxp-selected-plan-head">
              <div>
                <h3 className="nxp-selected-plan-name">{currentPlan.name}</h3>
                <p className="nxp-selected-plan-tagline">{currentPlan.tagline}</p>
              </div>
            </div>

            <div className="nxp-price-hero">
              <span className="nxp-price-amount">{formatUgx(currentPrice)}</span>
              <span className="nxp-price-period">
                {billingCycle === 'annual' ? '/ year' : '/ month'}
              </span>
            </div>

            {billingCycle === 'annual' && (
              <div className="nxp-annual-note">
                Equivalent to {formatUgx(currentPlan.annualMonthlyRate)}/month billed annually
              </div>
            )}
          </div>

          {/* Feature Checklist */}
          <div className="nxp-features-section">
            <div className="nxp-features-heading">INCLUDED IN {currentPlan.name.toUpperCase()}:</div>
            <ul className="nxp-features-list">
              {currentPlan.features.map((feat, idx) => (
                <li key={idx} className="nxp-feature-row">
                  <span className="nxp-feature-check">
                    <CheckIcon size={12} />
                  </span>
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Total Breakdown */}
          <div className="nxp-totals-box">
            <div className="nxp-total-line">
              <span>Plan Tier</span>
              <strong>{currentPlan.name}</strong>
            </div>
            <div className="nxp-total-line">
              <span>Duration</span>
              <span>{billingCycle === 'annual' ? '12 Months (Annual)' : '1 Month (Monthly)'}</span>
            </div>
            <div className="nxp-total-line">
              <span>Payment Channel</span>
              <span>NexumPay ({selectedNetwork === 'airtel' ? 'Airtel' : 'MTN'})</span>
            </div>
            <div className="nxp-total-line grand">
              <span>Total Due Now</span>
              <span className="nxp-grand-val">{formatUgx(currentPrice)}</span>
            </div>
          </div>
        </aside>

        {/* RIGHT COLUMN: Interactive Payment Stage */}
        <section className="nxp-payment-pane">
          {/* ERROR BANNER */}
          {errorMessage && (
            <div className="nxp-error-banner" role="alert">
              <div className="nxp-error-icon">!</div>
              <div className="nxp-error-text">
                <strong>Payment Alert:</strong> {errorMessage}
              </div>
              {txState === 'FAILED' && (
                <button type="button" className="nxp-retry-mini" onClick={handleReset}>
                  Try Again
                </button>
              )}
            </div>
          )}

          {/* STAGE A: FORM (IDLE / INITIATING / FAILED) */}
          {(txState === 'IDLE' || txState === 'INITIATING' || txState === 'FAILED') && (
            <form onSubmit={handleInitiatePayment} className="nxp-form">
              <div className="nxp-step-block">
                <div className="nxp-step-header">
                  <span className="nxp-step-badge">1</span>
                  <div>
                    <h3 className="nxp-step-title">Subscriber &amp; Business Details</h3>
                    <p className="nxp-step-sub">
                      Used to activate your StockPro workspace and send your digital receipt.
                    </p>
                  </div>
                </div>

                <div className="nxp-grid-2">
                  <div className="nxp-field">
                    <label htmlFor="nxp_name" className="nxp-label">
                      Full Name <span className="nxp-req">*</span>
                    </label>
                    <input
                      id="nxp_name"
                      type="text"
                      name="name"
                      className="nxp-input"
                      placeholder="e.g. Nakibinge Moses"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      disabled={txState === 'INITIATING'}
                    />
                  </div>

                  <div className="nxp-field">
                    <label htmlFor="nxp_email" className="nxp-label">
                      Email Address <span className="nxp-req">*</span>
                    </label>
                    <input
                      id="nxp_email"
                      type="email"
                      name="email"
                      className="nxp-input"
                      placeholder="owner@myshop.ug"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      disabled={txState === 'INITIATING'}
                    />
                  </div>
                </div>

                <div className="nxp-field" style={{ marginBottom: 0 }}>
                  <label htmlFor="nxp_business" className="nxp-label">
                    Business / Store Name
                  </label>
                  <input
                    id="nxp_business"
                    type="text"
                    name="businessName"
                    className="nxp-input"
                    placeholder="e.g. Kampala Hardware & General Merchandise"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    disabled={txState === 'INITIATING'}
                  />
                </div>
              </div>

              <div className="nxp-step-block">
                <div className="nxp-step-header">
                  <span className="nxp-step-badge">2</span>
                  <div>
                    <h3 className="nxp-step-title">Mobile Money Network &amp; Phone Number</h3>
                    <p className="nxp-step-sub">
                      NexumPay will send an instant USSD PIN prompt directly to your phone.
                    </p>
                  </div>
                </div>

                {/* Network Provider Selector Cards */}
                <div className="nxp-network-grid">
                  <button
                    type="button"
                    className={`nxp-network-card mtn ${
                      selectedNetwork === 'mtn' ? 'selected' : ''
                    }`}
                    onClick={() => setSelectedNetwork('mtn')}
                    disabled={txState === 'INITIATING'}
                  >
                    <div className="nxp-net-badge mtn">MTN MoMo</div>
                    <div className="nxp-net-info">
                      <strong>MTN Mobile Money</strong>
                      <span>077 / 078 / 076 / 039</span>
                    </div>
                    <span className="nxp-net-radio" />
                  </button>

                  <button
                    type="button"
                    className={`nxp-network-card airtel ${
                      selectedNetwork === 'airtel' ? 'selected' : ''
                    }`}
                    onClick={() => setSelectedNetwork('airtel')}
                    disabled={txState === 'INITIATING'}
                  >
                    <div className="nxp-net-badge airtel">Airtel</div>
                    <div className="nxp-net-info">
                      <strong>Airtel Money</strong>
                      <span>070 / 075 / 074 / 020</span>
                    </div>
                    <span className="nxp-net-radio" />
                  </button>
                </div>

                {/* Phone Number Input */}
                <div className="nxp-field">
                  <label htmlFor="nxp_phone" className="nxp-label">
                    {networkLabel} Phone Number <span className="nxp-req">*</span>
                  </label>
                  <div className="nxp-phone-group">
                    <div className="nxp-phone-prefix">
                      <span role="img" aria-label="Uganda">
                        🇺🇬
                      </span>
                      <span>+256</span>
                    </div>
                    <input
                      id="nxp_phone"
                      type="tel"
                      name="phone"
                      className="nxp-phone-input"
                      placeholder={
                        selectedNetwork === 'airtel' ? '0701 234 567' : '0772 123 456'
                      }
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      disabled={txState === 'INITIATING'}
                    />
                    <span className={`nxp-detected-pill ${selectedNetwork}`}>
                      {selectedNetwork === 'airtel' ? 'Airtel' : 'MTN'}
                    </span>
                  </div>
                  <div className="nxp-field-hint">
                    Keep your phone unlocked nearby. A USSD push prompt will appear asking for your{' '}
                    <strong>{networkLabel} PIN</strong>.
                  </div>
                </div>

                {/* USSD Instruction Strip */}
                <div className="nxp-how-strip">
                  <div className="nxp-how-step">
                    <span className="nxp-how-num">1</span>
                    <span>Click Pay below</span>
                  </div>
                  <div className="nxp-how-arrow">&rarr;</div>
                  <div className="nxp-how-step">
                    <span className="nxp-how-num">2</span>
                    <span>USSD prompt appears on phone</span>
                  </div>
                  <div className="nxp-how-arrow">&rarr;</div>
                  <div className="nxp-how-step">
                    <span className="nxp-how-num">3</span>
                    <span>Enter PIN to activate</span>
                  </div>
                </div>

                {/* Submit CTA */}
                <button
                  type="submit"
                  className="nxp-pay-btn"
                  disabled={txState === 'INITIATING'}
                >
                  {txState === 'INITIATING' ? (
                    <>
                      <span className="nxp-spinner" />
                      <span>Sending NexumPay USSD Push to Phone...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        Pay {formatUgx(currentPrice)} via NexumPay ({selectedNetwork.toUpperCase()})
                      </span>
                      <ArrowRightIcon size={16} />
                    </>
                  )}
                </button>

                <div className="nxp-security-foot">
                  <span>&#128274; Encrypted API Token Exchange &bull; Powered by NexumPay Uganda</span>
                </div>
              </div>
            </form>
          )}

          {/* STAGE B: AWAITING PIN ON PHONE */}
          {txState === 'AWAITING_PIN' && (
            <div className="nxp-awaiting-box">
              <div className="nxp-pulse-ring-wrap">
                <div className="nxp-pulse-ring r1" />
                <div className="nxp-pulse-ring r2" />
                <div className="nxp-phone-avatar">
                  <svg
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                    <line x1="12" y1="18" x2="12.01" y2="18" />
                  </svg>
                </div>
              </div>

              <span className="nxp-awaiting-badge">USSD PUSH SENT TO YOUR PHONE</span>
              <h3 className="nxp-awaiting-title">Authorize Payment on Your Handset</h3>
              <p className="nxp-awaiting-desc">
                NexumPay has sent a payment collection prompt to{' '}
                <strong>{txData?.customer_phone || formData.phone}</strong> ({txData?.network || networkLabel}).
              </p>

              {/* Simulated Phone Screen Preview */}
              <div className="nxp-ussd-dialog-preview">
                <div className="nxp-ussd-dialog-header">
                  <span>{txData?.network || networkLabel} Prompt</span>
                  <span className="nxp-ussd-ref">Ref: {txData?.client_ref}</span>
                </div>
                <div className="nxp-ussd-dialog-body">
                  You have requested to pay <strong>{formatUgx(currentPrice)}</strong> to{' '}
                  <strong>StockPro ({currentPlan.name})</strong> via <strong>NexumPay</strong>.
                  <br />
                  <span>Please enter your Mobile Money PIN to confirm:</span>
                </div>
                <div className="nxp-ussd-pin-dots">
                  <span>&bull;</span>
                  <span>&bull;</span>
                  <span>&bull;</span>
                  <span>&bull;</span>
                </div>
              </div>

              {/* Countdown & Polling Bar */}
              <div className="nxp-timer-row">
                <span className="nxp-spinner dark" />
                <span>
                  Waiting for PIN confirmation &mdash;{' '}
                  <strong>{timerSeconds}s remaining</strong>
                </span>
              </div>

              <div className="nxp-awaiting-actions">
                <button
                  type="button"
                  className="nxp-check-now-btn"
                  onClick={handleManualCheck}
                  disabled={checkingNow}
                >
                  {checkingNow ? 'Checking Status...' : "I've Entered My PIN — Check Status Now"}
                </button>

                <button type="button" className="nxp-cancel-link" onClick={handleReset}>
                  Cancel or Change Phone Number
                </button>
              </div>

              {/* Sandbox / Simulation Quick-Test Bar (when live .env keys aren't set yet) */}
              {(txData?.mode === 'simulation' || configStatus?.mode === 'simulation') && (
                <div className="nxp-sim-box">
                  <div className="nxp-sim-head">
                    <strong>Sandbox Simulation Mode</strong>
                    <span>
                      (Add <code>NEXUMPAY_WALLET_ADDRESS</code> &amp;{' '}
                      <code>NEXUMPAY_AUTH_TOKEN</code> in <code>backend/.env</code> for live USSD push)
                    </span>
                  </div>
                  <div className="nxp-sim-btns">
                    <button
                      type="button"
                      className="nxp-sim-approve-btn"
                      onClick={() => handleSimulateOutcome('SUCCESS')}
                      disabled={simulating}
                    >
                      &#10003; Simulate PIN Approval (Success)
                    </button>
                    <button
                      type="button"
                      className="nxp-sim-fail-btn"
                      onClick={() => handleSimulateOutcome('FAILED')}
                      disabled={simulating}
                    >
                      &#10005; Simulate Decline
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STAGE C: PAYMENT CONFIRMED & RECEIPT */}
          {txState === 'SUCCESSFUL' && (
            <div className="nxp-success-box">
              <div className="nxp-success-check-circle">
                <CheckIcon size={28} />
              </div>

              <span className="nxp-success-pill">NEXUMPAY COLLECTION CONFIRMED</span>
              <h3 className="nxp-success-title">Subscription Activated!</h3>
              <p className="nxp-success-desc">
                Thank you, <strong>{formData.name}</strong>. Your payment of{' '}
                <strong>{formatUgx(currentPrice)}</strong> for the{' '}
                <strong>{currentPlan.name}</strong> has been verified by NexumPay.
              </p>

              {/* Official Receipt Card */}
              <div className="nxp-receipt-card">
                <div className="nxp-receipt-head">
                  <span>OFFICIAL NEXUMPAY RECEIPT</span>
                  <span className="nxp-receipt-status">SUCCESS</span>
                </div>
                <div className="nxp-receipt-rows">
                  <div className="nxp-receipt-row">
                    <span>Subscription Plan</span>
                    <strong>
                      {currentPlan.name} ({billingCycle === 'annual' ? 'Annual' : 'Monthly'})
                    </strong>
                  </div>
                  <div className="nxp-receipt-row">
                    <span>Amount Paid</span>
                    <strong className="nxp-receipt-amount">{formatUgx(currentPrice)}</strong>
                  </div>
                  <div className="nxp-receipt-row">
                    <span>Mobile Money Number</span>
                    <span>{txData?.customer_phone || formData.phone}</span>
                  </div>
                  <div className="nxp-receipt-row">
                    <span>NexumPay Client Ref</span>
                    <code>{txData?.client_ref || txData?.external_id}</code>
                  </div>
                  {txData?.internal_ref && (
                    <div className="nxp-receipt-row">
                      <span>NexumPay Internal Ref</span>
                      <code>{txData.internal_ref}</code>
                    </div>
                  )}
                  <div className="nxp-receipt-row">
                    <span>Transaction Date</span>
                    <span>{txData?.transaction_date || new Date().toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="nxp-success-actions">
                <button
                  type="button"
                  className="nxp-pay-btn"
                  onClick={handleContinueAfterSuccess}
                >
                  <span>
                    {isLoggedIn
                      ? 'Return to Business Dashboard'
                      : 'Continue to Complete Store Registration'}
                  </span>
                  <ArrowRightIcon size={16} />
                </button>

                <button
                  type="button"
                  className="nxp-print-btn"
                  onClick={() => window.print()}
                >
                  Print Receipt
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );

  if (!isModal) {
    return checkoutContent;
  }

  return (
    <div
      className="nxp-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="NexumPay Subscription Checkout"
      onClick={() => {
        if (txState !== 'INITIATING' && onClose) {
          onClose();
        }
      }}
    >
      {checkoutContent}
    </div>
  );
}

