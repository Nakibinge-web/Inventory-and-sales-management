import React from 'react';
import { MarketingLink } from '../../utils/navigation';
import { BrandLogoIcon } from './Icons';

export default function MarketingFooter() {
  return (
    <footer className="sp-footer" role="contentinfo">
      <div className="sp-container">
        <div className="sp-footer-grid">
          {/* Brand Info */}
          <div className="sp-footer-brand-col">
            <MarketingLink href="/" className="sp-footer-brand" aria-label="StockPro Home">
              <div className="sp-footer-brand-icon" aria-hidden="true">
                <BrandLogoIcon size={18} />
              </div>
              <span>StockPro</span>
            </MarketingLink>
            <p className="sp-footer-desc">
              Structured inventory tracking, point-of-sale checkout, vendor purchasing, and real-time business performance in one unified platform.
            </p>
            <div className="sp-footer-status">
              <span className="sp-status-dot" aria-hidden="true" />
              <span>Multi-Tenant Cloud Services Operational</span>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="sp-footer-col-title">PRODUCT</h3>
            <ul className="sp-footer-links">
              <li>
                <MarketingLink href="/#features" className="sp-footer-link">
                  Capabilities
                </MarketingLink>
              </li>
              <li>
                <MarketingLink href="/how-it-works" className="sp-footer-link">
                  How It Works
                </MarketingLink>
              </li>
              <li>
                <MarketingLink href="/pricing" className="sp-footer-link">
                  Pricing
                </MarketingLink>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="sp-footer-col-title">COMPANY</h3>
            <ul className="sp-footer-links">
              <li>
                <MarketingLink href="/contact" className="sp-footer-link">
                  Contact
                </MarketingLink>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="sp-footer-col-title">ACCOUNT</h3>
            <ul className="sp-footer-links">
              <li>
                <MarketingLink href="/login" className="sp-footer-link">
                  Sign In
                </MarketingLink>
              </li>
              <li>
                <MarketingLink href="/register" className="sp-footer-link">
                  Get Started
                </MarketingLink>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="sp-footer-bottom">
          <p className="sp-footer-copyright">
            &copy; 2026 StockPro. Inventory &amp; Sales Management System. All rights reserved.
          </p>
          <div className="sp-footer-bottom-links">
            <MarketingLink href="/pricing#faq" className="sp-footer-bottom-link">
              Security &amp; Data Isolation
            </MarketingLink>
            <MarketingLink href="/contact" className="sp-footer-bottom-link">
              Support
            </MarketingLink>
            <MarketingLink href="/login" className="sp-footer-bottom-link">
              Cashier Portal
            </MarketingLink>
          </div>
        </div>
      </div>
    </footer>
  );
}
