import React, { useState, useEffect } from 'react';
import { MarketingLink } from '../../utils/navigation';
import { BrandLogoIcon, MenuIcon, CloseIcon } from './Icons';

export default function MarketingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer on route change or ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Lock body scroll when mobile nav is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="sp-header" role="banner">
      <div className="sp-container sp-header-inner">
        {/* Brand */}
        <MarketingLink href="/" className="sp-brand" activeClassName="" aria-label="StockPro Home">
          <div className="sp-brand-logo-icon" aria-hidden="true">
            <BrandLogoIcon size={18} />
          </div>
          <div className="sp-brand-text-wrap">
            <span className="sp-brand-name">StockPro</span>
            <span className="sp-brand-tagline">Inventory &amp; Sales</span>
          </div>
        </MarketingLink>

        {/* Desktop Navigation */}
        <nav className="sp-nav" aria-label="Main Navigation">
          <ul className="sp-nav-links">
            <li>
              <MarketingLink href="/#features" className="sp-nav-link">
                Product
              </MarketingLink>
            </li>
            <li>
              <MarketingLink href="/how-it-works" className="sp-nav-link">
                How It Works
              </MarketingLink>
            </li>
            <li>
              <MarketingLink href="/pricing" className="sp-nav-link">
                Pricing
              </MarketingLink>
            </li>
            <li>
              <MarketingLink href="/contact" className="sp-nav-link">
                Contact
              </MarketingLink>
            </li>
          </ul>
        </nav>

        {/* Actions Desktop */}
        <div className="sp-header-actions">
          <MarketingLink href="/login" className="sp-btn sp-btn-ghost sp-btn-sm" activeClassName="">
            Login
          </MarketingLink>
          <MarketingLink href="/register" className="sp-btn sp-btn-primary sp-btn-sm" activeClassName="">
            Get Started
          </MarketingLink>
        </div>

        {/* Mobile Toggle Button */}
        <button
          type="button"
          className="sp-mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <CloseIcon size={20} /> : <MenuIcon size={20} />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="sp-mobile-menu" role="dialog" aria-modal="true" onClick={closeMobile}>
          <div className="sp-mobile-menu-panel" onClick={(e) => e.stopPropagation()}>
            <ul className="sp-mobile-nav-links">
              <li>
                <MarketingLink href="/" className="sp-mobile-nav-link" onClick={closeMobile}>
                  Home
                </MarketingLink>
              </li>
              <li>
                <MarketingLink href="/how-it-works" className="sp-mobile-nav-link" onClick={closeMobile}>
                  How It Works
                </MarketingLink>
              </li>
              <li>
                <MarketingLink href="/pricing" className="sp-mobile-nav-link" onClick={closeMobile}>
                  Pricing
                </MarketingLink>
              </li>
              <li>
                <MarketingLink href="/contact" className="sp-mobile-nav-link" onClick={closeMobile}>
                  Contact
                </MarketingLink>
              </li>
            </ul>

            <div className="sp-mobile-actions">
              <MarketingLink
                href="/login"
                className="sp-btn sp-btn-secondary"
                activeClassName=""
                onClick={closeMobile}
              >
                Login
              </MarketingLink>
              <MarketingLink
                href="/register"
                className="sp-btn sp-btn-primary"
                activeClassName=""
                onClick={closeMobile}
              >
                Get Started
              </MarketingLink>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
