import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import PricingPage from './PricingPage';

describe('PricingPage layout and interactions', () => {
  test('renders centered Monthly/Annually billing box with Save 15% banner above, AOS effects, and no comparison table', () => {
    window.scrollTo = vi.fn();
    Element.prototype.scrollIntoView = vi.fn();

    const { container } = render(<PricingPage />);

    expect(container.querySelector('.sp-section.sp-pricing-hero-section')).not.toBeNull();
    const headingWrap = container.querySelector('.sp-pricing-page-heading');
    expect(headingWrap).not.toBeNull();
    expect(headingWrap.style.maxWidth).toBe('100%');
    expect(screen.getByRole('heading', { name: 'Pricing for different business packages.' })).toBeInTheDocument();

    // Core Capabilities comparison table is removed
    expect(screen.queryByText(/Core Capabilities/i)).not.toBeInTheDocument();
    expect(container.querySelector('.sp-comparison-table')).toBeNull();

    // Centered billing box with banner above Monthly | Annually
    const billingBox = container.querySelector('.sp-pricing-billing-box');
    expect(billingBox).not.toBeNull();
    const banner = billingBox.querySelector('.sp-pricing-billing-banner');
    const options = billingBox.querySelector('.sp-pricing-billing-options');
    expect(banner).not.toBeNull();
    expect(banner.textContent).toBe('Save 15% on Annual Billing');
    expect(options).not.toBeNull();
    // Banner appears before the Monthly/Annually options container in DOM order
    expect(banner.compareDocumentPosition(options) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    const monthlyBtn = screen.getByRole('button', { name: 'Monthly' });
    const annuallyBtn = screen.getByRole('button', { name: 'Annually' });
    expect(monthlyBtn).toHaveAttribute('aria-pressed', 'true');
    expect(annuallyBtn).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(annuallyBtn);
    expect(monthlyBtn).toHaveAttribute('aria-pressed', 'false');
    expect(annuallyBtn).toHaveAttribute('aria-pressed', 'true');

    // AOS attributes applied across page sections and cards
    const aosElements = container.querySelectorAll('[data-aos]');
    expect(aosElements.length).toBeGreaterThanOrEqual(5);
    expect(container.querySelectorAll('.sp-pricing-doc-card[data-aos="fade-up"]')).toHaveLength(3);
  });
});
