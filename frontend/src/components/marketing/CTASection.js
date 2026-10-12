import React from 'react';
import { MarketingLink } from '../../utils/navigation';
import { ArrowRightIcon, CheckIcon } from './Icons';

export default function CTASection({
  eyebrow = 'TAKE TOTAL CONTROL',
  title = 'Ready to run your inventory and sales with confidence?',
  subtitle = 'Create your business account in less than two minutes. Zero hardware lock-in. Experience structured stock management, fast POS checkout, and verified daily audits.',
  primaryCtaText = 'Register Your Business',
  primaryCtaHref = '/register',
  secondaryCtaText = 'Talk to Our Team',
  secondaryCtaHref = '/contact',
}) {
  return (
    <section className="sp-section sp-cta-section" aria-label="Call to Action">
      <div className="sp-container">
        <div className="sp-cta-card">
          {/* Left Column: High-Conversion Copy & Actions */}
          <div className="sp-cta-content">
            {eyebrow && (
              <div className="sp-cta-eyebrow">
                {eyebrow}
              </div>
            )}

            <h2 className="sp-cta-title">
              {title}
            </h2>

            <p className="sp-cta-subtitle">
              {subtitle}
            </p>

            {/* Quick Proof Feature Bullets */}
            <div className="sp-cta-features">
              <div className="sp-cta-feature-item">
                <div className="sp-cta-check">
                  <CheckIcon size={13} />
                </div>
                <span>Works on Phone, Tablet & PC</span>
              </div>
              <div className="sp-cta-feature-item">
                <div className="sp-cta-check">
                  <CheckIcon size={13} />
                </div>
                <span>Multi-User account registration</span>
              </div>
              <div className="sp-cta-feature-item">
                <div className="sp-cta-check">
                  <CheckIcon size={13} />
                </div>
                <span>No Credit Card Required</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="sp-cta-actions">
              <MarketingLink href={primaryCtaHref} className="sp-btn sp-btn-accent sp-btn-lg sp-cta-btn-main">
                <span>{primaryCtaText}</span>
                <ArrowRightIcon size={16} />
              </MarketingLink>

              <MarketingLink href={secondaryCtaHref} className="sp-btn sp-btn-secondary-inverted sp-btn-lg sp-cta-btn-secondary">
                <span>{secondaryCtaText}</span>
              </MarketingLink>
            </div>
          </div>

          {/* Right Column: Clean Operational Assurance Panel (Non-3D) */}
          <div className="sp-cta-aside">
            <div className="sp-cta-aside-card">
              <div className="sp-cta-aside-tag">RELIABILITY & SPEED</div>
              <h3 className="sp-cta-aside-title">Enterprise precision for every business</h3>

              <div className="sp-cta-aside-metrics">
                <div className="sp-cta-aside-metric">
                  <span className="sp-cta-metric-val">&lt; 2 min</span>
                  <span className="sp-cta-metric-lbl">Account setup time</span>
                </div>
                <div className="sp-cta-aside-metric">
                  <span className="sp-cta-metric-val">100%</span>
                  <span className="sp-cta-metric-lbl">Real-time stock sync</span>
                </div>
                <div className="sp-cta-aside-metric">
                  <span className="sp-cta-metric-val">0 UGX</span>
                  <span className="sp-cta-metric-lbl">Free 14-day access</span>
                </div>
                <div className="sp-cta-aside-metric">
                  <span className="sp-cta-metric-val">Any Device</span>
                  <span className="sp-cta-metric-lbl">Web, tablet & mobile</span>
                </div>
              </div>

              <div className="sp-cta-aside-bullets">
                <div className="sp-cta-aside-bullet">
                  <div className="sp-cta-check">
                    <CheckIcon size={11} />
                  </div>
                  <span>Instant barcode scanner &amp; thermal receipt printer support</span>
                </div>
                <div className="sp-cta-aside-bullet">
                  <div className="sp-cta-check">
                    <CheckIcon size={11} />
                  </div>
                  <span>Automatic low-stock alerts &amp; threshold reorders</span>
                </div>
                <div className="sp-cta-aside-bullet">
                  <div className="sp-cta-check">
                    <CheckIcon size={11} />
                  </div>
                  <span>Secure role permissions for cashiers and managers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
