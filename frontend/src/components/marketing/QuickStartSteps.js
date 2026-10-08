import React from 'react';
import { MarketingLink } from '../../utils/navigation';
import { ArrowRightIcon, FaArrowRightIcon } from './Icons';

const STEPS = [
  {
    step: '1',
    label: 'STEP 01',
    title: 'Create Your Business Account',
    desc: 'Sign up in under 1 minute with your business details. Zero setup fees or credit card required.',
  },
  {
    step: '2',
    label: 'STEP 02',
    title: 'Add Your Products and Stock levels',
    desc: 'Quickly enter items or upload an Excel catalog. Set buying prices, selling prices, and reorder levels for your products',
  },
  {
    step: '3',
    label: 'STEP 03',
    title: 'Start Selling using the StockPro POS',
    desc: 'Make sales at the POS, store clean printable receipts and track your daily profit margin in real time',
  },
  {
    step: '4',
    label: 'STEP 04',
    title: 'Track your business growth',
    desc: 'With the reports, analytics and insights, you can see how your business is performing financially.',
  },
];

export default function QuickStartSteps() {
  return (
    <section className="sp-steps-section" aria-labelledby="steps-heading">
      <div className="sp-container">
        {/* Section Heading */}
        <div className="sp-steps-header">
          <div className="sp-steps-eyebrow">
            GET STARTED IN MINUTES
          </div>

          <h2 id="steps-heading" className="sp-steps-title">
            Four simple steps to start using the software
          </h2>

          <p className="sp-steps-desc">
            No complex hardware installations, lengthy onboarding, or tech expertise required. Get your store running smoothly in less than 10 minutes.
          </p>
        </div>

        {/* 1--------->2---------->3------------->4 Flow */}
        <div className="sp-steps-flow">
          {STEPS.map((item, index) => (
            <React.Fragment key={item.step}>
              <div className="sp-step-card">
                {/* Number Badge */}
                <div className="sp-step-badge-wrap">
                  <div className="sp-step-number-badge">
                    <span>{item.step}</span>
                  </div>
                  <span className="sp-step-label">{item.label}</span>
                </div>

                <h3 className="sp-step-card-title">{item.title}</h3>
                <p className="sp-step-card-desc">{item.desc}</p>
              </div>

              {/* Connector Arrow (Rendered between steps 1-2, 2-3, 3-4) */}
              {index < STEPS.length - 1 && (
                <div className="sp-step-connector" aria-hidden="true">
                  <FaArrowRightIcon size={20} className="sp-step-arrow-icon" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Action Button: See how more features work */}
        <div className="sp-steps-cta-wrap">
          <MarketingLink href="/how-it-works" className="sp-btn sp-btn-primary sp-btn-lg sp-steps-btn">
            <span>See how more features work</span>
            <ArrowRightIcon size={16} />
          </MarketingLink>
        </div>
      </div>
    </section>
  );
}
