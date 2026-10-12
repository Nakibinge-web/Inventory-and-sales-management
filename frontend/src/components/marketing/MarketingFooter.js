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
              Structured inventory tracking, point-of-sale checkout, vendor purchasing, business reports, multi-user registration and real-time business performance in one unified platform. Simply all your business operations with StockPro.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="sp-footer-col-title">HOME</h3>
            <ul className="sp-footer-links">
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
              <li>
                <MarketingLink href="/contact" className="sp-footer-link">
                  Contact
                </MarketingLink>
              </li>
              <li>
                <MarketingLink href="/pricing#faq" className="sp-footer-link">
                  FAQs
                </MarketingLink>
              </li>
            </ul>
          </div>


          {/* Account */}
          <div>
            <h3 className="sp-footer-col-title">ACCOUNT</h3>
            <div className="sp-footer-btn-group">
              <MarketingLink href="/login" className="sp-footer-btn sp-footer-btn-login" activeClassName="">
                Login
              </MarketingLink>
              <MarketingLink href="/register" className="sp-footer-btn sp-footer-btn-register" activeClassName="">
                Register Your Business
              </MarketingLink>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="sp-footer-bottom">
          <p className="sp-footer-copyright">
            &copy; 2026 StockPro. All rights reserved.
          </p>
          <div className="sp-footer-bottom-links">
            <MarketingLink href="/pricing#faq" className="sp-footer-bottom-link">
              Terms and Conditions
            </MarketingLink>
            <MarketingLink href="/login" className="sp-footer-bottom-link">
              Privacy Policy
            </MarketingLink>
          </div>
        </div>
      </div>
    </footer>
  );
}
