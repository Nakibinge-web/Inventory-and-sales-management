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

const EXTENDED_CAPABILITIES = [
  {
    index: '07',
    title: 'Stock Movements',
    desc: 'Audit stock ins, outs & adjustments',
  },
  {
    index: '08',
    title: 'Reports & Analytics',
    desc: 'Profit insights, CSV exports & auto reports',
  },
  {
    index: '09',
    title: 'Customers',
    desc: 'Manage client profiles & active status',
  },
  {
    index: '10',
    title: 'Suppliers',
    desc: 'Organise vendor contacts & addresses',
  },
  {
    index: '11',
    title: 'AI Assistant',
    desc: 'Ask business questions & forecast trends',
  },
  {
    index: '12',
    title: 'System Settings',
    desc: 'Business info, contacts & billing plans',
  },
];

const HOW_IT_WORKS_PRIMARY_OVERRIDES = {
  '06': {
    index: '06',
    title: 'Users Control',
    desc: 'Manage staff accounts, roles & permissions',
  },
};

const TrustStrip = forwardRef(function TrustStrip(
  { activeId = '01', onSelect, showExtendedRow = false, className = '' },
  ref
) {
  const primaryRow = showExtendedRow
    ? CAPABILITIES.map((item) => HOW_IT_WORKS_PRIMARY_OVERRIDES[item.index] || item)
    : CAPABILITIES;
  const rows = showExtendedRow ? [primaryRow, EXTENDED_CAPABILITIES] : [primaryRow];

  const renderTab = (item) => {
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
  };

  return (
    <section ref={ref} className={`sp-capability-strip ${className}`} aria-label="System Specifications">
      <div className="sp-container">
        <div className="sp-spec-rows" role="tablist" data-aos="fade-up">
          {rows.map((rowItems, rowIndex) => (
            <div
              key={rowIndex}
              className={`sp-spec-bar ${rowIndex > 0 ? 'sp-spec-bar-secondary' : ''}`}
            >
              {rowItems.map(renderTab)}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

export default TrustStrip;

