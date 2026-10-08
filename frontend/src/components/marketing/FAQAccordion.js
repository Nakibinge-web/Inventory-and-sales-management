import React, { useState } from 'react';
import SectionHeading from './SectionHeading';
import { ChevronDownIcon } from './Icons';

const DEFAULT_FAQS = [
  {
    q: 'Can I create an account and start managing my business immediately?',
    a: 'Yes. When you register on StockPro, an isolated business tenant workspace is immediately configured. You can upload your business logo, configure currency and contact details, and begin importing your product catalog right away.',
  },
  {
    q: 'Can multiple employees use the system at the same time?',
    a: 'Yes. StockPro supports multi-user concurrent access. Cashiers can ring up sales on different registers simultaneously while managers record incoming supplier deliveries and owners review real-time revenue reports.',
  },
  {
    q: 'How does role-based access control and security work?',
    a: 'StockPro features built-in roles including Owner, Admin, Manager, and Cashier. In addition, owners can assign granular permissions (such as restricting cashiers strictly to the POS register while preventing them from editing product cost prices or viewing full financial statements).',
  },
  {
    q: 'Does the system automatically update inventory when sales take place?',
    a: 'Yes. As soon as a cashier completes a sale on the POS register, stock quantities decrement in real time. If a product drops below its configured minimum stock threshold, a low-stock alert is triggered on the dashboard.',
  },
  {
    q: 'Can I record supplier purchases and track vendor balances?',
    a: 'Yes. You can manage a directory of suppliers, create purchase orders, and record received stock along with unit purchase costs. When purchases are logged, inventory quantities automatically increase and financial reports update your cost of goods sold.',
  },
  {
    q: 'Can I manage customer accounts and generate sales receipts or invoices?',
    a: 'Yes. StockPro lets you save customer contact information and associate sales with specific clients. You can print thermal receipts directly at checkout or generate proforma and tax invoices for wholesale clients.',
  },
  {
    q: 'Is my business data completely separated from other businesses?',
    a: 'Yes. StockPro is architected with strict multi-tenant data isolation. Every database query enforces tenant scoping, ensuring no other company can ever access, query, or view your inventory, sales, customers, or financial records.',
  },
  {
    q: 'What financial and operational reports does the system provide?',
    a: 'You can generate daily sales reconciliations, weekly performance summaries, monthly revenue versus expenditure reports, and yearly trend analysis. Reports can be exported or printed for accounting review.',
  },
  {
    q: 'Can I change my subscription plan as my business expands?',
    a: 'Yes. You can switch between Starter and Business tiers or upgrade to custom Enterprise setups anytime as your item catalog and team size grow.',
  },
];

export default function FAQAccordion({ items = DEFAULT_FAQS, title = 'Frequently Asked Questions', subtitle = 'Clear answers about how StockPro manages inventory, users, and multi-tenant security.' }) {
  const [openIndex, setOpenIndex] = useState(0);

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <section id="faq" className="sp-section sp-section-soft" aria-labelledby="faq-section-heading">
      <div className="sp-container">
        <SectionHeading
          id="faq-section-heading"
          eyebrow="QUESTIONS &amp; ANSWERS"
          title={title}
          subtitle={subtitle}
          align="center"
        />

        <div className="sp-faq-container" role="presentation">
          {items.map((item, index) => {
            const isOpen = openIndex === index;
            const headingId = `faq-h-${index}`;
            const panelId = `faq-p-${index}`;

            return (
              <div key={index} className="sp-faq-item">
                <button
                  type="button"
                  id={headingId}
                  className="sp-faq-button"
                  onClick={() => toggle(index)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                >
                  <span>{item.q}</span>
                  <span className={`sp-faq-chevron ${isOpen ? 'open' : ''}`} aria-hidden="true">
                    <ChevronDownIcon size={18} />
                  </span>
                </button>
                {isOpen && (
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={headingId}
                    className="sp-faq-answer"
                  >
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
