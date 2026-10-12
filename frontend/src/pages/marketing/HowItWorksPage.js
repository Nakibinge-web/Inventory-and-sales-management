import React, { useState, useRef, useEffect } from 'react';
import MarketingHeader from '../../components/marketing/MarketingHeader';
import MarketingFooter from '../../components/marketing/MarketingFooter';
import CTASection from '../../components/marketing/CTASection';
import QuickStartSteps from '../../components/marketing/QuickStartSteps';
import TrustStrip from '../../components/marketing/TrustStrip';
import { GUIDE_FEATURES } from '../../components/marketing/FeatureShowcase';
import { usePageMeta } from '../../utils/seo';

export default function HowItWorksPage() {
  // By default, 01 inventory is seen by the user
  const [activeFeatureId, setActiveFeatureId] = useState('01');
  const [prevFeatureId, setPrevFeatureId] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [viewportMinHeight, setViewportMinHeight] = useState(null);

  const viewportRef = useRef(null);
  const transitionTimerRef = useRef(null);

  usePageMeta(
    'How StockPro Works — Step-by-Step Business Guide',
    'Follow the 4 simple start steps and explore StockPro capabilities from real-time inventory and POS counter checkout to supplier procurement, customer accounts, and daily reporting.'
  );

  const currentFeature = GUIDE_FEATURES.find((f) => f.id === activeFeatureId) || GUIDE_FEATURES[0];
  const prevFeature = prevFeatureId ? GUIDE_FEATURES.find((f) => f.id === prevFeatureId) : null;

  // When a nav item is clicked: slide upward and overlay existing section
  const handleSelectFeature = (id) => {
    if (id === activeFeatureId) return;

    // Capture current card height so container doesn't jump during animation
    if (viewportRef.current) {
      setViewportMinHeight(viewportRef.current.offsetHeight);
    }

    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
    }

    setPrevFeatureId(activeFeatureId);
    setActiveFeatureId(id);
    setIsTransitioning(true);

    transitionTimerRef.current = setTimeout(() => {
      setIsTransitioning(false);
      setPrevFeatureId(null);
      setViewportMinHeight(null);
    }, 520);
  };

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  const renderFeatureContent = (feature) => {
    const IconComp = feature.icon;
    return (
      <div className="sp-container">
        <div className="sp-guide-card-content">
          {/* Eyebrow */}
          <div className="sp-editorial-eyebrow">
            <IconComp size={14} />
            <span>{feature.eyebrow}</span>
          </div>

          {/* Title */}
          <h2 className="sp-editorial-title">{feature.title}</h2>

          {/* Description */}
          <p className="sp-editorial-body">{feature.desc}</p>

          {/* Subheading: How to use [Feature] Step-by-Step */}
          <h3 className="sp-guide-step-subheading">{feature.subheading}</h3>

          {/* 2x2 Grid of Step Cards */}
          <div className="sp-guide-steps-grid">
            {feature.steps.map((step) => (
              <div key={step.num} className="sp-guide-step-card">
                <div className="sp-guide-step-badge">STEP {step.num}</div>
                <h4 className="sp-guide-step-title">{step.title}</h4>
                <p className="sp-guide-step-text">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="marketing-root">
      <MarketingHeader />

      <main id="main-content">
        {/* First Section: Four Simple Steps to Start Using the Software */}
        <QuickStartSteps
          ctaText="Explore StockPro Guide"
          ctaHref="#stockpro-guide"
          secondaryCtaText="Get Started Free"
          secondaryCtaHref="/register"
        />

        {/* StockPro Guide: Step-by-Step Feature Walkthrough */}
        <section
          id="stockpro-guide"
          className="sp-section sp-section-soft"
          style={{ paddingTop: 72, paddingBottom: 0, scrollMarginTop: 'calc(var(--sp-header-height, 72px) + 20px)' }}
          aria-label="StockPro Guide — Step-by-Step Feature Walkthrough"
        >
          <div className="sp-container">
            <div className="sp-guide-header">
              <div className="sp-guide-eyebrow">
                STEP-BY-STEP FEATURE WALKTHROUGH
              </div>
              <h2 className="sp-guide-title">
                StockPro Guide
              </h2>
              <p className="sp-guide-desc">
                This is the guide to show you the different features that StockPro has and how to use them.
              </p>
            </div>
          </div>

          {/* Navigation Section */}
          <TrustStrip
            activeId={activeFeatureId}
            onSelect={handleSelectFeature}
          />

          {/* Card Viewport: only ONE section shown at a time */}
          <div
            ref={viewportRef}
            className="sp-guide-card-viewport"
            style={{ minHeight: viewportMinHeight ? `${viewportMinHeight}px` : undefined }}
          >
            {/* Outgoing Section (sits underneath while incoming slides up) */}
            {prevFeature && (
              <div className="sp-guide-sheet sp-guide-sheet-outgoing" aria-hidden="true">
                {renderFeatureContent(prevFeature)}
              </div>
            )}

            {/* Incoming / Active Section */}
            <div
              key={activeFeatureId}
              className={`sp-guide-sheet sp-guide-sheet-incoming ${isTransitioning ? 'anim-slide-up' : ''}`}
            >
              {renderFeatureContent(currentFeature)}
            </div>
          </div>
        </section>

        {/* Strategic Call to Action directly below */}
        <CTASection
          eyebrow="READY TO OPERATE"
          title="See how simple business control can be."
          subtitle="Set up your store today and start ringing up transactions with real-time inventory precision."
          primaryCtaText="Register Your Business"
          primaryCtaHref="/register"
          secondaryCtaText="View Pricing Plans"
          secondaryCtaHref="/pricing"
        />
      </main>

      <MarketingFooter />
    </div>
  );
}


