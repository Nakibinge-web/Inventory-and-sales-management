import React, { useState, useEffect, useRef } from 'react';
import MarketingHeader from '../../components/marketing/MarketingHeader';
import MarketingFooter from '../../components/marketing/MarketingFooter';
import ProductStatement from '../../components/marketing/ProductStatement';
import TrustStrip from '../../components/marketing/TrustStrip';
import FeatureShowcase from '../../components/marketing/FeatureShowcase';
import WhyStockPro from '../../components/marketing/WhyStockPro';
import WhoNeedsStock from '../../components/marketing/WhoNeedsStock';
import QuickStartSteps from '../../components/marketing/QuickStartSteps';
import PricingSection from '../../components/marketing/PricingSection';
import CTASection from '../../components/marketing/CTASection';
import { MarketingLink } from '../../utils/navigation';
import { usePageMeta } from '../../utils/seo';
import { ArrowRightIcon, FaCheckIcon } from '../../components/marketing/Icons';
import heroCutoutImg from '../../assets/man using phone.png';

export default function LandingPage() {
  const [activeCapability, setActiveCapability] = useState('01');
  const heroRef = useRef(null);

  usePageMeta(
    'StockPro — Inventory & Sales Management System',
    'Run your inventory, sales, purchases, and staff permissions from one unified business control system. Built for modern retail and wholesale operations.'
  );

  // Dynamic depth & scroll tracking for sticky hero
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (heroRef.current) {
            const scrollY = window.pageYOffset || document.documentElement.scrollTop;
            const heroHeight = heroRef.current.offsetHeight || 620;
            // Calculate progress: 0 when at top, 1 when overlay sheet reaches header
            const progress = Math.min(1, Math.max(0, scrollY / Math.max(heroHeight * 0.75, 1)));
            heroRef.current.style.setProperty('--hero-progress', progress.toFixed(4));
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="marketing-root">
      {/* Global Header */}
      <MarketingHeader />

      <main id="main-content">
        {/* Sticky Hero Section */}
        <section
          ref={heroRef}
          className="sp-hero sp-hero-sticky"
          aria-labelledby="hero-heading"
        >
          {/* Subtle depth scrim overlay that dims hero as the sheet overlays it */}
          <div className="sp-hero-scrim" aria-hidden="true" />

          <div className="sp-hero-inner">
            <div className="sp-container">
              <div className="sp-hero-grid">
                {/* Left Column: Headline & Action */}
                <div className="sp-hero-content">
                  <h1 id="hero-heading" className="sp-hero-title">
                    <span className="sp-hero-title-nowrap">Manage Your Business</span>
                    <br className="sp-hero-title-br" />
                    {' '}The Digital Way
                  </h1>

                  <p className="sp-hero-desc">
                    The all in one software for managing your business. Sell faster, manage stock, sales, purchases, and your business staff from one reliable system. Prevent stockouts and know your true daily performance.
                  </p>

                  <div className="sp-hero-ctas">
                    <MarketingLink href="/register" className="sp-btn sp-btn-primary sp-btn-lg">
                      <span>Get Started</span>
                      <ArrowRightIcon size={16} />
                    </MarketingLink>
                    <MarketingLink href="/how-it-works" className="sp-btn sp-btn-secondary sp-btn-lg">
                      See How It Works
                    </MarketingLink>
                  </div>

                  <div className="sp-hero-reassurances">
                    <span className="sp-reassurance-item">
                      <span className="sp-reassurance-icon"><FaCheckIcon size={13} /></span>
                      <span>Full Business Management </span>
                    </span>
                    <span className="sp-reassurance-item">
                      <span className="sp-reassurance-icon"><FaCheckIcon size={13} /></span>
                      <span> Instant Business Setup</span>
                    </span>
                    <span className="sp-reassurance-item">
                      <span className="sp-reassurance-icon"><FaCheckIcon size={13} /></span>
                      <span>Zero Credit Card Required</span>
                    </span>
                  </div>
                </div>

                {/* Right Column: Store Owner Image */}
                <div className="sp-hero-image-wrap">
                  <img
                    src={heroCutoutImg}
                    alt="Store owner managing inventory and sales on his smartphone"
                    className="sp-hero-image"
                    loading="eager"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Scroll-Over Overlay Sheet (Slides Upward and Overlays the Sticky Hero) */}
        <div id="sp-overlay-sheet" className="sp-hero-overlay-sheet">
          {/* Editorial Product Statement */}
          <ProductStatement />

          {/* Horizontal Capability Specification Strip */}
          <TrustStrip activeId={activeCapability} onSelect={setActiveCapability} />

          {/* Dynamic Capability Information (Features) */}
          <FeatureShowcase activeId={activeCapability} />

          {/* How Stockpro helps to simplify your business */}
          <WhyStockPro />

          {/* Who needs stock? */}
          <WhoNeedsStock />

          {/* Four simple steps to start using the software */}
          <QuickStartSteps />

          {/* Pricing Plans Section (4 Cards in one row) */}
          <PricingSection />

          {/* Strategic Call to Action */}
          <CTASection
            eyebrow="GET STARTED TODAY"
            title="Take control of your business operations."
            subtitle="Join growing merchants and wholesalers who manage stock, sales, and purchases seamlessly with StockPro."
            primaryCtaText="Register Your Business"
            primaryCtaHref="/register"
            secondaryCtaText="Explore Pricing"
            secondaryCtaHref="/pricing"
          />
        </div>
      </main>

      {/* Global Footer */}
      <MarketingFooter />
    </div>
  );
}
