import React, { useState } from 'react';
import NexumPayCheckoutModal from './marketing/NexumPayCheckoutModal';
import Button from './ui/Button';
import { navigateTo } from '../utils/navigation';
import { getDefaultExpiredMessage } from '../utils/subscription';

function formatPlanName(plan) {
  const key = String(plan || '').toLowerCase();
  if (key === 'business') return 'Business Plan';
  if (key === 'enterprise') return 'Enterprise Plan';
  if (key === 'starter') return 'Starter Plan';
  if (key === 'trial') return 'Free Trial';
  return plan ? String(plan) : 'Subscription';
}

function formatExpiryDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function SubscriptionExpiredScreen({
  user,
  blockedInfo,
  onLogout,
  onSubscriptionRestored,
}) {
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const tenant = blockedInfo?.tenant || user?.tenant || {};
  const isOwner =
    blockedInfo?.is_owner !== undefined
      ? Boolean(blockedInfo.is_owner)
      : Boolean(user?.roles?.some((r) => r.name === 'owner'));
  const message = blockedInfo?.message || getDefaultExpiredMessage(user);
  const planLabel = formatPlanName(
    blockedInfo?.subscription?.plan || tenant.subscription_plan
  );
  const expiredOn = formatExpiryDate(
    blockedInfo?.subscription?.expires_at || tenant.subscription_expires_at
  );

  const handlePaymentSuccess = (tx) => {
    if (onSubscriptionRestored) {
      onSubscriptionRestored(tx);
    }
  };

  return (
    <div
      data-testid="subscription-expired-screen"
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'inherit',
      }}
    >
      {/* Top Bar */}
      <header
        style={{
          height: 64,
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {tenant?.logo_url ? (
            <img
              src={tenant.logo_url}
              alt={`${tenant?.name || 'Business'} logo`}
              style={{
                width: 32,
                height: 32,
                objectFit: 'contain',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                background: '#ffffff',
              }}
            />
          ) : (
            <div
              style={{
                width: 32,
                height: 32,
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
              {tenant?.name || 'StockPro'}
            </span>
            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
              Account Access Paused
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user?.name && (
            <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>
              {user.name}
            </span>
          )}
          <Button variant="secondary" size="sm" onClick={onLogout}>
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Centered Lock Card */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 20px',
        }}
      >
        <div
          role="alert"
          aria-live="assertive"
          style={{
            width: '100%',
            maxWidth: 540,
            backgroundColor: '#ffffff',
            border: '1px solid #fecaca',
            borderRadius: 16,
            boxShadow: '0 20px 45px -15px rgba(15, 23, 42, 0.12)',
            padding: '36px 32px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 18,
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <div style={{ marginBottom: 10 }}>
            <span
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: 9999,
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Subscription Ended
            </span>
          </div>

          <h1
            style={{
              margin: '0 0 12px',
              fontSize: 24,
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.02em',
            }}
          >
            Subscription Period Ended
          </h1>

          <p
            style={{
              margin: '0 0 22px',
              fontSize: 15,
              lineHeight: 1.6,
              color: '#334155',
            }}
          >
            {message}
          </p>

          {/* Details Box */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              padding: '14px 16px',
              marginBottom: 24,
              textAlign: 'left',
              fontSize: 13.5,
              color: '#475569',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            {tenant?.name && (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span>Business</span>
                <strong style={{ color: '#0f172a' }}>{tenant.name}</strong>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <span>Previous Plan</span>
              <strong style={{ color: '#0f172a' }}>{planLabel}</strong>
            </div>
            {expiredOn && (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span>Ended On</span>
                <strong style={{ color: '#b91c1c' }}>{expiredOn}</strong>
              </div>
            )}
          </div>

          {!isOwner && (
            <p
              style={{
                margin: '0 0 20px',
                fontSize: 13,
                color: '#64748b',
                lineHeight: 1.5,
              }}
            >
              All accounts created under <strong>{tenant?.name || 'this business'}</strong> are
              temporarily restricted until an active subscription is restored.
            </p>
          )}

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              justifyContent: 'center',
            }}
          >
            <button
              type="button"
              onClick={() => setCheckoutOpen(true)}
              style={{
                padding: '12px 24px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: '#071629',
                color: '#ffffff',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Subscribe Now
            </button>

            <button
              type="button"
              onClick={() => navigateTo('/pricing')}
              style={{
                padding: '12px 20px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              View Plans
            </button>

            <button
              type="button"
              onClick={onLogout}
              style={{
                padding: '12px 20px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                color: '#475569',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </main>

      <NexumPayCheckoutModal
        isOpen={checkoutOpen}
        isModal={true}
        initialPlanId={
          tenant?.subscription_plan === 'business' ? 'business' : 'starter'
        }
        prefillCustomer={{
          name: user?.name || tenant?.name || '',
          email: tenant?.email || user?.email || '',
          businessName: tenant?.name || '',
          phone: tenant?.phone || '',
        }}
        continueLabel="Return to Workspace"
        onContinue={() => setCheckoutOpen(false)}
        onClose={() => setCheckoutOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
