import React from 'react';

const CAPABILITIES = [
  {
    index: '01',
    title: 'Inventory',
    desc: 'Catalog, auto-SKUs & threshold alerts',
  },
  {
    index: '02',
    title: 'Point of Sale',
    desc: 'Cashier checkout & thermal receipts',
  },
  {
    index: '03',
    title: 'Purchases',
    desc: 'Supplier orders & vendor cost tracking',
  },
  {
    index: '04',
    title: 'Customers',
    desc: 'Client profiles & transaction ledgers',
  },
  {
    index: '05',
    title: 'Reports',
    desc: 'Daily audits, margins & cash totals',
  },
  {
    index: '06',
    title: 'Team Access',
    desc: 'Owner, manager & cashier role controls',
  },
];

export default function TrustStrip({ activeId = '01', onSelect }) {
  return (
    <section className="sp-capability-strip" aria-label="System Specifications">
      <div className="sp-container">
        <div className="sp-spec-bar" role="tablist">
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
}
