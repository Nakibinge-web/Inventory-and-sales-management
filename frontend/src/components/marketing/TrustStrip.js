import React, { forwardRef } from 'react';

const CAPABILITIES = [
  {
    index: '01',
    title: 'Products',
    desc: 'Stock Quantity, Low level reorder alerts & Product prices',
  },
  {
    index: '02',
    title: 'Point of Sale',
    desc: 'Record every sale & Receipts',
  },
  {
    index: '03',
    title: 'Categories',
    desc: 'Organise your products into groups',
  },
  {
    index: '04',
    title: 'Sales',
    desc: 'View all your Sales history with receipts',
  },
  {
    index: '05',
    title: 'Purchases',
    desc: 'Record all business purchases',
  },
  {
    index: '06',
    title: 'Team Access',
    desc: 'Owner, manager & cashier role controls',
  },
];

const TrustStrip = forwardRef(function TrustStrip({ activeId = '01', onSelect, className = '' }, ref) {
  return (
    <section ref={ref} className={`sp-capability-strip ${className}`} aria-label="System Specifications">
      <div className="sp-container">
        <div className="sp-spec-bar" role="tablist" data-aos="fade-up">
          {CAPABILITIES.map((item) => {
            const isActive = activeId === item.index;
            return (
              <button
                key={item.index}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onSelect && onSelect(item.index)}
                className={`sp-spec-col ${isActive ? 'active' : ''}`}
              >
                <span className="sp-spec-index sp-num">{item.index}</span>
                <h3 className="sp-spec-title">{item.title}</h3>
                <p className="sp-spec-desc">{item.desc}</p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
});

export default TrustStrip;

